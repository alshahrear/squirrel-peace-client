import React, { useState, useEffect, useCallback, useRef } from 'react';
import Swal from 'sweetalert2';
import { FiArrowUpRight, FiEye, FiDollarSign, FiSmartphone, FiCreditCard, FiHash, FiMapPin } from 'react-icons/fi';
import { FaFilter, FaRedo, FaTimes } from 'react-icons/fa';

const POLL_INTERVAL = 5000;

const SalesBulkReturnAcMon = () => {
    const [bulks, setBulks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        orderNo: '',
        customer: '',
        method: '',
        account: '',
    });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);
    const [customers, setCustomers] = useState([]);
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const customerDropdownRef = useRef(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    useEffect(() => {
        fetch('http://localhost:5000/customer')
            .then((res) => res.json())
            .then((data) => setCustomers(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching customers:', error));
    }, []);

    useEffect(() => {
        const handler = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('http://localhost:5000/sales-bulk-return');
            const data = await res.json();
            setBulks(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching sales bulk return payments:', error);
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

    const getCustomerName = (c) => c.businessName || c.name || '';

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };

    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', orderNo: '', customer: '', method: '', account: '' });
        setIsCustomerOpen(false);
        setCurrentPage(1);
    };

    const filteredCustomers = customers.filter((c) => {
        const s = filters.customer.toLowerCase();
        return (
            getCustomerName(c).toLowerCase().includes(s) ||
            c.contactNumber?.toLowerCase().includes(s)
        );
    });

    const handleSelectCustomer = (c) => {
        setFilters((prev) => ({ ...prev, customer: getCustomerName(c) }));
        setCurrentPage(1);
        setIsCustomerOpen(false);
    };

    const handleClearCustomer = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, customer: '' }));
        setCurrentPage(1);
        setIsCustomerOpen(false);
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

    // Sales bulk return e customer ke taka dile account theke jay (OUT)
    const payments = [];
    bulks.forEach((b) => {
        const pay = b.payment;
        if (!pay || !(Number(pay.amount) > 0) || !pay.method) return;
        const a = pay.account || {};
        const accName = pay.method === 'Bank' ? a.bankName : a.accountName;
        payments.push({
            key: String(b._id),
            time: b.editedAt || b.createdAt || '',
            paymentDate: b.createdAt || '',
            editedAt: b.editedAt || '',
            orderNo: b.invoiceNo || b.orderNo || '',
            customer: b.customer,
            method: pay.method,
            accName: accName || 'Cash',
            accNumber: a.accountNumber || '',
            accBranch: a.accountBranch || '',
            amount: Number(pay.amount) || 0,
            returnAmount: Number(b.returnAmount) || 0,
            note: pay.note || '',
        });
    });
    payments.sort((x, y) => (Date.parse(y.time) || 0) - (Date.parse(x.time) || 0));

    const filtered = payments.filter((p) => {
        if (filters.startDate || filters.endDate) {
            const day = toLocalDay(p.paymentDate || p.time);
            if (!day) return false;
            if (filters.startDate && day < toLocalDay(filters.startDate)) return false;
            if (filters.endDate && day > toLocalDay(filters.endDate)) return false;
        }
        if (filters.method && p.method !== filters.method) return false;
        if (filters.orderNo && !String(p.orderNo || '').toLowerCase().includes(filters.orderNo.toLowerCase())) return false;
        if (filters.customer && !String(p.customer || '').toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.account) {
            const s = filters.account.toLowerCase();
            if (![p.accName, p.accNumber, p.accBranch].some((v) => String(v || '').toLowerCase().includes(s))) return false;
        }
        return true;
    });

    const totalPaid = filtered.reduce((s, p) => s + p.amount, 0);
    const totalReturnAmt = filtered.reduce((s, p) => s + p.returnAmount, 0);

    const breakdownGroups = { Cash: {}, 'Mobile Banking': {}, Bank: {} };
    filtered.forEach((p) => {
        const group = breakdownGroups[p.method] ? p.method : 'Cash';
        const key = `${p.accName}||${p.accNumber}||${p.accBranch}`;
        if (!breakdownGroups[group][key]) {
            breakdownGroups[group][key] = { accName: p.accName, accNumber: p.accNumber, accBranch: p.accBranch, amount: 0 };
        }
        breakdownGroups[group][key].amount += p.amount;
    });

    const buildSection = (title, icon, accent, box) => {
        const items = Object.values(breakdownGroups[title]).sort((a, b) => b.amount - a.amount);
        return { title, icon, accent, box, items, total: items.reduce((s, i) => s + i.amount, 0) };
    };

    const breakdownSections = [
        buildSection('Cash', <FiDollarSign />, 'bg-gradient-to-tr from-emerald-500 to-teal-600', 'bg-emerald-50/60 border-emerald-100'),
        buildSection('Mobile Banking', <FiSmartphone />, 'bg-gradient-to-tr from-amber-500 to-orange-600', 'bg-amber-50/60 border-amber-100'),
        buildSection('Bank', <FiCreditCard />, 'bg-gradient-to-tr from-indigo-500 to-blue-600', 'bg-indigo-50/60 border-indigo-100'),
    ];

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Sales Bulk Return Account Monitor
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Sales bulk return এর কারণে customer কে account থেকে যাওয়া টাকার হিসাব</p>
                    </div>
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Updating
                    </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-rose-500 to-red-600">
                        <p className="text-sm text-white/80">Total Paid (Account থেকে বের)</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {formatAmount(totalPaid)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-orange-500 to-amber-500">
                        <p className="text-sm text-white/80">Total Return Amount</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {formatAmount(totalReturnAmt)}</p>
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
                                        <span className="text-sm font-extrabold whitespace-nowrap text-rose-600">
                                            -৳ {formatAmount(s.total)}
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
                                                <span className="font-bold whitespace-nowrap text-rose-600">
                                                    -৳ {formatAmount(acc.amount)}
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
                        <h3 className="text-xl font-bold text-gray-800">Bulk Return Payment Records</h3>
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
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice No</label>
                                <input
                                    type="text"
                                    name="orderNo"
                                    placeholder="Search invoice..."
                                    value={filters.orderNo}
                                    onChange={handleFilterChange}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>

                            <div className="relative" ref={customerDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Customer</label>
                                <div
                                    onClick={() => setIsCustomerOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select customer..."
                                        value={filters.customer}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, customer: e.target.value }));
                                            setCurrentPage(1);
                                            setIsCustomerOpen(true);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.customer && (
                                        <button type="button" onClick={handleClearCustomer} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>

                                {isCustomerOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredCustomers.length > 0 ? (
                                            filteredCustomers.map((c) => (
                                                <div
                                                    key={c._id}
                                                    onClick={() => handleSelectCustomer(c)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{getCustomerName(c)}</p>
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
                        <div className="text-center py-16 text-gray-400 font-medium">No sales bulk return payment found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs uppercase tracking-wide">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Invoice No</th>
                                        <th className="py-3 px-4">Customer</th>
                                        <th className="py-3 px-4">Method</th>
                                        <th className="py-3 px-4">Account</th>
                                        <th className="py-3 px-4">Note</th>
                                        <th className="py-3 px-4 text-right">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {current.map((p, i) => (
                                        <tr key={p.key} className="hover:bg-indigo-50/40 transition">
                                            <td className="py-3 px-4 text-gray-400">{start + i + 1}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-gray-600">
                                                <div className="font-medium">{formatTime(p.paymentDate || p.time)}</div>
                                                {p.editedAt && (
                                                    <div className="text-[10px] font-semibold text-amber-600 mt-0.5">
                                                        Edited: {formatTime(p.editedAt)}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 font-mono text-xs font-semibold text-indigo-600">{p.orderNo}</td>
                                            <td className="py-3 px-4 font-bold text-gray-800">{p.customer}</td>
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
                                            <td className="py-3 px-4 text-right font-extrabold whitespace-nowrap text-rose-600">
                                                <span className="inline-flex items-center gap-1">
                                                    <FiArrowUpRight />
                                                    -৳ {formatAmount(p.amount)}
                                                </span>
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

export default SalesBulkReturnAcMon;