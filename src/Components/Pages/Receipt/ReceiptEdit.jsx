import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiX, FiMenu, FiAlertCircle, FiEdit3, FiSearch, FiTrendingUp, FiShoppingBag, FiLayers } from "react-icons/fi";
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
  const [formData, setFormData] = useState({ name: "", costPrice: "", sellingPrice: "", unit: "", shop: "" });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setFormData({ name: "", costPrice: "", sellingPrice: "", unit: "", shop: "" });
    setEditingId(null);
    setSearchTerm("");
  }, [modalType]);

  const handleSubmit = async () => {
    const url = modalType === "product" ? "https://squirrel-peace-server.onrender.com/products" : "https://squirrel-peace-server.onrender.com/unit";

    try {
      if (modalType === "product") {
        if (!formData.name || !formData.costPrice || !formData.sellingPrice || !formData.unit || !formData.shop) {
          return toast.error("সবগুলো ঘর পূরণ করুন");
        }

        const payload = {
          name: formData.name,
          costPrice: Number(formData.costPrice),
          sellingPrice: Number(formData.sellingPrice),
          unit: formData.unit,
          shop: formData.shop
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

      setFormData({ name: "", costPrice: "", sellingPrice: "", unit: "", shop: "" });
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

  const rawList = modalType === "product" ? [...products].reverse() : [...units].reverse();
  const filteredList = rawList.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-[100] p-2 sm:p-4 font-sans text-slate-800">
      <div className="bg-white w-full max-w-5xl rounded-2xl sm:rounded-[2rem] shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[95vh] sm:max-h-[90vh]">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-50 to-white px-4 sm:px-6 py-4 sm:py-5 border-b flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-slate-800 text-base sm:text-xl uppercase tracking-tight flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
              {modalType === "product" ? "Inventory Management" : "Units Config"}
            </h3>
          </div>
          <button onClick={() => setShowModal(false)} className="p-2 bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-all">
            <FiX size={20} />
          </button>
        </div>

        {/* Modal Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar bg-slate-50/30">

          {/* Input Form Section */}
          <div className="bg-white p-4 sm:p-6 rounded-2xl mb-6 border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {modalType === "product" && (
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Shop</label>
                  <select
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-slate-50 cursor-pointer font-bold"
                    value={formData.shop}
                    onChange={(e) => setFormData({ ...formData, shop: e.target.value })}
                  >
                    <option value="">Shop</option>
                    <option value="M">M</option>
                    <option value="N">N</option>
                    <option value="C">O</option>
                  </select>
                </div>
              )}

              <div className={modalType === "product" ? "md:col-span-3" : "md:col-span-10"}>
                <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Product</label>
                <input
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-semibold"
                  placeholder="Enter name..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {modalType === "product" && (
                <>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Buy Price</label>
                    <input
                      type="number"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50"
                      placeholder="0.00"
                      value={formData.costPrice}
                      onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Sell Price</label>
                    <input
                      type="number"
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50"
                      placeholder="0.00"
                      value={formData.sellingPrice}
                      onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Unit</label>
                    <select
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 cursor-pointer"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="">Select</option>
                      {units.map(u => (
                        <option key={u._id} value={u.name}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="md:col-span-1">
                <button
                  onClick={handleSubmit}
                  className={`w-full py-2.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center transition-all active:scale-95 ${editingId ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                  {editingId ? <FiEdit3 size={20} /> : <FiPlus size={20} />}
                </button>
              </div>
            </div>
          </div>

          {/* Search Area */}
          <div className="relative mb-6">
            <FiSearch size={16} className="absolute inset-y-0 left-4 my-auto text-slate-400" />
            <input
              type="text"
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
              placeholder={`Search products by name...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* List Section */}
          <div className="space-y-3">
            {filteredList.length === 0 ? (
              <div className="flex flex-col items-center py-12 text-slate-300">
                <FiAlertCircle size={40} className="mb-2 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">No results found</p>
              </div>
            ) : (
              filteredList.map((item, index) => {
                const profit = (item.sellingPrice - item.costPrice) || 0;
                return (
                  <div
                    key={item._id}
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(index)}
                    className="group flex flex-col md:flex-row items-center p-3 md:p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden"
                  >
                    {/* Drag Handle */}
                    <div className="hidden md:flex w-8 justify-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-blue-500">
                      <FiMenu size={18} />
                    </div>

                    {/* Shop Badge & Name */}
                    <div className="w-full md:w-1/4 flex flex-col justify-center mb-2 md:mb-0">
                      <div className="flex flex-row items-center gap-3">
                        {/* Shop Badge */}
                        <span className="flex-shrink-0 flex items-center justify-center text-[12px] font-black uppercase text-blue-600 bg-blue-50 px-1 py-1 rounded-md min-w-[30px] text-center">
                          {item.shop}
                        </span>

                        {/* Item Name */}
                        <p className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight line-clamp-1">
                          {item.name}
                        </p>
                      </div>
                    </div>

                    {/* Info Columns (Yellow marked area expansion) */}
                    <div className="w-full flex-grow grid grid-cols-2 sm:grid-cols-4 gap-4 md:px-6 py-2 md:py-0 border-t md:border-t-0 md:border-x border-slate-100">

                      {/* Cost */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Buy Price</span>
                        <span className="font-bold text-sm text-slate-600">{item.costPrice}৳</span>
                      </div>

                      {/* Sell */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Sell Price</span>
                        <span className="font-bold text-sm text-blue-600">{item.sellingPrice}৳</span>
                      </div>

                      {/* Profit */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Profit</span>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                          <FiTrendingUp size={14} />
                          <span className="text-sm">{profit}৳</span>
                        </div>
                      </div>

                      {/* Unit */}
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-400 uppercase">Unit Type</span>
                        <div className="flex items-center gap-1 text-slate-500 font-bold text-sm">
                          {item.unit}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full md:w-20 flex justify-end gap-2 mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                      <button
                        onClick={() => {
                          setEditingId(item._id);
                          setFormData({
                            name: item.name,
                            costPrice: item.costPrice || "",
                            sellingPrice: item.sellingPrice || "",
                            unit: item.unit || "",
                            shop: item.shop || ""
                          });
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
                );
              })
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-900 py-3 px-8 flex justify-between items-center shrink-0">
          <div className="flex gap-4">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Total: {filteredList.length} items
            </span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
              Currency: BDT (৳)
            </span>
          </div>
          <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest animate-pulse">
            Reorder Enabled
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReceiptEdit;