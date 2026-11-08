import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaFilter, FaRedo, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const n = (v) => Number(v) || 0;
const r2 = (v) => Math.round(n(v) * 100) / 100;
const fmt = (v) => n(v).toLocaleString('en-US', { maximumFractionDigits: 2 });

const parseToLocalDate = (dateStr) => {
    if (!dateStr) return null;
    const datePart = String(dateStr).split(',')[0].trim();
    if (datePart.includes('/')) {
        const [d, m, y] = datePart.split('/');
        if (!d || !m || !y) return null;
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(datePart)) {
        const [y, m, d] = datePart.slice(0, 10).split('-');
        return new Date(Number(y), Number(m) - 1, Number(d));
    }
    const parsed = new Date(datePart);
    return isNaN(parsed) ? null : new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate());
};

const getPool = (a) => a.pool || ((a.kind || 'main') === 'main' ? 'paid' : 'free');

// Purchase item net cost (product subtotal - overall discount +/- adjustment)
const getPurchaseItemNetCost = (purchase, item) => {
    const pItems = purchase?.items || [];
    const sumSub = pItems.reduce((s, x) => s + (n(x.itemTotal ?? x.subtotal)), 0);
    if (!item || sumSub <= 0) return null;
    const ov =
        purchase.overallDiscountValue !== undefined && purchase.overallDiscountValue !== null && purchase.overallDiscountValue !== ''
            ? n(purchase.overallDiscountValue)
            : purchase.overallDiscountType === 'percent'
                ? (sumSub * n(purchase.overallDiscount)) / 100
                : n(purchase.overallDiscount);
    const adj = n(purchase.adjustment?.amount);
    const pay = Math.max(sumSub - ov + (purchase.adjustment?.type === '-' ? -adj : adj), 0);
    return r2((pay * n(item.itemTotal ?? item.subtotal)) / sumSub);
};

const getBatchCostPerPcs = (batch, purchase) => {
    if (!batch || batch.isFreeProduct) return 0;
    let netCost = n(batch.netCost);
    if (purchase) {
        const pIt = (purchase.items || []).find((x) => String(x.productId) === String(batch.productId));
        const nc = pIt ? getPurchaseItemNetCost(purchase, pIt) : null;
        if (nc !== null) netCost = nc;
    }
    const origPaid = n(batch.paidQty);
    return origPaid > 0 ? r2(netCost / origPaid) : 0;
};

const getSaleItemNetPricePerPcs = (sale, item) => {
    const sItems = sale?.items || [];
    const sumSub = sItems.reduce((s, x) => s + n(x.itemTotal ?? x.subtotal), 0);
    const paidQty = n(item?.totalPcs);
    if (!item || sumSub <= 0 || paidQty <= 0) return n(item?.sellPricePcs ?? item?.sellPrice);
    const ov =
        sale.overallDiscountValue !== undefined && sale.overallDiscountValue !== null && sale.overallDiscountValue !== ''
            ? n(sale.overallDiscountValue)
            : sale.overallDiscountType === 'percent'
                ? (sumSub * n(sale.overallDiscount)) / 100
                : n(sale.overallDiscount);
    const adj = n(sale.adjustment?.amount);
    const pay = Math.max(sumSub - ov + (sale.adjustment?.type === '-' ? -adj : adj), 0);
    const net = (pay * n(item.itemTotal ?? item.subtotal)) / sumSub;
    return r2(net / paidQty);
};

