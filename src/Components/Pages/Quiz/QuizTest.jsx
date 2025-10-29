// QuizTest.jsx
import { useState, useEffect } from "react";
import { FiEdit3 } from "react-icons/fi";
import Swal from "sweetalert2";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { Helmet } from "react-helmet";

const API_URL = "https://squirrel-peace-server.onrender.com/quizOtp";
const QUIZ_TEST_URL = "https://squirrel-peace-server.onrender.com/quizTest";

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const QuizTest = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    facebook: "",
    otp: "",
    answer: "",
  });

  const [quizQuestion, setQuizQuestion] = useState("Coming soon...");
  const [quizDateText, setQuizDateText] = useState(""); // ✅ Dynamic date
  const [today, setToday] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuth();
  const [isAdmin] = useAdmin();
  const [modalOtp, setModalOtp] = useState("");
  const [modalQus, setModalQus] = useState("");
  const [modalRequireImage, setModalRequireImage] = useState(false);
  const [modalDateText, setModalDateText] = useState("");
  const [modalYoutube, setModalYoutube] = useState(""); // ✅ new field
  const [isValidForSubmit, setIsValidForSubmit] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Video modal state
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [videoToPlay, setVideoToPlay] = useState("");

  const axiosPublic = useAxiosPublic();

  // === Quiz Tests for badge ===
  const { data: quizTests = [] } = useQuery({
    queryKey: ["quizTests"],
    queryFn: async () => {
      const res = await axiosPublic.get("/quizTest");
      return res.data;
    },
    refetchInterval: 5000,
  });

  // === Quiz Questions auto refresh ===
  const { data: questions = [], refetch } = useQuery({
    queryKey: ["quizQuestions"],
    queryFn: async () => {
      const res = await fetch(API_URL);
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    },
    refetchInterval: 10000,
  });

  // Set last question dynamically
  useEffect(() => {
    if (questions.length > 0) {
      const last = questions[questions.length - 1];
      setQuizQuestion(last.quizQus || "Coming soon...");
      setQuizDateText(last.quizDateText || "");
    } else {
      setQuizQuestion("Coming soon...");
      setQuizDateText("");
    }
  }, [questions]);

  // === Bangladesh তারিখ ===
  const getBDDateFormatted = () => {
    const now = new Date();
    const options = {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Dhaka",
    };
    const parts = now.toLocaleDateString("en-GB", options).split(" ");
    const weekday = parts[0].replace(",", "");
    const day = parts[1];
    const month = parts[2];
    const year = parts[3];
    return `${weekday}, ${day} ${month}, ${year}`;
  };

  useEffect(() => {
    setToday(getBDDateFormatted());
    const interval = setInterval(() => {
      setToday(getBDDateFormatted());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "otp" && value.length > 6) return;
    setFormData((s) => ({ ...s, [name]: value }));
  };

  // Image Upload
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formDataImg = new FormData();
    formDataImg.append("image", file);

    try {
      const res = await fetch(image_hosting_api, {
        method: "POST",
        body: formDataImg,
      });
      const data = await res.json();
      if (data.success) {
        setSelectedImage(data.data.url);
        Swal.fire({
          toast: true,
          icon: "success",
          title: "Image uploaded successfully!",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
      }
    } catch (err) {
      console.error("image upload error:", err);
      Swal.fire({
        toast: true,
        icon: "error",
        title: "Image upload failed",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    } finally {
      setUploading(false);
    }
  };

  // Validate form
  useEffect(() => {
    const { name, email, facebook, otp, answer } = formData;
    const lastQ = questions.length > 0 ? questions[questions.length - 1] : null;
    const otpExists = lastQ && otp === lastQ.quizOtp;

    if (otp && otp.length === 6 && !otpExists) {
      setOtpError("OTP is invalid. Please enter the correct 6-digit code.");
    } else {
      setOtpError("");
    }

    if (
      name &&
      email &&
      facebook &&
      otp &&
      answer &&
      otpExists &&
      (!lastQ?.requireImage || selectedImage)
    ) {
      setIsValidForSubmit(true);
    } else {
      setIsValidForSubmit(false);
    }
  }, [formData, questions, selectedImage]);

  // Submit Answer
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidForSubmit) return;

    try {
      const bdDate = getBDDateFormatted();

      const payload = {
        ...formData,
        date: bdDate,
        image: selectedImage || null,
      };

      await fetch(QUIZ_TEST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      Swal.fire({
        icon: "success",
        title: "Your quiz test has been submitted!",
        html: "Keep an eye on the Squirrel Peace Facebook Page. Winners will be announced and posted there.",
        confirmButtonText: "OK",
      });

      setFormData({
        name: "",
        email: "",
        facebook: "",
        otp: "",
        answer: "",
      });
      setSelectedImage(null);
    } catch (err) {
      console.error("submit error", err);
      Swal.fire({
        icon: "error",
        title: "Could not submit. Try again.",
      });
    }
  };

  // === Admin Modal Functions ===
  const openModal = () => {
    const last = questions.length > 0 ? questions[questions.length - 1] : null;
    if (last) {
      setModalOtp(last.quizOtp || "");
      setModalQus(last.quizQus || "");
      setModalRequireImage(last.requireImage || false);
      setModalDateText(last.quizDateText || "");
      setModalYoutube(last.youtubeUrl || ""); // ✅ populate youtube
    } else {
      setModalOtp("");
      setModalQus("");
      setModalRequireImage(false);
      setModalDateText("");
      setModalYoutube("");
    }
    setModalOpen(true);
  };

  // Helper: convert youtube url to embed url
  const getYouTubeEmbedUrl = (url, autoplay = false) => {
    if (!url) return "";
    try {
      const u = new URL(url);
      let videoId = "";
      if (u.hostname.includes("youtu.be")) {
        videoId = u.pathname.slice(1);
      } else if (u.searchParams.get("v")) {
        videoId = u.searchParams.get("v");
      } else {
        // maybe '/embed/...' or other forms
        const parts = u.pathname.split("/");
        videoId = parts[parts.length - 1];
      }
      if (!videoId) return "";
      return `https://www.youtube.com/embed/${videoId}?rel=0&enablejsapi=1${autoplay ? "&autoplay=1" : ""}`;
    } catch (err) {
      return "";
    }
  };

  const handleWatchDemo = () => {
    const last = questions.length > 0 ? questions[questions.length - 1] : null;
    if (last && last.youtubeUrl) {
      const embed = getYouTubeEmbedUrl(last.youtubeUrl, true);
      if (!embed) {
        Swal.fire({
          toast: true,
          icon: "error",
          title: "Invalid YouTube URL",
          position: "top-end",
          showConfirmButton: false,
          timer: 2000,
        });
        return;
      }
      setVideoToPlay(embed);
      setVideoModalOpen(true);
    } else {
      Swal.fire({
        toast: true,
        icon: "info",
        title: "No demo video available",
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  const handleUpdate = async () => {
    if (modalOtp.length !== 6) {
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "OTP must be exactly 6 digits.",
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    const last = questions.length > 0 ? questions[questions.length - 1] : null;

    try {
      if (last) {
        await fetch(`${API_URL}/${last._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizOtp: modalOtp,
            quizQus: modalQus,
            requireImage: modalRequireImage,
            quizDateText: modalDateText,
            youtubeUrl: modalYoutube || "", // ✅ include youtubeUrl
          }),
        });
      } else {
        await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quizOtp: modalOtp,
            quizQus: modalQus,
            requireImage: modalRequireImage,
            quizDateText: modalDateText,
            youtubeUrl: modalYoutube || "", // ✅ new create field
          }),
        });
      }

      await refetch(); // ✅ Refresh UI instantly
      setQuizDateText(modalDateText); // ✅ Instant reflect
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Quiz updated successfully.",
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err) {
      console.error("update error", err);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "error",
        title: "Could not update. Try again.",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const handleDelete = async () => {
    const last = questions.length > 0 ? questions[questions.length - 1] : null;
    if (!last) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the saved question and OTP.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });
    if (!confirm.isConfirmed) return;

    try {
      await fetch(`${API_URL}/${last._id}`, { method: "DELETE" });
      await refetch();
      setQuizQuestion("Coming soon...");
      setQuizDateText("");
      Swal.fire({
        toast: true,
        icon: "success",
        title: "Question deleted.",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    } catch (err) {
      Swal.fire({
        toast: true,
        icon: "error",
        title: "Could not delete. Try again.",
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
    }
  };

  const isInputDisabled = questions.length === 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Helmet>
        <title>Quiz Test - Squirrel Peace</title>
      </Helmet>

      {/* Title + Admin */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
          Welcome to the Quiz Test
        </h1>
        <p className="text-gray-600 mb-5">
          Please make sure to fill in all fields correctly before submitting
          your answers. Test your knowledge, challenge yourself, and enjoy the
          quiz.
        </p>
        <div className="flex justify-around items-center">

          {isAdmin && (
            <button
              onClick={openModal}
              className="px-5 py-2 bg-[#2acb35] text-white rounded-md font-semibold hover:bg-green-700"
            >
              <FiEdit3 className="inline-block mr-1" /> Manage Quiz
            </button>
          )}

          {isAdmin && (
            <NavLink to="/quizTestAdmin" className="inline-block">
              <div className="indicator">
                <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                  {quizTests.length}
                </span>
                <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                  <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                    Quiz Admin
                  </span>
                  <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                </button>
              </div>
            </NavLink>
          )}

        </div>
      </div>

      {/* Question Box */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border border-gray-300 relative">
        <div className="absolute top-4 right-4 italic text-gray-600 text-base">
          {today}
        </div>
        <h2 className="text-lg mt-4 text-[#2acb35] font-semibold">
          Quiz Question:
        </h2>
        <p className="text-gray-700 mt-2 font-semibold">{quizQuestion}</p>
      </div>

      {/* Answer Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Your Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              disabled={isInputDisabled}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Your Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              disabled={isInputDisabled}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Your Facebook URL</label>
            <input
              name="facebook"
              type="url"
              value={formData.facebook}
              onChange={handleChange}
              placeholder="Enter your Facebook link"
              disabled={isInputDisabled}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">
              Newsletter OTP {quizDateText && `(${quizDateText})`}
            </label>
            <input
              name="otp"
              value={formData.otp}
              onChange={handleChange}
              placeholder="Enter 6-digit OTP"
              disabled={isInputDisabled}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            {otpError && <p className="text-red-600 text-sm mt-1">{otpError}</p>}
          </div>
        </div>

        {/* Conditional Image */}
        {questions.length > 0 &&
          questions[questions.length - 1]?.requireImage && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <label className="block font-medium">
                  Upload Image (Required)
                </label>
                <button
                  type="button"
                  onClick={handleWatchDemo}
                  className="text-sm px-3 py-2 bg-[#2acb35] text-white rounded-md transition-colors"
                >
                  Watch Demo
                </button>
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading || isInputDisabled}
                required
                className="file-input file-input-ghost border border-gray-300"
              />

              {selectedImage && (
                <div className="mt-2">
                  <img
                    src={selectedImage}
                    alt="Preview"
                    className="w-40 rounded border"
                  />
                </div>
              )}
            </div>
          )}

        <div>
          <label className="block font-medium mb-1">Quiz Answer</label>
          <textarea
            name="answer"
            rows="8"
            value={formData.answer}
            onChange={handleChange}
            placeholder="Write your answer here..."
            disabled={isInputDisabled}
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={!isValidForSubmit}
          className={`w-full font-semibold py-2 rounded-lg transition ${isValidForSubmit
            ? "bg-[#2acb35] text-white hover:bg-green-700"
            : "bg-gray-400 text-gray-200 cursor-not-allowed"
            }`}
        >
          Submit Answer
        </button>
      </form>

      {/* === Modal === */}
      {modalOpen && (
        <div className="fixed inset-0 flex items-start justify-center z-50 pt-20">
          <div className="absolute inset-0 bg-gray-200 opacity-70"></div>
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-lg relative z-10 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-3">
              Manage Quiz (Update / Delete)
            </h3>

            <div className="mb-3">
              <label className="block font-medium mb-1">6-digit OTP</label>
              <input
                value={modalOtp}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, "");
                  if (v.length <= 6) setModalOtp(v);
                }}
                placeholder="Enter 6-digit OTP"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            <div className="mb-3">
              <label className="block font-medium mb-1">Quiz Question</label>
              <textarea
                value={modalQus}
                onChange={(e) => setModalQus(e.target.value)}
                rows={4}
                placeholder="Enter quiz question..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 resize-none"
              />
            </div>

            {/* ✅ Date Text Field */}
            <div className="mb-3">
              <label className="block font-medium mb-1">
                Date Text (Friday, 7 December)
              </label>
              <input
                value={modalDateText}
                required
                onChange={(e) => setModalDateText(e.target.value)}
                placeholder="Enter date text for label"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {/* ✅ YouTube URL Field */}
            <div className="mb-3">
              <label className="block font-medium mb-1">
                YouTube Video URL (optional)
              </label>
              <input
                value={modalYoutube}
                onChange={(e) => setModalYoutube(e.target.value)}
                placeholder="Paste YouTube URL (e.g. https://youtu.be/...)"
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>

            {/* Toggle */}
            <div className="mb-4 flex items-center gap-3">
              <label className="font-medium">Require Image?</label>
              <input
                type="checkbox"
                checked={modalRequireImage}
                onChange={(e) => setModalRequireImage(e.target.checked)}
                className="toggle toggle-success"
              />
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                <button
                  onClick={handleUpdate}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Update
                </button>
              </div>
            </div>

            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* === Video Modal === */}
      {videoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => {
              setVideoModalOpen(false);
              setVideoToPlay("");
            }}
          ></div>

          {/* modal container */}
          <div className="relative w-full max-w-md mx-auto h-[80vh]">
            <div className="bg-white rounded-lg overflow-hidden flex flex-col h-full">

              {/* video area */}
              <div className="relative flex-1">
                {videoToPlay ? (
                  <iframe
                    title="Demo Video"
                    src={videoToPlay}
                    className="absolute inset-0 w-full h-full object-cover"
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="p-6 text-center">Invalid video</div>
                )}
              </div>

              {/* footer */}
              <div className="p-3 flex justify-end">
                <button
                  onClick={() => {
                    setVideoModalOpen(false);
                    setVideoToPlay("");
                  }}
                  className="bg-[#2acb35] text-white px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default QuizTest;
