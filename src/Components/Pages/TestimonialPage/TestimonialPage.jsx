import { useEffect, useState } from "react";
import coffee from "../../../assets/Testimonialshome.jpg";
import TestimonialBlog from "./TestimonialBlog";
import { NavLink } from "react-router-dom";
import NewsletterOption from "../../Layout/NewsletterOption/NewsletterOption";
import TestimonialCard from "../../Layout/TestimonialCard/TestimonialCard";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import { Helmet } from "react-helmet";
import Loader from "../../../Components/Loader";

const TestimonialPage = () => {
    const [testimonials, setTestimonials] = useState([]);
    const { user } = useAuth();
    const [isAdmin] = useAdmin();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch('https://squirrel-peace-server.onrender.com/reviews')
            .then(res => res.json())
            .then(data => {
                setTestimonials(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error loading testimonials:", error);
                setLoading(false);
            });
    }, []);

    const handleDelete = (id) => {
        setTestimonials(testimonials.filter(testimonial => testimonial._id !== id));
    };

    const handleUpdate = (id, updatedData) => {
        setTestimonials(prev =>
            prev.map(testimonial =>
                testimonial._id === id ? { ...testimonial, ...updatedData } : testimonial
            )
        );
    };

    return (
        <div className="bg-[#f7f7f7]">
            <Helmet>
                <title>Success - Storial Peace</title>
            </Helmet>

            <div className="max-w-screen-xl mx-auto py-10 px-4">
                {/* Responsive Order Section */}
                <div className="flex flex-col-reverse md:flex-row items-center gap-10">
                    {/* Text Section */}
                    <div className="flex-1 space-y-5 text-center md:text-left">
                        <h3 className="text-2xl text-[#2acb35] font-semibold">Some Story Behind Us</h3>
                        <h2 className="text-3xl font-bold">We Have 20 Years of experience</h2>
                        <p className="text-gray-500">
                            We handpick the best coaches and health experts to give you personalized care.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 justify-center md:justify-start">
                            <div className="space-y-2 flex-1">
                                <p className="text-lg font-semibold">Our Mission</p>
                                <p className="text-gray-500">Explaining how pleasure and pain are managed effectively.</p>
                            </div>
                            <div className="space-y-2 flex-1">
                                <p className="text-lg font-semibold">Our Vision</p>
                                <p className="text-gray-500">To deliver consistent and joyful experience to all users.</p>
                            </div>
                        </div>

                        <div className="flex justify-center md:justify-start">
                            <NavLink to="/about">
                                <button className="btn px-8 py-4 rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35] transition duration-300">
                                    About Us
                                </button>
                            </NavLink>
                        </div>
                    </div>

                    {/* Image Section */}
                    <div className="flex-1 w-full">
                        <img className="rounded-2xl w-full h-64 sm:h-80 object-cover" src={coffee} alt="Story" />
                    </div>
                </div>

                {/* Testimonials Section */}
                <div className="pt-12 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center px-2 sm:px-4 gap-4 sm:gap-0">
                        <h3 className="text-3xl font-bold text-center ">Successful Stories</h3>
                        {
                            user && isAdmin &&
                            <NavLink to="/testimonialsAdmin">
                                <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                                    Add Testimonial
                                </button>
                            </NavLink>
                        }
                    </div>

                    {
                        loading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader />
                            </div>
                        ) : testimonials.length === 0 ? (
                            <p className="text-center text-gray-500 text-lg">No testimonials found.</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-5">
                                {testimonials.map(testimonial => (
                                    <TestimonialBlog
                                        key={testimonial._id}
                                        testimonialBlog={testimonial}
                                        onDelete={handleDelete}
                                        onUpdate={handleUpdate}
                                    />
                                ))}
                            </div>
                        )
                    }
                </div>
            </div>

            {/* Bottom Sections */}
            <div className="">
                <h2 className="text-3xl font-bold text-center ">Process To Safe Environment</h2>
                <TestimonialCard />
            </div>

            <div className="mx-4">
                <BlogAll />
            </div>

            <div className="">
                <NewsletterOption />
            </div>
        </div>
    );
};

export default TestimonialPage;
