import { Helmet } from "react-helmet";
import travel1 from "../../../../assets/travel1.jpg";
import BlogAll from "../../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../BlogDown";
import TravelBlogs from "./TravelBlogs";

const TravelPages = () => {
    return (
        <div>
            <Helmet>
                <title>Travel - Storial Peace </title>
            </Helmet>
            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${travel1})` }}
            >
                {/* Transparent Dark Box Like Image */}
                <div className="bg-black/60 text-white text-center p-10 w-3/5 rounded-3xl">
                    <h2 className="text-4xl font-extrabold mb-4 tracking-wide">Travel</h2>
                    <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book.
                    </p>
                </div>
            </div>
            <BlogDown></BlogDown>
            <TravelBlogs></TravelBlogs>
            <BlogAll></BlogAll>
        </div>
    );
};

export default TravelPages;
