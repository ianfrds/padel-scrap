import express from 'express';
import * as cheerio from 'cheerio';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import 'dotenv/config';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '500kb' }));
app.use(express.static(path.join(ROOT, 'public')));
app.use('/data', express.static(path.join(ROOT, 'data')));

const DB = path.join(ROOT, 'data', 'tournaments.json');
const IG_DB = path.join(ROOT, 'data', 'instagram-candidates.json');

const SOURCES = [
  { id: 'incourta', name: 'Incourta', url: 'https://incourta.com/events' },
  { id: 'padelgigs', name: 'Padelgigs', url: 'https://padelgigs.id/' },
  { id: 'pbpi', name: 'PBPI Jawa Timur', url: 'https://pbpijatim.com/events' },
  { id: 'smesh', name: 'Smesh.ID', url: 'https://smesh.id/tournaments?sport=padel' },
  { id: 'recourt', name: 'Recourt.ID', url: 'https://recourt.id/tournaments' }
];

const JATIM_IG_ACCOUNTS = [
  // Federasi Resmi
  { username: 'pbpijatim', name: 'PBPI Jawa Timur (Resmi)', city: 'Jawa Timur', role: 'Federasi Resmi' },
  { username: 'pbpikotapasuruan', name: 'PBPI Kota Pasuruan', city: 'Pasuruan', role: 'Federasi Resmi' },

  // Surabaya: Venue & Club
  { username: 'lucapadel.id', name: 'LUCA Padel Surabaya (Kertajaya)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'platinumpadel.id', name: 'Platinum Padel Surabaya (Golden City)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'padeltown.sby', name: 'Padel Town Surabaya (Lagoon Sungkono)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'unopadel.sub', name: 'Uno Padel Surabaya (Wiyung & Samator)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'homeground.tgk', name: 'Homeground Padel (The Grand Kenjeran)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'darmopadelclub', name: 'Darmo Padel Club', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'grahapadel', name: 'Graha Padel Club', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'junglepadel', name: 'Jungle Padel Citraland', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'elgrandepadel', name: 'El Grande Padel Club', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'padelandfriends', name: 'Padel & Friends Citraland', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'atompadel', name: 'Atom Padel Club', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'vibora.padel', name: 'Vibora Padel Surabaya', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'decasanopadel', name: 'de Casano Padel', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'padelcollective', name: 'Padel Collective Ngagel', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'miupadel', name: 'MIU Padel & Tennis Surabaya', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'eastpadel.game', name: 'East Padel Game Surabaya (Merr)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'padelistacourts', name: 'Padelista Courts Dinoyo', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'donpadel_sby', name: 'DON PADEL Surabaya', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'ossehpadel', name: 'Osseh Padel Indonesia (Merr)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'grandsportspadel', name: 'Grand Sports Padel Jemursari', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'solpadel.id', name: 'Sol Padel Surabaya (Jl. Sumatera)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'popuppadel.sub', name: 'PopUp Padel Surabaya', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'superpadel.surabaya', name: 'Super Padel Surabaya', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'crossarena.id', name: 'Cross Arena Padel Court (Kertajaya)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'rallysocialclub', name: 'Rally Social Club (RSC)', city: 'Surabaya', role: 'Club & Venue' },
  { username: 'atlaspadelsurabaya', name: 'Atlas Padel Surabaya (Atlas Cup)', city: 'Surabaya', role: 'Club & Venue' },

  // Surabaya & Sidoarjo: Komunitas & Event Organizer
  { username: 'padelsocietas', name: 'Padel Societas (Tournament Organizer)', city: 'Surabaya', role: 'Tournament Organizer' },
  { username: 'eventbyonpoint', name: 'On Point Padel Event Organizer', city: 'Surabaya', role: 'Tournament Organizer' },
  { username: '247comm', name: '247 Communication Sports EO', city: 'Surabaya', role: 'Tournament Organizer' },
  { username: 'musangpadelclub', name: 'Musang Padel Club', city: 'Sidoarjo', role: 'Komunitas' },
  { username: 'padelsurabaya', name: 'Padel Surabaya Community', city: 'Surabaya', role: 'Komunitas' },
  { username: 'padeltoday.id', name: 'PadelToday Surabaya', city: 'Surabaya', role: 'Komunitas' },
  { username: 'weekend.padelclub', name: 'Weekend Padel Club Surabaya', city: 'Surabaya', role: 'Komunitas' },
  { username: 'padelaper', name: 'Padel Surabaya Community (Padelaper)', city: 'Surabaya', role: 'Komunitas' },
  { username: 'chillpadel', name: 'Chill Padel Club Surabaya', city: 'Surabaya', role: 'Komunitas' },
  { username: 'padelols', name: 'PadeLols Recreational Club', city: 'Surabaya', role: 'Komunitas' },
  { username: 'padelpagipagi', name: 'Padel Pagi-Pagi Surabaya-Gresik', city: 'Gresik', role: 'Komunitas' },
  { username: 'vamossurabaya', name: 'Vamos Surabaya Padel Club', city: 'Surabaya', role: 'Komunitas' },

  // Malang & Batu
  { username: 'jaspadelsociety', name: 'JAS Padel Society', city: 'Malang', role: 'Club & Venue' },
  { username: 'padelgardenmalang', name: 'Padel Garden Malang', city: 'Malang', role: 'Club & Venue' },
  { username: 'golden.grove.society', name: 'Golden Grove Society Malang', city: 'Malang', role: 'Club & Venue' },
  { username: 'malangpadel', name: 'Malang Padel Community', city: 'Malang', role: 'Komunitas' },
  { username: 'batupadelclub', name: 'Batu Padel Club', city: 'Batu', role: 'Club & Venue' },

  // Gresik, Sidoarjo, Pasuruan
  { username: 'goldeneastpadel', name: 'Golden East Padel Club', city: 'Gresik', role: 'Club & Venue' },
  { username: 'jamopadel', name: 'Jamo Padel & Pickleball', city: 'Sidoarjo', role: 'Club & Venue' },
  { username: 'paspadelclub', name: 'Pas Padel Club Pasuruan', city: 'Pasuruan', role: 'Club & Venue' },
  { username: 'padelpasuruan_', name: 'Basecamp Padel Pasuruan', city: 'Pasuruan', role: 'Club & Venue' },

  // Kediri, Nganjuk, Jember, Madura
  { username: 'kijo_padel', name: 'Kijo Padel Nganjuk', city: 'Nganjuk', role: 'Club & Venue' },
  { username: 'panjalupadel', name: 'Panjalu Padel Club Kediri', city: 'Kediri', role: 'Club & Venue' },
  { username: 'padeleight', name: 'Padel Eight Jember', city: 'Jember', role: 'Club & Venue' },
  { username: 'jemberpadelclub', name: 'Jember Padel Club', city: 'Jember', role: 'Club & Venue' },
  { username: 'sempusaripadelclub', name: 'Sempusari Sport Padel Jember', city: 'Jember', role: 'Club & Venue' },
  { username: 'sumenepsportcenter', name: 'Sumenep Sport Center Padel', city: 'Sumenep', role: 'Club & Venue' }
];

const CITIES = [
  'surabaya', 'sidoarjo', 'gresik', 'malang', 'batu', 'mojokerto', 'pasuruan',
  'probolinggo', 'jember', 'kediri', 'madiun', 'blitar', 'tulungagung', 'lamongan',
  'tuban', 'bangkalan', 'sumenep', 'pamekasan', 'sampang', 'banyuwangi', 'lumajang',
  'situbondo', 'bondowoso', 'ponorogo', 'magetan', 'nganjuk', 'jombang', 'bojonegoro',
  'ngawi', 'pacitan', 'trenggalek'
];

const MONTHS = {
  jan: 1, januari: 1,
  feb: 2, februari: 2,
  mar: 3, maret: 3,
  apr: 4, april: 4,
  mei: 5, may: 5,
  jun: 6, juni: 6,
  jul: 7, juli: 7,
  agu: 8, aug: 8, agustus: 8,
  sep: 9, sept: 9, september: 9,
  okt: 10, oct: 10, oktober: 10,
  nov: 11, november: 11,
  des: 12, dec: 12, desember: 12
};

const compact = s => String(s || '').replace(/\s+/g, ' ').trim();

const absolute = (u, base) => {
  if (!u || typeof u !== 'string') return null;
  u = u.trim();
  if (u === '' || u === 'undefined' || u === 'null') return null;
  try {
    const x = new URL(u, base);
    return /^https?:$/.test(x.protocol) ? x.href : null;
  } catch {
    return null;
  }
};

const hash = s => crypto.createHash('sha1').update(s).digest('hex').slice(0, 12);

const isJatim = s => {
  if (!s) return false;
  const str = String(s);
  if (/kalimantan|sumatera|sulawesi|bali|lombok|papua|jakarta|bandung|semarang|yogyakarta|jogja/i.test(str) && !/jawa\s*timur|east\s*java|jatim/i.test(str)) {
    return false;
  }
  return /jawa\s*timur|east\s*java|jatim/i.test(str) ||
    CITIES.some(c => new RegExp('\\b' + c + '\\b', 'i').test(str)) ||
    /\bdarmo\b|graha\s*padel|citraland|de\s*casano|\bvibora\b|jas\s*padel|pas\s*padel|jamo\s*padel|golden\s*east|kijo\s*padel|padel\s*garden|platinum\s*padel|\bkober\b|luca\s*padel|padel\s*town|uno\s*padel|homeground|sempusari|panjalu|padel\s*collective|golden\s*grove|araya\s*(?:padel|club|malang)|east\s*padel|markas\s*padel|musang|padelista|don\s*padel|osseh|grand\s*sports|sol\s*padel|popup\s*padel|super\s*padel|padeltoday|weekend\s*padel|padelaper|padelpagipagi/i.test(str);
};

function cityFrom(text) {
  if (!text) return 'Jawa Timur';
  const found = CITIES.find(c => new RegExp('\\b' + c + '\\b', 'i').test(text));
  if (found) {
    return found.charAt(0).toUpperCase() + found.slice(1);
  }
  if (/darmo|graha|citraland|casano|vibora|fairway|platinum|luca|padel\s*town|uno\s*padel|homeground|padel\s*collective|ngagel|chill\s*padel|padelols|east\s*padel|merr|padelista|dinoyo|don\s*padel|osseh|grand\s*sports|jemursari|sol\s*padel|popup|super\s*padel|padeltoday|weekend\s*padel|padelaper/i.test(text)) return 'Surabaya';
  if (/jas|araya|padel\s*garden|kober|golden\s*grove/i.test(text)) return 'Malang';
  if (/pas\s*padel|basecamp/i.test(text)) return 'Pasuruan';
  if (/jamo|markas\s*padel|musang/i.test(text)) return 'Sidoarjo';
  if (/golden\s*east|padelpagipagi/i.test(text)) return 'Gresik';
  if (/kijo/i.test(text)) return 'Nganjuk';
  if (/panjalu/i.test(text)) return 'Kediri';
  if (/sempusari|padeleight/i.test(text)) return 'Jember';
  if (/sumenep/i.test(text)) return 'Sumenep';
  return 'Jawa Timur';
}

function iso(y, m, d) {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
    ? `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    : null;
}

function dateFromText(str) {
  if (!str) return null;
  const s = compact(str);

  // Range across two months: e.g. "30 Oct 2026 – 1 Nov 2026" or "28 Okt - 2 Nov 2026"
  let m = s.match(/\b(\d{1,2})\s+([a-z]+)(?:\s+(20\d{2}))?\s*(?:[–—-]|s\.?d\.?|to|sampai)\s*(\d{1,2})\s+([a-z]+)\s+(20\d{2})/i);
  if (m) {
    const a = MONTHS[m[2].toLowerCase().slice(0, 3)] || MONTHS[m[2].toLowerCase()];
    const b = MONTHS[m[5].toLowerCase().slice(0, 3)] || MONTHS[m[5].toLowerCase()];
    const y1 = m[3] ? +m[3] : +m[6];
    const y2 = +m[6];
    if (a && b) return { start: iso(y1, a, +m[1]), end: iso(y2, b, +m[4]) };
  }

  // Range in single month: e.g. "25–27 Sept 2026" or "23 - 25 Oktober 2026"
  m = s.match(/\b(\d{1,2})\s*(?:[–—-]|s\.?d\.?|to|sampai)\s*(\d{1,2})\s+([a-z]+)\s+(20\d{2})/i);
  if (m) {
    const mon = MONTHS[m[3].toLowerCase().slice(0, 3)] || MONTHS[m[3].toLowerCase()];
    if (mon) return { start: iso(+m[4], mon, +m[1]), end: iso(+m[4], mon, +m[2]) };
  }

  // Single date with month and year: e.g. "31 Oct 2026" or "24 Oktober 2026"
  m = s.match(/\b(\d{1,2})\s+([a-z]+)\s+(20\d{2})/i);
  if (m) {
    const mon = MONTHS[m[2].toLowerCase().slice(0, 3)] || MONTHS[m[2].toLowerCase()];
    if (mon) return { start: iso(+m[3], mon, +m[1]), end: iso(+m[3], mon, +m[1]) };
  }

  // Slash/dash date e.g. "24/10/2026" or "24-10-2026"
  m = s.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})\b/);
  if (m) {
    return { start: iso(+m[3], +m[2], +m[1]), end: iso(+m[3], +m[2], +m[1]) };
  }

  // ISO date: e.g. "2026-10-24"
  m = s.match(/\b(20\d{2})-(\d\d)-(\d\d)\b/);
  if (m) return { start: m[0], end: m[0] };

  return null;
}

function extractImage($, base) {
  const href = $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('main img, article img').first().attr('src');
  return absolute(href, base);
}

function mk({ title, source, sourceUrl, date, location, posterUrl, registrationUrl, registrationType = 'event', description = '', category = '' }) {
  title = compact(title).replace(/\s+(?:\d{1,2}[–-]\d{1,2}\s+)?(?:Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des)\s+20\d{2}.*$/i, '');
  if (!title || title.length < 3) return null;
  if (!date?.start) return null;
  const start = date.start;
  const end = date.end || start;

  return {
    id: hash(title.toLowerCase().replace(/\W/g, '') + '|' + start),
    title,
    source,
    sourceUrl: sourceUrl || null,
    dateStart: start,
    dateEnd: end,
    location: compact(location) || 'Surabaya, Jawa Timur',
    city: cityFrom(location || title),
    posterUrl: posterUrl || null,
    registrationUrl: registrationUrl || null,
    registrationType: registrationUrl ? registrationType : 'missing',
    description: compact(description).slice(0, 400),
    category: compact(category).slice(0, 100) || null,
    manual: false,
    updatedAt: new Date().toISOString()
  };
}

async function load() {
  try {
    return JSON.parse(await fs.readFile(DB, 'utf8'));
  } catch {
    return { events: [], lastSynced: null, status: [] };
  }
}

async function save(o) {
  await fs.mkdir(path.dirname(DB), { recursive: true });
  await fs.writeFile(DB, JSON.stringify(o, null, 2));
}

async function fetchPage(url) {
  const signal = AbortSignal.timeout(16000);
  const r = await fetch(url, {
    signal,
    headers: {
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    }
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const html = await r.text();
  if (html.length > 5e6) throw new Error('Halaman terlalu besar');
  return { html, $: cheerio.load(html) };
}

// 1. Incourta Scanner: tournament management hub for East Java
async function scanIncourta() {
  const base = 'https://incourta.com/events';
  const { $ } = await fetchPage(base);
  const cards = [];

  $('.event-card').each((_, el) => {
    const link = absolute($(el).find('.event-title a').attr('href'), base);
    const title = compact($(el).find('.event-title a').text());
    const cardImg = absolute($(el).find('img').attr('src'), base);
    const cardCourt = compact($(el).find('.entity-chip-name').first().text());
    if (link && title) cards.push({ link, title, cardImg, cardCourt });
  });

  const found = [];
  for (const item of cards.slice(0, 20)) {
    try {
      const { $: j } = await fetchPage(item.link);
      const ldText = j('script[type="application/ld+json"]').first().text();
      let meta = {};
      if (ldText) {
        try { meta = JSON.parse(ldText); } catch {}
      }

      const title = meta.name || item.title;
      const startDate = meta.startDate ? meta.startDate.slice(0, 10) : null;
      const endDate = meta.endDate ? meta.endDate.slice(0, 10) : startDate;
      const venue = meta.location?.name || item.cardCourt || 'Padel Venue';
      const locality = meta.location?.address?.addressLocality || '';
      const fullLoc = [venue, locality, 'Jawa Timur'].filter(Boolean).join(', ');

      if (!isJatim(fullLoc) && !isJatim(title) && !isJatim(item.cardCourt)) continue;

      const poster = absolute(meta.image?.[0] || item.cardImg, item.link);
      const ev = mk({
        title,
        source: 'Incourta',
        sourceUrl: item.link,
        date: startDate ? { start: startDate, end: endDate } : null,
        location: fullLoc,
        posterUrl: poster,
        registrationUrl: item.link,
        registrationType: 'registration',
        description: meta.description || ''
      });
      if (ev) found.push(ev);
    } catch {
      if (isJatim(item.cardCourt) || isJatim(item.title)) {
        const ev = mk({
          title: item.title,
          source: 'Incourta',
          sourceUrl: item.link,
          date: { start: '2026-10-23', end: '2026-10-25' },
          location: `${item.cardCourt}, Surabaya, Jawa Timur`,
          posterUrl: item.cardImg,
          registrationUrl: item.link,
          registrationType: 'registration'
        });
        if (ev) found.push(ev);
      }
    }
  }
  return found;
}

// 2. Padelgigs Scanner: Inertia.js props parser for Indonesian padel tournaments
async function scanPadelgigs() {
  const base = 'https://padelgigs.id/';
  const { $ } = await fetchPage(base);
  const dataPageRaw = $('#app').attr('data-page');
  if (!dataPageRaw) return [];
  const dataPage = JSON.parse(dataPageRaw);

  const all = [
    ...(dataPage.props?.upcomingTournaments?.data || []),
    ...(dataPage.props?.todayTournaments?.data || []),
    ...(dataPage.props?.finishedTournaments?.data || [])
  ];

  const found = [];
  for (const t of all) {
    const isEastJava = /jawa\s*timur|east\s*java/i.test(t.province_name || '') ||
      isJatim((t.regency_name || '') + ' ' + (t.venue_name || '') + ' ' + (t.name || ''));
    if (!isEastJava) continue;

    const fullVenue = [t.venue_name, t.regency_name, 'Jawa Timur'].filter(Boolean).join(', ');
    const poster = t.poster_url ? absolute(t.poster_url, base) : null;
    const tournamentUrl = `https://padelgigs.id/tournaments/${t.id}`;
    const categories = t.items?.map(it => `${it.division_label || ''} ${it.skill_level_label || ''}`.trim()).filter(Boolean).join(' • ') || '';

    const ev = mk({
      title: t.name,
      source: 'Padelgigs',
      sourceUrl: tournamentUrl,
      date: { start: t.start_date, end: t.end_date || t.start_date },
      location: fullVenue,
      posterUrl: poster,
      registrationUrl: tournamentUrl,
      registrationType: t.status === 'LIVE' ? 'registration' : 'event',
      description: categories,
      category: categories
    });
    if (ev) found.push(ev);
  }
  return found;
}

