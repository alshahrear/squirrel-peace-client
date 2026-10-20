import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PurchaseForm from "./PurchaseForm";
import useDraftState, { clearDraft } from '../../../../hooks/useDraftState';

const matchesSearch = (text, fields) => {
    const q = (text || '').toString().trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => (f || '').toString().toLowerCase().includes(q));
};

const SearchSelect = ({ label, placeholder, searchValue, onSearchChange, onClear, onSelect, items, getKey, emptyText, renderItem }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <label className="block text-sm font-semibold text-slate-700 mb-2">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={searchValue}
                    placeholder={placeholder}
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        onSearchChange(e.target.value);
                        setOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    className="w-full px-4 py-3.5 pr-10 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                />
                {searchValue && (
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onClear();
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-500 text-sm cursor-pointer"
                    >
                        ✕
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-30 mt-1 w-full max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-2xl shadow-lg">
                    {items.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-slate-400">{emptyText}</p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={getKey(item)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onSelect(item);
                                    setOpen(false);
                                }}
                                className="px-4 py-2.5 cursor-pointer hover:bg-emerald-50 border-b border-slate-100 last:border-b-0"
                            >
                                {renderItem(item)}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const PurchaseAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingPurchase = location.state?.purchase || null;
    const isReceiveMode = location.state?.mode === 'receive';
    const isReturnOnly = location.state?.returnOnly === true;
    const isReceivedEdit =
        !!editingPurchase &&
        location.state?.mode !== 'receive' &&
        (editingPurchase.receiveStatus === 'Received' || editingPurchase.receiveStatus === 'Yes');
    const isPurchaseStage = !isReceiveMode && !isReceivedEdit;
    const hasPriorPayment =
        !!editingPurchase &&
        editingPurchase.paidAmount !== undefined &&
        editingPurchase.paidAmount !== null &&
        editingPurchase.paidAmount !== '' &&
        !!editingPurchase.paymentMethod;
    const showPayment = true;
    const [isEditMode] = useState(!!editingPurchase);
    const [editId] = useState(editingPurchase?._id || null);

    // Draft key: নতুন Purchase আর Edit/Receive এর draft আলাদা থাকবে
    const draftPrefix = editingPurchase ? `purchaseEdit:${editingPurchase._id}` : 'purchaseNew';
    const clearPurchaseDrafts = () => {
        ['items', 'overallAmount', 'overallType', 'adjText', 'adjAmount', 'adjType', 'note', 'form', 'companySearch', 'categorySearch', 'freeItems', 'freeFilter', 'freeSearch', 'returnItems', 'returnFilter', 'returnSearch', 'damageItems', 'damageFilter', 'damageSearch']
            .forEach((k) => clearDraft(`${draftPrefix}:${k}`));
    };

    // ---------------- Payment / Receive States ----------------
    const [investments, setInvestments] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState(hasPriorPayment ? editingPurchase.paidAmount : '');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(hasPriorPayment);
    // Purchase-stage edit এ ইউজার নিজে হাতে Payment Amount বদলেছে কিনা
    const [paymentManual, setPaymentManual] = useState(false);
    // Purchase er somoy payment skip kora hoyeche kina
    const [paymentSkipped, setPaymentSkipped] = useState(
        !!editingPurchase && isPurchaseStage && !hasPriorPayment
    ); // ইউজার নিজে হাতে Payment Amount change করেছে কিনা
    const [paymentAccountType, setPaymentAccountType] = useState('');
    const [selectedAccountKey, setSelectedAccountKey] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);

    // Save Payment Method checkbox (database এ save থাকবে)
    const [savePaymentMethod, setSavePaymentMethod] = useState(false);

    useEffect(() => {
        if (isReceivedEdit || hasPriorPayment) return;
        fetch('http://localhost:5000/feature/purchasePaymentMethod')
            .then((res) => res.json())
            .then((data) => {
                if (data?.enabled === true && data?.value?.paymentAccountType && data?.value?.selectedAccountKey) {
                    setPaymentAccountType(data.value.paymentAccountType);
                    setSelectedAccountKey(data.value.selectedAccountKey);
                    setSavePaymentMethod(true);
                }
            })
            .catch(() => { });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const persistPaymentMethod = (checked, method, key) => {
        fetch('http://localhost:5000/feature/purchasePaymentMethod', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enabled: checked,
                value: checked ? { paymentAccountType: method, selectedAccountKey: key } : null,
            }),
        }).catch((error) => console.error('Error saving payment method:', error));
    };

    const handleSavePaymentToggle = (checked) => {
        setSavePaymentMethod(checked);
        persistPaymentMethod(checked, paymentAccountType, selectedAccountKey);
    };

    // সিলেক্ট করা প্রোডাক্টগুলো রাখার স্টেট
    const [purchaseItems, setPurchaseItems] = useDraftState(`${draftPrefix}:items`, []);

    // PurchaseForm থেকে আসা company, phone, address, date, shippingAddress, category
    const [purchaseFormData, setPurchaseFormData] = useState({
        company: '',
        companyContact: '',
        companyAddress: '',
        date: '',
        shippingAddress: '',
        category: '',
    });

    // Purchase সফল হওয়ার পর PurchaseForm রিসেট করার জন্য key
    const [formResetKey, setFormResetKey] = useState(0);

    // Toast notification
    const [toast, setToast] = useState({ show: false, message: '', isError: false });

    // Overall Discount
    const [overallDiscountAmount, setOverallDiscountAmount] = useDraftState(`${draftPrefix}:overallAmount`, 0);
    const [overallDiscountType, setOverallDiscountType] = useDraftState(`${draftPrefix}:overallType`, 'amount'); // 'amount' | 'percent'

    // Adjustment
    const [adjustmentText, setAdjustmentText] = useDraftState(`${draftPrefix}:adjText`, '');
    const [adjustmentAmount, setAdjustmentAmount] = useDraftState(`${draftPrefix}:adjAmount`, 0);
    const [adjustmentType, setAdjustmentType] = useDraftState(`${draftPrefix}:adjType`, '+');

    // Order Note
    const [orderNote, setOrderNote] = useDraftState(`${draftPrefix}:note`, '');

    // ---------------- Others Free Product States ----------------
    const [freeProductOpen, setFreeProductOpen] = useState(false);
    const [freeProductItems, setFreeProductItems] = useDraftState(`${draftPrefix}:freeItems`, []);
    const [freeCategories, setFreeCategories] = useState([]);
    const [freeProducts, setFreeProducts] = useState([]);
    const [freeFilter, setFreeFilter] = useDraftState(`${draftPrefix}:freeFilter`, { category: '' });
    const [freeSearch, setFreeSearch] = useDraftState(`${draftPrefix}:freeSearch`, { category: '', product: '' });

    // ---------------- Damage Product (এখন কোনো কাজ করবে না) ----------------
    // ---------------- Return Product States ----------------
    const [returnProductOpen, setReturnProductOpen] = useState(false);
    const [returnItems, setReturnItems] = useDraftState(`${draftPrefix}:returnItems`, []);
    const [returnFilter, setReturnFilter] = useDraftState(`${draftPrefix}:returnFilter`, { category: '' });
    const [returnSearch, setReturnSearch] = useDraftState(`${draftPrefix}:returnSearch`, { category: '', product: '' });
    const [addReturnToAdjustment, setAddReturnToAdjustment] = useState(false);

    // ---------------- Damage Product States ----------------
    const [damageProductOpen, setDamageProductOpen] = useState(false);
    const [damageItems, setDamageItems] = useDraftState(`${draftPrefix}:damageItems`, []);
    const [damageFilter, setDamageFilter] = useDraftState(`${draftPrefix}:damageFilter`, { category: '' });
    const [damageSearch, setDamageSearch] = useDraftState(`${draftPrefix}:damageSearch`, { category: '', product: '' });
    const [addDamageToAdjustment, setAddDamageToAdjustment] = useState(false);

    const damageKey = (name, company) =>
        `${(name || '').toString().trim().toLowerCase()}|${(company || '').toString().trim().toLowerCase()}`;

    // Damage stock = Sales damage + Standalone damage - Received purchase er damage return
    const [damageStockList, setDamageStockList] = useState(null);
    useEffect(() => {
        Promise.all([
            fetch('http://localhost:5000/sales').then((r) => r.json()),
            fetch('http://localhost:5000/sales-damage').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/purchase').then((r) => r.json()).catch(() => []),
            fetch('http://localhost:5000/damage-return').then((r) => r.json()).catch(() => []),
        ])
            .then(([sales, dmg, purchases, damageReturns]) => {
                const map = new Map();
                const addRow = (it, sign) => {
                    const key = damageKey(it.productName, it.company);
                    if (!map.has(key)) {
                        map.set(key, {
                            key,
                            productName: it.productName || '',
                            company: it.company || '',
                            productId: it.productId,
                            paid: 0,
                            free: 0,
                            pcsPerUnit: 1,
                            parentMode: false,
                            pcsPerSub: 0,
                            unit: '',
                            subUnit: '',
                        });
                    }
                    const g = map.get(key);
                    g.paid += sign * (Number(it.totalQty) || 0);
                    g.free += sign * (Number(it.freeQty) || 0);
                    if (sign > 0) {
                        g.pcsPerUnit = Number(it.pcsPerUnit) || g.pcsPerUnit;
                        g.parentMode = it.parentMode === true;
                        g.pcsPerSub = it.parentMode === true ? Number(it.pcsPerSub) || 0 : 0;
                        g.unit = it.unit || g.unit;
                        g.subUnit = it.subUnit || g.subUnit;
                    }
                };
                (Array.isArray(sales) ? sales : [])
                    .filter((s) => s.status === 'Delivered')
                    .forEach((s) => (s.damageItems || []).forEach((it) => addRow(it, 1)));
                (Array.isArray(dmg) ? dmg : []).forEach((d) => (d.items || []).forEach((it) => addRow(it, 1)));
                (Array.isArray(purchases) ? purchases : []).forEach((p) => {
                    if (editId && String(p._id) === String(editId)) return;
                    if (!(p.receiveStatus === 'Received' || p.receiveStatus === 'Yes')) return;
                    (p.damageItems || []).forEach((it) => addRow(it, -1));
                });
                (Array.isArray(damageReturns) ? damageReturns : []).forEach((d) =>
                    (d.items || []).forEach((it) => addRow(it, -1))
                );
                setDamageStockList(
                    Array.from(map.values()).map((g) => ({ ...g, paid: Math.max(g.paid, 0), free: Math.max(g.free, 0) }))
                );
            })
            .catch((error) => console.error('Error fetching damage stock:', error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Bulk Return stock (main / free)
    const [stockMap, setStockMap] = useState(null);
    useEffect(() => {
        fetch(`http://localhost:5000/bulk-return-stock${location.state?.bulkId ? `?excludeId=${location.state.bulkId}` : ''}`)
            .then((res) => res.json())
            .then((d) => setStockMap(d && typeof d === 'object' ? d : {}))
            .catch((error) => console.error('Error fetching bulk return stock:', error));
    }, []);

    const getStock = (item) =>
        stockMap
            ? stockMap[String(item._id)] || stockMap[`name:${item.productName}`] || { paid: 0, free: 0 }
            : null;

    // --------------------------------------------------
    // PurchaseForm-কে দেওয়ার জন্য stable initialData (re-render এ যেন
    // নতুন object তৈরি না হয়, নাহলে ফর্মের ভ্যালু বারবার রিসেট হয়ে যায়)
    // --------------------------------------------------
    const initialFormData = useMemo(() => {
        if (!editingPurchase) return null;
        return {
            company: editingPurchase.company || '',
            companyContact: editingPurchase.phone || '',
            companyAddress: editingPurchase.address || '',
            date: editingPurchase.purchaseDate || '',
            shippingAddress: editingPurchase.shippingAddress || '',
            category: editingPurchase.category || '',
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Edit Mode হলে ডাটা প্রি-ফিল করবে
    // --------------------------------------------------
    useEffect(() => {
        if (editingPurchase) {
            const mappedItems = (editingPurchase.items || []).map((item, index) => {
                const qtyNum = Number(item.unitQty ?? item.qty) || 0;
                const pcsQtyNum = Number(item.pcsQty) || 0;
                const totalQtyNum =
                    item.totalPcs !== undefined && item.totalPcs !== null
                        ? Number(item.totalPcs) || 0
                        : item.pcs !== undefined && item.pcs !== null
                            ? Number(item.pcs) || 0
                            : qtyNum + pcsQtyNum;
                const pcsPerUnit =
                    Number(item.pcsPerUnit) > 0
                        ? Number(item.pcsPerUnit)
                        : qtyNum > 0 ? (totalQtyNum - pcsQtyNum) / qtyNum : 1;
                const freeSubQtyNum = Number(item.freeSubQty) || 0;
                const isParentItem = item.parentMode === true;
                const subQtyNum = Number(item.subQty) || 0;
                const baseFreeSubQty = qtyNum > 0 ? freeSubQtyNum / qtyNum : 0;
                const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
                const freePcsQtyNum = Number(item.freePcsQty) || 0;
                const baseFreeUnitQty =
                    qtyNum > 0 ? freeUnitQtyNum / qtyNum : 0;
                const baseFreePcsQty = isParentItem
                    ? ((qtyNum + subQtyNum) > 0 ? freePcsQtyNum / (qtyNum + subQtyNum) : 0)
                    : (qtyNum > 0 ? freePcsQtyNum / qtyNum : 0);

                return {
                    _id: item.productId,
                    productName: item.productName,
                    company: editingPurchase.company || '',
                    category: editingPurchase.category || '',
                    uniqueId: `${item.productId || 'item'}-${index}-${Date.now()}`,
                    buyPrice: Number(item.buyPrice) || 0,
                    sellPrice: Number(item.sellPrice) || 0,
                    unit: item.unit || 'Pcs',
                    parentMode: item.parentMode === true,
                    subUnit: item.subUnit || '',
                    pcsPerSub: Number(item.pcsPerSub) || 0,
                    subQty: Number(item.subQty) || '',
                    freeSubQty: Number(item.freeSubQty) || '',
                    baseFreeSubQty,
                    unitQty: qtyNum === 0 ? '' : qtyNum,
                    pcsQty: pcsQtyNum === 0 ? '' : pcsQtyNum,
                    pcsPerUnit: pcsPerUnit || 1,
                    totalQty: totalQtyNum,
                    freeUnitQty: item.freeUnitQty !== undefined && item.freeUnitQty !== null ? (Number(item.freeUnitQty) || '') : '',
                    freePcsQty: item.freePcsQty !== undefined && item.freePcsQty !== null ? (Number(item.freePcsQty) || '') : (Number(item.freeTotalQty ?? item.freeQty) || ''),
                    freeQty: Number(item.freeTotalQty ?? item.freeQty) || 0,
                    baseFreeUnitQty,
                    baseFreePcsQty,
                    discount: Number(item.discount) || 0,
                    discountType: item.discountType || 'amount',
                    orderQty:
                        Number(
                            (editingPurchase.orderSnapshot?.items || editingPurchase.items || []).find(
                                (o) => o.productName === item.productName
                            )?.totalPcs
                        ) || 0,
                };
            });

            setPurchaseItems(mappedItems);
            setOverallDiscountAmount(editingPurchase.overallDiscount || 0);
            setOverallDiscountType(editingPurchase.overallDiscountType || 'amount');
            setAdjustmentText(editingPurchase.adjustment?.text || '');
            setAdjustmentAmount(editingPurchase.adjustment?.amount || 0);
            setAdjustmentType(editingPurchase.adjustment?.type || '+');
            setOrderNote(editingPurchase.orderNote || '');

            if (hasPriorPayment && !isReceivedEdit) {
                setPaymentAmount(editingPurchase.paidAmount);
                setPaymentAmountTouched(true);
                setPaymentAccountType(editingPurchase.paymentMethod || '');
                setPaymentNote(editingPurchase.paymentNote || '');
                const ppa = editingPurchase.paymentAccount || {};
                if (editingPurchase.paymentMethod === 'Bank') {
                    setSelectedAccountKey(`${ppa.bankName}-${ppa.accountNumber}-${ppa.accountBranch}`);
                } else if (editingPurchase.paymentMethod === 'Mobile Banking') {
                    setSelectedAccountKey(`${ppa.accountName}-${ppa.accountNumber}`);
                } else {
                    setSelectedAccountKey('cash');
                }
            }

            if (hasPriorPayment && !isReceivedEdit) {
                setPaymentAmount(editingPurchase.paidAmount);
                setPaymentAmountTouched(true);
                setPaymentAccountType(editingPurchase.paymentMethod || '');
                setPaymentNote(editingPurchase.paymentNote || '');
                const ppa = editingPurchase.paymentAccount || {};
                if (editingPurchase.paymentMethod === 'Bank') {
                    setSelectedAccountKey(`${ppa.bankName}-${ppa.accountNumber}-${ppa.accountBranch}`);
                } else if (editingPurchase.paymentMethod === 'Mobile Banking') {
                    setSelectedAccountKey(`${ppa.accountName}-${ppa.accountNumber}`);
                } else {
                    setSelectedAccountKey('cash');
                }
            }

            if (isReceivedEdit) {
                setPaymentAmount(editingPurchase.paidAmount ?? '');
                setPaymentAmountTouched(true);
                setPaymentAccountType(editingPurchase.paymentMethod || '');
                setPaymentNote(editingPurchase.paymentNote || '');
                const pa = editingPurchase.paymentAccount || {};
                if (editingPurchase.paymentMethod === 'Bank') {
                    setSelectedAccountKey(`${pa.bankName}-${pa.accountNumber}-${pa.accountBranch}`);
                } else if (editingPurchase.paymentMethod === 'Mobile Banking') {
                    setSelectedAccountKey(`${pa.accountName}-${pa.accountNumber}`);
                } else {
                    setSelectedAccountKey('cash');
                }
            }

            const restoredFreeItems = (editingPurchase.freeItems || []).map((item, index) => {
                const unitQty = Number(item.unitQty) || 0;
                const pcsQty = Number(item.pcsQty) || 0;
                const totalQty = Number(item.totalQty) || 0;
                const pcsPerUnit =
                    Number(item.pcsPerUnit) > 0
                        ? Number(item.pcsPerUnit)
                        : unitQty > 0
                            ? ((totalQty - pcsQty) / unitQty) || 1
                            : 1;

                return {
                    ...item,
                    uniqueId: `${item.productId || 'free'}-${index}-${Date.now()}`,
                    _id: item.productId,
                    unitQty: unitQty || '',
                    subQty: Number(item.subQty) || '',
                    parentMode: item.parentMode === true,
                    subUnit: item.subUnit || '',
                    pcsPerSub: Number(item.pcsPerSub) || 0,
                    pcsQty: pcsQty || '',
                    pcsPerUnit,
                    totalQty,
                    sellPricePcs: Number(item.sellPricePcs) > 0 ? item.sellPricePcs : '',
                };
            });
            setFreeProductItems(restoredFreeItems);

            const restoredReturnItems = (editingPurchase.returnItems || []).map((item, index) => ({
                ...item,
                uniqueId: `${item.productId || 'ret'}-${index}-${Date.now()}`,
                _id: item.productId,
                unitQty: Number(item.unitQty) || '',
                subQty: Number(item.subQty) || '',
                pcsQty: Number(item.pcsQty) || '',
                totalQty: Number(item.totalQty) || 0,
                freeUnitQty: Number(item.freeUnitQty) || '',
                freeSubQty: Number(item.freeSubQty) || '',
                freePcsQty: Number(item.freePcsQty) || '',
                freeQty: Number(item.freeQty) || 0,
                baseFreeUnitQty: Number(item.unitQty) > 0 ? (Number(item.freeUnitQty) || 0) / Number(item.unitQty) : 0,
                baseFreeSubQty: Number(item.unitQty) > 0 ? (Number(item.freeSubQty) || 0) / Number(item.unitQty) : 0,
                baseFreePcsQty: item.parentMode === true
                    ? ((Number(item.unitQty) || 0) + (Number(item.subQty) || 0) > 0
                        ? (Number(item.freePcsQty) || 0) / ((Number(item.unitQty) || 0) + (Number(item.subQty) || 0))
                        : 0)
                    : (Number(item.unitQty) > 0 ? (Number(item.freePcsQty) || 0) / Number(item.unitQty) : 0),
            }));
            setReturnItems(restoredReturnItems);
            if (restoredReturnItems.length > 0) {
                setReturnProductOpen(true);
            }
            setAddReturnToAdjustment(Number(editingPurchase.returnAdjustmentAmount) > 0);

            const restoredDamageItems = (editingPurchase.damageItems || []).map((item, index) => ({
                ...item,
                uniqueId: `${item.productId || 'dmg'}-${index}-${Date.now()}`,
                _id: item.productId,
                unitQty: Number(item.unitQty) || '',
                subQty: Number(item.subQty) || '',
                pcsQty: Number(item.pcsQty) || '',
                totalQty: Number(item.totalQty) || 0,
                freeUnitQty: Number(item.freeUnitQty) || '',
                freeSubQty: Number(item.freeSubQty) || '',
                freePcsQty: Number(item.freePcsQty) || '',
                freeQty: Number(item.freeQty) || 0,
            }));
            setDamageItems(restoredDamageItems);
            if (restoredDamageItems.length > 0) {
                setDamageProductOpen(true);
            }
            setAddDamageToAdjustment(Number(editingPurchase.damageAdjustmentAmount) > 0);
            if (restoredFreeItems.length > 0) {
                setFreeProductOpen(true);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Receive Mode হলে Investment Accounts fetch করবে
    // --------------------------------------------------
    useEffect(() => {
        if (showPayment) {
            fetch('http://localhost:5000/investment')
                .then((res) => res.json())
                .then((data) => setInvestments(Array.isArray(data) ? data : []))
                .catch((error) => console.error('Error fetching investments:', error));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // --------------------------------------------------
    // Number কে সবসময় 2 digit পর্যন্ত Round করার Helper
    // (floating point error যেমন 22.339999999 এড়ানোর জন্য)
    // --------------------------------------------------
    const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

    // Receive er somoy original order er item/limit ber korar helper
    const getOrderItem = (name) =>
        (editingPurchase?.orderSnapshot?.items || editingPurchase?.items || []).find(
            (o) => o.productName === name
        );
    const getOrderFreeItem = (name) =>
        (editingPurchase?.orderSnapshot?.freeItems || editingPurchase?.freeItems || []).find(
            (o) => o.productName === name
        );
    const showLimitToast = (message) => {
        setToast({ show: true, message, isError: true });
        setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
    };

    // --------------------------------------------------
    // Others Free Product — Category / Product fetch
    // --------------------------------------------------
    useEffect(() => {
        fetch('http://localhost:5000/category')
            .then((res) => res.json())
            .then((data) => setFreeCategories(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching categories:', error));

        fetch('http://localhost:5000/product')
            .then((res) => res.json())
            .then((data) => setFreeProducts(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching products:', error));
    }, []);

    // Main table এ product add হলে Free list থেকে auto remove
    useEffect(() => {
        setFreeProductItems((prev) =>
            prev.filter(
                (item) =>
                    !purchaseItems.some(
                        (pi) =>
                            (pi._id && pi._id === item._id) ||
                            (pi.productName && pi.productName === item.productName)
                    )
            )
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchaseItems]);

    // --------------------------------------------------
    // Others Free Product — Add / Remove / Change
    // --------------------------------------------------
    const getFreePcsTotal = (item) =>
        (Number(item.totalQty) || 0) * (Number(item.sellPricePcs) || 0);
    const getFreeRowTotal = (item) => getFreePcsTotal(item);

    const handleAddFreeProduct = (product) => {
        if (isReceiveMode && !getOrderFreeItem(product.productName)) {
            showLimitToast('Receive er somoy notun free product add kora jabe na!');
            return;
        }
        const newItem = {
            uniqueId: Date.now() + Math.random(),
            _id: product._id,
            productName: product.productName || '',
            company: product.company || '',
            unit: product.parentUnitUse === true ? product.parentUnit : (product.unit || 'Pcs'),
            parentMode: product.parentUnitUse === true,
            subUnit: product.parentUnitUse === true ? (product.subUnit || '') : '',
            pcsPerSub: product.parentUnitUse === true ? (Number(product.subUnitQty) || 1) : 0,
            subQty: '',
            unitQty: '',
            pcsQty: '',
            pcsPerUnit: Number(product.pcsOfUnit) || 1,
            totalQty: 0,
            sellPricePcs: Number(product.sellingPrice) || 0,
        };
        setFreeProductItems((prev) => [...prev, newItem]);
        setFreeSearch((prev) => ({ ...prev, product: '' }));
    };

    const handleRemoveFreeItem = (uniqueId) => {
        setFreeProductItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleFreeItemChange = (uniqueId, field, value) => {
        if (isReceiveMode && ['unitQty', 'subQty', 'pcsQty'].includes(field)) {
            const cur = freeProductItems.find((i) => i.uniqueId === uniqueId);
            const orig = cur && getOrderFreeItem(cur.productName);
            if (cur && orig) {
                const n = { ...cur, [field]: value === '' ? '' : Number(value) || 0 };
                const total =
                    (Number(n.unitQty) || 0) * (Number(n.pcsPerUnit) || 1) +
                    (Number(n.subQty) || 0) * (Number(n.pcsPerSub) || 0) +
                    (Number(n.pcsQty) || 0);
                const maxQty = Number(orig.totalQty) || 0;
                if (total > maxQty) {
                    showLimitToast(`Order e matro ${maxQty} pcs chilo, er beshi kora jabe na!`);
                    return;
                }
            }
        }
        if (value !== '' && Number(value) < 0) return;

        setFreeProductItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;

                if (['unitQty', 'subQty', 'pcsQty'].includes(field)) {
                    const numVal = value === '' ? '' : Number(value) || 0;
                    const next = { ...item, [field]: numVal };
                    next.totalQty =
                        (Number(next.unitQty) || 0) * (Number(next.pcsPerUnit) || 1) +
                        (Number(next.subQty) || 0) * (Number(next.pcsPerSub) || 0) +
                        (Number(next.pcsQty) || 0);
                    return next;
                }

                if (field === 'unitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const pcsQtyVal = Number(item.pcsQty) || 0;
                    return {
                        ...item,
                        unitQty: value === '' ? '' : numVal,
                        totalQty: numVal * (Number(item.pcsPerUnit) || 1) + pcsQtyVal,
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



                return { ...item, [field]: value };
            })
        );
    };

    const handleSelectFreeCategory = (cat) => {
        setFreeFilter({ category: cat.name });
        setFreeSearch((prev) => ({ ...prev, category: cat.name, product: '' }));
    };

    const handleClearFreeCategory = () => {
        setFreeFilter({ category: '' });
        setFreeSearch((prev) => ({ ...prev, category: '', product: '' }));
    };

    // Main table-e minimum 1 pcs product add na hole Return/Damage disabled thakbe
    const hasMainProduct = purchaseItems.some((item) => (Number(item.totalQty) || 0) >= 1);
    const disabledTip = 'Minimum 1 pcs product table a add korle then enable hobe';

    // --------------------------------------------------
    // Return Product — Add / Remove / Change
    // --------------------------------------------------
    const getReturnRowTotal = (item) =>
        (Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0);

    const handleAddReturnProduct = (product) => {
        const isParent = product.parentUnitUse === true;
        const newItem = {
            uniqueId: Date.now() + Math.random(),
            _id: product._id,
            productName: product.productName || '',
            company: product.company || '',
            buyPrice: Number(product.purchasePrice) || 0,
            unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
            parentMode: isParent,
            subUnit: isParent ? (product.subUnit || '') : '',
            pcsPerSub: isParent ? (Number(product.subUnitQty) || 1) : 0,
            pcsPerUnit: Number(product.pcsOfUnit) || 1,
            subQty: '',
            unitQty: '',
            pcsQty: '',
            totalQty: 0,
            freeUnitQty: '',
            freeSubQty: '',
            freePcsQty: '',
            freeQty: 0,
            baseFreeUnitQty: Number(isParent ? product.freeProductParentUnitQty : product.freeProductUnitQty) || 0,
            baseFreeSubQty: isParent ? (Number(product.freeProductSubQty) || 0) : 0,
            baseFreePcsQty: Number(product.freeProductPcsQty) || 0,
        };
        setReturnItems((prev) => [...prev, newItem]);
        setReturnSearch((prev) => ({ ...prev, product: '' }));
    };

    const handleRemoveReturnItem = (uniqueId) => {
        setReturnItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleReturnItemChange = (uniqueId, field, value) => {
        const cur = returnItems.find((i) => i.uniqueId === uniqueId);
        if (cur && ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
            const stock = getStock(cur);
            if (stock) {
                const n = { ...cur, [field]: value === '' ? '' : Number(value) || 0 };
                const ppu = Number(n.pcsPerUnit) || 1;
                const pps = Number(n.pcsPerSub) || 0;
                const total =
                    (Number(n.unitQty) || 0) * ppu +
                    (Number(n.subQty) || 0) * pps +
                    (Number(n.pcsQty) || 0);
                if (cur.parentMode) {
                    if (field === 'unitQty' || field === 'subQty') {
                        const u = Number(n.unitQty) || 0;
                        const s = Number(n.subQty) || 0;
                        n.freeSubQty = u * (Number(cur.baseFreeSubQty) || 0) || '';
                        n.freePcsQty = (u + s) * (Number(cur.baseFreePcsQty) || 0) || '';
                    }
                } else if (field === 'unitQty') {
                    const q = Number(n.unitQty) || 0;
                    n.freeUnitQty = q * (Number(cur.baseFreeUnitQty) || 0) || '';
                    n.freeSubQty = q * (Number(cur.baseFreeSubQty) || 0) || '';
                    n.freePcsQty = q * (Number(cur.baseFreePcsQty) || 0) || '';
                }
                const freeTotal =
                    (Number(n.freeUnitQty) || 0) * ppu +
                    (Number(n.freeSubQty) || 0) * pps +
                    (Number(n.freePcsQty) || 0);
                const stockError =
                    total > stock.paid
                        ? `Main stock e matro ${stock.paid} pcs ache!`
                        : freeTotal > stock.free
                            ? `Free stock e matro ${stock.free} pcs ache!`
                            : '';
                if (stockError) {
                    setToast({ show: true, message: stockError, isError: true });
                    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
                    return;
                }
            }
        }
        if (value !== '' && Number(value) < 0) return;

        setReturnItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;

                if (['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
                    const numVal = value === '' ? '' : Number(value) || 0;
                    const next = { ...item, [field]: numVal };
                    const ppu = Number(next.pcsPerUnit) || 1;
                    const pps = Number(next.pcsPerSub) || 0;
                    next.totalQty =
                        (Number(next.unitQty) || 0) * ppu +
                        (Number(next.subQty) || 0) * pps +
                        (Number(next.pcsQty) || 0);
                    if (item.parentMode) {
                        if (field === 'unitQty' || field === 'subQty') {
                            const u = Number(next.unitQty) || 0;
                            const s = Number(next.subQty) || 0;
                            next.freeSubQty = u * (Number(item.baseFreeSubQty) || 0) || '';
                            next.freePcsQty = (u + s) * (Number(item.baseFreePcsQty) || 0) || '';
                        }
                    } else if (field === 'unitQty') {
                        const n = Number(numVal) || 0;
                        next.freeUnitQty = n * (Number(item.baseFreeUnitQty) || 0) || '';
                        next.freeSubQty = n * (Number(item.baseFreeSubQty) || 0) || '';
                        next.freePcsQty = n * (Number(item.baseFreePcsQty) || 0) || '';
                    }
                    next.freeQty =
                        (Number(next.freeUnitQty) || 0) * ppu +
                        (Number(next.freeSubQty) || 0) * pps +
                        (Number(next.freePcsQty) || 0);
                    return next;
                }

                return { ...item, [field]: value };
            })
        );
    };

    const handleSelectReturnCategory = (cat) => {
        setReturnFilter({ category: cat.name });
        setReturnSearch((prev) => ({ ...prev, category: cat.name, product: '' }));
    };

    const handleClearReturnCategory = () => {
        setReturnFilter({ category: '' });
        setReturnSearch((prev) => ({ ...prev, category: '', product: '' }));
    };

    const filteredReturnCategories = freeCategories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(returnSearch.category, [cat.name]));

    // শুধু উপরের PurchaseForm এ সিলেক্ট করা company এর product
    const filteredReturnProducts = freeProducts.filter((prod) => {
        if (!purchaseFormData.company) return false;
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (prod.company !== purchaseFormData.company) return false;
        if (returnFilter.category && prod.category !== returnFilter.category) return false;

        const isAlreadyAddedInReturn = returnItems.some(
            (item) => item._id === prod._id || item.productName === prod.productName
        );
        if (isAlreadyAddedInReturn) return false;

        return matchesSearch(returnSearch.product, [prod.productName, prod.sku]);
    });

    const returnItemsPayload = returnItems.map((item) => ({
        productId: item._id,
        productName: item.productName,
        company: item.company,
        buyPrice: roundTo2(item.buyPrice),
        unit: item.unit || 'Pcs',
        parentMode: item.parentMode === true,
        subUnit: item.subUnit || '',
        pcsPerUnit: Number(item.pcsPerUnit) || 1,
        pcsPerSub: Number(item.pcsPerSub) || 0,
        unitQty: Number(item.unitQty) || 0,
        subQty: Number(item.subQty) || 0,
        pcsQty: Number(item.pcsQty) || 0,
        totalQty: Number(item.totalQty) || 0,
        freeUnitQty: Number(item.freeUnitQty) || 0,
        freeSubQty: Number(item.freeSubQty) || 0,
        freePcsQty: Number(item.freePcsQty) || 0,
        freeQty: Number(item.freeQty) || 0,
        itemTotal: roundTo2(getReturnRowTotal(item)),
    }));

    // --------------------------------------------------
    // Damage Product — Add / Remove / Change
    // --------------------------------------------------
    const getDamageStock = (item) => {
        if (!damageStockList) return null;
        const f = damageStockList.find((d) => d.key === damageKey(item.productName, item.company));
        return f ? { paid: f.paid, free: f.free } : { paid: 0, free: 0 };
    };

    const getDamageRowTotal = (item) =>
        (Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0);

    const findMasterProduct = (s) =>
        freeProducts.find((p) => damageKey(p.productName, p.company) === s.key);

    const handleAddDamageProduct = (s) => {
        const master = findMasterProduct(s);
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
        };
        setDamageItems((prev) => [...prev, newItem]);
        setDamageSearch((prev) => ({ ...prev, product: '' }));
    };

    const handleRemoveDamageItem = (uniqueId) => {
        setDamageItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    const handleDamageItemChange = (uniqueId, field, value) => {
        if (value !== '' && Number(value) < 0) return;
        const qtyFields = ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'];
        const cur = damageItems.find((i) => i.uniqueId === uniqueId);
        if (cur && qtyFields.includes(field)) {
            const stock = getDamageStock(cur);
            if (stock) {
                const n = { ...cur, [field]: value === '' ? '' : Number(value) || 0 };
                const ppu = Number(n.pcsPerUnit) || 1;
                const pps = Number(n.pcsPerSub) || 0;
                const total = (Number(n.unitQty) || 0) * ppu + (Number(n.subQty) || 0) * pps + (Number(n.pcsQty) || 0);
                const freeTotal = (Number(n.freeUnitQty) || 0) * ppu + (Number(n.freeSubQty) || 0) * pps + (Number(n.freePcsQty) || 0);
                const stockError =
                    total > stock.paid
                        ? `Damage main stock e matro ${stock.paid} pcs ache!`
                        : freeTotal > stock.free
                            ? `Damage free stock e matro ${stock.free} pcs ache!`
                            : '';
                if (stockError) {
                    setToast({ show: true, message: stockError, isError: true });
                    setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
                    return;
                }
            }
        }

        setDamageItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;
                if (qtyFields.includes(field)) {
                    const next = { ...item, [field]: value === '' ? '' : Number(value) || 0 };
                    const ppu = Number(next.pcsPerUnit) || 1;
                    const pps = Number(next.pcsPerSub) || 0;
                    next.totalQty = (Number(next.unitQty) || 0) * ppu + (Number(next.subQty) || 0) * pps + (Number(next.pcsQty) || 0);
                    next.freeQty = (Number(next.freeUnitQty) || 0) * ppu + (Number(next.freeSubQty) || 0) * pps + (Number(next.freePcsQty) || 0);
                    return next;
                }
                return { ...item, [field]: value };
            })
        );
    };

    const handleSelectDamageCategory = (cat) => {
        setDamageFilter({ category: cat.name });
        setDamageSearch((prev) => ({ ...prev, category: cat.name, product: '' }));
    };

    const handleClearDamageCategory = () => {
        setDamageFilter({ category: '' });
        setDamageSearch((prev) => ({ ...prev, category: '', product: '' }));
    };

    const filteredDamageCategories = freeCategories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(damageSearch.category, [cat.name]));

    const filteredDamageProducts = (damageStockList || []).filter((s) => {
        if (!purchaseFormData.company) return false;
        if (damageKey('', s.company) !== damageKey('', purchaseFormData.company)) return false;
        if (s.paid <= 0 && s.free <= 0) return false;
        const master = findMasterProduct(s);
        if (damageFilter.category && master?.category !== damageFilter.category) return false;
        if (damageItems.some((i) => damageKey(i.productName, i.company) === s.key)) return false;
        return matchesSearch(damageSearch.product, [s.productName, master?.sku]);
    });

    const damageItemsPayload = damageItems.map((item) => ({
        productId: item._id,
        productName: item.productName,
        company: item.company,
        buyPrice: roundTo2(item.buyPrice),
        unit: item.unit || 'Pcs',
        parentMode: item.parentMode === true,
        subUnit: item.subUnit || '',
        pcsPerUnit: Number(item.pcsPerUnit) || 1,
        pcsPerSub: Number(item.pcsPerSub) || 0,
        unitQty: Number(item.unitQty) || 0,
        subQty: Number(item.subQty) || 0,
        pcsQty: Number(item.pcsQty) || 0,
        totalQty: Number(item.totalQty) || 0,
        freeUnitQty: Number(item.freeUnitQty) || 0,
        freeSubQty: Number(item.freeSubQty) || 0,
        freePcsQty: Number(item.freePcsQty) || 0,
        freeQty: Number(item.freeQty) || 0,
        itemTotal: roundTo2(getDamageRowTotal(item)),
    }));

    const damageTotalValue = roundTo2(
        damageItems.reduce((total, item) => total + getDamageRowTotal(item), 0)
    );

    const addedMainProductIds = purchaseItems.map((item) => item.productName || item._id);
    const addedFreeProductIds = freeProductItems.map((item) => item.productName || item._id);

    const filteredFreeCategories = freeCategories
        .filter((cat) => cat.isActive === true)
        .filter((cat) => matchesSearch(freeSearch.category, [cat.name]));

    const filteredFreeProducts = freeProducts.filter((prod) => {
        if (!prod.productName) return false;
        if (prod.isActive !== true) return false;
        if (freeFilter.category && prod.category !== freeFilter.category) return false;

        const isAlreadyAdded =
            addedMainProductIds.includes(prod._id) ||
            addedMainProductIds.includes(prod.productName) ||
            addedFreeProductIds.includes(prod._id) ||
            addedFreeProductIds.includes(prod.productName);
        if (isAlreadyAdded) return false;

        return matchesSearch(freeSearch.product, [prod.productName, prod.sku]);
    });

    const freeItemsPayload = freeProductItems.map((item) => ({
        productId: item._id,
        productName: item.productName,
        company: item.company,
        unit: item.unit || 'Pcs',
        parentMode: item.parentMode === true,
        subUnit: item.subUnit || '',
        pcsPerSub: Number(item.pcsPerSub) || 0,
        unitQty: Number(item.unitQty) || 0,
        subQty: Number(item.subQty) || 0,
        pcsQty: Number(item.pcsQty) || 0,
        pcsPerUnit: Number(item.pcsPerUnit) || 1,
        totalQty: Number(item.totalQty) || 0,
        sellPricePcs: roundTo2(item.sellPricePcs),
        itemTotal: roundTo2(getFreeRowTotal(item)),
    }));

    // --------------------------------------------------
    // Invoice Number Generate (YYMMDDHHMMSS - 24hr, no separators)
    // --------------------------------------------------
    const generateInvoiceNo = () => {
        const now = new Date();

        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');

        // 24-hour format (international), AM/PM mix হবে না
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');

        return `${yy}${mm}${dd}${hh}${min}${ss}`;
    };

    // --------------------------------------------------
    // Purchase Form Data (company/phone/address/date/shipping) Update
    // --------------------------------------------------
    const handleFormDataChange = (data) => {
        setPurchaseFormData(data);
    };

    // --------------------------------------------------
    // Company Clear Handler -> company select kete dile,
    // table a add kra shob product remove/reset hye jbe
    // --------------------------------------------------
    const handleCompanyClear = () => {
        setPurchaseItems([]);
        setReturnItems([]);
        setDamageItems([]);
    };

    // --------------------------------------------------
    // Product Add
    // --------------------------------------------------
    const handleAddProduct = (product) => {
        if (isReceiveMode && !getOrderItem(product.productName)) {
            showLimitToast('Receive er somoy notun product add kora jabe na!');
            return;
        }
        const initialUnitQty = '';
        const initialPcsQty = '';
        const isParent = product.parentUnitUse === true;
        const baseFreeUnitQty = Number(isParent ? product.freeProductParentUnitQty : product.freeProductUnitQty) || 0;
        const baseFreeSubQty = isParent ? (Number(product.freeProductSubQty) || 0) : 0;
        const baseFreePcsQty = Number(product.freeProductPcsQty) || 0;
        const pcsPerUnit = Number(product.pcsOfUnit) || 1;
        const pcsPerSub = isParent ? (Number(product.subUnitQty) || 1) : 0;

        const newItem = {
            ...product,
            uniqueId: Date.now() + Math.random(),

            productName: product.productName || '',
            company: product.company || '',
            category: product.category || null,
            sku: product.sku || null,

            buyPrice: Number(product.purchasePrice) || 0,
            sellPrice: Number(product.sellingPrice) || 0,

            unit: isParent ? product.parentUnit : (product.unit || 'Pcs'),
            parentMode: isParent,
            subUnit: isParent ? product.subUnit : '',
            pcsPerSub: pcsPerSub,
            subQty: '',
            freeSubQty: '',
            baseFreeSubQty: baseFreeSubQty,

            unitQty: initialUnitQty,

            pcsQty: initialPcsQty,

            pcsPerUnit: pcsPerUnit,

            totalQty: (Number(initialUnitQty) || 0) * pcsPerUnit + (Number(initialPcsQty) || 0),

            freeUnitQty: '',
            freePcsQty: '',
            freeQty: 0,

            // মূল Free Qty (per unit multiplier)
            baseFreeUnitQty: baseFreeUnitQty,
            baseFreePcsQty: baseFreePcsQty,

            // Product Discount
            discount: 0,
            discountType: 'amount', // 'amount' | 'percent'
            orderQty: Number(getOrderItem(product.productName)?.totalPcs) || 0,
        };

        setPurchaseItems((prev) => [...prev, newItem]);
    };

    // --------------------------------------------------
    // Product Remove
    // --------------------------------------------------
    const handleRemoveItem = (uniqueId) => {
        setPurchaseItems((prev) =>
            prev.filter((item) => item.uniqueId !== uniqueId)
        );
    };

    // --------------------------------------------------
    // Item Change
    // --------------------------------------------------
    const handleItemChange = (uniqueId, field, value) => {
        if (
            isReceiveMode &&
            ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)
        ) {
            const cur = purchaseItems.find((i) => i.uniqueId === uniqueId);
            const orderItem = cur && getOrderItem(cur.productName);
            if (cur && orderItem) {
                const n = { ...cur, [field]: value === '' ? '' : Number(value) || 0 };
                const ppu = Number(n.pcsPerUnit) || 1;
                const pps = Number(n.pcsPerSub) || 0;
                const total =
                    (Number(n.unitQty) || 0) * ppu +
                    (Number(n.subQty) || 0) * pps +
                    (Number(n.pcsQty) || 0);
                const maxQty = Number(orderItem.totalPcs) || 0;
                if (total > maxQty) {
                    showLimitToast(`Order e matro ${maxQty} pcs chilo, er beshi kora jabe na!`);
                    return;
                }
                if (['freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
                    const freeTotal =
                        (Number(n.freeUnitQty) || 0) * ppu +
                        (Number(n.freeSubQty) || 0) * pps +
                        (Number(n.freePcsQty) || 0);
                    const maxFree = Number(orderItem.freeTotalQty ?? orderItem.freeQty) || 0;
                    if (freeTotal > maxFree) {
                        showLimitToast(`Order e matro ${maxFree} pcs free chilo, er beshi kora jabe na!`);
                        return;
                    }
                }
            }
        }
        if (
            isReceiveMode &&
            ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)
        ) {
            const cur = purchaseItems.find((i) => i.uniqueId === uniqueId);
            const orderItem = cur && getOrderItem(cur.productName);
            if (cur && orderItem) {
                const n = { ...cur, [field]: value === '' ? '' : Number(value) || 0 };
                const ppu = Number(n.pcsPerUnit) || 1;
                const pps = Number(n.pcsPerSub) || 0;
                const total =
                    (Number(n.unitQty) || 0) * ppu +
                    (Number(n.subQty) || 0) * pps +
                    (Number(n.pcsQty) || 0);
                const maxQty = Number(orderItem.totalPcs) || 0;
                if (total > maxQty) {
                    showLimitToast(`Order e matro ${maxQty} pcs chilo, er beshi kora jabe na!`);
                    return;
                }
                if (['freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
                    const freeTotal =
                        (Number(n.freeUnitQty) || 0) * ppu +
                        (Number(n.freeSubQty) || 0) * pps +
                        (Number(n.freePcsQty) || 0);
                    const maxFree = Number(orderItem.freeTotalQty ?? orderItem.freeQty) || 0;
                    if (freeTotal > maxFree) {
                        showLimitToast(`Order e matro ${maxFree} pcs free chilo, er beshi kora jabe na!`);
                        return;
                    }
                }
            }
        }
        // Negative value allow করবে না
        if (value !== '' && Number(value) < 0) return;

        setPurchaseItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) {
                    return item;
                }
                if (['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'].includes(field)) {
                    const numVal = value === '' ? '' : Number(value) || 0;
                    const next = { ...item, [field]: numVal };
                    const ppu = Number(next.pcsPerUnit) || 1;
                    const pps = Number(next.pcsPerSub) || 0;
                    next.totalQty =
                        (Number(next.unitQty) || 0) * ppu +
                        (Number(next.subQty) || 0) * pps +
                        (Number(next.pcsQty) || 0);
                    if (item.parentMode) {
                        // Parent Unit থাকলে:
                        // Parent Qty (Karton) → Free Sub (Packet) + Free Pcs
                        // Sub Qty (Packet)    → শুধু Free Pcs
                        if (field === 'unitQty' || field === 'subQty') {
                            const u = Number(next.unitQty) || 0;
                            const s = Number(next.subQty) || 0;
                            next.freeSubQty = u * (Number(item.baseFreeSubQty) || 0) || '';
                            next.freePcsQty = (u + s) * (Number(item.baseFreePcsQty) || 0) || '';
                        }
                    } else if (field === 'unitQty') {
                        const n = Number(numVal) || 0;
                        next.freeUnitQty = n * (Number(item.baseFreeUnitQty) || 0) || '';
                        next.freeSubQty = n * (Number(item.baseFreeSubQty) || 0) || '';
                        next.freePcsQty = n * (Number(item.baseFreePcsQty) || 0) || '';
                    }
                    next.freeQty =
                        (Number(next.freeUnitQty) || 0) * ppu +
                        (Number(next.freeSubQty) || 0) * pps +
                        (Number(next.freePcsQty) || 0);
                    return next;
                }
                // ------------------------------------------
                // Unit Qty Change
                // ------------------------------------------
                if (field === 'unitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const pcsQtyVal = Number(item.pcsQty) || 0;

                    const newTotalQty =
                        numVal * (Number(item.pcsPerUnit) || 1) + pcsQtyVal;

                    const newFreeUnitQty =
                        numVal * (Number(item.baseFreeUnitQty) || 0);
                    const newFreePcsQty =
                        numVal * (Number(item.baseFreePcsQty) || 0);
                    const newFreeQty =
                        newFreeUnitQty * (Number(item.pcsPerUnit) || 1) + newFreePcsQty;

                    return {
                        ...item,
                        unitQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                        freeUnitQty: newFreeUnitQty || '',
                        freePcsQty: newFreePcsQty || '',
                        freeQty: newFreeQty,
                    };
                }

                // ------------------------------------------
                // Free Unit Qty Change
                // ------------------------------------------
                if (field === 'freeUnitQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const freePcsQtyVal = Number(item.freePcsQty) || 0;

                    const newFreeQty =
                        numVal * (Number(item.pcsPerUnit) || 1) + freePcsQtyVal;

                    return {
                        ...item,
                        freeUnitQty: value === '' ? '' : numVal,
                        freeQty: newFreeQty,
                    };
                }

                // ------------------------------------------
                // Free PCS Qty Change
                // ------------------------------------------
                if (field === 'freePcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const freeUnitQtyVal = Number(item.freeUnitQty) || 0;

                    const newFreeQty =
                        freeUnitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal;

                    return {
                        ...item,
                        freePcsQty: value === '' ? '' : numVal,
                        freeQty: newFreeQty,
                    };
                }

                // ------------------------------------------
                // PCS Qty Change
                // ------------------------------------------
                if (field === 'pcsQty') {
                    const numVal = value === '' ? 0 : Number(value) || 0;
                    const unitQtyVal = Number(item.unitQty) || 0;

                    const newTotalQty =
                        unitQtyVal * (Number(item.pcsPerUnit) || 1) + numVal;

                    return {
                        ...item,
                        pcsQty: value === '' ? '' : numVal,
                        totalQty: newTotalQty,
                    };
                }

                // ------------------------------------------
                // Free Qty Change
                // ------------------------------------------
                if (field === 'freeQty') {
                    return {
                        ...item,
                        freeQty:
                            value === ''
                                ? ''
                                : Number(value),
                    };
                }

                // ------------------------------------------
                // Discount Change
                // ------------------------------------------
                if (field === 'discount') {
                    return {
                        ...item,
                        discount:
                            value === ''
                                ? ''
                                : Number(value),
                    };
                }

                // ------------------------------------------
                // Other Fields
                // ------------------------------------------
                return {
                    ...item,
                    [field]: value,
                };
            })
        );
    };


    // --------------------------------------------------
    // Discount Type Toggle (Amount / Percent)
    // --------------------------------------------------
    const handleToggleDiscountType = (uniqueId) => {
        setPurchaseItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;
                return {
                    ...item,
                    discountType: item.discountType === 'percent' ? 'amount' : 'percent',
                };
            })
        );
    };

    // --------------------------------------------------
    // Added Product IDs
    // --------------------------------------------------
    const addedProductIds = purchaseItems.map(
        (item) => item.productName || item._id
    );

    // --------------------------------------------------
    // Payment Account Type List (Investment থেকে unique accountType)
    // --------------------------------------------------
    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];

    // প্রতিটা account কে unique চেনার জন্য key বানানো (accountType অনুযায়ী)
    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') {
            return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        }
        if (inv.accountType === 'Mobile Banking') {
            return `${inv.accountName}-${inv.accountNumber}`;
        }
        return 'cash';
    };

    // Selected Account Type অনুযায়ী Unique Account গুলো বের করা (duplicate বাদ দিয়ে)
    const uniqueAccountsMap = new Map();
    investments
        .filter((inv) => inv.accountType === paymentAccountType)
        .forEach((inv) => {
            const key = getAccountKey(inv);
            if (!uniqueAccountsMap.has(key)) {
                uniqueAccountsMap.set(key, inv);
            }
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());

    const selectedAccountInfo = uniqueAccounts.find(
        (inv) => getAccountKey(inv) === selectedAccountKey
    );

    // --------------------------------------------------
    // TOTAL CALCULATIONS
    // --------------------------------------------------

    // Product-এর মূল SubTotal
    const subTotal = roundTo2(
        purchaseItems.reduce((total, item) => {
            const buyPrice = Number(item.buyPrice) || 0;
            const totalQty = Number(item.totalQty) || 0;

            return total + buyPrice * totalQty;
        }, 0)
    );

    // Product Wise Discount (percent হলে row gross total অনুযায়ী হিসাব হবে)
    const productWiseDiscount = roundTo2(
        purchaseItems.reduce((total, item) => {
            const rowGrossTotal = (Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0);
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? (rowGrossTotal * (Number(item.discount) || 0)) / 100
                    : Number(item.discount) || 0;
            return total + effectiveDiscount;
        }, 0)
    );

    // Grand Total এর তুলনায় Product Wise Discount কত % হলো তার হিসাব
    const productWiseDiscountPercent =
        subTotal > 0 ? roundTo2((productWiseDiscount / subTotal) * 100) : 0;

    // Overall Discount (Grand Total - Product Wise Discount এর উপর হিসাব হবে)
    const afterProductDiscount = subTotal - productWiseDiscount;
    const overallDiscountValue = roundTo2(
        overallDiscountType === 'percent'
            ? (afterProductDiscount * (Number(overallDiscountAmount) || 0)) / 100
            : Number(overallDiscountAmount) || 0
    );

    const overallDiscountPercent =
        overallDiscountType === 'amount'
            ? (afterProductDiscount > 0 ? roundTo2(((Number(overallDiscountAmount) || 0) / afterProductDiscount) * 100) : 0)
            : 0;

    // Adjustment
    const adjustmentValue =
        Number(adjustmentAmount) || 0;

    let payableAmount =
        afterProductDiscount -
        overallDiscountValue;

    if (adjustmentType === '+') {
        payableAmount += adjustmentValue;
    } else {
        payableAmount -= adjustmentValue;
    }

    // Return Product Total
    const returnTotalValue = roundTo2(
        returnItems.reduce((total, item) => total + getReturnRowTotal(item), 0)
    );

    // Return toggle on thakle Payable theke biyog hobe
    if (addReturnToAdjustment) {
        payableAmount -= returnTotalValue;
    }

    // Damage toggle on thakle Payable theke biyog hobe
    if (addDamageToAdjustment) {
        payableAmount -= damageTotalValue;
    }

    // Payable কখনো negative হবে না
    if (payableAmount < 0) {
        payableAmount = 0;
    }

    payableAmount = roundTo2(payableAmount);


    // --------------------------------------------------
    // Receive Mode এ Payment Amount লাইভ Payable Amount এর সাথে
    // sync থাকবে, যতক্ষণ না ইউজার নিজে হাতে সেটা edit করছে
    // --------------------------------------------------
    useEffect(() => {
        const autoSync =
            isPurchaseStage && hasPriorPayment ? !paymentManual : !paymentAmountTouched;
        if ((isReceiveMode || isPurchaseStage) && autoSync) {
            setPaymentAmount(payableAmount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payableAmount, isReceiveMode, paymentAmountTouched, paymentManual]);

    // --------------------------------------------------
    // Submit
    // --------------------------------------------------
    const handleSubmit = async (e) => {
        if (isReturnOnly) {
            e.preventDefault();
            const badRet = returnItems.some(
                (i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0
            );
            if (badRet) {
                setToast({ show: true, message: 'Each return product must have a valid quantity!', isError: true });
                setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
                return;
            }
            const useAdj = addReturnToAdjustment && returnTotalValue > 0;
            const newPayable = Math.max(
                roundTo2(
                    (Number(editingPurchase.payableAmount) || 0) +
                    (Number(editingPurchase.returnAdjustmentAmount) || 0) -
                    (useAdj ? returnTotalValue : 0)
                ),
                0
            );
            try {
                const res = await fetch(`http://localhost:5000/purchase/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        returnItems: returnItemsPayload,
                        payableAmount: newPayable,
                        receiveStatus: 'Received',
                        returnOnly: true,
                        ...(useAdj ? { returnAdjustmentAmount: returnTotalValue } : { unsetFields: ['returnAdjustmentAmount'] }),
                    }),
                });
                if (!res.ok) throw new Error('Failed');
                clearPurchaseDrafts();
                setToast({ show: true, message: 'Return updated successfully!', isError: false });
                setTimeout(() => navigate(-1), 1000);
            } catch (error) {
                console.error(error);
                setToast({ show: true, message: 'Failed to update return. Try again.', isError: true });
                setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            }
            return;
        }
        e.preventDefault();

        // ---------------- Validation ----------------
        if (!purchaseFormData.company) {
            setToast({ show: true, message: 'Company is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!purchaseFormData.date) {
            setToast({ show: true, message: 'Date is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (purchaseItems.length === 0 && freeProductItems.length === 0) {
            setToast({ show: true, message: 'Please add at least one product!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        const hasInvalidQty = purchaseItems.some(
            (item) =>
                (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );

        if (hasInvalidQty) {
            setToast({ show: true, message: 'Each product must have a valid quantity (Unit/PCS/Free)!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }
        const hasInvalidFreeQty = freeProductItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0
        );
        if (hasInvalidFreeQty) {
            setToast({ show: true, message: 'Each free product must have a valid quantity (greater than 0)!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }
        let receivedPaymentData = {};
        if (isPurchaseStage && !paymentSkipped) {
            const showErr = (message) => {
                setToast({ show: true, message, isError: true });
                setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            };
            if (paymentAmount === '' || paymentAmount === null) {
                showErr('Payment amount is required! (or Skip payment)');
                return;
            }
            if (!paymentAccountType) {
                showErr('Please select a payment method! (or Skip payment)');
                return;
            }
            if (!selectedAccountInfo) {
                showErr('Please select an account! (or Skip payment)');
                return;
            }
            let stageAccInfo = {};
            if (paymentAccountType === 'Bank') {
                stageAccInfo = {
                    bankName: selectedAccountInfo.bankName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                    accountBranch: selectedAccountInfo.accountBranch || '',
                };
            } else if (paymentAccountType === 'Mobile Banking') {
                stageAccInfo = {
                    accountName: selectedAccountInfo.accountName || '',
                    accountNumber: selectedAccountInfo.accountNumber || '',
                };
            } else {
                stageAccInfo = { accountName: 'Cash' };
            }
            receivedPaymentData = {
                paidAmount: roundTo2(paymentAmount),
                paymentMethod: paymentAccountType,
                paymentAccount: stageAccInfo,
                paymentNote: paymentNote,
            };
        }
        if (isReceivedEdit) {
            if (paymentAmount === '' || paymentAmount === null) {
                setToast({ show: true, message: 'Payment amount is required!', isError: true });
                setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
                return;
            }
            if (!paymentAccountType) {
                setToast({ show: true, message: 'Please select a payment method!', isError: true });
                setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
                return;
            }
            if (!selectedAccountInfo) {
                setToast({ show: true, message: 'Please select an account!', isError: true });
                setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
                return;
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

            receivedPaymentData = {
                paidAmount: roundTo2(paymentAmount),
                receiveStatus: 'Received',
                receiveDate: editingPurchase.receiveDate,
                paymentMethod: paymentAccountType,
                paymentAccount: accInfo,
                paymentNote: paymentNote,
            };
        }
        // ---------------- Validation End ----------------

        const itemsPayload = purchaseItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal =
                (Number(item.buyPrice) || 0) * totalQty;
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);
            const rowSubtotal =
                roundTo2(rowGrossTotal - effectiveDiscount);

            return {
                productId: item.uniqueId,
                productName: item.productName,
                buyPrice: roundTo2(item.buyPrice),
                sellPrice: roundTo2(item.sellPrice),
                unit: item.unit || 'Pcs',
                parentMode: item.parentMode === true,
                subUnit: item.subUnit || '',
                pcsPerUnit: Number(item.pcsPerUnit) || 1,
                pcsPerSub: Number(item.pcsPerSub) || 0,
                unitQty: Number(item.unitQty) || 0,
                subQty: Number(item.subQty) || 0,
                pcsQty: Number(item.pcsQty) || 0,
                totalPcs: totalQty,
                freeUnitQty: Number(item.freeUnitQty) || 0,
                freeSubQty: Number(item.freeSubQty) || 0,
                freePcsQty: Number(item.freePcsQty) || 0,
                freeTotalQty: item.freeQty,
                discount: roundTo2(item.discount),
                discountType: item.discountType || 'amount',
                discountAmount: effectiveDiscount,
                itemTotal: rowSubtotal,
            };
        });

        const purchaseData = {
            invoiceNo: isEditMode ? editingPurchase.invoiceNo : generateInvoiceNo(),
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            subTotal: subTotal,
            productWiseDiscount: productWiseDiscount,
            productWiseDiscountPercent: productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType: overallDiscountType,
            overallDiscountValue: overallDiscountValue,

            returnItems: returnItemsPayload,
            ...(addReturnToAdjustment && returnTotalValue > 0 ? { returnAdjustmentAmount: returnTotalValue } : {}),
            damageItems: damageItemsPayload,
            ...(addDamageToAdjustment && damageTotalValue > 0 ? { damageAdjustmentAmount: damageTotalValue } : {}),
            ...(isEditMode
                ? {
                    unsetFields: [
                        ...(addReturnToAdjustment && returnTotalValue > 0 ? [] : ['returnAdjustmentAmount']),
                        ...(addDamageToAdjustment && damageTotalValue > 0 ? [] : ['damageAdjustmentAmount']),
                    ],
                }
                : {}),

            freeItems: freeItemsPayload,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            payableAmount: payableAmount,

            orderNote: orderNote,

            ...receivedPaymentData,
        };

        try {
            if (isEditMode && isPurchaseStage && paymentSkipped) {
                purchaseData.unsetFields = [
                    ...(purchaseData.unsetFields || []),
                    'paidAmount',
                    'paymentMethod',
                    'paymentAccount',
                    'paymentNote',
                ];
            }
            const url = isEditMode
                ? `http://localhost:5000/purchase/${editId}`
                : 'http://localhost:5000/purchase';
            const method = isEditMode ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData),
            });

            if (!res.ok) {
                throw new Error('Failed to save purchase');
            }

            await res.json();

            // Toast দেখাবে
            setToast({
                show: true,
                message: isEditMode
                    ? `Purchase updated successfully! Invoice: ${purchaseData.invoiceNo}`
                    : `Purchase added successfully! Invoice: ${purchaseData.invoiceNo}`,
                isError: false,
            });

            clearPurchaseDrafts();
            // টেবিল ও ফর্ম রিসেট
            setPurchaseItems([]);
            setOverallDiscountAmount(0);
            setOverallDiscountType('amount');
            setAdjustmentText('');
            setAdjustmentAmount(0);
            setAdjustmentType('+');
            setOrderNote('');
            setFormResetKey((prev) => prev + 1);
            // Purchase লিস্টে ফিরে যাবে যাতে fresh data load হয় (রিফ্রেশ লাগবে না)
            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error saving purchase:', error);
            setToast({
                show: true,
                message: isEditMode ? 'Failed to update purchase. Try again.' : 'Failed to save purchase. Try again.',
                isError: true,
            });
            setTimeout(() => {
                setToast({ show: false, message: '', isError: false });
            }, 3000);
        }
    };

    // --------------------------------------------------
    // Receive Submit
    // --------------------------------------------------
    const handleReceiveSubmit = async () => {
        if (isReceiving) return;
        // ---------------- Validation ----------------
        if (paymentAmount === '' || paymentAmount === null) {
            setToast({ show: true, message: 'Payment amount is required!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!paymentAccountType) {
            setToast({ show: true, message: 'Please select a payment method!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        if (!selectedAccountInfo) {
            setToast({ show: true, message: 'Please select an account!', isError: true });
            setTimeout(() => setToast({ show: false, message: '', isError: false }), 3000);
            return;
        }

        const today = new Date();
        const receiveDate = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

        // Payment Method অনুযায়ী Account Info সাজানো
        let accountInfo = {};
        if (paymentAccountType === 'Bank') {
            accountInfo = {
                bankName: selectedAccountInfo.bankName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
                accountBranch: selectedAccountInfo.accountBranch || '',
            };
        } else if (paymentAccountType === 'Mobile Banking') {
            accountInfo = {
                accountName: selectedAccountInfo.accountName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
            };
        } else {
            accountInfo = {
                accountName: 'Cash',
            };
        }

        const itemsPayload = purchaseItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal =
                (Number(item.buyPrice) || 0) * totalQty;
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);
            const rowSubtotal =
                roundTo2(rowGrossTotal - effectiveDiscount);

            return {
                productId: item.uniqueId,
                productName: item.productName,
                buyPrice: roundTo2(item.buyPrice),
                sellPrice: roundTo2(item.sellPrice),
                unit: item.unit || 'Pcs',
                parentMode: item.parentMode === true,
                subUnit: item.subUnit || '',
                pcsPerUnit: Number(item.pcsPerUnit) || 1,
                pcsPerSub: Number(item.pcsPerSub) || 0,
                unitQty: Number(item.unitQty) || 0,
                subQty: Number(item.subQty) || 0,
                pcsQty: Number(item.pcsQty) || 0,
                totalPcs: totalQty,
                freeUnitQty: Number(item.freeUnitQty) || 0,
                freeSubQty: Number(item.freeSubQty) || 0,
                freePcsQty: Number(item.freePcsQty) || 0,
                freeTotalQty: item.freeQty,
                discount: roundTo2(item.discount),
                discountType: item.discountType || 'amount',
                itemTotal: rowSubtotal,
            };
        });

        const receiveData = {
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            subTotal: subTotal,
            productWiseDiscount: productWiseDiscount,
            productWiseDiscountPercent: productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType: overallDiscountType,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            payableAmount: payableAmount,
            orderNote: orderNote,

            freeItems: freeItemsPayload,

            paidAmount: roundTo2(paymentAmount),
            receiveDate: receiveDate,

            returnItems: returnItemsPayload,
            ...(addReturnToAdjustment && returnTotalValue > 0 ? { returnAdjustmentAmount: returnTotalValue } : {}),
            damageItems: damageItemsPayload,
            ...(addDamageToAdjustment && damageTotalValue > 0 ? { damageAdjustmentAmount: damageTotalValue } : {}),
            unsetFields: [
                ...(addReturnToAdjustment && returnTotalValue > 0 ? [] : ['returnAdjustmentAmount']),
                ...(addDamageToAdjustment && damageTotalValue > 0 ? [] : ['damageAdjustmentAmount']),
            ],
            receiveStatus: 'Received',
            paymentMethod: paymentAccountType,
            paymentAccount: accountInfo,
            paymentNote: paymentNote,
        };

        try {
            setIsReceiving(true);
            const res = await fetch(`http://localhost:5000/purchase/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receiveData),
            });

            if (!res.ok) {
                throw new Error('Failed to receive purchase');
            }

            await res.json();

            clearPurchaseDrafts();
            setToast({
                show: true,
                message: 'Payment received successfully!',
                isError: false,
            });

            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error receiving purchase:', error);
            setIsReceiving(false);
            setToast({
                show: true,
                message: 'Failed to receive payment. Try again.',
                isError: true,
            });
            setTimeout(() => {
                setToast({ show: false, message: '', isError: false });
            }, 3000);
        }
    };

    return (
        <div>
            {/* Toast Notification */}
            {toast.show && (
                <div
                    className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-lg text-sm font-semibold text-white flex items-center gap-2 transition-all ${toast.isError ? 'bg-rose-600' : 'bg-gradient-to-br from-teal-600 to-emerald-500'
                        }`}
                >
                    {toast.isError ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    )}
                    {toast.message}
                </div>
            )}

            {/* -----------------------------------------
                Product Select Form
            ----------------------------------------- */}
            <fieldset disabled={isReturnOnly} className="contents"><PurchaseForm
                key={formResetKey}
                onAddProduct={handleAddProduct}
                addedProductIds={addedProductIds}
                onFormDataChange={handleFormDataChange}
                initialData={initialFormData}
                draftKey={draftPrefix}
                onCompanyClear={handleCompanyClear}
            />

                {/* -----------------------------------------
               Main Purchase Table
            ----------------------------------------- */}
            </fieldset>
            {/*
            ----------------------------------------- */}
            <div className="w-full px-0 sm:px-1 my-6 relative z-0">
                <div className="bg-white rounded-3xl shadow-xl shadow-teal-900/5 p-6 md:p-8 border border-teal-100/70">

                    <form onSubmit={handleSubmit}>
                        <fieldset disabled={isReturnOnly} className="contents">

                            {/* ---------------------------------
                            Product Table
                        --------------------------------- */}
                            <div className="rounded-2xl border border-teal-100">
                                <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                    <colgroup>
                                        <col style={{ width: '10%' }} />
                                        <col style={{ width: '9%' }} />
                                        <col style={{ width: '9%' }} />
                                        <col style={{ width: '9%' }} />
                                        <col style={{ width: '13%' }} />
                                        <col style={{ width: '7%' }} />
                                        <col style={{ width: '13%' }} />
                                        <col style={{ width: '7%' }} />
                                        <col style={{ width: '14%' }} />
                                        <col style={{ width: '5%' }} />
                                        <col style={{ width: '4%' }} />
                                    </colgroup>

                                    <thead>
                                        <tr className="bg-teal-50/60 border-b-2 border-teal-100 text-xs font-semibold text-teal-800">

                                            <th className="py-3 px-3">
                                                Product Name
                                            </th>

                                            <th className="py-3 px-3">
                                                Company
                                            </th>

                                            <th className="py-3 px-3">
                                                Buy Price
                                            </th>

                                            <th className="py-3 px-3">
                                                Sell Price
                                            </th>

                                            <th className="py-3 pl-4 pr-1">
                                                Unit Qty
                                            </th>

                                            <th className="py-3 pl-3 pr-2">
                                                PCS Qty
                                            </th>

                                            <th className="py-3 pl-4 pr-1">
                                                Free Unit
                                            </th>

                                            <th className="py-3 pl-3 pr-2">
                                                Free PCS
                                            </th>

                                            <th className="py-3 px-3">
                                                Discount
                                            </th>

                                            <th className="py-3 px-3">
                                                Item Total
                                            </th>

                                            <th className="py-3 px-3 text-center">
                                                Action
                                            </th>

                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100 text-sm">

                                        {purchaseItems.length > 0 ? (

                                            purchaseItems.map((item) => {

                                                // Row Subtotal
                                                const rowGrossTotal =
                                                    (Number(item.buyPrice) || 0) *
                                                    (Number(item.totalQty) || 0);

                                                const rowEffectiveDiscount =
                                                    item.discountType === 'percent'
                                                        ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                                                        : roundTo2(Number(item.discount) || 0);

                                                const rowDiscountPercent =
                                                    item.discountType === 'amount'
                                                        ? (rowGrossTotal > 0 ? roundTo2(((Number(item.discount) || 0) / rowGrossTotal) * 100) : 0)
                                                        : 0;

                                                const rowSubtotal =
                                                    roundTo2(rowGrossTotal - rowEffectiveDiscount);

                                                const currentUnitLabel =
                                                    item.unit || 'Pcs';

                                                return (
                                                    <tr
                                                        key={item.uniqueId}
                                                        className="hover:bg-teal-50/40 transition"
                                                    >

                                                        {/* Product Name */}
                                                        <td className="py-3 px-3">
                                                            <div className="font-semibold text-slate-800">
                                                                {item.productName}
                                                            </div>
                                                        </td>

                                                        {/* Company */}
                                                        <td className="py-3 px-3 text-slate-600">
                                                            {item.company}
                                                        </td>

                                                        {/* Buy Price */}
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.buyPrice}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;

                                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                        handleItemChange(
                                                                            item.uniqueId,
                                                                            'buyPrice',
                                                                            value
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                            />
                                                        </td>

                                                        {/* Sell Price */}
                                                        <td className="py-3 px-3">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                step="0.01"
                                                                value={item.sellPrice}
                                                                onChange={(e) => {
                                                                    const value = e.target.value;

                                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                        handleItemChange(
                                                                            item.uniqueId,
                                                                            'sellPrice',
                                                                            value
                                                                        );
                                                                    }
                                                                }}
                                                                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                            />
                                                        </td>

                                                        {/* Unit Qty */}
                                                        <td className="relative py-3 pl-2 pr-0">
                                                            <div
                                                                className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.totalQty) > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'
                                                                    }`}
                                                            >
                                                                Total: {item.totalQty}{(isReceiveMode || isReceivedEdit) && item.orderQty > 0 ? ` (Order: ${item.orderQty})` : ''}
                                                            </div>
                                                            <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl">
                                                                <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder="0"
                                                                        value={item.unitQty}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;

                                                                            if (/^\d*$/.test(value)) {
                                                                                handleItemChange(
                                                                                    item.uniqueId,
                                                                                    'unitQty',
                                                                                    value
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                    />

                                                                    <span
                                                                        className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                        title="Unit"
                                                                    >
                                                                        {currentUnitLabel}
                                                                    </span>

                                                                </div>
                                                                {item.parentMode && (
                                                                    <div className="mt-1.5 flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.subQty ?? ''}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleItemChange(item.uniqueId, 'subQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                        />
                                                                        <span
                                                                            className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                            title="Sub Unit"
                                                                        >
                                                                            {item.subUnit}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* PCS Qty */}
                                                        <td className="py-3 pl-0 pr-2">
                                                            <div className="p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1"
                                                                    placeholder="0"
                                                                    value={item.pcsQty}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;

                                                                        if (/^\d*$/.test(value)) {
                                                                            handleItemChange(
                                                                                item.uniqueId,
                                                                                'pcsQty',
                                                                                value
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Free Unit Qty */}
                                                        <td className="relative py-3 pl-2 pr-0">
                                                            <div
                                                                className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                                                                    }`}
                                                            >
                                                                Total: {item.freeQty}
                                                            </div>
                                                            <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                                <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder="0"
                                                                        value={item.freeUnitQty}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;

                                                                            if (/^\d*$/.test(value)) {
                                                                                handleItemChange(
                                                                                    item.uniqueId,
                                                                                    'freeUnitQty',
                                                                                    value
                                                                                );
                                                                            }
                                                                        }}
                                                                        className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                    />

                                                                    <span
                                                                        className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                        title="Unit"
                                                                    >
                                                                        {currentUnitLabel}
                                                                    </span>

                                                                </div>
                                                                {item.parentMode && (
                                                                    <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.freeSubQty ?? ''}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleItemChange(item.uniqueId, 'freeSubQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                        />
                                                                        <span
                                                                            className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                            title="Sub Unit"
                                                                        >
                                                                            {item.subUnit}
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        {/* Free PCS Qty */}
                                                        <td className="py-3 pl-0 pr-2">
                                                            <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="1"
                                                                    placeholder="0"
                                                                    value={item.freePcsQty}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;

                                                                        if (/^\d*$/.test(value)) {
                                                                            handleItemChange(
                                                                                item.uniqueId,
                                                                                'freePcsQty',
                                                                                value
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Discount */}
                                                        <td className="py-3 px-3 relative">
                                                            <div
                                                                className={`absolute top-1 left-11 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${(item.discountType === 'percent' ? rowEffectiveDiscount : rowDiscountPercent)
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-slate-100 text-slate-400'
                                                                    }`}
                                                            >
                                                                {item.discountType === 'percent'
                                                                    ? `৳${rowEffectiveDiscount.toFixed(2)}`
                                                                    : `${rowDiscountPercent.toFixed(2)}%`}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        handleToggleDiscountType(item.uniqueId)
                                                                    }
                                                                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                                                                    title="Click to toggle Amount / Percentage"
                                                                >
                                                                    {item.discountType === 'percent' ? '%' : '৳'}
                                                                </button>

                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="0"
                                                                    value={item.discount === 0 ? '' : item.discount}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;

                                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                            handleItemChange(
                                                                                item.uniqueId,
                                                                                'discount',
                                                                                value
                                                                            );
                                                                        }
                                                                    }}
                                                                    className="w-20 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                                                                />
                                                            </div>
                                                        </td>

                                                        {/* Row Subtotal */}
                                                        <td className="py-3 px-3 font-bold text-emerald-700">
                                                            {rowSubtotal.toFixed(2)}
                                                        </td>

                                                        {/* Action */}
                                                        <td className="py-3 px-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    handleRemoveItem(
                                                                        item.uniqueId
                                                                    )
                                                                }
                                                                className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition"
                                                            >
                                                                <svg
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    fill="none"
                                                                    viewBox="0 0 24 24"
                                                                    strokeWidth={1.5}
                                                                    stroke="currentColor"
                                                                    className="w-5 h-5"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                    />
                                                                </svg>
                                                            </button>
                                                        </td>

                                                    </tr>
                                                );
                                            })

                                        ) : (

                                            <tr>
                                                <td
                                                    colSpan="11"
                                                    className="text-center py-8 text-slate-400 text-sm"
                                                >
                                                    No products added yet.
                                                    Please select a company
                                                    and product above.
                                                </td>
                                            </tr>

                                        )}

                                    </tbody>
                                </table>
                            </div>


                            {/* =================================
    SUMMARY SECTION
================================= */}
                            <div className="mt-6 flex justify-end">

                                <div className="w-full md:w-[700px] space-y-2.5 bg-teal-50/40 border border-teal-100 rounded-2xl p-5">

                                    {/* Grand Total */}
                                    <div className="flex items-center">
                                        <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                            Subtotal
                                        </label>
                                        <input
                                            type="text"
                                            readOnly
                                            value={subTotal.toFixed(2)}
                                            className="flex-1 px-3 py-2 border border-slate-200 bg-slate-100 rounded-lg text-sm outline-none"
                                        />
                                    </div>

                                    {/* Product Wise Discount */}
                                    <div className="flex items-center">
                                        <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                            Product Wise Discount
                                        </label>

                                        <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">
                                            <input
                                                type="text"
                                                readOnly
                                                value={productWiseDiscount.toFixed(2)}
                                                className="flex-1 min-w-0 px-3 py-2 bg-slate-100 text-sm outline-none"
                                            />

                                            <input
                                                type="text"
                                                readOnly
                                                value={productWiseDiscountPercent ? `${productWiseDiscountPercent.toFixed(2)}%` : ''}
                                                placeholder="0%"
                                                title="Grand Total এর তুলনায় Discount percentage"
                                                className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600"
                                            />
                                        </div>
                                    </div>

                                    {/* Overall Discount */}
                                    <div className="flex items-center">

                                        <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                            Overall Discount
                                        </label>

                                        <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">

                                            {/* Overall Discount Amount */}
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={overallDiscountAmount === 0 ? '' : overallDiscountAmount}
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                        setOverallDiscountAmount(
                                                            value === '' ? '' : Number(value)
                                                        );
                                                    }
                                                }}
                                                className="flex-1 min-w-0 px-3 py-2 bg-white text-sm outline-none focus:bg-teal-50/30"
                                            />

                                            {overallDiscountType === 'percent' && (
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={overallDiscountValue ? overallDiscountValue.toFixed(2) : ''}
                                                    placeholder="৳0.00"
                                                    title="Discount amount in Taka"
                                                    className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                                />
                                            )}

                                            {overallDiscountType === 'amount' && (
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={overallDiscountPercent ? `${overallDiscountPercent.toFixed(2)}%` : ''}
                                                    placeholder="0%"
                                                    title="Discount percentage"
                                                    className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                                />
                                            )}

                                            {/* Amount / Percent Toggle */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setOverallDiscountType((prev) =>
                                                        prev === 'amount' ? 'percent' : 'amount'
                                                    )
                                                }
                                                className="w-16 shrink-0 border-l border-slate-200 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold transition cursor-pointer"
                                                title="Click to toggle Amount / Percentage"
                                            >
                                                {overallDiscountType === 'percent' ? '%' : '৳'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Adjustment */}
                                    <div className="flex items-center">

                                        <label className="w-56 text-right pr-3 text-sm font-medium text-slate-600">
                                            Adjustment
                                        </label>

                                        <div className="flex flex-1 rounded-lg overflow-hidden border border-slate-200">

                                            {/* Adjustment Text */}
                                            <input
                                                type="text"
                                                placeholder="Text"
                                                value={adjustmentText}
                                                onChange={(e) =>
                                                    setAdjustmentText(e.target.value)
                                                }
                                                className="flex-1 min-w-0 px-3 py-2 bg-white text-sm outline-none focus:bg-teal-50/30"
                                            />

                                            {/* Adjustment Amount */}
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0"
                                                value={adjustmentAmount === 0 ? '' : adjustmentAmount}
                                                onChange={(e) => {
                                                    const value = e.target.value;

                                                    if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                        setAdjustmentAmount(
                                                            value === '' ? '' : Number(value)
                                                        );
                                                    }
                                                }}
                                                className="w-28 shrink-0 px-3 py-2 border-l border-slate-200 bg-white text-sm outline-none focus:bg-teal-50/30"
                                            />

                                            {/* Adjustment Type */}
                                            <select
                                                value={adjustmentType}
                                                onChange={(e) =>
                                                    setAdjustmentType(e.target.value)
                                                }
                                                className="w-16 shrink-0 px-2 py-2 border-l border-slate-200 bg-white text-sm outline-none cursor-pointer"
                                            >
                                                <option value="+">+</option>
                                                <option value="-">-</option>
                                            </select>

                                        </div>
                                    </div>

                                    {/* Return Amount (Toggle On হলে দেখাবে) */}
                                    {addReturnToAdjustment && returnTotalValue > 0 && (
                                        <div className="flex items-center">
                                            <label className="w-56 text-right pr-3 text-sm font-medium text-violet-600">
                                                Return Products Amount
                                            </label>
                                            <input
                                                type="text"
                                                readOnly
                                                value={`- ৳${returnTotalValue.toFixed(2)}`}
                                                className="flex-1 px-3 py-2 border border-violet-200 bg-violet-50 text-violet-700 font-semibold rounded-lg text-sm outline-none"
                                            />
                                        </div>
                                    )}

                                    {/* Payable Amount */}
                                    <div className="flex items-center pt-2 mt-1 border-t border-teal-200">
                                        <label className="w-56 text-right pr-3 text-sm font-bold text-teal-800">
                                            Payable Amount
                                        </label>

                                        <input
                                            type="text"
                                            readOnly
                                            value={payableAmount.toFixed(2)}
                                            className="flex-1 px-3 py-2.5 border border-teal-200 bg-white font-bold text-emerald-700 text-base rounded-lg outline-none"
                                        />
                                    </div>

                                </div>
                            </div>


                            {/* =================================
                            OTHERS FREE PRODUCT
                        ================================= */}
                            <div className="mt-8">
                                <button
                                    type="button"
                                    onClick={() => setFreeProductOpen((prev) => !prev)}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition cursor-pointer"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                    </svg>
                                    Others Free Product
                                    {freeProductItems.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                            {freeProductItems.length}
                                        </span>
                                    )}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        strokeWidth={2}
                                        stroke="currentColor"
                                        className={`w-4 h-4 transition-transform duration-200 ${freeProductOpen ? 'rotate-180' : ''}`}
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {freeProductOpen && (
                                    <div className="mt-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                                        <h3 className="text-base font-bold text-emerald-800 mb-4">Others Free Product</h3>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <SearchSelect
                                                label="Filter by Category"
                                                placeholder="Search or select category..."
                                                searchValue={freeSearch.category}
                                                onSearchChange={(text) => setFreeSearch((prev) => ({ ...prev, category: text }))}
                                                onClear={handleClearFreeCategory}
                                                onSelect={handleSelectFreeCategory}
                                                items={filteredFreeCategories}
                                                getKey={(cat) => cat._id}
                                                emptyText="No active category found"
                                                renderItem={(cat) => (
                                                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                                )}
                                            />

                                            <SearchSelect
                                                label="Select Free Product"
                                                placeholder="Search or select product..."
                                                searchValue={freeSearch.product}
                                                onSearchChange={(text) => setFreeSearch((prev) => ({ ...prev, product: text }))}
                                                onClear={() => setFreeSearch((prev) => ({ ...prev, product: '' }))}
                                                onSelect={handleAddFreeProduct}
                                                items={filteredFreeProducts}
                                                getKey={(prod) => prod._id}
                                                emptyText="No matching product found"
                                                renderItem={(prod) => (
                                                    <div className="flex justify-between items-center gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">
                                                                Company: {prod.company}
                                                                {prod.category ? ` | Category: ${prod.category}` : ''}
                                                            </p>
                                                        </div>
                                                        {prod.sku && (
                                                            <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg font-medium border border-emerald-100 shrink-0">
                                                                SKU: {prod.sku}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {freeProductItems.length > 0 && (
                                            <div className="mt-6 overflow-x-auto rounded-2xl border border-emerald-200">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-emerald-100/70 border-b-2 border-emerald-200 text-xs font-semibold text-emerald-800">
                                                            <th className="py-3 px-3">Product Name</th>
                                                            <th className="py-3 px-3">Company</th>
                                                            <th className="py-3 px-3">Unit Qty</th>
                                                            <th className="py-3 px-3">PCS Qty</th>
                                                            <th className="py-3 px-3">Total Qty</th>
                                                            <th className="py-3 px-3">Sell Price (PCS)</th>
                                                            <th className="py-3 px-3">Item Total</th>
                                                            <th className="py-3 px-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-emerald-100 text-sm">
                                                        {freeProductItems.map((item) => (
                                                            <tr key={item.uniqueId} className="hover:bg-emerald-50/50 transition">
                                                                <td className="py-3 px-2 font-semibold text-slate-800">{item.productName}</td>
                                                                <td className="py-3 px-2 text-slate-600 text-xs">{item.company}</td>

                                                                <td className="py-3 pl-1 pr-0 w-40">
                                                                    <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                                        <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                value={item.unitQty}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (/^\d*$/.test(value)) {
                                                                                        handleFreeItemChange(item.uniqueId, 'unitQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center"
                                                                            />
                                                                            <span
                                                                                className="flex-1 bg-gradient-to-br from-emerald-500 to-green-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate"
                                                                                title="Unit"
                                                                            >
                                                                                {item.unit || 'Pcs'}
                                                                            </span>
                                                                        </div>
                                                                        {item.parentMode && (
                                                                            <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="1"
                                                                                    placeholder="0"
                                                                                    value={item.subQty ?? ''}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        if (/^\d*$/.test(value)) {
                                                                                            handleFreeItemChange(item.uniqueId, 'subQty', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                />
                                                                                <span
                                                                                    className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate"
                                                                                    title="Sub Unit"
                                                                                >
                                                                                    {item.subUnit}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 pl-0 pr-1 w-32">
                                                                    <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.pcsQty}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleFreeItemChange(item.uniqueId, 'pcsQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                                        />
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 px-2">
                                                                    <input
                                                                        type="number"
                                                                        readOnly
                                                                        value={item.totalQty}
                                                                        className="w-24 px-2 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm outline-none text-slate-600 cursor-not-allowed"
                                                                    />
                                                                </td>

                                                                <td className="relative py-3 px-2">
                                                                    <div
                                                                        className={`absolute top-1 left-4 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${getFreePcsTotal(item) > 0 ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}
                                                                    >
                                                                        ৳{getFreePcsTotal(item).toFixed(2)}
                                                                    </div>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        placeholder="0"
                                                                        disabled={!(Number(item.totalQty) > 0)}
                                                                        value={item.sellPricePcs}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                handleFreeItemChange(item.uniqueId, 'sellPricePcs', value);
                                                                            }
                                                                        }}
                                                                        className="w-24 px-2 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                                                    />
                                                                </td>

                                                                <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                                    {getFreeRowTotal(item).toFixed(2)}
                                                                </td>

                                                                <td className="py-3 px-1 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveFreeItem(item.uniqueId)}
                                                                        className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition"
                                                                    >
                                                                        <svg
                                                                            xmlns="http://www.w3.org/2000/svg"
                                                                            fill="none"
                                                                            viewBox="0 0 24 24"
                                                                            strokeWidth={1.5}
                                                                            stroke="currentColor"
                                                                            className="w-5 h-5"
                                                                        >
                                                                            <path
                                                                                strokeLinecap="round"
                                                                                strokeLinejoin="round"
                                                                                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                                                            />
                                                                        </svg>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* =================================
                          RETURN PRODUCT (Purchase Bulk Return)
                        ================================= */}
                        </fieldset>
                        {/*
                        ================================= */}
                        <div className="mt-8">
                            <button
                                type="button"
                                disabled={!hasMainProduct}
                                title={!hasMainProduct ? disabledTip : ''}
                                onClick={() => hasMainProduct && setReturnProductOpen((prev) => !prev)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-500 text-sm font-semibold text-white shadow-md shadow-violet-200 transition ${hasMainProduct ? 'hover:from-violet-600 hover:to-purple-600 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                                </svg>
                                Purchase Bulk Return
                                {returnItems.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                        {returnItems.length}
                                    </span>
                                )}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className={`w-4 h-4 transition-transform duration-200 ${returnProductOpen ? 'rotate-180' : ''}`}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </button>

                            {returnProductOpen && hasMainProduct && (
                                <div className="mt-4 bg-violet-50/50 border border-violet-100 rounded-2xl p-5 md:p-6">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                        <h3 className="text-base font-bold text-violet-800">Purchase Bulk Return</h3>

                                        <div className="flex items-center gap-2.5">
                                            <span className="text-xs font-semibold text-violet-700">
                                                Add to the Return Adjustment
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setAddReturnToAdjustment((prev) => !prev)}
                                                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${addReturnToAdjustment ? 'bg-violet-500' : 'bg-slate-300'}`}
                                            >
                                                <span
                                                    className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${addReturnToAdjustment ? 'translate-x-6' : 'translate-x-1'}`}
                                                />
                                            </button>
                                        </div>

                                        {returnItems.length > 0 && (
                                            <span className="px-4 py-1.5 rounded-full bg-violet-100 text-violet-700 text-sm font-bold border border-violet-200">
                                                Total Value: ৳{returnTotalValue.toFixed(2)}
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <SearchSelect
                                            label="Filter by Category"
                                            placeholder="Search or select category..."
                                            searchValue={returnSearch.category}
                                            onSearchChange={(text) => setReturnSearch((prev) => ({ ...prev, category: text }))}
                                            onClear={handleClearReturnCategory}
                                            onSelect={handleSelectReturnCategory}
                                            items={filteredReturnCategories}
                                            getKey={(cat) => cat._id}
                                            emptyText="No active category found"
                                            renderItem={(cat) => (
                                                <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                            )}
                                        />

                                        <SearchSelect
                                            label="Select Return Product"
                                            placeholder={purchaseFormData.company ? 'Search or select product...' : 'Select a company first...'}
                                            searchValue={returnSearch.product}
                                            onSearchChange={(text) => setReturnSearch((prev) => ({ ...prev, product: text }))}
                                            onClear={() => setReturnSearch((prev) => ({ ...prev, product: '' }))}
                                            onSelect={handleAddReturnProduct}
                                            items={filteredReturnProducts}
                                            getKey={(prod) => prod._id}
                                            emptyText={purchaseFormData.company ? 'No matching product found' : 'Please select a company first'}
                                            renderItem={(prod) => (
                                                <div className="flex justify-between items-center gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">
                                                            Company: {prod.company}
                                                            {prod.category ? ` | Category: ${prod.category}` : ''}
                                                        </p>
                                                    </div>
                                                    {prod.sku && (
                                                        <span className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-lg font-medium border border-violet-100 shrink-0">
                                                            SKU: {prod.sku}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        />
                                    </div>

                                    {returnItems.length > 0 && (
                                        <div className="mt-6 overflow-x-auto rounded-2xl border border-violet-200">
                                            <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                                <colgroup>
                                                    <col style={{ width: '12%' }} />
                                                    <col style={{ width: '9%' }} />
                                                    <col style={{ width: '14%' }} />
                                                    <col style={{ width: '9%' }} />
                                                    <col style={{ width: '14%' }} />
                                                    <col style={{ width: '9%' }} />
                                                    <col style={{ width: '12%' }} />
                                                    <col style={{ width: '16%' }} />
                                                    <col style={{ width: '5%' }} />
                                                </colgroup>
                                                <thead>
                                                    <tr className="bg-violet-100/70 border-b-2 border-violet-200 text-xs font-semibold text-violet-800">
                                                        <th className="py-3 px-3">Product Name</th>
                                                        <th className="py-3 px-3">Company</th>
                                                        <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                                        <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                                        <th className="py-3 pl-4 pr-1">Free Unit</th>
                                                        <th className="py-3 pl-3 pr-2">Free PCS</th>
                                                        <th className="py-3 px-3">Buy Price (PCS)</th>
                                                        <th className="py-3 px-3">Item Total</th>
                                                        <th className="py-3 px-3 text-center">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-violet-100 text-sm">
                                                    {returnItems.map((item) => (
                                                        <tr key={item.uniqueId} className="hover:bg-violet-50/40 transition">
                                                            <td className="py-3 px-2 font-semibold text-slate-800">{item.productName}</td>
                                                            <td className="py-3 px-2 text-slate-600 text-xs">{item.company}</td>

                                                            <td className="relative py-3 pl-2 pr-0 w-40">
                                                                <div
                                                                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.totalQty) > 0 ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-400'} after:content-[attr(data-stock)]`}
                                                                    data-stock={getStock(item) ? ` | Stock: ${getStock(item).paid}` : ' | Stock: ...'}
                                                                >
                                                                    Total: {item.totalQty}
                                                                </div>
                                                                <div className="p-1.5 bg-violet-50 border border-r-0 border-violet-200 rounded-l-2xl">
                                                                    <div className="flex items-center border border-violet-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.unitQty}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleReturnItemChange(item.uniqueId, 'unitQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                        />
                                                                        <span className="flex-1 bg-gradient-to-br from-violet-500 to-purple-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                            {item.unit || 'Pcs'}
                                                                        </span>
                                                                    </div>
                                                                    {item.parentMode && (
                                                                        <div className="mt-1.5 flex items-center border border-violet-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                value={item.subQty ?? ''}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (/^\d*$/.test(value)) {
                                                                                        handleReturnItemChange(item.uniqueId, 'subQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                            />
                                                                            <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                                {item.subUnit}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            <td className="py-3 pl-0 pr-2">
                                                                <div className="p-1.5 bg-violet-50 border border-l-0 border-violet-200 rounded-r-2xl">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder="0"
                                                                        value={item.pcsQty}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*$/.test(value)) {
                                                                                handleReturnItemChange(item.uniqueId, 'pcsQty', value);
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-2.5 rounded-xl border border-violet-200 bg-white text-sm outline-none shadow-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                                    />
                                                                </div>
                                                            </td>

                                                            <td className="relative py-3 pl-2 pr-0 w-40">
                                                                <div
                                                                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'} after:content-[attr(data-stock)]`}
                                                                    data-stock={getStock(item) ? ` | Stock: ${getStock(item).free}` : ' | Stock: ...'}
                                                                >
                                                                    Total: {item.freeQty}
                                                                </div>
                                                                <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                                    <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.freeUnitQty}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleReturnItemChange(item.uniqueId, 'freeUnitQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                        />
                                                                        <span className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                            {item.unit || 'Pcs'}
                                                                        </span>
                                                                    </div>
                                                                    {item.parentMode && (
                                                                        <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                value={item.freeSubQty ?? ''}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (/^\d*$/.test(value)) {
                                                                                        handleReturnItemChange(item.uniqueId, 'freeSubQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                            />
                                                                            <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                                {item.subUnit}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>

                                                            <td className="py-3 pl-0 pr-2">
                                                                <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="1"
                                                                        placeholder="0"
                                                                        value={item.freePcsQty}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*$/.test(value)) {
                                                                                handleReturnItemChange(item.uniqueId, 'freePcsQty', value);
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                                    />
                                                                </div>
                                                            </td>

                                                            <td className="py-3 px-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    value={item.buyPrice}
                                                                    onChange={(e) => {
                                                                        const value = e.target.value;
                                                                        if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                            handleReturnItemChange(item.uniqueId, 'buyPrice', value);
                                                                        }
                                                                    }}
                                                                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                                                                />
                                                            </td>

                                                            <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                                {getReturnRowTotal(item).toFixed(2)}
                                                            </td>

                                                            <td className="py-3 px-1 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRemoveReturnItem(item.uniqueId)}
                                                                    className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition"
                                                                >
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                    </svg>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* =================================
                           DAMAGE PRODUCT (এখন কিছু করবে না)
                        ================================= */}
                        <fieldset disabled={isReturnOnly} className="contents">
                            {/*
                        ================================= */}
                            <div className="mt-8">
                                <button
                                    type="button"
                                    disabled={!hasMainProduct}
                                    title={!hasMainProduct ? disabledTip : ''}
                                    onClick={() => hasMainProduct && setDamageProductOpen((prev) => !prev)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-sm font-semibold text-white shadow-md shadow-red-200 transition ${hasMainProduct ? 'hover:from-red-600 hover:to-rose-700 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                    </svg>
                                    Damage Product
                                    {damageItems.length > 0 && (
                                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                                            {damageItems.length}
                                        </span>
                                    )}
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 transition-transform duration-200 ${damageProductOpen ? 'rotate-180' : ''}`}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                    </svg>
                                </button>

                                {damageProductOpen && hasMainProduct && (
                                    <div className="mt-4 bg-red-50/50 border border-red-100 rounded-2xl p-5 md:p-6">
                                        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                            <h3 className="text-base font-bold text-red-800">Damage Product</h3>

                                            <div className="flex items-center gap-2.5">
                                                <span className="text-xs font-semibold text-red-700">
                                                    Add to the Damage Adjustment
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setAddDamageToAdjustment((prev) => !prev)}
                                                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors cursor-pointer ${addDamageToAdjustment ? 'bg-red-500' : 'bg-slate-300'}`}
                                                >
                                                    <span
                                                        className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${addDamageToAdjustment ? 'translate-x-6' : 'translate-x-1'}`}
                                                    />
                                                </button>
                                            </div>

                                            {damageItems.length > 0 && (
                                                <span className="px-4 py-1.5 rounded-full bg-red-100 text-red-700 text-sm font-bold border border-red-200">
                                                    Total Value: ৳{damageTotalValue.toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <SearchSelect
                                                label="Filter by Category"
                                                placeholder="Search or select category..."
                                                searchValue={damageSearch.category}
                                                onSearchChange={(text) => setDamageSearch((prev) => ({ ...prev, category: text }))}
                                                onClear={handleClearDamageCategory}
                                                onSelect={handleSelectDamageCategory}
                                                items={filteredDamageCategories}
                                                getKey={(cat) => cat._id}
                                                emptyText="No active category found"
                                                renderItem={(cat) => (
                                                    <p className="text-sm font-semibold text-slate-800">{cat.name}</p>
                                                )}
                                            />

                                            <SearchSelect
                                                label="Select Damage Product"
                                                placeholder={purchaseFormData.company ? 'Search or select product...' : 'Select a company first...'}
                                                searchValue={damageSearch.product}
                                                onSearchChange={(text) => setDamageSearch((prev) => ({ ...prev, product: text }))}
                                                onClear={() => setDamageSearch((prev) => ({ ...prev, product: '' }))}
                                                onSelect={handleAddDamageProduct}
                                                items={filteredDamageProducts}
                                                getKey={(s) => s.key}
                                                emptyText={purchaseFormData.company ? 'No damage stock found' : 'Please select a company first'}
                                                renderItem={(s) => (
                                                    <div className="flex justify-between items-center gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-800">{s.productName}</p>
                                                            <p className="text-xs text-slate-500 mt-0.5">Company: {s.company}</p>
                                                        </div>
                                                        <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-medium border border-red-100 shrink-0">
                                                            Main: {s.paid} | Free: {s.free}
                                                        </span>
                                                    </div>
                                                )}
                                            />
                                        </div>

                                        {damageItems.length > 0 && (
                                            <div className="mt-6 overflow-x-auto rounded-2xl border border-red-200">
                                                <table className="w-full table-fixed text-left border-collapse [&_td>input]:w-full [&_td_input]:min-w-0">
                                                    <colgroup>
                                                        <col style={{ width: '12%' }} />
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '14%' }} />
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '14%' }} />
                                                        <col style={{ width: '9%' }} />
                                                        <col style={{ width: '12%' }} />
                                                        <col style={{ width: '16%' }} />
                                                        <col style={{ width: '5%' }} />
                                                    </colgroup>
                                                    <thead>
                                                        <tr className="bg-red-100/70 border-b-2 border-red-200 text-xs font-semibold text-red-800">
                                                            <th className="py-3 px-3">Product Name</th>
                                                            <th className="py-3 px-3">Company</th>
                                                            <th className="py-3 pl-4 pr-1">Unit Qty</th>
                                                            <th className="py-3 pl-3 pr-2">PCS Qty</th>
                                                            <th className="py-3 pl-4 pr-1">Free Unit</th>
                                                            <th className="py-3 pl-3 pr-2">Free PCS</th>
                                                            <th className="py-3 px-3">Buy Price (PCS)</th>
                                                            <th className="py-3 px-3">Item Total</th>
                                                            <th className="py-3 px-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-red-100 text-sm">
                                                        {damageItems.map((item) => (
                                                            <tr key={item.uniqueId} className="hover:bg-red-50/40 transition">
                                                                <td className="py-3 px-2 font-semibold text-slate-800">{item.productName}</td>
                                                                <td className="py-3 px-2 text-slate-600 text-xs">{item.company}</td>

                                                                <td className="relative py-3 pl-2 pr-0 w-40">
                                                                    <div
                                                                        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.totalQty) > 0 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-400'}`}
                                                                    >
                                                                        Total: {item.totalQty} | Stock: {getDamageStock(item) ? getDamageStock(item).paid : '...'}
                                                                    </div>
                                                                    <div className="p-1.5 bg-red-50 border border-r-0 border-red-200 rounded-l-2xl">
                                                                        <div className="flex items-center border border-red-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                value={item.unitQty}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (/^\d*$/.test(value)) {
                                                                                        handleDamageItemChange(item.uniqueId, 'unitQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                            />
                                                                            <span className="flex-1 bg-gradient-to-br from-red-500 to-rose-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                                {item.unit || 'Pcs'}
                                                                            </span>
                                                                        </div>
                                                                        {item.parentMode && (
                                                                            <div className="mt-1.5 flex items-center border border-red-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="1"
                                                                                    placeholder="0"
                                                                                    value={item.subQty ?? ''}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        if (/^\d*$/.test(value)) {
                                                                                            handleDamageItemChange(item.uniqueId, 'subQty', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                />
                                                                                <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                                    {item.subUnit}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 pl-0 pr-2">
                                                                    <div className="p-1.5 bg-red-50 border border-l-0 border-red-200 rounded-r-2xl">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.pcsQty}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleDamageItemChange(item.uniqueId, 'pcsQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-full px-3 py-2.5 rounded-xl border border-red-200 bg-white text-sm outline-none shadow-sm focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                                                        />
                                                                    </div>
                                                                </td>

                                                                <td className="relative py-3 pl-2 pr-0 w-40">
                                                                    <div
                                                                        className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${Number(item.freeQty) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                                                                    >
                                                                        Total: {item.freeQty} | Stock: {getDamageStock(item) ? getDamageStock(item).free : '...'}
                                                                    </div>
                                                                    <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
                                                                        <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                step="1"
                                                                                placeholder="0"
                                                                                value={item.freeUnitQty}
                                                                                onChange={(e) => {
                                                                                    const value = e.target.value;
                                                                                    if (/^\d*$/.test(value)) {
                                                                                        handleDamageItemChange(item.uniqueId, 'freeUnitQty', value);
                                                                                    }
                                                                                }}
                                                                                className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                            />
                                                                            <span className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                                {item.unit || 'Pcs'}
                                                                            </span>
                                                                        </div>
                                                                        {item.parentMode && (
                                                                            <div className="mt-1.5 flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                                <input
                                                                                    type="number"
                                                                                    min="0"
                                                                                    step="1"
                                                                                    placeholder="0"
                                                                                    value={item.freeSubQty ?? ''}
                                                                                    onChange={(e) => {
                                                                                        const value = e.target.value;
                                                                                        if (/^\d*$/.test(value)) {
                                                                                            handleDamageItemChange(item.uniqueId, 'freeSubQty', value);
                                                                                        }
                                                                                    }}
                                                                                    className="w-20 px-2 py-2.5 bg-transparent text-sm outline-none text-center"
                                                                                />
                                                                                <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-1 py-2.5 text-center font-semibold select-none truncate">
                                                                                    {item.subUnit}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 pl-0 pr-2">
                                                                    <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="1"
                                                                            placeholder="0"
                                                                            value={item.freePcsQty}
                                                                            onChange={(e) => {
                                                                                const value = e.target.value;
                                                                                if (/^\d*$/.test(value)) {
                                                                                    handleDamageItemChange(item.uniqueId, 'freePcsQty', value);
                                                                                }
                                                                            }}
                                                                            className="w-full px-3 py-2.5 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                                                                        />
                                                                    </div>
                                                                </td>

                                                                <td className="py-3 px-2">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        step="0.01"
                                                                        value={item.buyPrice}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value;
                                                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                                handleDamageItemChange(item.uniqueId, 'buyPrice', value);
                                                                            }
                                                                        }}
                                                                        className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100"
                                                                    />
                                                                </td>

                                                                <td className="py-3 px-2 font-bold text-emerald-700 whitespace-nowrap">
                                                                    {getDamageRowTotal(item).toFixed(2)}
                                                                </td>

                                                                <td className="py-3 px-1 text-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveDamageItem(item.uniqueId)}
                                                                        className="text-rose-500 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-50 transition"
                                                                    >
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                                                        </svg>
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="mt-8">

                                <label className="block text-sm font-semibold text-slate-700 mb-2">
                                    Order Note
                                </label>

                                <textarea
                                    rows="3"
                                    placeholder="Write any note about this purchase..."
                                    value={orderNote}
                                    onChange={(e) =>
                                        setOrderNote(e.target.value)
                                    }
                                    className="w-full  px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 resize-y shadow-sm"
                                />

                            </div>

                            {/* =================================
                            PAYMENT (Receive Mode Only)
                        ================================= */}
                            {showPayment && (
                                <div className="mt-8 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-bold text-emerald-800">Payment</h3>
                                            {isPurchaseStage && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentSkipped((prev) => !prev)}
                                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${paymentSkipped
                                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                                        : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                                        }`}
                                                >
                                                    {paymentSkipped ? 'Undo' : 'Skip'}
                                                </button>
                                            )}
                                        </div>

                                        <label
                                            className={`flex items-center gap-2 text-sm font-semibold ${paymentAccountType && selectedAccountKey ? 'text-emerald-700 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}
                                            title={paymentAccountType && selectedAccountKey ? '' : 'আগে Payment Method ও Account select করুন'}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={savePaymentMethod}
                                                disabled={paymentSkipped || !(paymentAccountType && selectedAccountKey)}
                                                onChange={(e) => handleSavePaymentToggle(e.target.checked)}
                                                className="w-4 h-4 accent-emerald-600 disabled:cursor-not-allowed"
                                            />
                                            Save Payment Method
                                        </label>
                                    </div>

                                    <div className={paymentSkipped ? 'opacity-50 pointer-events-none' : ''}>
                                        <fieldset disabled={paymentSkipped} className="contents">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                                                {/* Payment Amount */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Payment Amount <span className="text-rose-500">*</span>
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={paymentAmount}
                                                        onChange={(e) => {
                                                            const value = e.target.value;

                                                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                                setPaymentAmount(value);
                                                                setPaymentAmountTouched(true);
                                                                setPaymentManual(true);
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                                                    />
                                                </div>

                                                {/* Payment Method */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Payment Method <span className="text-rose-500">*</span>
                                                    </label>
                                                    <select
                                                        value={paymentAccountType}
                                                        onChange={(e) => {
                                                            setPaymentAccountType(e.target.value);
                                                            setSelectedAccountKey('');
                                                            if (savePaymentMethod) {
                                                                setSavePaymentMethod(false);
                                                                persistPaymentMethod(false, '', '');
                                                            }
                                                        }}
                                                        className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm cursor-pointer"
                                                    >
                                                        <option value="">Select method...</option>
                                                        {accountTypes.map((type) => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Account Selection */}
                                                <div>
                                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                        Account <span className="text-rose-500">*</span>
                                                    </label>
                                                    <select
                                                        value={selectedAccountKey}
                                                        onChange={(e) => {
                                                            setSelectedAccountKey(e.target.value);
                                                            if (savePaymentMethod) {
                                                                persistPaymentMethod(true, paymentAccountType, e.target.value);
                                                            }
                                                        }}
                                                        disabled={!paymentAccountType}
                                                        className={`w-full px-4 py-3.5 rounded-2xl border text-sm outline-none shadow-sm ${paymentAccountType
                                                            ? 'border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 cursor-pointer'
                                                            : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                                                            }`}
                                                    >
                                                        <option value="">
                                                            {paymentAccountType ? 'Select account...' : 'Select method first'}
                                                        </option>
                                                        {uniqueAccounts.map((inv) => {
                                                            const key = getAccountKey(inv);
                                                            const label =
                                                                inv.accountType === 'Bank'
                                                                    ? `${inv.bankName} - ${inv.accountNumber} (${inv.accountBranch})`
                                                                    : inv.accountType === 'Mobile Banking'
                                                                        ? `${inv.accountName} - ${inv.accountNumber}`
                                                                        : 'Cash';
                                                            return (
                                                                <option key={key} value={key}>{label}</option>
                                                            );
                                                        })}
                                                    </select>
                                                </div>
                                            </div>

                                        </fieldset>
                                    </div>

                                    {/* Payment Note (Optional) */}
                                    <div className="mt-6">
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                                            Payment Note <span className="text-slate-400 font-normal">(Optional)</span>
                                        </label>
                                        <textarea
                                            rows="2"
                                            placeholder="Write any note about this payment..."
                                            value={paymentNote}
                                            onChange={(e) => setPaymentNote(e.target.value)}
                                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 resize-y shadow-sm"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* =================================
                           SUBMIT / RECEIVE BUTTON
                        ================================= */}
                        </fieldset>
                        {/*
                        ================================= */}
                        <div className="mt-6 flex justify-end">

                            {isReceiveMode ? (
                                <button
                                    type="button"
                                    onClick={handleReceiveSubmit}
                                    disabled={isReceiving}
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 hover:from-emerald-700 hover:to-teal-600 text-sm font-semibold text-white shadow-md shadow-emerald-200 transition cursor-pointer"
                                >
                                    Receive
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-10 py-3 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-500 hover:from-teal-700 hover:to-emerald-600 text-sm font-semibold text-white shadow-md shadow-teal-200 transition cursor-pointer"
                                >
                                    {isReturnOnly ? 'Update Return' : isEditMode ? 'Update Purchase' : 'Purchase'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PurchaseAdd;