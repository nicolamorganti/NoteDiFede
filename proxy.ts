import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  // updateSession gestisce il refresh del token e la protezione base delle rotte.
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Applica il middleware a tutte le richieste, eccetto:
    // - _next/static (file statici)
    // - _next/image (immagini)
    // - favicon.ico (icona)
    // - immagini e font generici
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
