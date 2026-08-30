import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { FaTimes, FaChevronDown } from "react-icons/fa";
import fav from "../../../../assets/squirrelpeacelogo.png";

const Drawer = ({ drawerOpen, setDrawerOpen, scrolled, clientUser }) => {
  const [drawerHeight, setDrawerHeight] = useState("100%");
  const baseDelay = 80;
  const [animatedItems, setAnimatedItems] = useState([]);

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
    { type: "link", to: clientUser ? "/dashboard" : "/", label: clientUser ? "Dashboard" : "Home" },
    clientUser && {
      type: "dropdown",
      key: "products",
      label: "Products",
      children: [
       
        { to: "/productAll", label: "All Products" },
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
      key: "users",
      label: "Users",
      children: [
        { to: "/user", label: "All User" },
        { to: "/user-role", label: "All Role" },
       
      ],
    },
    // { type: "link", to: "/receipt", label: "Receipt" },
    

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
      className={`fixed inset-x-0 bottom-0 z-40 pointer-events-none transition-all duration-300 ${drawerOpen ? "bg-black/20 pointer-events-auto" : "bg-transparent"
        } ${scrolled ? "top-0" : "top-[65px] lg:top-[73px]"}`}
      onClick={() => setDrawerOpen(false)}
    >
      <div
        className={`absolute left-0 top-0 w-64 max-w-[80vw] bg-white shadow-2xl flex flex-col p-5 transition-transform duration-300 ease-in-out pointer-events-auto ${drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        style={{ height: drawerHeight }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ড্রয়ার হেডার */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <img src={fav} alt="Favicon" className="h-6 w-6 object-cover rounded-md" />
            <span className="font-bold text-base text-gray-800">Menu</span>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-full transition"
          >
            <FaTimes className="text-lg" />
          </button>
        </div>

        {/* ড্রয়ারের বডি / ডায়নামিক লিংকসমূহ */}
        <div className="flex-1 py-4 space-y-2 overflow-y-auto">
          {menuItems.map((item, index) => {
            const isAnimated = animatedItems.includes(index);

            return (
              <div
                key={index}
                style={{
                  opacity: isAnimated ? 1 : 0,
                  transform: isAnimated ? 'translateX(0)' : 'translateX(-20px)',
                  transition: 'opacity 0.3s ease, transform 0.3s ease'
                }}
              >
                {item.type === "link" ? (
                  <NavLink
                    to={item.to}
                    onClick={() => setDrawerOpen(false)}
                    className={({ isActive }) =>
                      `block text-base font-medium px-3 py-2.5 rounded-lg transition ${isActive ? "bg-green-50 text-[#2acb35]" : "text-gray-700 hover:bg-gray-100"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <div>
                    <button
                      onClick={() => toggleDropdown(item.key)}
                      className="w-full flex items-center justify-between text-base font-medium px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100 transition group"
                    >
                      <span className="group-hover:text-[#2acb35] transition-colors">{item.label}</span>
                      <FaChevronDown className={`text-xs transition-transform duration-300 ease-in-out ${openDropdowns[item.key] ? "rotate-180 text-[#2acb35]" : "text-gray-400"}`} />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out overflow-hidden pl-3 ml-3 border-l-2 border-[#2acb35]/40 ${openDropdowns[item.key] ? "grid-rows-[1fr] opacity-100 mt-1 space-y-1" : "grid-rows-[0fr] opacity-0 mt-0 space-y-0"
                        }`}
                    >
                      <div className="overflow-hidden space-y-1">
                        {item.children.map((child, cIndex) => (
                          <NavLink
                            key={cIndex}
                            to={child.to}
                            onClick={() => setDrawerOpen(false)}
                            className={({ isActive }) =>
                              `block text-sm font-medium px-3 py-2 rounded-md transition ${isActive ? "bg-green-50 text-[#2acb35]" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
        <div className="pt-3 border-t border-gray-200 text-center text-xs text-gray-500">
          Squirrel Peace &copy; 2026
        </div>
      </div>
    </div>
  );
};

export default Drawer;