import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
// NOTE: PurchaseUi er path tomar folder structure onujayi thik kore nio
import { fmt, inputCls, labelCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from '../Purchase/PurchaseUi';

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
                0 Pcs <span className={`text-xs ml-1 font-bold ${totalColor}`}>(Total: 0)</span>
            </div>
        );
    }
    return lines.map((ln, i) => (
        <div key={i}>
            {formatLine(ln)} <span className={`text-xs ml-1 font-bold ${totalColor}`}>(Total: {ln.totalQty})</span>
        </div>
    ));
};

const buildQtyInfo = (rows, unitKey, subKey, pcsKey, totalKey) => {
    const map = {};
    let total = 0;
    rows.forEach((r) => {
        buildLines(r, unitKey, subKey, pcsKey, totalKey).forEach((ln) => {
            const key = `${ln.unitLabel}|${ln.isParent ? ln.subLabel : ''}`;
            if (!map[key]) map[key] = { ...ln, unitQty: 0, subQty: 0, pcsQty: 0, totalQty: 0 };
            map[key].unitQty += ln.unitQty;
            map[key].subQty += ln.subQty;
            map[key].pcsQty += ln.pcsQty;
            map[key].totalQty += ln.totalQty;
            total += ln.totalQty;
        });
    });
    return { lines: Object.values(map), total };
};

const QtyBox = ({ title, titleCls, info, totalCls }) => (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
        <div className={`text-[10px] font-bold uppercase ${titleCls}`}>{title}</div>
        <div className="text-sm font-bold text-slate-800 mt-0.5">
            {info.lines.length === 0
                ? '0 Pcs'
                : info.lines.map((ln, i) => (
                    <div key={i}>
                        {formatLine(ln)} <span className={`text-xs font-bold ${totalCls}`}>(Total: {fmt(ln.totalQty)})</span>
                    </div>
                ))}
            {info.lines.length > 1 && <div className={`text-xs font-bold mt-0.5 ${totalCls}`}>Grand Total: {fmt(info.total)}</div>}
        </div>
    </div>
);

const qtyRow = (label, lines, cls, totCls) => {
    if (!lines || lines.length === 0) return null;
    return (
        <div className={`flex gap-1 text-[10px] leading-snug font-semibold ${cls}`}>
            <span className="uppercase text-slate-400 font-bold shrink-0">{label}:</span>
            <div className="min-w-0">{renderLines(lines, totCls)}</div>
        </div>
    );
};

