import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { FiPlus, FiEdit3, FiTrash2, FiSearch, FiArrowLeft, FiAlertCircle } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import useAxiosClient from "../../../../hooks/useAxiosClient";
import useCan from "../../../../hooks/useCan";
import { Pager, RowMenu, Skeleton, Switch, StatusBadge, PopStyle, inputCls, labelCls } from "./ProductUi";

// "23/10/2026 08:03:51 pm" -> "23 Oct 2026"
const formatCreatedDate = (value) => {
    if (!value) return '';
    const datePart = value.split(' ')[0];
    const [day, month, year] = datePart.split('/');
    if (!day || !month || !year) return value;
    const dateObj = new Date(year, month - 1, day);
    if (isNaN(dateObj)) return value;
    return dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Category = () => {
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({ name: "", isActive: true });
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 30;
    const formRef = useRef(null);

    const navigate = useNavigate();
    const axiosClient = useAxiosClient();
    const { canAdd, canEdit, canDelete } = useCan("category");

    // Toast: Main.jsx এর Toaster
    const showToast = (message, type = 'success') => {
        if (type === 'error') toast.error(message);
        else toast.success(message);
    };

    const fetchCategories = async () => {
        try {
            const res = await axiosClient.get('/category');
            setCategories(res.data);
        } catch (error) {
            console.error("Error fetching categories", error);
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchCategories();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        try {
            if (editingId && !canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
            if (!editingId && !canAdd) return showToast('আপনার Add করার অনুমতি নেই!', 'error');
            if (!formData.name.trim()) return showToast('Please enter category name', 'error');

            const nameInput = formData.name.trim().toLowerCase();
            const isDuplicate = categories.some(
                (c) => c.name.trim().toLowerCase() === nameInput && c._id !== editingId
            );
            if (isDuplicate) return showToast('This category already exists!', 'error');

            setLoading(true);
            const finalData = { name: formData.name.trim(), isActive: formData.isActive };

            if (editingId) {
                await axiosClient.put(`/category/${editingId}`, finalData);
                showToast('Category updated successfully!', 'success');
            } else {
                await axiosClient.post('/category', finalData);
                showToast('Category added successfully!', 'success');
            }

            await fetchCategories();
            setFormData({ name: "", isActive: true });
            setEditingId(null);
        } catch (error) {
            showToast(
                error?.response?.status === 403
                    ? (editingId ? 'আপনার Edit করার অনুমতি নেই!' : 'আপনার Add করার অনুমতি নেই!')
                    : editingId ? 'Failed to update category!' : 'Something went wrong, please try again.',
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ name: "", isActive: true });
    };

    const handleDelete = (id) => {
        if (!canDelete) return showToast('আপনার Delete করার অনুমতি নেই!', 'error');
        Swal.fire({
            title: 'Are you sure?',
            text: "This category will be deleted!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axiosClient.delete(`/category/${id}`);
                    setCategories((prev) => prev.filter((c) => c._id !== id));
                    if (editingId === id) handleCancelEdit();
                    showToast('Category deleted successfully!', 'success');
                } catch (error) {
                    showToast(
                        error?.response?.status === 403 ? 'আপনার Delete করার অনুমতি নেই!' : 'Failed to delete category!',
                        'error'
                    );
                }
            }
        });
    };

    const handleEditClick = (item) => {
        if (!canEdit) return showToast('আপনার Edit করার অনুমতি নেই!', 'error');
        setEditingId(item._id);
        setFormData({ name: item.name, isActive: item.isActive });
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    const filteredList = categories.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentCategories = filteredList.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    const handlePageChange = (n) => {
        if (n >= 1 && n <= totalPages) setCurrentPage(n);
    };

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <PopStyle />
            <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            aria-label="Go back"
                            className="w-10 h-10 shrink-0 flex items-center justify-center bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl transition cursor-pointer"
                        >
                            <FiArrowLeft size={18} />
                        </button>
                        <div className="min-w-0">
                            <h2 className="text-xl sm:text-2xl font-bold text-slate-800">Category Management</h2>
                            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Manage all product categories in the system</p>
                        </div>
                    </div>
                    <span className="px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-full whitespace-nowrap w-fit">
                        Total: {categories.length} categories
                    </span>
                </div>

                {/* Form */}
                <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 scroll-mt-20">
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
                        <div>
                            <label className={labelCls}>Category Name</label>
                            <input
                                className={inputCls}
                                placeholder="Enter category name..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className={labelCls}>Status</label>
                            <div className="flex items-center justify-between gap-3 h-[42px] px-3 bg-slate-50 border border-slate-300 rounded-xl">
                                <span className="text-xs font-bold text-slate-600">{formData.isActive ? "Active" : "Inactive"}</span>
                                <Switch checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} label="Category status" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 min-h-[44px] text-sm font-semibold cursor-pointer whitespace-nowrap disabled:opacity-60 ${editingId ? 'bg-amber-500 hover:bg-amber-600 text-white rounded-full' : 'bg-brand-600 text-white'
                                    }`}
                            >
                                {loading
                                    ? (editingId ? 'Updating...' : 'Adding...')
                                    : editingId ? <><FiEdit3 size={16} /> Update</> : <><FiPlus size={16} /> Add Category</>}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="px-5 min-h-[44px] bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-full cursor-pointer whitespace-nowrap"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>

                {/* Directory */}
                <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-lg font-bold text-slate-800">Category Directory</h3>
                            <span className="px-3 py-1 bg-brand-50 text-brand-700 font-semibold text-xs rounded-full">
                                Showing {filteredList.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + itemsPerPage, filteredList.length)}` : 0} of {filteredList.length} ({categories.length} total)
                            </span>
                        </div>
                        <div className="relative w-full md:w-80">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                                <FiSearch size={15} />
                            </span>
                            <input
                                type="text"
                                placeholder="Search categories by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`${inputCls} pl-9`}
                            />
                        </div>
                    </div>

                    {fetching ? (
                        <Skeleton rows={5} h="h-16" />
                    ) : currentCategories.length === 0 ? (
                        <div className="text-center py-14 text-slate-400">
                            <FiAlertCircle size={34} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm font-medium">No categories found!</p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {currentCategories.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-brand-300 transition-colors"
                                >
                                    <div className="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                                        <span className="font-bold text-slate-800 break-words">{item.name}</span>
                                        <div className="flex items-center gap-2">
                                            <StatusBadge active={item.isActive} />
                                            {item.createdAt && <span className="text-xs text-slate-400">{formatCreatedDate(item.createdAt)}</span>}
                                        </div>
                                    </div>
                                    <RowMenu
                                        items={[
                                            { label: 'Edit', icon: <FiEdit3 size={13} />, onClick: () => handleEditClick(item) },
                                            { label: 'Delete', icon: <FiTrash2 size={13} />, tone: 'rose', onClick: () => handleDelete(item._id) },
                                        ]}
                                    />
                                </div>
                            ))}
                        </div>
                    )}

                    {!fetching && filteredList.length > 0 && <Pager page={currentPage} total={totalPages} onChange={handlePageChange} />}
                </div>
            </div>
        </div>
    );
};

export default Category;