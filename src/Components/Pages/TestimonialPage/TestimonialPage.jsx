import { useEffect, useState } from "react";
import success from "../../../assets/success1.jpg";
import TestimonialBlog from "./TestimonialBlog";
import { NavLink } from "react-router-dom";
import NewsletterOption from "../../Layout/NewsletterOption/NewsletterOption";
import TestimonialCard from "../../Layout/TestimonialCard/TestimonialCard";
import useAuth from "../../Layout/useAuth";
import useAdmin from "../../../hooks/useAdmin";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import { Helmet } from "react-helmet";
import Loader from "../../../Components/Loader";
import { motion } from "framer-motion";

const TestimonialPage = () => {
    const [testimonials, setTestimonials] = useState([]);
    const { user } = useAuth();
    const [isAdmin] = useAdmin();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetch("https://squirrel-peace-server.onrender.com/reviews")
            .then((res) => res.json())
            .then((data) => {
                setTestimonials(data);
                setLoading(false);
            })
            .catch((error) => {
                console.error("Error loading testimonials:", error);
                setLoading(false);
            });
    }, []);

    const handleDelete = (id) => {
        setTestimonials(testimonials.filter((testimonial) => testimonial._id !== id));
    };

    const handleUpdate = (id, updatedData) => {
        setTestimonials((prev) =>
            prev.map((testimonial) =>
                testimonial._id === id ? { ...testimonial, ...updatedData } : testimonial
            )
        );
    };

    return (
        <div className="bg-[#f7f7f7]">
            <Helmet>
                <title>Success - Storial Peace</title>
            </Helmet>

            {/* ✅ One Responsive Banner for All Devices */}
            <div className="w-full h-[320px] md:h-[400px] lg:h-[480px] relative">
                <img
                    src={success}
                    alt="Testimonial Banner"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <h1 className="text-white text-3xl sm:text-3xl md:text-4xl font-bold">Our Success</h1>
                </div>
            </div>

            <div className="max-w-screen-xl mx-auto py-10 px-4">
                {/* ✅ Desktop: Mission & Vision beside text */}
                <div className="hidden md:flex flex-row items-start gap-10">
                    <div className="flex-1 space-y-5 text-left">
                        <h3 className="text-3xl font-semibold "><span className="text-[#2acb35]">Together</span>, We Made Life Better</h3>
                        <p>
                            Every moment spent on our website is a step toward a happier, more fulfilling life. From practical tips to emotional support, we're helping people overcome stress, discover their potential, and embrace joy in everyday living.
                        </p>
                        <p>
                            Those who walk with us don't just find knowledge — they find peace, purpose, motivation, and lasting transformation. With the guidance and inspiration we provide, many have applied these learnings in their real lives — and today, they are living happier, more meaningful lives.
                        </p>
                        <p>
                            We're proud to be a part of so many success stories. And for us, this is just the beginning of many more lives touched, healed, and transformed.
                        </p>
                    </div>

                    <div className="flex-1 space-y-8">
                        <div className="space-y-2">
                            <p className="text-xl font-semibold text-[#2acb35]">Our Mission</p>
                            <p>
                                To inspire, guide, and support individuals toward a more joyful, peaceful, and purpose-driven life. Through practical advice, emotional motivation, and positive content, we aim to help people overcome challenges, learn new things, and build a happier life — one moment at a time.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-xl font-semibold text-[#2acb35]">Our Vision</p>
                            <p>
                                To create a global community where people feel inspired, emotionally supported, and empowered to lead fulfilling lives. We envision a world where learning, mental well-being, and happiness are accessible to everyone — and where our platform becomes a trusted friend in every person's life journey.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ✅ Mobile View */}
                <div className="block md:hidden space-y-5">
                    <h3 className="text-2xl text-center font-semibold"><span className="text-[#2acb35]">Together</span>, We Made Life Better</h3>
                    <p>
                        Every moment spent on our website is a step toward a happier, more fulfilling life. From practical tips to emotional support, we're helping people overcome stress, discover their potential, and embrace joy in everyday living.
                    </p>
                    <p>
                        Those who walk with us don't just find knowledge — they find peace, purpose, motivation, and lasting transformation. With the guidance and inspiration we provide, many have applied these learnings in their real lives — and today, they are living happier, more meaningful lives.
                    </p>
                    <p>
                        We're proud to be a part of so many success stories. And for us, this is just the beginning of many more lives touched, healed, and transformed.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                        <div className="space-y-2">
                            <p className="text-2xl text-center font-semibold text-[#2acb35]">Our Mission</p>
                            <p>
                                To inspire, guide, and support individuals toward a more joyful, peaceful, and purpose-driven life. Through practical advice, emotional motivation, and positive content, we aim to help people overcome challenges, learn new things, and build a happier life — one moment at a time.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <p className="text-2xl text-center font-semibold text-[#2acb35]">Our Vision</p>
                            <p>
                                To create a global community where people feel inspired, emotionally supported, and empowered to lead fulfilling lives. We envision a world where learning, mental well-being, and happiness are accessible to everyone — and where our platform becomes a trusted friend in every person's life journey.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Testimonials */}
                <div className="pt-12 space-y-4">
                    <div className="flex flex-col items-center gap-4 sm:gap-0 px-2 sm:px-4">
                        <h3 className="text-3xl font-bold text-center w-full">Successful Stories</h3>

                        {user && isAdmin && (
                            <div className="w-full flex justify-center sm:justify-end">
                                <NavLink to="/testimonialsAdmin">
                                    <button className="btn bg-[#2acb35] text-white px-5 py-2 rounded-md hover:bg-white hover:text-[#2acb35] border border-[#2acb35] transition">
                                        Add Testimonial
                                    </button>
                                </NavLink>
                            </div>
                        )}
                    </div>

                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <Loader />
                        </div>
                    ) : testimonials.length === 0 ? (
                        <p className="text-center text-gray-500 text-lg">No testimonials found.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-5 gap-6">
                            {testimonials.map((testimonial, index) => (
                                <motion.div
                                    key={testimonial._id}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <TestimonialBlog
                                        testimonialBlog={testimonial}
                                        onDelete={handleDelete}
                                        onUpdate={handleUpdate}
                                    />
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Sections */}
            <div>
                <h2 className=" text-2xl lg:text-3xl font-bold text-center">Stay <span className="text-[#2acb35]">Connected</span>, Stay <span className="text-[#2acb35]">Inspired</span></h2>
                <TestimonialCard />
            </div>

            <div className="mx-4" id="blogAll">
                <BlogAll />
            </div>

            <div>
                <NewsletterOption />
            </div>
        </div>
    );
};

export default TestimonialPage;
