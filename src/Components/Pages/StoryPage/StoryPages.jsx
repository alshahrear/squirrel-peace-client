import story1 from "../../../assets/story.jpg";
import StoryBlogs from "./StoryBlogs";
import { Helmet } from "react-helmet";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../Blogs/BlogDown";

const StoryPages = () => {
    return (
        <div>
            <Helmet>
                {/* Basic Meta Tags */}
                <title>Adventure Diary - Squirrel Peace | Explore Life & Travel Stories</title>
                <meta
                    name="description"
                    content="Discover thrilling adventures and travel experiences in our Adventure Diary at Squirrel Peace. Explore life lessons, positivity, and inspiring journeys."
                />
                <meta
                    name="keywords"
                    content="adventure diary, travel stories, life lessons, inspiring journeys, squirrel peace"
                />
                <link rel="canonical" href="https://squirrelpeace.com/adventure-diary" />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:title" content="Adventure Diary - Squirrel Peace | Explore Life & Travel Stories" />
                <meta
                    property="og:description"
                    content="Discover thrilling adventures and travel experiences in our Adventure Diary at Squirrel Peace. Explore life lessons, positivity, and inspiring journeys."
                />
                <meta property="og:image" content="https://squirrelpeace.com/images/adventure-diary-cover.jpg" />
                <meta property="og:url" content="https://squirrelpeace.com/adventure-diary" />
                <meta property="og:type" content="website" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Adventure Diary - Squirrel Peace | Explore Life & Travel Stories" />
                <meta
                    name="twitter:description"
                    content="Discover thrilling adventures and travel experiences in our Adventure Diary at Squirrel Peace. Explore life lessons, positivity, and inspiring journeys."
                />
                <meta name="twitter:image" content="https://squirrelpeace.com/images/adventure-diary-cover.jpg" />
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
