import letter from "../../../../assets/story2.jpg";
import { Toaster } from "react-hot-toast";
import "animate.css";
import Marquee from "react-fast-marquee";
import { GiLoveLetter } from "react-icons/gi";

const LetterHome = () => {

    return (
        <div>
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
                    backgroundImage: `url(${letter})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                }}
            >
                <div className="absolute inset-0 bg-black/40 rounded-md"></div>

                <div className="relative z-10 space-y-4 animate__animated animate__zoomInUp">
                    <h2 className="text-2xl md:text-3xl font-bold">Stay Connected with Nature! 🌿</h2>
                    <p className="text-lg font-medium">
                        Subscribe to our <span className="text-[#e6e94d] font-bold">letter</span> for eco-friendly tips, special offers,<br />
                        and the latest updates on new plants! 🌱
                    </p>
                    <button className="flex mx-auto bg-[#f7f7f7] items-center btn mt-5 border-1 shadow-lg hover:scale-105">Get letter
                        <GiLoveLetter className="text-2xl"></GiLoveLetter>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LetterHome;
