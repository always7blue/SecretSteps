import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import L from "leaflet";

export default function HomePage() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const user = auth.currentUser;


    useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUserData(snap.data());    // { email, username, createdAt }
      }
    };

    fetchUserData();
  }, [user]);

  // --- KONUM AL ---
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => setError("Konum alınamadı.")
    );
  }, []);

  // --- HARİTA ---
  useEffect(() => {
    if (!position) return;

    const map = L.map("map", { zoomControl: false }).setView(position, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19
    }).addTo(map);

    L.marker(position).addTo(map).bindPopup("Buradasın!").openPopup();
  }, [position]);

  // --- ÇIKIŞ ---
  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">

      {/* --- PROFİL BUTONU (HER ZAMAN ÜSTTE) --- */}
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className="
          absolute top-4 right-4 z-[9999]
          bg-white/20 backdrop-blur-xl
          border border-white/30
          rounded-full w-12 h-12
          flex items-center justify-center
          shadow-xl text-white text-xl
          hover:bg-white/30 transition
        "
      >
        ☰
      </button>

      {/* --- PROFİL PANELİ --- */}
      {profileOpen && (
        <div
          className="
            absolute top-20 right-4 z-[9999]
            w-64 p-5 rounded-2xl
            bg-[rgba(15,15,35,0.9)] backdrop-blur-xl
            border border-white/10
            shadow-2xl text-white
            animate-[fadeIn_0.25s_ease-out]
          "
        >
          <h2 className="text-lg font-semibold mb-2">Profil</h2>
          <p className="text-sm text-gray-300">
            <strong>Kullanıcı adı:</strong> {userData?.username || "Yükleniyor..."}
          </p>
          <p className="text-sm text-gray-300 mb-4">
            <strong>Email:</strong> {user?.email}
          </p>

          <button
            onClick={logout}
            className="w-full bg-red-500/80 hover:bg-red-500 py-2 rounded-xl transition"
          >
            Çıkış Yap
          </button>
        </div>
      )}

      {/* --- HARİTA ALANI --- */}
      <div id="map" className="absolute inset-0 z-0"></div>

      {/* --- HATA MESAJI --- */}
      {!position && (
        <p className="absolute bottom-10 w-full text-center text-white z-[9999]">
          {error || "Konum alınıyor..."}
        </p>
      )}
    </div>
  );
}
