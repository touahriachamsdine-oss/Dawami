import { AtProfitLogo } from "@/components/icons";
import Image from "next/image";

export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-between min-h-screen bg-[#FDFBF7] p-8 relative overflow-hidden">
            {/* Top Header */}
            <div className="w-full flex items-center justify-between max-w-md mx-auto relative z-10">
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-2 rounded-xl shadow-lg">
                    <AtProfitLogo className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-5xl font-pinyon-script text-slate-800 tracking-wide mt-2">Dawami</h1>
            </div>

            {/* Main Image */}
            <div className="flex-1 flex items-center justify-center w-full relative z-10 my-8">
                <div className="relative w-full max-w-[300px] aspect-[3/5]">
                    <Image
                        src="/worker-saluting.png"
                        alt="Construction Worker Saluting"
                        fill
                        className="object-contain drop-shadow-2xl"
                        priority
                    />
                    {/* Floor shadow effect */}
                    <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-black/10 blur-xl rounded-full"></div>
                </div>
            </div>

            {/* Footer Quote */}
            <div className="max-w-xs text-center relative z-10 mb-12">
                <p className="font-pinyon-script text-2xl text-slate-700 leading-normal">
                    Confirmed commitment and <br /> appreciated effort.
                    <span className="text-slate-400">”</span>
                </p>
            </div>

            {/* Bottom decoration (Blue splash placeholder) */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="absolute -bottom-32 -left-20 w-72 h-72 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none"></div>
        </div>
    );
}
