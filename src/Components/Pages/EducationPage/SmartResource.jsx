import { Helmet } from "react-helmet";
import travel1 from "../../../assets/smartResource.jpg";
import BlogDown from "../Blogs/BlogDown";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import SmartBlogs from "./SmartBlogs";


const SmartResource = () => {
    return (
        <div>
            <Helmet>
                {/* Basic Meta Tags */}
                <title>Smart Resource - Squirrel Peace | Knowledge, Tips & Life Skills</title>
                <meta
                    name="description"
                    content="Explore Smart Resources at Squirrel Peace. Gain knowledge, life tips, productivity insights, and practical guidance to improve daily living."
                />
                <meta
                    name="keywords"
                    content="smart resources, life tips, knowledge, productivity, life skills, squirrel peace"
                />
                <link rel="canonical" href="https://squirrelpeace.com/smart-resource" />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:title" content="Smart Resource - Squirrel Peace | Knowledge, Tips & Life Skills" />
                <meta
                    property="og:description"
                    content="Explore Smart Resources at Squirrel Peace. Gain knowledge, life tips, productivity insights, and practical guidance to improve daily living."
                />
                <meta property="og:image" content="https://squirrelpeace.com/images/smart-resource-cover.jpg" />
                <meta property="og:url" content="https://squirrelpeace.com/smart-resource" />
                <meta property="og:type" content="website" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Smart Resource - Squirrel Peace | Knowledge, Tips & Life Skills" />
                <meta
                    name="twitter:description"
                    content="Explore Smart Resources at Squirrel Peace. Gain knowledge, life tips, productivity insights, and practical guidance to improve daily living."
                />
                <meta name="twitter:image" content="https://squirrelpeace.com/images/smart-resource-cover.jpg" />
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
