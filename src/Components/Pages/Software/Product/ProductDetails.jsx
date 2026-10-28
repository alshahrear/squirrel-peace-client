import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaArrowLeft,
    FaBoxOpen,
    FaBuilding,
    FaBarcode,
    FaLayerGroup,
    FaBell,
    FaShoppingCart,
    FaMoneyBillWave,
    FaTag,
    FaBalanceScale,
    FaGift,
    FaStickyNote,
    FaClock,
    FaChartLine,
    FaPercentage,
} from 'react-icons/fa';

const InfoCard = ({ icon, label, children, iconBg = 'bg-indigo-50 text-indigo-600', className = '' }) => (
    <div className={`bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all px-3.5 py-3 flex items-center gap-3 ${className}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">{label}</p>
            <div className="text-[13px] font-semibold text-gray-800 break-words">
                {children}
            </div>
        </div>
    </div>
);

const StatCard = ({ label, value, valueClass, border }) => (
    <div className={`bg-white rounded-xl border ${border} shadow-sm px-3.5 py-2.5 text-center`}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">{label}</p>
        <p className={`text-lg font-extrabold ${valueClass}`}>{value}</p>
    </div>
);

const NA = () => <span className="text-gray-400 italic font-normal">N/A</span>;

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

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch('https://squirrel-peace-server.onrender.com/product', { cache: 'no-store' });
                const data = await res.json();
                const found = (Array.isArray(data) ? data : []).find((p) => String(p._id) === String(id));
                if (found) {
                    setProduct(found);
                } else {
                    setNotFound(true);
                }
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
            <div className="min-h-[60vh] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-indigo-600">Loading details...</p>
                </div>
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="min-h-[60vh] bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FaBoxOpen size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Product Not Found</h2>
                    <p className="text-sm text-gray-500 mb-6">This product does not exist or has been deleted.</p>
                    <button
                        onClick={() => navigate('/product')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer"
                    >
                        <FaArrowLeft size={12} /> Back to Products
                    </button>
                </div>
            </div>
        );
    }

    const initials = (product.productName || 'P')
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

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
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-4 px-4 sm:px-5 lg:px-12">
            <div className="w-full space-y-4">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white text-indigo-600 text-xs font-bold shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
                >
                    <FaArrowLeft size={11} /> Back to Products
                </button>

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg px-5 py-4">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-14 -left-8 w-44 h-44 bg-white/10 rounded-full"></div>

                    <div className="relative flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                        <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl font-extrabold shadow-md shrink-0">
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {product.category && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md">
                                        {product.category}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-white break-words leading-tight">
                                {product.productName}
                            </h1>
                            <p className="text-indigo-100 text-xs mt-0.5">
                                Company: {product.company || 'N/A'}
                            </p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2.5">
                                {product.sku && (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-md">
                                        <FaBarcode size={10} /> {product.sku}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-[11px] font-semibold backdrop-blur-md">
                                    <FaBalanceScale size={10} /> {unitSummary}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Price & Profit Summary */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <StatCard label="Purchase Price" value={formatMoney(product.purchasePrice)} valueClass="text-rose-600" border="border-rose-100" />
                    <StatCard label="Selling Price" value={formatMoney(product.sellingPrice)} valueClass="text-emerald-600" border="border-emerald-100" />
                    <StatCard label="MRP" value={formatMoney(product.mrp)} valueClass="text-indigo-600" border="border-indigo-100" />
                    <StatCard
                        label="Profit / PCS"
                        value={`৳ ${profit.toLocaleString()}`}
                        valueClass={profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}
                        border="border-emerald-100"
                    />
                    <StatCard
                        label="Profit Margin"
                        value={`${profitPercent}%`}
                        valueClass={profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}
                        border="border-indigo-100"
                    />
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <InfoCard icon={<FaBoxOpen size={15} />} label="Product Name">
                        {product.productName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaBuilding size={15} />} label="Company" iconBg="bg-purple-50 text-purple-600">
                        {product.company || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaBarcode size={15} />} label="SKU" iconBg="bg-sky-50 text-sky-600">
                        {product.sku || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaLayerGroup size={15} />} label="Category" iconBg="bg-amber-50 text-amber-600">
                        {product.category || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaBell size={15} />} label="Alert Quantity" iconBg="bg-amber-50 text-amber-600">
                        <span className="text-amber-600">{product.alertQuantity || '0'} pcs</span>
                    </InfoCard>

                    <InfoCard icon={<FaShoppingCart size={15} />} label="Purchase Price (PCS)" iconBg="bg-rose-50 text-rose-600">
                        <span className="text-rose-600">{formatMoney(product.purchasePrice)}</span>
                    </InfoCard>

                    <InfoCard icon={<FaMoneyBillWave size={15} />} label="Selling Price (PCS)" iconBg="bg-emerald-50 text-emerald-600">
                        <span className="text-emerald-600">{formatMoney(product.sellingPrice)}</span>
                    </InfoCard>

                    <InfoCard icon={<FaTag size={15} />} label="MRP (PCS)" iconBg="bg-indigo-50 text-indigo-600">
                        <span className="text-indigo-600">{formatMoney(product.mrp)}</span>
                    </InfoCard>

                    <InfoCard
                        icon={<FaBalanceScale size={15} />}
                        label="Unit / Pcs"
                        iconBg="bg-indigo-50 text-indigo-600"
                        className="sm:col-span-2"
                    >
                        {hasSubUnit ? (
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                                <span>{product.parentUnit || product.unit} ({product.parentQty || 0} {product.subUnit})</span>
                                <span>{product.subUnit} ({product.subUnitQty || 0} pcs)</span>
                                <span className="text-indigo-600">Total {product.pcsOfUnit || 0} pcs</span>
                            </div>
                        ) : (
                            <span>{product.unit || 'N/A'} ({product.pcsOfUnit || '0'} pcs)</span>
                        )}
                    </InfoCard>

                    <InfoCard
                        icon={<FaGift size={15} />}
                        label="Free Product Qty"
                        iconBg="bg-pink-50 text-pink-600"
                        className="sm:col-span-2"
                    >
                        {freeSub || freePcs ? (
                            <>
                                {hasSubUnit && `${freeSub} ${product.subUnit} `}
                                {freePcs} Pcs
                                <span className="text-xs text-pink-500 ml-1.5 font-bold">(Total: {freeTotal} pcs)</span>
                            </>
                        ) : (
                            <span className="text-gray-400 italic font-normal">None</span>
                        )}
                    </InfoCard>

                    <InfoCard icon={<FaChartLine size={15} />} label="Status" iconBg="bg-emerald-50 text-emerald-600">
                        <span className={product.isActive ? 'text-green-700' : 'text-red-700'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </InfoCard>

                    <InfoCard icon={<FaPercentage size={15} />} label="Profit Margin" iconBg="bg-purple-50 text-purple-600">
                        <span className={profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}>{profitPercent}%</span>
                    </InfoCard>

                    <InfoCard
                        icon={<FaClock size={15} />}
                        label="Created At"
                        iconBg="bg-indigo-50 text-indigo-600"
                        className="sm:col-span-2"
                    >
                        {product.createdAt ? formatCreatedDate(product.createdAt) : <NA />}
                    </InfoCard>
                </div>

                {/* Note Section */}
                <div className="bg-white rounded-xl border border-indigo-100 shadow-sm px-4 py-3">
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FaStickyNote size={14} />
                        </div>
                        <h3 className="text-sm font-bold text-gray-800">Note</h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-[13px] text-gray-700 whitespace-pre-wrap max-h-20 overflow-y-auto">
                        {product.note || <span className="text-gray-400 italic">No note available for this product.</span>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetails;