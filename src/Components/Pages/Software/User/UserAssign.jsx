import React, { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import { FaUserShield, FaSearch, FaSave, FaCheckDouble, FaEraser, FaUsers } from "react-icons/fa";
import useAxiosClient from "../../../../hooks/useAxiosClient";
import { ACTIONS, PERMISSION_GROUPS, ALL_MODULES } from "../../../../hooks/permissionConfig";

const ACTION_KEYS = ACTIONS.map((a) => a.key);

const snap = (p) =>
    JSON.stringify(
        ALL_MODULES.map((m) => [m.key, ACTION_KEYS.filter((a) => (p[m.key] || []).includes(a))]).filter((x) => x[1].length)
    );

const TriCheck = ({ checked, indeterminate, onChange, disabled, title }) => {
    const ref = useRef(null);
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = !!indeterminate && !checked;
    }, [indeterminate, checked]);
    return (
        <input
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            title={title}
            className="h-4 w-4 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
        />
    );
};

const UserAssign = () => {
    const axiosClient = useAxiosClient();
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [userSearch, setUserSearch] = useState("");
    const [selected, setSelected] = useState(null);
    const [perms, setPerms] = useState({});
    const [original, setOriginal] = useState(snap({}));
    const [loadingPerm, setLoadingPerm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pageSearch, setPageSearch] = useState("");
    const reqRef = useRef(0);

    const dirty = selected ? snap(perms) !== original : false;

    useEffect(() => {
        (async () => {
            try {
                const res = await axiosClient.get("/user");
                setUsers(Array.isArray(res.data) ? [...res.data].reverse() : []);
            } catch (e) {
                toast.error("Failed to load users");
            } finally {
                setLoadingUsers(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const warn = (e) => {
            if (!dirty) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);

    const filteredUsers = useMemo(() => {
        const s = userSearch.trim().toLowerCase();
        if (!s) return users;
        return users.filter(
            (u) =>
                u.name?.toLowerCase().includes(s) ||
                u.email?.toLowerCase().includes(s) ||
                u.phone?.toLowerCase().includes(s) ||
                u.role?.toLowerCase().includes(s)
        );
    }, [users, userSearch]);

    const selectUser = async (u) => {
        if (selected?._id === u._id) return;
        if (dirty) {
            const r = await Swal.fire({
                title: "Unsaved changes",
                text: "You have unsaved changes. Discard them and switch user?",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#4f46e5",
                cancelButtonColor: "#f43f5e",
                confirmButtonText: "Discard & switch",
            });
            if (!r.isConfirmed) return;
        }
        const id = ++reqRef.current;
        setSelected(u);
        setPerms({});
        setOriginal(snap({}));
        setLoadingPerm(true);
        try {
            const res = await axiosClient.get(`/user-permission/${u._id}`);
            if (id !== reqRef.current) return;
            const p = res.data?.permissions || {};
            setPerms(p);
            setOriginal(snap(p));
        } catch (e) {
            if (id === reqRef.current) {
                toast.error(e?.response?.data?.message || "Failed to load permissions");
                setSelected(null);
            }
        } finally {
            if (id === reqRef.current) setLoadingPerm(false);
        }
    };

    const setModule = (key, acts) =>
        setPerms((prev) => {
            const next = { ...prev };
            if (!acts || acts.length === 0) delete next[key];
            else next[key] = ACTION_KEYS.filter((a) => acts.includes(a));
            return next;
        });

    const isFull = (key) => (perms[key] || []).length === ACTION_KEYS.length;

    const toggleFull = (key) => setModule(key, isFull(key) ? [] : ACTION_KEYS);

    const toggleAction = (key, action) => {
        const cur = new Set(perms[key] || []);
        if (cur.has(action)) {
            if (action === "get") cur.clear(); // View বন্ধ করলে বাকি সব বন্ধ
            else cur.delete(action);
        } else {
            cur.add(action);
            cur.add("get"); // Add/Edit/Delete দিলে View নিজে থেকে চালু
        }
        setModule(key, [...cur]);
    };

    const toggleGroup = (mods) => {
        const all = mods.every((m) => isFull(m.key));
        setPerms((prev) => {
            const next = { ...prev };
            mods.forEach((m) => {
                if (all) delete next[m.key];
                else next[m.key] = [...ACTION_KEYS];
            });
            return next;
        });
    };

    const setAll = (on) => {
        const next = {};
        if (on) ALL_MODULES.forEach((m) => (next[m.key] = [...ACTION_KEYS]));
        setPerms(next);
    };

    const handleSave = async () => {
        if (!selected || saving) return;
        setSaving(true);
        try {
            const res = await axiosClient.put(`/user-permission/${selected._id}`, { permissions: perms });
            const saved = res.data?.permissions || perms;
            setPerms(saved);
            setOriginal(snap(saved));
            setUsers((prev) => prev.map((u) => (u._id === selected._id ? { ...u, permissions: saved } : u)));
            toast.success("Permissions saved successfully!");
        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to save permissions");
        } finally {
            setSaving(false);
        }
    };

    const assignedCount = Object.keys(perms).length;

    const visibleGroups = PERMISSION_GROUPS.map((g) => {
        const s = pageSearch.trim().toLowerCase();
        const mods = s
            ? g.modules.filter((m) => m.label.toLowerCase().includes(s) || g.label.toLowerCase().includes(s))
            : g.modules;
        return { ...g, mods };
    }).filter((g) => g.mods.length > 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-6 border border-white flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-r from-indigo-600 to-pink-600 text-white rounded-2xl shadow-lg shadow-indigo-200">
                        <FaUserShield size={22} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
                            User Assign
                        </h2>
                        <p className="text-gray-500 text-sm mt-0.5">Select a user and choose which pages and actions they can access</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Users list */}
                    <div className="lg:col-span-4 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 border border-white space-y-4 h-fit">
                        <div className="flex items-center gap-2">
                            <FaUsers className="text-indigo-600" />
                            <h3 className="font-bold text-gray-800">Users</h3>
                            <span className="ml-auto px-2.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold rounded-full">
                                {users.length}
                            </span>
                        </div>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                <FaSearch size={13} />
                            </span>
                            <input
                                type="text"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                placeholder="Search user..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-gray-50/50"
                            />
                        </div>

                        <div className="max-h-[560px] overflow-y-auto space-y-2 pr-1">
                            {loadingUsers ? (
                                <p className="text-center text-sm text-gray-400 py-10">Loading users...</p>
                            ) : filteredUsers.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-10">No users found</p>
                            ) : (
                                filteredUsers.map((u) => {
                                    const active = selected?._id === u._id;
                                    const count = Object.keys(u.permissions || {}).length;
                                    return (
                                        <button
                                            key={u._id}
                                            type="button"
                                            onClick={() => selectUser(u)}
                                            className={`w-full text-left px-3.5 py-3 rounded-2xl border transition cursor-pointer ${active
                                                ? "bg-gradient-to-r from-indigo-600 to-pink-600 text-white border-transparent shadow-lg shadow-indigo-200"
                                                : "bg-white hover:bg-indigo-50 border-gray-100 text-gray-800"
                                                }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-bold text-sm truncate">{u.name}</span>
                                                <span
                                                    className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? "bg-white/25 text-white" : "bg-purple-100 text-purple-700"
                                                        }`}
                                                >
                                                    {u.role}
                                                </span>
                                            </div>
                                            <div className={`text-[11px] mt-1 truncate ${active ? "text-indigo-100" : "text-gray-500"}`}>{u.email}</div>
                                            <div className={`text-[11px] mt-1 flex items-center gap-2 ${active ? "text-indigo-100" : "text-gray-400"}`}>
                                                <span>{u.isActive ? "● Active" : "○ Inactive"}</span>
                                                <span>• {count} page{count === 1 ? "" : "s"} assigned</span>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Permissions */}
                    <div className="lg:col-span-8 bg-white/90 backdrop-blur-md rounded-3xl shadow-xl p-5 md:p-6 border border-white space-y-5">
                        {!selected ? (
                            <div className="text-center py-24 text-gray-400">
                                <FaUserShield size={40} className="mx-auto mb-3 text-indigo-200" />
                                <p className="font-semibold">Select a user from the list to assign access</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                    <div>
                                        <h3 className="text-xl font-extrabold text-gray-800">{selected.name}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {selected.email} • <span className="font-semibold text-purple-700">{selected.role}</span>
                                            {!selected.isActive && <span className="ml-2 text-rose-600 font-bold">(Inactive: cannot login)</span>}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 font-semibold text-xs rounded-full">
                                            {assignedCount} / {ALL_MODULES.length} pages
                                        </span>
                                        {dirty && (
                                            <span className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-700 font-semibold text-xs rounded-full">
                                                Unsaved
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative flex-1">
                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                                            <FaSearch size={13} />
                                        </span>
                                        <input
                                            type="text"
                                            value={pageSearch}
                                            onChange={(e) => setPageSearch(e.target.value)}
                                            placeholder="Search page..."
                                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-gray-50/50"
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setAll(true)}
                                        disabled={loadingPerm}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white text-xs font-bold transition cursor-pointer"
                                    >
                                        <FaCheckDouble /> Full Access
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setAll(false)}
                                        disabled={loadingPerm}
                                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition cursor-pointer"
                                    >
                                        <FaEraser /> Clear All
                                    </button>
                                </div>

                                {loadingPerm ? (
                                    <p className="text-center text-sm text-gray-400 py-16">Loading permissions...</p>
                                ) : (
                                    <div className="space-y-4">
                                        {visibleGroups.map((g) => {
                                            const groupFull = g.mods.every((m) => isFull(m.key));
                                            const groupSome = g.mods.some((m) => (perms[m.key] || []).length > 0);
                                            return (
                                                <div key={g.key} className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                                                    <div className="grid grid-cols-[1fr_repeat(4,52px)] sm:grid-cols-[1fr_repeat(4,64px)] items-center gap-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-pink-600 text-white">
                                                        <label className="flex items-center gap-2.5 text-sm font-bold cursor-pointer">
                                                            <TriCheck
                                                                checked={groupFull}
                                                                indeterminate={groupSome}
                                                                onChange={() => toggleGroup(g.mods)}
                                                                title="Select whole group"
                                                            />
                                                            {g.label}
                                                        </label>
                                                        {ACTIONS.map((a) => (
                                                            <span key={a.key} className="text-[10px] sm:text-[11px] font-bold uppercase text-center">
                                                                {a.label}
                                                            </span>
                                                        ))}
                                                    </div>

                                                    <div className="divide-y divide-gray-100">
                                                        {g.mods.map((m) => {
                                                            const cur = perms[m.key] || [];
                                                            return (
                                                                <div
                                                                    key={m.key}
                                                                    className={`grid grid-cols-[1fr_repeat(4,52px)] sm:grid-cols-[1fr_repeat(4,64px)] items-center gap-1 px-4 py-2.5 transition ${cur.length ? "bg-indigo-50/40" : "bg-white"}`}
                                                                >
                                                                    <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer min-w-0">
                                                                        <TriCheck
                                                                            checked={isFull(m.key)}
                                                                            indeterminate={cur.length > 0}
                                                                            onChange={() => toggleFull(m.key)}
                                                                            title="Full access to this page"
                                                                        />
                                                                        <span className="truncate" title={m.label}>{m.label}</span>
                                                                    </label>
                                                                    {ACTIONS.map((a) => (
                                                                        <div key={a.key} className="flex justify-center">
                                                                            <TriCheck
                                                                                checked={cur.includes(a.key)}
                                                                                onChange={() => toggleAction(m.key, a.key)}
                                                                                title={a.label}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {visibleGroups.length === 0 && (
                                            <p className="text-center text-sm text-gray-400 py-10">No page found</p>
                                        )}
                                    </div>
                                )}

                                <div className="flex justify-end pt-2">
                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving || loadingPerm || !dirty}
                                        className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-600 hover:from-indigo-700 hover:to-pink-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <FaSave /> {saving ? "Saving..." : "Save Permissions"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserAssign;