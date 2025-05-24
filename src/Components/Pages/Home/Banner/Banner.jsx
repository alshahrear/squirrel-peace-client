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
            <div className="relative w-full h-[500px] overflow-hidden mb-10">
                {/* Background Swiper Image Slider */}
                <Swiper
                    modules={[Autoplay]}
                    autoplay={{ delay: 4000, disableOnInteraction: false, reverseDirection: false }}
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

                {/* Fixed Foreground Content - Left Aligned */}
                <div className="absolute inset-y-0 left-0 flex flex-col justify-center px-12 max-w-xl text-left z-10 text-white">
                    <div className="animate__animated animate__slideInLeft">
                        <h1 className="text-5xl font-bold mb-4">
                            Welcome to Squirrel Peace
                        </h1>
                        <h2 className="text-2xl font-medium mb-6">
                            Embrace Nature. Experience Peace.
                        </h2>
                        <p className="max-w-lg text-base mb-8 drop-shadow-md">
                            Discover the soothing harmony of nature — where every tree, breeze, and birdsong whispers calm into your soul. Let your journey toward natural serenity begin here.
                        </p>
                    </div>
                    <div className="animate__animated animate__slideInUp animate__slow flex gap-6">
                        <button className="bg-[#2acb35] hover:bg-transparent border border-[#2acb35] text-white px-8 py-3 rounded-xl font-semibold shadow-lg transition duration-300">
                            Explore Now
                        </button>
                        <NavLink to="/contact">
                            <button className="bg-white hover:bg-transparent border border-white text-[#2acb35] px-8 py-3 rounded-xl font-semibold shadow-lg transition duration-300">
                                Contact Us
                            </button>
                        </NavLink>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Banner;
