import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import HealthBlog from './HealthBlog';
import useAuth from '../../../Layout/useAuth';
import useAdmin from '../../../../hooks/useAdmin';

const HealthBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const blogsPerPage = 12;
    const { user } = useAuth();
    const [isAdmin] = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetch('http://localhost:5000/blog')
            .then(res => res.json())
            .then(data => setBlogs(data))
            .catch(error => console.error("Error loading blogs:", error));
    }, []);

    const handleDeleteFromUI = (id) => {
        const updatedBlogs = blogs.filter(blog => blog._id !== id);
        setBlogs(updatedBlogs);
    };

    const handleUpdateFromUI = (id, updatedData) => {
        const updatedBlogs = blogs.map(blog =>
            blog._id === id ? { ...blog, ...updatedData } : blog
        );
        setBlogs(updatedBlogs);
    };

    // Filter only Health category and apply search (title + shortDescription)
    const filteredBlogs = blogs
        .filter(blog => blog.blogCategory === "Health")
        .filter(blog => {
            const title = blog.blogTitle?.toLowerCase() || '';
            const description = blog.blogShortDescription?.toLowerCase() || '';
            const term = searchTerm.toLowerCase();
            return title.includes(term) || description.includes(term);
        })
        .reverse();

    const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
    const indexOfLastBlog = currentPage * blogsPerPage;
    const indexOfFirstBlog = indexOfLastBlog - blogsPerPage;
    const currentBlogs = filteredBlogs.slice(indexOfFirstBlog, indexOfLastBlog);

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
        <div className="max-w-screen-xl mx-auto py-10 px-4">
            <div className="pb-10">
                <div className="flex justify-between items-center relative">
                    {/* Search input */}
                    <div className="absolute left-1 flex items-center gap-2">
                        <div className="relative">
                            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                            <input
                                type="text"
                                placeholder="Search Blog..."
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
                        <span className="text-[#2acb35]">Health</span> Blog
                    </h2>

                    {/* Add Blog Button */}
                    {
                        user && isAdmin &&
                        <NavLink to="/blogPageAdmin" className="absolute right-4 sm:right-10">
                            <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                                Add Blog
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

            {/* Blog Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {
                    currentBlogs.length === 0 ? (
                        <p className="text-center text-red-400 mt-5 font-semibold text-xl col-span-full">
                            No Result Found
                        </p>
                    ) : (
                        currentBlogs.map(healthBlog => (
                            <HealthBlog
                                key={healthBlog._id}
                                healthBlog={healthBlog}
                                onDelete={handleDeleteFromUI}
                                onUpdate={handleUpdateFromUI}
                                searchTerm={searchTerm}
                            />
                        ))
                    )
                }
            </div>

            {/* Pagination */}
            {filteredBlogs.length > 0 && (
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
                        className={`px-4 py-2 rounded ${currentPage === totalPages
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

export default HealthBlogs;
