import { useState } from "react";
import { FiMail } from "react-icons/fi";
import Swal from "sweetalert2";
import "animate.css";

const NewsletterFloatingPopup = () => {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    Swal.fire({
      icon: "success",
      title: "Subscribed!",
      text: "Thank you for subscribing to our newsletter.",
      timer: 2000,
      showConfirmButton: false,
    });

    setEmail("");
    setShowForm(false);
  };

  return (
    <>
      {/* 🔘 Floating Button (Bottom Left) */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-10 left-4 z-50 bg-[#2acb35] hover:bg-[#219c2a] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110"
        title="Subscribe Newsletter"
      >
        <FiMail className="text-xl" />
      </button>

      {/* 🟢 Full Screen Overlay Popup */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg border border-[#2acb35] p-6 w-80 md:w-96 shadow-xl text-center relative animate__animated animate__zoomIn">
            <button
              className="absolute top-2 right-3 text-gray-500 font-semibold text-xl"
              onClick={() => setShowForm(false)}
            >
              ✕
            </button>

            <h3 className="text-lg md:text-xl text-gray-800 font-semibold mb-4">
              Subscribe our newsletter <br />
              <span className="text-[#2acb35]">for 100% free</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email"
                required
                placeholder="Enter your email"
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#2acb35] text-sm"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-[#2acb35] text-white py-2 rounded text-sm font-semibold transition-transform duration-300 hover:scale-105"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsletterFloatingPopup;
