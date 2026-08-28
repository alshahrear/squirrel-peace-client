import { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiMenu, FiAlertCircle, FiEdit3, FiSearch, FiTrendingUp, FiX, FiArrowLeft } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const ProductPage = () => {
    const [products, setProducts] = useState([]);
    const [units, setUnits] = useState([]);
    const [shops, setShops] = useState([]);
    const [formData, setFormData] = useState({ name: "", costPrice: "", sellingPrice: "", unit: "", shop: "" });
    const [editingId, setEditingId] = useState(null);
   const [searchTerm, setSearchTerm] = useState("");
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);

    const navigate = useNavigate();
    const BASE_URL = "http://localhost:5000"; // আপনার ব্যাকএন্ড ইউআরএল প্রয়োজনমতো পরিবর্তন করতে পারেন

    const fetchProducts = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/products`);
            setProducts(res.data);
        } catch (error) { console.error("Error fetching products", error); }
    };

    const fetchUnits = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/unit`);
            setUnits(res.data);
        } catch (error) { console.error("Error fetching units", error); }
    };

    const fetchShops = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/shop`);
            setShops(res.data);
        } catch (error) { console.error("Error fetching shops", error); }
    };

    useEffect(() => {
        fetchProducts();
        fetchUnits();
        fetchShops();
    }, []);

    const handleReorder = async (fromIndex, toIndex) => {
        if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;
        const newList = [...filteredList];
        const [movedItem] = newList.splice(fromIndex, 1);
        newList.splice(toIndex, 0, movedItem);

        try {
            await axios.put(`${BASE_URL}/products/reorder`, newList);
            toast.success("পজিশন আপডেট হয়েছে");
            fetchProducts();
        } catch (error) {
            toast.error("পজিশন সেভ করা সম্ভব হয়নি");
        }
    };

    const handleSubmit = async () => {
        try {
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
                await axios.put(`${BASE_URL}/products/${editingId}`, payload);
                toast.success("আপডেট করা হয়েছে");
            } else {
                await axios.post(`${BASE_URL}/products`, payload);
                toast.success("সফলভাবে যোগ হয়েছে");
            }
            fetchProducts();
            setFormData({ name: "", costPrice: "", sellingPrice: "", unit: "", shop: "" });
            setEditingId(null);
        } catch (error) {
            toast.error("সার্ভারে সমস্যা হয়েছে");
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedProducts(filteredList.map(item => item._id));
        } else {
            setSelectedProducts([]);
        }
    };

    const handleSelectProduct = (id) => {
        if (selectedProducts.includes(id)) {
            setSelectedProducts(selectedProducts.filter(itemId => itemId !== id));
        } else {
            setSelectedProducts([...selectedProducts, id]);
        }
    };

   



    const handleDelete = async (id) => {
        if (!window.confirm("আপনি কি নিশ্চিত?")) return;
        try {
            await axios.delete(`${BASE_URL}/products/${id}`);
            fetchProducts();
            toast.success("ডিলিট করা হয়েছে");
        } catch (error) {
            toast.error("ডিলিট করা সম্ভব হয়নি");
        }
    };

    const filteredList = products.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 px-2 sm:px-4 py-6 sm:py-10 font-sans text-slate-800">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
               <div className="bg-white shadow-sm rounded-2xl p-4 sm:p-6 flex justify-between items-center border border-slate-200">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-600">
                            <FiArrowLeft size={20} />
                        </button>
                        <h3 className="font-black text-slate-800 text-base sm:text-xl uppercase tracking-tight flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-600 rounded-full inline-block"></span>
                            Inventory Management
                        </h3>
                    </div>
                    <div className="flex items-center gap-3">
                        {selectedProducts.length > 0 && (
                            <button
                                onClick={() => navigate("/pdfProducts", { state: { selectedIds: selectedProducts } })}
                                className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-sm transition-all flex items-center gap-1.5 animate-pulse"
                            >
                                Print ({selectedProducts.length})
                            </button>
                        )}
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
                            Total: {filteredList.length} items
                        </span>
                    </div>
                </div>

                {/* Input Form Section */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Shop</label>
                            <select
                                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-bold cursor-pointer"
                                value={formData.shop}
                                onChange={(e) => setFormData({ ...formData, shop: e.target.value })}
                            >
                                <option value="">Shop</option>
                                {shops.map(s => (
                                    <option key={s._id} value={s.name}>{s.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-3">
                            <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Product</label>
                            <input
                                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-semibold"
                                placeholder="Enter name..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

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
                <div className="relative">
                    <FiSearch size={16} className="absolute inset-y-0 left-4 my-auto text-slate-400" />
                    <input
                        type="text"
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                        placeholder="Search products by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* List Section */}
                <div className="space-y-3 pb-10">
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
                                    onDragStart={() => setDraggedIndex(index)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={() => {
                                        handleReorder(draggedIndex, index);
                                        setDraggedIndex(null);
                                    }}
                                    className="group flex flex-col md:flex-row items-center p-3 md:p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all relative overflow-hidden"
                                >
                                    <div className="flex items-center gap-2 mr-2">
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.includes(item._id)}
                                            onChange={() => handleSelectProduct(item._id)}
                                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </div>
                                    <div className="hidden md:flex w-8 justify-center text-slate-300 cursor-grab active:cursor-grabbing hover:text-blue-500">
                                        <FiMenu size={18} />
                                    </div>

                                    <div className="w-full md:w-1/4 flex flex-col justify-center mb-2 md:mb-0">
                                        <div className="flex flex-row items-center gap-3">
                                            <span className="flex-shrink-0 flex items-center justify-center text-[12px] font-black uppercase text-blue-600 bg-blue-50 px-1 py-1 rounded-md min-w-[30px] text-center">
                                                {item.shop}
                                            </span>
                                            <p className="font-extrabold text-sm sm:text-base text-slate-800 leading-tight line-clamp-1">
                                                {item.name}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="w-full flex-grow grid grid-cols-2 sm:grid-cols-4 gap-4 md:px-6 py-2 md:py-0 border-t md:border-t-0 md:border-x border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Buy Price</span>
                                            <span className="font-bold text-sm text-slate-600">{item.costPrice}৳</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Sell Price</span>
                                            <span className="font-bold text-sm text-blue-600">{item.sellingPrice}৳</span>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Profit</span>
                                            <div className="flex items-center gap-1.5 text-emerald-600 font-black">
                                                <FiTrendingUp size={14} />
                                                <span className="text-sm">{profit}৳</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-400 uppercase">Unit Type</span>
                                            <div className="flex items-center gap-1 text-slate-500 font-bold text-sm">
                                                {item.unit}
                                            </div>
                                        </div>
                                    </div>

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
        </div>
    );
};

export default ProductPage;