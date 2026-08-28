import { useState, useEffect, useRef } from "react";
import { FiPlus, FiAlertCircle, FiEdit3, FiSearch, FiX, FiArrowLeft, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosClient from "../../../hooks/useAxiosClient";

const Route = () => {
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({ name: "", code: "", isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Frontend Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  // Form reference for auto-scrolling
  const formRef = useRef(null);

  const navigate = useNavigate();
  const axiosClient = useAxiosClient();

  const fetchRoutes = async () => {
    try {
      const res = await axiosClient.get('/route');
      setRoutes(res.data);
    } catch (error) {
      console.error("Error fetching routes", error);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) return toast.error("রাউটের নাম লিখুন");
      if (!formData.code.trim()) return toast.error("রাউটের কোড লিখুন");

      // ফ্রন্টএন্ডে চেক করা - এই কোডটি অলরেডি অন্য কোনো রো-তে আছে কি না (এডিট করার সময় নিজের আইডি বাদ দিয়ে)
      const isDuplicateCode = routes.some(
        item => item.code?.toLowerCase() === formData.code.trim().toLowerCase() && item._id !== editingId
      );

      if (isDuplicateCode) {
        return toast.error("এই কোডটি ইতিমধ্যে অন্য একটি রাউটে ব্যবহার করা হয়েছে!");
      }

      const token = localStorage.getItem('clientToken');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = { 
        name: formData.name.trim(), 
        code: formData.code.trim(), 
        isActive: formData.isActive 
      };

      if (editingId) {
        await axiosClient.put(`/route/${editingId}`, payload, config);
        toast.success("রাউট আপডেট হয়েছে");
      } else {
        await axiosClient.post('/route', payload, config);
        toast.success("রাউট সফলভাবে যোগ হয়েছে");
      }

      fetchRoutes();
      setFormData({ name: "", code: "", isActive: true });
      setEditingId(null);
    } catch (error) {
      toast.error("সার্ভারে সমস্যা হয়েছে");
    }
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "আপনি কি নিশ্চিত?",
      text: "এই রাউটটি ডিলিট করা হবে!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "হ্যাঁ, ডিলিট করুন",
      cancelButtonText: "বাতিল"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosClient.delete(`/route/${id}`);
          fetchRoutes();
          toast.success("ডিলিট করা হয়েছে");
        } catch (error) {
          toast.error("ডিলিট করা সম্ভব হয়নি");
        }
      }
    });
  };

  // ১. সার্চ ফিল্টারিং (নাম বা কোড দিয়ে সার্চ করতে পারবেন)
  const filteredList = routes.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ২. ফ্রন্টএন্ড পেজিনেশন ক্যালকুলেশন
  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRoutes = filteredList.slice(startIndex, startIndex + itemsPerPage);

  // সার্চ করলে পেজ ১ এ নিয়ে আসার জন্য
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // পেজ নাম্বার জেনারেট করার লজিক
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start + 1 < maxVisiblePages) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    return pageNumbers;
  };

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
              Routes Config
            </h3>
          </div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100">
            Total: {routes.length} routes
          </span>
        </div>

        {/* Input Form Section with Code and Active Toggle */}
        <div ref={formRef} className="bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Route Name</label>
              <input
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-semibold"
                placeholder="Enter route name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Route Code</label>
              <input
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-slate-50 font-semibold"
                placeholder="Enter route code..."
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
            {/* Active Toggle Switch */}
            <div className="w-full sm:w-auto flex flex-col justify-center">
              <label className="text-[10px] font-black text-slate-500 uppercase mb-1.5 block ml-1">Status</label>
              <div className="flex items-center h-[42px] px-3 bg-slate-50 border border-slate-200 rounded-xl gap-3">
                <span className="text-xs font-bold text-slate-600">{formData.isActive ? "Active" : "Inactive"}</span>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0 ${editingId ? "bg-orange-500 hover:bg-orange-600" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {editingId ? <><FiEdit3 size={18} /> Update Route</> : <><FiPlus size={18} /> Add Route</>}
            </button>
          </div>
        </div>

        {/* Search Area */}
        <div className="relative">
          <FiSearch size={16} className="absolute inset-y-0 left-4 my-auto text-slate-400" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            placeholder="Search routes by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* List Section */}
        <div className="space-y-3">
          {currentRoutes.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-slate-300">
              <FiAlertCircle size={40} className="mb-2 opacity-20" />
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">No routes found</p>
            </div>
          ) : (
            currentRoutes.map((item) => {
              return (
                <div
                  key={item._id}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all relative gap-3"
                >
                 <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-extrabold text-sm sm:text-base text-slate-800">
                      {item.name}
                    </span>

                    {item.code && (
                      <span className="text-xs font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-lg border border-slate-200">
                        Code: {item.code}
                      </span>
                    )}
                   
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.isActive ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </span>

                    {item.createdAt && (
                      <span className="text-[12px] font-semibold text-slate-400 hidden lg:inline">
                        {item.createdAt}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingId(item._id);
                        setFormData({ name: item.name, code: item.code || "", isActive: item.isActive });
                        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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

        {/* Mobile Responsive Numbered Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-4">
            <div className="text-xs font-bold text-slate-500 sm:hidden">
              Page <span className="text-blue-600">{currentPage}</span> of {totalPages}
            </div>

            <div className="flex items-center justify-between w-full sm:w-auto gap-1.5">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                <FiChevronLeft size={16} /> <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center gap-1">
                {getPageNumbers().map(number => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl font-extrabold text-xs transition-all flex items-center justify-center ${
                      currentPage === number
                        ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                <span className="hidden sm:inline">Next</span> <FiChevronRight size={16} />
              </button>
            </div>

            <div className="hidden sm:block text-xs font-extrabold text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Route;