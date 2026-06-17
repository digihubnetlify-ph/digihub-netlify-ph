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
    
    if(darkMode){
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  return (
   <header>      
  <nav className="bg-white dark:bg-gray-900">
    <div className="border-b border-slate-200 dark:border-b-0 
                    flex flex-row justify-between items-center 
                    mx-auto max-w-screen-xl px-4 md:px-6 py-3">
      
      {/* Logo + Brand */}
      <Link to="/" className="flex items-center">
        <img src={Logo} className="ml-0  h-12" alt="Digital Movies Logo" />


        {/* <span className="ml-4 px-3 py-2 text-2xl font-semibold whitespace-nowrap dark:text-white">
          Digital Movies
        </span> */}
        {/* <span className="text-1xl font-semibold whitespace-nowrap dark:text-white">
        Digital Movies
        </span> */}
        <span className="text-2xl text-red-600 font-bold whitespace-nowrap dark:text-red-400 tracking-wide" style={{fontFamily: "'Orbitron', sans-serif"}}>
          DigitalMovies
        </span>



      </Link>

      {/* Right Side Icons */}
      <div className="flex flex-row items-center space-x-5 relative">
        
        {/* <span onClick={() => setDarkMode(!darkMode)} 
              className="cursor-pointer text-xl text-gray-700 dark:text-white bi bi-gear-wide-connected"></span> */}

              <span 
               onClick={() => setDarkMode(!darkMode)} 
                 className={`cursor-pointer text-xl text-gray-700 dark:text-white flex items-center justify-center w-6 h-6
                  ${darkMode ? "bi bi-moon" : "bi bi-sun"}`}
                  ></span>


        
        <span onClick={() => setSearchSection(!searchSection)} 
              className="cursor-pointer text-xl text-gray-700 dark:text-white bi bi-search"></span>
        
        <Link to="/cart" className="text-gray-700 dark:text-white">
          <span className="text-2xl bi bi-cart-fill relative">
            <span className="text-white text-sm absolute -top-1 left-2.5 bg-rose-500 px-1 rounded-full">
              {cartList.length}
            </span>
          </span>                    
        </Link>

        <span onClick={() => setDropdown(!dropdown)} 
              className="bi bi-person-circle cursor-pointer text-2xl text-gray-700 dark:text-white"></span>
        { dropdown && ( token ? 
            <DropdownLoggedIn setDropdown={setDropdown} /> : 
            <DropdownLoggedOut setDropdown={setDropdown} /> ) }
      </div>
    </div>
  </nav>
  { searchSection && <Search setSearchSection={setSearchSection} /> }
</header>

  )
  
}
