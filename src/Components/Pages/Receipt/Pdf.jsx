import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiPrinter, FiArrowLeft, FiUser, FiSettings, FiCopy } from "react-icons/fi";
import logo from "../../../assets/bashay-bazar.jpg";

const Pdf = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState("admin");

  const rawData = location.state;
  const originalInvoiceList = rawData?.bulkData ? rawData.bulkData : (rawData ? [rawData] : []);

  let invoiceList = [];
  if (viewMode === "both") {
    originalInvoiceList.forEach(inv => {
      invoiceList.push({ ...inv, displayMode: "customer" });
      invoiceList.push({ ...inv, displayMode: "admin" });
    });
  } else {
    invoiceList = originalInvoiceList.map(inv => ({ ...inv, displayMode: viewMode }));
  }

  // নতুন ফিল্টারিং লজিক: কাস্টমার ভিউতে ছোট হাতের শপ নামের আইটেম লুকানো
  const finalInvoiceList = invoiceList.map(inv => {
    if (inv.displayMode === "customer") {
      const filteredItems = inv.items.filter(item => {
        const shopName = item.shop || "";
        if (shopName === "") return true;
        // চেক: প্রথম অক্ষর বড় হাতের কি না
        return shopName[0] === shopName[0].toUpperCase() && shopName[0] !== shopName[0].toLowerCase();
      });
      return { ...inv, items: filteredItems };
    }
    return inv;
  });

  const toBengaliNumber = (num) => {
    if (num === undefined || num === null || num === "") return "";
    const bengaliNumbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num.toString().replace(/\d/g, (digit) => bengaliNumbers[digit]);
  };

  if (originalInvoiceList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-black font-sans">
        <p className="font-bold mb-4">No Data Found!</p>
        <button onClick={() => navigate("/")} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold">Go Back</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-5 px-2 font-sans text-black print:p-0 print:bg-white flex flex-col items-center">

      {/* Navigation Buttons - Laptop View (Sides) */}
      <div className="hidden md:flex fixed left-0 top-1/2 -translate-y-1/2 z-50 print:hidden flex flex-col gap-2">
        <button
          onClick={() => navigate("/customerAdmin")}
          className="flex items-center gap-2 bg-white text-black px-4 py-3 rounded-r-xl text-xs font-bold shadow-md border border-slate-300 transition-all hover:bg-slate-50"
        >
          <FiArrowLeft size={18} /><span>BACK</span>
        </button>
      </div>

      <div className="hidden md:flex fixed right-0 top-1/2 -translate-y-1/2 z-50 print:hidden flex flex-col gap-6">
        <button
          onClick={() => setViewMode(viewMode === "admin" ? "customer" : "admin")}
          className={`flex items-center gap-2 px-4 py-3 rounded-l-xl text-xs font-bold shadow-lg transition-all ${viewMode === "admin" ? "bg-orange-500 text-white" : "bg-teal-600 text-white"
            }`}
        >
          {viewMode === "admin" ? <FiUser size={18} /> : <FiSettings size={18} />}
          <span>{viewMode === "admin" ? "CUSTOMER VIEW" : "ADMIN VIEW"}</span>
        </button>

        <button
          onClick={() => { setViewMode("both"); setTimeout(() => window.print(), 100); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-l-xl text-xs font-bold shadow-lg hover:bg-purple-700 transition-all"
        >
          <FiCopy size={18} /><span>PRINT BOTH</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-l-xl text-xs font-bold shadow-lg hover:bg-red-700 transition-all"
        >
          <FiPrinter size={18} /><span>PRINT A5</span>
        </button>
      </div>

      {/* Main Printable Area - Scrollable on Mobile */}
      <div className="w-full overflow-x-auto md:overflow-visible flex flex-col items-center">
        <div id="printable-area" className="min-w-[600px] md:min-w-0 md:max-w-[148mm] mx-auto print:m-0">
          {finalInvoiceList.map((data, index) => {
            const currentMode = data.displayMode;
            const customer = data.customer || {};
            const items = data.items || [];
            const hasAnyItemDiscount = items.some(item => Number(item.discount) > 0);
            // আইটেমের লাভের সাথে ডেলিভারি চার্জ যোগ এবং ওভারঅল ডিসকাউন্ট থাকলে তা বিয়োগ করা হয়েছে
            const baseProfit = items.reduce((sum, item) => sum + Number(item.profit || 0), 0) + Number(data.deliveryCharge || 0);
            const totalProfit = baseProfit - Number(data.overallDiscount || 0);

            let grandTotalCost = 0;
            const shopSummaries = items.reduce((acc, item) => {
              const shopName = item.shop || "N/A";
              const itemCost = Number(item.costPrice || 0) * Number(item.quantity || 1);

              // ছোট হাতের শপ চেনার উপায়
              const isSmallShop = shopName !== "N/A" && shopName[0] === shopName[0].toLowerCase() && shopName[0] !== shopName[0].toUpperCase();

              if (!isSmallShop) {
                if (!acc[shopName]) acc[shopName] = { cost: 0 };
                acc[shopName].cost += itemCost;
                grandTotalCost += itemCost;
              }
              return acc;
            }, {});

            return (
              <div
                key={index}
                className="bg-white mb-8 print:mb-0 shadow-xl print:shadow-none border border-slate-300 print:border-none mx-auto overflow-hidden flex flex-col justify-between"
                style={{
                  width: '148mm',
                  height: '210mm',
                  padding: '12mm',
                  boxSizing: 'border-box',
                  pageBreakAfter: 'always'
                }}
              >

                <div>
                  {/* Header */}
                  <div className="flex flex-col border-b border-black pb-1 mb-2">
                    {/* Top Row: Logo & Company Details */}
                    <div className="flex justify-between items-center pb-2">
                      <div className="flex gap-2 items-center">
                        <img src={logo} alt="Logo" className="w-12 h-12 object-cover rounded" />
                        <div>
                          <h1 className="text-[16px] font-black leading-tight">বাসায় বাজার</h1>
                          <p className="text-[10px] font-black uppercase">শাহজীপাড়া, বড় বাজার, মেহেরপুর</p>
                          <p className="text-[11px] font-bold">WhatsApp: 01570226243</p>
                        </div>
                      </div>
                      <div className="text-[12px] leading-tight font-bold text-right space-y-0.5">
                        <p>bashaybazarmp@gmail.com</p>
                        <p className="text-[11px] font-bold">Call Anytime & Bkash, Nagad</p>
                        <p className="text-[11px] font-bold">01886-074920 (Send Money)</p>
                      </div>
                    </div>

                    {/* Delivery Shift Row (এখন বর্ডারের ভেতরে এবং ওপরে থাকবে) */}
                    <div className="flex items-center justify-between text-[11px] font-bold w-full">
                      <div className="flex items-center whitespace-nowrap">
                        <span>ডেলিভারি শিফট শুরুর আগে অর্ডার করুন | </span>
                      </div>
                      <div className="flex gap-2 text-right whitespace-nowrap">
                        <span>10:30AM-12:30PM</span>
                        <span>4:30-6:30PM</span>
                        <span>7:30-9:30PM</span>
                      </div>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="grid grid-cols-2 gap-x-16 gap-y-1 mb-2 text-[12px]">
                    <div className="space-y-1">
                      <p><span className="font-bold">Name:</span> <span className="font-bold">{customer.customerName || "N/A"}</span></p>
                      <p><span className="font-bold">Phone:</span> <span className="font-bold">{customer.phone || "N/A"}</span></p>
                      <p><span className="font-bold">Address:</span> <span className="font-bold">{customer.address || "N/A"}</span></p>
                    </div>
                    <div className="space-y-1">
                      <p><span className="font-bold">Date:</span> <span className="font-bold">{customer.date || "N/A"}</span></p>
                      <p><span className="font-bold">Invoice:</span> <span className="font-bold">#{customer.invoiceNumber || "N/A"}</span></p>
                      <p><span className="font-bold">Delivery:</span> <span className="font-bold">{customer.deliveryMan || "N/A"}</span></p>
                    </div>
                  </div>

                  {/* Table */}
                  <table className="w-full mb-2 text-[11px] border-collapse">
                    <thead>
                      <tr className=" uppercase text-left">
                        <th className="py-1 font-black">#</th>
                        {currentMode === "admin" && <th className="py-1 font-black">শপ</th>}

                        <th className="py-1 font-black pl-3">পণ্য</th>
                        <th className="py-1 font-black text-center">পরিমাণ</th>
                        {currentMode === "admin" && <th className="py-1 font-black text-center">দরমূল্য</th>}
                        {currentMode === "admin" && <th className="py-1 text-center font-black">ক্রয়মূল্য</th>}
                        <th className="py-1 font-black text-center">
                          {currentMode === "admin" ? "বিক্রয়মূল্য" : "একক মূল্য"}
                        </th>
                        {hasAnyItemDiscount && <th className="py-1 text-center font-black">ছাড়</th>}
                        {currentMode === "admin" && <th className="py-1 text-right font-black">লাভ</th>}
                        <th className="py-1 text-right font-black">মোট</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, idx) => (
                        <tr key={idx} className="font-bold">
                          <td className="py-0.5">{toBengaliNumber(idx + 1)}</td>
                          {currentMode === "admin" && <td className="py-0.5">{item.shop || "—"}</td>}
                          <td className="py-0.5 font-black ">{item.product}</td>
                          <td className="py-0.5 text-center">
                            {item.showQty !== false ? `${toBengaliNumber(item.quantity || "")} ` : ""}
                            {item.unit}
                          </td>
                          {currentMode === "admin" && (
                            <td className="py-0.5 text-center">{toBengaliNumber(Number(item.costPrice || 0).toLocaleString())}</td>
                          )}
                          {currentMode === "admin" && (
                            <td className="py-0.5 text-center">{toBengaliNumber((Number(item.costPrice || 0) * Number(item.quantity || 1)).toLocaleString())}</td>
                          )}
                          <td className="py-0.5 text-center">{toBengaliNumber(Number(item.unitPrice).toLocaleString())}</td>
                          {hasAnyItemDiscount && (
                            <td className="py-0.5 text-center">{Number(item.discount) > 0 ? `-${toBengaliNumber(item.discount)}` : "—"}</td>
                          )}
                          {currentMode === "admin" && (
                            <td className="py-0.5 text-right">{toBengaliNumber(Number(item.profit || 0).toLocaleString())}</td>
                          )}
                          <td className="py-0.5 text-right font-black">{toBengaliNumber(Number(item.totalPrice).toLocaleString())} ৳</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>


                  {/* Calculation Area */}
                  <div className="flex justify-between pt-2 border-t border-black items-stretch">

                    {/* Left: Individual Shop Costs (Only for Admin) */}
                    {currentMode === "admin" ? (
                      <div className="flex flex-col justify-center border-r border-black pr-4 min-w-[130px] space-y-2 text-[11px]">
                        {Object.entries(shopSummaries).map(([shop, summary]) => (
                          <div key={shop} className="flex text-[11px] gap-2 leading-tight pb-0.5">
                            <p className="font-bold italic whitespace-nowrap">{shop}. ক্রয়মূল্য =</p>
                            <p className="font-bold">
                              {toBengaliNumber(summary.cost.toLocaleString())}৳
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="min-w-[0px]"></div>
                    )}

                    {/* Center-Left: Total Cost (Only for Admin) */}
                    {currentMode === "admin" && (
                      <div className="flex flex-col items-center justify-center border-r border-black px-4 flex-1">
                        <p className="text-[11px] font-black border-b border-black w-full text-center mb-1 pb-0.5">মোট ক্রয়মূল্য</p>
                        <p className="text-[13px] font-black">
                          {toBengaliNumber(grandTotalCost.toLocaleString())}৳
                        </p>
                      </div>
                    )}

                    {/* Center-Right: Profit (Only for Admin) */}
                    {currentMode === "admin" && (
                      <div className="flex flex-col items-center justify-center border-r border-black px-4 flex-1">
                        <p className="text-[11px] font-black border-b border-black w-full text-center mb-1 pb-0.5">লাভ</p>
                        <p className="text-[12px] font-black">{toBengaliNumber(totalProfit.toLocaleString())}৳</p>
                      </div>
                    )}

                    {/* Right: Final Billing Summary */}
                    <div className="pl-4 w-44 flex flex-col justify-center space-y-1 text-[11px]">
                      <div className="flex justify-between font-bold">
                        <span>মোট:</span>
                        <span className="font-black">{toBengaliNumber(Number(data.subTotal).toLocaleString())} ৳</span>
                      </div>

                      <div className="flex justify-between font-bold">
                        <span>সার্ভিস চার্জ:</span>
                        <span className="font-black">{toBengaliNumber(Number(data.deliveryCharge || 0).toLocaleString())} ৳</span>
                      </div>

                      {Number(data.overallDiscount) > 0 && (
                        <div className="flex justify-between font-bold">
                          <span>ছাড়:</span>
                          <span className="font-black">-{toBengaliNumber(Number(data.overallDiscount).toLocaleString())} ৳</span>
                        </div>
                      )}

                      <div className="pt-1 mt-1 border-t border-black flex justify-between">
                        <span className="font-black text-[11px]">সর্বমোট:</span>
                        <span className="font-black text-[11px]">{toBengaliNumber(Number(data.grandTotal).toLocaleString())} ৳</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-center pb-2">
                  <p className="text-[11px] font-black italic">"বাসায় বাজার" এর সাথে থাকার জন্য ধন্যবাদ।</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Action Buttons - Bottom View (Hidden on Laptop) */}
      <div className="md:hidden w-full px-2 py-6 flex flex-wrap justify-center gap-3 print:hidden">
        <button
          onClick={() => navigate("/customerAdmin")}
          className="flex items-center gap-2 bg-white text-black px-4 py-3 rounded-xl text-xs font-bold shadow-md border border-slate-300"
        >
          <FiArrowLeft size={18} /><span>BACK</span>
        </button>

        <button
          onClick={() => setViewMode(viewMode === "admin" ? "customer" : "admin")}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-bold shadow-lg ${viewMode === "admin" ? "bg-orange-500 text-white" : "bg-teal-600 text-white"}`}
        >
          {viewMode === "admin" ? <FiUser size={18} /> : <FiSettings size={18} />}
          <span>{viewMode === "admin" ? "CUSTOMER" : "ADMIN"}</span>
        </button>

        <button
          onClick={() => { setViewMode("both"); setTimeout(() => window.print(), 100); }}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg"
        >
          <FiCopy size={18} /><span>BOTH</span>
        </button>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-red-600 text-white px-4 py-3 rounded-xl text-xs font-bold shadow-lg"
        >
          <FiPrinter size={18} /><span>PRINT</span>
        </button>
      </div>

      <style>{`
  @media screen {
    /* স্ক্রিনে দেখার সময় যেন আসল কাগজের মতো লাগে */
    body { background-color: #e2e8f0 !important; }
  }

  @media print {
    @page { 
      size: A5; 
      margin: 0; 
    }
    body { 
      margin: 0 !important; 
      -webkit-print-color-adjust: exact; 
      print-color-adjust: exact;
    }
    .print\\:hidden { display: none !important; }
    
    /* প্রিন্ট হওয়ার সময় ডিভটি যেন পুরো পাতা জুড়ে থাকে */
    div[style*="width: 148mm"] {
      width: 100% !important;
      height: 100vh !important;
      margin: 0 !important;
      padding: 12mm !important;
    }
  }
`}</style>
    </div>
  );
};

export default Pdf;