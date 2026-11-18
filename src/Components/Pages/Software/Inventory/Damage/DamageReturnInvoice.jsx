import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import useCan from '../../../../../hooks/useCan';
import { DateInput } from '../../Product/ProductUi';
import { fmt, inputCls, labelCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from '../../Purchase/PurchaseUi';

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

// Stock Cost beshi = Loss, Return Amount beshi = Profit
const costStatus = (d) =>
    d > 0
        ? { label: 'Loss', box: 'bg-rose-50 border-rose-200 text-rose-700', card: 'bg-rose-50 border-rose-100', lbl: 'text-rose-400', val: 'text-rose-600', sub: 'text-rose-500', tag: 'bg-rose-500 text-white' }
        : d < 0
            ? { label: 'Profit', box: 'bg-emerald-50 border-emerald-200 text-emerald-700', card: 'bg-emerald-50 border-emerald-100', lbl: 'text-emerald-400', val: 'text-emerald-600', sub: 'text-emerald-500', tag: 'bg-emerald-500 text-white' }
            : { label: 'Even', box: 'bg-slate-50 border-slate-200 text-slate-600', card: 'bg-slate-50 border-slate-100', lbl: 'text-slate-400', val: 'text-slate-600', sub: 'text-slate-500', tag: 'bg-slate-400 text-white' };

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

const getAmount = (item) =>
    Number(item.damageAmount) ||
    (item.items || []).reduce((s, it) => s + (Number(it.itemTotal ?? it.subtotal) || 0), 0);

const DamageReturnInvoice = () => {
    const { canEdit, canDelete } = useCan('damage_return_invoice');
    const [returns, setReturns] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const focusEvent = location.state?.focusEvent || null;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [selectedIds, setSelectedIds] = useState([]);
    const [highlightId, setHighlightId] = useState(null);
    const [costRow, setCostRow] = useState(null);
    const [costModalShow, setCostModalShow] = useState(false);

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));

    const openCostModal = (row) => {
        setCostRow(row);
        setTimeout(() => setCostModalShow(true), 10);
    };
    const closeCostModal = () => {
        setCostModalShow(false);
        setTimeout(() => setCostRow(null), 250);
    };

    const EMPTY_FILTERS = { startDate: '', endDate: '', company: '', companyContact: '', invoiceNo: '', status: '' };
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };

    useEffect(() => {
        fetch('http://localhost:5000/company')
            .then((res) => res.json())
            .then((d) => setCompanies(Array.isArray(d) ? d : []))
            .catch(() => setCompanies([]));
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('http://localhost:5000/damage-return').then((res) => res.json()).catch(() => []),
            fetch('http://localhost:5000/purchase').then((res) => res.json()).catch(() => []),
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

    const has = (val, q) => (val || '').toString().toLowerCase().includes(q.toLowerCase());

    const phoneOf = (item) =>
        item.companyContact ||
        companies.find((c) => (c.businessName || '').trim().toLowerCase() === (item.company || '').trim().toLowerCase())?.contactNumber ||
        '';

    const isApprovedItem = (item) =>
        item.isFromPurchase
            ? Number(item.damageAdjustmentAmount) > 0 || item.damageStatus === 'Approved'
            : item.status === 'Approved';

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
        if (filters.companyContact && item.companyContact && item.companyContact !== filters.companyContact) return false;
        if (filters.invoiceNo && !has(item.invoiceNo, filters.invoiceNo)) return false;
        if (filters.status) {
            const ok = isApprovedItem(item);
            if (filters.status === 'Approved' && !ok) return false;
            if (filters.status === 'Pending' && ok) return false;
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
            const els = [
                document.getElementById(`dmgret-row-${highlightId}`),
                document.getElementById(`dmgret-card-${highlightId}`),
            ].filter(Boolean);
            const el = els.find((x) => x.offsetParent !== null) || els[0];
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

    const selectedRows = filteredReturns.filter((i) => selectedIds.includes(i._id));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredReturns;
    const grandAmount = summaryRows.reduce((s, i) => s + getAmount(i), 0);

    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredReturns.slice(indexOfFirstItem, indexOfLastItem);

    const isAllSelected = currentItems.length > 0 && currentItems.every((i) => selectedIds.includes(i._id));

    const handleSelectAll = () => {
        const ids = currentItems.map((i) => i._id);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };

    const handleSelectRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const handleViewDetails = (id) => {
        const target = returns.find((r) => r._id === id);
        if (target?.isFromPurchase) {
            navigate(`/purchase-details/${id}`, { state: { scrollTo: 'damage-products-section' } });
            return;
        }
        navigate(`/damage-return-details/${id}`);
    };

    const handleEdit = (item) => {
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        if (item.isFromPurchase) {
            const { isFromPurchase: _a, returnDate: _b, items: _c, ...original } = item;
            navigate('/add-purchase', { state: { purchase: original } });
            return;
        }
        navigate('/damage-return-add', { state: { damageReturn: item } });
    };

    const handleDelete = (item) => {
        if (!canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        if (item.isFromPurchase) {
            Swal.fire({
                title: 'Are you sure?',
                text: 'এই invoice এর সব Damage Product মুছে যাবে!',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4a58e6',
                cancelButtonColor: '#e11d48',
                confirmButtonText: 'Yes, delete it!',
            }).then(async (result) => {
                if (!result.isConfirmed) return;
                try {
                    const damageAdj = Number(item.damageAdjustmentAmount) || 0;
                    const newPayable = Math.round(((Number(item.payableAmount) || 0) + damageAdj) * 100) / 100;
                    const res = await fetch(`http://localhost:5000/purchase/${item._id}`, {
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
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const delRes = await fetch(`http://localhost:5000/damage-return/${item._id}`, { method: 'DELETE' });
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
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        Swal.fire({
            title: 'Approve this damage return?',
            text: 'Approve korle status Approved hoye jabe!',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, approve it!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const approveUrl = item.isFromPurchase
                    ? `http://localhost:5000/purchase/${item._id}`
                    : `http://localhost:5000/damage-return/${item._id}`;
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

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const menuItems = (item) => {
        const autoAdj = item.isFromPurchase && Number(item.damageAdjustmentAmount) > 0;
        const approved = (item.isFromPurchase ? item.damageStatus : item.status) === 'Approved';
        return [
            { label: 'View', onClick: () => handleViewDetails(item._id) },
            { label: 'Approval', tone: 'success', hidden: autoAdj || approved, onClick: () => handleApprove(item) },
            { label: 'Edit', tone: 'brand', onClick: () => handleEdit(item) },
            { label: 'Delete', tone: 'danger', onClick: () => handleDelete(item) },
        ];
    };

    const renderStatus = (item) => {
        if (item.isFromPurchase && Number(item.damageAdjustmentAmount) > 0) return <Pill tone="emerald">Auto Approved (Adjusted)</Pill>;
        if ((item.isFromPurchase ? item.damageStatus : item.status) === 'Approved') return <Pill tone="emerald">Approved</Pill>;
        return <Pill tone="amber">Pending</Pill>;
    };

    const renderAmount = (item) => (
        <div className="space-y-0.5">
            <div className="font-bold text-rose-600">৳{getAmount(item).toFixed(2)}</div>
            {!item.isFromPurchase &&
                (item.payment ? (
                    <div className="text-[11px] font-bold">
                        <span className="text-emerald-600">Received: ৳{fmt(item.payment.amount)}</span>
                        <span className="text-rose-600 ml-1">
                            (Due: {fmt(Math.max(getAmount(item) - (Number(item.payment.amount) || 0), 0))})
                        </span>
                    </div>
                ) : (
                    <Pill tone="slate">Not Received</Pill>
                ))}
        </div>
    );

    const renderCost = (item) => {
        const cost = calcCost(item);
        if (!cost.hasData) return <span className="text-slate-300">—</span>;
        const st = costStatus(cost.diff);
        return (
            <button type="button" onClick={() => openCostModal(item)} className="inline-flex items-center gap-1.5 cursor-pointer">
                <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-extrabold ${st.box}`}>
                    {fmt(Math.abs(cost.diff))}
                    <span className={`ml-1 px-1.5 rounded-full text-[9px] ${st.tag}`}>{st.label}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-brand-50 border border-brand-200 text-brand-700 text-[10px] font-bold">
                    🧮 Details
                </span>
            </button>
        );
    };

    const activeCount = ['startDate', 'endDate', 'company', 'invoiceNo', 'status'].filter((k) => filters[k]).length;

    const companyOptions = companies
        .filter((c) => {
            const s = (filters.company || '').toLowerCase();
            return (c.businessName || '').toLowerCase().includes(s) || (c.contactNumber || '').toLowerCase().includes(s);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const modalCost = costRow ? calcCost(costRow) : null;
    const modalSt = modalCost ? costStatus(modalCost.diff) : null;
    const th = 'py-2.5 px-3';

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Damage Return Invoice</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Damage products returned to company</p>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-rose-50 border border-rose-100 text-center sm:text-right">
                        <div className="text-[10px] font-bold uppercase text-rose-400">
                            {isSelectionMode ? 'Selected Total Amount' : 'Total Amount'}
                        </div>
                        <div className="text-lg font-extrabold text-rose-600">
                            ৳{grandAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>

                {/* Filter */}
                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-5">
                    <div>
                        <span className={labelCls}>Start Date</span>
                        <DateInput name="startDate" value={filters.startDate} onChange={(e) => setFilter(e.target.name, e.target.value)} placeholder="Start date" />
                    </div>
                    <div>
                        <span className={labelCls}>End Date</span>
                        <DateInput name="endDate" value={filters.endDate} onChange={(e) => setFilter(e.target.name, e.target.value)} placeholder="End date" />
                    </div>
                    <ComboField
                        label="Company"
                        value={filters.company}
                        placeholder="Search or select company..."
                        options={companyOptions}
                        onType={(v) => {
                            setFilters((prev) => ({ ...prev, company: v, companyContact: '' }));
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters((prev) => ({ ...prev, company: '', companyContact: '' }));
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters((prev) => ({ ...prev, company: o.raw.businessName, companyContact: o.raw.contactNumber || '' }));
                            setCurrentPage(1);
                        }}
                    />
                    <div>
                        <label className={labelCls}>Invoice No</label>
                        <input type="text" placeholder="Search invoice..." value={filters.invoiceNo} onChange={(e) => setFilter('invoiceNo', e.target.value)} className={inputCls} />
                    </div>
                    <div>
                        <label className={labelCls}>Status</label>
                        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={`${inputCls} cursor-pointer`}>
                            <option value="">All</option>
                            <option value="Approved">Approved</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>
                </FilterPanel>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 sm:px-0">
                        <div className="flex items-center gap-2">
                            <Pill tone={isSelectionMode ? 'rose' : 'brand'}>{isSelectionMode ? 'Selected' : 'Showing'}</Pill>
                            <span className="text-sm text-slate-600">
                                Rows: <b className="text-slate-800">{isSelectionMode ? selectedRows.length : filteredReturns.length}</b>
                            </span>
                        </div>
                        {isSelectionMode && (
                            <button type="button" onClick={() => setSelectedIds([])} className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {loading ? (
                        <ListSkeleton />
                    ) : filteredReturns.length === 0 ? (
                        <Empty text="No damage return found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentItems.map((item, index) => {
                                    const sel = selectedIds.includes(item._id);
                                    const hl = highlightId === String(item._id);
                                    const phone = phoneOf(item);
                                    return (
                                        <div
                                            key={item._id || index}
                                            id={`dmgret-card-${item._id}`}
                                            data-hl={hl ? '1' : undefined}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${hl ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${item.isFromPurchase ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer" />
                                                <p className="min-w-0 font-bold text-[13px] text-brand-700 truncate leading-tight">{item.company || 'N/A'}</p>
                                                <span className="ml-auto shrink-0 max-w-[40%] truncate text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight">
                                                    #{item.invoiceNo}
                                                </span>
                                                <RowMenu compact items={menuItems(item)} />
                                            </div>
                                            <div className="flex items-stretch gap-2">
                                                <div className="min-w-0 flex-1 space-y-0.5 text-[10.5px] text-slate-500 leading-snug">
                                                    <p className="truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Date: </span>{item.returnDate || 'N/A'}
                                                        {item.isFromPurchase && (
                                                            <span className="ml-1 px-1.5 py-px rounded-full bg-emerald-50 text-emerald-700 text-[9px] font-bold">From Purchase</span>
                                                        )}
                                                    </p>
                                                    {phone && <p className="truncate">📞 {phone}</p>}
                                                    <div className="pt-0.5">{renderStatus(item)}</div>
                                                    <div className="pt-0.5">{renderCost(item)}</div>
                                                </div>
                                                <div className="shrink-0 w-[118px] flex flex-col items-end justify-end text-right text-[11px]">
                                                    <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Return Amount</p>
                                                    {renderAmount(item)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[1000px] text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                                        <tr>
                                            <th className="w-10 px-3 py-3 text-center">
                                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Company</th>
                                            <th className="px-3 py-3">Invoice</th>
                                            <th className="px-3 py-3">Return Amount</th>
                                            <th className="px-3 py-3">Cost Calculation</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentItems.map((item, index) => {
                                            const sel = selectedIds.includes(item._id);
                                            const hl = highlightId === String(item._id);
                                            const phone = phoneOf(item);
                                            return (
                                                <tr
                                                    key={item._id || index}
                                                    id={`dmgret-row-${item._id}`}
                                                    data-hl={hl ? '1' : undefined}
                                                    className={`align-middle ${hl ? 'bg-amber-100 ring-2 ring-inset ring-amber-400' : sel ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-600">{item.returnDate || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{item.company || 'N/A'}</div>
                                                        {phone && <div className="text-[10px] text-slate-400 mt-0.5">📞 {phone}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium">
                                                        <div>{item.invoiceNo}</div>
                                                        {item.isFromPurchase && <div className="mt-0.5"><Pill tone="emerald">From Purchase</Pill></div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{renderAmount(item)}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{renderCost(item)}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{renderStatus(item)}</td>
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

            {/* ---------- Cost Calculation Modal ---------- */}
            {costRow && modalCost && (
                <div className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 transition-opacity duration-200 ${costModalShow ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-slate-900/50" onClick={closeCostModal} />
                    <div className={`relative w-full max-w-4xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all duration-200 ease-out ${costModalShow ? 'translate-y-0 sm:scale-100' : 'translate-y-6 sm:scale-95'}`}>
                        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-brand-600 text-white">
                            <div className="min-w-0">
                                <h3 className="text-base font-extrabold">🧮 Cost Calculation</h3>
                                <p className="text-[11px] text-white/80 mt-0.5 truncate">
                                    #{costRow.invoiceNo} | {costRow.company} | {costRow.returnDate || 'N/A'}
                                </p>
                            </div>
                            <button type="button" aria-label="Close" onClick={closeCostModal} className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer">✕</button>
                        </div>

                        <div className="p-3 sm:p-5 space-y-4 max-h-[78vh] overflow-y-auto">
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-3">
                                <div className="rounded-xl border border-violet-100 bg-violet-50 px-1.5 sm:px-3 py-2 sm:py-3 text-center min-w-0">
                                    <div className="text-[9px] sm:text-[10px] font-bold uppercase text-violet-400 truncate">Stock Cost</div>
                                    <div className="text-[13px] sm:text-base font-extrabold text-violet-700 truncate">৳{fmt(modalCost.stockTotal)}</div>
                                    <div className="hidden sm:block text-[10px] text-violet-400 mt-0.5">Damage stock er source cost</div>
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50 px-1.5 sm:px-3 py-2 sm:py-3 text-center min-w-0">
                                    <div className="text-[9px] sm:text-[10px] font-bold uppercase text-amber-500 truncate">Return Amount</div>
                                    <div className="text-[13px] sm:text-base font-extrabold text-amber-700 truncate">৳{fmt(modalCost.retTotal)}</div>
                                    <div className="hidden sm:block text-[10px] text-amber-500 mt-0.5">Company k return dewar somoy</div>
                                </div>
                                <div className={`rounded-xl border px-1.5 sm:px-3 py-2 sm:py-3 text-center min-w-0 ${modalSt.card}`}>
                                    <div className={`text-[9px] sm:text-[10px] font-bold uppercase truncate ${modalSt.lbl}`}>{modalSt.label}</div>
                                    <div className={`text-[13px] sm:text-base font-extrabold truncate ${modalSt.val}`}>৳{fmt(Math.abs(modalCost.diff))}</div>
                                    <div className={`hidden sm:block text-[10px] mt-0.5 ${modalSt.sub}`}>
                                        {modalCost.diff > 0 ? 'Stock Cost beshi' : modalCost.diff < 0 ? 'Return Amount beshi' : 'Soman soman'}
                                    </div>
                                </div>
                            </div>

                            <div className={`rounded-xl border px-3 py-3 text-center text-[13px] sm:text-sm font-extrabold ${modalSt.box}`}>
                                Stock ৳{fmt(modalCost.stockTotal)} vs Return ৳{fmt(modalCost.retTotal)} → ৳{fmt(Math.abs(modalCost.diff))}
                                <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] ${modalSt.tag}`}>{modalSt.label}</span>
                            </div>

                            {/* Mobile product cards */}
                            <div className="md:hidden space-y-2">
                                {modalCost.lines.map((l, i) => {
                                    const d = r2(l.stockTotal - l.retTotal);
                                    const ds = costStatus(d);
                                    return (
                                        <div key={i} className="rounded-xl border border-slate-200 p-3 bg-white">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-bold text-slate-800 text-sm min-w-0">{l.name}</p>
                                                <span className="shrink-0 text-xs font-bold text-orange-600">{fmt(l.qty)} pcs</span>
                                            </div>
                                            <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                                                <div className="rounded-lg bg-violet-50 px-2 py-1.5">
                                                    <p className="text-[9px] uppercase font-bold text-violet-400">Stock / pcs</p>
                                                    <p className="font-bold text-violet-700">৳{fmt(l.stockPerPcs)}</p>
                                                </div>
                                                <div className="rounded-lg bg-violet-50 px-2 py-1.5">
                                                    <p className="text-[9px] uppercase font-bold text-violet-400">Stock Total</p>
                                                    <p className="font-bold text-violet-700">৳{fmt(l.stockTotal)}</p>
                                                </div>
                                                <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                                                    <p className="text-[9px] uppercase font-bold text-amber-500">Return / pcs</p>
                                                    <p className="font-bold text-amber-700">৳{fmt(l.retPerPcs)}</p>
                                                </div>
                                                <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                                                    <p className="text-[9px] uppercase font-bold text-amber-500">Return Total</p>
                                                    <p className="font-bold text-amber-700">৳{fmt(l.retTotal)}</p>
                                                </div>
                                            </div>
                                            <div className={`mt-1.5 rounded-lg border px-2 py-1.5 flex items-center justify-between text-[12px] font-extrabold ${ds.box}`}>
                                                <span>Difference</span>
                                                <span>
                                                    ৳{fmt(Math.abs(d))}
                                                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${ds.tag}`}>{ds.label}</span>
                                                </span>
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                                                <span className="font-bold text-slate-400 uppercase text-[9px]">Source:</span>
                                                {l.batches.map((b, bi) => (
                                                    <span key={bi} className="px-2 py-0.5 rounded-md border border-violet-200 bg-violet-50 text-violet-700 font-semibold">
                                                        #{b.invoiceNo} · {fmt(b.qty)} × ৳{fmt(b.cost)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                <div className={`rounded-xl border px-3 py-2.5 flex items-center justify-between text-sm font-extrabold ${modalSt.box}`}>
                                    <span>Total</span>
                                    <span>
                                        ৳{fmt(Math.abs(modalCost.diff))}
                                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${modalSt.tag}`}>{modalSt.label}</span>
                                    </span>
                                </div>
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
                                            <th className={th}>Product</th>
                                            <th className={`${th} text-center`}>Qty</th>
                                            <th className={`${th} text-right`}>Stock Cost / pcs</th>
                                            <th className={`${th} text-right`}>Stock Total</th>
                                            <th className={`${th} text-right`}>Return / pcs</th>
                                            <th className={`${th} text-right`}>Return Total</th>
                                            <th className={`${th} text-right`}>Difference</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-[13px] text-slate-700">
                                        {modalCost.lines.map((l, i) => {
                                            const d = r2(l.stockTotal - l.retTotal);
                                            const ds = costStatus(d);
                                            return (
                                                <React.Fragment key={i}>
                                                    <tr className="hover:bg-slate-50 transition">
                                                        <td className="py-3 px-3 font-semibold text-slate-800">{l.name}</td>
                                                        <td className="py-3 px-3 text-center font-bold text-orange-600 whitespace-nowrap">{fmt(l.qty)} pcs</td>
                                                        <td className="py-3 px-3 text-right font-bold text-violet-600 whitespace-nowrap">৳{fmt(l.stockPerPcs)}</td>
                                                        <td className="py-3 px-3 text-right font-bold text-violet-700 whitespace-nowrap">৳{fmt(l.stockTotal)}</td>
                                                        <td className="py-3 px-3 text-right font-bold text-amber-600 whitespace-nowrap">৳{fmt(l.retPerPcs)}</td>
                                                        <td className="py-3 px-3 text-right font-bold text-amber-700 whitespace-nowrap">৳{fmt(l.retTotal)}</td>
                                                        <td className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${ds.val}`}>
                                                            ৳{fmt(Math.abs(d))}
                                                            <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${ds.tag}`}>{ds.label}</span>
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-slate-50/60">
                                                        <td colSpan={7} className="px-3 py-2">
                                                            <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                                <span className="font-bold text-slate-500 uppercase text-[10px]">Stock source:</span>
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
                                        <tr className="bg-slate-50 font-extrabold text-[13px]">
                                            <td className="py-3 px-3 text-slate-700" colSpan={3}>Total</td>
                                            <td className="py-3 px-3 text-right text-violet-700 whitespace-nowrap">৳{fmt(modalCost.stockTotal)}</td>
                                            <td className="py-3 px-3"></td>
                                            <td className="py-3 px-3 text-right text-amber-700 whitespace-nowrap">৳{fmt(modalCost.retTotal)}</td>
                                            <td className={`py-3 px-3 text-right whitespace-nowrap ${modalSt.val}`}>
                                                ৳{fmt(Math.abs(modalCost.diff))}
                                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] ${modalSt.tag}`}>{modalSt.label}</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DamageReturnInvoice;