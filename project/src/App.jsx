import React, { useContext } from "react";
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AuthContext from "./AuthContext";
import SignUp from "./pages/Signup";
import Login from "./pages/Login";
import HomePage from "./pages/Home";
import Header from "./component/Header";
import Footer from "./component/Footer";
import ThoughtDetail from './component/ThoughtDetail';
import SearchPage from "./pages/SearchPage";
import Profile from "./pages/Profile";
import Notification from "./pages/Notification";

const Home = () => <div className="container mx-auto py-8">Dashboard</div>;
const UserDashboard = () => <div className="container mx-auto py-8">User Dashboard</div>;

const Logout = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  React.useEffect(() => {
    logout();
    navigate("/login");
  }, [logout, navigate]);

  return <div>Logging out...</div>;
};

const App = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <ToastContainer position="top-right" autoClose={3000} />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<Notification />} />
          <Route path="/thought/:id" element={<ThoughtDetail />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/logout" element={<Logout />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;