import { useState, useEffect } from "react";
import Swal from "sweetalert2";

const NewsletterFaq = ({ faq, onDelete, onUpdate }) => {
    const { _id, faqQuestion, faqAnswer } = faq;
    const [editQ, setEditQ] = useState(faqQuestion);
    const [editA, setEditA] = useState(faqAnswer);

    useEffect(() => {
        setEditQ(faqQuestion);
        setEditA(faqAnswer);
    }, [faqQuestion, faqAnswer]);

    const handleDelete = () => {
        Swal.fire({
            title: "Delete FAQ?",
            text: "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#2acb35",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!",
        }).then((result) => {
            if (result.isConfirmed) {
                fetch(`http://localhost:5000/newsletterFaq/${_id}`, {
                    method: "DELETE",
                })
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.deletedCount > 0) {
                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: "Your faq has been deleted",
                                showConfirmButton: false,
                                timer: 1500
                            });
                            onDelete(_id);
                        }
                    });
            }
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        const updatedFaq = {
            faqQuestion: editQ,
            faqAnswer: editA,
        };

        fetch(`http://localhost:5000/newsletterFaq/${_id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedFaq),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.modifiedCount > 0) {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: "Your faq has been updated successfully",
                        showConfirmButton: false,
                        timer: 1500
                    });
                    onUpdate(_id, updatedFaq);
                    document.getElementById(`edit_modal_${_id}`).close();
                }
            });
    };

    return (
        <>
            <div className="collapse collapse-arrow border border-gray-300 rounded-lg">
                <input type="checkbox" className="peer" />
                <div className="collapse-title font-medium text-lg peer-checked:bg-[#2acb35] bg-white peer-checked:text-white">
                    {faqQuestion}
                </div>
                <div className="collapse-content peer-checked:bg-gray-100">
                    <p className="mb-4 mt-2">{faqAnswer}</p>
                    <div className="flex gap-3">
                        <button
                            onClick={() => document.getElementById(`edit_modal_${_id}`).showModal()}
                            className="btn bg-[#2acb35] text-white hover:bg-green-600"
                        >
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            className="btn bg-red-600 text-white hover:bg-red-700"
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
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-lg">✕</button>
                    </form>
                    <h3 className="font-bold text-lg mb-4">Edit FAQ</h3>
                    <form onSubmit={handleEditSubmit} className="space-y-4">
                        <div>
                            <label className="block font-medium">Question</label>
                            <textarea
                                rows="2"
                                value={editQ}
                                onChange={(e) => setEditQ(e.target.value)}
                                className="w-full border p-2 rounded"
                                required
                            ></textarea>
                        </div>
                        <div>
                            <label className="block font-medium">Answer</label>
                            <textarea
                                rows="4"
                                value={editA}
                                onChange={(e) => setEditA(e.target.value)}
                                className="w-full border p-2 rounded"
                                required
                            ></textarea>
                        </div>
                        <button type="submit" className="btn bg-[#2acb35] text-white hover:bg-green-600">
                            Save
                        </button>
                    </form>
                </div>
            </dialog>
        </>
    );
};

export default NewsletterFaq;
