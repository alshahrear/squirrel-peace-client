import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import StoryBlog from './StoryBlog';

const StoryHomes = () => {
    const [stories, setStories] = useState([]);

    // র‍্যান্ডম ৬ ব্লগ সিলেক্ট করার ফাংশন
    const getRandomSix = (arr) => {
        let shuffled = arr.slice().sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 6);
    };

    useEffect(() => {
        fetch('http://localhost:5000/story')
            .then(res => res.json())
            .then(data => {
                const randomSix = getRandomSix(data);
                setStories(randomSix);
            })
            .catch(error => {
                console.error("Error loading stories:", error);
            });
    }, []);

    // Delete from UI
    const handleDeleteFromUI = (id) => {
        const updatedStories = stories.filter(story => story._id !== id);
        setStories(updatedStories);
    };

    // Update from UI
    const handleUpdateFromUI = (id, updatedData) => {
        const updatedStories = stories.map(story =>
            story._id === id ? { ...story, ...updatedData } : story
        );
        setStories(updatedStories);
    };

    return (
        <div className="max-w-screen-xl mx-auto py-10">
            <div className="pb-5">
                <div className="flex justify-between items-center relative">
                    <h2 className="text-2xl font-bold text-center w-full">
                        Our <span className="text-[#2acb35]">Story</span>
                    </h2>
                    <NavLink to="/storyBlogAdmin" className="absolute right-4 sm:right-10">
                        <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                            Add Story
                        </button>
                    </NavLink>
                </div>
                <p className="text-center mt-2">
                    Our personal trainers can help you meet your fitness goals. They can become your <br />
                    teacher, your motivator, your coach and your friend.
                </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {
                    stories.map(storyBlog => (
                        <StoryBlog
                            key={storyBlog._id}
                            storyBlog={storyBlog}
                            onDelete={handleDeleteFromUI}
                            onUpdate={handleUpdateFromUI}
                        />
                    ))
                }
            </div>
        </div>
    );
};

export default StoryHomes;
