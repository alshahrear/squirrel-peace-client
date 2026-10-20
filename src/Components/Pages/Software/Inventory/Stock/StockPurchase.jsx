import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaEdit, FaCheck, FaTimes } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

// Qty এর Bundle/Pcs ভাগ করার helper (Return-এর আগের মূল সংখ্যা দিয়ে হিসাব)
const getPerSub = (b) => (b.parentMode === true ? Number(b.pcsPerSub) || 0 : 0);

// কোন pool (paid / free) থেকে stock গেছে
const getPool = (a) => a.pool || ((a.kind || 'main') === 'main' ? 'paid' : 'free');
// kind এর নিজের pool না হয়ে অন্য pool থেকে নেওয়া হলে true
const isBorrowAlloc = (a) => ((a.kind || 'main') === 'main') !== (getPool(a) === 'paid');

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
const getFreePerUnit = (b) => {
    if (Number(b.pcsPerUnit) > 0) return Number(b.pcsPerUnit);
    const uq = Number(b.freeUnitQty) || 0;
    const sq = Number(b.freeSubQty) || 0;
    const pq = Number(b.freePcsQty) || 0;
    if (uq <= 0) return 0;
    const per = ((Number(b.origFreeQty) || 0) - pq - sq * getPerSub(b)) / uq;
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


// See Return modal-এর rows (Main / Free / Others Free)
const getReturnRows = (b) => {
    const r = b.ret || {};
    if ((r.entries || []).length > 0) {
        const out = [];
        r.entries.forEach((e, i) => {
            const base = { returnId: e.returnId, date: e.date || '' };
            if (b.isFreeProduct) {
                if (e.free > 0) {
                    const [u, s, p] = splitQty(e.free, getPerUnit(b), getPerSub(b));
                    out.push({ ...base, key: `others-${e.returnId}-${i}`, name: b.productName, tag: 'Others Free', tagClass: 'bg-violet-100 text-violet-700', qty: fmtQty(u, s, p, b.unit, b.subUnit), total: e.free, value: 0 });
                }
                return;
            }
            if (e.paid > 0) {
                const [u, s, p] = splitQty(e.paid, getPerUnit(b), getPerSub(b));
                out.push({ ...base, key: `main-${e.returnId}-${i}`, name: b.productName, tag: null, tagClass: '', qty: fmtQty(u, s, p, b.unit, b.subUnit), total: e.paid, value: e.amount });
            }
            if (e.free > 0) {
                const [u, s, p] = splitQty(e.free, getFreePerUnit(b), getPerSub(b));
                const q = fmtQty(u, s, p, b.unit, b.subUnit);
                out.push({ ...base, key: `free-${e.returnId}-${i}`, name: b.productName, tag: 'Free', tagClass: 'bg-emerald-100 text-emerald-700', qty: q === '—' ? `${e.free} pcs` : q, total: e.free, value: 0 });
            }
        });
        return out;
    }
    const rows = [];
    if (b.isFreeProduct) {
        if (r.free > 0) {
            const [u, s, p] = splitQty(r.free, getPerUnit(b), getPerSub(b));
            rows.push({ key: 'others', name: b.productName, tag: 'Others Free', tagClass: 'bg-violet-100 text-violet-700', qty: fmtQty(u, s, p, b.unit, b.subUnit), total: r.free, value: 0 });
        }
        return rows.map((x) => ({ ...x, date: (r.dates || []).join(', ') }));
    }
    if (r.paid > 0) {
        const [u, s, p] = splitQty(r.paid, getPerUnit(b), getPerSub(b));
        rows.push({ key: 'main', name: b.productName, tag: null, tagClass: '', qty: fmtQty(u, s, p, b.unit, b.subUnit), total: r.paid, value: r.amount });
    }
    if (r.free > 0) {
        const [u, s, p] = splitQty(r.free, getFreePerUnit(b), getPerSub(b));
        const q = fmtQty(u, s, p, b.unit, b.subUnit);
        rows.push({ key: 'free', name: b.productName, tag: 'Free', tagClass: 'bg-emerald-100 text-emerald-700', qty: q === '—' ? `${r.free} pcs` : q, total: r.free, value: 0 });
    }
    return rows.map((x) => ({ ...x, date: (r.dates || []).join(', ') }));
};

const qtyText = (b) => {
    if (b.hasReturn && (b.isFreeProduct ? b.ret.free : b.ret.paid) > 0) {
        const total = b.isFreeProduct ? b.freeQty : b.paidQty;
        const [ru, rs, rp] = splitQty(total, getPerUnit(b), getPerSub(b));
        return fmtQty(ru, rs, rp, b.unit, b.subUnit);
    }
    return fmtQty(Number(b.unitQty) || 0, Number(b.subQty) || 0, Number(b.pcsQty) || 0, b.unit, b.subUnit);
};

const freeQtyText = (b) => {
    if (b.hasReturn && b.ret.free > 0) {
        const [ru, rs, rp] = splitQty(b.freeQty, getFreePerUnit(b), getPerSub(b));
        const txt = fmtQty(ru, rs, rp, b.unit, b.subUnit);
        return txt === '—' ? `${fmt(b.freeQty)} pcs` : txt;
    }
    let u = Number(b.freeUnitQty) || 0;
    let s = Number(b.freeSubQty) || 0;
    let p = Number(b.freePcsQty) || 0;

    // Purono batch a freeUnitQty/freePcsQty nai, tai freeQty theke bundle + pcs ber kora hobe
    if (b.freeUnitQty === undefined && b.freePcsQty === undefined) {
        const uq = Number(b.unitQty) || 0;
        const pq = Number(b.pcsQty) || 0;
        const paid = Number(b.paidQty) || 0;
        const f = Number(b.freeQty) || 0;
        const perUnit = uq > 0 ? (paid - pq) / uq : 0;
        if (perUnit > 1) {
            u = Math.floor(f / perUnit);
            p = f - u * perUnit;
        } else {
            p = f;
        }
    }

    const txt = fmtQty(u, s, p, b.unit, b.subUnit);
    return txt === '—' ? `${fmt(b.freeQty)} pcs` : txt;
};

// Original purchase qty (return / sales / edit-bad e change hobe na, shudhu purchase edit korle change hobe)
const getOrigQty = (b) => {
    const perSub = getPerSub(b);
    const build = (u, s, p, total) => {
        let uu = Number(u) || 0;
        let ss = Number(s) || 0;
        let pp = Number(p) || 0;
        if (uu + ss + pp === 0 && total > 0) {
            [uu, ss, pp] = splitQty(total, getPerUnit(b), perSub);
        }
        let text = fmtQty(uu, ss, pp, b.unit, b.subUnit);
        if (text === '—') text = `${fmt(total)} pcs`;
        return { text, total };
    };

    const origPaid = Number(b.origPaidQty) || 0;
    const origFree = Number(b.origFreeQty) || 0;

    if (b.isFreeProduct) {
        return { main: null, free: build(b.unitQty, b.subQty, b.pcsQty, origFree), total: origFree };
    }
    return {
        main: build(b.unitQty, b.subQty, b.pcsQty, origPaid),
        free: origFree > 0 ? build(b.freeUnitQty, b.freeSubQty, b.freePcsQty, origFree) : null,
        total: origPaid + origFree,
    };
};

const QtyLine = ({ label, text, total, lbl, chip }) => (
    <div className="flex items-center gap-2">
        <span className={`w-9 text-[9px] font-extrabold uppercase tracking-wide ${lbl}`}>{label}</span>
        <span className="text-[12px] font-semibold text-gray-700">{text}</span>
        {text !== `${fmt(total)} pcs` && (
            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${chip}`}>{fmt(total)} pcs</span>
        )}
    </div>
);

const QtyCell = ({ b }) => {
    const q = getOrigQty(b);
    return (
        <div className="flex flex-col gap-1 min-w-[170px]">
            {q.main && (
                <QtyLine
                    label="Main"
                    text={q.main.text}
                    total={q.main.total}
                    lbl="text-indigo-500"
                    chip="bg-indigo-50 border-indigo-200 text-indigo-600"
                />
            )}
            {q.free && (
                <QtyLine
                    label="Free"
                    text={q.free.text}
                    total={q.free.total}
                    lbl={b.isFreeProduct ? 'text-violet-500' : 'text-emerald-500'}
                    chip={b.isFreeProduct ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}
                />
            )}
            {q.main && q.free && (
                <div className="mt-0.5 pt-1 border-t border-dashed border-gray-200 flex items-center gap-2">
                    <span className="w-9 text-[9px] font-extrabold uppercase tracking-wide text-gray-400">Total</span>
                    <span className="text-[12px] font-extrabold text-gray-800">{fmt(q.total)} pcs</span>
                </div>
            )}
        </div>
    );
};

// Current available qty (bundle / pcs format e) - return, sales, customer return shob hisab hoye
const getAvailQty = (b) => {
    const perSub = getPerSub(b);
    const build = (total, per) => {
        const [u, s, p] = splitQty(total, per, perSub);
        let text = fmtQty(u, s, p, b.unit, b.subUnit);
        if (text === '—') text = `${fmt(total)} pcs`;
        return { text, total };
    };

    const availPaid = Number(b.availPaidQty) || 0;
    const availFree = Number(b.availFreeQty) || 0;

    if (b.isFreeProduct) {
        return { main: null, free: build(availFree, getPerUnit(b)), total: availFree };
    }
    return {
        main: build(availPaid, getPerUnit(b)),
        free: Number(b.origFreeQty) > 0 ? build(availFree, getFreePerUnit(b)) : null,
        total: availPaid + availFree,
    };
};

const AvailCell = ({ b }) => {
    const q = getAvailQty(b);
    const totalColor = q.total > 0 ? 'text-emerald-600' : 'text-red-600';
    const line = (label, item, lbl, chip) => (
        <div className="flex items-center gap-2">
            <span className={`w-9 text-[9px] font-extrabold uppercase tracking-wide ${lbl}`}>{label}</span>
            <span className={`text-[12px] font-semibold ${item.total > 0 ? 'text-gray-700' : 'text-red-500'}`}>{item.text}</span>
            {item.text !== `${fmt(item.total)} pcs` && (
                <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-bold ${chip}`}>{fmt(item.total)} pcs</span>
            )}
        </div>
    );
    return (
        <div className="flex flex-col gap-1 min-w-[170px]">
            {q.main && line('Main', q.main, 'text-indigo-500', 'bg-indigo-50 border-indigo-200 text-indigo-600')}
            {q.free && line(
                'Free',
                q.free,
                b.isFreeProduct ? 'text-violet-500' : 'text-emerald-500',
                b.isFreeProduct ? 'bg-violet-50 border-violet-200 text-violet-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            )}
            {q.main && q.free && (
                <div className="mt-0.5 pt-1 border-t border-dashed border-gray-200 flex items-center gap-2">
                    <span className="w-9 text-[9px] font-extrabold uppercase tracking-wide text-gray-400">Total</span>
                    <span className={`text-[12px] font-extrabold ${totalColor}`}>{fmt(q.total)} pcs</span>
                </div>
            )}
        </div>
    );
};

// Main / Free / Others Free ekta cell er moddhe sundor kore stack kore dekhabe
const KIND_STYLE = {
    main: { label: 'Main', cls: 'bg-indigo-100 text-indigo-700' },
    free: { label: 'Free', cls: 'bg-emerald-100 text-emerald-700' },
    others: { label: 'Others Free', cls: 'bg-violet-100 text-violet-700' },
};

const KindStackBase = ({ parts, align = 'left', showTotal = true, valueClass = 'text-gray-800' }) => {
    const list = (parts || []).filter((p) => Number(p.value) > 0);
    if (list.length === 0) return <span className="text-gray-300">—</span>;
    const total = list.reduce((s, p) => s + Number(p.value), 0);
    const right = false;
    return (
        <div className={`flex flex-col gap-1 ${right ? 'items-end' : 'items-start'}`}>
            {list.map((p) => (
                <div key={p.kind} className={`flex items-center gap-1.5 ${right ? 'flex-row-reverse' : ''}`}>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap ${KIND_STYLE[p.kind].cls}`}>
                        {KIND_STYLE[p.kind].label}
                    </span>
                    <span className={`font-bold ${valueClass}`}>{p.text ?? `${fmt(p.value)} pcs`}</span>
                    {p.pcs && p.text && p.text !== `${fmt(p.value)} pcs` && (
                        <span className="px-1.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600 whitespace-nowrap">
                            {fmt(p.value)} pcs
                        </span>
                    )}
                </div>
            ))}
            {showTotal && list.length > 1 && (
                <div className="w-full pt-1 border-t border-dashed border-gray-300 text-[11px] font-extrabold text-gray-700 text-right">
                    Total: {fmt(total)} pcs
                </div>
            )}
        </div>
    );
};

const KindStack = ({ notes, ...rest }) => (
    <div className="flex flex-col">
        <KindStackBase {...rest} />
        {(notes || []).map((n, i) => (
            <div key={i} className="mt-1 text-[10px] font-semibold text-amber-600 whitespace-nowrap">{n}</div>
        ))}
    </div>
);

// Cost sudhu paid qty diye hisab hobe, free qty er kono effect nai
const getCost = (b) => {
    if (b.isFreeProduct) return 0;
    const origPaid = Number(b.origPaidQty ?? b.paidQty) || 0;
    return origPaid > 0 ? (Number(b.netCost) || 0) / origPaid : 0;
};
const getValue = (b) => {
    if (b.isFreeProduct) return 0;
    return getCost(b) * (Number(b.availPaidQty) || 0);
};

const StockPurchase = ({ focusEvent = null }) => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [openOrders, setOpenOrders] = useState({});
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [salesBulkReturns, setSalesBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [salesTab, setSalesTab] = useState('available');
    const [salesRow, setSalesRow] = useState(null);
    const [salesModalShow, setSalesModalShow] = useState(false);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Sell price inline edit
    const [editingId, setEditingId] = useState(null);
    const [editPrice, setEditPrice] = useState('');
    const [savingId, setSavingId] = useState(null);
    const [toast, setToast] = useState(null);

    // Overall History
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyShow, setHistoryShow] = useState(false);
    const [highlight, setHighlight] = useState({});
    const [focusKeys, setFocusKeys] = useState([]);
    const [highlightEv, setHighlightEv] = useState(null);

    const showToast = (type, msg) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 2500);
    };
    const startEdit = (b) => {
        setEditingId(b._id);
        setEditPrice(String(b.sellPrice ?? 0));
    };
    const cancelEdit = () => {
        setEditingId(null);
        setEditPrice('');
    };
    const saveSellPrice = async (b) => {
        const price = Number(editPrice);
        if (editPrice === '' || isNaN(price) || price < 0) {
            showToast('error', 'Valid sell price din!');
            return;
        }
        if (price === Number(b.sellPrice)) {
            cancelEdit();
            return;
        }
        try {
            setSavingId(b._id);
            const res = await fetch(`http://localhost:5000/stock-purchase/${b._id}/sell-price`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sellPrice: price }),
            });
            if (!res.ok) throw new Error('Failed');
            setBatches((prev) =>
                prev.map((x) => (String(x._id) === String(b._id) ? { ...x, sellPrice: price } : x))
            );
            cancelEdit();
            showToast('success', 'Sell price update hoyeche!');
        } catch (err) {
            showToast('error', 'Sell price update hoyni!');
        } finally {
            setSavingId(null);
        }
    };


    const openSalesModal = (b) => {
        setSalesRow(b);
        const tabMap = { purchase: 'batch', company: 'company', sold: 'sold', customer: 'customer', damage: 'damage', adjustment: 'adjustment', adjIn: 'adjustment', adjOut: 'adjustment' };
        setSalesTab(highlight[b._id] && highlightEv ? tabMap[highlightEv.type] : 'available');
        setTimeout(() => setSalesModalShow(true), 10);
    };

    const closeSalesModal = () => {
        setSalesModalShow(false);
        setTimeout(() => setSalesRow(null), 300);
    };

    // Ei batch theke kon kon sales a koto qty gese
    const salesRows = salesRow
        ? sales.flatMap((s) =>
            (s.stockAllocations || [])
                .filter((a) => String(a.batchId) === String(salesRow._id))
                .map((a, idx) => {
                    const qty = Number(a.qty) || 0;
                    const returned = Number(a.returned) || 0;
                    return {
                        key: `${s._id}-${a.batchId}-${a.kind || 'main'}-${idx}`,
                        kind: a.kind || 'main',
                        pool: getPool(a),
                        saleId: s._id,
                        orderNo: s.orderNo,
                        customer: s.customer,
                        orderDate: s.orderDate,
                        deliveryDate: s.deliveryDate,
                        returnDate: [
                            ...new Set(
                                (s.returnHistory || [])
                                    .map((h) => h.returnDate || h.date || h.createdAt)
                                    .filter(Boolean)
                            ),
                        ].join(', '),
                        returnId: (s.returnHistory || [])[(s.returnHistory || []).length - 1]?.returnId || '',
                        qty,
                        returned,
                        net: Math.max(qty - returned, 0),
                    };
                })
        ).reverse()
        : [];
    const salesTotalSold = salesRows.reduce((s, r) => s + r.qty, 0);
    const salesTotalReturned = salesRows.reduce((s, r) => s + r.returned, 0);
    const salesTotalNet = salesRows.reduce((s, r) => s + r.net, 0);
    const salesBatchTotal = salesRow ? (Number(salesRow.origPaidQty) || 0) + (Number(salesRow.origFreeQty) || 0) : 0;
    const adjAllocs = salesRow
        ? adjustments.flatMap((a) => (a.stockAllocations || []).filter((al) => String(al.batchId) === String(salesRow._id)))
        : [];
    const adjSum = (dir, paid) =>
        adjAllocs
            .filter((al) => al.direction === dir && (al.pool === 'paid') === paid)
            .reduce((s, al) => s + (Number(al.qty) || 0), 0);
    const adjInMain = adjSum('in', true);
    const adjInFree = adjSum('in', false);
    const adjOutMain = adjSum('out', true);
    const adjOutFree = adjSum('out', false);
    const adjInAll = adjInMain + adjInFree;
    const adjOutAll = adjOutMain + adjOutFree;
    const salesPercent = salesBatchTotal > 0 ? Math.min((salesTotalNet / salesBatchTotal) * 100, 100) : 0;
    const salesAvailable = salesRow
        ? Math.max(
            salesBatchTotal -
            ((Number(salesRow.ret?.paid) || 0) + (Number(salesRow.ret?.free) || 0)) -
            salesTotalSold - (Number(salesRow.dmgPaid) || 0) - (Number(salesRow.dmgFree) || 0) + adjInAll - adjOutAll +
            salesTotalReturned +
            (Number(salesRow.sbPaid) || 0) + (Number(salesRow.sbFree) || 0),
            0
        )
        : 0;

    const modalRows = salesRow ? getReturnRows(salesRow).slice().reverse() : [];
    const modalTotalQty = modalRows.reduce((s, r) => s + r.total, 0);
    const modalTotalValue = modalRows.reduce((s, r) => s + r.value, 0);

    useEffect(() => {
        const fetchStock = async () => {
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
                console.error('Error fetching stock purchase:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStock();
    }, []);

    // Purchase er returnHistory theke batch wise return ber kore stock theke bad deya
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
            let retAmount = 0;
            const retDates = [];
            const retEntries = [];

            (purchase?.returnHistory || []).forEach((ret) => {
                const rd = ret.returnDate || ret.date || ret.createdAt;
                const entry = { returnId: ret.returnId, date: rd, paid: 0, free: 0, amount: 0 };
                if (b.isFreeProduct) {
                    (ret.freeItems || []).forEach((it) => {
                        if (it.productId === b.productId) {
                            const q = Number(it.returnTotalQty) || 0;
                            retFree += q;
                            entry.free += q;
                            if (rd) retDates.push(rd);
                        }
                    });
                } else {
                    (ret.items || []).forEach((it) => {
                        if (it.productId === b.productId) {
                            const p = Number(it.returnTotalQty) || 0;
                            const f = Number(it.returnFreeTotalQty ?? it.returnFreeQty) || 0;
                            const a = Number(it.returnAmount) || 0;
                            retPaid += p;
                            retFree += f;
                            retAmount += a;
                            entry.paid += p;
                            entry.free += f;
                            entry.amount += a;
                            if (rd) retDates.push(rd);
                        }
                    });
                }
                if (entry.paid > 0 || entry.free > 0) retEntries.push(entry);
            });

            const bulk = bulkMap.get(String(b._id));
            if (bulk) {
                retPaid += bulk.paid;
                retFree += bulk.free;
            }
            const origPaid = Number(b.paidQty) || 0;
            const origFree = Number(b.freeQty) || 0;
            const retTotal = retPaid + retFree;
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
                paidQty: Math.max(origPaid - retPaid, 0),
                freeQty: Math.max(origFree - retFree, 0),
                stockQty: Math.max((Number(b.stockQty) || 0) - retTotal, 0),
                availableQty: availPaid + availFree,
                availPaidQty: availPaid,
                availFreeQty: availFree,
                hasReturn: retTotal > 0,
                sbPaid: sb.paid,
                sbFree: sb.free,
                dmgPaid: dm.paid,
                dmgFree: dm.free,
                ret: { paid: retPaid, free: retFree, amount: retAmount, dates: [...new Set(retDates)], entries: retEntries },
            };
        });
    }, [batches, purchases, sales, bulkReturns, salesBulkReturns, damages, adjustments]);

    // Order (purchaseId) onujayi group + search filter
    const orders = useMemo(() => {
        const q = search.trim().toLowerCase();
        const filtered = stockRows.filter((b) =>
            !q ||
            [b.batchNo, b.company, b.productName, b.invoiceNo]
                .some((f) => (f || '').toString().toLowerCase().includes(q))
        );

        const map = new Map();
        filtered.forEach((b) => {
            const key = b.purchaseId || b.invoiceNo;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    invoiceNo: b.invoiceNo,
                    company: b.company,
                    purchaseDate: b.purchaseDate,
                    receiveDate: b.receiveDate,
                    rows: [],
                });
            }
            map.get(key).rows.push(b);
        });

        return Array.from(map.values())
            .map((o) => ({
                ...o,
                totalQty: o.rows.reduce((s, r) => s + (Number(r.availableQty) || 0), 0),
                totalFree: 0,
                totalOthersFree: 0,
                totalValue: o.rows.reduce((s, r) => s + getValue(r), 0),
            }))
            .reverse(); // notun order upore
    }, [stockRows, search]);

    // ===== Overall History (notification style, latest 30) =====
    const historyEvents = useMemo(() => {
        const toTime = (d) => {
            if (!d) return 0;
            const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
            if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
            const t = Date.parse(d);
            return !isNaN(t) ? t : 0;
        };
        const batchById = new Map(batches.map((b) => [String(b._id), b]));
        // MongoDB _id theke creation time (exact time, latest sort er jonno)
        const oidTime = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);
        const createdTs = (o) => {
            const c = o?.createdAt ? Date.parse(o.createdAt) : NaN;
            return !isNaN(c) ? c : oidTime(o?._id);
        };
        const retTs = (ret, parent) => {
            const c = ret.createdAt ? Date.parse(ret.createdAt) : NaN;
            if (!isNaN(c)) return c;
            // createdAt nai: return date er din-er sesh (23:59:59) dhora hobe,
            // jate oi din-er purchase/sold er cheye return ta upore thake
            const d = toTime(ret.returnDate || ret.date);
            const endOfDay = d ? d + 24 * 60 * 60 * 1000 - 1000 : 0;
            return Math.max(endOfDay, createdTs(parent) + 1);
        };
        const ev = [];
        let seq = 0;
        const push = (type, ref, date, batchIds, ts, meta = {}) => {
            const ids = [...new Set((batchIds || []).map(String))].filter((id) => batchById.has(id));
            if (!ids.length) return;
            const first = batchById.get(ids[0]);
            ev.push({
                key: `${type}-${seq}`,
                type,
                ref: ref || first.invoiceNo,
                date: date || '',
                time: ts || toTime(date),
                ...meta,
                seq: seq++,
                ids,
                batchNos: ids.map((id) => batchById.get(id).batchNo),
                orderKeys: [...new Set(ids.map((id) => { const b = batchById.get(id); return b.purchaseId || b.invoiceNo; }))],
            });
        };

        // Purchase
        const pg = new Map();
        batches.forEach((b) => {
            const k = b.purchaseId || b.invoiceNo;
            if (!pg.has(k)) pg.set(k, []);
            pg.get(k).push(b);
        });
        pg.forEach((rows) => push('purchase', rows[0].invoiceNo, rows[0].receiveDate || rows[0].purchaseDate, rows.map((r) => r._id), Math.max(...rows.map((r) => createdTs(r)))));

        // Company Return
        purchases.forEach((p) => {
            (p.returnHistory || []).forEach((ret) => {
                const pids = new Set([...(ret.items || []), ...(ret.freeItems || [])].map((it) => String(it.productId)));
                const ids = batches
                    .filter((b) => String(b.purchaseId) === String(p._id) && pids.has(String(b.productId)))
                    .map((b) => b._id);
                push('company', null, ret.returnDate || ret.date || ret.createdAt, ids, retTs(ret, p), { returnId: ret.returnId || '' });
            });
        });

        // Bulk Return
        bulkReturns.forEach((r) => {
            push('company', r.invoiceNo, r.returnDate || r.createdAt, (r.stockAllocations || []).map((a) => a.batchId), createdTs(r) || toTime(r.returnDate), { returnId: '', bulkId: r._id, isBulk: true });
        });

        // Sold + Customer Return
        sales.forEach((s) => {
            push('sold', s.orderNo, s.deliveryDate || s.orderDate || s.createdAt, (s.stockAllocations || []).map((a) => a.batchId), (s.deliveredAt ? Date.parse(s.deliveredAt) : 0) || createdTs(s) || toTime(s.deliveryDate || s.orderDate), { saleId: s._id });
            (s.returnHistory || []).forEach((ret) => {
                const pids = new Set([...(ret.items || []), ...(ret.freeItems || [])].map((it) => String(it.productId)));
                const ids = (s.stockAllocations || []).filter((a) => pids.has(String(a.productId))).map((a) => a.batchId);
                push('customer', s.orderNo, ret.returnDate || ret.date || ret.createdAt, ids, retTs(ret, s), { saleId: s._id, returnId: ret.returnId || '' });
            });
        });

        // Sales Bulk Return (Customer Return, stock plus)
        salesBulkReturns.forEach((r) => {
            push('customer', r.invoiceNo, r.returnDate || r.createdAt, (r.stockAllocations || []).map((a) => a.batchId), createdTs(r) || toTime(r.returnDate), { returnId: '', bulkId: r._id, isBulk: true, saleId: r.saleId });
        });

        // Adjustment (In = plus, Out = minus)
        adjustments.forEach((a) => {
            push('adjustment', a.invoiceNo, a.adjustmentDate || a.createdAt, (a.stockAllocations || []).map((al) => al.batchId), createdTs(a) || toTime(a.adjustmentDate), { adjustId: a._id });
        });

        // Damage (stock minus)
        damages.forEach((d) => {
            push('damage', d.invoiceNo, d.damageDate || d.createdAt, (d.stockAllocations || []).map((a) => a.batchId), createdTs(d) || toTime(d.damageDate), { damageId: d._id });
        });

        return ev.sort((a, b) => b.time - a.time || b.seq - a.seq).slice(0, 30);
    }, [batches, purchases, sales, bulkReturns, salesBulkReturns, damages, adjustments]);

    const HISTORY_STYLE = {
        purchase: { label: 'Purchase', cls: 'bg-indigo-100 text-indigo-700' },
        company: { label: 'Company Return', cls: 'bg-rose-100 text-rose-700' },
        sold: { label: 'Sold', cls: 'bg-orange-100 text-orange-700' },
        customer: { label: 'Customer Return', cls: 'bg-violet-100 text-violet-700' },
        damage: { label: 'Damage', cls: 'bg-red-100 text-red-700' },
        adjustment: { label: 'Adjustment', cls: 'bg-amber-100 text-amber-700' },
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
        setSearch('');
        setOpenOrders((prev) => {
            const n = { ...prev };
            e.orderKeys.forEach((k) => (n[k] = true));
            return n;
        });
        const h = {};
        e.ids.forEach((id) => (h[id] = true));
        setHighlight(h);
        setFocusKeys([...e.orderKeys]);
        closeHistory();
        setHighlightEv(e);
    };

    // Stock Products tab theke Open click korle ekhane oi receipt open + highlight hobe
    useEffect(() => {
        if (!focusEvent) return;
        const e = focusEvent;
        setSearch('');
        setOpenOrders((prev) => {
            const n = { ...prev };
            e.orderKeys.forEach((k) => (n[k] = true));
            return n;
        });
        const h = {};
        e.ids.forEach((id) => (h[id] = true));
        setHighlight(h);
        setFocusKeys([...e.orderKeys]);
        setHighlightEv(e);
    }, [focusEvent]);

    // Open korle oi order er page e niye jabe + scroll korbe
    useEffect(() => {
        if (!focusKeys.length || loading) return;
        const idx = orders.findIndex((o) => focusKeys.includes(o.key));
        if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1);
        const t = setTimeout(() => {
            const first = Object.keys(highlight)[0];
            const el = first && document.getElementById(`batch-row-${first}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line
    }, [focusKeys, loading]);

    // Highlight row er baire click korle highlight jabe (modal khola thakle jabe na)
    useEffect(() => {
        if (!Object.keys(highlight).length || salesRow) return;
        const onDown = (ev) => {
            if (ev.target.closest && ev.target.closest('[data-hl="1"]')) return;
            setHighlight({});
            setHighlightEv(null);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [highlight, salesRow]);

    const totalPages = Math.ceil(orders.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = orders.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const grandQty = orders.reduce((s, o) => s + o.totalQty, 0);
    const grandFree = orders.reduce((s, o) => s + (o.totalFree || 0), 0);
    const grandOthersFree = orders.reduce((s, o) => s + (o.totalOthersFree || 0), 0);
    const grandValue = orders.reduce((s, o) => s + o.totalValue, 0);

    const toggleOrder = (key) => setOpenOrders((prev) => ({ ...prev, [key]: !prev[key] }));
    const allOpen = orders.length > 0 && orders.every((o) => openOrders[o.key]);
    const toggleAll = () => {
        const next = {};
        if (!allOpen) orders.forEach((o) => (next[o.key] = true));
        setOpenOrders(next);
    };

    return (
        <div className="bg-gradient-to-br from-slate-100 via-indigo-50 to-pink-50">
            {toast && (
                <div
                    className={`fixed top-5 right-5 z-[300] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-bold text-white ${toast.type === 'success'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-300'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 border-rose-300'
                        }`}
                >
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-white/25 text-xs">
                        {toast.type === 'success' ? '✓' : '!'}
                    </span>
                    {toast.msg}
                </div>
            )}
            {(
                <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
                    <div className="max-w-[1600px] mx-auto space-y-6">

                        {/* Header */}
                        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                            <div>
                                <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                                    Stock All
                                </h2>

                            </div>
                            <div className="flex gap-3">
                                <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                                    <div className="text-[10px] font-bold uppercase text-indigo-400">Available Qty</div>
                                    <div className="text-lg font-extrabold text-indigo-700">{fmt(grandQty)} pcs</div>
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                                    <div className="text-[10px] font-bold uppercase text-emerald-400">Stock Value</div>
                                    <div className="text-lg font-extrabold text-emerald-700">৳{fmt(grandValue)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Table Card */}
                        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-gray-800">Batch Directory</h3>
                                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                                        {orders.length} orders / {orders.reduce((s, o) => s + o.rows.length, 0)} batches
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
                                        value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                        placeholder="Search batch, company, product..."
                                        className="w-64 px-3 py-2 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                    />
                                    <button
                                        onClick={toggleAll}
                                        className="px-3 py-2 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 transition cursor-pointer"
                                    >
                                        {allOpen ? 'Collapse All' : 'Expand All'}
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="text-center py-20 text-gray-500 font-medium">Loading stock...</div>
                            ) : orders.length === 0 ? (
                                <div className="text-center py-20 text-gray-400 font-medium">No stock found!</div>
                            ) : (
                                <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                                <th className="py-3 px-3">Date</th>
                                                <th className="py-3 px-3">Company</th>
                                                <th className="py-3 px-3">Product</th>
                                                <th className="py-3 px-3">Qty</th>
                                                <th className="py-3 px-3">Available Qty</th>
                                                <th className="py-3 px-3 text-center">Per Pcs Price </th>

                                                <th className="py-3 px-3 text-right">Total Value</th>
                                            </tr>
                                        </thead>

                                        {currentOrders.map((order) => {
                                            const isOpen = !!openOrders[order.key];
                                            return (
                                                <tbody key={order.key} className="border-t-4 border-white">
                                                    {/* Order Header Row */}
                                                    <tr
                                                        className={`transition ${isOpen ? 'bg-indigo-100' : 'bg-indigo-50'}`}
                                                    >
                                                        {/* Date */}
                                                        <td className="py-3 px-3 border-l-4 border-indigo-500 whitespace-nowrap">
                                                            <div className="flex flex-col leading-tight text-[11px] text-gray-500 font-medium">
                                                                <span>Purchase: {order.purchaseDate || 'N/A'}</span>
                                                                <span>Received: {order.receiveDate || 'N/A'}</span>
                                                            </div>
                                                        </td>

                                                        {/* Company */}
                                                        <td className="py-3 px-3 text-sm font-bold text-gray-800 whitespace-nowrap">
                                                            {order.company}
                                                        </td>

                                                        {/* Product */}
                                                        <td className="py-3 px-3 whitespace-nowrap">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggleOrder(order.key)}
                                                                title={isOpen ? 'Collapse' : 'Expand'}
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 text-white text-[10px] font-bold shadow-sm shadow-indigo-200 cursor-pointer transition"
                                                            >
                                                                <span className="w-1.5 h-1.5 rounded-full bg-white/90"></span>
                                                                {order.rows.length} product
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
                                                        </td>

                                                        {/* Qty */}
                                                        <td className="py-3 px-3 text-center">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={2.5}
                                                                stroke="currentColor"
                                                                className={`w-4 h-4 mx-auto text-indigo-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'animate-bounce'}`}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </td>

                                                        {/* Total Qty */}
                                                        <td className="py-3 px-3 text-sm font-extrabold text-indigo-700 whitespace-nowrap">
                                                            <span className={order.totalQty > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                                {fmt(order.totalQty)} pcs
                                                            </span>
                                                        </td>

                                                        {/* Per Pcs Cost */}
                                                        <td className="py-3 px-3 text-center">
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={2.5}
                                                                stroke="currentColor"
                                                                className={`w-4 h-4 mx-auto text-indigo-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'animate-bounce'}`}
                                                            >
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </td>
                                                        <td className="py-3 px-3 text-right text-sm font-extrabold text-emerald-700 whitespace-nowrap">
                                                            ৳{fmt(order.totalValue)}
                                                        </td>
                                                    </tr>

                                                    {/* Product Rows */}
                                                    {isOpen &&
                                                        order.rows.map((b) => {
                                                            const value = getValue(b);
                                                            return (
                                                                <tr
                                                                    key={b._id}
                                                                    id={`batch-row-${b._id}`}
                                                                    data-hl={highlight[b._id] ? '1' : undefined}
                                                                    className={`${highlight[b._id] ? 'bg-amber-100 ring-2 ring-inset ring-amber-400' : 'bg-white hover:bg-indigo-50/40'} border-l-4 border-indigo-200 text-[13px] text-gray-700 transition`}
                                                                >
                                                                    <td className="py-2.5 px-3 whitespace-nowrap"></td>
                                                                    <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{b.company}</td>
                                                                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                        {b.productName}
                                                                        {b.isFreeProduct && (
                                                                            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold">Others Free</span>
                                                                        )}
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => openSalesModal(b)}
                                                                            className="ml-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 text-[10px] font-bold shadow-sm transition cursor-pointer"
                                                                        >
                                                                            🧾 See History
                                                                        </button>
                                                                    </td>

                                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                                        <QtyCell b={b} />
                                                                    </td>
                                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                                        <AvailCell b={b} />
                                                                    </td>
                                                                    <td className="py-2.5 px-3 font-bold whitespace-nowrap text-center">
                                                                        {b.isFreeProduct ? (
                                                                            <span className="text-gray-300">—</span>
                                                                        ) : (
                                                                            <span className="inline-flex items-center gap-1.5">
                                                                                <span className="text-violet-600" title="Cost Price">🛒 ৳{fmt(getCost(b))}</span>
                                                                                <span className="text-gray-300">-</span>
                                                                                {editingId === b._id ? (
                                                                                    <span className="inline-flex items-center gap-1">
                                                                                        <span className="text-emerald-600">🏷️ ৳</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            step="any"
                                                                                            autoFocus
                                                                                            value={editPrice}
                                                                                            onChange={(e) => {
                                                                                                const value = e.target.value;
                                                                                                if (/^\d*\.?\d{0,2}$/.test(value)) setEditPrice(value);
                                                                                            }}
                                                                                            onKeyDown={(e) => {
                                                                                                if (e.key === 'Enter') saveSellPrice(b);
                                                                                                if (e.key === 'Escape') cancelEdit();
                                                                                            }}
                                                                                            className="w-20 px-2 py-1 text-xs font-bold text-emerald-700 rounded-lg border border-emerald-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none bg-emerald-50/50"
                                                                                        />
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => saveSellPrice(b)}
                                                                                            disabled={savingId === b._id}
                                                                                            title="Update"
                                                                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm transition cursor-pointer disabled:opacity-50"
                                                                                        >
                                                                                            <FaCheck size={10} />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={cancelEdit}
                                                                                            title="Cancel"
                                                                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-600 transition cursor-pointer"
                                                                                        >
                                                                                            <FaTimes size={10} />
                                                                                        </button>
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="inline-flex items-center gap-1.5 text-emerald-600" title="Sell Price">
                                                                                        🏷️ ৳{fmt(b.sellPrice)}
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => startEdit(b)}
                                                                                            title="Edit Sell Price"
                                                                                            className="w-6 h-6 flex items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition cursor-pointer"
                                                                                        >
                                                                                            <FaEdit size={10} />
                                                                                        </button>
                                                                                    </span>
                                                                                )}
                                                                            </span>
                                                                        )}
                                                                    </td>

                                                                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700 whitespace-nowrap">
                                                                        {b.isFreeProduct ? <span className="text-gray-300">—</span> : `৳${fmt(value)}`}
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

                            {/* Pagination Footer */}
                            {!loading && orders.length > 0 && (
                                <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <span className="text-xs text-gray-500 font-medium">
                                        Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                                    </span>

                                    <div className="flex items-center gap-1.5">
                                        <button
                                            onClick={() => handlePageChange(currentPage - 1)}
                                            disabled={currentPage === 1}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
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
                                                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                                ) {
                                                    return (
                                                        <button
                                                            key={pageNum}
                                                            onClick={() => handlePageChange(pageNum)}
                                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                                                                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                                }`}
                                                        >
                                                            {pageNum}
                                                        </button>
                                                    );
                                                } else if (
                                                    pageNum === currentPage - 2 ||
                                                    pageNum === currentPage + 2
                                                ) {
                                                    return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                                }
                                                return null;
                                            })}
                                        </div>

                                        <button
                                            onClick={() => handlePageChange(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
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
                                                <th className="py-2.5 px-3">Batch No</th>
                                                <th className="py-2.5 px-3">Status</th>
                                                <th className="py-2.5 px-3">Date</th>
                                                <th className="py-2.5 px-3 text-center">Open</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                            {historyEvents.length === 0 ? (
                                                <tr>
                                                    <td colSpan={4} className="py-10 text-center text-gray-400 font-medium">Kono history nai</td>
                                                </tr>
                                            ) : (
                                                historyEvents.map((e) => (
                                                    <tr key={e.key} className="hover:bg-emerald-50/40 transition">
                                                        <td className="py-2.5 px-3">
                                                            <div className="flex flex-col items-start gap-1">
                                                                {e.batchNos.map((n, i) => (
                                                                    <span key={i} className="px-2 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-[11px] font-bold text-gray-700 whitespace-nowrap">
                                                                        {n}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </td>
                                                        <td className="py-2.5 px-3 whitespace-nowrap">
                                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${HISTORY_STYLE[e.type].cls}`}>
                                                                {HISTORY_STYLE[e.type].label}{e.isBulk ? ' (Bulk)' : ''}
                                                            </span>
                                                            <div className="text-[11px] text-gray-500 mt-0.5">#{e.ref}</div>
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

                    {/* See History Modal */}
                    {salesRow && (() => {
                        const companyReturnQty = (Number(salesRow.ret?.paid) || 0) + (Number(salesRow.ret?.free) || 0);
                        const cards = [
                            { key: 'batch', label: 'Purchase Total', value: salesBatchTotal, box: 'bg-indigo-50 border-indigo-100', lbl: 'text-indigo-400', val: 'text-indigo-700', ring: 'ring-indigo-400' },
                            { key: 'company', label: 'Company Return', value: companyReturnQty, box: 'bg-rose-50 border-rose-100', lbl: 'text-rose-400', val: 'text-rose-600', ring: 'ring-rose-400' },
                            { key: 'sold', label: 'Sold', value: salesTotalSold, box: 'bg-orange-50 border-orange-100', lbl: 'text-orange-400', val: 'text-orange-600', ring: 'ring-orange-400' },
                            { key: 'customer', label: 'Customer Return', value: salesTotalReturned + (Number(salesRow.sbPaid) || 0) + (Number(salesRow.sbFree) || 0), box: 'bg-violet-50 border-violet-100', lbl: 'text-violet-400', val: 'text-violet-600', ring: 'ring-violet-400' },
                            { key: 'damage', label: 'Damage', value: (Number(salesRow.dmgPaid) || 0) + (Number(salesRow.dmgFree) || 0), box: 'bg-red-50 border-red-100', lbl: 'text-red-400', val: 'text-red-600', ring: 'ring-red-400' },
                            salesAvailable > 0
                                ? { key: 'available', label: 'Available', value: salesAvailable, box: 'bg-emerald-50 border-emerald-100', lbl: 'text-emerald-400', val: 'text-emerald-600', ring: 'ring-emerald-400' }
                                : { key: 'available', label: 'Available', value: salesAvailable, box: 'bg-red-50 border-red-100', lbl: 'text-red-400', val: 'text-red-600', ring: 'ring-red-400' },
                        ];
                        const th = 'py-2.5 px-3';
                        cards.splice(cards.length - 1, 0, {
                            key: 'adjustment',
                            label: 'Adjustment',
                            value: adjInAll - adjOutAll,
                            box: 'bg-amber-50 border-amber-100',
                            lbl: 'text-amber-500',
                            val: 'text-amber-600',
                            ring: 'ring-amber-400',
                        });
                        const adjustmentGroups = adjustments
                            .map((a) => {
                                const allocs = (a.stockAllocations || []).filter((al) => String(al.batchId) === String(salesRow._id));
                                if (allocs.length === 0) return null;
                                const inn = { main: 0, free: 0 };
                                const out = { main: 0, free: 0 };
                                allocs.forEach((al) => {
                                    const t = al.direction === 'out' ? out : inn;
                                    t[al.pool === 'paid' ? 'main' : 'free'] += Number(al.qty) || 0;
                                });
                                return {
                                    key: `adj-${a._id}`,
                                    adjustId: a._id,
                                    invoiceNo: a.invoiceNo,
                                    date: a.adjustmentDate,
                                    note: a.note || '',
                                    inn,
                                    out,
                                    ts: Date.parse(a.createdAt) || 0,
                                };
                            })
                            .filter(Boolean)
                            .sort((x, y) => y.ts - x.ts);
                        const hv = highlight[salesRow._id] ? highlightEv : null;
                        const hlCls = 'bg-amber-100';
                        // Proti return entry alada row (company tab er moto), newest age
                        const customerRows = (() => {
                            const out = [];
                            sales.forEach((s) => {
                                const myAlloc = (s.stockAllocations || []).find(
                                    (a) => String(a.batchId) === String(salesRow._id)
                                );
                                if (!myAlloc) return;
                                const pid = myAlloc.productId;
                                const allocs = (s.stockAllocations || [])
                                    .filter((a) => String(a.productId) === String(pid))
                                    .map((a) => ({ ...a, kind: a.kind || 'main', left: Number(a.qty) || 0 }));

                                (s.returnHistory || []).forEach((ret, ri) => {
                                    const amt = { main: 0, free: 0, others: 0 };
                                    (ret.items || [])
                                        .filter((it) => String(it.productId) === String(pid))
                                        .forEach((it) => {
                                            amt.main += Number(it.returnTotalQty) || 0;
                                            amt.free += Number(it.returnFreeTotalQty ?? it.returnFreeQty) || 0;
                                        });
                                    (ret.freeItems || [])
                                        .filter((it) => String(it.productId) === String(pid))
                                        .forEach((it) => {
                                            amt.others += Number(it.returnTotalQty) || 0;
                                        });

                                    ['main', 'free', 'others'].forEach((kind) => {
                                        let rem = amt[kind];
                                        if (rem <= 0) return;
                                        let mine = 0;
                                        let mineBorrow = 0;
                                        const list = allocs.filter((a) => a.kind === kind).slice().reverse();
                                        for (const a of list) {
                                            if (rem <= 0) break;
                                            const take = Math.min(a.left, rem);
                                            if (take <= 0) continue;
                                            a.left -= take;
                                            rem -= take;
                                            if (String(a.batchId) === String(salesRow._id)) {
                                                mine += take;
                                                if (isBorrowAlloc(a)) mineBorrow += take;
                                            }
                                        }
                                        if (mine <= 0) return;
                                        const soldQty = allocs
                                            .filter((a) => a.kind === kind && String(a.batchId) === String(salesRow._id))
                                            .reduce((t, a) => t + (Number(a.qty) || 0), 0);
                                        out.push({
                                            key: `${s._id}-${ret.returnId || ri}-${kind}`,
                                            kind,
                                            saleId: s._id,
                                            orderNo: s.orderNo,
                                            customer: s.customer,
                                            returnDate: ret.returnDate || ret.date || ret.createdAt || '',
                                            returnId: ret.returnId || '',
                                            qty: soldQty,
                                            returned: mine,
                                            returnedBorrow: mineBorrow,
                                            soldBorrow: allocs
                                                .filter((a) => a.kind === kind && String(a.batchId) === String(salesRow._id) && isBorrowAlloc(a))
                                                .reduce((t, a) => t + (Number(a.qty) || 0), 0),
                                        });
                                    });
                                });
                            });
                            return out.reverse();
                        })();
                        // ===== Same invoice / order / return er main + free + others ekta row te merge =====
                        const KINDS = ['main', 'free', 'others'];
                        const kindOf = (k) => (k === 'main' ? 'main' : k === 'others' ? 'others' : 'free');
                        const emptyK = () => ({ main: 0, free: 0, others: 0 });
                        // pcs ke bundle / pcs format e convert (company tab er moto)
                        const qtyTxt = (k, v) => {
                            const per = salesRow.isFreeProduct || k === 'main' ? getPerUnit(salesRow) : getFreePerUnit(salesRow);
                            const [u, s, p] = splitQty(v, per, getPerSub(salesRow));
                            const t = fmtQty(u, s, p, salesRow.unit, salesRow.subUnit);
                            return t === '—' ? `${fmt(v)} pcs` : t;
                        };
                        const toParts = (o) =>
                            KINDS.map((k) => ({
                                kind: k,
                                value: o[k],
                                text: o[k] > 0 ? qtyTxt(k, o[k]) : undefined,
                                pcs: true,
                            }));

                        // Sold tab: order wise
                        const soldGroups = (() => {
                            const map = new Map();
                            salesRows.forEach((r) => {
                                if (!map.has(r.saleId)) {
                                    map.set(r.saleId, {
                                        key: r.saleId,
                                        saleId: r.saleId,
                                        orderNo: r.orderNo,
                                        customer: r.customer,
                                        orderDate: r.orderDate,
                                        deliveryDate: r.deliveryDate,
                                        sold: emptyK(),
                                        ret: emptyK(),
                                    });
                                }
                                const g = map.get(r.saleId);
                                const k = kindOf(r.kind);
                                g.sold[k] += r.qty;
                                g.ret[k] += r.returned;
                            });
                            return Array.from(map.values());
                        })();
                        soldGroups.forEach((g) => {
                            g.borrow = emptyK();
                            g.retBorrow = emptyK();
                            salesRows
                                .filter((r) => r.saleId === g.saleId && isBorrowAlloc(r))
                                .forEach((r) => {
                                    const k = kindOf(r.kind);
                                    g.borrow[k] += r.qty;
                                    g.retBorrow[k] += r.returned;
                                });
                        });
                        const soldTotals = emptyK();
                        const soldRetTotals = emptyK();
                        const soldNetTotals = emptyK();
                        salesRows.forEach((r) => {
                            const k = kindOf(r.kind);
                            soldTotals[k] += r.qty;
                            soldRetTotals[k] += r.returned;
                            soldNetTotals[k] += r.net;
                        });
                        const soldNetParts = (g) =>
                            toParts({
                                main: Math.max(g.sold.main - g.ret.main, 0),
                                free: Math.max(g.sold.free - g.ret.free, 0),
                                others: Math.max(g.sold.others - g.ret.others, 0),
                            });

                        // Customer Return tab: return entry wise
                        const customerGroups = (() => {
                            const map = new Map();
                            customerRows.forEach((r) => {
                                const gk = `${r.saleId}-${r.returnId}`;
                                if (!map.has(gk)) {
                                    map.set(gk, {
                                        key: gk,
                                        saleId: r.saleId,
                                        orderNo: r.orderNo,
                                        customer: r.customer,
                                        returnDate: r.returnDate,
                                        returnId: r.returnId,
                                        sold: emptyK(),
                                        ret: emptyK(),
                                    });
                                }
                                const g = map.get(gk);
                                const k = kindOf(r.kind);
                                g.sold[k] += r.qty;
                                g.ret[k] += r.returned;
                            });
                            const base = Array.from(map.values());
                            const sbGroups = salesBulkReturns.map((r) => {
                                const allocs = (r.stockAllocations || []).filter((a) => String(a.batchId) === String(salesRow._id));
                                if (allocs.length === 0) return null;
                                const ret = emptyK();
                                allocs.forEach((a) => {
                                    const q = Number(a.qty) || 0;
                                    if (a.pool === 'paid') ret.main += q;
                                    else if (salesRow.isFreeProduct) ret.others += q;
                                    else ret.free += q;
                                });
                                return {
                                    key: `sbulk-${r._id}`,
                                    isBulk: true,
                                    bulkId: r._id,
                                    fromSales: r.fromSales === true,
                                    saleId: r.saleId,
                                    orderNo: r.invoiceNo,
                                    customer: r.customer,
                                    returnDate: r.returnDate,
                                    returnId: '',
                                    sold: emptyK(),
                                    ret,
                                };
                            }).filter(Boolean).reverse();
                            return [...sbGroups, ...base];
                        })();
                        customerGroups.forEach((g) => {
                            g.borrow = emptyK();
                            g.retBorrow = emptyK();
                            customerRows
                                .filter((x) => `${x.saleId}-${x.returnId}` === g.key)
                                .forEach((x) => {
                                    const k = kindOf(x.kind);
                                    g.borrow[k] += x.soldBorrow || 0;
                                    g.retBorrow[k] += x.returnedBorrow || 0;
                                });
                        });
                        const custRetTotals = emptyK();
                        customerGroups.forEach((g) => KINDS.forEach((k) => (custRetTotals[k] += g.ret[k])));

                        // Company Return tab: return invoice wise
                        const purchaseCompanyGroups = (() => {
                            const map = new Map();
                            modalRows.filter((row) => row.returnId).forEach((row) => {
                                const gk = row.returnId || 'all';
                                if (!map.has(gk)) {
                                    map.set(gk, {
                                        key: gk,
                                        returnId: row.returnId,
                                        date: row.date,
                                        name: row.name,
                                        qty: {},
                                        total: emptyK(),
                                        value: 0,
                                    });
                                }
                                const g = map.get(gk);
                                const k = row.tag === 'Free' ? 'free' : row.tag === 'Others Free' ? 'others' : 'main';
                                g.qty[k] = row.qty;
                                g.total[k] += row.total;
                                g.value += Number(row.value) || 0;
                            });
                            return Array.from(map.values());
                        })();
                        const bulkGroups = bulkReturns.map((r) => {
                            const allocs = (r.stockAllocations || []).filter((a) => String(a.batchId) === String(salesRow._id));
                            if (allocs.length === 0) return null;
                            const total = emptyK();
                            let paidQ = 0;
                            allocs.forEach((a) => {
                                const q = Number(a.qty) || 0;
                                if (a.pool === 'paid') { total.main += q; paidQ += q; }
                                else if (salesRow.isFreeProduct) total.others += q;
                                else total.free += q;
                            });
                            // kind (ki hisebe return) onujayi abar hisab, pool (kothaw theke gese) diye borrow note
                            total.main = 0; total.free = 0; total.others = 0; paidQ = 0;
                            const bor = { main: 0, free: 0 };
                            allocs.forEach((a) => {
                                const q = Number(a.qty) || 0;
                                const kind = a.kind || (a.pool === 'paid' ? 'main' : 'free');
                                if (kind === 'main') {
                                    total.main += q;
                                    paidQ += q;
                                    if (a.pool !== 'paid') bor.main += q;
                                } else {
                                    if (salesRow.isFreeProduct) total.others += q;
                                    else total.free += q;
                                    if (a.pool === 'paid') bor.free += q;
                                }
                            });
                            const notes = [];
                            if (bor.main > 0) notes.push(` Main-এর ${qtyTxt('free', bor.main)}, Free স্টক থেকে নেওয়া`);
                            if (bor.free > 0) notes.push(` Free-এর ${qtyTxt('main', bor.free)}, Main স্টক থেকে নেওয়া`);
                            const it = (r.items || []).find((x) => allocs.some((a) => String(a.productId) === String(x.productId)) || x.productName === salesRow.productName);
                            return {
                                key: `bulk-${r._id}`,
                                isBulk: true,
                                bulkId: r._id,
                                fromPurchase: r.fromPurchase === true,
                                purchaseId: r.purchaseId,
                                invoiceNo: r.invoiceNo,
                                returnId: '',
                                date: r.returnDate,
                                name: salesRow.productName,
                                qty: {},
                                total,
                                value: paidQ * (Number(it?.buyPrice) || 0),
                                notes,
                            };
                        }).filter(Boolean).reverse();
                        const oidT = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);
                        const dateT = (d) => {
                            if (!d) return 0;
                            const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
                            if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
                            const t = Date.parse(d);
                            return !isNaN(t) ? t : 0;
                        };
                        const parentPurchase = purchases.find((p) => String(p._id) === String(salesRow.purchaseId));
                        const companyGroups = [
                            ...purchaseCompanyGroups.map((g) => {
                                const ret = (parentPurchase?.returnHistory || []).find((x) => String(x.returnId) === String(g.returnId));
                                const c = ret?.createdAt ? Date.parse(ret.createdAt) : NaN;
                                return { ...g, ts: !isNaN(c) ? c : dateT(g.date) };
                            }),
                            ...bulkGroups.map((g) => {
                                const r = bulkReturns.find((x) => String(x._id) === String(g.bulkId));
                                const c = r?.createdAt ? Date.parse(r.createdAt) : NaN;
                                return { ...g, ts: !isNaN(c) ? c : (oidT(g.bulkId) || dateT(g.date)) };
                            }),
                        ].sort((a, b) => b.ts - a.ts);
                        const compTotals = emptyK();
                        companyGroups.forEach((g) => KINDS.forEach((k) => (compTotals[k] += g.total[k])));
                        const companyParts = (o) => toParts(o);

                        // Damage tab: damage invoice wise
                        const damageGroups = damages
                            .map((d) => {
                                const allocs = (d.stockAllocations || []).filter((a) => String(a.batchId) === String(salesRow._id));
                                if (allocs.length === 0) return null;
                                const total = emptyK();
                                let paidQ = 0;
                                allocs.forEach((a) => {
                                    const q = Number(a.qty) || 0;
                                    if (a.pool === 'paid') { total.main += q; paidQ += q; }
                                    else if (salesRow.isFreeProduct) total.others += q;
                                    else total.free += q;
                                });
                                return {
                                    key: `dmg-${d._id}`,
                                    damageId: d._id,
                                    invoiceNo: d.invoiceNo,
                                    date: d.damageDate,
                                    note: d.note || '',
                                    total,
                                    value: paidQ * getCost(salesRow),
                                };
                            })
                            .filter(Boolean)
                            .reverse();
                        const damTotals = emptyK();
                        damageGroups.forEach((g) => KINDS.forEach((k) => (damTotals[k] += g.total[k])));

                        // Available tab: Main / Free / Total cell (bundle text + pcs chip)
                        const AvCell = ({ main, free, valueClass, align = 'right' }) => {
                            const total = main + free;
                            const items = [
                                { label: 'Main', val: main, k: 'main' },
                                { label: 'Free', val: free, k: 'free' },
                            ];
                            return (
                                <div className="flex flex-col items-start gap-1">
                                    {items.map((it) =>
                                        it.val > 0 ? (
                                            <div key={it.k} className="flex items-center gap-1.5">
                                                <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${KIND_STYLE[it.k].cls}`}>{it.label}</span>
                                                <span className={`font-bold ${valueClass}`}>{qtyTxt(it.k, it.val)}</span>
                                                {qtyTxt(it.k, it.val) !== `${fmt(it.val)} pcs` && (
                                                    <span className="px-1.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600 whitespace-nowrap">{fmt(it.val)} pcs</span>
                                                )}
                                            </div>
                                        ) : null
                                    )}
                                    {total === 0 && <span className="text-gray-300">—</span>}
                                    {main > 0 && free > 0 && (
                                        <div className="w-full pt-1 border-t border-dashed border-gray-300 text-[11px] font-extrabold text-gray-700 text-right">
                                            Total: {fmt(total)} pcs
                                        </div>
                                    )}
                                </div>
                            );
                        };
                        // Ekta line: Main cell, Free cell, Total cell (total e bundle text + pcs)
                        const AvTotal = ({ main, free, valueClass }) => {
                            const total = main + free;
                            if (total <= 0) return <span className="text-gray-300">—</span>;
                            const per = getPerUnit(salesRow) > 0 ? getPerUnit(salesRow) : getFreePerUnit(salesRow);
                            const [u, s, p] = splitQty(total, per, getPerSub(salesRow));
                            const t = fmtQty(u, s, p, salesRow.unit, salesRow.subUnit);
                            const txt = t === '—' ? `${fmt(total)} pcs` : t;
                            return (
                                <div className="flex items-center justify-start gap-1.5">
                                    <span className={`font-bold ${valueClass}`}>{txt}</span>
                                    {txt !== `${fmt(total)} pcs` && (
                                        <span className="px-1.5 py-0.5 rounded-md border border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-600 whitespace-nowrap">{fmt(total)} pcs</span>
                                    )}
                                </div>
                            );
                        };

                        // অন্য pool থেকে নেওয়া qty এর নোট (bundle / pcs format এ)
                        const BorrowNote = ({ data, ret = false }) => {
                            if (!data) return null;
                            const rows = KINDS.filter((k) => data[k] > 0);
                            if (rows.length === 0) return null;
                            return (
                                <div className="mt-1 flex flex-col gap-0.5 items-start">
                                    {rows.map((k) => {
                                        const from = k === 'main' ? 'free' : 'main';
                                        const fromLabel = from === 'free' ? 'Free' : 'Main';
                                        const t = qtyTxt(from, data[k]);
                                        return (
                                            <div key={k} className="text-[10px] font-semibold text-amber-600 whitespace-nowrap">
                                                {ret
                                                    ? `↳ ফেরত: ${KIND_STYLE[k].label}-এর ${t} ${fromLabel} স্টকে ফিরেছে`
                                                    : ` ${KIND_STYLE[k].label}-এর ${t}, ${fromLabel} স্টক থেকে নেওয়া`}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        };
                        const borrowFromFree = salesRows.filter((r) => r.kind === 'main' && getPool(r) !== 'paid').reduce((t, r) => t + r.qty, 0);
                        const borrowFromMain = salesRows.filter((r) => r.kind !== 'main' && getPool(r) === 'paid').reduce((t, r) => t + r.qty, 0);
                        const unitCost = getCost(salesRow);
                        const sumQty = (arr, f) => arr.reduce((s, r) => s + f(r), 0);
                        const soldMain = sumQty(salesRows.filter((r) => getPool(r) === 'paid'), (r) => r.qty);
                        const soldFree = sumQty(salesRows.filter((r) => getPool(r) !== 'paid'), (r) => r.qty);
                        const custRetMain = sumQty(salesRows.filter((r) => getPool(r) === 'paid'), (r) => r.returned) + (Number(salesRow.sbPaid) || 0);
                        const custRetFree = sumQty(salesRows.filter((r) => getPool(r) !== 'paid'), (r) => r.returned) + (Number(salesRow.sbFree) || 0);
                        const purchaseMain = Number(salesRow.origPaidQty) || 0;
                        const purchaseFree = Number(salesRow.origFreeQty) || 0;
                        const compRetMain = Number(salesRow.ret?.paid) || 0;
                        const compRetFree = Number(salesRow.ret?.free) || 0;
                        const availMain = Math.max(purchaseMain - compRetMain - soldMain - (Number(salesRow.dmgPaid) || 0) + custRetMain + adjInMain - adjOutMain, 0);
                        const availFree = Math.max(purchaseFree - compRetFree - soldFree - (Number(salesRow.dmgFree) || 0) + custRetFree + adjInFree - adjOutFree, 0);

                        return (
                            <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${salesModalShow ? 'opacity-100' : 'opacity-0'}`}>
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeSalesModal} />
                                <div className={`relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${salesModalShow ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                                    <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                                        <div>
                                            <h3 className="text-base font-extrabold">🧾 Batch History</h3>
                                            <p className="text-[11px] text-white/80 mt-0.5">Batch: {salesRow.batchNo} | {salesRow.productName}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={closeSalesModal}
                                            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer"
                                        >
                                            ✕
                                        </button>
                                    </div>

                                    <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                                        <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                                            {cards.map((c) => (
                                                <button
                                                    key={c.key}
                                                    type="button"
                                                    onClick={() => setSalesTab(c.key)}
                                                    className={`rounded-2xl border px-3 py-3 text-center transition cursor-pointer hover:shadow-md ${c.box} ${salesTab === c.key ? `ring-2 ${c.ring} shadow-md` : ''}`}
                                                >
                                                    <div className={`text-[10px] font-bold uppercase ${c.lbl}`}>{c.label}</div>
                                                    <div className={`text-base font-extrabold ${c.val}`}>{fmt(c.value)} pcs</div>
                                                </button>
                                            ))}
                                        </div>

                                        <div>
                                            <div className="flex justify-between text-[11px] font-semibold text-gray-500 mb-1">
                                                <span>Net Sold: {fmt(salesTotalNet)} / {fmt(salesBatchTotal)} pcs</span>
                                                <span>{salesPercent.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${salesAvailable > 0 ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : 'bg-gradient-to-r from-red-400 to-rose-500'}`}
                                                    style={{ width: `${salesPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="overflow-x-auto rounded-2xl border border-gray-100 max-h-80 overflow-y-auto">
                                            {salesTab === 'batch' && (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0">
                                                        <tr className="bg-indigo-50 text-indigo-700 text-[11px] font-bold uppercase tracking-wide">
                                                            <th className={th}>Invoice</th>
                                                            <th className={th}>Date</th>
                                                            <th className={th}>Product</th>
                                                            <th className={th}>Qty</th>
                                                            <th className={th}>Cost / pcs</th>
                                                            <th className={th}>Sell / pcs</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className={`text-[13px] text-gray-700 ${hv?.type === 'purchase' ? hlCls : ''}`}>
                                                        <tr>
                                                            <td className="py-3 px-3 whitespace-nowrap">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => window.open(`/purchase-details/${salesRow.purchaseId}`, '_blank')}
                                                                    className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                >
                                                                    #{salesRow.invoiceNo}
                                                                </button>
                                                            </td>
                                                            <td className="py-3 px-3 text-gray-500 whitespace-nowrap">
                                                                <div>Purchase: {salesRow.purchaseDate || 'N/A'}</div>
                                                                <div>Received: {salesRow.receiveDate || 'N/A'}</div>
                                                            </td>
                                                            <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">{salesRow.productName}</td>
                                                            <td className="py-3 px-3 whitespace-nowrap">
                                                                <KindStack
                                                                    valueClass="text-indigo-700"
                                                                    parts={toParts({
                                                                        main: salesRow.isFreeProduct ? 0 : purchaseMain,
                                                                        free: salesRow.isFreeProduct ? 0 : purchaseFree,
                                                                        others: salesRow.isFreeProduct ? purchaseFree : 0,
                                                                    })}
                                                                />
                                                            </td>
                                                            <td className="py-3 px-3 font-bold text-violet-600 whitespace-nowrap">{salesRow.isFreeProduct ? '—' : `৳${fmt(unitCost)}`}</td>
                                                            <td className="py-3 px-3 font-bold text-emerald-600 whitespace-nowrap">৳{fmt(salesRow.sellPrice)}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            )}

                                            {salesTab === 'company' && (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0">
                                                        <tr className="bg-rose-50 text-rose-700 text-[11px] font-bold uppercase tracking-wide">
                                                            <th className={th}>Invoice / Date</th>
                                                            <th className={th}>Product</th>
                                                            <th className={th}>Company</th>
                                                            <th className={th}>Qty</th>
                                                            <th className={`${th} text-right`}>Return Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                        {companyGroups.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                                                                    Company te ekhono kono return kora hoyni
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            companyGroups.map((row) => (
                                                                <tr key={row.key} className={`${hv?.type === 'company' && (row.isBulk ? String(hv.bulkId || '') === String(row.bulkId) : (!hv.isBulk && String(hv.returnId || '') === String(row.returnId || ''))) ? hlCls : 'hover:bg-rose-50/40'} transition`}>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => window.open(
                                                                                row.isBulk
                                                                                    ? (row.fromPurchase
                                                                                        ? `/purchase-details/${row.purchaseId}?scrollToReturn=1`
                                                                                        : `/purchase-bulk-return-view/${row.bulkId}`)
                                                                                    : `/purchase-return-view/${salesRow.purchaseId}?returnId=${row.returnId}`,
                                                                                '_blank'
                                                                            )}
                                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                        >
                                                                            #{row.isBulk ? row.invoiceNo : salesRow.invoiceNo}
                                                                        </button>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">{row.date || 'N/A'}</div>
                                                                        <div className={`text-[10px] font-bold mt-0.5 ${row.isBulk ? 'text-amber-600' : 'text-rose-500'}`}>({row.isBulk ? 'Bulk Return' : 'Purchase Return'})</div>
                                                                    </td>
                                                                    <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                        {row.name}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{salesRow.company}</td>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <KindStack
                                                                            valueClass="text-orange-600"
                                                                            parts={companyParts(row.total)} notes={row.notes}
                                                                        />
                                                                    </td>
                                                                    <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                                                                        {row.value > 0 ? `৳${fmt(row.value)}` : <span className="text-gray-300">—</span>}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                    {companyGroups.length > 0 && (
                                                        <tfoot>
                                                            <tr className="bg-rose-50/60 font-extrabold text-[13px]">
                                                                <td className="py-3 px-3 text-gray-700" colSpan={3}>Total</td>
                                                                <td className="py-3 px-3 whitespace-nowrap">
                                                                    <KindStack valueClass="text-orange-600" parts={companyParts(compTotals)} />
                                                                </td>
                                                                <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">৳{fmt(companyGroups.reduce((s, g) => s + (Number(g.value) || 0), 0))}</td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            )}

                                            {salesTab === 'sold' && (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0">
                                                        <tr className="bg-orange-50 text-orange-700 text-[11px] font-bold uppercase tracking-wide">
                                                            <th className={th}>Order No / Date</th>
                                                            <th className={th}>Customer</th>
                                                            <th className={th}>Product</th>
                                                            <th className={th}>Sold</th>
                                                            <th className={th}>Returned</th>
                                                            <th className={th}>Net</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                        {salesRows.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                                                                    Ei batch theke ekhono kono sales hoyni
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            soldGroups.map((r) => (
                                                                <tr key={r.key} className={`${hv?.type === 'sold' && String(hv.saleId) === String(r.saleId) ? hlCls : 'hover:bg-orange-50/40'} transition`}>
                                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => window.open(`/sales-details/${r.saleId}`, '_blank')}
                                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                        >
                                                                            #{r.orderNo}
                                                                        </button>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">Order: {r.orderDate || 'N/A'}</div>
                                                                        <div className="text-[11px] text-gray-500">Delivered: {r.deliveryDate || 'N/A'}</div>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">{r.customer}</td>
                                                                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                        {salesRow.productName}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                        <KindStack align="right" valueClass="text-orange-600" parts={toParts(r.sold)} />
                                                                        <BorrowNote data={r.borrow} />
                                                                        <BorrowNote data={r.retBorrow} ret />
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                        <KindStack align="right" valueClass="text-violet-600" parts={toParts(r.ret)} />
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                        <KindStack align="right" valueClass="text-emerald-700" parts={soldNetParts(r)} />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                    {salesRows.length > 0 && (
                                                        <tfoot>
                                                            <tr className="bg-orange-50/60 font-extrabold text-[13px]">
                                                                <td className="py-3 px-3 text-gray-700" colSpan={3}>Total</td>
                                                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                                                    <KindStack align="right" valueClass="text-orange-600" parts={toParts(soldTotals)} />
                                                                </td>
                                                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                                                    <KindStack align="right" valueClass="text-violet-600" parts={toParts(soldRetTotals)} />
                                                                </td>
                                                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                                                    <KindStack align="right" valueClass="text-emerald-700" parts={toParts(soldNetTotals)} />
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            )}

                                            {salesTab === 'customer' && (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0">
                                                        <tr className="bg-violet-50 text-violet-700 text-[11px] font-bold uppercase tracking-wide">
                                                            <th className={th}>Order No / Date</th>
                                                            <th className={th}>Customer</th>
                                                            <th className={th}>Product</th>
                                                            <th className={th}>Sold</th>
                                                            <th className={th}>Returned</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                        {customerGroups.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                                                                    Customer ekhono kono return koreni
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            customerGroups.map((r) => (
                                                                <tr key={r.key} className={`${hv?.type === 'customer' && (r.isBulk ? (hv.isBulk && String(hv.bulkId) === String(r.bulkId)) : (!hv.isBulk && String(hv.saleId) === String(r.saleId) && String(hv.returnId || '') === String(r.returnId || ''))) ? hlCls : 'hover:bg-violet-50/40'} transition`}>
                                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => window.open(
                                                                                r.isBulk
                                                                                    ? (r.fromSales
                                                                                        ? `/sales-details/${r.saleId}?scrollToReturn=1`
                                                                                        : `/sales-bulk-return-view/${r.bulkId}`)
                                                                                    : `/sales-return-view/${r.saleId}?returnId=${r.returnId}`,
                                                                                '_blank'
                                                                            )}
                                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                        >
                                                                            #{r.orderNo}
                                                                        </button>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">Return: {r.returnDate || 'N/A'}</div>
                                                                        {r.isBulk && <div className="text-[10px] font-bold mt-0.5 text-amber-600">(Bulk Return)</div>}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">{r.customer}</td>
                                                                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                        {salesRow.productName}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                        <KindStack align="right" showTotal={false} valueClass="text-orange-600 font-semibold" parts={toParts(r.sold)} />
                                                                        <BorrowNote data={r.borrow} />
                                                                        <BorrowNote data={r.retBorrow} ret />
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                        <KindStack align="right" valueClass="text-violet-600" parts={toParts(r.ret)} />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                    {customerGroups.length > 0 && (
                                                        <tfoot>
                                                            <tr className="bg-violet-50/60 font-extrabold text-[13px]">
                                                                <td className="py-3 px-3 text-gray-700" colSpan={4}>Total</td>
                                                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                                                    <KindStack align="right" valueClass="text-violet-600" parts={toParts(custRetTotals)} />
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            )}

                                            {salesTab === 'damage' && (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0">
                                                        <tr className="bg-red-50 text-red-700 text-[11px] font-bold uppercase tracking-wide">
                                                            <th className={th}>Invoice / Date</th>
                                                            <th className={th}>Product</th>
                                                            <th className={th}>Company</th>
                                                            <th className={th}>Qty</th>
                                                            <th className={th}>Note</th>
                                                            <th className={`${th} text-right`}>Loss Value</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                        {damageGroups.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={6} className="py-8 text-center text-gray-400 font-medium">
                                                                    Ei batch theke ekhono kono damage hoyni
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            damageGroups.map((row) => (
                                                                <tr key={row.key} className={`${hv?.type === 'damage' && String(hv.damageId) === String(row.damageId) ? hlCls : 'hover:bg-red-50/40'} transition`}>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => window.open(`/damage-details/${row.damageId}`, '_blank')}
                                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                        >
                                                                            #{row.invoiceNo}
                                                                        </button>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">{row.date || 'N/A'}</div>
                                                                        <div className="text-[10px] font-bold mt-0.5 text-red-500">(Damage)</div>
                                                                    </td>
                                                                    <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">{salesRow.productName}</td>
                                                                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{salesRow.company}</td>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <KindStack valueClass="text-red-600" parts={toParts(row.total)} />
                                                                    </td>
                                                                    <td className="py-3 px-3 text-gray-500 text-[12px]">{row.note || <span className="text-gray-300">—</span>}</td>
                                                                    <td className="py-3 px-3 text-right font-bold text-red-600 whitespace-nowrap">
                                                                        {row.value > 0 ? `৳${fmt(row.value)}` : <span className="text-gray-300">—</span>}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                    {damageGroups.length > 0 && (
                                                        <tfoot>
                                                            <tr className="bg-red-50/60 font-extrabold text-[13px]">
                                                                <td className="py-3 px-3 text-gray-700" colSpan={3}>Total</td>
                                                                <td className="py-3 px-3 whitespace-nowrap">
                                                                    <KindStack valueClass="text-red-600" parts={toParts(damTotals)} />
                                                                </td>
                                                                <td className="py-3 px-3"></td>
                                                                <td className="py-3 px-3 text-right text-red-600 whitespace-nowrap">৳{fmt(damageGroups.reduce((s, g) => s + (Number(g.value) || 0), 0))}</td>
                                                            </tr>
                                                        </tfoot>
                                                    )}
                                                </table>
                                            )}

                                            {salesTab === 'adjustment' && (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0">
                                                        <tr className="bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wide">
                                                            <th className={th}>Invoice / Date</th>
                                                            <th className={th}>Product</th>
                                                            <th className={th}>In (+)</th>
                                                            <th className={th}>Out (−)</th>
                                                            <th className={th}>Note</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                        {adjustmentGroups.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                                                                    Ei batch e ekhono kono adjustment hoyni
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            adjustmentGroups.map((g) => (
                                                                <tr key={g.key} className={`${['adjustment', 'adjIn', 'adjOut'].includes(hv?.type) && String(hv.adjustId) === String(g.adjustId) ? hlCls : 'hover:bg-amber-50/40'} transition`}>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => window.open(`/stock-adjustment-view/${g.adjustId}`, '_blank')}
                                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                        >
                                                                            #{g.invoiceNo}
                                                                        </button>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">{g.date || 'N/A'}</div>
                                                                        <div className="text-[10px] font-bold mt-0.5 text-amber-600">(Adjustment)</div>
                                                                    </td>
                                                                    <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">{salesRow.productName}</td>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <KindStack
                                                                            valueClass="text-emerald-600"
                                                                            parts={toParts({
                                                                                main: g.inn.main,
                                                                                free: salesRow.isFreeProduct ? 0 : g.inn.free,
                                                                                others: salesRow.isFreeProduct ? g.inn.free : 0,
                                                                            })}
                                                                        />
                                                                    </td>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <KindStack
                                                                            valueClass="text-rose-600"
                                                                            parts={toParts({
                                                                                main: g.out.main,
                                                                                free: salesRow.isFreeProduct ? 0 : g.out.free,
                                                                                others: salesRow.isFreeProduct ? g.out.free : 0,
                                                                            })}
                                                                        />
                                                                    </td>
                                                                    <td className="py-3 px-3 text-gray-500 text-[12px]">{g.note || <span className="text-gray-300">—</span>}</td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                </table>
                                            )}

                                            {salesTab === 'available' && (
                                                <table className="w-full text-left border-collapse">
                                                    <thead className="sticky top-0">
                                                        <tr className={`text-[11px] font-bold uppercase tracking-wide ${salesAvailable > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                                                            <th className={th}>Details</th>
                                                            <th className={th}>Main</th>
                                                            <th className={th}>Free</th>
                                                            <th className={th}>Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                                        <tr>
                                                            <td className="py-3 px-3 font-semibold">Purchase Total</td>
                                                            <td className="py-3 px-3"><AvCell main={purchaseMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={purchaseFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={purchaseMain} free={purchaseFree} valueClass="text-indigo-700" /></td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-semibold">(-) Company Return</td>
                                                            <td className="py-3 px-3"><AvCell main={compRetMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={compRetFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={compRetMain} free={compRetFree} valueClass="text-rose-600" /></td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-semibold">
                                                                (-) Sold
                                                                {borrowFromFree > 0 && (
                                                                    <div className="text-[10px] font-semibold text-amber-600"> Main-এর {qtyTxt('free', borrowFromFree)} Free স্টক থেকে নেওয়া</div>
                                                                )}
                                                                {borrowFromMain > 0 && (
                                                                    <div className="text-[10px] font-semibold text-amber-600"> Free-এর {qtyTxt('main', borrowFromMain)} Main স্টক থেকে নেওয়া</div>
                                                                )}
                                                            </td>
                                                            <td className="py-3 px-3"><AvCell main={soldMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={soldFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={soldMain} free={soldFree} valueClass="text-orange-600" /></td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-semibold">(-) Damage</td>
                                                            <td className="py-3 px-3"><AvCell main={Number(salesRow.dmgPaid) || 0} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={Number(salesRow.dmgFree) || 0} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={Number(salesRow.dmgPaid) || 0} free={Number(salesRow.dmgFree) || 0} valueClass="text-red-600" /></td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-semibold">(+) Customer Return</td>
                                                            <td className="py-3 px-3"><AvCell main={custRetMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={custRetFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={custRetMain} free={custRetFree} valueClass="text-violet-600" /></td>
                                                        </tr>
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className="border-t border-gray-100 text-[13px] text-gray-700">
                                                            <td className="py-3 px-3 font-semibold">(+) Adjustment In</td>
                                                            <td className="py-3 px-3"><AvCell main={adjInMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={adjInFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={adjInMain} free={adjInFree} valueClass="text-emerald-700" /></td>
                                                        </tr>
                                                        <tr className="border-t border-gray-100 text-[13px] text-gray-700">
                                                            <td className="py-3 px-3 font-semibold">(-) Adjustment Out</td>
                                                            <td className="py-3 px-3"><AvCell main={adjOutMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={adjOutFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={adjOutMain} free={adjOutFree} valueClass="text-rose-600" /></td>
                                                        </tr>
                                                        <tr className={`font-extrabold text-[13px] ${salesAvailable > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                            <td className={`py-3 px-3 sticky bottom-0 z-10 border-t-2 ${salesAvailable > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>Available</td>
                                                            <td className={`py-3 px-3 sticky bottom-0 z-10 border-t-2 ${salesAvailable > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><AvCell main={availMain} free={0} valueClass={salesAvailable > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
                                                            <td className={`py-3 px-3 sticky bottom-0 z-10 border-t-2 ${salesAvailable > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><AvCell main={0} free={availFree} valueClass={salesAvailable > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
                                                            <td className={`py-3 px-3 sticky bottom-0 z-10 border-t-2 ${salesAvailable > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}><AvTotal main={availMain} free={availFree} valueClass={salesAvailable > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
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
            )}
        </div>
    );
};

export default StockPurchase; 