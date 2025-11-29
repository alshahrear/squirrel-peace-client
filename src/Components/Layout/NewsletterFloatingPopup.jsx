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
            className="relative rounded-lg border border-[#2acb35] p-6 w-full max-w-[350px] h-[420px] md:max-w-[450px] md:h-[450px] shadow-xl text-center animate__animated animate__zoomIn flex flex-col justify-center items-center bg-cover bg-center"
            style={{
              backgroundImage: `url(${Newsletter})`,
            }}
          >
            {/* 🔲 Dark Overlay */}
            <div className="absolute inset-0 bg-black/30 rounded-lg z-0"></div>

            {/* ✖️ Close Button */}
            <button
              className="absolute top-2 right-3 text-white font-bold text-2xl z-10"
              onClick={handleClose}
            >
              ✕
            </button>

            {/* 🔲 Content on top of image */}
            <div className="relative z-10 mt-6 text-white">
              <h3 className="text-xl md:text-2xl font-semibold drop-shadow-md">
               1000+ People Have Joined Us 😊
              </h3>
              <p className="text-xl font-medium my-3">Please subscribe our newsletter <br /> for <span className="font-semibold">100%</span> free</p>
              <a
                href="https://sphealth.beehiiv.com/"
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
