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
    FiShoppingCart,
    FiShoppingBag,
    FiChevronDown,
    FiX,
    FiRotateCcw
} from 'react-icons/fi';
import { FaRoute } from 'react-icons/fa';
import { IoWalletOutline } from 'react-icons/io5';
import { getBatchCostPerPcs } from '../Inventory/Stock/StockPurchase';

// প্রতি কত সেকেন্ড পর পর ডাটা অটো-রিফ্রেশ হবে (পেজ রিলোড ছাড়াই)
const POLL_INTERVAL = 5000;

// ৪টা ট্যাব কনফিগ (Accounts ডিফল্ট)
// Parent tab গুলো — নতুন parent tab যোগ করতে এখানে নতুন object দিন
const TABS = [
    {
        key: 'accounts',
        label: 'Accounts',
        icon: <FiLayers className="w-4 h-4" />,
        children: [
            { key: 'accounts', label: 'Accounts', icon: <FiLayers className="w-3.5 h-3.5" /> },
            { key: 'income', label: 'Income', icon: <FiArrowUpCircle className="w-3.5 h-3.5" /> },
            { key: 'expense', label: 'Expense', icon: <FiArrowDownCircle className="w-3.5 h-3.5" /> },
            { key: 'routeExpense', label: 'Route Expense', icon: <FaRoute className="w-3.5 h-3.5" /> },
            { key: 'transfer', label: 'Transfer', icon: <FiRepeat className="w-3.5 h-3.5" /> },
        ],
    },
    {
        key: 'purchaseParent',
        label: 'Purchase',
        icon: <FiShoppingCart className="w-4 h-4" />,
        children: [
            { key: 'purchase', label: 'Purchase', icon: <FiShoppingCart className="w-3.5 h-3.5" /> },
            { key: 'purchaseReturn', label: 'Purchase Return', icon: <FiRotateCcw className="w-3.5 h-3.5" /> },
            { key: 'purchaseBulkReturn', label: 'Bulk Return', icon: <FiLayers className="w-3.5 h-3.5" /> },
            { key: 'purchaseDamageReturn', label: 'Damage Return', icon: <FiLayers className="w-3.5 h-3.5" /> },
            { key: 'purchaseDue', label: 'Due Payment', icon: <FiCreditCard className="w-3.5 h-3.5" /> },
        ],
    },
    {
        key: 'salesParent',
        label: 'Sales',
        icon: <FiShoppingBag className="w-4 h-4" />,
        children: [
            { key: 'sales', label: 'Wholesale', icon: <FiShoppingBag className="w-3.5 h-3.5" /> },
            { key: 'salesReturn', label: 'Sales Return', icon: <FiRotateCcw className="w-3.5 h-3.5" /> },
            { key: 'salesBulkReturn', label: 'Sales Bulk Return', icon: <FiLayers className="w-3.5 h-3.5" /> },
            { key: 'salesDamageReturn', label: 'Sales Damage Return', icon: <FiLayers className="w-3.5 h-3.5" /> },
            { key: 'salesDue', label: 'Due Payment', icon: <FiCreditCard className="w-3.5 h-3.5" /> },
        ],
    },
];

// ---------- Shared account balance (PurchaseAdd o eta use kore) ----------
const ACC_BAL_API = 'http://localhost:5000';
const accBalSafe = (url) =>
    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

const accBalCategory = (t = '') => {
    const type = String(t).toLowerCase();
    if (type.includes('cash')) return 'cash';
    if (type.includes('mobile')) return 'mobile';
    if (type.includes('bank')) return 'bank';
    return 'others';
};

const accBalKeyOf = (i = {}) =>
    `${i.accountName || i.bankName || 'Cash'}||${i.accountNumber || ''}||${i.accountBranch || ''}`;

const accBalLabelOf = (acc) => {
    if (acc.accountType === 'Cash') return 'Cash';
    if (acc.accountType === 'Mobile Banking') return `${acc.accountName} (${acc.accountNumber})`;
    if (acc.accountType === 'Bank') return `${acc.bankName} - ${acc.accountNumber} (${acc.accountBranch || 'Main'})`;
    return acc.accountNumber || acc.accountType;
};

// ---------- Purchase Bulk Return helpers (profit / loss + payment) ----------
const accBalR2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Purchase Due Payment: Get = account e taka ashe (+), Pay = account theke taka jay (-)
const accBalIsGetDue = (p) =>
    p?.type === 'Get' || p?.status === 'Get' || p?.paymentAccount?.dueType === 'Get';

// Sales Due Payment: Get = customer theke nilam (account e plus), Pay = customer ke dilam (account theke minus)
const accBalIsPaySalesDue = (p) =>
    p?.type === 'Pay' || p?.status === 'Pay' || p?.paymentAccount?.dueType === 'Pay';

export const buildBatchCostMap = (stockBatches = [], purchases = []) => {
    const pMap = new Map((purchases || []).map((p) => [String(p._id), p]));
    return new Map(
        (stockBatches || []).map((b) => [
            String(b._id),
            getBatchCostPerPcs(b, pMap.get(String(b.purchaseId))),
        ])
    );
};

// Bulk return e payment enable thakle: account e ashbe = payment + profit (ba - loss)
export const getBulkReturnEffect = (row, batchCostMap) => {
    const pay = row?.payment;
    const paid = pay && Number(pay.amount) > 0 && pay.method ? Number(pay.amount) : 0;
    if (!paid) return null;

    let stockTotal = 0;
    let bulkTotal = 0;
    (row.items || []).forEach((it) => {
        const qty = Number(it.totalPcs) || 0;
        if (qty <= 0) return;
        const allocs = (row.stockAllocations || []).filter((a) => {
            const kind = a.kind || (a.pool === 'paid' ? 'main' : 'free');
            return String(a.productId) === String(it.productId) && kind === 'main';
        });
        stockTotal += allocs.reduce(
            (s, a) => s + (batchCostMap.get(String(a.batchId)) || 0) * (Number(a.qty) || 0),
            0
        );
        bulkTotal += (Number(it.buyPrice) || 0) * qty;
    });

    // Bulk Cost beshi = Profit, Stock Cost beshi = Loss
    const profit = accBalR2(bulkTotal - stockTotal);
    return { paid: accBalR2(paid), profit, total: accBalR2(paid + profit) };
};

// Damage Return (stock theke company k return) e payment enable thakle: account e ashbe = payment + profit (ba - loss)
// Customer theke ashা damage (est flag) e profit/loss hisab hobe na
export const getDamageReturnEffect = (row) => {
    const pay = row?.payment;
    const paid = pay && Number(pay.amount) > 0 && pay.method ? Number(pay.amount) : 0;
    if (!paid) {
        // Payment nai, kintu Approved hole shudhu stock theke asha product er profit/loss hisab hobe
        if (row?.status !== 'Approved') return null;
        let p = 0;
        (row.items || []).forEach((it) => {
            const bp = Number(it.buyPrice) || 0;
            (it.costBreakdown || []).forEach((l) => {
                if (l.est) return;
                const q = Number(l.qty) || 0;
                p += bp * q - (Number(l.amount) || 0);
            });
        });
        p = accBalR2(p);
        if (!p) return null;
        return { paid: 0, profit: p, total: p, noAccount: true };
    }
    let profit = 0;
    (row.items || []).forEach((it) => {
        const bp = Number(it.buyPrice) || 0;
        (it.costBreakdown || []).forEach((l) => {
            if (l.est) return;
            const q = Number(l.qty) || 0;
            profit += bp * q - (Number(l.amount) || 0);
        });
    });
    profit = accBalR2(profit);
    return { paid: accBalR2(paid), profit, total: accBalR2(paid + profit) };
};

