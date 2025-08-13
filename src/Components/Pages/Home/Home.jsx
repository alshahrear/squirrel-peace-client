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
                {/* Basic Meta Tags */}
                <title>Home - Squirrel Peace| Positive Stories, Life Lessons & Inspiration</title>
                <meta 
                    name="description" 
                    content="Discover inspiring stories, life lessons, and positivity with Squirrel Peace. Your daily dose of motivation, happiness, and hope for a better tomorrow."
                />
                <meta 
                    name="keywords" 
                    content="positive stories, life lessons, inspiration, motivation, squirrel peace"
                />
                <link rel="canonical" href="https://squirrelpeace.com/" />
                <meta name="robots" content="index, follow" />

                {/* Open Graph / Facebook */}
                <meta property="og:title" content="Squirrel Peace - Positive Stories, Life Lessons & Inspiration" />
                <meta property="og:description" content="Discover inspiring stories, life lessons, and positivity with Squirrel Peace. Your daily dose of motivation, happiness, and hope for a better tomorrow." />
                <meta property="og:image" content="https://squirrelpeace.com/images/home-cover.jpg" />
                <meta property="og:url" content="https://squirrelpeace.com/" />
                <meta property="og:type" content="website" />

                {/* Twitter Card */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="Squirrel Peace - Positive Stories, Life Lessons & Inspiration" />
                <meta name="twitter:description" content="Discover inspiring stories, life lessons, and positivity with Squirrel Peace. Your daily dose of motivation, happiness, and hope for a better tomorrow." />
                <meta name="twitter:image" content="https://squirrelpeace.com/images/home-cover.jpg" />
            </Helmet>

            <Banner />
            <AboutHome />
            <BlogAll />
            <BlogHomeLatests />
            <StoryHomes />
            <Newsletter />
            <Testimonials />
        </div>
    );
};

export default Home;
