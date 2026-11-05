import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const fmt = (v) => Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const norm = (v) => String(v || '').trim().toLowerCase();

const idTimeOf = (id) => {
    const t = parseInt(String(id || '').slice(0, 8), 16) * 1000;
    return isNaN(t) ? 0 : t;
};

// YYYY-MM-DD -> 28 Oct 2026
const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = String(dateString).slice(0, 10).split('-');
    if (!year || !month || !day) return dateString;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return dateString;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const accountLabel = (method, acc = {}) => {
    if (method === 'Bank') {
        return (
            [acc.bankName, acc.accountNumber].filter(Boolean).join(' - ') +
            (acc.accountBranch ? ` (${acc.accountBranch})` : '')
        );
    }
    if (method === 'Mobile Banking') return [acc.accountName, acc.accountNumber].filter(Boolean).join(' - ');
    return acc.accountName || 'Cash';
};

const getDueType = (p) =>
    p?.type === 'Pay' || p?.status === 'Pay' || p?.paymentAccount?.dueType === 'Pay' ? 'Pay' : 'Get';

// Collected By: SR age, tarpor DSR, noyto Admin
const getCollector = (p) => {
    if (p.sr) return { role: 'SR', name: p.sr };
    if (p.deliveredBy) return { role: 'DSR', name: p.deliveredBy };
    return { role: 'Admin', name: 'Admin' };
};

const ROLE_BADGE = {
    SR: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    DSR: 'bg-teal-50 text-teal-700 border-teal-100',
    Admin: 'bg-gray-100 text-gray-700 border-gray-200',
};

const inputCls =
    'w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700';

// Searchable dropdown (simple string options)
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

const EMPTY_FILTERS = {
    startDate: '',
    endDate: '',
    customer: '',
    collectedBy: '', // '', Admin, SR, DSR, SRDSR
    collectorName: '',
    method: '',
    account: '',
    status: '',
};

