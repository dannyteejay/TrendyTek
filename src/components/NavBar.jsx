import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const Navbar = () => {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  const {
    setShowSearch,
    getCartCount,
    token,
    setToken,
    setCartItems,
    userImage,
    setUserImage,
    userName,
    setUserName,
    logo,
    storeName,
    footerData,
    theme,
    toggleTheme,
  } = useContext(ShopContext);

  // Dynamic Navigation Links synced in real-time with Admin Dashboard
  const navLinks =
    footerData?.companyLinks && footerData.companyLinks.length > 0
      ? footerData.companyLinks
      : [
          { title: "HOME", url: "/" },
          { title: "COLLECTION", url: "/collection" },
          { title: "ABOUT", url: "/about" },
          { title: "CONTACT", url: "/contact" },
        ];

  const logout = () => {
    navigate("/login");
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userImage");
    setToken("");
    setUserImage("");
    setUserName("");
    setCartItems({});
  };

  return (
    <div className="relative z-40 flex items-center justify-between py-4 font-medium transition-colors duration-300 bg-white border-b border-gray-200 dark:bg-slate-900 dark:border-slate-800">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center shrink-0">
        {logo ? (
          <img
            src={logo}
            className="object-contain h-10 sm:h-12 md:h-14 w-auto max-w-[220px] sm:max-w-[280px] md:max-w-[340px] dark:brightness-0 dark:invert transition-all"
            alt={storeName || "Store Logo"}
          />
        ) : (
          <img
            src={assets.logo}
            className="object-contain w-36 sm:w-44 md:w-52 h-auto dark:brightness-0 dark:invert transition-all"
            alt="Store Logo"
          />
        )}
      </Link>

      {/* Desktop Dynamic Navigation Links */}
      <ul className="hidden gap-6 text-sm font-medium text-gray-700 dark:text-gray-200 sm:flex items-center">
        {navLinks.map((item, index) => (
          <NavLink
            key={index}
            to={item.url || "/"}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 uppercase tracking-wide transition-colors hover:text-black dark:hover:text-white ${
                isActive ? "text-black dark:text-white font-bold" : ""
              }`
            }
          >
            {({ isActive }) => (
              <>
                <p>{item.title}</p>
                <hr
                  className={`w-2/4 border-none h-[1.5px] bg-gray-700 dark:bg-gray-300 ${
                    isActive ? "block" : "hidden"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </ul>

      {/* Right Controls */}
      <div className="flex items-center gap-4 sm:gap-5">
        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 transition-all rounded-full bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 active:scale-90 shadow-xs cursor-pointer border border-gray-200 dark:border-slate-700"
        >
          {theme === "dark" ? (
            <span className="text-base">☀️</span>
          ) : (
            <span className="text-base">🌙</span>
          )}
        </button>

        {/* Search Icon */}
        <img
          onClick={() => {
            setShowSearch(true);
            navigate("/collection");
          }}
          src={assets.search_icon}
          className="w-5 cursor-pointer dark:invert hover:opacity-75"
          alt="Search"
        />

        {/* Profile Avatar / Dropdown */}
        <div className="relative group">
          {token && userImage ? (
            <img
              onClick={() => navigate("/profile")}
              className="object-cover w-7 h-7 sm:w-8 sm:h-8 transition-all border-2 border-gray-300 dark:border-slate-700 rounded-full cursor-pointer hover:border-black dark:hover:border-white shadow-xs"
              src={userImage}
              alt="User Avatar"
            />
          ) : (
            <img
              onClick={() => (token ? navigate("/profile") : navigate("/login"))}
              className="w-5 cursor-pointer dark:invert hover:opacity-75"
              src={assets.profile_icon}
              alt="Profile Icon"
            />
          )}

          <div className="absolute right-0 z-50 hidden pt-3 group-hover:block">
            <div className="flex flex-col py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 shadow-xl dark:bg-slate-900 dark:border-slate-800 dark:text-gray-200 sm:text-sm rounded-xl w-48">
              {token ? (
                <>
                  <div className="px-4 py-2.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-800/60 rounded-t-xl">
                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                      Signed in as
                    </p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {userName || "My Account"}
                    </p>
                  </div>
                  <p
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <span>👤</span> My Profile
                  </p>
                  <p
                    onClick={() => navigate("/orders")}
                    className="flex items-center gap-2.5 px-4 py-2.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white transition-colors"
                  >
                    <span>📦</span> Orders
                  </p>
                  <hr className="my-1 border-gray-100 dark:border-slate-800" />
                  <p
                    onClick={logout}
                    className="flex items-center gap-2.5 px-4 py-2 text-red-600 dark:text-red-400 transition-colors cursor-pointer hover:bg-red-50 dark:hover:bg-slate-800"
                  >
                    <span>🚪</span> Logout
                  </p>
                </>
              ) : (
                <p
                  onClick={() => navigate("/login")}
                  className="flex items-center gap-2 px-4 py-2.5 font-bold cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-black dark:hover:text-white transition-colors"
                >
                  <span>🔑</span> Login / Sign Up
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cart Icon */}
        <Link to="/cart" className="relative">
          <img
            src={assets.cart_icon}
            className="w-5 min-w-5 dark:invert"
            alt="Cart"
          />
          <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black dark:bg-white text-white dark:text-black font-bold aspect-square rounded-full text-[8px]">
            {getCartCount()}
          </p>
        </Link>

        {/* Mobile Hamburger */}
        <img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className="w-5 cursor-pointer dark:invert sm:hidden"
          alt="Menu"
        />
      </div>

      {/* Mobile Drawer Menu */}
      <div
        className={`fixed top-0 right-0 bottom-0 z-50 bg-white dark:bg-slate-900 transition-all duration-300 sm:hidden shadow-2xl ${
          visible
            ? "w-full opacity-100"
            : "w-0 opacity-0 overflow-hidden pointer-events-none"
        }`}
      >
        <div className="flex flex-col text-gray-600 dark:text-gray-300">
          <div
            onClick={() => setVisible(false)}
            className="flex items-center gap-4 p-4 border-b border-gray-200 dark:border-slate-800 cursor-pointer bg-gray-50 dark:bg-slate-800"
          >
            <img className="h-4 rotate-180 dark:invert" src={assets.dropdown_icon} alt="Back" />
            <p className="font-semibold text-gray-800 dark:text-white">Back</p>
          </div>

          {/* Dynamic Mobile Links */}
          {navLinks.map((item, index) => (
            <NavLink
              key={index}
              onClick={() => setVisible(false)}
              className="py-3.5 pl-6 border-b border-gray-100 dark:border-slate-800 font-medium uppercase hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              to={item.url || "/"}
            >
              {item.title}
            </NavLink>
          ))}

          {token && (
            <NavLink
              onClick={() => setVisible(false)}
              className="py-3.5 pl-6 border-b border-gray-100 dark:border-slate-800 font-medium text-black dark:text-white"
              to="/profile"
            >
              👤 MY PROFILE
            </NavLink>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;