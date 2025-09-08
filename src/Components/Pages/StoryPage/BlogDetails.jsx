// BlogDetails.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import Loader from "../../Loader";
import { Helmet } from "react-helmet";
import DOMPurify from "dompurify";
import { AiFillEdit } from "react-icons/ai";
import Swal from "sweetalert2";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import ImageResize from "quill-image-resize-module-react";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import BlogBottoms from "./BlogBottoms";

Quill.register("modules/imageResize", ImageResize);

const BlogDetails = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [otherBlogs, setOtherBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showModal, setShowModal] = useState(false);
  const [editTime, setEditTime] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editRandom, setEditRandom] = useState("");
  const [longDescription, setLongDescription] = useState("");

  const { user } = useAuth();
  const [isAdmin] = useAdmin();

  const quillRef = useRef();

  const fetchBlog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`https://squirrel-peace-server.onrender.com/blog/slug/${slug}`);
      if (!res.ok) throw new Error("Blog not found");
      const data = await res.json();
      setBlog(data);
      setEditTime(data.blogTime || "");
      setEditDate(data.blogDate || "");
      setEditRandom(data.blogRandom || "");
      setLongDescription(data.blogLongDescription || "");
      setError(null);
    } catch (err) {
      setError(err.message || "Failed to fetch blog.");
    } finally {
      setLoading(false);
    }
  };

  const fetchOtherBlogs = async () => {
    try {
      const res = await fetch("https://squirrel-peace-server.onrender.com/blog");
      if (!res.ok) return;
      const data = await res.json();
      const filtered = data.filter((item) => item.blogSlug !== slug);
      setOtherBlogs(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchBlog();
    fetchOtherBlogs();
  }, [slug]);

  const handleUpdate = async () => {
    const cleaned = DOMPurify.sanitize(longDescription, {
      ADD_TAGS: ["h1", "h2", "h3", "h4", "h5", "h6", "span"],
      ADD_ATTR: ["style", "class"],
      USE_PROFILES: { html: true },
    });

    const updatedBlog = {
      blogTime: editTime,
      blogDate: editDate,
      blogRandom: editRandom,
      blogLongDescription: cleaned,
    };

    try {
      const res = await fetch(`https://squirrel-peace-server.onrender.com/blogDetails/${blog._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBlog),
      });

      const result = await res.json();
      if (result.modifiedCount > 0) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Your blog has been updated",
          showConfirmButton: false,
          timer: 1500,
        });
        setShowModal(false);
        fetchBlog(); // fresh fetch after update
      } else {
        Swal.fire("No change", "Nothing updated.", "info");
      }
    } catch {
      Swal.fire("Error!", "Failed to update blog.", "error");
    }
  };

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire("Error", "Image size should be less than 5MB", "error");
        return;
      }
      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMAGE_HOSTING_KEY}`,
          { method: "POST", body: formData }
        );
        const imgData = await res.json();
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range.index, "image", imgData.data.display_url);
      } catch (err) {
        Swal.fire("Error", "Image upload failed", "error");
        console.error(err);
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: { container: "#toolbar", handlers: { image: imageHandler } },
      clipboard: { matchVisual: false },
      imageResize: { parchment: Quill.import("parchment"), modules: ["Resize", "DisplaySize", "Toolbar"] },
    }),
    []
  );

  const formats = [
    "font", "size", "header", "bold", "italic", "underline", "strike",
    "blockquote", "code-block", "color", "background", "script",
    "list", "bullet", "indent", "align", "link", "image", "video"
  ];

  const cleanLongDescription = DOMPurify.sanitize(blog?.blogLongDescription || "", {
    ADD_TAGS: ["h1", "h2", "h3", "h4", "h5", "h6", "span"],
    ADD_ATTR: ["style", "class"],
    USE_PROFILES: { html: true },
  });

  // responsive otherBlogs slice
  const [otherBlogsSlice, setOtherBlogsSlice] = useState([]);
  useEffect(() => {
    const handleResize = () => {
      setOtherBlogsSlice(window.innerWidth >= 1024 ? otherBlogs.slice(0, 10) : otherBlogs.slice(0, 5));
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [otherBlogs]);

  if (loading) return <Loader />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div key={slug}>
      {/* Helmet */}
      <Helmet>
        <title>{blog?.blogTitle ? `${blog.blogTitle} - Squirrel Peace` : 'Squirrel Peace'}</title>
        <meta
          name="description"
          content={blog?.blogShortDescription ? blog.blogShortDescription.slice(0, 150) : 'Discover inspiring travel Blogs on Squirrel Peace.'}
        />
        <meta property="og:title" content={blog?.blogTitle ? `${blog.blogTitle} - Squirrel Peace` : 'Squirrel Peace'} />
        <meta property="og:description" content={blog?.blogShortDescription ? blog.blogShortDescription.slice(0, 150) : 'Discover inspiring travel Blogs on Squirrel Peace.'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={blog?.blogSlug ? `https://squirrel-peace-71169.web.app/blog/${blog.blogSlug}` : 'https://squirrel-peace-71169.web.app'} />
        <meta property="og:image" content={blog?.blogImage ? blog.blogImage : 'https://your-default-image-url.com/default-image.jpg'} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog?.blogTitle ? `${blog.blogTitle} - Squirrel Peace` : 'Squirrel Peace'} />
        <meta name="twitter:description" content={blog?.blogShortDescription ? blog.blogShortDescription.slice(0, 150) : 'Discover inspiring travel Blogs on Squirrel Peace.'} />
        <meta name="twitter:image" content={blog?.blogImage ? blog.blogImage : 'https://your-default-image-url.com/default-image.jpg'} />
      </Helmet>

      {/* Blog Header */}
      <div
        className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${blog.blogImage})` }}
      >
        <div className="bg-black/60 text-white text-center p-6 w-11/12 sm:w-3/4 md:w-2/3 rounded-2xl">
          <h2 className="text-xl sm:text-3xl font-semibold">{blog.blogTitle}</h2>
          <p className="text-sm mt-3 md:text-base">{blog.blogShortDescription}</p>
        </div>
      </div>

      {/* Blog Meta & Edit Button */}
      <div className="max-w-screen-xl mx-auto px-4 pt-4 mb-2 text-base sm:text-lg">
        <div className="lg:hidden flex flex-col gap-2">
          {user && isAdmin && (
            <button onClick={() => setShowModal(true)} className="btn bg-[#2acb35] text-white w-full flex items-center justify-center gap-2 mb-2 px-4 rounded-md">
              Edit <AiFillEdit />
            </button>
          )}
          <div className="flex justify-between text-gray-700 font-medium">
            <span>{blog?.blogTime || 1} min read</span>
            <span>Publish Date: {blog?.blogDate}</span>
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-between w-full flex-wrap gap-4">
          {user && isAdmin ? (
            <>
              <button onClick={() => setShowModal(true)} className="btn bg-[#2acb35] text-white flex items-center gap-2 px-4 rounded-md">
                Edit <AiFillEdit />
              </button>
              <i className="text-gray-700 font-medium mx-auto">{blog?.blogTime || 3} min read</i>
              <i className="text-gray-700 font-medium">Publish Date: {blog?.blogDate}</i>
            </>
          ) : (
            <>
              <i className="text-gray-700 font-medium">{blog?.blogTime || 1} min read</i>
              <i className="text-gray-700 font-medium ml-auto">Publish Date: {blog?.blogDate}</i>
            </>
          )}
        </div>
      </div>

      {/* Blog Content & Other Blogs */}
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-b border-gray-300 pb-8 mb-5">
          <div className="lg:col-span-2">
            <div className="rich-content" dangerouslySetInnerHTML={{ __html: cleanLongDescription }} />
            <div className="block lg:hidden mt-6 border-t pt-5">
              <BlogBottoms {...blog} />
            </div>
          </div>

          <div className="lg:border-l border-t border-gray-300 md:rounded-tl-xl pt-5 lg:pt-0 pl-0 lg:pl-5">
            <h3 className="text-2xl font-bold text-center pt-2 mb-4">Other Blogs</h3>
            <div className="grid grid-cols-1 gap-4 lg:flex lg:flex-col">
              {otherBlogsSlice.map((item) => (
                <Link key={item.blogSlug} to={`/blog/${item.blogSlug}`}
                  className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group h-70 cursor-pointer"
                >
                  <img src={item.blogImage} alt="blog-img" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>
                  <div className="absolute inset-0 flex flex-col justify-between text-white p-4 z-10">
                    <div className="absolute top-3 left-3 z-20">
                      <span className="text-white text-sm px-4 py-1 rounded-full backdrop-blur-sm">{item.blogDate}</span>
                    </div>
                    <div className="absolute top-3 right-3 z-20">
                      <div className="text-white text-xs px-4 py-1 border border-white rounded-full backdrop-blur-sm">{item.blogCategory}</div>
                    </div>
                    <div className="flex-grow flex flex-col justify-center">
                      <h2 className="text-lg font-bold mb-1 drop-shadow-sm text-left">{item.blogTitle}</h2>
                      <p className="text-sm group-hover:font-medium leading-relaxed drop-shadow-sm transition-all duration-300 text-left line-clamp-3">{item.blogShortDescription}</p>
                    </div>
                    <div>
                      <button className="w-full py-1 border border-white text-white rounded-md transition-all duration-300 hover:scale-105 hover:font-semibold hover:border-[#2acb35]">See More</button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop BlogBottoms */}
      <div className="max-w-screen-xl mx-auto py-5 hidden lg:block">
        <BlogBottoms {...blog} />
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-4 md:p-6 relative max-h-[90vh] flex flex-col">
            <button onClick={() => setShowModal(false)} className="absolute top-3 right-4 text-xl font-bold text-gray-500 hover:text-red-500">✕</button>
            <h2 className="text-xl md:text-2xl font-bold mb-3">Edit Blog</h2>
            <div className="overflow-y-auto flex-grow space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input value={editDate} onChange={(e) => setEditDate(e.target.value)} className="border px-4 py-2 rounded-md w-full" />
                <input value={editRandom} onChange={(e) => setEditRandom(e.target.value)} className="border px-4 py-2 rounded-md w-full" />
                <select value={editTime} onChange={(e) => setEditTime(e.target.value)} className="border px-4 py-2 rounded-md w-full">
                  <option value="">Select Read Time</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
              </div>

              <div className="border rounded-md bg-white">
                <div id="toolbar" className="sticky top-0 z-50 bg-white border-b px-2 py-1">
                  <select className="ql-font" />
                  <select className="ql-size" />
                  <select className="ql-header" />
                  <button className="ql-bold" />
                  <button className="ql-italic" />
                  <button className="ql-underline" />
                  <button className="ql-strike" />
                  <button className="ql-blockquote" />
                  <button className="ql-code-block" />
                  <select className="ql-color" />
                  <select className="ql-background" />
                  <button className="ql-script" value="sub" />
                  <button className="ql-script" value="super" />
                  <button className="ql-list" value="ordered" />
                  <button className="ql-list" value="bullet" />
                  <button className="ql-indent" value="-1" />
                  <button className="ql-indent" value="+1" />
                  <select className="ql-align" />
                  <button className="ql-link" />
                  <button className="ql-image" />
                  <button className="ql-video" />
                  <button className="ql-clean" />
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={longDescription}
                    onChange={setLongDescription}
                    modules={modules}
                    formats={formats}
                    className="bg-white"
                  />
                </div>
              </div>
            </div>
            <button onClick={handleUpdate} className="mt-4 bg-[#2acb35] text-white px-6 py-2 rounded-md font-semibold hover:scale-105 transition">
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetails;
