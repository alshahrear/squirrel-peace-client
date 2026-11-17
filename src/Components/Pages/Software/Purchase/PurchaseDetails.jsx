import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, PackageX } from 'lucide-react';
import { PrintPage, ActionBar, Paper, BusinessHeader, PartySection, InfoLine, InvTag, Toggle, TableBox, headCls, SectionHeading, LoadingState, NotFoundState, CardList, ItemCard, Qty, ReturnItemCards } from './PurchasePrintUi';

const PurchaseDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rawInvoice, setSelectedInvoice] = useState(null);
    const [showOrder, setShowOrder] = useState(false);
    // Order r Receive er moddhe parthokko thakle tobei toggle dekhabe
    const hasOrderSnapshot = (() => {
        const snap = rawInvoice?.orderSnapshot;
        if (!snap) return false;
        const n = (v) => Number(v) || 0;
        const mainSig = (list) =>
            (list || [])
                .map((i) =>
                    [i.productName, n(i.totalPcs), n(i.freeTotalQty ?? i.freeQty), n(i.buyPrice), n(i.sellPrice), n(i.discount), i.discountType || 'amount'].join('|')
                )
                .join(';');
        const freeSig = (list) =>
            (list || []).map((i) => [i.productName, n(i.totalQty), n(i.sellPricePcs)].join('|')).join(';');
        const totalSig = (o) =>
            [n(o.subTotal ?? o.grandTotal), n(o.overallDiscount), o.overallDiscountType || 'amount', n(o.adjustment?.amount), o.adjustment?.type || '+', n(o.payableAmount)].join('|');
        return (
            mainSig(snap.items) !== mainSig(rawInvoice.items) ||
            freeSig(snap.freeItems) !== freeSig(rawInvoice.freeItems) ||
            totalSig(snap) !== totalSig(rawInvoice)
        );
    })();
    // Order View ON hole order dewar somoyer data dekhabe (database e kichu change hoy na)
    const [notFound, setNotFound] = useState(false);
    const [showRemainingToggle, setShowRemaining] = useState(!location.state?.fromReport); // report থেকে এলে default OFF, নাহলে ON
    const orderView = showOrder && hasOrderSnapshot;
    const selectedInvoice = orderView
        ? {
            ...rawInvoice,
            ...rawInvoice.orderSnapshot,
            subTotal: rawInvoice.orderSnapshot.subTotal ?? rawInvoice.orderSnapshot.grandTotal,
            returnItems: [],
            damageItems: [],
            returnHistory: [],
            returnAdjustmentAmount: 0,
            damageAdjustmentAmount: 0,
            paidAmount: 0,
            paymentNote: '',
        }
        : rawInvoice;

    // কোনো Return হয়েছে কিনা
    const hasReturn = (selectedInvoice?.returnHistory || []).some(
        (r) =>
            (Number(r.totalReturnPcs) || 0) > 0 ||
            (Number(r.totalReturnFreeQty) || 0) > 0 ||
            (Number(r.totalReturnFreeItemsQty) || 0) > 0
    );
    // Return না থাকলে Remaining feature কাজ করবে না
    const showRemaining = showRemainingToggle && hasReturn;

    // Discount purchase er somoy jeta silo setai thakbe (return e discount change hoy na)
    const displayItems = selectedInvoice?.items || [];
    const ovInv = selectedInvoice;
    const invSubTotal = Number(ovInv?.subTotal ?? ovInv?.grandTotal) || 0;

    // Return বাদ দিয়ে Remaining Quantity / Free Quantity / Subtotal হিসাব
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

    const getRemainingInfo = (item) => {
        let retQty = 0;
        let retFree = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
            const found = (ret.items || []).find((it) => it.productId === item.productId);
            if (found) {
                retQty += Number(found.returnTotalQty) || 0;
                retFree += Number(found.returnFreeTotalQty ?? found.returnFreeQty) || 0;
            }
        });

        const totalPcs = Number(item.totalPcs) || 0;
        const freeTotal = Number(item.freeTotalQty ?? item.freeQty) || 0;
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

        const freeUnitQty = Number(item.freeUnitQty) || 0;
        const freeSubQty = Number(item.freeSubQty) || 0;
        const freePcsQty = Number(item.freePcsQty) || 0;

        const [remUnit, remSub, remPcs] = retQty > 0
            ? splitQty(remQty, perUnit, perSub, parentMode)
            : [unitQty, subQty, pcsQty];
        const [remFreeUnit, remFreeSub, remFreePcs] = retFree > 0
            ? splitQty(remFree, perUnit, perSub, parentMode)
            : [freeUnitQty, freeSubQty, freePcsQty];

        const buyP = Number(item.buyPrice) || 0;
        const fullDiscRow = Number(
            item.discountAmount ??
            (item.discountType === 'percent'
                ? (buyP * totalPcs * Number(item.discount)) / 100
                : Number(item.discount))
        ) || 0;
        const remSubtotal = Math.max(buyP * remQty - fullDiscRow, 0);

        return { remQty, remFree, remUnit, remSub, remPcs, remFreeUnit, remFreeSub, remFreePcs, remSubtotal };
    };

    // (পুরনো ফাংশন - এটা ডিলিট করে দিতে পারেন)
    const getRemainingInfoOld = (item) => {
        let retQty = 0;
        let retFree = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
            const found = (ret.items || []).find((it) => it.productId === item.productId);
            if (found) {
                retQty += Number(found.returnTotalQty) || 0;
                retFree += Number(found.returnFreeTotalQty ?? found.returnFreeQty) || 0;
            }
        });

        const totalPcs = Number(item.totalPcs) || 0;
        const freeTotal = Number(item.freeTotalQty ?? item.freeQty) || 0;
        const remQty = Math.max(totalPcs - retQty, 0);
        const remFree = Math.max(freeTotal - retFree, 0);

        const unitQty = Number(item.unitQty) || 0;
        const pcsQty = Number(item.pcsQty) || 0;
        const perUnit = unitQty > 0 ? (totalPcs - pcsQty) / unitQty : 0;

        const freeUnitQty = Number(item.freeUnitQty) || 0;
        const freePcsQty = Number(item.freePcsQty) || 0;
        const freePerUnit = freeUnitQty > 0 ? (freeTotal - freePcsQty) / freeUnitQty : 0;

        const split = (total, per) => {
            if (per > 0) {
                const u = Math.floor(total / per);
                return [u, Math.round((total - u * per) * 100) / 100];
            }
            return [0, total];
        };

        const hasMainReturn = retQty > 0;
        const hasFreeReturn = retFree > 0;

        const [remUnit, remPcs] = hasMainReturn
            ? split(remQty, perUnit)
            : [unitQty, pcsQty];
        const [remFreeUnit, remFreePcs] = hasFreeReturn
            ? split(remFree, freePerUnit)
            : [freeUnitQty, freePcsQty];


        const subtotal = Number(item.subtotal) || 0;
        const remSubtotal = totalPcs > 0 ? (subtotal * remQty) / totalPcs : subtotal;

        return { remQty, remFree, remUnit, remPcs, remFreeUnit, remFreePcs, remSubtotal };
    };

    // Others Free Product: Return বাদ দিয়ে Remaining হিসাব
    const getFreeItemRemaining = (item) => {
        let retTotal = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
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

    // Main + Free + Others Free = Total Quantity
    const getCombinedQty = (item) => {
        const rem = getRemainingInfo(item);
        let others = 0;
        (selectedInvoice?.freeItems || [])
            .filter((f) => f.productId === item.productId)
            .forEach((f) => {
                others += showRemaining ? getFreeItemRemaining(f).remTotal : Number(f.totalQty) || 0;
            });
        const main = showRemaining ? rem.remQty : Number(item.totalPcs) || 0;
        const free = showRemaining ? rem.remFree : Number(item.freeTotalQty ?? item.freeQty) || 0;
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

    // (পুরনো ফাংশন - এটা ডিলিট করে দিতে পারেন)
    const getFreeItemRemainingOld = (item) => {
        let retTotal = 0;
        (selectedInvoice?.returnHistory || []).forEach((ret) => {
            const found = (ret.freeItems || []).find((it) => it.productId === item.productId);
            if (found) retTotal += Number(found.returnTotalQty) || 0;
        });

        const total = Number(item.totalQty) || 0;
        const unitQty = Number(item.unitQty) || 0;
        const pcsQty = Number(item.pcsQty) || 0;
        const perUnit =
            Number(item.pcsPerUnit) > 0
                ? Number(item.pcsPerUnit)
                : unitQty > 0
                    ? (total - pcsQty) / unitQty
                    : 0;

        const remTotal = Math.max(total - retTotal, 0);
        if (retTotal <= 0) {
            return { remTotal, remUnit: unitQty, remPcs: pcsQty };
        }
        if (perUnit > 0) {
            const u = Math.floor(remTotal / perUnit);
            return { remTotal, remUnit: u, remPcs: Math.round((remTotal - u * perUnit) * 100) / 100 };
        }
        return { remTotal, remUnit: 0, remPcs: remTotal };
    };

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setSelectedInvoice(data);
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
    }, [id]);

    // Return বাদ দিয়ে Grand Total / Discount / Payable / Due হিসাব
    // Bulk Return page theke View click korle Return section e scroll korbe
    useEffect(() => {
        const scrollTarget =
            location.state?.scrollTo ||
            (location.state?.scrollToReturn ||
                new URLSearchParams(location.search).get('scrollToReturn') === '1'
                ? 'return-products-section'
                : null);
        if (loading || !scrollTarget) return;
        const t = setTimeout(() => {
            document
                .getElementById(scrollTarget)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
        return () => clearTimeout(t);
    }, [loading, selectedInvoice, location.state, location.search]);
    const getTotals = () => {
        const inv = selectedInvoice;
        const paid = Number(inv.paidAmount || 0);

        if (!showRemaining) {
            const payable = Number(ovInv.payableAmount) || 0;
            return { payable, due: payable - paid };
        }

        let grand = 0;
        let pwd = 0;
        displayItems.forEach((item) => {
            const info = getRemainingInfo(item);
            const total = Number(item.totalPcs) || 0;
            const buy = Number(item.buyPrice) || 0;
            const gross = buy * total;
            const fullDisc = Number(
                item.discountAmount ??
                (item.discountType === 'percent'
                    ? (gross * Number(item.discount)) / 100
                    : Number(item.discount))
            ) || 0;
            grand += buy * info.remQty;
            pwd += fullDisc;
        });

        const afterProduct = grand - pwd;
        const overallAmt =
            ovInv.overallDiscountType === 'percent'
                ? (afterProduct * (Number(ovInv.overallDiscount) || 0)) / 100
                : Number(ovInv.overallDiscountValue ?? ovInv.overallDiscount) || 0;
        const adjAmt = Number(inv.adjustment?.amount) || 0;
        let payable = afterProduct - overallAmt;
        payable = inv.adjustment?.type === '-' ? payable - adjAmt : payable + adjAmt;
        payable -= Number(inv.returnAdjustmentAmount) || 0;
        payable -= Number(inv.damageAdjustmentAmount) || 0;
        if (Number(inv.previousBalanceAmount) > 0) {
            if (inv.previousBalanceType === 'Due') payable += Number(inv.previousBalanceAmount);
            else if (inv.previousBalanceType === 'Get') payable -= Number(inv.previousBalanceAmount);
        }
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

    // Payable negative hole company amader pay kore, tai Paid label "Company Paid" hobe
    // Negative payable: balance = payable + paid (positive hole company er theke aro pabo = Get, 0 hole sob mita)
    const getBalanceInfo = () => {
        const t = getTotals();
        const paid = Number(selectedInvoice?.paidAmount || 0);
        const isNegative = t.payable < 0;
        if (isNegative) {
            const net = t.payable + paid; // e.g. -50 + 30 = -20
            return {
                isNegative: true,
                paidLabel: 'Company Paid Amount:',
                balanceLabel: net < 0 ? 'Get Amount:' : 'Due Amount:',
                balance: Math.abs(net),
                balanceClass: net < 0 ? 'text-sky-600' : 'text-rose-600',
            };
        }
        if (t.due < 0) {
            return {
                isNegative: false,
                paidLabel: 'Paid Amount:',
                balanceLabel: 'Get Amount:',
                balance: Math.abs(t.due),
                balanceClass: 'text-sky-600',
            };
        }
        return {
            isNegative: false,
            paidLabel: 'Paid Amount:',
            balanceLabel: 'Due Amount:',
            balance: t.due,
            balanceClass: 'text-rose-600',
        };
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <PrintPage>
                <LoadingState text="Loading invoice..." />
            </PrintPage>
        );
    }

    if (notFound || !selectedInvoice) {
        return (
            <PrintPage>
                <NotFoundState
                    title="Invoice Not Found"
                    text="This purchase record couldn't be found. It may have been deleted."
                    backLabel="Back to Purchases"
                    onBack={() => navigate('/purchase')}
                />
            </PrintPage>
        );
    }

    const totals = getTotals();
    const bal = getBalanceInfo();
    const th = 'py-3 px-3.5';
    const td = 'py-4 px-3.5';

    return (
        <PrintPage>
            <ActionBar backLabel="Back to Purchases" onBack={() => navigate('/purchase')} onPrint={handlePrint} printLabel="Print Invoice" />

            <Paper>
                <BusinessHeader />

                <PartySection
                    from={{ name: selectedInvoice.company, phone: selectedInvoice.phone, address: selectedInvoice.address }}
                    shippingAddress={selectedInvoice.shippingAddress}
                >
                    <InfoLine>Purchase Date: {selectedInvoice.purchaseDate}</InfoLine>
                    <InvTag no={selectedInvoice.invoiceNo} />
                </PartySection>

                {/* Toggles */}
                {(hasReturn || hasOrderSnapshot) && (
                    <div className="px-4 sm:px-6 pt-4 flex flex-wrap items-center justify-between gap-x-6 print:hidden">
                        {hasReturn ? (
                            <Toggle label="Remaining After Return" on={showRemaining} onClick={() => setShowRemaining((prev) => !prev)} />
                        ) : (
                            <span />
                        )}
                        {hasOrderSnapshot && (
                            <Toggle
                                label="Original Order View"
                                on={showOrder}
                                onClick={() => setShowOrder((prev) => !prev)}
                                onCls="bg-amber-500"
                                txtCls="text-amber-600"
                            />
                        )}
                    </div>
                )}

                {/* Main products */}
                <div className="px-2 sm:px-6 pb-3 sm:pb-5 pt-2 sm:pt-4">
                    <CardList>
                        {displayItems.map((item, index) => {
                            const r = getRemainingInfo(item);
                            const c = getCombinedQty(item);
                            const qtyForCost = showRemaining ? r.remQty : Number(item.totalPcs);
                            const rowGross = Number(item.buyPrice) * Number(item.totalPcs);
                            const discountAmt = Number(
                                item.discountAmount ??
                                (item.discountType === 'percent'
                                    ? (rowGross * Number(item.discount)) / 100
                                    : Number(item.discount))
                            );
                            const remGross = showRemaining ? Number(item.buyPrice) * r.remQty : rowGross;
                            const discountPct =
                                item.discountType === 'percent' && !showRemaining
                                    ? Number(item.discount) || 0
                                    : remGross > 0 ? (discountAmt / remGross) * 100 : 0;
                            return (
                                <ItemCard
                                    key={index}
                                    index={index + 1}
                                    title={item.productName}
                                    sub={selectedInvoice.company}
                                    total={`৳${(showRemaining ? r.remSubtotal : Number(item.itemTotal ?? item.subtotal)).toFixed(2)}`}
                                    boxes={[
                                        { label: 'Main', cls: 'text-orange-600', value: <Qty u={showRemaining ? r.remUnit : item.unitQty || 0} unit={item.unit} s={showRemaining ? r.remSub : item.subQty || 0} sub={item.subUnit} parent={item.parentMode} p={showRemaining ? r.remPcs : item.pcsQty || 0} total={showRemaining ? r.remQty : item.totalPcs || 0} /> },
                                        { label: 'Free', cls: 'text-emerald-600', value: <Qty u={showRemaining ? r.remFreeUnit : item.freeUnitQty || 0} unit={item.unit} s={showRemaining ? r.remFreeSub : item.freeSubQty || 0} sub={item.subUnit} parent={item.parentMode} p={showRemaining ? r.remFreePcs : item.freePcsQty || 0} total={showRemaining ? r.remFree : item.freeTotalQty ?? item.freeQty ?? 0} /> },
                                        { label: 'Total Qty', cls: 'text-brand-700', value: <Qty u={c.u} unit={item.unit} s={c.s} sub={item.subUnit} parent={item.parentMode} p={c.p} total={c.total} /> },
                                        { label: 'Cost Price', side: 'right', value: `৳${(Number(item.buyPrice) * qtyForCost).toFixed(2)} (৳${Number(item.buyPrice).toFixed(2)})` },
                                        { label: 'Sell Price', side: 'right', value: `৳${(Number(item.sellPrice) * qtyForCost).toFixed(2)} (৳${Number(item.sellPrice).toFixed(2)})` },
                                        { label: 'Discount', side: 'right', cls: 'text-rose-600', value: `৳${discountAmt.toFixed(2)} (${discountPct.toFixed(2)}%)` },
                                    ]}
                                />
                            );
                        })}
                    </CardList>
                    <TableBox k="main">
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Company</th>
                                <th className={th}>Quantity</th>
                                <th className={th}>Total Qty</th>
                                <th className={`${th} text-right`}>Total Cost Price</th>
                                <th className={`${th} text-right`}>Total Sell Price</th>
                                <th className={`${th} text-right`}>Discount</th>
                                <th className={`${th} text-right rounded-r-xl`}>Item Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                            {displayItems.map((item, index) => {
                                const r = getRemainingInfo(item);
                                const c = getCombinedQty(item);
                                const mU = showRemaining ? r.remUnit : item.unitQty || 0;
                                const mS = showRemaining ? r.remSub : item.subQty || 0;
                                const mP = showRemaining ? r.remPcs : item.pcsQty || 0;
                                const mT = showRemaining ? r.remQty : item.totalPcs || 0;
                                const fU = showRemaining ? r.remFreeUnit : item.freeUnitQty || 0;
                                const fS = showRemaining ? r.remFreeSub : item.freeSubQty || 0;
                                const fP = showRemaining ? r.remFreePcs : item.freePcsQty || 0;
                                const fT = showRemaining ? r.remFree : item.freeTotalQty ?? item.freeQty ?? 0;
                                const qtyForCost = showRemaining ? r.remQty : Number(item.totalPcs);
                                const rowGross = Number(item.buyPrice) * Number(item.totalPcs);
                                const discountAmt = Number(
                                    item.discountAmount ??
                                    (item.discountType === 'percent'
                                        ? (rowGross * Number(item.discount)) / 100
                                        : Number(item.discount))
                                );
                                const remGross = showRemaining ? Number(item.buyPrice) * r.remQty : rowGross;
                                const discountPct =
                                    item.discountType === 'percent' && !showRemaining
                                        ? Number(item.discount) || 0
                                        : remGross > 0
                                            ? (discountAmt / remGross) * 100
                                            : 0;
                                return (
                                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                        <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                        <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                        <td className={`${td} text-slate-600`}>{selectedInvoice.company}</td>
                                        <td className={td}>
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-orange-600">
                                                    <span className="font-bold mr-1">Main:</span>
                                                    {mU} {item.unit} {item.parentMode && <>{mS} {item.subUnit} </>}{mP} Pcs
                                                    <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-50 text-brand-700">({mT})</b>
                                                </div>
                                                <div className="font-semibold text-emerald-600">
                                                    <span className="font-bold mr-1">Free:</span>
                                                    {fU} {item.unit} {item.parentMode && <>{fS} {item.subUnit} </>}{fP} Pcs
                                                    <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-50 text-brand-700">({fT})</b>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${td} font-semibold text-brand-700`}>
                                            {c.u} {item.unit} {item.parentMode && <>{c.s} {item.subUnit} </>}{c.p} Pcs
                                            <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-50 text-brand-700">({c.total})</b>
                                        </td>
                                        <td className={`${td} text-right font-medium text-slate-600`}>
                                            ৳{(Number(item.buyPrice) * qtyForCost).toFixed(2)}
                                            <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.buyPrice).toFixed(2)})</span>
                                        </td>
                                        <td className={`${td} text-right font-medium text-slate-600`}>
                                            ৳{(Number(item.sellPrice) * qtyForCost).toFixed(2)}
                                            <span className="text-[10px] text-slate-400 ml-1">(৳{Number(item.sellPrice).toFixed(2)})</span>
                                        </td>
                                        <td className={`${td} text-right font-medium`}>
                                            <span className={item.discountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                ৳{discountAmt.toFixed(2)}
                                            </span>{' '}
                                            <span className={item.discountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                ({discountPct.toFixed(2)}%)
                                            </span>
                                        </td>
                                        <td className={`${td} text-right font-bold text-slate-900`}>
                                            ৳{(showRemaining ? r.remSubtotal : Number(item.itemTotal ?? item.subtotal)).toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </TableBox>
                </div>

                {/* Others Free */}
                {selectedInvoice.freeItems && selectedInvoice.freeItems.length > 0 && (
                    <div className="order-2 px-2 sm:px-6 pb-3 sm:pb-5 pt-2 sm:pt-4 print:pt-4">
                        <SectionHeading tone="amber">
                            <PackageX className="w-3.5 h-3.5" /> Others Free Products
                        </SectionHeading>
                        <CardList>
                            {selectedInvoice.freeItems.map((item, index) => {
                                const freeRem = getFreeItemRemaining(item);
                                const dispTotal = showRemaining ? freeRem.remTotal : Number(item.totalQty) || 0;
                                return (
                                    <ItemCard
                                        key={index}
                                        index={index + 1}
                                        title={item.productName}
                                        sub={item.company}
                                        total={`৳${(dispTotal * (Number(item.sellPricePcs) || 0)).toFixed(2)}`}
                                        totalLabel="Sell Total"
                                        boxes={[
                                            { label: 'Quantity', cls: 'text-emerald-600', value: <Qty u={showRemaining ? freeRem.remUnit : Number(item.unitQty) || 0} unit={item.unit} s={showRemaining ? freeRem.remSub || 0 : Number(item.subQty) || 0} sub={item.subUnit} parent={item.parentMode} p={showRemaining ? freeRem.remPcs : Number(item.pcsQty) || 0} total={dispTotal} /> },
                                            { label: 'Sell Price (PCS)', value: `৳${Number(item.sellPricePcs || 0).toFixed(2)}` },
                                        ]}
                                    />
                                );
                            })}
                        </CardList>
                        <TableBox k="free">
                            <thead>
                                <tr className={headCls('amber')}>
                                    <th className={`${th} rounded-l-xl`}>SL</th>
                                    <th className={th}>Product</th>
                                    <th className={th}>Company</th>
                                    <th className={th}>Quantity</th>
                                    <th className={`${th} text-right rounded-r-xl`}>Sell Price (PCS)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.freeItems.map((item, index) => {
                                    const freeRem = getFreeItemRemaining(item);
                                    const dispUnit = showRemaining ? freeRem.remUnit : Number(item.unitQty) || 0;
                                    const dispPcs = showRemaining ? freeRem.remPcs : Number(item.pcsQty) || 0;
                                    const dispTotal = showRemaining ? freeRem.remTotal : Number(item.totalQty) || 0;
                                    const dispSub = showRemaining ? freeRem.remSub || 0 : Number(item.subQty) || 0;
                                    const pcsTotal = dispTotal * (Number(item.sellPricePcs) || 0);
                                    return (
                                        <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                            <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                            <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                            <td className={`${td} text-slate-600`}>{item.company}</td>
                                            <td className={`${td} font-semibold text-emerald-600`}>
                                                {dispUnit} {item.unit} {item.parentMode && <>{dispSub} {item.subUnit} </>}{dispPcs} Pcs
                                                <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {dispTotal})</span>
                                            </td>
                                            <td className={`${td} text-right font-medium text-slate-600`}>
                                                ৳{pcsTotal.toFixed(2)}
                                                <span className="text-[11px] text-slate-700 ml-1">
                                                    (৳{Number(item.sellPricePcs || 0).toFixed(2)}/<span className="text-xs font-bold">pcs</span>)
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </TableBox>
                    </div>
                )}

                {/* Bulk Return Products */}
                {selectedInvoice.returnItems && selectedInvoice.returnItems.length > 0 && (
                    <div className="order-2 px-2 sm:px-6 pb-3 sm:pb-5">
                        <SectionHeading id="return-products-section" tone="violet">Bulk Return Products</SectionHeading>
                        <ReturnItemCards items={selectedInvoice.returnItems} />
                        <TableBox k="ret">
                            <thead>
                                <tr className={headCls('violet')}>
                                    <th className={`${th} rounded-l-xl`}>SL</th>
                                    <th className={th}>Product</th>
                                    <th className={th}>Company</th>
                                    <th className={th}>Quantity</th>
                                    <th className={th}>Free Quantity</th>
                                    <th className={`${th} text-right`}>Buy Price (PCS)</th>
                                    <th className={`${th} text-right rounded-r-xl`}>Item Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-violet-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.returnItems.map((item, index) => (
                                    <tr key={index} className="hover:bg-violet-50/40 transition-colors">
                                        <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                        <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                        <td className={`${td} text-slate-600`}>{item.company}</td>
                                        <td className={`${td} font-semibold text-orange-600`}>
                                            {item.unitQty || 0} {item.unit} {item.parentMode && <>{item.subQty || 0} {item.subUnit} </>}{item.pcsQty || 0} Pcs
                                            <span className="text-xs text-brand-700 ml-1 font-bold">(Total: {item.totalQty})</span>
                                        </td>
                                        <td className={`${td} font-semibold text-emerald-600`}>
                                            {item.freeUnitQty || 0} {item.unit} {item.parentMode && <>{item.freeSubQty || 0} {item.subUnit} </>}{item.freePcsQty || 0} Pcs
                                            <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                                        </td>
                                        <td className={`${td} text-right font-medium text-slate-600`}>৳{Number(item.buyPrice || 0).toFixed(2)}</td>
                                        <td className={`${td} text-right font-bold text-slate-900`}>৳{Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableBox>
                    </div>
                )}

                {/* Damage Products */}
                {selectedInvoice.damageItems && selectedInvoice.damageItems.length > 0 && (
                    <div className="order-2 px-2 sm:px-6 pb-3 sm:pb-5">
                        <SectionHeading id="damage-products-section" tone="red">Damage Products</SectionHeading>
                        <ReturnItemCards items={selectedInvoice.damageItems} />
                        <TableBox k="ret">
                            <thead>
                                <tr className={headCls('red')}>
                                    <th className={`${th} rounded-l-xl`}>SL</th>
                                    <th className={th}>Product</th>
                                    <th className={th}>Company</th>
                                    <th className={th}>Quantity</th>
                                    <th className={th}>Free Quantity</th>
                                    <th className={`${th} text-right`}>Buy Price (PCS)</th>
                                    <th className={`${th} text-right rounded-r-xl`}>Item Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-red-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.damageItems.map((item, index) => (
                                    <tr key={index} className="hover:bg-red-50/40 transition-colors">
                                        <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                        <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                        <td className={`${td} text-slate-600`}>{item.company}</td>
                                        <td className={`${td} font-semibold text-orange-600`}>
                                            {item.unitQty || 0} {item.unit} {item.parentMode && <>{item.subQty || 0} {item.subUnit} </>}{item.pcsQty || 0} Pcs
                                            <span className="text-xs text-brand-700 ml-1 font-bold">(Total: {item.totalQty})</span>
                                        </td>
                                        <td className={`${td} font-semibold text-emerald-600`}>
                                            {item.freeUnitQty || 0} {item.unit} {item.parentMode && <>{item.freeSubQty || 0} {item.subUnit} </>}{item.freePcsQty || 0} Pcs
                                            <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                                        </td>
                                        <td className={`${td} text-right font-medium text-slate-600`}>৳{Number(item.buyPrice || 0).toFixed(2)}</td>
                                        <td className={`${td} text-right font-bold text-slate-900`}>৳{Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </TableBox>
                    </div>
                )}

                {/* Totals + Note */}
                <div className="order-1 p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-start gap-4 print:bg-white">
                    <div className="w-full sm:w-1/2">
                        {selectedInvoice.orderNote && (
                            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{selectedInvoice.orderNote}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between py-1 text-slate-600">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-slate-800">৳{(showRemaining ? totals.grand : invSubTotal).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-600">
                            <span>Product Wise Discount:</span>
                            <span className="font-semibold text-rose-600">
                                - ৳{(showRemaining ? totals.pwd : Number(ovInv.productWiseDiscount)).toFixed(2)}
                                <span className="text-[10px] text-slate-400 ml-1">
                                    ({(
                                        (showRemaining ? totals.pwdPct : ovInv.productWiseDiscountPercent) ??
                                        (invSubTotal > 0 ? (Number(ovInv.productWiseDiscount) / invSubTotal) * 100 : 0)
                                    ).toFixed(2)}%)
                                </span>
                            </span>
                        </div>
                        {Number(ovInv.overallDiscount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Overall Discount:</span>
                                <span className="font-semibold">
                                    {(() => {
                                        const afterProductDiscount = showRemaining ? totals.afterProduct : invSubTotal - Number(ovInv.productWiseDiscount);
                                        const overallAmt = showRemaining
                                            ? totals.overallAmt
                                            : Number(
                                                ovInv.overallDiscountValue ??
                                                (ovInv.overallDiscountType === 'percent'
                                                    ? (afterProductDiscount * Number(ovInv.overallDiscount)) / 100
                                                    : Number(ovInv.overallDiscount))
                                            );
                                        const overallPct =
                                            ovInv.overallDiscountType === 'percent'
                                                ? Number(ovInv.overallDiscount) || 0
                                                : afterProductDiscount > 0
                                                    ? (overallAmt / afterProductDiscount) * 100
                                                    : 0;
                                        return (
                                            <>
                                                <span className={ovInv.overallDiscountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                    - ৳{overallAmt.toFixed(2)}
                                                </span>{' '}
                                                <span className={ovInv.overallDiscountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                    ({overallPct.toFixed(2)}%)
                                                </span>
                                            </>
                                        );
                                    })()}
                                </span>
                            </div>
                        )}
                        {selectedInvoice.adjustment && Number(selectedInvoice.adjustment.amount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span className="truncate pr-2">
                                    {selectedInvoice.adjustment.text || 'Adjustment'} ({selectedInvoice.adjustment.type}):
                                </span>
                                <span className={`font-semibold shrink-0 ${selectedInvoice.adjustment.type === '-' ? 'text-rose-600' : 'text-slate-800'}`}>
                                    {selectedInvoice.adjustment.type === '-' ? '- ' : '+ '}৳{Number(selectedInvoice.adjustment.amount).toFixed(2)}
                                    <span className="text-[10px] text-slate-400 ml-1">
                                        ({(() => {
                                            const base = showRemaining
                                                ? totals.afterProduct - totals.overallAmt
                                                : invSubTotal - Number(ovInv.productWiseDiscount) - Number(ovInv.overallDiscountValue ?? 0);
                                            return base > 0 ? ((Number(selectedInvoice.adjustment.amount) / base) * 100).toFixed(2) : '0.00';
                                        })()}%)
                                    </span>
                                </span>
                            </div>
                        )}
                        {Number(selectedInvoice.damageAdjustmentAmount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Damage Products Adjustment:</span>
                                <span className="font-semibold text-red-600">- ৳{Number(selectedInvoice.damageAdjustmentAmount).toFixed(2)}</span>
                            </div>
                        )}
                        {Number(selectedInvoice.returnAdjustmentAmount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Return Products Adjustment:</span>
                                <span className="font-semibold text-violet-600">- ৳{Number(selectedInvoice.returnAdjustmentAmount).toFixed(2)}</span>
                            </div>
                        )}
                        {Number(selectedInvoice.previousBalanceAmount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>{selectedInvoice.previousBalanceType === 'Due' ? 'Previous Pay:' : 'Previous Get:'}</span>
                                <span className={`font-semibold ${selectedInvoice.previousBalanceType === 'Due' ? 'text-rose-600' : 'text-sky-600'}`}>
                                    {selectedInvoice.previousBalanceType === 'Due' ? '+ ' : '- '}৳{Number(selectedInvoice.previousBalanceAmount).toFixed(2)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-slate-900 border-t border-slate-200">
                            <span>{totals.payable < 0 ? 'Receivable Amount:' : 'Payable Amount:'}</span>
                            <span className="text-brand-700">৳{Math.abs(totals.payable).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-500 text-sm">
                            <span>{bal.paidLabel}</span>
                            <span>৳{Number(selectedInvoice.paidAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm font-bold text-slate-800 border-t border-dashed border-slate-300">
                            <span>{bal.balanceLabel}</span>
                            <span className={bal.balanceClass}>৳{bal.balance.toFixed(2)}</span>
                        </div>

                        {selectedInvoice.paymentNote && (
                            <div className="pt-2 mt-1 border-t border-slate-200">
                                <h4 className="text-[11px] font-bold text-slate-500 uppercase mb-1">Payment Note:</h4>
                                <p className="text-xs text-slate-600 italic leading-relaxed">{selectedInvoice.paymentNote}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Paper>
        </PrintPage>
    );
};

export default PurchaseDetails;