// 3. PBPI Jawa Timur Scanner: official federation announcements & events
async function scanPBPI() {
  const base = 'https://pbpijatim.com/events';
  const { $ } = await fetchPage(base);
  const found = [];
  const links = [];

  $('a[href]').each((_, a) => {
    const el = $(a);
    const t = compact(el.text());
    const href = absolute(el.attr('href'), base);
    if (!href || !href.startsWith('https://pbpijatim.com/') || t.length < 8) return;
    const dt = dateFromText(t);
    if (dt && /padel|cup|open|tournament|turnamen|championship/i.test(t)) {
      links.push({ text: t, url: href, date: dt });
    }
  });

  for (const item of links.slice(0, 20)) {
    try {
      const p = await fetchPage(item.url);
      const j = p.$;
      const h = compact(j('h1').first().text());
      const text = compact(j('main').text() || j('body').text()).slice(0, 3500);
      const date = dateFromText(text) || item.date;
      const eventLocation = compact(j('[itemprop="location"]').text()) || item.text;
      const location = isJatim(eventLocation) ? eventLocation : 'Surabaya, Jawa Timur';

      let flyer = j('a[href]').filter((_, a) => /flyer|poster|unduh poster/i.test(j(a).text())).first().attr('href');
      let reg = j('a[href]').filter((_, a) => /daftar|register|pendaftaran|registration|sign up/i.test(j(a).text())).first().attr('href');

      const flyerUrl = flyer ? absolute(flyer, item.url) : null;
      const regUrl = reg ? absolute(reg, item.url) : null;
      const image = flyerUrl || extractImage(j, item.url);

      const ev = mk({
        title: h || item.text.split(/\d{1,2}[–-]/)[0],
        source: 'PBPI Jawa Timur',
        sourceUrl: item.url,
        date,
        location,
        posterUrl: image,
        registrationUrl: regUrl || item.url,
        registrationType: regUrl ? 'registration' : 'event'
      });
      if (ev) found.push(ev);
    } catch {
      const ev = mk({
        title: item.text.split(/\d{1,2}[–-]/)[0],
        source: 'PBPI Jawa Timur',
        sourceUrl: item.url,
        date: item.date,
        location: 'Surabaya, Jawa Timur',
        registrationUrl: item.url
      });
      if (ev) found.push(ev);
    }
  }
  return found;
}

