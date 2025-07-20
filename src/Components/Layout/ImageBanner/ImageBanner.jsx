import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import img1 from "../../../assets/about1.jpg";
import img2 from "../../../assets/about2.jpg";
import img3 from "../../../assets/about3.jpg";
import img4 from "../../../assets/about4.jpg";
import { NavLink } from "react-router-dom";

const images = [img1, img2, img3, img4];

const ImageBanner = () => {
    return (
        <div>
            <div className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[450px] overflow-hidden">
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
                                {/* Light Dark Overlay */}
                                <div className="absolute inset-0 bg-black/20"></div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Fixed Foreground Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                    <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white drop-shadow-md mb-4">
                        Discover the Art of Creativity
                    </h1>
                    <p className="text-sm sm:text-base md:text-xl text-white max-w-2xl drop-shadow-sm">
                        Join us on a journey through color, imagination, and inspiration. Your creative world begins here.
                    </p>
                    <NavLink to="">
                        <button className="bg-[#2acb35] hover:bg-transparent hover:border-1 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300 mt-5">
                            See Story
                        </button>
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default ImageBanner;
