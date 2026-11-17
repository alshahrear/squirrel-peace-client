import React, { useEffect, useState, useRef } from 'react';
import { getPurchaseItemCostPerPcs } from '../../Software/Inventory/Stock/StockPurchase';
import useCan from '../../../../hooks/useCan';
import toast from 'react-hot-toast';
import { DateInput } from '../Product/ProductUi';
import { inputCls, labelCls } from './PurchaseUi';
import { Card, QtyField, PaymentSection } from './PurchaseFormUi';
import { labelToISO } from './purchaseDate';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    Phone,
    Mail,
    MapPin,
    Calendar,
    Building2,
    ArrowLeft,
    PackageX,
    RotateCcw
} from 'lucide-react';

const PurchaseReturnDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editReturnId = searchParams.get('returnId');
    const isEditMode = !!editReturnId;
    const { canAdd: canAddReturn, canEdit: canEditReturn } = useCan('purchase_return');
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [returnInputs, setReturnInputs] = useState([]); // [{ rtUnitQty, rtPcsQty, rtFreeQty }, ...]
    const [returnPrices, setReturnPrices] = useState([]); // [buyPrice per item, editable for calc only]
    const [freeReturnInputs, setFreeReturnInputs] = useState([]); // Others Free Product return: [{ rtUnitQty, rtPcsQty }, ...]
    const [returnNote, setReturnNote] = useState('');

    // Return Date (default: আজকের তারিখ, চাইলে পরিবর্তন করা যাবে)
    const getFormattedToday = () =>
        new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const [returnDate, setReturnDate] = useState(getFormattedToday());
    const returnDateInputRef = useRef(null);

    const handleReturnDateChange = (e) => {
        const rawDate = e.target.value;
        if (rawDate) {
            const [year, month, day] = rawDate.split('-');
            const formatted = new Date(year, month - 1, day).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
            setReturnDate(formatted);
        }
    };

    // ---------------- Payment (optional, default collapsed) ----------------
    const [investments, setInvestments] = useState([]);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentAmountTouched, setPaymentAmountTouched] = useState(false);
    const [paymentAccountType, setPaymentAccountType] = useState('');
    const [selectedAccountKey, setSelectedAccountKey] = useState('');
    const [paymentNote, setPaymentNote] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [stockBatches, setStockBatches] = useState([]);
    const [salesList, setSalesList] = useState([]);
    const [bulkReturnList, setBulkReturnList] = useState([]);
    const [salesBulkList, setSalesBulkList] = useState([]);
    const [damageList, setDamageList] = useState([]);
    const [adjustmentList, setAdjustmentList] = useState([]);
    const setToast = () => { };

    const showToast = (message, type = 'success') => {
        type === 'error' ? toast.error(message) : toast.success(message);
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    // --------------------------------------------------
    // Number ke sobsomoy 2 digit porjonto Round korar Helper
    // --------------------------------------------------
    const roundTo2 = (num) => Math.round((Number(num) || 0) * 100) / 100;

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedInvoice(data);

                    // Edit Mode hole matching return entry theke value prefill korbe
                    const editingEntry = editReturnId
                        ? (data.returnHistory || []).find((ret) => ret.returnId === editReturnId)
                        : null;
                    setReturnNote(editingEntry?.returnNote || '');
                    setReturnDate(editingEntry?.returnDate || getFormattedToday());

                    // Edit mode e age payment thakle prefill + open
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
                            if (editingEntry) {
                                const found = editingEntry.items?.find((it) => it.productId === item.productId);
                                if (found) {
                                    return {
                                        rtUnitQty: Number(found.returnUnitQty) || 0,
                                        rtPcsQty: Number(found.returnPcsQty) || 0,
                                        rtSubQty: Number(found.returnSubQty) || 0,
                                        rtFreeSubQty: Number(found.returnFreeSubQty) || 0,
                                        rtFreeUnitQty: Number(found.returnFreeUnitQty) || 0,
                                        rtFreePcsQty: Number(found.returnFreePcsQty) || 0,
                                    };
                                }
                            }
                            return { rtUnitQty: 0, rtSubQty: 0, rtPcsQty: 0, rtFreeUnitQty: 0, rtFreeSubQty: 0, rtFreePcsQty: 0 };
                        })
                    );

                    // Cost StockPurchase.jsx er central function theke ashche
                    setReturnPrices(
                        (data.items || []).map((item) => {
                            const found = editingEntry?.items?.find((it) => it.productId === item.productId);
                            const savedQty = Number(found?.returnTotalQty) || 0;
                            if (found && savedQty > 0) return roundTo2((Number(found.returnAmount) || 0) / savedQty);
                            return getPurchaseItemCostPerPcs(data, item);
                        })
                    );

                    setFreeReturnInputs(
                        (data.freeItems || []).map((item) => {
                            if (editingEntry) {
                                const found = editingEntry.freeItems?.find((it) => it.productId === item.productId);
                                if (found) {
                                    return {
                                        rtUnitQty: Number(found.returnUnitQty) || 0,
                                        rtSubQty: Number(found.returnSubQty) || 0,
                                        rtPcsQty: Number(found.returnPcsQty) || 0,
                                    };
                                }
                            }
                            return { rtUnitQty: 0, rtSubQty: 0, rtPcsQty: 0 };
                        })
                    );


                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching purchase data:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id, editReturnId]);

    // --------------------------------------------------
    // 1 Unit = koto PCS, item er original purchase data theke ber kora
    // --------------------------------------------------
    // stock-purchase batch gulo anbe
    useEffect(() => {
        fetch('http://localhost:5000/stock-purchase')
            .then((res) => res.json())
            .then((data) => setStockBatches(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching stock:', error));

        fetch('http://localhost:5000/sales')
            .then((res) => res.json())
            .then((data) => setSalesList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching sales:', error));

        fetch('http://localhost:5000/purchase-bulk-return')
            .then((res) => res.json())
            .then((data) => setBulkReturnList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching bulk returns:', error));

        fetch('http://localhost:5000/sales-bulk-return')
            .then((res) => res.json())
            .then((data) => setSalesBulkList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching sales bulk returns:', error));

        fetch('http://localhost:5000/sales-damage')
            .then((res) => res.json())
            .then((data) => setDamageList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching damages:', error));

        fetch('http://localhost:5000/stock-adjustment')
            .then((res) => res.json())
            .then((data) => setAdjustmentList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching adjustments:', error));
    }, [id]);

    // Investment accounts (Payment section er jonno)
    useEffect(() => {
        fetch('http://localhost:5000/investment')
            .then((res) => res.json())
            .then((data) => setInvestments(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching investments:', error));
    }, []);

    // Ei purchase er ei product er stock a ekhon koto ache (sales e bikri howa bad diye)
    // = batch.availableQty - onno return entry gulor qty (nijer edit entry bad)
    const getStockAvail = (item, isFree = false) => {
        const batch = stockBatches.find(
            (b) =>
                String(b.purchaseId) === String(id) &&
                String(b.productId) === String(item.productId) &&
                (b.isFreeProduct === true) === isFree
        );
        if (!batch) return Infinity;

        let other = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
            if (isEditMode && ret.returnId === editReturnId) return;
            if (isFree) {
                const f = ret.freeItems?.find((it) => it.productId === item.productId);
                if (f) other += Number(f.returnTotalQty) || 0;
            } else {
                const f = ret.items?.find((it) => it.productId === item.productId);
                if (f) other += (Number(f.returnTotalQty) || 0) + (Number(f.returnFreeTotalQty ?? f.returnFreeQty) || 0);
            }
        });
        return Math.max((Number(batch.availableQty) || 0) - other, 0);
    };

    // Sales er por ei batch a Main ar Free alada alada koto available ache
    const getStockSplit = (item, isFree = false) => {
        const batch = stockBatches.find(
            (b) =>
                String(b.purchaseId) === String(id) &&
                String(b.productId) === String(item.productId) &&
                (b.isFreeProduct === true) === isFree
        );
        if (!batch) return { paid: Infinity, free: Infinity };

        // Onno return entry gulor qty (nijer edit entry bad)
        let otherPaid = 0;
        let otherFree = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
            if (isEditMode && ret.returnId === editReturnId) return;
            if (isFree) {
                const f = ret.freeItems?.find((it) => it.productId === item.productId);
                if (f) otherFree += Number(f.returnTotalQty) || 0;
            } else {
                const f = ret.items?.find((it) => it.productId === item.productId);
                if (f) {
                    otherPaid += Number(f.returnTotalQty) || 0;
                    otherFree += Number(f.returnFreeTotalQty ?? f.returnFreeQty) || 0;
                }
            }
        });

        // Sales theke ei batch er Main / Free / Others sold (customer return bad diye)
        const sold = { paid: 0, free: 0 };
        salesList.forEach((s) =>
            (s.stockAllocations || []).forEach((a) => {
                if (String(a.batchId) !== String(batch._id)) return;
                const net = Math.max((Number(a.qty) || 0) - (Number(a.returned) || 0), 0);
                const pool = a.pool || ((a.kind || 'main') === 'main' ? 'paid' : 'free');
                sold[pool] += net;
            })
        );

        // Sales bulk return (customer return) => stock plus
        salesBulkList.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                if (String(a.batchId) !== String(batch._id)) return;
                sold[a.pool === 'paid' ? 'paid' : 'free'] -= Number(a.qty) || 0;
            })
        );

        // Damage => stock minus
        damageList.forEach((d) =>
            (d.stockAllocations || []).forEach((a) => {
                if (String(a.batchId) !== String(batch._id)) return;
                sold[a.pool === 'paid' ? 'paid' : 'free'] += Number(a.qty) || 0;
            })
        );

        // Adjustment (In = plus, Out = minus)
        adjustmentList.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                if (String(a.batchId) !== String(batch._id)) return;
                sold[a.pool === 'paid' ? 'paid' : 'free'] += (a.direction === 'out' ? 1 : -1) * (Number(a.qty) || 0);
            })
        );

        // Bulk return theke ei batch er koto qty gese
        bulkReturnList.forEach((r) =>
            (r.stockAllocations || []).forEach((a) => {
                if (String(a.batchId) !== String(batch._id)) return;
                const q = Number(a.qty) || 0;
                if (a.pool === 'paid') otherPaid += q;
                else otherFree += q;
            })
        );

        const curPaid = Math.max((Number(batch.paidQty) || 0) - otherPaid, 0);
        const curFree = Math.max((Number(batch.freeQty) || 0) - otherFree, 0);

        if (isFree) {
            return { paid: 0, free: Math.max(curFree - (sold.paid + sold.free), 0) };
        }
        // pool onujayi hisab, tai alada overflow hisab lagbe na
        return {
            paid: Math.max(curPaid - sold.paid, 0),
            free: Math.max(curFree - sold.free, 0),
        };
    };

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

    // --------------------------------------------------
    // 1 Free Unit = koto Free PCS
    // --------------------------------------------------
    const getFreePcsPerUnit = (item) => {
        if (Number(item.pcsPerUnit) > 0) return Number(item.pcsPerUnit);
        const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
        const freePcsQtyNum = Number(item.freePcsQty) || 0;
        const freeTotalQtyNum = Number(item.freeTotalQty ?? item.freeQty) || 0;
        if (freeUnitQtyNum > 0) {
            const perUnit = (freeTotalQtyNum - freePcsQtyNum) / freeUnitQtyNum;
            return perUnit > 0 ? perUnit : 0;
        }
        return 0;
    };

    // --------------------------------------------------
    // Age koto Total RT Qty return kora hoyeche (returnHistory theke)
    // --------------------------------------------------
    const getReturnedQtyForProduct = (productId) => {
        if (!selectedInvoice?.returnHistory) return 0;
        return selectedInvoice.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum; // nijer entry bad diye hisab hobe
            const found = ret.items?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnTotalQty) || 0 : 0);
        }, 0);
    };

    // --------------------------------------------------
    // Age koto Free Qty return kora hoyeche (returnHistory theke)
    // --------------------------------------------------
    const getReturnedFreeQtyForProduct = (productId) => {
        if (!selectedInvoice?.returnHistory) return 0;
        return selectedInvoice.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum; // nijer entry bad diye hisab hobe
            const found = ret.items?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnFreeTotalQty ?? found.returnFreeQty) || 0 : 0);
        }, 0);
    };
    const getRemainingQty = (item) => {
        const returned = getReturnedQtyForProduct(item.productId);
        return Math.min(Math.max(Number(item.totalPcs || 0) - returned, 0), getStockSplit(item, false).paid);
    };

    const getFreeRemainingQty = (item) => {
        const returned = getReturnedFreeQtyForProduct(item.productId);
        return Math.min(Math.max(Number(item.freeTotalQty ?? item.freeQty ?? 0) - returned, 0), getStockSplit(item, false).free);
    };

    const getTotalRtQty = (index, item) => {
        const pcsPerUnit = getPcsPerUnit(item);
        const rtUnitQty = Number(returnInputs[index]?.rtUnitQty) || 0;
        const rtSubQty = Number(returnInputs[index]?.rtSubQty) || 0;
        const rtPcsQty = Number(returnInputs[index]?.rtPcsQty) || 0;
        return rtUnitQty * pcsPerUnit + rtSubQty * getPcsPerSub(item) + rtPcsQty;
    };

    const getTotalRtFreeQty = (index, item) => {
        const freePcsPerUnit = getFreePcsPerUnit(item);
        const rtFreeUnitQty = Number(returnInputs[index]?.rtFreeUnitQty) || 0;
        const rtFreeSubQty = Number(returnInputs[index]?.rtFreeSubQty) || 0;
        const rtFreePcsQty = Number(returnInputs[index]?.rtFreePcsQty) || 0;
        return rtFreeUnitQty * freePcsPerUnit + rtFreeSubQty * getPcsPerSub(item) + rtFreePcsQty;
    };


    // --------------------------------------------------
    // Others Free Product — 1 Unit = koto PCS
    // --------------------------------------------------
    const getFreeItemPcsPerUnit = (item) => {
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

    // Others Free Product — age koto Total RT Qty return kora hoyeche
    const getReturnedFreeItemQtyForProduct = (productId) => {
        if (!selectedInvoice?.returnHistory) return 0;
        return selectedInvoice.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum;
            const found = ret.freeItems?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnTotalQty) || 0 : 0);
        }, 0);
    };

    const getFreeItemRemainingQty = (item) => {
        const returned = getReturnedFreeItemQtyForProduct(item.productId);
        return Math.min(Math.max(Number(item.totalQty || 0) - returned, 0), getStockSplit(item, true).free);
    };

    const getFreeItemTotalRtQty = (index, item) => {
        const pcsPerUnit = getFreeItemPcsPerUnit(item);
        const rtUnitQty = Number(freeReturnInputs[index]?.rtUnitQty) || 0;
        const rtSubQty = Number(freeReturnInputs[index]?.rtSubQty) || 0;
        const rtPcsQty = Number(freeReturnInputs[index]?.rtPcsQty) || 0;
        return rtUnitQty * pcsPerUnit + rtSubQty * getPcsPerSub(item) + rtPcsQty;
    };



    const getReturnAmount = (index, item) => {
        const totalRtQty = getTotalRtQty(index, item);
        const price = returnPrices[index] !== undefined ? Number(returnPrices[index]) || 0 : (Number(item.buyPrice) || 0);
        return roundTo2(totalRtQty * price);
    };


    // --------------------------------------------------
    // RT Qty (Unit) Change
    // --------------------------------------------------
    const handleRtUnitQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const pcsPerUnit = getPcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getRemainingQty(item);
        const currentPcsQty = (Number(returnInputs[index]?.rtPcsQty) || 0) + (Number(returnInputs[index]?.rtSubQty) || 0) * getPcsPerSub(item);
        const total = val * pcsPerUnit + currentPcsQty;

        if (total > remaining) {
            const maxVal = pcsPerUnit > 0 ? Math.floor((remaining - currentPcsQty) / pcsPerUnit) : 0;
            val = Math.max(0, maxVal);
        }

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtUnitQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // PCS Qty Change
    // --------------------------------------------------
    const handleRtSubQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return;
        const pcsPerSub = getPcsPerSub(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getRemainingQty(item);
        const others =
            (Number(returnInputs[index]?.rtUnitQty) || 0) * getPcsPerUnit(item) +
            (Number(returnInputs[index]?.rtPcsQty) || 0);
        const maxVal = pcsPerSub > 0 ? Math.floor(Math.max(0, remaining - others) / pcsPerSub) : 0;
        if (val > maxVal) val = maxVal;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtSubQty: val };
            return updated;
        });
    };

    const handleRtPcsQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const pcsPerUnit = getPcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getRemainingQty(item);
        const currentUnitQty = Number(returnInputs[index]?.rtUnitQty) || 0;
        const unitPortion = currentUnitQty * pcsPerUnit + (Number(returnInputs[index]?.rtSubQty) || 0) * getPcsPerSub(item);
        const maxPcs = Math.max(0, remaining - unitPortion);

        if (val > maxPcs) val = maxPcs;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtPcsQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // RT Free Qty Change
    // --------------------------------------------------
    const handleRtFreeUnitQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const freePcsPerUnit = getFreePcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const freeRemaining = getFreeRemainingQty(item);
        const currentFreePcsQty = (Number(returnInputs[index]?.rtFreePcsQty) || 0) + (Number(returnInputs[index]?.rtFreeSubQty) || 0) * getPcsPerSub(item);
        const total = val * freePcsPerUnit + currentFreePcsQty;

        if (total > freeRemaining) {
            const maxVal = freePcsPerUnit > 0 ? Math.floor((freeRemaining - currentFreePcsQty) / freePcsPerUnit) : 0;
            val = Math.max(0, maxVal);
        }

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtFreeUnitQty: val };
            return updated;
        });
    };

    const handleRtFreeSubQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return;
        const pcsPerSub = getPcsPerSub(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const freeRemaining = getFreeRemainingQty(item);
        const others =
            (Number(returnInputs[index]?.rtFreeUnitQty) || 0) * getFreePcsPerUnit(item) +
            (Number(returnInputs[index]?.rtFreePcsQty) || 0);
        const maxVal = pcsPerSub > 0 ? Math.floor(Math.max(0, freeRemaining - others) / pcsPerSub) : 0;
        if (val > maxVal) val = maxVal;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtFreeSubQty: val };
            return updated;
        });
    };

    const handleRtFreePcsQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const freePcsPerUnit = getFreePcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const freeRemaining = getFreeRemainingQty(item);
        const currentFreeUnitQty = Number(returnInputs[index]?.rtFreeUnitQty) || 0;
        const unitPortion = currentFreeUnitQty * freePcsPerUnit + (Number(returnInputs[index]?.rtFreeSubQty) || 0) * getPcsPerSub(item);
        const maxPcs = Math.max(0, freeRemaining - unitPortion);

        if (val > maxPcs) val = maxPcs;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtFreePcsQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // Item Discount Change
    // --------------------------------------------------
    // --------------------------------------------------
    // Others Free Product — RT Qty (Unit) Change
    // --------------------------------------------------
    const handleFreeRtUnitQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return;
        const pcsPerUnit = getFreeItemPcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getFreeItemRemainingQty(item);
        const currentPcsQty = (Number(freeReturnInputs[index]?.rtPcsQty) || 0) + (Number(freeReturnInputs[index]?.rtSubQty) || 0) * getPcsPerSub(item);
        const total = val * pcsPerUnit + currentPcsQty;

        if (total > remaining) {
            const maxVal = pcsPerUnit > 0 ? Math.floor((remaining - currentPcsQty) / pcsPerUnit) : 0;
            val = Math.max(0, maxVal);
        }

        setFreeReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtUnitQty: val };
            return updated;
        });
    };

    // Others Free Product — RT PCS Qty Change
    const handleFreeRtSubQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return;
        const pcsPerSub = getPcsPerSub(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getFreeItemRemainingQty(item);
        const others =
            (Number(freeReturnInputs[index]?.rtUnitQty) || 0) * getFreeItemPcsPerUnit(item) +
            (Number(freeReturnInputs[index]?.rtPcsQty) || 0);
        const maxVal = pcsPerSub > 0 ? Math.floor(Math.max(0, remaining - others) / pcsPerSub) : 0;
        if (val > maxVal) val = maxVal;

        setFreeReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtSubQty: val };
            return updated;
        });
    };

    const handleFreeRtPcsQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return;
        const pcsPerUnit = getFreeItemPcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getFreeItemRemainingQty(item);
        const currentUnitQty = Number(freeReturnInputs[index]?.rtUnitQty) || 0;
        const unitPortion = currentUnitQty * pcsPerUnit + (Number(freeReturnInputs[index]?.rtSubQty) || 0) * getPcsPerSub(item);
        const maxPcs = Math.max(0, remaining - unitPortion);

        if (val > maxPcs) val = maxPcs;

        setFreeReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtPcsQty: val };
            return updated;
        });
    };



    const handleReturnPriceChange = (index, value) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return; // পয়েন্টের পর সর্বোচ্চ ২ ডিজিট
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        setReturnPrices((prev) => {
            const updated = [...prev];
            updated[index] = val;
            return updated;
        });
    };



    const totalReturnPcs = selectedInvoice
        ? selectedInvoice.items.reduce((sum, item, index) => sum + getTotalRtQty(index, item), 0)
        : 0;

    const totalReturnFreeQty = selectedInvoice
        ? selectedInvoice.items.reduce((sum, item, index) => sum + getTotalRtFreeQty(index, item), 0)
        : 0;

    const totalReturnAmount = selectedInvoice
        ? roundTo2(selectedInvoice.items.reduce((sum, item, index) => sum + getReturnAmount(index, item), 0))
        : 0;

    const totalReturnFreeItemsQty = selectedInvoice
        ? (selectedInvoice.freeItems || []).reduce((sum, item, index) => sum + getFreeItemTotalRtQty(index, item), 0)
        : 0;


    // ---------------- Payment helpers ----------------
    const accountTypes = [...new Set(investments.map((inv) => inv.accountType).filter(Boolean))];

    const getAccountKey = (inv) => {
        if (inv.accountType === 'Bank') {
            return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
        }
        if (inv.accountType === 'Mobile Banking') {
            return `${inv.accountName}-${inv.accountNumber}`;
        }
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

    // User nijer hate change na korle Payment Amount = Total Return Amount auto sync
    useEffect(() => {
        if (!paymentAmountTouched) {
            setPaymentAmount(roundTo2(totalReturnAmount));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalReturnAmount, paymentAmountTouched]);

    const handleConfirmReturn = async () => {
        if (isEditMode ? !canEditReturn : !canAddReturn) {
            showToast('আপনার Add / Edit / Delete করার অনুমতি নেই!', 'error');
            return;
        }
        const overStockItem = selectedInvoice.items.find((item, index) => {
            const split = getStockSplit(item, false);
            return (
                (Number.isFinite(split.paid) && getTotalRtQty(index, item) > split.paid) ||
                (Number.isFinite(split.free) && getTotalRtFreeQty(index, item) > split.free)
            );
        });
        if (overStockItem) {
            const split = getStockSplit(overStockItem, false);
            showToast(`${overStockItem.productName}: স্টকে মেইন ${split.paid} পিস, ফ্রি ${split.free} পিস আছে, এর বেশি ফেরত দেওয়া যাবে না!`, 'error');
            return;
        }
        const overFreeItem = (selectedInvoice.freeItems || []).find(
            (item, index) => getFreeItemTotalRtQty(index, item) > getStockSplit(item, true).free
        );
        if (overFreeItem) {
            showToast(`${overFreeItem.productName}: স্টকে ${getStockSplit(overFreeItem, true).free} পিস আছে, এর বেশি ফেরত দেওয়া যাবে না!`, 'error');
            return;
        }
        if (totalReturnPcs <= 0 && totalReturnFreeQty <= 0 && totalReturnFreeItemsQty <= 0) {
            showToast('ফেরত দেওয়ার জন্য কমপক্ষে ১টি পণ্যের পরিমাণ দিন!', 'error');
            return;
        }

        // ---------------- Payment validation (shudhu Payment open thakle) ----------------
        let paymentData = null;
        if (paymentOpen) {
            if (paymentAmount === '' || paymentAmount === null) {
                showToast('Payment amount is required! (or close Payment)', 'error');
                return;
            }
            if (!(Number(paymentAmount) > 0)) {
                showToast('Payment amount must be greater than 0! (or close Payment)', 'error');
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

        setSubmitting(true);
        try {
            const { _id, ...rest } = selectedInvoice;

            const returnedItems = selectedInvoice.items
                .map((item, index) => {
                    const totalRtQty = getTotalRtQty(index, item);
                    const totalRtFreeQty = getTotalRtFreeQty(index, item);
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        returnUnitQty: Number(returnInputs[index]?.rtUnitQty) || 0,
                        returnSubQty: Number(returnInputs[index]?.rtSubQty) || 0,
                        returnPcsQty: Number(returnInputs[index]?.rtPcsQty) || 0,
                        returnTotalQty: totalRtQty,
                        returnFreeUnitQty: Number(returnInputs[index]?.rtFreeUnitQty) || 0,
                        returnFreeSubQty: Number(returnInputs[index]?.rtFreeSubQty) || 0,
                        returnFreePcsQty: Number(returnInputs[index]?.rtFreePcsQty) || 0,
                        returnFreeTotalQty: totalRtFreeQty,
                        returnAmount: getReturnAmount(index, item),
                    };
                })
                .filter((it) => it.returnTotalQty > 0 || it.returnFreeTotalQty > 0);

            const freeReturnedItems = (selectedInvoice.freeItems || [])
                .map((item, index) => {
                    const totalRtQty = getFreeItemTotalRtQty(index, item);
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        returnUnitQty: Number(freeReturnInputs[index]?.rtUnitQty) || 0,
                        returnSubQty: Number(freeReturnInputs[index]?.rtSubQty) || 0,
                        returnPcsQty: Number(freeReturnInputs[index]?.rtPcsQty) || 0,
                        returnTotalQty: totalRtQty,
                    };
                })
                .filter((it) => it.returnTotalQty > 0);

            let updatedReturnHistory;

            if (isEditMode) {
                // Existing return entry ke update korbe, ID o original date thakbe
                updatedReturnHistory = (selectedInvoice.returnHistory || []).map((ret) => {
                    if (ret.returnId !== editReturnId) return ret;
                    return {
                        ...ret,
                        returnDate,
                        returnNote: returnNote.trim(),
                        items: returnedItems,
                        freeItems: freeReturnedItems,
                        totalReturnFreeItemsQty,
                        totalReturnPcs,
                        totalReturnFreeQty,
                        totalReturnAmount,
                    };
                });
            } else {
                const returnId = `RET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
                const newReturnEntry = {
                    returnNote: returnNote.trim(),
                    returnId,
                    returnDate,
                    items: returnedItems,
                    freeItems: freeReturnedItems,
                    totalReturnFreeItemsQty,
                    totalReturnPcs,
                    totalReturnFreeQty,
                    totalReturnAmount,
                };
                updatedReturnHistory = [...(selectedInvoice.returnHistory || []), newReturnEntry];
            }

            const updatedData = {
                ...rest,
                returnHistory: updatedReturnHistory.map((ret, i) =>
                    (isEditMode ? ret.returnId === editReturnId : i === updatedReturnHistory.length - 1)
                        ? { ...ret, payment: paymentData }
                        : ret
                ),
            };

            const response = await fetch(`http://localhost:5000/purchase/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                showToast(
                    isEditMode ? 'Purchase return successfully updated!' : 'Purchase return successfully added!',
                    'success'
                );
                setTimeout(() => navigate('/purchase-return'), 900);
            } else {
                showToast('Failed to update return!', 'error');
            }
        } catch (error) {
            console.error('Error updating return:', error);
            showToast('Server error while updating return!', 'error');
        } finally {
            setSubmitting(false);
        }
    };

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

    if (notFound || !selectedInvoice) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full">
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-7 h-7 text-rose-500" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Invoice Not Found</h2>
                    <p className="text-slate-500 text-sm mt-2">This purchase record couldn't be found. It may have been deleted.</p>
                    <button onClick={() => navigate('/purchase')} className="mt-5 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer">
                        <ArrowLeft className="w-4 h-4" /> Back to Purchases
                    </button>
                </div>
            </div>
        );
    }

    const v = (x) => (x === 0 || x === undefined || x === null ? '' : x);

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-[1400px] mx-auto space-y-4">
                <button
                    type="button"
                    onClick={() => navigate('/purchase')}
                    className="h-10 px-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Purchases
                </button>

                {/* Invoice info */}
                <Card>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center shrink-0">
                                <Building2 className="w-6 h-6 text-brand-600" />
                            </div>
                            <div>
                                <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md mb-1 uppercase">Purchase Return</span>
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
                            <p className="font-bold text-slate-800">{selectedInvoice.company}</p>
                            <p className="text-xs text-slate-600 mt-0.5">{selectedInvoice.phone}</p>
                            <p className="text-xs text-slate-600">{selectedInvoice.address}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2 py-0.5 rounded-md mb-2 uppercase">Bill To</span>
                                    <p className="font-bold text-slate-800">Demo Enterprise</p>
                                    <p className="text-xs text-slate-500 mt-0.5">01612002913</p>
                                    <p className="text-xs text-slate-500">{selectedInvoice.shippingAddress || 'N/A'}</p>
                                </div>
                                <div className="sm:text-right">
                                    <p className="text-xs text-slate-500 flex items-center sm:justify-end gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-brand-500" /> Purchase Date: {selectedInvoice.purchaseDate}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                        Inv: <span className="text-brand-700">{selectedInvoice.invoiceNo}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 max-w-xs">
                        <span className={labelCls}>Return Date *</span>
                        <DateInput name="returnDate" value={labelToISO(returnDate)} onChange={handleReturnDateChange} placeholder="Select date" />
                    </div>
                </Card>

                {/* Items */}
                {selectedInvoice.items.map((item, index) => {
                    const pcsPerUnit = getPcsPerUnit(item);
                    const freePcsPerUnit = getFreePcsPerUnit(item);
                    const remainingQty = getRemainingQty(item);
                    const freeRemainingQty = getFreeRemainingQty(item);
                    const totalRtQty = getTotalRtQty(index, item);
                    const totalRtFreeQty = getTotalRtFreeQty(index, item);
                    const ri = returnInputs[index] || {};
                    return (
                        <div key={index} className="bg-white rounded-2xl border border-slate-200 p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800">{item.productName}</p>
                                    <p className="text-xs text-slate-500">{selectedInvoice.company}</p>
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
                                        <QtyField label={item.unit || 'Pcs'} value={v(ri.rtUnitQty)} disabled={pcsPerUnit <= 0 || remainingQty <= 0} onChange={(val) => handleRtUnitQtyChange(index, val, item)} />
                                        {item.parentMode && (
                                            <QtyField label={item.subUnit || 'Sub'} value={v(ri.rtSubQty)} disabled={remainingQty <= 0 || getPcsPerSub(item) <= 0} onChange={(val) => handleRtSubQtyChange(index, val, item)} />
                                        )}
                                        <QtyField label="Pcs" value={v(ri.rtPcsQty)} disabled={remainingQty <= 0} onChange={(val) => handleRtPcsQtyChange(index, val, item)} />
                                    </div>
                                </div>

                                {/* Free RT */}
                                <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                                    <div className="flex flex-wrap justify-between gap-1 text-xs mb-2">
                                        <span className="font-bold text-emerald-700">RT Free</span>
                                        <span className="text-slate-600">Total <b className="text-emerald-700">{totalRtFreeQty}</b> · Remaining <b className="text-emerald-700">{freeRemainingQty}</b></span>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                        <QtyField label={item.unit || 'Pcs'} value={v(ri.rtFreeUnitQty)} disabled={freePcsPerUnit <= 0 || freeRemainingQty <= 0} onChange={(val) => handleRtFreeUnitQtyChange(index, val, item)} />
                                        {item.parentMode && (
                                            <QtyField label={item.subUnit || 'Sub'} value={v(ri.rtFreeSubQty)} disabled={freeRemainingQty <= 0 || getPcsPerSub(item) <= 0} onChange={(val) => handleRtFreeSubQtyChange(index, val, item)} />
                                        )}
                                        <QtyField label="Pcs" value={v(ri.rtFreePcsQty)} disabled={freeRemainingQty <= 0} onChange={(val) => handleRtFreePcsQtyChange(index, val, item)} />
                                    </div>
                                </div>

                                {/* Price */}
                                <div>
                                    <label className={labelCls}>Purchase Price</label>
                                    <input
                                        type="number"
                                        inputMode="decimal"
                                        min="0"
                                        step="0.01"
                                        value={returnPrices[index] === 0 ? '' : returnPrices[index] ?? ''}
                                        onChange={(e) => handleReturnPriceChange(index, e.target.value)}
                                        className={`${inputCls} text-right`}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Others Free */}
                {selectedInvoice.freeItems && selectedInvoice.freeItems.length > 0 && (
                    <Card title="Others Free Product Return">
                        <div className="space-y-3">
                            {selectedInvoice.freeItems.map((item, index) => {
                                const pcsPerUnit = getFreeItemPcsPerUnit(item);
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
                                            <QtyField label={item.unit || 'Pcs'} value={v(fi.rtUnitQty)} disabled={pcsPerUnit <= 0 || remainingQty <= 0} onChange={(val) => handleFreeRtUnitQtyChange(index, val, item)} />
                                            {item.parentMode && (
                                                <QtyField label={item.subUnit || 'Sub'} value={v(fi.rtSubQty)} disabled={remainingQty <= 0 || getPcsPerSub(item) <= 0} onChange={(val) => handleFreeRtSubQtyChange(index, val, item)} />
                                            )}
                                            <QtyField label="Pcs" value={v(fi.rtPcsQty)} disabled={remainingQty <= 0} onChange={(val) => handleFreeRtPcsQtyChange(index, val, item)} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

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

                <PaymentSection
                    returnAmount={totalReturnAmount}
                    open={paymentOpen}
                    setOpen={setPaymentOpen}
                    amount={paymentAmount}
                    setAmount={setPaymentAmount}
                    setTouched={setPaymentAmountTouched}
                    accountType={paymentAccountType}
                    setAccountType={setPaymentAccountType}
                    accountKey={selectedAccountKey}
                    setAccountKey={setSelectedAccountKey}
                    note={paymentNote}
                    setNote={setPaymentNote}
                    investments={investments}
                />

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
                            {(selectedInvoice.freeItems || []).length > 0 && (
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

export default PurchaseReturnDetails;