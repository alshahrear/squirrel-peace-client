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
        className="py-2 text-sm sm:text-base font-medium bg-[#6DD9A0] text-white"
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

        <div className="flex flex-col lg:flex-row items-center justify-between max-w-screen-xl mx-auto py-3 px-4 sm:px-8 gap-6 sm:gap-8 relative">

          {/* Left Text */}
          <h2 className="text-2xl sm:text-2xl lg:text-3xl font-extrabold text-white text-center lg:text-left z-10 leading-snug">
            Join our newsletter to <br className="hidden lg:block" />{" "}
            <span className="flex justify-center ">improve your life</span>
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
            href="https://emerald-diary.beehiiv.com/"
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
