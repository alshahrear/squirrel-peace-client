import { useState } from "react";
import { FaEnvelopeOpenText, FaGift, FaHandsHelping, FaTimes } from "react-icons/fa";
import { MdLocalActivity } from "react-icons/md";
import { LuBookOpenCheck } from "react-icons/lu";
import letter1 from "../../../assets/story3.jpg";
import letter2 from "../../../assets/news4.jpg";
import { Link } from "react-router-dom";

const LetterPackage = () => {
    const [selectedContent, setSelectedContent] = useState("video");
    const [showAllFeatures, setShowAllFeatures] = useState(false);
    const [showVideoPopup, setShowVideoPopup] = useState(false);

    const thumbnails = [
        { type: "image", src: letter1, alt: "Thumb 1" },
        { type: "image", src: letter2, alt: "Thumb 2" },
    ];

    const isSelected = (src) => selectedContent === src;

    const allFeatures = [
        { icon: <FaEnvelopeOpenText className="text-[#2acb35]" />, text: "125+ with members join us." },
        { icon: <LuBookOpenCheck className="text-[#2acb35]" />, text: "Get the letter at your home on time." },
        { icon: <FaHandsHelping className="text-[#2acb35]" />, text: "Weekly letter – 4/month." },
        { icon: <MdLocalActivity className="text-[#2acb35]" />, text: "Submit, check, and review." },
        { icon: <FaGift className="text-[#2acb35]" />, text: "Awards every month." },
        { icon: <FaEnvelopeOpenText className="text-[#2acb35]" />, text: "55+ with members join us." },
        { icon: <LuBookOpenCheck className="text-[#2acb35]" />, text: "Get the letter at your home on time." },
        { icon: <FaHandsHelping className="text-[#2acb35]" />, text: "Weekly letter – 4/month." },
        { icon: <MdLocalActivity className="text-[#2acb35]" />, text: "Submit, check, and review." },
    ];

    const openPopup = () => {
        setShowVideoPopup(true);
    };

    const closePopup = () => {
        setShowVideoPopup(false);
    };

    return (
        <div className="max-w-md border border-gray-300 mx-auto bg-white rounded-lg shadow-lg p-4 relative z-10">
            {/* Top Section */}
            {!showAllFeatures && (
                <>
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

                    {/* Thumbnails */}
                    <div className="flex space-x-2 mt-3 overflow-x-auto">
                        <div
                            className={`w-16 h-10 rounded-md overflow-hidden cursor-pointer ${isSelected("video")
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

                        {thumbnails.map((thumb, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedContent(thumb.src)}
                                className={`w-16 h-10 rounded-md overflow-hidden cursor-pointer ${isSelected(thumb.src)
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
                </>
            )}

            {/* Price & Video Link */}
            {showAllFeatures ? <h3 className="text-center text-3xl font-extrabold">Letter Card</h3> : ''}
            <p className="mt-3">
                <span onClick={openPopup} className="underline text-[#2acb35] cursor-pointer">
                    Watch this video
                </span>{" "}
                to learn more about how to make a payment.
            </p>

            <div className="mt-3">
                <h2 className="text-xl font-semibold text-gray-800">৳ 999/month</h2>
                <button className="btn mt-2 bg-[#2acb35] text-white px-6 py-2 rounded-lg text-lg font-semibold w-full">
                    Subscribe Letter
                </button>
            </div>

            {/* Features */}
            <div className="mt-5 space-y-2 font-medium text-[#4a4f5b]">
                {(showAllFeatures ? allFeatures : allFeatures.slice(0, 4)).map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                        {feature.icon}
                        <p>{feature.text}</p>
                    </div>
                ))}

                {showAllFeatures ? (
                    <button
                        onClick={() => setShowAllFeatures(false)}
                        className="flex justify-end font-semibold underline text-[#2acb35] w-full"
                    >
                        See Less
                    </button>
                ) : (
                    <button
                        onClick={() => setShowAllFeatures(true)}
                        className="flex justify-end font-semibold underline text-[#2acb35] w-full"
                    >
                        See More
                    </button>
                )}
                {
                    showAllFeatures ?
                        <>
                            <div className="mt-3 flex items-center justify-between font-medium border-t border-t-gray-300 pt-3">
                                <p>More about this letter -
                                </p>
                                <p>
                                    <Link to="/contact" className="underline hover:text-[#2acb35] font-semibold">Contact</Link> or {' '}
                                    <Link className="underline hover:text-[#2acb35] font-semibold">Facebook</Link>
                                </p>
                            </div>
                        </> : ""
                }
            </div>

            {/* FLOATING VIDEO PLAYER WITHOUT OVERLAY */}
            {showVideoPopup && (
                <div className="fixed top-10 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl aspect-video">
                    <div className="relative w-full h-full bg-white rounded-md shadow-2xl border border-gray-300">
                        <iframe
                            className="w-full h-full rounded-md"
                            src="https://www.youtube.com/embed/5wfn60rmWX4?autoplay=1"
                            title="YouTube Popup"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                        <button
                            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                            onClick={closePopup}
                        >
                            <FaTimes />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LetterPackage;
