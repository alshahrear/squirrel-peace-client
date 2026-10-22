import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;

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

// ISO hole format kore dekhabe, noyto jemon ase temon
const fmtDateTime = (v) => {
    if (!v) return '';
    if (/^\d{4}-\d{2}-\d{2}T/.test(String(v))) {
        const d = new Date(v);
        if (isNaN(d)) return String(v);
        return d.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        });
    }
    return String(v);
};

const getTime = (v) => {
    if (!v) return 0;
    if (/^\d{4}-\d{2}-\d{2}T/.test(String(v))) {
        const t = new Date(v).getTime();
        return isNaN(t) ? 0 : t;
    }
    const d = parseToLocalDate(v);
    return d ? d.getTime() : 0;
};

const getAccountLabel = (p) => {
    const a = p.paymentAccount || {};
    if (p.paymentMethod === 'Bank') {
        return [a.bankName, a.accountNumber].filter(Boolean).join(' - ') + (a.accountBranch ? ` (${a.accountBranch})` : '');
    }
    if (p.paymentMethod === 'Mobile Banking') {
        return [a.accountName, a.accountNumber].filter(Boolean).join(' - ');
    }
    return a.accountName || 'Cash';
};

const PurCompanyLedgerRepo = () => {
    const location = useLocation();
    const navigate = useNavigate();

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
        invoiceNo: '',
        company: '',
        method: '',
        account: '',
        dueStatus: '',
    });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Account searchable-select state
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const accountDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutsideAccount = (event) => {
            if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
                setIsAccountOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideAccount);
        return () => document.removeEventListener('mousedown', handleClickOutsideAccount);
    }, []);

    // Checkbox selection
    const [selectedIds, setSelectedIds] = useState([]);

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
                console.error('Error fetching ledger data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutsideCompany = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutsideCompany);
        return () => document.removeEventListener('mousedown', handleClickOutsideCompany);
    }, []);

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', invoiceNo: '', company: '', method: '', account: '', dueStatus: '' });
        setCurrentPage(1);
    };

    const filteredCompanies = companies.filter((comp) =>
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

    // Jei purchase e payment kora hoyeche sheguloi ledger e ashbe (notun payment age)
    const rows = purchases
        .map((p, idx) => ({ p, idx }))
        .filter(({ p }) => p.paidAmount !== undefined && p.paidAmount !== null && p.paidAmount !== '' && n(p.paidAmount) > 0)
        .map(({ p, idx }) => {
            const payDate = p.paymentDate || p.receiveDate || p.purchaseDate || '';
            const payable = n(p.payableAmount);
            const paid = n(p.paidAmount);
            return {
                rowId: p._id,
                purchaseId: p._id,
                idx,
                payDate,
                payTime: getTime(payDate),
                editedAt: p.paymentEditedAt || '',
                invoiceNo: p.invoiceNo,
                company: p.company || '',
                method: p.paymentMethod || '',
                account: getAccountLabel(p),
                payable,
                paid,
                due: Math.max(payable - paid, 0),
            };
        })
        .sort((a, b) => b.payTime - a.payTime || b.idx - a.idx);

    const methodOptions = [...new Set(rows.map((r) => r.method).filter(Boolean))];

    // Account dropdown er list (unique)
    const accountOptions = [...new Set(rows.map((r) => r.account).filter(Boolean))];
    const filteredAccountOptions = accountOptions.filter((a) =>
        a.toLowerCase().includes(filters.account.toLowerCase())
    );

    const handleSelectAccount = (name) => {
        setFilters({ ...filters, account: name });
        setCurrentPage(1);
        setIsAccountOpen(false);
    };

    const handleClearAccount = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, account: '' });
        setCurrentPage(1);
        setIsAccountOpen(false);
    };

    // Filtering
    const filteredRows = rows.filter((r) => {
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(r.payDate);
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
        if (filters.invoiceNo && !r.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.company && !r.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.method && r.method !== filters.method) return false;
        if (filters.account && !r.account?.toLowerCase().includes(filters.account.toLowerCase())) return false;
        if (filters.dueStatus === 'Due' && !(r.due > 0)) return false;
        if (filters.dueStatus === 'NoDue' && !(r.due <= 0)) return false;
        return true;
    });

    // Pagination
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (num) => {
        if (num >= 1 && num <= totalPages) setCurrentPage(num);
    };

    // Checkbox
    const isAllSelected =
        currentRows.length > 0 && currentRows.every((r) => selectedIds.includes(r.rowId));

    const handleSelectAll = () => {
        const ids = currentRows.map((r) => r.rowId);
        if (isAllSelected) setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
        else setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    };

    const handleSelectRow = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };

    const selectedRows = filteredRows.filter((r) => selectedIds.includes(r.rowId));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filteredRows;

    const summaryPayable = summaryRows.reduce((s, r) => s + r.payable, 0);
    const summaryPaid = summaryRows.reduce((s, r) => s + r.paid, 0);
    const summaryDue = summaryRows.reduce((s, r) => s + r.due, 0);
    const fmt = (v) => v.toLocaleString('en-US', { maximumFractionDigits: 2 });

    const handleInvoiceClick = (id) => {
        navigate(`/purchase-details/${id}`, { state: { fromReport: true } });
    };

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Purchase Company Ledger
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">প্রতিটি invoice এর payment এর হিসাব — নতুন payment সবার উপরে</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Company Ledger</h3>
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
                                        {filteredCompanies.length > 0 ? (
                                            filteredCompanies.map((comp) => (
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

                            {/* Payment Method */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Payment Method</label>
                                <select
                                    name="method"
                                    value={filters.method}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    {methodOptions.map((m) => (
                                        <option key={m} value={m}>{m}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Account Searchable Dropdown */}
                            <div className="relative" ref={accountDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Account</label>
                                <div
                                    onClick={() => setIsAccountOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select account..."
                                        value={filters.account}
                                        onChange={(e) => {
                                            handleFilterChange({ target: { name: 'account', value: e.target.value } });
                                            setIsAccountOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.account && (
                                        <button type="button" onClick={handleClearAccount} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isAccountOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredAccountOptions.length > 0 ? (
                                            filteredAccountOptions.map((acc) => (
                                                <div
                                                    key={acc}
                                                    onClick={() => handleSelectAccount(acc)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {acc}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No account found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Due Status */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Due Status</label>
                                <select
                                    name="dueStatus"
                                    value={filters.dueStatus}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                >
                                    <option value="">All</option>
                                    <option value="Due">Has Due</option>
                                    <option value="NoDue">Fully Paid</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${isSelectionMode ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {isSelectionMode ? 'Selected' : 'Showing'}
                        </span>
                        <span className="font-semibold text-gray-600">
                            Rows: <b className="text-gray-800">{summaryRows.length}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Payable: <b className="text-indigo-600">৳{fmt(summaryPayable)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Payment: <b className="text-emerald-600">৳{fmt(summaryPaid)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Due: <b className="text-rose-600">৳{fmt(summaryDue)}</b>
                        </span>
                        {isSelectionMode && (
                            <button
                                onClick={() => setSelectedIds([])}
                                className="ml-auto text-[11px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading ledger...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No payments found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-[11px] [&_td]:px-2 [&_td]:py-2.5 [&_td]:text-xs [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_td]:align-top">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white uppercase tracking-wide">
                                        <th className="w-7 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th>Date</th>
                                        <th>Invoice</th>
                                        <th>Company</th>
                                        <th>Payment Method</th>
                                        <th>Account</th>
                                        <th>Payable Amount</th>
                                        <th>Payment Amount</th>
                                        <th>Due Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => (
                                        <tr
                                            key={r.rowId}
                                            className={`transition duration-150 ${selectedIds.includes(r.rowId) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}
                                        >
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(r.rowId)}
                                                    onChange={() => handleSelectRow(r.rowId)}
                                                    className="w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="text-gray-600">
                                                <div className="font-medium">{fmtDateTime(r.payDate) || 'N/A'}</div>
                                                {r.editedAt && (
                                                    <div className="text-[11px] text-amber-600 font-semibold">
                                                        Edited: {fmtDateTime(r.editedAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => handleInvoiceClick(r.purchaseId)}
                                                    className="text-indigo-700 hover:text-pink-600 hover:underline font-bold cursor-pointer transition-colors"
                                                >
                                                    {r.invoiceNo}
                                                </button>
                                            </td>
                                            <td className="text-gray-600">{r.company}</td>
                                            <td className="font-semibold text-gray-700">{r.method || 'N/A'}</td>
                                            <td className="text-gray-600">{r.account || 'N/A'}</td>
                                            <td className="font-semibold text-indigo-600">৳{r.payable.toFixed(2)}</td>
                                            <td className="font-bold text-emerald-600">৳{r.paid.toFixed(2)}</td>
                                            <td className={`font-bold ${r.due > 0 ? 'text-rose-600' : 'text-slate-400'}`}>৳{r.due.toFixed(2)}</td>
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

export default PurCompanyLedgerRepo;