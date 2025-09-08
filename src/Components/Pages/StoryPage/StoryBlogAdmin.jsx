// StoryBlogAdmin.jsx
import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useAuth from '../../Layout/useAuth';
import { useForm } from 'react-hook-form';
import useAxiosPublic from '../../../hooks/useAxiosPublic';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import DOMPurify from 'dompurify';
import { FaSpinner } from 'react-icons/fa';
import { Helmet } from 'react-helmet';
import 'react-quill/dist/quill.snow.css';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module-react';

Quill.register('modules/imageResize', ImageResize);

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const StoryBlogAdmin = () => {
  const { user } = useAuth();
  const axiosPublic = useAxiosPublic();
  const { register, handleSubmit, reset } = useForm();
  const today = dayjs().format("YYYY-MM-DD");

  const [storyDate, setStoryDate] = useState(today);
  const [longDescription, setLongDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLongDescriptionChange = (content, delta, source, editor) => {
    const cleaned = DOMPurify.sanitize(editor.getHTML(), {
      FORBID_ATTR: ['style'],
      ALLOWED_TAGS: [
        'p', 'br', 'b', 'i', 'u', 'strong', 'em', 'a', 'ul', 'ol', 'li',
        'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'img', 'video', 'iframe', 'span', 'div', 'sub', 'sup', 'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'href', 'target', 'src', 'alt', 'width', 'height', 'frameborder',
        'allowfullscreen', 'class', 'title', 'controls', 'type'
      ]
    });
    setLongDescription(cleaned);
  };

  const onSubmit = async (data) => {
    if (!longDescription || longDescription.trim() === '' || longDescription === '<p><br></p>') {
      Swal.fire({
        icon: 'error',
        title: 'Long Description Required',
        text: 'Please write your full blog in the long description field.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('image', data.storyImage[0]);

      const imageRes = await axiosPublic.post(image_hosting_api, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      const imageUrl = imageRes.data?.data?.display_url;
      if (!imageUrl) throw new Error("Image upload failed");

      const formattedDate = dayjs(storyDate).format("D MMMM, YYYY");

      const storyData = {
        storyTitle: data.storyTitle,
        storyCategory: data.storyCategory,
        storyRandom: data.storyRandom,
        storyTime: data.storyTime,
        storyDate: formattedDate,
        storyImage: imageUrl,
        storyShortDescription: data.storyShortDescription,
        storyLongDescription: longDescription,
      };

      const res = await axiosPublic.post('/story', storyData);

      if (res.data?.insertedId) {
        Swal.fire({
          position: "top-end",
          icon: "success",
          title: "Your blog has been added",
          showConfirmButton: false,
          timer: 1500
        });
        reset();
        setStoryDate(today);
        setLongDescription('');
      } else {
        throw new Error("Failed to save blog");
      }

    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Something went wrong!"
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  const quillRef = useMemo(() => React.createRef(), []);

  const imageHandler = () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('image', file);

      try {
        const res = await axiosPublic.post(image_hosting_api, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        const imageUrl = res.data?.data?.display_url;
        const quill = quillRef.current.getEditor();
        const range = quill.getSelection();
        quill.insertEmbed(range.index, 'image', imageUrl);
      } catch (err) {
        console.error("Image upload failed", err);
      }
    };
  };

  const modules = useMemo(() => ({
    toolbar: {
      container: '#toolbar',
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: {
      matchVisual: false
    },
    imageResize: {
      parchment: Quill.import('parchment'),
      modules: ['Resize', 'DisplaySize', 'Toolbar']
    }
  }), []);

  const formats = [
    'font', 'size', 'header', 'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block', 'color', 'background',
    'script', 'list', 'bullet', 'indent', 'align',
    'link', 'image', 'video'
  ];

  return (
    <div className="my-12 max-w-screen-xl mx-auto text-center space-y-2 px-3 sm:px-4">
      <Helmet>
        <title>BlogAdmin - Squirrel Peace</title>
      </Helmet>

      <h1 className="text-3xl font-bold">
        Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Blog Administration Panel
      </h1>
      <p className="max-w-5xl mx-auto mb-5">
        Here you can upload and manage blogs to be published on our website. Please ensure that each blog is carefully written, properly formatted, and thoroughly reviewed before uploading. Your attention to detail helps maintain the quality and credibility of our blog section.
      </p>

      <NavLink to="/blog">
        <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
          <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
            Go Blog Page
          </span>
          <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
        </button>
      </NavLink>

      <div className="flex justify-center mt-5">
        <div className="w-full sm:w-2/3 px-2 sm:px-0">
          <p className="text-2xl font-semibold mb-3">
            Please add your <span className="text-[#2acb35]">blog</span> here
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input {...register("storyTitle", { required: true })} placeholder="Blog Title*" className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]" />

              <input {...register("storyCategory", { required: true })} placeholder="Blog Category*" className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <input {...register("storyRandom", { required: true })} placeholder="Blog Random (xyz)*" className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]" />

              <select
                {...register("storyTime", { required: true })}
                defaultValue=""
                className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]"
              >
                <option value="" disabled>Blog Read Time*</option>
                {[...Array(10)].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <textarea rows="2" {...register("storyShortDescription", { required: true })} placeholder="Blog Short Description..." className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <input type="file" {...register("storyImage", { required: true })} className="file-input file-input-ghost w-full" />
              <input type="date" value={storyDate} onChange={(e) => setStoryDate(e.target.value)} className="w-full p-4 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#2acb35]" required />
            </div>

            {/* Editor */}
            <div className="border rounded-md bg-white">
              <div id="toolbar" className="sticky top-0 z-50  bg-white border-b px-2 py-1">
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
                  onChange={handleLongDescriptionChange}
                  modules={modules}
                  formats={formats}
                  placeholder="Write your long description"
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
                  Adding Blog <FaSpinner className="animate-spin" />
                </>
              ) : (
                "Add Blog"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StoryBlogAdmin;