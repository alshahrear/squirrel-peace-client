import story1 from "../../../assets/story.jpg";
import StoryBlogs from "./StoryBlogs";
import { Helmet } from "react-helmet";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../Blogs/BlogDown";

const StoryPages = () => {
    return (
        <div>
            <Helmet>
                <title>Story - Squirrel Peace</title>
            </Helmet>

            <div
                className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${story1})` }}
            >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 "></div>
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Story</h1>
            </div>
            <BlogDown></BlogDown>

            <div className="py-5">
                <StoryBlogs />
            </div>

            <div>
                <BlogAll />
            </div>
        </div>
    );
};

export default StoryPages;
