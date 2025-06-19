import React from 'react';
import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useAuth from '../../Layout/useAuth';
import { useForm } from 'react-hook-form';
import useAxiosPublic from '../../../hooks/useAxiosPublic';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import DOMPurify from 'dompurify';
import 'react-quill/dist/quill.snow.css';
import { FaSpinner } from 'react-icons/fa';
import { Helmet } from 'react-helmet';

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

    const handleLongDescriptionChange = (content) => {
        const clean = DOMPurify.sanitize(content, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 'p', 'br', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img'],
            ALLOWED_ATTR: ['href', 'target', 'alt', 'src', 'title', 'style'],
        });
        setLongDescription(clean);
    };

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const imageFile = { image: data.storyImage[0] };

        try {
            const imageRes = await axiosPublic.post(image_hosting_api, imageFile, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const imageUrl = imageRes.data?.data?.display_url;
            if (!imageUrl) throw new Error("Image upload failed");

            const formattedDate = dayjs(storyDate).format("D MMMM, YYYY");

            const storyData = {
                storyTitle: data.storyTitle,
                storyCategory: data.storyCategory,
                storyRandom: data.storyRandom,
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
                    title: "Your story has been added",
                    showConfirmButton: false,
                    timer: 1500
                });
                reset();
                setStoryDate(today);
                setLongDescription('');
            } else {
                throw new Error("Failed to save story");
            }

        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: error.message || "Something went wrong!"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const quillRef = useMemo(() => React.createRef(), []);

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ header: [1, 2, 3, 4, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ list: 'ordered' }, { list: 'bullet' }],
                ['link', 'image'],
                ['clean']
            ],
            handlers: {
                image: imageHandler,
            },
        },
    }), []);

    return (
        <div className="my-12 max-w-screen-xl mx-auto text-center space-y-2 px-3 sm:px-4">
            <Helmet>
                <title>StoryAdmin - Storial Peace</title>
            </Helmet>
            <h1 className="text-3xl font-bold">
                Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Story Blog Administration Panel
            </h1>
            <p className="text-xl font-semibold">
                Please add a new story blog to help us build trust and credibility with future clients.
            </p>
            <NavLink to="/story">
                <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
                        Go Story Page
                    </span>
                    <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                </button>
            </NavLink>

            <div className="flex justify-center mt-5">
                <div className="w-full sm:w-2/3 px-2 sm:px-0">
                    <p className="text-2xl font-semibold mb-3">
                        Please add your <span className="text-[#2acb35]">story blog</span> here
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <input
                                type="text"
                                {...register("storyTitle", { required: true })}
                                placeholder="Story Title*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <input
                                type="text"
                                {...register("storyCategory", { required: true })}
                                placeholder="Story Category*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                        </div>
                        <input
                            type="text"
                            {...register("storyRandom", { required: true })}
                            placeholder="Story Random (xyz)*"
                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                        />
                        <textarea
                            rows="2"
                            {...register("storyShortDescription", { required: true })}
                            placeholder="Story Short Description..."
                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                        ></textarea>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                            <input
                                type="file"
                                {...register("storyImage", { required: true })}
                                className="file-input file-input-ghost w-full"
                            />
                            <input
                                type="date"
                                value={storyDate}
                                onChange={(e) => setStoryDate(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                required
                            />
                        </div>
                        <div>
                            <ReactQuill
                                ref={quillRef}
                                theme="snow"
                                value={longDescription}
                                onChange={handleLongDescriptionChange}
                                modules={modules}
                                placeholder="Write your full story with formatting, links, images, etc..."
                                className="bg-white"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <>
                                    Adding Story <FaSpinner className="animate-spin" />
                                </>
                            ) : (
                                "Add Story"
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StoryBlogAdmin;
