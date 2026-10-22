import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;
const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

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

// "Main: 2 Bundle 3 Pcs (11)" format
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

const PurTopChartRepo = () => {
    const location = useLocation();

    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [products, setProducts] = useState([]);
    const [isCostView, setIsCostView] = useState(false);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        product: '',
        company: '',
        status: '',
    });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Product searchable-select state
    const [isProductOpen, setIsProductOpen] = useState(false);
    const productDropdownRef = useRef(null);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, cRes, prRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
                    fetch('https://squirrel-peace-server.onrender.com/product'),
                ]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                const prData = await prRes.json();
                setPurchases(Array.isArray(pData) ? pData : []);
                setCompanies(Array.isArray(cData) ? cData : []);
                setProducts(Array.isArray(prData) ? prData : []);
            } catch (error) {
                console.error('Error fetching report data:', error);
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

    useEffect(() => {
        const handleClickOutsideProduct = (event) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setIsProductOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideProduct);
        return () => document.removeEventListener('mousedown', handleClickOutsideProduct);
    }, []);

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const parseToLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const datePart = dateStr.split(',')[0].trim();
        if (datePart.includes('/')) {
            const [d, m, y] = datePart.split('/');
            if (!d || !m || !y) return null;
            return new Date(Number(y), Number(m) - 1, Number(d));
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
            const [y, m, d] = datePart.split('-');
            return new Date(Number(y), Number(m) - 1, Number(d));
        }
        const parsed = new Date(datePart);
        return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', product: '', company: '', status: '' });
        setCurrentPage(1);
    };

    const filteredCompanies = companies.filter((comp) =>
        comp.businessName?.toLowerCase().includes(filters.company.toLowerCase())
    );

    const handleSelectCompany = (comp) => {
        setFilters({ ...filters, company: comp.businessName });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, company: '' });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    const isReceived = (item) => item.receiveStatus === 'Received' || item.receiveStatus === 'Yes';

    // Date + Status filter (purchase date onujayi)
    const dateFilteredPurchases = purchases.filter((p) => {
        if (filters.status === 'Received' && !isReceived(p)) return false;
        if (filters.status === 'New Order' && isReceived(p)) return false;
        if (!filters.startDate && !filters.endDate) return true;
        const d = parseToLocalDate(p.purchaseDate);
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

    // Same product + same company = ek row, sob purchase er total ekshathe
    const map = new Map();
    const getEntry = (company, name, base, total) => {
        const key = `${company}|${name}`;
        if (!map.has(key)) {
            map.set(key, {
                rowId: key,
                productName: name,
                company,
                unit: base?.unit,
                subUnit: base?.subUnit,
                parentMode: base?.parentMode === true,
                perUnit: getPerUnit(base, total),
                perSub: n(base?.pcsPerSub),
                buyPrice: 0,
                productId: base?.productId,
                byCost: new Map(),
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

    dateFilteredPurchases.forEach((p) => {
        const company = p.company || '';

        // Main products
        (p.items || []).forEach((it) => {
            if (!it.productName) return;
            const totalPcs = n(it.totalPcs);
            const e = getEntry(company, it.productName, it, totalPcs);

            const buy = n(it.buyPrice);
            const gross = buy * totalPcs;
            const amountRaw = it.itemTotal ?? it.subtotal;
            const itemSub = n(amountRaw);
            let disc = n(
                it.discountAmount ??
                (it.discountType === 'percent' ? (gross * n(it.discount)) / 100 : it.discount)
            );
            if (!disc && itemSub > 0 && gross > itemSub) disc = gross - itemSub;
            const amount = amountRaw !== undefined && amountRaw !== null ? itemSub : gross - disc;

            if (!e.buyPrice && buy > 0) e.buyPrice = buy; // cost price sum hobe na
            e.mainQty += totalPcs;
            e.freeQty += n(it.freeTotalQty ?? it.freeQty);
            e.subtotal += gross;
            e.discount += disc;
            e.grandTotal += amount;

            // purchase er cost price onujayi alada alada joma
            const c = e.byCost.get(buy) || { buyPrice: buy, mainQty: 0, freeQty: 0, othersQty: 0, subtotal: 0, discount: 0, grandTotal: 0 };
            c.mainQty += totalPcs;
            c.freeQty += n(it.freeTotalQty ?? it.freeQty);
            c.subtotal += gross;
            c.discount += disc;
            c.grandTotal += amount;
            e.byCost.set(buy, c);
        });

        // Others Free products
        (p.freeItems || []).forEach((it) => {
            if (!it.productName) return;
            const qty = n(it.totalQty);
            const e = getEntry(company, it.productName, it, qty);
            e.othersQty += qty;

            const c = e.byCost.get(0) || { buyPrice: 0, mainQty: 0, freeQty: 0, othersQty: 0, subtotal: 0, discount: 0, grandTotal: 0 };
            c.othersQty += qty;
            e.byCost.set(0, c);
        });
    });

    // product list theke cost price (purchasePrice)
    const productPriceById = new Map(products.map((p) => [String(p._id), n(p.purchasePrice)]));
    const productPriceByName = new Map(products.map((p) => [p.productName, n(p.purchasePrice)]));

    const rows = Array.from(map.values())
        .map((e) => {
            const mk = (total) => [...splitQty(total, e.perUnit, e.perSub, e.parentMode), total];
            const lines = [{ label: 'Main', tuple: mk(e.mainQty) }];
            if (e.freeQty > 0) lines.push({ label: 'Free', tuple: mk(e.freeQty) });
            if (e.othersQty > 0) lines.push({ label: 'Others Free', tuple: mk(e.othersQty) });
            return {
                ...e,
                lines,
                buyPrice: productPriceById.get(String(e.productId)) ?? productPriceByName.get(e.productName) ?? e.buyPrice,
                costRows: Array.from(e.byCost.values())
                    .sort((a, b) => b.buyPrice - a.buyPrice)
                    .map((c) => {
                        const cl = [];
                        if (c.mainQty > 0) cl.push({ label: 'Main', tuple: mk(c.mainQty) });
                        if (c.freeQty > 0) cl.push({ label: 'Free', tuple: mk(c.freeQty) });
                        if (c.othersQty > 0) cl.push({ label: 'Others Free', tuple: mk(c.othersQty) });
                        return {
                            ...c,
                            lines: cl,
                            subtotal: round2(c.subtotal),
                            discount: round2(c.discount),
                            grandTotal: round2(c.grandTotal),
                        };
                    }),
                totalQty: e.mainQty + e.freeQty + e.othersQty,
                subtotal: round2(e.subtotal),
                discount: round2(e.discount),
                grandTotal: round2(e.grandTotal),
            };
        })
        .sort((a, b) => b.grandTotal - a.grandTotal || a.productName.localeCompare(b.productName));

    // Unique product name list (dropdown er jonno)
    const productNames = [...new Set(rows.map((r) => r.productName).filter(Boolean))];
    const filteredProductNames = productNames.filter((name) =>
        name.toLowerCase().includes(filters.product.toLowerCase())
    );

    const handleSelectProduct = (name) => {
        setFilters({ ...filters, product: name });
        setCurrentPage(1);
        setIsProductOpen(false);
    };

    const handleClearProduct = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, product: '' });
        setCurrentPage(1);
        setIsProductOpen(false);
    };

    // Filtering
    const baseFilteredRows = rows.filter((r) => {
        if (filters.product && !r.productName?.toLowerCase().includes(filters.product.toLowerCase())) return false;
        if (filters.company && !r.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        return true;
    });

    // Cost view on thakle proti cost price er jonno alada row
    const filteredRows = isCostView
        ? baseFilteredRows.flatMap((r) =>
            r.costRows.map((c) => ({
                ...r,
                rowId: `${r.rowId}|${c.buyPrice}`,
                lines: c.lines,
                buyPrice: c.buyPrice,
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

    const selectedRows = filteredRows.filter((r) => selectedIds.includes(r.rowId));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredRows;

    const summaryQty = summaryRows.reduce((s, r) => s + r.totalQty, 0);
    const summarySubtotal = summaryRows.reduce((s, r) => s + r.subtotal, 0);
    const summaryDiscount = summaryRows.reduce((s, r) => s + r.discount, 0);
    const summaryGrand = summaryRows.reduce((s, r) => s + r.grandTotal, 0);
    const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Purchase Top Chart
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">প্রতিটি product (company সহ) একবারই দেখাবে — মোট Qty, Subtotal, Discount এবং Grand Total</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Purchase Top Chart</h3>
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

                            {/* Product Searchable Dropdown */}
                            <div className="relative" ref={productDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product</label>
                                <div
                                    onClick={() => setIsProductOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select product..."
                                        value={filters.product}
                                        onChange={(e) => {
                                            handleFilterChange({ target: { name: 'product', value: e.target.value } });
                                            setIsProductOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.product && (
                                        <button type="button" onClick={handleClearProduct} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isProductOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredProductNames.length > 0 ? (
                                            filteredProductNames.map((name) => (
                                                <div
                                                    key={name}
                                                    onClick={() => handleSelectProduct(name)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No product found</div>
                                        )}
                                    </div>
                                )}
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
                                            handleFilterChange({ target: { name: 'company', value: e.target.value } });
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
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {comp.businessName}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Status Select */}
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
                                    <option value="Received">Received</option>
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
                                        <th>Product</th>
                                        <th>Company</th>
                                        <th>Qty</th>
                                        <th
                                            onClick={() => setIsCostView((v) => !v)}
                                            className="cursor-pointer select-none hover:underline"
                                            title="Click to see purchase wise cost prices"
                                        >
                                            Cost Price
                                        </th>
                                        <th>Subtotal</th>
                                        <th>Discount</th>
                                        <th>Grand Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => {
                                        return (
                                            <React.Fragment key={r.rowId}>
                                                <tr
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
                                                    <td className="font-bold text-gray-800">{r.productName}</td>
                                                    <td className="text-gray-600">{r.company}</td>
                                                    <td>
                                                        <QtyCell lines={r.lines} unit={r.unit} subUnit={r.subUnit} parentMode={r.parentMode} />
                                                    </td>
                                                    <td className="font-medium text-slate-600">৳{r.buyPrice.toFixed(2)}</td>
                                                    <td className="font-semibold text-slate-700">৳{r.subtotal.toFixed(2)}</td>
                                                    <td className="font-semibold text-rose-600">৳{r.discount.toFixed(2)}</td>
                                                    <td className="font-bold text-slate-900">৳{r.grandTotal.toFixed(2)}</td>
                                                </tr>
                                            </React.Fragment>
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

export default PurTopChartRepo;