import React, { useState } from "react";
import { User } from "lucide-react";
import spendIcon from "../../assets/spendWise.png";
import messiProfile from "../../assets/image.png";
export default function UserNavbar({ title = "Spend Wise" }) {
  const [profileError, setProfileError] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-[#dce7d7] h-16 flex items-center px-8 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-3xl font-serif italic font-semibold text-[#083b22]">
          {title}
        </h1>
        <img
          src={spendIcon}
          alt="Spend Wise"
          className="w-7 h-7 object-contain"
        />
      </div>

      <div className="flex flex-col items-center justify-center ml-auto group">
        <div className="relative">
          <span className="absolute inset-0 rounded-full bg-emerald-400/30 blur-sm scale-110 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition duration-300" />
          <div className="relative w-9 h-9 rounded-full bg-white/40 border border-[#083b22]/20 flex items-center justify-center text-[#083b22] shadow-sm overflow-hidden transition duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:bg-white/70">
            {profileError ? (
              <User className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
            ) : (
              <img
                src={messiProfile}
                alt="Profile"
                className="w-full h-full object-cover"
                onError={() => setProfileError(true)}
              />
            )}
          </div>
        </div>
        <p className="mt-1 text-[11px] text-[#083b22] font-medium leading-none max-w-[80px] truncate">
          User
        </p>
      </div>
    </header>
  );
}
