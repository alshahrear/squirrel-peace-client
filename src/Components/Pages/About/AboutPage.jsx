import { NavLink } from "react-router-dom";
import about0 from "../../../assets/blogcat2.jpg";
import ImageBanner from "../../Layout/ImageBanner/ImageBanner";
import AboutChoose from "../../Layout/AboutSection/AboutChoose";
import NewsletterOption from "../../Layout/NewsletterOption/NewsletterOption";
import NewsScore from "../../Layout/NewsScore";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";
import { Helmet } from "react-helmet";

const AboutPage = () => {
    return (
        <div className="">
            <Helmet>
                <title>About - Storial Peace </title>
            </Helmet>
            <div>
                <ImageBanner></ImageBanner>
            </div>
            <div className="max-w-screen-xl mx-auto mt-10 px-4">
                <div className="text-center space-y-2 mb-10">
                    <h1 className="text-3xl font-bold">Words About Us</h1>
                    <p className="text-lg"> We are ECO Green, Our Mission is save water, animals, power energy, natutre <br className="hidden md:block" /> and our environment our activities are taken around the world.</p>
                </div>
                {/* Use grid for responsive layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="">
                        <img className="w-full rounded-lg" src={about0} alt="" />
                    </div>
                    <div className="">
                        <h3 className="text-xl font-semibold">
                            We Have The Best Caretaker to Providing Best <br className="hidden md:block" /> Services <span>Purchase - Healthcoach.</span>
                        </h3>
                        <p className="mt-3 md:text-lg ">
                            Explain to you how all this mistaken idea of denouncing ut pleasure work praising pain was born and will give you can complete design account sed the system, and expound the actual teachngs interior of the great design explorer of the truth master-builders design of human happiness one seds rejects, dislikes, or avoids pleasures give of the master-builder of human itself.
                        </p>
                        <br />
                        <h4 className="text-xl font-semibold mb-3">Our Partner</h4>
                        <p className=" md:text-lg">
                            We partner with over 320 amazing projects worldwide, and have given over $150 million in cash and product grants to other groups since 2011. We also operate our own dynamic suite of Signature Programs.
                        </p>

                        <NavLink to="/contact">
                            <button className="btn mt-5 px-8 py-4 rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]">
                                Contact Us
                            </button>
                        </NavLink>
                    </div>
                </div>
                
            </div>
            <AboutChoose></AboutChoose>
            <NewsScore></NewsScore>
            <BlogAll></BlogAll>
            <NewsletterOption></NewsletterOption>
        </div>
    );
};

export default AboutPage;
