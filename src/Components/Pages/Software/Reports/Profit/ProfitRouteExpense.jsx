import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FiPieChart, FiX } from 'react-icons/fi';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaSyncAlt } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const parseDate = (d) => {
    if (!d) return 0;
    const t = Date.parse(d);
    if (!isNaN(t)) return t;
    const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
    return 0;
};
const dayOnly = (ts) => {
    if (!ts) return 0;
    const dt = new Date(ts);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
};
const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ProfitRouteExpense = () => {
    const [routeExpenses, setRouteExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        invoice: '',
        deliveredBy: '',
        routeName: '',
        category: '',
        name: '',
        accountType: '',
    });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const [showBreakdown, setShowBreakdown] = useState(false);
    const [breakdownVisible, setBreakdownVisible] = useState(false);

    const fetchRouteExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5000/routeExpense');
            const data = await res.json();
            setRouteExpenses(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching route expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRouteExpenses();
    }, [fetchRouteExpenses]);

    // Shudhu Inside route expense (routeExpenseType na thakle Inside dhora hoy)
    const insideRouteExpenses = useMemo(
        () =>
            routeExpenses
                .filter((i) => (i.routeExpenseType || 'Inside') === 'Inside')
                .map((i) => ({ ...i, ts: parseDate(i.date) }))
                .sort((a, b) => b.ts - a.ts),
        [routeExpenses]
    );

    const deliveredByOptions = useMemo(
        () => [...new Set(insideRouteExpenses.map((i) => i.deliveredBy).filter(Boolean))],
        [insideRouteExpenses]
    );

    const routeNameOptions = useMemo(
        () => [...new Set(insideRouteExpenses.map((i) => i.routeName).filter(Boolean))],
        [insideRouteExpenses]
    );

    const categoryOptions = useMemo(
        () => [...new Set(insideRouteExpenses.map((i) => i.routeExpenseCategory).filter(Boolean))],
        [insideRouteExpenses]
    );

    const filtered = useMemo(() => {
        const st = filters.startDate ? dayOnly(parseDate(filters.startDate)) : 0;
        const en = filters.endDate ? dayOnly(parseDate(filters.endDate)) : 0;
        const inv = filters.invoice.trim().toLowerCase();
        const nm = filters.name.trim().toLowerCase();
        return insideRouteExpenses.filter((i) => {
            const day = dayOnly(i.ts);
            if (st && day < st) return false;
            if (en && day > en) return false;
            if (inv && !String(i.invoiceNumber || '').toLowerCase().includes(inv)) return false;
            if (nm && !String(i.name || '').toLowerCase().includes(nm)) return false;
            if (filters.deliveredBy && i.deliveredBy !== filters.deliveredBy) return false;
            if (filters.routeName && i.routeName !== filters.routeName) return false;
            if (filters.category && i.routeExpenseCategory !== filters.category) return false;
            if (filters.accountType && i.accountType !== filters.accountType) return false;
            return true;
        });
    }, [insideRouteExpenses, filters]);

    const totalAmount = useMemo(() => filtered.reduce((s, i) => s + (Number(i.amount) || 0), 0), [filtered]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', invoice: '', deliveredBy: '', routeName: '', category: '', name: '', accountType: '' });
        setCurrentPage(1);
    };

    const hasAccountDetails = (i) => Boolean(i.bankName || i.accountNumber || i.accountBranch || i.accountName);

    // Breakdown
    const breakdown = useMemo(() => {
        const groups = {};
        filtered.forEach((i) => {
            const type = i.accountType?.trim() || 'Others';
            const amount = Number(i.amount) || 0;
            if (!groups[type]) groups[type] = { total: 0, subGroups: {} };
            groups[type].total += amount;

            const t = type.toLowerCase();
            let subKey = '';
            const number = i.accountNumber?.trim();
            if (t === 'mobile banking') {
                const provider = i.accountName?.trim();
                subKey = provider && number ? `${provider} (${number})` : provider || number || '';
            } else if (t === 'bank') {
                const bank = i.bankName?.trim();
                subKey = bank && number ? `${bank} (${number})` : bank || number || '';
            } else if (t !== 'cash') {
                const fb = i.bankName?.trim() || i.accountName?.trim();
                subKey = fb && number ? `${fb} (${number})` : fb || number || '';
            }
            if (subKey) groups[type].subGroups[subKey] = (groups[type].subGroups[subKey] || 0) + amount;
        });
        return groups;
    }, [filtered]);

    const openBreakdown = () => {
        setShowBreakdown(true);
        setTimeout(() => setBreakdownVisible(true), 10);
    };
    const closeBreakdown = () => {
        setBreakdownVisible(false);
        setTimeout(() => setShowBreakdown(false), 250);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            {/* Breakdown Modal */}
            {showBreakdown && (
                <div
                    className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ${breakdownVisible ? 'bg-black/40 backdrop-blur-sm opacity-100' : 'bg-black/0 opacity-0'}`}
                    onClick={closeBreakdown}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-white overflow-hidden transform transition-all duration-300 ${breakdownVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'}`}
                    >
                        <div className="bg-gradient-to-r from-indigo-600 to-pink-600 px-6 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Route Expense Breakdown</h3>
                                <p className="text-indigo-100 text-xs mt-0.5">Inside route expense, account wise</p>
                            </div>
                            <button
                                onClick={closeBreakdown}
                                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            {Object.keys(breakdown).length === 0 ? (
                                <div className="text-center py-10 text-gray-400 font-medium">No data to show!</div>
                            ) : (
                                Object.entries(breakdown).map(([type, data]) => (
                                    <div key={type} className="bg-gray-50/70 rounded-2xl border border-gray-100 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-gray-800 text-sm">{type}</span>
                                            <span className="font-bold text-cyan-600 text-sm">৳ {fmt(data.total)}</span>
                                        </div>
                                        {Object.keys(data.subGroups).length > 0 && (
                                            <div className="mt-3 space-y-1.5 pl-3 border-l-2 border-indigo-100">
                                                {Object.entries(data.subGroups).map(([k, v]) => (
                                                    <div key={k} className="flex items-center justify-between text-xs text-gray-600">
                                                        <span className="font-medium">{k}</span>
                                                        <span className="font-semibold text-gray-700">৳ {fmt(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="px-6 py-4 bg-indigo-50/60 border-t border-indigo-100 flex items-center justify-between">
                            <span className="text-sm font-bold text-gray-700">Grand Total</span>
                            <span className="text-lg font-extrabold text-indigo-700">৳ {fmt(totalAmount)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Route Expense Net
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">শুধু Inside route expense এর হিসাব</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchRouteExpenses}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold text-xs rounded-full transition cursor-pointer"
                    >
                        <FaSyncAlt size={11} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-cyan-500 to-blue-600">
                        <p className="text-sm text-white/80">Total Route Expense (Inside)</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totalAmount)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Records</p>
                        <p className="text-2xl font-extrabold mt-1">{filtered.length}</p>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Route Expense Records</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {filtered.length} of {insideRouteExpenses.length}
                        </span>
                        <span className="px-3 py-1.5 bg-cyan-50 border border-cyan-100 text-cyan-700 font-bold text-xs rounded-full">
                            Total: ৳ {fmt(totalAmount)}
                        </span>
                        <button
                            onClick={openBreakdown}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-full shadow-sm transition cursor-pointer"
                        >
                            <FiPieChart className="w-3.5 h-3.5" />
                            Breakdown
                        </button>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}
                                >
                                    <input
                                        ref={startDateRef}
                                        type="date"
                                        name="startDate"
                                        value={filters.startDate}
                                        onChange={handleFilterChange}
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
                                        name="endDate"
                                        value={filters.endDate}
                                        onChange={handleFilterChange}
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

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice</label>
                                <input
                                    type="text"
                                    name="invoice"
                                    placeholder="Search invoice..."
                                    value={filters.invoice}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Delivered By</label>
                                <select
                                    name="deliveredBy"
                                    value={filters.deliveredBy}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {deliveredByOptions.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Route Name</label>
                                <select
                                    name="routeName"
                                    value={filters.routeName}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {routeNameOptions.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Category</label>
                                <select
                                    name="category"
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {categoryOptions.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Search name..."
                                    value={filters.name}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Account Type</label>
                                <select
                                    name="accountType"
                                    value={filters.accountType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Mobile Banking">Mobile Banking</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-16 text-gray-500 font-medium">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 font-medium">No route expense record found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left border-collapse min-w-[1300px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Invoice</th>
                                        <th className="py-3 px-4">Route Expense Type</th>
                                        <th className="py-3 px-4">Delivered By</th>
                                        <th className="py-3 px-4">Route Name</th>
                                        <th className="py-3 px-4">Category</th>
                                        <th className="py-3 px-4">Name</th>
                                        <th className="py-3 px-4">Account Type</th>
                                        <th className="py-3 px-4">Account Details</th>
                                        <th className="py-3 px-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {current.map((routeExpense, index) => (
                                        <tr key={routeExpense._id || index} className="hover:bg-indigo-50/40 transition">
                                            <td className="py-3 px-4 text-gray-400">{start + index + 1}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-gray-600">{routeExpense.date || 'N/A'}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">{routeExpense.invoiceNumber || 'N/A'}</td>
                                            <td className="py-3 px-4">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full border font-semibold text-xs whitespace-nowrap bg-teal-50 text-teal-700 border-teal-200">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                                                    Inside
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-3 py-1 bg-sky-100 text-sky-700 rounded-full font-semibold text-xs whitespace-nowrap">
                                                    {routeExpense.deliveredBy || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{routeExpense.routeName || 'N/A'}</td>
                                            <td className="py-3 px-4 font-bold text-gray-800">{routeExpense.routeExpenseCategory || 'N/A'}</td>
                                            <td className="py-3 px-4 text-gray-600">{routeExpense.name || 'N/A'}</td>
                                            <td className="py-3 px-4">
                                                {routeExpense.accountType === 'Mobile Banking' ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-amber-700 text-sm">{routeExpense.accountName || 'N/A'}</span>
                                                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 border border-amber-200 rounded-full font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                                            Mobile Banking
                                                        </span>
                                                    </div>
                                                ) : routeExpense.accountType === 'Bank' ? (
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="font-semibold text-indigo-700 text-sm">{routeExpense.bankName || 'N/A'}</span>
                                                        <span className="inline-flex items-center w-fit gap-1 px-2.5 py-0.5 bg-gradient-to-r from-indigo-100 to-blue-100 text-indigo-700 border border-indigo-200 rounded-full font-bold text-[10px] uppercase tracking-wide whitespace-nowrap">
                                                            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                                                            Bank
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200 rounded-full font-semibold text-xs whitespace-nowrap">
                                                        <span className="w-1.5 h-1.5 bg-purple-500 rounded-full"></span>
                                                        {routeExpense.accountType || 'N/A'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-xs text-gray-500">
                                                {hasAccountDetails(routeExpense) ? (
                                                    <div className="space-y-0.5">
                                                        {routeExpense.accountNumber && <p><strong className="text-gray-700">A/C:</strong> {routeExpense.accountNumber}</p>}
                                                        {routeExpense.accountBranch && <p><strong className="text-gray-700">Branch:</strong> {routeExpense.accountBranch}</p>}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-500">Cash</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right font-bold text-cyan-600 whitespace-nowrap">
                                                ৳ {fmt(routeExpense.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-indigo-50/70 font-extrabold text-[13px] border-t-2 border-indigo-100">
                                        <td className="py-3 px-4 text-gray-700" colSpan={10}>Total ({filtered.length} records)</td>
                                        <td className="py-3 px-4 text-right text-cyan-700 whitespace-nowrap">৳ {fmt(totalAmount)}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{safePage}</span> of{' '}
                                <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(safePage - 1)}
                                    disabled={safePage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === 1
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
                                            (pageNum >= safePage - 1 && pageNum <= safePage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${safePage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(safePage + 1)}
                                    disabled={safePage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === totalPages
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

export default ProfitRouteExpense;