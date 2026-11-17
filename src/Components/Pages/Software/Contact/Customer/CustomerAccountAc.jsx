import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    FaClock, FaEdit, FaBalanceScale, FaUser, FaArrowUp, FaArrowDown,
    FaFileInvoice, FaUndoAlt, FaBoxOpen, FaExclamationTriangle, FaMoneyBillWave,
} from 'react-icons/fa';
import CustomerSaleDueAc from './CustomerSaleDueAc';
import {
    LedgerShell, EntitySelector, CreditLimitBar, LedgerTabs, EmptyEntity,
    FilterPanel, ListCard, LedgerTable, PopStyle, Tag, NotUsed, MethodPill, InvoiceLink, fmt,
} from '../LedgerUi';

// ---------- Static helpers ----------
const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const itemAmt = (it) =>
    Number(it.itemTotal ?? it.subtotal ?? (num(it.sellPricePcs ?? it.sellPrice) * num(it.totalQty))) || 0;
const sumItems = (items) => (items || []).reduce((s, it) => s + itemAmt(it), 0);
const sameName = (a, b) =>
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

// ---------- Shared customer balance (OrderAdd o eta use kore) ----------
// net > 0 => ami customer ke dibo (type 'Get'), net < 0 => customer amake dibe (type 'Due')
export const calcCustomerBalance = (
    { sales = [], bulkReturns = [], damageReturns = [], duePayments = [], customers = [] },
    customer,
    excludeSaleId = null
) => {
    if (!String(customer || '').trim()) return { pay: 0, get: 0, net: 0, amount: 0, type: '' };
    const same = (a) => sameName(a, customer);
    const skip = (s) => excludeSaleId && String(s._id) === String(excludeSaleId);
    let pay = 0;
    let get = 0;

    // Opening balance
    const info = customers.find((c) => same(c.businessName));
    const openAmt = r2(num(info?.openingBalance));
    const openType = String(info?.openingBalanceType || '').trim().toLowerCase();
    if (openAmt > 0 && (openType === 'pay' || openType === 'advance')) pay += openAmt;
    if (openAmt > 0 && (openType === 'due' || openType === 'get')) get += openAmt;

    // Sales payments
    sales.forEach((s) => {
        if (skip(s)) return;
        if (!same(s.customer)) return;
        if (s.paidAmount === undefined || s.paidAmount === null || s.paidAmount === '' || !s.paymentMethod) return;
        const prev = num(s.previousBalanceAmount);
        const payable =
            num(s.payableAmount) -
            (s.previousBalanceType === 'Due' ? prev : 0) +
            (s.previousBalanceType === 'Get' ? prev : 0);
        const paid = num(s.paidAmount);
        const isDel = s.status === 'Delivered';
        const balDue = payable < 0
            ? Math.max(r2(paid + payable), 0)
            : !isDel ? 0 : Math.max(r2(payable - paid), 0);
        const balExtra = payable < 0
            ? Math.max(r2(-payable - paid), 0)
            : !isDel ? paid : Math.max(r2(paid - payable), 0);
        pay += balExtra;
        get += balDue;
    });

    // Sales return
    sales.forEach((s) => {
        if (skip(s)) return;
        if (!same(s.customer)) return;
        (s.returnHistory || []).forEach((ret) => {
            const amt = num(ret.totalReturnAmount);
            const rec = ret.payment ? num(ret.payment.amount) : 0;
            pay += Math.max(amt - rec, 0);
            get += Math.max(rec - amt, 0);
        });
    });

    // Bulk return
    bulkReturns.forEach((b) => {
        if (!same(b.customer)) return;
        if (excludeSaleId && b.fromSales === true && String(b.saleId) === String(excludeSaleId)) return;
        const adj =
            b.fromSales === true
                ? num(sales.find((s) => String(s._id) === String(b.saleId))?.returnAdjustmentAmount)
                : 0;
        const rec = adj > 0 ? adj : b.payment ? num(b.payment.amount) : 0;
        const amt = num(b.returnAmount);
        pay += Math.max(amt - rec, 0);
        get += Math.max(rec - amt, 0);
    });

    // Damage (standalone)
    damageReturns.forEach((d) => {
        if (!d.customer || !same(d.customer)) return;
        const amt = num(d.damageAmount) || num(d.returnAmount) || sumItems(d.items);
        const rec = d.payment ? num(d.payment.amount) : 0;
        pay += Math.max(amt - rec, 0);
        get += Math.max(rec - amt, 0);
    });

    // Damage (from sales)
    sales.forEach((s) => {
        if (skip(s)) return;
        if (!same(s.customer)) return;
        if (s.status !== 'Delivered' || !(s.damageItems || []).length) return;
        const amt = sumItems(s.damageItems);
        const adj = num(s.damageAdjustmentAmount);
        const rec = adj > 0 ? adj : s.damagePayment ? num(s.damagePayment.amount) : 0;
        pay += Math.max(amt - rec, 0);
        get += Math.max(rec - amt, 0);
    });

    // Customer due payment
    duePayments.forEach((p) => {
        if (!same(p.customer)) return;
        const amt = r2(num(p.amount));
        const isPay = p.type === 'Pay' || p.status === 'Pay' || p.paymentAccount?.dueType === 'Pay';
        if (isPay) get += amt;
        else pay += amt;
    });

    const net = r2(pay - get);
    return {
        pay: r2(pay),
        get: r2(get),
        net,
        amount: Math.abs(net),
        type: net > 0 ? 'Get' : net < 0 ? 'Due' : '',
    };
};

