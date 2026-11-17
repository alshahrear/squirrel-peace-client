// src/components/ScrollToTopButton.jsx
import React, { useEffect, useState } from "react";
import { IoIosArrowUp } from "react-icons/io";

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
    (
      <button
        onClick={scrollToTop}
        tabIndex={isVisible ? 0 : -1}
        aria-hidden={!isVisible}
        className={`fixed z-40 right-4 sm:right-6 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] w-11 h-11 p-0 flex items-center justify-center rounded-full bg-brand-600 text-white shadow-lg transition-all duration-200 ease-out motion-reduce:transition-none hover:-translate-y-0.5 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:ring-offset-2 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
          }`}
        aria-label="Scroll to top"
      >
        <div className="flex items-center justify-center">
          <IoIosArrowUp className="w-5 h-5" />
        </div>
      </button>
    )
  );
};

export default ScrollToTopButton;
