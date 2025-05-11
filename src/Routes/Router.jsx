import {
    createBrowserRouter
  } from "react-router-dom";
import Main from "../Components/Layout/Main";
import Home from "../Components/Pages/Home/Home";
import Contact from "../Components/Pages/Contact/Contact";

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
        }
      ]
    },
  ]);

  