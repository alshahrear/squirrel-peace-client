import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PurchaseForm from "./PurchaseForm";

const PurchaseAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingPurchase = location.state?.purchase || null;
    const isReceiveMode = location.state?.mode === 'receive';
    const [isEditMode] = useState(!!editingPurchase);
    const [editId] = useState(editingPurchase?._id || null);

    // ---------------- Payment / Receive States ----------------
    const [investments, setInvestments] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(false); // ইউজার নিজে হাতে Payment Amount change করেছে কিনা
    const [paymentAccountType, setPaymentAccountType] = useState('');
    const [selectedAccountKey, setSelectedAccountKey] = useState('');

    // সিলেক্ট করা প্রোডাক্টগুলো রাখার স্টেট
    const [purchaseItems, setPurchaseItems] = useState([]);

    // PurchaseForm থেকে আসা company, phone, address, date, shippingAddress, category
    const [purchaseFormData, setPurchaseFormData] = useState({
        company: '',
        companyContact: '',
        companyAddress: '',
        date: '',
        shippingAddress: '',
        category: '',
    });

    // Purchase সফল হওয়ার পর PurchaseForm রিসেট করার জন্য key
    const [formResetKey, setFormResetKey] = useState(0);

    // Toast notification
    const [toast, setToast] = useState({ show: false, message: '', isError: false });

    // Adjustment
    const [adjustmentText, setAdjustmentText] = useState('');
    const [adjustmentAmount, setAdjustmentAmount] = useState(0);
    const [adjustmentType, setAdjustmentType] = useState('+');

    // Order Note
    const [orderNote, setOrderNote] = useState('');

    // --------------------------------------------------
    // PurchaseForm-কে দেওয়ার জন্য stable initialData (re-render এ যেন
    // নতুন object তৈরি না হয়, নাহলে ফর্মের ভ্যালু বারবার রিসেট হয়ে যায়)
    // --------------------------------------------------
    const initialFormData = useMemo(() => {
        if (!editingPurchase) return null;
        return {
            company: editingPurchase.company || '',
            companyContact: editingPurchase.phone || '',
            companyAddress: editingPurchase.address || '',
            date: editingPurchase.purchaseDate || '',
            shippingAddress: editingPurchase.shippingAddress || '',
            category: editingPurchase.category || '',
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Edit Mode হলে ডাটা প্রি-ফিল করবে
    // --------------------------------------------------
    useEffect(() => {
        if (editingPurchase) {
            const mappedItems = (editingPurchase.items || []).map((item, index) => {
                const unitMode = item.unit === 'pcs' ? 'pcs' : 'main';
                const qtyNum = Number(item.qty) || 0;
                const pcsNum = Number(item.pcs) || 0;
                const pcsPerUnit =
                    unitMode !== 'pcs' && qtyNum > 0 ? pcsNum / qtyNum : 1;
                const baseFreeQty =
                    unitMode !== 'pcs' && qtyNum > 0
                        ? (Number(item.freeQty) || 0) / qtyNum
                        : 0;

                return {
                    _id: item.productId,
                    productName: item.productName,
                    company: editingPurchase.company || '',
                    category: editingPurchase.category || '',
                    uniqueId: `${item.productId || 'item'}-${index}-${Date.now()}`,
                    buyPrice: Number(item.buyPrice) || 0,
                    sellPrice: Number(item.sellPrice) || 0,
                    unitQty: item.qty,
                    pcs: item.pcs,
                    unitMode,
                    pcsPerUnit,
                    freeQty: Number(item.freeQty) || 0,
                    baseFreeQty,
                    freeProductName: item.freeProduct || '',
                    discount: Number(item.discount) || 0,
                };
            });

            setPurchaseItems(mappedItems);
            setAdjustmentText(editingPurchase.adjustment?.text || '');
            setAdjustmentAmount(editingPurchase.adjustment?.amount || 0);
            setAdjustmentType(editingPurchase.adjustment?.type || '+');
            setOrderNote(editingPurchase.orderNote || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Receive Mode হলে Investment Accounts fetch করবে
    // --------------------------------------------------
    useEffect(() => {
        if (isReceiveMode) {
            fetch('http://localhost:5000/investment')
                .then((res) => res.json())
                .then((data) => setInvestments(Array.isArray(data) ? data : []))
                .catch((error) => console.error('Error fetching investments:', error));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Invoice Number Generate (YYMMDDHHMMSS - 24hr, no separators)
    // --------------------------------------------------
    const generateInvoiceNo = () => {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        // 24-hour format (international), AM/PM mix হবে না
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        return `${yy}${mm}${dd}${hh}${min}${ss}`;
    };

    // --------------------------------------------------
    // Purchase Form Data (company/phone/address/date/shipping) Update
    // --------------------------------------------------
    const handleFormDataChange = (data) => {
        setPurchaseFormData(data);
    };

    // --------------------------------------------------
    // Product Add
    // --------------------------------------------------
    const handleAddProduct = (product) => {
        const initialUnitQty = 1;
        const baseFreeQty = Number(product.freeProductQty) || 0;
        const initialUnitMode = 'pcs';

        // PCS মোডে Free Qty সবসময় 0
        const calculatedFreeQty =
            initialUnitMode === 'pcs'
                ? 0
                : baseFreeQty * initialUnitQty;

        const newItem = {
            ...product,
            uniqueId: Date.now() + Math.random(),

            buyPrice: Number(product.purchasePrice) || 0,
            sellPrice: Number(product.sellingPrice) || 0,

            unitQty: initialUnitQty,

            pcs:
                initialUnitMode === 'pcs'
                    ? initialUnitQty
                    : initialUnitQty *
                    (Number(product.pcsOfUnit) || 1),

            unitMode: initialUnitMode,

            pcsPerUnit: Number(product.pcsOfUnit) || 1,

            freeQty: calculatedFreeQty,

            // মূল Free Qty
            baseFreeQty: baseFreeQty,

            // Free Product Name
            freeProductName: product.freeProductName || '',

            // Product Discount
            discount: 0,
        };

        setPurchaseItems((prev) => [...prev, newItem]);
    };

    // --------------------------------------------------
    // Product Remove
    // --------------------------------------------------
    const handleRemoveItem = (uniqueId) => {
        setPurchaseItems((prev) =>
            prev.filter((item) => item.uniqueId !== uniqueId)
        );
    };

    // --------------------------------------------------
    // Item Change
    // --------------------------------------------------
    const handleItemChange = (uniqueId, field, value) => {
        // Negative value allow করবে না
        if (value !== '' && Number(value) < 0) return;

        setPurchaseItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) {
                    return item;
                }

                // ------------------------------------------
                // Unit Qty Change
                // ------------------------------------------
                if (field === 'unitQty') {
                    const numVal =
                        value === '' ? '' : Number(value);

                    let newPcs = item.pcs;
                    let newFreeQty = item.freeQty;

                    if (numVal === '') {
                        newPcs = '';
                        newFreeQty = 0;
                    } else {
                        if (item.unitMode === 'pcs') {
                            newPcs = numVal;

                            // PCS mode-এ Free Qty 0
                            newFreeQty = 0;
                        } else {
                            newPcs =
                                numVal *
                                (Number(item.pcsPerUnit) || 1);

                            // Unit mode-এ Free Qty
                            newFreeQty =
                                numVal *
                                (Number(item.baseFreeQty) || 0);
                        }
                    }

                    return {
                        ...item,
                        unitQty: value,
                        pcs: newPcs,
                        freeQty: newFreeQty,
                    };
                }

                // ------------------------------------------
                // PCS Change
                // ------------------------------------------
                if (field === 'pcs') {
                    const numVal =
                        value === '' ? '' : Number(value);

                    let newUnitQty = item.unitQty;

                    // PCS mode হলে Unit Qty = PCS
                    if (
                        numVal !== '' &&
                        item.unitMode === 'pcs'
                    ) {
                        newUnitQty = numVal;
                    }

                    return {
                        ...item,
                        pcs: value,
                        unitQty: newUnitQty,
                    };
                }

                // ------------------------------------------
                // PCS Per Unit Change
                // ------------------------------------------
                if (field === 'pcsPerUnit') {
                    let newPcs = item.pcs;

                    if (
                        item.unitMode !== 'pcs' &&
                        item.unitQty !== ''
                    ) {
                        newPcs =
                            Number(item.unitQty) *
                            (value === ''
                                ? 0
                                : Number(value));
                    }

                    return {
                        ...item,
                        pcsPerUnit:
                            value === ''
                                ? ''
                                : Number(value),
                        pcs: newPcs,
                    };
                }

                // ------------------------------------------
                // Free Qty Change
                // ------------------------------------------
                if (field === 'freeQty') {
                    return {
                        ...item,
                        freeQty:
                            value === ''
                                ? ''
                                : Number(value),
                    };
                }

                // ------------------------------------------
                // Other Fields
                // ------------------------------------------
                return {
                    ...item,
                    [field]: value,
                };
            })
        );
    };

    // --------------------------------------------------
    // Unit Toggle
    // --------------------------------------------------
    const handleToggleUnitMode = (uniqueId) => {
        setPurchaseItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) {
                    return item;
                }

                const nextMode =
                    item.unitMode === 'pcs'
                        ? 'main'
                        : 'pcs';

                let newPcs = item.pcs;
                let newFreeQty = item.freeQty;

                if (nextMode === 'pcs') {
                    // PCS mode
                    newFreeQty = 0;

                    if (item.unitQty !== '') {
                        newPcs = Number(item.unitQty);
                    }
                } else {
                    // Unit mode
                    if (item.unitQty !== '') {
                        newPcs =
                            Number(item.unitQty) *
                            (Number(item.pcsPerUnit) || 1);

                        newFreeQty =
                            Number(item.unitQty) *
                            (Number(item.baseFreeQty) || 0);
                    }
                }

                return {
                    ...item,
                    unitMode: nextMode,
                    pcs: newPcs,
                    freeQty: newFreeQty,
                };
            })
        );
    };

    // --------------------------------------------------
    // Added Product IDs
    // --------------------------------------------------
    const addedProductIds = purchaseItems.map(
        (item) => item.productName || item._id
    );

    // --------------------------------------------------
    // Payment Account Type List (Investment থেকে unique accountType)
    // --------------------------------------------------
    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];

    // প্রতিটা account কে unique চেনার জন্য key বানানো (accountType অনুযায়ী)
    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') {
            return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        }
        if (inv.accountType === 'Mobile Banking') {
            return `${inv.accountName}-${inv.accountNumber}`;
        }
        return 'cash';
    };

    // Selected Account Type অনুযায়ী Unique Account গুলো বের করা (duplicate বাদ দিয়ে)
    const uniqueAccountsMap = new Map();
    investments
        .filter((inv) => inv.accountType === paymentAccountType)
        .forEach((inv) => {
            const key = getAccountKey(inv);
            if (!uniqueAccountsMap.has(key)) {
                uniqueAccountsMap.set(key, inv);
            }
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());

    const selectedAccountInfo = uniqueAccounts.find(
        (inv) => getAccountKey(inv) === selectedAccountKey
    );

    // --------------------------------------------------
    // TOTAL CALCULATIONS
    // --------------------------------------------------

    // Product-এর মূল SubTotal
    const subTotal = purchaseItems.reduce((total, item) => {
        const buyPrice = Number(item.buyPrice) || 0;
        const pcs = Number(item.pcs) || 0;

        return total + buyPrice * pcs;
    }, 0);

    // Product Wise Discount
    const productWiseDiscount = purchaseItems.reduce(
        (total, item) => {
            return total + (Number(item.discount) || 0);
        },
        0
    );

    // Adjustment
    const adjustmentValue =
        Number(adjustmentAmount) || 0;

    let payableAmount =
        subTotal -
        productWiseDiscount;

    if (adjustmentType === '+') {
        payableAmount += adjustmentValue;
    } else {
        payableAmount -= adjustmentValue;
    }

    // Payable কখনো negative হবে না
    if (payableAmount < 0) {
        payableAmount = 0;
    }

    // --------------------------------------------------
    // Receive Mode এ Payment Amount লাইভ Payable Amount এর সাথে
    // sync থাকবে, যতক্ষণ না ইউজার নিজে হাতে সেটা edit করছে
    // --------------------------------------------------
    useEffect(() => {
        if (isReceiveMode && !paymentAmountTouched) {
            setPaymentAmount(payableAmount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payableAmount, isReceiveMode, paymentAmountTouched]);

    // --------------------------------------------------
    // Submit
    // --------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();

        // ---------------- Validation ----------------
        if (!purchaseFormData.company) {
            setToast({ show: true, message: 'Company is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!purchaseFormData.date) {
            setToast({ show: true, message: 'Date is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (purchaseItems.length === 0) {
            setToast({ show: true, message: 'Please add at least one product!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        const hasInvalidQty = purchaseItems.some(
            (item) => item.unitQty === '' || Number(item.unitQty) < 1
        );

        if (hasInvalidQty) {
            setToast({ show: true, message: 'Each product must have a minimum quantity of 1!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }
        // ---------------- Validation End ----------------

        const itemsPayload = purchaseItems.map((item) => {
            const rowGrossTotal =
                (Number(item.buyPrice) || 0) * (Number(item.pcs) || 0);
            const rowSubtotal =
                rowGrossTotal - (Number(item.discount) || 0);

            return {
                productId: item.uniqueId,
                productName: item.productName,
                buyPrice: Number(item.buyPrice) || 0,
                sellPrice: Number(item.sellPrice) || 0,
                unit: item.unitMode === 'pcs' ? 'pcs' : (item.unit || 'pcs'),
                qty: item.unitQty,
                pcs: item.pcs,
                freeQty: item.freeQty,
                freeProduct: item.freeProductName || '',
                discount: Number(item.discount) || 0,
                subtotal: rowSubtotal,
            };
        });

        const purchaseData = {
            invoiceNo: isEditMode ? editingPurchase.invoiceNo : generateInvoiceNo(),
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            grandTotal: subTotal,
            productWiseDiscount: productWiseDiscount,

            adjustment: {
                text: adjustmentText,
                amount: adjustmentValue,
                type: adjustmentType,
            },

            payableAmount: payableAmount,

            orderNote: orderNote,
        };

        try {
            const url = isEditMode
                ? `http://localhost:5000/purchase/${editId}`
                : 'http://localhost:5000/purchase';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData),
            });

            if (!res.ok) {
                throw new Error('Failed to save purchase');
            }

            await res.json();

            // Toast দেখাবে
            setToast({
                show: true,
                message: isEditMode
                    ? `Purchase updated successfully! Invoice: ${purchaseData.invoiceNo}`
                    : `Purchase added successfully! Invoice: ${purchaseData.invoiceNo}`,
                isError: false,
            });

            // টেবিল ও ফর্ম রিসেট
            setPurchaseItems([]);
            setAdjustmentText('');
            setAdjustmentAmount(0);
            setAdjustmentType('+');
            setOrderNote('');
            setFormResetKey((prev) => prev + 1);

            // Purchase লিস্টে ফিরে যাবে যাতে fresh data load হয় (রিফ্রেশ লাগবে না)
            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error saving purchase:', error);
            setToast({
                show: true,
                message: isEditMode ? 'Failed to update purchase. Try again.' : 'Failed to save purchase. Try again.',
                isError: true,
            });
            setTimeout(() => {
                setToast({ show: false, message: '', isError: false });
            }, 3000);
        }
    };

    // --------------------------------------------------
    // Receive Submit
    // --------------------------------------------------
    const handleReceiveSubmit = async () => {
        // ---------------- Validation ----------------
        if (paymentAmount === '' || paymentAmount === null) {
            setToast({ show: true, message: 'Payment amount is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!paymentAccountType) {
            setToast({ show: true, message: 'Please select a payment method!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!selectedAccountInfo) {
            setToast({ show: true, message: 'Please select an account!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        const today = new Date();
        const receiveDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

        // Payment Method অনুযায়ী Account Info সাজানো
        let accountInfo = {};
        if (paymentAccountType === 'Bank') {
            accountInfo = {
                bankName: selectedAccountInfo.bankName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
                accountBranch: selectedAccountInfo.accountBranch || '',
            };
        } else if (paymentAccountType === 'Mobile Banking') {
            accountInfo = {
                accountName: selectedAccountInfo.accountName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
            };
        } else {
            accountInfo = {
                accountName: 'Cash',
            };
        }

        const itemsPayload = purchaseItems.map((item) => {
            const rowGrossTotal =
                (Number(item.buyPrice) || 0) * (Number(item.pcs) || 0);
            const rowSubtotal =
                rowGrossTotal - (Number(item.discount) || 0);

            return {
                productId: item.uniqueId,
                productName: item.productName,
                buyPrice: Number(item.buyPrice) || 0,
                sellPrice: Number(item.sellPrice) || 0,
                unit: item.unitMode === 'pcs' ? 'pcs' : (item.unit || 'pcs'),
                qty: item.unitQty,
                pcs: item.pcs,
                freeQty: item.freeQty,
                freeProduct: item.freeProductName || '',
                discount: Number(item.discount) || 0,
                subtotal: rowSubtotal,
            };
        });

        const receiveData = {
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            grandTotal: subTotal,
            productWiseDiscount: productWiseDiscount,

            adjustment: {
                text: adjustmentText,
                amount: adjustmentValue,
                type: adjustmentType,
            },

            payableAmount: payableAmount,
            orderNote: orderNote,

            paidAmount: Number(paymentAmount) || 0,
            receiveDate: receiveDate,
            receiveStatus: 'Received',
            paymentMethod: paymentAccountType,
            paymentAccount: accountInfo,
        };

        try {
            const res = await fetch(`http://localhost:5000/purchase/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receiveData),
            });

            if (!res.ok) {
                throw new Error('Failed to receive purchase');
            }

            await res.json();

            setToast({
                show: true,
                message: 'Payment received successfully!',
                isError: false,
            });

            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error receiving purchase:', error);
            setToast({
                show: true,
                message: 'Failed to receive payment. Try again.',
                isError: true,
            });
            setTimeout(() => {
                setToast({ show: false, message: '', isError: false });
            }, 3000);
        }
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
                Product Select Form
            ----------------------------------------- */}
            <PurchaseForm
                key={formResetKey}
                onAddProduct={handleAddProduct}
                addedProductIds={addedProductIds}
                onFormDataChange={handleFormDataChange}
                initialData={initialFormData}
            />

            {/* -----------------------------------------
                Main Purchase Table
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

                                        <th className="py-3 px-3">
                                            Product Name
                                        </th>

                                        <th className="py-3 px-3">
                                            Company
                                        </th>

                                        <th className="py-3 px-3">
                                            Buy Price
                                        </th>

                                        <th className="py-3 px-3">
                                            Sell Price
                                        </th>

                                        <th className="py-3 px-3">
                                            Unit Qty
                                        </th>

                                        <th className="py-3 px-3">
                                            Pcs
                                        </th>

                                        <th className="py-3 px-3">
                                            Free Qty
                                        </th>

                                        <th className="py-3 px-3">
                                            Discount
                                        </th>

                                        <th className="py-3 px-3">
                                            Subtotal
                                        </th>

                                        <th className="py-3 px-3 text-center">
                                            Action
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 text-sm">

                                    {purchaseItems.length > 0 ? (

                                        purchaseItems.map((item) => {

                                            // Row Subtotal
                                            const rowGrossTotal =
                                                (Number(item.buyPrice) || 0) *
                                                (Number(item.pcs) || 0);

                                            const rowSubtotal =
                                                rowGrossTotal -
                                                (Number(item.discount) || 0);

                                            const currentUnitLabel =
                                                item.unitMode === 'pcs'
                                                    ? 'pcs'
                                                    : item.unit || 'pcs';

                                            // Free Product দেখাবে কিনা
                                            const showFreeName =
                                                item.unitMode !== 'pcs' &&
                                                item.freeProductName &&
                                                Number(item.freeQty) > 0;

                                            return (
                                                <tr
                                                    key={item.uniqueId}
                                                    className="hover:bg-teal-50/40 transition"
                                                >

                                                    {/* Product Name */}
                                                    <td className="py-3 px-3">
                                                        <div className="font-semibold text-slate-800">
                                                            {item.productName}
                                                        </div>

                                                        {showFreeName && (
                                                            <div className="text-xs text-amber-600 italic mt-0.5">
                                                                (Free: {item.freeProductName})
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Company */}
                                                    <td className="py-3 px-3 text-slate-600">
                                                        {item.company}
                                                    </td>

                                                    {/* Buy Price */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.buyPrice}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    item.uniqueId,
                                                                    'buyPrice',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Sell Price */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.sellPrice}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    item.uniqueId,
                                                                    'sellPrice',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Unit Qty */}
                                                    <td className="py-3 px-3">
                                                        <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden w-32">

                                                            <input
                                                                type="number"
                                                                min="0"
                                                                value={item.unitQty}
                                                                onChange={(e) =>
                                                                    handleItemChange(
                                                                        item.uniqueId,
                                                                        'unitQty',
                                                                        e.target.value
                                                                    )
                                                                }
                                                                className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                            />

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleToggleUnitMode(
                                                                        item.uniqueId
                                                                    )
                                                                }
                                                                className="w-18 bg-amber-400 hover:bg-amber-700 text-white text-xs px-2 py-2 text-center font-medium transition cursor-pointer"
                                                                title="Click to toggle unit mode"
                                                            >
                                                                {currentUnitLabel}
                                                            </button>

                                                        </div>
                                                    </td>

                                                    {/* PCS */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.pcs}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    item.uniqueId,
                                                                    'pcs',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Free Qty */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={item.freeQty}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    item.uniqueId,
                                                                    'freeQty',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-20 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Discount */}
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={item.discount}
                                                            onChange={(e) =>
                                                                handleItemChange(
                                                                    item.uniqueId,
                                                                    'discount',
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-24 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>

                                                    {/* Row Subtotal */}
                                                    <td className="py-3 px-3 font-bold text-emerald-700">
                                                        {rowSubtotal.toFixed(2)}
                                                    </td>

                                                    {/* Action */}
                                                    <td className="py-3 px-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleRemoveItem(
                                                                    item.uniqueId
                                                                )
                                                            }
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
                                                Please select a company
                                                and product above.
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

                                    <input
                                        type="text"
                                        readOnly
                                        value={productWiseDiscount.toFixed(2)}
                                        className="flex-1 px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm outline-none"
                                    />
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
                                            onChange={(e) =>
                                                setAdjustmentText(e.target.value)
                                            }
                                            className="flex-1 min-w-0 px-3 py-2 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {/* Adjustment Amount */}
                                        <input
                                            type="number"
                                            min="0"
                                            value={adjustmentAmount}
                                            onChange={(e) =>
                                                setAdjustmentAmount(e.target.value)
                                            }
                                            className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-white text-sm outline-none focus:bg-teal-50/30"
                                        />

                                        {/* Adjustment Type */}
                                        <select
                                            value={adjustmentType}
                                            onChange={(e) =>
                                                setAdjustmentType(e.target.value)
                                            }
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
                                placeholder="Write any note about this purchase..."
                                value={orderNote}
                                onChange={(e) =>
                                    setOrderNote(e.target.value)
                                }
                                className="w-full  px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-y shadow-sm"
                            />

                        </div>

                        {/* =================================
                            PAYMENT (Receive Mode Only)
                        ================================= */}
                        {isReceiveMode && (
                            <div className="mt-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                                <h3 className="text-base font-bold text-emerald-800 mb-4">Payment</h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                    {/* Payment Amount */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Payment Amount <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            value={paymentAmount}
                                            onChange={(e) => {
                                                setPaymentAmount(e.target.value);
                                                setPaymentAmountTouched(true);
                                            }}
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                                        />
                                    </div>

                                    {/* Payment Method */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Payment Method <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={paymentAccountType}
                                            onChange={(e) => {
                                                setPaymentAccountType(e.target.value);
                                                setSelectedAccountKey('');
                                            }}
                                            className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm cursor-pointer"
                                        >
                                            <option value="">Select method...</option>
                                            {accountTypes.map((type) => (
                                                <option key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Account Selection */}
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Account <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={selectedAccountKey}
                                            onChange={(e) => setSelectedAccountKey(e.target.value)}
                                            disabled={!paymentAccountType}
                                            className={`w-full px-4 py-3.5 rounded-2xl border text-sm outline-none shadow-sm ${paymentAccountType
                                                ? 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer'
                                                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                        >
                                            <option value="">
                                                {paymentAccountType ? 'Select account...' : 'Select method first'}
                                            </option>
                                            {uniqueAccounts.map((inv) => {
                                                const key = getAccountKey(inv);
                                                const label =
                                                    inv.accountType === 'Bank'
                                                        ? `${inv.bankName} - ${inv.accountNumber} (${inv.accountBranch})`
                                                        : inv.accountType === 'Mobile Banking'
                                                            ? `${inv.accountName} - ${inv.accountNumber}`
                                                            : 'Cash';
                                                return (
                                                    <option key={key} value={key}>{label}</option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* =================================
                            SUBMIT / RECEIVE BUTTON
                        ================================= */}
                        <div className="mt-6 flex justify-end">

                            {isReceiveMode ? (
                                <button
                                    type="button"
                                    onClick={handleReceiveSubmit}
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition cursor-pointer"
                                >
                                    Receive
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-sm font-semibold text-white shadow-md shadow-teal-200 transition cursor-pointer"
                                >
                                    {isEditMode ? 'Update Purchase' : 'Purchase'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PurchaseAdd;