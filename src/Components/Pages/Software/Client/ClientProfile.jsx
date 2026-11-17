import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
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
  FaSignOutAlt,
} from "react-icons/fa";
import { useClientAuth } from "../../../../hooks/ClientAuthContext";

const InfoCard = ({ icon, label, children, iconBg = "bg-brand-50 text-brand-600" }) => (
  <div className="bg-white rounded-2xl border border-slate-200 px-4 py-3.5 flex items-center gap-3 transition hover:border-brand-200">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      {icon}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none mb-1">{label}</p>
      <div className="text-sm font-semibold text-slate-800 break-words">{children}</div>
    </div>
  </div>
);

const NA = () => <span className="text-slate-400 italic font-normal">N/A</span>;

const SectionTitle = ({ children }) => (
  <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
    <span className="w-1.5 h-5 bg-brand-600 rounded-full inline-block"></span>
    {children}
  </h2>
);

const Skeleton = () => (
  <div className="min-h-screen p-3 sm:p-5 md:p-8">
    <div className="max-w-5xl mx-auto space-y-4 animate-pulse">
      <div className="h-9 w-24 rounded-full bg-white/70"></div>
      <div className="h-40 rounded-3xl bg-white/70"></div>
      <div className="bg-white/70 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-slate-100"></div>
        ))}
      </div>
    </div>
  </div>
);

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

  const closePwForm = () => {
    setShowPwForm(false);
    setShowPw(false);
    setPw({ current: "", next: "", confirm: "" });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!pw.current || !pw.next || !pw.confirm) {
      toast.error("All fields are required!");
      return;
    }
    if (!PASSWORD_RULE.test(pw.next)) {
      toast.error("Password must be 8-128 characters and include letters and numbers");
      return;
    }
    if (pw.next !== pw.confirm) {
      toast.error("New password and confirm password do not match!");
      return;
    }
    if (pw.current === pw.next) {
      toast.error("New password must be different from current password!");
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
        toast.error(data.message || "Failed to update password!");
        setSaving(false);
        return;
      }

      toast.success("Password updated! Please login with your new password.");
      setPw({ current: "", next: "", confirm: "" });
      await clientLogout();
      navigate("/login-client", { replace: true });
    } catch (error) {
      console.error("Change password error:", error);
      toast.error("Something went wrong. Try again!");
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "আপনি কি লগ আউট করতে চান?",
      text: "লগ আউট করলে আবার লগইন করতে হবে।",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "হ্যাঁ",
      cancelButtonText: "না",
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
      width: 340,
      customClass: {
        popup: "!rounded-2xl",
        title: "!text-lg !font-bold !text-slate-800",
        htmlContainer: "!text-sm !text-slate-500",
        confirmButton: "!rounded-full !px-6 !text-sm !font-semibold",
        cancelButton: "!rounded-full !px-6 !text-sm !font-semibold",
      },
    });
    if (!result.isConfirmed) return;
    await clientLogout();
    navigate("/login-client", { replace: true });
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

  if (loading && !profile) return <Skeleton />;
  if (!profile) return null;

  const initials = (profile.name || "C")
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const pwInputCls =
    "w-full pl-10 pr-12 py-2.5 text-sm rounded-xl border border-slate-300 bg-white focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 transition";

  return (
    <div className="min-h-screen p-3 sm:p-5 md:p-8">
      <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-5">
        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 min-h-[40px] px-4 rounded-full bg-white text-brand-700 text-xs font-bold border border-slate-200 hover:bg-brand-50 transition cursor-pointer"
        >
          <FaArrowLeft size={11} /> Back
        </button>

        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-500 to-brand-800 px-5 py-7 sm:px-8 sm:py-9">
          <div className="absolute -top-14 -right-14 w-52 h-52 bg-white/10 rounded-full"></div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Log Out"
            className="lg:hidden absolute top-3 right-3 z-10 inline-flex items-center gap-1.5 min-h-[36px] px-3 rounded-full bg-white text-rose-500 border border-rose-100 shadow-sm text-xs font-bold cursor-pointer active:scale-95 transition"
          >
            <FaSignOutAlt size={12} /> Log Out
          </button>
          <div className="absolute -bottom-20 -left-12 w-56 h-56 bg-white/10 rounded-full"></div>

          <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 border border-white/30 flex items-center justify-center text-white text-2xl sm:text-3xl font-extrabold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-3xl font-extrabold text-white break-words leading-tight">
                {profile.name}
              </h1>
              <p className="text-brand-100 text-sm mt-1">
                {profile.isStaff ? `${profile.role || "Staff"} • ${profile.dealerName || ""}` : "My Profile"}
              </p>
              <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
                {profile.slug && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-semibold">
                    <FaGlobe size={10} /> {profile.slug}.bashaybazar.com
                  </span>
                )}
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${profile.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    }`}
                >
                  {profile.isActive ? "Active" : "Non-Active"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white/70 rounded-3xl border border-slate-200 p-4 sm:p-5">
          <SectionTitle>Profile Information</SectionTitle>
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
            <InfoCard icon={<FaToggleOn size={16} />} label="Status" iconBg="bg-brand-50 text-brand-600">
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${profile.isActive ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                  }`}
              >
                {profile.isActive ? "Active" : "Non-Active"}
              </span>
            </InfoCard>
          </div>
        </div>

        {/* Log Out (mobile only, always last) */}
        <div className="hidden">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full min-h-[46px] rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition"
          >
            Log Out
          </button>
        </div>

        {/* Privacy and Security (dealer only) */}
        {!profile.isStaff && (
          <div className="bg-white/70 rounded-3xl border border-slate-200 p-4 sm:p-5">
            <SectionTitle>Privacy and Security</SectionTitle>

            {!showPwForm ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-brand-50 text-brand-600">
                    <FaShieldAlt size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Password</p>
                    <p className="text-xs text-slate-500">
                      Change your account password. You will be logged out after the change.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPwForm(true)}
                  className="inline-flex items-center justify-center gap-2 min-h-[40px] px-5 bg-brand-600 text-white text-sm font-semibold cursor-pointer"
                >
                  <FaKey size={12} /> Change Password
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleChangePassword}
                autoComplete="off"
                className="bg-white rounded-2xl border border-slate-200 p-4 space-y-4"
              >
                {[
                  { key: "current", label: "Current Password", placeholder: "Enter current password", ac: "current-password" },
                  { key: "next", label: "New Password", placeholder: "Min 8 chars, letters & numbers", ac: "new-password" },
                  { key: "confirm", label: "Confirm New Password", placeholder: "Re-enter new password", ac: "new-password" },
                ].map((f) => (
                  <div key={f.key}>
                    <label htmlFor={`pw-${f.key}`} className="block text-xs font-medium text-slate-600 mb-1">
                      {f.label}
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                        <FaLock size={14} />
                      </span>
                      <input
                        id={`pw-${f.key}`}
                        type={showPw ? "text" : "password"}
                        value={pw[f.key]}
                        onChange={(e) => setPw((prev) => ({ ...prev, [f.key]: e.target.value }))}
                        maxLength={128}
                        required
                        autoComplete={f.ac}
                        placeholder={f.placeholder}
                        className={pwInputCls}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        aria-label={showPw ? "Hide password" : "Show password"}
                        className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-slate-400 hover:text-brand-600 focus:outline-none"
                      >
                        {showPw ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3 pt-1">
                  <button
                    type="button"
                    onClick={closePwForm}
                    disabled={saving}
                    className="min-h-[42px] px-5 rounded-xl border border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className={`min-h-[42px] px-6 bg-brand-600 text-white text-sm font-semibold cursor-pointer ${saving ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                  >
                    {saving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfile;