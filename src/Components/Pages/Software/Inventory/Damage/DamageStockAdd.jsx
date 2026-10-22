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

const matchesSearch = (searchText, fields) => {
    const q = (searchText || '').toLowerCase();
    return fields.some((f) => String(f || '').toLowerCase().includes(q));
};

// ---------- Local Search Select ----------
const SearchSelect = ({
    label, required = false, hint = '', placeholder, searchValue, onSearchChange,
    onClear, onSelect, items, getKey, renderItem, emptyText = 'No data found', disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="relative" ref={ref}>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label} {required && <span className="text-rose-500">*</span>}{' '}
                {hint && <span className="text-xs text-amber-500 font-normal">{hint}</span>}
            </label>
            <div
                onClick={() => !disabled && setIsOpen(true)}
                className={`w-full px-4 py-3.5 rounded-2xl border text-sm shadow-sm flex items-center justify-between ${disabled ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75' : 'border-slate-200 bg-slate-50/70 cursor-pointer focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100'}`}
            >
                <input
                    type="text"
                    disabled={disabled}
                    placeholder={placeholder}
                    value={searchValue}
                    onChange={(e) => {
                        onSearchChange(e.target.value);
                        setIsOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-sm"
                />
                {searchValue && !disabled && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                            setIsOpen(false);
                        }}
                        className="text-slate-400 hover:text-rose-500 p-0.5"
                    >
                        ✕
                    </button>
                )}
            </div>
            {isOpen && !disabled && (
                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-red-100 max-h-60 overflow-y-auto">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <div
                                key={getKey(item)}
                                onClick={() => {
                                    onSelect(item);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-red-50 cursor-pointer border-b border-slate-50 last:border-none"
                            >
                                {renderItem(item)}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 text-center">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
};

// ---------- Qty box (number + unit label) ----------
const QtyBox = ({ value, onChange, label, grad, border }) => (
    <div className={`flex items-center border ${border} rounded-xl bg-white overflow-hidden w-full shadow-sm`}>
        <input
            type="number" min="0" step="1" placeholder="0"
            value={value ?? ''}
            onChange={(e) => /^\d*$/.test(e.target.value) && onChange(e.target.value)}
            className="w-14 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
        />
        <span className={`flex-1 bg-gradient-to-br ${grad} text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate`} title={label}>
            {label}
        </span>
    </div>
);

// ---------- Item helpers ----------
const buildItem = (product) => {
    const isParent = product.parentUnitUse === true;
    const pcsPerUnit = Number(product.pcsOfUnit) || 1;
    const pcsPerSub = isParent ? (Number(product.subUnitQty) || 1) : 0;
    const sellingPrice = Number(product.sellingPrice) || 0;

    return {
        uniqueId: Date.now() + Math.random(),
        _id: product._id,
        productName: product.productName || '',
        company: product.company || '',
        sku: product.sku || null,

        sellPricePcs: sellingPrice,
        sellPriceUnit: roundTo2(sellingPrice * pcsPerUnit),
        sellPriceSub: isParent ? roundTo2(sellingPrice * pcsPerSub) : '',

        unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
        parentMode: isParent,
        subUnit: isParent ? (product.subUnit || '') : '',
        pcsPerSub,
        subQty: '',

        unitQty: '',
        pcsQty: '',
        pcsPerUnit,
        totalQty: 0,

        freeUnitQty: '',
        freeSubQty: '',
        freePcsQty: '',
        freeQty: 0,

        baseFreeUnitQty: isParent ? 0 : (Number(product.freeProductUnitQty) || 0),
        baseFreeSubQty: isParent ? (Number(product.freeProductSubQty) || 0) : 0,
        baseFreePcsQty: Number(product.freeProductPcsQty) || 0,
    };
};

const applyItemChange = (item, field, value) => {
    if (item.parentMode && ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
        const numVal = value === '' ? '' : Number(value) || 0;
        const next = { ...item, [field]: numVal };
        const ppu = Number(next.pcsPerUnit) || 1;
        const pps = Number(next.pcsPerSub) || 0;
        next.totalQty =
            (Number(next.unitQty) || 0) * ppu +
            (Number(next.subQty) || 0) * pps +
            (Number(next.pcsQty) || 0);
        if (field === 'unitQty' || field === 'subQty') {
            const u = Number(next.unitQty) || 0;
            const s = Number(next.subQty) || 0;
            next.freeSubQty = u * (Number(item.baseFreeSubQty) || 0) || '';
            next.freePcsQty = (u + s) * (Number(item.baseFreePcsQty) || 0) || '';
        }
        next.freeQty =
            (Number(next.freeUnitQty) || 0) * ppu +
            (Number(next.freeSubQty) || 0) * pps +
            (Number(next.freePcsQty) || 0);
        return next;
    }

    if (field === 'unitQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const pcsQtyVal = Number(item.pcsQty) || 0;
        const ppu = Number(item.pcsPerUnit) || 1;
        const newFreeUnitQty = numVal * (Number(item.baseFreeUnitQty) || 0);
        const newFreePcsQty = numVal * (Number(item.baseFreePcsQty) || 0);
        return {
            ...item,
            unitQty: value === '' ? '' : numVal,
            totalQty: numVal * ppu + pcsQtyVal,
            freeUnitQty: newFreeUnitQty || '',
            freePcsQty: newFreePcsQty || '',
            freeQty: newFreeUnitQty * ppu + newFreePcsQty,
        };
    }

    if (field === 'sellPriceUnit') {
        const unitPriceVal = value === '' ? 0 : Number(value) || 0;
        const ppu = Number(item.pcsPerUnit) || 1;
        const pps = Number(item.pcsPerSub) || 0;
        return {
            ...item,
            sellPriceUnit: value,
            sellPricePcs: roundTo2(unitPriceVal / ppu),
            ...(item.parentMode ? { sellPriceSub: roundTo2((unitPriceVal / ppu) * pps) } : {}),
        };
    }

    if (field === 'sellPriceSub') {
        const subPriceVal = value === '' ? 0 : Number(value) || 0;
        const pps = Number(item.pcsPerSub) || 1;
        return {
            ...item,
            sellPriceSub: value,
            sellPricePcs: value === '' ? '' : roundTo2(subPriceVal / pps),
        };
    }

    if (field === 'pcsQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const unitQtyVal = Number(item.unitQty) || 0;
        return {
            ...item,
            pcsQty: value === '' ? '' : numVal,
            totalQty: unitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal,
        };
    }

    if (field === 'freeUnitQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const freePcsQtyVal = Number(item.freePcsQty) || 0;
        return {
            ...item,
            freeUnitQty: value === '' ? '' : numVal,
            freeQty: numVal * (Number(item.pcsPerUnit) || 1) + freePcsQtyVal,
        };
    }

    if (field === 'freePcsQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const freeUnitQtyVal = Number(item.freeUnitQty) || 0;
        return {
            ...item,
            freePcsQty: value === '' ? '' : numVal,
            freeQty: freeUnitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal,
        };
    }

    return { ...item, [field]: value };
};

const restoreItem = (item, index) => {
    const unitQty = Number(item.unitQty) || 0;
    const subQty = Number(item.subQty) || 0;
    const pcsPerUnit =
        Number(item.pcsPerUnit) > 0
            ? Number(item.pcsPerUnit)
            : Number(item.sellPricePcs) > 0
                ? roundTo2(Number(item.sellPriceUnit) / Number(item.sellPricePcs)) || 1
                : 1;
    const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
    const freeSubQtyNum = Number(item.freeSubQty) || 0;
    const freePcsQtyNum = Number(item.freePcsQty) || 0;

    return {
        ...item,
        uniqueId: `${item.productId || 'item'}-${index}-${Date.now()}`,
        _id: item.productId,
        unitQty: unitQty || '',
        subQty: subQty || '',
        pcsQty: item.pcsQty || '',
        pcsPerUnit,
        totalQty: Number(item.totalQty) || 0,
        freeUnitQty: freeUnitQtyNum || '',
        freeSubQty: freeSubQtyNum || '',
        freePcsQty: freePcsQtyNum || '',
        freeQty: Number(item.freeQty) || 0,
        baseFreeUnitQty: unitQty > 0 ? roundTo2(freeUnitQtyNum / unitQty) : 0,
        baseFreeSubQty: unitQty > 0 ? roundTo2(freeSubQtyNum / unitQty) : 0,
        baseFreePcsQty: item.parentMode === true
            ? ((unitQty + subQty) > 0 ? roundTo2(freePcsQtyNum / (unitQty + subQty)) : 0)
            : (unitQty > 0 ? roundTo2(freePcsQtyNum / unitQty) : 0),
    };
};

const getUnitTotal = (i) => (Number(i.unitQty) || 0) * (Number(i.sellPriceUnit) || 0);
const getPcsTotal = (i) => (Number(i.pcsQty) || 0) * (Number(i.sellPricePcs) || 0);
const getSubTotal = (i) => (Number(i.subQty) || 0) * (Number(i.sellPriceSub) || 0);
const getRowGross = (i) => getUnitTotal(i) + getSubTotal(i) + getPcsTotal(i);

const DamageStockAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingDamage = location.state?.damage || null;
    const isEditMode = !!editingDamage;
    const editId = editingDamage?._id || null;

    const [formData, setFormData] = useState({
        customerId: editingDamage?.customerId || '',
        customer: editingDamage?.customer || '',
        customerContact: editingDamage?.phone || '',
        customerAddress: editingDamage?.address || '',
        company: editingDamage?.company || '',
        category: editingDamage?.category || '',
        date: editingDamage?.damageDate || getFormattedToday(),
    });

    const [customers, setCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [stockMap, setStockMap] = useState(null);

    const [search, setSearch] = useState({
        customer: editingDamage?.customer || '',
        company: editingDamage?.company || '',
        category: editingDamage?.category || '',
        product: '',
    });
    const updateSearch = (key, value) => setSearch((p) => ({ ...p, [key]: value }));
    const updateForm = (fields) => setFormData((p) => ({ ...p, ...fields }));

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editingDamage?.note || '');
    const [toast, setToast] = useState({ show: false, message: '', isError: false });
    const [isSaving, setIsSaving] = useState(false);
    const dateInputRef = useRef(null);

    const showToast = (message, isError = false) => {
        setToast({ show: true, message, isError });
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
    };

    // ---------- Fetch ----------
    useEffect(() => {
        const load = (endpoint, setter, filterFn) =>
            fetch(`https://squirrel-peace-server.onrender.com/${endpoint}`)
                .then((r) => r.json())
                .then((d) => setter(Array.isArray(d) ? (filterFn ? d.filter(filterFn) : d) : []))
                .catch((e) => console.error(e));
        load('customer', setCustomers);
        load('company', setCompanies);
        load('category', setCategories, (c) => c.isActive === true);
        load('product', setProducts);
        fetch(`https://squirrel-peace-server.onrender.com/bulk-return-stock${editId ? `?excludeDamageId=${editId}` : ''}`)
            .then((r) => r.json())
            .then((d) => setStockMap(d && typeof d === 'object' ? d : {}))
            .catch((e) => console.error(e));
    }, []);

    // ---------- Edit prefill ----------
    useEffect(() => {
        if (editingDamage) {
            setItems((editingDamage.items || []).map(restoreItem));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Customer ----------
    const filteredCustomers = customers
        .filter((c) => c.customerType === 'Wholesale Customer')
        .filter((c) => matchesSearch(search.customer, [c.businessName, c.contactNumber, c.address, c.route]));

    const handleSelectCustomer = (c) => {
        updateForm({
            customerId: c._id,
            customer: c.businessName,
            customerContact: c.contactNumber || '',
            customerAddress: c.address || '',
        });
        updateSearch('customer', c.businessName);
    };

    const handleClearCustomer = () => {
        updateSearch('customer', '');
        updateForm({ customerId: '', customer: '', customerContact: '', customerAddress: '' });
    };

    // ---------- Company (optional) ----------
    const filteredCompanies = companies.filter((c) =>
        matchesSearch(search.company, [c.businessName, c.contactNumber, c.address])
    );

    const handleSelectCompany = (c) => {
        updateForm({ company: c.businessName });
        updateSearch('company', c.businessName);
        updateSearch('product', '');
    };

    const handleClearCompany = () => {
        updateForm({ company: '' });
        updateSearch('company', '');
        updateSearch('product', '');
    };

    // ---------- Category ----------
    const filteredCategories = categories.filter((c) => matchesSearch(search.category, [c.name]));

    const handleSelectCategory = (cat) => {
        updateForm({ category: cat.name });
        updateSearch('category', cat.name);
        updateSearch('product', '');
    };

    const handleClearCategory = () => {
        updateForm({ category: '' });
        updateSearch('category', '');
        updateSearch('product', '');
    };

    // ---------- Date ----------
    const handleDateChange = (e) => {
        const raw = e.target.value;
        if (raw) {
            const [y, m, d] = raw.split('-');
            const formatted = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            updateForm({ date: formatted });
        }
    };

    // ---------- Product ----------
    const isProductEnabled = true;

    const filteredProducts = products.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (formData.company && prod.company !== formData.company) return false;
        if (formData.category && prod.category !== formData.category) return false;
        if (items.some((i) => i._id === prod._id || i.productName === prod.productName)) return false;
        return matchesSearch(search.product, [prod.productName, prod.sku]);
    });

    const handleSelectProduct = (product) => {
        setItems((prev) => [...prev, buildItem(product)]);
        updateSearch('product', '');
    };

    const handleRemoveItem = (uniqueId) =>
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));

    const getStock = (item) =>
        stockMap
            ? stockMap[String(item._id)] || stockMap[`name:${item.productName}`] || { paid: 0, free: 0 }
            : null;

    const handleItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        const item = items.find((i) => i.uniqueId === uniqueId);
        if (!item) return;
        const next = applyItemChange(item, field, value);

        if (
            !formData.customerId &&
            ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)
        ) {
            const stock = getStock(item);
            if (stock) {
                if (Number(next.totalQty) > stock.paid) {
                    return showToast(`Main stock e matro ${stock.paid} pcs ache!`, true);
                }
                if (Number(next.freeQty) > stock.free) {
                    return showToast(`Free stock e matro ${stock.free} pcs ache!`, true);
                }
            }
        }

        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
    };

    // ---------- Totals ----------
    const subTotal = roundTo2(items.reduce((t, i) => t + getRowGross(i), 0));
    const damageAmount = subTotal;
    const uniqueUnits = [...new Set(items.map((i) => i.unit || 'Pcs'))];
    const sellPriceUnitLabel = uniqueUnits.length === 1 ? uniqueUnits[0] : 'Unit';

    // ---------- Submit ----------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;


        if (!formData.date) return showToast('Date is required!', true);
        if (items.length === 0) return showToast('Please add at least one product!', true);
        if (items.some((i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0)) {
            return showToast('Each product must have a valid quantity!', true);
        }

        if (!formData.customerId && stockMap) {
            for (const i of items) {
                const st = getStock(i);
                if (st && (Number(i.totalQty) > st.paid || Number(i.freeQty) > st.free)) {
                    return showToast(`${i.productName}: stock e Main ${st.paid}, Free ${st.free} pcs ache!`, true);
                }
            }
        }

        const itemsPayload = items.map((i) => ({
            productId: i._id,
            productName: i.productName,
            company: i.company,
            sku: i.sku,
            sellPricePcs: roundTo2(i.sellPricePcs),
            sellPriceUnit: roundTo2(i.sellPriceUnit),
            sellPriceSub: roundTo2(i.sellPriceSub),
            unit: i.unit || 'Pcs',
            parentMode: i.parentMode === true,
            subUnit: i.subUnit || '',
            pcsPerUnit: Number(i.pcsPerUnit) || 1,
            pcsPerSub: Number(i.pcsPerSub) || 0,
            unitQty: Number(i.unitQty) || 0,
            subQty: Number(i.subQty) || 0,
            pcsQty: Number(i.pcsQty) || 0,
            totalQty: Number(i.totalQty) || 0,
            freeUnitQty: Number(i.freeUnitQty) || 0,
            freeSubQty: Number(i.freeSubQty) || 0,
            freePcsQty: Number(i.freePcsQty) || 0,
            freeQty: Number(i.freeQty) || 0,
            itemTotal: roundTo2(getRowGross(i)),
        }));

        const payload = {
            invoiceNo: isEditMode ? editingDamage.invoiceNo : generateInvoiceNo(),
            customerId: formData.customerId,
            customer: formData.customer,
            phone: formData.customerContact,
            address: formData.customerAddress,
            company: formData.company,
            category: formData.category,
            damageDate: formData.date,
            items: itemsPayload,
            damageAmount,
            note,
        };

        try {
            setIsSaving(true);
            const url = isEditMode
                ? `https://squirrel-peace-server.onrender.com/sales-damage/${editId}`
                : 'https://squirrel-peace-server.onrender.com/sales-damage';
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
            showToast(isEditMode ? 'Damage updated successfully!' : 'Damage added successfully!');
            setTimeout(() => navigate('/damage-products', { replace: true, state: null }), 1000);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save damage. Try again.', true);
        }
    };

    const inputCls =
        'w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-700 shadow-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100';

    const trashIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
        </svg>
    );

    return (
        <div>
            {toast.show && (
                <div className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white ${toast.isError ? 'bg-rose-600' : 'bg-gradient-to-br from-teal-600 to-emerald-500'}`}>
                    {toast.message}
                </div>
            )}

            {/* ---------------- Top Form ---------------- */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 my-8 relative z-20">
                <div className="bg-white rounded-3xl shadow-lg shadow-red-900/5 p-6 md:p-8 border border-red-100/70">
                    <div className="mb-6 pb-4 border-b border-red-100">
                        <h3 className="text-xl font-bold text-slate-800">
                            {isEditMode ? 'Edit Damage' : 'Add Damage'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Select customer and damaged products</p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <SearchSelect
                                label="Customer"
                                placeholder="Search or select customer (optional)..."
                                searchValue={search.customer}
                                onSearchChange={(text) => {
                                    updateSearch('customer', text);
                                    if (formData.customerId) {
                                        updateForm({ customerId: '', customer: '', customerContact: '', customerAddress: '' });
                                    }
                                }}
                                onClear={handleClearCustomer}
                                onSelect={handleSelectCustomer}
                                items={filteredCustomers}
                                getKey={(c) => c._id}
                                emptyText="No wholesale customer found"
                                renderItem={(c) => (
                                    <>
                                        <p className="text-sm font-semibold text-slate-800">{c.businessName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">📞 {c.contactNumber} | 📍 {c.address}</p>
                                    </>
                                )}
                            />

                            <SearchSelect
                                label="Filter by Company"
                                placeholder="Search or select company (optional)..."
                                searchValue={search.company}
                                onSearchChange={(text) => {
                                    updateSearch('company', text);
                                    updateForm({ company: '' });
                                }}
                                onClear={handleClearCompany}
                                onSelect={handleSelectCompany}
                                items={filteredCompanies}
                                getKey={(c) => c._id}
                                emptyText="No company found"
                                renderItem={(c) => (
                                    <>
                                        <p className="text-sm font-semibold text-slate-800">{c.businessName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">📞 {c.contactNumber} | 📍 {c.address}</p>
                                    </>
                                )}
                            />

                            <div className="order-last">
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Date <span className="text-rose-500">*</span></label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                                >
                                    <input ref={dateInputRef} type="date" onChange={handleDateChange} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                                    <input type="text" readOnly value={formData.date} placeholder="Select date" className={`${inputCls} cursor-pointer pointer-events-none`} />
                                </div>
                            </div>

                            <SearchSelect
                                label="Filter by Category"
                                placeholder="Search or select category..."
                                searchValue={search.category}
                                onSearchChange={(text) => {
                                    updateSearch('category', text);
                                    updateForm({ category: '' });
                                }}
                                onClear={handleClearCategory}
                                onSelect={handleSelectCategory}
                                items={filteredCategories}
                                getKey={(c) => c._id}
                                emptyText="No active category found"
                                renderItem={(c) => <p className="text-sm font-semibold text-slate-800">{c.name}</p>}
                            />
                        </div>

                        <SearchSelect
                            label="Select Product"
                            required
                            hint={
                                formData.company || formData.category
                                    ? `(Filtered by ${[formData.company, formData.category].filter(Boolean).join(' • ')})`
                                    : ''
                            }
                            placeholder="Search or select product..."
                            searchValue={search.product}
                            onSearchChange={(text) => updateSearch('product', text)}
                            onClear={() => updateSearch('product', '')}
                            onSelect={handleSelectProduct}
                            items={filteredProducts}
                            getKey={(p) => p._id}
                            emptyText="No matching product found"
                            renderItem={(prod) => (
                                <div className="flex justify-between items-center gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Company: {prod.company}{prod.category ? ` | Category: ${prod.category}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {prod.sellingPrice && (
                                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium border border-emerald-100">৳{prod.sellingPrice}</span>
                                        )}
                                        {prod.sku && (
                                            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium border border-amber-100">SKU: {prod.sku}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>

            {/* ---------------- Table + Summary ---------------- */}
            <div className="w-full px-0 sm:px-1 my-6 relative z-0">
                <div className="bg-white rounded-3xl shadow-xl shadow-red-900/5 p-6 md:p-8 border border-red-100/70">
                    <form onSubmit={handleSubmit}>
                        <div className="overflow-x-auto rounded-2xl border border-red-200">
                            <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                <colgroup>
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '8%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '11%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '5%' }} />
                                </colgroup>
                                <thead>
                                    <tr className="bg-red-100/70 border-b-2 border-red-200 text-xs font-semibold text-red-800">
                                        <th className="py-3 px-3">Product Name</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                        <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                        <th className="py-3 pl-4 pr-1">Free Unit</th>
                                        <th className="py-3 pl-3 pr-2">Free PCS</th>
                                        <th className="py-3 px-3">Sell Price ({sellPriceUnitLabel})</th>
                                        <th className="py-3 px-3">Sell Price (PCS)</th>
                                        <th className="py-3 px-3">Item Total</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-100 text-sm">
                                    {items.length > 0 ? (
                                        items.map((item) => {
                                            const rowGross = getRowGross(item);
                                            const unitLabel = item.unit || 'Pcs';
                                            const ch = (field) => (v) => handleItemChange(item.uniqueId, field, v);
                                            return (
                                                <tr key={item.uniqueId} className="hover:bg-red-50/40 transition">
                                                    <td className="py-3 px-2 leading-tight">
                                                        <div className="font-semibold text-slate-800">{item.productName}</div>
                                                    </td>
                                                    <td className="py-3 px-2 text-slate-600 text-xs">{item.company}</td>

                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.totalQty) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {item.totalQty}{!formData.customerId && ` | Stock: ${getStock(item)?.paid ?? '...'}`}
                                                        </div>
                                                        <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl">
                                                            <QtyBox value={item.unitQty} onChange={ch('unitQty')} label={unitLabel} grad="from-indigo-500 to-violet-500" border="border-indigo-200" />
                                                            {item.parentMode && (
                                                                <div className="mt-1.5">
                                                                    <QtyBox value={item.subQty} onChange={ch('subQty')} label={item.subUnit} grad="from-fuchsia-500 to-pink-500" border="border-indigo-200" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-3 pl-0 pr-2">
                                                        <div className="p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl">
                                                            <input
                                                                type="number" min="0" step="1" placeholder="0"
                                                                value={item.pcsQty}
                                                                onChange={(e) => /^\d*$/.test(e.target.value) && ch('pcsQty')(e.target.value)}
                                                                className="w-full px-3 py-2.5 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {item.freeQty}{!formData.customerId && ` | Stock: ${getStock(item)?.free ?? '...'}`}
                                                        </div>
                                                        <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                            <QtyBox value={item.freeUnitQty} onChange={ch('freeUnitQty')} label={unitLabel} grad="from-emerald-500 to-teal-500" border="border-emerald-200" />
                                                            {item.parentMode && (
                                                                <div className="mt-1.5">
                                                                    <QtyBox value={item.freeSubQty} onChange={ch('freeSubQty')} label={item.subUnit} grad="from-fuchsia-500 to-pink-500" border="border-emerald-200" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-3 pl-0 pr-2">
                                                        <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                            <input
                                                                type="number" min="0" step="1" placeholder="0"
                                                                value={item.freePcsQty}
                                                                onChange={(e) => /^\d*$/.test(e.target.value) && ch('freePcsQty')(e.target.value)}
                                                                className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="relative py-3 px-2">
                                                        <div className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getUnitTotal(item) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            ৳{getUnitTotal(item).toFixed(2)}
                                                        </div>
                                                        <input
                                                            type="number" min="0" step="0.01" placeholder="0"
                                                            disabled={!(Number(item.unitQty) > 0)}
                                                            value={item.sellPriceUnit}
                                                            onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && ch('sellPriceUnit')(e.target.value)}
                                                            className="w-20 px-2 py-2 rounded-xl border border-indigo-200 bg-indigo-50/60 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                        />
                                                        {item.parentMode && (
                                                            <div className="relative mt-6">
                                                                <div className={`absolute -top-4 left-2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getSubTotal(item) > 0 ? 'bg-fuchsia-100 text-fuchsia-700' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {item.subUnit}: ৳{getSubTotal(item).toFixed(2)}
                                                                </div>
                                                                <input
                                                                    type="number" min="0" step="0.01" placeholder="0"
                                                                    disabled={!(Number(item.subQty) > 0)}
                                                                    value={item.sellPriceSub}
                                                                    onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && ch('sellPriceSub')(e.target.value)}
                                                                    className="w-20 px-2 py-2 rounded-xl border border-fuchsia-200 bg-fuchsia-50/60 text-sm outline-none focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-100 disabled:bg-slate-100 disabled:border-slate-200 disabled:cursor-not-allowed"
                                                                />
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="relative py-3 px-2">
                                                        <div className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getPcsTotal(item) > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            ৳{getPcsTotal(item).toFixed(2)}
                                                        </div>
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            value={item.sellPricePcs}
                                                            disabled={!(Number(item.pcsQty) > 0)}
                                                            onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && ch('sellPricePcs')(e.target.value)}
                                                            className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                        />
                                                    </td>

                                                    <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">{rowGross.toFixed(2)}</td>

                                                    <td className="py-3 px-1 text-center">
                                                        <button type="button" onClick={() => handleRemoveItem(item.uniqueId)} className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition cursor-pointer">
                                                            {trashIcon}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="10" className="text-center py-8 text-slate-400 text-sm">
                                                No products added yet. Please select a product above.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Summary */}
                        <div className="mt-6 flex justify-end">
                            <div className="w-full md:w-[700px] space-y-2.5 bg-red-50/40 border border-red-100 rounded-2xl p-5">
                                <div className="flex items-center">
                                    <label className="w-56 text-right pr-3 text-sm font-bold text-red-800">Damage Amount</label>
                                    <input type="text" readOnly value={damageAmount.toFixed(2)} className="flex-1 px-3 py-2.5 border border-red-200 bg-white font-bold text-red-700 text-base rounded-lg outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Note */}
                        <div className="mt-8">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Damage Note</label>
                            <textarea
                                rows="3"
                                placeholder="Write any note about this damage..."
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-y shadow-sm"
                            />
                        </div>

                        {/* Button */}
                        <div className="mt-6 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="px-10 py-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-sm font-semibold text-white shadow-md shadow-red-200 transition cursor-pointer disabled:opacity-60"
                            >
                                {isEditMode ? 'Update Damage' : 'Add Damage'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DamageStockAdd;