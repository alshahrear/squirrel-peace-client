import { IoIosArrowBack } from "react-icons/io";
import { IoIosArrowForward } from "react-icons/io";
import { useEffect, useState, useRef } from "react";
import Testimonial from "./Testimonial";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import { NavLink } from "react-router-dom";
import Loader from "../../../../Components/Loader";

const Testimonials = () => {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const prevRef = useRef(null);
  const nextRef = useRef(null);

  useEffect(() => {
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

  return (
    <div className="bg-[#f7f7f7] pb-20 relative">
      {/* Desktop ViewAll button */}
      <div className="hidden sm:flex justify-end text-end pt-5 pr-10">
        <NavLink to="/success" className="relative group inline-block">
          <button className="relative overflow-hidden px-6 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300">
            <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
              View All
            </span>
            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
          </button>
        </NavLink>
      </div>

      {/* Heading */}
      <div className="text-center pt-10 md:pt-0 space-y-2 px-4 sm:px-0 max-w-4xl mx-auto">
        <p className="text-2xl font-semibold text-gray-700">
          -- What our customers say --
        </p>
        <h2 className="text-3xl text-[#2acb35] font-bold border-y-2 py-3 inline-block">
          Testimonials
        </h2>
      </div>

      {/* Swiper Section */}
      <div className="max-w-screen-xl mt-6 mx-auto relative px-4 sm:px-6">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <Loader />
          </div>
        ) : (
          <>
            <Swiper
              modules={[Navigation, Autoplay]}
              slidesPerView={3}
              loop={true}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              navigation={{
                prevEl: prevRef.current,
                nextEl: nextRef.current,
              }}
              onInit={(swiper) => {
                swiper.params.navigation.prevEl = prevRef.current;
                swiper.params.navigation.nextEl = nextRef.current;
                swiper.navigation.init();
                swiper.navigation.update();
              }}
              breakpoints={{
                0: { slidesPerView: 1 },
                640: { slidesPerView: 1 },
                768: { slidesPerView: 2 },
                1024: { slidesPerView: 3 },
              }}
              spaceBetween={20}
            >
              {testimonials.map((testimonial) => (
                <SwiperSlide key={testimonial._id}>
                  <Testimonial testimonial={testimonial} />
                </SwiperSlide>
              ))}
            </Swiper>

            {/* Navigation Buttons & Mobile ViewAll */}
            <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10 flex flex-col items-center space-y-2 w-full max-w-xs px-4 sm:max-w-none sm:w-auto">
              {/* Navigation arrows: hidden on mobile, visible sm+ */}
              <div className="hidden sm:flex space-x-2">
                <button
                  ref={prevRef}
                  className="prev-button bg-[#2acb35] text-white w-8 h-8 rounded-l hover:opacity-90 transition sm:w-10 sm:h-10 flex items-center justify-center"
                  aria-label="Previous testimonial"
                >
                  <IoIosArrowBack className="text-2xl sm:text-3xl" />
                </button>
                <button
                  ref={nextRef}
                  className="next-button bg-[#2acb35] text-white w-8 h-8 rounded-r hover:opacity-90 transition px-2 sm:w-10 sm:h-10 flex items-center justify-center"
                  aria-label="Next testimonial"
                >
                  <IoIosArrowForward className="text-2xl sm:text-3xl" />
                </button>
              </div>

              {/* Mobile ViewAll Button below arrows */}
              <div className="block sm:hidden w-full">
                <NavLink to="/success" className="relative group inline-block w-full">
                  <button className="w-full h-10 px-6 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300">
                    <span className="relative z-10 transition-colors duration-300 group-hover:text-[#404040]">
                      View All
                    </span>
                    <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                  </button>
                </NavLink>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Testimonials;
