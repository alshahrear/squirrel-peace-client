import health1 from "../../../../assets/health1.jpg";
import BlogAll from "../../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../BlogDown";
import HealthBlogs from "./HealthBlogs";


const HealthPages = () => {
    return (
        <div>
            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${health1})` }}
            >
                {/* Transparent Dark Box Like Image */}
                <div className="bg-black/60 text-white text-center p-10 w-3/5 rounded-3xl">
                    <h2 className="text-4xl font-extrabold mb-4 tracking-wide">Health</h2>
                    <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book. when an unknown printer
                        took a galley of type and scrambled it to make a type specimen book.
                    </p>
                </div>
            </div>
           <BlogDown></BlogDown>
           <HealthBlogs></HealthBlogs>
           <BlogAll></BlogAll>
        </div>
    );
};

export default HealthPages;
