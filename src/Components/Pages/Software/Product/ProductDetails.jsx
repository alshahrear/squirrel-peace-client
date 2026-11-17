import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft, FaBoxOpen, FaBuilding, FaBarcode, FaLayerGroup, FaBell, FaShoppingCart,
    FaMoneyBillWave, FaTag, FaBalanceScale, FaGift, FaStickyNote, FaClock, FaChartLine, FaPercentage,
} from 'react-icons/fa';

const InfoCard = ({ icon, label, children, iconBg = 'bg-brand-50 text-brand-600', className = '' }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 px-3.5 py-3 flex items-center gap-3 ${className}`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>{icon}</div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">{label}</p>
            <div className="text-sm font-semibold text-slate-800 break-words">{children}</div>
        </div>
    </div>
);

const StatCard = ({ label, value, valueClass }) => (
    <div className="bg-white rounded-2xl border border-slate-200 px-3.5 py-3 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1.5">{label}</p>
        <p className={`text-lg sm:text-xl font-extrabold ${valueClass}`}>{value}</p>
    </div>
);

const NA = () => <span className="text-slate-400 italic font-normal">N/A</span>;
const formatMoney = (value) => '৳ ' + (value ? Number(value).toLocaleString() : '0');

// "23/10/2026, 8:03:51 pm" -> "23 Oct 2026"
const formatCreatedDate = (value) => {
    if (!value) return '';
    const datePart = value.split(/[ ,]/)[0];
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return value;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return value;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const BackBtn = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 px-4 min-h-[40px] rounded-full bg-white text-brand-700 text-sm font-semibold border border-slate-200 hover:bg-brand-50 transition cursor-pointer"
    >
        <FaArrowLeft size={12} /> Back to Products
    </button>
);

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch('http://localhost:5000/product', { cache: 'no-store' });
                const data = await res.json();
                const found = (Array.isArray(data) ? data : []).find((p) => String(p._id) === String(id));
                if (found) setProduct(found);
                else setNotFound(true);
            } catch (error) {
                console.error('Error fetching product:', error);
                setNotFound(true);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-[60vh] p-3 sm:p-5 md:p-8" aria-busy="true">
                <div className="max-w-7xl mx-auto space-y-4">
                    <div className="h-10 w-44 rounded-full bg-slate-200/70 animate-pulse" />
                    <div className="h-36 rounded-2xl bg-slate-200/70 animate-pulse" />
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-200/70 animate-pulse" />)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[...Array(8)].map((_, i) => <div key={i} className="h-16 rounded-2xl bg-slate-200/70 animate-pulse" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FaBoxOpen size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Product Not Found</h2>
                    <p className="text-sm text-slate-500 mb-6">This product does not exist or has been deleted.</p>
                    <BackBtn onClick={() => navigate('/product')} />
                </div>
            </div>
        );
    }

    const initials = (product.productName || 'P').trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();

    const purchase = Number(product.purchasePrice) || 0;
    const selling = Number(product.sellingPrice) || 0;
    const profit = selling - purchase;
    const profitPercent = purchase > 0 ? ((profit / purchase) * 100).toFixed(1) : '0';

    const hasSubUnit = !!product.subUnit;
    const freeSub = Number(product.freeProductSubQty) || 0;
    const freePcs = Number(product.freeProductPcsQty) || 0;
    const freeTotal = hasSubUnit ? freeSub * (Number(product.subUnitQty) || 0) + freePcs : freePcs;

    const unitSummary = hasSubUnit
        ? `${product.parentUnit || product.unit} (${product.parentQty || 0} ${product.subUnit}) • ${product.subUnit} (${product.subUnitQty || 0} pcs)`
        : `${product.unit || 'N/A'} (${product.pcsOfUnit || '0'} pcs)`;

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <div className="max-w-7xl mx-auto space-y-4">
                <BackBtn onClick={() => navigate('/product')} />

                {/* Hero */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-600 to-brand-800 px-4 sm:px-6 py-5">
                    <div className="absolute -top-12 -right-10 w-44 h-44 bg-white/10 rounded-full" />
                    <div className="absolute -bottom-16 -left-10 w-48 h-48 bg-white/10 rounded-full" />
                    <div className="relative flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-xl sm:text-2xl font-extrabold shrink-0">
                            {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${product.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {product.category && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold">{product.category}</span>
                                )}
                            </div>
                            <h1 className="text-xl sm:text-3xl font-extrabold text-white break-words leading-tight">{product.productName}</h1>
                            <p className="text-white/80 text-xs sm:text-sm mt-1">Company: {product.company || 'N/A'}</p>
                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                                {product.sku && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                                        <FaBarcode size={10} /> {product.sku}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold max-w-full">
                                    <FaBalanceScale size={10} className="shrink-0" /> <span className="truncate">{unitSummary}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price & Profit */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <StatCard label="Purchase Price" value={formatMoney(product.purchasePrice)} valueClass="text-rose-600" />
                    <StatCard label="Selling Price" value={formatMoney(product.sellingPrice)} valueClass="text-emerald-600" />
                    <StatCard label="MRP" value={formatMoney(product.mrp)} valueClass="text-brand-700" />
                    <StatCard label="Profit / PCS" value={`৳ ${profit.toLocaleString()}`} valueClass={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
                    <div className="col-span-2 lg:col-span-1">
                        <StatCard label="Profit Margin" value={`${profitPercent}%`} valueClass={profit >= 0 ? 'text-brand-700' : 'text-rose-600'} />
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCard icon={<FaBoxOpen size={16} />} label="Product Name">{product.productName || <NA />}</InfoCard>
                    <InfoCard icon={<FaBuilding size={16} />} label="Company">{product.company || <NA />}</InfoCard>
                    <InfoCard icon={<FaBarcode size={16} />} label="SKU" iconBg="bg-slate-100 text-slate-600">{product.sku || <NA />}</InfoCard>
                    <InfoCard icon={<FaLayerGroup size={16} />} label="Category" iconBg="bg-amber-50 text-amber-600">{product.category || <NA />}</InfoCard>
                    <InfoCard icon={<FaBell size={16} />} label="Alert Quantity" iconBg="bg-amber-50 text-amber-600">
                        <span className="text-amber-600">{product.alertQuantity || '0'} pcs</span>
                    </InfoCard>
                    <InfoCard icon={<FaShoppingCart size={16} />} label="Purchase Price (PCS)" iconBg="bg-rose-50 text-rose-600">
                        <span className="text-rose-600">{formatMoney(product.purchasePrice)}</span>
                    </InfoCard>
                    <InfoCard icon={<FaMoneyBillWave size={16} />} label="Selling Price (PCS)" iconBg="bg-emerald-50 text-emerald-600">
                        <span className="text-emerald-600">{formatMoney(product.sellingPrice)}</span>
                    </InfoCard>
                    <InfoCard icon={<FaTag size={16} />} label="MRP (PCS)">
                        <span className="text-brand-700">{formatMoney(product.mrp)}</span>
                    </InfoCard>

                    <InfoCard icon={<FaBalanceScale size={16} />} label="Unit / Pcs" className="sm:col-span-2">
                        {hasSubUnit ? (
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                <span>{product.parentUnit || product.unit} ({product.parentQty || 0} {product.subUnit})</span>
                                <span>{product.subUnit} ({product.subUnitQty || 0} pcs)</span>
                                <span className="text-brand-700">Total {product.pcsOfUnit || 0} pcs</span>
                            </div>
                        ) : (
                            <span>{product.unit || 'N/A'} ({product.pcsOfUnit || '0'} pcs)</span>
                        )}
                    </InfoCard>

                    <InfoCard icon={<FaGift size={16} />} label="Free Product Qty" iconBg="bg-pink-50 text-pink-600" className="sm:col-span-2">
                        {freeSub || freePcs ? (
                            <>
                                {hasSubUnit && `${freeSub} ${product.subUnit} `}
                                {freePcs} Pcs
                                <span className="text-xs text-pink-500 ml-1.5 font-bold">(Total: {freeTotal} pcs)</span>
                            </>
                        ) : (
                            <span className="text-slate-400 italic font-normal">None</span>
                        )}
                    </InfoCard>

                    <InfoCard icon={<FaChartLine size={16} />} label="Status" iconBg="bg-emerald-50 text-emerald-600">
                        <span className={product.isActive ? 'text-emerald-700' : 'text-rose-700'}>{product.isActive ? 'Active' : 'Inactive'}</span>
                    </InfoCard>
                    <InfoCard icon={<FaPercentage size={16} />} label="Profit Margin">
                        <span className={profit >= 0 ? 'text-brand-700' : 'text-rose-600'}>{profitPercent}%</span>
                    </InfoCard>
                    <InfoCard icon={<FaClock size={16} />} label="Created At" className="sm:col-span-2">
                        {product.createdAt ? formatCreatedDate(product.createdAt) : <NA />}
                    </InfoCard>
                </div>

                {/* Note */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4">
                    <div className="flex items-center gap-2.5 mb-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FaStickyNote size={14} />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800">Note</h3>
                    </div>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {product.note || <span className="text-slate-400 italic">No note available for this product.</span>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;