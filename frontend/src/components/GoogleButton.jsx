export default function GoogleButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 mt-4 rounded-xl flex items-center justify-center gap-3
                 bg-[rgba(255,255,255,0.08)]
                 border border-[rgba(200,180,255,0.35)]
                 text-[#E4DAFF]
                 hover:bg-[rgba(255,255,255,0.12)]
                 transition"
    >
      <img
        src="https://www.svgrepo.com/show/475656/google-color.svg"
        alt="Google Logo"
        className="w-6 h-6"
      />
      <span>Google ile devam et</span>
    </button>
  );
}

