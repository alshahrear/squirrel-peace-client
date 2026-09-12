import {
  createBrowserRouter
} from "react-router-dom";
import Main from "../Components/Layout/Main";
import Home from "../Components/Pages/Home/Home";
import ErrorPage from "../Components/Pages/ErrorPage/ErrorPage";
import Login from "../Components/Pages/Login/Login";
import Register from "../Components/Pages/Register/Register";
import Users from "../Components/Pages/Users/Users";
import AdminPages from "../Components/Pages/Admin/AdminPages";
import AdminRoute from "../Components/Layout/Privet/AdminRoute";
import Pdf from "../Components/Pages/Receipt/Pdf";
import ProductPage from "../Components/Pages/Receipt/ProductPage";
import Units from "../Components/Pages/Receipt/Units";
import PdfProducts from "../Components/Pages/Receipt/PdfProducts";
import Software from "../Components/Pages/Software/Software";
import Client from "../Components/Pages/Software/Client";
import LoginClient from "../Components/Pages/Software/LoginClient";
import Dashboard from "../Components/Pages/Software/Dashboard/Dashboard";
import ClientRoute from "../Components/Layout/Privet/ClientRoute";
import Route from "../Components/Pages/Receipt/Route";
import Category from "../Components/Pages/Receipt/Category";
import Company from "../Components/Pages/Software/Company";
import Customers from "../Components/Pages/Software/Customers";
import ProductAll from "../Components/Pages/Software/ProductAll";
import UserRole from "../Components/Pages/Software/User/UserRole";
import User from "../Components/Pages/Software/User/User";
import OpeningInvestment from "../Components/Pages/Software/Account/OpeningInvestment";
import Income from "../Components/Pages/Software/Account/Income";
import AccountHeads from "../Components/Pages/Software/Account/AccountHeads";
import Expense from "../Components/Pages/Software/Account/Expense";
import RouteExpense from "../Components/Pages/Software/Account/RouteExpense";
import Transfer from "../Components/Pages/Software/Account/Transfer";
import AccountBalance from "../Components/Pages/Software/Account/AccountBalance";
import PurchaseAdd from "../Components/Pages/Software/Purchase/PurchaseAdd";
import Purchase from "../Components/Pages/Software/Purchase/Purchase";
import PurchaseDetails from "../Components/Pages/Software/Purchase/PurchaseDetails";
import PurchaseReturn from "../Components/Pages/Software/Purchase/PurchaseReturn";
import PurchaseReturnDetails from "../Components/Pages/Software/Purchase/PurchaseReturnDetails";
import PurchaseReturnView from "../Components/Pages/Software/Purchase/PurchaseReturnView";


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
        path: "/purchase",
        element: <ClientRoute><Purchase></Purchase></ClientRoute>
      },
      {
        path: "/add-purchase",
        element: <ClientRoute><PurchaseAdd></PurchaseAdd></ClientRoute>
      },
      {
        path: "/purchase-details/:id",
        element: <ClientRoute><PurchaseDetails></PurchaseDetails></ClientRoute>
      },
      {
        path: "/purchase-return",
        element: <ClientRoute><PurchaseReturn></PurchaseReturn></ClientRoute>
      },
      {
        path: "/purchase-return-details/:id",
        element: <ClientRoute><PurchaseReturnDetails></PurchaseReturnDetails></ClientRoute>
      },
      {
        path: "/purchase-return-view/:id",
        element: <ClientRoute><PurchaseReturnView></PurchaseReturnView></ClientRoute>
      },
      {
        path: "/products",
        element: <ClientRoute><ProductPage></ProductPage></ClientRoute>
      },
      {
        path: "/units",
        element: <ClientRoute><Units></Units></ClientRoute>
      },
      {
        path: "/category",
        element: <ClientRoute><Category></Category> </ClientRoute>
      },
      {
        path: "/company",
        element: <ClientRoute><Company></Company></ClientRoute>
      },
      {
        path: "/customers",
        element: <ClientRoute><Customers></Customers></ClientRoute>
      },
      {
        path: "/productAll",
        element: <ClientRoute><ProductAll></ProductAll></ClientRoute>
      },
      {
        path: "/pdfProducts",
        element: <PdfProducts></PdfProducts>
      },
      {
        path: "/software",
        element: <AdminRoute><Software></Software></AdminRoute>
      },
      {
        path: "/user-role",
        element: <ClientRoute><UserRole></UserRole></ClientRoute>
      },
      {
        path: "/user",
        element: <ClientRoute><User></User></ClientRoute>
      },
      {
        path: "/client",
        element: <Client></Client>
      },
      {
        path: "/login-client",
        element: <LoginClient></LoginClient>
      },
      {
        path: "/dashboard",
        element: <ClientRoute><Dashboard></Dashboard></ClientRoute>
      },
      {
        path: "/opening-investment",
        element: <ClientRoute><OpeningInvestment></OpeningInvestment></ClientRoute>
      },

      {
        path: "/income",
        element: <ClientRoute><Income></Income></ClientRoute>
      },
      {
        path: "/expense",
        element: <ClientRoute><Expense></Expense></ClientRoute>
      },
      {
        path: "/route-expense",
        element: <ClientRoute><RouteExpense></RouteExpense></ClientRoute>
      },
      {
        path: "/transfer",
        element: <ClientRoute><Transfer></Transfer></ClientRoute>
      },
      {
        path: "/account-heads",
        element: <ClientRoute><AccountHeads></AccountHeads></ClientRoute>
      },
      {
        path: "/account-balance",
        element: <ClientRoute><AccountBalance></AccountBalance></ClientRoute>
      },
      {
        path: "/routes",
        element: <ClientRoute><Route></Route></ClientRoute>
      }
    ]
  },
  // Pdf রুটটিকে Main এর বাইরে আলাদাভাবে রাখা হয়েছে
  {
    path: "/pdf",
    element: <Pdf></Pdf>
  },

]);