import bannerHome from "../../../../assets/banner-home.jpg";
import 'animate.css';

const Banner = () => {
    return (
        <div
            className="mb-10 bg-cover bg-center text-white"
            style={{
                backgroundImage: `url(${bannerHome})`,
                backgroundBlendMode: "overlay",
                backgroundColor: "rgba(0, 0, 0, 0.4)",
            }}
        >
            <div className="py-24 max-w-screen-xl mx-auto">
                <div className="animate__animated animate__slideInLeft">
                    <h1 className="text-4xl font-bold mb-4">Welcome to Squirrel Peace</h1>
                    <h2 className="text-xl font-medium mb-4">Embrace Nature. Experience Peace.</h2>
                    <p className="max-w-xl text-base mb-6">
                        Discover the soothing harmony of nature — where every tree, breeze, and birdsong whispers calm into your soul. Let your journey toward natural serenity begin here.
                    </p>
                </div>
                <div className="animate__animated animate__slideInUp animate__slow">
                    <button className="bg-[#2acb35] hover:bg-transparent hover:border-1 text-white px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300 mr-10">
                        Explore Now
                    </button>
                    <button className="bg-white hover:bg-transparent hover:border-1 text-[#2acb35] px-6 py-3 rounded-xl font-semibold shadow-lg transition duration-300">
                        Contact Us
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Banner;
