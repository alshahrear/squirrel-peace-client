import { useState, useEffect, useRef } from "react";
import newsHome from "../../../../assets/story2.jpg";
import { toast, Toaster } from "react-hot-toast";
import "animate.css";
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

    const handleNewsletter = (e) => {
        e.preventDefault();
        const form = e.target;
        const email = form.email.value;

        if (!email) {
            toast.error("Please enter a valid email! 📩");
            return;
        }

        toast.success("Thank you for subscribing to our newsletter! 🎉");
        form.reset();
    };

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

            <Toaster position="top-right" reverseOrder={false} />

            <div
                className="relative h-[400px] flex flex-col items-center justify-center text-center text-white px-6"
                style={{
                    backgroundImage: `url(${newsHome})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <div className="absolute inset-0 bg-black/40 rounded-md"></div>

                <div className={`relative z-10 space-y-4 ${isVisible ? "animate__animated animate__zoomInUp" : "opacity-0"}`}>
                    <h2 className="text-2xl md:text-3xl font-bold">Stay Connected with Nature! 🌿</h2>
                    <p className="text-lg font-medium">
                        Subscribe to our <span className="text-[#e6e94d] font-bold">Newsletter</span> for eco-friendly tips, special offers,<br />
                        and the latest updates on new plants! 🌱
                    </p>
                    <form onSubmit={handleNewsletter} className="flex flex-col md:flex-row items-center gap-4 justify-center">
                        <input
                            className="border border-[#b7d5ba] px-4 py-2 rounded-md text-black w-72"
                            type="email"
                            name="email"
                            placeholder="Enter your email"
                        />
                        <button
                            type="submit"
                            className="bg-gradient-to-r from-[#2acb35] via-green-600 to-[#2acb35] text-white font-semibold px-6 py-2 rounded-md hover:from-green-800 hover:via-green-700 hover:to-lime-600 transition-all duration-300"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Newsletter;
