import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import newsletter1 from "../../../assets/newsletter1.jpg";
import newsletter2 from "../../../assets/newsletter2.jpg";
import newsletter3 from "../../../assets/newsletter3.jpg";
import newsletter4 from "../../../assets/newsletter4.jpg";
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
  { name: "Reader Satisfaction", percentage: 96 },
  { name: "Mental Peace & Clarity", percentage: 94 },
  { name: "Life Improvement Tips", percentage: 95 },
  { name: "Knowledge Expansion", percentage: 93 },
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

  const bannerImages = [newsletter1, newsletter2, newsletter3, newsletter4];

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
        {/* Basic Meta Tags */}
        <title>Newsletter - Squirrel Peace | Daily Positivity & Inspiration</title>
        <meta
          name="description"
          content="Join 1000+ readers who receive our free daily newsletter filled with positivity, inspiring stories, and life-enriching ideas from Squirrel Peace."
        />
        <meta
          name="keywords"
          content="newsletter, daily inspiration, positive newsletter, squirrel peace newsletter, life tips, motivation, happiness"
        />
        <link rel="canonical" href="https://squirrelpeace.com/newsletter" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Facebook */}
        <meta property="og:title" content="Newsletter - Squirrel Peace | Daily Positivity & Inspiration" />
        <meta property="og:description" content="Join 1000+ readers who receive our free daily newsletter filled with positivity, inspiring stories, and life-enriching ideas from Squirrel Peace." />
        <meta property="og:image" content="https://squirrelpeace.com/images/newsletter-cover.jpg" />
        <meta property="og:url" content="https://squirrelpeace.com/newsletter" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Newsletter - Squirrel Peace | Daily Positivity & Inspiration" />
        <meta name="twitter:description" content="Join 1000+ readers who receive our free daily newsletter filled with positivity, inspiring stories, and life-enriching ideas from Squirrel Peace." />
        <meta name="twitter:image" content="https://squirrelpeace.com/images/newsletter-cover.jpg" />
      </Helmet>


      {/* 🖥️ Heading (Desktop Only) */}
      <div className="hidden lg:block text-center bg-[#f7f7f7] pt-6 px-4">
        <h2 className="text-3xl font-bold text-[#082c2f]">
          <span className="text-[#2acb35]">The 1000+</span> People Have Joined Us
        </h2>
        <p className="text-gray-700 text-xl mt-2">Please subscribe our newsletter — It's 100% free!</p>
      </div>

      {/* 📱 Mobile Slider with Overlay Text */}
      <div className="block lg:hidden relative">
        <Slider {...mobileSliderSettings}>
          {bannerImages.map((img, idx) => (
            <div key={idx} className="relative">
              <img
                src={img}
                alt={`Mobile Banner ${idx}`}
                className="w-full h-[350px] object-cover"
              />
              <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-white text-center px-4">
                <h2 className="text-3xl font-bold"><span className="text-[#2acb35]">1000+</span> People Have Joined Us 😊</h2>
                <p className="mt-1 text-lg font-medium">Please subscribe our newsletter — <br /> It's 100% free!</p>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* 📱 Mobile: Greener Future + Progress Bar */}
      <div className="block lg:hidden px-4 mt-6" ref={progressRef}>
        <h2 className="text-2xl font-semibold text-[#082c2f] text-center">
          Let Each Newsletter Bring a Smile to Your Day
        </h2>
        <p className="mt-2">
          Our daily newsletter is more than just emails. It's a quiet moment of joy, a warm voice in the noise, and a reminder that life is still full of beauty, meaning, and hope.
          Every morning, we send you something special — heartwarming stories, inspiring thoughts, life-enriching ideas, and joyful surprises. It's a space where you can pause, breathe, smile, and feel connected to something bigger.
        </p>
        <p className="mt-2 ">Over 1000+ kind souls have already joined this journey of light and happiness. Now it's your turn - <a
          href="https://squirrelnewsletter.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-[#2acb35] text-lg font-semibold"
        >
          Subscribe now
        </a>
        </p>

        <div className="mt-6 space-y-5">
          {skills.map((skill, index) => (
            <div key={index}>
              <div className="flex justify-between text-[#082c2f] font-semibold">
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
            <div className="grid grid-cols-2 gap-7 h-full">
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
            <div className="space-y-2 flex flex-col justify-center" ref={progressRef}>
              <h2 className="text-2xl font-semibold text-[#082c2f]">
                Let Each Newsletter Bring a Smile to Your Day
              </h2>
              <p className="text-lg">
                Our daily newsletter is more than just emails. It's a quiet moment of joy, a warm voice in the noise, and a reminder that life is still full of beauty, meaning, and hope.
                Every morning, we send you something special — heartwarming stories, inspiring thoughts, life-enriching ideas, and joyful surprises. It's a space where you can pause, breathe, smile, and feel connected to something bigger.
              </p>
              <p className="mt-2 text-lg">Over 1000+ kind souls have already joined this journey of light and happiness. Now it's your turn - <a
                href="https://squirrelnewsletter.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-[#2acb35] font-semibold"
              >
                Subscribe now
              </a>
              </p>

              {/* Progress Bars */}
              <div className="space-y-5 mt-2">
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
        <div className="bg-[#f7f7f7] pb-10">
          <NewsletterSubscribe />
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-[#f7f7f7]">
        <div className="max-w-7xl mx-auto px-4 pb-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="flex items-center text-2xl font-semibold text-gray-800 gap-2">
              <FaRegHandshake className="text-2xl text-[#2acb35]" />
              What Our Subscribers Say<span className="text-[#2acb35]">_</span>
            </h3>
            <p className=" mt-4 ">
              Our subscribers love the positive impact our newsletter brings to their daily lives. Read their honest reviews and see how we help make every day brighter and more meaningful. Join them and feel the difference!
            </p>
            <p className="mt-2 ">
              We truly care about our subscribers and their well-being. That's why we carefully curate every newsletter to bring you valuable, uplifting content that supports your happiness and growth. Your satisfaction is our greatest reward.
            </p>
            <NavLink to="/success">
              <button className="mt-5 bg-[#2acb35] hover:bg-[#5EC7A7] text-white font-semibold px-6 py-1 rounded-full">
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
