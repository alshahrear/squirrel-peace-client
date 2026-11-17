import React from 'react';
import { Printer, Phone, Mail, MapPin, Building2, ArrowLeft, PackageX, Calendar } from 'lucide-react';

// P1-2: dealer er header pore ekhane ek jaygay change korlei 3 ta page e hobe
const BUSINESS = {
    name: 'ইসরাইল এন্টারপ্রাইজ',
    address: 'শাহজী পাড়া, বড় বাজার, মেহেরপুর',
    phone: '01997074920',
    email: 'jakoberjak2017@gmail.com',
};
const BILL_TO = { name: 'Demo Enterprise', phone: '01612002913' };

// Mobile (768px er niche) e table row gulo card hoye jabe. Print e kono change hobe na.
const LABELS = {
    main: ['', '', 'Company', 'Quantity', 'Total Quantity', 'Cost Price', 'Sell Price', 'Discount', 'Item Total'],
    free: ['', '', 'Company', 'Quantity', 'Sell Price (PCS)'],
    ret: ['', '', 'Company', 'Quantity', 'Free Quantity', 'Buy Price (PCS)', 'Item Total'],
    rv: ['', '', 'Company', 'Purchase Price', 'Return Qty', 'Return Free Qty', 'Return Amount'],
    rvf: ['', '', 'Company', 'Quantity', 'Return Qty'],
    bulk: ['', '', 'Company', 'Purchase Price', 'Return Qty', 'Return Free Qty', 'Item Total'],
};
const SPANS = {
    main: [2, 3, 4, 5],
    free: [2, 3, 4, 5],
    ret: [2, 3, 4, 5],
    rv: [2, 3, 5, 6],
    rvf: [2, 3, 4, 5],
    bulk: [2, 3, 5, 6],
};

const PrintStyle = () => {
    const css = Object.keys(LABELS)
        .map(
            (k) =>
                LABELS[k].map((l, i) => (l ? `.pt-${k} td:nth-child(${i + 1})::before{content:"${l}"}` : '')).join('') +
                SPANS[k].map((n) => `.pt-${k} td:nth-child(${n}){grid-column:span 2}`).join('')
        )
        .join('');
    return (
        <style>{`
@media screen and (max-width:767px){
  .pt-cards{overflow:visible!important}
  .pt-cards table{display:block!important;min-width:0!important;width:100%!important}
  .pt-cards thead{display:none!important}
  .pt-cards tbody{display:block!important}
  .pt-cards tbody tr{display:grid;grid-template-columns:1fr 1fr;column-gap:10px;margin-bottom:12px;padding:10px 14px;border:1px solid #e2e8f0;border-radius:1rem;background:#fff}
  .pt-cards td{display:block!important;min-width:0;padding:6px 0!important;text-align:left!important;white-space:normal!important;border:0!important}
  .pt-cards td::before{display:block;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#94a3b8;margin-bottom:2px}
  .pt-cards td:first-child{display:none!important}
  .pt-cards td:nth-child(2){font-size:15px}
  ${css}
}
`}</style>
    );
};

export const PrintPage = ({ children }) => (
    <div className="min-h-screen p-3 sm:p-5 md:p-8 print:bg-white print:p-0">
        <PrintStyle />
        <div className="max-w-6xl mx-auto space-y-4 print:space-y-0 print:max-w-full">{children}</div>
    </div>
);

export const ActionBar = ({ backLabel, onBack, onPrint, printLabel = 'Print' }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 flex items-center justify-between gap-3 print:hidden">
        <button
            type="button"
            onClick={onBack}
            className="h-10 px-4 min-w-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
        >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span className="truncate">{backLabel}</span>
        </button>
        <button
            type="button"
            onClick={onPrint}
            className="bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
            <Printer className="w-4 h-4" /> {printLabel}
        </button>
    </div>
);

export const Paper = ({ children }) => (
    <div className="flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden print:border-none print:rounded-none">
        {children}
    </div>
);

