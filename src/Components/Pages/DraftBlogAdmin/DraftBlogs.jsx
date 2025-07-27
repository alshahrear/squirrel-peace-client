import { useState, useEffect, useRef } from 'react';
import { FaSearch } from 'react-icons/fa';
import DraftBlog from './DraftBlog';
import Loader from "../../../Components/Loader";

const DraftBlogs = ({ stories, setStories }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [storiesPerPage, setStoriesPerPage] = useState(12);
    const scrollRef = useRef(null); // for scroll to top of blog list

    // Set responsive storiesPerPage
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setStoriesPerPage(6);
            } else {
                setStoriesPerPage(12);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetch('https://squirrel-peace-server.onrender.com/draft')
            .then(res => res.json())
            .then(data => {
                const reversedData = data.slice().reverse();
                setStories(reversedData);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error Loading Draft:", error);
                setLoading(false);
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
        const title = story.storyTitle?.toLowerCase() || "";
        const description = story.storyShortDescription?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        return title.includes(term) || description.includes(term);
    });

    const totalPages = Math.ceil(filteredStories.length / storiesPerPage);
    const indexOfLastStory = currentPage * storiesPerPage;
    const indexOfFirstStory = indexOfLastStory - storiesPerPage;
    const currentStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory);

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

    // Scroll to blog list top
    const scrollToTopOfList = () => {
        if (scrollRef.current) {
            window.scrollTo({
                top: scrollRef.current.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        scrollToTopOfList();
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1);
            scrollToTopOfList();
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            setCurrentPage(prev => prev + 1);
            scrollToTopOfList();
        }
    };

    return (
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="pb-10" ref={scrollRef}>
                {/* Title Row */}
                <div className="flex justify-center items-center relative">
                    <h2 className="text-2xl font-bold text-center w-full px-4 sm:px-0">
                        Our <span className="text-[#2acb35]">Draft</span>
                    </h2>

                    {/* Desktop Search */}
                    <div className="hidden sm:absolute sm:left-1 sm:flex sm:items-center gap-2">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search Story..."
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35] text-sm w-[180px] sm:w-[220px] md:w-[280px]"
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                    </div>
                </div>
                {/* Mobile Search */}
                <div className="sm:hidden flex justify-center mt-4">
                    <div className="relative w-full max-w-xs">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search Story..."
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35] text-sm w-full"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 md:gap-10">
                {
                    loading ? (
                        <div className="col-span-full flex justify-center items-center h-40">
                            <Loader />
                        </div>
                    ) : currentStories.length === 0 && searchTerm ? (
                        <p className="text-center text-red-400 mt-5 font-semibold text-xl col-span-full">
                            No Result Found
                        </p>
                    ) : (
                        currentStories.map(storyBlog => (
                            <DraftBlog
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
                <div className="flex justify-center mt-10 space-x-2 items-center flex-wrap gap-2 px-2">
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

                    {getPageNumbers().map(number => (
                        <button
                            key={number}
                            onClick={() => handlePageChange(number)}
                            className={`px-4 py-2 border rounded ${currentPage === number
                                ? 'bg-[#2acb35] text-white'
                                : 'bg-white text-[#2acb35] border-[#2acb35] hover:bg-[#2acb35] hover:text-white'
                                }`}
                        >
                            {number}
                        </button>
                    ))}

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

export default DraftBlogs;