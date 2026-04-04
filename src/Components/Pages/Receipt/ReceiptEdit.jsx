import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiX, FiMenu, FiAlertCircle, FiEdit3, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";

const ReceiptEdit = ({ 
  modalType, 
  setShowModal, 
  products, 
  units, 
  fetchProducts, 
  fetchUnits, 
  handleDragStart, 
  handleDragOver, 
  handleDrop 
}) => {
  const [formData, setFormData] = useState({ name: "", price: "", unit: "" });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setFormData({ name: "", price: "", unit: "" });
    setEditingId(null);
    setSearchTerm("");
  }, [modalType]);

  const handleSubmit = async () => {
    const url = modalType === "product" ? "https://squirrel-peace-server.onrender.com/products" : "https://squirrel-peace-server.onrender.com/unit";
    
    try {
      if (modalType === "product") {
        if (!formData.name || !formData.price || !formData.unit) {
          return toast.error("সবগুলো ঘর পূরণ করুন");
        }
        
        const payload = {
          name: formData.name,
          price: Number(formData.price),
          unit: formData.unit
        };

        if (editingId) {
          await axios.put(`${url}/${editingId}`, payload);
          toast.success("আপডেট করা হয়েছে");
        } else {
          await axios.post(url, payload);
          toast.success("সফলভাবে যোগ হয়েছে");
        }
        fetchProducts();
      } else {
        if (!formData.name) return toast.error("ইউনিটের নাম লিখুন");
        if (editingId) {
            await axios.put(`${url}/${editingId}`, { name: formData.name });
            toast.success("ইউনিট আপডেট হয়েছে");
        } else {
            await axios.post(url, { name: formData.name });
            toast.success("ইউনিট যোগ হয়েছে");
        }
        fetchUnits();
      }
      
      setFormData({ name: "", price: "", unit: "" });
      setEditingId(null);
    } catch (error) {
      toast.error("সার্ভারে সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("আপনি কি নিশ্চিত?")) return;
    const url = modalType === "product" ? `https://squirrel-peace-server.onrender.com/products/${id}` : `https://squirrel-peace-server.onrender.com/unit/${id}`;
    try {
      await axios.delete(url);
      modalType === "product" ? fetchProducts() : fetchUnits();
      toast.success("ডিলিট করা হয়েছে");
    } catch (error) {
      toast.error("ডিলিট করা সম্ভব হয়নি");
    }
  };

  const rawList = modalType === "product" ? products : units;
  const filteredList = rawList.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-2 sm:p-4 font-sans">
      <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[95vh] sm:max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-50 to-white px-4 sm:px-6 py-4 sm:py-5 border-b flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-base sm:text-lg uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block"></span>
              {modalType === "product" ? "Inventory" : "Units"}
            </h3>
            <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 ml-3.5">System Config</p>
          </div>
          <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          
          {/* Input Form Section */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl mb-4 border border-slate-100 shadow-inner">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className={modalType === "product" ? "md:col-span-4" : "md:col-span-10"}>
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-2">Name</label>
                <input
                  className="w-full p-2.5 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                  placeholder="Enter name..."
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              {modalType === "product" && (
                <>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-2">Price</label>
                    <input
                      type="number"
                      className="w-full p-2.5 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                      placeholder="0.00"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block ml-2">Unit</label>
                    <select
                      className="w-full p-2.5 rounded-xl border-none ring-1 ring-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white cursor-pointer"
                      value={formData.unit}
                      onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    >
                      <option value="">Select</option>
                      {units.map(u => (
                        <option key={u._id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <button
                  onClick={handleSubmit}
                  className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center transition-all active:scale-95 ${editingId ? "bg-orange-500" : "bg-blue-600"}`}
                >
                  {editingId ? <FiEdit3 size={18}/> : <FiPlus size={18}/>}
                </button>
              </div>
            </div>
          </div>

          {/* Search Area */}
          <div className="relative mb-4">
            <FiSearch size={14} className="absolute inset-y-0 left-4 my-auto text-slate-400" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 bg-slate-100 border-none rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-blue-400"
              placeholder={`Search...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List Section */}
          <div className="space-y-2">
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-slate-300">
                <FiAlertCircle size={30} className="mb-2 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">No matches</p>
              </div>
            ) : (
              filteredList.map((item, index) => (
                <div
                  key={item._id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(index)}
                  className="flex items-center p-3 bg-white border border-slate-100 rounded-xl hover:border-blue-200 hover:shadow-sm transition-all"
                >
                  <div className="w-8 flex justify-center text-slate-300">
                    <FiMenu size={14} />
                  </div>

                  <div className="flex-grow ml-2">
                    <p className="font-bold text-xs sm:text-sm text-slate-700 truncate max-w-[120px] sm:max-w-none">{item.name}</p>
                  </div>

                  {modalType === "product" && (
                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                      <div className="w-16 sm:w-20 text-center font-bold text-[11px] sm:text-sm text-emerald-600">
                        {item.price}৳
                      </div>
                      <div className="hidden sm:block w-16 text-center">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">
                          {item.unit}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="w-16 sm:w-20 flex justify-end gap-1">
                    <button 
                      onClick={() => { 
                        setEditingId(item._id); 
                        setFormData({ name: item.name, price: item.price || "", unit: item.unit || "" }); 
                      }} 
                      className="p-1.5 text-slate-400 hover:text-orange-500 rounded-lg transition-all"
                    >
                      <FiEdit3 size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item._id)} 
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-all"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 py-2.5 px-6 flex justify-between items-center shrink-0">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
            Total {filteredList.length} Items
          </span>
          <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
            Drag to reorder
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptEdit;