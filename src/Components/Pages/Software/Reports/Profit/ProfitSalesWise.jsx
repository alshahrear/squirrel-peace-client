import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes, FaSyncAlt } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const num = (v) => Number(v) || 0;
const RATE_OPTIONS = ['Over Rate', 'Under Rate', 'Level Rate'];

// ===== Cost / price helpers (StockPurchase er moto same hisab) =====
const getPurchaseItemNetCost = (purchase, item) => {
    const pItems = purchase?.items || [];
    const sumSub = pItems.reduce((s, x) => s + (num(x.itemTotal ?? x.subtotal)), 0);
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
const parseDate = (d) => {
    if (!d) return 0;
    const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
    const t = Date.parse(d);
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
const showDate = (ts, raw) => {
    if (!ts) return raw || 'N/A';
    return new Date(ts).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ProfitSalesWise = () => {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openRows, setOpenRows] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        invoiceNo: '',
        customer: '',
        sr: '',
        deliveredBy: '',
        result: '',
    });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const customerDropdownRef = useRef(null);

    // SR, Delivery Man, Direct Sales, Rate filter
    const [users, setUsers] = useState([]);
    const [isSrOpen, setIsSrOpen] = useState(false);
    const srDropdownRef = useRef(null);
    const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
    const deliveryDropdownRef = useRef(null);
    const [directOnly, setDirectOnly] = useState(false);
    const [rateFilter, setRateFilter] = useState([...RATE_OPTIONS]);
    const [isRateOpen, setIsRateOpen] = useState(false);
    const rateDropdownRef = useRef(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [sRes, bRes, pRes, cRes] = await Promise.all([
                fetch('http://localhost:5000/sales'),
                fetch('http://localhost:5000/stock-purchase'),
                fetch('http://localhost:5000/purchase'),
                fetch('http://localhost:5000/customer'),
            ]);
            const [sData, bData, pData, cData] = await Promise.all([sRes.json(), bRes.json(), pRes.json(), cRes.json()]);
            setSales(Array.isArray(sData) ? sData : []);
            setBatches(Array.isArray(bData) ? bData : []);
            setPurchases(Array.isArray(pData) ? pData : []);
            setCustomers(Array.isArray(cData) ? cData : []);
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
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerOpen(false);
            }
            if (srDropdownRef.current && !srDropdownRef.current.contains(event.target)) {
                setIsSrOpen(false);
            }
            if (deliveryDropdownRef.current && !deliveryDropdownRef.current.contains(event.target)) {
                setIsDeliveryOpen(false);
            }
            if (rateDropdownRef.current && !rateDropdownRef.current.contains(event.target)) {
                setIsRateOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
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
            let sellPcs = 0;
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
                    sellPcs += net;
                    const sp = num(b?.sellPrice);
                    const diff = r2(r - sp * net);
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
        return rows.filter((r) => {
            if (st && r.dayTs < st) return false;
            if (en && r.dayTs > en) return false;
            if (inv && !String(r.orderNo || '').toLowerCase().includes(inv)) return false;
            if (cu && !String(r.customer || '').toLowerCase().includes(cu)) return false;
            if (directOnly && !r.directSales) return false;
            if (filters.sr && !String(r.sr || '').toLowerCase().includes(filters.sr.toLowerCase())) return false;
            if (filters.deliveredBy && !String(r.deliveredBy || '').toLowerCase().includes(filters.deliveredBy.toLowerCase())) return false;
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
    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', invoiceNo: '', customer: '', sr: '', deliveredBy: '', result: '' });
        setDirectOnly(false);
        setRateFilter([...RATE_OPTIONS]);
        setIsSrOpen(false);
        setIsDeliveryOpen(false);
        setIsRateOpen(false);
        setIsCustomerOpen(false);
        setCurrentPage(1);
    };
    const getCustomerName = (c) => c.businessName || c.name || '';
    const filteredCustomers = customers.filter((c) => {
        const s = filters.customer.toLowerCase();
        return getCustomerName(c).toLowerCase().includes(s) || (c.contactNumber || '').toLowerCase().includes(s);
    });
    const handleSelectCustomer = (c) => {
        setFilters((prev) => ({ ...prev, customer: getCustomerName(c) }));
        setCurrentPage(1);
        setIsCustomerOpen(false);
    };
    const handleClearCustomer = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, customer: '' }));
        setCurrentPage(1);
        setIsCustomerOpen(false);
    };
    const toggleRow = (key) => setOpenRows((prev) => ({ ...prev, [key]: !prev[key] }));

    const filteredSRs = users.filter(
        (u) => u.role === 'SR' && u.name?.toLowerCase().includes(filters.sr.toLowerCase())
    );
    const filteredDeliveryMen = users.filter(
        (u) => u.role === 'Delivery Man' && u.name?.toLowerCase().includes(filters.deliveredBy.toLowerCase())
    );
    const handleSelectSr = (u) => {
        setFilters((prev) => ({ ...prev, sr: u.name }));
        setIsSrOpen(false);
        setCurrentPage(1);
    };
    const handleClearSr = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, sr: '' }));
        setIsSrOpen(false);
        setCurrentPage(1);
    };
    const handleSelectDeliveryMan = (u) => {
        setFilters((prev) => ({ ...prev, deliveredBy: u.name }));
        setIsDeliveryOpen(false);
        setCurrentPage(1);
    };
    const handleClearDeliveryMan = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, deliveredBy: '' }));
        setIsDeliveryOpen(false);
        setCurrentPage(1);
    };
    const handleToggleRate = (opt) => {
        setRateFilter((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
        setCurrentPage(1);
    };

    const profitColor = (v) => (v >= 0 ? 'text-emerald-600' : 'text-red-600');

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Sales Wise Profit
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">প্রতিটা sales order থেকে কত cost, কত sell আর কত profit হয়েছে</p>
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
                        <p className="text-sm text-white/80">Net Sold</p>
                        <p className="text-2xl font-extrabold mt-1">{fmt(totals.pcs)} pcs</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-violet-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Cost</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.cost)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-blue-600">
                        <p className="text-sm text-white/80">Total Sell</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.revenue)}</p>
                    </div>
                    <div className={`rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br ${totals.profit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'}`}>
                        <p className="text-sm text-white/80">{totals.profit >= 0 ? 'Total Profit' : 'Total Loss'}</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.profit)}</p>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Profit Records</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {filtered.length} of {rows.length}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

                            {/* Invoice */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-gray-600 text-[11px] font-semibold">Invoice</label>
                                    <label className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={directOnly}
                                            onChange={(e) => { setDirectOnly(e.target.checked); setCurrentPage(1); }}
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

                            {/* Customer */}
                            <div className="relative" ref={customerDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer</label>
                                <div
                                    onClick={() => setIsCustomerOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select customer..."
                                        value={filters.customer}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, customer: e.target.value }));
                                            setCurrentPage(1);
                                            setIsCustomerOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.customer && (
                                        <button type="button" onClick={handleClearCustomer} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                                {isCustomerOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((c) => (
                                                <div
                                                    key={c._id}
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{getCustomerName(c)}</p>
                                                    {c.contactNumber && <p className="text-[11px] text-gray-500 mt-0.5">📞 {c.contactNumber}</p>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No customer found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* SR */}
                            <div className="relative" ref={srDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">SR</label>
                                <div
                                    onClick={() => setIsSrOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select SR..."
                                        value={filters.sr}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, sr: e.target.value }));
                                            setCurrentPage(1);
                                            setIsSrOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.sr && (
                                        <button type="button" onClick={handleClearSr} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                                {isSrOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredSRs.length > 0 ? (
                                            filteredSRs.map((u) => (
                                                <div
                                                    key={u._id}
                                                    onClick={() => handleSelectSr(u)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {u.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No SR found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Delivery Man */}
                            <div className="relative" ref={deliveryDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Delivery Man</label>
                                <div
                                    onClick={() => setIsDeliveryOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select delivery man..."
                                        value={filters.deliveredBy}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, deliveredBy: e.target.value }));
                                            setCurrentPage(1);
                                            setIsDeliveryOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.deliveredBy && (
                                        <button type="button" onClick={handleClearDeliveryMan} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                                {isDeliveryOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredDeliveryMen.length > 0 ? (
                                            filteredDeliveryMen.map((u) => (
                                                <div
                                                    key={u._id}
                                                    onClick={() => handleSelectDeliveryMan(u)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {u.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No delivery man found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Rate */}
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
                        <div className="text-center py-16 text-gray-400 font-medium">No profit record found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left border-collapse min-w-[1300px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4">SR</th>
                                        <th className="py-3 px-4">Delivery Man</th>
                                        <th className="py-3 px-4 text-right">Net Sold</th>
                                        <th className="py-3 px-4 text-right">Cost Amount</th>
                                        <th className="py-3 px-4 text-right">Sell Amount</th>
                                        <th className="py-3 px-4 text-right">Over Rate</th>
                                        <th className="py-3 px-4 text-right">Under Rate</th>
                                        <th className="py-3 px-4 text-right">Profit</th>
                                    </tr>
                                </thead>

                                {current.map((r, i) => {
                                    const isOpen = !!openRows[r.key];
                                    return (
                                        <tbody key={r.key} className="border-t border-gray-100 text-sm text-gray-700">
                                            <tr className={`transition ${isOpen ? 'bg-indigo-50' : 'bg-white hover:bg-indigo-50/40'}`}>
                                                <td className="py-3 px-4 text-gray-400">{start + i + 1}</td>
                                                <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-medium">
                                                    {showDate(r.ts, r.dateRaw)}
                                                </td>
                                                <td className="py-3 px-4 whitespace-nowrap">
                                                    <div className="font-bold text-gray-800">{r.customer}</div>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate(`/sales-details/${r.saleId}`)}
                                                            className="font-mono text-[11px] font-semibold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                            title="View Invoice"
                                                        >
                                                            #{r.orderNo}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleRow(r.key)}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 text-white text-[10px] font-bold shadow-sm cursor-pointer"
                                                        >
                                                            {r.products.length} product
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={3}
                                                                stroke="currentColor"
                                                                className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                                                    {r.directSales ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">Direct Sales</span>
                                                    ) : (r.sr || 'N/A')}
                                                </td>
                                                <td className="py-3 px-4 font-semibold text-gray-700 whitespace-nowrap">
                                                    {r.directSales ? (
                                                        <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-bold">Direct Sales</span>
                                                    ) : (r.deliveredBy || 'N/A')}
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-orange-600 whitespace-nowrap">{fmt(r.pcs)} pcs</td>
                                                <td className="py-3 px-4 text-right font-bold text-violet-600 whitespace-nowrap">৳{fmt(r.cost)}</td>
                                                <td className="py-3 px-4 text-right font-bold text-indigo-600 whitespace-nowrap">৳{fmt(r.revenue)}</td>
                                                <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${r.over > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>৳{fmt(r.over)}</td>
                                                <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${r.under > 0 ? 'text-red-600' : 'text-gray-400'}`}>৳{fmt(r.under)}</td>
                                                <td className={`py-3 px-4 text-right font-extrabold whitespace-nowrap ${profitColor(r.profit)}`}>
                                                    {r.profit < 0 ? '-' : ''}৳{fmt(Math.abs(r.profit))}
                                                </td>
                                            </tr>

                                            {isOpen &&
                                                r.products.map((p) => (
                                                    <tr key={p.key} className="bg-gray-50/70 text-[13px] border-l-4 border-indigo-200">
                                                        <td className="py-2 px-4"></td>
                                                        <td className="py-2 px-4"></td>
                                                        <td className="py-2 px-4 font-semibold text-gray-700 whitespace-nowrap">{p.name}</td>
                                                        <td className="py-2 px-4"></td>
                                                        <td className="py-2 px-4"></td>
                                                        <td className="py-2 px-4 text-right font-semibold text-orange-600 whitespace-nowrap">{fmt(p.pcs)} pcs</td>
                                                        <td className="py-2 px-4 text-right font-semibold text-violet-600 whitespace-nowrap">৳{fmt(p.cost)}</td>
                                                        <td className="py-2 px-4 text-right font-semibold text-indigo-600 whitespace-nowrap">৳{fmt(p.revenue)}</td>
                                                        <td className={`py-2 px-4 text-right font-semibold whitespace-nowrap ${p.over > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>৳{fmt(p.over)}</td>
                                                        <td className={`py-2 px-4 text-right font-semibold whitespace-nowrap ${p.under > 0 ? 'text-red-600' : 'text-gray-400'}`}>৳{fmt(p.under)}</td>
                                                        <td className={`py-2 px-4 text-right font-bold whitespace-nowrap ${profitColor(p.profit)}`}>
                                                            {p.profit < 0 ? '-' : ''}৳{fmt(Math.abs(p.profit))}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    );
                                })}

                                <tfoot>
                                    <tr className="bg-indigo-50/70 font-extrabold text-[13px] border-t-2 border-indigo-100">
                                        <td className="py-3 px-4 text-gray-700" colSpan={5}>Total ({filtered.length} orders)</td>
                                        <td className="py-3 px-4 text-right text-orange-600 whitespace-nowrap">{fmt(totals.pcs)} pcs</td>
                                        <td className="py-3 px-4 text-right text-violet-600 whitespace-nowrap">৳{fmt(totals.cost)}</td>
                                        <td className="py-3 px-4 text-right text-indigo-600 whitespace-nowrap">৳{fmt(totals.revenue)}</td>
                                        <td className={`py-3 px-4 text-right whitespace-nowrap ${totals.over > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>৳{fmt(totals.over)}</td>
                                        <td className={`py-3 px-4 text-right whitespace-nowrap ${totals.under > 0 ? 'text-red-600' : 'text-gray-400'}`}>৳{fmt(totals.under)}</td>
                                        <td className={`py-3 px-4 text-right whitespace-nowrap ${profitColor(totals.profit)}`}>
                                            {totals.profit < 0 ? '-' : ''}৳{fmt(Math.abs(totals.profit))}
                                        </td>
                                    </tr>
                                </tfoot>
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

export default ProfitSalesWise;