import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock, FaEdit } from 'react-icons/fa';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDateOnly = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date)) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TH = 'px-3 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider';
const NOT_USED_BADGE =
    'inline-block px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-semibold text-[10px]';

const CustomerDamageReturnAc = ({ rows = [], loading = false }) => {
    const navigate = useNavigate();

    const handleOpenInvoice = (r) =>
        r.fromSales
            ? navigate(`/sales-details/${r.id}`, { state: { scrollTo: 'damage-section' } })
            : navigate(`/damage-details/${r.id}`);

    return (
        <>
            {/* Mobile compact cards */}
            <div className="md:hidden p-1.5 space-y-1.5">
                {loading ? (
                    <div className="py-8 text-center text-xs text-gray-400">Loading...</div>
                ) : rows.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">No records found for this customer!</div>
                ) : (
                    rows.map((r) => {
                        const amts = [
                            ['Damage', r.total, 'text-rose-600'],
                            ['Paid', r.paid, 'text-emerald-600'],
                            ['Pay', r.due, 'text-rose-600'],
                            ['Get', r.extra, 'text-sky-600'],
                        ];
                        const notUsedCls =
                            'shrink-0 inline-block px-1.5 py-px bg-slate-100 text-slate-500 rounded-full font-semibold text-[9px] leading-tight';
                        return (
                            <div
                                key={r.key}
                                className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-1.5 shadow-sm"
                            >
                                <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-rose-400" />
                                <div className="flex items-stretch gap-2">
                                    <div className="min-w-0 flex-1 flex flex-col justify-between gap-0.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => handleOpenInvoice(r)}
                                                className="shrink-0 bg-indigo-50 text-indigo-700 px-1.5 py-px rounded-full text-[11px] font-bold leading-tight cursor-pointer"
                                            >
                                                #{r.invoiceNo}
                                            </button>
                                            {r.payment ? (
                                                <span className="shrink-0 bg-gray-100 text-gray-700 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight">
                                                    {r.method}
                                                </span>
                                            ) : (
                                                <span className={notUsedCls}>Not Used</span>
                                            )}
                                            {r.fromSales && (
                                                <span className="shrink-0 bg-violet-50 text-violet-700 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight">
                                                    From Sales
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10.5px] text-rose-600 font-semibold leading-snug">
                                            <span className="uppercase text-slate-400 font-bold">Damage: </span>
                                            {r.damageDate || 'N/A'}
                                        </p>
                                        {r.editedAt && (
                                            <div>
                                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                    <FaEdit size={10} /> Edited: {formatDateOnly(r.editedAt)}
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-[10.5px] text-slate-500 leading-snug break-words">
                                            <span className="uppercase text-slate-400 font-bold">AC: </span>
                                            {r.payment ? (
                                                r.account || <span className="text-slate-400 italic">N/A</span>
                                            ) : (
                                                <span className={notUsedCls}>Not Used</span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="shrink-0 w-[108px] flex flex-col justify-center gap-px">
                                        {amts.map(([l, v, c]) => (
                                            <div key={l} className="flex items-center justify-between rounded-md bg-slate-50 px-1.5 py-px">
                                                <span className="text-[9px] font-bold text-slate-400 uppercase">{l}</span>
                                                <span className={`text-[10.5px] font-bold whitespace-nowrap ${c}`}>৳{fmt(v)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className={TH}>Date</th>
                            <th className={TH}>Invoice</th>
                            <th className={TH}>Payment Method</th>
                            <th className={TH}>Payment Account</th>
                            <th className={TH}>Damage Amount</th>
                            <th className={TH}>Paid Amount</th>
                            <th className={TH}>Pay Amount</th>
                            <th className={TH}>Get Amount</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="text-center py-10 text-gray-400 text-sm">Loading...</td>
                            </tr>
                        ) : rows.length > 0 ? (
                            rows.map((r) => (
                                <tr key={r.key} className="hover:bg-indigo-50/50 transition-colors">
                                    <td className="px-3 py-1.5 whitespace-nowrap text-[11px] text-gray-600">
                                        <div className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                                            <FaClock className="text-rose-500" size={10} />
                                            Damage: {r.damageDate || 'N/A'}
                                        </div>
                                        {r.editedAt && (
                                            <div className="mt-0.5">
                                                <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                                                    <FaEdit size={10} /> Edited: {formatDateOnly(r.editedAt)}
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm">
                                        <button
                                            onClick={() => handleOpenInvoice(r)}
                                            className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                                        >
                                            {r.invoiceNo}
                                        </button>
                                        {r.fromSales && (
                                            <div>
                                                <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm">
                                                    From Sales
                                                </span>
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm">
                                        {r.payment ? (
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                                {r.method}
                                            </span>
                                        ) : (
                                            <span className={NOT_USED_BADGE}>Not Used</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm text-gray-600">
                                        {r.payment ? (
                                            r.account || <span className="text-gray-400 italic">N/A</span>
                                        ) : (
                                            <span className={NOT_USED_BADGE}>Not Used</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm font-semibold text-rose-600">৳ {fmt(r.total)}</td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm font-semibold">
                                        {r.payment ? (
                                            <span className="text-emerald-600">৳ {fmt(r.paid)}</span>
                                        ) : (
                                            <span className={NOT_USED_BADGE}>Not Used</span>
                                        )}
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm font-semibold">
                                        <span className={r.due > 0 ? 'text-red-600' : 'text-emerald-600'}>৳ {fmt(r.due)}</span>
                                    </td>
                                    <td className="px-3 py-1.5 whitespace-nowrap text-sm font-semibold text-sky-600">৳ {fmt(r.extra)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-10 text-gray-400 text-sm">
                                    No records found for this customer!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </>
    );
};

export default CustomerDamageReturnAc;