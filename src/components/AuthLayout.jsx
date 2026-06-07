import React from "react";
import { Radio } from "lucide-react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          {/* Mist Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Radio className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">MIST</h2>
            <p className="text-xs text-primary font-semibold tracking-widest mt-1">GMRS COMMUNITY</p>
          </div>
          
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-1">{subtitle}</p>}
        </div>
        <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-6">
          {children}
        </div>
        {footer && (
          <p className="text-center text-sm text-muted-foreground mt-6">{footer}</p>
        )}
        <p className="text-center text-xs text-muted-foreground/50 mt-8">
          Stay Connected. Build Community.
        </p>
      </div>
    </div>
  );
}