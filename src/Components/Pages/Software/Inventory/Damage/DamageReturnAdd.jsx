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
    const q = (searchText || '').toString().trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => String(f || '').toLowerCase().includes(q));
};

const damageKey = (name, company) =>
    `${(name || '').toString().trim().toLowerCase()}|${(company || '').toString().trim().toLowerCase()}`;

const QTY_FIELDS = ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'];

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

// ---------- Qty box ----------
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

const applyQty = (item, field, value) => {
    const next = { ...item, [field]: value === '' ? '' : Number(value) || 0 };
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
    return next;
};

const restoreItem = (item, index) => ({
    ...item,
    uniqueId: `${item.productId || 'item'}-${index}-${Date.now()}`,
    _id: item.productId,
    unitQty: Number(item.unitQty) || '',
    subQty: Number(item.subQty) || '',
    pcsQty: Number(item.pcsQty) || '',
    totalQty: Number(item.totalQty) || 0,
    freeUnitQty: Number(item.freeUnitQty) || '',
    freeSubQty: Number(item.freeSubQty) || '',
    freePcsQty: Number(item.freePcsQty) || '',
    freeQty: Number(item.freeQty) || 0,
});

const getRowTotal = (i) => (Number(i.buyPrice) || 0) * (Number(i.totalQty) || 0);

const DamageReturnAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editing = location.state?.damageReturn || null;
    const isEditMode = !!editing;
    const editId = editing?._id || null;

    const [formData, setFormData] = useState({
        company: editing?.company || '',
        companyContact: editing?.phone || '',
        companyAddress: editing?.address || '',
        category: editing?.category || '',
        date: editing?.returnDate || getFormattedToday(),
    });

    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [stockList, setStockList] = useState(null);

    const [search, setSearch] = useState({
        company: editing?.company || '',
        category: editing?.category || '',
        product: '',
    });
    const updateSearch = (key, value) => setSearch((p) => ({ ...p, [key]: value }));
    const updateForm = (fields) => setFormData((p) => ({ ...p, ...fields }));

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editing?.note || '');
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
        load('company', setCompanies);
        load('category', setCategories, (c) => c.isActive === true);
        load('product', setProducts);

        // Damage stock = Sales damage + Standalone damage - Purchase damage return - Damage return
        Promise.all([
            fetch('https://squirrel-peace-server.onrender.com/sales').then((r) => r.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/sales-damage').then((r) => r.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/purchase').then((r) => r.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/damage-return').then((r) => r.json()).catch(() => []),
        ])
            .then(([sales, dmg, purchases, returns]) => {
                const map = new Map();
                const addRow = (it, sign) => {
                    const key = damageKey(it.productName, it.company);
                    if (!map.has(key)) {
                        map.set(key, {
                            key,
                            productName: it.productName || '',
                            company: it.company || '',
                            productId: it.productId,
                            paid: 0,
                            free: 0,
                            pcsPerUnit: 1,
                            parentMode: false,
                            pcsPerSub: 0,
                            unit: '',
                            subUnit: '',
                        });
                    }
                    const g = map.get(key);
                    g.paid += sign * (Number(it.totalQty) || 0);
                    g.free += sign * (Number(it.freeQty) || 0);
                    if (sign > 0) {
                        g.pcsPerUnit = Number(it.pcsPerUnit) || g.pcsPerUnit;
                        g.parentMode = it.parentMode === true;
                        g.pcsPerSub = it.parentMode === true ? Number(it.pcsPerSub) || 0 : 0;
                        g.unit = it.unit || g.unit;
                        g.subUnit = it.subUnit || g.subUnit;
                    }
                };
                (Array.isArray(sales) ? sales : [])
                    .filter((s) => s.status === 'Delivered')
                    .forEach((s) => (s.damageItems || []).forEach((it) => addRow(it, 1)));
                (Array.isArray(dmg) ? dmg : []).forEach((d) => (d.items || []).forEach((it) => addRow(it, 1)));
                (Array.isArray(purchases) ? purchases : []).forEach((p) => {
                    if (!(p.receiveStatus === 'Received' || p.receiveStatus === 'Yes')) return;
                    (p.damageItems || []).forEach((it) => addRow(it, -1));
                });
                (Array.isArray(returns) ? returns : []).forEach((r) => {
                    if (editId && String(r._id) === String(editId)) return;
                    (r.items || []).forEach((it) => addRow(it, -1));
                });
                setStockList(
                    Array.from(map.values()).map((g) => ({ ...g, paid: Math.max(g.paid, 0), free: Math.max(g.free, 0) }))
                );
            })
            .catch((e) => console.error('Error fetching damage stock:', e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Edit prefill ----------
    useEffect(() => {
        if (editing) setItems((editing.items || []).map(restoreItem));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Company (required) ----------
    const filteredCompanies = companies.filter((c) =>
        matchesSearch(search.company, [c.businessName, c.contactNumber, c.address])
    );

    const handleSelectCompany = (c) => {
        if (formData.company !== c.businessName) setItems([]);
        updateForm({
            company: c.businessName,
            companyContact: c.contactNumber || '',
            companyAddress: c.address || '',
        });
        updateSearch('company', c.businessName);
        updateSearch('product', '');
    };

    const handleClearCompany = () => {
        setItems([]);
        updateForm({ company: '', companyContact: '', companyAddress: '' });
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
    const findMaster = (s) => products.find((p) => damageKey(p.productName, p.company) === s.key);

    const getStock = (item) => {
        if (!stockList) return null;
        const f = stockList.find((d) => d.key === damageKey(item.productName, item.company));
        return f ? { paid: f.paid, free: f.free } : { paid: 0, free: 0 };
    };

    const filteredProducts = (stockList || []).filter((s) => {
        if (!formData.company) return false;
        if (damageKey('', s.company) !== damageKey('', formData.company)) return false;
        if (s.paid <= 0 && s.free <= 0) return false;
        const master = findMaster(s);
        if (formData.category && master?.category !== formData.category) return false;
        if (items.some((i) => damageKey(i.productName, i.company) === s.key)) return false;
        return matchesSearch(search.product, [s.productName, master?.sku]);
    });

    const handleSelectProduct = (s) => {
        const master = findMaster(s);
        const isParent = s.parentMode === true;
        const newItem = {
            uniqueId: Date.now() + Math.random(),
            _id: master?._id || s.productId,
            productName: s.productName || '',
            company: s.company || '',
            buyPrice: Number(master?.purchasePrice) || 0,
            unit: s.unit || master?.unit || 'Pcs',
            parentMode: isParent,
            subUnit: isParent ? (s.subUnit || '') : '',
            pcsPerSub: isParent ? (Number(s.pcsPerSub) || 1) : 0,
            pcsPerUnit: Number(s.pcsPerUnit) || 1,
            subQty: '',
            unitQty: '',
            pcsQty: '',
            totalQty: 0,
            freeUnitQty: '',
            freeSubQty: '',
            freePcsQty: '',
            freeQty: 0,
        };
        setItems((prev) => [...prev, newItem]);
        updateSearch('product', '');
    };

    const handleRemoveItem = (uniqueId) =>
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));

    const handleItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        const cur = items.find((i) => i.uniqueId === uniqueId);
        if (!cur) return;

        if (QTY_FIELDS.includes(field)) {
            const next = applyQty(cur, field, value);
            const stock = getStock(cur);
            if (stock) {
                if (Number(next.totalQty) > stock.paid) {
                    return showToast(`Damage main stock e matro ${stock.paid} pcs ache!`, true);
                }
                if (Number(next.freeQty) > stock.free) {
                    return showToast(`Damage free stock e matro ${stock.free} pcs ache!`, true);
                }
            }
            setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
            return;
        }

        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? { ...i, [field]: value } : i)));
    };

    // ---------- Totals ----------
    const subTotal = roundTo2(items.reduce((t, i) => t + getRowTotal(i), 0));
    const damageAmount = subTotal;

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
        if (!stockList) return showToast('Stock is loading, please wait...', true);

        for (const i of items) {
            const st = getStock(i);
            if (Number(i.totalQty) > st.paid || Number(i.freeQty) > st.free) {
                return showToast(`${i.productName}: damage stock e Main ${st.paid}, Free ${st.free} pcs ache!`, true);
            }
        }

        const itemsPayload = items.map((i) => ({
            productId: i._id,
            productName: i.productName,
            company: i.company,
            buyPrice: roundTo2(i.buyPrice),
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
            itemTotal: roundTo2(getRowTotal(i)),
        }));

        const payload = {
            invoiceNo: isEditMode ? editing.invoiceNo : generateInvoiceNo(),
            company: formData.company,
            phone: formData.companyContact,
            address: formData.companyAddress,
            category: formData.category,
            returnDate: formData.date,
            items: itemsPayload,
            damageAmount,
            note,
        };

        try {
            setIsSaving(true);
            const url = isEditMode
                ? `https://squirrel-peace-server.onrender.com/damage-return/${editId}`
                : 'https://squirrel-peace-server.onrender.com/damage-return';
            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed');
            await res.json();
            showToast(isEditMode ? 'Damage return updated successfully!' : 'Damage return added successfully!');
            setTimeout(
                () => navigate('/damage-products', { replace: true, state: { tab: 'returnInvoice' } }),
                1000
            );
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save damage return. Try again.', true);
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
                            {isEditMode ? 'Edit Damage Return' : 'Add Damage Return'}
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">Select company and damaged products to return</p>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <SearchSelect
                                label="Company"
                                required
                                placeholder="Search or select company..."
                                searchValue={search.company}
                                onSearchChange={(text) => {
                                    updateSearch('company', text);
                                    if (formData.company) {
                                        setItems([]);
                                        updateForm({ company: '', companyContact: '', companyAddress: '' });
                                    }
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

                        <SearchSelect
                            label="Select Product"
                            required
                            disabled={!formData.company}
                            hint={formData.company ? '(Damage stock products of this company)' : ''}
                            placeholder={formData.company ? 'Search or select product...' : 'Select a company first...'}
                            searchValue={search.product}
                            onSearchChange={(text) => updateSearch('product', text)}
                            onClear={() => updateSearch('product', '')}
                            onSelect={handleSelectProduct}
                            items={filteredProducts}
                            getKey={(s) => s.key}
                            emptyText="No damage stock found"
                            renderItem={(s) => (
                                <div className="flex justify-between items-center gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{s.productName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">Company: {s.company}</p>
                                    </div>
                                    <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-medium border border-red-100 shrink-0">
                                        Main: {s.paid} | Free: {s.free}
                                    </span>
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
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '14%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '16%' }} />
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
                                        <th className="py-3 px-3">Buy Price (PCS)</th>
                                        <th className="py-3 px-3">Item Total</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-red-100 text-sm">
                                    {items.length > 0 ? (
                                        items.map((item) => {
                                            const unitLabel = item.unit || 'Pcs';
                                            const stock = getStock(item);
                                            const ch = (field) => (v) => handleItemChange(item.uniqueId, field, v);
                                            return (
                                                <tr key={item.uniqueId} className="hover:bg-red-50/40 transition">
                                                    <td className="py-3 px-2 font-semibold text-slate-800">{item.productName}</td>
                                                    <td className="py-3 px-2 text-slate-600 text-xs">{item.company}</td>

                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.totalQty) > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {item.totalQty} | Stock: {stock ? stock.paid : '...'}
                                                        </div>
                                                        <div className="p-1.5 bg-red-50 border border-r-0 border-red-200 rounded-l-2xl">
                                                            <QtyBox value={item.unitQty} onChange={ch('unitQty')} label={unitLabel} grad="from-red-500 to-rose-500" border="border-red-200" />
                                                            {item.parentMode && (
                                                                <div className="mt-1.5">
                                                                    <QtyBox value={item.subQty} onChange={ch('subQty')} label={item.subUnit} grad="from-fuchsia-500 to-pink-500" border="border-red-200" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>

                                                    <td className="py-3 pl-0 pr-2">
                                                        <div className="p-1.5 bg-red-50 border border-l-0 border-red-200 rounded-r-2xl">
                                                            <input
                                                                type="number" min="0" step="1" placeholder="0"
                                                                value={item.pcsQty}
                                                                onChange={(e) => /^\d*$/.test(e.target.value) && ch('pcsQty')(e.target.value)}
                                                                className="w-full px-3 py-2.5 rounded-xl border border-red-200 bg-white text-sm outline-none shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                                            />
                                                        </div>
                                                    </td>

                                                    <td className="relative py-3 pl-2 pr-0">
                                                        <div className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                            Total: {item.freeQty} | Stock: {stock ? stock.free : '...'}
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

                                                    <td className="py-3 px-2">
                                                        <input
                                                            type="number" min="0" step="0.01"
                                                            value={item.buyPrice}
                                                            onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && ch('buyPrice')(e.target.value)}
                                                            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                                        />
                                                    </td>

                                                    <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                        {getRowTotal(item).toFixed(2)}
                                                    </td>

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
                                placeholder="Write any note about this damage return..."
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
                                {isEditMode ? 'Update Damage Return' : 'Add Damage Return'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DamageReturnAdd;