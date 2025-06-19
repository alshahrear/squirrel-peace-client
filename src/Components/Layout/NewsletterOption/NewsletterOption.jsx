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
        className="py-2 text-sm sm:text-base font-medium bg-[#98c443] text-white"
      >
        🌱 Stay in the Loop! Get Squirrel Peace tips, exclusive offers & plant updates
        delivered straight to your inbox! 💌 Subscribe now and grow with us! 🌿
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

        <div className="flex flex-col lg:flex-row items-center justify-between max-w-screen-xl mx-auto py-6 px-4 sm:px-8 gap-6 sm:gap-8 relative">

          {/* Left Text */}
          <h2 className="text-2xl sm:text-2xl lg:text-3xl font-extrabold text-white text-center lg:text-left z-10 leading-snug">
            Join our newsletter to <br className="hidden lg:block" />{" "}
            <span className="flex justify-center lg:justify-start">improve your life</span>
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

          {/* Email Input */}
          <div className="flex items-center bg-white rounded-full overflow-hidden shadow-md w-full max-w-md z-10">
            <input
              type="email"
              className="flex-grow px-4 py-2 sm:px-5 sm:py-3 text-gray-700 focus:outline-none text-sm sm:text-base"
              placeholder="Enter your email"
            />
            <button className="bg-[#2acb35] text-white text-sm sm:text-lg font-semibold px-3 py-2 sm:py-3 hover:bg-green-600 transition-all duration-300">
              <span className="flex items-center gap-2 sm:gap-3">
                Subscribe <FaPaperPlane className="text-base sm:text-xl" />
              </span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NewsletterOption;
