import React, { useState, useEffect, useRef } from 'react';

const TransferForm = ({ showToast, editingTransfer, onTransferAdded, onTransferSaved }) => {

    // আজকের ডেট ফরম্যাট করার ফাংশন (যেমন: "03 Sep 2026")
    const getFormattedToday = () => {
        const today = new Date();
        return today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const [formData, setFormData] = useState({
        transferFrom: '',
        transferTo: '',
        date: getFormattedToday(),
        fromAccount: '',
        toAccount: '',
        amount: '',
        note: '',
    });

    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [allInvestments, setAllInvestments] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [routeExpenses, setRouteExpenses] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const dateInputRef = useRef(null);

    // Fetch accounts + balance-related data from API
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const [invRes, adjRes, incomeRes, expenseRes, routeExpenseRes, transferRes] = await Promise.all([
                    fetch('http://localhost:5000/investment'),
                    fetch('http://localhost:5000/adjustment'),
                    fetch('http://localhost:5000/income'),
                    fetch('http://localhost:5000/expense'),
                    fetch('http://localhost:5000/routeExpense'),
                    fetch('http://localhost:5000/transfer'),
                ]);

                const data = invRes.ok ? await invRes.json() : [];
                const adjData = adjRes.ok ? await adjRes.json() : [];
                const incomeData = incomeRes.ok ? await incomeRes.json() : [];
                const expenseData = expenseRes.ok ? await expenseRes.json() : [];
                const routeExpenseData = routeExpenseRes.ok ? await routeExpenseRes.json() : [];
                const transferData = transferRes.ok ? await transferRes.json() : [];

                // Filter unique items where accountType, accountName, accountNumber and bankName match
                const uniqueAccounts = data.reduce((acc, current) => {
                    const x = acc.find(item =>
                        item.accountType === current.accountType &&
                        item.accountName === current.accountName &&
                        item.accountNumber === current.accountNumber &&
                        item.bankName === current.bankName
                    );
                    if (!x) {
                        return acc.concat([current]);
                    } else {
                        return acc;
                    }
                }, []);

                setAccounts(uniqueAccounts);
                setAllInvestments(Array.isArray(data) ? data : []);
                setAdjustments(Array.isArray(adjData) ? adjData : []);
                setIncomes(Array.isArray(incomeData) ? incomeData : []);
                setExpenses(Array.isArray(expenseData) ? expenseData : []);
                setRouteExpenses(Array.isArray(routeExpenseData) ? routeExpenseData : []);
                setTransfers(Array.isArray(transferData) ? transferData : []);
            } catch (error) {
                console.error('Failed to fetch accounts:', error);
            }
        };

        fetchAccounts();
    }, []);

    // Handle Edit Mode Data Load
    useEffect(() => {
        if (editingTransfer) {
            setFormData({
                transferFrom: editingTransfer.transferFrom || '',
                transferTo: editingTransfer.transferTo || '',
                date: editingTransfer.date || getFormattedToday(),
                fromAccount: editingTransfer.fromAccount || '',
                toAccount: editingTransfer.toAccount || '',
                amount: editingTransfer.amount || '',
                note: editingTransfer.note || '',
            });
        } else {
            setFormData({
                transferFrom: '',
                transferTo: '',
                date: getFormattedToday(),
                fromAccount: '',
                toAccount: '',
                amount: '',
                note: '',
            });
        }
    }, [editingTransfer]);

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
        setFormData((prev) => {
            const updated = { ...prev, [name]: value };

            // Transfer From পরিবর্তন হলে
            if (name === 'transferFrom') {
                if (value === 'Cash') {
                    updated.fromAccount = 'Cash';
                } else {
                    updated.fromAccount = '';
                }

                if (value === 'Cash' && prev.transferTo === 'Cash') {
                    updated.transferTo = '';
                    updated.toAccount = '';
                }
            }

            // Transfer To পরিবর্তন হলে
            if (name === 'transferTo') {
                if (value === 'Cash') {
                    updated.toAccount = 'Cash';
                } else {
                    updated.toAccount = '';
                }
            }

            // যদি fromAccount এবং toAccount একই হয়ে যায়, তবে toAccount রিসেট করে দেব
            if (name === 'fromAccount' && value === prev.toAccount && value !== 'Cash') {
                updated.toAccount = '';
            }

            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Selected "From" account এ পর্যাপ্ত ব্যালেন্স আছে কিনা চেক করা হচ্ছে
        const availableBalance = getAccountBalance(formData.transferFrom, formData.fromAccount);
        if (Number(formData.amount) > availableBalance) {
            showToast('Insufficient balance in the selected account!', 'error');
            return;
        }

        setLoading(true);

        const url = editingTransfer
            ? `http://localhost:5000/transfer/${editingTransfer._id}`
            : 'http://localhost:5000/transfer';

        const method = editingTransfer ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const resultData = await response.json();

                showToast(editingTransfer ? 'Transfer updated successfully!' : 'Transfer created successfully!', 'success');

                if (editingTransfer && onTransferSaved) {
                    const updatedTransferObj = {
                        ...editingTransfer,
                        ...formData,
                    };
                    onTransferSaved(updatedTransferObj);
                } else if (onTransferAdded) {
                    const newTransferId = resultData.insertedId || resultData._id || Date.now().toString();
                    const createdTransferObj = {
                        ...formData,
                        _id: newTransferId
                    };
                    onTransferAdded(createdTransferObj);
                }

                // ফর্ম রিসেট
                setFormData({
                    transferFrom: '',
                    transferTo: '',
                    date: getFormattedToday(),
                    fromAccount: '',
                    toAccount: '',
                    amount: '',
                    note: '',
                });
            } else {
                showToast('Something went wrong, please try again.', 'error');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // Helper to get label text for account option display
    const getAccountLabel = (acc) => {
        if (acc.accountType === 'Cash') return 'Cash';
        if (acc.accountType === 'Mobile Banking') {
            return `${acc.accountName} (${acc.accountNumber})`;
        }
        if (acc.accountType === 'Bank') {
            return `${acc.bankName} - ${acc.accountNumber} (${acc.accountBranch || 'Main'})`;
        }
        return acc.accountNumber || acc.accountType;
    };

    // Category বের করা (cash/mobile/bank)
    const getCategory = (accountType = '') => {
        const type = accountType.toLowerCase();
        if (type.includes('cash')) return 'cash';
        if (type.includes('mobile')) return 'mobile';
        if (type.includes('bank')) return 'bank';
        return 'others';
    };

    // AccountBalance পেজের সাথে মিলিয়ে account key বানানো
    const getAccountKey = (item) => {
        const accountName = item.accountName || item.bankName || 'N/A';
        const accountNumber = item.accountNumber || '';
        const accountBranch = item.accountBranch || '';
        return `${accountName}||${accountNumber}||${accountBranch}`;
    };

    // একটা নির্দিষ্ট investment এর remaining amount (Deposit/Withdraw ধরে)
    const getRemainingInvestment = (investment) => {
        const relatedAdjustments = adjustments.filter(adj => adj.adjustmentID === investment._id);
        const totalDeposit = relatedAdjustments
            .filter(adj => adj.mode === 'Deposit')
            .reduce((sum, adj) => sum + Number(adj.amount || 0), 0);
        const totalWithdraw = relatedAdjustments
            .filter(adj => adj.mode === 'Withdraw')
            .reduce((sum, adj) => sum + Number(adj.amount || 0), 0);
        return Number(investment.amount || 0) + totalDeposit - totalWithdraw;
    };

    // নির্দিষ্ট account (type + label) এর বর্তমান remaining balance বের করা
    const resolveTransferKey = (transferType, transferLabel) => {
        if (transferLabel === 'Cash') {
            const cashAcc = allInvestments.find(a => getCategory(a.accountType) === 'cash');
            return cashAcc ? getAccountKey(cashAcc) : 'N/A||||';
        }
        const acc = allInvestments.find(a => a.accountType === transferType && getAccountLabel(a) === transferLabel);
        return acc ? getAccountKey(acc) : null;
    };

    const getAccountBalance = (type, label) => {
        if (!type || !label) return 0;

        const matchedKey = resolveTransferKey(type, label);
        if (!matchedKey) return 0;

        let balance = 0;

        allInvestments.forEach(inv => {
            if (getAccountKey(inv) === matchedKey) balance += getRemainingInvestment(inv);
        });

        incomes.forEach(item => {
            if (getAccountKey(item) === matchedKey) balance += Number(item.amount) || 0;
        });

        expenses.forEach(item => {
            if (getAccountKey(item) === matchedKey) balance -= Number(item.amount) || 0;
        });

        routeExpenses.forEach(item => {
            if (getAccountKey(item) === matchedKey) balance -= Number(item.amount) || 0;
        });

        transfers.forEach(item => {
            // Edit মোডে থাকা transfer টা বাদ, কারণ সেটার effect আগে থেকেই ধরা আছে
            if (editingTransfer && item._id === editingTransfer._id) return;

            const amt = Number(item.amount) || 0;

            const fromKey = resolveTransferKey(item.transferFrom, item.fromAccount);
            if (fromKey && fromKey === matchedKey) balance -= amt;

            const toKey = resolveTransferKey(item.transferTo, item.toAccount);
            if (toKey && toKey === matchedKey) balance += amt;
        });

        return balance;
    };

    // Filter accounts based on transferFrom and transferTo selection
    const fromAccountList = accounts.filter(acc => acc.accountType === formData.transferFrom);
    const toAccountList = accounts.filter(acc => {
        if (acc.accountType !== formData.transferTo) return false;
        if (formData.transferFrom === formData.transferTo) {
            return JSON.stringify(acc) !== JSON.stringify(
                accounts.find(a => getAccountLabel(a) === formData.fromAccount && a.accountType === formData.transferFrom)
            );
        }
        return true;
    });

    const areTransferDropdownsEmpty = !formData.transferFrom || !formData.transferTo;

    return (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white mb-8 transition-all duration-300">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800">
                            {editingTransfer ? 'Edit Transfer Information' : 'New Balance Transfer'}
                        </h3>
                        <p className="text-xs text-gray-400 mt-0.5">Fill out the essential transfer details below</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Transfer From & Transfer To Row */}
                <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center">
                    <div className="md:col-span-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Transfer From <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="transferFrom"
                            value={formData.transferFrom}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Select source</option>
                            <option value="Cash">Cash</option>
                            <option value="Mobile Banking">Mobile Banking</option>
                            <option value="Bank">Bank</option>
                        </select>
                    </div>

                    <div className="md:col-span-1 flex justify-center md:pt-7">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </div>

                    <div className="md:col-span-5">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Transfer To <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="transferTo"
                            value={formData.transferTo}
                            onChange={handleChange}
                            disabled={!formData.transferFrom}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="" disabled>Select destination</option>
                            <option value="Cash" disabled={formData.transferFrom === 'Cash'}>Cash</option>
                            <option value="Mobile Banking">Mobile Banking</option>
                            <option value="Bank">Bank</option>
                        </select>
                    </div>
                </div>

                {/* Date, From Account & To Account Row */}
                <div className={`grid grid-cols-1 md:grid-cols-11 gap-4 items-center transition-opacity duration-200 ${areTransferDropdownsEmpty ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <div className="md:col-span-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <div
                            className="relative w-full cursor-pointer"
                            onClick={() => !areTransferDropdownsEmpty && (dateInputRef.current?.showPicker?.() || dateInputRef.current?.click())}
                        >
                            <input
                                ref={dateInputRef}
                                type="date"
                                disabled={areTransferDropdownsEmpty}
                                onChange={handleDateChange}
                                className="absolute opacity-0 w-0 h-0 pointer-events-none"
                            />
                            <input
                                type="text"
                                readOnly
                                disabled={areTransferDropdownsEmpty}
                                value={formData.date}
                                placeholder="Select date"
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">From Account <span className="text-red-500">*</span></label>
                        {formData.transferFrom === 'Cash' ? (
                            <input
                                type="text"
                                name="fromAccount"
                                value="Cash"
                                disabled
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-100 text-sm text-gray-700 shadow-sm cursor-not-allowed"
                            />
                        ) : (
                            <select
                                name="fromAccount"
                                value={formData.fromAccount}
                                onChange={handleChange}
                                disabled={areTransferDropdownsEmpty}
                                required
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                            >
                                <option value="" disabled>Select from account</option>
                                {fromAccountList.map((acc, index) => {
                                    const label = getAccountLabel(acc);
                                    return (
                                        <option key={index} value={label}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>

                    <div className="md:col-span-1 flex justify-center md:pt-7">
                        <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </div>
                    </div>

                    <div className="md:col-span-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">To Account <span className="text-red-500">*</span></label>
                        {formData.transferTo === 'Cash' ? (
                            <input
                                type="text"
                                name="toAccount"
                                value="Cash"
                                disabled
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-100 text-sm text-gray-700 shadow-sm cursor-not-allowed"
                            />
                        ) : (
                            <select
                                name="toAccount"
                                value={formData.toAccount}
                                onChange={handleChange}
                                disabled={areTransferDropdownsEmpty}
                                required
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                            >
                                <option value="" disabled>Select to account</option>
                                {toAccountList.map((acc, index) => {
                                    const label = getAccountLabel(acc);
                                    return (
                                        <option key={index} value={label}>
                                            {label}
                                        </option>
                                    );
                                })}
                            </select>
                        )}
                    </div>
                </div>

                <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-2 transition-opacity duration-200 ${areTransferDropdownsEmpty ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Amount <span className="text-red-500">*</span></label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            disabled={areTransferDropdownsEmpty}
                            required
                            placeholder="Enter amount"
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm disabled:cursor-not-allowed"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Note</label>
                        <input
                            type="text"
                            name="note"
                            value={formData.note}
                            onChange={handleChange}
                            disabled={areTransferDropdownsEmpty}
                            placeholder="Add a short note (optional)"
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm disabled:cursor-not-allowed"
                        />
                    </div>

                    <div className="md:pt-7">
                        <button
                            type="submit"
                            disabled={loading || areTransferDropdownsEmpty}
                            className="w-full py-4 px-4 bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200 transition duration-300 transform active:scale-[0.98] disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        >
                            {loading ? (editingTransfer ? 'Updating Transfer...' : 'Processing Transfer...') : (editingTransfer ? 'Update Transfer' : 'Transfer')}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default TransferForm;