import { useEffect, useState, useRef } from "react";
import { NavLink } from "react-router-dom";
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
  FaCog,
} from "react-icons/fa";
import fav from "../../../../assets/squirrelpeacelogo.png";

// প্রতিটা মেনু ক্যাটাগরির জন্য আলাদা প্যাস্টেল কালার থিম (Tailwind JIT-এর জন্য class গুলো পূর্ণ লেখা আছে)
const colorMap = {
  home: {
    icon: FaHome,
    iconWrap: "bg-blue-50 text-blue-600",
    active: "bg-blue-50 text-blue-700 before:bg-blue-600",
    childActive: "bg-blue-50 text-blue-700",
    chevronOpen: "text-blue-600",
  },
  sale: {
    icon: FaShoppingCart,
    iconWrap: "bg-emerald-50 text-emerald-600",
    active: "bg-emerald-50 text-emerald-700 before:bg-emerald-600",
    childActive: "bg-emerald-50 text-emerald-700",
    chevronOpen: "text-emerald-600",
  },
  purchase: {
    icon: FaTruck,
    iconWrap: "bg-amber-50 text-amber-600",
    active: "bg-amber-50 text-amber-700 before:bg-amber-600",
    childActive: "bg-amber-50 text-amber-700",
    chevronOpen: "text-amber-600",
  },
  products: {
    icon: FaBoxOpen,
    iconWrap: "bg-violet-50 text-violet-600",
    active: "bg-violet-50 text-violet-700 before:bg-violet-600",
    childActive: "bg-violet-50 text-violet-700",
    chevronOpen: "text-violet-600",
  },
  contact: {
    icon: FaAddressBook,
    iconWrap: "bg-rose-50 text-rose-600",
    active: "bg-rose-50 text-rose-700 before:bg-rose-600",
    childActive: "bg-rose-50 text-rose-700",
    chevronOpen: "text-rose-600",
  },
  inventory: {
    icon: FaWarehouse,
    iconWrap: "bg-cyan-50 text-cyan-600",
    active: "bg-cyan-50 text-cyan-700 before:bg-cyan-600",
    childActive: "bg-cyan-50 text-cyan-700",
    chevronOpen: "text-cyan-600",
  },
  account: {
    icon: FaWallet,
    iconWrap: "bg-indigo-50 text-indigo-600",
    active: "bg-indigo-50 text-indigo-700 before:bg-indigo-600",
    childActive: "bg-indigo-50 text-indigo-700",
    chevronOpen: "text-indigo-600",
  },
  report: {
    icon: FaChartBar,
    iconWrap: "bg-orange-50 text-orange-600",
    active: "bg-orange-50 text-orange-700 before:bg-orange-600",
    childActive: "bg-orange-50 text-orange-700",
    chevronOpen: "text-orange-600",
  },
  users: {
    icon: FaUsers,
    iconWrap: "bg-fuchsia-50 text-fuchsia-600",
    active: "bg-fuchsia-50 text-fuchsia-700 before:bg-fuchsia-600",
    childActive: "bg-fuchsia-50 text-fuchsia-700",
    chevronOpen: "text-fuchsia-600",
  },
  billing: {
    icon: FaFileInvoiceDollar,
    iconWrap: "bg-teal-50 text-teal-600",
    active: "bg-teal-50 text-teal-700 before:bg-teal-600",
    childActive: "bg-teal-50 text-teal-700",
    chevronOpen: "text-teal-600",
  },
  settings: {
    icon: FaCog,
    iconWrap: "bg-slate-100 text-slate-500",
    active: "bg-slate-100 text-slate-700 before:bg-slate-500",
    childActive: "bg-slate-100 text-slate-700",
    chevronOpen: "text-slate-500",
  },
};

const Drawer = ({ drawerOpen, setDrawerOpen, scrolled, clientUser }) => {
  const [drawerHeight, setDrawerHeight] = useState("100%");
  const baseDelay = 60;
  const [animatedItems, setAnimatedItems] = useState([]);
  const drawerPanelRef = useRef(null);

  // বাইরে কোথাও ক্লিক করলে ড্রয়ার বন্ধ হয়ে যাবে (মেনু টগল বাটন ছাড়া)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!drawerOpen) return;
      const clickedInsideDrawer = drawerPanelRef.current && drawerPanelRef.current.contains(event.target);
      const clickedToggleButton = event.target.closest(".drawer-toggle-btn");
      if (!clickedInsideDrawer && !clickedToggleButton) {
        setDrawerOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [drawerOpen, setDrawerOpen]);

  // ড্রপডাউনগুলোর খোলা/বন্ধ অবস্থা ট্র্যাক করার জন্য ডায়নামিক স্টেট
  const [openDropdowns, setOpenDropdowns] = useState({});

  const toggleDropdown = (key) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ফুটারের সাথে ড্রয়ারের নিচ দিক মেলানোর লজিক
  useEffect(() => {
    const handleScroll = () => {
      const footerElement = document.querySelector("footer") || document.querySelector(".footer");
      if (footerElement) {
        const footerRect = footerElement.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (footerRect.top < windowHeight) {
          const visibleHeight = windowHeight - footerRect.top;
          setDrawerHeight(`calc(100vh - ${visibleHeight}px)`);
        } else {
          setDrawerHeight("100%");
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  // ড্রয়ারের আইটেমগুলোর অ্যানিমেশন লিস্ট
  const menuItems = [
    { type: "link", key: "home", to: clientUser ? "/dashboard" : "/", label: clientUser ? "Dashboard" : "Home" },
    clientUser &&
    {
      type: "dropdown",
      key: "sale",
      label: "Sale",
      children: [
        { to: "/wholesale", label: "Wholesale" },
        { to: "/sales-return", label: "Sales Return" },
        { to: "/sales-bulk-return", label: "Bulk Return" },
      ],
    },
    {
      type: "dropdown",
      key: "purchase",
      label: "Purchase",
      children: [
        { to: "/add-purchase", label: "Add Purchase" },
        { to: "/purchase", label: "All Purchase" },
        { to: "/purchase-return", label: "Purchase Return" },
        { to: "/purchase-bulk-return", label: "Bulk Return" },
      ],
    },
    clientUser && {
      type: "dropdown",
      key: "products",
      label: "Products",
      children: [
        { to: "/product", label: "All Products" },
        { to: "/category", label: "Category" },
        { to: "/units", label: "Units" },
      ],
    },
    {
      type: "dropdown",
      key: "contact",
      label: "Contact",
      children: [
        { to: "/customers", label: "Customers" },
        { to: "/company", label: "Company" },
        { to: "/routes", label: "Route" },
      ],
    },
    {
      type: "dropdown",
      key: "inventory",
      label: "Inventory",
      children: [
        { to: "/free-products", label: "Free Products" },
        { to: "/damage-products", label: "Damage Products" },
        { to: "/stock-item", label: "Stock Item" },
        { to: "/stock-alert", label: "Stock Alert" },
        { to: "/stock-list", label: "All Stock" },
      ],
    },
   {
      type: "dropdown",
      key: "account",
      label: "Account",
      children: [
        { to: "/account-balance", label: "Account Balance" },
        { to: "/opening-investment", label: "Opening Investment" },
        { to: "/income", label: "Income" },
        { to: "/expense", label: "Expense" },
        { to: "/route-expense", label: "Route Expense" },
        { to: "/transfer", label: "Transfer" },
        { to: "/account-heads", label: "Account Heads" },
      ],
    },
    {
      type: "dropdown",
      key: "report",
      label: "Report",
      children: [

      ],
    },
    {
      type: "dropdown",
      key: "users",
      label: "Users",
      children: [
        { to: "/user", label: "All User" },
        { to: "/user-role", label: "All Role" },
      ],
    },
    {
      type: "dropdown",
      key: "billing",
      label: "Payment & Billing",
      children: [
       
      ],
    },
    {
      type: "dropdown",
      key: "settings",
      label: "Settings",
      children: [
        { to: "/features", label: "Features" },

      ],
    },
  ].filter(Boolean); // কোনো ভ্যালু ফলসি হলে ফিল্টার করে বাদ দিবে

  useEffect(() => {
    if (drawerOpen) {
      const timeouts = [];
      for (let i = 0; i < menuItems.length; i++) {
        const timeout = setTimeout(() => {
          setAnimatedItems((prev) => [...prev, i]);
        }, baseDelay * i);
        timeouts.push(timeout);
      }
      return () => timeouts.forEach(clearTimeout);
    } else {
      setAnimatedItems([]);
      setOpenDropdowns({}); // ড্রয়ার বন্ধ হলে সব ড্রপডাউনও বন্ধ হবে
    }
  }, [drawerOpen, clientUser]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 pointer-events-none transition-all duration-300 ${drawerOpen ? "bg-slate-900/25 pointer-events-auto" : "bg-transparent"
        } ${scrolled ? "top-0" : "top-[65px] lg:top-[73px]"}`}
      onClick={() => setDrawerOpen(false)}
    >
      <div
        ref={drawerPanelRef}
        className={`absolute left-0 top-0 w-64 max-w-[80vw] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-in-out pointer-events-auto ${drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{ height: drawerHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ড্রয়ার হেডার — gradient banner */}
        <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-white/95 flex items-center justify-center overflow-hidden">
              <img src={fav} alt="Favicon" className="h-5 w-5 object-cover rounded-sm" />
            </div>
            <span className="font-semibold text-[14px] text-white tracking-tight">Menu</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/15 rounded-md transition-colors"
          >
            <FaTimes className="text-[13px]" />
          </button>
        </div>

        {/* ড্রয়ারের বডি / ডায়নামিক লিংকসমূহ */}
        <div className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isAnimated = animatedItems.includes(index);
            const theme = colorMap[item.key] || colorMap.settings;
            const Icon = theme.icon;

            return (
              <div
                key={index}
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? 'translateX(0)' : 'translateX(-10px)',
                  transition: 'opacity 0.25s ease, transform 0.25s ease'
                }}
              >
                {item.type === "link" ? (
                  <NavLink
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `relative flex items-center gap-2.5 text-[14.5px] font-medium pl-2.5 pr-3 py-2 rounded-md transition-colors before:content-[''] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[3px] before:rounded-full ${isActive ? theme.active : "text-slate-600 hover:bg-slate-50 before:bg-transparent"
                      }`
                    }
                  >
                    <span className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[12px] ${theme.iconWrap}`}>
                      <Icon />
                    </span>
                    {item.label}
                  </NavLink>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.key)}
                      className="w-full flex items-center justify-between pl-2.5 pr-3 py-2 rounded-md text-slate-600 hover:bg-slate-50 transition-colors group"
                    >
                      <span className="flex items-center gap-2.5 text-[14.5px] font-medium">
                        <span className={`h-6 w-6 shrink-0 rounded-md flex items-center justify-center text-[12px] ${theme.iconWrap}`}>
                          <Icon />
                        </span>
                        {item.label}
                      </span>
                      <FaChevronDown
                        className={`text-[10px] transition-transform duration-200 ease-in-out ${openDropdowns[item.key] ? `rotate-180 ${theme.chevronOpen}` : "text-slate-400 group-hover:text-slate-500"
                          }`}
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-200 ease-in-out overflow-hidden pl-[34px] ${openDropdowns[item.key] ? "grid-rows-[1fr] opacity-100 mt-0.5 mb-1" : "grid-rows-[0fr] opacity-0"
                        }`}
                    >
                      <div className="overflow-hidden space-y-0.5 border-l border-slate-200 pl-3">
                        {item.children.map((child, cIndex) => (
                          <NavLink
                            key={cIndex}
                            to={child.to}
                            onClick={() => setDrawerOpen(false)}
                            className={({ isActive }) =>
                              `block text-[13.5px] font-medium px-2.5 py-1.5 rounded-md transition-colors ${isActive ? theme.childActive : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ড্রয়ার ফুটার */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-center text-[10.5px] text-slate-400">
          Squirrel Peace &copy; 2026
        </div>
      </div>
    </div>
  );
};

export default Drawer;