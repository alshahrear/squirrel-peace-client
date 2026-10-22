import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    Printer,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    Building2,
    ArrowLeft,
    PackageX,
    User,
    Truck,
    AlertTriangle,
    Undo2
} from 'lucide-react';

const SalesDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rawOrder, setSelectedOrder] = useState(null);
    const [showOrder, setShowOrder] = useState(false);

    // Order r Delivery er moddhe parthokko thakle tobei toggle dekhabe
    const hasOrderSnapshot = (() => {
        const snap = rawOrder?.orderSnapshot;
        if (!snap) return false;
        const n = (v) => Number(v) || 0;
        const mainSig = (list) =>
            (list || [])
                .map((i) =>
                    [i.productName, n(i.totalPcs), n(i.freeQty), n(i.sellPriceUnit), n(i.sellPriceSub), n(i.sellPricePcs), n(i.discount), i.discountType || 'amount'].join('|')
                )
                .join(';');
        const freeSig = (list) => (list || []).map((i) => [i.productName, n(i.totalQty)].join('|')).join(';');
        const totalSig = (o) =>
            [n(o.subTotal ?? o.grandTotal), n(o.overallDiscount), o.overallDiscountType || 'amount', n(o.adjustment?.amount), o.adjustment?.type || '+', n(o.payableAmount)].join('|');
        return (
            mainSig(snap.items) !== mainSig(rawOrder.items) ||
            freeSig(snap.freeItems) !== freeSig(rawOrder.freeItems) ||
            totalSig(snap) !== totalSig(rawOrder)
        );
    })();
    const orderView = showOrder && hasOrderSnapshot;
    const selectedOrder = orderView
        ? {
            ...rawOrder,
            ...rawOrder.orderSnapshot,
            subTotal: rawOrder.orderSnapshot.subTotal ?? rawOrder.orderSnapshot.grandTotal,
            returnHistory: [],
            paidAmount: 0,
            paymentNote: '',
        }
        : rawOrder;
    const [notFound, setNotFound] = useState(false);
    const [showRemainingToggle, setShowRemaining] = useState(true); // default ON

    // কোনো Return হয়েছে কিনা
    const hasReturn = (selectedOrder?.returnHistory || []).some((r) => {
        if (
            (Number(r.totalReturnPcs) || 0) > 0 ||
            (Number(r.totalReturnFreeQty) || 0) > 0 ||
            (Number(r.totalReturnFreeItemsQty) || 0) > 0
        ) return true;
        const mainHit = (r.items || []).some(
            (it) =>
                (Number(it.returnTotalQty) || 0) > 0 ||
                (Number(it.returnFreeTotalQty ?? it.returnFreeQty) || 0) > 0
        );
        const freeHit = (r.freeItems || []).some((it) => (Number(it.returnTotalQty) || 0) > 0);
        return mainHit || freeHit;
    });
    // Return না থাকলে Remaining feature কাজ করবে না
    const showRemaining = showRemainingToggle && hasReturn;

    // total pcs কে Parent Unit / Sub Unit / Pcs এ ভাঙার helper
    const splitQty = (total, perUnit, perSub, parentMode) => {
        if (perUnit > 0) {
            const u = Math.floor(total / perUnit);
            let rest = total - u * perUnit;
            let s = 0;
            if (parentMode && perSub > 0) {
                s = Math.floor(rest / perSub);
                rest = rest - s * perSub;
            }
            return [u, s, Math.round(rest * 100) / 100];
        }
        return [0, 0, total];
    };

    // Return বাদ দিয়ে Remaining Quantity / Free / Price / Subtotal হিসাব
    const getRemainingInfo = (item) => {
        let retQty = 0;
        let retFree = 0;
        (selectedOrder?.returnHistory || []).forEach((ret) => {
            const found = (ret.items || []).find((it) => it.productId === item.productId);
            if (found) {
                retQty += Number(found.returnTotalQty) || 0;
                retFree += Number(found.returnFreeTotalQty ?? found.returnFreeQty) || 0;
            }
        });

        const totalPcs = Number(item.totalPcs) || 0;
        const freeTotal = Number(item.freeQty) || 0;
        const remQty = Math.max(totalPcs - retQty, 0);
        const remFree = Math.max(freeTotal - retFree, 0);

        const parentMode = item.parentMode === true;
        const perSub = Number(item.pcsPerSub) || 0;
        const unitQty = Number(item.unitQty) || 0;
        const subQty = Number(item.subQty) || 0;
        const pcsQty = Number(item.pcsQty) || 0;
        const perUnit = Number(item.pcsPerUnit) > 0
            ? Number(item.pcsPerUnit)
            : (unitQty > 0 ? (totalPcs - pcsQty - subQty * perSub) / unitQty : 0);

        const [remUnit, remSub, remPcs] = retQty > 0
            ? splitQty(remQty, perUnit, perSub, parentMode)
            : [unitQty, subQty, pcsQty];
        const [remFreeUnit, remFreeSub, remFreePcs] = retFree > 0
            ? splitQty(remFree, perUnit, perSub, parentMode)
            : [Number(item.freeUnitQty) || 0, Number(item.freeSubQty) || 0, Number(item.freePcsQty) || 0];

        const remUnitTotal = remUnit * (Number(item.sellPriceUnit) || 0);
        const remSubUnitTotal = remSub * (Number(item.sellPriceSub) || 0);
        const remPcsTotal = remPcs * (Number(item.sellPricePcs) || 0);
        const remGross = remUnitTotal + remSubUnitTotal + remPcsTotal;

        const fullGross = unitQty * (Number(item.sellPriceUnit) || 0) + subQty * (Number(item.sellPriceSub) || 0) + pcsQty * (Number(item.sellPricePcs) || 0);
        const fullDiscRow = Number(
            item.discountAmount ??
            (item.discountType === 'percent'
                ? (fullGross * Number(item.discount)) / 100
                : Number(item.discount))
        ) || 0;
        const remSubtotal = Math.max(remGross - fullDiscRow, 0);

        return {
            remQty, remFree, remUnit, remSub, remPcs,
            remFreeUnit, remFreeSub, remFreePcs,
            remUnitTotal, remSubUnitTotal, remPcsTotal, remGross, remSubtotal,
        };
    };

    // Others Free Product: Return বাদ দিয়ে Remaining হিসাব
    const getFreeItemRemaining = (item) => {
        let retTotal = 0;
        (selectedOrder?.returnHistory || []).forEach((ret) => {
            const found = (ret.freeItems || []).find((it) => it.productId === item.productId);
            if (found) retTotal += Number(found.returnTotalQty) || 0;
        });

        const total = Number(item.totalQty) || 0;
        const unitQty = Number(item.unitQty) || 0;
        const subQty = Number(item.subQty) || 0;
        const pcsQty = Number(item.pcsQty) || 0;
        const parentMode = item.parentMode === true;
        const perSub = Number(item.pcsPerSub) || 0;
        const perUnit = Number(item.pcsPerUnit) > 0
            ? Number(item.pcsPerUnit)
            : (unitQty > 0 ? (total - pcsQty - subQty * perSub) / unitQty : 0);

        const remTotal = Math.max(total - retTotal, 0);
        if (retTotal <= 0) {
            return { remTotal, remUnit: unitQty, remSub: subQty, remPcs: pcsQty };
        }
        const [remUnit, remSub, remPcs] = splitQty(remTotal, perUnit, perSub, parentMode);
        return { remTotal, remUnit, remSub, remPcs };
    };

    // Main + Free + Others Free = ekshathe Quantity
    const getCombinedQty = (item) => {
        const rem = getRemainingInfo(item);
        let others = 0;
        (selectedOrder?.freeItems || [])
            .filter((f) => f.productId === item.productId)
            .forEach((f) => {
                others += showRemaining ? getFreeItemRemaining(f).remTotal : Number(f.totalQty) || 0;
            });
        const main = showRemaining ? rem.remQty : Number(item.totalPcs) || 0;
        const free = showRemaining ? rem.remFree : Number(item.freeQty) || 0;
        const total = main + free + others;
        const parentMode = item.parentMode === true;
        const perSub = Number(item.pcsPerSub) || 0;
        const uQ = Number(item.unitQty) || 0;
        const sQ = Number(item.subQty) || 0;
        const pQ = Number(item.pcsQty) || 0;
        const perUnit = Number(item.pcsPerUnit) > 0
            ? Number(item.pcsPerUnit)
            : (uQ > 0 ? ((Number(item.totalPcs) || 0) - pQ - sQ * perSub) / uQ : 0);
        const [u, s, p] = splitQty(total, perUnit, perSub, parentMode);
        return { u, s, p, total };
    };

    // Return বাদ দিয়ে Grand Total / Discount / Payable / Due হিসাব
    const getTotals = () => {
        const inv = selectedOrder;
        const paid = Number(inv.paidAmount || 0);

        let grand = 0;
        let pwd = 0;
        (inv.items || []).forEach((item) => {
            const info = getRemainingInfo(item);
            const gross =
                (Number(item.unitQty) || 0) * (Number(item.sellPriceUnit) || 0) +
                (Number(item.subQty) || 0) * (Number(item.sellPriceSub) || 0) +
                (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);
            const fullDisc = Number(
                item.discountAmount ??
                (item.discountType === 'percent'
                    ? (gross * Number(item.discount)) / 100
                    : Number(item.discount))
            ) || 0;
            grand += info.remGross;
            pwd += fullDisc;
        });

        const afterProduct = grand - pwd;
        const overallAmt =
            inv.overallDiscountType === 'percent'
                ? (afterProduct * (Number(inv.overallDiscount) || 0)) / 100
                : Number(inv.overallDiscountValue ?? inv.overallDiscount) || 0;
        const adjAmt = Number(inv.adjustment?.amount) || 0;
        let payable = afterProduct - overallAmt;
        payable = inv.adjustment?.type === '-' ? payable - adjAmt : payable + adjAmt;
        payable -= Number(inv.damageAdjustmentAmount) || 0;
        payable -= Number(inv.returnAdjustmentAmount) || 0;
        if (payable < 0) payable = 0;

        return {
            grand,
            pwd,
            pwdPct: grand > 0 ? (pwd / grand) * 100 : 0,
            afterProduct,
            overallAmt,
            payable,
            due: payable - paid,
        };
    };

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`https://squirrel-peace-server.onrender.com/sales/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedOrder(data);
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
    }, [id]);

    // DamageProducts থেকে এলে Damage section এ scroll করবে
    useEffect(() => {
        const target =
            location.state?.scrollTo ||
            (new URLSearchParams(location.search).get('scrollToReturn') ? 'return-products-section' : null);
        if (!loading && selectedOrder && target) {
            setTimeout(() => {
                document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    }, [loading, selectedOrder, location.state]);

    const handlePrint = () => {
        window.print();
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
                    <h2 className="text-xl font-bold text-gray-800">Invoice Not Found</h2>
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

    // Unit অংশের মোট দাম = Unit Qty × প্রতি Unit এর দাম
    const getUnitTotal = (item) =>
        (Number(item.unitQty) || 0) * (Number(item.sellPriceUnit) || 0);

    // PCS অংশের মোট দাম = PCS Qty × প্রতি PCS এর দাম
    const getPcsTotal = (item) =>
        (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);

    // Sub Unit অংশের মোট দাম (Parent Unit থাকলে)
    const getSubTotal = (item) =>
        (Number(item.subQty) || 0) * (Number(item.sellPriceSub) || 0);

    // Row Gross হিসাব (Unit অংশ + Sub অংশ + PCS অংশ)
    const getRowGross = (item) => getUnitTotal(item) + getSubTotal(item) + getPcsTotal(item);

    const totals = showRemaining ? getTotals() : null;
    const due = Number(selectedOrder.payableAmount) - Number(selectedOrder.paidAmount || 0);
    const baseSubTotal = Number(selectedOrder.subTotal ?? selectedOrder.grandTotal) || 0;
    const shownGrand = totals ? totals.grand : baseSubTotal;
    const shownPwd = totals ? totals.pwd : Number(selectedOrder.productWiseDiscount);
    const shownPwdPct = totals
        ? totals.pwdPct
        : (selectedOrder.productWiseDiscountPercent ??
            (baseSubTotal > 0
                ? (Number(selectedOrder.productWiseDiscount) / baseSubTotal) * 100
                : 0));
    const shownPayable = Number(selectedOrder.payableAmount);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-3 sm:p-4 md:p-6 print:bg-white print:p-0">
            <div className="max-w-full mx-auto space-y-6 print:space-y-0 print:max-w-full">

                {/* Top action bar */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button
                        onClick={() => navigate('/wholesale')}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Wholesale
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <Printer className="w-4 h-4" /> Print Invoice
                    </button>
                </div>

                {/* Invoice Card */}
                <div className="flex flex-col bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-white overflow-hidden print:shadow-none print:border-none print:rounded-none">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-10 print:bg-none print:text-black print:border-b-2 print:border-slate-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner print:border-slate-300 print:bg-slate-100">
                                    <Building2 className="w-7 h-7 text-white print:text-slate-700" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-white print:text-black">ইসরাইল এন্টারপ্রাইজ</h1>
                                    <p className="text-indigo-50/90 text-xs sm:text-sm flex items-center gap-1.5 mt-1 print:text-slate-600">
                                        <MapPin className="w-3.5 h-3.5 print:text-slate-500" /> শাহজী পাড়া, বড় বাজার, মেহেরপুর
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs sm:text-sm text-indigo-50/90 space-y-1.5 print:text-slate-600">
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Phone className="w-3.5 h-3.5 print:hidden" />
                                    <span>01997074920</span>
                                </p>
                                <p className="flex items-center sm:justify-end gap-2">
                                    <Mail className="w-3.5 h-3.5 print:hidden" />
                                    <span>jakoberjak2017@gmail.com</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Bill From / To */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-b border-slate-200/70 print:bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Bill From = আমরা (দোকান) */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none">
                                <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-3 uppercase">Bill From</span>
                                <p className="font-bold text-slate-800 text-base">ইসরাইল এন্টারপ্রাইজ</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">01997074920</p>
                                <p className="text-xs sm:text-sm text-slate-600">শাহজী পাড়া, বড় বাজার, মেহেরপুর</p>
                            </div>

                            {/* Bill To = কাস্টমার / ডিলার */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Bill To</span>
                                        <p className="font-bold text-slate-800 text-lg">{selectedOrder.customer}</p>
                                        <p className="text-xs text-slate-500 mt-1">{selectedOrder.phone}</p>
                                        <p className="text-xs text-slate-500">{selectedOrder.shippingAddress || selectedOrder.address || 'N/A'}</p>
                                        {selectedOrder.route && (
                                            <span className="inline-block mt-1.5 text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100">
                                                Route: {selectedOrder.route}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-indigo-500" /> Order Date: {selectedOrder.orderDate}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Inv: <span className="text-indigo-600">{selectedOrder.orderNo}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SR / Delivery Man Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-3 print:border-none print:p-0 print:shadow-none">
                                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                    <User className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">SR</p>
                                    <p className="text-sm font-semibold text-slate-800">{selectedOrder.sr || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-2xl border border-slate-200/70 shadow-sm flex items-center gap-3 print:border-none print:p-0 print:shadow-none">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                    <Truck className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Delivery Man</p>
                                    <p className="text-sm font-semibold text-slate-800">{selectedOrder.deliveredBy || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Remaining After Return Toggle (left) + Original Order View Toggle (right) */}
                    <div className={`px-6 sm:px-8 pt-6 sm:pt-8 items-center justify-between gap-3 print:hidden ${(hasReturn || hasOrderSnapshot) ? 'flex' : 'hidden'}`}>
                        <div className={`items-center gap-3 ${hasReturn ? 'flex' : 'invisible flex'}`}>
                            <span className="text-sm font-bold text-slate-700">Remaining After Return</span>
                            <button
                                type="button"
                                onClick={() => setShowRemaining((prev) => !prev)}
                                title={showRemaining ? 'ON' : 'OFF'}
                                className="flex items-center gap-1.5 cursor-pointer focus:outline-none"
                            >
                                <span className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 ${showRemaining ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${showRemaining ? 'translate-x-5' : ''}`} />
                                </span>
                                <span className={`text-xs font-bold ${showRemaining ? 'text-emerald-600' : 'text-gray-400'}`}>
                                    {showRemaining ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        </div>

                        {hasOrderSnapshot && (
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-slate-700">Original Order View</span>
                                <button
                                    type="button"
                                    onClick={() => setShowOrder((prev) => !prev)}
                                    title={showOrder ? 'ON' : 'OFF'}
                                    className="flex items-center gap-1.5 cursor-pointer focus:outline-none"
                                >
                                    <span className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 ${showOrder ? 'bg-amber-500' : 'bg-gray-300'}`}>
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${showOrder ? 'translate-x-5' : ''}`} />
                                    </span>
                                    <span className={`text-xs font-bold ${showOrder ? 'text-amber-600' : 'text-gray-400'}`}>
                                        {showOrder ? 'ON' : 'OFF'}
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Products Table */}
                    <div className="p-3 sm:p-4 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                    <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Quantity</th>
                                    <th className="py-2.5 px-2 whitespace-nowrap">Total Quantity</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                                    <th className="py-2.5 px-2 text-right whitespace-nowrap">Discount</th>
                                    <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Item Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {selectedOrder.items.map((item, index) => {
                                    const rowGrossTotal = getRowGross(item);
                                    const rem = getRemainingInfo(item);
                                    const fullDiscountAmt = Number(
                                        item.discountAmount ??
                                        (item.discountType === 'percent'
                                            ? (rowGrossTotal * Number(item.discount)) / 100
                                            : Number(item.discount))
                                    ) || 0;
                                    const discountAmt = fullDiscountAmt;
                                    const discountPct =
                                        item.discountType === 'percent'
                                            ? Number(item.discount) || 0
                                            : (rowGrossTotal > 0 ? (fullDiscountAmt / rowGrossTotal) * 100 : 0);

                                    const qUnit = showRemaining ? rem.remUnit : (item.unitQty || 0);
                                    const qSub = showRemaining ? rem.remSub : (item.subQty || 0);
                                    const qPcs = showRemaining ? rem.remPcs : (item.pcsQty || 0);
                                    const qTotal = showRemaining ? rem.remQty : item.totalPcs;

                                    const fUnit = showRemaining ? rem.remFreeUnit : (item.freeUnitQty || 0);
                                    const fSub = showRemaining ? rem.remFreeSub : (item.freeSubQty || 0);
                                    const fPcs = showRemaining ? rem.remFreePcs : (item.freePcsQty || 0);
                                    const fTotal = showRemaining ? rem.remFree : (item.freeQty || 0);

                                    const unitTotal = showRemaining ? rem.remUnitTotal : getUnitTotal(item);
                                    const subUnitTotal = showRemaining ? rem.remSubUnitTotal : getSubTotal(item);
                                    const pcsTotal = showRemaining ? rem.remPcsTotal : getPcsTotal(item);
                                    const rowSubtotal = showRemaining ? rem.remSubtotal : Number(item.itemTotal ?? item.subtotal);

                                    return (
                                        <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                            <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                            <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                            <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                            <td className="py-3 px-2 whitespace-nowrap">
                                                <div className="space-y-0.5">
                                                    <div className="font-semibold text-orange-600">
                                                        <span className="font-bold mr-1">Main:</span>
                                                        {qUnit} {item.unit} {item.parentMode && <>{qSub} {item.subUnit} </>}{qPcs} Pcs
                                                        <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-700">({qTotal})</b>
                                                    </div>
                                                    <div className="font-semibold text-emerald-600">
                                                        <span className="font-bold mr-1">Free:</span>
                                                        {fUnit} {item.unit} {item.parentMode && <>{fSub} {item.subUnit} </>}{fPcs} Pcs
                                                        <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-700">({fTotal})</b>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-2 font-semibold text-indigo-600 whitespace-nowrap">
                                                {(() => {
                                                    const c = getCombinedQty(item);
                                                    return (
                                                        <>
                                                            {c.u} {item.unit} {item.parentMode && <>{c.s} {item.subUnit} </>}{c.p} Pcs
                                                            <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-indigo-100 text-indigo-700">({c.total})</b>
                                                        </>
                                                    );
                                                })()}
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                ৳{unitTotal.toFixed(2)}
                                                <span className="text-[10px] text-slate-400 ml-1">
                                                    (৳{Number(item.sellPriceUnit || 0).toFixed(2)}/{item.unit || 'unit'})
                                                </span>
                                                {item.parentMode && (
                                                    <div className="text-fuchsia-600">
                                                        ৳{subUnitTotal.toFixed(2)}
                                                        <span className="text-[10px] text-slate-400 ml-1">
                                                            (৳{Number(item.sellPriceSub || 0).toFixed(2)}/{item.subUnit || 'sub'})
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                ৳{pcsTotal.toFixed(2)}
                                                <span className="text-[10px] text-slate-400 ml-1">
                                                    (৳{Number(item.sellPricePcs || 0).toFixed(2)}/pcs)
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-medium whitespace-nowrap">
                                                <span className={item.discountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                    ৳{discountAmt.toFixed(2)}
                                                </span>
                                                {' '}
                                                <span className={item.discountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                    ({discountPct.toFixed(2)}%)
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{rowSubtotal.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Others Free + Damage + Return (Payment box er niche) */}
                    <div className="order-2 pt-8 print:pt-4">
                        {selectedOrder.freeItems && selectedOrder.freeItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 className="text-xs font-bold text-amber-700 uppercase mb-3 flex items-center gap-1.5">
                                    <PackageX className="w-3.5 h-3.5 text-amber-600" /> Others Free Products
                                </h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-amber-100/70 text-amber-800 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                            <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                            <th className="py-2.5 px-2 rounded-r-xl whitespace-nowrap">Quantity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                        {selectedOrder.freeItems.map((item, index) => {
                                            const freeRem = getFreeItemRemaining(item);
                                            const dUnit = showRemaining ? freeRem.remUnit : (Number(item.unitQty) || 0);
                                            const dSub = showRemaining ? (freeRem.remSub || 0) : (Number(item.subQty) || 0);
                                            const dPcs = showRemaining ? freeRem.remPcs : (Number(item.pcsQty) || 0);
                                            const dTotal = showRemaining ? freeRem.remTotal : (Number(item.totalQty) || 0);
                                            return (
                                                <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                                    <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                    <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                                    <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                                    <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                        {dUnit} {item.unit} {item.parentMode && <>{dSub} {item.subUnit} </>}{dPcs} Pcs
                                                        <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {dTotal})</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Damage Products Table */}
                        {selectedOrder.damageItems && selectedOrder.damageItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 id="damage-section" className="text-xs font-bold text-red-700 uppercase mb-3 flex items-center gap-1.5 scroll-mt-6">
                                    <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> Damage Products
                                </h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-red-100/70 text-red-800 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                            <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Quantity</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Free Quantity</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                                            <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Item Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-red-100 text-xs sm:text-sm text-slate-700">
                                        {selectedOrder.damageItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-red-50/40 transition-colors">
                                                <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                                <td className="py-3 px-2 font-semibold text-orange-600 whitespace-nowrap">
                                                    {item.unitQty} {item.unit} {item.parentMode && <>{item.subQty || 0} {item.subUnit} </>}{item.pcsQty} Pcs
                                                    <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {item.totalQty})</span>
                                                </td>
                                                <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {item.freeUnitQty || 0} {item.unit} {item.parentMode && <>{item.freeSubQty || 0} {item.subUnit} </>}{item.freePcsQty || 0} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getUnitTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPriceUnit || 0).toFixed(2)}/{item.unit || 'unit'})
                                                    </span>
                                                    {item.parentMode && (
                                                        <div className="text-fuchsia-600">
                                                            ৳{getSubTotal(item).toFixed(2)}
                                                            <span className="text-[10px] text-slate-400 ml-1">
                                                                (৳{Number(item.sellPriceSub || 0).toFixed(2)}/{item.subUnit || 'sub'})
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getPcsTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPricePcs || 0).toFixed(2)}/pcs)
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Return Products Table */}
                        {selectedOrder.returnItems && selectedOrder.returnItems.length > 0 && (
                            <div className="px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto">
                                <h4 id="return-products-section" className="text-xs font-bold text-violet-700 uppercase mb-3 flex items-center gap-1.5 scroll-mt-6">
                                    <Undo2 className="w-3.5 h-3.5 text-violet-600" /> Return Products
                                </h4>
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-violet-100/70 text-violet-800 text-[10px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                            <th className="py-2.5 px-2 rounded-l-xl whitespace-nowrap">SL</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Product</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Company</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Quantity</th>
                                            <th className="py-2.5 px-2 whitespace-nowrap">Free Quantity</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (Unit)</th>
                                            <th className="py-2.5 px-2 text-right whitespace-nowrap">Price (PCS)</th>
                                            <th className="py-2.5 px-2 text-right rounded-r-xl whitespace-nowrap">Item Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-violet-100 text-xs sm:text-sm text-slate-700">
                                        {selectedOrder.returnItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-violet-50/40 transition-colors">
                                                <td className="py-3 px-2 font-medium text-slate-400 whitespace-nowrap">{index + 1}</td>
                                                <td className="py-3 px-2 font-semibold text-slate-800 whitespace-nowrap">{item.productName}</td>
                                                <td className="py-3 px-2 text-slate-600 whitespace-nowrap">{item.company}</td>
                                                <td className="py-3 px-2 font-semibold text-orange-600 whitespace-nowrap">
                                                    {item.unitQty} {item.unit} {item.parentMode && <>{item.subQty || 0} {item.subUnit} </>}{item.pcsQty} Pcs
                                                    <span className="text-xs text-indigo-600 ml-1 font-bold">(Total: {item.totalQty})</span>
                                                </td>
                                                <td className="py-3 px-2 font-semibold text-emerald-600 whitespace-nowrap">
                                                    {item.freeUnitQty || 0} {item.unit} {item.parentMode && <>{item.freeSubQty || 0} {item.subUnit} </>}{item.freePcsQty || 0} Pcs
                                                    <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getUnitTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPriceUnit || 0).toFixed(2)}/{item.unit || 'unit'})
                                                    </span>
                                                    {item.parentMode && (
                                                        <div className="text-fuchsia-600">
                                                            ৳{getSubTotal(item).toFixed(2)}
                                                            <span className="text-[10px] text-slate-400 ml-1">
                                                                (৳{Number(item.sellPriceSub || 0).toFixed(2)}/{item.subUnit || 'sub'})
                                                            </span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="py-3 px-2 text-right font-medium text-slate-600 whitespace-nowrap">
                                                    ৳{getPcsTotal(item).toFixed(2)}
                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                        (৳{Number(item.sellPricePcs || 0).toFixed(2)}/pcs)
                                                    </span>
                                                </td>
                                                <td className="py-3 px-2 text-right font-bold text-slate-900 whitespace-nowrap">৳{Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>

                    {/* Totals + Note */}
                    <div className="order-1 p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-between items-start gap-6 print:bg-white">
                        <div className="w-full sm:w-1/2">
                            {selectedOrder.orderNote && (
                                <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{selectedOrder.orderNote}</p>
                                </div>
                            )}
                        </div>

                        <div className="w-full sm:w-80 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 text-xs sm:text-sm">
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Subtotal:</span>
                                <span className="font-semibold text-slate-800">৳{shownGrand.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Product Wise Discount:</span>
                                <span className="font-semibold text-rose-600">
                                    - ৳{shownPwd.toFixed(2)}
                                    <span className="text-[10px] text-slate-400 ml-1">
                                        ({Number(shownPwdPct).toFixed(2)}%)
                                    </span>
                                </span>
                            </div>
                            {Number(selectedOrder.overallDiscount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Overall Discount:</span>
                                    <span className="font-semibold">
                                        {(() => {
                                            const afterProductDiscount = totals
                                                ? totals.afterProduct
                                                : baseSubTotal - Number(selectedOrder.productWiseDiscount);
                                            const overallAmt = totals
                                                ? totals.overallAmt
                                                : Number(
                                                    selectedOrder.overallDiscountValue ??
                                                    (selectedOrder.overallDiscountType === 'percent'
                                                        ? (afterProductDiscount * Number(selectedOrder.overallDiscount)) / 100
                                                        : Number(selectedOrder.overallDiscount))
                                                );
                                            const overallPct =
                                                selectedOrder.overallDiscountType === 'percent'
                                                    ? Number(selectedOrder.overallDiscount) || 0
                                                    : (afterProductDiscount > 0 ? (overallAmt / afterProductDiscount) * 100 : 0);
                                            return (
                                                <>
                                                    <span className={selectedOrder.overallDiscountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                        - ৳{overallAmt.toFixed(2)}
                                                    </span>
                                                    {' '}
                                                    <span className={selectedOrder.overallDiscountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                        ({overallPct.toFixed(2)}%)
                                                    </span>
                                                </>
                                            );
                                        })()}
                                    </span>
                                </div>
                            )}
                            {selectedOrder.adjustment && Number(selectedOrder.adjustment.amount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span className="truncate pr-2">
                                        {selectedOrder.adjustment.text || 'Adjustment'} ({selectedOrder.adjustment.type}):
                                    </span>
                                    <span className={`font-semibold shrink-0 ${selectedOrder.adjustment.type === '-' ? 'text-rose-600' : 'text-slate-800'}`}>
                                        {selectedOrder.adjustment.type === '-' ? '- ' : '+ '}৳{Number(selectedOrder.adjustment.amount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {Number(selectedOrder.damageAdjustmentAmount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Damage Products Amount:</span>
                                    <span className="font-semibold text-red-600">
                                        - ৳{Number(selectedOrder.damageAdjustmentAmount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            {Number(selectedOrder.returnAdjustmentAmount) > 0 && (
                                <div className="flex justify-between py-1 text-slate-600">
                                    <span>Return Products Amount:</span>
                                    <span className="font-semibold text-violet-600">
                                        - ৳{Number(selectedOrder.returnAdjustmentAmount).toFixed(2)}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-slate-900 border-t border-slate-200">
                                <span>Payable Amount:</span>
                                <span className="text-indigo-600">৳{shownPayable.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-1 text-slate-500 text-sm">
                                <span>Paid Amount:</span>
                                <span>৳{Number(selectedOrder.paidAmount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between py-2 text-sm font-bold text-slate-800 border-t border-dashed border-slate-300">
                                <span>Due Amount:</span>
                                <span className="text-rose-600">৳{due.toFixed(2)}</span>
                            </div>

                            {selectedOrder.receiveStatus && (
                                <div className="flex justify-between py-1 text-slate-500 text-xs pt-1">
                                    <span>Payment Status:</span>
                                    <span className={`font-semibold ${selectedOrder.receiveStatus === 'Received' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {selectedOrder.receiveStatus}
                                    </span>
                                </div>
                            )}

                            {selectedOrder.paymentNote && (
                                <div className="pt-2 mt-1 border-t border-slate-200">
                                    <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Note:</h4>
                                    <p className="text-xs text-slate-600 italic leading-relaxed">{selectedOrder.paymentNote}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesDetails;