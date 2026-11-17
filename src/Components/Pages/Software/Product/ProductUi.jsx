import React, { useEffect, useRef, useState } from 'react';
import { FaChevronLeft, FaChevronRight, FaChevronDown, FaTimes, FaRegCalendarAlt, FaEllipsisV } from 'react-icons/fa';
import { FiChevronDown } from 'react-icons/fi';

export const inputCls =
    'w-full px-3 py-2.5 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 outline-none transition';
export const labelCls = 'block text-xs font-medium text-slate-600 mb-1.5';

// ছোট fade-in animation (prefers-reduced-motion মানে)
export const PopStyle = () => (
    <style>{`@keyframes pdpop{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}.pd-pop{animation:pdpop .18s ease-out}@media (prefers-reduced-motion:reduce){.pd-pop{animation:none}}`}</style>
);

export const Skeleton = ({ rows = 5, h = 'h-14' }) => (
    <div className="space-y-3" aria-busy="true">
        {[...Array(rows)].map((_, i) => (
            <div key={i} className={`${h} rounded-xl bg-slate-100 animate-pulse`} />
        ))}
    </div>
);

export const Switch = ({ checked, onChange, label }) => (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" aria-label={label} />
        <div className="w-12 h-7 bg-slate-300 rounded-full peer-checked:bg-brand-600 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-200 transition-colors after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5" />
    </label>
);

