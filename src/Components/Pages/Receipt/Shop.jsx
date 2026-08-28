import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiMenu, FiAlertCircle, FiEdit3, FiSearch, FiX, FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Shop = () => {
  const [shops, setShops] = useState([]);
  const [formData, setFormData] = useState({ name: "" });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);

  const navigate = useNavigate();
  const BASE_URL = "http://localhost:5000";

  const fetchShops = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/shop`);
      setShops(res.data);
    } catch (error) { console.error("Error fetching shops", error); }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleReorder = async (fromIndex, toIndex) => {
    if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
    const newList = [...filteredList];
    const [movedItem] = newList.splice(fromIndex, 1);
    newList.splice(toIndex, 0, movedItem);

    try {
      await axios.put(`${BASE_URL}/shop/reorder`, newList);
      toast.success("পজিশন আপডেট হয়েছে");
      fetchShops();
    } catch (error) {
      toast.error("পজিশন সেভ করা সম্ভব হয়নি");
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name) return toast.error("শপের নাম লিখুন");

      if (editingId) {
        await axios.put(`${BASE_URL}/shop/${editingId}`, { name: formData.name });
        toast.success("শপ আপডেট হয়েছে");
      } else {
        await axios.post(`${BASE_URL}/shop`, { name: formData.name });
        toast.success("শপ যোগ হয়েছে");
      }

      fetchShops();
      setFormData({ name: "" });
      setEditingId(null);
    } catch (error) {
      toast.error("সার্ভারে সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত?")) return;
    try {
      await axios.delete(`${BASE_URL}/shop/${id}`);
      fetchShops();
      toast.success("ডিলিট করা হয়েছে");
    } catch (error) {
      toast.error("ডিলিট করা সম্ভব হয়নি");
    }
  };

  const filteredList = shops.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 px-2 sm:px-4 py-6 sm:py-10 font-sans text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6 flex justify-between items-center border border-slate-200">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600">
              <FiArrowLeft size={20} />
            </button>
            <h3 className="font-black text-slate-800 text-base sm:text-xl uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
              Shops Config
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
            Total: {filteredList.length} shops
          </span>
        </div>

        {/* Input Form Section */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="w-full">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Shop Name</label>
              <input
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-semibold"
                placeholder="Enter shop name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <button
              onClick={handleSubmit}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 ${editingId ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {editingId ? <><FiEdit3 size={18} /> Update</> : <><FiPlus size={18} /> Add Shop</>}
            </button>
          </div>
        </div>

        {/* Search Area */}
        <div className="relative">
          <FiSearch size={16} className="absolute inset-y-0 left-4 my-auto text-slate-400" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            placeholder="Search shops by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List Section */}
        <div className="space-y-3 pb-10">
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-300">
              <FiAlertCircle size={40} className="mb-2 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">No shops found</p>
            </div>
          ) : (
            filteredList.map((item, index) => (
              <div
                key={item._id}
                draggable
                onDragStart={() => setDraggedIndex(index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  handleReorder(draggedIndex, index);
                  setDraggedIndex(null);
                }}
                className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all relative"
              >
                <div className="flex items-center gap-3">
                  <div className="text-slate-300 cursor-grab active:cursor-grabbing hover:text-blue-500">
                    <FiMenu size={18} />
                  </div>
                  <span className="font-extrabold text-sm sm:text-base text-slate-800">
                    {item.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditingId(item._id);
                      setFormData({ name: item.name });
                    }}
                    className="p-2 bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-orange-500 rounded-xl transition-all"
                  >
                    <FiEdit3 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default Shop;