export default function AuthCard({ title, children }) {
  return (
    <div className="
    w-full max-w-md mx-auto mt-24 p-8
    rounded-2xl 
    backdrop-blur-xl
    border border-[rgba(167,143,230,0.35)]
    bg-[rgba(20,23,45,0.55)]
    shadow-[0_0_80px_rgba(130,90,255,0.25)]
    transition-all duration-300 hover:shadow-[0_0_120px_rgba(150,110,255,0.35)]
    animate-fade-in
    ">
      <h1 className="text-center text-3xl font-serif text-[#DCD4FF] drop-shadow-lg">
        {title}
      </h1>

      <div className="w-2/3 h-[1px] bg-gradient-to-r from-transparent via-[#A390E4] to-transparent opacity-40 mx-auto my-4"></div>

      {children}
    </div>
  );
}
