import { useEffect, useState } from "react";
import { FiMail } from "react-icons/fi";
import "animate.css";
import { useLocation } from "react-router-dom";
import Newsletter from "../../assets/newsletterPop.jpg";

const NewsletterFloatingPopup = () => {
  const [showForm, setShowForm] = useState(false);
  const location = useLocation();

  // ✅ Cookie helper functions
  const setCookie = (name, value, days) => {
    const expires = new Date(Date.now() + days * 86400000).toUTCString();
    document.cookie = `${name}=${value}; expires=${expires}; path=/`;
  };

  const getCookie = (name) => {
    return document.cookie.split("; ").find((row) => row.startsWith(name + "="))?.split("=")[1];
  };

  // ✅ Newsletter পেজে গেলে এবং cookie না থাকলে popup দেখানো
  useEffect(() => {
    if (location.pathname === "/newsletter" && !getCookie("hideNewsletter")) {
      setShowForm(true);
    }
  }, [location.pathname]);

  const handleClose = () => {
    setShowForm(false);
    setCookie("hideNewsletter", "true", 1);
  };

  return (
    <>
      {/* 🔘 Floating Mail Button - সব পেজে দেখা যাবে */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-10 left-4 z-50 bg-[#2acb35] hover:bg-[#75DCAA] text-white w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 hover:scale-110"
        title="Subscribe Newsletter"
      >
        <FiMail className="text-xl" />
      </button>

      {/* 🟢 Popup Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
          <div
            className="relative rounded-lg border border-[#2acb35] p-6 w-full max-w-[350px] h-[420px] md:max-w-[450px] md:h-[450px] shadow-xl text-center animate__animated animate__zoomIn flex flex-col justify-center items-center bg-cover bg-center "
            style={{
              backgroundImage: `url(${Newsletter})`,
            }}
          >
            {/* ✖️ Close Button */}
            <button
              className="absolute top-2 right-3 text-white font-bold text-2xl"
              onClick={handleClose}
            >
              ✕
            </button>

            {/* 🔲 Content on top of image */}
            <div className="relative z-10 mt-6">
              <h3 className="text-lg md:text-xl text-white font-bold mb-4 drop-shadow-md">
                Subscribe our newsletter <br />
                <span className="text-[#B6F5C0]">for 100% free</span>
              </h3>

              <a
                href="https://emerald-diary.beehiiv.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full"
              >
                <button
                  className="w-full bg-[#2acb35] text-white py-2 rounded text-sm font-semibold transition-transform duration-300 hover:scale-105"
                >
                  Subscribe
                </button>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NewsletterFloatingPopup;
