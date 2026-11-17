import { useState, useEffect, useRef } from "react";
import { FiPlus, FiAlertCircle, FiEdit3, FiTrash2, FiSearch } from "react-icons/fi";
import { toast } from "react-hot-toast";
import Swal from "sweetalert2";
import useAxiosClient from "../../../../hooks/useAxiosClient";
import useCan from "../../../../hooks/useCan";
import { inputCls, labelCls, PopStyle, Skeleton, Switch, StatusBadge, Pager, RowMenu } from "../Product/ProductUi";

// "23/10/2026 08:03:51 pm" -> "23 Oct 2026"
const formatCreatedDate = (value) => {
  if (!value) return "";
  const datePart = value.split(/[ ,]/)[0];
  const [day, month, year] = datePart.split("/");
  if (!day || !month || !year) return value;
  const dateObj = new Date(year, month - 1, day);
  if (isNaN(dateObj)) return value;
  return dateObj.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

const Route = () => {
  const [routes, setRoutes] = useState([]);
  const [formData, setFormData] = useState({ name: "", isActive: true });
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const formRef = useRef(null);
  const axiosClient = useAxiosClient();
  const { canAdd, canEdit, canDelete } = useCan("routes");

  const fetchRoutes = async () => {
    try {
      const res = await axiosClient.get("/route");
      setRoutes(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Error fetching routes", error);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    try {
      if (editingId && !canEdit) return toast.error("আপনার Edit করার অনুমতি নেই!");
      if (!editingId && !canAdd) return toast.error("আপনার Add করার অনুমতি নেই!");
      if (!formData.name.trim()) return toast.error("Please enter route name");

      const isDuplicateName = routes.some(
        (item) => item.name?.trim().toLowerCase() === formData.name.trim().toLowerCase() && item._id !== editingId
      );
      if (isDuplicateName) return toast.error("This route name already exists!");

      const payload = { name: formData.name.trim(), isActive: formData.isActive };

      setLoading(true);
      if (editingId) {
        await axiosClient.put(`/route/${editingId}`, payload);
        toast.success("Route updated successfully");
      } else {
        await axiosClient.post("/route", payload);
        toast.success("Route added successfully");
      }

      await fetchRoutes();
      setFormData({ name: "", isActive: true });
      setEditingId(null);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          (editingId ? "Failed to update route" : "Something went wrong, please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({ name: "", isActive: true });
  };

  const handleEdit = (item) => {
    if (!canEdit) return toast.error("আপনার Edit করার অনুমতি নেই!");
    setEditingId(item._id);
    setFormData({ name: item.name, isActive: item.isActive });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDelete = (id) => {
    if (!canDelete) return toast.error("আপনার Delete করার অনুমতি নেই!");
    Swal.fire({
      title: "Are you sure?",
      text: "This route will be deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#4a58e6",
      cancelButtonColor: "#f43f5e",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosClient.delete(`/route/${id}`);
          setRoutes((prev) => prev.filter((route) => route._id !== id));
          if (editingId === id) handleCancelEdit();
          toast.success("Deleted successfully");
        } catch (error) {
          toast.error("Failed to delete");
        }
      }
    });
  };

  const filteredList = [...routes]
    .reverse()
    .filter((item) => item.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const totalPages = Math.ceil(filteredList.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentRoutes = filteredList.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (n) => {
    if (n >= 1 && n <= totalPages) setCurrentPage(n);
  };

  return (
    <div className="min-h-screen p-3 sm:p-5 md:p-8">
      <PopStyle />
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Routes</h1>
            <p className="text-sm text-slate-500 mt-0.5">Manage all delivery routes</p>
          </div>
          <span className="px-3 py-1 bg-brand-50 text-brand-700 text-xs font-semibold rounded-full whitespace-nowrap">
            Total: {routes.length} routes
          </span>
        </div>

        {/* Form */}
        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5"
        >
          <div className="flex flex-col sm:flex-row sm:items-end gap-3">
            <div className="flex-1">
              <label htmlFor="route-name" className={labelCls}>Route Name</label>
              <input
                id="route-name"
                className={inputCls}
                placeholder="Enter route name..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <span className={labelCls}>Status</span>
              <div className="flex items-center gap-3 h-[42px]">
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  label="Route active status"
                />
                <span className="text-xs font-semibold text-slate-600 w-14">
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="min-h-[42px] px-5 rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer whitespace-nowrap"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className={`min-h-[42px] px-6 rounded-full text-white text-sm font-semibold flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  editingId ? "bg-amber-500 hover:bg-amber-600" : "bg-brand-600"
                }`}
              >
                {loading ? (
                  editingId ? "Updating..." : "Adding..."
                ) : editingId ? (
                  <><FiEdit3 size={16} /> Update Route</>
                ) : (
                  <><FiPlus size={16} /> Add Route</>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* List */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-800">Routes Directory</h2>
            <div className="relative w-full sm:w-72">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <FiSearch size={15} />
              </span>
              <input
                type="text"
                aria-label="Search routes"
                placeholder="Search routes by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${inputCls} pl-10`}
              />
            </div>
          </div>

          {listLoading ? (
            <Skeleton rows={5} />
          ) : currentRoutes.length === 0 ? (
            <div className="text-center py-14 text-slate-400 font-medium flex flex-col items-center">
              <FiAlertCircle size={36} className="mb-2 opacity-40" />
              No routes found!
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentRoutes.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border border-slate-200 bg-white hover:border-brand-200 transition-colors"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 min-w-0">
                    <span className="font-semibold text-sm sm:text-base text-slate-800 break-words">{item.name}</span>
                    <StatusBadge active={item.isActive} />
                    {item.createdAt && (
                      <span className="text-xs text-slate-400 hidden sm:inline">{formatCreatedDate(item.createdAt)}</span>
                    )}
                  </div>
                  <RowMenu
                    items={[
                      { label: "Edit", icon: <FiEdit3 size={13} />, onClick: () => handleEdit(item) },
                      { label: "Delete", icon: <FiTrash2 size={13} />, tone: "rose", onClick: () => handleDelete(item._id) },
                    ]}
                  />
                </div>
              ))}
            </div>
          )}

          {filteredList.length > 0 && <Pager page={currentPage} total={totalPages} onChange={handlePageChange} />}
        </div>
      </div>
    </div>
  );
};

export default Route;