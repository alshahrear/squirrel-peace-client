import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import about6 from "../../../assets/about6.jpg";

const StoryPicSingleCard = () => {
  const [hovered, setHovered] = useState(false);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <div className="pb-10">
        <h2 className="text-center text-2xl font-bold">
          Our <span className="text-[#2acb35]">Story</span>
        </h2>
        <p className="text-center mt-2">
          Our personal trainers can help you meet your fitness goals. They can become your <br />
          teacher, your motivator, your coach and your friend.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Image */}
          <img
            src={about6}
            alt="about-img"
            className="w-full h-80 object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

          {/* Content */}
          <div
            ref={ref}
            className={`absolute inset-0 flex flex-col justify-center text-white p-6 z-10 ${
              inView ? "animate__animated animate__zoomInUp" : ""
            }`}
          >
            <h2 className="text-xl font-bold mb-2 drop-shadow-sm">Motivation</h2>
            <p className="text-sm mb-4 leading-relaxed drop-shadow-sm">
              Motivation lights the fire, but it's commitment and habits that keep it burning. Let your purpose guide your every move.
            </p>
            <button
              className={`self-start px-4 py-2 bg-[#2acb35] text-white rounded-md transition-all duration-300 ${
                hovered
                  ? "animate__animated animate__heartBeat animate__infinite"
                  : ""
              }`}
            >
              See More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoryPicSingleCard;
