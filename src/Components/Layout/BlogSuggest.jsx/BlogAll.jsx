import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import life1 from "../../../assets/adventureDiary.jpg";
import travel1 from "../../../assets/dailyNotes.jpg";
import health1 from "../../../assets/smartResource.jpg";
import story from "../../../assets/story.jpg";
import Loader from "../../../Components/Loader";

const blogs = [
    {
        id: 1,
        category: "Adventure Diary",
        title: "Explore the world's most thrilling destinations through story-style blogs. Learn, discover, and get inspired!",
        image: life1,
        route: "/adventureDiary",
    },
    {
        id: 2,
        category: "Daily Notes",
        title: "Simple yet powerful insights to make your life happier, better, and more meaningful every day.",
        image: travel1,
        route: "/dailyNotes",
    },
    {
        id: 3,
        category: "Smart Resource",
        title: "Discover helpful topics that can improve your lifestyle and give you a smarter, better outlook on life.",
        image: health1,
        route: "/smartResource",
    },
    {
        id: 4,
        category: "Story",
        title: "Fictional yet meaningful stories packed with life lessons. Read, reflect, and grow.",
        image: story,
        route: "/story",
    },
];

const BlogAll = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const pageRoutes = ["/adventureDiary", "/dailyNotes", "/smartResource", "/story"];
    const currentPath = location.pathname;

    const filteredBlogs = pageRoutes.includes(currentPath)
        ? blogs.filter(blog => blog.route !== currentPath)
        : blogs;

    const gridCols =
        filteredBlogs.length === 3
            ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

    return (
        <div className="bg-[#f7f7f7]">
            <div className="py-10 max-w-screen-xl mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="text-2xl md:text-3xl font-semibold mb-4">
                        Explore All Blog Categories
                    </h2>
                    <p className="text-gray-700 max-w-5xl mx-auto">
                        Discover a world of unique stories and real-life insights. Our blogs cover beautiful topics that inspire, inform, and make you feel connected. Explore your favorite category and dive into stories that share life's meaningful moments in a way you'll truly enjoy.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader />
                    </div>
                ) : (
                    <div className={`grid ${gridCols} gap-6`}>
                        {filteredBlogs.map(blog => (
                            <div
                                key={blog.id}
                                onClick={() => navigate(blog.route)}
                                className="relative overflow-hidden rounded-lg shadow-md h-[250px] sm:h-[280px] md:h-[300px] group cursor-pointer transform transition duration-300 hover:scale-105"
                            >
                                <img
                                    src={blog.image}
                                    alt={blog.title}
                                    className="w-full h-full object-cover transition-transform duration-300"
                                />

                                {/* Overlay Layer */}
                                <div className="absolute inset-0 bg-black/30 flex flex-col justify-between p-3 sm:p-4">
                                    {/* Category in Center */}
                                    <div className="flex justify-center items-center flex-1">
                                        <span className="text-white px-3 sm:px-5 py-1 border border-white rounded-full">
                                            {blog.category}
                                        </span>
                                    </div>
                                    {/* Title at Bottom */}
                                    <h3 className="text-white font-medium text-center ">
                                        {blog.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BlogAll;