// Fresh data fetch kore, nirdishto account e ekhon koto taka ache ta dey
// paymentAccount = { bankName, accountNumber, accountBranch } / { accountName, accountNumber } / { accountName: 'Cash' }
export const fetchAccountBalance = async (paymentAccount, excludePurchaseId = null, excludeSaleId = null) => {
    const [inv, adj, inc, exp, rexp, tr, pur, bulk, stk, dmgRet, dueP, salesList, salesBulkList, salesDmgList, salesDueList] = await Promise.all([
        accBalSafe(`${ACC_BAL_API}/investment`),
        accBalSafe(`${ACC_BAL_API}/adjustment`),
        accBalSafe(`${ACC_BAL_API}/income`),
        accBalSafe(`${ACC_BAL_API}/expense`),
        accBalSafe(`${ACC_BAL_API}/routeExpense`),
        accBalSafe(`${ACC_BAL_API}/transfer`),
        accBalSafe(`${ACC_BAL_API}/purchase`),
        accBalSafe(`${ACC_BAL_API}/purchase-bulk-return`),
        accBalSafe(`${ACC_BAL_API}/stock-purchase`),
        accBalSafe(`${ACC_BAL_API}/damage-return`),
        accBalSafe(`${ACC_BAL_API}/purchase-due-payment`),
        accBalSafe(`${ACC_BAL_API}/sales`),
        accBalSafe(`${ACC_BAL_API}/sales-bulk-return`),
        accBalSafe(`${ACC_BAL_API}/sales-damage`),
        accBalSafe(`${ACC_BAL_API}/sales-due-payment`),
    ]);

    const target = accBalKeyOf(paymentAccount || {});
    let bal = 0;

    inv.forEach((i) => {
        if (accBalKeyOf(i) !== target) return;
        const rel = adj.filter((a) => a.adjustmentID === i._id);
        const dep = rel.filter((a) => a.mode === 'Deposit').reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const wd = rel.filter((a) => a.mode === 'Withdraw').reduce((s, a) => s + (Number(a.amount) || 0), 0);
        bal += (Number(i.amount) || 0) + dep - wd;
    });

    inc.forEach((i) => { if (accBalKeyOf(i) === target) bal += Number(i.amount) || 0; });
    exp.forEach((i) => { if (accBalKeyOf(i) === target) bal -= Number(i.amount) || 0; });
    rexp.forEach((i) => { if (accBalKeyOf(i) === target) bal -= Number(i.amount) || 0; });

    const resolve = (type, label) => {
        if (label === 'Cash') {
            const c = inv.find((x) => accBalCategory(x.accountType) === 'cash');
            return c ? accBalKeyOf(c) : 'Cash||||';
        }
        const a = inv.find((x) => x.accountType === type && accBalLabelOf(x) === label);
        return a ? accBalKeyOf(a) : null;
    };
    tr.forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (resolve(t.transferFrom, t.fromAccount) === target) bal -= amt;
        if (resolve(t.transferTo, t.toAccount) === target) bal += amt;
    });

    pur.forEach((p) => {
        (p.returnHistory || []).forEach((ret) => {
            const rp = ret.payment;
            if (!rp || !(Number(rp.amount) > 0) || !rp.method) return;
            if (accBalKeyOf(rp.account || {}) !== target) return;
            bal += Number(rp.amount) || 0;
        });
        if (excludePurchaseId && String(p._id) === String(excludePurchaseId)) return;
        const paid = Number(p.paidAmount) || 0;
        if (!(paid > 0) || !p.paymentMethod) return;
        if (accBalKeyOf(p.paymentAccount || {}) !== target) return;
        bal += (Number(p.payableAmount) || 0) < 0 ? paid : -paid;
    });

    const costMap = buildBatchCostMap(stk, pur);
    bulk.forEach((r) => {
        const eff = getBulkReturnEffect(r, costMap);
        if (!eff) return;
        if (accBalKeyOf(r.payment.account || {}) !== target) return;
        bal += eff.total;
    });

    dmgRet.forEach((r) => {
        const eff = getDamageReturnEffect(r);
        if (!eff || eff.noAccount) return;
        if (accBalKeyOf(r.payment.account || {}) !== target) return;
        bal += eff.total;
    });

    dueP.forEach((p) => {
        const amt = Number(p.amount) || 0;
        if (!(amt > 0) || !p.paymentMethod) return;
        if (accBalKeyOf(p.paymentAccount || {}) !== target) return;
        bal += accBalIsGetDue(p) ? amt : -amt;
    });

    // Sales (Wholesale): customer dile account e ashe, payable negative hole account theke jay
    salesList.forEach((s) => {
        if (excludeSaleId && String(s._id) === String(excludeSaleId)) return;
        if (s.status !== 'Delivered') return;
        const paid = Number(s.paidAmount) || 0;
        if (!(paid > 0) || !s.paymentMethod) return;
        if (accBalKeyOf(s.paymentAccount || {}) !== target) return;
        bal += (Number(s.payableAmount) || 0) < 0 ? -paid : paid;
    });

    // Sales Return payment: customer ke return er taka dile account theke jay
    salesList.forEach((s) => {
        (s.returnHistory || []).forEach((ret) => {
            const rp = ret.payment;
            if (!rp || !(Number(rp.amount) > 0) || !rp.method) return;
            if (accBalKeyOf(rp.account || {}) !== target) return;
            bal -= Number(rp.amount) || 0;
        });
    });

    // Sales Bulk Return payment: customer ke taka dile account theke jay
    salesBulkList.forEach((r) => {
        const rp = r.payment;
        if (!rp || !(Number(rp.amount) > 0) || !rp.method) return;
        if (accBalKeyOf(rp.account || {}) !== target) return;
        bal -= Number(rp.amount) || 0;
    });

    // Sales Damage (customer er damage) payment: customer ke taka dile account theke jay
    salesDmgList.forEach((d) => {
        if (!d.customerId) return;
        const rp = d.payment;
        if (!rp || !(Number(rp.amount) > 0) || !rp.method) return;
        if (accBalKeyOf(rp.account || {}) !== target) return;
        bal -= Number(rp.amount) || 0;
    });
    // Sales Due Payment: Get = account e plus, Pay = account theke minus
    salesDueList.forEach((p) => {
        const amt = Number(p.amount) || 0;
        if (!(amt > 0) || !p.paymentMethod) return;
        if (accBalKeyOf(p.paymentAccount || {}) !== target) return;
        bal += accBalIsPaySalesDue(p) ? -amt : amt;
    });

    return Math.round(bal * 100) / 100;
};

