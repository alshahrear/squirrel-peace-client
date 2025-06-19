import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { LuMessageCircleX } from "react-icons/lu";
import { TbMessageCheck } from "react-icons/tb";
import Swal from "sweetalert2";
import useAuth from "../../Layout/useAuth";
import { Helmet } from "react-helmet";

const FaqAdmin = () => {
  const [faqs, setFaqs] = useState([]);
  const { user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  useEffect(() => {
    fetch("https://squirrel-peace-server.onrender.com/faqs")
      .then((res) => res.json())
      .then((data) => setFaqs(data))
      .catch((error) => console.error("Error loading FAQs:", error));
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setSelectedQuestion(null);
  };

  const openModalWithQuestion = (question) => {
    setSelectedQuestion(question);
    setShowModal(true);
  };

  return (
    <div className="my-12 max-w-screen-xl mx-auto px-2 sm:px-4">
      <Helmet>
        <title>FaqAdmin - Storial Peace</title>
      </Helmet>
      <div className="text-center space-y-3 mb-8 px-2">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the FAQ
          Administration Panel
        </h1>
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          This is a list of users who couldn't find their question in our FAQ
          section and decided to submit their own. <br />
          Here are their submitted questions.
        </p>
        <NavLink to="/faq">
          <button className="relative overflow-hidden px-4 sm:px-6 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
              Go To Faq Page
            </span>
            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
          </button>
        </NavLink>
      </div>

      <div className="mb-4 text-right pr-2 sm:pr-3 text-lg sm:text-2xl font-semibold text-gray-800">
        Total Question: <span className="text-[#2acb35]">{faqs.length}</span>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto w-full text-left text-sm sm:text-base border-collapse faq-table">
          <thead>
            <tr className="bg-[#2acb35] text-white text-base sm:text-xl">
              <th className="py-3 px-2 sm:px-4">#</th>
              <th className="py-3 px-2 sm:px-4">Name</th>
              <th className="py-3 px-2 sm:px-4">Email</th>
              <th className="py-3 px-2 sm:px-4 text-center">Question</th>
              <th className="py-3 px-2 sm:px-4 text-center">Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {faqs.length > 0 ? (
              faqs.map((faq, index) => (
                <FaqQus
                  key={faq._id}
                  faq={faq}
                  index={index}
                  setFaqs={setFaqs}
                  faqs={faqs}
                  openModalWithQuestion={openModalWithQuestion}
                />
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No submitted questions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <dialog open className="modal">
          <div className="modal-box relative max-w-lg">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              onClick={closeModal}
            >
              <span className="text-lg font-bold">✕</span>
            </button>
            <p className="mb-4 text-xl font-semibold text-[#2acb35]">Full Question:</p>
            <p className="text-gray-700 text-lg">{selectedQuestion}</p>
          </div>
        </dialog>
      )}

      <style>{`
        /* Responsive styles for FAQ table */
        @media (max-width: 1024px) {
          .faq-table thead {
            display: none; /* Hide header on mobile/tablet */
          }
          .faq-table tbody tr {
            display: block;
            margin-bottom: 1rem;
            border: 1px solid #ccc;
            border-radius: 0.5rem;
            padding: 1rem;
            background: white;
            box-shadow: 0 0 5px rgb(0 0 0 / 0.1);
          }
          .faq-table tbody tr td {
            display: block;
            padding: 0.5rem 0;
            text-align: left !important;
            font-size: 1rem;
            border: none !important;
            position: relative;
            padding-left: 130px; /* space for label */
            word-break: break-word;
          }
          .faq-table tbody tr td::before {
            content: attr(data-label);
            position: absolute;
            left: 1rem;
            top: 50%;
            transform: translateY(-50%);
            font-weight: 600;
            color: #2acb35;
            white-space: nowrap;
          }
          .faq-table tbody tr td.text-center {
            padding-left: 0;
          }
          /* Center buttons */
          .faq-table tbody tr td.text-center button {
            margin: 0 auto;
            display: block;
          }
        }
      `}</style>
    </div>
  );
};

const FaqQus = ({ faq, index, setFaqs, faqs, openModalWithQuestion }) => {
  const { _id, name, email, question } = faq;

  const handleFaqDelete = () => {
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
        fetch(`https://squirrel-peace-server.onrender.com/faqs/${_id}`, {
          method: "DELETE",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.deletedCount > 0) {
              const remainingFaqs = faqs.filter((item) => item._id !== _id);
              setFaqs(remainingFaqs);

              Swal.fire({
                position: "top-end",
                icon: "success",
                title: `${name}'s faq question has been deleted`,
                showConfirmButton: false,
                timer: 1500,
              });
            }
          });
      }
    });
  };

  return (
    <tr className="odd:bg-white even:bg-gray-100 transition-all duration-200">
      <td className="py-3 px-2 sm:px-4 font-semibold text-gray-700" data-label="#">
        {index + 1}
      </td>
      <td className="py-3 px-2 sm:px-4 font-bold text-gray-800" data-label="Name">
        {name}
      </td>
      <td className="py-3 px-2 sm:px-4 text-gray-700 break-words" data-label="Email">
        {email}
      </td>
      <td className="py-3 px-2 sm:px-4 text-center" data-label="Question">
        <button
          onClick={() => openModalWithQuestion(question)}
          className="btn bg-[#2acb35] hover:bg-[#25b22f] text-white p-2 rounded-full"
          title="View full question"
        >
          <TbMessageCheck className="text-2xl" />
        </button>
      </td>
      <td className="py-3 px-2 sm:px-4 text-center" data-label="Check">
        <button
          onClick={handleFaqDelete}
          className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full"
          title="Delete question"
        >
          <LuMessageCircleX className="text-2xl" />
        </button>
      </td>
    </tr>
  );
};

export default FaqAdmin;
