import { useState } from "react";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import GoogleButton from "../components/GoogleButton";
import { auth } from "../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();  // ⭐ BURADA OLMALI

  const loginUser = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Giriş başarılı!");

      // ⭐ GİRİŞ BAŞARILI → KONUM İZNİ SAYFASINA
      navigate("/location-permission");

    } catch (err) {
      console.error(err);
    }
  };

  const googleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      console.log("Google ile giriş başarılı!");

      // ⭐ GOOGLE GİRİŞTE DE AYNI
      navigate("/location-permission");

    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthCard title="Giriş Yap">

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

        <PrimaryButton text="Giriş Yap" onClick={loginUser} />

        <GoogleButton onClick={googleLogin} />

      </AuthCard>
    </div>
  );
}
