import React, { useContext, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Home, Bell, User, LogIn, UserPlus, LogOut, Search, Menu, X } from "lucide-react";
import AuthContext from "../AuthContext";

const Header = ({ thoughts }) => { // Accept thoughts as a prop
  const { isLoggedIn, logout } = useContext(AuthContext);
  const [searchQuery, setSearchQuery] = useState("");  // Add state for search input
  const [filteredThoughts, setFilteredThoughts] = useState([]); // Stores filtered results
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-blue-600 text-white shadow-md z-50">
      <div className="container mx-auto flex items-center justify-between py-4 px-6">

        {/* Left: Logo */}
        <div className="flex items-center space-x-3">
          <img src="/img/logo.png" alt="Logo" className="h-8 w-8" />
          <h1 className="text-2xl font-bold">
            <NavLink to="/" className="hover:text-blue-300 transition-colors duration-200">
              SpiLL!₸
            </NavLink>
          </h1>
        </div>

        {/* Center: Desktop Search Box */}
        <div className="hidden md:block relative w-72">
          <form onSubmit={handleSearchSubmit} className="relative w-72">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search thoughts..."
              className="w-full p-2 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button type="submit" className="absolute right-2 top-2 text-gray-500">
              <Search size={20} />
            </button>
          </form>

        </div>

        {/* Right: Navigation Links & Mobile Buttons */}
        <div className="flex items-center space-x-4">
          {/* Mobile Search Icon */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden text-white p-2"
          >
            <Search size={24} />
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            <NavLink to="/" className="hover:text-blue-300 flex items-center py-2">
              <Home size={18} className="mr-1" /> Home
            </NavLink>

            {isLoggedIn() && (
              <NavLink to="/notifications" className="hover:text-blue-300 flex items-center py-2">
                <Bell size={18} className="mr-1" /> Notifications
              </NavLink>
            )}

            {isLoggedIn() ? (
              <>
                <NavLink to="/profile" className="hover:text-blue-300 flex items-center py-2">
                  <User size={18} className="mr-1" /> Profile
                </NavLink>
                <button onClick={logout} className="hover:text-blue-300 flex items-center py-2">
                  <LogOut size={18} className="mr-1" /> Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className="hover:text-blue-300 flex items-center py-2">
                  <LogIn size={18} className="mr-1" /> Login
                </NavLink>
                <NavLink to="/signup" className="hover:text-blue-300 flex items-center py-2">
                  <UserPlus size={18} className="mr-1" /> Signup
                </NavLink>
              </>
            )}
          </nav>
        </div>
      </div>

      {/* Mobile Search Input */}
      {showMobileSearch && (
        <div className="md:hidden bg-blue-700 p-3">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch} // Fixes onChange handler
            placeholder="Search..."
            className="w-full p-2 rounded-lg text-gray-900 outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-blue-700 py-4 space-y-3 text-center">
          <NavLink to="/" className="block hover:text-blue-300 py-2">
            <Home size={18} className="inline mr-1" /> Home
          </NavLink>

          {isLoggedIn() && (
            <NavLink to="/notifications" className="block hover:text-blue-300 py-2">
              <Bell size={18} className="inline mr-1" /> Notifications
            </NavLink>
          )}

          {isLoggedIn() ? (
            <>
              <NavLink to="/profile" className="block hover:text-blue-300 py-2">
                <User size={18} className="inline mr-1" /> Profile
              </NavLink>
              <button onClick={logout} className="block w-full hover:text-blue-300 py-2">
                <LogOut size={18} className="inline mr-1" /> Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/login" className="block hover:text-blue-300 py-2">
                <LogIn size={18} className="inline mr-1" /> Login
              </NavLink>
              <NavLink to="/signup" className="block hover:text-blue-300 py-2">
                <UserPlus size={18} className="inline mr-1" /> Signup
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
