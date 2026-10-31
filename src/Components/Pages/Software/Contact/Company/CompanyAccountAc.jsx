import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight, FaClock, FaEdit,
    FaArrowUp, FaArrowDown, FaBalanceScale, FaSearch, FaBuilding, FaLock,
    FaFileInvoice, FaUndoAlt, FaBoxOpen, FaExclamationTriangle, FaCheckCircle, FaChevronDown, FaMoneyBillWave
} from 'react-icons/fa';
import CompanyDuePayAc from './CompanyDuePayAc';

// ---------- Static helpers ----------
const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
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

const TH = 'px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider';
const NOT_USED_BADGE =
    'inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[10px]';
const PILL = 'bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md';

const TABS = [
    { key: 'purchase', label: 'Company Purchase', icon: FaFileInvoice, grad: 'from-indigo-600 to-purple-600' },
    { key: 'purReturn', label: 'Purchase Return AC', icon: FaUndoAlt, grad: 'from-orange-500 to-amber-500' },
    { key: 'bulk', label: 'Bulk Return AC', icon: FaBoxOpen, grad: 'from-violet-600 to-fuchsia-600' },
    { key: 'damage', label: 'Damage Return AC', icon: FaExclamationTriangle, grad: 'from-rose-500 to-orange-500' },
    { key: 'duePay', label: 'Company Due Payment', icon: FaMoneyBillWave, grad: 'from-emerald-600 to-teal-600' },
];

