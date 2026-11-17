import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaClock, FaEdit, FaBalanceScale, FaBuilding, FaArrowUp, FaArrowDown,
    FaFileInvoice, FaUndoAlt, FaBoxOpen, FaExclamationTriangle, FaMoneyBillWave,
} from 'react-icons/fa';
import CompanyDuePayAc from './CompanyDuePayAc';
import {
    LedgerShell, EntitySelector, LedgerTabs, EmptyEntity,
    FilterPanel, ListCard, LedgerTable, PopStyle, Tag, NotUsed, MethodPill, InvoiceLink, fmt,
} from '../LedgerUi';

// ---------- Static helpers ----------
const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const sumItems = (items) =>
    (items || []).reduce((s, it) => s + (Number(it.itemTotal ?? it.subtotal) || 0), 0);
const sameCompany = (a, b) =>
    String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const formatDateOnly = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date)) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const parseToLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const str = String(dateStr);
    if (str.includes('T')) {
        const t = new Date(str);
        return isNaN(t) ? null : new Date(t.getFullYear(), t.getMonth(), t.getDate());
    }
    const datePart = str.split(',')[0].trim();
    if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        if (!d || !m || !y) return null;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
        const [y, m, d] = datePart.split('-');
        return new Date(Number(y), Number(m) - 1, Number(d.slice(0, 2)));
    }
    const parsed = new Date(datePart);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const idTimeOf = (id) => {
    const t = parseInt(String(id || '').slice(0, 8), 16) * 1000;
    return isNaN(t) ? 0 : t;
};

