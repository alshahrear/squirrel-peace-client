import { Rating, Star } from "@smastrom/react-rating";
import "@smastrom/react-rating/style.css";
import { BiSolidQuoteAltRight } from "react-icons/bi";

const customStyle = {
  itemShapes: Star,
  activeFillColor: "#FFD700",
  inactiveFillColor: "#e0e0e0",
};

const Testimonial = ({ testimonial }) => {
  const { customerName, rating, review, profileLink } = testimonial;

  return (
    <div className="flex p-2 sm:p-3 h-auto sm:h-64">
      <div className="card bg-base-100 bg-opacity-80 shadow-xl h-full flex flex-col min-h-[220px] group transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
        <div className="relative card-body flex-grow">
          <span className="absolute -mt-9 md:-mt-10 left-5 ">
            <BiSolidQuoteAltRight className="text-2xl sm:text-3xl text-[#2acb35] rounded-full" />
          </span>

          {/* Responsive Layout: Mobile stacked, Desktop horizontal */}
          <div className="flex flex-col items-center sm:flex-row sm:items-center sm:space-x-4">
            <img
              src={profileLink}
              alt={customerName}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-4 border-white group-hover:border-[#2acb35] transition-all duration-300"
            />
            <div className="mt-3 sm:mt-0 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl text-[#2acb35] font-semibold">
                {customerName}
              </h2>
              <div className="flex justify-center sm:justify-start mt-1">
                <Rating
                  style={{ maxWidth: 110 }}
                  value={rating}
                  readOnly
                  itemStyles={customStyle}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 text-center sm:text-left flex-grow">
            <p className="text-sm sm:text-[16px] font-medium text-gray-700 leading-relaxed">
              "{review}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
