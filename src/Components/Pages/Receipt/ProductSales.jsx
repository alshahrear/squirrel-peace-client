import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { FiCalendar, FiSearch, FiFilter, FiX, FiRefreshCw } from 'react-icons/fi';

// প্রোডাক্টের নাম বা ইউনিট থেকে স্মার্টলি টোটাল কোয়ান্টিটি বের করার ফাংশন
const parseSmartQuantity = (productName, orderQuantity) => {
    const qty = Number(orderQuantity || 1);
    const text = productName.toLowerCase();

    // ১. কেজি এবং গ্রাম ট্র্যাকিং (যেমন: 1 kg, 500 gm, 500gram)
    const kgMatch = text.match(/(\d+(\.\d+)?)\s*k(g|g\.|g\b|ilo|ilos)/);
    const gmMatch = text.match(/(\d+(\.\d+)?)\s*(g|g\.|gm|gms|gram|grams)\b/);

    if (kgMatch) {
        const value = parseFloat(kgMatch[1]) * qty;
        return { value, unit: 'kg' };
    }
    if (gmMatch) {
        const value = parseFloat(gmMatch[1]) * qty;
        return { value, unit: 'gm' };
    }

    // ২. লিটার এবং মিলিলিটার ট্র্যাকিং (যেমন: 1 ltr, 250 ml)
    const ltrMatch = text.match(/(\d+(\.\d+)?)\s*(l|ltr|ltrs|liter|liters)\b/);
    const mlMatch = text.match(/(\d+(\.\d+)?)\s*(ml)\b/);

    if (ltrMatch) {
        const value = parseFloat(ltrMatch[1]) * qty;
        return { value, unit: 'Ltr' };
    }
    if (mlMatch) {
        const value = parseFloat(mlMatch[1]) * qty;
        return { value, unit: 'ml' };
    }

    // ৩. কোনো নির্দিষ্ট ইউনিট না থাকলে নরমাল পিস বা আইটেম কাউন্ট
    return { value: qty, unit: 'Pcs' };
};

// একই ইউনিটের ডেটাগুলোকে বুদ্ধি খাটিয়ে যোগ করে দশমিকের পর ফিক্সড ২ ডিজিট দেখানোর ফাংশন
const formatAggregatedQuantity = (qtyList) => {
    let totalGrams = 0;
    let totalKg = 0;
    let totalMl = 0;
    let totalLtr = 0;
    let totalPcs = 0;

    qtyList.forEach(item => {
        if (item.unit === 'gm') totalGrams += item.value;
        else if (item.unit === 'kg') totalKg += item.value;
        else if (item.unit === 'ml') totalMl += item.value;
        else if (item.unit === 'Ltr') totalLtr += item.value;
        else totalPcs += item.value;
    });

    // গ্রামকে কেজিতে রূপান্তর (যেমন: ৪৫০ গ্রাম = ০.৪৫ কেজি)
    if (totalGrams > 0) {
        totalKg += totalGrams / 1000;
    }
    // মিলিলিটারকে লিটারে রূপান্তর
    if (totalMl > 0) {
        totalLtr += totalMl / 1000;
    }

    // দশমিকের পর ফিক্সড ২ ডিজিট রাখার লজিক (যেমন: 2.45)
    if (totalKg > 0) return totalKg.toFixed(2);
    if (totalLtr > 0) return totalLtr.toFixed(2);
    if (totalPcs > 0) return totalPcs.toFixed(2);

    return '0.00';
};


