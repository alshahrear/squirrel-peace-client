import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useNavigate } from "react-router-dom";

const BlogHomeLatest = ({ latestBlog }) => {
    const { _id, blogTitle, blogDate, blogCategory, blogImage, blogShortDescription } = latestBlog;

    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });

    const navigate = useNavigate();

    return (
        <div
            className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group cursor-pointer"
            onClick={() => navigate(`/blog/${_id}`)}
        >
            <img src={blogImage} alt="blog-img" className="w-full h-80 object-cover" />
            <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

            {/* Main content */}
            <div
                ref={ref}
                className={`absolute inset-0 flex flex-col justify-between text-white p-6 z-10 ${inView ? "animate__animated animate__zoomInUp" : ""}`}
            >
                {/* Top-left: blogDate */}
                <div className="absolute top-3 left-3 text-white text-sm px-4 py-2 rounded-full z-20">
                    {blogDate}
                </div>

                {/* Top-right: blogCategory */}
                <div className="absolute top-4 right-4 text-white text-xs px-4 py-2 border border-white rounded-full z-20">
                    {blogCategory}
                </div>

                {/* Centered content */}
                <div className="flex-1 flex flex-col justify-center text-left">
                    <h2 className="text-xl font-bold mt-3 mb-2 drop-shadow-sm">{blogTitle}</h2>
                    <p
                        className="text-sm group-hover:font-medium leading-relaxed drop-shadow-sm transition-all duration-300 text-left overflow-hidden text-ellipsis"
                        style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical',
                        }}
                    >
                        {blogShortDescription}
                    </p>
                </div>

                {/* See More button */}
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

export default BlogHomeLatest;
