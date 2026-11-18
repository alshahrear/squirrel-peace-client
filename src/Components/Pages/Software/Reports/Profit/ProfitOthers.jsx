import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FaFilter, FaRedo, FaSyncAlt, FaChevronDown, FaBoxOpen } from 'react-icons/fa';
import { inputCls, labelCls, Pager, DateInput } from '../../Product/ProductUi';

const num = (v) => Number(v) || 0;
const r2 = (n) => Math.round(num(n) * 100) / 100;
const fmt = (n) => num(n).toLocaleString('en-US', { maximumFractionDigits: 2 });

const parseDate = (d) => {
    if (!d) return 0;
    const s = String(d).trim();
    const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (iso) return new Date(+iso[1], +iso[2] - 1, +iso[3]).getTime();
    const m = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
    if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
    const t = Date.parse(s);
    return !isNaN(t) ? t : 0;
};
const dayOnly = (ts) => {
    if (!ts) return 0;
    const dt = new Date(ts);
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
};

const EMPTY_FILTERS = { startDate: '', endDate: '', company: '', invoice: '', result: '' };

const ProfitOthers = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(false);

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
        setFilters(EMPTY_FILTERS);
        setCurrentPage(1);
    };
    const activeCount = Object.values(filters).filter(Boolean).length;

    const isProfit = totals.profit >= 0;
    const pText = (v) => (v >= 0 ? 'text-emerald-600' : 'text-rose-600');
    const pSign = (v) => (v < 0 ? '-' : '+');

    const summary = [
        { label: 'Total Stock Cost', value: `৳${fmt(totals.stock)}`, cls: 'text-violet-600', bar: 'bg-violet-500' },
        { label: 'Total Return', value: `৳${fmt(totals.ret)}`, cls: 'text-amber-600', bar: 'bg-amber-500' },
        {
            label: isProfit ? 'Net Profit' : 'Net Loss',
            value: `৳${fmt(Math.abs(totals.profit))}`,
            cls: isProfit ? 'text-emerald-600' : 'text-rose-600',
            bar: isProfit ? 'bg-emerald-500' : 'bg-rose-500',
        },
    ];

    const ResultPill = ({ profit }) => (
        <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                profit >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
        >
            {profit >= 0 ? 'Profit' : 'Loss'}
        </span>
    );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                            <FaBoxOpen size={15} />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight">Others Profit</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">
                                Approved Damage Return (company te return) theke profit / loss
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchAll}
                        aria-label="Refresh"
                        className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <FaSyncAlt size={12} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {summary.map((c, idx) => (
                        <div
                            key={c.label}
                            className={`relative bg-white rounded-2xl border border-slate-200 pl-4 pr-3 py-3 sm:py-4 overflow-hidden ${
                                idx === 2 ? 'col-span-2 sm:col-span-1' : ''
                            }`}
                        >
                            <span className={`absolute left-0 top-0 bottom-0 w-1 ${c.bar}`} />
                            <p className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
                            <p className={`text-base sm:text-2xl font-extrabold mt-1 break-words leading-tight ${c.cls}`}>{c.value}</p>
                        </div>
                    ))}
                </div>

                {/* Filter */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
                    <div className="flex items-center justify-between gap-2">
                        <button
                            type="button"
                            onClick={() => setShowFilters((v) => !v)}
                            aria-expanded={showFilters}
                            className="h-10 flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer lg:cursor-default"
                        >
                            <FaFilter className="text-brand-600" size={13} />
                            Filter & Search
                            {activeCount > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold">{activeCount}</span>
                            )}
                            <FaChevronDown size={10} className={`lg:hidden text-slate-400 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                        </button>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                        >
                            <FaRedo size={11} /> Clear
                        </button>
                    </div>

                    <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-2 lg:grid-cols-5 gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}>
                        <div>
                            <span className={labelCls}>Start Date</span>
                            <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                        </div>
                        <div>
                            <span className={labelCls}>End Date</span>
                            <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
                        </div>
                        <div>
                            <label className={labelCls}>Company</label>
                            <input
                                type="text"
                                name="company"
                                placeholder="Search company..."
                                value={filters.company}
                                onChange={handleFilterChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Invoice</label>
                            <input
                                type="text"
                                name="invoice"
                                placeholder="Search invoice..."
                                value={filters.invoice}
                                onChange={handleFilterChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Result</label>
                            <select name="result" value={filters.result} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                <option value="">All</option>
                                <option value="profit">Profit</option>
                                <option value="loss">Loss</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center gap-2 px-1.5 pt-1.5 sm:p-0">
                        <h2 className="text-base font-semibold text-slate-800">Profit Records</h2>
                        <span className="bg-brand-50 text-brand-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                            {filtered.length} of {rows.length}
                        </span>
                        <span
                            className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                                isProfit ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                            }`}
                        >
                            {isProfit ? 'Profit' : 'Loss'}: ৳{fmt(Math.abs(totals.profit))}
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">No profit record found!</div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {current.map((r) => (
                                    <div
                                        key={r.key}
                                        className="relative rounded-xl border border-slate-200 bg-white pl-2.5 pr-1.5 py-1.5 shadow-sm"
                                    >
                                        <span
                                            className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${
                                                r.profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`}
                                        />
                                        <div className="flex items-start gap-1.5">
                                            <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="font-bold text-[12.5px] text-slate-800 truncate leading-tight min-w-0">
                                                        {r.product || 'N/A'}
                                                    </p>
                                                    <span className="shrink-0 text-[10px] text-orange-600 font-bold">({fmt(r.qty)} pcs)</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <p className="text-[10px] text-slate-500 leading-tight truncate min-w-0">
                                                        <span className="uppercase text-slate-400 font-bold">Co: </span>
                                                        {r.company}
                                                    </p>
                                                    {r.invoiceNo && (
                                                        <span className="shrink-0 bg-brand-50 text-brand-700 px-1.5 py-px rounded-full text-[9.5px] font-bold leading-tight">
                                                            #{r.invoiceNo}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                    <span className="uppercase text-slate-400 font-bold">Date: </span>
                                                    {r.dateRaw || 'N/A'}
                                                </p>
                                                <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                    <span className="uppercase text-slate-400 font-bold">Stock: </span>
                                                    <span className="font-semibold text-violet-600">৳{fmt(r.stockPerPcs)}</span>
                                                    <span className="text-slate-400"> /pcs → </span>
                                                    <span className="font-semibold text-violet-700">৳{fmt(r.stockTotal)}</span>
                                                </p>
                                                <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                    <span className="uppercase text-slate-400 font-bold">Return: </span>
                                                    <span className="font-semibold text-amber-600">৳{fmt(r.retPerPcs)}</span>
                                                    <span className="text-slate-400"> /pcs → </span>
                                                    <span className="font-semibold text-amber-700">৳{fmt(r.retTotal)}</span>
                                                </p>
                                            </div>
                                            <div
                                                className={`shrink-0 w-[100px] rounded-md px-1.5 py-1 text-right ${
                                                    r.profit >= 0 ? 'bg-emerald-50' : 'bg-rose-50'
                                                }`}
                                            >
                                                <p className="text-[8.5px] font-bold text-slate-500 uppercase leading-none">
                                                    {r.profit >= 0 ? 'Profit' : 'Loss'}
                                                </p>
                                                <p className={`text-[12px] font-extrabold whitespace-nowrap leading-tight mt-0.5 ${pText(r.profit)}`}>
                                                    {pSign(r.profit)}৳{fmt(Math.abs(r.profit))}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Mobile total */}
                                <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 space-y-1">
                                    <p className="text-[10px] font-bold uppercase text-brand-700">Total ({filtered.length} records)</p>
                                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                                        <span className="font-semibold">Stock</span>
                                        <span className="font-bold text-violet-700">৳{fmt(totals.stock)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                                        <span className="font-semibold">Return</span>
                                        <span className="font-bold text-amber-700">৳{fmt(totals.ret)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-bold text-slate-700">{isProfit ? 'Net Profit' : 'Net Loss'}</span>
                                        <span className={`font-extrabold whitespace-nowrap ${pText(totals.profit)}`}>
                                            {pSign(totals.profit)}৳{fmt(Math.abs(totals.profit))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[1000px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">
                                        <tr>
                                            <th className="px-3 py-3">#</th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Company</th>
                                            <th className="px-3 py-3">Invoice</th>
                                            <th className="px-3 py-3">Product</th>
                                            <th className="px-3 py-3 text-right">Stock / pcs</th>
                                            <th className="px-3 py-3 text-right">Stock Total</th>
                                            <th className="px-3 py-3 text-right">Return / pcs</th>
                                            <th className="px-3 py-3 text-right">Return Total</th>
                                            <th className="px-3 py-3 text-right">Profit / Loss</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {current.map((r, i) => (
                                            <tr key={r.key} className="hover:bg-slate-50">
                                                <td className="px-3 py-3 text-slate-400">{start + i + 1}</td>
                                                <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-slate-600">{r.dateRaw || 'N/A'}</td>
                                                <td className="px-3 py-3 whitespace-nowrap font-bold text-slate-800">{r.company}</td>
                                                <td className="px-3 py-3 font-mono text-[11px] font-semibold text-brand-700 whitespace-nowrap">
                                                    #{r.invoiceNo}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap font-semibold text-slate-800">
                                                    {r.product}{' '}
                                                    <span className="text-[11px] text-orange-600 font-bold">({fmt(r.qty)} pcs)</span>
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-violet-600 whitespace-nowrap">৳{fmt(r.stockPerPcs)}</td>
                                                <td className="px-3 py-3 text-right font-bold text-violet-700 whitespace-nowrap">৳{fmt(r.stockTotal)}</td>
                                                <td className="px-3 py-3 text-right font-semibold text-amber-600 whitespace-nowrap">৳{fmt(r.retPerPcs)}</td>
                                                <td className="px-3 py-3 text-right font-bold text-amber-700 whitespace-nowrap">৳{fmt(r.retTotal)}</td>
                                                <td className="px-3 py-3 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <span className={`font-extrabold ${pText(r.profit)}`}>
                                                            {pSign(r.profit)}৳{fmt(Math.abs(r.profit))}
                                                        </span>
                                                        <ResultPill profit={r.profit} />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-brand-50/60 font-extrabold text-[13px] border-t-2 border-brand-100">
                                            <td className="px-3 py-3 text-slate-700" colSpan={6}>Total ({filtered.length} records)</td>
                                            <td className="px-3 py-3 text-right text-violet-700 whitespace-nowrap">৳{fmt(totals.stock)}</td>
                                            <td className="px-3 py-3"></td>
                                            <td className="px-3 py-3 text-right text-amber-700 whitespace-nowrap">৳{fmt(totals.ret)}</td>
                                            <td className={`px-3 py-3 text-right whitespace-nowrap ${pText(totals.profit)}`}>
                                                {pSign(totals.profit)}৳{fmt(Math.abs(totals.profit))}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="px-1 py-1">
                                <Pager page={safePage} total={totalPages} onChange={handlePageChange} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProfitOthers;