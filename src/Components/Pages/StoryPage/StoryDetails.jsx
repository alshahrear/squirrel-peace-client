// StoryDetails.jsx
import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useMemo, useRef } from "react";
import StoryBottoms from "./StoryBottoms";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import Loader from "../../../Components/Loader";
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

Quill.register("modules/imageResize", ImageResize);

const StoryDetails = () => {
  const { id } = useParams();
  const [story, setStory] = useState(null);
  const [otherStories, setOtherStories] = useState([]);
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

  useEffect(() => {
    window.scrollTo(0, 0);
    fetch(`https://squirrelpeace.com/api//story/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setStory(data);
        setEditTime(data.storyTime || "");
        setEditDate(data.storyDate || "");
        setEditRandom(data.storyRandom || "");
        setLongDescription(data.storyLongDescription || "");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to fetch story.");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    fetch("https://squirrelpeace.com/api//story")
      .then((res) => res.json())
      .then((data) => {
        const filtered = data.filter((item) => item._id !== id);
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setOtherStories(shuffled);
      });
  }, [id]);

  const handleUpdate = async () => {
    const cleaned = DOMPurify.sanitize(longDescription, {
      ADD_TAGS: ["h1", "h2", "h3", "h4", "h5", "h6", "span"],
      ADD_ATTR: ["style", "class"],
      USE_PROFILES: { html: true },
    });

    const updatedStory = {
      storyTime: editTime,
      storyDate: editDate,
      storyRandom: editRandom,
      storyLongDescription: cleaned,
    };

    try {
      const res = await fetch(`https://squirrelpeace.com/api//storyDetails/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedStory),
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
        setStory({ ...story, ...updatedStory });
        setShowModal(false);
      } else {
        Swal.fire("No change", "Nothing updated.", "info");
      }
    } catch {
      Swal.fire("Error!", "Failed to update story.", "error");
    }
  };

  const imageHandler = () => {
    const input = document.createElement("input");
    input.setAttribute("type", "file");
    input.setAttribute("accept", "image/*");
    input.click();
    input.onchange = async () => {
      const file = input.files[0];
      const formData = new FormData();
      formData.append("image", file);

      try {
        const res = await fetch(
          `https://api.imgbb.com/1/upload?key=${import.meta.env.VITE_IMAGE_HOSTING_KEY}`,
          {
            method: "POST",
            body: formData,
          }
        );
        const imgData = await res.json();
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range.index, "image", imgData.data.display_url);
      } catch (err) {
        console.error("Image upload failed", err);
      }
    };
  };

  const modules = useMemo(
    () => ({
      toolbar: {
        container: "#toolbar",
        handlers: { image: imageHandler },
      },
      clipboard: { matchVisual: false },
      imageResize: {
        parchment: Quill.import("parchment"),
        modules: ["Resize", "DisplaySize", "Toolbar"],
      },
    }),
    []
  );

  const formats = [
    "font", "size", "header", "bold", "italic", "underline", "strike",
    "blockquote", "code-block", "color", "background", "script",
    "list", "bullet", "indent", "align", "link", "image", "video"
  ];

  const cleanLongDescription = DOMPurify.sanitize(story?.storyLongDescription || "", {
    ADD_TAGS: ["h1", "h2", "h3", "h4", "h5", "h6", "span"],
    ADD_ATTR: ["style", "class"],
    USE_PROFILES: { html: true },
  });

  if (loading) return <Loader />;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;

  return (
    <div key={id}>
      <Helmet>
        <title>{story?.storyTitle ? `${story.storyTitle} - Squirrel Peace` : 'Squirrel Peace'}</title>

        <meta
          name="description"
          content={
            story?.storyShortDescription
              ? story.storyShortDescription.slice(0, 150)
              : 'Discover inspiring travel stories on Squirrel Peace.'
          }
        />

        {/* Open Graph for Facebook, LinkedIn, WhatsApp */}
        <meta property="og:title" content={story?.storyTitle ? `${story.storyTitle} - Squirrel Peace` : 'Squirrel Peace'} />
        <meta
          property="og:description"
          content={
            story?.storyShortDescription
              ? story.storyShortDescription.slice(0, 150)
              : 'Discover inspiring travel stories on Squirrel Peace.'
          }
        />
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={story?._id ? `https://squirrel-peace-71169.web.app/story/${story._id}` : 'https://squirrel-peace-71169.web.app'}
        />
        <meta
          property="og:image"
          content={
            story?.storyImage
              ? story.storyImage
              : 'https://your-default-image-url.com/default-image.jpg'
          }
        />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={story?.storyTitle ? `${story.storyTitle} - Squirrel Peace` : 'Squirrel Peace'} />
        <meta
          name="twitter:description"
          content={
            story?.storyShortDescription
              ? story.storyShortDescription.slice(0, 150)
              : 'Discover inspiring travel stories on Squirrel Peace.'
          }
        />
        <meta
          name="twitter:image"
          content={
            story?.storyImage
              ? story.storyImage
              : 'https://your-default-image-url.com/default-image.jpg'
          }
        />
      </Helmet>

      <div
        className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] bg-cover bg-center flex items-center justify-center"
        style={{ backgroundImage: `url(${story.storyImage})` }}
      >
        <div className="bg-black/60 text-white text-center p-6 w-11/12 sm:w-3/4 md:w-2/3 rounded-2xl">
          <h2 className="text-xl sm:text-3xl font-semibold">
            {story.storyTitle}
          </h2>
          <p className="text-sm mt-3 md:text-base">{story.storyShortDescription}</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 pt-4 mb-2 text-base sm:text-lg">
        {/* Mobile Layout */}
        <div className="lg:hidden flex flex-col gap-2">
          {user && isAdmin && (
            <button
              onClick={() => setShowModal(true)}
              className="btn bg-[#2acb35] text-white w-full flex items-center justify-center gap-2 mb-2 px-4 rounded-md"
            >
              Edit <AiFillEdit />
            </button>
          )}
          <div className="flex justify-between text-gray-700 font-medium">
            <span>{story?.storyTime || 1} min read</span>
            <span>Publish Date: {story?.storyDate}</span>
          </div>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:flex items-center justify-between w-full flex-wrap gap-4">
          {user && isAdmin ? (
            <>
              <button
                onClick={() => setShowModal(true)}
                className="btn bg-[#2acb35] text-white flex items-center gap-2 px-4 rounded-md"
              >
                Edit <AiFillEdit />
              </button>
              <i className="text-gray-700 font-medium mx-auto">
                {story?.storyTime || 3} min read
              </i>
              <i className="text-gray-700 font-medium">
                Publish Date: {story?.storyDate}
              </i>
            </>
          ) : (
            <>
              <i className="text-gray-700 font-medium">
                {story?.storyTime || 1} min read
              </i>
              <i className="text-gray-700 font-medium ml-auto">
                Publish Date: {story?.storyDate}
              </i>
            </>
          )}
        </div>
      </div>


      <div className="max-w-screen-xl mx-auto px-4 ">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 border-b border-gray-300 pb-8 mb-5">
          <div className="lg:col-span-2">
            <div className="rich-content " dangerouslySetInnerHTML={{ __html: cleanLongDescription }} />
            <div className="block lg:hidden mt-6 border-t pt-5">
              <StoryBottoms {...story} />
            </div>
          </div>

          <div className="lg:border-l border-t border-gray-300 md:rounded-tl-xl pt-5 lg:pt-0 pl-0 lg:pl-5">
            <h3 className="text-2xl font-bold text-center pt-2 mb-4">
              Other Stories
            </h3>
            <div className="grid grid-cols-1 gap-4 lg:flex lg:flex-col">
              {(window.innerWidth >= 1024 ? otherStories.slice(0, 10) : otherStories.slice(0, 5)).map((item) => (
                <Link
                  key={item._id}
                  to={`/story/${item._id}`}
                  className="relative rounded-2xl overflow-hidden shadow-md transform transition duration-300 hover:scale-105 group h-70 cursor-pointer"
                >
                  <img
                    src={item.storyImage}
                    alt="story-img"
                    className="w-full h-full object-cover"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/30 backdrop-brightness-90"></div>

                  {/* Overlay Content */}
                  <div className="absolute inset-0 flex flex-col justify-between text-white p-4 z-10">
                    {/* Top Left (Date) */}
                    <div className="absolute top-3 left-3 z-20">
                      <span className="text-white text-sm px-4 py-1 rounded-full backdrop-blur-sm">
                        {item.storyDate}
                      </span>
                    </div>

                    {/* Top Right (Category) */}
                    <div className="absolute top-3 right-3 z-20">
                      <div className="text-white text-xs px-4 py-1 border border-white rounded-full backdrop-blur-sm">
                        {item.storyCategory}
                      </div>
                    </div>

                    {/* Middle (Title + Description) */}
                    <div className="flex-grow flex flex-col justify-center">
                      <h2 className="text-lg font-bold mb-1 drop-shadow-sm text-left">
                        {item.storyTitle}
                      </h2>
                      <p className="text-sm group-hover:font-medium leading-relaxed drop-shadow-sm transition-all duration-300 text-left line-clamp-3">
                        {item.storyShortDescription}
                      </p>
                    </div>

                    {/* Bottom (See More button) */}
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

      <div className="max-w-screen-xl mx-auto py-5 hidden lg:block">
        <StoryBottoms {...story} />
      </div>

      <BlogAll />

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center px-4">
          <div className="bg-white w-full max-w-3xl rounded-xl shadow-xl p-4 md:p-6 relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-4 text-xl font-bold text-gray-500 hover:text-red-500"
            >
              ✕
            </button>
            <h2 className="text-xl md:text-2xl font-bold mb-3">Edit Story</h2>
            <div className="overflow-y-auto flex-grow space-y-4 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="border px-4 py-2 rounded-md w-full"
                />
                <input
                  value={editRandom}
                  onChange={(e) => setEditRandom(e.target.value)}
                  className="border px-4 py-2 rounded-md w-full"
                />
                <select
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="border px-4 py-2 rounded-md w-full"
                >
                  <option value="">Select Read Time</option>
                  {[...Array(10)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
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
            <button
              onClick={handleUpdate}
              className="mt-4 bg-[#2acb35] text-white px-6 py-2 rounded-md font-semibold hover:scale-105 transition"
            >
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoryDetails;