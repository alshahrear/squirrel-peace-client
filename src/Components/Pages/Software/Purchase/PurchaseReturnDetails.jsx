import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Phone,
    Mail,
    MapPin,
    Calendar,
    Building2,
    ArrowLeft,
    PackageX,
    RotateCcw
} from 'lucide-react';

const PurchaseReturnDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [returnQuantities, setReturnQuantities] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedInvoice(data);
                    setReturnQuantities(new Array(data.items.length).fill(0));
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

    // Return Quantity input change handler (pcs er beshi dite parbe na)
    const handleReturnQtyChange = (index, value, maxPcs) => {
        let qty = Number(value);
        if (isNaN(qty) || qty < 0) qty = 0;
        if (qty > Number(maxPcs)) qty = Number(maxPcs);

        setReturnQuantities((prev) => {
            const updated = [...prev];
            updated[index] = qty;
            return updated;
        });
    };

    const getReturnAmount = (index, buyPrice) => {
        const qty = returnQuantities[index] || 0;
        return qty * Number(buyPrice);
    };

    const getReturnedQtyForProduct = (productId) => {
        if (!selectedInvoice?.returnHistory) return 0;
        return selectedInvoice.returnHistory.reduce((sum, ret) => {
            const found = ret.items?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnPcs) : 0);
        }, 0);
    };

    const getRemainingQty = (item) => {
        const returned = getReturnedQtyForProduct(item.productId);
        return Math.max(Number(item.pcs) - returned, 0);
    };

    const totalReturnPcs = returnQuantities.reduce((sum, qty) => sum + Number(qty || 0), 0);

    const totalReturnAmount = selectedInvoice
        ? selectedInvoice.items.reduce(
            (sum, item, index) => sum + getReturnAmount(index, item.buyPrice),
            0
        )
        : 0;

    const handleConfirmReturn = async () => {
        if (totalReturnPcs <= 0) {
            showToast('Return korar jonno kompokkhe 1 ta product a quantity din!', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { _id, ...rest } = selectedInvoice;

            const today = new Date();
            const returnDate = today.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            const returnId = `RET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

            const returnedItems = selectedInvoice.items
                .map((item, index) => ({
                    productId: item.productId,
                    productName: item.productName,
                    returnPcs: returnQuantities[index] || 0,
                    returnAmount: getReturnAmount(index, item.buyPrice),
                }))
                .filter((it) => it.returnPcs > 0);

            const newReturnEntry = {
                returnId,
                returnDate,
                items: returnedItems,
                totalReturnPcs,
                totalReturnAmount,
            };

            const updatedData = {
                ...rest,
                returnHistory: [...(selectedInvoice.returnHistory || []), newReturnEntry],
            };

            const response = await fetch(`http://localhost:5000/purchase/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                showToast('Purchase return successfully added!', 'success');
                setTimeout(() => navigate('/purchase'), 900);
            } else {
                showToast('Failed to update return!', 'error');
            }
        } catch (error) {
            console.error('Error updating return:', error);
            showToast('Server error while updating return!', 'error');
        } finally {
            setSubmitting(false);
        }
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top action bar */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                        onClick={() => navigate('/purchase')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Purchases
                    </button>
                </div>

                {/* Invoice Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-white overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
                                    <Building2 className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-white bg-white/20 px-2.5 py-1 rounded-md mb-1.5 uppercase">
                                        Purchase Return
                                    </span>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-white">ইসরাইল এন্টারপ্রাইজ</h1>
                                    <p className="text-indigo-50/90 text-xs sm:text-sm flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-3.5 h-3.5" /> শাহজী পাড়া, বড় বাজার, মেহেরপুর
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs sm:text-sm text-indigo-50/90 space-y-1.5">
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>01997074920</span>
                                </p>
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>jakoberjak2017@gmail.com</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bill From / To */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-b border-slate-200/70">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                                <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-3 uppercase">Bill From</span>
                                <p className="font-bold text-slate-800 text-base">{selectedInvoice.company}</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{selectedInvoice.phone}</p>
                                <p className="text-xs sm:text-sm text-slate-600">{selectedInvoice.address}</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
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

                    {/* Products Table */}
                    <div className="p-6 sm:p-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-3.5 rounded-l-xl">SL</th>
                                    <th className="py-3 px-3.5">Product Name</th>
                                    <th className="py-3 px-3.5">Company</th>
                                    <th className="py-3 px-3.5">Pcs</th>
                                    <th className="py-3 px-3.5">Free Qty</th>
                                    <th className="py-3 px-3.5 text-right">Total Cost Price</th>
                                    <th className="py-3 px-3.5 text-right">Total Sell Price</th>
                                    <th className="py-3 px-3.5 text-right">Discount</th>
                                    <th className="py-3 px-3.5 text-center">Remaining Quantity</th>
                                    <th className="py-3 px-3.5 text-center">Return Quantity</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Return Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.items.map((item, index) => (
                                    <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                        <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                        <td className="py-4 px-3.5 text-slate-600">{selectedInvoice.company}</td>
                                        <td className="py-4 px-3.5">{item.pcs}</td>
                                        <td className="py-4 px-3.5 font-medium text-emerald-600">
                                            {item.freeQty > 0 ? `${item.freeQty} (${item.freeProduct})` : '0'}
                                        </td>
                                        <td className="py-4 px-3.5 text-center font-medium text-slate-600">
                                            ৳{(Number(item.buyPrice) * Number(item.pcs)).toFixed(2)}
                                            <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.buyPrice).toFixed(2)})</span>
                                        </td>
                                        <td className="py-4 px-3.5 text-center font-medium text-slate-600">
                                            ৳{(Number(item.sellPrice) * Number(item.pcs)).toFixed(2)}
                                            <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.sellPrice).toFixed(2)})</span>
                                        </td>
                                        <td className="py-4 px-3.5 text-right text-rose-500 font-medium">৳{Number(item.discount).toFixed(2)}</td>
                                        <td className="py-4 px-3.5 text-center font-semibold text-indigo-600">{getRemainingQty(item)}</td>
                                        <td className="py-4 px-3.5 text-center">
                                            <input
                                                type="number"
                                                min="0"
                                                max={getRemainingQty(item)}
                                                disabled={getRemainingQty(item) <= 0}
                                                value={returnQuantities[index] ?? 0}
                                                onChange={(e) => handleReturnQtyChange(index, e.target.value, getRemainingQty(item))}
                                                className="w-20 text-center px-2 py-1.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                            />
                                        </td>
                                        <td className="py-4 px-3.5 text-right font-bold text-orange-600">
                                            ৳{getReturnAmount(index, item.buyPrice).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals + Confirm Return */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-end items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total Return Pcs</p>
                                <p className="text-lg font-bold text-slate-800">{totalReturnPcs}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total Return Amount</p>
                                <p className="text-lg font-bold text-orange-600">৳{totalReturnAmount.toFixed(2)}</p>
                            </div>
                        </div>

                        <button
                            onClick={handleConfirmReturn}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {submitting ? 'Processing...' : 'Confirm Return'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseReturnDetails;