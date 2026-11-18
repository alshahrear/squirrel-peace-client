import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useCan from '../../../../../hooks/useCan';
import { DateInput } from '../../Product/ProductUi';
import { inputCls, labelCls, ComboField } from '../../Purchase/PurchaseUi';
import { Card, QtyField } from '../../Purchase/PurchaseFormUi';
import { labelToISO } from '../../Purchase/purchaseDate';

const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

const getFormattedToday = () =>
    new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const generateInvoiceNo = () => {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `${yy}${mm}${dd}${hh}${min}${ss}`;
};

const matchesSearch = (searchText, fields) => {
    const q = (searchText || '').toString().trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => String(f || '').toLowerCase().includes(q));
};

const damageKey = (name, company) =>
    `${(name || '').toString().trim().toLowerCase()}|${(company || '').toString().trim().toLowerCase()}`;

const QTY_FIELDS = ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'];

// Combo with disabled support
const Combo = ({ disabled, label, hint, placeholder, ...rest }) =>
    disabled ? (
        <div>
            <span className={labelCls}>
                {label} {hint && <span className="text-amber-600 font-normal">{hint}</span>}
            </span>
            <input disabled placeholder={placeholder} className={`${inputCls} cursor-not-allowed opacity-70`} />
        </div>
    ) : (
        <ComboField label={hint ? `${label} ${hint}` : label} placeholder={placeholder} {...rest} />
    );

const applyQty = (item, field, value) => {
    const next = { ...item, [field]: value === '' ? '' : Number(value) || 0 };
    const ppu = Number(next.pcsPerUnit) || 1;
    const pps = Number(next.pcsPerSub) || 0;
    next.totalQty =
        (Number(next.unitQty) || 0) * ppu +
        (Number(next.subQty) || 0) * pps +
        (Number(next.pcsQty) || 0);
    next.freeQty =
        (Number(next.freeUnitQty) || 0) * ppu +
        (Number(next.freeSubQty) || 0) * pps +
        (Number(next.freePcsQty) || 0);
    return next;
};

const restoreItem = (item, index) => ({
    ...item,
    uniqueId: `${item.productId || 'item'}-${index}-${Date.now()}`,
    _id: item.productId,
    unitQty: Number(item.unitQty) || '',
    subQty: Number(item.subQty) || '',
    pcsQty: Number(item.pcsQty) || '',
    totalQty: Number(item.totalQty) || 0,
    freeUnitQty: Number(item.freeUnitQty) || '',
    freeSubQty: Number(item.freeSubQty) || '',
    freePcsQty: Number(item.freePcsQty) || '',
    freeQty: Number(item.freeQty) || 0,
});

const getRowTotal = (i) => (Number(i.buyPrice) || 0) * (Number(i.totalQty) || 0);

