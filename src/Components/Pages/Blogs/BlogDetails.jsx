import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import BlogBottoms from "./BlogBottoms";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import Loader from "../../../Components/Loader";
import { Helmet } from "react-helmet";

const BlogDetails = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [otherBlogs, setOtherBlogs] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    fetch(`https://squirrel-peace-server.onrender.com/blog/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBlog(data[0]);
        } else if (data._id) {
          setBlog(data);
        } else if (data.data && data.data._id) {
          setBlog(data.data);
        } else {
          setError("Unexpected data format.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch blog.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetch("https://squirrel-peace-server.onrender.com/blog")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const filtered = data.filter((item) => item._id !== id);
          const shuffled = filtered.sort(() => 0.5 - Math.random());
          setOtherBlogs(shuffled);
        }
      });
  }, [id]);

  if (loading) return <Loader />;
  if (error)
    return (
      <div className="text-center text-red-500 py-10">
        {error}
      </div>
    );
  if (!blog)
    return <div className="text-center py-10">No blog found.</div>;

  return (
    <div key={id}>
      <Helmet>
        <title>{blog.blogTitle} - Storial Peace</title>
      </Helmet>

      {/* Top Banner */}
      <div
        className="relative w-full h-[450px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${blog.blogImage})` }}
      >
        <div className="bg-black/60 text-white text-center p-10 w-11/12 sm:w-3/5 rounded-3xl">
          <h2 className="text-2xl sm:text-3xl font-semibold mb-4 tracking-wide">
            {blog.blogTitle}
          </h2>
          <p className="text-sm md:text-base text-gray-200 leading-relaxed">
            {blog.blogShortDescription}
          </p>
        </div>
      </div>

      <em className="flex justify-end pt-3 max-w-screen-xl mx-auto text-base sm:text-lg font-semibold pr-5">
        Publish Date: {blog.blogDate}
      </em>

      {/* Main Content */}
      <div className="max-w-screen-xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-b border-gray-300 pb-8 mb-5">
          {/* Main blog */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              {blog.blogTitle}
            </h2>
            <div
              className="text-gray-700 leading-relaxed whitespace-pre-line"
              dangerouslySetInnerHTML={{ __html: blog.blogLongDescription }}
            />

            {/* Show BlogBottoms only on mobile/tablet */}
            <div className="block lg:hidden mt-6 border-t border-gray-300 pt-5">
              <BlogBottoms
                blogId={blog._id}
                blogTitle={blog.blogTitle}
                blogCategory={blog.blogCategory}
                blogImage={blog.blogImage}
              />
            </div>
          </div>

          {/* Sidebar - Other blogs */}
          <div className="border-t lg:border-t lg:border-l border-gray-300 pt-5 lg:pt-0 pl-0 lg:pl-5 rounded-tl-0 md:rounded-tl-2xl">
            <h3 className="text-xl sm:text-2xl font-bold text-center mb-4">
              Other Blogs
            </h3>

            {/* Responsive Layout: 1 per row on mobile, vertical list on laptop */}
            <div
              className={
                windowWidth < 1024
                  ? "grid grid-cols-1 gap-4"
                  : "flex flex-col gap-4"
              }
            >
              {(windowWidth < 1024
                ? otherBlogs.slice(0, 6)
                : otherBlogs.slice(0, 10)
              ).map((item) => (
                <Link
                  key={item._id}
                  to={`/blog/${item._id}`}
                  className="group h-64 sm:h-72 relative rounded-xl overflow-hidden shadow-md hover:scale-[1.02] transition-transform duration-300"
                >
                  <img
                    src={item.blogImage}
                    alt={item.blogTitle}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />

                  {/* Top-left: blogDate */}
                  <div className="absolute top-3 left-3 z-20">
                    <div className="text-white text-sm px-4 py-1 rounded-full backdrop-blur-sm">
                      {item.blogDate}
                    </div>
                  </div>

                  {/* Top-right: blogCategory */}
                  <div className="absolute top-3 right-3 z-20">
                    <div className="text-white text-xs px-4 py-1 border border-white rounded-full backdrop-blur-sm">
                      {item.blogCategory}
                    </div>
                  </div>

                  {/* Overlay content */}
                  <div className="absolute inset-0 bg-black/50 flex flex-col justify-between p-4 sm:p-6 text-left">
                    <div className="flex-grow flex flex-col justify-center">
                      <h2 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2 drop-shadow">
                        {item.blogTitle}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-200 drop-shadow-sm line-clamp-3">
                        {item.blogShortDescription}
                      </p>
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
        </div>
      </div>

      {/* Bottom for laptop only */}
      <div className="max-w-screen-xl mx-auto py-5 hidden lg:block">
        <BlogBottoms
          blogId={blog._id}
          blogTitle={blog.blogTitle}
          blogCategory={blog.blogCategory}
          blogImage={blog.blogImage}
        />
      </div>

      <div>
        <BlogAll />
      </div>
    </div>
  );
};

export default BlogDetails;
