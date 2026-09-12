import React, { useState, useEffect, useRef } from 'react';

const PurchaseForm = ({ onAddProduct, addedProductIds = [], onFormDataChange, initialData = null }) => {
    // আজকের ডেট ফরম্যাট করার ফাংশন (যেমন: "06 Sep 2026")
    const getFormattedToday = () => {
        const today = new Date();
        return today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const [formData, setFormData] = useState({
        company: '',
        companyContact: '',
        companyAddress: '',
        date: getFormattedToday(),
        shippingAddress: '',
        category: '',
        product: '',
    });

    const [companies, setCompanies] = useState([]);
    const [companySearch, setCompanySearch] = useState('');
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);

    // Category states
    const [categories, setCategories] = useState([]);
    const [categorySearch, setCategorySearch] = useState('');
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);

    // Product states
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [isProductOpen, setIsProductOpen] = useState(false);

    // Edit mode হলে (initialData আছে) Company field disable থাকবে
    const isCompanyLocked = !!initialData;

    const dropdownRef = useRef(null);
    const categoryDropdownRef = useRef(null);
    const productDropdownRef = useRef(null);
    const dateInputRef = useRef(null);

    // Fetch Companies
    useEffect(() => {
        fetch('http://localhost:5000/company')
            .then((res) => res.json())
            .then((data) => {
                setCompanies(Array.isArray(data) ? data : []);
            })
            .catch((error) => console.error('Error fetching companies:', error));
    }, []);

    // Fetch Categories
    useEffect(() => {
        fetch('http://localhost:5000/category')
            .then((res) => res.json())
            .then((data) => {
                const activeCategories = Array.isArray(data)
                    ? data.filter((cat) => cat.isActive === true)
                    : [];
                setCategories(activeCategories);
            })
            .catch((error) => console.error('Error fetching categories:', error));
    }, []);

    // Fetch Products
    useEffect(() => {
        fetch('http://localhost:5000/product')
            .then((res) => res.json())
            .then((data) => {
                setProducts(Array.isArray(data) ? data : []);
            })
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryOpen(false);
            }
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setIsProductOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Edit mode-এ আসলে initialData দিয়ে ফর্ম প্রি-ফিল হবে
    useEffect(() => {
        if (initialData) {
            setFormData((prev) => ({
                ...prev,
                company: initialData.company || '',
                companyContact: initialData.companyContact || '',
                companyAddress: initialData.companyAddress || '',
                date: initialData.date || prev.date,
                shippingAddress: initialData.shippingAddress || '',
                category: initialData.category || '',
            }));
            setCompanySearch(initialData.company || '');
            setCategorySearch(initialData.category || '');
        }
    }, [initialData]);

    // formData update hole parent (PurchaseAdd) কে জানিয়ে দেবে
    useEffect(() => {
        if (onFormDataChange) {
            onFormDataChange(formData);
        }
    }, [formData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
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
            setFormData((prev) => ({
                ...prev,
                date: formatted,
            }));
        }
    };

    // Filter companies based on search typing
    const filteredCompanies = companies.filter((comp) => {
        const searchLower = companySearch.toLowerCase();
        return (
            comp.businessName?.toLowerCase().includes(searchLower) ||
            comp.contactNumber?.toLowerCase().includes(searchLower) ||
            comp.address?.toLowerCase().includes(searchLower)
        );
    });

    const handleSelectCompany = (comp) => {
        setFormData({
            ...formData,
            company: comp.businessName,
            companyContact: comp.contactNumber || '',
            companyAddress: comp.address || '',
            product: '',
        });
        setProductSearch('');
        setCompanySearch(comp.businessName);
        setIsCompanyOpen(false);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setCompanySearch('');
        setFormData({ ...formData, company: '', companyContact: '', companyAddress: '', product: '' });
        setProductSearch('');
        setIsCompanyOpen(false);
    };

    // Filter categories based on search typing
    const filteredCategories = categories.filter((cat) => {
        const searchLower = categorySearch.toLowerCase();
        return cat.name?.toLowerCase().includes(searchLower);
    });

    const handleSelectCategory = (cat) => {
        setFormData({ ...formData, category: cat.name, product: '' });
        setProductSearch('');
        setCategorySearch(cat.name);
        setIsCategoryOpen(false);
    };

    const handleClearCategory = (e) => {
        e.stopPropagation();
        setCategorySearch('');
        setFormData({ ...formData, category: '', product: '' });
        setProductSearch('');
        setIsCategoryOpen(false);
    };

    // Filter products based on company, category, isActive, sku presence, typing search, and exclude already added products
    const filteredProducts = products.filter((prod) => {
        if (!formData.company) return false;
        if (prod.isActive !== true || !prod.sku) return false;
        if (prod.company !== formData.company) return false;
        if (formData.category && prod.category !== formData.category) return false;

        // টেবিলে অলরেডি অ্যাড করা থাকলে ড্রপডাউন থেকে বাদ দেবে
        const isAlreadyAdded = addedProductIds.some(
            (idOrName) => idOrName === prod._id || idOrName === prod.productName
        );
        if (isAlreadyAdded) return false;

        const searchLower = productSearch.toLowerCase();
        return (
            prod.productName?.toLowerCase().includes(searchLower) ||
            prod.sku?.toLowerCase().includes(searchLower)
        );
    });

    // প্রোডাক্ট সিলেক্ট করার পর প্যারেন্ট ফাংশন কল হবে এবং ফিল্ড রিসেট হবে
    const handleSelectProduct = (prod) => {
        if (onAddProduct) {
            onAddProduct(prod);
        }
        setFormData({ ...formData, product: '' });
        setProductSearch('');
        setIsProductOpen(false);
    };

    const handleClearProduct = (e) => {
        e.stopPropagation();
        setProductSearch('');
        setFormData({ ...formData, product: '' });
        setIsProductOpen(false);
    };

    return (
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 my-8 relative z-20">
            <div className="bg-white rounded-3xl shadow-lg shadow-teal-900/5 p-6 md:p-8 border border-teal-100/70 transition-all duration-300 relative">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-teal-100">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-200">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">
                                Purchase Filter &amp; Search
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">Filter and look up purchase records using criteria below</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Company Selection */}
                        <div className="relative" ref={dropdownRef}>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Company <span className="text-rose-500">*</span></label>
                            <div
                                onClick={() => {
                                    if (!isCompanyLocked) setIsCompanyOpen(true);
                                }}
                                className={`w-full px-4 py-3.5 rounded-2xl border text-sm shadow-sm flex items-center justify-between transition-colors ${isCompanyLocked
                                        ? 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed opacity-75'
                                        : 'border-slate-200 bg-slate-50/70 text-slate-700 cursor-pointer focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100'
                                    }`}
                            >
                                <input
                                    type="text"
                                    disabled={isCompanyLocked}
                                    placeholder="Search or select company..."
                                    value={companySearch}
                                    onChange={(e) => {
                                        if (isCompanyLocked) return;
                                        setCompanySearch(e.target.value);
                                        setIsCompanyOpen(true);
                                    }}
                                    className={`bg-transparent outline-none w-full text-sm ${isCompanyLocked ? 'text-slate-500 cursor-not-allowed' : 'text-slate-700 cursor-pointer'}`}
                                />
                                <div className="flex items-center gap-1.5">
                                    {companySearch && !isCompanyLocked && (
                                        <button type="button" onClick={handleClearCompany} className="text-slate-400 hover:text-rose-500 p-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-teal-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>

                            {isCompanyOpen && !isCompanyLocked && (
                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-60 overflow-y-auto">
                                    {filteredCompanies.length > 0 ? (
                                        filteredCompanies.map((comp) => (
                                            <div
                                                key={comp._id}
                                                onClick={() => handleSelectCompany(comp)}
                                                className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 transition duration-150 last:border-none"
                                            >
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

                        {/* Shipping Address */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Shipping Address</label>
                            <input
                                type="text"
                                name="shippingAddress"
                                value={formData.shippingAddress}
                                onChange={handleChange}
                                placeholder="Enter shipping address"
                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 outline-none transition duration-200 bg-slate-50/70 text-sm text-slate-700 shadow-sm"
                            />
                        </div>

                        {/* Category Selection */}
                        <div className="relative" ref={categoryDropdownRef}>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                            <div
                                onClick={() => setIsCategoryOpen(true)}
                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm text-slate-700 shadow-sm cursor-pointer flex items-center justify-between transition-colors focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100"
                            >
                                <input
                                    type="text"
                                    placeholder="Search or select category..."
                                    value={categorySearch}
                                    onChange={(e) => {
                                        setCategorySearch(e.target.value);
                                        setFormData({ ...formData, category: e.target.value });
                                        setIsCategoryOpen(true);
                                    }}
                                    className="bg-transparent outline-none w-full text-sm text-slate-700 cursor-pointer"
                                />
                                <div className="flex items-center gap-1.5">
                                    {categorySearch && (
                                        <button type="button" onClick={handleClearCategory} className="text-slate-400 hover:text-rose-500 p-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-teal-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>

                            {isCategoryOpen && (
                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-60 overflow-y-auto">
                                    {filteredCategories.length > 0 ? (
                                        filteredCategories.map((cat) => (
                                            <div
                                                key={cat._id}
                                                onClick={() => handleSelectCategory(cat)}
                                                className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 transition duration-150 last:border-none"
                                            >
                                                <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-4 py-3 text-sm text-slate-400 text-center">No active category found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Date <span className="text-rose-500">*</span>
                            </label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                            >
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
                    </div>

                    {/* Product Selection Row */}
                    <div className="grid grid-cols-1">
                        <div className="relative" ref={productDropdownRef}>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                Select Product <span className="text-rose-500">*</span> {!formData.company && <span className="text-xs text-amber-500 font-normal">(Please select a company first)</span>}
                            </label>
                            <div
                                onClick={() => {
                                    if (formData.company) setIsProductOpen(true);
                                }}
                                className={`w-full px-4 py-3.5 rounded-2xl border text-sm shadow-sm flex items-center justify-between transition duration-200 ${formData.company
                                    ? 'border-slate-200 bg-slate-50/70 text-slate-700 cursor-pointer focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100'
                                    : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'
                                    }`}
                            >
                                <input
                                    type="text"
                                    disabled={!formData.company}
                                    placeholder={formData.company ? "Search or select product..." : "Select a company first..."}
                                    value={productSearch}
                                    onChange={(e) => {
                                        setProductSearch(e.target.value);
                                        setFormData({ ...formData, product: e.target.value });
                                        setIsProductOpen(true);
                                    }}
                                    className={`bg-transparent outline-none w-full text-sm ${formData.company ? 'text-slate-700 cursor-pointer' : 'cursor-not-allowed'}`}
                                />
                                <div className="flex items-center gap-1.5">
                                    {productSearch && formData.company && (
                                        <button type="button" onClick={handleClearProduct} className="text-slate-400 hover:text-rose-500 p-0.5">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-teal-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>
                            </div>

                            {isProductOpen && formData.company && (
                                <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-teal-100 max-h-60 overflow-y-auto">
                                    {filteredProducts.length > 0 ? (
                                        filteredProducts.map((prod) => (
                                            <div
                                                key={prod._id}
                                                onClick={() => handleSelectProduct(prod)}
                                                className="px-4 py-3 hover:bg-teal-50 cursor-pointer border-b border-slate-50 transition duration-150 last:border-none flex justify-between items-center"
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">Company: {prod.company} | Category: {prod.category}</p>
                                                </div>
                                                <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg font-medium border border-amber-100">
                                                    SKU: {prod.sku}
                                                </span>
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
        </div>
    );
};

export default PurchaseForm;