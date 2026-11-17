import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import toast from 'react-hot-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaPlus, FaEye, FaEdit, FaTrash, FaUndoAlt, FaTruck, FaChevronDown, FaFileInvoice } from 'react-icons/fa';
import useCan from '../../../../hooks/useCan';
import { ComboBox, DateInput, Pager, RowMenu, Skeleton, PopStyle, inputCls, labelCls } from '../Product/ProductUi';

const EXTRA_OPTIONS = ['Others Free', 'Damage', 'Sales Return', 'Bulk Return', 'Previous Get', 'Previous Pay'];

const EMPTY_FILTERS = {
    startDate: '', endDate: '', customer: '', customerContact: '', invoiceNo: '',
    sr: '', deliveredBy: '', address: '', route: '', status: '', due: '',
};

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

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

const hasReturned = (item) =>
    (item.returnHistory || []).some(
        (r) =>
            (Number(r.totalReturnPcs) || 0) > 0 ||
            (Number(r.totalReturnFreeQty) || 0) > 0 ||
            (Number(r.totalReturnFreeItemsQty) || 0) > 0
    );

const getItemExtras = (item) => {
    const list = [];
    if ((item.freeItems || []).length > 0) list.push('Others Free');
    if ((item.damageItems || []).length > 0) list.push('Damage');
    if (hasReturned(item)) list.push('Sales Return');
    if ((item.returnItems || []).length > 0) list.push('Bulk Return');
    if (Number(item.previousBalanceAmount) > 0 && item.previousBalanceType === 'Due') list.push('Previous Get');
    if (Number(item.previousBalanceAmount) > 0 && item.previousBalanceType === 'Get') list.push('Previous Pay');
    return list;
};

const EXTRA_TAGS = {
    Damage: 'bg-red-50 text-red-600',
    'Sales Return': 'bg-violet-50 text-violet-600',
    'Bulk Return': 'bg-fuchsia-50 text-fuchsia-600',
    'Others Free': 'bg-amber-50 text-amber-700',
    'Previous Get': 'bg-sky-50 text-sky-600',
    'Previous Pay': 'bg-rose-50 text-rose-600',
};

