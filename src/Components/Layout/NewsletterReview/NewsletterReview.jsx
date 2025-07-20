import { FaQuoteRight } from "react-icons/fa6";
import check from "../../../assets/newsletter.jpg";

const NewsletterReview = ({ testimonial }) => {
    const { customerName, review, profileLink } = testimonial || {};

    return (
        <div>
            <div className="bg-green-50 border border-green-100 rounded-xl p-8 relative group transition-all duration-300">
                <FaQuoteRight className="text-4xl text-green-200 absolute top-6 left-6" />
                <div className="flex justify-center mb-4">
                    <img
                        src={profileLink || check}
                        alt="Reviewer"
                        className="w-24 h-24 rounded-full object-cover border-4 border-white group-hover:border-[#2acb35] transform group-hover:scale-105 transition-all duration-300"
                    />
                </div>
                <div className="border-b border-green-200 text-center pb-3">
                    <h4 className="text-lg font-semibold ">{customerName || "Anonymous"}</h4>
                    <p className="text-[#2acb35]">Subscriber of Newsletter</p>
                </div>
                <p className="italic pt-5">{review || "No review available"}</p>
            </div>
        </div>
    );
};

export default NewsletterReview;
