// AboutQuiz.jsx
import { useState } from "react";
import letterBook from "../../../assets/home4.jpg";
import TermsQuiz from "./TermsQuiz";

const AboutQuiz = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleSeeTerms = () => setIsDrawerOpen(true);
  const handleCloseDrawer = () => setIsDrawerOpen(false);

  return (
    <div className="w-full">
      {/* Title */}
      <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 text-center">
        Explore Our Quiz & Boost Your Knowledge
      </h2>

      {/* Content Box */}
      <div className="border border-gray-300 rounded-lg p-4 sm:p-6 md:p-8 flex flex-col md:flex-row justify-between items-center bg-white mt-5 gap-6">
        {/* Text Content */}
        <div className="w-full md:w-1/2 space-y-3 sm:space-y-4 text-gray-700">
          <p>
            Our quiz is designed to make learning engaging and rewarding. Every Thursday, we publish well-researched content in our newsletter on topics related to happy living and good health. The quiz questions are created directly from that content, so readers of our newsletter can easily find the answers.
          </p>
          <p>
            By subscribing to our newsletter, you not only gain valuable knowledge that can improve your life, but you also get the chance to test your understanding through fun quizzes. Winners are announced through our Facebook page, and exciting gifts await those who perform best. This is our way of helping you grow, stay aware, and enjoy a meaningful learning experience.
          </p>

          {/* Heading + Button in bordered shadow container */}
          <div className="mt-4 w-full flex items-center justify-between gap-3 border border-gray-200 shadow-md p-4 rounded-lg bg-white">
            <h3 className="text-lg font-semibold text-gray-800">
              You Should Know Before Joining Quiz
            </h3>
            <button
              onClick={handleSeeTerms}
              className="px-4 py-2 bg-[#2acb35] text-white rounded hover:bg-green-700 text-sm"
            >
              See Terms
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="w-full md:w-2/5 flex justify-center">
          <img
            src={letterBook}
            alt="Letter Book Cover"
            className="rounded-lg w-full sm:w-4/5 md:w-full h-72 lg:h-96 object-cover"
          />
        </div>
      </div>

      {/* Terms Drawer */}
      <TermsQuiz isDrawerOpen={isDrawerOpen} closeDrawer={handleCloseDrawer} />
    </div>
  );
};

export default AboutQuiz;
