import { NavLink } from "react-router-dom";
import useAuth from "./useAuth";
import useAxiosSecure from "./useAxiosSecure";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { LuBriefcase, LuUsers, LuArrowRight } from "react-icons/lu";

const AdminPages = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();

    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await axiosSecure.get("/users");
            return res.data;
        },
        refetchInterval: 5000,
    });

    const cards = [
        { to: "/software", title: "Software", sub: "Dashboard, clients", icon: LuBriefcase, badge: null },
        { to: "/users", title: "Users Admin", sub: "Admin site users", icon: LuUsers, badge: users.length },
    ];

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <Helmet>
                <title>Admin Panel - Bashay Bazar</title>
            </Helmet>

            <div className="max-w-screen-xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Admin Panel</h1>
                    <p className="text-sm text-slate-500 mt-0.5">{user?.displayName || user?.email || "Admin"}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {cards.map((c) => {
                        const Icon = c.icon;
                        return (
                            <NavLink
                                key={c.to}
                                to={c.to}
                                className="group relative flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                            >
                                <span className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-2xl">
                                    <Icon />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block font-bold text-slate-800">{c.title}</span>
                                    <span className="block text-sm text-slate-500 truncate">{c.sub}</span>
                                </span>
                                {c.badge !== null && (
                                    <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">{c.badge}</span>
                                )}
                                <LuArrowRight className="text-slate-300 group-hover:text-brand-600 transition shrink-0" />
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AdminPages;