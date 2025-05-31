import { FaHandPointRight } from "react-icons/fa";

const NewsletterPoint = () => {
    return (
        < div className="" >
            <p className="pb-7 text-2xl font-bold text-center">Most played songs this week</p>
            <ul className="list bg-white rounded-box shadow-md hover:border hover:border-[#2acb35]">
                <li className="list-row">
                    <div>
                        <p className="flex items-start text-lg font-medium gap-2 hover:text-[#2acb35] hover:font-semibold">
                            <FaHandPointRight className="text-[#2acb35] text-2xl"></FaHandPointRight> Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi veritatis itaque
                        </p>
                    </div>
                </li>
                <li className="list-row">
                    <div>
                        <p className="flex items-start text-lg font-medium gap-2 hover:text-[#2acb35] hover:font-semibold">
                            <FaHandPointRight className="text-[#2acb35] text-2xl"></FaHandPointRight> Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi veritatis itaque
                        </p>
                    </div>
                </li>
                <li className="list-row">
                    <div>
                        <p className="flex items-start text-lg font-medium gap-2 hover:text-[#2acb35] hover:font-semibold">
                            <FaHandPointRight className="text-[#2acb35] text-2xl"></FaHandPointRight> Lorem ipsum dolor sit amet consectetur adipisicing elit. Modi veritatis itaque
                        </p>
                    </div>
                </li>
            </ul>
        </div >
    );
};

export default NewsletterPoint;