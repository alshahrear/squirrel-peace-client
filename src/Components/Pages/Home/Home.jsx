import { Helmet } from "react-helmet";
import StoryHomes from "../StoryPage/StoryHomes";
import AboutHome from "./AboutHome/AboutHome";
import Banner from "./Banner/Banner";
import BlogHomeCats from "./BlogHomeCats/BlogHomeCats";
import BlogHomeLatests from "./BlogHomeLatests/BlogHomeLatests";
import Newsletter from "./NewsletterHome/NewsletterHome";
import Testimonials from "./Testimonials/Testimonials";

const Home = () => {
    return (
        <div>
            <Helmet>
                <title>Storial Peace | Home</title>
            </Helmet>
            <Banner></Banner>
            <AboutHome></AboutHome>
            <BlogHomeCats></BlogHomeCats>
            <StoryHomes></StoryHomes>
            <BlogHomeLatests></BlogHomeLatests>
            <Newsletter></Newsletter>
            <Testimonials></Testimonials>
        </div>
    );
};

export default Home;