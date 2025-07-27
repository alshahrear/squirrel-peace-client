// DraftBlogAdmin.jsx
import { useForm } from "react-hook-form";
import { useState, useMemo, useRef } from "react";
import useAuth from "../../Layout/useAuth";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import Quill from "quill";
import ImageResize from "quill-image-resize-module-react";
import { FaSpinner } from "react-icons/fa";
import DraftBlogs from "./DraftBlogs";
import contactBannerDefault from "../../../assets/newsletter2.jpg";

Quill.register("modules/imageResize", ImageResize);

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const DraftBlogAdmin = () => {
  const { user } = useAuth();
  const axiosPublic = useAxiosPublic();
  const { register, handleSubmit, reset } = useForm();

  const today = dayjs().format("YYYY-MM-DD");
  const [blogDate, setBlogDate] = useState(today);
  const [readTime, setReadTime] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [blogs, setBlogs] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ নতুন ব্যানার প্রিভিউ স্টেট
  const [contactBanner, setContactBanner] = useState(contactBannerDefault);

  // ✅ ইনপুট থেকে ছবি নিলে লোকাল প্রিভিউ সেট করা
  const handleBannerChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setContactBanner(imageUrl);
    }
  };

  const quillRef = useRef();

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
        const res = await fetch(image_hosting_api, {
          method: "POST",
          body: formData,
        });
        const imgData = await res.json();
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range.index, "image", imgData.data.display_url);
      } catch (err) {
        console.error("Image upload failed", err);
        Swal.fire("Error", "Image upload failed.", "error");
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
    "font",
    "size",
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "blockquote",
    "code-block",
    "color",
    "background",
    "script",
    "list",
    "bullet",
    "indent",
    "align",
    "link",
    "image",
    "video",
  ];

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    // longDescription validation
    if (
      !longDescription ||
      longDescription.trim() === "" ||
      longDescription === "<p><br></p>"
    ) {
      Swal.fire({
        icon: "error",
        title: "Long Description Required",
        text: "Please write the full story before submitting.",
      });
      setIsSubmitting(false);
      return;
    }

    const imageFile = new FormData();
    imageFile.append("image", data.storyImage[0]);

    try {
      const imageRes = await axiosPublic.post(image_hosting_api, imageFile, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = imageRes.data?.data?.display_url;
      if (!imageUrl) throw new Error("Image upload failed");

      const formattedDate = dayjs(blogDate).format("D MMMM, YYYY");

      const blogData = {
        storyTitle: data.storyTitle,
        storyCategory: data.storyCategory,
        storyRandom: data.storyRandom,
        storyDate: formattedDate,
        storyTime: readTime,
        storyImage: imageUrl,
        storyShortDescription: data.storyShortDescription,
        storyLongDescription: longDescription,
      };

      const res = await axiosPublic.post("/draft", blogData);

      if (res.data?.insertedId) {
        const newBlog = { _id: res.data.insertedId, ...blogData };
        setBlogs((prev) => [newBlog, ...prev]);

        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Your draft has been added",
          showConfirmButton: false,
          timer: 1500,
        });

        reset();
        setBlogDate(today);
        setReadTime("");
        setLongDescription("");
        setContactBanner(contactBannerDefault); // চাইলে ডিফল্টে ফিরিয়ে দিতে পারেন
      } else {
        throw new Error("Failed to save draft");
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Something went wrong!",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="">
      {/* 🔴 ব্যানার প্রিভিউ */}
      {/* ব্যানার */}
      <div
        className="h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: `url(${contactBanner})` }}
      >
        <div className="absolute inset-0 bg-black/20"></div>
      </div>

      {/* রেসপনসিভ ইনপুট ফিল্ড */}
      <div className="mt-6 px-4 flex justify-center">
        <input
          type="file"
          accept="image/*"
          {...register("storyBanner")}
          onChange={handleBannerChange}
          className="file-input file-input-ghost w-full max-w-xs sm:max-w-sm md:max-w-md border border-gray-300 shadow-sm"
        />
      </div>

      {/* বাকিটা অপরিবর্তিত */}
      <div className="max-w-screen-xl mx-auto px-4 my-10">
        <div className="text-center space-y-2 mb-10">
          <h1 className="text-3xl font-semibold">
            Welcome{" "}
            <i className="text-[#2acb35]">{user.displayName}</i> to the Draft
            Blog Panel
          </h1>
          <p className="max-w-5xl mx-auto">
            This is where you can upload and review blog drafts before they are finally approved for publishing. Carefully check all content, formatting, and details to ensure quality and accuracy. Only after final approval, the blogs will be moved from here to the main blog or story sections. Your thorough review helps maintain the high standard of our website.
          </p>
        </div>

        <div className="my-10">
          <DraftBlogs stories={blogs} setStories={setBlogs} />
        </div>

        <div className="w-full lg:w-2/3 mx-auto text-base">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input
                {...register("storyTitle", { required: true })}
                placeholder="Story Title*"
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              />
              <input
                {...register("storyCategory", { required: true })}
                placeholder="Story Category*"
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input
                {...register("storyRandom", { required: true })}
                placeholder="Story Random (xyz)*"
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              />

              <select
                {...register("storyTime", { required: true })}
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              >
                <option value="" disabled>
                  Story Read Time*
                </option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <textarea
              rows="2"
              {...register("storyShortDescription", { required: true })}
              placeholder="Story Short Description..."
              className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <input
                type="file"
                {...register("storyImage", { required: true })}
                className="file-input file-input-ghost w-full"
              />
              <input
                type="date"
                value={blogDate}
                onChange={(e) => setBlogDate(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
                required
              />
            </div>

            {/* Editor */}
            <div className="border rounded-md bg-white">
              <div
                id="toolbar"
                className="sticky top-0 z-50 bg-white border-b px-2 py-1"
              >
                {/* toolbar buttons unchanged */}
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

              <div className="max-h-[500px] overflow-y-auto">
                <ReactQuill
                  ref={quillRef}
                  theme="snow"
                  value={longDescription}
                  onChange={setLongDescription}
                  modules={modules}
                  formats={formats}
                  placeholder="Write your full story with formatting, links, images, videos, etc..."
                  className="bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  Adding Draft <FaSpinner className="animate-spin" />
                </>
              ) : (
                "Add Draft"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DraftBlogAdmin;