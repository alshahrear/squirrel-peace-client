import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import StoryBottoms from "./StoryBottoms";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import Loader from "../../../Components/Loader";
import { Helmet } from "react-helmet";
import DOMPurify from "dompurify";
import { AiFillEdit } from "react-icons/ai";

const StoryDetails = () => {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [otherStories, setOtherStories] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);
        fetch(`https://squirrel-peace-server.onrender.com/story/${id}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setStory(data[0]);
                } else if (data._id) {
                    setStory(data);
                } else if (data.data && data.data._id) {
                    setStory(data.data);
                } else {
                    setError("Unexpected data format.");
                }
                setLoading(false);
            })
            .catch(() => {
                setError("Failed to fetch story.");
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        fetch("https://squirrel-peace-server.onrender.com/story")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const filtered = data.filter(item => item._id !== id);
                    const shuffled = filtered.sort(() => 0.5 - Math.random());
                    setOtherStories(shuffled);
                }
            });
    }, [id]);

    if (loading) return <Loader />;
    if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
    if (!story) return <div className="text-center py-10">No story found.</div>;

    const cleanLongDescription = DOMPurify.sanitize(story.storyLongDescription || "");

    return (
        <div key={id}>
            <Helmet>
                <title>{story.storyTitle} - Storial Peace</title>
            </Helmet>

            {/* Top Banner */}
            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${story.storyImage})` }}
            >
                <div className="bg-black/60 text-white text-center p-6 sm:p-10 w-11/12 sm:w-4/5 md:w-3/5 rounded-2xl sm:rounded-3xl">
                    <h2 className="text-xl sm:text-3xl font-semibold mb-2 sm:mb-4 tracking-wide">
                        {story.storyTitle}
                    </h2>
                    <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                        {story.storyShortDescription}
                    </p>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 pt-3 text-base sm:text-lg">
                <div className="flex justify-between items-center flex-row-reverse sm:flex-row">
                    {/* Publish Date - Right in mobile, right in desktop */}
                    <span className="font-semibold text-right sm:text-left">
                        Publish Date: {story?.storyDate}
                    </span>

                    {/* Edit Button - Left in mobile, right in desktop */}
                    <button className="btn bg-[#2acb35] text-white flex items-center gap-2 py-2 px-4 rounded-md">
                        Edit <AiFillEdit className="text-lg" />
                    </button>
                </div>
            </div>


            {/* Main Content */}
            <div className="max-w-screen-xl mx-auto px-4 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-b border-gray-300 pb-8 mb-5">
                    {/* Main Story */}
                    <div className="lg:col-span-2">
                        <h2 className="text-2xl sm:text-3xl font-bold mb-4">{story.storyTitle}</h2>
                        <div
                            className="text-gray-700 leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: cleanLongDescription }}
                        />

                        {/* Show StoryBottoms only in mobile/tablet */}
                        <div className="block lg:hidden mt-6 border-t-gray-300 border-t-1 pt-5">
                            <StoryBottoms
                                storyId={story._id}
                                storyTitle={story.storyTitle}
                                storyCategory={story.storyCategory}
                                storyImage={story.storyImage}
                            />
                        </div>
                    </div>

                    {/* Sidebar - Other Stories */}
                    <div className="border-t lg:border-t lg:border-l border-gray-300 pt-5 lg:pt-0 pl-0 lg:pl-5 rounded-tl-0 md:rounded-tl-2xl">
                        <h3 className="text-xl sm:text-2xl font-bold text-center mb-4">Other Stories</h3>

                        {/* Responsive Layout: 1 per row on mobile, vertical list on laptop */}
                        <div className="grid grid-cols-1 gap-4 lg:flex lg:flex-col">
                            {(window.innerWidth < 1024 ? otherStories.slice(0, 6) : otherStories.slice(0, 10)).map(item => (
                                <Link
                                    key={item._id}
                                    to={`/story/${item._id}`}
                                    className="group h-64 sm:h-72 relative rounded-xl overflow-hidden shadow-md hover:scale-[1.02] transition-transform duration-300"
                                >
                                    <img
                                        src={item.storyImage}
                                        alt={item.storyTitle}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                    />

                                    {/* Top-left: storyDate */}
                                    <div className="absolute top-3 left-3 z-20">
                                        <div className="text-white text-sm px-4 py-1 rounded-full backdrop-blur-sm">
                                            {item.storyDate}
                                        </div>
                                    </div>

                                    {/* Top-right: storyCategory */}
                                    <div className="absolute top-3 right-3 z-20">
                                        <div className="text-white text-xs px-4 py-1 border border-white rounded-full backdrop-blur-sm">
                                            {item.storyCategory}
                                        </div>
                                    </div>

                                    <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-4 sm:p-6 text-left">
                                        <div className="flex-grow flex flex-col justify-center">
                                            <h2 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2 drop-shadow">
                                                {item.storyTitle}
                                            </h2>
                                            <p className="text-xs sm:text-sm text-gray-200 drop-shadow-sm line-clamp-3">
                                                {item.storyShortDescription}
                                            </p>
                                        </div>
                                        <div>
                                            <button className="w-full py-1 border border-white text-white rounded-md transition-all duration-300 hover:scale-105 hover:font-semibold hover:border-[#2acb35]">
                                                See More
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom for laptop only */}
            <div className="max-w-screen-xl mx-auto py-5 hidden lg:block">
                <StoryBottoms
                    storyId={story._id}
                    storyTitle={story.storyTitle}
                    storyCategory={story.storyCategory}
                    storyImage={story.storyImage}
                />
            </div>

            <div>
                <BlogAll />
            </div>
        </div>
    );
};

export default StoryDetails;
