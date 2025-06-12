import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useAuth from '../../Layout/useAuth';
import { useForm } from 'react-hook-form';
import useAxiosPublic from '../../../hooks/useAxiosPublic';
import { useState } from 'react';
import dayjs from 'dayjs';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const BlogPageAdmin = () => {
    const { user } = useAuth();
    const axiosPublic = useAxiosPublic();
    const { register, handleSubmit, reset } = useForm();

    const today = dayjs().format("YYYY-MM-DD");
    const [blogDate, setBlogDate] = useState(today);
    const [blogLongDescription, setBlogLongDescription] = useState('');

    const onSubmit = async (data) => {
        try {
            const imageFile = new FormData();
            imageFile.append('image', data.storyImage[0]);

            // Upload image to imgbb
            const imageRes = await axiosPublic.post(image_hosting_api, imageFile, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const imageUrl = imageRes.data?.data?.display_url;
            if (!imageUrl) throw new Error("Image upload failed");

            const formattedDate = dayjs(blogDate).format("D MMMM, YYYY");

            const blogData = {
                blogTitle: data.blogTitle,
                blogCategory: data.blogCategory,
                blogDate: formattedDate,
                blogImage: imageUrl,
                blogShortDescription: data.blogShortDescription,
                blogLongDescription: blogLongDescription,
            };

            const blogRes = await axiosPublic.post('/blog', blogData);

            if (blogRes.data?.insertedId) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Your blog has been added",
                    showConfirmButton: false,
                    timer: 1500,
                });
                reset();
                setBlogDate(today);
                setBlogLongDescription('');
            } else {
                throw new Error("Failed to save blog");
            }
        } catch (error) {
            console.error(error);
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: error.message || "Something went wrong!",
            });
        }
    };

    return (
        <div className="my-12 max-w-screen-xl mx-auto text-center space-y-2">
            <h1 className="text-3xl font-bold">
                Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Blog Page Administration Panel
            </h1>
            <p className="text-xl font-semibold">
                Please add a new story blog to help us build trust and credibility with future clients.
            </p>

            {/* Category Links */}
            <div className="my-5">
                <NavLink to="/lifeStylePages">
                    <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                        <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">Life Style</span>
                        <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                    </button>
                </NavLink>
                <NavLink to="/travelPages" className="mx-20">
                    <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                        <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">Travel</span>
                        <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                    </button>
                </NavLink>
                <NavLink to="/healthPages">
                    <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                        <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">Health</span>
                        <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                    </button>
                </NavLink>
            </div>

            {/* Form Section */}
            <div className="flex justify-center">
                <div className="w-2/3">
                    <p className="text-2xl font-semibold mb-3">
                        Please add your <span className="text-[#2acb35]">story blog</span> here
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-2 gap-6">
                            <input
                                type="text"
                                {...register("blogTitle", { required: true })}
                                placeholder="Blog Title*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <select
                                {...register("blogCategory", { required: true })}
                                defaultValue=""
                                className="w-full text-gray-500 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            >
                                <option value="" disabled>Choose Blog Category</option>
                                <option>Life Style</option>
                                <option>Travel</option>
                                <option>Health</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-6 items-center">
                            <input
                                type="file"
                                {...register("storyImage", { required: true })}
                                className="file-input file-input-bordered"
                                accept="image/*"
                            />
                            <input
                                type="date"
                                value={blogDate}
                                onChange={(e) => setBlogDate(e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                                required
                            />
                        </div>
                        <div>
                            <textarea
                                rows="2"
                                {...register("blogShortDescription", { required: true })}
                                placeholder="Blog Short Description..."
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            ></textarea>
                        </div>
                        <div>
                            {/* Custom Rich Text Editor */}
                            <ReactQuill
                                theme="snow"
                                value={blogLongDescription}
                                onChange={setBlogLongDescription}
                                placeholder="Write your full blog with formatting, links, images, etc..."
                                className="bg-white"
                            />
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase"
                            >
                                Add Blog
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default BlogPageAdmin;
