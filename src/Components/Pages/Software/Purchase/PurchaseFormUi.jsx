import React from 'react';
import { inputCls, labelCls } from './PurchaseUi';

export const getAccountKey = (inv) => {
    if (inv.accountType === 'Bank') return `${inv.bankName}-${inv.accountNumber}-${inv.accountBranch}`;
    if (inv.accountType === 'Mobile Banking') return `${inv.accountName}-${inv.accountNumber}`;
    return 'cash';
};

const accLabel = (inv) =>
    inv.accountType === 'Bank'
        ? `${inv.bankName} - ${inv.accountNumber} (${inv.accountBranch})`
        : inv.accountType === 'Mobile Banking'
            ? `${inv.accountName} - ${inv.accountNumber}`
            : 'Cash';

export const Card = ({ title, subtitle, right, children, className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 ${className}`}>
        {(title || right) && (
            <div className="flex flex-wrap items-start justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
                <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-800">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
                {right}
            </div>
        )}
        {children}
    </div>
);

export const QtyField = ({ label, value, onChange, disabled }) => (
    <label className="block min-w-0">
        <span className="block text-[11px] font-medium text-slate-500 mb-1 truncate">{label}</span>
        <input
            type="number"
            inputMode="numeric"
            min="0"
            step="1"
            placeholder="0"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className={`${inputCls} text-center`}
        />
    </label>
);

export const PaymentSection = ({
    returnAmount,
    open,
    setOpen,
    amount,
    setAmount,
    setTouched,
    accountType,
    setAccountType,
    accountKey,
    setAccountKey,
    note,
    setNote,
    investments,
}) => {
    const types = [...new Set(investments.map((i) => i.accountType).filter(Boolean))];
    const map = new Map();
    investments
        .filter((i) => i.accountType === accountType)
        .forEach((i) => {
            const k = getAccountKey(i);
            if (!map.has(k)) map.set(k, i);
        });
    const accounts = [...map.values()];

    return (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-emerald-800">Return Payment</h3>
                    <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
                        Return Amount: ৳{Number(returnAmount).toFixed(2)}
                    </span>
                </div>
                <button
                    type="button"
                    role="switch"
                    aria-checked={open}
                    onClick={() => setOpen(!open)}
                    className="h-10 flex items-center gap-2 text-xs font-semibold text-emerald-700 cursor-pointer"
                >
                    {open ? 'Enabled' : 'Disabled'}
                    <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${open ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                        <span className={`inline-block h-[18px] w-[18px] rounded-full bg-white shadow transition-transform ${open ? 'translate-x-6' : 'translate-x-1'}`} />
                    </span>
                </button>
            </div>

            {open && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelCls}>Payment Amount *</label>
                        <input
                            type="text"
                            inputMode="decimal"
                            value={amount}
                            onChange={(e) => {
                                const v = e.target.value;
                                if (/^\d*\.?\d{0,2}$/.test(v)) {
                                    setAmount(v);
                                    setTouched(true);
                                }
                            }}
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className={labelCls}>Payment Method *</label>
                        <select
                            value={accountType}
                            onChange={(e) => {
                                const v = e.target.value;
                                setAccountType(v);
                                setAccountKey(v && v !== 'Bank' && v !== 'Mobile Banking' ? 'cash' : '');
                            }}
                            className={`${inputCls} cursor-pointer`}
                        >
                            <option value="">Select method...</option>
                            {types.map((t) => (
                                <option key={t} value={t}>{t}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className={labelCls}>Account *</label>
                        <select
                            value={accountKey}
                            onChange={(e) => setAccountKey(e.target.value)}
                            disabled={!accountType}
                            className={`${inputCls} cursor-pointer`}
                        >
                            <option value="">{accountType ? 'Select account...' : 'Select method first'}</option>
                            {accounts.map((inv) => (
                                <option key={getAccountKey(inv)} value={getAccountKey(inv)}>{accLabel(inv)}</option>
                            ))}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                        <label className={labelCls}>Payment Note (Optional)</label>
                        <textarea
                            rows="2"
                            placeholder="Write any note about this payment..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className={`${inputCls} resize-y`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};