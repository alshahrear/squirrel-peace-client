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
    <div className="flex flex-col md:flex-row h-[450px] w-full max-w-7xl mx-auto overflow-hidden shadow-2xl p-5">
      {/* Left Image Section */}
      <div className="relative rounded-lg w-full md:w-1/2 h-full overflow-hidden bg-black">
        {images.map((img, index) => (
          <AnimatePresence key={index}>
            {current === index && (
              <motion.div
                key={index}
                initial={{ scale: 1.2, opacity: 1, rotateX: -90 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                exit={{ scale: 0.9, opacity: 1, rotateX: 90 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 w-full h-full origin-top overflow-hidden "
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
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center text-center bg-[#f5f7ec] p-8">
        <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
          Join Our Newsletter
        </h2>
        <p className="text-gray-600 mb-6 px-4">
          Get inspiring stories, updates and creative ideas delivered straight to your inbox.
        </p>
        <form className="flex flex-col gap-4 w-full max-w-md">
          <input
            type="email"
            placeholder="Enter your email"
            className="border border-gray-300 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
          />
          <button
            type="submit"
            className="bg-[#2acb35] hover:bg-[#26b030] transition duration-300 text-white font-semibold py-3 rounded-lg"
          >
            Subscribe Now
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewsletterSubscribe;
