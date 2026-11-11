import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes, FaSyncAlt } from 'react-icons/fa';

const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const RATE_OPTIONS = ['Over Rate', 'Under Rate', 'Level Rate'];

// ===== Cost / price helpers (StockPurchase / ProfitSalesWise er moto same hisab) =====
const getPurchaseItemNetCost = (purchase, item) => {
    const pItems = purchase?.items || [];
    const sumSub = pItems.reduce((s, x) => s + num(x.itemTotal ?? x.subtotal), 0);
    if (!item || sumSub <= 0) return null;
    const ov =
        purchase.overallDiscountValue !== undefined && purchase.overallDiscountValue !== null && purchase.overallDiscountValue !== ''
            ? num(purchase.overallDiscountValue)
            : purchase.overallDiscountType === 'percent'
                ? (sumSub * num(purchase.overallDiscount)) / 100
                : num(purchase.overallDiscount);
    const adj = num(purchase.adjustment?.amount);
    const pay = Math.max(sumSub - ov + (purchase.adjustment?.type === '-' ? -adj : adj), 0);
    return r2((pay * num(item.itemTotal ?? item.subtotal)) / sumSub);
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
    const sItems = sale?.items || [];
    const sumSub = sItems.reduce((s, x) => s + num(x.itemTotal ?? x.subtotal), 0);
    const paidQty = num(item?.totalPcs);
    if (!item || sumSub <= 0 || paidQty <= 0) return num(item?.sellPricePcs ?? item?.sellPrice);
    const ov =
        sale.overallDiscountValue !== undefined && sale.overallDiscountValue !== null && sale.overallDiscountValue !== ''
            ? num(sale.overallDiscountValue)
            : sale.overallDiscountType === 'percent'
                ? (sumSub * num(sale.overallDiscount)) / 100
                : num(sale.overallDiscount);
    const adj = num(sale.adjustment?.amount);
    const pay = Math.max(sumSub - ov + (sale.adjustment?.type === '-' ? -adj : adj), 0);
    const net = (pay * num(item.itemTotal ?? item.subtotal)) / sumSub;
    return r2(net / paidQty);
};

const getPool = (a) => a.pool || ((a.kind || 'main') === 'main' ? 'paid' : 'free');

// ===== Date helpers =====
const parseToLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = String(dateStr).split(',')[0].trim();
    if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        if (!d || !m || !y) return null;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
        const [y, m, d] = datePart.slice(0, 10).split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(datePart);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Searchable dropdown
