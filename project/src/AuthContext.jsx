import React, { createContext, useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        try {
          axios.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
          const response = await axios.get("http://localhost:5000/api/auth/me");
          setUser(response.data);
          setToken(storedToken);
        } catch (error) {
          console.error("Auth initialization error:", error);
          logout();
        }
      }
      setLoading(false);
    };
    initializeAuth();
  }, []);

  const signup = async (email, username, password) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/register", {
        email,
        username,
        password,
      });
      const { token, user } = response.data;
      saveAuthData(user, token);
      console.log("Login successful", user, token);
      navigate("/");
      console.log()
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", { email, password });
      const { token, user } = response.data;
      saveAuthData(user, token);
      console.log("Login successful", user, token);
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const googleSignIn = async (googleUser) => {
    try {
      const response = await axios.post("http://localhost:5000/api/auth/google/callback", {
        tokenId: googleUser.getAuthResponse().id_token,
      });
      const { token, user } = response.data;
      saveAuthData(user, token);
      navigate("/");
    } catch (error) {
      console.error("Google Sign-In error:", error);
      alert("Google Sign-In failed. Please try again.");
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
    navigate("/login");
  };

  const updateUser = (userData) => {
    setUser((prevUser) => ({ ...prevUser, ...userData }));
  };

  const isLoggedIn = () => !!token && user !== null;

  const saveAuthData = (user, token) => {
    setUser(user);
    setToken(token);
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, signup, login, logout, googleSignIn, updateUser, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
