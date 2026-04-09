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
      <div className="flex flex-col items-center justify-center min-h-screen text-black font-sans">
        <p className="font-bold mb-4">No Data Found!</p>
        <button onClick={() => navigate("/")} className="bg-black text-white px-4 py-2 rounded-lg text-sm font-bold">Go Back</button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-5 px-2 font-sans text-black print:p-0 print:bg-white">
      
      {/* Navigation Buttons */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-2 bg-white text-black px-4 py-3 rounded-r-xl text-xs font-bold shadow-md border border-slate-300"
        >
          <FiArrowLeft size={18} />
          <span>BACK</span>
        </button>
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 print:hidden">
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-2 bg-black text-white px-4 py-3 rounded-l-xl text-xs font-bold shadow-md hover:bg-slate-800"
        >
          <FiPrinter size={18} />
          <span>PRINT A5</span>
        </button>
      </div>

      {/* Invoice Area - Max width reduced and padding increased for better margins */}
      <div id="printable-area" className="max-w-[500px] mx-auto print:m-0">
        {invoiceList.map((data, index) => {
          const customer = data.customer || {};
          const items = data.items || [];
          const hasAnyItemDiscount = items.some(item => Number(item.discount) > 0);

          return (
            <div 
              key={data._id || index} 
              className="bg-white p-10 mb-6 print:mb-0 print:border-none print:px-12 print:py-8 page-break-box"
              style={{ pageBreakAfter: 'always' }}
            >
              {/* Extra Small Header */}
              <div className="flex justify-between items-center border-b-1 border-black pb-2 mb-4">
                <div className="flex gap-2 items-center">
                  <img src={logo} alt="Logo" className="w-12 h-12 object-cover rounded" />
                  <div>
                    <h1 className="text-xl font-black text-black leading-tight">বাসায় বাজার</h1>
                    <p className="text-[10px] text-black font-black uppercase mt-1">শাহজীপাড়া, বড় বাজার, মেহেরপুর</p>
                  </div>
                </div>
                <div className="text-[12px] leading-tight text-black font-bold text-right space-y-1">
                  <p>01886074920</p>
                  <p>bashaybazarmp@gmail.com</p>
                </div>
              </div>

              {/* Billing Info: 3 Left, 3 Right */}
              <div className="grid grid-cols-2 gap-x-16 gap-y-1 mb-5 text-[12px] ">
                <div className="space-y-1">
                  <p><span className="font-bold">Name:</span> <span className="font-bold">{customer.customerName || "N/A"}</span></p>
                  <p><span className="font-bold">Phone:</span> <span className="font-bold">{customer.phone || "N/A"}</span></p>
                  <p><span className="font-bold">Address:</span> <span className="font-bold">{customer.address || "N/A"}</span></p>
                </div>
                <div className="space-y-1 ">
                  <p><span className="font-bold">Date:</span> <span className="font-bold">{customer.date || "N/A"}</span></p>
                  <p><span className="font-bold">Invoice:</span> <span className="font-bold">#{customer.invoiceNumber || "N/A"}</span></p>
                  <p><span className="font-bold">Delivery:</span> <span className="font-bold">{customer.deliveryMan || "N/A"}</span></p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full mb-4 text-[12px] border-collapse">
                <thead>
                  <tr className="border-b-1 border-black text-black uppercase">
                    <th className="py-1 text-left font-black w-6">#</th>
                    <th className="py-1 text-left font-black">পণ্য</th>
                    <th className="py-1 text-left font-black">পরিমাণ</th>
                    <th className="py-1 text-center font-black">একক মূল্য</th>
                    {hasAnyItemDiscount && <th className="py-1 text-right font-black">ছাড়</th>}
                    <th className="py-1 text-right font-black">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-none">
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-black border-none font-bold">
                      <td className="py-1.5 text-left">{toBengaliNumber(idx + 1)}</td>
                      <td className="py-1.5 text-left font-black">{item.product}</td>
                      <td className="py-1.5 ">{toBengaliNumber(item.quantity)} {item.unit}</td>
                      <td className="py-1.5 text-center">{toBengaliNumber(Number(item.unitPrice).toLocaleString())}</td>
                      {hasAnyItemDiscount && (
                        <td className="py-1.5 text-right">
                          {Number(item.discount) > 0 ? `-${toBengaliNumber(Number(item.discount))}` : "—"}
                        </td>
                      )}
                      <td className="py-1.5 text-right font-black">{toBengaliNumber(Number(item.totalPrice).toLocaleString())} ৳</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculation Area */}
              <div className="flex justify-end pt-2 border-t-1 border-black">
                <div className="w-40 space-y-1 text-[11px] text-black">
                  <div className="flex justify-between font-bold">
                    <span>মোট:</span>
                    <span className="font-black">{toBengaliNumber(Number(data.subTotal).toLocaleString())} ৳</span>
                  </div>
                  {Number(data.overallDiscount) > 0 && (
                    <div className="flex justify-between font-bold">
                      <span>ছাড়:</span>
                      <span className="font-black">-{toBengaliNumber(Number(data.overallDiscount).toLocaleString())} ৳</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-black">{toBengaliNumber(Number(data.deliveryCharge || 0).toLocaleString())} ৳</span>
                  </div>
                  <div className="pt-1 mt-1 border-t border-black flex justify-between font-black text-[12px]">
                    <span>সর্বমোট:</span>
                    <span>{toBengaliNumber(Number(data.grandTotal).toLocaleString())} ৳</span>
                  </div>
                </div>
              </div>

              {/* Minimal Footer */}
              <div className="mt-5 text-center">
                <p className="text-[11px] text-black font-black">"বাসায় বাজার" এর সাথে থাকার জন্য ধন্যবাদ।</p>
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
            color: #000000 !important;
          }

          * {
            color: #000000 !important;
            border-color: #000000 !important;
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
          
          tr { border: none !important; }
        }
      `}</style>
    </div>
  );
};

export default Pdf;