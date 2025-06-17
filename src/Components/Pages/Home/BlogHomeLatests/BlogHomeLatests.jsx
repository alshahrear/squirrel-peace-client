import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BlogHomeLatest from './BlogHomeLatest';
import Loader from '../../../../Components/Loader';

const BlogHomeLatests = () => {
    const [blogs, setBlogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const getRandomByCategory = (arr, category, count) => {
        const filtered = arr.filter(blog => blog.blogCategory === category);
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    useEffect(() => {
        fetch('http://localhost:5000/blog')
            .then(res => res.json())
            .then(data => {
                const result = new Map();

                const travel = getRandomByCategory(data, "Travel", 3);
                const lifestyle = getRandomByCategory(data, "Life Style", 3);
                const health = getRandomByCategory(data, "Health", 3);

                [...travel, ...lifestyle, ...health].forEach(blog => {
                    result.set(blog._id, blog);
                });

                const limitedResult = Array.from(result.values()).slice(0, 9);
                setBlogs(limitedResult);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error loading blogs:", error);
                setLoading(false);
            });
    }, []);

    const handleDeleteFromUI = (id) => {
        const updated = blogs.filter(blog => blog._id !== id);
        setBlogs(updated);
    };

    const handleUpdateFromUI = (id, updatedData) => {
        const updated = blogs.map(blog =>
            blog._id === id ? { ...blog, ...updatedData } : blog
        );
        setBlogs(updated);
    };

    return (
        <div className="max-w-screen-xl mx-auto py-10">
            <div className="pb-10">
                <div className="flex justify-between items-center relative">
                    <h2 className="text-2xl font-bold text-center w-full">
                        Our <span className="text-[#2acb35]">Latest Blog</span>
                    </h2>
                    <div className="dropdown dropdown-hover absolute right-4 sm:right-10 z-20">
                        <div
                            tabIndex={0}
                            role="button"
                            className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition"
                        >
                            View All
                        </div>
                        <ul
                            tabIndex={0}
                            className="dropdown-content menu bg-base-100 font-semibold rounded-box shadow -mt-1 w-40"
                        >
                            <li><NavLink to="/lifeStyle" className="hover:text-[#2acb35]">Life Style</NavLink></li>
                            <li><NavLink to="/travel" className="hover:text-[#2acb35]">Travel</NavLink></li>
                            <li><NavLink to="/health" className="hover:text-[#2acb35]">Health</NavLink></li>
                        </ul>
                    </div>
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
                            blogs.map(latestBlog => (
                                <BlogHomeLatest
                                    key={latestBlog._id}
                                    latestBlog={latestBlog}
                                    onDelete={handleDeleteFromUI}
                                    onUpdate={handleUpdateFromUI}
                                />
                            ))
                        }
                    </div>
                )
            }
        </div>
    );
};

export default BlogHomeLatests;
