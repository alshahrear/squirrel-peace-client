import { Helmet } from "react-helmet";
import travel1 from "../../../../assets/dailyNotes.jpg";
import BlogAll from "../../../Layout/BlogSuggest.jsx/BlogAll";
import BlogDown from "../BlogDown";
import DailyBlogs from "./DailyBlogs";

const DailyNotes = () => {
    return (
        <div>
            <Helmet>
                {/* Basic Meta Tags */}
                <title>Daily Notes - Squirrel Peace | Life Insights & Reflections</title>
                <meta
                    name="description"
                    content="Explore daily reflections, life insights, and inspiring notes in Daily Notes at Squirrel Peace. Discover positivity, motivation, and mindful living tips."
                />
                <meta
                    name="keywords"
                    content="daily notes, life insights, reflections, mindful living, positivity, squirrel peace"
                />
                <link rel="canonical" href="https://squirrelpeace.com/daily-notes" />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:title" content="Daily Notes - Squirrel Peace | Life Insights & Reflections" />
                <meta
                    property="og:description"
                    content="Explore daily reflections, life insights, and inspiring notes in Daily Notes at Squirrel Peace. Discover positivity, motivation, and mindful living tips."
                />
                <meta property="og:image" content="https://squirrelpeace.com/images/daily-notes-cover.jpg" />
                <meta property="og:url" content="https://squirrelpeace.com/daily-notes" />
                <meta property="og:type" content="website" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Daily Notes - Squirrel Peace | Life Insights & Reflections" />
                <meta
                    name="twitter:description"
                    content="Explore daily reflections, life insights, and inspiring notes in Daily Notes at Squirrel Peace. Discover positivity, motivation, and mindful living tips."
                />
                <meta name="twitter:image" content="https://squirrelpeace.com/images/daily-notes-cover.jpg" />
            </Helmet>

            <div
                className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${travel1})` }}
            >
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/10 "></div>

                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Daily Notes</h1>
            </div>


            <div className="">
                <BlogDown />
            </div>

            <div className="py-5">
                <DailyBlogs></DailyBlogs>
            </div>

            <div>
                <BlogAll />
            </div>
        </div>
    );
};

export default DailyNotes;