const getInvoiceNo = (p) => {
    if (p.invoiceNo) return p.invoiceNo;
    const pad = (n) => String(n).padStart(2, '0');
    let d = null;
    const m = String(p.createdAt || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),\s*(\d{1,2}):(\d{2}):(\d{2})\s*(am|pm)/i);
    if (m) {
        let h = Number(m[4]) % 12;
        if (m[7].toLowerCase() === 'pm') h += 12;
        d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]), h, Number(m[5]), Number(m[6]));
    } else if (p._id) {
        const t = parseInt(String(p._id).slice(0, 8), 16) * 1000;
        if (!isNaN(t)) d = new Date(t);
    }
    if (!d || isNaN(d)) return '';
    return `${pad(d.getFullYear() % 100)}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
};

const accountLabel = (method, acc = {}) => {
    if (method === 'Purchase Adjustment') return 'Adjusted in Purchase Bill';
    if (method === 'Bank') {
        return (
            [acc.bankName, acc.accountNumber].filter(Boolean).join(' - ') +
            (acc.accountBranch ? ` (${acc.accountBranch})` : '')
        );
    }
    if (method === 'Mobile Banking') return [acc.accountName, acc.accountNumber].filter(Boolean).join(' - ');
    return acc.accountName || 'Cash';
};

// ---------- Shared company balance (PurchaseAdd o eta use kore) ----------
export const calcCompanyBalance = (
    { purchases = [], bulkReturns = [], damageReturns = [], duePayments = [], companies = [] },
    company,
    excludePurchaseId = null
) => {
    if (!String(company || '').trim()) return { pay: 0, get: 0, net: 0, amount: 0, type: '' };
    const same = (a) => sameCompany(a, company);
    const isRecv = (p) => p.receiveStatus === 'Received' || p.receiveStatus === 'Yes';
    const skip = (p) => excludePurchaseId && String(p._id) === String(excludePurchaseId);
    let pay = 0;
    let get = 0;

    // Opening balance
    const info = companies.find((c) => same(c.businessName));
    const openAmt = r2(num(info?.openingBalance));
    const openType = String(info?.openingBalanceType || '').trim().toLowerCase();
    if (openAmt > 0 && openType === 'pay') pay += openAmt;
    if (openAmt > 0 && openType === 'get') get += openAmt;

    // Purchase payments
    purchases.forEach((p) => {
        if (skip(p)) return;
        if (!same(p.company)) return;
        if (p.paidAmount === undefined || p.paidAmount === null || p.paidAmount === '' || !p.paymentMethod) return;
        const prev = num(p.previousBalanceAmount);
        let payable = num(p.payableAmount);
        if (p.previousBalanceType === 'Due') payable -= prev;
        else if (p.previousBalanceType === 'Get') payable += prev;
        const paid = num(p.paidAmount);
        const recvd = isRecv(p);
        if (num(p.payableAmount) < 0) {
            pay += (recvd ? Math.max(payable, 0) : 0) + paid;
            get += Math.max(-payable, 0);
        } else {
            pay += recvd ? Math.max(payable - paid, 0) : 0;
            get += recvd ? Math.max(paid - payable, 0) : paid;
        }
    });

    // Purchase return
    purchases.forEach((order) => {
        if (!same(order.company)) return;
        (order.returnHistory || []).forEach((ret) => {
            if ((ret.status || 'Approved') === 'Pending') return;
            const amt = num(ret.totalReturnAmount);
            const rec = ret.payment ? num(ret.payment.amount) : 0;
            pay += Math.max(rec - amt, 0);
            get += Math.max(amt - rec, 0);
        });
    });

    // Bulk return
    bulkReturns.forEach((b) => {
        if (!same(b.company)) return;
        if (excludePurchaseId && b.fromPurchase === true && String(b.purchaseId) === String(excludePurchaseId)) return;
        if (b.fromPurchase !== true && (b.status || 'Approved') === 'Pending') return;
        const adj =
            b.fromPurchase === true
                ? num(purchases.find((p) => String(p._id) === String(b.purchaseId))?.returnAdjustmentAmount)
                : 0;
        const rec = adj > 0 ? adj : b.payment ? num(b.payment.amount) : 0;
        const amt = num(b.returnAmount);
        pay += Math.max(rec - amt, 0);
        get += Math.max(amt - rec, 0);
    });

    // Damage return (standalone)
    damageReturns.forEach((d) => {
        if (!same(d.company)) return;
        if (d.status !== 'Approved') return;
        const amt = num(d.damageAmount) || num(d.returnAmount) || sumItems(d.items);
        const rec = d.payment ? num(d.payment.amount) : 0;
        pay += Math.max(rec - amt, 0);
        get += Math.max(amt - rec, 0);
    });

    // Damage return (from purchase)
    purchases.forEach((p) => {
        if (skip(p)) return;
        if (!same(p.company)) return;
        if (!isRecv(p)) return;
        if (!(p.damageItems || []).length) return;
        if (!(num(p.damageAdjustmentAmount) > 0 || p.damageStatus === 'Approved')) return;
        const amt = sumItems(p.damageItems);
        const rec = num(p.damageAdjustmentAmount);
        pay += Math.max(rec - amt, 0);
        get += Math.max(amt - rec, 0);
    });

    // Company due payment
    duePayments.forEach((d) => {
        if (!same(d.company)) return;
        const amt = r2(num(d.amount));
        const isGet = d.type === 'Get' || d.status === 'Get' || d.paymentAccount?.dueType === 'Get';
        if (isGet) pay += amt;
        else get += amt;
    });

    const net = r2(pay - get);
    return {
        pay: r2(pay),
        get: r2(get),
        net,
        amount: Math.abs(net),
        type: net > 0 ? 'Due' : net < 0 ? 'Get' : '',
    };
};

const safeList = (url) =>
    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

// Fresh data fetch kore balance dey (refresh lagbe na)
export const fetchCompanyBalance = async (company, excludePurchaseId = null) => {
    const [purchases, bulkReturns, damageReturns, companies, duePayments] = await Promise.all([
        safeList('http://localhost:5000/purchase'),
        safeList('http://localhost:5000/purchase-bulk-return'),
        safeList('http://localhost:5000/damage-return'),
        safeList('http://localhost:5000/company'),
        safeList('http://localhost:5000/purchase-due-payment'),
    ]);
    return calcCompanyBalance(
        { purchases, bulkReturns, damageReturns, companies, duePayments },
        company,
        excludePurchaseId
    );
};

const TABS = [
    { key: 'purchase', label: 'Company Purchase', icon: FaFileInvoice, tone: 'brand' },
    { key: 'purReturn', label: 'Purchase Return AC', icon: FaUndoAlt, tone: 'amber' },
    { key: 'bulk', label: 'Bulk Return AC', icon: FaBoxOpen, tone: 'violet' },
    { key: 'damage', label: 'Damage Return AC', icon: FaExclamationTriangle, tone: 'rose' },
    { key: 'duePay', label: 'Company Due Payment', icon: FaMoneyBillWave, tone: 'emerald' },
];

const Dash = <span className="text-slate-300">—</span>;
const EditedTag = ({ value }) => (
    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
        <FaEdit size={10} /> Edited: {formatDateOnly(value)}
    </span>
);

const EMPTY_FILTERS = { startDate: '', endDate: '', invoiceNo: '', paymentMethod: '', status: '' };

const TONE_ICON = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
};

// ---------- Main ----------
const CompanyAccountAc = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [purchases, setPurchases] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // company selector
    const [query, setQuery] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');

    // tabs / filters / pagination
    const [activeTab, setActiveTab] = useState('purchase');
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // ---------- Fetch ----------
    useEffect(() => {
        const loadData = async () => {
            try {
                const [dpRes, pRes, bRes, dRes, cRes] = await Promise.all([
                    fetch('http://localhost:5000/purchase-due-payment'),
                    fetch('http://localhost:5000/purchase'),
                    fetch('http://localhost:5000/purchase-bulk-return'),
                    fetch('http://localhost:5000/damage-return'),
                    fetch('http://localhost:5000/company'),
                ]);
                const dpData = await dpRes.json();
                const pData = await pRes.json();
                const bData = await bRes.json();
                const dData = await dRes.json();
                const cData = await cRes.json();
                setPurchases(Array.isArray(pData) ? pData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setDamageReturns(Array.isArray(dData) ? dData : []);
                setCompanies(Array.isArray(cData) ? cData : []);
                setDuePayments(Array.isArray(dpData) ? dpData : []);
            } catch (error) {
                console.error('Error fetching company account:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [location.pathname]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCompany, activeTab, filters]);

    useEffect(() => {
        setFilters(EMPTY_FILTERS);
    }, [selectedCompany, activeTab]);

    // ---------- Company options ----------
    const companyNames = (() => {
        const seen = new Map();
        const put = (n) => {
            const name = String(n || '').trim();
            if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
        };
        const phoneOf = (name) =>
            companies.find((c) => sameCompany(c.businessName, name))?.contactNumber || '';
        companies.forEach((c) => put(c.businessName));
        duePayments.forEach((d) => put(d.company));
        purchases.forEach((p) => put(p.company));
        bulkReturns.forEach((b) => put(b.company));
        damageReturns.forEach((d) => put(d.company));
        return [...seen.values()].map((name) => ({ name, phone: phoneOf(name) }));
    })();

    const companyOptions = companyNames.filter((c) => {
        const s = query.trim().toLowerCase();
        return c.name.toLowerCase().includes(s) || (c.phone || '').toLowerCase().includes(s);
    });
    const companyInfo = companies.find((c) => sameCompany(c.businessName, selectedCompany));

    // Opening balance (faka thakle 0)
    const openingAmount = r2(num(companyInfo?.openingBalance));
    const openingTypeRaw = String(companyInfo?.openingBalanceType || '').trim().toLowerCase();
    const openingType =
        openingAmount > 0 && openingTypeRaw === 'pay' ? 'Pay' : openingAmount > 0 && openingTypeRaw === 'get' ? 'Get' : '';
    const openingPay = openingType === 'Pay' ? openingAmount : 0;
    const openingGet = openingType === 'Get' ? openingAmount : 0;

    const handleSelectCompany = (name) => {
        setSelectedCompany(name);
        setQuery(name);
    };

    const handleClearCompany = () => {
        setSelectedCompany('');
        setQuery('');
        setActiveTab('purchase');
    };

    const handleQuery = (v) => {
        setQuery(v);
        if (selectedCompany) {
            setSelectedCompany('');
            setActiveTab('purchase');
        }
    };

    // ---------- Build rows (all companies) ----------
    // 1) Purchase payments
    const purchaseAll = purchases
        .filter((p) => p.paidAmount !== undefined && p.paidAmount !== null && p.paidAmount !== '' && !!p.paymentMethod)
        .map((p) => {
            const prevBal = num(p.previousBalanceAmount);
            const payable =
                num(p.payableAmount) -
                (p.previousBalanceType === 'Due' ? prevBal : 0) +
                (p.previousBalanceType === 'Get' ? prevBal : 0);
            const fullPayable = num(p.payableAmount);
            const paid = num(p.paidAmount);
            // Table e dekhabe: Payable (Previous Due/Get shoho) - Paid
            const isRecv = p.receiveStatus === 'Received' || p.receiveStatus === 'Yes';
            const due = fullPayable < 0
                ? Math.max(r2(paid + fullPayable), 0)
                : !isRecv ? 0 : Math.max(r2(fullPayable - paid), 0);
            const extra = fullPayable < 0
                ? Math.max(r2(-fullPayable - paid), 0)
                : !isRecv ? paid : Math.max(r2(paid - fullPayable), 0);
            // Balance (Pay/Get card) er jonno: Previous Due/Get bade
            const balDue = fullPayable < 0
                ? (isRecv ? Math.max(r2(payable), 0) : 0) + paid
                : !isRecv ? 0 : Math.max(r2(payable - paid), 0);
            const balExtra = fullPayable < 0
                ? Math.max(r2(-payable), 0)
                : !isRecv ? paid : Math.max(r2(paid - payable), 0);
            return {
                key: p._id,
                id: p._id,
                company: p.company,
                invoiceNo: p.invoiceNo,
                purchaseDate: p.purchaseDate,
                receiveDate: p.receiveDate,
                paymentDate: p.paymentDate || p.receiveDate || p.purchaseDate,
                paymentEditedAt: p.paymentEditedAt,
                method: p.paymentMethod,
                methodKey: p.paymentMethod,
                account: accountLabel(p.paymentMethod, p.paymentAccount || {}),
                total: fullPayable < 0 ? 0 : fullPayable,
                receivable: fullPayable < 0 ? -fullPayable : 0,
                isReceivable: fullPayable < 0,
                paid: fullPayable < 0 ? 0 : paid,
                received: fullPayable < 0 ? paid : 0,
                due,
                extra,
                pay: balDue,
                get: balExtra,
                damageAdj: num(p.damageAdjustmentAmount),
                bulkAdj: num(p.returnAdjustmentAmount),
                prevAdjAmount: prevBal,
                prevAdjType: p.previousBalanceType,
                dateRaw: p.paymentDate || p.receiveDate || p.purchaseDate || '',
                time: p.paymentDate && !isNaN(new Date(p.paymentDate).getTime())
                    ? new Date(p.paymentDate).getTime()
                    : idTimeOf(p._id),
            };
        });

    // helper for return type rows
    const makeReturnRow = (base, amt, payment) => {
        const received = payment ? num(payment.amount) : 0;
        const due = Math.max(received - amt, 0); // company ke beshi dite hobe (Pay)
        const extra = Math.max(amt - received, 0); // company theke ami pabo (Get)
        return {
            ...base,
            payment,
            method: payment?.method || '',
            methodKey: payment?.method || 'NotUsed',
            account: payment ? accountLabel(payment.method, payment.account || {}) : '',
            total: amt,
            paid: received,
            due,
            extra,
            pay: due,
            get: extra,
        };
    };

    // 2) Purchase return
    const purReturnAll = [];
    purchases.forEach((order) => {
        (order.returnHistory || []).forEach((ret) => {
            if ((ret.status || 'Approved') === 'Pending') return;
            const createdMs = ret.createdAt ? new Date(ret.createdAt).getTime() : NaN;
            const idMatch = String(ret.returnId || '').match(/\d{13}/);
            const d = parseToLocalDate(ret.returnDate);
            const time = !isNaN(createdMs) ? createdMs : idMatch ? Number(idMatch[0]) : d ? d.getTime() : 0;
            purReturnAll.push(
                makeReturnRow(
                    {
                        key: `${order._id}-${ret.returnId}`,
                        company: order.company,
                        invoiceNo: order.invoiceNo,
                        returnDate: ret.returnDate,
                        dateRaw: ret.returnDate,
                        editedAt: ret.editedAt,
                        fromPurchase: false,
                        nav: { path: `/purchase-return-view/${order._id}?returnId=${ret.returnId}` },
                        time,
                    },
                    num(ret.totalReturnAmount),
                    ret.payment || null
                )
            );
        });
    });

    // 3) Bulk return
    const rowTimeOf = (createdAt, id, returnDate) => {
        if (createdAt) {
            const c = new Date(createdAt).getTime();
            if (!isNaN(c)) return c;
        }
        const it = idTimeOf(id);
        if (it > 0) return it;
        const d = parseToLocalDate(returnDate);
        return d ? d.getTime() : 0;
    };

    const bulkAll = bulkReturns
        .filter((b) => b.fromPurchase === true || (b.status || 'Approved') !== 'Pending')
        .map((b) => {
            const adj =
                b.fromPurchase === true
                    ? num(purchases.find((p) => String(p._id) === String(b.purchaseId))?.returnAdjustmentAmount)
                    : 0;
            const payment = adj > 0 ? { amount: adj, method: 'Purchase Adjustment', account: {} } : b.payment || null;
            const fromPurchase = b.fromPurchase === true;
            return makeReturnRow(
                {
                    key: b._id,
                    company: b.company,
                    invoiceNo: b.invoiceNo,
                    returnDate: b.returnDate,
                    dateRaw: b.returnDate,
                    editedAt: b.editedAt,
                    fromPurchase,
                    nav: fromPurchase && b.purchaseId
                        ? { path: `/purchase-details/${b.purchaseId}`, state: { scrollToReturn: true } }
                        : { path: `/purchase-bulk-return-view/${b._id}` },
                    time: rowTimeOf(b.createdAt, b._id, b.returnDate),
                },
                num(b.returnAmount),
                payment
            );
        });

    // 4) Damage return (shudhu Approved / Auto Approved)
    const damageAll = [
        ...damageReturns.filter((d) => d.status === 'Approved').map((d) =>
            makeReturnRow(
                {
                    key: `dr-${d._id}`,
                    company: d.company,
                    invoiceNo: d.invoiceNo,
                    returnDate: d.returnDate,
                    dateRaw: d.returnDate,
                    editedAt: d.editedAt,
                    fromPurchase: false,
                    nav: { path: `/damage-return-details/${d._id}` },
                    time: rowTimeOf(d.createdAt, d._id, d.returnDate),
                },
                num(d.damageAmount) || num(d.returnAmount) || sumItems(d.items),
                d.payment || null
            )
        ),
        ...purchases
            .filter(
                (p) =>
                    (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') &&
                    (p.damageItems || []).length > 0 &&
                    (num(p.damageAdjustmentAmount) > 0 || p.damageStatus === 'Approved')
            )
            .map((p) => {
                const adj = num(p.damageAdjustmentAmount);
                return makeReturnRow(
                    {
                        key: `pu-${p._id}`,
                        company: p.company,
                        invoiceNo: p.invoiceNo,
                        returnDate: p.receiveDate || p.purchaseDate,
                        dateRaw: p.receiveDate || p.purchaseDate,
                        editedAt: null,
                        fromPurchase: true,
                        nav: { path: `/purchase-details/${p._id}`, state: { scrollTo: 'damage-products-section' } },
                        time: rowTimeOf(p.damageAt || p.createdAt, p._id, p.receiveDate || p.purchaseDate),
                    },
                    sumItems(p.damageItems),
                    adj > 0 ? { amount: adj, method: 'Purchase Adjustment', account: {} } : null
                );
            }),
    ];

    // 5) Company due payment (ami company ke je taka pay korechi)
    const duePayAll = duePayments.map((p) => {
        const amt = r2(num(p.amount));
        const isGet = p.type === 'Get' || p.status === 'Get' || p.paymentAccount?.dueType === 'Get';
        return {
            key: `dp-${p._id}`,
            company: p.company,
            invoiceNo: getInvoiceNo(p),
            date: p.date,
            dateRaw: p.date,
            method: p.paymentMethod,
            methodKey: p.paymentMethod,
            account: accountLabel(p.paymentMethod, p.paymentAccount || {}),
            total: amt,
            paid: amt,
            due: 0,
            extra: 0,
            // ami pay korechi -> Pay balance theke kome jabe (ulta korte chaile pay: amt, get: 0 koro)
            pay: isGet ? amt : 0,
            get: isGet ? 0 : amt,
            status: isGet ? 'Get' : 'Pay',
            time: idTimeOf(p._id) || (parseToLocalDate(p.date)?.getTime() || 0),
        };
    });

    // ---------- Selected company data ----------
    const hasCompany = !!selectedCompany;
    const forCompany = (list) =>
        hasCompany
            ? list.filter((r) => sameCompany(r.company, selectedCompany)).sort((a, b) => b.time - a.time)
            : [];

    const data = {
        purchase: forCompany(purchaseAll),
        purReturn: forCompany(purReturnAll),
        bulk: forCompany(bulkAll),
        damage: forCompany(damageAll),
        duePay: forCompany(duePayAll),
    };

    const sourceBalance = (rows) => ({
        pay: r2(rows.reduce((s, r) => s + r.pay, 0)),
        get: r2(rows.reduce((s, r) => s + r.get, 0)),
    });
    const balances = {
        purchase: sourceBalance(data.purchase),
        purReturn: sourceBalance(data.purReturn),
        bulk: sourceBalance(data.bulk),
        damage: sourceBalance(data.damage),
        duePay: sourceBalance(data.duePay),
    };

    // Final: opening balance + sob mile katakati, ekta 0 hobe
    const finalBalance = calcCompanyBalance(
        { purchases, bulkReturns, damageReturns, duePayments, companies },
        selectedCompany
    );
    const finalPay = finalBalance.net > 0 ? finalBalance.net : 0;
    const finalGet = finalBalance.net < 0 ? -finalBalance.net : 0;

    // ---------- Current tab rows ----------
    const currentAll = data[activeTab] || [];

    const filteredRows = currentAll.filter((r) => {
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(r.dateRaw);
            if (!d) return false;
            if (filters.startDate && d < parseToLocalDate(filters.startDate)) return false;
            if (filters.endDate && d > parseToLocalDate(filters.endDate)) return false;
        }
        if (filters.invoiceNo && !String(r.invoiceNo || '').toLowerCase().includes(filters.invoiceNo.toLowerCase()))
            return false;
        if (filters.paymentMethod && r.methodKey !== filters.paymentMethod) return false;
        if (filters.status && r.status !== filters.status) return false;
        return true;
    });

    const methodOptions = [...new Set(currentAll.map((r) => r.methodKey).filter(Boolean))];

    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    const sTotal = filteredRows.reduce((s, r) => s + r.total, 0);
    const sPaid = filteredRows.reduce((s, r) => s + r.paid, 0);
    const sDue = filteredRows.reduce((s, r) => s + r.due, 0);
    const sExtra = filteredRows.reduce((s, r) => s + r.extra, 0);
    const sReceivable = filteredRows.reduce((s, r) => s + (r.receivable || 0), 0);
    const sReceived = filteredRows.reduce((s, r) => s + (r.received || 0), 0);

    const isPurchaseTab = activeTab === 'purchase';
    const showReceive = isPurchaseTab && currentAll.some((r) => r.isReceivable);
    const isDuePayTab = activeTab === 'duePay';
    const tabMeta = TABS.find((t) => t.key === activeTab) || TABS[0];
    const pillLabels = isPurchaseTab
        ? ['Payable', 'Paid', 'Pay', 'Get']
        : ['Return', 'Received', 'Pay', 'Get'];

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const handleClearFilters = () => setFilters(EMPTY_FILTERS);

    // ---------- Columns ----------
    const purchaseCols = [
        {
            key: 'date',
            label: 'Date',
            cell: (r) => (
                <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div className="font-medium">Purchase : {r.purchaseDate || 'N/A'}</div>
                    <div>
                        {r.receiveDate ? (
                            <span>Received: {r.receiveDate}</span>
                        ) : (
                            <Tag tone="amber">Not Received</Tag>
                        )}
                    </div>
                    <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <FaClock className="text-emerald-500" size={10} />
                        Paid: {formatDateOnly(r.paymentDate) || 'N/A'}
                    </div>
                    {r.paymentEditedAt && (
                        <div>
                            <EditedTag value={r.paymentEditedAt} />
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'inv',
            label: 'Invoice',
            cell: (r) => (
                <div className="flex flex-col items-start md:items-start gap-1">
                    <InvoiceLink onClick={() => navigate(`/purchase-details/${r.id}`)}>{r.invoiceNo}</InvoiceLink>
                    {r.damageAdj > 0 && <Tag tone="rose">Damage Adjusted: ৳ {fmt(r.damageAdj)}</Tag>}
                    {r.bulkAdj > 0 && <Tag tone="violet">Bulk Adjusted: ৳ {fmt(r.bulkAdj)}</Tag>}
                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Due' && (
                        <Tag tone="rose">Due Adjusted: ৳ {fmt(r.prevAdjAmount)}</Tag>
                    )}
                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Get' && (
                        <Tag tone="sky">Get Adjusted: ৳ {fmt(r.prevAdjAmount)}</Tag>
                    )}
                </div>
            ),
        },
        { key: 'method', label: 'Payment Method', cell: (r) => <MethodPill>{r.method}</MethodPill> },
        {
            key: 'account',
            label: 'Payment Account',
            cell: (r) => r.account || <span className="text-slate-400 italic">N/A</span>,
        },
        {
            key: 'payable',
            label: 'Payable Amount',
            cls: 'font-semibold text-brand-600',
            cell: (r) => (r.isReceivable ? Dash : `৳ ${fmt(r.total)}`),
        },
        ...(showReceive
            ? [{
                key: 'receivable',
                label: 'Receivable Amount',
                cls: 'font-semibold text-sky-600',
                cell: (r) => (r.isReceivable ? `৳ ${fmt(r.receivable)}` : Dash),
            }]
            : []),
        {
            key: 'paid',
            label: 'Paid Amount',
            cls: 'font-semibold text-emerald-600',
            cell: (r) => (r.isReceivable ? Dash : `৳ ${fmt(r.paid)}`),
        },
        ...(showReceive
            ? [{
                key: 'received',
                label: 'Receive Amount',
                cls: 'font-semibold text-sky-600',
                cell: (r) => (r.isReceivable ? `৳ ${fmt(r.received)}` : Dash),
            }]
            : []),
        { key: 'pay', label: 'Pay Amount', cls: 'font-semibold text-rose-600', cell: (r) => `৳ ${fmt(r.due)}` },
        { key: 'get', label: 'Get Amount', cls: 'font-semibold text-sky-600', cell: (r) => `৳ ${fmt(r.extra)}` },
    ];

    const returnCols = [
        {
            key: 'date',
            label: 'Date',
            cell: (r) => (
                <div className="text-[11px] space-y-0.5">
                    <div className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                        <FaClock className="text-orange-500" size={10} />
                        Return: {r.returnDate || 'N/A'}
                    </div>
                    {r.editedAt && (
                        <div>
                            <EditedTag value={r.editedAt} />
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: 'inv',
            label: 'Invoice',
            cell: (r) => (
                <div className="flex flex-col items-end md:items-start gap-1">
                    <InvoiceLink onClick={() => navigate(r.nav.path, r.nav.state ? { state: r.nav.state } : undefined)}>
                        {r.invoiceNo}
                    </InvoiceLink>
                    {r.fromPurchase && <Tag tone="violet">From Purchase</Tag>}
                </div>
            ),
        },
        {
            key: 'method',
            label: 'Payment Method',
            cell: (r) => (r.payment ? <MethodPill>{r.method}</MethodPill> : <NotUsed />),
        },
        {
            key: 'account',
            label: 'Payment Account',
            cell: (r) =>
                r.payment ? r.account || <span className="text-slate-400 italic">N/A</span> : <NotUsed />,
        },
        { key: 'ret', label: 'Return Amount', cls: 'font-semibold text-orange-600', cell: (r) => `৳ ${fmt(r.total)}` },
        {
            key: 'recv',
            label: 'Return Received Amount',
            cls: 'font-semibold text-emerald-600',
            cell: (r) => (r.payment ? `৳ ${fmt(r.paid)}` : <NotUsed />),
        },
        {
            key: 'pay',
            label: 'Return Pay Amount',
            cls: `font-semibold ${'text-rose-600'}`,
            cell: (r) => `৳ ${fmt(r.due)}`,
        },
        { key: 'get', label: 'Return Get Amount', cls: 'font-semibold text-sky-600', cell: (r) => `৳ ${fmt(r.extra)}` },
    ];

    const chips = [
        { label: isDuePayTab ? 'Total Paid' : pillLabels[0], value: sTotal },
        ...(showReceive ? [{ label: 'Receivable', value: sReceivable }, { label: 'Receive', value: sReceived }] : []),
        ...(!isDuePayTab
            ? [
                { label: pillLabels[1], value: sPaid },
                { label: pillLabels[2], value: sDue },
                { label: pillLabels[3], value: sExtra },
            ]
            : []),
    ];

    return (
        <LedgerShell
            title="Company Account"
            subtitle="Select a company to see opening balance, purchase, returns, damage and the final Pay / Get balance."
        >
            <PopStyle />

            <EntitySelector
                label="Select Company"
                icon={FaBuilding}
                placeholder="Search company by name or phone..."
                query={query}
                onQuery={handleQuery}
                onClear={handleClearCompany}
                options={companyOptions}
                selected={selectedCompany}
                onPick={handleSelectCompany}
                loading={loading}
                chips={[
                    companyInfo?.contactNumber ? `📞 ${companyInfo.contactNumber}` : '',
                    companyInfo?.address ? `📍 ${companyInfo.address}` : '',
                ]}
            />

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <div className="rounded-xl p-3 sm:p-4 bg-gradient-to-br from-rose-500 to-orange-500 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold">Pay Amount</span>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <FaArrowUp size={10} />
                        </span>
                    </div>
                    <div className="text-base sm:text-xl font-extrabold mt-1.5 whitespace-nowrap">৳ {fmt(finalPay)}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 mt-0.5 truncate">
                        {hasCompany ? 'You have to pay' : 'Select a company'}
                    </div>
                </div>
                <div className="rounded-xl p-3 sm:p-4 bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md">
                    <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-bold">Get Amount</span>
                        <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                            <FaArrowDown size={10} />
                        </span>
                    </div>
                    <div className="text-base sm:text-xl font-extrabold mt-1.5 whitespace-nowrap">৳ {fmt(finalGet)}</div>
                    <div className="text-[10px] sm:text-xs opacity-90 mt-0.5 truncate">
                        {hasCompany ? 'You will receive' : 'Select a company'}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                    { key: 'open', label: 'Opening Balance', icon: FaBalanceScale, tone: 'brand', pay: openingPay, get: openingGet },
                    ...TABS.map((t) => ({
                        key: t.key,
                        label: t.label,
                        icon: t.icon,
                        tone: t.tone,
                        pay: balances[t.key].pay,
                        get: balances[t.key].get,
                    })),
                ].map((it) => {
                    const Icon = it.icon;
                    const net = r2(it.pay - it.get);
                    return (
                        <div
                            key={it.key}
                            className="min-w-0 bg-white rounded-xl border border-slate-200 p-2 flex flex-col items-center text-center gap-1 lg:flex-row lg:text-left lg:gap-2 lg:p-2.5"
                        >
                            <span className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center ${TONE_ICON[it.tone] || TONE_ICON.brand}`}>
                                <Icon size={12} />
                            </span>
                            <div className="min-w-0 w-full">
                                <p className="text-[9.5px] sm:text-[10.5px] font-bold text-slate-500 leading-tight line-clamp-2 lg:truncate">
                                    {it.label}
                                </p>
                                <p
                                    className={`text-[11px] sm:text-xs font-extrabold mt-0.5 whitespace-nowrap ${net > 0 ? 'text-rose-600' : net < 0 ? 'text-sky-600' : 'text-slate-300'}`}
                                >
                                    {net > 0 ? `Pay ৳${fmt(net)}` : net < 0 ? `Get ৳${fmt(-net)}` : '৳ 0'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {!hasCompany ? (
                <EmptyEntity word="company" />
            ) : (
                <>
                    <LedgerTabs
                        tabs={TABS.map((t) => ({
                            key: t.key,
                            label: `${t.label} (${data[t.key].length})`,
                            icon: t.icon,
                            active: activeTab === t.key,
                            onClick: () => setActiveTab(t.key),
                        }))}
                    />

                    <FilterPanel
                        filters={filters}
                        onChange={handleFilterChange}
                        onClear={handleClearFilters}
                        methodOptions={methodOptions}
                        statusOptions={isDuePayTab ? ['Pay', 'Get'] : null}
                    />

                    <ListCard
                        title={
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 w-full min-w-0">
                                <span className="truncate">{`${selectedCompany} — ${tabMeta.label}`}</span>
                                <div className="flex flex-nowrap items-center gap-1 md:gap-2 overflow-x-auto">
                                    {chips.map((c) => (
                                        <span
                                            key={c.label}
                                            className="shrink-0 whitespace-nowrap rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 text-[10px] md:text-xs font-semibold"
                                        >
                                            {c.label}: ৳{fmt(c.value)}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        }
                        chips={[]}
                        note={`Showing ${filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of ${filteredRows.length} (${currentAll.length} total)`}
                        pager={filteredRows.length > 0 ? { page: currentPage, total: totalPages, onChange: setCurrentPage } : null}
                    >
                        {isDuePayTab ? (
                            <CompanyDuePayAc rows={currentRows} loading={loading} />
                        ) : (
                            <>
                                {/* Mobile compact cards */}
                                <div className="md:hidden p-1.5 space-y-1.5">
                                    {loading ? (
                                        <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
                                    ) : currentRows.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-400">No records found for this company!</div>
                                    ) : (
                                        currentRows.map((r) => {
                                            const amts = isPurchaseTab
                                                ? [
                                                    [r.isReceivable ? 'Rcvbl' : 'Payable', r.isReceivable ? r.receivable : r.total, 'text-brand-600'],
                                                    [r.isReceivable ? 'Recv' : 'Paid', r.isReceivable ? r.received : r.paid, 'text-emerald-600'],
                                                    ['Pay', r.due, 'text-rose-600'],
                                                    ['Get', r.extra, 'text-sky-600'],
                                                ]
                                                : [
                                                    ['Return', r.total, 'text-orange-600'],
                                                    ['Recv', r.paid, 'text-emerald-600'],
                                                    ['Pay', r.due, 'text-rose-600'],
                                                    ['Get', r.extra, 'text-sky-600'],
                                                ];
                                            const method = isPurchaseTab || r.payment ? r.method : '';
                                            const goInvoice = () =>
                                                isPurchaseTab
                                                    ? navigate(`/purchase-details/${r.id}`)
                                                    : navigate(r.nav.path, r.nav.state ? { state: r.nav.state } : undefined);
                                            return (
                                                <div
                                                    key={r.key}
                                                    className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-1.5 shadow-sm"
                                                >
                                                    <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isPurchaseTab ? 'bg-brand-500' : 'bg-orange-400'}`} />
                                                    <div className="flex items-stretch gap-2">
                                                        <div className="min-w-0 flex-1 flex flex-col justify-between gap-0.5">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <button
                                                                    type="button"
                                                                    onClick={goInvoice}
                                                                    className="shrink-0 bg-brand-50 text-brand-700 px-1.5 py-px rounded-full text-[11px] font-bold leading-tight cursor-pointer"
                                                                >
                                                                    #{r.invoiceNo}
                                                                </button>
                                                                {method && (
                                                                    <span className="shrink-0 bg-slate-100 text-slate-700 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight">
                                                                        {method}
                                                                    </span>
                                                                )}
                                                                {!isPurchaseTab && !r.payment && <NotUsed />}
                                                                {!isPurchaseTab && r.fromPurchase && (
                                                                    <span className="shrink-0 bg-violet-50 text-violet-700 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight">
                                                                        From Purchase
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                                <span className="uppercase text-slate-400 font-bold">{isPurchaseTab ? 'Purchase: ' : 'Return: '}</span>
                                                                {(isPurchaseTab ? r.purchaseDate : r.returnDate) || 'N/A'}
                                                            </p>
                                                            {isPurchaseTab && (
                                                                <p className="text-[10.5px] text-slate-500 leading-snug">
                                                                    <span className="uppercase text-slate-400 font-bold">Received: </span>
                                                                    {r.receiveDate || (
                                                                        <span className="px-1.5 py-px bg-amber-100 text-amber-700 rounded-full text-[9px] font-bold">Not Received</span>
                                                                    )}
                                                                </p>
                                                            )}
                                                            {isPurchaseTab && (
                                                                <p className="text-[10.5px] text-emerald-700 font-semibold leading-snug">
                                                                    <span className="uppercase text-slate-400 font-bold">Paid: </span>
                                                                    {formatDateOnly(r.paymentDate) || 'N/A'}
                                                                </p>
                                                            )}
                                                            {isPurchaseTab && r.paymentEditedAt && (
                                                                <div>
                                                                    <EditedTag value={r.paymentEditedAt} />
                                                                </div>
                                                            )}
                                                            {!isPurchaseTab && r.editedAt && (
                                                                <div>
                                                                    <EditedTag value={r.editedAt} />
                                                                </div>
                                                            )}
                                                            {(isPurchaseTab || r.payment) && r.account && (
                                                                <p className="text-[10.5px] text-slate-500 leading-snug break-words">
                                                                    <span className="uppercase text-slate-400 font-bold">AC: </span>
                                                                    {r.account}
                                                                </p>
                                                            )}
                                                            {!isPurchaseTab && !r.payment && (
                                                                <p className="text-[10.5px] text-slate-500 leading-snug">
                                                                    <span className="uppercase text-slate-400 font-bold">AC: </span>
                                                                    <NotUsed />
                                                                </p>
                                                            )}
                                                            {isPurchaseTab && (r.damageAdj > 0 || r.bulkAdj > 0 || r.prevAdjAmount > 0) && (
                                                                <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                                                                    {r.damageAdj > 0 && (
                                                                        <span className="px-1.5 py-px rounded-full bg-red-50 text-red-600 text-[9px] font-semibold">Damage: ৳{fmt(r.damageAdj)}</span>
                                                                    )}
                                                                    {r.bulkAdj > 0 && (
                                                                        <span className="px-1.5 py-px rounded-full bg-violet-50 text-violet-600 text-[9px] font-semibold">Bulk: ৳{fmt(r.bulkAdj)}</span>
                                                                    )}
                                                                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Due' && (
                                                                        <span className="px-1.5 py-px rounded-full bg-rose-50 text-rose-600 text-[9px] font-semibold">Due Adj: ৳{fmt(r.prevAdjAmount)}</span>
                                                                    )}
                                                                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Get' && (
                                                                        <span className="px-1.5 py-px rounded-full bg-sky-50 text-sky-600 text-[9px] font-semibold">Get Adj: ৳{fmt(r.prevAdjAmount)}</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="shrink-0 w-[108px] flex flex-col justify-center gap-px">
                                                            {amts.map(([l, v, c]) => (
                                                                <div key={l} className="flex items-center justify-between rounded-md bg-slate-50 px-1.5 py-px">
                                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{l}</span>
                                                                    <span className={`text-[10.5px] font-bold whitespace-nowrap ${c}`}>৳{fmt(v)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Desktop table */}
                                <div className="hidden md:block">
                                    <LedgerTable
                                        columns={isPurchaseTab ? purchaseCols : returnCols}
                                        rows={currentRows}
                                        loading={loading}
                                        emptyText="No records found for this company!"
                                    />
                                </div>
                            </>
                        )}
                    </ListCard>
                </>
            )}
        </LedgerShell>
    );
};

export default CompanyAccountAc;