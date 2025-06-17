import { useQuery } from '@tanstack/react-query';
import { LuMessageCircleX } from "react-icons/lu";
import useAuth from "../../Layout/useAuth";
import useAxiosSecure from "../../../hooks/useAxiosSecure";
import { FaUsers } from 'react-icons/fa6';
import Swal from 'sweetalert2';
import { createRoot } from 'react-dom/client';
import React from 'react';
import Loader from "../../../Components/Loader";
import { Helmet } from 'react-helmet';

const Users = () => {
    const { user } = useAuth();
    const axiosSecure = useAxiosSecure();
    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

    const { data: users = [], isLoading, error, refetch } = useQuery({
        queryKey: ['users'],
        queryFn: async () => {
            const res = await axiosSecure.get('/users');
            return res.data;
        }
    });

    const renderPasswordInput = (callback) => {
        const wrapper = document.createElement('div');
        let password = '';

        const root = createRoot(wrapper);
        root.render(
            <div>
                <input
                    type="password"
                    placeholder="Enter your password"
                    onChange={(e) => password = e.target.value}
                    autoComplete="off"
                    name="admin-password"
                    className="w-full px-4 py-2 mt-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                />
            </div>
        );

        Swal.fire({
            title: 'Enter Admin Password',
            html: wrapper,
            showCancelButton: true,
            focusConfirm: false,
            confirmButtonText: '<span class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">OK</span>',
            cancelButtonText: '<span class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">Cancel</span>',
            preConfirm: () => password
        }).then(callback);
    };

    const handleMakeAdmin = (user) => {
        renderPasswordInput(async (result) => {
            if (result.isConfirmed && result.value === ADMIN_PASSWORD) {
                const confirm = await Swal.fire({
                    title: `Are you sure?`,
                    text: `You are about to make ${user.name} an admin.`,
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Yes, make admin'
                });

                if (confirm.isConfirmed) {
                    axiosSecure.patch(`/users/admin/${user._id}`).then(res => {
                        if (res.data.modifiedCount > 0) {
                            refetch();
                            Swal.fire({
                                position: "top-end",
                                icon: "success",
                                title: `${user.name} is now an Admin!`,
                                showConfirmButton: false,
                                timer: 1500
                            });
                        }
                    });
                }
            } else if (result.isConfirmed) {
                Swal.fire('Incorrect Password', 'You entered the wrong password.', 'error');
            }
        });
    };

    const handleDeleteUser = (id, name, email) => {
        const proceedDelete = () => {
            axiosSecure.delete(`/users/${id}`)
                .then(() => {
                    Swal.fire({
                        position: "top-end",
                        icon: "success",
                        title: `${name} has been deleted.`,
                        showConfirmButton: false,
                        timer: 1500
                    });
                    refetch();
                })
                .catch(() => {
                    Swal.fire('Error!', 'Something went wrong.', 'error');
                });
        };

        const confirmDelete = () => {
            Swal.fire({
                title: 'Are you sure?',
                text: `Do you want to delete ${name}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#e53935',
                cancelButtonColor: '#9e9e9e',
                confirmButtonText: 'Yes, delete it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    proceedDelete();
                }
            });
        };

        if (email === 'shahreartamim777@gmail.com') {
            renderPasswordInput((result) => {
                if (result.isConfirmed && result.value === ADMIN_PASSWORD) {
                    confirmDelete();
                } else if (result.isConfirmed) {
                    Swal.fire('Incorrect Password', 'You entered the wrong password.', 'error');
                }
            });
        } else {
            confirmDelete();
        }
    };

    if (isLoading) return <Loader />;

    // 👇 error হলে fallback
    if (error) return <p className="text-center mt-10 text-red-600">Failed to load users.</p>;

    return (
        <div className="my-10 max-w-screen-xl mx-auto">
            <Helmet>
                <title>Users - Storial Peace</title>
            </Helmet>
            <div className="text-center space-y-3 mb-8">
                <h1 className="text-3xl font-bold">
                    Welcome <i className="text-[#2acb35]">{user?.displayName || "Admin"}</i> To The Users Administration Panel
                </h1>
                <p className="text-lg text-gray-700 font-medium">
                    Here is the list of all users who have registered on the website.
                </p>
            </div>

            <div className="flex justify-between items-center mb-5 px-2">
                <p className="text-xl font-bold text-gray-700">
                    Total Users: <span className='text-[#2acb35]'>{users.length}</span>
                </p>
            </div>

            <div className="overflow-x-auto shadow-md rounded-lg">
                <table className="table-auto w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-[#2acb35] text-white text-xl">
                            <th className="py-3 px-4">#</th>
                            <th className="py-3 px-4">Name</th>
                            <th className="py-3 px-4">Email</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user, index) => (
                            <tr key={user._id} className="odd:bg-white even:bg-gray-100 transition-all duration-200">
                                <td className="py-4 px-4 font-semibold text-gray-700">{index + 1}</td>
                                <td className="py-4 px-4 text-lg font-bold text-gray-800">{user.name}</td>
                                <td className="py-4 px-4 text-lg text-gray-700">{user.email}</td>
                                <td className="py-4 px-4">
                                    {user.role === 'admin' ? 'Admin' : (
                                        <button
                                            onClick={() => handleMakeAdmin(user)}
                                            className="btn bg-orange-500 text-white px-2 py-1 rounded-lg"
                                        >
                                            <FaUsers className="text-xl" />
                                        </button>
                                    )}
                                </td>
                                <td className="py-4 px-4 text-center">
                                    <button
                                        onClick={() => handleDeleteUser(user._id, user.name, user.email)}
                                        className="btn bg-[#e53935] hover:bg-[#d32f2f] text-white p-2 rounded-full"
                                    >
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
