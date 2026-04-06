export default function Loader() {
  return (
    <div className="
      fixed inset-0 z-[9999] 
      flex items-center justify-center
      bg-[#0f172a] backdrop-blur-md
      animate-fadeIn
    ">
      <div className="
        flex flex-col items-center gap-5
        px-10 py-8 
        rounded-2xl
        bg-[#0f172a]/50
        border border-white/10
        shadow-2xl
      ">
        
        {/* Spinner moderno (dual ring) */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-white/10"></div>
          <div className="
            absolute inset-0 rounded-full border-4 
            border-t-[#35b9ac] border-r-[#35b9ac]
            animate-spin
          "></div>

          {/* Glow effect */}
          <div className="
            absolute inset-0 rounded-full
            shadow-[0_0_15px_rgba(53,185,172,0.6)]
          "></div>
        </div>

        {/* Texto */}
        <span className="
          text-white/80 
          text-sm 
          tracking-wide 
          animate-pulse
        ">
          Cargando...
        </span>
      </div>
    </div>
  );
}