export const BusinessHeader = ({ badge }) => (
    <div className="px-4 sm:px-8 py-5 sm:py-7 bg-brand-50/60 border-b border-slate-200 print:bg-white print:border-b-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-brand-100 flex items-center justify-center shrink-0 print:hidden">
                    <Building2 className="w-6 h-6 text-brand-600" />
                </div>
                <div className="min-w-0">
                    {badge && (
                        <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-white border border-brand-100 px-2.5 py-0.5 rounded-md mb-1.5 uppercase">
                            {badge}
                        </span>
                    )}
                    <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800">{BUSINESS.name}</h1>
                    <p className="text-xs sm:text-sm text-slate-500 flex items-start gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0 print:hidden" /> {BUSINESS.address}
                    </p>
                </div>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 space-y-1 sm:text-right">
                <p className="flex items-center sm:justify-end gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 print:hidden" /> {BUSINESS.phone}
                </p>
                <p className="flex items-center sm:justify-end gap-2 break-all">
                    <Mail className="w-3.5 h-3.5 text-slate-400 print:hidden" /> {BUSINESS.email}
                </p>
            </div>
        </div>
    </div>
);

const Tag = ({ children }) => (
    <span className="inline-block text-[11px] font-bold tracking-widest text-brand-700 bg-brand-50 px-2.5 py-1 rounded-md mb-2 uppercase">
        {children}
    </span>
);

