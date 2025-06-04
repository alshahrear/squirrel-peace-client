import { NavLink } from 'react-router-dom';
import { useEffect, useState } from 'react';
import LifeBlog from './LifeBlog';
import useAuth from '../../../Layout/useAuth';
import useAdmin from '../../../../hooks/useAdmin';

const LifeBlogs = () => {
    const [blogs, setBlogs] = useState([]);
    const { user } = useAuth();
    const [isAdmin] = useAdmin();

    useEffect(() => {
        fetch('http://localhost:5000/blog')
            .then(res => res.json())
            .then(data => {
                setBlogs(data);
            })
            .catch(error => {
                console.error("Error loading blogs:", error);
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

    return (
        <div className="max-w-screen-xl mx-auto py-10">
            <div className="pb-10">
                <div className="flex justify-between items-center relative">
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
                    blogs
                        .filter(blog => blog.blogCategory === "Life Style")
                        .reverse()
                        .map(lifeBlog => (
                            <LifeBlog
                                key={lifeBlog._id}
                                lifeBlog={lifeBlog}
                                onDelete={handleDeleteFromUI}
                                onUpdate={handleUpdateFromUI}
                            />
                        ))
                }
            </div>
        </div>
    );
};

export default LifeBlogs;
