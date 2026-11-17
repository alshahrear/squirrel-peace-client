import { useEffect, useState, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaTimes,
  FaChevronDown,
  FaHome,
  FaShoppingCart,
  FaTruck,
  FaBoxOpen,
  FaAddressBook,
  FaWarehouse,
  FaWallet,
  FaUsers,
  FaFileInvoiceDollar,
  FaChartBar,
  FaCoins,
  FaCog,
} from "react-icons/fa";
import fav from "../../../../assets/squirrelpeacelogo.png";
import { canAccessPath } from "../../../../hooks/permissionConfig";

const ICONS = {
  home: FaHome,
  sale: FaShoppingCart,
  purchase: FaTruck,
  products: FaBoxOpen,
  contact: FaAddressBook,
  inventory: FaWarehouse,
  account: FaWallet,
  profit: FaCoins,
  report: FaChartBar,
  users: FaUsers,
  billing: FaFileInvoiceDollar,
  settings: FaCog,
};

const getInitials = (name = "") =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "U";

const Drawer = ({ drawerOpen, setDrawerOpen, clientUser }) => {
  const panelRef = useRef(null);
  const location = useLocation();
  const [openKey, setOpenKey] = useState(null);

  const isOn = (paths = []) =>
    paths.some((p) => location.pathname === p || location.pathname.startsWith(p + "/"));

  // বাইরে ক্লিক করলে বন্ধ (মেনু বাটন ছাড়া)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!drawerOpen) return;
      const inside = panelRef.current && panelRef.current.contains(event.target);
      const toggle = event.target.closest(".drawer-toggle-btn");
      if (!inside && !toggle) setDrawerOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [drawerOpen, setDrawerOpen]);

  const firstAllowed = (list, fallback) =>
    (clientUser?.isStaff ? list.find((p) => canAccessPath(clientUser.permissions, p)) : null) || fallback;

  const SALES = ["/create-order", "/wholesale", "/sales-return", "/sales-bulk-return", "/sales-due-payment", "/sales-sr-target"];
  const PURCHASE = ["/purchase", "/add-purchase", "/purchase-return", "/purchase-bulk-return", "/purchase-due-payment"];
  const PRODUCTS = ["/product", "/category", "/units"];
  const CONTACT = ["/company", "/company-account", "/customers", "/customer-account", "/routes"];
  const STOCK = ["/stock-purchase", "/stock-products", "/stock-adjustment", "/stock-alert"];
  const DAMAGE = ["/damage-stock-invoice", "/damage-stock-single-invoice", "/damage-stock-products", "/damage-return-invoice", "/damage-return-products"];
  const ACCOUNT = ["/account-balance", "/opening-investment", "/income", "/expense", "/route-expense", "/transfer", "/account-purchase", "/account-sales"];
  const USERS = ["/user", "/user-assign", "/user-role"];

  const menuItems = [
    { type: "link", key: "home", to: clientUser ? "/dashboard" : "/", label: clientUser ? "Dashboard" : "Home", match: [clientUser ? "/dashboard" : "/"] },
    clientUser && {
      type: "link", key: "sale", label: "Sale",
      to: firstAllowed(SALES, "/create-order"),
      match: [...SALES, "/sales-details", "/sales-return-details", "/sales-return-view", "/sales-bulk-return-form", "/sales-bulk-return-view"],
    },
    {
      type: "link", key: "purchase", label: "Purchase",
      to: firstAllowed(PURCHASE, "/purchase"),
      match: [...PURCHASE, "/purchase-details", "/purchase-return-details", "/purchase-return-view", "/purchase-bulk-return-form", "/purchase-bulk-return-view"],
    },
    clientUser && {
      type: "link", key: "products", label: "Products",
      to: firstAllowed(PRODUCTS, "/product"),
      match: [...PRODUCTS, "/product-details"],
    },
    {
      type: "link", key: "contact", label: "Contact",
      to: firstAllowed(CONTACT, "/company"),
      match: [...CONTACT, "/company-details", "/customer-details"],
    },
    {
      type: "dropdown", key: "inventory", label: "Inventory",
      children: [
        {
          to: firstAllowed(STOCK, "/stock-all"), label: "Stock",
          match: [...STOCK, "/stock-all", "/stock-adjustment-form", "/stock-adjustment-view"],
        },
        {
          to: firstAllowed(DAMAGE, "/damage-products"), label: "Damage",
          match: [...DAMAGE, "/damage-products", "/damage-add", "/damage-details", "/damage-return-add", "/damage-return-details"],
        },
      ],
    },
    clientUser && {
      type: "link", key: "account", label: "Account",
      to: firstAllowed(ACCOUNT, "/account-balance"),
      match: ACCOUNT,
    },
    clientUser && { type: "link", key: "profit", label: "Profit", to: "/profit-all", match: ["/profit-all"] },
    {
      type: "dropdown", key: "report", label: "Report",
      children: [
        { to: "/sales-report", label: "Sales Reports", match: ["/sales-report", "/sale-customer-sum-details"] },
        { to: "/purchase-report", label: "Purchase Reports", match: ["/purchase-report"] },
        { to: "/stock-report", label: "Stock Reports", match: ["/stock-report"] },
        { to: "/account-report", label: "Account Reports", match: ["/account-report"] },
      ],
    },
    clientUser && {
      type: "link", key: "users", label: "Users",
      to: firstAllowed(USERS, "/user"),
      match: USERS,
    },
    {
      type: "dropdown", key: "settings", label: "Settings",
      children: [
        { to: "/features", label: "Features", match: ["/features"] },
        { to: "/payment-billing", label: "Payment & Billing", match: ["/payment-billing"] },
      ],
    },
  ]
    .filter(Boolean)
    .map((item) => {
      if (!clientUser?.isStaff || item.type !== "dropdown") return item;
      return { ...item, children: item.children.filter((c) => canAccessPath(clientUser.permissions, c.to)) };
    })
    .filter((item) => {
      if (!clientUser?.isStaff) return true;
      if (item.type === "link") return canAccessPath(clientUser.permissions, item.to);
      return item.key !== "users" && item.children.length > 0;
    });

  // ড্রয়ার খুললে বর্তমান পেজের ড্রপডাউন খোলা থাকবে
  useEffect(() => {
    if (!drawerOpen) {
      setOpenKey(null);
      return;
    }
    const active = menuItems.find((i) => i.type === "dropdown" && i.children.some((c) => isOn(c.match)));
    setOpenKey(active ? active.key : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawerOpen, clientUser]);

  return (
    <div
      className={`fixed inset-x-0 top-[61px] bottom-[calc(68px+env(safe-area-inset-bottom,0px))] lg:bottom-0 z-40 transition-colors duration-200 ${drawerOpen ? "bg-slate-900/25 pointer-events-auto" : "bg-transparent pointer-events-none"}`}
      onClick={() => setDrawerOpen(false)}
    >
      <aside
        ref={panelRef}
        className={`absolute left-0 top-0 h-full w-[72vw] max-w-xs sm:w-80 bg-white border-r border-slate-200 shadow-xl flex flex-col transition-transform duration-200 ease-out ${drawerOpen ? "translate-x-0 pointer-events-auto" : "-translate-x-full"}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <img src={fav} alt="Logo" className="h-7 w-7 object-cover rounded-md" />
            <span className="font-semibold text-slate-800 text-sm">Bashay Bazar</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
            aria-label="Close menu"
          >
            <FaTimes className="text-[13px]" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-2 sm:space-y-1.5">
          {menuItems.map((item) => {
            const Icon = ICONS[item.key] || FaCog;

            if (item.type === "link") {
              const active = isOn(item.match);
              return (
                <NavLink
                  key={item.key}
                  to={item.to}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-3 px-3 min-h-[48px] sm:min-h-[40px] py-2 sm:py-1.5 rounded-2xl text-[15px] sm:text-[14px] font-semibold transition-all active:scale-[0.98] ${active ? "bg-brand-100 text-brand-700 shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}
                >
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm">
                    <Icon className={`text-[16px] sm:text-[14px] ${active ? "text-brand-600" : "text-slate-400"}`} />
                  </span>
                  {item.label}
                </NavLink>
              );
            }

            const open = openKey === item.key;
            const groupActive = item.children.some((c) => isOn(c.match));
            return (
              <div key={item.key}>
                <button
                  onClick={() => setOpenKey(open ? null : item.key)}
                  className={`w-full flex items-center justify-between px-3 min-h-[48px] sm:min-h-[40px] py-2 sm:py-1.5 rounded-2xl text-[15px] sm:text-[14px] font-semibold transition-all cursor-pointer active:scale-[0.98] ${groupActive ? "bg-brand-50 text-brand-700 shadow-sm" : "bg-slate-50 text-slate-700 hover:bg-brand-50 hover:text-brand-700"}`}
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-xl sm:rounded-lg bg-white shadow-sm">
                      <Icon className={`text-[16px] sm:text-[14px] ${groupActive ? "text-brand-600" : "text-slate-400"}`} />
                    </span>
                    {item.label}
                  </span>
                  <FaChevronDown className={`text-[10px] text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
                </button>

                <div className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                  <div className="overflow-hidden">
                    <div className="ml-[22px] mt-1.5 mb-1 pl-3 border-l border-slate-200 space-y-1.5">
                      {item.children.map((child) => {
                        const active = isOn(child.match);
                        return (
                          <NavLink
                            key={child.label}
                            to={child.to}
                            onClick={() => setDrawerOpen(false)}
                            className={`flex items-center min-h-[44px] sm:min-h-[36px] px-3 py-2 sm:py-1.5 rounded-xl text-[14.5px] sm:text-[13.5px] font-medium transition-all active:scale-[0.98] ${active ? "bg-brand-100 text-brand-700" : "bg-slate-50 text-slate-600 hover:bg-brand-50 hover:text-brand-700"}`}
                          >
                            {child.label}
                          </NavLink>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer: user card */}
        {clientUser && (
          <div className="p-3 border-t border-slate-100">
            <div className="flex items-center gap-3 px-2 py-2 rounded-2xl bg-slate-50">
              <span className="h-9 w-9 shrink-0 rounded-full bg-brand-600 text-white text-sm font-semibold flex items-center justify-center">
                {getInitials(clientUser.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{clientUser.name}</p>
                  <span className="shrink-0 px-1.5 py-px rounded-full bg-brand-100 text-brand-700 text-[10px] font-bold leading-tight">
                    {clientUser.isStaff ? clientUser.role || "Staff" : "Super Admin"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 truncate">{clientUser.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default Drawer;