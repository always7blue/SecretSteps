import { useEffect, useState, useRef } from "react";
import { auth, db } from "../lib/firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  doc,
  getDoc,
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet.markercluster";


// --- MESAFE HESAPLAMA ---
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // metres
}

export default function HomePage() {
  const [position, setPosition] = useState(null);
  const [map, setMap] = useState(null);

  const [userData, setUserData] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

  // NOT STATES
  const selectModeRef = useRef(false);
  const [selectedPos, setSelectedPos] = useState(null);
  const [showCard, setShowCard] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState("public");
  const [usernameInput, setUsernameInput] = useState("");
  const [allowedUsernames, setAllowedUsernames] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const clusterRef = useRef(null);
  const [showMyNotes, setShowMyNotes] = useState(false);
  const [myNotes, setMyNotes] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [searchText, setSearchText] = useState("");


  const navigate = useNavigate();

    function formatDateTime(date) {
    if (!date) return "";

    return date.toLocaleString("tr-TR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    }


    // --- USER DATA ---
    useEffect(() => {
      const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!firebaseUser) return;

        const ref = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setUserData(snap.data());
        }
      });

      return () => unsub();
    }, []);


    // --- LOCATION ---
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

      const cluster = L.markerClusterGroup();
      m.addLayer(cluster);
      clusterRef.current = cluster;

      // Konum seçme
      m.on("click", (e) => {
        if (!selectModeRef.current) return;

        setSelectedPos([e.latlng.lat, e.latlng.lng]);
        setShowCard(true);
        
        selectModeRef.current = false;
        setSelectMode(false);
      });

      setMap(m);
    }, [position]);

    // Lokasyon arama
    const searchLocation = async () => {
      if (!searchText.trim() || !map) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            searchText
          )}`
        );

        const data = await res.json();

        if (!data || data.length === 0) {
          alert("Yer bulunamadı");
          return;
        }

        const { lat, lon } = data[0];

        map.setView([lat, lon], 16);
        setShowSearch(false);
        setSearchText("");
      } catch (e) {
        console.error(e);
        alert("Arama sırasında hata oluştu");
      }
    };


    // --- MARKER RELOAD ---
    const reloadMarkers = async () => {
      if (!clusterRef.current || !map || !userData) return;
      clusterRef.current.clearLayers();
      loadNotes();
    };

    // --- LOAD NOTES ---
    const loadNotes = async () => {
      const snap = await getDocs(collection(db, "notes"));

      snap.forEach((d) => {
        const note = { id: d.id, ...d.data() };
        if (!note.location) return;

        const isMe = note.authorUid === auth.currentUser?.uid;
        const canSee =
          note.type === "public" ||
          isMe ||
          note.allowedUsernames?.includes(userData.username);

        if (!canSee) return;

        const marker = L.circleMarker(
          [note.location.lat, note.location.lng],
          {
            radius: 10,
            fillColor: note.type === "public" ? "#fb923c" : "#8b5cf6",
            color: "#ffffff",
            weight: 2,
            fillOpacity: 0.95,
          }
        );
        const createdAtDate = note.createdAt?.toDate
        ? note.createdAt.toDate()
        : new Date(note.createdAt);

        // POPUP HTML
        let popupHTML = `
          <div>
            <b>${note.text}</b><br/>
            <small>${note.isAnonymous ? "🕵️‍♀️ Anonim" : note.authorUsername}</small>
            <br/>
            <small style="color:#aaa; font-size:11px;">
              ${formatDateTime(createdAtDate)}
            </small>
        `;

        // ÜZERI CLICKTE MESAFE KONTROLÜ YAPACAĞIZ
        popupHTML += `<div class="note-id" data-note="${note.id}"></div>`;
        popupHTML += `</div>`;
        marker.bindPopup(popupHTML);

        marker.on("click", () => {
          if (!isMe) return;

          setEditingNote(note);
          setNoteText(note.text);
          setNoteType(note.type);
          setAllowedUsernames(note.allowedUsernames || []);
          setShowCard(true);
        });


        // POPUP AÇILINCA TETIK
        marker.on("popupopen", () => {
          const popupNode = document.querySelector(".leaflet-popup-content");

          // 1️⃣ MESAFE KONTROLÜ (HER NOT İÇİN)
          const dist = getDistance(
            position[0],
            position[1],
            note.location.lat,
            note.location.lng
          );

          // 🟢 1️⃣ AUTHOR HER ZAMAN GÖRÜR
          if (isMe) {
            popupNode.insertAdjacentHTML(
              "afterbegin",
              `<div class="text-xs text-green-400 mb-1 text-center">
                ✨
              </div>`
            );
            return;
          }

          if (dist > 50) {
            popupNode.innerHTML = `
              <div style="padding:6px; text-align:center;">
                🔒 Bu notu görmek için notun bulunduğu konuma gelmelisin.
                <div class="text-xs text-gray-400 mt-1"></div>
              </div>
            `;
            return;
          }

          // 2️⃣ PRIVATE → YETKİ KONTROLÜ
          if (
            note.type === "private" &&
            !isMe &&
            !note.allowedUsernames?.includes(userData.username)
          ) {
            popupNode.innerHTML = `
              <div style="padding:6px; text-align:center;">
                🔒 Bu not sana özel değil.
              </div>
            `;
            return;
          }

          // 3️⃣ VARIŞ MESAJI
          popupNode.insertAdjacentHTML(
            "afterbegin",
            `<div class="text-xs text-green-400 mb-1 text-center">
              📍 Konuma ulaştın
              </div>`
          );
          });

            clusterRef.current.addLayer(marker);
          });
      };

        useEffect(() => {
          if (map && userData) loadNotes();
        }, [map, userData]);

        useEffect(() => {
          if (showCard && map) {
            setTimeout(() => {
              map.invalidateSize();
            }, 300);
          }
        }, [showCard, map]);



    // --- SAVE NOTE ---
    const saveNote = async () => {
      if (!selectedPos) return alert("Konum seç!");

      const newNote = {
        text: noteText,
        type: noteType,
        allowedUsernames: noteType === "private" ? allowedUsernames : [],
        authorUid: auth.currentUser.uid,
        authorUsername: isAnonymous ? "Anonim" : userData.username,
        isAnonymous: isAnonymous,

        location: {
          lat: selectedPos[0],
          lng: selectedPos[1],
        },
        createdAt: new Date(),
      };

      await addDoc(collection(db, "notes"), newNote);
      resetCard();
      reloadMarkers();
    };

    const loadMyNotes = async () => {
      if (!auth.currentUser) return;

      const snap = await getDocs(collection(db, "notes"));

      const mine = [];
      snap.forEach((d) => {
        const note = { id: d.id, ...d.data() };
        if (note.authorUid === auth.currentUser.uid) {
          mine.push(note);
        }
      });

      // En yeni en üstte
      mine.sort((a, b) => {
        const da = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const dbb = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return dbb - da;
      });

      setMyNotes(mine);
    };


    // --- UPDATE NOTE ---
    const updateNote = async () => {
      if (!editingNote) return;

      await updateDoc(doc(db, "notes", editingNote.id), {
        text: noteText,
        allowedUsernames,
        updatedAt: new Date(),
      });

      resetCard();
      reloadMarkers();
    };

    // RESET
      const resetCard = () => {
        setShowCard(false);
        setSelectedPos(null);
        setEditingNote(null);
        setNoteText("");
        setAllowedUsernames([]);
        setNoteType("public");
        setIsAnonymous(false);


        setTimeout(() => {
          if (map) {
            map.invalidateSize();
          }
        }, 350);
      };


    // ADD USER
    const addAllowedUser = () => {
      if (!usernameInput.trim()) return;
      setAllowedUsernames([...allowedUsernames, usernameInput.trim()]);
      setUsernameInput("");
    };

    // LOGOUT
    const logout = async () => {
      await signOut(auth);
      navigate("/");
    };

    // --- UI ---
    return (
      <div className="relative w-full h-screen">

      {/* KONUM SEÇME MODU BİLGİSİ */}
      {selectMode && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                        z-[9999]
                        bg-black/70 text-white
                        px-4 py-3 rounded-xl
                        flex items-center gap-3">
          <span>Haritadan konum seç</span>

          <button
            onClick={() => {
              selectModeRef.current = false;
              setSelectMode(false);
            }}
            className="px-3 py-1 bg-red-500 rounded-lg text-sm"
          >
            İptal
          </button>
        </div>
      )}


      {/* MAP – HER ZAMAN DOM'DA */}
        <div
          id="map"
          className="absolute inset-0"
        />


      {/* LOADING OVERLAY */}
      {!userData && (
        <div className="absolute inset-0 z-[9999]
                        flex items-center justify-center
                        bg-black/60 text-white">
          Yükleniyor...
        </div>
      )}
        {/* PROFILE BUTTON */}
        <button
          onClick={() => setProfileOpen(!profileOpen)}
          className="absolute top-4 right-4 z-[9999]
          bg-purple-700/20 w-12 h-12 rounded-full flex items-center justify-center text-white text-xl backdrop-blur-xl"
        >
          👤
        </button>

        {/* SEARCH BUTTON */}
        <button
          onClick={() => setShowSearch(true)}
          className="absolute top-4 left-[4.5rem] z-[999]
                    bg-purple-400 w-12 h-12 rounded-full
                    flex items-center justify-center
                    text-white text-xl backdrop-blur-xl"
        >
          🔍
        </button>


        {/* PROFILE PANEL */}
        {profileOpen && (
          <div className="absolute top-20 right-4 z-[9999] w-72 p-6 rounded-2xl bg-[rgba(15,15,35,0.9)] text-white">
            <div className="flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">👤</div>
              <h2 className="text-xl mt-3">{userData?.username}</h2>
              <p className="text-sm text-gray-300">{auth.currentUser?.email}</p>
            </div>

            <div className="mt-6 flex flex-col gap-3">
              <button onClick={() => navigate("/edit-profile")} className="py-2 rounded-xl bg-white/10">
                Profili Düzenle
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  loadMyNotes();
                  setShowMyNotes(true);
                }}
                className="py-2 rounded-xl bg-white/10"
              >
                Benim Notlarım
              </button>

              <button onClick={logout} className="py-2 rounded-xl bg-red-500">
                Çıkış Yap
              </button>

            </div>
          </div>
        )}

        {/* ADD NOTE BUTTON */}
        <button
          onClick={() => {
            selectModeRef.current = true;
            setSelectMode(true);
          }}
          className="
            fixed
            right-6
            bottom-0
            pb-[env(safe-area-inset-bottom)]
            mb-6
            z-[9999]
            w-16 h-16
            rounded-full
            bg-purple-500
            text-white text-4xl
            flex items-center justify-center
            shadow-xl
          "
        >
          +
        </button>
        {/* BACKDROP OVERLAY */}
          {showCard && (
            <div
              className="fixed inset-0 z-[9998] bg-black/20"
              onClick={resetCard}
            />
          )}

        {/* NOTE CARD */}
        {showCard && (
          <div className="fixed left-1/2 -translate-x-1/2
            bottom-[calc(1rem+env(safe-area-inset-bottom))]
            w-[90%] max-w-md
            p-5
            rounded-xl
            bg-[rgba(10,10,25,0.95)]
            z-[9999]
            text-white">

            <h2 className="text-xl mb-3">
              {editingNote ? "Notu Düzenle" : "Yeni Not"}
            </h2>

            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Notun..."
              className="w-full p-3 rounded bg-white/10 mb-3"
            />

            {/* TYPE SEÇİMİ */}
            {!editingNote && (
              <div className="flex gap-4 mb-3">
                <label>
                  <input
                    type="radio"
                    checked={noteType === "public"}
                    onChange={() => setNoteType("public")}
                  /> Public
                </label>

                <label>
                  <input
                    type="radio"
                    checked={noteType === "private"}
                    onChange={() => setNoteType("private")}
                  /> Private
                </label>
              </div>
            )}

            {/* ANONİM SEÇENEĞİ */}
            <div className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
              />
              <span className="text-sm">Anonim olarak paylaş</span>
            </div>


            {/* PRIVATE USER INPUT */}
            {noteType === "private" && !editingNote && (
              <div className="mb-3">
                <div className="flex gap-2">
                  <input
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Kullanıcı adı"
                    className="flex-1 p-2 bg-white/10 rounded"
                  />
                  <button onClick={addAllowedUser} className="px-4 bg-purple-500 rounded">
                    Ekle
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {allowedUsernames.map((u, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-600 rounded-full text-sm">
                      {u}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={editingNote ? updateNote : saveNote}
                className="flex-1 py-2 bg-purple-500 rounded"
              >
                {editingNote ? "Güncelle" : "Kaydet"}
              </button>

              <button
                onClick={resetCard}
                className="py-2 px-4 bg-white/20 rounded"
              >
                İptal
              </button>

              {editingNote && (
                <button
                  onClick={async () => {
                    await deleteDoc(doc(db, "notes", editingNote.id));
                    resetCard();
                    reloadMarkers();
                  }}
                  className="py-2 px-4 bg-red-500 rounded"
                >
                  Sil
                </button>
              )}
            </div>

          </div>
        )}
      {/* ARAMA PANELI*/}
      {showSearch && (
      <div className="fixed inset-0 z-[9999] bg-black/30">
        <div
          className="
            fixed
            top-20 left-4
            w-[85%] max-w-sm
            bg-[rgba(10,10,25,0.97)]
            rounded-xl
            p-4
          "
          onClick={(e) => e.stopPropagation()}
        >
          <input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Bir yer ara..."
            className="w-full p-2 rounded bg-white/10 text-white mb-3"
            onKeyDown={(e) => {
              if (e.key === "Enter") searchLocation();
            }}
          />

          <div className="flex gap-2">
            <button
              onClick={searchLocation}
              className="flex-1 py-2 bg-purple-500 rounded"
            >
              Git
            </button>

            <button
              onClick={() => setShowSearch(false)}
              className="px-4 py-2 bg-white/20 rounded"
            >
              İptal
            </button>
          </div>
        </div>
      </div>
    )}

      
      {/* BENİM NOTLARIM PANELİ */}
      {showMyNotes && (
        <div className="fixed inset-0 z-[9999] bg-black/40">
          <div
            className="
              fixed
              left-1/2 -translate-x-1/2
              bottom-[calc(1rem+env(safe-area-inset-bottom))]
              z-[10000]
              w-[90%] max-w-md
              bg-[rgba(10,10,25,0.97)]
              rounded-2xl
              p-5
              max-h-[60vh]
              overflow-y-auto
            "
          >

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-white">Benim Notlarım</h2>
              <button
                onClick={() => setShowMyNotes(false)}
                className="text-white/70 text-sm"
              >
                Kapat
              </button>
            </div>

            {myNotes.length === 0 && (
              <p className="text-gray-400 text-sm">
                Henüz not eklemedin.
              </p>
            )}

            <div className="flex flex-col gap-3">
              {myNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg bg-white/10 text-white"
                  onClick={() => {
                    setEditingNote(note);
                    setNoteText(note.text);
                    setNoteType(note.type);
                    setAllowedUsernames(note.allowedUsernames || []);
                    setShowMyNotes(false);
                    setShowCard(true);
                  }}
                >
                  <p className="text-sm mb-1">{note.text}</p>
                  <p className="text-xs text-gray-400">
                    {formatDateTime(
                      note.createdAt?.toDate
                        ? note.createdAt.toDate()
                        : new Date(note.createdAt)
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
    );
}  