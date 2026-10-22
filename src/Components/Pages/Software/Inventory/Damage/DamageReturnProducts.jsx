import React, { useState, useEffect, useMemo } from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo } from 'react-icons/fa';

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

const QtyBlock = ({ total, info, valueClass = 'text-gray-800', chipClass = 'bg-gray-50 border-gray-200 text-gray-600' }) => {
    if (!total || total <= 0) return <span className="text-gray-300 font-bold">—</span>;
    const pcsText = `${fmt(total)} pcs`;
    let text = pcsText;
    if (info && info.per > 1) {
        const [u, s, p] = splitQty(total, info.per, info.perSub);
        const t = fmtQty(u, s, p, info.unit, info.subUnit);
        text = t === '—' ? pcsText : t;
    }
    return (
        <div className="flex flex-col items-start gap-1 leading-tight">
            <span className={`text-[13px] font-bold ${valueClass}`}>{text}</span>
            {text !== pcsText ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[12px] font-extrabold shadow-sm ${chipClass}`}>
                    ({pcsText})
                </span>
            ) : null}
        </div>
    );
};

const DamageReturnProducts = () => {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ product: '', company: '' });
    const [selectedKeys, setSelectedKeys] = useState([]);
    const itemsPerPage = 30;

    useEffect(() => {
        Promise.all([
            fetch('https://squirrel-peace-server.onrender.com/damage-return').then((res) => res.json()).catch(() => []),
            fetch('https://squirrel-peace-server.onrender.com/purchase').then((res) => res.json()).catch(() => []),
        ])
            .then(([d, purchases]) => {
                const fromPurchase = (Array.isArray(purchases) ? purchases : [])
                    .filter(
                        (p) =>
                            (p.receiveStatus === 'Received' || p.receiveStatus === 'Yes') &&
                            (p.damageItems || []).length > 0
                    )
                    .map((p) => ({ ...p, items: p.damageItems }));
                setReturns([...(Array.isArray(d) ? d : []), ...fromPurchase]);
            })
            .catch((error) => console.error('Error fetching damage return:', error))
            .finally(() => setLoading(false));
    }, []);

    const allProducts = useMemo(() => {
        const map = new Map();
        returns.forEach((o, oi) => {
            (o.items || []).forEach((it) => {
                const name = (it.productName || '').toString().trim();
                const company = (it.company || '').toString().trim();
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

    const products = allProducts.filter(
        (p) =>
            p.productName.toLowerCase().includes(filters.product.trim().toLowerCase()) &&
            p.company.toLowerCase().includes(filters.company.trim().toLowerCase())
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">

                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                        Damage Return Products
                    </h2>
                    <div className="flex flex-wrap justify-center gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-violet-50 border border-violet-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-violet-400">{isSelectionMode ? 'Selected Products' : 'Total Products'}</div>
                            <div className="text-lg font-extrabold text-violet-700">{fmt(summaryRows.length)}</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-indigo-400">Total Main Qty</div>
                            <div className="text-lg font-extrabold text-indigo-700">{fmt(grandMain)} pcs</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-teal-50 border border-teal-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-teal-500">Total Free Qty</div>
                            <div className="text-lg font-extrabold text-teal-700">{fmt(grandFree)} pcs</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-pink-50 border border-pink-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-pink-400">Total Qty</div>
                            <div className="text-lg font-extrabold text-pink-700">{fmt(grandTotal)} pcs</div>
                        </div>
                        <div className="px-4 py-2 rounded-2xl bg-red-50 border border-red-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-red-400">Total Amount</div>
                            <div className="text-lg font-extrabold text-red-600">৳{fmt(grandAmount)}</div>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Damage Return Product List</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                            {products.length} products
                        </span>
                    </div>

                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <div className="flex items-center gap-2">
                                {isSelectionMode && (
                                    <button
                                        onClick={() => setSelectedKeys([])}
                                        className="text-[11px] bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 text-gray-600 px-2.5 py-1.5 rounded-lg font-semibold cursor-pointer"
                                    >
                                        Clear Selection ({selectedRows.length})
                                    </button>
                                )}
                                <button
                                    onClick={() => { setFilters({ product: '', company: '' }); setSelectedKeys([]); setCurrentPage(1); }}
                                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                                >
                                    <FaRedo size={11} /> Clear All Filters
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product</label>
                                <input
                                    type="text"
                                    placeholder="Search product..."
                                    value={filters.product}
                                    onChange={(e) => { setFilters((prev) => ({ ...prev, product: e.target.value })); setCurrentPage(1); }}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <input
                                    type="text"
                                    placeholder="Search company..."
                                    value={filters.company}
                                    onChange={(e) => { setFilters((prev) => ({ ...prev, company: e.target.value })); setCurrentPage(1); }}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No damage return product found!</div>
                    ) : (
                        <div className="overflow-visible rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-3 w-8 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 accent-pink-500 cursor-pointer"
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
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((p, i) => (
                                        <tr
                                            key={p.key}
                                            className={`${selectedKeys.includes(p.key) ? 'bg-pink-50/70' : 'bg-white hover:bg-indigo-50/40'} border-l-4 border-rose-200 text-[13px] text-gray-700 transition`}
                                        >
                                            <td className="py-3 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedKeys.includes(p.key)}
                                                    onChange={() => handleSelectRow(p.key)}
                                                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3 px-3 text-gray-400 font-semibold">{indexOfFirstItem + i + 1}</td>
                                            <td className="py-3 px-3 whitespace-nowrap font-bold text-gray-800">{p.productName}</td>
                                            <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">{p.company}</td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <QtyBlock total={p.main} info={p.info} valueClass="text-indigo-700" chipClass="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600" />
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-gradient-to-r from-emerald-50 to-teal-100 border-emerald-200 text-emerald-600" />
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <QtyBlock total={p.total} info={p.info} valueClass="text-violet-700" chipClass="bg-gradient-to-r from-violet-50 to-pink-100 border-violet-200 text-violet-600" />
                                            </td>
                                            <td className="py-3 px-3 text-right font-extrabold text-red-600 whitespace-nowrap">
                                                ৳{fmt(p.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {!loading && products.length > 0 && (
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

export default DamageReturnProducts;