import { NavLink } from "react-router-dom";
import { FaHome, FaBars, FaTimes, FaPlus, FaUser } from "react-icons/fa";
import { canAccessPath } from "../../../../hooks/permissionConfig";

const MobileBottomNav = ({ clientUser, drawerOpen, setDrawerOpen }) => {
  const perms = clientUser?.permissions;
  const isStaff = !!clientUser?.isStaff;
  const canDash = !isStaff || canAccessPath(perms, "/dashboard");
  const canOrder = !isStaff || canAccessPath(perms, "/create-order");

  const tabCls = (active) =>
    `flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] text-[11px] font-semibold transition active:scale-95 ${active ? "text-brand-700" : "text-slate-500"
    }`;
  const iconWrap = (active) =>
    `h-8 w-12 rounded-full flex items-center justify-center transition ${active ? "bg-brand-100" : ""
    }`;

  return (
    <>
      <style>{`@media (max-width:1023px){body{padding-bottom:calc(68px + env(safe-area-inset-bottom,0px))}}`}</style>
      <nav
        aria-label="Bottom navigation"
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden print:hidden bg-white border-t border-slate-200 shadow-[0_-4px_16px_rgba(74,88,230,0.12)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-end justify-around max-w-md mx-auto px-2">
          {canDash && (
            <NavLink
              to="/dashboard"
              onClick={() => setDrawerOpen(false)}
              className={({ isActive }) => tabCls(isActive && !drawerOpen)}
            >
              {({ isActive }) => (
                <>
                  <span className={iconWrap(isActive && !drawerOpen)}>
                    <FaHome className="text-[17px]" />
                  </span>
                  Home
                </>
              )}
            </NavLink>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label={drawerOpen ? "Close Menu" : "Open Menu"}
            aria-expanded={drawerOpen}
            className={`drawer-toggle-btn !bg-none !bg-transparent !shadow-none !rounded-none !px-0 ${tabCls(drawerOpen)}`}
            style={{ background: "transparent", boxShadow: "none" }}
          >
            <span className={iconWrap(drawerOpen)}>
              {drawerOpen ? <FaTimes className="text-[17px]" /> : <FaBars className="text-[17px]" />}
            </span>
            Menu
          </button>

          {canOrder && (
            <NavLink
              to="/create-order"
              onClick={() => setDrawerOpen(false)}
              aria-label="Create Order"
              className="flex-1 flex flex-col items-center justify-end min-h-[56px] pb-1 text-[11px] font-semibold text-slate-500"
            >
              <span className="-mt-7 h-14 w-14 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg ring-4 ring-white">
                <FaPlus className="text-lg" />
              </span>
              Order
            </NavLink>
          )}

          <NavLink
            to="/client-profile"
            onClick={() => setDrawerOpen(false)}
            className={({ isActive }) => tabCls(isActive && !drawerOpen)}
          >
            {({ isActive }) => (
              <>
                <span className={iconWrap(isActive && !drawerOpen)}>
                  <FaUser className="text-[16px]" />
                </span>
                Profile
              </>
            )}
          </NavLink>
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;