import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useTitle } from "../hooks/useTitle";
import { register } from '../services';

export const Register = () => {
  useTitle("Register");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefill = searchParams.get("prefill") || "";

  async function handleRegister(event) {
    event.preventDefault();
    const input = event.target.emailOrPhone.value.trim();
    const isPhone = /^(\+63|0)[0-9]{10}$/.test(input);

    try {
      const authDetail = {
        name: event.target.name.value,
        email: isPhone ? null : input,
        phone: isPhone ? input : null,
        password: event.target.password.value,
      };
      const data = await register(authDetail);
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
              <span className="bi bi-person-plus text-3xl text-red-600 dark:text-red-500"></span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Create an account
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Join <span className="text-red-600 font-semibold">DigiHub</span><span className="font-semibold dark:text-white">PH</span> today
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleRegister} className="space-y-5">

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Full name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-person text-gray-400 dark:text-gray-500"></span>
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Juan dela Cruz"
                  required
                  autoComplete="off"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Email or Phone — pre-filled from Hero */}
            <div>
              <label htmlFor="emailOrPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Email or mobile number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 bi bi-person-circle text-gray-400 dark:text-gray-500"></span>
                <input
                  type="text"
                  id="emailOrPhone"
                  name="emailOrPhone"
                  placeholder="you@example.com or 09XXXXXXXXX"
                  defaultValue={prefill}
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
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Min. 7 characters"
                  required
                  minLength="7"
                  className="w-full pl-9 pr-4 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Register Button */}
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
            >
              <span className="bi bi-person-check"></span>
              Create Account
            </button>

          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            Already have an account?{" "}
            <Link to="/login" className="text-red-600 hover:text-red-700 font-semibold transition-colors">
              Log In
            </Link>
          </p>

        </div>
      </div>
    </main>
  );
};
