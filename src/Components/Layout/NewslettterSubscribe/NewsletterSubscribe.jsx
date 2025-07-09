import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import newscover from "../../../assets/newscover.jpg";
import newsletter from "../../../assets/newsletter.jpg";
import testimonial from "../../../assets/Testimonialshome.jpg";

const images = [newscover, newsletter, testimonial];

const NewsletterSubscribe = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col md:flex-row w-full max-w-7xl mx-auto overflow-hidden px-4 md:px-0 rounded-2xl">
      {/* Left Image Section */}
      <div className="relative w-full md:w-1/2 h-[250px] md:h-[450px] overflow-hidden bg-black shadow-lg rounded-t-2xl md:rounded-t-none md:rounded-l-2xl">
        {images.map((img, index) => (
          <AnimatePresence key={index}>
            {current === index && (
              <motion.div
                key={index}
                initial={{ scale: 1.2, opacity: 1, rotateX: -90 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                exit={{ scale: 0.9, opacity: 1, rotateX: 90 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 w-full h-full origin-top overflow-hidden"
              >
                <img
                  src={img}
                  alt={`Slide ${index}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>

      {/* Right Content Section */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center text-center bg-white px-6 py-6 md:px-8 md:py-8 rounded-b-2xl md:rounded-b-none md:rounded-r-2xl">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 mb-3 md:mb-4 px-2 md:px-0">
          Join Our Newsletter
        </h2>
        <p className="text-gray-600 mb-5 px-4 md:px-0">
          Once a week, Squirrel Peace sends thoughtful, helpful content about freelancing, focus, and finding balance in your creative work.
        </p>
        <a
          href="https://emerald-diary.beehiiv.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full max-w-md px-2 md:px-0"
        >
          <button
            type="button"
            className="w-full bg-[#2acb35] hover:bg-[#26b030] transition duration-300 text-white font-semibold py-3 rounded-lg"
          >
            Subscribe Now
          </button>
        </a>
      </div>
    </div>
  );
};

export default NewsletterSubscribe;
