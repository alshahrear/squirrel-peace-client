import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FileText, PackageX, User, Truck, AlertTriangle, Undo2 } from 'lucide-react';
// NOTE: PurchasePrintUi er path tomar folder structure onujayi thik kore nio
import {
    PrintPage,
    ActionBar,
    Paper,
    BusinessHeader,
    InfoLine,
    InvTag,
    Toggle,
    TableBox,
    headCls,
    SectionHeading,
    LoadingState,
    NotFoundState,
    CardList,
    ItemCard,
    Qty,
} from '../Purchase/PurchasePrintUi';

const BUSINESS = {
    name: 'ইসরাইল এন্টারপ্রাইজ',
    address: 'শাহজী পাড়া, বড় বাজার, মেহেরপুর',
    phone: '01997074920',
};

const th = 'py-3 px-3.5';
const td = 'py-4 px-3.5';

// ---------- small pure helpers ----------
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

const getUnitTotal = (item) => (Number(item.unitQty) || 0) * (Number(item.sellPriceUnit) || 0);
const getSubTotal = (item) => (Number(item.subQty) || 0) * (Number(item.sellPriceSub) || 0);
const getPcsTotal = (item) => (Number(item.pcsQty) || 0) * (Number(item.sellPricePcs) || 0);
const getRowGross = (item) => getUnitTotal(item) + getSubTotal(item) + getPcsTotal(item);
const money = (v) => `৳${(Number(v) || 0).toFixed(2)}`;

// ---------- small UI pieces ----------
const Tag = ({ children }) => (
    <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md mb-2 uppercase">
        {children}
    </span>
);

const InfoBox = ({ icon, iconCls, label, value }) => (
    <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 flex items-center gap-3 print:border-none print:p-0">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 print:hidden ${iconCls}`}>{icon}</div>
        <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{value || 'N/A'}</p>
        </div>
    </div>
);

const PartyBlock = ({ order }) => (
    <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-slate-200 print:bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
                <Tag>Bill From</Tag>
                <p className="font-bold text-slate-800">{BUSINESS.name}</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{BUSINESS.phone}</p>
                <p className="text-xs sm:text-sm text-slate-600">{BUSINESS.address}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                        <Tag>Bill To</Tag>
                        <p className="font-bold text-slate-800 text-lg leading-tight">{order.customer}</p>
                        <p className="text-xs text-slate-500 mt-1">{order.phone}</p>
                        <p className="text-xs text-slate-500">{order.shippingAddress || order.address || 'N/A'}</p>
                        {order.route && (
                            <span className="inline-block mt-1.5 text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-md border border-teal-100">
                                Route: {order.route}
                            </span>
                        )}
                    </div>
                    <div className="sm:text-right shrink-0 space-y-1.5">
                        <InfoLine>Order Date: {order.orderDate}</InfoLine>
                        <InvTag no={order.orderNo || order.invoiceNo} />
                    </div>
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
            <InfoBox icon={<User className="w-4 h-4 text-brand-600" />} iconCls="bg-brand-50" label="SR" value={order.sr} />
            <InfoBox icon={<Truck className="w-4 h-4 text-emerald-600" />} iconCls="bg-emerald-50" label="Delivery Man" value={order.deliveredBy} />
        </div>
    </div>
);

const PriceCell = ({ total, price, unit, subTotal, subPrice, subUnit, parentMode }) => (
    <>
        {money(total)}
        <span className="text-[10px] text-slate-400 ml-1">({money(price)}/{unit || 'unit'})</span>
        {parentMode && (
            <div className="text-fuchsia-600">
                {money(subTotal)}
                <span className="text-[10px] text-slate-400 ml-1">({money(subPrice)}/{subUnit || 'sub'})</span>
            </div>
        )}
    </>
);

