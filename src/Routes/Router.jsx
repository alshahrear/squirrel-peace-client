import {
  createBrowserRouter
} from "react-router-dom";
import Main from "../Components/Layout/Main";
import Home from "../Components/Pages/Home/Home";
import Contact from "../Components/Pages/Contact/Contact";
import Faq from "../Components/Pages/Faq/Faq";
import ErrorPage from "../Components/Pages/ErrorPage/ErrorPage";
import TestimonialsAdmin from "../Components/Pages/Home/Testimonials/TestimonialsAdmin";
import Testimonials from "../Components/Pages/Home/Testimonials/Testimonials";
import TestimonialPage from "../Components/Pages/TestimonialPage/TestimonialPage";

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
        path: "/contact",
        element: <Contact></Contact>
      },
      {
        path: "/faq",
        element: <Faq></Faq>
      },
      {
        path: "/testimonialPage",
        element: <TestimonialPage></TestimonialPage>
      },
      {
        path: "/testimonialsAdmin",
        element: <TestimonialsAdmin></TestimonialsAdmin>
      }
    ]
  },
]);

