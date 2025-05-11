import {
    createBrowserRouter
  } from "react-router-dom";
import Main from "../Components/Layout/Main";
import Home from "../Components/Pages/Home/Home";
import Contact from "../Components/Pages/Contact/Contact";
import Faq from "../Components/Pages/Faq/Faq";

 export const router = createBrowserRouter([
    {
      path: "/",
      element: <Main></Main>,
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
        }
      ]
    },
  ]);

  