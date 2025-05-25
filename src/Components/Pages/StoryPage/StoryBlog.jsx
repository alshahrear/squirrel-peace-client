// StoryBlog.jsx
import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import about6 from "../../../assets/about5.jpg";

const StoryBlog = ({ storyBlog }) => {
    const { storyTitle, storyCategory, storyImage, storyDescription } = storyBlog;

    const [hovered, setHovered] = useState(false);
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    return (
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
                className={`absolute inset-0 flex flex-col justify-center text-white p-6 z-10 ${inView ? "animate__animated animate__zoomInUp" : ""
                    }`}
            >
                <h2 className="text-xl font-bold mb-2 drop-shadow-sm">Motivation</h2>
                <p className="text-sm mb-4 leading-relaxed drop-shadow-sm">
                    Motivation lights the fire, but it's commitment and habits that keep it burning. Let your purpose guide your every move.
                </p>
                <button
                    className={`self-start px-4 py-2 bg-[#2acb35] text-white rounded-md transition-all duration-300 ${hovered ? "animate__animated animate__heartBeat animate__infinite" : ""
                        }`}
                >
                    See More
                </button>
            </div>

            {/* Category Bottom Right */}
            <div className="absolute bottom-3 right-3 text-white text-xs px-4 py-1 z-20 border-1 rounded-full ">
                {storyCategory}
            </div>
        </div>
    );
};

export default StoryBlog;
