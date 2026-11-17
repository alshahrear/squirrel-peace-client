import { NavLink } from "react-router-dom";
import { Helmet } from "react-helmet";
import { LuLayoutDashboard, LuUsers, LuLogIn, LuArrowRight } from "react-icons/lu";

const Software = () => {
    const cards = [
        { to: "/dashboard", title: "Dashboard", sub: "Software dashboard", icon: LuLayoutDashboard },
        { to: "/client", title: "Client", sub: "Dealers and their users", icon: LuUsers },
        { to: "/login-client", title: "Login Client", sub: "Dealer login page", icon: LuLogIn },
    ];

    return (
        <div className="min-h-screen p-3 sm:p-5 md:p-8">
            <Helmet>
                <title>Software - Bashay Bazar</title>
            </Helmet>

            <div className="max-w-screen-xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Software Administration</h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {cards.map((c) => {
                        const Icon = c.icon;
                        return (
                            <NavLink
                                key={c.to}
                                to={c.to}
                                className="group flex items-center gap-4 bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 transition hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300"
                            >
                                <span className="w-12 h-12 shrink-0 flex items-center justify-center rounded-xl bg-brand-50 text-brand-600 text-2xl">
                                    <Icon />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block font-bold text-slate-800">{c.title}</span>
                                    <span className="block text-sm text-slate-500 truncate">{c.sub}</span>
                                </span>
                                <LuArrowRight className="text-slate-300 group-hover:text-brand-600 transition shrink-0" />
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Software;