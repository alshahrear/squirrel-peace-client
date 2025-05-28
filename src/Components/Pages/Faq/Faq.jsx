import { Link, NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { useEffect, useState } from "react";
import FaqList from "./FaqList";

const Faq = () => {
  const [faqsAdd, setFaqsAdd] = useState([]);
  const [faqs, setFaqs] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/faqsAdd")
      .then((res) => res.json())
      .then((data) => setFaqsAdd(data));
  }, []);

  useEffect(() => {
    fetch('http://localhost:5000/faqs')
      .then(res => res.json())
      .then(data => setFaqs(data))
      .catch(error => console.error("Error loading FAQs:", error));
  }, []);


  // Delete হলে UI থেকে remove করা
  const handleDeleteFaqFromUI = (id) => {
    setFaqsAdd((prev) => prev.filter((faq) => faq._id !== id));
  };

  // Update হলে UI থেকে update করা
  const handleUpdateFaqFromUI = (id, updatedFaq) => {
    setFaqsAdd((prev) =>
      prev.map((faq) => (faq._id === id ? { ...faq, ...updatedFaq } : faq))
    );
  };

  // Add FAQ from modal
  const handleAddFaq = (e) => {
    e.preventDefault();
    const form = e.target;
    const faqQuestion = form.faqQuestion.value;
    const faqAnswer = form.faqAnswer.value;
    const addFaqList = { faqQuestion, faqAnswer };

    fetch("http://localhost:5000/faqsAdd", {
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
          });
          // নতুন FAQ কে UI তে যোগ করলাম
          setFaqsAdd((prev) => [...prev, { _id: data.insertedId, faqQuestion, faqAnswer }]);
          form.reset();
        }
      });
  };

  // Your existing question submit handler (optional)
  const handleFaq = (e) => {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const question = form.question.value;

    const addFaqQus = { name, email, question };

    fetch("http://localhost:5000/faqs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(addFaqQus),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.insertedId) {
          Swal.fire({
            position: "top-end",
            icon: "success",
            title:
              "Thanks for your question! Our team will check it and reply to your email shortly.",
            showConfirmButton: false,
            timer: 2500,
          });
          // ফর্ম রিসেট
          form.reset();

          // নতুন মেসেজ যোগ করো স্টেটে
          setFaqs([...faqs, { _id: data.insertedId, ...addFaqQus }]);
        }
      });
  };

  return (
    <div className="bg-[#f5f7ec]">
      <div className="py-10 max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap mb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Frequently Asked Questions <span className="text-[#2acb35]">__</span>
          </h1>
          <NavLink to="/faqAdmin">
            <div className="indicator mt-5">
              <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">{faqs.length}</span>
              <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040] hover:scale-105">
                  Faq Admin Page
                </span>
                <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
              </button>
            </div>
          </NavLink>
        </div>

        <p className="text-lg font-medium my-5">
          Discover your question from underneath or present your inquiry from the submit box.
        </p>

        <div className="flex flex-wrap">
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

          <div className="w-2/3 pr-0 md:pr-4">
            {faqsAdd.map((faqAdd) => (
              <FaqList
                key={faqAdd._id}
                faqAdd={faqAdd}
                onDelete={handleDeleteFaqFromUI}
                onUpdate={handleUpdateFaqFromUI}
              />
            ))}

            <button
              className="btn mt-5 px-6 py-5 text-lg font-medium rounded-lg text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]"
              onClick={() => document.getElementById("my_modal_3").showModal()}
            >
              Add Faq
            </button>

            <dialog id="my_modal_3" className="modal">
              <div className="modal-box">
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
                    className="btn px-6 py-2 text-white bg-[#2acb35] rounded hover:bg-green-600"
                  >
                    Add FAQ
                  </button>
                </form>
              </div>
            </dialog>
          </div>

          <div className="w-1/3 ">
          <p className="text-lg text-center font-semibold">
            If you want, you can also ask your question on the {" "}
            <span className="text-[#2acb35] underline hover:font-bold hover:text-gray-600">
              <Link to="/contact">Contact Page</Link>
            </span>
          </p>
            <form onSubmit={handleFaq} className="bg-[#f5f7ec] p-6 rounded-md shadow-md ">
              <h2 className="text-2xl font-bold mb-4">Submit Your Question</h2>
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
                className="btn px-5 py-2 text-[16px] font-medium text-white bg-[#2acb35] rounded hover:bg-green-600 hover:scale-105"
              >
                Submit Question
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Faq;