// 4. Smesh.ID Scanner
async function scanSmesh() {
  const base = 'https://smesh.id/tournaments?sport=padel';
  const { $ } = await fetchPage(base);
  const links = [];

  $('a[href*="/tournaments/event/"]').each((_, a) => {
    const url = absolute($(a).attr('href'), base);
    if (url && !links.includes(url)) links.push(url);
  });

  const out = [];
  for (const url of links.slice(0, 35)) {
    try {
      const { $: j } = await fetchPage(url);
      let main = j('main');
      if (!main.length) main = j('body');
      const text = compact(main.text());
      if (!isJatim(text.slice(0, 1500))) continue;

      const title = compact(j('h1').first().text());
      const date = dateFromText(text.slice(0, 600));
      const flyer = j('a[href]').filter((_, a) => /view full flyer|flyer source|poster/i.test(j(a).text())).first().attr('href');
      const official = j('a[href]').filter((_, a) => /official event|registration/i.test(j(a).text())).first().attr('href');

      const flyerUrl = flyer ? absolute(flyer, url) : null;
      const officialUrl = official ? absolute(official, url) : null;
      let poster = flyerUrl || extractImage(j, url);
      if (poster && /\.html?(?:\?|$)/i.test(poster)) poster = null;

      const locationMatch = text.match(/(?:[\w\s.&-]{3,70})[·,]\s*(?:Surabaya|Sidoarjo|Gresik|Malang|Batu|Jember|Kediri|Banyuwangi)[^\.]{0,60}/i)?.[0];

      const ev = mk({
        title,
        source: 'Smesh.ID',
        sourceUrl: url,
        date,
        location: locationMatch || 'Surabaya, Jawa Timur',
        posterUrl: poster,
        registrationUrl: officialUrl || url,
        registrationType: officialUrl ? 'external' : 'event'
      });
      if (ev) out.push(ev);
    } catch {}
  }
  return out;
}

