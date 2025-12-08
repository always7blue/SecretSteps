export default function InputField({ label, type, value, onChange }) {
  return (
    <div className="mb-4">
      <label className="text-[#DCD4FF] text-sm mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="
          w-full px-4 py-3 
          rounded-lg
          bg-[rgba(255,255,255,0.05)]
          border border-[rgba(255,255,255,0.15)]
          text-white placeholder-gray-400
          focus:outline-none focus:ring-2 focus:ring-[#A390E4] focus:border-transparent
          transition-all duration-200
        "
      />
    </div>
  );
}
