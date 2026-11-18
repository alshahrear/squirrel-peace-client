import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

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

const qtyText = (total, info) => {
    const pcs = `${fmt(total)} pcs`;
    if (info && info.per > 1) {
        const [u, s, p] = splitQty(total, info.per, info.perSub);
        const t = fmtQty(u, s, p, info.unit, info.subUnit);
        if (t !== '—') return { text: t, pcs, chip: true };
    }
    return { text: pcs, pcs, chip: false };
};

const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const labelCls = 'block text-slate-600 text-xs font-medium mb-1';

const QtyBlock = ({ total, info, valueClass = 'text-slate-800', chipClass = 'bg-slate-50 border-slate-200 text-slate-600' }) => {
    if (!total || total <= 0) return <span className="text-slate-300 font-bold">—</span>;
    const q = qtyText(total, info);
    return (
        <div className="flex flex-col items-start gap-1 leading-tight">
            <span className={`text-sm font-bold ${valueClass}`}>{q.text}</span>
            {q.chip && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${chipClass}`}>({q.pcs})</span>
            )}
        </div>
    );
};

const MiniQty = ({ label, total, info, tone, bg }) => {
    const q = qtyText(total, info);
    return (
        <div className={`rounded-lg px-2 py-1.5 min-w-0 ${bg}`}>
            <div className="text-[10px] font-bold uppercase text-slate-400 leading-none mb-1">{label}</div>
            <div className={`text-[12.5px] font-bold leading-snug break-words ${tone}`}>{total > 0 ? q.text : '—'}</div>
            {total > 0 && q.chip && <div className="text-[10px] font-semibold text-slate-400 leading-tight">({q.pcs})</div>}
        </div>
    );
};

const STAT_TONE = {
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
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
            <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page"
                className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer">
                <FaChevronLeft size={10} /> <span className="hidden sm:inline">Previous</span>
            </button>
            <button type="button" onClick={() => onChange(page + 1)} disabled={page === total} aria-label="Next page"
                className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer">
                <span className="hidden sm:inline">Next</span> <FaChevronRight size={10} />
            </button>
        </div>
    </div>
);

// Search + select combo. options: [{ key, title, sub, onPick }]
const Combo = ({ label, value, placeholder, onType, onClear, options, emptyText }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className="relative" ref={ref}>
            <label className={labelCls}>{label}</label>
            <div className="relative">
                <input
                    type="text"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={value}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        onType(e.target.value);
                        setOpen(true);
                    }}
                    className={`${inputCls} pr-9`}
                />
                {value && (
                    <button type="button" aria-label={`Clear ${label}`}
                        onClick={() => { onClear(); setOpen(false); }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer">
                        <FaTimes size={11} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-[60] left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto">
                    {options.length > 0 ? (
                        options.map((o) => (
                            <div key={o.key} onClick={() => { o.onPick(); setOpen(false); }}
                                className="px-3 py-2.5 hover:bg-brand-50 cursor-pointer border-b border-slate-50 last:border-none">
                                <p className="text-sm font-semibold text-slate-800">{o.title}</p>
                                {o.sub && <p className="text-xs text-slate-500 mt-0.5">{o.sub}</p>}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-3 text-xs text-slate-400 text-center">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const HISTORY_STYLE = {
    in: { label: 'Stock In', cls: 'bg-emerald-100 text-emerald-700' },
    out: { label: 'Stock Out', cls: 'bg-rose-100 text-rose-700' },
};

const HistLines = ({ e }) => {
    const plus = e.type === 'in';
    return (
        <div className="flex flex-col gap-2">
            {(e.lines || []).map((l) => (
                <div key={l.name} className="flex flex-col gap-1">
                    <div className="text-[11px] font-bold text-slate-500">{l.name}</div>
                    {[{ k: 'main', v: l.main }, { k: 'free', v: l.free }]
                        .filter((x) => x.v > 0)
                        .map((x) => {
                            const q = qtyText(x.v, l.info);
                            return (
                                <div key={x.k} className="flex flex-wrap items-center gap-1.5">
                                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${x.k === 'main' ? 'bg-brand-100 text-brand-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                        {x.k === 'main' ? 'Main' : 'Free'}
                                    </span>
                                    <span className={`text-sm font-bold ${plus ? 'text-emerald-600' : 'text-rose-600'}`}>
                                        {plus ? '+' : '−'}{q.text}
                                    </span>
                                    {q.chip && (
                                        <span className={`px-2 py-0.5 rounded-full border text-[11px] font-bold ${plus ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                                            ({q.pcs})
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                </div>
            ))}
        </div>
    );
};