// ---------- Small components ----------
const Pagination = ({ currentPage, totalPages, onChange }) => {
    const go = (p) => {
        if (p >= 1 && p <= totalPages) onChange(p);
    };
    const btn = (disabled) =>
        `flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${disabled
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
        }`;
    return (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
            <span className="text-xs text-gray-500 font-medium">
                Page <span className="font-bold text-gray-700">{currentPage}</span> of{' '}
                <span className="font-bold text-gray-700">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1.5">
                <button onClick={() => go(currentPage - 1)} disabled={currentPage === 1} className={btn(currentPage === 1)}>
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
                                    onClick={() => go(pageNum)}
                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                        }`}
                                >
                                    {pageNum}
                                </button>
                            );
                        }
                        if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                        }
                        return null;
                    })}
                </div>
                <button onClick={() => go(currentPage + 1)} disabled={currentPage === totalPages} className={btn(currentPage === totalPages)}>
                    Next <FaChevronRight size={10} />
                </button>
            </div>
        </div>
    );
};

const BalanceBadge = ({ pay, get, size = 'sm' }) => {
    const net = r2(pay - get);
    const cls = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
    if (net > 0)
        return (
            <span className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-600 font-semibold border border-rose-100 ${cls}`}>
                <FaArrowUp size={9} /> Pay ৳ {fmt(net)}
            </span>
        );
    if (net < 0)
        return (
            <span className={`inline-flex items-center gap-1 rounded-md bg-sky-50 text-sky-600 font-semibold border border-sky-100 ${cls}`}>
                <FaArrowDown size={9} /> Get ৳ {fmt(-net)}
            </span>
        );
    return <span className={`text-gray-300 font-semibold ${cls}`}>৳ 0</span>;
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
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // tabs / filters / pagination
    const [activeTab, setActiveTab] = useState('purchase');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', invoiceNo: '', paymentMethod: '', status: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // ---------- Fetch ----------
    useEffect(() => {
        const loadData = async () => {
            try {
                const [dpRes, pRes, bRes, dRes, cRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/purchase-due-payment'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/damage-return'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
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
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCompany, activeTab, filters]);

    useEffect(() => {
        setFilters({ startDate: '', endDate: '', invoiceNo: '', paymentMethod: '', status: '' });
    }, [selectedCompany, activeTab]);

    // ---------- Company options ----------
    const companyNames = (() => {
        const seen = new Map();
        const put = (n) => {
            const name = String(n || '').trim();
            if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
        };
        companies.forEach((c) => put(c.businessName));
        duePayments.forEach((d) => put(d.company));
        purchases.forEach((p) => put(p.company));
        bulkReturns.forEach((b) => put(b.company));
        damageReturns.forEach((d) => put(d.company));
        // company list er company gulo age (je order e add kora hoyeche), tarpor onno gulo
        return [...seen.values()];
    })();

    const companyOptions = companyNames.filter((n) => n.toLowerCase().includes(query.trim().toLowerCase()));
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
        setIsOpen(false);
    };

    const handleClearCompany = () => {
        setSelectedCompany('');
        setQuery('');
        setIsOpen(false);
        setActiveTab('purchase');
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

    const bulkAll = bulkReturns.map((b) => {
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
                badgeGrad: 'from-violet-500 to-purple-500',
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
                        badgeGrad: 'from-teal-500 to-emerald-500',
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
    const grossPay = r2(Object.values(balances).reduce((s, b) => s + b.pay, 0) + openingPay);
    const grossGet = r2(Object.values(balances).reduce((s, b) => s + b.get, 0) + openingGet);
    const finalNet = r2(grossPay - grossGet);
    const finalPay = finalNet > 0 ? finalNet : 0;
    const finalGet = finalNet < 0 ? -finalNet : 0;

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
    const handleClearFilters = () =>
        setFilters({ startDate: '', endDate: '', invoiceNo: '', paymentMethod: '', status: '' });

    const inputCls =
        'w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Company Account
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Select a company to see its full account: opening balance, purchase, return, bulk return, damage return and the final Pay / Get balance.
                    </p>
                </div>

                {/* Company Selector */}
                <div className="bg-white shadow-lg rounded-2xl p-5 mb-6 border border-indigo-100 relative z-30">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
                        <FaBuilding className="text-indigo-600" />
                        <h3 className="text-sm font-bold text-gray-700">Select Company</h3>
                        {hasCompany && (
                            <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                                <FaCheckCircle size={10} /> Selected
                            </span>
                        )}
                    </div>

                    <div className="relative" ref={dropdownRef}>
                        <div
                            className={`flex items-center gap-2 w-full px-4 py-2.5 rounded-xl border-2 bg-gray-50/60 transition-all ${isOpen ? 'border-indigo-500 ring-2 ring-indigo-100' : 'border-gray-200'
                                }`}
                        >
                            <FaSearch className="text-indigo-400" size={13} />
                            <input
                                type="text"
                                placeholder="Search company by name and select..."
                                value={query}
                                onFocus={() => setIsOpen(true)}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    if (selectedCompany) {
                                        setSelectedCompany('');
                                        setActiveTab('purchase');
                                    }
                                    setIsOpen(true);
                                }}
                                className="bg-transparent outline-none w-full text-sm font-medium text-gray-700"
                            />
                            {query && (
                                <button type="button" onClick={handleClearCompany} className="text-gray-400 hover:text-red-500">
                                    <FaTimes size={12} />
                                </button>
                            )}
                            <FaChevronDown
                                size={11}
                                className={`text-gray-400 transition-transform cursor-pointer ${isOpen ? 'rotate-180' : ''}`}
                                onClick={() => setIsOpen((v) => !v)}
                            />
                        </div>

                        {isOpen && (
                            <div className="absolute z-[100] left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-indigo-100 max-h-64 overflow-y-auto">
                                {loading ? (
                                    <div className="px-4 py-3 text-xs text-gray-400 text-center">Loading...</div>
                                ) : companyOptions.length > 0 ? (
                                    companyOptions.map((name) => (
                                        <div
                                            key={name}
                                            onClick={() => handleSelectCompany(name)}
                                            className={`px-4 py-2.5 cursor-pointer border-b border-gray-50 last:border-none text-sm font-medium flex items-center gap-2 hover:bg-indigo-50 ${sameCompany(name, selectedCompany) ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                                                }`}
                                        >
                                            <FaBuilding size={11} className="text-indigo-300" />
                                            {name}
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-3 text-xs text-gray-400 text-center">No company found</div>
                                )}
                            </div>
                        )}
                    </div>

                    {hasCompany && (
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow">
                                <FaBuilding size={10} /> {selectedCompany}
                            </span>
                            {companyInfo?.contactNumber && (
                                <span className="text-xs text-gray-500 font-medium">📞 {companyInfo.contactNumber}</span>
                            )}
                            {companyInfo?.address && (
                                <span className="text-xs text-gray-500 font-medium">📍 {companyInfo.address}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Pay / Get Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="rounded-2xl p-6 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold opacity-95">Pay Amount</span>
                            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <FaArrowUp />
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold mt-3">৳ {fmt(finalPay)}</div>
                        <div className="text-xs opacity-90 mt-1">
                            {hasCompany ? 'You have to pay this company' : 'Select a company'}
                        </div>
                    </div>
                    <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-bold opacity-95">Get Amount</span>
                            <span className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                                <FaArrowDown />
                            </span>
                        </div>
                        <div className="text-3xl font-extrabold mt-3">৳ {fmt(finalGet)}</div>
                        <div className="text-xs opacity-90 mt-1">
                            {hasCompany ? 'You will receive from this company' : 'Select a company'}
                        </div>
                    </div>
                </div>

                {/* Breakdown */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-6">
                    {/* Opening Balance (sobar bame) */}
                    <div className="bg-white rounded-xl p-3 border border-indigo-100 shadow-sm flex items-center gap-3">
                        <span className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow">
                            <FaBalanceScale size={13} />
                        </span>
                        <div className="min-w-0">
                            <div className="text-[11px] font-bold text-gray-500 truncate">Opening Balance</div>
                            <BalanceBadge pay={openingPay} get={openingGet} size="xs" />
                        </div>
                    </div>
                    {TABS.map((t) => {
                        const Icon = t.icon;
                        const b = balances[t.key];
                        return (
                            <div key={t.key} className="bg-white rounded-xl p-3 border border-indigo-100 shadow-sm flex items-center gap-3">
                                <span className={`w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br ${t.grad} text-white flex items-center justify-center shadow`}>
                                    <Icon size={13} />
                                </span>
                                <div className="min-w-0">
                                    <div className="text-[11px] font-bold text-gray-500 truncate">{t.label}</div>
                                    <BalanceBadge pay={b.pay} get={b.get} size="xs" />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Tab Bar */}
                <div className="mb-4 overflow-x-auto pb-1">
                    <div className="inline-flex gap-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white p-1">
                        {TABS.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = hasCompany && activeTab === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    disabled={!hasCompany}
                                    onClick={() => setActiveTab(tab.key)}
                                    title={hasCompany ? tab.label : 'Select a company first'}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${!hasCompany
                                        ? 'text-gray-300 bg-gray-50 cursor-not-allowed'
                                        : isActive
                                            ? 'bg-gradient-to-r from-indigo-600 to-pink-600 text-white shadow-md shadow-indigo-200 cursor-pointer'
                                            : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer'
                                        }`}
                                >
                                    {hasCompany ? <Icon size={11} /> : <FaLock size={10} />}
                                    {tab.label}
                                    {hasCompany && (
                                        <span
                                            className={`ml-0.5 px-1.5 rounded-full text-[10px] ${isActive ? 'bg-white/25 text-white' : 'bg-indigo-100 text-indigo-600'
                                                }`}
                                        >
                                            {data[tab.key].length}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                {!hasCompany ? (
                    <div className="bg-white shadow-xl rounded-2xl border border-indigo-100 py-16 px-6 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-pink-100 flex items-center justify-center mb-4">
                            <FaBalanceScale className="text-indigo-500" size={26} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-700">No company selected</h3>
                        <p className="text-sm text-gray-400 mt-1">
                            Search and select a company above to unlock the tabs and see its Pay / Get balance.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Filter Panel */}
                        <div className="bg-white shadow-lg rounded-2xl p-5 mb-6 border border-indigo-100">
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
                            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${isDuePayTab ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                                <div>
                                    <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                    <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                    <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className={inputCls} />
                                </div>
                                <div>
                                    <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice Number</label>
                                    <input
                                        type="text"
                                        name="invoiceNo"
                                        placeholder="Search invoice..."
                                        value={filters.invoiceNo}
                                        onChange={handleFilterChange}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-600 text-[11px] font-semibold mb-1">Payment Method</label>
                                    <select
                                        name="paymentMethod"
                                        value={filters.paymentMethod}
                                        onChange={handleFilterChange}
                                        className={`${inputCls} cursor-pointer`}
                                    >
                                        <option value="">All</option>
                                        {methodOptions.map((m) => (
                                            <option key={m} value={m}>{m === 'NotUsed' ? 'Not Used' : m}</option>
                                        ))}
                                    </select>
                                </div>
                                {isDuePayTab && (
                                    <div>
                                        <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                                        <select
                                            name="status"
                                            value={filters.status}
                                            onChange={handleFilterChange}
                                            className={`${inputCls} cursor-pointer`}
                                        >
                                            <option value="">All</option>
                                            <option value="Pay">Pay</option>
                                            <option value="Get">Get</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-100">
                            <div className={`p-5 bg-gradient-to-r ${tabMeta.grad} text-white flex flex-col md:flex-row justify-between md:items-center gap-3`}>
                                <h2 className="text-xl font-bold">
                                    {selectedCompany} — {tabMeta.label}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={PILL}>{isDuePayTab ? 'Total Paid' : pillLabels[0]}: ৳{fmt(sTotal)}</span>
                                    {showReceive && <span className={PILL}>Receivable: ৳{fmt(sReceivable)}</span>}
                                    {showReceive && <span className={PILL}>Receive: ৳{fmt(sReceived)}</span>}
                                    {!isDuePayTab && <span className={PILL}>{pillLabels[1]}: ৳{fmt(sPaid)}</span>}
                                    {!isDuePayTab && <span className={PILL}>{pillLabels[2]}: ৳{fmt(sDue)}</span>}
                                    {!isDuePayTab && <span className={PILL}>{pillLabels[3]}: ৳{fmt(sExtra)}</span>}
                                    <span className={PILL}>
                                        Showing: {filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of {filteredRows.length} ({currentAll.length} total)
                                    </span>
                                </div>
                            </div>
                            {isDuePayTab && <CompanyDuePayAc rows={currentRows} loading={loading} />}

                            <div className={`overflow-x-auto ${isDuePayTab ? 'hidden' : ''}`}>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        {isPurchaseTab ? (
                                            <tr>
                                                <th className={TH}>Date</th>
                                                <th className={TH}>Invoice</th>
                                                <th className={TH}>Payment Method</th>
                                                <th className={TH}>Payment Account</th>
                                                <th className={TH}>Payable Amount</th>
                                                {showReceive && <th className={TH}>Receivable Amount</th>}
                                                <th className={TH}>Paid Amount</th>
                                                {showReceive && <th className={TH}>Receive Amount</th>}
                                                <th className={TH}>Pay Amount</th>
                                                <th className={TH}>Get Amount</th>
                                            </tr>
                                        ) : (
                                            <tr>
                                                <th className={TH}>Date</th>
                                                <th className={TH}>Invoice</th>
                                                <th className={TH}>Payment Method</th>
                                                <th className={TH}>Payment Account</th>
                                                <th className={TH}>Return Amount</th>
                                                <th className={TH}>Return Received Amount</th>
                                                <th className={TH}>Return Pay Amount</th>
                                                <th className={TH}>Return Get Amount</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="8" className="text-center py-10 text-gray-400 text-sm">Loading...</td>
                                            </tr>
                                        ) : currentRows.length > 0 ? (
                                            currentRows.map((r) =>
                                                isPurchaseTab ? (
                                                    <tr key={r.key} className="hover:bg-indigo-50/50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-600">
                                                            <div className="font-medium">Purchase : {r.purchaseDate || 'N/A'}</div>
                                                            <div className="mt-0.5">
                                                                {r.receiveDate ? (
                                                                    <span>Received: {r.receiveDate}</span>
                                                                ) : (
                                                                    <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold text-[10px] whitespace-nowrap">
                                                                        Not Received
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div className="mt-0.5 inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                                                <FaClock className="text-emerald-500" size={10} />
                                                                Paid: {formatDateOnly(r.paymentDate) || 'N/A'}
                                                            </div>
                                                            {r.paymentEditedAt && (
                                                                <div className="mt-0.5">
                                                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                                        <FaEdit size={10} /> Edited: {formatDateOnly(r.paymentEditedAt)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() => navigate(`/purchase-details/${r.id}`)}
                                                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                                                            >
                                                                {r.invoiceNo}
                                                            </button>
                                                            <div className="mt-1 flex flex-col items-start gap-0.5">
                                                                {r.damageAdj > 0 && (
                                                                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold text-[9px] leading-none whitespace-nowrap">
                                                                        Damage Adjusted: ৳ {fmt(r.damageAdj)}
                                                                    </span>
                                                                )}
                                                                {r.bulkAdj > 0 && (
                                                                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 font-bold text-[9px] leading-none whitespace-nowrap">
                                                                        Bulk Adjusted: ৳ {fmt(r.bulkAdj)}
                                                                    </span>
                                                                )}
                                                                {r.prevAdjAmount > 0 && r.prevAdjType === 'Due' && (
                                                                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100 font-bold text-[9px] leading-none whitespace-nowrap">
                                                                        Due Adjusted: ৳ {fmt(r.prevAdjAmount)}
                                                                    </span>
                                                                )}
                                                                {r.prevAdjAmount > 0 && r.prevAdjType === 'Get' && (
                                                                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 font-bold text-[9px] leading-none whitespace-nowrap">
                                                                        Get Adjusted: ৳ {fmt(r.prevAdjAmount)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                                {r.method}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {r.account || <span className="text-gray-400 italic">N/A</span>}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">
                                                            {r.isReceivable ? <span className="text-gray-300">—</span> : `৳ ${fmt(r.total)}`}
                                                        </td>
                                                        {showReceive && (
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-600">
                                                                {r.isReceivable ? `৳ ${fmt(r.receivable)}` : <span className="text-gray-300">—</span>}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">
                                                            {r.isReceivable ? <span className="text-gray-300">—</span> : `৳ ${fmt(r.paid)}`}
                                                        </td>
                                                        {showReceive && (
                                                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-600">
                                                                {r.isReceivable ? `৳ ${fmt(r.received)}` : <span className="text-gray-300">—</span>}
                                                            </td>
                                                        )}
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-rose-600">৳ {fmt(r.due)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-600">৳ {fmt(r.extra)}</td>
                                                    </tr>
                                                ) : (
                                                    <tr key={r.key} className="hover:bg-indigo-50/50 transition-colors">
                                                        <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-600">
                                                            <div className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                                                                <FaClock className="text-orange-500" size={10} />
                                                                Return: {r.returnDate || 'N/A'}
                                                            </div>
                                                            {r.editedAt && (
                                                                <div className="mt-0.5">
                                                                    <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                                        <FaEdit size={10} /> Edited: {formatDateOnly(r.editedAt)}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                            <button
                                                                onClick={() => navigate(r.nav.path, r.nav.state ? { state: r.nav.state } : undefined)}
                                                                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                                                            >
                                                                {r.invoiceNo}
                                                            </button>
                                                            {r.fromPurchase && (
                                                                <div>
                                                                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r ${r.badgeGrad || 'from-violet-500 to-purple-500'} text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm`}>
                                                                        From Purchase
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                            {r.payment ? (
                                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                                    {r.method}
                                                                </span>
                                                            ) : (
                                                                <span className={NOT_USED_BADGE}>Not Used</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                            {r.payment ? (
                                                                r.account || <span className="text-gray-400 italic">N/A</span>
                                                            ) : (
                                                                <span className={NOT_USED_BADGE}>Not Used</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-orange-600">৳ {fmt(r.total)}</td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                                            {r.payment ? (
                                                                <span className="text-emerald-600">৳ {fmt(r.paid)}</span>
                                                            ) : (
                                                                <span className={NOT_USED_BADGE}>Not Used</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                                            <span className={r.due > 0 ? 'text-red-600' : 'text-emerald-600'}>৳ {fmt(r.due)}</span>
                                                        </td>
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-600">৳ {fmt(r.extra)}</td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan="8" className="text-center py-10 text-gray-400 text-sm">
                                                    No records found for this company!
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {filteredRows.length > 0 && (
                                <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CompanyAccountAc;