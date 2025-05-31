import { Link } from 'react-router-dom';
import book1 from '../../../../assets/story3.jpg';
import book2 from '../../../../assets/story2.jpg';

const LetterHome = () => {
    return (
        <div className="bg-[#f1f1f1] py-10 px-4 md:px-20 flex flex-col lg:flex-row items-center justify-between gap-10">
            {/* Books Section */}
            <div className="flex items-center justify-center space-x-[-30px]">
                <img
                    src={book1}
                    alt="Happy Healthy Young and Beautiful"
                    className="w-60 z-10 shadow-lg rounded"
                />
                <img
                    src={book2}
                    alt="Realistic Book Mockup"
                    className="w-60 translate-x-[-40px] opacity-90 rounded"
                />
            </div>

            {/* Text Section */}
            <div className="text-center lg:text-left max-w-xl">
                <h2 className="text-3xl md:text-4xl font-semibold text-[#2acb35] mb-4">
                    Heartfelt Letters for Your Little One 💌
                </h2>
                <p className="text-gray-600 mb-6">
                    Subscribe to receive weekly letters filled with love, encouragement, and magical words for your child. Designed to boost confidence, spark imagination, and bring a smile to their face — one letter at a time.
                </p>
                <Link to="/letterPages">
                    <button className="px-5 py-2 border-2 border-[#2acb35] text-[#2acb35] hover:bg-[#2acb35] hover:text-white rounded-full transition-all">
                        More info
                    </button>
                </Link>
            </div>
        </div>
    );
};

export default LetterHome;
