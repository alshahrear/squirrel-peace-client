import { useEffect, useRef, useState } from "react";
import BannerLetter from "./BannerLetter";
import LetterAbout from "./LetterAbout";
import LetterPackage from "./LetterPackage";
import LetterPreview from "./LetterPreview";
import LetterWhy from "./LetterWhy";
import LetterFaqs from "./LetterFaqs";
import LetterTestimonials from "./LetterTestimonials";

const LettersPages = () => {
    const footerRef = useRef(null);
    const leftSectionRef = useRef(null);
    const [shouldMoveUp, setShouldMoveUp] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShouldMoveUp(entry.isIntersecting);
            },
            {
                root: null,
                threshold: 0,
            }
        );

        if (footerRef.current) {
            observer.observe(footerRef.current);
        }

        return () => {
            if (footerRef.current) {
                observer.unobserve(footerRef.current);
            }
        };
    }, []);

    return (
        <div className="relative">
            {/* Top Banner */}
            <BannerLetter />

            {/* Main Content */}
            <div className="flex gap-10 max-w-screen-xl mx-auto relative z-10 py-10">
                {/* Left scrollable content */}
                <div ref={leftSectionRef} className="w-2/3">
                    <LetterPreview />
                    <LetterAbout />
                    <LetterWhy />
                    <LetterFaqs></LetterFaqs>
                    <LetterTestimonials></LetterTestimonials>
                </div>

                {/* Right fixed box */}
                <div className="w-1/3 relative">
                    <div
                        className="sticky top-[10px]"
                        style={{
                            marginTop: "-40vh",
                            marginBottom: shouldMoveUp ? "2.5rem" : "0",
                            transition: "margin-bottom 0.3s ease",
                        }}
                    >
                        <LetterPackage />
                    </div>
                </div>
            </div>

            {/* Footer detector */}
            <div ref={footerRef} className="w-full h-[1px]"></div>
        </div>
    );
};

export default LettersPages;
