import React, { useEffect, useRef, useState } from 'react';
import {
    FaSearch, FaTimes, FaChevronDown, FaCheckCircle, FaFilter, FaRedo,
    FaArrowUp, FaArrowDown, FaBalanceScale,
} from 'react-icons/fa';
import { Skeleton, Pager, inputCls, labelCls, PopStyle, DateInput } from '../Product/ProductUi';
import TabBar from '../../../../hooks/TabBar';

export { PopStyle };

export const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

const TONES = {
    brand: 'bg-brand-50 text-brand-600',
    amber: 'bg-amber-50 text-amber-600',
    violet: 'bg-violet-50 text-violet-600',
    rose: 'bg-rose-50 text-rose-600',
    emerald: 'bg-emerald-50 text-emerald-600',
};

const TAGS = {
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

// ---------- ছোট UI অংশ ----------
export const Tag = ({ tone = 'sky', children }) => (
    <span className={`inline-block px-1.5 py-0.5 rounded-full border font-bold text-[10px] leading-none whitespace-nowrap ${TAGS[tone]}`}>
        {children}
    </span>
);

export const NotUsed = () => (
    <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[10px]">
        Not Used
    </span>
);

export const MethodPill = ({ children }) => (
    <span className="bg-slate-100 px-2 py-0.5 rounded-md text-xs font-medium text-slate-700">{children}</span>
);

export const GetPayPill = ({ status }) => (
    <span
        className={`px-2 py-0.5 rounded-md text-xs font-bold border ${status === 'Get' ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}
    >
        {status === 'Get' ? 'Get' : 'Pay'}
    </span>
);

export const InvoiceLink = ({ onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className="bg-brand-50 text-brand-700 hover:bg-brand-600 hover:text-white px-2 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
    >
        {children}
    </button>
);

export const BalanceBadge = ({ pay, get, size = 'sm' }) => {
    const net = r2(pay - get);
    const cls = size === 'xs' ? 'text-[11px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';
    if (net > 0)
        return (
            <span className={`inline-flex items-center gap-1 rounded-md bg-rose-50 text-rose-600 font-semibold border border-rose-100 ${cls}`}>
                <FaArrowUp size={9} /> Pay ৳ {fmt(net)}
            </span>
        );
    if (net < 0)
        return (
            <span className={`inline-flex items-center gap-1 rounded-md bg-sky-50 text-sky-600 font-semibold border border-sky-100 ${cls}`}>
                <FaArrowDown size={9} /> Get ৳ {fmt(-net)}
            </span>
        );
    return <span className={`text-slate-300 font-semibold ${cls}`}>৳ 0</span>;
};

// ---------- Page shell ----------
export const LedgerShell = ({ title, subtitle, children }) => (
    <div className="min-h-screen p-3 sm:p-5 md:p-8">
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
            <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-800">{title}</h1>
                <p className="text-slate-500 text-xs sm:text-sm mt-1">{subtitle}</p>
            </div>
            {children}
        </div>
    </div>
);

// ---------- Company / Customer select ----------
export const EntitySelector = ({
    label, icon: Icon, placeholder, query, onQuery, onClear,
    options, selected, onPick, loading, chips = [],
}) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const same = (a, b) => String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();

    return (
        <div className="relative z-30 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-3">
                <Icon className="text-brand-600" />
                <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
                {selected && (
                    <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <FaCheckCircle size={10} /> Selected
                    </span>
                )}
            </div>

            <div className="relative" ref={ref}>
                <div
                    className={`flex items-center gap-2 w-full px-3 h-11 rounded-xl border bg-white transition ${open ? 'border-brand-500 ring-2 ring-brand-100' : 'border-slate-300'}`}
                >
                    <FaSearch className="text-slate-400 shrink-0" size={13} />
                    <input
                        type="text"
                        placeholder={placeholder}
                        value={query}
                        autoComplete="off"
                        onFocus={() => setOpen(true)}
                        onChange={(e) => {
                            onQuery(e.target.value);
                            setOpen(true);
                        }}
                        className="bg-transparent outline-none w-full text-sm text-slate-700"
                    />
                    {query && (
                        <button
                            type="button"
                            aria-label="Clear"
                            onClick={() => {
                                onClear();
                                setOpen(false);
                            }}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                            <FaTimes size={12} />
                        </button>
                    )}
                    <button
                        type="button"
                        aria-label="Toggle list"
                        onClick={() => setOpen((v) => !v)}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 cursor-pointer"
                    >
                        <FaChevronDown size={11} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {open && (
                    <div className="pd-pop absolute z-[100] left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-lg max-h-64 overflow-y-auto py-1">
                        {loading ? (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center">Loading...</div>
                        ) : options.length > 0 ? (
                            options.map((o) => (
                                <div
                                    key={o.name}
                                    onClick={() => {
                                        onPick(o.name);
                                        setOpen(false);
                                    }}
                                    className={`px-3 py-2.5 min-h-[44px] cursor-pointer border-b border-slate-100 last:border-none flex items-center gap-2 hover:bg-brand-50 ${same(o.name, selected) ? 'bg-brand-50' : ''}`}
                                >
                                    <Icon size={11} className="text-slate-300 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{o.name}</p>
                                        {o.phone && <p className="text-xs text-slate-500 mt-0.5">📞 {o.phone}</p>}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-xs text-slate-400 text-center">Nothing found</div>
                        )}
                    </div>
                )}
            </div>

            {selected && (
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-600 text-white text-xs font-semibold">
                        <Icon size={10} /> {selected}
                    </span>
                    {chips.filter(Boolean).map((c) => (
                        <span key={c} className="text-xs text-slate-500">{c}</span>
                    ))}
                </div>
            )}
        </div>
    );
};

// ---------- Pay / Get cards ----------
export const PayGetCards = ({ pay, get, hasEntity, payHint, getHint, noneHint, extra }) => (
    <div className="space-y-3 sm:space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">Pay Amount</span>
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                        <FaArrowUp size={12} />
                    </span>
                </div>
                <div className="text-xl sm:text-3xl font-extrabold text-rose-600 mt-2 sm:mt-3 break-words">৳ {fmt(pay)}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-1">{hasEntity ? payHint : noneHint}</div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-semibold text-slate-600">Get Amount</span>
                    <span className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <FaArrowDown size={12} />
                    </span>
                </div>
                <div className="text-xl sm:text-3xl font-extrabold text-emerald-600 mt-2 sm:mt-3 break-words">৳ {fmt(get)}</div>
                <div className="text-[11px] sm:text-xs text-slate-500 mt-1">{hasEntity ? getHint : noneHint}</div>
            </div>
        </div>
        {extra}
    </div>
);

export const CreditLimitBar = ({ limit, used, remaining, percent, exceeded }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
            <span>Credit Limit</span>
            <span>৳ {fmt(limit)}</span>
        </div>
        <div className="mt-2 h-2 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${exceeded ? 'bg-rose-500' : percent >= 80 ? 'bg-amber-400' : 'bg-emerald-500'}`}
                style={{ width: `${percent}%` }}
            />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-slate-500">Used: ৳ {fmt(used)}</span>
            <span className={`px-2 py-0.5 rounded-full ${exceeded ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                {exceeded ? `Exceeded: ৳ ${fmt(-remaining)}` : `Remaining: ৳ ${fmt(remaining)}`}
            </span>
        </div>
    </div>
);

// ---------- Breakdown ----------
export const BreakdownGrid = ({ items }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 sm:gap-3">
        {items.map((it) => {
            const Icon = it.icon;
            return (
                <div key={it.key} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-2.5">
                    <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${TONES[it.tone || 'brand']}`}>
                        <Icon size={13} />
                    </span>
                    <div className="min-w-0">
                        <div className="text-[11px] font-semibold text-slate-500 truncate">{it.label}</div>
                        <BalanceBadge pay={it.pay} get={it.get} size="xs" />
                    </div>
                </div>
            );
        })}
    </div>
);

