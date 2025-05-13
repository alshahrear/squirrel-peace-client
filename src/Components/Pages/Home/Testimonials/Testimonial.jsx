import { Rating, Star } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';

const customStyle = {
  itemShapes: Star,
  activeFillColor: '#FFD700',
  inactiveFillColor: '#e0e0e0',
};

const Testimonial = ({ testimonial }) => {
  const { customerName, rating, review, profileLink } = testimonial;

  return (
    <div className="flex p-3 h-64 ">
      <div className="card bg-base-100 bg-opacity-80 shadow-xl h-full flex flex-col min-h-[200px] group transform transition-transform duration-300 hover:scale-105 hover:shadow-2xl">
        <div className="card-body flex-grow">
          <div className="flex items-center">
            <img
              src={profileLink}
              alt={customerName}
              className="w-20 h-20 rounded-full object-cover border-4 border-white group-hover:border-[#2acb35] transition-all duration-300"
            />
            <div className="ml-3">
              <h2 className="text-xl text-[#2acb35] font-semibold">{customerName}</h2>
              <Rating
                style={{ maxWidth: 100 }}
                value={rating}
                readOnly
                itemStyles={customStyle}
              />
            </div>
          </div>
          <div className="pt-3 flex-grow">
            <p className="text-[16px] font-medium text-gray-700">{review}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Testimonial;
