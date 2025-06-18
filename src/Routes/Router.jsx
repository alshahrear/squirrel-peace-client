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
import AboutPage from "../Components/Pages/About/AboutPage";
import StoryPages from "../Components/Pages/StoryPage/StoryPages";
import StoryBlogAdmin from "../Components/Pages/StoryPage/StoryBlogAdmin";
import StoryBlogs from "../Components/Pages/StoryPage/StoryBlogs";
import LifeStylePages from "../Components/Pages/Blogs/LifeStyle/LifeStylePages";
import BlogPageAdmin from "../Components/Pages/Blogs/BlogPageAdmin";
import HealthPages from "../Components/Pages/Blogs/Health/HealthPages";
import TravelPages from "../Components/Pages/Blogs/Travel/TravelPages";
import AdminPages from "../Components/Pages/Admin/AdminPages";
import AdminRoute from "../Components/Layout/Privet/AdminRoute";
import StoryDetails from "../Components/Pages/StoryPage/StoryDetails";
import CommentsAdmin from "../Components/Pages/StoryPage/CommentsAdmin";
import PrivacyPolicy from "../Components/Pages/PrivacyPolicy";
import TermCondition from "../Components/Pages/TermCondition";
import BlogDetails from "../Components/Pages/Blogs/BlogDetails";
import DraftBlogAdmin from "../Components/Pages/DraftBlogAdmin/DraftBlogAdmin";
import DraftDetails from "../Components/Pages/DraftBlogAdmin/DraftDetails";
import ForgotPassword from "../Components/Layout/ForgotPassword";
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
        path: "/adminPages",
        element: <AdminRoute><AdminPages></AdminPages></AdminRoute>
      },
      {
        path: "/about",
        element: <AboutPage></AboutPage>
      },
      {
        path: "/lifeStyle",
        element: <LifeStylePages></LifeStylePages>
      },
      {
        path: "/health",
        element: <HealthPages></HealthPages>
      },
      {
        path: "/travel",
        element: <TravelPages></TravelPages>
      },
      {
        path: "/blog/:id",
        element: <BlogDetails></BlogDetails>
      },
      {
        path: "/draft/:id",
        element: <AdminRoute><DraftDetails></DraftDetails></AdminRoute>
      },
      {
        path: "/story",
        element: <StoryPages></StoryPages>
      },
      {
        path: "/storyBlogs",
        element: <StoryBlogs></StoryBlogs>
      },
      {
        path: "/story/:id",
        element: <StoryDetails></StoryDetails>
      },
      {
        path: "/storyBlogAdmin",
        element: <AdminRoute><StoryBlogAdmin></StoryBlogAdmin></AdminRoute>
      },
      {
        path: "/blogPageAdmin",
        element: <AdminRoute><BlogPageAdmin></BlogPageAdmin></AdminRoute>
      },
      {
        path: "/draftBlogAdmin",
        element: <AdminRoute><DraftBlogAdmin></DraftBlogAdmin></AdminRoute>
      },
      {
        path: "/commentAdmin",
        element: <AdminRoute><CommentsAdmin></CommentsAdmin></AdminRoute>
      },
      {
        path: "/newsletter",
        element: <NewsletterPage></NewsletterPage>
      },
      {
        path: "/contact",
        element: <Contact></Contact>
      },
      {
        path: "/contactAdmin",
        element: <AdminRoute><ContactAdmin></ContactAdmin></AdminRoute>
      },
      {
        path: "/faq",
        element: <Faq></Faq>
      },
      {
        path: "/faqAdmin",
        element: <AdminRoute><FaqAdmin></FaqAdmin></AdminRoute>
      },
      {
        path: "/success",
        element: <TestimonialPage></TestimonialPage>
      },
      {
        path: "/testimonialsAdmin",
        element: <AdminRoute><TestimonialsAdmin></TestimonialsAdmin></AdminRoute>
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
        element: <AdminRoute><Users></Users></AdminRoute>
      },
      {
        path: "/privacyPolicy",
        element: <PrivacyPolicy></PrivacyPolicy>
      },
      {
        path: "/termCondition",
        element: <TermCondition></TermCondition>
      },
      {
        path: "/forgotPassword",
        element: <ForgotPassword></ForgotPassword>
      },
    ]
  },
]);

