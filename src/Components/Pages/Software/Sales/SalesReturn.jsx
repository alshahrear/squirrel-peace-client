import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { FaChevronDown } from 'react-icons/fa';
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

// ekta product er line gulo ke group kore ekta (label + lines) row banay
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

const lblCls = 'block text-[10px] uppercase text-slate-400 font-bold mb-0.5';

const SalesReturn = () => {
    const [returns, setReturns] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const can = useCan('sales_return');

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));
    const denyMsg = (what) => showToast(`আপনার ${what} করার অনুমতি নেই!`, 'error');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', customer: '', customerContact: '', orderNo: '' });
    const [selectedIds, setSelectedIds] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const getCustomerName = (cust) => cust.name || cust.customerName || cust.businessName || '';
    const getPhoneByName = (name) =>
        customers.find((c) => getCustomerName(c).trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';

    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:5000/customer');
            const data = await res.json();
            setCustomers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    // Sales -> proti order er returnHistory theke each entry ke alada row banano
    const fetchReturns = async () => {
        try {
            const response = await fetch('http://localhost:5000/sales');
            const data = await response.json();

            const flattenedReturns = [];
            data.forEach((order) => {
                (order.returnHistory || []).forEach((ret) => {
                    const retItems = ret.items || [];
                    const retFreeItems = ret.freeItems || [];

                    flattenedReturns.push({
                        seq: flattenedReturns.length,
                        createdAt: ret.createdAt,
                        returnIdRaw: ret.returnId,
                        orderId: order._id,
                        returnId: ret.returnId,
                        returnDate: ret.returnDate,
                        orderNo: order.orderNo,
                        customer: order.customer,
                        collectedBy: ret.collectedBy || '',
                        totalReturnPcs: ret.totalReturnPcs,
                        totalReturnFreeQty: ret.totalReturnFreeQty,
                        totalReturnAmount: ret.totalReturnAmount,
                        totalReturnFreeItemsQty: ret.totalReturnFreeItemsQty,
                        retLines: buildLines(retItems, 'returnUnitQty', 'returnSubQty', 'returnPcsQty', 'returnTotalQty', order.items),
                        freeLines: buildLines(retItems, 'returnFreeUnitQty', 'returnFreeSubQty', 'returnFreePcsQty', 'returnFreeTotalQty', order.items),
                        otherLines: buildLines(retFreeItems, 'returnUnitQty', 'returnSubQty', 'returnPcsQty', 'returnTotalQty', order.freeItems),
                    });
                });
            });

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
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const customerOptions = customers
        .filter((c) => {
            const s = filters.customer.toLowerCase();
            return getCustomerName(c).toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .slice(0, 50)
        .map((c) => ({ key: c._id, title: getCustomerName(c), sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', customer: '', customerContact: '', orderNo: '' });
        setCurrentPage(1);
    };

    const handleViewReturn = (item) => navigate(`/sales-return-view/${item.orderId}?returnId=${item.returnId}`);

    const handleEditReturn = (item) => {
        if (!can.canEdit) return denyMsg('Edit');
        navigate(`/sales-return-details/${item.orderId}?returnId=${item.returnId}`);
    };

    const handleDeleteReturn = async (item) => {
        if (!can.canDelete) return denyMsg('Delete');
        Swal.fire({
            title: 'Are you sure?',
            text: 'Ei return entry ta delete hoye jabe, kintu sales order thakbe!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, delete return!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const orderRes = await fetch(`http://localhost:5000/sales/${item.orderId}`);
                const order = await orderRes.json();
                const updatedHistory = (order.returnHistory || []).filter((ret) => ret.returnId !== item.returnId);
                const response = await fetch(`http://localhost:5000/sales/${item.orderId}`, {
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
        { label: 'View Return', onClick: () => handleViewReturn(item) },
        { label: 'Edit Return', tone: 'brand', onClick: () => handleEditReturn(item) },
        { label: 'Delete', tone: 'danger', onClick: () => handleDeleteReturn(item) },
    ];

    // ---------- filtering ----------
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
        if (filters.customer && !item.customer?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.customerContact) {
            const phone = getPhoneByName(item.customer);
            if (phone && phone !== filters.customerContact) return false;
        }
        if (filters.orderNo && !String(item.orderNo || '').toLowerCase().includes(filters.orderNo.toLowerCase())) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredReturns.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;

    // Order mark korle oi order-er shob row eksathe dekhabe
    const orderedReturns = (() => {
        if (selectedOrders.length === 0) return filteredReturns;
        const placed = new Set();
        const out = [];
        filteredReturns.forEach((r) => {
            if (!selectedOrders.includes(r.orderNo)) {
                out.push(r);
                return;
            }
            if (placed.has(r.orderNo)) return;
            placed.add(r.orderNo);
            filteredReturns.filter((x) => x.orderNo === r.orderNo).forEach((x) => out.push(x));
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

    const handleSelectOrder = (orderNo) => {
        const ids = returns.filter((r) => r.orderNo === orderNo).map((r) => r.returnId);
        if (selectedOrders.includes(orderNo)) {
            setSelectedOrders((prev) => prev.filter((x) => x !== orderNo));
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        } else {
            setSelectedOrders((prev) => [...prev, orderNo]);
            setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
        }
    };

    // ---------- summary ----------
    const orderRows = filteredReturns.filter((i) => selectedOrders.includes(i.orderNo));
    const checkedRows = filteredReturns.filter((i) => selectedIds.includes(i.returnId));
    const isOrderMode = orderRows.length > 0;
    const isCheckMode = checkedRows.length > 0;
    const hasSelection = isOrderMode || isCheckMode;
    const summaryRows = hasSelection ? checkedRows : filteredReturns;

    const qtyInfo = buildQtyInfo(summaryRows, 'retLines', 'totalReturnPcs');
    const freeInfo = buildQtyInfo(summaryRows, 'freeLines', 'totalReturnFreeQty');
    const othersInfo = buildQtyInfo(summaryRows, 'otherLines', 'totalReturnFreeItemsQty');
    const sumAmount = summaryRows.reduce((s, i) => s + (Number(i.totalReturnAmount) || 0), 0);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const activeCount = ['startDate', 'endDate', 'customer', 'orderNo'].filter((k) => filters[k]).length;

    const OrderBtn = ({ item }) => (
        <button
            type="button"
            onClick={() => handleSelectOrder(item.orderNo)}
            title="Click to mark all returns of this order"
            className={`font-bold px-2 py-1 rounded-lg text-sm cursor-pointer ${selectedOrders.includes(item.orderNo) ? 'bg-amber-500 text-white' : 'text-brand-700 hover:bg-brand-50'}`}
        >
            {item.orderNo}
        </button>
    );

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

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Sales Return</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage and track all sales return records</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (can.canAdd ? navigate('/wholesale') : denyMsg('Add'))}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 w-full sm:w-auto cursor-pointer"
                    >
                        New Return
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
                            setFilters({ ...filters, customer: getCustomerName(o.raw), customerContact: o.raw.contactNumber || '' });
                            setCurrentPage(1);
                        }}
                    />
                    <div>
                        <label className={labelCls}>Order Number</label>
                        <input type="text" name="orderNo" placeholder="Search order..." value={filters.orderNo} onChange={handleFilterChange} className={inputCls} />
                    </div>
                </FilterPanel>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            <Pill tone={isOrderMode ? 'amber' : isCheckMode ? 'rose' : 'brand'}>
                                {isOrderMode ? 'Order Selected' : isCheckMode ? 'Selected' : 'Showing'}
                            </Pill>
                            <span className="text-sm text-slate-600">
                                Rows: <b className="text-slate-800">{summaryRows.length}</b>
                                {isOrderMode && (
                                    <> · Order: <b className="text-slate-800">{selectedOrders.length}</b></>
                                )}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            {(isOrderMode || isCheckMode || selectedIds.length > 0) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedIds([]);
                                        setSelectedOrders([]);
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
                                    const ordSel = selectedOrders.includes(item.orderNo);
                                    const phone = getPhoneByName(item.customer);
                                    return (
                                        <div
                                            key={item.returnId || index}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : ordSel ? 'border-amber-300 bg-amber-50/50' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-orange-400" />
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(item.returnId)}
                                                    aria-label="Select row"
                                                    className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                                <p className="min-w-0 font-bold text-[13px] text-brand-700 truncate leading-tight">{item.customer}</p>
                                                <span className="ml-auto" />
                                                <RowMenu compact items={menuItems(item)} />
                                            </div>
                                            <div className="flex items-stretch gap-2">
                                                {/* Left: info */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSelectOrder(item.orderNo)}
                                                            title="Click to mark all returns of this order"
                                                            className={`shrink-0 px-1.5 py-px rounded-full text-[10px] font-bold leading-tight cursor-pointer ${ordSel ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-600'}`}
                                                        >
                                                            #{item.orderNo}
                                                        </button>
                                                        <span className="text-[10px] text-slate-500 leading-tight truncate min-w-0">{item.returnDate || 'N/A'}</span>
                                                    </div>
                                                    {phone && <p className="text-[10.5px] text-slate-500 leading-snug truncate">📞 {phone}</p>}
                                                    <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Collected By: </span>
                                                        {item.collectedBy || 'N/A'}
                                                    </p>
                                                    {qtyRow('Return', item.retLines, item.totalReturnPcs, 'text-orange-600', 'text-brand-700')}
                                                    {qtyRow('Free', item.freeLines, item.totalReturnFreeQty, 'text-emerald-600', 'text-emerald-700')}
                                                    {qtyRow('Others Free', item.otherLines, item.totalReturnFreeItemsQty, 'text-amber-600', 'text-amber-700')}
                                                </div>

                                                {/* Right: amount */}
                                                <div className="shrink-0 w-[100px] flex flex-col items-end justify-end gap-1.5">
                                                    <div className="w-full rounded-lg bg-orange-50 px-2 py-1.5 text-right">
                                                        <p className="text-[9px] uppercase font-bold leading-none text-slate-400">Return Amount</p>
                                                        <p className="text-[12.5px] font-extrabold leading-tight mt-1 text-orange-600 whitespace-nowrap">
                                                            ৳{Number(item.totalReturnAmount || 0).toFixed(2)}
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
                                            <th className="px-3 py-3">Order No</th>
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">Collected By</th>
                                            <th className="px-3 py-3">Return Qty</th>
                                            <th className="px-3 py-3">Return Free Qty</th>
                                            <th className="px-3 py-3">Others Free</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentReturns.map((item, index) => {
                                            const sel = selectedIds.includes(item.returnId);
                                            const phone = getPhoneByName(item.customer);
                                            return (
                                                <tr
                                                    key={item.returnId || index}
                                                    className={`align-middle ${sel ? 'bg-brand-50/60' : selectedOrders.includes(item.orderNo) ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item.returnId)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 font-medium text-slate-600">{item.returnDate || 'N/A'}</td>
                                                    <td className="px-3 py-3"><OrderBtn item={item} /></td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{item.customer}</div>
                                                        {phone && <div className="text-[11px] font-medium text-slate-400 mt-0.5">📞 {phone}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold text-slate-700 whitespace-nowrap">{item.collectedBy || 'N/A'}</td>
                                                    <td className="px-3 py-3 font-semibold text-orange-600">{renderLines(item.retLines, item.totalReturnPcs, 'text-brand-700')}</td>
                                                    <td className="px-3 py-3 font-semibold text-emerald-600">{renderLines(item.freeLines, item.totalReturnFreeQty, 'text-emerald-700')}</td>
                                                    <td className="px-3 py-3 font-semibold text-amber-600">{renderLines(item.otherLines, item.totalReturnFreeItemsQty, 'text-amber-700')}</td>
                                                    <td className="px-3 py-3 font-bold text-orange-600 whitespace-nowrap">৳{Number(item.totalReturnAmount || 0).toFixed(2)}</td>
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

export default SalesReturn;