const SalesBulkReturn = () => {
    const [returns, setReturns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const can = useCan('sales_bulk_return');

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));
    const denyMsg = (what) => showToast(`আপনার ${what} করার অনুমতি নেই!`, 'error');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', customer: '', customerContact: '', invoiceNo: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const fetchReturns = async () => {
        try {
            const res = await fetch('http://localhost:5000/sales-bulk-return');
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
            const res = await fetch('http://localhost:5000/customer');
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchCustomers();
        fetch('http://localhost:5000/sales')
            .then((res) => res.json())
            .then((d) => setSales(Array.isArray(d) ? d : []))
            .catch((error) => console.error(error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const getPhoneByName = (name) =>
        customers.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';

    const getAdjusted = (item) =>
        item.fromSales ? Number(sales.find((s) => String(s._id) === String(item.saleId))?.returnAdjustmentAmount) || 0 : 0;

    const customerOptions = customers
        .filter((c) => {
            const s = filters.customer.toLowerCase();
            return c.businessName?.toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', customer: '', customerContact: '', invoiceNo: '' });
        setCurrentPage(1);
    };

    // ---------- actions ----------
    const handleView = (item) => {
        if (item.fromSales) {
            navigate(`/sales-details/${item.saleId}`, { state: { scrollTo: 'return-products-section' } });
            return;
        }
        navigate(`/sales-bulk-return-view/${item._id}`);
    };

    const handleEdit = async (item) => {
        if (!can.canEdit) return denyMsg('Edit');
        if (item.fromSales) {
            try {
                const res = await fetch(`http://localhost:5000/sales/${item.saleId}`);
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
        if (!can.canDelete) return denyMsg('Delete');
        const target = returns.find((r) => r._id === id);
        if (target?.fromSales) {
            const confirm = await Swal.fire({
                title: 'Are you sure?',
                text: 'Ei invoice er Bulk Return Product gulo remove hobe. Main/Others Free product thik thakbe.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4a58e6',
                cancelButtonColor: '#e11d48',
                confirmButtonText: 'Yes, delete it!',
            });
            if (!confirm.isConfirmed) return;
            try {
                const sRes = await fetch(`http://localhost:5000/sales/${target.saleId}`);
                const sale = await sRes.json();
                if (sale && sale._id) {
                    const retAdj = Number(sale.returnAdjustmentAmount) || 0;
                    const upRes = await fetch(`http://localhost:5000/sales/${target.saleId}`, {
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
                const delRes = await fetch(`http://localhost:5000/sales-bulk-return/${id}`, { method: 'DELETE' });
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
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const response = await fetch(`http://localhost:5000/sales-bulk-return/${id}`, { method: 'DELETE' });
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

    const menuItems = (item) => [
        { label: 'View', onClick: () => handleView(item) },
        { label: 'Edit', tone: 'brand', onClick: () => handleEdit(item) },
        { label: 'Delete', tone: 'danger', onClick: () => handleDelete(item._id) },
    ];

    // ---------- filtering ----------
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
        if (filters.customerContact) {
            const phone = getPhoneByName(item.customer);
            if (phone && phone !== filters.customerContact) return false;
        }
        if (filters.invoiceNo && !item.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReturns = filteredReturns.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    // ---------- selection / summary ----------
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

    const totalReturnAmount = summaryRows.reduce((s, i) => s + (Number(i.returnAmount) || 0), 0);
    const qtyInfo = buildQtyInfo(summaryRows, 'unitQty', 'subQty', 'pcsQty', 'totalQty');
    const freeInfo = buildQtyInfo(summaryRows, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeQty');

    const activeCount = ['startDate', 'endDate', 'customer', 'invoiceNo'].filter((k) => filters[k]).length;

    const PaymentCell = ({ item }) => {
        if (item.payment) {
            return (
                <div className="text-[11px] font-bold mt-0.5">
                    <span className="text-emerald-600">Paid: ৳{fmt(item.payment.amount)}</span>
                    <span className="text-rose-600 ml-1">
                        (Due: {fmt(Math.max((Number(item.returnAmount) || 0) - (Number(item.payment.amount) || 0), 0))})
                    </span>
                </div>
            );
        }
        const adj = getAdjusted(item);
        return (
            <div className="mt-0.5">
                {adj > 0 ? <Pill tone="brand">Adjusted: ৳{fmt(adj)}</Pill> : <Pill tone="slate">Not Paid</Pill>}
            </div>
        );
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Sales Bulk Return</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage and track all sales bulk returns</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (can.canAdd ? navigate('/sales-bulk-return-form') : denyMsg('Add'))}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                        <FaPlus size={12} /> New Bulk Return
                    </button>
                </div>

                {/* Filter */}
                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-4">
                    <div>
                        <span className={labelCls}>Start Date</span>
                        <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                    </div>
                    <div>
                        <span className={labelCls}>End Date</span>
                        <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                    </div>
                    <ComboField
                        label="Customer"
                        value={filters.customer}
                        placeholder="Search customer..."
                        options={customerOptions}
                        onType={(v) => {
                            setFilters({ ...filters, customer: v, customerContact: '' });
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters({ ...filters, customer: '', customerContact: '' });
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters({ ...filters, customer: o.raw.businessName, customerContact: o.raw.contactNumber || '' });
                            setCurrentPage(1);
                        }}
                    />
                    <div>
                        <label className={labelCls}>Invoice Number</label>
                        <input type="text" name="invoiceNo" placeholder="Search invoice..." value={filters.invoiceNo} onChange={handleFilterChange} className={inputCls} />
                    </div>
                </FilterPanel>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Pill tone={isSelectionMode ? 'rose' : 'brand'}>{isSelectionMode ? 'Selected' : 'Showing'}</Pill>
                            <span className="text-sm text-slate-600">
                                Rows: <b className="text-slate-800">{summaryRows.length}</b>
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {isSelectionMode && (
                                <button type="button" onClick={() => setSelectedIds([])} className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                                    Clear Selection
                                </button>
                            )}
                            <button type="button" onClick={() => setIsSummaryOpen((p) => !p)} className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">
                                {isSummaryOpen ? 'Hide Details' : 'Show Details'}
                                <FaChevronDown size={10} className={`transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                    <div className={`${isSummaryOpen ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-3 gap-3`}>
                        <QtyBox title="Return Quantity" titleCls="text-orange-600" totalCls="text-brand-700" info={qtyInfo} />
                        <QtyBox title="Return Free Quantity" titleCls="text-emerald-600" totalCls="text-emerald-700" info={freeInfo} />
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                            <div className="text-[10px] font-bold uppercase text-rose-600">Return Amount</div>
                            <div className="text-lg font-bold text-rose-600 mt-0.5">৳{fmt(totalReturnAmount)}</div>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    {loading ? (
                        <ListSkeleton />
                    ) : filteredReturns.length === 0 ? (
                        <Empty text="No bulk returns found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentReturns.map((item, index) => {
                                    const sel = selectedIds.includes(item._id);
                                    const phone = getPhoneByName(item.customer);
                                    return (
                                        <div
                                            key={item._id || index}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${item.fromSales ? 'bg-violet-500' : 'bg-orange-400'}`} />
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    aria-label="Select row"
                                                    className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                                <p className="min-w-0 font-bold text-[13px] text-brand-700 truncate leading-tight">{item.customer}</p>
                                                {item.fromSales && (
                                                    <span className="shrink-0 px-1.5 py-px rounded-full bg-violet-50 text-violet-700 text-[9px] font-bold leading-tight">
                                                        From Sales
                                                    </span>
                                                )}
                                                <span className="ml-auto" />
                                                <RowMenu compact items={menuItems(item)} />
                                            </div>
                                            <div className="flex items-stretch gap-2">
                                                {/* Left: info */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="shrink-0 px-1.5 py-px rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold leading-tight">
                                                            #{item.invoiceNo}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500 leading-tight truncate min-w-0">{item.returnDate || 'N/A'}</span>
                                                    </div>
                                                    {phone && <p className="text-[10.5px] text-slate-500 leading-snug truncate">📞 {phone}</p>}
                                                    <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Collected By: </span>
                                                        {item.collectedBy || 'N/A'}
                                                    </p>
                                                    {qtyRow('Return', buildLines(item, 'unitQty', 'subQty', 'pcsQty', 'totalQty'), 'text-orange-600', 'text-brand-700')}
                                                    {qtyRow('Free', buildLines(item, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeQty'), 'text-emerald-600', 'text-emerald-700')}
                                                </div>

                                                {/* Right: payment + amount */}
                                                <div className="shrink-0 w-[100px] flex flex-col items-end justify-end gap-1">
                                                    <div className="text-right [&>div]:mt-0">
                                                        <PaymentCell item={item} />
                                                    </div>
                                                    <div className="w-full rounded-lg bg-orange-50 px-2 py-1 text-right">
                                                        <p className="text-[9px] uppercase font-bold leading-none text-slate-400">Return Amount</p>
                                                        <p className="text-[12.5px] font-extrabold leading-tight mt-0.5 text-orange-600 whitespace-nowrap">
                                                            ৳{Number(item.returnAmount || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[1050px] text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                                        <tr>
                                            <th className="w-10 px-3 py-3 text-center">
                                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">Collected By</th>
                                            <th className="px-3 py-3">Invoice No</th>
                                            <th className="px-3 py-3">Return Qty</th>
                                            <th className="px-3 py-3">Free Qty</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentReturns.map((item, index) => {
                                            const sel = selectedIds.includes(item._id);
                                            const phone = getPhoneByName(item.customer);
                                            return (
                                                <tr key={item._id || index} className={`align-middle ${sel ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-600">{item.returnDate || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{item.customer}</div>
                                                        {phone && <div className="text-[11px] font-medium text-slate-400 mt-0.5">📞 {phone}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-700">{item.collectedBy || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium">
                                                        <div>{item.invoiceNo}</div>
                                                        {item.fromSales && <div className="mt-0.5"><Pill tone="brand">From Sales</Pill></div>}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-orange-600 whitespace-nowrap">
                                                        {renderLines(buildLines(item, 'unitQty', 'subQty', 'pcsQty', 'totalQty'), 'text-brand-700')}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-emerald-600 whitespace-nowrap">
                                                        {renderLines(buildLines(item, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeQty'), 'text-emerald-700')}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-orange-600">৳{Number(item.returnAmount || 0).toFixed(2)}</div>
                                                        <PaymentCell item={item} />
                                                    </td>
                                                    <td className="px-3 py-3 text-center"><RowMenu items={menuItems(item)} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <Pager
                                page={currentPage}
                                totalPages={totalPages}
                                onChange={handlePageChange}
                                from={indexOfFirstItem + 1}
                                to={Math.min(indexOfLastItem, filteredReturns.length)}
                                total={filteredReturns.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesBulkReturn;