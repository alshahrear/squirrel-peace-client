import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
import { fmt, inputCls, labelCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from './PurchaseUi';

const EXTRA_OPTIONS = ['Free', 'Others Free', 'Purchase Return', 'Bulk Return', 'Damage', 'Previous Pay', 'Previous Get'];

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

const isReceived = (item) => item.receiveStatus === 'Received' || item.receiveStatus === 'Yes';
const hasReturned = (item) =>
    (item.returnHistory || []).some(
        (r) =>
            (Number(r.totalReturnPcs) || 0) > 0 ||
            (Number(r.totalReturnFreeQty) || 0) > 0 ||
            (Number(r.totalReturnFreeItemsQty) || 0) > 0
    );
const hasBulkReturn = (item) => (item.returnItems || []).length > 0;
const hasDamage = (item) => (item.damageItems || []).length > 0;
const hasPrevPay = (item) => Number(item.previousBalanceAmount) > 0 && item.previousBalanceType === 'Due';
const hasPrevGet = (item) => Number(item.previousBalanceAmount) > 0 && item.previousBalanceType === 'Get';
const hasFree = (item) => (item.items || []).some((p) => (Number(p.freeTotalQty ?? p.freeQty) || 0) > 0);
const getDue = (item) => Math.max((Number(item.payableAmount) || 0) - (Number(item.paidAmount) || 0), 0);

const getItemExtras = (item) => {
    const list = [];
    if (hasFree(item)) list.push('Free');
    if ((item.freeItems || []).length > 0) list.push('Others Free');
    if (hasReturned(item)) list.push('Purchase Return');
    if (hasBulkReturn(item)) list.push('Bulk Return');
    if (hasDamage(item)) list.push('Damage');
    if (hasPrevPay(item)) list.push('Previous Pay');
    if (hasPrevGet(item)) list.push('Previous Get');
    return list;
};

const extraTags = (item) => {
    const t = [];
    if ((item.freeItems || []).length > 0) t.push({ label: 'Others Free', tone: 'amber' });
    if (hasReturned(item)) t.push({ label: 'Purchase Return', tone: 'orange' });
    if (hasBulkReturn(item)) t.push({ label: 'Bulk Return', tone: 'orange' });
    if (hasDamage(item)) t.push({ label: 'Damage', tone: 'rose' });
    if (hasPrevPay(item)) t.push({ label: 'Previous Pay', tone: 'rose' });
    if (hasPrevGet(item)) t.push({ label: 'Previous Get', tone: 'brand' });
    if (hasFree(item)) t.push({ label: 'Free - Has', tone: 'green' });
    return t;
};

const MOBILE_TAG = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    orange: 'bg-orange-50 text-orange-700',
    slate: 'bg-slate-100 text-slate-600',
};

const statusLabel = (item) => (isReceived(item) ? 'Received' : 'Not Received');

const ExtraDropdown = ({ tags, compact = false }) => {
    const [open, setOpen] = useState(false);
    const [pos, setPos] = useState({ left: 0, top: 0, bottom: undefined });
    const ref = useRef(null);
    useEffect(() => {
        if (!open) return;
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        const close = () => setOpen(false);
        document.addEventListener('mousedown', h);
        document.addEventListener('touchstart', h);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', h);
            document.removeEventListener('touchstart', h);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [open]);

    if (tags.length === 0) return <span className="text-xs text-slate-300">N/A</span>;

    return (
        <div className="relative inline-block" ref={ref}>
            <button
                type="button"
                onClick={(e) => {
                    if (!open) {
                        const r = e.currentTarget.getBoundingClientRect();
                        const h = tags.length * 34 + 16;
                        const up = r.bottom + h > window.innerHeight;
                        setPos({
                            left: Math.max(8, Math.min(r.left, window.innerWidth - 230)),
                            top: up ? undefined : r.bottom + 4,
                            bottom: up ? window.innerHeight - r.top + 4 : undefined,
                        });
                    }
                    setOpen((p) => !p);
                }}
                className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer ${compact ? 'px-2 py-0.5 text-[9px]' : 'px-2.5 py-1 text-xs'}`}
            >
                Extra
                <span className={`rounded-full bg-brand-50 text-brand-700 font-bold ${compact ? 'px-1 text-[8px]' : 'px-1.5 text-[10px]'}`}>{tags.length}</span>
                <FaChevronDown size={compact ? 7 : 9} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && (
                <div
                    style={{ position: 'fixed', left: pos.left, top: pos.top, bottom: pos.bottom }}
                    className="z-[100] min-w-[150px] max-w-[220px] bg-white rounded-xl border border-slate-200 shadow-lg p-2 flex flex-col gap-1.5"
                >
                    {tags.map((t) => (
                        <Pill key={t.label} tone={t.tone}>{t.label}</Pill>
                    ))}
                </div>
            )}
        </div>
    );
};

const renderPaid = (item) => {
    if ((Number(item.payableAmount) || 0) <= 0) return <Pill tone="slate">No Bill</Pill>;
    if (!isReceived(item) || !item.paidAmount) return <Pill tone="rose">Not Paid</Pill>;
    return (
        <span className="font-bold text-sm">
            <span className="text-emerald-600">৳{item.paidAmount}</span>
            <span className="text-rose-600"> ({getDue(item)})</span>
        </span>
    );
};

const Purchase = () => {
    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const pAll = useCan('purchase_all');
    const pAdd = useCan('purchase_add');
    const pRet = useCan('purchase_return');

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));
    const denyMsg = (what) => showToast(`আপনার ${what} করার অনুমতি নেই!`, 'error');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        company: '',
        invoiceNo: '',
        status: '',
        dueStatus: '',
        companyContact: '',
    });

    const [selectedIds, setSelectedIds] = useState([]);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const [multiReturnEnabled, setMultiReturnEnabled] = useState(false);
    useEffect(() => {
        fetch('http://localhost:5000/feature')
            .then((res) => res.json())
            .then((data) => setMultiReturnEnabled(data?.purchaseMultiReturn === true))
            .catch(() => setMultiReturnEnabled(false));
    }, [location.pathname]);

    const [extraFilter, setExtraFilter] = useState([...EXTRA_OPTIONS]);
    const [isExtraOpen, setIsExtraOpen] = useState(false);
    const extraRef = useRef(null);
    useEffect(() => {
        const h = (e) => {
            if (extraRef.current && !extraRef.current.contains(e.target)) setIsExtraOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const fetchPurchases = async () => {
        try {
            const response = await fetch('http://localhost:5000/purchase');
            const data = await response.json();
            setPurchases([...data].reverse());
        } catch (error) {
            console.error('Error fetching purchases:', error);
            showToast('Failed to load purchases!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const [soldPurchaseIds, setSoldPurchaseIds] = useState(new Set());
    useEffect(() => {
        const loadSold = async () => {
            try {
                const safeJson = (url) =>
                    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);
                const [stock, sales, bulks, damages, salesBulks, adjustments] = await Promise.all([
                    safeJson('http://localhost:5000/stock-purchase'),
                    safeJson('http://localhost:5000/sales'),
                    safeJson('http://localhost:5000/purchase-bulk-return'),
                    safeJson('http://localhost:5000/sales-damage'),
                    safeJson('http://localhost:5000/sales-bulk-return'),
                    safeJson('http://localhost:5000/stock-adjustment'),
                ]);
                const batchToPurchase = new Map(stock.map((b) => [String(b._id), String(b.purchaseId)]));
                const ids = new Set();
                const mark = (list) =>
                    list.forEach((r) => {
                        (r.stockAllocations || []).forEach((a) => {
                            const pid = batchToPurchase.get(String(a.batchId));
                            if (pid && (Number(a.qty) || 0) > 0) ids.add(pid);
                        });
                    });
                mark(sales);
                mark(bulks);
                mark(salesBulks);
                mark(damages);
                mark(adjustments);
                setSoldPurchaseIds(ids);
            } catch (error) {
                console.error('Error checking sold purchases:', error);
            }
        };
        loadSold();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    useEffect(() => {
        fetchPurchases();
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const companyOptions = companies
        .filter((comp) => {
            const s = filters.company.toLowerCase();
            return comp.businessName?.toLowerCase().includes(s) || comp.contactNumber?.toLowerCase().includes(s);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', company: '', invoiceNo: '', status: '', dueStatus: '', companyContact: '' });
        setExtraFilter([...EXTRA_OPTIONS]);
        setIsExtraOpen(false);
        setCurrentPage(1);
    };

    const handleToggleExtra = (opt) => {
        setExtraFilter((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
        setCurrentPage(1);
    };

    const handleEdit = (item) => {
        if (!pAll.canEdit) return denyMsg('Edit');
        navigate('/add-purchase', { state: { purchase: item } });
    };
    const handleEditOrder = (item) => {
        if (!pAll.canEdit) return denyMsg('Edit');
        navigate('/add-purchase', { state: { purchase: item, mode: 'orderEdit' } });
    };
    const handleEditReceived = (item) => {
        if (!pAll.canEdit) return denyMsg('Edit');
        navigate('/add-purchase', { state: { purchase: item } });
    };
    const handleViewDetails = (id) => navigate(`/purchase-details/${id}`);
    const handleReturn = (id) => {
        if (!pRet.canAdd) return denyMsg('Return');
        navigate(`/purchase-return-details/${id}`);
    };
    const handleReceive = (item) => {
        if (!pAll.canEdit) return denyMsg('Edit');
        navigate('/add-purchase', { state: { purchase: item, mode: 'receive' } });
    };

    const handleDelete = async (id) => {
        if (!pAll.canDelete) return denyMsg('Delete');
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
                    const response = await fetch(`http://localhost:5000/purchase/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        showToast('Purchase deleted successfully!', 'success');
                        setPurchases((prev) => prev.filter((item) => item._id !== id));
                    } else {
                        showToast('Failed to delete purchase!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting purchase:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    const menuItems = (item) => {
        const rec = isReceived(item);
        const editable = !soldPurchaseIds.has(String(item._id)) && (item.returnHistory || []).length === 0;
        return [
            { label: 'View Details', onClick: () => handleViewDetails(item._id) },
            {
                label: 'Return',
                tone: 'warn',
                hidden: !(rec && (multiReturnEnabled || (item.returnHistory || []).length === 0)),
                onClick: () => handleReturn(item._id),
            },
            { label: 'Receive', tone: 'success', hidden: rec, onClick: () => handleReceive(item) },
            { label: 'Edit', tone: 'brand', hidden: !(editable && !rec), onClick: () => handleEdit(item) },
            { label: 'Purchase Edit', tone: 'brand', hidden: !(editable && rec), onClick: () => handleEditOrder(item) },
            { label: 'Receive Edit', tone: 'success', hidden: !(editable && rec), onClick: () => handleEditReceived(item) },
            { label: 'Delete', tone: 'danger', onClick: () => handleDelete(item._id) },
        ];
    };

    const filteredPurchases = purchases.filter((item) => {
        if (filters.startDate || filters.endDate) {
            const purchaseDateObj = parseToLocalDate(item.purchaseDate);
            if (!purchaseDateObj) return false;
            if (filters.startDate) {
                const s = parseToLocalDate(filters.startDate);
                if (s && purchaseDateObj < s) return false;
            }
            if (filters.endDate) {
                const e = parseToLocalDate(filters.endDate);
                if (e && purchaseDateObj > e) return false;
            }
        }
        if (filters.company && !item.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.companyContact && item.companyContact && item.companyContact !== filters.companyContact) return false;
        if (filters.invoiceNo && !item.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.status === 'Received' && !isReceived(item)) return false;
        if (filters.status === 'No' && isReceived(item)) return false;
        const dueAmt = getDue(item);
        const receivedNow = isReceived(item);
        if (filters.dueStatus === 'Due' && (!receivedNow || dueAmt <= 0)) return false;
        if (filters.dueStatus === 'NoDue' && (!receivedNow || !item.paidAmount || dueAmt > 0)) return false;
        if (extraFilter.length !== EXTRA_OPTIONS.length) {
            if (extraFilter.length === 0) return false;
            const itemExtras = getItemExtras(item);
            if (!extraFilter.some((opt) => itemExtras.includes(opt))) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredPurchases.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentPurchases = filteredPurchases.slice(indexOfFirstItem, indexOfLastItem);

    const isAllSelected = currentPurchases.length > 0 && currentPurchases.every((i) => selectedIds.includes(i._id));
    const handleSelectAll = () => {
        const ids = currentPurchases.map((i) => i._id);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };
    const handleSelectRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const selectedRows = filteredPurchases.filter((i) => selectedIds.includes(i._id));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredPurchases;

    const totalPayable = summaryRows.reduce((s, i) => s + (Number(i.payableAmount) || 0), 0);
    const totalPaid = summaryRows.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const totalDue = summaryRows.reduce((s, i) => s + getDue(i), 0);
    const totalMainFreeQty = summaryRows.reduce(
        (s, i) => s + (i.items || []).reduce((ss, it) => ss + (Number(it.freeTotalQty ?? it.freeQty) || 0), 0),
        0
    );
    const totalMainQty = summaryRows.reduce(
        (s, i) => s + (i.items || []).reduce((ss, it) => ss + (Number(it.totalPcs ?? it.totalQty) || 0), 0),
        0
    );
    const totalOthersFreeQty = summaryRows.reduce(
        (s, i) => s + (i.freeItems || []).reduce((ss, it) => ss + (Number(it.totalQty) || 0), 0),
        0
    );
    const sumRet = (rows, field) =>
        rows.reduce((s, i) => s + (i.returnHistory || []).reduce((ss, r) => ss + (Number(r[field]) || 0), 0), 0);
    const retMainQty = sumRet(summaryRows, 'totalReturnPcs');
    const retMainFree = sumRet(summaryRows, 'totalReturnFreeQty');
    const retMainAmount = sumRet(summaryRows, 'totalReturnAmount');
    const retOthersQty = sumRet(summaryRows, 'totalReturnFreeItemsQty');

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const activeCount =
        ['startDate', 'endDate', 'company', 'invoiceNo', 'status', 'dueStatus'].filter((k) => filters[k]).length +
        (extraFilter.length !== EXTRA_OPTIONS.length ? 1 : 0);

    const Line = ({ label, value, cls = 'text-slate-800' }) => (
        <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-slate-500">{label}</span>
            <b className={cls}>{value}</b>
        </div>
    );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Purchase Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage and track all purchase orders and records</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (pAdd.canAdd ? navigate('/add-purchase') : denyMsg('Add'))}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                        <FaPlus size={12} /> New Purchase
                    </button>
                </div>

                {/* Filter */}
                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-4 xl:grid-cols-7">
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
                    <div>
                        <label className={labelCls}>Receive Status</label>
                        <select name="status" value={filters.status} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                            <option value="">All</option>
                            <option value="Received">Received</option>
                            <option value="No">Not Received</option>
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Due Status</label>
                        <select name="dueStatus" value={filters.dueStatus} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                            <option value="">All</option>
                            <option value="Due">Has Due</option>
                            <option value="NoDue">Fully Paid</option>
                        </select>
                    </div>
                    <div className="relative" ref={extraRef}>
                        <span className={labelCls}>Extra</span>
                        <button
                            type="button"
                            onClick={() => setIsExtraOpen((p) => !p)}
                            className={`${inputCls} flex items-center justify-between gap-2 text-left cursor-pointer`}
                        >
                            <span className="truncate">
                                {extraFilter.length === EXTRA_OPTIONS.length ? 'All' : extraFilter.length === 0 ? 'None' : extraFilter.join(', ')}
                            </span>
                            <FaChevronDown size={10} className={`shrink-0 transition-transform ${isExtraOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isExtraOpen && (
                            <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg py-1">
                                {EXTRA_OPTIONS.map((opt) => (
                                    <label key={opt} className="flex items-center gap-2.5 px-3 h-10 hover:bg-brand-50 cursor-pointer text-sm font-medium text-slate-700">
                                        <input type="checkbox" checked={extraFilter.includes(opt)} onChange={() => handleToggleExtra(opt)} className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                        {opt}
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                </FilterPanel>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
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

                    {isSummaryOpen && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-3 py-1.5 bg-brand-50 text-brand-700 text-[11px] font-bold uppercase tracking-wide">Main Product</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2">
                                    <div className="p-3 space-y-1.5">
                                        <Line label="Total Qty" value={fmt(totalMainQty)} cls="text-brand-700" />
                                        <Line label="Total Amount" value={`৳${fmt(totalPayable)}`} cls="text-brand-700" />
                                        <Line label="Paid Amount" value={`৳${fmt(totalPaid)}`} cls="text-emerald-600" />
                                        <Line label="Due Amount" value={`৳${fmt(totalDue)}`} cls="text-rose-600" />
                                        <Line label="Free Qty" value={fmt(totalMainFreeQty)} cls="text-emerald-600" />
                                    </div>
                                    <div className="p-3 space-y-1.5 bg-orange-50/60 border-t sm:border-t-0 sm:border-l border-dashed border-orange-200">
                                        <p className="text-[10px] font-bold uppercase text-orange-600">↩ Returned</p>
                                        <Line label="Qty" value={fmt(retMainQty)} cls="text-orange-600" />
                                        <Line label="Free Qty" value={fmt(retMainFree)} cls="text-emerald-600" />
                                        <Line label="Amount" value={`৳${fmt(retMainAmount)}`} cls="text-orange-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-3 py-1.5 bg-amber-50 text-amber-700 text-[11px] font-bold uppercase tracking-wide">Others Free</div>
                                <div className="grid grid-cols-1 sm:grid-cols-2">
                                    <div className="p-3 space-y-1.5">
                                        <Line label="Order Qty" value={fmt(totalOthersFreeQty)} cls="text-amber-600" />
                                    </div>
                                    <div className="p-3 space-y-1.5 bg-orange-50/60 border-t sm:border-t-0 sm:border-l border-dashed border-orange-200">
                                        <p className="text-[10px] font-bold uppercase text-orange-600">↩ Returned</p>
                                        <Line label="Qty" value={fmt(retOthersQty)} cls="text-orange-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    {loading ? (
                        <ListSkeleton />
                    ) : filteredPurchases.length === 0 ? (
                        <Empty text="No purchases found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentPurchases.map((item, index) => {
                                    const sel = selectedIds.includes(item._id);
                                    const tags = extraTags(item);
                                    const rec = isReceived(item);
                                    return (
                                        <div
                                            key={item._id || index}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${rec ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    aria-label="Select row"
                                                    className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                                <p className="shrink-0 max-w-[68%] font-bold text-[13px] text-brand-700 truncate leading-tight">{item.company}</p>
                                                <span className="ml-auto min-w-[28px] truncate text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight">
                                                    #{item.invoiceNo}
                                                </span>
                                                <RowMenu compact items={menuItems(item)} />
                                            </div>
                                            <div className="flex items-stretch gap-2">
                                                {/* Left: info */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <p className="text-[10.5px] text-slate-500 leading-snug truncate min-w-0">
                                                            <span className="uppercase text-slate-400 text-[9px]">Purchase: </span>
                                                            <span className="font-normal">{item.purchaseDate || 'N/A'}</span>
                                                        </p>
                                                    </div>
                                                    <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                        <span className="uppercase text-slate-400 text-[9px]">Received: </span>
                                                        <span className="font-normal">{item.receiveDate || <span className="text-amber-600 font-normal">Not Received</span>}</span>
                                                    </p>
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {tags.length > 0 && <ExtraDropdown tags={tags} compact />}
                                                        <span
                                                            className={`shrink-0 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight ${rec ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
                                                        >
                                                            {statusLabel(item)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Right: checkbox + actions, total, paid */}
                                                <div className="shrink-0 w-[116px] flex flex-col items-end justify-end gap-1.5">

                                                    <div className="w-full space-y-px">
                                                        <div className="flex items-center justify-between rounded-md bg-brand-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-brand-400">TOTAL</span>
                                                            <span className="text-[11px] font-bold text-brand-700">৳{item.payableAmount}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-md bg-slate-50 px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-slate-400">PAID</span>
                                                            <span className="text-[10.5px]">{renderPaid(item)}</span>
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
                                <table className="w-full min-w-[980px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="w-10 px-3 py-3 text-center">
                                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Company</th>
                                            <th className="px-3 py-3">Invoice No</th>
                                            <th className="px-3 py-3">Total</th>
                                            <th className="px-3 py-3">Paid (Due)</th>
                                            <th className="px-3 py-3">Extra</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentPurchases.map((item, index) => {
                                            const sel = selectedIds.includes(item._id);
                                            const tags = extraTags(item);
                                            return (
                                                <tr key={item._id || index} className={`align-middle ${sel ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                                        <div className="font-medium text-slate-700">Purchase: {item.purchaseDate || 'N/A'}</div>
                                                        <div className="mt-1">
                                                            {item.receiveDate ? <span className="text-slate-500">Received: {item.receiveDate}</span> : <Pill tone="amber">Not Received</Pill>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 font-bold text-slate-800">{item.company}</td>
                                                    <td className="px-3 py-3 font-medium whitespace-nowrap">{item.invoiceNo}</td>
                                                    <td className="px-3 py-3 font-bold text-brand-700 whitespace-nowrap">৳{item.payableAmount}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{renderPaid(item)}</td>
                                                    <td className="px-3 py-3">
                                                        <ExtraDropdown tags={tags} />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Pill tone={isReceived(item) ? 'green' : 'slate'}>{statusLabel(item)}</Pill>
                                                    </td>
                                                    <td className="px-3 py-3 text-center">
                                                        <RowMenu items={menuItems(item)} />
                                                    </td>
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
                                to={Math.min(indexOfLastItem, filteredPurchases.length)}
                                total={filteredPurchases.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Purchase;