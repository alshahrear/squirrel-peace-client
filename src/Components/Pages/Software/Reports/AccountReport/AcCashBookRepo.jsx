import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { FiDollarSign, FiArrowDownLeft, FiArrowUpRight } from 'react-icons/fi';
import { buildBatchCostMap, getBulkReturnEffect, getDamageReturnEffect } from '../../../Software/Account/AccountBalance';

const POLL_INTERVAL = 5000;
const API = 'http://localhost:5000';

const n = (v) => Number(v) || 0;
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const fmt = (v) => Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });

const safe = (url) =>
    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

const catOf = (t = '') => {
    const s = String(t).toLowerCase();
    if (s.includes('cash')) return 'Cash';
    if (s.includes('mobile')) return 'Mobile Banking';
    if (s.includes('bank')) return 'Bank';
    return 'Cash';
};

const oidTime = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);

// Different date formats (ISO / dd/mm/yyyy / yyyy-mm-dd) -> timestamp
const toTs = (v) => {
    if (!v) return 0;
    const str = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
        const [d, m, rest] = str.split('/');
        const y = rest.slice(0, 4);
        const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
        return isNaN(t) ? 0 : t;
    }
    const t = Date.parse(str);
    return isNaN(t) ? 0 : t;
};

const pickTs = (...vals) => {
    for (const v of vals) {
        const t = toTs(v);
        if (t) return t;
    }
    return 0;
};

