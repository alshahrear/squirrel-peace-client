// QuizTestAdmin.jsx
import { useState, useRef } from "react";
import { NavLink } from "react-router-dom";
import Swal from "sweetalert2";
import { LuMessageCircleX } from "react-icons/lu";
import { TbMessageCheck } from "react-icons/tb";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../../Layout/useAuth";
import { Helmet } from "react-helmet";

const QuizTestAdmin = () => {
  const axiosSecure = useAxiosSecure();
  const { user } = useAuth();

  const { data: quizTests = [], refetch } = useQuery({
    queryKey: ["admin-quizTest"],
    queryFn: async () => {
      const res = await axiosSecure.get("/quizTest");
      return res.data;
    },
  });

  const handleDeleteAll = async () => {
    const result = await Swal.fire({
      title: "Are you sure to delete all?",
      text: "All quiz tests will be removed permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2acb35",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete all!",
    });

    if (result.isConfirmed) {
      const res = await axiosSecure.delete("/quizTest");
      if (res.data.success) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `All quiz tests have been deleted`,
          showConfirmButton: false,
          timer: 1500,
        });
        refetch();
      }
    }
  };

  return (
    <div className="my-10 max-w-screen-xl mx-auto px-4">
      <Helmet>
        <title>QuizTestAdmin - Squirrel Peace</title>
      </Helmet>

      <div className="text-center space-y-3 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome{" "}
          <i className="text-[#2acb35]">{user.displayName}</i> to the Quiz Test
          Administration Panel
        </h1>
        <p className="max-w-5xl mx-auto">
          Here you can view all submitted quiz answers in detail, carefully
          review each participant's performance, and select the deserving
          winners to recognize their knowledge and effort.
        </p>
        <NavLink to="/quizTest">
          <button className="relative overflow-hidden px-6 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
            <span className="relative z-10 group-hover:text-[#404040]">
              Quiz Test Page
            </span>
            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
          </button>
        </NavLink>
      </div>

      <div className="flex sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 px-3">
        <div className="text-xl sm:text-2xl font-semibold text-gray-800">
          Total Submissions:{" "}
          <span className="text-[#2acb35]">{quizTests.length}</span>
        </div>
        <button
          onClick={handleDeleteAll}
          className="bg-[#e53935] hover:bg-[#d32f2f] text-white font-semibold px-4 py-2 rounded-md"
        >
          Delete All
        </button>
      </div>

      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="table-auto w-full text-left border-collapse quiz-table">
          <thead>
            <tr className="bg-[#2acb35] text-white text-xl">
              <th className="py-3 px-4 text-center">#</th>
              <th className="py-3 px-4">Name</th>
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-center">Details</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {quizTests.length > 0 ? (
              quizTests.map((quiz, index) => (
                <QuizTestMessage
                  key={quiz._id}
                  quiz={quiz}
                  index={index}
                  refetch={refetch}
                />
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center py-6 text-gray-500">
                  No quiz test submissions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .quiz-table thead { display: none; }
          .quiz-table tbody tr { display: block; margin-bottom: 1rem; border: 1px solid #ccc; border-radius: 0.5rem; padding: 1rem; background: white; box-shadow: 0 0 5px rgb(0 0 0 / 0.1); }
          .quiz-table tbody tr td { display: block; padding: 0.5rem 0; text-align: left !important; font-size: 18px; border: none !important; position: relative; padding-left: 110px; word-break: break-word; white-space: normal; }
          .quiz-table tbody tr td::before { content: attr(data-label); position: absolute; left: 1rem; top: 0.5rem; font-weight: 600; color: #2acb35; white-space: nowrap; }
          .quiz-table tbody tr td.text-center { padding-left: 0 !important; }
          .quiz-table tbody tr td.text-center button { margin: 0 auto; display: block; }
        }
      `}</style>
    </div>
  );
};

const QuizTestMessage = ({ quiz, index, refetch }) => {
  const { _id, name, email, facebook, otp, answer, date, image } = quiz;
  const [showModal, setShowModal] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const axiosSecure = useAxiosSecure();

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: "Are you sure to delete it?",
      text: "This quiz test will be removed permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2acb35",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      const res = await axiosSecure.delete(`/quizTest/${_id}`);
      if (res.data.deletedCount > 0) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: `${name}'s quiz test has been deleted`,
          showConfirmButton: false,
          timer: 1500,
        });
        refetch();
      }
    }
  };

  const copyOnClick = async (text, field) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      Swal.fire({
        icon: "error",
        title: "Copy failed",
        text: "Unable to copy to clipboard on this device/browser.",
      });
    }
  };

  const makeHandlers = (text, field) => ({
    onClick: () => copyOnClick(text, field),
    onTouchStart: () => copyOnClick(text, field),
    tabIndex: 0,
    role: "button",
    className: "focus:outline-none cursor-pointer",
  });

  return (
    <>
      <tr className="odd:bg-white even:bg-gray-100 transition-all duration-200 align-middle">
        <td className="py-4 px-4 font-semibold text-gray-700 text-center" data-label="#">
          {index + 1}
        </td>
        <td {...makeHandlers(name, "name")} className="py-4 px-4 text-base sm:text-lg font-bold text-gray-800" data-label="Name">
          {name}
          {copiedField === "name" && <span className="ml-2 text-sm text-green-600">Copied!</span>}
        </td>
        <td {...makeHandlers(email, "email")} className="py-4 px-4 text-sm sm:text-lg text-gray-700 break-words whitespace-normal" data-label="Email">
          {email}
          {copiedField === "email" && <span className="ml-2 text-sm text-green-600">Copied!</span>}
        </td>
        <td className="py-4 px-4 text-sm sm:text-lg text-gray-700 align-middle" data-label="Date">
          {date}
        </td>
        <td className="py-4 px-4 text-center align-middle" data-label="Details">
          <button className="bg-[#2acb35] hover:bg-[#25b22f] text-white p-2 rounded-full" onClick={() => setShowModal(true)}>
            <TbMessageCheck className="text-xl sm:text-2xl" />
          </button>
        </td>
        <td className="py-4 px-4 text-center align-middle" data-label="Delete">
          <button onClick={handleDelete} className="bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full">
            <LuMessageCircleX className="text-xl sm:text-2xl" />
          </button>
        </td>
      </tr>

      {showModal && (
        <dialog open className="modal">
          <div className="modal-box max-w-3xl">
            <form method="dialog">
              <button className="btn btn-xl btn-circle btn-ghost absolute right-2 top-2" onClick={() => setShowModal(false)}>✕</button>
            </form>
            <p className="mb-3 text-xl font-semibold">
              <span className="text-[#2acb35]">{name}'s</span> Quiz Submission Details:
            </p>

            <div {...makeHandlers(facebook, "facebook")} className="border border-gray-300 rounded-xl p-5 mb-5">
              <h3 className="text-[#2acb35] font-semibold text-lg sm:text-xl mb-2">Facebook:</h3>
              <p className="text-sm sm:text-lg font-medium text-gray-700 break-words whitespace-normal">
                {facebook || "No Facebook link submitted"}
              </p>
              {copiedField === "facebook" && <span className="text-sm text-green-600">Copied!</span>}
            </div>

            <div {...makeHandlers(answer, "answer")} className="border border-gray-300 rounded-xl p-5 mb-5">
              <h3 className="font-bold text-lg sm:text-xl text-[#2acb35] mb-2">Answer: (OTP-{otp})</h3>
              <p className="text-gray-700 text-base font-medium break-words whitespace-normal">{answer}</p>
              {copiedField === "answer" && <span className="text-sm text-green-600">Copied!</span>}
            </div>

            <div className="border border-gray-300 rounded-xl p-5">
              <h3 className="font-bold text-lg sm:text-xl text-[#2acb35] mb-3">Uploaded Image:</h3>
              {image ? (
                <img src={image} alt="Quiz Submission" className="w-full rounded-lg shadow-md" />
              ) : (
                <p className="text-gray-600 italic">No image submitted</p>
              )}
            </div>
          </div>
        </dialog>
      )}
    </>
  );
};

export default QuizTestAdmin;
