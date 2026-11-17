import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaTimes, FaFilter, FaRedo, FaEllipsisV } from 'react-icons/fa';

export const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

export const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';
export const labelCls = 'block text-slate-600 text-xs font-medium mb-1';

const PILL = {
    brand: 'bg-brand-50 text-brand-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    orange: 'bg-orange-50 text-orange-700',
    slate: 'bg-slate-100 text-slate-600',
};

export const Pill = ({ tone = 'slate', children }) => (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${PILL[tone]}`}>
        {children}
    </span>
);

export const ListSkeleton = ({ rows = 5 }) => (
    <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
        ))}
    </div>
);

export const Empty = ({ text }) => <div className="text-center py-16 text-slate-400 text-sm">{text}</div>;

export const Pager = ({ page, totalPages, onChange, from, to, total }) => {
    const nums = [];
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || Math.abs(i - page) <= 1) nums.push(i);
        else if (Math.abs(i - page) === 2) nums.push(`dots${i}`);
    }
    const btn =
        'h-10 min-w-10 px-3 rounded-lg text-sm font-semibold border border-slate-200 bg-white text-slate-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';
    const active = 'h-10 min-w-10 px-3 text-sm font-semibold bg-brand-600 text-white cursor-pointer';
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-xs text-slate-500">
                Showing {from}-{to} of {total} · Page <b className="text-slate-700">{page}</b> / <b className="text-slate-700">{totalPages}</b>
            </span>
            <div className="flex items-center gap-1.5">
                <button type="button" aria-label="Previous" disabled={page === 1} onClick={() => onChange(page - 1)} className={btn}>
                    <FaChevronLeft size={11} />
                </button>
                <div className="hidden sm:flex items-center gap-1">
                    {nums.map((n) =>
                        typeof n === 'string' ? (
                            <span key={n} className="px-1 text-slate-400">…</span>
                        ) : (
                            <button key={n} type="button" onClick={() => onChange(n)} className={n === page ? active : btn}>
                                {n}
                            </button>
                        )
                    )}
                </div>
                <button type="button" aria-label="Next" disabled={page === totalPages} onClick={() => onChange(page + 1)} className={btn}>
                    <FaChevronRight size={11} />
                </button>
            </div>
        </div>
    );
};

// Search + select combo (company etc). options: [{ key, title, sub, raw }]
export const ComboField = ({ label, value, onType, onClear, options, onPick, placeholder = 'Search or select...' }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    return (
        <div className="relative" ref={ref}>
            <span className={labelCls}>{label}</span>
            <div className="relative">
                <input
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    autoComplete="off"
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        onType(e.target.value);
                        setOpen(true);
                    }}
                    className={`${inputCls} pr-9`}
                />
                {value && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onClear();
                            setOpen(false);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                        <FaTimes size={11} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-56 overflow-y-auto">
                    {options.length > 0 ? (
                        options.map((o) => (
                            <div
                                key={o.key}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onPick(o);
                                    setOpen(false);
                                }}
                                className="px-3 py-2.5 hover:bg-brand-50 cursor-pointer border-b border-slate-100 last:border-none"
                            >
                                <p className="text-sm font-semibold text-slate-800">{o.title}</p>
                                {o.sub && <p className="text-xs text-slate-500 mt-0.5">{o.sub}</p>}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-3 text-xs text-slate-400 text-center">Nothing found</div>
                    )}
                </div>
            )}
        </div>
    );
};

// Collapsible on mobile, always open on md+
export const FilterPanel = ({ activeCount = 0, onClear, children, cols = 'md:grid-cols-4' }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4">
            <div className="flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="h-10 flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer md:cursor-default"
                >
                    <FaFilter className="text-brand-600" size={13} />
                    Filter & Search
                    {activeCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 text-[11px] font-bold">{activeCount}</span>
                    )}
                    <FaChevronDown size={10} className={`md:hidden text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
                <button
                    type="button"
                    onClick={onClear}
                    className="h-10 px-3 flex items-center gap-1.5 text-xs font-semibold text-slate-600 rounded-lg hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                >
                    <FaRedo size={11} /> Clear
                </button>
            </div>
            <div className={`${open ? 'grid' : 'hidden'} md:grid grid-cols-1 sm:grid-cols-2 ${cols} gap-3 mt-3`}>{children}</div>
        </div>
    );
};

const TONE = {
    default: 'text-slate-700 hover:bg-slate-50',
    brand: 'text-brand-700 hover:bg-brand-50',
    success: 'text-emerald-700 hover:bg-emerald-50',
    warn: 'text-orange-600 hover:bg-orange-50',
    danger: 'text-rose-600 hover:bg-rose-50',
};

// Fixed-position action menu. items: [{ label, onClick, tone, hidden }]
export const RowMenu = ({ items, compact = false }) => {
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);
    const menuRef = useRef(null);
    const list = items.filter((i) => !i.hidden);

    useEffect(() => {
        if (!pos) return;
        const close = (e) => {
            if (menuRef.current?.contains(e.target) || btnRef.current?.contains(e.target)) return;
            setPos(null);
        };
        const hide = () => setPos(null);
        document.addEventListener('mousedown', close);
        document.addEventListener('touchstart', close);
        window.addEventListener('scroll', hide, true);
        window.addEventListener('resize', hide);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('touchstart', close);
            window.removeEventListener('scroll', hide, true);
            window.removeEventListener('resize', hide);
        };
    }, [pos]);

    const toggle = () => {
        if (pos) return setPos(null);
        const r = btnRef.current.getBoundingClientRect();
        const w = 176;
        const h = list.length * 40 + 16;
        const left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
        const top = r.bottom + 6 + h > window.innerHeight ? Math.max(8, r.top - h - 6) : r.bottom + 6;
        setPos({ top, left });
    };

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                aria-label="Actions"
                className={
                    compact
                        ? 'inline-flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-300 text-slate-600 hover:bg-brand-50 hover:text-brand-700 rounded-xl cursor-pointer'
                        : 'h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap'
                }
            >
                {compact ? (
                    <FaEllipsisV size={12} />
                ) : (
                    <>
                        Actions <FaChevronDown size={10} className={`transition-transform ${pos ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>
            {pos && (
                <div
                    ref={menuRef}
                    style={{ top: pos.top, left: pos.left, width: 176 }}
                    className="fixed z-[9999] bg-white rounded-xl border border-slate-200 shadow-xl py-2 text-left"
                >
                    {list.map((it) => (
                        <button
                            key={it.label}
                            type="button"
                            onClick={() => {
                                setPos(null);
                                it.onClick();
                            }}
                            className={`w-full h-10 px-4 text-sm font-semibold text-left cursor-pointer ${TONE[it.tone || 'default']}`}
                        >
                            {it.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};