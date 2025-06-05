import { useNavigate } from "react-router-dom";
import blog1 from "../../../../assets/blogcat1 (1).jpg";
import blog2 from "../../../../assets/blogcat2.jpg";
import blog3 from "../../../../assets/blogcat3.jpg";
import "animate.css";

const BlogHomeCat = () => {
    const navigate = useNavigate();

    const blogs = [
        {
            image: blog1,
            tag: "Life Style",
            title: "Tree Plantation",
            description:
                "Pleasure and praising pain was born. I will give you a complete account of the system, and expound actual teachings great. This is another extra line to make it a bit longer.",
            route: "/lifeStylePages"
        },
        {
            image: blog2,
            tag: "Travel",
            title: "Exploring the Hills",
            description:
                "Discover the beauty of untouched nature. Mountains, rivers and forests await your next great adventure. Perfect for explorers and nature lovers alike.",
            route: "/travelPages"
        },
        {
            image: blog3,
            tag: "Health",
            title: "Daily Fitness Tips",
            description:
                "Stay healthy with simple fitness routines. Improve your body and mind with daily habits that bring results.",
            route: "/healthPages"
        }
    ];

    return (
        <div className="grid md:grid-cols-3 gap-10 max-w-screen-xl mx-auto pt-5">
            {blogs.map((blog, index) => (
                <div
                    key={index}
                    onClick={() => navigate(blog.route)}
                    className="group bg-[#f5f8ed] shadow-md rounded-xl overflow-hidden text-left p-5 h-[480px] transition-all duration-500 relative cursor-pointer"
                >
                    {/* Image Section */}
                    <div className="relative overflow-hidden rounded-xl h-[300px] group-hover:h-[220px] transition-all duration-500 ease-in-out">
                        <img
                            src={blog.image}
                            alt={blog.title}
                            className="relative w-full h-full object-cover rounded-xl transition-all duration-500 ease-in-out group-hover:brightness-75"
                        />
                        {/* Overlay Text instead of Button */}
                        <button className=" absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 px-5 py-2 text-white font-semibold rounded-full border border-white bg-white/20 backdrop-blur-md shadow-lg hover:scale-105">
                            Explore Now
                        </button>
                    </div>

                    {/* Content Section */}
                    <div className="space-y-3 mt-5 pb-6 relative">
                        {/* Rotating Tag */}
                        <div className="flex items-center justify-center">
                            <p className="absolute -mt-8 text-xl font-semibold bg-[#2acb35] text-white py-2 px-5 rounded-full rotate-animation opacity-100">
                                {blog.tag}
                            </p>
                        </div>

                        {/* Title */}
                        <h3 className="inline-block text-lg font-semibold text-gray-800 hover:text-[#2acb35] transition duration-300 border-b-4 border-[#2acb35] pb-2">
                            {blog.title}
                        </h3>

                        {/* Description */}
                        <div className="text-gray-600 relative overflow-hidden transition-all duration-500 ease-in-out max-h-[4.5rem] group-hover:max-h-[300px]">
                            <p className="line-clamp-3 group-hover:line-clamp-none">
                                {blog.description}
                            </p>

                            {/* Floating message */}
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-center mt-5 text-[#2acb35] font-semibold animate__animated animate__fadeInUp">
                                😊 --Have Your Nice Day-- 😊
                            </div>
                        </div>
                    </div>
                </div>
            ))}

            {/* Custom animation style */}
            <style>{`
                .rotate-animation {
                    transition: transform 1s;
                }

                .group:hover .rotate-animation {
                    animation: doubleSpin 1s ease-in-out;
                }

                @keyframes doubleSpin {
                    0% {
                        transform: rotate(0deg);
                    }
                    50% {
                        transform: rotate(180deg);
                    }
                    100% {
                        transform: rotate(360deg);
                    }
                }
            `}</style>
        </div>
    );
};

export default BlogHomeCat;
