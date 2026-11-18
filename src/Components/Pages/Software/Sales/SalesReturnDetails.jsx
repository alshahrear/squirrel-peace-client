import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Phone, Mail, MapPin, Calendar, Building2, ArrowLeft, PackageX, RotateCcw } from 'lucide-react';
import { getSaleItemNetPricePerPcs } from '../../Software/Inventory/Stock/StockPurchase';
import { fetchAccountBalance } from '../../Software/Account/AccountBalance';
import useCan from '../../../../hooks/useCan';
import { DateInput } from '../Product/ProductUi';
// NOTE: Purchase folder er file gulor path tomar folder structure onujayi thik kore nio
import { inputCls, labelCls, ComboField } from '../Purchase/PurchaseUi';
import { Card, QtyField, PaymentSection } from '../Purchase/PurchaseFormUi';
import { labelToISO } from '../Purchase/purchaseDate';

const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;
const v = (x) => (x === 0 || x === undefined || x === null ? '' : x);

const KEYS = {
    main: { u: 'rtUnitQty', s: 'rtSubQty', p: 'rtPcsQty' },
    free: { u: 'rtFreeUnitQty', s: 'rtFreeSubQty', p: 'rtFreePcsQty' },
    other: { u: 'rtUnitQty', s: 'rtSubQty', p: 'rtPcsQty' },
};

// Input value ke remaining stock/qty er moddhe clamp kore
const clampQty = (field, value, cur, perUnit, perSub, remaining) => {
    if (value !== '' && !/^\d*$/.test(value)) return null; // শুধু পূর্ণসংখ্যা
    let val = value === '' ? 0 : Number(value);
    if (isNaN(val) || val < 0) val = 0;
    const u = Number(cur.u) || 0;
    const s = Number(cur.s) || 0;
    const p = Number(cur.p) || 0;

    if (field === 'u') {
        const other = s * perSub + p;
        if (val * perUnit + other > remaining) {
            val = Math.max(0, perUnit > 0 ? Math.floor((remaining - other) / perUnit) : 0);
        }
    } else if (field === 's') {
        const others = u * perUnit + p;
        const max = perSub > 0 ? Math.floor(Math.max(0, remaining - others) / perSub) : 0;
        if (val > max) val = max;
    } else {
        const max = Math.max(0, remaining - (u * perUnit + s * perSub));
        if (val > max) val = max;
    }
    return val;
};

const SalesReturnDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editReturnId = searchParams.get('returnId');
    const isEditMode = !!editReturnId;
    const can = useCan('sales_return');

    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [returnInputs, setReturnInputs] = useState([]);
    const [freeReturnInputs, setFreeReturnInputs] = useState([]);
    const [returnPricesPcs, setReturnPricesPcs] = useState([]);
    const [returnNote, setReturnNote] = useState('');

    const showToast = (message, type = 'success') => (type === 'error' ? toast.error(message) : toast.success(message));

    // Return Date
    const getFormattedToday = () =>
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const [returnDate, setReturnDate] = useState(getFormattedToday());
    const handleReturnDateChange = (e) => {
        const rawDate = e.target.value;
        if (rawDate) {
            const [year, month, day] = rawDate.split('-');
            setReturnDate(
                new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
            );
        }
    };

    // Collected By (optional, Delivery Man)
    const [deliveryMen, setDeliveryMen] = useState([]);
    const [collectedBy, setCollectedBy] = useState({ id: '', name: '' });
    const [collectedSearch, setCollectedSearch] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/user')
            .then((res) => res.json())
            .then((data) => setDeliveryMen(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching users:', error));
    }, []);

    const collectedOptions = deliveryMen
        .filter(
            (u) =>
                u.role === 'Delivery Man' &&
                u.isActive === true &&
                (u.name || '').toLowerCase().includes(collectedSearch.toLowerCase())
        )
        .map((u) => ({ key: u._id, title: u.name, sub: u.phone ? `📞 ${u.phone}` : '', raw: u }));

    // ---------------- Payment (optional, default collapsed) ----------------
    const [investments, setInvestments] = useState([]);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(false);
    const [paymentAccountType, setPaymentAccountType] = useState('');
    const [selectedAccountKey, setSelectedAccountKey] = useState('');
    const [paymentNote, setPaymentNote] = useState('');
    const [accAvailable, setAccAvailable] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/sales/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedOrder(data);

                    const editingEntry = editReturnId
                        ? (data.returnHistory || []).find((ret) => ret.returnId === editReturnId)
                        : null;
                    setReturnNote(editingEntry?.returnNote || '');
                    setReturnDate(editingEntry?.returnDate || getFormattedToday());
                    setCollectedBy({ id: editingEntry?.collectedById || '', name: editingEntry?.collectedBy || '' });
                    setCollectedSearch(editingEntry?.collectedBy || '');

                    const savedPay = editingEntry?.payment;
                    if (savedPay) {
                        setPaymentOpen(true);
                        setPaymentAmount(savedPay.amount ?? '');
                        setPaymentAmountTouched(true);
                        setPaymentAccountType(savedPay.method || '');
                        setPaymentNote(savedPay.note || '');
                        const spa = savedPay.account || {};
                        if (savedPay.method === 'Bank') {
                            setSelectedAccountKey(`${spa.bankName}-${spa.accountNumber}-${spa.accountBranch}`);
                        } else if (savedPay.method === 'Mobile Banking') {
                            setSelectedAccountKey(`${spa.accountName}-${spa.accountNumber}`);
                        } else {
                            setSelectedAccountKey('cash');
                        }
                    } else {
                        setPaymentOpen(false);
                        setPaymentAmount('');
                        setPaymentAmountTouched(false);
                        setPaymentAccountType('');
                        setSelectedAccountKey('');
                        setPaymentNote('');
                    }

                    setReturnInputs(
                        (data.items || []).map((item) => {
                            const found = editingEntry?.items?.find((it) => it.productId === item.productId);
                            if (found) {
                                return {
                                    rtUnitQty: Number(found.returnUnitQty) || 0,
                                    rtSubQty: Number(found.returnSubQty) || 0,
                                    rtPcsQty: Number(found.returnPcsQty) || 0,
                                    rtFreeUnitQty: Number(found.returnFreeUnitQty) || 0,
                                    rtFreeSubQty: Number(found.returnFreeSubQty) || 0,
                                    rtFreePcsQty: Number(found.returnFreePcsQty) || 0,
                                };
                            }
                            return { rtUnitQty: 0, rtSubQty: 0, rtPcsQty: 0, rtFreeUnitQty: 0, rtFreeSubQty: 0, rtFreePcsQty: 0 };
                        })
                    );

                    setFreeReturnInputs(
                        (data.freeItems || []).map((item) => {
                            const found = editingEntry?.freeItems?.find((it) => it.productId === item.productId);
                            if (found) {
                                return {
                                    rtUnitQty: Number(found.returnUnitQty) || 0,
                                    rtSubQty: Number(found.returnSubQty) || 0,
                                    rtPcsQty: Number(found.returnPcsQty) || 0,
                                };
                            }
                            return { rtUnitQty: 0, rtSubQty: 0, rtPcsQty: 0 };
                        })
                    );

                    // Sell price StockPurchase.jsx er central function theke ashche
                    setReturnPricesPcs((data.items || []).map((item) => getSaleItemNetPricePerPcs(data, item)));
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching sales data:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id, editReturnId]);

    // ---------------- Unit / Sub / Pcs helpers ----------------
    const getPcsPerSub = (item) => (item.parentMode === true ? Number(item.pcsPerSub) || 0 : 0);

    const getPcsPerUnit = (item) => {
        if (Number(item.pcsPerUnit) > 0) return Number(item.pcsPerUnit);
        const unitQtyNum = Number(item.unitQty) || 0;
        const pcsQtyNum = Number(item.pcsQty) || 0;
        const totalPcsNum = Number(item.totalPcs) || 0;
        if (unitQtyNum > 0) {
            const perUnit = (totalPcsNum - pcsQtyNum) / unitQtyNum;
            return perUnit > 0 ? perUnit : 0;
        }
        return 0;
    };

    const getItemFreePcsPerUnit = (item) => {
        if (Number(item.pcsPerUnit) > 0) return Number(item.pcsPerUnit);
        const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
        const freePcsQtyNum = Number(item.freePcsQty) || 0;
        const freeTotalQtyNum = Number(item.freeQty) || 0;
        if (freeUnitQtyNum > 0) {
            const perUnit = (freeTotalQtyNum - freePcsQtyNum) / freeUnitQtyNum;
            return perUnit > 0 ? perUnit : 0;
        }
        return 0;
    };

    // Others Free Product — 1 Unit = koto PCS
    const getFreePcsPerUnit = (item) => {
        if (Number(item.pcsPerUnit) > 0) return Number(item.pcsPerUnit);
        const unitQtyNum = Number(item.unitQty) || 0;
        const pcsQtyNum = Number(item.pcsQty) || 0;
        const totalQtyNum = Number(item.totalQty) || 0;
        if (unitQtyNum > 0) {
            const perUnit = (totalQtyNum - pcsQtyNum) / unitQtyNum;
            return perUnit > 0 ? perUnit : 0;
        }
        return 0;
    };

    // ---------------- Age koto return hoyeche ----------------
    const sumReturned = (listKey, productId, field) => {
        if (!selectedOrder?.returnHistory) return 0;
        return selectedOrder.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum; // nijer entry bad
            const found = ret[listKey]?.find((it) => it.productId === productId);
            return sum + (found ? Number(found[field]) || 0 : 0);
        }, 0);
    };

    const getRemainingQty = (item) =>
        Math.max(Number(item.totalPcs || 0) - sumReturned('items', item.productId, 'returnTotalQty'), 0);
    const getFreeRemainingQty = (item) =>
        Math.max(Number(item.freeQty || 0) - sumReturned('items', item.productId, 'returnFreeTotalQty'), 0);
    const getFreeItemRemainingQty = (item) =>
        Math.max(Number(item.totalQty || 0) - sumReturned('freeItems', item.productId, 'returnTotalQty'), 0);

    const getTotalRtQty = (index, item) => {
        const r = returnInputs[index] || {};
        return (Number(r.rtUnitQty) || 0) * getPcsPerUnit(item) + (Number(r.rtSubQty) || 0) * getPcsPerSub(item) + (Number(r.rtPcsQty) || 0);
    };
    const getItemFreeTotalRtQty = (index, item) => {
        const r = returnInputs[index] || {};
        return (Number(r.rtFreeUnitQty) || 0) * getItemFreePcsPerUnit(item) + (Number(r.rtFreeSubQty) || 0) * getPcsPerSub(item) + (Number(r.rtFreePcsQty) || 0);
    };
    const getFreeItemTotalRtQty = (index, item) => {
        const r = freeReturnInputs[index] || {};
        return (Number(r.rtUnitQty) || 0) * getFreePcsPerUnit(item) + (Number(r.rtSubQty) || 0) * getPcsPerSub(item) + (Number(r.rtPcsQty) || 0);
    };

    const getReturnAmount = (index, item) => {
        const pricePcs =
            returnPricesPcs[index] !== undefined ? Number(returnPricesPcs[index]) || 0 : Number(item.sellPricePcs) || 0;
        return getTotalRtQty(index, item) * pricePcs;
    };

    // kind: main | free | other   field: u | s | p
    const handleQty = (kind, index, field, value, item) => {
        const keys = KEYS[kind];
        const cur = (kind === 'other' ? freeReturnInputs : returnInputs)[index] || {};
        const perUnit = kind === 'main' ? getPcsPerUnit(item) : kind === 'free' ? getItemFreePcsPerUnit(item) : getFreePcsPerUnit(item);
        const remaining = kind === 'main' ? getRemainingQty(item) : kind === 'free' ? getFreeRemainingQty(item) : getFreeItemRemainingQty(item);
        const val = clampQty(field, value, { u: cur[keys.u], s: cur[keys.s], p: cur[keys.p] }, perUnit, getPcsPerSub(item), remaining);
        if (val === null) return;
        const setter = kind === 'other' ? setFreeReturnInputs : setReturnInputs;
        setter((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [keys[field]]: val };
            return updated;
        });
    };

    const handleReturnPricePcsChange = (index, value) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;
        setReturnPricesPcs((prev) => {
            const updated = [...prev];
            updated[index] = val;
            return updated;
        });
    };

    const totalReturnPcs = selectedOrder ? selectedOrder.items.reduce((s, it, i) => s + getTotalRtQty(i, it), 0) : 0;
    const totalReturnFreeQty = selectedOrder ? selectedOrder.items.reduce((s, it, i) => s + getItemFreeTotalRtQty(i, it), 0) : 0;
    const totalReturnFreeItemsQty = selectedOrder
        ? (selectedOrder.freeItems || []).reduce((s, it, i) => s + getFreeItemTotalRtQty(i, it), 0)
        : 0;
    const totalReturnAmount = selectedOrder ? selectedOrder.items.reduce((s, it, i) => s + getReturnAmount(i, it), 0) : 0;

    // ---------------- Payment helpers ----------------
    useEffect(() => {
        fetch('http://localhost:5000/investment')
            .then((res) => res.json())
            .then((data) => setInvestments(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching investments:', error));
    }, []);

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

    const buildAccInfo = () => {
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

    // Selected account e ekhon koto tk ache (live)
    useEffect(() => {
        if (!paymentOpen || !selectedAccountInfo || !selectedOrder) {
            setAccAvailable(null);
            return;
        }
        let cancelled = false;
        const acc = buildAccInfo();
        const keyOf = (a) => `${a?.accountName || a?.bankName || 'Cash'}||${a?.accountNumber || ''}||${a?.accountBranch || ''}`;
        const loadBal = () =>
            fetchAccountBalance(acc).then((bal) => {
                if (cancelled) return;
                let avail = bal;
                if (isEditMode) {
                    const oldPay = (selectedOrder.returnHistory || []).find((r) => r.returnId === editReturnId)?.payment;
                    if (oldPay && Number(oldPay.amount) > 0 && keyOf(oldPay.account) === keyOf(acc)) {
                        avail += Number(oldPay.amount) || 0;
                    }
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
    }, [paymentOpen, selectedAccountKey, paymentAccountType, investments, selectedOrder]);

    // User nijer hate change na korle Payment Amount = Total Return Amount auto sync
    useEffect(() => {
        if (!paymentAmountTouched) setPaymentAmount(roundTo2(totalReturnAmount));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalReturnAmount, paymentAmountTouched]);

    // Payment amount account balance er beshi hole block
    const handlePaymentAmountChange = (value) => {
        if (accAvailable !== null && Number(value) > accAvailable) {
            showToast(`Insufficient balance in the selected account! Available: ৳${accAvailable.toFixed(2)}`, 'error');
            return;
        }
        setPaymentAmount(value);
    };

    // Credit Limit check: return payment dile customer er Get amount creditLimit er beshi hobe kina
    const checkCreditLimit = async (paidNow) => {
        try {
            const n = (x) => Number(x) || 0;
            const r2 = (x) => Math.round((Number(x) || 0) * 100) / 100;
            const name = String(selectedOrder.customer || '').trim().toLowerCase();
            const same = (a) => String(a || '').trim().toLowerCase() === name;
            const itemAmt = (it) =>
                Number(it.itemTotal ?? it.subtotal ?? n(it.sellPricePcs ?? it.sellPrice) * n(it.totalQty)) || 0;
            const sumItems = (items) => (items || []).reduce((s, it) => s + itemAmt(it), 0);
            const safe = (url) =>
                fetch(url).then((r) => r.json()).then((d) => (Array.isArray(d) ? d : [])).catch(() => []);

            const [sales, bulks, damages, customers, duePays] = await Promise.all([
                safe('http://localhost:5000/sales'),
                safe('http://localhost:5000/sales-bulk-return'),
                safe('http://localhost:5000/sales-damage'),
                safe('http://localhost:5000/customer'),
                safe('http://localhost:5000/sales-due-payment'),
            ]);

            const info =
                customers.find((c) => String(c._id) === String(selectedOrder.customerId)) ||
                customers.find((c) => String(c.businessName || '').trim().toLowerCase() === name);
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

            // Sales return (ei return edit hole nijer entry bad)
            sales.forEach((s) => {
                if (!same(s.customer)) return;
                (s.returnHistory || []).forEach((ret) => {
                    if (isEditMode && String(s._id) === String(id) && ret.returnId === editReturnId) return;
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

            // Ei return + payment er effect
            const thisAmt = roundTo2(totalReturnAmount);
            const thisPaid = roundTo2(paidNow);
            pay += Math.max(thisAmt - thisPaid, 0);
            get += Math.max(thisPaid - thisAmt, 0);

            const net = r2(pay - get);
            const finalGet = net < 0 ? -net : 0;

            if (finalGet > limit) {
                showToast(
                    `Credit limit cross hoye jabe! Limit: ৳${limit}, Total Get hobe: ৳${finalGet}. Payment amount kom din.`,
                    'error'
                );
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking credit limit:', error);
            return true;
        }
    };

    // ---------------- Submit ----------------
    const submitLock = useRef(false);
    const handleConfirmReturn = async () => {
        if (submitLock.current) return;
        submitLock.current = true;
        setSubmitting(true);
        let done = false;
        try {
            done = (await handleConfirmReturnInner()) === true;
        } finally {
            if (!done) {
                submitLock.current = false;
                setSubmitting(false);
            }
        }
    };

    const handleConfirmReturnInner = async () => {
        if (isEditMode ? !can.canEdit : !can.canAdd) {
            showToast(isEditMode ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!', 'error');
            return;
        }
        if (totalReturnPcs <= 0 && totalReturnFreeQty <= 0 && totalReturnFreeItemsQty <= 0) {
            showToast('Return korar jonno kompokkhe 1 ta product a quantity din!', 'error');
            return;
        }

        let paymentData = null;
        if (paymentOpen) {
            if (paymentAmount === '' || paymentAmount === null) {
                showToast('Payment amount is required! (or close Payment)', 'error');
                return;
            }
            if (!paymentAccountType) {
                showToast('Please select a payment method! (or close Payment)', 'error');
                return;
            }
            if (!selectedAccountInfo) {
                showToast('Please select an account! (or close Payment)', 'error');
                return;
            }
            const accInfo = buildAccInfo();
            if (!(await checkCreditLimit(paymentAmount))) return;

            // Customer ke return payment dile account e tk ache kina check (edit hole nijer ager payment bad)
            const payAmt = roundTo2(paymentAmount);
            const sameAcc = (a, b) =>
                `${a?.accountName || a?.bankName || 'Cash'}||${a?.accountNumber || ''}||${a?.accountBranch || ''}` ===
                `${b?.accountName || b?.bankName || 'Cash'}||${b?.accountNumber || ''}||${b?.accountBranch || ''}`;
            let available = await fetchAccountBalance(accInfo);
            if (isEditMode) {
                const oldPay = (selectedOrder.returnHistory || []).find((r) => r.returnId === editReturnId)?.payment;
                if (oldPay && Number(oldPay.amount) > 0 && sameAcc(oldPay.account, accInfo)) {
                    available += Number(oldPay.amount) || 0;
                }
            }
            if (payAmt > available) {
                showToast(`Insufficient balance in the selected account! Available: ৳${available.toFixed(2)}`, 'error');
                return;
            }

            paymentData = {
                amount: roundTo2(paymentAmount),
                method: paymentAccountType,
                account: accInfo,
                note: paymentNote,
            };
        }

        setSubmitting(true);
        try {
            const { _id, ...rest } = selectedOrder;

            const returnedItems = selectedOrder.items
                .map((item, index) => {
                    const r = returnInputs[index] || {};
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        returnUnitQty: Number(r.rtUnitQty) || 0,
                        returnSubQty: Number(r.rtSubQty) || 0,
                        returnPcsQty: Number(r.rtPcsQty) || 0,
                        returnTotalQty: getTotalRtQty(index, item),
                        returnFreeUnitQty: Number(r.rtFreeUnitQty) || 0,
                        returnFreeSubQty: Number(r.rtFreeSubQty) || 0,
                        returnFreePcsQty: Number(r.rtFreePcsQty) || 0,
                        returnFreeTotalQty: getItemFreeTotalRtQty(index, item),
                        returnAmount: getReturnAmount(index, item),
                    };
                })
                .filter((it) => it.returnTotalQty > 0 || it.returnFreeTotalQty > 0);

            const freeReturnedItems = (selectedOrder.freeItems || [])
                .map((item, index) => {
                    const r = freeReturnInputs[index] || {};
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        returnUnitQty: Number(r.rtUnitQty) || 0,
                        returnSubQty: Number(r.rtSubQty) || 0,
                        returnPcsQty: Number(r.rtPcsQty) || 0,
                        returnTotalQty: getFreeItemTotalRtQty(index, item),
                    };
                })
                .filter((it) => it.returnTotalQty > 0);

            let updatedReturnHistory;

            if (isEditMode) {
                updatedReturnHistory = (selectedOrder.returnHistory || []).map((ret) => {
                    if (ret.returnId !== editReturnId) return ret;
                    const {
                        damageItems: _damageItems,
                        returnItems: _returnItems,
                        totalReturnDamageItemsQty: _tdq,
                        totalReturnDamageFreeQty: _tdfq,
                        totalReturnDamageAmount: _tda,
                        totalReturnReturnItemsQty: _trq,
                        totalReturnReturnFreeQty: _trfq,
                        totalReturnReturnAmount: _tra,
                        ...cleanRet
                    } = ret;
                    return {
                        ...cleanRet,
                        returnDate,
                        collectedById: collectedBy.id || '',
                        collectedBy: collectedBy.name || '',
                        returnNote: returnNote.trim(),
                        items: returnedItems,
                        freeItems: freeReturnedItems,
                        totalReturnPcs,
                        totalReturnFreeQty,
                        totalReturnFreeItemsQty,
                        totalReturnAmount,
                    };
                });
            } else {
                const returnId = `RET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                const newReturnEntry = {
                    returnNote: returnNote.trim(),
                    returnId,
                    returnDate,
                    collectedById: collectedBy.id || '',
                    collectedBy: collectedBy.name || '',
                    items: returnedItems,
                    freeItems: freeReturnedItems,
                    totalReturnPcs,
                    totalReturnFreeQty,
                    totalReturnFreeItemsQty,
                    totalReturnAmount,
                };
                updatedReturnHistory = [...(selectedOrder.returnHistory || []), newReturnEntry];
            }

            const updatedData = {
                ...rest,
                returnHistory: updatedReturnHistory.map((ret, i) =>
                    (isEditMode ? ret.returnId === editReturnId : i === updatedReturnHistory.length - 1)
                        ? { ...ret, payment: paymentData }
                        : ret
                ),
            };

            const response = await fetch(`http://localhost:5000/sales/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                showToast(isEditMode ? 'Sales return successfully updated!' : 'Sales return successfully added!', 'success');
                setTimeout(() => navigate('/sales-return'), 900);
                return true;
            }
            showToast('Failed to update return!', 'error');
        } catch (error) {
            console.error('Error updating return:', error);
            showToast('Server error while updating return!', 'error');
        }
    };

    // ---------------- Render ----------------
    if (loading) {
        return (
            <div className="min-h-screen p-3 sm:p-5 md:p-8">
                <div className="max-w-[1400px] mx-auto space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    if (notFound || !selectedOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-7 h-7 text-rose-500" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Order Not Found</h2>
                    <p className="text-slate-500 text-sm mt-2">This order record couldn't be found. It may have been deleted.</p>
                    <button onClick={() => navigate('/wholesale')} className="mt-5 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer">
                        <ArrowLeft className="w-4 h-4" /> Back to Wholesale
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-4">
                <button
                    type="button"
                    onClick={() => navigate('/wholesale')}
                    className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Wholesale
                </button>

                {/* Invoice info */}
                <Card>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-brand-600" />
                            </div>
                            <div>
                                <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md mb-1 uppercase">Sales Return</span>
                                <h1 className="text-lg font-bold text-slate-800">ইসরাইল এন্টারপ্রাইজ</h1>
                                <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <MapPin className="w-3.5 h-3.5" /> শাহজী পাড়া, বড় বাজার, মেহেরপুর
                                </p>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 space-y-1">
                            <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> 01997074920</p>
                            <p className="flex items-center gap-2 break-all"><Mail className="w-3.5 h-3.5" /> jakoberjak2017@gmail.com</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="rounded-xl border border-slate-200 p-4">
                            <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md mb-2 uppercase">Bill From</span>
                            <p className="font-bold text-slate-800">ইসরাইল এন্টারপ্রাইজ</p>
                            <p className="text-xs text-slate-600 mt-0.5">01997074920</p>
                            <p className="text-xs text-slate-600">শাহজী পাড়া, বড় বাজার, মেহেরপুর</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md mb-2 uppercase">Bill To</span>
                                    <p className="font-bold text-slate-800">{selectedOrder.customer}</p>
                                    <p className="text-xs text-slate-500 mt-0.5">{selectedOrder.phone}</p>
                                    <p className="text-xs text-slate-500">{selectedOrder.shippingAddress || selectedOrder.address || 'N/A'}</p>
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-xs text-slate-500 flex items-center sm:justify-end gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-brand-500" /> Order Date: {selectedOrder.orderDate}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                        Order No: <span className="text-brand-700">{selectedOrder.orderNo}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
                        <div>
                            <span className={labelCls}>Return Date *</span>
                            <DateInput name="returnDate" value={labelToISO(returnDate)} onChange={handleReturnDateChange} placeholder="Select date" />
                        </div>
                        <ComboField
                            label="Collected By (Optional)"
                            value={collectedSearch}
                            placeholder="Search delivery man..."
                            options={collectedOptions}
                            onType={(val) => {
                                setCollectedSearch(val);
                                setCollectedBy({ id: '', name: '' });
                            }}
                            onClear={() => {
                                setCollectedSearch('');
                                setCollectedBy({ id: '', name: '' });
                            }}
                            onPick={(o) => {
                                setCollectedBy({ id: o.raw._id, name: o.raw.name });
                                setCollectedSearch(o.raw.name);
                            }}
                        />
                    </div>
                </Card>

                {/* Items */}
                {selectedOrder.items.map((item, index) => {
                    const pcsPerUnit = getPcsPerUnit(item);
                    const freePcsPerUnit = getItemFreePcsPerUnit(item);
                    const remainingQty = getRemainingQty(item);
                    const freeRemainingQty = getFreeRemainingQty(item);
                    const totalRtQty = getTotalRtQty(index, item);
                    const totalRtFreeQty = getItemFreeTotalRtQty(index, item);
                    const ri = returnInputs[index] || {};
                    return (
                        <div key={index} className="bg-white rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800">{item.productName}</p>
                                    <p className="text-xs text-slate-500">{item.company}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[11px] text-slate-400">Return Amount</p>
                                    <p className="font-bold text-orange-600">৳{getReturnAmount(index, item).toFixed(2)}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_150px] gap-3">
                                {/* Main RT */}
                                <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-3">
                                    <div className="flex flex-wrap justify-between gap-1 text-xs mb-2">
                                        <span className="font-bold text-brand-700">RT Qty</span>
                                        <span className="text-slate-600">Total <b className="text-orange-600">{totalRtQty}</b> · Remaining <b className="text-brand-700">{remainingQty}</b></span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <QtyField label={item.unit || 'Pcs'} value={v(ri.rtUnitQty)} disabled={pcsPerUnit <= 0 || remainingQty <= 0} onChange={(val) => handleQty('main', index, 'u', val, item)} />
                                        {item.parentMode && (
                                            <QtyField label={item.subUnit || 'Sub'} value={v(ri.rtSubQty)} disabled={remainingQty <= 0 || getPcsPerSub(item) <= 0} onChange={(val) => handleQty('main', index, 's', val, item)} />
                                        )}
                                        <QtyField label="Pcs" value={v(ri.rtPcsQty)} disabled={remainingQty <= 0} onChange={(val) => handleQty('main', index, 'p', val, item)} />
                                    </div>
                                </div>

                                {/* Free RT */}
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                                    <div className="flex flex-wrap justify-between gap-1 text-xs mb-2">
                                        <span className="font-bold text-emerald-700">RT Free</span>
                                        <span className="text-slate-600">Total <b className="text-emerald-700">{totalRtFreeQty}</b> · Remaining <b className="text-emerald-700">{freeRemainingQty}</b></span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <QtyField label={item.unit || 'Pcs'} value={v(ri.rtFreeUnitQty)} disabled={freePcsPerUnit <= 0 || freeRemainingQty <= 0} onChange={(val) => handleQty('free', index, 'u', val, item)} />
                                        {item.parentMode && (
                                            <QtyField label={item.subUnit || 'Sub'} value={v(ri.rtFreeSubQty)} disabled={freeRemainingQty <= 0 || getPcsPerSub(item) <= 0} onChange={(val) => handleQty('free', index, 's', val, item)} />
                                        )}
                                        <QtyField label="Pcs" value={v(ri.rtFreePcsQty)} disabled={freeRemainingQty <= 0} onChange={(val) => handleQty('free', index, 'p', val, item)} />
                                    </div>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className={labelCls}>Sell Price (PCS)</label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        disabled={remainingQty <= 0}
                                        value={returnPricesPcs[index] === 0 ? '' : returnPricesPcs[index] ?? ''}
                                        onChange={(e) => handleReturnPricePcsChange(index, e.target.value)}
                                        className={`${inputCls} text-right`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Others Free */}
                {selectedOrder.freeItems && selectedOrder.freeItems.length > 0 && (
                    <Card title="Others Free Product Return">
                        <div className="space-y-3">
                            {selectedOrder.freeItems.map((item, index) => {
                                const pcsPerUnit = getFreePcsPerUnit(item);
                                const remainingQty = getFreeItemRemainingQty(item);
                                const totalRtQty = getFreeItemTotalRtQty(index, item);
                                const fi = freeReturnInputs[index] || {};
                                return (
                                    <div key={index} className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                                        <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                                            <div>
                                                <p className="font-bold text-slate-800">{item.productName}</p>
                                                <p className="text-xs text-slate-500">{item.company}</p>
                                            </div>
                                            <span className="text-xs text-slate-600">Total RT <b className="text-orange-600">{totalRtQty}</b> · Remaining <b className="text-brand-700">{remainingQty}</b></span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-w-xl">
                                            <QtyField label={item.unit || 'Pcs'} value={v(fi.rtUnitQty)} disabled={pcsPerUnit <= 0 || remainingQty <= 0} onChange={(val) => handleQty('other', index, 'u', val, item)} />
                                            {item.parentMode && (
                                                <QtyField label={item.subUnit || 'Sub'} value={v(fi.rtSubQty)} disabled={remainingQty <= 0 || getPcsPerSub(item) <= 0} onChange={(val) => handleQty('other', index, 's', val, item)} />
                                            )}
                                            <QtyField label="Pcs" value={v(fi.rtPcsQty)} disabled={remainingQty <= 0} onChange={(val) => handleQty('other', index, 'p', val, item)} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Note */}
                <Card>
                    <label className={labelCls}>Return Note (Optional)</label>
                    <textarea
                        rows="3"
                        placeholder="Write any note about this return..."
                        value={returnNote}
                        onChange={(e) => setReturnNote(e.target.value)}
                        className={`${inputCls} resize-y`}
                    />
                </Card>

                {/* Payment */}
                <div>
                    <PaymentSection
                        returnAmount={totalReturnAmount}
                        open={paymentOpen}
                        setOpen={setPaymentOpen}
                        amount={paymentAmount}
                        setAmount={handlePaymentAmountChange}
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
                        <p className={`mt-2 px-1 text-xs font-semibold ${accAvailable < (Number(paymentAmount) || 0) ? 'text-rose-600' : 'text-emerald-600'}`}>
                            Available: ৳{accAvailable.toFixed(2)}
                        </p>
                    )}
                </div>

                {/* Totals + confirm */}
                <Card>
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total RT Qty</p>
                                <p className="text-lg font-bold text-slate-800">{totalReturnPcs}</p>
                                <p className="text-[11px] font-semibold text-emerald-600">Free: {totalReturnFreeQty}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Return Amount</p>
                                <p className="text-lg font-bold text-orange-600">৳{totalReturnAmount.toFixed(2)}</p>
                            </div>
                            {(selectedOrder.freeItems || []).length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">RT Others Free</p>
                                    <p className="text-lg font-bold text-amber-600">{totalReturnFreeItemsQty}</p>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={handleConfirmReturn}
                            disabled={submitting}
                            className="bg-brand-600 text-white text-sm font-semibold px-6 py-3 inline-flex items-center justify-center gap-2 w-full lg:w-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {submitting ? 'Processing...' : isEditMode ? 'Update Return' : 'Confirm Return'}
                        </button>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SalesReturnDetails;