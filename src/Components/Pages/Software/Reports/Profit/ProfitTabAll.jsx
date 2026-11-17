import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaChartLine } from 'react-icons/fa';
import ProfitSalesWise from './ProfitSalesWise';
import ProfitIncome from './ProfitIncome';
import ProfitExpense from './ProfitExpense';
import ProfitRouteExpense from './ProfitRouteExpense';
import ProfitOthers from './ProfitOthers';
import { useClientAuth } from '../../../../../hooks/ClientAuthContext';
import { hasAction } from '../../../../../hooks/permissionConfig';
import TabBar from '../../../../../hooks/TabBar';

const TAB_MODULE = {
    profitsaleswise: 'profit_sales_wise',
    profitincome: 'profit_income',
    profitexpense: 'profit_expense',
    profitrouteexpense: 'profit_route_expense',
    profitothers: 'profit_others',
};

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
    const { clientUser } = useClientAuth();
    const canView = (tabKey) => !clientUser?.isStaff || hasAction(clientUser?.permissions, TAB_MODULE[tabKey], 'get');
    const visibleTabs = TABS.filter((t) => canView(t.key));
    const canSeeSummary = canView('profitsaleswise');
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

    const currentTab = visibleTabs.some((t) => t.key === activeTab) ? activeTab : (visibleTabs[0]?.key || '');

    const [netData, setNetData] = useState({ sales: [], batches: [], purchases: [], incomes: [], expenses: [], routeExpenses: [], damages: [] });

    const fetchNet = useCallback(async () => {
        const get = (u) => fetch(`http://localhost:5000/${u}`).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);
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

    const tabs = visibleTabs.map((t) => ({
        key: t.key,
        label: t.label,
        icon: t.icon,
        active: currentTab === t.key,
        onClick: () => setActiveTab(t.key),
    }));

    const cardBase = 'relative overflow-hidden rounded-2xl text-white px-4 py-3 sm:px-6 lg:min-w-[210px]';

    return (
        <div>
            <div className="max-w-[1700px] mx-auto px-3 sm:px-5 md:px-8 pt-3 sm:pt-5">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Total Profit (Sales Wise) */}
                    {canSeeSummary && (
                        <div
                            className={`order-1 flex-1 lg:flex-none ${cardBase} bg-gradient-to-br ${isSalesPositive ? 'from-brand-500 to-brand-700' : 'from-rose-500 to-rose-700'
                                }`}
                        >
                            <div className="absolute -right-6 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                            <div className="relative">
                                <p className="text-[10px] sm:text-[11px] font-semibold text-white/80 uppercase tracking-wide">
                                    {isSalesPositive ? 'Total Profit' : 'Total Loss'}
                                </p>
                                <p className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight break-words">
                                    {isSalesPositive ? '' : '-'}৳ {fmt(Math.abs(net.salesProfit))}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tabs */}
                    <div className="order-3 lg:order-2 w-full lg:w-auto lg:flex-1 min-w-0">
                        <TabBar tabs={tabs} bare align="center" />
                    </div>

                    {/* Net Profit */}
                    {canSeeSummary && (
                        <div
                            className={`order-2 lg:order-3 flex-1 lg:flex-none ${cardBase} bg-gradient-to-br ${isPositive ? 'from-emerald-500 to-emerald-700' : 'from-rose-500 to-rose-700'
                                }`}
                        >
                            <div className="absolute -left-6 -top-8 w-24 h-24 bg-white/10 rounded-full"></div>
                            <div className="relative text-right">
                                <p className="text-[10px] sm:text-[11px] font-semibold text-white/80 uppercase tracking-wide">
                                    {isPositive ? 'Net Profit' : 'Net Loss'}
                                </p>
                                <p className="text-lg sm:text-2xl md:text-3xl font-extrabold tracking-tight leading-tight break-words">
                                    {isPositive ? '' : '-'}৳ {fmt(Math.abs(net.profit))}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {currentTab === 'profitsaleswise' && <ProfitSalesWise />}
            {currentTab === 'profitincome' && <ProfitIncome />}
            {currentTab === 'profitexpense' && <ProfitExpense />}
            {currentTab === 'profitrouteexpense' && <ProfitRouteExpense />}
            {currentTab === 'profitothers' && <ProfitOthers />}
        </div>
    );
};

export default ProfitTabAll;