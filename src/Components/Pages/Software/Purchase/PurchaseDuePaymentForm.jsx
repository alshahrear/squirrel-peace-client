import React, { useState, useEffect } from 'react';
import { FaBuilding, FaCalendarAlt, FaCreditCard, FaUniversity, FaMoneyBillWave, FaStickyNote } from 'react-icons/fa';
import { DateInput } from '../Product/ProductUi';
import { inputCls, labelCls, ComboField } from './PurchaseUi';

const PurchaseDuePaymentForm = ({
    formData,
    setFormData,
    handleSubmit,
    companies,
    accountTypes,
    uniqueAccounts,
    getAccountKey,
    canPay,
    isSubmitting,
    dueAmount = 0,
}) => {
    const [companySearch, setCompanySearch] = useState(formData.company || '');
    const [useDue, setUseDue] = useState(false);

    // company / type change hole checkbox untick + amount clear
    useEffect(() => {
        setUseDue(false);
        setFormData((prev) => ({ ...prev, amount: '' }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.company, formData.type]);

    // checkbox tick thakle amount box a due amount boshbe
    useEffect(() => {
        if (useDue) setFormData((prev) => ({ ...prev, amount: String(dueAmount) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useDue, dueAmount]);

    const companyChosen = !!formData.company;

    const companyOptions = companies
        .filter((c) => {
            const q = companySearch.trim().toLowerCase();
            if (!q) return true;
            return c.businessName?.toLowerCase().includes(q) || c.contactNumber?.toLowerCase().includes(q);
        })
        .map((c) => ({ key: c._id, title: c.businessName, sub: c.contactNumber || '', raw: c }));

    const handleMethodChange = (e) => {
        const value = e.target.value;
        setFormData((prev) => ({
            ...prev,
            paymentMethod: value,
            accountKey: value && value !== 'Bank' && value !== 'Mobile Banking' ? 'cash' : '',
        }));
    };

    const lbl = 'flex items-center gap-1.5 text-slate-600 text-xs font-medium mb-1';
    const isGet = formData.type === 'Get';

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FaMoneyBillWave className="text-brand-600" /> Add Due Payment
                </h2>
                <div className="inline-flex bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'Pay' }))}
                        className={`h-9 px-5 rounded-lg text-sm font-semibold cursor-pointer ${!isGet ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Pay
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, type: 'Get' }))}
                        className={`h-9 px-5 rounded-lg text-sm font-semibold cursor-pointer ${isGet ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Get
                    </button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Company */}
                <div>
                    <ComboField
                        label="Company Name *"
                        value={companySearch}
                        placeholder="Search or select company..."
                        options={companyOptions}
                        onType={(v) => {
                            setCompanySearch(v);
                            if (formData.company) {
                                setFormData((prev) => ({ ...prev, company: '', companyId: '', companyContact: '' }));
                            }
                        }}
                        onClear={() => {
                            setCompanySearch('');
                            setFormData((prev) => ({ ...prev, company: '', companyId: '', companyContact: '' }));
                        }}
                        onPick={(o) => {
                            setFormData((prev) => ({
                                ...prev,
                                company: o.raw.businessName,
                                companyId: o.raw._id,
                                companyContact: o.raw.contactNumber || '',
                            }));
                            setCompanySearch(o.raw.businessName);
                        }}
                    />
                    {!companyChosen && <p className="text-[11px] text-slate-400 mt-1">Select a company first</p>}
                </div>

                {/* Date */}
                <div>
                    <span className={lbl}><FaCalendarAlt className="text-brand-500" /> Date <span className="text-rose-500">*</span></span>
                    <div className={companyChosen ? '' : 'pointer-events-none opacity-60'}>
                        <DateInput
                            name="date"
                            value={formData.date}
                            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                            placeholder="Select date"
                        />
                    </div>
                </div>

                {/* Method */}
                <div>
                    <label className={lbl}><FaCreditCard className="text-brand-500" /> Payment Method <span className="text-rose-500">*</span></label>
                    <select value={formData.paymentMethod} onChange={handleMethodChange} disabled={!companyChosen} className={`${inputCls} cursor-pointer`}>
                        <option value="">Select method...</option>
                        {accountTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                </div>

                {/* Account */}
                <div>
                    <label className={lbl}><FaUniversity className="text-brand-500" /> Payment Account <span className="text-rose-500">*</span></label>
                    <select
                        value={formData.accountKey}
                        onChange={(e) => setFormData((prev) => ({ ...prev, accountKey: e.target.value }))}
                        disabled={!companyChosen || !formData.paymentMethod}
                        className={`${inputCls} cursor-pointer`}
                    >
                        <option value="">{formData.paymentMethod ? 'Select account...' : 'Select method first'}</option>
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

                {/* Amount */}
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-x-2 mb-1">
                        <span className="flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                            <FaMoneyBillWave className="text-brand-500" /> Amount <span className="text-rose-500">*</span>
                        </span>
                        <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={useDue}
                                disabled={!companyChosen || dueAmount <= 0}
                                onChange={(e) => {
                                    const checked = e.target.checked;
                                    setUseDue(checked);
                                    if (!checked) setFormData((prev) => ({ ...prev, amount: '' }));
                                }}
                                className="w-4 h-4 accent-brand-600 cursor-pointer disabled:cursor-not-allowed"
                            />
                            {isGet ? 'Get' : 'Due'}: ৳ {Number(dueAmount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}
                        </label>
                    </div>
                    <input
                        type="text"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={formData.amount}
                        readOnly={useDue}
                        disabled={!companyChosen}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (/^\d*\.?\d{0,2}$/.test(value)) {
                                setFormData((prev) => ({ ...prev, amount: value }));
                            }
                        }}
                        className={inputCls}
                    />
                </div>

                {/* Note */}
                <div>
                    <label className={lbl}><FaStickyNote className="text-brand-500" /> Note</label>
                    <input
                        type="text"
                        placeholder="Write additional notes here..."
                        value={formData.note}
                        disabled={!companyChosen}
                        onChange={(e) => setFormData((prev) => ({ ...prev, note: e.target.value }))}
                        className={inputCls}
                    />
                </div>

                <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-1">
                    <button
                        type="submit"
                        disabled={!canPay || isSubmitting}
                        className="bg-brand-600 text-white text-sm font-semibold px-8 py-2.5 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        {isGet ? (isSubmitting ? 'Saving...' : 'Get') : isSubmitting ? 'Paying...' : 'Pay'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PurchaseDuePaymentForm;