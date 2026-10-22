import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;

const fmt = (v) => n(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

const getRowGross = (it) =>
    n(it.unitQty) * n(it.sellPriceUnit) + n(it.subQty) * n(it.sellPriceSub) + n(it.pcsQty) * n(it.sellPricePcs);

// Subtotal (discount er age)
const getSubTotal = (o) => {
    if (o.subTotal !== undefined && o.subTotal !== null && o.subTotal !== '') return n(o.subTotal);
    if (o.grandTotal !== undefined && o.grandTotal !== null && o.grandTotal !== '') return n(o.grandTotal);
    return (o.items || []).reduce((s, it) => s + getRowGross(it), 0);
};

// Product wise discount + Overall discount
const getDiscount = (o) => {
    const subTotal = getSubTotal(o);
    let pwd;
    if (o.productWiseDiscount !== undefined && o.productWiseDiscount !== null && o.productWiseDiscount !== '') {
        pwd = n(o.productWiseDiscount);
    } else {
        pwd = (o.items || []).reduce((s, it) => {
            if (it.discountAmount !== undefined && it.discountAmount !== null) return s + n(it.discountAmount);
            const gross = getRowGross(it);
            return s + (it.discountType === 'percent' ? (gross * n(it.discount)) / 100 : n(it.discount));
        }, 0);
    }
    const afterProduct = subTotal - pwd;
    let overall;
    if (o.overallDiscountValue !== undefined && o.overallDiscountValue !== null && o.overallDiscountValue !== '') {
        overall = n(o.overallDiscountValue);
    } else {
        overall =
            o.overallDiscountType === 'percent'
                ? (afterProduct * n(o.overallDiscount)) / 100
                : n(o.overallDiscount);
    }
    return Math.round((pwd + overall) * 100) / 100;
};

// Normal adjustment (+ hole add, - hole minus)
const getAdjustment = (o) => {
    const amt = n(o.adjustment?.amount);
    return o.adjustment?.type === '-' ? -amt : amt;
};

const getReturnAmt = (o) => n(o.returnAdjustmentAmount);
const getDamageAmt = (o) => n(o.damageAdjustmentAmount);

// Grand Total = Payable Amount (na thakle Subtotal - Discount ± Adjustment - Return - Damage)
const getGrandTotal = (o) => {
    if (o.payableAmount !== undefined && o.payableAmount !== null && o.payableAmount !== '') {
        return Math.max(n(o.payableAmount), 0);
    }
    return Math.max(
        Math.round((getSubTotal(o) - getDiscount(o) + getAdjustment(o) - getReturnAmt(o) - getDamageAmt(o)) * 100) / 100,
        0
    );
};

const getStatus = (o) => (o.status === 'Delivered' ? 'Delivered' : 'New Order');

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

const dateKeyOf = (d) =>
    d ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` : 'nodate';

const fmtDate = (d) =>
    d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

// Searchable dropdown (Customer / SR / Delivery Man / Route)
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

const SaleCustomerWiseInvoiceRepo = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
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
        sr: '',
        deliveredBy: '',
        route: '',
        status: '',
    };
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [directOnly, setDirectOnly] = useState(false);

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [oRes, cRes, uRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/sales'),
                    fetch('https://squirrel-peace-server.onrender.com/customer'),
                    fetch('https://squirrel-peace-server.onrender.com/user'),
                ]);
                const oData = await oRes.json();
                const cData = await cRes.json().catch(() => []);
                const uData = await uRes.json().catch(() => []);
                setOrders(Array.isArray(oData) ? oData : []);
                setCustomers(Array.isArray(cData) ? cData : []);
                setUsers(Array.isArray(uData) ? uData : []);
            } catch (error) {
                console.error('Error fetching customer wise invoice data:', error);
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

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleFilterChange = (e) => setFilter(e.target.name, e.target.value);

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setDirectOnly(false);
        setCurrentPage(1);
    };

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const customerOptions = uniq(customers.map((c) => c.name));
    const srOptions = uniq(users.filter((u) => u.role === 'SR').map((u) => u.name));
    const deliveryOptions = uniq(users.filter((u) => u.role === 'Delivery Man').map((u) => u.name));
    const routeOptions = uniq(orders.map((o) => o.route));

    const has = (val, q) => String(val || '').toLowerCase().includes(String(q).toLowerCase());

    // 1) Age invoice level e filter
    const filteredOrders = orders.filter((o) => {
        if (directOnly && !o.directSales) return false;

        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(o.orderDate);
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

        if (filters.invoiceNo && !has(o.invoiceNo || o.orderNo, filters.invoiceNo)) return false;
        if (filters.customer && !has(o.customer, filters.customer)) return false;
        if (filters.sr && !has(o.sr, filters.sr)) return false;
        if (filters.deliveredBy && !has(o.deliveredBy, filters.deliveredBy)) return false;
        if (filters.route && !has(o.route, filters.route)) return false;
        if (filters.status && getStatus(o) !== filters.status) return false;
        return true;
    });

    // 2) Same date + same customer = ek row (sob sum hobe)
    const groupMap = new Map();
    filteredOrders.forEach((o) => {
        const d = parseToLocalDate(o.orderDate);
        const key = `${dateKeyOf(d)}|${o.customerId || o.customer || 'unknown'}`;
        if (!groupMap.has(key)) {
            groupMap.set(key, {
                key,
                date: d,
                customer: o.customer || 'N/A',
                routes: [],
                directCount: 0,
                invoiceCount: 0,
                orderIds: [],
                subTotal: 0,
                discount: 0,
                adjustment: 0,
                returnAmt: 0,
                damageAmt: 0,
                grand: 0,
            });
        }
        const g = groupMap.get(key);
        g.invoiceCount += 1;
        g.orderIds.push(o._id);
        if (o.directSales === true) g.directCount += 1;
        else if (o.route && !g.routes.includes(o.route)) g.routes.push(o.route);
        g.subTotal += getSubTotal(o);
        g.discount += getDiscount(o);
        g.adjustment += getAdjustment(o);
        g.returnAmt += getReturnAmt(o);
        g.damageAmt += getDamageAmt(o);
        g.grand += getGrandTotal(o);
    });

    const rows = Array.from(groupMap.values()).sort((a, b) => {
        const ta = a.date ? a.date.getTime() : 0;
        const tb = b.date ? b.date.getTime() : 0;
        if (tb !== ta) return tb - ta;
        return a.customer.localeCompare(b.customer);
    });

    // Pagination
    const totalPages = Math.ceil(rows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = rows.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (num) => {
        if (num >= 1 && num <= totalPages) setCurrentPage(num);
    };

    // Checkbox
    const isAllSelected = currentRows.length > 0 && currentRows.every((r) => selectedIds.includes(r.key));

    const handleSelectAll = () => {
        const ids = currentRows.map((r) => r.key);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };

    const handleSelectRow = (key) => {
        setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
    };

    // Summary
    const selectedRows = rows.filter((r) => selectedIds.includes(r.key));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : rows;

    const sum = (field) => summaryRows.reduce((s, r) => s + r[field], 0);
    const summaryInvoices = sum('invoiceCount');
    const summarySubTotal = sum('subTotal');
    const summaryDiscount = sum('discount');
    const summaryAdjustment = sum('adjustment');
    const summaryReturn = sum('returnAmt');
    const summaryDamage = sum('damageAmt');
    const summaryGrand = sum('grand');

    const NA = <span className="text-gray-300 font-semibold">N/A</span>;

    const AdjCell = ({ value }) =>
        Math.abs(value) < 0.005 ? (
            NA
        ) : (
            <span className={`font-bold ${value > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                {value > 0 ? '+' : '-'}৳{fmt(Math.abs(value))}
            </span>
        );

    const MinusCell = ({ value }) =>
        value <= 0 ? (
            NA
        ) : (
            <span className="font-bold text-rose-500">-৳{fmt(value)}</span>
        );

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Customer Wise Invoice Summary
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">একই তারিখে একই customer এর সব invoice মিলিয়ে একটি row</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Customer Summary</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {rows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, rows.length)}` : 0} of {rows.length} rows ({filteredOrders.length} invoices)
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
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

                            {/* Customer */}
                            <FilterSelect
                                label="Customer"
                                placeholder="Search or select customer..."
                                value={filters.customer}
                                options={customerOptions}
                                onChange={(v) => setFilter('customer', v)}
                                emptyText="No customer found"
                            />

                            {/* SR */}
                            <FilterSelect
                                label="SR"
                                placeholder="Search or select SR..."
                                value={filters.sr}
                                options={srOptions}
                                onChange={(v) => setFilter('sr', v)}
                                emptyText="No SR found"
                            />

                            {/* Delivered By */}
                            <FilterSelect
                                label="Delivered By"
                                placeholder="Search or select delivery man..."
                                value={filters.deliveredBy}
                                options={deliveryOptions}
                                onChange={(v) => setFilter('deliveredBy', v)}
                                emptyText="No delivery man found"
                            />

                            {/* Route */}
                            <FilterSelect
                                label="Route"
                                placeholder="Search or select route..."
                                value={filters.route}
                                options={routeOptions}
                                onChange={(v) => setFilter('route', v)}
                                emptyText="No route found"
                            />

                            {/* Status */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
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
                            Invoices: <b className="text-gray-800">{summaryInvoices}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Subtotal: <b className="text-gray-800">৳{fmt(summarySubTotal)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Discount: <b className="text-rose-600">৳{fmt(summaryDiscount)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Adjustment:{' '}
                            {Math.abs(summaryAdjustment) < 0.005 ? (
                                <b className="text-gray-400">N/A</b>
                            ) : (
                                <b className={summaryAdjustment > 0 ? 'text-emerald-600' : 'text-rose-500'}>
                                    {summaryAdjustment > 0 ? '+' : '-'}৳{fmt(Math.abs(summaryAdjustment))}
                                </b>
                            )}
                        </span>
                        <span className="font-semibold text-gray-600">
                            Return: <b className="text-violet-600">৳{fmt(summaryReturn)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Damage: <b className="text-red-600">৳{fmt(summaryDamage)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Grand Total: <b className="text-indigo-600">৳{fmt(summaryGrand)}</b>
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
                        <div className="text-center py-20 text-gray-500 font-medium">Loading report...</div>
                    ) : rows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No data found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="w-10 px-2 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-3 py-3">Customer</th>
                                        <th className="px-3 py-3">Route</th>
                                        <th className="px-3 py-3">Subtotal</th>
                                        <th className="px-3 py-3">Discount</th>
                                        <th className="px-3 py-3">Adjustment</th>
                                        <th className="px-3 py-3">Return</th>
                                        <th className="px-3 py-3">Damage</th>
                                        <th className="px-3 py-3">Grand Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {currentRows.map((r) => (
                                        <tr
                                            key={r.key}
                                            className={`transition duration-150 ${selectedIds.includes(r.key) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}
                                        >
                                            <td className="px-2 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(r.key)}
                                                    onChange={() => handleSelectRow(r.key)}
                                                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                />
                                            </td>

                                            {/* Date */}
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600 font-medium">
                                                {fmtDate(r.date)}
                                            </td>

                                            {/* Customer */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate('/sale-customer-sum-details', {
                                                            state: { ids: r.orderIds },
                                                        })
                                                    }
                                                    className="font-bold text-indigo-700 hover:text-pink-600 hover:underline cursor-pointer transition-colors text-left"
                                                >
                                                    {r.customer}
                                                </button>
                                                <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                                                    {r.invoiceCount} invoice{r.invoiceCount > 1 ? 's' : ''}
                                                </div>
                                            </td>

                                            {/* Route */}
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                                {r.routes.length === 0 && r.directCount === 0 && NA}
                                                {r.routes.length > 0 && <div>{r.routes.join(', ')}</div>}
                                                {r.directCount > 0 && (
                                                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm">
                                                        ⚡ Direct Sales{r.directCount > 1 ? ` (${r.directCount})` : ''}
                                                    </span>
                                                )}
                                            </td>

                                            {/* Subtotal */}
                                            <td className="px-3 py-3 whitespace-nowrap font-semibold text-gray-700">
                                                ৳{fmt(r.subTotal)}
                                            </td>

                                            {/* Discount */}
                                            <td className="px-3 py-3 whitespace-nowrap font-semibold text-rose-600">
                                                ৳{fmt(r.discount)}
                                            </td>

                                            {/* Adjustment */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <AdjCell value={r.adjustment} />
                                            </td>

                                            {/* Return */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <MinusCell value={r.returnAmt} />
                                            </td>

                                            {/* Damage */}
                                            <td className="px-3 py-3 whitespace-nowrap">
                                                <MinusCell value={r.damageAmt} />
                                            </td>

                                            {/* Grand Total */}
                                            <td className="px-3 py-3 whitespace-nowrap font-bold text-indigo-600">
                                                ৳{fmt(r.grand)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && rows.length > 0 && (
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

export default SaleCustomerWiseInvoiceRepo;