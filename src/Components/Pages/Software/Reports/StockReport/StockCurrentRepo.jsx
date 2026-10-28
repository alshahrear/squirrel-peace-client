import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaFilter, FaRedo, FaTimes } from 'react-icons/fa';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const getPerSub = (b) => (b.parentMode === true ? Number(b.pcsPerSub) || 0 : 0);

const getPerUnit = (b) => {
    if (Number(b.pcsPerUnit) > 0) return Number(b.pcsPerUnit);
    const uq = Number(b.unitQty) || 0;
    const sq = Number(b.subQty) || 0;
    const pq = Number(b.pcsQty) || 0;
    if (uq <= 0) return 0;
    const total = b.isFreeProduct ? Number(b.origFreeQty) || 0 : Number(b.origPaidQty) || 0;
    const per = (total - pq - sq * getPerSub(b)) / uq;
    return per > 0 ? per : 0;
};

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

// Cost sudhu paid qty diye hisab hobe
const getCost = (b) => {
    if (b.isFreeProduct) return 0;
    const origPaid = Number(b.origPaidQty ?? b.paidQty) || 0;
    return origPaid > 0 ? (Number(b.netCost) || 0) / origPaid : 0;
};
const getValue = (b) => {
    if (b.isFreeProduct) return 0;
    return getCost(b) * (Number(b.availPaidQty) || 0);
};

