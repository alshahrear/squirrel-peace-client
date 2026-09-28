import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SalesReturn = () => {
    const [returns, setReturns] = useState([]);
    const [customers, setCustomers] = useState([]);
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
        customer: '',
        orderNo: ''
    });

    // Refs for triggering date pickers
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Customer searchable-select state
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const customerDropdownRef = useRef(null);

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

    // Fetch Customers data for filter dropdown
    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:5000/customer');
            const data = await res.json();
            setCustomers(data);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    // Fetch Orders -> proti order er returnHistory theke each entry ke alada row banaia flatten kora
    const fetchReturns = async () => {
        try {
            const response = await fetch('http://localhost:5000/sales');
            const data = await response.json();

            const flattenedReturns = [];
            data.forEach((order) => {
                (order.returnHistory || []).forEach((ret) => {
                    const returnUnitQty = (ret.items || []).reduce((sum, it) => sum + (Number(it.returnUnitQty) || 0), 0);
                    const returnPcsQty = (ret.items || []).reduce((sum, it) => sum + (Number(it.returnPcsQty) || 0), 0);
                    const sumFreeUnitQty = (ret.items || []).reduce((sum, it) => sum + (Number(it.returnFreeUnitQty) || 0), 0);
                    const sumFreePcsQty = (ret.items || []).reduce((sum, it) => sum + (Number(it.returnFreePcsQty) || 0), 0);
                    const unitLabel = (order.items && order.items[0] && order.items[0].unit) || 'Pcs';
                    const sumOthersFreeUnitQty = (ret.freeItems || []).reduce((sum, it) => sum + (Number(it.returnUnitQty) || 0), 0);
                    const sumOthersFreePcsQty = (ret.freeItems || []).reduce((sum, it) => sum + (Number(it.returnPcsQty) || 0), 0);
                    const othersFreeUnitLabel = (order.freeItems && order.freeItems[0] && order.freeItems[0].unit) || 'Pcs';

                    const sumGroup = (list, key) => (list || []).reduce((sum, it) => sum + (Number(it[key]) || 0), 0);
                    const damageUnitQty = sumGroup(ret.damageItems, 'returnUnitQty');
                    const damagePcsQty = sumGroup(ret.damageItems, 'returnPcsQty');
                    const damageFreeUnitQty = sumGroup(ret.damageItems, 'returnFreeUnitQty');
                    const damageFreePcsQty = sumGroup(ret.damageItems, 'returnFreePcsQty');
                    const damageUnitLabel = (order.damageItems && order.damageItems[0] && order.damageItems[0].unit) || 'Pcs';
                    const retItemUnitQty = sumGroup(ret.returnItems, 'returnUnitQty');
                    const retItemPcsQty = sumGroup(ret.returnItems, 'returnPcsQty');
                    const retItemFreeUnitQty = sumGroup(ret.returnItems, 'returnFreeUnitQty');
                    const retItemFreePcsQty = sumGroup(ret.returnItems, 'returnFreePcsQty');
                    const retItemUnitLabel = (order.returnItems && order.returnItems[0] && order.returnItems[0].unit) || 'Pcs';

                    flattenedReturns.push({
                        orderId: order._id,
                        returnId: ret.returnId,
                        returnDate: ret.returnDate,
                        orderNo: order.orderNo,
                        customer: order.customer,
                        returnUnitQty,
                        returnPcsQty,
                        sumFreeUnitQty,
                        sumFreePcsQty,
                        unitLabel,
                        sumOthersFreeUnitQty,
                        sumOthersFreePcsQty,
                        othersFreeUnitLabel,
                        totalReturnPcs: ret.totalReturnPcs,
                        totalReturnFreeQty: ret.totalReturnFreeQty,
                        totalReturnFreeItemsQty: ret.totalReturnFreeItemsQty,
                        totalReturnAmount: ret.totalReturnAmount,
                        damageUnitQty,
                        damagePcsQty,
                        damageFreeUnitQty,
                        damageFreePcsQty,
                        damageUnitLabel,
                        totalReturnDamageItemsQty: ret.totalReturnDamageItemsQty || 0,
                        totalReturnDamageFreeQty: ret.totalReturnDamageFreeQty || 0,
                        totalReturnDamageAmount: ret.totalReturnDamageAmount || 0,
                        retItemUnitQty,
                        retItemPcsQty,
                        retItemFreeUnitQty,
                        retItemFreePcsQty,
                        retItemUnitLabel,
                        totalReturnReturnItemsQty: ret.totalReturnReturnItemsQty || 0,
                        totalReturnReturnFreeQty: ret.totalReturnReturnFreeQty || 0,
                        totalReturnReturnAmount: ret.totalReturnReturnAmount || 0,
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
        fetchCustomers();
    }, []);

    // Close Customer dropdown on outside click
    useEffect(() => {
        const handleClickOutsideCustomer = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCustomer);
        return () => document.removeEventListener('mousedown', handleClickOutsideCustomer);
    }, []);

    // Filter customers based on search typing
    const filteredCustomers = customers.filter((c) =>
        c.name?.toLowerCase().includes(filters.customer.toLowerCase())
    );

    const handleSelectCustomer = (c) => {
        setFilters({ ...filters, customer: c.name });
        setIsCustomerOpen(false);
    };

    const handleClearCustomer = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, customer: '' });
        setIsCustomerOpen(false);
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
            customer: '',
            orderNo: ''
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
        navigate(`/sales-return-view/${item.orderId}?returnId=${item.returnId}`);
    };

    // Edit Return Handler -> return form a existing value prefill kore edit kora jabe
    const handleEditReturn = (item) => {
        setOpenDropdownId(null);
        navigate(`/sales-return-details/${item.orderId}?returnId=${item.returnId}`);
    };

    // Delete Return Handler -> shudhu ei nirdishto return entry ta returnHistory theke muche jabe, order thakbe
    const handleDeleteReturn = async (item) => {
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "Ei return entry ta delete hoye jabe, kintu order thakbe!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete return!'
        }).then(async (result) => {
            if (!result.isConfirmed) return;

            try {
                const orderRes = await fetch(`http://localhost:5000/sales/${item.orderId}`);
                const order = await orderRes.json();

                const updatedHistory = (order.returnHistory || []).filter(
                    (ret) => ret.returnId !== item.returnId
                );

                const response = await fetch(`http://localhost:5000/sales/${item.orderId}`, {
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

        // Customer Filter
        if (filters.customer && !item.customer?.toLowerCase().includes(filters.customer.toLowerCase())) {
            return false;
        }
        // Order No Filter
        if (filters.orderNo && !item.orderNo?.toLowerCase().includes(filters.orderNo.toLowerCase())) {
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-6 px-2 md:py-8 md:px-3 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-full mx-auto space-y-8">

                {/* Top Section: Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Sales Return
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage and track all sales return records</p>
                    </div>
                    <button
                        onClick={() => navigate('/wholesale')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        New Return
                    </button>
                </div>

                {/* Table Card Section */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl py-6 px-3 md:py-8 md:px-4 border border-white space-y-6">

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

                            {/* Customer Searchable Dropdown */}
                            <div className="relative" ref={customerDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer</label>
                                <div
                                    onClick={() => setIsCustomerOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select customer..."
                                        value={filters.customer}
                                        onChange={(e) => {
                                            handleFilterChange({ target: { name: 'customer', value: e.target.value } });
                                            setIsCustomerOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.customer && (
                                        <button type="button" onClick={handleClearCustomer} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isCustomerOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((c) => (
                                                <div
                                                    key={c._id}
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {c.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No customer found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Order No Search */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Order No</label>
                                <input
                                    type="text"
                                    name="orderNo"
                                    placeholder="Search order no..."
                                    value={filters.orderNo}
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
                            <table className="w-full table-fixed text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs uppercase tracking-wider">
                                        <th className="py-3 px-3 w-[150px]">Date / Order / Customer</th>
                                        <th className="py-3 px-3">Return Details (Main / Others Free / Damage / Return)</th>
                                        <th className="py-3 px-3 text-center w-[100px]">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {currentReturns.map((item, index) => (
                                        <tr key={item.returnId || index} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="py-3 px-3 align-top">
                                                <div className="space-y-5">
                                                    <div className="text-[11px] font-semibold text-gray-500 whitespace-nowrap">📅 {item.returnDate || 'N/A'}</div>
                                                    <div className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[11px] font-bold text-indigo-700 whitespace-nowrap">#{item.orderNo}</div>
                                                    <div className="text-xs font-bold text-gray-800 leading-tight">{item.customer}</div>
                                                </div>
                                            </td>

                                            {/* 4 ta box: data thakle full, na thakle half + "No ..." */}
                                            {(() => {
                                                const hasMain = Number(item.totalReturnPcs) > 0 || Number(item.totalReturnFreeQty) > 0;
                                                const hasOthers = Number(item.totalReturnFreeItemsQty) > 0;
                                                const hasDamage = Number(item.totalReturnDamageItemsQty) > 0 || Number(item.totalReturnDamageFreeQty) > 0;
                                                const hasReturn = Number(item.totalReturnReturnItemsQty) > 0 || Number(item.totalReturnReturnFreeQty) > 0;
                                                const visibleCount = [hasMain, hasOthers, hasDamage, hasReturn].filter(Boolean).length || 1;



                                                return (
                                                    <td className="py-3 px-2 align-top">
                                                        <div
                                                            className="grid gap-2"
                                                            style={{ gridTemplateColumns: `repeat(${visibleCount}, minmax(0, 1fr))` }}
                                                        >
                                                            {/* Main Product */}
                                                            {hasMain ? (
                                                                <div className="rounded-xl border border-indigo-200 bg-white shadow-sm overflow-hidden h-[124px] min-w-0">
                                                                    <div className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">Main Product</div>
                                                                    <div className="px-3 py-2 space-y-1.5 whitespace-nowrap">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase">Qty</span>
                                                                            <span className="font-semibold text-slate-700">{item.returnUnitQty || 0} {item.unitLabel} {item.returnPcsQty || 0} Pcs <b className="text-indigo-700">({item.totalReturnPcs || 0})</b></span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase">Free</span>
                                                                            <span className="font-semibold text-slate-700">{item.sumFreeUnitQty || 0} {item.unitLabel} {item.sumFreePcsQty || 0} Pcs <b className="text-emerald-700">({item.totalReturnFreeQty || 0})</b></span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-dashed border-indigo-200">
                                                                            <span className="text-[9px] font-bold uppercase text-slate-400">Amount</span>
                                                                            <span className="font-extrabold text-indigo-700">৳{Number(item.totalReturnAmount || 0).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            {/* Others Free */}
                                                            {hasOthers ? (
                                                                <div className="rounded-xl border border-amber-200 bg-white shadow-sm overflow-hidden h-[124px] min-w-0">
                                                                    <div className="bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">Others Free</div>
                                                                    <div className="px-3 py-2 space-y-1.5 whitespace-nowrap">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[9px] font-bold uppercase">Free</span>
                                                                            <span className="font-semibold text-slate-700">{item.sumOthersFreeUnitQty || 0} {item.othersFreeUnitLabel} {item.sumOthersFreePcsQty || 0} Pcs <b className="text-amber-700">({item.totalReturnFreeItemsQty})</b></span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            {/* Damage */}
                                                            {hasDamage ? (
                                                                <div className="rounded-xl border border-red-200 bg-white shadow-sm overflow-hidden h-[124px] min-w-0">
                                                                    <div className="bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">Damage</div>
                                                                    <div className="px-3 py-2 space-y-1.5 whitespace-nowrap">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold uppercase">Qty</span>
                                                                            <span className="font-semibold text-slate-700">{item.damageUnitQty || 0} {item.damageUnitLabel} {item.damagePcsQty || 0} Pcs <b className="text-red-600">({item.totalReturnDamageItemsQty})</b></span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase">Free</span>
                                                                            <span className="font-semibold text-slate-700">{item.damageFreeUnitQty || 0} {item.damageUnitLabel} {item.damageFreePcsQty || 0} Pcs <b className="text-emerald-700">({item.totalReturnDamageFreeQty})</b></span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-dashed border-red-200">
                                                                            <span className="text-[9px] font-bold uppercase text-slate-400">Amount</span>
                                                                            <span className="font-extrabold text-red-600">৳{Number(item.totalReturnDamageAmount || 0).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}

                                                            {/* Return */}
                                                            {hasReturn ? (
                                                                <div className="rounded-xl border border-violet-200 bg-white shadow-sm overflow-hidden h-[124px] min-w-0">
                                                                    <div className="bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1">Return</div>
                                                                    <div className="px-3 py-2 space-y-1.5 whitespace-nowrap">
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 text-[9px] font-bold uppercase">Qty</span>
                                                                            <span className="font-semibold text-slate-700">{item.retItemUnitQty || 0} {item.retItemUnitLabel} {item.retItemPcsQty || 0} Pcs <b className="text-violet-600">({item.totalReturnReturnItemsQty})</b></span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3">
                                                                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase">Free</span>
                                                                            <span className="font-semibold text-slate-700">{item.retItemFreeUnitQty || 0} {item.retItemUnitLabel} {item.retItemFreePcsQty || 0} Pcs <b className="text-emerald-700">({item.totalReturnReturnFreeQty})</b></span>
                                                                        </div>
                                                                        <div className="flex items-center justify-between gap-3 pt-1.5 border-t border-dashed border-violet-200">
                                                                            <span className="text-[9px] font-bold uppercase text-slate-400">Amount</span>
                                                                            <span className="font-extrabold text-violet-600">৳{Number(item.totalReturnReturnAmount || 0).toFixed(2)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ) : null}
                                                        </div>
                                                    </td>
                                                );
                                            })()}
                                            <td className="py-3 px-3 text-center relative">
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

export default SalesReturn;