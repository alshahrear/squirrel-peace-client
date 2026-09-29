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

const SalesReturnDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editReturnId = searchParams.get('returnId');
    const isEditMode = !!editReturnId;
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [notFound, setNotFound] = useState(false);
    const [returnInputs, setReturnInputs] = useState([]); // [{ rtUnitQty, rtPcsQty, rtFreeUnitQty, rtFreePcsQty }, ...]
    const [freeReturnInputs, setFreeReturnInputs] = useState([]); // Others Free Product return: [{ rtUnitQty, rtPcsQty }, ...]
    const [itemDiscounts, setItemDiscounts] = useState([]); // [{ discount, discountType }, ...]
    const [returnPricesUnit, setReturnPricesUnit] = useState([]); // Unit er return price, editable
    const [returnPricesPcs, setReturnPricesPcs] = useState([]); // PCS er return price, editable
    const [overallDiscountAmount, setOverallDiscountAmount] = useState(0);
    const [overallDiscountType, setOverallDiscountType] = useState('amount');
    const [submitting, setSubmitting] = useState(false);
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
        fetch(`http://localhost:5000/sales/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedOrder(data);

                    // Edit Mode hole matching return entry theke value prefill korbe
                    const editingEntry = editReturnId
                        ? (data.returnHistory || []).find((ret) => ret.returnId === editReturnId)
                        : null;

                    setReturnInputs(
                        (data.items || []).map((item) => {
                            if (editingEntry) {
                                const found = editingEntry.items?.find((it) => it.productId === item.productId);
                                if (found) {
                                    return {
                                        rtUnitQty: Number(found.returnUnitQty) || 0,
                                        rtPcsQty: Number(found.returnPcsQty) || 0,
                                        rtFreeUnitQty: Number(found.returnFreeUnitQty) || 0,
                                        rtFreePcsQty: Number(found.returnFreePcsQty) || 0,
                                    };
                                }
                            }
                            return { rtUnitQty: 0, rtPcsQty: 0, rtFreeUnitQty: 0, rtFreePcsQty: 0 };
                        })
                    );

                    setFreeReturnInputs(
                        (data.freeItems || []).map((item) => {
                            if (editingEntry) {
                                const found = editingEntry.freeItems?.find((it) => it.productId === item.productId);
                                if (found) {
                                    return {
                                        rtUnitQty: Number(found.returnUnitQty) || 0,
                                        rtPcsQty: Number(found.returnPcsQty) || 0,
                                    };
                                }
                            }
                            return { rtUnitQty: 0, rtPcsQty: 0 };
                        })
                    );

                    setItemDiscounts(
                        (data.items || []).map((item) => ({
                            discount: Number(item.discount) || 0,
                            discountType: item.discountType || 'amount',
                        }))
                    );

                    setReturnPricesUnit(
                        (data.items || []).map((item) => Number(item.sellPriceUnit) || 0)
                    );
                    setReturnPricesPcs(
                        (data.items || []).map((item) => Number(item.sellPricePcs) || 0)
                    );

                    setOverallDiscountAmount(Number(data.overallDiscount) || 0);
                    setOverallDiscountType(data.overallDiscountType || 'amount');
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

    // --------------------------------------------------
    // 1 Unit = koto PCS, item er original order data theke ber kora
    // --------------------------------------------------
    const getPcsPerUnit = (item) => {
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
    // Main Item er Free Qty — 1 Free Unit = koto Free PCS
    // --------------------------------------------------
    const getItemFreePcsPerUnit = (item) => {
        const freeUnitQtyNum = Number(item.freeUnitQty) || 0;
        const freePcsQtyNum = Number(item.freePcsQty) || 0;
        const freeTotalQtyNum = Number(item.freeQty) || 0;
        if (freeUnitQtyNum > 0) {
            const perUnit = (freeTotalQtyNum - freePcsQtyNum) / freeUnitQtyNum;
            return perUnit > 0 ? perUnit : 0;
        }
        return 0;
    };

    // --------------------------------------------------
    // Others Free Product — 1 Unit = koto PCS
    // --------------------------------------------------
    const getFreePcsPerUnit = (item) => {
        const unitQtyNum = Number(item.unitQty) || 0;
        const pcsQtyNum = Number(item.pcsQty) || 0;
        const totalQtyNum = Number(item.totalQty) || 0;
        if (unitQtyNum > 0) {
            const perUnit = (totalQtyNum - pcsQtyNum) / unitQtyNum;
            return perUnit > 0 ? perUnit : 0;
        }
        return 0;
    };

    // --------------------------------------------------
    // Others Free Product — Age koto Total RT Qty return kora hoyeche
    // --------------------------------------------------
    const getReturnedFreeItemQtyForProduct = (productId) => {
        if (!selectedOrder?.returnHistory) return 0;
        return selectedOrder.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum;
            const found = ret.freeItems?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnTotalQty) || 0 : 0);
        }, 0);
    };

    const getFreeItemRemainingQty = (item) => {
        const returned = getReturnedFreeItemQtyForProduct(item.productId);
        return Math.max(Number(item.totalQty || 0) - returned, 0);
    };

    const getFreeItemTotalRtQty = (index, item) => {
        const pcsPerUnit = getFreePcsPerUnit(item);
        const rtUnitQty = Number(freeReturnInputs[index]?.rtUnitQty) || 0;
        const rtPcsQty = Number(freeReturnInputs[index]?.rtPcsQty) || 0;
        return rtUnitQty * pcsPerUnit + rtPcsQty;
    };

    // --------------------------------------------------
    // Age koto Total RT Qty return kora hoyeche (returnHistory theke)
    // --------------------------------------------------
    const getReturnedQtyForProduct = (productId) => {
        if (!selectedOrder?.returnHistory) return 0;
        return selectedOrder.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum; // nijer entry bad diye hisab hobe
            const found = ret.items?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnTotalQty) || 0 : 0);
        }, 0);
    };

    // --------------------------------------------------
    // Age koto Free Qty return kora hoyeche (returnHistory theke)
    // --------------------------------------------------
    const getReturnedFreeQtyForProduct = (productId) => {
        if (!selectedOrder?.returnHistory) return 0;
        return selectedOrder.returnHistory.reduce((sum, ret) => {
            if (isEditMode && ret.returnId === editReturnId) return sum; // nijer entry bad diye hisab hobe
            const found = ret.items?.find((it) => it.productId === productId);
            return sum + (found ? Number(found.returnFreeTotalQty) || 0 : 0);
        }, 0);
    };

    const getRemainingQty = (item) => {
        const returned = getReturnedQtyForProduct(item.productId);
        return Math.max(Number(item.totalPcs || 0) - returned, 0);
    };

    const getFreeRemainingQty = (item) => {
        const returned = getReturnedFreeQtyForProduct(item.productId);
        return Math.max(Number(item.freeQty || 0) - returned, 0);
    };

    const getTotalRtQty = (index, item) => {
        const pcsPerUnit = getPcsPerUnit(item);
        const rtUnitQty = Number(returnInputs[index]?.rtUnitQty) || 0;
        const rtPcsQty = Number(returnInputs[index]?.rtPcsQty) || 0;
        return rtUnitQty * pcsPerUnit + rtPcsQty;
    };

    const getItemFreeTotalRtQty = (index, item) => {
        const freePcsPerUnit = getItemFreePcsPerUnit(item);
        const rtFreeUnitQty = Number(returnInputs[index]?.rtFreeUnitQty) || 0;
        const rtFreePcsQty = Number(returnInputs[index]?.rtFreePcsQty) || 0;
        return rtFreeUnitQty * freePcsPerUnit + rtFreePcsQty;
    };

    // Unit ongsher return amount
    const getReturnUnitAmount = (index, item) => {
        const rtUnitQty = Number(returnInputs[index]?.rtUnitQty) || 0;
        const priceUnit = returnPricesUnit[index] !== undefined ? Number(returnPricesUnit[index]) || 0 : (Number(item.sellPriceUnit) || 0);
        return rtUnitQty * priceUnit;
    };

    // PCS ongsher return amount
    const getReturnPcsAmount = (index, item) => {
        const rtPcsQty = Number(returnInputs[index]?.rtPcsQty) || 0;
        const pricePcs = returnPricesPcs[index] !== undefined ? Number(returnPricesPcs[index]) || 0 : (Number(item.sellPricePcs) || 0);
        return rtPcsQty * pricePcs;
    };

    const getReturnAmount = (index, item) =>
        getReturnUnitAmount(index, item) + getReturnPcsAmount(index, item);

    // Original row er gross total (Unit ongsho + PCS ongsho)
    const getRowGross = (item) =>
        (Number(item.unitQty) || 0) * (Number(item.sellPriceUnit) || 0) +
        (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);

    const getItemDiscountAmount = (index, item) => {
        const discount = Number(itemDiscounts[index]?.discount) || 0;
        const discountType = itemDiscounts[index]?.discountType || 'amount';
        const rowGrossTotal = getRowGross(item);
        return discountType === 'percent'
            ? roundTo2((rowGrossTotal * discount) / 100)
            : roundTo2(discount);
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
        const currentPcsQty = Number(returnInputs[index]?.rtPcsQty) || 0;
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
    const handleRtPcsQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const pcsPerUnit = getPcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getRemainingQty(item);
        const currentUnitQty = Number(returnInputs[index]?.rtUnitQty) || 0;
        const unitPortion = currentUnitQty * pcsPerUnit;
        const maxPcs = Math.max(0, remaining - unitPortion);

        if (val > maxPcs) val = maxPcs;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtPcsQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // RT Free Qty (Unit) Change
    // --------------------------------------------------
    const handleRtFreeUnitQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const freePcsPerUnit = getItemFreePcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const freeRemaining = getFreeRemainingQty(item);
        const currentFreePcsQty = Number(returnInputs[index]?.rtFreePcsQty) || 0;
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

    // --------------------------------------------------
    // RT Free Qty (PCS) Change
    // --------------------------------------------------
    const handleRtFreePcsQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return; // ঘরে শুধু পূর্ণসংখ্যা, দশমিক নেওয়া হবে না
        const freePcsPerUnit = getItemFreePcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const freeRemaining = getFreeRemainingQty(item);
        const currentFreeUnitQty = Number(returnInputs[index]?.rtFreeUnitQty) || 0;
        const unitPortion = currentFreeUnitQty * freePcsPerUnit;
        const maxPcs = Math.max(0, freeRemaining - unitPortion);

        if (val > maxPcs) val = maxPcs;

        setReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtFreePcsQty: val };
            return updated;
        });
    };


    // --------------------------------------------------
    // Others Free Product — RT Qty (Unit) Change
    // --------------------------------------------------
    const handleFreeRtUnitQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return;
        const pcsPerUnit = getFreePcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getFreeItemRemainingQty(item);
        const currentPcsQty = Number(freeReturnInputs[index]?.rtPcsQty) || 0;
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

    // --------------------------------------------------
    // Others Free Product — RT PCS Qty Change
    // --------------------------------------------------
    const handleFreeRtPcsQtyChange = (index, value, item) => {
        if (value !== '' && !/^\d*$/.test(value)) return;
        const pcsPerUnit = getFreePcsPerUnit(item);
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        const remaining = getFreeItemRemainingQty(item);
        const currentUnitQty = Number(freeReturnInputs[index]?.rtUnitQty) || 0;
        const unitPortion = currentUnitQty * pcsPerUnit;
        const maxPcs = Math.max(0, remaining - unitPortion);

        if (val > maxPcs) val = maxPcs;

        setFreeReturnInputs((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], rtPcsQty: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // Return Price (Unit / PCS) Change
    // --------------------------------------------------
    const handleReturnPriceUnitChange = (index, value) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return;
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        setReturnPricesUnit((prev) => {
            const updated = [...prev];
            updated[index] = val;
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

    // --------------------------------------------------
    // Item Discount Change
    // --------------------------------------------------
    const handleItemDiscountChange = (index, value) => {
        if (value !== '' && !/^\d*\.?\d{0,2}$/.test(value)) return; // পয়েন্টের পর সর্বোচ্চ ২ ডিজিট
        let val = value === '' ? 0 : Number(value);
        if (isNaN(val) || val < 0) val = 0;

        setItemDiscounts((prev) => {
            const updated = [...prev];
            updated[index] = { ...updated[index], discount: val };
            return updated;
        });
    };

    // --------------------------------------------------
    // Item Discount Type Toggle (Amount / Percent)
    // --------------------------------------------------
    const handleToggleItemDiscountType = (index) => {
        setItemDiscounts((prev) => {
            const updated = [...prev];
            updated[index] = {
                ...updated[index],
                discountType: updated[index]?.discountType === 'percent' ? 'amount' : 'percent',
            };
            return updated;
        });
    };

    const totalReturnPcs = selectedOrder
        ? selectedOrder.items.reduce((sum, item, index) => sum + getTotalRtQty(index, item), 0)
        : 0;

    const totalReturnFreeQty = selectedOrder
        ? selectedOrder.items.reduce((sum, item, index) => sum + getItemFreeTotalRtQty(index, item), 0)
        : 0;

    const totalReturnFreeItemsQty = selectedOrder
        ? (selectedOrder.freeItems || []).reduce((sum, item, index) => sum + getFreeItemTotalRtQty(index, item), 0)
        : 0;

    const totalReturnAmount = selectedOrder
        ? selectedOrder.items.reduce((sum, item, index) => sum + getReturnAmount(index, item), 0)
        : 0;

    const liveProductWiseDiscount = selectedOrder
        ? roundTo2(selectedOrder.items.reduce((sum, item, index) => sum + getItemDiscountAmount(index, item), 0))
        : 0;

    const liveOverallDiscountValue = selectedOrder
        ? roundTo2(
            overallDiscountType === 'percent'
                ? ((Number(selectedOrder.grandTotal) || 0) - liveProductWiseDiscount) * (Number(overallDiscountAmount) || 0) / 100
                : Number(overallDiscountAmount) || 0
        )
        : 0;

    const handleConfirmReturn = async () => {
        if (totalReturnPcs <= 0 && totalReturnFreeQty <= 0 && totalReturnFreeItemsQty <= 0) {
            showToast('Return korar jonno kompokkhe 1 ta product a quantity din!', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const { _id, ...rest } = selectedOrder;

            const today = new Date();
            const returnDate = today.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });

            const returnedItems = selectedOrder.items
                .map((item, index) => {
                    const totalRtQty = getTotalRtQty(index, item);
                    const totalRtFreeQty = getItemFreeTotalRtQty(index, item);
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        returnUnitQty: Number(returnInputs[index]?.rtUnitQty) || 0,
                        returnPcsQty: Number(returnInputs[index]?.rtPcsQty) || 0,
                        returnTotalQty: totalRtQty,
                        returnFreeUnitQty: Number(returnInputs[index]?.rtFreeUnitQty) || 0,
                        returnFreePcsQty: Number(returnInputs[index]?.rtFreePcsQty) || 0,
                        returnFreeTotalQty: totalRtFreeQty,
                        returnAmount: getReturnAmount(index, item),
                    };
                })
                .filter((it) => it.returnTotalQty > 0 || it.returnFreeTotalQty > 0);

            const freeReturnedItems = (selectedOrder.freeItems || [])
                .map((item, index) => {
                    const totalRtQty = getFreeItemTotalRtQty(index, item);
                    return {
                        productId: item.productId,
                        productName: item.productName,
                        returnUnitQty: Number(freeReturnInputs[index]?.rtUnitQty) || 0,
                        returnPcsQty: Number(freeReturnInputs[index]?.rtPcsQty) || 0,
                        returnTotalQty: totalRtQty,
                    };
                })
                .filter((it) => it.returnTotalQty > 0);



            let updatedReturnHistory;

            if (isEditMode) {
                // Existing return entry ke update korbe, ID o original date thakbe
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
                    returnId,
                    returnDate,
                    items: returnedItems,
                    freeItems: freeReturnedItems,
                    totalReturnPcs,
                    totalReturnFreeQty,
                    totalReturnFreeItemsQty,
                    totalReturnAmount,
                };
                updatedReturnHistory = [
                    ...(selectedOrder.returnHistory || []),
                    newReturnEntry,
                ];
            }

            const updatedItems = selectedOrder.items.map((item, index) => {
                const itemDiscount = Number(itemDiscounts[index]?.discount) || 0;
                const itemDiscountType = itemDiscounts[index]?.discountType || 'amount';
                const rowGrossTotal = getRowGross(item);
                const effectiveDiscount =
                    itemDiscountType === 'percent'
                        ? roundTo2((rowGrossTotal * itemDiscount) / 100)
                        : roundTo2(itemDiscount);
                const rowSubtotal = roundTo2(rowGrossTotal - effectiveDiscount);

                return {
                    ...item,
                    discount: itemDiscount,
                    discountType: itemDiscountType,
                    discountAmount: effectiveDiscount,
                    subtotal: rowSubtotal,
                };
            });

            // Product Wise Discount notun kore hisab
            const productWiseDiscount = roundTo2(
                updatedItems.reduce((sum, it) => sum + (Number(it.discountAmount) || 0), 0)
            );

            const grandTotal = Number(rest.grandTotal) || 0;
            const afterProductDiscount = grandTotal - productWiseDiscount;

            // Overall Discount Value notun kore hisab
            const overallDiscountValue = roundTo2(
                overallDiscountType === 'percent'
                    ? (afterProductDiscount * (Number(overallDiscountAmount) || 0)) / 100
                    : Number(overallDiscountAmount) || 0
            );

            // Adjustment age jevabe silo shevabei thakbe, khali Payable Amount notun kore hisab hbe
            const existingAdjustmentAmount = Number(rest.adjustment?.amount) || 0;
            const existingAdjustmentType = rest.adjustment?.type || '+';

            let payableAmount = afterProductDiscount - overallDiscountValue;
            payableAmount =
                existingAdjustmentType === '-'
                    ? payableAmount - existingAdjustmentAmount
                    : payableAmount + existingAdjustmentAmount;

            if (payableAmount < 0) payableAmount = 0;
            payableAmount = roundTo2(payableAmount);

            const updatedData = {
                ...rest,
                items: updatedItems,
                productWiseDiscount,
                overallDiscount: Number(overallDiscountAmount) || 0,
                overallDiscountType: overallDiscountType,
                overallDiscountValue,
                payableAmount,
                returnHistory: updatedReturnHistory,
            };

            const response = await fetch(`http://localhost:5000/sales/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            if (response.ok) {
                showToast(
                    isEditMode ? 'Sales return successfully updated!' : 'Sales return successfully added!',
                    'success'
                );
                setTimeout(() => navigate('/sales-return'), 900);
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

    if (notFound || !selectedOrder) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Order Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This order record couldn't be found. It may have been deleted.</p>
                    <button
                        onClick={() => navigate('/wholesale')}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Wholesale
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
                        onClick={() => navigate('/wholesale')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Wholesale
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
                                        Sales Return
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
                                <p className="font-bold text-slate-800 text-base">ইসরাইল এন্টারপ্রাইজ</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">01997074920</p>
                                <p className="text-xs sm:text-sm text-slate-600">শাহজী পাড়া, বড় বাজার, মেহেরপুর</p>
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Bill To</span>
                                        <p className="font-bold text-slate-800 text-lg">{selectedOrder.customer}</p>
                                        <p className="text-xs text-slate-500 mt-1">{selectedOrder.phone}</p>
                                        <p className="text-xs text-slate-500">{selectedOrder.shippingAddress || selectedOrder.address || 'N/A'}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Order Date: {selectedOrder.orderDate}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Order No: <span className="text-indigo-600">{selectedOrder.orderNo}</span>
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
                                    <th className="py-3 px-3.5 text-right">Sell Price (Unit)</th>
                                    <th className="py-3 px-3.5 text-right">Sell Price (PCS)</th>
                                    <th className="py-3 px-3.5 text-right">Discount</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Return Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedOrder.items.map((item, index) => {
                                    const pcsPerUnit = getPcsPerUnit(item);
                                    const freePcsPerUnit = getItemFreePcsPerUnit(item);
                                    const remainingQty = getRemainingQty(item);
                                    const freeRemainingQty = getFreeRemainingQty(item);
                                    const totalRtQty = getTotalRtQty(index, item);
                                    const totalRtFreeQtyItem = getItemFreeTotalRtQty(index, item);
                                    const rtUnitDisabled = pcsPerUnit <= 0 || remainingQty <= 0;
                                    const rtPcsDisabled = remainingQty <= 0;
                                    const rtFreeUnitDisabled = freePcsPerUnit <= 0 || freeRemainingQty <= 0;
                                    const rtFreePcsDisabled = freeRemainingQty <= 0;

                                    return (
                                        <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                            <td className="py-4 px-3.5 text-slate-600">{item.company}</td>

                                            {/* RT Qty (Unit) */}
                                            <td className="relative py-4 pl-3.5 pr-0">
                                                <div
                                                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${totalRtQty > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    Total: {totalRtQty}
                                                </div>
                                                <div className="p-1.5 bg-indigo-50 border border-r-0 border-indigo-200 rounded-l-2xl">
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
                                                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${totalRtFreeQtyItem > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    Total: {totalRtFreeQtyItem}
                                                </div>
                                                <div className="p-1.5 bg-emerald-50 border border-r-0 border-emerald-200 rounded-l-2xl">
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

                                            {/* Sell Price (Unit) */}
                                            <td className="py-4 px-3.5 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    disabled={rtUnitDisabled}
                                                    value={returnPricesUnit[index] === 0 ? '' : returnPricesUnit[index] ?? ''}
                                                    onChange={(e) => handleReturnPriceUnitChange(index, e.target.value)}
                                                    className="w-20 text-right px-2 py-1.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                />
                                            </td>

                                            {/* Sell Price (PCS) */}
                                            <td className="py-4 px-3.5 text-right">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    disabled={rtPcsDisabled}
                                                    value={returnPricesPcs[index] === 0 ? '' : returnPricesPcs[index] ?? ''}
                                                    onChange={(e) => handleReturnPricePcsChange(index, e.target.value)}
                                                    className="w-20 text-right px-2 py-1.5 rounded-lg border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                                />
                                            </td>

                                            {/* Discount */}
                                            <td className="relative py-4 px-3.5">
                                                {(() => {
                                                    const rowGrossTotal = getRowGross(item);
                                                    const discountAmt = getItemDiscountAmount(index, item);
                                                    const discountPct =
                                                        itemDiscounts[index]?.discountType === 'percent'
                                                            ? Number(itemDiscounts[index]?.discount) || 0
                                                            : (rowGrossTotal > 0 ? (discountAmt / rowGrossTotal) * 100 : 0);
                                                    const isPercentActive = itemDiscounts[index]?.discountType === 'percent';
                                                    return (
                                                        <div
                                                            className={`absolute top-1 right-3.5 z-10 pointer-events-none px-1.5 rounded text-[10px] leading-[14px] font-bold whitespace-nowrap ${(isPercentActive ? discountAmt : discountPct) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-400'}`}
                                                        >
                                                            {isPercentActive ? `৳${discountAmt.toFixed(2)}` : `${discountPct.toFixed(2)}%`}
                                                        </div>
                                                    );
                                                })()}
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleItemDiscountType(index)}
                                                        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold transition cursor-pointer"
                                                        title="Click to toggle Amount / Percentage"
                                                    >
                                                        {itemDiscounts[index]?.discountType === 'percent' ? '%' : '৳'}
                                                    </button>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={itemDiscounts[index]?.discount === 0 ? '' : itemDiscounts[index]?.discount ?? ''}
                                                        onChange={(e) => handleItemDiscountChange(index, e.target.value)}
                                                        className="w-20 text-right px-2 py-1.5 rounded-lg border border-gray-200 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 outline-none text-sm"
                                                    />
                                                </div>
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
                    {selectedOrder.freeItems && selectedOrder.freeItems.length > 0 && (
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
                                    {selectedOrder.freeItems.map((item, index) => {
                                        const pcsPerUnit = getFreePcsPerUnit(item);
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
                                                    <div className="p-1.5 bg-amber-50 border border-r-0 border-amber-200 rounded-l-2xl">
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

                    {/* Totals + Confirm Return */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col lg:flex-row justify-between items-center lg:items-start gap-6">
                        <div className="flex flex-wrap items-start gap-6 flex-1 w-full [&>div]:flex-1 [&>div]:basis-0 [&>div]:min-w-[150px] [&>div>p:first-child]:min-h-[2rem]">
                            {(selectedOrder.items || []).length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Overall Discount</p>
                                    <div className="flex items-center rounded-lg overflow-hidden border border-slate-200">
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="0"
                                            value={overallDiscountAmount === 0 ? '' : overallDiscountAmount}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                                    setOverallDiscountAmount(value === '' ? '' : Number(value));
                                                }
                                            }}
                                            className={`w-20 px-2 py-1.5 text-sm outline-none ${overallDiscountType === 'amount' ? 'bg-indigo-50 font-bold text-indigo-700 ring-2 ring-indigo-200' : 'bg-white focus:bg-indigo-50/40'}`}
                                        />
                                        {(() => {
                                            const afterProductDiscount = (Number(selectedOrder?.grandTotal) || 0) - liveProductWiseDiscount;
                                            const overallPct =
                                                overallDiscountType === 'percent'
                                                    ? Number(overallDiscountAmount) || 0
                                                    : (afterProductDiscount > 0 ? (liveOverallDiscountValue / afterProductDiscount) * 100 : 0);
                                            const isPercentActive = overallDiscountType === 'percent';
                                            return (
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={!isPercentActive ? (overallPct ? `${overallPct.toFixed(2)}%` : '') : (liveOverallDiscountValue ? `৳${liveOverallDiscountValue.toFixed(2)}` : '')}
                                                    placeholder={!isPercentActive ? '0%' : '৳0.00'}
                                                    title={!isPercentActive ? 'Discount percentage' : 'Discount amount in Taka'}
                                                    className={`w-20 px-2 py-1.5 border-l border-slate-200 text-sm outline-none cursor-not-allowed ${isPercentActive ? 'bg-indigo-50 font-bold text-indigo-700' : 'bg-slate-100 text-slate-600'}`}
                                                />
                                            );
                                        })()}
                                        <button
                                            type="button"
                                            onClick={() => setOverallDiscountType((prev) => (prev === 'amount' ? 'percent' : 'amount'))}
                                            className="w-9 shrink-0 border-l border-slate-200 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-semibold transition cursor-pointer"
                                            title="Click to toggle Amount / Percentage"
                                        >
                                            {overallDiscountType === 'percent' ? '%' : '৳'}
                                        </button>
                                    </div>
                                </div>
                            )}
                            {(selectedOrder.items || []).length > 0 && (
                                <div>
                                    <p className="text-xs text-slate-500 uppercase font-semibold">Total RT Qty</p>
                                    <p className="text-lg font-bold text-slate-800">{totalReturnPcs}</p>
                                    <p className="text-[11px] font-semibold text-emerald-600">Free: {totalReturnFreeQty}</p>
                                    <p className="text-[11px] font-semibold text-orange-600">৳{totalReturnAmount.toFixed(2)}</p>
                                </div>
                            )}
                            {(selectedOrder.freeItems || []).length > 0 && (
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
            </div>
        </div>
    );
};

export default SalesReturnDetails;