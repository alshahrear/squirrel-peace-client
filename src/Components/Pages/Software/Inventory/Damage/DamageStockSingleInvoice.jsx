import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

const num = (v) => Number(v) || 0;
const fmt = (n) => num(n).toLocaleString('en-US', { maximumFractionDigits: 2 });
const r2 = (n) => Math.round(num(n) * 100) / 100;
const keyOf = (it) =>
    `${(it.productName || '').toString().trim().toLowerCase()}|${(it.company || '').toString().trim().toLowerCase()}`;

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

const KIND = {
    main: 'bg-brand-100 text-brand-700',
    free: 'bg-emerald-100 text-emerald-700',
};

// Main / Free alada kore bundle + pcs format e dekhabe
const QtyStack = ({ main, free, info, valueClass = 'text-slate-800', showTotal = true }) => {
    const rows = [
        { k: 'main', label: 'Main', v: main },
        { k: 'free', label: 'Free', v: free },
    ].filter((x) => x.v > 0);
    if (rows.length === 0) return <span className="text-slate-300 font-bold">—</span>;
    return (
        <div className="flex flex-col items-start gap-1">
            {rows.map((x) => {
                const q = qtyText(x.v, info);
                return (
                    <div key={x.k} className="flex flex-wrap items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${KIND[x.k]}`}>{x.label}</span>
                        <span className={`text-[13px] font-bold ${valueClass}`}>{q.text}</span>
                        {q.chip && (
                            <span className="px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 whitespace-nowrap">{q.pcs}</span>
                        )}
                    </div>
                );
            })}
            {showTotal && rows.length > 1 && (
                <div className="w-full pt-1 border-t border-dashed border-slate-300 text-[11px] font-extrabold text-slate-700">
                    Total: {fmt(main + free)} pcs
                </div>
            )}
        </div>
    );
};

const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

const STAT_TONE = {
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
};
const Stat = ({ label, value, tone = 'brand' }) => (
    <div className={`rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2.5 min-w-0 ${STAT_TONE[tone]}`}>
        <div className="text-[10px] sm:text-[11px] font-medium opacity-80 truncate">{label}</div>
        <div className="text-[13px] sm:text-lg font-bold truncate">{value}</div>
    </div>
);