const SaleSrDsrDueRepo = () => {
    const location = useLocation();

    const [payments, setPayments] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, cRes, uRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/sales-due-payment'),
                    fetch('https://squirrel-peace-server.onrender.com/customer'),
                    fetch('https://squirrel-peace-server.onrender.com/user'),
                ]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                const uData = await uRes.json().catch(() => []);
                setPayments(Array.isArray(pData) ? pData : []);
                setCustomers(Array.isArray(cData) ? cData : []);
                setUsers(Array.isArray(uData) ? uData : []);
            } catch (error) {
                console.error('Error fetching SR & DSR due data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [location.pathname]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const setFilter = (key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
        setCurrentPage(1);
    };

    const handleCollectedByChange = (e) => {
        // Role bodlale name reset hobe
        setFilters((prev) => ({ ...prev, collectedBy: e.target.value, collectorName: '' }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };

    const customerInfoOf = (name) => customers.find((c) => norm(c.businessName) === norm(name));

    // ---------- Rows ----------
    const rows = payments
        .map((p) => {
            const info = customerInfoOf(p.customer);
            const collector = getCollector(p);
            return {
                key: p._id,
                date: p.date || '',
                time: idTimeOf(p._id),
                customer: p.customer || '',
                phone: p.customerContact || info?.contactNumber || '',
                address: info?.address || '',
                role: collector.role,
                collectorName: collector.name,
                status: getDueType(p),
                method: p.paymentMethod || '',
                account: accountLabel(p.paymentMethod, p.paymentAccount || {}),
                amount: r2(n(p.amount)),
            };
        })
        .sort((a, b) => {
            if (a.date !== b.date) return a.date < b.date ? 1 : -1;
            return b.time - a.time;
        });

    // ---------- Options ----------
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const roleOf = (u) => String(u.role || u.userRole || u.designation || '').toLowerCase();
    const userName = (u) => u.name || u.userName || u.fullName || '';

    const srNames = uniq([
        ...users.filter((u) => roleOf(u) === 'sr').map(userName),
        ...rows.filter((r) => r.role === 'SR').map((r) => r.collectorName),
    ]);
    const dsrNames = uniq([
        ...users.filter((u) => roleOf(u).includes('deliver')).map(userName),
        ...rows.filter((r) => r.role === 'DSR').map((r) => r.collectorName),
    ]);

    const nameOptions =
        filters.collectedBy === 'SR'
            ? srNames
            : filters.collectedBy === 'DSR'
                ? dsrNames
                : filters.collectedBy === 'SRDSR'
                    ? uniq([...srNames, ...dsrNames])
                    : [];

    const nameLabel =
        filters.collectedBy === 'SR' ? 'SR Name' : filters.collectedBy === 'DSR' ? 'DSR Name' : 'SR / DSR Name';
    const showNameFilter = filters.collectedBy === 'SR' || filters.collectedBy === 'DSR' || filters.collectedBy === 'SRDSR';

    const customerOptions = uniq([
        ...customers.map((c) => c.businessName),
        ...rows.map((r) => r.customer),
    ]);
    const methodOptions = uniq(rows.map((r) => r.method));
    const accountOptions = uniq(rows.map((r) => r.account));

    // ---------- Filtering ----------
    const filteredRows = rows.filter((r) => {
        if (filters.startDate && (!r.date || r.date < filters.startDate)) return false;
        if (filters.endDate && (!r.date || r.date > filters.endDate)) return false;
        if (filters.customer && !r.customer.toLowerCase().includes(filters.customer.toLowerCase())) return false;

        if (filters.collectedBy === 'Admin' && r.role !== 'Admin') return false;
        if (filters.collectedBy === 'SR' && r.role !== 'SR') return false;
        if (filters.collectedBy === 'DSR' && r.role !== 'DSR') return false;
        if (filters.collectedBy === 'SRDSR' && r.role === 'Admin') return false;

        if (filters.collectorName && !r.collectorName.toLowerCase().includes(filters.collectorName.toLowerCase())) return false;
        if (filters.method && r.method !== filters.method) return false;
        if (filters.account && !r.account.toLowerCase().includes(filters.account.toLowerCase())) return false;
        if (filters.status && r.status !== filters.status) return false;
        return true;
    });

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (p) => {
        if (p >= 1 && p <= totalPages) setCurrentPage(p);
    };

    // ---------- Summary ----------
    const sGet = r2(filteredRows.filter((r) => r.status === 'Get').reduce((s, r) => s + r.amount, 0));
    const sPay = r2(filteredRows.filter((r) => r.status === 'Pay').reduce((s, r) => s + r.amount, 0));

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        SR & DSR Due Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Customer due payment — ke taka collect / pay korechhe tar hisab, notun entry sobar upore</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">SR & DSR Due</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of {filteredRows.length} ({rows.length} total)
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
                                        className={`${inputCls} cursor-pointer pointer-events-none`}
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
                                        className={`${inputCls} cursor-pointer pointer-events-none`}
                                    />
                                </div>
                            </div>

                            {/* Customer */}
                            <FilterSelect
                                label="Customer"
                                placeholder="Search or select customer..."
                                value={filters.customer}
                                options={customerOptions}
                                onChange={(v) => setFilter('customer', v)}
                                emptyText="No customer found"
                            />

                            {/* Collected By */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Collected By</label>
                                <select
                                    name="collectedBy"
                                    value={filters.collectedBy}
                                    onChange={handleCollectedByChange}
                                    className={`${inputCls} cursor-pointer`}
                                >
                                    <option value="">All</option>
                                    <option value="Admin">Admin</option>
                                    <option value="SR">SR</option>
                                    <option value="DSR">DSR</option>
                                    <option value="SRDSR">SR & DSR</option>
                                </select>
                            </div>

                            {/* SR / DSR Name (role select korle ashbe) */}
                            {showNameFilter && (
                                <FilterSelect
                                    key={filters.collectedBy}
                                    label={nameLabel}
                                    placeholder={`Search or select ${nameLabel.toLowerCase()}...`}
                                    value={filters.collectorName}
                                    options={nameOptions}
                                    onChange={(v) => setFilter('collectorName', v)}
                                    emptyText="No name found"
                                />
                            )}

                            {/* Payment Method */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Payment Method</label>
                                <select
                                    name="method"
                                    value={filters.method}
                                    onChange={handleFilterChange}
                                    className={`${inputCls} cursor-pointer`}
                                >
                                    <option value="">All</option>
                                    {methodOptions.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Payment Account */}
                            <FilterSelect
                                label="Payment Account"
                                placeholder="Search or select account..."
                                value={filters.account}
                                options={accountOptions}
                                onChange={(v) => setFilter('account', v)}
                                emptyText="No account found"
                            />

                            {/* Status */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className={`${inputCls} cursor-pointer`}
                                >
                                    <option value="">All</option>
                                    <option value="Get">Get</option>
                                    <option value="Pay">Pay</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-700">
                            Showing
                        </span>
                        <span className="font-semibold text-gray-600">
                            Rows: <b className="text-gray-800">{filteredRows.length}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Get Amount: <b className="text-sky-600">৳{fmt(sGet)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Pay Amount: <b className="text-rose-600">৳{fmt(sPay)}</b>
                        </span>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading report...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No records found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-[11px] [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-xs [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_td]:align-top">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white uppercase tracking-wide">
                                        <th>Date</th>
                                        <th>Customer</th>
                                        <th>Phone</th>
                                        <th>Address</th>
                                        <th>Collected By</th>
                                        <th>Status</th>
                                        <th>Payment Method</th>
                                        <th>Payment Account</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => (
                                        <tr key={r.key} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="text-gray-600 font-medium">{displayFormattedDate(r.date) || 'N/A'}</td>
                                            <td className="font-bold text-gray-800">{r.customer}</td>
                                            <td className="text-gray-600">
                                                {r.phone || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="text-gray-600">
                                                {r.address || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td>
                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-bold text-[10px] ${ROLE_BADGE[r.role]}`}>
                                                    {r.role === 'Admin' ? 'Admin' : `${r.collectorName} (${r.role})`}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold border ${r.status === 'Get' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                    {r.method || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="text-gray-600">{r.account || 'N/A'}</td>
                                            <td className={`font-bold ${r.status === 'Get' ? 'text-sky-600' : 'text-rose-600'}`}>৳{fmt(r.amount)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filteredRows.length > 0 && (
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

export default SaleSrDsrDueRepo;