import {
  createBrowserRouter,
  Navigate
} from "react-router-dom";
import Main from "../hooks/Main";
import TenantHome from "../hooks/TenantHome";
import MainOnly from "../hooks/MainOnly";
import ErrorPage from "../hooks/ErrorPage";
import Login from "../hooks/Login";
import Register from "../hooks/Register";
import Users from "../hooks/Users";
import AdminPages from "../hooks/AdminPages";
import AdminRoute from "../hooks/AdminRoute";
import Software from "../hooks/Software";
import Client from "../Components/Pages/Software/Client/Client";
import ClientDetails from "../Components/Pages/Software/Client/ClientDetails";
import LoginClient from "../Components/Pages/Software/Client/LoginClient";
import Dashboard from "../Components/Pages/Software/Dashboard/Dashboard";
import ClientProfile from "../Components/Pages/Software/Client/ClientProfile";
import ClientRoute from "../hooks/ClientRoute";
import Route from "../Components/Pages/Software/Contact/Route";
import Company from "../Components/Pages/Software/Contact/Company/Company";
import Customers from "../Components/Pages/Software/Contact/Customer/Customers";
import UserRole from "../Components/Pages/Software/User/UserRole";
import User from "../Components/Pages/Software/User/User";
import AccountBalance from "../Components/Pages/Software/Account/AccountBalance";
import PurchaseAdd from "../Components/Pages/Software/Purchase/PurchaseAdd";
import Purchase from "../Components/Pages/Software/Purchase/Purchase";
import PurchaseDetails from "../Components/Pages/Software/Purchase/PurchaseDetails";
import PurchaseReturn from "../Components/Pages/Software/Purchase/PurchaseReturn";
import PurchaseReturnDetails from "../Components/Pages/Software/Purchase/PurchaseReturnDetails";
import PurchaseReturnView from "../Components/Pages/Software/Purchase/PurchaseReturnView";
import Product from "../Components/Pages/Software/Product/Product";
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
import SaleCustomerSumDetails from "../Components/Pages/Software/Reports/SalesReport/SaleCustomerSumDetails";
import DataRefresh from "../hooks/DataRefresh";
import ProfitTabAll from "../Components/Pages/Software/Reports/Profit/ProfitTabAll";
import CompanyAccountAc from "../Components/Pages/Software/Contact/Company/CompanyAccountAc";
import PurchaseDuePayment from "../Components/Pages/Software/Purchase/PurchaseDuePayment";
import CustomerAccountAc from "../Components/Pages/Software/Contact/Customer/CustomerAccountAc";
import SalesDuePayment from "../Components/Pages/Software/Sales/SalesDuePayment";
import OpeningInvestment from "../Components/Pages/Software/Account/AccountInvestment/OpeningInvestment";
import Expense from "../Components/Pages/Software/Account/AccountInvestment/Expense";
import AccountInsideAll from "../Components/Pages/Software/Account/AccountInvestment/AccountInsideAll";
import SalesReportAll from "../Components/Pages/Software/Reports/SalesReport/SalesReportAll";
import StockReportAll from "../Components/Pages/Software/Reports/StockReport/StockReportAll";
import Income from "../Components/Pages/Software/Account/AccountInvestment/Income";
import RouteExpense from "../Components/Pages/Software/Account/AccountInvestment/RouteExpense";
import Transfer from "../Components/Pages/Software/Account/AccountInvestment/Transfer";
import AccountPurchaseAll from "../Components/Pages/Software/Account/AccountPurchase/AccountPurchaseAll";
import AccountSalesAll from "../Components/Pages/Software/Account/AccountSales/AccountSalesAll";
import SalesSrTarget from "../Components/Pages/Software/Sales/SalesSrTarget";
import AccountReportAll from "../Components/Pages/Software/Reports/AccountReport/AccountReportAll";
import Burger from "../hooks/Burger";
import BurgerSos from "../hooks/BurgerSos";
import UserAssign from "../Components/Pages/Software/User/UserAssign";
import UserAll from "../Components/Pages/Software/User/UserAll";
import ContactAll from "../Components/Pages/Software/Contact/ContactAll";
import PurchaseAll from "../Components/Pages/Software/Purchase/PurchaseAll";
import SalesAll from "../Components/Pages/Software/Sales/SalesAll";
import AccountAll from "../Components/Pages/Software/Account/AccountAll";

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
            element: <TenantHome></TenantHome>
          },
          {
            path: "/admin-pages",
            element: <AdminRoute><AdminPages></AdminPages></AdminRoute>
          },
          {
            path: "/burger",
            element: <MainOnly><Burger></Burger></MainOnly>
          },
          {
            path: "/burger-sos",
            element: <MainOnly><BurgerSos></BurgerSos></MainOnly>
          },
          {
            path: "/login",
            element: <MainOnly><Login></Login></MainOnly>
          },
          {
            path: "/register",
            element: <MainOnly><Register></Register></MainOnly>
          },
          {
            path: "/users",
            element: <AdminRoute><Users></Users></AdminRoute>
          },
          {
            path: "/purchase",
            element: <ClientRoute><PurchaseAll><Purchase></Purchase></PurchaseAll></ClientRoute>
          },
          {
            path: "/add-purchase",
            element: <ClientRoute><PurchaseAll><PurchaseAdd></PurchaseAdd></PurchaseAll></ClientRoute>
          },
          {
            path: "/purchase-details/:id",
            element: <ClientRoute><PurchaseDetails></PurchaseDetails></ClientRoute>
          },
          {
            path: "/purchase-return",
            element: <ClientRoute><PurchaseAll><PurchaseReturn></PurchaseReturn></PurchaseAll></ClientRoute>
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
            element: <ClientRoute><PurchaseAll><PurchaseDuePayment></PurchaseDuePayment></PurchaseAll></ClientRoute>
          },
          {
            path: "/purchase-bulk-return-view/:id",
            element: <ClientRoute><PurchaseBulkDetails></PurchaseBulkDetails></ClientRoute>
          },
          {
            path: "/purchase-bulk-return",
            element: <ClientRoute><PurchaseAll><PurchaseBulkReturn></PurchaseBulkReturn></PurchaseAll></ClientRoute>
          },
          {
            path: "/purchase-bulk-return-form",
            element: <ClientRoute><PurchaseBulkReturnForm></PurchaseBulkReturnForm></ClientRoute>
          },
          {
            path: "/create-order",
            element: <ClientRoute><SalesAll><OrderAdd></OrderAdd></SalesAll></ClientRoute>
          },
          {
            path: "/wholesale",
            element: <ClientRoute><SalesAll><Wholesale></Wholesale></SalesAll></ClientRoute>
          },
          {
            path: "/sales-due-payment",
            element: <ClientRoute><SalesAll><SalesDuePayment></SalesDuePayment></SalesAll></ClientRoute>
          },
          {
            path: "/sales-details/:id",
            element: <ClientRoute><SalesDetails></SalesDetails></ClientRoute>
          },
          {
            path: "/sales-return",
            element: <ClientRoute><SalesAll><SalesReturn></SalesReturn></SalesAll></ClientRoute>
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
            element: <ClientRoute><SalesAll><SalesBulkReturn></SalesBulkReturn></SalesAll></ClientRoute>
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
            path: "/sales-sr-target",
            element: <ClientRoute><SalesAll><SalesSrTarget></SalesSrTarget></SalesAll></ClientRoute>
          },
          {
            path: "/units",
            element: <ClientRoute><ProductAll><Units></Units></ProductAll></ClientRoute>
          },
          {
            path: "/category",
            element: <ClientRoute><ProductAll><Category></Category></ProductAll></ClientRoute>
          },
          {
            path: "/company",
            element: <ClientRoute><ContactAll><Company></Company></ContactAll></ClientRoute>
          },
          {
            path: "/company-account",
            element: <ClientRoute><ContactAll><CompanyAccountAc></CompanyAccountAc></ContactAll></ClientRoute>
          },
          {
            path: "/company-details/:id",
            element: <ClientRoute><CompanyDetails></CompanyDetails></ClientRoute>
          },
          {
            path: "/customers",
            element: <ClientRoute><ContactAll><Customers></Customers></ContactAll></ClientRoute>
          },
          {
            path: "/customer-account",
            element: <ClientRoute><ContactAll><CustomerAccountAc></CustomerAccountAc></ContactAll></ClientRoute>
          },
          {
            path: "/customer-details/:id",
            element: <ClientRoute><CustomersDetails></CustomersDetails></ClientRoute>
          },
          {
            path: "/product",
            element: <ClientRoute><ProductAll><Product></Product></ProductAll></ClientRoute>
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
            path: "/account-report",
            element: <ClientRoute><AccountReportAll></AccountReportAll></ClientRoute>
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
            element: <ClientRoute><UserAll><UserRole></UserRole></UserAll></ClientRoute>
          },
          {
            path: "/user-assign",
            element: <ClientRoute><UserAll><UserAssign></UserAssign></UserAll></ClientRoute>
          },
          {
            path: "/user",
            element: <ClientRoute><UserAll><User></User></UserAll></ClientRoute>
          },
          {
            path: "/client",
            element: <AdminRoute><Client></Client></AdminRoute>
          },
          {
            path: "/client-details/:id",
            element: <AdminRoute><ClientDetails></ClientDetails></AdminRoute>
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
            path: "/client-profile",
            element: <ClientRoute><ClientProfile></ClientProfile></ClientRoute>
          },
          {
            element: <ClientRoute><AccountAll><AccountInsideAll></AccountInsideAll></AccountAll></ClientRoute>,
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
              }
            ]
          },
          {
            path: "/account-purchase",
            element: <ClientRoute><AccountAll><AccountPurchaseAll></AccountPurchaseAll></AccountAll></ClientRoute>
          },
          {
            path: "/account-sales",
            element: <ClientRoute><AccountAll><AccountSalesAll></AccountSalesAll></AccountAll></ClientRoute>
          },
          {
            path: "/account-balance",
            element: <ClientRoute><AccountAll><AccountBalance></AccountBalance></AccountAll></ClientRoute>
          },
          {
            path: "/account-all",
            element: <Navigate to="/opening-investment" replace></Navigate>
          },
          {
            path: "/routes",
            element: <ClientRoute><ContactAll><Route></Route></ContactAll></ClientRoute>
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