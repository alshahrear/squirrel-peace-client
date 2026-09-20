import React, { useState, useEffect, useRef } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';
import { useStockRows, formatPrimaryUnit, formatFreeQty } from './StockList';

const StockAlert = () => {
    const { stockRows, companies, loading: stockLoading } = useStockRows();

    const [products, setProducts] = useState([]);
    const [productsLoading, setProductsLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Separate Filter States
    const [filters, setFilters] = useState({
        productName: '',
        company: ''
    });

    // Status Filter (Level / Low / Out) - একাধিক select করা যাবে
    const [statusFilters, setStatusFilters] = useState([]);

    const toggleStatusFilter = (status) => {
        setStatusFilters((prev) =>
            prev.includes(status)
                ? prev.filter((s) => s !== status)
                : [...prev, status]
        );
        setCurrentPage(1);
    };

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Fetch Products (alertQuantity source)
    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:5000/product');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setProductsLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Close Company dropdown on outside click
    useEffect(() => {
        const handleClickOutsideCompany = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCompany);
        return () => document.removeEventListener('mousedown', handleClickOutsideCompany);
    }, []);

    // Filter companies based on search typing
    const filteredCompanies = companies.filter((comp) =>
        comp.businessName?.toLowerCase().includes(filters.company.toLowerCase())
    );

    const handleSelectCompany = (comp) => {
        setFilters({ ...filters, company: comp.businessName });
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, company: '' });
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };

    // Handle Filter input change
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            productName: '',
            company: ''
        });
        setStatusFilters([]);
        setCurrentPage(1);
    };

    // Status বের করা (Total Qty ভিত্তিতে): Level (alertQty এর সমান), Low (0 < qty < alertQty), Out (qty === 0)
    const getRowStatus = (row) => {
        if (row.totalQty <= 0) return 'Out';
        if (row.totalQty === row.alertQuantity) return 'Level';
        return 'Low';
    };

    // productName + company key দিয়ে product এর alertQuantity lookup map বানানো
    const alertMap = new Map();
    products.forEach((p) => {
        const key = `${(p.productName || '').trim().toLowerCase()}||${(p.company || '').trim().toLowerCase()}`;
        alertMap.set(key, Number(p.alertQuantity) || 0);
    });

    // শুধু সেই product গুলো রাখা হচ্ছে যেগুলো /product এ registered এবং বর্তমান stock (Total Qty) alertQuantity এর সমান বা কম
    const alertRows = stockRows
        .filter((row) => alertMap.has(row.id))
        .map((row) => ({ ...row, alertQuantity: alertMap.get(row.id) }))
        .filter((row) => row.totalQty <= row.alertQuantity);

    // Search Filter (Product Name + Company)
    const searchFilteredRows = alertRows.filter((row) => {
        if (filters.productName && !row.productName?.toLowerCase().includes(filters.productName.toLowerCase())) {
            return false;
        }
        if (filters.company && !row.company?.toLowerCase().includes(filters.company.toLowerCase())) {
            return false;
        }
        return true;
    });

    // Status Filter (Level / Low / Out) সহ Final Filtered Rows
    const filteredRows = searchFilteredRows.filter((row) =>
        statusFilters.length === 0 || statusFilters.includes(getRowStatus(row))
    );

    // Pagination Calculations
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const loading = stockLoading || productsLoading;

    const statusStyles = {
        Level: {
            row: 'bg-yellow-200/70 hover:bg-yellow-200 border-l-4 border-yellow-500',
            badge: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            pill: 'bg-yellow-200 text-yellow-800'
        },
        Low: {
            row: 'bg-orange-200/70 hover:bg-orange-200 border-l-4 border-orange-500',
            badge: 'bg-orange-100 text-orange-700 border border-orange-200',
            pill: 'bg-orange-200 text-orange-800'
        },
        Out: {
            row: 'bg-red-200/70 hover:bg-red-200 border-l-4 border-red-500',
            badge: 'bg-red-100 text-red-700 border border-red-200',
            pill: 'bg-red-200 text-red-800'
        }
    };

    const getRowClass = (row) => statusStyles[getRowStatus(row)].row;

    // Summary counts (Search Filter অনুযায়ী, Status Filter ছাড়া)
    const statusCounts = searchFilteredRows.reduce(
        (acc, row) => {
            const status = getRowStatus(row);
            acc[status] += 1;
            return acc;
        },
        { Level: 0, Low: 0, Out: 0 }
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Section: Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Stock Alert
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Products at or below alert quantity</p>
                    </div>
                </div>

                {/* Table Card Section */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Alert Directory</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of {filteredRows.length}
                        </span>
                    </div>

                    {/* Status Summary Cards (Click করে Filter করা যাবে) */}
                    <div className="grid grid-cols-3 gap-3">
                        <div
                            onClick={() => toggleStatusFilter('Level')}
                            className={`cursor-pointer rounded-2xl p-4 flex items-center justify-between transition-all ${statusStyles.Level.badge} ${statusFilters.includes('Level') ? 'ring-2 ring-yellow-500 scale-[1.02]' : 'opacity-90 hover:opacity-100'}`}
                        >
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Level</p>
                                <p className="text-2xl font-extrabold">{statusCounts.Level}</p>
                            </div>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${statusStyles.Level.pill}`}>=</span>
                        </div>
                        <div
                            onClick={() => toggleStatusFilter('Low')}
                            className={`cursor-pointer rounded-2xl p-4 flex items-center justify-between transition-all ${statusStyles.Low.badge} ${statusFilters.includes('Low') ? 'ring-2 ring-orange-500 scale-[1.02]' : 'opacity-90 hover:opacity-100'}`}
                        >
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Low</p>
                                <p className="text-2xl font-extrabold">{statusCounts.Low}</p>
                            </div>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${statusStyles.Low.pill}`}>↓</span>
                        </div>
                        <div
                            onClick={() => toggleStatusFilter('Out')}
                            className={`cursor-pointer rounded-2xl p-4 flex items-center justify-between transition-all ${statusStyles.Out.badge} ${statusFilters.includes('Out') ? 'ring-2 ring-red-500 scale-[1.02]' : 'opacity-90 hover:opacity-100'}`}
                        >
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">Out</p>
                                <p className="text-2xl font-extrabold">{statusCounts.Out}</p>
                            </div>
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${statusStyles.Out.pill}`}>0</span>
                        </div>
                    </div>

                    {/* Filter & Search Panel */}
                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                            >
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Product Name Search */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product Name</label>
                                <input
                                    type="text"
                                    name="productName"
                                    placeholder="Search product..."
                                    value={filters.productName}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Company Searchable Dropdown */}
                            <div className="relative" ref={companyDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <div
                                    onClick={() => setIsCompanyOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
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
                        </div>
                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading stock alert...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No low/out of stock products!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm uppercase tracking-wider">
                                        <th className="py-4 px-4 whitespace-nowrap">Product Name</th>
                                        <th className="py-4 px-4 whitespace-nowrap">Company</th>
                                        <th className="py-4 px-4 whitespace-nowrap">Primary Unit</th>
                                        <th className="py-4 px-4 whitespace-nowrap text-center">Product Qty</th>
                                        <th className="py-4 px-4 whitespace-nowrap text-center">Free Qty</th>
                                        <th className="py-4 px-4 whitespace-nowrap text-center">Total Qty</th>
                                        <th className="py-4 px-4 whitespace-nowrap text-center">Alert Qty</th>
                                        <th className="py-4 px-4 whitespace-nowrap text-center">Status</th>
                                        <th className="py-4 px-4 whitespace-nowrap text-center">Stock Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentRows.map((row) => {
                                        const status = getRowStatus(row);
                                        return (
                                            <tr key={row.id} className={`transition duration-150 ${getRowClass(row)}`}>
                                                <td className="py-4 px-4 font-bold text-gray-800 whitespace-nowrap">
                                                    {row.productName} <span className="text-gray-400 font-normal">({row.alertQuantity})</span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{row.company || 'N/A'}</td>
                                                <td className="py-4 px-4 whitespace-nowrap">
                                                    <span className="bg-white/70 px-2 py-0.5 rounded font-mono text-gray-700">
                                                        {formatPrimaryUnit(row.unit, row.unitQty, row.pcsQty, row.totalPcs, row.productQty)}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center font-semibold text-gray-700">{row.productQty}</td>
                                                <td className="py-4 px-4 text-center font-semibold text-indigo-600">
                                                    {formatFreeQty(row.freeQty, row.freeProduct)}
                                                </td>
                                                <td className="py-4 px-4 text-center font-bold text-gray-800">{row.totalQty}</td>
                                                <td className="py-4 px-4 text-center font-bold text-gray-600">{row.alertQuantity}</td>
                                                <td className="py-4 px-4 text-center">
                                                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${statusStyles[status].pill}`}>
                                                        {status}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 text-center font-bold text-emerald-600">
                                                    ৳ {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {!loading && filteredRows.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
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
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
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
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    Next <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StockAlert;