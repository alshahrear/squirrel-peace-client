import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaBox, FaBuilding, FaBarcode, FaTags, FaExclamationTriangle, FaDollarSign,
    FaBalanceScale, FaGift, FaStickyNote, FaTimes, FaEdit, FaSave, FaPlus,
} from 'react-icons/fa';
import useCan from '../../../../hooks/useCan';
import { ComboBox, Switch, inputCls } from './ProductUi';

const EMPTY = {
    productName: '', company: '', companyContact: '', sku: '', category: '',
    alertQuantity: '', purchasePrice: '', sellingPrice: '', mrp: '',
    unit: '', pcsOfUnit: '', freeProductUnitQty: '', freeProductSubQty: '', freeProductPcsQty: '',
    hasParent: false, parentUnit: '', parentQty: '', unitQty: '', note: '', isActive: true,
};

const lbl = 'flex items-center gap-1.5 text-xs font-medium text-slate-600 mb-1.5';
const addLink = 'inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800 cursor-pointer';
const low = (s) => (s || '').toLowerCase();

const ProductForm = ({ formData, setFormData, editingId, setEditingId, fetchProducts, setIsFormOpen, showToast, products = [] }) => {
    const navigate = useNavigate();
    const { canAdd, canEdit } = useCan('product');
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
        const [units, setUnits] = useState([]);
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    const hasParent = formData.hasParent === true;
    const parentQtyNum = Number(formData.parentQty) || 0;
    const unitQtyNum = Number(formData.unitQty) || 0;
    // Parent থাকলে PCS of 1 Unit = Parent Qty × Unit Qty (নিজে থেকে হিসাব হবে)
    const effectivePcs = hasParent ? parentQtyNum * unitQtyNum : Number(formData.pcsOfUnit) || 0;
    const freeTotal = hasParent
        ? (Number(formData.freeProductSubQty) || 0) * unitQtyNum + (Number(formData.freeProductPcsQty) || 0)
        : Number(formData.freeProductPcsQty) || 0;

    useEffect(() => {
        fetch('http://localhost:5000/company')
            .then((res) => res.json())
            .then(setCompanies)
            .catch((err) => console.error('Error fetching companies:', err));
        fetch('http://localhost:5000/category')
            .then((res) => res.json())
            .then((data) => setCategories(data.filter((c) => c.isActive === true)))
            .catch((err) => console.error('Error fetching categories:', err));
        fetch('http://localhost:5000/unit')
            .then((res) => res.json())
            .then((data) => setUnits(data.filter((u) => u.isActive === true)))
            .catch((err) => console.error('Error fetching units:', err));
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
    };
    const digits = (e) => {
        if (/^\d*$/.test(e.target.value)) handleChange(e);
    };
    const money2 = (e) => {
        if (/^\d*\.?\d{0,2}$/.test(e.target.value)) handleChange(e);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData(EMPTY);
        if (setIsFormOpen) setIsFormOpen(false);
    };

    const getFormattedDateTime = () => {
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        let hours = date.getHours();
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12;
        return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = Boolean(editingId);

        if (isEditing && !canEdit) {
            if (showToast) showToast('আপনার Edit করার অনুমতি নেই!', 'error');
            return;
        }
        if (!isEditing && !canAdd) {
            if (showToast) showToast('আপনার Add করার অনুমতি নেই!', 'error');
            return;
        }

        const nameInput = formData.productName.trim().toLowerCase();
        const companyName = formData.company.trim().toLowerCase();
        const contactInput = (formData.companyContact || '').trim();

        const isDuplicate = products.some(
            (p) =>
                p.productName?.trim().toLowerCase() === nameInput &&
                p.company?.trim().toLowerCase() === companyName &&
                (!p.companyContact || !contactInput || p.companyContact.trim() === contactInput) &&
                p._id !== editingId
        );
        if (isDuplicate) {
            if (showToast) showToast('This product already exists for this company!', 'error');
            return;
        }

        if (hasParent && (!formData.parentUnit?.trim() || !formData.unit?.trim() || parentQtyNum <= 0 || unitQtyNum <= 0)) {
            if (showToast) showToast('Parent Unit, Unit এবং দুইটা Qty দিন!', 'error');
            return;
        }

        // Parent থাকলে: unit = Parent Unit, subUnit = Unit, pcsOfUnit = Parent Qty × Unit Qty
        const unitData = hasParent
            ? {
                parentUnitUse: true,
                parentUnit: formData.parentUnit.trim(),
                parentQty: parentQtyNum,
                subUnit: formData.unit.trim(),
                subUnitQty: unitQtyNum,
                pcsOfUnit: effectivePcs,
                freeProductSubQty: formData.freeProductSubQty || '',
                freeProductPcsQty: formData.freeProductPcsQty || '',
            }
            : {
                parentUnitUse: false,
                unit: formData.unit,
                pcsOfUnit: formData.pcsOfUnit,
                freeProductPcsQty: formData.freeProductPcsQty || '',
            };

        const baseData = {
            productName: formData.productName,
            company: formData.company,
            companyContact: formData.companyContact || '',
            sku: formData.sku,
            category: formData.category,
            alertQuantity: formData.alertQuantity,
            purchasePrice: formData.purchasePrice,
            sellingPrice: formData.sellingPrice,
            mrp: formData.mrp,
            parentUnitUse: hasParent,
            ...unitData,
            note: formData.note,
            isActive: formData.isActive,
        };
        const finalData = isEditing ? baseData : { ...baseData, createdAt: getFormattedDateTime() };

               if (savingRef.current) return;
        savingRef.current = true;
        setSaving(true);

        try {
            const response = await fetch(isEditing ? `http://localhost:5000/product/${editingId}` : 'http://localhost:5000/product', {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(finalData),
            });

            const data = await response.json();
            if (data.insertedId || data.modifiedCount > 0 || data.matchedCount > 0) {
                if (showToast) showToast(isEditing ? 'Product updated successfully!' : 'Product added successfully!', 'success');
                handleCancelEdit();
                if (fetchProducts) fetchProducts();
                setTimeout(() => {
                    document.getElementById('product-table-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 150);
            }
               } catch (error) {
            console.error('Error saving product:', error);
        } finally {
            savingRef.current = false;
            setSaving(false);
        }
    };

    // dropdown options
    const companyOpts = companies
        .filter((c) => low(c.businessName).includes(low(formData.company)) || low(c.contactNumber).includes(low(formData.company)))
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', value: c }));
    const categoryOpts = categories
        .filter((c) => low(c.name).includes(low(formData.category)))
        .map((c) => ({ key: c._id, title: c.name, value: c }));
    const unitOpts = units
        .filter((u) => low(u.name).includes(low(formData.unit)))
        .map((u) => ({ key: u._id, title: u.name, value: u }));
    const parentOpts = units
        .filter((u) => low(u.name).includes(low(formData.parentUnit)))
        .map((u) => ({ key: u._id, title: u.name, value: u }));

    const toggleParent = () =>
        setFormData({
            ...formData,
            hasParent: !hasParent,
            unit: '',
            parentUnit: '',
            parentQty: '',
            unitQty: '',
            pcsOfUnit: '',
            freeProductUnitQty: '',
            freeProductParentUnitQty: '',
            freeProductSubQty: '',
            freeProductPcsQty: '',
        });

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 shrink-0 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                        {editingId ? <FaEdit size={16} /> : <FaSave size={16} />}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 truncate">{editingId ? 'Edit Product' : 'Add New Product'}</h2>
                </div>
                {editingId && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="shrink-0 flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 h-9 rounded-full cursor-pointer"
                    >
                        <FaTimes /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className={lbl}><FaBox className="text-brand-500" /> Product Name <span className="text-rose-500">*</span></label>
                        <input type="text" name="productName" placeholder="Enter product name" value={formData.productName} onChange={handleChange} required className={inputCls} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <FaBuilding className="text-brand-500" /> Company <span className="text-rose-500">*</span>
                            </label>
                            <button type="button" onClick={() => navigate('/company')} className={addLink}><FaPlus size={9} /> Add Company</button>
                        </div>
                        <ComboBox
                            required
                            value={formData.company}
                            placeholder="Select or type company"
                            options={companyOpts}
                            emptyText="No company found"
                            onType={(v) => setFormData({ ...formData, company: v, companyContact: '' })}
                            onPick={(o) => setFormData({ ...formData, company: o.value.businessName, companyContact: o.value.contactNumber || '' })}
                        />
                    </div>

                    <div>
                        <label className={lbl}><FaBarcode className="text-brand-500" /> SKU</label>
                        <input type="text" name="sku" placeholder="SKU code" value={formData.sku} onChange={handleChange} className={inputCls} />
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                <FaTags className="text-brand-500" /> Category
                            </label>
                            <button type="button" onClick={() => navigate('/category')} className={addLink}><FaPlus size={9} /> Add Category</button>
                        </div>
                        <ComboBox
                            value={formData.category}
                            placeholder="Select or type category"
                            options={categoryOpts}
                            emptyText="No category found"
                            onType={(v) => setFormData({ ...formData, category: v })}
                            onPick={(o) => setFormData({ ...formData, category: o.value.name })}
                        />
                    </div>

                    <div>
                        <label className={lbl}><FaExclamationTriangle className="text-brand-500" /> Alert Quantity (PCS)</label>
                        <input type="number" inputMode="numeric" name="alertQuantity" placeholder="0" value={formData.alertQuantity} onChange={digits} min="0" step="1" className={inputCls} />
                    </div>

                    <div>
                        <label className={lbl}><FaDollarSign className="text-brand-500" /> Purchase Price (PCS)</label>
                        <input type="number" inputMode="decimal" step="0.01" min="0" name="purchasePrice" placeholder="0.00" value={formData.purchasePrice} onChange={money2} className={inputCls} />
                    </div>

                    <div>
                        <label className={lbl}><FaDollarSign className="text-brand-500" /> Selling Price (PCS)</label>
                        <input type="number" inputMode="decimal" step="0.01" min="0" name="sellingPrice" placeholder="0.00" value={formData.sellingPrice} onChange={money2} className={inputCls} />
                    </div>

                    <div>
                        <label className={lbl}><FaDollarSign className="text-brand-500" /> MRP (PCS)</label>
                        <input type="number" inputMode="decimal" step="0.01" min="0" name="mrp" placeholder="0.00" value={formData.mrp} onChange={money2} className={inputCls} />
                    </div>
                </div>

                {/* Unit & Stock Configuration */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-brand-600" /> Unit &amp; Stock Configuration
                        </h3>
                        <button
                            type="button"
                            onClick={toggleParent}
                            className={`px-3 h-8 rounded-full text-xs font-bold border transition cursor-pointer ${hasParent
                                ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                : 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100'
                                }`}
                        >
                            {hasParent ? '× Remove Parent' : '+ Parent Unit'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                        {/* Unit */}
                        <div className="space-y-3">
                            {hasParent && (
                                <div>
                                    <label className={lbl}><FaBalanceScale className="text-brand-500" /> Parent Unit <span className="text-rose-500">*</span></label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 min-w-0">
                                            <ComboBox
                                                required
                                                value={formData.parentUnit}
                                                placeholder="Parent unit"
                                                options={parentOpts}
                                                emptyText="No unit found"
                                                onType={(v) => setFormData({ ...formData, parentUnit: v })}
                                                onPick={(o) => setFormData({ ...formData, parentUnit: o.value.name })}
                                            />
                                        </div>
                                        <input
                                            type="number" inputMode="numeric" step="1" min="1" required placeholder="Qty"
                                            value={formData.parentQty ?? ''}
                                            onChange={(e) => { if (/^\d*$/.test(e.target.value)) setFormData({ ...formData, parentQty: e.target.value }); }}
                                            className={`${inputCls} !w-24 text-center font-semibold`}
                                        />
                                    </div>
                                </div>
                            )}
                            <div>
                                <div className="flex items-center justify-between mb-1.5">
                                    <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                        <FaBalanceScale className="text-brand-500" /> {hasParent ? 'Unit (Sub)' : 'Unit'} <span className="text-rose-500">*</span>
                                    </label>
                                    <button type="button" onClick={() => navigate('/units')} className={addLink}><FaPlus size={9} /> Add Unit</button>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex-1 min-w-0">
                                        <ComboBox
                                            required
                                            value={formData.unit}
                                            placeholder="Select or type unit"
                                            options={unitOpts}
                                            emptyText="No unit found"
                                            onType={(v) => setFormData({ ...formData, unit: v })}
                                            onPick={(o) => setFormData({ ...formData, unit: o.value.name })}
                                        />
                                    </div>
                                    {hasParent && (
                                        <input
                                            type="number" inputMode="numeric" step="1" min="1" required placeholder="Qty"
                                            value={formData.unitQty ?? ''}
                                            onChange={(e) => { if (/^\d*$/.test(e.target.value)) setFormData({ ...formData, unitQty: e.target.value }); }}
                                            className={`${inputCls} !w-24 text-center font-semibold`}
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* PCS of 1 Unit */}
                        <div>
                            <label className={lbl}><FaBalanceScale className="text-brand-500" /> PCS of 1 Unit <span className="text-rose-500">*</span></label>
                            <input
                                type="number" inputMode="numeric" name="pcsOfUnit" placeholder="e.g. 10"
                                value={hasParent ? (effectivePcs || '') : formData.pcsOfUnit}
                                readOnly={hasParent}
                                title={hasParent ? 'Parent Qty × Unit Qty থেকে নিজে থেকে হিসাব হচ্ছে' : ''}
                                onChange={digits}
                                required min="0" step="1"
                                className={`${inputCls} ${hasParent ? '!bg-slate-100 cursor-not-allowed text-center font-semibold' : ''}`}
                            />
                            {hasParent && <p className="text-[11px] text-slate-400 mt-1">Parent Qty × Unit Qty</p>}
                        </div>

                        {/* Free Product Qty */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                    <FaGift className="text-brand-500" /> Free Product Qty
                                </label>
                                <span className={`px-2 rounded-full text-[10px] leading-[18px] font-bold ${freeTotal > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                    Total: {freeTotal}
                                </span>
                            </div>
                            {hasParent ? (
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <input type="number" inputMode="numeric" name="freeProductSubQty" placeholder="0" value={formData.freeProductSubQty ?? ''} onChange={digits} min="0" step="1" className={`${inputCls} text-center`} />
                                        <p className="text-[11px] text-slate-500 text-center mt-1 truncate">{formData.unit || 'Unit'}</p>
                                    </div>
                                    <div>
                                        <input type="number" inputMode="numeric" name="freeProductPcsQty" placeholder="0" value={formData.freeProductPcsQty ?? ''} onChange={digits} min="0" step="1" className={`${inputCls} text-center`} />
                                        <p className="text-[11px] text-slate-500 text-center mt-1">Pcs</p>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <input type="number" inputMode="numeric" name="freeProductPcsQty" placeholder="0" value={formData.freeProductPcsQty} onChange={digits} min="0" step="1" className={`${inputCls} text-center`} />
                                    <p className="text-[11px] text-slate-500 text-center mt-1">Pcs</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Note & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="md:col-span-2">
                        <label className={lbl}><FaStickyNote className="text-brand-500" /> Note</label>
                        <input type="text" name="note" placeholder="Write additional notes here..." value={formData.note} onChange={handleChange} className={inputCls} />
                    </div>
                    <div className="flex items-center justify-between gap-3 px-3 h-[42px] bg-slate-50 border border-slate-300 rounded-xl">
                        <span className="text-xs font-semibold text-slate-700">
                            Product Status: <span className={formData.isActive ? 'text-emerald-700' : 'text-rose-600'}>{formData.isActive ? 'Active' : 'Inactive'}</span>
                        </span>
                        <Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} label="Product status" />
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                                                type="submit"
                        disabled={saving}
                        className={`w-full sm:w-auto px-8 min-h-[46px] text-sm font-semibold cursor-pointer transition active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${editingId ? 'bg-amber-500 hover:bg-amber-600 text-white rounded-full' : 'bg-brand-600 text-white'
                            }`}
                    >
                                                {saving ? (editingId ? 'Updating...' : 'Adding...') : editingId ? 'Update Product Details' : 'Add Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;