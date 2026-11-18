import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const splitQty = (total, per, perSub = 0) => {
    if (per > 0) {
        const u = Math.floor(total / per);
        let rest = total - u * per;
        let s = 0;
        if (perSub > 0) {
            s = Math.floor(rest / perSub);
            rest = rest - s * perSub;
        }
        return [u, s, Math.round(rest * 100) / 100];
    }
    return [0, 0, total];
};

const fmtQty = (u, s, p, unit, subUnit) => {
    const parts = [];
    if (u > 0) parts.push(`${u} ${unit || 'Unit'}`);
    if (s > 0) parts.push(`${s} ${subUnit || 'Sub'}`);
    if (p > 0) parts.push(`${p} pcs`);
    return parts.length ? parts.join(' ') : '—';
};

const qtyText = (total, info) => {
    const pcs = `${fmt(total)} pcs`;
    if (info && info.per > 1) {
        const [u, s, p] = splitQty(total, info.per, info.perSub);
        const t = fmtQty(u, s, p, info.unit, info.subUnit);
        if (t !== '—') return { text: t, pcs, chip: true };
    }
    return { text: pcs, pcs, chip: false };
};

const inputCls =
    'w-full px-3 py-2 text-sm rounded-xl border border-slate-300 bg-white text-slate-700 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';
const labelCls = 'block text-slate-600 text-xs font-medium mb-1';

const QtyBlock = ({ total, info, valueClass = 'text-slate-800', chipClass = 'bg-slate-50 border-slate-200 text-slate-600' }) => {
    if (!total || total <= 0) return <span className="text-slate-300 font-bold">—</span>;
    const q = qtyText(total, info);
    return (
        <div className="flex flex-col items-start gap-1 leading-tight">
            <span className={`text-sm font-bold ${valueClass}`}>{q.text}</span>
            {q.chip && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-bold ${chipClass}`}>({q.pcs})</span>
            )}
        </div>
    );
};

const MiniQty = ({ label, total, info, tone, bg }) => {
    const q = qtyText(total, info);
    return (
        <div className={`rounded-lg px-2 py-1.5 min-w-0 ${bg}`}>
            <div className="text-[10px] font-bold uppercase text-slate-400 leading-none mb-1">{label}</div>
            <div className={`text-[12.5px] font-bold leading-snug break-words ${tone}`}>{total > 0 ? q.text : '—'}</div>
            {total > 0 && q.chip && <div className="text-[10px] font-semibold text-slate-400 leading-tight">({q.pcs})</div>}
        </div>
    );
};

const STAT_TONE = {
    brand: 'bg-brand-50 border-brand-100 text-brand-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    rose: 'bg-rose-50 border-rose-100 text-rose-700',
    violet: 'bg-violet-50 border-violet-100 text-violet-700',
    slate: 'bg-slate-50 border-slate-200 text-slate-700',
};
const Stat = ({ label, value, tone = 'slate' }) => (
    <div className={`rounded-xl border px-2 sm:px-3 py-1.5 sm:py-2.5 min-w-0 ${STAT_TONE[tone]}`}>
        <div className="text-[10px] sm:text-[11px] font-medium opacity-80 truncate">{label}</div>
        <div className="text-[13px] sm:text-lg font-bold truncate">{value}</div>
    </div>
);

const Pager = ({ page, total, onChange }) => (
    <div className="flex items-center justify-between gap-3 pt-3">
        <span className="text-xs text-slate-500">
            Page <b className="text-slate-700">{page}</b> of <b className="text-slate-700">{total}</b>
        </span>
        <div className="flex items-center gap-2">
            <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Previous page"
                className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer">
                <FaChevronLeft size={10} /> <span className="hidden sm:inline">Previous</span>
            </button>
            <button type="button" onClick={() => onChange(page + 1)} disabled={page === total} aria-label="Next page"
                className="h-10 px-3 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer">
                <span className="hidden sm:inline">Next</span> <FaChevronRight size={10} />
            </button>
        </div>
    </div>
);

// Search + select combo. options: [{ key, title, sub, onPick }]
const Combo = ({ label, value, placeholder, onType, onClear, options, emptyText }) => {
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
            <label className={labelCls}>{label}</label>
            <div className="relative">
                <input
                    type="text"
                    autoComplete="off"
                    placeholder={placeholder}
                    value={value}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        onType(e.target.value);
                        setOpen(true);
                    }}
                    className={`${inputCls} pr-9`}
                />
                {value && (
                    <button type="button" aria-label={`Clear ${label}`}
                        onClick={() => { onClear(); setOpen(false); }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer">
                        <FaTimes size={11} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-[60] left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 max-h-56 overflow-y-auto">
                    {options.length > 0 ? (
                        options.map((o) => (
                            <div key={o.key} onClick={() => { o.onPick(); setOpen(false); }}
                                className="px-3 py-2.5 hover:bg-brand-50 cursor-pointer border-b border-slate-50 last:border-none">
                                <p className="text-sm font-semibold text-slate-800">{o.title}</p>
                                {o.sub && <p className="text-xs text-slate-500 mt-0.5">{o.sub}</p>}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-3 text-xs text-slate-400 text-center">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const DamageReturnProducts = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ product: '', company: '', companyContact: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const itemsPerPage = 30;
    const [companies, setCompanies] = useState([]);
    const [productList, setProductList] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/company')
            .then((res) => res.json())
            .then((d) => setCompanies(Array.isArray(d) ? d : []))
            .catch(() => setCompanies([]));
        fetch('http://localhost:5000/product')
            .then((res) => res.json())
            .then((d) => setProductList(Array.isArray(d) ? d : []))
            .catch(() => setProductList([]));
    }, []);

    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/damage-return').then((res) => res.json()).catch(() => []),
            fetch('http://localhost:5000/purchase').then((res) => res.json()).catch(() => []),
        ])
            .then(([d, purchases]) => {
                const fromPurchase = (Array.isArray(purchases) ? purchases : [])
                    .filter(
                        (p) =>
                            (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') &&
                            (p.damageItems || []).length > 0
                    )
                    .filter((p) => Number(p.damageAdjustmentAmount) > 0 || p.damageStatus === 'Approved')
                    .map((p) => ({ ...p, items: p.damageItems, _time: Date.parse(p.damageAt || p.createdAt) || 0 }));
                const approved = (Array.isArray(d) ? d : [])
                    .filter((x) => x.status === 'Approved')
                    .map((x) => ({ ...x, _time: Date.parse(x.createdAt) || 0 }));
                setReturns([...approved, ...fromPurchase]);
            })
            .catch((error) => console.error('Error fetching damage return:', error))
            .finally(() => setLoading(false));
    }, []);

    const allProducts = useMemo(() => {
        const map = new Map();
        returns.forEach((o) => {
            (o.items || []).forEach((it) => {
                const name = (it.productName || '').toString().trim();
                const company = (it.company || '').toString().trim();
                const key = `${name.toLowerCase()}|${company.toLowerCase()}`;
                if (!map.has(key)) {
                    map.set(key, {
                        key,
                        productName: name || 'N/A',
                        company: company || 'N/A',
                        companyContact: (it.companyContact || '').toString().trim(),
                        main: 0,
                        free: 0,
                        amount: 0,
                        lastIdx: -1,
                        info: null,
                    });
                }
                const g = map.get(key);
                g.main += Number(it.totalQty) || 0;
                g.free += Number(it.freeQty) || 0;
                g.amount += Number(it.itemTotal ?? it.subtotal) || 0;
                g.lastIdx = Math.max(g.lastIdx, o._time || 0);
                const per = Number(it.pcsPerUnit) || 0;
                if (per > 1) {
                    g.info = {
                        per,
                        perSub: it.parentMode === true ? Number(it.pcsPerSub) || 0 : 0,
                        unit: it.unit,
                        subUnit: it.subUnit,
                    };
                }
            });
        });
        return Array.from(map.values())
            .map((g) => ({ ...g, total: g.main + g.free }))
            .filter((g) => g.total > 0)
            .sort((a, b) => b.lastIdx - a.lastIdx);
    }, [returns]);

    const getPhoneByName = (name) =>
        companies.find((c) => (c.businessName || '').trim().toLowerCase() === (name || '').trim().toLowerCase())?.contactNumber || '';
    const getProductPhone = (p) => p.companyContact || getPhoneByName(p.company);

    const companyOptions = companies
        .filter((c) => {
            const s = filters.company.toLowerCase();
            return (c.businessName || '').toLowerCase().includes(s) || (c.contactNumber || '').toLowerCase().includes(s);
        })
        .map((c) => ({
            key: c._id,
            title: c.businessName,
            sub: c.contactNumber ? `📞 ${c.contactNumber}` : '',
            onPick: () => {
                setFilters({ company: c.businessName, companyContact: c.contactNumber || '', product: '' });
                setCurrentPage(1);
            },
        }));

    const productOptions = productList
        .filter((p) => {
            if (!p.productName || p.isActive === false) return false;
            if (filters.company && !(p.company || '').toLowerCase().includes(filters.company.toLowerCase())) return false;
            if (filters.companyContact && p.companyContact && p.companyContact !== filters.companyContact) return false;
            const s = filters.product.toLowerCase();
            return (
                p.productName.toLowerCase().includes(s) ||
                (p.company || '').toLowerCase().includes(s) ||
                getProductPhone(p).toLowerCase().includes(s)
            );
        })
        .map((p) => ({
            key: p._id,
            title: p.productName,
            sub: `🏢 ${p.company || 'N/A'}${getProductPhone(p) ? ` | 📞 ${getProductPhone(p)}` : ''}`,
            onPick: () => {
                setFilters({ product: p.productName, company: p.company || '', companyContact: getProductPhone(p) });
                setCurrentPage(1);
            },
        }));

    const clearFilters = () => {
        setFilters({ product: '', company: '', companyContact: '' });
        setSelectedKeys([]);
        setCurrentPage(1);
    };

    const products = allProducts.filter(
        (p) =>
            p.productName.toLowerCase().includes(filters.product.trim().toLowerCase()) &&
            p.company.toLowerCase().includes(filters.company.trim().toLowerCase()) &&
            !(filters.companyContact && p.companyContact && p.companyContact !== filters.companyContact)
    );

    const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safePage - 1) * itemsPerPage;
    const currentItems = products.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const isAllSelected = currentItems.length > 0 && currentItems.every((p) => selectedKeys.includes(p.key));
    const handleSelectAll = () => {
        const keys = currentItems.map((p) => p.key);
        if (isAllSelected) setSelectedKeys((prev) => prev.filter((k) => !keys.includes(k)));
        else setSelectedKeys((prev) => [...new Set([...prev, ...keys])]);
    };
    const handleSelectRow = (key) =>
        setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

    const selectedRows = products.filter((p) => selectedKeys.includes(p.key));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : products;

    const grandMain = summaryRows.reduce((s, p) => s + p.main, 0);
    const grandFree = summaryRows.reduce((s, p) => s + p.free, 0);
    const grandAmount = summaryRows.reduce((s, p) => s + p.amount, 0);
    const grandTotal = grandMain + grandFree;
    const activeCount = [filters.product, filters.company].filter(Boolean).length;

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-4 sm:space-y-5">
                {/* Header + totals */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-3">Damage Return Products</h2>
                    <div className="grid grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2.5">
                        <Stat label={isSelectionMode ? 'Selected Products' : 'Products'} value={fmt(summaryRows.length)} tone="violet" />
                        <Stat label="Main Qty" value={`${fmt(grandMain)} pcs`} tone="brand" />
                        <Stat label="Free Qty" value={`${fmt(grandFree)} pcs`} tone="emerald" />
                        <Stat label="Total Qty" value={`${fmt(grandTotal)} pcs`} tone="amber" />
                        <div className="col-span-2 lg:col-span-1">
                            <Stat label="Total Amount" value={`৳${fmt(grandAmount)}`} tone="rose" />
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                        <button type="button" onClick={() => setShowFilters((v) => !v)}
                            className="sm:pointer-events-none h-10 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer">
                            <FaFilter className="text-brand-600" size={13} /> Filter & Search
                            {activeCount > 0 && <span className="px-2 py-0.5 rounded-full bg-brand-600 text-white text-[11px]">{activeCount}</span>}
                            <span className="sm:hidden text-slate-400 text-xs">{showFilters ? '▲' : '▼'}</span>
                        </button>
                        <div className="flex items-center gap-2">
                            {isSelectionMode && (
                                <button type="button" onClick={() => setSelectedKeys([])}
                                    className="h-10 px-3 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                                    Clear Selection ({selectedRows.length})
                                </button>
                            )}
                            <button type="button" onClick={clearFilters}
                                className="h-10 px-3 inline-flex items-center gap-1.5 text-xs rounded-xl border border-slate-200 bg-white text-slate-600 font-medium hover:bg-rose-50 hover:text-rose-600 cursor-pointer">
                                <FaRedo size={11} /> Clear all
                            </button>
                        </div>
                    </div>
                    <div className={`${showFilters ? 'grid' : 'hidden'} sm:grid grid-cols-2 gap-x-2.5 gap-y-3 sm:gap-3 mt-3`}>
                        <Combo
                            label="Product"
                            placeholder="Search or select product..."
                            value={filters.product}
                            options={productOptions}
                            emptyText="No product found"
                            onType={(v) => {
                                setFilters((prev) => ({ ...prev, product: v }));
                                setCurrentPage(1);
                            }}
                            onClear={() => {
                                setFilters((prev) => ({ ...prev, product: '' }));
                                setCurrentPage(1);
                            }}
                        />
                        <Combo
                            label="Company"
                            placeholder="Search or select company..."
                            value={filters.company}
                            options={companyOptions}
                            emptyText="No company found"
                            onType={(v) => {
                                setFilters((prev) => ({ ...prev, company: v, companyContact: '' }));
                                setCurrentPage(1);
                            }}
                            onClear={() => {
                                setFilters((prev) => ({ ...prev, company: '', companyContact: '' }));
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="bg-white rounded-2xl border border-slate-200 p-1.5 sm:p-4">
                    <div className="flex items-center justify-between mb-2 sm:mb-3 px-1">
                        <h3 className="text-base sm:text-lg font-bold text-slate-800">Damage Return Product List</h3>
                        <span className="px-3 py-1 bg-brand-50 border border-brand-100 text-brand-700 font-semibold text-xs rounded-full">
                            {products.length} products
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-2" aria-busy="true">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                            ))}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-slate-500 font-semibold">কোনো damage return product পাওয়া যায়নি</div>
                            <div className="text-xs text-slate-400 mt-1">Filter বদলে আবার চেষ্টা করুন</div>
                        </div>
                    ) : (
                        <>
                            {/* Mobile cards */}
                            <div className="md:hidden space-y-1.5">
                                {currentItems.map((p) => {
                                    const sel = selectedKeys.includes(p.key);
                                    return (
                                        <div
                                            key={p.key}
                                            className={`relative rounded-xl border pl-3 pr-2 py-2 shadow-sm ${sel ? 'border-brand-300 bg-brand-50/60' : 'border-slate-200 bg-white'}`}
                                        >
                                            <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-rose-400" />
                                            <div className="flex items-start gap-2 min-w-0">
                                                <input
                                                    type="checkbox"
                                                    checked={sel}
                                                    onChange={() => handleSelectRow(p.key)}
                                                    aria-label="Select product"
                                                    className="shrink-0 mt-0.5 w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                                <p className="flex-1 min-w-0 font-bold text-[14px] text-brand-700 break-words leading-tight">{p.productName}</p>
                                                <span className="shrink-0 px-1.5 py-px rounded-full bg-rose-50 text-rose-600 text-[11px] font-bold">
                                                    ৳{fmt(p.amount)}
                                                </span>
                                            </div>
                                            <p className="text-[11.5px] text-slate-500 leading-snug break-words mt-1">
                                                <span className="font-semibold text-slate-700">{p.company}</span>
                                                {getProductPhone(p) && <> • 📞 {getProductPhone(p)}</>}
                                            </p>
                                            <div className="grid grid-cols-3 gap-1.5 mt-2">
                                                <MiniQty label="Main" total={p.main} info={p.info} tone="text-brand-700" bg="bg-brand-50" />
                                                <MiniQty label="Free" total={p.free} info={p.info} tone="text-emerald-700" bg="bg-emerald-50" />
                                                <MiniQty label="Total" total={p.total} info={p.info} tone="text-slate-800" bg="bg-slate-50" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Desktop table */}
                            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                                <table className="w-full min-w-[900px] text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 text-xs font-semibold whitespace-nowrap">
                                            <th className="py-3 px-3 w-10 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isAllSelected}
                                                    onChange={handleSelectAll}
                                                    aria-label="Select all"
                                                    className="w-4 h-4 accent-brand-600 cursor-pointer"
                                                />
                                            </th>
                                            <th className="py-3 px-3 w-12">#</th>
                                            <th className="py-3 px-3">Product</th>
                                            <th className="py-3 px-3">Company</th>
                                            <th className="py-3 px-3">Main Qty</th>
                                            <th className="py-3 px-3">Free Qty</th>
                                            <th className="py-3 px-3">Total Qty</th>
                                            <th className="py-3 px-3 text-right">Total Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                        {currentItems.map((p, i) => (
                                            <tr
                                                key={p.key}
                                                className={`transition-colors ${selectedKeys.includes(p.key) ? 'bg-brand-50/60' : 'hover:bg-slate-50/70'}`}
                                            >
                                                <td className="py-3 px-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedKeys.includes(p.key)}
                                                        onChange={() => handleSelectRow(p.key)}
                                                        aria-label="Select row"
                                                        className="w-4 h-4 accent-brand-600 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3 px-3 text-slate-400 font-medium">{indexOfFirstItem + i + 1}</td>
                                                <td className="py-3 px-3 whitespace-nowrap font-semibold text-slate-800">{p.productName}</td>
                                                <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                                                    <div>{p.company}</div>
                                                    {getProductPhone(p) && <div className="text-xs text-slate-400 mt-0.5">📞 {getProductPhone(p)}</div>}
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.main} info={p.info} valueClass="text-brand-700" chipClass="bg-brand-50 border-brand-200 text-brand-600" />
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-emerald-50 border-emerald-200 text-emerald-600" />
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock total={p.total} info={p.info} />
                                                </td>
                                                <td className="py-3 px-3 text-right font-bold text-rose-600 whitespace-nowrap">৳{fmt(p.amount)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <Pager page={safePage} total={totalPages} onChange={handlePageChange} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DamageReturnProducts;