// TermsQuiz.jsx
import { useState, useMemo } from "react";
import { FiX, FiEdit3 } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import Swal from "sweetalert2";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useQuery } from "@tanstack/react-query";
import useAdmin from "../../../hooks/useAdmin";

const API_BASE = "https://squirrel-peace-server.onrender.com";

const TermsQuiz = ({ isDrawerOpen, closeDrawer }) => {
  const axiosSecure = useAxiosSecure();
  const [isAdmin] = useAdmin();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [termInput, setTermInput] = useState("");

  // ===== React Query: Fetch Terms =====
  const { data: terms = [], isLoading, refetch } = useQuery({
    queryKey: ["quizTerms"],
    queryFn: async () => {
      const res = await axiosSecure.get(`${API_BASE}/quizTerms`);
      return res.data || [];
    },
  });

  const sortedTerms = useMemo(() => terms, [terms]);

  // ===== Modal handlers =====
  const openCreateModal = () => { setEditingId(null); setTermInput(""); setIsModalOpen(true); };
  const openEditModal = (item) => { setEditingId(item._id); setTermInput(item.quizTerms || ""); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setEditingId(null); setTermInput(""); };

  // ===== CRUD =====
  const submitTerm = async (e) => {
    e.preventDefault();
    const payload = { quizTerms: termInput?.trim() };
    if (!payload.quizTerms) {
      Swal.fire({ icon: "warning", title: "Empty input!", text: "Please enter a term before submitting." });
      return;
    }
    try {
      if (editingId) {
        await axiosSecure.patch(`${API_BASE}/quizTerms/${editingId}`, payload);
        Swal.fire({ icon: "success", title: "Updated successfully", timer: 1200, showConfirmButton: false });
      } else {
        await axiosSecure.post(`${API_BASE}/quizTerms`, payload);
        Swal.fire({ icon: "success", title: "Term added", timer: 1200, showConfirmButton: false });
      }
      closeModal();
      refetch();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Operation failed", text: err?.response?.data?.message || "Something went wrong!" });
    }
  };

  const deleteTerm = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Once deleted, you cannot recover this term.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#aaa",
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
    });
    if (!confirm.isConfirmed) return;
    try {
      await axiosSecure.delete(`${API_BASE}/quizTerms/${id}`);
      Swal.fire({ icon: "success", title: "Deleted", timer: 1200, showConfirmButton: false });
      refetch();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Delete failed", text: err?.response?.data?.message || "Something went wrong!" });
    }
  };

  return (
    <>
      {/* Drawer */}
      <div className={`fixed right-0 top-0 sm:top-1/2 sm:-translate-y-1/2 bg-white shadow-xl p-4 sm:p-6 flex flex-col z-50 transition-transform duration-500 ease-in-out w-full sm:w-[65%] md:w-[55%] lg:w-[50%] h-full sm:h-[90%] rounded-none sm:rounded-lg ${isDrawerOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between">
          {isAdmin && (
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded bg-[#2acb35] text-white hover:bg-green-700"
              title="Add new terms"
            >
              Add Terms
            </button>
          )}
          <h3 className="text-xl mt-2 font-semibold text-gray-800">What You Should Know Before Joining Quiz</h3>
          <button onClick={closeDrawer} className="text-gray-600 hover:text-red-500 font-bold" title="Close"><FiX size={30} /></button>
        </div>
        <div className="mt-4 overflow-y-auto flex-1 pr-2 text-base">
          {isLoading ? <p className="text-gray-500">Loading terms...</p> :
            sortedTerms?.length ? (
              <ol className="list-decimal text-lg list-inside text-gray-700 space-y-5">
                {sortedTerms.map((item, index) => (
                  <li key={item._id} className="flex items-start justify-between gap-3 group">
                    <span className="flex-1 leading-6">{index + 1}. {item.quizTerms}</span>
                    {isAdmin && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditModal(item)} className="p-1.5 rounded hover:bg-gray-100 text-gray-600" title="Edit"><FiEdit3 size={18} /></button>
                        <button onClick={() => deleteTerm(item._id)} className="p-1.5 rounded hover:bg-gray-100 text-red-600" title="Delete"><RiDeleteBin6Line size={18} /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            ) : <div className="text-center text-gray-500">No terms & condition found.</div>}
        </div>
        <div className="mt-4">
          <button onClick={closeDrawer} className="w-full px-4 py-2 bg-[#2acb35] text-white rounded hover:bg-green-700">Close</button>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-5 relative">
            <button onClick={closeModal} className="absolute right-4 top-4 text-gray-600 hover:text-red-500" title="Close"><FiX size={22} /></button>
            <h4 className="text-lg font-semibold mb-4">{editingId ? "Edit Term" : "Add Term"}</h4>
            <form onSubmit={submitTerm} className="space-y-4">
              <div>
                <textarea rows="4" value={termInput} onChange={(e) => setTermInput(e.target.value)} placeholder="Write Your Terms & Condition" className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#2acb35] text-base"></textarea>
              </div>
              <div className="flex items-center justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50 text-gray-600 text-base">Cancel</button>
                <button type="submit" className="px-5 py-2 rounded bg-[#2acb35] text-white hover:bg-green-700 text-base">{editingId ? "Update" : "Submit"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default TermsQuiz;
