import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Swal from 'sweetalert2';
import { FiEye, FiPieChart, FiX } from 'react-icons/fi';
import { FaFilter, FaRedo, FaSyncAlt, FaChevronDown, FaMoneyBillWave } from 'react-icons/fa';
import { inputCls, labelCls, Pager, DateInput } from '../../Product/ProductUi';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

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

const EMPTY_FILTERS = { startDate: '', endDate: '', invoice: '', category: '', name: '', accountType: '' };

const TYPE_TONE = {
    'Mobile Banking': 'bg-amber-50 text-amber-700',
    Bank: 'bg-indigo-50 text-indigo-700',
    Cash: 'bg-emerald-50 text-emerald-700',
};

const TypePill = ({ type }) => (
    <span
        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${TYPE_TONE[type] || 'bg-slate-100 text-slate-600'}`}
    >
        {type || 'N/A'}
    </span>
);

const accountTitle = (i) =>
    i.accountType === 'Mobile Banking' ? i.accountName : i.accountType === 'Bank' ? i.bankName : '';

const ProfitIncome = () => {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(false);

    const [showBreakdown, setShowBreakdown] = useState(false);
    const [breakdownVisible, setBreakdownVisible] = useState(false);

    const fetchIncomes = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch('http://localhost:5000/income');
            const data = await res.json();
            setIncomes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching incomes:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchIncomes();
    }, [fetchIncomes]);

    // Shudhu Inside income (incomeType na thakle Inside dhora hoy)
    const insideIncomes = useMemo(
        () =>
            incomes
                .filter((i) => (i.incomeType || 'Inside') === 'Inside')
                .map((i) => ({ ...i, ts: parseDate(i.date) }))
                .sort((a, b) => b.ts - a.ts),
        [incomes]
    );

    const categoryOptions = useMemo(
        () => [...new Set(insideIncomes.map((i) => i.incomeCategory).filter(Boolean))],
        [insideIncomes]
    );

    const filtered = useMemo(() => {
        const st = filters.startDate ? dayOnly(parseDate(filters.startDate)) : 0;
        const en = filters.endDate ? dayOnly(parseDate(filters.endDate)) : 0;
        const inv = filters.invoice.trim().toLowerCase();
        const nm = filters.name.trim().toLowerCase();
        return insideIncomes.filter((i) => {
            const day = dayOnly(i.ts);
            if (st && day < st) return false;
            if (en && day > en) return false;
            if (inv && !String(i.invoiceNumber || '').toLowerCase().includes(inv)) return false;
            if (nm && !String(i.name || '').toLowerCase().includes(nm)) return false;
            if (filters.category && i.incomeCategory !== filters.category) return false;
            if (filters.accountType && i.accountType !== filters.accountType) return false;
            return true;
        });
    }, [insideIncomes, filters]);

    const totalAmount = useMemo(() => filtered.reduce((s, i) => s + (Number(i.amount) || 0), 0), [filtered]);

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

    const handleViewNote = (note) => {
        const safe = String(note || 'No note available for this record.')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        Swal.fire({
            title: '<span style="font-size:18px;font-weight:700;color:#1e293b">Income Note</span>',
            html: `<div style="padding:12px;color:#475569;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;max-height:240px;overflow-y:auto;text-align:left;line-height:1.6;font-size:14px;word-break:break-word">${safe}</div>`,
            confirmButtonText: 'Close',
            confirmButtonColor: '#4a58e6',
            width: 420,
            customClass: { popup: 'rounded-2xl' },
        });
    };

    const hasAccountDetails = (i) => Boolean(i.bankName || i.accountNumber || i.accountBranch || i.accountName);

    // Breakdown
    const breakdown = useMemo(() => {
        const groups = {};
        filtered.forEach((i) => {
            const type = i.accountType?.trim() || 'Others';
            const amount = Number(i.amount) || 0;
            if (!groups[type]) groups[type] = { total: 0, subGroups: {} };
            groups[type].total += amount;

            const t = type.toLowerCase();
            let subKey = '';
            const number = i.accountNumber?.trim();
            if (t === 'mobile banking') {
                const provider = i.accountName?.trim();
                subKey = provider && number ? `${provider} (${number})` : provider || number || '';
            } else if (t === 'bank') {
                const bank = i.bankName?.trim();
                subKey = bank && number ? `${bank} (${number})` : bank || number || '';
            } else if (t !== 'cash') {
                const fb = i.bankName?.trim() || i.accountName?.trim();
                subKey = fb && number ? `${fb} (${number})` : fb || number || '';
            }
            if (subKey) groups[type].subGroups[subKey] = (groups[type].subGroups[subKey] || 0) + amount;
        });
        return groups;
    }, [filtered]);

    const openBreakdown = () => {
        setShowBreakdown(true);
        setTimeout(() => setBreakdownVisible(true), 10);
    };
    const closeBreakdown = () => {
        setBreakdownVisible(false);
        setTimeout(() => setShowBreakdown(false), 250);
    };

    const summary = [
        { label: 'Total Income (Inside)', value: `৳${fmt(totalAmount)}`, cls: 'text-emerald-600', bar: 'bg-emerald-500' },
        { label: 'Total Records', value: fmt(filtered.length), cls: 'text-brand-700', bar: 'bg-brand-500' },
    ];

    const noteBtn = (income, full = false) => (
        <button
            type="button"
            onClick={() => handleViewNote(income.note)}
            className={`inline-flex items-center justify-center gap-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 font-semibold cursor-pointer whitespace-nowrap ${full ? 'h-9 px-3 text-xs' : 'h-6 px-2 text-[10px] w-full'
                }`}
        >
            <FiEye className={full ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
            Note
        </button>
    );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            {/* Breakdown Modal */}
            {showBreakdown && (
                <div
                    className={`fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 transition-all duration-300 ${breakdownVisible ? 'bg-black/40 opacity-100' : 'bg-black/0 opacity-0'
                        }`}
                    onClick={closeBreakdown}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className={`bg-white w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh] transform transition-all duration-300 ${breakdownVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                            }`}
                    >
                        <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between border-b border-slate-200 bg-brand-50/60">
                            <div className="min-w-0">
                                <h3 className="text-base font-bold text-slate-800">Income Breakdown</h3>
                                <p className="text-xs text-slate-500">Inside income, account wise</p>
                            </div>
                            <button
                                type="button"
                                aria-label="Close"
                                onClick={closeBreakdown}
                                className="w-9 h-9 shrink-0 flex items-center justify-center rounded-lg text-slate-500 hover:bg-white hover:text-rose-600 cursor-pointer"
                            >
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto">
                            {Object.keys(breakdown).length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-sm">No data to show!</div>
                            ) : (
                                Object.entries(breakdown).map(([type, data]) => (
                                    <div key={type} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <TypePill type={type} />
                                            <span className="font-bold text-emerald-600 text-sm whitespace-nowrap">৳{fmt(data.total)}</span>
                                        </div>
                                        {Object.keys(data.subGroups).length > 0 && (
                                            <div className="mt-2 space-y-1 pl-3 border-l-2 border-brand-100">
                                                {Object.entries(data.subGroups).map(([k, v]) => (
                                                    <div key={k} className="flex items-center justify-between gap-3 text-xs text-slate-600">
                                                        <span className="font-medium break-words min-w-0">{k}</span>
                                                        <span className="font-semibold text-slate-700 whitespace-nowrap">৳{fmt(v)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="px-4 sm:px-5 py-3 bg-brand-50/60 border-t border-slate-200 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-700">Grand Total</span>
                            <span className="text-base sm:text-lg font-extrabold text-brand-700">৳{fmt(totalAmount)}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto space-y-4">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <span className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <FaMoneyBillWave size={15} />
                        </span>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-800 leading-tight">Income Net</h1>
                            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 leading-snug">শুধু Inside income এর হিসাব</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={fetchIncomes}
                        aria-label="Refresh"
                        className="h-9 w-9 sm:h-10 sm:w-auto sm:px-4 shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                        <FaSyncAlt size={12} className={loading ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Refresh</span>
                    </button>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    {summary.map((c) => (
                        <div key={c.label} className="relative bg-white rounded-2xl border border-slate-200 pl-4 pr-3 py-3 sm:py-4 overflow-hidden">
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

                    <div className={`${showFilters ? 'grid' : 'hidden'} lg:grid grid-cols-2 lg:grid-cols-6 gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}>
                        <div>
                            <span className={labelCls}>Start Date</span>
                            <DateInput name="startDate" value={filters.startDate} onChange={handleFilterChange} placeholder="Start date" />
                        </div>
                        <div>
                            <span className={labelCls}>End Date</span>
                            <DateInput name="endDate" value={filters.endDate} onChange={handleFilterChange} placeholder="End date" />
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
                            <label className={labelCls}>Income Category</label>
                            <select name="category" value={filters.category} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                <option value="">All</option>
                                {categoryOptions.map((c) => (
                                    <option key={c} value={c}>{c}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Name</label>
                            <input
                                type="text"
                                name="name"
                                placeholder="Search name..."
                                value={filters.name}
                                onChange={handleFilterChange}
                                className={inputCls}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Account Type</label>
                            <select name="accountType" value={filters.accountType} onChange={handleFilterChange} className={`${inputCls} cursor-pointer`}>
                                <option value="">All</option>
                                <option value="Cash">Cash</option>
                                <option value="Bank">Bank</option>
                                <option value="Mobile Banking">Mobile Banking</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4 space-y-2 sm:space-y-3">
                    <div className="flex flex-wrap items-center gap-2 px-1.5 pt-1.5 sm:p-0">
                        <h2 className="text-base font-semibold text-slate-800">Income Records</h2>
                        <span className="bg-brand-50 text-brand-700 px-3 py-0.5 rounded-full text-xs font-semibold">
                            {filtered.length} of {insideIncomes.length}
                        </span>
                        <span className="bg-emerald-50 text-emerald-700 px-3 py-0.5 rounded-full text-xs font-bold">
                            Total: ৳{fmt(totalAmount)}
                        </span>
                        <button
                            type="button"
                            onClick={openBreakdown}
                            className="ml-auto h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-brand-600 text-white text-xs font-semibold cursor-pointer"
                        >
                            <FiPieChart className="w-3.5 h-3.5" />
                            Breakdown
                        </button>
                    </div>

                    {loading ? (
                        <div className="space-y-3">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-16 text-slate-400 text-sm">No income record found!</div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {current.map((income, index) => {
                                    const title = accountTitle(income);
                                    return (
                                        <div
                                            key={income._id || index}
                                            className="relative rounded-xl border border-slate-200 bg-white pl-2.5 pr-1.5 py-1.5 shadow-sm"
                                        >
                                            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-emerald-500" />
                                            <div className="flex items-start gap-1.5">
                                                <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <p className="font-bold text-[12.5px] text-slate-800 truncate leading-tight min-w-0">
                                                            {income.incomeCategory || 'N/A'}
                                                        </p>
                                                        {income.invoiceNumber && (
                                                            <span className="shrink-0 bg-brand-50 text-brand-700 px-1.5 py-px rounded-full text-[9.5px] font-bold leading-tight">
                                                                #{income.invoiceNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Date: </span>
                                                        {income.date || 'N/A'}
                                                    </p>
                                                    <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                        <span className="uppercase text-slate-400 font-bold">Name: </span>
                                                        {income.name || 'N/A'}
                                                    </p>
                                                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                                                        <TypePill type={income.accountType} />
                                                        {title && <span className="text-[10px] font-semibold text-slate-600 truncate">{title}</span>}
                                                    </div>
                                                    {hasAccountDetails(income) && (income.accountNumber || income.accountBranch) && (
                                                        <p className="text-[10px] text-slate-500 leading-tight truncate">
                                                            {income.accountNumber && (
                                                                <>
                                                                    <span className="uppercase text-slate-400 font-bold">A/C: </span>
                                                                    {income.accountNumber}
                                                                </>
                                                            )}
                                                            {income.accountBranch && (
                                                                <>
                                                                    <span className="uppercase text-slate-400 font-bold ml-2">Br: </span>
                                                                    {income.accountBranch}
                                                                </>
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="shrink-0 w-[100px] flex flex-col gap-1">
                                                    <div className="rounded-md bg-emerald-50 px-1.5 py-1 text-right">
                                                        <p className="text-[8.5px] font-bold text-slate-500 uppercase leading-none">Amount</p>
                                                        <p className="text-[12px] font-extrabold text-emerald-600 whitespace-nowrap leading-tight mt-0.5">
                                                            ৳{fmt(income.amount)}
                                                        </p>
                                                    </div>
                                                    {noteBtn(income)}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Mobile total */}
                                <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 flex items-center justify-between">
                                    <p className="text-[10px] font-bold uppercase text-brand-700">Total ({filtered.length} records)</p>
                                    <p className="text-sm font-extrabold text-emerald-700 whitespace-nowrap">৳{fmt(totalAmount)}</p>
                                </div>
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[1000px] text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide whitespace-nowrap">
                                        <tr>
                                            <th className="px-3 py-3">#</th>
                                            <th className="px-3 py-3">Date</th>
                                            <th className="px-3 py-3">Invoice</th>
                                            <th className="px-3 py-3">Category</th>
                                            <th className="px-3 py-3">Name</th>
                                            <th className="px-3 py-3">Account</th>
                                            <th className="px-3 py-3">Details</th>
                                            <th className="px-3 py-3 text-center">Note</th>
                                            <th className="px-3 py-3 text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-slate-700">
                                        {current.map((income, index) => {
                                            const title = accountTitle(income);
                                            return (
                                                <tr key={income._id || index} className="hover:bg-slate-50">
                                                    <td className="px-3 py-3 text-slate-400">{start + index + 1}</td>
                                                    <td className="px-3 py-3 whitespace-nowrap text-xs font-medium text-slate-600">{income.date || 'N/A'}</td>
                                                    <td className="px-3 py-3 font-mono text-[11px] font-semibold text-brand-700 whitespace-nowrap">
                                                        {income.invoiceNumber || 'N/A'}
                                                    </td>
                                                    <td className="px-3 py-3 font-bold text-slate-800">{income.incomeCategory || 'N/A'}</td>
                                                    <td className="px-3 py-3 text-slate-600">{income.name || 'N/A'}</td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex flex-col items-start gap-1">
                                                            {title && <span className="font-semibold text-slate-700 text-xs">{title}</span>}
                                                            <TypePill type={income.accountType} />
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 text-xs text-slate-500">
                                                        {hasAccountDetails(income) ? (
                                                            <div className="space-y-0.5">
                                                                {income.accountNumber && (
                                                                    <p><b className="text-slate-700">A/C:</b> {income.accountNumber}</p>
                                                                )}
                                                                {income.accountBranch && (
                                                                    <p><b className="text-slate-700">Branch:</b> {income.accountBranch}</p>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span>Cash</span>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-center">{noteBtn(income, true)}</td>
                                                    <td className="px-3 py-3 text-right font-bold text-emerald-600 whitespace-nowrap">৳{fmt(income.amount)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-brand-50/60 font-extrabold text-[13px] border-t-2 border-brand-100">
                                            <td className="px-3 py-3 text-slate-700" colSpan={8}>Total ({filtered.length} records)</td>
                                            <td className="px-3 py-3 text-right text-emerald-700 whitespace-nowrap">৳{fmt(totalAmount)}</td>
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

export default ProfitIncome;