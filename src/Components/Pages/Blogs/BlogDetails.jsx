import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import BlogBottoms from "./BlogBottoms";

const BlogDetails = () => {
    const { id } = useParams();
    const [blog, setBlog] = useState(null);
    const [otherBlogs, setOtherBlogs] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetch(`http://localhost:5000/blog/${id}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setBlog(data[0]);
                } else if (data?._id) {
                    setBlog(data);
                } else if (data?.data?._id) {
                    setBlog(data.data);
                } else {
                    setError("Unexpected data format.");
                }
            })
            .catch(() => setError("Failed to fetch blog."));
    }, [id]);

    useEffect(() => {
        if (!blog?.blogCategory) return;

        fetch("http://localhost:5000/blog")
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const filtered = data.filter(item =>
                        item._id !== blog._id &&
                        item.blogCategory === blog.blogCategory
                    );
                    setOtherBlogs(filtered);
                }
            })
            .catch(() => {
                console.warn("Failed to fetch other blogs.");
            });
    }, [blog]);

    if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
    if (!blog) return <div className="text-center py-10">Loading...</div>;

    return (
        <div key={id}>
            {/* Top Banner */}
            <div
                className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
                style={{ backgroundImage: `url(${blog.blogImage})` }}
            >
                <div className="bg-black/60 text-white text-center p-10 w-3/5 rounded-3xl">
                    <h2 className="text-3xl font-semibold mb-4 tracking-wide">{blog.blogTitle}</h2>
                    <p className="text-sm md:text-base text-gray-200 leading-relaxed">
                        {blog.blogShortDescription}
                    </p>
                </div>
            </div>

            <em className="flex justify-end pt-3 max-w-screen-xl mx-auto text-lg font-semibold">
                Publish Date: {blog.blogDate}
            </em>

            {/* Main Content */}
            <div className="flex flex-col lg:flex-row max-w-screen-xl mx-auto py-5 px-4 gap-8 border-b border-gray-300 mb-5">
                {/* Blog Content */}
                <div className="lg:w-2/3">
                    <h2 className="text-3xl font-bold mb-4">{blog.blogTitle}</h2>
                    <div
                        className="text-gray-700 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: blog.blogLongDescription }}
                    />
                </div>

                {/* Sidebar - Other Blogs */}
                <div className="lg:w-1/3 grid gap-6 border-l border-t pl-5 pt-3 border-gray-300 rounded-l-2xl">
                    <h3 className="text-2xl font-bold text-center -mb-3">Other Blogs</h3>
                    {otherBlogs.slice(0, 10).map(item => (
                        <Link
                            key={item._id}
                            to={`/blog/${item._id}`}
                            className="group relative rounded-xl overflow-hidden shadow-md hover:scale-[1.02] transition-transform duration-300"
                        >
                            <img
                                src={item.blogImage}
                                alt={item.blogTitle}
                                className="w-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />

                            {/* Category badge */}
                            <div className="absolute top-3 right-3 z-20">
                                <div className="text-white text-xs px-4 py-2 border border-white rounded-full">
                                    {item.blogCategory}
                                </div>
                            </div>

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-6 text-left">
                                <div className="flex-grow flex flex-col justify-center">
                                    <h2 className="text-xl font-bold text-white mb-2 drop-shadow">{item.blogTitle}</h2>
                                    <p className="text-sm text-gray-200 drop-shadow-sm">{item.blogDescription}</p>
                                </div>
                                <div>
                                    <button className="w-full py-1 border border-white text-white rounded-md transition-all duration-300 hover:scale-105 hover:font-semibold hover:border-[#2acb35]">
                                        See More
                                    </button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Comment Form */}
            <div className="max-w-screen-xl mx-auto py-5">
                <BlogBottoms 
                    blogId={blog._id}
                    blogTitle={blog.blogTitle}
                    blogCategory={blog.blogCategory}
                    blogImage={blog.blogImage}
                />
            </div>
        </div>
    );
};

export default BlogDetails;
