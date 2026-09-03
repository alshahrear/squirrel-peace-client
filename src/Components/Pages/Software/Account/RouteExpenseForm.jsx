import React, { useState, useEffect, useRef } from 'react';

const RouteExpenseForm = ({
    fetchRouteExpenses,
    setShowForm,
    editingRouteExpense,
    setEditingRouteExpense,
    showToast,
    scrollToTable,
}) => {
    // আজকের ডেট ফরম্যাট করার ফাংশন (যেমন: "01 Sep 2026")
    const getFormattedToday = () => {
        const today = new Date();
        return today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const emptyForm = {
        deliveredBy: '',
        routeName: '',
        routeExpenseCategory: '',
        name: '',
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
    const [routeExpenseHeads, setRouteExpenseHeads] = useState([]);
    const [investments, setInvestments] = useState([]);
    const [deliveryMen, setDeliveryMen] = useState([]);
    const [routes, setRoutes] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [allIncomes, setAllIncomes] = useState([]);
    const [allExpenses, setAllExpenses] = useState([]);
    const [allRouteExpenses, setAllRouteExpenses] = useState([]);
    const [allTransfers, setAllTransfers] = useState([]);

    const dateInputRef = useRef(null);

    // Active Route Expense ক্যাটাগরির Account Heads fetch করা
    useEffect(() => {
        const fetchRouteExpenseHeads = async () => {
            try {
                const res = await fetch('http://localhost:5000/account-heads');
                const data = await res.json();
                const filtered = data.filter(
                    (head) => head.category === 'Expense' && head.isActive === true
                );
                setRouteExpenseHeads(filtered);
            } catch (error) {
                console.error('Error fetching route expense heads:', error);
            }
        };

        fetchRouteExpenseHeads();
    }, []);

    // Investment + Balance সংক্রান্ত সব ডেটা ফেচ করা (Account Balance check করার জন্য)
    useEffect(() => {
        const fetchInvestments = async () => {
            try {
                const [invRes, adjRes, incomeRes, expenseRes, routeExpenseRes, transferRes] = await Promise.all([
                    fetch('http://localhost:5000/investment'),
                    fetch('http://localhost:5000/adjustment'),
                    fetch('http://localhost:5000/income'),
                    fetch('http://localhost:5000/expense'),
                    fetch('http://localhost:5000/routeExpense'),
                    fetch('http://localhost:5000/transfer'),
                ]);
                const data = await invRes.json();
                const adjData = await adjRes.json();
                const incomeData = await incomeRes.json();
                const expenseData = await expenseRes.json();
                const routeExpenseData = await routeExpenseRes.json();
                const transferData = await transferRes.json();

                setInvestments(data);
                setAdjustments(Array.isArray(adjData) ? adjData : []);
                setAllIncomes(Array.isArray(incomeData) ? incomeData : []);
                setAllExpenses(Array.isArray(expenseData) ? expenseData : []);
                setAllRouteExpenses(Array.isArray(routeExpenseData) ? routeExpenseData : []);
                setAllTransfers(Array.isArray(transferData) ? transferData : []);
            } catch (error) {
                console.error('Error fetching investments:', error);
            }
        };

        fetchInvestments();
    }, []);

    // Active Delivery Man রোল ইউজার fetch করা (Delivered By ফিল্ডের জন্য)
    useEffect(() => {
        const fetchDeliveryMen = async () => {
            try {
                const res = await fetch('http://localhost:5000/user');
                const data = await res.json();
                const filtered = data.filter(
                    (user) => user.role === 'Delivery Man' && user.isActive === true
                );
                setDeliveryMen(filtered);
            } catch (error) {
                console.error('Error fetching delivery men:', error);
            }
        };

        fetchDeliveryMen();
    }, []);

    // Active Route তালিকা fetch করা (Route Name ফিল্ডের জন্য)
    useEffect(() => {
        const fetchRoutes = async () => {
            try {
                const res = await fetch('http://localhost:5000/route');
                const data = await res.json();
                const filtered = data.filter((route) => route.isActive === true);
                setRoutes(filtered);
            } catch (error) {
                console.error('Error fetching routes:', error);
            }
        };

        fetchRoutes();
    }, []);

    // এডিট মোডে গেলে ফর্মটা editingRouteExpense এর ডাটা দিয়ে ভরে দেওয়া
    useEffect(() => {
        if (editingRouteExpense) {
            setFormData({
                deliveredBy: editingRouteExpense.deliveredBy || '',
                routeName: editingRouteExpense.routeName || '',
                routeExpenseCategory: editingRouteExpense.routeExpenseCategory || '',
                name: editingRouteExpense.name || '',
                date: editingRouteExpense.date || getFormattedToday(),
                accountType: editingRouteExpense.accountType || '',
                bankName: editingRouteExpense.bankName || '',
                accountNumber: editingRouteExpense.accountNumber || '',
                accountBranch: editingRouteExpense.accountBranch || '',
                accountName: editingRouteExpense.accountName || '',
                amount: editingRouteExpense.amount ?? '',
                note: editingRouteExpense.note || '',
            });
        } else {
            setFormData({
                ...emptyForm,
                date: getFormattedToday(),
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editingRouteExpense]);

    // ইউনিক ইনভয়েস নম্বর তৈরির ফাংশন (যেমন: 260901035526)
    const generateInvoiceNumber = () => {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yy}${mm}${dd}${hh}${min}${ss}`;
    };

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

    // ব্যাংক অ্যাকাউন্ট সিলেক্ট করলে অটো ফিলআপ করার হ্যান্ডলার
    const handleBankSelectChange = (e) => {
        const selectedId = e.target.value;
        const matched = investments.find((item) => item._id === selectedId);
        if (matched) {
            setFormData({
                ...formData,
                bankName: matched.bankName || '',
                accountNumber: matched.accountNumber || '',
                accountBranch: matched.accountBranch || '',
            });
        } else {
            setFormData({
                ...formData,
                bankName: '',
                accountNumber: '',
                accountBranch: '',
            });
        }
    };

    // মোবাইল ব্যাংকিং সিলেক্ট করলে অটো ফিলআপ করার হ্যান্ডলার
    const handleMobileBankingSelectChange = (e) => {
        const selectedId = e.target.value;
        const matched = investments.find((item) => item._id === selectedId);
        if (matched) {
            setFormData({
                ...formData,
                accountName: matched.accountName || '',
                accountNumber: matched.accountNumber || '',
            });
        } else {
            setFormData({
                ...formData,
                accountName: '',
                accountNumber: '',
            });
        }
    };

    // accountType কে normalize করে cash/mobile/bank ক্যাটাগরিতে ভাগ করা (AccountBalance পেজের সাথে মিলিয়ে)
    const getCategory = (accountType = '') => {
        const type = accountType.toLowerCase();
        if (type.includes('cash')) return 'cash';
        if (type.includes('mobile')) return 'mobile';
        if (type.includes('bank')) return 'bank';
        return 'others';
    };

    // AccountBalance পেজের ensureKey এর সাথে মিলিয়ে account key বানানো
    const buildAccountKey = (item) => {
        const accountName = item.accountName || item.bankName || 'N/A';
        const accountNumber = item.accountNumber || '';
        const accountBranch = item.accountBranch || '';
        return `${accountName}||${accountNumber}||${accountBranch}`;
    };

    // Transfer এর label এর সাথে investment মিলানোর জন্য
    const getAccountLabelForTransfer = (acc) => {
        if (acc.accountType === 'Cash') return 'Cash';
        if (acc.accountType === 'Mobile Banking') {
            return `${acc.accountName} (${acc.accountNumber})`;
        }
        if (acc.accountType === 'Bank') {
            return `${acc.bankName} - ${acc.accountNumber} (${acc.accountBranch || 'Main'})`;
        }
        return acc.accountNumber || acc.accountType;
    };

    const resolveTransferAccountKey = (type, label) => {
        if (label === 'Cash') {
            const cashAcc = investments.find(inv => getCategory(inv.accountType) === 'cash');
            return cashAcc ? buildAccountKey(cashAcc) : 'N/A||||';
        }
        const acc = investments.find(inv => inv.accountType === type && getAccountLabelForTransfer(inv) === label);
        return acc ? buildAccountKey(acc) : null;
    };

    // একটা investment এর remaining amount (Deposit/Withdraw ধরে)
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

    // বর্তমান ফর্মে সিলেক্ট করা account এর key বের করা (Cash / Mobile Banking / Bank)
    const getSelectedAccountKey = () => {
        if (formData.accountType === 'Cash') {
            return 'N/A||||';
        }
        if (formData.accountType === 'Bank') {
            const accountName = formData.bankName || 'N/A';
            return `${accountName}||${formData.accountNumber || ''}||${formData.accountBranch || ''}`;
        }
        if (formData.accountType === 'Mobile Banking') {
            const accountName = formData.accountName || 'N/A';
            return `${accountName}||${formData.accountNumber || ''}||`;
        }
        return null;
    };

    // নির্দিষ্ট account key এর বর্তমান remaining balance বের করা (Investment + Income - Expense - RouteExpense +/- Transfer)
    const getAccountBalance = (targetKey) => {
        if (!targetKey) return 0;

        let balance = 0;

        investments.forEach(inv => {
            if (buildAccountKey(inv) === targetKey) balance += getRemainingInvestment(inv);
        });

        allIncomes.forEach(item => {
            if (buildAccountKey(item) === targetKey) balance += Number(item.amount) || 0;
        });

        allExpenses.forEach(item => {
            if (buildAccountKey(item) === targetKey) balance -= Number(item.amount) || 0;
        });

        allRouteExpenses.forEach(item => {
            // এডিট মোডে থাকা রুট এক্সপেন্স টা বাদ, কারণ সেটার effect আগে থেকেই ধরা আছে
            if (editingRouteExpense && item._id === editingRouteExpense._id) return;
            if (buildAccountKey(item) === targetKey) balance -= Number(item.amount) || 0;
        });

        allTransfers.forEach(item => {
            const amt = Number(item.amount) || 0;

            const fromKey = resolveTransferAccountKey(item.transferFrom, item.fromAccount);
            if (fromKey && fromKey === targetKey) balance -= amt;

            const toKey = resolveTransferAccountKey(item.transferTo, item.toAccount);
            if (toKey && toKey === targetKey) balance += amt;
        });

        return balance;
    };

    const handleCancel = () => {
        setFormData(emptyForm);
        setEditingRouteExpense(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // সিলেক্ট করা account এ পর্যাপ্ত ব্যালেন্স আছে কিনা চেক করা হচ্ছে
        const selectedAccountKey = getSelectedAccountKey();
        const availableBalance = getAccountBalance(selectedAccountKey);
        if (Number(formData.amount) > availableBalance) {
            showToast('Insufficient balance in the selected account!', 'error', { position: 'top-right' });
            return;
        }

        setLoading(true);

        const isEditing = Boolean(editingRouteExpense && editingRouteExpense._id);

        // অ্যাকাউন্ট টাইপ অনুযায়ী অপ্রয়োজনীয় ফিল্ডগুলো বাদ দিয়ে ফাইনাল ডাটা অবজেক্ট তৈরি
        const finalData = {
            deliveredBy: formData.deliveredBy,
            routeName: formData.routeName,
            routeExpenseCategory: formData.routeExpenseCategory,
            name: formData.name,
            date: formData.date,
            accountType: formData.accountType,
            amount: Number(formData.amount),
            note: formData.note,
            bankName: '',
            accountNumber: '',
            accountBranch: '',
            accountName: '',
            // নতুন রেকর্ড হলে ইনভয়েস যুক্ত হবে, এডিট হলে আগের ইনভয়েস ঠিক থাকবে বা নতুন জেনারেট হতে পারে
            invoiceNumber: isEditing && editingRouteExpense.invoiceNumber
                ? editingRouteExpense.invoiceNumber
                : generateInvoiceNumber(),
        };

        if (formData.accountType === 'Bank') {
            finalData.bankName = formData.bankName;
            finalData.accountNumber = formData.accountNumber;
            finalData.accountBranch = formData.accountBranch;
        } else if (formData.accountType === 'Mobile Banking') {
            finalData.accountName = formData.accountName;
            finalData.accountNumber = formData.accountNumber;
        }

        const url = isEditing
            ? `http://localhost:5000/routeExpense/${editingRouteExpense._id}`
            : 'http://localhost:5000/routeExpense';
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
                        ? 'Route Expense updated successfully!'
                        : 'Route Expense added successfully!',
                    'success',
                    { position: 'top-right' }
                );

                if (fetchRouteExpenses) {
                    await fetchRouteExpenses();
                }

                setFormData({
                    ...emptyForm,
                    date: getFormattedToday(),
                });
                setEditingRouteExpense(null);
                setShowForm(false);

                if (scrollToTable) {
                    scrollToTable();
                }
            } else {
                showToast(
                    isEditing
                        ? 'Failed to update route expense!'
                        : 'Something went wrong, please try again.',
                    'error',
                    { position: 'top-right' }
                );
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Failed to connect to the server.', 'error', { position: 'top-right' });
        } finally {
            setLoading(false);
        }
    };

    const isEditing = Boolean(editingRouteExpense && editingRouteExpense._id);

    // ব্যাংক এবং মোবাইল ব্যাংকিং ফিল্টার করা ইনভেস্টমেন্ট ডেটা
    const bankInvestments = investments.filter(item => item.accountType === 'Bank');
    const mobileInvestments = investments.filter(item => item.accountType === 'Mobile Banking');

    return (
        <div className="relative">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.03-.659-1.172-.879-1.172-2.303 0-3.182s3.07-.879 4.242 0L15 9M9.5 21H14.5" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-extrabold text-gray-800">
                            {isEditing ? 'Edit Route Expense Record' : 'New Route Expense Record'}
                        </h3>

                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Delivered By Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Delivered By <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="deliveredBy"
                            value={formData.deliveredBy}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Select delivery man</option>
                            {deliveryMen.map((user) => (
                                <option key={user._id} value={user.name}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Route Name Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Route Name <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="routeName"
                            value={formData.routeName}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Select route</option>
                            {routes.map((route) => (
                                <option key={route._id} value={route.name}>
                                    {route.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Route Expense Category Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Route Expense Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            name="routeExpenseCategory"
                            value={formData.routeExpenseCategory}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
                        >
                            <option value="" disabled>Select route expense category</option>
                            {routeExpenseHeads.map((head) => (
                                <option key={head._id} value={head.name}>
                                    {head.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Enter name"
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>

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
                                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer pointer-events-none"
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
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm cursor-pointer"
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
                    <div className="space-y-4 p-4 bg-cyan-50/40 rounded-2xl border border-cyan-100">
                        {/* Select Bank from Investment API */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Bank Account <span className="text-red-500">*</span>
                            </label>
                            <select
                                onChange={handleBankSelectChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled>Select saved bank account</option>
                                {bankInvestments.map((inv) => (
                                    <option key={inv._id} value={inv._id}>
                                        {inv.bankName} - {inv.accountNumber} ({inv.accountBranch})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Conditional Fields for Mobile Banking */}
                {formData.accountType === 'Mobile Banking' && (
                    <div className="space-y-4 p-4 bg-blue-50/40 rounded-2xl border border-blue-100">
                        {/* Select Mobile Banking from Investment API */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Select Mobile Account <span className="text-red-500">*</span>
                            </label>
                            <select
                                onChange={handleMobileBankingSelectChange}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm cursor-pointer"
                                defaultValue=""
                            >
                                <option value="" disabled>Select saved mobile account</option>
                                {mobileInvestments.map((inv) => (
                                    <option key={inv._id} value={inv._id}>
                                        {inv.accountName} - {inv.accountNumber}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
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
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-white text-sm text-gray-700 shadow-sm"
                                />
                            </div>
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
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
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
                            className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700 shadow-sm"
                        />
                    </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div className="pt-2 flex items-center gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 py-3.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-cyan-200 transition duration-300 transform active:scale-[0.98] disabled:opacity-50 cursor-pointer text-sm"
                    >
                        {loading
                            ? isEditing
                                ? 'Updating Route Expense...'
                                : 'Submitting Route Expense...'
                            : isEditing
                                ? 'Update Route Expense'
                                : 'Submit Route Expense'}
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

export default RouteExpenseForm;