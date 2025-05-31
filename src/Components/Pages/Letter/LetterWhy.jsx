import { FaCheckCircle } from "react-icons/fa";
import letterBook from "../../../assets/news4.jpg";

const LetterWhy = () => {
    return (
        <div className="">
            <h2 className="text-2xl font-bold text-gray-800">
                Why Choose Our Letter Subscription?
            </h2>
            <div className="border-1 border-gray-300 rounded-lg p-6 md:flex items-center justify-between bg-white mt-5 font-medium">
                {/* Text Content */}
                <div className="md:w-2/3 space-y-4">
                    <p className="text-gray-700 flex items-start gap-2">
                        <FaCheckCircle className="text-[#2acb35] mt-1" />
                        Thoughtfully crafted physical letters delivered to your doorstep every week.
                    </p>
                    <p className="text-gray-700 flex items-start gap-2">
                        <FaCheckCircle className="text-[#2acb35] mt-1" />
                        Build the habit of focused, screen-free reading with expert-curated content.
                    </p>
                    <p className="text-gray-700 flex items-start gap-2">
                        <FaCheckCircle className="text-[#2acb35] mt-1" />
                        Exclusive activities, creative challenges & community rewards each month.
                    </p>
                </div>

                {/* Image */}
                <div className="md:w-1/3 mt-6 md:mt-0 flex justify-center">
                    <img
                        src={letterBook}
                        alt="Letter Book Cover"
                        className="w-48 h-48 md:w-64 rounded-lg"
                    />
                </div>
            </div>
        </div>
    );
};

export default LetterWhy;
