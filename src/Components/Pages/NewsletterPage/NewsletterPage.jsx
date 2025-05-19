import newscover from "../../../assets/newscover.jpg";
import newsletter from "../../../assets/newsletter.jpg";
import testimonial from "../../../assets/Testimonialshome.jpg";
import { FaBookReader } from "react-icons/fa";
import { useEffect, useState } from "react";
import NewsletterOption from "../../Layout/NewsletterOption/NewsletterOption";

const skills = [
    { name: "Recycling", percentage: 90 },
    { name: "Ocean Cleaning", percentage: 80 },
    { name: "Tree Plantation", percentage: 85 },
    { name: "Plastic Reduction", percentage: 75 },
];

const NewsletterPage = () => {
    const [progress, setProgress] = useState(skills.map(() => 0));

    useEffect(() => {
        const interval = setInterval(() => {
            setProgress((prev) =>
                prev.map((value, index) =>
                    value < skills[index].percentage ? value + 1 : value
                )
            );
        }, 20);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="my-10 ">
            <div className="text-center space-y-3 mb-12">
                <h1 className="text-4xl font-bold text-[#082c2f]">
                    Join Our Weekly Newsletter
                </h1>
                <p className="text-lg text-gray-700 font-medium max-w-3xl mx-auto">
                    Once a week, Squirrel Peace sends thoughtful, helpful content about freelancing, focus, and finding balance in your creative work.
                </p>
            </div>

            <div className="bg-[#f5f8ed]">
                <div className="py-12 rounded-2xl">
                    <div className="text-center space-y-2 mb-12">
                        <h2 className="text-3xl font-bold text-[#082c2f]">
                            <span className="text-[#2acb35]">1000+</span> People Join With Us
                        </h2>
                        <p className="text-lg text-gray-700 font-medium">It's change your life</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-10 max-w-7xl mx-auto px-4">
                        {/* Images Grid */}
                        <div className="grid grid-cols-2 gap-5">
                            {[newscover, newsletter, testimonial, newscover].map((img, idx) => (
                                <div
                                    key={idx}
                                    className="relative overflow-hidden rounded-xl group"
                                >
                                    <img
                                        className="w-full h-60 object-cover rounded-xl transform transition-transform duration-500 group-hover:scale-110"
                                        src={img}
                                        alt={`Newsletter ${idx}`}
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black/40 translate-y-[-100%] group-hover:translate-y-0 transition-transform duration-500 ease-in-out rounded-xl pointer-events-none" />
                                </div>
                            ))}
                        </div>

                        {/* Right Content */}
                        <div className="space-y-6 flex flex-col justify-center">
                            <h2 className="text-3xl font-bold text-[#082c2f]">
                                Getting A Greener Future Safe Environment
                            </h2>
                            <p className="text-gray-600 text-lg">
                                Competently cultivate worldwide e-tailers through principle-centered value professionally engineer high-payoff deliverables without exceptional processes. Rapidiously network cost effective vortals.
                            </p>

                            <div className="flex flex-col md:flex-row gap-6">
                                {["Safe Environment", "Dirty Recycling"].map((item, index) => (
                                    <p
                                        key={index}
                                        className="group relative flex items-center gap-4 p-4 bg-white text-xl font-semibold rounded-xl overflow-hidden cursor-pointer transition-all duration-500"
                                    >
                                        <span className="absolute inset-0 bg-[#2acb35] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500 ease-out z-0 rounded-xl" />
                                        <FaBookReader className="text-2xl text-[#2acb35] z-10 group-hover:text-white transition-colors duration-300" />
                                        <span className="z-10 group-hover:text-white transition-colors duration-300">
                                            {item}
                                        </span>
                                    </p>
                                ))}
                            </div>

                            {/* Progress Bar */}
                            <div className="bg-[#f5f7ec] rounded-xl space-y-6 p-4">
                                {skills.map((skill, index) => (
                                    <div key={index}>
                                        <div className="flex justify-between text-[#082c2f] text-lg font-semibold mb-1">
                                            <span>{skill.name}</span>
                                            <span>{progress[index]}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-[#d0e0d5] rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-[#2acb35] rounded-full transition-all duration-300"
                                                style={{ width: `${progress[index]}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>
            </div>
            
            <div className="-mb-10">
                <NewsletterOption></NewsletterOption>
            </div>
        </div>
    );
};

export default NewsletterPage;
