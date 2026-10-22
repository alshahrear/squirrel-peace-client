import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

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

// Light switch style toggle: In Stock + / Out Stock -
const StockSwitch = ({ value, onChange }) => (
    <button
        type="button"
        onClick={onChange}
        className="pointer-events-auto ml-1.5 inline-flex items-center gap-1 align-middle cursor-pointer"
    >
        <span className={`relative inline-block w-8 h-4 rounded-full transition-colors duration-200 ${value === 'in' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform duration-200 ${value === 'in' ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
        <span className={`text-[9px] font-extrabold ${value === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {value === 'in' ? 'In Stock +' : 'Out Stock −'}
        </span>
    </button>
);

const StockAdjustmentForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editParamId = new URLSearchParams(location.search).get('edit');
    const [editingAdj, setEditingAdj] = useState(location.state?.adjustment || null);
    const isEditMode = !!(editingAdj || editParamId);
    const editId = editingAdj?._id || editParamId || null;

    const [formData, setFormData] = useState({
        company: editingAdj?.company || '',
        companyContact: editingAdj?.phone || '',
        companyAddress: editingAdj?.address || '',
        category: editingAdj?.category || '',
        date: editingAdj?.adjustmentDate || getFormattedToday(),
    });

    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [pools, setPools] = useState(null);

    const [companySearch, setCompanySearch] = useState(editingAdj?.company || '');
    const [categorySearch, setCategorySearch] = useState(editingAdj?.category || '');
    const [productSearch, setProductSearch] = useState('');

    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isProductOpen, setIsProductOpen] = useState(false);

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editingAdj?.note || '');
    const [toast, setToast] = useState({ show: false, message: '', isError: false });
    const [isSaving, setIsSaving] = useState(false);

    const companyRef = useRef(null);
    const categoryRef = useRef(null);
    const productRef = useRef(null);
    const dateInputRef = useRef(null);

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
    };

    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/company').then((r) => r.json()).then((d) => setCompanies(Array.isArray(d) ? d : [])).catch(console.error);
        fetch('https://squirrel-peace-server.onrender.com/category').then((r) => r.json()).then((d) => setCategories(Array.isArray(d) ? d.filter((c) => c.isActive === true) : [])).catch(console.error);
        fetch('https://squirrel-peace-server.onrender.com/product').then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(console.error);
        fetch(`https://squirrel-peace-server.onrender.com/adjustment-stock${isEditMode ? `?excludeId=${editId}` : ''}`)
            .then((r) => r.json())
            .then((d) => setPools(Array.isArray(d) ? d : []))
            .catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (editingAdj) {
            setItems(
                (editingAdj.items || []).map((it, index) => ({
                    uniqueId: `${it.productId || 'item'}-${index}-${Date.now()}`,
                    _id: it.productId,
                    productName: it.productName,
                    company: editingAdj.company || '',
                    batchId: it.batchId || '',
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
                    totalQty: Number(it.totalQty) || 0,
                    freeQty: Number(it.freeQty) || 0,
                    mainType: it.mainType === 'out' ? 'out' : 'in',
                    freeType: it.freeType === 'out' ? 'out' : 'in',
                }))
            );
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (companyRef.current && !companyRef.current.contains(e.target)) setIsCompanyOpen(false);
            if (categoryRef.current && !categoryRef.current.contains(e.target)) setIsCategoryOpen(false);
            if (productRef.current && !productRef.current.contains(e.target)) setIsProductOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const poolMap = useMemo(() => new Map((pools || []).map((p) => [String(p.batchId), p])), [pools]);

    // Page refresh dile state hariye jay, tai ?edit=id theke abar load kore
    useEffect(() => {
        if (editingAdj || !editParamId) return;
        fetch(`https://squirrel-peace-server.onrender.com/stock-adjustment/${editParamId}`)
            .then((r) => r.json())
            .then((d) => {
                if (!d || !d._id) return;
                setEditingAdj(d);
                setFormData({
                    company: d.company || '',
                    companyContact: d.phone || '',
                    companyAddress: d.address || '',
                    category: d.category || '',
                    date: d.adjustmentDate || getFormattedToday(),
                });
                setCompanySearch(d.company || '');
                setCategorySearch(d.category || '');
                setNote(d.note || '');
                setItems(
                    (d.items || []).map((it, index) => ({
                        uniqueId: `${it.productId || 'item'}-${index}-${Date.now()}`,
                        _id: it.productId,
                        productName: it.productName,
                        company: d.company || '',
                        batchId: it.batchId || '',
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
                        totalQty: Number(it.totalQty) || 0,
                        freeQty: Number(it.freeQty) || 0,
                        mainType: it.mainType === 'out' ? 'out' : 'in',
                        freeType: it.freeType === 'out' ? 'out' : 'in',
                    }))
                );
            })
            .catch(console.error);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Product er jonno unique cost price onujayi 1 ta invoice (FIFO: jar stock ase seta age)
    const getBatchOptions = (item) => {
        if (!pools) return [];
        const list = pools
            .map((p, idx) => ({ ...p, idx }))
            .filter((p) => String(p.productId) === String(item._id) || p.productName === item.productName);
        const groups = new Map();
        list.forEach((p) => {
            const k = (Number(p.cost) || 0).toFixed(2);
            if (!groups.has(k)) groups.set(k, []);
            groups.get(k).push(p);
        });
        const reps = [...groups.values()].map((g) => g.find((p) => p.paid + p.free > 0) || g[g.length - 1]);
        reps.sort((a, b) => {
            const sa = a.paid + a.free > 0 ? 0 : 1;
            const sb = b.paid + b.free > 0 ? 0 : 1;
            return sa - sb || a.idx - b.idx;
        });
        const sel = poolMap.get(String(item.batchId));
        if (sel && !reps.some((r) => r.batchId === sel.batchId)) reps.push(sel);
        return reps;
    };

    // ---------- Company ----------
    const filteredCompanies = companies.filter((c) => {
        const q = companySearch.toLowerCase();
        return c.businessName?.toLowerCase().includes(q) || c.contactNumber?.toLowerCase().includes(q) || c.address?.toLowerCase().includes(q);
    });
    const handleSelectCompany = (comp) => {
        setFormData((p) => ({ ...p, company: comp.businessName, companyContact: comp.contactNumber || '', companyAddress: comp.address || '' }));
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
    const filteredCategories = categories.filter((c) => c.name?.toLowerCase().includes(categorySearch.toLowerCase()));
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
            const formatted = new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
        setItems((prev) => [
            ...prev,
            {
                uniqueId: Date.now() + Math.random(),
                _id: product._id,
                productName: product.productName || '',
                company: product.company || '',
                batchId: '',
                unit: isParent ? product.parentUnit : product.unit || 'Pcs',
                parentMode: isParent,
                subUnit: isParent ? product.subUnit : '',
                pcsPerUnit: Number(product.pcsOfUnit) || 1,
                pcsPerSub: isParent ? Number(product.subUnitQty) || 1 : 0,
                unitQty: '',
                subQty: '',
                pcsQty: '',
                freeUnitQty: '',
                freeSubQty: '',
                freePcsQty: '',
                totalQty: 0,
                freeQty: 0,
                mainType: 'in',
                freeType: 'in',
            },
        ]);
        setProductSearch('');
        setIsProductOpen(false);
    };

    const handleRemoveItem = (uniqueId) => setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));

    // Out hole selected batch er stock er beshi hobe na (error message return kore)
    const checkStock = (it) => {
        const b = poolMap.get(String(it.batchId));
        if (!b) return null;
        const total = Number(it.totalQty) || 0;
        const free = Number(it.freeQty) || 0;
        if (total > 0 && b.isFreeProduct) return 'Ei invoice ti Others Free, Main stock nai!';
        if (it.mainType === 'out' && total > b.paid) return `Main stock e matro ${b.paid} pcs ache!`;
        if (it.freeType === 'out' && free > b.free) return `Free stock e matro ${b.free} pcs ache!`;
        return null;
    };

    const handleBatchChange = (uniqueId, batchId) => {
        setItems((prev) =>
            prev.map((i) =>
                i.uniqueId === uniqueId
                    ? { ...i, batchId, unitQty: '', subQty: '', pcsQty: '', freeUnitQty: '', freeSubQty: '', freePcsQty: '', totalQty: 0, freeQty: 0 }
                    : i
            )
        );
    };

    const handleToggleType = (uniqueId, field) => {
        const item = items.find((i) => i.uniqueId === uniqueId);
        if (!item) return;
        const next = { ...item, [field]: item[field] === 'in' ? 'out' : 'in' };
        const msg = checkStock(next);
        if (msg) return showToast(`${msg} Age quantity komiye nin.`, true);
        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
    };

    const handleItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        const item = items.find((i) => i.uniqueId === uniqueId);
        if (!item) return;
        if (!item.batchId) return showToast('Age Stock Invoice select korun!', true);

        const next = { ...item, [field]: value === '' ? '' : Number(value) || 0 };
        const ppu = Number(next.pcsPerUnit) || 1;
        const pps = Number(next.pcsPerSub) || 0;
        next.totalQty = (Number(next.unitQty) || 0) * ppu + (Number(next.subQty) || 0) * pps + (Number(next.pcsQty) || 0);
        next.freeQty = (Number(next.freeUnitQty) || 0) * ppu + (Number(next.freeSubQty) || 0) * pps + (Number(next.freePcsQty) || 0);

        const msg = checkStock(next);
        if (msg) return showToast(msg, true);
        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
    };

    // ---------- Totals ----------
    const totalIn = items.reduce(
        (s, i) => s + (i.mainType === 'in' ? Number(i.totalQty) || 0 : 0) + (i.freeType === 'in' ? Number(i.freeQty) || 0 : 0),
        0
    );
    const totalOut = items.reduce(
        (s, i) => s + (i.mainType === 'out' ? Number(i.totalQty) || 0 : 0) + (i.freeType === 'out' ? Number(i.freeQty) || 0 : 0),
        0
    );

    // ---------- Submit ----------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        if (isEditMode && !editingAdj) return showToast('Adjustment load hocche, ektu wait korun!', true);

        if (!formData.company) return showToast('Company is required!', true);
        if (!formData.date) return showToast('Date is required!', true);
        if (items.length === 0) return showToast('Please add at least one product!', true);
        if (items.some((i) => !i.batchId)) return showToast('Proti product er Stock Invoice select korun!', true);
        if (items.some((i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0)) {
            return showToast('Each product must have a valid quantity!', true);
        }

        const itemsPayload = items.map((i) => {
            const b = poolMap.get(String(i.batchId));
            return {
                productId: i._id,
                productName: i.productName,
                batchId: i.batchId,
                batchNo: b?.batchNo || '',
                batchInvoiceNo: b?.invoiceNo || '',
                costPrice: Number(b?.cost) || 0,
                unit: i.unit || 'Pcs',
                parentMode: i.parentMode === true,
                subUnit: i.subUnit || '',
                pcsPerUnit: Number(i.pcsPerUnit) || 1,
                pcsPerSub: Number(i.pcsPerSub) || 0,
                unitQty: Number(i.unitQty) || 0,
                subQty: Number(i.subQty) || 0,
                pcsQty: Number(i.pcsQty) || 0,
                totalQty: Number(i.totalQty) || 0,
                mainType: i.mainType,
                freeUnitQty: Number(i.freeUnitQty) || 0,
                freeSubQty: Number(i.freeSubQty) || 0,
                freePcsQty: Number(i.freePcsQty) || 0,
                freeQty: Number(i.freeQty) || 0,
                freeType: i.freeType,
            };
        });

        const payload = {
            invoiceNo: isEditMode ? (editingAdj?.invoiceNo || '') : generateInvoiceNo(),
            company: formData.company,
            phone: formData.companyContact,
            address: formData.companyAddress,
            category: formData.category,
            adjustmentDate: formData.date,
            items: itemsPayload,
            totalIn,
            totalOut,
            note,
        };

        try {
            setIsSaving(true);
            const url = isEditMode ? `https://squirrel-peace-server.onrender.com/stock-adjustment/${editId}` : 'https://squirrel-peace-server.onrender.com/stock-adjustment';
            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                setIsSaving(false);
                if (err.shortages?.length) {
                    return showToast(`Stock nai: ${err.shortages.map((s) => `${s.productName} (stock ${s.available})`).join(', ')}`, true);
                }
                return showToast(err.message || 'Failed to save adjustment.', true);
            }
            await res.json();
            showToast(isEditMode ? 'Adjustment updated successfully!' : 'Adjustment added successfully!');
            setTimeout(() => navigate('/stock-all', { replace: true, state: { tab: 'adjustment' } }), 1000);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save adjustment. Try again.', true);
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
                        <h3 className="text-xl font-bold text-slate-800">{isEditMode ? 'Edit Stock Adjustment' : 'Stock Adjustment'}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Select company, product and invoice to adjust stock</p>
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
                                        onChange={(e) => { setCompanySearch(e.target.value); setIsCompanyOpen(true); }}
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
                                <div className="relative w-full cursor-pointer" onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}>
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
                                    onChange={(e) => { setProductSearch(e.target.value); setIsProductOpen(true); }}
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
                                                    <p className="text-xs text-slate-500 mt-0.5">Company: {prod.company}{prod.category ? ` | Category: ${prod.category}` : ''}</p>
                                                </div>
                                                {prod.sku && <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium border border-amber-100">SKU: {prod.sku}</span>}
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
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '17%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '18%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '4%' }} />
                                </colgroup>
                                <thead>
                                    <tr className="bg-teal-50/60 border-b-2 border-teal-100 text-xs font-semibold text-teal-800">
                                        <th className="py-3 px-3">Product Name</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Stock Invoice <span className="text-rose-500">*</span></th>
                                        <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                        <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                        <th className="py-3 pl-4 pr-1">Free Unit</th>
                                        <th className="py-3 pl-3 pr-2">Free PCS</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {items.length > 0 ? (
                                        items.map((item) => {
                                            const batch = poolMap.get(String(item.batchId));
                                            const opts = getBatchOptions(item);
                                            const total = Number(item.totalQty) || 0;
                                            const free = Number(item.freeQty) || 0;
                                            const mainStockText = batch
                                                ? total > 0
                                                    ? `${batch.paid} → ${batch.paid + (item.mainType === 'in' ? total : -total)}`
                                                    : `${batch.paid}`
                                                : '...';
                                            const freeStockText = batch
                                                ? free > 0
                                                    ? `${batch.free} → ${batch.free + (item.freeType === 'in' ? free : -free)}`
                                                    : `${batch.free}`
                                                : '...';
                                            const mainDisabled = !item.batchId || batch?.isFreeProduct;
                                            const freeDisabled = !item.batchId;
                                            return (
                                                <tr key={item.uniqueId} className="hover:bg-teal-50/40 transition">
                                                    <td className="py-3 px-3 font-semibold text-slate-800">{item.productName}</td>
                                                    <td className="py-3 px-3 text-slate-600">{item.company}</td>

                                                    {/* Stock Invoice */}
                                                    <td className="py-3 px-3">
                                                        <select
                                                            value={item.batchId}
                                                            onChange={(e) => handleBatchChange(item.uniqueId, e.target.value)}
                                                            className="w-full px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 cursor-pointer"
                                                        >
                                                            <option value="">Select invoice...</option>
                                                            {opts.map((o) => (
                                                                <option key={o.batchId} value={o.batchId}>
                                                                    #{o.invoiceNo} | ৳{o.cost}{o.isFreeProduct ? ' (Others Free)' : ''} | Main {o.paid} / Free {o.free}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {batch && (
                                                            <div className="mt-1 text-[10px] font-semibold text-slate-400">
                                                                Batch: {batch.batchNo} | Cost: ৳{batch.cost}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Unit Qty (Main) */}
                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${total > 0 ? (item.mainType === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {total} | Stock: {mainStockText}
                                                            <StockSwitch value={item.mainType} onChange={() => handleToggleType(item.uniqueId, 'mainType')} />
                                                        </div>
                                                        <div className={`p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl ${mainDisabled ? 'opacity-60' : ''}`}>
                                                            <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                <input
                                                                    type="number" min="0" step="1" placeholder="0"
                                                                    disabled={mainDisabled}
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
                                                                        disabled={mainDisabled}
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
                                                        <div className={`p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl ${mainDisabled ? 'opacity-60' : ''}`}>
                                                            <input
                                                                type="number" min="0" step="1" placeholder="0"
                                                                disabled={mainDisabled}
                                                                value={item.pcsQty}
                                                                onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'pcsQty', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    {/* Free Unit */}
                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${free > 0 ? (item.freeType === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {free} | Stock: {freeStockText}
                                                            <StockSwitch value={item.freeType} onChange={() => handleToggleType(item.uniqueId, 'freeType')} />
                                                        </div>
                                                        <div className={`p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl ${freeDisabled ? 'opacity-60' : ''}`}>
                                                            <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                <input
                                                                    type="number" min="0" step="1" placeholder="0"
                                                                    disabled={freeDisabled}
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
                                                                        disabled={freeDisabled}
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
                                                        <div className={`p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl ${freeDisabled ? 'opacity-60' : ''}`}>
                                                            <input
                                                                type="number" min="0" step="1" placeholder="0"
                                                                disabled={freeDisabled}
                                                                value={item.freePcsQty}
                                                                onChange={(e) => /^\d*$/.test(e.target.value) && handleItemChange(item.uniqueId, 'freePcsQty', e.target.value)}
                                                                className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="py-3 px-3 text-center">
                                                        <button type="button" onClick={() => handleRemoveItem(item.uniqueId)} className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer">
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="8" className="text-center py-8 text-slate-400 text-sm">
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
                                    <label className="w-56 text-right pr-3 text-sm font-bold text-emerald-700">Total In Stock (+)</label>
                                    <input type="text" readOnly value={`${totalIn} pcs`} className="flex-1 px-3 py-2 border border-emerald-200 bg-white font-bold text-emerald-700 rounded-lg text-sm outline-none" />
                                </div>
                                <div className="flex items-center">
                                    <label className="w-56 text-right pr-3 text-sm font-bold text-rose-700">Total Out Stock (−)</label>
                                    <input type="text" readOnly value={`${totalOut} pcs`} className="flex-1 px-3 py-2 border border-rose-200 bg-white font-bold text-rose-700 rounded-lg text-sm outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Note */}
                        <div className="mt-8">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Note</label>
                            <textarea
                                rows="3"
                                placeholder="Write any note about this adjustment..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-y shadow-sm"
                            />
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-10 py-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-sm font-semibold text-white shadow-md shadow-teal-200 transition cursor-pointer disabled:opacity-60"
                            >
                                {isEditMode ? 'Update Adjustment' : 'Adjustment'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustmentForm;