import { Helmet } from "react-helmet";
import life1 from "../../../../assets/life1.jpg";
import BlogAll from "../../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../BlogDown";
import AdventureBlogs from "./AdventureBlogs";

const AdventureDiary = () => {
    return (
        <div>
            <Helmet>
                <title>Adventure Diary - Storial Peace</title>
            </Helmet>

            {/* Hero Section */}
            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${life1})` }}
            >
                <div className="bg-black/60 text-white text-center p-6 sm:p-10 w-[90%] sm:w-3/5 rounded-3xl">
                    <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-wide">Adventure Diary</h2>
                    <p className="text-sm sm:text-base text-gray-200 leading-relaxed">
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,
                        but also the leap into electronic typesetting.
                    </p>
                </div>
            </div>

            {/* Adventure Blogs Section */}
            <BlogDown />
            <AdventureBlogs></AdventureBlogs>
            <BlogAll />
        </div>
    );
};

export default AdventureDiary;
