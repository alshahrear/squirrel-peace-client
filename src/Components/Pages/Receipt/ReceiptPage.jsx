import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FiEdit3, FiTrash2, FiPlusCircle, FiChevronRight, FiPackage, FiLayers, FiSearch, FiChevronDown, FiUsers } from "react-icons/fi";
import ReceiptEdit from "./ReceiptEdit";
import Customer from "./Customer";
import { toast } from "react-hot-toast";
import { NavLink } from "react-router-dom";

const ReceiptPage = () => {
  const [products, setProducts] = useState([]);
  const [units, setUnits] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [itemDiscount, setItemDiscount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState("product");
  const [dragIndex, setDragIndex] = useState(null);
  const [modalDragIndex, setModalDragIndex] = useState(null);
  const [showCustomer, setShowCustomer] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [deliveryCharge, setDeliveryCharge] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [savedItemId, setSavedItemId] = useState(null);
  const customerRef = useRef(null);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("https://squirrel-peace-server.onrender.com/products");
      setProducts(res.data);
    } catch (error) { console.error("Error fetching products", error); }
  };

  const fetchUnits = async () => {
    try {
      const res = await axios.get("https://squirrel-peace-server.onrender.com/unit");
      setUnits(res.data);
    } catch (error) { console.error("Error fetching units", error); }
  };

  useEffect(() => {
    fetchProducts();
    fetchUnits();
  }, []);

  useEffect(() => {
    const qty = parseFloat(quantity) || 0;
    const uPrice = parseFloat(unitPrice) || 0;
    const disc = parseFloat(itemDiscount) || 0;
    const calculatedTotal = (qty * uPrice) - disc;
    setTotalPrice(calculatedTotal > 0 ? calculatedTotal : 0);
  }, [quantity, unitPrice, itemDiscount]);

  const handleSelectSuggestion = (p) => {
    setSelectedProduct(p.name);
    setUnitPrice(p.price || "");
    setSelectedUnit(p.unit || "");
    setQuantity(1);
    setItemDiscount(0);
    setShowSuggestions(false);
  };

  const subTotal = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
  const grandTotal = subTotal - (parseFloat(overallDiscount) || 0) + (parseFloat(deliveryCharge) || 0);

  const handleAddItem = () => {
    if (!selectedProduct || !quantity || !unitPrice) {
      toast.error("প্রয়োজনীয় তথ্যগুলো পূরণ করুন!");
      return;
    }
    const newItem = {
      id: editingId || Date.now(),
      product: selectedProduct,
      unitPrice: parseFloat(unitPrice),
      quantity: parseFloat(quantity),
      unit: selectedUnit,
      discount: parseFloat(itemDiscount) || 0,
      totalPrice: totalPrice,
    };
    if (editingId) {
      setItems(items.map((item) => (item.id === editingId ? newItem : item)));
      setEditingId(null);
      toast.success("আপডেট করা হয়েছে");
    } else {
      setItems([...items, newItem]);
      toast.success("যোগ করা হয়েছে");
    }
    setSelectedProduct(""); setQuantity(""); setUnitPrice(""); setItemDiscount(0); setSelectedUnit("");
  };

  const handleConfirmAndContinue = async () => {
    if (items.length === 0) {
      toast.error("আগে আইটেম যোগ করুন!");
      return;
    }
    try {
      const invoiceData = { items, subTotal, overallDiscount, deliveryCharge, grandTotal };
      const res = await axios.post("https://squirrel-peace-server.onrender.com/item", invoiceData);
      if (res.data.insertedId) {
        setSavedItemId(res.data.insertedId);
        setShowCustomer(true);
        toast.success("আইটেম সেভ হয়েছে!");
        setTimeout(() => {
          customerRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (error) {
      toast.error("সার্ভারে ডাটা পাঠাতে সমস্যা হয়েছে!");
    }
  };

  const handleEdit = (item) => {
    setEditingId(item.id);
    setSelectedProduct(item.product);
    setUnitPrice(item.unitPrice);
    setQuantity(item.quantity);
    setSelectedUnit(item.unit);
    setItemDiscount(item.discount);
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
      await axios.put("https://squirrel-peace-server.onrender.com/products/reorder", list);
    } else {
      setUnits(list);
      await axios.put("https://squirrel-peace-server.onrender.com/unit/reorder", list);
    }
    setModalDragIndex(null);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(selectedProduct.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 px-2 sm:px-4 py-6 sm:py-10 font-sans text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-10">
        <div className="bg-white shadow-2xl rounded-2xl sm:rounded-[2rem] overflow-hidden border border-emerald-100">

          {/* Header */}
          {/* Header Section Snippet */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 sm:p-8 text-white flex flex-col sm:flex-row justify-between items-center gap-4 text-center">

            {/* Left Side Buttons Group */}
            <div className="order-2 sm:order-1 flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={() => { setModalType("product"); setShowModal(true); }}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs sm:text-sm border border-white/30 justify-center"
              >
                <FiPackage /> Products
              </button>

              {/* NavLink used for Customers */}
              <NavLink
                to="/customerAdmin"
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs sm:text-sm border border-white/30 justify-center"
              >
                <FiUsers /> Customers
              </NavLink>
              
            </div>

            {/* Center Title */}
            <div className="order-1 sm:order-2">
              <h1 className="text-xl sm:text-3xl font-black tracking-tight uppercase">Billing Receipt</h1>
              <p className="text-emerald-100 text-[10px] sm:text-xs mt-1">Bashay Bazar Inventory System</p>
            </div>

            {/* Right Side Button */}
            <button
              onClick={() => { setModalType("unit"); setShowModal(true); }}
              className="order-3 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl flex items-center gap-2 transition-all text-xs sm:text-sm border border-white/30 w-full sm:w-auto justify-center"
            >
              <FiLayers /> Units
            </button>
          </div>

          <div className="p-4 sm:p-8">
            {/* Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-7 gap-3 mb-8 bg-emerald-50/50 p-4 sm:p-5 rounded-2xl border border-emerald-100 items-end">
              <div className="sm:col-span-2 md:col-span-2 space-y-1 relative">
                <label className="text-[10px] font-bold uppercase text-emerald-700 ml-1">Product Name</label>
                <div className="relative flex items-center bg-white rounded-xl ring-1 ring-emerald-200">
                  <FiSearch className="absolute left-3 text-emerald-400" />
                  <input type="text" placeholder="Search..." value={selectedProduct} onChange={(e) => { setSelectedProduct(e.target.value); setShowSuggestions(true); }} className="w-full border-none p-2.5 pl-9 pr-10 rounded-xl outline-none bg-transparent text-sm" />
                  <button type="button" onClick={() => setShowSuggestions(!showSuggestions)} className="absolute right-2 text-emerald-500"><FiChevronDown /></button>
                </div>
                {showSuggestions && (
                  <div className="absolute z-50 w-full md:w-[140%] mt-1 bg-white border border-emerald-100 rounded-xl shadow-2xl max-h-72 overflow-y-auto">
                    {filteredProducts.map((p, index) => (
                      <div key={p._id || index} onClick={() => handleSelectSuggestion(p)} className="p-3 sm:p-4 cursor-pointer hover:bg-emerald-600 hover:text-white flex justify-between items-center border-b border-emerald-50 last:border-0 group text-sm sm:text-base">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 group-hover:text-white">{p.name}</span>
                          <span className="text-xs font-semibold text-emerald-600 group-hover:text-emerald-100">{p.price} ৳ / {p.unit}</span>
                        </div>
                        <FiChevronRight />
                      </div>
                    ))}
                  </div>
                )}
                {showSuggestions && <div className="fixed inset-0 z-40" onClick={() => setShowSuggestions(false)}></div>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-emerald-700 ml-1">Qty & Unit</label>
                <div className="flex ring-1 ring-emerald-200 rounded-xl overflow-hidden bg-white">
                  <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="p-2.5 w-1/2 outline-none text-center border-r border-emerald-50 font-bold text-sm" placeholder="Qty" />
                  <select value={selectedUnit} onChange={(e) => setSelectedUnit(e.target.value)} className="p-2.5 w-1/2 outline-none bg-transparent text-[10px] font-semibold">
                    <option value="">Unit</option>
                    {units.map((u) => <option key={u._id} value={u.name}>{u.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-emerald-700 ml-1">Unit Price</label>
                <input type="number" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} className="w-full ring-1 ring-emerald-200 p-2.5 rounded-xl outline-none font-semibold text-sm" placeholder="0.00" />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-500 ml-1">Discount (৳)</label>
                <input type="number" value={itemDiscount} onChange={(e) => setItemDiscount(e.target.value)} className="w-full ring-1 ring-emerald-200 p-2.5 rounded-xl outline-none font-bold text-slate-700 text-sm" placeholder="0" />
              </div>

              <div className="space-y-1 text-center pb-1">
                <label className="text-[10px] font-bold uppercase text-emerald-600 block">Total Price</label>
                <div className="text-lg sm:text-xl font-black text-slate-900 leading-none py-2 px-1 bg-white rounded-xl ring-1 ring-emerald-100">{totalPrice.toLocaleString()}৳</div>
              </div>

              <button onClick={handleAddItem} className={`w-full py-2.5 rounded-xl font-bold text-white shadow-lg ${editingId ? "bg-orange-500" : "bg-emerald-600"}`}>
                {editingId ? "Update" : "Add"}
              </button>
            </div>

            {/* Responsive Table */}
            <div className="overflow-x-auto rounded-2xl border border-emerald-100 bg-white shadow-sm mb-8">
              <table className="w-full text-left min-w-[600px] sm:min-w-[700px]">
                <thead>
                  <tr className="bg-slate-700 text-emerald-50 text-[10px] sm:text-[11px] uppercase tracking-wider">
                    <th className="p-3 sm:p-4 text-center w-10">#</th>
                    <th className="p-3 sm:p-4">Product</th>
                    <th className="p-3 sm:p-4 text-center">Quantity</th>
                    <th className="p-3 sm:p-4 text-center">Unit Price</th>
                    <th className="p-3 sm:p-4 text-center">Discount</th>
                    <th className="p-3 sm:p-4 text-right pr-6 sm:pr-10">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-50">
                  {items.map((item, index) => (
                    <tr key={item.id} draggable onDragStart={() => handleRowDragStart(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => handleRowDrop(index)} className="group cursor-move hover:bg-emerald-50/50 transition-colors text-sm">
                      <td className="p-3 sm:p-4 text-center text-slate-400 text-[10px]">{index + 1}</td>
                      <td className="p-3 sm:p-4 font-bold text-slate-700">{item.product}</td>
                      <td className="p-3 sm:p-4 text-center">
                        <span className="bg-emerald-100 text-emerald-700 px-2 sm:px-3 py-1 rounded-full text-[10px] font-bold">{item.quantity} {item.unit}</span>
                      </td>
                      <td className="p-3 sm:p-4 text-center text-slate-600 font-medium">{item.unitPrice} ৳</td>
                      <td className="p-3 sm:p-4 text-center text-slate-500 font-bold">-{item.discount} ৳</td>
                      <td className="p-3 sm:p-4 text-right pr-6 sm:pr-10">
                        <div className="flex items-center justify-end gap-3">
                          <span className="font-black text-slate-900">{item.totalPrice.toLocaleString()} ৳</span>
                          <div className="flex gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-0 sm:translate-x-2 group-hover:translate-x-0">
                            <button onClick={() => handleEdit(item)} className="p-1.5 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200"><FiEdit3 size={13} /></button>
                            <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"><FiTrash2 size={13} /></button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Footer */}
            <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
              <button
                onClick={handleConfirmAndContinue}
                className="w-full md:w-1/3 bg-slate-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-900 shadow-xl order-2 md:order-1"
              >
                Confirm & Continue <FiChevronRight />
              </button>
              <div className="w-full md:w-1/2 space-y-4 bg-white p-6 rounded-2xl sm:rounded-[2rem] border border-emerald-100 shadow-xl order-1 md:order-2">
                <div className="flex justify-between text-slate-500 font-medium text-sm"><span>Sub-Total</span><span className="text-slate-900 font-bold">{subTotal.toFixed(2)} ৳</span></div>
                <div className="flex justify-between items-center text-slate-500 text-sm">
                  <span className="font-medium">Overall Discount (-)</span>
                  <input type="number" value={overallDiscount} onChange={(e) => setOverallDiscount(e.target.value)} className="w-20 sm:w-24 bg-emerald-50 text-right p-2 rounded-xl font-bold outline-none border border-emerald-100 focus:ring-2 focus:ring-emerald-200" />
                </div>
                <div className="flex justify-between items-center text-teal-600 text-sm">
                  <span className="font-medium">Delivery Charge (+)</span>
                  <input type="number" value={deliveryCharge} onChange={(e) => setDeliveryCharge(e.target.value)} className="w-20 sm:w-24 bg-emerald-50 text-right p-2 rounded-xl font-bold outline-none border border-emerald-100 focus:ring-2 focus:ring-teal-200" />
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