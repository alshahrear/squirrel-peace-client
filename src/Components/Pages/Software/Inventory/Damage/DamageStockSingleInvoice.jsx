import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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
    main: 'bg-indigo-100 text-indigo-700',
    free: 'bg-emerald-100 text-emerald-700',
};

// Main / Free alada kore bundle + pcs format e dekhabe
const QtyStack = ({ main, free, info, valueClass = 'text-gray-800', showTotal = true }) => {
    const rows = [
        { k: 'main', label: 'Main', v: main },
        { k: 'free', label: 'Free', v: free },
    ].filter((x) => x.v > 0);
    if (rows.length === 0) return <span className="text-gray-300 font-bold">—</span>;
    return (
        <div className="flex flex-col items-start gap-1">
            {rows.map((x) => {
                const q = qtyText(x.v, info);
                return (
                    <div key={x.k} className="flex items-center gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${KIND[x.k]}`}>{x.label}</span>
                        <span className={`font-bold ${valueClass}`}>{q.text}</span>
                        {q.chip && (
                            <span className="px-1.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600 whitespace-nowrap">
                                {q.pcs}
                            </span>
                        )}
                    </div>
                );
            })}
            {showTotal && rows.length > 1 && (
                <div className="w-full pt-1 border-t border-dashed border-gray-300 text-[11px] font-extrabold text-gray-700">
                    Total: {fmt(main + free)} pcs
                </div>
            )}
        </div>
    );
};

const HISTORY_STYLE = {
    in: { label: 'Damage In', sign: '+', cls: 'bg-red-100 text-red-700' },
    out: { label: 'Company Return', sign: '−', cls: 'bg-violet-100 text-violet-700' },
};

