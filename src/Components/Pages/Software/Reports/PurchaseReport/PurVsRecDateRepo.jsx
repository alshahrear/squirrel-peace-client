import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

const mainTuple = (it) => (it ? [n(it.unitQty), n(it.subQty), n(it.pcsQty), n(it.totalPcs)] : [0, 0, 0, 0]);
const freeTuple = (it) =>
    it
        ? [n(it.freeUnitQty), n(it.freeSubQty), n(it.freePcsQty), n(it.freeTotalQty ?? it.freeQty)]
        : [0, 0, 0, 0];
const othersTuple = (it) => (it ? [n(it.unitQty), n(it.subQty), n(it.pcsQty), n(it.totalQty)] : [0, 0, 0, 0]);

const LINE_COLORS = {
    Main: 'text-orange-600',
    Free: 'text-emerald-600',
    'Others Free': 'text-amber-600',
};

// "Main: 2 Bundle 3 Pcs (11)" format, niche niche
const QtyCell = ({ lines, unit, subUnit, parentMode, isRemaining = false, notReceived = false }) => (
    notReceived ? (
        <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[11px]">
            Not Receive
        </span>
    ) : (
        <div className="space-y-0.5">
            {lines.map((l) => {
                const [u, s, p, t] = l.tuple;
                const color = isRemaining ? (t > 0 ? 'text-rose-600' : 'text-slate-400') : LINE_COLORS[l.label];
                return (
                    <div key={l.label} className={`font-semibold ${color}`}>
                        <span className="font-bold mr-1">{l.label}:</span>
                        {u} {unit || 'Unit'} {parentMode && <>{s} {subUnit} </>}{p} Pcs
                        <b className={`ml-1 px-1.5 py-0.5 rounded-md text-[12px] font-extrabold ${isRemaining ? (t > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400') : 'bg-indigo-100 text-indigo-700'}`}>({t})</b>
                    </div>
                );
            })}
        </div>
    )
);

