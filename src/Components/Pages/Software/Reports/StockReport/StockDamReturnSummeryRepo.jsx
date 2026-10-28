import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const fmt = (v) => (Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

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

// "2 Bundle 1 Pcs (7)"
const QtyText = ({ total, info, valueClass, chipClass }) => {
    const t = Number(total) || 0;
    let u = 0;
    let s = 0;
    let p = t;
    if (info && info.per > 0) {
        [u, s, p] = splitQty(t, info.per, info.perSub);
    }
    const unit = (info && info.unit) || 'Unit';
    const showSub = info && info.perSub > 0;
    return (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`text-[13px] font-bold ${valueClass}`}>
                {u} {unit} {showSub && <>{s} {info.subUnit || 'Sub'} </>}{p} Pcs
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-extrabold ${chipClass}`}>
                ({fmt(t)})
            </span>
        </div>
    );
};

const FilterSelect = ({ label, placeholder, value, options, onChange, emptyText }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const list = options.filter((o) => o.toLowerCase().includes((value || '').toLowerCase()));

    return (
        <div className="relative" ref={ref}>
            <label className="block text-gray-600 text-[11px] font-semibold mb-1">{label}</label>
            <div
                onClick={() => setOpen(true)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
            >
                <input
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => {
                        onChange(e.target.value);
                        setOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                            setOpen(false);
                        }}
                        className="text-gray-400 hover:text-red-500 pl-1"
                    >
                        <FaTimes size={10} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                    {list.length > 0 ? (
                        list.map((o) => (
                            <div
                                key={o}
                                onClick={() => {
                                    onChange(o);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                            >
                                {o}
                            </div>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-gray-400 text-center">{emptyText}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const StockDamReturnSummeryRepo = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({ product: '', company: '' });
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    useEffect(() => {
        const load = async () => {
            try {
                const get = async (url) => {
                    const res = await fetch(url);
                    const data = await res.json().catch(() => []);
                    return Array.isArray(data) ? data : [];
                };
                const [dr, pur] = await Promise.all([
                    get('https://squirrel-peace-server.onrender.com/damage-return'),
                    get('https://squirrel-peace-server.onrender.com/purchase'),
                ]);
                setReturns([
                    ...dr,
                    ...pur
                        .filter(
                            (p) =>
                                (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') &&
                                (p.damageItems || []).length > 0
                        )
                        .map((p) => ({ ...p, items: p.damageItems })),
                ]);
            } catch (error) {
                console.error('Error fetching damage return summary:', error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Same product + same company = ekta row (sum)
    const products = useMemo(() => {
        const map = new Map();
        returns.forEach((o, oi) => {
            (o.items || []).forEach((it) => {
                const name = (it.productName || '').toString().trim();
                const company = (it.company || o.company || '').toString().trim();
                const key = `${name.toLowerCase()}|${company.toLowerCase()}`;
                if (!map.has(key)) {
                    map.set(key, {
                        key,
                        productName: name || 'N/A',
                        company: company || 'N/A',
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
                g.lastIdx = oi;
                const per = Number(it.pcsPerUnit) || 0;
                if (per > 0 && (!g.info || per > 1)) {
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

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const productOptions = uniq(products.map((p) => p.productName));
    const companyOptions = uniq(products.map((p) => p.company));

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ product: '', company: '' });
        setSelectedKeys([]);
        setCurrentPage(1);
    };

    const filtered = products.filter(
        (p) =>
            p.productName.toLowerCase().includes(filters.product.trim().toLowerCase()) &&
            p.company.toLowerCase().includes(filters.company.trim().toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safePage - 1) * itemsPerPage;
    const indexOfLastItem = indexOfFirstItem + itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    // Checkbox
    const isAllSelected = currentItems.length > 0 && currentItems.every((p) => selectedKeys.includes(p.key));
    const handleSelectAll = () => {
        const keys = currentItems.map((p) => p.key);
        if (isAllSelected) setSelectedKeys((prev) => prev.filter((k) => !keys.includes(k)));
        else setSelectedKeys((prev) => [...new Set([...prev, ...keys])]);
    };
    const handleSelectRow = (key) => {
        setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    // Summary
    const selectedRows = filtered.filter((p) => selectedKeys.includes(p.key));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filtered;
    const grandQty = summaryRows.reduce((s, p) => s + p.total, 0);
    const grandAmount = summaryRows.reduce((s, p) => s + p.amount, 0);

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Damage Return Summary Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">কোম্পানিতে ফেরত দেওয়া Damage Product এর product ও company অনুযায়ী মোট হিসাব</p>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Damage Return Summary</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filtered.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfLastItem, filtered.length)}` : 0} of {filtered.length} ({products.length} total)
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FilterSelect
                                label="Product"
                                placeholder="Search or select product..."
                                value={filters.product}
                                options={productOptions}
                                onChange={(v) => setFilter('product', v)}
                                emptyText="No product found"
                            />
                            <FilterSelect
                                label="Company"
                                placeholder="Search or select company..."
                                value={filters.company}
                                options={companyOptions}
                                onChange={(v) => setFilter('company', v)}
                                emptyText="No company found"
                            />
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full font-bold ${isSelectionMode ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                            {isSelectionMode ? 'Selected' : 'Showing'}
                        </span>
                        <span className="font-semibold text-gray-600">
                            Products: <b className="text-gray-800">{summaryRows.length}</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Qty: <b className="text-indigo-600">{fmt(grandQty)} pcs</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Cost Total: <b className="text-red-600">৳{fmt(grandAmount)}</b>
                        </span>
                        {isSelectionMode && (
                            <button
                                onClick={() => setSelectedKeys([])}
                                className="ml-auto text-[11px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                            >
                                Clear Selection
                            </button>
                        )}
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading report...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No damage return product found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse [&_th]:px-2 [&_th]:py-2.5 [&_th]:text-[11px] [&_td]:px-2 [&_td]:py-2.5 [&_td]:text-xs [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap [&_td]:align-top">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white uppercase tracking-wide">
                                        <th className="w-7 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th>Product</th>
                                        <th>Company</th>
                                        <th>Qty</th>
                                        <th>Total Qty</th>
                                        <th className="text-right">Cost Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700">
                                    {currentItems.map((p) => (
                                        <tr
                                            key={p.key}
                                            className={`transition duration-150 ${selectedKeys.includes(p.key) ? 'bg-pink-50/70' : 'hover:bg-indigo-50/40'}`}
                                        >
                                            <td className="text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedKeys.includes(p.key)}
                                                    onChange={() => handleSelectRow(p.key)}
                                                    className="w-3.5 h-3.5 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="font-bold text-gray-800">{p.productName}</td>
                                            <td className="text-gray-600">{p.company}</td>
                                            <td>
                                                <div className="flex flex-col gap-1.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[12px] font-extrabold text-orange-500">Main:</span>
                                                        <QtyText
                                                            total={p.main}
                                                            info={p.info}
                                                            valueClass="text-orange-600"
                                                            chipClass="bg-orange-50 border-orange-200 text-orange-600"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-[12px] font-extrabold text-emerald-500">Free:</span>
                                                        <QtyText
                                                            total={p.free}
                                                            info={p.info}
                                                            valueClass="text-emerald-700"
                                                            chipClass="bg-emerald-50 border-emerald-200 text-emerald-600"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <QtyText
                                                    total={p.total}
                                                    info={p.info}
                                                    valueClass="text-indigo-700"
                                                    chipClass="bg-indigo-50 border-indigo-200 text-indigo-600"
                                                />
                                            </td>
                                            <td className="text-right font-bold text-red-600">৳{p.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{safePage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(safePage - 1)}
                                    disabled={safePage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === 1
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
                                            (pageNum >= safePage - 1 && pageNum <= safePage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${safePage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === safePage - 2 || pageNum === safePage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(safePage + 1)}
                                    disabled={safePage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${safePage === totalPages
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

export default StockDamReturnSummeryRepo;