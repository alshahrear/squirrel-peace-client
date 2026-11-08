import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight, FaTrophy } from 'react-icons/fa';

const POLL_INTERVAL = 5000;
const API = 'https://squirrel-peace-server.onrender.com';

const num = (v) => Number(v) || 0;
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const fmt = (v) => Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
const sameName = (a, b) =>
    String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

const safe = (url) =>
    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

const itemAmt = (it) =>
    Number(it.itemTotal ?? it.subtotal ?? (num(it.sellPricePcs ?? it.sellPrice) * num(it.totalQty))) || 0;
const sumItems = (items) => (items || []).reduce((s, it) => s + itemAmt(it), 0);

const TH = 'px-4 py-3 text-left text-xs font-bold text-gray-100 uppercase tracking-wider whitespace-nowrap';

const AcTopBuyPayCustomers = () => {
    const [customers, setCustomers] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({
        businessName: '',
        contactName: '',
        businessNumber: '',
        contactNumber: '',
        address: '',
        route: '',
    });

    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const customerRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (customerRef.current && !customerRef.current.contains(e.target)) setIsCustomerOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [c, s, b, d] = await Promise.all([
                safe(`${API}/customer`),
                safe(`${API}/sales`),
                safe(`${API}/sales-bulk-return`),
                safe(`${API}/sales-damage`),
            ]);
            setCustomers(c);
            setSales(s);
            setBulkReturns(b);
            setDamages(d);
        } catch (e) {
            console.error('Error fetching top buy/pay data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchData]);

    // ---------- Per customer buy / pay calculation ----------
    // Buy = Delivered sales (items + free items subtotal) - sales return - bulk return - damage return
    // Pay = Delivered sales payment received + due payment is not included here (only invoice payments)
    //       - refunds given to customer (return / bulk return / damage payments)
    const rows = useMemo(() => {
        return customers.map((c) => {
            const name = c.businessName;
            const same = (x) => sameName(x, name);

            let buy = 0;

            sales.forEach((s) => {
                if (!same(s.customer)) return;
                if (s.status !== 'Delivered') return;

                const prev = num(s.previousBalanceAmount);
                const payableFull = num(s.payableAmount);
                const ownPayable =
                    payableFull -
                    (s.previousBalanceType === 'Due' ? prev : 0) +
                    (s.previousBalanceType === 'Get' ? prev : 0);

                const gross = ownPayable + num(s.damageAdjustmentAmount) + num(s.returnAdjustmentAmount);
                if (gross > 0) buy += gross;

                (s.returnHistory || []).forEach((ret) => {
                    buy -= num(ret.totalReturnAmount);
                });

                if ((s.damageItems || []).length > 0) {
                    buy -= sumItems(s.damageItems);
                }
            });

            bulkReturns.forEach((b) => {
                if (!same(b.customer)) return;
                buy -= num(b.returnAmount);
            });

            damages.forEach((d) => {
                if (!d.customer || !same(d.customer)) return;
                const amt = num(d.damageAmount) || num(d.returnAmount) || sumItems(d.items);
                buy -= amt;
            });

            buy = Math.max(r2(buy), 0);

            return {
                _id: c._id,
                businessName: c.businessName || '',
                contactName: c.contactName || '',
                businessNumber: c.businessNumber || '',
                contactNumber: c.contactNumber || '',
                address: c.address || '',
                route: c.route || '',
                buy,
            };
        });
    }, [customers, sales, bulkReturns, damages]);

    // ---------- Filters ----------
    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setFilter(e.target.name, e.target.value);
    const handleClearFilters = () => {
        setFilters({
            businessName: '',
            contactName: '',
            businessNumber: '',
            contactNumber: '',
            address: '',
            route: '',
        });
        setCurrentPage(1);
    };

    const totalKey = 'buy';

    const filtered = rows
        .filter((r) => {
            const has = (val, q) => String(val || '').toLowerCase().includes(String(q || '').toLowerCase());
            if (filters.businessName && !has(r.businessName, filters.businessName) && !has(r.contactNumber, filters.businessName)) return false;
            if (filters.contactName && !has(r.contactName, filters.contactName)) return false;
            if (filters.businessNumber && !has(r.businessNumber, filters.businessNumber)) return false;
            if (filters.contactNumber && !has(r.contactNumber, filters.contactNumber)) return false;
            if (filters.address && !has(r.address, filters.address)) return false;
            if (filters.route && !has(r.route, filters.route)) return false;
            return true;
        })
        .sort((a, b) => b[totalKey] - a[totalKey] || a.businessName.localeCompare(b.businessName));

    const customerOptions = customers.filter((c) => {
        const s = filters.businessName.toLowerCase();
        return (
            String(c.businessName || '').toLowerCase().includes(s) ||
            String(c.contactNumber || '').toLowerCase().includes(s)
        );
    });

    const grandTotal = r2(filtered.reduce((s, r) => s + r[totalKey], 0));

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const inputCls =
        'w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700';

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Top Buy Customers
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            যে customer বেশি টাকার product কিনেছে (Return / Bulk Return / Damage বাদ দিয়ে)
                        </p>
                    </div>
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Updating
                    </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Buy</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(grandTotal)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-amber-500 to-orange-600">
                        <p className="text-sm text-white/80">Top Customer</p>
                        <p className="text-xl font-extrabold mt-1 truncate">
                            {filtered.length > 0 && filtered[0][totalKey] > 0 ? filtered[0].businessName : 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-sky-500 to-blue-600">
                        <p className="text-sm text-white/80">Total Customers</p>
                        <p className="text-2xl font-extrabold mt-1">{filtered.length}</p>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Customer Ranking</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filtered.length > 0 ? `${start + 1}-${Math.min(start + itemsPerPage, filtered.length)}` : 0} of {filtered.length} ({rows.length} total)
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">


                            {/* Business Name */}
                            <div className="relative" ref={customerRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Business Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="businessName"
                                        placeholder="Search or select customer..."
                                        value={filters.businessName}
                                        onChange={(e) => {
                                            handleFilterChange(e);
                                            setIsCustomerOpen(true);
                                        }}
                                        onFocus={() => setIsCustomerOpen(true)}
                                        autoComplete="off"
                                        className={`${inputCls} pr-8`}
                                    />
                                    {filters.businessName && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFilter('businessName', '');
                                                setIsCustomerOpen(false);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500"
                                        >
                                            <FaTimes size={11} />
                                        </button>
                                    )}
                                </div>
                                {isCustomerOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-indigo-100 max-h-60 overflow-y-auto">
                                        {customerOptions.length > 0 ? (
                                            customerOptions.map((c) => (
                                                <div
                                                    key={c._id}
                                                    onClick={() => {
                                                        setFilter('businessName', c.businessName);
                                                        setIsCustomerOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{c.businessName}</p>
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

                            {/* Contact Name */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Contact Name</label>
                                <input
                                    type="text"
                                    name="contactName"
                                    placeholder="Search contact name..."
                                    value={filters.contactName}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>

                            {/* Business Number */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Business Number</label>
                                <input
                                    type="text"
                                    name="businessNumber"
                                    placeholder="Search business no..."
                                    value={filters.businessNumber}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>

                            {/* Contact Number */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Contact Number</label>
                                <input
                                    type="text"
                                    name="contactNumber"
                                    placeholder="Search number..."
                                    value={filters.contactNumber}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>

                            {/* Address */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    placeholder="Search address..."
                                    value={filters.address}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>

                            {/* Route */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Route</label>
                                <input
                                    type="text"
                                    name="route"
                                    placeholder="Search route..."
                                    value={filters.route}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading customers...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No customer found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600">
                                        <th className={TH}>#</th>
                                        <th className={TH}>Business Name</th>
                                        <th className={TH}>Contact Name</th>
                                        <th className={TH}>Business Number</th>
                                        <th className={TH}>Contact Number</th>
                                        <th className={TH}>Address</th>
                                        <th className={TH}>Route</th>
                                        <th className={`${TH} text-right`}>Total Buy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {current.map((r, i) => {
                                        const rank = start + i + 1;
                                        const isTop = rank <= 3 && r[totalKey] > 0;
                                        return (
                                            <tr key={r._id} className="hover:bg-indigo-50/40 transition duration-150">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {isTop ? (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            <FaTrophy size={10} /> {rank}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">{rank}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">{r.businessName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium">
                                                    {r.contactName || <span className="text-gray-400 italic text-xs">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                    {r.businessNumber || <span className="text-gray-400 italic text-xs">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                        {r.contactNumber}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                    {r.address || <span className="text-gray-400 italic text-xs">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {r.route ? (
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            {r.route}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right font-extrabold text-indigo-600">
                                                    ৳ {fmt(r[totalKey])}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
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

export default AcTopBuyPayCustomers;