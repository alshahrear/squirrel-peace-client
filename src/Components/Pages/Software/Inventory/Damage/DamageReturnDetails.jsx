import React, { useEffect, useState } from 'react';
// (React.Fragment use hocche)
import { useParams, useNavigate } from 'react-router-dom';
import {
    Printer,
    Phone,
    Mail,
    MapPin,
    Calendar,
    FileText,
    Building2,
    ArrowLeft,
    PackageX
} from 'lucide-react';

const DamageReturnDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [notFound, setNotFound] = useState(false);

    const goBack = () => navigate('/damage-return-invoice');

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`https://squirrel-peace-server.onrender.com/damage-return/${id}`)
            .then((res) => res.json())
            .then((d) => {
                if (d && d._id) setData(d);
                else setNotFound(true);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching damage return:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading damage return...</p>
                </div>
            </div>
        );
    }

    if (notFound || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Damage Return Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This record couldn't be found. It may have been deleted.</p>
                    <button
                        onClick={goBack}
                        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Damage
                    </button>
                </div>
            </div>
        );
    }

    const items = data.items || [];

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 print:bg-white print:p-0">
            <div className="max-w-7xl mx-auto space-y-6 print:space-y-0 print:max-w-full">

                {/* Top action bar */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button
                        onClick={goBack}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Damage
                    </button>
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer"
                    >
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>

                {/* Card */}
                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-white overflow-hidden print:shadow-none print:border-none print:rounded-none">

                    {/* Header */}
                    <div className="bg-gradient-to-r from-rose-500 via-red-500 to-orange-500 text-white p-6 sm:p-10 print:bg-none print:text-black print:border-b-2 print:border-slate-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 shadow-inner print:border-slate-300 print:bg-slate-100">
                                    <Building2 className="w-7 h-7 text-white print:text-slate-700" />
                                </div>
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-white bg-white/20 px-2.5 py-1 rounded-md mb-1.5 uppercase print:bg-slate-100 print:text-slate-700">
                                        Damage Return
                                    </span>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-white print:text-black">ইসরাইল এন্টারপ্রাইজ</h1>
                                    <p className="text-red-50/90 text-xs sm:text-sm flex items-center gap-1.5 mt-1 print:text-slate-600">
                                        <MapPin className="w-3.5 h-3.5 print:text-slate-500" /> শাহজী পাড়া, বড় বাজার, মেহেরপুর
                                    </p>
                                </div>
                            </div>

                            <div className="text-xs sm:text-sm text-red-50/90 space-y-1.5 print:text-slate-600">
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

                    {/* Company / Info */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-b border-slate-200/70 print:bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none">
                                <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-3 uppercase">Return To</span>
                                <p className="font-bold text-slate-800 text-base">{data.company}</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{data.phone}</p>
                                <p className="text-xs sm:text-sm text-slate-600">{data.address}</p>
                                {data.category && (
                                    <p className="text-xs text-slate-500 mt-1">Category: <span className="font-semibold text-slate-700">{data.category}</span></p>
                                )}
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none flex flex-col justify-between">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Return From</span>
                                        <p className="font-bold text-slate-800 text-lg">Demo Enterprise</p>
                                        <p className="text-xs text-slate-500 mt-1">01612002913</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-red-500 flex items-center justify-end gap-1">
                                            <Calendar className="w-3.5 h-3.5 text-red-500" /> Return Date: {data.returnDate || 'N/A'}
                                        </p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                            Inv: <span className="text-indigo-600">{data.invoiceNo}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products Table */}
                    <div className="p-6 sm:p-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[11px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                    <th className="py-3 px-3.5 rounded-l-xl">SL</th>
                                    <th className="py-3 px-3.5">Product Name</th>
                                    <th className="py-3 px-3.5">Company</th>
                                    <th className="py-3 px-3.5 text-right">Buy Price</th>
                                    <th className="py-3 px-3.5 text-center">Return Qty</th>
                                    <th className="py-3 px-3.5 text-center">Return Free Qty</th>
                                    <th className="py-3 px-3.5 text-right rounded-r-xl">Item Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {items.map((item, index) => (
                                    <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                        <td className="py-4 px-3.5 font-semibold text-slate-800">{item.productName}</td>
                                        <td className="py-4 px-3.5 text-slate-600">{item.company}</td>
                                        <td className="py-4 px-3.5 text-right font-medium text-slate-600">
                                            <div>Pcs: ৳{Number(item.buyPrice).toFixed(2)}</div>
                                        </td>
                                        <td className="py-4 px-3.5 text-center font-semibold text-orange-600">
                                            {Number(item.unitQty) || 0} {item.unit} {item.parentMode && <>{Number(item.subQty) || 0} {item.subUnit} </>}{Number(item.pcsQty) || 0} Pcs
                                            <span className="text-[10px] text-indigo-600 ml-1 font-bold">(Total: {Number(item.totalQty) || 0})</span>
                                        </td>
                                        <td className="py-4 px-3.5 text-center font-semibold text-emerald-600">
                                            {Number(item.freeUnitQty) || 0} {item.unit} {item.parentMode && <>{Number(item.freeSubQty) || 0} {item.subUnit} </>}{Number(item.freePcsQty) || 0} Pcs
                                            <span className="text-[10px] text-emerald-700 ml-1 font-bold">(Total: {Number(item.freeQty) || 0})</span>
                                        </td>
                                        <td className="py-4 px-3.5 text-right font-bold text-red-600">৳{Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Cost Calculation */}
                    {(() => {
                        const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
                        const lines = items
                            .filter((it) => (it.costBreakdown || []).length > 0 && Number(it.totalQty) > 0)
                            .map((it) => {
                                const bd = it.costBreakdown;
                                const qty = Number(it.totalQty) || 0;
                                const bdQty = bd.reduce((s, l) => s + (Number(l.qty) || 0), 0);
                                const stockTotal = r2(bd.reduce((s, l) => s + (Number(l.amount) || 0), 0));
                                const retPerPcs = Number(it.buyPrice) || 0;
                                return {
                                    name: it.productName,
                                    qty,
                                    stockPerPcs: bdQty > 0 ? stockTotal / bdQty : 0,
                                    retPerPcs,
                                    stockTotal,
                                    retTotal: r2(retPerPcs * qty),
                                    batches: bd,
                                };
                            });
                        if (lines.length === 0) return null;
                        const stockTotal = r2(lines.reduce((s, l) => s + l.stockTotal, 0));
                        const retTotal = r2(lines.reduce((s, l) => s + l.retTotal, 0));
                        const diff = r2(stockTotal - retTotal);
                        const st =
                            diff > 0
                                ? { label: 'Loss', box: 'bg-rose-50 border-rose-200 text-rose-700', tag: 'bg-rose-500 text-white', val: 'text-rose-600' }
                                : diff < 0
                                    ? { label: 'Profit', box: 'bg-emerald-50 border-emerald-200 text-emerald-700', tag: 'bg-emerald-500 text-white', val: 'text-emerald-600' }
                                    : { label: 'Even', box: 'bg-gray-50 border-gray-200 text-gray-600', tag: 'bg-gray-400 text-white', val: 'text-gray-600' };
                        const f = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
                        return (
                            <div className="px-6 sm:px-8 pb-6 print:hidden">
                                <h4 className="text-sm font-bold text-slate-700 mb-3">🧮 Cost Calculation</h4>
                                <div className={`rounded-2xl border px-4 py-3 text-center text-sm font-extrabold mb-3 ${st.box}`}>
                                    Stock ৳{f(stockTotal)} vs Return ৳{f(retTotal)} → ৳{f(Math.abs(diff))}
                                    <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] ${st.tag}`}>{st.label}</span>
                                </div>
                                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-rose-50 text-rose-700 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
                                                <th className="py-2.5 px-3">Product</th>
                                                <th className="py-2.5 px-3 text-center">Qty</th>
                                                <th className="py-2.5 px-3 text-right">Stock Cost / pcs</th>
                                                <th className="py-2.5 px-3 text-right">Stock Total</th>
                                                <th className="py-2.5 px-3 text-right">Return / pcs</th>
                                                <th className="py-2.5 px-3 text-right">Return Total</th>
                                                <th className="py-2.5 px-3 text-right">Difference</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                            {lines.map((l, i) => {
                                                const d = r2(l.stockTotal - l.retTotal);
                                                return (
                                                    <React.Fragment key={i}>
                                                        <tr>
                                                            <td className="py-3 px-3 font-semibold text-slate-800">{l.name}</td>
                                                            <td className="py-3 px-3 text-center font-bold text-orange-600 whitespace-nowrap">{f(l.qty)} pcs</td>
                                                            <td className="py-3 px-3 text-right font-bold text-violet-600 whitespace-nowrap">৳{f(l.stockPerPcs)}</td>
                                                            <td className="py-3 px-3 text-right font-bold text-violet-700 whitespace-nowrap">৳{f(l.stockTotal)}</td>
                                                            <td className="py-3 px-3 text-right font-bold text-amber-600 whitespace-nowrap">৳{f(l.retPerPcs)}</td>
                                                            <td className="py-3 px-3 text-right font-bold text-amber-700 whitespace-nowrap">৳{f(l.retTotal)}</td>
                                                            <td className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${d > 0 ? 'text-rose-600' : d < 0 ? 'text-emerald-600' : 'text-gray-600'}`}>
                                                                ৳{f(Math.abs(d))}
                                                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] text-white ${d > 0 ? 'bg-rose-500' : d < 0 ? 'bg-emerald-500' : 'bg-gray-400'}`}>
                                                                    {d > 0 ? 'Loss' : d < 0 ? 'Profit' : 'Even'}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                        <tr className="bg-slate-50/60">
                                                            <td colSpan={7} className="px-3 py-2">
                                                                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                                                                    <span className="font-bold text-slate-500 uppercase text-[10px]">Stock source:</span>
                                                                    {l.batches.map((b, bi) => (
                                                                        <span key={bi} className="px-2 py-0.5 rounded-md border border-violet-200 bg-violet-50 text-violet-700 font-semibold whitespace-nowrap">
                                                                            #{b.invoiceNo} · {f(b.qty)} pcs × ৳{f(b.cost)}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Totals + Note */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-between items-start gap-6 print:bg-white">
                        <div className="w-full sm:w-1/2">
                            {data.note && (
                                <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Damage Note:
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{data.note}</p>
                                </div>
                            )}
                        </div>

                        {(() => {
                            const totalRet = Number(data.damageAmount) || 0;
                            const pay = data.payment;
                            const paid = pay ? Number(pay.amount) || 0 : 0;
                            const diff = Math.round((totalRet - paid) * 100) / 100;
                            const pa = pay?.account || {};
                            const accText =
                                pay?.method === 'Bank'
                                    ? `${pa.bankName} - ${pa.accountNumber} (${pa.accountBranch})`
                                    : pay?.method === 'Mobile Banking'
                                        ? `${pa.accountName} - ${pa.accountNumber}`
                                        : pay?.method
                                            ? 'Cash'
                                            : '';
                            return (
                                <div className="w-full sm:w-80 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 text-xs sm:text-sm">
                                    <div className="flex justify-between py-2.5 text-sm sm:text-base font-bold text-slate-900">
                                        <span>Return Amount:</span>
                                        <span className="text-red-600">৳{totalRet.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-slate-600">
                                        <span>Return Payment Received:</span>
                                        {pay ? (
                                            <span className="font-bold text-emerald-600">৳{paid.toFixed(2)}</span>
                                        ) : (
                                            <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold text-[10px]">
                                                Not Received
                                            </span>
                                        )}
                                    </div>
                                    {pay && (
                                        <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-300 pt-2">
                                            <span>{diff > 0 ? 'Still Receivable:' : diff < 0 ? 'Extra Received:' : 'Status:'}</span>
                                            <span className={`font-bold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {diff === 0 ? 'Fully Received' : `৳${Math.abs(diff).toFixed(2)}`}
                                            </span>
                                        </div>
                                    )}
                                    {pay && (
                                        <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                                            <div>Method: <b className="text-slate-700">{pay.method}</b>{accText && pay.method !== 'Cash' ? ` | ${accText}` : ''}</div>
                                            {pay.note && <div className="italic mt-1">Note: {pay.note}</div>}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DamageReturnDetails;