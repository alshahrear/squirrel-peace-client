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
      { key: "product", label: "Products", routes: ["/product", "/product-details"] },
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
    key: "inventory", label: "Inventory", subGroups: [
      { key: "stock", label: "Stock", from: 0, to: 4 },
      { key: "damage", label: "Damage", from: 4, to: 9 },
    ],
    modules: [
      { key: "stock_purchase", label: "Stock Purchase", routes: ["/stock-purchase"] },
      { key: "stock_products", label: "Stock Products", routes: ["/stock-products"] },
      { key: "stock_adjustment", label: "Stock Adjustment", routes: ["/stock-adjustment", "/stock-adjustment-form", "/stock-adjustment-view"] },
      { key: "stock_alert", label: "Stock Alert", routes: ["/stock-alert"] },
      { key: "damage_stock_invoice", label: "Damage Stock Invoice", routes: ["/damage-stock-invoice", "/damage-add", "/damage-details"] },
      { key: "damage_single_invoice", label: "Damage Single Invoice", routes: ["/damage-stock-single-invoice"] },
      { key: "damage_stock_products", label: "Damage Stock Products", routes: ["/damage-stock-products"] },
      { key: "damage_return_invoice", label: "Damage Return Invoice", routes: ["/damage-return-invoice", "/damage-return-add", "/damage-return-details"] },
      { key: "damage_return_products", label: "Damage Return Products", routes: ["/damage-return-products"] },
    ],
  },
  {
    key: "account", label: "Account", subGroups: [
      { key: "balance", label: "Account Balance", from: 0, to: 1 },
      { key: "investment", label: "Investment", from: 1, to: 6 },
      { key: "purchase", label: "Purchase Account", from: 6, to: 11 },
      { key: "sales", label: "Sales Account", from: 11, to: 16 },
    ],
    modules: [
      { key: "account_balance", label: "Account Balance", routes: ["/account-balance"] },
      { key: "account_investment", label: "Account Investment", routes: ["/opening-investment"] },
      { key: "account_income", label: "Account Income", routes: ["/income"] },
      { key: "account_expense", label: "Account Expense", routes: ["/expense"] },
      { key: "account_route_expense", label: "Account Route Expense", routes: ["/route-expense"] },
      { key: "account_transfer", label: "Account Transfer", routes: ["/transfer"] },
      { key: "account_purchase", label: "Purchase Account", routes: ["/account-purchase"] },
      { key: "account_purchase_return", label: "Purchase Return", routes: ["/account-purchase"] },
      { key: "account_purchase_bulk_return", label: "Bulk Return", routes: ["/account-purchase"] },
      { key: "account_purchase_damage_return", label: "Damage Return", routes: ["/account-purchase"] },
      { key: "account_purchase_due", label: "Due Payment", routes: ["/account-purchase"] },
      { key: "account_sales", label: "Wholesale Account", routes: ["/account-sales"] },
      { key: "account_sales_return", label: "Sales Return", routes: ["/account-sales"] },
      { key: "account_sales_bulk_return", label: "Sales Bulk Return", routes: ["/account-sales"] },
      { key: "account_sales_damage_return", label: "Sales Damage Return", routes: ["/account-sales"] },
      { key: "account_sales_due", label: "Due Payment", routes: ["/account-sales"] },
    ],
  },
  {
    key: "profit", label: "Profit",
    modules: [
      { key: "profit_sales_wise", label: "Sales Wise Profit", routes: ["/profit-all"] },
      { key: "profit_income", label: "Income Net", routes: ["/profit-all"] },
      { key: "profit_expense", label: "Expense Net", routes: ["/profit-all"] },
      { key: "profit_route_expense", label: "Route Expense Net", routes: ["/profit-all"] },
      { key: "profit_others", label: "Others Profit", routes: ["/profit-all"] },
    ],
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
    key: "users", label: "Users",
    modules: [
      { key: "user_list", label: "All User", routes: ["/user"] },
      { key: "user_assign", label: "User Assign", routes: ["/user-assign"] },
      { key: "user_role", label: "All Role", routes: ["/user-role"] },
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

// Detail / View পেজ: নিচের যেকোনো module এর View থাকলেই খুলবে (এগুলোতে শুধু দেখা যায়)
const DETAIL_VIEW = [
  {
    paths: ["/sales-details", "/sales-return-view", "/sales-bulk-return-view", "/damage-details"],
    modules: [
      "wholesale", "sales_return", "sales_bulk_return", "customer_account",
      "damage_stock_invoice", "damage_single_invoice", "stock_purchase", "stock_products",
      "account_sales", "account_sales_return", "account_sales_bulk_return",
      "account_sales_damage_return", "account_sales_due",
      "sales_report", "profit_sales_wise", "account_report", "stock_report",
    ],
  },
  {
    paths: ["/purchase-details", "/purchase-return-view", "/purchase-bulk-return-view", "/damage-return-details"],
    modules: [
      "purchase_all", "purchase_return", "purchase_bulk_return", "company_account",
      "damage_return_invoice", "stock_purchase", "stock_products",
      "account_purchase", "account_purchase_return", "account_purchase_bulk_return",
      "account_purchase_damage_return", "account_purchase_due",
      "purchase_report", "profit_others", "account_report", "stock_report",
    ],
  },
  {
    paths: ["/stock-adjustment-view"],
    modules: ["stock_adjustment", "stock_purchase", "stock_products"],
  },
];

export const findModuleByPath = (pathname) =>
  ALL_MODULES.find((m) => m.routes.some((r) => inPath(pathname, r)));

export const hasAction = (permissions, key, action) =>
  Array.isArray(permissions?.[key]) && permissions[key].includes(action);

// তালিকায় না থাকা পেজ (যেমন /user, /user-role, /user-assign) staff এর জন্য বন্ধ
export const canAccessPath = (permissions, pathname) => {
  if (ALWAYS_ALLOWED.some((p) => inPath(pathname, p))) return true;
  const mods = ALL_MODULES.filter((x) => x.routes.some((r) => inPath(pathname, r)));
  const extra = DETAIL_VIEW.filter((d) => d.paths.some((p) => inPath(pathname, p)));
  if (extra.some((d) => d.modules.some((k) => hasAction(permissions, k, "get")))) return true;
  if (mods.length === 0) return false;
  return mods.some((x) => hasAction(permissions, x.key, "get"));
};

export const firstAllowedPath = (permissions) => {
  const m = ALL_MODULES.find((x) => hasAction(permissions, x.key, "get"));
  return m ? m.routes[0] : "/client-profile";
};