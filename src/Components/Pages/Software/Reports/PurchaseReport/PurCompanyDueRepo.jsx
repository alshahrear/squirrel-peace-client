import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const norm = (v) => String(v || '').trim().toLowerCase();

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

const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!year || !month || !day) return dateString;
    return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const PurCompanyDueRepo = () => {
    const location = useLocation();

    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        status: '',
        company: '',
        phone: '',
        address: '',
        balanceType: '',
    });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, cRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
                ]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                setPurchases(Array.isArray(pData) ? pData : []);
                setCompanies(Array.isArray(cData) ? cData : []);
            } catch (error) {
                console.error('Error fetching company due data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', status: '', company: '', phone: '', address: '', balanceType: '' });
        setCurrentPage(1);
    };

    const filteredCompanyOptions = companies.filter((comp) =>
        comp.businessName?.toLowerCase().includes(filters.company.toLowerCase())
    );

    const handleSelectCompany = (comp) => {
        setFilters({ ...filters, company: comp.businessName });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, company: '' });
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    // ---------- Company wise summary (ekta company = ekta row) ----------
    const summary = new Map();

    const ensure = (name, info) => {
        const key = norm(name);
        if (!key) return null;
        if (!summary.has(key)) {
            summary.set(key, {
                key,
                company: String(name).trim(),
                phone: info?.contactNumber || '',
                address: info?.address || '',
                openingAmount: 0,
                openingType: '',
                total: 0,
                paid: 0,
                due: 0,
                get: 0,
                count: 0,
            });
        }
        return summary.get(key);
    };

    // Company list theke (opening balance shoho)
    companies.forEach((c) => {
        const row = ensure(c.businessName, c);
        if (!row) return;
        const amt = r2(num(c.openingBalance));
        const typeRaw = norm(c.openingBalanceType);
        row.openingAmount = amt;
        row.openingType = amt > 0 && typeRaw === 'pay' ? 'Pay' : amt > 0 && typeRaw === 'get' ? 'Get' : '';
    });

    // Purchase gulo company wise sum
    purchases
        .filter((p) => p.paidAmount !== undefined && p.paidAmount !== null && p.paidAmount !== '' && !!p.paymentMethod)
        .filter((p) => {
            if (filters.startDate || filters.endDate) {
                const d = parseToLocalDate(p.purchaseDate);
                if (!d) return false;
                if (filters.startDate) {
                    const s = parseToLocalDate(filters.startDate);
                    if (s && d < s) return false;
                }
                if (filters.endDate) {
                    const e = parseToLocalDate(filters.endDate);
                    if (e && d > e) return false;
                }
            }
            const isRec = p.receiveStatus === 'Received' || p.receiveStatus === 'Yes';
            if (filters.status === 'Received' && !isRec) return false;
            if (filters.status === 'No' && isRec) return false;
            return true;
        })
        .forEach((p) => {
            const info = companies.find((c) => norm(c.businessName) === norm(p.company));
            const row = ensure(p.company, info);
            if (!row) return;
            const payable = num(p.payableAmount);
            const paid = num(p.paidAmount);
            const due = payable < 0 ? 0 : Math.max(r2(payable - paid), 0);
            const extra = payable < 0 ? r2(-payable) : Math.max(r2(paid - payable), 0);
            row.total += payable;
            row.paid += paid;
            row.due += due;
            row.get += extra;
            row.count += 1;
        });

    const allRows = Array.from(summary.values())
        .map((r) => {
            const openPay = r.openingType === 'Pay' ? r.openingAmount : 0;
            const openGet = r.openingType === 'Get' ? r.openingAmount : 0;
            // Opening balance shoho final balance (Pay / Get filter er jonno)
            const net = r2(openPay - openGet + r.due - r.get);
            return {
                ...r,
                total: r2(r.total),
                paid: r2(r.paid),
                due: r2(r.due),
                get: r2(r.get),
                net,
            };
        })
        .sort((a, b) => a.company.localeCompare(b.company));

    // ---------- Filtering ----------
    const filteredRows = allRows.filter((r) => {
        if ((filters.startDate || filters.endDate || filters.status) && r.count === 0) return false;
        if (filters.company && !r.company.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.phone && !String(r.phone || '').toLowerCase().includes(filters.phone.toLowerCase())) return false;
        if (filters.address && !String(r.address || '').toLowerCase().includes(filters.address.toLowerCase())) return false;
        if (filters.balanceType === 'Pay' && !(r.net > 0)) return false;
        if (filters.balanceType === 'Get' && !(r.net < 0)) return false;
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
    const sTotal = filteredRows.reduce((s, r) => s + r.total, 0);
    const sPaid = filteredRows.reduce((s, r) => s + r.paid, 0);
    const sDue = filteredRows.reduce((s, r) => s + r.due, 0);
    const sGet = filteredRows.reduce((s, r) => s + r.get, 0);
    const sNet = r2(filteredRows.reduce((s, r) => s + r.net, 0));

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Purchase Company Due Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">প্রতিটি company এর সব purchase এর summary — এক company এক row</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Company Due</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of {filteredRows.length} ({allRows.length} total)
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
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
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* Receive Status */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Status</label>
                                <select
                                    name="status"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="No">New Order (Not Received)</option>
                                    <option value="Received">Received</option>
                                </select>
                            </div>

                            {/* Company Searchable Dropdown */}
                            <div className="relative" ref={companyDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <div
                                    onClick={() => setIsCompanyOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select company..."
                                        value={filters.company}
                                        onChange={(e) => {
                                            handleFilterChange({ target: { name: 'company', value: e.target.value } });
                                            setIsCompanyOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.company && (
                                        <button type="button" onClick={handleClearCompany} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isCompanyOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredCompanyOptions.length > 0 ? (
                                            filteredCompanyOptions.map((comp) => (
                                                <div
                                                    key={comp._id}
                                                    onClick={() => handleSelectCompany(comp)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {comp.businessName}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Phone</label>
                                <input
                                    type="text"
                                    name="phone"
                                    placeholder="Search phone..."
                                    value={filters.phone}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
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
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            {/* Get / Pay */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Get / Pay</label>
                                <select
                                    name="balanceType"
                                    value={filters.balanceType}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Pay">Pay (I have to pay)</option>
                                    <option value="Get">Get (I will receive)</option>
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
                            Companies: <b className="text-gray-800">{filteredRows.length}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Amount: <b className="text-indigo-600">৳{fmt(sTotal)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Paid Amount: <b className="text-emerald-600">৳{fmt(sPaid)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Due Amount: <b className="text-rose-600">৳{fmt(sDue)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Get Amount: <b className="text-sky-600">৳{fmt(sGet)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Final Amount:{' '}
                            {sNet > 0 ? (
                                <b className="text-rose-600">৳{fmt(sNet)} (Pay)</b>
                            ) : sNet < 0 ? (
                                <b className="text-sky-600">৳{fmt(-sNet)} (Get)</b>
                            ) : (
                                <b className="text-slate-400">0</b>
                            )}
                        </span>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading company due...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No companies found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-[11px] [&_td]:px-2 [&_td]:py-2.5 [&_td]:text-xs [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_td]:align-top">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white uppercase tracking-wide">
                                        <th>Company</th>
                                        <th>Phone</th>
                                        <th>Address</th>
                                        <th>Opening Balance</th>
                                        <th>Total Amount</th>
                                        <th>Paid Amount</th>
                                        <th>Due Amount</th>
                                        <th>Get Amount</th>
                                        <th>Final Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => (
                                        <tr key={r.key} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="font-bold text-gray-800">{r.company}</td>
                                            <td className="text-gray-600">
                                                {r.phone || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="text-gray-600">
                                                {r.address || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="font-semibold">
                                                <span className="text-gray-700">৳{fmt(r.openingAmount)}</span>
                                                {r.openingType && (
                                                    <span
                                                        className={`ml-1 font-bold ${r.openingType === 'Get' ? 'text-sky-600' : 'text-rose-600'}`}
                                                    >
                                                        ({r.openingType})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="font-semibold text-indigo-600">৳{fmt(r.total)}</td>
                                            <td className="font-bold text-emerald-600">৳{fmt(r.paid)}</td>
                                            <td className={`font-bold ${r.due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>৳{fmt(r.due)}</td>
                                            <td className={`font-bold ${r.get > 0 ? 'text-sky-600' : 'text-slate-400'}`}>৳{fmt(r.get)}</td>
                                            <td className="font-bold">
                                                {r.net > 0 ? (
                                                    <span className="text-rose-600">৳{fmt(r.net)} (Pay)</span>
                                                ) : r.net < 0 ? (
                                                    <span className="text-sky-600">৳{fmt(-r.net)} (Get)</span>
                                                ) : (
                                                    <span className="text-slate-400">0</span>
                                                )}
                                            </td>
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

export default PurCompanyDueRepo;