const DamageReturnAdd = () => {
    const { canAdd, canEdit } = useCan('damage_return_invoice');
    const navigate = useNavigate();
    const location = useLocation();
    const editing = location.state?.damageReturn || null;
    const isEditMode = !!editing;
    const editId = editing?._id || null;

    const [formData, setFormData] = useState({
        company: editing?.company || '',
        companyContact: editing?.phone || '',
        companyAddress: editing?.address || '',
        category: editing?.category || '',
        date: editing?.returnDate || getFormattedToday(),
    });

    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [stockList, setStockList] = useState(null);

    const [search, setSearch] = useState({
        company: editing?.company || '',
        category: editing?.category || '',
        product: '',
    });
    const updateSearch = (key, value) => setSearch((p) => ({ ...p, [key]: value }));
    const updateForm = (fields) => setFormData((p) => ({ ...p, ...fields }));

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editing?.note || '');
    const [isSaving, setIsSaving] = useState(false);

    const showToast = (message, isError = false) => (isError ? toast.error(message) : toast.success(message));

    // ---------- Fetch ----------
    useEffect(() => {
        const load = (endpoint, setter, filterFn) =>
            fetch(`http://localhost:5000/${endpoint}`)
                .then((r) => r.json())
                .then((d) => setter(Array.isArray(d) ? (filterFn ? d.filter(filterFn) : d) : []))
                .catch((e) => console.error(e));
        load('company', setCompanies);
        load('category', setCategories, (c) => c.isActive === true);
        load('product', setProducts);

        // Damage stock = Sales damage + Standalone damage - Purchase damage return - Damage return
        Promise.all([
            fetch('http://localhost:5000/sales').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/sales-damage').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/purchase').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/damage-return').then((r) => r.json()).catch(() => []),
        ])
            .then(([sales, dmg, purchases, returns]) => {
                const num = (v) => Number(v) || 0;

                // ---- Damage invoice gulo (stock in) ----
                const invs = [];
                (Array.isArray(sales) ? sales : [])
                    .filter((s) => s.status === 'Delivered' && (s.damageItems || []).length > 0)
                    .forEach((s) =>
                        invs.push({ label: s.orderNo, ts: Date.parse(s.damageAt || s.createdAt) || 0, items: s.damageItems || [] })
                    );
                (Array.isArray(dmg) ? dmg : []).forEach((d) =>
                    invs.push({ label: d.invoiceNo, ts: Date.parse(d.createdAt) || 0, items: d.items || [] })
                );
                invs.sort((a, b) => a.ts - b.ts);

                const groups = new Map();
                const lineMap = new Map();
                invs.forEach((inv) => {
                    const m = new Map();
                    inv.items.forEach((it) => {
                        const key = damageKey(it.productName, it.company);
                        if (!m.has(key)) m.set(key, { ts: inv.ts, main: 0, free: 0, retMain: 0, retFree: 0, lots: [] });
                        const l = m.get(key);
                        const q = num(it.totalQty);
                        l.main += q;
                        l.free += num(it.freeQty);
                        if (Array.isArray(it.costBreakdown) && it.costBreakdown.length > 0) {
                            it.costBreakdown.forEach((c) =>
                                l.lots.push({ qty: num(c.qty), cost: num(c.cost), label: inv.label || c.invoiceNo, time: inv.ts })
                            );
                        } else if (q > 0) {
                            l.lots.push({ qty: q, cost: null, label: inv.label || '', time: inv.ts });
                        }
                        if (!groups.has(key)) {
                            groups.set(key, {
                                key,
                                productName: it.productName || '',
                                company: it.company || '',
                                productId: it.productId,
                                pcsPerUnit: 1,
                                parentMode: false,
                                pcsPerSub: 0,
                                unit: '',
                                subUnit: '',
                            });
                        }
                        const g = groups.get(key);
                        g.pcsPerUnit = Number(it.pcsPerUnit) || g.pcsPerUnit;
                        g.parentMode = it.parentMode === true;
                        g.pcsPerSub = it.parentMode === true ? Number(it.pcsPerSub) || 0 : 0;
                        g.unit = it.unit || g.unit;
                        g.subUnit = it.subUnit || g.subUnit;
                    });
                    m.forEach((l, k) => {
                        if (!lineMap.has(k)) lineMap.set(k, []);
                        lineMap.get(k).push(l);
                    });
                });

                // ---- Company return gulo (stock out) -> invoice wise FIFO ----
                const evs = [];
                (Array.isArray(purchases) ? purchases : []).forEach((p) => {
                    if (!(p.receiveStatus === 'Received' || p.receiveStatus === 'Yes')) return;
                    if (!(p.damageItems || []).length) return;
                    evs.push({ ts: Date.parse(p.damageAt || p.createdAt) || 0, items: p.damageItems || [] });
                });
                (Array.isArray(returns) ? returns : []).forEach((r) => {
                    if (editId && String(r._id) === String(editId)) return;
                    evs.push({ ts: Date.parse(r.createdAt) || 0, items: r.items || [] });
                });
                evs.sort((a, b) => a.ts - b.ts);
                evs.forEach((ev) =>
                    ev.items.forEach((it) => {
                        let m = num(it.totalQty) - num(it.mainFromFree) + num(it.freeFromMain);
                        let f = num(it.freeQty) - num(it.freeFromMain) + num(it.mainFromFree);
                        for (const l of lineMap.get(damageKey(it.productName, it.company)) || []) {
                            if (m <= 0 && f <= 0) break;
                            if (ev.ts && l.ts > ev.ts) continue;
                            const tm = Math.max(Math.min(m, l.main - l.retMain), 0);
                            const tf = Math.max(Math.min(f, l.free - l.retFree), 0);
                            l.retMain += tm;
                            l.retFree += tf;
                            m -= tm;
                            f -= tf;
                        }
                    })
                );

                setStockList(
                    Array.from(groups.values()).map((g) => {
                        let paid = 0;
                        let free = 0;
                        const lots = [];
                        (lineMap.get(g.key) || []).forEach((l) => {
                            paid += Math.max(l.main - l.retMain, 0);
                            free += Math.max(l.free - l.retFree, 0);
                            let consume = l.retMain;
                            l.lots.forEach((lot) => {
                                const t = Math.min(lot.qty, consume);
                                consume -= t;
                                const left = lot.qty - t;
                                if (left > 0) lots.push({ ...lot, qty: left });
                            });
                        });
                        lots.sort((a, b) => a.time - b.time);
                        return { ...g, paid, free, lots };
                    })
                );
            })
            .catch((e) => console.error('Error fetching damage stock:', e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Edit prefill ----------
    useEffect(() => {
        if (editing) setItems((editing.items || []).map(restoreItem));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Company (required) ----------
    const filteredCompanies = companies.filter((c) =>
        matchesSearch(search.company, [c.businessName, c.contactNumber, c.address])
    );

    const handleSelectCompany = (c) => {
        if (formData.company !== c.businessName) setItems([]);
        updateForm({
            company: c.businessName,
            companyContact: c.contactNumber || '',
            companyAddress: c.address || '',
        });
        updateSearch('company', c.businessName);
        updateSearch('product', '');
    };

    const handleClearCompany = () => {
        setItems([]);
        updateForm({ company: '', companyContact: '', companyAddress: '' });
        updateSearch('company', '');
        updateSearch('product', '');
    };

    // ---------- Category ----------
    const filteredCategories = categories.filter((c) => matchesSearch(search.category, [c.name]));

    const handleSelectCategory = (cat) => {
        updateForm({ category: cat.name });
        updateSearch('category', cat.name);
        updateSearch('product', '');
    };

    const handleClearCategory = () => {
        updateForm({ category: '' });
        updateSearch('category', '');
        updateSearch('product', '');
    };

    // ---------- Date ----------
    const handleDateChange = (e) => {
        const raw = e.target.value;
        if (raw) {
            const [y, m, d] = raw.split('-');
            const formatted = new Date(y, m - 1, d).toLocaleDateString('en-GB', {
                day: '2-digit', month: 'short', year: 'numeric',
            });
            updateForm({ date: formatted });
        }
    };

    // ---------- Product ----------
    const findMaster = (s) => products.find((p) => damageKey(p.productName, p.company) === s.key);

    const getStock = (item) => {
        if (!stockList) return null;
        const f = stockList.find((d) => d.key === damageKey(item.productName, item.company));
        return f ? { paid: f.paid, free: f.free } : { paid: 0, free: 0 };
    };

    const calcBorrow = (it) => {
        const st = getStock(it);
        if (!st) return { mainFromFree: 0, freeFromMain: 0 };
        const mainShort = Math.max((Number(it.totalQty) || 0) - st.paid, 0);
        const freeShort = Math.max((Number(it.freeQty) || 0) - st.free, 0);
        return {
            mainFromFree: it.borrowMain ? mainShort : 0,
            freeFromMain: it.borrowFree ? freeShort : 0,
        };
    };

    const checkStock = (it) => {
        const st = getStock(it);
        if (!st) return null;
        const total = Number(it.totalQty) || 0;
        const free = Number(it.freeQty) || 0;
        const mainShort = Math.max(total - st.paid, 0);
        const freeShort = Math.max(free - st.free, 0);
        const surplusFree = Math.max(st.free - free, 0);
        const surplusPaid = Math.max(st.paid - total, 0);
        if (mainShort > 0) {
            if (!it.borrowMain) return `Damage main stock e matro ${st.paid} pcs ache! Free theke nite "Free +" click korun.`;
            if (surplusFree < mainShort) return `Main er jonno Free soho matro ${st.paid + surplusFree} pcs ache!`;
        }
        if (freeShort > 0) {
            if (!it.borrowFree) return `Damage free stock e matro ${st.free} pcs ache! Main theke nite "Main +" click korun.`;
            if (surplusPaid < freeShort) return `Free er jonno Main soho matro ${st.free + surplusPaid} pcs ache!`;
        }
        return null;
    };

    const handleToggleBorrow = (uniqueId, field) => {
        const item = items.find((i) => i.uniqueId === uniqueId);
        if (!item) return;
        const next = { ...item, [field]: !item[field] };
        if (item[field]) {
            if (checkStock(next)) return showToast('Age quantity komiye nin, tarpor off korun!', true);
        }
        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
    };

    const filteredProducts = (stockList || []).filter((s) => {
        if (!formData.company) return false;
        if (damageKey('', s.company) !== damageKey('', formData.company)) return false;
        if (s.paid <= 0 && s.free <= 0) return false;
        const master = findMaster(s);
        if (formData.category && master?.category !== formData.category) return false;
        if (items.some((i) => damageKey(i.productName, i.company) === s.key)) return false;
        return matchesSearch(search.product, [s.productName, master?.sku]);
    });

    const handleSelectProduct = (s) => {
        const master = findMaster(s);
        const isParent = s.parentMode === true;
        const newItem = {
            uniqueId: Date.now() + Math.random(),
            _id: master?._id || s.productId,
            productName: s.productName || '',
            company: s.company || '',
            buyPrice: Number(master?.purchasePrice) || 0,
            unit: s.unit || master?.unit || 'Pcs',
            parentMode: isParent,
            subUnit: isParent ? (s.subUnit || '') : '',
            pcsPerSub: isParent ? (Number(s.pcsPerSub) || 1) : 0,
            pcsPerUnit: Number(s.pcsPerUnit) || 1,
            subQty: '',
            unitQty: '',
            pcsQty: '',
            totalQty: 0,
            freeUnitQty: '',
            freeSubQty: '',
            freePcsQty: '',
            freeQty: 0,
            borrowMain: false,
            borrowFree: false,
        };
        setItems((prev) => [...prev, newItem]);
        updateSearch('product', '');
    };

    const handleRemoveItem = (uniqueId) =>
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));

    const handleItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        const cur = items.find((i) => i.uniqueId === uniqueId);
        if (!cur) return;

        if (QTY_FIELDS.includes(field)) {
            const next = applyQty(cur, field, value);
            const msg = checkStock(next);
            if (msg) return showToast(msg, true);
            setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
            return;
        }

        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? { ...i, [field]: value } : i)));
    };

    // ---------- Totals ----------
    const subTotal = roundTo2(items.reduce((t, i) => t + getRowTotal(i), 0));
    const damageAmount = subTotal;

    // ---------- Stock cost (FIFO, damage stock er source onujayi) ----------
    const getCostBreakdown = (item) => {
        const key = damageKey(item.productName, item.company);
        const lots = stockList?.find((d) => d.key === key)?.lots || [];
        const master = products.find((p) => damageKey(p.productName, p.company) === key);
        const fallback = Number(master?.purchasePrice) || 0;
        let remaining = Math.max((Number(item.totalQty) || 0) - calcBorrow(item).mainFromFree, 0);
        const lines = [];
        lots.forEach((l) => {
            if (remaining <= 0) return;
            const take = Math.min(l.qty, remaining);
            if (take <= 0) return;
            const cost = l.cost ?? fallback;
            lines.push({ invoiceNo: l.label, qty: take, cost: roundTo2(cost), amount: roundTo2(take * cost), est: l.cost == null });
            remaining -= take;
        });
        return lines;
    };

    // ---------- Payment (optional, default disabled) ----------
    const savedPay = editing?.payment || null;
    const [investments, setInvestments] = useState([]);
    const [paymentOpen, setPaymentOpen] = useState(!!savedPay);
    const [paymentAmount, setPaymentAmount] = useState(savedPay?.amount ?? '');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(!!savedPay);
    const [paymentAccountType, setPaymentAccountType] = useState(savedPay?.method || '');
    const [selectedAccountKey, setSelectedAccountKey] = useState(() => {
        if (!savedPay) return '';
        const a = savedPay.account || {};
        if (savedPay.method === 'Bank') return `${a.bankName}-${a.accountNumber}-${a.accountBranch}`;
        if (savedPay.method === 'Mobile Banking') return `${a.accountName}-${a.accountNumber}`;
        return 'cash';
    });
    const [paymentNote, setPaymentNote] = useState(savedPay?.note || '');

    useEffect(() => {
        fetch('http://localhost:5000/investment')
            .then((res) => res.json())
            .then((data) => setInvestments(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching investments:', error));
    }, []);

    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];
    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        if (inv.accountType === 'Mobile Banking') return `${inv.accountName}-${inv.accountNumber}`;
        return 'cash';
    };
    const uniqueAccountsMap = new Map();
    investments
        .filter((inv) => inv.accountType === paymentAccountType)
        .forEach((inv) => {
            const k = getAccountKey(inv);
            if (!uniqueAccountsMap.has(k)) uniqueAccountsMap.set(k, inv);
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());
    const selectedAccountInfo = uniqueAccounts.find((inv) => getAccountKey(inv) === selectedAccountKey);

    useEffect(() => {
        if (!paymentAmountTouched) setPaymentAmount(roundTo2(damageAmount));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [damageAmount, paymentAmountTouched]);

    // ---------- Submit ----------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        if (isEditMode ? !canEdit : !canAdd) {
            return showToast(isEditMode ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!', true);
        }

        if (!formData.company) return showToast('Company is required!', true);
        if (!formData.date) return showToast('Date is required!', true);
        if (items.length === 0) return showToast('Please add at least one product!', true);
        if (items.some((i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0)) {
            return showToast('Each product must have a valid quantity!', true);
        }
        if (!stockList) return showToast('Stock is loading, please wait...', true);

        for (const i of items) {
            const msg = checkStock(i);
            if (msg) return showToast(`${i.productName}: ${msg}`, true);
        }

        // ---------- Payment validation (shudhu Payment open thakle) ----------
        let paymentData = null;
        if (paymentOpen) {
            if (paymentAmount === '' || paymentAmount === null) {
                return showToast('Payment amount is required! (or close Payment)', true);
            }
            if (!paymentAccountType) {
                return showToast('Please select a payment method! (or close Payment)', true);
            }
            if (!selectedAccountInfo) {
                return showToast('Please select an account! (or close Payment)', true);
            }
            let accInfo = {};
            if (paymentAccountType === 'Bank') {
                accInfo = {
                    bankName: selectedAccountInfo.bankName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                    accountBranch: selectedAccountInfo.accountBranch || '',
                };
            } else if (paymentAccountType === 'Mobile Banking') {
                accInfo = {
                    accountName: selectedAccountInfo.accountName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                };
            } else {
                accInfo = { accountName: 'Cash' };
            }
            paymentData = {
                amount: roundTo2(paymentAmount),
                method: paymentAccountType,
                account: accInfo,
                note: paymentNote,
            };
        }

        const itemsPayload = items.map((i) => ({
            productId: i._id,
            productName: i.productName,
            company: i.company,
            buyPrice: roundTo2(i.buyPrice),
            unit: i.unit || 'Pcs',
            parentMode: i.parentMode === true,
            subUnit: i.subUnit || '',
            pcsPerUnit: Number(i.pcsPerUnit) || 1,
            pcsPerSub: Number(i.pcsPerSub) || 0,
            unitQty: Number(i.unitQty) || 0,
            subQty: Number(i.subQty) || 0,
            pcsQty: Number(i.pcsQty) || 0,
            totalQty: Number(i.totalQty) || 0,
            freeUnitQty: Number(i.freeUnitQty) || 0,
            freeSubQty: Number(i.freeSubQty) || 0,
            freePcsQty: Number(i.freePcsQty) || 0,
            freeQty: Number(i.freeQty) || 0,
            itemTotal: roundTo2(getRowTotal(i)),
            borrowMain: i.borrowMain === true,
            borrowFree: i.borrowFree === true,
            mainFromFree: calcBorrow(i).mainFromFree,
            freeFromMain: calcBorrow(i).freeFromMain,
            costBreakdown: getCostBreakdown(i),
        }));

        const payload = {
            invoiceNo: isEditMode ? editing.invoiceNo : generateInvoiceNo(),
            company: formData.company,
            phone: formData.companyContact,
            address: formData.companyAddress,
            category: formData.category,
            returnDate: formData.date,
            items: itemsPayload,
            damageAmount,
            returnAmount: damageAmount,
            note,
            payment: paymentData,
        };

        try {
            setIsSaving(true);
            const url = isEditMode
                ? `http://localhost:5000/damage-return/${editId}`
                : 'http://localhost:5000/damage-return';
            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed');
            await res.json();
            showToast(isEditMode ? 'Damage return updated successfully!' : 'Damage return added successfully!');
            setTimeout(
                () => navigate('/damage-return-invoice', { replace: true }),
                1000
            );
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save damage return. Try again.', true);
        }
    };

    const num = (id, field) => (v) => /^\d*$/.test(v) && handleItemChange(id, field, v);

    const borrowBtn = (active, onClick, label, tone) => (
        <button
            type="button"
            onClick={onClick}
            className={`h-8 px-3 rounded-full text-[11px] font-extrabold cursor-pointer border transition ${active
                ? 'bg-amber-500 border-amber-500 text-white'
                : `bg-white ${tone}`
                }`}
        >
            {label} {active ? '✓' : '+'}
        </button>
    );

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-4">
                {/* Top form */}
                <div className="relative z-20">
                    <Card
                        title={isEditMode ? 'Edit Damage Return' : 'Add Damage Return'}
                        subtitle="Select company and damaged products to return"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Combo
                                label="Company *"
                                placeholder="Search or select company..."
                                value={search.company}
                                options={filteredCompanies.map((c) => ({
                                    key: c._id,
                                    title: c.businessName,
                                    sub: `📞 ${c.contactNumber || ''} | 📍 ${c.address || ''}`,
                                    raw: c,
                                }))}
                                onType={(text) => {
                                    updateSearch('company', text);
                                    if (formData.company) {
                                        setItems([]);
                                        updateForm({ company: '', companyContact: '', companyAddress: '' });
                                    }
                                }}
                                onClear={handleClearCompany}
                                onPick={(o) => handleSelectCompany(o.raw)}
                            />

                            <Combo
                                label="Filter by Category"
                                placeholder="Search or select category..."
                                value={search.category}
                                options={filteredCategories.map((c) => ({ key: c._id, title: c.name, raw: c }))}
                                onType={(text) => {
                                    updateSearch('category', text);
                                    updateForm({ category: '' });
                                }}
                                onClear={handleClearCategory}
                                onPick={(o) => handleSelectCategory(o.raw)}
                            />

                            <div>
                                <span className={labelCls}>Date *</span>
                                <DateInput name="date" value={labelToISO(formData.date)} onChange={handleDateChange} placeholder="Select date" />
                            </div>
                        </div>

                        <div className="mt-4">
                            <Combo
                                label="Select Product *"
                                hint={formData.company ? '(Damage stock products of this company)' : ''}
                                disabled={!formData.company}
                                placeholder={formData.company ? 'Search or select product...' : 'Select a company first...'}
                                value={search.product}
                                options={filteredProducts.map((s) => ({
                                    key: s.key,
                                    title: s.productName,
                                    sub: `Company: ${s.company} | Main: ${s.paid} | Free: ${s.free}`,
                                    raw: s,
                                }))}
                                onType={(text) => updateSearch('product', text)}
                                onClear={() => updateSearch('product', '')}
                                onPick={(o) => handleSelectProduct(o.raw)}
                            />
                        </div>
                    </Card>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Items */}
                    {items.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                            No products added yet. Please select a company and product above.
                        </div>
                    ) : (
                        items.map((item) => {
                            const id = item.uniqueId;
                            const unitLabel = item.unit || 'Pcs';
                            const st = getStock(item);
                            const borrow = calcBorrow(item);
                            const rowTotal = getRowTotal(item);
                            return (
                                <div key={id} className="bg-white rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                                            <p className="text-xs text-slate-500">{item.company}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[11px] text-slate-400">Item Total</p>
                                                <p className="font-bold text-emerald-700">{rowTotal.toFixed(2)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label="Remove product"
                                                onClick={() => handleRemoveItem(id)}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                                        {/* Main */}
                                        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <p className="text-xs font-bold text-brand-700">
                                                    Main · Total {item.totalQty}
                                                    <span className="ml-1 text-slate-500 font-semibold">
                                                        · Stock {st ? st.paid - borrow.freeFromMain : '...'}
                                                    </span>
                                                    {borrow.mainFromFree > 0 && (
                                                        <span className="ml-1 text-amber-600">(Free theke: {borrow.mainFromFree})</span>
                                                    )}
                                                </p>
                                                {borrowBtn(item.borrowMain, () => handleToggleBorrow(id, 'borrowMain'), 'Free', 'border-brand-300 text-brand-700 hover:bg-brand-600 hover:text-white')}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <QtyField label={unitLabel} value={item.unitQty} onChange={num(id, 'unitQty')} />
                                                {item.parentMode && <QtyField label={item.subUnit || 'Sub'} value={item.subQty ?? ''} onChange={num(id, 'subQty')} />}
                                                <QtyField label="Pcs" value={item.pcsQty} onChange={num(id, 'pcsQty')} />
                                            </div>
                                        </div>

                                        {/* Free */}
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                                <p className="text-xs font-bold text-emerald-700">
                                                    Free · Total {item.freeQty}
                                                    <span className="ml-1 text-slate-500 font-semibold">
                                                        · Stock {st ? st.free - borrow.mainFromFree : '...'}
                                                    </span>
                                                    {borrow.freeFromMain > 0 && (
                                                        <span className="ml-1 text-amber-600">(Main theke: {borrow.freeFromMain})</span>
                                                    )}
                                                </p>
                                                {borrowBtn(item.borrowFree, () => handleToggleBorrow(id, 'borrowFree'), 'Main', 'border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white')}
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <QtyField label={unitLabel} value={item.freeUnitQty} onChange={num(id, 'freeUnitQty')} />
                                                {item.parentMode && <QtyField label={item.subUnit || 'Sub'} value={item.freeSubQty ?? ''} onChange={num(id, 'freeSubQty')} />}
                                                <QtyField label="Pcs" value={item.freePcsQty} onChange={num(id, 'freePcsQty')} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buy price */}
                                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:max-w-xs">
                                        <label className="block">
                                            <span className="block text-[11px] font-medium text-slate-500 mb-1">Buy Price (PCS)</span>
                                            <input
                                                type="number"
                                                inputMode="decimal"
                                                min="0"
                                                step="0.01"
                                                value={item.buyPrice}
                                                onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && handleItemChange(id, 'buyPrice', e.target.value)}
                                                className={inputCls}
                                            />
                                        </label>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* Summary */}
                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-rose-700">Return Amount</span>
                            <span className="text-xl font-bold text-rose-600">৳{damageAmount.toFixed(2)}</span>
                        </div>
                    </Card>

                    {/* Return Payment (optional, default disabled) */}
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <h3 className="text-base font-bold text-emerald-800">Return Payment</h3>
                                <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                    Return Amount: ৳{damageAmount.toFixed(2)}
                                </span>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={paymentOpen}
                                onClick={() => setPaymentOpen((prev) => !prev)}
                                className="h-10 flex items-center gap-2 text-xs font-semibold text-emerald-700 cursor-pointer"
                            >
                                {paymentOpen ? 'Enabled' : 'Disabled'}
                                <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${paymentOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                    <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${paymentOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                                </span>
                            </button>
                        </div>

                        {paymentOpen && (
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelCls}>Payment Amount *</label>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={paymentAmount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                setPaymentAmount(value);
                                                setPaymentAmountTouched(true);
                                            }
                                        }}
                                        className={inputCls}
                                    />
                                </div>
                                <div>
                                    <label className={labelCls}>Payment Method *</label>
                                    <select
                                        value={paymentAccountType}
                                        onChange={(e) => {
                                            setPaymentAccountType(e.target.value);
                                            setSelectedAccountKey(
                                                e.target.value && e.target.value !== 'Bank' && e.target.value !== 'Mobile Banking'
                                                    ? 'cash'
                                                    : ''
                                            );
                                        }}
                                        className={`${inputCls} cursor-pointer`}
                                    >
                                        <option value="">Select method...</option>
                                        {accountTypes.map((type) => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelCls}>Account *</label>
                                    <select
                                        value={selectedAccountKey}
                                        onChange={(e) => setSelectedAccountKey(e.target.value)}
                                        disabled={!paymentAccountType}
                                        className={`${inputCls} cursor-pointer`}
                                    >
                                        <option value="">{paymentAccountType ? 'Select account...' : 'Select method first'}</option>
                                        {uniqueAccounts.map((inv) => {
                                            const k = getAccountKey(inv);
                                            const label =
                                                inv.accountType === 'Bank'
                                                    ? `${inv.bankName} - ${inv.accountNumber} (${inv.accountBranch})`
                                                    : inv.accountType === 'Mobile Banking'
                                                        ? `${inv.accountName} - ${inv.accountNumber}`
                                                        : 'Cash';
                                            return <option key={k} value={k}>{label}</option>;
                                        })}
                                    </select>
                                </div>
                                <div className="md:col-span-3">
                                    <label className={labelCls}>Payment Note (Optional)</label>
                                    <textarea
                                        rows="2"
                                        placeholder="Write any note about this payment..."
                                        value={paymentNote}
                                        onChange={(e) => setPaymentNote(e.target.value)}
                                        className={`${inputCls} resize-y`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Note */}
                    <Card>
                        <label className={labelCls}>Damage Note</label>
                        <textarea
                            rows="3"
                            placeholder="Write any note about this damage return..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className={`${inputCls} resize-y`}
                        />
                    </Card>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-brand-600 text-white text-sm font-semibold px-10 py-3 w-full sm:w-auto disabled:opacity-60 cursor-pointer"
                        >
                            {isSaving ? 'Saving...' : isEditMode ? 'Update Damage Return' : 'Add Damage Return'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DamageReturnAdd;