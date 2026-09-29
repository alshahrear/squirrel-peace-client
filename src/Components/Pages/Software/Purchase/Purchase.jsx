import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const Purchase = () => {
    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();
    const location = useLocation();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Separate Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        company: '',
        invoiceNo: '',
        status: '',
        dueStatus: ''
    });

    // Refs for triggering date pickers
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Action Dropdown state (কোন রো এর ড্রপডাউন ওপেন আছে তা ট্র্যাক করার জন্য)
    const [openDropdownId, setOpenDropdownId] = useState(null);

    // Checkbox selection state
    const [selectedIds, setSelectedIds] = useState([]);

    // Summary Bar collapse state (default: collapsed)
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    // Extra filter (multi select) - default: sob select kora
    const EXTRA_OPTIONS = ['Free', 'Others Free', 'Return'];
    const [extraFilter, setExtraFilter] = useState([...EXTRA_OPTIONS]);
    const [isExtraOpen, setIsExtraOpen] = useState(false);
    const extraDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutsideExtra = (event) => {
            if (extraDropdownRef.current && !extraDropdownRef.current.contains(event.target)) {
                setIsExtraOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideExtra);
        return () => document.removeEventListener('mousedown', handleClickOutsideExtra);
    }, []);

    // Select dropdown er baire click korle dropdown close hobe
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

    // Fetch Purchases Data
    const fetchPurchases = async () => {
        try {
            const response = await fetch('http://localhost:5000/purchase');
            const data = await response.json();
            // নতুন add হওয়া purchase সবার উপরে দেখাবে
            setPurchases([...data].reverse());
        } catch (error) {
            console.error('Error fetching purchases:', error);
            showToast('Failed to load purchases!', 'error');
        } finally {
            setLoading(false);
        }
    };

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

    useEffect(() => {
        fetchPurchases();
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

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
        setCurrentPage(1); // Reset to first page on filter change
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            startDate: '',
            endDate: '',
            company: '',
            invoiceNo: '',
            status: '',
            dueStatus: ''
        });
        setExtraFilter([...EXTRA_OPTIONS]);
        setIsExtraOpen(false);
        setCurrentPage(1);
    };
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // Edit Purchase Handler -> navigate to /add-purchase with data
    const handleEdit = (item) => {
        setOpenDropdownId(null);
        navigate('/add-purchase', { state: { purchase: item } });
    };

    // View Details Handler -> navigate to /purchase-details/:id
    const handleViewDetails = (id) => {
        setOpenDropdownId(null);
        navigate(`/purchase-details/${id}`);
    };

    const handleReturn = (id) => {
        setOpenDropdownId(null);
        navigate(`/purchase-return-details/${id}`);
    };

    // Receive Handler -> Edit mode এর মতোই /add-purchase এ যাবে, কিন্তু Receive mode এ (Payment section সহ)
    const handleReceive = (item) => {
        setOpenDropdownId(null);
        navigate('/add-purchase', { state: { purchase: item, mode: 'receive' } });
    };

    // Delete Purchase Handler with SweetAlert2
    const handleDelete = async (id) => {
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/purchase/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        showToast('Purchase deleted successfully!', 'success');
                        setPurchases(prev => prev.filter(item => item._id !== id));
                    } else {
                        showToast('Failed to delete purchase!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting purchase:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    const isReceived = (item) => item.receiveStatus === 'Received' || item.receiveStatus === 'Yes';

    // Kono product return hoyeche kina
    const hasReturned = (item) =>
        (item.returnHistory || []).some(
            (r) =>
                (Number(r.totalReturnPcs) || 0) > 0 ||
                (Number(r.totalReturnFreeQty) || 0) > 0 ||
                (Number(r.totalReturnFreeItemsQty) || 0) > 0
        );

    // Main product e free ase kina
    const hasFree = (item) =>
        (item.items || []).some((p) => (Number(p.freeTotalQty ?? p.freeQty) || 0) > 0);

    const getItemExtras = (item) => {
        const list = [];
        if (hasFree(item)) list.push('Free');
        if ((item.freeItems || []).length > 0) list.push('Others Free');
        if (hasReturned(item)) list.push('Return');
        return list;
    };

    const handleToggleExtra = (opt) => {
        setExtraFilter((prev) =>
            prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
        );
        setCurrentPage(1);
    };

    // Advanced Multi-field & Date Range Filtering Logic
    const filteredPurchases = purchases.filter((item) => {
        // Date Range Filter (purchaseDate)
        if (filters.startDate || filters.endDate) {
            const purchaseDateObj = parseToLocalDate(item.purchaseDate);
            if (!purchaseDateObj) return false;

            if (filters.startDate) {
                const startDateObj = parseToLocalDate(filters.startDate);
                if (startDateObj && purchaseDateObj < startDateObj) return false;
            }

            if (filters.endDate) {
                const endDateObj = parseToLocalDate(filters.endDate);
                if (endDateObj && purchaseDateObj > endDateObj) return false;
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
        // Receive Status Filter
        if (filters.status === 'Received' && !(item.receiveStatus === 'Received' || item.receiveStatus === 'Yes')) {
            return false;
        }
        if (filters.status === 'No' && (item.receiveStatus === 'Received' || item.receiveStatus === 'Yes')) {
            return false;
        }
        // Due Status Filter (wholesale er moto: Received hole tobei due/paid gonona hobe)
        const dueAmt = Math.max((Number(item.payableAmount) || 0) - (Number(item.paidAmount) || 0), 0);
        const receivedNow = item.receiveStatus === 'Received' || item.receiveStatus === 'Yes';
        if (filters.dueStatus === 'Due' && (!receivedNow || dueAmt <= 0)) {
            return false;
        }
        if (filters.dueStatus === 'NoDue' && (!receivedNow || !item.paidAmount || dueAmt > 0)) {
            return false;
        }

        // Extra filter: sob select thakle filter apply hobe na, kichu select thakle matching extra thaka purchase dekhabe
        if (extraFilter.length !== EXTRA_OPTIONS.length) {
            if (extraFilter.length === 0) return false;
            const itemExtras = getItemExtras(item);
            if (!extraFilter.some((opt) => itemExtras.includes(opt))) return false;
        }

        return true;
    });

    // Pagination Calculations
    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);

    // Due Amount helper
    const getDue = (item) =>
        Math.max((Number(item.payableAmount) || 0) - (Number(item.paidAmount) || 0), 0);



    // Checkbox handlers (Select All = বর্তমান পেজের সব row)
    const isAllSelected =
        currentPurchases.length > 0 &&
        currentPurchases.every((i) => selectedIds.includes(i._id));

    const handleSelectAll = () => {
        const ids = currentPurchases.map((i) => i._id);
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // Summary: checkbox select থাকলে selected row এর total, নাহলে filter করা সব row এর total
    const selectedRows = filteredPurchases.filter((i) => selectedIds.includes(i._id));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredPurchases;

    const totalPayable = summaryRows.reduce((s, i) => s + (Number(i.payableAmount) || 0), 0);
    const totalPaid = summaryRows.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const totalDue = summaryRows.reduce((s, i) => s + getDue(i), 0);

    // Main product free qty
    const totalMainFreeQty = summaryRows.reduce(
        (s, i) => s + (i.items || []).reduce((ss, it) => ss + (Number(it.freeTotalQty ?? it.freeQty) || 0), 0),
        0
    );
    // Others Free Product qty
    const totalOthersFreeQty = summaryRows.reduce(
        (s, i) => s + (i.freeItems || []).reduce((ss, it) => ss + (Number(it.totalQty) || 0), 0),
        0
    );

    // ---- Returned (returnHistory theke) ----
    const sumRet = (rows, field) =>
        rows.reduce(
            (s, i) => s + (i.returnHistory || []).reduce((ss, r) => ss + (Number(r[field]) || 0), 0),
            0
        );
    const retMainQty = sumRet(summaryRows, 'totalReturnPcs');
    const retMainFree = sumRet(summaryRows, 'totalReturnFreeQty');
    const retMainAmount = sumRet(summaryRows, 'totalReturnAmount');
    const retOthersQty = sumRet(summaryRows, 'totalReturnFreeItemsQty');

    const fmt = (n) => n.toLocaleString('en-US', { maximumFractionDigits: 2 });

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

            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Top Section: Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Purchase Management
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage and track all purchase orders and records</p>
                    </div>

                    <button
                        onClick={() => navigate('/add-purchase')}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition duration-200 cursor-pointer"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={2.2}
                            stroke="currentColor"
                            className="w-4 h-4"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New Purchase
                    </button>
                </div>

                {/* Table Card Section */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Purchase Directory</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredPurchases.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredPurchases.length)}` : 0} of {filteredPurchases.length} ({purchases.length} total)
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3">
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

                            {/* Receive Status Dropdown */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Receive Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Received">Received</option>
                                    <option value="No">Not Received</option>
                                </select>
                            </div>

                            {/* Due Status Dropdown */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Due Status</label>
                                <select
                                    name="dueStatus"
                                    value={filters.dueStatus}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Due">Has Due</option>
                                    <option value="NoDue">Fully Paid</option>
                                </select>
                            </div>

                            {/* Extra Multi Select */}
                            <div className="relative" ref={extraDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Extra</label>
                                <div
                                    onClick={() => setIsExtraOpen((prev) => !prev)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <span className="truncate">
                                        {extraFilter.length === EXTRA_OPTIONS.length
                                            ? 'All'
                                            : extraFilter.length === 0
                                                ? 'None'
                                                : extraFilter.join(', ')}
                                    </span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3 h-3 shrink-0 transition-transform ${isExtraOpen ? 'rotate-180' : ''}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </div>

                                {isExtraOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 py-1">
                                        {EXTRA_OPTIONS.map((opt) => (
                                            <label
                                                key={opt}
                                                className="flex items-center gap-2 px-3 py-2 hover:bg-indigo-50 cursor-pointer text-xs font-medium text-gray-700"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={extraFilter.includes(opt)}
                                                    onChange={() => handleToggleExtra(opt)}
                                                    className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer"
                                                />
                                                {opt}
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Summary Bar */}
                    <div className="flex flex-wrap items-start gap-x-6 gap-y-3 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        {/* Showing / Rows */}
                        <div className="flex flex-col items-start gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold ${isSelectionMode ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                {isSelectionMode ? 'Selected' : 'Showing'}
                                <button
                                    type="button"
                                    onClick={() => setIsSummaryOpen((prev) => !prev)}
                                    title={isSummaryOpen ? 'Hide Details' : 'Show Details'}
                                    className="flex items-center justify-center w-4 h-4 rounded-full bg-white/70 hover:bg-white transition cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-2.5 h-2.5 transition-transform duration-200 ${isSummaryOpen ? 'rotate-180' : ''}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>
                            </span>
                            <span className="font-semibold text-gray-600">
                                Rows: <b className="text-gray-800">{summaryRows.length}</b>
                            </span>
                        </div>

                        {isSummaryOpen && (
                            <>
                                <div className="w-px self-stretch bg-indigo-200" />

                                {/* ============ 1. MAIN PRODUCT ============ */}
                                <div className="rounded-xl border border-indigo-200 bg-white overflow-hidden shadow-sm">
                                    <div className="bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">Main Product</div>
                                    <div className="flex">
                                        <div className="px-3 py-2 flex flex-col gap-1 min-w-[130px]">
                                            <span className="text-[9px] font-bold uppercase text-slate-400">Order</span>
                                            <span className="font-semibold text-gray-600">
                                                Total Amount: <b className="text-indigo-600">৳{fmt(totalPayable)}</b>
                                            </span>
                                            <span className="font-semibold text-gray-600">
                                                Paid Amount: <b className="text-emerald-600">৳{fmt(totalPaid)}</b>
                                            </span>
                                            <span className="font-semibold text-gray-600">
                                                Due Amount: <b className="text-rose-600">৳{fmt(totalDue)}</b>
                                            </span>
                                            <span className="font-semibold text-gray-600">
                                                Free Qty: <b className="text-emerald-600">{fmt(totalMainFreeQty)}</b>
                                            </span>
                                        </div>
                                        <div className="px-3 py-2 flex flex-col gap-1 min-w-[110px] bg-orange-50 border-l-2 border-dashed border-orange-300">
                                            <span className="text-[9px] font-bold uppercase text-orange-500">↩ Returned</span>
                                            <span className="font-semibold text-gray-600">
                                                Qty: <b className="text-orange-600">{fmt(retMainQty)}</b>
                                            </span>
                                            <span className="font-semibold text-gray-600">
                                                Free Qty: <b className="text-emerald-600">{fmt(retMainFree)}</b>
                                            </span>
                                            <span className="font-semibold text-gray-600">
                                                Amount: <b className="text-orange-600">৳{fmt(retMainAmount)}</b>
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* ============ 2. OTHERS FREE ============ */}
                                <div className="rounded-xl border border-amber-200 bg-white overflow-hidden shadow-sm">
                                    <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">Others Free</div>
                                    <div className="flex">
                                        <div className="px-3 py-2 flex flex-col gap-1 min-w-[90px]">
                                            <span className="text-[9px] font-bold uppercase text-slate-400">Order</span>
                                            <span className="font-semibold text-gray-600">
                                                Qty: <b className="text-amber-600">{fmt(totalOthersFreeQty)}</b>
                                            </span>
                                        </div>
                                        <div className="px-3 py-2 flex flex-col gap-1 min-w-[90px] bg-orange-50 border-l-2 border-dashed border-orange-300">
                                            <span className="text-[9px] font-bold uppercase text-orange-500">↩ Returned</span>
                                            <span className="font-semibold text-gray-600">
                                                Qty: <b className="text-orange-600">{fmt(retOthersQty)}</b>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                        {isSelectionMode && (
                            <button
                                onClick={() => setSelectedIds([])}
                                className="ml-auto text-[11px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {/* Table Container */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading purchases...</div>
                    ) : filteredPurchases.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No purchases found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-1.5 [&_th]:py-2.5 [&_th]:text-[10px] [&_th]:whitespace-normal [&_td]:px-1.5 [&_td]:py-2.5 [&_td]:text-[11px] [&_td]:whitespace-normal [&_td_span]:text-[9px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[10px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="w-8 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3 px-2.5">Date</th>
                                        <th className="py-3 px-2.5">Company Name</th>
                                        <th className="py-3 px-2.5">Invoice No</th>
                                        <th className="py-3 px-2.5">Total Amount</th>
                                        <th className="py-3 px-2.5">Paid (Due)</th>
                                        <th className="py-3 px-2.5">Extra</th>
                                        <th className="py-3 px-2.5">Receive Status</th>
                                        <th className="py-3 px-2.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentPurchases.map((item, index) => (
                                        <tr key={item._id || index} className={`transition duration-150 ${selectedIds.includes(item._id) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}>
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item._id)}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3 px-2.5 text-gray-600 whitespace-nowrap">
                                                <div className="font-medium">Purchase : {item.purchaseDate || 'N/A'}</div>
                                                <div className="mt-0.5">
                                                    {item.receiveDate ? (
                                                        <span>Received: {item.receiveDate}</span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold text-[10px] whitespace-nowrap">
                                                            Not Received
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2.5 font-bold text-gray-800 whitespace-nowrap">{item.company}</td>
                                            <td className="py-3 px-2.5 text-gray-600 font-medium whitespace-nowrap">{item.invoiceNo}</td>
                                            <td className="py-3 px-2.5 font-bold text-indigo-600 whitespace-nowrap">৳{item.payableAmount}</td>
                                            <td className="py-3 px-2.5 whitespace-nowrap">
                                                {(Number(item.payableAmount) || 0) <= 0 ? (
                                                    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold text-[10px] whitespace-nowrap">
                                                        No Bill
                                                    </span>
                                                ) : !isReceived(item) || !item.paidAmount ? (
                                                    <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold text-[10px] whitespace-nowrap">
                                                        Not Paid
                                                    </span>
                                                ) : (
                                                    <div className="font-bold">
                                                        <b className="text-emerald-600">৳{item.paidAmount}</b>
                                                        <b className="text-rose-600">({getDue(item)})</b>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-2.5 whitespace-nowrap">
                                                {(() => {
                                                    const extras = [];
                                                    if ((item.freeItems || []).length > 0) extras.push({ label: 'Others Free', color: 'text-amber-600' });
                                                    if (hasReturned(item)) extras.push({ label: 'Return', color: 'text-violet-600' });
                                                    if (hasFree(item)) extras.push({ label: 'Free - Has', color: 'text-emerald-600' });
                                                    if (extras.length === 0) return <div className="text-[9px] text-gray-300">N/A</div>;
                                                    return (
                                                        <div className="flex flex-col leading-tight">
                                                            {extras.map((ex) => (
                                                                <div key={ex.label} className={`text-[9px] font-bold ${ex.color}`}>{ex.label}</div>
                                                            ))}
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 px-2.5">
                                                <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[10px] whitespace-nowrap ${item.receiveStatus === 'Received' || item.receiveStatus === 'Yes' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                    {item.receiveStatus || 'No'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2.5 text-center relative">
                                                <div className="relative inline-block action-dropdown-container">

                                                    <button
                                                        onClick={() =>
                                                            setOpenDropdownId(
                                                                openDropdownId === item._id
                                                                    ? null
                                                                    : item._id
                                                            )
                                                        }
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                                                    >
                                                        <span>Select</span>

                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === item._id
                                                                ? 'rotate-180'
                                                                : ''
                                                                }`}
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                                            />
                                                        </svg>
                                                    </button>

                                                    {openDropdownId === item._id && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left animate-in fade-in zoom-in-95 duration-150">

                                                            <button
                                                                onClick={() => handleViewDetails(item._id)}
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
                                                                View Details
                                                            </button>

                                                            {(item.receiveStatus === 'Received' || item.receiveStatus === 'Yes') && (
                                                                <button
                                                                    onClick={() => handleReturn(item._id)}
                                                                    className="w-full px-4 py-2.5 text-xs font-semibold text-orange-600 hover:bg-orange-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                                >
                                                                    <svg
                                                                        xmlns="http://www.w3.org/2000/svg"
                                                                        fill="none"
                                                                        viewBox="0 0 24 24"
                                                                        strokeWidth={1.8}
                                                                        stroke="currentColor"
                                                                        className="w-3.5 h-3.5 text-orange-500"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                                                        />
                                                                    </svg>
                                                                    Return
                                                                </button>
                                                            )}

                                                            {item.receiveStatus !== 'Received' && (
                                                                <>
                                                                    <button
                                                                        onClick={() => handleReceive(item)}
                                                                        className="w-full px-4 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={1.8}
                                                                            stroke="currentColor"
                                                                            className="w-3.5 h-3.5 text-emerald-500"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z"
                                                                            />
                                                                        </svg>
                                                                        Receive
                                                                    </button>

                                                                    <button
                                                                        onClick={() => handleEdit(item)}
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
                                                                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
                                                                            />
                                                                        </svg>
                                                                        Edit
                                                                    </button>
                                                                </>
                                                            )}

                                                            <button
                                                                onClick={() => handleDelete(item._id)}
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
                    {!loading && filteredPurchases.length > 0 && (
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

export default Purchase;