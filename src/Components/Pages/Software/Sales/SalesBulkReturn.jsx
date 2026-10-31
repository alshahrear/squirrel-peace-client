import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const SalesBulkReturn = () => {
    const [returns, setReturns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const navigate = useNavigate();
    const location = useLocation();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', customer: '', invoiceNo: '' });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const customerDropdownRef = useRef(null);

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    };

    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        const handler = (e) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(e.target)) setIsCustomerOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchReturns = async () => {
        try {
            const res = await fetch('https://squirrel-peace-server.onrender.com/sales-bulk-return');
            const data = await res.json();
            setReturns([...data].reverse());
        } catch (error) {
            console.error(error);
            showToast('Failed to load bulk returns!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('https://squirrel-peace-server.onrender.com/customer');
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data.filter((c) => c.customerType === 'Wholesale Customer') : []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchCustomers();
        fetch('https://squirrel-peace-server.onrender.com/sales')
            .then((res) => res.json())
            .then((d) => setSales(Array.isArray(d) ? d : []))
            .catch((error) => console.error(error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const filteredCustomers = customers.filter((c) =>
        c.businessName?.toLowerCase().includes(filters.customer.toLowerCase())
    );

    const handleSelectCustomer = (c) => {
        setFilters({ ...filters, customer: c.businessName });
        setIsCustomerOpen(false);
    };

    const handleClearCustomer = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, customer: '' });
        setIsCustomerOpen(false);
    };

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
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
        setFilters({ startDate: '', endDate: '', customer: '', invoiceNo: '' });
        setCurrentPage(1);
    };

    const handleView = (item) => {
        setOpenDropdownId(null);
        if (item.fromSales) {
            navigate(`/sales-details/${item.saleId}`, { state: { scrollTo: 'return-products-section' } });
            return;
        }
        navigate(`/sales-bulk-return-view/${item._id}`);
    };

    const handleEdit = async (item) => {
        setOpenDropdownId(null);
        if (item.fromSales) {
            try {
                const res = await fetch(`https://squirrel-peace-server.onrender.com/sales/${item.saleId}`);
                const sale = await res.json();
                if (!sale || !sale._id) {
                    showToast('Order not found!', 'error');
                    return;
                }
                navigate('/create-order', { state: { order: sale, mode: 'bulkReturn', bulkId: item._id } });
            } catch (error) {
                console.error(error);
                showToast('Failed to load order!', 'error');
            }
            return;
        }
        navigate('/sales-bulk-return-form', { state: { bulkReturn: item } });
    };

    const handleDelete = async (id) => {
        setOpenDropdownId(null);
        const target = returns.find((r) => r._id === id);
        if (target?.fromSales) {
            const confirm = await Swal.fire({
                title: 'Are you sure?',
                text: 'Ei invoice er Bulk Return Product gulo remove hobe. Main/Others Free product thik thakbe.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4f46e5',
                cancelButtonColor: '#f43f5e',
                confirmButtonText: 'Yes, delete it!',
            });
            if (!confirm.isConfirmed) return;
            try {
                const sRes = await fetch(`https://squirrel-peace-server.onrender.com/sales/${target.saleId}`);
                const sale = await sRes.json();
                if (sale && sale._id) {
                    const retAdj = Number(sale.returnAdjustmentAmount) || 0;
                    const upRes = await fetch(`https://squirrel-peace-server.onrender.com/sales/${target.saleId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            returnItems: [],
                            payableAmount: Math.round(((Number(sale.payableAmount) || 0) + retAdj) * 100) / 100,
                            unsetFields: ['returnAdjustmentAmount'],
                        }),
                    });
                    if (!upRes.ok) throw new Error('Order update failed');
                }
                const delRes = await fetch(`https://squirrel-peace-server.onrender.com/sales-bulk-return/${id}`, { method: 'DELETE' });
                if (!delRes.ok) throw new Error('Delete failed');
                showToast('Bulk return deleted successfully!', 'success');
                setReturns((prev) => prev.filter((i) => i._id !== id));
                setSelectedIds((prev) => prev.filter((x) => x !== id));
            } catch (error) {
                console.error(error);
                showToast('Failed to delete bulk return!', 'error');
            }
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`https://squirrel-peace-server.onrender.com/sales-bulk-return/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        showToast('Bulk return deleted successfully!', 'success');
                        setReturns((prev) => prev.filter((i) => i._id !== id));
                        setSelectedIds((prev) => prev.filter((x) => x !== id));
                    } else {
                        showToast('Failed to delete bulk return!', 'error');
                    }
                } catch (error) {
                    console.error(error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    // ---------- Filtering ----------
    const filteredReturns = returns.filter((item) => {
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(item.returnDate);
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
        if (filters.customer && !item.customer?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.invoiceNo && !item.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        return true;
    });

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReturns = filteredReturns.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    // ---------- Selection ----------
    const isAllSelected = currentReturns.length > 0 && currentReturns.every((i) => selectedIds.includes(i._id));

    const handleSelectAll = () => {
        const ids = currentReturns.map((i) => i._id);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };

    const handleSelectRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const selectedRows = filteredReturns.filter((i) => selectedIds.includes(i._id));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredReturns;

    const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
    const totalReturnAmount = summaryRows.reduce((s, i) => s + (Number(i.returnAmount) || 0), 0);

    const buildLines = (row, unitKey, subKey, pcsKey, totalKey) => {
        const lines = [];
        (row.items || []).forEach((it) => {
            const u = Number(it[unitKey]) || 0;
            const s = Number(it[subKey]) || 0;
            const p = Number(it[pcsKey]) || 0;
            const t = Number(it[totalKey]) || 0;
            if (u <= 0 && s <= 0 && p <= 0 && t <= 0) return;
            lines.push({
                unitLabel: it.unit || 'Unit',
                subLabel: it.subUnit || 'Sub',
                isParent: it.parentMode === true,
                unitQty: u,
                subQty: s,
                pcsQty: p,
                totalQty: t,
            });
        });
        return lines;
    };

    const formatLine = (ln) => {
        const parts = [];
        if (ln.unitQty > 0) parts.push(`${ln.unitQty} ${ln.unitLabel}`);
        if (ln.isParent && ln.subQty > 0) parts.push(`${ln.subQty} ${ln.subLabel}`);
        parts.push(`${ln.pcsQty} Pcs`);
        return parts.join(' ');
    };

    const renderLines = (lines, totalColor) => {
        if (!lines || lines.length === 0) {
            return (
                <div>
                    0 Pcs
                    <span className={`text-xs ml-1 font-bold ${totalColor}`}>(Total: 0)</span>
                </div>
            );
        }
        return lines.map((ln, i) => (
            <div key={i}>
                {formatLine(ln)}
                <span className={`text-xs ml-1 font-bold ${totalColor}`}>(Total: {ln.totalQty})</span>
            </div>
        ));
    };

    const buildQtyInfo = (rows, unitKey, subKey, pcsKey, totalKey) => {
        const map = {};
        let total = 0;
        rows.forEach((r) => {
            buildLines(r, unitKey, subKey, pcsKey, totalKey).forEach((ln) => {
                const key = `${ln.unitLabel}|${ln.isParent ? ln.subLabel : ''}`;
                if (!map[key]) {
                    map[key] = { ...ln, unitQty: 0, subQty: 0, pcsQty: 0, totalQty: 0 };
                }
                map[key].unitQty += ln.unitQty;
                map[key].subQty += ln.subQty;
                map[key].pcsQty += ln.pcsQty;
                map[key].totalQty += ln.totalQty;
                total += ln.totalQty;
            });
        });
        return { lines: Object.values(map), total };
    };

    const qtyInfo = buildQtyInfo(summaryRows, 'unitQty', 'subQty', 'pcsQty', 'totalQty');
    const freeInfo = buildQtyInfo(summaryRows, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeQty');

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Sales Bulk Return
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage and track all sales bulk returns</p>
                    </div>
                    <button
                        onClick={() => navigate('/sales-bulk-return-form')}
                        className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition duration-200 cursor-pointer"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                        New Bulk Return
                    </button>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Bulk Return Directory</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredReturns.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredReturns.length)}` : 0} of {filteredReturns.length} ({returns.length} total)
                        </span>
                    </div>

                    {/* Filter */}
                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button onClick={handleClearFilters} className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer">
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <div className="relative w-full cursor-pointer" onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}>
                                    <input ref={startDateRef} type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                                    <input type="text" readOnly placeholder="Select start date" value={displayFormattedDate(filters.startDate)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                <div className="relative w-full cursor-pointer" onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}>
                                    <input ref={endDateRef} type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                                    <input type="text" readOnly placeholder="Select end date" value={displayFormattedDate(filters.endDate)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none" />
                                </div>
                            </div>

                            <div className="relative" ref={customerDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer</label>
                                <div onClick={() => setIsCustomerOpen(true)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between">
                                    <input
                                        type="text"
                                        placeholder="Search or select customer..."
                                        value={filters.customer}
                                        onChange={(e) => {
                                            handleFilterChange({ target: { name: 'customer', value: e.target.value } });
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
                                                <div key={c._id} onClick={() => handleSelectCustomer(c)} className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700">
                                                    {c.businessName}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No customer found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice Number</label>
                                <input type="text" name="invoiceNo" placeholder="Search invoice..." value={filters.invoiceNo} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50" />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${isSelectionMode ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {isSelectionMode ? 'Selected' : 'Showing'}
                        </span>
                        <span className="font-semibold text-gray-600">Rows: <b className="text-gray-800">{summaryRows.length}</b></span>
                        <div className="w-px self-stretch bg-indigo-200" />

                        <div className="px-3 py-2 rounded-xl bg-white border border-orange-200 shadow-sm">
                            <div className="text-[9px] font-bold uppercase text-orange-500">Return Quantity</div>
                            <div className="text-sm font-extrabold text-orange-600">
                                {qtyInfo.lines.length === 0 ? '0 Pcs' : qtyInfo.lines.map((ln, i) => (
                                    <div key={i}>
                                        {formatLine(ln)}
                                        <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {fmt(ln.totalQty)})</span>
                                    </div>
                                ))}
                                {qtyInfo.lines.length > 1 && (
                                    <div className="text-xs text-indigo-600 font-bold mt-0.5">Grand Total: {fmt(qtyInfo.total)}</div>
                                )}
                            </div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-white border border-emerald-200 shadow-sm">
                            <div className="text-[9px] font-bold uppercase text-emerald-500">Return Free Quantity</div>
                            <div className="text-sm font-extrabold text-emerald-600">
                                {freeInfo.lines.length === 0 ? '0 Pcs' : freeInfo.lines.map((ln, i) => (
                                    <div key={i}>
                                        {formatLine(ln)}
                                        <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {fmt(ln.totalQty)})</span>
                                    </div>
                                ))}
                                {freeInfo.lines.length > 1 && (
                                    <div className="text-xs text-emerald-700 font-bold mt-0.5">Grand Total: {fmt(freeInfo.total)}</div>
                                )}
                            </div>
                        </div>
                        <div className="px-3 py-2 rounded-xl bg-white border border-rose-200 shadow-sm">
                            <div className="text-[9px] font-bold uppercase text-rose-500">Return Amount</div>
                            <div className="text-sm font-extrabold text-rose-600">৳{fmt(totalReturnAmount)}</div>
                        </div>
                        {isSelectionMode && (
                            <button onClick={() => setSelectedIds([])} className="ml-auto text-[11px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2.5 py-1 rounded-lg font-semibold cursor-pointer">
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading bulk returns...</div>
                    ) : filteredReturns.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No bulk returns found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-1.5 [&_th]:py-2.5 [&_th]:text-[10px] [&_td]:px-1.5 [&_td]:py-2.5 [&_td]:text-[11px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[10px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="w-8 text-center">
                                            <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} className="w-4 h-4 accent-pink-500 cursor-pointer" />
                                        </th>
                                        <th className="py-3 px-2.5">Date</th>
                                        <th className="py-3 px-2.5">Customer Name</th>
                                        <th className="py-3 px-2.5">Invoice No</th>
                                        <th className="py-3 px-2.5">Return Quantity</th>
                                        <th className="py-3 px-2.5">Return Free Quantity</th>
                                        <th className="py-3 px-2.5">Return Amount</th>
                                        <th className="py-3 px-2.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {currentReturns.map((item, index) => {
                                        const retLines = buildLines(item, 'unitQty', 'subQty', 'pcsQty', 'totalQty');
                                        const freeLines = buildLines(item, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeQty');
                                        return (
                                            <tr key={item._id || index} className={`transition duration-150 ${selectedIds.includes(item._id) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}>
                                                <td className="text-center">
                                                    <input type="checkbox" checked={selectedIds.includes(item._id)} onChange={() => handleSelectRow(item._id)} className="w-4 h-4 accent-pink-500 cursor-pointer" />
                                                </td>
                                                <td className="px-2.5 text-gray-600 whitespace-nowrap font-medium">{item.returnDate || 'N/A'}</td>
                                                <td className="px-2.5 font-bold text-gray-800 whitespace-nowrap">{item.customer}</td>
                                                <td className="px-2.5 text-gray-600 font-medium whitespace-nowrap">
                                                    <div>{item.invoiceNo}</div>
                                                    {item.fromSales && (
                                                        <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm">
                                                            From Sales
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-2.5 font-semibold text-orange-600 whitespace-nowrap">
                                                    {renderLines(retLines, 'text-indigo-600')}
                                                </td>
                                                <td className="px-2.5 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {renderLines(freeLines, 'text-emerald-700')}
                                                </td>
                                                <td className="px-2.5 font-bold text-orange-600 whitespace-nowrap">
                                                    <div>৳{Number(item.returnAmount).toFixed(2)}</div>
                                                    {item.payment ? (
                                                        <div className="text-[10px] font-bold mt-0.5">
                                                            <span className="text-emerald-600">Paid: ৳{fmt(item.payment.amount)}</span>
                                                            <span className="text-rose-600 ml-1">
                                                                (Due: {fmt(Math.max((Number(item.returnAmount) || 0) - (Number(item.payment.amount) || 0), 0))})
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        item.fromSales &&
                                                            Number(sales.find((s) => String(s._id) === String(item.saleId))?.returnAdjustmentAmount) > 0 ? (
                                                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-semibold text-[9px]">
                                                                Adjusted: ৳{fmt(sales.find((s) => String(s._id) === String(item.saleId))?.returnAdjustmentAmount)}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[9px]">
                                                                Not Paid
                                                            </span>
                                                        )
                                                    )}
                                                </td>
                                                <td className="px-2.5 text-center relative">
                                                    <div className="relative inline-block action-dropdown-container">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === item._id ? null : item._id)}
                                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                                                        >
                                                            <span>Select</span>
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === item._id ? 'rotate-180' : ''}`}>
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </button>

                                                        {openDropdownId === item._id && (
                                                            <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left">
                                                                <button onClick={() => handleView(item)} className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer">
                                                                    View
                                                                </button>
                                                                <button onClick={() => handleEdit(item)} className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition duration-150 cursor-pointer">
                                                                    Edit
                                                                </button>
                                                                <button onClick={() => handleDelete(item._id)} className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer">
                                                                    Delete
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filteredReturns.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'}`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>
                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
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
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'}`}
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

export default SalesBulkReturn;