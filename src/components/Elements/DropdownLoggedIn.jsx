import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { getUser, logout } from "../../services";

export const DropdownLoggedIn = ({ setDropdown }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getUser();
        // FIX: check data.id — phone users have no email so data.email was null
        // which was triggering handleLogout() every time Account was clicked
        data.id ? setUser(data) : handleLogout();
      } catch (error) {
        toast.error(error.message, { closeButton: true, position: "bottom-center" });
      }
    }
    fetchData();
  }, []); //eslint-disable-line

  function handleLogout() {
    logout();
    setDropdown(false);
    navigate("/");
  }

  const isGuest = user.email === import.meta.env.VITE_GUEST_LOGIN;

  // Show email for email accounts, phone for phone accounts, "Guest" for guests
  const displayName = isGuest
    ? "Guest"
    : user.email || user.phone || "Account";

  return (
    <div id="dropdownAvatar" className="select-none absolute top-12 right-0 z-50 w-44 bg-white rounded divide-y divide-gray-100 shadow dark:bg-gray-700 dark:divide-gray-600">
      <div className="py-3 px-4 text-sm text-gray-900 dark:text-white">
        <div className="font-medium truncate">{displayName}</div>
        {/* Show name below if it's different from displayName */}
        {user.name && user.name !== displayName && (
          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.name}</div>
        )}
      </div>
      <ul className="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownUserAvatarButton">
        <li>
          <Link
            onClick={() => setDropdown(false)}
            to="/products"
            className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
          >
            All Movies
          </Link>
        </li>
        <li>
          <Link
            onClick={() => setDropdown(false)}
            to="/dashboard"
            className="block py-2 px-4 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white"
          >
            Dashboard
          </Link>
        </li>
      </ul>
      <div className="py-1">
        <span
          onClick={handleLogout}
          className="cursor-pointer block py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white"
        >
          Log out
        </span>
      </div>
    </div>
  );
};