// ---------- Tabs ----------
export const LedgerTabs = (props) => <TabBar bare {...props} />;

export const EmptyEntity = ({ word }) => (
    <div className="bg-white rounded-2xl border border-slate-200 py-14 px-6 text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 flex items-center justify-center mb-4">
            <FaBalanceScale className="text-brand-600" size={24} />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-700">No {word} selected</h3>
        <p className="text-sm text-slate-400 mt-1">
            Search and select a {word} above to see tabs and the Pay / Get balance.
        </p>
    </div>
);

// ---------- Filter ----------
export const FilterPanel = ({ filters, onChange, onClear, methodOptions, statusOptions }) => {
    const [open, setOpen] = useState(false);
    const active = Object.values(filters).filter(Boolean).length;
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="flex items-center gap-2 min-h-[40px] text-sm font-semibold text-slate-700 cursor-pointer md:cursor-default"
                >
                    <FaFilter className="text-brand-600" /> Filter & Search
                    {active > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[11px]">{active}</span>
                    )}
                    <FaChevronDown size={11} className={`md:hidden text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    className="flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 px-3 h-9 rounded-xl font-semibold cursor-pointer"
                >
                    <FaRedo size={11} /> Clear
                </button>
            </div>
            <div
                className={`${open ? 'grid' : 'hidden'} md:grid grid-cols-2 ${statusOptions ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}
            >
                <div>
                    <label className={labelCls}>Start Date</label>
                    <DateInput name="startDate" value={filters.startDate} onChange={onChange} placeholder="Start date" />
                </div>
                <div>
                    <label className={labelCls}>End Date</label>
                    <DateInput name="endDate" value={filters.endDate} onChange={onChange} placeholder="End date" />
                </div>
                <div>
                    <label className={labelCls}>Invoice Number</label>
                    <input
                        type="text"
                        name="invoiceNo"
                        placeholder="Search invoice..."
                        value={filters.invoiceNo}
                        onChange={onChange}
                        className={inputCls}
                    />
                </div>
                <div>
                    <label className={labelCls}>Payment Method</label>
                    <select name="paymentMethod" value={filters.paymentMethod} onChange={onChange} className={`${inputCls} cursor-pointer`}>
                        <option value="">All</option>
                        {methodOptions.map((m) => (
                            <option key={m} value={m}>{m === 'NotUsed' ? 'Not Used' : m}</option>
                        ))}
                    </select>
                </div>
                {statusOptions && (
                    <div>
                        <label className={labelCls}>Status</label>
                        <select name="status" value={filters.status} onChange={onChange} className={`${inputCls} cursor-pointer`}>
                            <option value="">All</option>
                            {statusOptions.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

// ---------- List card (header + chips + body + pager) ----------
export const ListCard = ({ title, chips = [], note, pager, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
            <h2 className="text-base sm:text-lg font-bold text-slate-800 break-words">{title}</h2>
            <div className="flex flex-wrap gap-2 mt-3">
                {chips.map((c) => (
                    <span key={c.label} className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">
                        {c.label}: ৳{fmt(c.value)}
                    </span>
                ))}
            </div>
            {note && <p className="text-xs text-slate-500 mt-2">{note}</p>}
        </div>
        {children}
        {pager && (
            <div className="p-4 border-t border-slate-100">
                <Pager page={pager.page} total={pager.total} onChange={pager.onChange} />
            </div>
        )}
    </div>
);

// ---------- Responsive table: md+ = table, mobile = card ----------
// columns = [{ key, label, cell:(row)=>node, cls? }]  (প্রথম ২টা column card এর মাথায় দেখায়)
export const LedgerTable = ({ columns, rows, loading, emptyText }) => {
    if (loading) {
        return (
            <div className="p-4">
                <Skeleton rows={4} />
            </div>
        );
    }
    if (!rows.length) {
        return <div className="py-12 px-6 text-center text-sm text-slate-400">{emptyText}</div>;
    }
    const [c0, c1, ...rest] = columns;
    return (
        <>
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            {columns.map((c) => (
                                <th key={c.key} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                                    {c.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((r) => (
                            <tr key={r.key} className="hover:bg-brand-50/40 transition-colors align-top">
                                {columns.map((c) => (
                                    <td key={c.key} className="px-4 py-3 whitespace-nowrap text-sm">
                                        <div className={c.cls || 'text-slate-600'}>{c.cell(r)}</div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ul className="md:hidden divide-y divide-slate-100">
                {rows.map((r) => (
                    <li key={r.key} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div className={c0.cls || 'text-slate-600'}>{c0.cell(r)}</div>
                            <div className="shrink-0 text-right">{c1.cell(r)}</div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 mt-3">
                            {rest.map((c) => (
                                <div key={c.key} className="min-w-0">
                                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{c.label}</div>
                                    <div className={`text-sm break-words ${c.cls || 'text-slate-600'}`}>{c.cell(r)}</div>
                                </div>
                            ))}
                        </div>
                    </li>
                ))}
            </ul>
        </>
    );
};