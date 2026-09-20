import React, { useState, useEffect, useRef } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight, FaWarehouse } from 'react-icons/fa';

// ---- Shared helpers/hook (StockAlert সহ অন্য page গুলোও এখান থেকে reuse করবে) ----

export const formatPrimaryUnit = (unit, unitQty, pcsQty, totalPcs, remainingTotalPcs) => {
    const pcsPerBundle = unitQty > 0 ? (totalPcs - pcsQty) / unitQty : 0;

    if (!pcsPerBundle || pcsPerBundle <= 0) {
        return `${remainingTotalPcs} Pcs`;
    }

    const bundleCount = Math.floor(remainingTotalPcs / pcsPerBundle);
    const pcsRemainder = remainingTotalPcs % pcsPerBundle;

    const parts = [];
    if (bundleCount > 0) parts.push(`${bundleCount} ${unit || ''}`.trim());
    if (pcsRemainder > 0) parts.push(`${pcsRemainder} Pcs`);
    if (parts.length === 0) return `0 ${unit || 'Pcs'}`;
    return parts.join(' ');
};

export const formatFreeQty = (freeQty, freeProduct) => {
    if (freeQty <= 0) return '0';
    return freeProduct ? `${freeQty} (${freeProduct})` : `${freeQty}`;
};

const buildStockRows = (purchaseList) => {
    const grouped = new Map();

    purchaseList.forEach((purchase) => {
        if (purchase.receiveStatus !== 'Received') return;

        const items = purchase.items || [];
        const returnHistory = purchase.returnHistory || [];

        const itemsSubtotalSum = items.reduce((sum, i) => sum + (Number(i.subtotal) || 0), 0);

        // Overall Discount সবসময় % ভিত্তিতে হিসাব হবে (amount type হলেও প্রথমে taka value বের করে
        // itemsSubtotalSum এর তুলনায় % বের করা হয়, তারপর সেই % প্রতিটা product এর নিজ subtotal
        // অনুযায়ী apply হবে)
        const overallDiscountValue =
            purchase.overallDiscountValue !== undefined && purchase.overallDiscountValue !== null
                ? Number(purchase.overallDiscountValue) || 0
                : purchase.overallDiscountType === 'percent'
                    ? (itemsSubtotalSum * (Number(purchase.overallDiscount) || 0)) / 100
                    : Number(purchase.overallDiscount) || 0;

        const overallDiscountPercent = itemsSubtotalSum > 0
            ? (overallDiscountValue / itemsSubtotalSum) * 100
            : 0;

        items.forEach((item) => {
            let returnedPcs = 0;
            let returnedFreeQty = 0;
            let returnedAmount = 0;

            returnHistory.forEach((ret) => {
                (ret.items || []).forEach((retItem) => {
                    if (retItem.productId === item.productId) {
                        returnedPcs += Number(retItem.returnTotalQty) || 0;
                        returnedFreeQty += Number(retItem.returnFreeQty) || 0;
                        returnedAmount += Number(retItem.returnAmount) || 0;
                    }
                });
            });

            const productQty = Math.max(0, (Number(item.totalPcs) || 0) - returnedPcs);
            const freeQty = Math.max(0, (Number(item.freeQty) || 0) - returnedFreeQty);
            const totalQty = productQty + freeQty;

            const itemDiscountShare = (Number(item.subtotal) || 0) * (overallDiscountPercent / 100);

            const totalAmount = Math.max(0, (Number(item.subtotal) || 0) - returnedAmount - itemDiscountShare);

            const key = `${(item.productName || '').trim().toLowerCase()}||${(purchase.company || '').trim().toLowerCase()}`;

            if (grouped.has(key)) {
                const existing = grouped.get(key);
                existing.productQty += productQty;
                existing.freeQty += freeQty;
                existing.totalQty += totalQty;
                existing.totalAmount += totalAmount;
                existing.sumRawTotalPcs += (Number(item.totalPcs) || 0);
            } else {
                grouped.set(key, {
                    id: key,
                    purchaseDate: purchase.purchaseDate,
                    productName: item.productName,
                    company: purchase.company,
                    unit: item.unit,
                    unitQty: Number(item.unitQty) || 0,
                    pcsQty: Number(item.pcsQty) || 0,
                    totalPcs: Number(item.totalPcs) || 0,
                    freeProduct: item.freeProduct,
                    productQty,
                    freeQty,
                    totalQty,
                    totalAmount,
                    sumRawTotalPcs: Number(item.totalPcs) || 0
                });
            }
        });
    });

    return Array.from(grouped.values());
};

// Purchase + company data fetch করে computed stockRows রিটার্ন করে — এই একটা জায়গায় update করলেই সব page এ reflect করবে
export const useStockRows = () => {
    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchPurchases = async () => {
        try {
            const response = await fetch('http://localhost:5000/purchase');
            const data = await response.json();
            setPurchases(data);
        } catch (error) {
            console.error('Error fetching purchases:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPurchases();
        fetchCompanies();
    }, []);

    const stockRows = buildStockRows(purchases);

    return { stockRows, companies, loading };
};

const StockList = () => {
    const { stockRows, companies, loading } = useStockRows();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Separate Filter States
    const [filters, setFilters] = useState({
        productName: '',
        company: ''
    });

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

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
        setCurrentPage(1);
    };
    // Advanced Multi-field Filtering Logic
    const filteredRows = stockRows.filter((row) => {
        // Product Name Filter
        if (filters.productName && !row.productName?.toLowerCase().includes(filters.productName.toLowerCase())) {
            return false;
        }
        // Company Filter
        if (filters.company && !row.company?.toLowerCase().includes(filters.company.toLowerCase())) {
            return false;
        }

        return true;
    });

    // Total Stock Value Calculation (based on currently FILTERED data)
    const totalStockValue = filteredRows.reduce((sum, row) => sum + row.totalAmount, 0);

    // Pagination Calculations
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Section: Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Stock List
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Received purchase stock, netted against returns</p>
                    </div>
                </div>

                {/* Table Card Section */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Stock Directory</h3>
                        <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-bold text-xs rounded-full shadow-sm">
                            <FaWarehouse size={11} /> Total Stock Value: ৳ {totalStockValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of {filteredRows.length} ({stockRows.length} total)
                        </span>
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
                        <div className="text-center py-20 text-gray-500 font-medium">Loading stock list...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No stock found!</div>
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
                                        <th className="py-4 px-4 whitespace-nowrap text-center">Stock Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentRows.map((row) => (
                                        <tr key={row.id} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="py-4 px-4 font-bold text-gray-800 whitespace-nowrap">{row.productName}</td>
                                            <td className="py-4 px-4 text-gray-600 whitespace-nowrap">{row.company || 'N/A'}</td>
                                            <td className="py-4 px-4 whitespace-nowrap">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded font-mono text-gray-700">
                                                    {formatPrimaryUnit(row.unit, row.unitQty, row.pcsQty, row.totalPcs, row.totalQty)}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 text-center font-semibold text-gray-700">{row.productQty}</td>
                                            <td className="py-4 px-4 text-center font-semibold text-indigo-600">
                                                {formatFreeQty(row.freeQty, row.freeProduct)}
                                            </td>
                                            <td className="py-4 px-4 text-center font-bold text-gray-800">{row.totalQty}</td>
                                            <td className="py-4 px-4 text-center font-bold text-emerald-600">
                                                ৳ {row.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                        </tr>
                                    ))}
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

export default StockList;