const safeList = (url) =>
    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

// Fresh data fetch kore balance dey (refresh lagbe na)
export const fetchCustomerBalance = async (customer, excludeSaleId = null) => {
    const [sales, bulkReturns, damageReturns, customers, duePayments] = await Promise.all([
        safeList('http://localhost:5000/sales'),
        safeList('http://localhost:5000/sales-bulk-return'),
        safeList('http://localhost:5000/sales-damage'),
        safeList('http://localhost:5000/customer'),
        safeList('http://localhost:5000/sales-due-payment'),
    ]);
    return calcCustomerBalance(
        { sales, bulkReturns, damageReturns, customers, duePayments },
        customer,
        excludeSaleId
    );
};

const TABS = [
    { key: 'sale', label: 'Customer Sale', icon: FaFileInvoice, tone: 'brand' },
    { key: 'saleReturn', label: 'Sales Return AC', icon: FaUndoAlt, tone: 'amber' },
    { key: 'bulk', label: 'Bulk Return AC', icon: FaBoxOpen, tone: 'violet' },
    { key: 'damage', label: 'Damage Return AC', icon: FaExclamationTriangle, tone: 'rose' },
    { key: 'duePay', label: 'Customer Due Payment', icon: FaMoneyBillWave, tone: 'emerald' },
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
const CustomerAccountAc = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [query, setQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState('');

    const [activeTab, setActiveTab] = useState('sale');
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // ---------- Fetch ----------
    useEffect(() => {
        const loadData = async () => {
            try {
                const [dpRes, sRes, bRes, dRes, cRes] = await Promise.all([
                    fetch('http://localhost:5000/sales-due-payment'),
                    fetch('http://localhost:5000/sales'),
                    fetch('http://localhost:5000/sales-bulk-return'),
                    fetch('http://localhost:5000/sales-damage'),
                    fetch('http://localhost:5000/customer'),
                ]);
                const dpData = await dpRes.json();
                const sData = await sRes.json();
                const bData = await bRes.json();
                const dData = await dRes.json();
                const cData = await cRes.json();
                setSales(Array.isArray(sData) ? sData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setDamageReturns(Array.isArray(dData) ? dData : []);
                setCustomers(Array.isArray(cData) ? cData : []);
                setDuePayments(Array.isArray(dpData) ? dpData : []);
            } catch (error) {
                console.error('Error fetching customer account:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [location.pathname]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedCustomer, activeTab, filters]);

    useEffect(() => {
        setFilters(EMPTY_FILTERS);
    }, [selectedCustomer, activeTab]);

    // ---------- Customer options ----------
    const customerNames = (() => {
        const seen = new Map();
        const put = (n) => {
            const name = String(n || '').trim();
            if (name && !seen.has(name.toLowerCase())) seen.set(name.toLowerCase(), name);
        };
        const phoneOf = (name) =>
            customers.find((c) => sameName(c.businessName, name))?.contactNumber || '';
        customers.forEach((c) => put(c.businessName));
        duePayments.forEach((d) => put(d.customer));
        sales.forEach((s) => put(s.customer));
        bulkReturns.forEach((b) => put(b.customer));
        damageReturns.forEach((d) => put(d.customer));
        return [...seen.values()].map((name) => ({ name, phone: phoneOf(name) }));
    })();

    const customerOptions = customerNames.filter((c) => {
        const s = query.trim().toLowerCase();
        return c.name.toLowerCase().includes(s) || (c.phone || '').toLowerCase().includes(s);
    });
    const customerInfo = customers.find((c) => sameName(c.businessName, selectedCustomer));

    // Opening balance: Due/Get = customer amar kache pabe (Get), Pay/Advance = ami customer ke dibo (Pay)
    const openingAmount = r2(num(customerInfo?.openingBalance));
    const openingTypeRaw = String(customerInfo?.openingBalanceType || '').trim().toLowerCase();
    const openingType =
        openingAmount > 0 && (openingTypeRaw === 'pay' || openingTypeRaw === 'advance')
            ? 'Pay'
            : openingAmount > 0 && (openingTypeRaw === 'due' || openingTypeRaw === 'get')
                ? 'Get'
                : '';
    const openingPay = openingType === 'Pay' ? openingAmount : 0;
    const openingGet = openingType === 'Get' ? openingAmount : 0;

    const handleSelectCustomer = (name) => {
        setSelectedCustomer(name);
        setQuery(name);
    };

    const handleClearCustomer = () => {
        setSelectedCustomer('');
        setQuery('');
        setActiveTab('sale');
    };

    const handleQuery = (v) => {
        setQuery(v);
        if (selectedCustomer) {
            setSelectedCustomer('');
            setActiveTab('sale');
        }
    };

    // ---------- Build rows ----------
    // 1) Sales payments
    const saleAll = sales
        .filter((s) => s.paidAmount !== undefined && s.paidAmount !== null && s.paidAmount !== '' && !!s.paymentMethod)
        .map((s) => {
            const prevBal = num(s.previousBalanceAmount);
            const payable =
                num(s.payableAmount) -
                (s.previousBalanceType === 'Due' ? prevBal : 0) +
                (s.previousBalanceType === 'Get' ? prevBal : 0);
            const fullPayable = num(s.payableAmount);
            const paid = num(s.paidAmount);
            const isDel = s.status === 'Delivered';
            // Table: customer ekhono dibe (due) / beshi diyeche (extra)
            const due = fullPayable < 0
                ? Math.max(r2(paid + fullPayable), 0)
                : !isDel ? 0 : Math.max(r2(fullPayable - paid), 0);
            const extra = fullPayable < 0
                ? Math.max(r2(-fullPayable - paid), 0)
                : !isDel ? paid : Math.max(r2(paid - fullPayable), 0);
            // Balance: Previous Due/Get bade
            const balDue = payable < 0
                ? Math.max(r2(paid + payable), 0)
                : !isDel ? 0 : Math.max(r2(payable - paid), 0);
            const balExtra = payable < 0
                ? Math.max(r2(-payable - paid), 0)
                : !isDel ? paid : Math.max(r2(paid - payable), 0);
            return {
                key: s._id,
                id: s._id,
                company: s.customer,
                invoiceNo: s.invoiceNo || s.orderNo,
                orderDate: s.orderDate,
                deliveryDate: s.deliveryDate,
                isDelivered: isDel,
                paymentDate: s.paymentDate || s.deliveryDate || s.orderDate,
                paymentEditedAt: s.paymentEditedAt,
                method: s.paymentMethod,
                methodKey: s.paymentMethod,
                account: accountLabel(s.paymentMethod, s.paymentAccount || {}),
                total: fullPayable < 0 ? 0 : fullPayable,
                payableAmt: fullPayable < 0 ? -fullPayable : 0,
                isPayable: fullPayable < 0,
                paid: fullPayable < 0 ? 0 : paid,
                paidOut: fullPayable < 0 ? paid : 0,
                due,
                extra,
                pay: balExtra,
                get: balDue,
                damageAdj: num(s.damageAdjustmentAmount),
                bulkAdj: num(s.returnAdjustmentAmount),
                prevAdjAmount: prevBal,
                prevAdjType: s.previousBalanceType,
                dateRaw: s.paymentDate || s.deliveryDate || s.orderDate || '',
                time: s.paymentDate && !isNaN(new Date(s.paymentDate).getTime())
                    ? new Date(s.paymentDate).getTime()
                    : idTimeOf(s._id),
            };
        });

    // return rows: amt = return value, refunded = amra customer ke ferot dilam
    const makeReturnRow = (base, amt, payment) => {
        const refunded = payment ? num(payment.amount) : 0;
        const due = Math.max(amt - refunded, 0); // customer ke ekhono dite hobe (Pay)
        const extra = Math.max(refunded - amt, 0); // beshi dilam, customer theke pabo (Get)
        return {
            ...base,
            payment,
            method: payment?.method || '',
            methodKey: payment?.method || 'NotUsed',
            account: payment ? accountLabel(payment.method, payment.account || {}) : '',
            total: amt,
            paid: refunded,
            due,
            extra,
            pay: due,
            get: extra,
        };
    };

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

    // 2) Sales return
    const saleReturnAll = [];
    sales.forEach((order) => {
        (order.returnHistory || []).forEach((ret) => {
            const createdMs = ret.createdAt ? new Date(ret.createdAt).getTime() : NaN;
            const idMatch = String(ret.returnId || '').match(/\d{13}/);
            const d = parseToLocalDate(ret.returnDate);
            const time = !isNaN(createdMs) ? createdMs : idMatch ? Number(idMatch[0]) : d ? d.getTime() : 0;
            saleReturnAll.push(
                makeReturnRow(
                    {
                        key: `${order._id}-${ret.returnId}`,
                        company: order.customer,
                        invoiceNo: order.invoiceNo || order.orderNo,
                        returnDate: ret.returnDate,
                        dateRaw: ret.returnDate,
                        editedAt: ret.editedAt,
                        fromSales: false,
                        nav: { path: `/sales-return-view/${order._id}?returnId=${ret.returnId}` },
                        time,
                    },
                    num(ret.totalReturnAmount),
                    ret.payment || null
                )
            );
        });
    });

    // 3) Bulk return
    const bulkAll = bulkReturns.map((b) => {
        const adj =
            b.fromSales === true
                ? num(sales.find((s) => String(s._id) === String(b.saleId))?.returnAdjustmentAmount)
                : 0;
        const payment = adj > 0 ? { amount: adj, method: 'Sales Adjustment', account: {} } : b.payment || null;
        const fromSales = b.fromSales === true;
        return makeReturnRow(
            {
                key: b._id,
                company: b.customer,
                invoiceNo: b.invoiceNo,
                returnDate: b.returnDate,
                dateRaw: b.returnDate,
                editedAt: b.editedAt,
                fromSales,
                nav: fromSales && b.saleId
                    ? { path: `/sales-details/${b.saleId}`, state: { scrollToReturn: true } }
                    : { path: `/sales-bulk-return-view/${b._id}` },
                time: rowTimeOf(b.createdAt, b._id, b.returnDate),
            },
            num(b.returnAmount),
            payment
        );
    });

    // 4) Damage return (standalone customer damage + sales theke damage)
    const damageAll = [
        ...damageReturns.filter((d) => d.customer).map((d) =>
            makeReturnRow(
                {
                    key: `sd-${d._id}`,
                    company: d.customer,
                    invoiceNo: d.invoiceNo,
                    returnDate: d.returnDate || d.date,
                    dateRaw: d.returnDate || d.date,
                    editedAt: d.editedAt,
                    fromSales: false,
                    // FIX v1.9r: Router e `/sales-damage-details` nei, sothik route `/damage-details/:id`
                    nav: { path: `/damage-details/${d._id}` },
                    time: rowTimeOf(d.createdAt, d._id, d.returnDate || d.date),
                },
                num(d.damageAmount) || num(d.returnAmount) || sumItems(d.items),
                d.payment || null
            )
        ),
        ...sales
            .filter((s) => s.status === 'Delivered' && (s.damageItems || []).length > 0)
            .map((s) => {
                const adj = num(s.damageAdjustmentAmount);
                return makeReturnRow(
                    {
                        key: `sa-${s._id}`,
                        company: s.customer,
                        invoiceNo: s.invoiceNo || s.orderNo,
                        returnDate: s.deliveryDate || s.orderDate,
                        dateRaw: s.deliveryDate || s.orderDate,
                        editedAt: s.damageEditedAt || null,
                        fromSales: true,
                        nav: { path: `/sales-details/${s._id}`, state: { scrollTo: 'damage-products-section' } },
                        time: rowTimeOf(s.damageAt || s.createdAt, s._id, s.deliveryDate || s.orderDate),
                    },
                    sumItems(s.damageItems),
                    adj > 0 ? { amount: adj, method: 'Sales Adjustment', account: {} } : s.damagePayment || null
                );
            }),
    ];

    // 5) Customer due payment (Get = customer theke nilam, Pay = customer ke dilam)
    const duePayAll = duePayments.map((p) => {
        const amt = r2(num(p.amount));
        const isPay = p.type === 'Pay' || p.status === 'Pay' || p.paymentAccount?.dueType === 'Pay';
        return {
            key: `dp-${p._id}`,
            company: p.customer,
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
            // customer theke nile Get balance kome (pay barbe), customer ke dile Pay balance kome (get barbe)
            pay: isPay ? 0 : amt,
            get: isPay ? amt : 0,
            status: isPay ? 'Pay' : 'Get',
            sr: p.sr || '',
            deliveredBy: p.deliveredBy || '',
            time: idTimeOf(p._id) || (parseToLocalDate(p.date)?.getTime() || 0),
        };
    });

    // ---------- Selected customer data ----------
    const hasCustomer = !!selectedCustomer;
    const forCustomer = (list) =>
        hasCustomer
            ? list.filter((r) => sameName(r.company, selectedCustomer)).sort((a, b) => b.time - a.time)
            : [];

    const data = {
        sale: forCustomer(saleAll),
        saleReturn: forCustomer(saleReturnAll),
        bulk: forCustomer(bulkAll),
        damage: forCustomer(damageAll),
        duePay: forCustomer(duePayAll),
    };

    const sourceBalance = (rows) => ({
        pay: r2(rows.reduce((s, r) => s + r.pay, 0)),
        get: r2(rows.reduce((s, r) => s + r.get, 0)),
    });
    const balances = {
        sale: sourceBalance(data.sale),
        saleReturn: sourceBalance(data.saleReturn),
        bulk: sourceBalance(data.bulk),
        damage: sourceBalance(data.damage),
        duePay: sourceBalance(data.duePay),
    };

    const finalNet = calcCustomerBalance(
        { sales, bulkReturns, damageReturns, duePayments, customers },
        selectedCustomer
    ).net;
    const finalPay = finalNet > 0 ? finalNet : 0;
    const finalGet = finalNet < 0 ? -finalNet : 0;

    // Credit limit (customer er creditLimit set thakle)
    const creditLimitRaw = customerInfo?.creditLimit;
    const hasCreditLimit =
        creditLimitRaw !== undefined && creditLimitRaw !== null && String(creditLimitRaw).trim() !== '' && !isNaN(Number(creditLimitRaw));
    const creditLimit = hasCreditLimit ? r2(Number(creditLimitRaw)) : 0;
    const creditRemaining = hasCreditLimit ? r2(creditLimit - finalGet) : 0;
    const creditUsedPercent = hasCreditLimit && creditLimit > 0 ? Math.min(Math.max((finalGet / creditLimit) * 100, 0), 100) : 0;
    const creditExceeded = hasCreditLimit && creditRemaining < 0;

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
    const sPayable = filteredRows.reduce((s, r) => s + (r.payableAmt || 0), 0);
    const sPaidOut = filteredRows.reduce((s, r) => s + (r.paidOut || 0), 0);

    const isSaleTab = activeTab === 'sale';
    const showPayable = isSaleTab && currentAll.some((r) => r.isPayable);
    const isDuePayTab = activeTab === 'duePay';
    const tabMeta = TABS.find((t) => t.key === activeTab) || TABS[0];
    // Sale tab: due = Get, extra = Pay | Return tabs: due = Pay, extra = Get
    const pillLabels = isSaleTab
        ? ['Receivable', 'Received', 'Get', 'Pay']
        : ['Return', 'Refunded', 'Pay', 'Get'];

    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const handleClearFilters = () => setFilters(EMPTY_FILTERS);

    // ---------- Columns ----------
    const saleCols = [
        {
            key: 'date',
            label: 'Date',
            cell: (r) => (
                <div className="text-[11px] text-slate-600 space-y-0.5">
                    <div className="font-medium">Order : {r.orderDate || 'N/A'}</div>
                    <div>
                        {r.isDelivered ? (
                            <span>Delivered: {r.deliveryDate || 'N/A'}</span>
                        ) : (
                            <Tag tone="amber">Not Delivered</Tag>
                        )}
                    </div>
                    <div className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <FaClock className="text-emerald-500" size={10} />
                        Received: {formatDateOnly(r.paymentDate) || 'N/A'}
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
                <div className="flex flex-col items-end md:items-start gap-1">
                    <InvoiceLink onClick={() => navigate(`/sales-details/${r.id}`)}>{r.invoiceNo}</InvoiceLink>
                    {r.damageAdj > 0 && <Tag tone="rose">Damage Adjusted: ৳ {fmt(r.damageAdj)}</Tag>}
                    {r.bulkAdj > 0 && <Tag tone="violet">Bulk Adjusted: ৳ {fmt(r.bulkAdj)}</Tag>}
                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Due' && (
                        <Tag tone="sky">Due Adjusted: ৳ {fmt(r.prevAdjAmount)}</Tag>
                    )}
                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Get' && (
                        <Tag tone="rose">Get Adjusted: ৳ {fmt(r.prevAdjAmount)}</Tag>
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
            key: 'recvable',
            label: 'Receivable Amount',
            cls: 'font-semibold text-brand-600',
            cell: (r) => (r.isPayable ? Dash : `৳ ${fmt(r.total)}`),
        },
        ...(showPayable
            ? [{
                key: 'payable',
                label: 'Payable Amount',
                cls: 'font-semibold text-rose-600',
                cell: (r) => (r.isPayable ? `৳ ${fmt(r.payableAmt)}` : Dash),
            }]
            : []),
        {
            key: 'received',
            label: 'Received Amount',
            cls: 'font-semibold text-emerald-600',
            cell: (r) => (r.isPayable ? Dash : `৳ ${fmt(r.paid)}`),
        },
        ...(showPayable
            ? [{
                key: 'paidOut',
                label: 'Paid Amount',
                cls: 'font-semibold text-rose-600',
                cell: (r) => (r.isPayable ? `৳ ${fmt(r.paidOut)}` : Dash),
            }]
            : []),
        { key: 'get', label: 'Get Amount', cls: 'font-semibold text-sky-600', cell: (r) => `৳ ${fmt(r.due)}` },
        { key: 'pay', label: 'Pay Amount', cls: 'font-semibold text-rose-600', cell: (r) => `৳ ${fmt(r.extra)}` },
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
                    {r.fromSales && <Tag tone="violet">From Sales</Tag>}
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
            key: 'refund',
            label: 'Refunded Amount',
            cls: 'font-semibold text-emerald-600',
            cell: (r) => (r.payment ? `৳ ${fmt(r.paid)}` : <NotUsed />),
        },
        { key: 'pay', label: 'Return Pay Amount', cls: 'font-semibold text-rose-600', cell: (r) => `৳ ${fmt(r.due)}` },
        { key: 'get', label: 'Return Get Amount', cls: 'font-semibold text-sky-600', cell: (r) => `৳ ${fmt(r.extra)}` },
    ];

    const chips = [
        { label: isDuePayTab ? 'Total Amount' : pillLabels[0], value: sTotal },
        ...(showPayable ? [{ label: 'Payable', value: sPayable }] : []),
        ...(!isDuePayTab ? [{ label: pillLabels[1], value: sPaid }] : []),
        ...(showPayable ? [{ label: 'Paid', value: sPaidOut }] : []),
        ...(!isDuePayTab
            ? [{ label: pillLabels[2], value: sDue }, { label: pillLabels[3], value: sExtra }]
            : []),
    ];

    return (
        <LedgerShell
            title="Customer Account"
            subtitle="Select a customer to see opening balance, sale, returns, damage and the final Pay / Get balance."
        >
            <PopStyle />

            <EntitySelector
                label="Select Customer"
                icon={FaUser}
                placeholder="Search customer by name or phone..."
                query={query}
                onQuery={handleQuery}
                onClear={handleClearCustomer}
                options={customerOptions}
                selected={selectedCustomer}
                onPick={handleSelectCustomer}
                loading={loading}
                chips={[
                    customerInfo?.contactNumber ? `📞 ${customerInfo.contactNumber}` : '',
                    customerInfo?.address ? `📍 ${customerInfo.address}` : '',
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
                        {hasCustomer ? 'You have to pay' : 'Select a customer'}
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
                        {hasCustomer ? 'You will receive' : 'Select a customer'}
                    </div>
                </div>
            </div>

            {hasCustomer && hasCreditLimit && (
                <CreditLimitBar
                    limit={creditLimit}
                    used={finalGet}
                    remaining={creditRemaining}
                    percent={creditUsedPercent}
                    exceeded={creditExceeded}
                />
            )}

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

            {!hasCustomer ? (
                <EmptyEntity word="customer" />
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
                        statusOptions={isDuePayTab ? ['Get', 'Pay'] : null}
                    />

                    <ListCard
                        title={
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-1.5 w-full min-w-0">
                                <span className="truncate">{`${selectedCustomer} — ${tabMeta.label}`}</span>
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
                            <CustomerSaleDueAc rows={currentRows} loading={loading} />
                        ) : (
                            <>
                                {/* Mobile compact cards */}
                                <div className="md:hidden p-1.5 space-y-1.5">
                                    {loading ? (
                                        <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
                                    ) : currentRows.length === 0 ? (
                                        <div className="py-8 text-center text-xs text-slate-400">No records found for this customer!</div>
                                    ) : (
                                        currentRows.map((r) => {
                                            const amts = isSaleTab
                                                ? [
                                                    [r.isPayable ? 'Payable' : 'Rcvbl', r.isPayable ? r.payableAmt : r.total, 'text-brand-600'],
                                                    [r.isPayable ? 'Paid' : 'Recv', r.isPayable ? r.paidOut : r.paid, 'text-emerald-600'],
                                                    ['Get', r.due, 'text-sky-600'],
                                                    ['Pay', r.extra, 'text-rose-600'],
                                                ]
                                                : [
                                                    ['Return', r.total, 'text-orange-600'],
                                                    ['Refund', r.paid, 'text-emerald-600'],
                                                    ['Pay', r.due, 'text-rose-600'],
                                                    ['Get', r.extra, 'text-sky-600'],
                                                ];
                                            const method = isSaleTab || r.payment ? r.method : '';
                                            const goInvoice = () =>
                                                isSaleTab
                                                    ? navigate(`/sales-details/${r.id}`)
                                                    : navigate(r.nav.path, r.nav.state ? { state: r.nav.state } : undefined);
                                            return (
                                                <div
                                                    key={r.key}
                                                    className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-1.5 shadow-sm"
                                                >
                                                    <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isSaleTab ? 'bg-brand-500' : 'bg-orange-400'}`} />
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
                                                                {!isSaleTab && !r.payment && <NotUsed />}
                                                                {!isSaleTab && r.fromSales && (
                                                                    <span className="shrink-0 bg-violet-50 text-violet-700 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight">
                                                                        From Sales
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                                <span className="uppercase text-slate-400 font-bold">{isSaleTab ? 'Order: ' : 'Return: '}</span>
                                                                {(isSaleTab ? r.orderDate : r.returnDate) || 'N/A'}
                                                            </p>
                                                            {isSaleTab && (
                                                                <p className="text-[10.5px] text-slate-500 leading-snug">
                                                                    <span className="uppercase text-slate-400 font-bold">Delivered: </span>
                                                                    {r.isDelivered ? (
                                                                        r.deliveryDate || 'N/A'
                                                                    ) : (
                                                                        <span className="px-1.5 py-px bg-amber-100 text-amber-700 rounded-full text-[9px] font-bold">Not Delivered</span>
                                                                    )}
                                                                </p>
                                                            )}
                                                            {isSaleTab && (
                                                                <p className="text-[10.5px] text-emerald-700 font-semibold leading-snug">
                                                                    <span className="uppercase text-slate-400 font-bold">Received: </span>
                                                                    {formatDateOnly(r.paymentDate) || 'N/A'}
                                                                </p>
                                                            )}
                                                            {isSaleTab && r.paymentEditedAt && (
                                                                <div>
                                                                    <EditedTag value={r.paymentEditedAt} />
                                                                </div>
                                                            )}
                                                            {!isSaleTab && r.editedAt && (
                                                                <div>
                                                                    <EditedTag value={r.editedAt} />
                                                                </div>
                                                            )}
                                                            {(isSaleTab || r.payment) && r.account && (
                                                                <p className="text-[10.5px] text-slate-500 leading-snug break-words">
                                                                    <span className="uppercase text-slate-400 font-bold">AC: </span>
                                                                    {r.account}
                                                                </p>
                                                            )}
                                                            {!isSaleTab && !r.payment && (
                                                                <p className="text-[10.5px] text-slate-500 leading-snug">
                                                                    <span className="uppercase text-slate-400 font-bold">AC: </span>
                                                                    <NotUsed />
                                                                </p>
                                                            )}
                                                            {isSaleTab && (r.damageAdj > 0 || r.bulkAdj > 0 || r.prevAdjAmount > 0) && (
                                                                <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                                                                    {r.damageAdj > 0 && (
                                                                        <span className="px-1.5 py-px rounded-full bg-red-50 text-red-600 text-[9px] font-semibold">Damage: ৳{fmt(r.damageAdj)}</span>
                                                                    )}
                                                                    {r.bulkAdj > 0 && (
                                                                        <span className="px-1.5 py-px rounded-full bg-violet-50 text-violet-600 text-[9px] font-semibold">Bulk: ৳{fmt(r.bulkAdj)}</span>
                                                                    )}
                                                                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Due' && (
                                                                        <span className="px-1.5 py-px rounded-full bg-sky-50 text-sky-600 text-[9px] font-semibold">Due Adj: ৳{fmt(r.prevAdjAmount)}</span>
                                                                    )}
                                                                    {r.prevAdjAmount > 0 && r.prevAdjType === 'Get' && (
                                                                        <span className="px-1.5 py-px rounded-full bg-rose-50 text-rose-600 text-[9px] font-semibold">Get Adj: ৳{fmt(r.prevAdjAmount)}</span>
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
                                        columns={isSaleTab ? saleCols : returnCols}
                                        rows={currentRows}
                                        loading={loading}
                                        emptyText="No records found for this customer!"
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

export default CustomerAccountAc;