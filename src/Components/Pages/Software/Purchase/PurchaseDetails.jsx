import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Printer,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    Building2,
    ArrowLeft,
    PackageX
} from 'lucide-react';

const PurchaseDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [showRemainingToggle, setShowRemaining] = useState(true); // default ON, refresh দিলে আবার ON

    // কোনো Return হয়েছে কিনা
    const hasReturn = (selectedInvoice?.returnHistory || []).some(
        (r) =>
            (Number(r.totalReturnPcs) || 0) > 0 ||
            (Number(r.totalReturnFreeQty) || 0) > 0 ||
            (Number(r.totalReturnFreeItemsQty) || 0) > 0
    );
    // Return না থাকলে Remaining feature কাজ করবে না
    const showRemaining = showRemainingToggle && hasReturn;

    // Return বাদ দিয়ে Remaining Quantity / Free Quantity / Subtotal হিসাব
    const getRemainingInfo = (item) => {
        let retQty = 0;
        let retFree = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
            const found = (ret.items || []).find((it) => it.productId === item.productId);
            if (found) {
                retQty += Number(found.returnTotalQty) || 0;
                retFree += Number(found.returnFreeTotalQty ?? found.returnFreeQty) || 0;
            }
        });

        const totalPcs = Number(item.totalPcs) || 0;
        const freeTotal = Number(item.freeTotalQty ?? item.freeQty) || 0;
        const remQty = Math.max(totalPcs - retQty, 0);
        const remFree = Math.max(freeTotal - retFree, 0);

        const unitQty = Number(item.unitQty) || 0;
        const pcsQty = Number(item.pcsQty) || 0;
        const perUnit = unitQty > 0 ? (totalPcs - pcsQty) / unitQty : 0;

        const freeUnitQty = Number(item.freeUnitQty) || 0;
        const freePcsQty = Number(item.freePcsQty) || 0;
        const freePerUnit = freeUnitQty > 0 ? (freeTotal - freePcsQty) / freeUnitQty : 0;

        const split = (total, per) => {
            if (per > 0) {
                const u = Math.floor(total / per);
                return [u, Math.round((total - u * per) * 100) / 100];
            }
            return [0, total];
        };

        const hasMainReturn = retQty > 0;
        const hasFreeReturn = retFree > 0;

        const [remUnit, remPcs] = hasMainReturn
            ? split(remQty, perUnit)
            : [unitQty, pcsQty];
        const [remFreeUnit, remFreePcs] = hasFreeReturn
            ? split(remFree, freePerUnit)
            : [freeUnitQty, freePcsQty];


        const subtotal = Number(item.subtotal) || 0;
        const remSubtotal = totalPcs > 0 ? (subtotal * remQty) / totalPcs : subtotal;

        return { remQty, remFree, remUnit, remPcs, remFreeUnit, remFreePcs, remSubtotal };
    };

    // Others Free Product: Return বাদ দিয়ে Remaining হিসাব
    const getFreeItemRemaining = (item) => {
        let retTotal = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
            const found = (ret.freeItems || []).find((it) => it.productId === item.productId);
            if (found) retTotal += Number(found.returnTotalQty) || 0;
        });

        const total = Number(item.totalQty) || 0;
        const unitQty = Number(item.unitQty) || 0;
        const pcsQty = Number(item.pcsQty) || 0;
        const perUnit =
            Number(item.pcsPerUnit) > 0
                ? Number(item.pcsPerUnit)
                : unitQty > 0
                    ? (total - pcsQty) / unitQty
                    : 0;

        const remTotal = Math.max(total - retTotal, 0);
        if (retTotal <= 0) {
            return { remTotal, remUnit: unitQty, remPcs: pcsQty };
        }
        if (perUnit > 0) {
            const u = Math.floor(remTotal / perUnit);
            return { remTotal, remUnit: u, remPcs: Math.round((remTotal - u * perUnit) * 100) / 100 };
        }
        return { remTotal, remUnit: 0, remPcs: remTotal };
    };

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedInvoice(data);
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching purchase data:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id]);

    // Return বাদ দিয়ে Grand Total / Discount / Payable / Due হিসাব
    const getTotals = () => {
        const inv = selectedInvoice;
        const paid = Number(inv.paidAmount || 0);

        if (!showRemaining) {
            const payable = Number(inv.payableAmount) || 0;
            return { payable, due: payable - paid };
        }

        let grand = 0;
        let pwd = 0;
        (inv.items || []).forEach((item) => {
            const info = getRemainingInfo(item);
            const total = Number(item.totalPcs) || 0;
            const buy = Number(item.buyPrice) || 0;
            const gross = buy * total;
            const fullDisc = Number(
                item.discountAmount ??
                (item.discountType === 'percent'
                    ? (gross * Number(item.discount)) / 100
                    : Number(item.discount))
            ) || 0;
            grand += buy * info.remQty;
            pwd += total > 0 ? (fullDisc * info.remQty) / total : 0;
        });

        const afterProduct = grand - pwd;
        const overallAmt =
            inv.overallDiscountType === 'percent'
                ? (afterProduct * (Number(inv.overallDiscount) || 0)) / 100
                : Number(inv.overallDiscountValue ?? inv.overallDiscount) || 0;
        const adjAmt = Number(inv.adjustment?.amount) || 0;
        let payable = afterProduct - overallAmt;
        payable = inv.adjustment?.type === '-' ? payable - adjAmt : payable + adjAmt;
        if (payable < 0) payable = 0;

        return {
            grand,
            pwd,
            pwdPct: grand > 0 ? (pwd / grand) * 100 : 0,
            afterProduct,
            overallAmt,
            payable,
            due: payable - paid,
        };
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (notFound || !selectedInvoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This purchase record couldn't be found. It may have been deleted.</p>
                    <button
                        onClick={() => navigate('/purchase')}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Purchases
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 print:bg-white print:p-0">
            <div className="max-w-7xl mx-auto space-y-6 print:space-y-0 print:max-w-full">

                {/* Top action bar */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button
                        onClick={() => navigate('/purchase')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Purchases
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <Printer className="w-4 h-4" /> Print Invoice
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
                                <p className="font-bold text-slate-800 text-base">{selectedInvoice.company}</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{selectedInvoice.phone}</p>
                                <p className="text-xs sm:text-sm text-slate-600">{selectedInvoice.address}</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Bill To</span>
                                        <p className="font-bold text-slate-800 text-lg">Demo Enterprise</p>
                                        <p className="text-xs text-slate-500 mt-1">01612002913</p>
                                        <p className="text-xs text-slate-500">{selectedInvoice.shippingAddress || 'N/A'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Purchase Date: {selectedInvoice.purchaseDate}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Inv: <span className="text-indigo-600">{selectedInvoice.invoiceNo}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remaining After Return Toggle */}
                    <div className={`px-6 sm:px-8 pt-6 sm:pt-8 items-center gap-3 print:hidden ${hasReturn ? 'flex' : 'hidden'}`}>
                        <span className="text-sm font-bold text-slate-700">Remaining After Return</span>
                        <button
                            type="button"
                            onClick={() => setShowRemaining((prev) => !prev)}
                            title={showRemaining ? 'ON' : 'OFF'}
                            className="flex items-center gap-1.5 cursor-pointer focus:outline-none"
                        >
                            <span className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 ${showRemaining ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${showRemaining ? 'translate-x-5' : ''}`} />
                            </span>
                            <span className={`text-xs font-bold ${showRemaining ? 'text-emerald-600' : 'text-gray-400'}`}>
                                {showRemaining ? 'ON' : 'OFF'}
                            </span>
                        </button>
                    </div>

                    {/* Products Table */}
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                    <th className="py-3 px-3.5 rounded-l-xl">SL</th>
                                    <th className="py-3 px-3.5">Product Name</th>
                                    <th className="py-3 px-3.5">Company</th>
                                    <th className="py-3 px-3.5">Quantity</th>
                                    <th className="py-3 px-3.5">Free Quantity</th>
                                    <th className="py-3 px-3.5 text-right">Total Cost Price</th>
                                    <th className="py-3 px-3.5 text-right">Total Sell Price</th>
                                    <th className="py-3 px-3.5 text-right">Discount</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                        <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                        <td className="py-4 px-3.5 text-slate-600">{selectedInvoice.company}</td>
                                        <td className="py-4 px-3.5 font-semibold text-orange-600">
                                            {showRemaining ? (
                                                <>
                                                    {getRemainingInfo(item).remUnit} {item.unit} {getRemainingInfo(item).remPcs} Pcs
                                                    <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {getRemainingInfo(item).remQty})</span>
                                                </>
                                            ) : (
                                                <>
                                                    {item.unitQty} {item.unit} {item.pcsQty} Pcs
                                                    <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {item.totalPcs})</span>
                                                </>
                                            )}
                                        </td>
                                        <td className="py-4 px-3.5 font-semibold text-emerald-600">
                                            {showRemaining ? (
                                                <>
                                                    {getRemainingInfo(item).remFreeUnit} {item.unit} {getRemainingInfo(item).remFreePcs} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {getRemainingInfo(item).remFree})</span>
                                                </>
                                            ) : (
                                                <>
                                                    {item.freeUnitQty || 0} {item.unit} {item.freePcsQty || 0} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeTotalQty ?? item.freeQty ?? 0})</span>
                                                </>
                                            )}
                                        </td>
                                        <td className="py-4 px-3.5 text-center font-medium text-slate-600">
                                            ৳{(Number(item.buyPrice) * (showRemaining ? getRemainingInfo(item).remQty : Number(item.totalPcs))).toFixed(2)}
                                            <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.buyPrice).toFixed(2)})</span>
                                        </td>
                                        <td className="py-4 px-3.5 text-center font-medium text-slate-600">
                                            ৳{(Number(item.sellPrice) * (showRemaining ? getRemainingInfo(item).remQty : Number(item.totalPcs))).toFixed(2)}
                                            <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.sellPrice).toFixed(2)})</span>
                                        </td>
                                        <td className="py-4 px-3.5 text-right font-medium">
                                            {(() => {
                                                const rowGrossTotal = Number(item.buyPrice) * Number(item.totalPcs);
                                                const fullDiscountAmt = Number(
                                                    item.discountAmount ??
                                                    (item.discountType === 'percent'
                                                        ? (rowGrossTotal * Number(item.discount)) / 100
                                                        : Number(item.discount))
                                                );
                                                const discountAmt = showRemaining && Number(item.totalPcs) > 0
                                                    ? (fullDiscountAmt * getRemainingInfo(item).remQty) / Number(item.totalPcs)
                                                    : fullDiscountAmt;
                                                const discountPct =
                                                    item.discountType === 'percent'
                                                        ? Number(item.discount) || 0
                                                        : (rowGrossTotal > 0 ? (discountAmt / rowGrossTotal) * 100 : 0);
                                                return (
                                                    <>
                                                        <span className={item.discountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                            ৳{discountAmt.toFixed(2)}
                                                        </span>
                                                        {' '}
                                                        <span className={item.discountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                            ({discountPct.toFixed(2)}%)
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-4 px-3.5 text-right font-bold text-slate-900">
                                            ৳{(showRemaining ? getRemainingInfo(item).remSubtotal : Number(item.subtotal)).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Others Free Products */}
                    {selectedInvoice.freeItems && selectedInvoice.freeItems.length > 0 && (
                        <div className="order-2 pt-8 print:pt-4 px-6 sm:px-8 pb-6 sm:pb-8 overflow-x-auto">
                            <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-1.5">
                                <PackageX className="w-3.5 h-3.5 text-amber-600" /> Others Free Products
                            </h4>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-amber-100/70 text-amber-800 text-[11px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                        <th className="py-3 px-3.5 rounded-l-xl whitespace-nowrap">SL</th>
                                        <th className="py-3 px-3.5 whitespace-nowrap">Product</th>
                                        <th className="py-3 px-3.5 whitespace-nowrap">Company</th>
                                        <th className="py-3 px-3.5 whitespace-nowrap">Quantity</th>
                                        <th className="py-3 px-3.5 text-right whitespace-nowrap">Sell Price (Bundle)</th>
                                        <th className="py-3 px-3.5 text-right whitespace-nowrap">Sell Price (PCS)</th>
                                        <th className="py-3 px-3.5 text-right rounded-r-xl whitespace-nowrap">Subtotal (Sell)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                    {selectedInvoice.freeItems.map((item, index) => {
                                        const freeRem = getFreeItemRemaining(item);
                                        const dispUnit = showRemaining ? freeRem.remUnit : (Number(item.unitQty) || 0);
                                        const dispPcs = showRemaining ? freeRem.remPcs : (Number(item.pcsQty) || 0);
                                        const dispTotal = showRemaining ? freeRem.remTotal : (Number(item.totalQty) || 0);
                                        const bundleTotal = dispUnit * (Number(item.sellPriceBundle) || 0);
                                        const pcsTotal = dispPcs * (Number(item.sellPricePcs) || 0);
                                        const rowSubtotal = showRemaining
                                            ? bundleTotal + pcsTotal
                                            : item.subtotal !== undefined && item.subtotal !== null
                                                ? Number(item.subtotal)
                                                : bundleTotal + pcsTotal;
                                        return (
                                            <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="py-4 px-3.5 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                <td className="py-4 px-3.5 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                                <td className="py-4 px-3.5 text-slate-600 whitespace-nowrap">{item.company}</td>
                                                <td className="py-4 px-3.5 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {dispUnit} {item.unit} {dispPcs} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {dispTotal})</span>
                                                </td>
                                                <td className="py-4 px-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{bundleTotal.toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPriceBundle || 0).toFixed(2)}/{item.unit || 'unit'})
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{pcsTotal.toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPricePcs || 0).toFixed(2)}/pcs)
                                                    </span>
                                                </td>
                                                <td className="py-4 px-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                                                    ৳{rowSubtotal.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Totals + Note */}
                    <div className="order-1 p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-between items-start gap-6 print:bg-white">
                        <div className="w-full sm:w-1/2">
                            {selectedInvoice.orderNote && (
                                <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{selectedInvoice.orderNote}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-80 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 text-xs sm:text-sm">
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Grand Total:</span>
                                <span className="font-semibold text-slate-800">৳{(showRemaining ? getTotals().grand : Number(selectedInvoice.grandTotal)).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Product Wise Discount:</span>
                                <span className="font-semibold text-rose-600">
                                    - ৳{(showRemaining ? getTotals().pwd : Number(selectedInvoice.productWiseDiscount)).toFixed(2)}
                                    <span className="text-[10px] text-slate-400 ml-1">
                                        ({(
                                            (showRemaining ? getTotals().pwdPct : selectedInvoice.productWiseDiscountPercent) ??
                                            (Number(selectedInvoice.grandTotal) > 0
                                                ? (Number(selectedInvoice.productWiseDiscount) / Number(selectedInvoice.grandTotal)) * 100
                                                : 0)
                                        ).toFixed(2)}%)
                                    </span>
                                </span>
                            </div>
                            {Number(selectedInvoice.overallDiscount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Overall Discount:</span>
                                    <span className="font-semibold">
                                        {(() => {
                                            const afterProductDiscount = showRemaining ? getTotals().afterProduct : Number(selectedInvoice.grandTotal) - Number(selectedInvoice.productWiseDiscount);
                                            const overallAmt = showRemaining ? getTotals().overallAmt : Number(
                                                selectedInvoice.overallDiscountValue ??
                                                (selectedInvoice.overallDiscountType === 'percent'
                                                    ? (afterProductDiscount * Number(selectedInvoice.overallDiscount)) / 100
                                                    : Number(selectedInvoice.overallDiscount))
                                            );
                                            const overallPct =
                                                selectedInvoice.overallDiscountType === 'percent'
                                                    ? Number(selectedInvoice.overallDiscount) || 0
                                                    : (afterProductDiscount > 0 ? (overallAmt / afterProductDiscount) * 100 : 0);
                                            return (
                                                <>
                                                    <span className={selectedInvoice.overallDiscountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                        - ৳{overallAmt.toFixed(2)}
                                                    </span>
                                                    {' '}
                                                    <span className={selectedInvoice.overallDiscountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                        ({overallPct.toFixed(2)}%)
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </span>
                                </div>
                            )}
                            {selectedInvoice.adjustment && Number(selectedInvoice.adjustment.amount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span className="truncate pr-2">
                                        {selectedInvoice.adjustment.text || 'Adjustment'} ({selectedInvoice.adjustment.type}):
                                    </span>
                                    <span className={`font-semibold shrink-0 ${selectedInvoice.adjustment.type === '-' ? 'text-rose-600' : 'text-slate-800'}`}>
                                        {selectedInvoice.adjustment.type === '-' ? '- ' : '+ '}৳{Number(selectedInvoice.adjustment.amount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-slate-900 border-t border-slate-200">
                                <span>Payable Amount:</span>
                                <span className="text-indigo-600">৳{Number(selectedInvoice.payableAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-500 text-sm">
                                <span>Paid Amount:</span>
                                <span>৳{Number(selectedInvoice.paidAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-bold text-slate-800 border-t border-dashed border-slate-300">
                                <span>Due Amount:</span>
                                <span className="text-rose-600">
                                    ৳{(Number(selectedInvoice.payableAmount) - Number(selectedInvoice.paidAmount || 0)).toFixed(2)}
                                </span>
                            </div>

                            {selectedInvoice.paymentNote && (
                                <div className="pt-2 mt-1 border-t border-slate-200">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Note:</h4>
                                    <p className="text-xs text-slate-600 italic leading-relaxed">{selectedInvoice.paymentNote}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseDetails;