import { Link, NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import FaqList from "./FaqList";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import { Helmet } from "react-helmet";
import faq from "../../../assets/faq.jpg";
import { motion } from "framer-motion";  // <-- এখানে যোগ হলো

const Faq = () => {
  const [faqsAdd, setFaqsAdd] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const { user } = useAuth();
  const [isAdmin] = useAdmin();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("https://squirrelpeace.com/api//faqsAdd")
      .then((res) => res.json())
      .then((data) => setFaqsAdd(data));
  }, []);

  useEffect(() => {
    fetch("https://squirrelpeace.com/api//faqs")
      .then((res) => res.json())
      .then((data) => setFaqs(data))
      .catch((error) => console.error("Error loading FAQs:", error));
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

    fetch("https://squirrelpeace.com/api//faqsAdd", {
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
          setFaqsAdd((prev) => [
            ...prev,
            { _id: data.insertedId, faqQuestion, faqAnswer },
          ]);
          form.reset();
        }
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

    fetch("https://squirrelpeace.com/api//faqs", {
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
      .catch(() => setLoading(false));
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
      <Helmet>
        <title>Faq - Squirrel Peace </title>
      </Helmet>

      {/* Banner Section */}
      <div
        className="h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: `url(${faq})` }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <h1 className="relative z-10 text-3xl md:text-3xl lg:text-4xl font-bold text-white text-center">
          FAQ
        </h1>
      </div>

      <div className="py-10 max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-3xl font-bold flex items-center gap-2">
            Frequently Asked Questions
            <span className="text-[#2acb35]">__</span>
          </h1>
          {user && isAdmin && (
            <NavLink to="/faqAdmin">
              <div className="indicator mt-2 md:mt-5">
                <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                  {faqs.length}
                </span>
                <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                  <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040] hover:scale-105">
                    Faq Admin Page
                  </span>
                  <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                </button>
              </div>
            </NavLink>
          )}
        </div>

        <p className="text-xl font-medium">
          Got <span className="text-[#2acb35]">questions</span>? We've got answers.
        </p>
        <p className="my-3 max-w-4xl">
          Explore our most frequently asked questions to better understand how we work, what we offer, and how we can help you. If you still need help, feel free to contact us directly.
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
                <FaqList
                  faqAdd={faqAdd}
                  onDelete={handleDeleteFaqFromUI}
                  onUpdate={handleUpdateFaqFromUI}
                />
              </motion.div>
            ))}

            {user && isAdmin && (
              <button
                className="btn mt-5 px-6 py-5 text-lg font-medium rounded-lg text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35] w-full md:w-auto"
                onClick={() => document.getElementById("my_modal_3").showModal()}
              >
                Add Faq
              </button>
            )}

            <dialog id="my_modal_3" className="modal">
              <div className="modal-box w-11/12 max-w-2xl">
                <form method="dialog">
                  <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
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
              <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-center">Submit Your Question</h2>
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
                rows="6"
                placeholder="Type Your Question"
                className="mb-3 p-2 w-full border border-gray-300 rounded"
                required
              ></textarea>
              <button
                type="submit"
                className={`btn px-5 py-2 text-[16px] font-medium text-white bg-[#2acb35] rounded transition-all duration-300 hover:bg-green-600 hover:scale-105 ${loading ? "opacity-60 cursor-not-allowed" : ""
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

export default Faq;
