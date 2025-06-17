import { Helmet } from "react-helmet";
import StoryHomes from "../StoryPage/StoryHomes";
import AboutHome from "./AboutHome/AboutHome";
import Banner from "./Banner/Banner";
import BlogHomeLatests from "./BlogHomeLatests/BlogHomeLatests";
import Newsletter from "./NewsletterHome/NewsletterHome";
import Testimonials from "./Testimonials/Testimonials";
import BlogAll from "../../Layout/BlogSuggest.jsx/BlogAll";

const Home = () => {
    return (
        <div>
            <Helmet>
                <title>Home - Storial Peace </title>
            </Helmet>
            <Banner></Banner>
            <AboutHome></AboutHome>
            <BlogAll></BlogAll>
            <StoryHomes></StoryHomes>
            <BlogHomeLatests></BlogHomeLatests>
            <Newsletter></Newsletter>
            <Testimonials></Testimonials>
        </div>
    );
};

export default Home;