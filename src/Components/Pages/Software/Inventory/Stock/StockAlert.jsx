import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fmt, labelCls, Pill, Pager, ComboField, FilterPanel, ListSkeleton, Empty } from '../../Purchase/PurchaseUi';

const API = 'http://localhost:5000';

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

// Mobile card e choto text (unit + pcs ek line e)
const qtyText = (total, info) => {
    if (!total || total <= 0) return '—';
    const pcs = `${fmt(total)} pcs`;
    if (info && info.per > 1) {
        const [u, s, p] = splitQty(total, info.per, info.perSub);
        const t = fmtQty(u, s, p, info.unit, info.subUnit);
        if (t !== '—') return `${t} (${pcs})`;
    }
    return pcs;
};


const StockAlert = () => {
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [salesBulkReturns, setSalesBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [productMaster, setProductMaster] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ product: '', company: '', companyContact: '' });
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
            const [b, p, s, br, sbr, d, a, pm, cm] = await Promise.all([
                get('/stock-purchase'),
                get('/purchase'),
                get('/sales'),
                get('/purchase-bulk-return'),
                get('/sales-bulk-return'),
                get('/sales-damage'),
                get('/stock-adjustment'),
                get('/product'),
                get('/company'),
            ]);
            setBatches(b);
            setPurchases(p);
            setSales(s);
            setBulkReturns(br);
            setSalesBulkReturns(sbr);
            setDamages(d);
            setAdjustments(a);
            setProductMaster(pm);
            setCompanies(cm);
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

    // Company name -> phone
    const phoneByName = useMemo(() => {
        const m = new Map();
        companies.forEach((c) => {
            const k = (c.businessName || '').toString().trim().toLowerCase();
            if (k && !m.has(k)) m.set(k, c.contactNumber || '');
        });
        return m;
    }, [companies]);

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

            out.push({ ...p, alertQty, status, phone: phoneByName.get(p.company.trim().toLowerCase()) || '' });
        });

        return out.sort(
            (a, b) => ORDER[a.status] - ORDER[b.status] || a.total - b.total || a.productName.localeCompare(b.productName)
        );
    }, [products, productMaster, phoneByName]);

    const counts = useMemo(() => {
        const c = { out: 0, low: 0, level: 0 };
        alertRows.forEach((r) => (c[r.status] += 1));
        return c;
    }, [alertRows]);

    const companyOptions = useMemo(() => {
        const q = filters.company.trim().toLowerCase();
        const seen = new Map();
        alertRows.forEach((r) => {
            if (!seen.has(r.company)) seen.set(r.company, { name: r.company, phone: r.phone });
        });
        return Array.from(seen.values()).filter(
            (c) => c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q)
        );
    }, [alertRows, filters.company]);

    const productOptions = useMemo(() => {
        const pq = filters.product.trim().toLowerCase();
        return alertRows.filter(
            (r) =>
                r.productName.toLowerCase().includes(pq) ||
                r.company.toLowerCase().includes(pq) ||
                (r.phone || '').toLowerCase().includes(pq)
        );
    }, [alertRows, filters.product]);

    const filtered = useMemo(() => {
        const pq = filters.product.trim().toLowerCase();
        const cq = filters.company.trim().toLowerCase();
        return alertRows.filter((r) => {
            if (tab !== 'all' && r.status !== tab) return false;
            if (pq && !r.productName.toLowerCase().includes(pq)) return false;
            if (cq && !r.company.toLowerCase().includes(cq) && !(r.phone || '').toLowerCase().includes(cq)) return false;
            if (filters.companyContact && r.phone && r.phone !== filters.companyContact) return false;
            return true;
        });
    }, [alertRows, tab, filters]);

    const handleClearFilters = () => {
        setFilters({ product: '', company: '', companyContact: '' });
        setTab('all');
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

    const productComboOptions = productOptions.map((r) => ({
        key: r.key,
        title: r.productName,
        sub: `🏢 ${r.company}${r.phone ? ` | 📞 ${r.phone}` : ''}`,
        raw: r,
    }));
    const companyComboOptions = companyOptions.map((c) => ({
        key: c.name,
        title: c.name,
        sub: c.phone ? `📞 ${c.phone}` : '',
        raw: c,
    }));
    const activeCount = (filters.product ? 1 : 0) + (filters.company ? 1 : 0) + (tab !== 'all' ? 1 : 0);

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Stock Alert</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Products at or below their alert quantity</p>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-3 mt-3 sm:mt-4">
                        <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-violet-50 border border-violet-100 min-w-0">
                            <div className="text-[9px] sm:text-[10px] font-bold uppercase text-violet-400 truncate">Alert</div>
                            <div className="text-lg font-extrabold text-violet-700">{fmt(alertRows.length)}</div>
                        </div>
                        {['low', 'level', 'out'].map((k) => (
                            <div key={k} className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border min-w-0 ${STATUS[k].card}`}>
                                <div className={`text-[9px] sm:text-[10px] font-bold uppercase truncate ${STATUS[k].cardLbl}`}>{STATUS[k].short}</div>
                                <div className={`text-lg font-extrabold ${STATUS[k].cardVal}`}>{fmt(counts[k])}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Filter */}
                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-3">
                    <ComboField
                        label="Product"
                        value={filters.product}
                        placeholder="Search product..."
                        options={productComboOptions}
                        onType={(v) => {
                            setFilters((prev) => ({ ...prev, product: v, company: '', companyContact: '' }));
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters((prev) => ({ ...prev, product: '', company: '', companyContact: '' }));
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters({ product: o.raw.productName?.trim() || '', company: o.raw.company?.trim() || '', companyContact: o.raw.phone || '' });
                            setCurrentPage(1);
                        }}
                    />
                    <ComboField
                        label="Company"
                        value={filters.company}
                        placeholder="Search company..."
                        options={companyComboOptions}
                        onType={(v) => {
                            setFilters((prev) => ({ ...prev, company: v, companyContact: '' }));
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters((prev) => ({ ...prev, company: '', companyContact: '' }));
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters({ company: o.raw.name, companyContact: o.raw.phone || '', product: '' });
                            setCurrentPage(1);
                        }}
                    />
                    <div>
                        <span className={labelCls}>Status</span>
                        <div className="grid grid-cols-3 gap-2">
                            {tabs.map((t) => (
                                <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => handleTab(t.key)}
                                    className={`h-10 inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-bold cursor-pointer ${tab === t.key ? t.tabActive : t.tab}`}
                                >
                                    <span>{t.icon}</span>
                                    {t.short}
                                    <span className="px-1.5 rounded-full bg-white/80 text-[10px] font-extrabold">{t.count}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </FilterPanel>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex items-center gap-2 px-1.5 pt-1 sm:p-0">
                        <h3 className="text-base font-bold text-slate-800">Alert List</h3>
                        <Pill tone="brand">{filtered.length} products</Pill>
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : filtered.length === 0 ? (
                        <Empty text={alertRows.length === 0 ? '✅ No product is at alert level, stock is fine!' : 'No product found!'} />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentItems.map((p) => {
                                    const st = STATUS[p.status];
                                    return (
                                        <div key={p.key} className={`rounded-xl border-l-4 border-y border-r pl-2.5 pr-2 py-2 shadow-sm ${st.row.replace(/hover:\S+/g, '')}`}>
                                            <div className="flex items-stretch gap-2">
                                                {/* Left: info + qty */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                    <p className="font-bold text-[13px] text-slate-800 break-words leading-tight">{p.productName}</p>
                                                    <p className="text-[10.5px] text-slate-500 leading-snug break-words">
                                                        <span className="font-semibold text-slate-700">{p.company}</span>
                                                        {p.phone ? ` • 📞 ${p.phone}` : ''}
                                                    </p>
                                                    <div className="space-y-px leading-snug">
                                                        <p className="text-[10.5px]">
                                                            <span className="text-[9px] uppercase text-slate-400 font-bold mr-1">Main:</span>
                                                            <span className="font-semibold text-brand-700">{qtyText(p.main, p.info)}</span>
                                                        </p>
                                                        <p className="text-[10.5px]">
                                                            <span className="text-[9px] uppercase text-slate-400 font-bold mr-1">Free:</span>
                                                            <span className="font-semibold text-emerald-700">{qtyText(p.free, p.info)}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: status, total, alert, value */}
                                                <div className="shrink-0 w-[116px] flex flex-col items-end justify-between gap-1.5">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-px rounded-full border text-[10px] font-bold ${st.badge}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                                                        {st.label}
                                                    </span>
                                                    <div className="w-full space-y-px">
                                                        <div className="rounded-md bg-white/70 px-1.5 py-0.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-bold text-slate-400">TOTAL</span>
                                                                <span className={`text-[11px] font-bold ${p.total > 0 ? 'text-violet-700' : 'text-rose-600'}`}>
                                                                    {p.total > 0 ? `${fmt(p.total)} pcs` : '0 pcs'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-white/70 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-slate-400">ALERT</span>
                                                            <span className="text-[11px] font-bold text-slate-700">{fmt(p.alertQty)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-emerald-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-emerald-400">VALUE</span>
                                                            <span className="text-[11px] font-bold text-emerald-700">৳{fmt(p.value)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[900px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="px-3 py-3 w-12">#</th>
                                            <th className="px-3 py-3">Product</th>
                                            <th className="px-3 py-3">Company</th>
                                            <th className="px-3 py-3">Main Qty</th>
                                            <th className="px-3 py-3">Free Qty</th>
                                            <th className="px-3 py-3">Total Qty</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3 text-right">Stock Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentItems.map((p, i) => {
                                            const st = STATUS[p.status];
                                            return (
                                                <tr key={p.key} className={`${st.row} border-l-4 align-middle`}>
                                                    <td className="px-3 py-3 text-slate-400 font-semibold">{indexOfFirstItem + i + 1}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{p.productName}</div>
                                                        <div className="text-[10px] font-semibold text-slate-400">Alert Qty: {fmt(p.alertQty)} pcs</div>
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-600 font-medium whitespace-nowrap">
                                                        <div>{p.company}</div>
                                                        {p.phone && <div className="text-[11px] text-slate-400 mt-0.5">📞 {p.phone}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <QtyBlock total={p.main} info={p.info} valueClass="text-brand-700" chipClass="bg-brand-50 border-brand-100 text-brand-700" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-emerald-50 border-emerald-100 text-emerald-700" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <QtyBlock
                                                            total={p.total}
                                                            info={p.info}
                                                            valueClass={p.total > 0 ? 'text-violet-700' : 'text-rose-600'}
                                                            chipClass={p.total > 0 ? 'bg-violet-50 border-violet-100 text-violet-700' : 'bg-rose-50 border-rose-200 text-rose-500'}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold ${st.badge}`}>
                                                            <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                                                            {st.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-extrabold text-emerald-700 whitespace-nowrap">৳{fmt(p.value)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Pager
                                page={safePage}
                                totalPages={totalPages}
                                onChange={handlePageChange}
                                from={indexOfFirstItem + 1}
                                to={Math.min(indexOfFirstItem + itemsPerPage, filtered.length)}
                                total={filtered.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockAlert;