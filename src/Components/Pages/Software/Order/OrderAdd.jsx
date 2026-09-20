import React, { useState } from 'react';
import OrderForm from './OrderForm';
import useDraftState, { clearDraft } from '../../../../hooks/useDraftState';

const clearOrderDrafts = () => {
    ['items', 'overallAmount', 'overallType', 'adjText', 'adjAmount', 'adjType', 'note', 'form', 'search', 'routeLocked']
        .forEach((k) => clearDraft(`orderNew:${k}`));
}; 

const OrderAdd = () => {
    // সিলেক্ট করা প্রোডাক্টগুলো রাখার স্টেট
    const [orderItems, setOrderItems] = useDraftState('orderNew:items', []);

    // OrderForm থেকে আসা customer, route, date, shippingAddress, sr, deliveredBy ইত্যাদি
    const [orderFormData, setOrderFormData] = useState({
        customerId: '',
        customer: '',
        customerContact: '',
        customerAddress: '',
        route: '',
        date: '',
        shippingAddress: '',
        srId: '',
        sr: '',
        deliveredById: '',
        deliveredBy: '',
        company: '',
        category: '',
    });

    // Order সফল হওয়ার পর OrderForm রিসেট করার জন্য key
    const [formResetKey, setFormResetKey] = useState(0);

    // Toast notification
    const [toast, setToast] = useState({ show: false, message: '', isError: false });

    // Overall Discount
    const [overallDiscountAmount, setOverallDiscountAmount] = useDraftState('orderNew:overallAmount', 0);
    const [overallDiscountType, setOverallDiscountType] = useDraftState('orderNew:overallType', 'amount'); // 'amount' | 'percent'

    // Adjustment
    const [adjustmentText, setAdjustmentText] = useDraftState('orderNew:adjText', '');
    const [adjustmentAmount, setAdjustmentAmount] = useDraftState('orderNew:adjAmount', 0);
    const [adjustmentType, setAdjustmentType] = useDraftState('orderNew:adjType', '+');

    // Order Note
    const [orderNote, setOrderNote] = useDraftState('orderNew:note', '');

    // --------------------------------------------------
    // Helpers
    // --------------------------------------------------

    // Number কে সবসময় 2 digit পর্যন্ত Round করার Helper
    const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
    };

    // Order Number Generate (YYMMDDHHMMSS - 24hr, no separators)
    const generateOrderNo = () => {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yy}${mm}${dd}${hh}${min}${ss}`;
    };

    // --------------------------------------------------
    // OrderForm Data Update
    // --------------------------------------------------
    const handleFormDataChange = (data) => {
        setOrderFormData(data);
    };

    // --------------------------------------------------
    // Product Add
    // --------------------------------------------------
    const handleAddProduct = (product) => {
        const initialUnitQty = '';
        const initialPcsQty = '';
        const baseFreeQty = Number(product.freeProductQty) || 0;
        const pcsPerUnit = Number(product.pcsOfUnit) || 1;

        const newItem = {
            ...product,
            uniqueId: Date.now() + Math.random(),

            productName: product.productName || '',
            company: product.company || '',
            category: product.category || null,
            sku: product.sku || null,

            buyPrice: Number(product.purchasePrice) || 0,
            sellPrice: Number(product.sellingPrice) || 0,

            unit: product.unit || 'Pcs',

            unitQty: initialUnitQty,
            pcsQty: initialPcsQty,
            pcsPerUnit: pcsPerUnit,

            totalQty: (Number(initialUnitQty) || 0) * pcsPerUnit + (Number(initialPcsQty) || 0),

            freeQty: baseFreeQty * (Number(initialUnitQty) || 0),

            // মূল Free Qty (প্রতি Unit এ)
            baseFreeQty: baseFreeQty,

            // Product Discount
            discount: 0,
            discountType: 'amount', // 'amount' | 'percent'
        };

        setOrderItems((prev) => [...prev, newItem]);
    };

    // --------------------------------------------------
    // Product Remove
    // --------------------------------------------------
    const handleRemoveItem = (uniqueId) => {
        setOrderItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    // --------------------------------------------------
    // Item Change
    // --------------------------------------------------
    const handleItemChange = (uniqueId, field, value) => {
        // Negative value allow করবে না
        if (value !== '' && Number(value) < 0) return;

        setOrderItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) {
                    return item;
                }

                // Unit Qty Change
                if (field === 'unitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const pcsQtyVal = Number(item.pcsQty) || 0;

                    const newTotalQty = numVal * (Number(item.pcsPerUnit) || 1) + pcsQtyVal;
                    const newFreeQty = numVal * (Number(item.baseFreeQty) || 0);

                    return {
                        ...item,
                        unitQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                        freeQty: newFreeQty,
                    };
                }

                // PCS Qty Change
                if (field === 'pcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const unitQtyVal = Number(item.unitQty) || 0;

                    const newTotalQty = unitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal;

                    return {
                        ...item,
                        pcsQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                    };
                }

                // Free Qty Change
                if (field === 'freeQty') {
                    return {
                        ...item,
                        freeQty: value === '' ? '' : Number(value),
                    };
                }

                // Discount Change
                if (field === 'discount') {
                    return {
                        ...item,
                        discount: value === '' ? '' : Number(value),
                    };
                }

                // Other Fields (যেমন sellPrice)
                return {
                    ...item,
                    [field]: value,
                };
            })
        );
    };

    // --------------------------------------------------
    // Discount Type Toggle (Amount / Percent)
    // --------------------------------------------------
    const handleToggleDiscountType = (uniqueId) => {
        setOrderItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;
                return {
                    ...item,
                    discountType: item.discountType === 'percent' ? 'amount' : 'percent',
                };
            })
        );
    };

    // --------------------------------------------------
    // Added Product IDs (ড্রপডাউন থেকে বাদ দেওয়ার জন্য)
    // --------------------------------------------------
    const addedProductIds = orderItems.map((item) => item.productName || item._id);

    // --------------------------------------------------
    // TOTAL CALCULATIONS
    // --------------------------------------------------

    // Product-এর মূল SubTotal (Sell Price x Total Qty)
    const subTotal = roundTo2(
        orderItems.reduce((total, item) => {
            const sellPrice = Number(item.sellPrice) || 0;
            const totalQty = Number(item.totalQty) || 0;
            return total + sellPrice * totalQty;
        }, 0)
    );

    // Product Wise Discount (percent হলে row gross total অনুযায়ী হিসাব হবে)
    const productWiseDiscount = roundTo2(
        orderItems.reduce((total, item) => {
            const rowGrossTotal = (Number(item.sellPrice) || 0) * (Number(item.totalQty) || 0);
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? (rowGrossTotal * (Number(item.discount) || 0)) / 100
                    : Number(item.discount) || 0;
            return total + effectiveDiscount;
        }, 0)
    );

    // Grand Total এর তুলনায় Product Wise Discount কত % হলো
    const productWiseDiscountPercent =
        subTotal > 0 ? roundTo2((productWiseDiscount / subTotal) * 100) : 0;

    // Overall Discount (Grand Total - Product Wise Discount এর উপর হিসাব হবে)
    const afterProductDiscount = subTotal - productWiseDiscount;
    const overallDiscountValue = roundTo2(
        overallDiscountType === 'percent'
            ? (afterProductDiscount * (Number(overallDiscountAmount) || 0)) / 100
            : Number(overallDiscountAmount) || 0
    );

    const overallDiscountPercent =
        overallDiscountType === 'amount'
            ? (afterProductDiscount > 0
                ? roundTo2(((Number(overallDiscountAmount) || 0) / afterProductDiscount) * 100)
                : 0)
            : 0;

    // Adjustment
    const adjustmentValue = Number(adjustmentAmount) || 0;

    let payableAmount = afterProductDiscount - overallDiscountValue;

    if (adjustmentType === '+') {
        payableAmount += adjustmentValue;
    } else {
        payableAmount -= adjustmentValue;
    }

    // Payable কখনো negative হবে না
    if (payableAmount < 0) {
        payableAmount = 0;
    }

    payableAmount = roundTo2(payableAmount);

    // --------------------------------------------------
    // Submit (এখন শুধু Frontend — Backend পরে যোগ হবে)
    // --------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ---------------- Validation ----------------
        if (!orderFormData.customerId) {
            showToast('Customer is required!', true);
            return;
        }

        if (!orderFormData.route) {
            showToast('Route is required!', true);
            return;
        }

        if (!orderFormData.date) {
            showToast('Date is required!', true);
            return;
        }

        if (!orderFormData.srId) {
            showToast('SR is required!', true);
            return;
        }

        if (!orderFormData.deliveredById) {
            showToast('Delivered By is required!', true);
            return;
        }

        if (orderItems.length === 0) {
            showToast('Please add at least one product!', true);
            return;
        }

        const hasInvalidQty = orderItems.some(
            (item) => !item.totalQty || Number(item.totalQty) <= 0
        );

        if (hasInvalidQty) {
            showToast('Each product must have a valid quantity (greater than 0)!', true);
            return;
        }
        // ---------------- Validation End ----------------

        const itemsPayload = orderItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal = (Number(item.sellPrice) || 0) * totalQty;
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);
            const rowSubtotal = roundTo2(rowGrossTotal - effectiveDiscount);

            return {
                productId: item._id,
                productName: item.productName,
                company: item.company,
                sku: item.sku,
                sellPrice: roundTo2(item.sellPrice),
                unit: item.unit || 'Pcs',
                unitQty: Number(item.unitQty) || 0,
                pcsQty: Number(item.pcsQty) || 0,
                totalPcs: totalQty,
                freeQty: Number(item.freeQty) || 0,
                discount: roundTo2(item.discount),
                discountType: item.discountType || 'amount',
                discountAmount: effectiveDiscount,
                subtotal: rowSubtotal,
            };
        });

        const orderData = {
            orderNo: generateOrderNo(),

            customerId: orderFormData.customerId,
            customer: orderFormData.customer,
            phone: orderFormData.customerContact,
            address: orderFormData.customerAddress,
            route: orderFormData.route,
            shippingAddress: orderFormData.shippingAddress,
            orderDate: orderFormData.date,

            srId: orderFormData.srId,
            sr: orderFormData.sr,
            deliveredById: orderFormData.deliveredById,
            deliveredBy: orderFormData.deliveredBy,

            items: itemsPayload,

            grandTotal: subTotal,
            productWiseDiscount: productWiseDiscount,
            productWiseDiscountPercent: productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType: overallDiscountType,
            overallDiscountValue: overallDiscountValue,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            payableAmount: payableAmount,

            orderNote: orderNote,
        };

        // Sales database এ save করা
        try {
            const res = await fetch('http://localhost:5000/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData),
            });

            if (!res.ok) {
                throw new Error('Failed to save order');
            }

            await res.json();
        } catch (error) {
            console.error('Error saving order:', error);
            showToast('Failed to save order. Try again.', true);
            return;
        }

        showToast(`Order created successfully! Order No: ${orderData.orderNo}`);

        clearOrderDrafts();
        // টেবিল ও ফর্ম রিসেট
        setOrderItems([]);
        setOverallDiscountAmount(0);
        setOverallDiscountType('amount');
        setAdjustmentText('');
        setAdjustmentAmount(0);
        setAdjustmentType('+');
        setOrderNote('');
        setFormResetKey((prev) => prev + 1);
    };

    return (
        <div>
            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 transition-all ${toast.isError ? 'bg-rose-600' : 'bg-gradient-to-br from-teal-600 to-emerald-500'
                        }`}
                >
                    {toast.isError ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}

            {/* -----------------------------------------
                Order Form (Customer, Route, SR, Product Select...)
            ----------------------------------------- */}
            <OrderForm
                key={formResetKey}
                onAddProduct={handleAddProduct}
                addedProductIds={addedProductIds}
                onFormDataChange={handleFormDataChange}
            />

            {/* -----------------------------------------
                Main Order Table
            ----------------------------------------- */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 my-6 relative z-0">
                <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 p-6 md:p-8 border border-teal-100/70">

                    <form onSubmit={handleSubmit}>

                        {/* ---------------------------------
                            Product Table
                        --------------------------------- */}
                        <div className="overflow-x-auto rounded-2xl border border-teal-100">
                            <table className="w-full text-left border-collapse">

                                <thead>
                                    <tr className="bg-teal-50/60 border-b-2 border-teal-100 text-xs font-semibold text-teal-800">
                                        <th className="py-3 px-3">Product Name</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Unit Qty</th>
                                        <th className="py-3 px-3">PCS Qty</th>
                                        <th className="py-3 px-3">Total Qty</th>
                                        <th className="py-3 px-3">Free Qty</th>
                                        <th className="py-3 px-3">Sell Price</th>
                                        <th className="py-3 px-3">Discount</th>
                                        <th className="py-3 px-3">Subtotal</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 text-sm">

                                    {orderItems.length > 0 ? (

                                        orderItems.map((item) => {

                                            // Row Subtotal
                                            const rowGrossTotal =
                                                (Number(item.sellPrice) || 0) *
                                                (Number(item.totalQty) || 0);

                                            const rowEffectiveDiscount =
                                                item.discountType === 'percent'
                                                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                                                    : roundTo2(Number(item.discount) || 0);

                                            const rowDiscountPercent =
                                                item.discountType === 'amount'
                                                    ? (rowGrossTotal > 0
                                                        ? roundTo2(((Number(item.discount) || 0) / rowGrossTotal) * 100)
                                                        : 0)
                                                    : 0;

                                            const rowSubtotal = roundTo2(rowGrossTotal - rowEffectiveDiscount);

                                            const currentUnitLabel = item.unit || 'Pcs';

                                            return (
                                                <tr key={item.uniqueId} className="hover:bg-teal-50/40 transition">

                                                    {/* Product Name */}
                                                    <td className="py-3 px-3">
                                                        <div className="font-semibold text-slate-800">
                                                            {item.productName}
                                                        </div>
                                                    </td>

                                                    {/* Company */}
                                                    <td className="py-3 px-3 text-slate-600">
                                                        {item.company}
                                                    </td>

                                                    {/* Unit Qty */}
                                                    <td className="py-3 pl-2 pr-0 w-36">
                                                        <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl">
                                                            <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1"
                                                                    placeholder="0"
                                                                    value={item.unitQty}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        if (/^\d*$/.test(value)) {
                                                                            handleItemChange(item.uniqueId, 'unitQty', value);
                                                                        }
                                                                    }}
                                                                    className="w-12 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                />

                                                                <span
                                                                    className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                    title="Unit"
                                                                >
                                                                    {currentUnitLabel}
                                                                </span>

                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* PCS Qty */}
                                                    <td className="py-3 pl-0 pr-2 w-24">
                                                        <div className="p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="1"
                                                                placeholder="0"
                                                                value={item.pcsQty}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    if (/^\d*$/.test(value)) {
                                                                        handleItemChange(item.uniqueId, 'pcsQty', value);
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                            />
                                                        </div>
                                                    </td>
                                                    {/* Total Qty */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            readOnly
                                                            value={item.totalQty}
                                                            className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                                        />
                                                    </td>

                                                    {/* Free Qty */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="1"
                                                            placeholder="0"
                                                            value={item.freeQty === 0 ? '' : item.freeQty}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (/^\d*$/.test(value)) {
                                                                    handleItemChange(item.uniqueId, 'freeQty', value);
                                                                }
                                                            }}
                                                            className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Sell Price */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            value={item.sellPrice}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                    handleItemChange(item.uniqueId, 'sellPrice', value);
                                                                }
                                                            }}
                                                            className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Discount */}
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleDiscountType(item.uniqueId)}
                                                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                                                                title="Click to toggle Amount / Percentage"
                                                            >
                                                                {item.discountType === 'percent' ? '%' : '৳'}
                                                            </button>

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="0"
                                                                value={item.discount === 0 ? '' : item.discount}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;
                                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                        handleItemChange(item.uniqueId, 'discount', value);
                                                                    }
                                                                }}
                                                                className="w-16 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                            />

                                                            {item.discountType === 'percent' && (
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value={rowEffectiveDiscount ? rowEffectiveDiscount.toFixed(2) : ''}
                                                                    placeholder="৳0.00"
                                                                    title="Discount amount in Taka"
                                                                    className="w-16 px-2 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                                                />
                                                            )}

                                                            {item.discountType === 'amount' && (
                                                                <input
                                                                    type="text"
                                                                    readOnly
                                                                    value={rowDiscountPercent ? `${rowDiscountPercent.toFixed(2)}%` : ''}
                                                                    placeholder="0%"
                                                                    title="Discount percentage"
                                                                    className="w-16 px-2 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                                                />
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Row Subtotal */}
                                                    <td className="py-3 px-3 font-bold text-emerald-700">
                                                        {rowSubtotal.toFixed(2)}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-3 px-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRemoveItem(item.uniqueId)}
                                                            className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                fill="none"
                                                                viewBox="0 0 24 24"
                                                                strokeWidth={1.5}
                                                                stroke="currentColor"
                                                                className="w-5 h-5"
                                                            >
                                                                <path
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                />
                                                            </svg>
                                                        </button>
                                                    </td>

                                                </tr>
                                            );
                                        })

                                    ) : (

                                        <tr>
                                            <td
                                                colSpan="10"
                                                className="text-center py-8 text-slate-400 text-sm"
                                            >
                                                No products added yet.
                                                Please fill the order information above and select a product.
                                            </td>
                                        </tr>

                                    )}

                                </tbody>
                            </table>
                        </div>


                        {/* =================================
                            SUMMARY SECTION
                        ================================= */}
                        <div className="mt-6 flex justify-end">

                            <div className="w-full md:w-[700px] space-y-2.5 bg-teal-50/40 border border-teal-100 rounded-2xl p-5">

                                {/* Grand Total */}
                                <div className="flex items-center">
                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Grand Total
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        value={subTotal.toFixed(2)}
                                        className="flex-1 px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm outline-none"
                                    />
                                </div>

                                {/* Product Wise Discount */}
                                <div className="flex items-center">
                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Product Wise Discount
                                    </label>

                                    <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">
                                        <input
                                            type="text"
                                            readOnly
                                            value={productWiseDiscount.toFixed(2)}
                                            className="flex-1 min-w-0 px-3 py-2 bg-slate-100 text-sm outline-none"
                                        />

                                        <input
                                            type="text"
                                            readOnly
                                            value={productWiseDiscountPercent ? `${productWiseDiscountPercent.toFixed(2)}%` : ''}
                                            placeholder="0%"
                                            title="Grand Total এর তুলনায় Discount percentage"
                                            className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600"
                                        />
                                    </div>
                                </div>

                                {/* Overall Discount */}
                                <div className="flex items-center">

                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Overall Discount
                                    </label>

                                    <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">

                                        {/* Overall Discount Amount */}
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            value={overallDiscountAmount === 0 ? '' : overallDiscountAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    setOverallDiscountAmount(
                                                        value === '' ? '' : Number(value)
                                                    );
                                                }
                                            }}
                                            className="flex-1 min-w-0 px-3 py-2 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {overallDiscountType === 'percent' && (
                                            <input
                                                type="text"
                                                readOnly
                                                value={overallDiscountValue ? overallDiscountValue.toFixed(2) : ''}
                                                placeholder="৳0.00"
                                                title="Discount amount in Taka"
                                                className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                            />
                                        )}

                                        {overallDiscountType === 'amount' && (
                                            <input
                                                type="text"
                                                readOnly
                                                value={overallDiscountPercent ? `${overallDiscountPercent.toFixed(2)}%` : ''}
                                                placeholder="0%"
                                                title="Discount percentage"
                                                className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                            />
                                        )}

                                        {/* Amount / Percent Toggle */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setOverallDiscountType((prev) =>
                                                    prev === 'amount' ? 'percent' : 'amount'
                                                )
                                            }
                                            className="w-16 shrink-0 border-l border-slate-200 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition cursor-pointer"
                                            title="Click to toggle Amount / Percentage"
                                        >
                                            {overallDiscountType === 'percent' ? '%' : '৳'}
                                        </button>

                                    </div>
                                </div>

                                {/* Adjustment */}
                                <div className="flex items-center">

                                    <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                        Adjustment
                                    </label>

                                    <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">

                                        {/* Adjustment Text */}
                                        <input
                                            type="text"
                                            placeholder="Text"
                                            value={adjustmentText}
                                            onChange={(e) => setAdjustmentText(e.target.value)}
                                            className="flex-1 min-w-0 px-3 py-2 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {/* Adjustment Amount */}
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            value={adjustmentAmount === 0 ? '' : adjustmentAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;

                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    setAdjustmentAmount(
                                                        value === '' ? '' : Number(value)
                                                    );
                                                }
                                            }}
                                            className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {/* Adjustment Type */}
                                        <select
                                            value={adjustmentType}
                                            onChange={(e) => setAdjustmentType(e.target.value)}
                                            className="w-16 shrink-0 px-2 py-2 border-l border-slate-200 bg-white text-sm outline-none cursor-pointer"
                                        >
                                            <option value="+">+</option>
                                            <option value="-">-</option>
                                        </select>

                                    </div>
                                </div>

                                {/* Payable Amount */}
                                <div className="flex items-center pt-2 mt-1 border-t border-teal-200">
                                    <label className="w-56 text-right pr-3 text-sm font-bold text-teal-800">
                                        Payable Amount
                                    </label>

                                    <input
                                        type="text"
                                        readOnly
                                        value={payableAmount.toFixed(2)}
                                        className="flex-1 px-3 py-2.5 border border-teal-200 bg-white font-bold text-emerald-700 text-base rounded-lg outline-none"
                                    />
                                </div>

                            </div>
                        </div>


                        {/* =================================
                            ORDER NOTE
                        ================================= */}
                        <div className="mt-8">

                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Order Note
                            </label>

                            <textarea
                                rows="3"
                                placeholder="Write any note about this order..."
                                value={orderNote}
                                onChange={(e) => setOrderNote(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-y shadow-sm"
                            />

                        </div>

                        {/* =================================
                            CREATE ORDER BUTTON
                        ================================= */}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                className="px-10 py-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-sm font-semibold text-white shadow-md shadow-teal-200 transition cursor-pointer"
                            >
                                Create Order
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OrderAdd;