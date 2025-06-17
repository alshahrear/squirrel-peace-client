import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useAuth from '../../Layout/useAuth';
import { useForm } from 'react-hook-form';
import useAxiosPublic from '../../../hooks/useAxiosPublic';
import { useState } from 'react';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import DraftBlogs from './DraftBlogs';

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const DraftBlogAdmin = () => {
    const { user } = useAuth();
    const axiosPublic = useAxiosPublic();
    const { register, handleSubmit, reset } = useForm();

    const today = dayjs().format("YYYY-MM-DD");
    const [storyDate, setStoryDate] = useState(today);
    const [longDescription, setLongDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false); // loader

    const [stories, setStories] = useState([]);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const imageFile = new FormData();
        imageFile.append('image', data.storyImage[0]);

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

            const res = await axiosPublic.post('/draft', storyData);

            if (res.data?.insertedId) {
                const newStory = { _id: res.data.insertedId, ...storyData };
                setStories(prev => [newStory, ...prev]);

                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Your draft has been added",
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

    return (
        <div className='max-w-screen-xl mx-auto my-12'>
            <div>
                <div className=" text-center space-y-2">
                    <h1 className="text-3xl font-bold">
                        Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Draft Blog Administration Panel
                    </h1>
                    <p className="text-xl font-semibold">
                        Please add a new draft blog to help us build trust and credibility with future clients.
                    </p>
                </div>
                <div className='mt-10'>
                    <DraftBlogs stories={stories} setStories={setStories}></DraftBlogs>
                </div>
                <div className="flex justify-center mt-5">
                    <div className="w-2/3">
                        <p className="text-2xl font-semibold mb-3">
                            Please add your <span className="text-[#2acb35]">draft blog</span> here
                        </p>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-2 gap-6">
                                <input
                                    type="text"
                                    {...register("storyTitle", { required: true })}
                                    placeholder="Draft Title*"
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                />
                                <input
                                    type="text"
                                    {...register("storyCategory", { required: true })}
                                    placeholder="Draft Category*"
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                />
                            </div>
                            <div>
                                <input
                                    type="text"
                                    {...register("storyRandom", { required: true })}
                                    placeholder="Draft Random*"
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                />
                            </div>
                            <div>
                                <textarea
                                    rows="2"
                                    {...register("storyShortDescription", { required: true })}
                                    placeholder="Draft Short Description..."
                                    className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                ></textarea>
                            </div>
                            <div className="grid grid-cols-2 gap-6 items-center">
                                <input
                                    type="file"
                                    {...register("storyImage", { required: true })}
                                    className="file-input w-full file-input-ghost"
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
                                    theme="snow"
                                    value={longDescription}
                                    onChange={setLongDescription}
                                    placeholder="Write your full story with formatting, links, images, etc..."
                                    className="bg-white"
                                />
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Adding Draft..." : "Add Draft"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DraftBlogAdmin;
