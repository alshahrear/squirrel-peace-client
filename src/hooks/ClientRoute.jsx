import { Navigate, useLocation } from "react-router-dom";
import { useClientAuth } from "./ClientAuthContext";
import Loader from './Loader';
import { canAccessPath, firstAllowedPath, hasAction } from "./permissionConfig";

const ClientRoute = ({ children }) => {
    const { clientUser, isChecking, clientLogout } = useClientAuth();
    const location = useLocation();

    // ডাটা চেক হওয়া পর্যন্ত লোডার দেখাবে, রিডাইরেক্ট করবে না
    if (isChecking) {
        return <Loader />;
    }

    if (!clientUser) {
        return <Navigate to="/login-client" replace />;
    }

    // user limit ছাড়িয়ে গেলে: dealer সব পেজ থেকে /user এ যাবে, staff বার্তা দেখবে
    if (clientUser.limitExceeded) {
        if (clientUser.isStaff) {
            return (
                <div className="min-h-[60vh] flex items-center justify-center p-6">
                    <div className="bg-white rounded-3xl shadow-xl border border-rose-100 p-8 max-w-md text-center space-y-4">
                        <h3 className="text-xl font-extrabold text-rose-600">⚠️ Software এখন বন্ধ</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            আপনার ডিলারের user limit পূর্ণ হয়ে গেছে। ডিলার কিছু user delete না করা পর্যন্ত software ব্যবহার করা যাবে না। ডিলারকে জানান।
                        </p>
                        <button
                            onClick={clientLogout}
                            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold cursor-pointer"
                        >
                            Log Out
                        </button>
                    </div>
                </div>
            );
        }
        if (location.pathname !== '/user') {
            return <Navigate to="/user" replace />;
        }
    }

    // staff (SR / Manager / Delivery Man) এর permission না থাকলে অনুমতি পাওয়া প্রথম পেজে পাঠাবে
    // purchase_all এ Edit থাকলে purchase_add এর View ছাড়াই /add-purchase (edit / receive) এ ঢুকতে দেবে
    const canEditPurchase =
        location.pathname.startsWith('/add-purchase') &&
        hasAction(clientUser.permissions, 'purchase_all', 'put');
    // /create-order কে edit / delivery / damage / bulkReturn mode এ খুলতে নিজ নিজ module এর Edit permission লাগবে
    const st = location.state;
    const perms = clientUser.permissions;
    const canOpenOrderMode =
        location.pathname.startsWith('/create-order') &&
        !!st?.order &&
        ((st.mode === 'damage' && hasAction(perms, 'damage_stock_invoice', 'put')) ||
            (st.mode === 'bulkReturn' && hasAction(perms, 'sales_bulk_return', 'put')) ||
            ((!st.mode || st.mode === 'delivery') && hasAction(perms, 'wholesale', 'put')));
    if (clientUser.isStaff && !canEditPurchase && !canOpenOrderMode && !canAccessPath(clientUser.permissions, location.pathname)) {
        return <Navigate to={firstAllowedPath(clientUser.permissions)} replace />;
    }

    return children;
};

export default ClientRoute;