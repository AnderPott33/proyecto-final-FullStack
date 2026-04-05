export default function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">

      <div className="flex flex-col items-center gap-4
                        px-8 py-6 rounded-2xl">

        {/* Spinner moderno */}
        <div className="w-12 h-12 border-4 border-t-transparent border-[#35b9ac] rounded-full animate-spin"></div>

        {/* Texto */}
        <span className="text-gray-800 font-semibold text-sm animate-pulse">
        </span>

      </div>
    </div>
  );
}