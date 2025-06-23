import { BiSolidRightArrow } from "react-icons/bi";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const NewsletterPoint = () => {
  const points = [
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi veritatis itaque",
    "Lorem ipsum dolor sit amet consecte adipisicing elit. Modi veritatis itaque",
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi veritatis itaque",
  ];

  // Scroll detection wrapper
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return (
    <div className="px-4 md:px-0">
      <p className="pb-7 text-xl md:text-2xl font-bold text-center">
        Most played songs this week
      </p>

      {/* Animated list wrapper */}
      <motion.ul
        ref={ref}
        className="space-y-4"
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
        variants={{
          visible: {
            transition: {
              staggerChildren: 0.3,
            },
          },
        }}
      >
        {points.map((text, index) => (
          <motion.li
            key={index}
            className="border border-gray-200 p-4 rounded-md hover:border-[#2acb35] transition-all bg-white shadow"
            variants={{
              hidden: { opacity: 0, y: 50 },
              visible: {
                opacity: 1,
                y: 0,
                transition: {
                  duration: 0.6,
                  ease: "easeOut",
                },
              },
            }}
          >
            <p className="flex items-start text-base md:text-lg font-medium gap-2">
              <BiSolidRightArrow className="text-[#2acb35] text-xl mt-[3px]" />
              {text}
            </p>
          </motion.li>
        ))}
      </motion.ul>
    </div>
  );
};

export default NewsletterPoint;
