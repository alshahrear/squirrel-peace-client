import { HiArrowLongRight } from "react-icons/hi2";
import { FaPaperPlane } from "react-icons/fa6";
import Marquee from "react-fast-marquee";

const NewsletterOption = () => {
  const arrowAnimationStyle = {
    animation: "slideArrow 2s linear infinite",
  };

  return (
    <div>
      <Marquee
        speed={50}
        gradient={false}
        className="py-2 font-medium bg-[#60D07E] text-white"
      >
        📧 Subscribe now to receive weekly emails filled with inspiring stories, peaceful thoughts, and practical tips to help you live a happier, calmer life. 📬
      </Marquee>

      <div className="bg-[#2acb35]">
        <style>
          {`
          @keyframes slideArrow {
            0% {
              transform: translateX(-100%);
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              transform: translateX(100%);
              opacity: 0;
            }
          }
        `}
        </style>

        <div className="flex flex-col lg:flex-row items-center justify-between mx-auto py-3 px-4 sm:px-8 gap-6 sm:gap-8 relative">

          {/* Left Text */}
          <h2 className="text-2xl font-extrabold text-white text-center z-10 leading-snug max-w-4xl mx-auto">
            Join our newsletter to make your life a little better, one email at a time and it's 100% free to subscribe!
          </h2>
          {/* Animated Arrow for Laptop only */}
          <div className="hidden lg:flex flex-col items-center relative">
            <div className="w-24 h-10 overflow-hidden relative">
              <div className="absolute left-0 text-white text-4xl" style={arrowAnimationStyle}>
                <HiArrowLongRight />
              </div>
            </div>
            <p className="text-white text-sm tracking-[0.3em] mt-2">SUBSCRIBE</p>
          </div>

          {/* Subscribe Button Only */}
          <a
            href=""
            target="_blank"
            rel="noopener noreferrer"
            className="z-10"
          >
            <button className=" bg-white text-[#2acb35] text-sm sm:text-lg font-semibold px-6 py-3 sm:px-8 sm:py-3 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-md">
              <span className="flex items-center gap-2 sm:gap-3">
                Subscribe <FaPaperPlane className="text-base sm:text-xl" />
              </span>
            </button>
          </a>
        </div>
      </div>
    </div>
  );
};

export default NewsletterOption;
