import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import InvestmentForm from './InvestmentForm';
import AdjustmentForm from './Adjustment';
import HistoryAdjustment from './HistoryAdjustment'; // HistoryAdjustment কম্পোনেন্ট ইম্পোর্ট করা হলো
import {
    FiPlus,
    FiX,
    FiSearch,
    FiEdit3,
    FiTrash2,
    FiEye,
    FiRotateCcw,
    FiChevronDown,
    FiSliders,
    FiClock, // হিস্ট্রির জন্য আইকন ইম্পোর্ট করা হলো
    FiPieChart // Breakdown আইকন ইম্পোর্ট করা হলো
} from 'react-icons/fi';
import { IoWalletOutline } from 'react-icons/io5';

const OpeningInvestment = () => {
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Multi-Field Search States
    const [searchType, setSearchType] = useState('');
    const [searchName, setSearchName] = useState('');
    const [searchNumber, setSearchNumber] = useState('');
    const [searchBranch, setSearchBranch] = useState('');

    // Form & Edit Modal States
    const [showForm, setShowForm] = useState(false);
    const [editingInvestment, setEditingInvestment] = useState(null);

    // Adjustment Modal State & Selected Item
    const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
    const [selectedInvestmentForAdjustment, setSelectedInvestmentForAdjustment] = useState(null);

    // History Modal State & Selected Item (নতুন যোগ করা হলো)
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedInvestmentForHistory, setSelectedInvestmentForHistory] = useState(null);

    // Active Action Dropdown State
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Breakdown Modal States (নতুন যোগ করা হলো)
    const [showBreakdown, setShowBreakdown] = useState(false);
    const [breakdownVisible, setBreakdownVisible] = useState(false);

    // Table and Top section refs for auto scrolling
    const tableSectionRef = useRef(null);
    const topSectionRef = useRef(null);

    // বাইরে কোথাও ক্লিক করলে ড্রপডাউন বন্ধ করার জন্য
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) {
                setActiveDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Investments
    const fetchInvestments = async () => {
        try {
            const response = await fetch('http://localhost:5000/investment');
            const data = await response.json();
            setInvestments(data);
        } catch (error) {
            console.error('Error fetching investments:', error);
            showToast('Failed to load investments!', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Fetch Adjustments (Remaining amount হিসাব করার জন্য)
    const [adjustments, setAdjustments] = useState([]);
    const fetchAdjustments = async () => {
        try {
            const response = await fetch('http://localhost:5000/adjustment');
            const data = await response.json();
            setAdjustments(data);
        } catch (error) {
            console.error('Error fetching adjustments:', error);
        }
    };

    // প্রতিটা investment row-এর remaining amount হিসাব করার ফাংশন
    const getRemainingAmount = (investment) => {
        const relatedAdjustments = adjustments.filter(adj => adj.adjustmentID === investment._id);
        const totalDeposit = relatedAdjustments
            .filter(adj => adj.mode === 'Deposit')
            .reduce((sum, adj) => sum + Number(adj.amount || 0), 0);
        const totalWithdraw = relatedAdjustments
            .filter(adj => adj.mode === 'Withdraw')
            .reduce((sum, adj) => sum + Number(adj.amount || 0), 0);
        return Number(investment.amount || 0) + totalDeposit - totalWithdraw;
    };

    useEffect(() => {
        fetchInvestments();
        fetchAdjustments();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    const scrollToTable = () => {
        if (tableSectionRef.current) {
            tableSectionRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const handleToggleForm = () => {
        if (showForm) {
            setEditingInvestment(null);
            setShowForm(false);
        } else {
            setEditingInvestment(null);
            setShowForm(true);
            if (topSectionRef.current) {
                topSectionRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        }
    };

    const handleClearFilters = () => {
        setSearchType('');
        setSearchName('');
        setSearchNumber('');
        setSearchBranch('');
        showToast('Filters cleared successfully!', 'success');
    };

    const handleViewNote = (note) => {
        Swal.fire({
            title: '<span class="text-xl font-bold text-gray-800">Investment Note</span>',
            html: `<div class="p-2 text-gray-600 bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto text-left leading-relaxed">${note || 'No note available for this record.'}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'rounded-3xl shadow-2xl border border-white'
            }
        });
    };

    const handleDelete = async (id) => {
        setActiveDropdownId(null);
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
                    const response = await fetch(`http://localhost:5000/investment/${id}`, {
                        method: 'DELETE',
                    });

                    if (response.ok) {
                        showToast('Investment deleted successfully!', 'success');
                        setInvestments(prev => prev.filter(item => item._id !== id));
                    } else {
                        showToast('Failed to delete investment!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting investment:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    const uniqueAccountTypes = [...new Set(investments.map(item => item.accountType).filter(Boolean))];

    const filteredInvestments = investments.filter((item) => {
        const typeMatch = searchType === '' || item.accountType?.toLowerCase() === searchType.toLowerCase();

        const nameQuery = searchName.toLowerCase();
        const itemName = (item.accountName || item.bankName || '').toLowerCase();
        const nameMatch = itemName.includes(nameQuery);

        const numberQuery = searchNumber.toLowerCase();
        const itemNumber = (item.accountNumber || '').toLowerCase();
        const numberMatch = itemNumber.includes(numberQuery);

        const branchQuery = searchBranch.toLowerCase();
        const itemBranch = (item.accountBranch || '').toLowerCase();
        const branchMatch = itemBranch.includes(branchQuery);

        return typeMatch && nameMatch && numberMatch && branchMatch;
    });

    // Open/close breakdown modal with smooth animation (নতুন যোগ করা হলো)
    const openBreakdown = () => {
        setShowBreakdown(true);
        setTimeout(() => setBreakdownVisible(true), 10);
    };

    const closeBreakdown = () => {
        setBreakdownVisible(false);
        setTimeout(() => setShowBreakdown(false), 250);
    };

    // Investment Breakdown Calculation (নতুন যোগ করা হলো)
    // - accountType wise total (Cash, Mobile Banking, Bank ...) — remaining amount ভিত্তিক
    // - Mobile Banking er khetre accountName (Bkash/Nagad) + accountNumber onujayi sub-group
    // - Bank er khetre bankName/accountName + accountNumber onujayi sub-group
    const getInvestmentBreakdown = () => {
        const groups = {};

        filteredInvestments.forEach((item) => {
            const type = item.accountType?.trim() || 'Others';
            const amount = getRemainingAmount(item);

            if (!groups[type]) {
                groups[type] = { total: 0, subGroups: {} };
            }

            groups[type].total += amount;

            const normalizedType = type.toLowerCase();
            let subKey = '';

            if (normalizedType === 'mobile banking') {
                const provider = item.accountName?.trim();
                const number = item.accountNumber?.trim();
                if (provider && number) {
                    subKey = `${provider} (${number})`;
                } else if (provider) {
                    subKey = provider;
                } else if (number) {
                    subKey = number;
                }
            } else if (normalizedType === 'bank') {
                const bank = item.bankName?.trim() || item.accountName?.trim();
                const number = item.accountNumber?.trim();
                if (bank && number) {
                    subKey = `${bank} (${number})`;
                } else if (bank) {
                    subKey = bank;
                } else if (number) {
                    subKey = number;
                }
            } else if (normalizedType !== 'cash') {
                const fallbackName = item.bankName?.trim() || item.accountName?.trim();
                const number = item.accountNumber?.trim();
                if (fallbackName && number) {
                    subKey = `${fallbackName} (${number})`;
                } else if (fallbackName) {
                    subKey = fallbackName;
                } else if (number) {
                    subKey = number;
                }
            }
            // Cash hole subKey empty thakbe, tai sub-breakdown dekhabe na

            if (subKey) {
                groups[type].subGroups[subKey] = (groups[type].subGroups[subKey] || 0) + amount;
            }
        });

        return groups;
    };

    const breakdown = getInvestmentBreakdown();
    const grandTotal = filteredInvestments.reduce((sum, item) => sum + getRemainingAmount(item), 0);

    return (
        <div ref={topSectionRef} className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Investment Breakdown Modal (নতুন যোগ করা হলো) */}
            {showBreakdown && (
                <div
                    className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${breakdownVisible ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
                    onClick={closeBreakdown}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-white overflow-hidden transform transition-all duration-300 ${breakdownVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                    >
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Investment Breakdown</h3>
                                <p className="text-indigo-100 text-xs mt-0.5">Source wise total balance</p>
                            </div>
                            <button
                                onClick={closeBreakdown}
                                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition duration-200 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {Object.keys(breakdown).length === 0 ? (
                                <div className="text-center py-10 text-gray-400 font-medium">No data to show!</div>
                            ) : (
                                Object.entries(breakdown).map(([type, data]) => (
                                    <div key={type} className="bg-gray-50/70 rounded-2xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-800 text-sm">{type}</span>
                                            <span className="font-bold text-emerald-600 text-sm">৳ {data.total.toLocaleString()}</span>
                                        </div>

                                        {Object.keys(data.subGroups).length > 0 && (
                                            <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-indigo-100">
                                                {Object.entries(data.subGroups).map(([subKey, subAmount]) => (
                                                    <div key={subKey} className="flex items-center justify-between text-xs text-gray-600">
                                                        <span className="font-medium">{subKey}</span>
                                                        <span className="font-semibold text-gray-700">৳ {subAmount.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-indigo-50/60 border-t border-indigo-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">Grand Total</span>
                            <span className="text-lg font-extrabold text-indigo-700">৳ {grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-8">

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Opening Investment
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage all opening investments and account records</p>
                    </div>

                    <button
                        onClick={handleToggleForm}
                        className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 cursor-pointer whitespace-nowrap flex items-center justify-center gap-2"
                    >
                        {showForm ? (
                            <>
                                <FiX className="w-5 h-5" />
                                Close Form
                            </>
                        ) : (
                            <>
                                <FiPlus className="w-5 h-5" />
                                Add New Investment
                            </>
                        )}
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white transition-all duration-300">
                        <InvestmentForm
                            fetchInvestments={fetchInvestments}
                            setShowForm={setShowForm}
                            editingInvestment={editingInvestment}
                            setEditingInvestment={setEditingInvestment}
                            showToast={showToast}
                            scrollToTable={scrollToTable}
                            investments={investments}
                        />
                    </div>
                )}

                <div ref={tableSectionRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-800">Investment Records</h3>
                                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                                    Total: {filteredInvestments.length} / {investments.length}
                                </span>
                                <span className="px-3 py-3 bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-xs rounded-full shadow-sm">
                                    Total Balance: ৳ {grandTotal.toLocaleString()}
                                </span>
                                <button
                                    onClick={openBreakdown}
                                    className="inline-flex items-center gap-1.5 px-3.5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm transition duration-200 cursor-pointer"
                                    title="View Investment Breakdown"
                                >
                                    <FiPieChart className="w-3.5 h-3.5" />
                                    Breakdown
                                </button>
                            </div>

                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-sm border border-gray-200"
                                title="Clear all search filters"
                            >
                                <FiRotateCcw className="w-3.5 h-3.5" />
                                Clear Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Filter by Account Type</label>
                                <select
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-sm text-gray-700 cursor-pointer"
                                >
                                    <option value="">All Account Types</option>
                                    {uniqueAccountTypes.map((type, idx) => (
                                        <option key={idx} value={type}>{type}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Search Account Name</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                        <FiSearch className="w-3.5 h-3.5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Brac Bank, Cash..."
                                        value={searchName}
                                        onChange={(e) => setSearchName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-sm text-gray-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Search Account No</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                        <FiSearch className="w-3.5 h-3.5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="e.g. 123456..."
                                        value={searchNumber}
                                        onChange={(e) => setSearchNumber(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-sm text-gray-700"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">Search Branch</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                                        <FiSearch className="w-3.5 h-3.5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="e.g. Motijheel..."
                                        value={searchBranch}
                                        onChange={(e) => setSearchBranch(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white text-sm text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading investments...</div>
                    ) : filteredInvestments.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No investments found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm p-1">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-sm uppercase tracking-wider">
                                        <th className="py-4 px-5">#</th>
                                        <th className="py-4 px-5">Date</th>
                                        <th className="py-4 px-5">Account Type</th>
                                        <th className="py-4 px-5">Account Name</th>
                                        <th className="py-4 px-5">Account No / Branch</th>
                                        <th className="py-4 px-5">Amount</th>
                                        <th className="py-4 px-5 text-center">Note</th>
                                        <th className="py-4 px-5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {filteredInvestments.map((item, index) => (
                                        <tr key={item._id || index} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="py-4 px-5 font-medium text-gray-400">{index + 1}</td>
                                            <td className="py-4 px-5 text-gray-600">{item.date}</td>
                                            <td className="py-4 px-5">
                                                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full font-semibold text-xs">
                                                    {item.accountType}
                                                </span>
                                            </td>
                                            <td className="py-4 px-5 font-bold text-gray-800">
                                                {item.accountName || item.bankName || 'N/A'}
                                            </td>
                                            <td className="py-4 px-5 text-gray-600">
                                                {item.accountNumber ? `${item.accountNumber} ${item.accountBranch ? `(${item.accountBranch})` : ''}` : 'N/A'}
                                            </td>
                                            <td className="py-4 px-5 font-bold text-emerald-600">
                                                ৳ {getRemainingAmount(item)}
                                            </td>

                                            <td className="py-4 px-5 text-center">
                                                <button
                                                    onClick={() => handleViewNote(item.note)}
                                                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition duration-200 shadow-sm text-xs font-semibold cursor-pointer"
                                                    title="View Note"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                    View Note
                                                </button>
                                            </td>

                                            <td className="py-4 px-5 text-center relative">
                                                <div className="relative inline-block action-dropdown-container">
                                                    <button
                                                        onClick={() => setActiveDropdownId(activeDropdownId === item._id ? null : item._id)}
                                                        className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                                                    >
                                                        <span>Select</span>
                                                        <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdownId === item._id ? 'rotate-180' : ''}`} />
                                                    </button>

                                                    {activeDropdownId === item._id && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left animate-in fade-in zoom-in-95 duration-150">
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
                                                                    setSelectedInvestmentForAdjustment(item);
                                                                    setShowAdjustmentModal(true);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FiSliders className="w-3.5 h-3.5 text-pink-500" />
                                                                Adjustment
                                                            </button>
                                                            {/* নতুন History অপশন */}
                                                            <button
                                                                onClick={() => {
                                                                    setActiveDropdownId(null);
                                                                    setSelectedInvestmentForHistory(item);
                                                                    setShowHistoryModal(true);
                                                                }}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FiClock className="w-3.5 h-3.5 text-purple-500" />
                                                                History
                                                            </button>
                                                            {!adjustments.some(adj => adj.adjustmentID === item._id) && (
                                                                <button
                                                                    onClick={() => {
                                                                        setActiveDropdownId(null);
                                                                        setEditingInvestment(item);
                                                                        setShowForm(true);
                                                                        if (topSectionRef.current) {
                                                                            topSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                                                                        }
                                                                    }}
                                                                    className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                                >
                                                                    <FiEdit3 className="w-3.5 h-3.5 text-indigo-500" />
                                                                    Edit
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(item._id)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
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
                </div>
            </div>

            {/* Adjustment Modal */}
            {showAdjustmentModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-out animate-in fade-in">
                    <div className="relative w-full max-w-2xl bg-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-300 ease-out animate-in zoom-in-95 slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 text-base">
                                    <IoWalletOutline />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">
                                        Adjustment for {selectedInvestmentForAdjustment?.accountName || selectedInvestmentForAdjustment?.bankName || 'Account'}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAdjustmentModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg p-1 rounded-xl hover:bg-gray-100 transition"
                                type="button"
                            >
                                <FiX />
                            </button>
                        </div>

                        <AdjustmentForm
                            onClose={() => {
                                setShowAdjustmentModal(false);
                                fetchAdjustments();
                            }}
                            showToast={showToast}
                            selectedInvestment={selectedInvestmentForAdjustment}
                            availableAmount={selectedInvestmentForAdjustment ? getRemainingAmount(selectedInvestmentForAdjustment) : 0}
                        />
                    </div>
                </div>
            )}

            {/* History Modal (নতুন যোগ করা হলো) */}
            {showHistoryModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-out animate-in fade-in">
                    <div className="relative w-full max-w-4xl bg-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-300 ease-out animate-in zoom-in-95 slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 text-base">
                                    <FiClock />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800">
                                        History for {selectedInvestmentForHistory?.accountName || selectedInvestmentForHistory?.bankName || 'Account'}
                                    </h3>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowHistoryModal(false)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg p-1 rounded-xl hover:bg-gray-100 transition"
                                type="button"
                            >
                                <FiX />
                            </button>
                        </div>

                        {/* HistoryAdjustment কম্পোনেন্ট রেন্ডার হলো */}
                        <HistoryAdjustment
                            onClose={() => setShowHistoryModal(false)}
                            showToast={showToast}
                            selectedInvestment={selectedInvestmentForHistory}
                            refreshInvestments={fetchAdjustments}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default OpeningInvestment;