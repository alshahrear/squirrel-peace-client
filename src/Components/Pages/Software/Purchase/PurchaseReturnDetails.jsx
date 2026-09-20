import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
    const [searchParams] = useSearchParams();
    const editReturnId = searchParams.get('returnId');
    const isEditMode = !!editReturnId;
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [returnInputs, setReturnInputs] = useState([]); // [{ rtUnitQty, rtPcsQty, rtFreeQty }, ...]
    const [itemDiscounts, setItemDiscounts] = useState([]); // [{ discount, discountType }, ...]
    const [returnPrices, setReturnPrices] = useState([]); // [buyPrice per item, editable for calc only]
    const [overallDiscountAmount, setOverallDiscountAmount] = useState(0);
    const [overallDiscountType, setOverallDiscountType] = useState('amount');
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // --------------------------------------------------
    // Number ke sobsomoy 2 digit porjonto Round korar Helper
    // --------------------------------------------------
    const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedInvoice(data);

                    // Edit Mode hole matching return entry theke value prefill korbe
                    const editingEntry = editReturnId
                        ? (data.returnHistory || []).find((ret) => ret.returnId === editReturnId)
                        : null;

                    setReturnInputs(
                        (data.items || []).map((item) => {
                            if (editingEntry) {
                                const found = editingEntry.items?.find((it) => it.productId === item.productId);
                                if (found) {
                                    return {
                                        rtUnitQty: Number(found.returnUnitQty) || 0,
                                        rtPcsQty: Number(found.returnPcsQty) || 0,
                                        rtFreeQty: Number(found.returnFreeQty) || 0,
                                    };
                                }
                            }
                            return { rtUnitQty: 0, rtPcsQty: 0, rtFreeQty: 0 };
                        })
                    );

                    setItemDiscounts(
                        (data.items || []).map((item) => ({
                            discount: Number(item.discount) || 0,
                            discountType: item.discountType || 'amount',
                        }))
                    );

                    setReturnPrices(
                        (data.items || []).map((item) => Number(item.buyPrice) || 0)
                    );

                    setOverallDiscountAmount(Number(data.overallDiscount) || 0);
                    setOverallDiscountType(data.overallDiscountType || 'amount');
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

    // --------------------------------------------------
    // 1 Unit = koto PCS, item er original purchase data theke ber kora
    // --------------------------------------------------
    const getPcsPerUnit = (item) => {
        const unitQtyNum = Number(item.unitQty) || 0;
        const pcsQtyNum = Number(item.pcsQty) || 0;
        const totalPcsNum = Number(item.totalPcs) || 0;
        if (unitQtyNum > 0) {
            const perUnit = (totalPcsNum - pcsQtyNum) / unitQtyNum;
            return perUnit > 0 ? perUnit : 0;
        }
        return 0;
    };

    // --------------------------------------------------
    // Age koto Total RT Qty return kora hoyeche (returnHistory theke)
    // --------------------------------------------------
    const getReturnedQtyForProduct = (productId) => {
        if (!selectedInvoice?.returnHistory) return 0;
        return selectedInvoice.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum; // nijer entry bad diye hisab hobe
            const found = ret.items?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnTotalQty) || 0 : 0);
        }, 0);
    };

    // --------------------------------------------------
    // Age koto Free Qty return kora hoyeche (returnHistory theke)
    // --------------------------------------------------
    const getReturnedFreeQtyForProduct = (productId) => {
        if (!selectedInvoice?.returnHistory) return 0;
        return selectedInvoice.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum; // nijer entry bad diye hisab hobe
            const found = ret.items?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnFreeQty) || 0 : 0);
        }, 0);
    };
    const getRemainingQty = (item) => {
        const returned = getReturnedQtyForProduct(item.productId);
        return Math.max(Number(item.totalPcs || 0) - returned, 0);
    };

    const getFreeRemainingQty = (item) => {
        const returned = getReturnedFreeQtyForProduct(item.productId);
        return Math.max(Number(item.freeQty || 0) - returned, 0);
    };

    const getTotalRtQty = (index, item) => {
        const pcsPerUnit = getPcsPerUnit(item);
        const rtUnitQty = Number(returnInputs[index]?.rtUnitQty) || 0;
        const rtPcsQty = Number(returnInputs[index]?.rtPcsQty) || 0;
        return rtUnitQty * pcsPerUnit + rtPcsQty;
    };

    const getReturnAmount = (index, item) => {
        const totalRtQty = getTotalRtQty(index, item);
        const price = returnPrices[index] !== undefined ? Number(returnPrices[index]) || 0 : (Number(item.buyPrice) || 0);
        return totalRtQty * price;
    };

    const getItemDiscountAmount = (index, item) => {
        const discount = Number(itemDiscounts[index]?.discount) || 0;
        const discountType = itemDiscounts[index]?.discountType || 'amount';
        const rowGrossTotal = (Number(item.buyPrice) || 0) * (Number(item.totalPcs) || 0);
        return discountType === 'percent'
            ? roundTo2((rowGrossTotal * discount) / 100)
            : roundTo2(discount);
    };

    // --------------------------------------------------
    // RT Qty (Unit) Change
    // --------------------------------------------------
    const handleRtUnitQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const pcsPerUnit = getPcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getRemainingQty(item);
        const currentPcsQty = Number(returnInputs[index]?.rtPcsQty) || 0;
        const total = val * pcsPerUnit + currentPcsQty;

        if (total > remaining) {
            const maxVal = pcsPerUnit > 0 ? Math.floor((remaining - currentPcsQty) / pcsPerUnit) : 0;
            val = Math.max(0, maxVal);
        }

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtUnitQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // PCS Qty Change
    // --------------------------------------------------
    const handleRtPcsQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const pcsPerUnit = getPcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getRemainingQty(item);
        const currentUnitQty = Number(returnInputs[index]?.rtUnitQty) || 0;
        const unitPortion = currentUnitQty * pcsPerUnit;
        const maxPcs = Math.max(0, remaining - unitPortion);

        if (val > maxPcs) val = maxPcs;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtPcsQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // RT Free Qty Change
    // --------------------------------------------------
    const handleRtFreeQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const freeRemaining = getFreeRemainingQty(item);
        if (val > freeRemaining) val = freeRemaining;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtFreeQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // Item Discount Change
    // --------------------------------------------------
    const handleReturnPriceChange = (index, value) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return; // পয়েন্টের পর সর্বোচ্চ ২ ডিজিট
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        setReturnPrices((prev) => {
            const updated = [...prev];
            updated[index] = val;
            return updated;
        });
    };

    const handleItemDiscountChange = (index, value) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return; // পয়েন্টের পর সর্বোচ্চ ২ ডিজিট
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        setItemDiscounts((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], discount: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // Item Discount Type Toggle (Amount / Percent)
    // --------------------------------------------------
    const handleToggleItemDiscountType = (index) => {
        setItemDiscounts((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                discountType: updated[index]?.discountType === 'percent' ? 'amount' : 'percent',
            };
            return updated;
        });
    };

    const totalReturnPcs = selectedInvoice
        ? selectedInvoice.items.reduce((sum, item, index) => sum + getTotalRtQty(index, item), 0)
        : 0;

    const totalReturnFreeQty = returnInputs.reduce((sum, r) => sum + (Number(r?.rtFreeQty) || 0), 0);

    const totalReturnAmount = selectedInvoice
        ? selectedInvoice.items.reduce((sum, item, index) => sum + getReturnAmount(index, item), 0)
        : 0;

    const liveProductWiseDiscount = selectedInvoice
        ? roundTo2(selectedInvoice.items.reduce((sum, item, index) => sum + getItemDiscountAmount(index, item), 0))
        : 0;

    const liveOverallDiscountValue = selectedInvoice
        ? roundTo2(
            overallDiscountType === 'percent'
                ? ((Number(selectedInvoice.grandTotal) || 0) - liveProductWiseDiscount) * (Number(overallDiscountAmount) || 0) / 100
                : Number(overallDiscountAmount) || 0
        )
        : 0;

    const handleConfirmReturn = async () => {
        if (totalReturnPcs <= 0 && totalReturnFreeQty <= 0) {
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

            const returnedItems = selectedInvoice.items
                .map((item, index) => {
                    const totalRtQty = getTotalRtQty(index, item);
                    const rtFreeQty = Number(returnInputs[index]?.rtFreeQty) || 0;
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        returnUnitQty: Number(returnInputs[index]?.rtUnitQty) || 0,
                        returnPcsQty: Number(returnInputs[index]?.rtPcsQty) || 0,
                        returnTotalQty: totalRtQty,
                        returnFreeQty: rtFreeQty,
                        returnAmount: getReturnAmount(index, item),
                    };
                })
                .filter((it) => it.returnTotalQty > 0 || it.returnFreeQty > 0);

            let updatedReturnHistory;

            if (isEditMode) {
                // Existing return entry ke update korbe, ID o original date thakbe
                updatedReturnHistory = (selectedInvoice.returnHistory || []).map((ret) => {
                    if (ret.returnId !== editReturnId) return ret;
                    return {
                        ...ret,
                        items: returnedItems,
                        totalReturnPcs,
                        totalReturnFreeQty,
                        totalReturnAmount,
                    };
                });
            } else {
                const returnId = `RET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                const newReturnEntry = {
                    returnId,
                    returnDate,
                    items: returnedItems,
                    totalReturnPcs,
                    totalReturnFreeQty,
                    totalReturnAmount,
                };
                updatedReturnHistory = [...(selectedInvoice.returnHistory || []), newReturnEntry];
            }

            const updatedItems = selectedInvoice.items.map((item, index) => {
                const itemDiscount = Number(itemDiscounts[index]?.discount) || 0;
                const itemDiscountType = itemDiscounts[index]?.discountType || 'amount';
                const rowGrossTotal = (Number(item.buyPrice) || 0) * (Number(item.totalPcs) || 0);
                const effectiveDiscount =
                    itemDiscountType === 'percent'
                        ? roundTo2((rowGrossTotal * itemDiscount) / 100)
                        : roundTo2(itemDiscount);
                const rowSubtotal = roundTo2(rowGrossTotal - effectiveDiscount);

                return {
                    ...item,
                    discount: itemDiscount,
                    discountType: itemDiscountType,
                    discountAmount: effectiveDiscount,
                    subtotal: rowSubtotal,
                };
            });

            // Product Wise Discount notun kore hisab
            const productWiseDiscount = roundTo2(
                updatedItems.reduce((sum, it) => sum + (Number(it.discountAmount) || 0), 0)
            );

            const grandTotal = Number(rest.grandTotal) || 0;
            const afterProductDiscount = grandTotal - productWiseDiscount;

            // Overall Discount Value notun kore hisab
            const overallDiscountValue = roundTo2(
                overallDiscountType === 'percent'
                    ? (afterProductDiscount * (Number(overallDiscountAmount) || 0)) / 100
                    : Number(overallDiscountAmount) || 0
            );

            // Adjustment age jevabe silo shevabei thakbe, khali Payable Amount notun kore hisab hbe
            const existingAdjustmentAmount = Number(rest.adjustment?.amount) || 0;
            const existingAdjustmentType = rest.adjustment?.type || '+';

            let payableAmount = afterProductDiscount - overallDiscountValue;
            payableAmount =
                existingAdjustmentType === '-'
                    ? payableAmount - existingAdjustmentAmount
                    : payableAmount + existingAdjustmentAmount;

            if (payableAmount < 0) payableAmount = 0;
            payableAmount = roundTo2(payableAmount);

            const updatedData = {
                ...rest,
                items: updatedItems,
                productWiseDiscount,
                overallDiscount: Number(overallDiscountAmount) || 0,
                overallDiscountType: overallDiscountType,
                overallDiscountValue,
                payableAmount,
                returnHistory: updatedReturnHistory,
            };

            const response = await fetch(`http://localhost:5000/purchase/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                showToast(
                    isEditMode ? 'Purchase return successfully updated!' : 'Purchase return successfully added!',
                    'success'
                );
                setTimeout(() => navigate('/purchase-return'), 900);
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
                                                                       <th className="py-3 px-3.5 rounded-l-xl">Product Name</th>
                                    <th className="py-3 px-3.5">Company</th>
                                    <th className="py-3 px-3.5 text-center">RT Qty</th>
                                    <th className="py-3 px-3.5 text-center">PCS Qty</th>
                                    <th className="py-3 px-3.5 text-center">Total RT Qty</th>
                                    <th className="py-3 px-3.5 text-center">Remaining Quantity</th>
                                    <th className="py-3 px-3.5 text-center">RT Free Qty</th>
                                    <th className="py-3 px-3.5 text-center">Remaining Free Qty</th>
                                    <th className="py-3 px-3.5 text-right">Purchase Price</th>
                                    <th className="py-3 px-3.5 text-right">Discount</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Return Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.items.map((item, index) => {
                                    const pcsPerUnit = getPcsPerUnit(item);
                                    const remainingQty = getRemainingQty(item);
                                    const freeRemainingQty = getFreeRemainingQty(item);
                                    const totalRtQty = getTotalRtQty(index, item);
                                    const rtUnitDisabled = pcsPerUnit <= 0 || remainingQty <= 0;
                                    const rtPcsDisabled = remainingQty <= 0;
                                    const rtFreeDisabled = Number(item.freeQty || 0) <= 0 || freeRemainingQty <= 0;

                                    return (
                                        <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                            <td className="py-4 px-3.5 text-slate-600">{selectedInvoice.company}</td>

                                                                                       {/* RT Qty (Unit) */}
                                            <td className="py-4 pl-3.5 pr-0">
                                                <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl">
                                                    <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            disabled={rtUnitDisabled}
                                                            value={returnInputs[index]?.rtUnitQty === 0 ? '' : returnInputs[index]?.rtUnitQty ?? ''}
                                                            onChange={(e) => handleRtUnitQtyChange(index, e.target.value, item)}
                                                            className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />

                                                        <span
                                                            className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                            title="Unit"
                                                        >
                                                            {item.unit || 'Pcs'}
                                                        </span>

                                                    </div>
                                                </div>
                                            </td>

                                            {/* PCS Qty */}
                                            <td className="py-4 pl-0 pr-3.5">
                                                <div className="p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        disabled={rtPcsDisabled}
                                                        value={returnInputs[index]?.rtPcsQty === 0 ? '' : returnInputs[index]?.rtPcsQty ?? ''}
                                                        onChange={(e) => handleRtPcsQtyChange(index, e.target.value, item)}
                                                        className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </td>

                                            {/* Total RT Qty */}
                                            <td className="py-4 px-3.5 text-center font-semibold text-orange-600">{totalRtQty}</td>

                                            {/* Remaining Quantity */}
                                            <td className="py-4 px-3.5 text-center font-semibold text-indigo-600">{remainingQty}</td>

                                            {/* RT Free Qty */}
                                            <td className="py-4 px-3.5 text-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    disabled={rtFreeDisabled}
                                                    value={returnInputs[index]?.rtFreeQty === 0 ? '' : returnInputs[index]?.rtFreeQty ?? ''}
                                                    onChange={(e) => handleRtFreeQtyChange(index, e.target.value, item)}
                                                    className="w-16 text-center px-2 py-1.5 rounded-lg border border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                />
                                            </td>

                                            {/* Remaining Free Qty */}
                                            <td className="py-4 px-3.5 text-center font-medium text-emerald-600">
                                                {freeRemainingQty}{item.freeProduct && Number(item.freeQty) > 0 ? ` (${item.freeProduct})` : ''}
                                            </td>

                                            {/* Purchase Price */}
                                            <td className="py-4 px-3.5 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={returnPrices[index] === 0 ? '' : returnPrices[index] ?? ''}
                                                    onChange={(e) => handleReturnPriceChange(index, e.target.value)}
                                                    className="w-20 text-right px-2 py-1.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                                                />
                                            </td>

                                            {/* Discount */}
                                            <td className="py-4 px-3.5">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleItemDiscountType(index)}
                                                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                                                        title="Click to toggle Amount / Percentage"
                                                    >
                                                        {itemDiscounts[index]?.discountType === 'percent' ? '%' : '৳'}
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={itemDiscounts[index]?.discount === 0 ? '' : itemDiscounts[index]?.discount ?? ''}
                                                        onChange={(e) => handleItemDiscountChange(index, e.target.value)}
                                                        className={`w-16 text-right px-2 py-1.5 rounded-lg border outline-none text-sm ${itemDiscounts[index]?.discountType === 'amount' ? 'border-rose-400 ring-2 ring-rose-100 font-bold text-rose-600' : 'border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'}`}
                                                    />
                                                    {(() => {
                                                        const rowGrossTotal = (Number(item.buyPrice) || 0) * (Number(item.totalPcs) || 0);
                                                        const discountAmt = getItemDiscountAmount(index, item);
                                                        const discountPct =
                                                            itemDiscounts[index]?.discountType === 'percent'
                                                                ? Number(itemDiscounts[index]?.discount) || 0
                                                                : (rowGrossTotal > 0 ? (discountAmt / rowGrossTotal) * 100 : 0);
                                                        const isPercentActive = itemDiscounts[index]?.discountType === 'percent';
                                                        return (
                                                            <>
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value={!isPercentActive ? (discountPct ? `${discountPct.toFixed(2)}%` : '') : (discountAmt ? `৳${discountAmt.toFixed(2)}` : '')}
                                                                    placeholder={!isPercentActive ? '0%' : '৳0.00'}
                                                                    title={!isPercentActive ? 'Discount percentage' : 'Discount amount in Taka'}
                                                                    className={`w-16 text-right px-2 py-1.5 rounded-lg border text-sm outline-none cursor-not-allowed ${isPercentActive ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50 font-bold text-rose-600' : 'border-gray-200 bg-gray-100 text-slate-600'}`}
                                                                />
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </td>

                                            {/* Return Amount */}
                                            <td className="py-4 px-3.5 text-right font-bold text-orange-600">
                                                ৳{getReturnAmount(index, item).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals + Confirm Return */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-end items-center gap-6">
                        <div className="flex items-center gap-6">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Overall Discount</p>
                                <div className="flex items-center rounded-lg overflow-hidden border border-slate-200">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0"
                                        value={overallDiscountAmount === 0 ? '' : overallDiscountAmount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                setOverallDiscountAmount(value === '' ? '' : Number(value));
                                            }
                                        }}
                                        className={`w-20 px-2 py-1.5 text-sm outline-none ${overallDiscountType === 'amount' ? 'bg-indigo-50 font-bold text-indigo-700 ring-2 ring-indigo-200' : 'bg-white focus:bg-indigo-50/40'}`}
                                    />
                                    {(() => {
                                        const afterProductDiscount = (Number(selectedInvoice?.grandTotal) || 0) - liveProductWiseDiscount;
                                        const overallPct =
                                            overallDiscountType === 'percent'
                                                ? Number(overallDiscountAmount) || 0
                                                : (afterProductDiscount > 0 ? (liveOverallDiscountValue / afterProductDiscount) * 100 : 0);
                                        const isPercentActive = overallDiscountType === 'percent';
                                        return (
                                            <input
                                                type="text"
                                                readOnly
                                                value={!isPercentActive ? (overallPct ? `${overallPct.toFixed(2)}%` : '') : (liveOverallDiscountValue ? `৳${liveOverallDiscountValue.toFixed(2)}` : '')}
                                                placeholder={!isPercentActive ? '0%' : '৳0.00'}
                                                title={!isPercentActive ? 'Discount percentage' : 'Discount amount in Taka'}
                                                className={`w-20 px-2 py-1.5 border-l border-slate-200 text-sm outline-none cursor-not-allowed ${isPercentActive ? 'bg-indigo-50 font-bold text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
                                            />
                                        );
                                    })()}
                                    <button
                                        type="button"
                                        onClick={() => setOverallDiscountType((prev) => (prev === 'amount' ? 'percent' : 'amount'))}
                                        className="w-9 shrink-0 border-l border-slate-200 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition cursor-pointer"
                                        title="Click to toggle Amount / Percentage"
                                    >
                                        {overallDiscountType === 'percent' ? '%' : '৳'}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total RT Qty</p>
                                <p className="text-lg font-bold text-slate-800">{totalReturnPcs}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total RT Free Qty</p>
                                <p className="text-lg font-bold text-emerald-600">{totalReturnFreeQty}</p>
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
                            {submitting ? 'Processing...' : isEditMode ? 'Update Return' : 'Confirm Return'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PurchaseReturnDetails;