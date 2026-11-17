import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PrintPage, ActionBar, Paper, BusinessHeader, PartySection, InfoLine, InvTag, TableBox, headCls, LoadingState, NotFoundState, CardList, ItemCard, Qty } from './PurchasePrintUi';

const PurchaseBulkDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bulkReturn, setBulkReturn] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/purchase-bulk-return/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setBulkReturn(data);
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching bulk return:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <PrintPage>
                <LoadingState text="Loading bulk return..." />
            </PrintPage>
        );
    }

    if (notFound || !bulkReturn) {
        return (
            <PrintPage>
                <NotFoundState
                    title="Bulk Return Not Found"
                    text="This bulk return couldn't be found. It may have been deleted."
                    backLabel="Back to Bulk Returns"
                    onBack={() => navigate('/purchase-bulk-return')}
                />
            </PrintPage>
        );
    }

    const items = bulkReturn.items || [];
    const th = 'py-3 px-3.5';
    const td = 'py-4 px-3.5';

    const totalRet = Number(bulkReturn.returnAmount) || 0;
    const pay = bulkReturn.payment;
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
        <PrintPage>
            <ActionBar backLabel="Back to Bulk Returns" onBack={() => navigate('/purchase-bulk-return')} onPrint={handlePrint} />

            <Paper>
                <BusinessHeader badge="Purchase Bulk Return" />

                <PartySection
                    from={{ name: bulkReturn.company, phone: bulkReturn.phone, address: bulkReturn.address }}
                    showShipping={false}
                >
                    <InfoLine tone="orange">Return Date: {bulkReturn.returnDate || 'N/A'}</InfoLine>
                    <InvTag no={bulkReturn.invoiceNo} />
                </PartySection>

                {/* Products */}
                <div className="p-4 sm:p-6">
                    <CardList>
                        {items.map((item, index) => (
                            <ItemCard
                                key={index}
                                index={index + 1}
                                title={item.productName}
                                sub={bulkReturn.company}
                                total={`৳${Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}`}
                                totalCls="text-orange-600"
                                boxes={[
                                    { label: 'Return Qty', cls: 'text-orange-600', value: <Qty u={Number(item.unitQty) || 0} unit={item.unit} s={Number(item.subQty) || 0} sub={item.subUnit} parent={item.parentMode} p={Number(item.pcsQty) || 0} total={Number(item.totalPcs) || 0} /> },
                                    { label: 'Return Free Qty', cls: 'text-emerald-600', value: <Qty u={Number(item.freeUnitQty) || 0} unit={item.unit} s={Number(item.freeSubQty) || 0} sub={item.subUnit} parent={item.parentMode} p={Number(item.freePcsQty) || 0} total={Number(item.freeTotalQty) || 0} /> },
                                    { label: 'Purchase Price', value: `৳${Number(item.buyPrice).toFixed(2)}`, span: true },
                                ]}
                            />
                        ))}
                    </CardList>
                    <TableBox k="bulk">
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Company</th>
                                <th className={`${th} text-right`}>Purchase Price</th>
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
                                    <td className={`${td} text-slate-600`}>{bulkReturn.company}</td>
                                    <td className={`${td} text-right font-medium text-slate-600`}>৳{Number(item.buyPrice).toFixed(2)}</td>
                                    <td className={`${td} text-center font-semibold text-orange-600`}>
                                        {Number(item.unitQty) || 0} {item.unit} {item.parentMode && <>{Number(item.subQty) || 0} {item.subUnit} </>}{Number(item.pcsQty) || 0} Pcs
                                        <span className="text-[10px] text-brand-700 ml-1 font-bold">(Total: {Number(item.totalPcs) || 0})</span>
                                    </td>
                                    <td className={`${td} text-center font-semibold text-emerald-600`}>
                                        {Number(item.freeUnitQty) || 0} {item.unit} {item.parentMode && <>{Number(item.freeSubQty) || 0} {item.subUnit} </>}{Number(item.freePcsQty) || 0} Pcs
                                        <span className="text-[10px] text-emerald-700 ml-1 font-bold">(Total: {Number(item.freeTotalQty) || 0})</span>
                                    </td>
                                    <td className={`${td} text-right font-bold text-orange-600`}>
                                        ৳{Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </TableBox>
                </div>

                {/* Totals + Note */}
                <div className="p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-start gap-4 print:bg-white">
                    <div className="w-full sm:w-1/2">
                        {bulkReturn.note && (
                            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{bulkReturn.note}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between py-1 text-sm sm:text-base font-bold text-slate-900">
                            <span>Return Amount:</span>
                            <span className="text-orange-600">৳{totalRet.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Return Payment Received:</span>
                            {pay ? (
                                <span className="font-bold text-emerald-600">৳{paid.toFixed(2)}</span>
                            ) : (
                                <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold text-[10px]">Not Received</span>
                            )}
                        </div>
                        {pay && (
                            <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-300 pt-2">
                                <span>{diff > 0 ? 'Get Amount:' : diff < 0 ? 'Pay Amount:' : 'Status:'}</span>
                                <span className={`font-bold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {diff === 0 ? 'Fully Received' : `৳${Math.abs(diff).toFixed(2)}`}
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

export default PurchaseBulkDetails;