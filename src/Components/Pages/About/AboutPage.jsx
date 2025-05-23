import { NavLink } from "react-router-dom";
import about0 from "../../../assets/blogcat2.jpg";


const AboutPage = () => {
    return (
        <div className="my-10 max-w-screen-xl mx-auto">
            <div className="text-center space-y-2 mb-5">
                <h1 className="text-3xl font-bold">Words About Us</h1>
                <p> We are ECO Green, Our Mission is save water, animals, power energy, natutre <br /> and our environment our activities are taken around the world.</p>
            </div>
            <div className="flex">
                <div className="flex-1">
                    <img className="w-9/10 rounded" src={about0} alt="" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-[#2acb35]">We Have The Best Caretaker to Providing Best <br /> Services <span>Purchase - Healthcoach.</span></h3>
                    <p className="mt-3">Explain to you how all this mistaken idea of denouncing ut pleasure work praising pain was born and will give you can complete design account sed the system, and expound the actual teachngs interior of the great design explorer of the truth master-builders design of human happiness one seds rejects, dislikes, or avoids pleasures give of the master-builder of human itself.
                    </p>
                    <br />
                    <h4 className="text-xl font-bold mb-3 text-[#2acb35]">Our Partner</h4>
                    <p >We partner with over 320 amazing projects worldwide, and have given over $150 million in cash and product grants to other groups since 2011. We also operate our own dynamic suite of Signature Programs.</p>

                    <NavLink to="/contact">
                        <button className="btn mt-5 px-8 py-4 rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]">
                            Contact Us
                        </button>
                    </NavLink>
                </div>
            </div>
        </div>
    );
};

export default AboutPage;