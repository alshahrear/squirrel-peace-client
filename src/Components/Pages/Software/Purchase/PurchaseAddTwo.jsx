import React from 'react';
import { SearchSelect, TrashIcon } from './PurchaseAddOne';
import { inputCls, labelCls } from './PurchaseUi';
import { DateInput } from '../Product/ProductUi';
import { labelToISO } from './purchaseDate';

// =====================================================
// Chotto reusable gulo (PurchaseAddOne er design er shathe mil rekhe)
// Mobile card CSS (.pa-cards .pa-ret) PurchaseAddStyle e already ache
// =====================================================
const NO_SPIN = '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none';
const CELL = 'py-3 px-2 align-top';
const CELL_TXT = 'pt-5 pb-3 px-2 align-top';

const MONEY =
    'w-full min-w-0 px-2.5 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed';

const MoneyInput = ({ value, onChange }) => (
    <input
        type="number"
        min="0"
        step="0.01"
        inputMode="decimal"
        placeholder="0"
        value={value}
        onChange={(e) => {
            const v = e.target.value;
            if (/^\d*\.?\d{0,2}$/.test(v)) onChange(v);
        }}
        className={`${MONEY} ${NO_SPIN}`}
    />
);

// Tone gulo full class name hishebe lekha, jate Tailwind chinte pare
const TONES = {
    violet: {
        btn: 'bg-violet-600 hover:bg-violet-700',
        panel: 'bg-violet-50/50 border-violet-100',
        title: 'text-violet-800',
        sub: 'text-violet-700',
        on: 'bg-violet-500',
        pill: 'bg-violet-100 text-violet-700 border-violet-200',
        wrap: 'border-violet-200',
        head: 'bg-violet-100/70 border-violet-200 text-violet-800',
        divide: 'divide-violet-100',
        hover: 'hover:bg-violet-50/50',
        text: 'text-violet-700',
        qty: {
            box: 'border-violet-200 focus-within:border-violet-500 focus-within:ring-2 focus-within:ring-violet-100',
            chip: 'bg-violet-50 text-violet-700 border-violet-100',
        },
    },
    red: {
        btn: 'bg-rose-600 hover:bg-rose-700',
        panel: 'bg-red-50/50 border-red-100',
        title: 'text-red-800',
        sub: 'text-red-700',
        on: 'bg-red-500',
        pill: 'bg-red-100 text-red-700 border-red-200',
        wrap: 'border-red-200',
        head: 'bg-red-100/70 border-red-200 text-red-800',
        divide: 'divide-red-100',
        hover: 'hover:bg-red-50/50',
        text: 'text-red-700',
        qty: {
            box: 'border-red-200 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100',
            chip: 'bg-red-50 text-red-700 border-red-100',
        },
    },
};

