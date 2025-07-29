import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";

import img1 from "../../../assets/home2.jpg";
import img2 from "../../../assets/home3.jpg";
import img3 from "../../../assets/home4.jpg";
import img4 from "../../../assets/home5.jpg";
import img5 from "../../../assets/home1.jpg";
import { NavLink } from "react-router-dom";

const images = [img1, img2, img3, img4, img5];

const ImageBanner = () => {
    return (
        <div>
            <div className="relative w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] overflow-hidden">
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
                                <div className="absolute inset-0 bg-black/30"></div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* Fixed Foreground Content */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-10">
                    <h2 className="text-2xl md:text-4xl font-semibold text-white drop-shadow-md">
                        Discover who we are & Why you should stay with us
                    </h2>
                </div>
            </div>
        </div>
    );
};

export default ImageBanner;
