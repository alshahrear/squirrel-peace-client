import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { calcCustomerBalance } from '../../../Software/Contact/Customer/CustomerAccountAc';

const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const SaleCustomerDueRepo = () => {
    const location = useLocation();

    const [sales, setSales] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const [filters, setFilters] = useState({ customer: '', phone: '', address: '' });

    // Customer searchable-select state
    const [isCustomerOpen, setIsCustomerOpen] = useState(false);
    const customerDropdownRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [sRes, cRes, bRes, dRes, dpRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/sales'),
                    fetch('https://squirrel-peace-server.onrender.com/customer'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-damage'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-due-payment'),
                ]);
                const sData = await sRes.json();
                const cData = await cRes.json();
                const bData = await bRes.json();
                const dData = await dRes.json();
                const dpData = await dpRes.json();
                setSales(Array.isArray(sData) ? sData : []);
                setCustomers(Array.isArray(cData) ? cData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setDamageReturns(Array.isArray(dData) ? dData : []);
                setDuePayments(Array.isArray(dpData) ? dpData : []);
            } catch (error) {
                console.error('Error fetching customer due data:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
                setIsCustomerOpen(false);
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
        setFilters({ customer: '', phone: '', address: '' });
        setCurrentPage(1);
    };

    const filteredCustomerOptions = customers.filter((c) => {
        const s = filters.customer.toLowerCase();
        return (
            c.businessName?.toLowerCase().includes(s) ||
            c.contactNumber?.toLowerCase().includes(s)
        );
    });

    const handleSelectCustomer = (c) => {
        setFilters({ ...filters, customer: c.businessName, phone: c.contactNumber || '' });
        setCurrentPage(1);
        setIsCustomerOpen(false);
    };

    const handleClearCustomer = (e) => {
        e.stopPropagation();
        setFilters({ ...filters, customer: '', phone: '' });
        setCurrentPage(1);
        setIsCustomerOpen(false);
    };

    // ---------- Customer Account er moto Pay / Get hisab ----------
    // net > 0 => ami customer ke dibo (Pay), net < 0 => customer amake dibe (Get)
    const getCustomerBalance = (c) => {
        const bal = calcCustomerBalance(
            { sales, bulkReturns, damageReturns, duePayments, customers },
            c.businessName
        );
        return { pay: bal.net > 0 ? bal.net : 0, get: bal.net < 0 ? -bal.net : 0 };
    };

    // ---------- Rows: /customer API theke, notun add kora customer age ----------
    const allRows = customers
        .map((c) => {
            const bal = getCustomerBalance(c);
            return {
                key: c._id,
                customer: c.businessName || '',
                phone: c.contactNumber || '',
                address: c.address || '',
                pay: bal.pay,
                get: bal.get,
            };
        })
        .reverse();

    // ---------- Filtering ----------
    const filteredRows = allRows.filter((r) => {
        if (filters.customer && !r.customer.toLowerCase().includes(filters.customer.toLowerCase())) return false;
        if (filters.phone && !String(r.phone || '').toLowerCase().includes(filters.phone.toLowerCase())) return false;
        if (filters.address && !String(r.address || '').toLowerCase().includes(filters.address.toLowerCase())) return false;
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
    const sPay = r2(filteredRows.reduce((s, r) => s + r.pay, 0));
    const sGet = r2(filteredRows.reduce((s, r) => s + r.get, 0));

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Sales Customer Due Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">প্রতিটি customer এর Pay / Get amount — এক customer এক row</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Customer Due</h3>
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

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Customer Searchable Dropdown */}
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
                                            setFilters({ ...filters, customer: e.target.value, phone: '' });
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
                                        {filteredCustomerOptions.length > 0 ? (
                                            filteredCustomerOptions.map((c) => (
                                                <div
                                                    key={c._id}
                                                    onClick={() => handleSelectCustomer(c)}
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
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-700">
                            Showing
                        </span>
                        <span className="font-semibold text-gray-600">
                            Customers: <b className="text-gray-800">{filteredRows.length}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Pay Amount: <b className="text-rose-600">৳{fmt(sPay)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Get Amount: <b className="text-sky-600">৳{fmt(sGet)}</b>
                        </span>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading customer due...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No customers found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-[11px] [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-xs [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_td]:align-top">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white uppercase tracking-wide">
                                        <th>Customer</th>
                                        <th>Phone</th>
                                        <th>Address</th>
                                        <th>Pay Amount</th>
                                        <th>Get Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentRows.map((r) => (
                                        <tr key={r.key} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="font-bold text-gray-800">{r.customer}</td>
                                            <td className="text-gray-600">
                                                {r.phone || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className="text-gray-600">
                                                {r.address || <span className="text-gray-400 italic">N/A</span>}
                                            </td>
                                            <td className={`font-bold ${r.pay > 0 ? 'text-rose-600' : 'text-slate-400'}`}>৳{fmt(r.pay)}</td>
                                            <td className={`font-bold ${r.get > 0 ? 'text-sky-600' : 'text-slate-400'}`}>৳{fmt(r.get)}</td>
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

export default SaleCustomerDueRepo;