import { GiLoveLetter } from "react-icons/gi";
import { MdEmail } from "react-icons/md";
import { motion } from "framer-motion";

const cardVariants = {
  offscreen: {
    y: 100,
    opacity: 0,
    rotateX: 45,
  },
  onscreen: {
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: "spring",
      stiffness: 70,
      damping: 12,
      mass: 0.8,
    },
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

const NewsAndLetter = () => {
  return (
    <div className="absolute left-1/2 transform -translate-x-1/2 top-[-70px] z-10">
      <div className="flex gap-[32rem]">
        {/* First Card */}
        <motion.div
          className="relative flex flex-col items-center"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.8 }}
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.div className="bg-[#ff9a62] text-white p-6 rounded-2xl w-72 h-36 flex flex-col justify-center items-center text-center shadow-md">
            <p>Subscribe weekly NewsLetter 100% free</p>
            <button className="flex items-center gap-2 bg-[#f7f7f7] text-black mt-3 px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform">
              Subscribe
              <MdEmail className="text-2xl" />
            </button>
          </motion.div>
        </motion.div>

        {/* Second Card */}
        <motion.div
          className="relative flex flex-col items-center"
          initial="offscreen"
          whileInView="onscreen"
          viewport={{ once: true, amount: 0.8 }}
          variants={cardVariants}
          whileHover="hover"
        >
          <motion.div className="bg-[#2acb35] text-white p-6 rounded-2xl w-72 h-36 flex flex-col justify-center items-center text-center shadow-md">
            <p>Get a weekly Letter in your home for your children</p>
            <button className="flex items-center gap-2 bg-[#f7f7f7] text-black mt-3 px-4 py-2 rounded-lg shadow-lg hover:scale-105 transition-transform">
              Get letter
              <GiLoveLetter className="text-2xl" />
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default NewsAndLetter;
