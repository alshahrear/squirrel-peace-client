import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;
const round2 = (v) => Math.round(n(v) * 100) / 100;
const fmt = (v) => n(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

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

const getPerUnit = (it, total) => {
    if (!it) return 0;
    if (n(it.pcsPerUnit) > 0) return n(it.pcsPerUnit);
    const unitQty = n(it.unitQty);
    return unitQty > 0 ? (total - n(it.pcsQty) - n(it.subQty) * n(it.pcsPerSub)) / unitQty : 0;
};

const LINE_COLORS = {
    Main: 'text-orange-600',
    Free: 'text-emerald-600',
    'Others Free': 'text-amber-600',
};

// "Main: 2 Bundle 3 Pcs (11)"
const QtyCell = ({ lines, unit, subUnit, parentMode }) => (
    <div className="space-y-0.5">
        {lines.map((l) => {
            const [u, s, p, t] = l.tuple;
            return (
                <div key={l.label} className={`font-semibold ${LINE_COLORS[l.label]}`}>
                    <span className="font-bold mr-1">{l.label}:</span>
                    {u} {unit || 'Unit'} {parentMode && <>{s} {subUnit} </>}{p} Pcs
                    <b className="ml-1 px-1.5 py-0.5 rounded-md text-[12px] font-extrabold bg-indigo-100 text-indigo-700">({t})</b>
                </div>
            );
        })}
    </div>
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

const SaleDateWiseTopChart = () => {
    const location = useLocation();

    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [users, setUsers] = useState([]);
    const [isPriceView, setIsPriceView] = useState(false);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const EMPTY_FILTERS = {
        startDate: '',
        endDate: '',
        product: '',
        company: '',
        deliveredBy: '',
        sr: '',
        route: '',
        status: 'Mix',
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
                const [sRes, pRes, uRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/sales'),
                    fetch('https://squirrel-peace-server.onrender.com/product'),
                    fetch('https://squirrel-peace-server.onrender.com/user'),
                ]);
                const sData = await sRes.json();
                const pData = await pRes.json();
                const uData = await uRes.json().catch(() => []);
                setUsers(Array.isArray(uData) ? uData : []);
                setOrders(Array.isArray(sData) ? sData : []);
                setProducts(Array.isArray(pData) ? pData : []);
            } catch (error) {
                console.error('Error fetching date wise top chart data:', error);
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

    const isDelivered = (o) => o.status === 'Delivered';
    const getDeliveredBy = (o) => o.deliveredBy || o.deliveryBy || o.deliveryMan || o.deliveryPerson || '';

    // Status + Date filter
    // New Order => order date, Delivered => delivery date, All => order date
    const filteredOrders = orders.filter((o) => {
        if (directOnly && !o.directSales) return false;
        if (filters.sr && !String(o.sr || '').toLowerCase().includes(filters.sr.toLowerCase())) return false;
        if (filters.route && !String(o.route || '').toLowerCase().includes(filters.route.toLowerCase())) return false;
        if (filters.deliveredBy && (!isDelivered(o) || !String(getDeliveredBy(o)).toLowerCase().includes(filters.deliveredBy.toLowerCase()))) return false;
        if (filters.status === 'Delivered' && !isDelivered(o)) return false;
        if (filters.status === 'New Order' && isDelivered(o)) return false;
        if (!filters.startDate && !filters.endDate) return true;
        const dateField = filters.status === 'Delivered' ? o.deliveryDate : o.orderDate;
        const d = parseToLocalDate(dateField);
        if (!d) return false;
        if (filters.startDate) {
            const s = parseToLocalDate(filters.startDate);
            if (s && d < s) return false;
        }
        if (filters.endDate) {
            const e = parseToLocalDate(filters.endDate);
            if (e && d > e) return false;
        }
        return true;
    });

    // Same date + same product + same company + same delivered by = ek row
    const map = new Map();
    const getEntry = (o, company, name, base, total) => {
        const orderDate = o.orderDate || '';
        const isMix = filters.status === 'Mix';
        const deliveryDate = !isMix && isDelivered(o) ? (o.deliveryDate || '') : '';
        const deliveredBy = !isMix && isDelivered(o) ? getDeliveredBy(o) : '';
        const key = isMix
            ? `${orderDate}|${company}|${name}`
            : `${orderDate}|${deliveryDate}|${company}|${name}`;
        if (!map.has(key)) {
            map.set(key, {
                rowId: key,
                orderDate,
                deliveryDate,
                deliveredBy,
                isMix,
                productName: name,
                company,
                unit: base?.unit,
                subUnit: base?.subUnit,
                parentMode: base?.parentMode === true,
                perUnit: getPerUnit(base, total),
                perSub: n(base?.pcsPerSub),
                productId: base?.productId,
                sellPrice: 0,
                byPrice: new Map(),
                mainQty: 0,
                freeQty: 0,
                othersQty: 0,
                subtotal: 0,
                discount: 0,
                grandTotal: 0,
            });
        }
        const e = map.get(key);
        if (!e.perUnit) e.perUnit = getPerUnit(base, total);
        return e;
    };

    filteredOrders.forEach((o) => {
        // Main products
        (o.items || []).forEach((it) => {
            if (!it.productName) return;
            const totalPcs = n(it.totalPcs ?? it.totalQty);
            const freeTotal = n(it.freeQty);
            const e = getEntry(o, it.company || '', it.productName, it, totalPcs);

            const gross =
                n(it.unitQty) * n(it.sellPriceUnit) +
                n(it.subQty) * n(it.sellPriceSub) +
                n(it.pcsQty) * n(it.sellPricePcs);
            const itemTotal = n(it.itemTotal ?? it.subtotal);
            let disc = n(
                it.discountAmount ??
                (it.discountType === 'percent' ? (gross * n(it.discount)) / 100 : it.discount)
            );
            if (!disc && itemTotal > 0 && gross > itemTotal) disc = gross - itemTotal;
            const price = n(it.sellPricePcs);

            e.mainQty += totalPcs;
            e.freeQty += freeTotal;
            e.subtotal += gross;
            e.discount += disc;
            e.grandTotal += itemTotal;
            if (!e.sellPrice && price > 0) e.sellPrice = price;

            // sell price onujayi alada alada joma
            const c = e.byPrice.get(price) || { sellPrice: price, mainQty: 0, freeQty: 0, othersQty: 0, subtotal: 0, discount: 0, grandTotal: 0 };
            c.mainQty += totalPcs;
            c.freeQty += freeTotal;
            c.subtotal += gross;
            c.discount += disc;
            c.grandTotal += itemTotal;
            e.byPrice.set(price, c);
        });

        // Others Free products
        (o.freeItems || []).forEach((it) => {
            if (!it.productName) return;
            const qty = n(it.totalQty);
            const e = getEntry(o, it.company || '', it.productName, it, qty);
            e.othersQty += qty;

            const c = e.byPrice.get(0) || { sellPrice: 0, mainQty: 0, freeQty: 0, othersQty: 0, subtotal: 0, discount: 0, grandTotal: 0 };
            c.othersQty += qty;
            e.byPrice.set(0, c);
        });
    });

    // product list theke sell price (sellingPrice)
    const productPriceById = new Map(products.map((p) => [String(p._id), n(p.sellingPrice)]));
    const productPriceByName = new Map(products.map((p) => [p.productName, n(p.sellingPrice)]));

    const rows = Array.from(map.values())
        .map((e) => {
            const mk = (total) => [...splitQty(total, e.perUnit, e.perSub, e.parentMode), total];
            const buildLines = (m, f, ot) => {
                const l = [];
                if (m > 0 || (f <= 0 && ot <= 0)) l.push({ label: 'Main', tuple: mk(m) });
                if (f > 0) l.push({ label: 'Free', tuple: mk(f) });
                if (ot > 0) l.push({ label: 'Others Free', tuple: mk(ot) });
                return l;
            };
            return {
                ...e,
                lines: buildLines(e.mainQty, e.freeQty, e.othersQty),
                sellPrice: productPriceById.get(String(e.productId)) ?? productPriceByName.get(e.productName) ?? e.sellPrice,
                priceRows: Array.from(e.byPrice.values())
                    .sort((a, b) => b.sellPrice - a.sellPrice)
                    .map((c) => ({
                        ...c,
                        lines: buildLines(c.mainQty, c.freeQty, c.othersQty),
                        subtotal: round2(c.subtotal),
                        discount: round2(c.discount),
                        grandTotal: round2(c.grandTotal),
                    })),
                totalQty: e.mainQty + e.freeQty + e.othersQty,
                subtotal: round2(e.subtotal),
                discount: round2(e.discount),
                grandTotal: round2(e.grandTotal),
            };
        })
        .sort((a, b) => {
            const da = parseToLocalDate(a.orderDate)?.getTime() || 0;
            const db = parseToLocalDate(b.orderDate)?.getTime() || 0;
            return db - da || b.grandTotal - a.grandTotal || a.productName.localeCompare(b.productName);
        });

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const productOptions = uniq(rows.map((r) => r.productName));
    const companyOptions = uniq(rows.map((r) => r.company));
    const deliveredByOptions = uniq(orders.filter(isDelivered).map(getDeliveredBy));
    const srOptions = uniq(users.filter((u) => u.role === 'SR').map((u) => u.name));
    const routeOptions = uniq(orders.map((o) => o.route));

    const has = (val, q) => String(val || '').toLowerCase().includes(String(q).toLowerCase());

    // Filtering
    const baseFilteredRows = rows.filter((r) => {
        if (filters.product && !has(r.productName, filters.product)) return false;
        if (filters.company && !has(r.company, filters.company)) return false;
        return true;
    });

    // Sell price view on thakle proti sell price er jonno alada row
    const filteredRows = isPriceView
        ? baseFilteredRows.flatMap((r) =>
            r.priceRows.map((c) => ({
                ...r,
                rowId: `${r.rowId}|${c.sellPrice}`,
                lines: c.lines,
                sellPrice: c.sellPrice,
                subtotal: c.subtotal,
                discount: c.discount,
                grandTotal: c.grandTotal,
                totalQty: c.mainQty + c.freeQty + c.othersQty,
            }))
        )
        : baseFilteredRows;

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

    const summaryQty = summaryRows.reduce((s, r) => s + r.totalQty, 0);
    const summarySubtotal = summaryRows.reduce((s, r) => s + r.subtotal, 0);
    const summaryDiscount = summaryRows.reduce((s, r) => s + r.discount, 0);
    const summaryGrand = summaryRows.reduce((s, r) => s + r.grandTotal, 0);

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Date Wise Top Chart
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">একই তারিখে একই product (company সহ) একসাথে দেখাবে — মোট Qty, Subtotal, Discount এবং Grand Total</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Date Wise Top Chart</h3>
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
                                label="Delivered By"
                                placeholder="Search or select..."
                                value={filters.deliveredBy}
                                options={deliveredByOptions}
                                onChange={(v) => setFilter('deliveredBy', v)}
                                emptyText="No one found"
                            />

                            <FilterSelect
                                label="SR"
                                placeholder="Search or select SR..."
                                value={filters.sr}
                                options={srOptions}
                                onChange={(v) => setFilter('sr', v)}
                                emptyText="No SR found"
                            />

                            <FilterSelect
                                label="Route"
                                placeholder="Search or select route..."
                                value={filters.route}
                                options={routeOptions}
                                onChange={(v) => setFilter('route', v)}
                                emptyText="No route found"
                            />

                            {/* Status Select + Direct Sales */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-gray-600 text-[11px] font-semibold">Status</label>
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
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="Mix">Mix</option>
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
                            Total Qty: <b className="text-orange-600">{fmt(summaryQty)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Subtotal: <b className="text-slate-700">৳{fmt(summarySubtotal)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Discount: <b className="text-rose-600">৳{fmt(summaryDiscount)}</b>
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
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No products found!</div>
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
                                        <th>Total Qty</th>
                                        <th
                                            onClick={() => setIsPriceView((v) => !v)}
                                            className="cursor-pointer select-none hover:underline"
                                            title="Click to see sell wise sell prices"
                                        >
                                            Sell Price
                                        </th>
                                        <th>Subtotal</th>
                                        <th>Discount</th>
                                        <th>Grand Total</th>
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
                                                <div className="font-medium">Order: {r.orderDate || 'N/A'}</div>
                                                {!r.isMix && (
                                                    <div className="text-[11px]">
                                                        {r.deliveryDate ? `Delivered: ${r.deliveryDate}` : <span className="text-gray-400">Delivered: N/A</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="font-bold text-gray-800">{r.productName}</td>
                                            <td className="text-gray-600">{r.company || 'N/A'}</td>
                                            <td>
                                                <QtyCell lines={r.lines} unit={r.unit} subUnit={r.subUnit} parentMode={r.parentMode} />
                                            </td>
                                            <td className="font-medium text-slate-600">৳{n(r.sellPrice).toFixed(2)}</td>
                                            <td className="font-semibold text-slate-700">৳{r.subtotal.toFixed(2)}</td>
                                            <td className="font-semibold text-rose-600">৳{r.discount.toFixed(2)}</td>
                                            <td className="font-bold text-slate-900">৳{r.grandTotal.toFixed(2)}</td>
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

export default SaleDateWiseTopChart;