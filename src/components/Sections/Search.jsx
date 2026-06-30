import { useRef } from "react";
import { useNavigate } from "react-router-dom";

export const Search = ({setSearchSection}) => {
  const navigate = useNavigate();
  const searchRef = useRef();

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchSection(true);
    const query = searchRef.current.value.trim();
    if (query) {
      navigate(`/products?q=${query}`);
    } else {
      navigate(`/products`);
    }
  }

  return (
    <div className="mx-auto max-w-screen-xl p-2 my-5">
        <form onSubmit={handleSearch} className="flex items-center">   
            <div className="relative w-full">
                <span className="bi bi-search flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none"></span>
                <input
                  ref={searchRef}
                  name="search"
                  type="text"
                  id="simple-search"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-sm focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Search music, movies, videos, tutorials..."
                  autoComplete="off"
                />
            </div>
            <button type="submit" className="bi bi-search py-2.5 px-3 ml-2 text-sm font-medium text-white bg-violet-500 rounded-sm border border-violet-500 hover:bg-violet-600 focus:ring-4 focus:outline-none focus:ring-violet-300 dark:bg-violet-600 dark:hover:bg-violet-500 dark:focus:ring-violet-800 transition-colors">
            </button>
        </form>
    </div>
  )
}
