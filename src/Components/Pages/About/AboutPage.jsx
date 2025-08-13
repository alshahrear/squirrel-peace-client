import { NavLink } from "react-router-dom";
import about0 from "../../../assets/about.jpg";
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
                {/* Basic Meta Tags */}
                <title>About Us - Squirrel Peace | Our Story, Mission & Vision</title>
                <meta
                    name="description"
                    content="Learn about Squirrel Peace - our story, mission, vision, and how we inspire joy, positivity, and community connection every day."
                />
                <meta
                    name="keywords"
                    content="about squirrel peace, our story, mission, vision, positivity, community"
                />
                <link rel="canonical" href="https://squirrelpeace.com/about" />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:title" content="About Us - Squirrel Peace | Our Story, Mission & Vision" />
                <meta property="og:description" content="Learn about Squirrel Peace - our story, mission, vision, and how we inspire joy, positivity, and community connection every day." />
                <meta property="og:image" content="https://squirrelpeace.com/images/about-cover.jpg" />
                <meta property="og:url" content="https://squirrelpeace.com/about" />
                <meta property="og:type" content="website" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="About Us - Squirrel Peace | Our Story, Mission & Vision" />
                <meta name="twitter:description" content="Learn about Squirrel Peace - our story, mission, vision, and how we inspire joy, positivity, and community connection every day." />
                <meta name="twitter:image" content="https://squirrelpeace.com/images/about-cover.jpg" />
            </Helmet>

            <div>
                <ImageBanner></ImageBanner>
            </div>
            <div className="max-w-screen-xl mx-auto mt-8 px-4">
                <div className="text-center space-y-2 mb-10">
                    <h1 className="text-2xl lg:text-3xl font-semibold">Get to Know Us</h1>
                    <p className="max-w-4xl mx-auto">Join us as we build a community based on trust, passion, and shared dreams. This journey is with you, for you, so that you can thrive and find true happiness along the way.</p>
                </div>
                {/* Use grid for responsive layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ">
                    <div className="">
                        <img className="w-full rounded-lg" src={about0} alt="" />
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-xl font-semibold">
                            The Story of Our Journey
                        </h3>
                        <p className="">
                            For years, we've been on a mission to help you rediscover joy in everyday life. We understand how small problems can cast a shadow over your routine, so our team works tirelessly to share practical solutions, heartfelt encouragement, and trusted resources. By staying connected with us, you'll find the support you need to overcome challenges and embrace each day with confidence. Every article, tool, and service we create is crafted with your happiness in mind—so you can live a richer, more fulfilling life. Welcome to a community that cares about your well-being.
                        </p>
                        <h4 className="text-xl font-semibold ">Our Mission, Vision & Impact</h4>
                        <p className="">
                            Our mission is to brighten everyday lives by offering support, inspiration, and practical solutions that truly make a difference. We envision a world where everyone feels empowered to overcome challenges and find happiness in the little things. By staying connected with us, people experience positive changes — more joy, better mindset, and a stronger sense of community. Together, we're building not just a platform, but a caring family that helps each member grow and thrive.
                        </p>
                        <NavLink to="/contact">
                            <button className="btn px-8 py-4 rounded-full text-white bg-[#2acb35] hover:bg-white hover:text-[#2acb35] border-2 border-[#2acb35]">
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
