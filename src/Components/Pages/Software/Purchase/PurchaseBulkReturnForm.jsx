import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

const getFormattedToday = () =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const generateInvoiceNo = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yy}${mm}${dd}${hh}${min}${ss}`;
};

const PurchaseBulkReturnForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingReturn = location.state?.bulkReturn || null;
    const isEditMode = !!editingReturn;
    const editId = editingReturn?._id || null;

    const [formData, setFormData] = useState({
        company: editingReturn?.company || '',
        companyContact: editingReturn?.phone || '',
        companyAddress: editingReturn?.address || '',
        category: editingReturn?.category || '',
        date: editingReturn?.returnDate || getFormattedToday(),
    });

    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    const [companySearch, setCompanySearch] = useState(editingReturn?.company || '');
    const [categorySearch, setCategorySearch] = useState(editingReturn?.category || '');
    const [productSearch, setProductSearch] = useState('');

    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editingReturn?.note || '');

    const [toast, setToast] = useState({ show: false, message: '', isError: false });
    const [isSaving, setIsSaving] = useState(false);
    const [stockMap, setStockMap] = useState(null);

    // ---------------- Payment (optional, default collapsed) ----------------
    const savedPay = editingReturn?.payment || null;
    const [investments, setInvestments] = useState([]);
    const [paymentOpen, setPaymentOpen] = useState(!!savedPay);
    const [paymentAmount, setPaymentAmount] = useState(savedPay?.amount ?? '');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(!!savedPay);
    const [paymentAccountType, setPaymentAccountType] = useState(savedPay?.method || '');
    const [selectedAccountKey, setSelectedAccountKey] = useState(() => {
        if (!savedPay) return '';
        const a = savedPay.account || {};
        if (savedPay.method === 'Bank') return `${a.bankName}-${a.accountNumber}-${a.accountBranch}`;
        if (savedPay.method === 'Mobile Banking') return `${a.accountName}-${a.accountNumber}`;
        return 'cash';
    });
    const [paymentNote, setPaymentNote] = useState(savedPay?.note || '');

    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/investment')
            .then((res) => res.json())
            .then((data) => setInvestments(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching investments:', error));
    }, []);

    const companyRef = useRef(null);
    const categoryRef = useRef(null);
    const productRef = useRef(null);
    const dateInputRef = useRef(null);

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
    };

    // ---------- Fetch ----------
    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/company')
            .then((r) => r.json())
            .then((d) => setCompanies(Array.isArray(d) ? d : []))
            .catch((e) => console.error(e));
        fetch('https://squirrel-peace-server.onrender.com/category')
            .then((r) => r.json())
            .then((d) => setCategories(Array.isArray(d) ? d.filter((c) => c.isActive === true) : []))
            .catch((e) => console.error(e));
        fetch('https://squirrel-peace-server.onrender.com/product')
            .then((r) => r.json())
            .then((d) => setProducts(Array.isArray(d) ? d : []))
            .catch((e) => console.error(e));
        fetch(`https://squirrel-peace-server.onrender.com/bulk-return-stock${isEditMode ? `?excludeId=${editId}` : ''}`)
            .then((r) => r.json())
            .then((d) => setStockMap(d && typeof d === 'object' ? d : {}))
            .catch((e) => console.error(e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Edit mode prefill ----------
    useEffect(() => {
        if (editingReturn) {
            const mapped = (editingReturn.items || []).map((it, index) => ({
                uniqueId: `${it.productId || 'item'}-${index}-${Date.now()}`,
                _id: it.productId,
                productName: it.productName,
                company: editingReturn.company || '',
                buyPrice: Number(it.buyPrice) || 0,
                sellPrice: Number(it.sellPrice) || 0,
                unit: it.unit || 'Pcs',
                parentMode: it.parentMode === true,
                subUnit: it.subUnit || '',
                pcsPerUnit: Number(it.pcsPerUnit) || 1,
                pcsPerSub: Number(it.pcsPerSub) || 0,
                unitQty: Number(it.unitQty) || '',
                subQty: Number(it.subQty) || '',
                pcsQty: Number(it.pcsQty) || '',
                freeUnitQty: Number(it.freeUnitQty) || '',
                freeSubQty: Number(it.freeSubQty) || '',
                freePcsQty: Number(it.freePcsQty) || '',
                totalQty: Number(it.totalPcs) || 0,
                freeQty: Number(it.freeTotalQty) || 0,
                borrowMain: it.borrowMain === true,
                borrowFree: it.borrowFree === true,
            }));
            setItems(mapped);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Outside click ----------
    useEffect(() => {
        const handler = (e) => {
            if (companyRef.current && !companyRef.current.contains(e.target)) setIsCompanyOpen(false);
            if (categoryRef.current && !categoryRef.current.contains(e.target)) setIsCategoryOpen(false);
            if (productRef.current && !productRef.current.contains(e.target)) setIsProductOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ---------- Company ----------
    const filteredCompanies = companies.filter((c) => {
        const q = companySearch.toLowerCase();
        return (
            c.businessName?.toLowerCase().includes(q) ||
            c.contactNumber?.toLowerCase().includes(q) ||
            c.address?.toLowerCase().includes(q)
        );
    });

    const handleSelectCompany = (comp) => {
        setFormData((p) => ({
            ...p,
            company: comp.businessName,
            companyContact: comp.contactNumber || '',
            companyAddress: comp.address || '',
        }));
        setCompanySearch(comp.businessName);
        setProductSearch('');
        setIsCompanyOpen(false);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setCompanySearch('');
        setFormData((p) => ({ ...p, company: '', companyContact: '', companyAddress: '' }));
        setProductSearch('');
        setItems([]);
        setIsCompanyOpen(false);
    };

    // ---------- Category ----------
    const filteredCategories = categories.filter((c) =>
        c.name?.toLowerCase().includes(categorySearch.toLowerCase())
    );

    const handleSelectCategory = (cat) => {
        setFormData((p) => ({ ...p, category: cat.name }));
        setCategorySearch(cat.name);
        setProductSearch('');
        setIsCategoryOpen(false);
    };

    const handleClearCategory = (e) => {
        e.stopPropagation();
        setCategorySearch('');
        setFormData((p) => ({ ...p, category: '' }));
        setProductSearch('');
        setIsCategoryOpen(false);
    };

    // ---------- Date ----------
    const handleDateChange = (e) => {
        const raw = e.target.value;
        if (raw) {
            const [y, m, d] = raw.split('-');
            const formatted = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            setFormData((p) => ({ ...p, date: formatted }));
        }
    };

    // ---------- Product ----------
    const addedNames = items.map((i) => i.productName);
    const filteredProducts = products.filter((prod) => {
        if (!formData.company) return false;
        if (!prod.productName || !prod.company) return false;
        if (prod.isActive === false) return false;
        if (prod.company !== formData.company) return false;
        if (formData.category && prod.category !== formData.category) return false;
        if (addedNames.includes(prod.productName)) return false;
        const q = productSearch.toLowerCase();
        return prod.productName?.toLowerCase().includes(q) || prod.sku?.toLowerCase().includes(q);
    });

    const handleSelectProduct = (product) => {
        const isParent = product.parentUnitUse === true;
        const newItem = {
            uniqueId: Date.now() + Math.random(),
            _id: product._id,
            productName: product.productName || '',
            company: product.company || '',
            buyPrice: Number(product.purchasePrice) || 0,
            sellPrice: Number(product.sellingPrice) || 0,
            unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
            parentMode: isParent,
            subUnit: isParent ? product.subUnit : '',
            pcsPerUnit: Number(product.pcsOfUnit) || 1,
            pcsPerSub: isParent ? (Number(product.subUnitQty) || 1) : 0,
            unitQty: '',
            subQty: '',
            pcsQty: '',
            freeUnitQty: '',
            freeSubQty: '',
            freePcsQty: '',
            totalQty: 0,
            freeQty: 0,
            borrowMain: false,
            borrowFree: false,
        };
        setItems((prev) => [...prev, newItem]);
        setProductSearch('');
        setIsProductOpen(false);
    };

    const handleRemoveItem = (uniqueId) =>
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));

    const getStock = (item) =>
        stockMap
            ? stockMap[String(item._id)] || stockMap[`name:${item.productName}`] || { paid: 0, free: 0 }
            : null;

    // main/free ghatti hole onno pool theke koto nite hobe
    const calcBorrow = (it) => {
        const st = getStock(it);
        if (!st) return { mainFromFree: 0, freeFromMain: 0 };
        const mainShort = Math.max((Number(it.totalQty) || 0) - st.paid, 0);
        const freeShort = Math.max((Number(it.freeQty) || 0) - st.free, 0);
        return {
            mainFromFree: it.borrowMain ? mainShort : 0,
            freeFromMain: it.borrowFree ? freeShort : 0,
        };
    };

    // stock thik ache kina check (error message return kore, thik thakle null)
    const checkStock = (it) => {
        const st = getStock(it);
        if (!st) return null;
        const total = Number(it.totalQty) || 0;
        const free = Number(it.freeQty) || 0;
        const mainShort = Math.max(total - st.paid, 0);
        const freeShort = Math.max(free - st.free, 0);
        const surplusFree = Math.max(st.free - free, 0);
        const surplusPaid = Math.max(st.paid - total, 0);
        if (mainShort > 0) {
            if (!it.borrowMain) return `Main stock e matro ${st.paid} pcs ache! Free theke nite "Free +" click korun.`;
            if (surplusFree < mainShort) return `Main er jonno Free soho matro ${st.paid + surplusFree} pcs ache!`;
        }
        if (freeShort > 0) {
            if (!it.borrowFree) return `Free stock e matro ${st.free} pcs ache! Main theke nite "Main +" click korun.`;
            if (surplusPaid < freeShort) return `Free er jonno Main soho matro ${st.free + surplusPaid} pcs ache!`;
        }
        return null;
    };

    const handleToggleBorrow = (uniqueId, field) => {
        const item = items.find((i) => i.uniqueId === uniqueId);
        if (!item) return;
        const next = { ...item, [field]: !item[field] };
        if (item[field]) {
            if (checkStock(next)) return showToast('Age quantity komiye nin, tarpor off korun!', true);
        }
        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
    };

    const handleItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        const item = items.find((i) => i.uniqueId === uniqueId);
        if (!item) return;

        const numFields = ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'];
        const next = {
            ...item,
            [field]: numFields.includes(field) ? (value === '' ? '' : Number(value) || 0) : value,
        };
        const ppu = Number(next.pcsPerUnit) || 1;
        const pps = Number(next.pcsPerSub) || 0;
        next.totalQty =
            (Number(next.unitQty) || 0) * ppu +
            (Number(next.subQty) || 0) * pps +
            (Number(next.pcsQty) || 0);
        next.freeQty =
            (Number(next.freeUnitQty) || 0) * ppu +
            (Number(next.freeSubQty) || 0) * pps +
            (Number(next.freePcsQty) || 0);

        if (numFields.includes(field)) {
            const msg = checkStock(next);
            if (msg) return showToast(msg, true);
        }

        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
    };

    // ---------- Totals ----------
    const subTotal = roundTo2(
        items.reduce((t, i) => t + (Number(i.buyPrice) || 0) * (Number(i.totalQty) || 0), 0)
    );
    const returnAmount = subTotal;

    // ---------- Payment helpers ----------
    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];

    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        if (inv.accountType === 'Mobile Banking') return `${inv.accountName}-${inv.accountNumber}`;
        return 'cash';
    };

    const uniqueAccountsMap = new Map();
    investments
        .filter((inv) => inv.accountType === paymentAccountType)
        .forEach((inv) => {
            const key = getAccountKey(inv);
            if (!uniqueAccountsMap.has(key)) uniqueAccountsMap.set(key, inv);
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());
    const selectedAccountInfo = uniqueAccounts.find((inv) => getAccountKey(inv) === selectedAccountKey);

    // User nijer hate change na korle Payment Amount = Return Amount auto sync
    useEffect(() => {
        if (!paymentAmountTouched) {
            setPaymentAmount(roundTo2(returnAmount));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [returnAmount, paymentAmountTouched]);

    // ---------- Submit ----------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;

        if (!formData.company) return showToast('Company is required!', true);
        if (!formData.date) return showToast('Date is required!', true);
        if (items.length === 0) return showToast('Please add at least one product!', true);
        if (items.some((i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0)) {
            return showToast('Each product must have a valid quantity!', true);
        }

        // ---------- Payment validation (shudhu Payment open thakle) ----------
        let paymentData = null;
        if (paymentOpen) {
            if (paymentAmount === '' || paymentAmount === null) {
                return showToast('Payment amount is required! (or close Payment)', true);
            }
            if (!paymentAccountType) {
                return showToast('Please select a payment method! (or close Payment)', true);
            }
            if (!selectedAccountInfo) {
                return showToast('Please select an account! (or close Payment)', true);
            }
            let accInfo = {};
            if (paymentAccountType === 'Bank') {
                accInfo = {
                    bankName: selectedAccountInfo.bankName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                    accountBranch: selectedAccountInfo.accountBranch || '',
                };
            } else if (paymentAccountType === 'Mobile Banking') {
                accInfo = {
                    accountName: selectedAccountInfo.accountName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                };
            } else {
                accInfo = { accountName: 'Cash' };
            }
            paymentData = {
                amount: roundTo2(paymentAmount),
                method: paymentAccountType,
                account: accInfo,
                note: paymentNote,
            };
        }

        const itemsPayload = items.map((i) => ({
            productId: i._id,
            productName: i.productName,
            buyPrice: roundTo2(i.buyPrice),
            sellPrice: roundTo2(i.sellPrice),
            unit: i.unit || 'Pcs',
            parentMode: i.parentMode === true,
            borrowMain: i.borrowMain === true,
            borrowFree: i.borrowFree === true,
            mainFromFree: calcBorrow(i).mainFromFree,
            freeFromMain: calcBorrow(i).freeFromMain,
            subUnit: i.subUnit || '',
            pcsPerUnit: Number(i.pcsPerUnit) || 1,
            pcsPerSub: Number(i.pcsPerSub) || 0,
            unitQty: Number(i.unitQty) || 0,
            subQty: Number(i.subQty) || 0,
            pcsQty: Number(i.pcsQty) || 0,
            totalPcs: Number(i.totalQty) || 0,
            freeUnitQty: Number(i.freeUnitQty) || 0,
            freeSubQty: Number(i.freeSubQty) || 0,
            freePcsQty: Number(i.freePcsQty) || 0,
            freeTotalQty: Number(i.freeQty) || 0,
            itemTotal: roundTo2((Number(i.buyPrice) || 0) * (Number(i.totalQty) || 0)),
        }));

        const payload = {
            invoiceNo: isEditMode ? editingReturn.invoiceNo : generateInvoiceNo(),
            company: formData.company,
            phone: formData.companyContact,
            address: formData.companyAddress,
            category: formData.category,
            returnDate: formData.date,
            items: itemsPayload,
            returnAmount,
            note,
            payment: paymentData,
        };

        try {
            setIsSaving(true);
            const url = isEditMode
                ? `https://squirrel-peace-server.onrender.com/purchase-bulk-return/${editId}`
                : 'https://squirrel-peace-server.onrender.com/purchase-bulk-return';
            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (err.shortages?.length) {
                    setIsSaving(false);
                    return showToast(
                        `Stock nai: ${err.shortages.map((s) => `${s.productName} (stock ${s.available})`).join(', ')}`,
                        true
                    );
                }
                throw new Error('Failed');
            }
            await res.json();
            showToast(isEditMode ? 'Bulk return updated successfully!' : 'Bulk return added successfully!');
            setTimeout(() => navigate('/purchase-bulk-return', { replace: true, state: null }), 1000);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save bulk return. Try again.', true);
        }
    };

    const inputCls =
        'w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-700 shadow-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100';

    return (
        <div>
            {toast.show && (
                <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white ${toast.isError ? 'bg-rose-600' : 'bg-gradient-to-br from-teal-600 to-emerald-500'}`}>
                    {toast.message}
                </div>
            )}

            {/* ---------------- Top Form ---------------- */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 my-8 relative z-20">
                <div className="bg-white rounded-3xl shadow-lg shadow-teal-900/5 p-6 md:p-8 border border-teal-100/70">
                    <div className="mb-6 pb-4 border-b border-teal-100">
                        <h3 className="text-xl font-bold text-slate-800">
                            {isEditMode ? 'Edit Purchase Bulk Return' : 'Purchase Bulk Return'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Select company and products to return in bulk</p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Company */}
                            <div className="relative" ref={companyRef}>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Company <span className="text-rose-500">*</span></label>
                                <div
                                    onClick={() => !isEditMode && setIsCompanyOpen(true)}
                                    className={`w-full px-4 py-3.5 rounded-2xl border text-sm shadow-sm flex items-center justify-between ${isEditMode ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed opacity-75' : 'border-slate-200 bg-slate-50/70 cursor-pointer focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100'}`}
                                >
                                    <input
                                        type="text"
                                        disabled={isEditMode}
                                        placeholder="Search or select company..."
                                        value={companySearch}
                                        onChange={(e) => {
                                            setCompanySearch(e.target.value);
                                            setIsCompanyOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-sm"
                                    />
                                    {companySearch && !isEditMode && (
                                        <button type="button" onClick={handleClearCompany} className="text-slate-400 hover:text-rose-500 p-0.5">✕</button>
                                    )}
                                </div>
                                {isCompanyOpen && !isEditMode && (
                                    <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-60 overflow-y-auto">
                                        {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map((comp) => (
                                                <div key={comp._id} onClick={() => handleSelectCompany(comp)} className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 last:border-none">
                                                    <p className="text-sm font-semibold text-slate-800">{comp.businessName}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">📞 {comp.contactNumber} | 📍 {comp.address}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-slate-400 text-center">No company found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Category */}
                            <div className="relative" ref={categoryRef}>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                                <div
                                    onClick={() => setIsCategoryOpen(true)}
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm shadow-sm cursor-pointer flex items-center justify-between focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select category..."
                                        value={categorySearch}
                                        onChange={(e) => {
                                            setCategorySearch(e.target.value);
                                            setFormData((p) => ({ ...p, category: e.target.value }));
                                            setIsCategoryOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-sm"
                                    />
                                    {categorySearch && (
                                        <button type="button" onClick={handleClearCategory} className="text-slate-400 hover:text-rose-500 p-0.5">✕</button>
                                    )}
                                </div>
                                {isCategoryOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-60 overflow-y-auto">
                                        {filteredCategories.length > 0 ? (
                                            filteredCategories.map((cat) => (
                                                <div key={cat._id} onClick={() => handleSelectCategory(cat)} className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 last:border-none">
                                                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-3 text-sm text-slate-400 text-center">No active category found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Date <span className="text-rose-500">*</span></label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                                >
                                    <input ref={dateInputRef} type="date" onChange={handleDateChange} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                                    <input type="text" readOnly value={formData.date} placeholder="Select date" className={`${inputCls} cursor-pointer pointer-events-none`} />
                                </div>
                            </div>
                        </div>

                        {/* Select Product */}
                        <div className="relative" ref={productRef}>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Select Product <span className="text-rose-500">*</span>{' '}
                                {!formData.company && <span className="text-xs text-amber-500 font-normal">(Please select a company first)</span>}
                            </label>
                            <div
                                onClick={() => formData.company && setIsProductOpen(true)}
                                className={`w-full px-4 py-3.5 rounded-2xl border text-sm shadow-sm flex items-center justify-between ${formData.company ? 'border-slate-200 bg-slate-50/70 cursor-pointer focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'}`}
                            >
                                <input
                                    type="text"
                                    disabled={!formData.company}
                                    placeholder={formData.company ? 'Search or select product...' : 'Select a company first...'}
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setIsProductOpen(true);
                                    }}
                                    className="bg-transparent outline-none w-full text-sm"
                                />
                                {productSearch && formData.company && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); setProductSearch(''); }} className="text-slate-400 hover:text-rose-500 p-0.5">✕</button>
                                )}
                            </div>
                            {isProductOpen && formData.company && (
                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-60 overflow-y-auto">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((prod) => (
                                            <div key={prod._id} onClick={() => handleSelectProduct(prod)} className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 last:border-none flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">
                                                        Company: {prod.company}{prod.category ? ` | Category: ${prod.category}` : ''}
                                                    </p>
                                                </div>
                                                {prod.sku && (
                                                    <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium border border-amber-100">SKU: {prod.sku}</span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-400 text-center">No matching product found for this company</div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ---------------- Table + Summary ---------------- */}
            <div className="w-full px-0 sm:px-1 my-6 relative z-0">
                <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 p-6 md:p-8 border border-teal-100/70">
                    <form onSubmit={handleSubmit}>
                        <div className="rounded-2xl border border-teal-100">
                            <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                <colgroup>
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '16%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '16%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '5%' }} />
                                </colgroup>
                                <thead>
                                    <tr className="bg-teal-50/60 border-b-2 border-teal-100 text-xs font-semibold text-teal-800">
                                        <th className="py-3 px-3">Product Name</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Buy Price</th>
                                        <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                        <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                        <th className="py-3 pl-4 pr-1">Free Unit</th>
                                        <th className="py-3 pl-3 pr-2">Free PCS</th>
                                        <th className="py-3 px-3">Item Total</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {items.length > 0 ? (
                                        items.map((item) => {
                                            const rowSubtotal = roundTo2((Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0));
                                            return (
                                                <tr key={item.uniqueId} className="hover:bg-teal-50/40 transition">
                                                    <td className="py-3 px-3 font-semibold text-slate-800">{item.productName}</td>
                                                    <td className="py-3 px-3 text-slate-600">{item.company}</td>
                                                    <td className="py-3 px-3">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            value={item.buyPrice}
                                                            onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && handleItemChange(item.uniqueId, 'buyPrice', e.target.value)}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                        />
                                                    </td>
                                                    {/* Unit Qty */}
                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.totalQty) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {item.totalQty} | Stock: {getStock(item) ? getStock(item).paid - calcBorrow(item).freeFromMain : '...'}
                                                            {calcBorrow(item).mainFromFree > 0 && (
                                                                <span className="ml-1 text-amber-600">(Free theke: {calcBorrow(item).mainFromFree})</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleBorrow(item.uniqueId, 'borrowMain')}
                                                                className={`pointer-events-auto ml-1.5 px-1.5 rounded-full text-[9px] font-extrabold cursor-pointer ${item.borrowMain ? 'bg-amber-500 text-white' : 'bg-white border border-indigo-300 text-indigo-600 hover:bg-indigo-500 hover:text-white'}`}
                                                            >
                                                                Free {item.borrowMain ? '✓' : '+'}
                                                            </button>
                                                        </div>
                                                        <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl">
                                                            <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                <input
                                                                    type="number" min="0" step="1" placeholder="0"
                                                                    value={item.unitQty}
                                                                    onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'unitQty', e.target.value)}
                                                                    className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                />
                                                                <span className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate">
                                                                    {item.unit || 'Pcs'}
                                                                </span>
                                                            </div>
                                                            {item.parentMode && (
                                                                <div className="mt-1.5 flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                    <input
                                                                        type="number" min="0" step="1" placeholder="0"
                                                                        value={item.subQty ?? ''}
                                                                        onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'subQty', e.target.value)}
                                                                        className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                    />
                                                                    <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate">
                                                                        {item.subUnit}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* PCS Qty */}
                                                    <td className="py-3 pl-0 pr-2">
                                                        <div className="p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl">
                                                            <input
                                                                type="number" min="0" step="1" placeholder="0"
                                                                value={item.pcsQty}
                                                                onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'pcsQty', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Free Unit */}
                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {item.freeQty} | Stock: {getStock(item) ? getStock(item).free - calcBorrow(item).mainFromFree : '...'}
                                                            {calcBorrow(item).freeFromMain > 0 && (
                                                                <span className="ml-1 text-amber-600">(Main theke: {calcBorrow(item).freeFromMain})</span>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleBorrow(item.uniqueId, 'borrowFree')}
                                                                className={`pointer-events-auto ml-1.5 px-1.5 rounded-full text-[9px] font-extrabold cursor-pointer ${item.borrowFree ? 'bg-amber-500 text-white' : 'bg-white border border-emerald-300 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                                                            >
                                                                Main {item.borrowFree ? '✓' : '+'}
                                                            </button>
                                                        </div>
                                                        <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                            <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                <input
                                                                    type="number" min="0" step="1" placeholder="0"
                                                                    value={item.freeUnitQty}
                                                                    onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'freeUnitQty', e.target.value)}
                                                                    className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                />
                                                                <span className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate">
                                                                    {item.unit || 'Pcs'}
                                                                </span>
                                                            </div>
                                                            {item.parentMode && (
                                                                <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                    <input
                                                                        type="number" min="0" step="1" placeholder="0"
                                                                        value={item.freeSubQty ?? ''}
                                                                        onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'freeSubQty', e.target.value)}
                                                                        className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                    />
                                                                    <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate">
                                                                        {item.subUnit}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Free PCS */}
                                                    <td className="py-3 pl-0 pr-2">
                                                        <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                            <input
                                                                type="number" min="0" step="1" placeholder="0"
                                                                value={item.freePcsQty}
                                                                onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'freePcsQty', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-3 font-bold text-emerald-700">{rowSubtotal.toFixed(2)}</td>

                                                    <td className="py-3 px-3 text-center">
                                                        <button type="button" onClick={() => handleRemoveItem(item.uniqueId)} className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="9" className="text-center py-8 text-slate-400 text-sm">
                                                No products added yet. Please select a company and product above.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="mt-6 flex justify-end">
                            <div className="w-full md:w-[700px] space-y-2.5 bg-teal-50/40 border border-teal-100 rounded-2xl p-5">
                                <div className="flex items-center">
                                    <label className="w-56 text-right pr-3 text-sm font-bold text-teal-800">Return Amount</label>
                                    <input type="text" readOnly value={returnAmount.toFixed(2)} className="flex-1 px-3 py-2.5 border border-teal-200 bg-white font-bold text-emerald-700 text-base rounded-lg outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Return Payment (Optional, default collapsed) */}
                        <div className="mt-8">
                            <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-base font-bold text-emerald-800">Return Payment</h3>
                                        <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                                            Return Amount: ৳{returnAmount.toFixed(2)}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentOpen((prev) => !prev)}
                                        className="flex items-center gap-2 text-xs font-semibold text-emerald-700 cursor-pointer"
                                    >
                                        {paymentOpen ? 'Enabled' : 'Disabled'}
                                        <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${paymentOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                            <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${paymentOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </span>
                                    </button>
                                </div>

                                {paymentOpen && (
                                    <div className="mt-5">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Payment Amount <span className="text-rose-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={paymentAmount}
                                                    onChange={(e) => {
                                                        const value = e.target.value;
                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                            setPaymentAmount(value);
                                                            setPaymentAmountTouched(true);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Payment Method <span className="text-rose-500">*</span>
                                                </label>
                                                <select
                                                    value={paymentAccountType}
                                                    onChange={(e) => {
                                                        setPaymentAccountType(e.target.value);
                                                        setSelectedAccountKey(
                                                            e.target.value && e.target.value !== 'Bank' && e.target.value !== 'Mobile Banking'
                                                                ? 'cash'
                                                                : ''
                                                        );
                                                    }}
                                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm cursor-pointer"
                                                >
                                                    <option value="">Select method...</option>
                                                    {accountTypes.map((type) => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            </div>

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
                                                        return <option key={key} value={key}>{label}</option>;
                                                    })}
                                                </select>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Payment Note <span className="text-slate-400 font-normal">(Optional)</span>
                                            </label>
                                            <textarea
                                                rows="2"
                                                placeholder="Write any note about this payment..."
                                                value={paymentNote}
                                                onChange={(e) => setPaymentNote(e.target.value)}
                                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-y shadow-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Note */}
                        <div className="mt-8">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Note</label>
                            <textarea
                                rows="3"
                                placeholder="Write any note about this return..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-y shadow-sm"
                            />
                        </div>

                        {/* Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-10 py-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-sm font-semibold text-white shadow-md shadow-teal-200 transition cursor-pointer disabled:opacity-60"
                            >
                                {isEditMode ? 'Update Bulk Return' : 'Bulk Return'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PurchaseBulkReturnForm;