import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import StoryBlog from './StoryBlog';
import useAuth from '../../Layout/useAuth';
import useAdmin from '../../../hooks/useAdmin';
import { FaSearch } from 'react-icons/fa';


const StoryBlogs = () => {
    const [stories, setStories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const storiesPerPage = 12;
    const { user } = useAuth();
    const [isAdmin] = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/story')
            .then(res => res.json())
            .then(data => {
                setStories(data);
            })
            .catch(error => {
                console.error("Error loading stories:", error);
            });
    }, []);

    const handleDeleteFromUI = (id) => {
        const updatedStories = stories.filter(story => story._id !== id);
        setStories(updatedStories);
    };

    const handleUpdateFromUI = (id, updatedData) => {
        const updatedStories = stories.map(story =>
            story._id === id ? { ...story, ...updatedData } : story
        );
        setStories(updatedStories);
    };

    const filteredStories = stories.filter(story => {
        const title = story.storyTitle.toLowerCase();
        const description = story.storyShortDescription.toLowerCase();
        const category = story.storyCategory?.toLowerCase() || '';
        const term = searchTerm.toLowerCase();

        return (
            title.includes(term) ||
            description.includes(term) ||
            category.includes(term)
        );
    });


    const totalPages = Math.ceil(filteredStories.length / storiesPerPage);
    const indexOfLastStory = currentPage * storiesPerPage;
    const indexOfFirstStory = indexOfLastStory - storiesPerPage;
    const currentStories = filteredStories.slice().reverse().slice(indexOfFirstStory, indexOfLastStory);

    const getPageNumbers = () => {
        let startPage = Math.max(currentPage - 2, 1);
        let endPage = startPage + 4;
        if (endPage > totalPages) {
            endPage = totalPages;
            startPage = Math.max(endPage - 4, 1);
        }
        const pages = [];
        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }
        return pages;
    };

    const handlePrevious = () => {
        if (currentPage > 1) setCurrentPage(prev => prev - 1);
    };

    const handleNext = () => {
        if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
    };

    return (
        <div className="max-w-screen-xl mx-auto px-4">
            <div className="pb-10">
                <div className="flex justify-between items-center relative">
                    {/* Search */}
                    <div className="absolute left-1 flex items-center gap-2">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search Story..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35] text-sm"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>


                    {/* Title */}
                    <h2 className="text-2xl font-bold text-center w-full">
                        Our <span className="text-[#2acb35]">Story</span>
                    </h2>

                    {/* Add Story */}
                    {
                        user && isAdmin &&
                        <NavLink to="/storyBlogAdmin" className="absolute right-4 sm:right-10">
                            <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                                Add Story
                            </button>
                        </NavLink>
                    }
                </div>

                {/* Description */}
                <p className="text-center mt-2">
                    Our personal trainers can help you meet your fitness goals. They can become your <br />
                    teacher, your motivator, your coach and your friend.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {
                    currentStories.length === 0 ? (
                        <p className="text-center text-red-400 mt-5 font-semibold text-xl col-span-full">
                            No Result Found
                        </p>
                    ) : (
                        currentStories.map(storyBlog => (
                            <StoryBlog
                                key={storyBlog._id}
                                storyBlog={storyBlog}
                                onDelete={handleDeleteFromUI}
                                onUpdate={handleUpdateFromUI}
                                searchTerm={searchTerm}
                            />
                        ))
                    )
                }
            </div>

            {/* Pagination */}
            {filteredStories.length > 0 && (
                <div className="flex justify-center mt-10 space-x-2 items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded ${currentPage === 1
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-[#2acb35] text-white hover:bg-green-600'
                            }`}
                    >
                        Previous
                    </button>

                    {
                        getPageNumbers().map(number => (
                            <button
                                key={number}
                                onClick={() => setCurrentPage(number)}
                                className={`px-4 py-2 border rounded ${currentPage === number
                                    ? 'bg-[#2acb35] text-white'
                                    : 'bg-white text-[#2acb35] border-[#2acb35] hover:bg-[#2acb35] hover:text-white'
                                    }`}
                            >
                                {number}
                            </button>
                        ))
                    }

                    <button
                        onClick={handleNext}
                        disabled={currentPage === totalPages}
                        className={`px-6 py-2 rounded ${currentPage === totalPages
                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            : 'bg-[#2acb35] text-white hover:bg-green-600'
                            }`}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default StoryBlogs;
