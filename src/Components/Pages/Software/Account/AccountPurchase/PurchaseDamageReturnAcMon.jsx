import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { FiArrowDownLeft, FiEye, FiDollarSign, FiSmartphone, FiCreditCard, FiHash, FiMapPin } from 'react-icons/fi';
import { FaFilter, FaRedo, FaTimes } from 'react-icons/fa';
import { getDamageReturnEffect } from '../../../Software/Account/AccountBalance';

const POLL_INTERVAL = 5000;

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const PurchaseDamageReturnAcMon = () => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        invoiceNo: '',
        company: '',
        method: '',
        account: '',
    });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const [companies, setCompanies] = useState([]);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/company')
            .then((res) => res.json())
            .then((data) => setCompanies(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching companies:', error));
    }, []);

    useEffect(() => {
        const handler = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('https://squirrel-peace-server.onrender.com/damage-return');
            const data = await res.json();
            setRows(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching damage return payments:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchData]);

    const formatAmount = (n) => Number(n || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });

    const formatTime = (d) => {
        if (!d) return 'N/A';
        try {
            const dt = new Date(d);
            if (isNaN(dt)) return 'N/A';
            return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return 'N/A';
        }
    };

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [y, m, d] = dateString.split('-');
        if (!y || !m || !d) return dateString;
        return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const toLocalDay = (v) => {
        if (!v) return null;
        const dt = new Date(v);
        if (isNaN(dt)) return null;
        return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    };

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', invoiceNo: '', company: '', method: '', account: '' });
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };

    const filteredCompanies = companies.filter((comp) => {
        const s = filters.company.toLowerCase();
        return (
            comp.businessName?.toLowerCase().includes(s) ||
            comp.contactNumber?.toLowerCase().includes(s)
        );
    });

    const handleSelectCompany = (comp) => {
        setFilters((prev) => ({ ...prev, company: comp.businessName }));
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, company: '' }));
        setCurrentPage(1);
        setIsCompanyOpen(false);
    };

    const handleViewNote = (note) => {
        const safe = String(note || 'No payment note available for this record.')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        Swal.fire({
            title: '<span class="text-xl font-bold text-gray-800">Payment Note</span>',
            html: `<div class="p-2 text-gray-600 bg-gray-50 rounded-xl border border-gray-100 max-h-60 overflow-y-auto text-left leading-relaxed">${safe}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#4f46e5',
            customClass: { popup: 'rounded-3xl shadow-2xl border border-white' },
        });
    };

    const payments = rows
        .filter((r) => getDamageReturnEffect(r))
        .map((r) => {
            const eff = getDamageReturnEffect(r);
            const pay = r.payment || {};
            const a = pay.account || {};
            const accName = pay.method === 'Bank' ? a.bankName : a.accountName;
            return {
                _id: r._id,
                time: (eff.noAccount ? r.approvedAt : r.editedAt) || r.editedAt || r.createdAt || '',
                paymentDate: r.returnDate || r.createdAt || '',
                editedAt: r.editedAt || '',
                invoiceNo: r.invoiceNo,
                company: r.company,
                method: pay.method || 'No Account',
                accName: eff.noAccount ? 'No Account (Profit/Loss only)' : (accName || 'Cash'),
                accNumber: a.accountNumber || '',
                accBranch: a.accountBranch || '',
                payAmount: eff.paid,
                adj: eff.profit,
                net: eff.total,
                note: pay.note || '',
            };
        })
        .sort((x, y) => (Date.parse(y.time) || 0) - (Date.parse(x.time) || 0));

    const filtered = payments.filter((p) => {
        if (filters.startDate || filters.endDate) {
            const day = toLocalDay(p.paymentDate || p.time);
            if (!day) return false;
            if (filters.startDate && day < toLocalDay(filters.startDate)) return false;
            if (filters.endDate && day > toLocalDay(filters.endDate)) return false;
        }
        if (filters.method && p.method !== filters.method) return false;
        if (filters.invoiceNo && !String(p.invoiceNo || '').toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.company && !String(p.company || '').toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.account) {
            const s = filters.account.toLowerCase();
            if (![p.accName, p.accNumber, p.accBranch].some((v) => String(v || '').toLowerCase().includes(s))) return false;
        }
        return true;
    });

    const totalPay = filtered.reduce((s, p) => s + p.payAmount, 0);
    const totalAdj = r2(filtered.reduce((s, p) => s + p.adj, 0));
    const totalNet = r2(filtered.reduce((s, p) => s + p.net, 0));

    const breakdownGroups = { Cash: {}, 'Mobile Banking': {}, Bank: {}, 'No Account': {} };
    filtered.forEach((p) => {
        const group = breakdownGroups[p.method] ? p.method : 'Cash';
        const key = `${p.accName}||${p.accNumber}||${p.accBranch}`;
        if (!breakdownGroups[group][key]) {
            breakdownGroups[group][key] = { accName: p.accName, accNumber: p.accNumber, accBranch: p.accBranch, amount: 0 };
        }
        breakdownGroups[group][key].amount += p.net;
    });

    const buildSection = (title, icon, accent, box) => {
        const items = Object.values(breakdownGroups[title]).sort((a, b) => b.amount - a.amount);
        return { title, icon, accent, box, items, total: r2(items.reduce((s, i) => s + i.amount, 0)) };
    };

    const breakdownSections = [
        buildSection('Cash', <FiDollarSign />, 'bg-gradient-to-tr from-emerald-500 to-teal-600', 'bg-emerald-50/60 border-emerald-100'),
        buildSection('Mobile Banking', <FiSmartphone />, 'bg-gradient-to-tr from-amber-500 to-orange-600', 'bg-amber-50/60 border-amber-100'),
        buildSection('Bank', <FiCreditCard />, 'bg-gradient-to-tr from-indigo-500 to-blue-600', 'bg-indigo-50/60 border-indigo-100'),
        buildSection('No Account', <FiDollarSign />, 'bg-gradient-to-tr from-gray-500 to-slate-600', 'bg-gray-50/60 border-gray-200'),
    ];

    // (20+5 Profit) / (20-5 Loss)
    const adjText = (p) => {
        if (p.adj > 0) return `(${formatAmount(p.payAmount)}+${formatAmount(p.adj)} Profit)`;
        if (p.adj < 0) return `(${formatAmount(p.payAmount)}-${formatAmount(Math.abs(p.adj))} Loss)`;
        return '';
    };
    const adjColor = (adj) => (adj > 0 ? 'text-emerald-600' : adj < 0 ? 'text-rose-600' : 'text-gray-500');

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Purchase Damage Return Account Monitor
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Damage return এর কারণে company থেকে account এ আসা টাকার হিসাব (Profit / Loss সহ)</p>
                    </div>
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Updating
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-emerald-500 to-teal-600">
                        <p className="text-sm text-white/80">Total Payment Received</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {formatAmount(totalPay)}</p>
                    </div>
                    <div className={`rounded-3xl shadow-xl p-6 text-white ${totalAdj < 0 ? 'bg-gradient-to-br from-rose-500 to-red-600' : 'bg-gradient-to-br from-sky-500 to-blue-600'}`}>
                        <p className="text-sm text-white/80">{totalAdj < 0 ? 'Total Loss' : totalAdj > 0 ? 'Total Profit' : 'Profit / Loss'}</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {formatAmount(Math.abs(totalAdj))}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-orange-500 to-rose-500">
                        <p className="text-sm text-white/80">Net Effect (Account এ ঢুকেছে)</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {formatAmount(totalNet)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Records</p>
                        <p className="text-2xl font-extrabold mt-1">{filtered.length}</p>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">Account wise Breakdown</h3>
                    {breakdownSections.every((s) => s.items.length === 0) ? (
                        <p className="text-sm text-gray-400">No data!</p>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
                            {breakdownSections.filter((s) => s.items.length > 0).map((s) => (
                                <div key={s.title} className={`rounded-2xl border p-4 ${s.box}`}>
                                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-white">
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md ${s.accent}`}>
                                                {s.icon}
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-800">{s.title}</h4>
                                        </div>
                                        <span className={`text-sm font-extrabold whitespace-nowrap ${s.total < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {s.total < 0 ? '-' : '+'}৳ {formatAmount(Math.abs(s.total))}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        {s.items.map((acc, idx) => (
                                            <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/90 border border-gray-100 text-xs">
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-gray-800 truncate">{acc.accName}</p>
                                                    {(acc.accNumber || acc.accBranch) && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                                            {acc.accNumber && (
                                                                <span className="flex items-center gap-1">
                                                                    <FiHash className="w-3 h-3" /> {acc.accNumber}
                                                                </span>
                                                            )}
                                                            {acc.accBranch && (
                                                                <span className="flex items-center gap-1">
                                                                    <FiMapPin className="w-3 h-3" /> {acc.accBranch}
                                                                </span>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className={`font-bold whitespace-nowrap ${acc.amount < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    {acc.amount < 0 ? '-' : '+'}৳ {formatAmount(Math.abs(acc.amount))}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Damage Return Payment Records</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {filtered.length} of {payments.length}
                        </span>
                    </div>

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
                                    name="invoiceNo"
                                    placeholder="Search invoice..."
                                    value={filters.invoiceNo}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

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
                                            setFilters((prev) => ({ ...prev, company: e.target.value }));
                                            setCurrentPage(1);
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
                                        {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map((comp) => (
                                                <div
                                                    key={comp._id}
                                                    onClick={() => handleSelectCompany(comp)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{comp.businessName}</p>
                                                    {comp.contactNumber && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5">📞 {comp.contactNumber}</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Method</label>
                                <select
                                    name="method"
                                    value={filters.method}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Cash">Cash</option>
                                    <option value="Bank">Bank</option>
                                    <option value="Mobile Banking">Mobile Banking</option>
                                    <option value="No Account">No Account</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Account</label>
                                <input
                                    type="text"
                                    name="account"
                                    placeholder="Name / number / branch..."
                                    value={filters.account}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-gray-500 font-medium">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 font-medium">No damage return payment found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs uppercase tracking-wide">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Invoice</th>
                                        <th className="py-3 px-4">Company</th>
                                        <th className="py-3 px-4">Method</th>
                                        <th className="py-3 px-4">Account</th>
                                        <th className="py-3 px-4">Note</th>
                                        <th className="py-3 px-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {current.map((p, i) => (
                                        <tr key={p._id} className="hover:bg-indigo-50/40 transition">
                                            <td className="py-3 px-4 text-gray-400">{start + i + 1}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                                                <div className="font-medium">{formatTime(p.paymentDate || p.time)}</div>
                                                {p.editedAt && (
                                                    <div className="text-[10px] font-semibold text-amber-600 mt-0.5">
                                                        Edited: {formatTime(p.editedAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/damage-return-details/${p._id}`)}
                                                    className="font-mono text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                                                    title="View Damage Return"
                                                >
                                                    {p.invoiceNo}
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 font-bold text-gray-800">{p.company}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-xs font-semibold whitespace-nowrap">
                                                    {p.method}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-xs">
                                                <p className="font-semibold text-gray-700">{p.accName}</p>
                                                {p.accNumber && <p className="text-gray-500">A/C: {p.accNumber}</p>}
                                                {p.accBranch && <p className="text-gray-500">Branch: {p.accBranch}</p>}
                                            </td>
                                            <td className="py-3 px-4">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewNote(p.note)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white rounded-xl transition duration-200 shadow-sm text-xs font-semibold cursor-pointer"
                                                    title="View Note"
                                                >
                                                    <FiEye className="w-3.5 h-3.5" />
                                                    View Note
                                                </button>
                                            </td>
                                            <td className="py-3 px-4 text-right whitespace-nowrap">
                                                <div className={`font-extrabold inline-flex items-center gap-1 ${p.net < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    <FiArrowDownLeft />
                                                    {p.net < 0 ? '-' : '+'}৳ {formatAmount(Math.abs(p.net))}
                                                </div>
                                                {adjText(p) && (
                                                    <div className={`text-[10px] font-bold mt-0.5 ${adjColor(p.adj)}`}>
                                                        {adjText(p)}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                            <span>Page <b className="text-gray-700">{currentPage}</b> of <b className="text-gray-700">{totalPages}</b></span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 rounded-lg border border-gray-200 bg-white disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer disabled:cursor-not-allowed"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PurchaseDamageReturnAcMon;