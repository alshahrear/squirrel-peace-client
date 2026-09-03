import React, { useState, useRef, useEffect } from 'react';
import { FiCalendar, FiCheck } from 'react-icons/fi';

const AdjustmentForm = ({ onClose, showToast, selectedInvestment, editingAdjustment, availableAmount = 0 }) => {
    const [adjustmentData, setAdjustmentData] = useState({
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
        mode: 'Deposit',
        amount: '',
        note: '',
    });
        const [adjustmentLoading, setAdjustmentLoading] = useState(false);
    const [localToast, setLocalToast] = useState({ show: false, message: '' });
    const adjDateInputRef = useRef(null);

    // Edit করার সময় পুরনো adjustment-এর প্রভাব বাদ দিয়ে আসল available balance বের করা হচ্ছে
    const baseAvailableAmount = availableAmount + (editingAdjustment
        ? (editingAdjustment.mode === 'Withdraw'
            ? Number(editingAdjustment.amount || 0)
            : -Number(editingAdjustment.amount || 0))
        : 0);

    // Edit মোডে থাকলে ফর্মে আগের ডেটা বসিয়ে দেওয়া হচ্ছে
    useEffect(() => {
        if (editingAdjustment) {
            setAdjustmentData({
                date: editingAdjustment.date || '',
                mode: editingAdjustment.mode || 'Deposit',
                amount: editingAdjustment.amount || '',
                note: editingAdjustment.note || '',
            });
        }
    }, [editingAdjustment]);

        const handleAdjustmentSubmit = async (e) => {
        e.preventDefault();

        if (adjustmentData.mode === 'Withdraw' && Number(adjustmentData.amount) > baseAvailableAmount) {
            setLocalToast({ show: true, message: `Withdraw amount cannot exceed available balance (৳ ${baseAvailableAmount})!` });
            setTimeout(() => setLocalToast({ show: false, message: '' }), 3000);
            return;
        }

        setAdjustmentLoading(true);

        const finalData = {
            adjustmentID: selectedInvestment?._id,
            date: adjustmentData.date,
            mode: adjustmentData.mode,
            amount: Number(adjustmentData.amount),
            note: adjustmentData.note,
        };

        try {
            const url = editingAdjustment
                ? `http://localhost:5000/adjustment/${editingAdjustment._id}`
                : 'http://localhost:5000/adjustment';
            const method = editingAdjustment ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalData),
            });

            if (response.ok) {
                showToast(editingAdjustment ? 'Adjustment updated successfully!' : 'Adjustment added successfully!', 'success');
                onClose();
            } else {
                showToast('Something went wrong, please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error');
        } finally {
            setAdjustmentLoading(false);
        }
    };

        return (
        <form onSubmit={handleAdjustmentSubmit} className="space-y-4">

            {/* Local Toast - Modal এর উপরে দেখানোর জন্য */}
            {localToast.show && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[999] px-4 py-2.5 bg-rose-600 text-white text-xs font-semibold rounded-xl shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2 duration-200">
                    {localToast.message}
                </div>
            )}

            {/* Available Balance Banner */}
            <div className="flex items-center justify-between px-4 py-2.5 bg-indigo-50 border border-indigo-100 rounded-xl">
                <span className="text-xs font-semibold text-gray-600">Available Balance</span>
                <span className="text-sm font-extrabold text-indigo-700">৳ {baseAvailableAmount.toLocaleString()}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mode Field */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Mode <span className="text-red-500">*</span>
                    </label>
                    <select
                        name="mode"
                        value={adjustmentData.mode}
                        onChange={(e) => setAdjustmentData({ ...adjustmentData, mode: e.target.value })}
                        required
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                    >
                        <option value="Deposit">Deposit</option>
                        <option value="Withdraw">Withdraw</option>
                    </select>
                </div>

                {/* Date Field */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Date <span className="text-red-500">*</span>
                    </label>
                    <div
                        className="relative w-full cursor-pointer"
                        onClick={() => adjDateInputRef.current?.showPicker?.() || adjDateInputRef.current?.click()}
                    >
                        <input
                            ref={adjDateInputRef}
                            type="date"
                            onChange={(e) => {
                                const rawDate = e.target.value;
                                if (rawDate) {
                                    const [year, month, day] = rawDate.split('-');
                                    const dateObj = new Date(year, month - 1, day);
                                    const formatted = dateObj.toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    });
                                    setAdjustmentData(prev => ({ ...prev, date: formatted }));
                                }
                            }}
                            className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        />
                        <div className="flex items-center justify-between w-full px-3.5 py-3 rounded-xl border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-200 transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm">
                            <span>{adjustmentData.date}</span>
                            <FiCalendar className="text-gray-400 text-sm" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Amount Field */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                        Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        name="amount"
                        value={adjustmentData.amount}
                        onChange={(e) => setAdjustmentData({ ...adjustmentData, amount: e.target.value })}
                        required
                        placeholder="Enter amount"
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                    />
                </div>

                {/* Note Field */}
                <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Note</label>
                    <input
                        type="text"
                        name="note"
                        value={adjustmentData.note}
                        onChange={(e) => setAdjustmentData({ ...adjustmentData, note: e.target.value })}
                        placeholder="Optional note"
                        className="w-full px-3.5 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                    />
                </div>
            </div>

            {/* Buttons */}
            <div className="pt-2 flex gap-3">
                <button
                    type="submit"
                    disabled={adjustmentLoading}
                    className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-200 transition duration-300 transform active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
                >
                    <FiCheck className="text-base" />
                    {adjustmentLoading ? 'Submitting...' : editingAdjustment ? 'Update Adjustment' : 'Submit Adjustment'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="py-3 px-5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition duration-300 cursor-pointer"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
};

export default AdjustmentForm;