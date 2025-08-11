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
                <title>Home - Squirrel Peace</title>
                <meta 
                    name="description" 
                    content="At Squirrel Peace, we guide you on the path to happiness and life's true growth. Embrace joy and move towards a beautiful life."
                />
                <link rel="canonical" href="https://squirrelpeace.com/" />
                <meta name="robots" content="index, follow" />
            </Helmet>
            <Banner></Banner>
            <AboutHome></AboutHome>
            <BlogAll></BlogAll>
            <BlogHomeLatests></BlogHomeLatests>
            <StoryHomes></StoryHomes>
            <Newsletter></Newsletter>
            <Testimonials></Testimonials>
        </div>
    );
};

export default Home;