const AccountBalance = () => {
    const [investments, setInvestments] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [expenses, setExpenses] = useState([]);
    const [routeExpenses, setRouteExpenses] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [purchasePays, setPurchasePays] = useState([]);
    const [returnPays, setReturnPays] = useState([]);
    const [bulkPays, setBulkPays] = useState([]);
    const [dmgPays, setDmgPays] = useState([]);
    const [dmgAdjPays, setDmgAdjPays] = useState([]);
    const [duePays, setDuePays] = useState([]);
    const [salesPays, setSalesPays] = useState([]);
    const [salesReturnPays, setSalesReturnPays] = useState([]);
    const [salesBulkPays, setSalesBulkPays] = useState([]);
    const [salesDmgPays, setSalesDmgPays] = useState([]);
    const [salesDuePays, setSalesDuePays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('accounts');
    const [activeParent, setActiveParent] = useState(null);
    const isFirstLoad = useRef(true);

    const [seenTime, setSeenTime] = useState(() => {
        try {
            return Number(localStorage.getItem('notifSeenTime')) || 0;
        } catch {
            return 0;
        }
    });
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifVisible, setNotifVisible] = useState(false);

    // Investment + Adjustment + Income + Expense + Route Expense ডাটা fetch করা (silent background refresh সাপোর্ট করে)
    const fetchAllData = useCallback(async () => {
        try {
            const [invRes, adjRes, incomeRes, expenseRes, routeExpenseRes, purchaseRes, transferRes, bulkRes, stockRes, dmgRes] = await Promise.all([
                fetch('http://localhost:5000/investment'),
                fetch('http://localhost:5000/adjustment'),
                fetch('http://localhost:5000/income'),
                fetch('http://localhost:5000/expense'),
                fetch('http://localhost:5000/routeExpense'),
                fetch('http://localhost:5000/purchase'),
                fetch('http://localhost:5000/transfer'),
                fetch('http://localhost:5000/purchase-bulk-return'),
                fetch('http://localhost:5000/stock-purchase'),
                fetch('http://localhost:5000/damage-return')
            ]);
            const invData = await invRes.json();
            const adjData = await adjRes.json();
            const incomeData = await incomeRes.json();
            const expenseData = await expenseRes.json();
            const routeExpenseData = await routeExpenseRes.json();
            const transferData = await transferRes.json();
            const purchaseData = await purchaseRes.json();
            const safePurchasePays = (Array.isArray(purchaseData) ? purchaseData : [])
                .filter((p) => (Number(p.paidAmount) || 0) > 0 && p.paymentMethod)
                .map((p) => {
                    const a = p.paymentAccount || {};
                    return {
                        _id: p._id,
                        createdAt: p.paymentEditedAt || p.paymentDate,
                        accountType: p.paymentMethod,
                        accountName: a.accountName || '',
                        bankName: a.bankName || '',
                        accountNumber: a.accountNumber || '',
                        accountBranch: a.accountBranch || '',
                        amount: Number(p.paidAmount) || 0,
                        isOut: (Number(p.payableAmount) || 0) >= 0,
                        company: p.company,
                    };
                });

            const safeInv = Array.isArray(invData) ? invData : [];
            const safeAdj = Array.isArray(adjData) ? adjData : [];
            const safeIncome = Array.isArray(incomeData) ? incomeData : [];
            const safeExpense = Array.isArray(expenseData) ? expenseData : [];
            const safeRouteExpense = Array.isArray(routeExpenseData) ? routeExpenseData : [];
            const safeTransfer = Array.isArray(transferData) ? transferData : [];



            setInvestments(safeInv);
            setAdjustments(safeAdj);
            setIncomes(safeIncome);
            setExpenses(safeExpense);
            setRouteExpenses(safeRouteExpense);
            setTransfers(safeTransfer);
            setPurchasePays(safePurchasePays);

            const safeReturnPays = [];
            (Array.isArray(purchaseData) ? purchaseData : []).forEach((p) => {
                (p.returnHistory || []).forEach((ret) => {
                    const pay = ret.payment;
                    if (!pay || !(Number(pay.amount) > 0) || !pay.method) return;
                    const a = pay.account || {};
                    safeReturnPays.push({
                        _id: `${p._id}-${ret.returnId}`,
                        createdAt: ret.editedAt || ret.createdAt,
                        accountType: pay.method,
                        accountName: a.accountName || '',
                        bankName: a.bankName || '',
                        accountNumber: a.accountNumber || '',
                        accountBranch: a.accountBranch || '',
                        amount: Number(pay.amount) || 0,
                        company: p.company,
                    });
                });
            });
            setReturnPays(safeReturnPays);

            const bulkRaw = await bulkRes.json().catch(() => []);
            const stockRaw = await stockRes.json().catch(() => []);
            const costMap = buildBatchCostMap(
                Array.isArray(stockRaw) ? stockRaw : [],
                Array.isArray(purchaseData) ? purchaseData : []
            );
            const safeBulkPays = [];
            (Array.isArray(bulkRaw) ? bulkRaw : []).forEach((r) => {
                const eff = getBulkReturnEffect(r, costMap);
                if (!eff) return;
                const a = r.payment.account || {};
                safeBulkPays.push({
                    _id: r._id,
                    createdAt: r.editedAt || r.createdAt,
                    accountType: r.payment.method,
                    accountName: a.accountName || '',
                    bankName: a.bankName || '',
                    accountNumber: a.accountNumber || '',
                    accountBranch: a.accountBranch || '',
                    amount: eff.total,
                    paid: eff.paid,
                    profit: eff.profit,
                    company: r.company,
                });
            });
            setBulkPays(safeBulkPays);

            const dmgRaw = await dmgRes.json().catch(() => []);
            const safeDmgPays = [];
            const safeDmgAdj = [];
            (Array.isArray(dmgRaw) ? dmgRaw : []).forEach((r) => {
                const eff = getDamageReturnEffect(r);
                if (!eff) return;
                if (eff.noAccount) {
                    safeDmgAdj.push({
                        _id: r._id,
                        createdAt: r.approvedAt || r.editedAt || r.createdAt,
                        amount: eff.total,
                        profit: eff.profit,
                        company: r.company,
                    });
                    return;
                }
                const a = r.payment.account || {};
                safeDmgPays.push({
                    _id: r._id,
                    createdAt: r.editedAt || r.createdAt,
                    accountType: r.payment.method,
                    accountName: a.accountName || '',
                    bankName: a.bankName || '',
                    accountNumber: a.accountNumber || '',
                    accountBranch: a.accountBranch || '',
                    amount: eff.total,
                    paid: eff.paid,
                    profit: eff.profit,
                    company: r.company,
                });
            });
            setDmgPays(safeDmgPays);
            setDmgAdjPays(safeDmgAdj);

            const dueRaw = await fetch('http://localhost:5000/purchase-due-payment')
                .then((r) => r.json())
                .catch(() => []);
            const safeDuePays = (Array.isArray(dueRaw) ? dueRaw : [])
                .filter((p) => (Number(p.amount) || 0) > 0 && p.paymentMethod)
                .map((p) => {
                    const a = p.paymentAccount || {};
                    return {
                        _id: p._id,
                        accountType: p.paymentMethod,
                        accountName: a.accountName || '',
                        bankName: a.bankName || '',
                        accountNumber: a.accountNumber || '',
                        accountBranch: a.accountBranch || '',
                        amount: Number(p.amount) || 0,
                        isGet: accBalIsGetDue(p),
                        company: p.company,
                    };
                });
            setDuePays(safeDuePays);

            const salesRaw = await fetch('http://localhost:5000/sales')
                .then((r) => r.json())
                .catch(() => []);
            const safeSalesPays = (Array.isArray(salesRaw) ? salesRaw : [])
                .filter((s) => s.status === 'Delivered' && (Number(s.paidAmount) || 0) > 0 && s.paymentMethod)
                .map((s) => {
                    const a = s.paymentAccount || {};
                    return {
                        _id: s._id,
                        createdAt: s.deliveredAt || s.createdAt,
                        accountType: s.paymentMethod,
                        accountName: a.accountName || '',
                        bankName: a.bankName || '',
                        accountNumber: a.accountNumber || '',
                        accountBranch: a.accountBranch || '',
                        amount: Number(s.paidAmount) || 0,
                        isOut: (Number(s.payableAmount) || 0) < 0,
                        company: s.customer,
                    };
                });
            setSalesPays(safeSalesPays);

            const safeSalesReturnPays = [];
            (Array.isArray(salesRaw) ? salesRaw : []).forEach((s) => {
                (s.returnHistory || []).forEach((ret) => {
                    const pay = ret.payment;
                    if (!pay || !(Number(pay.amount) > 0) || !pay.method) return;
                    const a = pay.account || {};
                    safeSalesReturnPays.push({
                        _id: `${s._id}-${ret.returnId}`,
                        createdAt: ret.editedAt || ret.createdAt,
                        accountType: pay.method,
                        accountName: a.accountName || '',
                        bankName: a.bankName || '',
                        accountNumber: a.accountNumber || '',
                        accountBranch: a.accountBranch || '',
                        amount: Number(pay.amount) || 0,
                        company: s.customer,
                    });
                });
            });
            setSalesReturnPays(safeSalesReturnPays);

            const salesBulkRaw = await fetch('http://localhost:5000/sales-bulk-return')
                .then((r) => r.json())
                .catch(() => []);
            const safeSalesBulkPays = [];
            (Array.isArray(salesBulkRaw) ? salesBulkRaw : []).forEach((r) => {
                const pay = r.payment;
                if (!pay || !(Number(pay.amount) > 0) || !pay.method) return;
                const a = pay.account || {};
                safeSalesBulkPays.push({
                    _id: r._id,
                    createdAt: r.editedAt || r.createdAt,
                    accountType: pay.method,
                    accountName: a.accountName || '',
                    bankName: a.bankName || '',
                    accountNumber: a.accountNumber || '',
                    accountBranch: a.accountBranch || '',
                    amount: Number(pay.amount) || 0,
                    company: r.customer,
                });
            });
            setSalesBulkPays(safeSalesBulkPays);

            const salesDmgRaw = await fetch('http://localhost:5000/sales-damage')
                .then((r) => r.json())
                .catch(() => []);
            const safeSalesDmgPays = [];
            (Array.isArray(salesDmgRaw) ? salesDmgRaw : []).forEach((d) => {
                if (!d.customerId) return;
                const pay = d.payment;
                if (!pay || !(Number(pay.amount) > 0) || !pay.method) return;
                const a = pay.account || {};
                safeSalesDmgPays.push({
                    _id: d._id,
                    createdAt: d.editedAt || d.createdAt,
                    accountType: pay.method,
                    accountName: a.accountName || '',
                    bankName: a.bankName || '',
                    accountNumber: a.accountNumber || '',
                    accountBranch: a.accountBranch || '',
                    amount: Number(pay.amount) || 0,
                    company: d.customer,
                });
            });
            setSalesDmgPays(safeSalesDmgPays);

            const salesDueRaw = await fetch('http://localhost:5000/sales-due-payment')
                .then((r) => r.json())
                .catch(() => []);
            const safeSalesDuePays = (Array.isArray(salesDueRaw) ? salesDueRaw : [])
                .filter((p) => (Number(p.amount) || 0) > 0 && p.paymentMethod)
                .map((p) => {
                    const a = p.paymentAccount || {};
                    return {
                        _id: p._id,
                        accountType: p.paymentMethod,
                        accountName: a.accountName || '',
                        bankName: a.bankName || '',
                        accountNumber: a.accountNumber || '',
                        accountBranch: a.accountBranch || '',
                        amount: Number(p.amount) || 0,
                        isGet: !accBalIsPaySalesDue(p),
                        company: p.customer,
                    };
                });
            setSalesDuePays(safeSalesDuePays);
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

        purchasePays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += item.isOut ? -item.amount : item.amount;
        });

        returnPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += item.amount;
        });

        bulkPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += item.amount;
        });

        dmgPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += item.amount;
        });

        duePays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += item.isGet ? item.amount : -item.amount;
        });

        salesPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += item.isOut ? -item.amount : item.amount;
        });

        salesReturnPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount -= item.amount;
        });

        salesDuePays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount += item.isGet ? item.amount : -item.amount;
        });

        salesDmgPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount -= item.amount;
        });

        salesBulkPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const key = ensureKey(item);
            grouped[key].amount -= item.amount;
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

    // ---- Purchase breakdown (signed: paid = minus, received = plus) ----
    const purchaseSigned = purchasePays.map((p) => ({ ...p, amount: p.isOut ? -p.amount : p.amount }));
    const purchaseCashAccounts = groupTransactionsByAccount(purchaseSigned, 'cash');
    const purchaseMobileAccounts = groupTransactionsByAccount(purchaseSigned, 'mobile');
    const purchaseBankAccounts = groupTransactionsByAccount(purchaseSigned, 'bank');
    const purchaseCashTotal = sumOf(purchaseCashAccounts);
    const purchaseMobileTotal = sumOf(purchaseMobileAccounts);
    const purchaseBankTotal = sumOf(purchaseBankAccounts);
    const purchaseNetTotal = purchaseCashTotal + purchaseMobileTotal + purchaseBankTotal;
    const purchasePaidTotal = purchasePays.filter((p) => p.isOut).reduce((s, p) => s + p.amount, 0);
    const purchaseReceivedTotal = purchasePays.filter((p) => !p.isOut).reduce((s, p) => s + p.amount, 0);

    // ---- Purchase Return breakdown (company theke asha taka) ----
    const returnCashAccounts = groupTransactionsByAccount(returnPays, 'cash');
    const returnMobileAccounts = groupTransactionsByAccount(returnPays, 'mobile');
    const returnBankAccounts = groupTransactionsByAccount(returnPays, 'bank');
    const returnCashTotal = sumOf(returnCashAccounts);
    const returnMobileTotal = sumOf(returnMobileAccounts);
    const returnBankTotal = sumOf(returnBankAccounts);
    const returnGrandTotal = returnCashTotal + returnMobileTotal + returnBankTotal;

    // ---- Purchase Bulk Return breakdown (payment +/- profit/loss) ----
    const groupBulkByAccount = (category) => {
        const fmtN = (n) => Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
        const grouped = {};
        bulkPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const accountName = item.accountName || item.bankName || 'Cash';
            const accountNumber = item.accountNumber || '';
            const accountBranch = item.accountBranch || '';
            const key = `${accountName}||${accountNumber}||${accountBranch}`;
            if (!grouped[key]) {
                grouped[key] = { accountName, accountNumber, accountBranch, amount: 0, paid: 0, profit: 0 };
            }
            grouped[key].amount += item.amount;
            grouped[key].paid += item.paid;
            grouped[key].profit += item.profit;
        });
        return Object.values(grouped)
            .map((g) => {
                const profit = Math.round(g.profit * 100) / 100;
                return {
                    ...g,
                    profit,
                    note: profit !== 0 ? `(${fmtN(g.paid)}${profit > 0 ? '+' : '-'}${fmtN(Math.abs(profit))})` : '',
                    noteColor: profit > 0 ? 'text-emerald-500' : 'text-rose-500',
                };
            })
            .sort((a, b) => b.amount - a.amount);
    };
    const bulkCashAccounts = groupBulkByAccount('cash');
    const bulkMobileAccounts = groupBulkByAccount('mobile');
    const bulkBankAccounts = groupBulkByAccount('bank');
    const bulkCashTotal = sumOf(bulkCashAccounts);
    const bulkMobileTotal = sumOf(bulkMobileAccounts);
    const bulkBankTotal = sumOf(bulkBankAccounts);
    const bulkGrandTotal = bulkCashTotal + bulkMobileTotal + bulkBankTotal;
    const bulkPaidTotal = bulkPays.reduce((s, i) => s + i.paid, 0);
    const bulkProfitTotal = Math.round(bulkPays.reduce((s, i) => s + i.profit, 0) * 100) / 100;

    // ---- Damage Return breakdown (payment +/- profit/loss) ----
    const groupDmgByAccount = (category) => {
        const fmtN = (n) => Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
        const grouped = {};
        dmgPays.forEach((item) => {
            if (getCategory(item.accountType) !== category) return;
            const accountName = item.accountName || item.bankName || 'Cash';
            const accountNumber = item.accountNumber || '';
            const accountBranch = item.accountBranch || '';
            const key = `${accountName}||${accountNumber}||${accountBranch}`;
            if (!grouped[key]) {
                grouped[key] = { accountName, accountNumber, accountBranch, amount: 0, paid: 0, profit: 0 };
            }
            grouped[key].amount += item.amount;
            grouped[key].paid += item.paid;
            grouped[key].profit += item.profit;
        });
        return Object.values(grouped)
            .map((g) => {
                const profit = Math.round(g.profit * 100) / 100;
                return {
                    ...g,
                    profit,
                    note: profit !== 0 ? `(${fmtN(g.paid)}${profit > 0 ? '+' : '-'}${fmtN(Math.abs(profit))})` : '',
                    noteColor: profit > 0 ? 'text-emerald-500' : 'text-rose-500',
                };
            })
            .sort((a, b) => b.amount - a.amount);
    };
    const dmgCashAccounts = groupDmgByAccount('cash');
    const dmgMobileAccounts = groupDmgByAccount('mobile');
    const dmgBankAccounts = groupDmgByAccount('bank');
    const dmgCashTotal = sumOf(dmgCashAccounts);
    const dmgMobileTotal = sumOf(dmgMobileAccounts);
    const dmgBankTotal = sumOf(dmgBankAccounts);
    const dmgAdjTotal = Math.round(dmgAdjPays.reduce((s, i) => s + i.amount, 0) * 100) / 100;
    const dmgGrandTotal = dmgCashTotal + dmgMobileTotal + dmgBankTotal + dmgAdjTotal;
    const dmgPaidTotal = dmgPays.reduce((s, i) => s + i.paid, 0);
    const dmgProfitTotal = Math.round((dmgPays.reduce((s, i) => s + i.profit, 0) + dmgAdjPays.reduce((s, i) => s + i.profit, 0)) * 100) / 100;
    // ---- Purchase Due Payment breakdown (Get = plus, Pay = minus) ----
    const dueSigned = duePays.map((p) => ({ ...p, amount: p.isGet ? p.amount : -p.amount }));
    const dueCashAccounts = groupTransactionsByAccount(dueSigned, 'cash');
    const dueMobileAccounts = groupTransactionsByAccount(dueSigned, 'mobile');
    const dueBankAccounts = groupTransactionsByAccount(dueSigned, 'bank');
    const dueCashTotal = sumOf(dueCashAccounts);
    const dueMobileTotal = sumOf(dueMobileAccounts);
    const dueBankTotal = sumOf(dueBankAccounts);
    const dueNetTotal = dueCashTotal + dueMobileTotal + dueBankTotal;
    const dueGetTotal = duePays.filter((p) => p.isGet).reduce((s, p) => s + p.amount, 0);
    const duePayTotal = duePays.filter((p) => !p.isGet).reduce((s, p) => s + p.amount, 0);

    // ---- Sales (Wholesale) breakdown (received = plus, paid = minus) ----
    const salesSigned = salesPays.map((p) => ({ ...p, amount: p.isOut ? -p.amount : p.amount }));
    const salesCashAccounts = groupTransactionsByAccount(salesSigned, 'cash');
    const salesMobileAccounts = groupTransactionsByAccount(salesSigned, 'mobile');
    const salesBankAccounts = groupTransactionsByAccount(salesSigned, 'bank');
    const salesCashTotal = sumOf(salesCashAccounts);
    const salesMobileTotal = sumOf(salesMobileAccounts);
    const salesBankTotal = sumOf(salesBankAccounts);
    const salesNetTotal = salesCashTotal + salesMobileTotal + salesBankTotal;
    const salesReceivedTotal = salesPays.filter((p) => !p.isOut).reduce((s, p) => s + p.amount, 0);
    const salesPaidTotal = salesPays.filter((p) => p.isOut).reduce((s, p) => s + p.amount, 0);

    // ---- Sales Return breakdown (customer ke dewa taka, account theke minus) ----
    const salesReturnSigned = salesReturnPays.map((p) => ({ ...p, amount: -p.amount }));
    const salesReturnCashAccounts = groupTransactionsByAccount(salesReturnSigned, 'cash');
    const salesReturnMobileAccounts = groupTransactionsByAccount(salesReturnSigned, 'mobile');
    const salesReturnBankAccounts = groupTransactionsByAccount(salesReturnSigned, 'bank');
    const salesReturnCashTotal = sumOf(salesReturnCashAccounts);
    const salesReturnMobileTotal = sumOf(salesReturnMobileAccounts);
    const salesReturnBankTotal = sumOf(salesReturnBankAccounts);
    const salesReturnNetTotal = salesReturnCashTotal + salesReturnMobileTotal + salesReturnBankTotal;
    const salesReturnPaidTotal = salesReturnPays.reduce((s, p) => s + p.amount, 0);

    // ---- Sales Bulk Return breakdown (customer ke dewa taka, account theke minus) ----
    const salesBulkSigned = salesBulkPays.map((p) => ({ ...p, amount: -p.amount }));
    const salesBulkCashAccounts = groupTransactionsByAccount(salesBulkSigned, 'cash');
    const salesBulkMobileAccounts = groupTransactionsByAccount(salesBulkSigned, 'mobile');
    const salesBulkBankAccounts = groupTransactionsByAccount(salesBulkSigned, 'bank');
    const salesBulkCashTotal = sumOf(salesBulkCashAccounts);
    const salesBulkMobileTotal = sumOf(salesBulkMobileAccounts);
    const salesBulkBankTotal = sumOf(salesBulkBankAccounts);
    const salesBulkPaidTotal = salesBulkPays.reduce((s, p) => s + p.amount, 0);

    // ---- Sales Damage Return breakdown (customer ke dewa taka, account theke minus) ----
    const salesDmgSigned = salesDmgPays.map((p) => ({ ...p, amount: -p.amount }));
    const salesDmgCashAccounts = groupTransactionsByAccount(salesDmgSigned, 'cash');
    const salesDmgMobileAccounts = groupTransactionsByAccount(salesDmgSigned, 'mobile');
    const salesDmgBankAccounts = groupTransactionsByAccount(salesDmgSigned, 'bank');
    const salesDmgCashTotal = sumOf(salesDmgCashAccounts);
    const salesDmgMobileTotal = sumOf(salesDmgMobileAccounts);
    const salesDmgBankTotal = sumOf(salesDmgBankAccounts);
    const salesDmgPaidTotal = salesDmgPays.reduce((s, p) => s + p.amount, 0);

    // ---- Sales Due Payment breakdown (Get = plus, Pay = minus) ----
    const salesDueSigned = salesDuePays.map((p) => ({ ...p, amount: p.isGet ? p.amount : -p.amount }));
    const salesDueCashAccounts = groupTransactionsByAccount(salesDueSigned, 'cash');
    const salesDueMobileAccounts = groupTransactionsByAccount(salesDueSigned, 'mobile');
    const salesDueBankAccounts = groupTransactionsByAccount(salesDueSigned, 'bank');
    const salesDueCashTotal = sumOf(salesDueCashAccounts);
    const salesDueMobileTotal = sumOf(salesDueMobileAccounts);
    const salesDueBankTotal = sumOf(salesDueBankAccounts);
    const salesDueNetTotal = salesDueCashTotal + salesDueMobileTotal + salesDueBankTotal;
    const salesDueGetTotal = salesDuePays.filter((p) => p.isGet).reduce((s, p) => s + p.amount, 0);
    const salesDuePayTotal = salesDuePays.filter((p) => !p.isGet).reduce((s, p) => s + p.amount, 0);

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
    // Database er data theke latest 30 ta notification (notun upore)
    const oidTime = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);
    const getTs = (o) => {
        const c = o?.createdAt ? Date.parse(o.createdAt) : NaN;
        return !isNaN(c) ? c : oidTime(o?._id);
    };
    const getAccName = (item) => item.accountName || item.bankName || 'Cash';
    const getAccNum = (item) => item.accountNumber || '';

    const notifications = [
        ...investments.map((item) => ({
            id: `accounts-${item._id}`,
            tab: 'Account',
            accountNumber: getAccNum(item),
            accountName: getAccName(item),
            amount: Number(item.amount) || 0,
            isPositive: true,
            isTransfer: false,
            time: getTs(item),
        })),
        ...adjustments.map((item) => {
            const relatedInv = investments.find((inv) => inv._id === item.adjustmentID);
            return {
                id: `adjustment-${item._id}`,
                tab: 'Adjustment',
                accountNumber: relatedInv ? getAccNum(relatedInv) : '',
                accountName: relatedInv ? getAccName(relatedInv) : 'Cash',
                amount: Number(item.amount) || 0,
                isPositive: item.mode === 'Deposit',
                isTransfer: false,
                time: getTs(item),
            };
        }),
        ...incomes.map((item) => ({
            id: `income-${item._id}`,
            tab: 'Income',
            accountNumber: getAccNum(item),
            accountName: getAccName(item),
            amount: Number(item.amount) || 0,
            isPositive: true,
            isTransfer: false,
            time: getTs(item),
        })),
        ...expenses.map((item) => ({
            id: `expense-${item._id}`,
            tab: 'Expense',
            accountNumber: getAccNum(item),
            accountName: getAccName(item),
            amount: Number(item.amount) || 0,
            isPositive: false,
            isTransfer: false,
            time: getTs(item),
        })),
        ...routeExpenses.map((item) => ({
            id: `routeExpense-${item._id}`,
            tab: 'Route Expense',
            accountNumber: getAccNum(item),
            accountName: getAccName(item),
            amount: Number(item.amount) || 0,
            isPositive: false,
            isTransfer: false,
            time: getTs(item),
        })),
        ...purchasePays.map((item) => ({
            id: `purchase-${item._id}`,
            tab: 'Purchase',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: !item.isOut,
            isTransfer: false,
            time: getTs(item),
        })),
        ...returnPays.map((item) => ({
            id: `purchaseReturn-${item._id}`,
            tab: 'Purchase Return',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: true,
            isTransfer: false,
            time: getTs(item),
        })),
        ...bulkPays.map((item) => ({
            id: `purchaseBulkReturn-${item._id}`,
            tab: 'Bulk Return',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: Math.abs(item.amount),
            isPositive: item.amount >= 0,
            isTransfer: false,
            time: getTs(item),
        })),
        ...dmgPays.map((item) => ({
            id: `purchaseDamageReturn-${item._id}`,
            tab: 'Damage Return',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: Math.abs(item.amount),
            isPositive: item.amount >= 0,
            isTransfer: false,
            time: getTs(item),
        })),
        ...duePays.map((item) => ({
            id: `purchaseDue-${item._id}`,
            tab: item.isGet ? 'Due Payment (Get)' : 'Due Payment (Pay)',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: item.isGet,
            isTransfer: false,
            time: getTs(item),
        })),
        ...salesPays.map((item) => ({
            id: `sales-${item._id}`,
            tab: 'Sales',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: !item.isOut,
            isTransfer: false,
            time: getTs(item),
        })),
        ...salesReturnPays.map((item) => ({
            id: `salesReturn-${item._id}`,
            tab: 'Sales Return',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: false,
            isTransfer: false,
            time: getTs(item),
        })),
        ...salesBulkPays.map((item) => ({
            id: `salesBulkReturn-${item._id}`,
            tab: 'Sales Bulk Return',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: false,
            isTransfer: false,
            time: getTs(item),
        })),
        ...salesDuePays.map((item) => ({
            id: `salesDue-${item._id}`,
            tab: item.isGet ? 'Sales Due (Get)' : 'Sales Due (Pay)',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: item.isGet,
            isTransfer: false,
            time: getTs(item),
        })),
        ...salesDmgPays.map((item) => ({
            id: `salesDamageReturn-${item._id}`,
            tab: 'Sales Damage Return',
            accountNumber: getAccNum(item),
            accountName: `${item.company || ''} - ${getAccName(item)}`,
            amount: item.amount,
            isPositive: false,
            isTransfer: false,
            time: getTs(item),
        })),
        ...dmgAdjPays.map((item) => ({
            id: `purchaseDamageReturnAdj-${item._id}`,
            tab: 'Damage Return',
            accountNumber: '',
            accountName: `${item.company || ''} - Profit/Loss (No Account)`,
            amount: Math.abs(item.amount),
            isPositive: item.amount >= 0,
            isTransfer: false,
            time: getTs(item),
        })),
        ...transfers.map((item) => ({
            id: `transfer-${item._id}`,
            tab: 'Transfer',
            fromLabel: item.fromAccount || item.transferFrom || 'Cash',
            toLabel: item.toAccount || item.transferTo || 'Cash',
            amount: Number(item.amount) || 0,
            isTransfer: true,
            time: getTs(item),
        })),
    ]
        .sort((a, b) => b.time - a.time)
        .slice(0, 30);

    const unreadCount = notifications.filter((n) => n.time > seenTime).length;

    const openNotifications = () => {
        setShowNotifications(true);
        setTimeout(() => setNotifVisible(true), 10);
        const latest = Math.max(0, ...notifications.map((n) => n.time));
        setSeenTime(latest);
        try {
            localStorage.setItem('notifSeenTime', String(latest));
        } catch (error) {
            console.error(error);
        }
    };

    const closeNotifications = () => {
        setNotifVisible(false);
        setTimeout(() => setShowNotifications(false), 250);
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
        (grandTotal + incomeGrandTotal) - (expenseGrandTotal + routeExpenseGrandTotal) +
        purchasePays.reduce((s, i) => s + (i.isOut ? -i.amount : i.amount), 0) +
        returnPays.reduce((s, i) => s + i.amount, 0) +
        bulkPays.reduce((s, i) => s + i.amount, 0) +
        dmgPays.reduce((s, i) => s + i.amount, 0) +
        dmgAdjPays.reduce((s, i) => s + i.amount, 0) +
        duePays.reduce((s, i) => s + (i.isGet ? i.amount : -i.amount), 0) +
        salesPays.reduce((s, i) => s + (i.isOut ? -i.amount : i.amount), 0) -
        salesReturnPays.reduce((s, i) => s + i.amount, 0) -
        salesBulkPays.reduce((s, i) => s + i.amount, 0) -
        salesDmgPays.reduce((s, i) => s + i.amount, 0) +
        salesDuePays.reduce((s, i) => s + (i.isGet ? i.amount : -i.amount), 0);

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
                                {acc.note && (
                                    <span className={`block text-[11px] font-bold text-right ${acc.noteColor || 'text-gray-500'}`}>
                                        {acc.note}
                                    </span>
                                )}
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
                                                {n.accountNumber && (
                                                    <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1 truncate">
                                                        <FiHash className="w-3 h-3 flex-shrink-0" /> {n.accountNumber}
                                                    </p>
                                                )}
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

                {/* Parent Tab Switcher (click করলে child tab খুলবে / বন্ধ হবে) */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white p-2 space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {TABS.map((parent) => {
                            const isOpen = activeParent === parent.key;
                            const hasActiveChild = parent.children.some((c) => c.key === activeTab);
                            return (
                                <button
                                    key={parent.key}
                                    onClick={() => {
                                        if (isOpen) {
                                            setActiveParent(null);
                                        } else {
                                            setActiveParent(parent.key);
                                            if (!hasActiveChild) setActiveTab(parent.children[0].key);
                                        }
                                    }}
                                    className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition duration-200 cursor-pointer ${isOpen || hasActiveChild
                                        ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-lg shadow-indigo-200'
                                        : 'text-gray-500 hover:bg-gray-100'
                                        }`}
                                >
                                    {parent.icon}
                                    {parent.label}
                                    <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Child Tabs (ছোট সাইজ) */}
                    {TABS.filter((p) => p.key === activeParent).map((parent) => (
                        <div key={parent.key} className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-100">
                            {parent.children.map((child) => (
                                <button
                                    key={child.key}
                                    onClick={() => setActiveTab(child.key)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs transition duration-200 cursor-pointer ${activeTab === child.key
                                        ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                        : 'text-gray-500 bg-gray-50 border border-gray-100 hover:bg-gray-100'
                                        }`}
                                >
                                    {child.icon}
                                    {child.label}
                                </button>
                            ))}
                        </div>
                    ))}
                </div>

                {/* ================= Purchase Tab ================= */}
                {activeTab === 'purchase' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiShoppingCart />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Net Purchase Payment (Paid - Received)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(purchaseNetTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm text-white/80 font-medium">
                                    <span className="flex items-center gap-1.5 text-rose-300">
                                        <FiTrendingDown className="w-3.5 h-3.5" /> - Paid: ৳ {formatAmount(purchasePaidTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                        <FiTrendingUp className="w-3.5 h-3.5" /> + Received: ৳ {formatAmount(purchaseReceivedTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiShoppingCart className="w-3.5 h-3.5" />
                                        {purchasePays.length} total purchase payment record{purchasePays.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Purchase - Cash"
                                amount={purchaseCashTotal}
                                count={purchaseCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                            />
                            <SummaryCard
                                title="Purchase - Mobile Banking"
                                amount={purchaseMobileTotal}
                                count={purchaseMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-purple-500 to-fuchsia-600"
                            />
                            <SummaryCard
                                title="Purchase - Bank"
                                amount={purchaseBankTotal}
                                count={purchaseBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-fuchsia-500 to-pink-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Purchase"
                                icon={<FiDollarSign />}
                                accounts={purchaseCashAccounts}
                                total={purchaseCashTotal}
                                accentColor="bg-gradient-to-tr from-violet-500 to-purple-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Purchase"
                                icon={<FiSmartphone />}
                                accounts={purchaseMobileAccounts}
                                total={purchaseMobileTotal}
                                accentColor="bg-gradient-to-tr from-purple-500 to-fuchsia-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Purchase"
                                icon={<FiCreditCard />}
                                accounts={purchaseBankAccounts}
                                total={purchaseBankTotal}
                                accentColor="bg-gradient-to-tr from-fuchsia-500 to-pink-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {purchasePays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No purchase payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Purchase Bulk Return Tab ================= */}
                {activeTab === 'purchaseBulkReturn' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiLayers />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Bulk Return (Received ± Profit/Loss)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(bulkGrandTotal)}
                                        </p>
                                        {bulkProfitTotal !== 0 && (
                                            <p className={`text-sm font-bold mt-1 ${bulkProfitTotal > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                                ({formatAmount(bulkPaidTotal)}{bulkProfitTotal > 0 ? '+' : '-'}{formatAmount(Math.abs(bulkProfitTotal))})
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm text-white/80 font-medium">
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                        <FiTrendingUp className="w-3.5 h-3.5" /> Received: ৳ {formatAmount(bulkPaidTotal)}
                                    </span>
                                    <span className={`flex items-center gap-1.5 ${bulkProfitTotal >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                        {bulkProfitTotal >= 0 ? <FiTrendingUp className="w-3.5 h-3.5" /> : <FiTrendingDown className="w-3.5 h-3.5" />}
                                        {bulkProfitTotal >= 0 ? 'Profit' : 'Loss'}: ৳ {formatAmount(Math.abs(bulkProfitTotal))}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiLayers className="w-3.5 h-3.5" />
                                        {bulkPays.length} total bulk return payment record{bulkPays.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Bulk Return - Cash"
                                amount={bulkCashTotal}
                                count={bulkCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-fuchsia-500 to-purple-600"
                            />
                            <SummaryCard
                                title="Bulk Return - Mobile Banking"
                                amount={bulkMobileTotal}
                                count={bulkMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-purple-500 to-indigo-600"
                            />
                            <SummaryCard
                                title="Bulk Return - Bank"
                                amount={bulkBankTotal}
                                count={bulkBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-indigo-500 to-blue-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Bulk Return"
                                icon={<FiDollarSign />}
                                accounts={bulkCashAccounts}
                                total={bulkCashTotal}
                                accentColor="bg-gradient-to-tr from-fuchsia-500 to-purple-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Bulk Return"
                                icon={<FiSmartphone />}
                                accounts={bulkMobileAccounts}
                                total={bulkMobileTotal}
                                accentColor="bg-gradient-to-tr from-purple-500 to-indigo-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Bulk Return"
                                icon={<FiCreditCard />}
                                accounts={bulkBankAccounts}
                                total={bulkBankTotal}
                                accentColor="bg-gradient-to-tr from-indigo-500 to-blue-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {bulkPays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No bulk return payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Purchase Damage Return Tab ================= */}
                {activeTab === 'purchaseDamageReturn' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-red-600 to-orange-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiLayers />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Damage Return (Received ± Profit/Loss)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(dmgGrandTotal)}
                                        </p>
                                        {dmgProfitTotal !== 0 && (
                                            <p className={`text-sm font-bold mt-1 ${dmgProfitTotal > 0 ? 'text-emerald-300' : 'text-yellow-200'}`}>
                                                ({formatAmount(dmgPaidTotal)}{dmgProfitTotal > 0 ? '+' : '-'}{formatAmount(Math.abs(dmgProfitTotal))})
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm text-white/80 font-medium">
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                        <FiTrendingUp className="w-3.5 h-3.5" /> Received: ৳ {formatAmount(dmgPaidTotal)}
                                    </span>
                                    <span className={`flex items-center gap-1.5 ${dmgProfitTotal >= 0 ? 'text-emerald-300' : 'text-yellow-200'}`}>
                                        {dmgProfitTotal >= 0 ? <FiTrendingUp className="w-3.5 h-3.5" /> : <FiTrendingDown className="w-3.5 h-3.5" />}
                                        {dmgProfitTotal >= 0 ? 'Profit' : 'Loss'}: ৳ {formatAmount(Math.abs(dmgProfitTotal))}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiLayers className="w-3.5 h-3.5" />
                                        {dmgPays.length + dmgAdjPays.length} total damage return record{dmgPays.length + dmgAdjPays.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Damage Return - Cash"
                                amount={dmgCashTotal}
                                count={dmgCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-rose-500 to-red-600"
                            />
                            <SummaryCard
                                title="Damage Return - Mobile Banking"
                                amount={dmgMobileTotal}
                                count={dmgMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-red-500 to-orange-600"
                            />
                            <SummaryCard
                                title="Damage Return - Bank"
                                amount={dmgBankTotal}
                                count={dmgBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-orange-500 to-amber-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Damage Return"
                                icon={<FiDollarSign />}
                                accounts={dmgCashAccounts}
                                total={dmgCashTotal}
                                accentColor="bg-gradient-to-tr from-rose-500 to-red-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Damage Return"
                                icon={<FiSmartphone />}
                                accounts={dmgMobileAccounts}
                                total={dmgMobileTotal}
                                accentColor="bg-gradient-to-tr from-red-500 to-orange-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Damage Return"
                                icon={<FiCreditCard />}
                                accounts={dmgBankAccounts}
                                total={dmgBankTotal}
                                accentColor="bg-gradient-to-tr from-orange-500 to-amber-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {dmgAdjPays.length > 0 && (
                            <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl border border-white p-6 md:p-7">
                                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                                    <h3 className="text-lg font-bold text-gray-800">No Account (Profit / Loss only)</h3>
                                    <span className={`text-sm font-bold ${dmgAdjTotal < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {dmgAdjTotal < 0 ? '-' : '+'}৳ {formatAmount(Math.abs(dmgAdjTotal))}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {dmgAdjPays.map((item) => (
                                        <div key={item._id} className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-gray-50/70 border border-gray-100 text-sm">
                                            <span className="font-semibold text-gray-700 truncate">{item.company}</span>
                                            <span className={`font-extrabold whitespace-nowrap ${item.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                {item.amount < 0 ? '-' : '+'}৳ {formatAmount(Math.abs(item.amount))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {dmgPays.length === 0 && dmgAdjPays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No damage return payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Purchase Due Payment Tab ================= */}
                {activeTab === 'purchaseDue' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-indigo-600 to-violet-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiCreditCard />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Net Due Payment (Get - Pay)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(dueNetTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm text-white/80 font-medium">
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                        <FiTrendingUp className="w-3.5 h-3.5" /> + Get: ৳ {formatAmount(dueGetTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-rose-300">
                                        <FiTrendingDown className="w-3.5 h-3.5" /> - Pay: ৳ {formatAmount(duePayTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiCreditCard className="w-3.5 h-3.5" />
                                        {duePays.length} total due payment record{duePays.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Due Payment - Cash"
                                amount={dueCashTotal}
                                count={dueCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-sky-500 to-indigo-600"
                            />
                            <SummaryCard
                                title="Due Payment - Mobile Banking"
                                amount={dueMobileTotal}
                                count={dueMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-indigo-500 to-violet-600"
                            />
                            <SummaryCard
                                title="Due Payment - Bank"
                                amount={dueBankTotal}
                                count={dueBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-violet-500 to-purple-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Due Payment"
                                icon={<FiDollarSign />}
                                accounts={dueCashAccounts}
                                total={dueCashTotal}
                                accentColor="bg-gradient-to-tr from-sky-500 to-indigo-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Due Payment"
                                icon={<FiSmartphone />}
                                accounts={dueMobileAccounts}
                                total={dueMobileTotal}
                                accentColor="bg-gradient-to-tr from-indigo-500 to-violet-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Due Payment"
                                icon={<FiCreditCard />}
                                accounts={dueBankAccounts}
                                total={dueBankTotal}
                                accentColor="bg-gradient-to-tr from-violet-500 to-purple-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {duePays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No due payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Sales (Wholesale) Tab ================= */}
                {activeTab === 'sales' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiShoppingBag />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Net Sales Payment (Received - Paid)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(salesNetTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm text-white/80 font-medium">
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                        <FiTrendingUp className="w-3.5 h-3.5" /> + Received: ৳ {formatAmount(salesReceivedTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-rose-300">
                                        <FiTrendingDown className="w-3.5 h-3.5" /> - Paid: ৳ {formatAmount(salesPaidTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiShoppingBag className="w-3.5 h-3.5" />
                                        {salesPays.length} total sales payment record{salesPays.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Sales - Cash"
                                amount={salesCashTotal}
                                count={salesCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
                            />
                            <SummaryCard
                                title="Sales - Mobile Banking"
                                amount={salesMobileTotal}
                                count={salesMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-emerald-500 to-cyan-600"
                            />
                            <SummaryCard
                                title="Sales - Bank"
                                amount={salesBankTotal}
                                count={salesBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-cyan-500 to-sky-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Sales"
                                icon={<FiDollarSign />}
                                accounts={salesCashAccounts}
                                total={salesCashTotal}
                                accentColor="bg-gradient-to-tr from-teal-500 to-emerald-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Sales"
                                icon={<FiSmartphone />}
                                accounts={salesMobileAccounts}
                                total={salesMobileTotal}
                                accentColor="bg-gradient-to-tr from-emerald-500 to-cyan-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Sales"
                                icon={<FiCreditCard />}
                                accounts={salesBankAccounts}
                                total={salesBankTotal}
                                accentColor="bg-gradient-to-tr from-cyan-500 to-sky-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {salesPays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No sales payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Sales Return Tab ================= */}
                {activeTab === 'salesReturn' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-orange-600 to-amber-500 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiRotateCcw />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Sales Return Paid (Customer ke dewa)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(salesReturnPaidTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingDown className="w-4 h-4" />
                                    {salesReturnPays.length} total sales return payment record{salesReturnPays.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Sales Return - Cash"
                                amount={salesReturnCashTotal}
                                count={salesReturnCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-rose-500 to-red-600"
                            />
                            <SummaryCard
                                title="Sales Return - Mobile Banking"
                                amount={salesReturnMobileTotal}
                                count={salesReturnMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-orange-500 to-rose-600"
                            />
                            <SummaryCard
                                title="Sales Return - Bank"
                                amount={salesReturnBankTotal}
                                count={salesReturnBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Sales Return"
                                icon={<FiDollarSign />}
                                accounts={salesReturnCashAccounts}
                                total={salesReturnCashTotal}
                                accentColor="bg-gradient-to-tr from-rose-500 to-red-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Sales Return"
                                icon={<FiSmartphone />}
                                accounts={salesReturnMobileAccounts}
                                total={salesReturnMobileTotal}
                                accentColor="bg-gradient-to-tr from-orange-500 to-rose-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Sales Return"
                                icon={<FiCreditCard />}
                                accounts={salesReturnBankAccounts}
                                total={salesReturnBankTotal}
                                accentColor="bg-gradient-to-tr from-amber-500 to-orange-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {salesReturnPays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No sales return payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Sales Bulk Return Tab ================= */}
                {activeTab === 'salesBulkReturn' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-rose-600 via-pink-600 to-fuchsia-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiLayers />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Sales Bulk Return Paid (Customer ke dewa)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(salesBulkPaidTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingDown className="w-4 h-4" />
                                    {salesBulkPays.length} total sales bulk return payment record{salesBulkPays.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Sales Bulk Return - Cash"
                                amount={salesBulkCashTotal}
                                count={salesBulkCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-rose-500 to-red-600"
                            />
                            <SummaryCard
                                title="Sales Bulk Return - Mobile Banking"
                                amount={salesBulkMobileTotal}
                                count={salesBulkMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-pink-500 to-rose-600"
                            />
                            <SummaryCard
                                title="Sales Bulk Return - Bank"
                                amount={salesBulkBankTotal}
                                count={salesBulkBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-fuchsia-500 to-pink-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Sales Bulk Return"
                                icon={<FiDollarSign />}
                                accounts={salesBulkCashAccounts}
                                total={salesBulkCashTotal}
                                accentColor="bg-gradient-to-tr from-rose-500 to-red-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Sales Bulk Return"
                                icon={<FiSmartphone />}
                                accounts={salesBulkMobileAccounts}
                                total={salesBulkMobileTotal}
                                accentColor="bg-gradient-to-tr from-pink-500 to-rose-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Sales Bulk Return"
                                icon={<FiCreditCard />}
                                accounts={salesBulkBankAccounts}
                                total={salesBulkBankTotal}
                                accentColor="bg-gradient-to-tr from-fuchsia-500 to-pink-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {salesBulkPays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No sales bulk return payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Sales Damage Return Tab ================= */}
                {activeTab === 'salesDamageReturn' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiLayers />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Sales Damage Return Paid (Customer ke dewa)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(salesDmgPaidTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingDown className="w-4 h-4" />
                                    {salesDmgPays.length} total sales damage return payment record{salesDmgPays.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Sales Damage Return - Cash"
                                amount={salesDmgCashTotal}
                                count={salesDmgCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-red-500 to-rose-600"
                            />
                            <SummaryCard
                                title="Sales Damage Return - Mobile Banking"
                                amount={salesDmgMobileTotal}
                                count={salesDmgMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-rose-500 to-orange-600"
                            />
                            <SummaryCard
                                title="Sales Damage Return - Bank"
                                amount={salesDmgBankTotal}
                                count={salesDmgBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-orange-500 to-amber-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Sales Damage Return"
                                icon={<FiDollarSign />}
                                accounts={salesDmgCashAccounts}
                                total={salesDmgCashTotal}
                                accentColor="bg-gradient-to-tr from-red-500 to-rose-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Sales Damage Return"
                                icon={<FiSmartphone />}
                                accounts={salesDmgMobileAccounts}
                                total={salesDmgMobileTotal}
                                accentColor="bg-gradient-to-tr from-rose-500 to-orange-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Sales Damage Return"
                                icon={<FiCreditCard />}
                                accounts={salesDmgBankAccounts}
                                total={salesDmgBankTotal}
                                accentColor="bg-gradient-to-tr from-orange-500 to-amber-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {salesDmgPays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No sales damage return payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Sales Due Payment Tab ================= */}
                {activeTab === 'salesDue' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiCreditCard />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Net Sales Due Payment (Get - Pay)</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(salesDueNetTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start md:items-end gap-1 text-xs md:text-sm text-white/80 font-medium">
                                    <span className="flex items-center gap-1.5 text-emerald-300">
                                        <FiTrendingUp className="w-3.5 h-3.5" /> + Get: ৳ {formatAmount(salesDueGetTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5 text-rose-300">
                                        <FiTrendingDown className="w-3.5 h-3.5" /> - Pay: ৳ {formatAmount(salesDuePayTotal)}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <FiCreditCard className="w-3.5 h-3.5" />
                                        {salesDuePays.length} total sales due payment record{salesDuePays.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Sales Due - Cash"
                                amount={salesDueCashTotal}
                                count={salesDueCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-sky-500 to-cyan-600"
                            />
                            <SummaryCard
                                title="Sales Due - Mobile Banking"
                                amount={salesDueMobileTotal}
                                count={salesDueMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-cyan-500 to-teal-600"
                            />
                            <SummaryCard
                                title="Sales Due - Bank"
                                amount={salesDueBankTotal}
                                count={salesDueBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-teal-500 to-emerald-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Sales Due"
                                icon={<FiDollarSign />}
                                accounts={salesDueCashAccounts}
                                total={salesDueCashTotal}
                                accentColor="bg-gradient-to-tr from-sky-500 to-cyan-600"
                                showNumberBranch={false}
                                dynamicColor
                            />
                            <DetailPanel
                                title="Mobile Banking Sales Due"
                                icon={<FiSmartphone />}
                                accounts={salesDueMobileAccounts}
                                total={salesDueMobileTotal}
                                accentColor="bg-gradient-to-tr from-cyan-500 to-teal-600"
                                showNumberBranch
                                dynamicColor
                            />
                            <DetailPanel
                                title="Bank Sales Due"
                                icon={<FiCreditCard />}
                                accounts={salesDueBankAccounts}
                                total={salesDueBankTotal}
                                accentColor="bg-gradient-to-tr from-teal-500 to-emerald-600"
                                showNumberBranch
                                dynamicColor
                            />
                        </div>

                        {salesDuePays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No sales due payment data found yet!
                            </div>
                        )}
                    </div>
                )}

                {/* ================= Purchase Return Tab ================= */}
                {activeTab === 'purchaseReturn' && (
                    <div className="space-y-6">
                        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 rounded-3xl shadow-2xl p-8 text-white">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-white/10 rounded-full"></div>
                            <div className="absolute right-20 -bottom-16 w-36 h-36 bg-white/10 rounded-full"></div>
                            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl">
                                        <FiRotateCcw />
                                    </div>
                                    <div>
                                        <p className="text-white/80 text-sm font-medium">Total Purchase Return Received</p>
                                        <p className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                            ৳ {formatAmount(returnGrandTotal)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-white/80 text-sm font-medium">
                                    <FiTrendingUp className="w-4 h-4" />
                                    {returnPays.length} total return payment record{returnPays.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                            <SummaryCard
                                title="Return - Cash"
                                amount={returnCashTotal}
                                count={returnCashAccounts.length}
                                icon={<FiDollarSign />}
                                gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
                            />
                            <SummaryCard
                                title="Return - Mobile Banking"
                                amount={returnMobileTotal}
                                count={returnMobileAccounts.length}
                                icon={<FiSmartphone />}
                                gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                            />
                            <SummaryCard
                                title="Return - Bank"
                                amount={returnBankTotal}
                                count={returnBankAccounts.length}
                                icon={<FiCreditCard />}
                                gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <DetailPanel
                                title="Cash Return"
                                icon={<FiDollarSign />}
                                accounts={returnCashAccounts}
                                total={returnCashTotal}
                                accentColor="bg-gradient-to-tr from-emerald-500 to-teal-600"
                                showNumberBranch={false}
                                amountColor="text-emerald-600"
                            />
                            <DetailPanel
                                title="Mobile Banking Return"
                                icon={<FiSmartphone />}
                                accounts={returnMobileAccounts}
                                total={returnMobileTotal}
                                accentColor="bg-gradient-to-tr from-amber-500 to-orange-600"
                                showNumberBranch
                                amountColor="text-emerald-600"
                            />
                            <DetailPanel
                                title="Bank Return"
                                icon={<FiCreditCard />}
                                accounts={returnBankAccounts}
                                total={returnBankTotal}
                                accentColor="bg-gradient-to-tr from-teal-500 to-cyan-600"
                                showNumberBranch
                                amountColor="text-emerald-600"
                            />
                        </div>

                        {returnPays.length === 0 && (
                            <div className="text-center py-12 text-gray-400 font-medium bg-white/60 rounded-3xl border border-white shadow-sm">
                                No purchase return payment data found yet!
                            </div>
                        )}
                    </div>
                )}

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