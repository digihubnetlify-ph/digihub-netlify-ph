import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../../../assets/images/digital-movies-logo.png";

export const Hero = () => {
  const [credential, setCredential] = useState("");
  const navigate = useNavigate();

  function handleGetStarted(e) {
    e.preventDefault();
    navigate(`/register?prefill=${encodeURIComponent(credential)}`);
  }

  return (
    <section className="flex flex-col lg:flex-row dark:text-red-100 items-center gap-10">

      <div className="text my-5 flex-1">

        {/* Main Heading */}
        <h1 className="text-5xl font-bold text-center lg:text-left dark:text-slate-100 leading-tight">
          Movies, Music, Videos & — More.
        </h1>

        {/* Subheading */}
        <p className="text-2xl my-5 text-center lg:text-left dark:text-slate-100">
          Download. Play. Watch. — No Ads.
        </p>

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

      {/* Logo */}
      <div className="visual my-5 lg:max-w-xl">
        <img className="rounded-lg max-h-full" src={Logo} alt="DigiHubPH Logo" />
      </div>

    </section>
  );
};
