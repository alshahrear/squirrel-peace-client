import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import {
    FiEye,
    FiRotateCcw,
    FiCalendar,
    FiTrash2,
    FiEdit3,
    FiX
} from 'react-icons/fi';
import useAuth from '../../../Layout/useAuth';
import useAdmin from '../../../../hooks/useAdmin';
import AdjustmentForm from './Adjustment';

const HistoryAdjustment = ({ selectedInvestment, refreshInvestments }) => {
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    // Search & Filter States
    const [searchMode, setSearchMode] = useState('');
    const [startDateRaw, setStartDateRaw] = useState('');
    const [endDateRaw, setEndDateRaw] = useState('');
    const [startDateDisplay, setStartDateDisplay] = useState('');
    const [endDateDisplay, setEndDateDisplay] = useState('');

    // Edit Modal States
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingAdjustment, setEditingAdjustment] = useState(null);

    const { user } = useAuth();
    const [isAdmin] = useAdmin();

    const startDateInputRef = useRef(null);
    const endDateInputRef = useRef(null);

    const fetchAdjustmentHistory = async () => {
        try {
            const response = await fetch('http://localhost:5000/adjustment');
            const data = await response.json();

            // শুধুমাত্র selectedInvestment এর _id এর সাথে match করা adjustmentID এর ডেটা রাখা হচ্ছে
            const filtered = selectedInvestment
                ? data.filter(item => item.adjustmentID === selectedInvestment._id)
                : data;

            setHistoryData(filtered);
        } catch (error) {
            console.error('Error fetching adjustment history:', error);
            showToast('Failed to load adjustment history!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAdjustmentHistory();
    }, [selectedInvestment]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // ফিল্টার রিসেট করার ফাংশন
    const handleClearFilters = () => {
        setSearchMode('');
        setStartDateRaw('');
        setEndDateRaw('');
        setStartDateDisplay('');
        setEndDateDisplay('');
        showToast('Filters cleared successfully!', 'success');
    };

    // Helper: '31 Aug 2026' ফরম্যাটের স্ট্রিং থেকে JavaScript Date অবজেক্ট তৈরি করা
    const parseCustomDate = (dateStr) => {
        if (!dateStr) return null;
        const parsed = new Date(dateStr);
        if (!isNaN(parsed)) return parsed;

        const parts = dateStr.split(' ');
        if (parts.length === 3) {
            const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
            const day = parseInt(parts[0], 10);
            const month = months[parts[1]];
            const year = parseInt(parts[2], 10);
            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
        return null;
    };

    // ফিল্টার লজিক
    const filteredHistory = historyData.filter((item) => {
        const modeMatch = searchMode === '' || item.mode?.toLowerCase() === searchMode.toLowerCase();

        let dateMatch = true;
        const itemDate = parseCustomDate(item.date);

        if (itemDate) {
            if (startDateRaw) {
                const startD = new Date(startDateRaw);
                startD.setHours(0, 0, 0, 0);
                itemDate.setHours(0, 0, 0, 0);
                dateMatch = dateMatch && itemDate >= startD;
            }
            if (endDateRaw) {
                const endD = new Date(endDateRaw);
                endD.setHours(23, 59, 59, 999);
                itemDate.setHours(0, 0, 0, 0);
                dateMatch = dateMatch && itemDate <= endD;
            }
        }

        return modeMatch && dateMatch;
    });

    const totalDeposit = filteredHistory
        .filter(item => item.mode === 'Deposit')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const totalWithdraw = filteredHistory
        .filter(item => item.mode === 'Withdraw')
        .reduce((sum, item) => sum + Number(item.amount || 0), 0);

    const initialAmount = Number(selectedInvestment?.amount || 0);
    const totalRemaining = initialAmount + totalDeposit - totalWithdraw;

    // SweetAlert নোট প্রিভিউ
    const handleViewNote = (note) => {
        Swal.fire({
            title: '<span class="text-lg font-bold text-gray-800">Adjustment Note</span>',
            html: `<div class="p-2 text-gray-600 bg-gray-50 rounded-lg border border-gray-100 max-h-48 overflow-y-auto text-left text-xs leading-relaxed">${note || 'No note available for this record.'}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'rounded-2xl shadow-xl border border-white text-sm'
            }
        });
    };

    // ডিলিট করার হ্যান্ডলার
    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, delete it!',
            customClass: {
                popup: 'rounded-2xl shadow-xl border border-white text-sm'
            }
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`http://localhost:5000/adjustment/${id}`, {
                    method: 'DELETE',
                });
                const data = await response.json();

                if (data.deletedCount > 0 || data.acknowledged) {
                    setHistoryData(prev => prev.filter(item => item._id !== id));
                    showToast('Record deleted successfully!', 'success');
                    refreshInvestments?.();
                } else {
                    showToast('Failed to delete record!', 'error');
                }
            } catch (error) {
                console.error('Error deleting adjustment record:', error);
                showToast('Something went wrong!', 'error');
            }
        }
    };

    return (
        <div className="relative w-full flex flex-col gap-3">

            {/* টোস্ট নোটিফিকেশন */}
            {toast.show && (
                <div className={`absolute top-2 right-2 z-50 flex items-center gap-2 px-3 py-2 rounded-xl shadow-lg text-white text-xs font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            {/* ফিল্টার সেকশন */}
            <div className="bg-indigo-50/40 p-3 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-gray-700">Filter Records</h3>
                        <span className="px-2 py-0.5 bg-white border border-indigo-100 text-indigo-700 font-semibold text-[10px] rounded-full shadow-2xs">
                            {filteredHistory.length} / {historyData.length}
                        </span>
                    </div>

                    <button
                        onClick={handleClearFilters}
                        className="px-2.5 py-1 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-[10px] rounded-lg transition duration-200 flex items-center gap-1 cursor-pointer shadow-2xs border border-gray-200"
                    >
                        <FiRotateCcw className="w-2.5 h-2.5" />
                        Clear Filters
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Mode</label>
                        <select
                            value={searchMode}
                            onChange={(e) => setSearchMode(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none bg-white text-xs text-gray-700 cursor-pointer shadow-2xs"
                        >
                            <option value="">All Modes</option>
                            <option value="Deposit">Deposit</option>
                            <option value="Withdraw">Withdraw</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">Start Date</label>
                        <div
                            className="relative w-full cursor-pointer"
                            onClick={() => startDateInputRef.current?.showPicker?.() || startDateInputRef.current?.click()}
                        >
                            <input
                                ref={startDateInputRef}
                                type="date"
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setStartDateRaw(raw);
                                    if (raw) {
                                        const [year, month, day] = raw.split('-');
                                        const formatted = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                        });
                                        setStartDateDisplay(formatted);
                                    } else {
                                        setStartDateDisplay('');
                                    }
                                }}
                                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                            />
                            <div className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 shadow-2xs">
                                <span className={startDateDisplay ? 'text-gray-800' : 'text-gray-400'}>{startDateDisplay || 'Start date'}</span>
                                <FiCalendar className="text-gray-400 text-xs" />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-semibold text-gray-500 mb-0.5">End Date</label>
                        <div
                            className="relative w-full cursor-pointer"
                            onClick={() => endDateInputRef.current?.showPicker?.() || endDateInputRef.current?.click()}
                        >
                            <input
                                ref={endDateInputRef}
                                type="date"
                                onChange={(e) => {
                                    const raw = e.target.value;
                                    setEndDateRaw(raw);
                                    if (raw) {
                                        const [year, month, day] = raw.split('-');
                                        const formatted = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
                                            day: '2-digit', month: 'short', year: 'numeric',
                                        });
                                        setEndDateDisplay(formatted);
                                    } else {
                                        setEndDateDisplay('');
                                    }
                                }}
                                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                            />
                            <div className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white text-xs text-gray-700 shadow-2xs">
                                <span className={endDateDisplay ? 'text-gray-800' : 'text-gray-400'}>{endDateDisplay || 'End date'}</span>
                                <FiCalendar className="text-gray-400 text-xs" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* সামারি কার্ড */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center text-xs font-bold">↓</div>
                    <div>
                        <p className="text-[10px] font-semibold text-emerald-700 uppercase">Total Deposit</p>
                        <h3 className="text-sm font-extrabold text-emerald-800">৳ {totalDeposit}</h3>
                    </div>
                </div>

                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 text-white flex items-center justify-center text-xs font-bold">৳</div>
                    <div>
                        <p className="text-[10px] font-semibold text-indigo-700 uppercase">Total Remaining</p>
                        <h3 className="text-sm font-extrabold text-indigo-800">৳ {totalRemaining}</h3>
                    </div>
                </div>

                <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3 flex items-center gap-3 shadow-2xs">
                    <div className="w-8 h-8 rounded-lg bg-rose-500 text-white flex items-center justify-center text-xs font-bold">↑</div>
                    <div>
                        <p className="text-[10px] font-semibold text-rose-700 uppercase">Total Withdraw</p>
                        <h3 className="text-sm font-extrabold text-rose-800">৳ {totalWithdraw}</h3>
                    </div>
                </div>
            </div>

            {/* রেকর্ডস টেবিল সেকশন */}
            <div className="flex flex-col gap-1.5 mt-1">
                <h3 className="text-xs font-bold text-gray-700">Adjustment Records</h3>

                {loading ? (
                    <div className="text-center py-8 text-gray-400 text-xs font-medium">Loading records...</div>
                ) : filteredHistory.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs font-medium">No records found!</div>
                ) : (
                    <div className="max-h-60 overflow-y-auto rounded-xl border border-gray-100 shadow-2xs">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white uppercase text-[10px] z-10">
                                <tr>
                                    <th className="py-2.5 px-3">#</th>
                                    <th className="py-2.5 px-3">Date</th>
                                    <th className="py-2.5 px-3">Mode</th>
                                    <th className="py-2.5 px-3">Amount</th>
                                    <th className="py-2.5 px-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-gray-700">
                                {filteredHistory.map((item, index) => (
                                    <tr key={item._id || index} className="hover:bg-indigo-50/30 transition duration-150">
                                        <td className="py-2.5 px-3 text-gray-400">{index + 1}</td>
                                        <td className="py-2.5 px-3 text-gray-600">{item.date}</td>
                                        <td className="py-2.5 px-3">
                                            <span className={`px-2.5 py-0.5 rounded-full font-semibold text-[10px] ${item.mode === 'Deposit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {item.mode}
                                            </span>
                                        </td>
                                        <td className={`py-2.5 px-3 font-bold ${item.mode === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                            {item.mode === 'Deposit' ? '+' : '-'} ৳ {item.amount}
                                        </td>
                                        <td className="py-2.5 px-3 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => handleViewNote(item.note)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-lg transition duration-200 text-[10px] font-semibold cursor-pointer shadow-2xs"
                                                    title="View Note"
                                                >
                                                    <FiEye className="w-3 h-3" />
                                                    View
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingAdjustment(item);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="inline-flex items-center justify-center p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition duration-200 text-[10px] font-semibold cursor-pointer shadow-2xs"
                                                    title="Edit Record"
                                                >
                                                    <FiEdit3 className="w-3 h-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id)}
                                                    className="inline-flex items-center justify-center p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition duration-200 text-[10px] font-semibold cursor-pointer shadow-2xs"
                                                    title="Delete Record"
                                                >
                                                    <FiTrash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit Adjustment Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm transition-all duration-300 ease-out animate-in fade-in">
                    <div className="relative w-full max-w-2xl bg-white p-6 sm:p-7 rounded-3xl shadow-2xl border border-gray-100 transform transition-all duration-300 ease-out animate-in zoom-in-95 slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-gray-100">
                            <h3 className="text-base font-bold text-gray-800">Edit Adjustment</h3>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingAdjustment(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg p-1 rounded-xl hover:bg-gray-100 transition"
                                type="button"
                            >
                                <FiX />
                            </button>
                        </div>

                        <AdjustmentForm
                            onClose={() => {
                                setShowEditModal(false);
                                setEditingAdjustment(null);
                                fetchAdjustmentHistory();
                                refreshInvestments?.();
                            }}
                            showToast={showToast}
                            selectedInvestment={selectedInvestment}
                            editingAdjustment={editingAdjustment}
                            availableAmount={totalRemaining}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default HistoryAdjustment;