const formatDate = (ts) => {
    if (!ts) return 'N/A';
    const dt = new Date(ts);
    if (isNaN(dt)) return 'N/A';
    return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const toDayKey = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const accOf = (method, a = {}) => ({
    accType: catOf(method),
    accName: (method === 'Bank' ? a.bankName : a.accountName) || a.accountName || a.bankName || 'Cash',
    accNumber: a.accountNumber || '',
    accBranch: a.accountBranch || '',
});

const accOfItem = (i = {}) => ({
    accType: catOf(i.accountType),
    accName: i.accountName || i.bankName || 'Cash',
    accNumber: i.accountNumber || '',
    accBranch: i.accountBranch || '',
});

const getLabel = (acc) => {
    if (acc.accountType === 'Cash') return 'Cash';
    if (acc.accountType === 'Mobile Banking') return `${acc.accountName} (${acc.accountNumber})`;
    if (acc.accountType === 'Bank') return `${acc.bankName} - ${acc.accountNumber} (${acc.accountBranch || 'Main'})`;
    return acc.accountNumber || acc.accountType;
};

const SOURCES = [
    'Opening Account',
    'Adjustment',
    'Income',
    'Expense',
    'Route Expense',
    'Transfer',
    'Purchase',
    'Purchase Return',
    'Purchase Bulk Return',
    'Purchase Damage Return',
    'Purchase Due Payment',
    'Sales',
    'Sales Return',
    'Sales Bulk Return',
    'Sales Damage Return',
    'Sales Due Payment',
];

const AcCashBookRepo = () => {
    const [data, setData] = useState({});
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        source: '',
        direction: '',
        search: '',
    });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const [inv, adj, inc, exp, rexp, tr, pur, bulk, stk, dmg, dueP, sales, sBulk, sDmg, sDue] = await Promise.all([
                safe(`${API}/investment`),
                safe(`${API}/adjustment`),
                safe(`${API}/income`),
                safe(`${API}/expense`),
                safe(`${API}/routeExpense`),
                safe(`${API}/transfer`),
                safe(`${API}/purchase`),
                safe(`${API}/purchase-bulk-return`),
                safe(`${API}/stock-purchase`),
                safe(`${API}/damage-return`),
                safe(`${API}/purchase-due-payment`),
                safe(`${API}/sales`),
                safe(`${API}/sales-bulk-return`),
                safe(`${API}/sales-damage`),
                safe(`${API}/sales-due-payment`),
            ]);
            setData({ inv, adj, inc, exp, rexp, tr, pur, bulk, stk, dmg, dueP, sales, sBulk, sDmg, sDue });
        } catch (e) {
            console.error('Error fetching cash book data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchData]);

    // ---------- Build all transactions (Cash only) ----------
    const rows = useMemo(() => {
        const { inv = [], adj = [], inc = [], exp = [], rexp = [], tr = [], pur = [], bulk = [], stk = [], dmg = [], dueP = [], sales = [], sBulk = [], sDmg = [], sDue = [] } = data;
        const list = [];

        const push = (r) => {
            if (!r.amount) return;
            if (r.accType !== 'Cash') return; // Cash book: only cash transactions
            const m = String(r.id).match(/[0-9a-f]{24}/i);
            list.push({ ...r, ord: r.ord || (m ? oidTime(m[0]) : 0) });
        };

        // Opening Account (Investment)
        inv.forEach((i) => {
            push({
                id: `inv-${i._id}`,
                ts: pickTs(i.date, i.createdAt) || oidTime(i._id),
                source: 'Opening Account',
                ...accOfItem(i),
                description: `Opening balance - ${i.accountName || i.bankName || 'Cash'}${i.accountNumber ? ` (${i.accountNumber})` : ''}${i.note ? ` - ${i.note}` : ''}`,
                amount: n(i.amount),
                isIn: true,
            });
        });

        // Adjustment (Deposit / Withdraw)
        adj.forEach((a) => {
            const rel = inv.find((x) => x._id === a.adjustmentID);
            const acc = rel ? accOfItem(rel) : { accType: 'Cash', accName: 'Cash', accNumber: '', accBranch: '' };
            const isIn = a.mode === 'Deposit';
            push({
                id: `adj-${a._id}`,
                ts: pickTs(a.date, a.createdAt) || oidTime(a._id),
                source: 'Adjustment',
                ...acc,
                description: `Adjustment: ${isIn ? 'Deposit to' : 'Withdraw from'} ${acc.accName}${acc.accNumber ? ` (${acc.accNumber})` : ''}${a.note ? ` - ${a.note}` : ''}`,
                amount: n(a.amount),
                isIn,
            });
        });

        // Income
        inc.forEach((i) => {
            push({
                id: `inc-${i._id}`,
                ts: pickTs(i.date, i.createdAt) || oidTime(i._id),
                source: 'Income',
                ...accOfItem(i),
                description: `Received from ${i.name || 'N/A'} (${i.incomeCategory || 'Income'})${i.invoiceNumber ? ` - Invoice: ${i.invoiceNumber}` : ''}${i.note ? ` - ${i.note}` : ''}`,
                amount: n(i.amount),
                isIn: true,
            });
        });

        // Expense
        exp.forEach((i) => {
            push({
                id: `exp-${i._id}`,
                ts: pickTs(i.date, i.createdAt) || oidTime(i._id),
                source: 'Expense',
                ...accOfItem(i),
                description: `Payment to ${i.name || 'N/A'} (${i.expenseCategory || 'Expense'})${i.invoiceNumber ? ` - Invoice: ${i.invoiceNumber}` : ''}${i.note ? ` - ${i.note}` : ''}`,
                amount: n(i.amount),
                isIn: false,
            });
        });

        // Route Expense
        rexp.forEach((i) => {
            push({
                id: `rexp-${i._id}`,
                ts: pickTs(i.date, i.createdAt) || oidTime(i._id),
                source: 'Route Expense',
                ...accOfItem(i),
                description: `Payment to ${i.name || 'N/A'} (${i.routeExpenseCategory || 'Route Expense'}${i.routeName ? ` - Route: ${i.routeName}` : ''}${i.deliveredBy ? ` - ${i.deliveredBy}` : ''})${i.invoiceNumber ? ` - Invoice: ${i.invoiceNumber}` : ''}${i.note ? ` - ${i.note}` : ''}`,
                amount: n(i.amount),
                isIn: false,
            });
        });

        // Transfer (from account OUT, to account IN)
        const resolveAcc = (type, label) => {
            if (label === 'Cash') {
                const c = inv.find((x) => catOf(x.accountType) === 'Cash');
                return c ? accOfItem(c) : { accType: 'Cash', accName: 'Cash', accNumber: '', accBranch: '' };
            }
            const a = inv.find((x) => x.accountType === type && getLabel(x) === label);
            return a
                ? accOfItem(a)
                : { accType: catOf(type), accName: label || type || 'Cash', accNumber: '', accBranch: '' };
        };
        tr.forEach((t) => {
            const ts = pickTs(t.date, t.createdAt) || oidTime(t._id);
            const from = resolveAcc(t.transferFrom, t.fromAccount);
            const to = resolveAcc(t.transferTo, t.toAccount);
            const fromLabel = t.fromAccount || t.transferFrom || 'Cash';
            const toLabel = t.toAccount || t.transferTo || 'Cash';
            push({
                id: `tr-out-${t._id}`,
                ts,
                source: 'Transfer',
                ...from,
                description: `Transfer to ${toLabel}${t.note ? ` - ${t.note}` : ''}`,
                amount: n(t.amount),
                isIn: false,
            });
            push({
                id: `tr-in-${t._id}`,
                ts,
                source: 'Transfer',
                ...to,
                description: `Transfer from ${fromLabel}${t.note ? ` - ${t.note}` : ''}`,
                amount: n(t.amount),
                isIn: true,
            });
        });

        // Purchase payment (payable >= 0 : we paid, else received)
        pur.forEach((p) => {
            const paid = n(p.paidAmount);
            if (!(paid > 0) || !p.paymentMethod) return;
            const isOut = n(p.payableAmount) >= 0;
            push({
                id: `pur-${p._id}`,
                ord: Date.parse(p.paymentEditedAt || p.paymentDate) || 0,
                ts: pickTs(p.paymentDate, p.purchaseDate, p.createdAt) || oidTime(p._id),
                source: 'Purchase',
                ...accOf(p.paymentMethod, p.paymentAccount || {}),
                description: `${isOut ? 'Payment to' : 'Received from'} ${p.company || 'N/A'} (Invoice: ${p.invoiceNo || 'N/A'})`,
                amount: paid,
                isIn: !isOut,
            });

            // Purchase Return payment
            (p.returnHistory || []).forEach((ret) => {
                const pay = ret.payment;
                if (!pay || !(n(pay.amount) > 0) || !pay.method) return;
                push({
                    id: `pret-${p._id}-${ret.returnId}`,
                    ord: Date.parse(ret.createdAt) || 0,
                    ts: pickTs(ret.createdAt, ret.editedAt) || oidTime(p._id),
                    source: 'Purchase Return',
                    ...accOf(pay.method, pay.account || {}),
                    description: `Received from ${p.company || 'N/A'} (Invoice: ${p.invoiceNo || 'N/A'})`,
                    amount: n(pay.amount),
                    isIn: true,
                });
            });
        });

        // Purchase Bulk Return
        const costMap = buildBatchCostMap(stk, pur);
        bulk.forEach((r) => {
            const eff = getBulkReturnEffect(r, costMap);
            if (!eff) return;
            const note = eff.profit !== 0 ? ` (${fmt(eff.paid)}${eff.profit > 0 ? '+' : '-'}${fmt(Math.abs(eff.profit))} ${eff.profit > 0 ? 'Profit' : 'Loss'})` : '';
            push({
                id: `bulk-${r._id}`,
                ord: Date.parse(r.createdAt) || 0,
                ts: pickTs(r.createdAt, r.returnDate) || oidTime(r._id),
                source: 'Purchase Bulk Return',
                ...accOf(r.payment.method, r.payment.account || {}),
                description: `Received from ${r.company || 'N/A'} (Invoice: ${r.invoiceNo || 'N/A'})${note}`,
                amount: Math.abs(eff.total),
                isIn: eff.total >= 0,
            });
        });

        // Purchase Damage Return
        dmg.forEach((r) => {
            const eff = getDamageReturnEffect(r);
            if (!eff || eff.noAccount) return;
            const note = eff.profit !== 0 ? ` (${fmt(eff.paid)}${eff.profit > 0 ? '+' : '-'}${fmt(Math.abs(eff.profit))} ${eff.profit > 0 ? 'Profit' : 'Loss'})` : '';
            push({
                id: `dmg-${r._id}`,
                ord: Date.parse(r.createdAt) || 0,
                ts: pickTs(r.createdAt, r.returnDate) || oidTime(r._id),
                source: 'Purchase Damage Return',
                ...accOf(r.payment.method, r.payment.account || {}),
                description: `Received from ${r.company || 'N/A'} (Invoice: ${r.invoiceNo || 'N/A'})${note}`,
                amount: Math.abs(eff.total),
                isIn: eff.total >= 0,
            });
        });

        // Purchase Due Payment (Get = in, Pay = out)
        dueP.forEach((p) => {
            if (!(n(p.amount) > 0) || !p.paymentMethod) return;
            const isGet = p?.type === 'Get' || p?.status === 'Get' || p?.paymentAccount?.dueType === 'Get';
            push({
                id: `due-${p._id}`,
                ts: pickTs(p.date, p.createdAt) || oidTime(p._id),
                source: 'Purchase Due Payment',
                ...accOf(p.paymentMethod, p.paymentAccount || {}),
                description: `${isGet ? 'Received from' : 'Payment to'} ${p.company || 'N/A'}${p.invoiceNo ? ` (Invoice: ${p.invoiceNo})` : ''}`,
                amount: r2(p.amount),
                isIn: isGet,
            });
        });

        // Sales (Delivered): payable >= 0 -> received, payable < 0 -> paid
        sales.forEach((s) => {
            if (s.status === 'Delivered') {
                const paid = n(s.paidAmount);
                if (paid > 0 && s.paymentMethod) {
                    const isOut = n(s.payableAmount) < 0;
                    push({
                        id: `sale-${s._id}`,
                        ord: Date.parse(s.deliveredAt || s.createdAt) || 0,
                        ts: pickTs(s.deliveredAt, s.createdAt) || oidTime(s._id),
                        source: 'Sales',
                        ...accOf(s.paymentMethod, s.paymentAccount || {}),
                        description: `${isOut ? 'Payment to' : 'Received from'} ${s.customer || 'N/A'} (Invoice: ${s.invoiceNo || s.orderNo || 'N/A'})`,
                        amount: paid,
                        isIn: !isOut,
                    });
                }
            }

            // Sales Return payment (out)
            (s.returnHistory || []).forEach((ret) => {
                const pay = ret.payment;
                if (!pay || !(n(pay.amount) > 0) || !pay.method) return;
                push({
                    id: `sret-${s._id}-${ret.returnId}`,
                    ord: Date.parse(ret.createdAt) || 0,
                    ts: pickTs(ret.createdAt, ret.editedAt) || oidTime(s._id),
                    source: 'Sales Return',
                    ...accOf(pay.method, pay.account || {}),
                    description: `Payment to ${s.customer || 'N/A'} (Invoice: ${s.invoiceNo || s.orderNo || 'N/A'})`,
                    amount: n(pay.amount),
                    isIn: false,
                });
            });
        });

        // Sales Bulk Return (out)
        sBulk.forEach((r) => {
            const pay = r.payment;
            if (!pay || !(n(pay.amount) > 0) || !pay.method) return;
            push({
                id: `sbulk-${r._id}`,
                ord: Date.parse(r.createdAt) || 0,
                ts: pickTs(r.createdAt, r.returnDate) || oidTime(r._id),
                source: 'Sales Bulk Return',
                ...accOf(pay.method, pay.account || {}),
                description: `Payment to ${r.customer || 'N/A'} (Invoice: ${r.invoiceNo || r.orderNo || 'N/A'})`,
                amount: n(pay.amount),
                isIn: false,
            });
        });

        // Sales Damage Return (customer damage only, out)
        sDmg.forEach((d) => {
            if (!d.customerId) return;
            const pay = d.payment;
            if (!pay || !(n(pay.amount) > 0) || !pay.method) return;
            push({
                id: `sdmg-${d._id}`,
                ord: Date.parse(d.createdAt) || 0,
                ts: pickTs(d.createdAt, d.returnDate) || oidTime(d._id),
                source: 'Sales Damage Return',
                ...accOf(pay.method, pay.account || {}),
                description: `Payment to ${d.customer || 'N/A'} (Invoice: ${d.invoiceNo || 'N/A'})`,
                amount: n(pay.amount),
                isIn: false,
            });
        });

        // Sales Due Payment (Get = in, Pay = out)
        sDue.forEach((p) => {
            if (!(n(p.amount) > 0) || !p.paymentMethod) return;
            const isPay = p?.type === 'Pay' || p?.status === 'Pay' || p?.paymentAccount?.dueType === 'Pay';
            push({
                id: `sdue-${p._id}`,
                ts: pickTs(p.date, p.createdAt) || oidTime(p._id),
                source: 'Sales Due Payment',
                ...accOf(p.paymentMethod, p.paymentAccount || {}),
                description: `${isPay ? 'Payment to' : 'Received from'} ${p.customer || 'N/A'}${p.invoiceNo ? ` (Invoice: ${p.invoiceNo})` : ''}`,
                amount: r2(p.amount),
                isIn: !isPay,
            });
        });

        return list.sort((a, b) => (b.ord - a.ord) || (b.ts - a.ts));
    }, [data]);

    // ---------- Filters ----------
    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setFilter(e.target.name, e.target.value);
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', source: '', direction: '', search: '' });
        setCurrentPage(1);
    };

    const filtered = rows.filter((r) => {
        const day = toDayKey(r.ts);
        if (filters.startDate && (!day || day < filters.startDate)) return false;
        if (filters.endDate && (!day || day > filters.endDate)) return false;
        if (filters.source && r.source !== filters.source) return false;
        if (filters.direction === 'in' && !r.isIn) return false;
        if (filters.direction === 'out' && r.isIn) return false;
        if (filters.search && !String(r.description || '').toLowerCase().includes(filters.search.toLowerCase())) return false;
        return true;
    });

    const totalIn = r2(filtered.filter((r) => r.isIn).reduce((s, r) => s + r.amount, 0));
    const totalOut = r2(filtered.filter((r) => !r.isIn).reduce((s, r) => s + r.amount, 0));
    const net = r2(totalIn - totalOut);

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const handlePageChange = (num) => {
        if (num >= 1 && num <= totalPages) setCurrentPage(num);
    };

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Cash Book
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">শুধুমাত্র Cash এ আসা ও যাওয়া সব transaction এর তারিখ অনুযায়ী হিসাব</p>
                    </div>
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Updating
                    </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-emerald-500 to-teal-600">
                        <p className="text-sm text-white/80">Total In (Cash এ ঢুকেছে)</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totalIn)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-rose-500 to-red-600">
                        <p className="text-sm text-white/80">Total Out (Cash থেকে বের)</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totalOut)}</p>
                    </div>
                    <div className={`rounded-3xl shadow-xl p-6 text-white ${net < 0 ? 'bg-gradient-to-br from-orange-500 to-rose-500' : 'bg-gradient-to-br from-sky-500 to-blue-600'}`}>
                        <p className="text-sm text-white/80">Net Effect (In - Out)</p>
                        <p className="text-2xl font-extrabold mt-1">{net < 0 ? '-' : ''}৳ {fmt(Math.abs(net))}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Transactions</p>
                        <p className="text-2xl font-extrabold mt-1">{filtered.length}</p>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Cash Book Report</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filtered.length > 0 ? `${start + 1}-${Math.min(start + itemsPerPage, filtered.length)}` : 0} of {filtered.length} ({rows.length} total)
                        </span>
                    </div>

                    {/* Filter Panel */}
                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                            >
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {/* Start Date */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
                                >
                                    <input
                                        ref={startDateRef}
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
                                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select start date"
                                        value={displayFormattedDate(filters.startDate)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* End Date */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}
                                >
                                    <input
                                        ref={endDateRef}
                                        type="date"
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
                                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select end date"
                                        value={displayFormattedDate(filters.endDate)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* Source */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Source</label>
                                <select
                                    name="source"
                                    value={filters.source}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {SOURCES.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Direction */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">In / Out</label>
                                <select
                                    name="direction"
                                    value={filters.direction}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="in">Received (In)</option>
                                    <option value="out">Payment (Out)</option>
                                </select>
                            </div>

                            {/* Description search */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Description</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="search"
                                        placeholder="Search name / invoice..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                    />
                                    {filters.search && (
                                        <button
                                            type="button"
                                            onClick={() => setFilter('search', '')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading cash book...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No transaction found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="px-3 py-3">#</th>
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-3 py-3">Source</th>
                                        <th className="px-3 py-3">Description</th>
                                        <th className="px-3 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {current.map((r, i) => (
                                        <tr key={r.id} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="px-3 py-3 text-gray-400">{start + i + 1}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600 font-medium">{formatDate(r.ts)}</td>
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100 text-[11px] font-semibold">
                                                    {r.source}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 font-medium text-gray-700 min-w-[260px]">
                                                <span className="inline-flex items-center gap-1 mr-2 px-2 py-0.5 rounded-full border text-[10px] font-semibold bg-emerald-50 text-emerald-700 border-emerald-100">
                                                    <FiDollarSign className="w-3 h-3" /> Cash
                                                </span>
                                                {r.description}
                                            </td>
                                            <td className={`px-3 py-3 text-right font-extrabold whitespace-nowrap ${r.isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                <span className="inline-flex items-center gap-1">
                                                    {r.isIn ? <FiArrowDownLeft /> : <FiArrowUpRight />}
                                                    {r.isIn ? '+' : '-'}৳ {fmt(r.amount)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                                        }`}
                                >
                                    Next <FaChevronRight size={10} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AcCashBookRepo;