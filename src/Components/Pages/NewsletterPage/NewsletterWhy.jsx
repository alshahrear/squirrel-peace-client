import { Link } from "react-router-dom";
import NewsletterFaqs from "./NewsletterFaqs";
import NewsletterPoint from "./NewsletterPoint";

const NewsletterWhy = () => {
  return (
    <div className="py-10 bg-[#f7f7f7]">
      {/* Heading Section */}
      <div className="text-center space-y-2 px-4 md:px-0">
        <h3 className="text-3xl font-bold">Why Choose Us</h3>
        <p>
          Once a week, Squirrel Peace sends thoughtful, helpful content about
          freelancing <br className="hidden md:block" />
          focus, and finding balance in your creative work.
        </p>
      </div>

      {/* Content Section */}
      <div className="flex flex-col md:flex-row max-w-screen-xl mx-auto pt-5 gap-10 px-4 md:px-0">
        {/* Why People Choose */}
        <div className="flex-1">
          <NewsletterPoint />
        </div>
        {/* FAQs */}
        <div className="flex-1">
          <NewsletterFaqs />
        </div>
      </div>

      {/* Note Section */}
      <div className="mt-5 max-w-screen-xl mx-auto px-4 md:px-0">
        <p className="text-lg md:text-xl font-semibold">
          <span className="text-[#2acb35] font-bold">Note:</span> If you need
          more information, please visit our {" "}
          <Link className="hover:text-[#2acb35] underline mr-1" to="/faq">
            FAQ
          </Link>
          page.
        </p>
      </div>
    </div>
  );
};

export default NewsletterWhy;
