import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom'; // রাউটিং এর জন্য Link ইম্পোর্ট করা হয়েছে
import { FiCalendar, FiFilter, FiX, FiSearch, FiUsers, FiTrendingUp, FiBarChart2, FiShoppingBag, FiGift, FiList } from 'react-icons/fi';

const CustomerData = () => {
    const [database, setDatabase] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    
    // তারিখ ও মাস ফিল্টারের স্টেটসমূহ
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isMonthFilterActive, setIsMonthFilterActive] = useState(true);

    const currentMonthName = new Date().toLocaleString('en-GB', { month: 'long' });

    // API থেকে ডেটা ফেচ করা
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://squirrel-peace-server.onrender.com/item');
                if (!response.ok) {
                    throw new Error('ডেটা লোড করতে ব্যর্থ হয়েছে!');
                }
                const data = await response.json();
                setDatabase(data);
                setLoading(false);
            } catch (err) {
                setError(err.message);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // ১. তারিখ ও মাস অনুযায়ী প্রথমে মেইন ডেটা ফিল্টার করা
    const filteredOrders = useMemo(() => {
        if (!Array.isArray(database)) return [];

        return database.filter(order => {
            const customer = order.customer || {};
            if (!customer.date) return !isMonthFilterActive && !startDate && !endDate;

            // DD/MM/YYYY ফরম্যাট থেকে ডেট অবজেক্ট তৈরি
            const [day, month, year] = customer.date.split("/");
            const orderDate = new Date(`${year}-${month}-${day}`);
            const today = new Date();

            // চলতি মাসের ফিল্টার লজিক
            let matchesMonth = true;
            if (isMonthFilterActive) {
                matchesMonth = orderDate.getMonth() === today.getMonth() &&
                               orderDate.getFullYear() === today.getFullYear();
            }

            // ডেট রেঞ্জ ফিল্টার লজিক
            let matchesDate = true;
            if (startDate) matchesDate = matchesDate && orderDate >= new Date(startDate);
            if (endDate) matchesDate = matchesDate && orderDate <= new Date(endDate);

            return matchesMonth && matchesDate;
        });
    }, [database, startDate, endDate, isMonthFilterActive]);

    // ২. ফিল্টার করা অর্ডারগুলো থেকে কাস্টমার অনুযায়ী ডেটা গ্রুপ করা
    const processedCustomers = useMemo(() => {
        const customerMap = {};

        filteredOrders.forEach(order => {
            if (!order.customer || !order.customer.phone) return;

            const phoneKey = order.customer.phone.trim();
            const name = order.customer.customerName ? order.customer.customerName.trim() : 'অজানা কাস্টমার';
            const address = order.customer.address || 'ঠিকানা দেওয়া নেই';
            const sales = order.grandTotal || 0;
            const overallDiscount = order.overallDiscount || 0;

            let itemsProfit = 0;
            const currentOrderShops = {};

            if (Array.isArray(order.items)) {
                order.items.forEach(item => {
                    const shopName = (item.shop || '').trim();
                    
                    // শুধুমাত্র Capital Letter শপগুলো কাউন্ট হবে (যেমন: N, F)
                    if (shopName && shopName === shopName.toUpperCase() && shopName !== shopName.toLowerCase()) {
                        
                        const itemCost = (Number(item.costPrice) || 0) * (Number(item.quantity) || 0); 
                        const itemSales = Number(item.totalPrice) || 0;                         
                        const itemProfit = Number(item.profit) || 0;                           

                        itemsProfit += itemProfit;

                        if (!currentOrderShops[shopName]) {
                            currentOrderShops[shopName] = { cost: 0, sales: 0, profit: 0 };
                        }
                        currentOrderShops[shopName].cost += itemCost;
                        currentOrderShops[shopName].sales += itemSales;
                        currentOrderShops[shopName].profit += itemProfit;
                    }
                });
            }

            const calculatedOrderProfit = itemsProfit - overallDiscount;

            if (customerMap[phoneKey]) {
                customerMap[phoneKey].totalSales += sales;
                customerMap[phoneKey].totalProfit += calculatedOrderProfit;
                customerMap[phoneKey].orderCount += 1;
                
                if (address && !customerMap[phoneKey].addresses.includes(address)) {
                    customerMap[phoneKey].addresses.push(address);
                }

                Object.keys(currentOrderShops).forEach(shop => {
                    if (!customerMap[phoneKey].shops[shop]) {
                        customerMap[phoneKey].shops[shop] = { cost: 0, sales: 0, profit: 0 };
                    }
                    customerMap[phoneKey].shops[shop].cost += currentOrderShops[shop].cost;
                    customerMap[phoneKey].shops[shop].sales += currentOrderShops[shop].sales;
                    customerMap[phoneKey].shops[shop].profit += currentOrderShops[shop].profit;
                });
            } else {
                customerMap[phoneKey] = {
                    name: name,
                    phone: phoneKey,
                    addresses: [address],
                    totalSales: sales,
                    totalProfit: calculatedOrderProfit,
                    orderCount: 1,
                    shops: { ...currentOrderShops }
                };
            }
        });

        return Object.values(customerMap);
    }, [filteredOrders]);

    // ৩. সার্চ ফিল্টারিং
    const filteredCustomers = useMemo(() => {
        return processedCustomers.filter(customer => {
            const query = searchQuery.toLowerCase();
            return (
                customer.name.toLowerCase().includes(query) ||
                customer.phone.includes(query)
            );
        });
    }, [processedCustomers, searchQuery]);

    // সামারি ক্যালকুলেশন
    const totalSummary = useMemo(() => {
        return filteredCustomers.reduce((acc, curr) => {
            acc.sales += curr.totalSales;
            acc.profit += curr.totalProfit;
            return acc;
        }, { sales: 0, profit: 0 });
    }, [filteredCustomers]);

    // দশমিক হেল্পার ফাংশন
    const formatDecimal = (value) => {
        return Number(value % 1 === 0 ? value : value.toFixed(2)).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
                <div className="relative w-20 h-20">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-4 border-indigo-100 rounded-full"></div>
                    {/* Spinning ring */}
                    <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <h3 className="mt-6 text-xl font-black text-slate-800 tracking-tight">লোড হচ্ছে...</h3>
                <p className="mt-2 text-sm font-bold text-slate-400">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
                <div className="bg-red-50 text-red-700 px-6 py-4 rounded-xl border border-red-100 text-center max-w-md shadow-sm">
                    <p className="font-bold text-xl mb-1">দুঃখিত! একটি সমস্যা হয়েছে</p>
                    <p className="text-base opacity-90">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 p-3 sm:p-5 md:p-6 font-sans text-slate-900 tracking-normal">
            <div className="max-w-7xl mx-auto">

                {/* হেডার এবং ফিল্টার সেকশন - পিসিতে এক লাইনে বাটন অ্যাড করা হয়েছে */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
                            <span className="bg-indigo-600 text-white p-2 rounded-2xl shadow-lg text-xl sm:text-2xl">👥</span>
                            Customer Database
                        </h2>
                    </div>

                    {/* বাটন ও ফিল্টার কন্টেইনার */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        
                        {/* নতুন রিকোয়েস্ট করা Order List বাটন */}
                        <Link
                            to="/customerAdmin"
                            className="flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm md:text-base transition-all shadow-sm w-full sm:w-auto justify-center bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:text-indigo-600"
                        >
                            <FiList className="text-indigo-500" />
                            <span>Order List</span>
                        </Link>

                        <button
                            onClick={() => setIsMonthFilterActive(!isMonthFilterActive)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm md:text-base transition-all shadow-sm w-full sm:w-auto justify-center ${isMonthFilterActive
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            <FiFilter />
                            {isMonthFilterActive ? currentMonthName : "All Data"}
                        </button>

                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto justify-between sm:justify-start">
                            <div className="relative group cursor-pointer" onClick={(e) => e.currentTarget.querySelector('input').showPicker()}>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full"
                                />
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-black bg-slate-100 p-2 rounded-lg text-indigo-700 min-w-[110px] sm:min-w-[120px] border border-transparent group-hover:border-indigo-100 transition-all">
                                    <FiCalendar className="text-indigo-500" />
                                    <span>{startDate ? new Date(startDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "শুরু তারিখ"}</span>
                                </div>
                            </div>

                            <span className="text-slate-400 font-black text-[10px] uppercase px-0.5">to</span>

                            <div className="relative group cursor-pointer" onClick={(e) => e.currentTarget.querySelector('input').showPicker()}>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full"
                                />
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-black bg-slate-100 p-2 rounded-lg text-indigo-700 min-w-[110px] sm:min-w-[120px] border border-transparent group-hover:border-indigo-100 transition-all">
                                    <FiCalendar className="text-indigo-500" />
                                    <span>{endDate ? new Date(endDate).toLocaleDateString('en-GB').replace(/\//g, '-') : "শেষ তারিখ"}</span>
                                </div>
                            </div>

                            {(startDate || endDate) && (
                                <FiX
                                    onClick={(e) => { e.stopPropagation(); setStartDate(""); setEndDate(""); }}
                                    className="cursor-pointer text-slate-400 hover:text-red-500 transition-colors ml-1 p-0.5"
                                    size={18}
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* সামারি মিনি কার্ডস */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">নির্বাচিত কাস্টমার</p>
                            <h4 className="text-xl font-black text-slate-800">{filteredCustomers.length} জন</h4>
                        </div>
                        <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><FiUsers size={20} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">মোট বিক্রয়</p>
                            <h4 className="text-xl font-black text-slate-800">{totalSummary.sales.toLocaleString()} ৳</h4>
                        </div>
                        <div className="bg-cyan-50 p-2.5 rounded-xl text-cyan-600"><FiBarChart2 size={20} /></div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between sm:col-span-2 lg:col-span-1">
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-wider mb-1">নীট লাভ</p>
                            <h4 className="text-xl font-black text-emerald-600">{totalSummary.profit.toLocaleString()} ৳</h4>
                        </div>
                        <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600"><FiTrendingUp size={20} /></div>
                    </div>
                </div>

                {/* সার্চ বক্স */}
                <div className="mb-6 relative w-full">
                    <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500 text-base sm:text-lg" />
                    <input
                        type="text"
                        placeholder="কাস্টমারের নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
                        className="pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl w-full shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-black text-base text-slate-800 transition-all placeholder:text-slate-400"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* কাস্টমার টেবিল সেকশন - পিসিতে নো-স্ক্রোল ফিট করার জন্য উইডথ কন্ট্রোল */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto lg:overflow-x-visible">
                        <table className="w-full text-left min-w-[1000px] lg:min-w-full table-fixed border-collapse">
                            <thead>
                                <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest">
                                    <th className="px-2 py-4 w-[4%] text-center">SL</th>
                                    <th className="px-2 py-4 w-[18%]">কাস্টমারের নাম (অর্ডার)</th>
                                    <th className="px-2 py-4 w-[22%]">যোগাযোগ ও ঠিকানা</th>
                                    <th className="px-2 py-4 w-[30%]">শপ ভিত্তিক বিবরণ (ক্রয় | বিক্রয় | লাভ | %)</th>
                                    <th className="px-2 py-4 text-right w-[11%]">বিক্রয় (Sales)</th>
                                    <th className="px-3 py-4 text-right w-[15%]">প্রকৃত নীট লাভ (Profit)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredCustomers.length > 0 ? (
                                    filteredCustomers.map((customer, index) => {
                                        const totalProfitPercentage = customer.totalSales > 0 
                                            ? (customer.totalProfit / customer.totalSales) * 100 
                                            : 0;
                                        
                                        const displayTotalPercentage = totalProfitPercentage % 1 === 0 
                                            ? totalProfitPercentage 
                                            : totalProfitPercentage.toFixed(2);

                                        return (
                                            <tr key={customer.phone} className="group transition-all hover:bg-slate-50/60">
                                                {/* সিরিয়াল নম্বর */}
                                                <td className="px-2 py-3 text-center">
                                                    <span className="text-sm font-black text-slate-400 group-hover:text-indigo-600 transition-colors">
                                                        {String(index + 1).padStart(2, '0')}
                                                    </span>
                                                </td>

                                                {/* কাস্টমার নাম */}
                                                <td className="px-2 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-sm border border-indigo-200 uppercase shrink-0">
                                                            {customer.name ? customer.name[0] : 'U'}
                                                        </div>
                                                        <div className="truncate">
                                                            <div className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-1">
                                                                <span className="truncate">{customer.name}</span>
                                                                <span className="text-indigo-700 font-black text-xs bg-indigo-50 border border-indigo-200/60 px-1.5 py-0.5 rounded-md shrink-0">
                                                                    ({customer.orderCount})
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* যোগাযোগ ও ঠিকানা */}
                                                <td className="px-2 py-3">
                                                    <div className="flex flex-col gap-1 w-full whitespace-normal break-words">
                                                        <span className="font-black text-slate-800 text-sm sm:text-base flex items-center gap-1 shrink-0">
                                                            📞 {customer.phone}
                                                        </span>
                                                        <span className="text-slate-600 font-bold text-xs sm:text-[13px] leading-relaxed bg-slate-100/70 p-2 rounded-xl border border-slate-200/60 italic shadow-2xs">
                                                            📍 {customer.addresses.filter(Boolean).join(' | ')}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* শপ ভিত্তিক বিবরণ */}
                                                <td className="px-2 py-3">
                                                    <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                                        {Object.keys(customer.shops).length > 0 ? (
                                                            Object.entries(customer.shops).map(([shopName, data]) => {
                                                                const rawPercentage = data.sales > 0 
                                                                    ? (data.profit / data.sales) * 100 
                                                                    : 0;
                                                                
                                                                const displayPercentage = rawPercentage % 1 === 0 
                                                                    ? rawPercentage 
                                                                    : rawPercentage.toFixed(2);
                                                                
                                                                return (
                                                                    <div key={shopName} className="flex flex-col gap-0.5 bg-slate-100 border border-slate-200/80 px-2.5 py-1.5 rounded-xl w-full shadow-2xs">
                                                                        <div className="flex items-center justify-between border-b border-slate-200 pb-0.5 mb-0.5">
                                                                            <div className="flex items-center gap-1 text-xs font-black text-indigo-700">
                                                                                <FiShoppingBag size={12} className="text-indigo-500" />
                                                                                <span>Shop: {shopName}</span>
                                                                            </div>
                                                                            <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-1.5 py-0.2 rounded-md text-[10px] sm:text-xs font-black">
                                                                                {displayPercentage}% Profit
                                                                            </span>
                                                                        </div>
                                                                        
                                                                        <div className="flex items-center justify-between text-[11px] sm:text-xs font-bold text-slate-700">
                                                                            <span>ক্রয়: <span className="text-slate-900 font-black">{formatDecimal(data.cost)}৳</span></span>
                                                                            <span className="text-slate-300">|</span>
                                                                            <span>বিক্রয়: <span className="text-slate-900 font-black">{formatDecimal(data.sales)}৳</span></span>
                                                                            <span className="text-slate-300">|</span>
                                                                            <span>লাভ: <span className="text-emerald-700 font-black">{formatDecimal(data.profit)}৳</span></span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })
                                                        ) : (
                                                            <span className="text-slate-400 italic text-sm">কোনো শপ ডেটা নেই</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* মোট বিক্রয় */}
                                                <td className="px-2 py-3 text-right font-black text-slate-900 text-sm sm:text-base md:text-lg tracking-tight">
                                                    {customer.totalSales.toLocaleString()} ৳
                                                </td>

                                                {/* প্রকৃত নীট লাভ */}
                                                <td className="px-3 py-3 text-right font-black">
                                                    <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                                                        <span className="px-2 py-1.5 rounded-xl bg-emerald-100/90 text-emerald-900 text-xs sm:text-sm border border-emerald-200 inline-flex items-center gap-1 shadow-2xs transition-colors group-hover:bg-emerald-200/80">
                                                            <FiGift className="text-emerald-600 shrink-0" size={13} />
                                                            <span className="opacity-80 font-black">{Math.floor(customer.totalProfit * 0.1).toLocaleString()}</span>
                                                            <span className="opacity-30 font-normal">|</span>
                                                            <span className="font-extrabold">{customer.totalProfit.toLocaleString()} ৳</span>
                                                        </span>
                                                        
                                                        <span className="bg-slate-200/90 text-slate-800 border border-slate-300 px-1.5 py-0.5 rounded-lg text-[11px] font-black shrink-0 shadow-2xs">
                                                            {displayTotalPercentage}%
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center flex flex-col items-center justify-center">
                                            <div className="text-4xl mb-2 opacity-30">📂</div>
                                            <p className="text-slate-500 font-black text-base tracking-tight">কোনো কাস্টমারের রেকর্ড পাওয়া যায়নি!</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CustomerData;