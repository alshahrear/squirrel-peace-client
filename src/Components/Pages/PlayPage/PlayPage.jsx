import { Helmet } from "react-helmet";
import travel1 from "../../../assets/about4.jpg";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../Blogs/BlogDown";
import PlayBlogs from "./PlayBlogs";

const PlayPage = () => {
    return (
        <div>
            <Helmet>
                <title>Play - Storial Peace</title>
            </Helmet>

            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${travel1})` }}
            >
                {/* Transparent Dark Box Like Image */}
                <div className="bg-black/60 text-white text-center p-4 md:p-8 lg:p-10 w-11/12 sm:w-4/5 md:w-3/5 rounded-2xl md:rounded-3xl">
                    <h2 className="text-2xl md:text-3xl font-semibold mb-3 md:mb-4 tracking-wide">
                        Play
                    </h2>
                    <p className="text-sm sm:text-base md:text-base text-gray-200 leading-relaxed">
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book.
                    </p>
                </div>
            </div>

            <div className="">
                <BlogDown />
            </div>

            <div className="py-6 md:py-10">
                <PlayBlogs></PlayBlogs>
            </div>

            <div>
                <BlogAll />
            </div>
        </div>
    );
};

export default PlayPage;
