import React, { useState, useEffect, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo } from 'react-icons/fa';

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

const DamageStockProducts = ({ onOpenHistory }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ product: '', company: '' });
    const itemsPerPage = 30;
    const [purchases, setPurchases] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyShow, setHistoryShow] = useState(false);

    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/purchase')
            .then((res) => res.json())
            .then((d) => setPurchases(Array.isArray(d) ? d : []))
            .catch(() => setPurchases([]));
        fetch('https://squirrel-peace-server.onrender.com/damage-return')
            .then((res) => res.json())
            .then((d) => setDamageReturns(Array.isArray(d) ? d : []))
            .catch(() => setDamageReturns([]));
    }, []);

    // Received purchase er damage return (stock theke kome)
    const returnedMap = useMemo(() => {
        const m = new Map();
        purchases.forEach((p) => {
            if (!(p.receiveStatus === 'Received' || p.receiveStatus === 'Yes')) return;
            (p.damageItems || []).forEach((it) => {
                const key = `${(it.productName || '').toString().trim().toLowerCase()}|${(it.company || '').toString().trim().toLowerCase()}`;
                const cur = m.get(key) || { main: 0, free: 0 };
                cur.main += Number(it.totalQty) || 0;
                cur.free += Number(it.freeQty) || 0;
                m.set(key, cur);
            });
        });
        damageReturns.forEach((r) => {
            (r.items || []).forEach((it) => {
                const key = `${(it.productName || '').toString().trim().toLowerCase()}|${(it.company || '').toString().trim().toLowerCase()}`;
                const cur = m.get(key) || { main: 0, free: 0 };
                cur.main += Number(it.totalQty) || 0;
                cur.free += Number(it.freeQty) || 0;
                m.set(key, cur);
            });
        });
        return m;
    }, [purchases, damageReturns]);

    useEffect(() => {
        Promise.all([
            fetch('https://squirrel-peace-server.onrender.com/sales').then((res) => res.json()),
            fetch('https://squirrel-peace-server.onrender.com/sales-damage').then((res) => res.json()).catch(() => []),
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
                            main: 0,
                            free: 0,
                            amount: 0,
                            lastIdx: -1,
                            info: null,
                        });
                    }
                    const g = map.get(key);
                    g.main += Number(it.totalQty) || 0;
                    g.free += Number(it.freeQty) || 0;
                    g.amount += Number(it.subtotal) || 0;
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
                const r = returnedMap.get(g.key) || { main: 0, free: 0 };
                const main = Math.max(g.main - r.main, 0);
                const free = Math.max(g.free - r.free, 0);
                const oldTotal = g.main + g.free;
                return {
                    ...g,
                    main,
                    free,
                    total: main + free,
                    amount: oldTotal > 0 ? g.amount * ((main + free) / oldTotal) : 0,
                };
            })
            .filter((g) => g.total > 0)
            .sort((a, b) => b.lastIdx - a.lastIdx);
    }, [orders, returnedMap]);

    // ===== Overall History (Stock In / Stock Out, latest 30) =====
    const HISTORY_STYLE = {
        in: { label: 'Stock In', cls: 'bg-emerald-100 text-emerald-700' },
        out: { label: 'Stock Out', cls: 'bg-rose-100 text-rose-700' },
    };

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
        // Product wise main/free qty
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

        // Stock In: sales damage (order theke + standalone)
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

        // Stock Out: purchase theke damage return
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

        // Stock Out: damage return form
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
    const openHistoryItem = (e) => {
        setHistoryShow(false);
        setTimeout(() => {
            setHistoryOpen(false);
            if (onOpenHistory) onOpenHistory(e);
        }, 300);
    };

    const products = allProducts.filter(
        (p) =>
            p.productName.toLowerCase().includes(filters.product.trim().toLowerCase()) &&
            p.company.toLowerCase().includes(filters.company.trim().toLowerCase())
    );

    const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safePage - 1) * itemsPerPage;
    const currentItems = products.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const summaryRows = products;

    const grandMain = summaryRows.reduce((s, p) => s + p.main, 0);
    const grandFree = summaryRows.reduce((s, p) => s + p.free, 0);
    const grandAmount = summaryRows.reduce((s, p) => s + p.amount, 0);
    const grandTotal = grandMain + grandFree;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            {/* Overall History Modal */}
            {historyOpen && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${historyShow ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeHistory} />
                    <div className={`relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${historyShow ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                            <div>
                                <h3 className="text-base font-extrabold">🔔 Overall History</h3>
                                <p className="text-[11px] text-white/80 mt-0.5">Latest {historyEvents.length} activities</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeHistory}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-[75vh] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0">
                                    <tr className="bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
                                        <th className="py-2.5 px-3">Invoice No</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3">Qty</th>
                                        <th className="py-2.5 px-3">Date</th>
                                        <th className="py-2.5 px-3 text-center">Open</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                    {historyEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">Kono history nai</td>
                                        </tr>
                                    ) : (
                                        historyEvents.map((e) => (
                                            <tr key={e.key} className="hover:bg-emerald-50/40 transition">
                                                <td className="py-2.5 px-3 font-bold text-gray-800 whitespace-nowrap">#{e.ref}</td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${HISTORY_STYLE[e.type].cls}`}>
                                                        {HISTORY_STYLE[e.type].label} ({e.type === 'in' ? '+' : '−'})
                                                    </span>
                                                </td>
                                                <td className="py-2.5 px-3 whitespace-nowrap">
                                                    <div className="flex flex-col gap-2">
                                                        {(e.lines || []).map((l) => (
                                                            <div key={l.name} className="flex flex-col gap-1">
                                                                <div className="text-[11px] font-bold text-gray-500">{l.name}</div>
                                                                {[{ k: 'main', v: l.main }, { k: 'free', v: l.free }]
                                                                    .filter((x) => x.v > 0)
                                                                    .map((x) => {
                                                                        const q = histQty(x.v, l.info);
                                                                        const plus = e.type === 'in';
                                                                        return (
                                                                            <div key={x.k} className="flex items-center gap-1.5">
                                                                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${x.k === 'main' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                                    {x.k === 'main' ? 'Main' : 'Free'}
                                                                                </span>
                                                                                <span className={`font-bold ${plus ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                    {plus ? '+' : '−'}{q.text}
                                                                                </span>
                                                                                {q.showChip && (
                                                                                    <span className={`px-2 py-0.5 rounded-full border text-[11px] font-extrabold ${plus ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                                                                                        ({q.pcsText})
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Damage Products
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-violet-50 border border-violet-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-violet-400">Total Products</div>
                            <div className="text-lg font-extrabold text-violet-700">{fmt(summaryRows.length)}</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-indigo-400">Total Main Qty</div>
                            <div className="text-lg font-extrabold text-indigo-700">{fmt(grandMain)} pcs</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-teal-50 border border-teal-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-teal-500">Total Free Qty</div>
                            <div className="text-lg font-extrabold text-teal-700">{fmt(grandFree)} pcs</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-pink-50 border border-pink-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-pink-400">Total Qty</div>
                            <div className="text-lg font-extrabold text-pink-700">{fmt(grandTotal)} pcs</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-red-50 border border-red-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-red-400">Total Amount</div>
                            <div className="text-lg font-extrabold text-red-600">৳{fmt(grandAmount)}</div>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Damage Product List</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {products.length} products
                        </span>
                        <button
                            type="button"
                            onClick={openHistory}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                        >
                            🔔 History
                        </button>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => { setFilters({ product: '', company: '' }); setCurrentPage(1); }}
                                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                                >
                                    <FaRedo size={11} /> Clear All Filters
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product</label>
                                <input
                                    type="text"
                                    placeholder="Search product..."
                                    value={filters.product}
                                    onChange={(e) => { setFilters((prev) => ({ ...prev, product: e.target.value })); setCurrentPage(1); }}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <input
                                    type="text"
                                    placeholder="Search company..."
                                    value={filters.company}
                                    onChange={(e) => { setFilters((prev) => ({ ...prev, company: e.target.value })); setCurrentPage(1); }}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No damage product found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-3 w-12">#</th>
                                        <th className="py-3 px-3">Product</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Main Qty</th>
                                        <th className="py-3 px-3">Free Qty</th>
                                        <th className="py-3 px-3">Total Qty</th>
                                        <th className="py-3 px-3 text-right">Total Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((p, i) => (
                                        <tr
                                            key={p.key}
                                            className="bg-white hover:bg-indigo-50/40 border-l-4 border-indigo-200 text-[13px] text-gray-700 transition"
                                        >
                                            <td className="py-3 px-3 text-gray-400 font-semibold">{indexOfFirstItem + i + 1}</td>
                                            <td className="py-3 px-3 whitespace-nowrap font-bold text-gray-800">{p.productName}</td>
                                            <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">{p.company}</td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <QtyBlock total={p.main} info={p.info} valueClass="text-indigo-700" chipClass="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600" />
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-gradient-to-r from-emerald-50 to-teal-100 border-emerald-200 text-emerald-600" />
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <QtyBlock total={p.total} info={p.info} valueClass="text-violet-700" chipClass="bg-gradient-to-r from-violet-50 to-pink-100 border-violet-200 text-violet-600" />
                                            </td>
                                            <td className="py-3 px-3 text-right font-extrabold text-red-600 whitespace-nowrap">
                                                ৳{fmt(p.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && products.length > 0 && (
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

export default DamageStockProducts;