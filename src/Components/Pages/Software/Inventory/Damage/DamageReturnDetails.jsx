import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PrintPage, ActionBar, Paper, BusinessHeader, PartySection, InfoLine, InvTag, TableBox, headCls, LoadingState, NotFoundState, CardList, ItemCard, Qty } from '../../Purchase/PurchasePrintUi';

const money = (n) => `৳${Number(n || 0).toFixed(2)}`;
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const f = (n) => (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const costStatus = (d) =>
    d > 0
        ? { label: 'Loss', box: 'bg-rose-50 border-rose-200 text-rose-700', tag: 'bg-rose-500', val: 'text-rose-600', ring: 'border-rose-200 bg-rose-50' }
        : d < 0
            ? { label: 'Profit', box: 'bg-emerald-50 border-emerald-200 text-emerald-700', tag: 'bg-emerald-500', val: 'text-emerald-600', ring: 'border-emerald-200 bg-emerald-50' }
            : { label: 'Even', box: 'bg-slate-50 border-slate-200 text-slate-600', tag: 'bg-slate-400', val: 'text-slate-600', ring: 'border-slate-200 bg-slate-50' };

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
        fetch(`http://localhost:5000/damage-return/${id}`)
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
            <PrintPage>
                <LoadingState text="Loading damage return..." />
            </PrintPage>
        );
    }

    if (notFound || !data) {
        return (
            <PrintPage>
                <NotFoundState
                    title="Damage Return Not Found"
                    text="This record couldn't be found. It may have been deleted."
                    backLabel="Back to Damage Return"
                    onBack={goBack}
                />
            </PrintPage>
        );
    }

    const items = data.items || [];
    const th = 'py-3 px-3.5';
    const td = 'py-4 px-3.5';

    // ---- Cost calculation ----
    const costLines = items
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
    const cStock = r2(costLines.reduce((s, l) => s + l.stockTotal, 0));
    const cRet = r2(costLines.reduce((s, l) => s + l.retTotal, 0));
    const cDiff = r2(cStock - cRet);
    const cSt = costStatus(cDiff);

    // ---- Payment ----
    const totalRet = Number(data.damageAmount) || 0;
    const pay = data.payment;
    const paid = pay ? Number(pay.amount) || 0 : 0;
    const diff = r2(totalRet - paid);
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
        <PrintPage>
            <ActionBar backLabel="Back to Damage Return" onBack={goBack} onPrint={handlePrint} />

            <Paper>
                <BusinessHeader badge="Damage Return" />

                <PartySection
                    from={{ name: data.company, phone: data.phone, address: data.address }}
                    showShipping={false}
                >
                    <InfoLine tone="orange">Return Date: {data.returnDate || 'N/A'}</InfoLine>
                    {data.category && (
                        <p className="text-xs text-slate-500 sm:text-right">
                            Category: <span className="font-semibold text-slate-700">{data.category}</span>
                        </p>
                    )}
                    <InvTag no={data.invoiceNo} />
                </PartySection>

                {/* Products */}
                <div className="p-4 sm:p-6">
                    <CardList>
                        {items.map((item, index) => (
                            <ItemCard
                                key={index}
                                index={index + 1}
                                title={item.productName}
                                sub={item.company}
                                total={money(item.itemTotal ?? item.subtotal ?? 0)}
                                totalCls="text-rose-600"
                                boxes={[
                                    {
                                        label: 'Return Qty',
                                        cls: 'text-orange-600',
                                        value: (
                                            <Qty
                                                u={Number(item.unitQty) || 0}
                                                unit={item.unit}
                                                s={Number(item.subQty) || 0}
                                                sub={item.subUnit}
                                                parent={item.parentMode}
                                                p={Number(item.pcsQty) || 0}
                                                total={Number(item.totalQty) || 0}
                                            />
                                        ),
                                    },
                                    {
                                        label: 'Return Free Qty',
                                        cls: 'text-emerald-600',
                                        value: (
                                            <Qty
                                                u={Number(item.freeUnitQty) || 0}
                                                unit={item.unit}
                                                s={Number(item.freeSubQty) || 0}
                                                sub={item.subUnit}
                                                parent={item.parentMode}
                                                p={Number(item.freePcsQty) || 0}
                                                total={Number(item.freeQty) || 0}
                                            />
                                        ),
                                    },
                                    { label: 'Buy Price (Pcs)', value: money(item.buyPrice), side: 'right' },
                                ]}
                            />
                        ))}
                    </CardList>

                    <TableBox k="main">
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Company</th>
                                <th className={`${th} text-right`}>Buy Price</th>
                                <th className={`${th} text-center`}>Return Qty</th>
                                <th className={`${th} text-center`}>Return Free Qty</th>
                                <th className={`${th} text-right rounded-r-xl`}>Item Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                    <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                    <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                    <td className={`${td} text-slate-600`}>{item.company}</td>
                                    <td className={`${td} text-right font-medium text-slate-600`}>Pcs: {money(item.buyPrice)}</td>
                                    <td className={`${td} text-center font-semibold text-orange-600`}>
                                        {Number(item.unitQty) || 0} {item.unit}{' '}
                                        {item.parentMode && <>{Number(item.subQty) || 0} {item.subUnit} </>}
                                        {Number(item.pcsQty) || 0} Pcs
                                        <span className="text-[10px] text-brand-700 ml-1 font-bold">(Total: {Number(item.totalQty) || 0})</span>
                                    </td>
                                    <td className={`${td} text-center font-semibold text-emerald-600`}>
                                        {Number(item.freeUnitQty) || 0} {item.unit}{' '}
                                        {item.parentMode && <>{Number(item.freeSubQty) || 0} {item.subUnit} </>}
                                        {Number(item.freePcsQty) || 0} Pcs
                                        <span className="text-[10px] text-emerald-700 ml-1 font-bold">(Total: {Number(item.freeQty) || 0})</span>
                                    </td>
                                    <td className={`${td} text-right font-bold text-rose-600`}>
                                        {money(item.itemTotal ?? item.subtotal ?? 0)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </TableBox>
                </div>

                {/* Cost Calculation (screen only) */}
                {costLines.length > 0 && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 print:hidden">
                        <h4 className="text-sm font-bold text-slate-700 mb-3">🧮 Cost Calculation</h4>
                        <div className={`rounded-xl border px-3 py-3 text-center text-[13px] sm:text-sm font-extrabold mb-3 ${cSt.box}`}>
                            Stock ৳{f(cStock)} vs Return ৳{f(cRet)} → ৳{f(Math.abs(cDiff))}
                            <span className={`ml-2 px-2.5 py-0.5 rounded-full text-[11px] text-white ${cSt.tag}`}>{cSt.label}</span>
                        </div>

                        {/* Mobile cards */}
                        <div className="md:hidden space-y-2">
                            {costLines.map((l, i) => {
                                const d = r2(l.stockTotal - l.retTotal);
                                const ds = costStatus(d);
                                return (
                                    <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-bold text-slate-800 text-sm min-w-0">{l.name}</p>
                                            <span className="shrink-0 text-xs font-bold text-orange-600">{f(l.qty)} pcs</span>
                                        </div>
                                        <div className="mt-2 grid grid-cols-2 gap-1.5 text-[11px]">
                                            <div className="rounded-lg bg-violet-50 px-2 py-1.5">
                                                <p className="text-[9px] uppercase font-bold text-violet-400">Stock / pcs</p>
                                                <p className="font-bold text-violet-700">৳{f(l.stockPerPcs)}</p>
                                            </div>
                                            <div className="rounded-lg bg-violet-50 px-2 py-1.5">
                                                <p className="text-[9px] uppercase font-bold text-violet-400">Stock Total</p>
                                                <p className="font-bold text-violet-700">৳{f(l.stockTotal)}</p>
                                            </div>
                                            <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                                                <p className="text-[9px] uppercase font-bold text-amber-500">Return / pcs</p>
                                                <p className="font-bold text-amber-700">৳{f(l.retPerPcs)}</p>
                                            </div>
                                            <div className="rounded-lg bg-amber-50 px-2 py-1.5">
                                                <p className="text-[9px] uppercase font-bold text-amber-500">Return Total</p>
                                                <p className="font-bold text-amber-700">৳{f(l.retTotal)}</p>
                                            </div>
                                        </div>
                                        <div className={`mt-1.5 rounded-lg border px-2 py-1.5 flex items-center justify-between text-[12px] font-extrabold ${ds.box}`}>
                                            <span>Difference</span>
                                            <span>
                                                ৳{f(Math.abs(d))}
                                                <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] text-white ${ds.tag}`}>{ds.label}</span>
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                                            <span className="font-bold text-slate-400 uppercase text-[9px]">Source:</span>
                                            {l.batches.map((b, bi) => (
                                                <span key={bi} className="px-2 py-0.5 rounded-md border border-violet-200 bg-violet-50 text-violet-700 font-semibold">
                                                    #{b.invoiceNo} · {f(b.qty)} × ৳{f(b.cost)}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop table */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 text-slate-600 text-[11px] font-bold uppercase tracking-wide whitespace-nowrap">
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
                                    {costLines.map((l, i) => {
                                        const d = r2(l.stockTotal - l.retTotal);
                                        const ds = costStatus(d);
                                        return (
                                            <React.Fragment key={i}>
                                                <tr>
                                                    <td className="py-3 px-3 font-semibold text-slate-800">{l.name}</td>
                                                    <td className="py-3 px-3 text-center font-bold text-orange-600 whitespace-nowrap">{f(l.qty)} pcs</td>
                                                    <td className="py-3 px-3 text-right font-bold text-violet-600 whitespace-nowrap">৳{f(l.stockPerPcs)}</td>
                                                    <td className="py-3 px-3 text-right font-bold text-violet-700 whitespace-nowrap">৳{f(l.stockTotal)}</td>
                                                    <td className="py-3 px-3 text-right font-bold text-amber-600 whitespace-nowrap">৳{f(l.retPerPcs)}</td>
                                                    <td className="py-3 px-3 text-right font-bold text-amber-700 whitespace-nowrap">৳{f(l.retTotal)}</td>
                                                    <td className={`py-3 px-3 text-right font-extrabold whitespace-nowrap ${ds.val}`}>
                                                        ৳{f(Math.abs(d))}
                                                        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[9px] text-white ${ds.tag}`}>{ds.label}</span>
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
                )}

                {/* Totals + Note */}
                <div className="p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-start gap-4 print:bg-white">
                    <div className="w-full sm:w-1/2">
                        {data.note && (
                            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Damage Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{data.note}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between py-1 text-sm sm:text-base font-bold text-slate-900">
                            <span>Return Amount:</span>
                            <span className="text-rose-600">{money(totalRet)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Return Payment Received:</span>
                            {pay ? (
                                <span className="font-bold text-emerald-600">{money(paid)}</span>
                            ) : (
                                <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold text-[10px]">Not Received</span>
                            )}
                        </div>
                        {pay && (
                            <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-300 pt-2">
                                <span>{diff > 0 ? 'Get Amount:' : diff < 0 ? 'Pay Amount:' : 'Status:'}</span>
                                <span className={`font-bold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {diff === 0 ? 'Fully Received' : money(Math.abs(diff))}
                                </span>
                            </div>
                        )}
                        {pay && (
                            <div className="text-[11px] text-slate-500 border-t border-slate-200 pt-2 break-words">
                                <div>
                                    Method: <b className="text-slate-700">{pay.method}</b>
                                    {accText && pay.method !== 'Cash' ? ` | ${accText}` : ''}
                                </div>
                                {pay.note && <div className="italic mt-1">Note: {pay.note}</div>}
                            </div>
                        )}
                    </div>
                </div>
            </Paper>
        </PrintPage>
    );
};

export default DamageReturnDetails;