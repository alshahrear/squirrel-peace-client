import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;

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

const LINE_COLORS = {
    Main: 'text-orange-600',
    Free: 'text-emerald-600',
    'Others Free': 'text-amber-600',
};

// "Main: 2 Bundle 1 Pcs (11)" format
const QtyCell = ({ lines }) => {
    if (!lines || lines.length === 0) return <span className="text-gray-300">N/A</span>;
    return (
        <div className="space-y-0.5">
            {lines.map((l, i) => (
                <div key={i} className={`font-semibold ${LINE_COLORS[l.label]}`}>
                    <span className="font-bold mr-1">{l.label}:</span>
                    {l.u} {l.unit || 'Unit'} {l.parentMode && <>{l.s} {l.subUnit} </>}{l.p} Pcs
                    <b className="ml-1 px-1.5 py-0.5 rounded-md text-[12px] font-extrabold bg-indigo-100 text-indigo-700">({l.t})</b>
                    {l.product && <span className="ml-1 text-[10px] text-gray-400 font-medium">- {l.product}</span>}
                </div>
            ))}
        </div>
    );
};

const TYPE_BADGE = {
    purchase: 'bg-violet-100 text-violet-700',
    bulk: 'bg-fuchsia-100 text-fuchsia-700',
    damage: 'bg-red-100 text-red-700',
};

const PurCompanyReturnRepo = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const [purchases, setPurchases] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
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
        type: '',
    });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, bRes, cRes, dRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
                    fetch('https://squirrel-peace-server.onrender.com/damage-return'),
                ]);
                const pData = await pRes.json();
                const bData = await bRes.json();
                const cData = await cRes.json();
                const dData = await dRes.json().catch(() => []);
                setPurchases(Array.isArray(pData) ? pData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setCompanies(Array.isArray(cData) ? cData : []);
                setDamageReturns(Array.isArray(dData) ? dData : []);
            } catch (error) {
                console.error('Error fetching return report data:', error);
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
        setFilters({ startDate: '', endDate: '', invoiceNo: '', company: '', type: '' });
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

    // ---------- Row build ----------
    const buildLine = (label, it, src, uK, sK, pK, tK) => {
        const u = n(it[uK]);
        const s = n(it[sK]);
        const p = n(it[pK]);
        const t = n(it[tK]);
        if (u <= 0 && s <= 0 && p <= 0 && t <= 0) return null;
        return {
            label,
            product: it.productName,
            unit: src?.unit || it.unit,
            subUnit: src?.subUnit || it.subUnit,
            parentMode: (src?.parentMode ?? it.parentMode) === true,
            u,
            s,
            p,
            t,
        };
    };

    const buildDamageLines = (items) => {
        const lines = [];
        (items || []).forEach((it) => {
            const main = buildLine('Main', it, null, 'unitQty', 'subQty', 'pcsQty', 'totalQty');
            if (main) lines.push(main);
            const free = buildLine('Free', it, null, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeQty');
            if (free) lines.push(free);
        });
        return lines;
    };

    const rows = [];

    // Purchase Return (returnHistory theke)
    purchases.forEach((order) => {
        (order.returnHistory || []).forEach((ret) => {
            const lines = [];
            (ret.items || []).forEach((it) => {
                const src = (order.items || []).find((oi) => oi.productId === it.productId);
                const main = buildLine('Main', it, src, 'returnUnitQty', 'returnSubQty', 'returnPcsQty', 'returnTotalQty');
                if (main) lines.push(main);
                const free = buildLine('Free', it, src, 'returnFreeUnitQty', 'returnFreeSubQty', 'returnFreePcsQty', 'returnFreeTotalQty');
                if (free) lines.push(free);
            });
            (ret.freeItems || []).forEach((it) => {
                const src = (order.freeItems || []).find((oi) => oi.productId === it.productId);
                const oth = buildLine('Others Free', it, src, 'returnUnitQty', 'returnSubQty', 'returnPcsQty', 'returnTotalQty');
                if (oth) lines.push(oth);
            });

            const stamp = ret.createdAt || (String(ret.returnId || '').match(/\d{13}/) || [])[0];
            const time = getTime(ret.createdAt) || (stamp ? Number(stamp) : 0) || getTime(ret.returnDate);

            rows.push({
                rowId: `pr|${order._id}|${ret.returnId}`,
                kind: 'purchase',
                orderId: order._id,
                returnId: ret.returnId,
                date: ret.returnDate || '',
                time,
                editedAt: ret.editedAt || '',
                invoiceNo: order.invoiceNo,
                company: order.company || '',
                typeLabel: 'Purchase Return',
                lines,
                amount: n(ret.totalReturnAmount),
            });
        });
    });

    // Bulk Return
    bulkReturns.forEach((r) => {
        const lines = [];
        (r.items || []).forEach((it) => {
            const main = buildLine('Main', it, null, 'unitQty', 'subQty', 'pcsQty', 'totalPcs');
            if (main) lines.push(main);
            const free = buildLine('Free', it, null, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeTotalQty');
            if (free) lines.push(free);
        });

        rows.push({
            rowId: `bk|${r._id}`,
            kind: 'bulk',
            bulkId: r._id,
            fromPurchase: r.fromPurchase === true,
            purchaseId: r.purchaseId,
            date: r.returnDate || '',
            time: getTime(r.createdAt) || getTime(r.returnDate),
            editedAt: r.editedAt || '',
            invoiceNo: r.invoiceNo,
            company: r.company || '',
            typeLabel: 'Bulk Return',
            lines,
            amount: n(r.returnAmount),
        });
    });

    // Damage Return (DamageReturnAdd theke - standalone)
    damageReturns.forEach((d) => {
        const lines = buildDamageLines(d.items);
        const amount =
            n(d.damageAmount) || (d.items || []).reduce((s, it) => s + n(it.itemTotal ?? it.subtotal), 0);
        rows.push({
            rowId: `dm|${d._id}`,
            kind: 'damage',
            damageId: d._id,
            fromPurchase: false,
            date: d.returnDate || '',
            time: getTime(d.createdAt) || getTime(d.returnDate),
            editedAt: d.editedAt || '',
            invoiceNo: d.invoiceNo,
            company: d.company || '',
            typeLabel: 'Damage Return',
            lines,
            amount,
        });
    });

    // Damage Return (PurchaseAdd theke - Received purchase er damageItems)
    purchases.forEach((p) => {
        const received = p.receiveStatus === 'Received' || p.receiveStatus === 'Yes';
        if (!received || (p.damageItems || []).length === 0) return;
        const lines = buildDamageLines(p.damageItems);
        const amount = (p.damageItems || []).reduce((s, it) => s + n(it.itemTotal ?? it.subtotal), 0);
        const date = p.receiveDate || p.purchaseDate || '';
        rows.push({
            rowId: `dp|${p._id}`,
            kind: 'damage',
            fromPurchase: true,
            purchaseId: p._id,
            date,
            time: getTime(p.damageAt) || getTime(p.createdAt) || getTime(date),
            editedAt: '',
            invoiceNo: p.invoiceNo,
            company: p.company || '',
            typeLabel: 'Damage Return',
            lines,
            amount,
        });
    });

    rows.sort((a, b) => b.time - a.time);

    // Filtering
    const filteredRows = rows.filter((r) => {
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
        if (filters.invoiceNo && !String(r.invoiceNo || '').toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.company && !r.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.type && r.typeLabel !== filters.type) return false;
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

    const summaryAmount = summaryRows.reduce((s, r) => s + r.amount, 0);
    const summaryPurchaseRet = summaryRows.filter((r) => r.kind === 'purchase').length;
    const summaryBulkRet = summaryRows.filter((r) => r.kind === 'bulk').length;
    const summaryDamageRet = summaryRows.filter((r) => r.kind === 'damage').length;
    const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });

    const handleInvoiceClick = (r) => {
        if (r.kind === 'purchase') {
            navigate(`/purchase-return-view/${r.orderId}?returnId=${r.returnId}`);
        } else if (r.kind === 'damage') {
            if (r.fromPurchase) {
                navigate(`/purchase-details/${r.purchaseId}`, { state: { scrollTo: 'damage-products-section', fromReport: true } });
            } else {
                navigate(`/damage-return-details/${r.damageId}`);
            }
        } else if (r.fromPurchase) {
            navigate(`/purchase-details/${r.purchaseId}`, { state: { scrollToReturn: true, fromReport: true } });
        } else {
            navigate(`/purchase-bulk-return-view/${r.bulkId}`);
        }
    };

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Purchase Return Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Purchase Return, Bulk Return ও Damage Return এর হিসাব — নতুন return সবার উপরে</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Return Report</h3>
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

                            {/* Return Type */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Return Type</label>
                                <select
                                    name="type"
                                    value={filters.type}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Purchase Return">Purchase Return</option>
                                    <option value="Bulk Return">Bulk Return</option>
                                    <option value="Damage Return">Damage Return</option>
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
                            Purchase Return: <b className="text-violet-600">{summaryPurchaseRet}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Bulk Return: <b className="text-fuchsia-600">{summaryBulkRet}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Damage Return: <b className="text-red-600">{summaryDamageRet}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Return Amount: <b className="text-rose-600">৳{fmt(summaryAmount)}</b>
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
                        <div className="text-center py-20 text-gray-400 font-medium">No returns found!</div>
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
                                        <th>Return Type</th>
                                        <th>Return Qty</th>
                                        <th>Return Amount</th>
                                        <th>Created By</th>
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
                                                <div className="font-medium">{r.date || 'N/A'}</div>
                                                {r.editedAt && (
                                                    <div className="text-[11px] text-amber-600 font-semibold">
                                                        Edited: {fmtDateTime(r.editedAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleInvoiceClick(r)}
                                                    className="text-indigo-700 hover:text-pink-600 hover:underline font-bold cursor-pointer transition-colors"
                                                >
                                                    {r.invoiceNo}
                                                </button>
                                            </td>
                                            <td className="text-gray-600">{r.company}</td>
                                            <td>
                                                <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] ${TYPE_BADGE[r.kind]}`}>
                                                    {r.typeLabel}
                                                </span>
                                            </td>
                                            <td><QtyCell lines={r.lines} /></td>
                                            <td className="font-bold text-rose-600">৳{r.amount.toFixed(2)}</td>
                                            <td className="text-gray-600 font-medium">Admin</td>
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

export default PurCompanyReturnRepo;