// QuizBoard.jsx
import { useState, useEffect } from "react";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import NextQuiz from "./NextQuiz";
import { useNavigate } from "react-router-dom";
import TermsQuiz from "./TermsQuiz";

const API_BASE = "https://squirrel-peace-server.onrender.com";

const QuizBoard = () => {
  const axiosSecure = useAxiosSecure();
  const { user } = useAuth();
  const [isAdmin] = useAdmin();
  const navigate = useNavigate();

  const [isFbJoined, setIsFbJoined] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isQuizToggleOn, setIsQuizToggleOn] = useState(false);

  const isButtonEnabled = isFbJoined && isSubscribed && isAgreed && isQuizToggleOn;

  // ===== Fetch Quiz Toggle State =====
  const fetchToggle = async () => {
    try {
      const res = await axiosSecure.get(`${API_BASE}/quizToggle`);
      setIsQuizToggleOn(res.data.isQuizEnabled);
    } catch (err) {
      console.error("Failed to fetch toggle", err);
    }
  };

  useEffect(() => {
    fetchToggle();
    const interval = setInterval(fetchToggle, 5000);
    return () => clearInterval(interval);
  }, []);

  // ===== Toggle Handler (Admin Only) =====
  const handleToggleChange = async () => {
    const newState = !isQuizToggleOn;
    try {
      await axiosSecure.patch(`${API_BASE}/quizToggle`, { isQuizEnabled: newState });
      setIsQuizToggleOn(newState);
    } catch (err) {
      console.error("Failed to update toggle", err);
    }
  };

  // ===== UI Handlers =====
  const handleStartQuiz = () => { 
    sessionStorage.setItem("quizAccess", "true"); 
    navigate("/quizTest"); 
  };
  const handleSubscribe = () => window.open("https://squirrelpeace.beehiiv.com/", "_blank");
  const handleSeeTerms = () => setIsDrawerOpen(true);
  const handleCloseDrawer = () => setIsDrawerOpen(false);

  return (
    <div className="relative flex flex-col gap-6 p-4 sm:p-6 md:p-8 max-w-6xl mx-auto bg-white shadow-lg rounded-lg w-full">

      {/* Quiz Status Light */}
      <div className="absolute pt-2 top-3 left-3 flex items-center gap-2 text-base">
        <span className="font-medium">{isQuizToggleOn ? "Quiz Active" : "Quiz Inactive"}</span>
        <span className={`w-3 h-3 rounded-full ${isQuizToggleOn ? "bg-green-500" : "bg-gray-400"} animate-pulse`} />
      </div>

      {/* Admin toggle */}
      {isAdmin && (
        <div className="absolute pt-2 top-3 right-3 flex items-center gap-2 text-base">
          <span className="font-medium">Quiz Toggle:</span>
          <button
            onClick={handleToggleChange}
            className={`w-12 sm:w-14 h-6 sm:h-7 flex items-center rounded-full p-1 transition-colors duration-300 ${isQuizToggleOn ? "bg-[#2acb35]" : "bg-gray-400"}`}
          >
            <div className={`bg-white w-4 sm:w-5 h-4 sm:h-5 rounded-full shadow-md transform transition-transform duration-300 ${isQuizToggleOn ? "translate-x-6 sm:translate-x-7" : "translate-x-0"}`} />
          </button>
        </div>
      )}

      {/* Title */}
      <div className="text-center mt-10">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">Join Our Quiz</h2>
        <p className="text-gray-600 mt-3 text-base">Join our weekly quiz exclusively for newsletter subscribers and win exciting gifts!</p>
      </div>

      {/* Next Quiz */}
      <NextQuiz />

      {/* Info */}
      <p className="font-semibold text-gray-700 text-center text-base">
        The quiz is currently{" "}
        <span className={`${isQuizToggleOn ? "text-green-600" : "text-red-500"}`}>
          {isQuizToggleOn ? "active" : "inactive"}
        </span>.
        {isQuizToggleOn
          ? " Complete all three checkboxes to enable the Start Quiz button."
          : " The Start Quiz button will be enabled once the quiz becomes active and all checkboxes are completed."}
      </p>

      {/* Checkbox 1 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-200 p-3 rounded-md text-lg">
        <label className="flex items-start sm:items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isFbJoined} onChange={(e) => setIsFbJoined(e.target.checked)} className="w-7 h-7 md:w-5 md:h-5 accent-[#2acb35]" />
          <span>
            I have joined{" "}
            <a href="https://www.facebook.com/squirrelpeace" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Facebook Page</a>{" "}
            and{" "}
            <a href="https://www.facebook.com/groups/squirrelpeace" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Facebook Group</a>
          </span>
        </label>
      </div>

      {/* Checkbox 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-200 p-3 rounded-md text-lg">
        <label className="flex items-start sm:items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isSubscribed} onChange={(e) => setIsSubscribed(e.target.checked)} className="w-7 h-7 md:w-5 md:h-5 accent-[#2acb35]" />
          <span>I have already subscribed to the newsletter</span>
        </label>
        {!isSubscribed && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="text-base text-gray-600">If you haven't subscribed yet, please subscribe first.</span>
            <button onClick={handleSubscribe} className="px-4 py-2 text-sm rounded bg-[#2acb35] text-white hover:bg-green-700">Subscribe</button>
          </div>
        )}
      </div>

      {/* Checkbox 3 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-gray-200 p-3 rounded-md text-lg">
        <label className="flex items-start sm:items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} className="w-7 h-7 md:w-5 md:h-5 accent-[#2acb35]" />
          <span>I agree to the quiz Terms & Conditions</span>
        </label>
        <button onClick={handleSeeTerms} className="px-4 py-2 text-sm rounded bg-gray-600 text-white hover:bg-gray-700">See Terms</button>
      </div>

      {/* Start Quiz */}
      <div className="flex justify-center mb-3">
        <button
          onClick={handleStartQuiz}
          disabled={!isButtonEnabled}
          className={`px-10 py-2 rounded-lg text-white font-medium transition text-lg ${isButtonEnabled
              ? "bg-[#2acb35] hover:bg-green-700 cursor-pointer"
              : "bg-gray-400 cursor-not-allowed"
            }`}
        >
          Start Quiz
        </button>
      </div>

      {/* Terms Drawer */}
      <TermsQuiz isDrawerOpen={isDrawerOpen} closeDrawer={handleCloseDrawer} />

    </div>
  );
};

export default QuizBoard;
