import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;
const round2 = (v) => Math.round(n(v) * 100) / 100;
const fmt = (v) => n(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
const IN_HOUSE = 'From In House';

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

// total pcs ke Unit / Sub Unit / Pcs e bhangar helper
const splitQty = (total, perUnit, perSub, parentMode) => {
    if (perUnit > 0) {
        const u = Math.floor(total / perUnit);
        let rest = total - u * perUnit;
        let s = 0;
        if (parentMode && perSub > 0) {
            s = Math.floor(rest / perSub);
            rest = rest - s * perSub;
        }
        return [u, s, round2(rest)];
    }
    return [0, 0, total];
};

// "2 Bundle 1 Pcs (7)"
const QtyText = ({ unit, subUnit, parentMode, u, s, p, t }) => (
    <>
        {u} {unit || 'Unit'} {parentMode && <>{s} {subUnit} </>}{p} Pcs
        <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-700">({t})</b>
    </>
);

// Searchable dropdown
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

const StockDamageDailyRepo = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const EMPTY_FILTERS = {
        startDate: '',
        endDate: '',
        invoiceNo: '',
        product: '',
        company: '',
        customer: '',
        route: '',
    };
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const get = async (url) => {
                    const res = await fetch(url);
                    const data = await res.json().catch(() => []);
                    return Array.isArray(data) ? data : [];
                };
                const [sales, dmg, cust] = await Promise.all([
                    get('https://squirrel-peace-server.onrender.com/sales'),
                    get('https://squirrel-peace-server.onrender.com/sales-damage'),
                    get('https://squirrel-peace-server.onrender.com/customer'),
                ]);
                setCustomers(cust);
                const all = [
                    ...sales
                        .filter((s) => s.status === 'Delivered' && (s.damageItems || []).length > 0)
                        .map((s) => ({ ...s, isStandalone: false })),
                    ...dmg
                        .filter((d) => (d.items || []).length > 0)
                        .map((d) => ({ ...d, isStandalone: true, damageItems: d.items || [] })),
                ].sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
                setOrders(all);
            } catch (error) {
                console.error('Error fetching daily damage data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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
        setCurrentPage(1);
    };

    // ---------- Row build (proti damage product alada row) ----------
    const customerRouteMap = new Map(customers.map((c) => [String(c._id), c.route || '']));

    const rows = [];
    orders.forEach((o) => {
        const hasCustomer = o.isStandalone ? !!o.customerId : !!o.customer;
        const customerName = hasCustomer ? o.customer : IN_HOUSE;
        const route = hasCustomer
            ? (o.route || customerRouteMap.get(String(o.customerId)) || '')
            : '';
        const date = o.isStandalone ? o.damageDate : (o.deliveryDate || o.orderDate);

        (o.damageItems || []).forEach((it, idx) => {
            const mainTotal = n(it.totalQty);
            const freeTotal = n(it.freeQty);
            const unitQty = n(it.unitQty);
            const subQty = n(it.subQty);
            const pcsQty = n(it.pcsQty);
            const perSub = n(it.pcsPerSub);
            const parentMode = it.parentMode === true;
            const perUnit = n(it.pcsPerUnit) > 0
                ? n(it.pcsPerUnit)
                : (unitQty > 0 ? (mainTotal - pcsQty - subQty * perSub) / unitQty : 0);

            const all = mainTotal + freeTotal;
            const [tu, ts, tp] = splitQty(all, perUnit, perSub, parentMode);

            rows.push({
                rowId: `${o._id}-${idx}`,
                order: o,
                date,
                customer: customerName,
                hasCustomer,
                route,
                productName: it.productName,
                company: it.company,
                unit: it.unit,
                subUnit: it.subUnit,
                parentMode,
                main: [unitQty, subQty, pcsQty, mainTotal],
                free: [n(it.freeUnitQty), n(it.freeSubQty), n(it.freePcsQty), freeTotal],
                total: [tu, ts, tp, all],
                totalQty: all,
                sellPrice: n(it.sellPricePcs),
                amount: round2(n(it.itemTotal ?? it.subtotal)),
            });
        });
    });

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const productOptions = uniq(rows.map((r) => r.productName));
    const companyOptions = uniq(rows.map((r) => r.company));
    const customerOptions = uniq(rows.map((r) => r.customer));
    const routeOptions = uniq(rows.map((r) => r.route));

    const has = (val, q) => String(val || '').toLowerCase().includes(String(q).toLowerCase());

    // Filtering
    const filteredRows = rows.filter((r) => {
        const o = r.order;
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(r.date);
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
        if (filters.product && !has(r.productName, filters.product)) return false;
        if (filters.company && !has(r.company, filters.company)) return false;
        if (filters.customer && !has(r.customer, filters.customer)) return false;
        if (filters.route && !has(r.route, filters.route)) return false;
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

    // Summary
    const selectedRows = filteredRows.filter((r) => selectedIds.includes(r.rowId));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredRows;

    const summaryMain = summaryRows.reduce((s, r) => s + r.main[3], 0);
    const summaryFree = summaryRows.reduce((s, r) => s + r.free[3], 0);
    const summaryQty = summaryRows.reduce((s, r) => s + r.totalQty, 0);
    const summaryTotal = summaryRows.reduce((s, r) => s + r.amount, 0);

    const handleInvoiceClick = (o) => {
        if (o.isStandalone) navigate(`/damage-details/${o._id}`);
        else navigate(`/sales-details/${o._id}`, { state: { scrollTo: 'damage-section' } });
    };

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Daily Damage Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">তারিখ অনুযায়ী প্রতিটি Damage Product এর হিসাব</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Damage Report</h3>
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

                            <FilterSelect
                                label="Product"
                                placeholder="Search or select product..."
                                value={filters.product}
                                options={productOptions}
                                onChange={(v) => setFilter('product', v)}
                                emptyText="No product found"
                            />

                            <FilterSelect
                                label="Company"
                                placeholder="Search or select company..."
                                value={filters.company}
                                options={companyOptions}
                                onChange={(v) => setFilter('company', v)}
                                emptyText="No company found"
                            />

                            <FilterSelect
                                label="Customer"
                                placeholder="Search or select customer..."
                                value={filters.customer}
                                options={customerOptions}
                                onChange={(v) => setFilter('customer', v)}
                                emptyText="No customer found"
                            />

                            <FilterSelect
                                label="Route"
                                placeholder="Search or select route..."
                                value={filters.route}
                                options={routeOptions}
                                onChange={(v) => setFilter('route', v)}
                                emptyText="No route found"
                            />
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
                            Main Qty: <b className="text-orange-600">{fmt(summaryMain)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Free Qty: <b className="text-emerald-600">{fmt(summaryFree)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Qty: <b className="text-indigo-600">{fmt(summaryQty)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Amount: <b className="text-red-600">৳{fmt(summaryTotal)}</b>
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
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No damage products found!</div>
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
                                        <th>Product</th>
                                        <th>Company</th>
                                        <th>Route</th>
                                        <th>Customer</th>
                                        <th>Sell Price (PCS)</th>
                                        <th>Qty</th>
                                        <th>Total Qty</th>
                                        <th>Sell Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => {
                                        const o = r.order;
                                        const qtyProps = { unit: r.unit, subUnit: r.subUnit, parentMode: r.parentMode };
                                        return (
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

                                                {/* Date */}
                                                <td className="text-gray-600 font-medium">{r.date || 'N/A'}</td>

                                                {/* Product + Invoice */}
                                                <td className="font-bold text-gray-800">
                                                    <div>{r.productName}</div>
                                                    <button
                                                        onClick={() => handleInvoiceClick(o)}
                                                        className="text-[11px] text-indigo-600 hover:text-pink-600 hover:underline font-semibold cursor-pointer transition-colors"
                                                    >
                                                        {o.invoiceNo || o.orderNo}
                                                    </button>
                                                </td>

                                                {/* Company */}
                                                <td className="text-gray-600">{r.company || 'N/A'}</td>

                                                {/* Route */}
                                                <td className="text-gray-600">{r.route || ''}</td>

                                                {/* Customer */}
                                                <td className="font-medium">
                                                    {r.hasCustomer ? (
                                                        <span className="text-gray-700">{r.customer}</span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                                                            {IN_HOUSE}
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Sell Price (PCS) */}
                                                <td className="font-medium text-slate-600">৳{r.sellPrice.toFixed(2)}</td>

                                                {/* Qty (Main + Free) */}
                                                <td>
                                                    <div className="space-y-0.5">
                                                        <div className="font-semibold text-orange-600">
                                                            <span className="font-bold mr-1">Main:</span>
                                                            <QtyText {...qtyProps} u={r.main[0]} s={r.main[1]} p={r.main[2]} t={r.main[3]} />
                                                        </div>
                                                        <div className="font-semibold text-emerald-600">
                                                            <span className="font-bold mr-1">Free:</span>
                                                            <QtyText {...qtyProps} u={r.free[0]} s={r.free[1]} p={r.free[2]} t={r.free[3]} />
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Total Qty */}
                                                <td className="font-semibold text-indigo-600">
                                                    <QtyText {...qtyProps} u={r.total[0]} s={r.total[1]} p={r.total[2]} t={r.total[3]} />
                                                </td>

                                                {/* Sell Total */}
                                                <td className="font-bold text-red-600">৳{r.amount.toFixed(2)}</td>
                                            </tr>
                                        );
                                    })}
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

export default StockDamageDailyRepo;