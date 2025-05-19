import { useEffect, useState } from "react";
import { LuMessageCircleX } from "react-icons/lu";
import useAuth from "../../Layout/useAuth";

const Users = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetch("/api/users") // এখানে তোমার API route অনুযায়ী ঠিক করে নিও
            .then(res => res.json())
            .then(data => setUsers(data))
            .catch(error => console.error("Failed to fetch users:", error));
    }, []);

    return (
        <div className="my-10 max-w-screen-xl mx-auto">
            <div className="text-center space-y-3 mb-8">
                <h1 className="text-3xl font-bold">
                    Welcome <i className="text-[#2acb35]">{user?.displayName || "Admin"}</i> To The Users Administration Panel
                </h1>
                <p className="text-lg text-gray-700 font-medium">
                    Here is the list of all users who have registered on the website.
                </p>
                
            </div>

            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="table-auto w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#2acb35] text-white text-xl">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Join Date</th>
                            <th className="py-3 px-4 text-center">Check</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr
                                key={user._id || index}
                                className="odd:bg-white even:bg-gray-100 transition-all duration-200"
                            >
                                <td className="py-4 px-4 font-semibold text-gray-700">{index + 1}</td>
                                <td className="py-4 px-4 text-lg font-bold text-gray-800">{user.name}</td>
                                <td className="py-4 px-4 text-lg text-gray-700">{user.email}</td>
                                <td className="py-4 px-4 text-lg text-gray-700">
                                    {new Date(user.createdAt).toLocaleDateString("en-US", {
                                        weekday: "short",
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                    })}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <button className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full">
                                        <LuMessageCircleX className="text-2xl" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Users;
