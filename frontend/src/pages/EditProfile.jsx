import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { query, where, getDocs, collection } from "firebase/firestore";


export default function EditProfile() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userData, setUserData] = useState(null);


  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- Firestore'dan kullanıcı adı çek ---
  useEffect(() => {
    const fetchData = async () => {
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
      setUserData(snap.data());              
      setUsername(snap.data().username || "");
    }
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // --- PROFİLİ KAYDET ---
const saveProfile = async () => {
  const newName = username.trim();
  if (!newName) return alert("Kullanıcı adı boş olamaz!");

  setSaving(true);

  try {
    const currentUid = user.uid;

    // 1) Eğer kullanıcı adı değişmemişse direkt kaydetme
    if (userData?.username === newName) {
      setSaving(false);
      navigate("/home");
      return;
    }

    // 2) Firestore’da aynı username’i kullanan var mı?
    const q = query(
      collection(db, "users"),
      where("username", "==", newName)
    );

    const snap = await getDocs(q);

    // 3) Eğer bulunan kullanıcı şu anki kullanıcı değilse → çakışma!
    if (!snap.empty && snap.docs[0].id !== currentUid) {
      alert("Bu kullanıcı adı zaten alınmış!");
      setSaving(false);
      return;
    }

    // 4) Güncelleme
    const ref = doc(db, "users", currentUid);
    await updateDoc(ref, {
      username: newName,
      updatedAt: new Date(),
    });

    navigate("/home");

  } catch (err) {
    console.error("Profil güncelleme hatası:", err);
    alert("Bir hata oluştu!");
  }

  setSaving(false);
};




  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div
        className="
          w-full max-w-md p-8 rounded-2xl
          bg-[rgba(15,15,35,0.9)] backdrop-blur-xl
          border border-white/10 shadow-2xl text-white
        "
      >
        <h1 className="text-2xl font-semibold text-center mb-6">
          Profili Düzenle
        </h1>

        {/* Avatar Placeholder */}
        <div className="w-24 h-24 mx-auto rounded-full bg-white/20 flex items-center justify-center text-4xl mb-6">
          👤
        </div>

        {/* Username Input */}
        <label className="text-sm text-gray-300">Kullanıcı Adı</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="
            w-full mt-1 mb-4 p-3 rounded-xl bg-white/10 border border-white/20
            focus:outline-none focus:border-purple-300
          "
        />

        {/* Buttons */}
        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={saveProfile}
            disabled={saving}
            className="
              w-full py-2 rounded-xl bg-purple-500/80 hover:bg-purple-500 
              transition font-medium
            "
          >
            {saving ? "Kaydediliyor..." : "Kaydet"}
          </button>

          <button
            onClick={() => navigate("/home")}
            className="
              w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 
              transition font-medium
            "
          >
            Geri Dön
          </button>
        </div>
      </div>
    </div>
  );
}