// Damage / Return products (mobile cards)
const SellItemCards = ({ items }) => (
    <CardList>
        {items.map((item, i) => {
            const boxes = [
                { label: 'Quantity', cls: 'text-orange-600', value: <Qty u={item.unitQty || 0} unit={item.unit} s={item.subQty || 0} sub={item.subUnit} parent={item.parentMode} p={item.pcsQty || 0} total={item.totalQty || 0} /> },
                { label: 'Free Quantity', cls: 'text-emerald-600', value: <Qty u={item.freeUnitQty || 0} unit={item.unit} s={item.freeSubQty || 0} sub={item.subUnit} parent={item.parentMode} p={item.freePcsQty || 0} total={item.freeQty || 0} /> },
                { label: 'Price (Unit)', side: 'right', value: `${money(getUnitTotal(item))} (${money(item.sellPriceUnit)})` },
                item.parentMode && { label: 'Price (Sub)', side: 'right', cls: 'text-fuchsia-600', value: `${money(getSubTotal(item))} (${money(item.sellPriceSub)})` },
                { label: 'Price (PCS)', side: 'right', value: `${money(getPcsTotal(item))} (${money(item.sellPricePcs)})` },
            ].filter(Boolean);
            return (
                <ItemCard
                    key={i}
                    index={i + 1}
                    title={item.productName}
                    sub={item.company}
                    total={money(item.itemTotal ?? item.subtotal ?? 0)}
                    boxes={boxes}
                />
            );
        })}
    </CardList>
);

// Damage / Return products (table)
const SellItemTable = ({ items, tone, divide, hover }) => (
    <TableBox>
        <thead>
            <tr className={headCls(tone)}>
                <th className={`${th} rounded-l-xl`}>SL</th>
                <th className={th}>Product</th>
                <th className={th}>Company</th>
                <th className={th}>Quantity</th>
                <th className={th}>Free Quantity</th>
                <th className={`${th} text-right`}>Price (Unit)</th>
                <th className={`${th} text-right`}>Price (PCS)</th>
                <th className={`${th} text-right rounded-r-xl`}>Item Total</th>
            </tr>
        </thead>
        <tbody className={`divide-y ${divide} text-xs sm:text-sm text-slate-700`}>
            {items.map((item, index) => (
                <tr key={index} className={`${hover} transition-colors`}>
                    <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                    <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                    <td className={`${td} text-slate-600`}>{item.company}</td>
                    <td className={`${td} font-semibold text-orange-600`}>
                        {item.unitQty || 0} {item.unit} {item.parentMode && <>{item.subQty || 0} {item.subUnit} </>}{item.pcsQty || 0} Pcs
                        <span className="text-xs text-brand-700 ml-1 font-bold">(Total: {item.totalQty || 0})</span>
                    </td>
                    <td className={`${td} font-semibold text-emerald-600`}>
                        {item.freeUnitQty || 0} {item.unit} {item.parentMode && <>{item.freeSubQty || 0} {item.subUnit} </>}{item.freePcsQty || 0} Pcs
                        <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.freeQty || 0})</span>
                    </td>
                    <td className={`${td} text-right font-medium text-slate-600`}>
                        <PriceCell
                            total={getUnitTotal(item)}
                            price={item.sellPriceUnit}
                            unit={item.unit}
                            subTotal={getSubTotal(item)}
                            subPrice={item.sellPriceSub}
                            subUnit={item.subUnit}
                            parentMode={item.parentMode}
                        />
                    </td>
                    <td className={`${td} text-right font-medium text-slate-600`}>
                        {money(getPcsTotal(item))}
                        <span className="text-[10px] text-slate-400 ml-1">({money(item.sellPricePcs)}/pcs)</span>
                    </td>
                    <td className={`${td} text-right font-bold text-slate-900`}>{money(item.itemTotal ?? item.subtotal ?? 0)}</td>
                </tr>
            ))}
        </tbody>
    </TableBox>
);

const SalesDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [rawOrder, setSelectedOrder] = useState(null);
    const [showOrder, setShowOrder] = useState(false);
    const [showRemainingToggle, setShowRemaining] = useState(true); // default ON

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

    // কোনো Return হয়েছে কিনা
    const hasReturn = (selectedOrder?.returnHistory || []).some((r) => {
        if (
            (Number(r.totalReturnPcs) || 0) > 0 ||
            (Number(r.totalReturnFreeQty) || 0) > 0 ||
            (Number(r.totalReturnFreeItemsQty) || 0) > 0
        )
            return true;
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
        const perUnit =
            Number(item.pcsPerUnit) > 0
                ? Number(item.pcsPerUnit)
                : unitQty > 0
                    ? (totalPcs - pcsQty - subQty * perSub) / unitQty
                    : 0;

        const [remUnit, remSub, remPcs] =
            retQty > 0 ? splitQty(remQty, perUnit, perSub, parentMode) : [unitQty, subQty, pcsQty];
        const [remFreeUnit, remFreeSub, remFreePcs] =
            retFree > 0
                ? splitQty(remFree, perUnit, perSub, parentMode)
                : [Number(item.freeUnitQty) || 0, Number(item.freeSubQty) || 0, Number(item.freePcsQty) || 0];

        const remUnitTotal = remUnit * (Number(item.sellPriceUnit) || 0);
        const remSubUnitTotal = remSub * (Number(item.sellPriceSub) || 0);
        const remPcsTotal = remPcs * (Number(item.sellPricePcs) || 0);
        const remGross = remUnitTotal + remSubUnitTotal + remPcsTotal;

        const fullGross = getRowGross(item);
        const fullDiscRow =
            Number(
                item.discountAmount ??
                (item.discountType === 'percent' ? (fullGross * Number(item.discount)) / 100 : Number(item.discount))
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
        const perUnit =
            Number(item.pcsPerUnit) > 0
                ? Number(item.pcsPerUnit)
                : unitQty > 0
                    ? (total - pcsQty - subQty * perSub) / unitQty
                    : 0;

        const remTotal = Math.max(total - retTotal, 0);
        if (retTotal <= 0) return { remTotal, remUnit: unitQty, remSub: subQty, remPcs: pcsQty };
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
        const perUnit =
            Number(item.pcsPerUnit) > 0
                ? Number(item.pcsPerUnit)
                : uQ > 0
                    ? ((Number(item.totalPcs) || 0) - pQ - sQ * perSub) / uQ
                    : 0;
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
            const gross = getRowGross(item);
            const fullDisc =
                Number(
                    item.discountAmount ??
                    (item.discountType === 'percent' ? (gross * Number(item.discount)) / 100 : Number(item.discount))
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
        if (Number(inv.previousBalanceAmount) > 0) {
            if (inv.previousBalanceType === 'Due') payable += Number(inv.previousBalanceAmount);
            else if (inv.previousBalanceType === 'Get') payable -= Number(inv.previousBalanceAmount);
        }
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
        fetch(`http://localhost:5000/sales/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) setSelectedOrder(data);
                else setNotFound(true);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching sales data:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id]);

    // DamageProducts / ReturnProducts থেকে এলে সংশ্লিষ্ট section এ scroll করবে
    useEffect(() => {
        const target =
            location.state?.scrollTo ||
            (new URLSearchParams(location.search).get('scrollToReturn') ? 'return-products-section' : null);
        if (loading || !selectedOrder || !target) return;
        const t = setTimeout(() => {
            document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, selectedOrder, location.state, location.search]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <PrintPage>
                <LoadingState text="Loading invoice..." />
            </PrintPage>
        );
    }

    if (notFound || !selectedOrder) {
        return (
            <PrintPage>
                <NotFoundState
                    title="Invoice Not Found"
                    text="This order record couldn't be found. It may have been deleted."
                    backLabel="Back to Wholesale"
                    onBack={() => navigate('/wholesale')}
                />
            </PrintPage>
        );
    }

    const totals = showRemaining ? getTotals() : null;
    const due = Number(selectedOrder.payableAmount) - Number(selectedOrder.paidAmount || 0);

    // Customer system: beshi dile Due er jaigay Pay Amount (positive) dekhabe
    const getBalanceInfo = () => {
        const payable = Number(selectedOrder.payableAmount) || 0;
        const paid = Number(selectedOrder.paidAmount || 0);
        if (payable < 0) {
            const net = payable + paid;
            return {
                balanceLabel: net < 0 ? 'Pay Amount:' : 'Due Amount:',
                balance: Math.abs(net),
                balanceClass: net < 0 ? 'text-rose-600' : 'text-sky-600',
            };
        }
        if (due < 0) return { balanceLabel: 'Pay Amount:', balance: Math.abs(due), balanceClass: 'text-rose-600' };
        return { balanceLabel: 'Due Amount:', balance: due, balanceClass: 'text-sky-600' };
    };
    const bal = getBalanceInfo();

    const baseSubTotal = Number(selectedOrder.subTotal ?? selectedOrder.grandTotal) || 0;
    const shownGrand = totals ? totals.grand : baseSubTotal;
    const shownPwd = totals ? totals.pwd : Number(selectedOrder.productWiseDiscount) || 0;
    const shownPwdPct = totals
        ? totals.pwdPct
        : selectedOrder.productWiseDiscountPercent ??
        (baseSubTotal > 0 ? (shownPwd / baseSubTotal) * 100 : 0);
    const shownPayable = Number(selectedOrder.payableAmount) || 0;

    // এক row এর সব হিসাব (mobile card + desktop table দুটোতেই লাগে)
    const rowCalc = (item) => {
        const rem = getRemainingInfo(item);
        const gross = getRowGross(item);
        const discAmt =
            Number(
                item.discountAmount ??
                (item.discountType === 'percent' ? (gross * Number(item.discount)) / 100 : Number(item.discount))
            ) || 0;
        const discPct =
            item.discountType === 'percent' ? Number(item.discount) || 0 : gross > 0 ? (discAmt / gross) * 100 : 0;
        return {
            discAmt,
            discPct,
            qUnit: showRemaining ? rem.remUnit : item.unitQty || 0,
            qSub: showRemaining ? rem.remSub : item.subQty || 0,
            qPcs: showRemaining ? rem.remPcs : item.pcsQty || 0,
            qTotal: showRemaining ? rem.remQty : item.totalPcs || 0,
            fUnit: showRemaining ? rem.remFreeUnit : item.freeUnitQty || 0,
            fSub: showRemaining ? rem.remFreeSub : item.freeSubQty || 0,
            fPcs: showRemaining ? rem.remFreePcs : item.freePcsQty || 0,
            fTotal: showRemaining ? rem.remFree : item.freeQty || 0,
            unitTotal: showRemaining ? rem.remUnitTotal : getUnitTotal(item),
            subUnitTotal: showRemaining ? rem.remSubUnitTotal : getSubTotal(item),
            pcsTotal: showRemaining ? rem.remPcsTotal : getPcsTotal(item),
            rowSubtotal: showRemaining ? rem.remSubtotal : Number(item.itemTotal ?? item.subtotal) || 0,
        };
    };

    return (
        <PrintPage>
            <ActionBar backLabel="Back to Wholesale" onBack={() => navigate('/wholesale')} onPrint={handlePrint} printLabel="Print Invoice" />

            <Paper>
                <BusinessHeader />

                <PartyBlock order={selectedOrder} />

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
                        {(selectedOrder.items || []).map((item, index) => {
                            const r = rowCalc(item);
                            const c = getCombinedQty(item);
                            const boxes = [
                                { label: 'Main', cls: 'text-orange-600', value: <Qty u={r.qUnit} unit={item.unit} s={r.qSub} sub={item.subUnit} parent={item.parentMode} p={r.qPcs} total={r.qTotal} /> },
                                { label: 'Free', cls: 'text-emerald-600', value: <Qty u={r.fUnit} unit={item.unit} s={r.fSub} sub={item.subUnit} parent={item.parentMode} p={r.fPcs} total={r.fTotal} /> },
                                { label: 'Total Qty', cls: 'text-brand-700', value: <Qty u={c.u} unit={item.unit} s={c.s} sub={item.subUnit} parent={item.parentMode} p={c.p} total={c.total} /> },
                                { label: 'Price (Unit)', side: 'right', value: `${money(r.unitTotal)} (${money(item.sellPriceUnit)})` },
                                item.parentMode && { label: 'Price (Sub)', side: 'right', cls: 'text-fuchsia-600', value: `${money(r.subUnitTotal)} (${money(item.sellPriceSub)})` },
                                { label: 'Price (PCS)', side: 'right', value: `${money(r.pcsTotal)} (${money(item.sellPricePcs)})` },
                                { label: 'Discount', side: 'right', cls: 'text-rose-600', value: `${money(r.discAmt)} (${r.discPct.toFixed(2)}%)` },
                            ].filter(Boolean);
                            return (
                                <ItemCard
                                    key={index}
                                    index={index + 1}
                                    title={item.productName}
                                    sub={item.company}
                                    total={money(r.rowSubtotal)}
                                    boxes={boxes}
                                />
                            );
                        })}
                    </CardList>

                    <TableBox>
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Company</th>
                                <th className={th}>Quantity</th>
                                <th className={th}>Total Qty</th>
                                <th className={`${th} text-right`}>Price (Unit)</th>
                                <th className={`${th} text-right`}>Price (PCS)</th>
                                <th className={`${th} text-right`}>Discount</th>
                                <th className={`${th} text-right rounded-r-xl`}>Item Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                            {(selectedOrder.items || []).map((item, index) => {
                                const r = rowCalc(item);
                                const c = getCombinedQty(item);
                                return (
                                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                        <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                        <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                        <td className={`${td} text-slate-600`}>{item.company}</td>
                                        <td className={td}>
                                            <div className="space-y-0.5">
                                                <div className="font-semibold text-orange-600">
                                                    <span className="font-bold mr-1">Main:</span>
                                                    {r.qUnit} {item.unit} {item.parentMode && <>{r.qSub} {item.subUnit} </>}{r.qPcs} Pcs
                                                    <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-50 text-brand-700">({r.qTotal})</b>
                                                </div>
                                                <div className="font-semibold text-emerald-600">
                                                    <span className="font-bold mr-1">Free:</span>
                                                    {r.fUnit} {item.unit} {item.parentMode && <>{r.fSub} {item.subUnit} </>}{r.fPcs} Pcs
                                                    <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-50 text-brand-700">({r.fTotal})</b>
                                                </div>
                                            </div>
                                        </td>
                                        <td className={`${td} font-semibold text-brand-700`}>
                                            {c.u} {item.unit} {item.parentMode && <>{c.s} {item.subUnit} </>}{c.p} Pcs
                                            <b className="ml-1 px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-50 text-brand-700">({c.total})</b>
                                        </td>
                                        <td className={`${td} text-right font-medium text-slate-600`}>
                                            <PriceCell
                                                total={r.unitTotal}
                                                price={item.sellPriceUnit}
                                                unit={item.unit}
                                                subTotal={r.subUnitTotal}
                                                subPrice={item.sellPriceSub}
                                                subUnit={item.subUnit}
                                                parentMode={item.parentMode}
                                            />
                                        </td>
                                        <td className={`${td} text-right font-medium text-slate-600`}>
                                            {money(r.pcsTotal)}
                                            <span className="text-[10px] text-slate-400 ml-1">({money(item.sellPricePcs)}/pcs)</span>
                                        </td>
                                        <td className={`${td} text-right font-medium`}>
                                            <span className={item.discountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                {money(r.discAmt)}
                                            </span>{' '}
                                            <span className={item.discountType === 'percent' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                ({r.discPct.toFixed(2)}%)
                                            </span>
                                        </td>
                                        <td className={`${td} text-right font-bold text-slate-900`}>{money(r.rowSubtotal)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </TableBox>
                </div>

                {/* Others Free */}
                {selectedOrder.freeItems && selectedOrder.freeItems.length > 0 && (
                    <div className="order-2 px-2 sm:px-6 pb-3 sm:pb-5 pt-2 sm:pt-4 print:pt-4">
                        <SectionHeading tone="amber">
                            <PackageX className="w-3.5 h-3.5" /> Others Free Products
                        </SectionHeading>
                        <CardList>
                            {selectedOrder.freeItems.map((item, index) => {
                                const fr = getFreeItemRemaining(item);
                                const dTotal = showRemaining ? fr.remTotal : Number(item.totalQty) || 0;
                                return (
                                    <ItemCard
                                        key={index}
                                        index={index + 1}
                                        title={item.productName}
                                        sub={item.company}
                                        boxes={[
                                            {
                                                label: 'Quantity',
                                                cls: 'text-emerald-600',
                                                value: (
                                                    <Qty
                                                        u={showRemaining ? fr.remUnit : Number(item.unitQty) || 0}
                                                        unit={item.unit}
                                                        s={showRemaining ? fr.remSub || 0 : Number(item.subQty) || 0}
                                                        sub={item.subUnit}
                                                        parent={item.parentMode}
                                                        p={showRemaining ? fr.remPcs : Number(item.pcsQty) || 0}
                                                        total={dTotal}
                                                    />
                                                ),
                                            },
                                        ]}
                                    />
                                );
                            })}
                        </CardList>
                        <TableBox>
                            <thead>
                                <tr className={headCls('amber')}>
                                    <th className={`${th} rounded-l-xl`}>SL</th>
                                    <th className={th}>Product</th>
                                    <th className={th}>Company</th>
                                    <th className={`${th} rounded-r-xl`}>Quantity</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                {selectedOrder.freeItems.map((item, index) => {
                                    const fr = getFreeItemRemaining(item);
                                    const dUnit = showRemaining ? fr.remUnit : Number(item.unitQty) || 0;
                                    const dSub = showRemaining ? fr.remSub || 0 : Number(item.subQty) || 0;
                                    const dPcs = showRemaining ? fr.remPcs : Number(item.pcsQty) || 0;
                                    const dTotal = showRemaining ? fr.remTotal : Number(item.totalQty) || 0;
                                    return (
                                        <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                            <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                            <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                            <td className={`${td} text-slate-600`}>{item.company}</td>
                                            <td className={`${td} font-semibold text-emerald-600`}>
                                                {dUnit} {item.unit} {item.parentMode && <>{dSub} {item.subUnit} </>}{dPcs} Pcs
                                                <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {dTotal})</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </TableBox>
                    </div>
                )}

                {/* Damage Products */}
                {selectedOrder.damageItems && selectedOrder.damageItems.length > 0 && (
                    <div className="order-2 px-2 sm:px-6 pb-3 sm:pb-5">
                        <SectionHeading id="damage-section" tone="red">
                            <AlertTriangle className="w-3.5 h-3.5" /> Damage Products
                        </SectionHeading>
                        <SellItemCards items={selectedOrder.damageItems} />
                        <SellItemTable items={selectedOrder.damageItems} tone="red" divide="divide-red-100" hover="hover:bg-red-50/40" />
                    </div>
                )}

                {/* Return Products */}
                {selectedOrder.returnItems && selectedOrder.returnItems.length > 0 && (
                    <div className="order-2 px-2 sm:px-6 pb-3 sm:pb-5">
                        <SectionHeading id="return-products-section" tone="violet">
                            <Undo2 className="w-3.5 h-3.5" /> Return Products
                        </SectionHeading>
                        <SellItemCards items={selectedOrder.returnItems} />
                        <SellItemTable items={selectedOrder.returnItems} tone="violet" divide="divide-violet-100" hover="hover:bg-violet-50/40" />
                    </div>
                )}

                {/* Totals + Note */}
                <div className="order-1 p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-start gap-4 print:bg-white">
                    <div className="w-full sm:w-1/2">
                        {selectedOrder.orderNote && (
                            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{selectedOrder.orderNote}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between py-1 text-slate-600">
                            <span>Subtotal:</span>
                            <span className="font-semibold text-slate-800">{money(shownGrand)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-600">
                            <span>Product Wise Discount:</span>
                            <span className="font-semibold text-rose-600">
                                - {money(shownPwd)}
                                <span className="text-[10px] text-slate-400 ml-1">({Number(shownPwdPct).toFixed(2)}%)</span>
                            </span>
                        </div>
                        {Number(selectedOrder.overallDiscount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Overall Discount:</span>
                                <span className="font-semibold">
                                    {(() => {
                                        const afterProductDiscount = totals
                                            ? totals.afterProduct
                                            : baseSubTotal - (Number(selectedOrder.productWiseDiscount) || 0);
                                        const overallAmt = totals
                                            ? totals.overallAmt
                                            : Number(
                                                selectedOrder.overallDiscountValue ??
                                                (selectedOrder.overallDiscountType === 'percent'
                                                    ? (afterProductDiscount * Number(selectedOrder.overallDiscount)) / 100
                                                    : Number(selectedOrder.overallDiscount))
                                            ) || 0;
                                        const overallPct =
                                            selectedOrder.overallDiscountType === 'percent'
                                                ? Number(selectedOrder.overallDiscount) || 0
                                                : afterProductDiscount > 0
                                                    ? (overallAmt / afterProductDiscount) * 100
                                                    : 0;
                                        return (
                                            <>
                                                <span className={selectedOrder.overallDiscountType === 'amount' ? 'text-rose-600 font-bold' : 'text-slate-400 font-medium'}>
                                                    - {money(overallAmt)}
                                                </span>{' '}
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
                                    {selectedOrder.adjustment.type === '-' ? '- ' : '+ '}
                                    {money(selectedOrder.adjustment.amount)}
                                    <span className="text-[10px] text-slate-400 ml-1">
                                        ({(() => {
                                            const base = totals
                                                ? totals.afterProduct - totals.overallAmt
                                                : baseSubTotal -
                                                (Number(selectedOrder.productWiseDiscount) || 0) -
                                                (Number(selectedOrder.overallDiscountValue) || 0);
                                            return base > 0 ? ((Number(selectedOrder.adjustment.amount) / base) * 100).toFixed(2) : '0.00';
                                        })()}%)
                                    </span>
                                </span>
                            </div>
                        )}
                        {Number(selectedOrder.damageAdjustmentAmount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Damage Products Amount:</span>
                                <span className="font-semibold text-red-600">- {money(selectedOrder.damageAdjustmentAmount)}</span>
                            </div>
                        )}
                        {Number(selectedOrder.returnAdjustmentAmount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>Return Products Amount:</span>
                                <span className="font-semibold text-violet-600">- {money(selectedOrder.returnAdjustmentAmount)}</span>
                            </div>
                        )}
                        {Number(selectedOrder.previousBalanceAmount) > 0 && (
                            <div className="flex justify-between py-1 text-slate-600">
                                <span>{selectedOrder.previousBalanceType === 'Due' ? 'Previous Get:' : 'Previous Pay:'}</span>
                                <span className={`font-semibold ${selectedOrder.previousBalanceType === 'Due' ? 'text-sky-600' : 'text-rose-600'}`}>
                                    {selectedOrder.previousBalanceType === 'Due' ? '+ ' : '- '}
                                    {money(selectedOrder.previousBalanceAmount)}
                                </span>
                            </div>
                        )}
                        <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-slate-900 border-t border-slate-200">
                            <span>Receivable Amount:</span>
                            <span className="text-brand-700">{money(shownPayable)}</span>
                        </div>
                        <div className="flex justify-between py-1 text-slate-500 text-sm">
                            <span>{shownPayable < 0 ? 'Paid Amount:' : 'Received Amount:'}</span>
                            <span>{money(selectedOrder.paidAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-sm font-bold text-slate-800 border-t border-dashed border-slate-300">
                            <span>{bal.balanceLabel}</span>
                            <span className={bal.balanceClass}>{money(bal.balance)}</span>
                        </div>

                        {selectedOrder.receiveStatus && (
                            <div className="flex justify-between py-1 text-slate-500 text-xs">
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
            </Paper>
        </PrintPage>
    );
};

export default SalesDetails;