import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import StoryHome from './StoryHome';
import Loader from '../../../Components/Loader'; 

const StoryHomes = () => {
    const [stories, setStories] = useState([]);
    const [loading, setLoading] = useState(true);

    const getRandomSix = (arr) => {
        let shuffled = arr.slice().sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 6);
    };

    useEffect(() => {
        fetch('https://squirrel-peace-server.onrender.com/story')
            .then(res => res.json())
            .then(data => {
                const randomSix = getRandomSix(data);
                setStories(randomSix);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error loading stories:", error);
                setLoading(false);
            });
    }, []);

    return (
        <div className="max-w-screen-xl mx-auto py-10">
            <div className="pb-5">
                <div className="flex justify-between items-center relative">
                    <h2 className="text-2xl font-bold text-center w-full">
                        Our <span className="text-[#2acb35]">Story Home</span>
                    </h2>
                    <NavLink to="/story" className="absolute right-4 sm:right-10">
                        <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                            View All
                        </button>
                    </NavLink>
                </div>
                <p className="text-center mt-2">
                    Our personal trainers can help you meet your fitness goals. They can become your <br />
                    teacher, your motivator, your coach and your friend.
                </p>
            </div>
            {
                loading ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                        {
                            stories.map(storyHome => (
                                <StoryHome
                                    key={storyHome._id}
                                    storyHome={storyHome}
                                />
                            ))
                        }
                    </div>
                )
            }
        </div>
    );
};

export default StoryHomes;
