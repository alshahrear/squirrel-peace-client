import React, { useState, useRef, useEffect } from 'react';
import { FaUser, FaCalendarAlt, FaCreditCard, FaUniversity, FaMoneyBillWave, FaStickyNote, FaTimes } from 'react-icons/fa';

// ISO (YYYY-MM-DD) -> "28 Oct 2026"
const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    const dateObj = new Date(year, month - 1, day);
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const inputBase =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all bg-gray-50/50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed';

const SalesDuePaymentForm = ({
    formData,
    setFormData,
    handleSubmit,
    customers,
    accountTypes,
    uniqueAccounts,
    getAccountKey,
    canPay,
    isSubmitting,
    dueAmount = 0,
}) => {
    const [customerSearch, setCustomerSearch] = useState('');
    const [customerOpen, setCustomerOpen] = useState(false);
    const dateRef = useRef(null);
    const [useDue, setUseDue] = useState(false);

    useEffect(() => {
        setUseDue(false);
        setFormData((prev) => ({ ...prev, amount: '' }));
    }, [formData.customer, formData.type]);

    useEffect(() => {
        if (useDue) setFormData((prev) => ({ ...prev, amount: String(dueAmount) }));
    }, [useDue, dueAmount]);

    const customerChosen = !!formData.customer;

    const filteredCustomers = customers.filter((c) => {
        const q = customerSearch.trim().toLowerCase();
        if (!q) return true;
        return (
            c.businessName?.toLowerCase().includes(q) ||
            c.contactNumber?.toLowerCase().includes(q)
        );
    });

    const handleSelectCustomer = (c) => {
        setFormData((prev) => ({
            ...prev,
            customer: c.businessName,
            customerId: c._id,
            customerContact: c.contactNumber || '',
        }));
        setCustomerSearch(c.businessName);
        setCustomerOpen(false);
    };

    const handleClearCustomer = () => {
        setCustomerSearch('');
        setFormData((prev) => ({ ...prev, customer: '', customerId: '', customerContact: '' }));
    };

    const handleMethodChange = (e) => {
        const value = e.target.value;
        setFormData((prev) => ({
            ...prev,
            paymentMethod: value,
            accountKey: value && value !== 'Bank' && value !== 'Mobile Banking' ? 'cash' : '',
        }));
    };

    return (
        <div className="bg-white shadow-xl rounded-2xl p-6 mb-8 border border-indigo-100">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-indigo-600 flex items-center gap-2"><FaMoneyBillWave /> Add Due Payment</span>
                </h2>
                <div className="inline-flex bg-gray-100 rounded-xl p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'Get' }))}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${formData.type !== 'Pay' ? 'bg-sky-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Get
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'Pay' }))}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${formData.type === 'Pay' ? 'bg-rose-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Pay
                    </button>
                </div>
                {!customerChosen && (
                    <span className="text-xs text-gray-400">Select a customer first</span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">

                {/* Customer Name */}
                <div className="relative">
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaUser className="text-indigo-500" /> Customer Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            value={customerSearch}
                            placeholder="Search or select customer..."
                            onFocus={() => setCustomerOpen(true)}
                            onChange={(e) => {
                                setCustomerSearch(e.target.value);
                                setCustomerOpen(true);
                                if (formData.customer) {
                                    setFormData((prev) => ({ ...prev, customer: '', customerId: '', customerContact: '' }));
                                }
                            }}
                            onBlur={() => setTimeout(() => setCustomerOpen(false), 150)}
                            className={`${inputBase} pr-8`}
                        />
                        {customerSearch && (
                            <button
                                type="button"
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    handleClearCustomer();
                                }}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500 cursor-pointer"
                            >
                                <FaTimes size={12} />
                            </button>
                        )}
                    </div>
                    {customerOpen && (
                        <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
                            {filteredCustomers.length === 0 ? (
                                <p className="px-4 py-3 text-sm text-gray-400">No customer found</p>
                            ) : (
                                filteredCustomers.map((c) => (
                                    <div
                                        key={c._id}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            handleSelectCustomer(c);
                                        }}
                                        className="px-4 py-2.5 cursor-pointer hover:bg-indigo-50 border-b border-gray-100 last:border-b-0"
                                    >
                                        <p className="text-sm font-semibold text-gray-800">{c.businessName}</p>
                                        {c.contactNumber && (
                                            <p className="text-xs text-gray-500 mt-0.5">{c.contactNumber}</p>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Date */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaCalendarAlt className="text-indigo-500" /> Date <span className="text-red-500">*</span>
                    </label>
                    <div
                        className={`relative w-full ${customerChosen ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                        onClick={() => customerChosen && (dateRef.current?.showPicker?.() || dateRef.current?.click())}
                    >
                        <input
                            ref={dateRef}
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                            disabled={!customerChosen}
                            className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        />
                        <input
                            type="text"
                            readOnly
                            disabled={!customerChosen}
                            placeholder="Select date"
                            value={displayFormattedDate(formData.date)}
                            className={`${inputBase} pointer-events-none`}
                        />
                    </div>
                </div>

                {/* Payment Method */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaCreditCard className="text-indigo-500" /> Payment Method <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.paymentMethod}
                        onChange={handleMethodChange}
                        disabled={!customerChosen}
                        className={`${inputBase} cursor-pointer`}
                    >
                        <option value="">Select method...</option>
                        {accountTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Payment Account */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaUniversity className="text-indigo-500" /> Payment Account <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={formData.accountKey}
                        onChange={(e) => setFormData((prev) => ({ ...prev, accountKey: e.target.value }))}
                        disabled={!customerChosen || !formData.paymentMethod}
                        className={`${inputBase} cursor-pointer`}
                    >
                        <option value="">
                            {formData.paymentMethod ? 'Select account...' : 'Select method first'}
                        </option>
                        {uniqueAccounts.map((inv) => {
                            const key = getAccountKey(inv);
                            const label =
                                inv.accountType === 'Bank'
                                    ? `${inv.bankName} - ${inv.accountNumber} (${inv.accountBranch})`
                                    : inv.accountType === 'Mobile Banking'
                                        ? `${inv.accountName} - ${inv.accountNumber}`
                                        : 'Cash';
                            return <option key={key} value={key}>{label}</option>;
                        })}
                    </select>
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <span className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
                            <FaMoneyBillWave className="text-indigo-500" /> Amount <span className="text-red-500">*</span>
                        </span>
                        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-bold text-gray-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useDue}
                                disabled={!customerChosen || dueAmount <= 0}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setUseDue(checked);
                                    if (!checked) setFormData((prev) => ({ ...prev, amount: '' }));
                                }}
                                className="w-3.5 h-3.5 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                            />
                            {formData.type === 'Pay' ? 'Pay' : 'Get'} Amount: ৳ {Number(dueAmount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        readOnly={useDue}
                        disabled={!customerChosen}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                setFormData((prev) => ({ ...prev, amount: value }));
                            }
                        }}
                        className={inputBase}
                    />
                </div>

                {/* Note */}
                <div>
                    <label className="block text-gray-700 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <FaStickyNote className="text-indigo-500" /> Note
                    </label>
                    <input
                        type="text"
                        placeholder="Write additional notes here..."
                        value={formData.note}
                        disabled={!customerChosen}
                        onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                        className={inputBase}
                    />
                </div>

                {/* Submit Button */}
                <div className="sm:col-span-2 md:col-span-3 flex justify-end mt-2">
                    <button
                        type="submit"
                        disabled={!canPay || isSubmitting}
                        className="px-8 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all transform bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 cursor-pointer"
                    >
                        {formData.type === 'Pay' ? (isSubmitting ? 'Paying...' : 'Pay') : (isSubmitting ? 'Saving...' : 'Get')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SalesDuePaymentForm;