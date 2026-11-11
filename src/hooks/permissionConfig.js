export const ACTIONS = [
  { key: "get", label: "View" },
  { key: "post", label: "Add" },
  { key: "put", label: "Edit" },
  { key: "delete", label: "Delete" },
];

// প্রতিটা module এর key অবশ্যই backend এর PERMISSION_MODULES এর key এর সাথে মিলতে হবে
export const PERMISSION_GROUPS = [
  {
    key: "dashboard", label: "Dashboard",
    modules: [{ key: "dashboard", label: "Dashboard", routes: ["/dashboard"] }],
  },
  {
    key: "sale", label: "Sale",
    modules: [
      { key: "wholesale", label: "Wholesale", routes: ["/wholesale", "/sales-details"] },
      { key: "create_order", label: "Create Order", routes: ["/create-order"] },
      { key: "sales_return", label: "Sales Return", routes: ["/sales-return", "/sales-return-details", "/sales-return-view"] },
      { key: "sales_bulk_return", label: "Sales Bulk Return", routes: ["/sales-bulk-return", "/sales-bulk-return-form", "/sales-bulk-return-view"] },
      { key: "sales_due_payment", label: "Sales Due Payment", routes: ["/sales-due-payment"] },
      { key: "sales_sr_target", label: "Sales SR Target", routes: ["/sales-sr-target"] },
    ],
  },
  {
    key: "purchase", label: "Purchase",
    modules: [
      { key: "purchase_add", label: "Add Purchase", routes: ["/add-purchase"] },
      { key: "purchase_all", label: "All Purchase", routes: ["/purchase", "/purchase-details"] },
      { key: "purchase_return", label: "Purchase Return", routes: ["/purchase-return", "/purchase-return-details", "/purchase-return-view"] },
      { key: "purchase_bulk_return", label: "Purchase Bulk Return", routes: ["/purchase-bulk-return", "/purchase-bulk-return-form", "/purchase-bulk-return-view"] },
      { key: "purchase_due_payment", label: "Purchase Due Payment", routes: ["/purchase-due-payment"] },
    ],
  },
  {
    key: "products", label: "Products",
    modules: [
      { key: "product", label: "All Products", routes: ["/product", "/product-details"] },
      { key: "category", label: "Category", routes: ["/category"] },
      { key: "units", label: "Units", routes: ["/units"] },
    ],
  },
  {
    key: "contact", label: "Contact",
    modules: [
      { key: "customers", label: "Customers", routes: ["/customers", "/customer-details"] },
      { key: "company", label: "Company", routes: ["/company", "/company-details"] },
      { key: "company_account", label: "Company Account", routes: ["/company-account"] },
      { key: "customer_account", label: "Customer Account", routes: ["/customer-account"] },
      { key: "routes", label: "Route", routes: ["/routes"] },
    ],
  },
  {
    key: "inventory", label: "Inventory",
    modules: [
      { key: "stock", label: "Stock (Products, Purchase, Adjustment, Alert)", routes: ["/stock-products", "/stock-all", "/stock-purchase", "/stock-adjustment", "/stock-alert", "/stock-adjustment-form", "/stock-adjustment-view"] },
      { key: "damage", label: "Damage", routes: ["/damage-products", "/damage-add", "/damage-stock-invoice", "/damage-stock-single-invoice", "/damage-stock-products", "/damage-return-invoice", "/damage-return-products", "/damage-details", "/damage-return-add", "/damage-return-details"] },
    ],
  },
  {
    key: "account", label: "Account",
    modules: [
      { key: "account_balance", label: "Account Balance", routes: ["/account-balance"] },
      { key: "account_all", label: "Account All (Investment, Income, Expense, Transfer)", routes: ["/account-all", "/opening-investment", "/income", "/expense", "/route-expense", "/transfer"] },
      { key: "account_sales", label: "Account Sales", routes: ["/account-sales"] },
      { key: "account_purchase", label: "Account Purchase", routes: ["/account-purchase"] },
    ],
  },
  {
    key: "profit", label: "Profit",
    modules: [{ key: "profit", label: "Profit", routes: ["/profit-all"] }],
  },
  {
    key: "report", label: "Report",
    modules: [
      { key: "sales_report", label: "Sales Reports", routes: ["/sales-report", "/sale-customer-sum-details"] },
      { key: "purchase_report", label: "Purchase Reports", routes: ["/purchase-report"] },
      { key: "stock_report", label: "Stock Reports", routes: ["/stock-report"] },
      { key: "account_report", label: "Account Reports", routes: ["/account-report"] },
    ],
  },
  {
    key: "settings", label: "Settings",
    modules: [{ key: "features", label: "Features", routes: ["/features"] }],
  },
];

export const ALL_MODULES = PERMISSION_GROUPS.flatMap((g) => g.modules);

// সব staff এর জন্য খোলা পেজ
const ALWAYS_ALLOWED = ["/client-profile"];

const inPath = (path, base) => path === base || path.startsWith(base + "/");

export const findModuleByPath = (pathname) =>
  ALL_MODULES.find((m) => m.routes.some((r) => inPath(pathname, r)));

export const hasAction = (permissions, key, action) =>
  Array.isArray(permissions?.[key]) && permissions[key].includes(action);

// তালিকায় না থাকা পেজ (যেমন /user, /user-role, /user-assign) staff এর জন্য বন্ধ
export const canAccessPath = (permissions, pathname) => {
  if (ALWAYS_ALLOWED.some((p) => inPath(pathname, p))) return true;
  const m = findModuleByPath(pathname);
  if (!m) return false;
  return hasAction(permissions, m.key, "get");
};

export const firstAllowedPath = (permissions) => {
  const m = ALL_MODULES.find((x) => hasAction(permissions, x.key, "get"));
  return m ? m.routes[0] : "/client-profile";
};