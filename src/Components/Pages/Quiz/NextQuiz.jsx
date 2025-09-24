// NextQuiz.jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiEdit3, FiX } from "react-icons/fi";
import { RiDeleteBin6Line } from "react-icons/ri";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import Swal from "sweetalert2";

const NextQuiz = () => {
  const axiosPublic = useAxiosPublic();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState("");
  const [editId, setEditId] = useState(null);
  const [toast, setToast] = useState("");
  const { user } = useAuth();
  const [isAdmin] = useAdmin();

  // ===== Fetch Data with Auto Refresh =====
  const { data: quizNexts = [], refetch, isLoading } = useQuery({
    queryKey: ["quizNext"],
    queryFn: async () => {
      const res = await axiosPublic.get("/quizNext");
      return res.data;
    },
    refetchInterval: 5000, // প্রতি ৫ সেকেন্ডে fresh data
  });

  // ===== Show Toast =====
  const showToast = (message) => {
    setToast(message);
    setTimeout(() => {
      setToast("");
    }, 2000);
  };

  // ===== Add / Update (Text only) =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    try {
      if (editId) {
        await axiosPublic.patch(`/quizNext/${editId}`, { quizNext: inputText });
        showToast("Quiz text updated!");
        setEditId(null);
      } else {
        await axiosPublic.post("/quizNext", {
          quizNext: inputText,
          isSelected: false,
        });
        showToast("New quiz text added!");
      }
      setInputText("");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // ===== Delete with Swal confirm =====
  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This quiz text will be deleted permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axiosPublic.delete(`/quizNext/${id}`);
          showToast("Quiz text deleted.");
          refetch();
        } catch (err) {
          console.error(err);
        }
      }
    });
  };

  // ===== Edit Text =====
  const handleEdit = (item) => {
    setEditId(item._id);
    setInputText(item.quizNext);
    setIsOpen(true);
  };

  // ===== Checkbox Select =====
  const handleSelect = async (id) => {
    try {
      // সার্ভারে update করা (শুধু selected true হবে, অন্যগুলো false)
      await Promise.all(
        quizNexts.map((item) =>
          axiosPublic.patch(`/quizNext/${item._id}`, {
            isSelected: item._id === id,
          })
        )
      );
      showToast("Selection updated!");
      refetch();
    } catch (err) {
      console.error(err);
    }
  };

  // ===== Selected Text =====
  const selectedText =
    quizNexts.find((item) => item.isSelected)?.quizNext ||
    "Next quiz will be on Friday 5:30 PM";

  return (
    <div className="relative w-full">
      {/* ==== Toast Notification ==== */}
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-[#2acb35] text-white px-4 py-2 rounded shadow-lg z-[100] text-base">
          {toast}
        </div>
      )}

      {/* main text */}
      <div className="flex flex-wrap items-center justify-center gap-2 text-gray-700 px-2 sm:px-0">
        <span className="font-semibold text-[#2acb35] text-base md:text-lg text-center">
          {selectedText}
        </span>

        {isAdmin && (
          <FiEdit3
            onClick={() => setIsOpen(true)}
            className="cursor-pointer text-gray-600 hover:text-gray-900"
          />
        )}
      </div>

      {/* ===== Modal ===== */}
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-2 sm:px-4">
          {/* overlay */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => {
              setIsOpen(false);
              setEditId(null);
              setInputText("");
            }}
          ></div>

          {/* modal box */}
          <div className="relative w-full max-w-3xl bg-white border border-gray-300 rounded-lg shadow-xl p-4 sm:p-6 z-[80] max-h-[90vh] overflow-y-auto">
            {/* close button */}
            <button
              onClick={() => {
                setIsOpen(false);
                setEditId(null);
                setInputText("");
              }}
              className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
            >
              <FiX size={22} />
            </button>

            <h2 className="text-xl font-semibold mb-4 sm:mb-5 text-center text-gray-800">
              Manage Next Quiz Text
            </h2>

            {/* list of quiz texts */}
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto border border-gray-300 rounded-lg p-2 sm:p-3 bg-gray-50 text-base">
              {isLoading ? (
                <p className="text-center text-gray-500">Loading...</p>
              ) : quizNexts.length ? (
                quizNexts.map((item) => (
                  <div
                    key={item._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border border-gray-300 rounded px-2 sm:px-3 py-2 bg-white"
                  >
                    <label className="flex items-center text-base gap-4 flex-1">
                      <input
                        type="checkbox"
                        checked={item.isSelected || false}
                        onChange={() => handleSelect(item._id)}
                      />
                      <span className="break-words">{item.quizNext}</span>
                    </label>
                    {isAdmin && (
                      <div className="flex gap-5 text-xl justify-end">
                        <FiEdit3
                          onClick={() => handleEdit(item)}
                          className="cursor-pointer text-blue-600"
                        />
                        <RiDeleteBin6Line
                          onClick={() => handleDelete(item._id)}
                          className="cursor-pointer text-red-600"
                        />
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 text-base">
                  No quiz texts available
                </p>
              )}
            </div>

            {/* input form */}
            {isAdmin && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Enter quiz text..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="border border-gray-300 rounded px-3 py-2 h-12 w-full focus:outline-none focus:ring-2 focus:ring-[#2acb35] text-base"
                />
                <button
                  type="submit"
                  className="bg-[#2acb35] text-white rounded-lg px-4 py-2 hover:bg-[#25b62f] text-base"
                >
                  {editId ? "Update" : "Add New"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NextQuiz;
