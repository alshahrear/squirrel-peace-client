import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import newscover from "../../../assets/newscover.jpg";
import newsletter from "../../../assets/newsletter.jpg";
import testimonial from "../../../assets/Testimonialshome.jpg";
import { FaBookReader, FaRegHandshake } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import NewsletterOption from "../../Layout/NewsletterOption/NewsletterOption";
import NewsletterReview from "../../Layout/NewsletterReview/NewsletterReview";
import Slider from "react-slick";
import NewsletterSubscribe from "../../Layout/NewslettterSubscribe/NewsletterSubscribe";
import { NavLink } from "react-router-dom";

const skills = [
    { name: "Recycling", percentage: 90 },
    { name: "Ocean Cleaning", percentage: 80 },
    { name: "Tree Plantation", percentage: 85 },
    { name: "Plastic Reduction", percentage: 75 },
];

const NewsletterPage = () => {
    const [progress, setProgress] = useState(skills.map(() => 0));
    const [testimonials, setTestimonials] = useState([]);
    const progressRef = useRef(null);
    const [isProgressVisible, setIsProgressVisible] = useState(false);

    useEffect(() => {
        fetch('http://localhost:5000/reviews')
            .then(res => res.json())
            .then(data => {
                setTestimonials(data);
            })
            .catch(error => {
                console.error("Error loading testimonials:", error);
            });
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsProgressVisible(true);
                        observer.disconnect(); // Trigger only once
                    }
                });
            },
            { threshold: 0.4 }
        );

        if (progressRef.current) {
            observer.observe(progressRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!isProgressVisible) return;

        const interval = setInterval(() => {
            setProgress((prev) =>
                prev.map((value, index) =>
                    value < skills[index].percentage ? value + 1 : value
                )
            );
        }, 20);

        return () => clearInterval(interval);
    }, [isProgressVisible]);

    const sliderSettings = {
        dots: true,
        infinite: true,
        speed: 800,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 4000,
        arrows: false,
    };

    return (
        <div>
            {/* Newsletter Heading */}
            <div className="text-center space-y-3 py-10 bg-[#f5f7ec]">
                <h1 className="text-4xl font-bold text-[#082c2f]">
                    Join Our Weekly Newsletter
                </h1>
                <p className="text-lg text-gray-700 font-medium max-w-3xl mx-auto">
                    Once a week, Squirrel Peace sends thoughtful, helpful content about freelancing, focus, and finding balance in your creative work.
                </p>
            </div>
            <div className="bg-[#f5f8ed]">
                <NewsletterSubscribe></NewsletterSubscribe>
            </div>
            {/* Image Grid Section */}
            <div className="bg-[#f5f8ed]">
                <div className="py-12 rounded-2xl">
                    <div className="text-center space-y-2 mb-12">
                        <h2 className="text-3xl font-bold text-[#082c2f]">
                            <span className="text-[#2acb35]">1000+</span> People Join With Us
                        </h2>
                        <p className="text-lg text-gray-700 font-medium">It's change your life</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10 max-w-7xl mx-auto px-4">
                        <div className="grid grid-cols-2 gap-5">
                            {[newscover, newsletter, testimonial, newscover].map((img, idx) => (
                                <div key={idx} className="relative overflow-hidden rounded-xl group">
                                    <img className="w-full h-60 object-cover rounded-xl transform transition-transform duration-500 group-hover:scale-110" src={img} alt={`Newsletter ${idx}`} />
                                    <div className="absolute inset-0 bg-black/40 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out rounded-xl pointer-events-none" />
                                </div>
                            ))}
                        </div>

                        {/* Right Content */}
                        <div className="space-y-6 flex flex-col justify-center">
                            <h2 className="text-3xl font-bold text-[#082c2f]">
                                Getting A Greener Future Safe Environment
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Competently cultivate worldwide e-tailers through principle-centered value professionally engineer high-payoff deliverables without exceptional processes. Rapidiously network cost effective vortals.
                            </p>

                            <div className="flex flex-col md:flex-row gap-6">
                                {["Safe Environment", "Dirty Recycling"].map((item, index) => (
                                    <p key={index} className="group relative flex items-center gap-4 p-4 bg-white text-xl font-semibold rounded-xl overflow-hidden cursor-pointer transition-all duration-500">
                                        <span className="absolute inset-0 bg-[#2acb35] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0 rounded-xl" />
                                        <FaBookReader className="text-2xl text-[#2acb35] z-10 group-hover:text-white transition-colors duration-300" />
                                        <span className="z-10 group-hover:text-white transition-colors duration-300">{item}</span>
                                    </p>
                                ))}
                            </div>

                            {/* Progress Bars */}
                            <div className="bg-[#f5f7ec] rounded-xl space-y-6 p-4" ref={progressRef}>
                                {skills.map((skill, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between text-[#082c2f] text-lg font-semibold mb-1">
                                            <span>{skill.name}</span>
                                            <span>{progress[index]}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-[#d0e0d5] rounded-full overflow-hidden">
                                            <div className="h-full bg-[#2acb35] rounded-full transition-all duration-300" style={{ width: `${progress[index]}%` }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonial Section */}
            <div className="bg-[#f5f7ec]">
                <div className="max-w-7xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10 items-center">
                    <div>
                        <h3 className="flex items-center text-lg font-semibold text-gray-800 gap-2">
                            <FaRegHandshake className="text-xl text-[#2acb35]" />
                            Our Testimonials
                        </h3>
                        <h2 className="text-4xl font-bold text-gray-900 mt-2">
                            They Were <span className="text-[#2acb35]">Happy</span> With Our <br /> Service
                        </h2>
                        <p className="text-gray-600 mt-4">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
                        </p>
                        <p className="text-gray-600 mt-2">
                            Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                        </p>
                        <NavLink to="/testimonialPage">
                            <button className="mt-6 bg-[#2acb35] hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full">
                                View More
                            </button>
                        </NavLink>
                    </div>

                    {/* Review Slider */}
                    <div>
                        <Slider {...sliderSettings}>
                            {testimonials.map(testimonial => (
                                <NewsletterReview key={testimonial.id} testimonial={testimonial} />
                            ))}
                        </Slider>
                    </div>
                </div>
            </div>
            <div>
                <NewsletterOption />
            </div>
        </div>
    );
};

export default NewsletterPage;
