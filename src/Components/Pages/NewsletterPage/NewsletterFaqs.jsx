import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import NewsletterFaq from "./NewsletterFaq";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const NewsletterFaqs = () => {
    const [faqs, setFaqs] = useState([]);
    const { user } = useAuth();
    const [isAdmin] = useAdmin();

    useEffect(() => {
        fetch("https://squirrelpeace.com/api//newsletterFaq")
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

        fetch("https://squirrelpeace.com/api//newsletterFaq", {
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

    // Animation Variants
    const containerVariants = {
        visible: {
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.1 });

    return (
        <div className="max-w-4xl mx-auto px-4 md:px-0">
            {/* Header section */}
            <div className="pb-5 flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4 text-center">
                <h2 className="text-2xl font-semibold"><span className="text-[#2acb35]">Questions</span> About Our Newsletter?</h2>
                {
                    user && isAdmin &&
                    <button
                        className="btn bg-[#2acb35] text-white hover:bg-green-600 text-sm md:text-base"
                        onClick={() => document.getElementById("faq_modal").showModal()}
                    >
                        Add FAQ
                    </button>
                }
            </div>

            {/* FAQ List with scroll animation */}
            <motion.div
                ref={ref}
                className="space-y-4"
                variants={containerVariants}
                initial="hidden"
                animate={inView ? "visible" : "hidden"}
            >
                {faqs.map((faq) => (
                    <motion.div key={faq._id} variants={itemVariants}>
                        <NewsletterFaq
                            faq={faq}
                            onDelete={handleDeleteFaqFromUI}
                            onUpdate={handleUpdateFaqFromUI}
                        />
                    </motion.div>
                ))}
            </motion.div>

            {/* Modal for Add FAQ */}
            <dialog id="faq_modal" className="modal">
                <div className="modal-box w-11/12 max-w-xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-lg">✕</button>
                    </form>
                    <h3 className="text-lg md:text-xl font-semibold mb-4">Add New FAQ</h3>
                    <form onSubmit={handleAddFaq} className="space-y-4">
                        <div>
                            <label className="block mb-1 font-medium text-sm md:text-base">Question</label>
                            <textarea
                                name="faqQuestion"
                                rows="2"
                                required
                                className="w-full p-2 border rounded text-sm md:text-base"
                            ></textarea>
                        </div>
                        <div>
                            <label className="block mb-1 font-medium text-sm md:text-base">Answer</label>
                            <textarea
                                name="faqAnswer"
                                rows="4"
                                required
                                className="w-full p-2 border rounded text-sm md:text-base"
                            ></textarea>
                        </div>
                        <button type="submit" className="btn bg-[#2acb35] text-white hover:bg-green-600 text-sm md:text-base">
                            Submit
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

export default NewsletterFaqs;