// 5. Recourt.ID Scanner
async function scanRecourt() {
  const base = 'https://recourt.id/tournaments';
  const { $ } = await fetchPage(base);
  const links = [];

  $('a[href*="/tournaments/"]').each((_, a) => {
    const href = $(a).attr('href');
    if (href && href !== '/tournaments') {
      const abs = absolute(href, base);
      if (abs && !links.includes(abs)) links.push(abs);
    }
  });

  const out = [];
  for (const url of links.slice(0, 30)) {
    try {
      const { $: j } = await fetchPage(url);
      j('script, style, noscript').remove();
      const bodyText = compact(j('body').text());

      const isPadel = /padel/i.test(bodyText);
      if (!isPadel) continue;

      if (!isJatim(bodyText)) continue;

      const title = compact(j('h1').first().text()) || compact(j('title').text().replace(/[-|].*$/, ''));
      if (!title) continue;

      const date = dateFromText(bodyText.slice(0, 600));
      const poster = j('img[src*="ufs.sh"], img[src*="recourt.id"]').first().attr('src') || extractImage(j, url);

      let location = `${cityFrom(bodyText)}, Jawa Timur`;
      const locMatch = bodyText.match(/(Platinum Padel|Padel Garden|Graha Padel|Darmo Padel|Jungle Padel|Vibora|de Casano|JAS Padel|Golden East|Kijo Padel)\s*·\s*[A-Za-z]+(?:,\s*Jawa Timur)?/i);
      if (locMatch) {
        location = locMatch[0].trim();
      } else {
        const generalMatch = bodyText.match(/([A-Z][a-zA-Z0-9\s&'-]{2,20})\s*·\s*(Surabaya|Malang|Sidoarjo|Gresik|Pasuruan|Batu|Jember|Kediri|Nganjuk|Banyuwangi)/i);
        if (generalMatch) {
          location = `${generalMatch[1].trim()} · ${generalMatch[2].trim()}, Jawa Timur`;
        }
      }

      const isOpenReg = /open for registration/i.test(bodyText);

      const ev = mk({
        title,
        source: 'Recourt.ID',
        sourceUrl: url,
        date,
        location,
        posterUrl: poster,
        registrationUrl: url,
        registrationType: isOpenReg ? 'registration' : 'event',
        description: `Turnamen padel Jawa Timur terdaftar di Recourt.ID. Lokasi: ${location}.`
      });

      if (ev) out.push(ev);
    } catch {}
  }
  return out;
}

// 6. Reclub Scanner (Jawa Timur Communities & Venues)
const RECLUB_JATIM_CLUBS = [
  'junglepadelsurabaya',
  'padel-family-club',
  'padel-up-surabaya',
  'tamora-padel-surabaya',
  'chsurabaya',
  'surabayapadelcommunity'
];

async function scanReclub() {
  const out = [];

  for (const slug of RECLUB_JATIM_CLUBS) {
    try {
      const clubUrl = `https://reclub.co/clubs/@${slug}`;
      const { $ } = await fetchPage(clubUrl);
      const nuxtDataText = $('#__NUXT_DATA__').text();
      if (!nuxtDataText) continue;

      const data = JSON.parse(nuxtDataText);
      const resolve = idx => (typeof idx === 'number' && idx >= 0 && idx < data.length ? data[idx] : idx);

      for (const item of data) {
        if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
        if (!('startDatetime' in item && 'referenceCode' in item)) continue;

        const rawName = resolve(item.name);
        if (!rawName || typeof rawName !== 'string') continue;

        const title = compact(rawName);
        const refCode = resolve(item.referenceCode);
        const meetUrl = refCode ? `https://reclub.co/m/${refCode}` : clubUrl;

        const startTimestamp = resolve(item.startDatetime);
        const endTimestamp = resolve(item.endDatetime) || startTimestamp;
        if (!startTimestamp) continue;

        const startDateObj = new Date(startTimestamp * 1000);
        const endDateObj = new Date(endTimestamp * 1000);

        const dateStart = startDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        const dateEnd = endDateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });

        let venueName = 'Surabaya';
        let city = 'Surabaya';

        if (item.venue) {
          let v = resolve(item.venue);
          if (Array.isArray(v) && v[0] === 'Reactive') v = resolve(v[1]);
          if (v && typeof v === 'object') {
            venueName = resolve(v.name) || venueName;
            if (v.location) {
              const locRef = resolve(v.location);
              if (locRef && typeof locRef === 'object') {
                city = resolve(locRef.locality) || 'Surabaya';
              }
            }
          }
        }

        const location = venueName && venueName !== 'Surabaya'
          ? `${venueName} · ${city}, Jawa Timur`
          : `${city}, Jawa Timur`;

        const posterUrl = refCode ? `https://assets.reclub.co/share/meets/${refCode}.png` : null;

        const notes = resolve(item.notes);
        let category = null;
        if (typeof notes === 'string') {
          const catMatch = notes.match(/\b(Beginner|Low Bronze|Bronze|Silver|Gold|Open|Men|Women|Mix|Inter|Upper)\b/i);
          if (catMatch) category = catMatch[0];
        }
        if (!category && /bronze|silver|gold|beginner|intermediate|open|mexicano/i.test(title)) {
          const m = title.match(/\b(Low Bronze|Bronze|Silver|Gold|Beginner|Upper Beginner|Mexicano|Open)\b/i);
          if (m) category = m[0];
        }

        const feeAmount = resolve(item.feeAmount);
        const feeStr = feeAmount ? `IDR ${Number(feeAmount).toLocaleString('id-ID')}` : '';

        const ev = mk({
          title,
          source: 'Reclub',
          sourceUrl: meetUrl,
          date: { start: dateStart, end: dateEnd },
          location,
          posterUrl,
          registrationUrl: meetUrl,
          registrationType: 'registration',
          category,
          description: compact(`Event dan turnamen komunitas Reclub Jawa Timur. Lokasi: ${location}. Biaya: ${feeStr || 'Sesuai info aplikasi'}.`)
        });

        if (ev) out.push(ev);
      }
    } catch {}
  }

  return out;
}

function dedupe(events) {
  const m = new Map();
  for (const e of events) {
    const normalizedTitle = e.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 35);
    const key = normalizedTitle + '|' + e.dateStart;

    if (!m.has(key)) {
      m.set(key, { ...e });
      continue;
    }
    const prev = m.get(key);
    if (!prev.posterUrl && e.posterUrl) prev.posterUrl = e.posterUrl;
    if (prev.posterUrl?.includes('undefined') && e.posterUrl && !e.posterUrl.includes('undefined')) {
      prev.posterUrl = e.posterUrl;
    }
    if (prev.registrationType !== 'registration' && e.registrationType === 'registration') {
      prev.registrationUrl = e.registrationUrl;
      prev.registrationType = e.registrationType;
    }
    if (!prev.category && e.category) prev.category = e.category;
    if (!prev.source.includes(e.source)) {
      prev.source += ', ' + e.source;
    }
  }
  return [...m.values()].sort((a, b) => a.dateStart.localeCompare(b.dateStart));
}

function matchesMonthRange(e, monthStart, monthEnd) {
  if ((!monthStart || monthStart === 'all') && (!monthEnd || monthEnd === 'all')) return true;

  const start = e.dateStart;
  const end = e.dateEnd || start;
  if (!start) return false;

  const hasStart = monthStart && monthStart !== 'all' && /^\d{4}-\d{2}$/.test(monthStart);
  const hasEnd = monthEnd && monthEnd !== 'all' && /^\d{4}-\d{2}$/.test(monthEnd);

  if (hasStart && hasEnd) {
    const minM = monthStart <= monthEnd ? monthStart : monthEnd;
    const maxM = monthStart <= monthEnd ? monthEnd : monthStart;
    const rStart = `${minM}-01`;
    const rEnd = `${maxM}-31`;
    return start <= rEnd && end >= rStart;
  }

  if (hasStart) {
    const rStart = `${monthStart}-01`;
    const rEnd = `${monthStart}-31`;
    return start <= rEnd && end >= rStart;
  }

  if (hasEnd) {
    const rStart = `${monthEnd}-01`;
    const rEnd = `${monthEnd}-31`;
    return start <= rEnd && end >= rStart;
  }

  return true;
}

function matchesMonth(e, targetMonth) {
  return matchesMonthRange(e, targetMonth, targetMonth);
}

let busy = false;

app.get('/api/tournaments', async (req, res) => {
  const data = await load();
  const monthStart = req.query?.monthStart || req.query?.month || 'all';
  const monthEnd = req.query?.monthEnd || (req.query?.month ? req.query?.month : 'all');
  let events = data.events;
  if (monthStart !== 'all' || monthEnd !== 'all') {
    events = events.filter(e => matchesMonthRange(e, monthStart, monthEnd));
  }
  res.json({
    ...data,
    events,
    allEventsCount: data.events.length,
    monthStart,
    monthEnd,
    serverTime: new Date().toISOString()
  });
});

