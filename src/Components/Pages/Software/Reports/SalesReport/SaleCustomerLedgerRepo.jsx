import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

const itemAmt = (it) =>
    Number(it.itemTotal ?? it.subtotal ?? (n(it.sellPricePcs ?? it.sellPrice) * n(it.totalQty))) || 0;
const sumItems = (items) => (items || []).reduce((s, it) => s + itemAmt(it), 0);

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
    if (method === 'Sales Adjustment') return 'Adjusted in Sales Bill';
    if (method === 'Bank') {
        return (
            [acc.bankName, acc.accountNumber].filter(Boolean).join(' - ') +
            (acc.accountBranch ? ` (${acc.accountBranch})` : '')
        );
    }
    if (method === 'Mobile Banking') return [acc.accountName, acc.accountNumber].filter(Boolean).join(' - ');
    return acc.accountName || 'Cash';
};

const getStatus = (o) => (o.status === 'Delivered' ? 'Delivered' : 'New Order');

const SOURCES = ['Sale', 'Sales Return', 'Bulk Return', 'Damage Return', 'Due Payment'];

const SOURCE_BADGE = {
    'Sale': 'bg-indigo-50 text-indigo-700 border-indigo-100',
    'Sales Return': 'bg-orange-50 text-orange-700 border-orange-100',
    'Bulk Return': 'bg-violet-50 text-violet-700 border-violet-100',
    'Damage Return': 'bg-rose-50 text-rose-700 border-rose-100',
    'Due Payment': 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

const Dash = () => <span className="text-gray-300">—</span>;

// Searchable dropdown (SR / Delivery Man / Route)
const FilterSelect = ({ label, placeholder, value, options, onChange, emptyText }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const list = options.filter((o) => o.toLowerCase().includes((value || '').toLowerCase()));

    return (
        <div className="relative" ref={ref}>
            <label className="block text-gray-600 text-[11px] font-semibold mb-1">{label}</label>
            <div
                onClick={() => setOpen(true)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                            setOpen(false);
                        }}
                        className="text-gray-400 hover:text-red-500 pl-1"
                    >
                        <FaTimes size={10} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                    {list.length > 0 ? (
                        list.map((o) => (
                            <div
                                key={o}
                                onClick={() => {
                                    onChange(o);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                            >
                                {o}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const SaleCustomerLedgerRepo = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const EMPTY_FILTERS = {
        startDate: '',
        endDate: '',
        invoiceNo: '',
        customer: '',
        customerContact: '',
        source: '',
        method: '',
        account: '',
        dueStatus: '',
        sr: '',
        deliveredBy: '',
        route: '',
        status: 'Delivered', // default Delivered (shudhu Sale source er jonno)
    };
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [directOnly, setDirectOnly] = useState(false);

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Customer searchable-select state
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const customerDropdownRef = useRef(null);

    // Account searchable-select state
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const accountDropdownRef = useRef(null);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const handleClickOutsideAccount = (event) => {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
                setIsAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideAccount);
        return () => document.removeEventListener('mousedown', handleClickOutsideAccount);
    }, []);

    useEffect(() => {
        const handleClickOutsideCustomer = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCustomer);
        return () => document.removeEventListener('mousedown', handleClickOutsideCustomer);
    }, []);

    useEffect(() => {
        const load = async () => {
            try {
                const [sRes, cRes, uRes, bRes, dRes, dpRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/sales'),
                    fetch('https://squirrel-peace-server.onrender.com/customer'),
                    fetch('https://squirrel-peace-server.onrender.com/user'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-damage'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-due-payment'),
                ]);
                const sData = await sRes.json();
                const cData = await cRes.json();
                const uData = await uRes.json().catch(() => []);
                const bData = await bRes.json().catch(() => []);
                const dData = await dRes.json().catch(() => []);
                const dpData = await dpRes.json().catch(() => []);
                setOrders(Array.isArray(sData) ? sData : []);
                setCustomers(Array.isArray(cData) ? cData : []);
                setUsers(Array.isArray(uData) ? uData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setDamageReturns(Array.isArray(dData) ? dData : []);
                setDuePayments(Array.isArray(dpData) ? dpData : []);
            } catch (error) {
                console.error('Error fetching customer ledger data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [location.pathname]);

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
        setFilters(EMPTY_FILTERS);
        setDirectOnly(false);
        setCurrentPage(1);
    };

    const getCustomerName = (c) => c.businessName || c.name || '';

    const filteredCustomers = customers.filter((c) => {
        const s = filters.customer.toLowerCase();
        return (
            getCustomerName(c).toLowerCase().includes(s) ||
            c.contactNumber?.toLowerCase().includes(s)
        );
    });

    const getPhoneByName = (name) =>
        customers.find((c) => getCustomerName(c).trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';

    const handleSelectCustomer = (c) => {
        setFilters({ ...filters, customer: getCustomerName(c), customerContact: c.contactNumber || '' });
        setCurrentPage(1);
        setIsCustomerOpen(false);
    };

    const handleClearCustomer = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, customer: '', customerContact: '' });
        setCurrentPage(1);
        setIsCustomerOpen(false);
    };

    // ---------- Build rows (sob source) ----------
    // Return type row: amt = return value, payment = customer ke ferot dewa
    const makeReturnRow = (base, amt, payment) => {
        const refunded = payment ? n(payment.amount) : 0;
        return {
            ...base,
            phone: getPhoneByName(base.customer),
            method: payment?.method || '',
            account: payment ? accountLabel(payment.method, payment.account || {}) : '',
            receivable: 0,
            payable: amt,
            received: 0,
            paid: refunded,
            pay: Math.max(r2(amt - refunded), 0),
            get: Math.max(r2(refunded - amt), 0),
        };
    };

    // 1) Sales (Delivered payment + New Order)
    const saleRows = orders
        .map((o, idx) => ({ o, idx }))
        .filter(({ o }) => getStatus(o) === 'New Order' || n(o.paidAmount) > 0)
        .map(({ o, idx }) => {
            const status = getStatus(o);
            const isDel = status === 'Delivered';
            const payDate = isDel
                ? o.paymentDate || o.deliveredAt || o.deliveryDate || o.orderDate || ''
                : o.createdAt || o.orderDate || '';
            const fullPayable = n(o.payableAmount ?? o.grandTotal);
            const paidRaw = n(o.paidAmount);
            const isPayable = fullPayable < 0;
            const due = isPayable
                ? Math.max(r2(paidRaw + fullPayable), 0)
                : !isDel ? 0 : Math.max(r2(fullPayable - paidRaw), 0);
            const extra = isPayable
                ? Math.max(r2(-fullPayable - paidRaw), 0)
                : !isDel ? paidRaw : Math.max(r2(paidRaw - fullPayable), 0);
            return {
                rowId: `s-${o._id}`,
                source: 'Sale',
                nav: { path: `/sales-details/${o._id}`, state: { fromReport: true } },
                idx,
                payDate,
                payTime: getTime(payDate) || idTimeOf(o._id),
                editedAt: o.paymentEditedAt || '',
                invoiceNo: o.invoiceNo || o.orderNo || '',
                customer: o.customer || '',
                phone: getPhoneByName(o.customer),
                sr: o.sr || '',
                deliveredBy: o.deliveredBy || '',
                route: o.route || '',
                direct: o.directSales === true,
                status,
                method: o.paymentMethod || '',
                account: o.paymentMethod ? accountLabel(o.paymentMethod, o.paymentAccount || {}) : '',
                receivable: isPayable ? 0 : fullPayable,
                payable: isPayable ? -fullPayable : 0,
                received: isPayable ? 0 : paidRaw,
                paid: isPayable ? paidRaw : 0,
                get: due,
                pay: extra,
            };
        });

    // 2) Sales return
    const saleReturnRows = [];
    orders.forEach((order) => {
        (order.returnHistory || []).forEach((ret) => {
            const idMatch = String(ret.returnId || '').match(/\d{13}/);
            const time = rowTimeOf(ret.createdAt, '', ret.returnDate) || (idMatch ? Number(idMatch[0]) : 0);
            saleReturnRows.push(
                makeReturnRow(
                    {
                        rowId: `sr-${order._id}-${ret.returnId}`,
                        source: 'Sales Return',
                        nav: { path: `/sales-return-view/${order._id}?returnId=${ret.returnId}` },
                        payDate: ret.returnDate || '',
                        payTime: time,
                        editedAt: ret.editedAt || '',
                        invoiceNo: order.invoiceNo || order.orderNo || '',
                        customer: order.customer || '',
                        sr: order.sr || '',
                        deliveredBy: order.deliveredBy || '',
                        route: order.route || '',
                        direct: order.directSales === true,
                        status: '',
                    },
                    n(ret.totalReturnAmount),
                    ret.payment || null
                )
            );
        });
    });

    // 3) Bulk return
    const bulkRows = bulkReturns.map((b) => {
        const adj =
            b.fromSales === true
                ? n(orders.find((s) => String(s._id) === String(b.saleId))?.returnAdjustmentAmount)
                : 0;
        const payment = adj > 0 ? { amount: adj, method: 'Sales Adjustment', account: {} } : b.payment || null;
        const fromSales = b.fromSales === true;
        return makeReturnRow(
            {
                rowId: `bk-${b._id}`,
                source: 'Bulk Return',
                nav: fromSales && b.saleId
                    ? { path: `/sales-details/${b.saleId}`, state: { scrollToReturn: true } }
                    : { path: `/sales-bulk-return-view/${b._id}` },
                payDate: b.returnDate || '',
                payTime: rowTimeOf(b.createdAt, b._id, b.returnDate),
                editedAt: b.editedAt || '',
                invoiceNo: b.invoiceNo || '',
                customer: b.customer || '',
                sr: '',
                deliveredBy: '',
                route: '',
                direct: false,
                status: '',
            },
            n(b.returnAmount),
            payment
        );
    });

    // 4) Damage return (standalone customer damage + sales theke damage)
    const damageRows = [
        ...damageReturns
            .filter((d) => d.customer)
            .map((d) =>
                makeReturnRow(
                    {
                        rowId: `sd-${d._id}`,
                        source: 'Damage Return',
                        nav: { path: `/sales-damage-details/${d._id}` },
                        payDate: d.returnDate || d.date || '',
                        payTime: rowTimeOf(d.createdAt, d._id, d.returnDate || d.date),
                        editedAt: d.editedAt || '',
                        invoiceNo: d.invoiceNo || '',
                        customer: d.customer || '',
                        sr: '',
                        deliveredBy: '',
                        route: '',
                        direct: false,
                        status: '',
                    },
                    n(d.damageAmount) || n(d.returnAmount) || sumItems(d.items),
                    d.payment || null
                )
            ),
        ...orders
            .filter((s) => s.status === 'Delivered' && (s.damageItems || []).length > 0)
            .map((s) => {
                const adj = n(s.damageAdjustmentAmount);
                return makeReturnRow(
                    {
                        rowId: `sa-${s._id}`,
                        source: 'Damage Return',
                        nav: { path: `/sales-details/${s._id}`, state: { scrollTo: 'damage-products-section' } },
                        payDate: s.deliveryDate || s.orderDate || '',
                        payTime: rowTimeOf(s.damageAt || s.createdAt, s._id, s.deliveryDate || s.orderDate),
                        editedAt: s.damageEditedAt || '',
                        invoiceNo: s.invoiceNo || s.orderNo || '',
                        customer: s.customer || '',
                        sr: s.sr || '',
                        deliveredBy: s.deliveredBy || '',
                        route: s.route || '',
                        direct: s.directSales === true,
                        status: '',
                    },
                    sumItems(s.damageItems),
                    adj > 0 ? { amount: adj, method: 'Sales Adjustment', account: {} } : s.damagePayment || null
                );
            }),
    ];

    // 5) Customer due payment (Get = customer theke nilam, Pay = customer ke dilam)
    const duePayRows = duePayments.map((p) => {
        const amt = r2(n(p.amount));
        const isPay = p.type === 'Pay' || p.status === 'Pay' || p.paymentAccount?.dueType === 'Pay';
        return {
            rowId: `dp-${p._id}`,
            source: 'Due Payment',
            nav: null,
            payDate: p.date || '',
            payTime: idTimeOf(p._id) || getTime(p.date),
            editedAt: '',
            invoiceNo: p.invoiceNo || '',
            customer: p.customer || '',
            phone: p.customerContact || getPhoneByName(p.customer),
            sr: p.sr || '',
            deliveredBy: p.deliveredBy || '',
            route: '',
            direct: false,
            status: '',
            method: p.paymentMethod || '',
            account: accountLabel(p.paymentMethod, p.paymentAccount || {}),
            receivable: 0,
            payable: 0,
            received: isPay ? 0 : amt,
            paid: isPay ? amt : 0,
            pay: 0,
            get: 0,
        };
    });

    // Sob mile (notun age)
    const rows = [...saleRows, ...saleReturnRows, ...bulkRows, ...damageRows, ...duePayRows]
        .filter((r) => r.receivable > 0 || r.payable > 0 || r.received > 0 || r.paid > 0)
        .sort((a, b) => b.payTime - a.payTime);

    const methodOptions = [...new Set(rows.map((r) => r.method).filter(Boolean))];

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const srOptions = uniq(users.filter((u) => u.role === 'SR').map((u) => u.name));
    const deliveryOptions = uniq(users.filter((u) => u.role === 'Delivery Man').map((u) => u.name));
    const routeOptions = uniq(orders.map((o) => o.route));

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
        if (filters.customer && !r.customer?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.customerContact && r.phone && r.phone !== filters.customerContact) return false;
        if (filters.source && r.source !== filters.source) return false;
        if (filters.method && r.method !== filters.method) return false;
        if (filters.account && !r.account?.toLowerCase().includes(filters.account.toLowerCase())) return false;
        if (filters.dueStatus === 'Due' && !(r.pay > 0 || r.get > 0)) return false;
        if (filters.dueStatus === 'NoDue' && (r.pay > 0 || r.get > 0)) return false;
        if (directOnly && !r.direct) return false;
        if (filters.sr && !r.sr?.toLowerCase().includes(filters.sr.toLowerCase())) return false;
        if (filters.deliveredBy && !r.deliveredBy?.toLowerCase().includes(filters.deliveredBy.toLowerCase())) return false;
        if (filters.route && !r.route?.toLowerCase().includes(filters.route.toLowerCase())) return false;
        if (filters.status && r.source === 'Sale' && r.status !== filters.status) return false;
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

    const sum = (key) => summaryRows.reduce((s, r) => s + (r[key] || 0), 0);
    const summaryReceivable = sum('receivable');
    const summaryPayable = sum('payable');
    const summaryReceived = sum('received');
    const summaryPaid = sum('paid');
    const summaryGet = sum('get');
    const summaryPay = sum('pay');
    const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });

    const handleInvoiceClick = (r) => {
        if (!r.nav) return;
        navigate(r.nav.path, r.nav.state ? { state: r.nav.state } : undefined);
    };

    const amtCell = (v, cls) => (v > 0 ? <span className={cls}>৳{v.toFixed(2)}</span> : <Dash />);

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Sales Customer Ledger
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Sale, Sales Return, Bulk Return, Damage Return ar Due Payment — sob hisab, notun entry sobar upore</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Customer Ledger</h3>
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

                            {/* Invoice + Direct Sales */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-gray-600 text-[11px] font-semibold">Invoice Number</label>
                                    <label className="flex items-center gap-1 text-[10px] font-semibold text-teal-700 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={directOnly}
                                            onChange={(e) => {
                                                setDirectOnly(e.target.checked);
                                                setCurrentPage(1);
                                            }}
                                            className="w-3 h-3 accent-teal-600 cursor-pointer"
                                        />
                                        Direct Sales
                                    </label>
                                </div>
                                <input
                                    type="text"
                                    name="invoiceNo"
                                    placeholder="Search invoice..."
                                    value={filters.invoiceNo}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Customer Searchable Dropdown */}
                            <div className="relative" ref={customerDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer</label>
                                <div
                                    onClick={() => setIsCustomerOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select customer..."
                                        value={filters.customer}
                                        onChange={(e) => {
                                            setFilters({ ...filters, customer: e.target.value, customerContact: '' });
                                            setCurrentPage(1);
                                            setIsCustomerOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.customer && (
                                        <button type="button" onClick={handleClearCustomer} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isCustomerOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((c) => (
                                                <div
                                                    key={c._id}
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{getCustomerName(c)}</p>
                                                    {c.contactNumber && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5">📞 {c.contactNumber}</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No customer found</div>
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

                            {/* SR */}
                            <FilterSelect
                                label="SR"
                                placeholder="Search or select SR..."
                                value={filters.sr}
                                options={srOptions}
                                onChange={(v) => {
                                    setFilters((prev) => ({ ...prev, sr: v }));
                                    setCurrentPage(1);
                                }}
                                emptyText="No SR found"
                            />

                            {/* Delivered By */}
                            <FilterSelect
                                label="Delivered By"
                                placeholder="Search or select delivery man..."
                                value={filters.deliveredBy}
                                options={deliveryOptions}
                                onChange={(v) => {
                                    setFilters((prev) => ({ ...prev, deliveredBy: v }));
                                    setCurrentPage(1);
                                }}
                                emptyText="No delivery man found"
                            />

                            {/* Route */}
                            <FilterSelect
                                label="Route"
                                placeholder="Search or select route..."
                                value={filters.route}
                                options={routeOptions}
                                onChange={(v) => {
                                    setFilters((prev) => ({ ...prev, route: v }));
                                    setCurrentPage(1);
                                }}
                                emptyText="No route found"
                            />

                            {/* Status (Sale source er jonno) */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Sale Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="New Order">New Order</option>
                                    <option value="Delivered">Delivered</option>
                                </select>
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
                                    <option value="Due">Has Pay / Get</option>
                                    <option value="NoDue">Settled</option>
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
                            Receivable: <b className="text-indigo-600">৳{fmt(summaryReceivable)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Payable: <b className="text-rose-600">৳{fmt(summaryPayable)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Received: <b className="text-emerald-600">৳{fmt(summaryReceived)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Paid: <b className="text-orange-600">৳{fmt(summaryPaid)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Get: <b className="text-sky-600">৳{fmt(summaryGet)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Pay: <b className="text-rose-600">৳{fmt(summaryPay)}</b>
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
                        <div className="text-center py-20 text-gray-400 font-medium">No records found!</div>
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
                                        <th>Info</th>
                                        <th>Customer</th>
                                        <th>Source</th>
                                        <th>Payment Method</th>
                                        <th>Account</th>
                                        <th>Receivable Amount</th>
                                        <th>Payable Amount</th>
                                        <th>Received Amount</th>
                                        <th>Paid Amount</th>
                                        <th>Get Amount</th>
                                        <th>Pay Amount</th>
                                        <th>Status</th>
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
                                                {r.direct ? (
                                                    <span className="inline-block px-1.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[9px] leading-none shadow-sm">
                                                        ⚡ Direct Sales
                                                    </span>
                                                ) : r.sr || r.deliveredBy || r.route ? (
                                                    <div className="space-y-0.5 leading-tight">
                                                        <div>SR: <b className="text-gray-700">{r.sr || 'N/A'}</b></div>
                                                        <div>Delivery By: <b className="text-gray-700">{r.deliveredBy || 'N/A'}</b></div>
                                                        {r.route && <div>Route: <b className="text-gray-700">{r.route}</b></div>}
                                                    </div>
                                                ) : (
                                                    <Dash />
                                                )}
                                            </td>
                                            <td className="text-gray-600">
                                                <div>{r.customer}</div>
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
                                            <td className="font-semibold">{amtCell(r.receivable, 'text-indigo-600')}</td>
                                            <td className="font-semibold">{amtCell(r.payable, 'text-rose-600')}</td>
                                            <td className="font-bold">{amtCell(r.received, 'text-emerald-600')}</td>
                                            <td className="font-bold">{amtCell(r.paid, 'text-orange-600')}</td>
                                            <td className={`font-bold ${r.get > 0 ? 'text-sky-600' : 'text-slate-400'}`}>৳{r.get.toFixed(2)}</td>
                                            <td className={`font-bold ${r.pay > 0 ? 'text-rose-600' : 'text-slate-400'}`}>৳{r.pay.toFixed(2)}</td>
                                            <td>
                                                {r.source === 'Sale' ? (
                                                    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] ${r.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {r.status}
                                                    </span>
                                                ) : (
                                                    <Dash />
                                                )}
                                            </td>
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

export default SaleCustomerLedgerRepo;