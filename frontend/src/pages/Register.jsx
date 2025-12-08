import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import AuthCard from "../components/AuthCard";
import InputField from "../components/InputField";
import PrimaryButton from "../components/PrimaryButton";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const registerUser = async () => {
    setError("");

    if (password !== passwordAgain) {
      setError("Şifreler uyuşmuyor!");
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Kayıt başarılı!");
      navigate("/choose-username"); // sonraki adım için yönlendirme
    } catch (err) {
      console.error(err);
      setError("Kayıt sırasında bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <AuthCard title="Kayıt Ol">

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

        {/* Zaten hesabım var */}
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
