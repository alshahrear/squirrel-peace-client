import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiEdit3, FiTrash2, FiPlusCircle, FiChevronRight, FiPackage, FiLayers, FiSearch, FiChevronDown, FiUsers } from "react-icons/fi";
import ReceiptEdit from "./ReceiptEdit";
import Customer from "./Customer";
import { toast } from "react-hot-toast";
import { NavLink, useLocation } from "react-router-dom";

const ReceiptPage = () => {
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [shop, setShop] = useState("");
  const [itemDiscount, setItemDiscount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [profit, setProfit] = useState(0);

  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("product");
  const [dragIndex, setDragIndex] = useState(null);
  const [modalDragIndex, setModalDragIndex] = useState(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(10);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [showQtyInTable, setShowQtyInTable] = useState(true);
  const [savedItemId, setSavedItemId] = useState(null);
  const customerRef = useRef(null);

  const location = useLocation();
  const editIdFromAdmin = location.state?.editId;

  const BASE_URL = "https://squirrel-peace-server.onrender.com";

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

  useEffect(() => {
    const loadEditData = async () => {
      if (editIdFromAdmin) {
        try {
          const res = await axios.get(`${BASE_URL}/item/${editIdFromAdmin}`);
          const data = res.data;
          if (data) {
            setItems(data.items || []);
            setOverallDiscount(data.overallDiscount || 0);
            setDeliveryCharge(data.deliveryCharge !== undefined ? data.deliveryCharge : 10);
            setSavedItemId(editIdFromAdmin);
            setShowCustomer(true);
          }
        } catch (error) {
          toast.error("ডাটা লোড করতে সমস্যা হয়েছে!");
        }
      }
    };
    loadEditData();
  }, [editIdFromAdmin]);

  useEffect(() => {
    fetchProducts();
    fetchUnits();
  }, []);

  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const sPrice = parseFloat(unitPrice) || 0;
    const cPrice = parseFloat(costPrice) || 0;
    const disc = parseFloat(itemDiscount) || 0;

    // Buy Price ০ হলে Total Price ০ হবে, না হলে স্বাভাবিক হিসাব হবে
    const calculatedTotal = cPrice === 0 ? 0 : (qty * sPrice) - disc;
    const calculatedProfit = ((sPrice - cPrice) * qty) - disc;

    setTotalPrice(calculatedTotal > 0 ? calculatedTotal : 0); setTotalPrice(calculatedTotal > 0 ? calculatedTotal : 0);
    setProfit(calculatedProfit);
  }, [quantity, unitPrice, costPrice, itemDiscount]);

  const handleSelectSuggestion = (p) => {
    setSelectedProduct(p.name);
    setUnitPrice(p.sellingPrice || p.price || "");
    setCostPrice(p.costPrice || "");
    setShop(p.shop || "");
    setSelectedUnit(p.unit || "");
    setQuantity(1);
    setItemDiscount(0);
    setShowSuggestions(false);
  };

  const subTotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
  const totalProfit = items.reduce((sum, item) => sum + parseFloat(item.profit || 0), 0);
  // নতুন কোড
  const grandTotal = subTotal - (parseFloat(overallDiscount) || 0) + (parseFloat(deliveryCharge) || 0);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || !unitPrice) {
      toast.error("প্রয়োজনীয় তথ্যগুলো পূরণ করুন!");
      return;
    }

    const newItem = {
      id: editingId || Date.now(),
      product: selectedProduct,
      shop: shop,
      costPrice: parseFloat(costPrice) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      // এখানে পরিবর্তন: quantity সব সময় সেভ হবে
      quantity: parseFloat(quantity) || 0,
      unit: selectedUnit,
      discount: parseFloat(itemDiscount) || 0,
      totalPrice: totalPrice,
      profit: profit,
      // টিক চিহ্ন দেওয়া আছে কি না সেটা সেভ হবে
      showQty: showQtyInTable
    };

    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? newItem : item)));
      setEditingId(null);
      toast.success("আপডেট করা হয়েছে");
    } else {
      setItems([...items, newItem]);
      toast.success("যোগ করা হয়েছে");
    }
    setSelectedProduct(""); setQuantity(""); setUnitPrice(""); setCostPrice(""); setShop(""); setItemDiscount(0); setSelectedUnit("");
  };



  const handleConfirmAndContinue = async () => {
    if (items.length === 0) {
      toast.error("আগে আইটেম যোগ করুন!");
      return;
    }
    try {
      const invoiceData = {
        items: items.map(item => ({
          id: item.id,
          product: item.product,
          shop: item.shop,
          costPrice: item.costPrice,
          unitPrice: item.unitPrice,
          quantity: item.quantity, // এখন এটি ০ বা নাল হবে না
          unit: item.unit,
          discount: item.discount,
          totalPrice: item.totalPrice,
          profit: item.profit,
          showQty: item.showQty // ডাটাবেসে ট্রু/ফলস যাবে
        })),
        subTotal,
        overallDiscount,
        deliveryCharge,
        grandTotal,
        totalProfit: totalProfit - (parseFloat(overallDiscount) || 0)
      };

      if (editIdFromAdmin) {
        await axios.put(`${BASE_URL}/item/${editIdFromAdmin}`, invoiceData);
        setSavedItemId(editIdFromAdmin);
      } else {
        const res = await axios.post(`${BASE_URL}/item`, invoiceData);
        if (res.data.insertedId) {
          setSavedItemId(res.data.insertedId);
        }
      }

      setShowCustomer(true);
      toast.success("আইটেম সেভ হয়েছে!");
      setTimeout(() => {
        customerRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);

    } catch (error) {
      toast.error("সার্ভারে ডাটা পাঠাতে সমস্যা হয়েছে!");
    }
  };



  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedProduct(item.product);
    setShop(item.shop);
    setCostPrice(item.costPrice);
    setUnitPrice(item.unitPrice);
    setQuantity(item.quantity);
    setSelectedUnit(item.unit);
    setItemDiscount(item.discount);
    // এডিট মুডে টিক চিহ্ন সঠিক অবস্থায় সেট করা
    setShowQtyInTable(item.showQty !== undefined ? item.showQty : true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const handleDelete = (id) => {
    setItems(items.filter((item) => item.id !== id));
    toast.success("রিমুভ করা হয়েছে");
  };

  const handleRowDragStart = (index) => setDragIndex(index);
  const handleRowDrop = (index) => {
    const list = [...items];
    const draggedItem = list[dragIndex];
    list.splice(dragIndex, 1);
    list.splice(index, 0, draggedItem);
    setItems(list);
    setDragIndex(null);
  };

  const handleModalDragStart = (index) => setModalDragIndex(index);
  const handleModalDrop = async (index) => {
    let list = modalType === "product" ? [...products] : [...units];
    const draggedItem = list[modalDragIndex];
    list.splice(modalDragIndex, 1);
    list.splice(index, 0, draggedItem);
    if (modalType === "product") {
      setProducts(list);
      await axios.put(`${BASE_URL}/products/reorder`, list);
    } else {
      setUnits(list);
      await axios.put(`${BASE_URL}/unit/reorder`, list);
    }
    setModalDragIndex(null);
  };

  const filteredProducts = [...products]
    .reverse()
    .filter(p => {
      const isAlreadyAdded = items.some(item => item.product === p.name && item.id !== editingId);
      const matchesSearch = p.name.toLowerCase().includes(selectedProduct.toLowerCase());
      return !isAlreadyAdded && matchesSearch;
    })
    .sort((a, b) => {
      // shop এর নাম ছোট হাতের "s" হলে সেটি সবার উপরে (top এ) চলে আসবে
      const aIsS = a.shop && a.shop === "s";
      const bIsS = b.shop && b.shop === "s";

      if (aIsS && !bIsS) return -1;
      if (!aIsS && bIsS) return 1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 px-2 sm:px-4 py-6 sm:py-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        <div className="bg-white shadow-2xl rounded-2xl sm:rounded-[2rem] overflow-hidden border border-emerald-100">

          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-4 text-center">
            <div className="order-2 sm:order-1 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button onClick={() => { setModalType("product"); setShowModal(true); }} className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs sm:text-sm border border-white/30 justify-center">
                <FiPackage /> Products
              </button>
              <NavLink to="/customerAdmin" className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs sm:text-sm border border-white/30 justify-center">
                <FiUsers /> Customers
              </NavLink>
            </div>
            <div className="order-1 sm:order-2">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight uppercase">Billing Receipt</h1>
            </div>
            <button onClick={() => { setModalType("unit"); setShowModal(true); }} className="order-3 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs sm:text-sm border border-white/30 w-full sm:w-auto justify-center">
              <FiLayers /> Units
            </button>
          </div>

          <div className="p-4 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-11 gap-3 mb-8 bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-100 items-end">

              <div className="sm:col-span-2 md:col-span-2 space-y-1 relative">
                <label className="text-[10px] font-bold uppercase text-emerald-700 ml-1">Product Name</label>
                <div className="relative flex items-center bg-white rounded-xl ring-1 ring-emerald-200">
                  <FiSearch className="absolute left-3 text-emerald-400" />
                  <input type="text" placeholder="Search..." value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setShowSuggestions(true); }} className="w-full border-none p-2.5 pl-9 pr-10 rounded-xl outline-none bg-transparent text-sm" />
                  <button type="button" onClick={() => setShowSuggestions(!showSuggestions)} className="absolute right-2 text-emerald-500"><FiChevronDown /></button>
                </div>
                {showSuggestions && (
                  <div className="absolute z-50 w-full md:w-[180%] mt-1 bg-white border border-emerald-100 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                    {filteredProducts.map((p, index) => (
                      <div key={p._id || index} onClick={() => handleSelectSuggestion(p)} className="p-3 sm:p-4 cursor-pointer hover:bg-emerald-600 hover:text-white flex justify-between items-center border-b border-emerald-50 last:border-0 group text-sm">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-slate-800 group-hover:text-white">{p.name} <span className="bg-slate-100 text-[10px] px-1 rounded text-slate-500 group-hover:bg-white/20 group-hover:text-white ml-2">{p.shop}</span></span>
                          <div className="flex gap-4 text-[12px] font-bold">
                            <span className="text-gray-700">Buy: {p.costPrice}৳</span>
                            <span className="text-emerald-600 group-hover:text-emerald-200">Sell: {p.sellingPrice || p.price}৳</span>
                            <span className="text-slate-400 group-hover:text-white/60">{p.unit}</span>
                          </div>
                        </div>
                        <FiChevronRight />
                      </div>
                    ))}
                  </div>
                )}
                {showSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)}></div>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-emerald-700 ml-1">Shop</label>
                <input type="text" value={shop} onChange={(e) => setShop(e.target.value)} className="w-full ring-1 ring-emerald-200 p-2.5 rounded-xl outline-none font-semibold text-sm bg-white" placeholder="Shop" />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <div className="flex items-center gap-2 ml-1">
                  <label className="text-[10px] font-bold uppercase text-emerald-700">Qty & Unit</label>
                  <input type="checkbox" checked={showQtyInTable} onChange={(e) => setShowQtyInTable(e.target.checked)} className="w-3.5 h-3.5 accent-emerald-600 cursor-pointer" />
                </div>
                <div className="flex ring-1 ring-emerald-200 rounded-xl overflow-hidden bg-white">
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="p-2.5 w-1/2 outline-none text-center border-r border-emerald-50 font-bold text-sm" placeholder="Qty" />
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="p-2.5 w-1/2 outline-none bg-transparent text-[10px] font-semibold">
                    <option value="">Unit</option>
                    {units.map((u) => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400 ml-1">Buy Price</label>
                <input type="number" step="any" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="w-full ring-1 ring-emerald-200 p-2.5 rounded-xl outline-none font-semibold text-sm bg-slate-50" placeholder="0" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-emerald-700 ml-1">Sell Price</label>
                <input type="number" step="any" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full ring-1 ring-emerald-200 p-2.5 rounded-xl outline-none font-semibold text-sm bg-white" placeholder="0" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase ml-1">Discount</label>
                <input type="number" value={itemDiscount} onChange={(e) => setItemDiscount(e.target.value)} className="w-full ring-1 ring-emerald-200 p-2.5 rounded-xl outline-none font-bol text-sm" placeholder="0" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-blue-600 ml-1 text-center block">Profit</label>
                <div className={`w-full bg-white ring-1 ring-blue-50 p-2.5 rounded-xl text-center font-black text-sm min-h-[42px] flex items-center justify-center ${profit >= 0 ? "text-blue-600" : "text-rose-500"}`}>
                  {profit}৳
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-emerald-600 ml-1 text-center block">Total</label>
                <div className="w-full bg-white ring-1 ring-emerald-100 p-2.5 rounded-xl text-center font-black text-slate-900 text-sm min-h-[42px] flex items-center justify-center">
                  {totalPrice}৳
                </div>
              </div>

              <button onClick={handleAddItem} className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg transition-all ${editingId ? "bg-orange-500 hover:bg-orange-600" : "bg-emerald-600 hover:bg-emerald-700"}`}>
                {editingId ? "Update" : "Add"}
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm mb-8">
              <table className="w-full text-left min-w-[900px]">
                <thead>
                  <tr className="bg-slate-700 text-emerald-50 text-[10px] uppercase tracking-wider">
                    <th className="p-3 text-center w-10">#</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Shop</th>
                    <th className="p-3 text-center">Quantity</th>
                    <th className="p-3 text-center">Buy Price</th>
                    <th className="p-3 text-center">Sell Price</th>
                    <th className="p-3 text-center">Discount</th>
                    <th className="p-3 text-center">Profit</th>
                    <th className="p-3 text-center ">Total</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {items.map((item, index) => (
                    <tr key={item.id} className="group cursor-move hover:bg-emerald-50/50 transition-colors text-sm">
                      <td className="p-3 text-center text-slate-400 text-[10px] w-12">{index + 1}</td>
                      <td className="p-3 font-bold text-slate-700 min-w-[180px]">{item.product}</td>
                      <td className="p-3 text-center w-24">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded uppercase">{item.shop}</span>
                      </td>
                      <td className="p-3 text-center w-32">
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-bold whitespace-nowrap">
                          {item.showQty ? `${item.quantity} ${item.unit}` : item.unit}
                        </span>
                      </td>
                      <td className="p-3 text-center w-28 text-rose-400 font-medium">{item.costPrice} ৳</td>
                      <td className="p-3 text-center w-28 text-emerald-600 font-bold">{item.unitPrice} ৳</td>
                      <td className="p-3 text-center w-24 text-rose-600 font-bold">{item.discount} ৳</td>
                      <td className={`p-3 text-center w-24 font-bold ${item.profit >= 0 ? "text-blue-500" : "text-rose-500"}`}>
                        {item.profit} ৳
                      </td>

                      {/* TOTAL কলাম - হেডার বরাবর রাখতে pr-12 ব্যবহার করা হয়েছে */}
                      <td className="p-3 text-right pr-12 w-40 font-black text-slate-900 whitespace-nowrap">
                        {item.totalPrice.toLocaleString()} ৳
                      </td>

                      {/* ACTION কলাম */}
                      <td className="p-3 text-center w-24">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleEdit(item)} className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 border border-emerald-200 shadow-sm">
                            <FiEdit3 size={14} />
                          </button>
                          <button onClick={() => handleDelete(item.id)} className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 border border-red-200 shadow-sm">
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
              <button onClick={handleConfirmAndContinue} className="w-full md:w-1/3 bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 shadow-xl order-2 md:order-1">
                Confirm & Continue <FiChevronRight />
              </button>
              <div className="w-full md:w-1/2 space-y-4 bg-white p-6 rounded-2xl border border-emerald-100 shadow-xl order-1 md:order-2">
                <div className="flex justify-between text-slate-500 font-medium text-sm"><span>Sub-Total</span><span className="text-slate-900 font-bold">{subTotal} ৳</span></div>
                <div className="flex justify-between text-blue-500 font-medium text-sm"><span>Total Profit</span><span className="font-bold">{totalProfit} ৳</span></div>
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span className="font-medium">Overall Discount (-)</span>
                  <input type="number" value={overallDiscount} onChange={(e) => setOverallDiscount(e.target.value)} className="w-20 sm:w-24 bg-emerald-50 text-right p-2 rounded-xl font-bold outline-none border border-emerald-100" />
                </div>
                <div className="flex justify-between items-center text-teal-600 text-sm">
                  <span className="font-medium">Delivery Charge (+)</span>
                  <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} className="w-20 sm:w-24 bg-emerald-50 text-right p-2 rounded-xl font-bold outline-none border border-emerald-100" />
                </div>
                <div className="pt-4 border-t border-emerald-100 flex justify-between items-center">
                  <span className="font-black text-emerald-600 uppercase text-[10px]">Grand Total</span>
                  <span className="text-2xl sm:text-4xl font-black text-slate-900">{grandTotal.toLocaleString()} ৳</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showCustomer && (
          <div ref={customerRef} className="animate-in fade-in slide-in-from-bottom-5 duration-500">
            <Customer
              savedItemId={savedItemId}
              items={items}
              subTotal={subTotal}
              overallDiscount={overallDiscount}
              deliveryCharge={deliveryCharge}
              grandTotal={grandTotal}
              totalProfit={totalProfit - (parseFloat(overallDiscount) || 0)}
              editMode={!!editIdFromAdmin}
            />
          </div>
        )}
      </div>

      {showModal && (
        <ReceiptEdit
          modalType={modalType} setShowModal={setShowModal} products={products} units={units}
          fetchProducts={fetchProducts} fetchUnits={fetchUnits}
          handleDragStart={handleModalDragStart} handleDragOver={(e) => e.preventDefault()} handleDrop={handleModalDrop}
        />
      )}
    </div>
  );
};

export default ReceiptPage;