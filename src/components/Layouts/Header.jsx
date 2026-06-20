import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../../assets/digital-movies-logo.png";
import { Search } from "../Sections/Search";
import { DropdownLoggedOut, DropdownLoggedIn } from "../index";
import { useCart } from "../../context";

export const Header = () => {
  const { cartList } = useCart();
  const [darkMode, setDarkMode] = useState(JSON.parse(localStorage.getItem("darkMode")) ?? true);
  const [searchSection, setSearchSection] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const token = JSON.parse(sessionStorage.getItem("token"));

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
    <header>
      <nav className="bg-white dark:bg-gray-900">
        <div className="border-b border-slate-200 dark:border-b-0 flex flex-row justify-between items-center mx-auto max-w-screen-xl px-4 md:px-6 py-3">

          {/* Logo + Brand */}
          <Link to="/" className="flex items-center gap-1 min-w-0 flex-shrink">
            <img src={Logo} className="h-8 sm:h-12 flex-shrink-0" alt="Digital Movies Logo" />
            <span
              className="text-sm sm:text-2xl text-red-600 font-bold dark:text-red-400 truncate"
              style={{ fontFamily: "'Orbitron', sans-serif" }}
            >
              <span className="hidden xs:inline">Digital</span>
              <span className="sm:inline">Digitalflix</span>
            </span>
          </Link>

          {/* Right Side Icons */}
          <div className="flex flex-row items-center gap-3 sm:gap-5 flex-shrink-0 relative">

            <span
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? "Light Mode" : "Dark Mode"}
              className={`cursor-pointer text-lg text-gray-700 dark:text-white flex items-center justify-center
                ${darkMode ? "bi bi-moon" : "bi bi-sun"}`}
            ></span>

            <span
              onClick={() => setSearchSection(!searchSection)}
              title="Search"
              className="cursor-pointer text-lg text-gray-700 dark:text-white bi bi-search"
            ></span>

            <Link to="/cart" title="Cart" className="text-gray-700 dark:text-white relative">
              <span className="text-xl bi bi-cart-fill">
                <span className="text-white text-xs absolute -top-1 left-2.5 bg-rose-500 px-1 rounded-full">
                  {cartList.length}
                </span>
              </span>
            </Link>

            <span
              onClick={() => setDropdown(!dropdown)}
              title="Account"
              className="bi bi-person-circle cursor-pointer text-xl text-gray-700 dark:text-white"
            ></span>

            {dropdown && (token ?
              <DropdownLoggedIn setDropdown={setDropdown} /> :
              <DropdownLoggedOut setDropdown={setDropdown} />)}
          </div>

        </div>
      </nav>
      {searchSection && <Search setSearchSection={setSearchSection} />}
    </header>
  );
};