import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";


export interface NewsItem {
  id: string;
  sourceId: "vaticano" | "cei" | "roma" | "milano";
  sourceName: string;
  sourceBadgeColor: string;
  title: string;
  link: string;
  pubDate: string;
  isoDate: string;
  description: string;
  imageUrl: string | null;
  categories: string[];
}

const SOURCES: {
  id: "vaticano" | "cei" | "roma" | "milano";
  name: string;
  url: string;
  badgeColor: string;
}[] = [
  {
    id: "vaticano",
    name: "Vatican News",
    url: "https://www.vaticannews.va/it.rss.xml",
    badgeColor: "#eab308", // Giallo Vaticano
  },
  {
    id: "cei",
    name: "Chiesa Cattolica (CEI)",
    url: "https://www.chiesacattolica.it/feed/",
    badgeColor: "#2563eb", // Blu CEI
  },
  {
    id: "roma",
    name: "Diocesi di Roma",
    url: "https://www.romasette.it/feed/",
    badgeColor: "#9333ea", // Viola/Porpora Romano
  },
  {
    id: "milano",
    name: "Diocesi di Milano",
    url: "https://www.chiesadimilano.it/feed",
    badgeColor: "#dc2626", // Rosso Ambrosiano
  },
];

function cleanHtmlEntities(text: string): string {
  if (!text) return "";
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, "$1")
    .replace(/&#8217;/g, "’")
    .replace(/&#8216;/g, "‘")
    .replace(/&#8220;/g, "“")
    .replace(/&#8221;/g, "”")
    .replace(/&#8211;/g, "–")
    .replace(/&#8212;/g, "—")
    .replace(/&#8230;/g, "…")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#038;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, "")
    .replace(/\[\.\.\.\]/g, "…")
    .replace(/\s+/g, " ")
    .trim();
}

function parseRssXml(xml: string, source: (typeof SOURCES)[0]): NewsItem[] {
  const items: NewsItem[] = [];
  const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];

  for (const m of itemMatches) {
    const itemXml = m[1];

    const titleMatch = itemXml.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch =
      itemXml.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i) ||
      itemXml.match(/<guid[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/guid>/i);
    const pubDateMatch = itemXml.match(/<pubDate>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/pubDate>/i);
    const descMatch =
      itemXml.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i) ||
      itemXml.match(/<content:encoded>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);

    const title = cleanHtmlEntities(titleMatch ? titleMatch[1] : "Senza titolo");
    const rawLink = linkMatch ? linkMatch[1].trim() : "";
    const cleanLink = rawLink.replace(/&amp;/g, "&").replace(/&#038;/g, "&");

    if (!title || !cleanLink) continue;

    const rawPubDate = pubDateMatch ? pubDateMatch[1].trim() : "";
    let isoDate = new Date().toISOString();
    try {
      if (rawPubDate) {
        const parsedTime = Date.parse(rawPubDate);
        if (!isNaN(parsedTime)) {
          isoDate = new Date(parsedTime).toISOString();
        }
      }
    } catch {
      // fallback
    }

    const enclosureMatch = itemXml.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*>/i);
    const mediaContentMatch = itemXml.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
    const imgInDescMatch = (descMatch ? descMatch[1] : "").match(/<img[^>]*src=["']([^"']+)["']/i);

    let imageUrl = enclosureMatch?.[1] || mediaContentMatch?.[1] || imgInDescMatch?.[1] || null;
    if (imageUrl) {
      imageUrl = imageUrl.replace(/&amp;/g, "&");
    }

    const catMatches = [...itemXml.matchAll(/<category>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/category>/gi)];
    const categories = catMatches
      .map((cm) => cleanHtmlEntities(cm[1]))
      .filter((c) => c && c.length < 40 && !c.includes("http"));

    const description = cleanHtmlEntities(descMatch ? descMatch[1] : "");

    items.push({
      id: `${source.id}-${Buffer.from(cleanLink).toString("base64").slice(0, 16)}`,
      sourceId: source.id,
      sourceName: source.name,
      sourceBadgeColor: source.badgeColor,
      title,
      link: cleanLink,
      pubDate: rawPubDate,
      isoDate,
      description: description.length > 280 ? `${description.slice(0, 277)}…` : description,
      imageUrl,
      categories: categories.slice(0, 3),
    });
  }

  return items;
}

// In-memory cache per source
const sourceCaches: Record<string, { data: NewsItem[]; timestamp: number }> = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minuti

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sourceFilter = (searchParams.get("source") || "all") as "all" | "vaticano" | "cei" | "roma" | "milano";
    const query = (searchParams.get("q") || "").toLowerCase().trim();
    const isRefresh = searchParams.get("refresh") === "true";

    const now = Date.now();
    const sourcesToFetch =
      sourceFilter === "all"
        ? SOURCES
        : SOURCES.filter((s) => s.id === sourceFilter);

    const fetchPromises = sourcesToFetch.map(async (source) => {
      const cached = sourceCaches[source.id];
      if (cached && !isRefresh && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
      }

      try {
        const res = await fetch(source.url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) NoteDiFede/1.9.46 (RSS Reader)",
            Accept: "application/rss+xml, application/xml, text/xml, */*",
          },
          next: { revalidate: isRefresh ? 0 : 900 },
          signal: AbortSignal.timeout(15000), // 15 secondi di timeout
        });


        if (!res.ok) {
          console.warn(`Feed ${source.name} status ${res.status}`);
          return cached ? cached.data : [];
        }

        const xml = await res.text();
        const parsed = parseRssXml(xml, source);
        if (parsed.length > 0) {
          sourceCaches[source.id] = { data: parsed, timestamp: now };
        }
        return parsed;
      } catch (err) {
        console.error(`Errore fetch feed ${source.name}:`, err);
        return cached ? cached.data : [];
      }
    });

    const results = await Promise.all(fetchPromises);
    let allNews = results.flat().sort((a, b) => new Date(b.isoDate).getTime() - new Date(a.isoDate).getTime());

    if (query) {
      allNews = allNews.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.categories.some((c) => c.toLowerCase().includes(query))
      );
    }

    return NextResponse.json(
      {
        success: true,
        source: sourceFilter,
        count: allNews.length,
        news: allNews,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );

  } catch (error: any) {
    console.error("Errore API Notizie:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Errore nel caricamento delle notizie" },
      { status: 500 }
    );
  }
}
