import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const check = async () => {
      const user = auth.currentUser;

      // Login yok → giriş sayfasına
      if (!user) {
        setAllowed(false);
        setLoading(false);
        return;
      }

      // Username seçilmiş mi?
      const snap = await getDoc(doc(db, "users", user.uid));

      if (!snap.exists() || !snap.data().username) {
        // Username YOK → kullanıcı adı seçmeye yönlendir
        setAllowed(false);
      } else {
        // Username VAR → giriş serbest
        setAllowed(true);
      }

      setLoading(false);
    };

    check();
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
