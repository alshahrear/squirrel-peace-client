import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

// Qty এর Bundle/Pcs ভাগ করার helper (Return-এর আগের মূল সংখ্যা দিয়ে হিসাব)
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

const KindStack = ({ parts, align = 'left', showTotal = true, valueClass = 'text-gray-800' }) => {
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

const StockPurchase = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [openOrders, setOpenOrders] = useState({});
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [salesTab, setSalesTab] = useState('available');
    const [salesRow, setSalesRow] = useState(null);
    const [salesModalShow, setSalesModalShow] = useState(false);
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const openSalesModal = (b) => {
        setSalesRow(b);
        setSalesTab('available');
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
    const salesPercent = salesBatchTotal > 0 ? Math.min((salesTotalNet / salesBatchTotal) * 100, 100) : 0;
    const salesAvailable = salesRow
        ? Math.max(
            salesBatchTotal -
            ((Number(salesRow.ret?.paid) || 0) + (Number(salesRow.ret?.free) || 0)) -
            salesTotalSold +
            salesTotalReturned,
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
        const soldMap = new Map();
        sales.forEach((s) =>
            (s.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = soldMap.get(k) || { main: 0, free: 0, others: 0 };
                const net = Math.max((Number(a.qty) || 0) - (Number(a.returned) || 0), 0);
                cur[a.kind || 'main'] += net;
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

            const origPaid = Number(b.paidQty) || 0;
            const origFree = Number(b.freeQty) || 0;
            const retTotal = retPaid + retFree;
            const sold = soldMap.get(String(b._id)) || { main: 0, free: 0, others: 0 };
            const curPaid = Math.max(origPaid - retPaid, 0);
            const curFree = Math.max(origFree - retFree, 0);
            let availPaid = 0;
            let availFree = 0;
            if (b.isFreeProduct) {
                availFree = Math.max(curFree - (sold.main + sold.free + sold.others), 0);
            } else {
                availPaid = Math.max(curPaid - sold.main, 0);
                availFree = Math.max(curFree - sold.free - sold.others, 0);
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
                ret: { paid: retPaid, free: retFree, amount: retAmount, dates: [...new Set(retDates)], entries: retEntries },
            };
        });
    }, [batches, purchases, sales]);

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
                                                                    className="bg-white hover:bg-indigo-50/40 border-l-4 border-indigo-200 text-[13px] text-gray-700 transition"
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
                                                                                <span className="text-emerald-600" title="Sell Price">🏷️ ৳{fmt(b.sellPrice)}</span>
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
                    {/* See History Modal */}
                    {salesRow && (() => {
                        const companyReturnQty = (Number(salesRow.ret?.paid) || 0) + (Number(salesRow.ret?.free) || 0);
                        const cards = [
                            { key: 'batch', label: 'Purchase Total', value: salesBatchTotal, box: 'bg-indigo-50 border-indigo-100', lbl: 'text-indigo-400', val: 'text-indigo-700', ring: 'ring-indigo-400' },
                            { key: 'company', label: 'Company Return', value: companyReturnQty, box: 'bg-rose-50 border-rose-100', lbl: 'text-rose-400', val: 'text-rose-600', ring: 'ring-rose-400' },
                            { key: 'sold', label: 'Sold', value: salesTotalSold, box: 'bg-orange-50 border-orange-100', lbl: 'text-orange-400', val: 'text-orange-600', ring: 'ring-orange-400' },
                            { key: 'customer', label: 'Customer Return', value: salesTotalReturned, box: 'bg-violet-50 border-violet-100', lbl: 'text-violet-400', val: 'text-violet-600', ring: 'ring-violet-400' },
                            salesAvailable > 0
                                ? { key: 'available', label: 'Available', value: salesAvailable, box: 'bg-emerald-50 border-emerald-100', lbl: 'text-emerald-400', val: 'text-emerald-600', ring: 'ring-emerald-400' }
                                : { key: 'available', label: 'Available', value: salesAvailable, box: 'bg-red-50 border-red-100', lbl: 'text-red-400', val: 'text-red-600', ring: 'ring-red-400' },
                        ];
                        const th = 'py-2.5 px-3';
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
                                        const list = allocs.filter((a) => a.kind === kind).slice().reverse();
                                        for (const a of list) {
                                            if (rem <= 0) break;
                                            const take = Math.min(a.left, rem);
                                            if (take <= 0) continue;
                                            a.left -= take;
                                            rem -= take;
                                            if (String(a.batchId) === String(salesRow._id)) mine += take;
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
                            return Array.from(map.values());
                        })();
                        const custRetTotals = emptyK();
                        customerGroups.forEach((g) => KINDS.forEach((k) => (custRetTotals[k] += g.ret[k])));

                        // Company Return tab: return invoice wise
                        const companyGroups = (() => {
                            const map = new Map();
                            modalRows.forEach((row) => {
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
                        const compTotals = emptyK();
                        companyGroups.forEach((g) => KINDS.forEach((k) => (compTotals[k] += g.total[k])));
                        const companyParts = (o) => toParts(o);

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

                        const unitCost = getCost(salesRow);
                        const sumQty = (arr, f) => arr.reduce((s, r) => s + f(r), 0);
                        const soldMain = sumQty(salesRows.filter((r) => r.kind === 'main'), (r) => r.qty);
                        const soldFree = sumQty(salesRows.filter((r) => r.kind !== 'main'), (r) => r.qty);
                        const custRetMain = sumQty(salesRows.filter((r) => r.kind === 'main'), (r) => r.returned);
                        const custRetFree = sumQty(salesRows.filter((r) => r.kind !== 'main'), (r) => r.returned);
                        const purchaseMain = Number(salesRow.origPaidQty) || 0;
                        const purchaseFree = Number(salesRow.origFreeQty) || 0;
                        const compRetMain = Number(salesRow.ret?.paid) || 0;
                        const compRetFree = Number(salesRow.ret?.free) || 0;
                        const availMain = Math.max(purchaseMain - compRetMain - soldMain + custRetMain, 0);
                        const availFree = Math.max(purchaseFree - compRetFree - soldFree + custRetFree, 0);

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
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                                                    <tbody className="text-[13px] text-gray-700">
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
                                                        {modalRows.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                                                                    Company te ekhono kono return kora hoyni
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            companyGroups.map((row) => (
                                                                <tr key={row.key} className="hover:bg-rose-50/40 transition">
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => window.open(`/purchase-return-view/${salesRow.purchaseId}?returnId=${row.returnId}`, '_blank')}
                                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                        >
                                                                            #{salesRow.invoiceNo}
                                                                        </button>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">{row.date || 'N/A'}</div>
                                                                    </td>
                                                                    <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                        {row.name}
                                                                    </td>
                                                                    <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{salesRow.company}</td>
                                                                    <td className="py-3 px-3 whitespace-nowrap">
                                                                        <KindStack
                                                                            valueClass="text-orange-600"
                                                                            parts={companyParts(row.total)}
                                                                        />
                                                                    </td>
                                                                    <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                                                                        {row.value > 0 ? `৳${fmt(row.value)}` : <span className="text-gray-300">—</span>}
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                    {modalRows.length > 0 && (
                                                        <tfoot>
                                                            <tr className="bg-rose-50/60 font-extrabold text-[13px]">
                                                                <td className="py-3 px-3 text-gray-700" colSpan={3}>Total</td>
                                                                <td className="py-3 px-3 whitespace-nowrap">
                                                                    <KindStack valueClass="text-orange-600" parts={companyParts(compTotals)} />
                                                                </td>
                                                                <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">৳{fmt(modalTotalValue)}</td>
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
                                                                <tr key={r.key} className="hover:bg-orange-50/40 transition">
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
                                                        {customerRows.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={5} className="py-8 text-center text-gray-400 font-medium">
                                                                    Customer ekhono kono return koreni
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            customerGroups.map((r) => (
                                                                <tr key={r.key} className="hover:bg-violet-50/40 transition">
                                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => window.open(`/sales-return-view/${r.saleId}?returnId=${r.returnId}`, '_blank')}
                                                                            className="font-bold text-indigo-600 hover:text-pink-600 hover:underline cursor-pointer"
                                                                        >
                                                                            #{r.orderNo}
                                                                        </button>
                                                                        <div className="text-[11px] text-gray-500 mt-0.5">Return: {r.returnDate || 'N/A'}</div>
                                                                    </td>
                                                                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">{r.customer}</td>
                                                                    <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                        {salesRow.productName}
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                        <KindStack align="right" showTotal={false} valueClass="text-orange-600 font-semibold" parts={toParts(r.sold)} />
                                                                    </td>
                                                                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                                                        <KindStack align="right" valueClass="text-violet-600" parts={toParts(r.ret)} />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        )}
                                                    </tbody>
                                                    {customerRows.length > 0 && (
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
                                                            <td className="py-3 px-3 font-semibold">(-) Sold</td>
                                                            <td className="py-3 px-3"><AvCell main={soldMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={soldFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={soldMain} free={soldFree} valueClass="text-orange-600" /></td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-3 px-3 font-semibold">(+) Customer Return</td>
                                                            <td className="py-3 px-3"><AvCell main={custRetMain} free={0} valueClass="text-indigo-600" /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={custRetFree} valueClass="text-emerald-600" /></td>
                                                            <td className="py-3 px-3"><AvTotal main={custRetMain} free={custRetFree} valueClass="text-violet-600" /></td>
                                                        </tr>
                                                    </tbody>
                                                    <tfoot>
                                                        <tr className={`font-extrabold text-[13px] ${salesAvailable > 0 ? 'bg-emerald-50/60 text-emerald-700' : 'bg-red-50/60 text-red-600'}`}>
                                                            <td className="py-3 px-3">Available</td>
                                                            <td className="py-3 px-3"><AvCell main={availMain} free={0} valueClass={salesAvailable > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
                                                            <td className="py-3 px-3"><AvCell main={0} free={availFree} valueClass={salesAvailable > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
                                                            <td className="py-3 px-3"><AvTotal main={availMain} free={availFree} valueClass={salesAvailable > 0 ? 'text-emerald-700' : 'text-red-600'} /></td>
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