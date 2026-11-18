import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchAccountBalance } from '../../Software/Account/AccountBalance';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
import { inputCls, labelCls, ComboField } from '../Purchase/PurchaseUi';
import { Card, QtyField, PaymentSection } from '../Purchase/PurchaseFormUi';
import { labelToISO } from '../Purchase/purchaseDate';

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

const priceOk = (v) => /^\d*\.?\d{0,2}$/.test(v);

// ---------- Small price field ----------
const PriceField = ({ label, value, onChange, disabled, hint, tone = 'slate' }) => {
    const tones = {
        slate: 'text-slate-500',
        brand: 'text-brand-700',
        fuchsia: 'text-fuchsia-700',
        teal: 'text-teal-700',
    };
    return (
        <label className="block min-w-0">
            <span className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500 mb-1">
                <span className="truncate">{label}</span>
                <span className={`font-bold shrink-0 ${tones[tone]}`}>{hint}</span>
            </span>
            <input
                type="text"
                inputMode="decimal"
                placeholder="0"
                disabled={disabled}
                value={value ?? ''}
                onChange={(e) => priceOk(e.target.value) && onChange(e.target.value)}
                className={inputCls}
            />
        </label>
    );
};

const SalesBulkReturnForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingReturn = location.state?.bulkReturn || null;
    const isEditMode = !!editingReturn;
    const editId = editingReturn?._id || null;
    const can = useCan('sales_bulk_return');

    const [formData, setFormData] = useState({
        customerId: editingReturn?.customerId || '',
        customer: editingReturn?.customer || '',
        customerContact: editingReturn?.phone || '',
        customerAddress: editingReturn?.address || '',
        company: editingReturn?.company || '',
        category: editingReturn?.category || '',
        date: editingReturn?.returnDate || getFormattedToday(),
        collectedById: editingReturn?.collectedById || '',
        collectedBy: editingReturn?.collectedBy || '',
    });

    const [deliveryMen, setDeliveryMen] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [stockBatches, setStockBatches] = useState([]);

    const [search, setSearch] = useState({
        customer: editingReturn?.customer || '',
        company: editingReturn?.company || '',
        category: editingReturn?.category || '',
        collectedBy: editingReturn?.collectedBy || '',
        product: '',
    });
    const updateSearch = (key, value) => setSearch((p) => ({ ...p, [key]: value }));
    const updateForm = (fields) => setFormData((p) => ({ ...p, ...fields }));

    const [items, setItems] = useState([]);
    const [note, setNote] = useState(editingReturn?.note || '');
    const [isSaving, setIsSaving] = useState(false);

    // ---------------- Payment (optional, default collapsed) ----------------
    const savedPay = editingReturn?.payment || null;
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

    const showToast = (message, isError = false) => {
        isError ? toast.error(message) : toast.success(message);
    };

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
        load('stock-purchase', setStockBatches);
        load('investment', setInvestments);
        load('user', setDeliveryMen);
    }, []);

    // ---------- Edit prefill ----------
    useEffect(() => {
        if (editingReturn) {
            setItems((editingReturn.items || []).map(restoreItem));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Customer ----------
    const filteredCustomers = customers.filter((c) =>
        matchesSearch(search.customer, [c.businessName, c.contactNumber, c.address, c.route])
    );

    const handleSelectCustomer = (c) => {
        updateForm({
            customerId: c._id,
            customer: c.businessName,
            customerContact: c.contactNumber || '',
            customerAddress: c.address || '',
        });
        updateSearch('customer', c.businessName);
    };

    const handleClearCustomer = () => {
        updateSearch('customer', '');
        updateForm({ customerId: '', customer: '', customerContact: '', customerAddress: '' });
        setItems([]);
    };

    // ---------- Collected By ----------
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

    // ---------- Company ----------
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
    const isProductEnabled = !!formData.customerId && !!formData.date;

    const filteredProducts = products.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (formData.company && prod.company !== formData.company) return false;
        if (formData.category && prod.category !== formData.category) return false;
        if (items.some((i) => i._id === prod._id || i.productName === prod.productName)) return false;
        return matchesSearch(search.product, [prod.productName, prod.sku]);
    });

    const hasStockInvoice = (prod) =>
        stockBatches.some(
            (b) => String(b.productId) === String(prod._id) || (b.productName && b.productName === prod.productName)
        );

    const handleSelectProduct = (product) => {
        if (!hasStockInvoice(product)) {
            showToast('এই product stock এ নেই!', true);
            return;
        }
        setItems((prev) => [...prev, buildItem(product)]);
        updateSearch('product', '');
    };

    const handleRemoveItem = (uniqueId) =>
        setItems((prev) => prev.filter((i) => i.uniqueId !== uniqueId));

    const handleItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        setItems((prev) => prev.map((i) => (i.uniqueId === uniqueId ? applyItemChange(i, field, value) : i)));
    };

    // ---------- Totals ----------
    const subTotal = roundTo2(items.reduce((t, i) => t + getRowGross(i), 0));
    const returnAmount = subTotal;

    // ---------- Payment helpers ----------
    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        if (inv.accountType === 'Mobile Banking') return `${inv.accountName}-${inv.accountNumber}`;
        return 'cash';
    };

    const uniqueAccountsMap = new Map();
    investments
        .filter((inv) => inv.accountType === paymentAccountType)
        .forEach((inv) => {
            const key = getAccountKey(inv);
            if (!uniqueAccountsMap.has(key)) uniqueAccountsMap.set(key, inv);
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());
    const selectedAccountInfo = uniqueAccounts.find((inv) => getAccountKey(inv) === selectedAccountKey);

    // User nijer hate change na korle Payment Amount = Return Amount auto sync
    useEffect(() => {
        if (!paymentAmountTouched) {
            setPaymentAmount(roundTo2(returnAmount));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [returnAmount, paymentAmountTouched]);

    // Selected account e ekhon koto tk ache (live, 5 sec por por refresh)
    useEffect(() => {
        if (!paymentOpen || !selectedAccountInfo) {
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
                const oldPay = editingReturn?.payment;
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
    }, [paymentOpen, selectedAccountKey, paymentAccountType, investments]);

    const handlePaymentAmount = (v) => {
        if (accAvailable !== null && Number(v) > accAvailable) {
            showToast(`Insufficient balance in the selected account! Available: ৳${accAvailable.toFixed(2)}`, true);
            return;
        }
        setPaymentAmount(v);
    };

    // ---------- Credit limit ----------
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

            // Bulk return (edit hole nijer entry bad)
            bulks.forEach((b) => {
                if (!same(b.customer)) return;
                if (isEditMode && String(b._id) === String(editId)) return;
                const adj =
                    b.fromSales === true
                        ? n(sales.find((s) => String(s._id) === String(b.saleId))?.returnAdjustmentAmount)
                        : 0;
                const rec = adj > 0 ? adj : b.payment ? n(b.payment.amount) : 0;
                const amt = n(b.returnAmount);
                pay += Math.max(amt - rec, 0);
                get += Math.max(rec - amt, 0);
            });

            // Damage (standalone)
            damages.forEach((d) => {
                if (!d.customer || !same(d.customer)) return;
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

            // Ei bulk return + payment er effect
            const thisAmt = roundTo2(returnAmount);
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
    const submitLock = useRef(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitLock.current) return;
        submitLock.current = true;
        setIsSaving(true);
        let done = false;
        try {
            done = (await handleSubmitInner()) === true;
        } finally {
            if (!done) {
                submitLock.current = false;
                setIsSaving(false);
            }
        }
    };

    const handleSubmitInner = async () => {
        if (isEditMode ? !can.canEdit : !can.canAdd) {
            return showToast(isEditMode ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!', true);
        }

        if (!formData.customerId) return showToast('Customer is required!', true);
        if (!formData.date) return showToast('Date is required!', true);
        if (items.length === 0) return showToast('Please add at least one product!', true);
        if (items.some((i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0)) {
            return showToast('Each product must have a valid quantity!', true);
        }

        // ---------- Payment validation ----------
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
            if (!(await checkCreditLimit(paymentAmount))) return;

            const sameAcc = (a, b) =>
                `${a?.accountName || a?.bankName || 'Cash'}||${a?.accountNumber || ''}||${a?.accountBranch || ''}` ===
                `${b?.accountName || b?.bankName || 'Cash'}||${b?.accountNumber || ''}||${b?.accountBranch || ''}`;
            let available = await fetchAccountBalance(accInfo);
            const oldPay = editingReturn?.payment;
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
            sellPricePcs: roundTo2(i.sellPricePcs),
            sellPriceUnit: roundTo2(i.sellPriceUnit),
            sellPriceSub: roundTo2(i.sellPriceSub),
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
            itemTotal: roundTo2(getRowGross(i)),
        }));

        const payload = {
            invoiceNo: isEditMode ? editingReturn.invoiceNo : generateInvoiceNo(),
            customerId: formData.customerId,
            customer: formData.customer,
            phone: formData.customerContact,
            address: formData.customerAddress,
            company: formData.company,
            category: formData.category,
            returnDate: formData.date,
            collectedById: formData.collectedById || '',
            collectedBy: formData.collectedBy || '',
            items: itemsPayload,
            returnAmount,
            note,
            payment: paymentData,
        };

        try {
            setIsSaving(true);
            const url = isEditMode
                ? `http://localhost:5000/sales-bulk-return/${editId}`
                : 'http://localhost:5000/sales-bulk-return';
            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error('Failed');
            await res.json();
            showToast(isEditMode ? 'Bulk return updated successfully!' : 'Bulk return added successfully!');
            setTimeout(() => navigate('/sales-bulk-return', { replace: true, state: null }), 1000);
            return true;
        } catch (error) {
            console.error(error);
            setIsSaving(false);
            showToast('Failed to save bulk return. Try again.', true);
        }
    };

    const stockHint = (p) => (hasStockInvoice(p) ? '' : ' | ❌ Stock এ নেই');

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-4">
                {/* ---------------- Top form ---------------- */}
                <div className="relative z-20">
                    <Card
                        title={isEditMode ? 'Edit Sales Bulk Return' : 'Sales Bulk Return'}
                        subtitle="Select customer and products to return in bulk"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {isEditMode ? (
                                <div>
                                    <span className={labelCls}>Customer *</span>
                                    <input readOnly disabled value={search.customer} className={inputCls} />
                                </div>
                            ) : (
                                <ComboField
                                    label="Customer *"
                                    value={search.customer}
                                    placeholder="Search or select customer..."
                                    options={filteredCustomers.map((c) => ({
                                        key: c._id,
                                        title: c.businessName,
                                        sub: `📞 ${c.contactNumber || ''} | 📍 ${c.address || ''}`,
                                        raw: c,
                                    }))}
                                    onType={(v) => {
                                        updateSearch('customer', v);
                                        if (formData.customerId) {
                                            updateForm({ customerId: '', customer: '', customerContact: '', customerAddress: '' });
                                        }
                                    }}
                                    onClear={handleClearCustomer}
                                    onPick={(o) => handleSelectCustomer(o.raw)}
                                />
                            )}

                            <ComboField
                                label="Company"
                                value={search.company}
                                placeholder="Search or select company (optional)..."
                                options={filteredCompanies.map((c) => ({
                                    key: c._id,
                                    title: c.businessName,
                                    sub: `📞 ${c.contactNumber || ''} | 📍 ${c.address || ''}`,
                                    raw: c,
                                }))}
                                onType={(v) => {
                                    updateSearch('company', v);
                                    updateForm({ company: '' });
                                }}
                                onClear={handleClearCompany}
                                onPick={(o) => handleSelectCompany(o.raw)}
                            />

                            <div>
                                <span className={labelCls}>Date *</span>
                                <DateInput name="date" value={labelToISO(formData.date)} onChange={handleDateChange} placeholder="Select date" />
                            </div>

                            <ComboField
                                label="Collected By (Optional)"
                                value={search.collectedBy}
                                placeholder="Search or select delivery man..."
                                options={filteredDeliveryMen.map((u) => ({
                                    key: u._id,
                                    title: u.name,
                                    sub: u.phone ? `📞 ${u.phone}` : '',
                                    raw: u,
                                }))}
                                onType={(v) => {
                                    updateSearch('collectedBy', v);
                                    updateForm({ collectedById: '', collectedBy: '' });
                                }}
                                onClear={handleClearCollectedBy}
                                onPick={(o) => handleSelectCollectedBy(o.raw)}
                            />

                            <ComboField
                                label="Filter by Category"
                                value={search.category}
                                placeholder="Search or select category..."
                                options={filteredCategories.map((c) => ({ key: c._id, title: c.name, raw: c }))}
                                onType={(v) => {
                                    updateSearch('category', v);
                                    updateForm({ category: '' });
                                }}
                                onClear={handleClearCategory}
                                onPick={(o) => handleSelectCategory(o.raw)}
                            />
                        </div>

                        <div className="mt-4">
                            {isProductEnabled ? (
                                <ComboField
                                    label={`Select Product *${formData.company || formData.category ? `  (Filtered by ${[formData.company, formData.category].filter(Boolean).join(' • ')})` : ''}`}
                                    value={search.product}
                                    placeholder="Search or select product..."
                                    options={filteredProducts.map((p) => ({
                                        key: p._id,
                                        title: p.productName,
                                        sub: `Company: ${p.company}${p.category ? ` | Category: ${p.category}` : ''}${p.sellingPrice ? ` | ৳${p.sellingPrice}` : ''}${p.sku ? ` | SKU: ${p.sku}` : ''}${stockHint(p)}`,
                                        raw: p,
                                    }))}
                                    onType={(v) => updateSearch('product', v)}
                                    onClear={() => updateSearch('product', '')}
                                    onPick={(o) => handleSelectProduct(o.raw)}
                                />
                            ) : (
                                <div>
                                    <span className={labelCls}>Select Product *</span>
                                    <input disabled placeholder="Select a customer first..." className={inputCls} />
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* ---------------- Items ---------------- */}
                    {items.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-400">
                            No products added yet. Please select a customer and product above.
                        </div>
                    ) : (
                        items.map((item) => {
                            const rowGross = getRowGross(item);
                            const unitLabel = item.unit || 'Pcs';
                            const num = (field) => (v) => /^\d*$/.test(v) && handleItemChange(item.uniqueId, field, v);
                            const price = (field) => (v) => handleItemChange(item.uniqueId, field, v);
                            const qtyCols = item.parentMode ? 'grid-cols-3' : 'grid-cols-2';
                            return (
                                <div key={item.uniqueId} className="bg-white rounded-2xl border border-slate-200 p-4">
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="min-w-0">
                                            <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {item.company}{item.sku ? ` · SKU: ${item.sku}` : ''}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <div className="text-right">
                                                <p className="text-[11px] text-slate-400">Item Total</p>
                                                <p className="font-bold text-emerald-700">৳{rowGross.toFixed(2)}</p>
                                            </div>
                                            <button
                                                type="button"
                                                aria-label="Remove product"
                                                onClick={() => handleRemoveItem(item.uniqueId)}
                                                className="w-10 h-10 flex items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                                        {/* Main qty */}
                                        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-bold text-brand-700">Return Qty</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${Number(item.totalQty) > 0 ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
                                                    Total: {item.totalQty} pcs
                                                </span>
                                            </div>
                                            <div className={`grid ${qtyCols} gap-2`}>
                                                <QtyField label={unitLabel} value={item.unitQty} onChange={num('unitQty')} />
                                                {item.parentMode && (
                                                    <QtyField label={item.subUnit || 'Sub'} value={item.subQty ?? ''} onChange={num('subQty')} />
                                                )}
                                                <QtyField label="Pcs" value={item.pcsQty} onChange={num('pcsQty')} />
                                            </div>
                                        </div>

                                        {/* Free qty */}
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-bold text-emerald-700">Free Qty</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                                                    Total: {item.freeQty} pcs
                                                </span>
                                            </div>
                                            <div className={`grid ${qtyCols} gap-2`}>
                                                <QtyField label={unitLabel} value={item.freeUnitQty} onChange={num('freeUnitQty')} />
                                                {item.parentMode && (
                                                    <QtyField label={item.subUnit || 'Sub'} value={item.freeSubQty ?? ''} onChange={num('freeSubQty')} />
                                                )}
                                                <QtyField label="Pcs" value={item.freePcsQty} onChange={num('freePcsQty')} />
                                            </div>
                                        </div>

                                        {/* Prices */}
                                        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-bold text-slate-700">Sell Price</span>
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white border border-slate-200 text-emerald-700">
                                                    ৳{rowGross.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className={`grid ${item.parentMode ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                                                <PriceField
                                                    label={unitLabel}
                                                    tone="brand"
                                                    hint={`৳${getUnitTotal(item).toFixed(2)}`}
                                                    value={item.sellPriceUnit}
                                                    disabled={!(Number(item.unitQty) > 0)}
                                                    onChange={price('sellPriceUnit')}
                                                />
                                                {item.parentMode && (
                                                    <PriceField
                                                        label={item.subUnit || 'Sub'}
                                                        tone="fuchsia"
                                                        hint={`৳${getSubTotal(item).toFixed(2)}`}
                                                        value={item.sellPriceSub}
                                                        disabled={!(Number(item.subQty) > 0)}
                                                        onChange={price('sellPriceSub')}
                                                    />
                                                )}
                                                <PriceField
                                                    label="Pcs"
                                                    tone="teal"
                                                    hint={`৳${getPcsTotal(item).toFixed(2)}`}
                                                    value={item.sellPricePcs}
                                                    disabled={!(Number(item.pcsQty) > 0)}
                                                    onChange={price('sellPricePcs')}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}

                    {/* ---------------- Return amount ---------------- */}
                    <Card>
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-sm font-bold text-slate-700">Return Amount</span>
                            <span className="text-xl font-bold text-emerald-700">৳{returnAmount.toFixed(2)}</span>
                        </div>
                    </Card>

                    {/* ---------------- Payment ---------------- */}
                    <div>
                        <PaymentSection
                            returnAmount={returnAmount}
                            open={paymentOpen}
                            setOpen={setPaymentOpen}
                            amount={paymentAmount}
                            setAmount={handlePaymentAmount}
                            setTouched={setPaymentAmountTouched}
                            accountType={paymentAccountType}
                            setAccountType={setPaymentAccountType}
                            accountKey={selectedAccountKey}
                            setAccountKey={setSelectedAccountKey}
                            note={paymentNote}
                            setNote={setPaymentNote}
                            investments={investments}
                        />
                        {paymentOpen && accAvailable !== null && (
                            <p
                                className={`mt-2 px-1 text-xs font-semibold ${accAvailable < (Number(paymentAmount) || 0) ? 'text-rose-600' : 'text-emerald-600'}`}
                            >
                                Available: ৳{accAvailable.toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* ---------------- Note ---------------- */}
                    <Card>
                        <label className={labelCls}>Return Note</label>
                        <textarea
                            rows="3"
                            placeholder="Write any note about this return..."
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
                            {isSaving ? 'Saving...' : isEditMode ? 'Update Bulk Return' : 'Bulk Return'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SalesBulkReturnForm;