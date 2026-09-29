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
    PackageX,
    User,
    Truck,
    AlertTriangle,
    Undo2
} from 'lucide-react';

const SalesDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/sales/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedOrder(data);
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching sales data:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id]);

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

    if (notFound || !selectedOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This order record couldn't be found. It may have been deleted.</p>
                    <button
                        onClick={() => navigate('/wholesale')}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Wholesale
                    </button>
                </div>
            </div>
        );
    }

    // Unit অংশের মোট দাম = Unit Qty × প্রতি Unit এর দাম
    const getUnitTotal = (item) =>
        (Number(item.unitQty) || 0) * (Number(item.sellPriceUnit) || 0);

    // PCS অংশের মোট দাম = PCS Qty × প্রতি PCS এর দাম
    const getPcsTotal = (item) =>
        (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);

    // Row Gross হিসাব (Unit অংশ + PCS অংশ)
    const getRowGross = (item) => getUnitTotal(item) + getPcsTotal(item);

    const due = Number(selectedOrder.payableAmount) - Number(selectedOrder.paidAmount || 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-3 sm:p-4 md:p-6 print:bg-white print:p-0">
            <div className="max-w-full mx-auto space-y-6 print:space-y-0 print:max-w-full">

                {/* Top action bar */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button
                        onClick={() => navigate('/wholesale')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Wholesale
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
                            {/* Bill From = আমরা (দোকান) */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none">
                                <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-3 uppercase">Bill From</span>
                                <p className="font-bold text-slate-800 text-base">ইসরাইল এন্টারপ্রাইজ</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">01997074920</p>
                                <p className="text-xs sm:text-sm text-slate-600">শাহজী পাড়া, বড় বাজার, মেহেরপুর</p>
                            </div>

                            {/* Bill To = কাস্টমার / ডিলার */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Bill To</span>
                                        <p className="font-bold text-slate-800 text-lg">{selectedOrder.customer}</p>
                                        <p className="text-xs text-slate-500 mt-1">{selectedOrder.phone}</p>
                                        <p className="text-xs text-slate-500">{selectedOrder.shippingAddress || selectedOrder.address || 'N/A'}</p>
                                        {selectedOrder.route && (
                                            <span className="inline-block mt-1.5 text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100">
                                                Route: {selectedOrder.route}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Order Date: {selectedOrder.orderDate}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Inv: <span className="text-indigo-600">{selectedOrder.orderNo}</span>
                                        </p>
                                    </div>
                                </div>
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
                                    <p className="text-sm font-semibold text-slate-800">{selectedOrder.sr || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-3 print:border-none print:p-0 print:shadow-none">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                    <Truck className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Delivery Man</p>
                                    <p className="text-sm font-semibold text-slate-800">{selectedOrder.deliveredBy || 'N/A'}</p>
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
                                    <th className="py-2.5 px-2 whitespace-nowrap">Free Quantity</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Discount</th>
                                    <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedOrder.items.map((item, index) => {
                                    const rowGrossTotal = getRowGross(item);
                                    return (
                                        <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                            <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                            <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                            <td className="py-3 px-2 font-semibold text-orange-600 whitespace-nowrap">
                                                {item.unitQty} {item.unit} {item.pcsQty} Pcs
                                                <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {item.totalPcs})</span>
                                            </td>
                                            <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                {item.freeUnitQty || 0} {item.unit} {item.freePcsQty || 0} Pcs
                                                <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                ৳{getUnitTotal(item).toFixed(2)}
                                                <span className="text-[10px] text-slate-400 ml-1">
                                                    (৳{Number(item.sellPriceUnit || 0).toFixed(2)}/{item.unit || 'unit'})
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                ৳{getPcsTotal(item).toFixed(2)}
                                                <span className="text-[10px] text-slate-400 ml-1">
                                                    (৳{Number(item.sellPricePcs || 0).toFixed(2)}/pcs)
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium whitespace-nowrap">
                                                {(() => {
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
                                            <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{Number(item.subtotal).toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Others Free + Damage + Return (Payment box er niche) */}
                    <div className="order-2 pt-8 print:pt-4">
                        {selectedOrder.freeItems && selectedOrder.freeItems.length > 0 && (
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
                                        {selectedOrder.freeItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                                <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {item.unitQty} {item.unit} {item.pcsQty} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.totalQty})</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Damage Products Table */}
                        {selectedOrder.damageItems && selectedOrder.damageItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Damage Products
                                </h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-red-100/70 text-red-800 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                            <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Quantity</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Free Quantity</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                                            <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-100 text-xs sm:text-sm text-slate-700">
                                        {selectedOrder.damageItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-red-50/40 transition-colors">
                                                <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                                <td className="py-3 px-2 font-semibold text-orange-600 whitespace-nowrap">
                                                    {item.unitQty} {item.unit} {item.pcsQty} Pcs
                                                    <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {item.totalQty})</span>
                                                </td>
                                                <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {item.freeUnitQty || 0} {item.unit} {item.freePcsQty || 0} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getUnitTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPriceUnit || 0).toFixed(2)}/{item.unit || 'unit'})
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getPcsTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPricePcs || 0).toFixed(2)}/pcs)
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{Number(item.subtotal).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Return Products Table */}
                        {selectedOrder.returnItems && selectedOrder.returnItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 className="text-xs font-bold text-violet-700 uppercase mb-3 flex items-center gap-1.5">
                                    <Undo2 className="w-3.5 h-3.5 text-violet-600" /> Return Products
                                </h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-violet-100/70 text-violet-800 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                            <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Quantity</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Free Quantity</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                                            <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-violet-100 text-xs sm:text-sm text-slate-700">
                                        {selectedOrder.returnItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-violet-50/40 transition-colors">
                                                <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                                <td className="py-3 px-2 font-semibold text-orange-600 whitespace-nowrap">
                                                    {item.unitQty} {item.unit} {item.pcsQty} Pcs
                                                    <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {item.totalQty})</span>
                                                </td>
                                                <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {item.freeUnitQty || 0} {item.unit} {item.freePcsQty || 0} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getUnitTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPriceUnit || 0).toFixed(2)}/{item.unit || 'unit'})
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getPcsTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPricePcs || 0).toFixed(2)}/pcs)
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{Number(item.subtotal).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>

                    {/* Totals + Note */}
                    <div className="order-1 p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-between items-start gap-6 print:bg-white">
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
                                <span className="font-semibold text-rose-600">
                                    - ৳{Number(selectedOrder.productWiseDiscount).toFixed(2)}
                                    <span className="text-[10px] text-slate-400 ml-1">
                                        ({(
                                            selectedOrder.productWiseDiscountPercent ??
                                            (Number(selectedOrder.grandTotal) > 0
                                                ? (Number(selectedOrder.productWiseDiscount) / Number(selectedOrder.grandTotal)) * 100
                                                : 0)
                                        ).toFixed(2)}%)
                                    </span>
                                </span>
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
                            {Number(selectedOrder.damageAdjustmentAmount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Damage Products Amount:</span>
                                    <span className="font-semibold text-red-600">
                                        - ৳{Number(selectedOrder.damageAdjustmentAmount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {Number(selectedOrder.returnAdjustmentAmount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Return Products Amount:</span>
                                    <span className="font-semibold text-violet-600">
                                        - ৳{Number(selectedOrder.returnAdjustmentAmount).toFixed(2)}
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
                                <span className="text-rose-600">৳{due.toFixed(2)}</span>
                            </div>

                            {selectedOrder.receiveStatus && (
                                <div className="flex justify-between py-1 text-slate-500 text-xs pt-1">
                                    <span>Payment Status:</span>
                                    <span className={`font-semibold ${selectedOrder.receiveStatus === 'Received' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedOrder.receiveStatus}
                                    </span>
                                </div>
                            )}

                            {selectedOrder.paymentNote && (
                                <div className="pt-2 mt-1 border-t border-slate-200">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Note:</h4>
                                    <p className="text-xs text-slate-600 italic leading-relaxed">{selectedOrder.paymentNote}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDetails;