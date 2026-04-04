import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FiUser, FiPhone, FiMapPin, FiCalendar, FiHash, FiRefreshCw, FiArrowRight, FiTruck } from "react-icons/fi";
import { toast } from "react-hot-toast";

const Customer = ({ savedItemId, items, subTotal, overallDiscount, deliveryCharge, grandTotal }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    address: "",
    deliveryMan: "",
    date: "",
    invoiceNumber: "",
  });

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

  useEffect(() => {
    setFormData((prev) => ({ ...prev, date: getTodayDate() }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGenerate = () => {
    setFormData((prev) => ({ ...prev, invoiceNumber: generateInvoiceNumber() }));
    toast.success("New ID Generated!");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.invoiceNumber) return toast.error("Please generate Invoice ID first!");
    if (!savedItemId) return toast.error("ItemID not found!");

    setLoading(true);
    try {
      const response = await axios.put(`https://squirrel-peace-server.onrender.com/item/${savedItemId}`, formData);
      if (response.data.modifiedCount > 0 || response.data.acknowledged) {
        toast.success("Processing PDF...");
        
        navigate("/pdf", { 
          state: { 
            customer: { ...formData },
            items: items,
            subTotal: subTotal,
            overallDiscount: overallDiscount,
            deliveryCharge: deliveryCharge,
            grandTotal: grandTotal,
            _id: savedItemId 
          } 
        });
      }
    } catch (err) {
      toast.error("Error saving customer data!");
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
            Final Step: Add Details & Print
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-4 md:space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiUser className="text-emerald-500" /> Customer Name
              </label>
              <input type="text" name="customerName" value={formData.customerName} onChange={handleChange} className="w-full bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 p-3 md:p-3.5 rounded-xl md:rounded-2xl outline-none transition-all" required />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiPhone className="text-emerald-500" /> Phone Number
              </label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 p-3 md:p-3.5 rounded-xl md:rounded-2xl outline-none transition-all" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiTruck className="text-emerald-500" /> Delivery Man Name
              </label>
              <input type="text" name="deliveryMan" value={formData.deliveryMan} onChange={handleChange} className="w-full bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 p-3 md:p-3.5 rounded-xl md:rounded-2xl outline-none transition-all" required />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiMapPin className="text-emerald-500" /> Delivery Address
              </label>
              <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full bg-slate-50 ring-1 ring-slate-200 focus:ring-2 focus:ring-emerald-500 p-3 md:p-3.5 rounded-xl md:rounded-2xl outline-none transition-all" required />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiCalendar className="text-emerald-500" /> Billing Date
              </label>
              <input type="text" value={formData.date} readOnly className="w-full bg-slate-100 p-3 md:p-3.5 rounded-xl md:rounded-2xl font-bold text-slate-500 text-center border border-slate-200" />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-500 ml-1">
                <FiHash className="text-emerald-500" /> Invoice ID
              </label>
              <input type="text" value={formData.invoiceNumber} readOnly placeholder="Click Generate ID" className="w-full bg-emerald-50 ring-1 ring-emerald-100 p-3 md:p-3.5 rounded-xl md:rounded-2xl font-black text-emerald-700 text-center" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 pt-4">
            <button
              type="button"
              onClick={handleGenerate}
              className="group flex items-center justify-center gap-2 bg-white text-emerald-600 border-2 border-emerald-500 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs hover:bg-emerald-50 transition-all active:scale-95"
            >
              <FiRefreshCw className="group-hover:rotate-180 transition-transform duration-500" />
              Generate ID
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`flex items-center justify-center gap-2 py-3 md:py-3.5 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs transition-all ${
                loading ? "bg-slate-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl active:scale-95"
              }`}
            >
              {loading ? "Saving..." : "Print Preview"} <FiArrowRight size={18} />
            </button>
          </div>
        </form>

        <div className="h-2 bg-gradient-to-r from-slate-400 via-emerald-500 to-teal-600"></div>
      </div>
    </div>
  );
};

export default Customer;