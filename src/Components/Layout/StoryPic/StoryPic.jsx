import about2 from "../../../assets/about2.jpg";
import about3 from "../../../assets/about3.jpg";
import about4 from "../../../assets/about4.jpg";
import about5 from "../../../assets/about5.jpg";
import about6 from "../../../assets/about6.jpg";
import about0 from "../../../assets/blogcat2.jpg";
const StoryPic = () => {
    return (
        <div className=" max-w-screen-xl mx-auto ">
            <div className="pb-10">
                <h2 className="text-center text-2xl font-bold">Our <span className="text-[#2acb35]">Story Property</span></h2>
                <p className="text-center mt-2">Our personal trainers can help you meet your fitness goals. They can become your <br /> teacher, your motivator, your coach and your friend.</p>
            </div>
            <div className="grid grid-cols-3 gap-5">
                {[about0, about2, about3, about4, about5, about6].map((img, index) => (
                    <div key={index} className="relative overflow-hidden rounded-2xl group">
                        {/* Image with zoom on hover */}
                        <img
                            src={img}
                            alt={`about-img-${index}`}
                            className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-110"
                        />

                        {/* Dark Overlay with instant visibility */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out z-10 rounded-2xl"></div>

                        {/* See More Button */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ease-in-out z-20">
                            <button className="px-4 py-2 bg-white/30 backdrop-blur-md text-white border border-white rounded-lg font-semibold hover:bg-white/50 transition-all duration-300">
                                See More
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StoryPic;