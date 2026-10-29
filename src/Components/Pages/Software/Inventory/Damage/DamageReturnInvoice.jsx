import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes } from 'react-icons/fa';
import Swal from 'sweetalert2';

const FilterSelect = ({ label, placeholder, value, options, onChange }) => {
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
                    onChange={(e) => { onChange(e.target.value); setOpen(true); }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }}
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
                                onClick={() => { onChange(o); setOpen(false); }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                            >
                                {o}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No data found</div>
                    )}
                </div>
            )}
        </div>
    );
};

const DamageReturnInvoice = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const focusEvent = location.state?.focusEvent || null;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [highlightId, setHighlightId] = useState(null);
    const [costRow, setCostRow] = useState(null);
    const [costModalShow, setCostModalShow] = useState(false);

    const openCostModal = (row) => {
        setOpenDropdownId(null);
        setCostRow(row);
        setTimeout(() => setCostModalShow(true), 10);
    };
    const closeCostModal = () => {
        setCostModalShow(false);
        setTimeout(() => setCostRow(null), 300);
    };

    const EMPTY_FILTERS = { startDate: '', endDate: '', company: '', invoiceNo: '', status: '' };
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
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

    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('https://squirrel-peace-server.onrender.com/damage-return').then((res) => res.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/purchase').then((res) => res.json()).catch(() => []),
        ])
            .then(([d, purchases]) => {
                const list = Array.isArray(d) ? d : [];
                const fromPurchase = (Array.isArray(purchases) ? purchases : [])
                    .filter(
                        (p) =>
                            (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') &&
                            (p.damageItems || []).length > 0
                    )
                    .map((p) => ({
                        ...p,
                        isFromPurchase: true,
                        returnDate: p.receiveDate || p.purchaseDate,
                        items: p.damageItems,
                    }));
                const merged = [...list, ...fromPurchase];
                merged.sort(
                    (a, b) =>
                        (Date.parse(b.createdAt || b.damageAt) || 0) - (Date.parse(a.createdAt || a.damageAt) || 0)
                );
                setReturns(merged);
            })
            .catch((error) => console.error('Error fetching damage return:', error))
            .finally(() => setLoading(false));
    }, []);


    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const companyOptions = uniq(returns.map((o) => o.company));
    const has = (val, q) => (val || '').toString().toLowerCase().includes(q.toLowerCase());

    const filteredReturns = returns.filter((item) => {
        if (filters.startDate || filters.endDate) {
            const od = parseToLocalDate(item.returnDate);
            if (!od) return false;
            if (filters.startDate) {
                const s = parseToLocalDate(filters.startDate);
                if (s && od < s) return false;
            }
            if (filters.endDate) {
                const e = parseToLocalDate(filters.endDate);
                if (e && od > e) return false;
            }
        }
        if (filters.company && !has(item.company, filters.company)) return false;
        if (filters.invoiceNo && !has(item.invoiceNo, filters.invoiceNo)) return false;
        if (filters.status) {
            const isApproved = item.isFromPurchase
                ? Number(item.damageAdjustmentAmount) > 0 || item.damageStatus === 'Approved'
                : item.status === 'Approved';
            if (filters.status === 'Approved' && !isApproved) return false;
            if (filters.status === 'Pending' && isApproved) return false;
        }
        return true;
    });

    // History theke Open korle oi invoice highlight hobe
    useEffect(() => {
        if (focusEvent?.id) setHighlightId(String(focusEvent.id));
    }, [focusEvent]);

    useEffect(() => {
        if (!highlightId || loading) return;
        const idx = filteredReturns.findIndex((o) => String(o._id) === highlightId);
        if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1);
        const t = setTimeout(() => {
            const el = document.getElementById(`dmgret-row-${highlightId}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 350);
        return () => clearTimeout(t);
        // eslint-disable-next-line
    }, [highlightId, loading]);

    // Highlight row er baire click korle highlight jabe
    useEffect(() => {
        if (!highlightId) return;
        const onDown = (ev) => {
            if (ev.target.closest && ev.target.closest('[data-hl="1"]')) return;
            setHighlightId(null);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [highlightId]);

    const getAmount = (item) =>
        Number(item.damageAmount) ||
        (item.items || []).reduce((s, it) => s + (Number(it.itemTotal ?? it.subtotal) || 0), 0);

    const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
    const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

    // Stock Cost beshi = Loss, Return Amount beshi = Profit
    const costStatus = (d) =>
        d > 0
            ? { label: 'Loss', box: 'bg-rose-50 border-rose-200 text-rose-700', card: 'bg-rose-50 border-rose-100', lbl: 'text-rose-400', val: 'text-rose-600', sub: 'text-rose-500', tag: 'bg-rose-500 text-white' }
            : d < 0
                ? { label: 'Profit', box: 'bg-emerald-50 border-emerald-200 text-emerald-700', card: 'bg-emerald-50 border-emerald-100', lbl: 'text-emerald-400', val: 'text-emerald-600', sub: 'text-emerald-500', tag: 'bg-emerald-500 text-white' }
                : { label: 'Even', box: 'bg-gray-50 border-gray-200 text-gray-600', card: 'bg-gray-50 border-gray-100', lbl: 'text-gray-400', val: 'text-gray-600', sub: 'text-gray-500', tag: 'bg-gray-400 text-white' };

    const calcCost = (row) => {
        const lines = (row.items || [])
            .map((it) => {
                const bd = it.costBreakdown || [];
                const qty = Number(it.totalQty) || 0;
                if (bd.length === 0 || qty <= 0) return null;
                const bdQty = bd.reduce((s, l) => s + (Number(l.qty) || 0), 0);
                const stockTotal = r2(bd.reduce((s, l) => s + (Number(l.amount) || 0), 0));
                const retPerPcs = Number(it.buyPrice) || 0;
                return {
                    name: it.productName,
                    qty,
                    stockPerPcs: bdQty > 0 ? stockTotal / bdQty : 0,
                    retPerPcs,
                    stockTotal,
                    retTotal: r2(retPerPcs * qty),
                    batches: bd,
                };
            })
            .filter(Boolean);
        const stockTotal = r2(lines.reduce((s, l) => s + l.stockTotal, 0));
        const retTotal = r2(lines.reduce((s, l) => s + l.retTotal, 0));
        return { lines, stockTotal, retTotal, diff: r2(stockTotal - retTotal), hasData: lines.length > 0 };
    };

    const selectedRows = filteredReturns.filter((i) => selectedIds.includes(i._id));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredReturns;
    const grandAmount = summaryRows.reduce((s, i) => s + getAmount(i), 0);

    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredReturns.slice(indexOfFirstItem, indexOfLastItem);

    const isAllSelected =
        currentItems.length > 0 && currentItems.every((i) => selectedIds.includes(i._id));

    const handleSelectAll = () => {
        const ids = currentItems.map((i) => i._id);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };

    const handleSelectRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const handleViewDetails = (id) => {
        setOpenDropdownId(null);
        const target = returns.find((r) => r._id === id);
        if (target?.isFromPurchase) {
            navigate(`/purchase-details/${id}`, { state: { scrollTo: 'damage-products-section' } });
            return;
        }
        navigate(`/damage-return-details/${id}`);
    };

    const handleEdit = (item) => {
        setOpenDropdownId(null);
        if (item.isFromPurchase) {
            const { isFromPurchase: _a, returnDate: _b, items: _c, ...original } = item;
            navigate('/add-purchase', { state: { purchase: original } });
            return;
        }
        navigate('/damage-return-add', { state: { damageReturn: item } });
    };

    const handleDelete = (item) => {
        setOpenDropdownId(null);
        if (item.isFromPurchase) {
            Swal.fire({
                title: 'Are you sure?',
                text: 'এই invoice এর সব Damage Product মুছে যাবে!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4f46e5',
                cancelButtonColor: '#f43f5e',
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (!result.isConfirmed) return;
                try {
                    const damageAdj = Number(item.damageAdjustmentAmount) || 0;
                    const newPayable = Math.round(((Number(item.payableAmount) || 0) + damageAdj) * 100) / 100;
                    const res = await fetch(`https://squirrel-peace-server.onrender.com/purchase/${item._id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            damageItems: [],
                            payableAmount: newPayable,
                            receiveStatus: 'Received',
                            returnOnly: true,
                            unsetFields: ['damageAdjustmentAmount'],
                        }),
                    });
                    if (!res.ok) throw new Error('Failed');
                    setReturns((prev) => prev.filter((o) => o._id !== item._id));
                    setSelectedIds((prev) => prev.filter((x) => x !== item._id));
                    showToast('Damage products deleted successfully!');
                } catch (error) {
                    console.error(error);
                    showToast('Failed to delete!', 'error');
                }
            });
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
            if (!result.isConfirmed) return;
            try {
                const delRes = await fetch(`https://squirrel-peace-server.onrender.com/damage-return/${item._id}`, { method: 'DELETE' });
                if (!delRes.ok) throw new Error('Failed');
                setReturns((prev) => prev.filter((o) => o._id !== item._id));
                setSelectedIds((prev) => prev.filter((x) => x !== item._id));
                showToast('Damage return deleted successfully!');
            } catch (error) {
                console.error(error);
                showToast('Failed to delete!', 'error');
            }
        });
    };

    const handleApprove = (item) => {
        setOpenDropdownId(null);
        Swal.fire({
            title: 'Approve this damage return?',
            text: 'Approve korle status Approved hoye jabe!',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, approve it!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const approveUrl = item.isFromPurchase
                    ? `https://squirrel-peace-server.onrender.com/purchase/${item._id}`
                    : `https://squirrel-peace-server.onrender.com/damage-return/${item._id}`;
                const approveBody = item.isFromPurchase
                    ? { damageStatus: 'Approved', damageApprovedAt: new Date().toISOString() }
                    : { status: 'Approved', approvedAt: new Date().toISOString() };
                const res = await fetch(approveUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(approveBody),
                });
                if (!res.ok) throw new Error('Failed');
                setReturns((prev) =>
                    prev.map((o) => (o._id === item._id ? { ...o, status: 'Approved', damageStatus: 'Approved' } : o))
                );
                showToast('Damage return approved successfully!');
            } catch (error) {
                console.error(error);
                showToast('Failed to approve!', 'error');
            }
        });
    };

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                            Damage Return Invoice
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Damage products returned to company</p>
                    </div>
                    <div className="px-4 py-2 rounded-2xl bg-red-50 border border-red-100 text-center">
                        <div className="text-[10px] font-bold uppercase text-red-400">
                            {isSelectionMode ? 'Selected Total Amount' : 'Total Amount'}
                        </div>
                        <div className="text-lg font-extrabold text-red-600">
                            ৳{grandAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Damage Return Directory</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredReturns.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredReturns.length)}` : 0} of {filteredReturns.length}
                        </span>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <div className="flex items-center gap-2">
                                {isSelectionMode && (
                                    <button
                                        onClick={() => setSelectedIds([])}
                                        className="text-[11px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                                    >
                                        Clear Selection ({selectedRows.length})
                                    </button>
                                )}
                                <button
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                                >
                                    <FaRedo size={11} /> Clear All Filters
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
                                >
                                    <input
                                        ref={startDateRef}
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilter('startDate', e.target.value)}
                                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select start date"
                                        value={displayFormattedDate(filters.startDate)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}
                                >
                                    <input
                                        ref={endDateRef}
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilter('endDate', e.target.value)}
                                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select end date"
                                        value={displayFormattedDate(filters.endDate)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>

                            <FilterSelect
                                label="Company"
                                placeholder="Search or select company..."
                                value={filters.company}
                                options={companyOptions}
                                onChange={(v) => setFilter('company', v)}
                            />

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice No</label>
                                <input
                                    type="text"
                                    placeholder="Search invoice..."
                                    value={filters.invoiceNo}
                                    onChange={(e) => setFilter('invoiceNo', e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilter('status', e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Pending">Pending</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading...</div>
                    ) : filteredReturns.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No damage return found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-3 w-8 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Invoice</th>
                                        <th className="py-3 px-3">Return Amount</th>
                                        <th className="py-3 px-3">Cost Calculation</th>
                                        <th className="py-3 px-3">Status</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {currentItems.map((item, index) => (
                                        <tr
                                            key={item._id || index}
                                            id={`dmgret-row-${item._id}`}
                                            data-hl={highlightId === String(item._id) ? '1' : undefined}
                                            className={`transition duration-150 text-[13px] ${highlightId === String(item._id) ? 'bg-amber-100 ring-2 ring-inset ring-amber-400' : selectedIds.includes(item._id) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}
                                        >
                                            <td className="py-3 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item._id)}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3 px-3 text-gray-600 whitespace-nowrap font-medium">{item.returnDate || 'N/A'}</td>
                                            <td className="py-3 px-3 font-bold text-gray-800 whitespace-nowrap">{item.company || 'N/A'}</td>
                                            <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">
                                                <div>{item.invoiceNo}</div>
                                                {item.isFromPurchase && (
                                                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm">
                                                        From Purchase
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 font-bold text-red-600 whitespace-nowrap">
                                                <div>৳{getAmount(item).toFixed(2)}</div>
                                                {!item.isFromPurchase && (
                                                    item.payment ? (
                                                        <div className="text-[10px] font-bold mt-0.5">
                                                            <span className="text-emerald-600">Received: ৳{fmt(item.payment.amount)}</span>
                                                            <span className="text-rose-600 ml-1">
                                                                (Due: {fmt(Math.max(getAmount(item) - (Number(item.payment.amount) || 0), 0))})
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[9px]">
                                                            Not Received
                                                        </span>
                                                    )
                                                )}
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                {(() => {
                                                    const cost = calcCost(item);
                                                    if (!cost.hasData) return <span className="text-gray-300">—</span>;
                                                    const st = costStatus(cost.diff);
                                                    return (
                                                        <button type="button" onClick={() => openCostModal(item)} className="flex items-center gap-1.5 cursor-pointer">
                                                            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold ${st.box}`}>
                                                                {fmt(Math.abs(cost.diff))}
                                                                <span className={`ml-1 px-1.5 rounded-full text-[9px] ${st.tag}`}>{st.label}</span>
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-[10px] font-bold hover:bg-indigo-500 hover:text-white transition">
                                                                🧮 Details
                                                            </span>
                                                        </button>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                {item.isFromPurchase && Number(item.damageAdjustmentAmount) > 0 ? (
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-700 font-bold text-[11px]">
                                                        Auto Approved (Adjusted)
                                                    </span>
                                                ) : (item.isFromPurchase ? item.damageStatus : item.status) === 'Approved' ? (
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[11px]">
                                                        Approved
                                                    </span>
                                                ) : (
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold text-[11px]">
                                                        Pending
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-center relative">
                                                <div className="relative inline-block action-dropdown-container">
                                                    <button
                                                        onClick={() => setOpenDropdownId(openDropdownId === item._id ? null : item._id)}
                                                        className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-[11px] flex items-center gap-1 shadow-sm cursor-pointer whitespace-nowrap"
                                                    >
                                                        <span>Select</span>
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            fill="none"
                                                            viewBox="0 0 24 24"
                                                            strokeWidth={2}
                                                            stroke="currentColor"
                                                            className={`w-3.5 h-3.5 transition-transform duration-200 ${openDropdownId === item._id ? 'rotate-180' : ''}`}
                                                        >
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                                        </svg>
                                                    </button>

                                                    {openDropdownId === item._id && (
                                                        <div className="absolute right-0 bottom-full mb-2 w-40 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left flex flex-col">
                                                            <button
                                                                onClick={() => handleDelete(item)}
                                                                className="order-last w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition duration-150 cursor-pointer text-left"
                                                            >
                                                                Delete
                                                            </button>
                                                            {!(item.isFromPurchase && Number(item.damageAdjustmentAmount) > 0) &&
                                                                (item.isFromPurchase ? item.damageStatus : item.status) !== 'Approved' && (
                                                                    <button
                                                                        onClick={() => handleApprove(item)}
                                                                        className="w-full px-4 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 transition duration-150 cursor-pointer text-left"
                                                                    >
                                                                        Approval
                                                                    </button>
                                                                )}
                                                            <button
                                                                onClick={() => handleViewDetails(item._id)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition duration-150 cursor-pointer text-left"
                                                            >
                                                                View
                                                            </button>
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition duration-150 cursor-pointer text-left"
                                                            >
                                                                Edit
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filteredReturns.length > 0 && (
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

            {/* ---------- Cost Calculation Modal ---------- */}
            {costRow && (() => {
                const c = calcCost(costRow);
                const st = costStatus(c.diff);
                const th = 'py-2.5 px-3';
                return (
                    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${costModalShow ? 'opacity-100' : 'opacity-0'}`}>
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeCostModal} />
                        <div className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${costModalShow ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                            <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-rose-500 to-orange-500 text-white">
                                <div>
                                    <h3 className="text-base font-extrabold">🧮 Cost Calculation</h3>
                                    <p className="text-[11px] text-white/80 mt-0.5">
                                        Invoice: #{costRow.invoiceNo} | {costRow.company} | {costRow.returnDate || 'N/A'}
                                    </p>
                                </div>
                                <button type="button" onClick={closeCostModal} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer">✕</button>
                            </div>

                            <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="rounded-2xl border border-violet-100 bg-violet-50 px-3 py-3 text-center">
                                        <div className="text-[10px] font-bold uppercase text-violet-400">Stock Cost</div>
                                        <div className="text-base font-extrabold text-violet-700">৳{fmt(c.stockTotal)}</div>
                                        <div className="text-[10px] text-violet-400 mt-0.5">Damage stock er source cost</div>
                                    </div>
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-center">
                                        <div className="text-[10px] font-bold uppercase text-amber-500">Return Amount</div>
                                        <div className="text-base font-extrabold text-amber-700">৳{fmt(c.retTotal)}</div>
                                        <div className="text-[10px] text-amber-500 mt-0.5">Company k return dewar somoy</div>
                                    </div>
                                    <div className={`rounded-2xl border px-3 py-3 text-center ${st.card}`}>
                                        <div className={`text-[10px] font-bold uppercase ${st.lbl}`}>{st.label}</div>
                                        <div className={`text-base font-extrabold ${st.val}`}>৳{fmt(Math.abs(c.diff))}</div>
                                        <div className={`text-[10px] mt-0.5 ${st.sub}`}>{c.diff > 0 ? 'Stock Cost beshi' : c.diff < 0 ? 'Return Amount beshi' : 'Soman soman'}</div>
                                    </div>
                                </div>

                                <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-extrabold ${st.box}`}>
                                    Stock ৳{fmt(c.stockTotal)} vs Return ৳{fmt(c.retTotal)} → ৳{fmt(Math.abs(c.diff))}
                                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] ${st.tag}`}>{st.label}</span>
                                </div>

                                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-rose-50 text-rose-700 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
                                                <th className={th}>Product</th>
                                                <th className={`${th} text-center`}>Qty</th>
                                                <th className={`${th} text-right`}>Stock Cost / pcs</th>
                                                <th className={`${th} text-right`}>Stock Total</th>
                                                <th className={`${th} text-right`}>Return / pcs</th>
                                                <th className={`${th} text-right`}>Return Total</th>
                                                <th className={`${th} text-right`}>Difference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                            {c.lines.map((l, i) => {
                                                const d = r2(l.stockTotal - l.retTotal);
                                                return (
                                                    <React.Fragment key={i}>
                                                        <tr className="hover:bg-rose-50/40 transition">
                                                            <td className="py-3 px-3 font-semibold text-gray-800">{l.name}</td>
                                                            <td className="py-3 px-3 text-center font-bold text-orange-600 whitespace-nowrap">{fmt(l.qty)} pcs</td>
                                                            <td className="py-3 px-3 text-right font-bold text-violet-600 whitespace-nowrap">৳{fmt(l.stockPerPcs)}</td>
                                                            <td className="py-3 px-3 text-right font-bold text-violet-700 whitespace-nowrap">৳{fmt(l.stockTotal)}</td>
                                                            <td className="py-3 px-3 text-right font-bold text-amber-600 whitespace-nowrap">৳{fmt(l.retPerPcs)}</td>
                                                            <td className="py-3 px-3 text-right font-bold text-amber-700 whitespace-nowrap">৳{fmt(l.retTotal)}</td>
                                                            <td className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${costStatus(d).val}`}>
                                                                ৳{fmt(Math.abs(d))}
                                                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${costStatus(d).tag}`}>{costStatus(d).label}</span>
                                                            </td>
                                                        </tr>
                                                        <tr className="bg-gray-50/60">
                                                            <td colSpan={7} className="px-3 py-2">
                                                                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                                    <span className="font-bold text-gray-500 uppercase text-[10px]">Stock source:</span>
                                                                    {l.batches.map((b, bi) => (
                                                                        <span key={bi} className="px-2 py-0.5 rounded-md border border-violet-200 bg-violet-50 text-violet-700 font-semibold whitespace-nowrap">
                                                                            #{b.invoiceNo} · {fmt(b.qty)} pcs × ৳{fmt(b.cost)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                        <tfoot>
                                            <tr className="bg-rose-50/60 font-extrabold text-[13px]">
                                                <td className="py-3 px-3 text-gray-700" colSpan={3}>Total</td>
                                                <td className="py-3 px-3 text-right text-violet-700 whitespace-nowrap">৳{fmt(c.stockTotal)}</td>
                                                <td className="py-3 px-3"></td>
                                                <td className="py-3 px-3 text-right text-amber-700 whitespace-nowrap">৳{fmt(c.retTotal)}</td>
                                                <td className={`py-3 px-3 text-right whitespace-nowrap ${st.val}`}>
                                                    ৳{fmt(Math.abs(c.diff))}
                                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${st.tag}`}>{st.label}</span>
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default DamageReturnInvoice;