const ProductSales = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isMonthFilterActive, setIsMonthFilterActive] = useState(true);
    const [selectedShops, setSelectedShops] = useState([]); 

    const currentMonthName = new Date().toLocaleString('en-GB', { month: 'long' });

    useEffect(() => {
        axios.get('https://squirrel-peace-server.onrender.com/item')
            .then((res) => {
                setItems(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching data:', err);
                setError('ডেটা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
                setLoading(false);
            });
    }, []);

    // ১. ডেট এবং কারেন্ট মাস ফিল্টার
    const filteredOrders = useMemo(() => {
        return items.filter(order => {
            const customer = order.customer || {};
            if (!customer.date) return !isMonthFilterActive && !startDate && !endDate;

            const [day, month, year] = customer.date.split("/");
            const itemDate = new Date(`${year}-${month}-${day}`);
            const today = new Date();

            let matchesMonth = true;
            if (isMonthFilterActive) {
                matchesMonth = itemDate.getMonth() === today.getMonth() &&
                               itemDate.getFullYear() === today.getFullYear();
            }

            let matchesDate = true;
            if (startDate) matchesDate = matchesDate && itemDate >= new Date(startDate);
            if (endDate) matchesDate = matchesDate && itemDate <= new Date(endDate);

            return matchesMonth && matchesDate;
        });
    }, [items, startDate, endDate, isMonthFilterActive]);

    // ২. ডেটা গ্রুপিং, শপ ভ্যালিডেশন এবং কোয়ান্টিটি ক্যালকুলেশন
    const { allProcessedProducts, uniqueCapitalShops } = useMemo(() => {
        const productMap = {};
        const shopSet = new Set();

        filteredOrders.forEach((order) => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item) => {
                    const productName = item.product ? item.product.trim() : 'Unknown Product';
                    const shopName = item.shop ? item.shop.trim() : '';

                    const isOnlyCapital = shopName && /^[A-Z\s\d]+$/.test(shopName);
                    
                    if (isOnlyCapital) {
                        shopSet.add(shopName);
                        const mapKey = `${shopName}_${productName}`;
                        const costPrice = Number(item.costPrice || 0);
                        const quantity = Number(item.quantity || 1);
                        const totalPrice = Number(item.totalPrice || 0);
                        const profit = Number(item.profit || 0);
                        const currentBuyPrice = costPrice * quantity;

                        // স্মার্ট কোয়ান্টিটি পার্স করা
                        const parsedQty = parseSmartQuantity(productName, quantity);

                        if (!productMap[mapKey]) {
                            productMap[mapKey] = {
                                shop: shopName,
                                name: productName,
                                salesCount: 0,
                                totalBuyPrice: 0,
                                totalSalesPrice: 0,
                                totalProfit: 0,
                                rawQuantities: []
                            };
                        }

                        productMap[mapKey].salesCount += 1;
                        productMap[mapKey].totalBuyPrice += currentBuyPrice;
                        productMap[mapKey].totalSalesPrice += totalPrice;
                        productMap[mapKey].totalProfit += profit;
                        productMap[mapKey].rawQuantities.push(parsedQty);
                    }
                });
            }
        });

        // প্রসেসড ডেটাতে ফাইনাল ফরম্যাটেড কোয়ান্টিটি ইন্টিগ্রেট করা
        const finalProcessedList = Object.values(productMap).map(product => ({
            ...product,
            totalSmartQuantity: formatAggregatedQuantity(product.rawQuantities)
        }));

        return {
            allProcessedProducts: finalProcessedList,
            uniqueCapitalShops: Array.from(shopSet).sort()
        };
    }, [filteredOrders]);

    // ৩. শপ ক্লিক এবং সার্চের ওপর ভিত্তি করে ফিল্টারিং ও সর্টিং
    const finalProducts = useMemo(() => {
        let result = [...allProcessedProducts];

        if (searchTerm.trim() !== "") {
            result = result.filter(product => 
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.shop.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedShops.length > 0) {
            result = result.filter(product => selectedShops.includes(product.shop));
        }

        result.sort((a, b) => {
            if (selectedShops.length > 0) {
                const indexA = selectedShops.indexOf(a.shop);
                const indexB = selectedShops.indexOf(b.shop);
                if (indexA !== indexB) {
                    return indexA - indexB; 
                }
            }
            return b.salesCount - a.salesCount;
        });

        return result;
    }, [allProcessedProducts, searchTerm, selectedShops]);

    const handleShopButtonClick = (shop) => {
        if (selectedShops.includes(shop)) {
            setSelectedShops(selectedShops.filter(s => s !== shop));
        } else {
            setSelectedShops([...selectedShops, shop]);
        }
    };

    const highlightText = (text, highlight) => {
        if (!highlight.trim()) return text;
        const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, index) => 
            regex.test(part) 
                ? <mark key={index} className="bg-yellow-200 text-slate-900 rounded px-0.5 font-bold">{part}</mark> 
                : part
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                <span className="ml-3 text-lg font-bold text-slate-600">ডেটা প্রসেস হচ্ছে...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-slate-50">
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl shadow-md mx-4">
                    <p className="text-red-700 font-bold text-center text-sm md:text-base">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-3 sm:p-6 md:p-8 font-sans text-slate-900">
            <div className="max-w-6xl mx-auto">
                
                {/* হেডার ও মেইন ফিল্টার */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 sm:mb-8 gap-4 md:gap-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-4xl font-black text-slate-900 flex items-center gap-2 sm:gap-3 tracking-tight">
                            <span className="bg-indigo-600 text-white p-2 rounded-xl sm:rounded-2xl shadow-xl shadow-indigo-200 text-lg sm:text-2xl">📈</span>
                            Product Sales Report
                        </h2>
                        <p className="text-[10px] sm:text-xs text-slate-400 font-bold mt-1 pl-1">শপ ও প্রোডাক্ট ভিত্তিক বিক্রয় র‍্যাংকিং এবং লাভ-ক্ষতির হিসাব</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsMonthFilterActive(!isMonthFilterActive)}
                            className={`flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all shadow-sm w-full sm:w-auto justify-center ${
                                isMonthFilterActive
                                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <FiFilter />
                            {isMonthFilterActive ? currentMonthName : "All Data"}
                        </button>

                        {/* ডেট পিকার */}
                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl sm:rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                            <div className="relative group cursor-pointer flex-1 sm:flex-none" onClick={(e) => e.currentTarget.querySelector('input').showPicker()}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full"
                                />
                                <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold bg-slate-50 p-2 rounded-lg text-indigo-600 min-w-[100px] sm:min-w-[115px] border border-transparent group-hover:border-indigo-100 transition-all">
                                    <FiCalendar className="text-indigo-400" />
                                    <span>{startDate ? new Date(startDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "শুরু তারিখ"}</span>
                                </div>
                            </div>

                            <span className="text-slate-400 font-bold text-[10px] uppercase px-0.5">to</span>

                            <div className="relative group cursor-pointer flex-1 sm:flex-none" onClick={(e) => e.currentTarget.querySelector('input').showPicker()}>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full"
                                />
                                <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-bold bg-slate-50 p-2 rounded-lg text-indigo-600 min-w-[100px] sm:min-w-[115px] border border-transparent group-hover:border-indigo-100 transition-all">
                                    <FiCalendar className="text-indigo-400" />
                                    <span>{endDate ? new Date(endDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "শেষ তারিখ"}</span>
                                </div>
                            </div>

                            {(startDate || endDate) && (
                                <FiX
                                    onClick={(e) => { e.stopPropagation(); setStartDate(""); setEndDate(""); }}
                                    className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors ml-1"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* সার্চ বক্স */}
                <div className="mb-4 sm:mb-6 relative w-full">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                    <input
                        type="text"
                        value={searchTerm}
                        placeholder="প্রোডাক্টের নাম অথবা শপের নাম লিখে খুঁজুন..."
                        className="pl-12 pr-4 py-3 sm:py-4 bg-white border border-slate-200 rounded-2xl sm:rounded-[1.5rem] w-full shadow-md focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-sm sm:text-base text-slate-700 transition-all placeholder:text-slate-300"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* শপ ফিল্টার বাটন প্যানেল */}
                {uniqueCapitalShops.length > 0 && (
                    <div className="mb-6 flex flex-wrap items-center justify-center gap-2 bg-white p-3 rounded-2xl sm:rounded-3xl border border-slate-100 shadow-sm">
                        {uniqueCapitalShops.map((shop) => {
                            const isSelected = selectedShops.includes(shop);
                            const clickIndex = selectedShops.indexOf(shop);
                            return (
                                <button
                                    key={shop}
                                    onClick={() => handleShopButtonClick(shop)}
                                    className={`relative px-3.5 py-2 rounded-xl font-black text-xs transition-all border shadow-sm ${
                                        isSelected
                                            ? "bg-indigo-600 text-white border-transparent scale-105"
                                            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                                    }`}
                                >
                                    {shop}
                                    {isSelected && (
                                        <span className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-black border border-white">
                                            {clickIndex + 1}
                                        </span>
                                    )}
                                </button>
                            );
                        })}

                        {/* রিসেট বাটন (Emerald কালার থিমড) */}
                        {selectedShops.length > 0 && (
                            <button
                                onClick={() => setSelectedShops([])}
                                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200/60 font-black text-xs transition-all shadow-sm"
                                title="সব ক্লিয়ার করুন"
                            >
                                <FiRefreshCw size={12} className="animate-reverse text-emerald-500" />
                                Reset
                            </button>
                        )}
                    </div>
                )}

                {/* মেইন ডেটা সেকশন */}
                {finalProducts.length === 0 ? (
                    <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-md">
                        <div className="text-4xl sm:text-5xl mb-3 opacity-20">📦</div>
                        <p className="text-slate-400 font-black text-base sm:text-lg tracking-tight">কোনো প্রোডাক্টের সেলস রেকর্ড পাওয়া যায়নি!</p>
                    </div>
                ) : (
                    <>
                        {/* ১. মোবাইল ভিউ (কার্ড লেআউট) */}
                        <div className="block md:hidden space-y-3">
                            {finalProducts.map((product, index) => {
                                const profitPercentage = product.totalBuyPrice > 0 
                                    ? ((product.totalProfit / product.totalBuyPrice) * 100).toFixed(1) 
                                    : '0.0';
                                const isShopHighlighted = selectedShops.includes(product.shop);

                                return (
                                    <div 
                                        key={index} 
                                        className={`p-4 rounded-2xl border transition-all shadow-sm bg-white ${
                                            isShopHighlighted ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-slate-100'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`h-6 px-1.5 font-black text-[10px] rounded-md flex items-center justify-center uppercase border ${
                                                    isShopHighlighted ? 'bg-indigo-600 text-white border-transparent' : 'bg-slate-100 text-slate-700 border-slate-200'
                                                }`}>
                                                    {product.shop}
                                                </span>
                                                <h3 className="font-black text-slate-800 text-sm break-words max-w-[180px]">
                                                    {highlightText(product.name, searchTerm)}
                                                </h3>
                                            </div>
                                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md text-[10px] font-black shrink-0 border border-indigo-100/50">
                                                Orders: {product.salesCount}
                                            </span>
                                        </div>

                                        {/* মোবাইল ভিউতে এগ্রিগেশন কোয়ান্টিটি ব্যাজ */}
                                        <div className="mb-3 pl-1">
                                            <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                                Total Qty: {product.totalSmartQuantity}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Buy</p>
                                                <p className="font-mono text-xs font-bold text-slate-500 mt-0.5">{Math.round(product.totalBuyPrice).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Sale</p>
                                                <p className="font-mono text-xs font-black text-slate-800 mt-0.5">{Math.round(product.totalSalesPrice).toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Profit</p>
                                                <p className={`font-mono text-xs font-black mt-0.5 ${Number(product.totalProfit) >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                                    {Math.round(product.totalProfit).toLocaleString()} <span className="text-[9px] block">({profitPercentage}%)</span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ২. ডেস্কটপ ও ট্যাবলেট ভিউ (টেবিল লেআউট - নতুন কলামসহ) */}
                        <div className="hidden md:block bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left min-w-[900px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                                            <th className="px-8 py-6 text-left w-[35%]">Product Name (Order)</th>
                                            <th className="px-4 py-6 text-center w-[15%]">Total Qty</th>
                                            <th className="px-4 py-6 text-right w-[15%]">Buy Price</th>
                                            <th className="px-4 py-6 text-right w-[15%]">Sales Price</th>
                                            <th className="px-8 py-6 text-right w-[20%]">Profit (%)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {finalProducts.map((product, index) => {
                                            const profitPercentage = product.totalBuyPrice > 0 
                                                ? ((product.totalProfit / product.totalBuyPrice) * 100).toFixed(1) 
                                                : '0.0';
                                            const isShopHighlighted = selectedShops.includes(product.shop);

                                            return (
                                                <tr 
                                                    key={index} 
                                                    className={`group transition-all odd:bg-slate-50/20 ${
                                                        isShopHighlighted 
                                                            ? 'bg-indigo-50/40 hover:bg-indigo-50/60' 
                                                            : 'hover:bg-slate-50/80'
                                                    }`}
                                                >
                                                    <td className="px-8 py-4 flex items-center gap-3">
                                                        <span className={`h-7 min-w-[28px] px-2 font-black text-[11px] rounded-lg flex items-center justify-center uppercase shadow-sm border transition-all ${
                                                            isShopHighlighted
                                                                ? 'bg-indigo-600 text-white border-transparent'
                                                                : 'bg-slate-100 text-slate-700 border-slate-200 group-hover:bg-indigo-50 group-hover:text-indigo-700'
                                                        }`}>
                                                            {product.shop}
                                                        </span>
                                                        <div className="font-black text-slate-800 text-sm md:text-base flex items-center flex-wrap gap-1.5">
                                                            {highlightText(product.name, searchTerm)}
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-xs font-black border ${
                                                                isShopHighlighted
                                                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                                                    : 'bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                                                            }`} title="মোট অর্ডারের সংখ্যা">
                                                                {product.salesCount}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* নতুন কলাম: ইন্টেলিজেন্ট টোটাল কোয়ান্টিটি সামেশন */}
                                                    <td className="px-4 py-4 text-center">
                                                        <span className="inline-block px-2.5 py-1 rounded-xl text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm whitespace-nowrap">
                                                            {product.totalSmartQuantity}
                                                        </span>
                                                    </td>

                                                    <td className="px-4 py-4 text-right font-mono font-bold text-slate-500 text-sm md:text-base">
                                                        {Math.round(product.totalBuyPrice).toLocaleString()}
                                                    </td>

                                                    <td className="px-4 py-4 text-right font-mono font-black text-slate-800 text-sm md:text-base">
                                                        {Math.round(product.totalSalesPrice).toLocaleString()}
                                                    </td>

                                                    <td className="px-8 py-4 text-right font-mono">
                                                        <div className="flex items-center justify-end gap-2.5">
                                                            <span className={`font-black text-sm md:text-base ${
                                                                Number(product.totalProfit) >= 0 ? 'text-emerald-600' : 'text-red-500'
                                                            }`}>
                                                                {Math.round(product.totalProfit).toLocaleString()}
                                                            </span>
                                                            <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-md ${
                                                                Number(product.totalProfit) >= 0 
                                                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                                                                    : 'bg-red-50 text-red-600 border border-red-100'
                                                            }`}>
                                                                {profitPercentage}%
                                                            </span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProductSales;