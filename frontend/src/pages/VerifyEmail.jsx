import { auth } from "../lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useNavigate } from "react-router-dom";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const user = auth.currentUser;

  const resendMail = async () => {
    if (!user) return;
    await sendEmailVerification(user);
    alert("Doğrulama maili tekrar gönderildi.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center text-center">
      <div className="max-w-md p-6">
        <h1 className="text-xl font-semibold mb-3">📩 Email Doğrulama</h1>

        <p className="text-gray-400 mb-4">
          Mail adresine bir doğrulama linki gönderdik.
          Devam etmek için mailini doğrula.
        </p>

        <button
          onClick={resendMail}
          className="text-sm text-[#A390E4] underline"
        >
          Tekrar mail gönder
        </button>

        <button
          onClick={() => navigate("/login")}
          className="block w-full mt-4 py-2 bg-[#A390E4] rounded"
        >
          Doğruladım, giriş yap
        </button>
      </div>
    </div>
  );
}