const FREE_QTY = {
    box: 'border-emerald-200 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

// Qty input + unit chip (ekta box e)
const QtyBox = ({ value, onChange, unit, title, palette, sub = false }) => {
    const chip = sub ? 'bg-slate-100 text-slate-600 border-slate-200' : palette.chip;
    return (
        <div className={`flex items-stretch rounded-xl border bg-white overflow-hidden ${palette.box}`}>
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

// Total + Stock line (stock er beshi dile lal hoye jabe)
const QtyInfo = ({ total, stock, okCls }) => {
    const t = Number(total) || 0;
    const known = stock !== undefined && stock !== null;
    const over = known && t > Number(stock);
    return (
        <p className={`mt-1.5 text-[11px] font-semibold ${over ? 'text-rose-600' : t > 0 ? okCls : 'text-slate-400'}`}>
            Total: {total ?? 0} | Stock: {known ? stock : '...'}
            {over ? ' (Over stock)' : ''}
        </p>
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

const Switch = ({ on, onClick, onCls }) => (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="h-10 flex items-center cursor-pointer">
        <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${on ? onCls : 'bg-slate-300'}`}>
            <span className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
    </button>
);

// =====================================================
// Return ar Damage dutor table ek-i design, tai ekta shared component
// =====================================================
const AdjustRow = ({ item, t, stock, onChange, onRemove, rowTotal }) => {
    const set = (field) => (v) => onChange(item.uniqueId, field, v);
    return (
        <tr className={`${t.hover} transition-colors`}>
            {/* Product Name */}
            <td className={`${CELL_TXT} font-semibold text-slate-800 break-words`}>{item.productName}</td>

            {/* Company */}
            <td className={`${CELL_TXT} text-slate-600 text-xs break-words`}>{item.company}</td>

            {/* Unit Qty */}
            <td className={CELL}>
                <div className="space-y-1.5">
                    <QtyBox palette={t.qty} value={item.unitQty} unit={item.unit || 'Pcs'} title="Unit" onChange={set('unitQty')} />
                    {item.parentMode && (
                        <QtyBox sub palette={t.qty} value={item.subQty ?? ''} unit={item.subUnit} title="Sub Unit" onChange={set('subQty')} />
                    )}
                </div>
                <QtyInfo total={item.totalQty} stock={stock?.paid} okCls={t.text} />
            </td>

            {/* PCS Qty */}
            <td className={CELL}>
                <QtyBox palette={t.qty} value={item.pcsQty} unit="Pcs" title="Pcs" onChange={set('pcsQty')} />
            </td>

            {/* Free Unit */}
            <td className={CELL}>
                <div className="space-y-1.5">
                    <QtyBox palette={FREE_QTY} value={item.freeUnitQty} unit={item.unit || 'Pcs'} title="Unit" onChange={set('freeUnitQty')} />
                    {item.parentMode && (
                        <QtyBox sub palette={FREE_QTY} value={item.freeSubQty ?? ''} unit={item.subUnit} title="Sub Unit" onChange={set('freeSubQty')} />
                    )}
                </div>
                <QtyInfo total={item.freeQty} stock={stock?.free} okCls="text-emerald-700" />
            </td>

            {/* Free PCS */}
            <td className={CELL}>
                <QtyBox palette={FREE_QTY} value={item.freePcsQty} unit="Pcs" title="Pcs" onChange={set('freePcsQty')} />
            </td>

            {/* Buy Price */}
            <td className={CELL}>
                <MoneyInput value={item.buyPrice} onChange={set('buyPrice')} />
            </td>

            {/* Item Total */}
            <td className={`${CELL_TXT} font-bold text-emerald-700 whitespace-nowrap tabular-nums`}>{rowTotal.toFixed(2)}</td>

            {/* Action */}
            <td className={`${CELL} px-0.5 text-center`}>
                <DeleteBtn onClick={() => onRemove(item.uniqueId)} />
            </td>
        </tr>
    );
};

const AdjustBlock = ({
    t,
    title,
    iconPath,
    open,
    setOpen,
    enabled,
    disabledTip,
    items,
    toAdjust,
    setToAdjust,
    adjustLabel,
    totalValue,
    categorySearch,
    setCategorySearch,
    onClearCategory,
    onSelectCategory,
    categories,
    productLabel,
    productPlaceholder,
    productSearch,
    setProductSearch,
    products,
    productEmpty,
    getProductKey,
    onAddProduct,
    renderProduct,
    getStock,
    onItemChange,
    onItemRemove,
    getRowTotal,
}) => (
    <div className="mt-8">
        <button
            type="button"
            disabled={!enabled}
            title={!enabled ? disabledTip : ''}
            aria-expanded={open && enabled}
            onClick={() => enabled && setOpen((prev) => !prev)}
            className={`w-full sm:w-auto justify-between sm:justify-start flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-semibold text-white transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${t.btn}`}
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
            </svg>
            {title}
            {items.length > 0 && <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">{items.length}</span>}
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className={`w-4 h-4 transition-transform duration-200 ${open && enabled ? 'rotate-180' : ''}`}
            >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
        </button>

        {/* Mobile e hover tooltip nai, tai karon ta likhe dewa */}
        {!enabled && disabledTip && <p className="mt-1.5 text-[11px] text-slate-400">{disabledTip}</p>}

        {open && enabled && (
            <div className={`mt-4 border rounded-2xl p-3 sm:p-5 ${t.panel}`}>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 mb-3">
                    <h3 className={`text-base font-bold ${t.title}`}>{title}</h3>
                    {items.length > 0 && (
                        <span className={`px-3.5 py-1 rounded-full border text-sm font-bold tabular-nums ${t.pill}`}>
                            Total Value: ৳{totalValue.toFixed(2)}
                        </span>
                    )}
                </div>

                {/* Adjustment toggle */}
                <div className={`mb-4 flex items-center justify-between gap-3 rounded-xl border bg-white/70 px-3 ${t.wrap}`}>
                    <span className={`text-xs sm:text-sm font-semibold ${t.sub}`}>{adjustLabel}</span>
                    <Switch on={toAdjust} onCls={t.on} onClick={() => setToAdjust((prev) => !prev)} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SearchSelect
                        label="Filter by Category"
                        placeholder="Search or select category..."
                        searchValue={categorySearch}
                        onSearchChange={setCategorySearch}
                        onClear={onClearCategory}
                        onSelect={onSelectCategory}
                        items={categories}
                        getKey={(cat) => cat._id}
                        emptyText="No active category found"
                        renderItem={(cat) => <p className="text-sm font-semibold text-slate-800">{cat.name}</p>}
                    />

                    <SearchSelect
                        label={productLabel}
                        placeholder={productPlaceholder}
                        searchValue={productSearch}
                        onSearchChange={setProductSearch}
                        onClear={() => setProductSearch('')}
                        onSelect={onAddProduct}
                        items={products}
                        getKey={getProductKey}
                        emptyText={productEmpty}
                        renderItem={renderProduct}
                    />
                </div>

                {items.length > 0 ? (
                    <div className={`pa-cards pa-ret mt-5 overflow-x-auto rounded-2xl md:border md:bg-white ${t.wrap}`}>
                        <table className="w-full min-w-[1100px] table-fixed text-left border-collapse">
                            <colgroup>
                                <col style={{ width: '15%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '14%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '14%' }} />
                                <col style={{ width: '10%' }} />
                                <col style={{ width: '11%' }} />
                                <col style={{ width: '11%' }} />
                                <col style={{ width: '5%' }} />
                            </colgroup>
                            <thead>
                                <tr className={`border-b text-xs font-semibold ${t.head}`}>
                                    <th className="py-3 px-2">Product Name</th>
                                    <th className="py-3 px-2">Company</th>
                                    <th className="py-3 px-2">Unit Qty</th>
                                    <th className="py-3 px-2">PCS Qty</th>
                                    <th className="py-3 px-2">Free Unit</th>
                                    <th className="py-3 px-2">Free PCS</th>
                                    <th className="py-3 px-2">Buy Price (PCS)</th>
                                    <th className="py-3 px-2">Item Total</th>
                                    <th className="py-3 px-1 text-center"><span className="sr-only">Action</span></th>
                                </tr>
                            </thead>
                            <tbody className={`divide-y text-sm ${t.divide}`}>
                                {items.map((item) => (
                                    <AdjustRow
                                        key={item.uniqueId}
                                        item={item}
                                        t={t}
                                        stock={getStock(item)}
                                        onChange={onItemChange}
                                        onRemove={onItemRemove}
                                        rowTotal={getRowTotal(item)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white/60 py-8 px-4 text-center text-sm text-slate-400">
                        No product added yet. Select a product above.
                    </div>
                )}
            </div>
        )}
    </div>
);

// =====================================================
// PURCHASE BULK RETURN
// =====================================================
export const ReturnSection = ({ c }) => {
    const {
        returnProductOpen,
        setReturnProductOpen,
        hasMainProduct,
        disabledTip,
        returnItems,
        addReturnToAdjustment,
        setAddReturnToAdjustment,
        returnTotalValue,
        returnSearch,
        setReturnSearch,
        handleClearReturnCategory,
        handleSelectReturnCategory,
        filteredReturnCategories,
        filteredReturnProducts,
        purchaseFormData,
        handleAddReturnProduct,
        handleReturnItemChange,
        handleRemoveReturnItem,
        getStock,
        getReturnRowTotal,
    } = c;

    const t = TONES.violet;
    const hasCompany = !!purchaseFormData.company;

    return (
        <AdjustBlock
            t={t}
            title="Purchase Bulk Return"
            iconPath="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
            open={returnProductOpen}
            setOpen={setReturnProductOpen}
            enabled={hasMainProduct}
            disabledTip={disabledTip}
            items={returnItems}
            toAdjust={addReturnToAdjustment}
            setToAdjust={setAddReturnToAdjustment}
            adjustLabel="Add to the Return Adjustment"
            totalValue={returnTotalValue}
            categorySearch={returnSearch.category}
            setCategorySearch={(text) => setReturnSearch((prev) => ({ ...prev, category: text }))}
            onClearCategory={handleClearReturnCategory}
            onSelectCategory={handleSelectReturnCategory}
            categories={filteredReturnCategories}
            productLabel="Select Return Product"
            productPlaceholder={hasCompany ? 'Search or select product...' : 'Select a company first...'}
            productSearch={returnSearch.product}
            setProductSearch={(text) => setReturnSearch((prev) => ({ ...prev, product: text }))}
            products={filteredReturnProducts}
            productEmpty={hasCompany ? 'No matching product found' : 'Please select a company first'}
            getProductKey={(prod) => prod._id}
            onAddProduct={handleAddReturnProduct}
            renderProduct={(prod) => (
                <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{prod.productName}</p>
                        <p className="text-xs text-slate-500 mt-0.5 break-words">
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
            getStock={getStock}
            onItemChange={handleReturnItemChange}
            onItemRemove={handleRemoveReturnItem}
            getRowTotal={getReturnRowTotal}
        />
    );
};

// =====================================================
// DAMAGE PRODUCT
// =====================================================
export const DamageSection = ({ c }) => {
    const {
        damageProductOpen,
        setDamageProductOpen,
        hasMainProduct,
        disabledTip,
        damageItems,
        addDamageToAdjustment,
        setAddDamageToAdjustment,
        damageTotalValue,
        damageSearch,
        setDamageSearch,
        handleClearDamageCategory,
        handleSelectDamageCategory,
        filteredDamageCategories,
        filteredDamageProducts,
        purchaseFormData,
        handleAddDamageProduct,
        handleDamageItemChange,
        handleRemoveDamageItem,
        getDamageStock,
        getDamageRowTotal,
    } = c;

    const t = TONES.red;
    const hasCompany = !!purchaseFormData.company;

    return (
        <AdjustBlock
            t={t}
            title="Damage Product"
            iconPath="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            open={damageProductOpen}
            setOpen={setDamageProductOpen}
            enabled={hasMainProduct}
            disabledTip={disabledTip}
            items={damageItems}
            toAdjust={addDamageToAdjustment}
            setToAdjust={setAddDamageToAdjustment}
            adjustLabel="Add to the Damage Adjustment"
            totalValue={damageTotalValue}
            categorySearch={damageSearch.category}
            setCategorySearch={(text) => setDamageSearch((prev) => ({ ...prev, category: text }))}
            onClearCategory={handleClearDamageCategory}
            onSelectCategory={handleSelectDamageCategory}
            categories={filteredDamageCategories}
            productLabel="Select Damage Product"
            productPlaceholder={hasCompany ? 'Search or select product...' : 'Select a company first...'}
            productSearch={damageSearch.product}
            setProductSearch={(text) => setDamageSearch((prev) => ({ ...prev, product: text }))}
            products={filteredDamageProducts}
            productEmpty={hasCompany ? 'No damage stock found' : 'Please select a company first'}
            getProductKey={(s) => s.key}
            onAddProduct={handleAddDamageProduct}
            renderProduct={(s) => (
                <div className="flex justify-between items-center gap-3">
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">{s.productName}</p>
                        <p className="text-xs text-slate-500 mt-0.5 break-words">Company: {s.company}</p>
                    </div>
                    <span className="text-xs bg-red-50 text-red-700 px-2.5 py-1 rounded-lg font-medium border border-red-100 shrink-0">
                        Main: {s.paid} | Free: {s.free}
                    </span>
                </div>
            )}
            getStock={getDamageStock}
            onItemChange={handleDamageItemChange}
            onItemRemove={handleRemoveDamageItem}
            getRowTotal={getDamageRowTotal}
        />
    );
};

// =====================================================
// ORDER NOTE
// =====================================================
export const OrderNoteSection = ({ c }) => {
    const { orderNote, setOrderNote } = c;

    return (
        <div className="mt-8">
            <label className={labelCls}>Order Note</label>
            <textarea
                rows="3"
                placeholder="Write any note about this purchase..."
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className={`${inputCls} resize-y`}
            />
        </div>
    );
};

// =====================================================
// PAYMENT
// =====================================================
export const PaymentSection = ({ c }) => {
    const {
        showPayment,
        paymentSectionRef,
        isPurchaseStage,
        isReceiveMode,
        isReceivedEdit,
        paymentSkipped,
        setPaymentSkipped,
        paymentAccountType,
        setPaymentAccountType,
        selectedAccountKey,
        setSelectedAccountKey,
        savePaymentMethod,
        setSavePaymentMethod,
        handleSavePaymentToggle,
        persistPaymentMethod,
        handleReceiveDateChange,
        receiveDateValue,
        payableAmount,
        paymentAmount,
        setPaymentAmount,
        setPaymentAmountTouched,
        setPaymentManual,
        accountTypes,
        uniqueAccounts,
        getAccountKey,
        paymentNote,
        setPaymentNote,
    } = c;

    if (!showPayment) return null;

    const withDate = isReceiveMode || isReceivedEdit;
    const receivable = payableAmount < 0;
    const canSave = !!(paymentAccountType && selectedAccountKey);

    const onAmount = (v) => {
        if (/^\d*\.?\d{0,2}$/.test(v)) {
            setPaymentAmount(v);
            setPaymentAmountTouched(true);
            setPaymentManual(true);
        }
    };

    const accountLabel = (inv) =>
        inv.accountType === 'Bank'
            ? `${inv.bankName} - ${inv.accountNumber} (${inv.accountBranch})`
            : inv.accountType === 'Mobile Banking'
                ? `${inv.accountName} - ${inv.accountNumber}`
                : 'Cash';

    return (
        <div ref={paymentSectionRef} className="mt-8 scroll-mt-6 bg-emerald-50/50 border border-emerald-100 rounded-2xl p-3 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 mb-3">
                <div className="flex items-center gap-3">
                    <h3 className="text-base font-bold text-emerald-800">Payment</h3>
                    {isPurchaseStage && (
                        <button
                            type="button"
                            onClick={() => setPaymentSkipped((prev) => !prev)}
                            className={`h-9 px-4 rounded-lg text-xs font-semibold transition cursor-pointer ${paymentSkipped
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                }`}
                        >
                            {paymentSkipped ? 'Undo' : 'Skip'}
                        </button>
                    )}
                </div>

                <label
                    className={`min-h-10 flex items-center gap-2 text-sm font-semibold ${canSave && !paymentSkipped ? 'text-emerald-700 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}
                    title={canSave ? '' : 'আগে Payment Method ও Account select করুন'}
                >
                    <input
                        type="checkbox"
                        checked={savePaymentMethod}
                        disabled={paymentSkipped || !canSave}
                        onChange={(e) => handleSavePaymentToggle(e.target.checked)}
                        className="w-5 h-5 accent-emerald-600 cursor-pointer disabled:cursor-not-allowed"
                    />
                    Save Payment Method
                </label>
            </div>

            <div className={paymentSkipped ? 'opacity-50 pointer-events-none' : ''}>
                <fieldset disabled={paymentSkipped} className="contents">
                    <div className={`grid grid-cols-1 gap-4 ${withDate ? 'sm:grid-cols-2 xl:grid-cols-4' : 'md:grid-cols-3'}`}>
                        {/* Company theke pabo hole ei bar dekhabe */}
                        {receivable && (
                            <div className="col-span-full flex items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5">
                                <span className="text-xs sm:text-sm font-semibold text-sky-700">Receivable Amount</span>
                                <span className="text-base font-extrabold text-sky-700 tabular-nums">৳ {Math.abs(payableAmount).toFixed(2)}</span>
                            </div>
                        )}

                        {/* Receive Date */}
                        {withDate && (
                            <div>
                                <span className={labelCls}>Receive Date <span className="text-rose-500">*</span></span>
                                <DateInput
                                    name="receiveDate"
                                    value={labelToISO(receiveDateValue)}
                                    onChange={handleReceiveDateChange}
                                    placeholder="Select receive date"
                                />
                            </div>
                        )}

                        {/* Payment Amount */}
                        <div>
                            <label className={labelCls}>
                                {receivable ? 'Company Payment' : 'Payment Amount'} <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400 pointer-events-none">৳</span>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    inputMode="decimal"
                                    placeholder="0"
                                    value={paymentAmount}
                                    onChange={(e) => onAmount(e.target.value)}
                                    className={`${inputCls} pl-7 ${NO_SPIN}`}
                                />
                            </div>
                            {receivable && <p className="text-[11px] text-slate-500 mt-1">How much the company gave you</p>}
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className={labelCls}>
                                Payment Method <span className="text-rose-500">*</span>
                            </label>
                            <select
                                value={paymentAccountType}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setPaymentAccountType(v);
                                    setSelectedAccountKey(v && v !== 'Bank' && v !== 'Mobile Banking' ? 'cash' : '');
                                    if (savePaymentMethod) {
                                        setSavePaymentMethod(false);
                                        persistPaymentMethod(false, '', '');
                                    }
                                }}
                                className={`${inputCls} cursor-pointer`}
                            >
                                <option value="">Select method...</option>
                                {accountTypes.map((type) => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>

                        {/* Account */}
                        <div>
                            <label className={labelCls}>
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
                                className={`${inputCls} cursor-pointer`}
                            >
                                <option value="">{paymentAccountType ? 'Select account...' : 'Select method first'}</option>
                                {uniqueAccounts.map((inv) => {
                                    const key = getAccountKey(inv);
                                    return <option key={key} value={key}>{accountLabel(inv)}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                </fieldset>
            </div>

            {/* Payment Note (Optional) - Skip korleo edit kora jabe */}
            <div className="mt-4">
                <label className={labelCls}>
                    Payment Note <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                    rows="2"
                    placeholder="Write any note about this payment..."
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    className={`${inputCls} resize-y`}
                />
            </div>
        </div>
    );
};