const PurVsRecDateRepo = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [purchases, setPurchases] = useState([]);
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
        product: '',
        company: '',
        status: '',
        remaining: '',
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
                const [pRes, cRes] = await Promise.all([
                    fetch('http://localhost:5000/purchase'),
                    fetch('http://localhost:5000/company'),
                ]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                setPurchases(Array.isArray(pData) ? [...pData].reverse() : []);
                setCompanies(Array.isArray(cData) ? cData : []);
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
        setFilters({ startDate: '', endDate: '', invoiceNo: '', product: '', company: '', status: '', remaining: '' });
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

    // Proti purchase er proti product ke alada row: Ordered vs Received vs Remaining
    const rows = [];
    purchases.forEach((p) => {
        const received = isReceived(p);

        // Order er somoyer data: orderSnapshot thakle seta, na thakle items
        const ordItems = p.orderSnapshot?.items || p.items || [];
        const ordFree = p.orderSnapshot?.freeItems || p.freeItems || [];

        // Receive er data (shudhu Received hole)
        const recItems = received ? p.items || [] : [];
        const recFree = received ? p.freeItems || [] : [];

        // Main products
        const mainNames = [...new Set([...ordItems, ...recItems].map((i) => i.productName).filter(Boolean))];
        mainNames.forEach((name, idx) => {
            const o = ordItems.find((i) => i.productName === name);
            const r = recItems.find((i) => i.productName === name);
            const base = o || r;

            const oMain = mainTuple(o);
            const oFree = freeTuple(o);
            const rMain = mainTuple(r);
            const rFree = freeTuple(r);

            const parentMode = base.parentMode === true;
            const perSub = n(base.pcsPerSub);
            const perUnit = getPerUnit(base, n(base.totalPcs));

            const remMainTotal = Math.max(oMain[3] - rMain[3], 0);
            const remFreeTotal = Math.max(oFree[3] - rFree[3], 0);
            const remMain = [...splitQty(remMainTotal, perUnit, perSub, parentMode), remMainTotal];
            const remFree = [...splitQty(remFreeTotal, perUnit, perSub, parentMode), remFreeTotal];

            rows.push({
                rowId: `${p._id}-m-${idx}`,
                purchase: p,
                kind: 'main',
                productName: name,
                unit: base.unit,
                subUnit: base.subUnit,
                parentMode,
                ordered: [
                    { label: 'Main', tuple: oMain },
                    { label: 'Free', tuple: oFree },
                ],
                receivedLines: [
                    { label: 'Main', tuple: rMain },
                    { label: 'Free', tuple: rFree },
                ],
                remaining: [
                    { label: 'Main', tuple: remMain },
                    { label: 'Free', tuple: remFree },
                ],
                ordTotal: oMain[3] + oFree[3],
                recTotal: rMain[3] + rFree[3],
                remTotal: remMainTotal + remFreeTotal,
            });
        });

        // Others Free products
        const freeNames = [...new Set([...ordFree, ...recFree].map((i) => i.productName).filter(Boolean))];
        freeNames.forEach((name, idx) => {
            const o = ordFree.find((i) => i.productName === name);
            const r = recFree.find((i) => i.productName === name);
            const base = o || r;

            const oT = othersTuple(o);
            const rT = othersTuple(r);

            const parentMode = base.parentMode === true;
            const perSub = n(base.pcsPerSub);
            const perUnit = getPerUnit(base, n(base.totalQty));

            const remTotal = Math.max(oT[3] - rT[3], 0);
            const remT = [...splitQty(remTotal, perUnit, perSub, parentMode), remTotal];

            rows.push({
                rowId: `${p._id}-f-${idx}`,
                purchase: p,
                kind: 'others',
                productName: name,
                unit: base.unit,
                subUnit: base.subUnit,
                parentMode,
                ordered: [{ label: 'Others Free', tuple: oT }],
                receivedLines: [{ label: 'Others Free', tuple: rT }],
                remaining: [{ label: 'Others Free', tuple: remT }],
                ordTotal: oT[3],
                recTotal: rT[3],
                remTotal,
            });
        });
    });

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
    const filteredRows = rows.filter((r) => {
        const item = r.purchase;
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(item.purchaseDate);
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
        if (filters.invoiceNo && !item.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.product && !r.productName?.toLowerCase().includes(filters.product.toLowerCase())) return false;
        if (filters.company && !item.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.status === 'Received' && !isReceived(item)) return false;
        if (filters.status === 'New Order' && isReceived(item)) return false;
        if (filters.status === 'Remaining' && !(isReceived(item) && r.remTotal > 0)) return false;
        if (filters.remaining === 'has' && !(isReceived(item) && r.remTotal > 0)) return false;
        if (filters.remaining === 'no' && !(isReceived(item) && r.remTotal <= 0)) return false;
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

    const summaryOrdered = summaryRows.reduce((s, r) => s + r.ordTotal, 0);
    const summaryReceived = summaryRows.reduce((s, r) => s + r.recTotal, 0);
    const summaryRemaining = summaryRows.reduce((s, r) => s + r.remTotal, 0);
    const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });

    const handleInvoiceClick = (id) => {
        navigate(`/purchase-details/${id}`, { state: { fromReport: true } });
    };

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Purchase & Receive Date Wise
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">কত Order দিয়েছি, কত Receive করেছি এবং কত Remaining আছে — প্রতিটি product অনুযায়ী</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Purchase & Receive Report</h3>
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

                        <div className="grid grid-cols-7 gap-2">
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
                                    <option value="Remaining">Received (Remaining আছে)</option>
                                </select>
                            </div>

                            {/* Remaining Select */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Remaining</label>
                                <select
                                    name="remaining"
                                    value={filters.remaining}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="has">Has</option>
                                    <option value="no">No</option>
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
                            Total Ordered: <b className="text-orange-600">{fmt(summaryOrdered)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Received: <b className="text-emerald-600">{fmt(summaryReceived)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Remaining: <b className="text-rose-600">{fmt(summaryRemaining)}</b>
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
                                        <th>Invoice</th>
                                        <th>Product</th>
                                        <th>Company</th>
                                        <th>Status</th>
                                        <th>Ordered</th>
                                        <th>Received</th>
                                        <th>Remaining</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => {
                                        const item = r.purchase;
                                        const cellProps = { unit: r.unit, subUnit: r.subUnit, parentMode: r.parentMode };
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
                                                <td className="text-gray-600">
                                                    <div className="font-medium">Order: {item.purchaseDate || 'N/A'}</div>
                                                    <div className="text-[11px]">
                                                        {item.receiveDate ? `Received: ${item.receiveDate}` : <span className="text-gray-400">Received: N/A</span>}
                                                    </div>
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => handleInvoiceClick(item._id)}
                                                        className="text-indigo-700 hover:text-pink-600 hover:underline font-bold cursor-pointer transition-colors"
                                                    >
                                                        {item.invoiceNo}
                                                    </button>
                                                </td>
                                                <td className="font-bold text-gray-800">
                                                    <div>{r.productName}</div>
                                                    {r.kind === 'others' && (
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold">Others Free</span>
                                                    )}
                                                </td>
                                                <td className="text-gray-600">{item.company}</td>
                                                <td>
                                                    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] ${isReceived(item) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                        {isReceived(item) ? 'Received' : 'New Order'}
                                                    </span>
                                                </td>
                                                <td><QtyCell lines={r.ordered} {...cellProps} /></td>
                                                <td><QtyCell lines={r.receivedLines} notReceived={!isReceived(item)} {...cellProps} /></td>
                                                <td><QtyCell lines={r.remaining} isRemaining notReceived={!isReceived(item)} {...cellProps} /></td>
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

export default PurVsRecDateRepo;