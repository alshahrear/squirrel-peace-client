import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaSyncAlt } from 'react-icons/fa';

const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round(num(n) * 100) / 100;
const fmt = (n) => num(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

const parseDate = (d) => {
    if (!d) return 0;
    const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
    const t = Date.parse(d);
    return !isNaN(t) ? t : 0;
};
const dayOnly = (ts) => {
    if (!ts) return 0;
    const dt = new Date(ts);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
};
const displayFormattedDate = (dateString) => {
    if (!dateString) return '';
    const [y, m, d] = dateString.split('-');
    if (!y || !m || !d) return dateString;
    return new Date(y, m - 1, d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const ProfitOthers = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ startDate: '', endDate: '', company: '', invoice: '', result: '' });
    const startDateRef = useRef(null);
    const endDateRef = useRef(null);

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true);
            const [dRes, pRes] = await Promise.all([
                fetch('http://localhost:5000/damage-return'),
                fetch('http://localhost:5000/purchase'),
            ]);
            const [d, p] = await Promise.all([dRes.json().catch(() => []), pRes.json().catch(() => [])]);
            const list = (Array.isArray(d) ? d : [])
                .filter((x) => x.status === 'Approved')
                .map((x) => ({
                    id: String(x._id),
                    company: x.company,
                    invoiceNo: x.invoiceNo,
                    dateRaw: x.returnDate,
                    ts: Date.parse(x.approvedAt || x.createdAt) || 0,
                    items: x.items || [],
                }));
            const fromPurchase = (Array.isArray(p) ? p : [])
                .filter(
                    (x) =>
                        (x.receiveStatus === 'Received' || x.receiveStatus === 'Yes') &&
                        (x.damageItems || []).length > 0 &&
                        (num(x.damageAdjustmentAmount) > 0 || x.damageStatus === 'Approved')
                )
                .map((x) => ({
                    id: `p-${x._id}`,
                    company: x.company,
                    invoiceNo: x.invoiceNo,
                    dateRaw: x.receiveDate || x.purchaseDate,
                    ts: Date.parse(x.damageApprovedAt || x.damageAt || x.createdAt) || 0,
                    items: x.damageItems || [],
                }));
            setReturns([...list, ...fromPurchase]);
        } catch (e) {
            console.error('Error fetching damage profit data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAll();
    }, [fetchAll]);

    // Sudhu profit / loss product row (even hole bad)
    const rows = useMemo(() => {
        const out = [];
        returns.forEach((r) => {
            const dateTs = parseDate(r.dateRaw) || r.ts;
            (r.items || []).forEach((it, idx) => {
                const bp = num(it.buyPrice);
                let qty = 0;
                let stockTotal = 0;
                (it.costBreakdown || []).forEach((l) => {
                    if (l.est) return;
                    qty += num(l.qty);
                    stockTotal += num(l.amount);
                });
                if (qty <= 0) return;
                stockTotal = r2(stockTotal);
                const retTotal = r2(bp * qty);
                const profit = r2(retTotal - stockTotal);
                if (profit === 0) return;
                out.push({
                    key: `${r.id}-${idx}`,
                    dateRaw: r.dateRaw,
                    dateTs,
                    dayTs: dayOnly(dateTs),
                    company: r.company || 'N/A',
                    invoiceNo: r.invoiceNo,
                    product: it.productName,
                    qty,
                    stockPerPcs: r2(stockTotal / qty),
                    stockTotal,
                    retPerPcs: bp,
                    retTotal,
                    profit,
                });
            });
        });
        return out.sort((a, b) => b.dateTs - a.dateTs);
    }, [returns]);

    const filtered = useMemo(() => {
        const st = filters.startDate ? dayOnly(parseDate(filters.startDate)) : 0;
        const en = filters.endDate ? dayOnly(parseDate(filters.endDate)) : 0;
        const co = filters.company.trim().toLowerCase();
        const inv = filters.invoice.trim().toLowerCase();
        return rows.filter((r) => {
            if (st && r.dayTs < st) return false;
            if (en && r.dayTs > en) return false;
            if (co && !String(r.company).toLowerCase().includes(co)) return false;
            if (inv && !String(r.invoiceNo || '').toLowerCase().includes(inv)) return false;
            if (filters.result === 'profit' && r.profit < 0) return false;
            if (filters.result === 'loss' && r.profit > 0) return false;
            return true;
        });
    }, [rows, filters]);

    const totals = useMemo(() => {
        const t = { stock: 0, ret: 0, profit: 0 };
        filtered.forEach((r) => {
            t.stock += r.stockTotal;
            t.ret += r.retTotal;
            t.profit += r.profit;
        });
        return { stock: r2(t.stock), ret: r2(t.ret), profit: r2(t.profit) };
    }, [filtered]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const handleFilterChange = (e) => {
        setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ startDate: '', endDate: '', company: '', invoice: '', result: '' });
        setCurrentPage(1);
    };

    const pColor = (v) => (v >= 0 ? 'text-emerald-600' : 'text-red-600');

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Others Profit
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Approved Damage Return (company te return) theke profit / loss</p>
                    </div>
                    <button
                        type="button"
                        onClick={fetchAll}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white font-semibold text-xs rounded-full transition cursor-pointer"
                    >
                        <FaSyncAlt size={11} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-violet-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Stock Cost</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.stock)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-blue-600">
                        <p className="text-sm text-white/80">Total Return</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(totals.ret)}</p>
                    </div>
                    <div className={`rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br ${totals.profit >= 0 ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-red-600'}`}>
                        <p className="text-sm text-white/80">{totals.profit >= 0 ? 'Net Profit' : 'Net Loss'}</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(Math.abs(totals.profit))}</p>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Profit Records</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {filtered.length} of {rows.length}
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <div className="relative w-full cursor-pointer" onClick={() => startDateRef.current?.showPicker?.() || startDateRef.current?.click()}>
                                    <input ref={startDateRef} type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                                    <input type="text" readOnly placeholder="Select start date" value={displayFormattedDate(filters.startDate)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                <div className="relative w-full cursor-pointer" onClick={() => endDateRef.current?.showPicker?.() || endDateRef.current?.click()}>
                                    <input ref={endDateRef} type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} className="absolute opacity-0 w-0 h-0 pointer-events-none" />
                                    <input type="text" readOnly placeholder="Select end date" value={displayFormattedDate(filters.endDate)} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <input type="text" name="company" placeholder="Search company..." value={filters.company} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50" />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Invoice</label>
                                <input type="text" name="invoice" placeholder="Search invoice..." value={filters.invoice} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50" />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Result</label>
                                <select name="result" value={filters.result} onChange={handleFilterChange} className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer">
                                    <option value="">All</option>
                                    <option value="profit">Profit</option>
                                    <option value="loss">Loss</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-16 text-gray-500 font-medium">Loading...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-gray-400 font-medium">No profit record found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100">
                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-xs uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-4">#</th>
                                        <th className="py-3 px-4">Date</th>
                                        <th className="py-3 px-4">Company</th>
                                        <th className="py-3 px-4">Invoice</th>
                                        <th className="py-3 px-4">Product</th>
                                        <th className="py-3 px-4 text-right">Stock Cost / pcs</th>
                                        <th className="py-3 px-4 text-right">Stock Total</th>
                                        <th className="py-3 px-4 text-right">Return / pcs</th>
                                        <th className="py-3 px-4 text-right">Return Total</th>
                                        <th className="py-3 px-4 text-right">Profit / Loss</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {current.map((r, i) => (
                                        <tr key={r.key} className="hover:bg-indigo-50/40 transition">
                                            <td className="py-3 px-4 text-gray-400">{start + i + 1}</td>
                                            <td className="py-3 px-4 whitespace-nowrap text-gray-600 font-medium">{r.dateRaw || 'N/A'}</td>
                                            <td className="py-3 px-4 whitespace-nowrap font-bold text-gray-800">{r.company}</td>
                                            <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold whitespace-nowrap">#{r.invoiceNo}</td>
                                            <td className="py-3 px-4 whitespace-nowrap font-semibold text-gray-800">
                                                {r.product} <span className="text-[11px] text-orange-600 font-bold">({fmt(r.qty)} pcs)</span>
                                            </td>
                                            <td className="py-3 px-4 text-right font-semibold text-violet-600 whitespace-nowrap">৳{fmt(r.stockPerPcs)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-violet-700 whitespace-nowrap">৳{fmt(r.stockTotal)}</td>
                                            <td className="py-3 px-4 text-right font-semibold text-amber-600 whitespace-nowrap">৳{fmt(r.retPerPcs)}</td>
                                            <td className="py-3 px-4 text-right font-bold text-amber-700 whitespace-nowrap">৳{fmt(r.retTotal)}</td>
                                            <td className={`py-3 px-4 text-right font-extrabold whitespace-nowrap ${pColor(r.profit)}`}>
                                                {r.profit < 0 ? '-' : '+'}৳{fmt(Math.abs(r.profit))}
                                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] text-white ${r.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                    {r.profit >= 0 ? 'Profit' : 'Loss'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-indigo-50/70 font-extrabold text-[13px] border-t-2 border-indigo-100">
                                        <td className="py-3 px-4 text-gray-700" colSpan={6}>Total ({filtered.length} records)</td>
                                        <td className="py-3 px-4 text-right text-violet-700 whitespace-nowrap">৳{fmt(totals.stock)}</td>
                                        <td className="py-3 px-4"></td>
                                        <td className="py-3 px-4 text-right text-amber-700 whitespace-nowrap">৳{fmt(totals.ret)}</td>
                                        <td className={`py-3 px-4 text-right whitespace-nowrap ${pColor(totals.profit)}`}>
                                            {totals.profit < 0 ? '-' : '+'}৳{fmt(Math.abs(totals.profit))}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}

                    {!loading && filtered.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{safePage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(safePage - 1)}
                                    disabled={safePage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'}`}
                                >
                                    <FaChevronLeft size={10} /> Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(safePage + 1)}
                                    disabled={safePage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'}`}
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

export default ProfitOthers;