export const StatusBadge = ({ active }) => (
    <span
        className={`px-2.5 py-0.5 rounded-full font-semibold text-xs ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}
    >
        {active ? 'Active' : 'Inactive'}
    </span>
);

const pgBtn =
    'inline-flex items-center gap-1 px-3 h-9 rounded-xl text-xs font-semibold border border-slate-300 bg-slate-50 text-slate-700 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer';

export const Pager = ({ page, total, onChange }) => (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
            Page <b className="text-slate-700">{page}</b> of <b className="text-slate-700">{total}</b>
        </span>
        <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} className={pgBtn}>
                <FaChevronLeft size={10} /> Prev
            </button>
            <div className="hidden sm:flex items-center gap-1">
                {[...Array(total)].map((_, i) => {
                    const n = i + 1;
                    if (n === 1 || n === total || (n >= page - 1 && n <= page + 1)) {
                        return (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onChange(n)}
                                className={`w-9 h-9 rounded-xl text-xs font-bold cursor-pointer ${page === n
                                    ? 'bg-brand-600 text-white'
                                    : 'bg-slate-50 text-slate-700 border border-slate-300 hover:bg-brand-50'
                                    }`}
                            >
                                {n}
                            </button>
                        );
                    }
                    if (n === page - 2 || n === page + 2) return <span key={n} className="text-slate-400 px-1">...</span>;
                    return null;
                })}
            </div>
            <button type="button" onClick={() => onChange(page + 1)} disabled={page === total} className={pgBtn}>
                Next <FaChevronRight size={10} />
            </button>
        </div>
    </div>
);

// Searchable dropdown. options = [{ key, title, sub, value }]
export const ComboBox = ({ value, onType, onPick, onClear, options, placeholder, emptyText = 'No result', required = false }) => {
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
        <div ref={ref} className="relative">
            <input
                type="text"
                value={value || ''}
                required={required}
                placeholder={placeholder}
                autoComplete="off"
                onChange={(e) => {
                    onType(e.target.value);
                    setOpen(true);
                }}
                onFocus={() => setOpen(true)}
                className={`${inputCls} pr-16`}
            />
            <div className="absolute right-0 top-0 h-full flex items-center pr-2 gap-0.5">
                {onClear && value && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onClick={() => {
                            onClear();
                            setOpen(false);
                        }}
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                        <FaTimes size={11} />
                    </button>
                )}
                <FaChevronDown className="text-slate-400 pointer-events-none mr-1" size={11} />
            </div>
            {open && (
                <ul className="pd-pop absolute z-[60] left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-56 overflow-y-auto py-1">
                    {options.length > 0 ? (
                        options.map((o) => (
                            <li
                                key={o.key}
                                onClick={() => {
                                    onPick(o);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-brand-50 cursor-pointer border-b border-slate-100 last:border-none"
                            >
                                <p className="text-sm font-semibold text-slate-800">{o.title}</p>
                                {o.sub && <p className="text-xs text-slate-500 mt-0.5 truncate">{o.sub}</p>}
                            </li>
                        ))
                    ) : (
                        <li className="px-3 py-2 text-sm text-slate-400 text-center">{emptyText}</li>
                    )}
                </ul>
            )}
        </div>
    );
};

const TONES = {
    brand: 'text-slate-700 hover:bg-brand-50 hover:text-brand-700',
    emerald: 'text-emerald-700 hover:bg-emerald-50',
    rose: 'text-rose-600 hover:bg-rose-50',
};

// Row action menu: position:fixed, table scroll এ কাটা পড়ে না
// items = [{ label, icon, tone, onClick }]
export const RowMenu = ({ items, compact = false }) => {
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);

    useEffect(() => {
        if (!pos) return undefined;
        const close = () => setPos(null);
        const down = (e) => {
            if (!e.target.closest('.row-menu-panel') && !btnRef.current?.contains(e.target)) setPos(null);
        };
        document.addEventListener('mousedown', down);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            document.removeEventListener('mousedown', down);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [pos]);

    const toggle = () => {
        if (pos) return setPos(null);
        const r = btnRef.current.getBoundingClientRect();
        const h = items.length * 40 + 12;
        const top = r.bottom + h + 8 > window.innerHeight ? r.top - h - 4 : r.bottom + 4;
        const left = Math.max(8, Math.min(r.right - 160, window.innerWidth - 168));
        setPos({ top, left });
    };

    return (
        <>
            <button
                ref={btnRef}
                type="button"
                onClick={toggle}
                aria-haspopup="menu"
                aria-expanded={!!pos}
                aria-label="Actions"
                className={
                    compact
                        ? 'inline-flex items-center justify-center w-6 h-6 bg-slate-50 border border-slate-300 text-slate-600 hover:bg-brand-50 hover:text-brand-700 rounded-xl cursor-pointer'
                        : 'inline-flex items-center gap-1.5 px-3 h-9 bg-slate-50 border border-slate-300 text-slate-700 hover:bg-brand-50 hover:text-brand-700 rounded-xl text-xs font-semibold cursor-pointer'
                }
            >
                {compact ? (
                    <FaEllipsisV size={12} />
                ) : (
                    <>
                        Actions
                        <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${pos ? 'rotate-180' : ''}`} />
                    </>
                )}
            </button>
            {pos && (
                <div
                    role="menu"
                    style={{ top: pos.top, left: pos.left }}
                    className="row-menu-panel pd-pop fixed z-[9999] w-40 bg-white rounded-xl border border-slate-200 shadow-lg py-1.5"
                >
                    {items.map((it) => (
                        <button
                            key={it.label}
                            type="button"
                            role="menuitem"
                            onClick={() => {
                                setPos(null);
                                it.onClick();
                            }}
                            className={`w-full px-4 min-h-[40px] text-xs font-semibold flex items-center gap-2 cursor-pointer ${TONES[it.tone || 'brand']}`}
                        >
                            {it.icon} {it.label}
                        </button>
                    ))}
                </div>
            )}
        </>
    );
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-11-15' => '15 Nov 2026'
export const fmtDateLabel = (v) => {
    if (!v) return '';
    const [y, m, d] = String(v).split('-');
    if (!y || !m || !d || !MONTHS[Number(m) - 1]) return String(v);
    return `${d.slice(0, 2)} ${MONTHS[Number(m) - 1]} ${y}`;
};

// native date input এর মতোই কাজ করে (name, value 'yyyy-mm-dd', onChange(e)),
// কিন্তু screen এ সবসময় "15 Nov 2026" দেখায়
export const DateInput = ({ name, value, onChange, placeholder = 'Select date' }) => {
    const ref = useRef(null);
    const openPicker = () => {
        try {
            ref.current?.showPicker?.();
        } catch (e) {
            /* পুরনো browser এ native click ই কাজ করে */
        }
    };
    return (
        <div className="relative">
            <div className={`${inputCls} flex items-center justify-between gap-2 ${value ? '' : 'text-slate-400'}`}>
                <span className="truncate">{value ? fmtDateLabel(value) : placeholder}</span>
                <FaRegCalendarAlt className="text-slate-400 shrink-0" size={13} />
            </div>
            <input
                ref={ref}
                type="date"
                name={name}
                value={value || ''}
                onChange={onChange}
                onClick={openPicker}
                aria-label={placeholder}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
        </div>
    );
};

export default ComboBox;