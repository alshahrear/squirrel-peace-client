import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const SalesReturnView = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const returnId = searchParams.get('returnId');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [returnEntry, setReturnEntry] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [showDetails, setShowDetails] = useState(false); // Unit Qty theke Subtotal porjonto collapse thakbe

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/sales/${id}`)
            .then((res) => res.json())
            .then((data) => {
                const foundReturn = (data?.returnHistory || []).find(
                    (ret) => ret.returnId === returnId
                );
                if (data && data._id && foundReturn) {
                    setSelectedOrder(data);
                    setReturnEntry(foundReturn);
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching return data:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id, returnId]);

    // Nirdishto return entry theke item-wise return info ber kora
    const getReturnItemInfo = (productId) => {
        const found = returnEntry?.items?.find((it) => it.productId === productId);
        return {
            returnUnitQty: found ? Number(found.returnUnitQty) || 0 : 0,
            returnPcsQty: found ? Number(found.returnPcsQty) || 0 : 0,
            returnTotalQty: found ? Number(found.returnTotalQty) || 0 : 0,
            returnFreeUnitQty: found ? Number(found.returnFreeUnitQty) || 0 : 0,
            returnFreePcsQty: found ? Number(found.returnFreePcsQty) || 0 : 0,
            returnFreeTotalQty: found ? Number(found.returnFreeTotalQty) || 0 : 0,
            returnAmount: found ? Number(found.returnAmount) || 0 : 0,
        };
    };

    // Nirdishto return entry theke Others Free Product er return info ber kora
    const getReturnFreeItemInfo = (productId) => {
        const found = returnEntry?.freeItems?.find((it) => it.productId === productId);
        return {
            returnUnitQty: found ? Number(found.returnUnitQty) || 0 : 0,
            returnPcsQty: found ? Number(found.returnPcsQty) || 0 : 0,
            returnTotalQty: found ? Number(found.returnTotalQty) || 0 : 0,
        };
    };

    // Original row er gross total (Unit ongsho + PCS ongsho) -> Sales e 2 ta price thake (Unit & PCS)
    const getRowGross = (item) =>
        (Number(item.unitQty) || 0) * (Number(item.sellPriceUnit) || 0) +
        (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading return details...</p>
                </div>
            </div>
        );
    }

    if (notFound || !selectedOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Return Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This return record couldn't be found. It may have been deleted.</p>
                    <button
                        onClick={() => navigate('/sales-return')}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Returns
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
                        onClick={() => navigate('/sales-return')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Returns
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>

                {/* Invoice Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-white overflow-hidden print:shadow-none print:border-none print:rounded-none">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-10 print:bg-none print:text-black print:border-b-2 print:border-slate-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner print:border-slate-300 print:bg-slate-100">
                                    <Building2 className="w-7 h-7 text-white print:text-slate-700" />
                                </div>
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-white bg-white/20 px-2.5 py-1 rounded-md mb-1.5 uppercase print:bg-slate-100 print:text-slate-700">
                                        Sales Return
                                    </span>
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
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Bill To</span>
                                        <p className="font-bold text-slate-800 text-lg">{selectedOrder.customer}</p>
                                        <p className="text-xs text-slate-500 mt-1">{selectedOrder.phone}</p>
                                        <p className="text-xs text-slate-500">{selectedOrder.shippingAddress || selectedOrder.address || 'N/A'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Order Date: {selectedOrder.orderDate}
                                        </p>
                                        {returnEntry?.returnDate && (
                                            <p className="text-xs text-orange-500 flex items-center justify-end gap-1 mt-1">
                                                <Calendar className="w-3.5 h-3.5 text-orange-500" /> Return Date: {returnEntry.returnDate}
                                            </p>
                                        )}
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Order No: <span className="text-indigo-600">{selectedOrder.orderNo}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="p-6 sm:p-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                    <th className="py-3 px-3.5 rounded-l-xl">SL</th>
                                    <th className="py-3 px-3.5">Product Name</th>
                                    <th className="py-3 px-3.5">Company</th>
                                    {showDetails ? (
                                        <>
                                            <th className="py-3 px-3.5">
                                                <button type="button" onClick={() => setShowDetails(false)} className="flex items-center gap-1 hover:text-indigo-100 transition cursor-pointer print:hidden">
                                                    <ChevronLeft className="w-3.5 h-3.5" /> Unit Qty
                                                </button>
                                                <span className="hidden print:inline">Unit Qty</span>
                                            </th>
                                            <th className="py-3 px-3.5">Pcs</th>
                                            <th className="py-3 px-3.5">Total Pcs</th>
                                            <th className="py-3 px-3.5">Free Qty</th>
                                            <th className="py-3 px-3.5 text-right">Total Price (Unit)</th>
                                            <th className="py-3 px-3.5 text-right">Total Price (Pcs)</th>
                                            <th className="py-3 px-3.5 text-right">Discount</th>
                                            <th className="py-3 px-3.5 text-right">Subtotal</th>
                                        </>
                                    ) : (
                                        <th className="py-3 px-3.5 print:hidden">
                                            <button type="button" onClick={() => setShowDetails(true)} className="flex items-center gap-1 hover:text-indigo-100 transition cursor-pointer">
                                                Details <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </th>
                                    )}
                                    <th className="py-3 px-3.5 text-right">Sell Price (Unit)</th>
                                    <th className="py-3 px-3.5 text-right">Sell Price (Pcs)</th>
                                    <th className="py-3 px-3.5 text-center">Return Qty</th>
                                    <th className="py-3 px-3.5 text-center">Return Free Qty</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Return Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedOrder.items.map((item, index) => {
                                    const { returnUnitQty, returnPcsQty, returnTotalQty, returnFreeUnitQty, returnFreePcsQty, returnFreeTotalQty, returnAmount } = getReturnItemInfo(item.productId);
                                    return (
                                        <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                            <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                            <td className="py-4 px-3.5 text-slate-600">{item.company}</td>
                                            {showDetails ? (
                                                <>
                                                    <td className="py-4 px-3.5">{item.unitQty} {item.unit}</td>
                                                    <td className="py-4 px-3.5">{item.pcsQty}</td>
                                                    <td className="py-4 px-3.5 font-semibold text-indigo-600">{item.totalPcs}</td>
                                                    <td className="py-4 px-3.5 font-medium text-emerald-600">
                                                        {item.freeQty > 0 ? `${item.freeQty} ` : '0'}
                                                    </td>
                                                    <td className="py-4 px-3.5 text-center font-medium text-slate-600">
                                                        ৳{(Number(item.unitQty) * Number(item.sellPriceUnit)).toFixed(2)}
                                                        <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.sellPriceUnit).toFixed(2)})</span>
                                                    </td>
                                                    <td className="py-4 px-3.5 text-center font-medium text-slate-600">
                                                        ৳{(Number(item.pcsQty) * Number(item.sellPricePcs)).toFixed(2)}
                                                        <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.sellPricePcs).toFixed(2)})</span>
                                                    </td>
                                                    <td className="py-4 px-3.5 text-right font-medium">
                                                        {(() => {
                                                            const rowGrossTotal = getRowGross(item);
                                                            const discountAmt = Number(
                                                                item.discountAmount ??
                                                                (item.discountType === 'percent'
                                                                    ? (rowGrossTotal * Number(item.discount)) / 100
                                                                    : Number(item.discount))
                                                            );
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
                                                    <td className="py-4 px-3.5 text-right font-bold text-slate-900">৳{Number(item.subtotal).toFixed(2)}</td>
                                                </>
                                            ) : (
                                                <td className="py-4 px-3.5 text-center text-slate-300 print:hidden">•••</td>
                                            )}
                                            <td className="py-4 px-3.5 text-right font-medium text-slate-600">৳{Number(item.sellPriceUnit).toFixed(2)}</td>
                                            <td className="py-4 px-3.5 text-right font-medium text-slate-600">৳{Number(item.sellPricePcs).toFixed(2)}</td>
                                            <td className="py-4 px-3.5 text-center font-semibold text-orange-600">
                                                {returnUnitQty} {item.unit} {returnPcsQty} Pcs
                                                <span className="text-[10px] text-indigo-600 ml-1 font-bold">(Total: {returnTotalQty})</span>
                                            </td>
                                            <td className="py-4 px-3.5 text-center font-semibold text-emerald-600">
                                                {returnFreeUnitQty} {item.unit} {returnFreePcsQty} Pcs
                                                <span className="text-[10px] text-emerald-700 ml-1 font-bold">(Total: {returnFreeTotalQty})</span>
                                            </td>
                                            <td className="py-4 px-3.5 text-right font-bold text-orange-600">৳{Number(returnAmount).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Others Free Product Return Table */}
                    {selectedOrder.freeItems && selectedOrder.freeItems.length > 0 && (
                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 overflow-x-auto">
                            <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-1.5">
                                <PackageX className="w-3.5 h-3.5 text-amber-600" /> Others Free Product Return
                            </h4>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-amber-100/70 text-amber-800 text-[11px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                        <th className="py-3 px-3.5 rounded-l-xl">SL</th>
                                        <th className="py-3 px-3.5">Product Name</th>
                                        <th className="py-3 px-3.5">Company</th>
                                        <th className="py-3 px-3.5 text-center">RT Unit Qty</th>
                                        <th className="py-3 px-3.5 text-center">RT Pcs Qty</th>
                                        <th className="py-3 px-3.5 text-center rounded-r-xl">Total RT Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                    {selectedOrder.freeItems.map((item, index) => {
                                        const { returnUnitQty, returnPcsQty, returnTotalQty } = getReturnFreeItemInfo(item.productId);
                                        return (
                                            <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                                <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                                <td className="py-4 px-3.5 text-slate-600">{item.company}</td>
                                                <td className="py-4 px-3.5 text-center">
                                                    <div className="font-semibold text-orange-600">{returnTotalQty > 0 ? returnUnitQty : 'N/A'}</div>
                                                    {returnTotalQty > 0 && <div className="text-[10px] text-slate-400">{item.unit}</div>}
                                                </td>
                                                <td className="py-4 px-3.5 text-center font-semibold text-orange-600">
                                                    {returnTotalQty > 0 ? returnPcsQty : 'N/A'}
                                                </td>
                                                <td className="py-4 px-3.5 text-center font-bold text-orange-600">
                                                    {returnTotalQty > 0 ? returnTotalQty : 'N/A'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Totals + Note */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-between items-start gap-6 print:bg-white">
                        <div className="w-full sm:w-1/2">
                            {selectedOrder.orderNote && (
                                <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{selectedOrder.orderNote}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-80 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 text-xs sm:text-sm">
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Grand Total:</span>
                                <span className="font-semibold text-slate-800">৳{Number(selectedOrder.grandTotal).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Product Wise Discount:</span>
                                <span className="font-semibold text-rose-600">- ৳{Number(selectedOrder.productWiseDiscount).toFixed(2)}</span>
                            </div>
                            {Number(selectedOrder.overallDiscount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Overall Discount:</span>
                                    <span className="font-semibold">
                                        {(() => {
                                            const afterProductDiscount = Number(selectedOrder.grandTotal) - Number(selectedOrder.productWiseDiscount);
                                            const overallAmt = Number(
                                                selectedOrder.overallDiscountValue ??
                                                (selectedOrder.overallDiscountType === 'percent'
                                                    ? (afterProductDiscount * Number(selectedOrder.overallDiscount)) / 100
                                                    : Number(selectedOrder.overallDiscount))
                                            );
                                            const overallPct =
                                                selectedOrder.overallDiscountType === 'percent'
                                                    ? Number(selectedOrder.overallDiscount) || 0
                                                    : (afterProductDiscount > 0 ? (overallAmt / afterProductDiscount) * 100 : 0);
                                            return (
                                                <>
                                                    <span className={selectedOrder.overallDiscountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                        - ৳{overallAmt.toFixed(2)}
                                                    </span>
                                                    {' '}
                                                    <span className={selectedOrder.overallDiscountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                        ({overallPct.toFixed(2)}%)
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </span>
                                </div>
                            )}
                            {selectedOrder.adjustment && Number(selectedOrder.adjustment.amount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span className="truncate pr-2">
                                        {selectedOrder.adjustment.text || 'Adjustment'} ({selectedOrder.adjustment.type}):
                                    </span>
                                    <span className={`font-semibold shrink-0 ${selectedOrder.adjustment.type === '-' ? 'text-rose-600' : 'text-slate-800'}`}>
                                        {selectedOrder.adjustment.type === '-' ? '- ' : '+ '}৳{Number(selectedOrder.adjustment.amount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-slate-900 border-t border-slate-200">
                                <span>Payable Amount:</span>
                                <span className="text-indigo-600">৳{Number(selectedOrder.payableAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-500 text-sm">
                                <span>Paid Amount:</span>
                                <span>৳{Number(selectedOrder.paidAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-bold text-slate-800 border-t border-dashed border-slate-300">
                                <span>Due Amount:</span>
                                <span className="text-rose-600">
                                    ৳{(Number(selectedOrder.payableAmount) - Number(selectedOrder.paidAmount || 0)).toFixed(2)}
                                </span>
                            </div>

                            {selectedOrder.paymentNote && (
                                <div className="pt-2 mt-1 border-t border-slate-200">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Note:</h4>
                                    <p className="text-xs text-slate-600 italic leading-relaxed">{selectedOrder.paymentNote}</p>
                                </div>
                            )}

                            <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-orange-700 border-t border-orange-200 bg-orange-50 -mx-5 px-5 rounded-t-xl mt-2">
                                <span>Total Return Qty:</span>
                                <span>{returnEntry?.totalReturnPcs || 0}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm font-bold text-orange-700 bg-orange-50 -mx-5 px-5">
                                <span>Total Return Free Qty:</span>
                                <span>{returnEntry?.totalReturnFreeQty || 0}</span>
                            </div>
                            <div className="flex justify-between py-1 text-sm font-bold text-orange-700 bg-orange-50 -mx-5 px-5 pb-3 rounded-b-xl">
                                <span>Total Return Amount:</span>
                                <span>৳{Number(returnEntry?.totalReturnAmount || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesReturnView;