import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
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

const formatLine = (ln) => {
    const parts = [];
    if (ln.unitQty > 0) parts.push(`${ln.unitQty} ${ln.unitLabel}`);
    if (ln.isParent && ln.subQty > 0) parts.push(`${ln.subQty} ${ln.subLabel}`);
    parts.push(`${ln.pcsQty} Pcs`);
    return parts.join(' ');
};

const renderLines = (lines, totalValue, totalColor) => {
    if (!lines || lines.length === 0) {
        return (
            <div>
                0 Pcs <span className={`text-xs ml-1 font-bold ${totalColor}`}>(Total: {totalValue || 0})</span>
            </div>
        );
    }
    return lines.map((ln, i) => (
        <div key={i}>
            {formatLine(ln)} <span className={`text-xs ml-1 font-bold ${totalColor}`}>(Total: {ln.totalQty})</span>
        </div>
    ));
};

const buildQtyInfo = (rows, linesKey, totalKey) => {
    const map = {};
    let total = 0;
    rows.forEach((r) => {
        (r[linesKey] || []).forEach((ln) => {
            const key = `${ln.unitLabel}|${ln.isParent ? ln.subLabel : ''}`;
            if (!map[key]) map[key] = { ...ln, unitQty: 0, subQty: 0, pcsQty: 0, totalQty: 0 };
            map[key].unitQty += ln.unitQty;
            map[key].subQty += ln.subQty;
            map[key].pcsQty += ln.pcsQty;
            map[key].totalQty += ln.totalQty;
        });
        total += Number(r[totalKey]) || 0;
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

const PurchaseReturn = () => {
    const [returns, setReturns] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const { canAdd, canEdit, canDelete } = useCan('purchase_return');

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));
    const denyMsg = (what) => showToast(`আপনার ${what} করার অনুমতি নেই!`, 'error');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', company: '', companyContact: '', invoiceNo: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedInvoices, setSelectedInvoices] = useState([]);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const fetchCompanies = async () => {
        try {
            const res = await fetch('http://localhost:5000/company');
            const data = await res.json();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchReturns = async () => {
        try {
            const response = await fetch('http://localhost:5000/purchase');
            const data = await response.json();

            const flattenedReturns = [];
            data.forEach((order) => {
                (order.returnHistory || []).forEach((ret) => {
                    const retItems = ret.items || [];

                    const sumUnitQty = retItems.reduce((s, it) => s + (Number(it.returnUnitQty) || 0), 0);
                    const sumPcsQty = retItems.reduce((s, it) => s + (Number(it.returnPcsQty) || 0), 0);
                    const sumSubQty = retItems.reduce((s, it) => s + (Number(it.returnSubQty) || 0), 0);
                    const sumFreeUnitQty = retItems.reduce((s, it) => s + (Number(it.returnFreeUnitQty) || 0), 0);
                    const sumFreePcsQty = retItems.reduce((s, it) => s + (Number(it.returnFreePcsQty) || 0), 0);
                    const sumFreeSubQty = retItems.reduce((s, it) => s + (Number(it.returnFreeSubQty) || 0), 0);

                    const retFreeItems = ret.freeItems || [];
                    const sumOtherFreeUnitQty = retFreeItems.reduce((s, it) => s + (Number(it.returnUnitQty) || 0), 0);
                    const sumOtherFreePcsQty = retFreeItems.reduce((s, it) => s + (Number(it.returnPcsQty) || 0), 0);
                    const sumOtherFreeSubQty = retFreeItems.reduce((s, it) => s + (Number(it.returnSubQty) || 0), 0);
                    const otherFreeFirst = retFreeItems[0];
                    const matchedOtherFreeItem = otherFreeFirst
                        ? (order.freeItems || []).find((fi) => fi.productId === otherFreeFirst.productId)
                        : null;
                    const otherFreeUnitLabel = matchedOtherFreeItem?.unit || 'Unit';
                    const otherFreeIsParent = matchedOtherFreeItem?.parentMode === true;
                    const otherFreeSubLabel = matchedOtherFreeItem?.subUnit || 'Sub';

                    const buildLines = (list, unitKey, subKey, pcsKey, totalKey, sourceItems) => {
                        const lines = [];
                        list.forEach((it) => {
                            const src = (sourceItems || []).find((oi) => oi.productId === it.productId);
                            const u = Number(it[unitKey]) || 0;
                            const s = Number(it[subKey]) || 0;
                            const p = Number(it[pcsKey]) || 0;
                            const t = Number(it[totalKey]) || 0;
                            if (u <= 0 && s <= 0 && p <= 0 && t <= 0) return;
                            lines.push({
                                unitLabel: src?.unit || 'Unit',
                                subLabel: src?.subUnit || 'Sub',
                                isParent: src?.parentMode === true,
                                unitQty: u,
                                subQty: s,
                                pcsQty: p,
                                totalQty: t,
                            });
                        });
                        return lines;
                    };

                    const retLines = buildLines(retItems, 'returnUnitQty', 'returnSubQty', 'returnPcsQty', 'returnTotalQty', order.items);
                    const freeLines = buildLines(retItems, 'returnFreeUnitQty', 'returnFreeSubQty', 'returnFreePcsQty', 'returnFreeTotalQty', order.items);
                    const otherLines = buildLines(retFreeItems, 'returnUnitQty', 'returnSubQty', 'returnPcsQty', 'returnTotalQty', order.freeItems);

                    flattenedReturns.push({
                        seq: flattenedReturns.length,
                        createdAt: ret.createdAt,
                        returnIdRaw: ret.returnId,
                        status: ret.status || 'Approved',
                        orderId: order._id,
                        returnId: ret.returnId,
                        returnDate: ret.returnDate,
                        invoiceNo: order.invoiceNo,
                        company: order.company,
                        companyContact: order.companyContact,
                        totalReturnPcs: ret.totalReturnPcs,
                        totalReturnFreeQty: ret.totalReturnFreeQty,
                        totalReturnAmount: ret.totalReturnAmount,
                        totalReturnFreeItemsQty: ret.totalReturnFreeItemsQty,
                        sumOtherFreeUnitQty,
                        sumOtherFreePcsQty,
                        otherFreeUnitLabel,
                        sumUnitQty,
                        sumPcsQty,
                        sumFreeUnitQty,
                        sumFreePcsQty,
                        retLines,
                        freeLines,
                        otherLines,
                        sumSubQty,
                        sumFreeSubQty,
                        sumOtherFreeSubQty,
                        otherFreeIsParent,
                        otherFreeSubLabel,
                    });
                });
            });

            const getTimestamp = (r) => {
                if (r.createdAt) {
                    const c = new Date(r.createdAt).getTime();
                    if (!isNaN(c)) return c;
                }
                const idMatch = String(r.returnIdRaw || '').match(/\d{13}/);
                if (idMatch) return Number(idMatch[0]);

                const str = r.returnDate || '';
                const [datePart, ...rest] = str.split(',');
                const timePart = rest.join(',').trim();
                let d = null;

                if (datePart.includes('/')) {
                    const [dd, mm, yyyy] = datePart.trim().split('/').map(Number);
                    let h = 0, m = 0, s = 0;
                    const t = timePart.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(am|pm)?/i);
                    if (t) {
                        h = Number(t[1]);
                        m = Number(t[2]);
                        s = Number(t[3] || 0);
                        const ap = t[4]?.toLowerCase();
                        if (ap === 'pm' && h < 12) h += 12;
                        if (ap === 'am' && h === 12) h = 0;
                    }
                    d = new Date(yyyy, mm - 1, dd, h, m, s);
                } else if (str) {
                    d = new Date(str);
                }
                return d && !isNaN(d) ? d.getTime() : 0;
            };

            flattenedReturns.sort((a, b) => {
                const tb = getTimestamp(b);
                const ta = getTimestamp(a);
                if (tb !== ta) return tb - ta;
                const na = Number(a.returnId);
                const nb = Number(b.returnId);
                if (!isNaN(na) && !isNaN(nb) && na !== nb) return nb - na;
                return b.seq - a.seq;
            });

            setReturns(flattenedReturns);
        } catch (error) {
            console.error('Error fetching returns:', error);
            showToast('Failed to load returns!', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns();
        fetchCompanies();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
        setFilters({ startDate: '', endDate: '', company: '', companyContact: '', invoiceNo: '' });
        setCurrentPage(1);
    };

    const handleViewReturn = (item) => navigate(`/purchase-return-view/${item.orderId}?returnId=${item.returnId}`);

    const handleApprove = (item) => {
        if (!canEdit) return denyMsg('Edit');
        Swal.fire({
            title: 'Approve this purchase return?',
            text: 'Approve korle ar Pending kora jabe na!',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, approve it!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const orderRes = await fetch(`http://localhost:5000/purchase/${item.orderId}`);
                const order = await orderRes.json();
                const updatedHistory = (order.returnHistory || []).map((ret) =>
                    ret.returnId === item.returnId ? { ...ret, status: 'Approved' } : ret
                );
                const response = await fetch(`http://localhost:5000/purchase/${item.orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ returnHistory: updatedHistory }),
                });
                if (!response.ok) throw new Error('Failed');
                setReturns((prev) => prev.map((r) => (r.returnId === item.returnId ? { ...r, status: 'Approved' } : r)));
                showToast('Purchase return approved successfully!', 'success');
            } catch (error) {
                console.error('Error approving return:', error);
                showToast('Failed to approve!', 'error');
            }
        });
    };

    const handleEditReturn = (item) => {
        if (!canEdit) return denyMsg('Edit');
        navigate(`/purchase-return-details/${item.orderId}?returnId=${item.returnId}`);
    };

    const handleDeleteReturn = async (item) => {
        if (!canDelete) return denyMsg('Delete');
        Swal.fire({
            title: 'Are you sure?',
            text: 'Ei return entry ta delete hoye jabe, kintu purchase order thakbe!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, delete return!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const orderRes = await fetch(`http://localhost:5000/purchase/${item.orderId}`);
                const order = await orderRes.json();
                const updatedHistory = (order.returnHistory || []).filter((ret) => ret.returnId !== item.returnId);
                const response = await fetch(`http://localhost:5000/purchase/${item.orderId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ returnHistory: updatedHistory }),
                });
                if (response.ok) {
                    showToast('Return deleted successfully!', 'success');
                    setReturns((prev) => prev.filter((r) => r.returnId !== item.returnId));
                } else {
                    showToast('Failed to delete return!', 'error');
                }
            } catch (error) {
                console.error('Error deleting return:', error);
                showToast('Server error while deleting return!', 'error');
            }
        });
    };

    const menuItems = (item) => [
        { label: 'Approval', tone: 'success', hidden: item.status === 'Approved', onClick: () => handleApprove(item) },
        { label: 'View Return', onClick: () => handleViewReturn(item) },
        { label: 'Edit Return', tone: 'brand', onClick: () => handleEditReturn(item) },
        { label: 'Delete', tone: 'danger', onClick: () => handleDeleteReturn(item) },
    ];

    const filteredReturns = returns.filter((item) => {
        if (filters.startDate || filters.endDate) {
            const returnDateObj = parseToLocalDate(item.returnDate);
            if (!returnDateObj) return false;
            if (filters.startDate) {
                const s = parseToLocalDate(filters.startDate);
                if (s && returnDateObj < s) return false;
            }
            if (filters.endDate) {
                const e = parseToLocalDate(filters.endDate);
                if (e && returnDateObj > e) return false;
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

    const orderedReturns = (() => {
        if (selectedInvoices.length === 0) return filteredReturns;
        const placed = new Set();
        const out = [];
        filteredReturns.forEach((r) => {
            if (!selectedInvoices.includes(r.invoiceNo)) {
                out.push(r);
                return;
            }
            if (placed.has(r.invoiceNo)) return;
            placed.add(r.invoiceNo);
            filteredReturns.filter((x) => x.invoiceNo === r.invoiceNo).forEach((x) => out.push(x));
        });
        return out;
    })();
    const currentReturns = orderedReturns.slice(indexOfFirstItem, indexOfLastItem);

    const isAllSelected = currentReturns.length > 0 && currentReturns.every((i) => selectedIds.includes(i.returnId));
    const handleSelectAll = () => {
        const ids = currentReturns.map((i) => i.returnId);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };
    const handleSelectRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    const handleSelectInvoice = (invoiceNo) => {
        const ids = returns.filter((r) => r.invoiceNo === invoiceNo).map((r) => r.returnId);
        if (selectedInvoices.includes(invoiceNo)) {
            setSelectedInvoices((prev) => prev.filter((x) => x !== invoiceNo));
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        } else {
            setSelectedInvoices((prev) => [...prev, invoiceNo]);
            setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
        }
    };

    const invoiceRows = filteredReturns.filter((i) => selectedInvoices.includes(i.invoiceNo));
    const checkedRows = filteredReturns.filter((i) => selectedIds.includes(i.returnId));
    const isInvoiceMode = invoiceRows.length > 0;
    const isCheckMode = checkedRows.length > 0;
    const hasSelection = isInvoiceMode || isCheckMode;
    const summaryRows = hasSelection ? checkedRows : filteredReturns;

    const qtyInfo = buildQtyInfo(summaryRows, 'retLines', 'totalReturnPcs');
    const freeInfo = buildQtyInfo(summaryRows, 'freeLines', 'totalReturnFreeQty');
    const othersInfo = buildQtyInfo(summaryRows, 'otherLines', 'totalReturnFreeItemsQty');
    const sumAmount = summaryRows.reduce((s, i) => s + (Number(i.totalReturnAmount) || 0), 0);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const activeCount = ['startDate', 'endDate', 'company', 'invoiceNo'].filter((k) => filters[k]).length;
    const statusPill = (s) => (s === 'Approved' ? <Pill tone="green">Approved</Pill> : <Pill tone="amber">Pending</Pill>);

    const InvoiceBtn = ({ item }) => (
        <button
            type="button"
            onClick={() => handleSelectInvoice(item.invoiceNo)}
            title="Click to mark all returns of this invoice"
            className={`font-bold px-2 py-1 rounded-lg text-sm cursor-pointer ${selectedInvoices.includes(item.invoiceNo) ? 'bg-amber-500 text-white' : 'text-brand-700 hover:bg-brand-50'
                }`}
        >
            {item.invoiceNo}
        </button>
    );

    const boxCls = 'min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2';

    const qtyRow = (label, lines, total, cls, totCls) => {
        const has = (lines && lines.length > 0) || Number(total) > 0;
        if (!has) return null;
        return (
            <div className={`flex gap-1 text-[10px] leading-snug font-semibold ${cls}`}>
                <span className="uppercase text-slate-400 font-bold shrink-0">{label}:</span>
                <div className="min-w-0">{renderLines(lines, total, totCls)}</div>
            </div>
        );
    };
    const lblCls = 'block text-[10px] uppercase text-slate-400 font-bold mb-0.5';

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Purchase Return</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage and track all purchase return records</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (canAdd ? navigate('/purchase') : denyMsg('Add'))}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 w-full sm:w-auto cursor-pointer"
                    >
                        New Return
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
                        <div className="flex items-center gap-2 flex-wrap">
                            <Pill tone={isInvoiceMode ? 'amber' : isCheckMode ? 'rose' : 'brand'}>
                                {isInvoiceMode ? 'Invoice Selected' : isCheckMode ? 'Selected' : 'Showing'}
                            </Pill>
                            <span className="text-sm text-slate-600">
                                Rows: <b className="text-slate-800">{summaryRows.length}</b>
                                {isInvoiceMode && (
                                    <> · Invoice: <b className="text-slate-800">{selectedInvoices.length}</b></>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {(isInvoiceMode || isCheckMode || selectedIds.length > 0) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedIds([]);
                                        setSelectedInvoices([]);
                                    }}
                                    className="h-9 px-3 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                >
                                    Clear Selection
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsSummaryOpen((p) => !p)}
                                className="h-9 px-3 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 cursor-pointer"
                            >
                                {isSummaryOpen ? 'Hide Details' : 'Show Details'}
                                <FaChevronDown size={10} className={`transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    </div>
                    <div className={`${isSummaryOpen ? 'grid' : 'hidden'} grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`}>
                        <QtyBox title="Return Quantity" titleCls="text-orange-600" totalCls="text-brand-700" info={qtyInfo} />
                        <QtyBox title="Return Free Quantity" titleCls="text-emerald-600" totalCls="text-emerald-700" info={freeInfo} />
                        <QtyBox title="Others Free Product" titleCls="text-amber-600" totalCls="text-amber-700" info={othersInfo} />
                        <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5">
                            <div className="text-[10px] font-bold uppercase text-rose-600">Return Amount</div>
                            <div className="text-lg font-bold text-rose-600 mt-0.5">৳{fmt(sumAmount)}</div>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    {loading ? (
                        <ListSkeleton />
                    ) : filteredReturns.length === 0 ? (
                        <Empty text="No returns found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentReturns.map((item, index) => {
                                    const sel = selectedIds.includes(item.returnId);
                                    const invSel = selectedInvoices.includes(item.invoiceNo);
                                    const approved = item.status === 'Approved';
                                    return (
                                        <div
                                            key={item.returnId || index}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : invSel ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${approved ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(item.returnId)}
                                                    aria-label="Select row"
                                                    className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                                <p className="shrink-0 max-w-[60%] font-bold text-[13px] text-brand-700 truncate leading-tight">{item.company}</p>
                                                <span
                                                    className={`shrink-0 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight ${approved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}
                                                >
                                                    {approved ? 'Approved' : 'Pending'}
                                                </span>
                                                <span className="ml-auto" />
                                                <RowMenu compact items={menuItems(item)} />
                                            </div>
                                            <div className="flex items-stretch gap-2">
                                                {/* Left: info */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectInvoice(item.invoiceNo)}
                                                            title="Click to mark all returns of this invoice"
                                                            className={`shrink-0 px-1.5 py-px rounded-full text-[10px] font-bold leading-tight cursor-pointer ${invSel ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                                        >
                                                            #{item.invoiceNo}
                                                        </button>
                                                        <span className="text-[10px] text-slate-500 leading-tight truncate min-w-0">
                                                            {item.returnDate || 'N/A'}
                                                        </span>
                                                    </div>
                                                    {qtyRow('Return', item.retLines, item.totalReturnPcs, 'text-orange-600', 'text-brand-700')}
                                                    {qtyRow('Free', item.freeLines, item.totalReturnFreeQty, 'text-emerald-600', 'text-emerald-700')}
                                                    {qtyRow('Others Free', item.otherLines, item.totalReturnFreeItemsQty, 'text-amber-600', 'text-amber-700')}
                                                </div>

                                                {/* Right: checkbox + actions, amount */}
                                                <div className="shrink-0 w-[100px] flex flex-col items-end justify-end gap-1.5">
                                                    <div className="w-full rounded-lg bg-orange-50 px-2 py-1.5 text-right">
                                                        <p className="text-[9px] uppercase font-bold leading-none text-slate-400">Return Amount</p>
                                                        <p className="text-[12.5px] font-extrabold leading-tight mt-1 text-orange-600 whitespace-nowrap">
                                                            ৳{Number(item.totalReturnAmount).toFixed(2)}
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
                                <table className="w-full min-w-[1100px] text-left text-xs">
                                    <thead className="bg-slate-50 text-slate-600 uppercase tracking-wide">
                                        <tr>
                                            <th className="w-10 px-3 py-3 text-center">
                                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Invoice</th>
                                            <th className="px-3 py-3">Company</th>
                                            <th className="px-3 py-3">Return Qty</th>
                                            <th className="px-3 py-3">Return Free Qty</th>
                                            <th className="px-3 py-3">Others Free</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentReturns.map((item, index) => {
                                            const sel = selectedIds.includes(item.returnId);
                                            return (
                                                <tr
                                                    key={item.returnId || index}
                                                    className={`align-middle ${sel ? 'bg-brand-50/60' : selectedInvoices.includes(item.invoiceNo) ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item.returnId)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 font-medium text-slate-600">{item.returnDate || 'N/A'}</td>
                                                    <td className="px-3 py-3"><InvoiceBtn item={item} /></td>
                                                    <td className="px-3 py-3 font-bold text-slate-800">{item.company}</td>
                                                    <td className="px-3 py-3 font-semibold text-orange-600">{renderLines(item.retLines, item.totalReturnPcs, 'text-brand-700')}</td>
                                                    <td className="px-3 py-3 font-semibold text-emerald-600">{renderLines(item.freeLines, item.totalReturnFreeQty, 'text-emerald-700')}</td>
                                                    <td className="px-3 py-3 font-semibold text-amber-600">{renderLines(item.otherLines, item.totalReturnFreeItemsQty, 'text-amber-700')}</td>
                                                    <td className="px-3 py-3 font-bold text-orange-600 whitespace-nowrap">৳{Number(item.totalReturnAmount).toFixed(2)}</td>
                                                    <td className="px-3 py-3">{statusPill(item.status)}</td>
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

export default PurchaseReturn;