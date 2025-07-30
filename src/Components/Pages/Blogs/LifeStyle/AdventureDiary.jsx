import { Helmet } from "react-helmet";
import life1 from "../../../../assets/adventureDiary.jpg";
import BlogAll from "../../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../BlogDown";
import AdventureBlogs from "./AdventureBlogs";

const AdventureDiary = () => {
    return (
        <div>
            <Helmet>
                <title>Adventure Diary - Squirrel Peace</title>
            </Helmet>

            {/* Hero Section */}
            <div
                className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${life1})` }}
            >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/10 "></div>
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Adventure Diary</h1>
            </div>

            {/* Adventure Blogs Section */}
            <BlogDown />
            <AdventureBlogs></AdventureBlogs>
            <BlogAll />
        </div>
    );
};

export default AdventureDiary;
