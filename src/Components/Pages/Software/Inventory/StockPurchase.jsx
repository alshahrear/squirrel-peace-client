import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

// Qty এর Bundle/Pcs ভাগ করার helper (Return-এর আগের মূল সংখ্যা দিয়ে হিসাব)
const getPerUnit = (b) => {
    const uq = Number(b.unitQty) || 0;
    const pq = Number(b.pcsQty) || 0;
    if (uq <= 0) return 0;
    const total = b.isFreeProduct ? Number(b.origFreeQty) || 0 : Number(b.origPaidQty) || 0;
    const per = (total - pq) / uq;
    return per > 0 ? per : 0;
};
const getFreePerUnit = (b) => {
    const uq = Number(b.freeUnitQty) || 0;
    const pq = Number(b.freePcsQty) || 0;
    if (uq <= 0) return 0;
    const per = ((Number(b.origFreeQty) || 0) - pq) / uq;
    return per > 0 ? per : 0;
};
const splitQty = (total, per) => {
    if (per > 0) {
        const u = Math.floor(total / per);
        return [u, Math.round((total - u * per) * 100) / 100];
    }
    return [0, total];
};
const fmtQty = (u, p, unit) => {
    const parts = [];
    if (u > 0) parts.push(`${u} ${unit || 'Unit'}`);
    if (p > 0) parts.push(`${p} pcs`);
    return parts.length ? parts.join(' ') : '—';
};

// See Return modal-এর rows (Main / Free / Others Free)
const getReturnRows = (b) => {
    const r = b.ret || {};
    const rows = [];
    if (b.isFreeProduct) {
        if (r.free > 0) {
            const [u, p] = splitQty(r.free, getPerUnit(b));
            rows.push({ key: 'others', name: b.productName, tag: 'Others Free', tagClass: 'bg-violet-100 text-violet-700', qty: fmtQty(u, p, b.unit), total: r.free, value: 0 });
        }
        return rows;
    }
    if (r.paid > 0) {
        const [u, p] = splitQty(r.paid, getPerUnit(b));
        rows.push({ key: 'main', name: b.productName, tag: null, tagClass: '', qty: fmtQty(u, p, b.unit), total: r.paid, value: r.amount });
    }
    if (r.free > 0) {
        const [u, p] = splitQty(r.free, getFreePerUnit(b));
        rows.push({ key: 'free', name: b.productName, tag: 'Free', tagClass: 'bg-emerald-100 text-emerald-700', qty: fmtQty(u, p, b.unit) === '—' ? `${r.free} pcs` : fmtQty(u, p, b.unit), total: r.free, value: 0 });
    }
    return rows;
};

const qtyText = (b) => {
    if (b.hasReturn && (b.isFreeProduct ? b.ret.free : b.ret.paid) > 0) {
        const total = b.isFreeProduct ? b.freeQty : b.paidQty;
        const [ru, rp] = splitQty(total, getPerUnit(b));
        return fmtQty(ru, rp, b.unit);
    }
    const parts = [];
    if (Number(b.unitQty) > 0) parts.push(`${b.unitQty} ${b.unit || 'Unit'}`);
    if (Number(b.pcsQty) > 0) parts.push(`${b.pcsQty} pcs`);
    return parts.length ? parts.join(' ') : '—';
};

const freeQtyText = (b) => {
    if (b.hasReturn && b.ret.free > 0) {
        const [ru, rp] = splitQty(b.freeQty, getFreePerUnit(b));
        const txt = fmtQty(ru, rp, b.unit);
        return txt === '—' ? `${fmt(b.freeQty)} pcs` : txt;
    }
    let u = Number(b.freeUnitQty) || 0;
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

    const parts = [];
    if (u > 0) parts.push(`${u} ${b.unit || 'Unit'}`);
    if (p > 0) parts.push(`${p} pcs`);
    return parts.length ? parts.join(' ') : `${fmt(b.freeQty)} pcs`;
};

// Cost sudhu paid qty diye hisab hobe, free qty er kono effect nai
const getCost = (b) => {
    if (b.isFreeProduct) return 0;
    const origPaid = Number(b.origPaidQty ?? b.paidQty) || 0;
    return origPaid > 0 ? (Number(b.netCost) || 0) / origPaid : 0;
};
const getValue = (b) => {
    if (b.isFreeProduct) return 0;
    return getCost(b) * Math.min(Number(b.availableQty) || 0, Number(b.paidQty) || 0);
};

