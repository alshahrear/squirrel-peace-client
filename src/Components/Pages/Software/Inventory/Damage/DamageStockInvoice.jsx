import React, { useState, useEffect, useRef, useMemo } from 'react';
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

const DamageStockInvoice = () => {
    const [orders, setOrders] = useState([]);
    const [purchaseList, setPurchaseList] = useState([]);
    const [damageReturnList, setDamageReturnList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const location = useLocation();
    const focusEvent = location.state?.focusEvent || null;

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    const [highlightId, setHighlightId] = useState(null);

    const EMPTY_FILTERS = {
        startDate: '',
        endDate: '',
        customer: '',
        invoiceNo: '',
        sr: '',
        deliveredBy: '',
        address: '',
    };
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
            if (!event.target.closest('.action-dropdown-container')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setLoading(true);
        Promise.all([
            fetch('https://squirrel-peace-server.onrender.com/sales').then((res) => res.json()),
            fetch('https://squirrel-peace-server.onrender.com/sales-damage').then((res) => res.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/purchase').then((res) => res.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/damage-return').then((res) => res.json()).catch(() => []),
        ])
            .then(([sales, dmg, purchases, dmgReturns]) => {
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
    const customerOptions = uniq(baseDamageOrders.map((o) => o.customer));
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
            const el = document.getElementById(`dmg-row-${highlightId}`);
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
            .forEach((p) => (p.damageItems || []).forEach((it) => retItems.push(it)));
        damageReturnList.forEach((r) => (r.items || []).forEach((it) => retItems.push(it)));

        retItems.forEach((it) => {
            let m = num(it.totalQty);
            let f = num(it.freeQty);
            for (const l of lineMap.get(keyOf(it)) || []) {
                if (m <= 0 && f <= 0) break;
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

    const isAllSelected =
        currentOrders.length > 0 && currentOrders.every((i) => selectedIds.includes(i._id));

    const handleSelectAll = () => {
        const ids = currentOrders.map((i) => i._id);
        if (isAllSelected) {
            setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        } else {
            setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    // View -> SalesDetails এর Damage section এ scroll করে যাবে
    const handleViewDetails = (id) => {
        setOpenDropdownId(null);
        const target = orders.find((o) => o._id === id);
        if (target?.isStandaloneDamage) {
            navigate(`/damage-details/${id}`);
            return;
        }
        navigate(`/sales-details/${id}`, { state: { scrollTo: 'damage-section' } });
    };

    // Edit -> OrderAdd এ যাবে, শুধু Damage section edit করা যাবে
    const handleEdit = (item) => {
        setOpenDropdownId(null);
        if (item.isStandaloneDamage) {
            const { isStandaloneDamage: _a, status: _b, orderDate: _c, damageItems: _d, ...original } = item;
            navigate('/damage-add', { state: { damage: original } });
            return;
        }
        navigate('/create-order', { state: { order: item, mode: 'damage' } });
    };

    // Delete -> order থেকে শুধু damage products মুছবে
    const handleDelete = (item) => {
        setOpenDropdownId(null);
        if (item.isStandaloneDamage) {
            Swal.fire({
                title: 'Are you sure?',
                text: "You won't be able to revert this!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#4f46e5',
                cancelButtonColor: '#f43f5e',
                confirmButtonText: 'Yes, delete it!'
            }).then(async (result) => {
                if (!result.isConfirmed) return;
                try {
                    const delRes = await fetch(`https://squirrel-peace-server.onrender.com/sales-damage/${item._id}`, { method: 'DELETE' });
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
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (!result.isConfirmed) return;
            try {
                const onlyDamage =
                    !(item.items || []).length &&
                    !(item.freeItems || []).length &&
                    !(item.returnItems || []).length;

                // শুধু Damage থাকলে পুরো order delete হবে
                if (onlyDamage) {
                    const delRes = await fetch(`https://squirrel-peace-server.onrender.com/sales/${item._id}`, { method: 'DELETE' });
                    if (!delRes.ok) throw new Error('Failed');
                    setOrders((prev) => prev.filter((o) => o._id !== item._id));
                    showToast('Order deleted successfully!');
                    return;
                }

                const damageAdj = Number(item.damageAdjustmentAmount) || 0;
                const newPayable = Math.round(((Number(item.payableAmount) || 0) + damageAdj) * 100) / 100;
                const res = await fetch(`https://squirrel-peace-server.onrender.com/sales/${item._id}`, {
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

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
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
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Damage Invoice
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Delivered orders with damage products</p>
                    </div>

                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Damage Directory</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {damageOrders.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, damageOrders.length)}` : 0} of {damageOrders.length}
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
                                label="Customer"
                                placeholder="Search or select customer..."
                                value={filters.customer}
                                options={customerOptions}
                                onChange={(v) => setFilter('customer', v)}
                            />

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice / Order No</label>
                                <input
                                    type="text"
                                    placeholder="Search invoice..."
                                    value={filters.invoiceNo}
                                    onChange={(e) => setFilter('invoiceNo', e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            <FilterSelect
                                label="SR"
                                placeholder="Search or select SR..."
                                value={filters.sr}
                                options={srOptions}
                                onChange={(v) => setFilter('sr', v)}
                            />

                            <FilterSelect
                                label="Delivery Man"
                                placeholder="Search or select delivery man..."
                                value={filters.deliveredBy}
                                options={deliveryOptions}
                                onChange={(v) => setFilter('deliveredBy', v)}
                            />

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Address</label>
                                <input
                                    type="text"
                                    placeholder="Search address..."
                                    value={filters.address}
                                    onChange={(e) => setFilter('address', e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading...</div>
                    ) : damageOrders.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No damage orders found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-1.5 [&_th]:py-2.5 [&_th]:text-[10px] [&_th]:whitespace-normal [&_td]:px-1.5 [&_td]:py-2.5 [&_td]:text-[11px] [&_td]:whitespace-normal [&_td_span]:text-[9px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[10px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="w-8 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3 px-2.5">Date</th>
                                        <th className="py-3 px-2.5">Customer</th>
                                        <th className="py-3 px-2.5">Invoice</th>
                                        <th className="py-3 px-2.5">Delivery Address</th>
                                        <th className="py-3 px-2.5">SR</th>
                                        <th className="py-3 px-2.5">Delivery Man</th>

                                        <th className="py-3 px-2.5 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {currentOrders.map((item, index) => (
                                        <tr
                                            key={item._id || index}
                                            id={`dmg-row-${item._id}`}
                                            data-hl={highlightId === String(item._id) ? '1' : undefined}
                                            className={`transition duration-150 ${highlightId === String(item._id) ? 'bg-amber-100 ring-2 ring-inset ring-amber-400' : selectedIds.includes(item._id) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}
                                        >
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(item._id)}
                                                    onChange={() => handleSelectRow(item._id)}
                                                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3 px-2.5 text-gray-600 whitespace-nowrap">
                                                <div className="font-medium">
                                                    {item.isStandaloneDamage
                                                        ? (item.damageDate || 'N/A')
                                                        : (item.deliveryDate || item.orderDate || 'N/A')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-2.5 font-bold text-gray-800 whitespace-nowrap">{item.customer || 'N/A'}</td>
                                            <td className="py-3 px-2.5 text-gray-600 font-medium whitespace-nowrap">
                                                <div>{item.invoiceNo || item.orderNo}</div>
                                                {!item.isStandaloneDamage && (
                                                    <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm">
                                                        From Sales
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-2.5 text-gray-600 whitespace-nowrap max-w-[140px] overflow-hidden text-ellipsis">
                                                <div>{item.shippingAddress || item.address || 'N/A'}</div>
                                                {item.route && (
                                                    <div className="text-[10px] text-gray-400 mt-0.5">({item.route})</div>
                                                )}
                                            </td>
                                            <td className="py-3 px-2.5 text-gray-600 whitespace-nowrap">{item.sr || 'N/A'}</td>
                                            <td className="py-3 px-2.5 text-gray-600 whitespace-nowrap">{item.deliveredBy || 'N/A'}</td>

                                            <td className="py-3 px-2.5 text-center relative">
                                                <div className="relative inline-block action-dropdown-container">
                                                    <button
                                                        onClick={() =>
                                                            setOpenDropdownId(openDropdownId === item._id ? null : item._id)
                                                        }
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
                                                                className="order-last w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-rose-500">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                </svg>
                                                                Delete
                                                            </button>

                                                            <button
                                                                onClick={() => handleViewDetails(item._id)}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-slate-500">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                </svg>
                                                                View
                                                            </button>

                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                style={lockedIds.has(String(item._id)) ? { display: 'none' } : undefined}
                                                                className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-3.5 h-3.5 text-indigo-500">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                                                                </svg>
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

                    {!loading && damageOrders.length > 0 && (
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
        </div>
    );
};

export default DamageStockInvoice;