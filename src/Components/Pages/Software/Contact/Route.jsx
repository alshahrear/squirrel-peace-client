import { useState, useEffect, useRef } from "react";
import { FiPlus, FiAlertCircle, FiEdit3, FiTrash2, FiSearch, FiArrowLeft, FiChevronDown } from "react-icons/fi";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosClient from "../../../../hooks/useAxiosClient";

const Route = () => {
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({ name: "", code: "", isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeDropdownId, setActiveDropdownId] = useState(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.action-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) return toast.error("Please enter route name");
      if (!formData.code.trim()) return toast.error("Please enter route code");

      // Check if this code already exists in another row (excluding own id while editing)
      const isDuplicateCode = routes.some(
        item => item.code?.toLowerCase() === formData.code.trim().toLowerCase() && item._id !== editingId
      );

      if (isDuplicateCode) {
        return toast.error("This code is already used by another route!");
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
        toast.success("Route updated successfully");
      } else {
        await axiosClient.post('/route', payload, config);
        toast.success("Route added successfully");
      }

      fetchRoutes();
      setFormData({ name: "", code: "", isActive: true });
      setEditingId(null);
    } catch (error) {
      toast.error("Server error occurred");
    }
  };

  const handleDelete = async (id) => {
    setActiveDropdownId(null);
    Swal.fire({
      title: "Are you sure?",
      text: "This route will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#f43f5e",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel"
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosClient.delete(`/route/${id}`);
          fetchRoutes();
          toast.success("Deleted successfully");
        } catch (error) {
          toast.error("Failed to delete");
        }
      }
    });
  };

  // ১. সার্চ ফিল্টারিং (নাম বা কোড দিয়ে সার্চ করতে পারবেন)
  const filteredList = routes.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.code && item.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // ২. ফ্রন্টএন্ড পেজিনেশন ক্যালকুলেশন
  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRoutes = filteredList.slice(startIndex, startIndex + itemsPerPage);

  // সার্চ করলে পেজ ১ এ নিয়ে আসার জন্য
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">
      <div className="max-w-5xl mx-auto space-y-8">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-all cursor-pointer"
            >
              <FiArrowLeft size={20} />
            </button>
            <div>
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                Routes Config
              </h2>
              <p className="text-gray-500 text-sm mt-1">Manage all delivery routes</p>
            </div>
          </div>
          <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm whitespace-nowrap">
            Total: {routes.length} routes
          </span>
        </div>

        {/* Input Form Section with Code and Active Toggle */}
        <div ref={formRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-600 text-[11px] font-semibold mb-1.5">Route Name</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50 font-semibold"
                placeholder="Enter route name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-gray-600 text-[11px] font-semibold mb-1.5">Route Code</label>
              <input
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-sm bg-gray-50/50 font-semibold"
                placeholder="Enter route code..."
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-2">
            {/* Active Toggle Switch */}
            <div className="w-full sm:w-auto flex flex-col justify-center">
              <label className="block text-gray-600 text-[11px] font-semibold mb-1.5">Status</label>
              <div className="flex items-center h-[42px] px-3 bg-gray-50/50 border border-gray-200 rounded-xl gap-3">
                <span className="text-xs font-bold text-gray-600">{formData.isActive ? "Active" : "Inactive"}</span>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 accent-indigo-600 cursor-pointer"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl font-bold text-white shadow-md flex items-center justify-center gap-2 transition duration-300 active:scale-95 shrink-0 cursor-pointer ${editingId
                ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200"
                : "bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-indigo-200"
                }`}
            >
              {editingId ? <><FiEdit3 size={18} /> Update Route</> : <><FiPlus size={18} /> Add Route</>}
            </button>
          </div>
        </div>

        {/* Table Card Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="text-xl font-bold text-gray-800">Routes Directory</h3>
            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                <FiSearch size={16} />
              </span>
              <input
                type="text"
                placeholder="Search routes by name or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
              />
            </div>
          </div>

          {/* List Section */}
          {currentRoutes.length === 0 ? (
            <div className="text-center py-20 text-gray-400 font-medium flex flex-col items-center">
              <FiAlertCircle size={40} className="mb-2 opacity-30" />
              No routes found!
            </div>
          ) : (
            <div className="space-y-3">
              {currentRoutes.map((item, index) => {
                const isNearBottom = index >= currentRoutes.length - 3;
                return (
                  <div
                    key={item._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all gap-3"
                    style={activeDropdownId === item._id ? { position: 'relative', zIndex: 50 } : undefined}
                  >
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-bold text-sm sm:text-base text-gray-800">
                        {item.name}
                      </span>

                      {item.code && (
                        <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                          Code: {item.code}
                        </span>
                      )}

                      <span className={`px-3 py-1 rounded-full font-semibold text-xs ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {item.isActive ? "Active" : "Inactive"}
                      </span>

                      {item.createdAt && (
                        <span className="text-xs text-gray-500 hidden lg:inline">
                          {item.createdAt}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-end">
                      <div className="relative inline-block action-dropdown-container">
                        <button
                          onClick={() => setActiveDropdownId(activeDropdownId === item._id ? null : item._id)}
                          className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white rounded-xl transition duration-200 font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                        >
                          <span>Select</span>
                          <FiChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdownId === item._id ? 'rotate-180' : ''}`} />
                        </button>

                        {activeDropdownId === item._id && (
                          <div className={`absolute right-0 ${isNearBottom ? 'bottom-full mb-2' : 'top-full mt-2'} w-36 bg-white rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.2)] border border-gray-100 py-2 z-[9999] text-left animate-in fade-in zoom-in-95 duration-150`}>
                            <button
                              onClick={() => {
                                setActiveDropdownId(null);
                                setEditingId(item._id);
                                setFormData({ name: item.name, code: item.code || "", isActive: item.isActive });
                                formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                              }}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2 transition duration-150 cursor-pointer"
                            >
                              <FiEdit3 className="w-3.5 h-3.5 text-indigo-500" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item._id)}
                              className="w-full px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition duration-150 cursor-pointer"
                            >
                              <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Footer */}
          {filteredList.length > 0 && (
            <div className="px-2 py-2 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-xs text-gray-500 font-medium">
                Page <span className="font-bold text-gray-700">{currentPage}</span> of <span className="font-bold text-gray-700">{totalPages}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                    }`}
                >
                  <FaChevronLeft size={10} /> Previous
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    if (
                      pageNum === 1 ||
                      pageNum === totalPages ||
                      (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${currentPage === pageNum
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                            : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                            }`}
                        >
                          {pageNum}
                        </button>
                      );
                    } else if (
                      pageNum === currentPage - 2 ||
                      pageNum === currentPage + 2
                    ) {
                      return <span key={pageNum} className="text-gray-400 px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${currentPage === totalPages
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 border border-gray-200 shadow-sm cursor-pointer'
                    }`}
                >
                  Next <FaChevronRight size={10} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Route;