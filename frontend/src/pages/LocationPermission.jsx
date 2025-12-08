import { useNavigate } from "react-router-dom";

export default function LocationPermission() {
  const navigate = useNavigate();

  const requestPermission = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        console.log("Gerçek konum:", latitude, longitude);

        navigate("/home", {
          state: { latitude, longitude }
        });
      },
      (err) => {
        console.error("Konum hatası:", err);
        alert("Konum alınamadı: " + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 rounded-2xl bg-[rgba(20,23,45,0.55)]">
        <h1 className="text-center text-3xl font-serif text-[#DCD4FF]">
          Konum Erişimi
        </h1>

        <p className="text-[#c9c4ff] text-center mt-4 text-sm">
          Haritayı gösterebilmemiz için konum izni gerekiyor.
        </p>

        <button
          onClick={requestPermission}
          className="w-full py-3 mt-6 rounded-xl bg-[#A390E4] text-white"
        >
          İzin Ver
        </button>
      </div>
    </div>
  );
}
