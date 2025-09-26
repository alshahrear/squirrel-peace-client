// QuizPage.jsx
import { useRef } from "react";
import { motion } from "framer-motion";
import faq from "../../../assets/smartResource.jpg";
import FaqQuiz from "../../Pages/Quiz/FaqQuiz";
import AboutQuiz from "./AboutQuiz";
import QuizBoard from "./QuizBoard";
import WinCards from "./WinCards";
import useAdmin from "../../../hooks/useAdmin";
import useAuth from "../../Layout/useAuth";
import { NavLink } from "react-router-dom";
import { Helmet } from "react-helmet";

const QuizPage = () => {
  const quizBoardRef = useRef(null);
  const { user } = useAuth();
  const [isAdmin] = useAdmin();

  // Scroll Handler
  const handleStartQuiz = () => {
    if (quizBoardRef.current) {
      quizBoardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#f7f7f7] overflow-x-hidden">
      <Helmet>
        {/* Basic Meta Tags */}
        <title>Quiz - Squirrel Peace | Test Your Knowledge & Have Fun</title>
        <meta
          name="description"
          content="Take fun and engaging quizzes at Squirrel Peace. Challenge your knowledge, enjoy learning, and discover new ideas with every quiz."
        />
        <meta
          name="keywords"
          content="quiz, online quiz, test knowledge, fun quiz, squirrel peace quiz, challenge mind, learning"
        />
        <link rel="canonical" href="https://squirrelpeace.com/quiz" />
        <meta name="robots" content="index, follow" />

        {/* Open Graph / Facebook */}
        <meta
          property="og:title"
          content="Quiz - Squirrel Peace | Test Your Knowledge & Have Fun"
        />
        <meta
          property="og:description"
          content="Take fun and engaging quizzes at Squirrel Peace. Challenge your knowledge, enjoy learning, and discover new ideas with every quiz."
        />
        <meta
          property="og:image"
          content="https://squirrelpeace.com/images/quiz-cover.jpg"
        />
        <meta property="og:url" content="https://squirrelpeace.com/quiz" />
        <meta property="og:type" content="website" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Quiz - Squirrel Peace | Test Your Knowledge & Have Fun"
        />
        <meta
          name="twitter:description"
          content="Take fun and engaging quizzes at Squirrel Peace. Challenge your knowledge, enjoy learning, and discover new ideas with every quiz."
        />
        <meta
          name="twitter:image"
          content="https://squirrelpeace.com/images/quiz-cover.jpg"
        />
      </Helmet>

      {/* Banner */}
      <div
        className="w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] relative flex items-center justify-center"
        style={{ backgroundImage: `url(${faq})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Banner Content */}
        <div className="relative z-10 text-center text-white px-3 sm:px-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
            Quiz
          </h1>
          <p className="max-w-xl md:max-w-2xl mx-auto text-lg mb-4 sm:mb-6 leading-relaxed">
            Test your knowledge, challenge your mind, and enjoy exciting quizzes made just for you.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleStartQuiz}
            className="bg-[#2acb35] hover:bg-[#24a52c] text-white font-semibold px-5 sm:px-6 py-2.5 sm:py-3 rounded-lg shadow-md transition text-base"
          >
            Start Quiz
          </motion.button>
        </div>
      </div>

      {/* About Quiz */}
      <div className="py-10 max-w-screen-xl mx-auto px-3 sm:px-4">
        <AboutQuiz />
      </div>

      {/* Admin Quiz Test Button */}
      {isAdmin && (
        <div className="text-center">
          <NavLink
            to="/quizTest"
            className="inline-block bg-[#2acb35] hover:bg-[#24a52c] text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition"
          >
            Quiz Test
          </NavLink>
        </div>
      )}

      {/* Quiz Board */}
      <div
        ref={quizBoardRef}
        className="pb-10 pt-5 max-w-screen-xl mx-auto px-3 sm:px-4"
      >
        <QuizBoard />
      </div>

      {/* Winners Section */}
      <div className="pt-5 max-w-screen-xl mx-auto px-3 sm:px-4">
        <WinCards />
      </div>

      {/* FAQs Section */}
      <div className="max-w-screen-xl mx-auto px-3 sm:px-4">
        <FaqQuiz />
      </div>
    </div>
  );
};

export default QuizPage;
