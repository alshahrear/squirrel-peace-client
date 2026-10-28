import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight, FaClock, FaEdit } from 'react-icons/fa';

const CompanyBulkReturnAc = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [bulkReturns, setBulkReturns] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filter States
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        company: '',
        invoiceNo: '',
        paymentMethod: ''
    });

    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    // Fetch data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [bRes, cRes, pRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/purchase-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                ]);
                const bData = await bRes.json();
                const cData = await cRes.json();
                const pData = await pRes.json();
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setCompanies(Array.isArray(cData) ? cData : []);
                setPurchases(Array.isArray(pData) ? pData : []);
            } catch (error) {
                console.error('Error fetching bulk returns:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [location.pathname]);

    // Close Company dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // ---------- Helpers ----------
    const formatDateOnly = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date)) return String(value);
        return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const parseToLocalDate = (dateStr) => {
        if (!dateStr) return null;
        const datePart = String(dateStr).split(',')[0].trim();
        if (datePart.includes('/')) {
            const [d, m, y] = datePart.split('/');
            if (!d || !m || !y) return null;
            return new Date(Number(y), Number(m) - 1, Number(d));
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
            const [y, m, d] = datePart.split('-');
            return new Date(Number(y), Number(m) - 1, Number(d.slice(0, 2)));
        }
        const parsed = new Date(datePart);
        return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
    };

    // Sort time: createdAt -> _id time -> returnDate
    const getRowTime = (r) => {
        if (r.createdAt) {
            const c = new Date(r.createdAt).getTime();
            if (!isNaN(c)) return c;
        }
        const idTime = parseInt(String(r._id || '').slice(0, 8), 16) * 1000;
        if (!isNaN(idTime) && idTime > 0) return idTime;
        const d = parseToLocalDate(r.returnDate);
        return d ? d.getTime() : 0;
    };

    const getAccountLabel = (pay) => {
        if (!pay) return '';
        const acc = pay.account || {};
        if (pay.method === 'Purchase Adjustment') return 'Adjusted in Purchase Bill';
        if (pay.method === 'Bank') {
            return [acc.bankName, acc.accountNumber].filter(Boolean).join(' - ') +
                (acc.accountBranch ? ` (${acc.accountBranch})` : '');
        }
        if (pay.method === 'Mobile Banking') {
            return [acc.accountName, acc.accountNumber].filter(Boolean).join(' - ');
        }
        return acc.accountName || 'Cash';
    };

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

    // ---------- Rows ----------
    const returnRows = bulkReturns
        .map((b) => {
            // Purchase theke ashle, purchase bill e adjust kora hoyeche kina
            const adj =
                b.fromPurchase === true
                    ? Number(
                        purchases.find((p) => String(p._id) === String(b.purchaseId))?.returnAdjustmentAmount
                    ) || 0
                    : 0;
            return {
                key: b._id,
                id: b._id,
                fromPurchase: b.fromPurchase === true,
                purchaseId: b.purchaseId,
                returnDate: b.returnDate,
                editedAt: b.editedAt,
                createdAt: b.createdAt,
                invoiceNo: b.invoiceNo,
                company: b.company,
                returnAmount: Number(b.returnAmount) || 0,
                payment: adj > 0
                    ? { amount: adj, method: 'Purchase Adjustment', account: {} }
                    : (b.payment || null),
            };
        })
        .sort((a, b) => getRowTime(b) - getRowTime(a));

    // ---------- Filters ----------
    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', company: '', invoiceNo: '', paymentMethod: '' });
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

    const filteredRows = returnRows.filter((r) => {
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(r.returnDate);
            if (!d) return false;
            if (filters.startDate && d < parseToLocalDate(filters.startDate)) return false;
            if (filters.endDate && d > parseToLocalDate(filters.endDate)) return false;
        }
        if (filters.company && !r.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.invoiceNo && !r.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        if (filters.paymentMethod) {
            if (filters.paymentMethod === 'NotUsed') {
                if (r.payment) return false;
            } else if (r.payment?.method !== filters.paymentMethod) {
                return false;
            }
        }
        return true;
    });

    const methodOptions = [...new Set(returnRows.map((r) => r.payment?.method).filter(Boolean))];

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentRows = filteredRows.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) setCurrentPage(pageNumber);
    };

    // ---------- Summary ----------
    const totalReturn = filteredRows.reduce((s, r) => s + r.returnAmount, 0);
    const totalReceived = filteredRows.reduce((s, r) => s + (r.payment ? Number(r.payment.amount) || 0 : 0), 0);
    const totalDue = filteredRows.reduce(
        (s, r) => s + Math.max(r.returnAmount - (r.payment ? Number(r.payment.amount) || 0 : 0), 0),
        0
    );
    const totalGet = filteredRows.reduce(
        (s, r) => s + Math.max((r.payment ? Number(r.payment.amount) || 0 : 0) - r.returnAmount, 0),
        0
    );

    const handleOpenInvoice = (r) => {
        if (r.fromPurchase && r.purchaseId) {
            navigate(`/purchase-details/${r.purchaseId}`, { state: { scrollToReturn: true } });
        } else {
            navigate(`/purchase-bulk-return-view/${r.id}`);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">

                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                        Company Bulk Return Account
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">All purchase bulk returns and return payments received from companies.</p>
                </div>

                {/* Filter Panel */}
                <div className="bg-white shadow-lg rounded-2xl p-5 mb-6 border border-indigo-100">
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

                        {/* Company */}
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

                        {/* Payment Method */}
                        <div>
                            <label className="block text-gray-600 text-[11px] font-semibold mb-1">Payment Method</label>
                            <select
                                name="paymentMethod"
                                value={filters.paymentMethod}
                                onChange={handleFilterChange}
                                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                            >
                                <option value="">All</option>
                                <option value="NotUsed">Not Used</option>
                                {methodOptions.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-indigo-100">
                    <div className="p-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex flex-col md:flex-row justify-between md:items-center gap-3">
                        <h2 className="text-xl font-bold">Bulk Return Payments</h2>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                                Return: ৳{fmt(totalReturn)}
                            </span>
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                                Received: ৳{fmt(totalReceived)}
                            </span>
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                                Due: ৳{fmt(totalDue)}
                            </span>
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                                Extra: ৳{fmt(totalGet)}
                            </span>
                            <span className="bg-white/20 px-3 py-0.5 rounded-full text-xs font-semibold backdrop-blur-md">
                                Showing: {filteredRows.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filteredRows.length)}` : 0} of {filteredRows.length} ({returnRows.length} total)
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Invoice</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Company</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Method</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Payment Account</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Return Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Return Received Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Return Due Amount</th>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Return Extra Amount</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="9" className="text-center py-10 text-gray-400 text-sm">Loading...</td>
                                    </tr>
                                ) : currentRows.length > 0 ? (
                                    currentRows.map((r) => {
                                        const pay = r.payment;
                                        const received = pay ? Number(pay.amount) || 0 : 0;
                                        const due = Math.max(r.returnAmount - received, 0);
                                        const getAmt = Math.max(received - r.returnAmount, 0);
                                        return (
                                            <tr key={r.key} className="hover:bg-indigo-50/50 transition-colors">
                                                {/* Date */}
                                                <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-600">
                                                    <div className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                                                        <FaClock className="text-orange-500" size={10} />
                                                        Return: {r.returnDate || 'N/A'}
                                                    </div>
                                                    {r.editedAt && (
                                                        <div className="mt-0.5">
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                                <FaEdit size={10} /> Edited: {formatDateOnly(r.editedAt)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Invoice */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleOpenInvoice(r)}
                                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        {r.invoiceNo}
                                                    </button>
                                                    {r.fromPurchase && (
                                                        <div>
                                                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm">
                                                                From Purchase
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Company */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {r.company}
                                                </td>

                                                {/* Payment Method */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    {pay ? (
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                            {pay.method}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[10px]">
                                                            Not Used
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Payment Account */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {pay ? (
                                                        getAccountLabel(pay) || <span className="text-gray-400 italic">N/A</span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[10px]">
                                                            Not Used
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Return Amount */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-orange-600">
                                                    ৳ {fmt(r.returnAmount)}
                                                </td>

                                                {/* Return Received Amount */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                                    {pay ? (
                                                        <span className="text-emerald-600">৳ {fmt(received)}</span>
                                                    ) : (
                                                        <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[10px]">
                                                            Not Used
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Return Due Amount */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold">
                                                    <span className={due > 0 ? 'text-red-600' : 'text-emerald-600'}>
                                                        ৳ {fmt(due)}
                                                    </span>
                                                </td>

                                                {/* Return Extra Amount */}
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-600">
                                                    ৳ {fmt(getAmt)}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="9" className="text-center py-10 text-gray-400 text-sm">
                                            No bulk returns found!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    {filteredRows.length > 0 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
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
                                        } else if (
                                            pageNum === currentPage - 2 ||
                                            pageNum === currentPage + 2
                                        ) {
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

export default CompanyBulkReturnAc;