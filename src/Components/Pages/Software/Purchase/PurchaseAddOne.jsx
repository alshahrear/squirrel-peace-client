import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { fetchAccountBalance } from '../../Software/Account/AccountBalance';
import { inputCls, labelCls } from './PurchaseUi';

// Account e koto taka ache -> AccountBalance file theke (refresh lagbe na)
export const getAccountAvailable = (paymentAccount, excludePurchaseId = null) =>
    fetchAccountBalance(paymentAccount, excludePurchaseId);

export const matchesSearch = (text, fields) => {
    const q = (text || '').toString().trim().toLowerCase();
    if (!q) return true;
    return fields.some((f) => (f || '').toString().toLowerCase().includes(q));
};

export const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
        />
    </svg>
);

// number input er up/down arrow lukano
const NO_SPIN = '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';

export const SearchSelect = ({ label, placeholder, searchValue, onSearchChange, onClear, onSelect, items, getKey, emptyText, renderItem }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="relative">
            <label className={labelCls}>{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={searchValue}
                    placeholder={placeholder}
                    autoComplete="off"
                    onFocus={() => setOpen(true)}
                    onChange={(e) => {
                        onSearchChange(e.target.value);
                        setOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setOpen(false), 150)}
                    className={`${inputCls} pr-9`}
                />
                {searchValue && (
                    <button
                        type="button"
                        aria-label="Clear"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            onClear();
                        }}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center text-slate-400 hover:text-rose-500 cursor-pointer"
                    >
                        <FaTimes size={11} />
                    </button>
                )}
            </div>
            {open && (
                <div className="absolute z-40 left-0 right-0 mt-1 bg-white rounded-xl border border-slate-200 shadow-lg max-h-56 overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="px-3 py-3 text-xs text-slate-400 text-center">{emptyText}</p>
                    ) : (
                        items.map((item) => (
                            <div
                                key={getKey(item)}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    onSelect(item);
                                    setOpen(false);
                                }}
                                className="px-3 py-2.5 cursor-pointer hover:bg-brand-50 border-b border-slate-100 last:border-none"
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

// Mobile e item table gulo card hoye jabe (md er niche), tablet / laptop e table-i thakbe
const PA_LABELS = {
    main: ['', 'Company', 'Buy Price', 'Sell Price', 'Unit Qty', 'PCS Qty', 'Free Unit', 'Free PCS', 'Discount', 'Item Total', ''],
    free: ['', 'Company', 'Unit Qty', 'PCS Qty', 'Total Qty', 'Sell Price (PCS)', 'Item Total', ''],
    ret: ['', 'Company', 'Unit Qty', 'PCS Qty', 'Free Unit', 'Free PCS', 'Buy Price (PCS)', 'Item Total', ''],
};
const PA_SPANS = { main: [1, 2, 11], free: [1, 2, 8], ret: [1, 2, 9] };

export const PurchaseAddStyle = () => {
    const css = Object.keys(PA_LABELS)
        .map(
            (k) =>
                PA_LABELS[k].map((l, i) => (l ? `.pa-${k} td:nth-child(${i + 1})::before{content:"${l}"}` : '')).join('') +
                PA_SPANS[k].map((n) => `.pa-${k} td:nth-child(${n}){grid-column:span 2}`).join('')
        )
        .join('');
    return (
        <style>{`
@media (max-width:767px){
  .pa-cards table{display:block!important;min-width:0!important;width:100%!important}
  .pa-cards colgroup,.pa-cards thead{display:none!important}
  .pa-cards tbody{display:block!important}
  .pa-cards tbody tr{display:grid;grid-template-columns:1fr 1fr;column-gap:10px;margin:0 0 12px;padding:10px 12px;border:1px solid #e2e8f0;border-radius:1rem;background:#fff}
  .pa-cards td{display:block!important;width:auto!important;min-width:0;position:relative;padding:6px 0!important}
  .pa-cards td::before{display:block;font-size:11px;font-weight:600;color:#64748b;margin-bottom:4px}
  .pa-cards td:first-child{font-size:15px}
  .pa-cards td > .absolute{position:static!important;translate:none!important;display:inline-block;margin-bottom:6px}
  .pa-cards td:last-child:not([colspan]){text-align:right}
  ${css}
}
@media (max-width:639px){
  .pa-sum > div{flex-direction:column;align-items:stretch!important;gap:4px}
  .pa-sum > div > label{width:auto!important;text-align:left!important;padding:0!important}
  .pa-sum > div > :not(label){width:100%;flex:none}
}
`}</style>
    );
};

// -----------------------------------------------------
// Chotto reusable input gulo (ei file er bhitore)
// -----------------------------------------------------
const CELL = 'py-3 px-2 align-top';
const CELL_TXT = 'pt-5 pb-3 px-2 align-top';

const MONEY =
    'w-full min-w-0 px-2.5 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';

const MoneyInput = ({ value, onChange, disabled }) => (
    <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        placeholder="0"
        disabled={disabled}
        value={value}
        onChange={(e) => {
            const v = e.target.value;
            if (/^\d*\.?\d{0,2}$/.test(v)) onChange(v);
        }}
        className={`${MONEY} ${NO_SPIN}`}
    />
);

// Qty input + unit chip (ekta box e)
const QtyBox = ({ value, onChange, unit, title, tone = 'brand', sub = false }) => {
    const box =
        tone === 'green'
            ? 'border-emerald-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100'
            : 'border-slate-300 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100';
    const chip = sub
        ? 'bg-slate-100 text-slate-600 border-slate-200'
        : tone === 'green'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-brand-50 text-brand-700 border-brand-100';
    return (
        <div className={`flex items-stretch rounded-xl border bg-white overflow-hidden ${box}`}>
            <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                placeholder="0"
                value={value}
                onChange={(e) => {
                    const v = e.target.value;
                    if (/^\d*$/.test(v)) onChange(v);
                }}
                className={`w-full min-w-0 px-2 py-2 bg-transparent text-sm text-center outline-none ${NO_SPIN}`}
            />
            <span title={title} className={`shrink-0 max-w-[48%] truncate px-2 flex items-center border-l text-xs font-semibold select-none ${chip}`}>
                {unit}
            </span>
        </div>
    );
};

const DeleteBtn = ({ onClick }) => (
    <button
        type="button"
        aria-label="Remove"
        onClick={onClick}
        className="w-9 h-9 inline-flex items-center justify-center rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
    >
        <TrashIcon />
    </button>
);

const EmptyBox = ({ text }) => (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 py-10 px-4 text-center text-sm text-slate-400">
        {text}
    </div>
);

// =====================================================
// MAIN PURCHASE TABLE
// =====================================================
export const MainTableSection = ({ c }) => {
    const {
        purchaseItems,
        roundTo2,
        isReceiveMode,
        isReceivedEdit,
        handleItemChange,
        handleToggleDiscountType,
        handleRemoveItem,
    } = c;

    if (purchaseItems.length === 0) {
        return <EmptyBox text="No products added yet. Please select a company and product above." />;
    }

    return (
        <div className="pa-cards pa-main rounded-2xl md:border border-slate-200 overflow-x-auto">
            <table className="w-full min-w-[1120px] table-fixed text-left border-collapse">
                <colgroup>
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '4%' }} />
                </colgroup>

                <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <th className="py-3 px-2">Product Name</th>
                        <th className="py-3 px-2">Company</th>
                        <th className="py-3 px-2">Buy Price</th>
                        <th className="py-3 px-2">Sell Price</th>
                        <th className="py-3 px-2">Unit Qty</th>
                        <th className="py-3 px-2">PCS Qty</th>
                        <th className="py-3 px-2">Free Unit</th>
                        <th className="py-3 px-2">Free PCS</th>
                        <th className="py-3 px-2">Discount</th>
                        <th className="py-3 px-2">Item Total</th>
                        <th className="py-3 px-1 text-center"><span className="sr-only">Action</span></th>
                    </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 text-sm">
                    {purchaseItems.map((item) => {
                        // Row Subtotal
                        const rowGrossTotal = (Number(item.buyPrice) || 0) * (Number(item.totalQty) || 0);

                        const rowEffectiveDiscount =
                            item.discountType === 'percent'
                                ? roundTo2((rowGrossTotal * (Number(item.discount) || 0)) / 100)
                                : roundTo2(Number(item.discount) || 0);

                        const rowDiscountPercent =
                            item.discountType === 'amount'
                                ? (rowGrossTotal > 0 ? roundTo2(((Number(item.discount) || 0) / rowGrossTotal) * 100) : 0)
                                : 0;

                        const rowSubtotal = roundTo2(rowGrossTotal - rowEffectiveDiscount);
                        const currentUnitLabel = item.unit || 'Pcs';
                        const hintValue = item.discountType === 'percent' ? rowEffectiveDiscount : rowDiscountPercent;

                        return (
                            <tr key={item.uniqueId} className="hover:bg-slate-50/70 transition-colors">
                                {/* Product Name */}
                                <td className={`${CELL_TXT} font-semibold text-slate-800 break-words`}>{item.productName}</td>

                                {/* Company */}
                                <td className={`${CELL_TXT} text-slate-600 break-words`}>{item.company}</td>

                                {/* Buy Price */}
                                <td className={CELL}>
                                    <MoneyInput value={item.buyPrice} onChange={(v) => handleItemChange(item.uniqueId, 'buyPrice', v)} />
                                </td>

                                {/* Sell Price */}
                                <td className={CELL}>
                                    <MoneyInput value={item.sellPrice} onChange={(v) => handleItemChange(item.uniqueId, 'sellPrice', v)} />
                                </td>

                                {/* Unit Qty */}
                                <td className={CELL}>
                                    <div className="space-y-1.5">
                                        <QtyBox
                                            value={item.unitQty}
                                            unit={currentUnitLabel}
                                            title="Unit"
                                            onChange={(v) => handleItemChange(item.uniqueId, 'unitQty', v)}
                                        />
                                        {item.parentMode && (
                                            <QtyBox
                                                sub
                                                value={item.subQty ?? ''}
                                                unit={item.subUnit}
                                                title="Sub Unit"
                                                onChange={(v) => handleItemChange(item.uniqueId, 'subQty', v)}
                                            />
                                        )}
                                    </div>
                                    <p className={`mt-1.5 text-[11px] font-semibold ${Number(item.totalQty) > 0 ? 'text-brand-700' : 'text-slate-400'}`}>
                                        Total: {item.totalQty}
                                        {(isReceiveMode || isReceivedEdit) && item.orderQty > 0 ? ` (Order: ${item.orderQty})` : ''}
                                    </p>
                                </td>

                                {/* PCS Qty */}
                                <td className={CELL}>
                                    <QtyBox
                                        value={item.pcsQty}
                                        unit="Pcs"
                                        title="Pcs"
                                        onChange={(v) => handleItemChange(item.uniqueId, 'pcsQty', v)}
                                    />
                                </td>

                                {/* Free Unit Qty */}
                                <td className={CELL}>
                                    <div className="space-y-1.5">
                                        <QtyBox
                                            tone="green"
                                            value={item.freeUnitQty}
                                            unit={currentUnitLabel}
                                            title="Unit"
                                            onChange={(v) => handleItemChange(item.uniqueId, 'freeUnitQty', v)}
                                        />
                                        {item.parentMode && (
                                            <QtyBox
                                                tone="green"
                                                sub
                                                value={item.freeSubQty ?? ''}
                                                unit={item.subUnit}
                                                title="Sub Unit"
                                                onChange={(v) => handleItemChange(item.uniqueId, 'freeSubQty', v)}
                                            />
                                        )}
                                    </div>
                                    <p className={`mt-1.5 text-[11px] font-semibold ${Number(item.freeQty) > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                        Total: {item.freeQty}
                                    </p>
                                </td>

                                {/* Free PCS Qty */}
                                <td className={CELL}>
                                    <QtyBox
                                        tone="green"
                                        value={item.freePcsQty}
                                        unit="Pcs"
                                        title="Pcs"
                                        onChange={(v) => handleItemChange(item.uniqueId, 'freePcsQty', v)}
                                    />
                                </td>

                                {/* Discount */}
                                <td className={CELL}>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => handleToggleDiscountType(item.uniqueId)}
                                            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold cursor-pointer"
                                            title="Click to toggle Amount / Percentage"
                                            aria-label="Toggle discount type"
                                        >
                                            {item.discountType === 'percent' ? '%' : '৳'}
                                        </button>
                                        <MoneyInput
                                            value={item.discount === 0 ? '' : item.discount}
                                            onChange={(v) => handleItemChange(item.uniqueId, 'discount', v)}
                                        />
                                    </div>
                                    <p className={`mt-1.5 text-[11px] font-semibold ${hintValue ? 'text-amber-700' : 'text-slate-400'}`}>
                                        {item.discountType === 'percent'
                                            ? `৳${rowEffectiveDiscount.toFixed(2)}`
                                            : `${rowDiscountPercent.toFixed(2)}%`}
                                    </p>
                                </td>

                                {/* Row Subtotal */}
                                <td className={`${CELL_TXT} font-bold text-emerald-700 tabular-nums`}>{rowSubtotal.toFixed(2)}</td>

                                {/* Action */}
                                <td className={`${CELL} px-0.5 text-center`}>
                                    <DeleteBtn onClick={() => handleRemoveItem(item.uniqueId)} />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// =====================================================
// SUMMARY SECTION
// =====================================================
const GROUP =
    'flex rounded-xl overflow-hidden border border-slate-300 bg-white focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100';
const GROUP_RO = 'flex rounded-xl overflow-hidden border border-slate-200 bg-slate-100';
const IN = 'flex-1 min-w-0 px-3 py-2 bg-transparent text-sm outline-none';
const SIDE_RO = 'w-24 shrink-0 px-3 py-2 border-l border-slate-200 bg-slate-100 text-sm text-slate-600 outline-none cursor-default';
const RO = 'w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-700 outline-none cursor-default';

const SumRow = ({ label, tone = 'text-slate-600', bold = false, children }) => (
    <div className="grid grid-cols-1 sm:grid-cols-[11rem_minmax(0,1fr)] gap-1 sm:gap-3 sm:items-center">
        <span className={`sm:text-right text-xs sm:text-sm ${bold ? 'font-bold' : 'font-medium'} ${tone}`}>{label}</span>
        <div className="min-w-0">{children}</div>
    </div>
);

export const SummarySection = ({ c }) => {
    const {
        subTotal,
        productWiseDiscount,
        productWiseDiscountPercent,
        overallDiscountAmount,
        setOverallDiscountAmount,
        overallDiscountType,
        setOverallDiscountType,
        overallDiscountValue,
        overallDiscountPercent,
        adjustmentText,
        setAdjustmentText,
        adjustmentAmount,
        setAdjustmentAmount,
        adjustmentType,
        setAdjustmentType,
        addReturnToAdjustment,
        returnTotalValue,
        addDamageToAdjustment,
        damageTotalValue,
        prevBalance,
        usePrevBalance,
        setUsePrevBalance,
        purchaseFormData,
        payableAmount,
    } = c;

    return (
        <div className="mt-6 flex justify-end">
            <div className="w-full md:max-w-[720px] space-y-3 bg-brand-50/50 border border-slate-200 rounded-2xl p-3 sm:p-5">
                {/* Grand Total */}
                <SumRow label="Subtotal">
                    <input type="text" readOnly value={subTotal.toFixed(2)} className={RO} />
                </SumRow>

                {/* Product Wise Discount */}
                <SumRow label="Product Wise Discount">
                    <div className={GROUP_RO}>
                        <input type="text" readOnly value={productWiseDiscount.toFixed(2)} className={`${IN} cursor-default`} />
                        <input
                            type="text"
                            readOnly
                            value={productWiseDiscountPercent ? `${productWiseDiscountPercent.toFixed(2)}%` : ''}
                            placeholder="0%"
                            title="Grand Total এর তুলনায় Discount percentage"
                            className={SIDE_RO}
                        />
                    </div>
                </SumRow>

                {/* Overall Discount */}
                <SumRow label="Overall Discount">
                    <div className={GROUP}>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0"
                            value={overallDiscountAmount === 0 ? '' : overallDiscountAmount}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                    setOverallDiscountAmount(value === '' ? '' : Number(value));
                                }
                            }}
                            className={`${IN} ${NO_SPIN}`}
                        />

                        {overallDiscountType === 'percent' ? (
                            <input
                                type="text"
                                readOnly
                                value={overallDiscountValue ? overallDiscountValue.toFixed(2) : ''}
                                placeholder="৳0.00"
                                title="Discount amount in Taka"
                                className={SIDE_RO}
                            />
                        ) : (
                            <input
                                type="text"
                                readOnly
                                value={overallDiscountPercent ? `${overallDiscountPercent.toFixed(2)}%` : ''}
                                placeholder="0%"
                                title="Discount percentage"
                                className={SIDE_RO}
                            />
                        )}

                        <button
                            type="button"
                            onClick={() => setOverallDiscountType((prev) => (prev === 'amount' ? 'percent' : 'amount'))}
                            className="w-14 shrink-0 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold cursor-pointer"
                            title="Click to toggle Amount / Percentage"
                            aria-label="Toggle discount type"
                        >
                            {overallDiscountType === 'percent' ? '%' : '৳'}
                        </button>
                    </div>
                </SumRow>

                {/* Adjustment */}
                <SumRow label="Adjustment">
                    <div className={GROUP}>
                        <input
                            type="text"
                            placeholder="Text"
                            value={adjustmentText}
                            onChange={(e) => setAdjustmentText(e.target.value)}
                            className={IN}
                        />
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="0"
                            value={adjustmentAmount === 0 ? '' : adjustmentAmount}
                            onChange={(e) => {
                                const value = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(value)) {
                                    setAdjustmentAmount(value === '' ? '' : Number(value));
                                }
                            }}
                            className={`w-24 shrink-0 px-3 py-2 border-l border-slate-200 bg-transparent text-sm outline-none ${NO_SPIN}`}
                        />
                        <select
                            value={adjustmentType}
                            onChange={(e) => setAdjustmentType(e.target.value)}
                            className="w-16 shrink-0 px-2 py-2 border-l border-slate-200 bg-white text-sm font-semibold outline-none cursor-pointer"
                        >
                            <option value="+">+</option>
                            <option value="-">-</option>
                        </select>
                    </div>
                </SumRow>

                {/* Return Amount (Toggle On হলে দেখাবে) */}
                {addReturnToAdjustment && returnTotalValue > 0 && (
                    <SumRow label="Return Products Amount" tone="text-violet-600">
                        <input
                            type="text"
                            readOnly
                            value={`- ৳${returnTotalValue.toFixed(2)}`}
                            className="w-full px-3 py-2 rounded-xl border border-violet-200 bg-violet-50 text-violet-700 font-semibold text-sm outline-none cursor-default"
                        />
                    </SumRow>
                )}

                {/* Damage Amount (Toggle On হলে দেখাবে) */}
                {addDamageToAdjustment && damageTotalValue > 0 && (
                    <SumRow label="Damage Products Amount" tone="text-red-600">
                        <input
                            type="text"
                            readOnly
                            value={`- ৳${damageTotalValue.toFixed(2)}`}
                            className="w-full px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 font-semibold text-sm outline-none cursor-default"
                        />
                    </SumRow>
                )}

                {/* Previous Due / Get */}
                <SumRow
                    label={
                        prevBalance.type === 'Due'
                            ? 'Previous Due'
                            : prevBalance.type === 'Get'
                                ? 'Previous Get'
                                : 'Previous Due / Get'
                    }
                    tone={prevBalance.type === 'Due' ? 'text-rose-600' : prevBalance.type === 'Get' ? 'text-sky-600' : 'text-slate-500'}
                >
                    {prevBalance.amount > 0 ? (
                        <div className="flex items-center gap-2.5">
                            <input
                                type="checkbox"
                                checked={usePrevBalance}
                                onChange={(e) => setUsePrevBalance(e.target.checked)}
                                className={`w-5 h-5 shrink-0 cursor-pointer ${prevBalance.type === 'Due' ? 'accent-rose-600' : 'accent-sky-600'}`}
                            />
                            <input
                                type="text"
                                readOnly
                                value={`${prevBalance.type === 'Due' ? '+' : '-'} ৳${prevBalance.amount.toFixed(2)}`}
                                className={`flex-1 min-w-0 px-3 py-2 border rounded-xl text-sm font-semibold outline-none cursor-default ${prevBalance.type === 'Due' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}
                            />
                        </div>
                    ) : (
                        <input
                            type="text"
                            readOnly
                            value={purchaseFormData.company ? 'No Previous Due or Get' : 'Select a company first'}
                            className={`${RO} text-slate-500`}
                        />
                    )}
                </SumRow>

                {/* Payable Amount */}
                <div className="pt-3 mt-1 border-t border-slate-200">
                    <SumRow
                        bold
                        label={payableAmount < 0 ? 'Receivable Amount' : 'Payable Amount'}
                        tone={payableAmount < 0 ? 'text-sky-700' : 'text-slate-900'}
                    >
                        <div className="px-4 py-2.5 rounded-xl border border-brand-200 bg-white text-lg font-extrabold text-emerald-700 tabular-nums">
                            ৳ {Math.abs(payableAmount).toFixed(2)}
                        </div>
                    </SumRow>
                </div>
            </div>
        </div>
    );
};

// =====================================================
// OTHERS FREE PRODUCT
// =====================================================
export const FreeProductSection = ({ c }) => {
    const {
        freeProductOpen,
        setFreeProductOpen,
        freeProductItems,
        freeSearch,
        setFreeSearch,
        handleClearFreeCategory,
        handleSelectFreeCategory,
        filteredFreeCategories,
        filteredFreeProducts,
        handleAddFreeProduct,
        handleFreeItemChange,
        handleRemoveFreeItem,
        getFreePcsTotal,
        getFreeRowTotal,
    } = c;

    return (
        <div className="mt-8">
            <button
                type="button"
                onClick={() => setFreeProductOpen((prev) => !prev)}
                className="w-full sm:w-auto justify-between sm:justify-start flex items-center gap-2 h-11 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-sm font-semibold text-white transition cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                Others Free Product
                {freeProductItems.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">{freeProductItems.length}</span>
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
                <div className="mt-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 sm:p-5">
                    <h3 className="text-base font-bold text-emerald-800 mb-4">Others Free Product</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            renderItem={(cat) => <p className="text-sm font-semibold text-slate-800">{cat.name}</p>}
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
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                                        <p className="text-xs text-slate-500 mt-0.5 break-words">
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
                        <div className="pa-cards pa-free mt-5 overflow-x-auto rounded-2xl md:border border-emerald-200 bg-white">
                            <table className="w-full min-w-[860px] text-left border-collapse">
                                <thead>
                                    <tr className="bg-emerald-100/70 border-b border-emerald-200 text-xs font-semibold text-emerald-800">
                                        <th className="py-3 px-2">Product Name</th>
                                        <th className="py-3 px-2">Company</th>
                                        <th className="py-3 px-2">Unit Qty</th>
                                        <th className="py-3 px-2">PCS Qty</th>
                                        <th className="py-3 px-2">Total Qty</th>
                                        <th className="py-3 px-2">Sell Price (PCS)</th>
                                        <th className="py-3 px-2">Item Total</th>
                                        <th className="py-3 px-1 text-center"><span className="sr-only">Action</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-emerald-100 text-sm">
                                    {freeProductItems.map((item) => (
                                        <tr key={item.uniqueId} className="hover:bg-emerald-50/50 transition-colors">
                                            <td className={`${CELL_TXT} font-semibold text-slate-800 break-words`}>{item.productName}</td>
                                            <td className={`${CELL_TXT} text-slate-600 text-xs break-words`}>{item.company}</td>

                                            {/* Unit Qty */}
                                            <td className={`${CELL} w-44`}>
                                                <div className="space-y-1.5">
                                                    <QtyBox
                                                        tone="green"
                                                        value={item.unitQty}
                                                        unit={item.unit || 'Pcs'}
                                                        title="Unit"
                                                        onChange={(v) => handleFreeItemChange(item.uniqueId, 'unitQty', v)}
                                                    />
                                                    {item.parentMode && (
                                                        <QtyBox
                                                            tone="green"
                                                            sub
                                                            value={item.subQty ?? ''}
                                                            unit={item.subUnit}
                                                            title="Sub Unit"
                                                            onChange={(v) => handleFreeItemChange(item.uniqueId, 'subQty', v)}
                                                        />
                                                    )}
                                                </div>
                                            </td>

                                            {/* PCS Qty */}
                                            <td className={`${CELL} w-32`}>
                                                <QtyBox
                                                    tone="green"
                                                    value={item.pcsQty}
                                                    unit="Pcs"
                                                    title="Pcs"
                                                    onChange={(v) => handleFreeItemChange(item.uniqueId, 'pcsQty', v)}
                                                />
                                            </td>

                                            {/* Total Qty */}
                                            <td className={CELL}>
                                                <div className="px-3 py-2 rounded-xl bg-slate-100 text-sm text-slate-600 tabular-nums">
                                                    {item.totalQty ?? 0}
                                                </div>
                                            </td>

                                            {/* Sell Price */}
                                            <td className={`${CELL} w-36`}>
                                                <MoneyInput
                                                    disabled={!(Number(item.totalQty) > 0)}
                                                    value={item.sellPricePcs}
                                                    onChange={(v) => handleFreeItemChange(item.uniqueId, 'sellPricePcs', v)}
                                                />
                                                <p className={`mt-1.5 text-[11px] font-semibold ${getFreePcsTotal(item) > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                                                    ৳{getFreePcsTotal(item).toFixed(2)}
                                                </p>
                                            </td>

                                            <td className={`${CELL_TXT} font-bold text-emerald-700 whitespace-nowrap tabular-nums`}>
                                                {getFreeRowTotal(item).toFixed(2)}
                                            </td>

                                            <td className={`${CELL} px-0.5 text-center`}>
                                                <DeleteBtn onClick={() => handleRemoveFreeItem(item.uniqueId)} />
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
    );
};