const Chevron = ({ open }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor"
        className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const HISTORY_STYLE = {
    in: { label: 'Damage In', sign: '+', cls: 'bg-rose-100 text-rose-700' },
    out: { label: 'Company Return', sign: '−', cls: 'bg-violet-100 text-violet-700' },
};

const Note = ({ children }) => <div className="text-[10px] font-semibold text-amber-600">{children}</div>;

const HistLines = ({ e }) => {
    const st = HISTORY_STYLE[e.type];
    const plus = st.sign === '+';
    return (
        <div className="flex flex-col gap-2">
            {e.lines.map((l, i) => (
                <div key={i} className="flex flex-col gap-1">
                    <div className="text-[11px] font-bold text-slate-500">{l.name}</div>
                    {[{ k: 'main', v: l.main }, { k: 'free', v: l.free }].filter((x) => x.v > 0).map((x) => {
                        const q = qtyText(x.v, l.info);
                        return (
                            <div key={x.k} className="flex flex-wrap items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${KIND[x.k]}`}>{x.k === 'main' ? 'Main' : 'Free'}</span>
                                <span className={`text-sm font-bold ${plus ? 'text-rose-600' : 'text-violet-600'}`}>{st.sign}{q.text}</span>
                                {q.chip && <span className="px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-600">({q.pcs})</span>}
                            </div>
                        );
                    })}
                    {l.bMF > 0 && <Note>Main-এর {qtyText(l.bMF, l.info).text}, Free স্টক থেকে নেওয়া</Note>}
                    {l.bFM > 0 && <Note>Free-এর {qtyText(l.bFM, l.info).text}, Main স্টক থেকে নেওয়া</Note>}
                    {l.from.length > 0 && <Note>↳ Damage Invoice: {[...new Set(l.from.map((f) => `#${f.invNo}`))].join(', ')}</Note>}
                </div>
            ))}
        </div>
    );
};

const DamageStockSingleInvoice = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const focusEvent = location.state?.focusEvent || null;

    const [sales, setSales] = useState([]);
    const [damages, setDamages] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [productList, setProductList] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [hideEmpty, setHideEmpty] = useState(false);
    const [openOrders, setOpenOrders] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyShow, setHistoryShow] = useState(false);
    const [highlight, setHighlight] = useState({});
    const [highlightEv, setHighlightEv] = useState(null);
    const [focusInv, setFocusInv] = useState([]);

    const [modalRow, setModalRow] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const [tab, setTab] = useState('available');

    const [isDesktop, setIsDesktop] = useState(
        typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : true
    );
    useEffect(() => {
        const m = window.matchMedia('(min-width: 768px)');
        const h = (e) => setIsDesktop(e.matches);
        m.addEventListener('change', h);
        return () => m.removeEventListener('change', h);
    }, []);

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/sales').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/sales-damage').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/purchase').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/damage-return').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/product').then((r) => r.json()).catch(() => []),
        ])
            .then(([s, d, p, r, pr]) => {
                setProductList(Array.isArray(pr) ? pr : []);
                setSales(Array.isArray(s) ? s : []);
                setDamages(Array.isArray(d) ? d : []);
                setPurchases(Array.isArray(p) ? p : []);
                setDamageReturns(Array.isArray(r) ? r : []);
            })
            .catch((e) => console.error('Error fetching damage data:', e))
            .finally(() => setLoading(false));
    }, []);

    // ===== Damage invoice (stock in) + Company return (stock out, FIFO) =====
    const { invoices, events } = useMemo(() => {
        const invs = [];
        sales
            .filter((s) => s.status === 'Delivered' && (s.damageItems || []).length > 0)
            .forEach((s) =>
                invs.push({
                    id: String(s._id),
                    kind: 'sales',
                    invoiceNo: s.invoiceNo || s.orderNo,
                    customer: s.customer || 'N/A',
                    date: s.deliveryDate || s.orderDate || '',
                    ts: Date.parse(s.damageAt || s.createdAt) || 0,
                    items: s.damageItems || [],
                })
            );
        damages.forEach((d) =>
            invs.push({
                id: String(d._id),
                kind: d.customerId ? 'customer' : 'stock',
                invoiceNo: d.invoiceNo,
                customer: d.customer || 'Stock',
                date: d.damageDate || '',
                ts: Date.parse(d.createdAt) || 0,
                items: d.items || [],
            })
        );
        invs.sort((a, b) => a.ts - b.ts);

        const lineMap = new Map();
        invs.forEach((inv) => {
            const m = new Map();
            inv.items.forEach((it) => {
                const k = keyOf(it);
                if (!m.has(k)) {
                    m.set(k, {
                        key: k,
                        invId: inv.id,
                        ts: inv.ts,
                        invNo: inv.invoiceNo,
                        productId: it.productId,
                        productName: it.productName,
                        company: it.company,
                        main: 0,
                        free: 0,
                        value: 0,
                        info: null,
                        retMain: 0,
                        retFree: 0,
                        returns: [],
                    });
                }
                const l = m.get(k);
                l.main += num(it.totalQty);
                l.free += num(it.freeQty);
                l.value += num(it.itemTotal ?? it.subtotal);
                const per = num(it.pcsPerUnit);
                if (per > 1) {
                    l.info = {
                        per,
                        perSub: it.parentMode === true ? num(it.pcsPerSub) : 0,
                        unit: it.unit,
                        subUnit: it.subUnit,
                    };
                }
            });
            inv.lines = [...m.values()];
            inv.lines.forEach((l, i) => {
                l.id = `${inv.id}|${l.key}`;
                l.dom = `dsl-${inv.id}-${i}`;
                if (!lineMap.has(l.key)) lineMap.set(l.key, []);
                lineMap.get(l.key).push(l);
            });
        });

        const evs = [];
        purchases
            .filter((p) => (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') && (p.damageItems || []).length > 0)
            .forEach((p) =>
                evs.push({
                    id: String(p._id),
                    kind: 'purchase',
                    ref: p.invoiceNo,
                    company: p.company,
                    date: p.receiveDate || p.purchaseDate || '',
                    ts: Date.parse(p.damageAt || p.createdAt) || 0,
                    items: p.damageItems || [],
                })
            );
        damageReturns.forEach((r) =>
            evs.push({
                id: String(r._id),
                kind: 'return',
                ref: r.invoiceNo,
                company: r.company,
                date: r.returnDate || '',
                ts: Date.parse(r.createdAt) || 0,
                items: r.items || [],
            })
        );
        evs.sort((a, b) => a.ts - b.ts);

        evs.forEach((ev) => {
            ev.parts = [];
            ev.invIds = new Set();
            ev.lineIds = [];
            ev.items.forEach((it) => {
                const k = keyOf(it);
                const queue = lineMap.get(k) || [];
                let m = num(it.totalQty) - num(it.mainFromFree) + num(it.freeFromMain);
                let f = num(it.freeQty) - num(it.freeFromMain) + num(it.mainFromFree);
                const bp = num(it.buyPrice);
                const per = num(it.pcsPerUnit);
                const info =
                    per > 1
                        ? { per, perSub: it.parentMode === true ? num(it.pcsPerSub) : 0, unit: it.unit, subUnit: it.subUnit }
                        : null;
                let bMFLeft = num(it.mainFromFree);
                let bFMLeft = num(it.freeFromMain);
                for (const l of queue) {
                    if (m <= 0 && f <= 0) break;
                    if (!ev.ts || l.ts > ev.ts) continue;
                    const tm = Math.min(m, l.main - l.retMain);
                    const tf = Math.min(f, l.free - l.retFree);
                    if (tm <= 0 && tf <= 0) continue;
                    const tmP = Math.max(tm, 0);
                    const tfP = Math.max(tf, 0);
                    l.retMain += tmP;
                    l.retFree += tfP;
                    m -= tmP;
                    f -= tfP;
                    // stock theke physical kothay theke gese (tmP/tfP), ar company k logically ki hisebe return (main/free)
                    const bMF = Math.min(bMFLeft, tfP);
                    const bFM = Math.min(bFMLeft, tmP);
                    bMFLeft -= bMF;
                    bFMLeft -= bFM;
                    const logMain = tmP - bFM + bMF;
                    const logFree = tfP - bMF + bFM;
                    l.returns.push({
                        evId: ev.id,
                        kind: ev.kind,
                        ref: ev.ref,
                        date: ev.date,
                        ts: ev.ts,
                        main: logMain,
                        free: logFree,
                        bMF,
                        bFM,
                        value: r2(logMain * bp),
                    });
                    ev.parts.push({
                        key: k,
                        name: it.productName,
                        main: logMain,
                        free: logFree,
                        bMF,
                        bFM,
                        invNo: l.invNo,
                        info: l.info || info,
                    });
                    ev.invIds.add(l.invId);
                    ev.lineIds.push(l.id);
                }
            });
        });

        return { invoices: invs, events: evs };
    }, [sales, damages, purchases, damageReturns]);

    const lineAvail = (l) => ({ main: Math.max(l.main - l.retMain, 0), free: Math.max(l.free - l.retFree, 0) });
    const lineUnit = (l) => (l.main > 0 ? l.value / l.main : 0);
    const ppOf = (l) => {
        const prod =
            productList.find((p) => l.productId && String(p._id) === String(l.productId)) ||
            productList.find((p) => keyOf(p) === l.key);
        return num(prod?.purchasePrice);
    };
    const isEst = (inv) => inv.kind !== 'stock';
    const lineValue = (inv, l) => (isEst(inv) ? r2(ppOf(l) * (l.main + l.free)) : l.value);
    const lineAvailValue = (inv, l) => {
        const a = lineAvail(l);
        return isEst(inv) ? r2(ppOf(l) * (a.main + a.free)) : r2(a.main * lineUnit(l));
    };
    const invTotals = (inv) =>
        inv.lines.reduce(
            (t, l) => {
                const a = lineAvail(l);
                t.main += l.main;
                t.free += l.free;
                t.retMain += l.retMain;
                t.retFree += l.retFree;
                t.availMain += a.main;
                t.availFree += a.free;
                t.value += lineValue(inv, l);
                t.availValue += lineAvailValue(inv, l);
                return t;
            },
            { main: 0, free: 0, retMain: 0, retFree: 0, availMain: 0, availFree: 0, value: 0, availValue: 0 }
        );

    // ===== Orders (damage invoice wise, newest first) =====
    const orders = useMemo(() => {
        const q = search.trim().toLowerCase();
        return invoices
            .filter((inv) => {
                if (hideEmpty && invTotals(inv).availMain + invTotals(inv).availFree <= 0) return false;
                if (!q) return true;
                return (
                    [inv.invoiceNo, inv.customer].some((f) => (f || '').toString().toLowerCase().includes(q)) ||
                    inv.lines.some((l) => [l.productName, l.company].some((f) => (f || '').toString().toLowerCase().includes(q)))
                );
            })
            .slice()
            .reverse();
        // eslint-disable-next-line
    }, [invoices, search, hideEmpty, productList]);

    const totalPages = Math.ceil(orders.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirst = (safePage - 1) * itemsPerPage;
    const currentOrders = orders.slice(indexOfFirst, indexOfFirst + itemsPerPage);

    const grand = orders.reduce(
        (t, inv) => {
            const x = invTotals(inv);
            t.damage += x.main + x.free;
            t.ret += x.retMain + x.retFree;
            t.avail += x.availMain + x.availFree;
            t.availValue += x.availValue;
            return t;
        },
        { damage: 0, ret: 0, avail: 0, availValue: 0 }
    );

    // ===== Overall History (Damage In / Company Return) =====
    const allEvents = useMemo(() => {
        const out = [];
        invoices.forEach((inv) =>
            out.push({
                key: `in-${inv.id}`,
                type: 'in',
                id: inv.id,
                ref: inv.invoiceNo,
                date: inv.date,
                time: inv.ts,
                invIds: [inv.id],
                lineIds: inv.lines.map((l) => l.id),
                lines: inv.lines.map((l) => ({ name: l.productName, main: l.main, free: l.free, info: l.info, from: [] })),
            })
        );
        events.forEach((ev) => {
            const g = new Map();
            ev.parts.forEach((p) => {
                if (!g.has(p.key)) g.set(p.key, { name: p.name, main: 0, free: 0, info: p.info, from: [] });
                const x = g.get(p.key);
                x.main += p.main;
                x.free += p.free;
                x.bMF = (x.bMF || 0) + (p.bMF || 0);
                x.bFM = (x.bFM || 0) + (p.bFM || 0);
                x.from.push(p);
            });
            if (g.size === 0) return;
            out.push({
                key: `out-${ev.id}`,
                type: 'out',
                id: ev.id,
                ref: ev.ref,
                date: ev.date,
                time: ev.ts,
                kindLabel: ev.kind === 'purchase' ? 'From Purchase' : 'Damage Return',
                invIds: [...ev.invIds],
                lineIds: ev.lineIds,
                lines: [...g.values()],
            });
        });
        return out.sort((a, b) => b.time - a.time);
    }, [invoices, events]);

    const historyEvents = allEvents.slice(0, 30);

    const applyFocus = (e) => {
        setSearch('');
        setHideEmpty(false);
        setOpenOrders((prev) => {
            const n = { ...prev };
            e.invIds.forEach((id) => (n[id] = true));
            return n;
        });
        const h = {};
        e.lineIds.forEach((id) => (h[id] = true));
        setHighlight(h);
        setFocusInv([...e.invIds]);
        setHighlightEv(e);
    };

    // Dosro tab (Damage Stock Products history) theke asle
    useEffect(() => {
        if (!focusEvent || loading) return;
        const e = allEvents.find((x) => x.type === focusEvent.type && String(x.id) === String(focusEvent.id));
        if (e) applyFocus(e);
        // eslint-disable-next-line
    }, [focusEvent, loading]);

    useEffect(() => {
        if (!focusInv.length || loading) return;
        const idx = orders.findIndex((o) => focusInv.includes(o.id));
        if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1);
        const t = setTimeout(() => {
            const first = orders.flatMap((o) => o.lines).find((l) => highlight[l.id]);
            const el = first && document.getElementById(first.dom);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line
    }, [focusInv, loading]);

    useEffect(() => {
        if (!Object.keys(highlight).length || modalRow) return;
        const onDown = (ev) => {
            if (ev.target.closest && ev.target.closest('[data-hl="1"]')) return;
            setHighlight({});
            setHighlightEv(null);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [highlight, modalRow]);

    const openHistory = () => {
        setHistoryOpen(true);
        setTimeout(() => setHistoryShow(true), 10);
    };
    const closeHistory = () => {
        setHistoryShow(false);
        setTimeout(() => setHistoryOpen(false), 300);
    };
    const openHistoryItem = (e) => {
        applyFocus(e);
        closeHistory();
    };

    const openModal = (inv, l) => {
        setModalRow({ inv, l });
        setTab(highlight[l.id] && highlightEv ? (highlightEv.type === 'in' ? 'damage' : 'return') : 'available');
        setTimeout(() => setModalShow(true), 10);
    };
    const closeModal = () => {
        setModalShow(false);
        setTimeout(() => setModalRow(null), 300);
    };

    const toggleOrder = (id) => setOpenOrders((p) => ({ ...p, [id]: !p[id] }));
    const allOpen = orders.length > 0 && orders.every((o) => openOrders[o.id]);
    const toggleAll = () => {
        const n = {};
        if (!allOpen) orders.forEach((o) => (n[o.id] = true));
        setOpenOrders(n);
    };

    const openInvoice = (inv) =>
        window.open(inv.kind === 'sales' ? `/sales-details/${inv.id}` : `/damage-details/${inv.id}`, '_blank');
    const openReturn = (r) =>
        window.open(r.kind === 'purchase' ? `/purchase-details/${r.evId}` : `/damage-return-details/${r.evId}`, '_blank');

    const SourceBadge = ({ inv }) => (
        <span
            className={`inline-block px-1.5 py-0.5 rounded-full font-bold text-[9px] leading-none ${inv.kind === 'sales'
                ? 'bg-violet-100 text-violet-700'
                : inv.kind === 'customer'
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-orange-100 text-orange-700'
                }`}
        >
            {inv.kind === 'sales' ? 'From Sales' : inv.kind === 'customer' ? 'Customer Damage' : 'Stock Damage'}
        </span>
    );

    const ValueText = ({ inv, l }) =>
        lineValue(inv, l) > 0 ? (
            <>
                ৳{fmt(lineValue(inv, l))}{' '}
                <span className="text-[11px] text-slate-500">({isEst(inv) ? `EST PP ৳${fmt(ppOf(l))}` : `৳${fmt(lineUnit(l))}`}/pcs)</span>
            </>
        ) : (
            <span className="text-slate-300">—</span>
        );

    const th = 'py-2.5 px-3';

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
                {/* Header + totals */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Damage Single Invoice</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5 mb-3">Invoice wise damage products, company return & available stock</p>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-2.5">
                        <Stat label="Total Damage" value={`${fmt(grand.damage)} pcs`} tone="rose" />
                        <Stat label="Company Returned" value={`${fmt(grand.ret)} pcs`} tone="violet" />
                        <Stat label="Available Damage" value={`${fmt(grand.avail)} pcs`} tone="emerald" />
                        <Stat label="Available Value" value={`৳${fmt(grand.availValue)}`} tone="brand" />
                    </div>
                </div>

                {/* List card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 sm:gap-3 px-1.5 pt-1 sm:p-0">
                                               <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <h3 className="w-full sm:w-auto text-base sm:text-lg font-bold text-slate-800">Damage Invoice Directory</h3>
                            <span className="px-2.5 sm:px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 font-semibold text-[11px] sm:text-xs rounded-full whitespace-nowrap">
                                {orders.length} invoices / {orders.reduce((s, o) => s + o.lines.length, 0)} products
                            </span>
                            <button type="button" onClick={openHistory} className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-brand-600 text-white text-xs sm:text-sm font-semibold cursor-pointer">
                                History
                            </button>
                        </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                placeholder="Search invoice, customer, product..."
                                className={`${inputCls} w-full sm:w-auto sm:flex-1 sm:min-w-[180px] lg:w-72 lg:flex-none`}
                            />
                            <button type="button" onClick={() => { setHideEmpty((v) => !v); setCurrentPage(1); }}
                                className={`h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-medium rounded-xl border cursor-pointer whitespace-nowrap ${hideEmpty ? 'bg-brand-50 border-brand-300 text-brand-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                                {hideEmpty ? 'Showing available' : 'Hide fully returned'}
                            </button>
                            <button type="button" onClick={toggleAll}
                                className="h-9 sm:h-10 px-2.5 sm:px-3 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer whitespace-nowrap">
                                {allOpen ? 'Collapse all' : 'Expand all'}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="space-y-2" aria-busy="true">
                            {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />)}
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-slate-500 font-semibold">কোনো damage invoice পাওয়া যায়নি</div>
                            <div className="text-xs text-slate-400 mt-1">Search বদলে আবার চেষ্টা করুন</div>
                        </div>
                    ) : !isDesktop ? (
                        /* ===== Mobile cards ===== */
                        <div className="space-y-1.5">
                            {currentOrders.map((inv) => {
                                const isOpen = !!openOrders[inv.id];
                                const t = invTotals(inv);
                                const availAll = t.availMain + t.availFree;
                                return (
                                    <div key={inv.id} className="relative rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                        <span className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500 z-10" />
                                        <div className={`pl-3 pr-2 py-2 ${isOpen ? 'bg-brand-50' : 'bg-white'}`}>
                                            <div className="flex items-start gap-2">
                                                <div className="min-w-0 flex-1 flex flex-col gap-1">
                                                    <div className="font-bold text-[13px] text-brand-700 leading-tight break-words">{inv.customer}</div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <button type="button" onClick={() => openInvoice(inv)}
                                                            className="px-1.5 py-px rounded-full bg-slate-100 text-brand-700 text-[10.5px] font-bold cursor-pointer">
                                                            #{inv.invoiceNo}
                                                        </button>
                                                        <SourceBadge inv={inv} />
                                                    </div>
                                                    <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Damage: </span>{inv.date || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 w-[124px] flex flex-col items-end gap-1">
                                                    <button type="button" onClick={() => toggleOrder(inv.id)} aria-expanded={isOpen}
                                                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-semibold whitespace-nowrap cursor-pointer">
                                                        {inv.lines.length} product <Chevron open={isOpen} />
                                                    </button>
                                                    <div className="w-full space-y-px">
                                                        <div className="flex items-center justify-between rounded-md bg-rose-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-rose-400">DAMAGE</span>
                                                            <span className="text-[10.5px] font-bold text-rose-600">{fmt(t.main + t.free)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-violet-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-violet-400">RETURN</span>
                                                            <span className="text-[10.5px] font-bold text-violet-700">{fmt(t.retMain + t.retFree)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-slate-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-slate-400">AVAIL</span>
                                                            <span className={`text-[10.5px] font-bold ${availAll > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>{fmt(availAll)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-emerald-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-emerald-400">VALUE</span>
                                                            <span className="text-[10.5px] font-bold text-emerald-700">{t.value > 0 ? `৳${fmt(t.value)}` : '—'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {isOpen && (
                                            <div className="p-1.5 space-y-1.5 bg-white">
                                                {inv.lines.map((l) => {
                                                    const a = lineAvail(l);
                                                    return (
                                                        <div key={l.id} id={l.dom} data-hl={highlight[l.id] ? '1' : undefined}
                                                            className={`rounded-lg border px-2 py-1.5 ${highlight[l.id] ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-300' : 'border-slate-200'}`}>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <div className="font-bold text-[13px] text-slate-800 leading-tight break-words">{l.productName}</div>
                                                                    <div className="text-[11px] text-slate-500">{l.company}</div>
                                                                </div>
                                                                <button type="button" onClick={() => openModal(inv, l)}
                                                                    className="h-8 px-3 shrink-0 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-semibold hover:bg-emerald-100 cursor-pointer">
                                                                    History
                                                                </button>
                                                            </div>
                                                            <div className="flex flex-col gap-1 mt-1.5">
                                                                <div className="rounded-lg bg-rose-50/60 px-1.5 py-1">
                                                                    <div className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Damage Qty</div>
                                                                    <QtyStack main={l.main} free={l.free} info={l.info} valueClass="text-rose-600" />
                                                                </div>
                                                                <div className="rounded-lg bg-violet-50/60 px-1.5 py-1">
                                                                    <div className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Company Returned</div>
                                                                    <QtyStack main={l.retMain} free={l.retFree} info={l.info} valueClass="text-violet-600" />
                                                                </div>
                                                                <div className="rounded-lg bg-slate-50 px-1.5 py-1">
                                                                    <div className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">Available</div>
                                                                    {a.main + a.free > 0 ? (
                                                                        <QtyStack main={a.main} free={a.free} info={l.info} valueClass="text-emerald-600" />
                                                                    ) : (
                                                                        <span className="font-bold text-rose-600 text-[13px]">0 pcs</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="mt-1.5 text-right text-xs font-bold text-emerald-700"><ValueText inv={inv} l={l} /></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* ===== Desktop table ===== */
                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[1000px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 text-xs font-semibold whitespace-nowrap">
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Customer / Company</th>
                                        <th className="py-3 px-3">Invoice</th>
                                        <th className="py-3 px-3">Product</th>
                                        <th className="py-3 px-3">Damage Qty</th>
                                        <th className="py-3 px-3">Company Returned</th>
                                        <th className="py-3 px-3">Available Qty</th>
                                        <th className="py-3 px-3 text-right">Damage Value</th>
                                    </tr>
                                </thead>
                                {currentOrders.map((inv) => {
                                    const isOpen = !!openOrders[inv.id];
                                    const t = invTotals(inv);
                                    const availAll = t.availMain + t.availFree;
                                    return (
                                        <tbody key={inv.id} className="border-t border-slate-200">
                                            <tr className={`${isOpen ? 'bg-brand-100/60' : 'bg-brand-50/50 hover:bg-brand-50'}`}>
                                                <td className="py-3 px-3 border-l-4 border-brand-500 whitespace-nowrap text-[11px] text-slate-500 font-medium">Damage: {inv.date || 'N/A'}</td>
                                                <td className="py-3 px-3 text-sm font-bold text-slate-800 whitespace-nowrap">{inv.customer}</td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <button type="button" onClick={() => openInvoice(inv)} className="font-bold text-brand-700 hover:underline cursor-pointer text-sm">#{inv.invoiceNo}</button>
                                                    <div className="mt-0.5"><SourceBadge inv={inv} /></div>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <button type="button" onClick={() => toggleOrder(inv.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold cursor-pointer">
                                                        {inv.lines.length} product <Chevron open={isOpen} />
                                                    </button>
                                                </td>
                                                <td className="py-3 px-3 text-sm font-bold text-rose-600 whitespace-nowrap">{fmt(t.main + t.free)} pcs</td>
                                                <td className="py-3 px-3 text-sm font-bold text-violet-700 whitespace-nowrap">
                                                    {t.retMain + t.retFree > 0 ? `${fmt(t.retMain + t.retFree)} pcs` : <span className="text-slate-300">—</span>}
                                                </td>
                                                <td className="py-3 px-3 text-sm font-bold whitespace-nowrap">
                                                    <span className={availAll > 0 ? 'text-emerald-600' : 'text-rose-600'}>{fmt(availAll)} pcs</span>
                                                </td>
                                                <td className="py-3 px-3 text-right text-sm font-bold text-emerald-700 whitespace-nowrap">
                                                    {t.value > 0 ? `৳${fmt(t.value)}` : <span className="text-slate-300">—</span>}
                                                </td>
                                            </tr>

                                            {isOpen &&
                                                inv.lines.map((l) => {
                                                    const a = lineAvail(l);
                                                    return (
                                                        <tr key={l.id} id={l.dom} data-hl={highlight[l.id] ? '1' : undefined}
                                                            className={`${highlight[l.id] ? 'bg-amber-50 ring-2 ring-inset ring-amber-300' : 'bg-white hover:bg-slate-50/70'} border-l-4 border-brand-200 text-sm text-slate-700 transition-colors`}>
                                                            <td className="py-2.5 px-3"></td>
                                                            <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{l.company}</td>
                                                            <td className="py-2.5 px-3"></td>
                                                            <td className="py-2.5 px-3 font-semibold text-slate-800">
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span>{l.productName}</span>
                                                                    <button type="button" onClick={() => openModal(inv, l)}
                                                                        className="h-7 px-3 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 cursor-pointer">
                                                                        See History
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="py-2.5 px-3 whitespace-nowrap"><QtyStack main={l.main} free={l.free} info={l.info} valueClass="text-rose-600" /></td>
                                                            <td className="py-2.5 px-3 whitespace-nowrap"><QtyStack main={l.retMain} free={l.retFree} info={l.info} valueClass="text-violet-600" /></td>
                                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                                {a.main + a.free > 0 ? (
                                                                    <QtyStack main={a.main} free={a.free} info={l.info} valueClass="text-emerald-600" />
                                                                ) : (
                                                                    <span className="font-bold text-rose-600">0 pcs</span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap"><ValueText inv={inv} l={l} /></td>
                                                        </tr>
                                                    );
                                                })}
                                        </tbody>
                                    );
                                })}
                            </table>
                        </div>
                    )}

                    {!loading && orders.length > 0 && (
                        <div className="flex items-center justify-between gap-3 pt-3">
                            <span className="text-xs text-slate-500">
                                Page <b className="text-slate-700">{safePage}</b> of <b className="text-slate-700">{totalPages}</b>
                            </span>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => safePage > 1 && setCurrentPage(safePage - 1)} disabled={safePage === 1} aria-label="Previous page"
                                    className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer">
                                    <FaChevronLeft size={10} /> <span className="hidden sm:inline">Previous</span>
                                </button>
                                <button type="button" onClick={() => safePage < totalPages && setCurrentPage(safePage + 1)} disabled={safePage === totalPages} aria-label="Next page"
                                    className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer">
                                    <span className="hidden sm:inline">Next</span> <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ===== Overall History Modal ===== */}
            {historyOpen && (
                <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 transition-opacity duration-300 ${historyShow ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-slate-900/40" onClick={closeHistory} />
                    <div className={`relative w-full sm:max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${historyShow ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'}`}>
                        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-brand-600 text-white">
                            <div>
                                <h3 className="text-base font-bold">Overall History</h3>
                                <p className="text-xs text-white/80 mt-0.5">Latest {historyEvents.length} activities</p>
                            </div>
                            <button type="button" onClick={closeHistory} aria-label="Close" className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer">
                                <FaTimes size={13} />
                            </button>
                        </div>
                        <div className="max-h-[78vh] sm:max-h-[75vh] overflow-y-auto">
                            {historyEvents.length === 0 ? (
                                <div className="py-14 text-center text-sm text-slate-400">কোনো history নেই</div>
                            ) : (
                                <>
                                    <div className="md:hidden p-3 space-y-2">
                                        {historyEvents.map((e) => {
                                            const st = HISTORY_STYLE[e.type];
                                            return (
                                                <div key={e.key} className="rounded-2xl border border-slate-200 p-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label} ({st.sign})</span>
                                                        <span className="text-[11px] text-slate-500 whitespace-nowrap">{e.date || 'N/A'}</span>
                                                    </div>
                                                    <div className="text-xs text-slate-500 mt-1.5">#{e.ref}{e.kindLabel ? ` · ${e.kindLabel}` : ''}</div>
                                                    <div className="mt-2 flex items-end justify-between gap-2">
                                                        <HistLines e={e} />
                                                        <button type="button" onClick={() => openHistoryItem(e)}
                                                            className="h-10 px-4 shrink-0 rounded-xl bg-brand-50 border border-brand-200 text-brand-700 text-xs font-semibold hover:bg-brand-100 cursor-pointer">
                                                            Open
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <table className="hidden md:table w-full text-left border-collapse">
                                        <thead className="sticky top-0">
                                            <tr className="bg-slate-50 text-slate-600 text-xs font-semibold">
                                                <th className="py-2.5 px-3">Invoice</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3">Product / Qty</th>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3 text-center">Open</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                            {historyEvents.map((e) => {
                                                const st = HISTORY_STYLE[e.type];
                                                return (
                                                    <tr key={e.key} className="hover:bg-slate-50/70 transition-colors">
                                                        <td className="py-2.5 px-3 font-bold text-slate-800 whitespace-nowrap">#{e.ref}</td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${st.cls}`}>{st.label} ({st.sign})</span>
                                                            {e.kindLabel && <div className="text-[10px] text-slate-400 mt-0.5">{e.kindLabel}</div>}
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

            {/* ===== See History Modal (product wise) ===== */}
            {modalRow && (() => {
                const { inv, l } = modalRow;
                const a = lineAvail(l);
                const damageTotal = l.main + l.free;
                const retTotal = l.retMain + l.retFree;
                const availTotal = a.main + a.free;
                const percent = damageTotal > 0 ? Math.min((retTotal / damageTotal) * 100, 100) : 0;
                const hv = highlight[l.id] ? highlightEv : null;
                const retRows = l.returns.slice().reverse();
                const retValue = r2(retRows.reduce((s, r) => s + r.value, 0));
                const cards = [
                    { key: 'damage', label: 'Damage Total', value: damageTotal, box: 'bg-rose-50 border-rose-100', lbl: 'text-rose-400', val: 'text-rose-600', ring: 'ring-rose-400' },
                    { key: 'return', label: 'Company Return', value: retTotal, box: 'bg-violet-50 border-violet-100', lbl: 'text-violet-400', val: 'text-violet-600', ring: 'ring-violet-400' },
                    availTotal > 0
                        ? { key: 'available', label: 'Available', value: availTotal, box: 'bg-emerald-50 border-emerald-100', lbl: 'text-emerald-400', val: 'text-emerald-600', ring: 'ring-emerald-400' }
                        : { key: 'available', label: 'Available', value: availTotal, box: 'bg-rose-50 border-rose-100', lbl: 'text-rose-400', val: 'text-rose-600', ring: 'ring-rose-400' },
                ];
                const Mini = ({ v, cls }) => {
                    if (v <= 0) return <span className="text-slate-300">—</span>;
                    const q = qtyText(v, l.info);
                    return (
                        <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`font-bold ${cls}`}>{q.text}</span>
                            {q.chip && <span className="px-1.5 py-0.5 rounded-md border border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-600 whitespace-nowrap">{q.pcs}</span>}
                        </div>
                    );
                };
                return (
                    <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 transition-opacity duration-300 ${modalShow ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-slate-900/40" onClick={closeModal} />
                        <div className={`relative w-full sm:max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${modalShow ? 'translate-y-0 sm:scale-100' : 'translate-y-8 sm:scale-95'}`}>
                            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-brand-600 text-white">
                                <div className="min-w-0">
                                    <h3 className="text-base font-bold">Damage Product History</h3>
                                    <p className="text-xs text-white/80 mt-0.5 truncate">Invoice: #{inv.invoiceNo} | {l.productName}</p>
                                </div>
                                <button type="button" onClick={closeModal} aria-label="Close" className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer">
                                    <FaTimes size={13} />
                                </button>
                            </div>

                            <div className="p-3 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
                                <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                                    {cards.map((c) => (
                                        <button key={c.key} type="button" onClick={() => setTab(c.key)}
                                            className={`min-w-0 rounded-xl sm:rounded-2xl border px-1 py-2 sm:px-3 sm:py-3 text-center transition cursor-pointer hover:shadow-md ${c.box} ${tab === c.key ? `ring-2 ${c.ring} shadow-md` : ''}`}>
                                            <div className={`text-[9px] sm:text-[10px] font-bold uppercase leading-tight ${c.lbl}`}>{c.label}</div>
                                            <div className={`text-[12px] sm:text-base font-extrabold leading-tight mt-0.5 break-words ${c.val}`}>{fmt(c.value)} pcs</div>
                                        </button>
                                    ))}
                                </div>

                                <div>
                                    <div className="flex justify-between text-[11px] font-semibold text-slate-500 mb-1">
                                        <span>Returned to company: {fmt(retTotal)} / {fmt(damageTotal)} pcs</span>
                                        <span>{percent.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-slate-200 max-h-80 overflow-y-auto">
                                    {tab === 'damage' && (
                                        <table className="w-full min-w-[560px] text-left border-collapse">
                                            <thead className="sticky top-0">
                                                <tr className="bg-rose-50 text-rose-700 text-[11px] font-bold uppercase tracking-wide">
                                                    <th className={th}>Invoice / Date</th>
                                                    <th className={th}>Customer</th>
                                                    <th className={th}>Product</th>
                                                    <th className={th}>Qty</th>
                                                    <th className={`${th} text-right`}>Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className={`text-[13px] text-slate-700 ${hv?.type === 'in' ? 'bg-amber-100' : ''}`}>
                                                <tr>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <button type="button" onClick={() => openInvoice(inv)} className="font-bold text-brand-700 hover:underline cursor-pointer">#{inv.invoiceNo}</button>
                                                        <div className="text-[11px] text-slate-500 mt-0.5">{inv.date || 'N/A'}</div>
                                                        <SourceBadge inv={inv} />
                                                    </td>
                                                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{inv.customer}</td>
                                                    <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{l.productName}</td>
                                                    <td className="py-3 px-3 whitespace-nowrap"><QtyStack main={l.main} free={l.free} info={l.info} valueClass="text-rose-600" /></td>
                                                    <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                                        {lineValue(inv, l) > 0 ? <>৳{fmt(lineValue(inv, l))}{isEst(inv) && <span className="ml-1 text-[11px] text-slate-500">(EST PP ৳{fmt(ppOf(l))}/pcs)</span>}</> : <span className="text-slate-300">—</span>}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    )}

                                    {tab === 'return' && (
                                        <table className="w-full min-w-[560px] text-left border-collapse">
                                            <thead className="sticky top-0">
                                                <tr className="bg-violet-50 text-violet-700 text-[11px] font-bold uppercase tracking-wide">
                                                    <th className={th}>Invoice / Date</th>
                                                    <th className={th}>Product</th>
                                                    <th className={th}>Company</th>
                                                    <th className={th}>Qty</th>
                                                    <th className={`${th} text-right`}>Return Value</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                                                {retRows.length === 0 ? (
                                                    <tr><td colSpan={5} className="py-8 text-center text-slate-400 font-medium">Company te ekhono kono return kora hoyni</td></tr>
                                                ) : (
                                                    retRows.map((r, i) => (
                                                        <tr key={`${r.evId}-${i}`} className={`${hv?.type === 'out' && String(hv.id) === String(r.evId) ? 'bg-amber-100' : 'hover:bg-violet-50/40'} transition`}>
                                                            <td className="py-3 px-3 whitespace-nowrap">
                                                                <button type="button" onClick={() => openReturn(r)} className="font-bold text-brand-700 hover:underline cursor-pointer">#{r.ref}</button>
                                                                <div className="text-[11px] text-slate-500 mt-0.5">{r.date || 'N/A'}</div>
                                                                <div className={`text-[10px] font-bold mt-0.5 ${r.kind === 'purchase' ? 'text-teal-600' : 'text-rose-500'}`}>({r.kind === 'purchase' ? 'From Purchase' : 'Damage Return'})</div>
                                                            </td>
                                                            <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{l.productName}</td>
                                                            <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{l.company}</td>
                                                            <td className="py-3 px-3 whitespace-nowrap">
                                                                <QtyStack main={r.main} free={r.free} info={l.info} valueClass="text-violet-600" />
                                                                {r.bMF > 0 && <div className="mt-1"><Note>Main-এর {qtyText(r.bMF, l.info).text}, Free স্টক থেকে নেওয়া</Note></div>}
                                                                {r.bFM > 0 && <div className="mt-1"><Note>Free-এর {qtyText(r.bFM, l.info).text}, Main স্টক থেকে নেওয়া</Note></div>}
                                                            </td>
                                                            <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">{r.value > 0 ? `৳${fmt(r.value)}` : <span className="text-slate-300">—</span>}</td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                            {retRows.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-violet-50/60 font-bold text-[13px]">
                                                        <td className="py-3 px-3 text-slate-700" colSpan={3}>Total</td>
                                                        <td className="py-3 px-3 whitespace-nowrap"><QtyStack main={l.retMain} free={l.retFree} info={l.info} valueClass="text-violet-600" /></td>
                                                        <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">৳{fmt(retValue)}</td>
                                                    </tr>
                                                </tfoot>
                                            )}
                                        </table>
                                    )}

                                    {tab === 'available' && (
                                        <table className="w-full min-w-[480px] text-left border-collapse">
                                            <thead className="sticky top-0">
                                                <tr className={`text-[11px] font-bold uppercase tracking-wide ${availTotal > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                    <th className={th}>Details</th>
                                                    <th className={th}>Main</th>
                                                    <th className={th}>Free</th>
                                                    <th className={th}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                                                <tr>
                                                    <td className="py-3 px-3 font-semibold">Damage Total</td>
                                                    <td className="py-3 px-3"><Mini v={l.main} cls="text-brand-700" /></td>
                                                    <td className="py-3 px-3"><Mini v={l.free} cls="text-emerald-600" /></td>
                                                    <td className="py-3 px-3"><Mini v={damageTotal} cls="text-rose-600" /></td>
                                                </tr>
                                                <tr>
                                                    <td className="py-3 px-3 font-semibold">(-) Company Return</td>
                                                    <td className="py-3 px-3"><Mini v={l.retMain} cls="text-brand-700" /></td>
                                                    <td className="py-3 px-3"><Mini v={l.retFree} cls="text-emerald-600" /></td>
                                                    <td className="py-3 px-3"><Mini v={retTotal} cls="text-violet-600" /></td>
                                                </tr>
                                            </tbody>
                                            <tfoot>
                                                <tr className={`font-bold text-[13px] ${availTotal > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'}`}>
                                                    <td className="py-3 px-3">Available</td>
                                                    <td className="py-3 px-3"><Mini v={a.main} cls={availTotal > 0 ? 'text-emerald-700' : 'text-rose-600'} /></td>
                                                    <td className="py-3 px-3"><Mini v={a.free} cls={availTotal > 0 ? 'text-emerald-700' : 'text-rose-600'} /></td>
                                                    <td className="py-3 px-3">{availTotal > 0 ? <Mini v={availTotal} cls="text-emerald-700" /> : '0 pcs'}</td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default DamageStockSingleInvoice;