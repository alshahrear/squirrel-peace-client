import React, { useEffect, useState } from 'react';
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
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [returnInputs, setReturnInputs] = useState([]); // [{ rtUnitQty, rtPcsQty, rtFreeQty }, ...]
    const [returnPrices, setReturnPrices] = useState([]); // [buyPrice per item, editable for calc only]
    const [freeReturnInputs, setFreeReturnInputs] = useState([]); // Others Free Product return: [{ rtUnitQty, rtPcsQty }, ...]
    const [returnNote, setReturnNote] = useState('');

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
    const [toast, setToast] = useState({ show: false, message: '', type: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
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
        fetch(`https://squirrel-peace-server.onrender.com/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedInvoice(data);

                    // Edit Mode hole matching return entry theke value prefill korbe
                    const editingEntry = editReturnId
                        ? (data.returnHistory || []).find((ret) => ret.returnId === editReturnId)
                        : null;
                    setReturnNote(editingEntry?.returnNote || '');

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

                    // StockPurchase এর "Per Pcs Price" এর মতো: discount/adjustment এর পর আসল cost per pcs
                    // Return Adjustment ও Damage Adjustment cost হিসাব থেকে বাদ
                    const payableNum =
                        (Number(data.payableAmount) || 0) +
                        (Number(data.returnAdjustmentAmount) || 0) +
                        (Number(data.damageAdjustmentAmount) || 0);
                    const subtotalSum = (data.items || []).reduce((s, it) => s + (Number(it.itemTotal ?? it.subtotal) || 0), 0);
                    setReturnPrices(
                        (data.items || []).map((item) => {
                            const paidQty = Number(item.totalPcs) || 0;
                            const netCost = subtotalSum > 0
                                ? (payableNum * (Number(item.itemTotal ?? item.subtotal) || 0)) / subtotalSum
                                : 0;
                            return paidQty > 0 ? roundTo2(netCost / paidQty) : (Number(item.buyPrice) || 0);
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
        fetch('https://squirrel-peace-server.onrender.com/stock-purchase')
            .then((res) => res.json())
            .then((data) => setStockBatches(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching stock:', error));

        fetch('https://squirrel-peace-server.onrender.com/sales')
            .then((res) => res.json())
            .then((data) => setSalesList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching sales:', error));

        fetch('https://squirrel-peace-server.onrender.com/purchase-bulk-return')
            .then((res) => res.json())
            .then((data) => setBulkReturnList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching bulk returns:', error));

        fetch('https://squirrel-peace-server.onrender.com/sales-bulk-return')
            .then((res) => res.json())
            .then((data) => setSalesBulkList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching sales bulk returns:', error));

        fetch('https://squirrel-peace-server.onrender.com/sales-damage')
            .then((res) => res.json())
            .then((data) => setDamageList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching damages:', error));

        fetch('https://squirrel-peace-server.onrender.com/stock-adjustment')
            .then((res) => res.json())
            .then((data) => setAdjustmentList(Array.isArray(data) ? data : []))
            .catch((error) => console.error('Error fetching adjustments:', error));
    }, [id]);

    // Investment accounts (Payment section er jonno)
    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/investment')
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
        return totalRtQty * price;
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
        ? selectedInvoice.items.reduce((sum, item, index) => sum + getReturnAmount(index, item), 0)
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

            const today = new Date();
            const returnDate = today.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

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

            const response = await fetch(`https://squirrel-peace-server.onrender.com/purchase/${id}`, {
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
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading invoice...</p>
                </div>
            </div>
        );
    }

    if (notFound || !selectedInvoice) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Invoice Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This purchase record couldn't be found. It may have been deleted.</p>
                    <button
                        onClick={() => navigate('/purchase')}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Purchases
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top action bar */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                        onClick={() => navigate('/purchase')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Purchases
                    </button>
                </div>

                {/* Invoice Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-white overflow-hidden">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-10">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner">
                                    <Building2 className="w-7 h-7 text-white" />
                                </div>
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-white bg-white/20 px-2.5 py-1 rounded-md mb-1.5 uppercase">
                                        Purchase Return
                                    </span>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-white">ইসরাইল এন্টারপ্রাইজ</h1>
                                    <p className="text-indigo-50/90 text-xs sm:text-sm flex items-center gap-1.5 mt-1">
                                        <MapPin className="w-3.5 h-3.5" /> শাহজী পাড়া, বড় বাজার, মেহেরপুর
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs sm:text-sm text-indigo-50/90 space-y-1.5">
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>01997074920</span>
                                </p>
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Mail className="w-3.5 h-3.5" />
                                    <span>jakoberjak2017@gmail.com</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bill From / To */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-b border-slate-200/70">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                                <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-3 uppercase">Bill From</span>
                                <p className="font-bold text-slate-800 text-base">{selectedInvoice.company}</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{selectedInvoice.phone}</p>
                                <p className="text-xs sm:text-sm text-slate-600">{selectedInvoice.address}</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Bill To</span>
                                        <p className="font-bold text-slate-800 text-lg">Demo Enterprise</p>
                                        <p className="text-xs text-slate-500 mt-1">01612002913</p>
                                        <p className="text-xs text-slate-500">{selectedInvoice.shippingAddress || 'N/A'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Purchase Date: {selectedInvoice.purchaseDate}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Inv: <span className="text-indigo-600">{selectedInvoice.invoiceNo}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="p-6 sm:p-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] font-bold uppercase tracking-wider">
                                    <th className="py-3 px-3.5 rounded-l-xl">Product Name</th>
                                    <th className="py-3 px-3.5">Company</th>
                                    <th className="py-3 px-3.5 text-center">RT Qty</th>
                                    <th className="py-3 px-3.5 text-center">PCS Qty</th>
                                    <th className="py-3 px-3.5 text-center">Remaining Quantity</th>
                                    <th className="py-3 px-3.5 text-center">RT Free Unit</th>
                                    <th className="py-3 px-3.5 text-center">RT Free PCS</th>
                                    <th className="py-3 px-3.5 text-center">Remaining Free Qty</th>
                                    <th className="py-3 px-3.5 text-right">Purchase Price</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Return Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.items.map((item, index) => {
                                    const pcsPerUnit = getPcsPerUnit(item);
                                    const freePcsPerUnit = getFreePcsPerUnit(item);
                                    const remainingQty = getRemainingQty(item);
                                    const freeRemainingQty = getFreeRemainingQty(item);
                                    const totalRtQty = getTotalRtQty(index, item);
                                    const totalRtFreeQty = getTotalRtFreeQty(index, item);
                                    const rtUnitDisabled = pcsPerUnit <= 0 || remainingQty <= 0;
                                    const rtPcsDisabled = remainingQty <= 0;
                                    const rtFreeUnitDisabled = freePcsPerUnit <= 0 || freeRemainingQty <= 0;
                                    const rtFreePcsDisabled = freeRemainingQty <= 0;

                                    return (
                                        <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                            <td className="py-4 px-3.5 text-slate-600">{selectedInvoice.company}</td>

                                            {/* RT Qty (Unit) */}
                                            <td className="relative py-4 pl-3.5 pr-0">
                                                <div
                                                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${totalRtQty > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    Total: {totalRtQty}
                                                </div>
                                                <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl flex flex-col-reverse gap-1.5">
                                                    {item.parentMode && (
                                                        <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                disabled={remainingQty <= 0 || getPcsPerSub(item) <= 0}
                                                                value={returnInputs[index]?.rtSubQty === 0 ? '' : returnInputs[index]?.rtSubQty ?? ''}
                                                                onChange={(e) => handleRtSubQtyChange(index, e.target.value, item)}
                                                                className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            />
                                                            <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate" title="Sub Unit">
                                                                {item.subUnit}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center border border-indigo-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            disabled={rtUnitDisabled}
                                                            value={returnInputs[index]?.rtUnitQty === 0 ? '' : returnInputs[index]?.rtUnitQty ?? ''}
                                                            onChange={(e) => handleRtUnitQtyChange(index, e.target.value, item)}
                                                            className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />

                                                        <span
                                                            className="flex-1 bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                            title="Unit"
                                                        >
                                                            {item.unit || 'Pcs'}
                                                        </span>

                                                    </div>
                                                </div>
                                            </td>

                                            {/* PCS Qty */}
                                            <td className="py-4 pl-0 pr-3.5 min-w-[100px]">
                                                <div className="p-1.5 bg-indigo-50 border border-l-0 border-indigo-200 rounded-r-2xl">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        disabled={rtPcsDisabled}
                                                        value={returnInputs[index]?.rtPcsQty === 0 ? '' : returnInputs[index]?.rtPcsQty ?? ''}
                                                        onChange={(e) => handleRtPcsQtyChange(index, e.target.value, item)}
                                                        className="w-full min-w-[70px] px-3 py-2 rounded-xl border border-indigo-200 bg-white text-sm outline-none shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </td>

                                            {/* Remaining Quantity */}
                                            <td className="py-4 px-3.5 text-center font-semibold text-indigo-600">{remainingQty}</td>

                                            {/* RT Free Unit Qty */}
                                            <td className="relative py-4 pl-3.5 pr-0">
                                                <div
                                                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${totalRtFreeQty > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    Total: {totalRtFreeQty}
                                                </div>
                                                <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl flex flex-col-reverse gap-1.5">
                                                    {item.parentMode && (
                                                        <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                disabled={freeRemainingQty <= 0 || getPcsPerSub(item) <= 0}
                                                                value={returnInputs[index]?.rtFreeSubQty === 0 ? '' : returnInputs[index]?.rtFreeSubQty ?? ''}
                                                                onChange={(e) => handleRtFreeSubQtyChange(index, e.target.value, item)}
                                                                className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            />
                                                            <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate" title="Sub Unit">
                                                                {item.subUnit}
                                                            </span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-center border border-emerald-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">

                                                        <input
                                                            type="number"
                                                            min="0"
                                                            disabled={rtFreeUnitDisabled}
                                                            value={returnInputs[index]?.rtFreeUnitQty === 0 ? '' : returnInputs[index]?.rtFreeUnitQty ?? ''}
                                                            onChange={(e) => handleRtFreeUnitQtyChange(index, e.target.value, item)}
                                                            className="w-14 px-2 py-2 bg-transparent text-sm outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />

                                                        <span
                                                            className="flex-1 bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                            title="Unit"
                                                        >
                                                            {item.unit || 'Pcs'}
                                                        </span>

                                                    </div>
                                                </div>
                                            </td>

                                            {/* RT Free PCS Qty */}
                                            <td className="py-4 pl-0 pr-3.5 min-w-[100px]">
                                                <div className="p-1.5 bg-emerald-50 border border-l-0 border-emerald-200 rounded-r-2xl">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        disabled={rtFreePcsDisabled}
                                                        value={returnInputs[index]?.rtFreePcsQty === 0 ? '' : returnInputs[index]?.rtFreePcsQty ?? ''}
                                                        onChange={(e) => handleRtFreePcsQtyChange(index, e.target.value, item)}
                                                        className="w-full min-w-[70px] px-3 py-2 rounded-xl border border-emerald-200 bg-white text-sm outline-none shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                    />
                                                </div>
                                            </td>

                                            {/* Remaining Free Qty */}
                                            <td className="py-4 px-3.5 text-center font-medium text-emerald-600">
                                                {freeRemainingQty}
                                            </td>

                                            {/* Purchase Price */}
                                            <td className="py-4 px-3.5 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={returnPrices[index] === 0 ? '' : returnPrices[index] ?? ''}
                                                    onChange={(e) => handleReturnPriceChange(index, e.target.value)}
                                                    className="w-20 text-right px-2 py-1.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm"
                                                />
                                            </td>


                                            {/* Return Amount */}
                                            <td className="py-4 px-3.5 text-right font-bold text-orange-600">
                                                ৳{getReturnAmount(index, item).toFixed(2)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Others Free Product Return Table */}
                    {selectedInvoice.freeItems && selectedInvoice.freeItems.length > 0 && (
                        <div className="px-6 sm:px-8 pb-6 sm:pb-8 overflow-x-auto">
                            <h4 className="text-xs font-bold text-amber-700 uppercase mb-3">Others Free Product Return</h4>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-amber-100/70 text-amber-800 text-[11px] font-bold uppercase tracking-wider">
                                        <th className="py-3 px-3.5 rounded-l-xl">Product Name</th>
                                        <th className="py-3 px-3.5">Company</th>
                                        <th className="py-3 px-3.5 text-center">RT Qty</th>
                                        <th className="py-3 px-3.5 text-center">PCS Qty</th>
                                        <th className="py-3 px-3.5 text-center">Total RT Qty</th>
                                        <th className="py-3 px-3.5 text-center rounded-r-xl">Remaining Quantity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                    {selectedInvoice.freeItems.map((item, index) => {
                                        const pcsPerUnit = getFreeItemPcsPerUnit(item);
                                        const remainingQty = getFreeItemRemainingQty(item);
                                        const totalRtQty = getFreeItemTotalRtQty(index, item);
                                        const rtUnitDisabled = pcsPerUnit <= 0 || remainingQty <= 0;
                                        const rtPcsDisabled = remainingQty <= 0;

                                        return (
                                            <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                                <td className="py-4 px-3.5 text-slate-600">{item.company}</td>

                                                {/* RT Qty (Unit) */}
                                                <td className="py-4 pl-3.5 pr-0 min-w-[110px]">
                                                    <div className="p-1.5 bg-amber-50 border border-r-0 border-amber-200 rounded-l-2xl flex flex-col-reverse gap-1.5">
                                                        {item.parentMode && (
                                                            <div className="flex items-center border border-amber-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    disabled={remainingQty <= 0 || getPcsPerSub(item) <= 0}
                                                                    value={freeReturnInputs[index]?.rtSubQty === 0 ? '' : freeReturnInputs[index]?.rtSubQty ?? ''}
                                                                    onChange={(e) => handleFreeRtSubQtyChange(index, e.target.value, item)}
                                                                    className="w-14 min-w-[3.5rem] px-2 py-2 bg-transparent text-sm outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                                />
                                                                <span className="flex-1 bg-gradient-to-br from-fuchsia-500 to-pink-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate" title="Sub Unit">
                                                                    {item.subUnit}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center border border-amber-200 rounded-xl bg-white overflow-hidden w-full shadow-sm">
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                disabled={rtUnitDisabled}
                                                                value={freeReturnInputs[index]?.rtUnitQty === 0 ? '' : freeReturnInputs[index]?.rtUnitQty ?? ''}
                                                                onChange={(e) => handleFreeRtUnitQtyChange(index, e.target.value, item)}
                                                                className="w-14 min-w-[3.5rem] px-2 py-2 bg-transparent text-sm outline-none text-center disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                            />
                                                            <span
                                                                className="flex-1 bg-gradient-to-br from-amber-500 to-orange-500 text-white text-xs px-2 py-2.5 text-center font-semibold select-none truncate"
                                                                title="Unit"
                                                            >
                                                                {item.unit || 'Pcs'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* PCS Qty */}
                                                <td className="py-4 pl-0 pr-3.5 min-w-[90px]">
                                                    <div className="p-1.5 bg-amber-50 border border-l-0 border-amber-200 rounded-r-2xl">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            disabled={rtPcsDisabled}
                                                            value={freeReturnInputs[index]?.rtPcsQty === 0 ? '' : freeReturnInputs[index]?.rtPcsQty ?? ''}
                                                            onChange={(e) => handleFreeRtPcsQtyChange(index, e.target.value, item)}
                                                            className="w-full min-w-[70px] px-3 py-2 rounded-xl border border-amber-200 bg-white text-sm outline-none shadow-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Total RT Qty */}
                                                <td className="py-4 px-3.5 text-center font-semibold text-orange-600">{totalRtQty}</td>

                                                {/* Remaining Quantity */}
                                                <td className="py-4 px-3.5 text-center font-semibold text-indigo-600">{remainingQty}</td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Return Note */}
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                            Return Note <span className="text-slate-400 font-normal">(Optional)</span>
                        </label>
                        <textarea
                            rows="3"
                            placeholder="Write any note about this return..."
                            value={returnNote}
                            onChange={(e) => setReturnNote(e.target.value)}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/70 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 resize-y shadow-sm"
                        />
                    </div>

                    {/* Return Payment (Optional, default collapsed) */}
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8">
                        <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-5 md:p-6">
                            <div className="flex items-center justify-between flex-wrap gap-3">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-base font-bold text-emerald-800">Return Payment</h3>
                                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold border border-orange-200">
                                        Return Amount: ৳{totalReturnAmount.toFixed(2)}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setPaymentOpen((prev) => !prev)}
                                    className="flex items-center gap-2 text-xs font-semibold text-emerald-700 cursor-pointer"
                                >
                                    {paymentOpen ? 'Enabled' : 'Disabled'}
                                    <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${paymentOpen ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${paymentOpen ? 'translate-x-6' : 'translate-x-1'}`} />
                                    </span>
                                </button>
                            </div>

                            {paymentOpen && (
                                <div className="mt-5">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                                    }
                                                }}
                                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Payment Method <span className="text-rose-500">*</span>
                                            </label>
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
                                                className="w-full px-4 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 shadow-sm cursor-pointer"
                                            >
                                                <option value="">Select method...</option>
                                                {accountTypes.map((type) => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 mb-2">
                                                Account <span className="text-rose-500">*</span>
                                            </label>
                                            <select
                                                value={selectedAccountKey}
                                                onChange={(e) => setSelectedAccountKey(e.target.value)}
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
                                                    return <option key={key} value={key}>{label}</option>;
                                                })}
                                            </select>
                                        </div>
                                    </div>

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
                        </div>
                    </div>

                    {/* Totals + Confirm Return */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6">
                        <div className="flex flex-wrap items-start gap-6 flex-1 w-full [&>div]:flex-1 [&>div]:basis-0 [&>div]:min-w-[150px] [&>div>p:first-child]:min-h-[2rem]">

                            <div>
                                <p className="text-xs text-slate-500 uppercase font-semibold">Total RT Qty</p>
                                <p className="text-lg font-bold text-slate-800">{totalReturnPcs}</p>
                                <p className="text-[11px] font-semibold text-emerald-600">Free: {totalReturnFreeQty}</p>
                                <p className="text-[11px] font-semibold text-orange-600">৳{totalReturnAmount.toFixed(2)}</p>
                            </div>
                            {(selectedInvoice.freeItems || []).length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Total RT Others Free Qty</p>
                                    <p className="text-lg font-bold text-amber-600">{totalReturnFreeItemsQty}</p>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={handleConfirmReturn}
                            disabled={submitting}
                            className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl font-semibold text-sm shadow-md hover:opacity-90 transition duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RotateCcw className="w-4 h-4" />
                            {submitting ? 'Processing...' : isEditMode ? 'Update Return' : 'Confirm Return'}
                        </button>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default PurchaseReturnDetails;