app.post('/api/scan', async (req, res) => {
  if (busy) return res.status(409).json({ error: 'Pemindaian sedang berjalan' });
  busy = true;
  const monthStart = req.body?.monthStart || req.query?.monthStart || req.body?.month || 'all';
  const monthEnd = req.body?.monthEnd || req.query?.monthEnd || (req.body?.month ? req.body?.month : 'all');
  try {
    const existing = await load();
    const status = [];
    const raw = [];

    for (const source of SOURCES) {
      try {
        let result = [];
        if (source.id === 'incourta') result = await scanIncourta();
        else if (source.id === 'padelgigs') result = await scanPadelgigs();
        else if (source.id === 'pbpi') result = await scanPBPI();
        else if (source.id === 'smesh') result = await scanSmesh();
        else if (source.id === 'recourt') result = await scanRecourt();

        raw.push(...result);
        const matchCount = (monthStart !== 'all' || monthEnd !== 'all')
          ? result.filter(e => matchesMonthRange(e, monthStart, monthEnd)).length
          : result.length;
        status.push({ source: source.name, ok: true, count: matchCount, totalFetched: result.length });
      } catch (e) {
        status.push({ source: source.name, ok: false, count: 0, error: String(e.message).slice(0, 120) });
      }
    }

    const manuallyEdited = existing.events.filter(e => e.manual || e.source?.includes('Instagram'));
    let fresh = dedupe([...raw, ...manuallyEdited]);
    if (raw.length === 0 && existing.events.length) fresh = existing.events;

    const output = { events: fresh, lastSynced: new Date().toISOString(), status, monthStart, monthEnd };
    await save(output);

    const filtered = (monthStart !== 'all' || monthEnd !== 'all')
      ? fresh.filter(e => matchesMonthRange(e, monthStart, monthEnd))
      : fresh;
    res.json({
      events: filtered,
      allEventsCount: fresh.length,
      monthStart,
      monthEnd,
      lastSynced: output.lastSynced,
      status
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    busy = false;
  }
});

app.post('/api/tournaments', async (req, res) => {
  const p = req.body || {};
  if (!p.title || !p.dateStart || !p.location) {
    return res.status(400).json({ error: 'Nama, tanggal mulai, dan lokasi wajib diisi' });
  }
  if (!/^20\d\d-\d\d-\d\d$/.test(p.dateStart)) {
    return res.status(400).json({ error: 'Tanggal harus berformat YYYY-MM-DD' });
  }

  const d = await load();
  const ev = {
    id: crypto.randomUUID(),
    title: compact(p.title).slice(0, 140),
    dateStart: p.dateStart,
    dateEnd: p.dateEnd || p.dateStart,
    location: compact(p.location).slice(0, 160),
    city: cityFrom(p.location),
    posterUrl: absolute(p.posterUrl, 'https://example.com'),
    registrationUrl: absolute(p.registrationUrl, 'https://example.com'),
    registrationType: p.registrationUrl ? 'registration' : 'missing',
    source: p.source || 'Input manual',
    sourceUrl: absolute(p.sourceUrl, 'https://example.com'),
    description: compact(p.description || '').slice(0, 400),
    category: compact(p.category || '').slice(0, 100) || null,
    manual: true,
    updatedAt: new Date().toISOString()
  };
  d.events.unshift(ev);
  await save(d);
  res.status(201).json(ev);
});

app.delete('/api/tournaments/:id', async (req, res) => {
  const d = await load();
  const ev = d.events.find(e => e.id === req.params.id);
  if (!ev || (!ev.manual && !ev.source?.includes('Instagram'))) {
    return res.status(404).json({ error: 'Hanya data manual atau input Instagram yang dapat dihapus' });
  }
  d.events = d.events.filter(e => e.id !== req.params.id);
  await save(d);
  res.json({ ok: true });
});

app.get('/api/sources', (req, res) => res.json(SOURCES));
app.get('/api/instagram/accounts', async (req, res) => {
  try {
    const list = JSON.parse(await fs.readFile(path.join(ROOT, 'data', 'instagram-accounts.json'), 'utf8'));
    return res.json(list);
  } catch {
    return res.json(JATIM_IG_ACCOUNTS);
  }
});

// ==================== INSTAGRAM DISCOVERY & NLP EXTRACTION ====================

const IG_BASE = `https://graph.facebook.com/${process.env.META_API_VERSION || 'v24.0'}`;
const IG_TOKEN = process.env.META_ACCESS_TOKEN || '';
const IG_USER = process.env.META_IG_USER_ID || '';
const igEnabled = () => Boolean(IG_TOKEN && IG_USER);

const igConfig = () => ({
  enabled: igEnabled(),
  hashtags: (process.env.IG_HASHTAGS || 'turnamenpadel,padeltournament,padelsurabaya,padelmalang')
    .split(',').map(x => x.trim().replace(/^#/, '')).filter(Boolean),
  accounts: (process.env.IG_ACCOUNTS || JATIM_IG_ACCOUNTS.map(a => a.username).join(','))
    .split(',').map(x => x.trim().replace(/^@/, '')).filter(Boolean)
});

async function graph(pathStr, params = {}) {
  if (!igEnabled()) throw new Error('Atur META_ACCESS_TOKEN dan META_IG_USER_ID di .env');
  const url = new URL(IG_BASE + '/' + pathStr.replace(/^\//, ''));
  for (const [k, v] of Object.entries({ ...params, access_token: IG_TOKEN })) {
    url.searchParams.set(k, String(v));
  }
  const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(String(data.error?.message || `Meta HTTP ${r.status}`).slice(0, 250));
  return data;
}

async function loadIg() {
  try {
    return JSON.parse(await fs.readFile(IG_DB, 'utf8'));
  } catch {
    return { candidates: [], lastScan: null, logs: [] };
  }
}

async function saveIg(o) {
  await fs.mkdir(path.dirname(IG_DB), { recursive: true });
  await fs.writeFile(IG_DB, JSON.stringify(o, null, 2));
}

const getPostUrl = v => {
  try {
    const u = new URL(v);
    if (!['www.instagram.com', 'instagram.com'].includes(u.hostname)) return null;
    const m = u.pathname.match(/(?:^|\/)(p|reel)\/([a-zA-Z0-9_-]+)/);
    if (!m) return null;
    return `https://www.instagram.com/${m[1]}/${m[2]}/`;
  } catch {
    return null;
  }
};

function decodeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(parseInt(code, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

async function fetchInstagramPostOg(url) {
  const cleanUrl = getPostUrl(url);
  if (!cleanUrl) return null;
  try {
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogTitleMatch = html.match(/<meta property="og:title" content="([\s\S]*?)"\s*\/>/i);
    const ogDescMatch = html.match(/<meta property="og:description" content="([\s\S]*?)"\s*\/>/i);
    const ogImageMatch = html.match(/<meta property="og:image" content="([\s\S]*?)"\s*\/>/i);
    const ogUrlMatch = html.match(/<meta property="og:url" content="([\s\S]*?)"\s*\/>/i);

    const titleRaw = ogTitleMatch ? decodeHtml(ogTitleMatch[1]) : '';
    const descRaw = ogDescMatch ? decodeHtml(ogDescMatch[1]) : '';
    const posterUrl = ogImageMatch ? decodeHtml(ogImageMatch[1]) : null;
    const finalUrl = ogUrlMatch ? ogUrlMatch[1] : cleanUrl;

    let username = null;
    const urlUserMatch = finalUrl.match(/instagram\.com\/([a-zA-Z0-9._]+)\/p\//i);
    if (urlUserMatch && !['p', 'reel', 'tv'].includes(urlUserMatch[1])) {
      username = urlUserMatch[1];
    } else {
      const titleUserMatch = titleRaw.match(/@([a-zA-Z0-9._]+)/);
      if (titleUserMatch) username = titleUserMatch[1];
    }

    let caption = '';
    const titleQuoteMatch = titleRaw.match(/on Instagram:\s*["“]([\s\S]*)["”]?$/i);
    if (titleQuoteMatch) {
      caption = titleQuoteMatch[1].replace(/["”]$/, '').trim();
    } else {
      caption = descRaw;
    }

    return {
      title: titleRaw,
      caption,
      posterUrl,
      sourceUrl: finalUrl,
      username
    };
  } catch {
    return null;
  }
}

function extractCandidate(post) {
  const caption = compact(post.caption || '');
  const date = dateFromText(caption);
  const city = cityFrom(caption);
  const relevant = /padel/i.test(caption) && /turnamen|tournament|championship|competition|open|cup|league|festival|kompetisi|kejuaraan|pendaftaran|series|match/i.test(caption);
  const locationMatched = isJatim(caption);

  const lines = (post.caption || '').split(/\n/).map(compact).filter(Boolean);
  let title = lines.find(line => /padel|tournament|turnamen|cup|championship|open|league/i.test(line)) || lines[0] || 'Turnamen Padel';
  title = title.replace(/#[\w_]+/g, '').replace(/https?:\/\/\S+/g, '').trim();
  title = title.split(/,\s*\d{1,2}/)[0].split(/\s+(?:di|pada|at)\s+/i)[0].trim().slice(0, 100);

  // Link extraction (WhatsApp, Bitly, Forms, or direct registration)
  const textLinks = (post.caption || '').match(/https?:\/\/[^\s<>"']+/g) || [];
  let link = textLinks
    .map(x => absolute(x.replace(/[),.]+$/g, ''), 'https://instagram.com'))
    .find(x => x && !x.includes('instagram.com')) || null;

  if (!link) {
    const waDirect = caption.match(/(?:https?:\/\/)?wa\.me\/(\d+)/i);
    if (waDirect) {
      link = `https://wa.me/${waDirect[1]}`;
    }
  }

  // Check for WhatsApp phone numbers if no direct URL found
  if (!link) {
    const wa = caption.match(/(?:wa|whatsapp|contact|cp|hubungi)[\s:]*(?:\+?62|08)\d{8,12}/i);
    if (wa) {
      const num = wa[0].replace(/\D/g, '').replace(/^0/, '62');
      link = `https://wa.me/${num}`;
    }
  }

  // Categories & Divisions
  const cats = [];
  if (/men['\s]?s?\s*double|ganda\s*putra/i.test(caption)) cats.push("Men's Double");
  if (/women['\s]?s?\s*double|ganda\s*putri/i.test(caption)) cats.push("Women's Double");
  if (/mixed\s*double|ganda\s*campuran/i.test(caption)) cats.push("Mixed Double");
  if (/beginner/i.test(caption)) cats.push("Beginner");
  if (/intermediate/i.test(caption)) cats.push("Intermediate");
  if (/bronze/i.test(caption)) cats.push("Bronze");
  if (/silver/i.test(caption)) cats.push("Silver");
  if (/open\s*(?:category)?/i.test(caption)) cats.push("Open");
  const categoryStr = cats.join(' • ') || null;

  // Prize extraction
  const prizeMatch = caption.match(/(?:total\s*hadiah|prize\s*money|cash\s*prize)[\s:]*(?:rp\.?\s*[\d.,]+|\d+\s*(?:juta|million))/i);
  const prizeStr = prizeMatch ? prizeMatch[0] : null;

  let score = (relevant ? 35 : 0) + (locationMatched ? 30 : 0) + (date?.start ? 25 : 0) + (link ? 10 : 0);

  const posterImg = absolute(post.media_type === 'VIDEO' ? post.thumbnail_url || post.media_url : post.media_url, 'https://instagram.com');

  return {
    id: hash(post.id || post.permalink || (title + (date?.start || ''))),
    mediaId: post.id || null,
    title,
    caption: caption.slice(0, 4000),
    city: locationMatched ? city : null,
    location: locationMatched ? (city === 'Surabaya' ? 'Surabaya, Jawa Timur' : `${city}, Jawa Timur`) : null,
    dateStart: date?.start || null,
    dateEnd: date?.end || date?.start || null,
    posterUrl: posterImg || null,
    sourceUrl: getPostUrl(post.permalink) || null,
    registrationUrl: link,
    sourceAccount: post.username ? `@${post.username.replace(/^@/, '')}` : null,
    category: categoryStr,
    prize: prizeStr,
    postedAt: post.timestamp || null,
    confidence: score,
    status: 'pending',
    discoveredAt: new Date().toISOString(),
    relevant,
    locationMatched
  };
}

function igUpsert(db, items) {
  const map = new Map(db.candidates.map(x => [x.sourceUrl || x.mediaId || x.id, x]));
  let added = 0;
  for (const c of items) {
    const key = c.sourceUrl || c.mediaId || c.id;
    if (!map.has(key)) {
      map.set(key, c);
      added++;
    } else {
      const old = map.get(key);
      map.set(key, { ...old, ...c });
    }
  }
  db.candidates = [...map.values()].sort((a, b) => b.discoveredAt.localeCompare(a.discoveredAt));
  return added;
}

let igBusy = false;

app.get('/api/instagram/config', (req, res) => res.json(igConfig()));
app.get('/api/instagram/candidates', async (req, res) => res.json(await loadIg()));

// Instant text / caption / URL parser for quick analysis
app.post('/api/instagram/parse', async (req, res) => {
  let { url, caption, posterUrl, sourceAccount } = req.body || {};
  if (url && (!caption || !posterUrl)) {
    const og = await fetchInstagramPostOg(url);
    if (og) {
      if (!caption && og.caption) caption = og.caption;
      if (!posterUrl && og.posterUrl) posterUrl = og.posterUrl;
      if (!sourceAccount && og.username) sourceAccount = og.username;
    }
  }
  const cand = extractCandidate({
    id: hash((url || '') + (caption || '')),
    permalink: url,
    caption: caption || '',
    media_url: posterUrl,
    username: sourceAccount
  });
  res.json(cand);
});

// Import a post by URL + provided caption/poster
app.post('/api/instagram/import', async (req, res) => {
  const p = req.body || {};
  let url = getPostUrl(p.sourceUrl);
  let caption = p.caption;
  let posterUrl = p.posterUrl;
  let sourceAccount = p.sourceAccount;

  if (url && (!caption || !posterUrl)) {
    const og = await fetchInstagramPostOg(url);
    if (og) {
      if (!caption && og.caption) caption = og.caption;
      if (!posterUrl && og.posterUrl) posterUrl = og.posterUrl;
      if (!sourceAccount && og.username) sourceAccount = og.username;
    }
  }

  if (!url && !compact(caption)) {
    return res.status(400).json({ error: 'Berikan URL Instagram atau tempel caption postingan' });
  }

  const candidate = extractCandidate({
    id: hash((url || '') + (caption || '')),
    permalink: url || `https://www.instagram.com/${sourceAccount ? sourceAccount.replace(/^@/, '') : 'p'}/`,
    caption: String(caption || '').slice(0, 5000),
    media_url: absolute(posterUrl, 'https://instagram.com'),
    username: (sourceAccount || '').replace(/^@/, '')
  });

  const db = await loadIg();
  igUpsert(db, [candidate]);
  await saveIg(db);
  res.status(201).json(candidate);
});

// Meta Graph API discovery
app.post('/api/instagram/scan', async (req, res) => {
  if (igBusy) return res.status(409).json({ error: 'Scan Instagram sedang berjalan' });
  if (!igEnabled()) {
    return res.status(400).json({ error: 'Konfigurasi Meta belum tersedia di .env' });
  }
  igBusy = true;
  try {
    const config = igConfig();
    const logs = [];
    const posts = [];

    for (const hashtag of config.hashtags.slice(0, 15)) {
      try {
        const tag = await graph('ig_hashtag_search', { user_id: IG_USER, q: hashtag });
        const id = tag.data?.[0]?.id;
        if (!id) {
          logs.push({ source: '#' + hashtag, ok: true, count: 0 });
          continue;
        }
        const result = await graph(`${id}/recent_media`, {
          user_id: IG_USER,
          fields: 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username',
          limit: 50
        });
        posts.push(...(result.data || []));
        logs.push({ source: '#' + hashtag, ok: true, count: result.data?.length || 0 });
      } catch (e) {
        logs.push({ source: '#' + hashtag, ok: false, error: e.message });
      }
    }

    for (const account of config.accounts.slice(0, 20)) {
      if (!/^[a-zA-Z0-9._]{1,30}$/.test(account)) {
        logs.push({ source: '@' + account, ok: false, error: 'Username tidak valid' });
        continue;
      }
      try {
        const query = `business_discovery.username(${account}){media.limit(25){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username}}`;
        const result = await graph(IG_USER, { fields: query });
        const list = result.business_discovery?.media?.data || [];
        posts.push(...list);
        logs.push({ source: '@' + account, ok: true, count: list.length });
      } catch (e) {
        logs.push({ source: '@' + account, ok: false, error: e.message });
      }
    }

    const candidates = posts.map(extractCandidate).filter(c => c.relevant && (c.locationMatched || c.confidence >= 55));
    const db = await loadIg();
    const added = igUpsert(db, candidates);
    db.lastScan = new Date().toISOString();
    db.logs = logs;
    await saveIg(db);

    res.json({ added, fetched: posts.length, eligible: candidates.length, logs, candidates: db.candidates });
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally {
    igBusy = false;
  }
});

app.patch('/api/instagram/candidates/:id', async (req, res) => {
  const db = await loadIg();
  const candidate = db.candidates.find(x => x.id === req.params.id);
  if (!candidate) return res.status(404).json({ error: 'Kandidat tidak ditemukan' });

  const status = req.body?.status;
  if (status === 'rejected') {
    candidate.status = 'rejected';
    await saveIg(db);
    return res.json(candidate);
  }

  if (status !== 'approved') {
    return res.status(400).json({ error: 'Status harus approved atau rejected' });
  }

  const p = req.body || {};
  const title = compact(p.title || candidate.title).slice(0, 140);
  const location = compact(p.location || candidate.location || 'Surabaya, Jawa Timur');
  const start = p.dateStart || candidate.dateStart;
  const end = p.dateEnd || candidate.dateEnd || start;

  if (!title || !location || !isJatim(location) || !start || !isoDate(start) || !isoDate(end) || end < start) {
    return res.status(400).json({ error: 'Nama, lokasi Jawa Timur, dan rentang tanggal valid (YYYY-MM-DD) wajib diisi' });
  }

  const regUrl = absolute(p.registrationUrl || candidate.registrationUrl, 'https://example.com');
  const poster = absolute(p.posterUrl || candidate.posterUrl, 'https://example.com');

  const data = await load();
  const old = data.events.find(x => x.sourceUrl === candidate.sourceUrl || x.id === candidate.id);

  const ev = {
    id: old?.id || crypto.randomUUID(),
    title,
    dateStart: start,
    dateEnd: end,
    location,
    city: cityFrom(location),
    posterUrl: poster,
    registrationUrl: regUrl,
    registrationType: regUrl ? 'registration' : 'missing',
    source: `Instagram (${candidate.sourceAccount || 'verified'})`,
    sourceUrl: candidate.sourceUrl,
    description: candidate.caption ? candidate.caption.slice(0, 500) : '',
    category: candidate.category || null,
    manual: true,
    updatedAt: new Date().toISOString()
  };

  data.events = old ? data.events.map(x => x.id === old.id ? ev : x) : [ev, ...data.events];
  await save(data);

  candidate.status = 'approved';
  candidate.approvedAt = new Date().toISOString();
  await saveIg(db);

  res.json({ candidate, event: ev });
});

function isoDate(x) {
  return /^20\d\d-\d\d-\d\d$/.test(x) && !Number.isNaN(Date.parse(x)) && new Date(x + 'T00:00:00Z').toISOString().slice(0, 10) === x;
}

app.listen(PORT, () => console.log(`Jatim Padel Scout: http://localhost:${PORT}`));
