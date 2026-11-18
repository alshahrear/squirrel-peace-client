import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { getBatchCostPerPcs } from '../../../Software/Inventory/Stock/StockPurchase';
import { fetchAccountBalance } from '../../../Software/Account/AccountBalance';
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
    const q = (searchText || '').toLowerCase();
    return fields.some((f) => String(f || '').toLowerCase().includes(q));
};

// Combo with disabled support
const Combo = ({ disabled, label, hint, placeholder, ...rest }) =>
    disabled ? (
        <div>
            <span className={labelCls}>
                {label} {hint && <span className="text-amber-600 font-normal">{hint}</span>}
            </span>
            <input disabled placeholder={placeholder} className={inputCls} />
        </div>
    ) : (
        <ComboField label={hint ? `${label} ${hint}` : label} placeholder={placeholder} {...rest} />
    );

// ---------- Item helpers ----------
const buildItem = (product) => {
    const isParent = product.parentUnitUse === true;
    const pcsPerUnit = Number(product.pcsOfUnit) || 1;
    const pcsPerSub = isParent ? (Number(product.subUnitQty) || 1) : 0;
    const sellingPrice = Number(product.sellingPrice) || 0;

    return {
        uniqueId: Date.now() + Math.random(),
        _id: product._id,
        productName: product.productName || '',
        company: product.company || '',
        sku: product.sku || null,

        sellPricePcs: sellingPrice,
        sellPriceUnit: roundTo2(sellingPrice * pcsPerUnit),
        sellPriceSub: isParent ? roundTo2(sellingPrice * pcsPerSub) : '',

        unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
        parentMode: isParent,
        subUnit: isParent ? (product.subUnit || '') : '',
        pcsPerSub,
        subQty: '',

        unitQty: '',
        pcsQty: '',
        pcsPerUnit,
        totalQty: 0,

        freeUnitQty: '',
        freeSubQty: '',
        freePcsQty: '',
        freeQty: 0,

        baseFreeUnitQty: isParent ? 0 : (Number(product.freeProductUnitQty) || 0),
        baseFreeSubQty: isParent ? (Number(product.freeProductSubQty) || 0) : 0,
        baseFreePcsQty: Number(product.freeProductPcsQty) || 0,
    };
};

const applyItemChange = (item, field, value) => {
    if (item.parentMode && ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
        const numVal = value === '' ? '' : Number(value) || 0;
        const next = { ...item, [field]: numVal };
        const ppu = Number(next.pcsPerUnit) || 1;
        const pps = Number(next.pcsPerSub) || 0;
        next.totalQty =
            (Number(next.unitQty) || 0) * ppu +
            (Number(next.subQty) || 0) * pps +
            (Number(next.pcsQty) || 0);
        if (field === 'unitQty' || field === 'subQty') {
            const u = Number(next.unitQty) || 0;
            const s = Number(next.subQty) || 0;
            next.freeSubQty = u * (Number(item.baseFreeSubQty) || 0) || '';
            next.freePcsQty = (u + s) * (Number(item.baseFreePcsQty) || 0) || '';
        }
        next.freeQty =
            (Number(next.freeUnitQty) || 0) * ppu +
            (Number(next.freeSubQty) || 0) * pps +
            (Number(next.freePcsQty) || 0);
        return next;
    }

    if (field === 'unitQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const pcsQtyVal = Number(item.pcsQty) || 0;
        const ppu = Number(item.pcsPerUnit) || 1;
        const newFreeUnitQty = numVal * (Number(item.baseFreeUnitQty) || 0);
        const newFreePcsQty = numVal * (Number(item.baseFreePcsQty) || 0);
        return {
            ...item,
            unitQty: value === '' ? '' : numVal,
            totalQty: numVal * ppu + pcsQtyVal,
            freeUnitQty: newFreeUnitQty || '',
            freePcsQty: newFreePcsQty || '',
            freeQty: newFreeUnitQty * ppu + newFreePcsQty,
        };
    }

    if (field === 'sellPriceUnit') {
        const unitPriceVal = value === '' ? 0 : Number(value) || 0;
        const ppu = Number(item.pcsPerUnit) || 1;
        const pps = Number(item.pcsPerSub) || 0;
        return {
            ...item,
            sellPriceUnit: value,
            sellPricePcs: roundTo2(unitPriceVal / ppu),
            ...(item.parentMode ? { sellPriceSub: roundTo2((unitPriceVal / ppu) * pps) } : {}),
        };
    }

    if (field === 'sellPriceSub') {
        const subPriceVal = value === '' ? 0 : Number(value) || 0;
        const pps = Number(item.pcsPerSub) || 1;
        return {
            ...item,
            sellPriceSub: value,
            sellPricePcs: value === '' ? '' : roundTo2(subPriceVal / pps),
        };
    }

    if (field === 'pcsQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const unitQtyVal = Number(item.unitQty) || 0;
        return {
            ...item,
            pcsQty: value === '' ? '' : numVal,
            totalQty: unitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal,
        };
    }

    if (field === 'freeUnitQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const freePcsQtyVal = Number(item.freePcsQty) || 0;
        return {
            ...item,
            freeUnitQty: value === '' ? '' : numVal,
            freeQty: numVal * (Number(item.pcsPerUnit) || 1) + freePcsQtyVal,
        };
    }

    if (field === 'freePcsQty') {
        const numVal = value === '' ? 0 : Number(value) || 0;
        const freeUnitQtyVal = Number(item.freeUnitQty) || 0;
        return {
            ...item,
            freePcsQty: value === '' ? '' : numVal,
            freeQty: freeUnitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal,
        };
    }

    return { ...item, [field]: value };
};

