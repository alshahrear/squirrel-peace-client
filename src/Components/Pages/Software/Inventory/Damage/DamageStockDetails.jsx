import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
// path: Software/Inventory/Damage/ থেকে Purchase ফোল্ডারে যায়। ফোল্ডার আলাদা হলে শুধু এই লাইন ঠিক করুন
import { PrintPage, ActionBar, Paper, BusinessHeader, PartySection, InfoLine, InvTag, TableBox, headCls, LoadingState, NotFoundState, CardList, ItemCard, Qty } from '../../Purchase/PurchasePrintUi';

const money = (n) => `৳${Number(n || 0).toFixed(2)}`;

const DamageStockDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [damage, setDamage] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setLoading(true);
        setNotFound(false);
        fetch(`http://localhost:5000/sales-damage/${id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data && data._id) {
                    setDamage(data);
                } else {
                    setNotFound(true);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching damage:', err);
                setNotFound(true);
                setLoading(false);
            });
    }, [id]);

    const handlePrint = () => window.print();

    if (loading) {
        return (
            <PrintPage>
                <LoadingState text="Loading damage..." />
            </PrintPage>
        );
    }

    if (notFound || !damage) {
        return (
            <PrintPage>
                <NotFoundState
                    title="Damage Not Found"
                    text="This damage record couldn't be found. It may have been deleted."
                    backLabel="Back to Damage"
                    onBack={() => navigate('/damage-stock-invoice')}
                />
            </PrintPage>
        );
    }

    const items = damage.items || [];
    const hasCustomer = !!damage.customerId;
    const th = 'py-3 px-3.5';
    const td = 'py-4 px-3.5';

    // দাম / cost অংশ (customer থাকলে sell price, না থাকলে batch cost)
    const priceNode = (item, compact = false) => {
        if (hasCustomer) {
            return (
                <div className={compact ? '' : 'space-y-0.5'}>
                    <div>{item.unit}: {money(item.sellPriceUnit)}</div>
                    <div className="text-[11px] text-slate-400">Pcs: {money(item.sellPricePcs)}</div>
                </div>
            );
        }
        const lines = item.costBreakdown || [];
        if (lines.length === 0) return <span className="text-slate-300">—</span>;
        return (
            <div className="space-y-0.5">
                {lines.map((l, i) => (
                    <div key={i} className="text-[11px] text-slate-500">
                        #{l.invoiceNo}: {l.qty} pcs × {money(l.cost)} ={' '}
                        <span className="font-semibold text-slate-700">{money(l.amount)}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <PrintPage>
            <ActionBar backLabel="Back to Damage" onBack={() => navigate('/damage-stock-invoice')} onPrint={handlePrint} />

            <Paper>
                <BusinessHeader badge="Damage" />

                <PartySection
                    from={{
                        name: damage.customer || 'Stock Damage (No Customer)',
                        phone: damage.phone,
                        address: damage.address,
                    }}
                    showShipping={false}
                >
                    <InfoLine tone="orange">Damage Date: {damage.damageDate || 'N/A'}</InfoLine>
                    {damage.company && (
                        <p className="text-xs text-slate-500 sm:text-right">
                            Company: <span className="font-semibold text-slate-700">{damage.company}</span>
                        </p>
                    )}
                    <InvTag no={damage.invoiceNo} />
                </PartySection>

                {/* Products */}
                <div className="p-4 sm:p-6">
                    {/* Mobile cards */}
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
                                        label: 'Damage Qty',
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
                                        label: 'Damage Free Qty',
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
                                    {
                                        label: hasCustomer ? 'Sell Price' : 'Cost Price',
                                        value: priceNode(item, true),
                                        side: 'right',
                                    },
                                ]}
                            />
                        ))}
                    </CardList>

                    {/* Tablet / Desktop / Print table */}
                    <TableBox k="main">
                        <thead>
                            <tr className={headCls('brand')}>
                                <th className={`${th} rounded-l-xl`}>SL</th>
                                <th className={th}>Product Name</th>
                                <th className={th}>Company</th>
                                <th className={`${th} text-right`}>{hasCustomer ? 'Sell Price' : 'Cost Price'}</th>
                                <th className={`${th} text-center`}>Damage Qty</th>
                                <th className={`${th} text-center`}>Damage Free Qty</th>
                                <th className={`${th} text-right rounded-r-xl`}>Item Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                            {items.map((item, index) => (
                                <tr key={index} className="hover:bg-slate-50/70 transition-colors">
                                    <td className={`${td} font-medium text-slate-400`}>{index + 1}</td>
                                    <td className={`${td} font-semibold text-slate-800`}>{item.productName}</td>
                                    <td className={`${td} text-slate-600`}>{item.company}</td>
                                    <td className={`${td} text-right font-medium text-slate-600`}>{priceNode(item)}</td>
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

                {/* Totals + Note */}
                <div className="p-4 sm:p-6 bg-slate-50/60 border-t border-slate-200 flex flex-col-reverse sm:flex-row justify-between items-start gap-4 print:bg-white">
                    <div className="w-full sm:w-1/2">
                        {damage.note && (
                            <div className="bg-emerald-50/60 border border-emerald-200/70 p-4 rounded-xl">
                                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-1.5 flex items-center gap-1.5">
                                    <FileText className="w-3.5 h-3.5 text-emerald-600" /> Damage Note:
                                </h4>
                                <p className="text-xs sm:text-sm text-emerald-900/90 italic leading-relaxed">{damage.note}</p>
                            </div>
                        )}
                    </div>

                    <div className="w-full sm:w-80 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
                        <div className="flex justify-between py-1 text-sm sm:text-base font-bold text-slate-900">
                            <span>Damage Amount:</span>
                            <span className="text-rose-600">{money(damage.damageAmount)}</span>
                        </div>
                    </div>
                </div>
            </Paper>
        </PrintPage>
    );
};

export default DamageStockDetails;