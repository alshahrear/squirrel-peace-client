import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

import newscover from "../../../assets/newscover.jpg";
import newsletter from "../../../assets/newsletter.jpg";
import testimonial from "../../../assets/Testimonialshome.jpg";
import { FaRegHandshake } from "react-icons/fa";
import { useEffect, useRef, useState } from "react";
import NewsletterOption from "../../Layout/NewsletterOption/NewsletterOption";
import NewsletterReview from "../../Layout/NewsletterReview/NewsletterReview";
import Slider from "react-slick";
import NewsletterSubscribe from "../../Layout/NewslettterSubscribe/NewsletterSubscribe";
import { NavLink } from "react-router-dom";
import NewsletterWhy from "./NewsletterWhy";
import { Helmet } from "react-helmet";

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
    fetch("https://squirrel-peace-server.onrender.com/reviews")
      .then((res) => res.json())
      .then((data) => setTestimonials(data))
      .catch((error) =>
        console.error("Error loading testimonials:", error)
      );
  }, []);

  // ✅ Responsive Observer + Mobile fallback
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsProgressVisible(true); // Mobile: directly show progress
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsProgressVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.4 }
    );

    if (progressRef.current) observer.observe(progressRef.current);

    return () => observer.disconnect();
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

  const bannerImages = [newscover, newsletter, testimonial, newscover];

  const mobileSliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 800,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
  };

  return (
    <div>
      <Helmet>
        <title>Newsletter - Storial Peace</title>
      </Helmet>

      {/* 🖥️ Heading (Desktop Only) */}
      <div className="hidden lg:block text-center bg-[#f7f7f7] pt-6 px-4">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#082c2f]">
          <span className="text-[#2acb35]">1000+</span> People Join With Us
        </h2>
        <p className="text-gray-600 text-base mt-2">Please Subscribe</p>
      </div>

      {/* 📱 Mobile Slider with Overlay Text */}
      <div className="block lg:hidden relative">
        <Slider {...mobileSliderSettings}>
          {bannerImages.map((img, idx) => (
            <div key={idx} className="relative">
              <img
                src={img}
                alt={`Mobile Banner ${idx}`}
                className="w-full h-64 object-cover"
              />
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white text-center px-4">
                <h2 className="text-2xl font-bold">1000+ People Join With Us</h2>
                <p className="text-sm mt-1">Please Subscribe</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* 📱 Mobile: Greener Future + Progress Bar */}
      <div className="block lg:hidden px-4 mt-6" ref={progressRef}>
        <h2 className="text-2xl font-bold text-[#082c2f]">
          Getting A Greener Future Safe Environment
        </h2>
        <p className="text-gray-600 text-base mt-2">
          Competently cultivate worldwide e-tailers through principle-centered value professionally engineer high-payoff deliverables.
        </p>
        <p className="text-gray-600 text-base mt-2">
          Rapidiously network cost effective vortals and create exceptional eco-experiences with our mission.
        </p>

        <div className="mt-6 space-y-5">
          {skills.map((skill, index) => (
            <div key={index}>
              <div className="flex justify-between text-[#082c2f] text-base font-semibold">
                <span>{skill.name}</span>
                <span>{progress[index]}%</span>
              </div>
              <div className="w-full h-2 bg-[#d0e0d5] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2acb35] rounded-full transition-all duration-300"
                  style={{ width: `${progress[index]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🖥️ Desktop View with Image Grid + Right Content */}
      <div className="bg-[#f7f7f7] hidden lg:block">
        <div className="py-10 rounded-2xl">
          <div className="grid lg:grid-cols-2 gap-10 max-w-7xl mx-auto px-4">
            {/* Images */}
            <div className="grid grid-cols-2 gap-5 h-full">
              {bannerImages.map((img, idx) => (
                <div key={idx} className="relative overflow-hidden rounded-xl group">
                  <img
                    className="w-full h-60 object-cover rounded-xl transform transition-transform duration-500 group-hover:scale-110"
                    src={img}
                    alt={`Newsletter ${idx}`}
                  />
                  <div className="absolute inset-0 bg-black/40 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out rounded-xl pointer-events-none" />
                </div>
              ))}
            </div>

            {/* Content */}
            <div className="space-y-6 flex flex-col justify-center" ref={progressRef}>
              <h2 className="text-3xl font-bold text-[#082c2f]">
                Getting A Greener Future Safe Environment
              </h2>
              <p className="text-gray-600 text-lg">
                Competently cultivate worldwide e-tailers through principle-centered value professionally engineer high-payoff deliverables.
              </p>
              <p className="text-gray-600 text-lg">
                Rapidiously network cost effective vortals and create exceptional eco-experiences with our mission.
              </p>

              {/* Progress Bars */}
              <div className="space-y-6">
                {skills.map((skill, index) => (
                  <div key={index}>
                    <div className="flex justify-between text-[#082c2f] text-lg font-semibold">
                      <span>{skill.name}</span>
                      <span>{progress[index]}%</span>
                    </div>
                    <div className="w-full h-3 bg-[#d0e0d5] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2acb35] rounded-full transition-all duration-300"
                        style={{ width: `${progress[index]}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us */}
      <NewsletterWhy />

      {/* Subscribe Section */}
      <div className="rounded-2xl">
        <div className="text-center space-y-3 pb-10 bg-[#f7f7f7] px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#082c2f]">
            Join Our Weekly Newsletter
          </h1>
          <p className="text-lg text-gray-700 font-medium max-w-3xl mx-auto">
            Once a week, Squirrel Peace sends thoughtful, helpful content about freelancing, focus, and finding balance in your creative work.
          </p>
        </div>
        <div className="bg-[#f5f8ed] pb-10">
          <NewsletterSubscribe />
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-[#f7f7f7]">
        <div className="max-w-7xl mx-auto px-4 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="flex items-center text-2xl font-semibold text-gray-800 gap-2">
              <FaRegHandshake className="text-2xl text-[#2acb35]" />
              Our Testimonials
            </h3>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">
              They Were <span className="text-[#2acb35]">Happy</span> With Our Service
            </h2>
            <p className="text-gray-600 mt-4 text-base">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore.
            </p>
            <p className="text-gray-600 mt-2 text-base">
              Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <NavLink to="/success">
              <button className="mt-6 bg-[#2acb35] hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-full">
                View More
              </button>
            </NavLink>
          </div>

          <div>
            <Slider {...mobileSliderSettings}>
              {testimonials.map((testimonial) => (
                <NewsletterReview key={testimonial.id} testimonial={testimonial} />
              ))}
            </Slider>
          </div>
        </div>
      </div>

      <NewsletterOption />
    </div>
  );
};

export default NewsletterPage;
