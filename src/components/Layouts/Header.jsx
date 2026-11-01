import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/digital-movies-logo.png";
import { Search } from "../Sections/Search";
import { DropdownLoggedOut, DropdownLoggedIn } from "../index";
import { useCart } from "../../context";
import { supabase } from "../../services/supabaseClient";

export const Header = () => {
  const { cartList } = useCart();
  const [darkMode, setDarkMode] = useState(JSON.parse(localStorage.getItem("darkMode")) ?? true);
  const [searchSection, setSearchSection] = useState(true);
  const [dropdown, setDropdown] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(!!sessionStorage.getItem("token"));
  const dropdownRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      if (session) {
        sessionStorage.setItem("token", JSON.stringify(session.access_token));
        sessionStorage.setItem("cbid", JSON.stringify(session.user.id));
      } else {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("cbid");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
      if (session) {
        sessionStorage.setItem("token", JSON.stringify(session.access_token));
        sessionStorage.setItem("cbid", JSON.stringify(session.user.id));
      } else {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("cbid");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdown(false);
      }
    };
    if (dropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdown]);

  useEffect(() => {
    const handleScroll = () => setDropdown(false);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50">
        <nav className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-md">
          <div className="border-b border-slate-200 dark:border-b-0 flex flex-row justify-between items-center mx-auto max-w-screen-xl px-4 md:px-6 py-3">

            <div className="flex items-center min-w-0 flex-shrink">
              <Link to="/" className="flex items-center gap-1 min-w-0 flex-shrink overflow-hidden">
                <img src={Logo} className="h-7 sm:h-32 flex-shrink-0" alt="Digital Movies Logo" />
                <span
                  className="text-sm sm:text-4xl font-bold truncate max-w-[100px] sm:max-w-none"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}
                >
                  <span className="text-[#FB651E]">Digi</span>
                  <span className="text-gray-900 dark:text-gray-100">hub</span>
                  <span className="text-[#FB651E]">PH</span>
                </span>
              </Link>
            </div>

            {/* Right Side Icons */}
            <div className="flex flex-row items-center gap-1 sm:gap-5 flex-shrink-0 relative">

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                title={darkMode ? "Light Mode" : "Dark Mode"}
                className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 w-7 sm:w-16 text-black dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors bg-transparent border-none`}
              >
                <span className={`text-base sm:text-4xl flex items-center justify-center ${darkMode ? "bi bi-moon" : "bi bi-sun"}`}></span>
                <span className="block text-[7px] sm:text-sm leading-none text-center w-full">{darkMode ? "Dark" : "Light"}</span>
              </button>

              {/* Search */}
              <button
                onClick={() => setSearchSection(!searchSection)}
                title="Search"
                className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 w-7 sm:w-16 text-black dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors bg-transparent border-none`}
              >
                <span className="text-base sm:text-4xl bi bi-search flex items-center justify-center"></span>
                <span className="block text-[7px] sm:text-sm leading-none text-center w-full">Search</span>
              </button>

              {/* Cart */}
              <Link to="/cart" title="Cart" className={`flex flex-col items-center justify-center gap-0.5 w-7 sm:w-16 text-black dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors`}>
                <span className="relative inline-flex items-center justify-center w-5 h-5 sm:w-10 sm:h-10">
                  <span className="text-base sm:text-4xl bi bi-cart-fill"></span>
                  {cartList.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                      {cartList.length}
                    </span>
                  )}
                </span>
                <span className="block text-[7px] sm:text-sm leading-none text-center w-full">Cart</span>
              </Link>

              {/* Account */}
              <div ref={dropdownRef} className={`flex relative flex-col items-center justify-center`}>
                <button
                  onClick={() => setDropdown(!dropdown)}
                  title="Account"
                  className="cursor-pointer flex flex-col items-center justify-center gap-0.5 w-7 sm:w-16 text-black dark:text-white hover:text-orange-500 dark:hover:text-orange-400 transition-colors bg-transparent border-none"
                >
                  <span className="bi bi-person-circle text-base sm:text-4xl flex items-center justify-center text-orange-600 dark:text-orange-400"></span>
                  <span className="block text-[7px] sm:text-sm leading-none text-center w-full">Account</span>
                </button>

                {dropdown && (isLoggedIn
                  ? <DropdownLoggedIn setDropdown={setDropdown} />
                  : <DropdownLoggedOut setDropdown={setDropdown} />
                )}
              </div>

              {/* Sign In Button — only when logged out */}
              {!isLoggedIn && (
                <Link
                  to="/login"
                  className="flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-1.5 sm:py-2 rounded-full transition-colors whitespace-nowrap"
                >
                  <span className="bi bi-box-arrow-in-right"></span>
                  <span>Log In</span>
                </Link>
              )}

            </div>
          </div>
        </nav>
      </header>
      {searchSection && <Search setSearchSection={setSearchSection} />}
    </>
  );
};