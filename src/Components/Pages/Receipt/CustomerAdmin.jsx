import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate, NavLink } from "react-router-dom"; // NavLink যোগ করা হয়েছে
import { 
  FiPrinter, 
  FiTrash2, 
  FiCalendar, 
  FiHash, 
  FiPhone, 
  FiTruck,
  FiSearch,
  FiPlusCircle // নতুন আইকন
} from "react-icons/fi";

const CustomerAdmin = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const navigate = useNavigate();

  // ================= Toast Configuration =================
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

  // ================= Fetch Data =================
  const fetchItems = async () => {
    try {
      const res = await axios.get("https://squirrel-peace-server.onrender.com/item");
      setItems(res.data.reverse());
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // ================= Checkbox Logic =================
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredItems.map((item) => item._id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectItem = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((itemId) => itemId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // ================= Bulk Print Logic =================
  const handlePrintSelected = () => {
    const selectedData = items.filter((item) => selectedIds.includes(item._id));
    if (selectedData.length > 0) {
      navigate("/pdf", { state: { bulkData: selectedData } });
    }
  };

  // ================= Delete Function =================
  const handleDelete = (id) => {
    Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      text: "এটি ডিলিট করলে আর ফিরে পাওয়া যাবে না!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "হ্যাঁ, ডিলিট করুন!",
      cancelButtonText: "বাতিল"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`https://squirrel-peace-server.onrender.com/item/${id}`);
          Toast.fire({
            icon: "success",
            title: "ইনভয়েসটি সফলভাবে মুছে ফেলা হয়েছে"
          });
          fetchItems();
          setSelectedIds(selectedIds.filter(sid => sid !== id));
        } catch (error) {
          Toast.fire({
            icon: "error",
            title: "ডিলিট করতে সমস্যা হয়েছে"
          });
        }
      }
    });
  };

  // ================= Filter Logic (Search) =================
  const filteredItems = items.filter(item => 
    item.customer?.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer?.phone?.includes(searchTerm) ||
    item.customer?.invoiceNumber?.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
          <div className="flex justify-between items-center w-full lg:w-auto">
            <div>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                <span className="bg-cyan-600 text-white p-2 rounded-2xl shadow-lg shadow-cyan-200">📋</span>
                Admin
              </h2>
              <p className="text-slate-500 mt-1 font-medium italic text-xs md:text-sm">বাসায় বাজার - ম্যানেজমেন্ট</p>
            </div>
            
            {/* Mobile Only Receipt Link */}
            <NavLink to="/receipt" className="lg:hidden flex items-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg active:scale-95">
               <FiPlusCircle /> Receipt
            </NavLink>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
            {/* Print All Button */}
            {selectedIds.length > 0 && (
              <button 
                onClick={handlePrintSelected}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all active:scale-95"
              >
                <FiPrinter /> Print ({selectedIds.length})
              </button>
            )}

            {/* Search Bar */}
            <div className="relative group w-full md:w-80">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-600 transition-colors" />
              <input 
                type="text" 
                placeholder="খুঁজুন..."
                className="pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl w-full shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Desktop Receipt Link */}
            <NavLink 
              to="/receipt" 
              className="hidden lg:flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:bg-slate-900 transition-all active:scale-95 shadow-slate-200"
            >
              <FiPlusCircle /> New Receipt
            </NavLink>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[12px] uppercase tracking-[0.1em]">
                  <th className="px-6 py-5 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                      onChange={handleSelectAll}
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    />
                  </th>
                  <th className="px-4 py-5 font-bold">#</th>
                  <th className="px-6 py-5 font-bold text-slate-800">Customer Details</th>
                  <th className="px-6 py-5 font-bold text-center">Invoice Info</th>
                  <th className="px-6 py-5 font-bold text-center text-slate-800">Date</th>
                  <th className="px-6 py-5 font-bold">Delivery</th>
                  <th className="px-6 py-5 font-bold text-right">Total Amount</th>
                  <th className="px-8 py-5 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredItems.map((item, index) => (
                  <tr key={item._id} className={`hover:bg-slate-50/80 transition-all group ${selectedIds.includes(item._id) ? 'bg-cyan-50/40' : ''}`}>
                    <td className="px-6 py-5 text-center">
                       <input 
                        type="checkbox" 
                        className="w-4 h-4 rounded accent-cyan-600 cursor-pointer"
                        checked={selectedIds.includes(item._id)}
                        onChange={() => handleSelectItem(item._id)}
                      />
                    </td>
                    <td className="px-4 py-5">
                      <span className="text-sm font-bold text-slate-300 group-hover:text-cyan-600 transition-colors">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </td>
                    
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 font-bold border border-cyan-100">
                          {item.customer?.customerName?.charAt(0) || "C"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-slate-800 text-[15px]">
                            {item.customer?.customerName || "Unknown"}
                          </span>
                          <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                            <FiPhone size={10} /> {item.customer?.phone}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 mx-auto w-fit border border-slate-200">
                        <FiHash size={12} className="text-slate-400" /> {item.customer?.invoiceNumber || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-5 text-center">
                      <span className="text-sm text-slate-600 font-bold flex items-center justify-center gap-1.5">
                        <FiCalendar className="text-cyan-500" /> {item.customer?.date || "N/A"}
                      </span>
                    </td>

                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-[11px] uppercase text-slate-400 font-black tracking-tighter">Handled By</span>
                        <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                          <FiTruck size={14} className="text-emerald-500" /> {item.customer?.deliveryMan || "N/A"}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-5 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-slate-900 text-lg tracking-tighter">
                          {item.grandTotal?.toLocaleString()} ৳
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase">{item.items?.length || 0} items</span>
                      </div>
                    </td>

                    <td className="px-8 py-5">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => navigate("/pdf", { state: item })}
                          className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all shadow-sm active:scale-90"
                          title="View & Print"
                        >
                          <FiPrinter size={18} />
                        </button>

                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2.5 bg-white border border-slate-200 text-red-500 rounded-xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm active:scale-90"
                          title="Delete Invoice"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan="8" className="py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 bg-slate-100 rounded-full flex items-center justify-center text-3xl">📂</div>
                        <p className="text-slate-400 font-bold text-lg tracking-tight">কোনো ইনভয়েস খুঁজে পাওয়া যায়নি!</p>
                        <button onClick={fetchItems} className="text-cyan-600 text-sm font-black uppercase hover:underline">Refresh List</button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Powered by Bashay Bazar Delivery System</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerAdmin;