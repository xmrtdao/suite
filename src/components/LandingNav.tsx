import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { SuiteLogo } from '@/components/SuiteLogo';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, LogIn, Sparkles, Shield, FileText } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export function LandingNav() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // API key is the only sign-in method, and the field lives on this page.
  // Land the user on it rather than opening a dialog with nothing in it.
  const goToApiKeyField = () => {
    const isLanding = location.pathname === '/suite/' || location.pathname === '/suite';
    if (!isLanding) {
      navigate('/');
      return;
    }
    // The form renders twice, once per breakpoint, so pick the visible one.
    const fields = Array.from(
      document.querySelectorAll<HTMLInputElement>('[data-api-key-input]')
    );
    const field = fields.find((f) => f.offsetParent !== null) ?? fields[0];
    if (!field) return;
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
    field.focus();
  };

  const handleGetStarted = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    goToApiKeyField();
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <SuiteLogo size="md" />

          <div className="flex items-center gap-3">
            {/* Language Toggle */}
            <LanguageToggle />
            
            {/* CTA Button */}
            <Button 
              onClick={handleGetStarted}
              disabled={isSigningIn}
              className="hidden sm:flex"
              size="sm"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isAuthenticated ? 'Go to Dashboard' : 'Start Free Trial'}
            </Button>

            {/* Hamburger Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => document.getElementById('executives')?.scrollIntoView({ behavior: 'smooth' })}>
                  {t('nav.council')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' })}>
                  {t('landing.benefits.title')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                  {t('landing.how.title')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/privacy')}>
                  <Shield className="w-4 h-4 mr-2" />
                  {t('footer.privacy')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/terms')}>
                  <FileText className="w-4 h-4 mr-2" />
                  {t('footer.terms')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAuthenticated ? (
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {t('button.dashboard')}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={goToApiKeyField}>
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign in with API key
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}