const DamageStockSingleInvoice = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const focusEvent = location.state?.focusEvent || null;

    const [sales, setSales] = useState([]);
    const [damages, setDamages] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
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

    useEffect(() => {
        Promise.all([
            fetch('https://squirrel-peace-server.onrender.com/sales').then((r) => r.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/sales-damage').then((r) => r.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/purchase').then((r) => r.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/damage-return').then((r) => r.json()).catch(() => []),
        ])
            .then(([s, d, p, r]) => {
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
                        invNo: inv.invoiceNo,
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
                let m = num(it.totalQty);
                let f = num(it.freeQty);
                const bp = num(it.buyPrice);
                const per = num(it.pcsPerUnit);
                const info =
                    per > 1
                        ? { per, perSub: it.parentMode === true ? num(it.pcsPerSub) : 0, unit: it.unit, subUnit: it.subUnit }
                        : null;
                for (const l of queue) {
                    if (m <= 0 && f <= 0) break;
                    const tm = Math.min(m, l.main - l.retMain);
                    const tf = Math.min(f, l.free - l.retFree);
                    if (tm <= 0 && tf <= 0) continue;
                    l.retMain += Math.max(tm, 0);
                    l.retFree += Math.max(tf, 0);
                    m -= Math.max(tm, 0);
                    f -= Math.max(tf, 0);
                    l.returns.push({
                        evId: ev.id,
                        kind: ev.kind,
                        ref: ev.ref,
                        date: ev.date,
                        ts: ev.ts,
                        main: Math.max(tm, 0),
                        free: Math.max(tf, 0),
                        value: r2(Math.max(tm, 0) * bp),
                    });
                    ev.parts.push({
                        key: k,
                        name: it.productName,
                        main: Math.max(tm, 0),
                        free: Math.max(tf, 0),
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
                t.value += l.value;
                t.availValue += r2(a.main * lineUnit(l));
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
    }, [invoices, search, hideEmpty]);

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
            className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full text-white font-bold text-[9px] leading-none shadow-sm ${inv.kind === 'sales'
                ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                : inv.kind === 'customer'
                    ? 'bg-gradient-to-r from-indigo-500 to-blue-500'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500'
                }`}
        >
            {inv.kind === 'sales' ? 'From Sales' : inv.kind === 'customer' ? 'Customer Damage' : 'Stock Damage'}
        </span>
    );

    const th = 'py-2.5 px-3';

    return (
        <div className="bg-gradient-to-br from-slate-100 via-indigo-50 to-pink-50">
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <div>
                            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                                Damage Single Invoice
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Invoice wise damage products, company return & available stock</p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3">
                            <div className="px-4 py-2 rounded-2xl bg-red-50 border border-red-100 text-center">
                                <div className="text-[10px] font-bold uppercase text-red-400">Total Damage</div>
                                <div className="text-lg font-extrabold text-red-600">{fmt(grand.damage)} pcs</div>
                            </div>
                            <div className="px-4 py-2 rounded-2xl bg-violet-50 border border-violet-100 text-center">
                                <div className="text-[10px] font-bold uppercase text-violet-400">Company Returned</div>
                                <div className="text-lg font-extrabold text-violet-700">{fmt(grand.ret)} pcs</div>
                            </div>
                            <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                                <div className="text-[10px] font-bold uppercase text-emerald-400">Available Damage</div>
                                <div className="text-lg font-extrabold text-emerald-700">{fmt(grand.avail)} pcs</div>
                            </div>
                            <div className="px-4 py-2 rounded-2xl bg-pink-50 border border-pink-100 text-center">
                                <div className="text-[10px] font-bold uppercase text-pink-400">Available Value</div>
                                <div className="text-lg font-extrabold text-pink-700">৳{fmt(grand.availValue)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-800">Damage Invoice Directory</h3>
                                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                                    {orders.length} invoices / {orders.reduce((s, o) => s + o.lines.length, 0)} products
                                </span>
                                <button
                                    type="button"
                                    onClick={openHistory}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                                >
                                    🔔 History
                                </button>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                    placeholder="Search invoice, customer, product..."
                                    className="w-64 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                                <button
                                    type="button"
                                    onClick={() => { setHideEmpty((v) => !v); setCurrentPage(1); }}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${hideEmpty ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600'}`}
                                >
                                    {hideEmpty ? 'Showing Available' : 'Hide Fully Returned'}
                                </button>
                                <button
                                    onClick={toggleAll}
                                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 transition cursor-pointer"
                                >
                                    {allOpen ? 'Collapse All' : 'Expand All'}
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="text-center py-20 text-gray-500 font-medium">Loading...</div>
                        ) : orders.length === 0 ? (
                            <div className="text-center py-20 text-gray-400 font-medium">No damage invoice found!</div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
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
                                            <tbody key={inv.id} className="border-t-4 border-white">
                                                <tr className={`transition ${isOpen ? 'bg-indigo-100' : 'bg-indigo-50'}`}>
                                                    <td className="py-3 px-3 border-l-4 border-indigo-500 whitespace-nowrap text-[11px] text-gray-500 font-medium">
                                                        Damage: {inv.date || 'N/A'}
                                                    </td>
                                                    <td className="py-3 px-3 text-sm font-bold text-gray-800 whitespace-nowrap">{inv.customer}</td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => openInvoice(inv)}
                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer text-sm"
                                                        >
                                                            #{inv.invoiceNo}
                                                        </button>
                                                        <div><SourceBadge inv={inv} /></div>
                                                    </td>
                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleOrder(inv.id)}
                                                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-[10px] font-bold shadow-sm shadow-indigo-200 cursor-pointer transition"
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full bg-white/90"></span>
                                                            {inv.lines.length} product
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                    <td className="py-3 px-3 text-sm font-extrabold text-red-600 whitespace-nowrap">{fmt(t.main + t.free)} pcs</td>
                                                    <td className="py-3 px-3 text-sm font-extrabold text-violet-700 whitespace-nowrap">
                                                        {t.retMain + t.retFree > 0 ? `${fmt(t.retMain + t.retFree)} pcs` : <span className="text-gray-300">—</span>}
                                                    </td>
                                                    <td className="py-3 px-3 text-sm font-extrabold whitespace-nowrap">
                                                        <span className={availAll > 0 ? 'text-emerald-600' : 'text-red-600'}>{fmt(availAll)} pcs</span>
                                                    </td>
                                                    <td className="py-3 px-3 text-right text-sm font-extrabold text-emerald-700 whitespace-nowrap">
                                                        {t.value > 0 ? `৳${fmt(t.value)}` : <span className="text-gray-300">—</span>}
                                                    </td>
                                                </tr>

                                                {isOpen &&
                                                    inv.lines.map((l) => {
                                                        const a = lineAvail(l);
                                                        return (
                                                            <tr
                                                                key={l.id}
                                                                id={l.dom}
                                                                data-hl={highlight[l.id] ? '1' : undefined}
                                                                className={`${highlight[l.id] ? 'bg-amber-100 ring-2 ring-inset ring-amber-400' : 'bg-white hover:bg-indigo-50/40'} border-l-4 border-indigo-200 text-[13px] text-gray-700 transition`}
                                                            >
                                                                <td className="py-2.5 px-3"></td>
                                                                <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{l.company}</td>
                                                                <td className="py-2.5 px-3"></td>
                                                                <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                    {l.productName}
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openModal(inv, l)}
                                                                        className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-[10px] font-bold shadow-sm transition cursor-pointer"
                                                                    >
                                                                        🧾 See History
                                                                    </button>
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <QtyStack main={l.main} free={l.free} info={l.info} valueClass="text-red-600" />
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    <QtyStack main={l.retMain} free={l.retFree} info={l.info} valueClass="text-violet-600" />
                                                                </td>
                                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                                    {a.main + a.free > 0 ? (
                                                                        <QtyStack main={a.main} free={a.free} info={l.info} valueClass="text-emerald-600" />
                                                                    ) : (
                                                                        <span className="font-bold text-red-600">0 pcs</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                                                    {l.value > 0 ? (
                                                                        <>৳{fmt(l.value)} <span className="text-[11px] text-gray-500">(৳{fmt(lineUnit(l))}/pcs)</span></>
                                                                    ) : (
                                                                        <span className="text-gray-300">—</span>
                                                                    )}
                                                                </td>
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
                            <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <span className="text-xs text-gray-500 font-medium">
                                    Page <span className="font-bold text-gray-700">{safePage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                                </span>
                                <div className="flex items-center gap-1.5">
                                    <button
                                        onClick={() => safePage > 1 && setCurrentPage(safePage - 1)}
                                        disabled={safePage === 1}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'}`}
                                    >
                                        <FaChevronLeft size={10} /> Previous
                                    </button>
                                    <button
                                        onClick={() => safePage < totalPages && setCurrentPage(safePage + 1)}
                                        disabled={safePage === totalPages}
                                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'}`}
                                    >
                                        Next <FaChevronRight size={10} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ===== Overall History Modal ===== */}
                {historyOpen && (
                    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${historyShow ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeHistory} />
                        <div className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${historyShow ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                                <div>
                                    <h3 className="text-base font-extrabold">🔔 Overall History</h3>
                                    <p className="text-[11px] text-white/80 mt-0.5">Latest {historyEvents.length} activities</p>
                                </div>
                                <button type="button" onClick={closeHistory} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer">✕</button>
                            </div>
                            <div className="max-h-[75vh] overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="sticky top-0">
                                        <tr className="bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
                                            <th className="py-2.5 px-3">Invoice</th>
                                            <th className="py-2.5 px-3">Status</th>
                                            <th className="py-2.5 px-3">Product / Qty</th>
                                            <th className="py-2.5 px-3">Date</th>
                                            <th className="py-2.5 px-3 text-center">Open</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                        {historyEvents.length === 0 ? (
                                            <tr><td colSpan={5} className="py-10 text-center text-gray-400 font-medium">Kono history nai</td></tr>
                                        ) : (
                                            historyEvents.map((e) => {
                                                const st = HISTORY_STYLE[e.type];
                                                const plus = st.sign === '+';
                                                return (
                                                    <tr key={e.key} className="hover:bg-emerald-50/40 transition">
                                                        <td className="py-2.5 px-3 font-bold text-gray-800 whitespace-nowrap">#{e.ref}</td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>{st.label} ({st.sign})</span>
                                                            {e.kindLabel && <div className="text-[10px] text-gray-400 mt-0.5">{e.kindLabel}</div>}
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            <div className="flex flex-col gap-2">
                                                                {e.lines.map((l, i) => (
                                                                    <div key={i} className="flex flex-col gap-1">
                                                                        <div className="text-[11px] font-bold text-gray-500">{l.name}</div>
                                                                        {[{ k: 'main', v: l.main }, { k: 'free', v: l.free }].filter((x) => x.v > 0).map((x) => {
                                                                            const q = qtyText(x.v, l.info);
                                                                            return (
                                                                                <div key={x.k} className="flex items-center gap-1.5">
                                                                                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${KIND[x.k]}`}>{x.k === 'main' ? 'Main' : 'Free'}</span>
                                                                                    <span className={`font-bold ${plus ? 'text-red-600' : 'text-violet-600'}`}>{st.sign}{q.text}</span>
                                                                                    {q.chip && (
                                                                                        <span className="px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-[11px] font-extrabold text-gray-600">({q.pcs})</span>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                        {l.from.length > 0 && (
                                                                            <div className="text-[10px] font-semibold text-amber-600">
                                                                                ↳ Damage Invoice: {[...new Set(l.from.map((f) => `#${f.invNo}`))].join(', ')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{e.date || 'N/A'}</td>
                                                        <td className="py-2.5 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => openHistoryItem(e)}
                                                                className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 text-[10px] font-bold shadow-sm transition cursor-pointer"
                                                            >
                                                                Open
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
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
                        { key: 'damage', label: 'Damage Total', value: damageTotal, box: 'bg-red-50 border-red-100', lbl: 'text-red-400', val: 'text-red-600', ring: 'ring-red-400' },
                        { key: 'return', label: 'Company Return', value: retTotal, box: 'bg-violet-50 border-violet-100', lbl: 'text-violet-400', val: 'text-violet-600', ring: 'ring-violet-400' },
                        availTotal > 0
                            ? { key: 'available', label: 'Available', value: availTotal, box: 'bg-emerald-50 border-emerald-100', lbl: 'text-emerald-400', val: 'text-emerald-600', ring: 'ring-emerald-400' }
                            : { key: 'available', label: 'Available', value: availTotal, box: 'bg-red-50 border-red-100', lbl: 'text-red-400', val: 'text-red-600', ring: 'ring-red-400' },
                    ];
                    const Mini = ({ v, cls }) => {
                        if (v <= 0) return <span className="text-gray-300">—</span>;
                        const q = qtyText(v, l.info);
                        return (
                            <div className="flex items-center gap-1.5">
                                <span className={`font-bold ${cls}`}>{q.text}</span>
                                {q.chip && <span className="px-1.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600 whitespace-nowrap">{q.pcs}</span>}
                            </div>
                        );
                    };
                    return (
                        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${modalShow ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeModal} />
                            <div className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${modalShow ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                                <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                                    <div>
                                        <h3 className="text-base font-extrabold">🧾 Damage Product History</h3>
                                        <p className="text-[11px] text-white/80 mt-0.5">Invoice: #{inv.invoiceNo} | {l.productName}</p>
                                    </div>
                                    <button type="button" onClick={closeModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer">✕</button>
                                </div>

                                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                                    <div className="grid grid-cols-3 gap-3">
                                        {cards.map((c) => (
                                            <button
                                                key={c.key}
                                                type="button"
                                                onClick={() => setTab(c.key)}
                                                className={`rounded-2xl border px-3 py-3 text-center transition cursor-pointer hover:shadow-md ${c.box} ${tab === c.key ? `ring-2 ${c.ring} shadow-md` : ''}`}
                                            >
                                                <div className={`text-[10px] font-bold uppercase ${c.lbl}`}>{c.label}</div>
                                                <div className={`text-base font-extrabold ${c.val}`}>{fmt(c.value)} pcs</div>
                                            </button>
                                        ))}
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                                            <span>Returned to company: {fmt(retTotal)} / {fmt(damageTotal)} pcs</span>
                                            <span>{percent.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                            <div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-500 transition-all duration-500" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto rounded-2xl border border-gray-100 max-h-80 overflow-y-auto">
                                        {tab === 'damage' && (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0">
                                                    <tr className="bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wide">
                                                        <th className={th}>Invoice / Date</th>
                                                        <th className={th}>Customer</th>
                                                        <th className={th}>Product</th>
                                                        <th className={th}>Qty</th>
                                                        <th className={`${th} text-right`}>Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={`text-[13px] text-gray-700 ${hv?.type === 'in' ? 'bg-amber-100' : ''}`}>
                                                    <tr>
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <button type="button" onClick={() => openInvoice(inv)} className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer">#{inv.invoiceNo}</button>
                                                            <div className="text-[11px] text-gray-500 mt-0.5">{inv.date || 'N/A'}</div>
                                                            <SourceBadge inv={inv} />
                                                        </td>
                                                        <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">{inv.customer}</td>
                                                        <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">{l.productName}</td>
                                                        <td className="py-3 px-3 whitespace-nowrap"><QtyStack main={l.main} free={l.free} info={l.info} valueClass="text-red-600" /></td>
                                                        <td className="py-3 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">{l.value > 0 ? `৳${fmt(l.value)}` : <span className="text-gray-300">—</span>}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        )}

                                        {tab === 'return' && (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0">
                                                    <tr className="bg-violet-50 text-violet-700 text-[11px] font-bold uppercase tracking-wide">
                                                        <th className={th}>Invoice / Date</th>
                                                        <th className={th}>Product</th>
                                                        <th className={th}>Company</th>
                                                        <th className={th}>Qty</th>
                                                        <th className={`${th} text-right`}>Return Value</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                    {retRows.length === 0 ? (
                                                        <tr><td colSpan={5} className="py-8 text-center text-gray-400 font-medium">Company te ekhono kono return kora hoyni</td></tr>
                                                    ) : (
                                                        retRows.map((r, i) => (
                                                            <tr key={`${r.evId}-${i}`} className={`${hv?.type === 'out' && String(hv.id) === String(r.evId) ? 'bg-amber-100' : 'hover:bg-violet-50/40'} transition`}>
                                                                <td className="py-3 px-3 whitespace-nowrap">
                                                                    <button type="button" onClick={() => openReturn(r)} className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer">#{r.ref}</button>
                                                                    <div className="text-[11px] text-gray-500 mt-0.5">{r.date || 'N/A'}</div>
                                                                    <div className={`text-[10px] font-bold mt-0.5 ${r.kind === 'purchase' ? 'text-teal-600' : 'text-rose-500'}`}>({r.kind === 'purchase' ? 'From Purchase' : 'Damage Return'})</div>
                                                                </td>
                                                                <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">{l.productName}</td>
                                                                <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{l.company}</td>
                                                                <td className="py-3 px-3 whitespace-nowrap"><QtyStack main={r.main} free={r.free} info={l.info} valueClass="text-violet-600" /></td>
                                                                <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">{r.value > 0 ? `৳${fmt(r.value)}` : <span className="text-gray-300">—</span>}</td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                                {retRows.length > 0 && (
                                                    <tfoot>
                                                        <tr className="bg-violet-50/60 font-extrabold text-[13px]">
                                                            <td className="py-3 px-3 text-gray-700" colSpan={3}>Total</td>
                                                            <td className="py-3 px-3 whitespace-nowrap"><QtyStack main={l.retMain} free={l.retFree} info={l.info} valueClass="text-violet-600" /></td>
                                                            <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">৳{fmt(retValue)}</td>
                                                        </tr>
                                                    </tfoot>
                                                )}
                                            </table>
                                        )}

                                        {tab === 'available' && (
                                            <table className="w-full text-left border-collapse">
                                                <thead className="sticky top-0">
                                                    <tr className={`text-[11px] font-bold uppercase tracking-wide ${availTotal > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                        <th className={th}>Details</th>
                                                        <th className={th}>Main</th>
                                                        <th className={th}>Free</th>
                                                        <th className={th}>Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                    <tr>
                                                        <td className="py-3 px-3 font-semibold">Damage Total</td>
                                                        <td className="py-3 px-3"><Mini v={l.main} cls="text-indigo-600" /></td>
                                                        <td className="py-3 px-3"><Mini v={l.free} cls="text-emerald-600" /></td>
                                                        <td className="py-3 px-3"><Mini v={damageTotal} cls="text-red-600" /></td>
                                                    </tr>
                                                    <tr>
                                                        <td className="py-3 px-3 font-semibold">(-) Company Return</td>
                                                        <td className="py-3 px-3"><Mini v={l.retMain} cls="text-indigo-600" /></td>
                                                        <td className="py-3 px-3"><Mini v={l.retFree} cls="text-emerald-600" /></td>
                                                        <td className="py-3 px-3"><Mini v={retTotal} cls="text-violet-600" /></td>
                                                    </tr>
                                                </tbody>
                                                <tfoot>
                                                    <tr className={`font-extrabold text-[13px] ${availTotal > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                                                        <td className="py-3 px-3">Available</td>
                                                        <td className="py-3 px-3"><Mini v={a.main} cls={availTotal > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
                                                        <td className="py-3 px-3"><Mini v={a.free} cls={availTotal > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
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
        </div>
    );
};

export default DamageStockSingleInvoice;