import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { PrintPage, ActionBar, Paper, BusinessHeader, PartySection, InfoLine, InvTag, TableBox, headCls, SectionHeading, LoadingState, NotFoundState, CardList, ItemCard, Qty } from './PurchasePrintUi';

const PurchaseReturnView = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const returnId = searchParams.get('returnId');
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [returnEntry, setReturnEntry] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/purchase/${id}`)
            .then((res) => res.json())
            .then((data) => {
                const foundReturn = (data?.returnHistory || []).find((ret) => ret.returnId === returnId);
                if (data && data._id && foundReturn) {
                    setSelectedInvoice(data);
                    setReturnEntry(foundReturn);
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching return data:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id, returnId]);

    // Nirdishto return entry theke item-wise return info ber kora
    const getReturnItemInfo = (productId) => {
        const found = returnEntry?.items?.find((it) => it.productId === productId);
        return {
            returnUnitQty: found ? Number(found.returnUnitQty) || 0 : 0,
            returnPcsQty: found ? Number(found.returnPcsQty) || 0 : 0,
            returnSubQty: found ? Number(found.returnSubQty) || 0 : 0,
            returnFreeSubQty: found ? Number(found.returnFreeSubQty) || 0 : 0,
            returnTotalQty: found ? Number(found.returnTotalQty) || 0 : 0,
            returnFreeUnitQty: found ? Number(found.returnFreeUnitQty) || 0 : 0,
            returnFreePcsQty: found ? Number(found.returnFreePcsQty) || 0 : 0,
            returnFreeTotalQty: found ? Number(found.returnFreeTotalQty) || 0 : 0,
            returnAmount: found ? Number(found.returnAmount) || 0 : 0,
        };
    };

    // Others Free Product er return info
    const getReturnFreeItemInfo = (productId) => {
        const found = returnEntry?.freeItems?.find((it) => it.productId === productId);
        return {
            returnUnitQty: found ? Number(found.returnUnitQty) || 0 : 0,
            returnPcsQty: found ? Number(found.returnPcsQty) || 0 : 0,
            returnSubQty: found ? Number(found.returnSubQty) || 0 : 0,
            returnTotalQty: found ? Number(found.returnTotalQty) || 0 : 0,
        };
    };

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <PrintPage>
                <LoadingState text="Loading return details..." />
            </PrintPage>
        );
    }

    if (notFound || !selectedInvoice) {
        return (
            <PrintPage>
                <NotFoundState
                    title="Return Not Found"
                    text="This return record couldn't be found. It may have been deleted."
                    backLabel="Back to Returns"
                    onBack={() => navigate('/purchase-return')}
                />
            </PrintPage>
        );
    }

    const th = 'py-3 px-3.5';
    const td = 'py-4 px-3.5';

    const totalRet = Number(returnEntry?.totalReturnAmount) || 0;
    const pay = returnEntry?.payment;
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
            <ActionBar backLabel="Back to Returns" onBack={() => navigate('/purchase-return')} onPrint={handlePrint} />

            <Paper>
                <BusinessHeader badge="Purchase Return" />

                <PartySection
                    from={{ name: selectedInvoice.company, phone: selectedInvoice.phone, address: selectedInvoice.address }}
                    shippingAddress={selectedInvoice.shippingAddress}
                >
                    <InfoLine>Purchase Date: {selectedInvoice.purchaseDate}</InfoLine>
                    {returnEntry?.returnDate && <InfoLine tone="orange">Return Date: {returnEntry.returnDate}</InfoLine>}
                    <InvTag no={selectedInvoice.invoiceNo} />
                </PartySection>

                {/* Products */}
                <div className="p-2 sm:p-6">
                    <CardList>
                        {selectedInvoice.items.map((item, index) => {
                            const r = getReturnItemInfo(item.productId);
                            return (
                                <ItemCard
                                    key={index}
                                    index={index + 1}
                                    title={item.productName}
                                    sub={selectedInvoice.company}
                                    total={`৳${Number(r.returnAmount).toFixed(2)}`}
                                    totalLabel="Return Amount"
                                    totalCls="text-orange-600"
                                    boxes={[
                                        { label: 'Return Qty', cls: 'text-orange-600', value: <Qty u={r.returnUnitQty} unit={item.unit} s={r.returnSubQty} sub={item.subUnit} parent={item.parentMode} p={r.returnPcsQty} total={r.returnTotalQty} /> },
                                        { label: 'Return Free Qty', cls: 'text-emerald-600', value: <Qty u={r.returnFreeUnitQty} unit={item.unit} s={r.returnFreeSubQty} sub={item.subUnit} parent={item.parentMode} p={r.returnFreePcsQty} total={r.returnFreeTotalQty} /> },
                                        { label: 'Purchase Price', side: 'right', value: `৳${Number(item.buyPrice).toFixed(2)}` },
                                    ]}
                                />
                            );
                        })}
                    </CardList>
                    <TableBox k="rv">
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Company</th>
                                <th className={`${th} text-right`}>Purchase Price</th>
                                <th className={`${th} text-center`}>Return Qty</th>
                                <th className={`${th} text-center`}>Return Free Qty</th>
                                <th className={`${th} text-right rounded-r-xl`}>Return Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                            {selectedInvoice.items.map((item, index) => {
                                const { returnUnitQty, returnSubQty, returnPcsQty, returnTotalQty, returnFreeUnitQty, returnFreeSubQty, returnFreePcsQty, returnFreeTotalQty, returnAmount } = getReturnItemInfo(item.productId);
                                return (
                                    <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                        <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                        <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                        <td className={`${td} text-slate-600`}>{selectedInvoice.company}</td>
                                        <td className={`${td} text-right font-medium text-slate-600`}>৳{Number(item.buyPrice).toFixed(2)}</td>
                                        <td className={`${td} text-center font-semibold text-orange-600`}>
                                            {returnUnitQty} {item.unit} {item.parentMode && <>{returnSubQty} {item.subUnit} </>}{returnPcsQty} Pcs
                                            <span className="text-[10px] text-brand-700 ml-1 font-bold">(Total: {returnTotalQty})</span>
                                        </td>
                                        <td className={`${td} text-center font-semibold text-emerald-600`}>
                                            {returnFreeUnitQty} {item.unit} {item.parentMode && <>{returnFreeSubQty} {item.subUnit} </>}{returnFreePcsQty} Pcs
                                            <span className="text-[10px] text-emerald-700 ml-1 font-bold">(Total: {returnFreeTotalQty})</span>
                                        </td>
                                        <td className={`${td} text-right font-bold text-orange-600`}>৳{Number(returnAmount).toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </TableBox>
                </div>

                {/* Others Free Return */}
                {selectedInvoice.freeItems && selectedInvoice.freeItems.length > 0 && (
                    <div className="px-2 sm:px-6 pb-3 sm:pb-5">
                        <SectionHeading tone="amber">Others Free Product Return</SectionHeading>
                        <CardList>
                            {selectedInvoice.freeItems.map((item, index) => {
                                const r = getReturnFreeItemInfo(item.productId);
                                return (
                                    <ItemCard
                                        key={index}
                                        index={index + 1}
                                        title={item.productName}
                                        sub={item.company || selectedInvoice.company}
                                        boxes={[
                                            { label: 'Quantity', cls: 'text-emerald-600', value: <Qty u={item.unitQty || 0} unit={item.unit || 'Unit'} s={item.subQty || 0} sub={item.subUnit} parent={item.parentMode} p={item.pcsQty || 0} total={item.totalQty || 0} /> },
                                            { label: 'Return Qty', side: 'right', cls: 'text-amber-600', value: <Qty u={r.returnUnitQty} unit={item.unit || 'Unit'} s={r.returnSubQty} sub={item.subUnit} parent={item.parentMode} p={r.returnPcsQty} total={r.returnTotalQty} /> },
                                        ]}
                                    />
                                );
                            })}
                        </CardList>
                        <TableBox k="rvf">
                            <thead>
                                <tr className={headCls('amber')}>
                                    <th className={`${th} rounded-l-xl`}>SL</th>
                                    <th className={th}>Product Name</th>
                                    <th className={th}>Company</th>
                                    <th className={th}>Quantity</th>
                                    <th className={`${th} text-center rounded-r-xl`}>Return Qty</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100 text-xs sm:text-sm text-slate-700">
                                {selectedInvoice.freeItems.map((item, index) => {
                                    const { returnUnitQty, returnSubQty, returnPcsQty, returnTotalQty } = getReturnFreeItemInfo(item.productId);
                                    return (
                                        <tr key={index} className="hover:bg-amber-50/40 transition-colors">
                                            <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                            <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                            <td className={`${td} text-slate-600`}>{item.company || selectedInvoice.company}</td>
                                            <td className={`${td} font-semibold text-emerald-600`}>
                                                {item.unitQty || 0} {item.unit || 'Unit'} {item.parentMode && <>{item.subQty || 0} {item.subUnit} </>}{item.pcsQty || 0} Pcs
                                                <span className="text-xs text-emerald-700 ml-1 font-bold">(Total: {item.totalQty || 0})</span>
                                            </td>
                                            <td className={`${td} text-center font-semibold text-amber-600`}>
                                                {returnUnitQty} {item.unit || 'Unit'} {item.parentMode && <>{returnSubQty} {item.subUnit} </>}{returnPcsQty} Pcs
                                                <span className="text-[10px] text-amber-700 ml-1 font-bold">(Total: {returnTotalQty})</span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </TableBox>
                    </div>
                )}

                {/* Payment summary + notes */}
                <div className="p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 print:bg-white">
                    <div className="w-full sm:max-w-md space-y-3">
                        <div className="bg-white border border-slate-200 p-4 rounded-xl space-y-2 text-xs sm:text-sm">
                            <div className="flex justify-between text-slate-600">
                                <span>Total Return Amount:</span>
                                <span className="font-bold text-orange-600">৳{totalRet.toFixed(2)}</span>
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

                        {returnEntry?.returnNote && (
                            <div className="bg-orange-50/60 border border-orange-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-orange-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-orange-600" /> Return Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-orange-900/90 italic leading-relaxed">{returnEntry.returnNote}</p>
                            </div>
                        )}
                        {selectedInvoice.orderNote && (
                            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Order Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{selectedInvoice.orderNote}</p>
                            </div>
                        )}
                    </div>
                </div>
            </Paper>
        </PrintPage>
    );
};

export default PurchaseReturnView;