import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
// NOTE: PurchasePrintUi er path tomar folder structure onujayi thik kore nio
import {
    PrintPage,
    ActionBar,
    Paper,
    BusinessHeader,
    InfoLine,
    InvTag,
    TableBox,
    headCls,
    LoadingState,
    NotFoundState,
    CardList,
    ItemCard,
    Qty,
} from '../Purchase/PurchasePrintUi';

// Original design er moto Return To = Demo Enterprise (dealer info pore change korle ekhane korbe)
const RETURN_TO = { name: 'Demo Enterprise', phone: '01612002913' };

const th = 'py-3 px-3.5';
const td = 'py-4 px-3.5';

const Tag = ({ children }) => (
    <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md mb-2 uppercase">
        {children}
    </span>
);

const PartyBlock = ({ bulk }) => (
    <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-slate-200 print:bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
                <Tag>Return From</Tag>
                <p className="font-bold text-slate-800">{bulk.customer}</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{bulk.phone}</p>
                <p className="text-xs sm:text-sm text-slate-600">{bulk.address}</p>
                {bulk.company && (
                    <p className="text-xs text-slate-500 mt-1">
                        Company: <span className="font-semibold text-slate-700">{bulk.company}</span>
                    </p>
                )}
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                        <Tag>Return To</Tag>
                        <p className="font-bold text-slate-800 text-lg leading-tight">{RETURN_TO.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{RETURN_TO.phone}</p>
                    </div>
                    <div className="sm:text-right shrink-0 space-y-1.5">
                        <InfoLine tone="orange">Return Date: {bulk.returnDate || 'N/A'}</InfoLine>
                        <InvTag no={bulk.invoiceNo} />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const SalesBulkDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [bulkReturn, setBulkReturn] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/sales-bulk-return/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) setBulkReturn(data);
                else setNotFound(true);
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
                    onBack={() => navigate('/sales-bulk-return')}
                />
            </PrintPage>
        );
    }

    const items = bulkReturn.items || [];
    const num = (v) => Number(v) || 0;
    const money = (v) => `৳${num(v).toFixed(2)}`;

    const totalRet = num(bulkReturn.returnAmount);
    const pay = bulkReturn.payment;
    const paid = pay ? num(pay.amount) : 0;
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
            <ActionBar backLabel="Back to Bulk Returns" onBack={() => navigate('/sales-bulk-return')} onPrint={handlePrint} />

            <Paper>
                <BusinessHeader badge="Sales Bulk Return" />

                <PartyBlock bulk={bulkReturn} />

                {/* Products */}
                <div className="p-2 sm:p-6">
                    <CardList>
                        {items.map((item, index) => (
                            <ItemCard
                                key={index}
                                index={index + 1}
                                title={item.productName}
                                sub={item.company}
                                total={money(item.itemTotal ?? item.subtotal ?? 0)}
                                totalCls="text-orange-600"
                                boxes={[
                                    { label: 'Return Qty', cls: 'text-orange-600', value: <Qty u={num(item.unitQty)} unit={item.unit} s={num(item.subQty)} sub={item.subUnit} parent={item.parentMode} p={num(item.pcsQty)} total={num(item.totalQty)} /> },
                                    { label: 'Return Free Qty', cls: 'text-emerald-600', value: <Qty u={num(item.freeUnitQty)} unit={item.unit} s={num(item.freeSubQty)} sub={item.subUnit} parent={item.parentMode} p={num(item.freePcsQty)} total={num(item.freeQty)} /> },
                                    { label: `Price (${item.unit || 'Unit'})`, side: 'right', value: money(item.sellPriceUnit) },
                                    { label: 'Price (PCS)', side: 'right', value: money(item.sellPricePcs) },
                                ]}
                            />
                        ))}
                    </CardList>
                    <TableBox>
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Company</th>
                                <th className={`${th} text-right`}>Sell Price</th>
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
                                    <td className={`${td} text-right font-medium text-slate-600 whitespace-nowrap`}>
                                        <div>{item.unit}: {money(item.sellPriceUnit)}</div>
                                        <div className="text-[11px] text-slate-400">Pcs: {money(item.sellPricePcs)}</div>
                                    </td>
                                    <td className={`${td} text-center font-semibold text-orange-600`}>
                                        {num(item.unitQty)} {item.unit} {item.parentMode && <>{num(item.subQty)} {item.subUnit} </>}{num(item.pcsQty)} Pcs
                                        <span className="text-[10px] text-brand-700 ml-1 font-bold">(Total: {num(item.totalQty)})</span>
                                    </td>
                                    <td className={`${td} text-center font-semibold text-emerald-600`}>
                                        {num(item.freeUnitQty)} {item.unit} {item.parentMode && <>{num(item.freeSubQty)} {item.subUnit} </>}{num(item.freePcsQty)} Pcs
                                        <span className="text-[10px] text-emerald-700 ml-1 font-bold">(Total: {num(item.freeQty)})</span>
                                    </td>
                                    <td className={`${td} text-right font-bold text-orange-600`}>{money(item.itemTotal ?? item.subtotal ?? 0)}</td>
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
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Return Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{bulkReturn.note}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between py-1 text-sm sm:text-base font-bold text-slate-900">
                            <span>Return Amount:</span>
                            <span className="text-orange-600">{money(totalRet)}</span>
                        </div>
                        <div className="flex justify-between items-center text-slate-600">
                            <span>Return Payment Paid:</span>
                            {pay ? (
                                <span className="font-bold text-emerald-600">{money(paid)}</span>
                            ) : (
                                <span className="inline-block px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-semibold text-[10px]">Not Paid</span>
                            )}
                        </div>
                        {pay && (
                            <div className="flex justify-between text-slate-600 border-t border-dashed border-slate-300 pt-2">
                                <span>{diff > 0 ? 'Still Payable:' : diff < 0 ? 'Extra Paid:' : 'Status:'}</span>
                                <span className={`font-bold ${diff > 0 ? 'text-rose-600' : diff < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                    {diff === 0 ? 'Fully Paid' : money(Math.abs(diff))}
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

export default SalesBulkDetails;