// Name + phone searchable dropdown (Company)
const ContactSelect = ({ label, placeholder, value, items, onType, onSelect, onClear, emptyText }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const h = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const s = (value || '').toLowerCase();
    const list = items.filter(
        (it) => (it.name || '').toLowerCase().includes(s) || (it.phone || '').toLowerCase().includes(s)
    );

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
                        onType(e.target.value);
                        setOpen(true);
                    }}
                    className="bg-transparent outline-none w-full text-xs text-gray-700"
                />
                {value && (
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
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
                        list.map((it) => (
                            <div
                                key={it._id}
                                onClick={() => {
                                    onSelect(it);
                                    setOpen(false);
                                }}
                                className="px-3 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-none transition duration-150"
                            >
                                <p className="text-xs font-semibold text-gray-800">{it.name}</p>
                                {it.phone && <p className="text-[11px] text-gray-500 mt-0.5">📞 {it.phone}</p>}
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

const AcSalesWiseProfitRepo = () => {
    const [sales, setSales] = useState([]);
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({ startDate: '', endDate: '', product: '', company: '', companyContact: '', result: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    useEffect(() => {
        const load = async () => {
            try {
                const [sRes, bRes, pRes, coRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/sales'),
                    fetch('https://squirrel-peace-server.onrender.com/stock-purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/purchase'),
                    fetch('https://squirrel-peace-server.onrender.com/company'),
                ]);
                const s = await sRes.json().catch(() => []);
                const b = await bRes.json().catch(() => []);
                const p = await pRes.json().catch(() => []);
                const co = await coRes.json().catch(() => []);
                setSales(Array.isArray(s) ? s : []);
                setBatches(Array.isArray(b) ? b : []);
                setPurchases(Array.isArray(p) ? p : []);
                setCompanies(Array.isArray(co) ? co : []);
            } catch (e) {
                console.error('Error fetching profit report:', e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    // Product + Company wise profit
    const rows = useMemo(() => {
        const batchMap = new Map(batches.map((b) => [String(b._id), b]));
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const costCache = new Map();
        const costOf = (b) => {
            const k = String(b._id);
            if (!costCache.has(k)) costCache.set(k, getBatchCostPerPcs(b, purchaseMap.get(String(b.purchaseId))));
            return costCache.get(k);
        };

        const sd = parseToLocalDate(filters.startDate);
        const ed = parseToLocalDate(filters.endDate);

        const map = new Map();
        sales.forEach((s) => {
            if (s.status !== 'Delivered') return;
            if (sd || ed) {
                const d = parseToLocalDate(s.deliveryDate || s.orderDate);
                if (!d) return;
                if (sd && d < sd) return;
                if (ed && d > ed) return;
            }
            (s.stockAllocations || []).forEach((a) => {
                const b = batchMap.get(String(a.batchId));
                if (!b) return;
                const net = Math.max(n(a.qty) - n(a.returned), 0);
                if (net <= 0) return;

                const kind = a.kind || 'main';
                let revenue = 0;
                if (kind === 'main') {
                    const it = (s.items || []).find((x) => String(x.productId) === String(a.productId));
                    if (it) revenue = r2(getSaleItemNetPricePerPcs(s, it) * net);
                }
                const cost = getPool(a) === 'paid' && !b.isFreeProduct ? r2(costOf(b) * net) : 0;

                const key = `${s._id}|${b.productName}|${b.company || ''}`;
                if (!map.has(key)) {
                    map.set(key, {
                        key,
                        saleId: s._id,
                        orderNo: s.invoiceNo || s.orderNo,
                        customer: s.customer,
                        date: s.deliveryDate || s.orderDate,
                        product: b.productName,
                        company: b.company || '',
                        qty: 0,
                        revenue: 0,
                        cost: 0,
                    });
                }
                const g = map.get(key);
                g.qty += net;
                g.revenue += revenue;
                g.cost += cost;
            });
        });

        return Array.from(map.values())
            .map((g) => ({ ...g, revenue: r2(g.revenue), cost: r2(g.cost), profit: r2(g.revenue - g.cost) }))
            .reverse();
    }, [sales, batches, purchases, filters.startDate, filters.endDate]);

    const productOptions = useMemo(() => [...new Set(rows.map((r) => r.product).filter(Boolean))], [rows]);
    const companyItems = companies.map((c) => ({ _id: c._id, name: c.businessName || '', phone: c.contactNumber || '' }));
    const getCompanyPhone = (name) =>
        companyItems.find((c) => c.name.trim().toLowerCase() === (name || '').trim().toLowerCase())?.phone || '';

    const filtered = rows.filter((r) => {
        const q = search.trim().toLowerCase();
        if (q && !`${r.product} ${r.company} ${r.customer} ${r.orderNo}`.toLowerCase().includes(q)) return false;
        if (filters.product && r.product !== filters.product) return false;
        if (filters.company && !String(r.company || '').toLowerCase().includes(filters.company.toLowerCase())) return false;
        if (filters.companyContact) {
            const phone = getCompanyPhone(r.company);
            if (phone && phone !== filters.companyContact) return false;
        }
        if (filters.result === 'profit' && r.profit <= 0) return false;
        if (filters.result === 'loss' && r.profit >= 0) return false;
        return true;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const indexOfLast = currentPage * itemsPerPage;
    const indexOfFirst = indexOfLast - itemsPerPage;
    const currentRows = filtered.slice(indexOfFirst, indexOfLast);

    const sumQty = filtered.reduce((s, r) => s + r.qty, 0);
    const sumRevenue = r2(filtered.reduce((s, r) => s + r.revenue, 0));
    const sumProfit = r2(filtered.reduce((s, r) => s + r.profit, 0));

    const setFilter = (name, value) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };
    const clearFilters = () => {
        setSearch('');
        setFilters({ startDate: '', endDate: '', product: '', company: '', companyContact: '', result: '' });
        setCurrentPage(1);
    };
    const handlePageChange = (num) => {
        if (num >= 1 && num <= totalPages) setCurrentPage(num);
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
                            Sales Wise Profit Report
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Delivered sales theke product wise profit</p>
                    </div>
                    <div className="flex gap-3">
                        <div className="px-4 py-2 rounded-2xl bg-indigo-50 border border-indigo-100 text-center">
                            <div className="text-[10px] font-bold uppercase text-indigo-400">Sale Amount</div>
                            <div className="text-lg font-extrabold text-indigo-700">৳{fmt(sumRevenue)}</div>
                        </div>
                        <div className={`px-4 py-2 rounded-2xl border text-center ${sumProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <div className={`text-[10px] font-bold uppercase ${sumProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Total Profit</div>
                            <div className={`text-lg font-extrabold ${sumProfit >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>৳{fmt(sumProfit)}</div>
                        </div>
                    </div>
                </div>

                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-gray-800">Product Profit</h3>
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                            Showing: {filtered.length > 0 ? `${indexOfFirst + 1}-${Math.min(indexOfLast, filtered.length)}` : 0} of {filtered.length} ({rows.length} total)
                        </span>
                    </div>

                    {/* Filter Panel */}
                    <div className="bg-white shadow-lg rounded-2xl p-5 border border-indigo-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <FaFilter className="text-indigo-600" /> Filter & Search Panel
                            </h3>
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 text-xs bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 px-3 py-1.5 rounded-lg transition-all font-semibold cursor-pointer"
                            >
                                <FaRedo size={11} /> Clear All Filters
                            </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Product / company..."
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                                        className={inputCls}
                                    />
                                    {search && (
                                        <button
                                            type="button"
                                            onClick={() => { setSearch(''); setCurrentPage(1); }}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                                        >
                                            <FaTimes size={10} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Start Date</label>
                                <input type="date" value={filters.startDate} onChange={(e) => setFilter('startDate', e.target.value)} className={inputCls} />
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">End Date</label>
                                <input type="date" value={filters.endDate} onChange={(e) => setFilter('endDate', e.target.value)} className={inputCls} />
                            </div>

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Product</label>
                                <select value={filters.product} onChange={(e) => setFilter('product', e.target.value)} className={`${inputCls} cursor-pointer`}>
                                    <option value="">All</option>
                                    {productOptions.map((p) => (
                                        <option key={p} value={p}>{p}</option>
                                    ))}
                                </select>
                            </div>

                            <ContactSelect
                                label="Company"
                                placeholder="Search or select company..."
                                value={filters.company}
                                items={companyItems}
                                emptyText="No company found"
                                onType={(v) => {
                                    setFilters((prev) => ({ ...prev, company: v, companyContact: '' }));
                                    setCurrentPage(1);
                                }}
                                onSelect={(c) => {
                                    setFilters((prev) => ({ ...prev, company: c.name, companyContact: c.phone || '' }));
                                    setCurrentPage(1);
                                }}
                                onClear={() => {
                                    setFilters((prev) => ({ ...prev, company: '', companyContact: '' }));
                                    setCurrentPage(1);
                                }}
                            />

                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Result</label>
                                <select value={filters.result} onChange={(e) => setFilter('result', e.target.value)} className={`${inputCls} cursor-pointer`}>
                                    <option value="">All</option>
                                    <option value="profit">Profit</option>
                                    <option value="loss">Loss</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Summary */}
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs bg-indigo-50/60 border border-indigo-100 rounded-xl px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full font-bold bg-indigo-100 text-indigo-700">Showing</span>
                        <span className="font-semibold text-gray-600">Rows: <b className="text-gray-800">{filtered.length}</b></span>
                        <span className="font-semibold text-gray-600">Sale Qty: <b className="text-orange-600">{fmt(sumQty)} pcs</b></span>
                        <span className="font-semibold text-gray-600">Sale Price: <b className="text-indigo-600">৳{fmt(sumRevenue)}</b></span>
                        <span className="font-semibold text-gray-600">
                            Profit: <b className={sumProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}>৳{fmt(sumProfit)}</b>
                        </span>
                    </div>

                    {/* Table */}
                    {loading ? (
                        <div className="text-center py-20 text-gray-500 font-medium">Loading report...</div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">No data found!</div>
                    ) : (
                        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] uppercase tracking-wide whitespace-nowrap">
                                        <th className="py-3 px-3 w-12">SL</th>
                                        <th className="py-3 px-3">Date</th>
                                        <th className="py-3 px-3">Product</th>
                                        <th className="py-3 px-3">Company</th>
                                        <th className="py-3 px-3 text-right">Sale Qty</th>
                                        <th className="py-3 px-3 text-right">Sale Price</th>
                                        <th className="py-3 px-3 text-right">Profit</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                    {currentRows.map((r, i) => (
                                        <tr key={r.key} className="bg-white hover:bg-indigo-50/40 transition">
                                            <td className="py-2.5 px-3 text-gray-400 font-semibold">{indexOfFirst + i + 1}</td>
                                            <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{r.date || 'N/A'}</td>
                                            <td className="py-2.5 px-3 font-semibold text-gray-800 whitespace-nowrap">
                                                <div>{r.product}</div>
                                                <div className="text-[11px] text-indigo-600 font-semibold">#{r.orderNo}</div>
                                            </td>
                                            <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">
                                                <div>{r.company || 'N/A'}</div>
                                                {getCompanyPhone(r.company) && (
                                                    <div className="text-[11px] text-gray-400 mt-0.5">📞 {getCompanyPhone(r.company)}</div>
                                                )}
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-bold text-orange-600 whitespace-nowrap">{fmt(r.qty)} pcs</td>
                                            <td className="py-2.5 px-3 text-right font-bold text-indigo-600 whitespace-nowrap">৳{fmt(r.revenue)}</td>
                                            <td className={`py-2.5 px-3 text-right font-extrabold whitespace-nowrap ${r.profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                ৳{fmt(r.profit)}
                                            </td>
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

export default AcSalesWiseProfitRepo;