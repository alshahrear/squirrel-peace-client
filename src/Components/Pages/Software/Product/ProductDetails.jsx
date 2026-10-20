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
} from 'react-icons/fa';

const InfoCard = ({ icon, label, children, iconBg = 'bg-indigo-50 text-indigo-600' }) => (
    <div className="bg-white rounded-2xl border border-indigo-100 shadow-md hover:shadow-xl transition-all p-5 flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
        </div>
        <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
            <div className="text-sm font-semibold text-gray-800 break-words">{children}</div>
        </div>
    </div>
);

const NA = () => <span className="text-gray-400 italic font-normal">N/A</span>;

const formatMoney = (value) => '৳ ' + (value ? Number(value).toLocaleString() : '0');

const ProductDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await fetch('http://localhost:5000/product');
                const data = await res.json();
                const found = data.find((p) => p._id === id);
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
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                    <p className="text-sm font-semibold text-indigo-600">Loading details...</p>
                </div>
            </div>
        );
    }

    if (notFound || !product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-xl border border-indigo-100 p-8 text-center max-w-md w-full">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center">
                        <FaBoxOpen size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">Product Not Found</h2>
                    <p className="text-sm text-gray-500 mb-6">This product does not exist or has been deleted.</p>
                    <button
                        onClick={() => navigate('/product')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold shadow-md hover:from-indigo-700 hover:to-purple-700 transition-all"
                    >
                        <FaArrowLeft size={12} /> Back to Products
                    </button>
                </div>
            </div>
        );
    }

    const initials = (product.productName || 'P')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const purchase = Number(product.purchasePrice) || 0;
    const selling = Number(product.sellingPrice) || 0;
    const profit = selling - purchase;
    const profitPercent = purchase > 0 ? ((profit / purchase) * 100).toFixed(1) : '0';

    const createdDate = product.createdAt ? product.createdAt.split(',')[0] : '';
    const createdTime = product.createdAt ? (product.createdAt.split(',')[1] || '').trim() : '';

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">

                {/* Back Button */}
                <button
                    onClick={() => navigate('/product')}
                    className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white text-indigo-600 text-sm font-bold shadow-md border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all"
                >
                    <FaArrowLeft size={12} /> Back to Products
                </button>

                {/* Hero Header */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-2xl p-6 sm:p-8 mb-8">
                    <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full"></div>
                    <div className="absolute -bottom-16 -left-10 w-56 h-56 bg-white/10 rounded-full"></div>

                    <div className="relative flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                        <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg">
                            {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                                <span className={`px-3 py-0.5 rounded-full text-[11px] font-bold ${product.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {product.isActive ? 'Active' : 'Inactive'}
                                </span>
                                {product.category && (
                                    <span className="px-3 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold backdrop-blur-md">
                                        {product.category}
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-white break-words">
                                {product.productName}
                            </h1>
                            <p className="text-indigo-100 text-sm mt-1">
                                Company: {product.company || 'N/A'}
                            </p>

                            <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                                {product.sku && (
                                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                                        <FaBarcode size={11} /> {product.sku}
                                    </span>
                                )}
                                <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                                    <FaBalanceScale size={11} /> {product.unit || 'N/A'} ({product.pcsOfUnit || '0'} pcs)
                                </span>
                            </div>
                        </div>

                        {/* Price Badges */}
                        <div className="flex sm:flex-col gap-3">
                            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Selling Price</p>
                                <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                                    {formatMoney(product.sellingPrice)}
                                </p>
                            </div>
                            <div className="bg-white rounded-2xl px-5 py-3 shadow-xl text-center">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">MRP</p>
                                <p className="text-xl font-extrabold text-indigo-600 mt-0.5">
                                    {formatMoney(product.mrp)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Profit Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
                    <div className="bg-white rounded-2xl border border-rose-100 shadow-md p-5 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Purchase Price</p>
                        <p className="text-2xl font-extrabold text-rose-600 mt-1">{formatMoney(product.purchasePrice)}</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-emerald-100 shadow-md p-5 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Profit / Unit</p>
                        <p className={`text-2xl font-extrabold mt-1 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            ৳ {profit.toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl border border-indigo-100 shadow-md p-5 text-center">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Profit Margin</p>
                        <p className={`text-2xl font-extrabold mt-1 ${profit >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                            {profitPercent}%
                        </p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <InfoCard icon={<FaBoxOpen size={18} />} label="Product Name">
                        {product.productName || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaBuilding size={18} />} label="Company" iconBg="bg-purple-50 text-purple-600">
                        {product.company || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaBarcode size={18} />} label="SKU" iconBg="bg-sky-50 text-sky-600">
                        {product.sku || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaLayerGroup size={18} />} label="Category" iconBg="bg-amber-50 text-amber-600">
                        {product.category || <NA />}
                    </InfoCard>

                    <InfoCard icon={<FaBell size={18} />} label="Alert Quantity" iconBg="bg-amber-50 text-amber-600">
                        <span className="text-amber-600">{product.alertQuantity || '0'}</span>
                    </InfoCard>

                    <InfoCard icon={<FaBalanceScale size={18} />} label="Unit / Pcs Of Unit" iconBg="bg-indigo-50 text-indigo-600">
                        {product.unit || 'N/A'} ({product.pcsOfUnit || '0'} pcs)
                    </InfoCard>

                    <InfoCard icon={<FaShoppingCart size={18} />} label="Purchase Price" iconBg="bg-rose-50 text-rose-600">
                        <span className="text-rose-600">{formatMoney(product.purchasePrice)}</span>
                    </InfoCard>

                    <InfoCard icon={<FaMoneyBillWave size={18} />} label="Selling Price" iconBg="bg-emerald-50 text-emerald-600">
                        <span className="text-emerald-600">{formatMoney(product.sellingPrice)}</span>
                    </InfoCard>

                    <InfoCard icon={<FaTag size={18} />} label="MRP" iconBg="bg-indigo-50 text-indigo-600">
                        <span className="text-indigo-600">{formatMoney(product.mrp)}</span>
                    </InfoCard>

                    <InfoCard icon={<FaGift size={18} />} label="Free Product Qty" iconBg="bg-pink-50 text-pink-600">
                        {(Number(product.freeProductUnitQty) || Number(product.freeProductPcsQty)) ? (
                            <>
                                {product.freeProductUnitQty || 0} {product.unit || 'Pcs'} {product.freeProductPcsQty || 0} Pcs
                                <span className="text-xs text-pink-500 ml-1 font-bold">
                                    (Total: {(Number(product.freeProductUnitQty) || 0) * (Number(product.pcsOfUnit) || 0) + (Number(product.freeProductPcsQty) || 0)})
                                </span>
                            </>
                        ) : 'None'}
                    </InfoCard>

                    <InfoCard icon={<FaChartLine size={18} />} label="Status" iconBg="bg-emerald-50 text-emerald-600">
                        <span className={product.isActive ? 'text-green-700' : 'text-red-700'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </InfoCard>

                    <InfoCard icon={<FaClock size={18} />} label="Created At" iconBg="bg-indigo-50 text-indigo-600">
                        {product.createdAt ? (
                            <span>{createdDate}{createdTime ? ', ' + createdTime : ''}</span>
                        ) : (
                            <NA />
                        )}
                    </InfoCard>
                </div>

                {/* Note Section */}
                <div className="mt-5 bg-white rounded-2xl border border-indigo-100 shadow-md p-5">
                    <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                            <FaStickyNote size={18} />
                        </div>
                        <h3 className="text-base font-bold text-gray-800">Note</h3>
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap min-h-[80px]">
                        {product.note || <span className="text-gray-400 italic">No note available for this product.</span>}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductDetails;