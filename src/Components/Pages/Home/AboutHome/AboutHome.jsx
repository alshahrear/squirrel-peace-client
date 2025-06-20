import { useEffect, useRef, useState } from "react";
import girl1 from "../../../../assets/about4.jpg";
import girl2 from "../../../../assets/about3.jpg";
import girl3 from "../../../../assets/about5.jpg";
import girl4 from "../../../../assets/about2.jpg";

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

const AboutHome = () => {
  const sectionRef = useRef(null);
  const leftRef = useRef(null);
  const [leftHeight, setLeftHeight] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const updateHeight = () => {
      if (leftRef.current) {
        setLeftHeight(leftRef.current.offsetHeight);
      }
      setIsMobile(window.innerWidth < 768);
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const gap = 16;
  const desktopImageHeight = (leftHeight - gap * 2) / 2;
  const mobileImageHeight = leftHeight / 3;

  return (
    <div className="bg-[#f5f7ec] relative">
      {/* Heading & Description */}
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

      {/* Main Section */}
      <div
        ref={sectionRef}
        className="flex flex-col md:flex-row items-center justify-between px-6 md:px-16 gap-12 pb-10"
      >
        {/* Left Side: Text */}
        <div className="flex-1 space-y-6 w-full" ref={leftRef}>
          <div className="space-y-4">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg shadow p-5 transform transition-all duration-500 hover:scale-105 group"
              >
                <h4 className="font-semibold text-gray-800 group-hover:text-green-500 text-lg transition-colors duration-500">
                  {feature.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Responsive Images */}
        <div className={`flex-1 w-full grid ${isMobile ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
          {[girl1, girl2, girl3, girl4].map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Image ${idx + 1}`}
              className="w-full object-cover rounded-lg shadow-lg"
              style={{
                height: isMobile ? mobileImageHeight : desktopImageHeight,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AboutHome;
