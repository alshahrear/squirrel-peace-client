import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useAuth from '../../Layout/useAuth';
import { useForm } from 'react-hook-form';
import useAxiosPublic from '../../../hooks/useAxiosPublic';

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const StoryBlogAdmin = () => {
    const { user } = useAuth();
    const axiosPublic = useAxiosPublic();
    const { register, handleSubmit, reset } = useForm();

    const onSubmit = async (data) => {
        const imageFile = { image: data.storyImage[0] };

        try {
            // Upload image to imgbb
            const imageRes = await axiosPublic.post(image_hosting_api, imageFile, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const imageUrl = imageRes.data?.data?.display_url;
            if (!imageUrl) throw new Error("Image upload failed");

            const storyData = {
                storyTitle: data.storyTitle,
                storyCategory: data.storyCategory,
                storyImage: imageUrl,
                storyDescription: data.storyDescription
            };

            // Post story to backend
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
        }
    };

    return (
        <div className="my-12 max-w-screen-xl mx-auto text-center space-y-2">
            <h1 className="text-3xl font-bold">
                Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Story Blog Administration Panel
            </h1>
            <p className="text-xl font-semibold">
                Please add a new story blog to help us build trust and credibility with future clients.
            </p>
            <NavLink to="/storyPages">
                <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
                        Go Story Page
                    </span>
                    <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                </button>
            </NavLink>

            <div className="flex justify-center mt-5">
                <div className="w-2/3">
                    <p className="text-2xl font-semibold mb-3">
                        Please add your <span className="text-[#2acb35]">story blog</span> here
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-2 gap-6">
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
                        <div className="space-y-2">
                            <input
                                type="file"
                                {...register("storyImage", { required: true })}
                                className="flex justify-baseline file-input file-input-ghost"
                            />
                            <textarea
                                rows="5"
                                {...register("storyDescription", { required: true })}
                                placeholder="Story Description..."
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            ></textarea>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase"
                            >
                                Add Story
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default StoryBlogAdmin;
