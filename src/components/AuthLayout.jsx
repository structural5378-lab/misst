import React from "react";
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top branding bar */}
      <div className="w-full bg-violet-950/80 border-b border-violet-500/20 px-4 py-2 flex items-center justify-center">
        <span className="text-xs font-bold tracking-[0.2em] text-violet-300 uppercase">INSOMNIACSGMRS.COM</span>
      </div>

      <div className="flex-1 flex flex-col px-5 pt-8 pb-10 max-w-lg mx-auto w-full">
        {/* Logo + heading */}
        <div className="flex flex-col items-start mb-8">
          <img
            src="https://media.base44.com/images/public/6a24d788be1af31b2258fab2/5e4366214_insomniacsgmrslogo.png"
            alt="Insomniacs GMRS"
            className="w-16 h-16 object-contain mb-4"
          />
          <h1 className="text-3xl font-bold text-foreground leading-tight">{title}</h1>
          {subtitle && <p className="text-base text-muted-foreground mt-1 leading-snug">{subtitle}</p>}
        </div>

        {/* Form card */}
        <div className="bg-card rounded-2xl border border-border/50 p-5 shadow-xl">
          {children}
        </div>

        <p className="text-center text-xs text-muted-foreground/40 mt-8">
          Stay Connected. Build Community.
        </p>
      </div>
    </div>
  );
}