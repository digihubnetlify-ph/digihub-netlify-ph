import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { toast } from 'react-toastify';
import { useTitle } from "../hooks/useTitle";
import { login } from "../services";

export const Login = () => {
  useTitle("Login");
  const navigate = useNavigate();
  const emailOrPhone = useRef();
  const password = useRef();
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    const input = emailOrPhone.current.value.trim();
    const isPhone = /^(\+63|0)[0-9]{10}$/.test(input);

    try {
      const authDetail = {
        email: isPhone ? null : input,
        phone: isPhone ? input : null,
        password: password.current.value,
      };
      const data = await login(authDetail);
      data.accessToken ? navigate("/products") : toast.error(data);
    } catch (error) {
      toast.error(error.message, { closeButton: true, position: "bottom-center" });
    }
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 px-8 py-10">

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <span className="bi bi-box-arrow-in-right text-3xl text-red-600 dark:text-red-500"></span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Log in to{" "}
              <span className="text-red-600 font-semibold">DigiHub</span>
              {/* <span className="font-semibold dark:text-white">PH</span> */}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email or Phone */}
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email or mobile number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-person-circle text-gray-400 dark:text-gray-500"></span>
                <input
                  ref={emailOrPhone}
                  type="text"
                  id="emailOrPhone"
                  placeholder="you@example.com or 09XXXXXXXXX"
                  required
                  autoComplete="off"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-lock text-gray-400 dark:text-gray-500"></span>
                <input
                  ref={password}
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Your password"
                  required
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

            {/* Login Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              <span className="bi bi-box-arrow-in-right"></span>
              Log In
            </button>

          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Don't have an account?{" "}
            <Link to="/register" className="text-red-600 hover:text-red-700 font-semibold transition-colors">
              Register
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
};