export const PartySection = ({ from, shippingAddress, showShipping = true, children }) => (
    <div className="p-4 sm:p-6 bg-slate-50/60 border-b border-slate-200 print:bg-white">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
                <Tag>Bill From</Tag>
                <p className="font-bold text-slate-800">{from.name}</p>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">{from.phone}</p>
                <p className="text-xs sm:text-sm text-slate-600">{from.address}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 print:border-none print:p-0">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
                    <div>
                        <Tag>Bill To</Tag>
                        <p className="font-bold text-slate-800 text-lg leading-tight">{BILL_TO.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{BILL_TO.phone}</p>
                        {showShipping && <p className="text-xs text-slate-500">{shippingAddress || 'N/A'}</p>}
                    </div>
                    <div className="sm:text-right shrink-0 space-y-1.5">{children}</div>
                </div>
            </div>
        </div>
    </div>
);

export const InfoLine = ({ tone = 'slate', children }) => (
    <p className={`text-xs flex items-center sm:justify-end gap-1.5 ${tone === 'orange' ? 'text-orange-600' : 'text-slate-500'}`}>
        <Calendar className="w-3.5 h-3.5 shrink-0" /> {children}
    </p>
);

export const InvTag = ({ no }) => (
    <p className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg inline-block">
        Inv: <span className="text-brand-700">{no}</span>
    </p>
);

export const Toggle = ({ label, on, onClick, onCls = 'bg-emerald-500', txtCls = 'text-emerald-600' }) => (
    <button type="button" role="switch" aria-checked={on} onClick={onClick} className="h-10 flex items-center gap-2.5 cursor-pointer">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 ${on ? onCls : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : ''}`} />
        </span>
        <span className={`text-xs font-bold ${on ? txtCls : 'text-slate-400'}`}>{on ? 'ON' : 'OFF'}</span>
    </button>
);

// k = main | free | ret | rv | rvf | bulk  (mobile card label set)
// Table: md er upore ar print e. Mobile e CardList / ItemCard dekhabe.
export const TableBox = ({ children }) => (
    <div className="hidden md:block print:block overflow-x-auto">
        <table className="w-full min-w-[720px] print:min-w-0 text-left border-collapse">{children}</table>
    </div>
);

export const CardList = ({ children }) => <div className="md:hidden print:hidden space-y-1.5">{children}</div>;

// boxes: [{ label, value, cls, span }]
export const ItemCard = ({ index, title, sub, boxes = [], total, totalLabel = 'Item Total', totalCls = 'text-slate-900' }) => {
    const hasSide = boxes.some((b) => b.side);
    const left = hasSide ? boxes.filter((b) => b.side !== 'right') : boxes;
    const right = hasSide ? boxes.filter((b) => b.side === 'right') : [];
    const Row = ({ b }) => (
        <div className="min-w-0 leading-tight">
            <span className="text-[8.5px] uppercase text-slate-400 font-bold mr-1">{b.label}:</span>
            <span className={`text-[10.5px] font-semibold break-words ${b.cls || 'text-slate-700'}`}>{b.value}</span>
        </div>
    );
    return (
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-1.5">
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex items-center gap-1.5">
                    <span className="shrink-0 w-4 h-4 rounded-full bg-brand-50 text-brand-700 text-[9px] font-bold flex items-center justify-center">
                        {index}
                    </span>
                    <p className="font-bold text-[12px] text-slate-800 truncate leading-tight min-w-0">
                        {title}
                        {sub && <span className="ml-1 text-[10px] font-medium text-slate-400">· {sub}</span>}
                    </p>
                </div>
                {total !== undefined && (
                    <div className="shrink-0 flex items-center gap-1 rounded-md bg-white border border-slate-200 px-1.5 py-px">
                        <span className="text-[8px] uppercase text-slate-400 font-bold">{totalLabel}</span>
                        <span className={`text-[11px] font-bold ${totalCls}`}>{total}</span>
                    </div>
                )}
            </div>
            <div className="flex items-start justify-between gap-2 mt-1">
                <div className="min-w-0 flex-1 space-y-0.5">
                    {left.map((b) => (
                        <Row key={b.label} b={b} />
                    ))}
                </div>
                {right.length > 0 && (
                    <div className="shrink-0 space-y-0.5 text-right">
                        {right.map((b) => (
                            <Row key={b.label} b={b} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const Qty = ({ u, unit, s, sub, parent, p, total, label }) => (
    <>
        {label && <span className="font-bold mr-1">{label}</span>}
        {u} {unit} {parent && <>{s} {sub} </>}{p} Pcs{' '}
        <b className="px-1.5 py-0.5 rounded-md text-[11px] font-extrabold bg-brand-50 text-brand-700">({total})</b>
    </>
);

// Bulk return / Damage items (PurchaseDetails) er mobile card
export const ReturnItemCards = ({ items }) => (
    <CardList>
        {items.map((item, i) => (
            <ItemCard
                key={i}
                index={i + 1}
                title={item.productName}
                sub={item.company}
                total={`৳${Number(item.itemTotal ?? item.subtotal ?? 0).toFixed(2)}`}
                boxes={[
                    { label: 'Quantity', cls: 'text-orange-600', value: <Qty u={item.unitQty || 0} unit={item.unit} s={item.subQty || 0} sub={item.subUnit} parent={item.parentMode} p={item.pcsQty || 0} total={item.totalQty} /> },
                    { label: 'Free Quantity', cls: 'text-emerald-600', value: <Qty u={item.freeUnitQty || 0} unit={item.unit} s={item.freeSubQty || 0} sub={item.subUnit} parent={item.parentMode} p={item.freePcsQty || 0} total={item.freeQty || 0} /> },
                    { label: 'Buy Price (PCS)', value: `৳${Number(item.buyPrice || 0).toFixed(2)}`, span: true },
                ]}
            />
        ))}
    </CardList>
);

const HEADS = {
    brand: 'bg-slate-100 text-slate-600',
    amber: 'bg-amber-100/70 text-amber-800',
    violet: 'bg-violet-100/70 text-violet-800',
    red: 'bg-red-100/70 text-red-800',
};
export const headCls = (tone = 'brand') =>
    `${HEADS[tone]} text-[11px] font-bold uppercase tracking-wider whitespace-nowrap print:bg-slate-100 print:text-slate-600`;

const HEAD_TXT = { amber: 'text-amber-700', violet: 'text-violet-700', red: 'text-red-700' };
export const SectionHeading = ({ id, tone = 'amber', children }) => (
    <h4 id={id} className={`scroll-mt-24 text-xs font-bold uppercase mb-3 flex items-center gap-1.5 ${HEAD_TXT[tone]}`}>
        {children}
    </h4>
);

export const LoadingState = ({ text }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
        <div className="h-20 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
        <div className="h-48 rounded-2xl bg-slate-100 animate-pulse" />
        <p className="text-center text-sm text-slate-400">{text}</p>
    </div>
);

export const NotFoundState = ({ title, text, backLabel, onBack }) => (
    <div className="min-h-[60vh] flex items-center justify-center">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                <PackageX className="w-7 h-7 text-rose-500" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">{title}</h2>
            <p className="text-slate-500 text-sm mt-2">{text}</p>
            <button
                type="button"
                onClick={onBack}
                className="mt-5 bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 inline-flex items-center gap-2 cursor-pointer"
            >
                <ArrowLeft className="w-4 h-4" /> {backLabel}
            </button>
        </div>
    </div>
);