import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export default async function proxy(request: NextRequest) {
  // First, run the i18n middleware to get the locale-aware response
  const intlResponse = createMiddleware(routing)(request);

  // Create a Supabase client that reads cookies from the request
  // and writes updated auth cookies to the i18n response
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: any[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            intlResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the auth token — this triggers setAll if cookies need updating
  await supabase.auth.getUser();

  return intlResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
