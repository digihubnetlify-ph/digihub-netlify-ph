import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useTitle } from "../../hooks/useTitle";
import { getUser, updateProfile, deleteAccount, resendEmailConfirmation } from "../../services";

// A pragmatic (not 100% RFC-perfect) email check: catches missing "@",
// missing/short domains, spaces, and other obviously broken input.
const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Common real TLDs — used only to gently flag likely typos like
// "gmail.comjk" or "gmail.con". Not exhaustive on purpose: we warn,
// we don't hard-block, since new/less common TLDs do exist.
const COMMON_TLDS = new Set([
  "com", "net", "org", "edu", "gov", "mil", "info", "biz", "co",
  "io", "ph", "us", "uk", "ca", "au", "de", "jp", "cn", "in",
  "me", "app", "dev", "shop", "store", "online", "site", "xyz",
]);

// PH mobile numbers: 09XXXXXXXXX (11 digits) or +639XXXXXXXXX
const PH_PHONE_REGEX = /^(09\d{9}|\+639\d{9})$/;

const HINTS = {
  name: "Letters, spaces, apostrophes, periods, and hyphens only.",
  email: "We'll send a confirmation link here before it takes effect.",
  phone: "Format: 09XXXXXXXXX (11 digits).",
  password: "At least 7 characters. Leave blank to keep your current password.",
};

