// AcIncomeStatementRepo.jsx  (full file)

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FaPrint, FaFilter, FaRedo, FaSyncAlt } from 'react-icons/fa';

const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round(num(n) * 100) / 100;
const fmt = (n) => num(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ===== Date helpers =====
const parseDate = (d) => {
    if (!d) return 0;
    const s = String(d).trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]).getTime();
    const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
    const t = Date.parse(s);
    return !isNaN(t) ? t : 0;
};
const dayOnly = (ts) => {
    if (!ts) return 0;
    const dt = new Date(ts);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
};
const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ===== Cost / price helpers (Profit page er moto same) =====
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

// ===== UI parts =====
const SectionTitle = ({ children }) => (
    <div className="text-sm font-bold text-gray-700 mt-6 mb-2 px-1">{children}</div>
);

const COLORS = {
    indigo: 'text-indigo-600',
    violet: 'text-violet-600',
    emerald: 'text-emerald-600',
    rose: 'text-rose-600',
    amber: 'text-amber-600',
    gray: 'text-gray-800',
};

// inner = ভিতরের column (ছোট amount), outer = ডান পাশের মূল column
const Row = ({ label, labelClass = 'text-gray-800', inner, outer, innerColor = 'gray', outerColor = 'gray', highlight = '' }) => (
    <div className={`flex items-stretch border-b border-gray-100 last:border-b-0 text-sm font-bold hover:bg-indigo-50/40 transition ${highlight}`}>
        <div className={`flex-1 py-3.5 px-5 ${labelClass}`}>{label}</div>
        <div className={`w-40 md:w-56 py-3.5 px-5 text-right tabular-nums ${COLORS[innerColor]}`}>
            {inner !== undefined ? inner : ''}
        </div>
        <div className={`w-40 md:w-56 py-3.5 px-5 text-right tabular-nums border-l border-gray-100 ${COLORS[outerColor]}`}>
            {outer !== undefined ? outer : ''}
        </div>
    </div>
);

const Card = ({ children }) => (
    <div className="bg-white rounded-2xl shadow-lg border border-indigo-100 overflow-hidden">{children}</div>
);

