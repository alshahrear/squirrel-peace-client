import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useDraftState from '../../../../hooks/useDraftState';
import { DateInput } from '../Product/ProductUi';
import { labelCls, inputCls, ComboField } from './PurchaseUi';
import { Card } from './PurchaseFormUi';
import { labelToISO } from './purchaseDate';

// Label + ডানদিকে "+ Add ..." লিংক, একই সারিতে
const FieldLabel = ({ text, action }) => (
    <span className="flex items-center justify-between gap-2">
        <span>{text}</span>
        {action}
    </span>
);

const PurchaseForm = ({ onAddProduct, addedProductIds = [], onFormDataChange, initialData = null, onCompanyClear, draftKey = 'purchaseNew' }) => {
    const navigate = useNavigate();

    // আজকের ডেট ফরম্যাট করার ফাংশন (যেমন: "06 Sep 2026")
    const getFormattedToday = () => {
        const today = new Date();
        return today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const [formData, setFormData] = useDraftState(`${draftKey}:form`, {
        company: '',
        companyContact: '',
        companyAddress: '',
        date: getFormattedToday(),
        shippingAddress: '',
        category: '',
        product: '',
    });

    const [companies, setCompanies] = useState([]);
    const [companySearch, setCompanySearch] = useDraftState(`${draftKey}:companySearch`, '');

    // Category states
    const [categories, setCategories] = useState([]);
    const [categorySearch, setCategorySearch] = useDraftState(`${draftKey}:categorySearch`, '');

    // Product states
    const [products, setProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');

    // Edit mode হলে (initialData আছে) Company field disable থাকবে
    const isCompanyLocked = !!initialData;

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
    };

    const handleClearCompany = () => {
        setCompanySearch('');
        setFormData({ ...formData, company: '', companyContact: '', companyAddress: '', product: '' });
        setProductSearch('');
        if (onCompanyClear) {
            onCompanyClear();
        }
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
    };

    const handleClearCategory = () => {
        setCategorySearch('');
        setFormData({ ...formData, category: '', product: '' });
        setProductSearch('');
    };

    // Filter products based on company, category, isActive, sku presence, typing search, and exclude already added products
    const filteredProducts = products.filter((prod) => {
        if (!formData.company) return false;
        if (!prod.productName || !prod.company) return false;
        if (prod.isActive === false) return false;
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
    };

    const handleClearProduct = () => {
        setProductSearch('');
        setFormData({ ...formData, product: '' });
    };

    const quickAdd = (label, path) => (
        <button
            type="button"
            onClick={() => navigate(path)}
            className="inline-flex items-center h-6 px-1.5 -my-1 -mr-1.5 rounded-md text-[11px] font-semibold text-brand-700 hover:bg-brand-50 cursor-pointer whitespace-nowrap"
        >
            + {label}
        </button>
    );

    const companyInfo = [formData.companyContact, formData.companyAddress].filter(Boolean).join(' | ');

    return (
        <div className="relative z-20">
            <Card title="Purchase Information" subtitle="Select company, category and products for this purchase">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Company */}
                    <div className="min-w-0">
                        {isCompanyLocked ? (
                            <div>
                                <span className={labelCls}>Company *</span>
                                <input readOnly disabled value={companySearch} className={inputCls} />
                                <p className="text-[11px] text-slate-400 mt-1">Company can't be changed while editing</p>
                            </div>
                        ) : (
                            <ComboField
                                label={<FieldLabel text="Company *" action={quickAdd('Add Company', '/company')} />}
                                value={companySearch}
                                placeholder="Search or select company..."
                                options={filteredCompanies.map((c) => ({
                                    key: c._id,
                                    title: c.businessName,
                                    sub: [c.contactNumber, c.address].filter(Boolean).join(' | '),
                                    raw: c,
                                }))}
                                onType={(val) => setCompanySearch(val)}
                                onClear={handleClearCompany}
                                onPick={(o) => handleSelectCompany(o.raw)}
                            />
                        )}
                        {formData.company && companyInfo && !isCompanyLocked && (
                            <p className="text-[11px] text-slate-500 mt-1 truncate" title={companyInfo}>{companyInfo}</p>
                        )}
                    </div>

                    {/* Shipping */}
                    <div className="min-w-0">
                        <label className={labelCls}>Shipping Address</label>
                        <input
                            type="text"
                            name="shippingAddress"
                            value={formData.shippingAddress}
                            onChange={handleChange}
                            placeholder="Enter shipping address"
                            className={inputCls}
                        />
                    </div>

                    {/* Category */}
                    <div className="min-w-0">
                        <ComboField
                            label={<FieldLabel text="Category" action={quickAdd('Add Category', '/category')} />}
                            value={categorySearch}
                            placeholder="Search or select category..."
                            options={filteredCategories.map((c) => ({ key: c._id, title: c.name, raw: c }))}
                            onType={(val) => {
                                setCategorySearch(val);
                                setFormData({ ...formData, category: val });
                            }}
                            onClear={handleClearCategory}
                            onPick={(o) => handleSelectCategory(o.raw)}
                        />
                    </div>

                    {/* Date */}
                    <div className="min-w-0">
                        <span className={labelCls}>Purchase Date *</span>
                        <DateInput name="date" value={labelToISO(formData.date)} onChange={handleDateChange} placeholder="Select date" />
                    </div>
                </div>

                {/* Product */}
                <div className="mt-5 rounded-2xl border border-brand-100 bg-brand-50/40 p-3 sm:p-4">
                    {formData.company ? (
                        <>
                            <ComboField
                                label={<FieldLabel text="Select Product *" action={quickAdd('Add Product', '/product')} />}
                                value={productSearch}
                                placeholder="Search by product name or SKU..."
                                options={filteredProducts.map((p) => ({
                                    key: p._id,
                                    title: p.productName,
                                    sub: `Company: ${p.company}${p.category ? ` | Category: ${p.category}` : ''}${p.sku ? ` | SKU: ${p.sku}` : ''}`,
                                    raw: p,
                                }))}
                                onType={(val) => {
                                    setProductSearch(val);
                                    setFormData({ ...formData, product: val });
                                }}
                                onClear={handleClearProduct}
                                onPick={(o) => handleSelectProduct(o.raw)}
                            />
                            <p className="text-[11px] text-slate-500 mt-1.5">
                                Only active products of {formData.company} are listed. Products already added are hidden.
                            </p>
                        </>
                    ) : (
                        <div>
                            <span className={labelCls}>
                                <FieldLabel text="Select Product *" action={quickAdd('Add Product', '/product')} />
                            </span>
                            <input disabled placeholder="Select a company first..." className={inputCls} />
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default PurchaseForm;