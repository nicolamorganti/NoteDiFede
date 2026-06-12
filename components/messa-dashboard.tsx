"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { MassDetails } from "@/lib/masses";
import { parseNotesAndLyrics } from "@/lib/songs";
import { supabase } from "@/lib/supabase/client";

type MessaDashboardProps = {
  massDetails: MassDetails;
};

type ActiveAudioTrack = {
  songTitle: string;
  partLabel: string;
  url: string;
};

type DashboardFile = {
  id: string;
  fileName: string;
  fileType: string;
  previewHref: string;
  fileLabel: string;
};

export function MessaDashboard({ massDetails }: MessaDashboardProps) {
  // Stati Auth
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      }
      setAuthLoading(false);
    }
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setCurrentUser(session.user);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
        if (profile) {
          setUserRole(profile.role);
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = currentUser !== null && (userRole === "maestro" || userRole === "responsabile");
  const isAuthorizedForRestrictedContent = currentUser !== null && (userRole === "cantore" || userRole === "maestro" || userRole === "responsabile");

  // Stati PDF e Audio
  const [previewPdf, setPreviewPdf] = useState<{ title: string; url: string; fileName: string } | null>(null);
  const [activeTrack, setActiveTrack] = useState<ActiveAudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Stato Modale Report
  const [modalReport, setModalReport] = useState(false);
  const [reportFormat, setReportFormat] = useState<"links" | "lyrics" | "binder">("binder");
  const [copied, setCopied] = useState(false);
  const [isGeneratingBinder, setIsGeneratingBinder] = useState(false);
  const [binderError, setBinderError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Formatta la data
  const formattedDate = new Intl.DateTimeFormat("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(massDetails.celebrationDate));

  // Gestione Player Audio
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, activeTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleTrackSelect = (songTitle: string, file: DashboardFile) => {
    if (!isAuthorizedForRestrictedContent) return;
    const fileUrl = `/api/song-files/${file.id}?disposition=inline`;
    setActiveTrack({
      songTitle,
      partLabel: file.fileName,
      url: fileUrl,
    });
    setIsPlaying(true);
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Generatore di Report
  const generateReportText = () => {
    const lines: string[] = [];
    lines.push(`📖 REPORT CELEBRAZIONE: ${massDetails.title.toUpperCase()}`);
    lines.push(`📅 Data: ${formattedDate} (Anno ${massDetails.liturgicalYear})`);
    if (massDetails.notes) {
      lines.push(`📝 Note: ${massDetails.notes}`);
    }
    lines.push(`\n--------------------------------------------\n`);

    if (reportFormat === "links") {
      lines.push(`🎵 SCALETTA DEI CANTI E RISORSE DI STUDIO:`);
      massDetails.moments.forEach(({ moment, songs }) => {
        if (songs.length === 0) return;
        lines.push(`\n📍 ${moment.sortOrder}. ${moment.name.toUpperCase()}:`);
        songs.forEach(({ song }) => {
          const codePrefix = song.code ? `[${song.code}] ` : "";
          lines.push(`  - ${codePrefix}${song.title}`);
          
          // Risorse esterne
          song.links.forEach((link) => {
            lines.push(`    🔗 Youtube: ${link.url}`);
          });
        });
      });
    } else if (reportFormat === "lyrics") {
      lines.push(`📖 TESTI E NOTE DEI CANTI:`);
      massDetails.moments.forEach(({ moment, songs }) => {
        if (songs.length === 0) return;
        lines.push(`\n📍 ${moment.sortOrder}. ${moment.name.toUpperCase()}:`);
        songs.forEach(({ song }) => {
          const codePrefix = song.code ? `[${song.code}] ` : "";
          lines.push(`\n  --- ${codePrefix}${song.title} ---`);
          
          // Aggiunge i link di riferimento
          song.links.forEach((link) => {
            lines.push(`  🔗 Youtube: ${link.url}`);
          });

          const { notes, lyrics } = parseNotesAndLyrics(song.notes);
          if (notes) lines.push(`  📝 Note: ${notes}`);
          if (lyrics) lines.push(`  📖 Testo:\n${lyrics.split("\n").map(l => "    " + l).join("\n")}`);
        });
      });
    }
    return lines.join("\n");
  };

  const handleCopyReport = () => {
    const text = generateReportText();
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const title = `Note di Fede - ${massDetails.title}`;
    const dateStr = formattedDate;
    const yearStr = massDetails.liturgicalYear;

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@400;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap');
          body {
            font-family: 'Inter', sans-serif;
            color: #2b2b2b;
            line-height: 1.6;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
          }
          h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px;
            font-weight: normal;
            margin-bottom: 5px;
            color: #3f3933;
          }
          .metadata {
            font-size: 13px;
            color: #736555;
            font-weight: 600;
            margin-bottom: 30px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            border-bottom: 2px solid #eae2d5;
            padding-bottom: 10px;
          }
          .moment-section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          .moment-title {
            font-family: 'Outfit', sans-serif;
            font-size: 16px;
            font-weight: 700;
            color: #8a755d;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 10px;
            border-bottom: 1px solid #f0e8dd;
            padding-bottom: 4px;
          }
          .song-block {
            margin-left: 15px;
            margin-bottom: 20px;
          }
          .song-header-row {
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 8px;
          }
          .song-header {
            font-size: 15px;
            font-weight: 700;
            color: #3f3933;
          }
          .song-code {
            display: inline-block;
            background: #f4efe6;
            color: #736555;
            padding: 2px 6px;
            font-size: 11px;
            border-radius: 4px;
            font-weight: bold;
          }
          .links-container {
            margin-top: 5px;
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
          }
          .song-link {
            font-size: 12px;
            color: #b30000;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            font-weight: 600;
          }
          .song-link:hover {
            text-decoration: underline;
          }
          .notes {
            font-size: 12px;
            color: #666;
            margin-top: 8px;
            font-style: italic;
            background: #faf8f5;
            padding: 8px 12px;
            border-radius: 8px;
            border-left: 3px solid #ebdccb;
          }
          .lyrics {
            font-family: monospace;
            font-size: 11px;
            color: #444;
            white-space: pre-wrap;
            margin-top: 10px;
            background: #fcfbfa;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #efeae0;
            line-height: 1.6;
          }
          @media print {
            body {
              padding: 0;
            }
            .song-link {
              color: #0000ee;
            }
          }
        </style>
      </head>
      <body>
        <h1>${massDetails.title}</h1>
        <div class="metadata">
          Domenica ${dateStr} &bull; Anno ${yearStr} &bull; Archivio Note di Fede
        </div>
    `;

    if (massDetails.notes) {
      htmlContent += `
        <div style="margin-bottom: 30px; font-size: 13px; color: #555; background: #fdfcfb; padding: 15px; border-radius: 12px; border: 1px dashed #e4dcce;">
          <strong>Indicazioni Celebrazione:</strong><br>${massDetails.notes.replace(/\n/g, "<br>")}
        </div>
      `;
    }

    massDetails.moments.forEach(({ moment, songs }) => {
      if (songs.length === 0) return;
      htmlContent += `
        <div class="moment-section">
          <div class="moment-title">${moment.sortOrder}. ${moment.name}</div>
      `;

      songs.forEach(({ song }) => {
        const { notes, lyrics } = parseNotesAndLyrics(song.notes);
        const codeSpan = song.code ? `<span class="song-code">${song.code}</span>` : "";
        
        htmlContent += `
          <div class="song-block">
            <div class="song-header-row">
              ${codeSpan}
              <span class="song-header">${song.title}</span>
            </div>
        `;

        if (reportFormat === "links" || reportFormat === "lyrics") {
          if (song.links.length > 0) {
            htmlContent += `<div class="links-container">`;
            song.links.forEach((link) => {
              htmlContent += `
                <a href="${link.url}" target="_blank" class="song-link">
                  &bull; YouTube: ${link.label}
                </a>
              `;
            });
            htmlContent += `</div>`;
          }
        }

        if (reportFormat === "lyrics") {
          if (notes) {
            htmlContent += `<div class="notes"><strong>Nota Canto:</strong> ${notes}</div>`;
          }
          if (lyrics) {
            htmlContent += `<div class="lyrics">${lyrics}</div>`;
          }
        }

        htmlContent += `
          </div>
        `;
      });

      htmlContent += `
        </div>
      `;
    });

    htmlContent += `
      </body>
      <script>
        window.onload = function() {
          window.print();
        }
      </script>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDownloadBinder = async () => {
    setIsGeneratingBinder(true);
    setBinderError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || "";

      const res = await fetch(`/api/masses/${massDetails.id}/binder`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Errore durante la generazione del binder.");
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = res.headers.get("content-disposition");
      let filename = `Messa_${massDetails.title}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
      }
      
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      setBinderError(err.message || "Impossibile scaricare il file. Riprova.");
    } finally {
      setIsGeneratingBinder(false);
    }
  };

  return (
    <div className="space-y-8 pb-32">
      {/* Intestazione */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#e4dcce] pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/messe"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa9576] hover:text-[#5c4a37] uppercase tracking-wider transition"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Elenco Messe</span>
            </Link>
            <span className="text-[#aa9576]/30">|</span>
            <span className="rounded-full bg-[#f4efe6] px-2 py-0.5 text-[10px] font-bold text-[#736555] uppercase tracking-wide">
              Anno {massDetails.liturgicalYear}
            </span>
          </div>

          <h2 className="font-serif text-3xl font-normal text-[#3f3933]">
            {massDetails.title}
          </h2>
          <p className="text-sm text-[#736555] capitalize">
            {formattedDate}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalReport(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#d9cdbf] bg-white px-5 py-3 text-sm font-semibold text-[#5c4a37] shadow-sm transition hover:bg-[#fdfbf7] hover:border-[#aa9576] active:scale-[0.98]"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Esporta / Stampa</span>
          </button>

          {isAdmin && (
            <Link
              href={`/messe/${massDetails.id}/modifica`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5c4a37] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5c4a37]/10 transition hover:bg-[#4b3c2c] active:scale-[0.98]"
            >
              <span>Componi Messa</span>
            </Link>
          )}
        </div>
      </div>

      {/* Note Celebrazione se presenti */}
      {massDetails.notes && (
        <div className="rounded-3xl border border-[#e4dcce] bg-[#fbf9f5] p-5 shadow-inner max-w-4xl">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#aa9576] mb-2">Avvisi / Indicazioni della Celebrazione:</h4>
          <p className="text-sm text-[#5c4a37] leading-relaxed whitespace-pre-line">{massDetails.notes}</p>
        </div>
      )}

      {/* Scaletta Celebrazione */}
      <div className="space-y-6 max-w-4xl">
        {massDetails.moments.map(({ moment, songs }) => {
          if (songs.length === 0) return null;

          return (
            <div
              key={moment.id}
              className="grid gap-4 rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-5 shadow-sm sm:p-6"
            >
              {/* Riga Intestazione Momento */}
              <div className="flex items-center gap-3 border-b border-[#e4dcce]/30 pb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f4efe6] text-xs font-bold text-[#736555] shadow-inner">
                  {moment.sortOrder}
                </span>
                <h3 className="font-serif text-lg font-normal text-[#3f3933]">
                  {moment.name}
                </h3>
              </div>

              {/* Lista dei canti */}
              <div className="space-y-4">
                {songs.map((massSong) => {
                  const song = massSong.song;
                  const { notes, lyrics } = parseNotesAndLyrics(song.notes);

                  // Estrae tutti i file audio dalle varianti
                  const audioFiles: (DashboardFile & { key?: string | null; arrName?: string | null })[] = [];
                  song.arrangements.forEach((arr) => {
                    arr.files.forEach((file: DashboardFile) => {
                      if (file.fileType.startsWith("mp3_")) {
                        audioFiles.push({ ...file, key: arr.musicalKey, arrName: arr.arrangementName });
                      }
                    });
                  });

                  return (
                    <div key={massSong.id} className="rounded-2xl border border-[#e4dcce]/40 bg-[#fdfbf7] p-4 space-y-4">
                      {/* Dettagli Canto */}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex items-center gap-3">
                          {song.code && (
                            <span className="rounded-lg bg-[#efe4d2] px-2.5 py-0.5 text-xs font-bold text-[#8c7a65]">
                              {song.code}
                            </span>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-[#3f3933]">
                              {song.title}
                            </h4>
                            {song.alternateTitle && (
                              <p className="text-xs text-[#736555] italic">
                                {song.alternateTitle}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Spartiti / Accordi PDF */}
                      {song.arrangements.length > 0 && (
                        <div className="space-y-2 border-t border-[#e4dcce]/30 pt-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576] block">Documenti e Spartiti:</span>
                          <div className="flex flex-wrap gap-2">
                            {song.arrangements.map((arr) => 
                              arr.files.map((file: DashboardFile) => {
                                if (file.fileType.endsWith("_pdf")) {
                                  const displayLabel = arr.musicalKey 
                                    ? `${file.fileLabel} (in ${arr.musicalKey})` 
                                    : file.fileLabel;
                                  return (
                                    <button
                                      key={file.id}
                                      onClick={() => setPreviewPdf({ title: `${song.title} - ${displayLabel}`, url: file.previewHref, fileName: file.fileName })}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cdbf] bg-white px-3.5 py-2 text-xs font-semibold text-[#5c4a37] shadow-sm hover:bg-[#fdfbf7] transition"
                                    >
                                      <svg className="h-3.5 w-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span>{displayLabel}</span>
                                    </button>
                                  );
                                }
                                return null;
                              })
                            )}
                          </div>
                        </div>
                      )}

                      {/* Tracce Audio di Studio MP3 */}
                      {audioFiles.length > 0 && (
                        <div className="space-y-2 border-t border-[#e4dcce]/30 pt-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576] block">Studio Parti (Voci Separate MP3):</span>
                          {isAuthorizedForRestrictedContent ? (
                            <div className="flex flex-wrap gap-2">
                              {audioFiles.map((file) => {
                                const trackLabel = file.key ? `${file.fileName} (${file.key})` : file.fileName;
                                const isActive = activeTrack?.url === `/api/song-files/${file.id}?disposition=inline`;
                                return (
                                  <button
                                    key={file.id}
                                    onClick={() => handleTrackSelect(song.title, file)}
                                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold shadow-sm transition border ${
                                      isActive
                                        ? "bg-[#5c4a37] text-[#fffdfa] border-[#5c4a37]"
                                        : "bg-[#fffdfa] text-[#736555] border-[#d9cdbf] hover:bg-[#fdfbf7]"
                                    }`}
                                  >
                                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <span>{trackLabel}</span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2 opacity-50">
                                {audioFiles.map((file) => {
                                  const trackLabel = file.key ? `${file.fileName} (${file.key})` : file.fileName;
                                  return (
                                    <div
                                      key={file.id}
                                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cdbf] bg-[#fffdfa] px-3.5 py-2 text-xs font-semibold text-[#736555] cursor-not-allowed"
                                    >
                                      <svg className="h-3.5 w-3.5 text-[#aa9576]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                      <span>{trackLabel}</span>
                                    </div>
                                  );
                                })}
                              </div>
                              <p className="text-[10px] text-[#b35959] italic font-semibold">
                                {currentUser
                                  ? "🔒 Tracce riservate: il tuo account è in attesa di abilitazione come Cantore."
                                  : "🔒 Tracce riservate: effettua l'accesso per sbloccare il materiale di studio."}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Link Esterni (YouTube / Tutorial) */}
                      {song.links.length > 0 && (
                        <div className="space-y-2 border-t border-[#e4dcce]/30 pt-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576] block">Link di Riferimento Esterni:</span>
                          <div className="flex flex-wrap gap-2">
                            {song.links.map((link) => (
                              <a
                                key={link.id}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-full border border-[#d9cdbf] bg-white px-3.5 py-2 text-xs font-semibold text-[#736555] shadow-sm hover:bg-[#fdfbf7] transition"
                              >
                                {link.provider === "youtube" ? (
                                  <span className="text-red-500 font-bold">YT</span>
                                ) : (
                                  <svg className="h-3.5 w-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                )}
                                <span>{link.label}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Note liturgiche e Testo (Lyrics) */}
                      {(notes || lyrics) && (
                        <div className="grid gap-3 md:grid-cols-2 border-t border-[#e4dcce]/30 pt-3">
                          {notes && (
                            <div className="text-xs text-[#736555] bg-[#fffdfa] p-3 rounded-xl border border-[#e4dcce]/20">
                              <span className="font-semibold text-[#8a755d] uppercase block mb-1">Nota Canto:</span>
                              <p className="leading-relaxed whitespace-pre-line">{notes}</p>
                            </div>
                          )}
                          {lyrics && (
                            <div className="text-xs text-[#736555] bg-[#fbf9f5] p-3 rounded-xl border border-[#e4dcce]/20 max-h-48 overflow-y-auto whitespace-pre-line font-mono">
                              <span className="font-semibold text-[#8a755d] uppercase block mb-1 font-sans">Testo del canto:</span>
                              {lyrics}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Riferimento audio invisibile per riproduzione */}
      {activeTrack && (
        <audio
          ref={audioRef}
          src={activeTrack.url}
          onTimeUpdate={() => {
            if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) setDuration(audioRef.current.duration);
          }}
          onEnded={() => setIsPlaying(false)}
        />
      )}

      {/* ========================================================================= */}
      {/* PLAYER AUDIO FLUTTUANTE (STICKY PLAYER IN BASSO) */}
      {/* ========================================================================= */}
      {activeTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#d9cdbf] bg-[#fffdfa]/95 px-4 py-4 backdrop-blur shadow-2xl transition-all duration-300 md:px-6">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Info Brano Attivo */}
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576]">Esercizio Parti Corali</span>
              <div className="flex items-center gap-2">
                <h4 className="truncate font-semibold text-[#3f3933] text-sm md:text-base">
                  {activeTrack.songTitle}
                </h4>
                <span className="hidden rounded-full bg-[#f4efe6] px-2 py-0.5 text-[10px] font-bold text-[#736555] sm:inline truncate">
                  {activeTrack.partLabel}
                </span>
              </div>
            </div>

            {/* Slider Durata */}
            <div className="flex flex-1 items-center gap-3 w-full md:max-w-xl">
              <span className="text-xs font-mono text-[#8c7e6c]">{formatTime(currentTime)}</span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={(e) => {
                  const time = parseFloat(e.target.value);
                  setCurrentTime(time);
                  if (audioRef.current) audioRef.current.currentTime = time;
                }}
                className="h-1.5 flex-1 cursor-pointer rounded-full bg-[#eadcc8] accent-[#5c4a37]"
              />
              <span className="text-xs font-mono text-[#8c7e6c]">{formatTime(duration)}</span>
            </div>

            {/* Controlli Audio */}
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handlePlayPause}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5c4a37] text-white shadow-md hover:bg-[#4b3c2c] transition active:scale-[0.95]"
              >
                {isPlaying ? (
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </button>

              {/* Regolazione Volume */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="rounded-full p-1.5 text-[#736555] hover:bg-[#f4efe6] transition"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 18.75V5.25L7.75 9.5H4.5v5h3.25L12 18.75z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const vol = parseFloat(e.target.value);
                    setVolume(vol);
                    if (vol > 0) setIsMuted(false);
                  }}
                  className="w-16 h-1 cursor-pointer rounded-full bg-[#eadcc8] accent-[#5c4a37] sm:w-20"
                />
              </div>

              {/* Chiudi Player */}
              <button
                onClick={() => {
                  setActiveTrack(null);
                  setIsPlaying(false);
                }}
                className="rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] hover:text-[#3f3933] transition"
                title="Chiudi Player"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: VISUALIZZATORE PDF SPARITITI */}
      {/* ========================================================================= */}
      {previewPdf && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm md:p-6">
          <div className="flex h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#e4dcce] bg-[#fffdfa] shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#e4dcce] px-6 py-4">
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576]">
                  {(() => {
                    const ext = previewPdf.fileName.substring(previewPdf.fileName.lastIndexOf(".")).toLowerCase();
                    if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) return "Anteprima Immagine";
                    if ([".doc", ".docx", ".odt", ".rtf", ".txt"].includes(ext)) return "Anteprima Documento";
                    return "Anteprima PDF";
                  })()}
                </span>
                <h4 className="font-serif text-lg font-normal text-[#3f3933] truncate" title={previewPdf.title}>
                  {previewPdf.title}
                </h4>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={previewPdf.url}
                  download={previewPdf.fileName}
                  className="rounded-full border border-[#d9cdbf] bg-white px-4 py-2 text-xs font-semibold text-[#5c4a37] transition hover:bg-[#fdfbf7]"
                >
                  Scarica File
                </a>
                <button
                  onClick={() => setPreviewPdf(null)}
                  className="rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] hover:text-[#3f3933] transition"
                  title="Chiudi"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#ede8df] relative p-4 flex items-center justify-center overflow-auto">
              {(() => {
                const ext = previewPdf.fileName.substring(previewPdf.fileName.lastIndexOf(".")).toLowerCase();
                
                // Immagini
                if ([".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
                  return (
                    <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-2 bg-white rounded-2xl border border-[#d9cdbf] shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={previewPdf.url}
                        alt={previewPdf.title}
                        className="max-w-full max-h-[70vh] object-contain rounded-lg"
                      />
                    </div>
                  );
                }
                
                // Documenti Word non visualizzabili nativamente
                if ([".doc", ".docx", ".odt", ".rtf"].includes(ext)) {
                  return (
                    <div className="bg-[#fffdfa] border border-[#e4dcce] rounded-3xl p-8 text-center max-w-md shadow-lg space-y-4">
                      <div className="mx-auto w-16 h-16 bg-[#efe4d2] text-[#8a755d] rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h5 className="font-serif text-lg text-[#3f3933]">Anteprima non disponibile</h5>
                      <p className="text-xs text-[#736555] leading-relaxed">
                        I documenti in formato Word o simili ({ext.toUpperCase()}) non possono essere aperti direttamente all&apos;interno del browser.
                      </p>
                      <a
                        href={previewPdf.url}
                        download={previewPdf.fileName}
                        className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-5 py-2.5 text-xs font-semibold text-white shadow transition hover:bg-[#4b3c2c]"
                      >
                        Scarica e Modifica
                      </a>
                    </div>
                  );
                }

                // File di testo
                if (ext === ".txt") {
                  return (
                    <iframe
                      src={previewPdf.url}
                      className="w-full h-full rounded-2xl border border-[#d9cdbf] shadow-inner bg-white p-4 font-mono text-xs"
                      title="Visualizzazione File di Testo"
                    />
                  );
                }

                // Default: PDF
                return (
                  <iframe
                    src={`${previewPdf.url}#toolbar=0&navpanes=0`}
                    className="w-full h-full rounded-2xl border border-[#d9cdbf] shadow-inner bg-white"
                    title="Visualizzazione PDF"
                  />
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALE: GENERATORE DI REPORT (ESPORTAZIONE / STAMPA) */}
      {/* ========================================================================= */}
      {modalReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-[#e4dcce] bg-[#fffdfa] p-6 shadow-2xl my-8">
            <button
              onClick={() => setModalReport(false)}
              className="absolute top-4 right-4 rounded-full bg-[#f4efe6] p-2 text-[#736555] hover:bg-[#eadcc8] transition"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="space-y-4">
              <div className="border-b border-[#e3d8c9] pb-3">
                <h3 className="text-lg font-serif text-[#3f3933]">Esporta e Condividi Celebrazione</h3>
                <p className="text-xs text-[#736555]">
                  Genera il materiale in formato testuale pronto da copiare, condividere sul gruppo del coro o stampare.
                </p>
              </div>

              {/* Scelta formato */}
              <div className="flex flex-wrap gap-2 bg-[#f6f1ea] p-1.5 rounded-2xl border border-[#e4dcce]/30">
                <button
                  onClick={() => setReportFormat("binder")}
                  className={`flex-1 min-w-[120px] text-center py-2.5 rounded-xl text-xs font-semibold transition ${
                    reportFormat === "binder"
                      ? "bg-white text-[#5c4a37] shadow-sm"
                      : "text-[#736555] hover:text-[#3f3933]"
                  }`}
                >
                  Binder Spartiti (PDF Unico)
                </button>
                <button
                  onClick={() => setReportFormat("links")}
                  className={`flex-1 min-w-[120px] text-center py-2.5 rounded-xl text-xs font-semibold transition ${
                    reportFormat === "links"
                      ? "bg-white text-[#5c4a37] shadow-sm"
                      : "text-[#736555] hover:text-[#3f3933]"
                  }`}
                >
                  Lista Canti con Link
                </button>
                <button
                  onClick={() => setReportFormat("lyrics")}
                  className={`flex-1 min-w-[120px] text-center py-2.5 rounded-xl text-xs font-semibold transition ${
                    reportFormat === "lyrics"
                      ? "bg-white text-[#5c4a37] shadow-sm"
                      : "text-[#736555] hover:text-[#3f3933]"
                  }`}
                >
                  Testi Concatenati (Foglietto)
                </button>
              </div>

              {/* Area di Visualizzazione/Copia */}
              {reportFormat !== "binder" ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#aa9576]">Anteprima Testo Esportato:</span>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleCopyReport}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c4a37] hover:underline"
                      >
                        {copied ? (
                          <span className="text-emerald-600 font-bold">Copiato!</span>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                            </svg>
                            <span>Copia Testo</span>
                          </>
                        )}
                      </button>
                      <span className="text-[#d9cdbf]">|</span>
                      <button
                        onClick={handlePrintReport}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#5c4a37] hover:underline"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Scarica PDF / Stampa</span>
                      </button>
                    </div>
                  </div>
                  <textarea
                    readOnly
                    onClick={(e) => e.currentTarget.select()}
                    value={generateReportText()}
                    rows={15}
                    className="w-full rounded-2xl border border-[#d9cdbf] bg-[#fdfbf7] p-4 text-xs font-mono text-[#4e4437] outline-none shadow-inner"
                  />
                </div>
              ) : !isAuthorizedForRestrictedContent ? (
                <div className="rounded-2xl border border-[#d9cdbf] bg-[#fdfbf7] p-8 text-center space-y-4 shadow-inner">
                  <div className="mx-auto w-16 h-16 bg-[#efe4d2] text-[#8a755d] rounded-full flex items-center justify-center shadow-inner">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h4 className="font-serif text-lg text-[#3f3933]">Generatore Binder Riservato</h4>
                  <p className="text-xs text-[#736555] max-w-md mx-auto leading-relaxed">
                    {currentUser
                      ? "Il tuo account è registrato ma non ancora abilitato. Contatta il Maestro per essere promosso a 'Cantore' e sbloccare la generazione del fascicolo unico PDF (Binder)."
                      : "La generazione e il download del fascicolo unico PDF (Binder) contenente tutti gli spartiti accorpati della celebrazione è riservato ai membri del coro abilitati."}
                  </p>
                  {!currentUser && (
                    <div className="pt-2">
                      <Link
                        href="/"
                        className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4b3c2c]"
                      >
                        Accedi o Registrati per sbloccare
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-[#d9cdbf] bg-[#fdfbf7] p-8 text-center space-y-4 shadow-inner">
                  {isGeneratingBinder ? (
                    <div className="py-6 space-y-4 flex flex-col items-center">
                      <div className="relative flex items-center justify-center">
                        <div className="h-12 w-12 rounded-full border-4 border-[#aa9576]/20 border-t-[#5c4a37] animate-spin" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif text-lg text-[#3f3933] animate-pulse">Compilazione del libretto...</h4>
                        <p className="text-xs text-[#736555] max-w-xs mx-auto leading-relaxed">
                          Stiamo unendo tutti gli spartiti e accordi in un unico PDF. Attendere qualche istante.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto w-16 h-16 bg-[#efe4d2] text-[#8a755d] rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <h4 className="font-serif text-lg text-[#3f3933]">Genera il Binder di Spartiti per Musicisti</h4>
                      <p className="text-xs text-[#736555] max-w-md mx-auto leading-relaxed">
                        Scarica un singolo file PDF contenente tutti gli spartiti o i fogli accordi dell&apos;elenco, ordinati cronologicamente secondo la liturgia della messa. Perfetto da caricare su tablet per l&apos;organista o per la stampa.
                      </p>
                      {binderError && (
                        <p className="text-xs text-rose-600 font-semibold max-w-xs mx-auto">
                          {binderError}
                        </p>
                      )}
                      <div className="pt-2">
                        <button
                          onClick={handleDownloadBinder}
                          className="inline-flex items-center gap-2 rounded-full bg-[#5c4a37] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#5c4a37]/10 transition hover:bg-[#4b3c2c] active:scale-[0.98]"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Scarica PDF Unificato</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="text-[10px] text-[#8c7e6c] italic text-center">
                Suggerimento: clicca sul testo per selezionarlo tutto automaticamente, pronto da incollare su WhatsApp o Telegram per i coristi.
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
