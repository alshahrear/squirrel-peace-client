import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import about2 from "../../../assets/about2.jpg";
import about3 from "../../../assets/about3.jpg";
import about4 from "../../../assets/about4.jpg";
import about5 from "../../../assets/about5.jpg";
import about6 from "../../../assets/about6.jpg";
import about0 from "../../../assets/blogcat2.jpg";

const imageData = [
  {
    src: about0,
    title: "Strong Mindset",
    desc: "A strong mindset is the foundation of every success. Stay consistent, disciplined, and embrace challenges. Your mind leads, your body follows.",
  },
  {
    src: about2,
    title: "Fit Lifestyle",
    desc: "Fitness is not just about working out. It's about living a lifestyle filled with energy, health, and strength—both mental and physical.",
  },
  {
    src: about3,
    title: "Personal Trainer",
    desc: "A personal trainer helps unlock your potential, pushing you to achieve more than you ever thought possible with expert support.",
  },
  {
    src: about4,
    title: "Healthy Routine",
    desc: "Consistency is key. A healthy routine fuels your day, boosts your mood, and gives your body what it needs to thrive every day.",
  },
  {
    src: about5,
    title: "Body Transformation",
    desc: "Change doesn’t come overnight, but with patience and perseverance, your body will show the results of your hard work and dedication.",
  },
  {
    src: about6,
    title: "Motivation",
    desc: "Motivation lights the fire, but it's commitment and habits that keep it burning. Let your purpose guide your every move.",
  },
];

const StoryPic = () => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="max-w-screen-xl mx-auto px-4">
      <div className="pb-10">
        <h2 className="text-center text-2xl font-bold">
          Our <span className="text-[#2acb35]">Story Property</span>
        </h2>
        <p className="text-center mt-2">
          Our personal trainers can help you meet your fitness goals. They can become your <br />
          teacher, your motivator, your coach and your friend.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {imageData.map((item, index) => {
          const { ref, inView } = useInView({
            triggerOnce: true,
            threshold: 0.2,
          });

          return (
            <div
              key={index}
              className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Image */}
              <img
                src={item.src}
                alt={`about-img-${index}`}
                className="w-full h-80 object-cover"
              />

              {/* Light overlay */}
              <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

              {/* Content */}
              <div
                ref={ref}
                className={`absolute inset-0 flex flex-col justify-center text-white p-6 z-10 ${
                  inView ? "animate__animated animate__zoomInUp" : ""
                }`}
              >
                <h2 className="text-xl font-bold mb-2 drop-shadow-sm">{item.title}</h2>
                <p className="text-sm mb-4 leading-relaxed drop-shadow-sm">{item.desc}</p>
                <button
                  className={`self-start px-4 py-2 bg-[#2acb35] text-white rounded-md transition-all duration-300 ${
                    hoveredIndex === index
                      ? "animate__animated animate__heartBeat animate__infinite"
                      : ""
                  }`}
                >
                  See More
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StoryPic;
