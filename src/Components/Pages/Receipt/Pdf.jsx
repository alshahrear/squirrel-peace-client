import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiPrinter, FiArrowLeft } from "react-icons/fi";
import logo from "../../../assets/bashay-bazar.jpg";

const Pdf = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ডাটা হ্যান্ডেলিং
  const rawData = location.state;
  const invoiceList = rawData?.bulkData ? rawData.bulkData : (rawData ? [rawData] : []);

  // ইংরেজি সংখ্যাকে বাংলায় রূপান্তর
  const toBengaliNumber = (num) => {
    if (num === undefined || num === null || num === "") return "০";
    const bengaliNumbers = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
    return num
      .toString()
      .replace(/\d/g, (digit) => bengaliNumbers[digit]);
  };

  if (invoiceList.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500 font-sans">
        <p className="font-bold mb-4">No Data Found!</p>
        <button onClick={() => navigate("/")} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Go Back</button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-5 px-2 font-sans text-slate-900 print:p-0 print:bg-white">
      
      {/* Navigation Buttons */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 bg-white text-slate-600 px-4 py-3 rounded-r-xl text-xs font-bold shadow-md border border-slate-200"
        >
          <FiArrowLeft size={18} />
          <span>BACK</span>
        </button>
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 print:hidden">
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 bg-cyan-600 text-white px-4 py-3 rounded-l-xl text-xs font-bold shadow-md hover:bg-cyan-700"
        >
          <FiPrinter size={18} />
          <span>PRINT A5</span>
        </button>
      </div>

      {/* Invoice Area */}
      <div id="printable-area" className="max-w-[580px] mx-auto print:m-0">
        {invoiceList.map((data, index) => {
          const customer = data.customer || {};
          const items = data.items || [];
          const hasAnyItemDiscount = items.some(item => Number(item.discount) > 0);

          return (
            <div 
              key={data._id || index} 
              className="bg-white p-6 mb-6 border border-slate-200 print:mb-0 print:border-none print:p-4 page-break-box"
              style={{ pageBreakAfter: 'always' }}
            >
              {/* Extra Small Header */}
              <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-3">
                <div className="flex gap-2 items-center">
                  <img src={logo} alt="Logo" className="w-10 h-10 object-cover rounded" />
                  <div>
                    <h1 className="text-lg font-black text-slate-900 leading-tight">বাসায় বাজার</h1>
                    <p className="text-[8px] text-slate-500 font-bold uppercase">শাহজীপাড়া, বড় বাজার, মেহেরপুর</p>
                  </div>
                </div>
                <div className="text-[9px] leading-tight text-slate-600">
                  <p>01886074920</p>
                  <p>bashaybazarmp@gmail.com</p>
                </div>
              </div>

              {/* Billing Info: 3 Left, 3 Right */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 mb-3 text-[10px] bg-slate-50 p-2 rounded border border-slate-100">
                <div className="space-y-0.5">
                  <p><span className="font-bold text-slate-700">Name:</span> {customer.customerName || "N/A"}</p>
                  <p><span className="font-bold text-slate-700">Phone:</span> {customer.phone || "N/A"}</p>
                  <p><span className="font-bold text-slate-700">Address:</span> {customer.address || "N/A"}</p>
                </div>
                <div className="space-y-0.5 text-right md:text-left">
                  <p><span className="font-bold text-slate-700">Date:</span> {customer.date || "N/A"}</p>
                  <p><span className="font-bold text-slate-700">Invoice:</span> #{customer.invoiceNumber || "N/A"}</p>
                  <p><span className="font-bold text-slate-700">Delivery By:</span> {customer.deliveryMan || "N/A"}</p>
                </div>
              </div>

              {/* Items Table (No Row Borders) */}
              <table className="w-full mb-3 text-[10px] border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-900 uppercase text-[9px]">
                    <th className="py-1 text-left font-black w-6">#</th>
                    <th className="py-1 text-left font-black">পণ্য</th>
                    <th className="py-1 text-center font-black">পরিমাণ</th>
                    <th className="py-1 text-right font-black">মূল্য</th>
                    {hasAnyItemDiscount && <th className="py-1 text-right font-black">ছাড়</th>}
                    <th className="py-1 text-right font-black">মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-slate-800 border-none">
                      <td className="py-1 text-left">{toBengaliNumber(idx + 1)}</td>
                      <td className="py-1 font-bold text-left">{item.product}</td>
                      <td className="py-1 text-center">{toBengaliNumber(item.quantity)} {item.unit}</td>
                      <td className="py-1 text-right">{toBengaliNumber(Number(item.unitPrice).toLocaleString())}</td>
                      {hasAnyItemDiscount && (
                        <td className="py-1 text-right">
                          {Number(item.discount) > 0 ? `-${toBengaliNumber(Number(item.discount))}` : "—"}
                        </td>
                      )}
                      <td className="py-1 text-right font-bold">{toBengaliNumber(Number(item.totalPrice).toLocaleString())} ৳</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Compact Calculation Area (Uniform Small Text) */}
              <div className="flex justify-end pt-1 border-t border-slate-200">
                <div className="w-36 space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>মোট:</span>
                    <span className="font-bold">{toBengaliNumber(Number(data.subTotal).toLocaleString())} ৳</span>
                  </div>
                  {Number(data.overallDiscount) > 0 && (
                    <div className="flex justify-between">
                      <span>ছাড়:</span>
                      <span className="font-bold">-{toBengaliNumber(Number(data.overallDiscount).toLocaleString())} ৳</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>ডেলিভারি:</span>
                    <span className="font-bold">{toBengaliNumber(Number(data.deliveryCharge || 0).toLocaleString())} ৳</span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-slate-400 flex justify-between font-black">
                    <span>সর্বমোট:</span>
                    <span>{toBengaliNumber(Number(data.grandTotal).toLocaleString())} ৳</span>
                  </div>
                </div>
              </div>

              {/* Minimal Footer */}
              <div className="mt-2 text-center">
                <p className="text-[8px] text-slate-400 italic">"বাসায় বাজার" এর সাথে থাকার জন্য ধন্যবাদ।</p>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          @page { 
            size: A5; 
            margin: 0; 
          }
          
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
          }

          .print\\:hidden { 
            display: none !important; 
          }

          #printable-area {
            width: 100% !important;
            max-width: 100% !important;
          }

          .page-break-box {
            page-break-after: always !important;
            border: none !important;
            box-shadow: none !important;
            width: 100% !important;
          }

          .page-break-box:last-child {
            page-break-after: auto !important;
          }
          
          /* Ensuring no row borders in print */
          tr { border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Pdf;