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
    FiRepeat,
    FiArrowRight,
    FiBell,
    FiX
} from 'react-icons/fi';
import { FaRoute } from 'react-icons/fa';
import { IoWalletOutline } from 'react-icons/io5';
import Swal from 'sweetalert2';

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

    const loadStoredIds = (key) => {
        try {
            const saved = localStorage.getItem(key);
            if (!saved) return null;
            const arr = JSON.parse(saved);
            return Array.isArray(arr) ? new Set(arr) : null;
        } catch {
            return null;
        }
    };

    const prevInvestmentIds = useRef(loadStoredIds('prevInvestmentIds'));
    const prevIncomeIds = useRef(loadStoredIds('prevIncomeIds'));
    const prevExpenseIds = useRef(loadStoredIds('prevExpenseIds'));
    const prevRouteExpenseIds = useRef(loadStoredIds('prevRouteExpenseIds'));
    const prevTransferIds = useRef(loadStoredIds('prevTransferIds'));
    const prevAdjustmentIds = useRef(loadStoredIds('prevAdjustmentIds'));
    const MAX_NOTIFICATIONS = 20;
    const NOTIF_STORAGE_KEY = 'accountBalanceNotifications';

    const [notifications, setNotifications] = useState(() => {
        try {
            const saved = localStorage.getItem(NOTIF_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifVisible, setNotifVisible] = useState(false);

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

            const safeInv = Array.isArray(invData) ? invData : [];
            const safeAdj = Array.isArray(adjData) ? adjData : [];
            const safeIncome = Array.isArray(incomeData) ? incomeData : [];
            const safeExpense = Array.isArray(expenseData) ? expenseData : [];
            const safeRouteExpense = Array.isArray(routeExpenseData) ? routeExpenseData : [];
            const safeTransfer = Array.isArray(transferData) ? transferData : [];

            // ---- Notification detection: notun kono record ashle notification banano ----
            const detectNewItems = (list, prevIdsRef, storageKey) => {
                const currentIds = new Set(list.map((i) => i._id));
                let newItems = [];
                if (prevIdsRef.current !== null) {
                    newItems = list.filter((i) => i._id && !prevIdsRef.current.has(i._id));
                }
                prevIdsRef.current = currentIds;
                try {
                    localStorage.setItem(storageKey, JSON.stringify(Array.from(currentIds)));
                } catch (error) {
                    console.error('Error saving ids to localStorage:', error);
                }
                return newItems;
            };

            const getAccName = (item) => item.accountName || item.bankName || 'Cash';

            const newInvestments = detectNewItems(safeInv, prevInvestmentIds, 'prevInvestmentIds');
            const newAdjustments = detectNewItems(safeAdj, prevAdjustmentIds, 'prevAdjustmentIds');
            const newIncomes = detectNewItems(safeIncome, prevIncomeIds, 'prevIncomeIds');
            const newExpenses = detectNewItems(safeExpense, prevExpenseIds, 'prevExpenseIds');
            const newRouteExpenses = detectNewItems(safeRouteExpense, prevRouteExpenseIds, 'prevRouteExpenseIds');
            const newTransfers = detectNewItems(safeTransfer, prevTransferIds, 'prevTransferIds');

            const newNotifs = [
                ...newInvestments.map((item) => ({
                    id: `accounts-${item._id}-${Date.now()}-${Math.random()}`,
                    tab: 'Account',
                    accountName: getAccName(item),
                    amount: Number(item.amount) || 0,
                    isPositive: true,
                    isTransfer: false,
                    read: false,
                    time: new Date(),
                })),
                ...newAdjustments.map((item) => {
                    const relatedInv = safeInv.find((inv) => inv._id === item.adjustmentID);
                    return {
                        id: `adjustment-${item._id}-${Date.now()}-${Math.random()}`,
                        tab: 'Adjustment',
                        accountName: relatedInv ? getAccName(relatedInv) : 'Cash',
                        amount: Number(item.amount) || 0,
                        isPositive: item.mode === 'Deposit',
                        isTransfer: false,
                        read: false,
                        time: new Date(),
                    };
                }),
                ...newIncomes.map((item) => ({
                    id: `income-${item._id}-${Date.now()}-${Math.random()}`,
                    tab: 'Income',
                    accountName: getAccName(item),
                    amount: Number(item.amount) || 0,
                    isPositive: true,
                    isTransfer: false,
                    read: false,
                    time: new Date(),
                })),
                ...newExpenses.map((item) => ({
                    id: `expense-${item._id}-${Date.now()}-${Math.random()}`,
                    tab: 'Expense',
                    accountName: getAccName(item),
                    amount: Number(item.amount) || 0,
                    isPositive: false,
                    isTransfer: false,
                    read: false,
                    time: new Date(),
                })),
                ...newRouteExpenses.map((item) => ({
                    id: `routeExpense-${item._id}-${Date.now()}-${Math.random()}`,
                    tab: 'Route Expense',
                    accountName: getAccName(item),
                    amount: Number(item.amount) || 0,
                    isPositive: false,
                    isTransfer: false,
                    read: false,
                    time: new Date(),
                })),
                ...newTransfers.map((item) => ({
                    id: `transfer-${item._id}-${Date.now()}-${Math.random()}`,
                    tab: 'Transfer',
                    fromLabel: item.fromAccount || item.transferFrom || 'Cash',
                    toLabel: item.toAccount || item.transferTo || 'Cash',
                    amount: Number(item.amount) || 0,
                    isTransfer: true,
                    read: false,
                    time: new Date(),
                })),
            ];

            if (newNotifs.length > 0) {
                setNotifications((prev) => [...newNotifs, ...prev].slice(0, MAX_NOTIFICATIONS));
            }

            setInvestments(safeInv);
            setAdjustments(safeAdj);
            setIncomes(safeIncome);
            setExpenses(safeExpense);
            setRouteExpenses(safeRouteExpense);
            setTransfers(safeTransfer);
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

    // ---- notifications localStorage a save kora (max 50 ta, page refresh a jate na hariye jai) ----
    useEffect(() => {
        try {
            localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifications));
        } catch (error) {
            console.error('Error saving notifications to localStorage:', error);
        }
    }, [notifications]);

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
            const accountName = item.accountName || item.bankName || 'Cash';
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
            const accountName = item.accountName || item.bankName || 'Cash';
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
            const accountName = item.accountName || item.bankName || 'Cash';
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

    const transferGrandTotal = transfers.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    // ---- Flow Data: kon account theke kon account e koto taka gese ----

    const getFlowData = () => {

        const pairs = {};

        const fromNodesMap = {};

        const toNodesMap = {};

        transfers.forEach((item) => {

            const fromLabel = item.fromAccount || item.transferFrom || 'Cash';

            const toLabel = item.toAccount || item.transferTo || 'Cash';

            const amount = Number(item.amount) || 0;

            const fromKey = `${item.transferFrom || 'Others'}::${fromLabel}`;

            const toKey = `${item.transferTo || 'Others'}::${toLabel}`;

            const pairKey = `${fromKey}=>${toKey}`;

            if (!pairs[pairKey]) {

                pairs[pairKey] = { fromKey, toKey, fromLabel, toLabel, amount: 0 };

            }

            pairs[pairKey].amount += amount;

            if (!fromNodesMap[fromKey]) fromNodesMap[fromKey] = { key: fromKey, label: fromLabel, total: 0 };

            fromNodesMap[fromKey].total += amount;

            if (!toNodesMap[toKey]) toNodesMap[toKey] = { key: toKey, label: toLabel, total: 0 };

            toNodesMap[toKey].total += amount;

        });

        return {

            pairs: Object.values(pairs).sort((a, b) => b.amount - a.amount),

            fromNodes: Object.values(fromNodesMap).sort((a, b) => b.total - a.total),

            toNodes: Object.values(toNodesMap).sort((a, b) => b.total - a.total),

        };

    };

    const flowData = getFlowData();

    const flowColors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6', '#ef4444', '#14b8a6', '#84cc16', '#f97316'];

    // ---- Notification Bell er jonno unread count ----
    const unreadCount = notifications.filter((n) => !n.read).length;

    const openNotifications = () => {
        setShowNotifications(true);
        setTimeout(() => setNotifVisible(true), 10);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    };

    const closeNotifications = () => {
        setNotifVisible(false);
        setTimeout(() => setShowNotifications(false), 250);
    };

   const clearNotifications = () => {
    Swal.fire({
        title: 'Clear all notifications?',
        text: 'All notifications will be permanently removed.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, clear them',
        cancelButtonText: 'Cancel',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
    }).then((result) => {
        if (result.isConfirmed) {
            setNotifications([]);

            try {
                localStorage.removeItem(NOTIF_STORAGE_KEY);

                Swal.fire({
                    title: 'Cleared!',
                    text: 'All notifications have been removed.',
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error(
                    'Error clearing notifications from localStorage:',
                    error
                );
            }
        }
    });
};

    const formatNotifTime = (date) => {
        try {
            return new Date(date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
        } catch {
            return '';
        }
    };

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


    // Flow Diagram Component
    const FlowDiagram = ({ fromNodes, toNodes, pairs }) => {
        if (pairs.length === 0) {
            return (
                <div className="text-center py-10 text-gray-400 font-medium text-sm">No transfer flow to show!</div>
            );
        }

        const svgWidth = 640;
        const nodeCount = Math.max(fromNodes.length, toNodes.length, 1);
        const svgHeight = Math.max(220, nodeCount * 62 + 50);
        const leftX = 140;
        const rightX = svgWidth - 140;
        const maxAmount = Math.max(...pairs.map((p) => p.amount), 1);

        const getY = (index, total) => {
            if (total <= 1) return svgHeight / 2;
            const usableHeight = svgHeight - 60;
            return 30 + (usableHeight / (total - 1)) * index;
        };

        const fromYMap = {};
        fromNodes.forEach((node, i) => {
            fromYMap[node.key] = getY(i, fromNodes.length);
        });

        const toYMap = {};
        toNodes.forEach((node, i) => {
            toYMap[node.key] = getY(i, toNodes.length);
        });

        return (
            <div className="overflow-x-auto">
                <svg
                    viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                    width="100%"
                    height={svgHeight}
                    style={{ overflow: 'visible', minWidth: '520px' }}
                >
                    {pairs.map((pair, idx) => {
                        const fromY = fromYMap[pair.fromKey];
                        const toY = toYMap[pair.toKey];
                        const strokeWidth = 2 + (pair.amount / maxAmount) * 8;
                        const color = flowColors[idx % flowColors.length];
                        const path = `M ${leftX} ${fromY} C ${leftX + 130} ${fromY}, ${rightX - 130} ${toY}, ${rightX} ${toY}`;
                        return (
                            <path
                                key={idx}
                                d={path}
                                fill="none"
                                stroke={color}
                                strokeWidth={strokeWidth}
                                strokeOpacity="0.55"
                                strokeLinecap="round"
                            >
                                <title>{`${pair.fromLabel} → ${pair.toLabel}: ৳${pair.amount.toLocaleString()}`}</title>
                            </path>
                        );
                    })}

                    {fromNodes.map((node, i) => {
                        const y = getY(i, fromNodes.length);
                        return (
                            <g key={node.key}>
                                <circle cx={leftX} cy={y} r="5" fill="#4f46e5" />
                                <foreignObject x={leftX - 145} y={y - 25} width="135" height="55">
                                    <div className="text-right leading-tight">
                                        {node.label.split(' - ').map((part, index) => (
                                            <div
                                                key={index}
                                                className={index === 0 ? "font-bold text-gray-700 text-[11px]" : "text-[10px] text-gray-500"}
                                            >
                                                {index === 0 ? part : `(${part})`}
                                            </div>
                                        ))}
                                    </div>
                                </foreignObject>
                                <text x={leftX - 12} y={y + 10} textAnchor="end" fontSize="9" fill="#9ca3af">
                                    ৳{node.total.toLocaleString()}
                                </text>
                            </g>
                        );
                    })}

                    {toNodes.map((node, i) => {
                        const y = getY(i, toNodes.length);
                        return (
                            <g key={node.key}>
                                <circle cx={rightX} cy={y} r="5" fill="#db2777" />
                                <foreignObject x={rightX + 12} y={y - 25} width="135" height="55">
                                    <div className="text-left leading-tight">
                                        {node.label.split(' - ').map((part, index) => (
                                            <div
                                                key={index}
                                                className={index === 0 ? "font-bold text-gray-700 text-[11px]" : "text-[10px] text-gray-500"}
                                            >
                                                {index === 0 ? part : `(${part})`}
                                            </div>
                                        ))}
                                    </div>
                                </foreignObject>
                                <text x={rightX + 12} y={y + 10} textAnchor="start" fontSize="9" fill="#9ca3af">
                                    ৳{node.total.toLocaleString()}
                                </text>
                            </g>
                        );
                    })}
                </svg>
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Notifications Modal */}
            {showNotifications && (
                <div
                    className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${notifVisible ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
                    onClick={closeNotifications}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-white overflow-hidden transform transition-all duration-300 ${notifVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                    >
                        <div className="bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Notifications</h3>
                                <p className="text-indigo-100 text-xs mt-0.5">সাম্প্রতিক সব transaction ও update এর তালিকা</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearNotifications}
                                        className="px-3 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-semibold rounded-xl transition duration-200 cursor-pointer"
                                    >
                                        Clear Notification
                                    </button>
                                )}
                                <button
                                    onClick={closeNotifications}
                                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition duration-200 cursor-pointer"
                                >
                                    <FiX className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="text-center py-10 text-gray-400 font-medium text-sm">No notifications yet!</div>
                            ) : (
                                notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className="grid grid-cols-3 items-start gap-3 p-4 rounded-2xl bg-gray-50/70 border border-gray-100"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-wide">{n.tab}</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">{formatNotifTime(n.time)}</p>
                                        </div>
                                        {n.isTransfer ? (
                                            <div className="min-w-0 text-xs font-semibold text-gray-700 space-y-1">
                                                <div className="truncate">{n.fromLabel}</div>
                                                <FiArrowRight className="w-3 h-3 text-gray-400 rotate-90" />
                                                <div className="truncate">{n.toLabel}</div>
                                            </div>
                                        ) : (
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-800 text-sm truncate">{n.accountName}</p>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            {n.isTransfer ? (
                                                <span className="font-extrabold text-indigo-700 text-sm whitespace-nowrap">৳ {n.amount.toLocaleString()}</span>
                                            ) : (
                                                <span className={`font-extrabold text-sm whitespace-nowrap ${n.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {n.isPositive ? '+' : '-'}৳ {n.amount.toLocaleString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Account Balance
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Live overview of Cash, Mobile Banking & Bank balances</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={openNotifications}
                            className="relative w-11 h-11 flex items-center justify-center bg-white border border-gray-100 text-indigo-600 rounded-2xl shadow-sm hover:bg-indigo-50 transition duration-200 cursor-pointer"
                            title="Notifications"
                        >
                            <FiBell className="w-5 h-5" />
                            {unreadCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full shadow-md">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                        <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full shadow-sm">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            Live Updating
                        </span>
                    </div>
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

                        {/* Flow Diagram Section */}
                        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 md:p-7">
                            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                Transfer Flow Diagram
                            </p>
                            <div className="bg-gray-50/70 rounded-2xl border border-gray-100 p-4">
                                <FlowDiagram
                                    fromNodes={flowData.fromNodes}
                                    toNodes={flowData.toNodes}
                                    pairs={flowData.pairs}
                                />
                            </div>
                        </div>

                        {/* Flow List Section (exact from -> to amount) */}
                        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 md:p-7">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full"></span>
                                Flow List (Exact Amount)
                            </p>
                            {flowData.pairs.length === 0 ? (
                                <div className="text-center py-6 text-gray-400 font-medium text-sm">No data to show!</div>
                            ) : (
                                <div className="space-y-2">
                                    {flowData.pairs.map((pair, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-gray-50/70 border border-gray-100 text-xs"
                                        >
                                            <div className="flex items-center gap-2 min-w-0 font-semibold text-gray-700">
                                                <span
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: flowColors[idx % flowColors.length] }}
                                                ></span>
                                                <span className="truncate">{pair.fromLabel}</span>
                                                <FiArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{pair.toLabel}</span>
                                            </div>
                                            <span className="font-bold text-indigo-700 whitespace-nowrap">
                                                ৳ {pair.amount.toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
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
