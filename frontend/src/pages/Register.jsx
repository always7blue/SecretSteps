import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc } from "firebase/firestore";

import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const registerUser = async () => {
    setError("");

    if (!username.trim()) {
      setError("Kullanıcı adı boş olamaz!");
      return;
    }

    if (username.length < 3) {
      setError("Kullanıcı adı en az 3 karakter olmalı.");
      return;
    }

    if (password !== passwordAgain) {
      setError("Şifreler uyuşmuyor!");
      return;
    }

    try {
      // Firebase Auth → kullanıcı oluştur
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCred.user;

      // Firestore → kullanıcı bilgisi kaydet
      await setDoc(doc(db, "users", user.uid), {
        email,
        username,
        createdAt: new Date(),
      });

      console.log("Kayıt başarılı!");
      navigate("/location-permission");

    } catch (err) {
      console.error(err);
      setError("Kayıt sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthCard title="Kayıt Ol">

        <InputField
          label="Kullanıcı Adı"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <InputField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <InputField
          label="Şifre"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <InputField
          label="Şifre Tekrar"
          type="password"
          value={passwordAgain}
          onChange={(e) => setPasswordAgain(e.target.value)}
        />

        {error && (
          <p className="text-red-400 text-sm mt-2 mb-1 text-center">{error}</p>
        )}

        <PrimaryButton text="Kayıt Ol" onClick={registerUser} />

        <button
          onClick={() => navigate("/")}
          className="w-full mt-3 py-2 text-sm text-[#A390E4] hover:text-white transition"
        >
          Zaten hesabın var mı? <span className="underline">Giriş Yap</span>
        </button>

      </AuthCard>
    </div>
  );
}