const restoreItem = (item, index) => {
    const unitQty = Number(item.unitQty) || 0;
    const subQty = Number(item.subQty) || 0;
    const pcsPerUnit =
        Number(item.pcsPerUnit) > 0
            ? Number(item.pcsPerUnit)
            : Number(item.sellPricePcs) > 0
                ? roundTo2(Number(item.sellPriceUnit) / Number(item.sellPricePcs)) || 1
                : 1;
    const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
    const freeSubQtyNum = Number(item.freeSubQty) || 0;
    const freePcsQtyNum = Number(item.freePcsQty) || 0;

    return {
        ...item,
        uniqueId: `${item.productId || 'item'}-${index}-${Date.now()}`,
        _id: item.productId,
        unitQty: unitQty || '',
        subQty: subQty || '',
        pcsQty: item.pcsQty || '',
        pcsPerUnit,
        totalQty: Number(item.totalQty) || 0,
        freeUnitQty: freeUnitQtyNum || '',
        freeSubQty: freeSubQtyNum || '',
        freePcsQty: freePcsQtyNum || '',
        freeQty: Number(item.freeQty) || 0,
        baseFreeUnitQty: unitQty > 0 ? roundTo2(freeUnitQtyNum / unitQty) : 0,
        baseFreeSubQty: unitQty > 0 ? roundTo2(freeSubQtyNum / unitQty) : 0,
        baseFreePcsQty: item.parentMode === true
            ? ((unitQty + subQty) > 0 ? roundTo2(freePcsQtyNum / (unitQty + subQty)) : 0)
            : (unitQty > 0 ? roundTo2(freePcsQtyNum / unitQty) : 0),
    };
};

const getUnitTotal = (i) => (Number(i.unitQty) || 0) * (Number(i.sellPriceUnit) || 0);
const getPcsTotal = (i) => (Number(i.pcsQty) || 0) * (Number(i.sellPricePcs) || 0);
const getSubTotal = (i) => (Number(i.subQty) || 0) * (Number(i.sellPriceSub) || 0);
const getRowGross = (i) => getUnitTotal(i) + getSubTotal(i) + getPcsTotal(i);

// Stock er batch (FIFO) onujayi main qty er cost hisab
const getCostBreakdown = (stock, qty) => {
    let remaining = Number(qty) || 0;
    const lines = [];
    (stock?.batches || []).forEach((b) => {
        if (remaining <= 0) return;
        const take = Math.min(Number(b.paid) || 0, remaining);
        if (take <= 0) return;
        const cost = Number(b.cost) || 0;
        lines.push({
            batchNo: b.batchNo,
            invoiceNo: b.invoiceNo,
            qty: take,
            cost,
            amount: roundTo2(take * cost),
        });
        remaining -= take;
    });
    return lines;
};

// price input with small total badge
const PriceField = ({ label, total, tone, value, disabled, onChange }) => (
    <label className="block min-w-0">
        <span className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500 mb-1">
            <span className="truncate">{label}</span>
            <span className={`px-1.5 rounded text-[10px] font-bold whitespace-nowrap ${total > 0 ? tone : 'bg-slate-100 text-slate-400'}`}>
                ৳{total.toFixed(2)}
            </span>
        </span>
        <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            placeholder="0"
            disabled={disabled}
            value={value}
            onChange={(e) => /^\d*\.?\d{0,2}$/.test(e.target.value) && onChange(e.target.value)}
            className={inputCls}
        />
    </label>
);

const DamageStockAdd = () => {
    const { canAdd, canEdit } = useCan('damage_stock_invoice');
    const navigate = useNavigate();
    const location = useLocation();
    const editingDamage = location.state?.damage || null;
    const isEditMode = !!editingDamage;
    const editId = editingDamage?._id || null;

    const [formData, setFormData] = useState({
        customerId: editingDamage?.customerId || '',
        customer: editingDamage?.customer || '',
        customerContact: editingDamage?.phone || '',
        customerAddress: editingDamage?.address || '',
        company: editingDamage?.company || '',
        category: editingDamage?.category || '',
        date: editingDamage?.damageDate || getFormattedToday(),
        collectedById: editingDamage?.collectedById || '',
        collectedBy: editingDamage?.collectedBy || '',
    });

    const [deliveryMen, setDeliveryMen] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [stockMap, setStockMap] = useState(null);

    const [search, setSearch] = useState({
        customer: editingDamage?.customer || '',
        company: editingDamage?.company || '',
        category: editingDamage?.category || '',
        collectedBy: editingDamage?.collectedBy || '',
        product: '',
    });
    const updateSearch = (key, value) => setSearch((p) => ({ ...p, [key]: value }));
    const updateForm = (fields) => setFormData((p) => ({ ...p, ...fields }));

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editingDamage?.note || '');
    const [isSaving, setIsSaving] = useState(false);

    const showToast = (message, isError = false) => (isError ? toast.error(message) : toast.success(message));

    // ---------- Payment (shudhu customer select thakle, optional, default disabled) ----------
    const savedPay = editingDamage?.payment || null;
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
    const [accAvailable, setAccAvailable] = useState(null);

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

    // Selected account e ekhon koto tk ache (live, 5 sec por por refresh)
    useEffect(() => {
        if (!paymentOpen || !formData.customerId || !selectedAccountInfo) {
            setAccAvailable(null);
            return;
        }
        let cancelled = false;
        let acc = { accountName: 'Cash' };
        if (paymentAccountType === 'Bank') {
            acc = {
                bankName: selectedAccountInfo.bankName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
                accountBranch: selectedAccountInfo.accountBranch || '',
            };
        } else if (paymentAccountType === 'Mobile Banking') {
            acc = {
                accountName: selectedAccountInfo.accountName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
            };
        }
        const keyOf = (a) => `${a?.accountName || a?.bankName || 'Cash'}||${a?.accountNumber || ''}||${a?.accountBranch || ''}`;
        const loadBal = () =>
            fetchAccountBalance(acc).then((bal) => {
                if (cancelled) return;
                let avail = bal;
                const oldPay = editingDamage?.payment;
                if (isEditMode && oldPay && Number(oldPay.amount) > 0 && keyOf(oldPay.account) === keyOf(acc)) {
                    avail += Number(oldPay.amount) || 0;
                }
                setAccAvailable(Math.round(avail * 100) / 100);
            });
        loadBal();
        const balTimer = setInterval(loadBal, 5000);
        return () => {
            cancelled = true;
            clearInterval(balTimer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paymentOpen, selectedAccountKey, paymentAccountType, investments, formData.customerId]);

    // ---------- Fetch ----------
    useEffect(() => {
        const load = (endpoint, setter, filterFn) =>
            fetch(`http://localhost:5000/${endpoint}`)
                .then((r) => r.json())
                .then((d) => setter(Array.isArray(d) ? (filterFn ? d.filter(filterFn) : d) : []))
                .catch((e) => console.error(e));
        load('customer', setCustomers);
        load('company', setCompanies);
        load('category', setCategories, (c) => c.isActive === true);
        load('product', setProducts);
        load('user', setDeliveryMen);
        // Cost StockPurchase.jsx er central function (getBatchCostPerPcs) theke ashbe
        Promise.all([
            fetch(`http://localhost:5000/bulk-return-stock${editId ? `?excludeDamageId=${editId}` : ''}`).then((r) => r.json()),
            fetch('http://localhost:5000/stock-purchase').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/purchase').then((r) => r.json()).catch(() => []),
        ])
            .then(([d, batchList, purchaseList]) => {
                const stock = d && typeof d === 'object' ? d : {};
                const bMap = new Map((Array.isArray(batchList) ? batchList : []).map((b) => [String(b._id), b]));
                const pMap = new Map((Array.isArray(purchaseList) ? purchaseList : []).map((p) => [String(p._id), p]));
                const fixed = {};
                Object.keys(stock).forEach((k) => {
                    fixed[k] = {
                        ...stock[k],
                        batches: (stock[k].batches || []).map((bt) => {
                            const b = bMap.get(String(bt.batchId));
                            return b ? { ...bt, cost: getBatchCostPerPcs(b, pMap.get(String(b.purchaseId))) } : bt;
                        }),
                    };
                });
                setStockMap(fixed);
            })
            .catch((e) => console.error(e));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Edit prefill ----------
    useEffect(() => {
        if (editingDamage) {
            setItems((editingDamage.items || []).map(restoreItem));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Customer ----------
    const filteredCustomers = customers.filter((c) =>
        matchesSearch(search.customer, [c.businessName, c.contactNumber, c.address, c.route])
    );

    // Customer change/select/clear hole full page reset (items, note, company, category, product search)
    const resetPageData = () => {
        setItems([]);
        setNote('');
        setFormData((p) => ({ ...p, company: '', category: '', collectedById: '', collectedBy: '' }));
        setPaymentOpen(false);
        setPaymentAmountTouched(false);
        setSearch((p) => ({ ...p, company: '', category: '', collectedBy: '', product: '' }));
    };

    // ---------- Collected By (Delivery Man, optional, customer select korle enable) ----------
    const filteredDeliveryMen = deliveryMen
        .filter((u) => u.role === 'Delivery Man' && u.isActive === true)
        .filter((u) => matchesSearch(search.collectedBy, [u.name, u.phone]));

    const handleSelectCollectedBy = (u) => {
        updateForm({ collectedById: u._id, collectedBy: u.name });
        updateSearch('collectedBy', u.name);
    };

    const handleClearCollectedBy = () => {
        updateSearch('collectedBy', '');
        updateForm({ collectedById: '', collectedBy: '' });
    };

    const handleSelectCustomer = (c) => {
        if (String(formData.customerId) !== String(c._id) && (formData.customerId || items.length > 0)) resetPageData();
        updateForm({
            customerId: c._id,
            customer: c.businessName,
            customerContact: c.contactNumber || '',
            customerAddress: c.address || '',
        });
        updateSearch('customer', c.businessName);
    };

    const handleClearCustomer = () => {
        resetPageData();
        updateSearch('customer', '');
        updateForm({ customerId: '', customer: '', customerContact: '', customerAddress: '' });
    };

    // ---------- Company (optional) ----------
    const filteredCompanies = companies.filter((c) =>
        matchesSearch(search.company, [c.businessName, c.contactNumber, c.address])
    );

    const handleSelectCompany = (c) => {
        updateForm({ company: c.businessName });
        updateSearch('company', c.businessName);
        updateSearch('product', '');
    };

    const handleClearCompany = () => {
        updateForm({ company: '' });
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
    const filteredProducts = products.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (formData.company && prod.company !== formData.company) return false;
        if (formData.category && prod.category !== formData.category) return false;
        if (items.some((i) => i._id === prod._id || i.productName === prod.productName)) return false;
        return matchesSearch(search.product, [prod.productName, prod.sku]);
    });

    const handleSelectProduct = (product) => {
        setItems((prev) => [...prev, buildItem(product)]);
        updateSearch('product', '');
    };

    const handleRemoveItem = (uniqueId) =>
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));

    const getStock = (item) =>
        stockMap
            ? stockMap[String(item._id)] || stockMap[`name:${item.productName}`] || { paid: 0, free: 0 }
            : null;

    const handleItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        const item = items.find((i) => i.uniqueId === uniqueId);
        if (!item) return;
        const next = applyItemChange(item, field, value);

        if (
            !formData.customerId &&
            ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)
        ) {
            const stock = getStock(item);
            if (stock) {
                if (Number(next.totalQty) > stock.paid) {
                    return showToast(`Main stock e matro ${stock.paid} pcs ache!`, true);
                }
                if (Number(next.freeQty) > stock.free) {
                    return showToast(`Free stock e matro ${stock.free} pcs ache!`, true);
                }
            }
        }

        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? next : i)));
    };

    // ---------- Totals ----------
    const isStockMode = !formData.customerId;
    const getItemBreakdown = (item) => getCostBreakdown(getStock(item), item.totalQty);
    const getItemAmount = (item) =>
        isStockMode
            ? roundTo2(getItemBreakdown(item).reduce((s, l) => s + l.amount, 0))
            : roundTo2(getRowGross(item));
    const subTotal = roundTo2(items.reduce((t, i) => t + getItemAmount(i), 0));
    const damageAmount = subTotal;

    useEffect(() => {
        if (!paymentAmountTouched) setPaymentAmount(roundTo2(damageAmount));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [damageAmount, paymentAmountTouched]);
    const uniqueUnits = [...new Set(items.map((i) => i.unit || 'Pcs'))];
    const sellPriceUnitLabel = uniqueUnits.length === 1 ? uniqueUnits[0] : 'Unit';

    // Credit Limit check: damage payment dile customer er Get amount creditLimit er beshi hobe kina
    const checkCreditLimit = async (paidNow) => {
        try {
            const n = (v) => Number(v) || 0;
            const r2 = (v) => Math.round((Number(v) || 0) * 100) / 100;
            const name = String(formData.customer || '').trim().toLowerCase();
            const same = (a) => String(a || '').trim().toLowerCase() === name;
            const itemAmt = (it) =>
                Number(it.itemTotal ?? it.subtotal ?? (n(it.sellPricePcs ?? it.sellPrice) * n(it.totalQty))) || 0;
            const sumItems = (list) => (list || []).reduce((s, it) => s + itemAmt(it), 0);
            const safe = (url) =>
                fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

            const [sales, bulks, damages, custList, duePays] = await Promise.all([
                safe('http://localhost:5000/sales'),
                safe('http://localhost:5000/sales-bulk-return'),
                safe('http://localhost:5000/sales-damage'),
                safe('http://localhost:5000/customer'),
                safe('http://localhost:5000/sales-due-payment'),
            ]);

            const info =
                custList.find((c) => String(c._id) === String(formData.customerId)) ||
                custList.find((c) => String(c.businessName || '').trim().toLowerCase() === name);
            const limitRaw = info?.creditLimit;
            if (limitRaw === undefined || limitRaw === null || String(limitRaw).trim() === '') return true;
            const limit = Number(limitRaw);
            if (isNaN(limit)) return true;

            let pay = 0;
            let get = 0;

            // Opening balance
            const openAmt = r2(n(info?.openingBalance));
            const openType = String(info?.openingBalanceType || '').trim().toLowerCase();
            if (openAmt > 0 && (openType === 'pay' || openType === 'advance')) pay += openAmt;
            if (openAmt > 0 && (openType === 'due' || openType === 'get')) get += openAmt;

            // Sales payments
            sales.forEach((s) => {
                if (!same(s.customer)) return;
                if (s.paidAmount === undefined || s.paidAmount === null || s.paidAmount === '' || !s.paymentMethod) return;
                const prev = n(s.previousBalanceAmount);
                const payable =
                    n(s.payableAmount) -
                    (s.previousBalanceType === 'Due' ? prev : 0) +
                    (s.previousBalanceType === 'Get' ? prev : 0);
                const paid = n(s.paidAmount);
                const isDel = s.status === 'Delivered';
                const balDue = payable < 0
                    ? Math.max(r2(paid + payable), 0)
                    : !isDel ? 0 : Math.max(r2(payable - paid), 0);
                const balExtra = payable < 0
                    ? Math.max(r2(-payable - paid), 0)
                    : !isDel ? paid : Math.max(r2(paid - payable), 0);
                pay += balExtra;
                get += balDue;
            });

            // Sales return
            sales.forEach((s) => {
                if (!same(s.customer)) return;
                (s.returnHistory || []).forEach((ret) => {
                    const amt = n(ret.totalReturnAmount);
                    const rec = ret.payment ? n(ret.payment.amount) : 0;
                    pay += Math.max(amt - rec, 0);
                    get += Math.max(rec - amt, 0);
                });
            });

            // Bulk return
            bulks.forEach((b) => {
                if (!same(b.customer)) return;
                const adj =
                    b.fromSales === true
                        ? n(sales.find((s) => String(s._id) === String(b.saleId))?.returnAdjustmentAmount)
                        : 0;
                const rec = adj > 0 ? adj : b.payment ? n(b.payment.amount) : 0;
                const amt = n(b.returnAmount);
                pay += Math.max(amt - rec, 0);
                get += Math.max(rec - amt, 0);
            });

            // Damage (standalone) - edit hole nijer entry bad
            damages.forEach((d) => {
                if (!d.customer || !same(d.customer)) return;
                if (isEditMode && String(d._id) === String(editId)) return;
                const amt = n(d.damageAmount) || n(d.returnAmount) || sumItems(d.items);
                const rec = d.payment ? n(d.payment.amount) : 0;
                pay += Math.max(amt - rec, 0);
                get += Math.max(rec - amt, 0);
            });

            // Damage (from sales)
            sales.forEach((s) => {
                if (!same(s.customer)) return;
                if (s.status !== 'Delivered' || !(s.damageItems || []).length) return;
                const amt = sumItems(s.damageItems);
                const adj = n(s.damageAdjustmentAmount);
                const rec = adj > 0 ? adj : s.damagePayment ? n(s.damagePayment.amount) : 0;
                pay += Math.max(amt - rec, 0);
                get += Math.max(rec - amt, 0);
            });

            // Customer due payment
            duePays.forEach((p) => {
                if (!same(p.customer)) return;
                const amt = r2(n(p.amount));
                const isPay = p.type === 'Pay' || p.status === 'Pay' || p.paymentAccount?.dueType === 'Pay';
                if (isPay) get += amt;
                else pay += amt;
            });

            // Ei damage + payment er effect
            const thisAmt = roundTo2(damageAmount);
            const thisPaid = roundTo2(paidNow);
            pay += Math.max(thisAmt - thisPaid, 0);
            get += Math.max(thisPaid - thisAmt, 0);

            const net = r2(pay - get);
            const finalGet = net < 0 ? -net : 0;

            if (finalGet > limit) {
                showToast(
                    `Credit limit cross hoye jabe! Limit: ৳${limit}, Total Get hobe: ৳${finalGet}. Payment amount kom din.`,
                    true
                );
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking credit limit:', error);
            return true;
        }
    };

    // ---------- Submit ----------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return;
        if (isEditMode ? !canEdit : !canAdd) {
            return showToast(isEditMode ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!', true);
        }

        if (!formData.date) return showToast('Date is required!', true);
        if (items.length === 0) return showToast('Please add at least one product!', true);
        if (items.some((i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0)) {
            return showToast('Each product must have a valid quantity!', true);
        }

        if (!formData.customerId && stockMap) {
            for (const i of items) {
                const st = getStock(i);
                if (st && (Number(i.totalQty) > st.paid || Number(i.freeQty) > st.free)) {
                    return showToast(`${i.productName}: stock e Main ${st.paid}, Free ${st.free} pcs ache!`, true);
                }
            }
        }

        // ---------- Payment validation (shudhu customer thakle + Payment open thakle) ----------
        let paymentData = null;
        if (formData.customerId && paymentOpen) {
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
            if (!(await checkCreditLimit(paymentAmount))) return;

            // Account e tk ache kina check (edit hole nijer ager payment bad)
            const sameAcc = (a, b) =>
                `${a?.accountName || a?.bankName || 'Cash'}||${a?.accountNumber || ''}||${a?.accountBranch || ''}` ===
                `${b?.accountName || b?.bankName || 'Cash'}||${b?.accountNumber || ''}||${b?.accountBranch || ''}`;
            let available = await fetchAccountBalance(accInfo);
            const oldPay = editingDamage?.payment;
            if (isEditMode && oldPay && Number(oldPay.amount) > 0 && sameAcc(oldPay.account, accInfo)) {
                available += Number(oldPay.amount) || 0;
            }
            if (roundTo2(paymentAmount) > available) {
                return showToast(`Insufficient balance in the selected account! Available: ৳${available.toFixed(2)}`, true);
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
            sku: i.sku,
            sellPricePcs: isStockMode ? 0 : roundTo2(i.sellPricePcs),
            sellPriceUnit: isStockMode ? 0 : roundTo2(i.sellPriceUnit),
            sellPriceSub: isStockMode ? 0 : roundTo2(i.sellPriceSub),
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
            itemTotal: getItemAmount(i),
            costBreakdown: isStockMode ? getItemBreakdown(i) : [],
        }));

        const payload = {
            invoiceNo: isEditMode ? editingDamage.invoiceNo : generateInvoiceNo(),
            customerId: formData.customerId,
            customer: formData.customer,
            phone: formData.customerContact,
            address: formData.customerAddress,
            company: formData.company,
            category: formData.category,
            damageDate: formData.date,
            collectedById: formData.customerId ? (formData.collectedById || '') : '',
            collectedBy: formData.customerId ? (formData.collectedBy || '') : '',
            payment: paymentData,
            items: itemsPayload,
            damageAmount,
            note,
        };

        try {
            setIsSaving(true);
            const url = isEditMode
                ? `http://localhost:5000/sales-damage/${editId}`
                : 'http://localhost:5000/sales-damage';
            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                if (err.shortages?.length) {
                    setIsSaving(false);
                    return showToast(
                        `Stock nai: ${err.shortages.map((s) => `${s.productName} (stock ${s.available})`).join(', ')}`,
                        true
                    );
                }
                throw new Error('Failed');
            }
            await res.json();
            showToast(isEditMode ? 'Damage updated successfully!' : 'Damage added successfully!');
            setTimeout(() => navigate('/damage-stock-invoice', { replace: true }), 1000);
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save damage. Try again.', true);
        }
    };

    const num = (id, field) => (v) => /^\d*$/.test(v) && handleItemChange(id, field, v);

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-4">
                {/* Top form */}
                <div className="relative z-20">
                    <Card
                        title={isEditMode ? 'Edit Damage' : 'Add Damage'}
                        subtitle="Select customer and damaged products"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <Combo
                                label="Customer"
                                placeholder="Search or select customer (optional)..."
                                value={search.customer}
                                options={filteredCustomers.map((c) => ({
                                    key: c._id,
                                    title: c.businessName,
                                    sub: `📞 ${c.contactNumber || ''} | 📍 ${c.address || ''}`,
                                    raw: c,
                                }))}
                                onType={(text) => {
                                    if (formData.customerId) {
                                        resetPageData();
                                        updateForm({ customerId: '', customer: '', customerContact: '', customerAddress: '' });
                                    }
                                    updateSearch('customer', text);
                                }}
                                onClear={handleClearCustomer}
                                onPick={(o) => handleSelectCustomer(o.raw)}
                            />

                            <Combo
                                label="Filter by Company"
                                placeholder="Search or select company (optional)..."
                                value={search.company}
                                options={filteredCompanies.map((c) => ({
                                    key: c._id,
                                    title: c.businessName,
                                    sub: `📞 ${c.contactNumber || ''} | 📍 ${c.address || ''}`,
                                    raw: c,
                                }))}
                                onType={(text) => {
                                    updateSearch('company', text);
                                    updateForm({ company: '' });
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

                            <Combo
                                label="Collected By"
                                hint={!formData.customerId ? '(Select customer first)' : '(Optional)'}
                                disabled={!formData.customerId}
                                placeholder={formData.customerId ? 'Search or select delivery man...' : 'Select a customer first...'}
                                value={search.collectedBy}
                                options={filteredDeliveryMen.map((u) => ({
                                    key: u._id,
                                    title: u.name,
                                    sub: u.phone ? `📞 ${u.phone}` : '',
                                    raw: u,
                                }))}
                                onType={(text) => {
                                    updateSearch('collectedBy', text);
                                    updateForm({ collectedById: '', collectedBy: '' });
                                }}
                                onClear={handleClearCollectedBy}
                                onPick={(o) => handleSelectCollectedBy(o.raw)}
                            />
                        </div>

                        <div className="mt-4">
                            <ComboField
                                label={`Select Product *${formData.company || formData.category ? `  (Filtered by ${[formData.company, formData.category].filter(Boolean).join(' • ')})` : ''}`}
                                placeholder="Search or select product..."
                                value={search.product}
                                options={filteredProducts.map((p) => ({
                                    key: p._id,
                                    title: p.productName,
                                    sub: `Company: ${p.company}${p.category ? ` | Category: ${p.category}` : ''}${p.sellingPrice ? ` | ৳${p.sellingPrice}` : ''}${p.sku ? ` | SKU: ${p.sku}` : ''}`,
                                    raw: p,
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
                            No products added yet. Please select a product above.
                        </div>
                    ) : (
                        items.map((item) => {
                            const rowGross = getItemAmount(item);
                            const breakdown = isStockMode ? getItemBreakdown(item) : [];
                            const st = getStock(item);
                            const unitLabel = item.unit || 'Pcs';
                            const id = item.uniqueId;
                            return (
                                <div key={id} className="bg-white rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                                            <p className="text-xs text-slate-500">{item.company}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[11px] text-slate-400">{isStockMode ? 'Cost Total' : 'Item Total'}</p>
                                                <p className="font-bold text-emerald-700">{rowGross.toFixed(2)}</p>
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
                                            <p className="text-xs font-bold text-brand-700 mb-2">
                                                Main · Total {item.totalQty}
                                                {isStockMode && <span className="ml-1 text-slate-500 font-semibold">· Stock {st ? st.paid : '...'}</span>}
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <QtyField label={unitLabel} value={item.unitQty} onChange={num(id, 'unitQty')} />
                                                {item.parentMode && <QtyField label={item.subUnit || 'Sub'} value={item.subQty ?? ''} onChange={num(id, 'subQty')} />}
                                                <QtyField label="Pcs" value={item.pcsQty} onChange={num(id, 'pcsQty')} />
                                            </div>
                                        </div>

                                        {/* Free */}
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                                            <p className="text-xs font-bold text-emerald-700 mb-2">
                                                Free · Total {item.freeQty}
                                                {isStockMode && <span className="ml-1 text-slate-500 font-semibold">· Stock {st ? st.free : '...'}</span>}
                                            </p>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                <QtyField label={unitLabel} value={item.freeUnitQty} onChange={num(id, 'freeUnitQty')} />
                                                {item.parentMode && <QtyField label={item.subUnit || 'Sub'} value={item.freeSubQty ?? ''} onChange={num(id, 'freeSubQty')} />}
                                                <QtyField label="Pcs" value={item.freePcsQty} onChange={num(id, 'freePcsQty')} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sell price (customer mode) */}
                                    {!isStockMode && (
                                        <div className={`mt-3 grid grid-cols-1 ${item.parentMode ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-3`}>
                                            <PriceField
                                                label={`Sell Price (${unitLabel})`}
                                                total={getUnitTotal(item)}
                                                tone="bg-brand-100 text-brand-700"
                                                value={item.sellPriceUnit}
                                                disabled={!(Number(item.unitQty) > 0)}
                                                onChange={(v) => handleItemChange(id, 'sellPriceUnit', v)}
                                            />
                                            {item.parentMode && (
                                                <PriceField
                                                    label={`Sell Price (${item.subUnit || 'Sub'})`}
                                                    total={getSubTotal(item)}
                                                    tone="bg-violet-100 text-violet-700"
                                                    value={item.sellPriceSub}
                                                    disabled={!(Number(item.subQty) > 0)}
                                                    onChange={(v) => handleItemChange(id, 'sellPriceSub', v)}
                                                />
                                            )}
                                            <PriceField
                                                label="Sell Price (PCS)"
                                                total={getPcsTotal(item)}
                                                tone="bg-emerald-100 text-emerald-700"
                                                value={item.sellPricePcs}
                                                disabled={!(Number(item.pcsQty) > 0)}
                                                onChange={(v) => handleItemChange(id, 'sellPricePcs', v)}
                                            />
                                        </div>
                                    )}

                                    {/* Cost breakdown (stock mode) */}
                                    {breakdown.length > 0 && (
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px]">
                                            <span className="font-bold text-slate-500 uppercase text-[10px]">Stock source:</span>
                                            {breakdown.map((l) => (
                                                <span key={l.batchNo} className="px-2 py-0.5 rounded-md border border-brand-100 bg-brand-50 text-brand-700 font-semibold whitespace-nowrap">
                                                    #{l.invoiceNo}: {l.qty} × ৳{l.cost}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {/* Summary */}
                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-rose-700">Damage Amount</span>
                            <span className="text-xl font-bold text-rose-600">৳{damageAmount.toFixed(2)}</span>
                        </div>
                    </Card>

                    {/* Damage Payment (shudhu customer select thakle, optional) */}
                    {formData.customerId && (
                        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h3 className="text-base font-bold text-emerald-800">Damage Payment</h3>
                                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                                        Damage Amount: ৳{damageAmount.toFixed(2)}
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
                                        <label className={labelCls}>
                                            Payment Amount *
                                            {accAvailable !== null && (
                                                <span className={`ml-2 font-semibold ${accAvailable < (Number(paymentAmount) || 0) ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                    Available: ৳{accAvailable.toFixed(2)}
                                                </span>
                                            )}
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={paymentAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    if (accAvailable !== null && Number(value) > accAvailable) {
                                                        showToast(`Insufficient balance in the selected account! Available: ৳${accAvailable.toFixed(2)}`, true);
                                                        return;
                                                    }
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
                    )}

                    {/* Note */}
                    <Card>
                        <label className={labelCls}>Damage Note</label>
                        <textarea
                            rows="3"
                            placeholder="Write any note about this damage..."
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
                            {isSaving ? 'Saving...' : isEditMode ? 'Update Damage' : 'Add Damage'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DamageStockAdd;