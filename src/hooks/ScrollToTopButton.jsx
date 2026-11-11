// src/components/ScrollToTopButton.jsx
import React, { useEffect, useState } from "react";
import { IoIosArrowDropupCircle } from "react-icons/io";

const ScrollToTopButton = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    isVisible && (
      <button
        onClick={scrollToTop}
        className="fixed bottom-11 right-1 z-50 text-[#2acb35] hover:text-[#2acb35] transition-all duration-300"
        aria-label="Scroll to top"
      >
        <div className="p-1 border-2 border-[#2acb35] bg-white rounded hover:scale-110">
            <IoIosArrowDropupCircle className="w-6 h-6 text-[#2acb35] " />
        </div>
      </button>
    )
  );
};

export default ScrollToTopButton;
