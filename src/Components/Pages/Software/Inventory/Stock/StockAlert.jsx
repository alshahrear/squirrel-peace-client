import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaRedo, FaTimes } from 'react-icons/fa';

const API = 'http://localhost:5000';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const getPerSub = (b) => (b.parentMode === true ? Number(b.pcsPerSub) || 0 : 0);

const getPerUnit = (b) => {
    if (Number(b.pcsPerUnit) > 0) return Number(b.pcsPerUnit);
    const uq = Number(b.unitQty) || 0;
    const sq = Number(b.subQty) || 0;
    const pq = Number(b.pcsQty) || 0;
    if (uq <= 0) return 0;
    const total = b.isFreeProduct ? Number(b.origFreeQty) || 0 : Number(b.origPaidQty) || 0;
    const per = (total - pq - sq * getPerSub(b)) / uq;
    return per > 0 ? per : 0;
};

const splitQty = (total, per, perSub = 0) => {
    if (per > 0) {
        const u = Math.floor(total / per);
        let rest = total - u * per;
        let s = 0;
        if (perSub > 0) {
            s = Math.floor(rest / perSub);
            rest = rest - s * perSub;
        }
        return [u, s, Math.round(rest * 100) / 100];
    }
    return [0, 0, total];
};

const fmtQty = (u, s, p, unit, subUnit) => {
    const parts = [];
    if (u > 0) parts.push(`${u} ${unit || 'Unit'}`);
    if (s > 0) parts.push(`${s} ${subUnit || 'Sub'}`);
    if (p > 0) parts.push(`${p} pcs`);
    return parts.length ? parts.join(' ') : '—';
};

const getCost = (b) => {
    if (b.isFreeProduct) return 0;
    const origPaid = Number(b.origPaidQty ?? b.paidQty) || 0;
    return origPaid > 0 ? (Number(b.netCost) || 0) / origPaid : 0;
};
const getValue = (b) => {
    if (b.isFreeProduct) return 0;
    return getCost(b) * (Number(b.availPaidQty) || 0);
};

const keyOf = (name, company) =>
    `${(name || '').toString().trim().toLowerCase()}|${(company || '').toString().trim().toLowerCase()}`;

