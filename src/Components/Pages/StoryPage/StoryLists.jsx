import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { LuMessageCircleMore } from 'react-icons/lu';
import { FcLike } from 'react-icons/fc';

const StoryLists = ({ storyBlog }) => {
    const { _id, storyTitle, storyCategory, storyImage, storyDescription } = storyBlog;

    const [hovered, setHovered] = useState(false);
    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    const navigate = useNavigate();

    return (
        <div
            className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group cursor-pointer"
            onClick={() => navigate(`/story/${_id}`)}
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
                className={`absolute inset-0 flex flex-col justify-center text-white p-6 z-10 ${inView ? "animate__animated animate__zoomInUp" : ""}`}
            >
                <h2 className="text-xl font-bold mb-2 drop-shadow-sm ">{storyTitle}</h2>
                <p className="text-sm group-hover:font-medium mb-4 leading-relaxed drop-shadow-sm transition-all duration-300">
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit. Magnam, voluptas obcaecati. Necessitatibus quidem consequatur molestias.
                </p>
                <button
                    className={`btn self-start px-4 py-2 text-white rounded-md transition-all duration-300 hover:scale-110 hover:font-semibold hover:border-[#2acb35]
                    ${hovered ? "bg-transparent border-white animate__animated animate__heartBeat animate" : "bg-[#2acb35] border-0"}`}
                >
                    See More
                </button>

                <div className='absolute bottom-6 left-0 w-full px-4 flex items-center justify-between z-20'>
                    <div className="flex items-center gap-3">
                        <p className="flex items-center gap-1">
                            <LuMessageCircleMore className="text-[#2acb35]" />
                            <span className="beat-on-hover font-semibold">6</span>
                        </p>
                        <p className="flex items-center gap-1">
                            <FcLike />
                            <span className="beat-on-hover font-semibold">10</span>
                        </p>
                    </div>
                    <div className="text-white text-xs px-4 py-2 border border-white rounded-full">
                        {storyCategory}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StoryLists;
