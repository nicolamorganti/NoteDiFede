const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.resolve(__dirname, "../.env.local");
let envContent = "";
try {
  envContent = fs.readFileSync(envPath, "utf-8");
} catch (e) {
  console.error("Non sono riuscito a leggere il file .env.local", e);
  process.exit(1);
}

const env = {};
envContent.split("\n").forEach((line) => {
  const parts = line.split("=");
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join("=").trim();
  }
});

const supabaseUrl = env["NEXT_PUBLIC_SUPABASE_URL"];
const supabaseServiceKey = env["SUPABASE_SERVICE_ROLE_KEY"];

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function inspect() {
  const { data, error } = await supabase.from("songs").select("*").limit(1);
  if (error) {
    console.error("Errore recupero canto:", error);
    process.exit(1);
  }
  if (data && data.length > 0) {
    console.log("Colonne nella tabella songs:", Object.keys(data[0]));
  } else {
    console.log("Nessun canto trovato per ispezionare le colonne, provo a inserire un record temporaneo...");
    const { data: inserted, error: insertError } = await supabase.from("songs").insert({ title: "Ispezione Temporanea" }).select("*");
    if (insertError) {
      console.error("Errore inserimento temporaneo:", insertError);
    } else if (inserted && inserted.length > 0) {
      console.log("Colonne nella tabella songs (dal record inserito):", Object.keys(inserted[0]));
      // cancella il record temporaneo
      await supabase.from("songs").delete().eq("id", inserted[0].id);
    }
  }
}

inspect();