const QtyBlock = ({ total, info, valueClass = 'text-gray-800', chipClass = 'bg-gray-50 border-gray-200 text-gray-600' }) => {
    if (!total || total <= 0) return <span className="text-gray-300 font-bold">—</span>;
    const pcsText = `${fmt(total)} pcs`;
    let text = pcsText;
    if (info && info.per > 1) {
        const [u, s, p] = splitQty(total, info.per, info.perSub);
        const t = fmtQty(u, s, p, info.unit, info.subUnit);
        text = t === '—' ? pcsText : t;
    }
    return (
        <div className="flex flex-col items-start gap-1 leading-tight">
            <span className={`text-[13px] font-bold ${valueClass}`}>{text}</span>
            {text !== pcsText ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[12px] font-extrabold shadow-sm ${chipClass}`}>
                    ({pcsText})
                </span>
            ) : null}
        </div>
    );
};

// Status style (halka / soft color)
const STATUS = {
    out: {
        label: 'Out of Stock',
        short: 'Out',
        badge: 'bg-rose-100 text-rose-700 border-rose-300',
        row: 'bg-rose-50 hover:bg-rose-100/70 border-rose-400',
        tab: 'bg-white text-rose-600 border-rose-300 hover:bg-rose-50',
        tabActive: 'bg-rose-100 text-rose-700 border-rose-400 ring-2 ring-rose-200',
        card: 'bg-rose-50 border-rose-200',
        cardLbl: 'text-rose-400',
        cardVal: 'text-rose-600',
        dot: 'bg-rose-500',
    },
    low: {
        label: 'Low Stock',
        short: 'Low',
        badge: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        row: 'bg-yellow-50 hover:bg-yellow-100/70 border-yellow-400',
        tab: 'bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-50',
        tabActive: 'bg-yellow-100 text-yellow-800 border-yellow-400 ring-2 ring-yellow-200',
        card: 'bg-yellow-50 border-yellow-200',
        cardLbl: 'text-yellow-600',
        cardVal: 'text-yellow-700',
        dot: 'bg-yellow-500',
    },
    level: {
        label: 'At Alert Level',
        short: 'Level',
        badge: 'bg-sky-100 text-sky-700 border-sky-300',
        row: 'bg-sky-50 hover:bg-sky-100/70 border-sky-400',
        tab: 'bg-white text-sky-600 border-sky-300 hover:bg-sky-50',
        tabActive: 'bg-sky-100 text-sky-700 border-sky-400 ring-2 ring-sky-200',
        card: 'bg-sky-50 border-sky-200',
        cardLbl: 'text-sky-400',
        cardVal: 'text-sky-600',
        dot: 'bg-sky-500',
    },
};

const ORDER = { out: 0, low: 1, level: 2 };

const StockAlert = () => {
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [salesBulkReturns, setSalesBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [productMaster, setProductMaster] = useState([]);

    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ product: '', company: '' });
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const productDropdownRef = useRef(null);
    const companyDropdownRef = useRef(null);
    const [tab, setTab] = useState('all'); // all | out | low | level
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const loadAll = useCallback(async () => {
        try {
            const get = async (path) => {
                const res = await fetch(`${API}${path}`, { cache: 'no-store' });
                const data = await res.json();
                return Array.isArray(data) ? data : [];
            };
            const [b, p, s, br, sbr, d, a, pm] = await Promise.all([
                get('/stock-purchase'),
                get('/purchase'),
                get('/sales'),
                get('/purchase-bulk-return'),
                get('/sales-bulk-return'),
                get('/sales-damage'),
                get('/stock-adjustment'),
                get('/product'),
            ]);
            setBatches(b);
            setPurchases(p);
            setSales(s);
            setBulkReturns(br);
            setSalesBulkReturns(sbr);
            setDamages(d);
            setAdjustments(a);
            setProductMaster(pm);
        } catch (error) {
            console.error('Error fetching stock alert:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Tab open hole sathe sathe fresh data, ar page e fire ashle abar refresh
    useEffect(() => {
        loadAll();
        const onFocus = () => loadAll();
        const timer = setInterval(() => {
            if (document.visibilityState === 'visible') loadAll();
        }, 15000);
        window.addEventListener('focus', onFocus);
        return () => {
            window.removeEventListener('focus', onFocus);
            clearInterval(timer);
        };
    }, [loadAll]);

    // Batch wise available qty (Stock Products er moto same hisab)
    const stockRows = useMemo(() => {
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const buildMap = (list, signFn) => {
            const m = new Map();
            list.forEach((r) =>
                (r.stockAllocations || []).forEach((a) => {
                    const k = String(a.batchId);
                    const cur = m.get(k) || { paid: 0, free: 0 };
                    cur[a.pool === 'paid' ? 'paid' : 'free'] += signFn(a) * (Number(a.qty) || 0);
                    m.set(k, cur);
                })
            );
            return m;
        };
        const bulkMap = buildMap(bulkReturns, () => 1);
        const sbMap = buildMap(salesBulkReturns, () => 1);
        const dmgMap = buildMap(damages, () => 1);
        const adjMap = buildMap(adjustments, (a) => (a.direction === 'out' ? 1 : -1));
        const soldMap = new Map();
        sales.forEach((s) =>
            (s.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = soldMap.get(k) || { paid: 0, free: 0 };
                const net = Math.max((Number(a.qty) || 0) - (Number(a.returned) || 0), 0);
                const pool = a.pool || ((a.kind || 'main') === 'main' ? 'paid' : 'free');
                cur[pool] += net;
                soldMap.set(k, cur);
            })
        );

        return batches.map((b) => {
            const purchase = purchaseMap.get(String(b.purchaseId));
            let retPaid = 0;
            let retFree = 0;
            (purchase?.returnHistory || []).forEach((ret) => {
                if (b.isFreeProduct) {
                    (ret.freeItems || []).forEach((it) => {
                        if (it.productId === b.productId) retFree += Number(it.returnTotalQty) || 0;
                    });
                } else {
                    (ret.items || []).forEach((it) => {
                        if (it.productId === b.productId) {
                            retPaid += Number(it.returnTotalQty) || 0;
                            retFree += Number(it.returnFreeTotalQty ?? it.returnFreeQty) || 0;
                        }
                    });
                }
            });
            const bulk = bulkMap.get(String(b._id));
            if (bulk) {
                retPaid += bulk.paid;
                retFree += bulk.free;
            }
            const origPaid = Number(b.paidQty) || 0;
            const origFree = Number(b.freeQty) || 0;
            const sold0 = soldMap.get(String(b._id)) || { paid: 0, free: 0 };
            const sb = sbMap.get(String(b._id)) || { paid: 0, free: 0 };
            const dm = dmgMap.get(String(b._id)) || { paid: 0, free: 0 };
            const ad = adjMap.get(String(b._id)) || { paid: 0, free: 0 };
            const sold = {
                paid: sold0.paid - sb.paid + dm.paid + ad.paid,
                free: sold0.free - sb.free + dm.free + ad.free,
            };
            const curPaid = Math.max(origPaid - retPaid, 0);
            const curFree = Math.max(origFree - retFree, 0);
            let availPaid = 0;
            let availFree = 0;
            if (b.isFreeProduct) {
                availFree = Math.max(curFree - (sold.paid + sold.free), 0);
            } else {
                availPaid = Math.max(curPaid - sold.paid, 0);
                availFree = Math.max(curFree - sold.free, 0);
            }
            return {
                ...b,
                origPaidQty: origPaid,
                origFreeQty: origFree,
                availPaidQty: availPaid,
                availFreeQty: availFree,
            };
        });
    }, [batches, purchases, sales, bulkReturns, salesBulkReturns, damages, adjustments]);

    // Product wise group
    const products = useMemo(() => {
        const map = new Map();
        stockRows.forEach((b, idx) => {
            const name = (b.productName || '').toString().trim();
            const company = (b.company || '').toString().trim();
            const key = keyOf(name, company);
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    productName: name || 'N/A',
                    company: company || 'N/A',
                    main: 0,
                    free: 0,
                    value: 0,
                    batchCount: 0,
                    lastIdx: -1,
                    info: null,
                    productIds: new Set(),
                });
            }
            const g = map.get(key);
            g.main += Number(b.availPaidQty) || 0;
            g.free += Number(b.availFreeQty) || 0;
            g.value += getValue(b);
            g.batchCount += 1;
            g.lastIdx = idx;
            if (b.productId) g.productIds.add(String(b.productId));
            const per = getPerUnit(b);
            if (per > 1) g.info = { per, perSub: getPerSub(b), unit: b.unit, subUnit: b.subUnit };
        });
        return Array.from(map.values()).map((g) => ({ ...g, total: g.main + g.free }));
    }, [stockRows]);

    // Alert qty (product master theke) er sathe milano
    const alertRows = useMemo(() => {
        const byId = new Map(productMaster.map((p) => [String(p._id), p]));
        const byKey = new Map(productMaster.map((p) => [keyOf(p.productName, p.company), p]));

        const out = [];
        products.forEach((p) => {
            let master = null;
            for (const id of p.productIds) {
                if (byId.has(id)) {
                    master = byId.get(id);
                    break;
                }
            }
            if (!master) master = byKey.get(p.key) || null;
            if (!master || master.isActive === false) return;

            const alertQty = Number(master.alertQuantity) || 0;
            if (alertQty <= 0) return; // alert set kora nai

            const total = p.total;
            if (total > alertQty) return; // stock thik ase, alert e ashbe na

            let status = 'low';
            if (total <= 0) status = 'out';
            else if (total === alertQty) status = 'level';

            out.push({ ...p, alertQty, status });
        });

        return out.sort(
            (a, b) => ORDER[a.status] - ORDER[b.status] || a.total - b.total || a.productName.localeCompare(b.productName)
        );
    }, [products, productMaster]);

    const counts = useMemo(() => {
        const c = { out: 0, low: 0, level: 0 };
        alertRows.forEach((r) => (c[r.status] += 1));
        return c;
    }, [alertRows]);

    const companyOptions = useMemo(() => {
        const q = filters.company.trim().toLowerCase();
        return [...new Set(alertRows.map((r) => r.company))].filter((c) => c.toLowerCase().includes(q));
    }, [alertRows, filters.company]);

    const productOptions = useMemo(() => {
        const cq = filters.company.trim().toLowerCase();
        const pq = filters.product.trim().toLowerCase();
        return alertRows.filter(
            (r) => (!cq || r.company.toLowerCase().includes(cq)) && r.productName.toLowerCase().includes(pq)
        );
    }, [alertRows, filters]);

    const filtered = useMemo(() => {
        const pq = filters.product.trim().toLowerCase();
        const cq = filters.company.trim().toLowerCase();
        return alertRows.filter((r) => {
            if (tab !== 'all' && r.status !== tab) return false;
            if (pq && !r.productName.toLowerCase().includes(pq)) return false;
            if (cq && !r.company.toLowerCase().includes(cq)) return false;
            return true;
        });
    }, [alertRows, tab, filters]);

    useEffect(() => {
        const onDown = (e) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(e.target)) setIsProductOpen(false);
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(e.target)) setIsCompanyOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, []);

    const handleSelectCompany = (name) => {
        setFilters({ company: name, product: '' });
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };
    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, company: '' }));
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };
    const handleSelectProduct = (r) => {
        setFilters({ product: r.productName, company: r.company });
        setIsProductOpen(false);
        setCurrentPage(1);
    };
    const handleClearProduct = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, product: '' }));
        setIsProductOpen(false);
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ product: '', company: '' });
        setTab('all');
        setIsProductOpen(false);
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safePage - 1) * itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const handleTab = (key) => {
        setTab((prev) => (prev === key ? 'all' : key)); // ekhon active tab e abar click korle All
        setCurrentPage(1);
    };

    const tabs = [
        { key: 'low', ...STATUS.low, count: counts.low, icon: '⚠️' },
        { key: 'level', ...STATUS.level, count: counts.level, icon: '📊' },
        { key: 'out', ...STATUS.out, count: counts.out, icon: '⛔' },
    ];

    return (
        <div className="bg-gradient-to-br from-slate-100 via-indigo-50 to-pink-50">
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                                Stock Alert
                            </h2>
                            <p className="text-xs text-gray-400 font-medium mt-1">
                                Alert quantity er soman ba tar kom stock er product gulo ekhane dekhabe
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            <div className="px-4 py-2 rounded-2xl bg-violet-50 border border-violet-100 text-center">
                                <div className="text-[10px] font-bold uppercase text-violet-400">Alert Products</div>
                                <div className="text-lg font-extrabold text-violet-700">{fmt(alertRows.length)}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border text-center ${STATUS.low.card}`}>
                                <div className={`text-[10px] font-bold uppercase ${STATUS.low.cardLbl}`}>Low</div>
                                <div className={`text-lg font-extrabold ${STATUS.low.cardVal}`}>{fmt(counts.low)}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border text-center ${STATUS.level.card}`}>
                                <div className={`text-[10px] font-bold uppercase ${STATUS.level.cardLbl}`}>Level</div>
                                <div className={`text-lg font-extrabold ${STATUS.level.cardVal}`}>{fmt(counts.level)}</div>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl border text-center ${STATUS.out.card}`}>
                                <div className={`text-[10px] font-bold uppercase ${STATUS.out.cardLbl}`}>Out</div>
                                <div className={`text-lg font-extrabold ${STATUS.out.cardVal}`}>{fmt(counts.out)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-800">Alert List</h3>
                                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                                    {filtered.length} products
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-2 rounded-lg transition-all font-semibold cursor-pointer"
                                >
                                    <FaRedo size={11} /> Clear All Filters
                                </button>
                            </div>
                        </div>

                        {/* Filters + Tabs (ek line) */}
                        <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                            {/* Product */}
                            <div className="relative flex-1 min-w-[180px]" ref={productDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product</label>
                                <div
                                    onClick={() => setIsProductOpen(true)}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select product..."
                                        value={filters.product}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, product: e.target.value }));
                                            setIsProductOpen(true);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.product && (
                                        <button type="button" onClick={handleClearProduct} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                                {isProductOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {productOptions.length > 0 ? (
                                            productOptions.map((r) => (
                                                <div
                                                    key={r.key}
                                                    onClick={() => handleSelectProduct(r)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none"
                                                >
                                                    <div className="text-xs font-medium text-gray-700">{r.productName}</div>
                                                    <div className="text-[10px] text-gray-400">{r.company}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No product found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Company */}
                            <div className="relative flex-1 min-w-[180px]" ref={companyDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <div
                                    onClick={() => setIsCompanyOpen(true)}
                                    className="w-full px-3 py-2 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select company..."
                                        value={filters.company}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, company: e.target.value }));
                                            setIsCompanyOpen(true);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.company && (
                                        <button type="button" onClick={handleClearCompany} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                                {isCompanyOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {companyOptions.length > 0 ? (
                                            companyOptions.map((c) => (
                                                <div
                                                    key={c}
                                                    onClick={() => handleSelectCompany(c)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {c}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Tabs: Low / Level / Out */}
                            <div className="flex items-center gap-2">
                                {tabs.map((t) => (
                                    <button
                                        key={t.key}
                                        type="button"
                                        onClick={() => handleTab(t.key)}
                                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${tab === t.key ? t.tabActive : t.tab}`}
                                    >
                                        <span>{t.icon}</span>
                                        {t.short}
                                        <span className="px-2 py-0.5 rounded-full bg-white/80 text-[10px] font-extrabold">{t.count}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-gray-500 font-medium">Loading stock alert...</div>
                        ) : filtered.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="text-4xl mb-2">✅</div>
                                <div className="text-gray-400 font-medium">
                                    {alertRows.length === 0 ? 'Kono product alert level e nai, stock thik ase!' : 'Kono product pawa jayni!'}
                                </div>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                            <th className="py-3 px-3 w-12">#</th>
                                            <th className="py-3 px-3">Product</th>
                                            <th className="py-3 px-3">Company</th>
                                            <th className="py-3 px-3">Main Qty</th>
                                            <th className="py-3 px-3">Free Qty</th>
                                            <th className="py-3 px-3">Total Qty</th>
                                            <th className="py-3 px-3">Status</th>
                                            <th className="py-3 px-3 text-right">Stock Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentItems.map((p, i) => {
                                            const st = STATUS[p.status];
                                            return (
                                                <tr key={p.key} className={`${st.row} border-l-4 text-[13px] text-gray-700 transition`}>
                                                    <td className="py-3 px-3 text-gray-400 font-semibold">{indexOfFirstItem + i + 1}</td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <div className="font-bold text-gray-800">{p.productName}</div>
                                                        <div className="text-[10px] font-semibold text-gray-400">
                                                            Alert Qty: {fmt(p.alertQty)} pcs
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">{p.company}</td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <QtyBlock total={p.main} info={p.info} valueClass="text-indigo-700" chipClass="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600" />
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-gradient-to-r from-emerald-50 to-teal-100 border-emerald-200 text-emerald-600" />
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <QtyBlock
                                                            total={p.total}
                                                            info={p.info}
                                                            valueClass={p.total > 0 ? 'text-violet-700' : 'text-rose-600'}
                                                            chipClass={p.total > 0
                                                                ? 'bg-gradient-to-r from-violet-50 to-pink-100 border-violet-200 text-violet-600'
                                                                : 'bg-rose-50 border-rose-200 text-rose-500'}
                                                        />
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${st.badge}`}>
                                                            <span className={`w-2 h-2 rounded-full ${st.dot}`}></span>
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                                                        ৳{fmt(p.value)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {!loading && filtered.length > 0 && (
                            <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <span className="text-xs text-gray-500 font-medium">
                                    Page <span className="font-bold text-gray-700">{safePage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
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
        </div>
    );
};

export default StockAlert;