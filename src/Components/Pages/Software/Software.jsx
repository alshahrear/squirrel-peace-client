import { NavLink } from "react-router-dom";
import useAuth from "../../Layout/useAuth";
import useAxiosPublic from "../../../hooks/useAxiosPublic";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";

const Software = () => {
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
                <title>Software - Squirrel Peace</title>
            </Helmet>
            <div className="text-center space-y-3 mb-10">
                <h1 className="text-3xl font-bold">
                    Welcome <span className="text-[#2acb35]"></span> to the Software Administration Panel
                </h1>
                
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 text-center justify-center gap-y-10 gap-x-4">

               
                <NavLink to="/dashboard">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                               Dashboard
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
                <NavLink to="/client">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Client
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
                <NavLink to="/login-client">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                               Login Client
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
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
                <NavLink to="/customerAdmin">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Order Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
                <NavLink to="/customerData">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Customer Data
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
                <NavLink to="/productSales">
                    <div className="indicator mt-5">
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                                Product Sales
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>            
                <NavLink to="/pdfProducts">
                    <div className="indicator mt-5">
                        <span className="indicator-item badge bg-red-500 text-white border-0 rounded-full">
                            {contacts.length}
                        </span>
                        <button className="relative overflow-hidden px-5 py-2 text-white font-semibold bg-[#2acb35] border-2 border-[#2acb35] rounded-md transition-colors duration-300 group">
                            <span className="relative z-10 group-hover:text-[#404040] hover:scale-105">
                               pdf products Admin
                            </span>
                            <span className="absolute left-0 top-0 h-full w-0 bg-white transition-all duration-500 ease-out group-hover:w-full z-0"></span>
                        </button>
                    </div>
                </NavLink>
            </div>

        </div>
    );
};

export default Software;
