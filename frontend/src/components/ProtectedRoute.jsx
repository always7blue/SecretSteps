import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        // Kullanıcı yok → girişe
        setAllowed(false);
        setLoading(false);
        return;
      }

      // Kullanıcı var → Firestore'dan username çek
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || !snap.data().username) {
        // Username yok → username seçme sayfasına
        setAllowed(false);
      } else {
        // Username VAR → home'a izin
        setAllowed(true);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );
  }

  return allowed ? children : <Navigate to="/choose-username" replace />;
}
