import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { FiCalendar, FiSearch, FiFilter, FiX, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const ProductSalesTable = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRowIds, setSelectedRowIds] = useState([]);
    const [isLinedUp, setIsLinedUp] = useState(false);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [isMonthFilterActive, setIsMonthFilterActive] = useState(true);
    const [expandedRows, setExpandedRows] = useState({});

    // নতুন ফিল্টারের স্টেট (একাধিক সিলেক্ট করার জন্য অ্যারে)
    const [selectedDeliverymen, setSelectedDeliverymen] = useState([]);
    const [selectedShops, setSelectedShops] = useState([]);
    const currentMonthName = new Date().toLocaleString('en-GB', { month: 'long' });

    useEffect(() => {
        axios.get('http://localhost:5000/item')
            .then((res) => {
                setItems(res.data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Error fetching data:', err);
                setError('ডেটা লোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
                setLoading(false);
            });
    }, []);

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // ডেট ফিল্টারিং
    const filteredOrders = useMemo(() => {
        return items.filter(order => {
            const customer = order.customer || {};
            if (!customer.date) return !isMonthFilterActive && !startDate && !endDate;

            const dateParts = customer.date.split("/");
            if (dateParts.length !== 3) return false;

            const [day, month, year] = dateParts.map(Number);
            const itemDate = new Date(year, month - 1, day);
            const today = new Date();

            let matchesMonth = true;
            if (isMonthFilterActive) {
                matchesMonth = itemDate.getMonth() === today.getMonth() &&
                    itemDate.getFullYear() === today.getFullYear();
            }

            let matchesDate = true;
            if (startDate) {
                const sDate = new Date(startDate);
                sDate.setHours(0, 0, 0, 0);
                matchesDate = matchesDate && itemDate >= sDate;
            }
            if (endDate) {
                const eDate = new Date(endDate);
                eDate.setHours(23, 59, 59, 999);
                matchesDate = matchesDate && itemDate <= eDate;
            }

            return matchesMonth && matchesDate;
        });
    }, [items, startDate, endDate, isMonthFilterActive]);

    // ড্রপডাউনের জন্য ইউনিক Deliveryman লিস্ট (মূল ডাটা থেকে)
    const uniqueDeliverymen = useMemo(() => {
        const list = new Set();
        filteredOrders.forEach(order => {
            const deliveryman = order.customer?.deliveryMan;
            if (deliveryman && deliveryman !== '-') {
                list.add(deliveryman.trim());
            }
        });
        return Array.from(list);
    }, [filteredOrders]);

    // ড্রপডাউনের জন্য ইউনিক Shop লিস্ট (মূল ডাটা থেকে)
    const uniqueShops = useMemo(() => {
        const list = new Set();
        filteredOrders.forEach(order => {
            if (order.items && Array.isArray(order.items)) {
                order.items.forEach(item => {
                    if (item.shop && item.shop !== '-') {
                        list.add(item.shop.trim());
                    }
                });
            }
        });
        return Array.from(list);
    }, [filteredOrders]);

    // অর্ডারের ভেতরের আইটেমগুলোকে প্রোডাক্টের নাম অনুযায়ী গ্রুপ, সাম (Sum) এবং Strict Filter করা
    const flatSalesData = useMemo(() => {
        const aggregatedMap = new Map();

        filteredOrders.forEach((order) => {
            const customer = order.customer || {};
            const orderDate = customer.date || '-';
            const deliveryman = customer.deliveryMan || '-';

            // ১. ডেলিভারিম্যান ফিল্টার চেক (Strict Match)
            const matchesDeliveryman = selectedDeliverymen.length === 0 || selectedDeliverymen.includes(deliveryman);
            if (!matchesDeliveryman) return;

            if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item) => {
                    const shopName = item.shop ? item.shop.trim() : '-';

                    // ২. শপ ফিল্টার চেক (Strict Match)
                    const matchesShop = selectedShops.length === 0 || selectedShops.includes(shopName);
                    if (!matchesShop) return;

                    const rawProductName = item.product ? item.product.trim() : 'Unknown Product';
                    const key = rawProductName.toLowerCase();

                    const costPrice = Number(item.costPrice || 0);
                    const unitPrice = Number(item.unitPrice || 0);
                    const quantityNum = Number(item.quantity || 0);
                    const unitStr = item.unit ? item.unit.trim() : '';
                    const buyPrice = costPrice * quantityNum;
                    const salesPrice = Number(item.totalPrice || 0);
                    const discount = Number(item.discount || 0);
                    const profit = Number(item.profit || 0);

                    // সিঙ্গেল অর্ডারের অবজেক্ট (Breakdown এর জন্য)
                    const subItem = {
                        date: orderDate,
                        shop: shopName,
                        deliveryman: deliveryman,
                        quantity: `${quantityNum} ${unitStr}`.trim(),
                        costPrice,
                        unitPrice,
                        buyPrice,
                        salesPrice,
                        discount,
                        profit
                    };

                    if (aggregatedMap.has(key)) {
                        const existing = aggregatedMap.get(key);
                        existing.quantityNum += quantityNum;
                        existing.buyPrice += buyPrice;
                        existing.salesPrice += salesPrice;
                        existing.discount += discount;
                        existing.profit += profit;

                        existing.unitPrice = Math.max(existing.unitPrice, unitPrice);
                        existing.costPrice = costPrice || existing.costPrice;

                        if (!existing.dates.includes(orderDate)) existing.dates.push(orderDate);
                        if (!existing.shops.includes(shopName)) existing.shops.push(shopName);
                        if (!existing.deliverymen.includes(deliveryman)) existing.deliverymen.push(deliveryman);

                        existing.subItems.push(subItem);
                    } else {
                        aggregatedMap.set(key, {
                            id: item.id || `${order._id}_${Math.random()}`,
                            productName: rawProductName,
                            unit: unitStr,
                            costPrice: costPrice,
                            unitPrice: unitPrice,
                            quantityNum: quantityNum,
                            buyPrice: buyPrice,
                            salesPrice: salesPrice,
                            discount: discount,
                            profit: profit,
                            dates: [orderDate],
                            shops: [shopName],
                            deliverymen: [deliveryman],
                            subItems: [subItem]
                        });
                    }
                });
            }
        });

        const formatDateStr = (dateInput) => {
            if (!dateInput) return '';
            const d = new Date(dateInput);
            if (isNaN(d.getTime())) return dateInput;
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        };

        return Array.from(aggregatedMap.values()).map((item) => {
            let displayDate = "";

            if (startDate && endDate) {
                displayDate = `${formatDateStr(startDate)} - ${formatDateStr(endDate)}`;
            } else if (startDate) {
                displayDate = `${formatDateStr(startDate)} - ${formatDateStr(new Date())}`;
            } else if (endDate) {
                const sortedDates = [...item.dates].sort((a, b) => {
                    const [d1, m1, y1] = a.split('/').map(Number);
                    const [d2, m2, y2] = b.split('/').map(Number);
                    return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
                });
                const firstDate = sortedDates[0] || formatDateStr(new Date());
                displayDate = `${firstDate} - ${formatDateStr(endDate)}`;
            } else if (isMonthFilterActive) {
                const today = new Date();
                const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                displayDate = `${formatDateStr(firstDayOfMonth)} - ${formatDateStr(today)}`;
            } else {
                if (item.dates.length === 1) {
                    displayDate = item.dates[0];
                } else if (item.dates.length > 1) {
                    const sortedDates = [...item.dates].sort((a, b) => {
                        const [d1, m1, y1] = a.split('/').map(Number);
                        const [d2, m2, y2] = b.split('/').map(Number);
                        return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
                    });
                    displayDate = `${sortedDates[0]} - ${sortedDates[sortedDates.length - 1]}`;
                } else {
                    displayDate = '-';
                }
            }

            return {
                id: item.id,
                date: displayDate,
                productName: item.productName,
                shop: item.shops.join(', '),
                deliveryman: item.deliverymen.join(', '),
                quantity: `${item.quantityNum} ${item.unit}`.trim(),
                costPrice: item.costPrice,
                unitPrice: item.unitPrice,
                buyPrice: item.buyPrice,
                salesPrice: item.salesPrice,
                discount: item.discount,
                profit: item.profit,
                subItems: item.subItems
            };
        });
    }, [filteredOrders, startDate, endDate, isMonthFilterActive, selectedDeliverymen, selectedShops]);

    // কম্বাইন্ড ফিল্টারিং এবং Lined Up সর্টিং
    const finalTableData = useMemo(() => {
        // ১. সার্চবার অনুযায়ী ফিল্টার
        let data = flatSalesData.filter(row => {
            return !searchTerm.trim() ||
                (row.productName && row.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (row.shop && row.shop.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (row.deliveryman && row.deliveryman.toLowerCase().includes(searchTerm.toLowerCase()));
        });

        // ২. Lined up টিক দেওয়া থাকলে শপ অনুযায়ী সাজানো
        if (isLinedUp) {
            data.sort((a, b) => {
                const shopA = (a?.shop || "").toString().trim();
                const shopB = (b?.shop || "").toString().trim();

                if (typeof selectedShops !== 'undefined' && Array.isArray(selectedShops) && selectedShops.length > 0) {
                    const indexA = selectedShops.indexOf(shopA);
                    const indexB = selectedShops.indexOf(shopB);

                    if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                    if (indexA !== -1) return -1;
                    if (indexB !== -1) return 1;
                }

                return shopA.localeCompare(shopB, undefined, { numeric: true, sensitivity: 'base' });
            });
        }

        return data;
    }, [flatSalesData, searchTerm, isLinedUp, typeof selectedShops !== 'undefined' ? selectedShops : null]);


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
                <span className="ml-3 text-lg font-bold text-slate-600">ডেটা লোড হচ্ছে...</span>
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



    // চেকবাক্স সিলেকশন অথবা ফিল্টার করা డేটা অনুযায়ী টোটাল হিসাব
    const displayData = selectedRowIds.length > 0
        ? finalTableData.filter(row => selectedRowIds.includes(row.id))
        : finalTableData;

    const totals = displayData.reduce(
        (acc, row) => ({
            buyPrice: acc.buyPrice + (Number(row.buyPrice) || 0),
            salesPrice: acc.salesPrice + (Number(row.salesPrice) || 0),
            discount: acc.discount + (Number(row.discount) || 0),
            profit: acc.profit + (Number(row.profit) || 0),
        }),
        { buyPrice: 0, salesPrice: 0, discount: 0, profit: 0 }
    );

    // সিলেক্ট অল টগল হ্যান্ডলার
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedRowIds(finalTableData.map(row => row.id));
        } else {
            setSelectedRowIds([]);
        }
    };

    // সিঙ্গেল রো চেকবাক্স টগল হ্যান্ডলার
    const handleSelectRow = (id) => {
        setSelectedRowIds(prev =>
            prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
        );
    };







    return (
        <div className="min-h-screen bg-slate-50 p-3 sm:p-6 md:p-8 font-sans text-slate-900">
            <div className="max-w-7xl mx-auto">

                {/* হেডার ও কন্ট্রোলস */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-2">
                            <span className="bg-indigo-600 text-white p-2 rounded-xl text-lg sm:text-2xl">📋</span>
                            Item Sales Report
                        </h2>
                        <p className="text-xs text-slate-400 font-bold mt-1">সবগুলো অর্ডারের বিস্তারিত আইটেম টেবিল</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <button
                            onClick={() => setIsMonthFilterActive(!isMonthFilterActive)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm w-full sm:w-auto justify-center ${isMonthFilterActive
                                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                                }`}
                        >
                            <FiFilter />
                            {isMonthFilterActive ? currentMonthName : "All Data"}
                        </button>

                        <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-sm w-full sm:w-auto">
                            {/* Start Date */}
                            <div
                                className="relative group cursor-pointer"
                                onClick={(e) => e.currentTarget.querySelector('input')?.showPicker()}
                            >
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full"
                                />
                                <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 p-2 rounded-lg text-indigo-600 min-w-[115px] border border-slate-200 group-hover:border-indigo-100 transition-all">
                                    <FiCalendar className="text-indigo-400" />
                                    <span>
                                        {startDate
                                            ? (() => {
                                                const [y, m, d] = startDate.split('-');
                                                return `${d}/${m}/${y}`;
                                            })()
                                            : "শুরু তারিখ"}
                                    </span>
                                </div>
                            </div>

                            <span className="text-slate-400 font-bold text-xs">to</span>

                            {/* End Date */}
                            <div
                                className="relative group cursor-pointer"
                                onClick={(e) => e.currentTarget.querySelector('input')?.showPicker()}
                            >
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-20 w-full"
                                />
                                <div className="flex items-center gap-2 text-xs font-bold bg-slate-50 p-2 rounded-lg text-indigo-600 min-w-[115px] border border-slate-200 group-hover:border-indigo-100 transition-all">
                                    <FiCalendar className="text-indigo-400" />
                                    <span>
                                        {endDate
                                            ? (() => {
                                                const [y, m, d] = endDate.split('-');
                                                return `${d}/${m}/${y}`;
                                            })()
                                            : "শেষ তারিখ"}
                                    </span>
                                </div>
                            </div>

                            {(startDate || endDate) && (
                                <FiX
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setStartDate("");
                                        setEndDate("");
                                    }}
                                    className="cursor-pointer text-slate-400 hover:text-red-500 ml-1 z-30"
                                />
                            )}
                        </div>
                    </div>
                </div>


                {/* ডেলিভারিম্যান ও শপ মাল্টি-সিলেক্ট ড্রপডাউন */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Deliveryman Dropdown */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-xs font-black text-slate-600 mb-1">
                            🚚 Deliveryman (Ctrl/Cmd চেপে একাধিক সিলেক্ট করুন):
                        </label>
                        <select
                            multiple
                            value={selectedDeliverymen}
                            onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedDeliverymen(options);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none h-20"
                        >
                            {uniqueDeliverymen.map((dm, idx) => (
                                <option key={idx} value={dm} className="py-0.5">{dm}</option>
                            ))}
                        </select>
                        {selectedDeliverymen.length > 0 && (
                            <button
                                onClick={() => setSelectedDeliverymen([])}
                                className="text-[10px] text-emerald-500 font-bold mt-1 hover:underline flex items-center gap-1"
                            >
                                <FiX size={12} /> রিচেট ডেলিভারিম্যান ফিল্টার
                            </button>
                        )}
                    </div>



























                    {/* Shop Dropdown */}
                    <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-xs font-black text-slate-600 mb-1">
                            🏪 Shop (Ctrl/Cmd চেপে একাধিক সিলেক্ট করুন):
                        </label>
                        <select
                            multiple
                            value={selectedShops}
                            onChange={(e) => {
                                const options = Array.from(e.target.selectedOptions, option => option.value);
                                setSelectedShops(options);
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-700 outline-none h-20"
                        >
                            {uniqueShops.map((shop, idx) => (
                                <option key={idx} value={shop} className="py-0.5">{shop}</option>
                            ))}
                        </select>
                        {selectedShops.length > 0 && (
                            <button
                                onClick={() => setSelectedShops([])}
                                className="text-[10px] text-emerald-500 font-bold mt-1 hover:underline flex items-center gap-1"
                            >
                                <FiX size={12} /> রিচেট শপ ফিল্টার
                            </button>
                        )}
                    </div>
                </div>

                <div className="mb-6 flex flex-col sm:flex-row items-center gap-3 w-full">
                    <div className="relative w-full sm:w-3/4">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            placeholder="প্রোডাক্টের নাম, শপ বা ডেলিভারিম্যান লিখে সার্চ করুন..."
                            className="pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl w-full shadow-sm outline-none font-bold text-sm text-slate-700"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="w-full sm:w-1/4 h-[46px] bg-white border border-slate-200 rounded-xl shadow-sm px-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors">
                        <label htmlFor="linedUpCheck" className="text-sm font-bold text-slate-700 cursor-pointer select-none">
                            Lined up
                        </label>
                        <input
                            id="linedUpCheck"
                            type="checkbox"
                            checked={isLinedUp}
                            onChange={(e) => setIsLinedUp(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                    </div>
                </div>

                {/* ডাইনামিক টোটাল হিসাব সামারি বার */}
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
                        <span className="block text-[10px] sm:text-xs font-black text-slate-500 uppercase">Total Buy Price</span>
                        <span className="text-sm sm:text-base font-black text-slate-700 font-mono">৳{totals.buyPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-indigo-50/50 p-2.5 sm:p-3 rounded-xl border border-indigo-100/50">
                        <span className="block text-[10px] sm:text-xs font-black text-indigo-500 uppercase">Total Sales Price</span>
                        <span className="text-sm sm:text-base font-black text-indigo-700 font-mono">৳{totals.salesPrice.toLocaleString()}</span>
                    </div>
                    <div className="bg-red-50/50 p-2.5 sm:p-3 rounded-xl border border-red-100/50">
                        <span className="block text-[10px] sm:text-xs font-black text-red-500 uppercase">Total Discount</span>
                        <span className="text-sm sm:text-base font-black text-red-600 font-mono">৳{totals.discount.toLocaleString()}</span>
                    </div>
                    <div className="bg-emerald-50/50 p-2.5 sm:p-3 rounded-xl border border-emerald-100/50">
                        <span className="block text-[10px] sm:text-xs font-black text-emerald-600 uppercase">
                            Total Profit {selectedRowIds.length > 0 && `(${selectedRowIds.length} Selected)`}
                        </span>
                        <span className="text-sm sm:text-base font-black text-emerald-600 font-mono">৳{totals.profit.toLocaleString()}</span>
                    </div>
                </div>

                {/* টেবিল সেকশন */}
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                    <div
                        className="overflow-x-auto touch-pan-x cursor-grab active:cursor-grabbing select-none overflow-y-hidden"
                        onMouseDown={(e) => {
                            const ele = e.currentTarget;
                            ele.isDown = true;
                            ele.startX = e.pageX - ele.offsetLeft;
                            ele.scrollLeftPos = ele.scrollLeft;
                        }}
                        onMouseLeave={(e) => { e.currentTarget.isDown = false; }}
                        onMouseUp={(e) => { e.currentTarget.isDown = false; }}
                        onMouseMove={(e) => {
                            const ele = e.currentTarget;
                            if (!ele.isDown) return;
                            e.preventDefault();
                            const x = e.pageX - ele.offsetLeft;
                            const walk = (x - ele.startX) * 1.5;
                            ele.scrollLeft = ele.scrollLeftPos - walk;
                        }}
                    >
                        <table className="w-full text-left min-w-[1100px] border-collapse">
                            <thead>
                                <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 text-xs font-black uppercase tracking-wider">
                                    <th className="pl-4 pr-2 py-4 text-center w-10">
                                        <input
                                            type="checkbox"
                                            checked={finalTableData.length > 0 && selectedRowIds.length === finalTableData.length}
                                            onChange={handleSelectAll}
                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                        />
                                    </th>
                                    <th className="px-4 py-4 text-center">Date</th>
                                    <th className="px-4 py-4 text-left">product Name</th>
                                    <th className="px-4 py-4 text-center">Shop Name</th>
                                    <th className="px-4 py-4 text-left">Deliveryman</th>
                                    <th className="px-4 py-4 text-center">Quantity</th>
                                    <th className="px-4 py-4 text-right">CostPrice</th>
                                    <th className="px-4 py-4 text-right">UnitPrice</th>
                                    <th className="px-4 py-4 text-right">BuyPrice</th>
                                    <th className="px-4 py-4 text-right">SalesPrice</th>
                                    <th className="px-4 py-4 text-right">Discount</th>
                                    <th className="px-4 py-4 text-right">Profit</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-bold text-slate-700">
                                {finalTableData.length === 0 ? (
                                    <tr>
                                        <td colSpan="12" className="text-center py-12 text-slate-400 font-bold">
                                            কোনো ডেটা পাওয়া যায়নি!
                                        </td>
                                    </tr>
                                ) : (
                                    finalTableData.map((row) => {
                                        const isExpanded = expandedRows[row.id];
                                        const isSelected = selectedRowIds.includes(row.id);

                                        return (
                                            <React.Fragment key={row.id}>
                                                {/* মেইন রো */}
                                                <tr className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-indigo-50/60' : isExpanded ? 'bg-indigo-50/40' : ''}`}>
                                                    {/* Checkbox */}
                                                    <td className="pl-4 pr-2 py-3.5 text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={() => handleSelectRow(row.id)}
                                                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                        />
                                                    </td>

                                                    {/* 1. Date */}
                                                    <td className="px-3 py-3.5 text-center text-slate-500 font-mono text-[11px] leading-tight min-w-[85px]">
                                                        {row.date ? row.date.replace(/\s*-\s*/g, ' - ').split(' - ').map((d, i) => (
                                                            <span key={i} className="block">{d}</span>
                                                        )) : '-'}
                                                    </td>
                                                    {/* 2. Product Name (সাথে Down/Up Arrow) */}
                                                    <td className="px-4 py-3.5 font-black text-slate-800">
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => toggleRow(row.id)}
                                                                className="p-1 rounded-lg bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-600 transition-colors"
                                                                title="সিঙ্গেল বিবরণ দেখুন"
                                                            >
                                                                {isExpanded ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
                                                            </button>
                                                            <span>{highlightText(row.productName, searchTerm)}</span>
                                                        </div>
                                                    </td>

                                                    {/* 3. Shop Name */}
                                                    <td className="px-4 py-3.5 text-center">
                                                        <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded text-[11px] font-black uppercase">
                                                            {highlightText(row.shop, searchTerm)}
                                                        </span>
                                                    </td>

                                                    {/* 4. Deliveryman */}
                                                    <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                                                        {highlightText(row.deliveryman, searchTerm)}
                                                    </td>

                                                    {/* 5. Quantity */}
                                                    <td className="px-4 py-3.5 text-center font-black text-indigo-600 whitespace-nowrap">
                                                        {row.quantity}
                                                    </td>

                                                    {/* 6. CostPrice */}
                                                    <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                                                        ৳{row.costPrice.toLocaleString()}
                                                    </td>

                                                    {/* 7. UnitPrice (সর্বোচ্চ মান) */}
                                                    <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                                                        ৳{row.unitPrice.toLocaleString()}
                                                    </td>

                                                    {/* 8. BuyPrice */}
                                                    <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                                                        ৳{row.buyPrice.toLocaleString()}
                                                    </td>

                                                    {/* 9. SalesPrice */}
                                                    <td className="px-4 py-3.5 text-right font-mono font-black text-slate-900">
                                                        ৳{row.salesPrice.toLocaleString()}
                                                    </td>

                                                    {/* 10. Discount */}
                                                    <td className="px-4 py-3.5 text-right font-mono text-red-500">
                                                        ৳{row.discount.toLocaleString()}
                                                    </td>

                                                    {/* 11. Profit */}
                                                    <td className="px-4 py-3.5 text-right font-mono font-black">
                                                        <span className={`px-2 py-0.5 rounded ${row.profit >= 0
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                                            : 'bg-red-50 text-red-600 border border-red-100'
                                                            }`}>
                                                            ৳{row.profit.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>

                                                {/* ড্রপডাউন সাব-রো (Breakdown Table) */}
                                                {isExpanded && (
                                                    <tr className="bg-slate-50/80 border-y border-indigo-100/70">
                                                        <td colSpan={10} className="p-3 sm:p-4">
                                                            <div className="w-full bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                                                                {/* Header Title */}
                                                                <h4 className="text-[11px] font-black uppercase text-indigo-600 mb-2 flex items-center gap-1">
                                                                    <span>📦</span> Single Order Breakdown ({row.subItems?.length || 0} orders)
                                                                </h4>

                                                                {/* Y-অক্ষ বরাবর Max Height এবং Scrollbar, X-অক্ষ Full Width */}
                                                                <div className="max-h-[300px] overflow-y-auto overflow-x-auto rounded-lg border border-slate-100">
                                                                    <table className="w-full text-left text-[11px] relative">
                                                                        <thead className="sticky top-0 z-10 bg-slate-100">
                                                                            <tr className="text-slate-500 border-b border-slate-200 uppercase font-black">
                                                                                <th className="p-2 text-center whitespace-nowrap">Date</th>
                                                                                <th className="p-2 whitespace-nowrap">Shop</th>
                                                                                <th className="p-2 whitespace-nowrap">Deliveryman</th>
                                                                                <th className="p-2 text-center whitespace-nowrap">Qty</th>
                                                                                <th className="p-2 text-right whitespace-nowrap">Cost Price</th>
                                                                                <th className="p-2 text-right whitespace-nowrap">Unit Price</th>
                                                                                <th className="p-2 text-right whitespace-nowrap">Buy Price</th>
                                                                                <th className="p-2 text-right whitespace-nowrap">Sales Price</th>
                                                                                <th className="p-2 text-right whitespace-nowrap">Discount</th>
                                                                                <th className="p-2 text-right whitespace-nowrap">Profit</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-100 font-semibold bg-white">
                                                                            {row.subItems && row.subItems.map((sub, idx) => (
                                                                                <tr key={sub.id || idx} className="hover:bg-indigo-50/30">
                                                                                    <td className="p-2 text-center text-slate-500 font-mono text-[10px] leading-tight min-w-[75px]">
                                                                                        {sub.date ? sub.date.replace(/\s*-\s*/g, ' - ').split(' - ').map((d, i) => (
                                                                                            <span key={i} className="block">{d}</span>
                                                                                        )) : '-'}
                                                                                    </td>
                                                                                    <td className="p-2 text-slate-700 whitespace-nowrap">{sub.shop || '-'}</td>
                                                                                    <td className="p-2 text-slate-600 whitespace-nowrap">{sub.deliveryman || '-'}</td>
                                                                                    <td className="p-2 text-center font-bold text-indigo-600 whitespace-nowrap">{sub.quantity}</td>
                                                                                    <td className="p-2 text-right font-mono whitespace-nowrap">৳{sub.costPrice}</td>
                                                                                    <td className="p-2 text-right font-mono whitespace-nowrap">৳{sub.unitPrice}</td>
                                                                                    <td className="p-2 text-right font-mono whitespace-nowrap">৳{sub.buyPrice}</td>
                                                                                    <td className="p-2 text-right font-mono font-bold whitespace-nowrap">৳{sub.salesPrice}</td>
                                                                                    <td className="p-2 text-right font-mono text-red-500 whitespace-nowrap">৳{sub.discount}</td>
                                                                                    <td className="p-2 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">৳{sub.profit}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}

                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProductSalesTable;