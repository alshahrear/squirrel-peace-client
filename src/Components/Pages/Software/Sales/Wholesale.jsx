import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaPlus, FaChevronDown } from 'react-icons/fa';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
// NOTE: PurchaseUi er path tomar folder structure onujayi thik kore nio
import { fmt, inputCls, labelCls, Pill, Pager, ComboField, FilterPanel, RowMenu, ListSkeleton, Empty } from '../Purchase/PurchaseUi';

const EXTRA_OPTIONS = ['Free', 'Others Free', 'Damage', 'Sales Return', 'Bulk Return', 'Previous Get', 'Previous Pay'];

const EXTRA_TONE = {
    Free: 'green',
    'Others Free': 'amber',
    Damage: 'rose',
    'Sales Return': 'orange',
    'Bulk Return': 'orange',
    'Previous Get': 'brand',
    'Previous Pay': 'rose',
};

const MOBILE_TAG = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    orange: 'bg-orange-50 text-orange-700',
    slate: 'bg-slate-100 text-slate-600',
};

const EMPTY_FILTERS = {
    startDate: '',
    endDate: '',
    customer: '',
    customerContact: '',
    invoiceNo: '',
    sr: '',
    deliveredBy: '',
    address: '',
    route: '',
    status: '',
    due: '',
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

const getDue = (item) => {
    if (typeof item.due === 'number') return item.due;
    const total = item.payableAmount ?? item.grandTotal ?? 0;
    const paid = item.paidAmount ?? 0;
    const due = total - paid;
    return due > 0 ? due : 0;
};

const getStatus = (item) => item.status || item.deliveryStatus || 'New Order';
const isDelivered = (item) => getStatus(item) === 'Delivered';
const getPayable = (item) => Number(item.payableAmount ?? item.grandTotal) || 0;

const hasReturned = (item) =>
    (item.returnHistory || []).some(
        (r) =>
            (Number(r.totalReturnPcs) || 0) > 0 ||
            (Number(r.totalReturnFreeQty) || 0) > 0 ||
            (Number(r.totalReturnFreeItemsQty) || 0) > 0
    );

const getItemExtras = (item) => {
    const list = [];
    if (hasFreeQty(item)) list.push('Free');
    if ((item.freeItems || []).length > 0) list.push('Others Free');
    if ((item.damageItems || []).length > 0) list.push('Damage');
    if (hasReturned(item)) list.push('Sales Return');
    if ((item.returnItems || []).length > 0) list.push('Bulk Return');
    if (Number(item.previousBalanceAmount) > 0 && item.previousBalanceType === 'Due') list.push('Previous Get');
    if (Number(item.previousBalanceAmount) > 0 && item.previousBalanceType === 'Get') list.push('Previous Pay');
    return list;
};

const extraTags = (item) => getItemExtras(item).map((label) => ({ label, tone: EXTRA_TONE[label] }));

const hasFreeQty = (item) => (item.items || []).some((p) => (Number(p.freeQty) || 0) > 0);

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

const renderReceived = (item) => {
    const payable = getPayable(item);
    let main;
    if (payable <= 0) main = <Pill tone="slate">No Bill</Pill>;
    else if (!isDelivered(item) || !item.paidAmount) main = <Pill tone="rose">Not Received</Pill>;
    else
        main = (
            <span className="font-bold text-sm">
                <span className="text-emerald-600">৳{item.paidAmount}</span>
                <span className="text-rose-600"> ({getDue(item)})</span>
            </span>
        );
    return <div>{main}</div>;
};

const renderAmount = (item) => {
    const v = getPayable(item);
    return (
        <span className="font-bold text-brand-700 whitespace-nowrap">
            ৳{fmt(Math.abs(v))}
            {v < 0 && <span className="block text-[10px] font-bold text-rose-600">Payable</span>}
        </span>
    );
};

const Line = ({ label, value, cls = 'text-slate-800' }) => (
    <div className="flex items-center justify-between gap-4 text-xs">
        <span className="text-slate-500">{label}</span>
        <b className={cls}>{value}</b>
    </div>
);

const SumBox = ({ title, headCls, children }) => (
    <div className="rounded-xl border border-slate-200 overflow-hidden">
        <div className={`px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${headCls}`}>{title}</div>
        <div className="grid grid-cols-1 sm:grid-cols-2">{children}</div>
    </div>
);

const SumCol = ({ returned = false, children }) =>
    returned ? (
        <div className="p-3 space-y-1.5 bg-orange-50/60 border-t sm:border-t-0 sm:border-l border-dashed border-orange-200">
            <p className="text-[10px] font-bold uppercase text-orange-600">↩ Returned</p>
            {children}
        </div>
    ) : (
        <div className="p-3 space-y-1.5">{children}</div>
    );

const Wholesale = () => {
    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const wsCan = useCan('wholesale');
    const srCan = useCan('sales_return');
    const coCan = useCan('create_order');

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));
    const denyMsg = (what) => showToast(`আপনার ${what} করার অনুমতি নেই!`, 'error');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [directOnly, setDirectOnly] = useState(false);

    const [selectedIds, setSelectedIds] = useState([]);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);

    const [multiReturnEnabled, setMultiReturnEnabled] = useState(false);
    useEffect(() => {
        fetch('http://localhost:5000/feature')
            .then((res) => res.json())
            .then((data) => setMultiReturnEnabled(data?.salesMultiReturn === true))
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

    const fetchOrders = async () => {
        try {
            const response = await fetch('http://localhost:5000/sales');
            const data = await response.json();
            setOrders([...data].reverse());
        } catch (error) {
            console.error('Error fetching orders:', error);
            showToast('Failed to load orders!', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:5000/customer');
            setCustomers(await res.json());
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchCustomers();
        fetch('http://localhost:5000/user')
            .then((res) => res.json())
            .then((data) => setUsers(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching users:', error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const getCustomerName = (c) => c.businessName || c.name || '';
    const getPhoneByName = (name) =>
        customers.find((c) => getCustomerName(c).trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';

    const getCustomerAddr = (name) => {
        const c = customers.find((x) => getCustomerName(x).trim().toLowerCase() === (name || '').trim().toLowerCase());
        return c?.address || c?.shippingAddress || '';
    };
    const getAddr = (item) =>
        item.shippingAddress || item.address || item.customerAddress || getCustomerAddr(item.customer) || '';

    const customerOptions = customers
        .filter((c) => {
            const s = filters.customer.toLowerCase();
            return getCustomerName(c).toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .slice(0, 50)
        .map((c) => ({ key: c._id, title: getCustomerName(c), sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));
    const srOptions = users
        .filter((u) => u.role === 'SR' && u.name?.toLowerCase().includes(filters.sr.toLowerCase()))
        .map((u) => ({ key: u._id, title: u.name, sub: '', raw: u }));
    const dsrOptions = users
        .filter((u) => u.role === 'Delivery Man' && u.name?.toLowerCase().includes(filters.deliveredBy.toLowerCase()))
        .map((u) => ({ key: u._id, title: u.name, sub: '', raw: u }));

    const setF = (patch) => {
        setFilters((f) => ({ ...f, ...patch }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setF({ [e.target.name]: e.target.value });

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setExtraFilter([...EXTRA_OPTIONS]);
        setDirectOnly(false);
        setIsExtraOpen(false);
        setCurrentPage(1);
    };

    const handleToggleExtra = (opt) => {
        setExtraFilter((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
        setCurrentPage(1);
    };

    const activeCount =
        ['startDate', 'endDate', 'customer', 'invoiceNo', 'sr', 'deliveredBy', 'address', 'route', 'status', 'due'].filter((k) => filters[k]).length +
        (directOnly ? 1 : 0) +
        (extraFilter.length !== EXTRA_OPTIONS.length ? 1 : 0);

    // ---------- actions ----------
    const handleEdit = (item) => {
        if (!wsCan.canEdit) return denyMsg('Edit');
        navigate('/create-order', { state: { order: item } });
    };
    const handleDelivery = (item) => {
        if (!wsCan.canEdit) return denyMsg('Edit');
        navigate('/create-order', { state: { order: item, mode: 'delivery' } });
    };
    const handleReturn = (id) => {
        if (!srCan.canAdd) return denyMsg('Add');
        navigate(`/sales-return-details/${id}`);
    };
    const handleViewDetails = (id) => navigate(`/sales-details/${id}`);

    const handleDelete = async (id) => {
        if (!wsCan.canDelete) return denyMsg('Delete');
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
                    const response = await fetch(`http://localhost:5000/sales/${id}`, { method: 'DELETE' });
                    if (response.ok) {
                        showToast('Order deleted successfully!', 'success');
                        setOrders((prev) => prev.filter((item) => item._id !== id));
                    } else {
                        showToast('Failed to delete order!', 'error');
                    }
                } catch (error) {
                    console.error('Error deleting order:', error);
                    showToast('Server error while deleting!', 'error');
                }
            }
        });
    };

    const menuItems = (item) => {
        const delivered = isDelivered(item);
        return [
            { label: 'View Details', onClick: () => handleViewDetails(item._id) },
            {
                label: 'Return',
                tone: 'warn',
                hidden: !(delivered && (multiReturnEnabled || (item.returnHistory || []).length === 0)),
                onClick: () => handleReturn(item._id),
            },
            { label: 'Delivery', tone: 'success', hidden: delivered, onClick: () => handleDelivery(item) },
            { label: 'Edit', tone: 'brand', hidden: hasReturned(item), onClick: () => handleEdit(item) },
            { label: 'Delete', tone: 'danger', onClick: () => handleDelete(item._id) },
        ];
    };

    // ---------- filtering ----------
    const filteredOrders = orders.filter((item) => {
        if (directOnly && !item.directSales) return false;
        if (filters.startDate || filters.endDate) {
            const orderDateObj = parseToLocalDate(item.orderDate);
            if (!orderDateObj) return false;
            if (filters.startDate) {
                const s = parseToLocalDate(filters.startDate);
                if (s && orderDateObj < s) return false;
            }
            if (filters.endDate) {
                const e = parseToLocalDate(filters.endDate);
                if (e && orderDateObj > e) return false;
            }
        }
        if (filters.customer && !item.customer?.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.customerContact) {
            const phone = getPhoneByName(item.customer);
            if (phone && phone !== filters.customerContact) return false;
        }
        if (filters.invoiceNo) {
            const inv = (item.invoiceNo || item.orderNo || '').toLowerCase();
            if (!inv.includes(filters.invoiceNo.toLowerCase())) return false;
        }
        if (filters.sr && !item.sr?.toLowerCase().includes(filters.sr.toLowerCase())) return false;
        if (filters.deliveredBy && !item.deliveredBy?.toLowerCase().includes(filters.deliveredBy.toLowerCase())) return false;
        if (filters.address) {
            const addr = (getAddr(item) || '').toLowerCase();
            if (!addr.includes(filters.address.toLowerCase())) return false;
        }
        if (filters.route && !item.route?.toLowerCase().includes(filters.route.toLowerCase())) return false;
        if (filters.status === 'Delivered' && !isDelivered(item)) return false;
        if (filters.status === 'New Order' && isDelivered(item)) return false;
        if (filters.due) {
            const dueAmt = getDue(item);
            const delivered = isDelivered(item);
            if (filters.due === 'hasDue' && (!delivered || dueAmt <= 0)) return false;
            if (filters.due === 'noDue' && (!delivered || !item.paidAmount || dueAmt > 0)) return false;
        }
        if (extraFilter.length !== EXTRA_OPTIONS.length) {
            if (extraFilter.length === 0) return false;
            const itemExtras = getItemExtras(item);
            if (!extraFilter.some((opt) => itemExtras.includes(opt))) return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    const isAllSelected = currentOrders.length > 0 && currentOrders.every((i) => selectedIds.includes(i._id));
    const handleSelectAll = () => {
        const ids = currentOrders.map((i) => i._id);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };
    const handleSelectRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    // ---------- summary ----------
    const selectedRows = filteredOrders.filter((i) => selectedIds.includes(i._id));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredOrders;

    const totalPayable = summaryRows.reduce((s, i) => s + getPayable(i), 0);
    const totalPaid = summaryRows.reduce((s, i) => s + (Number(i.paidAmount) || 0), 0);
    const totalDue = summaryRows.reduce((s, i) => s + getDue(i), 0);
    const sumBy = (rows, listKey, field) =>
        rows.reduce((s, i) => s + (i[listKey] || []).reduce((ss, it) => ss + (Number(it[field]) || 0), 0), 0);

    const totalMainQty = summaryRows.reduce(
        (s, i) => s + (i.items || []).reduce((ss, it) => ss + (Number(it.totalPcs ?? it.totalQty) || 0), 0),
        0
    );
    const totalMainFreeQty = sumBy(summaryRows, 'items', 'freeQty');
    const totalOthersFreeQty = sumBy(summaryRows, 'freeItems', 'totalQty');
    const totalDamageQty = sumBy(summaryRows, 'damageItems', 'totalQty');
    const totalDamageFreeQty = sumBy(summaryRows, 'damageItems', 'freeQty');
    const totalDamageAmount = sumBy(summaryRows, 'damageItems', 'itemTotal') || sumBy(summaryRows, 'damageItems', 'subtotal');
    const totalRetProdQty = sumBy(summaryRows, 'returnItems', 'totalQty');
    const totalRetProdFreeQty = sumBy(summaryRows, 'returnItems', 'freeQty');
    const totalRetProdAmount = sumBy(summaryRows, 'returnItems', 'itemTotal') || sumBy(summaryRows, 'returnItems', 'subtotal');

    const sumRet = (rows, field) =>
        rows.reduce((s, i) => s + (i.returnHistory || []).reduce((ss, r) => ss + (Number(r[field]) || 0), 0), 0);
    const retMainQty = sumRet(summaryRows, 'totalReturnPcs');
    const retMainFree = sumRet(summaryRows, 'totalReturnFreeQty');
    const retMainAmount = sumRet(summaryRows, 'totalReturnAmount');
    const retOthersQty = sumRet(summaryRows, 'totalReturnFreeItemsQty');

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Wholesale Management</h1>
                        <p className="text-sm text-slate-500 mt-0.5">Manage and track all wholesale sales orders</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (coCan.canAdd ? navigate('/create-order') : denyMsg('Add'))}
                        className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                        <FaPlus size={12} /> New Order
                    </button>
                </div>

                {/* Filter */}
                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-4 xl:grid-cols-6">
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
                        onType={(v) => setF({ customer: v, customerContact: '' })}
                        onClear={() => setF({ customer: '', customerContact: '' })}
                        onPick={(o) => setF({ customer: getCustomerName(o.raw), customerContact: o.raw.contactNumber || '' })}
                    />
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label htmlFor="ws-inv" className="text-slate-600 text-xs font-medium">Invoice / Order No</label>
                            <label className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={directOnly}
                                    onChange={(e) => {
                                        setDirectOnly(e.target.checked);
                                        setCurrentPage(1);
                                    }}
                                    className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                                />
                                Direct
                            </label>
                        </div>
                        <input id="ws-inv" type="text" name="invoiceNo" placeholder="Search invoice..." value={filters.invoiceNo} onChange={handleFilterChange} className={inputCls} />
                    </div>
                    <ComboField
                        label="SR"
                        value={filters.sr}
                        placeholder="Search SR..."
                        options={srOptions}
                        onType={(v) => setF({ sr: v })}
                        onClear={() => setF({ sr: '' })}
                        onPick={(o) => setF({ sr: o.raw.name })}
                    />
                    <ComboField
                        label="Delivery Man"
                        value={filters.deliveredBy}
                        placeholder="Search delivery man..."
                        options={dsrOptions}
                        onType={(v) => setF({ deliveredBy: v })}
                        onClear={() => setF({ deliveredBy: '' })}
                        onPick={(o) => setF({ deliveredBy: o.raw.name })}
                    />
                    <div>
                        <label htmlFor="ws-addr" className={labelCls}>Address</label>
                        <input id="ws-addr" type="text" name="address" placeholder="Search address..." value={filters.address} onChange={handleFilterChange} className={inputCls} />
                    </div>
                    <div>
                        <label htmlFor="ws-route" className={labelCls}>Route</label>
                        <input id="ws-route" type="text" name="route" placeholder="Search route..." value={filters.route} onChange={handleFilterChange} className={inputCls} />
                    </div>
                    <div>
                        <label htmlFor="ws-status" className={labelCls}>Status</label>
                        <select id="ws-status" name="status" value={filters.status} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                            <option value="">All</option>
                            <option value="Delivered">Delivered</option>
                            <option value="New Order">New Order</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="ws-due" className={labelCls}>Due Status</label>
                        <select id="ws-due" name="due" value={filters.due} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                            <option value="">All</option>
                            <option value="hasDue">Has Due</option>
                            <option value="noDue">Fully Received</option>
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
                            <SumBox title="Main Product" headCls="bg-brand-50 text-brand-700">
                                <SumCol>
                                    <Line label="Total Qty" value={fmt(totalMainQty)} cls="text-brand-700" />
                                    <Line label={totalPayable < 0 ? 'Payable Amount' : 'Receivable Amount'} value={`৳${fmt(Math.abs(totalPayable))}`} cls="text-brand-700" />
                                    <Line label="Received" value={`৳${fmt(totalPaid)}`} cls="text-emerald-600" />
                                    <Line label="Due" value={`৳${fmt(totalDue)}`} cls="text-rose-600" />
                                    <Line label="Free Qty" value={fmt(totalMainFreeQty)} cls="text-emerald-600" />
                                </SumCol>
                                <SumCol returned>
                                    <Line label="Qty" value={fmt(retMainQty)} cls="text-orange-600" />
                                    <Line label="Free Qty" value={fmt(retMainFree)} cls="text-emerald-600" />
                                    <Line label="Amount" value={`৳${fmt(retMainAmount)}`} cls="text-orange-600" />
                                </SumCol>
                            </SumBox>
                            <SumBox title="Others Free" headCls="bg-amber-50 text-amber-700">
                                <SumCol>
                                    <Line label="Order Qty" value={fmt(totalOthersFreeQty)} cls="text-amber-600" />
                                </SumCol>
                                <SumCol returned>
                                    <Line label="Qty" value={fmt(retOthersQty)} cls="text-orange-600" />
                                </SumCol>
                            </SumBox>
                            <SumBox title="Damage Product" headCls="bg-rose-50 text-rose-700">
                                <SumCol>
                                    <Line label="Qty" value={fmt(totalDamageQty)} cls="text-rose-600" />
                                    <Line label="Free Qty" value={fmt(totalDamageFreeQty)} cls="text-emerald-600" />
                                    <Line label="Amount" value={`৳${fmt(totalDamageAmount)}`} cls="text-rose-600" />
                                </SumCol>
                            </SumBox>
                            <SumBox title="Return Product" headCls="bg-orange-50 text-orange-700">
                                <SumCol>
                                    <Line label="Qty" value={fmt(totalRetProdQty)} cls="text-orange-600" />
                                    <Line label="Free Qty" value={fmt(totalRetProdFreeQty)} cls="text-emerald-600" />
                                    <Line label="Amount" value={`৳${fmt(totalRetProdAmount)}`} cls="text-orange-600" />
                                </SumCol>
                            </SumBox>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    {loading ? (
                        <ListSkeleton />
                    ) : filteredOrders.length === 0 ? (
                        <Empty text="No orders found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentOrders.map((item, index) => {
                                    const sel = selectedIds.includes(item._id);
                                    const tags = extraTags(item);
                                    const delivered = isDelivered(item);
                                    const phone = getPhoneByName(item.customer);
                                    const addr = getAddr(item) || 'N/A';
                                    return (
                                        <div
                                            key={item._id || index}
                                            className={`relative rounded-xl border pl-3 pr-2 py-1.5 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${delivered ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                            <div className="flex items-center gap-2 min-w-0 mb-px">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    aria-label="Select row"
                                                    className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                                <p className="shrink-0 max-w-[62%] font-bold text-[13px] text-brand-700 truncate leading-tight">{item.customer}</p>
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewDetails(item._id)}
                                                    className="ml-auto min-w-[28px] truncate text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight cursor-pointer"
                                                >
                                                    #{item.invoiceNo || item.orderNo}
                                                </button>
                                                <RowMenu compact items={menuItems(item)} />
                                            </div>
                                            {(phone || item.route) && (
                                                <p className="text-[10px] text-slate-500 leading-tight truncate mb-0.5">
                                                    {phone && <>📞 {phone}</>}
                                                    {item.route ? ` (${item.route})` : ''}
                                                </p>
                                            )}
                                            <div className="flex items-stretch gap-2">
                                                {/* Left: dates + extra/status */}
                                                <div className="min-w-0 flex-1 flex flex-col justify-between gap-1">
                                                    <div className="space-y-0.5 min-w-0">
                                                        <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                            <span className="uppercase text-slate-400 text-[9px]">Order: </span>
                                                            <span className="font-normal">{item.orderDate || 'N/A'}</span>
                                                        </p>
                                                        <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                                            <span className="uppercase text-slate-400 text-[9px]">Delivered: </span>
                                                            <span className="font-normal">{item.deliveryDate || <span className="text-amber-600 font-normal">Not Delivered</span>}</span>
                                                        </p>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1 min-w-0">
                                                        {tags.length > 0 && <ExtraDropdown tags={tags} compact />}
                                                        <span className={`shrink-0 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight ${delivered ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                            {getStatus(item)}
                                                        </span>
                                                        {item.directSales && (
                                                            <span className={`shrink-0 px-1.5 py-px rounded-full text-[9px] font-semibold leading-tight whitespace-nowrap ${MOBILE_TAG.green}`}>
                                                                ⚡ Direct
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right: total + received + address + SR/DSR */}
                                                <div className="shrink-0 w-[128px] flex flex-col items-end justify-between gap-1">
                                                    <div className="w-full space-y-px">
                                                        <div className="flex items-center justify-between rounded bg-brand-50 px-1.5 py-px leading-none">
                                                            <span className="text-[8px] font-semibold text-brand-400">TOTAL</span>
                                                            <span className="text-[10px] text-right [&_*]:!text-[10px] [&_*]:!font-semibold">{renderAmount(item)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between gap-1 rounded bg-slate-50 px-1.5 py-px leading-none">
                                                            <span className="text-[8px] font-semibold text-slate-400">RECV</span>
                                                            <span className="text-[9.5px] text-right [&_*]:!text-[9.5px] [&_*]:!font-semibold">{renderReceived(item)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="w-full text-right space-y-px">
                                                        <p className="text-[9.5px] text-slate-500 leading-tight line-clamp-2 break-words">
                                                            📍 {addr}
                                                        </p>
                                                        <p className="text-[9.5px] text-slate-500 leading-tight truncate">
                                                            <span className="uppercase text-slate-400 text-[8px]">SR: </span>{item.sr || 'N/A'}
                                                            <span className="uppercase text-slate-400 text-[8px]"> • DSR: </span>{item.deliveredBy || 'N/A'}
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
                                <table className="w-full min-w-[1180px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                        <tr>
                                            <th className="w-10 px-3 py-3 text-center">
                                                <input type="checkbox" checked={isAllSelected} onChange={handleSelectAll} aria-label="Select all" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                            </th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">Invoice</th>
                                            <th className="px-3 py-3">Delivery Address</th>
                                            <th className="px-3 py-3">SR</th>
                                            <th className="px-3 py-3">Delivery Man</th>
                                            <th className="px-3 py-3">Total</th>
                                            <th className="px-3 py-3">Received (Due)</th>
                                            <th className="px-3 py-3">Extra</th>
                                            <th className="px-3 py-3">Status</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentOrders.map((item, index) => {
                                            const sel = selectedIds.includes(item._id);
                                            const tags = extraTags(item);
                                            const delivered = isDelivered(item);
                                            const phone = getPhoneByName(item.customer);
                                            return (
                                                <tr key={item._id || index} className={`align-middle ${sel ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}>
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-xs">
                                                        <div className="font-medium text-slate-700">Order: {item.orderDate || 'N/A'}</div>
                                                        <div className="mt-1">
                                                            {item.deliveryDate ? <span className="text-slate-500">Delivered: {item.deliveryDate}</span> : <Pill tone="amber">Not Delivered</Pill>}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{item.customer}</div>
                                                        {phone && <div className="text-[11px] text-slate-400 mt-0.5">📞 {phone}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <button type="button" onClick={() => handleViewDetails(item._id)} className="font-medium text-brand-700 hover:underline cursor-pointer">
                                                            {item.invoiceNo || item.orderNo}
                                                        </button>
                                                        {item.directSales && (
                                                            <div className="mt-1">
                                                                <Pill tone="green">⚡ Direct Delivery</Pill>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-xs text-slate-600 max-w-[190px]">
                                                        <div className="truncate" title={getAddr(item)}>
                                                            {getAddr(item) || 'N/A'}
                                                        </div>
                                                        {item.route && <div className="text-[11px] text-slate-400 mt-0.5">({item.route})</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-600">{item.sr || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-xs text-slate-600">{item.deliveredBy || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{renderAmount(item)}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{renderReceived(item)}</td>
                                                    <td className="px-3 py-3">
                                                        <ExtraDropdown tags={tags} />
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <Pill tone={delivered ? 'green' : 'slate'}>{getStatus(item)}</Pill>
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
                                to={Math.min(indexOfLastItem, filteredOrders.length)}
                                total={filteredOrders.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wholesale;