const AcIncomeStatementRepo = () => {
    const [data, setData] = useState({
        sales: [], batches: [], purchases: [], incomes: [], expenses: [], routeExpenses: [], damages: [],
    });
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({ startDate: '', endDate: '' });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        const get = (u) =>
            fetch(`https://squirrel-peace-server.onrender.com/${u}`)
                .then((r) => r.json())
                .then((d) => (Array.isArray(d) ? d : []))
                .catch(() => []);
        const [sales, batches, purchases, incomes, expenses, routeExpenses, damages] = await Promise.all([
            get('sales'), get('stock-purchase'), get('purchase'), get('income'), get('expense'), get('routeExpense'), get('damage-return'),
        ]);
        setData({ sales, batches, purchases, incomes, expenses, routeExpenses, damages });
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    const report = useMemo(() => {
        const { sales, batches, purchases, incomes, expenses, routeExpenses, damages } = data;
        const st = filters.startDate ? dayOnly(parseDate(filters.startDate)) : 0;
        const en = filters.endDate ? dayOnly(parseDate(filters.endDate)) : 0;
        const inRange = (ts) => {
            const day = dayOnly(ts);
            if (st && day < st) return false;
            if (en && day > en) return false;
            return true;
        };

        // ===== Sales (Total Sell) & Cost =====
        const batchMap = new Map(batches.map((b) => [String(b._id), b]));
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const costCache = new Map();
        const unitCostOf = (b) => {
            const k = String(b._id);
            if (!costCache.has(k)) costCache.set(k, getBatchCostPerPcs(b, purchaseMap.get(String(b.purchaseId))));
            return costCache.get(k);
        };

        let totalSell = 0;
        let totalCost = 0;
        let orderCount = 0;

        sales.forEach((s) => {
            if (!(s.stockAllocations || []).length) return;

            const dateRaw = s.deliveryDate || s.orderDate || s.createdAt || '';
            const ts = (s.deliveredAt ? Date.parse(s.deliveredAt) : 0) || parseDate(dateRaw) || Date.parse(s.createdAt) || 0;
            const saleTs = parseDate(dateRaw) || ts;
            if (!inRange(saleTs)) return;

            let pcs = 0;
            let revenue = 0;
            let cost = 0;
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
            totalSell += r2(revenue);
            totalCost += r2(cost);
            orderCount += 1;
        });
        totalSell = r2(totalSell);
        totalCost = r2(totalCost);
        const grossProfit = r2(totalSell - totalCost);

        // ===== Others profit / loss (Approved damage return) =====
        const returns = [
            ...damages
                .filter((x) => x.status === 'Approved')
                .map((x) => ({
                    ts: parseDate(x.returnDate) || Date.parse(x.approvedAt || x.createdAt) || 0,
                    items: x.items || [],
                })),
            ...purchases
                .filter(
                    (x) =>
                        (x.receiveStatus === 'Received' || x.receiveStatus === 'Yes') &&
                        (x.damageItems || []).length > 0 &&
                        (num(x.damageAdjustmentAmount) > 0 || x.damageStatus === 'Approved')
                )
                .map((x) => ({
                    ts:
                        parseDate(x.receiveDate || x.purchaseDate) ||
                        Date.parse(x.damageApprovedAt || x.damageAt || x.createdAt) ||
                        0,
                    items: x.damageItems || [],
                })),
        ];
        let othersProfit = 0;
        let othersLoss = 0;
        returns.forEach((r) => {
            if (!inRange(r.ts)) return;
            r.items.forEach((it) => {
                let qty = 0;
                let stockTotal = 0;
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
        othersProfit = r2(othersProfit);
        othersLoss = r2(othersLoss);

        // ===== Income / Expense / Route Expense (Inside only) =====
        const sumInside = (list, typeKey) =>
            r2(
                list
                    .filter((i) => isInside(i[typeKey]))
                    .filter((i) => inRange(parseDate(i.date)))
                    .reduce((s, i) => s + num(i.amount), 0)
            );
        const incomeTotal = sumInside(incomes, 'incomeType');
        const expenseTotal = sumInside(expenses, 'expenseType');
        const routeTotal = sumInside(routeExpenses, 'routeExpenseType');

        const netProfit = r2(grossProfit + incomeTotal + othersProfit - expenseTotal - routeTotal - othersLoss);

        return {
            totalSell, totalCost, grossProfit, orderCount,
            incomeTotal, othersProfit, expenseTotal, routeTotal, othersLoss, netProfit,
        };
    }, [data, filters]);

    const handleFilterChange = (e) => setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    const handleClearFilters = () => setFilters({ startDate: '', endDate: '' });

    const isGrossPositive = report.grossProfit >= 0;
    const isNetPositive = report.netProfit >= 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    body { background: #fff !important; }
                }
            `}</style>

            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                                Income Statement
                            </h2>
                            <button
                                type="button"
                                onClick={() => window.print()}
                                title="Print"
                                className="no-print w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                            >
                                <FaPrint size={14} />
                            </button>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">Sales, cost, income ও expense এর পূর্ণ হিসাব</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchAll}
                        className="no-print flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold text-xs rounded-full transition cursor-pointer"
                    >
                        <FaSyncAlt size={11} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-blue-600">
                        <p className="text-sm text-white/80">Total Sell</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(report.totalSell)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-violet-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Cost</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(report.totalCost)}</p>
                    </div>
                    <div className={`rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br ${isGrossPositive ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'}`}>
                        <p className="text-sm text-white/80">{isGrossPositive ? 'Gross Profit' : 'Gross Loss'}</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(Math.abs(report.grossProfit))}</p>
                    </div>
                    <div className={`rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br ${isNetPositive ? 'from-emerald-500 via-teal-500 to-cyan-600' : 'from-rose-500 via-red-500 to-orange-600'}`}>
                        <p className="text-sm text-white/80">{isNetPositive ? 'Net Profit' : 'Net Loss'}</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(Math.abs(report.netProfit))}</p>
                    </div>
                </div>

                {/* Statement Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Statement</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {report.orderCount} sales order(s)
                        </span>
                    </div>

                    {/* Filter Panel */}
                    <div className="no-print bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                            >
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
                                >
                                    <input
                                        ref={startDateRef}
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select start date"
                                        value={displayFormattedDate(filters.startDate)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}
                                >
                                    <input
                                        ref={endDateRef}
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select end date"
                                        value={displayFormattedDate(filters.endDate)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-gray-500 font-medium">Loading...</div>
                    ) : (
                        <div>
                            {/* Sales */}
                            <SectionTitle>Sales</SectionTitle>
                            <Card>
                                <Row label="Total Sell" labelClass="text-indigo-700" outer={fmt(report.totalSell)} outerColor="indigo" highlight="bg-indigo-50/40" />
                            </Card>

                            {/* Cost of Sold Product */}
                            <SectionTitle>Cost of Sold Product</SectionTitle>
                            <Card>
                                <Row label="Total Cost" labelClass="text-violet-700" outer={fmt(report.totalCost)} outerColor="violet" highlight="bg-violet-50/40" />
                            </Card>

                            {/* Gross Profit */}
                            <div className="mt-6">
                                <Card>
                                    <Row
                                        label={isGrossPositive ? 'Gross Profit' : 'Gross Loss'}
                                        labelClass={isGrossPositive ? 'text-emerald-700' : 'text-rose-700'}
                                        outer={`${isGrossPositive ? '' : '-'}${fmt(Math.abs(report.grossProfit))}`}
                                        outerColor={isGrossPositive ? 'emerald' : 'rose'}
                                        highlight={isGrossPositive ? 'bg-emerald-50/60' : 'bg-rose-50/60'}
                                    />
                                </Card>
                            </div>

                            {/* Others Income & Expense */}
                            <SectionTitle>Others Income &amp; Expense</SectionTitle>
                            <Card>
                                <Row label="(+) Income" labelClass="text-emerald-700" inner={fmt(report.incomeTotal)} innerColor="emerald" />
                                {report.othersProfit > 0 && (
                                    <Row label="(+) Others Profit" labelClass="text-emerald-700" inner={fmt(report.othersProfit)} innerColor="emerald" />
                                )}
                                <Row label="(-) Expense" labelClass="text-rose-700" inner={`(${fmt(report.expenseTotal)})`} innerColor="rose" />
                                <Row label="(-) Route Expense" labelClass="text-amber-700" inner={`(${fmt(report.routeTotal)})`} innerColor="amber" />
                                {report.othersLoss > 0 && (
                                    <Row label="(-) Others Loss" labelClass="text-rose-700" inner={`(${fmt(report.othersLoss)})`} innerColor="rose" />
                                )}
                            </Card>

                            {/* Net Profit */}
                            <div className="mt-6">
                                <Card>
                                    <Row
                                        label={isNetPositive ? 'Net Profit' : 'Net Loss'}
                                        labelClass={isNetPositive ? 'text-emerald-700' : 'text-rose-700'}
                                        outer={`${isNetPositive ? '' : '-'}${fmt(Math.abs(report.netProfit))}`}
                                        outerColor={isNetPositive ? 'emerald' : 'rose'}
                                        highlight={isNetPositive ? 'bg-emerald-50/60' : 'bg-rose-50/60'}
                                    />
                                </Card>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcIncomeStatementRepo;