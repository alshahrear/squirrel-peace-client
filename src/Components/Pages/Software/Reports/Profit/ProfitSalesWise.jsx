import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaSyncAlt, FaChevronDown, FaChartLine } from 'react-icons/fa';
import { inputCls, labelCls, Pager, ComboBox, DateInput } from '../../Product/ProductUi';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => Number(v) || 0;
const RATE_OPTIONS = ['Over Rate', 'Under Rate', 'Level Rate'];

// ===== Cost / price helpers =====
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

// ===== Date helpers =====
const parseDate = (d) => {
    if (!d) return 0;
    const s = String(d).trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
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
const showDate = (ts, raw) => {
    if (!ts) return raw || 'N/A';
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const EMPTY_FILTERS = { startDate: '', endDate: '', invoiceNo: '', customer: '', sr: '', deliveredBy: '', result: '' };

const profitColor = (v) => (v >= 0 ? 'text-emerald-600' : 'text-rose-600');
const money = (v) => `${v < 0 ? '-' : ''}৳${fmt(Math.abs(v))}`;

const DirectPill = () => (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 text-[10px] font-bold whitespace-nowrap">
        Direct Sales
    </span>
);

const ProfitSalesWise = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openRows, setOpenRows] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(false);
    const [directOnly, setDirectOnly] = useState(false);
    const [rateFilter, setRateFilter] = useState([...RATE_OPTIONS]);
    const [isRateOpen, setIsRateOpen] = useState(false);
    const rateRef = useRef(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const get = (u) =>
                fetch(`http://localhost:5000/${u}`)
                    .then((r) => r.json())
                    .then((d) => (Array.isArray(d) ? d : []))
                    .catch(() => []);
            const [s, b, p, c] = await Promise.all([get('sales'), get('stock-purchase'), get('purchase'), get('customer')]);
            setSales(s);
            setBatches(b);
            setPurchases(p);
            setCustomers(c);
        } catch (error) {
            console.error('Error fetching profit data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        fetch('http://localhost:5000/user')
            .then((res) => res.json())
            .then((data) => setUsers(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching users:', error));
    }, []);

    useEffect(() => {
        const h = (e) => {
            if (rateRef.current && !rateRef.current.contains(e.target)) setIsRateOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // ===== Sales wise profit hisab =====
    const rows = useMemo(() => {
        const batchMap = new Map(batches.map((b) => [String(b._id), b]));
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const costCache = new Map();
        const unitCostOf = (b) => {
            const k = String(b._id);
            if (!costCache.has(k)) costCache.set(k, getBatchCostPerPcs(b, purchaseMap.get(String(b.purchaseId))));
            return costCache.get(k);
        };

        const out = [];
        sales.forEach((s) => {
            if (!(s.stockAllocations || []).length) return;
            let pcs = 0;
            let revenue = 0;
            let cost = 0;
            let overAcc = 0;
            let underAcc = 0;
            const prodMap = new Map();

            (s.stockAllocations || []).forEach((a) => {
                const net = Math.max(num(a.qty) - num(a.returned), 0);
                if (net <= 0) return;
                const b = batchMap.get(String(a.batchId));
                const kind = a.kind || 'main';

                let r = 0;
                let it = null;
                if (kind === 'main') {
                    it = (s.items || []).find((x) => String(x.productId) === String(a.productId));
                    if (it) r = r2(getSaleItemNetPricePerPcs(s, it) * net);
                }
                const c = b && getPool(a) === 'paid' && !b.isFreeProduct ? r2(unitCostOf(b) * net) : 0;

                pcs += net;
                revenue += r;
                cost += c;
                if (r > 0) {
                    const diff = r2(r - num(b?.sellPrice) * net);
                    overAcc += diff > 0 ? diff : 0;
                    underAcc += diff < 0 ? -diff : 0;
                }

                const pk = String(a.productId);
                if (!prodMap.has(pk)) {
                    const nameItem =
                        it ||
                        (s.items || []).find((x) => String(x.productId) === pk) ||
                        (s.freeItems || []).find((x) => String(x.productId) === pk);
                    prodMap.set(pk, {
                        key: pk,
                        name: nameItem?.productName || b?.productName || 'N/A',
                        pcs: 0,
                        revenue: 0,
                        cost: 0,
                        over: 0,
                        under: 0,
                    });
                }
                const g = prodMap.get(pk);
                g.pcs += net;
                g.revenue += r;
                g.cost += c;
                if (r > 0) {
                    const d2 = r2(r - num(b?.sellPrice) * net);
                    g.over += d2 > 0 ? d2 : 0;
                    g.under += d2 < 0 ? -d2 : 0;
                }
            });

            if (pcs <= 0) return;

            const dateRaw = s.deliveryDate || s.orderDate || s.createdAt || '';
            const ts = (s.deliveredAt ? Date.parse(s.deliveredAt) : 0) || parseDate(dateRaw) || Date.parse(s.createdAt) || 0;

            out.push({
                key: String(s._id),
                saleId: s._id,
                orderNo: s.invoiceNo || s.orderNo,
                customer: s.customer || 'N/A',
                sr: s.sr || '',
                deliveredBy: s.deliveredBy || '',
                directSales: s.directSales === true,
                over: r2(overAcc),
                under: r2(underAcc),
                dateRaw,
                ts,
                dayTs: dayOnly(parseDate(dateRaw) || ts),
                pcs,
                revenue: r2(revenue),
                cost: r2(cost),
                profit: r2(r2(revenue) - r2(cost)),
                products: Array.from(prodMap.values()).map((g) => ({
                    ...g,
                    revenue: r2(g.revenue),
                    cost: r2(g.cost),
                    over: r2(g.over),
                    under: r2(g.under),
                    profit: r2(g.revenue - g.cost),
                })),
            });
        });

        return out.sort((a, b) => b.ts - a.ts);
    }, [sales, batches, purchases]);

    // ===== Filter =====
    const filtered = useMemo(() => {
        const st = filters.startDate ? dayOnly(parseDate(filters.startDate)) : 0;
        const en = filters.endDate ? dayOnly(parseDate(filters.endDate)) : 0;
        const inv = filters.invoiceNo.trim().toLowerCase();
        const cu = filters.customer.trim().toLowerCase();
        const sr = filters.sr.trim().toLowerCase();
        const dl = filters.deliveredBy.trim().toLowerCase();
        return rows.filter((r) => {
            if (st && r.dayTs < st) return false;
            if (en && r.dayTs > en) return false;
            if (inv && !String(r.orderNo || '').toLowerCase().includes(inv)) return false;
            if (cu && !String(r.customer || '').toLowerCase().includes(cu)) return false;
            if (directOnly && !r.directSales) return false;
            if (sr && !String(r.sr || '').toLowerCase().includes(sr)) return false;
            if (dl && !String(r.deliveredBy || '').toLowerCase().includes(dl)) return false;
            if (rateFilter.length !== RATE_OPTIONS.length) {
                if (rateFilter.length === 0) return false;
                const isOver = r.over > 0;
                const isUnder = r.under > 0;
                const isLevel = !isOver && !isUnder;
                const ok =
                    (rateFilter.includes('Over Rate') && isOver) ||
                    (rateFilter.includes('Under Rate') && isUnder) ||
                    (rateFilter.includes('Level Rate') && isLevel);
                if (!ok) return false;
            }
            if (filters.result === 'profit' && r.profit < 0) return false;
            if (filters.result === 'loss' && r.profit >= 0) return false;
            return true;
        });
    }, [rows, filters, directOnly, rateFilter]);

    const totals = useMemo(() => {
        const t = { pcs: 0, cost: 0, revenue: 0, profit: 0, over: 0, under: 0 };
        filtered.forEach((r) => {
            t.pcs += r.pcs;
            t.cost += r.cost;
            t.revenue += r.revenue;
            t.profit += r.profit;
            t.over += r.over;
            t.under += r.under;
        });
        return { pcs: t.pcs, cost: r2(t.cost), revenue: r2(t.revenue), profit: r2(t.profit), over: r2(t.over), under: r2(t.under) };
    }, [filtered]);

    // ===== Pagination =====
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    // ===== Handlers =====
    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setFilter(e.target.name, e.target.value);
    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setDirectOnly(false);
        setRateFilter([...RATE_OPTIONS]);
        setIsRateOpen(false);
        setCurrentPage(1);
    };
    const handleToggleRate = (opt) => {
        setRateFilter((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
        setCurrentPage(1);
    };
    const toggleRow = (key) => setOpenRows((prev) => ({ ...prev, [key]: !prev[key] }));

    const activeCount =
        Object.values(filters).filter(Boolean).length + (directOnly ? 1 : 0) + (rateFilter.length !== RATE_OPTIONS.length ? 1 : 0);

    const customerOptions = customers
        .filter((c) => {
            const s = filters.customer.toLowerCase();
            const n = (c.businessName || c.name || '').toLowerCase();
            return n.includes(s) || (c.contactNumber || '').toLowerCase().includes(s);
        })
        .slice(0, 50)
        .map((c) => ({ key: c._id, title: c.businessName || c.name || '', sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', value: c }));

    const userOptions = (role, term) =>
        users
            .filter((u) => u.role === role && u.name?.toLowerCase().includes(term.toLowerCase()))
            .map((u) => ({ key: u._id, title: u.name, sub: '', value: u }));

    const summary = [
        { label: 'Net Sold', value: `${fmt(totals.pcs)} pcs`, cls: 'text-orange-600', bar: 'bg-orange-400' },
        { label: 'Total Cost', value: `৳${fmt(totals.cost)}`, cls: 'text-violet-600', bar: 'bg-violet-400' },
        { label: 'Total Sell', value: `৳${fmt(totals.revenue)}`, cls: 'text-brand-700', bar: 'bg-brand-500' },
        {
            label: totals.profit >= 0 ? 'Total Profit' : 'Total Loss',
            value: money(totals.profit),
            cls: profitColor(totals.profit),
            bar: totals.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500',
        },
    ];

    const toggleBtn = (r, isOpen) => (
        <button
            type="button"
            onClick={() => toggleRow(r.key)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold cursor-pointer whitespace-nowrap"
        >
            {r.products.length} product
            <FaChevronDown size={8} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
    );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                            <FaChartLine size={15} />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight">Sales Wise Profit</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">প্রতিটা sales order থেকে কত cost, কত sell আর কত profit হয়েছে</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchAll}
                        aria-label="Refresh"
                        className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <FaSyncAlt size={12} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
                    {summary.map((c) => (
                        <div key={c.label} className="relative bg-white rounded-2xl border border-slate-200 pl-4 pr-3 py-3 sm:py-4 overflow-hidden">
                            <span className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
                            <p className={`text-base sm:text-2xl font-extrabold mt-1 break-words leading-tight ${c.cls}`}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            aria-expanded={showFilters}
                            className="h-10 flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer lg:cursor-default"
                        >
                            <FaFilter className="text-brand-600" size={13} />
                            Filter & Search
                            {activeCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold">{activeCount}</span>
                            )}
                            <FaChevronDown size={10} className={`lg:hidden text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        >
                            <FaRedo size={11} /> Clear
                        </button>
                    </div>

                    <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-2 lg:grid-cols-4 gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}>
                        <div>
                            <span className={labelCls}>Start Date</span>
                            <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                        </div>
                        <div>
                            <span className={labelCls}>End Date</span>
                            <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label className={labelCls}>Invoice</label>
                                <label className="flex items-center gap-1 text-[11px] font-semibold text-teal-700 cursor-pointer select-none mb-1">
                                    <input
                                        type="checkbox"
                                        checked={directOnly}
                                        onChange={(e) => {
                                            setDirectOnly(e.target.checked);
                                            setCurrentPage(1);
                                        }}
                                        className="w-3.5 h-3.5 accent-teal-600 cursor-pointer"
                                    />
                                    Direct Sales
                                </label>
                            </div>
                            <input
                                type="text"
                                name="invoiceNo"
                                placeholder="Search invoice..."
                                value={filters.invoiceNo}
                                onChange={handleFilterChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <span className={labelCls}>Customer</span>
                            <ComboBox
                                value={filters.customer}
                                placeholder="Search or select customer..."
                                options={customerOptions}
                                emptyText="No customer found"
                                onType={(v) => setFilter('customer', v)}
                                onPick={(o) => setFilter('customer', o.value.businessName || o.value.name || '')}
                                onClear={() => setFilter('customer', '')}
                            />
                        </div>
                        <div>
                            <span className={labelCls}>SR</span>
                            <ComboBox
                                value={filters.sr}
                                placeholder="Search or select SR..."
                                options={userOptions('SR', filters.sr)}
                                emptyText="No SR found"
                                onType={(v) => setFilter('sr', v)}
                                onPick={(o) => setFilter('sr', o.value.name)}
                                onClear={() => setFilter('sr', '')}
                            />
                        </div>
                        <div>
                            <span className={labelCls}>Delivery Man</span>
                            <ComboBox
                                value={filters.deliveredBy}
                                placeholder="Search or select delivery man..."
                                options={userOptions('Delivery Man', filters.deliveredBy)}
                                emptyText="No delivery man found"
                                onType={(v) => setFilter('deliveredBy', v)}
                                onPick={(o) => setFilter('deliveredBy', o.value.name)}
                                onClear={() => setFilter('deliveredBy', '')}
                            />
                        </div>
                        <div className="relative" ref={rateRef}>
                            <span className={labelCls}>Rate</span>
                            <button
                                type="button"
                                onClick={() => setIsRateOpen((p) => !p)}
                                className={`${inputCls} flex items-center justify-between gap-2 text-left cursor-pointer`}
                            >
                                <span className="truncate">
                                    {rateFilter.length === RATE_OPTIONS.length ? 'All' : rateFilter.length === 0 ? 'None' : rateFilter.join(', ')}
                                </span>
                                <FaChevronDown size={10} className={`shrink-0 transition-transform ${isRateOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isRateOpen && (
                                <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg py-1">
                                    {RATE_OPTIONS.map((opt) => (
                                        <label
                                            key={opt}
                                            className="flex items-center gap-2.5 px-3 h-10 hover:bg-brand-50 cursor-pointer text-sm font-medium text-slate-700"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={rateFilter.includes(opt)}
                                                onChange={() => handleToggleRate(opt)}
                                                className="w-4 h-4 accent-brand-600 cursor-pointer"
                                            />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            <label className={labelCls}>Result</label>
                            <select name="result" value={filters.result} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                <option value="">All</option>
                                <option value="profit">Profit</option>
                                <option value="loss">Loss</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 px-1.5 pt-1.5 sm:p-0">
                        <h2 className="text-base font-semibold text-slate-800">Profit Records</h2>
                        <span className="bg-brand-50 text-brand-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                            {filtered.length} of {rows.length}
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">No profit record found!</div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {current.map((r) => {
                                    const isOpen = !!openRows[r.key];
                                    const amts = [
                                        ['Sold', `${fmt(r.pcs)} pcs`, 'text-orange-600'],
                                        ['Cost', `৳${fmt(r.cost)}`, 'text-violet-600'],
                                        ['Sell', `৳${fmt(r.revenue)}`, 'text-brand-700'],
                                        ['Over', `৳${fmt(r.over)}`, r.over > 0 ? 'text-emerald-600' : 'text-slate-400'],
                                        ['Under', `৳${fmt(r.under)}`, r.under > 0 ? 'text-rose-600' : 'text-slate-400'],
                                    ];
                                    return (
                                        <div key={r.key} className="relative rounded-xl border border-slate-200 bg-white pl-2.5 pr-1.5 py-1.5 shadow-sm">
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${r.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                            <div className="flex items-start gap-1.5">
                                                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <p className="font-bold text-[12.5px] text-slate-800 truncate leading-tight min-w-0">{r.customer}</p>
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/sales-details/${r.saleId}`)}
                                                            className="shrink-0 bg-brand-50 text-brand-700 px-1.5 py-px rounded-full text-[9.5px] font-bold leading-tight cursor-pointer"
                                                        >
                                                            #{r.orderNo}
                                                        </button>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Date: </span>
                                                        {showDate(r.ts, r.dateRaw)}
                                                    </p>
                                                    {r.directSales ? (
                                                        <div className="flex items-center gap-1.5 flex-wrap">
                                                            <DirectPill />
                                                            {toggleBtn(r, isOpen)}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                                <span className="uppercase text-slate-400 font-bold">SR: </span>
                                                                {r.sr || 'N/A'}
                                                                <span className="uppercase text-slate-400 font-bold ml-2">Del: </span>
                                                                {r.deliveredBy || 'N/A'}
                                                            </p>
                                                            <div>{toggleBtn(r, isOpen)}</div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="shrink-0 w-[112px] flex flex-col gap-px">
                                                    {amts.map(([l, v, c]) => (
                                                        <div key={l} className="flex items-center justify-between rounded bg-slate-50 px-1.5 leading-[14px]">
                                                            <span className="text-[8.5px] font-bold text-slate-400 uppercase">{l}</span>
                                                            <span className={`text-[10px] font-bold whitespace-nowrap ${c}`}>{v}</span>
                                                        </div>
                                                    ))}
                                                    <div className={`flex items-center justify-between rounded px-1.5 leading-[16px] ${r.profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                                                        <span className="text-[8.5px] font-bold text-slate-500 uppercase">{r.profit >= 0 ? 'Profit' : 'Loss'}</span>
                                                        <span className={`text-[10.5px] font-extrabold whitespace-nowrap ${profitColor(r.profit)}`}>{money(r.profit)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {isOpen && (
                                                <div className="mt-2 pt-2 border-t border-dashed border-slate-200 space-y-1.5">
                                                    {r.products.map((p) => (
                                                        <div key={p.key} className="rounded-lg bg-slate-50 px-2 py-1.5">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <p className="text-[11.5px] font-bold text-slate-700 truncate min-w-0">{p.name}</p>
                                                                <span className={`shrink-0 text-[11px] font-extrabold ${profitColor(p.profit)}`}>{money(p.profit)}</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5 text-[10px] font-semibold">
                                                                <span className="text-orange-600">{fmt(p.pcs)} pcs</span>
                                                                <span className="text-violet-600">Cost ৳{fmt(p.cost)}</span>
                                                                <span className="text-brand-700">Sell ৳{fmt(p.revenue)}</span>
                                                                <span className={p.over > 0 ? 'text-emerald-600' : 'text-slate-400'}>Over ৳{fmt(p.over)}</span>
                                                                <span className={p.under > 0 ? 'text-rose-600' : 'text-slate-400'}>Under ৳{fmt(p.under)}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Mobile total */}
                                <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2">
                                    <p className="text-[10px] font-bold uppercase text-brand-700 mb-1">Total ({filtered.length} orders)</p>
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] font-bold">
                                        <span className="flex justify-between"><span className="text-slate-500">Sold</span><span className="text-orange-600">{fmt(totals.pcs)} pcs</span></span>
                                        <span className="flex justify-between"><span className="text-slate-500">Cost</span><span className="text-violet-600">৳{fmt(totals.cost)}</span></span>
                                        <span className="flex justify-between"><span className="text-slate-500">Sell</span><span className="text-brand-700">৳{fmt(totals.revenue)}</span></span>
                                        <span className="flex justify-between"><span className="text-slate-500">Profit</span><span className={profitColor(totals.profit)}>{money(totals.profit)}</span></span>
                                        <span className="flex justify-between"><span className="text-slate-500">Over</span><span className={totals.over > 0 ? 'text-emerald-600' : 'text-slate-400'}>৳{fmt(totals.over)}</span></span>
                                        <span className="flex justify-between"><span className="text-slate-500">Under</span><span className={totals.under > 0 ? 'text-rose-600' : 'text-slate-400'}>৳{fmt(totals.under)}</span></span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[1100px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">
                                        <tr>
                                            <th className="px-3 py-3">#</th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">SR</th>
                                            <th className="px-3 py-3">Delivery Man</th>
                                            <th className="px-3 py-3 text-right">Net Sold</th>
                                            <th className="px-3 py-3 text-right">Cost</th>
                                            <th className="px-3 py-3 text-right">Sell</th>
                                            <th className="px-3 py-3 text-right">Over Rate</th>
                                            <th className="px-3 py-3 text-right">Under Rate</th>
                                            <th className="px-3 py-3 text-right">Profit</th>
                                        </tr>
                                    </thead>

                                    {current.map((r, i) => {
                                        const isOpen = !!openRows[r.key];
                                        return (
                                            <tbody key={r.key} className="border-t border-slate-100 text-slate-700">
                                                <tr className={isOpen ? 'bg-brand-50/50' : 'hover:bg-slate-50'}>
                                                    <td className="px-3 py-3 text-slate-400">{start + i + 1}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-slate-600">{showDate(r.ts, r.dateRaw)}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{r.customer}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/sales-details/${r.saleId}`)}
                                                                title="View Invoice"
                                                                className="font-mono text-[11px] font-semibold text-brand-700 hover:underline cursor-pointer"
                                                            >
                                                                #{r.orderNo}
                                                            </button>
                                                            {toggleBtn(r, isOpen)}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium">{r.directSales ? <DirectPill /> : r.sr || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium">{r.directSales ? <DirectPill /> : r.deliveredBy || 'N/A'}</td>
                                                    <td className="px-3 py-3 text-right font-bold text-orange-600 whitespace-nowrap">{fmt(r.pcs)} pcs</td>
                                                    <td className="px-3 py-3 text-right font-bold text-violet-600 whitespace-nowrap">৳{fmt(r.cost)}</td>
                                                    <td className="px-3 py-3 text-right font-bold text-brand-700 whitespace-nowrap">৳{fmt(r.revenue)}</td>
                                                    <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${r.over > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>৳{fmt(r.over)}</td>
                                                    <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${r.under > 0 ? 'text-rose-600' : 'text-slate-300'}`}>৳{fmt(r.under)}</td>
                                                    <td className={`px-3 py-3 text-right font-extrabold whitespace-nowrap ${profitColor(r.profit)}`}>{money(r.profit)}</td>
                                                </tr>

                                                {isOpen &&
                                                    r.products.map((p) => (
                                                        <tr key={p.key} className="bg-slate-50/70 text-[13px] border-l-4 border-brand-200">
                                                            <td className="px-3 py-2" colSpan={2}></td>
                                                            <td className="px-3 py-2 font-semibold text-slate-700 whitespace-nowrap">{p.name}</td>
                                                            <td className="px-3 py-2" colSpan={2}></td>
                                                            <td className="px-3 py-2 text-right font-semibold text-orange-600 whitespace-nowrap">{fmt(p.pcs)} pcs</td>
                                                            <td className="px-3 py-2 text-right font-semibold text-violet-600 whitespace-nowrap">৳{fmt(p.cost)}</td>
                                                            <td className="px-3 py-2 text-right font-semibold text-brand-700 whitespace-nowrap">৳{fmt(p.revenue)}</td>
                                                            <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${p.over > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>৳{fmt(p.over)}</td>
                                                            <td className={`px-3 py-2 text-right font-semibold whitespace-nowrap ${p.under > 0 ? 'text-rose-600' : 'text-slate-300'}`}>৳{fmt(p.under)}</td>
                                                            <td className={`px-3 py-2 text-right font-bold whitespace-nowrap ${profitColor(p.profit)}`}>{money(p.profit)}</td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        );
                                    })}

                                    <tfoot>
                                        <tr className="bg-brand-50/60 font-extrabold text-[13px] border-t-2 border-brand-100">
                                            <td className="px-3 py-3 text-slate-700" colSpan={5}>Total ({filtered.length} orders)</td>
                                            <td className="px-3 py-3 text-right text-orange-600 whitespace-nowrap">{fmt(totals.pcs)} pcs</td>
                                            <td className="px-3 py-3 text-right text-violet-600 whitespace-nowrap">৳{fmt(totals.cost)}</td>
                                            <td className="px-3 py-3 text-right text-brand-700 whitespace-nowrap">৳{fmt(totals.revenue)}</td>
                                            <td className={`px-3 py-3 text-right whitespace-nowrap ${totals.over > 0 ? 'text-emerald-600' : 'text-slate-300'}`}>৳{fmt(totals.over)}</td>
                                            <td className={`px-3 py-3 text-right whitespace-nowrap ${totals.under > 0 ? 'text-rose-600' : 'text-slate-300'}`}>৳{fmt(totals.under)}</td>
                                            <td className={`px-3 py-3 text-right whitespace-nowrap ${profitColor(totals.profit)}`}>{money(totals.profit)}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="px-1 py-1">
                                <Pager page={safePage} total={totalPages} onChange={handlePageChange} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfitSalesWise;