import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PurchaseForm from "./PurchaseForm";
import useDraftState, { clearDraft } from '../../../../hooks/useDraftState';
import { fetchCompanyBalance } from '../../Software/Contact/Company/CompanyAccountAc';
import useCan from '../../../../hooks/useCan';
import hotToast from 'react-hot-toast';
import {
    getAccountAvailable,
    matchesSearch,
    PurchaseAddStyle,
    MainTableSection,
    SummarySection,
    FreeProductSection,
} from './PurchaseAddOne';
import {
    ReturnSection,
    DamageSection,
    OrderNoteSection,
    PaymentSection,
} from './PurchaseAddTwo';

const QTY_FIELDS = ['unitQty', 'subQty', 'pcsQty', 'freeUnitQty', 'freeSubQty', 'freePcsQty'];

// Toast helper
const toastErr = (message) => hotToast.error(message);
const toastOk = (message) => hotToast.success(message);

const PurchaseAddInner = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editingPurchase = location.state?.purchase || null;
    const isReceiveMode = location.state?.mode === 'receive';
    const isReturnOnly = location.state?.returnOnly === true;
    // Received purchase er original order edit (save korle Receive page e jabe)
    const isOrderEdit = !!editingPurchase && location.state?.mode === 'orderEdit';
    const itemsSource = isOrderEdit ? (editingPurchase?.orderSnapshot || editingPurchase) : editingPurchase;
    const isReceivedEdit =
        !!editingPurchase &&
        location.state?.mode !== 'receive' &&
        location.state?.mode !== 'orderEdit' &&
        (editingPurchase.receiveStatus === 'Received' || editingPurchase.receiveStatus === 'Yes');
    const isPurchaseStage = !isReceiveMode && !isReceivedEdit;
    // Receive korar por Edit korleo Receive er moto original order er limit kaj korbe
    const isLimitMode = isReceiveMode || isReceivedEdit;
    const hasPriorPayment =
        !!editingPurchase &&
        editingPurchase.paidAmount !== undefined &&
        editingPurchase.paidAmount !== null &&
        editingPurchase.paidAmount !== '' &&
        !!editingPurchase.paymentMethod;
    const showPayment = !isOrderEdit;
    const [isEditMode] = useState(!!editingPurchase);
    const [editId] = useState(editingPurchase?._id || null);

    // Button permission (R7 #7, #8): new = purchase_add post, edit/receive = purchase_all put
    const { canAdd: canAddPurchase } = useCan('purchase_add');
    const { canEdit: canEditPurchase } = useCan('purchase_all');
    const noPurchasePermission = editingPurchase ? !canEditPurchase : !canAddPurchase;
    const denyPurchaseToast = () => toastErr('আপনার Add / Edit / Delete করার অনুমতি নেই!');

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
    );
    const [paymentAccountType, setPaymentAccountType] = useState('');
    const [selectedAccountKey, setSelectedAccountKey] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [isReceiving, setIsReceiving] = useState(false);
    const submitLock = useRef(false);

    // Receive Date (default: ajker date, edit korle ager receive date)
    const formatDisplayDate = (d) =>
        d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const [receiveDateValue, setReceiveDateValue] = useState(
        editingPurchase?.receiveDate || formatDisplayDate(new Date())
    );
    const receiveDateInputRef = useRef(null);
    const handleReceiveDateChange = (e) => {
        const raw = e.target.value; // yyyy-mm-dd
        if (raw) {
            const [y, m, d] = raw.split('-');
            setReceiveDateValue(formatDisplayDate(new Date(y, m - 1, d)));
        }
    };
    const paymentSectionRef = useRef(null);

    // Receive mode e page open hole Payment section e auto scroll
    useEffect(() => {
        if (!isReceiveMode) return;
        const timer = setTimeout(() => {
            paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 400);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                const num = (v) => Number(v) || 0;

                // ---- Damage invoice gulo (stock in) ----
                const invs = [];
                (Array.isArray(sales) ? sales : [])
                    .filter((s) => s.status === 'Delivered' && (s.damageItems || []).length > 0)
                    .forEach((s) => invs.push({ ts: Date.parse(s.damageAt || s.createdAt) || 0, items: s.damageItems || [] }));
                (Array.isArray(dmg) ? dmg : []).forEach((d) =>
                    invs.push({ ts: Date.parse(d.createdAt) || 0, items: d.items || [] })
                );
                invs.sort((a, b) => a.ts - b.ts);

                const groups = new Map();
                const lineMap = new Map();
                invs.forEach((inv) => {
                    const m = new Map();
                    inv.items.forEach((it) => {
                        const key = damageKey(it.productName, it.company);
                        if (!m.has(key)) m.set(key, { ts: inv.ts, main: 0, free: 0, retMain: 0, retFree: 0 });
                        const l = m.get(key);
                        l.main += num(it.totalQty);
                        l.free += num(it.freeQty);
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
                    if (editId && String(p._id) === String(editId)) return;
                    if (!(p.receiveStatus === 'Received' || p.receiveStatus === 'Yes')) return;
                    if (!(p.damageItems || []).length) return;
                    evs.push({ ts: Date.parse(p.damageAt || p.createdAt) || 0, items: p.damageItems || [] });
                });
                (Array.isArray(damageReturns) ? damageReturns : []).forEach((r) =>
                    evs.push({ ts: Date.parse(r.createdAt) || 0, items: r.items || [] })
                );
                evs.sort((a, b) => a.ts - b.ts);
                evs.forEach((ev) =>
                    ev.items.forEach((it) => {
                        let m = num(it.totalQty);
                        let f = num(it.freeQty);
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

                setDamageStockList(
                    Array.from(groups.values()).map((g) => {
                        let paid = 0;
                        let free = 0;
                        (lineMap.get(g.key) || []).forEach((l) => {
                            paid += Math.max(l.main - l.retMain, 0);
                            free += Math.max(l.free - l.retFree, 0);
                        });
                        return { ...g, paid, free };
                    })
                );
            })
            .catch((error) => console.error('Error fetching damage stock:', error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------------- Previous Due / Get (Company Account theke) ----------------
    const [prevBalance, setPrevBalance] = useState({ amount: 0, type: '' }); // type: 'Due' | 'Get' | ''
    const [usePrevBalance, setUsePrevBalance] = useState(false);
    useEffect(() => {
        const company = (purchaseFormData.company || '').toString().trim();
        if (!company) {
            setPrevBalance({ amount: 0, type: '' });
            return;
        }
        let cancelled = false;
        fetchCompanyBalance(company, editId).then((b) => {
            if (cancelled) return;
            setPrevBalance({ amount: b.amount, type: b.type });
        });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [purchaseFormData.company]);

    // Bulk Return stock (main / free)
    const [stockMap, setStockMap] = useState(null);
    useEffect(() => {
        fetch(`http://localhost:5000/bulk-return-stock${location.state?.bulkId ? `?excludeId=${location.state.bulkId}` : ''}`)
            .then((res) => res.json())
            .then((d) => setStockMap(d && typeof d === 'object' ? d : {}))
            .catch((error) => console.error('Error fetching bulk return stock:', error));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const getStock = (item) =>
        stockMap
            ? stockMap[String(item._id)] || stockMap[`name:${item.productName}`] || { paid: 0, free: 0 }
            : null;

    // PurchaseForm-কে দেওয়ার জন্য stable initialData
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
    const restorePayment = (ep) => {
        setPaymentAmount(ep.paidAmount ?? '');
        setPaymentAmountTouched(true);
        setPaymentAccountType(ep.paymentMethod || '');
        setPaymentNote(ep.paymentNote || '');
        const pa = ep.paymentAccount || {};
        if (ep.paymentMethod === 'Bank') {
            setSelectedAccountKey(`${pa.bankName}-${pa.accountNumber}-${pa.accountBranch}`);
        } else if (ep.paymentMethod === 'Mobile Banking') {
            setSelectedAccountKey(`${pa.accountName}-${pa.accountNumber}`);
        } else {
            setSelectedAccountKey('cash');
        }
    };

    useEffect(() => {
        if (editingPurchase) {
            const mappedItems = (itemsSource.items || []).map((item, index) => {
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
                const baseFreeUnitQty = qtyNum > 0 ? freeUnitQtyNum / qtyNum : 0;
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
            setUsePrevBalance(Number(editingPurchase.previousBalanceAmount) > 0);

            if (hasPriorPayment || isReceivedEdit) {
                restorePayment(editingPurchase);
            }

            const restoredFreeItems = (itemsSource.freeItems || []).map((item, index) => {
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
            if (restoredReturnItems.length > 0) setReturnProductOpen(true);
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
            if (restoredDamageItems.length > 0) setDamageProductOpen(true);
            setAddDamageToAdjustment(Number(editingPurchase.damageAdjustmentAmount) > 0);
            if (restoredFreeItems.length > 0) setFreeProductOpen(true);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Investment Accounts fetch
    useEffect(() => {
        if (showPayment) {
            fetch('http://localhost:5000/investment')
                .then((res) => res.json())
                .then((data) => setInvestments(Array.isArray(data) ? data : []))
                .catch((error) => console.error('Error fetching investments:', error));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Number কে সবসময় 2 digit পর্যন্ত Round করার Helper
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
    const showLimitToast = (message) => toastErr(message);

    // Others Free Product — Category / Product fetch
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
        if (isLimitMode && !getOrderFreeItem(product.productName)) {
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
        if (isLimitMode && ['unitQty', 'subQty', 'pcsQty'].includes(field)) {
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
        if (cur && QTY_FIELDS.includes(field)) {
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
                    toastErr(stockError);
                    return;
                }
            }
        }
        if (value !== '' && Number(value) < 0) return;

        setReturnItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;

                if (QTY_FIELDS.includes(field)) {
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
                        const q = Number(numVal) || 0;
                        next.freeUnitQty = q * (Number(item.baseFreeUnitQty) || 0) || '';
                        next.freeSubQty = q * (Number(item.baseFreeSubQty) || 0) || '';
                        next.freePcsQty = q * (Number(item.baseFreePcsQty) || 0) || '';
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
        const retStock = getStock(prod);
        if (!retStock || (retStock.paid <= 0 && retStock.free <= 0)) return false;
        if (returnFilter.category && prod.category !== returnFilter.category) return false;

        const isAlreadyAddedInReturn = returnItems.some(
            (item) => item._id === prod._id || item.productName === prod.productName
        );
        if (isAlreadyAddedInReturn) return false;

        return matchesSearch(returnSearch.product, [prod.productName, prod.sku]);
    });

    // Return / Damage payload (same shape)
    const buildReturnLikePayload = (items, getRowTotal) =>
        items.map((item) => ({
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
            itemTotal: roundTo2(getRowTotal(item)),
        }));

    const returnItemsPayload = buildReturnLikePayload(returnItems, getReturnRowTotal);

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
        const cur = damageItems.find((i) => i.uniqueId === uniqueId);
        if (cur && QTY_FIELDS.includes(field)) {
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
                    toastErr(stockError);
                    return;
                }
            }
        }

        setDamageItems((prev) =>
            prev.map((item) => {
                if (item.uniqueId !== uniqueId) return item;
                if (QTY_FIELDS.includes(field)) {
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

    const damageItemsPayload = buildReturnLikePayload(damageItems, getDamageRowTotal);

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

    // Invoice Number Generate (YYMMDDHHMMSS - 24hr, no separators)
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

    // PurchaseForm Data Update
    const handleFormDataChange = (data) => setPurchaseFormData(data);

    // Company select kete dile table a add kra shob product remove hbe
    const handleCompanyClear = () => {
        setPurchaseItems([]);
        setReturnItems([]);
        setDamageItems([]);
    };

    // --------------------------------------------------
    // Product Add / Remove
    // --------------------------------------------------
    const handleAddProduct = (product) => {
        if (isLimitMode && !getOrderItem(product.productName)) {
            showLimitToast('Receive er somoy notun product add kora jabe na!');
            return;
        }
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
            pcsPerSub,
            subQty: '',
            freeSubQty: '',
            baseFreeSubQty,

            unitQty: '',
            pcsQty: '',
            pcsPerUnit,
            totalQty: 0,

            freeUnitQty: '',
            freePcsQty: '',
            freeQty: 0,

            baseFreeUnitQty,
            baseFreePcsQty,

            discount: 0,
            discountType: 'amount', // 'amount' | 'percent'
            orderQty: Number(getOrderItem(product.productName)?.totalPcs) || 0,
        };

        setPurchaseItems((prev) => [...prev, newItem]);
    };

    const handleRemoveItem = (uniqueId) => {
        setPurchaseItems((prev) => prev.filter((item) => item.uniqueId !== uniqueId));
    };

    // --------------------------------------------------
    // Item Change
    // --------------------------------------------------
    const handleItemChange = (uniqueId, field, value) => {
        if (isLimitMode && QTY_FIELDS.includes(field)) {
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
                if (item.uniqueId !== uniqueId) return item;

                if (QTY_FIELDS.includes(field)) {
                    const numVal = value === '' ? '' : Number(value) || 0;
                    const next = { ...item, [field]: numVal };
                    const ppu = Number(next.pcsPerUnit) || 1;
                    const pps = Number(next.pcsPerSub) || 0;
                    next.totalQty =
                        (Number(next.unitQty) || 0) * ppu +
                        (Number(next.subQty) || 0) * pps +
                        (Number(next.pcsQty) || 0);
                    if (item.parentMode) {
                        // Parent Qty → Free Sub + Free Pcs, Sub Qty → শুধু Free Pcs
                        if (field === 'unitQty' || field === 'subQty') {
                            const u = Number(next.unitQty) || 0;
                            const s = Number(next.subQty) || 0;
                            next.freeSubQty = u * (Number(item.baseFreeSubQty) || 0) || '';
                            next.freePcsQty = (u + s) * (Number(item.baseFreePcsQty) || 0) || '';
                        }
                    } else if (field === 'unitQty') {
                        const q = Number(numVal) || 0;
                        next.freeUnitQty = q * (Number(item.baseFreeUnitQty) || 0) || '';
                        next.freeSubQty = q * (Number(item.baseFreeSubQty) || 0) || '';
                        next.freePcsQty = q * (Number(item.baseFreePcsQty) || 0) || '';
                    }
                    next.freeQty =
                        (Number(next.freeUnitQty) || 0) * ppu +
                        (Number(next.freeSubQty) || 0) * pps +
                        (Number(next.freePcsQty) || 0);
                    return next;
                }

                if (field === 'freeQty' || field === 'discount') {
                    return { ...item, [field]: value === '' ? '' : Number(value) };
                }

                return { ...item, [field]: value };
            })
        );
    };

    // Discount Type Toggle (Amount / Percent)
    const handleToggleDiscountType = (uniqueId) => {
        setPurchaseItems((prev) =>
            prev.map((item) =>
                item.uniqueId !== uniqueId
                    ? item
                    : { ...item, discountType: item.discountType === 'percent' ? 'amount' : 'percent' }
            )
        );
    };

    const addedProductIds = purchaseItems.map((item) => item.productName || item._id);

    // --------------------------------------------------
    // Payment Account helpers
    // --------------------------------------------------
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
            const key = getAccountKey(inv);
            if (!uniqueAccountsMap.has(key)) uniqueAccountsMap.set(key, inv);
        });
    const uniqueAccounts = Array.from(uniqueAccountsMap.values());

    const selectedAccountInfo = uniqueAccounts.find(
        (inv) => getAccountKey(inv) === selectedAccountKey
    );

    // Payment Method অনুযায়ী Account Info সাজানো
    const buildAccountInfo = () => {
        if (paymentAccountType === 'Bank') {
            return {
                bankName: selectedAccountInfo.bankName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
                accountBranch: selectedAccountInfo.accountBranch || '',
            };
        }
        if (paymentAccountType === 'Mobile Banking') {
            return {
                accountName: selectedAccountInfo.accountName || '',
                accountNumber: selectedAccountInfo.accountNumber || '',
            };
        }
        return { accountName: 'Cash' };
    };

    // --------------------------------------------------
    // TOTAL CALCULATIONS
    // --------------------------------------------------
    const subTotal = roundTo2(
        purchaseItems.reduce(
            (total, item) => total + (Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0),
            0
        )
    );

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

    const productWiseDiscountPercent =
        subTotal > 0 ? roundTo2((productWiseDiscount / subTotal) * 100) : 0;

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

    const adjustmentValue = Number(adjustmentAmount) || 0;

    let payableAmount = afterProductDiscount - overallDiscountValue;
    payableAmount += adjustmentType === '+' ? adjustmentValue : -adjustmentValue;

    const returnTotalValue = roundTo2(
        returnItems.reduce((total, item) => total + getReturnRowTotal(item), 0)
    );

    if (addReturnToAdjustment) payableAmount -= returnTotalValue;
    if (addDamageToAdjustment) payableAmount -= damageTotalValue;

    // Previous Due / Get (checkbox tik thakle)
    const prevApplied = usePrevBalance && prevBalance.amount > 0;
    if (prevApplied) {
        if (prevBalance.type === 'Due') payableAmount += prevBalance.amount;
        else if (prevBalance.type === 'Get') payableAmount -= prevBalance.amount;
    }

    payableAmount = roundTo2(payableAmount);

    // Payment Amount লাইভ Payable Amount এর সাথে sync (ইউজার হাতে edit না করা পর্যন্ত)
    useEffect(() => {
        const autoSync =
            isPurchaseStage && hasPriorPayment ? !paymentManual : !paymentAmountTouched;
        if ((isReceiveMode || isPurchaseStage) && autoSync) {
            setPaymentAmount(payableAmount < 0 ? 0 : payableAmount);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [payableAmount, isReceiveMode, paymentAmountTouched, paymentManual]);

    // --------------------------------------------------
    // Items payload (Submit + Receive duebar use hoy)
    // --------------------------------------------------
    const buildItemsPayload = (withDiscountAmount) =>
        purchaseItems.map((item) => {
            const totalQty = Number(item.totalQty) || 0;
            const rowGrossTotal = (Number(item.buyPrice) || 0) * totalQty;
            const effectiveDiscount =
                item.discountType === 'percent'
                    ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                    : roundTo2(Number(item.discount) || 0);

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
                ...(withDiscountAmount ? { discountAmount: effectiveDiscount } : {}),
                itemTotal: roundTo2(rowGrossTotal - effectiveDiscount),
            };
        });

    // Return / Damage adjustment unset list
    const buildAdjustmentUnset = () => [
        ...(addReturnToAdjustment && returnTotalValue > 0 ? [] : ['returnAdjustmentAmount']),
        ...(addDamageToAdjustment && damageTotalValue > 0 ? [] : ['damageAdjustmentAmount']),
    ];

    // --------------------------------------------------
    // Submit
    // --------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (submitLock.current) return;
        submitLock.current = true;
        try {
            await handleSubmitInner();
        } finally {
            setTimeout(() => { submitLock.current = false; }, 1500);
        }
    };

    const handleSubmitInner = async () => {
        if (noPurchasePermission) {
            denyPurchaseToast();
            return;
        }

        // ---------------- Return Only ----------------
        if (isReturnOnly) {
            const badRet = returnItems.some(
                (i) => (Number(i.totalQty) || 0) <= 0 && (Number(i.freeQty) || 0) <= 0
            );
            if (badRet) {
                toastErr('Each return product must have a valid quantity!');
                return;
            }
            const useAdj = addReturnToAdjustment && returnTotalValue > 0;
            const newPayable = roundTo2(
                (Number(editingPurchase.payableAmount) || 0) +
                (Number(editingPurchase.returnAdjustmentAmount) || 0) -
                (useAdj ? returnTotalValue : 0)
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
                toastOk('Return updated successfully!');
                setTimeout(() => navigate(-1), 1000);
            } catch (error) {
                console.error(error);
                toastErr('Failed to update return. Try again.');
            }
            return;
        }

        // ---------------- Validation ----------------
        if (!purchaseFormData.company) return toastErr('Company is required!');
        if (!purchaseFormData.date) return toastErr('Date is required!');
        if (purchaseItems.length === 0 && freeProductItems.length === 0) {
            return toastErr('Please add at least one product!');
        }

        const hasInvalidQty = purchaseItems.some(
            (item) => (Number(item.totalQty) || 0) <= 0 && (Number(item.freeQty) || 0) <= 0
        );
        if (hasInvalidQty) return toastErr('Each product must have a valid quantity (Unit/PCS/Free)!');

        const hasInvalidFreeQty = freeProductItems.some((item) => (Number(item.totalQty) || 0) <= 0);
        if (hasInvalidFreeQty) return toastErr('Each free product must have a valid quantity (greater than 0)!');

        let receivedPaymentData = {};
        if (isPurchaseStage && !isOrderEdit && !paymentSkipped) {
            if (paymentAmount === '' || paymentAmount === null) {
                return toastErr('Payment amount is required! (or Skip payment)');
            }
            if (!(Number(paymentAmount) > 0)) {
                return toastErr(
                    payableAmount < 0
                        ? 'Company payment must be greater than 0! (or Skip payment)'
                        : 'Payment amount must be greater than 0! (or Skip payment)'
                );
            }
            if (!paymentAccountType) return toastErr('Please select a payment method! (or Skip payment)');
            if (!selectedAccountInfo) return toastErr('Please select an account! (or Skip payment)');

            receivedPaymentData = {
                paidAmount: roundTo2(paymentAmount),
                paymentMethod: paymentAccountType,
                paymentAccount: buildAccountInfo(),
                paymentNote: paymentNote,
            };
        }
        if (isReceivedEdit) {
            if (paymentAmount === '' || paymentAmount === null) return toastErr('Payment amount is required!');
            if (Number(paymentAmount) < 0) return toastErr('Payment amount cannot be negative!');
            if (!paymentAccountType) return toastErr('Please select a payment method!');
            if (!selectedAccountInfo) return toastErr('Please select an account!');

            receivedPaymentData = {
                paidAmount: roundTo2(paymentAmount),
                receiveStatus: 'Received',
                receiveDate: receiveDateValue,
                paymentMethod: paymentAccountType,
                paymentAccount: buildAccountInfo(),
                paymentNote: paymentNote,
            };
        }
        if (receivedPaymentData.paidAmount > 0 && receivedPaymentData.paymentAccount && payableAmount >= 0) {
            const available = await getAccountAvailable(receivedPaymentData.paymentAccount, editId);
            if (receivedPaymentData.paidAmount > available) {
                return toastErr(`Insufficient balance in the selected account! Available: ৳${available.toFixed(2)}`);
            }
        }
        // ---------------- Validation End ----------------

        const itemsPayload = buildItemsPayload(true);

        const purchaseData = {
            invoiceNo: isEditMode ? editingPurchase.invoiceNo : generateInvoiceNo(),
            ...(prevApplied
                ? { previousBalanceAmount: prevBalance.amount, previousBalanceType: prevBalance.type }
                : {}),
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            subTotal,
            productWiseDiscount,
            productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType,
            overallDiscountValue,

            returnItems: returnItemsPayload,
            ...(addReturnToAdjustment && returnTotalValue > 0 ? { returnAdjustmentAmount: returnTotalValue } : {}),
            damageItems: damageItemsPayload,
            ...(addDamageToAdjustment && damageTotalValue > 0 ? { damageAdjustmentAmount: damageTotalValue } : {}),
            ...(isEditMode ? { unsetFields: buildAdjustmentUnset() } : {}),

            freeItems: freeItemsPayload,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            payableAmount,
            orderNote,

            ...receivedPaymentData,
        };

        try {
            // Received purchase er order edit -> save na kore Receive page e jabe
            if (isOrderEdit) {
                const { unsetFields: _unsetFields, ...restData } = purchaseData;
                const editedPurchase = {
                    ...editingPurchase,
                    ...restData,
                    paidAmount: undefined,
                    paymentMethod: undefined,
                    paymentAccount: undefined,
                    paymentNote: undefined,
                    receiveStatus: editingPurchase.receiveStatus,
                    orderSnapshot: {
                        items: itemsPayload,
                        freeItems: freeItemsPayload,
                        subTotal: purchaseData.subTotal,
                        productWiseDiscount: purchaseData.productWiseDiscount,
                        productWiseDiscountPercent: purchaseData.productWiseDiscountPercent,
                        overallDiscount: purchaseData.overallDiscount,
                        overallDiscountType: purchaseData.overallDiscountType,
                        overallDiscountValue: purchaseData.overallDiscountValue,
                        adjustment: purchaseData.adjustment,
                        payableAmount: purchaseData.payableAmount,
                    },
                };
                clearPurchaseDrafts();
                navigate('/add-purchase', {
                    replace: true,
                    state: { purchase: editedPurchase, mode: 'receive', fromOrderEdit: true },
                });
                return;
            }
            if (isEditMode && isPurchaseStage && paymentSkipped) {
                purchaseData.unsetFields = [
                    ...(purchaseData.unsetFields || []),
                    'paidAmount',
                    'paymentMethod',
                    'paymentAccount',
                    'paymentNote',
                ];
            }
            if (isEditMode && !prevApplied) {
                purchaseData.unsetFields = [
                    ...(purchaseData.unsetFields || []),
                    'previousBalanceAmount',
                    'previousBalanceType',
                ];
            }
            const url = isEditMode
                ? `http://localhost:5000/purchase/${editId}`
                : 'http://localhost:5000/purchase';

            const res = await fetch(url, {
                method: isEditMode ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(purchaseData),
            });

            if (!res.ok) throw new Error('Failed to save purchase');
            await res.json();

            toastOk(
                isEditMode
                    ? `Purchase updated successfully! Invoice: ${purchaseData.invoiceNo}`
                    : `Purchase added successfully! Invoice: ${purchaseData.invoiceNo}`
            );

            clearPurchaseDrafts();
            setPurchaseItems([]);
            setOverallDiscountAmount(0);
            setOverallDiscountType('amount');
            setAdjustmentText('');
            setAdjustmentAmount(0);
            setAdjustmentType('+');
            setOrderNote('');
            setFormResetKey((prev) => prev + 1);
            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error saving purchase:', error);
            toastErr(isEditMode ? 'Failed to update purchase. Try again.' : 'Failed to save purchase. Try again.');
        }
    };

    // --------------------------------------------------
    // Receive Submit
    // --------------------------------------------------
    const handleReceiveSubmit = async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        try {
            await handleReceiveSubmitInner();
        } finally {
            setTimeout(() => { submitLock.current = false; }, 1500);
        }
    };

    const handleReceiveSubmitInner = async () => {
        if (!canEditPurchase) {
            denyPurchaseToast();
            return;
        }
        if (isReceiving) return;

        // ---------------- Validation ----------------
        if (paymentAmount === '' || paymentAmount === null) return toastErr('Payment amount is required!');
        if (Number(paymentAmount) < 0) return toastErr('Payment amount cannot be negative!');
        if (!paymentAccountType) return toastErr('Please select a payment method!');
        if (!selectedAccountInfo) return toastErr('Please select an account!');

        const accountInfo = buildAccountInfo();
        const itemsPayload = buildItemsPayload(false);

        if (payableAmount >= 0 && roundTo2(paymentAmount) > 0) {
            const available = await getAccountAvailable(accountInfo, editId);
            if (roundTo2(paymentAmount) > available) {
                return toastErr(`Insufficient balance in the selected account! Available: ৳${available.toFixed(2)}`);
            }
        }

        const receiveData = {
            company: purchaseFormData.company,
            phone: purchaseFormData.companyContact,
            address: purchaseFormData.companyAddress,
            shippingAddress: purchaseFormData.shippingAddress,
            category: purchaseFormData.category,
            purchaseDate: purchaseFormData.date,

            items: itemsPayload,

            subTotal,
            productWiseDiscount,
            productWiseDiscountPercent,

            overallDiscount: roundTo2(overallDiscountAmount),
            overallDiscountType,

            adjustment: {
                text: adjustmentText,
                amount: roundTo2(adjustmentValue),
                type: adjustmentType,
            },

            payableAmount,
            orderNote,

            freeItems: freeItemsPayload,

            paidAmount: roundTo2(paymentAmount),
            receiveDate: receiveDateValue,
            ...(prevApplied
                ? { previousBalanceAmount: prevBalance.amount, previousBalanceType: prevBalance.type }
                : {}),
            overallDiscountValue,
            ...(location.state?.fromOrderEdit ? { orderSnapshot: editingPurchase.orderSnapshot } : {}),

            returnItems: returnItemsPayload,
            ...(addReturnToAdjustment && returnTotalValue > 0 ? { returnAdjustmentAmount: returnTotalValue } : {}),
            damageItems: damageItemsPayload,
            ...(addDamageToAdjustment && damageTotalValue > 0 ? { damageAdjustmentAmount: damageTotalValue } : {}),
            unsetFields: buildAdjustmentUnset(),
            receiveStatus: 'Received',
            paymentMethod: paymentAccountType,
            paymentAccount: accountInfo,
            paymentNote,
        };

        try {
            if (!prevApplied) {
                receiveData.unsetFields = [
                    ...(receiveData.unsetFields || []),
                    'previousBalanceAmount',
                    'previousBalanceType',
                ];
            }
            setIsReceiving(true);
            const res = await fetch(`http://localhost:5000/purchase/${editId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(receiveData),
            });

            if (!res.ok) throw new Error('Failed to receive purchase');
            await res.json();

            clearPurchaseDrafts();
            toastOk('Payment received successfully!');
            setTimeout(() => {
                navigate('/purchase', { replace: true, state: null });
            }, 1000);
        } catch (error) {
            console.error('Error receiving purchase:', error);
            setIsReceiving(false);
            toastErr('Failed to receive payment. Try again.');
        }
    };

    // --------------------------------------------------
    // Section components e pass korar jonno shob ekta object e
    // --------------------------------------------------
    const c = {
        // common
        roundTo2, isReceiveMode, isReceivedEdit, isPurchaseStage, purchaseFormData,
        // main table
        purchaseItems, handleItemChange, handleToggleDiscountType, handleRemoveItem,
        // summary
        subTotal, productWiseDiscount, productWiseDiscountPercent,
        overallDiscountAmount, setOverallDiscountAmount, overallDiscountType, setOverallDiscountType,
        overallDiscountValue, overallDiscountPercent,
        adjustmentText, setAdjustmentText, adjustmentAmount, setAdjustmentAmount, adjustmentType, setAdjustmentType,
        addReturnToAdjustment, setAddReturnToAdjustment, returnTotalValue,
        addDamageToAdjustment, setAddDamageToAdjustment, damageTotalValue,
        prevBalance, usePrevBalance, setUsePrevBalance, payableAmount,
        // free product
        freeProductOpen, setFreeProductOpen, freeProductItems, freeSearch, setFreeSearch,
        handleClearFreeCategory, handleSelectFreeCategory, filteredFreeCategories, filteredFreeProducts,
        handleAddFreeProduct, handleFreeItemChange, handleRemoveFreeItem, getFreePcsTotal, getFreeRowTotal,
        // return
        returnProductOpen, setReturnProductOpen, hasMainProduct, disabledTip, returnItems,
        returnSearch, setReturnSearch, handleClearReturnCategory, handleSelectReturnCategory,
        filteredReturnCategories, filteredReturnProducts, handleAddReturnProduct,
        handleReturnItemChange, handleRemoveReturnItem, getStock, getReturnRowTotal,
        // damage
        damageProductOpen, setDamageProductOpen, damageItems, damageSearch, setDamageSearch,
        handleClearDamageCategory, handleSelectDamageCategory, filteredDamageCategories, filteredDamageProducts,
        handleAddDamageProduct, handleDamageItemChange, handleRemoveDamageItem, getDamageStock, getDamageRowTotal,
        // order note
        orderNote, setOrderNote,
        // payment
        showPayment, paymentSectionRef, paymentSkipped, setPaymentSkipped,
        paymentAccountType, setPaymentAccountType, selectedAccountKey, setSelectedAccountKey,
        savePaymentMethod, setSavePaymentMethod, handleSavePaymentToggle, persistPaymentMethod,
        receiveDateInputRef, handleReceiveDateChange, receiveDateValue,
        paymentAmount, setPaymentAmount, setPaymentAmountTouched, setPaymentManual,
        accountTypes, uniqueAccounts, getAccountKey, paymentNote, setPaymentNote,
    };

    return (
        <div className="max-w-[1400px] mx-auto p-3 sm:p-5 md:p-8">
            <PurchaseAddStyle />

            {/* Product Select Form */}
            <fieldset disabled={isReturnOnly} className="contents">
                <PurchaseForm
                    key={formResetKey}
                    onAddProduct={handleAddProduct}
                    addedProductIds={addedProductIds}
                    onFormDataChange={handleFormDataChange}
                    initialData={initialFormData}
                    draftKey={draftPrefix}
                    onCompanyClear={handleCompanyClear}
                />
            </fieldset>

            <div className="w-full mt-4 sm:mt-6 relative z-0">
                <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 md:p-8">
                    <form onSubmit={handleSubmit}>
                        <fieldset disabled={isReturnOnly} className="contents">
                            <MainTableSection c={c} />
                            <SummarySection c={c} />
                            <FreeProductSection c={c} />
                        </fieldset>

                        {/* Return (returnOnly mode e-o enabled thakbe) */}
                        <ReturnSection c={c} />

                        <fieldset disabled={isReturnOnly} className="contents">
                            <DamageSection c={c} />
                            <OrderNoteSection c={c} />
                            <PaymentSection c={c} />
                        </fieldset>

                        {/* SUBMIT / RECEIVE BUTTON */}
                        <div className="mt-6 flex justify-end">
                            {isReceiveMode ? (
                                <button
                                    type="button"
                                    onClick={handleReceiveSubmit}
                                    disabled={isReceiving}
                                    className="w-full sm:w-auto px-10 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-sm font-semibold text-white shadow-sm transition cursor-pointer"
                                >
                                    Receive
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    className="w-full sm:w-auto px-10 py-3 bg-brand-600 hover:bg-brand-700 text-sm font-semibold text-white transition cursor-pointer"
                                >
                                    {isReturnOnly ? 'Update Return' : isOrderEdit ? 'Update & Go to Receive' : isEditMode ? 'Update Purchase' : 'Purchase'}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

// Same route e state bodle (Purchase Edit -> Receive) component fresh load hoyar jonno key
const PurchaseAdd = () => {
    const location = useLocation();
    return <PurchaseAddInner key={location.key} />;
};

export default PurchaseAdd;