import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const norm = (v) => String(v || '').trim().toLowerCase();
const sumItems = (items) =>
    (items || []).reduce((s, it) => s + (Number(it.itemTotal ?? it.subtotal) || 0), 0);

const PurCompanyDueRepo = () => {
    const location = useLocation();

    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damageReturns, setDamageReturns] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Filters
    const [filters, setFilters] = useState({ company: '', phone: '', address: '' });

    // Company searchable-select state
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const companyDropdownRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [pRes, cRes, bRes, dRes, dpRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/damage-return'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase-due-payment'),
                ]);
                const pData = await pRes.json();
                const cData = await cRes.json();
                const bData = await bRes.json();
                const dData = await dRes.json();
                const dpData = await dpRes.json();
                setPurchases(Array.isArray(pData) ? pData : []);
                setCompanies(Array.isArray(cData) ? cData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setDamageReturns(Array.isArray(dData) ? dData : []);
                setDuePayments(Array.isArray(dpData) ? dpData : []);
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
        setFilters({ company: '', phone: '', address: '' });
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

    // ---------- Company Account er moto Pay / Get hisab ----------
    const getCompanyBalance = (c) => {
        const same = (name) => norm(name) === norm(c.businessName);
        let pay = 0;
        let get = 0;

        const addReturn = (amt, payment) => {
            const received = payment ? num(payment.amount) : 0;
            pay += Math.max(received - amt, 0);
            get += Math.max(amt - received, 0);
        };

        // Opening balance
        const oa = r2(num(c.openingBalance));
        const ot = norm(c.openingBalanceType);
        if (oa > 0 && ot === 'pay') pay += oa;
        else if (oa > 0 && ot === 'get') get += oa;

        // Purchase + Purchase return + Damage (from purchase)
        purchases.filter((p) => same(p.company)).forEach((p) => {
            const isRecv = p.receiveStatus === 'Received' || p.receiveStatus === 'Yes';
            if (p.paidAmount !== undefined && p.paidAmount !== null && p.paidAmount !== '' && !!p.paymentMethod) {
                const prevBal = num(p.previousBalanceAmount);
                const payable =
                    num(p.payableAmount) -
                    (p.previousBalanceType === 'Due' ? prevBal : 0) +
                    (p.previousBalanceType === 'Get' ? prevBal : 0);
                const paid = num(p.paidAmount);
                const balDue = payable < 0
                    ? Math.max(r2(paid + payable), 0)
                    : !isRecv ? 0 : Math.max(r2(payable - paid), 0);
                const balExtra = payable < 0
                    ? Math.max(r2(-payable - paid), 0)
                    : !isRecv ? paid : Math.max(r2(paid - payable), 0);
                pay += balDue;
                get += balExtra;
            }
            (p.returnHistory || []).forEach((ret) => addReturn(num(ret.totalReturnAmount), ret.payment || null));
            if (isRecv && (p.damageItems || []).length > 0 && (num(p.damageAdjustmentAmount) > 0 || p.damageStatus === 'Approved')) {
                const adj = num(p.damageAdjustmentAmount);
                addReturn(sumItems(p.damageItems), adj > 0 ? { amount: adj } : null);
            }
        });

        // Bulk return
        bulkReturns.filter((b) => same(b.company)).forEach((b) => {
            const adj =
                b.fromPurchase === true
                    ? num(purchases.find((p) => String(p._id) === String(b.purchaseId))?.returnAdjustmentAmount)
                    : 0;
            addReturn(num(b.returnAmount), adj > 0 ? { amount: adj } : b.payment || null);
        });

        // Damage return (shudhu Approved)
        damageReturns.filter((d) => same(d.company) && d.status === 'Approved').forEach((d) => {
            addReturn(num(d.damageAmount) || num(d.returnAmount) || sumItems(d.items), d.payment || null);
        });

        // Company due payment (Pay / Get)
        duePayments.filter((p) => same(p.company)).forEach((p) => {
            const isGet = p.type === 'Get' || p.status === 'Get' || p.paymentAccount?.dueType === 'Get';
            const amt = r2(num(p.amount));
            if (isGet) pay += amt;
            else get += amt;
        });

        const net = r2(pay - get);
        return { pay: net > 0 ? net : 0, get: net < 0 ? -net : 0 };
    };

    // ---------- Rows: /company API theke, notun add kora company age ----------
    const allRows = companies
        .map((c) => {
            const bal = getCompanyBalance(c);
            return {
                key: c._id,
                company: c.businessName || '',
                phone: c.contactNumber || '',
                address: c.address || '',
                pay: bal.pay,
                get: bal.get,
            };
        })
        .reverse();

    // ---------- Filtering ----------
    const filteredRows = allRows.filter((r) => {
        if (filters.company && !r.company.toLowerCase().includes(filters.company.toLowerCase())) return false;
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
                        Purchase Company Due Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">প্রতিটি company এর Pay / Get amount — এক company এক row</p>
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

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                            Pay Amount: <b className="text-rose-600">৳{fmt(sPay)}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Get Amount: <b className="text-sky-600">৳{fmt(sGet)}</b>
                        </span>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading company due...</div>
                    ) : filteredRows.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No companies found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-[11px] [&_td]:px-3 [&_td]:py-2.5 [&_td]:text-xs [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_td]:align-top">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white uppercase tracking-wide">
                                        <th>Company</th>
                                        <th>Phone</th>
                                        <th>Address</th>
                                        <th>Pay Amount</th>
                                        <th>Get Amount</th>
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

export default PurCompanyDueRepo;