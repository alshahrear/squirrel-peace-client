import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaGlobe,
  FaToggleOn,
  FaArrowLeft,
  FaShieldAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaKey,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { useClientAuth } from "../../../../hooks/ClientAuthContext";

const InfoCard = ({ icon, label, children, iconBg = "bg-indigo-50 text-indigo-600" }) => (
  <div className="bg-white rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-all px-4 py-3.5 flex items-center gap-3">
    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 leading-none mb-1">{label}</p>
      <div className="text-sm font-semibold text-gray-800 break-words">{children}</div>
    </div>
  </div>
);

const NA = () => <span className="text-gray-400 italic font-normal">N/A</span>;

const ClientProfile = () => {
  const navigate = useNavigate();
  const { clientUser, clientLogout } = useClientAuth();
  const [profile, setProfile] = useState(clientUser || null);
  const [loading, setLoading] = useState(true);

  // ===== Change password =====
  const [showPwForm, setShowPwForm] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;

  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });

  const closePwForm = () => {
    setShowPwForm(false);
    setShowPw(false);
    setPw({ current: "", next: "", confirm: "" });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!pw.current || !pw.next || !pw.confirm) {
      Toast.fire({ icon: "error", title: "All fields are required!" });
      return;
    }
    if (!PASSWORD_RULE.test(pw.next)) {
      Toast.fire({ icon: "error", title: "Password must be 8-128 characters and include letters and numbers" });
      return;
    }
    if (pw.next !== pw.confirm) {
      Toast.fire({ icon: "error", title: "New password and confirm password do not match!" });
      return;
    }
    if (pw.current === pw.next) {
      Toast.fire({ icon: "error", title: "New password must be different from current password!" });
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("clientToken");
      const res = await fetch("http://localhost:5000/client/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pw.current,
          newPassword: pw.next,
          confirmPassword: pw.confirm,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        Toast.fire({ icon: "error", title: data.message || "Failed to update password!" });
        setSaving(false);
        return;
      }

      Toast.fire({ icon: "success", title: "Password updated! Please login with your new password." });
      setPw({ current: "", next: "", confirm: "" });
      await clientLogout();
      navigate("/login-client", { replace: true });
    } catch (error) {
      console.error("Change password error:", error);
      Toast.fire({ icon: "error", title: "Something went wrong. Try again!" });
      setSaving(false);
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const token = localStorage.getItem("clientToken");
        if (!token) {
          navigate("/login-client", { replace: true });
          return;
        }
        const res = await fetch("http://localhost:5000/client/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 401) {
          navigate("/login-client", { replace: true });
          return;
        }
        const data = await res.json();
        if (data && data._id) setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading && !profile) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-indigo-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const initials =
    (profile.name || "C")
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-6 px-4 sm:px-6 lg:px-12 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-5">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white text-indigo-600 text-xs font-bold shadow-sm border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all cursor-pointer"
        >
          <FaArrowLeft size={11} /> Back
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 shadow-lg px-6 py-8">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full"></div>
          <div className="absolute -bottom-16 -left-10 w-52 h-52 bg-white/10 rounded-full"></div>

          <div className="relative flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="w-24 h-24 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-3xl font-extrabold shadow-md shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white break-words leading-tight">
                {profile.name}
              </h1>
              <p className="text-indigo-100 text-sm mt-1">
                {profile.isStaff ? `${profile.role || "Staff"} • ${profile.dealerName || ""}` : "My Profile"}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profile.slug && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold backdrop-blur-md">
                    <FaGlobe size={10} /> {profile.slug}.bashaybazar.com
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${profile.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                >
                  {profile.isActive ? "Active" : "Non-Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="bg-white/60 backdrop-blur rounded-2xl border border-indigo-100 shadow-sm p-5">
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block"></span>
            Profile Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoCard icon={<FaUser size={16} />} label="Full Name">
              {profile.name || <NA />}
            </InfoCard>
            <InfoCard icon={<FaEnvelope size={16} />} label="Email" iconBg="bg-sky-50 text-sky-600">
              {profile.email || <NA />}
            </InfoCard>
            <InfoCard icon={<FaPhoneAlt size={16} />} label="Phone" iconBg="bg-emerald-50 text-emerald-600">
              {profile.phone || <NA />}
            </InfoCard>
            <InfoCard icon={<FaMapMarkerAlt size={16} />} label="Address" iconBg="bg-rose-50 text-rose-600">
              {profile.address || <NA />}
            </InfoCard>
            <InfoCard icon={<FaGlobe size={16} />} label="Subdomain" iconBg="bg-amber-50 text-amber-600">
              {profile.slug ? `${profile.slug}.bashaybazar.com` : <NA />}
            </InfoCard>
            <InfoCard icon={<FaToggleOn size={16} />} label="Status" iconBg="bg-purple-50 text-purple-600">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${profile.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
              >
                {profile.isActive ? "Active" : "Non-Active"}
              </span>
            </InfoCard>
          </div>
        </div>

        {/* Privacy and Security */}
        <div className={`${profile.isStaff ? "hidden " : ""}bg-white/60 backdrop-blur rounded-2xl border border-indigo-100 shadow-sm p-5`}>
          <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-600 rounded-full inline-block"></span>
            Privacy and Security
          </h2>

          {!showPwForm ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl border border-indigo-100 shadow-sm px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-indigo-50 text-indigo-600">
                  <FaShieldAlt size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Password</p>
                  <p className="text-xs text-gray-500">Change your account password. You will be logged out after the change.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPwForm(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-bold shadow-md transition-all cursor-pointer"
              >
                <FaKey size={12} /> Change Password
              </button>
            </div>
          ) : (
            <form onSubmit={handleChangePassword} autoComplete="off" className="bg-white rounded-xl border border-indigo-100 shadow-sm p-4 space-y-4">
              {[
                { key: "current", label: "Current Password", placeholder: "Enter current password", ac: "current-password" },
                { key: "next", label: "New Password", placeholder: "Min 8 chars, letters & numbers", ac: "new-password" },
                { key: "confirm", label: "Confirm New Password", placeholder: "Re-enter new password", ac: "new-password" },
              ].map((f) => (
                <div key={f.key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{f.label}</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <FaLock size={14} />
                    </span>
                    <input
                      type={showPw ? "text" : "password"}
                      value={pw[f.key]}
                      onChange={(e) => setPw((prev) => ({ ...prev, [f.key]: e.target.value }))}
                      maxLength={128}
                      required
                      autoComplete={f.ac}
                      placeholder={f.placeholder}
                      className="w-full pl-10 pr-12 py-2.5 bg-gray-50 border border-gray-300 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePwForm}
                  disabled={saving}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all cursor-pointer disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-6 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 transition-all cursor-pointer ${saving ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {saving ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientProfile;