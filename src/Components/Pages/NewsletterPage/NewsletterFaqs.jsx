import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import NewsletterFaq from "./NewsletterFaq";

const NewsletterFaqs = () => {
    const [faqs, setFaqs] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5000/newsletterFaq")
            .then((res) => res.json())
            .then((data) => setFaqs(data));
    }, []);

    const handleDeleteFaqFromUI = (id) => {
        setFaqs((prev) => prev.filter((faq) => faq._id !== id));
    };

    const handleUpdateFaqFromUI = (id, updatedFaq) => {
        setFaqs((prev) =>
            prev.map((faq) => (faq._id === id ? { ...faq, ...updatedFaq } : faq))
        );
    };

    const handleAddFaq = (e) => {
        e.preventDefault();
        const form = e.target;
        const faqQuestion = form.faqQuestion.value;
        const faqAnswer = form.faqAnswer.value;
        const newFaq = { faqQuestion, faqAnswer };

        fetch("http://localhost:5000/newsletterFaq", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(newFaq),
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.insertedId) {
                    setFaqs((prev) => [...prev, { _id: data.insertedId, ...newFaq }]);
                    form.reset();
                    document.getElementById("faq_modal").close();
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: "Your faq has been added",
                        showConfirmButton: false,
                        timer: 1500
                    });
                }
            });
    };

    return (
        <div className="max-w-4xl mx-auto px-4">
            <div className="pb-5 flex items-center justify-between">
                <h2 className="text-3xl font-bold">Newsletter FAQs</h2>
                <button
                    className="btn bg-[#2acb35] text-white hover:bg-green-600"
                    onClick={() => document.getElementById("faq_modal").showModal()}
                >
                    Add FAQ
                </button>
            </div>

            <div className="space-y-4">
                {faqs.map((faq) => (
                    <NewsletterFaq
                        key={faq._id}
                        faq={faq}
                        onDelete={handleDeleteFaqFromUI}
                        onUpdate={handleUpdateFaqFromUI}
                    />
                ))}
            </div>

            <div className="mt-8">

            </div>

            <dialog id="faq_modal" className="modal">
                <div className="modal-box">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-lg">✕</button>
                    </form>
                    <h3 className="text-xl font-semibold mb-4">Add New FAQ</h3>
                    <form onSubmit={handleAddFaq} className="space-y-4">
                        <div>
                            <label className="block mb-1 font-medium">Question</label>
                            <textarea
                                name="faqQuestion"
                                rows="2"
                                required
                                className="w-full p-2 border rounded"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium">Answer</label>
                            <textarea
                                name="faqAnswer"
                                rows="4"
                                required
                                className="w-full p-2 border rounded"
                            ></textarea>
                        </div>
                        <button type="submit" className="btn bg-[#2acb35] text-white hover:bg-green-600">
                            Submit
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

export default NewsletterFaqs;
