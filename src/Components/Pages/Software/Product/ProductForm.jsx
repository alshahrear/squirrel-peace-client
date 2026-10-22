import React, { useState, useEffect } from 'react';
import { FaBox, FaBuilding, FaBarcode, FaTags, FaExclamationTriangle, FaDollarSign, FaBalanceScale, FaGift, FaStickyNote, FaTimes, FaEdit, FaSave, FaChevronDown } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ProductForm = ({ formData, setFormData, editingId, setEditingId, fetchProducts, setIsFormOpen, showToast, products = [] }) => {
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);

    const [companyInput, setCompanyInput] = useState('');
    const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);

    const [categoryInput, setCategoryInput] = useState('');
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

    const [unitInput, setUnitInput] = useState('');
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);

    // Parent Unit (data formData তেই থাকে, তাই draft ও edit এ ঠিক থাকবে)
    const [showParentDropdown, setShowParentDropdown] = useState(false);
    const hasParent = formData.hasParent === true;
    const parentQtyNum = Number(formData.parentQty) || 0;
    const unitQtyNum = Number(formData.unitQty) || 0;
    // Parent থাকলে PCS of 1 Unit = Parent Qty × Unit Qty (নিজে থেকে হিসাব হবে)
    const effectivePcs = hasParent ? parentQtyNum * unitQtyNum : Number(formData.pcsOfUnit) || 0;
    // Parent থাকলে সিস্টেমের মূল Unit = Parent Unit
    const effectiveUnitName = hasParent ? (formData.parentUnit || '') : (formData.unit || '');
    const freeTotal = hasParent
        ? (Number(formData.freeProductSubQty) || 0) * unitQtyNum +
        (Number(formData.freeProductPcsQty) || 0)
        : (Number(formData.freeProductPcsQty) || 0);

    useEffect(() => {
        // Company Fetch
        fetch('https://squirrel-peace-server.onrender.com/company')
            .then(res => res.json())
            .then(data => setCompanies(data))
            .catch(err => console.error('Error fetching companies:', err));

        // Category Fetch
        fetch('https://squirrel-peace-server.onrender.com/category')
            .then(res => res.json())
            .then(data => {
                const activeCategories = data.filter(cat => cat.isActive === true);
                setCategories(activeCategories);
            })
            .catch(err => console.error('Error fetching categories:', err));

        // Unit Fetch
        fetch('https://squirrel-peace-server.onrender.com/unit')
            .then(res => res.json())
            .then(data => {
                const activeUnits = data.filter(u => u.isActive === true);
                setUnits(activeUnits);
            })
            .catch(err => console.error('Error fetching units:', err));
    }, []);

    // Sync inputs when formData changes (e.g. on Edit mode load or reset)
    useEffect(() => {
        setCompanyInput(formData.company || '');
        setCategoryInput(formData.category || '');
        setUnitInput(formData.unit || '');
    }, [formData]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            productName: '',
            company: '',
            sku: '',
            category: '',
            alertQuantity: '',
            purchasePrice: '',
            sellingPrice: '',
            mrp: '',
            unit: '',
            pcsOfUnit: '',
            freeProductUnitQty: '',
            freeProductSubQty: '',
            freeProductPcsQty: '',
            hasParent: false,
            parentUnit: '',
            parentQty: '',
            unitQty: '',
            note: '',
            isActive: true
        });
        setCompanyInput('');
        setCategoryInput('');
        setUnitInput('');
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
        const strTime = `${hours}:${minutes}:${seconds} ${ampm}`;
        return `${day}/${month}/${year}, ${strTime}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const isEditing = Boolean(editingId);

        const nameInput = formData.productName.trim().toLowerCase();
        const companyInput = formData.company.trim().toLowerCase();

        const isDuplicate = products.some(
            (p) =>
                p.productName?.trim().toLowerCase() === nameInput &&
                p.company?.trim().toLowerCase() === companyInput &&
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
        const finalData = isEditing
            ? baseData
            : { ...baseData, createdAt: getFormattedDateTime() };

        try {
            let response;
            if (isEditing) {
                response = await fetch(`https://squirrel-peace-server.onrender.com/product/${editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalData),
                });
            } else {
                response = await fetch('https://squirrel-peace-server.onrender.com/product', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalData),
                });
            }

            const data = await response.json();
            if (data.insertedId || data.modifiedCount > 0 || data.matchedCount > 0) {
                if (showToast) {
                    showToast(isEditing ? 'Product updated successfully!' : 'Product added successfully!', 'success');
                }

                handleCancelEdit();
                if (fetchProducts) fetchProducts();
                if (setIsFormOpen) setIsFormOpen(false);

                setTimeout(() => {
                    const tableSection = document.getElementById('product-table-section');
                    if (tableSection) {
                        tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 150);
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-indigo-100 backdrop-blur-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    {editingId ? <span className="text-indigo-600 flex items-center gap-2"><FaEdit /> Edit Product</span> : <span className="text-indigo-600 flex items-center gap-2"><FaSave /> Add New Product</span>}
                </h2>
                {editingId && (
                    <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="flex items-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2.5 py-1 rounded-full transition-all"
                    >
                        <FaTimes /> Cancel Edit
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {/* Product Name */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaBox className="text-indigo-500" /> Product Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="productName"
                            placeholder="Enter product name"
                            value={formData.productName}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Company */}
                    <div className="relative">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaBuilding className="text-indigo-500" /> Company <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Select or type company"
                                value={companyInput}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCompanyInput(val);
                                    setShowCompanyDropdown(true);
                                    setFormData({ ...formData, company: val });
                                }}
                                onFocus={() => setShowCompanyDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCompanyDropdown(false), 200)}
                                required
                                className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                            />
                            <span
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer pointer-events-none"
                                onClick={() => setShowCompanyDropdown(!showCompanyDropdown)}
                            >
                                <FaChevronDown className="text-xs" />
                            </span>
                        </div>
                        {showCompanyDropdown && (
                            <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {companies
                                    .filter(c => c.businessName.toLowerCase().includes(companyInput.toLowerCase()))
                                    .length > 0 ? (
                                    companies
                                        .filter(c => c.businessName.toLowerCase().includes(companyInput.toLowerCase()))
                                        .map((comp) => (
                                            <li
                                                key={comp._id}
                                                onClick={() => {
                                                    setCompanyInput(comp.businessName);
                                                    setFormData({ ...formData, company: comp.businessName });
                                                    setShowCompanyDropdown(false);
                                                }}
                                                className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer text-gray-700"
                                            >
                                                {comp.businessName}
                                            </li>
                                        ))
                                ) : (
                                    <li className="px-3 py-2 text-sm text-gray-400 italic">No company found</li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* SKU */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaBarcode className="text-indigo-500" /> SKU
                        </label>
                        <input
                            type="text"
                            name="sku"
                            placeholder="SKU code"
                            value={formData.sku}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Category */}
                    <div className="relative">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaTags className="text-indigo-500" /> Category
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Select or type category"
                                value={categoryInput}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setCategoryInput(val);
                                    setShowCategoryDropdown(true);
                                    setFormData({ ...formData, category: val });
                                }}
                                onFocus={() => setShowCategoryDropdown(true)}
                                onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                                className="w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                            />
                            <span
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer pointer-events-none"
                                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                            >
                                <FaChevronDown className="text-xs" />
                            </span>
                        </div>
                        {showCategoryDropdown && (
                            <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                {categories
                                    .filter(cat => cat.name.toLowerCase().includes(categoryInput.toLowerCase()))
                                    .length > 0 ? (
                                    categories
                                        .filter(cat => cat.name.toLowerCase().includes(categoryInput.toLowerCase()))
                                        .map((cat) => (
                                            <li
                                                key={cat._id}
                                                onClick={() => {
                                                    setCategoryInput(cat.name);
                                                    setFormData({ ...formData, category: cat.name });
                                                    setShowCategoryDropdown(false);
                                                }}
                                                className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer text-gray-700"
                                            >
                                                {cat.name}
                                            </li>
                                        ))
                                ) : (
                                    <li className="px-3 py-2 text-sm text-gray-400 italic">No category found</li>
                                )}
                            </ul>
                        )}
                    </div>

                    {/* Alert Quantity */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaExclamationTriangle className="text-indigo-500" /> Alert Quantity (PCS)
                        </label>
                        <input
                            type="number"
                            name="alertQuantity"
                            placeholder="0"
                            value={formData.alertQuantity}
                            onChange={(e) => {
                                const value = e.target.value;

                                if (/^\d*$/.test(value)) {
                                    handleChange(e);
                                }
                            }}
                            min="0"
                            step="1"
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Purchase Price */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaDollarSign className="text-indigo-500" /> Purchase Price (PCS)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="purchasePrice"
                            placeholder="0.00"
                            value={formData.purchasePrice}
                            onChange={(e) => {
                                const value = e.target.value;

                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                    handleChange(e);
                                }
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Selling Price */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaDollarSign className="text-indigo-500" /> Selling Price (PCS)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="sellingPrice"
                            placeholder="0.00"
                            value={formData.sellingPrice}
                            onChange={(e) => {
                                const value = e.target.value;

                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                    handleChange(e);
                                }
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* MRP */}
                    <div>
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaDollarSign className="text-indigo-500" /> MRP (PCS)
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            name="mrp"
                            placeholder="0.00"
                            value={formData.mrp}
                            onChange={(e) => {
                                const value = e.target.value;

                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                    handleChange(e);
                                }
                            }}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>
                </div>

                {/* Unit & Stock Configuration */}
                <div className="pt-2">
                    <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-purple-600 rounded-full inline-block"></span>
                        Unit & Stock Configuration
                    </h3>
                    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 items-start ${hasParent ? 'md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.6fr)_minmax(0,1.7fr)]' : 'md:grid-cols-3'}`}>
                        {/* Unit */}
                        <div className="relative">
                            <div className="flex items-center justify-between mb-1.5 h-6">
                                <label className="block text-gray-700 text-xs font-semibold flex items-center gap-1.5">
                                    <FaBalanceScale className="text-indigo-500" /> Unit <span className="text-red-500">*</span>
                                </label>
                                <button
                                    type="button"
                                    onClick={() =>
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
                                        })
                                    }
                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-md border transition cursor-pointer ${hasParent
                                        ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100'
                                        : 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                                        }`}
                                >
                                    {hasParent ? '× Remove Parent' : '+ Parent Unit'}
                                </button>
                            </div>

                            {/* Parent Unit + Qty (একই violet border/color) */}
                            {hasParent && (
                                <div className="relative mb-2">
                                    <span className="absolute -top-2 left-3 z-0 px-1.5 rounded bg-violet-100 text-violet-700 text-[10px] leading-[14px] font-bold pointer-events-none">
                                        Parent Unit
                                    </span>
                                    <div className="flex items-stretch rounded-lg border-2 border-violet-300 bg-violet-50/60 focus-within:ring-2 focus-within:ring-violet-200">
                                        <input
                                            type="text"
                                            placeholder="Select or type parent unit"
                                            value={formData.parentUnit ?? ''}
                                            onChange={(e) => {
                                                setFormData({ ...formData, parentUnit: e.target.value });
                                                setShowParentDropdown(true);
                                            }}
                                            onFocus={() => setShowParentDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowParentDropdown(false), 200)}
                                            required
                                            className="flex-1 min-w-0 px-3 py-2 text-sm bg-transparent outline-none"
                                        />
                                        <input
                                            type="number"
                                            step="1"
                                            placeholder="Qty"
                                            required
                                            min="1"
                                            value={formData.parentQty ?? ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*$/.test(value)) setFormData({ ...formData, parentQty: value });
                                            }}
                                            className="w-28 px-2 py-2 text-sm text-center font-semibold bg-violet-100/70 border-l-2 border-violet-300 rounded-r-md outline-none"
                                        />
                                    </div>
                                    {showParentDropdown && (
                                        <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                            {units.filter(u => u.name.toLowerCase().includes((formData.parentUnit || '').toLowerCase())).length > 0 ? (
                                                units
                                                    .filter(u => u.name.toLowerCase().includes((formData.parentUnit || '').toLowerCase()))
                                                    .map((u) => (
                                                        <li
                                                            key={u._id}
                                                            onClick={() => {
                                                                setFormData({ ...formData, parentUnit: u.name });
                                                                setShowParentDropdown(false);
                                                            }}
                                                            className="px-3 py-2 text-sm hover:bg-violet-50 cursor-pointer text-gray-700"
                                                        >
                                                            {u.name}
                                                        </li>
                                                    ))
                                            ) : (
                                                <li className="px-3 py-2 text-sm text-gray-400 italic">No unit found</li>
                                            )}
                                        </ul>
                                    )}
                                </div>
                            )}

                            {/* Unit + Qty (Parent থাকলে নিচে ঢুকানো, একই indigo border/color) */}
                            <div className={hasParent ? 'relative ml-4 pl-3' : 'relative'}>
                                {hasParent && (
                                    <span className="absolute left-0 -top-2 w-3 h-[calc(50%+0.5rem)] border-l-2 border-b-2 border-gray-300 rounded-bl-lg pointer-events-none" />
                                )}
                                <div
                                    className={hasParent
                                        ? 'flex items-stretch rounded-lg border-2 border-indigo-300 bg-indigo-50/60 focus-within:ring-2 focus-within:ring-indigo-200'
                                        : 'relative'}
                                >
                                    <div className="relative flex-1 min-w-0">
                                        <input
                                            type="text"
                                            placeholder="Select or type unit"
                                            value={unitInput}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setUnitInput(val);
                                                setShowUnitDropdown(true);
                                                setFormData({ ...formData, unit: val });
                                            }}
                                            onFocus={() => setShowUnitDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowUnitDropdown(false), 200)}
                                            required
                                            className={hasParent
                                                ? 'w-full px-3 py-2 pr-8 text-sm bg-transparent outline-none'
                                                : 'w-full px-3 py-2 pr-8 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50'}
                                        />
                                        <span
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer pointer-events-none"
                                            onClick={() => setShowUnitDropdown(!showUnitDropdown)}
                                        >
                                            <FaChevronDown className="text-xs" />
                                        </span>
                                    </div>
                                    {hasParent && (
                                        <input
                                            type="number"
                                            step="1"
                                            placeholder="Qty"
                                            required
                                            min="1"
                                            value={formData.unitQty ?? ''}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*$/.test(value)) setFormData({ ...formData, unitQty: value });
                                            }}
                                            className="w-28 px-2 py-2 text-sm text-center font-semibold bg-indigo-100/70 border-l-2 border-indigo-300 rounded-r-md outline-none"
                                        />
                                    )}
                                </div>
                                {showUnitDropdown && (
                                    <ul className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                        {units
                                            .filter(u => u.name.toLowerCase().includes(unitInput.toLowerCase()))
                                            .length > 0 ? (
                                            units
                                                .filter(u => u.name.toLowerCase().includes(unitInput.toLowerCase()))
                                                .map((u) => (
                                                    <li
                                                        key={u._id}
                                                        onClick={() => {
                                                            setUnitInput(u.name);
                                                            setFormData({ ...formData, unit: u.name });
                                                            setShowUnitDropdown(false);
                                                        }}
                                                        className="px-3 py-2 text-sm hover:bg-indigo-50 cursor-pointer text-gray-700"
                                                    >
                                                        {u.name}
                                                    </li>
                                                ))
                                        ) : (
                                            <li className="px-3 py-2 text-sm text-gray-400 italic">No unit found</li>
                                        )}
                                    </ul>
                                )}
                            </div>

                        </div>

                        {/* PCS of 1 Unit */}
                        {(
                            <div>
                                <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5 h-6">
                                    <FaBalanceScale className="text-indigo-500" /> PCS of 1 Unit <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="pcsOfUnit"
                                    placeholder="e.g. 10"
                                    value={hasParent ? (effectivePcs || '') : formData.pcsOfUnit}
                                    readOnly={hasParent}
                                    title={hasParent ? 'Parent Qty × Unit Qty থেকে নিজে থেকে হিসাব হচ্ছে' : ''}
                                    style={hasParent ? { backgroundColor: '#f1f5f9', cursor: 'not-allowed', textAlign: 'center', paddingLeft: '4px', paddingRight: '4px' } : undefined}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        if (/^\d*$/.test(value)) {
                                            handleChange(e);
                                        }
                                    }}
                                    required
                                    min="0"
                                    step="1"
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                                />
                            </div>
                        )}

                        {/* Free Product Qty */}
                        <div className="relative">
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5 h-6">
                                <FaGift className="text-indigo-500" /> Free Product Qty
                            </label>
                            <div
                                className={`absolute -top-1 left-1/2 -translate-x-1/2 z-0 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${freeTotal > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                            >
                                Total: {freeTotal}
                            </div>
                            {hasParent ? (
                                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">

                                    <input
                                        type="number"
                                        name="freeProductSubQty"
                                        value={formData.freeProductSubQty ?? ''}
                                        onChange={(e) => { if (/^\d*$/.test(e.target.value)) handleChange(e); }}
                                        min="0"
                                        step="1"
                                        className="w-0 flex-1 min-w-0 px-1 py-2 text-sm bg-transparent outline-none text-center"
                                    />
                                    <span className="bg-gradient-to-br from-indigo-500 to-blue-500 text-white text-[10px] px-1 py-2.5 text-center font-semibold select-none max-w-[22%] truncate">
                                        {formData.unit || 'Unit'}
                                    </span>
                                    <input
                                        type="number"
                                        name="freeProductPcsQty"
                                        value={formData.freeProductPcsQty ?? ''}
                                        onChange={(e) => { if (/^\d*$/.test(e.target.value)) handleChange(e); }}
                                        min="0"
                                        step="1"
                                        className="w-0 flex-1 min-w-0 px-1 py-2 text-sm bg-transparent outline-none text-center"
                                    />
                                    <span className="bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-[10px] px-1 py-2.5 text-center font-semibold select-none">
                                        Pcs
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50/50 overflow-hidden focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200">

                                    <input
                                        type="number"
                                        name="freeProductPcsQty"
                                        placeholder="0"
                                        value={formData.freeProductPcsQty}
                                        onChange={(e) => {
                                            const value = e.target.value;

                                            if (/^\d*$/.test(value)) {
                                                handleChange(e);
                                            }
                                        }}
                                        min="0"
                                        step="1"
                                        className="flex-1 min-w-0 px-2 py-2 text-sm bg-transparent outline-none text-center"
                                    />
                                    <span className="bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none">
                                        Pcs
                                    </span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Note & Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 items-end">
                    <div className="md:col-span-2">
                        <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                            <FaStickyNote className="text-indigo-500" /> Note
                        </label>
                        <input
                            type="text"
                            name="note"
                            placeholder="Write additional notes here..."
                            value={formData.note}
                            onChange={handleChange}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50"
                        />
                    </div>

                    <div className="flex items-center justify-between px-3 py-2 text-sm bg-gray-50/50 border border-gray-200 rounded-lg h-[38px]">
                        <div>
                            <span className="text-xs font-semibold text-gray-700 block">Product Status</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            <span className="ml-2 text-xs font-bold text-gray-700 w-12">
                                {formData.isActive ? 'Active' : 'Inactive'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-2">
                    <button
                        type="submit"
                        className={`px-6 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${editingId
                            ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {editingId ? 'Update Product Details' : 'Submit Product'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;