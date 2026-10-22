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

// Total pcs ke bundle format e: "2 Box 1 pcs" + niche "(11 pcs)"
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

const StockProducts = ({ onOpenHistory }) => {
    const [batches, setBatches] = useState([]);
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [salesBulkReturns, setSalesBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [adjustments, setAdjustments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ product: '', company: '' });
    const [hideEmpty, setHideEmpty] = useState(false);
    const [qtyType, setQtyType] = useState('all');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyShow, setHistoryShow] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    // Product / Company select options (/product, /company api theke)
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
        setHideEmpty(false);
        setQtyType('all');
        setIsProductOpen(false);
        setIsCompanyOpen(false);
        setSelectedKeys([]);
        setCurrentPage(1);
    };
    const itemsPerPage = 30;

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const res = await fetch('https://squirrel-peace-server.onrender.com/stock-purchase');
                const data = await res.json();
                setBatches(Array.isArray(data) ? data : []);

                const purchaseRes = await fetch('https://squirrel-peace-server.onrender.com/purchase');
                const purchaseData = await purchaseRes.json();
                setPurchases(Array.isArray(purchaseData) ? purchaseData : []);

                const salesRes = await fetch('https://squirrel-peace-server.onrender.com/sales');
                const salesData = await salesRes.json();
                setSales(Array.isArray(salesData) ? salesData : []);

                const bulkRes = await fetch('https://squirrel-peace-server.onrender.com/purchase-bulk-return');
                const bulkData = await bulkRes.json();
                setBulkReturns(Array.isArray(bulkData) ? bulkData : []);

                const sbRes = await fetch('https://squirrel-peace-server.onrender.com/sales-bulk-return');
                const sbData = await sbRes.json();
                setSalesBulkReturns(Array.isArray(sbData) ? sbData : []);

                const dmgRes = await fetch('https://squirrel-peace-server.onrender.com/sales-damage');
                const dmgData = await dmgRes.json();
                setDamages(Array.isArray(dmgData) ? dmgData : []);

                const adjRes = await fetch('https://squirrel-peace-server.onrender.com/stock-adjustment');
                const adjData = await adjRes.json();
                setAdjustments(Array.isArray(adjData) ? adjData : []);
            } catch (error) {
                console.error('Error fetching stock products:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, []);

    // Batch wise available qty (purchase return + sales + customer return hisab hoye)
    const stockRows = useMemo(() => {
        const purchaseMap = new Map(purchases.map((p) => [String(p._id), p]));
        const bulkMap = new Map();
        bulkReturns.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = bulkMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += Number(a.qty) || 0;
                bulkMap.set(k, cur);
            })
        );
        const sbMap = new Map();
        salesBulkReturns.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = sbMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += Number(a.qty) || 0;
                sbMap.set(k, cur);
            })
        );
        const dmgMap = new Map();
        damages.forEach((d) =>
            (d.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = dmgMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += Number(a.qty) || 0;
                dmgMap.set(k, cur);
            })
        );
        const adjMap = new Map();
        adjustments.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                const k = String(a.batchId);
                const cur = adjMap.get(k) || { paid: 0, free: 0 };
                cur[a.pool === 'paid' ? 'paid' : 'free'] += (a.direction === 'out' ? 1 : -1) * (Number(a.qty) || 0);
                adjMap.set(k, cur);
            })
        );
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
            const sold = { paid: sold0.paid - sb.paid + dm.paid + ad.paid, free: sold0.free - sb.free + dm.free + ad.free };
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
            if (per > 1) {
                g.info = { per, perSub: getPerSub(b), unit: b.unit, subUnit: b.subUnit };
            }
        });

        return Array.from(map.values())
            .map((g) => ({ ...g, total: g.main + g.free }))
            .sort((a, b) => b.lastIdx - a.lastIdx);
    }, [stockRows]);

    // ===== Overall History (latest 30, product wise) =====
    const HISTORY_STYLE = {
        purchase: { label: 'Purchase', sign: '+', cls: 'bg-indigo-100 text-indigo-700' },
        company: { label: 'Company Return', sign: '−', cls: 'bg-rose-100 text-rose-700' },
        sold: { label: 'Sold', sign: '−', cls: 'bg-orange-100 text-orange-700' },
        customer: { label: 'Customer Return', sign: '+', cls: 'bg-violet-100 text-violet-700' },
        damage: { label: 'Damage', sign: '−', cls: 'bg-red-100 text-red-700' },
        adjIn: { label: 'Adjustment In', sign: '+', cls: 'bg-amber-100 text-amber-700' },
        adjOut: { label: 'Adjustment Out', sign: '−', cls: 'bg-amber-100 text-amber-700' },
    };

    const historyEvents = useMemo(() => {
        const num = (v) => Number(v) || 0;
        const toTime = (d) => {
            if (!d) return 0;
            const m = String(d).trim().match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})/);
            if (m) return new Date(+m[3], +m[2] - 1, +m[1]).getTime();
            const t = Date.parse(d);
            return !isNaN(t) ? t : 0;
        };
        const oidTime = (id) => (/^[0-9a-f]{24}$/i.test(String(id)) ? parseInt(String(id).slice(0, 8), 16) * 1000 : 0);
        const createdTs = (o) => {
            const c = o?.createdAt ? Date.parse(o.createdAt) : NaN;
            return !isNaN(c) ? c : oidTime(o?._id);
        };
        const retTs = (ret, parent) => {
            const c = ret.createdAt ? Date.parse(ret.createdAt) : NaN;
            if (!isNaN(c)) return c;
            const d = toTime(ret.returnDate || ret.date);
            const endOfDay = d ? d + 24 * 60 * 60 * 1000 - 1000 : 0;
            return Math.max(endOfDay, createdTs(parent) + 1);
        };
        const batchById = new Map(stockRows.map((b) => [String(b._id), b]));
        const pKey = (b) => `${(b.productName || '').toString().trim().toLowerCase()}|${(b.company || '').toString().trim().toLowerCase()}`;
        const infoByKey = new Map(products.map((p) => [p.key, p.info]));

        const map = new Map();
        let seq = 0;
        const add = (type, refKey, ref, date, ts, bs, main, free, meta = {}) => {
            const list = (bs || []).filter(Boolean);
            if (!list.length || (main <= 0 && free <= 0)) return;
            const pk = pKey(list[0]);
            const k = `${type}|${refKey}|${pk}`;
            if (!map.has(k)) {
                map.set(k, {
                    key: k,
                    type,
                    ref,
                    date: date || '',
                    time: ts || toTime(date),
                    seq: seq++,
                    productName: list[0].productName,
                    company: list[0].company,
                    info: infoByKey.get(pk) || null,
                    main: 0,
                    free: 0,
                    ids: new Set(),
                    orderKeys: new Set(),
                    ...meta,
                });
            }
            const e = map.get(k);
            e.main += main;
            e.free += free;
            list.forEach((b) => {
                e.ids.add(String(b._id));
                e.orderKeys.add(b.purchaseId || b.invoiceNo);
            });
        };

        // Purchase
        stockRows.forEach((b) => {
            add(
                'purchase',
                b.purchaseId || b.invoiceNo,
                b.invoiceNo,
                b.receiveDate || b.purchaseDate,
                createdTs(b),
                [b],
                b.isFreeProduct ? 0 : num(b.origPaidQty),
                num(b.origFreeQty)
            );
        });

        // Company Return
        purchases.forEach((p) => {
            (p.returnHistory || []).forEach((ret, ri) => {
                const refKey = `${p._id}-${ret.returnId || ri}`;
                const ts = retTs(ret, p);
                const date = ret.returnDate || ret.date || ret.createdAt;
                const meta = { returnId: ret.returnId || '' };
                const batchesOf = (pid, free) => {
                    const all = stockRows.filter((b) => String(b.purchaseId) === String(p._id) && String(b.productId) === String(pid));
                    const pref = all.filter((b) => !!b.isFreeProduct === free);
                    return pref.length ? pref : all;
                };
                (ret.items || []).forEach((it) => {
                    add('company', refKey, p.invoiceNo, date, ts, batchesOf(it.productId, false), num(it.returnTotalQty), num(it.returnFreeTotalQty ?? it.returnFreeQty), meta);
                });
                (ret.freeItems || []).forEach((it) => {
                    add('company', refKey, p.invoiceNo, date, ts, batchesOf(it.productId, true), 0, num(it.returnTotalQty), meta);
                });
            });
        });

        // Bulk Return
        bulkReturns.forEach((r) => {
            const refKey = `bulk-${r._id}`;
            const ts = createdTs(r) || toTime(r.returnDate);
            (r.items || []).forEach((it) => {
                const bs = (r.stockAllocations || [])
                    .filter((a) => String(a.productId) === String(it.productId))
                    .map((a) => batchById.get(String(a.batchId)));
                add('company', refKey, r.invoiceNo, r.returnDate, ts, bs, num(it.totalPcs), num(it.freeTotalQty), { returnId: '', bulkId: r._id, isBulk: true });
            });
        });

        // Sold + Customer Return
        sales.forEach((s) => {
            const allocs = s.stockAllocations || [];
            if (!allocs.length) return;
            const soldTs = (s.deliveredAt ? Date.parse(s.deliveredAt) : 0) || createdTs(s) || toTime(s.deliveryDate || s.orderDate);
            const soldDate = s.deliveryDate || s.orderDate || s.createdAt;
            allocs.forEach((a) => {
                const q = num(a.qty);
                const isMain = (a.kind || 'main') === 'main';
                add('sold', s._id, s.orderNo, soldDate, soldTs, [batchById.get(String(a.batchId))], isMain ? q : 0, isMain ? 0 : q, { saleId: s._id });
            });

            (s.returnHistory || []).forEach((ret, ri) => {
                const refKey = `${s._id}-${ret.returnId || ri}`;
                const ts = retTs(ret, s);
                const date = ret.returnDate || ret.date || ret.createdAt;
                const meta = { saleId: s._id, returnId: ret.returnId || '' };
                const bOf = (pid) =>
                    allocs.filter((a) => String(a.productId) === String(pid)).map((a) => batchById.get(String(a.batchId))).filter(Boolean);
                (ret.items || []).forEach((it) => {
                    add('customer', refKey, s.orderNo, date, ts, bOf(it.productId), num(it.returnTotalQty), num(it.returnFreeTotalQty ?? it.returnFreeQty), meta);
                });
                (ret.freeItems || []).forEach((it) => {
                    add('customer', refKey, s.orderNo, date, ts, bOf(it.productId), 0, num(it.returnTotalQty), meta);
                });
            });
        });

        // Damage (stock minus)
        damages.forEach((d) => {
            const refKey = `damage-${d._id}`;
            const ts = createdTs(d) || toTime(d.damageDate);
            (d.items || []).forEach((it) => {
                const bs = (d.stockAllocations || [])
                    .filter((a) => String(a.productId) === String(it.productId))
                    .map((a) => batchById.get(String(a.batchId)));
                add('damage', refKey, d.invoiceNo, d.damageDate, ts, bs, num(it.totalQty), num(it.freeQty), { returnId: '', damageId: d._id });
            });
        });

        // Adjustment (In = stock plus, Out = stock minus)
        adjustments.forEach((a) => {
            const ts = createdTs(a) || toTime(a.adjustmentDate);
            (a.stockAllocations || []).forEach((al) => {
                const q = num(al.qty);
                const isPaid = al.pool === 'paid';
                add(
                    al.direction === 'out' ? 'adjOut' : 'adjIn',
                    `adj-${a._id}`,
                    a.invoiceNo,
                    a.adjustmentDate,
                    ts,
                    [batchById.get(String(al.batchId))],
                    isPaid ? q : 0,
                    isPaid ? 0 : q,
                    { adjustId: a._id }
                );
            });
        });

        // Sales Bulk Return (Customer Return, stock plus)
        salesBulkReturns.forEach((r) => {
            const refKey = `sbulk-${r._id}`;
            const ts = createdTs(r) || toTime(r.returnDate);
            (r.items || []).forEach((it) => {
                const bs = (r.stockAllocations || [])
                    .filter((a) => String(a.productId) === String(it.productId))
                    .map((a) => batchById.get(String(a.batchId)));
                add('customer', refKey, r.invoiceNo, r.returnDate, ts, bs, num(it.totalQty), num(it.freeQty), { returnId: '', bulkId: r._id, isBulk: true, saleId: r.saleId });
            });
        });

        return Array.from(map.values())
            .map((e) => ({ ...e, ids: [...e.ids], orderKeys: [...e.orderKeys] }))
            .sort((a, b) => b.time - a.time || b.seq - a.seq)
            .slice(0, 30);
    }, [stockRows, purchases, sales, products, bulkReturns, salesBulkReturns, damages, adjustments]);
    // qty -> "2 Box 4 pcs" + "(14 pcs)"
    const histQty = (total, info) => {
        const pcsText = `${fmt(total)} pcs`;
        let text = pcsText;
        if (info && info.per > 1) {
            const [u, s, p] = splitQty(total, info.per, info.perSub);
            const t = fmtQty(u, s, p, info.unit, info.subUnit);
            text = t === '—' ? pcsText : t;
        }
        return { text, pcsText, showChip: text !== pcsText };
    };

    const openHistory = () => {
        setHistoryOpen(true);
        setTimeout(() => setHistoryShow(true), 10);
    };
    const closeHistory = () => {
        setHistoryShow(false);
        setTimeout(() => setHistoryOpen(false), 300);
    };
    // modal smoothly bondho hoye tarpor Stock Purchase tab e niye jabe
    const openHistoryItem = (e) => {
        setHistoryShow(false);
        setTimeout(() => {
            setHistoryOpen(false);
            if (onOpenHistory) onOpenHistory(e);
        }, 300);
    };

    const filtered = useMemo(() => {
        const pq = filters.product.trim().toLowerCase();
        const cq = filters.company.trim().toLowerCase();
        return products.filter((p) => {
            if (hideEmpty && p.total <= 0) return false;
            if (qtyType === 'main' && p.main <= 0) return false;
            if (qtyType === 'free' && p.free <= 0) return false;
            if (pq && !p.productName.toLowerCase().includes(pq)) return false;
            if (cq && !p.company.toLowerCase().includes(cq)) return false;
            return true;
        });
    }, [products, filters, hideEmpty, qtyType]);

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

    const grandMain = summaryRows.reduce((s, p) => s + p.main, 0);
    const grandFree = summaryRows.reduce((s, p) => s + p.free, 0);
    const grandTotal = grandMain + grandFree;
    const grandValue = summaryRows.reduce((s, p) => s + p.value, 0);

    return (
        <div className="bg-gradient-to-br from-slate-100 via-indigo-50 to-pink-50">
            {/* Overall History Modal */}
            {historyOpen && (
                <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 ${historyShow ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={closeHistory} />
                    <div className={`relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${historyShow ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
                        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
                            <div>
                                <h3 className="text-base font-extrabold">🔔 Overall History</h3>
                                <p className="text-[11px] text-white/80 mt-0.5">Latest {historyEvents.length} activities</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeHistory}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/30 transition cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="max-h-[75vh] overflow-y-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0">
                                    <tr className="bg-emerald-50 text-emerald-700 text-[11px] font-bold uppercase tracking-wide">
                                        <th className="py-2.5 px-3">Date</th>
                                        <th className="py-2.5 px-3">Product</th>
                                        <th className="py-2.5 px-3">Status</th>
                                        <th className="py-2.5 px-3">Qty</th>
                                        <th className="py-2.5 px-3 text-center">Open</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-[13px] text-gray-700">
                                    {historyEvents.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">Kono history nai</td>
                                        </tr>
                                    ) : (
                                        historyEvents.map((e) => {
                                            const st = HISTORY_STYLE[e.type];
                                            const plus = st.sign === '+';
                                            return (
                                                <tr key={e.key} className="hover:bg-emerald-50/40 transition">
                                                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{e.date || 'N/A'}</td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <div className="font-bold text-gray-800">{e.productName}</div>
                                                        <div className="text-[11px] font-medium text-gray-400">{e.company}</div>
                                                    </td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${st.cls}`}>
                                                            {st.label}{e.isBulk ? ' - Bulk' : ''} ({st.sign})
                                                        </span>
                                                        <div className="text-[11px] text-gray-500 mt-0.5">#{e.ref}</div>
                                                    </td>
                                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            {[{ k: 'main', v: e.main }, { k: 'free', v: e.free }]
                                                                .filter((x) => x.v > 0)
                                                                .map((x) => {
                                                                    const q = histQty(x.v, e.info);
                                                                    return (
                                                                        <div key={x.k} className="flex items-center gap-1.5">
                                                                            <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${x.k === 'main' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                                {x.k === 'main' ? 'Main' : 'Free'}
                                                                            </span>
                                                                            <span className={`font-bold ${plus ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                {st.sign}{q.text}
                                                                            </span>
                                                                            {q.showChip && (
                                                                                <span className={`px-2 py-0.5 rounded-full border text-[11px] font-extrabold ${plus ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-rose-50 border-rose-200 text-rose-600'}`}>
                                                                                    ({q.pcsText})
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => openHistoryItem(e)}
                                                            className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 hover:bg-indigo-500 hover:text-white hover:border-indigo-500 text-[10px] font-bold shadow-sm transition cursor-pointer"
                                                        >
                                                            Open
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
            <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">

                    {/* Header */}
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Stock Products
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
                            <div className="px-4 py-2 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                                <div className="text-[10px] font-bold uppercase text-emerald-400">Total Stock Value</div>
                                <div className="text-lg font-extrabold text-emerald-700">৳{fmt(grandValue)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-bold text-gray-800">Product Stock</h3>
                                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                                    {filtered.length} products
                                </span>
                                <button
                                    type="button"
                                    onClick={openHistory}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold shadow-sm transition cursor-pointer"
                                >
                                    🔔 History
                                </button>
                            </div>
                            <div className="flex items-center gap-2">

                                <button
                                    type="button"
                                    onClick={() => { setHideEmpty((v) => !v); setCurrentPage(1); }}
                                    className={`px-3 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${hideEmpty
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600'
                                        }`}
                                >
                                    {hideEmpty ? 'Showing In Stock' : 'Hide Out of Stock'}
                                </button>
                            </div>
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

                                {/* Qty Type */}
                                <div>
                                    <label className="block text-gray-600 text-[11px] font-semibold mb-1">Qty Type</label>
                                    <select
                                        value={qtyType}
                                        onChange={(e) => { setQtyType(e.target.value); setCurrentPage(1); }}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer"
                                    >
                                        <option value="all">All</option>
                                        <option value="main">Main</option>
                                        <option value="free">Free</option>
                                    </select>
                                </div>
                            </div>
                        </div>

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
                                            <th className="py-3 px-3 w-12">#</th>
                                            <th className="py-3 px-3">Product</th>
                                            <th className="py-3 px-3">Company</th>
                                            <th className="py-3 px-3">Main Qty</th>
                                            <th className="py-3 px-3">Free Qty</th>
                                            <th className="py-3 px-3">Total Qty</th>
                                            <th className="py-3 px-3 text-right">Stock Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {currentItems.map((p, i) => (
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
                                                <td className="py-3 px-3 text-gray-400 font-semibold">{indexOfFirstItem + i + 1}</td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="font-bold text-gray-800">{p.productName}</div>
                                                    <div className="text-[10px] font-semibold text-gray-400">
                                                        {p.batchCount} batch{p.batchCount > 1 ? 'es' : ''}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 text-gray-600 font-medium whitespace-nowrap">{p.company}</td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="flex items-start gap-2">

                                                        <QtyBlock total={p.main} info={p.info} valueClass="text-indigo-700" chipClass="bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600" />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="flex items-start gap-2">
                                                        <QtyBlock total={p.free} info={p.info} valueClass="text-emerald-700" chipClass="bg-gradient-to-r from-emerald-50 to-teal-100 border-emerald-200 text-emerald-600" />
                                                    </div>
                                                </td>
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <QtyBlock
                                                        total={p.total}
                                                        info={p.info}
                                                        valueClass={p.total > 0 ? 'text-violet-700' : 'text-red-600'}
                                                        chipClass={p.total > 0
                                                            ? 'bg-gradient-to-r from-violet-50 to-pink-100 border-violet-200 text-violet-600'
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
        </div>
    );
};

export default StockProducts;