const DamageStockProducts = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ product: '', company: '', companyContact: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [companies, setCompanies] = useState([]);
    const itemsPerPage = 30;
    const [purchases, setPurchases] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyShow, setHistoryShow] = useState(false);
    const [productList, setProductList] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/purchase')
            .then((res) => res.json())
            .then((d) => setPurchases(Array.isArray(d) ? d : []))
            .catch(() => setPurchases([]));
        fetch('http://localhost:5000/damage-return')
            .then((res) => res.json())
            .then((d) => setDamageReturns(Array.isArray(d) ? d : []))
            .catch(() => setDamageReturns([]));
        fetch('http://localhost:5000/product')
            .then((res) => res.json())
            .then((d) => setProductList(Array.isArray(d) ? d : []))
            .catch(() => setProductList([]));
        fetch('http://localhost:5000/company')
            .then((res) => res.json())
            .then((d) => setCompanies(Array.isArray(d) ? d : []))
            .catch(() => setCompanies([]));
    }, []);

    // Company return gulo damage invoice er sathe FIFO match hobe (invoice delete hole tar return ar hisab e ashbe na)
    const returnedMap = useMemo(() => {
        const num = (v) => Number(v) || 0;
        const kOf = (it) =>
            `${(it.productName || '').toString().trim().toLowerCase()}|${(it.company || '').toString().trim().toLowerCase()}`;

        const invs = orders
            .filter((o) => o.status === 'Delivered' && (o.damageItems || []).length > 0)
            .map((o) => ({
                ts: Date.parse(o.isStandaloneDamage ? o.createdAt : (o.damageAt || o.createdAt)) || 0,
                stock: o.isStandaloneDamage === true && !o.customerId,
                items: o.damageItems || [],
            }))
            .sort((a, b) => a.ts - b.ts);

        const lineMap = new Map();
        invs.forEach((inv) => {
            const m = new Map();
            inv.items.forEach((it) => {
                const k = kOf(it);
                if (!m.has(k)) m.set(k, { ts: inv.ts, stock: inv.stock, main: 0, free: 0, value: 0, retMain: 0, retFree: 0 });
                const l = m.get(k);
                l.main += num(it.totalQty);
                l.free += num(it.freeQty);
                l.value += num(it.itemTotal ?? it.subtotal);
            });
            m.forEach((l, k) => {
                if (!lineMap.has(k)) lineMap.set(k, []);
                lineMap.get(k).push(l);
            });
        });

        const evs = [];
        purchases
            .filter((p) => (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') && (p.damageItems || []).length > 0)
            .forEach((p) => evs.push({ ts: Date.parse(p.damageAt || p.createdAt) || 0, items: p.damageItems || [] }));
        damageReturns.forEach((r) => evs.push({ ts: Date.parse(r.createdAt) || 0, items: r.items || [] }));
        evs.sort((a, b) => a.ts - b.ts);

        evs.forEach((ev) =>
            ev.items.forEach((it) => {
                let mq = num(it.totalQty) - num(it.mainFromFree) + num(it.freeFromMain);
                let fq = num(it.freeQty) - num(it.freeFromMain) + num(it.mainFromFree);
                for (const l of lineMap.get(kOf(it)) || []) {
                    if (mq <= 0 && fq <= 0) break;
                    if (!ev.ts || l.ts > ev.ts) continue;
                    const tm = Math.max(Math.min(mq, l.main - l.retMain), 0);
                    const tf = Math.max(Math.min(fq, l.free - l.retFree), 0);
                    l.retMain += tm;
                    l.retFree += tf;
                    mq -= tm;
                    fq -= tf;
                }
            })
        );

        const out = new Map();
        lineMap.forEach((lines, k) => {
            out.set(k, {
                main: lines.reduce((s, l) => s + l.retMain, 0),
                free: lines.reduce((s, l) => s + l.retFree, 0),
                estQty: lines
                    .filter((l) => !l.stock)
                    .reduce((s, l) => s + Math.max(l.main - l.retMain, 0) + Math.max(l.free - l.retFree, 0), 0),
                stockValue:
                    Math.round(
                        lines
                            .filter((l) => l.stock && l.main > 0)
                            .reduce((s, l) => s + Math.max(l.main - l.retMain, 0) * (l.value / l.main), 0) * 100
                    ) / 100,
            });
        });
        return out;
    }, [orders, purchases, damageReturns]);

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/sales').then((res) => res.json()),
            fetch('http://localhost:5000/sales-damage').then((res) => res.json()).catch(() => []),
        ])
            .then(([sales, dmg]) =>
                setOrders([
                    ...(Array.isArray(sales) ? sales : []),
                    ...(Array.isArray(dmg) ? dmg : []).map((d) => ({
                        ...d,
                        status: 'Delivered',
                        isStandaloneDamage: true,
                        damageItems: d.items || [],
                    })),
                ])
            )
            .catch((error) => console.error('Error fetching orders:', error))
            .finally(() => setLoading(false));
    }, []);

    // Product + Company onujayi unique row
    const allProducts = useMemo(() => {
        const map = new Map();
        orders
            .filter((o) => o.status === 'Delivered')
            .forEach((o, oi) => {
                (o.damageItems || []).forEach((it) => {
                    const name = (it.productName || '').toString().trim();
                    const company = (it.company || '').toString().trim();
                    const key = `${name.toLowerCase()}|${company.toLowerCase()}`;
                    if (!map.has(key)) {
                        map.set(key, {
                            key,
                            productName: name || 'N/A',
                            company: company || 'N/A',
                            companyContact: (it.companyContact || '').toString().trim(),
                            main: 0,
                            free: 0,
                            productId: it.productId,
                            lastIdx: -1,
                            info: null,
                        });
                    }
                    const g = map.get(key);
                    g.main += Number(it.totalQty) || 0;
                    g.free += Number(it.freeQty) || 0;
                    if (!g.productId && it.productId) g.productId = it.productId;
                    g.lastIdx = oi;
                    const per = Number(it.pcsPerUnit) || 0;
                    if (per > 1) {
                        g.info = {
                            per,
                            perSub: it.parentMode === true ? Number(it.pcsPerSub) || 0 : 0,
                            unit: it.unit,
                            subUnit: it.subUnit,
                        };
                    }
                });
            });
        return Array.from(map.values())
            .map((g) => {
                const r = returnedMap.get(g.key) || { main: 0, free: 0, estQty: 0, stockValue: 0 };
                const prod =
                    productList.find((pr) => g.productId && String(pr._id) === String(g.productId)) ||
                    productList.find(
                        (pr) =>
                            `${(pr.productName || '').toString().trim().toLowerCase()}|${(pr.company || '').toString().trim().toLowerCase()}` === g.key
                    );
                const unitPrice = Number(prod?.purchasePrice) || 0;
                const main = Math.max(g.main - r.main, 0);
                const free = Math.max(g.free - r.free, 0);
                return {
                    ...g,
                    main,
                    free,
                    total: main + free,
                    unitPrice,
                    stockValue: r.stockValue,
                    estimateValue: Math.round((unitPrice * r.estQty + r.stockValue) * 100) / 100,
                };
            })
            .filter((g) => g.total > 0)
            .sort((a, b) => b.lastIdx - a.lastIdx);
    }, [orders, returnedMap, productList]);

    // ===== Overall History (Stock In / Stock Out, latest 30) =====
    const historyEvents = useMemo(() => {
        const toTime = (d) => {
            if (!d) return 0;
            const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
            if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
            const t = Date.parse(d);
            return !isNaN(t) ? t : 0;
        };
        const oidTime = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);
        const tsOf = (o, date) => {
            const c = o?.createdAt ? Date.parse(o.createdAt) : NaN;
            if (!isNaN(c)) return c;
            return oidTime(o?._id) || toTime(date);
        };
        const linesOf = (items) => {
            const m = new Map();
            (items || []).forEach((it) => {
                const name = (it.productName || '').toString().trim() || 'N/A';
                if (!m.has(name)) m.set(name, { name, main: 0, free: 0, info: null });
                const g = m.get(name);
                g.main += Number(it.totalQty) || 0;
                g.free += Number(it.freeQty) || 0;
                const per = Number(it.pcsPerUnit) || 0;
                if (per > 1) {
                    g.info = {
                        per,
                        perSub: it.parentMode === true ? Number(it.pcsPerSub) || 0 : 0,
                        unit: it.unit,
                        subUnit: it.subUnit,
                    };
                }
            });
            return Array.from(m.values()).filter((g) => g.main > 0 || g.free > 0);
        };
        const ev = [];

        orders
            .filter((o) => o.status === 'Delivered' && (o.damageItems || []).length > 0)
            .forEach((o) => {
                const date = o.isStandaloneDamage ? o.damageDate : (o.deliveryDate || o.orderDate);
                ev.push({
                    key: `in-${o._id}`,
                    type: 'in',
                    id: o._id,
                    ref: o.invoiceNo || o.orderNo,
                    date: date || '',
                    time: tsOf(o, date),
                    lines: linesOf(o.damageItems),
                });
            });

        purchases
            .filter((p) => (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') && (p.damageItems || []).length > 0)
            .forEach((p) => {
                const date = p.receiveDate || p.purchaseDate;
                ev.push({
                    key: `out-p-${p._id}`,
                    type: 'out',
                    id: p._id,
                    ref: p.invoiceNo,
                    date: date || '',
                    time: tsOf(p, date),
                    lines: linesOf(p.damageItems),
                });
            });

        damageReturns.forEach((r) => {
            ev.push({
                key: `out-r-${r._id}`,
                type: 'out',
                id: r._id,
                ref: r.invoiceNo,
                date: r.returnDate || '',
                time: tsOf(r, r.returnDate),
                lines: linesOf(r.items),
            });
        });

        return ev.sort((a, b) => b.time - a.time).slice(0, 30);
    }, [orders, purchases, damageReturns]);

    const openHistory = () => {
        setHistoryOpen(true);
        setTimeout(() => setHistoryShow(true), 10);
    };
    const closeHistory = () => {
        setHistoryShow(false);
        setTimeout(() => setHistoryOpen(false), 300);
    };
    const openHistoryItem = (e) => {
        setHistoryShow(false);
        setTimeout(() => {
            setHistoryOpen(false);
            navigate('/damage-stock-single-invoice', { state: { focusEvent: e } });
        }, 300);
    };

    const getPhoneByName = (name) =>
        companies.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';
    const getProductPhone = (p) => p.companyContact || getPhoneByName(p.company);

    const companyOptions = companies
        .filter((c) => {
            const s = filters.company.toLowerCase();
            return (c.businessName || '').toLowerCase().includes(s) || (c.contactNumber || '').toLowerCase().includes(s);
        })
        .map((c) => ({
            key: c._id,
            title: c.businessName,
            sub: c.contactNumber ? `📞 ${c.contactNumber}` : '',
            onPick: () => {
                setFilters({ company: c.businessName, companyContact: c.contactNumber || '', product: '' });
                setCurrentPage(1);
            },
        }));
    const productOptions = productList
        .filter((p) => {
            if (!p.productName || p.isActive === false) return false;
            const s = filters.product.toLowerCase();
            return (
                p.productName.toLowerCase().includes(s) ||
                (p.company || '').toLowerCase().includes(s) ||
                getProductPhone(p).toLowerCase().includes(s)
            );
        })
        .map((p) => ({
            key: p._id,
            title: p.productName,
            sub: `🏢 ${p.company || 'N/A'}${getProductPhone(p) ? ` | 📞 ${getProductPhone(p)}` : ''}`,
            onPick: () => {
                setFilters({ product: p.productName?.trim() || '', company: p.company?.trim() || '', companyContact: getProductPhone(p) });
                setCurrentPage(1);
            },
        }));

    const clearFilters = () => {
        setFilters({ product: '', company: '', companyContact: '' });
        setCurrentPage(1);
    };

    const products = allProducts.filter(
        (p) =>
            p.productName.toLowerCase().includes(filters.product.trim().toLowerCase()) &&
            p.company.toLowerCase().includes(filters.company.trim().toLowerCase()) &&
            !(filters.companyContact && p.companyContact && p.companyContact !== filters.companyContact)
    );

    const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safePage - 1) * itemsPerPage;
    const currentItems = products.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const grandMain = products.reduce((s, p) => s + p.main, 0);
    const grandFree = products.reduce((s, p) => s + p.free, 0);
    const grandEstimate = products.reduce((s, p) => s + p.estimateValue, 0);
    const grandTotal = grandMain + grandFree;
    const activeCount = [filters.product, filters.company].filter(Boolean).length;

    const EstText = ({ p }) =>
        p.estimateValue > 0 ? (
            <>
                ৳{fmt(p.estimateValue)}
                {p.stockValue <= 0 && <span className="ml-1 text-[11px] text-slate-500 font-semibold">(EST PP ৳{fmt(p.unitPrice)}/pcs)</span>}
            </>
        ) : (
            <span className="text-slate-300">—</span>
        );

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
                            <button type="button" onClick={closeHistory} aria-label="Close"
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer">
                                <FaTimes size={13} />
                            </button>
                        </div>
                        <div className="max-h-[78vh] sm:max-h-[75vh] overflow-y-auto">
                            {historyEvents.length === 0 ? (
                                <div className="py-14 text-center text-sm text-slate-400">কোনো history নেই</div>
                            ) : (
                                <>
                                    <div className="md:hidden p-3 space-y-2">
                                        {historyEvents.map((e) => (
                                            <div key={e.key} className="rounded-2xl border border-slate-200 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${HISTORY_STYLE[e.type].cls}`}>
                                                        {HISTORY_STYLE[e.type].label} ({e.type === 'in' ? '+' : '−'})
                                                    </span>
                                                    <span className="text-[11px] text-slate-500 whitespace-nowrap">{e.date || 'N/A'}</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1.5">#{e.ref}</div>
                                                <div className="mt-2 flex items-end justify-between gap-2">
                                                    <HistLines e={e} />
                                                    <button type="button" onClick={() => openHistoryItem(e)}
                                                        className="h-10 px-4 shrink-0 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-100 cursor-pointer">
                                                        Open
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <table className="hidden md:table w-full text-left border-collapse">
                                        <thead className="sticky top-0">
                                            <tr className="bg-slate-50 text-slate-600 text-xs font-semibold">
                                                <th className="py-2.5 px-3">Invoice No</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3">Qty</th>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3 text-center">Open</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                            {historyEvents.map((e) => (
                                                <tr key={e.key} className="hover:bg-slate-50/70 transition-colors">
                                                    <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">#{e.ref}</td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${HISTORY_STYLE[e.type].cls}`}>
                                                            {HISTORY_STYLE[e.type].label} ({e.type === 'in' ? '+' : '−'})
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap"><HistLines e={e} /></td>
                                                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">{e.date || 'N/A'}</td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <button type="button" onClick={() => openHistoryItem(e)}
                                                            className="h-9 px-4 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-100 cursor-pointer">
                                                            Open
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
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
                        <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Damage Products</h2>
                        <button type="button" onClick={openHistory}
                            className="h-10 px-4 rounded-full bg-brand-600 text-white text-sm font-semibold cursor-pointer">
                            History
                        </button>
                    </div>
                    <div className="grid grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2.5">
                        <Stat label="Products" value={fmt(products.length)} tone="slate" />
                        <Stat label="Main Qty" value={`${fmt(grandMain)} pcs`} tone="brand" />
                        <Stat label="Free Qty" value={`${fmt(grandFree)} pcs`} tone="emerald" />
                        <Stat label="Total Qty" value={`${fmt(grandTotal)} pcs`} tone="amber" />
                        <div className="col-span-2 lg:col-span-1">
                            <Stat label="Estimate Damage Value" value={`৳${fmt(grandEstimate)}`} tone="rose" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => setShowFilters((v) => !v)}
                            className="sm:pointer-events-none h-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                            <FaFilter className="text-brand-600" size={13} /> Filter & Search
                            {activeCount > 0 && <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[11px]">{activeCount}</span>}
                            <span className="sm:hidden text-slate-400 text-xs">{showFilters ? '▲' : '▼'}</span>
                        </button>
                        <button type="button" onClick={clearFilters}
                            className="h-10 px-3 inline-flex items-center gap-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                            <FaRedo size={11} /> Clear all
                        </button>
                    </div>
                    <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-2 gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}>
                        <Combo
                            label="Product"
                            placeholder="Search or select product..."
                            value={filters.product}
                            options={productOptions}
                            emptyText="No product found"
                            onType={(v) => {
                                setFilters((prev) => ({ ...prev, product: v, company: '', companyContact: '' }));
                                setCurrentPage(1);
                            }}
                            onClear={() => {
                                setFilters({ product: '', company: '', companyContact: '' });
                                setCurrentPage(1);
                            }}
                        />
                        <Combo
                            label="Company"
                            placeholder="Search or select company..."
                            value={filters.company}
                            options={companyOptions}
                            emptyText="No company found"
                            onType={(v) => {
                                setFilters((prev) => ({ ...prev, company: v, companyContact: '' }));
                                setCurrentPage(1);
                            }}
                            onClear={() => {
                                setFilters((prev) => ({ ...prev, company: '', companyContact: '' }));
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">Damage Product List</h3>
                        <span className="px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 font-semibold text-xs rounded-full">
                            {products.length} products
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-2" aria-busy="true">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-slate-500 font-semibold">কোনো damage product পাওয়া যায়নি</div>
                            <div className="text-xs text-slate-400 mt-1">Filter বদলে আবার চেষ্টা করুন</div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentItems.map((p) => (
                                    <div key={p.key} className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-2 shadow-sm">
                                        <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-rose-400" />
                                        <div className="flex items-start gap-2 min-w-0">
                                            <p className="flex-1 min-w-0 font-bold text-[14px] text-brand-700 break-words leading-tight">{p.productName}</p>
                                            <span className="shrink-0 px-1.5 py-px rounded-full bg-rose-50 text-rose-600 text-[10px] font-bold text-right">
                                                <EstText p={p} />
                                            </span>
                                        </div>
                                        <p className="text-[11.5px] text-slate-500 leading-snug break-words mt-1">
                                            <span className="font-semibold text-slate-700">{p.company}</span>
                                            {getProductPhone(p) && <> • 📞 {getProductPhone(p)}</>}
                                        </p>
                                        <div className="grid grid-cols-3 gap-1.5 mt-2">
                                            <MiniQty label="Main" total={p.main} info={p.info} tone="text-brand-700" bg="bg-brand-50" />
                                            <MiniQty label="Free" total={p.free} info={p.info} tone="text-emerald-700" bg="bg-emerald-50" />
                                            <MiniQty label="Total" total={p.total} info={p.info} tone="text-slate-800" bg="bg-slate-50" />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[900px] text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-xs font-semibold whitespace-nowrap">
                                            <th className="py-3 px-3 w-12">#</th>
                                            <th className="py-3 px-3">Product</th>
                                            <th className="py-3 px-3">Company</th>
                                            <th className="py-3 px-3">Main Qty</th>
                                            <th className="py-3 px-3">Free Qty</th>
                                            <th className="py-3 px-3">Total Qty</th>
                                            <th className="py-3 px-3 text-right">Estimate Damage Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {currentItems.map((p, i) => (
                                            <tr key={p.key} className="hover:bg-slate-50/70 transition-colors">
                                                <td className="py-3 px-3 text-slate-400 font-medium">{indexOfFirstItem + i + 1}</td>
                                                <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">{p.productName}</td>
                                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                                    <div>{p.company}</div>
                                                    {getProductPhone(p) && <div className="text-xs text-slate-400 mt-0.5">📞 {getProductPhone(p)}</div>}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.main} info={p.info} valueClass="text-brand-700" chipClass="bg-brand-50 border-brand-200 text-brand-600" />
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-emerald-50 border-emerald-200 text-emerald-600" />
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.total} info={p.info} />
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap"><EstText p={p} /></td>
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

export default DamageStockProducts;