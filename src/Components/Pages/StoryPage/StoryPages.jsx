import story1 from "../../../assets/story2.jpg";
import { GiLoveLetter } from "react-icons/gi";
import StoryDown from "./StoryDown";
import StoryBlogs from "./StoryBlogs";
import { NavLink } from "react-router-dom";
import { Helmet } from "react-helmet";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";

const StoryPages = () => {
    return (
        <div>
            <Helmet>
                <title>Story - Storial Peace</title>
            </Helmet>

            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${story1})` }}
            >
                {/* Transparent Dark Box Like Image */}
                <div className="bg-black/60 text-white text-center p-4 md:p-8 lg:p-10 w-11/12 sm:w-4/5 md:w-3/5 rounded-2xl md:rounded-3xl">
                    <h2 className="text-2xl md:text-3xl font-semibold mb-3 md:mb-4 tracking-wide">
                        Story
                    </h2>
                    <p className=" sm:text-base md:text-base text-gray-200 leading-relaxed">
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. 
                    </p>
                    <NavLink>
                        <button className="flex mx-auto bg-[#f7f7f7] items-center btn mt-4 md:mt-5 px-3 py-1.5 text-sm md:text-base border-1 shadow-lg hover:scale-105 transition-transform duration-300">
                            Explore letter
                            <GiLoveLetter className="text-lg md:text-2xl ml-2" />
                        </button>
                    </NavLink>
                </div>
            </div>

            <StoryDown />

            <div className="py-6 md:py-10">
                <StoryBlogs />
            </div>

            <div>
                <BlogAll />
            </div>
        </div>
    );
};

export default StoryPages;
