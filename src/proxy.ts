import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';
import { type NextRequest } from 'next/server';

export default async function proxy(request: NextRequest) {
  // Update Supabase session
  await updateSession(request);
  
  // Handle i18n
  return createMiddleware(routing)(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
