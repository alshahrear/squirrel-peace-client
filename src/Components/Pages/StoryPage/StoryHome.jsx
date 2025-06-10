import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import { LuMessageCircleMore } from 'react-icons/lu';
import { FcLike } from 'react-icons/fc';

const StoryHome = ({ storyHome }) => {
    const { storyTitle, storyCategory, storyImage, storyDescription } = storyHome;

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
            <img
                src={storyImage}
                alt="story-img"
                className="w-full h-80 object-cover"
            />

            <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

            <div
                ref={ref}
                className={`absolute inset-0 flex flex-col justify-between text-white p-6 z-10 ${inView ? "animate__animated animate__zoomInUp" : ""}`}
            >
                {/* Top right category */}
                <div className="absolute top-4 right-4 text-white text-xs px-4 py-2 border border-white rounded-full z-20">
                    {storyCategory}
                </div>

                {/* Centered content with left alignment */}
                <div className="flex-1 flex flex-col justify-center text-left">
                    <h2 className="text-xl font-bold mb-2 drop-shadow-sm">{storyTitle}</h2>
                    <p className="text-sm group-hover:font-medium mb-4 leading-relaxed drop-shadow-sm transition-all duration-300">
                        {storyDescription}
                    </p>
                </div>

                {/* See More Button at bottom */}
                <button
                    className="w-full px-4 mt-3 py-2 text-white border border-white rounded-md transition-all duration-300 hover:scale-110 hover:font-semibold hover:border-[#2acb35] bg-transparent"
                >
                    See More
                </button>
            </div>

        </div>
    );
};

export default StoryHome;
