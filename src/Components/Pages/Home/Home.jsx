import StoryHomes from "../StoryPage/StoryHomes";
import AboutHome from "./AboutHome/AboutHome";
import Banner from "./Banner/Banner";
import BlogHomeCats from "./BlogHomeCats/BlogHomeCats";
import BlogHomeLatests from "./BlogHomeLatests/BlogHomeLatests";
import LetterHome from "./LetterHome/LetterHome";
import Newsletter from "./NewsletterHome/NewsletterHome";
import Testimonials from "./Testimonials/Testimonials";

const Home = () => {
    return (
        <div>
            <Banner></Banner>
            <AboutHome></AboutHome>
            <BlogHomeCats></BlogHomeCats>
            <StoryHomes></StoryHomes>
            <LetterHome></LetterHome>
            <BlogHomeLatests></BlogHomeLatests>
            <Newsletter></Newsletter>
            <Testimonials></Testimonials>
        </div>
    );
};

export default Home;