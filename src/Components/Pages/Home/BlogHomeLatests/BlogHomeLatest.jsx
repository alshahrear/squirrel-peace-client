import 'animate.css';
import { useInView } from 'react-intersection-observer';
import { useState } from "react";
import { ImCross } from "react-icons/im";
import { LuMessageCircleMore } from 'react-icons/lu';
import { FcLike } from 'react-icons/fc';

const BlogHomeLatest = ({ latestBlog }) => {
    const { _id, blogTitle, blogCategory, blogImage, blogDescription } = latestBlog;

    const [hovered, setHovered] = useState(false);
    const [formData, setFormData] = useState({
        blogTitle,
        blogCategory,
        blogImage,
        blogDescription
    });

    const { ref, inView } = useInView({
        triggerOnce: true,
        threshold: 0.2,
    });


    return (
        <div
            className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            <img src={blogImage} alt="blog-img" className="w-full h-80 object-cover" />
            <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

            {/* Main content */}
            <div
    ref={ref}
    className={`absolute inset-0 flex flex-col justify-between text-white p-6 z-10 ${inView ? "animate__animated animate__zoomInUp" : ""}`}
>
    {/* Top right category */}
    <div className="absolute top-4 right-4 text-white text-xs px-4 py-2 border border-white rounded-full z-20">
        {blogCategory}
    </div>

    {/* Centered content with left alignment */}
    <div className="flex-1 flex flex-col justify-center text-left">
        <h2 className="text-xl font-bold mb-2 drop-shadow-sm">{blogTitle}</h2>
        <p className="text-sm group-hover:font-medium mb-4 leading-relaxed drop-shadow-sm transition-all duration-300">
            {blogDescription}
        </p>
    </div>

    {/* See More Button at bottom */}
    <button
        className="w-full px-4 mt-3 py-2 text-white border border-white rounded-md transition-all duration-300 hover:scale-110 hover:font-semibold hover:border-[#2acb35] bg-transparent"
    >
        See More
    </button>
</div>


            {/* Edit Modal */}
            <dialog id={`edit_modal_${_id}`} className="modal">
                <div className="modal-box w-11/12 max-w-2xl">
                    <form method="dialog">
                        <button className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2">
                            <ImCross />
                        </button>
                    </form>
                    <p className="text-2xl font-semibold mb-5 text-center">
                        Edit your <span className="text-[#2acb35]">Blog</span>
                    </p>

                    <form className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="blogTitle"
                                value={formData.blogTitle}
                                onChange={e => setFormData({ ...formData, blogTitle: e.target.value })}
                                placeholder="Blog Title"
                                className="w-full p-3 border rounded-md"
                                required
                            />
                            <select
                                name="blogCategory"
                                value={formData.blogCategory}
                                onChange={e => setFormData({ ...formData, blogCategory: e.target.value })}
                                required
                                className="w-full p-3 border rounded-md"
                            >
                                <option value="" disabled>Choose Blog Category</option>
                                <option value="Life Style">Life Style</option>
                                <option value="Travel">Travel</option>
                                <option value="Health">Health</option>
                            </select>
                        </div>

                        <input
                            type="text"
                            name="blogImage"
                            value={formData.blogImage}
                            onChange={e => setFormData({ ...formData, blogImage: e.target.value })}
                            placeholder="Image URL"
                            className="w-full p-3 border rounded-md"
                            required
                        />

                        <textarea
                            rows="4"
                            name="blogDescription"
                            value={formData.blogDescription}
                            onChange={e => setFormData({ ...formData, blogDescription: e.target.value })}
                            placeholder="Blog Description..."
                            className="w-full p-3 border rounded-md"
                            required
                        ></textarea>

                        <button type="submit" className="btn w-full bg-[#2acb35] text-white font-semibold py-3 rounded-full hover:bg-[#59ca59] transition duration-300">
                            Update Blog
                        </button>
                    </form>
                </div>
            </dialog>
        </div>
    );
};

export default BlogHomeLatest;
