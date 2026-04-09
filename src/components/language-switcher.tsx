'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function LanguageSwitcher() {
  const t = useTranslations('Navigation');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function onSelectChange(value: string) {
    router.replace(pathname, { locale: value });
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectChange("en")}
              className={`flex h-7 w-8 items-center justify-center rounded-md transition-all ${locale === 'en' ? 'bg-background shadow-sm opacity-100' : 'opacity-50 hover:opacity-100 hover:bg-background/50'}`}
            >
              <span className="text-lg leading-none">🇺🇸</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">English</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onSelectChange("pt-BR")}
              className={`flex h-7 w-8 items-center justify-center rounded-md transition-all ${locale === 'pt-BR' ? 'bg-background shadow-sm opacity-100' : 'opacity-50 hover:opacity-100 hover:bg-background/50'}`}
            >
              <span className="text-lg leading-none">🇧🇷</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">Português</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
