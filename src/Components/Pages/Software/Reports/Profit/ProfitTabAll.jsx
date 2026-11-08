import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaChartLine } from 'react-icons/fa';
import ProfitSalesWise from './ProfitSalesWise';
import ProfitIncome from './ProfitIncome';
import ProfitExpense from './ProfitExpense';
import ProfitRouteExpense from './ProfitRouteExpense';
import ProfitOthers from './ProfitOthers';

// ===== Net Profit helpers =====
const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round(num(n) * 100) / 100;
const fmt = (n) => num(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

const adjustedPay = (doc, sumSub) => {
    const ov =
        doc.overallDiscountValue !== undefined && doc.overallDiscountValue !== null && doc.overallDiscountValue !== ''
            ? num(doc.overallDiscountValue)
            : doc.overallDiscountType === 'percent'
                ? (sumSub * num(doc.overallDiscount)) / 100
                : num(doc.overallDiscount);
    const adj = num(doc.adjustment?.amount);
    return Math.max(sumSub - ov + (doc.adjustment?.type === '-' ? -adj : adj), 0);
};

const getPurchaseItemNetCost = (purchase, item) => {
    const sumSub = (purchase?.items || []).reduce((s, x) => s + num(x.itemTotal ?? x.subtotal), 0);
    if (!item || sumSub <= 0) return null;
    return r2((adjustedPay(purchase, sumSub) * num(item.itemTotal ?? item.subtotal)) / sumSub);
};

const getBatchCostPerPcs = (batch, purchase) => {
    if (!batch || batch.isFreeProduct) return 0;
    let netCost = num(batch.netCost);
    if (purchase) {
        const pIt = (purchase.items || []).find((x) => String(x.productId) === String(batch.productId));
        const nc = pIt ? getPurchaseItemNetCost(purchase, pIt) : null;
        if (nc !== null) netCost = nc;
    }
    const origPaid = num(batch.paidQty);
    return origPaid > 0 ? r2(netCost / origPaid) : 0;
};

const getSaleItemNetPricePerPcs = (sale, item) => {
    const sumSub = (sale?.items || []).reduce((s, x) => s + num(x.itemTotal ?? x.subtotal), 0);
    const paidQty = num(item?.totalPcs);
    if (!item || sumSub <= 0 || paidQty <= 0) return num(item?.sellPricePcs ?? item?.sellPrice);
    const net = (adjustedPay(sale, sumSub) * num(item.itemTotal ?? item.subtotal)) / sumSub;
    return r2(net / paidQty);
};

const getPool = (a) => a.pool || ((a.kind || 'main') === 'main' ? 'paid' : 'free');
const isInside = (v) => (v || 'Inside') === 'Inside';

const TABS = [
    { key: 'profitsaleswise', label: 'Sales Wise Profit', icon: FaChartLine },
    { key: 'profitincome', label: 'Income Net', icon: FaChartLine },
    { key: 'profitexpense', label: 'Expense Net', icon: FaChartLine },
    { key: 'profitrouteexpense', label: 'Route Expense Net', icon: FaChartLine },
    { key: 'profitothers', label: 'Others Profit', icon: FaChartLine },
];

const ProfitTabAll = () => {
    const [activeTab, setActiveTab] = useState(() => {
        try {
            return sessionStorage.getItem('profitTab') || 'profitsaleswise';
        } catch (e) {
            return 'profitsaleswise';
        }
    });

    useEffect(() => {
        try {
            sessionStorage.setItem('profitTab', activeTab);
        } catch (e) {
            // ignore
        }
    }, [activeTab]);

    const [netData, setNetData] = useState({ sales: [], batches: [], purchases: [], incomes: [], expenses: [], routeExpenses: [], damages: [] });

    const fetchNet = useCallback(async () => {
        const get = (u) => fetch(`https://squirrel-peace-server.onrender.com/${u}`).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);
        const [sales, batches, purchases, incomes, expenses, routeExpenses, damages] = await Promise.all([
            get('sales'), get('stock-purchase'), get('purchase'), get('income'), get('expense'), get('routeExpense'), get('damage-return'),
        ]);
        setNetData({ sales, batches, purchases, incomes, expenses, routeExpenses, damages });
    }, []);

    useEffect(() => {
        fetchNet();
    }, [fetchNet, activeTab]);

    const net = useMemo(() => {
        const { sales, batches, purchases, incomes, expenses, routeExpenses, damages } = netData;

        // Sales wise profit
        const batchMap = new Map(batches.map((b) => [String(b._id), b]));
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const costCache = new Map();
        const unitCostOf = (b) => {
            const k = String(b._id);
            if (!costCache.has(k)) costCache.set(k, getBatchCostPerPcs(b, purchaseMap.get(String(b.purchaseId))));
            return costCache.get(k);
        };
        let salesProfit = 0;
        sales.forEach((s) => {
            if (!(s.stockAllocations || []).length) return;
            let pcs = 0, revenue = 0, cost = 0;
            (s.stockAllocations || []).forEach((a) => {
                const q = Math.max(num(a.qty) - num(a.returned), 0);
                if (q <= 0) return;
                const b = batchMap.get(String(a.batchId));
                if ((a.kind || 'main') === 'main') {
                    const it = (s.items || []).find((x) => String(x.productId) === String(a.productId));
                    if (it) revenue += r2(getSaleItemNetPricePerPcs(s, it) * q);
                }
                if (b && getPool(a) === 'paid' && !b.isFreeProduct) cost += r2(unitCostOf(b) * q);
                pcs += q;
            });
            if (pcs <= 0) return;
            salesProfit += r2(r2(revenue) - r2(cost));
        });
        salesProfit = r2(salesProfit);

        // Others profit / loss (damage return)
        const returns = [
            ...damages.filter((x) => x.status === 'Approved').map((x) => x.items || []),
            ...purchases
                .filter((x) => (x.receiveStatus === 'Received' || x.receiveStatus === 'Yes') && (x.damageItems || []).length > 0 && (num(x.damageAdjustmentAmount) > 0 || x.damageStatus === 'Approved'))
                .map((x) => x.damageItems || []),
        ];
        let othersProfit = 0, othersLoss = 0;
        returns.forEach((items) => {
            items.forEach((it) => {
                let qty = 0, stockTotal = 0;
                (it.costBreakdown || []).forEach((l) => {
                    if (l.est) return;
                    qty += num(l.qty);
                    stockTotal += num(l.amount);
                });
                if (qty <= 0) return;
                const p = r2(r2(num(it.buyPrice) * qty) - r2(stockTotal));
                if (p > 0) othersProfit += p;
                else if (p < 0) othersLoss += Math.abs(p);
            });
        });

        const incomeTotal = incomes.filter((i) => isInside(i.incomeType)).reduce((s, i) => s + num(i.amount), 0);
        const expenseTotal = expenses.filter((i) => isInside(i.expenseType)).reduce((s, i) => s + num(i.amount), 0);
        const routeTotal = routeExpenses.filter((i) => isInside(i.routeExpenseType)).reduce((s, i) => s + num(i.amount), 0);

        const x = r2(salesProfit + incomeTotal + othersProfit);
        const y = r2(expenseTotal + routeTotal + othersLoss);
        return { x, y, profit: r2(x - y), salesProfit };
    }, [netData]);

    const isPositive = net.profit >= 0;
    const isSalesPositive = net.salesProfit >= 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
            <div className="max-w-[1700px] mx-auto px-4 md:px-6 pt-4 md:pt-6 flex flex-wrap items-center justify-between gap-4">
                {/* Total Profit (Sales Wise) */}
                <div
                    className={`relative overflow-hidden rounded-2xl shadow-xl px-6 py-3 min-w-[200px] text-white flex items-center justify-start bg-gradient-to-r ${isSalesPositive ? 'from-indigo-500 via-blue-500 to-sky-600' : 'from-rose-500 via-red-500 to-orange-600'
                        }`}
                >
                    <div className="absolute -right-6 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                    <div className="absolute right-10 -bottom-10 w-20 h-20 bg-white/10 rounded-full"></div>
                    <div className="relative w-full text-right">
                        <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wide">
                            {isSalesPositive ? 'Total Profit' : 'Total Loss'}
                        </p>
                        <p className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                            {isSalesPositive ? '' : '-'}৳ {fmt(Math.abs(net.salesProfit))}
                        </p>
                    </div>
                </div>

                <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                    {TABS.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200'
                                    : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'
                                    }`}
                            >
                                <Icon size={11} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Net Profit */}
                <div
                    className={`relative overflow-hidden rounded-2xl shadow-xl px-6 py-3 min-w-[200px] text-white flex items-center justify-end bg-gradient-to-r ${isPositive ? 'from-emerald-500 via-teal-500 to-cyan-600' : 'from-rose-500 via-red-500 to-orange-600'
                        }`}
                >
                    <div className="absolute -left-6 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                    <div className="absolute left-10 -bottom-10 w-20 h-20 bg-white/10 rounded-full"></div>
                    <div className="relative w-full text-right">
                        <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wide">
                            {isPositive ? 'Net Profit' : 'Net Loss'}
                        </p>
                        <p className="text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">
                            {isPositive ? '' : '-'}৳ {fmt(Math.abs(net.profit))}
                        </p>
                    </div>

                </div>
            </div>
            {activeTab === 'profitsaleswise' && <ProfitSalesWise />}
            {activeTab === 'profitincome' && <ProfitIncome />}
            {activeTab === 'profitexpense' && <ProfitExpense />}
            {activeTab === 'profitrouteexpense' && <ProfitRouteExpense />}
            {activeTab === 'profitothers' && <ProfitOthers />}
        </div>
    );
};

export default ProfitTabAll;