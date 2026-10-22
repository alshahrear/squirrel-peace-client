import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Printer,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    Building2,
    ArrowLeft,
    PackageX,
    User,
    Truck,
    AlertTriangle,
    Undo2,
} from 'lucide-react';

const n = (v) => Number(v) || 0;
const money = (v) => n(v).toFixed(2);

const getRowGross = (it) =>
    n(it.unitQty) * n(it.sellPriceUnit) + n(it.subQty) * n(it.sellPriceSub) + n(it.pcsQty) * n(it.sellPricePcs);

const getOrderSubTotal = (o) => {
    if (o.subTotal !== undefined && o.subTotal !== null && o.subTotal !== '') return n(o.subTotal);
    if (o.grandTotal !== undefined && o.grandTotal !== null && o.grandTotal !== '') return n(o.grandTotal);
    return (o.items || []).reduce((s, it) => s + getRowGross(it), 0);
};

const getItemDiscount = (it) => {
    if (it.discountAmount !== undefined && it.discountAmount !== null) return n(it.discountAmount);
    const gross = getRowGross(it);
    return it.discountType === 'percent' ? (gross * n(it.discount)) / 100 : n(it.discount);
};

const getOrderPwd = (o) => {
    if (o.productWiseDiscount !== undefined && o.productWiseDiscount !== null && o.productWiseDiscount !== '')
        return n(o.productWiseDiscount);
    return (o.items || []).reduce((s, it) => s + getItemDiscount(it), 0);
};

const getOrderOverall = (o) => {
    if (o.overallDiscountValue !== undefined && o.overallDiscountValue !== null && o.overallDiscountValue !== '')
        return n(o.overallDiscountValue);
    const after = getOrderSubTotal(o) - getOrderPwd(o);
    return o.overallDiscountType === 'percent' ? (after * n(o.overallDiscount)) / 100 : n(o.overallDiscount);
};

const getOrderAdjustment = (o) => {
    const amt = n(o.adjustment?.amount);
    return o.adjustment?.type === '-' ? -amt : amt;
};

// Alada alada invoice er item gulo ke product wise ekta row e merge kora
const mergeItems = (lists, { withDiscount = false } = {}) => {
    const map = new Map();
    lists.forEach((list) => {
        (list || []).forEach((it) => {
            const key = String(it.productId || it.productName);
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    productName: it.productName,
                    company: it.company,
                    unit: it.unit,
                    subUnit: it.subUnit,
                    parentMode: it.parentMode === true,
                    pcsPerUnit: it.pcsPerUnit,
                    pcsPerSub: it.pcsPerSub,
                    unitQty: 0,
                    subQty: 0,
                    pcsQty: 0,
                    totalQty: 0,
                    freeUnitQty: 0,
                    freeSubQty: 0,
                    freePcsQty: 0,
                    freeQty: 0,
                    unitAmt: 0,
                    subAmt: 0,
                    pcsAmt: 0,
                    discountAmt: 0,
                    itemTotal: 0,
                });
            }
            const g = map.get(key);
            g.unitQty += n(it.unitQty);
            g.subQty += n(it.subQty);
            g.pcsQty += n(it.pcsQty);
            g.totalQty += n(it.totalPcs ?? it.totalQty);
            g.freeUnitQty += n(it.freeUnitQty);
            g.freeSubQty += n(it.freeSubQty);
            g.freePcsQty += n(it.freePcsQty);
            g.freeQty += n(it.freeQty);
            g.unitAmt += n(it.unitQty) * n(it.sellPriceUnit);
            g.subAmt += n(it.subQty) * n(it.sellPriceSub);
            g.pcsAmt += n(it.pcsQty) * n(it.sellPricePcs);
            const disc = withDiscount ? getItemDiscount(it) : 0;
            g.discountAmt += disc;
            g.itemTotal += n(it.itemTotal ?? it.subtotal ?? getRowGross(it) - disc);
        });
    });
    return Array.from(map.values());
};

