import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";

const FaqList = ({ faqAdd, onDelete, onUpdate }) => {
  const { _id, faqQuestion, faqAnswer } = faqAdd;

  // Edit Modal এর জন্য state
  const [editQuestion, setEditQuestion] = useState(faqQuestion);
  const [editAnswer, setEditAnswer] = useState(faqAnswer);

  useEffect(() => {
    setEditQuestion(faqQuestion);
    setEditAnswer(faqAnswer);
  }, [faqQuestion, faqAnswer]);

  // Modal open/close
  const openModal = () => {
    document.getElementById(`edit_modal_${_id}`).showModal();
  };
  const closeModal = () => {
    document.getElementById(`edit_modal_${_id}`).close();
  };

  // Delete handler
  const handleDelete = () => {
    Swal.fire({
      title: "Are you sure to delete it?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2acb35",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        fetch(`http://localhost:5000/faqsAdd/${_id}`, { method: "DELETE" })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              Swal.fire({
                icon: "success",
                title: "Deleted!",
                text: "FAQ has been deleted.",
                timer: 1500,
                showConfirmButton: false,
              });
              onDelete(_id);
            }
          })
          .catch(() => {
            Swal.fire("Error!", "Something went wrong.", "error");
          });
      }
    });
  };

  // Edit form submit handler (update FAQ)
  const handleEditSubmit = (e) => {
    e.preventDefault();

    const updatedFaq = {
      faqQuestion: editQuestion,
      faqAnswer: editAnswer,
    };

    fetch(`http://localhost:5000/faqsAdd/${_id}`, {
      method: "PATCH",  // PATCH is better for partial update
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedFaq),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.modifiedCount > 0) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "FAQ updated successfully!",
            showConfirmButton: false,
            timer: 2000,
          });
          closeModal();
          // Parent component কে update callback দিয়ে state update করব
          onUpdate(_id, updatedFaq);
        } else {
          Swal.fire("Info", "No changes detected or update failed.", "info");
        }
      })
      .catch(() => {
        Swal.fire("Error!", "Failed to update FAQ.", "error");
      });
  };

  return (
    <>
      <div className="collapse collapse-arrow border border-gray-300 rounded-lg mb-3">
        <input type="checkbox" className="peer" />
        <div className="collapse-title text-lg font-medium cursor-pointer peer-checked:bg-[#2acb35] peer-checked:text-white">
          {faqQuestion}
        </div>
        <div className="collapse-content text-gray-700 peer-checked:bg-[#f7f7f7] peer-checked:py-3">
          <p>{faqAnswer}</p>
          <div className="mt-3 flex gap-3">
            <button
              onClick={openModal}
              className="btn px-5 py-1 text-white bg-[#2acb35] rounded hover:bg-[#2acb35dc] hover:scale-105"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="btn px-4 py-1 text-white bg-red-600 rounded hover:bg-red-700 hover:scale-105"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <dialog id={`edit_modal_${_id}`} className="modal">
        <div className="modal-box">
          <form method="dialog">
            <button
              type="button"
              onClick={closeModal}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              ✕
            </button>
          </form>
          <h3 className="font-bold text-2xl mb-4">Edit FAQ</h3>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Question</label>
              <textarea
                rows="3"
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              ></textarea>
            </div>
            <div>
              <label className="block font-medium mb-1">Answer</label>
              <textarea
                rows="5"
                value={editAnswer}
                onChange={(e) => setEditAnswer(e.target.value)}
                required
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
              ></textarea>
            </div>
            <button
              type="submit"
              className="btn px-6 py-2 text-white bg-[#2acb35] rounded hover:bg-green-600"
            >
              Save Changes
            </button>
          </form>
        </div>
      </dialog>
    </>
  );
};

export default FaqList;
