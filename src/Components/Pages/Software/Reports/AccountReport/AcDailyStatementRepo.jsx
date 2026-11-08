import React, { useState, useEffect, useRef } from 'react';
import { FaPrint, FaFilter, FaRedo, FaTimes } from 'react-icons/fa';

// Searchable dropdown (Collected By / SR / Route)
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

const getTodayInput = () => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const AcDailyStatementRepo = () => {
    const EMPTY_FILTERS = {
        date: getTodayInput(),
        collectedBy: '',
        sr: '',
        route: '',
    };
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const dateRef = useRef(null);

    const [users, setUsers] = useState([]);
    const [sales, setSales] = useState([]);
    const [duePayments, setDuePayments] = useState([]);
    const [bulkReturns, setBulkReturns] = useState([]);
    const [damages, setDamages] = useState([]);
    const [routeExpenses, setRouteExpenses] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                const [uRes, sRes, dRes, bRes, dmRes, reRes] = await Promise.all([
                    fetch('https://squirrel-peace-server.onrender.com/user'),
                    fetch('https://squirrel-peace-server.onrender.com/sales'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-due-payment'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-bulk-return'),
                    fetch('https://squirrel-peace-server.onrender.com/sales-damage'),
                    fetch('https://squirrel-peace-server.onrender.com/routeExpense'),
                ]);
                const uData = await uRes.json().catch(() => []);
                const sData = await sRes.json().catch(() => []);
                const dData = await dRes.json().catch(() => []);
                const bData = await bRes.json().catch(() => []);
                const dmData = await dmRes.json().catch(() => []);
                const reData = await reRes.json().catch(() => []);
                setUsers(Array.isArray(uData) ? uData : []);
                setSales(Array.isArray(sData) ? sData : []);
                setDuePayments(Array.isArray(dData) ? dData : []);
                setBulkReturns(Array.isArray(bData) ? bData : []);
                setDamages(Array.isArray(dmData) ? dmData : []);
                setRouteExpenses(Array.isArray(reData) ? reData : []);
            } catch (error) {
                console.error('Error fetching daily statement filter data:', error);
            }
        };
        load();
    }, []);

    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    const collectedByOptions = uniq(users.filter((u) => u.role === 'Delivery Man').map((u) => u.name));
    const srOptions = uniq(users.filter((u) => u.role === 'SR').map((u) => u.name));
    const routeOptions = uniq(sales.filter((o) => !o.directSales).map((o) => o.route));

    const setFilter = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));
    const handleClearFilters = () => setFilters(EMPTY_FILTERS);

    const displayFormattedDate = (dateString) => {
        if (!dateString) return '';
        const [year, month, day] = dateString.split('-');
        if (!year || !month || !day) return dateString;
        const dateObj = new Date(year, month - 1, day);
        return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const num = (v) => Number(v) || 0;
    const has = (val, q) => String(val || '').toLowerCase().includes(String(q).toLowerCase());

    // "06 Sep 2026" / "06/09/2026" / "2026-09-06" -> { y, m, d }
    const parseYMD = (str) => {
        if (!str) return null;
        const part = String(str).split(',')[0].trim().replace('Sept', 'Sep');
        if (part.includes('/')) {
            const [d, m, y] = part.split('/').map(Number);
            return d && m && y ? { y, m, d } : null;
        }
        if (/^\d{4}-\d{2}-\d{2}/.test(part)) {
            const [y, m, d] = part.slice(0, 10).split('-').map(Number);
            return { y, m, d };
        }
        const p = new Date(part);
        return isNaN(p) ? null : { y: p.getFullYear(), m: p.getMonth() + 1, d: p.getDate() };
    };

    // Sales amount = Receivable amount (Previous Get/Pay, Damage Adj, Bulk Return Adj bad diye)
    const getSalesAmount = (o) => {
        const payable = num(o.payableAmount ?? o.grandTotal);
        const prevAmt = num(o.previousBalanceAmount);
        const prevSigned = o.previousBalanceType === 'Due' ? prevAmt : o.previousBalanceType === 'Get' ? -prevAmt : 0;
        const damageAdj = num(o.damageAdjustmentAmount);
        const returnAdj = num(o.returnAdjustmentAmount);
        return Math.round((payable - prevSigned + damageAdj + returnAdj) * 100) / 100;
    };

    // Invoice Collection = delivery'r somoy customer ke joto tk dise (paidAmount)
    // Payable negative hole (ami customer ke dilam) ota collection e dhora hobe na
    const getInvoiceColl = (o) => {
        const payable = num(o.payableAmount ?? o.grandTotal);
        if (payable < 0) return 0;
        const paid = num(o.paidAmount);

        // Previous Get (Due) tik deya thakle, age invoice er tk (payable - previous get) porjonto invoice collection e jabe
        if (o.previousBalanceType === 'Due' && num(o.previousBalanceAmount) > 0) {
            const invoiceDue = Math.max(payable - num(o.previousBalanceAmount), 0);
            return Math.round(Math.min(paid, invoiceDue) * 100) / 100;
        }
        return Math.round(paid * 100) / 100;
    };

    // Previous Get er joto tk ashole collect hoyeche (invoice cover korar por baki tk) -> Sales Get Collection
    const getPrevGetColl = (o) => {
        if (o.previousBalanceType !== 'Due') return 0;
        const prevAmt = num(o.previousBalanceAmount);
        if (prevAmt <= 0) return 0;
        const payable = num(o.payableAmount ?? o.grandTotal);
        if (payable < 0) return 0;
        const extra = Math.max(num(o.paidAmount) - getInvoiceColl(o), 0);
        return Math.round(Math.min(extra, prevAmt) * 100) / 100;
    };

    // Invoice Pay Collection = payable negative hole (ami customer ke dilam), ami joto tk dilam
    // (Previous Pay tik deya thakle ar payable negative na hole, ota Sales Pay Collection e jabe)
    const getInvoicePayColl = (o) => {
        const payable = num(o.payableAmount ?? o.grandTotal);
        if (payable >= 0) return 0;
        return Math.round(num(o.paidAmount) * 100) / 100;
    };

    // Previous Pay er joto tk ashole ami dilam -> Sales Pay Collection
    const getPrevPayColl = (o) => {
        if (o.previousBalanceType !== 'Get') return 0;
        const prevAmt = num(o.previousBalanceAmount);
        if (prevAmt <= 0) return 0;
        const payable = num(o.payableAmount ?? o.grandTotal);
        // payable negative hole ota Invoice Pay Collection e jabe
        if (payable < 0) return 0;
        // Previous Pay tik deya thakle oi tk ta Sales Pay Collection e dekhabe
        return Math.round(prevAmt * 100) / 100;
    };

    // Bulk Return (OrderAdd theke, Receivable er shathe adjust kora) -> Bulk Return column
    // Invoice er joto tk porjonto return adjust hoyeche shudhu toto tk Bulk Return e jabe
    // Return invoice er cheye beshi hole beshi ongsho payable hoye jabe, ota Invoice Pay Collection e dhora hoy
    const getBulkAdjPortion = (o) => {
        const returnAdj = num(o.returnAdjustmentAmount);
        if (returnAdj <= 0) return 0;
        const payable = num(o.payableAmount ?? o.grandTotal);
        const prevAmt = num(o.previousBalanceAmount);
        const prevSigned = o.previousBalanceType === 'Due' ? prevAmt : o.previousBalanceType === 'Get' ? -prevAmt : 0;
        const invoiceNet = payable - prevSigned; // return adjust howar pore invoice er tk
        const invoiceBeforeReturn = Math.max(invoiceNet + returnAdj, 0); // return adjust howar age invoice er tk
        return Math.round(Math.min(returnAdj, invoiceBeforeReturn) * 100) / 100;
    };

    // Damage Adjustment (OrderAdd theke, Receivable er shathe adjust kora) -> Damage Return column
    // Invoice er joto tk porjonto damage adjust hoyeche shudhu toto tk Damage Return e jabe
    // Damage invoice er cheye beshi hole beshi ongsho payable hoye jabe, ota Invoice Pay Collection e dhora hoy
    const getDamageAdjPortion = (o) => {
        const damageAdj = num(o.damageAdjustmentAmount);
        if (damageAdj <= 0) return 0;
        const returnAdj = num(o.returnAdjustmentAmount);
        const payable = num(o.payableAmount ?? o.grandTotal);
        const prevAmt = num(o.previousBalanceAmount);
        const prevSigned = o.previousBalanceType === 'Due' ? prevAmt : o.previousBalanceType === 'Get' ? -prevAmt : 0;
        const invoiceNet = payable - prevSigned; // damage + return adjust howar pore invoice er tk
        const invoiceBeforeDamage = Math.max(invoiceNet + damageAdj + returnAdj, 0); // damage + return adjust howar age invoice er tk
        return Math.round(Math.min(damageAdj, invoiceBeforeDamage) * 100) / 100;
    };

    const matchedSales = sales.filter((o) => {
        if (o.directSales) return false;
        if (o.status !== 'Delivered') return false;

        if (filters.date) {
            const f = parseYMD(filters.date);
            const d = parseYMD(o.deliveryDate);
            if (!f || !d || f.y !== d.y || f.m !== d.m || f.d !== d.d) return false;
        }
        if (filters.collectedBy && !has(o.deliveredBy, filters.collectedBy)) return false;
        if (filters.sr && !has(o.sr, filters.sr)) return false;
        if (filters.route && !has(o.route, filters.route)) return false;
        return true;
    });

    const groupMap = new Map();
    const getGroup = (key, by, route) => {
        if (!groupMap.has(key)) {
            groupMap.set(key, {
                collectedBy: by,
                route,
                sales: 0,
                invoiceReturn: 0,
                bulkReturn: 0,
                damageReturn: 0,
                totalReturn: 0,
                invoiceColl: 0,
                invoicePayColl: 0,
                salesGetColl: 0,
                salesPayColl: 0,
                collTotal: 0,
                routeExpense: 0,
                netCollection: 0,
            });
        }
        return groupMap.get(key);
    };

    matchedSales.forEach((o) => {
        const by = o.deliveredBy || 'N/A';
        const route = o.route || 'N/A';
        const g = getGroup(`${by}|||${route}`, by, route);
        if (o.deliveredBy) g.role = 'DSR';
        g.sales += getSalesAmount(o);
        g.invoiceColl += getInvoiceColl(o);
        g.invoicePayColl += getInvoicePayColl(o);
        g.salesGetColl += getPrevGetColl(o);
        g.salesPayColl += getPrevPayColl(o);
        g.bulkReturn += getBulkAdjPortion(o);
        g.damageReturn += getDamageAdjPortion(o);
        g.totalReturn = g.invoiceReturn + g.bulkReturn + g.damageReturn;
        g.collTotal = g.invoiceColl + g.salesGetColl - g.invoicePayColl - g.salesPayColl;
    });

    // Sales Due Payment (Get / Pay) - oi date er, SR / Delivery Man onujayi alada row
    const getDueType = (p) =>
        p?.type === 'Pay' || p?.status === 'Pay' || p?.paymentAccount?.dueType === 'Pay' ? 'Pay' : 'Get';

    const matchedDue = duePayments.filter((p) => {
        // SR ba Delivery Man kono ta select na thakle ashbe na
        if (!p.deliveredBy && !p.sr) return false;
        if (filters.date) {
            const f = parseYMD(filters.date);
            const d = parseYMD(p.date);
            if (!f || !d || f.y !== d.y || f.m !== d.m || f.d !== d.d) return false;
        }
        if (filters.route) return false; // due payment e route nai
        if (filters.collectedBy && !has(p.deliveredBy, filters.collectedBy)) return false;
        if (filters.sr && !has(p.sr, filters.sr)) return false;
        return true;
    });

    matchedDue.forEach((p) => {
        const by = p.deliveredBy || p.sr || 'N/A';
        const role = p.deliveredBy ? 'DSR' : 'SR';
        const g = getGroup(`${by}|||due|||${role}|||${p.deliveredById || p.srId || ''}`, by, 'N/A');
        g.role = role;
        const amt = Math.round(num(p.amount) * 100) / 100;
        if (getDueType(p) === 'Pay') g.salesPayColl += amt;
        else g.salesGetColl += amt;
        g.collTotal = g.invoiceColl + g.salesGetColl - g.invoicePayColl - g.salesPayColl;
    });

    // Invoice Return = Sales Return (SalesReturnDetails) theke Payment dile, oi payment amount
    // Shorto: Collected By (Delivery Man) thakte hobe, return date match korte hobe, Payment enable kore amount > 0 hote hobe
    sales.forEach((o) => {
        if (o.directSales) return;
        (o.returnHistory || []).forEach((ret) => {
            const payAmt = Math.round(num(ret.payment?.amount) * 100) / 100;
            if (payAmt <= 0) return; // payment feature use hoyni
            if (!ret.collectedBy) return; // delivery man select nai
            if (filters.date) {
                const f = parseYMD(filters.date);
                const d = parseYMD(ret.returnDate);
                if (!f || !d || f.y !== d.y || f.m !== d.m || f.d !== d.d) return;
            }
            if (filters.collectedBy && !has(ret.collectedBy, filters.collectedBy)) return;
            if (filters.sr && !has(o.sr, filters.sr)) return;
            if (filters.route && !has(o.route, filters.route)) return;

            const by = ret.collectedBy;
            const route = o.route || 'N/A';
            const g = getGroup(`${by}|||${route}`, by, route);
            g.role = 'DSR';
            g.invoiceReturn += payAmt;
            g.totalReturn = g.invoiceReturn + g.bulkReturn + g.damageReturn;
        });
    });

    // Bulk Return = Sales Bulk Return (SalesBulkReturnForm) theke Payment dile, oi payment amount
    // Shorto: Collected By (Delivery Man) thakte hobe, return date match korte hobe, Payment enable kore amount > 0 hote hobe
    bulkReturns.forEach((b) => {
        if (b.fromSales) return; // Order theke ashha bulk return (adjustment) ekhane dhora hobe na
        const payAmt = Math.round(num(b.payment?.amount) * 100) / 100;
        if (payAmt <= 0) return; // payment feature use hoyni
        if (!b.collectedBy) return; // delivery man select nai
        if (filters.date) {
            const f = parseYMD(filters.date);
            const d = parseYMD(b.returnDate);
            if (!f || !d || f.y !== d.y || f.m !== d.m || f.d !== d.d) return;
        }
        if (filters.collectedBy && !has(b.collectedBy, filters.collectedBy)) return;
        if (filters.sr) return; // bulk return e SR nai
        if (filters.route) return; // bulk return e route nai

        const by = b.collectedBy;
        const g = getGroup(`${by}|||bulk`, by, 'N/A');
        g.role = 'DSR';
        g.bulkReturn += payAmt;
        g.totalReturn = g.invoiceReturn + g.bulkReturn + g.damageReturn;
    });

    // Damage Return = Damage Add (DamageStockAdd) theke Payment dile, oi payment amount
    // Shorto: Customer select thakte hobe, Collected By (Delivery Man) thakte hobe, damage date match korte hobe, Payment enable kore amount > 0 hote hobe
    damages.forEach((d) => {
        if (!d.customerId) return; // stock damage (customer nai)
        const payAmt = Math.round(num(d.payment?.amount) * 100) / 100;
        if (payAmt <= 0) return; // payment feature use hoyni
        if (!d.collectedBy) return; // delivery man select nai
        if (filters.date) {
            const f = parseYMD(filters.date);
            const dt = parseYMD(d.damageDate);
            if (!f || !dt || f.y !== dt.y || f.m !== dt.m || f.d !== dt.d) return;
        }
        if (filters.collectedBy && !has(d.collectedBy, filters.collectedBy)) return;
        if (filters.sr) return; // damage e SR nai
        if (filters.route) return; // damage e route nai

        const by = d.collectedBy;
        const g = getGroup(`${by}|||damage`, by, 'N/A');
        g.role = 'DSR';
        g.damageReturn += payAmt;
        g.totalReturn = g.invoiceReturn + g.bulkReturn + g.damageReturn;
    });

    // Route Expense = Route Expense page theke, Daily Statement Collection "Yes" hole
    // Shorto: date match, Delivered By thakte hobe, same delivery man + same route hole same row e jabe
    routeExpenses.forEach((re) => {
        if (String(re.dailyStatementCollection || '').trim().toLowerCase() !== 'yes') return;
        if (!re.deliveredBy) return;
        const amt = Math.round(num(re.amount) * 100) / 100;
        if (amt <= 0) return;
        if (filters.date) {
            const f = parseYMD(filters.date);
            const d = parseYMD(re.date);
            if (!f || !d || f.y !== d.y || f.m !== d.m || f.d !== d.d) return;
        }
        if (filters.collectedBy && !has(re.deliveredBy, filters.collectedBy)) return;
        if (filters.sr) return; // route expense e SR nai
        if (filters.route && !has(re.routeName, filters.route)) return;

        const by = re.deliveredBy;
        const route = re.routeName || 'N/A';
        const g = getGroup(`${by}|||${route}`, by, route);
        g.role = 'DSR';
        g.routeExpense += amt;
    });

    const rows = [...groupMap.values()]
        .map((r) => ({
            ...r,
            // Final Collection = (Net Collection - Total Return) - Route Expense
            netCollection: Math.round((r.collTotal - r.totalReturn - r.routeExpense) * 100) / 100,
        }))
        .sort((a, b) => a.collectedBy.localeCompare(b.collectedBy) || a.route.localeCompare(b.route));

    const totals = rows.reduce(
        (t, r) => ({
            sales: t.sales + r.sales,
            invoiceReturn: t.invoiceReturn + r.invoiceReturn,
            bulkReturn: t.bulkReturn + r.bulkReturn,
            damageReturn: t.damageReturn + r.damageReturn,
            totalReturn: t.totalReturn + r.totalReturn,
            invoiceColl: t.invoiceColl + r.invoiceColl,
            invoicePayColl: t.invoicePayColl + r.invoicePayColl,
            salesGetColl: t.salesGetColl + r.salesGetColl,
            salesPayColl: t.salesPayColl + r.salesPayColl,
            collTotal: t.collTotal + r.collTotal,
            routeExpense: t.routeExpense + r.routeExpense,
            netCollection: t.netCollection + r.netCollection,
        }),
        {
            sales: 0,
            invoiceReturn: 0,
            bulkReturn: 0,
            damageReturn: 0,
            totalReturn: 0,
            invoiceColl: 0,
            invoicePayColl: 0,
            salesGetColl: 0,
            salesPayColl: 0,
            collTotal: 0,
            routeExpense: 0,
            netCollection: 0,
        }
    );

    // Amount box
    const tones = {
        indigo: 'bg-indigo-50 border-indigo-100 text-indigo-700',
        rose: 'bg-rose-50 border-rose-100 text-rose-600',
        emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        amber: 'bg-amber-50 border-amber-100 text-amber-700',
        gray: 'bg-gray-50 border-gray-100 text-gray-500',
    };
    const AmtBox = ({ value, tone = 'gray', strong = false }) => (
        <div
            className={`inline-block min-w-[100px] px-3 py-1.5 rounded-lg border text-right tabular-nums ${strong ? 'font-extrabold' : 'font-semibold'} ${num(value) === 0 ? tones.gray : tones[tone]}`}
        >
            {fmt(value)}
        </div>
    );

    const fmt = (v) => Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const thBase = 'px-3 py-3 text-[11px] font-bold uppercase tracking-wide text-white border-r border-white/20 last:border-r-0';

    return (
        <div className="p-4 md:p-6">
            <div className="max-w-[1700px] mx-auto space-y-6">

                {/* Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white">
                    <div className="flex items-center gap-3">
                        <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            Daily Statement
                        </h2>
                        <button
                            type="button"
                            className="w-9 h-9 flex items-center justify-center rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-100 transition-all cursor-pointer"
                            title="Print"
                        >
                            <FaPrint size={14} />
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">Collected By ও Route অনুযায়ী দৈনিক হিসাব</p>
                </div>

                {/* Table */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-4 md:p-5 border border-white space-y-4">

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

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {/* Date */}
                            <div>
                                <label className="block text-gray-600 text-[11px] font-semibold mb-1">Date</label>
                                <div
                                    className="relative w-full cursor-pointer"
                                    onClick={() => dateRef.current?.showPicker?.() || dateRef.current?.click()}
                                >
                                    <input
                                        ref={dateRef}
                                        type="date"
                                        name="date"
                                        value={filters.date}
                                        onChange={(e) => setFilter('date', e.target.value)}
                                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                                    />
                                    <input
                                        type="text"
                                        readOnly
                                        placeholder="Select date"
                                        value={displayFormattedDate(filters.date)}
                                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 outline-none bg-gray-50/50 text-gray-700 cursor-pointer pointer-events-none"
                                    />
                                </div>
                            </div>

                            {/* Collected By */}
                            <FilterSelect
                                label="Collected By"
                                placeholder="Search or select collected by..."
                                value={filters.collectedBy}
                                options={collectedByOptions}
                                onChange={(v) => setFilter('collectedBy', v)}
                                emptyText="No delivery man found"
                            />

                            {/* SR */}
                            <FilterSelect
                                label="SR"
                                placeholder="Search or select SR..."
                                value={filters.sr}
                                options={srOptions}
                                onChange={(v) => setFilter('sr', v)}
                                emptyText="No SR found"
                            />

                            {/* Route */}
                            <FilterSelect
                                label="Route"
                                placeholder="Search or select route..."
                                value={filters.route}
                                options={routeOptions}
                                onChange={(v) => setFilter('route', v)}
                                emptyText="No route found"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 whitespace-nowrap">
                                    <th rowSpan={2} className={`${thBase} align-middle`}>Collected By</th>
                                    <th rowSpan={2} className={`${thBase} align-middle`}>Route</th>
                                    <th rowSpan={2} className={`${thBase} align-middle text-right`}>Net Sales</th>
                                    <th colSpan={4} className={`${thBase} text-center border-b border-white/20`}>Sales Return</th>
                                    <th colSpan={5} className={`${thBase} text-center border-b border-white/20`}>Collection</th>
                                    <th rowSpan={2} className={`${thBase} align-middle text-right`}>Route Expense</th>
                                    <th rowSpan={2} className={`${thBase} align-middle text-right`}>Final Collection</th>
                                </tr>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 whitespace-nowrap">
                                    <th className={`${thBase} text-right`}>Invoice Return</th>
                                    <th className={`${thBase} text-right`}>Bulk Return</th>
                                    <th className={`${thBase} text-right`}>Damage Return</th>
                                    <th className={`${thBase} text-right`}>Total Return</th>
                                    <th className={`${thBase} text-right`}>Invoice Get Collection</th>
                                    <th className={`${thBase} text-right`}>Invoice Pay Collection</th>
                                    <th className={`${thBase} text-right`}>Sales Get Collection</th>
                                    <th className={`${thBase} text-right`}>Sales Pay Collection</th>
                                    <th className={`${thBase} text-right`} style={{ borderRightWidth: '1px' }}>Net Collection</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                                {rows.length === 0 ? (
                                    <tr>
                                        <td colSpan={14} className="text-center py-10 text-gray-400 font-medium">
                                            No delivered sales found!
                                        </td>
                                    </tr>
                                ) : (
                                    rows.map((r, i) => (
                                        <tr key={i} className="hover:bg-indigo-50/40 transition duration-150">
                                            <td className="px-4 py-3.5 whitespace-nowrap font-bold text-gray-800">
                                                {r.collectedBy}
                                                {r.role && (
                                                    <span className={`ml-1 text-[10px] font-bold ${r.role === 'SR' ? 'text-pink-600' : 'text-indigo-600'}`}>
                                                        ({r.role})
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3.5 whitespace-nowrap text-gray-600 font-medium">{r.route}</td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.sales} tone="indigo" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.invoiceReturn} tone="rose" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.bulkReturn} tone="rose" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.damageReturn} tone="rose" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.totalReturn} tone="rose" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.invoiceColl} tone="emerald" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.invoicePayColl} tone="rose" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.salesGetColl} tone="emerald" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.salesPayColl} tone="rose" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.collTotal} tone="emerald" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.routeExpense} tone="amber" /></td>
                                            <td className="px-3 py-3.5 text-right"><AmtBox value={r.netCollection} tone="indigo" /></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="bg-indigo-50/60 border-t-2 border-indigo-200 text-xs text-gray-800 whitespace-nowrap">
                                    <td className="px-4 py-3.5 font-extrabold" colSpan={2}>
                                        <span className="block text-right">Totals</span>
                                    </td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.sales} tone="indigo" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.invoiceReturn} tone="rose" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.bulkReturn} tone="rose" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.damageReturn} tone="rose" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.totalReturn} tone="rose" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.invoiceColl} tone="emerald" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.invoicePayColl} tone="rose" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.salesGetColl} tone="emerald" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.salesPayColl} tone="rose" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.collTotal} tone="emerald" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.routeExpense} tone="amber" strong /></td>
                                    <td className="px-3 py-3.5 text-right"><AmtBox value={totals.netCollection} tone="indigo" strong /></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AcDailyStatementRepo;