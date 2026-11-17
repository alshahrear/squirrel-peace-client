import { useQuery } from '@tanstack/react-query';
import { LuTrash2, LuShieldCheck, LuShieldOff } from "react-icons/lu";
import useAuth from "./useAuth";
import useAxiosSecure from "./useAxiosSecure";
import Swal from 'sweetalert2';
import { createRoot } from 'react-dom/client';
import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { Helmet } from 'react-helmet';

const PasswordField = ({ onChange }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        placeholder="Enter your password"
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
        name="admin-password"
        className="w-full h-11 pl-3 pr-11 mt-2 text-base rounded-xl border border-slate-300 bg-white outline-none focus:border-[#4a58e6] focus:ring-2 focus:ring-[#e0e6ff]"
        required
      />
      <button
        type="button"
        aria-label={show ? "Hide password" : "Show password"}
        className="absolute right-0 top-2 w-11 h-11 flex items-center justify-center bg-transparent border-0 p-0 text-lg text-slate-400 hover:text-[#4a58e6] transition"
        onClick={() => setShow(!show)}
      >
        {show ? <FaEyeSlash /> : <FaEye />}
      </button>
    </div>
  );
};

const RoleBadge = ({ role }) =>
  role === 'admin' ? (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700">Admin</span>
  ) : (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">User</span>
  );

const Users = () => {
  const { user } = useAuth();
  const axiosSecure = useAxiosSecure();

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
      <PasswordField onChange={(v) => { password = v; }} />
    );

    Swal.fire({
      title: 'Enter Admin Password',
      html: wrapper,
      showCancelButton: true,
      focusConfirm: false,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#4a58e6',
      cancelButtonColor: '#94a3b8',
      preConfirm: async () => {
        if (!password) {
          Swal.showValidationMessage('Please enter the password');
          return false;
        }
        try {
          const res = await axiosSecure.post('/users/verify-admin-password', { password });
          return res.data.actionToken;
        } catch (err) {
          Swal.showValidationMessage(err?.response?.data?.message || 'Incorrect password');
          return false;
        }
      },
      didClose: () => setTimeout(() => root.unmount(), 0)
    }).then(callback);
  };

  const authHeader = (token) => ({ headers: { 'x-action-token': token } });

  const handleMakeAdmin = (targetUser) => {
    renderPasswordInput(async (result) => {
      if (!result.isConfirmed || !result.value) return;
      const actionToken = result.value;

      const confirm = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to make ${targetUser.name} an admin.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4a58e6',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, make admin'
      });
      if (!confirm.isConfirmed) return;

      try {
        const res = await axiosSecure.patch(`/users/admin/${targetUser._id}`, {}, authHeader(actionToken));
        if (res.data.modifiedCount > 0) {
          refetch();
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: `${targetUser.name} is now an Admin!`,
            showConfirmButton: false,
            timer: 1500
          });
        }
      } catch {
        Swal.fire('Error!', 'Verification expired or failed. Please try again.', 'error');
      }
    });
  };

  const handleRemoveAdmin = (targetUser) => {
    renderPasswordInput(async (result) => {
      if (!result.isConfirmed || !result.value) return;
      const actionToken = result.value;

      const confirm = await Swal.fire({
        title: 'Are you sure?',
        text: `You are about to remove admin role from ${targetUser.name}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#4a58e6',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, remove admin'
      });
      if (!confirm.isConfirmed) return;

      try {
        const res = await axiosSecure.patch(`/users/remove-admin/${targetUser._id}`, {}, authHeader(actionToken));
        if (res.data.modifiedCount > 0) {
          refetch();
          Swal.fire({
            position: 'top-end',
            icon: 'success',
            title: `${targetUser.name} is no longer an Admin!`,
            showConfirmButton: false,
            timer: 1500
          });
        }
      } catch {
        Swal.fire('Error!', 'Verification expired or failed. Please try again.', 'error');
      }
    });
  };

  const handleDeleteUser = (id, name, email, role) => {
    const proceedDelete = async (actionToken) => {
      try {
        await axiosSecure.delete(`/users/${id}`, actionToken ? authHeader(actionToken) : undefined);
        Swal.fire({
          position: 'top-end',
          icon: 'success',
          title: `${name} has been deleted.`,
          showConfirmButton: false,
          timer: 1500
        });
        refetch();
      } catch {
        Swal.fire('Error!', 'Verification expired or something went wrong.', 'error');
      }
    };

    const confirmDelete = async (actionToken) => {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete ${name}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e11d48',
        cancelButtonColor: '#94a3b8',
        confirmButtonText: 'Yes, delete it!'
      });
      if (result.isConfirmed) proceedDelete(actionToken);
    };

    // admin hole age password, tarpor Are you sure
    if (role === 'admin') {
      renderPasswordInput((result) => {
        if (result.isConfirmed && result.value) confirmDelete(result.value);
      });
    } else {
      confirmDelete();
    }
  };

  const RoleButton = ({ u }) =>
    u.role === 'admin' ? (
      <button
        type="button"
        onClick={() => handleRemoveAdmin(u)}
        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-full border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold transition"
      >
        <LuShieldOff className="text-base" /> Remove Admin
      </button>
    ) : (
      <button
        type="button"
        onClick={() => handleMakeAdmin(u)}
        className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-3 rounded-full border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-semibold transition"
      >
        <LuShieldCheck className="text-base" /> Make Admin
      </button>
    );

  const DeleteButton = ({ u }) => (
    <button
      type="button"
      aria-label={`Delete ${u.name}`}
      onClick={() => handleDeleteUser(u._id, u.name, u.email, u.role)}
      className="w-10 h-10 inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition"
    >
      <LuTrash2 className="text-lg" />
    </button>
  );

  return (
    <div className="min-h-screen p-3 sm:p-5 md:p-8">
      <Helmet>
        <title>Users - Bashay Bazar</title>
      </Helmet>

      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Users Administration</h1>
            <p className="text-sm text-slate-500 mt-0.5">{user?.displayName || "Admin"}</p>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600">
            Total Users
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700">{users.length}</span>
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3 animate-pulse">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-2xl bg-white/70 border border-slate-200" />
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-rose-200 p-6 text-center text-sm font-medium text-rose-600">
            Failed to load users.
          </div>
        ) : users.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-sm text-slate-400">
            No users found.
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <div className="md:hidden space-y-3">
              {users.map((u, index) => (
                <div key={u._id} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 font-semibold">#{index + 1}</p>
                      <p className="font-bold text-slate-800 break-words">{u.name}</p>
                      <p className="text-sm text-slate-500 break-all">{u.email}</p>
                    </div>
                    <RoleBadge role={u.role} />
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
                    <RoleButton u={u} />
                    <DeleteButton u={u} />
                  </div>
                </div>
              ))}
            </div>

            {/* md+: table */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[640px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u, index) => (
                    <tr key={u._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-semibold text-slate-400">{index + 1}</td>
                      <td className="py-3 px-4 font-bold text-slate-800">{u.name}</td>
                      <td className="py-3 px-4 text-slate-600 break-all">{u.email}</td>
                      <td className="py-3 px-4"><RoleBadge role={u.role} /></td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <RoleButton u={u} />
                          <DeleteButton u={u} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Users;