import React, { useState, useEffect, useRef } from 'react';
import useDraftState from '../../../../hooks/useDraftState';

const API_BASE = 'http://localhost:5000';

// আজকের ডেট ফরম্যাট করার ফাংশন (যেমন: "06 Sep 2026")
const getFormattedToday = () => {
    const today = new Date();
    return today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

// টেক্সট সার্চের জন্য helper — যেকোনো একটা field এ মিললেই true
const matchesSearch = (searchText, fields) => {
    const searchLower = (searchText || '').toLowerCase();
    return fields.some((field) => String(field || '').toLowerCase().includes(searchLower));
};

// Customer রিসেট করার সময় যে field গুলো খালি হবে
const EMPTY_CUSTOMER_FIELDS = {
    customerId: '',
    customer: '',
    customerContact: '',
    customerAddress: '',
    shippingAddress: '',
};

const XIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ChevronIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-teal-500">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

// ------------------------------------------------------------------
// Reusable Search + Select Dropdown
// (কম্পোনেন্টের বাইরে রাখা হয়েছে, নাহলে টাইপ করার সময় focus হারিয়ে যেত)
// ------------------------------------------------------------------
const SearchSelect = ({
    label,
    required = false,
    hint = '',
    placeholder,
    searchValue,
    onSearchChange,
    onClear,
    onSelect,
    items,
    getKey,
    renderItem,
    emptyText = 'No data found',
    disabled = false,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // বাইরে ক্লিক করলে dropdown বন্ধ হবে
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
                {label} {required && <span className="text-rose-500">*</span>}{' '}
                {hint && <span className="text-xs text-amber-500 font-normal">{hint}</span>}
            </label>

            <div
                onClick={() => {
                    if (!disabled) setIsOpen(true);
                }}
                className={`w-full px-4 py-3.5 rounded-2xl border text-sm shadow-sm flex items-center justify-between transition-colors ${disabled
                    ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'
                    : 'border-slate-200 bg-slate-50/70 text-slate-700 cursor-pointer focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100'
                    }`}
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
                    className={`bg-transparent outline-none w-full text-sm ${disabled ? 'cursor-not-allowed' : 'text-slate-700 cursor-pointer'}`}
                />
                <div className="flex items-center gap-1.5 shrink-0">
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
                            <XIcon />
                        </button>
                    )}
                    <ChevronIcon />
                </div>
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-60 overflow-y-auto">
                    {items.length > 0 ? (
                        items.map((item) => (
                            <div
                                key={getKey(item)}
                                onClick={() => {
                                    onSelect(item);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 transition duration-150 last:border-none"
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

// ------------------------------------------------------------------
// Order Form
// ------------------------------------------------------------------
const OrderForm = ({ onAddProduct, addedProductIds = [], onFormDataChange, initialData = null }) => {
    const [formData, setFormData] = useDraftState('orderNew:form', {
        customerId: '',
        customer: '',
        customerContact: '',
        customerAddress: '',
        route: '',
        date: getFormattedToday(),
        shippingAddress: '',
        srId: '',
        sr: '',
        deliveredById: '',
        deliveredBy: '',
        company: '',
        category: '',
    });

    // প্রতিটা select এর search box এর টেক্সট
    const [search, setSearch] = useDraftState('orderNew:search', {
        route: '',
        customer: '',
        sr: '',
        deliveredBy: '',
        company: '',
        category: '',
        product: '',
    });

    // API data
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);

    const dateInputRef = useRef(null);

    // Customer আগে সিলেক্ট করলে route auto বসে lock হয়ে যাবে
    const [routeLocked, setRouteLocked] = useDraftState('orderNew:routeLocked', false);
    const updateSearch = (key, value) => setSearch((prev) => ({ ...prev, [key]: value }));
    const updateForm = (fields) => setFormData((prev) => ({ ...prev, ...fields }));

    // --------------------------------------------------
    // Fetch all data
    // --------------------------------------------------
    useEffect(() => {
        const loadList = (endpoint, setter) => {
            fetch(`${API_BASE}/${endpoint}`)
                .then((res) => res.json())
                .then((data) => setter(Array.isArray(data) ? data : []))
                .catch((error) => console.error(`Error fetching ${endpoint}:`, error));
        };

        loadList('customer', setCustomers);
        loadList('user', setUsers);
        loadList('company', setCompanies);
        loadList('category', setCategories);
        loadList('product', setProducts);
    }, []);

    // --------------------------------------------------
    // Edit mode এ initialData দিয়ে ফর্ম প্রি-ফিল
    // --------------------------------------------------
    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({
                ...prev,
                customerId: initialData.customerId || '',
                customer: initialData.customer || '',
                customerContact: initialData.customerContact || '',
                customerAddress: initialData.customerAddress || '',
                route: initialData.route || '',
                date: initialData.date || prev.date,
                shippingAddress: initialData.shippingAddress || '',
                srId: initialData.srId || '',
                sr: initialData.sr || '',
                deliveredById: initialData.deliveredById || '',
                deliveredBy: initialData.deliveredBy || '',
                company: initialData.company || '',
                category: initialData.category || '',
            }));
            setSearch((prev) => ({
                ...prev,
                customer: initialData.customer || '',
                sr: initialData.sr || '',
                deliveredBy: initialData.deliveredBy || '',
                company: initialData.company || '',
                category: initialData.category || '',
            }));
        }
    }, [initialData]);

    // Edit mode এ route search text ও lock সেট করা
    useEffect(() => {
        if (initialData) {
            setSearch((prev) => ({ ...prev, route: initialData.route || '' }));
            setRouteLocked(!!initialData.customer && !!initialData.route);
        }
    }, [initialData]);

    // formData update হলে parent (OrderAdd) কে জানিয়ে দেবে
    useEffect(() => {
        if (onFormDataChange) {
            onFormDataChange(formData);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData]);

    // --------------------------------------------------
    // Date
    // --------------------------------------------------
    const openDatePicker = () => {
        const el = dateInputRef.current;
        if (!el) return;
        if (typeof el.showPicker === 'function') {
            try {
                el.showPicker();
                return;
            } catch (err) {
                // fallback নিচে
            }
        }
        el.click();
    };

    // ক্যালেন্ডার থেকে ডেট সিলেক্ট করলে সেটি ফরম্যাট হয়ে যাবে
    const handleDateChange = (e) => {
        const rawDate = e.target.value; // yyyy-mm-dd
        if (rawDate) {
            const [year, month, day] = rawDate.split('-');
            const dateObj = new Date(year, month - 1, day);
            const formatted = dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
            updateForm({ date: formatted });
        }
    };

    // --------------------------------------------------
    // Filtered lists
    // --------------------------------------------------

    // শুধু Wholesale Customer
    const filteredCustomers = customers
        .filter((c) => c.customerType === 'Wholesale Customer')
        // Route সিলেক্ট থাকলে শুধু ওই route এর customer দেখাবে
        .filter((c) => !formData.route || c.route === formData.route)
        .filter((c) =>
            matchesSearch(search.customer, [c.businessName, c.contactNumber, c.address, c.route])
        );

    // Wholesale customer দের unique route list
    const wholesaleCustomers = customers.filter(({ customerType }) => customerType === 'Wholesale Customer');
    const routeList = [...new Set(wholesaleCustomers.map((c) => c.route).filter(Boolean))]
        .filter((r) => matchesSearch(search.route, [r]));

    // Select Product enable হওয়ার জন্য যা যা লাগবে (Company ও Category optional)
    const missingFields = [];
    if (!formData.customerId) missingFields.push('Customer');
    if (!formData.route) missingFields.push('Route');
    if (!formData.date) missingFields.push('Date');
    if (!formData.srId) missingFields.push('SR');
    if (!formData.deliveredById) missingFields.push('Delivered By');
    const isProductEnabled = missingFields.length === 0;

    // শুধু SR role + isActive true
    const filteredSRs = users
        .filter((u) => u.role === 'SR' && u.isActive === true)
        .filter((u) => matchesSearch(search.sr, [u.name, u.email, u.phone, u.address]));

    // শুধু Delivery Man role + isActive true
    const filteredDeliveryMen = users
        .filter((u) => u.role === 'Delivery Man' && u.isActive === true)
        .filter((u) => matchesSearch(search.deliveredBy, [u.name, u.email, u.phone, u.address]));

    const filteredCompanies = companies.filter((comp) =>
        matchesSearch(search.company, [comp.businessName, comp.contactNumber, comp.email, comp.address])
    );

    // শুধু isActive true category
    const filteredCategories = categories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(search.category, [cat.name]));

    // Product: isActive true + (company/category সিলেক্ট থাকলে মিলতে হবে) + অলরেডি অ্যাড করা প্রোডাক্ট বাদ
    const filteredProducts = products.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (formData.company && prod.company !== formData.company) return false;
        if (formData.category && prod.category !== formData.category) return false;

        const isAlreadyAdded = addedProductIds.some(
            (idOrName) => idOrName === prod._id || idOrName === prod.productName
        );
        if (isAlreadyAdded) return false;

        return matchesSearch(search.product, [prod.productName, prod.sku]);
    });

    // --------------------------------------------------
    // Customer
    // --------------------------------------------------
    const handleSelectCustomer = (cust) => {
        updateForm({
            customerId: cust._id,
            customer: cust.businessName,
            customerContact: cust.contactNumber || '',
            customerAddress: cust.address || '',
            route: cust.route || '', // Route Name input এ বসে যাবে
            shippingAddress: cust.address || '', // Shipping Address input এ বসে যাবে
        });
        updateSearch('customer', cust.businessName);
        updateSearch('route', cust.route || '');
        // Route আগে সিলেক্ট করা না থাকলে (মানে customer আগে সিলেক্ট করলে) route lock হয়ে যাবে
        if (!formData.route && cust.route) {
            setRouteLocked(true);
        }
    };

    // Customer রিসেট — customer আগে সিলেক্ট করে route auto বসে থাকলে route ও রিসেট হবে
    const resetCustomer = (clearText = true) => {
        if (clearText) updateSearch('customer', '');
        updateForm({ ...EMPTY_CUSTOMER_FIELDS });
        if (routeLocked) {
            updateSearch('route', '');
            updateForm({ route: '' });
            setRouteLocked(false);
        }
    };

    const handleClearCustomer = () => resetCustomer(true);

    // --------------------------------------------------
    // Route
    // --------------------------------------------------
    const handleSelectRoute = (route) => {
        // অন্য route সিলেক্ট করলে আগের customer বাতিল হবে
        if (formData.customerId && formData.route !== route) {
            updateSearch('customer', '');
            updateForm({ ...EMPTY_CUSTOMER_FIELDS });
        }
        updateForm({ route });
        updateSearch('route', route);
    };

    const handleClearRoute = (clearText = true) => {
        if (clearText) updateSearch('route', '');
        updateForm({ route: '' });
        // Route বাতিল হলে ওই route এর customer ও বাতিল
        if (formData.customerId) {
            updateSearch('customer', '');
            updateForm({ ...EMPTY_CUSTOMER_FIELDS });
        }
    };

    // --------------------------------------------------
    // SR
    // --------------------------------------------------
    const handleSelectSR = (user) => {
        updateForm({ srId: user._id, sr: user.name });
        updateSearch('sr', user.name);
    };

    const handleClearSR = () => {
        updateSearch('sr', '');
        updateForm({ srId: '', sr: '' });
    };

    // --------------------------------------------------
    // Delivered By
    // --------------------------------------------------
    const handleSelectDeliveryMan = (user) => {
        updateForm({ deliveredById: user._id, deliveredBy: user.name });
        updateSearch('deliveredBy', user.name);
    };

    const handleClearDeliveryMan = () => {
        updateSearch('deliveredBy', '');
        updateForm({ deliveredById: '', deliveredBy: '' });
    };

    // --------------------------------------------------
    // Filter by Company
    // --------------------------------------------------
    const handleSelectCompany = (comp) => {
        updateForm({ company: comp.businessName });
        updateSearch('company', comp.businessName);
        updateSearch('product', '');
    };

    const handleClearCompany = () => {
        updateSearch('company', '');
        updateSearch('product', '');
        updateForm({ company: '' });
    };

    // --------------------------------------------------
    // Filter by Category
    // --------------------------------------------------
    const handleSelectCategory = (cat) => {
        updateForm({ category: cat.name });
        updateSearch('category', cat.name);
        updateSearch('product', '');
    };

    const handleClearCategory = () => {
        updateSearch('category', '');
        updateSearch('product', '');
        updateForm({ category: '' });
    };

    // --------------------------------------------------
    // Product — সিলেক্ট করলে parent এর টেবিলে যাবে, ফিল্ড রিসেট হবে
    // --------------------------------------------------
    const handleSelectProduct = (prod) => {
        if (onAddProduct) {
            onAddProduct(prod);
        }
        updateSearch('product', '');
    };

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 my-8 relative z-20">
            <div className="bg-white rounded-3xl shadow-lg shadow-teal-900/5 p-6 md:p-8 border border-teal-100/70 transition-all duration-300 relative">

                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-teal-100">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-200">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Order Information</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Select customer, sales representative and products for this order</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">

                    {/* Row 1 : Customer, Route Name, Date, Shipping Address */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* Customer */}
                        <SearchSelect
                            label="Customer"
                            required
                            placeholder="Search or select customer..."
                            searchValue={search.customer}
                            onSearchChange={(text) => {
                                updateSearch('customer', text);
                                // টাইপ করলে আগের সিলেক্ট করা customer বাতিল হবে
                                if (formData.customerId) resetCustomer(false);
                            }}
                            onClear={handleClearCustomer}
                            onSelect={handleSelectCustomer}
                            items={filteredCustomers}
                            getKey={(c) => c._id}
                            emptyText="No wholesale customer found"
                            renderItem={(c) => (
                                <>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm font-semibold text-slate-800">{c.businessName}</p>
                                        {c.route && (
                                            <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg font-medium border border-teal-100 shrink-0">
                                                {c.route}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        📞 {c.contactNumber} | 📍 {c.address}
                                    </p>
                                </>
                            )}
                        />

                        {/* Route Name */}
                        <SearchSelect
                            label="Route Name"
                            required
                            hint={routeLocked ? '(Auto-filled from customer)' : ''}
                            placeholder="Search or select route..."
                            searchValue={search.route}
                            onSearchChange={(text) => {
                                updateSearch('route', text);
                                // টাইপ করলে আগের সিলেক্ট করা route (ও তার customer) বাতিল হবে
                                if (formData.route) handleClearRoute(false);
                            }}
                            onClear={handleClearRoute}
                            onSelect={handleSelectRoute}
                            items={routeList}
                            getKey={(r) => r}
                            emptyText="No route found"
                            disabled={routeLocked}
                            renderItem={(r) => (
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-slate-800">{r}</p>
                                    <span className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg font-medium border border-teal-100 shrink-0">
                                        {wholesaleCustomers.filter((c) => c.route === r).length} customers
                                    </span>
                                </div>
                            )}
                        />

                        {/* Date */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Date <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative w-full cursor-pointer" onClick={openDatePicker}>
                                <input
                                    ref={dateInputRef}
                                    type="date"
                                    onChange={handleDateChange}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    value={formData.date}
                                    placeholder="Select date"
                                    className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition duration-200 bg-slate-50/70 text-sm text-slate-700 shadow-sm cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Shipping Address</label>
                            <input
                                type="text"
                                value={formData.shippingAddress}
                                disabled
                                placeholder="Auto-filled from customer"
                                title="Customer সিলেক্ট করলে address নিজে থেকে বসবে"
                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-100 text-sm text-slate-500 shadow-sm cursor-not-allowed opacity-75 outline-none"
                            />
                        </div>
                    </div>

                    {/* Row 2 : SR, Delivered By, Filter by Company, Filter by Category */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                        {/* SR */}
                        <SearchSelect
                            label="SR"
                            required
                            placeholder="Search or select SR..."
                            searchValue={search.sr}
                            onSearchChange={(text) => {
                                updateSearch('sr', text);
                                updateForm({ srId: '', sr: '' });
                            }}
                            onClear={handleClearSR}
                            onSelect={handleSelectSR}
                            items={filteredSRs}
                            getKey={(u) => u._id}
                            emptyText="No active SR found"
                            renderItem={(u) => (
                                <>
                                    <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        📞 {u.phone} | ✉️ {u.email}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">📍 {u.address}</p>
                                </>
                            )}
                        />

                        {/* Delivered By */}
                        <SearchSelect
                            label="Delivered By"
                            required
                            placeholder="Search or select delivery man..."
                            searchValue={search.deliveredBy}
                            onSearchChange={(text) => {
                                updateSearch('deliveredBy', text);
                                updateForm({ deliveredById: '', deliveredBy: '' });
                            }}
                            onClear={handleClearDeliveryMan}
                            onSelect={handleSelectDeliveryMan}
                            items={filteredDeliveryMen}
                            getKey={(u) => u._id}
                            emptyText="No active delivery man found"
                            renderItem={(u) => (
                                <>
                                    <p className="text-sm font-semibold text-slate-800">{u.name}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        📞 {u.phone} | ✉️ {u.email}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">📍 {u.address}</p>
                                </>
                            )}
                        />

                        {/* Filter by Company */}
                        <SearchSelect
                            label="Filter by Company"
                            placeholder="Search or select company..."
                            searchValue={search.company}
                            onSearchChange={(text) => {
                                updateSearch('company', text);
                                updateForm({ company: '' });
                            }}
                            onClear={handleClearCompany}
                            onSelect={handleSelectCompany}
                            items={filteredCompanies}
                            getKey={(comp) => comp._id}
                            emptyText="No company found"
                            renderItem={(comp) => (
                                <>
                                    <p className="text-sm font-semibold text-slate-800">{comp.businessName}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">
                                        📞 {comp.contactNumber} | ✉️ {comp.email}
                                    </p>
                                    <p className="text-xs text-slate-500 mt-0.5">📍 {comp.address}</p>
                                </>
                            )}
                        />

                        {/* Filter by Category */}
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
                            getKey={(cat) => cat._id}
                            emptyText="No active category found"
                            renderItem={(cat) => (
                                <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                            )}
                        />
                    </div>

                    {/* Row 3 : Select Product */}
                    <div className="grid grid-cols-1">
                        <SearchSelect
                            label="Select Product"
                            required
                            hint={
                                !isProductEnabled
                                    ? `(Select first: ${missingFields.join(', ')})`
                                    : formData.company || formData.category
                                        ? `(Filtered by ${[formData.company, formData.category].filter(Boolean).join(' • ')})`
                                        : ''
                            }
                            placeholder={isProductEnabled ? 'Search or select product...' : 'Fill required fields first...'}
                            disabled={!isProductEnabled}
                            searchValue={search.product}
                            onSearchChange={(text) => updateSearch('product', text)}
                            onClear={() => updateSearch('product', '')}
                            onSelect={handleSelectProduct}
                            items={filteredProducts}
                            getKey={(prod) => prod._id}
                            emptyText="No matching product found"
                            renderItem={(prod) => (
                                <div className="flex justify-between items-center gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Company: {prod.company}
                                            {prod.category ? ` | Category: ${prod.category}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {prod.sellingPrice && (
                                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium border border-emerald-100">
                                                ৳{prod.sellingPrice}
                                            </span>
                                        )}
                                        {prod.sku && (
                                            <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium border border-amber-100">
                                                SKU: {prod.sku}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderForm;