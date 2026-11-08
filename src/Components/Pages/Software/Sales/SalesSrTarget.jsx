import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { FaEdit, FaTrash, FaStickyNote, FaTimes, FaEye, FaPlus, FaMinus, FaClock, FaChevronLeft, FaChevronRight, FaFilter, FaRedo } from 'react-icons/fa';
import SalesSrTargetForm, { displayMonthYear } from './SalesSrTargetForm';

// "23/10/2026, 8:03:51 pm" -> "23 Oct 2026"
const formatCreatedDate = (value) => {
    if (!value) return '';
    const datePart = value.split(/[ ,]/)[0];
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return value;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return value;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const MONTH_MAP = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

// order date (05 Nov 2026 / 05/11/2026 / 2026-11-05) -> "YYYY-MM"
const getOrderMonthKey = (dateStr) => {
    if (!dateStr) return '';
    const part = String(dateStr).split(',')[0].trim();
    let y, m;
    if (part.includes('/')) {
        const [, mm, yy] = part.split('/');
        m = Number(mm);
        y = Number(yy);
    } else if (/^\d{4}-\d{2}/.test(part)) {
        const [yy, mm] = part.split('-');
        y = Number(yy);
        m = Number(mm);
    } else {
        const bits = part.split(/\s+/);
        if (bits.length < 3) return '';
        m = MONTH_MAP[bits[1].slice(0, 3).toLowerCase()];
        y = Number(bits[2]);
    }
    if (!y || !m) return '';
    return `${y}-${String(m).padStart(2, '0')}`;
};

// Order er Grand amount: product discount, overall discount, adjustment dhore
// (damage / return adjustment ar previous get/pay bad)
const getOrderGrandAmount = (o) => {
    const sub = Number(o.subTotal) || 0;
    const pwd = Number(o.productWiseDiscount) || 0;
    const after = sub - pwd;
    let overall;
    if (o.overallDiscountValue !== undefined && o.overallDiscountValue !== null) {
        overall = Number(o.overallDiscountValue) || 0;
    } else if (o.overallDiscountType === 'percent') {
        overall = (after * (Number(o.overallDiscount) || 0)) / 100;
    } else {
        overall = Number(o.overallDiscount) || 0;
    }
    const adjAmt = Number(o.adjustment?.amount) || 0;
    const adj = o.adjustment?.type === '-' ? -adjAmt : adjAmt;
    return Math.round((after - overall + adj) * 100) / 100;
};

const fmtMoney = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// "23/10/2026, 8:03:51 pm" -> Date
const parseCreatedDate = (value) => {
    if (!value) return null;
    const datePart = String(value).split(/[ ,]/)[0];
    const [d, m, y] = datePart.split('/');
    if (!d || !m || !y) return null;
    const dateObj = new Date(Number(y), Number(m) - 1, Number(d));
    return isNaN(dateObj) ? null : dateObj;
};

// "YYYY-MM-DD" -> Date
const parseYmd = (value) => {
    if (!value) return null;
    const [y, m, d] = value.split('-');
    if (!y || !m || !d) return null;
    return new Date(Number(y), Number(m) - 1, Number(d));
};

// "YYYY-MM-DD" -> "05 Nov 2026"
const displayFormattedDate = (value) => {
    const dateObj = parseYmd(value);
    if (!dateObj) return '';
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const SalesSrTarget = () => {
    const [targets, setTargets] = useState([]);
    const [sales, setSales] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingTarget, setEditingTarget] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });

    const [selectedNote, setSelectedNote] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const tableSectionRef = useRef(null);
    const formSectionRef = useRef(null);

    // ---------------- Filters ----------------
    const [filters, setFilters] = useState({ startDate: '', endDate: '', sr: '', targetMonth: '' });
    const [isSrOpen, setIsSrOpen] = useState(false);
    const srDropdownRef = useRef(null);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const monthRef = useRef(null);

    useEffect(() => {
        const handleClickOutsideSr = (event) => {
            if (srDropdownRef.current && !srDropdownRef.current.contains(event.target)) setIsSrOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutsideSr);
        return () => document.removeEventListener('mousedown', handleClickOutsideSr);
    }, []);

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', sr: '', targetMonth: '' });
        setIsSrOpen(false);
        setCurrentPage(1);
    };

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    };

    // ---------------- Fetch ----------------
    const fetchTargets = async () => {
        try {
            const res = await fetch('https://squirrel-peace-server.onrender.com/sales-sr-target');
            const data = await res.json();
            setTargets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching SR targets:', error);
            showToast('Failed to load targets!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTargets();
        fetch('https://squirrel-peace-server.onrender.com/sales')
            .then((res) => res.json())
            .then((data) => setSales(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching sales:', error));
        fetch('https://squirrel-peace-server.onrender.com/user')
            .then((res) => res.json())
            .then((data) => setUsers(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching users:', error));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (openDropdownId === null) return;
        const handleScroll = () => setOpenDropdownId(null);
        window.addEventListener('scroll', handleScroll, true);
        return () => window.removeEventListener('scroll', handleScroll, true);
    }, [openDropdownId]);

    // ---------------- SR list ----------------
    const roleOf = (u) => String(u.role || u.userRole || u.designation || '').toLowerCase();
    const srFiltered = users.filter((u) => roleOf(u).includes('sr'));
    const srList = srFiltered.length > 0 ? srFiltered : users;

    // ---------------- Delete ----------------
    const handleDelete = (id) => {
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const res = await fetch(`https://squirrel-peace-server.onrender.com/sales-sr-target/${id}`, { method: 'DELETE' });
                    if (res.ok) {
                        showToast('Target deleted successfully!', 'success');
                        setTargets((prev) => prev.filter((t) => t._id !== id));
                    } else {
                        showToast('Failed to delete target!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting target:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // ---------------- Edit ----------------
    const handleEdit = (target) => {
        setOpenDropdownId(null);
        setEditingTarget(target);
        setIsFormOpen(true);
        setTimeout(() => {
            formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleOpenModal = (noteText) => {
        setSelectedNote(noteText || 'No note available for this target.');
        setIsModalOpen(true);
    };

    // ---------------- Pagination ----------------
    const filteredSRs = srList.filter((u) =>
        String(u.name || u.userName || u.fullName || '').toLowerCase().includes(filters.sr.toLowerCase())
    );

    const filteredTargets = targets.filter((t) => {
        if (filters.startDate || filters.endDate) {
            const created = parseCreatedDate(t.createdAt);
            if (!created) return false;
            const start = parseYmd(filters.startDate);
            const end = parseYmd(filters.endDate);
            if (start && created < start) return false;
            if (end && created > end) return false;
        }
        if (filters.sr && !String(t.sr || '').toLowerCase().includes(filters.sr.toLowerCase())) return false;
        if (filters.targetMonth && t.targetMonth !== filters.targetMonth) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredTargets.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentTargets = filteredTargets.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    const TH = 'px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider';

    // ---------------- Sale stats per target (SR + Month) ----------------
    const statsById = {};
    currentTargets.forEach((t) => {
        let grand = 0;
        sales.forEach((o) => {
            if (String(o.srId) !== String(t.srId)) return;
            if (o.status !== 'Delivered') return;
            if (getOrderMonthKey(o.orderDate) !== t.targetMonth) return;
            grand += getOrderGrandAmount(o);
        });
        grand = Math.round(grand * 100) / 100;
        const diff = Math.round(((Number(t.targetAmount) || 0) - grand) * 100) / 100;
        const remaining = diff > 0 ? diff : 0;
        const extra = diff < 0 ? Math.abs(diff) : 0;
        statsById[t._id] = { grand, remaining, extra };
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8 relative">

            {/* Toast */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            Sales SR Target
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Set monthly sales targets for every SR and keep track of them.</p>
                    </div>

                    <button
                        onClick={() => {
                            setEditingTarget(null);
                            setIsFormOpen(!isFormOpen);
                        }}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform hover:-translate-y-0.5 cursor-pointer ${isFormOpen
                            ? 'bg-red-500 hover:bg-red-600 shadow-red-200'
                            : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200'
                            }`}
                    >
                        {isFormOpen ? <><FaMinus /> Close Form</> : <><FaPlus /> Add SR Target</>}
                    </button>
                </div>

                {/* Form */}
                {isFormOpen && !loading && (
                    <div ref={formSectionRef}>
                        <SalesSrTargetForm
                            key={editingTarget?._id || 'new'}
                            targets={targets}
                            srList={srList}
                            fetchTargets={fetchTargets}
                            setShowForm={setIsFormOpen}
                            editingTarget={editingTarget}
                            setEditingTarget={setEditingTarget}
                            showToast={showToast}
                            scrollToTable={() => {
                                setCurrentPage(1);
                                setTimeout(() => {
                                    tableSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                                }, 100);
                            }}
                        />
                    </div>
                )}

                {/* Table */}                {/* Filter & Search Panel */}
                <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100 mb-6">
                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                        <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <FaFilter className="text-indigo-600" /> Filter & Search Panel
                        </h3>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                        >
                            <FaRedo size={11} /> Clear All Filters
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
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

                        {/* SR */}
                        <div className="relative" ref={srDropdownRef}>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">SR</label>
                            <div
                                onClick={() => setIsSrOpen(true)}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                            >
                                <input
                                    type="text"
                                    placeholder="Search or select SR..."
                                    value={filters.sr}
                                    onChange={(e) => {
                                        handleFilterChange({ target: { name: 'sr', value: e.target.value } });
                                        setIsSrOpen(true);
                                    }}
                                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                                />
                                {filters.sr && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleFilterChange({ target: { name: 'sr', value: '' } });
                                            setIsSrOpen(false);
                                        }}
                                        className="text-gray-400 hover:text-red-500 pl-1"
                                    >
                                        <FaTimes size={10} />
                                    </button>
                                )}
                            </div>

                            {isSrOpen && (
                                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                    {filteredSRs.length > 0 ? (
                                        filteredSRs.map((u) => {
                                            const name = u.name || u.userName || u.fullName || '';
                                            return (
                                                <div
                                                    key={u._id}
                                                    onClick={() => {
                                                        handleFilterChange({ target: { name: 'sr', value: name } });
                                                        setIsSrOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {name}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No SR found</div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Targeted Month */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Targeted Month</label>
                            <div
                                className="relative w-full cursor-pointer"
                                onClick={() => monthRef.current?.showPicker?.() || monthRef.current?.click()}
                            >
                                <input
                                    ref={monthRef}
                                    type="month"
                                    name="targetMonth"
                                    value={filters.targetMonth}
                                    onChange={handleFilterChange}
                                    className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                />
                                <input
                                    type="text"
                                    readOnly
                                    placeholder="Select targeted month"
                                    value={displayMonthYear(filters.targetMonth)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div ref={tableSectionRef} className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-100">
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex flex-wrap gap-2 justify-between items-center">
                        <h2 className="text-xl font-bold">SR Target History</h2>
                        <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                            Showing: {filteredTargets.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredTargets.length)}` : 0} of {filteredTargets.length} ({targets.length} total)
                        </span>
                    </div>

                    <div className="overflow-x-auto overflow-y-visible">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className={TH}>Date</th>
                                    <th className={TH}>SR</th>
                                    <th className={TH}>Targeted Month</th>
                                    <th className={TH}>Targeted Amount</th>
                                    <th className={TH}>Grand Sale Amount</th>
                                    <th className={TH}>Remaining</th>
                                    <th className={`${TH} text-center`}>Note</th>
                                    <th className={`${TH} text-center`}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {currentTargets.length > 0 ? (
                                    currentTargets.map((t) => (
                                        <tr key={t._id} className="hover:bg-indigo-50/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                {t.createdAt ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                                                        <FaClock className="text-indigo-400" size={11} /> {formatCreatedDate(t.createdAt)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 italic text-xs">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                {t.sr || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                    {displayMonthYear(t.targetMonth)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                ৳ {Number(t.targetAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                                ৳ {fmtMoney(statsById[t._id]?.grand)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                                {statsById[t._id]?.extra > 0 ? (
                                                    <span className="text-emerald-600">
                                                        ৳ {fmtMoney(statsById[t._id]?.extra)} <span className="text-xs font-bold">(Extra)</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-rose-600">৳ {fmtMoney(statsById[t._id]?.remaining)}</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                                                <button
                                                    onClick={() => handleOpenModal(t.note)}
                                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition-all text-xs font-semibold shadow-sm cursor-pointer"
                                                >
                                                    <FaEye size={12} /> View Note
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-center text-sm font-medium relative">
                                                <div className="relative inline-block action-dropdown-container">
                                                    <button
                                                        onClick={(e) => {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setDropdownPos({ top: rect.top - 8, left: rect.right });
                                                            setOpenDropdownId(openDropdownId === t._id ? null : t._id);
                                                        }}
                                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <span>Select</span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === t._id ? 'rotate-180' : ''}`}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                        </svg>
                                                    </button>

                                                    {openDropdownId === t._id && (
                                                        <div
                                                            style={{ top: dropdownPos.top, left: dropdownPos.left, transform: 'translate(-100%, -100%)' }}
                                                            className="fixed w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left"
                                                        >
                                                            <button
                                                                onClick={() => handleEdit(t)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FaEdit size={12} className="text-indigo-500" />
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(t._id)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FaTrash size={12} className="text-rose-500" />
                                                                Delete
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="8" className="text-center py-10 text-gray-400 text-sm">
                                            No targets found!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredTargets.length > 0 && (
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
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
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

                {/* Note Modal */}
                <div
                    className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 transition-all duration-300 ${isModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                >
                    <div
                        className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 ${isModalOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
                    >
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <FaStickyNote className="text-indigo-600" /> Target Note
                            </h3>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                            >
                                <FaTimes size={18} />
                            </button>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-gray-700 text-sm min-h-[80px] whitespace-pre-wrap">
                            {selectedNote}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer"
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

export default SalesSrTarget;