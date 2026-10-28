import {
  createBrowserRouter,
  Navigate
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
import Company from "../Components/Pages/Software/Contact/Company/Company";
import Customers from "../Components/Pages/Software/Contact/Customer/Customers";
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
import PurchaseBulkReturn from "../Components/Pages/Software/Purchase/PurchaseBulkReturn";
import OrderAdd from "../Components/Pages/Software/Order/OrderAdd";
import Wholesale from "../Components/Pages/Software/Sales/Wholesale";
import Feature from "../Components/Pages/Software/Settings/Feature";
import SalesDetails from "../Components/Pages/Software/Sales/SalesDetails";
import SalesReturn from "../Components/Pages/Software/Sales/SalesReturn";
import SalesReturnDetails from "../Components/Pages/Software/Sales/SalesReturnDetails";
import SalesReturnView from "../Components/Pages/Software/Sales/SalesReturnView";
import CompanyDetails from "../Components/Pages/Software/Contact/Company/CompanyDetails";
import CustomersDetails from "../Components/Pages/Software/Contact/Customer/CustomersDetails";
import ProductDetails from "../Components/Pages/Software/Product/ProductDetails";
import PurchaseBulkReturnForm from "../Components/Pages/Software/Purchase/PurchaseBulkReturnForm";
import PurchaseBulkDetails from "../Components/Pages/Software/Purchase/PurchaseBulkDetails";
import SalesBulkReturn from "../Components/Pages/Software/Sales/SalesBulkReturn";
import SalesBulkReturnForm from "../Components/Pages/Software/Sales/SalesBulkReturnForm";
import SalesBulkDetails from "../Components/Pages/Software/Sales/SalesBulkDetails";
import DamageStockAdd from "../Components/Pages/Software/Inventory/Damage/DamageStockAdd";
import DamageAll from "../Components/Pages/Software/Inventory/Damage/DamageAll";
import DamageStockInvoice from "../Components/Pages/Software/Inventory/Damage/DamageStockInvoice";
import DamageStockProducts from "../Components/Pages/Software/Inventory/Damage/DamageStockProducts";
import DamageStockSingleInvoice from "../Components/Pages/Software/Inventory/Damage/DamageStockSingleInvoice";
import DamageReturnInvoice from "../Components/Pages/Software/Inventory/Damage/DamageReturnInvoice";
import DamageReturnProducts from "../Components/Pages/Software/Inventory/Damage/DamageReturnProducts";
import DamageStockDetails from "../Components/Pages/Software/Inventory/Damage/DamageStockDetails";
import DamageReturnAdd from "../Components/Pages/Software/Inventory/Damage/DamageReturnAdd";
import DamageReturnDetails from "../Components/Pages/Software/Inventory/Damage/DamageReturnDetails";
import StockAll from "../Components/Pages/Software/Inventory/Stock/StockAll";
import StockProducts from "../Components/Pages/Software/Inventory/Stock/StockProducts";
import StockPurchase from "../Components/Pages/Software/Inventory/Stock/StockPurchase";
import StockAdjustment from "../Components/Pages/Software/Inventory/Stock/StockAdjustment";
import StockAlert from "../Components/Pages/Software/Inventory/Stock/StockAlert";
import StockAdjustmentForm from "../Components/Pages/Software/Inventory/Stock/StockAdjustmentForm";
import StockAdjustmentDetails from "../Components/Pages/Software/Inventory/Stock/StockAdjustmentDetails";
import PurchaseReportAll from "../Components/Pages/Software/Reports/PurchaseReport/PurchaseReportAll";
import SalesReportAll from "../Components/Pages/Software/Reports/SalesReport/SalesReportAll";
import SaleCustomerSumDetails from "../Components/Pages/Software/Reports/SalesReport/SaleCustomerSumDetails";
import StockReportAll from "../Components/Pages/Software/Reports/StockReport/StockReportAll";
import AccountInsideAll from "../Components/Pages/Software/Account/AccountInsideAll";
import DataRefresh from "../Components/Layout/DataRefresh";
import ProfitTabAll from "../Components/Pages/Software/Reports/Profit/ProfitTabAll";
import CustomerAccount from "../Components/Pages/Software/Contact/Customer/CustomerAccount";
import CompanyAccountAc from "../Components/Pages/Software/Contact/Company/CompanyAccountAc";
import PurchaseDuePayment from "../Components/Pages/Software/Purchase/PurchaseDuePayment";



export const router = createBrowserRouter([
  {
    path: "/",
    element: <Main></Main>,
    errorElement: <ErrorPage></ErrorPage>,
    children: [
      {
        element: <DataRefresh></DataRefresh>,
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
            path: "/purchase-due-payment",
            element: <ClientRoute><PurchaseDuePayment></PurchaseDuePayment></ClientRoute>
          },
          {
            path: "/purchase-bulk-return-view/:id",
            element: <ClientRoute><PurchaseBulkDetails></PurchaseBulkDetails></ClientRoute>
          },
          {
            path: "/purchase-bulk-return",
            element: <ClientRoute><PurchaseBulkReturn></PurchaseBulkReturn></ClientRoute>
          },
          {
            path: "/purchase-bulk-return-form",
            element: <ClientRoute><PurchaseBulkReturnForm></PurchaseBulkReturnForm></ClientRoute>
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
            path: "/sales-bulk-return",
            element: <ClientRoute><SalesBulkReturn></SalesBulkReturn></ClientRoute>
          },
          {
            path: "/sales-bulk-return-form",
            element: <ClientRoute><SalesBulkReturnForm></SalesBulkReturnForm></ClientRoute>
          },
          {
            path: "/sales-bulk-return-view/:id",
            element: <ClientRoute><SalesBulkDetails></SalesBulkDetails></ClientRoute>
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
            path: "/company-account",
            element: <ClientRoute><CompanyAccountAc></CompanyAccountAc></ClientRoute>
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
            path: "/customer-account",
            element: <ClientRoute><CustomerAccount></CustomerAccount></ClientRoute>
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
            element: <ClientRoute><StockAll></StockAll></ClientRoute>,
            children: [
              {
                path: "/stock-products",
                element: <StockProducts></StockProducts>
              },
              {
                path: "/stock-purchase",
                element: <StockPurchase></StockPurchase>
              },
              {
                path: "/stock-adjustment",
                element: <StockAdjustment></StockAdjustment>
              },
              {
                path: "/stock-alert",
                element: <StockAlert></StockAlert>
              }
            ]
          },
          {
            path: "/stock-all",
            element: <Navigate to="/stock-products" replace></Navigate>
          },
          {
            path: "/stock-adjustment-form",
            element: <ClientRoute><StockAdjustmentForm></StockAdjustmentForm></ClientRoute>
          },
          {
            path: "/stock-adjustment-view/:id",
            element: <ClientRoute><StockAdjustmentDetails></StockAdjustmentDetails></ClientRoute>
          },
          {
            path: "/damage-add",
            element: <ClientRoute><DamageStockAdd></DamageStockAdd></ClientRoute>
          },
          {
            element: <ClientRoute><DamageAll></DamageAll></ClientRoute>,
            children: [
              {
                path: "/damage-products",
                element: <></>
              },
              {
                path: "/damage-stock-invoice",
                element: <DamageStockInvoice></DamageStockInvoice>
              },
                           {
                path: "/damage-stock-single-invoice",
                element: <DamageStockSingleInvoice></DamageStockSingleInvoice>
              },
              {
                path: "/damage-stock-products",
                element: <DamageStockProducts></DamageStockProducts>
              },
              {
                path: "/damage-return-invoice",
                element: <DamageReturnInvoice></DamageReturnInvoice>
              },
              {
                path: "/damage-return-products",
                element: <DamageReturnProducts></DamageReturnProducts>
              }
            ]
          },
          {
            path: "/damage-details/:id",
            element: <ClientRoute><DamageStockDetails></DamageStockDetails></ClientRoute>
          },
          {
            path: "/damage-return-add",
            element: <ClientRoute><DamageReturnAdd></DamageReturnAdd></ClientRoute>
          },
          {
            path: "/damage-return-details/:id",
            element: <ClientRoute><DamageReturnDetails></DamageReturnDetails></ClientRoute>
          },
          {
            path: "/purchase-report",
            element: <ClientRoute><PurchaseReportAll></PurchaseReportAll></ClientRoute>
          },
          {
            path: "/sales-report",
            element: <ClientRoute><SalesReportAll></SalesReportAll></ClientRoute>
          },
          {
            path: "/sale-customer-sum-details",
            element: <ClientRoute><SaleCustomerSumDetails></SaleCustomerSumDetails></ClientRoute>
          },
          {
            path: "/stock-report",
            element: <ClientRoute><StockReportAll></StockReportAll></ClientRoute>
          },
          {
            path: "/profit-all",
            element: <ClientRoute><ProfitTabAll></ProfitTabAll></ClientRoute>
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
            element: <ClientRoute><AccountInsideAll></AccountInsideAll></ClientRoute>,
            children: [
              {
                path: "/opening-investment",
                element: <OpeningInvestment></OpeningInvestment>
              },
              {
                path: "/income",
                element: <Income></Income>
              },
              {
                path: "/expense",
                element: <Expense></Expense>
              },
              {
                path: "/route-expense",
                element: <RouteExpense></RouteExpense>
              },
              {
                path: "/transfer",
                element: <Transfer></Transfer>
              },
              {
                path: "/account-heads",
                element: <AccountHeads></AccountHeads>
              }
            ]
          },
          {
            path: "/account-balance",
            element: <ClientRoute><AccountBalance></AccountBalance></ClientRoute>
          },
          {
            path: "/account-all",
            element: <Navigate to="/opening-investment" replace></Navigate>
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
      }
    ]
  },
]);