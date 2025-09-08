import { NavLink } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import useAuth from '../../Layout/useAuth';
import useAdmin from '../../../hooks/useAdmin';
import { FaSearch } from 'react-icons/fa';
import Loader from "../../Loader";
import Blog from './Blog';

const Blogs = () => {
    const [blogs, setBlogs] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const [isAdmin] = useAdmin();
    const [searchTerm, setSearchTerm] = useState('');
    const topRef = useRef(null);

    const [blogsPerPage, setBlogsPerPage] = useState(window.innerWidth < 1024 ? 8 : 12);

    useEffect(() => {
        const handleResize = () => {
            setBlogsPerPage(window.innerWidth < 1024 ? 8 : 12);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        setLoading(true);
        fetch('https://squirrel-peace-server.onrender.com/blog')
            .then(res => res.json())
            .then(data => {
                setBlogs(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error loading blogs:", error);
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

    const filteredBlogs = blogs.filter(blog => {
        const title = blog.blogTitle.toLowerCase();
        const description = blog.blogShortDescription.toLowerCase();
        const category = blog.blogCategory?.toLowerCase() || '';
        const term = searchTerm.toLowerCase();
        return title.includes(term) || description.includes(term) || category.includes(term);
    });

    const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
    const indexOfLastblog = currentPage * blogsPerPage;
    const indexOfFirstblog = indexOfLastblog - blogsPerPage;
    const currentBlogs = filteredBlogs.slice().reverse().slice(indexOfFirstblog, indexOfLastblog);

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

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        setTimeout(() => {
            topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handlePrevious = () => {
        if (currentPage > 1) {
            handlePageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            handlePageChange(currentPage + 1);
        }
    };

    return (
        <div className="max-w-screen-xl mx-auto px-4">
            <div ref={topRef}></div>

            <div className="pb-10">
                <div className="text-center mb-2">
                    <h2 className="text-2xl lg:text-3xl font-semibold">
                        <span className='text-[#2acb35]'>__</span>Explore Our <span className='text-[#2acb35]'>Inspiring</span> Blog<span className='text-[#2acb35]'>__</span>
                    </h2>
                </div>

                {/* Mobile Add + Search */}
                <div className="lg:hidden mt-4 flex flex-col items-center gap-3">
                    {user && isAdmin &&
                        <NavLink to="/blogAdmin">
                            <button className="btn bg-[#2acb35] text-white px-4 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition text-sm">
                                Add Blog
                            </button>
                        </NavLink>
                    }
                    <div className="relative w-full max-w-xs">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search Blog..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35] text-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                {/* Desktop Add + Search */}
                <div className="hidden lg:flex justify-between items-center mt-6">
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                        <input
                            type="text"
                            placeholder="Search Blog..."
                            className="w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35] text-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                    {user && isAdmin &&
                        <NavLink to="/blogAdmin">
                            <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                                Add Blog
                            </button>
                        </NavLink>
                    }
                </div>
            </div>

            {/* Blog Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10">
                {loading ? (
                    <div className="col-span-full flex justify-center items-center h-40">
                        <Loader />
                    </div>
                ) : currentBlogs.length === 0 && searchTerm ? (
                    <p className="text-center text-red-400 mt-5 font-semibold text-lg sm:text-xl col-span-full">
                        No Result Found
                    </p>
                ) : (
                    currentBlogs.map(blog => (
                        <Blog
                            key={blog._id}
                            blog={blog}
                            onDelete={handleDeleteFromUI}
                            onUpdate={handleUpdateFromUI}
                            searchTerm={searchTerm}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            {filteredBlogs.length > 0 && (
                <div className="flex flex-wrap justify-center mt-10 gap-2 items-center">
                    <button
                        onClick={handlePrevious}
                        disabled={currentPage === 1}
                        className={`px-4 py-2 rounded text-sm ${currentPage === 1
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
                            className={`px-4 py-2 text-sm border rounded ${currentPage === number
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
                        className={`px-4 py-2 rounded text-sm ${currentPage === totalPages
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

export default Blogs;
