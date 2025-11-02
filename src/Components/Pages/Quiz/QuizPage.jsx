import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import faq from "../../../assets/smartResource.jpg";
import FaqQuiz from "../../Pages/Quiz/FaqQuiz";
import AboutQuiz from "./AboutQuiz";
import QuizBoard from "./QuizBoard";
import WinCards from "./WinCards";
import useAdmin from "../../../hooks/useAdmin";
import useAuth from "../../Layout/useAuth";
import { NavLink } from "react-router-dom";
import { Helmet } from "react-helmet";
import { FaPlayCircle } from "react-icons/fa";

const QuizPage = () => {
  const quizBoardRef = useRef(null);
  const { user } = useAuth();
  const [isAdmin] = useAdmin();

  // Video Modal State
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Scroll Handler
  const handleStartQuiz = () => {
    if (quizBoardRef.current) {
      quizBoardRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-[#f7f7f7] overflow-x-hidden">
      <Helmet>
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
      </Helmet>

      {/* Banner */}
      <div
        className="w-full h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] relative flex items-center justify-center"
        style={{
          backgroundImage: `url(${faq})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/20"></div>

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

      {/* Quiz Buttons Section */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center mb-5">
        {/* Admin Quiz Test Button (visible only for admin) */}
        {isAdmin && (
          <NavLink
            to="/quizTest"
            className="bg-[#2acb35] hover:bg-[#24a52c] text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition"
          >
            Quiz Test
          </NavLink>
        )}

        {/* Quiz Guide Video Button (visible for everyone) */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setVideoModalOpen(true)}
          className="inline-flex items-center gap-2 bg-[#2acb35] hover:bg-[#24a52c] text-white font-semibold px-5 py-2.5 rounded-lg shadow-md transition"
        >
          <FaPlayCircle className="text-lg" />
          Quiz Guide Video
        </motion.button>
      </div>

      {/* Video Modal (Reels Ratio 9:16) */}
      <AnimatePresence>
        {videoModalOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setVideoModalOpen(false)}
          >
            <motion.div
              className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Reels Ratio (9:16) Responsive Video */}
              <div
                className="
                  w-[85vw]
                  sm:w-[55vw]
                  md:w-[35vw]
                  lg:w-[20vw]
                  xl:w-[22vw]
                  aspect-[9/16]
                "
              >
                <iframe
                  className="w-full h-full rounded-2xl"
                  src="https://www.youtube.com/embed/6FUXMoetddo?autoplay=1&rel=0"
                  title="Quiz Guide Reels"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                  allowFullScreen
                ></iframe>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setVideoModalOpen(false)}
                className="absolute top-3 right-3 bg-white/90 text-black px-3 py-1 rounded-full text-sm font-semibold hover:bg-white transition"
              >
                ✕
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
