import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;

const sumItems = (items) =>
    (items || []).reduce((s, it) => s + (Number(it.itemTotal ?? it.subtotal) || 0), 0);

const idTimeOf = (id) => {
    const t = parseInt(String(id || '').slice(0, 8), 16) * 1000;
    return isNaN(t) ? 0 : t;
};

const parseToLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = String(dateStr).split(',')[0].trim();
    if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        if (!d || !m || !y) return null;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
        const [y, m, d] = datePart.slice(0, 10).split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(datePart);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

// ISO hole format kore dekhabe, noyto jemon ase temon
const fmtDateTime = (v) => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}T/.test(String(v))) {
        const d = new Date(v);
        if (isNaN(d)) return String(v);
        return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }
    return String(v);
};

const getTime = (v) => {
    if (!v) return 0;
    if (/^\d{4}-\d{2}-\d{2}T/.test(String(v))) {
        const t = new Date(v).getTime();
        return isNaN(t) ? 0 : t;
    }
    const d = parseToLocalDate(v);
    return d ? d.getTime() : 0;
};

const rowTimeOf = (createdAt, id, dateVal) => {
    if (createdAt) {
        const c = new Date(createdAt).getTime();
        if (!isNaN(c)) return c;
    }
    const it = idTimeOf(id);
    if (it > 0) return it;
    return getTime(dateVal);
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

const SOURCES = ['Purchase', 'Purchase Return', 'Bulk Return', 'Damage Return', 'Due Payment'];

const SOURCE_BADGE = {
    'Purchase': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Purchase Return': 'bg-orange-50 text-orange-700 border-orange-100',
    'Bulk Return': 'bg-violet-50 text-violet-700 border-violet-100',
    'Damage Return': 'bg-rose-50 text-rose-700 border-rose-100',
    'Due Payment': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const PurCompanyLedgerRepo = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [purchases, setPurchases] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        invoiceNo: '',
        company: '',
        companyContact: '',
        source: '',
        method: '',
        account: '',
        dueStatus: '',
    });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Account searchable-select state
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const accountDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutsideAccount = (event) => {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
                setIsAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideAccount);
        return () => document.removeEventListener('mousedown', handleClickOutsideAccount);
    }, []);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, cRes, bRes, dRes, dpRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/damage-return'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase-due-payment'),
                ]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                const bData = await bRes.json();
                const dData = await dRes.json();
                const dpData = await dpRes.json();
                setPurchases(Array.isArray(pData) ? pData : []);
                setCompanies(Array.isArray(cData) ? cData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setDamageReturns(Array.isArray(dData) ? dData : []);
                setDuePayments(Array.isArray(dpData) ? dpData : []);
            } catch (error) {
                console.error('Error fetching ledger data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutsideCompany = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCompany);
        return () => document.removeEventListener('mousedown', handleClickOutsideCompany);
    }, []);

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', invoiceNo: '', company: '', companyContact: '', source: '', method: '', account: '', dueStatus: '' });
        setCurrentPage(1);
    };

    const filteredCompanies = companies.filter((comp) => {
        const s = filters.company.toLowerCase();
        return (
            comp.businessName?.toLowerCase().includes(s) ||
            comp.contactNumber?.toLowerCase().includes(s)
        );
    });

    const getPhoneByName = (name) =>
        companies.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';

    const handleSelectCompany = (comp) => {
        setFilters({ ...filters, company: comp.businessName, companyContact: comp.contactNumber || '' });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, company: '', companyContact: '' });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    // ---------- Build rows (sob source) ----------
    const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

    // Return type row: company amake dibe (Receivable), ami pabo (Receive)
    const makeRow = (base, amt, payment) => {
        const received = payment ? n(payment.amount) : 0;
        return {
            ...base,
            phone: base.phone || getPhoneByName(base.company),
            method: payment?.method || '',
            account: payment ? accountLabel(payment.method, payment.account || {}) : '',
            payable: 0,
            receivable: amt,
            paid: 0,
            received,
            pay: Math.max(r2(received - amt), 0),
            get: Math.max(r2(amt - received), 0),
        };
    };

    // 1) Purchase payments
    const purchaseRows = purchases
        .filter((p) => p.paidAmount !== undefined && p.paidAmount !== null && p.paidAmount !== '' && n(p.paidAmount) > 0)
        .map((p) => {
            const payDate = p.paymentDate || p.receiveDate || p.purchaseDate || '';
            const fullPayable = n(p.payableAmount);
            const paidRaw = n(p.paidAmount);
            const isRecv = p.receiveStatus === 'Received' || p.receiveStatus === 'Yes';
            const isReceivable = fullPayable < 0;
            const payAmt = isReceivable
                ? Math.max(r2(paidRaw + fullPayable), 0)
                : !isRecv ? 0 : Math.max(r2(fullPayable - paidRaw), 0);
            const getAmt = isReceivable
                ? Math.max(r2(-fullPayable - paidRaw), 0)
                : !isRecv ? paidRaw : Math.max(r2(paidRaw - fullPayable), 0);
            return {
                rowId: `p-${p._id}`,
                source: 'Purchase',
                nav: { path: `/purchase-details/${p._id}`, state: { fromReport: true } },
                payDate,
                payTime: getTime(payDate) || idTimeOf(p._id),
                editedAt: p.paymentEditedAt || '',
                invoiceNo: p.invoiceNo,
                company: p.company || '',
                phone: p.companyContact || getPhoneByName(p.company),
                method: p.paymentMethod || '',
                account: accountLabel(p.paymentMethod, p.paymentAccount || {}),
                payable: isReceivable ? 0 : fullPayable,
                receivable: isReceivable ? -fullPayable : 0,
                paid: isReceivable ? 0 : paidRaw,
                received: isReceivable ? paidRaw : 0,
                pay: payAmt,
                get: getAmt,
            };
        });

    // 2) Purchase return
    const purReturnRows = [];
    purchases.forEach((order) => {
        (order.returnHistory || []).forEach((ret) => {
            if ((ret.status || 'Approved') === 'Pending') return;
            const idMatch = String(ret.returnId || '').match(/\d{13}/);
            const time = rowTimeOf(ret.createdAt, '', ret.returnDate) || (idMatch ? Number(idMatch[0]) : 0);
            purReturnRows.push(
                makeRow(
                    {
                        rowId: `pr-${order._id}-${ret.returnId}`,
                        source: 'Purchase Return',
                        nav: { path: `/purchase-return-view/${order._id}?returnId=${ret.returnId}` },
                        payDate: ret.returnDate || '',
                        payTime: time,
                        editedAt: ret.editedAt || '',
                        invoiceNo: order.invoiceNo,
                        company: order.company || '',
                    },
                    n(ret.totalReturnAmount),
                    ret.payment || null
                )
            );
        });
    });

    // 3) Bulk return
    const bulkRows = bulkReturns
        .filter((b) => b.fromPurchase === true || (b.status || 'Approved') !== 'Pending')
        .map((b) => {
            const adj =
                b.fromPurchase === true
                    ? n(purchases.find((p) => String(p._id) === String(b.purchaseId))?.returnAdjustmentAmount)
                    : 0;
            const payment = adj > 0 ? { amount: adj, method: 'Purchase Adjustment', account: {} } : b.payment || null;
            const fromPurchase = b.fromPurchase === true;
            return makeRow(
                {
                    rowId: `bk-${b._id}`,
                    source: 'Bulk Return',
                    nav: fromPurchase && b.purchaseId
                        ? { path: `/purchase-details/${b.purchaseId}`, state: { scrollToReturn: true } }
                        : { path: `/purchase-bulk-return-view/${b._id}` },
                    payDate: b.returnDate || '',
                    payTime: rowTimeOf(b.createdAt, b._id, b.returnDate),
                    editedAt: b.editedAt || '',
                    invoiceNo: b.invoiceNo,
                    company: b.company || '',
                },
                n(b.returnAmount),
                payment
            );
        });

    // 4) Damage return (standalone Approved + purchase theke)
    const damageRows = [
        ...damageReturns
            .filter((d) => d.status === 'Approved')
            .map((d) =>
                makeRow(
                    {
                        rowId: `dr-${d._id}`,
                        source: 'Damage Return',
                        nav: { path: `/damage-return-details/${d._id}` },
                        payDate: d.returnDate || '',
                        payTime: rowTimeOf(d.createdAt, d._id, d.returnDate),
                        editedAt: d.editedAt || '',
                        invoiceNo: d.invoiceNo,
                        company: d.company || '',
                    },
                    n(d.damageAmount) || n(d.returnAmount) || sumItems(d.items),
                    d.payment || null
                )
            ),
        ...purchases
            .filter(
                (p) =>
                    (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') &&
                    (p.damageItems || []).length > 0 &&
                    (n(p.damageAdjustmentAmount) > 0 || p.damageStatus === 'Approved')
            )
            .map((p) => {
                const adj = n(p.damageAdjustmentAmount);
                return makeRow(
                    {
                        rowId: `pu-${p._id}`,
                        source: 'Damage Return',
                        nav: { path: `/purchase-details/${p._id}`, state: { scrollTo: 'damage-products-section' } },
                        payDate: p.receiveDate || p.purchaseDate || '',
                        payTime: rowTimeOf(p.damageAt || p.createdAt, p._id, p.receiveDate || p.purchaseDate),
                        editedAt: '',
                        invoiceNo: p.invoiceNo,
                        company: p.company || '',
                    },
                    sumItems(p.damageItems),
                    adj > 0 ? { amount: adj, method: 'Purchase Adjustment', account: {} } : null
                );
            }),
    ];

    // 5) Company due payment
    const duePayRows = duePayments.map((d) => {
        const amt = Math.round(n(d.amount) * 100) / 100;
        const isGet = d.type === 'Get' || d.status === 'Get' || d.paymentAccount?.dueType === 'Get';
        return {
            rowId: `dp-${d._id}`,
            source: 'Due Payment',
            nav: null,
            payDate: d.date || '',
            payTime: idTimeOf(d._id) || getTime(d.date),
            editedAt: '',
            invoiceNo: d.invoiceNo || '',
            company: d.company || '',
            phone: d.companyContact || getPhoneByName(d.company),
            method: d.paymentMethod || '',
            account: accountLabel(d.paymentMethod, d.paymentAccount || {}),
            payable: 0,
            receivable: 0,
            paid: isGet ? 0 : amt,
            received: isGet ? amt : 0,
            pay: 0,
            get: 0,
        };
    });

    // Sob mile, jekhane payment/adjustment hoyeche sheguloi ledger e (notun age)
    const rows = [...purchaseRows, ...purReturnRows, ...bulkRows, ...damageRows, ...duePayRows]
        .filter((r) => r.paid > 0 || r.payable > 0 || r.received > 0 || r.receivable > 0)
        .sort((a, b) => b.payTime - a.payTime);

    const methodOptions = [...new Set(rows.map((r) => r.method).filter(Boolean))];

    // Account dropdown er list (unique)
    const accountOptions = [...new Set(rows.map((r) => r.account).filter(Boolean))];
    const filteredAccountOptions = accountOptions.filter((a) =>
        a.toLowerCase().includes(filters.account.toLowerCase())
    );

    const handleSelectAccount = (name) => {
        setFilters({ ...filters, account: name });
        setCurrentPage(1);
        setIsAccountOpen(false);
    };

    const handleClearAccount = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, account: '' });
        setCurrentPage(1);
        setIsAccountOpen(false);
    };

    // Filtering
    const filteredRows = rows.filter((r) => {
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(r.payDate);
            if (!d) return false;
            if (filters.startDate) {
                const s = parseToLocalDate(filters.startDate);
                if (s && d < s) return false;
            }
            if (filters.endDate) {
                const e = parseToLocalDate(filters.endDate);
                if (e && d > e) return false;
            }
        }
        if (filters.invoiceNo && !String(r.invoiceNo || '').toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.company && !r.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.companyContact && r.phone && r.phone !== filters.companyContact) return false;
        if (filters.source && r.source !== filters.source) return false;
        if (filters.method && r.method !== filters.method) return false;
        if (filters.account && !r.account?.toLowerCase().includes(filters.account.toLowerCase())) return false;
        if (filters.dueStatus === 'Due' && !(r.pay > 0)) return false;
        if (filters.dueStatus === 'NoDue' && !(r.pay <= 0)) return false;
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (num) => {
        if (num >= 1 && num <= totalPages) setCurrentPage(num);
    };

    // Checkbox
    const isAllSelected =
        currentRows.length > 0 && currentRows.every((r) => selectedIds.includes(r.rowId));

    const handleSelectAll = () => {
        const ids = currentRows.map((r) => r.rowId);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const selectedRows = filteredRows.filter((r) => selectedIds.includes(r.rowId));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredRows;

    const summaryPayable = summaryRows.reduce((s, r) => s + r.payable, 0);
    const summaryReceivable = summaryRows.reduce((s, r) => s + r.receivable, 0);
    const summaryPaid = summaryRows.reduce((s, r) => s + r.paid, 0);
    const summaryReceived = summaryRows.reduce((s, r) => s + r.received, 0);
    const summaryPay = summaryRows.reduce((s, r) => s + r.pay, 0);
    const summaryGet = summaryRows.reduce((s, r) => s + r.get, 0);
    const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });

    const handleInvoiceClick = (r) => {
        if (!r.nav) return;
        navigate(r.nav.path, r.nav.state ? { state: r.nav.state } : undefined);
    };

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Purchase Company Ledger
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Purchase, Return, Bulk Return, Damage Return ar Due Payment — sob payment er hisab, notun payment sobar upore</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Company Ledger</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of {filteredRows.length} ({rows.length} total)
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
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
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
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* Invoice */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    name="invoiceNo"
                                    placeholder="Search invoice..."
                                    value={filters.invoiceNo}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Company Searchable Dropdown */}
                            <div className="relative" ref={companyDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <div
                                    onClick={() => setIsCompanyOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select company..."
                                        value={filters.company}
                                        onChange={(e) => {
                                            setFilters({ ...filters, company: e.target.value, companyContact: '' });
                                            setCurrentPage(1);
                                            setIsCompanyOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.company && (
                                        <button type="button" onClick={handleClearCompany} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isCompanyOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map((comp) => (
                                                <div
                                                    key={comp._id}
                                                    onClick={() => handleSelectCompany(comp)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{comp.businessName}</p>
                                                    {comp.contactNumber && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5">📞 {comp.contactNumber}</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                                        )}
                                    </div>
                                )}
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

                            {/* Payment Method */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Payment Method</label>
                                <select
                                    name="method"
                                    value={filters.method}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {methodOptions.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Account Searchable Dropdown */}
                            <div className="relative" ref={accountDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Account</label>
                                <div
                                    onClick={() => setIsAccountOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select account..."
                                        value={filters.account}
                                        onChange={(e) => {
                                            handleFilterChange({ target: { name: 'account', value: e.target.value } });
                                            setIsAccountOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.account && (
                                        <button type="button" onClick={handleClearAccount} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isAccountOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredAccountOptions.length > 0 ? (
                                            filteredAccountOptions.map((acc) => (
                                                <div
                                                    key={acc}
                                                    onClick={() => handleSelectAccount(acc)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {acc}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No account found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Due Status */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Due Status</label>
                                <select
                                    name="dueStatus"
                                    value={filters.dueStatus}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Due">Has Due</option>
                                    <option value="NoDue">Fully Paid</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${isSelectionMode ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {isSelectionMode ? 'Selected' : 'Showing'}
                        </span>
                        <span className="font-semibold text-gray-600">
                            Rows: <b className="text-gray-800">{summaryRows.length}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Payable: <b className="text-indigo-600">৳{fmt(summaryPayable)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Receivable: <b className="text-sky-600">৳{fmt(summaryReceivable)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Paid: <b className="text-emerald-600">৳{fmt(summaryPaid)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Receive: <b className="text-teal-600">৳{fmt(summaryReceived)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Pay: <b className="text-rose-600">৳{fmt(summaryPay)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Get: <b className="text-sky-600">৳{fmt(summaryGet)}</b>
                        </span>
                        {isSelectionMode && (
                            <button
                                onClick={() => setSelectedIds([])}
                                className="ml-auto text-[11px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading ledger...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No payments found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-[11px] [&_td]:px-2 [&_td]:py-2.5 [&_td]:text-xs [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_td]:align-top">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white uppercase tracking-wide">
                                        <th className="w-7 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th>Date</th>
                                        <th>Invoice</th>
                                        <th>Company</th>
                                        <th>Source</th>
                                        <th>Payment Method</th>
                                        <th>Account</th>
                                        <th>Payable Amount</th>
                                        <th>Receivable Amount</th>
                                        <th>Paid Amount</th>
                                        <th>Receive Amount</th>
                                        <th>Pay Amount</th>
                                        <th>Get Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => (
                                        <tr
                                            key={r.rowId}
                                            className={`transition duration-150 ${selectedIds.includes(r.rowId) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}
                                        >
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(r.rowId)}
                                                    onChange={() => handleSelectRow(r.rowId)}
                                                    className="w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="text-gray-600">
                                                <div className="font-medium">{fmtDateTime(r.payDate) || 'N/A'}</div>
                                                {r.editedAt && (
                                                    <div className="text-[11px] text-amber-600 font-semibold">
                                                        Edited: {fmtDateTime(r.editedAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                {r.nav ? (
                                                    <button
                                                        onClick={() => handleInvoiceClick(r)}
                                                        className="text-indigo-700 hover:text-pink-600 hover:underline font-bold cursor-pointer transition-colors"
                                                    >
                                                        {r.invoiceNo}
                                                    </button>
                                                ) : (
                                                    <span className="font-bold text-gray-700">{r.invoiceNo || 'N/A'}</span>
                                                )}
                                            </td>
                                            <td className="text-gray-600">
                                                <div>{r.company}</div>
                                                {r.phone && (
                                                    <div className="text-[11px] text-gray-400 mt-0.5">📞 {r.phone}</div>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`inline-block px-2 py-0.5 rounded-full border font-bold text-[10px] ${SOURCE_BADGE[r.source] || 'bg-gray-50 text-gray-600 border-gray-100'}`}>
                                                    {r.source}
                                                </span>
                                            </td>
                                            <td className="font-semibold text-gray-700">{r.method || 'N/A'}</td>
                                            <td className="text-gray-600">{r.account || 'N/A'}</td>
                                            <td className="font-semibold text-indigo-600">
                                                {r.payable > 0 ? `৳${r.payable.toFixed(2)}` : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="font-semibold text-sky-600">
                                                {r.receivable > 0 ? `৳${r.receivable.toFixed(2)}` : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="font-bold text-emerald-600">
                                                {r.paid > 0 ? `৳${r.paid.toFixed(2)}` : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className="font-bold text-teal-600">
                                                {r.received > 0 ? `৳${r.received.toFixed(2)}` : <span className="text-gray-300">—</span>}
                                            </td>
                                            <td className={`font-bold ${r.pay > 0 ? 'text-rose-600' : 'text-slate-400'}`}>৳{r.pay.toFixed(2)}</td>
                                            <td className={`font-bold ${r.get > 0 ? 'text-sky-600' : 'text-slate-400'}`}>৳{r.get.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filteredRows.length > 0 && (
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

export default PurCompanyLedgerRepo;