import { NavLink } from "react-router-dom";
import useAuth from "../../Layout/useAuth";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";

const AdminPages = () => {
    const { user } = useAuth();
    const axiosPublic = useAxiosPublic();

    
    const { data: contacts = [] } = useQuery({
        queryKey: ["contacts"],
        queryFn: async () => {
            const res = await axiosPublic.get("/contact");
            return res.data;
        },
        refetchInterval: 5000,
    });
    
    const { data: users = [] } = useQuery({
        queryKey: ["users"],
        queryFn: async () => {
            const res = await axiosPublic.get("/users");
            return res.data;
        },
        refetchInterval: 5000,
    });


    return (
        <div className="py-10 max-w-screen-xl mx-auto px-4">
            <Helmet>
                <title>AdminPanel - Squirrel Peace</title>
            </Helmet>
            <div className="text-center space-y-3 mb-10">
                <h1 className="text-3xl font-bold">
                    Welcome <span className="text-[#2acb35]">{user.displayName}</span> to the Main Administration Panel
                </h1>
                <p className="max-w-5xl mx-auto">
                    You are now at the control center of the dashboard. From here, you can easily manage all essential content, user activity, and website updates. Please handle everything responsibly to ensure our platform remains at its best.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 text-center justify-center gap-y-10 gap-x-4">

                <NavLink to="/receipt">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Receipt
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
                
                <NavLink to="/users">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                            {users.length}
                        </span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Users Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>

                <NavLink to="/contactAdmin">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                            {contacts.length}
                        </span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Contact Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
    
            </div>

        </div>
    );
};

export default AdminPages;
