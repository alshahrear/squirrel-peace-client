import { useEffect, useRef, useState } from 'react';
import { FaSearch } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import useAuth from '../../../Layout/useAuth';
import useAdmin from '../../../../hooks/useAdmin';
import Loader from '../../../Loader';
import AdventureBlog from './AdventureBlog';

const AdventureBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [blogsPerPage, setBlogsPerPage] = useState(window.innerWidth < 1024 ? 6 : 12);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const [isAdmin] = useAdmin();
  const topRef = useRef(null);

  const fetchBlogs = () => {
    setLoading(true);
    fetch('https://squirrel-peace-server.onrender.com/blog')
      .then(res => res.json())
      .then(data => {
        setBlogs(data);
        setLoading(false);
      })
      .catch(error => {
        console.error("Error Loading Blogs:", error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setBlogsPerPage(window.innerWidth < 1024 ? 6 : 12);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDeleteFromUI = (id) => {
    setBlogs(prev => prev.filter(blog => blog._id !== id));
  };

  const handleUpdateFromUI = (id, updatedData) => {
    setBlogs(prev => prev.map(blog => blog._id === id ? { ...blog, ...updatedData } : blog));
  };

  const filteredBlogs = blogs
    .filter(blog => blog.blogCategory === "Adventure Diary")
    .filter(blog => {
      const title = blog.blogTitle?.toLowerCase() || '';
      const description = blog.blogShortDescription?.toLowerCase() || '';
      const term = searchTerm.toLowerCase();
      return title.includes(term) || description.includes(term);
    })
    .reverse();

  const totalPages = Math.ceil(filteredBlogs.length / blogsPerPage);
  const indexOfLast = currentPage * blogsPerPage;
  const indexOfFirst = indexOfLast - blogsPerPage;
  const currentBlogs = filteredBlogs.slice(indexOfFirst, indexOfLast);

  const getPageNumbers = () => {
    let start = Math.max(currentPage - 2, 1);
    let end = Math.min(start + 4, totalPages);
    start = Math.max(end - 4, 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setTimeout(() => {
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handlePrevious = () => currentPage > 1 && handlePageChange(currentPage - 1);
  const handleNext = () => currentPage < totalPages && handlePageChange(currentPage + 1);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-10">
      <div ref={topRef}></div>

      <div className="text-center mb-2">
        <h2 className="text-2xl lg:text-3xl font-bold">
          Adventure <span className="text-[#2acb35]">Diary</span>
        </h2>
      </div>

      <p className="text-center mt-3 text-base md:text-xl px-2 sm:px-0">
        Our personal trainers can help you meet your fitness goals. They can become your <br className="hidden sm:block" />
        teacher, your motivator, your coach and your friend.
      </p>

      <div className="lg:hidden mt-4 flex flex-col items-center gap-3">
        {user && isAdmin && (
          <NavLink to="/blogPageAdmin">
            <button className="btn bg-[#2acb35] text-white px-4 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition text-sm">
              Add Blog
            </button>
          </NavLink>
        )}
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
        {user && isAdmin && (
          <NavLink to="/blogPageAdmin">
            <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
              Add Blog
            </button>
          </NavLink>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-10 mt-10">
        {loading ? (
          <div className="col-span-full flex justify-center items-center h-40">
            <Loader />
          </div>
        ) : currentBlogs.length === 0 && searchTerm ? (
          <p className="text-center text-red-400 mt-5 font-semibold text-lg sm:text-xl col-span-full">
            No Result Found
          </p>
        ) : (
          currentBlogs.map(adventureBlog => (
            <AdventureBlog
              key={adventureBlog._id}
              adventureBlog={adventureBlog}
              onDelete={handleDeleteFromUI}
              onUpdate={handleUpdateFromUI}
              searchTerm={searchTerm}
            />
          ))
        )}
      </div>

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

export default AdventureBlogs;
