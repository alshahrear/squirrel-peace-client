import { NavLink } from 'react-router-dom';
import Swal from 'sweetalert2';
import useAuth from '../../../Layout/useAuth';
import { useForm } from 'react-hook-form';
import useAxiosPublic from '../../../../hooks/useAxiosPublic';
import { useState } from 'react';
import { FaSpinner } from 'react-icons/fa';
import { Helmet } from 'react-helmet';

const image_hosting_key = import.meta.env.VITE_IMAGE_HOSTING_KEY;
const image_hosting_api = `https://api.imgbb.com/1/upload?key=${image_hosting_key}`;

const TestimonialsAdmin = () => {
    const { user } = useAuth();
    const axiosPublic = useAxiosPublic();
    const { register, handleSubmit, reset } = useForm();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const onSubmit = async (data) => {
        setIsSubmitting(true);
        const imageFile = { image: data.profileLink[0] };

        try {
            const imageRes = await axiosPublic.post(image_hosting_api, imageFile, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            const imageUrl = imageRes.data?.data?.display_url;
            if (!imageUrl) throw new Error("Image upload failed");

            const testimonialData = {
                customerName: data.name,
                rating: data.rating,
                random: data.random,
                review: data.review,
                profileLink: imageUrl
            };

            const res = await axiosPublic.post('/reviews', testimonialData);

            if (res.data?.insertedId) {
                Swal.fire({
                    position: "top-end",
                    icon: "success",
                    title: "Your testimonial has been added",
                    showConfirmButton: false,
                    timer: 1500
                });
                reset();
            } else {
                throw new Error("Failed to save testimonial");
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
        <div className="my-12 max-w-screen-xl mx-auto text-center space-y-2 px-3 sm:px-4">
            <Helmet>
                <title>Testimonials - Storial Peace</title>
            </Helmet>
            <h1 className="text-3xl font-bold">
                Welcome <i className="text-[#2acb35]">{user.displayName}</i> to the Testimonial Administration Panel
            </h1>
            <p className="text-xl font-semibold">
                Please add a new testimonial to help us build trust and credibility with future clients.
            </p>
            <NavLink to="/success">
                <button className="relative overflow-hidden px-5 py-2 text-white bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
                        See Testimonial
                    </span>
                    <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                </button>
            </NavLink>

            <div className="flex justify-center mt-5">
                <div className="w-full sm:w-2/3 px-2 sm:px-0">
                    <p className="text-2xl font-semibold mb-3">
                        Please add your <span className="text-[#2acb35]">testimonial</span> here
                    </p>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <input
                                type="text"
                                {...register("name", { required: true })}
                                placeholder="Customer Name*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                            <select
                                {...register("rating", { required: true })}
                                defaultValue=""
                                className="w-full text-gray-500 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            >
                                <option value="" disabled>Pick a rating</option>
                                <option>1</option>
                                <option>2</option>
                                <option>3</option>
                                <option>4</option>
                                <option>4.5</option>
                                <option>5</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <input
                                    type="file"
                                    {...register("profileLink", { required: true })}
                                    className="file-input file-input-ghost w-full"
                                />
                            <input
                                type="text"
                                {...register("random", { required: true })}
                                placeholder="Random Text (xyz)*"
                                className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                            />
                        </div>

                        <textarea
                            rows="5"
                            {...register("review", { required: true })}
                            placeholder="Customer Review..."
                            className="w-full p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#2acb35]"
                        ></textarea>

                        <div>
                            <button
                                type="submit"
                                className="btn w-full bg-[#2acb35] text-white font-semibold py-6 rounded-full hover:bg-[#59ca59] transition duration-300 uppercase flex items-center justify-center gap-3"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        Adding Testimonial
                                        <FaSpinner className="animate-spin" />
                                    </>
                                ) : (
                                    "Add Testimonials"
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TestimonialsAdmin;