const mergeFreeItems = (lists) => {
    const map = new Map();
    lists.forEach((list) => {
        (list || []).forEach((it) => {
            const key = String(it.productId || it.productName);
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    productName: it.productName,
                    company: it.company,
                    unit: it.unit,
                    subUnit: it.subUnit,
                    parentMode: it.parentMode === true,
                    unitQty: 0,
                    subQty: 0,
                    pcsQty: 0,
                    totalQty: 0,
                });
            }
            const g = map.get(key);
            g.unitQty += n(it.unitQty);
            g.subQty += n(it.subQty);
            g.pcsQty += n(it.pcsQty);
            g.totalQty += n(it.totalQty);
        });
    });
    return Array.from(map.values());
};

const uniq = (arr) => [...new Set(arr.filter(Boolean))];

const splitQty = (total, perUnit, perSub, parentMode) => {
    if (perUnit > 0) {
        const u = Math.floor(total / perUnit);
        let rest = total - u * perUnit;
        let s = 0;
        if (parentMode && perSub > 0) {
            s = Math.floor(rest / perSub);
            rest = rest - s * perSub;
        }
        return [u, s, Math.round(rest * 100) / 100];
    }
    return [0, 0, total];
};

// Main + Free + Others Free = Total Quantity
const getCombinedQty = (row, othersQty) => {
    const total = n(row.totalQty) + n(row.freeQty) + n(othersQty);
    const perSub = n(row.pcsPerSub);
    const perUnit =
        n(row.pcsPerUnit) > 0
            ? n(row.pcsPerUnit)
            : n(row.unitQty) > 0
                ? (n(row.totalQty) - n(row.pcsQty) - n(row.subQty) * perSub) / n(row.unitQty)
                : 0;
    const [u, s, p] = splitQty(total, perUnit, perSub, row.parentMode);
    return { u, s, p, total };
};

// Merged row er price show (total amount / qty)
const PriceCell = ({ row }) => (
    <>
        ৳{money(row.unitAmt)}
        {n(row.unitQty) > 0 && (
            <span className="text-[10px] text-slate-400 ml-1">
                (৳{money(row.unitAmt / row.unitQty)}/{row.unit || 'unit'})
            </span>
        )}
        {row.parentMode && (
            <div className="text-fuchsia-600">
                ৳{money(row.subAmt)}
                {n(row.subQty) > 0 && (
                    <span className="text-[10px] text-slate-400 ml-1">
                        (৳{money(row.subAmt / row.subQty)}/{row.subUnit || 'sub'})
                    </span>
                )}
            </div>
        )}
    </>
);

