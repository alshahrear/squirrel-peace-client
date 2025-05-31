import preview from "../../../assets/preview2.jpeg";
import { FaBookOpen } from "react-icons/fa";
import pdf1 from "../../../assets/EM certificate.pdf";
import { FaCloudDownloadAlt } from "react-icons/fa";

const LetterPreview = () => {
    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = pdf1;
        link.download = 'EM_certificate.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-5xl mx-auto mb-10 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white rounded-xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-lg">
            {/* Left Side Text */}
            <div className="flex-1">
                <div className="flex items-center gap-2 mb-2 text-orange-400 text-xl font-semibold">
                    <FaBookOpen />
                    <span>Free Letter Guide</span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold leading-snug mb-2">
                    Learn How Our Monthly Letter <br />
                    Can Boost Your Creativity
                </h2>
                <p className="text-sm md:text-base text-gray-300 mb-5">
                    Get valuable insights, creative tips, and exclusive updates delivered directly to your doorstep. Start your inspiring journey today!
                </p>
                <button
                    className="bg-[#2acb35] hover:bg-green-600 transition px-5 py-2 text-white font-semibold  rounded-md shadow-md flex items-center gap-2"
                    onClick={handleDownload}
                >
                    Download Free Sample Letter (PDF)
                    <FaCloudDownloadAlt className="text-xl"></FaCloudDownloadAlt>
                </button>
            </div>

            {/* Right Side Letter Preview Image */}
            <div className="flex-shrink-0">
                <img
                    src={preview}
                    alt="Letter Preview"
                    className="w-40 md:w-56 rounded-lg shadow-lg"
                />
            </div>
        </div>
    );
};

export default LetterPreview;
