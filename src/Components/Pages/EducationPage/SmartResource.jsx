import { Helmet } from "react-helmet";
import travel1 from "../../../assets/smartResource.jpg";
import BlogDown from "../Blogs/BlogDown";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import SmartBlogs from "./SmartBlogs";


const SmartResource = () => {
    return (
        <div>
            <Helmet>
                <title>Smart Resource - Squirrel Peace</title>
            </Helmet>

            <div
                className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${travel1})` }}
            >
                 {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/10 "></div>
                
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Smart Resource</h1>
                
            </div>

            <div className="">
                <BlogDown />
            </div>

            <div className="py-5">
                <SmartBlogs></SmartBlogs>
            </div>

            <div>
                <BlogAll />
            </div>
        </div>
    );
};

export default SmartResource;