const SaleCustomerSumDetails = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const ids = location.state?.ids || [];
    const backTo = location.state?.from || -1;

    const [loading, setLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (!ids.length) {
            setNotFound(true);
            setLoading(false);
            return;
        }
        setLoading(true);
        Promise.all(
            ids.map((id) =>
                fetch(`https://squirrel-peace-server.onrender.com/sales/${id}`)
                    .then((r) => r.json())
                    .catch(() => null)
            )
        )
            .then((list) => {
                const valid = list.filter((o) => o && o._id);
                if (valid.length === 0) setNotFound(true);
                setOrders(valid);
                setLoading(false);
            })
            .catch(() => {
                setNotFound(true);
                setLoading(false);
            });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goBack = () => navigate(backTo);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading summary...</p>
                </div>
            </div>
        );
    }

    if (notFound || orders.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Summary Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">
                        Report page theke customer e click kore ashun (page refresh korle data hariye jay).
                    </p>
                    <button
                        onClick={goBack}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                </div>
            </div>
        );
    }

    const first = orders[0];

    // ---------- Merge ----------
    const items = mergeItems(orders.map((o) => o.items), { withDiscount: true });
    const freeItems = mergeFreeItems(orders.map((o) => o.freeItems));
    const damageItems = mergeItems(orders.map((o) => o.damageItems));
    const returnItems = mergeItems(orders.map((o) => o.returnItems));

    const sum = (fn) => orders.reduce((s, o) => s + fn(o), 0);
    const subTotal = sum(getOrderSubTotal);
    const pwd = sum(getOrderPwd);
    const pwdPct = subTotal > 0 ? (pwd / subTotal) * 100 : 0;
    const overall = sum(getOrderOverall);
    const afterProduct = subTotal - pwd;
    const overallPct = afterProduct > 0 ? (overall / afterProduct) * 100 : 0;
    const adjustment = sum(getOrderAdjustment);
    const damageAdj = sum((o) => n(o.damageAdjustmentAmount));
    const returnAdj = sum((o) => n(o.returnAdjustmentAmount));
    const payable = sum((o) => n(o.payableAmount ?? o.grandTotal));
    const paid = sum((o) => n(o.paidAmount));
    const due = payable - paid;

    const invoiceList = orders.map((o) => ({ id: o._id, no: o.invoiceNo || o.orderNo }));
    const srList = uniq(orders.filter((o) => !o.directSales).map((o) => o.sr));
    const deliveryList = uniq(orders.filter((o) => !o.directSales).map((o) => o.deliveredBy));
    const routeList = uniq(orders.filter((o) => !o.directSales).map((o) => o.route));
    const directCount = orders.filter((o) => o.directSales === true).length;
    const notes = uniq(orders.map((o) => o.orderNote));

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-3 sm:p-4 md:p-6 print:bg-white print:p-0">
            <div className="max-w-full mx-auto space-y-6 print:space-y-0 print:max-w-full">

                {/* Top action bar */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <Printer className="w-4 h-4" /> Print Summary
                    </button>
                </div>

                {/* Invoice Card */}
                <div className="flex flex-col bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-white overflow-hidden print:shadow-none print:border-none print:rounded-none">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-10 print:bg-none print:text-black print:border-b-2 print:border-slate-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner print:border-slate-300 print:bg-slate-100">
                                    <Building2 className="w-7 h-7 text-white print:text-slate-700" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-white print:text-black">ইসরাইল এন্টারপ্রাইজ</h1>
                                    <p className="text-indigo-50/90 text-xs sm:text-sm flex items-center gap-1.5 mt-1 print:text-slate-600">
                                        <MapPin className="w-3.5 h-3.5 print:text-slate-500" /> শাহজী পাড়া, বড় বাজার, মেহেরপুর
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs sm:text-sm text-indigo-50/90 space-y-1.5 print:text-slate-600">
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Phone className="w-3.5 h-3.5 print:hidden" />
                                    <span>01997074920</span>
                                </p>
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Mail className="w-3.5 h-3.5 print:hidden" />
                                    <span>jakoberjak2017@gmail.com</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bill From / To */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-b border-slate-200/70 print:bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none">
                                <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-3 uppercase">Bill From</span>
                                <p className="font-bold text-slate-800 text-base">ইসরাইল এন্টারপ্রাইজ</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">01997074920</p>
                                <p className="text-xs sm:text-sm text-slate-600">শাহজী পাড়া, বড় বাজার, মেহেরপুর</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none flex flex-col justify-between">
                                <div className="flex justify-between items-start gap-3">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Bill To</span>
                                        <p className="font-bold text-slate-800 text-lg">{first.customer}</p>
                                        <p className="text-xs text-slate-500 mt-1">{first.phone}</p>
                                        <p className="text-xs text-slate-500">{first.shippingAddress || first.address || 'N/A'}</p>
                                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                                            {routeList.map((r) => (
                                                <span key={r} className="inline-block text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100">
                                                    Route: {r}
                                                </span>
                                            ))}
                                            {directCount > 0 && (
                                                <span className="inline-block px-1.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[10px] leading-none">
                                                    ⚡ Direct Sales{directCount > 1 ? ` (${directCount})` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Order Date: {first.orderDate}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Invoices: <span className="text-indigo-600">{orders.length}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Included invoice numbers */}
                        <div className="mt-4 bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Included Invoices</p>
                            <div className="flex flex-wrap gap-1.5">
                                {invoiceList.map((inv) => (
                                    <button
                                        key={inv.id}
                                        type="button"
                                        onClick={() => navigate(`/sales-details/${inv.id}`)}
                                        className="text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 hover:text-pink-600 hover:underline px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                                    >
                                        {inv.no}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* SR / Delivery Man Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-3 print:border-none print:p-0 print:shadow-none">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">SR</p>
                                    <p className="text-sm font-semibold text-slate-800">{srList.length ? srList.join(', ') : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-3 print:border-none print:p-0 print:shadow-none">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                    <Truck className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Delivery Man</p>
                                    <p className="text-sm font-semibold text-slate-800">{deliveryList.length ? deliveryList.join(', ') : 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="p-3 sm:p-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                    <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Quantity</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Total Quantity</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Discount</th>
                                    <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Item Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {items.map((row, index) => {
                                    const gross = row.unitAmt + row.subAmt + row.pcsAmt;
                                    const discPct = gross > 0 ? (row.discountAmt / gross) * 100 : 0;
                                    const othersQty = freeItems.find((f) => f.key === row.key)?.totalQty || 0;
                                    const cq = getCombinedQty(row, othersQty);
                                    return (
                                        <tr key={row.key} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                            <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{row.productName}</td>
                                            <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{row.company}</td>
                                            <td className="py-3 px-2 whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    <div className="font-semibold text-orange-600">
                                                        <span className="font-bold mr-1">Main:</span>
                                                        {row.unitQty} {row.unit} {row.parentMode && <>{row.subQty} {row.subUnit} </>}{row.pcsQty} Pcs
                                                        <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-700">({row.totalQty})</b>
                                                    </div>
                                                    <div className="font-semibold text-emerald-600">
                                                        <span className="font-bold mr-1">Free:</span>
                                                        {row.freeUnitQty} {row.unit} {row.parentMode && <>{row.freeSubQty} {row.subUnit} </>}{row.freePcsQty} Pcs
                                                        <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-700">({row.freeQty})</b>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 font-semibold text-indigo-600 whitespace-nowrap">
                                                {cq.u} {row.unit} {row.parentMode && <>{cq.s} {row.subUnit} </>}{cq.p} Pcs
                                                <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-700">({cq.total})</b>
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                <PriceCell row={row} />
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                ৳{money(row.pcsAmt)}
                                                {n(row.pcsQty) > 0 && (
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{money(row.pcsAmt / row.pcsQty)}/pcs)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium whitespace-nowrap">
                                                <span className="text-rose-600 font-bold">৳{money(row.discountAmt)}</span>{' '}
                                                <span className="text-slate-400">({discPct.toFixed(2)}%)</span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{money(row.itemTotal)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Others Free + Damage + Return */}
                    <div className="order-2 pt-8 print:pt-4">
                        {freeItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-1.5">
                                    <PackageX className="w-3.5 h-3.5 text-amber-600" /> Others Free Products
                                </h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-amber-100/70 text-amber-800 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                            <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                            <th className="py-2.5 px-2 rounded-r-xl whitespace-nowrap">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                        {freeItems.map((row, index) => (
                                            <tr key={row.key} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{row.productName}</td>
                                                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{row.company}</td>
                                                <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {row.unitQty} {row.unit} {row.parentMode && <>{row.subQty} {row.subUnit} </>}{row.pcsQty} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {row.totalQty})</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {damageItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Damage Products
                                </h4>
                                <AdjTable rows={damageItems} head="bg-red-100/70 text-red-800" divide="divide-red-100" hover="hover:bg-red-50/40" />
                            </div>
                        )}

                        {returnItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 className="text-xs font-bold text-violet-700 uppercase mb-3 flex items-center gap-1.5">
                                    <Undo2 className="w-3.5 h-3.5 text-violet-600" /> Return Products
                                </h4>
                                <AdjTable rows={returnItems} head="bg-violet-100/70 text-violet-800" divide="divide-violet-100" hover="hover:bg-violet-50/40" />
                            </div>
                        )}
                    </div>

                    {/* Totals + Note */}
                    <div className="order-1 p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-between items-start gap-6 print:bg-white">
                        <div className="w-full sm:w-1/2">
                            {notes.length > 0 && (
                                <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                    </h4>
                                    {notes.map((t, i) => (
                                        <p key={i} className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{t}</p>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-80 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 text-xs sm:text-sm">
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Subtotal:</span>
                                <span className="font-semibold text-slate-800">৳{money(subTotal)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Product Wise Discount:</span>
                                <span className="font-semibold text-rose-600">
                                    - ৳{money(pwd)}
                                    <span className="text-[10px] text-slate-400 ml-1">({pwdPct.toFixed(2)}%)</span>
                                </span>
                            </div>
                            {overall > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Overall Discount:</span>
                                    <span className="font-semibold text-rose-600">
                                        - ৳{money(overall)}
                                        <span className="text-[10px] text-slate-400 ml-1">({overallPct.toFixed(2)}%)</span>
                                    </span>
                                </div>
                            )}
                            {Math.abs(adjustment) > 0.004 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Adjustment:</span>
                                    <span className={`font-semibold ${adjustment < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                                        {adjustment < 0 ? '- ' : '+ '}৳{money(Math.abs(adjustment))}
                                    </span>
                                </div>
                            )}
                            {damageAdj > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Damage Products Amount:</span>
                                    <span className="font-semibold text-red-600">- ৳{money(damageAdj)}</span>
                                </div>
                            )}
                            {returnAdj > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Return Products Amount:</span>
                                    <span className="font-semibold text-violet-600">- ৳{money(returnAdj)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-slate-900 border-t border-slate-200">
                                <span>Payable Amount:</span>
                                <span className="text-indigo-600">৳{money(payable)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-500 text-sm">
                                <span>Paid Amount:</span>
                                <span>৳{money(paid)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-bold text-slate-800 border-t border-dashed border-slate-300">
                                <span>Due Amount:</span>
                                <span className="text-rose-600">৳{money(due)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Damage / Return er table (same layout)
function AdjTable({ rows, head, divide, hover }) {
    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className={`${head} text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600`}>
                    <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Quantity</th>
                    <th className="py-2.5 px-2 whitespace-nowrap">Free Quantity</th>
                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                    <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Item Total</th>
                </tr>
            </thead>
            <tbody className={`divide-y ${divide} text-xs sm:text-sm text-slate-700`}>
                {rows.map((row, index) => (
                    <tr key={row.key} className={`${hover} transition-colors`}>
                        <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                        <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{row.productName}</td>
                        <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{row.company}</td>
                        <td className="py-3 px-2 font-semibold text-orange-600 whitespace-nowrap">
                            {row.unitQty} {row.unit} {row.parentMode && <>{row.subQty} {row.subUnit} </>}{row.pcsQty} Pcs
                            <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {row.totalQty})</span>
                        </td>
                        <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                            {row.freeUnitQty} {row.unit} {row.parentMode && <>{row.freeSubQty} {row.subUnit} </>}{row.freePcsQty} Pcs
                            <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {row.freeQty})</span>
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                            <PriceCell row={row} />
                        </td>
                        <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                            ৳{money(row.pcsAmt)}
                            {n(row.pcsQty) > 0 && (
                                <span className="text-[10px] text-slate-400 ml-1">(৳{money(row.pcsAmt / row.pcsQty)}/pcs)</span>
                            )}
                        </td>
                        <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{money(row.itemTotal)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

export default SaleCustomerSumDetails;