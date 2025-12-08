export default function PrimaryButton({ text, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full py-3 mt-4 rounded-lg
        bg-gradient-to-r from-[#7A3FFF] to-[#C084FC]
        text-white font-semibold tracking-wide
        shadow-[0_0_20px_rgba(150,110,255,0.35)]
        hover:opacity-90 active:scale-[0.97]
        transition
      "
    >
      {text}
    </button>
  );
}
