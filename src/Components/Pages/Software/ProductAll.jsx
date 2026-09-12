import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaStickyNote, FaTimes, FaEye, FaPlus, FaMinus, FaClock, FaFilter, FaRedo, FaBoxOpen, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ProductForm from './ProductForm';

const ProductAll = () => {
    const [products, setProducts] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [categories, setCategories] = useState([]);
    const [companies, setCompanies] = useState([]);

    // Toggle Form State (Default false/off)
    const [isFormOpen, setIsFormOpen] = useState(false);

    // Modal State for Description/Note
    const [selectedDescription, setSelectedDescription] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Separate Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        productName: '',
        sku: '',
        category: '',
        company: '',
        supplier: '',
        price: '',
        status: ''
    });

    // Form state (updated with all properties matching your data structure)
    const [formData, setFormData] = useState({
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
        freeProductQty: '',
        freeProductName: '',
        openingStockQty: '',
        note: '',
        isActive: true
    });

    // Refs for triggering date pickers
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Category & Company searchable-select state
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const categoryDropdownRef = useRef(null);
    const companyDropdownRef = useRef(null);

    // Helper function to format date & time like: 28/08/2026, 4:26:09 pm
    const formatDateTime = (date = new Date()) => {
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

    // Fetch products data
    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:5000/product');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Handle input change
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    // Helper function to format ISO date (YYYY-MM-DD) to readable format
    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;

        const dateObj = new Date(year, month - 1, day);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString('en-GB', options);
    };


    // Fetch categories for filter dropdown
    const fetchCategories = async () => {
        try {
            const res = await fetch('http://localhost:5000/category');
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    // Fetch companies for filter dropdown
    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    useEffect(() => {
        fetchProducts();
        fetchCategories();
        fetchCompanies();
    }, []);

    // Close Category/Company dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setIsCategoryOpen(false);
            }
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Filter categories based on search typing
    const filteredCategories = categories.filter((cat) =>
        cat.name?.toLowerCase().includes(filters.category.toLowerCase())
    );

    const handleSelectCategory = (cat) => {
        setFilters({ ...filters, category: cat.name });
        setCurrentPage(1);
        setIsCategoryOpen(false);
    };

    const handleClearCategory = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, category: '' });
        setCurrentPage(1);
        setIsCategoryOpen(false);
    };

    // Filter companies based on search typing
    const filteredCompanies = companies.filter((comp) =>
        comp.businessName?.toLowerCase().includes(filters.company.toLowerCase())
    );

    const handleSelectCompany = (comp) => {
        setFilters({ ...filters, company: comp.businessName });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, company: '' });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    // Handle Filter input change
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            productName: '',
            sku: '',
            category: '',
            company: '',
            supplier: '',
            price: '',
            status: '',
        });
        setCurrentPage(1);
    };

    // Handle Form Submit (Add or Update)
    const handleSubmit = async (e) => {
        e.preventDefault();

        const submissionData = editingId
            ? formData
            : { ...formData, createdAt: formatDateTime(new Date()) };

        const url = editingId
            ? `http://localhost:5000/product/${editingId}`
            : 'http://localhost:5000/product';

        const method = editingId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submissionData),
            });

            const data = await res.json();
            if (data.insertedId || data.modifiedCount > 0 || res.ok) {
                Swal.fire({
                    icon: 'success',
                    title: editingId ? 'Product Updated Successfully!' : 'Product Added Successfully!',
                    showConfirmButton: false,
                    timer: 1500,
                    background: '#f0fdf4',
                    color: '#166534'
                });

                // Reset form & Close it
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
                    freeProductQty: '',
                    freeProductName: '',
                    openingStockQty: '',
                    note: '',
                    isActive: true
                });
                setEditingId(null);
                setIsFormOpen(false);
                fetchProducts();
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    // Handle Delete with SweetAlert
    const handleDelete = (id) => {
        Swal.fire({
            title: "Are you sure?",
            text: "You won't be able to revert this!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`http://localhost:5000/product/${id}`, {
                        method: 'DELETE',
                    });
                    const data = await res.json();
                    if (data.deletedCount > 0 || res.ok) {
                        Swal.fire({
                            title: "Deleted!",
                            text: "Your product has been deleted.",
                            icon: "success",
                            timer: 1500,
                            showConfirmButton: false
                        });
                        fetchProducts();
                    }
                } catch (error) {
                    console.error('Error deleting product:', error);
                }
            }
        });
    };

    // Handle Edit (Load data to form & Open form)
    const handleEdit = (product) => {
        setFormData({
            productName: product.productName || '',
            company: product.company || '',
            sku: product.sku || '',
            category: product.category || '',
            alertQuantity: product.alertQuantity || '',
            purchasePrice: product.purchasePrice || '',
            sellingPrice: product.sellingPrice || '',
            mrp: product.mrp || '',
            unit: product.unit || '',
            pcsOfUnit: product.pcsOfUnit || '',
            freeProductQty: product.freeProductQty || '',
            freeProductName: product.freeProductName || '',
            openingStockQty: product.openingStockQty || '',
            note: product.note || '',
            isActive: product.isActive !== undefined ? product.isActive : true
        });
        setEditingId(product._id);
        setIsFormOpen(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Handle Cancel Edit
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
            freeProductQty: '',
            freeProductName: '',
            openingStockQty: '',
            note: '',
            isActive: true
        });
        setIsFormOpen(false);
    };

    // Open Note/Description Modal
    const handleOpenModal = (noteText) => {
        setSelectedDescription(noteText || 'No note available for this product.');
        setIsModalOpen(true);
    };

    // Advanced Multi-field & Date Range Filtering Logic
    const filteredProducts = products.filter((product) => {
        // Date Range Filter
        if (filters.startDate || filters.endDate) {
            if (!product.createdAt) return false;

            const datePart = product.createdAt.split(',')[0].trim(); // DD/MM/YYYY
            const [cDay, cMonth, cYear] = datePart.split('/');
            const productDate = new Date(`${cYear}-${cMonth}-${cDay}`);
            productDate.setHours(0, 0, 0, 0);

            if (filters.startDate) {
                const startDateObj = new Date(filters.startDate);
                startDateObj.setHours(0, 0, 0, 0);
                if (!isNaN(startDateObj) && productDate < startDateObj) return false;
            }

            if (filters.endDate) {
                const endDateObj = new Date(filters.endDate);
                endDateObj.setHours(0, 0, 0, 0);
                if (!isNaN(endDateObj) && productDate > endDateObj) return false;
            }
        }

        // Product Name Filter
        if (filters.productName && !product.productName?.toLowerCase().includes(filters.productName.toLowerCase())) {
            return false;
        }
        // SKU Filter
        if (filters.sku && !product.sku?.toLowerCase().includes(filters.sku.toLowerCase())) {
            return false;
        }
        // Category Filter
        if (filters.category && !product.category?.toLowerCase().includes(filters.category.toLowerCase())) {
            return false;
        }
        // Company Filter
        if (filters.company && !product.company?.toLowerCase().includes(filters.company.toLowerCase())) {
            return false;
        }
        // Status Filter
        if (filters.status !== '' && String(product.isActive) !== filters.status) {
            return false;
        }

        return true;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header Title & Add New Button */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Product Inventory Management
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Manage your store items, stock levels, pricing, and details efficiently.</p>
                    </div>

                    {/* Toggle Button for Form */}
                    <button
                        onClick={() => {
                            if (isFormOpen && editingId) {
                                handleCancelEdit();
                            } else {
                                setIsFormOpen(!isFormOpen);
                            }
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 ${isFormOpen
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {isFormOpen ? <><FaMinus /> Close Form</> : <><FaPlus /> Add New Product</>}
                    </button>
                </div>

                {/* Smooth Collapsible Form Component */}
                <div
                    className={`overflow-hidden transition-all duration-500 ease-in-out ${isFormOpen ? 'max-h-[1400px] opacity-100 mb-8' : 'max-h-0 opacity-0 mb-0'
                        }`}
                >
                    <ProductForm
                        formData={formData}
                        setFormData={setFormData}
                        handleChange={handleChange}
                        handleSubmit={handleSubmit}
                        editingId={editingId}
                        setEditingId={setEditingId}
                        handleCancelEdit={handleCancelEdit}
                        fetchProducts={fetchProducts}
                    />
                </div>
                {/* Separate Multi-Search Filter Panel */}
                <div className="bg-white shadow-lg rounded-2xl p-5 mb-6 border border-indigo-100">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <FaFilter className="text-indigo-600" /> Filter & Search Panel
                        </h3>
                        <button
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold"
                        >
                            <FaRedo size={11} /> Clear All Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {/* Start Date */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
                            >
                                <input
                                    ref={startDateRef}
                                    type="date"
                                    name="startDate"
                                    value={filters.startDate}
                                    onChange={handleFilterChange}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select start date"
                                    value={displayFormattedDate(filters.startDate)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}
                            >
                                <input
                                    ref={endDateRef}
                                    type="date"
                                    name="endDate"
                                    value={filters.endDate}
                                    onChange={handleFilterChange}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select end date"
                                    value={displayFormattedDate(filters.endDate)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>

                        {/* Product Name Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product Name</label>
                            <input
                                type="text"
                                name="productName"
                                placeholder="Search product..."
                                value={filters.productName}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* SKU Search */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">SKU</label>
                            <input
                                type="text"
                                name="sku"
                                placeholder="Search SKU..."
                                value={filters.sku}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50/50"
                            />
                        </div>

                        {/* Category Searchable Dropdown Filter */}
                        <div className="relative" ref={categoryDropdownRef}>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Category</label>
                            <div
                                onClick={() => setIsCategoryOpen(true)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                            >
                                <input
                                    type="text"
                                    placeholder="Search or select category..."
                                    value={filters.category}
                                    onChange={(e) => {
                                        handleFilterChange({ target: { name: 'category', value: e.target.value } });
                                        setIsCategoryOpen(true);
                                    }}
                                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                                />
                                {filters.category && (
                                    <button type="button" onClick={handleClearCategory} className="text-gray-400 hover:text-red-500 pl-1">
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>

                            {isCategoryOpen && (
                                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                    {filteredCategories.length > 0 ? (
                                        filteredCategories.map((cat) => (
                                            <div
                                                key={cat._id}
                                                onClick={() => handleSelectCategory(cat)}
                                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                            >
                                                {cat.name}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No category found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Company Searchable Dropdown Filter */}
                        <div className="relative" ref={companyDropdownRef}>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                            <div
                                onClick={() => setIsCompanyOpen(true)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                            >
                                <input
                                    type="text"
                                    placeholder="Search or select company..."
                                    value={filters.company}
                                    onChange={(e) => {
                                        handleFilterChange({ target: { name: 'company', value: e.target.value } });
                                        setIsCompanyOpen(true);
                                    }}
                                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                                />
                                {filters.company && (
                                    <button type="button" onClick={handleClearCompany} className="text-gray-400 hover:text-red-500 pl-1">
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>

                            {isCompanyOpen && (
                                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                    {filteredCompanies.length > 0 ? (
                                        filteredCompanies.map((comp) => (
                                            <div
                                                key={comp._id}
                                                onClick={() => handleSelectCompany(comp)}
                                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                            >
                                                {comp.businessName}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Status Dropdown Filter */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                            <select
                                name="status"
                                value={filters.status}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                            >
                                <option value="">All Status</option>
                                <option value="true">Active</option>
                                <option value="false">In-Active</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section (Showing all properties from the database) */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-100">
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <FaBoxOpen /> Product Inventory List
                        </h2>
                        <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                            Showing: {filteredProducts.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredProducts.length)}` : 0} of {filteredProducts.length} ({products.length} total)
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-xs">
                            <thead className="bg-gray-50 text-gray-600 font-bold uppercase tracking-wider">
                                <tr>
                                    <th className="px-3 py-3 text-left">Product Name</th>
                                    <th className="px-3 py-3 text-left">Company</th>
                                    <th className="px-3 py-3 text-left">SKU</th>
                                    <th className="px-3 py-3 text-left">Category</th>
                                    <th className="px-3 py-3 text-center">Alert Qty</th>
                                    <th className="px-3 py-3 text-left">Purchase</th>
                                    <th className="px-3 py-3 text-left">Selling</th>
                                    <th className="px-3 py-3 text-left">MRP</th>
                                    <th className="px-3 py-3 text-left">Unit / Pcs</th>
                                    <th className="px-3 py-3 text-left">Free Item</th>
                                    <th className="px-3 py-3 text-center">Stock</th>
                                    <th className="px-3 py-3 text-center">Note</th>
                                    <th className="px-3 py-3 text-center">Status</th>
                                    <th className="px-3 py-3 text-left">Created At</th>
                                    <th className="px-3 py-3 text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentProducts.length > 0 ? (
                                    currentProducts.map((product) => (
                                        <tr key={product._id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-3 py-3 whitespace-nowrap font-bold text-gray-900">
                                                {product.productName}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                                {product.company || 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
                                                    {product.sku || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                                {product.category || 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center text-amber-600 font-semibold">
                                                {product.alertQuantity || '0'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap font-semibold text-rose-600">
                                                ৳ {product.purchasePrice ? Number(product.purchasePrice).toLocaleString() : '0'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap font-semibold text-emerald-600">
                                                ৳ {product.sellingPrice ? Number(product.sellingPrice).toLocaleString() : '0'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap font-semibold text-indigo-600">
                                                ৳ {product.mrp ? Number(product.mrp).toLocaleString() : '0'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                                {product.unit || 'N/A'} ({product.pcsOfUnit || '0'} pcs)
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                                {product.freeProductQty ? `${product.freeProductQty}x ${product.freeProductName || ''}` : 'None'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                                <span className={`px-2 py-0.5 rounded-full font-bold ${Number(product.openingStockQty) > 5 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                    }`}>
                                                    {product.openingStockQty || '0'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleOpenModal(product.note)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded transition-all font-semibold"
                                                >
                                                    <FaEye size={11} /> Note
                                                </button>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center">
                                                <span className={`px-2 py-0.5 rounded-full font-bold ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {product.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-500">
                                                {product.createdAt ? (
                                                    <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                                                        <FaClock className="text-indigo-400" size={10} /> {product.createdAt}
                                                    </span>
                                                ) : 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 whitespace-nowrap text-center font-medium">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleEdit(product)}
                                                        className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded transition-all shadow-sm"
                                                        title="Edit"
                                                    >
                                                        <FaEdit size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(product._id)}
                                                        className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded transition-all shadow-sm"
                                                        title="Delete"
                                                    >
                                                        <FaTrash size={13} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="15" className="text-center py-10 text-gray-400 text-sm">
                                            No matching products found!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {filteredProducts.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm'
                                        }`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm'
                                        }`}
                                >
                                    Next <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Smooth Note/Description Modal */}
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300 ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                        }`}
                >
                    <div
                        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 ${isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
                            }`}
                    >
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaStickyNote className="text-indigo-600" /> Product Note
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm min-h-[80px] whitespace-pre-wrap">
                            {selectedDescription}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default ProductAll;