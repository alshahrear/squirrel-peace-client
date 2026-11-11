import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const POLL_INTERVAL = 5000;
const API = 'http://localhost:5000';

const fmt = (v) => Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

const safe = (url) =>
    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

const oidTime = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);

// Different date formats (ISO / dd/mm/yyyy / dd Mon yyyy / yyyy-mm-dd) -> timestamp
const toTs = (v) => {
    if (!v) return 0;
    const str = String(v).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
        const [d, m, rest] = str.split('/');
        const y = rest.slice(0, 4);
        const t = new Date(Number(y), Number(m) - 1, Number(d)).getTime();
        return isNaN(t) ? 0 : t;
    }
    const t = Date.parse(str);
    return isNaN(t) ? 0 : t;
};

const toDayKey = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    const p = (x) => String(x).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AcTransferRepo = () => {
    const [transfers, setTransfers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const emptyFilters = {
        startDate: '',
        endDate: '',
        transferFrom: '',
        transferTo: '',
        fromAccount: '',
        toAccount: '',
        search: '',
    };

    const [filters, setFilters] = useState(emptyFilters);
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const fetchData = useCallback(async () => {
        try {
            const data = await safe(`${API}/transfer`);
            setTransfers(data);
        } catch (e) {
            console.error('Error fetching transfer data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchData]);

    // ---------- Build rows ----------
    const rows = useMemo(() => {
        return transfers
            .map((i) => ({
                ...i,
                ts: toTs(i.date) || toTs(i.createdAt) || oidTime(i._id),
                ord: oidTime(i._id),
            }))
            .sort((a, b) => (b.ts - a.ts) || (b.ord - a.ord));
    }, [transfers]);

    const fromTypes = useMemo(
        () => [...new Set(rows.map((r) => r.transferFrom).filter(Boolean))].sort(),
        [rows]
    );
    const toTypes = useMemo(
        () => [...new Set(rows.map((r) => r.transferTo).filter(Boolean))].sort(),
        [rows]
    );

    // ---------- Filters ----------
    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setFilter(e.target.name, e.target.value);
    const handleClearFilters = () => {
        setFilters(emptyFilters);
        setCurrentPage(1);
    };

    const filtered = rows.filter((r) => {
        const day = toDayKey(r.ts);
        if (filters.startDate && (!day || day < filters.startDate)) return false;
        if (filters.endDate && (!day || day > filters.endDate)) return false;
        if (filters.transferFrom && r.transferFrom !== filters.transferFrom) return false;
        if (filters.transferTo && r.transferTo !== filters.transferTo) return false;
        if (filters.fromAccount && !String(r.fromAccount || '').toLowerCase().includes(filters.fromAccount.toLowerCase())) return false;
        if (filters.toAccount && !String(r.toAccount || '').toLowerCase().includes(filters.toAccount.toLowerCase())) return false;
        if (filters.search) {
            const s = filters.search.toLowerCase();
            if (![r.transferFrom, r.transferTo, r.fromAccount, r.toAccount, r.note, r.amount].some((v) => String(v || '').toLowerCase().includes(s))) return false;
        }
        return true;
    });

    const totalAmount = r2(filtered.reduce((s, r) => s + (Number(r.amount) || 0), 0));
    const cashOutTotal = r2(filtered.filter((r) => r.transferFrom === 'Cash').reduce((s, r) => s + (Number(r.amount) || 0), 0));
    const mobileOutTotal = r2(filtered.filter((r) => r.transferFrom === 'Mobile Banking').reduce((s, r) => s + (Number(r.amount) || 0), 0));
    const bankOutTotal = r2(filtered.filter((r) => r.transferFrom === 'Bank').reduce((s, r) => s + (Number(r.amount) || 0), 0));

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const handlePageChange = (num) => {
        if (num >= 1 && num <= totalPages) setCurrentPage(num);
    };

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Transfer Report
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">সব Transfer এর তারিখ অনুযায়ী হিসাব</p>
                    </div>
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Updating
                    </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-emerald-500 to-teal-600">
                        <p className="text-sm text-white/80">Total Transferred</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totalAmount)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-sky-500 to-blue-600">
                        <p className="text-sm text-white/80">From Cash</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(cashOutTotal)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-amber-500 to-orange-600">
                        <p className="text-sm text-white/80">From Mobile Banking</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(mobileOutTotal)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-purple-500 to-pink-600">
                        <p className="text-sm text-white/80">From Bank</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(bankOutTotal)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Records</p>
                        <p className="text-2xl font-extrabold mt-1">{filtered.length}</p>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Transfer Records</h3>
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
                            {/* Start Date */}
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

                            {/* End Date */}
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

                            {/* Transfer From */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Transfer From</label>
                                <select
                                    name="transferFrom"
                                    value={filters.transferFrom}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {fromTypes.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Transfer To */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Transfer To</label>
                                <select
                                    name="transferTo"
                                    value={filters.transferTo}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {toTypes.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            {/* From Account */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">From Account</label>
                                <input
                                    type="text"
                                    name="fromAccount"
                                    placeholder="Name / number..."
                                    value={filters.fromAccount}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* To Account */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">To Account</label>
                                <input
                                    type="text"
                                    name="toAccount"
                                    placeholder="Name / number..."
                                    value={filters.toAccount}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Search */}
                            <div className="sm:col-span-2">
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="search"
                                        placeholder="Account / note / amount..."
                                        value={filters.search}
                                        onChange={handleFilterChange}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                    />
                                    {filters.search && (
                                        <button
                                            type="button"
                                            onClick={() => setFilter('search', '')}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading transfer report...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No transfer record found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="px-3 py-3">#</th>
                                        <th className="px-3 py-3">Date</th>
                                        <th className="px-3 py-3">From Account</th>
                                        <th className="px-3 py-3">To Account</th>
                                        <th className="px-3 py-3 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                    {current.map((r, i) => (
                                        <tr key={r._id || i} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="px-3 py-3 text-gray-400">{start + i + 1}</td>
                                            <td className="px-3 py-3 whitespace-nowrap text-gray-600 font-medium">{r.date || 'N/A'}</td>
                                            <td className="px-3 py-3">
                                                <div className="font-semibold text-gray-800">{r.transferFrom || 'N/A'}</div>
                                                <div className="text-[11px] text-indigo-600 font-medium">{r.fromAccount}</div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="font-semibold text-gray-800">{r.transferTo || 'N/A'}</div>
                                                <div className="text-[11px] text-indigo-600 font-medium">{r.toAccount}</div>
                                            </td>
                                            <td className="px-3 py-3 text-right font-extrabold whitespace-nowrap text-emerald-600">
                                                ৳ {fmt(r.amount)}
                                            </td>
                                        </tr>
                                    ))}
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

export default AcTransferRepo;