import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Loader from "../../../Components/Loader";

const DraftDetails = () => {
    const { id } = useParams();
    const [story, setStory] = useState(null);
    const [otherStories, setOtherStories] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        setLoading(true);
        fetch(`http://localhost:5000/draft/${id}`)
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
        fetch("http://localhost:5000/draft")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const filtered = data.filter(item => item._id !== id);
                    const shuffled = filtered.sort(() => 0.5 - Math.random());
                    setOtherStories(shuffled);
                }
            });
    }, [id]);

    if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
    if (loading) return (
        <div className="flex justify-center items-center h-[300px]">
            <Loader />
        </div>
    );
    if (!story) return <div className="text-center py-10">No story found.</div>;

    return (
        <div key={id}>
            {/* Top Banner */}
            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${story.storyImage})` }}
            >
                <div className="bg-black/60 text-white text-center p-10 w-3/5 rounded-3xl">
                    <h2 className="text-3xl font-semibold mb-4 tracking-wide">{story.storyTitle}</h2>
                    <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                        {story.storyShortDescription}
                    </p>
                </div>
            </div>
            <em className="flex justify-end pt-3 max-w-screen-xl mx-auto text-lg font-semibold">
                Publish Date: {story.storyDate}
            </em>

            {/* Main Content */}
            <div className="max-w-screen-xl mx-auto px-4 py-5">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-b border-gray-300 pb-8 mb-5">
                    {/* Main Story */}
                    <div className="lg:col-span-2">
                        <h2 className="text-3xl font-bold mb-4">{story.storyTitle}</h2>
                        <div
                            className="text-gray-700 leading-relaxed whitespace-pre-line"
                            dangerouslySetInnerHTML={{ __html: story.storyLongDescription }}
                        />
                    </div>

                    {/* Sidebar - Other Stories */}
                    <div className="border-l border-t border-gray-300 pl-5 rounded-tl-2xl flex flex-col gap-6">
                        <h3 className="text-2xl pt-2 font-bold text-center">Other Stories</h3>

                        {otherStories.slice(0, 10).map(item => (
                            <Link
                                key={item._id}
                                to={`/draft/${item._id}`}
                                className="group h-80 relative rounded-xl overflow-hidden shadow-md hover:scale-[1.02] transition-transform duration-300"
                            >
                                <img
                                    src={item.storyImage}
                                    alt={item.storyTitle}
                                    className="w-full h-80 object-cover group-hover:scale-110 transition-transform duration-300"
                                />

                                {/* Category badge - top-right */}
                                <div className="absolute top-3 right-3 z-20">
                                    <div className="text-white text-xs px-4 py-2 border border-white rounded-full">
                                        {item.storyCategory}
                                    </div>
                                </div>

                                {/* Overlay content */}
                                <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-6 text-left">
                                    <div className="flex-grow flex flex-col justify-center">
                                        <h2 className="text-xl font-bold text-white mb-2 drop-shadow">
                                            {item.storyTitle}
                                        </h2>
                                        <p className="text-sm text-gray-200 drop-shadow-sm">
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
    );
};

export default DraftDetails;
