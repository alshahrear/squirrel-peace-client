import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const PurchaseReturn = () => {
    const [returns, setReturns] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Separate Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        company: '',
        invoiceNo: ''
    });

    // Refs for triggering date pickers
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Action Dropdown state
    const [openDropdownId, setOpenDropdownId] = useState(null);

    // Dropdown er baire click korle close hobe
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Fetch Companies data for filter dropdown
    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    // Fetch Purchases -> proti order er returnHistory theke each entry ke alada row banaia flatten kora
    const fetchReturns = async () => {
        try {
            const response = await fetch('http://localhost:5000/purchase');
            const data = await response.json();

            const flattenedReturns = [];
            data.forEach((order) => {
                (order.returnHistory || []).forEach((ret) => {
                    const retItems = ret.items || [];

                    const sumUnitQty = retItems.reduce((s, it) => s + (Number(it.returnUnitQty) || 0), 0);
                    const sumPcsQty = retItems.reduce((s, it) => s + (Number(it.returnPcsQty) || 0), 0);
                    const sumFreeUnitQty = retItems.reduce((s, it) => s + (Number(it.returnFreeUnitQty) || 0), 0);
                    const sumFreePcsQty = retItems.reduce((s, it) => s + (Number(it.returnFreePcsQty) || 0), 0);

                    // Others Free Product return er sum
                    const retFreeItems = ret.freeItems || [];
                    const sumOtherFreeUnitQty = retFreeItems.reduce((s, it) => s + (Number(it.returnUnitQty) || 0), 0);
                    const sumOtherFreePcsQty = retFreeItems.reduce((s, it) => s + (Number(it.returnPcsQty) || 0), 0);
                    const otherFreeFirst = retFreeItems[0];
                    const matchedOtherFreeItem = otherFreeFirst
                        ? (order.freeItems || []).find((fi) => fi.productId === otherFreeFirst.productId)
                        : null;
                    const otherFreeUnitLabel = matchedOtherFreeItem?.unit || 'Unit';

                    // Unit label item er original order.items theke khuje ber kora
                    const firstItem = retItems[0];
                    const matchedOrderItem = firstItem
                        ? (order.items || []).find((oi) => oi.productId === firstItem.productId)
                        : null;
                    const unitLabel = matchedOrderItem?.unit || 'Unit';

                    flattenedReturns.push({
                        orderId: order._id,
                        returnId: ret.returnId,
                        returnDate: ret.returnDate,
                        invoiceNo: order.invoiceNo,
                        company: order.company,
                        totalReturnPcs: ret.totalReturnPcs,
                        totalReturnFreeQty: ret.totalReturnFreeQty,
                        totalReturnAmount: ret.totalReturnAmount,
                        totalReturnFreeItemsQty: ret.totalReturnFreeItemsQty,
                        sumOtherFreeUnitQty,
                        sumOtherFreePcsQty,
                        otherFreeUnitLabel,
                        sumUnitQty,
                        sumPcsQty,
                        sumFreeUnitQty,
                        sumFreePcsQty,
                        unitLabel,
                    });
                });
            });

            setReturns(flattenedReturns.reverse());
        } catch (error) {
            console.error('Error fetching returns:', error);
            showToast('Failed to load returns!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchCompanies();
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
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, company: '' });
        setIsCompanyOpen(false);
    };

    // Helper function to format ISO date (YYYY-MM-DD) to "05 Aug 2026"
    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;

        const dateObj = new Date(year, month - 1, day);
        const options = { day: '2-digit', month: 'short', year: 'numeric' };
        return dateObj.toLocaleDateString('en-GB', options);
    };

    // Helper function to parse any date string into a timezone-safe LOCAL date (time stripped)
    // Handles: DD/MM/YYYY (with optional ", time" suffix), YYYY-MM-DD (from <input type="date">), and ISO strings
    const parseToLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const datePart = dateStr.split(',')[0].trim();

        if (datePart.includes('/')) {
            const [d, m, y] = datePart.split('/');
            if (!d || !m || !y) return null;
            return new Date(Number(y), Number(m) - 1, Number(d));
        }

        if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
            const [y, m, d] = datePart.split('-');
            return new Date(Number(y), Number(m) - 1, Number(d));
        }

        const parsed = new Date(datePart);
        return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    };

    // Handle Filter input change
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            company: '',
            invoiceNo: ''
        });
        setCurrentPage(1);
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // View Return Details Handler -> read-only view page (specific return entry)
    const handleViewReturn = (item) => {
        setOpenDropdownId(null);
        navigate(`/purchase-return-view/${item.orderId}?returnId=${item.returnId}`);
    };

    // Edit Return Handler -> return form a existing value prefill kore edit kora jabe
    const handleEditReturn = (item) => {
        setOpenDropdownId(null);
        navigate(`/purchase-return-details/${item.orderId}?returnId=${item.returnId}`);
    };

    // Delete Return Handler -> shudhu ei nirdishto return entry ta returnHistory theke muche jabe, order thakbe
    const handleDeleteReturn = async (item) => {
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "Ei return entry ta delete hoye jabe, kintu purchase order thakbe!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete return!'
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                const orderRes = await fetch(`http://localhost:5000/purchase/${item.orderId}`);
                const order = await orderRes.json();

                const updatedHistory = (order.returnHistory || []).filter(
                    (ret) => ret.returnId !== item.returnId
                );

                const response = await fetch(`http://localhost:5000/purchase/${item.orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ returnHistory: updatedHistory }),
                });

                if (response.ok) {
                    showToast('Return deleted successfully!', 'success');
                    setReturns((prev) => prev.filter((r) => r.returnId !== item.returnId));
                } else {
                    showToast('Failed to delete return!', 'error');
                }
            } catch (error) {
                console.error('Error deleting return:', error);
                showToast('Server error while deleting return!', 'error');
            }
        });
    };

    // Advanced Multi-field & Date Range Filtering Logic
    const filteredReturns = returns.filter((item) => {
        // Date Range Filter (returnDate)
        if (filters.startDate || filters.endDate) {
            const returnDateObj = parseToLocalDate(item.returnDate);
            if (!returnDateObj) return false;

            if (filters.startDate) {
                const startDateObj = parseToLocalDate(filters.startDate);
                if (startDateObj && returnDateObj < startDateObj) return false;
            }

            if (filters.endDate) {
                const endDateObj = parseToLocalDate(filters.endDate);
                if (endDateObj && returnDateObj > endDateObj) return false;
            }
        }

        // Company Filter
        if (filters.company && !item.company?.toLowerCase().includes(filters.company.toLowerCase())) {
            return false;
        }
        // Invoice No Filter
        if (filters.invoiceNo && !item.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) {
            return false;
        }

        return true;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReturns = filteredReturns.slice(indexOfFirstItem, indexOfLastItem);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">

                {/* Top Section: Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Purchase Return
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage and track all purchase return records</p>
                    </div>
                    <button
                        onClick={() => navigate('/purchase')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        New Return
                    </button>
                </div>

                {/* Table Card Section */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Return Directory</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredReturns.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredReturns.length)}` : 0} of {filteredReturns.length} ({returns.length} total)
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
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
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
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
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
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

                            {/* Invoice Number Search */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    name="invoiceNo"
                                    placeholder="Search invoice..."
                                    value={filters.invoiceNo}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading returns...</div>
                    ) : filteredReturns.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No returns found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs uppercase tracking-wide">
                                        <th className="py-4 px-4">Date</th>
                                        <th className="py-4 px-4">Invoice</th>
                                        <th className="py-4 px-4">Company</th>
                                        <th className="py-4 px-4">Return Quantity</th>
                                        <th className="py-4 px-4">Return Free Quantity</th>
                                        <th className="py-4 px-4">Return Amount</th>
                                        <th className="py-4 px-4">Others Free Product</th>
                                        <th className="py-4 px-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {currentReturns.map((item, index) => (
                                        <tr key={item.returnId || index} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="py-4 px-4 text-gray-600 font-medium">{item.returnDate || 'N/A'}</td>
                                            <td className="py-4 px-4 text-gray-600 font-medium">{item.invoiceNo}</td>
                                            <td className="py-4 px-4 font-bold text-gray-800">{item.company}</td>
                                            <td className="py-4 px-4 font-semibold text-orange-600">
                                                {item.sumUnitQty || 0} {item.unitLabel} {item.sumPcsQty || 0} Pcs
                                                <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {item.totalReturnPcs})</span>
                                            </td>
                                            <td className="py-4 px-4 font-semibold text-emerald-600">
                                                {item.sumFreeUnitQty || 0} {item.unitLabel} {item.sumFreePcsQty || 0} Pcs
                                                <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.totalReturnFreeQty || 0})</span>
                                            </td>
                                            <td className="py-4 px-4 font-bold text-orange-600">৳{Number(item.totalReturnAmount).toFixed(2)}</td>
                                            <td className="py-4 px-4 font-semibold text-amber-600">
                                                {item.sumOtherFreeUnitQty || 0} {item.otherFreeUnitLabel} {item.sumOtherFreePcsQty || 0} Pcs
                                                <span className="text-xs text-amber-700 ml-1 font-bold">(Total: {item.totalReturnFreeItemsQty || 0})</span>
                                            </td>
                                            <td className="py-3 px-2.5 text-center relative">
                                                <div className="relative inline-block action-dropdown-container">

                                                    <button
                                                        onClick={() =>
                                                            setOpenDropdownId(
                                                                openDropdownId === item.returnId ? null : item.returnId
                                                            )
                                                        }
                                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <span>Select</span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === item.returnId ? 'rotate-180' : ''}`}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                        </svg>
                                                    </button>

                                                    {openDropdownId === item.returnId && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left animate-in fade-in zoom-in-95 duration-150">

                                                            <button
                                                                onClick={() => handleViewReturn(item)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.8}
                                                                    stroke="currentColor"
                                                                    className="w-3.5 h-3.5 text-slate-500"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                                                                    />
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                    />
                                                                </svg>
                                                                View Return
                                                            </button>

                                                            <button
                                                                onClick={() => handleEditReturn(item)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.8}
                                                                    stroke="currentColor"
                                                                    className="w-3.5 h-3.5 text-indigo-500"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                                                                    />
                                                                </svg>
                                                                Edit Return
                                                            </button>

                                                            <button
                                                                onClick={() => handleDeleteReturn(item)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.8}
                                                                    stroke="currentColor"
                                                                    className="w-3.5 h-3.5 text-rose-500"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                    />
                                                                </svg>
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
                    {!loading && filteredReturns.length > 0 && (
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

export default PurchaseReturn;