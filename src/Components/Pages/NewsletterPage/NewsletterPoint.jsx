import { FaHandPointRight } from "react-icons/fa";

const NewsletterPoint = () => {
  return (
    <div className="px-4 md:px-0">
      <p className="pb-7 text-xl md:text-2xl font-bold text-center">
        Most played songs this week
      </p>
      <ul className="list bg-white rounded-box shadow-md hover:border hover:border-[#2acb35] space-y-4 p-4 md:p-6">
        <li className="list-row">
          <div>
            <p className="flex items-start text-base md:text-lg font-medium gap-2 hover:text-[#2acb35] hover:font-semibold">
              <FaHandPointRight className="text-[#2acb35] text-3xl" />
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi
              veritatis itaque
            </p>
          </div>
        </li>
        <li className="list-row">
          <div>
            <p className="flex items-start text-base md:text-lg font-medium gap-2 hover:text-[#2acb35] hover:font-semibold">
              <FaHandPointRight className="text-[#2acb35] text-3xl" />
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi
              veritatis itaque
            </p>
          </div>
        </li>
        <li className="list-row">
          <div>
            <p className="flex items-start text-base md:text-lg font-medium gap-2 hover:text-[#2acb35] hover:font-semibold">
              <FaHandPointRight className="text-[#2acb35] text-3xl" />
              Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi
              veritatis itaque
            </p>
          </div>
        </li>
      </ul>
    </div>
  );
};

export default NewsletterPoint;
