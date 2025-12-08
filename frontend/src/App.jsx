import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChooseUsername from "./pages/ChooseUsername";
import ProtectedRoute from "./components/ProtectedRoute";
import HomePage from "./pages/HomePage";
import LocationPermission from "./pages/LocationPermission";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/choose-username" element={<ChooseUsername />} />
      <Route path="/location-permission" element={<LocationPermission />} />
    
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}
