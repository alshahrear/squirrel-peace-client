import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import { motion } from "framer-motion";
import FaqQuizList from "./FaqQuizList";


const FaqQuiz = () => {
  const [faqsAdd, setFaqsAdd] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const { user } = useAuth();
  const [isAdmin] = useAdmin();
  const [loading, setLoading] = useState(false);

  // fetch all added FAQs
  const loadFaqsAdd = () => {
    fetch("https://squirrel-peace-server.onrender.com/quizFaqsAdd")
      .then((res) => res.json())
      .then((data) => setFaqsAdd(data))
      .catch((error) => console.error("Error loading quizFaqsAdd:", error));
  };

  useEffect(() => {
    loadFaqsAdd();
  }, []);

  useEffect(() => {
    fetch("https://squirrel-peace-server.onrender.com/quizFaqs")
      .then((res) => res.json())
      .then((data) => setFaqs(data))
      .catch((error) => console.error("Error loading quizFaqs:", error));
  }, []);

  const handleDeleteFaqFromUI = (id) => {
    setFaqsAdd((prev) => prev.filter((faq) => faq._id !== id));
  };

  const handleUpdateFaqFromUI = (id, updatedFaq) => {
    setFaqsAdd((prev) =>
      prev.map((faq) => (faq._id === id ? { ...faq, ...updatedFaq } : faq))
    );
  };

  const handleAddFaq = (e) => {
    e.preventDefault();
    const form = e.target;
    const faqQuestion = form.faqQuestion.value;
    const faqAnswer = form.faqAnswer.value;
    const addFaqList = { faqQuestion, faqAnswer };

    fetch("https://squirrel-peace-server.onrender.com/quizFaqsAdd", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(addFaqList),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.insertedId) {
          document.getElementById("my_modal_3").close();
          Swal.fire({
            position: "top-end",
            icon: "success",
            title: "Your new FAQ has been added to the list. Thank you.",
            showConfirmButton: false,
            timer: 2000,
            customClass: {
              popup: "swal-responsive-text",
            },
          });
          // ✅ fresh data reload
          loadFaqsAdd();
          form.reset();
        }
      })
      .catch(() => {
        Swal.fire("Error!", "Failed to add FAQ.", "error");
      });
  };

  const handleFaq = (e) => {
    e.preventDefault();
    setLoading(true);
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const question = form.question.value;

    const addFaqQus = { name, email, question };

    fetch("https://squirrel-peace-server.onrender.com/quizFaqs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(addFaqQus),
    })
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.insertedId) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title:
              "Thanks for your question! Our team will check it and reply to your email shortly.",
            showConfirmButton: false,
            timer: 2500,
            customClass: {
              popup: "swal-responsive-text",
            },
          });
          form.reset();
          setFaqs([...faqs, { _id: data.insertedId, ...addFaqQus }]);
        }
      })
      .catch(() => {
        setLoading(false);
        Swal.fire("Error!", "Failed to submit question.", "error");
      });
  };

  // animation variants for FAQ items
  const faqVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.15,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="bg-[#f7f7f7]">
      <div className="py-10 max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold flex items-center gap-2">
            Frequently Asked Questions
            <span className="text-[#2acb35]">__</span>
          </h2>
        </div>
        <p className="my-3 max-w-3xl">
          Have questions about how our quizzes work? Explore the FAQ section to find clear answers to the most common queries, so you can enjoy the quiz experience without any confusion.
        </p>

        <div className="flex flex-col md:flex-row gap-6">
          <style>{`
            input:checked ~ .collapse-title {
              background-color: #2acb35;
              color: white;
            }
            input:checked ~ .collapse-content {
              background-color: #f7f7f7;
              padding-top: 0.75rem;
              padding-bottom: 0.75rem;
            }
          `}</style>

          <div className="w-full md:w-2/3 space-y-4">
            {faqsAdd.map((faqAdd, i) => (
              <motion.div
                key={faqAdd._id}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={faqVariants}
              >
                <FaqQuizList
                  faqAdd={faqAdd}
                  onDelete={handleDeleteFaqFromUI}
                  onUpdate={handleUpdateFaqFromUI}
                />
              </motion.div>
            ))}

            {user && isAdmin && (
              <button
                className="btn mt-5 px-6 py-5 text-lg font-medium rounded-lg text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35] w-full md:w-auto"
                onClick={() =>
                  document.getElementById("my_modal_3").showModal()
                }
              >
                Add Faq
              </button>
            )}

            <dialog id="my_modal_3" className="modal">
              <div className="modal-box w-11/12 max-w-2xl">
                <form method="dialog">
                  <button className="btn btn-xl btn-circle btn-ghost absolute right-2 top-2">
                    ✕
                  </button>
                </form>
                <h3 className="font-bold text-2xl mb-4">Add New FAQ</h3>
                <form onSubmit={handleAddFaq} className="space-y-4">
                  <div>
                    <label className="block font-medium mb-1">Question</label>
                    <textarea
                      rows="3"
                      name="faqQuestion"
                      required
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block font-medium mb-1">Answer</label>
                    <textarea
                      rows="5"
                      name="faqAnswer"
                      required
                      className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn px-6 py-2 text-white bg-[#2acb35] rounded hover:bg-green-600 w-full md:w-auto"
                  >
                    Add FAQ
                  </button>
                </form>
              </div>
            </dialog>
          </div>

          <div className="w-full md:w-1/3">
            <form
              onSubmit={handleFaq}
              className="bg-[#f7f7f7] p-6 rounded-md shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-center">
                Have a Question?
              </h3>
              <input
                type="text"
                name="name"
                placeholder="Enter Your Name"
                className="mb-5 p-2 w-full border border-gray-300 rounded"
                required
              />
              <input
                type="email"
                name="email"
                placeholder="Enter Your Email"
                className="mb-5 p-2 w-full border border-gray-300 rounded"
                required
              />
              <textarea
                name="question"
                rows="8"
                placeholder="Type Your Question"
                className="mb-3 p-2 w-full border border-gray-300 rounded"
                required
              ></textarea>
              <button
                type="submit"
                className={`btn px-5 py-2 text-[16px] font-medium text-white bg-[#2acb35] rounded transition-all duration-300 hover:bg-green-600 hover:scale-105 ${
                  loading ? "opacity-60 cursor-not-allowed" : ""
                } w-full md:w-auto`}
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit Question"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Swal Custom Font Sizes */}
      <style>{`
        .swal-responsive-text {
          font-size: 0.875rem;
        }
        @media (min-width: 640px) {
          .swal-responsive-text {
            font-size: 1rem;
          }
        }
        @media (min-width: 768px) {
          .swal-responsive-text {
            font-size: 1.125rem;
          }
        }
      `}</style>
    </div>
  );
};

export default FaqQuiz;