const StockPurchase = () => {
    const [batches, setBatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [openOrders, setOpenOrders] = useState({});
    const [purchases, setPurchases] = useState([]);
    const [returnRow, setReturnRow] = useState(null);
    const [modalShow, setModalShow] = useState(false);
    const navigate = useNavigate();

    const openReturnModal = (b) => {
        setReturnRow(b);
        setTimeout(() => setModalShow(true), 10);
    };
    const closeReturnModal = () => {
        setModalShow(false);
        setTimeout(() => setReturnRow(null), 300);
    };

    const modalRows = returnRow ? getReturnRows(returnRow) : [];
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
        return batches.map((b) => {
            const purchase = purchaseMap.get(String(b.purchaseId));
            let retPaid = 0;
            let retFree = 0;
            let retAmount = 0;

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
                            retAmount += Number(it.returnAmount) || 0;
                        }
                    });
                }
            });

            const origPaid = Number(b.paidQty) || 0;
            const origFree = Number(b.freeQty) || 0;
            const retTotal = retPaid + retFree;

            return {
                ...b,
                origPaidQty: origPaid,
                origFreeQty: origFree,
                paidQty: Math.max(origPaid - retPaid, 0),
                freeQty: Math.max(origFree - retFree, 0),
                stockQty: Math.max((Number(b.stockQty) || 0) - retTotal, 0),
                availableQty: Math.max((Number(b.availableQty) || 0) - retTotal, 0),
                hasReturn: retTotal > 0,
                ret: { paid: retPaid, free: retFree, amount: retAmount },
            };
        });
    }, [batches, purchases]);

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
                totalQty: o.rows.reduce((s, r) => s + (r.isFreeProduct ? 0 : Number(r.paidQty) || 0), 0),
                totalFree: o.rows.reduce((s, r) => s + (r.isFreeProduct ? 0 : Number(r.freeQty) || 0), 0),
                totalOthersFree: o.rows.reduce((s, r) => s + (r.isFreeProduct ? Number(r.freeQty) || 0 : 0), 0),
                totalValue: o.rows.reduce((s, r) => s + getValue(r), 0),
            }))
            .reverse(); // notun order upore
    }, [stockRows, search]);

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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Stock Purchase
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Received purchase theke toiri batch wise stock</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-indigo-400">Total Qty</div>
                            <div className="text-lg font-extrabold text-indigo-700">{fmt(grandQty)} pcs</div>
                            {grandFree > 0 && (
                                <div className="mt-0.5 inline-block px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600">
                                    + {fmt(grandFree)} free
                                </div>
                            )}
                            {grandOthersFree > 0 && (
                                <div className="mt-0.5 block w-fit mx-auto px-2 py-0.5 rounded bg-violet-50 border border-violet-200 text-[10px] font-bold text-violet-600">
                                    Others Free: {fmt(grandOthersFree)} pcs
                                </div>
                            )}
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
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
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
                                        <th className="py-3 px-3">Batch</th>
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Product</th>
                                        <th className="py-3 px-3">Buy - Sell</th>
                                        <th className="py-3 px-3">Qty</th>
                                        <th className="py-3 px-3">Total Qty</th>
                                        <th className="py-3 px-3 text-center">Per Pcs Cost</th>
                                        <th className="py-3 px-3 text-right">Total Value</th>
                                    </tr>
                                </thead>

                                {orders.map((order) => {
                                    const isOpen = !!openOrders[order.key];
                                    return (
                                        <tbody key={order.key} className="border-t-4 border-white">
                                            {/* Order Header Row */}
                                            <tr
                                                className={`transition ${isOpen ? 'bg-indigo-100' : 'bg-indigo-50'}`}
                                            >
                                                {/* Batch */}
                                                <td className="py-3 px-3 border-l-4 border-indigo-500 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/purchase-details/${order.key}`)}
                                                        title="View Details"
                                                        className="text-sm font-extrabold text-indigo-700 hover:text-pink-600 hover:underline cursor-pointer transition"
                                                    >
                                                        #{order.invoiceNo}
                                                    </button>
                                                </td>

                                                {/* Date */}
                                                <td className="py-3 px-3 whitespace-nowrap">
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

                                                {/* Buy - Sell */}
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
                                                    {fmt(order.totalQty)} pcs
                                                    {order.totalFree > 0 && (
                                                        <div className="text-[10px] font-bold text-emerald-600">+ {fmt(order.totalFree)} free</div>
                                                    )}
                                                    {order.totalOthersFree > 0 && (
                                                        <div className="text-[10px] font-bold text-violet-600">Others Free: {fmt(order.totalOthersFree)} pcs</div>
                                                    )}
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
                                                            <td className="py-2.5 px-3 font-bold text-indigo-600 whitespace-nowrap">{b.batchNo}</td>
                                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                                {b.hasReturn && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openReturnModal(b)}
                                                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-500 hover:text-white hover:border-orange-500 text-[10px] font-bold shadow-sm transition cursor-pointer"
                                                                    >
                                                                        ↩ See Return
                                                                    </button>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{b.company}</td>
                                                            <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                                {b.productName}
                                                                {b.isFreeProduct && (
                                                                    <span className="ml-2 px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[9px] font-bold">Others Free</span>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-bold whitespace-nowrap">
                                                                <span className="text-indigo-600">{fmt(b.buyPrice)}</span>
                                                                <span className="text-gray-300 mx-1">-</span>
                                                                <span className="text-emerald-600">{fmt(b.sellPrice)}</span>
                                                            </td>
                                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                                {b.isFreeProduct ? (
                                                                    <span className="font-semibold text-emerald-600">{qtyText(b)}</span>
                                                                ) : (
                                                                    <>
                                                                        {qtyText(b)}
                                                                        {Number(b.freeQty) > 0 && (
                                                                            <div className="mt-1 block w-fit px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600">
                                                                                Free: {freeQtyText(b)}
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 whitespace-nowrap">
                                                                {b.isFreeProduct ? (
                                                                    <b className="text-emerald-600">{fmt(b.freeQty)} pcs</b>
                                                                ) : (
                                                                    <>
                                                                        <b className="text-gray-800">{fmt(b.paidQty)} pcs</b>
                                                                        {Number(b.freeQty) > 0 && (
                                                                            <div className="mt-1 block w-fit px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-[10px] font-bold text-emerald-600">
                                                                                Free: {fmt(b.freeQty)} pcs
                                                                            </div>
                                                                        )}
                                                                    </>
                                                                )}
                                                                {Number(b.availableQty) !== Number(b.stockQty) && (
                                                                    <div className="text-[10px] font-semibold text-rose-500">Available: {fmt(b.availableQty)}</div>
                                                                )}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-bold text-violet-600 whitespace-nowrap text-center">
                                                                {b.isFreeProduct ? <span className="text-gray-300">—</span> : `৳${fmt(getCost(b))}`}
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
                </div>
            </div>
            {/* See Return Modal */}
            {returnRow && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${modalShow ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeReturnModal} />
                    <div className={`relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${modalShow ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-orange-500 to-rose-500 text-white">
                            <div>
                                <h3 className="text-base font-extrabold">↩ Return Details</h3>
                                <p className="text-[11px] text-white/80 mt-0.5">Batch: {returnRow.batchNo} | {returnRow.productName}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeReturnModal}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-5 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-orange-50 text-orange-700 text-[11px] font-bold uppercase tracking-wide">
                                        <th className="py-2.5 px-3 rounded-l-lg">Product</th>
                                        <th className="py-2.5 px-3">Company</th>
                                        <th className="py-2.5 px-3">Qty</th>
                                        <th className="py-2.5 px-3">Total Qty</th>
                                        <th className="py-2.5 px-3 text-right rounded-r-lg">Return Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                    {modalRows.map((row) => (
                                        <tr key={row.key}>
                                            <td className="py-3 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                {row.name}
                                                {row.tag && (
                                                    <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${row.tagClass}`}>{row.tag}</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-gray-600 whitespace-nowrap">{returnRow.company}</td>
                                            <td className="py-3 px-3 font-semibold text-orange-600 whitespace-nowrap">{row.qty}</td>
                                            <td className="py-3 px-3 font-bold text-indigo-600 whitespace-nowrap">{fmt(row.total)} pcs</td>
                                            <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                                                {row.tag ? <span className="text-gray-300">—</span> : `৳${fmt(row.value)}`}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-orange-50/60 font-extrabold text-[13px]">
                                        <td className="py-3 px-3 text-gray-700" colSpan={3}>Total</td>
                                        <td className="py-3 px-3 text-indigo-700 whitespace-nowrap">{fmt(modalTotalQty)} pcs</td>
                                        <td className="py-3 px-3 text-right text-rose-600 whitespace-nowrap">৳{fmt(modalTotalValue)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockPurchase;