import { useEffect, useState, useRef } from "react";
import { auth, db } from "../lib/firebase";
import { signOut } from "firebase/auth";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import L from "leaflet";

// --- PIN ICONS ---
const publicPin = L.icon({
  iconUrl: "/public-pin.png",
  iconSize: [24, 30],
  iconAnchor: [12, 30],
});

const privatePin = L.icon({
  iconUrl: "/private-pin.png",
  iconSize: [24, 30],
  iconAnchor: [12, 30],
});

export default function HomePage() {
  const [position, setPosition] = useState(null);
  const [map, setMap] = useState(null);

  const selectModeRef = useRef(false);
  const [selectedPos, setSelectedPos] = useState(null);

  const [showCard, setShowCard] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("public");
  const [usernameInput, setUsernameInput] = useState("");
  const [allowedUsernames, setAllowedUsernames] = useState([]);

  const [editingNote, setEditingNote] = useState(null);

  const [userData, setUserData] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const navigate = useNavigate();
  const user = auth.currentUser;

  // --- USER DATA ---
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) setUserData(snap.data());
    }
    fetchData();
  }, []);

  // --- GET LOCATION ---
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      () => console.error("Konum alınamadı")
    );
  }, []);

  // --- MAP ---
  useEffect(() => {
    if (!position) return;

    const m = L.map("map").setView(position, 16);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(m);

    L.marker(position).addTo(m).bindPopup("Buradasın!");

    m.on("click", (e) => {
      if (!selectModeRef.current) return;

      const { lat, lng } = e.latlng;

      setSelectedPos([lat, lng]);
      setShowCard(true);
      selectModeRef.current = false;
    });

    setMap(m);
  }, [position]);

  // --- CLEAN MARKERS ---
  const reloadMarkers = async () => {
    if (!map || !userData) return;

    map.eachLayer((layer) => {
      if (layer instanceof L.Marker && !layer._popup?._content?.includes("Buradasın")) {
        layer.remove();
      }
    });

    loadNotes();
  };

  // --- LOAD NOTES ---
  const loadNotes = async () => {
    const snap = await getDocs(collection(db, "notes"));

    snap.forEach((docSnap) => {
      const note = { id: docSnap.id, ...docSnap.data() };
      if (!note.location) return;

      const { lat, lng } = note.location;

      const isMe = note.authorUid === user.uid;
      const isAllowed =
        note.type === "public" ||
        (note.type === "private" &&
          note.allowedUsernames?.includes(userData.username)) ||
        isMe;

      if (!isAllowed) return;

      const marker = L.marker([lat, lng], {
        icon: note.type === "public" ? publicPin : privatePin,
      }).addTo(map);

      let popupHTML = `
        <b>${note.text}</b><br/>
        <small>${note.authorUsername}</small><br/>
      `;

      if (isMe) {
        popupHTML += `
          <button id="edit-${note.id}" style="margin-top:5px; padding:4px 8px; background:#6d28d9; color:white; border:none; border-radius:6px">Düzenle</button>
          <button id="del-${note.id}" style="margin-top:5px; margin-left:6px; padding:4px 8px; background:#dc2626; color:white; border:none; border-radius:6px">Sil</button>
        `;
      }

      marker.bindPopup(popupHTML);

      marker.on("popupopen", () => {
        if (isMe) {
          document.getElementById(`edit-${note.id}`).onclick = () => {
            setEditingNote(note);
            setNoteText(note.text);
            setNoteType(note.type);
            setAllowedUsernames(note.allowedUsernames || []);
            setShowCard(true);
          };

          document.getElementById(`del-${note.id}`).onclick = async () => {
            await deleteDoc(doc(db, "notes", note.id));
            reloadMarkers();
          };
        }
      });
    });
  };

  useEffect(() => {
    if (map && userData) loadNotes();
  }, [map, userData]);

  // --- SAVE NOTE ---
  const saveNote = async () => {
    if (!selectedPos) return alert("Konum seçilmedi!");

    const note = {
      text: noteText,
      type: noteType,
      allowedUsernames: noteType === "private" ? allowedUsernames : [],
      authorUid: user.uid,
      authorUsername: userData.username,
      location: {
        lat: selectedPos[0],
        lng: selectedPos[1],
      },
      createdAt: new Date(),
    };

    await addDoc(collection(db, "notes"), note);

    setShowCard(false);
    resetCard();
    reloadMarkers();
  };

  // --- UPDATE NOTE ---
  const updateNote = async () => {
    if (!editingNote) return;

    await updateDoc(doc(db, "notes", editingNote.id), {
      text: noteText,
      allowedUsernames,
      updatedAt: new Date(),
    });

    setEditingNote(null);
    setShowCard(false);
    resetCard();
    reloadMarkers();
  };

  const resetCard = () => {
    setSelectedPos(null);
    setNoteText("");
    setAllowedUsernames([]);
    setNoteType("public");
  };

  const addAllowedUser = () => {
    if (!usernameInput.trim()) return;
    setAllowedUsernames([...allowedUsernames, usernameInput.trim()]);
    setUsernameInput("");
  };

  const logout = async () => {
    await signOut(auth);
    navigate("/");
  };

  return (
    <div className="relative w-full h-screen">
      {/* PROFILE BUTTON */}
      <button
        onClick={() => setProfileOpen(!profileOpen)}
        className="absolute top-4 right-4 z-[9999]
        bg-white/20 w-12 h-12 rounded-full flex items-center justify-center
        text-white text-xl backdrop-blur-xl border border-white/30"
      >
        ☰
      </button>

      {/* PROFILE PANEL */}
      {profileOpen && (
        <div
          className="absolute top-20 right-4 z-[9999]
          w-72 p-6 rounded-2xl bg-[rgba(15,15,35,0.9)] backdrop-blur-xl text-white"
        >
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
              👤
            </div>
            <h2 className="text-xl mt-3">{userData?.username}</h2>
            <p className="text-sm text-gray-300">{user?.email}</p>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => navigate("/edit-profile")}
              className="py-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              Profili Düzenle
            </button>
            <button
              onClick={logout}
              className="py-2 rounded-xl bg-red-500/80 hover:bg-red-500"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      )}

      {/* ADD NOTE BUTTON */}
      <button
        onClick={() => {
          selectModeRef.current = true;
          alert("Haritadan bir yere dokunarak konum seç!");
        }}
        className="absolute bottom-6 right-6 z-[9999] w-16 h-16 rounded-full
        bg-purple-500 hover:bg-purple-600 text-white text-4xl flex items-center
        justify-center shadow-xl"
      >
        +
      </button>

      {/* NOTE CARD */}
      {showCard && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 
        w-[90%] max-w-md p-5 rounded-2xl z-[9999]
        bg-[rgba(10,10,25,0.95)] border border-white/10 shadow-xl"
        >
          <h2 className="text-xl text-white mb-3">
            {editingNote ? "Notu Düzenle" : "Yeni Not Ekle"}
          </h2>

          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Notun..."
            className="w-full p-3 rounded-lg bg-white/10 text-white border border-white/20"
          ></textarea>

          {/* TYPE SELECTION (Only new notes) */}
          {!editingNote && (
            <div className="flex items-center gap-4 mt-3 text-white">
              <label>
                <input
                  type="radio"
                  checked={noteType === "public"}
                  onChange={() => setNoteType("public")}
                />{" "}
                Public
              </label>

              <label>
                <input
                  type="radio"
                  checked={noteType === "private"}
                  onChange={() => setNoteType("private")}
                />{" "}
                Private
              </label>
            </div>
          )}

          {/* PRIVATE SETTINGS */}
          {noteType === "private" && !editingNote && (
            <div className="mt-3">
              <div className="flex gap-2">
                <input
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="Kullanıcı adı ekle"
                  className="flex-1 p-2 bg-white/10 text-white rounded border border-white/20"
                />
                <button
                  onClick={addAllowedUser}
                  className="px-4 bg-purple-500 rounded text-white"
                >
                  Ekle
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-2">
                {allowedUsernames.map((u, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-purple-600 rounded-full text-sm"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={editingNote ? updateNote : saveNote}
              className="flex-1 py-3 rounded-xl bg-purple-500 text-white"
            >
              {editingNote ? "Güncelle" : "Kaydet"}
            </button>

            <button
              onClick={() => {
                setShowCard(false);
                setEditingNote(null);
                resetCard();
              }}
              className="py-3 px-4 rounded-xl bg-white/10 text-white"
            >
              İptal
            </button>

            {editingNote && (
              <button
                onClick={async () => {
                  await deleteDoc(doc(db, "notes", editingNote.id));
                  setEditingNote(null);
                  setShowCard(false);
                  resetCard();
                  reloadMarkers();
                }}
                className="py-3 px-4 rounded-xl bg-red-500 text-white"
              >
                Sil
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAP */}
      <div id="map" className="absolute inset-0 z-0"></div>
    </div>
  );
}
