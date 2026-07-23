import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../../assets/images/digital-movies-logo.png";

export const Hero = () => {
  const [credential, setCredential] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("token"));
  const navigate = useNavigate();

  useEffect(() => {
    function syncAuthState() {
      setIsLoggedIn(!!sessionStorage.getItem("token"));
    }
    // Fires on login/logout dispatched from authService, and on tab focus as a fallback
    window.addEventListener("authChange", syncAuthState);
    window.addEventListener("focus", syncAuthState);
    return () => {
      window.removeEventListener("authChange", syncAuthState);
      window.removeEventListener("focus", syncAuthState);
    };
  }, []);

  function handleGetStarted(e) {
    e.preventDefault();
    navigate(`/register?prefill=${encodeURIComponent(credential)}`);
  }

  return (
    <section className="flex flex-col lg:flex-row dark:text-red-100 items-center gap-1 lg:gap-10 mt-0">

      {/* Logo */}
      <div className="visual mt-0 mb-0 lg:my-5 lg:max-w-xl lg:order-last">
        <img className="rounded-lg max-h-full" src={Logo} alt="DigiHubPH Logo" />
      </div>

      <div className="text mt-0 mb-5 lg:my-5 flex-1">

        {/* Main Heading */}
        <h1 className="text-5xl font-bold text-center lg:text-left dark:text-slate-100 leading-tight">
          Movies, Music, Videos & — More.
        </h1>

        {/* Subheading */}
        <p className="text-2xl mt-2 mb-5 lg:my-5 text-center lg:text-left dark:text-slate-100">
          Download. Play. Watch. — No Ads.
          {/* Download Files. Play Music. Watch Movies. */}
        </p>

        {!isLoggedIn && (
          <>
            {/* CTA label */}
            <p className="text-center lg:text-left text-gray-600 dark:text-gray-200 text-sm mb-3">
              Enter your email or mobile number to get started.
            </p>

            {/* Input + button */}
            <form onSubmit={handleGetStarted} className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
                placeholder="Email or 09XXXXXXXXX"
                required
                className="flex-1 px-4 py-3 text-sm rounded-sm border border-gray-300 dark:border-gray-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
              />
              <button
                type="submit"
                className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-base px-6 py-3 rounded-sm transition-colors whitespace-nowrap"
              >
                Register
                <span className="bi bi-chevron-right"></span>
              </button>
            </form>
          </>
        )}

        {/* Explore button */}
        <div className="flex justify-center lg:justify-start">
          <Link
            to="/products"
            className="text-white bg-red-600 hover:bg-red-700 focus:ring-4 focus:ring-red-300 font-semibold rounded-sm text-lg px-8 py-3 mb-2 dark:bg-red-600 dark:hover:bg-red-700 focus:outline-none dark:focus:ring-red-800 tracking-wide"
          >
            Explore!
          </Link>
        </div>

      </div>

    </section>
  );
};
