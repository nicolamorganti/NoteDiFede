"use server";

import { createClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/env";

export async function notifyNewRegistration(userEmail: string, fullName: string) {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn("Notifica salto: RESEND_API_KEY non configurata in .env.local.");
    return { success: false, error: "RESEND_API_KEY non configurata." };
  }

  try {
    const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
    const supabaseServiceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
    
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Recupera tutti i profili che sono 'maestro' o 'responsabile'
    const { data: admins, error: adminErr } = await adminClient
      .from("profiles")
      .select("id")
      .in("role", ["maestro", "responsabile"]);

    if (adminErr) {
      console.error("Errore ricerca amministratori per notifica:", adminErr);
      return { success: false, error: "Errore durante la ricerca degli amministratori." };
    }

    if (!admins || admins.length === 0) {
      console.warn("Nessun amministratore trovato da notificare.");
      return { success: false, error: "Nessun amministratore trovato." };
    }

    // Ottiene gli indirizzi email degli amministratori dall'Auth di Supabase
    const adminEmails: string[] = [];
    for (const admin of admins) {
      const { data: userData, error: userErr } = await adminClient.auth.admin.getUserById(admin.id);
      if (!userErr && userData?.user?.email) {
        adminEmails.push(userData.user.email);
      }
    }

    if (adminEmails.length === 0) {
      console.warn("Nessuna email trovata per gli amministratori.");
      return { success: false, error: "Nessun indirizzo email trovato per gli amministratori." };
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const payload = {
      from: "Note di Fede <onboarding@resend.dev>",
      to: adminEmails,
      subject: "Note di Fede - Nuova registrazione corista",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2dacb; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #735933; border-bottom: 1px solid #f2ede4; padding-bottom: 12px; font-family: Georgia, serif; font-size: 22px; font-weight: normal; margin-top: 0;">Nuovo Corista Registrato</h2>
          <p style="color: #4a3e3d; font-size: 15px; line-height: 1.6;">Un nuovo utente si è registrato sul portale <strong>Note di Fede</strong> ed è in attesa di abilitazione:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #f2ede4; color: #6b5d4e; width: 150px;">Nome e Cognome:</td>
              <td style="padding: 10px; border-bottom: 1px solid #f2ede4; color: #3f3933;">${fullName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #f2ede4; color: #6b5d4e;">Indirizzo Email:</td>
              <td style="padding: 10px; border-bottom: 1px solid #f2ede4; color: #3f3933; font-family: monospace;">${userEmail}</td>
            </tr>
          </table>
          
          <p style="color: #4a3e3d; font-size: 15px; line-height: 1.6;">Puoi accedere alla console delle impostazioni per promuovere l'utente a <strong>Cantore</strong>, sbloccando la riproduzione delle tracce vocali e la generazione del Binder unico PDF.</p>
          
          <div style="margin: 30px 0; text-align: center;">
            <a href="${siteUrl}/impostazioni" style="background-color: #8c6d3f; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 14px; font-weight: bold; border-radius: 8px; display: inline-block; box-shadow: 0 2px 4px rgba(140, 109, 63, 0.15);">
              Apri Gestione Coristi
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #f2ede4; margin: 30px 0 20px 0;" />
          <p style="font-size: 11px; color: #8c7e6b; text-align: center; margin: 0;">Note di Fede - Archivio Musica Liturgica</p>
        </div>
      `
    };

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
        "User-Agent": "NoteDiFede/1.0"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("Errore API Resend:", errText);
      return { success: false, error: `Errore Resend: ${errText}` };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Errore notifica nuova registrazione:", err);
    return { success: false, error: err.message || "Errore sconosciuto." };
  }
}
