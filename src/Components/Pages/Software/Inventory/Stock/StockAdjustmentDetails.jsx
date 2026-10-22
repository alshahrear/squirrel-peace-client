import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, Phone, Mail, MapPin, Calendar, FileText, Building2, ArrowLeft, PackageX } from 'lucide-react';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const qtyLine = (it, uKey, sKey, pKey) => {
    const u = Number(it[uKey]) || 0;
    const s = Number(it[sKey]) || 0;
    const p = Number(it[pKey]) || 0;
    const parts = [];
    if (u > 0) parts.push(`${u} ${it.unit || 'Unit'}`);
    if (it.parentMode && s > 0) parts.push(`${s} ${it.subUnit || 'Sub'}`);
    parts.push(`${p} Pcs`);
    return parts.join(' ');
};

const QtyCell = ({ it, total, type, uKey, sKey, pKey }) => {
    if (!(Number(total) > 0)) return <span className="text-slate-300">—</span>;
    const isIn = type !== 'out';
    return (
        <div className={`font-semibold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className={`mr-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isIn ? 'In +' : 'Out −'}
            </span>
            {qtyLine(it, uKey, sKey, pKey)}
            <span className="text-[10px] ml-1 font-bold text-indigo-600">(Total: {fmt(total)})</span>
        </div>
    );
};

const StockAdjustmentDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [adj, setAdj] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`https://squirrel-peace-server.onrender.com/stock-adjustment/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) setAdj(data);
                else setNotFound(true);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id]);

    const goBack = () => navigate('/stock-all', { state: { tab: 'adjustment' } });

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading adjustment...</p>
                </div>
            </div>
        );
    }

    if (notFound || !adj) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6">
                <div className="bg-white/90 rounded-3xl shadow-xl p-10 border border-white text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                        <PackageX className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Adjustment Not Found</h2>
                    <p className="text-gray-500 text-sm mt-2">This adjustment couldn't be found. It may have been deleted.</p>
                    <button onClick={goBack} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md cursor-pointer">
                        <ArrowLeft className="w-4 h-4" /> Back to Adjustments
                    </button>
                </div>
            </div>
        );
    }

    const items = adj.items || [];
    let totalIn = 0;
    let totalOut = 0;
    items.forEach((it) => {
        const m = Number(it.totalQty) || 0;
        const f = Number(it.freeQty) || 0;
        if (it.mainType === 'out') totalOut += m; else totalIn += m;
        if (it.freeType === 'out') totalOut += f; else totalIn += f;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 print:bg-white print:p-0">
            <div className="max-w-7xl mx-auto space-y-6 print:space-y-0 print:max-w-full">
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
                    <button onClick={goBack} className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-semibold text-sm hover:bg-indigo-100 transition cursor-pointer">
                        <ArrowLeft className="w-4 h-4" /> Back to Adjustments
                    </button>
                    <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-xl font-semibold text-sm shadow-md hover:opacity-90 transition cursor-pointer">
                        <Printer className="w-4 h-4" /> Print
                    </button>
                </div>

                <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-white overflow-hidden print:shadow-none print:border-none print:rounded-none">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white p-6 sm:p-10 print:bg-none print:text-black print:border-b-2 print:border-slate-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/25 print:border-slate-300 print:bg-slate-100">
                                    <Building2 className="w-7 h-7 text-white print:text-slate-700" />
                                </div>
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-white bg-white/20 px-2.5 py-1 rounded-md mb-1.5 uppercase print:bg-slate-100 print:text-slate-700">
                                        Stock Adjustment
                                    </span>
                                    <h1 className="text-2xl font-extrabold tracking-tight text-white print:text-black">ইসরাইল এন্টারপ্রাইজ</h1>
                                    <p className="text-indigo-50/90 text-xs sm:text-sm flex items-center gap-1.5 mt-1 print:text-slate-600">
                                        <MapPin className="w-3.5 h-3.5" /> শাহজী পাড়া, বড় বাজার, মেহেরপুর
                                    </p>
                                </div>
                            </div>
                            <div className="text-xs sm:text-sm text-indigo-50/90 space-y-1.5 print:text-slate-600">
                                <p className="flex items-center sm:justify-end gap-2"><Phone className="w-3.5 h-3.5 print:hidden" /><span>01997074920</span></p>
                                <p className="flex items-center sm:justify-end gap-2"><Mail className="w-3.5 h-3.5 print:hidden" /><span>jakoberjak2017@gmail.com</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Company / Info */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-b border-slate-200/70 print:bg-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none">
                                <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-3 uppercase">Company</span>
                                <p className="font-bold text-slate-800 text-base">{adj.company}</p>
                                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{adj.phone}</p>
                                <p className="text-xs sm:text-sm text-slate-600">{adj.address}</p>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm print:border-none print:p-0 print:shadow-none flex justify-between items-start">
                                <div>
                                    <span className="inline-block text-[11px] font-bold tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md mb-2 uppercase">Adjustment</span>
                                    <p className="font-bold text-slate-800 text-lg">Demo Enterprise</p>
                                    <p className="text-xs text-slate-500 mt-1">01612002913</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs text-orange-500 flex items-center justify-end gap-1">
                                        <Calendar className="w-3.5 h-3.5" /> Date: {adj.adjustmentDate || 'N/A'}
                                    </p>
                                    <p className="text-xs font-semibold text-slate-700 mt-1.5 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
                                        Inv: <span className="text-indigo-600">{adj.invoiceNo}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="p-6 sm:p-8 overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white text-[11px] font-bold uppercase tracking-wider print:bg-slate-100 print:text-slate-600">
                                    <th className="py-3 px-3.5 rounded-l-xl">SL</th>
                                    <th className="py-3 px-3.5">Product Name</th>
                                    <th className="py-3 px-3.5">Stock Invoice</th>
                                    <th className="py-3 px-3.5 text-right">Cost Price</th>
                                    <th className="py-3 px-3.5">Main Qty</th>
                                    <th className="py-3 px-3.5 rounded-r-xl">Free Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                                {items.map((it, index) => (
                                    <tr key={index} className="hover:bg-indigo-50/40 transition-colors">
                                        <td className="py-4 px-3.5 font-medium text-slate-400">{index + 1}</td>
                                        <td className="py-4 px-3.5 font-semibold text-slate-800">{it.productName}</td>
                                        <td className="py-4 px-3.5 text-slate-600">
                                            <div className="font-semibold">#{it.batchInvoiceNo}</div>
                                            <div className="text-[11px] text-slate-400">Batch: {it.batchNo}</div>
                                        </td>
                                        <td className="py-4 px-3.5 text-right font-medium text-slate-600">৳{Number(it.costPrice || 0).toFixed(2)}</td>
                                        <td className="py-4 px-3.5"><QtyCell it={it} total={it.totalQty} type={it.mainType} uKey="unitQty" sKey="subQty" pKey="pcsQty" /></td>
                                        <td className="py-4 px-3.5"><QtyCell it={it} total={it.freeQty} type={it.freeType} uKey="freeUnitQty" sKey="freeSubQty" pKey="freePcsQty" /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals + Note */}
                    <div className="p-6 sm:p-8 bg-slate-50/60 border-t border-slate-200/70 flex flex-col sm:flex-row justify-between items-start gap-6 print:bg-white">
                        <div className="w-full sm:w-1/2">
                            {adj.note && (
                                <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-2xl shadow-sm">
                                    <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-emerald-600" /> Note:
                                    </h4>
                                    <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{adj.note}</p>
                                </div>
                            )}
                        </div>
                        <div className="w-full sm:w-80 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2.5 text-xs sm:text-sm">
                            <div className="flex justify-between py-1 text-emerald-700 font-bold">
                                <span>Total In Stock (+):</span>
                                <span>{fmt(totalIn)} pcs</span>
                            </div>
                            <div className="flex justify-between py-2.5 border-t border-slate-200 text-rose-700 font-bold">
                                <span>Total Out Stock (−):</span>
                                <span>{fmt(totalOut)} pcs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockAdjustmentDetails;