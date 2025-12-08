import { useState } from "react";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, getDocs, query, where, collection } from "firebase/firestore";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";

export default function ChooseUsername() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const saveUsername = async () => {
    setError("");

    if (!username.trim()) {
      setError("Kullanıcı adı boş olamaz!");
      return;
    }

    if (username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı.");
      return;
    }

    try {
      setChecking(true);

      // Username unique mi?
      const q = query(
        collection(db, "users"),
        where("username", "==", username)
      );

      const snap = await getDocs(q);
      if (!snap.empty) {
        setError("Bu kullanıcı adı zaten alınmış!");
        setChecking(false);
        return;
      }

      const user = auth.currentUser;
      if (!user) {
        setError("Giriş yapılmalı!");
        return;
      }

      // Firestore'a kaydet
      await setDoc(doc(db, "users", user.uid), {
        username,
        email: user.email,
        createdAt: new Date(),
      });

      console.log("Username kaydedildi!");
      navigate("/location-permission");

    } catch (err) {
      console.error(err);
      setError("Bir hata oluştu.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthCard title="Kullanıcı Adı Seç">

        <InputField
          label="Kullanıcı Adı"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-sm mt-1 mb-1 text-center">
            {error}
          </p>
        )}

        <PrimaryButton
          text={checking ? "Kontrol ediliyor..." : "Kaydet ve Devam Et"}
          onClick={saveUsername}
        />

      </AuthCard>
    </div>
  );
}
