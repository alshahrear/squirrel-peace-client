
import { Link } from "react-router-dom";
import NewsletterFaqs from "./NewsletterFaqs";
import NewsletterPoint from "./NewsletterPoint";

const NewsletterWhy = () => {
    return (
        <div className="pb-10 bg-[#f5f8ed]">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-bold">Why Choose Us</h3>
                <p>Once a week, Squirrel Peace sends thoughtful, helpful content about freelancing <br /> focus, and finding balance in your creative work.</p>
            </div>
            <div className="flex max-w-screen-xl mx-auto pt-5 gap-10">
                {/* why People choose */}
                <div className="flex-1">
                    <NewsletterPoint></NewsletterPoint>
                </div>
                {/* faq */}
                <div className="flex-1">
                    <NewsletterFaqs></NewsletterFaqs>
                </div>
            </div>
            <div className="mt-5 max-w-screen-xl mx-auto">
                <p className="text-xl font-semibold">
                    <span className="text-[#2acb35] font-bold">Note:</span> If you need more information, please visit our {" "}
                    <Link className="hover:text-[#2acb35] underline mr-1" to="/faq">FAQ</Link> page.
                </p>
            </div>
        </div>
    );
};

export default NewsletterWhy;