import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { FaFilter, FaRedo, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

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
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(datePart);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const sumRow = (row) => {
    let inn = 0;
    let out = 0;
    (row.items || []).forEach((it) => {
        const m = Number(it.totalQty) || 0;
        const f = Number(it.freeQty) || 0;
        if (it.mainType === 'out') out += m; else inn += m;
        if (it.freeType === 'out') out += f; else inn += f;
    });
    return { inn, out };
};

const StockAdjustment = () => {
    const navigate = useNavigate();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [filters, setFilters] = useState({ startDate: '', endDate: '', company: '', invoiceNo: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const itemsPerPage = 30;
    const fetched = useRef(false);

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
    };

    useEffect(() => {
        const handler = (e) => {
            if (!e.target.closest('.action-dropdown-container')) setOpenDropdownId(null);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        if (fetched.current) return;
        fetched.current = true;
        fetch('https://squirrel-peace-server.onrender.com/stock-adjustment')
            .then((res) => res.json())
            .then((data) => setRows(Array.isArray(data) ? [...data].reverse() : []))
            .catch((err) => {
                console.error(err);
                showToast('Failed to load adjustments!', 'error');
            })
            .finally(() => setLoading(false));
    }, []);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', company: '', invoiceNo: '' });
        setCurrentPage(1);
    };

    const handleDelete = async (id) => {
        setOpenDropdownId(null);
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!',
        });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`https://squirrel-peace-server.onrender.com/stock-adjustment/${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast('Adjustment deleted successfully!');
                setRows((prev) => prev.filter((r) => r._id !== id));
            } else {
                const err = await res.json().catch(() => ({}));
                showToast(err.message || 'Failed to delete!', 'error');
            }
        } catch (e) {
            showToast('Server error while deleting!', 'error');
        }
    };

    const filtered = rows.filter((r) => {
        if (filters.startDate || filters.endDate) {
            const d = parseToLocalDate(r.adjustmentDate);
            if (!d) return false;
            const s = parseToLocalDate(filters.startDate);
            const e = parseToLocalDate(filters.endDate);
            if (s && d < s) return false;
            if (e && d > e) return false;
        }
        if (filters.company && !r.company?.toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.invoiceNo && !r.invoiceNo?.toLowerCase().includes(filters.invoiceNo.toLowerCase())) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const first = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(first, first + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const grand = filtered.reduce(
        (s, r) => {
            const t = sumRow(r);
            return { inn: s.inn + t.inn, out: s.out + t.out };
        },
        { inn: 0, out: 0 }
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    {toast.message}
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Stock Adjustment
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Stock In / Out adjustment track korun</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-emerald-400">Total In (+)</div>
                            <div className="text-lg font-extrabold text-emerald-700">{fmt(grand.inn)} pcs</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-rose-50 border border-rose-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-rose-400">Total Out (−)</div>
                            <div className="text-lg font-extrabold text-rose-700">{fmt(grand.out)} pcs</div>
                        </div>
                        <button
                            onClick={() => navigate('/stock-adjustment-form')}
                            className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                        >
                            + New Adjustment
                        </button>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Adjustment Directory</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {filtered.length} of {rows.length}
                        </span>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button onClick={handleClearFilters} className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg font-semibold cursor-pointer">
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <input type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50" />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                <input type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50" />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <input type="text" name="company" placeholder="Search company..." value={filters.company} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50/50" />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice Number</label>
                                <input type="text" name="invoiceNo" placeholder="Search invoice..." value={filters.invoiceNo} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 outline-none bg-gray-50/50" />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading adjustments...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No adjustments found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Invoice No</th>
                                        <th className="py-3 px-3">In (+)</th>
                                        <th className="py-3 px-3">Out (−)</th>
                                        <th className="py-3 px-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                    {current.map((r) => {
                                        const t = sumRow(r);
                                        return (
                                            <tr key={r._id} className="hover:bg-indigo-50/40 transition">
                                                <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-medium">{r.adjustmentDate || 'N/A'}</td>
                                                <td className="py-3 px-3 whitespace-nowrap font-bold text-gray-800">{r.company}</td>
                                                <td className="py-3 px-3 whitespace-nowrap text-gray-600 font-medium">#{r.invoiceNo}</td>
                                                <td className="py-3 px-3 whitespace-nowrap font-bold text-emerald-600">{t.inn > 0 ? `+${fmt(t.inn)} pcs` : <span className="text-gray-300">—</span>}</td>
                                                <td className="py-3 px-3 whitespace-nowrap font-bold text-rose-600">{t.out > 0 ? `−${fmt(t.out)} pcs` : <span className="text-gray-300">—</span>}</td>
                                                <td className="py-3 px-3 text-center">
                                                    <div className="relative inline-block action-dropdown-container">
                                                        <button
                                                            onClick={() => setOpenDropdownId(openDropdownId === r._id ? null : r._id)}
                                                            className="px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl font-semibold text-[11px] shadow-sm cursor-pointer"
                                                        >
                                                            Select ▾
                                                        </button>
                                                        {openDropdownId === r._id && (
                                                            <div className="absolute right-0 bottom-full mb-2 w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left">
                                                                <button onClick={() => navigate(`/stock-adjustment-view/${r._id}`)} className="w-full px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 text-left cursor-pointer">View</button>
                                                                <button onClick={() => navigate(`/stock-adjustment-form?edit=${r._id}`, { state: { adjustment: r } })} className="w-full px-4 py-2.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 text-left cursor-pointer">Edit</button>
                                                                <button onClick={() => handleDelete(r._id)} className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer">Delete</button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200 shadow-sm cursor-pointer'}`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 border border-gray-200 shadow-sm cursor-pointer'}`}
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

export default StockAdjustment;