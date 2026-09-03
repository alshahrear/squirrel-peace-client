import React, { useState, useEffect, useRef } from 'react';

const InvestmentForm = ({
    fetchInvestments,
    setShowForm,
    editingInvestment,
    setEditingInvestment,
    showToast,
    scrollToTable,
    investments = [],
}) => {

    // আজকের ডেট ফরম্যাট করার ফাংশন (যেমন: "31 Aug 2026")
    const getFormattedToday = () => {
        const today = new Date();
        return today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const emptyForm = {
        date: getFormattedToday(),
        accountType: '',
        bankName: '',
        accountNumber: '',
        accountBranch: '',
        accountName: '',
        amount: '',
        note: '',
    };

    const [formData, setFormData] = useState(emptyForm);
    const [loading, setLoading] = useState(false);

    const dateInputRef = useRef(null);

    // এডিট মোডে গেলে ফর্মটা editingInvestment এর ডাটা দিয়ে ভরে দেওয়া
    useEffect(() => {
        if (editingInvestment) {
            setFormData({
                date: editingInvestment.date || getFormattedToday(),
                accountType: editingInvestment.accountType || '',
                bankName: editingInvestment.bankName || '',
                accountNumber: editingInvestment.accountNumber || '',
                accountBranch: editingInvestment.accountBranch || '',
                accountName: editingInvestment.accountName || '',
                amount: editingInvestment.amount ?? '',
                note: editingInvestment.note || '',
            });
        } else {
            setFormData(emptyForm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingInvestment]);

    // ক্যালেন্ডার থেকে ডেট সিলেক্ট করলে সেটি ফরম্যাট হয়ে যাবে
    const handleDateChange = (e) => {
        const rawDate = e.target.value; // yyyy-mm-dd
        if (rawDate) {
            const [year, month, day] = rawDate.split('-');
            const dateObj = new Date(year, month - 1, day);
            const formatted = dateObj.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
            setFormData((prev) => ({
                ...prev,
                date: formatted,
            }));
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // অ্যাকাউন্ট টাইপ পরিবর্তন করলে আগের অতিরিক্ত ফিল্ডগুলো ক্লিয়ার করে দেওয়া ভালো
        if (name === 'accountType') {
            setFormData({
                ...formData,
                accountType: value,
                bankName: '',
                accountNumber: '',
                accountBranch: '',
                accountName: '',
            });
        } else {
            setFormData({
                ...formData,
                [name]: value,
            });
        }
    };

    const handleCancel = () => {
        setFormData(emptyForm);
        setEditingInvestment(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        // অ্যাকাউন্ট টাইপ অনুযায়ী অপ্রয়োজনীয় ফিল্ডগুলো বাদ দিয়ে ফাইনাল ডাটা অবজেক্ট তৈরি
        const finalData = {
            date: formData.date,
            accountType: formData.accountType,
            amount: Number(formData.amount),
            note: formData.note,
            bankName: '',
            accountNumber: '',
            accountBranch: '',
            accountName: '',
        };

        if (formData.accountType === 'Bank') {
            finalData.bankName = formData.bankName;
            finalData.accountNumber = formData.accountNumber;
            finalData.accountBranch = formData.accountBranch;
        } else if (formData.accountType === 'Mobile Banking') {
            finalData.accountName = formData.accountName;
            finalData.accountNumber = formData.accountNumber;
        }

                const isEditing = Boolean(editingInvestment && editingInvestment._id);

        // Duplicate account চেক করা (Mobile Banking: accountName + accountNumber, Bank: bankName + accountNumber)
        const normalize = (val) => (val || '').toString().trim().toLowerCase();
        const isDuplicate = investments.some((inv) => {
            if (isEditing && inv._id === editingInvestment._id) return false; // নিজেকে বাদ দিয়ে চেক করা হচ্ছে
            if (formData.accountType === 'Mobile Banking' && inv.accountType === 'Mobile Banking') {
                return (
                    normalize(inv.accountName) === normalize(formData.accountName) &&
                    normalize(inv.accountNumber) === normalize(formData.accountNumber)
                );
            }
            if (formData.accountType === 'Bank' && inv.accountType === 'Bank') {
                return (
                    normalize(inv.bankName) === normalize(formData.bankName) &&
                    normalize(inv.accountNumber) === normalize(formData.accountNumber)
                );
            }
            return false;
        });

        if (isDuplicate) {
            const duplicateLabel = formData.accountType === 'Bank' ? 'This bank account' : 'This mobile banking account';
            showToast(`${duplicateLabel} already exists!`, 'error');
            setLoading(false);
            return;
        }

        const url = isEditing
            ? `http://localhost:5000/investment/${editingInvestment._id}`
            : 'http://localhost:5000/investment';
        const method = isEditing ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(finalData),
            });

            if (response.ok) {
                showToast(
                    isEditing
                        ? 'Investment updated successfully!'
                        : 'Investment added successfully!',
                    'success'
                );

                // টেবিল রিফ্রেশ করা (parent থেকে ডাটা আবার fetch করা হবে)
                if (fetchInvestments) {
                    await fetchInvestments();
                }

                // ফর্ম রিসেট ও ক্লোজ
                setFormData(emptyForm);
                setEditingInvestment(null);
                setShowForm(false);

                // টেবিল সেকশনে অটো স্ক্রল
                if (scrollToTable) {
                    scrollToTable();
                }
            } else {
                showToast(
                    isEditing
                        ? 'Failed to update investment!'
                        : 'Something went wrong, please try again.',
                    'error'
                );
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const isEditing = Boolean(editingInvestment && editingInvestment._id);

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.03-.659-1.172-.879-1.172-2.303 0-3.182s3.07-.879 4.242 0L15 9M9.5 21H14.5" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800">
                            {isEditing ? 'Edit Investment Record' : 'New Investment Record'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">
                            {isEditing
                                ? 'Update the investment details below'
                                : 'Enter the investment details below'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={handleCancel}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <div
                            className="relative w-full cursor-pointer"
                            onClick={() => dateInputRef.current?.showPicker?.() || dateInputRef.current?.click()}
                        >
                            <input
                                ref={dateInputRef}
                                type="date"
                                onChange={handleDateChange}
                                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                            />
                            <input
                                type="text"
                                readOnly
                                value={formData.date}
                                placeholder="Select date"
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer pointer-events-none"
                            />
                        </div>
                    </div>

                    {/* Account Type Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Account Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="accountType"
                            value={formData.accountType}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Select account type</option>
                            <option value="Cash">Cash</option>
                            <option value="Bank">Bank</option>
                            <option value="Mobile Banking">Mobile Banking</option>
                        </select>
                    </div>
                </div>

                {/* Conditional Fields for Bank */}
                {formData.accountType === 'Bank' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Bank Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="bankName"
                                value={formData.bankName}
                                onChange={handleChange}
                                required
                                placeholder="e.g. City Bank"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                required
                                placeholder="Enter account no"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Account Branch <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="accountBranch"
                                value={formData.accountBranch}
                                onChange={handleChange}
                                required
                                placeholder="e.g. Gulshan Branch"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
                            />
                        </div>
                    </div>
                )}

                {/* Conditional Fields for Mobile Banking */}
                {formData.accountType === 'Mobile Banking' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-pink-50/40 rounded-2xl border border-pink-100">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Account Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="accountName"
                                value={formData.accountName}
                                onChange={handleChange}
                                required
                                placeholder="e.g. bKash / Nagad"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Account Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="accountNumber"
                                value={formData.accountNumber}
                                onChange={handleChange}
                                required
                                placeholder="Enter mobile number"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
                            />
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Amount Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Amount <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            required
                            placeholder="Enter amount"
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>

                    {/* Note Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
                        <input
                            type="text"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            placeholder="Optional note or description"
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="pt-2 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 transform active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
                    >
                        {loading
                            ? isEditing
                                ? 'Updating Investment...'
                                : 'Submitting Investment...'
                            : isEditing
                                ? 'Update Investment'
                                : 'Submit Investment'}
                    </button>

                    {isEditing && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="py-3.5 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition duration-300 cursor-pointer text-sm"
                        >
                            Cancel Edit
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
};

export default InvestmentForm;