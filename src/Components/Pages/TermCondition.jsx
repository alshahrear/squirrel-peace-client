import { Helmet } from "react-helmet";
import termsCondition from "../../assets/termsCondition.jpg";

const TermCondition = () => {
  return (
    <div className="bg-[#f7f7f7]">
      <Helmet>
        <title>Terms of Condition - Squirrel Peace</title>
      </Helmet>

      {/* ✅ Banner Section */}
      <div
        className="h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: `url(${termsCondition})` }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <h1 className="relative z-10 text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">
          Terms and Conditions
        </h1>
      </div>
      <div className="py-16">
        <h2 className="text-2xl text-center font-semibold px-2">Our terms and condition will be available soon...</h2>
      </div>
    </div>
  );
};

export default TermCondition;