const ExtraTags = ({ item }) => {
    const extras = ['Damage', 'Sales Return', 'Bulk Return', 'Others Free', 'Previous Get', 'Previous Pay'].filter((x) =>
        getItemExtras(item).includes(x)
    );
    if (!extras.length) return <span className="text-slate-300 text-xs">N/A</span>;
    return (
        <div className="flex flex-wrap gap-1">
            {extras.map((x) => (
                <span key={x} className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${EXTRA_TAGS[x]}`}>{x}</span>
            ))}
        </div>
    );
};

const StatusPill = ({ status }) => (
    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] whitespace-nowrap ${status === 'Delivered' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
        {status}
    </span>
);

const ReceivedCell = ({ item }) => {
    const status = getStatus(item);
    const payable = Number(item.payableAmount ?? item.grandTotal) || 0;
    return (
        <div>
            {payable <= 0 ? (
                <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-semibold text-[11px]">No Bill</span>
            ) : status !== 'Delivered' || !item.paidAmount ? (
                <span className="inline-block px-2 py-0.5 bg-rose-50 text-rose-700 rounded-full font-semibold text-[11px] whitespace-nowrap">Not Received</span>
            ) : (
                <div className="font-bold">
                    <span className="text-emerald-600">৳{item.paidAmount}</span>{' '}
                    <span className="text-rose-600">({getDue(item)})</span>
                </div>
            )}
            {(item.items || []).some((p) => (Number(p.freeQty) || 0) > 0) && (
                <div className="mt-0.5 text-[10px] font-bold text-emerald-600">Free - Has</div>
            )}
        </div>
    );
};

const AmountCell = ({ item }) => {
    const v = Number(item.payableAmount ?? item.grandTotal) || 0;
    return (
        <div className="font-bold text-brand-700 whitespace-nowrap">
            ৳{fmt(Math.abs(v))}
            {v < 0 && <div className="text-[10px] font-bold text-rose-600">Payable</div>}
        </div>
    );
};

const SumBox = ({ title, tone, children }) => (
    <div className={`rounded-xl border bg-white overflow-hidden ${tone.border}`}>
        <div className={`${tone.head} text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5`}>{title}</div>
        <div className="flex">{children}</div>
    </div>
);

const SumCol = ({ label, rows, returned }) => (
    <div className={`px-3 py-2.5 flex flex-col gap-1 flex-1 ${returned ? 'bg-orange-50 border-l-2 border-dashed border-orange-300' : ''}`}>
        <span className={`text-[10px] font-bold uppercase ${returned ? 'text-orange-500' : 'text-slate-400'}`}>{label}</span>
        {rows.map((r) => (
            <span key={r[0]} className="text-xs font-semibold text-slate-600">
                {r[0]}: <b className={r[2]}>{r[1]}</b>
            </span>
        ))}
    </div>
);

const Wholesale = () => {
    const [orders, setOrders] = useState([]);
    const wsCan = useCan('wholesale');
    const srCan = useCan('sales_return');
    const coCan = useCan('create_order');
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [filtersOpen, setFiltersOpen] = useState(false);

    const [extraFilter, setExtraFilter] = useState([...EXTRA_OPTIONS]);
    const [isExtraOpen, setIsExtraOpen] = useState(false);
    const extraDropdownRef = useRef(null);
    const [returnFilter, setReturnFilter] = useState('');
    const [directOnly, setDirectOnly] = useState(false);

    const [selectedIds, setSelectedIds] = useState([]);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [multiReturnEnabled, setMultiReturnEnabled] = useState(false);

    // Toast: Main.jsx এর Toaster
    const showToast = (message, type = 'success') => {
        if (type === 'error') toast.error(message);
        else toast.success(message);
    };

    useEffect(() => {
        fetch('http://localhost:5000/feature')
            .then((res) => res.json())
            .then((data) => setMultiReturnEnabled(data?.salesMultiReturn === true))
            .catch(() => setMultiReturnEnabled(false));
    }, [location.pathname]);

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

    useEffect(() => {
        const h = (e) => {
            if (extraDropdownRef.current && !extraDropdownRef.current.contains(e.target)) setIsExtraOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const setF = (patch) => {
        setFilters((f) => ({ ...f, ...patch }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setF({ [e.target.name]: e.target.value });

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setExtraFilter([...EXTRA_OPTIONS]);
        setReturnFilter('');
        setDirectOnly(false);
        setIsExtraOpen(false);
        setCurrentPage(1);
    };

    const handleToggleExtra = (opt) => {
        setExtraFilter((prev) => (prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]));
        setCurrentPage(1);
    };

    const getCustomerName = (c) => c.businessName || c.name || '';
    const getPhoneByName = (name) =>
        customers.find((c) => getCustomerName(c).trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';

    // combo options
    const customerOptions = customers
        .filter((c) => {
            const s = filters.customer.toLowerCase();
            return getCustomerName(c).toLowerCase().includes(s) || c.contactNumber?.toLowerCase().includes(s);
        })
        .slice(0, 50)
        .map((c) => ({ key: c._id, title: getCustomerName(c), sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', value: c }));
    const srOptions = users
        .filter((u) => u.role === 'SR' && u.name?.toLowerCase().includes(filters.sr.toLowerCase()))
        .map((u) => ({ key: u._id, title: u.name, value: u }));
    const dsrOptions = users
        .filter((u) => u.role === 'Delivery Man' && u.name?.toLowerCase().includes(filters.deliveredBy.toLowerCase()))
        .map((u) => ({ key: u._id, title: u.name, value: u }));

    const activeFilterCount =
        Object.values(filters).filter(Boolean).length +
        (returnFilter ? 1 : 0) +
        (directOnly ? 1 : 0) +
        (extraFilter.length !== EXTRA_OPTIONS.length ? 1 : 0);

    // ---------- actions ----------
    const handleEdit = (item) => {
        if (!wsCan.canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        navigate('/create-order', { state: { order: item } });
    };
    const handleDelivery = (item) => {
        if (!wsCan.canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        navigate('/create-order', { state: { order: item, mode: 'delivery' } });
    };
    const handleReturn = (id) => {
        if (!srCan.canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');
        navigate(`/sales-return-details/${id}`);
    };
    const handleViewDetails = (id) => navigate(`/sales-details/${id}`);

    const handleDelete = async (id) => {
        if (!wsCan.canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
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
        const status = getStatus(item);
        const list = [{ label: 'View Details', icon: <FaEye size={12} />, onClick: () => handleViewDetails(item._id) }];
        if (status === 'Delivered' && (multiReturnEnabled || (item.returnHistory || []).length === 0))
            list.push({ label: 'Return', icon: <FaUndoAlt size={12} />, tone: 'rose', onClick: () => handleReturn(item._id) });
        if (status !== 'Delivered')
            list.push({ label: 'Delivery', icon: <FaTruck size={12} />, tone: 'emerald', onClick: () => handleDelivery(item) });
        if (!hasReturned(item))
            list.push({ label: 'Edit', icon: <FaEdit size={12} />, onClick: () => handleEdit(item) });
        list.push({ label: 'Delete', icon: <FaTrash size={12} />, tone: 'rose', onClick: () => handleDelete(item._id) });
        return list;
    };

    // ---------- filtering ----------
    const filteredOrders = orders.filter((item) => {
        if (returnFilter === 'yes' && !hasReturned(item)) return false;
        if (returnFilter === 'no' && hasReturned(item)) return false;
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
            const addr = (item.shippingAddress || item.address || '').toLowerCase();
            if (!addr.includes(filters.address.toLowerCase())) return false;
        }
        if (filters.route && !item.route?.toLowerCase().includes(filters.route.toLowerCase())) return false;
        if (filters.status) {
            const st = getStatus(item);
            if (filters.status === 'Delivered' && st !== 'Delivered') return false;
            if (filters.status === 'New Order' && st === 'Delivered') return false;
        }
        if (filters.due) {
            const dueAmt = getDue(item);
            const isDelivered = getStatus(item) === 'Delivered';
            if (filters.due === 'hasDue' && (!isDelivered || dueAmt <= 0)) return false;
            if (filters.due === 'noDue' && (!isDelivered || !item.paidAmount || dueAmt > 0)) return false;
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

    const totalPayable = summaryRows.reduce((s, i) => s + (Number(i.payableAmount ?? i.grandTotal) || 0), 0);
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
            <PopStyle />
            <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0">
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Wholesale Management</h1>
                        <p className="text-slate-500 text-xs sm:text-sm mt-1">Manage and track all wholesale sales orders</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => (coCan.canAdd ? navigate('/create-order') : showToast('আপনার Add করার অনুমতি নেই!', 'error'))}
                        className="inline-flex items-center justify-center gap-2 px-5 min-h-[44px] w-full sm:w-auto bg-brand-600 text-white text-sm font-semibold cursor-pointer"
                    >
                        <FaPlus size={12} /> New Order
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="flex justify-between items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setFiltersOpen((v) => !v)}
                            aria-expanded={filtersOpen}
                            className="lg:cursor-default flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer min-h-[36px]"
                        >
                            <FaFilter className="text-brand-600" /> Filter &amp; Search
                            {activeFilterCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[10px] font-bold">{activeFilterCount}</span>
                            )}
                            <FaChevronDown size={11} className={`lg:hidden transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 h-9 rounded-xl font-semibold cursor-pointer"
                        >
                            <FaRedo size={11} /> Clear
                        </button>
                    </div>

                    <div className={`${filtersOpen ? 'grid' : 'hidden'} lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3 mt-3`}>
                        <div>
                            <span className={labelCls}>Start Date</span>
                            <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                        </div>
                        <div>
                            <span className={labelCls}>End Date</span>
                            <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                        </div>
                        <div>
                            <span className={labelCls}>Customer</span>
                            <ComboBox
                                value={filters.customer}
                                placeholder="Search customer..."
                                options={customerOptions}
                                emptyText="No customer found"
                                onType={(v) => setF({ customer: v, customerContact: '' })}
                                onPick={(o) => setF({ customer: getCustomerName(o.value), customerContact: o.value.contactNumber || '' })}
                                onClear={() => setF({ customer: '', customerContact: '' })}
                            />
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="ws-inv" className="text-xs font-medium text-slate-600">Invoice / Order No</label>
                                <label className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={directOnly}
                                        onChange={(e) => { setDirectOnly(e.target.checked); setCurrentPage(1); }}
                                        className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer"
                                    />
                                    Direct
                                </label>
                            </div>
                            <input id="ws-inv" type="text" name="invoiceNo" placeholder="Search invoice..." value={filters.invoiceNo} onChange={handleFilterChange} className={inputCls} />
                        </div>
                        <div>
                            <span className={labelCls}>SR</span>
                            <ComboBox
                                value={filters.sr}
                                placeholder="Search SR..."
                                options={srOptions}
                                emptyText="No SR found"
                                onType={(v) => setF({ sr: v })}
                                onPick={(o) => setF({ sr: o.value.name })}
                                onClear={() => setF({ sr: '' })}
                            />
                        </div>
                        <div>
                            <span className={labelCls}>Delivery Man</span>
                            <ComboBox
                                value={filters.deliveredBy}
                                placeholder="Search delivery man..."
                                options={dsrOptions}
                                emptyText="No delivery man found"
                                onType={(v) => setF({ deliveredBy: v })}
                                onPick={(o) => setF({ deliveredBy: o.value.name })}
                                onClear={() => setF({ deliveredBy: '' })}
                            />
                        </div>
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
                            <label htmlFor="ws-due" className={labelCls}>Due</label>
                            <select id="ws-due" name="due" value={filters.due} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                <option value="">All</option>
                                <option value="hasDue">Has Due</option>
                                <option value="noDue">Fully Received</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="ws-ret" className={labelCls}>Return</label>
                            <select id="ws-ret" value={returnFilter} onChange={(e) => { setReturnFilter(e.target.value); setCurrentPage(1); }} className={`${inputCls} cursor-pointer`}>
                                <option value="">All</option>
                                <option value="yes">Yes</option>
                                <option value="no">No</option>
                            </select>
                        </div>
                        <div className="relative" ref={extraDropdownRef}>
                            <span className={labelCls}>Extra</span>
                            <button
                                type="button"
                                onClick={() => setIsExtraOpen((v) => !v)}
                                aria-expanded={isExtraOpen}
                                className={`${inputCls} flex items-center justify-between gap-2 text-left cursor-pointer`}
                            >
                                <span className="truncate">
                                    {extraFilter.length === EXTRA_OPTIONS.length ? 'All' : extraFilter.length === 0 ? 'None' : extraFilter.join(', ')}
                                </span>
                                <FaChevronDown size={11} className={`text-slate-400 shrink-0 transition-transform ${isExtraOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isExtraOpen && (
                                <div className="pd-pop absolute z-[60] left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg py-1">
                                    {EXTRA_OPTIONS.map((opt) => (
                                        <label key={opt} className="flex items-center gap-2 px-3 min-h-[40px] hover:bg-brand-50 cursor-pointer text-sm font-medium text-slate-700">
                                            <input
                                                type="checkbox"
                                                checked={extraFilter.includes(opt)}
                                                onChange={() => handleToggleExtra(opt)}
                                                className="w-4 h-4 accent-brand-600 cursor-pointer"
                                            />
                                            {opt}
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setIsSummaryOpen((v) => !v)}
                            aria-expanded={isSummaryOpen}
                            className={`inline-flex items-center gap-2 px-3 min-h-[36px] rounded-full text-xs font-bold cursor-pointer ${isSelectionMode ? 'bg-pink-50 text-pink-700' : 'bg-brand-50 text-brand-700'}`}
                        >
                            {isSelectionMode ? 'Selected' : 'Showing'}
                            <FaChevronDown size={10} className={`transition-transform ${isSummaryOpen ? 'rotate-180' : ''}`} />
                        </button>
                        <span className="text-xs font-semibold text-slate-600">
                            Rows: <b className="text-slate-800">{summaryRows.length}</b>
                        </span>
                        {isSelectionMode && (
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                className="ml-auto text-xs bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 h-9 rounded-xl font-semibold cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {isSummaryOpen && (
                        <div className="pd-pop grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mt-3">
                            <SumBox title="Main Product" tone={{ border: 'border-indigo-200', head: 'bg-brand-600' }}>
                                <SumCol
                                    label="Order"
                                    rows={[
                                        ['Total Qty', fmt(totalMainQty), 'text-brand-700'],
                                        [totalPayable < 0 ? 'Payable Amount' : 'Receivable Amount', `৳${fmt(Math.abs(totalPayable))}`, 'text-brand-700'],
                                        ['Received', `৳${fmt(totalPaid)}`, 'text-emerald-600'],
                                        ['Due', `৳${fmt(totalDue)}`, 'text-rose-600'],
                                        ['Free Qty', fmt(totalMainFreeQty), 'text-emerald-600'],
                                    ]}
                                />
                                <SumCol
                                    returned
                                    label="↩ Returned"
                                    rows={[
                                        ['Qty', fmt(retMainQty), 'text-orange-600'],
                                        ['Free Qty', fmt(retMainFree), 'text-emerald-600'],
                                        ['Amount', `৳${fmt(retMainAmount)}`, 'text-orange-600'],
                                    ]}
                                />
                            </SumBox>
                            <SumBox title="Others Free" tone={{ border: 'border-amber-200', head: 'bg-amber-500' }}>
                                <SumCol label="Order" rows={[['Qty', fmt(totalOthersFreeQty), 'text-amber-600']]} />
                                <SumCol returned label="↩ Returned" rows={[['Qty', fmt(retOthersQty), 'text-orange-600']]} />
                            </SumBox>
                            <SumBox title="Damage Product" tone={{ border: 'border-red-200', head: 'bg-red-500' }}>
                                <SumCol
                                    label="Order"
                                    rows={[
                                        ['Qty', fmt(totalDamageQty), 'text-red-600'],
                                        ['Free Qty', fmt(totalDamageFreeQty), 'text-emerald-600'],
                                        ['Amount', `৳${fmt(totalDamageAmount)}`, 'text-red-600'],
                                    ]}
                                />
                            </SumBox>
                            <SumBox title="Return Product" tone={{ border: 'border-violet-200', head: 'bg-violet-500' }}>
                                <SumCol
                                    label="Order"
                                    rows={[
                                        ['Qty', fmt(totalRetProdQty), 'text-violet-600'],
                                        ['Free Qty', fmt(totalRetProdFreeQty), 'text-emerald-600'],
                                        ['Amount', `৳${fmt(totalRetProdAmount)}`, 'text-violet-600'],
                                    ]}
                                />
                            </SumBox>
                        </div>
                    )}
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <FaFileInvoice className="text-brand-600" /> Wholesale Directory
                        </h2>
                        <span className="px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-full w-fit">
                            Showing {filteredOrders.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredOrders.length)}` : 0} of {filteredOrders.length} ({orders.length} total)
                        </span>
                    </div>

                    {loading ? (
                        <Skeleton rows={6} />
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-14 text-slate-400">
                            <FaFileInvoice size={32} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-medium">No orders found!</p>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-3">
                                {currentOrders.map((item, index) => {
                                    const status = getStatus(item);
                                    const phone = getPhoneByName(item.customer);
                                    const selected = selectedIds.includes(item._id);
                                    return (
                                        <div
                                            key={item._id || index}
                                            className={`rounded-2xl border p-3.5 space-y-3 ${selected ? 'border-pink-300 bg-pink-50/60' : 'border-slate-200 bg-slate-50/60'}`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    aria-label="Select order"
                                                    className="w-5 h-5 mt-0.5 accent-pink-500 cursor-pointer shrink-0"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-bold text-slate-800 break-words">{item.customer}</p>
                                                    {phone && <p className="text-xs text-slate-500">📞 {phone}</p>}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleViewDetails(item._id)}
                                                        className="mt-1 text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-1 rounded-lg cursor-pointer"
                                                    >
                                                        {item.invoiceNo || item.orderNo}
                                                    </button>
                                                    {item.directSales && (
                                                        <span className="ml-1 inline-block px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">⚡ Direct</span>
                                                    )}
                                                </div>
                                                <StatusPill status={status} />
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                <div className="rounded-xl bg-white border border-slate-200 p-2">
                                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Total</p>
                                                    <AmountCell item={item} />
                                                </div>
                                                <div className="rounded-xl bg-white border border-slate-200 p-2">
                                                    <p className="text-[10px] uppercase text-slate-400 font-bold">Received (Due)</p>
                                                    <ReceivedCell item={item} />
                                                </div>
                                            </div>

                                            <div className="text-xs text-slate-600 space-y-0.5">
                                                <p>Order: {item.orderDate || 'N/A'}</p>
                                                <p>{item.deliveryDate ? `Delivered: ${item.deliveryDate}` : 'Not Delivered'}</p>
                                                <p className="break-words">📍 {item.shippingAddress || item.address || 'N/A'}{item.route ? ` (${item.route})` : ''}</p>
                                                <p>SR: {item.sr || 'N/A'} • DSR: {item.deliveredBy || 'N/A'}</p>
                                            </div>

                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${hasReturned(item) ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                        Return: {hasReturned(item) ? 'Yes' : 'No'}
                                                    </span>
                                                    <ExtraTags item={item} />
                                                </div>
                                                <RowMenu items={menuItems(item)} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200">
                                <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-500 uppercase tracking-wide">
                                            <th className="px-3 py-3 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    aria-label="Select all on this page"
                                                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                />
                                            </th>
                                            {['Date', 'Customer', 'Invoice', 'Delivery Address', 'SR', 'Delivery Man', 'Total', 'Received (Due)', 'Return', 'Extra', 'Status'].map((h) => (
                                                <th key={h} className="px-3 py-3 whitespace-nowrap">{h}</th>
                                            ))}
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700 align-middle">
                                        {currentOrders.map((item, index) => {
                                            const status = getStatus(item);
                                            const phone = getPhoneByName(item.customer);
                                            const selected = selectedIds.includes(item._id);
                                            return (
                                                <tr key={item._id || index} className={`transition-colors ${selected ? 'bg-pink-50/70' : 'hover:bg-brand-50/40'}`}>
                                                    <td className="px-3 py-3 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selected}
                                                            onChange={() => handleSelectRow(item._id)}
                                                            aria-label="Select order"
                                                            className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">
                                                        <div className="font-medium">Order: {item.orderDate || 'N/A'}</div>
                                                        <div className="mt-0.5">
                                                            {item.deliveryDate ? (
                                                                <span>Delivered: {item.deliveryDate}</span>
                                                            ) : (
                                                                <span className="inline-block px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full font-semibold text-[10px]">Not Delivered</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{item.customer}</div>
                                                        {phone && <div className="text-[11px] text-slate-400 mt-0.5">📞 {phone}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleViewDetails(item._id)}
                                                            className="text-brand-700 hover:underline font-semibold cursor-pointer"
                                                        >
                                                            {item.invoiceNo || item.orderNo}
                                                        </button>
                                                        {item.directSales && (
                                                            <div>
                                                                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px]">⚡ Direct Delivery</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-slate-600 max-w-[170px]">
                                                        <div className="truncate" title={item.shippingAddress || item.address}>{item.shippingAddress || item.address || 'N/A'}</div>
                                                        {item.route && <div className="text-[11px] text-slate-400 mt-0.5">({item.route})</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">{item.sr || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-slate-600">{item.deliveredBy || 'N/A'}</td>
                                                    <td className="px-3 py-3"><AmountCell item={item} /></td>
                                                    <td className="px-3 py-3 whitespace-nowrap"><ReceivedCell item={item} /></td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${hasReturned(item) ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                            {hasReturned(item) ? 'Yes' : 'No'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3 min-w-[110px]"><ExtraTags item={item} /></td>
                                                    <td className="px-3 py-3"><StatusPill status={status} /></td>
                                                    <td className="px-3 py-3 text-center"><RowMenu items={menuItems(item)} /></td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}

                    {!loading && filteredOrders.length > 0 && (
                        <Pager page={currentPage} total={totalPages} onChange={handlePageChange} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default Wholesale;