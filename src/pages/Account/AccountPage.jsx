import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useTitle } from "../../hooks/useTitle";
import { getUser, updateProfile } from "../../services";

export const AccountPage = () => {
  useTitle("Account Settings");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getUser();
        setName(user.name && user.name !== user.email && user.name !== user.phone ? user.name : "");
        setEmail(user.email || "");
        // Show local 09XXXXXXXXX format if we have a +63 number
        setPhone(user.phone ? user.phone.replace(/^\+63/, "0") : "");
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    try {
      const updates = {};
      if (name.trim()) updates.name = name.trim();
      if (email.trim()) updates.email = email.trim();
      if (phone.trim()) updates.phone = phone.trim();
      if (password.trim()) updates.password = password.trim();

      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save.", { closeButton: true, position: "bottom-center" });
        setSaving(false);
        return;
      }

      await updateProfile(updates);
      setPassword("");
      toast.success("Profile updated successfully!", { closeButton: true, position: "bottom-center" });
    } catch (error) {
      toast.error(error.message, { closeButton: true, position: "bottom-center" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main>
        <p className="text-center dark:text-slate-100 my-20">Loading your account...</p>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4">
      <section>
        <p className="text-2xl text-center font-semibold dark:text-slate-100 my-10 underline underline-offset-8">
          Account Settings
        </p>
      </section>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 mb-16">

        {/* Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Name
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-person text-gray-400 dark:text-gray-500"></span>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-envelope text-gray-400 dark:text-gray-500"></span>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-phone text-gray-400 dark:text-gray-500"></span>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09XXXXXXXXX"
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            New Password
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-lock text-gray-400 dark:text-gray-500"></span>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep current password"
              minLength="7"
              className="w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></span>
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base px-6 py-3 rounded-sm transition-colors mt-2"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </form>
    </main>
  );
};
