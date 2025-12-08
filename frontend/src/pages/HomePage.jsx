import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer, Marker } from "react-leaflet";

export default function HomePage() {
  const location = useLocation();
  const { latitude, longitude } = location.state || {};

  if (!latitude || !longitude) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white">
        Konum bilgisi bulunamadı. Lütfen izin verin.
      </div>
    );
  }

  return (
    <div className="w-full h-screen">
      <MapContainer
        center={[latitude, longitude]}
        zoom={17}
        style={{ width: "100%", height: "100%" }}
      >
        {/* Soft Apple Maps style */}
        <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />

        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}

