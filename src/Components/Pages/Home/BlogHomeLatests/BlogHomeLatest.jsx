
import latest1 from "../../../../assets/blogcat4.jpg";
import { HiMiniArrowLongRight } from "react-icons/hi2";
import { LuMessageCircleMore } from "react-icons/lu";
import { FcLike } from "react-icons/fc";

// Inline CSS for beat animation
const styles = `
@keyframes beat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.4);
  }
}
.beat-on-hover {
  transition: transform 0.3s ease;
}
.group:hover .beat-on-hover {
  animation: beat 0.6s infinite;
}
`;

const BlogHomeLatest = () => {
    return (
        <>
            {/* Injecting custom styles */}
            <style>{styles}</style>

            <div className="max-w-screen-xl mx-auto py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white shadow-md rounded-lg overflow-hidden transition-transform duration-300 hover:scale-[1.03] group">
                        {/* Image and overlay */}
                        <div className="relative overflow-hidden h-52">
                            <img
                                src={latest1}
                                alt="Newest Cleaning Tools for House 2024"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            {/* Dark Overlay */}
                            <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out pointer-events-none">
                                <div className="w-full h-full bg-gradient-to-r from-black/60 via-black/40 to-black/60 scale-x-0 group-hover:scale-x-100 origin-center transition-transform duration-[1200ms] ease-in-out"></div>
                            </div>
                            {/* Travel Label */}
                            <span className="absolute top-2 left-2 z-20 bg-[#2acb35] text-white text-[16px] font-semibold px-3 py-1 rounded transition-all duration-500 group-hover:top-1/2 group-hover:left-1/2 group-hover:-translate-x-1/2 group-hover:-translate-y-1/2">
                                Travel
                            </span>
                        </div>

                        {/* Card Content */}
                        <div className="p-5 space-y-2">
                            <div className="flex items-center justify-between">
                                <p className="text-start font-semibold">16 October, 2025</p>
                                <div className="flex items-center gap-3">
                                    <p className="flex items-center gap-1">
                                        <LuMessageCircleMore className="text-[#2acb35]" />
                                        <span className="beat-on-hover font-semibold ">6</span>
                                    </p>
                                    <p className="flex items-center gap-1">
                                        <FcLike />
                                        <span className="beat-on-hover font-semibold ">10</span>
                                    </p>
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold text-start transition-colors duration-500 group-hover:text-[#2acb35]">
                                Newest Cleaning Tools for House 2024
                            </h3>

                            <p className="text-gray-600 text-start text-sm pb-2">
                                Stay healthy with simple fitness routines. Improve your body and mind with daily habits that bring results.
                            </p>

                            <button className="btn rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35] w-full flex items-center justify-center gap-2 transition-all duration-300">
                                Read More <HiMiniArrowLongRight className="text-2xl" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>  
        </>
    );
};

export default BlogHomeLatest;
