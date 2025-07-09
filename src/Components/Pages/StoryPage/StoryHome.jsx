import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const StoryHome = ({ storyHome }) => {
    const { _id, storyTitle, storyDate, storyCategory, storyImage, storyShortDescription } = storyHome;

    const [hovered, setHovered] = useState(false);
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    const navigate = useNavigate();

    return (
        <div
            className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={() => navigate(`/story/${_id}`)}
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
                {/* Top left - Story Date */}
                <div className="absolute top-3 left-3 text-white text-sm px-4 py-2 rounded-full z-20">
                    {storyDate}
                </div>

                {/* Top right - Category */}
                <div className="absolute top-4 right-4 text-white text-xs px-4 py-2 border border-white rounded-full z-20">
                    {storyCategory}
                </div>

                {/* Centered content */}
                <div className="flex-1 flex flex-col justify-center text-left">
                    <h2 className="text-xl font-bold mt-3 mb-2 drop-shadow-sm">{storyTitle}</h2>
                    <p
                        className="text-sm group-hover:font-medium leading-relaxed drop-shadow-sm transition-all duration-300 text-left overflow-hidden text-ellipsis"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {storyShortDescription}
                    </p>
                </div>

                {/* See More Button */}
                <div className="w-full">
                    <button
                        className="w-full px-4 mt-3 py-2 text-white border border-white rounded-md transition-all duration-300 group-hover:scale-110 group-hover:font-semibold group-hover:border-[#2acb35] bg-transparent"
                    >
                        See More
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StoryHome;
