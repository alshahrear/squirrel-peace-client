import { useEffect, useRef, useState } from "react";
import newsHome from "../../../../assets/newsletterHome3.jpg";
import Marquee from "react-fast-marquee";

const Newsletter = () => {
    const [isVisible, setIsVisible] = useState(false);
    const sectionRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.3 }
        );

        if (sectionRef.current) {
            observer.observe(sectionRef.current);
        }

        return () => {
            if (sectionRef.current) {
                observer.unobserve(sectionRef.current);
            }
        };
    }, []);

    return (
        <div ref={sectionRef}>
            <Marquee
                speed={50}
                gradient={false}
                className="bg-[#2acb35] text-white py-4 text-lg font-medium"
            >
                🌱 Stay in the Loop! Get Squirrel Peace tips, exclusive offers & plant updates
                delivered straight to your inbox! 💌 Subscribe now and grow with us! 🌿
            </Marquee>

            <div
                className="relative h-[400px] flex flex-col items-center justify-center text-center text-white px-6
                           sm:h-[350px] sm:px-4
                           xs:h-[300px] xs:px-3"
                style={{
                    backgroundImage: `url(${newsHome})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    backgroundAttachment: "fixed",
                }}
            >
                <div className="absolute inset-0 bg-black/30 rounded-md"></div>

                <div
                    className={`relative z-10 space-y-4 max-w-4xl
                                ${isVisible ? "animate__animated animate__zoomInUp" : "opacity-0"}`}
                >
                    <h2 className="text-2xl md:text-3xl font-bold
                                   xs:text-xl xs:leading-snug">
                        Stay Connected with Nature! 🌿
                    </h2>
                    <p className="text-lg font-medium
                                  xs:text-base xs:leading-relaxed">
                        Subscribe to our <span className="text-[#e6e94d] font-bold">Newsletter</span> for eco-friendly tips, special offers,<br />
                        and the latest updates on new plants! 🌱
                    </p>

                    <a
                        href="https://emerald-diary.beehiiv.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <button
                            className="bg-gradient-to-r from-[#2acb35] via-green-600 to-[#2acb35] text-white font-semibold px-6 py-2 rounded-md
                                       hover:from-green-800 hover:via-green-700 hover:to-lime-600 transition-all duration-300
                                       xs:w-full"
                        >
                            Subscribe
                        </button>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default Newsletter;