// "2 Box 1 pcs" + "(11 pcs)"
const QtyBlock = ({ label, labelClass = '', total, info, valueClass = 'text-gray-800', chipClass = 'bg-gray-50 border-gray-200 text-gray-600' }) => {
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
            {label && <span className={`text-[12px] font-extrabold ${labelClass}`}>{label}:</span>}
            <span className={`text-[13px] font-bold ${valueClass}`}>
                {u} {unit} {showSub && <>{s} {info.subUnit || 'Sub'} </>}{p} Pcs
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-extrabold ${chipClass}`}>
                ({fmt(t)})
            </span>
        </div>
    );
};

const StockCurrentRepo = () => {
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [salesBulkReturns, setSalesBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);

    const [filters, setFilters] = useState({ product: '', company: '' });
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    const [companies, setCompanies] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [isProductOpen, setIsProductOpen] = useState(false);
    const [isCompanyOpen, setIsCompanyOpen] = useState(false);
    const productDropdownRef = useRef(null);
    const companyDropdownRef = useRef(null);

    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/company')
            .then((res) => res.json())
            .then((data) => setCompanies(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching companies:', error));
        fetch('https://squirrel-peace-server.onrender.com/product')
            .then((res) => res.json())
            .then((data) => setProductOptions(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
                setIsProductOpen(false);
            }
            if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target)) {
                setIsCompanyOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredCompanyOptions = companies.filter((c) =>
        (c.businessName || '').toLowerCase().includes(filters.company.toLowerCase())
    );
    const filteredProductOptions = productOptions.filter((p) => {
        if (!p.productName || p.isActive === false) return false;
        if (filters.company && !(p.company || '').toLowerCase().includes(filters.company.toLowerCase())) return false;
        return p.productName.toLowerCase().includes(filters.product.toLowerCase());
    });

    const handleSelectCompany = (c) => {
        setFilters({ company: c.businessName, product: '' });
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };
    const handleClearCompany = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, company: '' }));
        setIsCompanyOpen(false);
        setCurrentPage(1);
    };
    const handleSelectProduct = (p) => {
        setFilters({ product: p.productName, company: p.company || '' });
        setIsProductOpen(false);
        setCurrentPage(1);
    };
    const handleClearProduct = (e) => {
        e.stopPropagation();
        setFilters((prev) => ({ ...prev, product: '' }));
        setIsProductOpen(false);
        setCurrentPage(1);
    };
    const handleClearFilters = () => {
        setFilters({ product: '', company: '' });
        setIsProductOpen(false);
        setIsCompanyOpen(false);
        setSelectedKeys([]);
        setCurrentPage(1);
    };

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const get = async (url) => {
                    const res = await fetch(url);
                    const data = await res.json();
                    return Array.isArray(data) ? data : [];
                };
                const [b, p, s, br, sbr, d, a] = await Promise.all([
                    get('https://squirrel-peace-server.onrender.com/stock-purchase'),
                    get('https://squirrel-peace-server.onrender.com/purchase'),
                    get('https://squirrel-peace-server.onrender.com/sales'),
                    get('https://squirrel-peace-server.onrender.com/purchase-bulk-return'),
                    get('https://squirrel-peace-server.onrender.com/sales-bulk-return'),
                    get('https://squirrel-peace-server.onrender.com/sales-damage'),
                    get('https://squirrel-peace-server.onrender.com/stock-adjustment'),
                ]);
                setBatches(b);
                setPurchases(p);
                setSales(s);
                setBulkReturns(br);
                setSalesBulkReturns(sbr);
                setDamages(d);
                setAdjustments(a);
            } catch (error) {
                console.error('Error fetching current stock:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Batch wise available qty (purchase return + sales + customer return + damage + adjustment hisab hoye)
    const stockRows = useMemo(() => {
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));

        const buildMap = (list, signFn) => {
            const map = new Map();
            list.forEach((r) =>
                (r.stockAllocations || []).forEach((a) => {
                    const k = String(a.batchId);
                    const cur = map.get(k) || { paid: 0, free: 0 };
                    cur[a.pool === 'paid' ? 'paid' : 'free'] += signFn(a) * (Number(a.qty) || 0);
                    map.set(k, cur);
                })
            );
            return map;
        };

        const bulkMap = buildMap(bulkReturns, () => 1);
        const sbMap = buildMap(salesBulkReturns, () => 1);
        const dmgMap = buildMap(damages, () => 1);
        const adjMap = buildMap(adjustments, (a) => (a.direction === 'out' ? 1 : -1));

        const soldMap = new Map();
        sales.forEach((s) =>
            (s.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = soldMap.get(k) || { paid: 0, free: 0 };
                const net = Math.max((Number(a.qty) || 0) - (Number(a.returned) || 0), 0);
                const pool = a.pool || ((a.kind || 'main') === 'main' ? 'paid' : 'free');
                cur[pool] += net;
                soldMap.set(k, cur);
            })
        );

        return batches.map((b) => {
            const purchase = purchaseMap.get(String(b.purchaseId));
            let retPaid = 0;
            let retFree = 0;

            (purchase?.returnHistory || []).forEach((ret) => {
                if (b.isFreeProduct) {
                    (ret.freeItems || []).forEach((it) => {
                        if (it.productId === b.productId) retFree += Number(it.returnTotalQty) || 0;
                    });
                } else {
                    (ret.items || []).forEach((it) => {
                        if (it.productId === b.productId) {
                            retPaid += Number(it.returnTotalQty) || 0;
                            retFree += Number(it.returnFreeTotalQty ?? it.returnFreeQty) || 0;
                        }
                    });
                }
            });

            const bulk = bulkMap.get(String(b._id));
            if (bulk) {
                retPaid += bulk.paid;
                retFree += bulk.free;
            }

            const origPaid = Number(b.paidQty) || 0;
            const origFree = Number(b.freeQty) || 0;
            const sold0 = soldMap.get(String(b._id)) || { paid: 0, free: 0 };
            const sb = sbMap.get(String(b._id)) || { paid: 0, free: 0 };
            const dm = dmgMap.get(String(b._id)) || { paid: 0, free: 0 };
            const ad = adjMap.get(String(b._id)) || { paid: 0, free: 0 };
            const sold = {
                paid: sold0.paid - sb.paid + dm.paid + ad.paid,
                free: sold0.free - sb.free + dm.free + ad.free,
            };
            const curPaid = Math.max(origPaid - retPaid, 0);
            const curFree = Math.max(origFree - retFree, 0);

            let availPaid = 0;
            let availFree = 0;
            if (b.isFreeProduct) {
                availFree = Math.max(curFree - (sold.paid + sold.free), 0);
            } else {
                availPaid = Math.max(curPaid - sold.paid, 0);
                availFree = Math.max(curFree - sold.free, 0);
            }

            return {
                ...b,
                origPaidQty: origPaid,
                origFreeQty: origFree,
                availPaidQty: availPaid,
                availFreeQty: availFree,
            };
        });
    }, [batches, purchases, sales, bulkReturns, salesBulkReturns, damages, adjustments]);

    // Product name + company onujayi unique row
    const products = useMemo(() => {
        const map = new Map();
        stockRows.forEach((b, idx) => {
            const name = (b.productName || '').toString().trim();
            const company = (b.company || '').toString().trim();
            const key = `${name.toLowerCase()}|${company.toLowerCase()}`;
            if (!map.has(key)) {
                map.set(key, {
                    key,
                    productName: name || 'N/A',
                    company: company || 'N/A',
                    main: 0,
                    free: 0,
                    value: 0,
                    batchCount: 0,
                    lastIdx: -1,
                    info: null,
                });
            }
            const g = map.get(key);
            g.main += Number(b.availPaidQty) || 0;
            g.free += Number(b.availFreeQty) || 0;
            g.value += getValue(b);
            g.batchCount += 1;
            g.lastIdx = idx;

            const per = getPerUnit(b);
            if (per > 1 || !g.info) {
                g.info = { per, perSub: getPerSub(b), unit: b.unit, subUnit: b.subUnit };
            }
        });

        return Array.from(map.values())
            .map((g) => ({ ...g, total: g.main + g.free }))
            .sort((a, b) => b.lastIdx - a.lastIdx);
    }, [stockRows]);

    const filtered = useMemo(() => {
        const pq = filters.product.trim().toLowerCase();
        const cq = filters.company.trim().toLowerCase();
        return products.filter((p) => {
            if (pq && !p.productName.toLowerCase().includes(pq)) return false;
            if (cq && !p.company.toLowerCase().includes(cq)) return false;
            return true;
        });
    }, [products, filters]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const safePage = Math.min(currentPage, totalPages);
    const indexOfFirstItem = (safePage - 1) * itemsPerPage;
    const currentItems = filtered.slice(indexOfFirstItem, indexOfFirstItem + itemsPerPage);
    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    // Checkbox select (Select All = current page er sob row)
    const isAllSelected = currentItems.length > 0 && currentItems.every((p) => selectedKeys.includes(p.key));
    const handleSelectAll = () => {
        const keys = currentItems.map((p) => p.key);
        if (isAllSelected) {
            setSelectedKeys((prev) => prev.filter((k) => !keys.includes(k)));
        } else {
            setSelectedKeys((prev) => [...new Set([...prev, ...keys])]);
        }
    };
    const handleSelectRow = (key) => {
        setSelectedKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
    };

    // Select thakle selected row er total, na thakle filter kora sob row er total
    const selectedRows = filtered.filter((p) => selectedKeys.includes(p.key));
    const isSelectionMode = selectedRows.length > 0;
    const summaryRows = isSelectionMode ? selectedRows : filtered;

    const grandTotal = summaryRows.reduce((s, p) => s + p.total, 0);
    const grandValue = summaryRows.reduce((s, p) => s + p.value, 0);

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                        Current Stock Report
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Batch এর হিসাব অনুযায়ী প্রতিটি product এর বর্তমান stock</p>
                </div>

                {/* Table Card */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Product Stock Report</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filtered.length > 0 ? `${indexOfFirstItem + 1}-${Math.min(indexOfFirstItem + itemsPerPage, filtered.length)}` : 0} of {filtered.length} ({products.length} total)
                        </span>
                    </div>

                    {/* Filter & Search Panel */}
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
                                    onClick={handleClearFilters}
                                    className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                                >
                                    <FaRedo size={11} /> Clear All Filters
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Product */}
                            <div className="relative" ref={productDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product</label>
                                <div
                                    onClick={() => setIsProductOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select product..."
                                        value={filters.product}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, product: e.target.value }));
                                            setIsProductOpen(true);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.product && (
                                        <button type="button" onClick={handleClearProduct} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                                {isProductOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredProductOptions.length > 0 ? (
                                            filteredProductOptions.map((p) => (
                                                <div
                                                    key={p._id}
                                                    onClick={() => handleSelectProduct(p)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none"
                                                >
                                                    <div className="text-xs font-medium text-gray-700">{p.productName}</div>
                                                    {p.company && <div className="text-[10px] text-gray-400">{p.company}</div>}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No product found</div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Company */}
                            <div className="relative" ref={companyDropdownRef}>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Company</label>
                                <div
                                    onClick={() => setIsCompanyOpen(true)}
                                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer flex items-center justify-between"
                                >
                                    <input
                                        type="text"
                                        placeholder="Search or select company..."
                                        value={filters.company}
                                        onChange={(e) => {
                                            setFilters((prev) => ({ ...prev, company: e.target.value }));
                                            setIsCompanyOpen(true);
                                            setCurrentPage(1);
                                        }}
                                        className="bg-transparent outline-none w-full text-xs text-gray-700"
                                    />
                                    {filters.company && (
                                        <button type="button" onClick={handleClearCompany} className="text-gray-400 hover:text-red-500 pl-1">
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                                {isCompanyOpen && (
                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-indigo-100 max-h-48 overflow-y-auto">
                                        {filteredCompanyOptions.length > 0 ? (
                                            filteredCompanyOptions.map((c) => (
                                                <div
                                                    key={c._id}
                                                    onClick={() => handleSelectCompany(c)}
                                                    className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none text-xs font-medium text-gray-700"
                                                >
                                                    {c.businessName}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-2 text-xs text-gray-400 text-center">No company found</div>
                                        )}
                                    </div>
                                )}
                            </div>
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
                            Total Qty: <b className="text-pink-600">{fmt(grandTotal)} pcs</b>
                        </span>
                        <span className="font-semibold text-gray-600">
                            Total Stock Value: <b className="text-emerald-600">৳{fmt(grandValue)}</b>
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
                        <div className="text-center py-20 text-gray-500 font-medium">Loading stock...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No product found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-3 w-8 text-center">
                                            <input
                                                type="checkbox"
                                                checked={isAllSelected}
                                                onChange={handleSelectAll}
                                                className="w-4 h-4 accent-pink-500 cursor-pointer"
                                            />
                                        </th>
                                        <th className="py-3 px-3">Product</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3">Qty</th>
                                        <th className="py-3 px-3">Total Qty</th>
                                        <th className="py-3 px-3 text-right">Stock Value</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.map((p) => (
                                        <tr
                                            key={p.key}
                                            className={`${selectedKeys.includes(p.key) ? 'bg-pink-50/70' : 'bg-white hover:bg-indigo-50/40'} border-l-4 border-indigo-200 text-[13px] text-gray-700 transition`}
                                        >
                                            <td className="py-3 px-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedKeys.includes(p.key)}
                                                    onChange={() => handleSelectRow(p.key)}
                                                    className="w-4 h-4 accent-pink-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <div className="font-bold text-gray-800">{p.productName}</div>
                                                <div className="text-[10px] font-semibold text-gray-400">
                                                    {p.batchCount} batch{p.batchCount > 1 ? 'es' : ''}
                                                </div>
                                            </td>
                                            <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">{p.company}</td>

                                            {/* Qty (Main + Free) */}
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <div className="flex flex-col gap-1.5">
                                                    <QtyBlock
                                                        label="Main"
                                                        labelClass="text-indigo-500"
                                                        total={p.main}
                                                        info={p.info}
                                                        valueClass="text-indigo-700"
                                                        chipClass="bg-indigo-50 border-indigo-200 text-indigo-600"
                                                    />
                                                    <QtyBlock
                                                        label="Free"
                                                        labelClass="text-emerald-500"
                                                        total={p.free}
                                                        info={p.info}
                                                        valueClass="text-emerald-700"
                                                        chipClass="bg-emerald-50 border-emerald-200 text-emerald-600"
                                                    />
                                                </div>
                                            </td>

                                            {/* Total Qty (Main + Free) */}
                                            <td className="py-3 px-3 whitespace-nowrap">
                                                <QtyBlock
                                                    label="Total"
                                                    labelClass={p.total > 0 ? 'text-violet-500' : 'text-red-500'}
                                                    total={p.total}
                                                    info={p.info}
                                                    valueClass={p.total > 0 ? 'text-violet-700' : 'text-red-600'}
                                                    chipClass={p.total > 0
                                                        ? 'bg-violet-50 border-violet-200 text-violet-600'
                                                        : 'bg-red-50 border-red-200 text-red-500'}
                                                />
                                                {p.total <= 0 && (
                                                    <span className="text-[10px] font-bold text-red-500">Out of stock</span>
                                                )}
                                            </td>

                                            <td className="py-3 px-3 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                                                ৳{fmt(p.value)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination Footer */}
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

export default StockCurrentRepo;