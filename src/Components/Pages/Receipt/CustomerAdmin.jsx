import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, NavLink } from "react-router-dom";
import {
  FiPrinter,
  FiTrash2,
  FiCalendar,
  FiHash,
  FiPhone,
  FiSearch,
  FiPlusCircle,
  FiEdit3,
  FiTrendingUp,
  FiShoppingBag,
  FiBarChart2,
  FiX,
  FiShoppingCart
} from "react-icons/fi";

const CustomerAdmin = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const navigate = useNavigate();

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });

  const fetchItems = async () => {
    try {
      const res = await axios.get("https://squirrel-peace-server.onrender.com/item");
      setItems(res.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const customer = item.customer || {};
      const matchesSearch =
        customer.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm) ||
        customer.invoiceNumber?.includes(searchTerm);

      if (!customer.date) return matchesSearch;
      const [day, month, year] = customer.date.split("/");
      const itemDate = new Date(`${year}-${month}-${day}`);

      let matchesDate = true;
      if (startDate) matchesDate = matchesDate && itemDate >= new Date(startDate);
      if (endDate) matchesDate = matchesDate && itemDate <= new Date(endDate);

      return matchesSearch && matchesDate;
    });
  }, [items, searchTerm, startDate, endDate]);

  const summary = useMemo(() => {
    const targetData = selectedIds.length > 0
      ? items.filter(i => selectedIds.includes(i._id))
      : filteredItems;

    let totalSell = 0;
    let totalProfit = 0;
    let totalCost = 0;
    const shopWiseData = {};

    targetData.forEach(inv => {
      totalSell += Number(inv.grandTotal || 0);
      totalProfit += Number(inv.totalProfit || 0);
      inv.items?.forEach(item => {
        const cost = (Number(item.costPrice || 0) * Number(item.quantity || 1));
        totalCost += cost;

        const shopName = item.shop?.trim() || "Other";
        if (!shopWiseData[shopName]) {
          shopWiseData[shopName] = { cost: 0, profit: 0, sell: 0 };
        }
        shopWiseData[shopName].cost += cost;
        shopWiseData[shopName].sell += Number(item.totalPrice || 0);
        shopWiseData[shopName].profit += Number(item.profit || 0);
      });
    });

    const profitPercentage = totalCost > 0 ? ((totalProfit / totalCost) * 100).toFixed(2) : 0;
    return { totalSell, totalProfit, totalCost, profitPercentage, shopWiseData };
  }, [filteredItems, selectedIds, items]);

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? filteredItems.map((item) => item._id) : []);
  };

  const handleSelectItem = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handlePrintSelected = () => {
    const selectedData = items.filter((item) => selectedIds.includes(item._id));
    if (selectedData.length > 0) navigate("/pdf", { state: { bulkData: selectedData } });
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "ডিলিট করবেন?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#6366f1",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "হ্যাঁ",
      cancelButtonText: "না"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`https://squirrel-peace-server.onrender.com/item/${id}`);
          Toast.fire({ icon: "success", title: "মুছে ফেলা হয়েছে" });
          fetchItems();
        } catch (error) {
          Toast.fire({ icon: "error", title: "সমস্যা হয়েছে" });
        }
      }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8 font-sans text-slate-900">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
       
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
          <div className="flex items-center justify-between w-full lg:w-auto">
            <h2 className="text-2xl md:text-4xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
              <span className="bg-indigo-600 text-white p-2 md:p-3 rounded-2xl shadow-xl shadow-indigo-200">📋</span>
              Admin Panel
            </h2>

            {/* মোবাইল ভিউতে বাটনটি এখানে দেখাবে (ডান পাশে) */}
            <NavLink to="/receipt" className="lg:hidden flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl font-black shadow-lg text-sm">
              <FiPlusCircle /> Receipt
            </NavLink>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* তারিখ এবং সার্চ ইনপুট আগের মতোই থাকবে */}
            <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="text-xs font-bold outline-none bg-slate-50 p-2 rounded-lg text-indigo-600" />
              <span className="text-slate-400 font-bold">to</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="text-xs font-bold outline-none bg-slate-50 p-2 rounded-lg text-indigo-600" />
              {(startDate || endDate) && <FiX onClick={() => { setStartDate(""); setEndDate(""); }} className="cursor-pointer text-slate-400 hover:text-indigo-600" />}
            </div>

            <div className="relative w-full md:w-64">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="খুঁজুন..." className="pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl w-full shadow-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-bold text-sm" onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            {/* ল্যাপটপ ভিউর জন্য বাটন (আগের মতো) */}
            <NavLink to="/receipt" className="hidden lg:flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
              <FiPlusCircle /> New Receipt
            </NavLink>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">

          {/* Card 1: Cost */}
          <div className="bg-white p-6 rounded-[2.5rem] border-b-8 border-b-indigo-500 shadow-xl shadow-indigo-100/50 flex flex-col group transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">মোট ক্রয়মূল্য</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{summary.totalCost.toLocaleString()} ৳</h3>
              </div>
              <div className="bg-indigo-50 p-4 rounded-3xl text-indigo-600 group-hover:scale-110 transition-transform">
                <FiShoppingCart size={32} />
              </div>
            </div>
            <div className="space-y-2 mt-auto">
              {Object.entries(summary.shopWiseData).map(([shop, data]) => (
                <div key={shop} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-black text-slate-500 uppercase">{shop}</span>
                  <span className="text-sm font-black text-indigo-600">{data.cost.toLocaleString()} ৳</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 2: Profit */}
          <div className="bg-white p-6 rounded-[2.5rem] border-b-8 border-b-emerald-500 shadow-xl shadow-emerald-100/50 flex flex-col group transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">মোট লাভ</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{summary.totalProfit.toLocaleString()} ৳</h3>
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg text-[10px] font-black">{summary.profitPercentage}%</span>
                </div>
              </div>
              <div className="bg-emerald-50 p-4 rounded-3xl text-emerald-600 group-hover:scale-110 transition-transform">
                <FiTrendingUp size={32} />
              </div>
            </div>
            <div className="space-y-2 mt-auto">
              {Object.entries(summary.shopWiseData).map(([shop, data]) => (
                <div key={shop} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-black text-slate-500 uppercase">{shop}</span>
                  <span className="text-sm font-black text-emerald-600">+{data.profit.toLocaleString()} ৳</span>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Sell */}
          <div className="bg-white p-6 rounded-[2.5rem] border-b-8 border-b-cyan-500 shadow-xl shadow-cyan-100/50 flex flex-col group transition-all hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.2em] mb-1">সর্বমোট বিক্রয়</p>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter">{summary.totalSell.toLocaleString()} ৳</h3>
              </div>
              <div className="bg-cyan-50 p-4 rounded-3xl text-cyan-600 group-hover:scale-110 transition-transform">
                <FiBarChart2 size={32} />
              </div>
            </div>
            <div className="space-y-2 mt-auto">
              {Object.entries(summary.shopWiseData).map(([shop, data]) => (
                <div key={shop} className="flex items-center justify-between bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <span className="text-xs font-black text-slate-500 uppercase">{shop}</span>
                  <span className="text-sm font-black text-cyan-600">{data.sell.toLocaleString()} ৳</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Counter */}
        {selectedIds.length > 0 && (
          <div className="mb-6 flex items-center justify-between bg-indigo-600 p-5 rounded-3xl shadow-xl animate-bounce-short">
            <span className="text-white font-black text-sm md:text-base">নির্বাচিত ইনভয়েস: {selectedIds.length} টি</span>
            <button onClick={handlePrintSelected} className="bg-white text-indigo-700 px-6 py-2 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all flex items-center gap-2">
              <FiPrinter /> প্রিন্ট করুন
            </button>
          </div>
        )}

        {/* Table Section */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1000px]">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100 text-slate-400 text-[11px] font-black uppercase tracking-widest">
                  <th className="px-8 py-7 text-center w-20">
                    <input type="checkbox" className="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer" onChange={handleSelectAll} checked={selectedIds.length === filteredItems.length && filteredItems.length > 0} />
                  </th>
                  <th className="px-4 py-7">SL</th>
                  <th className="px-6 py-7">কাস্টমার প্রোফাইল</th>
                  <th className="px-6 py-7 text-center">ইনভয়েস নং</th>
                  <th className="px-6 py-7 text-center">তারিখ</th>
                  <th className="px-6 py-7">ডেলিভারি</th>
                  <th className="px-6 py-7 text-right">মোট টাকা</th>
                  <th className="px-8 py-7 text-center">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item, index) => {
                  const isSelected = selectedIds.includes(item._id);
                  return (
                    <tr key={item._id} className={`group transition-all hover:bg-indigo-50/30 ${isSelected ? 'bg-indigo-50/60' : ''}`}>
                      <td className="px-8 py-5 text-center">
                        <input type="checkbox" className="w-5 h-5 rounded-lg accent-indigo-600 cursor-pointer" checked={isSelected} onChange={() => handleSelectItem(item._id)} />
                      </td>
                      <td className="px-4 py-5">
                        <span className="text-sm font-black text-slate-300 group-hover:text-indigo-400">{String(index + 1).padStart(2, '0')}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-lg border transition-all ${isSelected ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-indigo-200'}`}>
                            {item.customer?.customerName?.charAt(0) || "C"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 text-base">{item.customer?.customerName || "নাম নেই"}</span>
                            <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                              <FiPhone size={12} className="text-indigo-500" /> {item.customer?.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-black border border-slate-200">#{item.customer?.invoiceNumber}</span>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="text-xs text-slate-600 font-black flex items-center justify-center gap-1.5">
                          <FiCalendar className="text-indigo-400" /> {item.customer?.date}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase text-slate-400 font-black mb-1">রাইডার</span>
                          <span className="text-xs font-black text-slate-700 flex items-center gap-1.5 italic">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {item.customer?.deliveryMan}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-900 text-lg tracking-tighter">{Number(item.grandTotal || 0).toLocaleString()} ৳</span>
                          <span className="text-[10px] text-slate-400 font-bold">{item.items?.length || 0} টি আইটেম</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-3">
                          <button onClick={() => navigate("/receipt", { state: { editId: item._id } })} className="p-2.5 bg-white border border-slate-200 text-amber-500 rounded-xl hover:bg-amber-500 hover:text-white transition-all shadow-sm active:scale-90"><FiEdit3 size={18} /></button>
                          <button onClick={() => navigate("/pdf", { state: item })} className="p-2.5 bg-white border border-slate-200 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"><FiPrinter size={18} /></button>
                          <button onClick={() => handleDelete(item._id)} className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-800 hover:text-white transition-all shadow-sm active:scale-90"><FiTrash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="py-32 text-center flex flex-col items-center">
              <div className="text-6xl mb-4 opacity-20">📂</div>
              <p className="text-slate-400 font-black text-xl tracking-tight">কোনো ইনভয়েস পাওয়া যায়নি!</p>
            </div>
          )}
        </div>

        <div className="mt-16 text-center border-t border-slate-200 pt-10 pb-12">
          <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.4em]">Bashay Bazar Delivery System v2.0</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAdmin;