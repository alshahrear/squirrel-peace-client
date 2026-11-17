import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaClock } from 'react-icons/fa';

const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const formatDateOnly = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date)) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const TH = 'px-3 py-2 text-left text-[11px] font-bold text-gray-500 uppercase tracking-wider';

const CustomerWholesaleAc = ({ rows = [], loading = false }) => {
    const navigate = useNavigate();

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
                            ['Total', r.total, 'text-indigo-600'],
                            ['Paid', r.paid, 'text-emerald-600'],
                            ['Pay', r.due, 'text-rose-600'],
                            ['Get', r.extra, 'text-sky-600'],
                        ];
                        return (
                            <div
                                key={r.key}
                                className="relative rounded-xl border border-slate-200 bg-white pl-3 pr-2 py-1.5 shadow-sm"
                            >
                                <span className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-indigo-500" />
                                <div className="flex items-stretch gap-2">
                                    <div className="min-w-0 flex-1 flex flex-col justify-between gap-0.5">
                                        <div className="flex items-center gap-1.5 min-w-0">
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/sales-details/${r.id}`)}
                                                className="shrink-0 bg-indigo-50 text-indigo-700 px-1.5 py-px rounded-full text-[11px] font-bold leading-tight cursor-pointer"
                                            >
                                                #{r.invoiceNo}
                                            </button>
                                            {r.method && (
                                                <span className="shrink-0 bg-gray-100 text-gray-700 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight">
                                                    {r.method}
                                                </span>
                                            )}
                                            {r.directSales && (
                                                <span className="shrink-0 bg-teal-50 text-teal-700 px-1.5 py-px rounded-full text-[9px] font-bold leading-tight">
                                                    ⚡ Direct
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[10.5px] text-slate-500 leading-snug truncate">
                                            <span className="uppercase text-slate-400 font-bold">Order: </span>
                                            {r.orderDate || 'N/A'}
                                        </p>
                                        <p className="text-[10.5px] text-slate-500 leading-snug">
                                            <span className="uppercase text-slate-400 font-bold">Delivered: </span>
                                            {r.deliveryDate || (
                                                <span className="px-1.5 py-px bg-amber-100 text-amber-700 rounded-full text-[9px] font-bold">Not Delivered</span>
                                            )}
                                        </p>
                                        <p className="text-[10.5px] text-emerald-700 font-semibold leading-snug">
                                            <span className="uppercase text-slate-400 font-bold">Paid: </span>
                                            {formatDateOnly(r.paymentDate) || 'N/A'}
                                        </p>
                                        {r.account && (
                                            <p className="text-[10.5px] text-slate-500 leading-snug break-words">
                                                <span className="uppercase text-slate-400 font-bold">AC: </span>
                                                {r.account}
                                            </p>
                                        )}
                                        {(r.damageAdj > 0 || r.returnAdj > 0) && (
                                            <div className="flex flex-wrap gap-x-1 gap-y-0.5">
                                                {r.damageAdj > 0 && (
                                                    <span className="px-1.5 py-px rounded-full bg-red-50 text-red-600 text-[9px] font-semibold">Damage: ৳{fmt(r.damageAdj)}</span>
                                                )}
                                                {r.returnAdj > 0 && (
                                                    <span className="px-1.5 py-px rounded-full bg-violet-50 text-violet-600 text-[9px] font-semibold">Bulk: ৳{fmt(r.returnAdj)}</span>
                                                )}
                                            </div>
                                        )}
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
                        <th className={TH}>Total Amount</th>
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
                                <td className="px-4 py-3 whitespace-nowrap text-[11px] text-gray-600">
                                    <div className="font-medium">Order : {r.orderDate || 'N/A'}</div>
                                    <div className="mt-0.5">
                                        {r.deliveryDate ? (
                                            <span>Delivered: {r.deliveryDate}</span>
                                        ) : (
                                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-semibold text-[10px] whitespace-nowrap">
                                                Not Delivered
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-0.5 inline-flex items-center gap-1 text-emerald-700 font-semibold">
                                        <FaClock className="text-emerald-500" size={10} />
                                        Paid: {formatDateOnly(r.paymentDate) || 'N/A'}
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <button
                                        onClick={() => navigate(`/sales-details/${r.id}`)}
                                        className="bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white px-2 py-0.5 rounded text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        {r.invoiceNo}
                                    </button>
                                    <div className="mt-1 flex flex-col items-start gap-0.5">
                                        {r.directSales && (
                                            <span className="inline-block px-1.5 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold text-[9px] leading-none whitespace-nowrap shadow-sm">
                                                ⚡ Direct Delivery
                                            </span>
                                        )}
                                        {r.damageAdj > 0 && (
                                            <span className="inline-block px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100 font-bold text-[9px] leading-none whitespace-nowrap">
                                                Damage Adjusted: ৳ {fmt(r.damageAdj)}
                                            </span>
                                        )}
                                        {r.returnAdj > 0 && (
                                            <span className="inline-block px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100 font-bold text-[9px] leading-none whitespace-nowrap">
                                                Bulk Return Adjusted: ৳ {fmt(r.returnAdj)}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    <span className="bg-gray-100 px-2 py-0.5 rounded text-xs font-medium text-gray-700">
                                        {r.method}
                                    </span>
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                    {r.account || <span className="text-gray-400 italic">N/A</span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-indigo-600">৳ {fmt(r.total)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-600">৳ {fmt(r.paid)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-rose-600">৳ {fmt(r.due)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-sky-600">৳ {fmt(r.extra)}</td>
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

export default CustomerWholesaleAc;