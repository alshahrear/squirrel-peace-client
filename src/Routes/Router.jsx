import {
  createBrowserRouter
} from "react-router-dom";
import Main from "../Components/Layout/Main";
import Home from "../Components/Pages/Home/Home";
import Contact from "../Components/Pages/Contact/Contact";
import Faq from "../Components/Pages/Faq/Faq";
import ErrorPage from "../Components/Pages/ErrorPage/ErrorPage";
import TestimonialsAdmin from "../Components/Pages/Home/Testimonials/TestimonialsAdmin";
import TestimonialPage from "../Components/Pages/TestimonialPage/TestimonialPage";
import Login from "../Components/Pages/Login/Login";
import Register from "../Components/Pages/Register/Register";
import FaqAdmin from "../Components/Pages/FaqAdmin/FaqAdmin";
import ContactAdmin from "../Components/Pages/Contact/ContactAdmin";
import Users from "../Components/Pages/Users/Users";
import NewsletterPage from "../Components/Pages/NewsletterPage/NewsletterPage";
import BlogHomeCats from "../Components/Pages/Home/BlogHomeCats/BlogHomeCats";
import AboutPage from "../Components/Pages/About/AboutPage";
import StoryPages from "../Components/Pages/StoryPage/StoryPages";
import StoryBlogAdmin from "../Components/Pages/StoryPage/StoryBlogAdmin";
import StoryBlogs from "../Components/Pages/StoryPage/StoryBlogs";
import LifeStylePages from "../Components/Pages/Blogs/LifeStyle/LifeStylePages";
import BlogPageAdmin from "../Components/Pages/Blogs/BlogPageAdmin";
import HealthPages from "../Components/Pages/Blogs/Health/HealthPages";
import TravelPages from "../Components/Pages/Blogs/Travel/TravelPages";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Main></Main>,
    errorElement: <ErrorPage></ErrorPage>,
    children: [
      {
        path: "/",
        element: <Home></Home>
      },
      {
        path: "/aboutPage",
        element: <AboutPage></AboutPage>
      },
      {
        path: "/lifeStylePages",
        element: <LifeStylePages></LifeStylePages>
      },
      {
        path: "/healthPages",
        element: <HealthPages></HealthPages>
      },
      {
        path: "/travelPages",
        element: <TravelPages></TravelPages>
      },
      {
        path: "/blogHomeCats",
        element: <BlogHomeCats></BlogHomeCats>
      },
      {
        path: "/storyPages",
        element: <StoryPages></StoryPages>
      },
      {
        path: "/storyBlogs",
        element: <StoryBlogs></StoryBlogs>
      },
      {
        path: "/storyBlogAdmin",
        element: <StoryBlogAdmin></StoryBlogAdmin>
      },
      {
        path: "/blogPageAdmin",
        element: <BlogPageAdmin></BlogPageAdmin>
      },
      {
        path: "/newsletterPage",
        element: <NewsletterPage></NewsletterPage>
      },
      {
        path: "/contact",
        element: <Contact></Contact>
      },
      {
        path: "/contactAdmin",
        element: <ContactAdmin></ContactAdmin>
      },
      {
        path: "/faq",
        element: <Faq></Faq>
      },
      {
        path: "/faqAdmin",
        element: <FaqAdmin></FaqAdmin>
      },
      {
        path: "/testimonialPage",
        element: <TestimonialPage></TestimonialPage>
      },
      {
        path: "/testimonialsAdmin",
        element: <TestimonialsAdmin></TestimonialsAdmin>
      },
      {
        path: "/login",
        element: <Login></Login>
      },
      {
        path: "/register",
        element: <Register></Register>
      },
      {
        path: "/users",
        element: <Users></Users>
      }

    ]
  },
]);

