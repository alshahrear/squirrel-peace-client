import { useState, useEffect, useRef } from "react";
import { FiPlus, FiAlertCircle, FiEdit3, FiTrash2, FiSearch, FiArrowLeft, FiChevronLeft, FiChevronRight, FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosClient from "../../../../hooks/useAxiosClient";

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: "", isActive: true });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    const [activeDropdownId, setActiveDropdownId] = useState(null);

    // Frontend Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;

    // Form reference for auto-scrolling
    const formRef = useRef(null);

    const navigate = useNavigate();
    const axiosClient = useAxiosClient();

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => {
            setToast({ show: false, message: '', type: '' });
        }, 3500);
    };

    const fetchCategories = async () => {
        try {
            const res = await axiosClient.get('/category');
            setCategories(res.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        }
    };

    useEffect(() => {
        fetchCategories();
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
            if (!formData.name.trim()) return showToast('Please enter category name', 'error');

            const nameInput = formData.name.trim().toLowerCase();
            const isDuplicate = categories.some(
                (c) => c.name.trim().toLowerCase() === nameInput && c._id !== editingId
            );
            if (isDuplicate) return showToast('This category already exists!', 'error');

            const token = localStorage.getItem('clientToken');
            const config = {
                headers: { Authorization: `Bearer ${token}` }
            };

            if (editingId) {
                await axiosClient.put(`/category/${editingId}`, { name: formData.name, isActive: formData.isActive }, config);
                showToast('Category updated successfully!', 'success');
            } else {
                await axiosClient.post('/category', { name: formData.name, isActive: formData.isActive }, config);
                showToast('Category added successfully!', 'success');
            }

            fetchCategories();
            setFormData({ name: "", isActive: true });
            setEditingId(null);
        } catch (error) {
            showToast('Server error occurred!', 'error');
        }
    };

    const handleDelete = async (id) => {
        setActiveDropdownId(null);
        Swal.fire({
            title: 'Are you sure?',
            text: "This category will be deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#4f46e5',
            cancelButtonColor: '#f43f5e',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axiosClient.delete(`/category/${id}`);
                    fetchCategories();
                    showToast('Category deleted successfully!', 'success');
                } catch (error) {
                    showToast('Failed to delete category!', 'error');
                }
            }
        });
    };

    // ১. সার্চ ফিল্টারিং
    const filteredList = categories.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ২. ফ্রন্টএন্ড পেজিনেশন ক্যালকুলেশন
    const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentCategories = filteredList.slice(startIndex, startIndex + itemsPerPage);

    // সার্চ করলে পেজ ১ এ নিয়ে আসার জন্য
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    // Handle page change
    const handlePageChange = (pageNumber) => {
        if (pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-6 md:p-8 relative">

            {/* Top Right Toast Notification */}
            {toast.show && (
                <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-white font-medium transition-all duration-300 transform translate-y-0 ${toast.type === 'success' ? 'bg-gradient-to-r from-emerald-500 to-teal-600' : 'bg-gradient-to-r from-rose-500 to-red-600'}`}>
                    <span>{toast.message}</span>
                </div>
            )}

            <div className="max-w-5xl mx-auto space-y-8">

                {/* Top Section: Title */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all text-indigo-700 cursor-pointer"
                        >
                            <FiArrowLeft size={20} />
                        </button>
                        <div>
                            <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                                Category Management
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Manage all product categories in the system</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm whitespace-nowrap">
                        Total: {categories.length} categories
                    </span>
                </div>

                {/* Input Form Section */}
                <div ref={formRef} className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                        <div className="w-full">
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5">Category Name</label>
                            <input
                                className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
                                placeholder="Enter category name..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        {/* Active Toggle Switch */}
                        <div className="w-full sm:w-auto flex flex-col justify-center">
                            <label className="block text-gray-700 text-xs font-semibold mb-1.5">Status</label>
                            <div className="flex items-center h-[46px] px-4 bg-gray-50/50 border border-gray-200 rounded-2xl gap-3">
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
                            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition duration-300 active:scale-95 shrink-0 cursor-pointer whitespace-nowrap ${editingId ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 shadow-amber-200" : "bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 shadow-indigo-200"}`}
                        >
                            {editingId ? <><FiEdit3 size={18} /> Update</> : <><FiPlus size={18} /> Add Category</>}
                        </button>
                    </div>
                </div>

                {/* Table Card Section */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 md:p-8 border border-white space-y-6">

                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-gray-800">Category Directory</h3>
                            <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full shadow-sm">
                                Showing: {filteredList.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredList.length)}` : 0} of {filteredList.length} ({categories.length} total)
                            </span>
                        </div>

                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400">
                                <FiSearch size={16} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search categories by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition duration-200 bg-gray-50/50 text-sm text-gray-700"
                            />
                        </div>
                    </div>

                    {/* List Section */}
                    {currentCategories.length === 0 ? (
                        <div className="text-center py-20 text-gray-400 font-medium">
                            <FiAlertCircle size={40} className="mx-auto mb-2 opacity-20" />
                            No categories found!
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {currentCategories.map((item, index) => {
                                const isNearBottom = index >= currentCategories.length - 3;
                                return (
                                    <div
                                        key={item._id}
                                        className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all"
                                        style={activeDropdownId === item._id ? { position: 'relative', zIndex: 50 } : undefined}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                                            <span className="font-bold text-sm sm:text-base text-gray-800">
                                                {item.name}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-3 py-1 rounded-full font-semibold text-xs ${item.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                                    {item.isActive ? "Active" : "Inactive"}
                                                </span>
                                                {item.createdAt && (
                                                    <span className="text-xs text-gray-500">
                                                        {item.createdAt}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

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
                                                            setFormData({ name: item.name, isActive: item.isActive });
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
                                    <FiChevronLeft size={14} /> Previous
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
                                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                                                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
                                    Next <FiChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Category;