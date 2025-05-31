import { useState } from "react";
import { FaEnvelopeOpenText, FaGift, FaHandsHelping } from "react-icons/fa";
import { MdLocalActivity, MdOutlineScreenLockPortrait } from "react-icons/md";
import { LuBookOpenCheck } from "react-icons/lu";
import letter1 from "../../../assets/story3.jpg";
import letter2 from "../../../assets/news4.jpg";

const LetterPackage = () => {
    const [selectedContent, setSelectedContent] = useState("video");

    const thumbnails = [
        { type: "image", src: letter1, alt: "Thumb 1" },
        { type: "image", src: letter2, alt: "Thumb 2" },
    ];

    const isSelected = (src) => selectedContent === src;

    return (
        <div className="max-w-md mx-auto  bg-white rounded-lg shadow-lg p-4">
            {/* Display Video or Selected Image */}
            <div className="relative aspect-video w-full rounded-md overflow-hidden">
                {selectedContent === "video" ? (
                    <iframe
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/fOTUNm2Kn-Y?si=5G7OMpsmK9wsYvuz"
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <img
                        src={selectedContent}
                        alt="Selected content"
                        className="w-full h-full object-cover"
                    />
                )}
            </div>

            {/* Thumbnail Selector */}
            <div className="flex space-x-2 mt-3 overflow-x-auto">
                {/* YouTube Video Thumbnail */}
                <div
                    className={`w-16 h-10 rounded-md overflow-hidden cursor-pointer ${
                        isSelected("video")
                            ? "border-2 border-blue-500"
                            : "border border-green-500"
                    }`}
                    onClick={() => setSelectedContent("video")}
                >
                    <img
                        src="https://img.youtube.com/vi/fOTUNm2Kn-Y/mqdefault.jpg"
                        alt="Video Thumbnail"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Image Thumbnails */}
                {thumbnails.map((thumb, idx) => (
                    <div
                        key={idx}
                        onClick={() => setSelectedContent(thumb.src)}
                        className={`w-16 h-10 rounded-md overflow-hidden cursor-pointer ${
                            isSelected(thumb.src)
                                ? "border-2 border-blue-500"
                                : "border border-[#2acb35]"
                        }`}
                    >
                        <img
                            src={thumb.src}
                            alt={thumb.alt}
                            className="w-full h-full object-cover"
                        />
                    </div>
                ))}
            </div>

            {/* Price & Button */}
            <div className="mt-4">
                <h2 className="text-xl font-semibold text-gray-800">৳999/Month</h2>
                <button className="btn mt-2 bg-[#2acb35] text-white px-6 py-2 rounded-lg text-lg font-semibold w-full">
                    Subscribe Letter
                </button>
            </div>

            {/* Features */}
            <div className="mt-5 space-y-3 font-medium text-[#4a4f5b]">
                <div className="flex items-center space-x-2">
                    <FaEnvelopeOpenText className="text-green-600" />
                    <p>55+ members join us.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <LuBookOpenCheck className="text-green-600" />
                    <p>Get the letter at your home on time.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <FaHandsHelping className="text-green-600" />
                    <p>Weekly letter – 4/month.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <MdLocalActivity className="text-green-600" />
                    <p>Submit, check, and review.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <FaGift className="text-green-600" />
                    <p>Awards every month.</p>
                </div>
                <div className="flex items-center space-x-2">
                    <MdOutlineScreenLockPortrait className="text-green-600" />
                    <p>100% screen-free reading experience.</p>
                </div>
            </div>
        </div>
    );
};

export default LetterPackage;
