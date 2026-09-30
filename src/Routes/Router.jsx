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
import Software from "../Components/Pages/Software/Software";
import Client from "../Components/Pages/Software/Client/Client";
import LoginClient from "../Components/Pages/Software/Client/LoginClient";
import Dashboard from "../Components/Pages/Software/Dashboard/Dashboard";
import ClientRoute from "../Components/Layout/Privet/ClientRoute";
import Route from "../Components/Pages/Software/Contact/Route";
import Company from "../Components/Pages/Software/Contact/Company";
import Customers from "../Components/Pages/Software/Contact/Customers";
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
import ProductAll from "../Components/Pages/Software/Product/ProductAll";
import Category from "../Components/Pages/Software/Product/Category";
import Units from "../Components/Pages/Software/Product/Units";
import StockList from "../Components/Pages/Software/Inventory/StockList";
import StockAlert from "../Components/Pages/Software/Inventory/StockAlert";
import PurchaseBulkReturn from "../Components/Pages/Software/Purchase/PurchaseBulkReturn";
import OrderAdd from "../Components/Pages/Software/Order/OrderAdd";
import Wholesale from "../Components/Pages/Software/Sales/Wholesale";
import Feature from "../Components/Pages/Software/Settings/Feature";
import SalesDetails from "../Components/Pages/Software/Sales/SalesDetails";
import SalesReturn from "../Components/Pages/Software/Sales/SalesReturn";
import SalesReturnDetails from "../Components/Pages/Software/Sales/SalesReturnDetails";
import SalesReturnView from "../Components/Pages/Software/Sales/SalesReturnView";
import CompanyDetails from "../Components/Pages/Software/Contact/CompanyDetails";
import CustomersDetails from "../Components/Pages/Software/Contact/CustomersDetails";
import ProductDetails from "../Components/Pages/Software/Product/ProductDetails";
import FreeProducts from "../Components/Pages/Software/Inventory/FreeProducts";
import StockPurchase from "../Components/Pages/Software/Inventory/StockPurchase";


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
        path: "/purchase-bulk-return",
        element: <ClientRoute><PurchaseBulkReturn></PurchaseBulkReturn></ClientRoute>
      },
      {
        path: "/create-order",
        element: <ClientRoute><OrderAdd></OrderAdd></ClientRoute>
      },
      {
        path: "/wholesale",
        element: <ClientRoute><Wholesale></Wholesale></ClientRoute>
      },
      {
        path: "/sales-details/:id",
        element: <ClientRoute><SalesDetails></SalesDetails></ClientRoute>
      },
      {
        path: "/sales-return",
        element: <ClientRoute><SalesReturn></SalesReturn></ClientRoute>
      },
      {
        path: "/sales-return-details/:id",
        element: <ClientRoute><SalesReturnDetails></SalesReturnDetails></ClientRoute>
      },
      {
        path: "/sales-return-view/:id",
        element: <ClientRoute><SalesReturnView></SalesReturnView></ClientRoute>
      },
      {
        path: "/units",
        element: <ClientRoute><Units></Units></ClientRoute>
      },
      {
        path: "/category",
        element: <ClientRoute><Category></Category></ClientRoute>
      },
      {
        path: "/company",
        element: <ClientRoute><Company></Company></ClientRoute>
      },
      {
        path: "/company-details/:id",
        element: <ClientRoute><CompanyDetails></CompanyDetails></ClientRoute>
      },
      {
        path: "/customers",
        element: <ClientRoute><Customers></Customers></ClientRoute>
      },
      {
        path: "/customer-details/:id",
        element: <ClientRoute><CustomersDetails></CustomersDetails></ClientRoute>
      },
       {
        path: "/product",
        element: <ClientRoute><ProductAll></ProductAll></ClientRoute>
      },
      {
        path: "/product-details/:id",
        element: <ClientRoute><ProductDetails></ProductDetails></ClientRoute>
      },
      {
        path: "/free-products",
        element: <ClientRoute><FreeProducts></FreeProducts></ClientRoute>
      },
      {
        path: "/stock-alert",
        element: <ClientRoute><StockAlert></StockAlert></ClientRoute>
      },
      {
        path: "/stock-list",
        element: <ClientRoute><StockList></StockList></ClientRoute>
      },
      {
        path: "/stock-purchase",
        element: <ClientRoute><StockPurchase></StockPurchase></ClientRoute>
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
      },
      {
        path: "/features",
        element: <ClientRoute><Feature></Feature></ClientRoute>
      }
    ]
  },
]);