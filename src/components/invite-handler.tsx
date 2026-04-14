"use client"

import { useEffect } from "react"

export function InviteHandler() {
  useEffect(() => {
    // Check if we have an invite_token cookie
    const hasInviteCookie = document.cookie.split(";").some((item) => item.trim().startsWith("invite_token="));
    
    if (hasInviteCookie) {
      // Small delay to ensure the layout had time to process the "auto-accept" 
      // which happens on the server before this client component hydrates.
      const timer = setTimeout(() => {
        // Clear the cookie client-side
        document.cookie = "invite_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        console.log("[InviteHandler] Cleared invite_token cookie");
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, []);

  return null;
}