const FilterSelect = ({ label, placeholder, value, options, onChange, emptyText }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const list = options.filter((o) => o.toLowerCase().includes((value || '').toLowerCase()));

    return (
        <div className="relative" ref={ref}>
            <label className="block text-gray-600 text-[11px] font-semibold mb-1">{label}</label>
            <div
                onClick={() => setOpen(true)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                            setOpen(false);
                        }}
                        className="text-gray-400 hover:text-red-500 pl-1"
                    >
                        <FaTimes size={10} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                    {list.length > 0 ? (
                        list.map((o) => (
                            <div
                                key={o}
                                onClick={() => {
                                    onChange(o);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                            >
                                {o}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
};

// Company searchable dropdown (name + contact number)
const CompanySelect = ({ value, companies, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const s = (value || '').toLowerCase();
    const list = companies.filter(
        (c) =>
            c.businessName?.toLowerCase().includes(s) ||
            c.contactNumber?.toLowerCase().includes(s)
    );

    return (
        <div className="relative" ref={ref}>
            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
            <div
                onClick={() => setOpen(true)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
            >
                <input
                    type="text"
                    placeholder="Search or select company..."
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                            setOpen(false);
                        }}
                        className="text-gray-400 hover:text-red-500 pl-1"
                    >
                        <FaTimes size={10} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                    {list.length > 0 ? (
                        list.map((comp) => (
                            <div
                                key={comp._id}
                                onClick={() => {
                                    onChange(comp.businessName);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                            >
                                <p className="text-xs font-semibold text-gray-800">{comp.businessName}</p>
                                {comp.contactNumber && (
                                    <p className="text-[11px] text-gray-500 mt-0.5">📞 {comp.contactNumber}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                    )}
                </div>
            )}
        </div>
    );
};

const EMPTY_FILTERS = {
    dateType: 'order',
    startDate: '',
    endDate: '',
    invoiceNo: '',
    customer: '',
    product: '',
    company: '',
    sr: '',
    deliveredBy: '',
    route: '',
    status: '',
    result: '',
};

const AcOverUnderRateRepo = () => {
    const navigate = useNavigate();

    const [sales, setSales] = useState([]);
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [products, setProducts] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [directOnly, setDirectOnly] = useState(false);
    const [rateFilter, setRateFilter] = useState([...RATE_OPTIONS]);
    const [isRateOpen, setIsRateOpen] = useState(false);
    const rateDropdownRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [sRes, bRes, pRes, cRes, uRes, prRes, coRes] = await Promise.all([
                fetch('http://localhost:5000/sales'),
                fetch('http://localhost:5000/stock-purchase'),
                fetch('http://localhost:5000/purchase'),
                fetch('http://localhost:5000/customer'),
                fetch('http://localhost:5000/user'),
                fetch('http://localhost:5000/product'),
                fetch('http://localhost:5000/company'),
            ]);
            const [sData, bData, pData, cData, uData, prData, coData] = await Promise.all([
                sRes.json(),
                bRes.json(),
                pRes.json(),
                cRes.json().catch(() => []),
                uRes.json().catch(() => []),
                prRes.json().catch(() => []),
                coRes.json().catch(() => []),
            ]);
            setCompanies(Array.isArray(coData) ? coData : []);
            setSales(Array.isArray(sData) ? sData : []);
            setBatches(Array.isArray(bData) ? bData : []);
            setPurchases(Array.isArray(pData) ? pData : []);
            setCustomers(Array.isArray(cData) ? cData : []);
            setUsers(Array.isArray(uData) ? uData : []);
            setProducts(Array.isArray(prData) ? prData : []);
        } catch (error) {
            console.error('Error fetching over/under rate data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    useEffect(() => {
        const h = (e) => {
            if (rateDropdownRef.current && !rateDropdownRef.current.contains(e.target)) setIsRateOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    // ===== Product wise Over / Under rate rows =====
    const rows = useMemo(() => {
        const batchMap = new Map(batches.map((b) => [String(b._id), b]));
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const productMap = new Map(products.map((p) => [String(p._id), p]));
        const costCache = new Map();
        const unitCostOf = (b) => {
            const k = String(b._id);
            if (!costCache.has(k)) costCache.set(k, getBatchCostPerPcs(b, purchaseMap.get(String(b.purchaseId))));
            return costCache.get(k);
        };

        const out = [];

        sales.forEach((s) => {
            const delivered = s.status === 'Delivered';
            const orderTs = parseToLocalDate(s.orderDate)?.getTime() || 0;
            const ts =
                (s.deliveredAt ? Date.parse(s.deliveredAt) : 0) ||
                parseToLocalDate(s.deliveryDate)?.getTime() ||
                orderTs ||
                Date.parse(s.createdAt) ||
                0;

            const base = {
                saleId: s._id,
                orderNo: s.invoiceNo || s.orderNo,
                customer: s.customer || 'N/A',
                sr: s.sr || '',
                deliveredBy: s.deliveredBy || '',
                route: s.route || '',
                directSales: s.directSales === true,
                orderDate: s.orderDate || '',
                deliveryDate: s.deliveryDate || '',
                status: delivered ? 'Delivered' : 'New Order',
                ts,
            };

            // ---- Delivered: stockAllocations theke ----
            if (delivered && (s.stockAllocations || []).length > 0) {
                const map = new Map();
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

                    const pk = String(a.productId);
                    if (!map.has(pk)) {
                        const nameItem =
                            it ||
                            (s.items || []).find((x) => String(x.productId) === pk) ||
                            (s.freeItems || []).find((x) => String(x.productId) === pk);
                        map.set(pk, {
                            pid: pk,
                            product: nameItem?.productName || b?.productName || 'N/A',
                            company: nameItem?.company || b?.company || '',
                            qty: 0,
                            revenue: 0,
                            cost: 0,
                            over: 0,
                            under: 0,
                        });
                    }
                    const g = map.get(pk);
                    g.qty += net;
                    g.revenue += r;
                    g.cost += c;
                    if (r > 0) {
                        const diff = r2(r - num(b?.sellPrice) * net);
                        g.over += diff > 0 ? diff : 0;
                        g.under += diff < 0 ? -diff : 0;
                    }
                });

                map.forEach((g) => {
                    out.push({
                        ...base,
                        key: `${s._id}-${g.pid}`,
                        product: g.product,
                        company: g.company,
                        qty: g.qty,
                        over: r2(g.over),
                        under: r2(g.under),
                        profit: r2(r2(g.revenue) - r2(g.cost)),
                    });
                });
                return;
            }

            // ---- New Order: item er rate vs product er current sell price ----
            if (!delivered) {
                (s.items || []).forEach((it, idx) => {
                    const qty = num(it.totalPcs);
                    if (qty <= 0) return;
                    const rev = r2(getSaleItemNetPricePerPcs(s, it) * qty);
                    const sp = num(productMap.get(String(it.productId))?.sellingPrice);
                    const diff = sp > 0 ? r2(rev - sp * qty) : 0;
                    out.push({
                        ...base,
                        key: `${s._id}-${it.productId || idx}`,
                        product: it.productName || 'N/A',
                        company: it.company || '',
                        qty,
                        over: diff > 0 ? diff : 0,
                        under: diff < 0 ? r2(-diff) : 0,
                        profit: null, // delivery na hole cost fix na, tai profit nai
                    });
                });
            }
        });

        return out.sort((a, b) => b.ts - a.ts);
    }, [sales, batches, purchases, products]);

    // ===== Options =====
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const customerOptions = uniq(customers.map((c) => c.businessName || c.name));
    const srOptions = uniq(users.filter((u) => u.role === 'SR').map((u) => u.name));
    const deliveryOptions = uniq(users.filter((u) => u.role === 'Delivery Man').map((u) => u.name));
    const routeOptions = uniq(rows.map((r) => r.route));
    const productOptions = uniq(rows.map((r) => r.product));


    const has = (val, q) => String(val || '').toLowerCase().includes(String(q).toLowerCase());

    // ===== Filter =====
    const filtered = useMemo(() => {
        const st = filters.startDate ? parseToLocalDate(filters.startDate) : null;
        const en = filters.endDate ? parseToLocalDate(filters.endDate) : null;
        return rows.filter((r) => {
            if (st || en) {
                const d = parseToLocalDate(filters.dateType === 'delivery' ? r.deliveryDate : r.orderDate);
                if (!d) return false;
                if (st && d < st) return false;
                if (en && d > en) return false;
            }
            if (directOnly && !r.directSales) return false;
            if (filters.invoiceNo && !has(r.orderNo, filters.invoiceNo)) return false;
            if (filters.customer && !has(r.customer, filters.customer)) return false;
            if (filters.product && !has(r.product, filters.product)) return false;
            if (filters.company && !has(r.company, filters.company)) return false;
            if (filters.sr && !has(r.sr, filters.sr)) return false;
            if (filters.deliveredBy && !has(r.deliveredBy, filters.deliveredBy)) return false;
            if (filters.route && !has(r.route, filters.route)) return false;
            if (filters.status && r.status !== filters.status) return false;
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
            if (filters.result === 'profit' && !(r.profit !== null && r.profit >= 0)) return false;
            if (filters.result === 'loss' && !(r.profit !== null && r.profit < 0)) return false;
            return true;
        });
    }, [rows, filters, directOnly, rateFilter]);

    const totals = useMemo(() => {
        const t = { qty: 0, over: 0, under: 0, profit: 0 };
        filtered.forEach((r) => {
            t.qty += r.qty;
            t.over += r.over;
            t.under += r.under;
            t.profit += r.profit || 0;
        });
        return { qty: t.qty, over: r2(t.over), under: r2(t.under), profit: r2(t.profit) };
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

    const NA = <span className="text-gray-300 font-semibold">N/A</span>;
    const profitColor = (v) => (v >= 0 ? 'text-emerald-600' : 'text-red-600');

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Over Rate & Under Rate
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">প্রতিটা product এ কত over rate আর কত under rate এ বিক্রি হয়েছে</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchAll}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold text-xs rounded-full transition cursor-pointer"
                    >
                        <FaSyncAlt size={11} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-orange-500 to-amber-600">
                        <p className="text-sm text-white/80">Sell Qty</p>
                        <p className="text-2xl font-extrabold mt-1">{fmt(totals.qty)} pcs</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-emerald-500 to-teal-600">
                        <p className="text-sm text-white/80">Total Over Rate</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.over)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-rose-500 to-red-600">
                        <p className="text-sm text-white/80">Total Under Rate</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.under)}</p>
                    </div>
                    <div className={`rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br ${totals.profit >= 0 ? 'from-indigo-500 to-blue-600' : 'from-rose-500 to-red-600'}`}>
                        <p className="text-sm text-white/80">{totals.profit >= 0 ? 'Total Profit' : 'Total Loss'}</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.profit)}</p>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Over / Under Rate Records</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filtered.length > 0 ? `${start + 1}-${Math.min(start + itemsPerPage, filtered.length)}` : 0} of {filtered.length} ({rows.length} total)
                        </span>
                    </div>

                    {/* Filter Panel */}
                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {/* Date Type */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Date Type</label>
                                <select
                                    name="dateType"
                                    value={filters.dateType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="order">Order Date</option>
                                    <option value="delivery">Delivery Date</option>
                                </select>
                            </div>

                            {/* Start Date */}
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

                            {/* End Date */}
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

                            {/* Invoice + Direct Sales */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-gray-600 text-[11px] font-semibold">Invoice</label>
                                    <label className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={directOnly}
                                            onChange={(e) => {
                                                setDirectOnly(e.target.checked);
                                                setCurrentPage(1);
                                            }}
                                            className="w-3 h-3 accent-teal-600 cursor-pointer"
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
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            <FilterSelect
                                label="Customer"
                                placeholder="Search or select customer..."
                                value={filters.customer}
                                options={customerOptions}
                                onChange={(v) => setFilter('customer', v)}
                                emptyText="No customer found"
                            />

                            <FilterSelect
                                label="Product"
                                placeholder="Search or select product..."
                                value={filters.product}
                                options={productOptions}
                                onChange={(v) => setFilter('product', v)}
                                emptyText="No product found"
                            />

                            <CompanySelect
                                value={filters.company}
                                companies={companies}
                                onChange={(v) => setFilter('company', v)}
                            />

                            <FilterSelect
                                label="SR"
                                placeholder="Search or select SR..."
                                value={filters.sr}
                                options={srOptions}
                                onChange={(v) => setFilter('sr', v)}
                                emptyText="No SR found"
                            />

                            <FilterSelect
                                label="Delivery Man"
                                placeholder="Search or select delivery man..."
                                value={filters.deliveredBy}
                                options={deliveryOptions}
                                onChange={(v) => setFilter('deliveredBy', v)}
                                emptyText="No delivery man found"
                            />

                            <FilterSelect
                                label="Route"
                                placeholder="Search or select route..."
                                value={filters.route}
                                options={routeOptions}
                                onChange={(v) => setFilter('route', v)}
                                emptyText="No route found"
                            />

                            {/* Status */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="New Order">New Order</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
                            </div>

                            {/* Rate (multi select) */}
                            <div className="relative" ref={rateDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Rate</label>
                                <div
                                    onClick={() => setIsRateOpen((prev) => !prev)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <span className="truncate">
                                        {rateFilter.length === RATE_OPTIONS.length
                                            ? 'All'
                                            : rateFilter.length === 0
                                                ? 'None'
                                                : rateFilter.join(', ')}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 shrink-0 transition-transform ${isRateOpen ? 'rotate-180' : ''}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                                {isRateOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 py-1">
                                        {RATE_OPTIONS.map((opt) => (
                                            <label
                                                key={opt}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer text-xs font-medium text-gray-700"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={rateFilter.includes(opt)}
                                                    onChange={() => handleToggleRate(opt)}
                                                    className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Result */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Result</label>
                                <select
                                    name="result"
                                    value={filters.result}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="profit">Profit</option>
                                    <option value="loss">Loss</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-16 text-gray-500 font-medium">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 font-medium">No record found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="px-3 py-3">#</th>
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-3 py-3">Product</th>
                                        <th className="px-3 py-3">Company</th>
                                        <th className="px-3 py-3">SR</th>
                                        <th className="px-3 py-3">Route</th>
                                        <th className="px-3 py-3">Status</th>
                                        <th className="px-3 py-3 text-right">Sell Qty</th>
                                        <th className="px-3 py-3 text-right">Over Rate</th>
                                        <th className="px-3 py-3 text-right">Under Rate</th>
                                        <th className="px-3 py-3 text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {current.map((r, i) => (
                                        <tr key={r.key} className="hover:bg-indigo-50/40 transition">
                                            <td className="px-3 py-3 text-gray-400">{start + i + 1}</td>

                                            {/* Date (Order + Delivery) */}
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                                <div className="font-medium">Order: {r.orderDate || 'N/A'}</div>
                                                <div className="mt-0.5">
                                                    {r.deliveryDate ? (
                                                        <span>Delivered: {r.deliveryDate}</span>
                                                    ) : (
                                                        <span className="text-gray-400">Delivered: N/A</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Product + Invoice */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <div className="font-bold text-gray-800">{r.product}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/sales-details/${r.saleId}`, { state: { fromReport: true } })}
                                                        className="font-mono text-[11px] font-semibold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                        title="View Invoice"
                                                    >
                                                        #{r.orderNo}
                                                    </button>
                                                    {r.directSales && (
                                                        <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[9px] leading-none">
                                                            ⚡ Direct Sales
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-gray-400 mt-0.5">{r.customer}</div>
                                            </td>

                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.company || NA}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.directSales ? NA : (r.sr || NA)}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">{r.directSales ? NA : (r.route || NA)}</td>

                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <span className={`inline-block px-2.5 py-1 rounded-full font-semibold text-[11px] ${r.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {r.status}
                                                </span>
                                            </td>

                                            <td className="px-3 py-3 text-right font-bold text-orange-600 whitespace-nowrap">{fmt(r.qty)} pcs</td>
                                            <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${r.over > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>৳{fmt(r.over)}</td>
                                            <td className={`px-3 py-3 text-right font-bold whitespace-nowrap ${r.under > 0 ? 'text-red-600' : 'text-gray-400'}`}>৳{fmt(r.under)}</td>
                                            <td className="px-3 py-3 text-right whitespace-nowrap">
                                                {r.profit === null ? (
                                                    NA
                                                ) : (
                                                    <span className={`font-extrabold ${profitColor(r.profit)}`}>
                                                        {r.profit < 0 ? '-' : ''}৳{fmt(Math.abs(r.profit))}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{safePage}</span> of{' '}
                                <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(safePage - 1)}
                                    disabled={safePage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= safePage - 1 && pageNum <= safePage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${safePage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(safePage + 1)}
                                    disabled={safePage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    Next <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcOverUnderRateRepo;