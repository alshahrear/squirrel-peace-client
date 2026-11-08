import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight, FaTrophy } from 'react-icons/fa';

const POLL_INTERVAL = 5000;
const API = 'https://squirrel-peace-server.onrender.com';

const num = (v) => Number(v) || 0;
const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
const fmt = (v) => Number(v || 0).toLocaleString('en-BD', { maximumFractionDigits: 2 });

const safe = (url) =>
    fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

const itemAmt = (it) =>
    Number(it.itemTotal ?? it.subtotal ?? (num(it.sellPricePcs ?? it.sellPrice) * num(it.totalQty ?? it.totalPcs))) || 0;

const TH = 'px-4 py-3 text-left text-xs font-bold text-gray-100 uppercase tracking-wider whitespace-nowrap';

const EMPTY_FILTERS = {
    productName: '',
    sku: '',
    company: '',
    category: '',
};

const AcTopSellProductRepo = () => {
    const [products, setProducts] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [loading, setLoading] = useState(true);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [filters, setFilters] = useState({ ...EMPTY_FILTERS });

    const [isProductOpen, setIsProductOpen] = useState(false);
    const productRef = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (productRef.current && !productRef.current.contains(e.target)) setIsProductOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const fetchData = useCallback(async () => {
        try {
            const [p, s, b, d] = await Promise.all([
                safe(`${API}/product`),
                safe(`${API}/sales`),
                safe(`${API}/sales-bulk-return`),
                safe(`${API}/sales-damage`),
            ]);
            setProducts(p);
            setSales(s);
            setBulkReturns(b);
            setDamages(d);
        } catch (e) {
            console.error('Error fetching top sell product data:', e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const id = setInterval(fetchData, POLL_INTERVAL);
        return () => clearInterval(id);
    }, [fetchData]);

    // ---------- Per product total sales (price based) ----------
    // Total Sales = Delivered sales item total (discount er por) - sales return - bulk return - damage
    const rows = useMemo(() => {
        const totals = new Map();
        const add = (pid, name, amount) => {
            const key = pid ? String(pid) : `name:${name}`;
            totals.set(key, (totals.get(key) || 0) + amount);
        };

        sales.forEach((s) => {
            if (s.status !== 'Delivered') return;

            // Main items
            const priceMap = new Map();
            (s.items || []).forEach((it) => {
                const amt = num(it.itemTotal ?? it.subtotal);
                add(it.productId, it.productName, amt);
                const qty = num(it.totalPcs ?? it.totalQty);
                priceMap.set(String(it.productId), qty > 0 ? amt / qty : 0);
            });

            // Sales return (customer return) - per pcs net price diye
            (s.returnHistory || []).forEach((ret) => {
                (ret.items || []).forEach((it) => {
                    const perPcs = priceMap.get(String(it.productId)) || 0;
                    add(it.productId, it.productName, -(num(it.returnTotalQty) * perPcs));
                });
            });

            // Damage from sales
            (s.damageItems || []).forEach((it) => {
                add(it.productId, it.productName, -itemAmt(it));
            });
        });

        // Bulk return
        bulkReturns.forEach((b) => {
            (b.items || []).forEach((it) => {
                add(it.productId, it.productName, -itemAmt(it));
            });
        });

        // Standalone damage (customer er sathe)
        damages.forEach((d) => {
            if (!d.customer) return;
            (d.items || []).forEach((it) => {
                add(it.productId, it.productName, -itemAmt(it));
            });
        });

        return products.map((p) => {
            const byId = totals.get(String(p._id)) || 0;
            const byName = totals.get(`name:${p.productName}`) || 0;
            return {
                _id: p._id,
                productName: p.productName || '',
                sku: p.sku || '',
                company: p.company || '',
                category: p.category || '',
                total: Math.max(r2(byId + byName), 0),
            };
        });
    }, [products, sales, bulkReturns, damages]);

    // ---------- Filters ----------
    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const handleFilterChange = (e) => setFilter(e.target.name, e.target.value);
    const handleClearFilters = () => {
        setFilters({ ...EMPTY_FILTERS });
        setCurrentPage(1);
    };

    const has = (val, q) => String(val || '').toLowerCase().includes(String(q || '').toLowerCase());

    const filtered = rows
        .filter((r) => {
            if (filters.productName && !has(r.productName, filters.productName) && !has(r.sku, filters.productName)) return false;
            if (filters.sku && !has(r.sku, filters.sku)) return false;
            if (filters.company && !has(r.company, filters.company)) return false;
            if (filters.category && !has(r.category, filters.category)) return false;
            return true;
        })
        .sort((a, b) => b.total - a.total || a.productName.localeCompare(b.productName));

    const productOptions = products.filter((p) => {
        const s = filters.productName;
        return has(p.productName, s) || has(p.sku, s);
    });

    const grandTotal = r2(filtered.reduce((s, r) => s + r.total, 0));

    // ---------- Pagination ----------
    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const start = (currentPage - 1) * itemsPerPage;
    const current = filtered.slice(start, start + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    const inputCls =
        'w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700';

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Top Sell Products
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">
                            যে product বেশি টাকার বিক্রি হয়েছে (Return / Bulk Return / Damage বাদ দিয়ে)
                        </p>
                    </div>
                    <span className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 font-semibold text-xs rounded-full">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                        Live Updating
                    </span>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-indigo-500 to-purple-600">
                        <p className="text-sm text-white/80">Total Sales</p>
                        <p className="text-2xl font-extrabold mt-1">৳ {fmt(grandTotal)}</p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-amber-500 to-orange-600">
                        <p className="text-sm text-white/80">Top Product</p>
                        <p className="text-xl font-extrabold mt-1 truncate">
                            {filtered.length > 0 && filtered[0].total > 0 ? filtered[0].productName : 'N/A'}
                        </p>
                    </div>
                    <div className="rounded-3xl shadow-xl p-6 text-white bg-gradient-to-br from-sky-500 to-blue-600">
                        <p className="text-sm text-white/80">Total Products</p>
                        <p className="text-2xl font-extrabold mt-1">{filtered.length}</p>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Product Ranking</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filtered.length > 0 ? `${start + 1}-${Math.min(start + itemsPerPage, filtered.length)}` : 0} of {filtered.length} ({rows.length} total)
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Product Name */}
                            <div className="relative" ref={productRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product Name</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="productName"
                                        placeholder="Search or select product..."
                                        value={filters.productName}
                                        onChange={(e) => {
                                            handleFilterChange(e);
                                            setIsProductOpen(true);
                                        }}
                                        onFocus={() => setIsProductOpen(true)}
                                        autoComplete="off"
                                        className={`${inputCls} pr-8`}
                                    />
                                    {filters.productName && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFilter('productName', '');
                                                setIsProductOpen(false);
                                            }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-rose-500"
                                        >
                                            <FaTimes size={11} />
                                        </button>
                                    )}
                                </div>
                                {isProductOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl border border-indigo-100 max-h-60 overflow-y-auto">
                                        {productOptions.length > 0 ? (
                                            productOptions.map((p) => (
                                                <div
                                                    key={p._id}
                                                    onClick={() => {
                                                        setFilter('productName', p.productName);
                                                        setIsProductOpen(false);
                                                    }}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                                                >
                                                    <p className="text-xs font-semibold text-gray-800">{p.productName}</p>
                                                    {p.sku && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5">SKU: {p.sku}</p>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No product found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* SKU */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">SKU</label>
                                <input
                                    type="text"
                                    name="sku"
                                    placeholder="Search SKU..."
                                    value={filters.sku}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>

                            {/* Company */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <input
                                    type="text"
                                    name="company"
                                    placeholder="Search company..."
                                    value={filters.company}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Category</label>
                                <input
                                    type="text"
                                    name="category"
                                    placeholder="Search category..."
                                    value={filters.category}
                                    onChange={handleFilterChange}
                                    className={inputCls}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading products...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No product found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600">
                                        <th className={TH}>#</th>
                                        <th className={TH}>Product Name</th>
                                        <th className={TH}>SKU</th>
                                        <th className={TH}>Company</th>
                                        <th className={TH}>Category</th>
                                        <th className={`${TH} text-right`}>Total Sales</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                                    {current.map((r, i) => {
                                        const rank = start + i + 1;
                                        const isTop = rank <= 3 && r.total > 0;
                                        return (
                                            <tr key={r._id} className="hover:bg-indigo-50/40 transition duration-150">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {isTop ? (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${rank === 1 ? 'bg-amber-100 text-amber-700' : rank === 2 ? 'bg-slate-200 text-slate-700' : 'bg-orange-100 text-orange-700'}`}>
                                                            <FaTrophy size={10} /> {rank}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400">{rank}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900">{r.productName}</td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {r.sku ? (
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                            {r.sku}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                                                    {r.company || <span className="text-gray-400 italic text-xs">N/A</span>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {r.category ? (
                                                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-semibold">
                                                            {r.category}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-xs">N/A</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-right font-extrabold text-indigo-600">
                                                    ৳ {fmt(r.total)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && filtered.length > 0 && (
                        <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <span className="text-xs text-gray-500 font-medium">
                                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
                            </span>

                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
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
                                            (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                            return (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => handlePageChange(pageNum)}
                                                    className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                                                        }`}
                                                >
                                                    {pageNum}
                                                </button>
                                            );
                                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                                            return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
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

export default AcTopSellProductRepo;