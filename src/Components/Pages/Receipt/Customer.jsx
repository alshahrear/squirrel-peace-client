import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiPhone, FiMapPin, FiCalendar, FiHash, FiRefreshCw, FiArrowRight, FiTruck } from "react-icons/fi";
import { toast } from "react-hot-toast";

const Customer = ({ savedItemId, items, subTotal, overallDiscount, deliveryCharge, grandTotal, totalProfit, editMode }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const BASE_URL = "https://squirrel-peace-server.onrender.com";

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    deliveryMan: "",
    date: "",
    invoiceNumber: "",
  });

  // সাজেশনের জন্য স্টেটসমূহ
  const [allCustomers, setAllCustomers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const getTodayDate = () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    return `${day}/${month}/${year}`;
  };

 const generateInvoiceNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hour = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const sec = String(now.getSeconds()).padStart(2, "0");
    return `${year}${month}${day}${hour}${min}${sec}`;
  };

  // কাস্টমার ম্যাপের ফলব্যাক হ্যান্ডেল করার জন্য রিসেন্ট লিস্টেও Abdur Rafi সেট করা
  const getDeliveryMan = (order) => {
    if (order && order.customer && order.customer.deliveryMan) {
      return order.customer.deliveryMan;
    }
    return "Abdur Rafi";
  };

  // ১. API থেকে সমস্ত ডাটা এনে সবচেয়ে রিসেন্ট কাস্টমার লিস্ট তৈরি করা
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/item`);
        const allOrders = Array.isArray(res.data) ? res.data : [];
        
        // রিভার্স করা হলো যাতে লুপ চালালে প্রথম ম্যাচটিই সবচেয়ে রিসেন্ট (সর্বশেষ) হয়
        const reversedOrders = [...allOrders].reverse();
        const customerMap = new Map();

reversedOrders.forEach(order => {
          if (order.customer && order.customer.customerName) {
            const nameKey = order.customer.customerName.trim().toLowerCase();
            
            // নতুন ডাটা বা ফোন নাম্বার থাকলে সেটি সবসময় আপডেট বা রিপ্লেস হবে
            if (!customerMap.has(nameKey)) {
              customerMap.set(nameKey, {
                customerName: order.customer.customerName,
                phone: order.customer.phone || "",
                address: order.customer.address || "",
                deliveryMan: getDeliveryMan(order)
              });
            } else {
              // যদি নাম আগেই মিলে যায়, তাও নতুন অর্ডারে যদি সচল ফোন নাম্বার থাকে তবে সেটা আপডেট হবে
              const existing = customerMap.get(nameKey);
              if (order.customer.phone && order.customer.phone.trim() !== "") {
                existing.phone = order.customer.phone;
                existing.address = order.customer.address || existing.address;
                existing.deliveryMan = getDeliveryMan(order) || existing.deliveryMan;
                customerMap.set(nameKey, existing);
              }
            }
          }
        });

        setAllCustomers(Array.from(customerMap.values()));
      } catch (error) {
        console.error("Error fetching all items for suggestion:", error);
      }
    };
    fetchAllData();
  }, []);

  // ২. এডিট মোড অথবা নরমাল মোডে কাস্টমার ডাটা লোড করা
  useEffect(() => {
    const loadCustomerData = async () => {
      if (editMode && savedItemId) {
        try {
          const res = await axios.get(`${BASE_URL}/item/${savedItemId}`);
          const data = res.data;
          
         if (data && data.customer) {
            setFormData({
              customerName: data.customer.customerName || "",
              phone: data.customer.phone || "",
              address: data.customer.address || "",
              deliveryMan: data.customer.deliveryMan || "Abdur Rafi",
              date: data.customer.date || getTodayDate(),
              invoiceNumber: data.customer.invoiceNumber || "",
            });
          }
        } catch (error) {
          console.error("Error loading customer data", error);
          toast.error("কাস্টমার ডাটা লোড করতে সমস্যা হয়েছে!");
        }
      } else {
        setFormData((prev) => ({
          ...prev,
          deliveryMan: "Abdur Rafi",
          date: getTodayDate(),
        }));
      }
    };
    loadCustomerData();
  }, [editMode, savedItemId]);

  // সাজেশনের বাইরে ক্লিক করলে ড্রপডাউন বন্ধ করার হ্যান্ডলার
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ইনপুট চেঞ্জ হ্যান্ডলার + সাজেশন ফিল্টারিং
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "customerName") {
      if (value.trim() === "") {
        setSuggestions([]);
        setShowSuggestions(false);
      } else {
        const filtered = allCustomers.filter(cust =>
          cust.customerName.toLowerCase().includes(value.toLowerCase()) ||
          cust.phone.includes(value)
        );
        setSuggestions(filtered);
        setShowSuggestions(true);
      }
    }
  };

  // সাজেশন সিলেক্ট করার ফাংশন
  const handleSelectSuggestion = (cust) => {
    setFormData((prev) => ({
      ...prev,
      customerName: cust.customerName,
      phone: cust.phone,
      address: cust.address,
      // সাজেশন থেকে ডাটা নিলেও ডেলিভারি ম্যান "Abdur Rafi" বা ইনপুটে যা আছে তাই থাকবে
      deliveryMan: prev.deliveryMan || "Abdur Rafi",
    }));
    setShowSuggestions(false);
    toast.success("আগের কাস্টমারের তথ্য যুক্ত করা হয়েছে!");
  };

  const handleGenerate = () => {
    setFormData((prev) => ({ ...prev, invoiceNumber: generateInvoiceNumber() }));
    toast.success("নতুন ইনভয়েস আইডি জেনারেট হয়েছে!");
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber) return toast.error("অনুগ্রহ করে ইনভয়েস আইডি দিন!");
    if (!savedItemId) return toast.error("আইটেম আইডি পাওয়া যায়নি!");

    setLoading(true);
    try {
      // ১. আইটেমগুলোর ভেতর থেকে প্রফিট যোগ করার ডাইনামিক লজিক
      const totalItemsProfit = items.reduce((sum, item) => sum + (parseFloat(item.profit) || 0), 0);

      // ২. overallDiscount (যেমন: "112 (5.46%)") থেকে শুধু আসল ছাড়ের টাকা আলাদা করার লজিক
      const discStr = String(overallDiscount || "").trim();
      const cleanDiscount = discStr.includes("(") 
        ? parseFloat(discStr.split("(")[0]) 
        : parseFloat(discStr);

      // ৩. নেট প্রফিট = আইটেমগুলোর মোট লাভ - ওভারঅল ডিসকাউন্ট
      const netProfit = totalItemsProfit - (cleanDiscount || 0);

      const finalData = {
        customer: { ...formData }, 
        items: items.map(item => ({
            id: item.id,
            product: item.product,
            shop: item.shop,
            costPrice: parseFloat(item.costPrice) || 0,
            unitPrice: parseFloat(item.unitPrice) || 0,
            quantity: parseFloat(item.quantity) || 0,
            unit: item.unit,
            discount: parseFloat(item.discount) || 0,
            totalPrice: parseFloat(item.totalPrice) || 0,
            profit: parseFloat(item.profit) || 0,
            showQty: item.showQty
        })),
        subTotal: parseFloat(subTotal),
        overallDiscount: overallDiscount, 
        deliveryCharge: parseFloat(deliveryCharge) || 0,
        grandTotal: parseFloat(grandTotal),
        totalProfit: netProfit // এখন এখানে সবসময় ১০০% সঠিক লাভ সেভ হবে
      };

      await axios.put(`${BASE_URL}/item/${savedItemId}`, finalData);
      
      toast.success("সফলভাবে আপডেট করা হয়েছে!");
      
      navigate("/pdf", { 
        state: { 
          ...finalData,
          _id: savedItemId 
        } 
      });

    } catch (err) {
      console.error(err);
      toast.error("সেভ করতে সমস্যা হয়েছে!");
    } finally {
      setLoading(false);
    }
  };




  return (
    <div className="flex items-center justify-center p-2 md:p-4 pb-24">
      <div className="w-full max-w-2xl bg-white rounded-3xl md:rounded-[2.5rem] shadow-xl border border-emerald-50 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-emerald-800 p-6 md:p-8 text-center">
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-wider mb-1">
            Customer Information
          </h2>
          <p className="text-emerald-100/70 text-[10px] font-bold uppercase tracking-[0.2em]">
            Add Details & Save to Database
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            {/* Customer Name Field with Suggestions */}
            <div className="space-y-2 relative" ref={dropdownRef}>
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiUser className="text-emerald-500" /> Customer Name
              </label>
              <input 
                type="text" 
                name="customerName" 
                value={formData.customerName} 
                onChange={handleChange} 
                onFocus={() => formData.customerName && setShowSuggestions(true)}
                placeholder="নাম লিখুন" 
                className="w-full bg-slate-50 ring-1 ring-slate-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" 
                required 
                autoComplete="off"
              />
              
              {/* Suggestion Dropdown Panel */}
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full bg-white mt-1 rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto divide-y divide-slate-50">
                  {suggestions.map((cust, index) => (
                    <li 
                      key={index} 
                      onClick={() => handleSelectSuggestion(cust)}
                      className="p-3.5 hover:bg-emerald-50/60 cursor-pointer transition-colors flex flex-col gap-0.5 text-left"
                    >
                      <span className="font-bold text-slate-800 text-sm">{cust.customerName}</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        📱 {cust.phone} | 📍 {cust.address.substring(0, 25)}{cust.address.length > 25 ? "..." : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiPhone className="text-emerald-500" /> Phone Number
              </label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} placeholder="মোবাইল নম্বর" className="w-full bg-slate-50 ring-1 ring-slate-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiTruck className="text-emerald-500" /> Delivery Man
              </label>
              <input type="text" name="deliveryMan" value={formData.deliveryMan} onChange={handleChange} placeholder="নাম লিখুন" className="w-full bg-slate-50 ring-1 ring-slate-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiMapPin className="text-emerald-500" /> Address
              </label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} placeholder="ঠিকানা" className="w-full bg-slate-50 ring-1 ring-slate-200 p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiCalendar className="text-emerald-500" /> Date
              </label>
              <input type="text" name="date" value={formData.date} onChange={handleChange} className="w-full bg-slate-50 ring-1 ring-slate-200 p-3.5 rounded-2xl text-center font-bold" />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiHash className="text-emerald-500" /> Invoice ID
              </label>
              <input type="text" value={formData.invoiceNumber} readOnly className="w-full bg-emerald-50 ring-1 ring-emerald-100 p-3.5 rounded-2xl font-black text-emerald-700 text-center" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button type="button" onClick={handleGenerate} className="flex items-center justify-center gap-2 border-2 border-emerald-500 text-emerald-600 py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-50 uppercase">
              <FiRefreshCw /> Generate ID
            </button>
            <button type="submit" disabled={loading} className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-3.5 rounded-2xl font-black text-xs hover:bg-emerald-700 shadow-lg uppercase">
              {loading ? "Saving..." : "Confirm & Preview"} <FiArrowRight />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Customer;