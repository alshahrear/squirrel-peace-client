import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import LifeBlog from './LifeBlog';
import useAuth from '../../../Layout/useAuth';
import useAdmin from '../../../../hooks/useAdmin';
import Loader from "../../../../Components/Loader";

const LifeBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const blogsPerPage = 12;
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isAdmin] = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        fetch('http://localhost:5000/blog')
            .then(res => res.json())
            .then(data => {
                setBlogs(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error Loading Blogs:", error);
                setLoading(false);
            });
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

    const filteredBlogs = blogs
        .filter(blog => blog.blogCategory === "Life Style")
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

                    <h2 className="text-2xl font-bold text-center w-full">
                        Life <span className="text-[#2acb35]">Style</span>
                    </h2>
                    {
                        user && isAdmin &&
                        <NavLink to="/blogPageAdmin" className="absolute right-4 sm:right-10">
                            <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                                Add Blog
                            </button>
                        </NavLink>
                    }
                </div>
                <p className="text-center mt-2">
                    Our personal trainers can help you meet your fitness goals. They can become your <br />
                    teacher, your motivator, your coach and your friend.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
                {
                    loading ? (
                        <div className="col-span-full flex justify-center items-center h-40">
                            <Loader />
                        </div>
                    ) : currentBlogs.length === 0 && searchTerm ? (
                        <p className="text-center text-red-400 mt-5 font-semibold text-xl col-span-full">
                            No Result Found
                        </p>
                    ) : (
                        currentBlogs.map(lifeBlog => (
                            <LifeBlog
                                key={lifeBlog._id}
                                lifeBlog={lifeBlog}
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

export default LifeBlogs;
