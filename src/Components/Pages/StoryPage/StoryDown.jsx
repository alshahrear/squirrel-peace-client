import { FaCoffee } from "react-icons/fa";
import { MdHighQuality } from "react-icons/md";
import { GiCoffeeBeans } from "react-icons/gi";
import { PiCoffeeFill } from "react-icons/pi";

const StoryDown = () => {
    const features = [
        {
            icon: <FaCoffee className="text-4xl mb-2" />,
            title: "Awesome Aroma",
            description: "You will definitely be a fan of the design & aroma of your coffee"
        },
        {
            icon: <MdHighQuality className="text-4xl mb-2" />,
            title: "High Quality",
            description: "We served the coffee to you maintaining the best quality"
        },
        {
            icon: <GiCoffeeBeans className="text-4xl mb-2" />,
            title: "Pure Grades",
            description: "The coffee is made of the green coffee beans which you will love"
        },
        {
            icon: <PiCoffeeFill className="text-4xl mb-2" />,
            title: "Proper Roasting",
            description: "Your coffee is brewed by first roasting the green coffee beans"
        }
    ];

    return (
        <div className="bg-[#f5f2eb] py-10">
            <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-center text-[#3c2a21]">
                {features.map((feature, index) => (
                    <div key={index}>
                        <div className="flex justify-center">{feature.icon}</div>
                        <h3 className="text-lg font-semibold mt-2">{feature.title}</h3>
                        <p className="text-sm mt-1">{feature.description}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StoryDown;
