import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useCan from '../../../../hooks/useCan';
import toast from 'react-hot-toast';
import { DateInput } from '../Product/ProductUi';
import { inputCls, labelCls, ComboField } from './PurchaseUi';
import { Card, QtyField, PaymentSection } from './PurchaseFormUi';
import { labelToISO } from './purchaseDate';

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
    const { canAdd: canAddBulk, canEdit: canEditBulk } = useCan('purchase_bulk_return');
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

    const setToast = () => { };
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
        fetch('http://localhost:5000/investment')
            .then((res) => res.json())
            .then((data) => setInvestments(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching investments:', error));
    }, []);

    const companyRef = useRef(null);
    const categoryRef = useRef(null);
    const productRef = useRef(null);
    const dateInputRef = useRef(null);

    const showToast = (message, isError = false) => {
        isError ? toast.error(message) : toast.success(message);
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
    };

    // ---------- Fetch ----------
    useEffect(() => {
        fetch('http://localhost:5000/company')
            .then((r) => r.json())
            .then((d) => setCompanies(Array.isArray(d) ? d : []))
            .catch((e) => console.error(e));
        fetch('http://localhost:5000/category')
            .then((r) => r.json())
            .then((d) => setCategories(Array.isArray(d) ? d.filter((c) => c.isActive === true) : []))
            .catch((e) => console.error(e));
        fetch('http://localhost:5000/product')
            .then((r) => r.json())
            .then((d) => setProducts(Array.isArray(d) ? d : []))
            .catch((e) => console.error(e));
        fetch(`http://localhost:5000/bulk-return-stock${isEditMode ? `?excludeId=${editId}` : ''}`)
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
        if (isEditMode ? !canEditBulk : !canAddBulk) {
            return showToast('আপনার Add / Edit / Delete করার অনুমতি নেই!', true);
        }

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
            if (!(Number(paymentAmount) > 0)) {
                return showToast('Payment amount must be greater than 0! (or close Payment)', true);
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
                ? `http://localhost:5000/purchase-bulk-return/${editId}`
                : 'http://localhost:5000/purchase-bulk-return';
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

    const clearCompany = () => {
        setCompanySearch('');
        setFormData((p) => ({ ...p, company: '', companyContact: '', companyAddress: '' }));
        setProductSearch('');
        setItems([]);
    };
    const clearCategory = () => {
        setCategorySearch('');
        setFormData((p) => ({ ...p, category: '' }));
        setProductSearch('');
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-4">
                {/* Top form */}
                <div className="relative z-20">
                    <Card
                        title={isEditMode ? 'Edit Purchase Bulk Return' : 'Purchase Bulk Return'}
                        subtitle="Select company and products to return in bulk"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {isEditMode ? (
                                <div>
                                    <span className={labelCls}>Company *</span>
                                    <input readOnly disabled value={companySearch} className={inputCls} />
                                </div>
                            ) : (
                                <ComboField
                                    label="Company *"
                                    value={companySearch}
                                    placeholder="Search or select company..."
                                    options={filteredCompanies.map((c) => ({
                                        key: c._id,
                                        title: c.businessName,
                                        sub: `📞 ${c.contactNumber || ''} | 📍 ${c.address || ''}`,
                                        raw: c,
                                    }))}
                                    onType={(v) => setCompanySearch(v)}
                                    onClear={clearCompany}
                                    onPick={(o) => handleSelectCompany(o.raw)}
                                />
                            )}

                            <ComboField
                                label="Category"
                                value={categorySearch}
                                placeholder="Search or select category..."
                                options={filteredCategories.map((c) => ({ key: c._id, title: c.name, raw: c }))}
                                onType={(v) => {
                                    setCategorySearch(v);
                                    setFormData((p) => ({ ...p, category: v }));
                                }}
                                onClear={clearCategory}
                                onPick={(o) => handleSelectCategory(o.raw)}
                            />

                            <div>
                                <span className={labelCls}>Date *</span>
                                <DateInput name="date" value={labelToISO(formData.date)} onChange={handleDateChange} placeholder="Select date" />
                            </div>
                        </div>

                        <div className="mt-4">
                            {formData.company ? (
                                <ComboField
                                    label="Select Product *"
                                    value={productSearch}
                                    placeholder="Search or select product..."
                                    options={filteredProducts.map((p) => ({
                                        key: p._id,
                                        title: p.productName,
                                        sub: `Company: ${p.company}${p.category ? ` | Category: ${p.category}` : ''}${p.sku ? ` | SKU: ${p.sku}` : ''}`,
                                        raw: p,
                                    }))}
                                    onType={(v) => setProductSearch(v)}
                                    onClear={() => setProductSearch('')}
                                    onPick={(o) => handleSelectProduct(o.raw)}
                                />
                            ) : (
                                <div>
                                    <span className={labelCls}>Select Product *</span>
                                    <input disabled placeholder="Select a company first..." className={inputCls} />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Items */}
                    {items.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                            No products added yet. Please select a company and product above.
                        </div>
                    ) : (
                        items.map((item) => {
                            const st = getStock(item);
                            const b = calcBorrow(item);
                            const rowSubtotal = roundTo2((Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0));
                            const num = (field) => (v) => /^\d*$/.test(v) && handleItemChange(item.uniqueId, field, v);
                            return (
                                <div key={item.uniqueId} className="bg-white rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                                            <p className="text-xs text-slate-500">{item.company}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[11px] text-slate-400">Item Total</p>
                                                <p className="font-bold text-emerald-700">{rowSubtotal.toFixed(2)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label="Remove product"
                                                onClick={() => handleRemoveItem(item.uniqueId)}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-[160px_1fr_1fr] gap-3">
                                        <div>
                                            <label className={labelCls}>Buy Price</label>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.01"
                                                value={item.buyPrice}
                                                onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && handleItemChange(item.uniqueId, 'buyPrice', e.target.value)}
                                                className={inputCls}
                                            />
                                        </div>

                                        {/* Main */}
                                        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-bold text-brand-700">
                                                    Main · Total {item.totalQty} · Stock {st ? st.paid - b.freeFromMain : '...'}
                                                    {b.mainFromFree > 0 && <span className="ml-1 text-amber-600">(Free theke: {b.mainFromFree})</span>}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleBorrow(item.uniqueId, 'borrowMain')}
                                                    className={`h-8 px-3 rounded-full text-[11px] font-bold cursor-pointer ${item.borrowMain ? 'bg-amber-500 text-white' : 'bg-white border border-brand-300 text-brand-700'}`}
                                                >
                                                    Free {item.borrowMain ? '✓' : '+'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <QtyField label={item.unit || 'Pcs'} value={item.unitQty} onChange={num('unitQty')} />
                                                {item.parentMode && <QtyField label={item.subUnit || 'Sub'} value={item.subQty ?? ''} onChange={num('subQty')} />}
                                                <QtyField label="Pcs" value={item.pcsQty} onChange={num('pcsQty')} />
                                            </div>
                                        </div>

                                        {/* Free */}
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-bold text-emerald-700">
                                                    Free · Total {item.freeQty} · Stock {st ? st.free - b.mainFromFree : '...'}
                                                    {b.freeFromMain > 0 && <span className="ml-1 text-amber-600">(Main theke: {b.freeFromMain})</span>}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleBorrow(item.uniqueId, 'borrowFree')}
                                                    className={`h-8 px-3 rounded-full text-[11px] font-bold cursor-pointer ${item.borrowFree ? 'bg-amber-500 text-white' : 'bg-white border border-emerald-300 text-emerald-700'}`}
                                                >
                                                    Main {item.borrowFree ? '✓' : '+'}
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <QtyField label={item.unit || 'Pcs'} value={item.freeUnitQty} onChange={num('freeUnitQty')} />
                                                {item.parentMode && <QtyField label={item.subUnit || 'Sub'} value={item.freeSubQty ?? ''} onChange={num('freeSubQty')} />}
                                                <QtyField label="Pcs" value={item.freePcsQty} onChange={num('freePcsQty')} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Return amount */}
                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-slate-700">Return Amount</span>
                            <span className="text-xl font-bold text-emerald-700">৳{returnAmount.toFixed(2)}</span>
                        </div>
                    </Card>

                    <PaymentSection
                        returnAmount={returnAmount}
                        open={paymentOpen}
                        setOpen={setPaymentOpen}
                        amount={paymentAmount}
                        setAmount={setPaymentAmount}
                        setTouched={setPaymentAmountTouched}
                        accountType={paymentAccountType}
                        setAccountType={setPaymentAccountType}
                        accountKey={selectedAccountKey}
                        setAccountKey={setSelectedAccountKey}
                        note={paymentNote}
                        setNote={setPaymentNote}
                        investments={investments}
                    />

                    <Card>
                        <label className={labelCls}>Note</label>
                        <textarea
                            rows="3"
                            placeholder="Write any note about this return..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className={`${inputCls} resize-y`}
                        />
                    </Card>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-brand-600 text-white text-sm font-semibold px-10 py-3 w-full sm:w-auto disabled:opacity-60 cursor-pointer"
                        >
                            {isSaving ? 'Saving...' : isEditMode ? 'Update Bulk Return' : 'Bulk Return'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PurchaseBulkReturnForm;