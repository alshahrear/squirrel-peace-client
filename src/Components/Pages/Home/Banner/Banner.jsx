import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import 'animate.css';
import { NavLink } from "react-router-dom";

import banner1 from "../../../../assets/about2.jpg";
import banner2 from "../../../../assets/about3.jpg";
import banner3 from "../../../../assets/about5.jpg";
import banner4 from "../../../../assets/about6.jpg";

const images = [banner1, banner2, banner3, banner4];

const Banner = () => {
    return (
        <div>
            <div className="relative w-full h-[350px] sm:h-[400px] md:h-[450px] lg:h-[500px] overflow-hidden">
                {/* Background Swiper Image Slider */}
                <Swiper
                    modules={[Autoplay]}
                    autoplay={{ delay: 4000, disableOnInteraction: false }}
                    loop={true}
                    slidesPerView={1}
                    className="w-full h-full"
                >
                    {images.map((img, index) => (
                        <SwiperSlide key={index}>
                            <div className="w-full h-full relative">
                                <img
                                    src={img}
                                    alt={`Slide ${index}`}
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40"></div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Foreground Text Content */}
                <div className="absolute inset-0 flex items-center justify-start px-4 sm:px-8 md:px-12 z-10 text-white">
                    <div className="max-w-xl text-left animate__animated animate__slideInLeft space-y-4">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-snug">
                            Welcome to Squirrel Peace
                        </h1>
                        <p className="text-sm sm:text-base max-w-md sm:max-w-lg drop-shadow-md">
                            Discover the soothing harmony of nature — where every tree, breeze, and birdsong whispers calm into your soul. Let your journey toward natural serenity begin here.
                        </p>
                        <div className="animate__animated animate__slideInUp animate__slow flex flex-wrap gap-4 sm:gap-6 pt-2 sm:pt-4">
                            <button className="bg-[#2acb35] hover:bg-transparent border border-[#2acb35] text-white px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold shadow-lg transition duration-300 text-sm sm:text-base">
                                About Us
                            </button>
                            <NavLink to="/contact">
                                <button className="bg-white hover:bg-transparent border border-white text-[#2acb35] px-6 sm:px-8 py-2 sm:py-3 rounded-xl font-semibold shadow-lg transition duration-300 text-sm sm:text-base">
                                    Contact Us
                                </button>
                            </NavLink>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Banner;