function validateName(value) {
  const trimmed = value.trim();
  if (!trimmed) return ""; // optional — blank means "no change"
  if (trimmed.length < 2) return "Name is too short.";
  if (trimmed.length > 60) return "Name is too long (max 60 characters).";
  if (!/^[a-zA-Z\u00C0-\u017F' .-]+$/.test(trimmed)) {
    return "Name can only contain letters, spaces, apostrophes, periods, and hyphens.";
  }
  return "";
}

function validateEmail(value) {
  const trimmed = value.trim();
  if (!trimmed) return ""; // optional — blank means "no change"
  if (/\s/.test(trimmed)) return "Email address can't contain spaces.";
  if (!EMAIL_REGEX.test(trimmed)) {
    return "Enter a valid email address, e.g. name@example.com.";
  }
  const domain = trimmed.split("@")[1] || "";
  const tld = domain.split(".").pop().toLowerCase();
  if (!COMMON_TLDS.has(tld)) {
    return `"${domain}" doesn't look like a real domain — double-check for typos.`;
  }
  return "";
}

function validatePhone(value) {
  const trimmed = value.trim().replace(/[\s-]/g, "");
  if (!trimmed) return ""; // optional — blank means "no change"
  if (!PH_PHONE_REGEX.test(trimmed)) {
    return "Enter a valid PH mobile number, e.g. 09171234567.";
  }
  return "";
}

function validatePassword(value) {
  if (!value) return ""; // optional — blank means "keep current password"
  if (value.length < 7) return "Password must be at least 7 characters.";
  return "";
}

// Keeps only characters a phone number could actually contain, live,
// so users physically can't type letters/symbols into this field.
function sanitizePhoneInput(value) {
  return value.replace(/[^\d+]/g, "");
}

export const AccountPage = () => {
  useTitle("Account Settings");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [resending, setResending] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [errors, setErrors] = useState({ name: "", email: "", phone: "", password: "" });
  const [touched, setTouched] = useState({ name: false, email: false, phone: false, password: false });

  useEffect(() => {
    async function fetchUser() {
      try {
        const user = await getUser();
        setName(user.name && user.name !== user.email && user.name !== user.phone ? user.name : "");
        setEmail(user.email || "");
        // Show local 09XXXXXXXXX format if we have a +63 number
        setPhone(user.phone ? user.phone.replace(/^\+63/, "0") : "");
        setPendingEmail(user.pendingEmail || "");
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  function handleFieldChange(field, value, setter, validator) {
    setter(value);
    setErrors((prev) => ({ ...prev, [field]: validator(value) }));
  }

  function handleBlur(field, value, validator) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validator(value) }));
  }

  async function handleResend() {
    setResending(true);
    try {
      await resendEmailConfirmation(pendingEmail);
      toast.success("Confirmation link resent — check your inbox.", { closeButton: true, position: "bottom-center" });
    } catch (error) {
      toast.error(error.message, { closeButton: true, position: "bottom-center" });
    } finally {
      setResending(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Re-validate everything right before submit, in case a field was
    // never blurred (e.g. user typed then hit Enter immediately).
    const freshErrors = {
      name: validateName(name),
      email: validateEmail(email),
      phone: validatePhone(phone),
      password: validatePassword(password),
    };
    setErrors(freshErrors);
    setTouched({ name: true, email: true, phone: true, password: true });

    const firstErrorField = Object.keys(freshErrors).find((field) => freshErrors[field]);
    if (firstErrorField) {
      toast.error(freshErrors[firstErrorField], { closeButton: true, position: "bottom-center" });
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setSaving(true);
    try {
      const updates = {};
      if (name.trim()) updates.name = name.trim();
      if (email.trim()) updates.email = email.trim();
      if (phone.trim()) {
        const cleanedPhone = phone.trim().replace(/[\s-]/g, "");
        updates.phone = cleanedPhone;
      }
      if (password.trim()) updates.password = password.trim();

      if (Object.keys(updates).length === 0) {
        toast.info("No changes to save.", { closeButton: true, position: "bottom-center" });
        setSaving(false);
        return;
      }

      const result = await updateProfile(updates);
      setPassword("");

      if (result?.emailChangePending) {
        setPendingEmail(email.trim());
        toast.success(
          "Saved! We've sent a confirmation link to your new email — your account keeps working normally, and the email updates once you confirm it.",
          { closeButton: true, position: "bottom-center", autoClose: 8000 }
        );
      } else {
        toast.success("Profile updated successfully!", { closeButton: true, position: "bottom-center" });
      }
    } catch (error) {
      toast.error(error.message, { closeButton: true, position: "bottom-center" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      toast.success("Your account has been deleted.", { closeButton: true, position: "bottom-center" });
      navigate("/");
    } catch (error) {
      toast.error(error.message, { closeButton: true, position: "bottom-center" });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  }

  const hasBlockingErrors = Object.values(errors).some(Boolean);

  // A field reads as "confirmed good" once it's been visited, has content,
  // and has no error — a small green check instead of just silence.
  function isFieldGood(field, value) {
    return touched[field] && value.trim() !== "" && !errors[field];
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

      {pendingEmail && (
        <div className="mb-6 rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 flex items-start gap-3">
          <span className="bi bi-hourglass-split text-amber-600 dark:text-amber-400 mt-0.5"></span>
          <div className="flex-1">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Confirmation pending for <span className="font-semibold">{pendingEmail}</span>. Your account
              works normally in the meantime — nothing changes until you click the link.
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="mt-2 text-sm font-semibold text-amber-800 dark:text-amber-200 underline underline-offset-2 hover:text-amber-900 dark:hover:text-amber-100 disabled:opacity-60"
            >
              {resending ? "Resending..." : "Resend confirmation link"}
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 mb-16">

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
              onChange={(e) => handleFieldChange("name", e.target.value, setName, validateName)}
              onBlur={() => handleBlur("name", name, validateName)}
              placeholder="Your name"
              aria-invalid={touched.name && !!errors.name}
              aria-describedby="name-hint"
              className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                touched.name && errors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-700 focus:ring-red-500"
              }`}
            />
            {isFieldGood("name", name) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bi bi-check-circle-fill text-green-500"></span>
            )}
          </div>
          <p id="name-hint" className={`mt-1.5 text-xs flex items-center gap-1 ${
            touched.name && errors.name ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
          }`}>
            {touched.name && errors.name && <span className="bi bi-exclamation-circle"></span>}
            {touched.name && errors.name ? errors.name : HINTS.name}
          </p>
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
              onChange={(e) => handleFieldChange("email", e.target.value, setEmail, validateEmail)}
              onBlur={() => handleBlur("email", email, validateEmail)}
              placeholder="you@example.com"
              aria-invalid={touched.email && !!errors.email}
              aria-describedby="email-hint"
              className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                touched.email && errors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-700 focus:ring-red-500"
              }`}
            />
            {isFieldGood("email", email) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bi bi-check-circle-fill text-green-500"></span>
            )}
          </div>
          <p id="email-hint" className={`mt-1.5 text-xs flex items-center gap-1 ${
            touched.email && errors.email ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
          }`}>
            {touched.email && errors.email && <span className="bi bi-exclamation-circle"></span>}
            {touched.email && errors.email ? errors.email : HINTS.email}
          </p>
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
              onChange={(e) =>
                handleFieldChange("phone", sanitizePhoneInput(e.target.value), setPhone, validatePhone)
              }
              onBlur={() => handleBlur("phone", phone, validatePhone)}
              placeholder="09XXXXXXXXX"
              inputMode="tel"
              aria-invalid={touched.phone && !!errors.phone}
              aria-describedby="phone-hint"
              className={`w-full pl-9 pr-9 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                touched.phone && errors.phone
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-700 focus:ring-red-500"
              }`}
            />
            {isFieldGood("phone", phone) && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bi bi-check-circle-fill text-green-500"></span>
            )}
          </div>
          <p id="phone-hint" className={`mt-1.5 text-xs flex items-center gap-1 ${
            touched.phone && errors.phone ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
          }`}>
            {touched.phone && errors.phone && <span className="bi bi-exclamation-circle"></span>}
            {touched.phone && errors.phone ? errors.phone : HINTS.phone}
          </p>
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
              onChange={(e) => handleFieldChange("password", e.target.value, setPassword, validatePassword)}
              onBlur={() => handleBlur("password", password, validatePassword)}
              placeholder="Leave blank to keep current password"
              minLength="7"
              aria-invalid={touched.password && !!errors.password}
              aria-describedby="password-hint"
              className={`w-full pl-9 pr-10 py-2.5 text-sm rounded-lg border bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                touched.password && errors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 dark:border-gray-700 focus:ring-red-500"
              }`}
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
          <p id="password-hint" className={`mt-1.5 text-xs flex items-center gap-1 ${
            touched.password && errors.password ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
          }`}>
            {touched.password && errors.password && <span className="bi bi-exclamation-circle"></span>}
            {touched.password && errors.password ? errors.password : HINTS.password}
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-2">
          <button
            type="submit"
            disabled={saving || hasBlockingErrors}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-base px-6 py-3 rounded-sm transition-colors"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold text-base px-6 py-3 rounded-sm transition-colors"
          >
            <span className="bi bi-arrow-left"></span> Back
          </button>
        </div>

      </form>

      {/* Danger Zone */}
      <section className="mb-16 border-t border-gray-200 dark:border-gray-700 pt-6">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1.5">
          Delete Account
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This will permanently close your account. This can't be undone.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center justify-center gap-2 bg-transparent border border-red-600 text-red-600 hover:bg-red-600 hover:text-white font-semibold text-base px-6 py-3 rounded-sm transition-colors"
        >
          Delete Account
        </button>
      </section>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6 text-center">
            <div className="mx-auto mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="bi bi-exclamation-triangle text-2xl text-red-600"></span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Delete your account?
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              You'll lose access to your orders and downloads for good. This can't be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm rounded-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2.5 text-sm rounded-sm bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {deleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
};
