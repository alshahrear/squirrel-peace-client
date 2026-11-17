import React from 'react';
import { LedgerTable, MethodPill, GetPayPill, fmt } from '../LedgerUi';

const MOBILE_STRIPE = { Get: 'bg-sky-500', Pay: 'bg-rose-500' };

const formatDateOnly = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date)) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const COLUMNS = [
    { key: 'company', label: 'Company', cls: 'font-bold text-slate-900', cell: (r) => r.company },
    { key: 'date', label: 'Date', cell: (r) => formatDateOnly(r.date) || 'N/A' },
    { key: 'inv', label: 'Invoice', cls: 'font-medium text-slate-600', cell: (r) => r.invoiceNo || 'N/A' },
    { key: 'method', label: 'Payment Method', cell: (r) => <MethodPill>{r.method}</MethodPill> },
    {
        key: 'account',
        label: 'Payment Account',
        cell: (r) => r.account || <span className="text-slate-400 italic">N/A</span>,
    },
    { key: 'amount', label: 'Amount', cls: 'font-semibold text-emerald-600', cell: (r) => `৳ ${fmt(r.total)}` },
    { key: 'status', label: 'Status', cell: (r) => <GetPayPill status={r.status} /> },
];

const CompanyDuePayAc = ({ rows = [], loading = false }) => (
    <>
        {/* Mobile compact cards */}
        <div className="md:hidden p-1.5 space-y-1.5">
            {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading...</div>
            ) : rows.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No records found for this company!</div>
            ) : (
                rows.map((r) => (
                    <div
                        key={r.key}
                        className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-1.5 shadow-sm"
                    >
                        <span className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${MOBILE_STRIPE[r.status] || 'bg-emerald-500'}`} />
                        <div className="flex items-stretch gap-2">
                            <div className="min-w-0 flex-1 flex flex-col justify-between gap-0.5">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <span className="shrink-0 bg-slate-100 text-slate-700 px-1.5 py-px rounded-full text-[11px] font-bold leading-tight">
                                        #{r.invoiceNo || 'N/A'}
                                    </span>
                                    {r.method && <MethodPill>{r.method}</MethodPill>}
                                </div>
                                <p className="text-[11px] font-bold text-slate-800 leading-snug truncate">{r.company}</p>
                                <p className="text-[10.5px] text-slate-500 leading-snug">
                                    <span className="uppercase text-slate-400 font-bold">Date: </span>
                                    {formatDateOnly(r.date) || 'N/A'}
                                </p>
                                <p className="text-[10.5px] text-slate-500 leading-snug break-words">
                                    <span className="uppercase text-slate-400 font-bold">AC: </span>
                                    {r.account || <span className="text-slate-400 italic">N/A</span>}
                                </p>
                            </div>
                            <div className="shrink-0 w-[108px] flex flex-col justify-center gap-1">
                                <div className="flex items-center justify-between rounded-md bg-slate-50 px-1.5 py-px">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Amount</span>
                                    <span className="text-[10.5px] font-bold whitespace-nowrap text-emerald-600">৳{fmt(r.total)}</span>
                                </div>
                                <div className="flex items-center justify-center">
                                    <GetPayPill status={r.status} />
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block">
            <LedgerTable columns={COLUMNS} rows={rows} loading={loading} emptyText="No records found for this company!" />
        </div>
    </>
);

export default CompanyDuePayAc;