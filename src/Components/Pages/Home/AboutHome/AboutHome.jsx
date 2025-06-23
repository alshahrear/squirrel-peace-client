import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import girl1 from "../../../../assets/about4.jpg";
import girl2 from "../../../../assets/about3.jpg";
import girl3 from "../../../../assets/about5.jpg";
import { motion } from "framer-motion";

const features = [
  {
    title: "Desktop & Mobile Version",
    description:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised.",
  },
  {
    title: "Drag & Drop Builder",
    description:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised.",
  },
  {
    title: "Awesome Modern Design",
    description:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised.",
  },
  {
    title: "Super Easy to Edit",
    description:
      "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised.",
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const featureVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

const AboutHome = () => {
  const leftRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const updateSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (leftRef.current) {
        setContentHeight(leftRef.current.offsetHeight);
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const images = [
    { src: girl1, label: "About", path: "/about" },
    { src: girl2, label: "Success", path: "/success" },
    { src: girl3, label: "Newsletter", path: "/newsletter" },
  ];

  return (
    <div className="bg-[#f7f7f7] relative">
      {/* Heading */}
      <div className="text-center px-4 md:px-0 py-10 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
          <span className="text-[#2acb35] border-l-4 border-[#2acb35] pl-2">
            Features
          </span>{" "}
          you will <br />
          <span className="border-r-4 border-[#2acb35] pr-2">
            love <span className="text-[#2acb35]">&</span> enjoy
          </span>
        </h2>
        <p className="text-gray-600 mt-4">
          There are many variations of passages of Lorem Ipsum available, but
          the majority have suffered alteration in some form, by injected
          humour, or randomised words which don't look even
        </p>
      </div>

      {/* Main Content */}
      <div className="flex flex-col md:flex-row items-start justify-between px-6 md:px-16 gap-12 pb-10">
        {/* Left - Features */}
        <motion.div
          className="flex-1 space-y-6 w-full"
          ref={leftRef}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              variants={featureVariants}
              className="bg-white rounded-lg shadow p-5 transform transition-all duration-500 hover:scale-105 group cursor-default"
            >
              <h4 className="font-semibold text-gray-800 group-hover:text-green-500 text-lg transition-colors duration-500">
                {feature.title}
              </h4>
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Right - Images */}
        <div className="flex-1 w-full space-y-4">
          {/* Mobile Layout */}
          {isMobile ? (
            images.map((img, idx) => (
              <div
                key={idx}
                onClick={() => navigate(img.path)}
                className="relative overflow-hidden rounded-lg shadow-md group cursor-pointer"
              >
                <img
                  src={img.src}
                  alt={img.label}
                  className="w-full h-56 object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex justify-center items-center transition duration-300">
                  <button
                    className="text-white px-5 py-2 border border-white rounded-full text-sm md:text-base transition-all duration-300
                    group-hover:border-[#2acb35] group-hover:scale-105 hover:bg-white hover:text-[#2acb35]"
                  >
                    {img.label}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <>
              {/* Desktop Layout */}
              {/* First Image */}
              <div
                onClick={() => navigate(images[0].path)}
                className="relative overflow-hidden rounded-lg shadow-md group cursor-pointer"
                style={{ height: `${contentHeight / 2 - 8}px` }}
              >
                <img
                  src={images[0].src}
                  alt={images[0].label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/40 flex justify-center items-center transition duration-300">
                  <button
                    className="text-white px-5 py-2 border border-white rounded-full text-base transition-all duration-300
                    group-hover:border-[#2acb35] group-hover:scale-105 hover:bg-white hover:text-[#2acb35]"
                  >
                    {images[0].label}
                  </button>
                </div>
              </div>

              {/* Second row with 2 images side by side */}
              <div className="flex gap-4">
                {images.slice(1).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(img.path)}
                    className="flex-1 relative overflow-hidden rounded-lg shadow-md group cursor-pointer"
                    style={{ height: `${contentHeight / 2 - 8}px` }}
                  >
                    <img
                      src={img.src}
                      alt={img.label}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 flex justify-center items-center transition duration-300">
                      <button
                        className="text-white px-5 py-2 border border-white rounded-full text-base transition-all duration-300
                        group-hover:border-[#2acb35] group-hover:scale-105 hover:bg-white hover:text-[#2acb35]"
                      >
                        {img.label}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AboutHome;
