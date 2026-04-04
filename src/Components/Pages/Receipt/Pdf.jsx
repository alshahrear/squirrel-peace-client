import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { FiPrinter, FiArrowLeft } from "react-icons/fi";

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
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-500">
        <p className="font-bold mb-4">No Data Found!</p>
        <button onClick={() => navigate("/")} className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm">Go Back</button>
      </div>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans text-slate-800 print:p-0 print:bg-white relative">
      
      {/* UI বাটন (প্রিন্টে আসবে না) */}
      <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 print:hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="flex items-center gap-3 bg-white text-slate-600 px-6 py-4 rounded-r-2xl text-sm font-black shadow-lg hover:bg-slate-100 border-y border-r border-slate-200 uppercase tracking-widest transition-all"
        >
          <FiArrowLeft size={20} />
          <span>Back</span>
        </button>
      </div>

      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 print:hidden">
        <button 
          onClick={handlePrint} 
          className="flex items-center gap-3 bg-cyan-600 text-white px-6 py-4 rounded-l-2xl text-sm font-black shadow-lg hover:bg-cyan-700 uppercase tracking-widest transition-all"
        >
          <FiPrinter size={20} />
          <span>Print All</span>
        </button>
      </div>

      {/* মূল ইনভয়েস এরিয়া */}
      <div id="printable-area" className="max-w-[850px] mx-auto print:m-0 print:max-w-full">
        {invoiceList.map((data, index) => {
          const customer = data.customer || {};
          const items = data.items || [];
          const hasAnyItemDiscount = items.some(item => Number(item.discount) > 0);

          return (
            <div 
              key={data._id || index} 
              className="bg-white p-10 mb-10 border border-slate-200 print:mb-0 print:border-none print:p-[15mm] print:shadow-none page-break-box"
              style={{ pageBreakAfter: 'always' }}
            >
              {/* Header */}
              <div className="text-center border-b-2 border-slate-100 pb-4 mb-6">
                <h1 className="text-3xl font-black uppercase text-slate-900">বাসায় বাজার</h1>
                <p className="text-[11px] font-bold text-slate-400 tracking-[0.2em] uppercase mt-1">Meherpur Online Grocery Service</p>
              </div>

              {/* Info Section */}
              <div className="flex justify-between items-start mb-10 text-[14px]">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 ">Billing Information</p>
                  <p><span className="font-bold text-slate-900">Customer Name:</span> {customer.customerName || "N/A"}</p>
                  <p><span className="font-bold text-slate-900">Phone:</span> {customer.phone || "N/A"}</p>
                  <p><span className="font-bold text-slate-900">Address:</span> {customer.address || "N/A"}</p>
                  <p><span className="font-bold text-slate-900">Invoice:</span> #{customer.invoiceNumber || "N/A"}</p>
                  <p><span className="font-bold text-slate-900">Date:</span> {customer.date || "N/A"}</p>
                  <p><span className="font-bold text-slate-900">Delivery By:</span> {customer.deliveryMan || "N/A"}</p>
                </div>
                <div className=" space-y-1">
                  <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-2 ">Shop Contact</p>
                  <p>01612-002913</p>
                  <p>bashaybazarmp@gmail.com</p>
                  <p>Shahjipara, Meherpur</p>
                </div>
              </div>

              {/* Table */}
              <table className="w-full mb-8 text-[14px] border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900 uppercase text-[12px]">
                    <th className="py-2 text-left font-black w-10">#</th>
                    <th className="py-2 text-left font-black">পণ্য</th>
                    <th className="py-2 text-center font-black">পরিমাণ</th>
                    <th className="py-2 text-right font-black">একক মূল্য</th>
                    {hasAnyItemDiscount && <th className="py-2 text-right font-black">ছাড়</th>}
                    <th className="py-2 text-right font-black">মূল্য</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="text-slate-700">
                      <td className="py-3">{toBengaliNumber(idx + 1)}</td>
                      <td className="py-3 font-bold text-slate-900">{item.product}</td>
                      <td className="py-3 text-center">{toBengaliNumber(item.quantity)} {item.unit}</td>
                      <td className="py-3 text-right">{toBengaliNumber(Number(item.unitPrice).toLocaleString())} ৳</td>
                      {hasAnyItemDiscount && (
                        <td className="py-3 text-right">
                          {Number(item.discount) > 0 ? `-${toBengaliNumber(Number(item.discount))}` : "—"}
                        </td>
                      )}
                      <td className="py-3 text-right font-bold text-slate-900">{toBengaliNumber(Number(item.totalPrice).toLocaleString())} ৳</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Calculation */}
              <div className="flex justify-end pt-4 border-t-2 border-slate-50">
                <div className="w-64 space-y-2 text-[15px]">
                  <div className="flex justify-between">
                    <span>মোট:</span>
                    <span className="font-bold">{toBengaliNumber(Number(data.subTotal).toLocaleString())} ৳</span>
                  </div>
                  {Number(data.overallDiscount) > 0 && (
                    <div className="flex justify-between">
                      <span>ছাড়:</span>
                      <span className="font-bold">-{toBengaliNumber(Number(data.overallDiscount).toLocaleString())} ৳</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>ডেলিভারি চার্জ:</span>
                    <span className="font-bold">{toBengaliNumber(Number(data.deliveryCharge || 0).toLocaleString())} ৳</span>
                  </div>
                  <div className="pt-3 border-t-2 border-slate-900 flex justify-between items-center font-black text-lg">
                    <span>সর্বমোট:</span>
                    <span>{toBengaliNumber(Number(data.grandTotal).toLocaleString())} ৳</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-20 text-center border-t border-slate-100 pt-4">
                <p className="text-[12px] text-slate-400 italic">"বাসায় বাজার" এর সাথে থাকার জন্য ধন্যবাদ।</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* স্ট্রিক্ট প্রিন্ট কন্ট্রোল CSS */}
      <style>{`
        @media print {
          /* ব্রাউজারের হেডার, ফুটার, তারিখ সব রিমুভ করার জন্য */
          @page { 
            size: auto; 
            margin: 0mm; 
          }
          
          /* বডি থেকে সবকিছু হাইড করে শুধু ইনভয়েস দেখানো */
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* UI এলিমেন্টগুলো একদম হাইড */
          .print\\:hidden { 
            display: none !important; 
          }

          /* প্রিন্ট এরিয়া পজিশনিং */
          #printable-area {
            visibility: visible !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .page-break-box {
            page-break-after: always !important;
            display: block !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
          }

          .page-break-box:last-child {
            page-break-after: auto !important;
          }

          /* কালার প্রিন্ট নিশ্চিত করা */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Pdf;