import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    FiDollarSign,
    FiSmartphone,
    FiCreditCard,
    FiTrendingUp,
    FiTrendingDown,
    FiHash,
    FiMapPin,
    FiLayers,
    FiArrowUpCircle,
    FiArrowDownCircle,
    FiRepeat
} from 'react-icons/fi';
import { FaRoute } from 'react-icons/fa';
import { IoWalletOutline } from 'react-icons/io5';

// প্রতি কত সেকেন্ড পর পর ডাটা অটো-রিফ্রেশ হবে (পেজ রিলোড ছাড়াই)
const POLL_INTERVAL = 5000;

// ৪টা ট্যাব কনফিগ (Accounts ডিফল্ট)
const TABS = [
    { key: 'accounts', label: 'Accounts', icon: <FiLayers className="w-4 h-4" /> },
    { key: 'income', label: 'Income', icon: <FiArrowUpCircle className="w-4 h-4" /> },
    { key: 'expense', label: 'Expense', icon: <FiArrowDownCircle className="w-4 h-4" /> },
    { key: 'routeExpense', label: 'Route Expense', icon: <FaRoute className="w-4 h-4" /> },
    { key: 'transfer', label: 'Transfer', icon: <FiRepeat className="w-4 h-4" /> },
];

const AccountBalance = () => {
    const [investments, setInvestments] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [routeExpenses, setRouteExpenses] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('accounts');
    const isFirstLoad = useRef(true);

    // Investment + Adjustment + Income + Expense + Route Expense ডাটা fetch করা (silent background refresh সাপোর্ট করে)
    const fetchAllData = useCallback(async () => {
        try {
            const [invRes, adjRes, incomeRes, expenseRes, routeExpenseRes, transferRes] = await Promise.all([
                fetch('http://localhost:5000/investment'),
                fetch('http://localhost:5000/adjustment'),
                fetch('http://localhost:5000/income'),
                fetch('http://localhost:5000/expense'),
                fetch('http://localhost:5000/routeExpense'),
                fetch('http://localhost:5000/transfer')
            ]);
            const invData = await invRes.json();
            const adjData = await adjRes.json();
            const incomeData = await incomeRes.json();
            const expenseData = await expenseRes.json();
            const routeExpenseData = await routeExpenseRes.json();
            const transferData = await transferRes.json();
            setInvestments(Array.isArray(invData) ? invData : []);
            setAdjustments(Array.isArray(adjData) ? adjData : []);
            setIncomes(Array.isArray(incomeData) ? incomeData : []);
            setExpenses(Array.isArray(expenseData) ? expenseData : []);
            setRouteExpenses(Array.isArray(routeExpenseData) ? routeExpenseData : []);
            setTransfers(Array.isArray(transferData) ? transferData : []);
        } catch (error) {
            console.error('Error fetching balance data:', error);
        } finally {
            if (isFirstLoad.current) {
                setLoading(false);
                isFirstLoad.current = false;
            }
        }
    }, []);

    useEffect(() => {
        fetchAllData();
        const intervalId = setInterval(fetchAllData, POLL_INTERVAL);
        return () => clearInterval(intervalId);
    }, [fetchAllData]);

    // OpeningInvestment.jsx এর মতোই remaining amount হিসাব (Deposit/Withdraw ধরে)
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

    // accountType কে normalize করে Cash / Mobile Banking / Bank -- তিনটা ক্যাটাগরিতে ভাগ করা
    const getCategory = (accountType = '') => {
        const type = accountType.toLowerCase();
        if (type.includes('cash')) return 'cash';
        if (type.includes('mobile')) return 'mobile';
        if (type.includes('bank')) return 'bank';
        return 'others';
    };

    // TransferForm এ ব্যবহৃত label এর সাথে মিলানোর জন্য (Transfer From/To match করতে লাগবে)
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

    // একই Account Name + Account No + Branch হলে সেগুলোর amount যোগ করে একটা row বানানো (Investment এর জন্য)
    const groupByAccount = (category) => {
        const grouped = {};
        investments.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const accountName = item.accountName || item.bankName || 'N/A';
            const accountNumber = item.accountNumber || '';
            const accountBranch = item.accountBranch || '';
            const key = `${accountName}||${accountNumber}||${accountBranch}`;

            if (!grouped[key]) {
                grouped[key] = { accountName, accountNumber, accountBranch, amount: 0 };
            }
            grouped[key].amount += getRemainingAmount(item);
        });
        return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    };

    // একই ধরনের গ্রুপিং — কিন্তু Income/Expense/Route Expense লিস্টের জন্য (সরাসরি amount যোগ হবে, কোনো adjustment নেই)
    const groupTransactionsByAccount = (list, category) => {
        const grouped = {};
        list.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const accountName = item.accountName || item.bankName || 'N/A';
            const accountNumber = item.accountNumber || '';
            const accountBranch = item.accountBranch || '';
            const key = `${accountName}||${accountNumber}||${accountBranch}`;

            if (!grouped[key]) {
                grouped[key] = { accountName, accountNumber, accountBranch, amount: 0 };
            }
            grouped[key].amount += Number(item.amount) || 0;
        });
        return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    };

    // ---- Account-wise Net Remaining Balance (Investment + Income - Expense - Route Expense), একই account key দিয়ে গ্রুপ করা ----
    const groupNetRemainingByAccount = (category) => {
        const grouped = {};

        const ensureKey = (item) => {
            const accountName = item.accountName || item.bankName || 'N/A';
            const accountNumber = item.accountNumber || '';
            const accountBranch = item.accountBranch || '';
            const key = `${accountName}||${accountNumber}||${accountBranch}`;
            if (!grouped[key]) {
                grouped[key] = { accountName, accountNumber, accountBranch, amount: 0 };
            }
            return key;
        };

        investments.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += getRemainingAmount(item);
        });

        incomes.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += Number(item.amount) || 0;
        });

        expenses.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount -= Number(item.amount) || 0;
        });

        routeExpenses.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount -= Number(item.amount) || 0;
        });

        // Transfer এর effect: source account থেকে minus, destination account এ plus
        const resolveTransferAccountItem = (type, label) => {
            if (label === 'Cash') {
                return investments.find(inv => getCategory(inv.accountType) === 'cash') || { accountName: 'Cash', accountNumber: '', accountBranch: '' };
            }
            return investments.find(inv => inv.accountType === type && getAccountLabel(inv) === label) || null;
        };

        transfers.forEach((item) => {
            const amount = Number(item.amount) || 0;

            if (getCategory(item.transferFrom) === category) {
                const accItem = resolveTransferAccountItem(item.transferFrom, item.fromAccount);
                if (accItem) {
                    const key = ensureKey(accItem);
                    grouped[key].amount -= amount;
                }
            }

            if (getCategory(item.transferTo) === category) {
                const accItem = resolveTransferAccountItem(item.transferTo, item.toAccount);
                if (accItem) {
                    const key = ensureKey(accItem);
                    grouped[key].amount += amount;
                }
            }
        });

               return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    };

    // ---- Transfer লিস্টের জন্য গ্রুপিং (Outgoing/Incoming, account wise) ----
    const groupTransferByAccount = (typeField, accountField, category) => {
        const grouped = {};
        transfers.forEach((item) => {
            if (getCategory(item[typeField]) !== category) return;
            const accountName = item[accountField] || item[typeField] || 'N/A';
            const key = accountName;

            if (!grouped[key]) {
                grouped[key] = { accountName, accountNumber: '', accountBranch: '', amount: 0 };
            }
            grouped[key].amount += Number(item.amount) || 0;
        });
        return Object.values(grouped).sort((a, b) => b.amount - a.amount);
    };

    // ---- Investment (Accounts tab) breakdown ----
    const cashAccounts = groupByAccount('cash');
    const mobileAccounts = groupByAccount('mobile');
    const bankAccounts = groupByAccount('bank');

    const sumOf = (accounts) => accounts.reduce((sum, acc) => sum + acc.amount, 0);

    const cashTotal = sumOf(cashAccounts);
    const mobileTotal = sumOf(mobileAccounts);
    const bankTotal = sumOf(bankAccounts);
    const grandTotal = cashTotal + mobileTotal + bankTotal;

    // ---- Income breakdown ----
    const incomeCashAccounts = groupTransactionsByAccount(incomes, 'cash');
    const incomeMobileAccounts = groupTransactionsByAccount(incomes, 'mobile');
    const incomeBankAccounts = groupTransactionsByAccount(incomes, 'bank');

    const incomeCashTotal = sumOf(incomeCashAccounts);
    const incomeMobileTotal = sumOf(incomeMobileAccounts);
    const incomeBankTotal = sumOf(incomeBankAccounts);
    const incomeGrandTotal = incomeCashTotal + incomeMobileTotal + incomeBankTotal;

    // ---- Expense breakdown ----
    const expenseCashAccounts = groupTransactionsByAccount(expenses, 'cash');
    const expenseMobileAccounts = groupTransactionsByAccount(expenses, 'mobile');
    const expenseBankAccounts = groupTransactionsByAccount(expenses, 'bank');

    const expenseCashTotal = sumOf(expenseCashAccounts);
    const expenseMobileTotal = sumOf(expenseMobileAccounts);
    const expenseBankTotal = sumOf(expenseBankAccounts);
    const expenseGrandTotal = expenseCashTotal + expenseMobileTotal + expenseBankTotal;

    // ---- Route Expense breakdown ----
    const routeExpenseCashAccounts = groupTransactionsByAccount(routeExpenses, 'cash');
    const routeExpenseMobileAccounts = groupTransactionsByAccount(routeExpenses, 'mobile');
    const routeExpenseBankAccounts = groupTransactionsByAccount(routeExpenses, 'bank');

    const routeExpenseCashTotal = sumOf(routeExpenseCashAccounts);
    const routeExpenseMobileTotal = sumOf(routeExpenseMobileAccounts);
    const routeExpenseBankTotal = sumOf(routeExpenseBankAccounts);
        const routeExpenseGrandTotal = routeExpenseCashTotal + routeExpenseMobileTotal + routeExpenseBankTotal;

    // ---- Transfer breakdown (Outgoing / Incoming) ----
    const transferOutCashAccounts = groupTransferByAccount('transferFrom', 'fromAccount', 'cash');
    const transferOutMobileAccounts = groupTransferByAccount('transferFrom', 'fromAccount', 'mobile');
    const transferOutBankAccounts = groupTransferByAccount('transferFrom', 'fromAccount', 'bank');

    const transferOutCashTotal = sumOf(transferOutCashAccounts);
    const transferOutMobileTotal = sumOf(transferOutMobileAccounts);
    const transferOutBankTotal = sumOf(transferOutBankAccounts);

    const transferInCashAccounts = groupTransferByAccount('transferTo', 'toAccount', 'cash');
    const transferInMobileAccounts = groupTransferByAccount('transferTo', 'toAccount', 'mobile');
    const transferInBankAccounts = groupTransferByAccount('transferTo', 'toAccount', 'bank');

    const transferInCashTotal = sumOf(transferInCashAccounts);
    const transferInMobileTotal = sumOf(transferInMobileAccounts);
    const transferInBankTotal = sumOf(transferInBankAccounts);

    const transferGrandTotal = transfers.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

    // ---- Total Remaining Balance = (Accounts + Income) - (Expense + Route Expense) ----
    const totalRemainingBalance =
        (grandTotal + incomeGrandTotal) - (expenseGrandTotal + routeExpenseGrandTotal);

    // ---- Account-wise Net Remaining Balance breakdown (Cash / Mobile Banking / Bank, প্রতিটা account আলাদা করে) ----
    const remainingCashAccounts = groupNetRemainingByAccount('cash');
    const remainingMobileAccounts = groupNetRemainingByAccount('mobile');
    const remainingBankAccounts = groupNetRemainingByAccount('bank');

    const remainingCashTotal = sumOf(remainingCashAccounts);
    const remainingMobileTotal = sumOf(remainingMobileAccounts);
    const remainingBankTotal = sumOf(remainingBankAccounts);

    const formatAmount = (amount) =>
        Number(amount || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });

    // সামারি কার্ড কম্পোনেন্ট
    const SummaryCard = ({ title, amount, icon, gradient, count }) => (
        <div className={`relative overflow-hidden rounded-3xl shadow-xl p-6 text-white ${gradient}`}>
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full"></div>
            <div className="absolute -right-2 -bottom-8 w-20 h-20 bg-white/10 rounded-full"></div>
            <div className="relative flex items-center justify-between mb-4">
                <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl">
                    {icon}
                </div>
                {count > 0 && (
                    <span className="text-[11px] font-semibold bg-white/20 px-2.5 py-1 rounded-full">
                        {count} Account{count > 1 ? 's' : ''}
                    </span>
                )}
            </div>
            <p className="relative text-sm font-medium text-white/80">{title}</p>
            <p className="relative text-2xl md:text-3xl font-extrabold mt-1 tracking-tight">
                ৳ {formatAmount(amount)}
            </p>
        </div>
    );

    // ডিটেইল লিস্ট প্যানেল (Mobile Banking / Bank / Cash ব্রেকডাউন)
    // dynamicColor = true দিলে প্রতিটা row এর amount পজিটিভ/নেগেটিভ অনুযায়ী রঙ বদলাবে (Account-wise Remaining Balance এর জন্য)
    const DetailPanel = ({ title, icon, accounts, total, accentColor, showNumberBranch, amountColor = 'text-emerald-600', dynamicColor = false }) => {
        if (accounts.length === 0) return null;
        return (
            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 md:p-7">
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md ${accentColor}`}>
                            {icon}
                        </div>
                        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
                    </div>
                    <span className={`text-sm font-bold ${dynamicColor ? (total < 0 ? 'text-rose-600' : 'text-gray-700') : 'text-gray-700'}`}>
                        ৳ {formatAmount(total)}
                    </span>
                </div>

                <div className="space-y-3">
                    {accounts.map((acc, idx) => (
                        <div
                            key={idx}
                            className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50/70 hover:bg-gray-100/80 transition duration-150 border border-gray-100"
                        >
                            <div className="min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{acc.accountName}</p>
                                {showNumberBranch && (acc.accountNumber || acc.accountBranch) && (
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-3 flex-wrap">
                                        {acc.accountNumber && (
                                            <span className="flex items-center gap-1">
                                                <FiHash className="w-3 h-3" /> {acc.accountNumber}
                                            </span>
                                        )}
                                        {acc.accountBranch && (
                                            <span className="flex items-center gap-1">
                                                <FiMapPin className="w-3 h-3" /> {acc.accountBranch}
                                            </span>
                                        )}
                                    </p>
                                )}
                            </div>
                            <p className={`font-extrabold whitespace-nowrap text-sm md:text-base ${dynamicColor ? (acc.amount < 0 ? 'text-rose-600' : 'text-emerald-600') : amountColor}`}>
                                ৳ {formatAmount(acc.amount)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
                <p className="text-gray-500 font-medium">Loading account balance...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Account Balance
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Live overview of Cash, Mobile Banking & Bank balances</p>
                    </div>
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full shadow-sm">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Updating
                    </span>
                </div>

                {/* Total Remaining Balance Hero = (Accounts + Income) - (Expense + Route Expense) - সবসময় ভিসিবল, রিফ্রেশ ছাড়াই আপডেট হয় */}
                <div className="relative overflow-hidden bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-700 rounded-3xl shadow-2xl p-8 text-white">
                    <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                    <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                    <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                <IoWalletOutline />
                            </div>
                            <div>
                                <p className="text-white/80 text-sm font-medium">Total Remaining Balance</p>
                                <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                    ৳ {formatAmount(totalRemainingBalance)}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm text-white/70 font-medium">
                            <span className="flex items-center gap-1.5">
                                <FiLayers className="w-3.5 h-3.5" /> Accounts: ৳ {formatAmount(grandTotal)}
                            </span>
                            <span className="flex items-center gap-1.5 text-emerald-300">
                                <FiTrendingUp className="w-3.5 h-3.5" /> + Income: ৳ {formatAmount(incomeGrandTotal)}
                            </span>
                            <span className="flex items-center gap-1.5 text-rose-300">
                                <FiTrendingDown className="w-3.5 h-3.5" /> - Expense: ৳ {formatAmount(expenseGrandTotal)}
                            </span>
                            <span className="flex items-center gap-1.5 text-rose-300">
                                <FaRoute className="w-3.5 h-3.5" /> - Route Expense: ৳ {formatAmount(routeExpenseGrandTotal)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ================= Account-wise Remaining Balance (Cash / Mobile Banking / Bank, প্রতিটা account আলাদা) ================= */}
                <div className="space-y-6">
                    

                    {/* Account-wise Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <SummaryCard
                            title="Remaining - Cash"
                            amount={remainingCashTotal}
                            count={remainingCashAccounts.length}
                            icon={<FiDollarSign />}
                            gradient="bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500"
                        />
                        <SummaryCard
                            title="Remaining - Mobile Banking"
                            amount={remainingMobileTotal}
                            count={remainingMobileAccounts.length}
                            icon={<FiSmartphone />}
                            gradient="bg-gradient-to-br from-violet-500 via-purple-500 to-indigo-600"
                        />
                        <SummaryCard
                            title="Remaining - Bank"
                            amount={remainingBankTotal}
                            count={remainingBankAccounts.length}
                            icon={<FiCreditCard />}
                            gradient="bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600"
                        />
                    </div>

                    {/* Account-wise Detail Breakdown (প্রতিটা account/bank/mobile banking provider আলাদা করে) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <DetailPanel
                            title="Cash Wise Remaining"
                            icon={<FiDollarSign />}
                            accounts={remainingCashAccounts}
                            total={remainingCashTotal}
                            accentColor="bg-gradient-to-tr from-fuchsia-500 via-pink-500 to-rose-500"
                            showNumberBranch={false}
                            dynamicColor
                        />
                        <DetailPanel
                            title="Mobile Banking Wise Remaining"
                            icon={<FiSmartphone />}
                            accounts={remainingMobileAccounts}
                            total={remainingMobileTotal}
                            accentColor="bg-gradient-to-tr from-violet-500 via-purple-500 to-indigo-600"
                            showNumberBranch
                            dynamicColor
                        />
                        <DetailPanel
                            title="Bank Wise Remaining"
                            icon={<FiCreditCard />}
                            accounts={remainingBankAccounts}
                            total={remainingBankTotal}
                            accentColor="bg-gradient-to-tr from-sky-500 via-blue-500 to-indigo-600"
                            showNumberBranch
                            dynamicColor
                        />
                    </div>

                    {remainingCashAccounts.length === 0 && remainingMobileAccounts.length === 0 && remainingBankAccounts.length === 0 && (
                        <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                            No account-wise remaining balance data found yet!
                        </div>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white p-2 flex flex-col sm:flex-row gap-2">
                    {TABS.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl font-bold text-sm transition duration-200 cursor-pointer ${activeTab === tab.key
                                    ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-200'
                                    : 'text-gray-500 hover:bg-gray-100'
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ================= Accounts Tab ================= */}
                {activeTab === 'accounts' && (
                    <div className="space-y-6">
                        {/* Accounts Sub Hero */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <IoWalletOutline />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Balance (All Accounts)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(grandTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingUp className="w-4 h-4" />
                                    {investments.length} total investment record{investments.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Summary Cards - Investment (Account Balance) */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Total Cash"
                                amount={cashTotal}
                                count={cashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                            />
                            <SummaryCard
                                title="Total Mobile Banking"
                                amount={mobileTotal}
                                count={mobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                            />
                            <SummaryCard
                                title="Total Bank"
                                amount={bankTotal}
                                count={bankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
                            />
                        </div>

                        {/* Detail Breakdown - Investment (Account Balance) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Accounts"
                                icon={<FiDollarSign />}
                                accounts={cashAccounts}
                                total={cashTotal}
                                accentColor="bg-gradient-to-tr from-emerald-500 to-teal-600"
                                showNumberBranch={false}
                            />
                            <DetailPanel
                                title="Mobile Banking Accounts"
                                icon={<FiSmartphone />}
                                accounts={mobileAccounts}
                                total={mobileTotal}
                                accentColor="bg-gradient-to-tr from-amber-500 to-orange-600"
                                showNumberBranch
                            />
                            <DetailPanel
                                title="Bank Accounts"
                                icon={<FiCreditCard />}
                                accounts={bankAccounts}
                                total={bankTotal}
                                accentColor="bg-gradient-to-tr from-indigo-500 to-blue-600"
                                showNumberBranch
                            />
                        </div>

                        {grandTotal === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No investment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Income Tab ================= */}
                {activeTab === 'income' && (
                    <div className="space-y-6">
                        {/* Income Sub Hero */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiTrendingUp />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Income (All Sources)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(incomeGrandTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingUp className="w-4 h-4" />
                                    {incomes.length} total income record{incomes.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Income Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Income - Cash"
                                amount={incomeCashTotal}
                                count={incomeCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                            />
                            <SummaryCard
                                title="Income - Mobile Banking"
                                amount={incomeMobileTotal}
                                count={incomeMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                            />
                            <SummaryCard
                                title="Income - Bank"
                                amount={incomeBankTotal}
                                count={incomeBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
                            />
                        </div>

                        {/* Income Detail Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Income"
                                icon={<FiDollarSign />}
                                accounts={incomeCashAccounts}
                                total={incomeCashTotal}
                                accentColor="bg-gradient-to-tr from-emerald-500 to-teal-600"
                                showNumberBranch={false}
                                amountColor="text-emerald-600"
                            />
                            <DetailPanel
                                title="Mobile Banking Income"
                                icon={<FiSmartphone />}
                                accounts={incomeMobileAccounts}
                                total={incomeMobileTotal}
                                accentColor="bg-gradient-to-tr from-amber-500 to-orange-600"
                                showNumberBranch
                                amountColor="text-emerald-600"
                            />
                            <DetailPanel
                                title="Bank Income"
                                icon={<FiCreditCard />}
                                accounts={incomeBankAccounts}
                                total={incomeBankTotal}
                                accentColor="bg-gradient-to-tr from-teal-500 to-cyan-600"
                                showNumberBranch
                                amountColor="text-emerald-600"
                            />
                        </div>

                        {incomeGrandTotal === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No income data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Expense Tab ================= */}
                {activeTab === 'expense' && (
                    <div className="space-y-6">
                        {/* Expense Sub Hero */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-orange-500 to-amber-500 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiTrendingDown />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Expense (All Sources)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(expenseGrandTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingDown className="w-4 h-4" />
                                    {expenses.length} total expense record{expenses.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Expense Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Expense - Cash"
                                amount={expenseCashTotal}
                                count={expenseCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-rose-500 to-red-600"
                            />
                            <SummaryCard
                                title="Expense - Mobile Banking"
                                amount={expenseMobileTotal}
                                count={expenseMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-orange-500 to-amber-600"
                            />
                            <SummaryCard
                                title="Expense - Bank"
                                amount={expenseBankTotal}
                                count={expenseBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-rose-600 to-orange-600"
                            />
                        </div>

                        {/* Expense Detail Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Expense"
                                icon={<FiDollarSign />}
                                accounts={expenseCashAccounts}
                                total={expenseCashTotal}
                                accentColor="bg-gradient-to-tr from-rose-500 to-red-600"
                                showNumberBranch={false}
                                amountColor="text-rose-600"
                            />
                            <DetailPanel
                                title="Mobile Banking Expense"
                                icon={<FiSmartphone />}
                                accounts={expenseMobileAccounts}
                                total={expenseMobileTotal}
                                accentColor="bg-gradient-to-tr from-orange-500 to-amber-600"
                                showNumberBranch
                                amountColor="text-rose-600"
                            />
                            <DetailPanel
                                title="Bank Expense"
                                icon={<FiCreditCard />}
                                accounts={expenseBankAccounts}
                                total={expenseBankTotal}
                                accentColor="bg-gradient-to-tr from-rose-600 to-orange-600"
                                showNumberBranch
                                amountColor="text-rose-600"
                            />
                        </div>

                        {expenseGrandTotal === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No expense data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Route Expense Tab ================= */}
                {activeTab === 'routeExpense' && (
                    <div className="space-y-6">
                        {/* Route Expense Sub Hero */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-sky-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FaRoute />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Route Expense (All Sources)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(routeExpenseGrandTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingDown className="w-4 h-4" />
                                    {routeExpenses.length} total route expense record{routeExpenses.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Route Expense Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Route Expense - Cash"
                                amount={routeExpenseCashTotal}
                                count={routeExpenseCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
                            />
                            <SummaryCard
                                title="Route Expense - Mobile Banking"
                                amount={routeExpenseMobileTotal}
                                count={routeExpenseMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-sky-500 to-blue-600"
                            />
                            <SummaryCard
                                title="Route Expense - Bank"
                                amount={routeExpenseBankTotal}
                                count={routeExpenseBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-blue-500 to-indigo-600"
                            />
                        </div>

                        {/* Route Expense Detail Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Route Expense"
                                icon={<FiDollarSign />}
                                accounts={routeExpenseCashAccounts}
                                total={routeExpenseCashTotal}
                                accentColor="bg-gradient-to-tr from-cyan-500 to-blue-600"
                                showNumberBranch={false}
                                amountColor="text-cyan-600"
                            />
                            <DetailPanel
                                title="Mobile Banking Route Expense"
                                icon={<FiSmartphone />}
                                accounts={routeExpenseMobileAccounts}
                                total={routeExpenseMobileTotal}
                                accentColor="bg-gradient-to-tr from-sky-500 to-blue-600"
                                showNumberBranch
                                amountColor="text-cyan-600"
                            />
                            <DetailPanel
                                title="Bank Route Expense"
                                icon={<FiCreditCard />}
                                accounts={routeExpenseBankAccounts}
                                total={routeExpenseBankTotal}
                                accentColor="bg-gradient-to-tr from-blue-500 to-indigo-600"
                                showNumberBranch
                                amountColor="text-cyan-600"
                            />
                        </div>

                                              {routeExpenseGrandTotal === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No route expense data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Transfer Tab ================= */}
                {activeTab === 'transfer' && (
                    <div className="space-y-6">
                        {/* Transfer Sub Hero */}
                        <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-lime-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiRepeat />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Transferred (All Accounts)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(transferGrandTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiRepeat className="w-4 h-4" />
                                    {transfers.length} total transfer record{transfers.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {/* Outgoing (Transfer From) Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-2 bg-rose-500 rounded-full"></span>
                                Outgoing (Transfer From)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <SummaryCard
                                    title="Outgoing - Cash"
                                    amount={transferOutCashTotal}
                                    count={transferOutCashAccounts.length}
                                    icon={<FiDollarSign />}
                                    gradient="bg-gradient-to-br from-rose-500 to-red-600"
                                />
                                <SummaryCard
                                    title="Outgoing - Mobile Banking"
                                    amount={transferOutMobileTotal}
                                    count={transferOutMobileAccounts.length}
                                    icon={<FiSmartphone />}
                                    gradient="bg-gradient-to-br from-orange-500 to-amber-600"
                                />
                                <SummaryCard
                                    title="Outgoing - Bank"
                                    amount={transferOutBankTotal}
                                    count={transferOutBankAccounts.length}
                                    icon={<FiCreditCard />}
                                    gradient="bg-gradient-to-br from-rose-600 to-orange-600"
                                />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <DetailPanel
                                    title="Cash - Outgoing"
                                    icon={<FiDollarSign />}
                                    accounts={transferOutCashAccounts}
                                    total={transferOutCashTotal}
                                    accentColor="bg-gradient-to-tr from-rose-500 to-red-600"
                                    showNumberBranch={false}
                                    amountColor="text-rose-600"
                                />
                                <DetailPanel
                                    title="Mobile Banking - Outgoing"
                                    icon={<FiSmartphone />}
                                    accounts={transferOutMobileAccounts}
                                    total={transferOutMobileTotal}
                                    accentColor="bg-gradient-to-tr from-orange-500 to-amber-600"
                                    showNumberBranch={false}
                                    amountColor="text-rose-600"
                                />
                                <DetailPanel
                                    title="Bank - Outgoing"
                                    icon={<FiCreditCard />}
                                    accounts={transferOutBankAccounts}
                                    total={transferOutBankTotal}
                                    accentColor="bg-gradient-to-tr from-rose-600 to-orange-600"
                                    showNumberBranch={false}
                                    amountColor="text-rose-600"
                                />
                            </div>
                        </div>

                        {/* Incoming (Transfer To) Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-extrabold text-gray-800 flex items-center gap-2">
                                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                Incoming (Transfer To)
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                                <SummaryCard
                                    title="Incoming - Cash"
                                    amount={transferInCashTotal}
                                    count={transferInCashAccounts.length}
                                    icon={<FiDollarSign />}
                                    gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                                />
                                <SummaryCard
                                    title="Incoming - Mobile Banking"
                                    amount={transferInMobileTotal}
                                    count={transferInMobileAccounts.length}
                                    icon={<FiSmartphone />}
                                    gradient="bg-gradient-to-br from-teal-500 to-lime-600"
                                />
                                <SummaryCard
                                    title="Incoming - Bank"
                                    amount={transferInBankTotal}
                                    count={transferInBankAccounts.length}
                                    icon={<FiCreditCard />}
                                    gradient="bg-gradient-to-br from-lime-500 to-emerald-600"
                                />
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <DetailPanel
                                    title="Cash - Incoming"
                                    icon={<FiDollarSign />}
                                    accounts={transferInCashAccounts}
                                    total={transferInCashTotal}
                                    accentColor="bg-gradient-to-tr from-emerald-500 to-teal-600"
                                    showNumberBranch={false}
                                    amountColor="text-emerald-600"
                                />
                                <DetailPanel
                                    title="Mobile Banking - Incoming"
                                    icon={<FiSmartphone />}
                                    accounts={transferInMobileAccounts}
                                    total={transferInMobileTotal}
                                    accentColor="bg-gradient-to-tr from-teal-500 to-lime-600"
                                    showNumberBranch={false}
                                    amountColor="text-emerald-600"
                                />
                                <DetailPanel
                                    title="Bank - Incoming"
                                    icon={<FiCreditCard />}
                                    accounts={transferInBankAccounts}
                                    total={transferInBankTotal}
                                    accentColor="bg-gradient-to-tr from-lime-500 to-emerald-600"
                                    showNumberBranch={false}
                                    amountColor="text-emerald-600"
                                />
                            </div>
                        </div>

                        {transferGrandTotal === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No transfer data found yet!
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default AccountBalance;