import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import life1 from "../../../assets/life1.jpg";
import travel1 from "../../../assets/travel1.jpg";
import health1 from "../../../assets/health1.jpg";
import story from "../../../assets/story2.jpg";
import Loader from "../../../Components/Loader"; // ⬅️ Make sure path is correct

const blogs = [
    {
        id: 1,
        category: "Life Style",
        title: "Best Waterfalls In Ireland | 7 Best Waterfalls To Visit In Ireland",
        image: life1,
        route: "/lifeStyle",
    },
    {
        id: 2,
        category: "Travel",
        title: "Best Pizza In Dublin | We Tried Everything So You Don’t Have To",
        image: travel1,
        route: "/travel",
    },
    {
        id: 3,
        category: "Health",
        title: "Best Golf Courses In Ireland | Top Irish Golf Courses | Our Top Picks",
        image: health1,
        route: "/health",
    },
    {
        id: 4,
        category: "Story",
        title: "Best Golf Courses In Ireland | Top Irish Golf Courses | Our Top Picks",
        image: story,
        route: "/story",
    },
];

const BlogAll = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate loading time (e.g. API fetch)
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000); // 1 second delay

        return () => clearTimeout(timer);
    }, []);

    const pageRoutes = ["/lifeStyle", "/travel", "/health", "/story"];
    const currentPath = location.pathname;

    const filteredBlogs = pageRoutes.includes(currentPath)
        ? blogs.filter(blog => blog.route !== currentPath)
        : blogs;

    const gridCols =
        filteredBlogs.length === 3
            ? "grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

    return (
        <div className="bg-[#f7f7f7]">
            <div className="py-10 max-w-screen-xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold mb-4">Read my Experience Blog</h2>
                    <p className="text-gray-600 max-w-2xl mx-auto">
                        I try to update the blog as frequently as I can. I also update my Instagram regularly if that’s your thing.
                    </p>
                </div>

                {
                    loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader />
                        </div>
                    ) : (
                        <div className={`grid ${gridCols} gap-6`}>
                            {filteredBlogs.map(blog => (
                                <div
                                    key={blog.id}
                                    onClick={() => navigate(blog.route)}
                                    className="relative overflow-hidden rounded-lg shadow-md h-[300px] group cursor-pointer transform transition duration-300 hover:scale-105"
                                >
                                    <img
                                        src={blog.image}
                                        alt={blog.title}
                                        className="w-full h-full object-cover transition-transform duration-300"
                                    />

                                    {/* Overlay Layer */}
                                    <div className="absolute inset-0 bg-black/40 flex flex-col justify-between p-4">
                                        {/* Category in Center */}
                                        <div className="flex justify-center items-center flex-1">
                                            <span className="text-white text-lg px-5 py-1 border border-white rounded-full">
                                                {blog.category}
                                            </span>
                                        </div>
                                        {/* Title at Bottom */}
                                        <h3 className="text-white font-semibold text-center text-sm sm:text-base md:text-lg">
                                            {blog.title}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                }
            </div>
        </div>
    );
};

export default BlogAll;
