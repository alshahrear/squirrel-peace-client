import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes } from 'react-icons/fa';

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

// Cost sudhu paid qty diye hisab hobe
const getCost = (b) => {
    if (b.isFreeProduct) return 0;
    const origPaid = Number(b.origPaidQty ?? b.paidQty) || 0;
    return origPaid > 0 ? (Number(b.netCost) || 0) / origPaid : 0;
};
const getValue = (b) => {
    if (b.isFreeProduct) return 0;
    return getCost(b) * (Number(b.availPaidQty) || 0);
};

// Total pcs ke bundle format e: "2 Box 1 pcs" + niche "(11 pcs)"

const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const labelCls = 'block text-slate-600 text-xs font-medium mb-1';

// Total pcs ke bundle format e: "2 Box 1 pcs" + niche "(11 pcs)"
const QtyBlock = ({ total, info, valueClass = 'text-slate-800', chipClass = 'bg-slate-50 border-slate-200 text-slate-600' }) => {
    if (!total || total <= 0) return <span className="text-slate-300 font-bold">—</span>;
    const pcsText = `${fmt(total)} pcs`;
    let text = pcsText;
    if (info && info.per > 1) {
        const [u, s, p] = splitQty(total, info.per, info.perSub);
        const t = fmtQty(u, s, p, info.unit, info.subUnit);
        text = t === '—' ? pcsText : t;
    }
    return (
        <div className="flex flex-col items-start gap-1 leading-tight">
            <span className={`text-sm font-bold ${valueClass}`}>{text}</span>
            {text !== pcsText ? (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${chipClass}`}>
                    ({pcsText})
                </span>
            ) : null}
        </div>
    );
};

const MiniQty = ({ label, total, info, tone, bg }) => {
    const pcsText = `${fmt(total)} pcs`;
    let text = pcsText;
    if (total > 0 && info && info.per > 1) {
        const [u, s, p] = splitQty(total, info.per, info.perSub);
        const t = fmtQty(u, s, p, info.unit, info.subUnit);
        text = t === '—' ? pcsText : t;
    }
    return (
        <div className={`rounded-lg px-2 py-1.5 min-w-0 ${bg}`}>
            <div className="text-[10px] font-bold uppercase text-slate-400 leading-none mb-1">{label}</div>
            <div className={`text-[12.5px] font-bold leading-snug break-words ${tone}`}>{total > 0 ? text : '—'}</div>
            {total > 0 && text !== pcsText && (
                <div className="text-[10px] font-semibold text-slate-400 leading-tight">({pcsText})</div>
            )}
        </div>
    );
};

const STAT_TONE = {
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
};
const Stat = ({ label, value, tone = 'slate' }) => (
    <div className={`rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2.5 min-w-0 ${STAT_TONE[tone]}`}>
        <div className="text-[10px] sm:text-[11px] font-medium opacity-80 truncate">{label}</div>
        <div className="text-[13px] sm:text-lg font-bold truncate">{value}</div>
    </div>
);

const Pager = ({ page, total, onChange }) => (
    <div className="flex items-center justify-between gap-3 pt-3">
        <span className="text-xs text-slate-500">
            Page <b className="text-slate-700">{page}</b> of <b className="text-slate-700">{total}</b>
        </span>
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                aria-label="Previous page"
                className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
                <FaChevronLeft size={10} /> <span className="hidden sm:inline">Previous</span>
            </button>
            <button
                type="button"
                onClick={() => onChange(page + 1)}
                disabled={page === total}
                aria-label="Next page"
                className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50"
            >
                <span className="hidden sm:inline">Next</span> <FaChevronRight size={10} />
            </button>
        </div>
    </div>
);

const StockProducts = () => {
    const navigate = useNavigate();
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [salesBulkReturns, setSalesBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ product: '', company: '', companyContact: '' });
    const [hideEmpty, setHideEmpty] = useState(false);
    const [qtyType, setQtyType] = useState('all');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyShow, setHistoryShow] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    // Product / Company select options (/product, /company api theke)
    const [companies, setCompanies] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const productDropdownRef = useRef(null);
    const companyDropdownRef = useRef(null);

    useEffect(() => {
        fetch('http://localhost:5000/company')
            .then((res) => res.json())
            .then((data) => setCompanies(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching companies:', error));
        fetch('http://localhost:5000/product')
            .then((res) => res.json())
            .then((data) => setProductOptions(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setIsProductOpen(false);
            }
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCompanyOptions = companies.filter((c) => {
        const s = filters.company.toLowerCase();
        return (
            (c.businessName || '').toLowerCase().includes(s) ||
            (c.contactNumber || '').toLowerCase().includes(s)
        );
    });
    const getCompanyPhone = (p) =>
        p.companyContact ||
        companies.find((c) => (c.businessName || '').trim().toLowerCase() === (p.company || '').trim().toLowerCase())?.contactNumber ||
        '';
    const filteredProductOptions = productOptions.filter((p) => {
        if (!p.productName || p.isActive === false) return false;
        const s = filters.product.toLowerCase();
        return (
            p.productName.toLowerCase().includes(s) ||
            (p.company || '').toLowerCase().includes(s) ||
            (p.companyContact || '').toLowerCase().includes(s)
        );
    });

    const handleSelectCompany = (c) => {
        setFilters({ company: c.businessName, companyContact: c.contactNumber || '', product: '' });
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };
    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, company: '', companyContact: '' }));
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };
    const handleSelectProduct = (p) => {
        setFilters({ product: p.productName?.trim() || '', company: p.company?.trim() || '', companyContact: getCompanyPhone(p) });
        setIsProductOpen(false);
        setCurrentPage(1);
    };
    const handleClearProduct = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, product: '', company: '', companyContact: '' }));
        setIsProductOpen(false);
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ product: '', company: '', companyContact: '' });
        setHideEmpty(false);
        setQtyType('all');
        setIsProductOpen(false);
        setIsCompanyOpen(false);
        setSelectedKeys([]);
        setCurrentPage(1);
    };
    const itemsPerPage = 30;

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetch('http://localhost:5000/stock-purchase');
                const data = await res.json();
                setBatches(Array.isArray(data) ? data : []);

                const purchaseRes = await fetch('http://localhost:5000/purchase');
                const purchaseData = await purchaseRes.json();
                setPurchases(Array.isArray(purchaseData) ? purchaseData : []);

                const salesRes = await fetch('http://localhost:5000/sales');
                const salesData = await salesRes.json();
                setSales(Array.isArray(salesData) ? salesData : []);

                const bulkRes = await fetch('http://localhost:5000/purchase-bulk-return');
                const bulkData = await bulkRes.json();
                setBulkReturns(Array.isArray(bulkData) ? bulkData : []);

                const sbRes = await fetch('http://localhost:5000/sales-bulk-return');
                const sbData = await sbRes.json();
                setSalesBulkReturns(Array.isArray(sbData) ? sbData : []);

                const dmgRes = await fetch('http://localhost:5000/sales-damage');
                const dmgData = await dmgRes.json();
                setDamages(Array.isArray(dmgData) ? dmgData : []);

                const adjRes = await fetch('http://localhost:5000/stock-adjustment');
                const adjData = await adjRes.json();
                setAdjustments(Array.isArray(adjData) ? adjData : []);
            } catch (error) {
                console.error('Error fetching stock products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Batch wise available qty (purchase return + sales + customer return hisab hoye)
    const stockRows = useMemo(() => {
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const bulkMap = new Map();
        bulkReturns.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = bulkMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += Number(a.qty) || 0;
                bulkMap.set(k, cur);
            })
        );
        const sbMap = new Map();
        salesBulkReturns.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = sbMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += Number(a.qty) || 0;
                sbMap.set(k, cur);
            })
        );
        const dmgMap = new Map();
        damages.forEach((d) =>
            (d.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = dmgMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += Number(a.qty) || 0;
                dmgMap.set(k, cur);
            })
        );
        const adjMap = new Map();
        adjustments.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = adjMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += (a.direction === 'out' ? 1 : -1) * (Number(a.qty) || 0);
                adjMap.set(k, cur);
            })
        );
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
            const sold = { paid: sold0.paid - sb.paid + dm.paid + ad.paid, free: sold0.free - sb.free + dm.free + ad.free };
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

    // Product name + company onujayi unique row
    const products = useMemo(() => {
        const map = new Map();
        stockRows.forEach((b, idx) => {
            const name = (b.productName || '').toString().trim();
            const company = (b.company || '').toString().trim();
            const key = `${name.toLowerCase()}|${company.toLowerCase()}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    productName: name || 'N/A',
                    company: company || 'N/A',
                    companyContact: (b.companyContact || '').toString().trim(),
                    main: 0,
                    free: 0,
                    value: 0,
                    batchCount: 0,
                    lastIdx: -1,
                    info: null,
                });
            }
            const g = map.get(key);
            g.main += Number(b.availPaidQty) || 0;
            g.free += Number(b.availFreeQty) || 0;
            g.value += getValue(b);
            g.batchCount += 1;
            g.lastIdx = idx;

            const per = getPerUnit(b);
            if (per > 1) {
                g.info = { per, perSub: getPerSub(b), unit: b.unit, subUnit: b.subUnit };
            }
        });

        return Array.from(map.values())
            .map((g) => ({ ...g, total: g.main + g.free }))
            .sort((a, b) => b.lastIdx - a.lastIdx);
    }, [stockRows]);

    // ===== Overall History (latest 30, product wise) =====
    const HISTORY_STYLE = {
        purchase: { label: 'Purchase', sign: '+', cls: 'bg-indigo-100 text-indigo-700' },
        company: { label: 'Company Return', sign: '−', cls: 'bg-rose-100 text-rose-700' },
        sold: { label: 'Sold', sign: '−', cls: 'bg-orange-100 text-orange-700' },
        customer: { label: 'Customer Return', sign: '+', cls: 'bg-violet-100 text-violet-700' },
        damage: { label: 'Damage', sign: '−', cls: 'bg-red-100 text-red-700' },
        adjIn: { label: 'Adjustment In', sign: '+', cls: 'bg-amber-100 text-amber-700' },
        adjOut: { label: 'Adjustment Out', sign: '−', cls: 'bg-amber-100 text-amber-700' },
    };

    const historyEvents = useMemo(() => {
        const num = (v) => Number(v) || 0;
        const toTime = (d) => {
            if (!d) return 0;
            const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
            if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
            const t = Date.parse(d);
            return !isNaN(t) ? t : 0;
        };
        const oidTime = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);
        const createdTs = (o) => {
            const c = o?.createdAt ? Date.parse(o.createdAt) : NaN;
            return !isNaN(c) ? c : oidTime(o?._id);
        };
        const retTs = (ret, parent) => {
            const c = ret.createdAt ? Date.parse(ret.createdAt) : NaN;
            if (!isNaN(c)) return c;
            const d = toTime(ret.returnDate || ret.date);
            const endOfDay = d ? d + 24 * 60 * 60 * 1000 - 1000 : 0;
            return Math.max(endOfDay, createdTs(parent) + 1);
        };
        const batchById = new Map(stockRows.map((b) => [String(b._id), b]));
        const pKey = (b) => `${(b.productName || '').toString().trim().toLowerCase()}|${(b.company || '').toString().trim().toLowerCase()}`;
        const infoByKey = new Map(products.map((p) => [p.key, p.info]));

        const map = new Map();
        let seq = 0;
        const add = (type, refKey, ref, date, ts, bs, main, free, meta = {}) => {
            const list = (bs || []).filter(Boolean);
            if (!list.length || (main <= 0 && free <= 0)) return;
            const pk = pKey(list[0]);
            const k = `${type}|${refKey}|${pk}`;
            if (!map.has(k)) {
                map.set(k, {
                    key: k,
                    type,
                    ref,
                    date: date || '',
                    time: ts || toTime(date),
                    seq: seq++,
                    productName: list[0].productName,
                    company: list[0].company,
                    info: infoByKey.get(pk) || null,
                    main: 0,
                    free: 0,
                    ids: new Set(),
                    orderKeys: new Set(),
                    ...meta,
                });
            }
            const e = map.get(k);
            e.main += main;
            e.free += free;
            list.forEach((b) => {
                e.ids.add(String(b._id));
                e.orderKeys.add(b.purchaseId || b.invoiceNo);
            });
        };

        // Purchase
        stockRows.forEach((b) => {
            add(
                'purchase',
                b.purchaseId || b.invoiceNo,
                b.invoiceNo,
                b.receiveDate || b.purchaseDate,
                createdTs(b),
                [b],
                b.isFreeProduct ? 0 : num(b.origPaidQty),
                num(b.origFreeQty)
            );
        });

        // Company Return
        purchases.forEach((p) => {
            (p.returnHistory || []).forEach((ret, ri) => {
                const refKey = `${p._id}-${ret.returnId || ri}`;
                const ts = retTs(ret, p);
                const date = ret.returnDate || ret.date || ret.createdAt;
                const meta = { returnId: ret.returnId || '' };
                const batchesOf = (pid, free) => {
                    const all = stockRows.filter((b) => String(b.purchaseId) === String(p._id) && String(b.productId) === String(pid));
                    const pref = all.filter((b) => !!b.isFreeProduct === free);
                    return pref.length ? pref : all;
                };
                (ret.items || []).forEach((it) => {
                    add('company', refKey, p.invoiceNo, date, ts, batchesOf(it.productId, false), num(it.returnTotalQty), num(it.returnFreeTotalQty ?? it.returnFreeQty), meta);
                });
                (ret.freeItems || []).forEach((it) => {
                    add('company', refKey, p.invoiceNo, date, ts, batchesOf(it.productId, true), 0, num(it.returnTotalQty), meta);
                });
            });
        });

        // Bulk Return
        bulkReturns.forEach((r) => {
            const refKey = `bulk-${r._id}`;
            const ts = createdTs(r) || toTime(r.returnDate);
            (r.items || []).forEach((it) => {
                const bs = (r.stockAllocations || [])
                    .filter((a) => String(a.productId) === String(it.productId))
                    .map((a) => batchById.get(String(a.batchId)));
                add('company', refKey, r.invoiceNo, r.returnDate, ts, bs, num(it.totalPcs), num(it.freeTotalQty), { returnId: '', bulkId: r._id, isBulk: true });
            });
        });

        // Sold + Customer Return
        sales.forEach((s) => {
            const allocs = s.stockAllocations || [];
            if (!allocs.length) return;
            const soldTs = (s.deliveredAt ? Date.parse(s.deliveredAt) : 0) || createdTs(s) || toTime(s.deliveryDate || s.orderDate);
            const soldDate = s.deliveryDate || s.orderDate || s.createdAt;
            allocs.forEach((a) => {
                const q = num(a.qty);
                const isMain = (a.kind || 'main') === 'main';
                add('sold', s._id, s.orderNo, soldDate, soldTs, [batchById.get(String(a.batchId))], isMain ? q : 0, isMain ? 0 : q, { saleId: s._id });
            });

            (s.returnHistory || []).forEach((ret, ri) => {
                const refKey = `${s._id}-${ret.returnId || ri}`;
                const ts = retTs(ret, s);
                const date = ret.returnDate || ret.date || ret.createdAt;
                const meta = { saleId: s._id, returnId: ret.returnId || '' };
                const bOf = (pid) =>
                    allocs.filter((a) => String(a.productId) === String(pid)).map((a) => batchById.get(String(a.batchId))).filter(Boolean);
                (ret.items || []).forEach((it) => {
                    add('customer', refKey, s.orderNo, date, ts, bOf(it.productId), num(it.returnTotalQty), num(it.returnFreeTotalQty ?? it.returnFreeQty), meta);
                });
                (ret.freeItems || []).forEach((it) => {
                    add('customer', refKey, s.orderNo, date, ts, bOf(it.productId), 0, num(it.returnTotalQty), meta);
                });
            });
        });

        // Damage (stock minus)
        damages.forEach((d) => {
            const refKey = `damage-${d._id}`;
            const ts = createdTs(d) || toTime(d.damageDate);
            (d.items || []).forEach((it) => {
                const bs = (d.stockAllocations || [])
                    .filter((a) => String(a.productId) === String(it.productId))
                    .map((a) => batchById.get(String(a.batchId)));
                add('damage', refKey, d.invoiceNo, d.damageDate, ts, bs, num(it.totalQty), num(it.freeQty), { returnId: '', damageId: d._id });
            });
        });

        // Adjustment (In = stock plus, Out = stock minus)
        adjustments.forEach((a) => {
            const ts = createdTs(a) || toTime(a.adjustmentDate);
            (a.stockAllocations || []).forEach((al) => {
                const q = num(al.qty);
                const isPaid = al.pool === 'paid';
                add(
                    al.direction === 'out' ? 'adjOut' : 'adjIn',
                    `adj-${a._id}`,
                    a.invoiceNo,
                    a.adjustmentDate,
                    ts,
                    [batchById.get(String(al.batchId))],
                    isPaid ? q : 0,
                    isPaid ? 0 : q,
                    { adjustId: a._id }
                );
            });
        });

        // Sales Bulk Return (Customer Return, stock plus)
        salesBulkReturns.forEach((r) => {
            const refKey = `sbulk-${r._id}`;
            const ts = createdTs(r) || toTime(r.returnDate);
            (r.items || []).forEach((it) => {
                const bs = (r.stockAllocations || [])
                    .filter((a) => String(a.productId) === String(it.productId))
                    .map((a) => batchById.get(String(a.batchId)));
                add('customer', refKey, r.invoiceNo, r.returnDate, ts, bs, num(it.totalQty), num(it.freeQty), { returnId: '', bulkId: r._id, isBulk: true, saleId: r.saleId });
            });
        });

        return Array.from(map.values())
            .map((e) => ({ ...e, ids: [...e.ids], orderKeys: [...e.orderKeys] }))
            .sort((a, b) => b.time - a.time || b.seq - a.seq)
            .slice(0, 30);
    }, [stockRows, purchases, sales, products, bulkReturns, salesBulkReturns, damages, adjustments]);
    // qty -> "2 Box 4 pcs" + "(14 pcs)"
    const histQty = (total, info) => {
        const pcsText = `${fmt(total)} pcs`;
        let text = pcsText;
        if (info && info.per > 1) {
            const [u, s, p] = splitQty(total, info.per, info.perSub);
            const t = fmtQty(u, s, p, info.unit, info.subUnit);
            text = t === '—' ? pcsText : t;
        }
        return { text, pcsText, showChip: text !== pcsText };
    };

    const openHistory = () => {
        setHistoryOpen(true);
        setTimeout(() => setHistoryShow(true), 10);
    };
    const closeHistory = () => {
        setHistoryShow(false);
        setTimeout(() => setHistoryOpen(false), 300);
    };
    // modal smoothly bondho hoye tarpor Stock Purchase tab e niye jabe
    const openHistoryItem = (e) => {
        setHistoryShow(false);
        setTimeout(() => {
            setHistoryOpen(false);
            navigate('/stock-purchase', { state: { focusEvent: { ...e, nonce: Date.now() } } });
        }, 300);
    };

    const filtered = useMemo(() => {
        const pq = filters.product.trim().toLowerCase();
        const cq = filters.company.trim().toLowerCase();
        return products.filter((p) => {
            if (hideEmpty && p.total <= 0) return false;
            if (qtyType === 'main' && p.main <= 0) return false;
            if (qtyType === 'free' && p.free <= 0) return false;
            if (pq && !p.productName.toLowerCase().includes(pq)) return false;
            if (cq && !p.company.toLowerCase().includes(cq)) return false;
            if (filters.companyContact && p.companyContact && p.companyContact !== filters.companyContact) return false;
            return true;
        });
    }, [products, filters, hideEmpty, qtyType]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safePage - 1) * itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    // Checkbox select (Select All = current page er sob row)
    const isAllSelected = currentItems.length > 0 && currentItems.every((p) => selectedKeys.includes(p.key));
    const handleSelectAll = () => {
        const keys = currentItems.map((p) => p.key);
        if (isAllSelected) {
            setSelectedKeys((prev) => prev.filter((k) => !keys.includes(k)));
        } else {
            setSelectedKeys((prev) => [...new Set([...prev, ...keys])]);
        }
    };
    const handleSelectRow = (key) => {
        setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    // Select thakle selected row er total, na thakle filter kora sob row er total
    const selectedRows = filtered.filter((p) => selectedKeys.includes(p.key));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filtered;

    const grandMain = summaryRows.reduce((s, p) => s + p.main, 0);
    const grandFree = summaryRows.reduce((s, p) => s + p.free, 0);
    const grandTotal = grandMain + grandFree;
    const grandValue = summaryRows.reduce((s, p) => s + p.value, 0);

    const [showFilters, setShowFilters] = useState(false);
    const activeCount = [filters.product, filters.company, qtyType !== 'all', hideEmpty].filter(Boolean).length;

    const HistQtyCell = ({ e }) => {
        const plus = HISTORY_STYLE[e.type].sign === '+';
        return (
            <div className="flex flex-col gap-1">
                {[{ k: 'main', v: e.main }, { k: 'free', v: e.free }]
                    .filter((x) => x.v > 0)
                    .map((x) => {
                        const q = histQty(x.v, e.info);
                        return (
                            <div key={x.k} className="flex flex-wrap items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${x.k === 'main' ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                    {x.k === 'main' ? 'Main' : 'Free'}
                                </span>
                                <span className={`text-sm font-bold ${plus ? 'text-emerald-600' : 'text-rose-600'}`}>
                                    {HISTORY_STYLE[e.type].sign}{q.text}
                                </span>
                                {q.showChip && (
                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${plus ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                                        ({q.pcsText})
                                    </span>
                                )}
                            </div>
                        );
                    })}
            </div>
        );
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            {/* Overall History Modal */}
            {historyOpen && (
                <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 transition-opacity duration-300 ${historyShow ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-slate-900/40" onClick={closeHistory} />
                    <div className={`relative w-full sm:max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${historyShow ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'}`}>
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-brand-600 text-white">
                            <div>
                                <h3 className="text-base font-bold">Overall History</h3>
                                <p className="text-xs text-white/80 mt-0.5">Latest {historyEvents.length} activities</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeHistory}
                                aria-label="Close"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition"
                            >
                                <FaTimes size={13} />
                            </button>
                        </div>

                        <div className="max-h-[78vh] sm:max-h-[75vh] overflow-y-auto">
                            {historyEvents.length === 0 ? (
                                <div className="py-14 text-center text-sm text-slate-400">কোনো history নেই</div>
                            ) : (
                                <>
                                    {/* Mobile cards */}
                                    <div className="md:hidden p-3 space-y-2">
                                        {historyEvents.map((e) => {
                                            const st = HISTORY_STYLE[e.type];
                                            return (
                                                <div key={e.key} className="rounded-2xl border border-slate-200 p-3">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-800 text-sm break-words">{e.productName}</div>
                                                            <div className="text-xs text-slate-400">{e.company}</div>
                                                        </div>
                                                        <span className="text-[11px] text-slate-500 whitespace-nowrap">{e.date || 'N/A'}</span>
                                                    </div>
                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>
                                                            {st.label}{e.isBulk ? ' - Bulk' : ''} ({st.sign})
                                                        </span>
                                                        <span className="text-xs text-slate-500">#{e.ref}</span>
                                                    </div>
                                                    <div className="mt-2 flex items-end justify-between gap-2">
                                                        <HistQtyCell e={e} />
                                                        <button
                                                            type="button"
                                                            onClick={() => openHistoryItem(e)}
                                                            className="h-10 px-4 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-100"
                                                        >
                                                            Open
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Desktop table */}
                                    <table className="hidden md:table w-full text-left border-collapse">
                                        <thead className="sticky top-0">
                                            <tr className="bg-slate-50 text-slate-600 text-xs font-semibold">
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3">Product</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3">Qty</th>
                                                <th className="py-2.5 px-3 text-center">Open</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                            {historyEvents.map((e) => {
                                                const st = HISTORY_STYLE[e.type];
                                                return (
                                                    <tr key={e.key} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{e.date || 'N/A'}</td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            <div className="font-semibold text-slate-800">{e.productName}</div>
                                                            <div className="text-xs text-slate-400">{e.company}</div>
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>
                                                                {st.label}{e.isBulk ? ' - Bulk' : ''} ({st.sign})
                                                            </span>
                                                            <div className="text-xs text-slate-500 mt-0.5">#{e.ref}</div>
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap"><HistQtyCell e={e} /></td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => openHistoryItem(e)}
                                                                className="h-9 px-4 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-100"
                                                            >
                                                                Open
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
                {/* Header + totals */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3 mb-3">
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Stock Products</h2>
                        <button
                            type="button"
                            onClick={openHistory}
                            className="h-10 px-4 rounded-full bg-brand-600 text-white text-sm font-semibold"
                        >
                            History
                        </button>
                    </div>
                    <div className="grid grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2.5">
                        <Stat label={isSelectionMode ? 'Selected' : 'Products'} value={fmt(summaryRows.length)} tone="slate" />
                        <Stat label="Main Qty" value={`${fmt(grandMain)} pcs`} tone="brand" />
                        <Stat label="Free Qty" value={`${fmt(grandFree)} pcs`} tone="emerald" />
                        <Stat label="Total Qty" value={`${fmt(grandTotal)} pcs`} tone="amber" />
                        <div className="col-span-2 lg:col-span-1">
                            <Stat label="Stock Value" value={`৳${fmt(grandValue)}`} tone="emerald" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            className="sm:pointer-events-none h-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-700"
                        >
                            <FaFilter className="text-brand-600" size={13} /> Filter & Search
                            {activeCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[11px]">{activeCount}</span>
                            )}
                            <span className="sm:hidden text-slate-400 text-xs">{showFilters ? '▲' : '▼'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                            {isSelectionMode && (
                                <button
                                    type="button"
                                    onClick={() => setSelectedKeys([])}
                                    className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-slate-50"
                                >
                                    Clear selection ({selectedRows.length})
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handleClearFilters}
                                className="h-10 px-3 inline-flex items-center gap-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-rose-50 hover:text-rose-600"
                            >
                                <FaRedo size={11} /> Clear all
                            </button>
                        </div>
                    </div>

                    <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-2 lg:grid-cols-4 gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}>
                        {/* Product */}
                        <div className="relative" ref={productDropdownRef}>
                            <label className={labelCls}>Product</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search or select product..."
                                    autoComplete="off"
                                    value={filters.product}
                                    onFocus={() => setIsProductOpen(true)}
                                    onChange={(e) => {
                                        setFilters((prev) => ({ ...prev, product: e.target.value, company: '', companyContact: '' }));
                                        setIsProductOpen(true);
                                        setCurrentPage(1);
                                    }}
                                    className={`${inputCls} pr-9`}
                                />
                                {filters.product && (
                                    <button type="button" onClick={handleClearProduct} aria-label="Clear product" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500">
                                        <FaTimes size={11} />
                                    </button>
                                )}
                            </div>
                            {isProductOpen && (
                                <div className="absolute z-[60] left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto">
                                    {filteredProductOptions.length > 0 ? (
                                        filteredProductOptions.map((p) => (
                                            <div key={p._id} onClick={() => handleSelectProduct(p)} className="px-3 py-2.5 hover:bg-brand-50 cursor-pointer border-b border-slate-50 last:border-none">
                                                <div className="text-sm font-semibold text-slate-800">{p.productName}</div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {p.company || 'N/A'}{getCompanyPhone(p) ? ` | ${getCompanyPhone(p)}` : ''}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-3 text-xs text-slate-400 text-center">No product found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Company */}
                        <div className="relative" ref={companyDropdownRef}>
                            <label className={labelCls}>Company</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search or select company..."
                                    autoComplete="off"
                                    value={filters.company}
                                    onFocus={() => setIsCompanyOpen(true)}
                                    onChange={(e) => {
                                        setFilters((prev) => ({ ...prev, company: e.target.value, companyContact: '' }));
                                        setIsCompanyOpen(true);
                                        setCurrentPage(1);
                                    }}
                                    className={`${inputCls} pr-9`}
                                />
                                {filters.company && (
                                    <button type="button" onClick={handleClearCompany} aria-label="Clear company" className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500">
                                        <FaTimes size={11} />
                                    </button>
                                )}
                            </div>
                            {isCompanyOpen && (
                                <div className="absolute z-[60] left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto">
                                    {filteredCompanyOptions.length > 0 ? (
                                        filteredCompanyOptions.map((c) => (
                                            <div key={c._id} onClick={() => handleSelectCompany(c)} className="px-3 py-2.5 hover:bg-brand-50 cursor-pointer border-b border-slate-50 last:border-none">
                                                <p className="text-sm font-semibold text-slate-800">{c.businessName}</p>
                                                {c.contactNumber && <p className="text-xs text-slate-500 mt-0.5">{c.contactNumber}</p>}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-3 text-xs text-slate-400 text-center">No company found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Qty Type */}
                        <div>
                            <label className={labelCls}>Qty Type</label>
                            <select
                                value={qtyType}
                                onChange={(e) => { setQtyType(e.target.value); setCurrentPage(1); }}
                                className={inputCls}
                            >
                                <option value="all">All</option>
                                <option value="main">Main</option>
                                <option value="free">Free</option>
                            </select>
                        </div>

                        {/* Hide empty */}
                        <div>
                            <label className={labelCls}>Stock</label>
                            <button
                                type="button"
                                onClick={() => { setHideEmpty((v) => !v); setCurrentPage(1); }}
                                className={`w-full h-10 px-3 text-sm font-semibold rounded-xl border transition ${hideEmpty
                                    ? 'bg-brand-50 border-brand-300 text-brand-700'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                            >
                                {hideEmpty ? 'Showing in stock only' : 'Hide out of stock'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">Product Stock</h3>
                        <span className="px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 font-semibold text-xs rounded-full">
                            {filtered.length} products
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-2" aria-busy="true">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-slate-500 font-semibold">কোনো product পাওয়া যায়নি</div>
                            <div className="text-xs text-slate-400 mt-1">Filter বদলে আবার চেষ্টা করুন</div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1">
                                <label className="flex items-center gap-2 px-1 text-[11px] text-slate-500 h-7">
                                    <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-4 h-4 accent-brand-600" />
                                    Select all
                                </label>
                                {currentItems.map((p) => {
                                    const sel = selectedKeys.includes(p.key);
                                    return (
                                        <div
                                            key={p.key}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${p.total > 0 ? 'bg-brand-500' : 'bg-rose-400'}`} />
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(p.key)}
                                                    aria-label={`Select ${p.productName}`}
                                                    className="w-4 h-4 accent-brand-600 shrink-0"
                                                />
                                                <p className="flex-1 min-w-0 font-bold text-[14px] text-brand-700 break-words leading-tight">{p.productName}</p>
                                                {p.total <= 0 && (
                                                    <span className="shrink-0 px-1.5 py-px rounded-full bg-rose-50 text-rose-600 text-[9px] font-bold">Out</span>
                                                )}
                                                <span className="shrink-0 px-1.5 py-px rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                                                    ৳{fmt(p.value)}
                                                </span>
                                            </div>
                                            <p className="text-[11.5px] text-slate-500 leading-snug break-words mt-1">
                                                <span className="font-semibold text-slate-700">{p.company}</span>
                                                {p.companyContact && <> • 📞 {p.companyContact}</>}
                                                <> • {p.batchCount} batch{p.batchCount > 1 ? 'es' : ''}</>
                                            </p>
                                            <div className="grid grid-cols-3 gap-1.5 mt-2">
                                                <MiniQty label="Main" total={p.main} info={p.info} tone="text-brand-700" bg="bg-brand-50" />
                                                <MiniQty label="Free" total={p.free} info={p.info} tone="text-emerald-700" bg="bg-emerald-50" />
                                                <MiniQty
                                                    label="Total"
                                                    total={p.total}
                                                    info={p.info}
                                                    tone={p.total > 0 ? 'text-slate-800' : 'text-rose-600'}
                                                    bg={p.total > 0 ? 'bg-slate-50' : 'bg-rose-50'}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[900px] text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-xs font-semibold whitespace-nowrap">
                                            <th className="py-3 px-3 w-10 text-center">
                                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                            </th>
                                            <th className="py-3 px-3 w-12">#</th>
                                            <th className="py-3 px-3">Product</th>
                                            <th className="py-3 px-3">Company</th>
                                            <th className="py-3 px-3">Main Qty</th>
                                            <th className="py-3 px-3">Free Qty</th>
                                            <th className="py-3 px-3">Total Qty</th>
                                            <th className="py-3 px-3 text-right">Stock Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {currentItems.map((p, i) => (
                                            <tr key={p.key} className={`${selectedKeys.includes(p.key) ? 'bg-brand-50/60' : 'hover:bg-slate-50/70'} transition-colors`}>
                                                <td className="py-3 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedKeys.includes(p.key)}
                                                        onChange={() => handleSelectRow(p.key)}
                                                        aria-label={`Select ${p.productName}`}
                                                        className="w-4 h-4 accent-brand-600 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3 px-3 text-slate-400 font-medium">{indexOfFirstItem + i + 1}</td>
                                                <td className="py-3 px-3">
                                                    <div className="font-semibold text-slate-800">{p.productName}</div>
                                                    <div className="text-[11px] text-slate-400">{p.batchCount} batch{p.batchCount > 1 ? 'es' : ''}</div>
                                                </td>
                                                <td className="py-3 px-3 text-slate-600">
                                                    <div>{p.company}</div>
                                                    {p.companyContact && <div className="text-xs text-slate-400 mt-0.5">{p.companyContact}</div>}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.main} info={p.info} valueClass="text-brand-700" chipClass="bg-brand-50 border-brand-200 text-brand-600" />
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-emerald-50 border-emerald-200 text-emerald-600" />
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock
                                                        total={p.total}
                                                        info={p.info}
                                                        valueClass={p.total > 0 ? 'text-slate-800' : 'text-rose-600'}
                                                        chipClass={p.total > 0 ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-rose-50 border-rose-200 text-rose-500'}
                                                    />
                                                    {p.total <= 0 && <span className="text-[10px] font-bold text-rose-500">Out of stock</span>}
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">৳{fmt(p.value)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pager page={safePage} total={totalPages} onChange={handlePageChange} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockProducts;