import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import {
    PrintPage, ActionBar, Paper, BusinessHeader, PartySection, InfoLine, InvTag,
    TableBox, headCls, LoadingState, NotFoundState, CardList, ItemCard,
} from '../../Purchase/PurchasePrintUi';

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
        <span className={`font-semibold ${isIn ? 'text-emerald-600' : 'text-rose-600'}`}>
            <span className={`mr-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${isIn ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {isIn ? 'In +' : 'Out −'}
            </span>
            {qtyLine(it, uKey, sKey, pKey)}
            <span className="text-[10px] ml-1 font-bold text-brand-700">(Total: {fmt(total)})</span>
        </span>
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
        fetch(`http://localhost:5000/stock-adjustment/${id}`)
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

    const goBack = () => navigate('/stock-adjustment');

    if (loading) {
        return (
            <PrintPage>
                <LoadingState text="Loading adjustment..." />
            </PrintPage>
        );
    }

    if (notFound || !adj) {
        return (
            <PrintPage>
                <NotFoundState
                    title="Adjustment Not Found"
                    text="This adjustment couldn't be found. It may have been deleted."
                    backLabel="Back to Adjustments"
                    onBack={goBack}
                />
            </PrintPage>
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

    const th = 'py-3 px-3.5';
    const td = 'py-4 px-3.5';

    return (
        <PrintPage>
            <ActionBar backLabel="Back to Adjustments" onBack={goBack} onPrint={() => window.print()} />

            <Paper>
                <BusinessHeader badge="Stock Adjustment" />

                <PartySection
                    from={{ name: adj.company, phone: adj.phone, address: adj.address }}
                    showShipping={false}
                >
                    <InfoLine tone="orange">Date: {adj.adjustmentDate || 'N/A'}</InfoLine>
                    <InvTag no={adj.invoiceNo} />
                </PartySection>

                {/* Products */}
                <div className="px-2 sm:px-6 py-3 sm:py-5">
                    <CardList>
                        {items.map((it, index) => (
                            <ItemCard
                                key={index}
                                index={index + 1}
                                title={it.productName}
                                sub={`#${it.batchInvoiceNo}`}
                                total={`৳${Number(it.costPrice || 0).toFixed(2)}`}
                                totalLabel="Cost"
                                boxes={[
                                    { label: 'Batch', value: it.batchNo || '—' },
                                    { label: 'Main', value: <QtyCell it={it} total={it.totalQty} type={it.mainType} uKey="unitQty" sKey="subQty" pKey="pcsQty" /> },
                                    { label: 'Free', value: <QtyCell it={it} total={it.freeQty} type={it.freeType} uKey="freeUnitQty" sKey="freeSubQty" pKey="freePcsQty" /> },
                                ]}
                            />
                        ))}
                    </CardList>

                    <TableBox>
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Stock Invoice</th>
                                <th className={`${th} text-right`}>Cost Price</th>
                                <th className={th}>Main Qty</th>
                                <th className={`${th} rounded-r-xl`}>Free Qty</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                            {items.map((it, index) => (
                                <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                    <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                    <td className={`${td} font-semibold text-slate-800`}>{it.productName}</td>
                                    <td className={`${td} text-slate-600`}>
                                        <div className="font-semibold">#{it.batchInvoiceNo}</div>
                                        <div className="text-[11px] text-slate-400">Batch: {it.batchNo}</div>
                                    </td>
                                    <td className={`${td} text-right font-medium text-slate-600`}>৳{Number(it.costPrice || 0).toFixed(2)}</td>
                                    <td className={td}><QtyCell it={it} total={it.totalQty} type={it.mainType} uKey="unitQty" sKey="subQty" pKey="pcsQty" /></td>
                                    <td className={td}><QtyCell it={it} total={it.freeQty} type={it.freeType} uKey="freeUnitQty" sKey="freeSubQty" pKey="freePcsQty" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </TableBox>
                </div>

                {/* Totals + Note */}
                <div className="p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-start gap-4 print:bg-white">
                    <div className="w-full sm:w-1/2">
                        {adj.note && (
                            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{adj.note}</p>
                            </div>
                        )}
                    </div>
                    <div className="w-full sm:w-80 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
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
            </Paper>
        </PrintPage>
    );
};

export default StockAdjustmentDetails;