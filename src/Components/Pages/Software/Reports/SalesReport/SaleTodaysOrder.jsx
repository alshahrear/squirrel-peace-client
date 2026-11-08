import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;
const fmt = (v) => n(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

const parseToLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = String(dateStr).split(',')[0].trim();
    if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        if (!d || !m || !y) return null;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
        const [y, m, d] = datePart.slice(0, 10).split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(datePart);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const isToday = (dateStr) => {
    const d = parseToLocalDate(dateStr);
    if (!d) return false;
    const t = new Date();
    return d.getFullYear() === t.getFullYear() && d.getMonth() === t.getMonth() && d.getDate() === t.getDate();
};

// Searchable dropdown (SR / Delivery Man)
const FilterSelect = ({ label, placeholder, value, options, onChange, emptyText }) => {
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
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                            setOpen(false);
                        }}
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
                                onClick={() => {
                                    onChange(o);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                            >
                                {o}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const CustomerFilterSelect = ({ value, customers, onSelect, onType, onClear }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const s = (value || '').toLowerCase();
    const list = customers.filter(
        (c) =>
            (c.businessName || c.name || '').toLowerCase().includes(s) ||
            (c.contactNumber || '').toLowerCase().includes(s)
    );

    return (
        <div className="relative" ref={ref}>
            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer</label>
            <div
                onClick={() => setOpen(true)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
            >
                <input
                    type="text"
                    placeholder="Search or select customer..."
                    value={value}
                    onChange={(e) => {
                        onType(e.target.value);
                        setOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                            setOpen(false);
                        }}
                        className="text-gray-400 hover:text-red-500 pl-1"
                    >
                        <FaTimes size={10} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                    {list.length > 0 ? (
                        list.map((c) => (
                            <div
                                key={c._id}
                                onClick={() => {
                                    onSelect(c);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                            >
                                <p className="text-xs font-semibold text-gray-800">{c.businessName || c.name}</p>
                                {c.contactNumber && (
                                    <p className="text-[11px] text-gray-500 mt-0.5">📞 {c.contactNumber}</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">No customer found</div>
                    )}
                </div>
            )}
        </div>
    );
};

const SaleTodaysOrder = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [orders, setOrders] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const EMPTY_FILTERS = {
        invoiceNo: '',
        customer: '',
        customerContact: '',
        sr: '',
        deliveredBy: '',
        address: '',
    };
    const [filters, setFilters] = useState(EMPTY_FILTERS);

    useEffect(() => {
        const load = async () => {
            try {
                const [oRes, cRes, uRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/sales'),
                    fetch('https://squirrel-peace-server.onrender.com/customer'),
                    fetch('https://squirrel-peace-server.onrender.com/user'),
                ]);
                const oData = await oRes.json();
                const cData = await cRes.json().catch(() => []);
                const uData = await uRes.json().catch(() => []);
                setOrders(Array.isArray(oData) ? [...oData].reverse() : []);
                setCustomers(Array.isArray(cData) ? cData : []);
                setUsers(Array.isArray(uData) ? uData : []);
            } catch (error) {
                console.error('Error fetching todays order data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [location.pathname]);

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const handleFilterChange = (e) => setFilter(e.target.name, e.target.value);

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const getPhoneByName = (name) =>
        customers.find(
            (c) => (c.businessName || c.name || '').trim().toLowerCase() === (name || '').trim().toLowerCase()
        )?.contactNumber || '';
    const srOptions = uniq(users.filter((u) => u.role === 'SR').map((u) => u.name));
    const deliveryOptions = uniq(users.filter((u) => u.role === 'Delivery Man').map((u) => u.name));

    const has = (val, q) => String(val || '').toLowerCase().includes(String(q).toLowerCase());

    const getTotal = (o) => n(o.payableAmount ?? o.grandTotal);

    // Shudhu ajker date er New Order (direct sales na, delivered na)
    const todaysOrders = orders.filter(
        (o) => !o.directSales && o.status !== 'Delivered' && isToday(o.orderDate)
    );

    const filteredOrders = todaysOrders.filter((o) => {
        if (filters.invoiceNo && !has(o.invoiceNo || o.orderNo, filters.invoiceNo)) return false;
        if (filters.customer && !has(o.customer, filters.customer)) return false;
        if (filters.customerContact) {
            const phone = getPhoneByName(o.customer);
            if (phone && phone !== filters.customerContact) return false;
        }
        if (filters.sr && !has(o.sr, filters.sr)) return false;
        if (filters.deliveredBy && !has(o.deliveredBy, filters.deliveredBy)) return false;
        if (filters.address && !has(o.shippingAddress || o.address, filters.address)) return false;
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (num) => {
        if (num >= 1 && num <= totalPages) setCurrentPage(num);
    };

    const summaryTotal = filteredOrders.reduce((s, o) => s + getTotal(o), 0);

    const handleInvoiceClick = (id) => {
        navigate(`/sales-details/${id}`, { state: { fromReport: true } });
    };

    const todayLabel = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });

    const NA = <span className="text-gray-300 font-semibold">N/A</span>;

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Todays Sale
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">আজকের ({todayLabel}) সব New Order — যেগুলো এখনো Delivered হয়নি</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Todays New Orders</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredOrders.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredOrders.length)}` : 0} of {filteredOrders.length} ({todaysOrders.length} total)
                        </span>
                    </div>

                    {/* Filter Panel */}
                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button
                                onClick={handleClearFilters}
                                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                            >
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {/* Invoice */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice Number</label>
                                <input
                                    type="text"
                                    name="invoiceNo"
                                    placeholder="Search invoice..."
                                    value={filters.invoiceNo}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Customer */}
                            <CustomerFilterSelect
                                value={filters.customer}
                                customers={customers}
                                onType={(v) => {
                                    setFilters((prev) => ({ ...prev, customer: v, customerContact: '' }));
                                    setCurrentPage(1);
                                }}
                                onSelect={(c) => {
                                    setFilters((prev) => ({
                                        ...prev,
                                        customer: c.businessName || c.name,
                                        customerContact: c.contactNumber || '',
                                    }));
                                    setCurrentPage(1);
                                }}
                                onClear={() => {
                                    setFilters((prev) => ({ ...prev, customer: '', customerContact: '' }));
                                    setCurrentPage(1);
                                }}
                            />

                            {/* SR */}
                            <FilterSelect
                                label="SR"
                                placeholder="Search or select SR..."
                                value={filters.sr}
                                options={srOptions}
                                onChange={(v) => setFilter('sr', v)}
                                emptyText="No SR found"
                            />

                            {/* Delivery Man */}
                            <FilterSelect
                                label="Delivery Man"
                                placeholder="Search or select delivery man..."
                                value={filters.deliveredBy}
                                options={deliveryOptions}
                                onChange={(v) => setFilter('deliveredBy', v)}
                                emptyText="No delivery man found"
                            />

                            {/* Address */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Delivery Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Search address..."
                                    value={filters.address}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-700">
                            Today: {todayLabel}
                        </span>
                        <span className="font-semibold text-gray-600">
                            Orders: <b className="text-gray-800">{filteredOrders.length}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Amount: <b className="text-indigo-600">৳{fmt(summaryTotal)}</b>
                        </span>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading orders...</div>
                    ) : filteredOrders.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">Ajker kono new order nai!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-3 py-3">Customer</th>
                                        <th className="px-3 py-3">Invoice</th>
                                        <th className="px-3 py-3">Delivery Address</th>
                                        <th className="px-3 py-3">SR</th>
                                        <th className="px-3 py-3">Delivery Man</th>
                                        <th className="px-3 py-3">Total Amount</th>
                                        <th className="px-3 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {currentOrders.map((o, index) => {
                                        const total = getTotal(o);
                                        return (
                                            <tr
                                                key={o._id || index}
                                                className="transition duration-150 hover:bg-indigo-50/40"
                                            >
                                                {/* Date */}
                                                <td className="px-3 py-3 whitespace-nowrap text-gray-600">
                                                    <div className="font-medium">Order: {o.orderDate || 'N/A'}</div>
                                                </td>

                                                {/* Customer */}
                                                <td className="px-3 py-3 whitespace-nowrap font-bold text-gray-800">
                                                    <div>{o.customer || 'N/A'}</div>
                                                    {getPhoneByName(o.customer) && (
                                                        <div className="text-[11px] font-medium text-gray-400 mt-0.5">📞 {getPhoneByName(o.customer)}</div>
                                                    )}
                                                </td>

                                                {/* Invoice */}
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleInvoiceClick(o._id)}
                                                        className="text-indigo-700 hover:text-pink-600 hover:underline font-bold cursor-pointer transition-colors"
                                                    >
                                                        {o.invoiceNo || o.orderNo}
                                                    </button>
                                                </td>

                                                {/* Delivery Address */}
                                                <td className="px-3 py-3 text-gray-600 max-w-[200px]">
                                                    <div className="truncate">{o.shippingAddress || o.address || 'N/A'}</div>
                                                    {o.route && (
                                                        <div className="text-[11px] text-gray-400 mt-0.5">({o.route})</div>
                                                    )}
                                                </td>

                                                {/* SR */}
                                                <td className="px-3 py-3 whitespace-nowrap text-gray-600">{o.sr || NA}</td>

                                                {/* Delivery Man */}
                                                <td className="px-3 py-3 whitespace-nowrap text-gray-600">{o.deliveredBy || NA}</td>

                                                {/* Total Amount */}
                                                <td className="px-3 py-3 whitespace-nowrap font-bold text-indigo-600">
                                                    ৳{fmt(Math.abs(total))}
                                                    {total < 0 && (
                                                        <div className="text-[10px] font-bold text-rose-600">Payable</div>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <span className="inline-block px-2.5 py-1 rounded-full font-semibold text-[11px] bg-amber-100 text-amber-700">
                                                        New Order
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filteredOrders.length > 0 && (
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

                                <div className="hidden sm:flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, index) => {
                                        const pageNum = index + 1;
                                        if (
                                            pageNum === 1 ||
                                            pageNum === totalPages ||
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

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

export default SaleTodaysOrder;