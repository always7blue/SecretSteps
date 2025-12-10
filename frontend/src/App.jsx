import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LocationPermission from "./pages/LocationPermission";
import EditProfile from "./pages/EditProfile";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/location-permission" element={<LocationPermission />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/edit-profile" element={<EditProfile />} />
    </Routes>

  );
}
