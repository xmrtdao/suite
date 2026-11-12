import { Outlet } from "react-router-dom";
import { MobileNavTrigger, MobileNavOverlay } from "@/components/MobileNav";
import { DesktopNav } from "@/components/DesktopNav";
import { Footer } from "@/components/Footer";
import { UserMenu } from "@/components/UserMenu";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/contexts/LanguageContext";
import { Activity } from "lucide-react";
import { useState } from "react";

export const AppLayout = () => {
  const { t } = useLanguage();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <MobileNavOverlay isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
      
      {/* Persistent Header */}
      <header className="border-b border-border/60 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Suite</h1>
              <span className="text-[10px] font-medium text-muted-foreground/70 uppercase tracking-widest">
                beta
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <DesktopNav />

            {/* Status Indicators & User Menu */}
            {/* These appear at lg, not md. The desktop nav and this group were
                both md, and together they are wider than a 768–907px viewport:
                the brand (84) + 5 nav links (559) + this group (240) = 883px in
                a 737px row, so the whole page gained a horizontal scrollbar and
                the language toggle and avatar were pushed off the right edge.
                Below lg the drawer carries the navigation instead. */}
            <div className="hidden lg:flex items-center gap-3">
              {/* The status pair is decoration — the same "Active" state and
                  the same function count are shown in the page body — so it
                  is the first thing to go when the row is tight. */}
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-suite-success animate-pulse" />
                <span>{t('label.active')}</span>
              </div>
              <div className="hidden xl:block w-px h-4 bg-border" />
              <div className="hidden xl:flex items-center gap-1.5 text-xs text-muted-foreground">
                <Activity className="w-3 h-3" />
                <span>120+</span>
              </div>
              <div className="hidden xl:block w-px h-4 bg-border" />
              <LanguageToggle />
              <div className="w-px h-4 bg-border" />
              <UserMenu />
            </div>

            {/* Below lg: the language toggle, the user menu and the drawer
                handle. The toggle and the user menu are hidden at lg+ because
                the desktop group above shows them there. */}
            <div className="flex items-center gap-2">
              <div className="lg:hidden"><LanguageToggle /></div>
              <div className="lg:hidden"><UserMenu /></div>
              <div className="lg:hidden">
                <MobileNavTrigger isOpen={mobileNavOpen} onToggle={() => setMobileNavOpen(!mobileNavOpen)} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Transitions smoothly */}
      <main 
        id="main-content" 
        className="transition-opacity duration-200 ease-in-out"
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
