import React, { useState, useEffect, useMemo } from 'react';
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

const DamageStockInvoice = () => {
    const { canEdit, canDelete } = useCan('damage_stock_invoice');
    const [orders, setOrders] = useState([]);
    const [customerList, setCustomerList] = useState([]);
    const [purchaseList, setPurchaseList] = useState([]);
    const [damageReturnList, setDamageReturnList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const focusEvent = location.state?.focusEvent || null;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [selectedIds, setSelectedIds] = useState([]);
    const [highlightId, setHighlightId] = useState(null);

    const EMPTY_FILTERS = {
        startDate: '',
        endDate: '',
        customer: '',
        customerContact: '',
        invoiceNo: '',
        sr: '',
        deliveredBy: '',
        address: '',
    };
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('http://localhost:5000/sales').then((res) => res.json()),
            fetch('http://localhost:5000/sales-damage').then((res) => res.json()).catch(() => []),
            fetch('http://localhost:5000/purchase').then((res) => res.json()).catch(() => []),
            fetch('http://localhost:5000/damage-return').then((res) => res.json()).catch(() => []),
            fetch('http://localhost:5000/customer').then((res) => res.json()).catch(() => []),
        ])
            .then(([sales, dmg, purchases, dmgReturns, custs]) => {
                setCustomerList(Array.isArray(custs) ? custs : []);
                setPurchaseList(Array.isArray(purchases) ? purchases : []);
                setDamageReturnList(Array.isArray(dmgReturns) ? dmgReturns : []);
                const salesList = Array.isArray(sales) ? sales : [];
                const dmgList = (Array.isArray(dmg) ? dmg : []).map((d) => ({
                    ...d,
                    isStandaloneDamage: true,
                    status: 'Delivered',
                    orderDate: d.damageDate,
                    damageItems: d.items || [],
                }));
                const merged = [...salesList, ...dmgList].sort((a, b) =>
                    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
                );
                setOrders(merged);
            })
            .catch((error) => console.error('Error fetching orders:', error))
            .finally(() => setLoading(false));
    }, [location.pathname]);

    // শুধু Delivered + Damage product আছে এমন order
    const baseDamageOrders = orders.filter(
        (item) => item.status === 'Delivered' && (item.damageItems || []).length > 0
    );

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const getPhoneByName = (name) =>
        customerList.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';
    const srOptions = uniq(baseDamageOrders.map((o) => o.sr));
    const deliveryOptions = uniq(baseDamageOrders.map((o) => o.deliveredBy));

    const has = (val, q) => (val || '').toString().toLowerCase().includes(q.toLowerCase());

    const damageOrders = baseDamageOrders.filter((item) => {
        if (filters.startDate || filters.endDate) {
            const od = parseToLocalDate(item.orderDate);
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
        if (filters.customer && !has(item.customer, filters.customer)) return false;
        if (filters.customerContact) {
            const phone = getPhoneByName(item.customer);
            if (phone && phone !== filters.customerContact) return false;
        }
        if (filters.invoiceNo && !has(item.invoiceNo || item.orderNo, filters.invoiceNo)) return false;
        if (filters.sr && !has(item.sr, filters.sr)) return false;
        if (filters.deliveredBy && !has(item.deliveredBy, filters.deliveredBy)) return false;
        if (filters.address && !has(item.shippingAddress || item.address, filters.address)) return false;
        return true;
    });

    // History theke Open korle oi invoice highlight hobe
    useEffect(() => {
        if (focusEvent?.id) setHighlightId(String(focusEvent.id));
    }, [focusEvent]);

    useEffect(() => {
        if (!highlightId || loading) return;
        const idx = damageOrders.findIndex((o) => String(o._id) === highlightId);
        if (idx >= 0) setCurrentPage(Math.floor(idx / itemsPerPage) + 1);
        const t = setTimeout(() => {
            const els = [
                document.getElementById(`dmg-row-${highlightId}`),
                document.getElementById(`dmg-card-${highlightId}`),
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

    // Company te return hoye geche emon damage invoice gulo (Edit lock hobe)
    const lockedIds = useMemo(() => {
        const keyOf = (it) =>
            `${(it.productName || '').toString().trim().toLowerCase()}|${(it.company || '').toString().trim().toLowerCase()}`;
        const num = (v) => Number(v) || 0;

        const invs = orders
            .filter((o) => o.status === 'Delivered' && (o.damageItems || []).length > 0)
            .map((o) => ({
                id: String(o._id),
                ts: Date.parse(o.isStandaloneDamage ? o.createdAt : (o.damageAt || o.createdAt)) || 0,
                items: o.damageItems || [],
            }))
            .sort((a, b) => a.ts - b.ts);

        const lineMap = new Map();
        invs.forEach((inv) => {
            const m = new Map();
            inv.items.forEach((it) => {
                const k = keyOf(it);
                if (!m.has(k)) m.set(k, { invId: inv.id, main: 0, free: 0, retMain: 0, retFree: 0 });
                const l = m.get(k);
                l.main += num(it.totalQty);
                l.free += num(it.freeQty);
            });
            m.forEach((l, k) => {
                if (!lineMap.has(k)) lineMap.set(k, []);
                lineMap.get(k).push(l);
            });
        });

        const retItems = [];
        purchaseList
            .filter((p) => (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') && (p.damageItems || []).length > 0)
            .forEach((p) => (p.damageItems || []).forEach((it) => retItems.push({ ...it, _ts: Date.parse(p.damageAt || p.createdAt) || 0 })));
        damageReturnList.forEach((r) => (r.items || []).forEach((it) => retItems.push({ ...it, _ts: Date.parse(r.createdAt) || 0 })));

        retItems.forEach((it) => {
            let m = num(it.totalQty) - num(it.mainFromFree) + num(it.freeFromMain);
            let f = num(it.freeQty) - num(it.freeFromMain) + num(it.mainFromFree);
            for (const l of lineMap.get(keyOf(it)) || []) {
                if (m <= 0 && f <= 0) break;
                if (!it._ts || l.ts > it._ts) continue;
                const tm = Math.max(Math.min(m, l.main - l.retMain), 0);
                const tf = Math.max(Math.min(f, l.free - l.retFree), 0);
                l.retMain += tm;
                l.retFree += tf;
                m -= tm;
                f -= tf;
            }
        });

        const set = new Set();
        lineMap.forEach((lines) =>
            lines.forEach((l) => {
                if (l.retMain > 0 || l.retFree > 0) set.add(l.invId);
            })
        );
        return set;
    }, [orders, purchaseList, damageReturnList]);

    const selectedRows = damageOrders.filter((i) => selectedIds.includes(i._id));
    const isSelectionMode = selectedRows.length > 0;

    const totalPages = Math.ceil(damageOrders.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = damageOrders.slice(indexOfFirstItem, indexOfLastItem);

    const isAllSelected = currentOrders.length > 0 && currentOrders.every((i) => selectedIds.includes(i._id));

    const handleSelectAll = () => {
        const ids = currentOrders.map((i) => i._id);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };

    const handleSelectRow = (id) =>
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

    // View -> SalesDetails এর Damage section এ scroll করে যাবে
    const handleViewDetails = (id) => {
        const target = orders.find((o) => o._id === id);
        if (target?.isStandaloneDamage) {
            navigate(`/damage-details/${id}`);
            return;
        }
        navigate(`/sales-details/${id}`, { state: { scrollTo: 'damage-section' } });
    };

    // Edit -> OrderAdd এ যাবে, শুধু Damage section edit করা যাবে
    const handleEdit = (item) => {
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        if (item.isStandaloneDamage) {
            const { isStandaloneDamage: _a, status: _b, orderDate: _c, damageItems: _d, ...original } = item;
            navigate('/damage-add', { state: { damage: original } });
            return;
        }
        navigate('/create-order', { state: { order: item, mode: 'damage' } });
    };

    // Delete -> order থেকে শুধু damage products মুছবে
    const handleDelete = (item) => {
        if (!canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        if (item.isStandaloneDamage) {
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
                    const delRes = await fetch(`http://localhost:5000/sales-damage/${item._id}`, { method: 'DELETE' });
                    if (!delRes.ok) throw new Error('Failed');
                    setOrders((prev) => prev.filter((o) => o._id !== item._id));
                    setSelectedIds((prev) => prev.filter((x) => x !== item._id));
                    showToast('Damage deleted successfully!');
                } catch (error) {
                    console.error(error);
                    showToast('Failed to delete!', 'error');
                }
            });
            return;
        }
        Swal.fire({
            title: 'Are you sure?',
            text:
                !(item.items || []).length && !(item.freeItems || []).length && !(item.returnItems || []).length
                    ? 'এই order এ শুধু Damage Product আছে, তাই পুরো order (invoice) মুছে যাবে!'
                    : 'এই order এর সব Damage Product মুছে যাবে!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4a58e6',
            cancelButtonColor: '#e11d48',
            confirmButtonText: 'Yes, delete it!',
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const onlyDamage =
                    !(item.items || []).length &&
                    !(item.freeItems || []).length &&
                    !(item.returnItems || []).length;

                // শুধু Damage থাকলে পুরো order delete হবে
                if (onlyDamage) {
                    const delRes = await fetch(`http://localhost:5000/sales/${item._id}`, { method: 'DELETE' });
                    if (!delRes.ok) throw new Error('Failed');
                    setOrders((prev) => prev.filter((o) => o._id !== item._id));
                    showToast('Order deleted successfully!');
                    return;
                }

                const damageAdj = Number(item.damageAdjustmentAmount) || 0;
                const newPayable = Math.round(((Number(item.payableAmount) || 0) + damageAdj) * 100) / 100;
                const res = await fetch(`http://localhost:5000/sales/${item._id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        damageItems: [],
                        payableAmount: newPayable,
                        unsetFields: ['damageAdjustmentAmount'],
                    }),
                });
                if (!res.ok) throw new Error('Failed');
                setOrders((prev) =>
                    prev.map((o) => {
                        if (o._id !== item._id) return o;
                        const { damageAdjustmentAmount: _d, ...rest } = o;
                        return { ...rest, damageItems: [], payableAmount: newPayable };
                    })
                );
                showToast('Damage products deleted successfully!');
            } catch (error) {
                console.error('Error deleting damage:', error);
                showToast('Failed to delete!', 'error');
            }
        });
    };

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const menuItems = (item) => [
        { label: 'View', onClick: () => handleViewDetails(item._id) },
        { label: 'Edit', tone: 'brand', hidden: lockedIds.has(String(item._id)), onClick: () => handleEdit(item) },
        { label: 'Delete', tone: 'danger', onClick: () => handleDelete(item) },
    ];

    // Amount + status (table + card e same)
    const renderAmount = (item) => {
        if (item.isStandaloneDamage && !item.customerId) return <Pill tone="orange">From Stock</Pill>;
        const amount = item.isStandaloneDamage
            ? Number(item.damageAmount) || 0
            : (item.damageItems || []).reduce((s, it) => s + (Number(it.itemTotal ?? it.subtotal) || 0), 0);

        let status;
        if (item.isStandaloneDamage) {
            const paid = item.payment ? Number(item.payment.amount) || 0 : 0;
            status = item.payment ? (
                <div className="text-[11px] font-bold">
                    <span className="text-emerald-600">Paid: ৳{fmt(paid)}</span>
                    <span className="text-rose-600 ml-1">(Due: {fmt(Math.max(amount - paid, 0))})</span>
                </div>
            ) : (
                <Pill tone="slate">Not Paid</Pill>
            );
        } else {
            const adj = Number(item.damageAdjustmentAmount) || 0;
            status = adj > 0 ? <Pill tone="brand">Adjusted: ৳{fmt(adj)}</Pill> : <Pill tone="slate">Not Paid</Pill>;
        }
        return (
            <div className="space-y-0.5">
                <div className="font-bold text-rose-600">৳{fmt(amount)}</div>
                {status}
            </div>
        );
    };

    const dateOf = (item) =>
        item.isStandaloneDamage ? item.damageDate || 'N/A' : item.deliveryDate || item.orderDate || 'N/A';

    const activeCount = ['startDate', 'endDate', 'customer', 'invoiceNo', 'sr', 'deliveredBy', 'address'].filter((k) => filters[k]).length;

    const customerOptions = customerList
        .filter((c) => {
            const s = (filters.customer || '').toLowerCase();
            return (c.businessName || '').toLowerCase().includes(s) || (c.contactNumber || '').toLowerCase().includes(s);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber ? `📞 ${c.contactNumber}` : '', raw: c }));

    const simpleOptions = (arr, q) =>
        arr.filter((o) => o.toLowerCase().includes((q || '').toLowerCase())).map((o) => ({ key: o, title: o, raw: o }));

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Damage Invoice</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Delivered orders with damage products</p>
                </div>

                {/* Filter */}
                <FilterPanel activeCount={activeCount} onClear={handleClearFilters} cols="lg:grid-cols-4 xl:grid-cols-7">
                    <div>
                        <span className={labelCls}>Start Date</span>
                        <DateInput name="startDate" value={filters.startDate} onChange={(e) => setFilter(e.target.name, e.target.value)} placeholder="Start date" />
                    </div>
                    <div>
                        <span className={labelCls}>End Date</span>
                        <DateInput name="endDate" value={filters.endDate} onChange={(e) => setFilter(e.target.name, e.target.value)} placeholder="End date" />
                    </div>
                    <ComboField
                        label="Customer"
                        value={filters.customer}
                        placeholder="Search customer..."
                        options={customerOptions}
                        onType={(v) => {
                            setFilters((prev) => ({ ...prev, customer: v, customerContact: '' }));
                            setCurrentPage(1);
                        }}
                        onClear={() => {
                            setFilters((prev) => ({ ...prev, customer: '', customerContact: '' }));
                            setCurrentPage(1);
                        }}
                        onPick={(o) => {
                            setFilters((prev) => ({ ...prev, customer: o.raw.businessName, customerContact: o.raw.contactNumber || '' }));
                            setCurrentPage(1);
                        }}
                    />
                    <div>
                        <label className={labelCls}>Invoice / Order No</label>
                        <input type="text" placeholder="Search invoice..." value={filters.invoiceNo} onChange={(e) => setFilter('invoiceNo', e.target.value)} className={inputCls} />
                    </div>
                    <ComboField
                        label="SR"
                        value={filters.sr}
                        placeholder="Search or select SR..."
                        options={simpleOptions(srOptions, filters.sr)}
                        onType={(v) => setFilter('sr', v)}
                        onClear={() => setFilter('sr', '')}
                        onPick={(o) => setFilter('sr', o.raw)}
                    />
                    <ComboField
                        label="Delivery Man"
                        value={filters.deliveredBy}
                        placeholder="Search or select..."
                        options={simpleOptions(deliveryOptions, filters.deliveredBy)}
                        onType={(v) => setFilter('deliveredBy', v)}
                        onClear={() => setFilter('deliveredBy', '')}
                        onPick={(o) => setFilter('deliveredBy', o.raw)}
                    />
                    <div>
                        <label className={labelCls}>Address</label>
                        <input type="text" placeholder="Search address..." value={filters.address} onChange={(e) => setFilter('address', e.target.value)} className={inputCls} />
                    </div>
                </FilterPanel>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 px-1.5 sm:px-0">
                        <div className="flex items-center gap-2">
                            <Pill tone={isSelectionMode ? 'rose' : 'brand'}>{isSelectionMode ? 'Selected' : 'Showing'}</Pill>
                            <span className="text-sm text-slate-600">
                                Rows: <b className="text-slate-800">{isSelectionMode ? selectedRows.length : damageOrders.length}</b>
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
                    ) : damageOrders.length === 0 ? (
                        <Empty text="No damage orders found!" />
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentOrders.map((item, index) => {
                                    const sel = selectedIds.includes(item._id);
                                    const hl = highlightId === String(item._id);
                                    const phone = getPhoneByName(item.customer);
                                    return (
                                        <div
                                            key={item._id || index}
                                            id={`dmg-card-${item._id}`}
                                            data-hl={hl ? '1' : undefined}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${hl ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-300' : sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${item.isStandaloneDamage ? 'bg-orange-400' : 'bg-brand-500'}`} />
                                            <div className="flex items-center gap-2 min-w-0 mb-1">
                                                <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="shrink-0 w-4 h-4 accent-brand-600 cursor-pointer" />
                                                <p className="min-w-0 font-bold text-[13px] text-brand-700 truncate leading-tight">{item.customer || 'No Customer'}</p>
                                                <span className="ml-auto shrink-0 max-w-[40%] truncate text-[10px] font-semibold text-slate-600 bg-slate-100 rounded-full px-1.5 py-px leading-tight">
                                                    #{item.invoiceNo || item.orderNo}
                                                </span>
                                                <RowMenu compact items={menuItems(item)} />
                                            </div>
                                            <div className="flex items-stretch gap-2">
                                                <div className="min-w-0 flex-1 space-y-0.5 text-[10.5px] text-slate-500 leading-snug">
                                                    <p className="truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Date: </span>{dateOf(item)}
                                                        {!item.isStandaloneDamage && (
                                                            <span className="ml-1 px-1.5 py-px rounded-full bg-violet-50 text-violet-700 text-[9px] font-bold">From Sales</span>
                                                        )}
                                                    </p>
                                                    {phone && <p className="truncate">📞 {phone}</p>}
                                                    <p className="truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Addr: </span>
                                                        {item.shippingAddress || item.address || 'N/A'}{item.route ? ` (${item.route})` : ''}
                                                    </p>
                                                    <p className="truncate">
                                                        <span className="uppercase text-slate-400 font-bold">SR: </span>{item.sr || 'N/A'}
                                                        <span className="uppercase text-slate-400 font-bold ml-2">DM: </span>{item.deliveredBy || 'N/A'}
                                                    </p>
                                                    {item.isStandaloneDamage && item.collectedBy && (
                                                        <p className="truncate">
                                                            <span className="uppercase text-slate-400 font-bold">Collected: </span>{item.collectedBy}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 w-[112px] flex flex-col items-end justify-end text-right text-[11px]">
                                                    <p className="text-[9px] uppercase font-bold text-slate-400 leading-none mb-1">Damage Amount</p>
                                                    {renderAmount(item)}
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
                                            <th className="px-3 py-3">Customer</th>
                                            <th className="px-3 py-3">Collected By</th>
                                            <th className="px-3 py-3">Invoice</th>
                                            <th className="px-3 py-3">Delivery Address</th>
                                            <th className="px-3 py-3">SR</th>
                                            <th className="px-3 py-3">Delivery Man</th>
                                            <th className="px-3 py-3">Damage Amount</th>
                                            <th className="px-3 py-3 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {currentOrders.map((item, index) => {
                                            const sel = selectedIds.includes(item._id);
                                            const hl = highlightId === String(item._id);
                                            const phone = getPhoneByName(item.customer);
                                            return (
                                                <tr
                                                    key={item._id || index}
                                                    id={`dmg-row-${item._id}`}
                                                    data-hl={hl ? '1' : undefined}
                                                    className={`align-middle ${hl ? 'bg-amber-100 ring-2 ring-inset ring-amber-400' : sel ? 'bg-brand-50/60' : 'hover:bg-slate-50'}`}
                                                >
                                                    <td className="px-3 py-3 text-center">
                                                        <input type="checkbox" checked={sel} onChange={() => handleSelectRow(item._id)} aria-label="Select row" className="w-4 h-4 accent-brand-600 cursor-pointer" />
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium text-slate-600">{dateOf(item)}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">
                                                        <div className="font-bold text-slate-800">{item.customer || 'N/A'}</div>
                                                        {phone && <div className="text-[10px] text-slate-400 mt-0.5">📞 {phone}</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{item.isStandaloneDamage ? item.collectedBy || 'N/A' : 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap font-medium">
                                                        <div>{item.invoiceNo || item.orderNo}</div>
                                                        {!item.isStandaloneDamage && <div className="mt-0.5"><Pill tone="brand">From Sales</Pill></div>}
                                                    </td>
                                                    <td className="px-3 py-3 max-w-[180px]">
                                                        <div className="truncate">{item.shippingAddress || item.address || 'N/A'}</div>
                                                        {item.route && <div className="text-[10px] text-slate-400 mt-0.5">({item.route})</div>}
                                                    </td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{item.sr || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{item.deliveredBy || 'N/A'}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap">{renderAmount(item)}</td>
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
                                to={Math.min(indexOfLastItem, damageOrders.length)}
                                total={damageOrders.length}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DamageStockInvoice;