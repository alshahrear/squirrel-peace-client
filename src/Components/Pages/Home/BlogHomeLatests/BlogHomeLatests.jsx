import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import BlogHomeLatest from './BlogHomeLatest';

const BlogHomeLatests = () => {
    const [blogs, setBlogs] = useState([]);

    // ক্যাটাগরি অনুযায়ী নির্দিষ্ট blog নিতে
    const getRandomByCategory = (arr, category, count) => {
        const filtered = arr.filter(blog => blog.blogCategory === category);
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    };

    useEffect(() => {
        fetch('http://localhost:5000/blog')
            .then(res => res.json())
            .then(data => {
                const result = [];
                for (let i = 0; i < 3; i++) {
                    const travel = getRandomByCategory(data, "Travel", 1);
                    const lifestyle = getRandomByCategory(data, "Life Style", 1);
                    const health = getRandomByCategory(data, "Health", 1);
                    result.push(...travel, ...lifestyle, ...health);
                }

                // সর্বোচ্চ ৯টি blog রাখবে
                const limitedResult = result.slice(0, 9);
                setBlogs(limitedResult);
            })
            .catch(error => {
                console.error("Error loading blogs:", error);
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
                    <NavLink to="/blogPageAdmin" className="absolute right-4 sm:right-10">
                        <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                            Add Blog
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
        </div>
    );
};

export default BlogHomeLatests;
