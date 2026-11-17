import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaTimes, FaChevronDown } from 'react-icons/fa';
import { getBatchCostPerPcs } from '../../Software/Inventory/Stock/StockPurchase';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
import { fmt, inputCls, labelCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from './PurchaseUi';

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

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const costStatus = (d) =>
    d > 0
        ? { label: 'Loss', box: 'bg-rose-50 border-rose-200 text-rose-700', card: 'bg-rose-50 border-rose-100', lbl: 'text-rose-400', val: 'text-rose-600', sub: 'text-rose-500', tag: 'bg-rose-500 text-white' }
        : d < 0
            ? { label: 'Profit', box: 'bg-emerald-50 border-emerald-200 text-emerald-700', card: 'bg-emerald-50 border-emerald-100', lbl: 'text-emerald-400', val: 'text-emerald-600', sub: 'text-emerald-500', tag: 'bg-emerald-500 text-white' }
            : { label: 'Even', box: 'bg-slate-50 border-slate-200 text-slate-600', card: 'bg-slate-50 border-slate-100', lbl: 'text-slate-400', val: 'text-slate-600', sub: 'text-slate-500', tag: 'bg-slate-400 text-white' };

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

const PurchaseBulkReturn = () => {
    const [returns, setReturns] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const { canAdd, canEdit, canDelete } = useCan('purchase_bulk_return');

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));
    const denyMsg = (what) => showToast(`আপনার ${what} করার অনুমতি নেই!`, 'error');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', company: '', companyContact: '', invoiceNo: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [stockBatches, setStockBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [costRow, setCostRow] = useState(null);
    const [costModalShow, setCostModalShow] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const openCostModal = (row) => {
        setCostRow(row);
        setTimeout(() => setCostModalShow(true), 10);
    };
    const closeCostModal = () => {
        setCostModalShow(false);
        setTimeout(() => setCostRow(null), 250);
    };

    const fetchBatches = async () => {
        try {
            const res = await fetch('http://localhost:5000/stock-purchase');
            const data = await res.json();
            setStockBatches(Array.isArray(data) ? data : []);

            const pRes = await fetch('http://localhost:5000/purchase');
            const pData = await pRes.json();
            setPurchases(Array.isArray(pData) ? pData : []);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchReturns = async () => {
        try {
            const res = await fetch('http://localhost:5000/purchase-bulk-return');
            const data = await res.json();
            setReturns([...data].reverse());
        } catch (error) {
            console.error(error);
            showToast('Failed to load bulk returns!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchCompanies();
        fetchBatches();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const companyOptions = companies
        .filter((c) => {
            const s = filters.company.toLowerCase();
            return c.businessName?.toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', company: '', companyContact: '', invoiceNo: '' });
        setCurrentPage(1);
    };

    const handleView = (item) => {
        if (item.fromPurchase) {
            navigate(`/purchase-details/${item.purchaseId}`, { state: { scrollToReturn: true } });
            return;
        }
        navigate(`/purchase-bulk-return-view/${item._id}`);
    };

    const handleApprove = (item) => {
        if (!canEdit) return denyMsg('Edit');
        Swal.fire({
            title: 'Approve this bulk return?',
            text: 'Approve korle status Approved hoye jabe!',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, approve it!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const res = await fetch(`http://localhost:5000/purchase-bulk-return/${item._id}/approve`, { method: 'PATCH' });
                if (!res.ok) throw new Error('Failed');
                setReturns((prev) => prev.map((o) => (o._id === item._id ? { ...o, status: 'Approved' } : o)));
                showToast('Bulk return approved successfully!', 'success');
            } catch (error) {
                console.error(error);
                showToast('Failed to approve!', 'error');
            }
        });
    };

    const handleEdit = async (item) => {
        if (!canEdit) return denyMsg('Edit');
        if (item.fromPurchase) {
            try {
                const res = await fetch(`http://localhost:5000/purchase/${item.purchaseId}`);
                const purchase = await res.json();
                if (!purchase || !purchase._id) {
                    showToast('Purchase not found!', 'error');
                    return;
                }
                navigate('/add-purchase', { state: { purchase, returnOnly: true, bulkId: item._id } });
            } catch (error) {
                console.error(error);
                showToast('Failed to load purchase!', 'error');
            }
            return;
        }
        navigate('/purchase-bulk-return-form', { state: { bulkReturn: item } });
    };

    const handleDelete = async (id) => {
        if (!canDelete) return denyMsg('Delete');
        const target = returns.find((r) => r._id === id);
        if (target?.fromPurchase) {
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
                const pRes = await fetch(`http://localhost:5000/purchase/${target.purchaseId}`);
                const purchase = await pRes.json();
                if (purchase && purchase._id) {
                    const retAdj = Number(purchase.returnAdjustmentAmount) || 0;
                    const upRes = await fetch(`http://localhost:5000/purchase/${target.purchaseId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            returnItems: [],
                            payableAmount: Math.round(((Number(purchase.payableAmount) || 0) + retAdj) * 100) / 100,
                            unsetFields: ['returnAdjustmentAmount'],
                        }),
                    });
                    if (!upRes.ok) throw new Error('Purchase update failed');
                }
                const delRes = await fetch(`http://localhost:5000/purchase-bulk-return/${id}`, { method: 'DELETE' });
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
                    const response = await fetch(`http://localhost:5000/purchase-bulk-return/${id}`, { method: 'DELETE' });
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
        {
            label: 'Approval',
            tone: 'success',
            hidden: !(!item.fromPurchase && (item.status || 'Approved') !== 'Approved'),
            onClick: () => handleApprove(item),
        },
        { label: 'View', onClick: () => handleView(item) },
        { label: 'Edit', tone: 'brand', onClick: () => handleEdit(item) },
        { label: 'Delete', tone: 'danger', onClick: () => handleDelete(item._id) },
    ];

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
        if (filters.company && !item.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.companyContact && item.companyContact && item.companyContact !== filters.companyContact) return false;
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

    const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
    const batchCostMap = new Map(
        stockBatches.map((b) => [String(b._id), getBatchCostPerPcs(b, purchaseMap.get(String(b.purchaseId)))])
    );

    const calcCost = (row) => {
        const lines = (row.items || [])
            .map((it) => {
                const qty = Number(it.totalPcs) || 0;
                const allocs = (row.stockAllocations || []).filter((a) => {
                    const kind = a.kind || (a.pool === 'paid' ? 'main' : 'free');
                    return String(a.productId) === String(it.productId) && kind === 'main';
                });
                const allocQty = allocs.reduce((s, a) => s + (Number(a.qty) || 0), 0);
                const stockTotal = allocs.reduce((s, a) => s + (batchCostMap.get(String(a.batchId)) || 0) * (Number(a.qty) || 0), 0);
                const bulkPerPcs = Number(it.buyPrice) || 0;
                return {
                    name: it.productName,
                    qty,
                    stockPerPcs: allocQty > 0 ? stockTotal / allocQty : 0,
                    bulkPerPcs,
                    stockTotal: r2(stockTotal),
                    bulkTotal: r2(bulkPerPcs * qty),
                    batches: allocs.map((a) => ({
                        batchNo: a.batchNo,
                        invoiceNo: a.invoiceNo,
                        qty: Number(a.qty) || 0,
                        perPcs: batchCostMap.get(String(a.batchId)) || 0,
                    })),
                };
            })
            .filter((l) => l.qty > 0);
        const stockTotal = r2(lines.reduce((s, l) => s + l.stockTotal, 0));
        const bulkTotal = r2(lines.reduce((s, l) => s + l.bulkTotal, 0));
        return { lines, stockTotal, bulkTotal, diff: r2(stockTotal - bulkTotal) };
    };

    const qtyInfo = buildQtyInfo(summaryRows, 'unitQty', 'subQty', 'pcsQty', 'totalPcs');
    const freeInfo = buildQtyInfo(summaryRows, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeTotalQty');

    const activeCount = ['startDate', 'endDate', 'company', 'invoiceNo'].filter((k) => filters[k]).length;

    const statusPill = (item) =>
        item.fromPurchase ? <Pill tone="green">Auto Approved</Pill> : (item.status || 'Approved') === 'Approved' ? <Pill tone="green">Approved</Pill> : <Pill tone="amber">Pending</Pill>;

    const qtyRow = (label, lines, cls, totCls) => {
        if (!lines || lines.length === 0) return null;
        return (
            <div className={`flex gap-1 text-[10px] leading-snug font-semibold ${cls}`}>
                <span className="uppercase text-slate-400 font-bold shrink-0">{label}:</span>
                <div className="min-w-0">{renderLines(lines, totCls)}</div>
            </div>
        );
    };

    const CostBtn = ({ item, compact = false }) => {
        const cost = calcCost(item);
        const st = costStatus(cost.diff);
        return (
            <button type="button" onClick={() => openCostModal(item)} className="flex items-center gap-1 cursor-pointer">
                <span className={`rounded-md border font-bold ${compact ? 'px-1.5 py-px text-[10px]' : 'px-2 py-1 text-[11px]'} ${st.box}`}>
                    {fmt(Math.abs(cost.diff))}
                    <span className={`ml-1 px-1.5 rounded-full ${compact ? 'text-[8px]' : 'text-[9px]'} ${st.tag}`}>{st.label}</span>
                </span>
                <span className={`rounded-full bg-brand-50 border border-brand-100 text-brand-700 font-bold hover:bg-brand-100 ${compact ? 'px-1.5 py-px text-[10px]' : 'px-2 py-1 text-[11px]'}`}>Details</span>
            </button>
        );
    };

    const PaymentCell = ({ item }) =>
        item.payment ? (
            <div className="text-[11px] font-bold mt-0.5">
                <span className="text-emerald-600">Received: ৳{fmt(item.payment.amount)}</span>
                <span className="text-rose-600 ml-1">(Due: {fmt(Math.max((Number(item.returnAmount) || 0) - (Number(item.payment.amount) || 0), 0))})</span>
            </div>
        ) : (
            <div className="mt-0.5"><Pill tone="slate">Not Received</Pill></div>
        );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Purchase Bulk Return</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage and track all purchase bulk returns</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (canAdd ? navigate('/purchase-bulk-return-form') : denyMsg('Add'))}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                        <FaPlus size={12} /> New Bulk Return
                    </button>
                </div>

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
                        label="Company"
                        value={filters.company}
                        placeholder="Search company..."
                        options={companyOptions}
                        onType={(v) => {
                            setFilters({ ...filters, company: v, companyContact: '' });
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters({ ...filters, company: '', companyContact: '' });
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters({ ...filters, company: o.raw.businessName, companyContact: o.raw.contactNumber || '' });
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
                            <span className="text-sm text-slate-600">Rows: <b className="text-slate-800">{summaryRows.length}</b></span>
                        </div>
                        <button type="button" onClick={() => setIsSummaryOpen((p) => !p)} className="ml-auto h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer">{isSummaryOpen ? 'Hide Details' : 'Show Details'}<FaChevronDown size={10} className={`transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} /></button>
                        {isSelectionMode && (
                            <button type="button" onClick={() => setSelectedIds([])} className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                                Clear Selection
                            </button>
                        )}
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
                                    const approved = item.fromPurchase || (item.status || 'Approved') === 'Approved';
                                    return (
                                        <div
                                            key={item._id || index}
                                            className={`relative rounded-xl border pl-3 pr-2 py-1.5 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${approved ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    aria-label="Select row"
                                                    className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                                <p className="shrink-0 max-w-[55%] font-bold text-[13px] text-brand-700 truncate leading-tight">{item.company}</p>
                                                <span
                                                    className={`shrink-0 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight ${approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                                                >
                                                    {item.fromPurchase ? 'Auto Approved' : approved ? 'Approved' : 'Pending'}
                                                </span>
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
                                                        {item.fromPurchase && (
                                                            <span className="shrink-0 px-1.5 py-px rounded-full bg-brand-50 text-brand-700 text-[9px] font-bold leading-tight">
                                                                From Purchase
                                                            </span>
                                                        )}
                                                    </div>
                                                    {qtyRow('Return', buildLines(item, 'unitQty', 'subQty', 'pcsQty', 'totalPcs'), 'text-orange-600', 'text-brand-700')}
                                                    {qtyRow('Free', buildLines(item, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeTotalQty'), 'text-emerald-600', 'text-emerald-700')}
                                                    <CostBtn item={item} compact />
                                                </div>

                                                {/* Right: checkbox + actions, amount */}
                                                <div className="shrink-0 w-[100px] flex flex-col items-end justify-end gap-1.5">
                                                    <div className="w-full flex flex-col items-end gap-1">
                                                        <div className="text-right [&>div]:mt-0">
                                                            <PaymentCell item={item} />
                                                        </div>
                                                        <div className="w-full rounded-lg bg-orange-50 px-2 py-1 text-right">
                                                            <p className="text-[9px] uppercase font-bold leading-none text-slate-400">Return Amount</p>
                                                            <p className="text-[12.5px] font-extrabold leading-tight mt-0.5 text-orange-600 whitespace-nowrap">
                                                                ৳{Number(item.returnAmount).toFixed(2)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[1150px] text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                                        <tr>
                                            <th className="w-10 px-3 py-3 text-center">
                                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Company</th>
                                            <th className="px-3 py-3">Invoice No</th>
                                            <th className="px-3 py-3">Return Qty</th>
                                            <th className="px-3 py-3">Free Qty</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3">Cost Calc</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentReturns.map((item, index) => {
                                            const sel = selectedIds.includes(item._id);
                                            return (
                                                <tr key={item._id || index} className={`align-middle ${sel ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-600">{item.returnDate || 'N/A'}</td>
                                                    <td className="px-3 py-3 font-bold text-slate-800">{item.company}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium">
                                                        <div>{item.invoiceNo}</div>
                                                        {item.fromPurchase && <div className="mt-0.5"><Pill tone="brand">From Purchase</Pill></div>}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-orange-600 whitespace-nowrap">{renderLines(buildLines(item, 'unitQty', 'subQty', 'pcsQty', 'totalPcs'), 'text-brand-700')}</td>
                                                    <td className="px-3 py-3 font-semibold text-emerald-600 whitespace-nowrap">{renderLines(buildLines(item, 'freeUnitQty', 'freeSubQty', 'freePcsQty', 'freeTotalQty'), 'text-emerald-700')}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-orange-600">৳{Number(item.returnAmount).toFixed(2)}</div>
                                                        <PaymentCell item={item} />
                                                    </td>
                                                    <td className="px-3 py-3">{statusPill(item)}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap"><CostBtn item={item} /></td>
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

            {/* Cost Calculation Modal */}
            {costRow &&
                (() => {
                    const c = calcCost(costRow);
                    const st = costStatus(c.diff);
                    const th = 'py-2.5 px-3';
                    return (
                        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 transition-opacity duration-200 ${costModalShow ? 'opacity-100' : 'opacity-0'}`}>
                            <div className="absolute inset-0 bg-slate-900/50" onClick={closeCostModal} />
                            <div className={`relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden transition-transform duration-200 ${costModalShow ? 'scale-100' : 'scale-95'}`}>
                                <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 bg-slate-50 border-b border-slate-200">
                                    <div className="min-w-0">
                                        <h3 className="text-base font-bold text-slate-800">Cost Calculation</h3>
                                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                                            Invoice: #{costRow.invoiceNo} | {costRow.company} | {costRow.returnDate || 'N/A'}
                                        </p>
                                    </div>
                                    <button type="button" aria-label="Close" onClick={closeCostModal} className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer">
                                        <FaTimes />
                                    </button>
                                </div>

                                <div className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        <div className="rounded-xl border border-brand-100 bg-brand-50 px-3 py-3 text-center">
                                            <div className="text-[10px] font-bold uppercase text-brand-400">Stock Cost</div>
                                            <div className="text-base font-bold text-brand-700">৳{fmt(c.stockTotal)}</div>
                                            <div className="text-[10px] text-brand-400 mt-0.5">Jei invoice theke product ashse</div>
                                        </div>
                                        <div className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-3 text-center">
                                            <div className="text-[10px] font-bold uppercase text-amber-500">Bulk Cost</div>
                                            <div className="text-base font-bold text-amber-700">৳{fmt(c.bulkTotal)}</div>
                                            <div className="text-[10px] text-amber-500 mt-0.5">Bulk return dewar somoy</div>
                                        </div>
                                        <div className={`rounded-xl border px-3 py-3 text-center ${st.card}`}>
                                            <div className={`text-[10px] font-bold uppercase ${st.lbl}`}>{st.label}</div>
                                            <div className={`text-base font-bold ${st.val}`}>৳{fmt(Math.abs(c.diff))}</div>
                                            <div className={`text-[10px] mt-0.5 ${st.sub}`}>{c.diff > 0 ? 'Stock Cost beshi' : c.diff < 0 ? 'Bulk Cost beshi' : 'Soman soman'}</div>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-center">
                                            <div className="text-[10px] font-bold uppercase text-slate-400">Return Amount</div>
                                            <div className="text-base font-bold text-slate-700">৳{fmt(costRow.returnAmount)}</div>
                                            <div className="text-[10px] text-slate-400 mt-0.5">{c.lines.length} product</div>
                                        </div>
                                    </div>

                                    <div className={`rounded-xl border px-4 py-3 text-center text-sm font-bold ${st.box}`}>
                                        Stock ৳{fmt(c.stockTotal)} vs Bulk ৳{fmt(c.bulkTotal)} → ৳{fmt(Math.abs(c.diff))}
                                        <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] ${st.tag}`}>{st.label}</span>
                                    </div>

                                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                                        <table className="w-full min-w-[720px] text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
                                                    <th className={th}>Product</th>
                                                    <th className={`${th} text-center`}>Qty</th>
                                                    <th className={`${th} text-right`}>Stock / pcs</th>
                                                    <th className={`${th} text-right`}>Stock Total</th>
                                                    <th className={`${th} text-right`}>Bulk / pcs</th>
                                                    <th className={`${th} text-right`}>Bulk Total</th>
                                                    <th className={`${th} text-right`}>Difference</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                                                {c.lines.length === 0 ? (
                                                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">Kono product nai</td></tr>
                                                ) : (
                                                    c.lines.map((l, i) => {
                                                        const d = r2(l.stockTotal - l.bulkTotal);
                                                        return (
                                                            <React.Fragment key={i}>
                                                                <tr>
                                                                    <td className="py-3 px-3 font-semibold text-slate-800">{l.name}</td>
                                                                    <td className="py-3 px-3 text-center font-bold text-orange-600 whitespace-nowrap">{fmt(l.qty)} pcs</td>
                                                                    <td className="py-3 px-3 text-right font-bold text-brand-600 whitespace-nowrap">৳{fmt(l.stockPerPcs)}</td>
                                                                    <td className="py-3 px-3 text-right font-bold text-brand-700 whitespace-nowrap">৳{fmt(l.stockTotal)}</td>
                                                                    <td className="py-3 px-3 text-right font-bold text-amber-600 whitespace-nowrap">৳{fmt(l.bulkPerPcs)}</td>
                                                                    <td className="py-3 px-3 text-right font-bold text-amber-700 whitespace-nowrap">৳{fmt(l.bulkTotal)}</td>
                                                                    <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${costStatus(d).val}`}>
                                                                        ৳{fmt(Math.abs(d))}
                                                                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${costStatus(d).tag}`}>{costStatus(d).label}</span>
                                                                    </td>
                                                                </tr>
                                                                {l.batches && l.batches.length > 0 && (
                                                                    <tr className="bg-slate-50/60">
                                                                        <td colSpan={7} className="px-3 py-2">
                                                                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                                                <span className="font-bold text-slate-500 uppercase text-[10px]">Stock source:</span>
                                                                                {l.batches.map((b, bi) => (
                                                                                    <span key={bi} className="px-2 py-0.5 rounded-md border border-brand-100 bg-brand-50 text-brand-700 font-semibold whitespace-nowrap">
                                                                                        #{b.invoiceNo} ({b.batchNo}) · {fmt(b.qty)} pcs × ৳{fmt(b.perPcs)}
                                                                                    </span>
                                                                                ))}
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })
                                                )}
                                            </tbody>
                                            {c.lines.length > 0 && (
                                                <tfoot>
                                                    <tr className="bg-slate-50 font-bold text-[13px]">
                                                        <td className="py-3 px-3 text-slate-700" colSpan={3}>Total</td>
                                                        <td className="py-3 px-3 text-right text-brand-700 whitespace-nowrap">৳{fmt(c.stockTotal)}</td>
                                                        <td className="py-3 px-3"></td>
                                                        <td className="py-3 px-3 text-right text-amber-700 whitespace-nowrap">৳{fmt(c.bulkTotal)}</td>
                                                        <td className={`py-3 px-3 text-right whitespace-nowrap ${st.val}`}>
                                                            ৳{fmt(Math.abs(c.diff))}
                                                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${st.tag}`}>{st.label}</span>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            )}
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

export default PurchaseBulkReturn;