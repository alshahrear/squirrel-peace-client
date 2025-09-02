import { Helmet } from "react-helmet";
import privacy from "../../assets/privacyPolicy.jpg"; 

const PrivacyPolicy = () => {
  return (
    <div className="bg-[#f7f7f7]">
      <Helmet>
        <title>Privacy Policy - Squirrel Peace</title>
      </Helmet>

      {/* ✅ Banner Section */}
      <div
        className="h-[350px] sm:h-[320px] md:h-[380px] lg:h-[480px] w-full bg-cover bg-center relative flex items-center justify-center"
        style={{ backgroundImage: `url(${privacy})` }}
      >
        <div className="absolute inset-0 bg-black/30"></div>
        <h1 className="relative z-10 text-3xl md:text-4xl lg:text-5xl font-bold text-white text-center">
          Privacy Policy
        </h1>
      </div>
      <div className="py-16">
        <h2 className="text-2xl text-center font-semibold px-2">Our Privacy Policy will be available soon.....</h2>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
