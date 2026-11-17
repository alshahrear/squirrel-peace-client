import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimes } from 'react-icons/fa';
import useCan from '../../../../../hooks/useCan';
import { DateInput } from '../../Product/ProductUi';
import { inputCls, labelCls, ComboField } from '../../Purchase/PurchaseUi';
import { Card, QtyField } from '../../Purchase/PurchaseFormUi';
import { labelToISO } from '../../Purchase/purchaseDate';

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

// In Stock + / Out Stock - toggle
const StockSwitch = ({ value, onChange }) => (
    <button type="button" onClick={onChange} className="inline-flex items-center gap-1.5 h-8 cursor-pointer" aria-label="Toggle In / Out">
        <span className={`relative inline-block w-9 h-5 rounded-full transition-colors duration-200 ${value === 'in' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${value === 'in' ? 'translate-x-4' : 'translate-x-0'}`} />
        </span>
        <span className={`text-[11px] font-extrabold ${value === 'in' ? 'text-emerald-600' : 'text-rose-600'}`}>
            {value === 'in' ? 'In Stock +' : 'Out Stock −'}
        </span>
    </button>
);

const StockAdjustmentForm = () => {
    const { canAdd, canEdit } = useCan('stock_adjustment');
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

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editingAdj?.note || '');
    const [isSaving, setIsSaving] = useState(false);

    const showToast = (message, isError = false) => (isError ? toast.error(message) : toast.success(message));

    useEffect(() => {
        fetch('http://localhost:5000/company').then((r) => r.json()).then((d) => setCompanies(Array.isArray(d) ? d : [])).catch(console.error);
        fetch('http://localhost:5000/category').then((r) => r.json()).then((d) => setCategories(Array.isArray(d) ? d.filter((c) => c.isActive === true) : [])).catch(console.error);
        fetch('http://localhost:5000/product').then((r) => r.json()).then((d) => setProducts(Array.isArray(d) ? d : [])).catch(console.error);
        fetch(`http://localhost:5000/adjustment-stock${isEditMode ? `?excludeId=${editId}` : ''}`)
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

    const poolMap = useMemo(() => new Map((pools || []).map((p) => [String(p.batchId), p])), [pools]);

    // Page refresh dile state hariye jay, tai ?edit=id theke abar load kore
    useEffect(() => {
        if (editingAdj || !editParamId) return;
        fetch(`http://localhost:5000/stock-adjustment/${editParamId}`)
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
    };
    const handleClearCompany = () => {
        setCompanySearch('');
        setFormData((p) => ({ ...p, company: '', companyContact: '', companyAddress: '' }));
        setProductSearch('');
        setItems([]);
    };

    // ---------- Category ----------
    const filteredCategories = categories.filter((c) => c.name?.toLowerCase().includes(categorySearch.toLowerCase()));
    const handleSelectCategory = (cat) => {
        setFormData((p) => ({ ...p, category: cat.name }));
        setCategorySearch(cat.name);
        setProductSearch('');
    };
    const handleClearCategory = () => {
        setCategorySearch('');
        setFormData((p) => ({ ...p, category: '' }));
        setProductSearch('');
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
        if (isEditMode ? !canEdit : !canAdd) {
            return showToast(isEditMode ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!', true);
        }
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
            const url = isEditMode ? `http://localhost:5000/stock-adjustment/${editId}` : 'http://localhost:5000/stock-adjustment';
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
            setTimeout(() => navigate('/stock-adjustment', { replace: true }), 1000);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save adjustment. Try again.', true);
        }
    };

    const companyInfo = [formData.companyContact, formData.companyAddress].filter(Boolean).join(' | ');

    const qtyBox = (item, kind) => {
        const isMain = kind === 'main';
        const batch = poolMap.get(String(item.batchId));
        const type = isMain ? item.mainType : item.freeType;
        const total = Number(isMain ? item.totalQty : item.freeQty) || 0;
        const disabled = isMain ? !item.batchId || batch?.isFreeProduct : !item.batchId;
        const stock = batch ? (isMain ? batch.paid : batch.free) : null;
        const stockText =
            stock === null ? '...' : total > 0 ? `${stock} → ${stock + (type === 'in' ? total : -total)}` : `${stock}`;
        const f = isMain ? ['unitQty', 'subQty', 'pcsQty'] : ['freeUnitQty', 'freeSubQty', 'freePcsQty'];
        const tone = isMain ? 'border-brand-100 bg-brand-50/50' : 'border-emerald-100 bg-emerald-50/50';
        const set = (field) => (v) => /^\d*$/.test(v) && handleItemChange(item.uniqueId, field, v);
        return (
            <div className={`rounded-xl border p-2.5 ${tone} ${disabled ? 'opacity-60' : ''}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-2">
                    <span className={`text-xs font-bold ${isMain ? 'text-brand-700' : 'text-emerald-700'}`}>{isMain ? 'Main' : 'Free'}</span>
                    <StockSwitch value={type} onChange={() => handleToggleType(item.uniqueId, isMain ? 'mainType' : 'freeType')} />
                </div>
                <div className={`mt-1 inline-block px-1.5 rounded text-[10px] font-bold ${total > 0 ? (type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700') : 'bg-slate-100 text-slate-500'}`}>
                    Total: {total} | Stock: {stockText}
                </div>
                <div className={`mt-2 grid gap-2 ${item.parentMode ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <QtyField label={item.unit || 'Pcs'} value={item[f[0]]} disabled={disabled} onChange={set(f[0])} />
                    {item.parentMode && <QtyField label={item.subUnit || 'Sub'} value={item[f[1]] ?? ''} disabled={disabled} onChange={set(f[1])} />}
                    <QtyField label="Pcs" value={item[f[2]]} disabled={disabled} onChange={set(f[2])} />
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-6xl mx-auto space-y-4">
                <div className="relative z-20">
                    <Card
                        title={isEditMode ? 'Edit Stock Adjustment' : 'Stock Adjustment'}
                        subtitle="Select company, product and invoice to adjust stock"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="min-w-0">
                                {isEditMode ? (
                                    <div>
                                        <span className={labelCls}>Company *</span>
                                        <input readOnly disabled value={companySearch} className={inputCls} />
                                        <p className="text-[11px] text-slate-400 mt-1">Company can't be changed while editing</p>
                                    </div>
                                ) : (
                                    <ComboField
                                        label="Company *"
                                        value={companySearch}
                                        placeholder="Search or select company..."
                                        options={filteredCompanies.map((c) => ({
                                            key: c._id,
                                            title: c.businessName,
                                            sub: [c.contactNumber, c.address].filter(Boolean).join(' | '),
                                            raw: c,
                                        }))}
                                        onType={(v) => setCompanySearch(v)}
                                        onClear={handleClearCompany}
                                        onPick={(o) => handleSelectCompany(o.raw)}
                                    />
                                )}
                                {formData.company && companyInfo && !isEditMode && (
                                    <p className="text-[11px] text-slate-500 mt-1 truncate" title={companyInfo}>{companyInfo}</p>
                                )}
                            </div>

                            <div className="min-w-0">
                                <ComboField
                                    label="Category"
                                    value={categorySearch}
                                    placeholder="Search or select category..."
                                    options={filteredCategories.map((c) => ({ key: c._id, title: c.name, raw: c }))}
                                    onType={(v) => {
                                        setCategorySearch(v);
                                        setFormData((p) => ({ ...p, category: v }));
                                    }}
                                    onClear={handleClearCategory}
                                    onPick={(o) => handleSelectCategory(o.raw)}
                                />
                            </div>

                            <div className="min-w-0">
                                <span className={labelCls}>Date *</span>
                                <DateInput name="date" value={labelToISO(formData.date)} onChange={handleDateChange} placeholder="Select date" />
                            </div>
                        </div>

                        <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/40 p-3 sm:p-4">
                            {formData.company ? (
                                <ComboField
                                    label="Select Product *"
                                    value={productSearch}
                                    placeholder="Search by product name or SKU..."
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

                <form onSubmit={handleSubmit} className="space-y-4 relative z-0">
                    <Card title="Products" subtitle={`${items.length} added`}>
                        {items.length === 0 ? (
                            <div className="text-center py-10 text-slate-400 text-sm">
                                No products added yet. Please select a company and product above.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {items.map((item, index) => {
                                    const batch = poolMap.get(String(item.batchId));
                                    const opts = getBatchOptions(item);
                                    return (
                                        <div key={item.uniqueId} className="rounded-2xl border border-slate-200 bg-slate-50/50 p-3 sm:p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0 flex gap-2.5">
                                                    <span className="shrink-0 w-6 h-6 rounded-full bg-brand-50 text-brand-700 text-[11px] font-bold flex items-center justify-center">
                                                        {index + 1}
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-slate-800 break-words leading-snug">{item.productName}</p>
                                                        <p className="text-xs text-slate-500 break-words">{item.company}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    aria-label="Remove product"
                                                    onClick={() => handleRemoveItem(item.uniqueId)}
                                                    className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full text-rose-500 hover:bg-rose-50 cursor-pointer"
                                                >
                                                    <FaTimes size={13} />
                                                </button>
                                            </div>

                                            <div className="mt-3">
                                                <label className={labelCls}>Stock Invoice <span className="text-rose-500">*</span></label>
                                                <select
                                                    value={item.batchId}
                                                    onChange={(e) => handleBatchChange(item.uniqueId, e.target.value)}
                                                    className={`${inputCls} cursor-pointer`}
                                                >
                                                    <option value="">Select invoice...</option>
                                                    {opts.map((o) => (
                                                        <option key={o.batchId} value={o.batchId}>
                                                            #{o.invoiceNo} | ৳{o.cost}{o.isFreeProduct ? ' (Others Free)' : ''} | Main {o.paid} / Free {o.free}
                                                        </option>
                                                    ))}
                                                </select>
                                                {batch && (
                                                    <p className="mt-1 text-[11px] font-semibold text-slate-400">Batch: {batch.batchNo} | Cost: ৳{batch.cost}</p>
                                                )}
                                            </div>

                                            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {qtyBox(item, 'main')}
                                                {qtyBox(item, 'free')}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="mt-5 grid grid-cols-2 gap-3 md:ml-auto md:max-w-md">
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
                                <div className="text-[10px] font-bold uppercase text-emerald-500">Total In (+)</div>
                                <div className="text-base font-extrabold text-emerald-700">{totalIn} pcs</div>
                            </div>
                            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5">
                                <div className="text-[10px] font-bold uppercase text-rose-400">Total Out (−)</div>
                                <div className="text-base font-extrabold text-rose-700">{totalOut} pcs</div>
                            </div>
                        </div>

                        <div className="mt-5">
                            <label className={labelCls}>Note</label>
                            <textarea
                                rows="3"
                                placeholder="Write any note about this adjustment..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className={`${inputCls} resize-y`}
                            />
                        </div>

                        <div className="mt-5 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-brand-600 text-white text-sm font-semibold px-8 py-2.5 w-full sm:w-auto disabled:opacity-60 cursor-pointer"
                            >
                                {isSaving ? 'Saving...' : isEditMode ? 'Update Adjustment' : 'Save Adjustment'}
                            </button>
                        </div>
                    </Card>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentForm;