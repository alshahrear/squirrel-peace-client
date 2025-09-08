import story1 from "../../../assets/story.jpg";
import { Helmet } from "react-helmet";
import BlogDown from "./blogDown";
import Blogs from "./Blogs";

const BlogPages = () => {
    return (
        <div>
            <Helmet>
                {/* Basic Meta Tags */}
                <title>Our Blog - Squirrel Peace | Happy Life & Health Tips</title>
                <meta
                    name="description"
                    content="Explore inspiring blogs at Squirrel Peace with tips for a happy life, positivity, and better health. Read wellness guides, lifestyle hacks, and motivational stories."
                />
                <meta
                    name="keywords"
                    content="happy life tips, health tips, wellness blog, positivity, lifestyle, motivation, squirrel peace blog"
                />
                <link rel="canonical" href="https://squirrelpeace.com/blog" />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:title" content="Our Blog - Squirrel Peace | Happy Life & Health Tips" />
                <meta
                    property="og:description"
                    content="Discover practical life tips, health advice, and positivity blogs at Squirrel Peace. Stay inspired and live a balanced lifestyle."
                />
                <meta property="og:image" content="https://squirrelpeace.com/images/blog-cover.jpg" />
                <meta property="og:url" content="https://squirrelpeace.com/blog" />
                <meta property="og:type" content="website" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Our Blog - Squirrel Peace | Happy Life & Health Tips" />
                <meta
                    name="twitter:description"
                    content="Read wellness, happiness, and health tips on Squirrel Peace Blog. Start your journey towards a peaceful and positive life."
                />
                <meta name="twitter:image" content="https://squirrelpeace.com/images/blog-cover.jpg" />
            </Helmet>
            <div
                className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${story1})` }}
            >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30 "></div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Our Blog</h1>
            </div>
            <BlogDown></BlogDown>
            <div className="py-5">
                <Blogs></Blogs>
            </div>
        </div>
    );
};

export default BlogPages;
