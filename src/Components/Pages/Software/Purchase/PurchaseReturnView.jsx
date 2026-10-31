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
    PackageX
} from 'lucide-react';


const PurchaseReturnView = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const returnId = searchParams.get('returnId');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [returnEntry, setReturnEntry] = useState(null);
    const [notFound, setNotFound] = useState(false);


    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`https://squirrel-peace-server.onrender.com/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                const foundReturn = (data?.returnHistory || []).find(
                    (ret) => ret.returnId === returnId
                );
                if (data && data._id && foundReturn) {
                    setSelectedInvoice(data);
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
            returnSubQty: found ? Number(found.returnSubQty) || 0 : 0,
            returnFreeSubQty: found ? Number(found.returnFreeSubQty) || 0 : 0,
            returnTotalQty: found ? Number(found.returnTotalQty) || 0 : 0,
            returnFreeUnitQty: found ? Number(found.returnFreeUnitQty) || 0 : 0,
            returnFreePcsQty: found ? Number(found.returnFreePcsQty) || 0 : 0,
            returnFreeTotalQty: found ? Number(found.returnFreeTotalQty) || 0 : 0,
            returnAmount: found ? Number(found.returnAmount) || 0 : 0,
        };
    };

    // Others Free Product er return info
    const getReturnFreeItemInfo = (productId) => {
        const found = returnEntry?.freeItems?.find((it) => it.productId === productId);
        return {
            returnUnitQty: found ? Number(found.returnUnitQty) || 0 : 0,
            returnPcsQty: found ? Number(found.returnPcsQty) || 0 : 0,
            returnSubQty: found ? Number(found.returnSubQty) || 0 : 0,
            returnTotalQty: found ? Number(found.returnTotalQty) || 0 : 0,
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
                    <p className="text-gray-500 font-medium text-sm">Loading return details...</p>
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
                    <h2 className="text-xl font-bold text-gray-800">Return Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This return record couldn't be found. It may have been deleted.</p>
                    <button
                        onClick={() => navigate('/purchase-return')}
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
                        onClick={() => navigate('/purchase-return')}
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
                                        Purchase Return
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
                                        {returnEntry?.returnDate && (
                                            <p className="text-xs text-orange-500 flex items-center justify-end gap-1 mt-1">
                                                <Calendar className="w-3.5 h-3.5 text-orange-500" /> Return Date: {returnEntry.returnDate}
                                            </p>
                                        )}
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Inv: <span className="text-indigo-600">{selectedInvoice.invoiceNo}</span>
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
                                    <th className="py-3 px-3.5 text-right">Purchase Price</th>
                                    <th className="py-3 px-3.5 text-center">Return Qty</th>
                                    <th className="py-3 px-3.5 text-center">Return Free Qty</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Return Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.items.map((item, index) => {
                                    const { returnUnitQty, returnSubQty, returnPcsQty, returnTotalQty, returnFreeUnitQty, returnFreeSubQty, returnFreePcsQty, returnFreeTotalQty, returnAmount } = getReturnItemInfo(item.productId);
                                    return (
                                        <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                            <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                            <td className="py-4 px-3.5 text-slate-600">{selectedInvoice.company}</td>
                                            <td className="py-4 px-3.5 text-right font-medium text-slate-600">৳{Number(item.buyPrice).toFixed(2)}</td>
                                            <td className="py-4 px-3.5 text-center font-semibold text-orange-600">
                                                {returnUnitQty} {item.unit} {item.parentMode && <>{returnSubQty} {item.subUnit} </>}{returnPcsQty} Pcs
                                                <span className="text-[10px] text-indigo-600 ml-1 font-bold">(Total: {returnTotalQty})</span>
                                            </td>
                                            <td className="py-4 px-3.5 text-center font-semibold text-emerald-600">
                                                {returnFreeUnitQty} {item.unit} {item.parentMode && <>{returnFreeSubQty} {item.subUnit} </>}{returnFreePcsQty} Pcs
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
                    {selectedInvoice.freeItems && selectedInvoice.freeItems.length > 0 && (
                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 overflow-x-auto">
                            <h4 className="text-xs font-bold text-amber-700 uppercase mb-3">Others Free Product Return</h4>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-amber-100/70 text-amber-800 text-[11px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                        <th className="py-3 px-3.5 rounded-l-xl">SL</th>
                                        <th className="py-3 px-3.5">Product Name</th>
                                        <th className="py-3 px-3.5">Company</th>
                                        <th className="py-3 px-3.5">Quantity</th>
                                        <th className="py-3 px-3.5 text-center rounded-r-xl">Return Qty</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                    {selectedInvoice.freeItems.map((item, index) => {
                                        const { returnUnitQty, returnSubQty, returnPcsQty, returnTotalQty } = getReturnFreeItemInfo(item.productId);
                                        return (
                                            <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                                <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                                <td className="py-4 px-3.5 text-slate-600">{item.company || selectedInvoice.company}</td>
                                                <td className="py-4 px-3.5 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {item.unitQty || 0} {item.unit || 'Unit'} {item.parentMode && <>{item.subQty || 0} {item.subUnit} </>}{item.pcsQty || 0} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.totalQty || 0})</span>
                                                </td>
                                                <td className="py-4 px-3.5 text-center font-semibold text-amber-600">
                                                    {returnUnitQty} {item.unit || 'Unit'} {item.parentMode && <>{returnSubQty} {item.subUnit} </>}{returnPcsQty} Pcs
                                                    <span className="text-[10px] text-amber-700 ml-1 font-bold">(Total: {returnTotalQty})</span>
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
                            {(() => {
                                const totalRet = Number(returnEntry?.totalReturnAmount) || 0;
                                const pay = returnEntry?.payment;
                                const paid = pay ? Number(pay.amount) || 0 : 0;
                                const diff = Math.round((totalRet - paid) * 100) / 100;
                                const pa = pay?.account || {};
                                const accText =
                                    pay?.method === 'Bank'
                                        ? `${pa.bankName} - ${pa.accountNumber} (${pa.accountBranch})`
                                        : pay?.method === 'Mobile Banking'
                                            ? `${pa.accountName} - ${pa.accountNumber}`
                                            : pay?.method
                                                ? 'Cash'
                                                : '';
                                return (
                                    <div className="bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm mb-4 space-y-2 text-xs sm:text-sm">
                                        <div className="flex justify-between text-slate-600">
                                            <span>Total Return Amount:</span>
                                            <span className="font-bold text-orange-600">৳{totalRet.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-slate-600">
                                            <span>Return Payment Received:</span>
                                            {pay ? (
                                                <span className="font-bold text-emerald-600">৳{paid.toFixed(2)}</span>
                                            ) : (
                                                <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold text-[10px]">
                                                    Not Received
                                                </span>
                                            )}
                                        </div>
                                        {pay && (
                                            <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-300 pt-2">
                                                <span>{diff > 0 ? 'Get Amount:' : diff < 0 ? 'Pay Amount:' : 'Status:'}</span>
                                                <span className={`font-bold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                    {diff === 0 ? 'Fully Received' : `৳${Math.abs(diff).toFixed(2)}`}
                                                </span>
                                            </div>
                                        )}
                                        {pay && (
                                            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                                                <div>Method: <b className="text-slate-700">{pay.method}</b>{accText && pay.method !== 'Cash' ? ` | ${accText}` : ''}</div>
                                                {pay.note && <div className="italic mt-1">Note: {pay.note}</div>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            {returnEntry?.returnNote && (
                                <div className="bg-orange-50/60 border border-orange-200/70 p-4 rounded-2xl shadow-sm mb-4">
                                    <h4 className="text-xs font-bold text-orange-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-orange-600" /> Return Note:
                                    </h4>
                                    <p className="text-xs sm:text-sm text-orange-900/90 italic leading-relaxed">{returnEntry.returnNote}</p>
                                </div>
                            )}
                            {selectedInvoice.orderNote && (
                                <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{selectedInvoice.orderNote}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseReturnView;