import React, { useState, useEffect } from 'react';

const HeadsForm = ({ showToast, editingHead, onHeadAdded, onHeadSaved }) => {
    const isEditMode = Boolean(editingHead);

    const [formData, setFormData] = useState({
        category: '',
        name: '',
        isActive: true,
    });

    const [loading, setLoading] = useState(false);

    // এডিট মোডে ঢুকলে ফর্ম প্রি-ফিল করে দেয়
    useEffect(() => {
        if (editingHead) {
            setFormData({
                category: editingHead.category || '',
                name: editingHead.name || '',
                isActive: editingHead.isActive ?? true,
            });
        } else {
            setFormData({
                category: '',
                name: '',
                isActive: true,
            });
        }
    }, [editingHead]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const now = new Date();
        const formattedDate = now.toLocaleString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        }).toLowerCase().replace(',', ',');

        try {
            if (isEditMode) {
                // আপডেট (PUT)
                const finalData = { ...formData };

                const response = await fetch(`http://localhost:5000/account-heads/${editingHead._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalData),
                });

                if (response.ok) {
                    if (showToast) showToast('Account Head updated successfully!', 'success');

                    if (onHeadSaved) {
                        onHeadSaved({
                            ...editingHead,
                            ...finalData,
                        });
                    }
                } else {
                    if (showToast) showToast('Something went wrong while updating.', 'error');
                }
            } else {
                // নতুন তৈরি (POST)
                const finalData = {
                    ...formData,
                    createdAt: formattedDate,
                };

                const response = await fetch('http://localhost:5000/account-heads', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(finalData),
                });

                if (response.ok) {
                    const resultData = await response.json();

                    if (showToast) showToast('Account Head created successfully!', 'success');

                    if (onHeadAdded) {
                        const newHeadId = resultData.insertedId || resultData._id || Date.now().toString();
                        onHeadAdded({ ...finalData, _id: newHeadId });
                    }

                    // ফর্ম রিসেট
                    setFormData({
                        category: '',
                        name: '',
                        isActive: true,
                    });
                } else {
                    if (showToast) showToast('Something went wrong, please try again.', 'error');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (showToast) showToast('Failed to connect to the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white mb-8 transition-all duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800">
                            {isEditMode ? 'Update Account Head' : 'New Account Head Registration'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isEditMode ? 'Modify the selected account head details' : 'Fill out the details below to create an account head'}
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category Type Select Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Category Type <span className="text-red-500">*</span></label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Choose category type</option>
                            <option value="Income">Income</option>
                            <option value="Expense">Expense</option>
                        </select>
                    </div>

                    {/* Name Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter account head name"
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-2">
                    {/* Active Toggle Switch */}
                    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-200/60 shadow-sm">
                        <div>
                            <span className="block text-sm font-semibold text-gray-800">Status</span>
                            <span className="text-xs text-gray-400">Active status enables this head</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="isActive"
                                checked={formData.isActive}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-indigo-600 peer-checked:to-pink-600"></div>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 transform active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                        >
                            {loading ? 'Submitting...' : isEditMode ? 'Update Account Head' : 'Submit Account Head'}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default HeadsForm;