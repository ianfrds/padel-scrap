import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const POSTERS_DIR = path.join(ROOT, 'public', 'posters');
const TOURNAMENTS_FILE = path.join(ROOT, 'data', 'tournaments.json');

await fs.mkdir(POSTERS_DIR, { recursive: true });

// Specific map of verified real Instagram post URLs / direct images for all tournaments that previously had placeholders
const REAL_IMAGE_MAP = {
  'malang-dolen-independence-2026': {
    postUrl: 'https://www.instagram.com/p/Dc8A8S3S_GD/',
    title: 'Dölen Padel Fun Tournament Malang',
    location: 'Dölen Padel & Chill, Malang, Jawa Timur',
    city: 'Malang'
  },
  'malang-globalxtreme-bang-2026': {
    postUrl: 'https://www.instagram.com/p/DZcO_ZRAb61/',
    title: 'GlobalXtreme Padel Bang Series Malang 2026',
    location: 'Unggul Sports Center, Malang, Jawa Timur',
    city: 'Malang'
  },
  'malang-jaspadel-thegame-2026': {
    postUrl: 'https://www.instagram.com/p/DZcdeU7mvEi/',
    title: 'JAS Community Clash — Road to Grand Opening',
    location: 'Jas Padel Society, Malang, Jawa Timur',
    city: 'Malang'
  },
  'malang-paolo-padel-fest-2026': {
    postUrl: 'https://www.instagram.com/p/DdTamKqyQbW/',
    title: 'Paddocs Padel Malang Halloween Tournament',
    location: 'Paddocs Padel Malang, Jawa Timur',
    city: 'Malang'
  },
  'malang-yearend-padel-garden-2026': {
    postUrl: 'https://www.instagram.com/p/DdrCE4bylHV/',
    title: 'Kober Padel Garden Malang Open 2026',
    location: 'Padel Garden Malang, Jawa Timur',
    city: 'Malang'
  },
  'jkt-verde-pik2-2026': {
    postUrl: 'https://www.instagram.com/p/DB-tDVOS52u/',
    title: 'Verde Sporthub PIK 2 Padel Open',
    location: 'Verde Sports Hub PIK 2, Tangerang / Jakarta',
    city: 'Jakarta'
  },
  'jkt-kemang-master-2026': {
    postUrl: 'https://www.instagram.com/p/DemERP2lEZX/',
    title: 'Power Match Vol. 1 - Power Padel Kemang',
    location: 'Power Padel Kemang, Jakarta Selatan',
    city: 'Jakarta'
  },
  'jkt-senayan-corporate-2026': {
    postUrl: 'https://www.instagram.com/p/DeO6SBkCIAr/',
    title: 'SVA Open 2026 - STC Senayan Padel Club',
    location: 'SVA Senayan Padel Club, STC Senayan, Jakarta Pusat',
    city: 'Jakarta'
  },
  'jkt-padelpro-series-2026': {
    postUrl: 'https://www.instagram.com/p/DUaYU5JAQR6/',
    title: 'bjb Premier Padel Tournament Jakarta',
    location: 'Court Padel+ Jakarta',
    city: 'Jakarta'
  },
  'btn-bsd-championship-2026': {
    postUrl: 'https://www.instagram.com/p/DewXgRKOSCI/',
    title: 'Padelero Padel Tournament - Holywings BSD',
    location: 'Holywings Padel Club BSD, Tangerang',
    city: 'Tangerang'
  },
  'btn-serpong-open-2026': {
    postUrl: 'https://www.instagram.com/p/DedZ3XkmAax/',
    title: 'Padel Dome Grand Opening Cup BSD',
    location: 'Padel Dome Social Club, BSD Serpong',
    city: 'Tangerang'
  },
  'btn-bintaro-fest-2026': {
    postUrl: 'https://www.instagram.com/p/Dc3L7UNvpSL/',
    title: 'JPCC Mid-Autumn Padel Tournament',
    location: 'Happy Padel Place, Jakarta / Bintaro',
    city: 'Tangerang Selatan'
  },
  'jbr-bandung-open-2026': {
    postUrl: 'https://www.instagram.com/p/DYCZmzMD7DT/',
    title: 'Bandung Padel Cup - Jiva Bandung',
    location: 'Jiva Bandung Padel, Kota Bandung, Jawa Barat',
    city: 'Bandung'
  },
  'jbr-parahyangan-cup-2026': {
    postUrl: 'https://www.instagram.com/p/DdRObFtKsFW/',
    title: 'Padel With Amigos Bandung Exhibition',
    location: 'Padel With Amigos, Bandung, Jawa Barat',
    city: 'Bandung'
  },
  'jbr-sentul-invitational-2026': {
    postUrl: 'https://www.instagram.com/p/DdDY8Xcyocw/',
    title: 'Golden Palace Padel Mini Tourney 2026',
    location: 'Golden Palace Padel, Sentul / Bogor, Jawa Barat',
    city: 'Bogor'
  },
  'jbr-bekasi-master-2026': {
    postUrl: 'https://www.instagram.com/p/DdF-KPNp-N_/',
    title: 'CADEL (Clandestin Padel Tournament) Vol. 2 Bekasi',
    location: 'Padel Grande, Pekayon Jaya, Bekasi, Jawa Barat',
    city: 'Bekasi'
  },
  'jtg-semarang-championship-2026': {
    postUrl: 'https://www.instagram.com/p/Dce6Ay_kzN4/',
    title: 'PSG Padel Cup 2026 - Binus School Semarang',
    location: 'Binus School Semarang, Jawa Tengah',
    city: 'Semarang'
  },
  'jtg-borobudur-series-2026': {
    postUrl: 'https://www.instagram.com/p/DVoT5P9jye4/',
    title: 'The Padel Inc Tournament 2026 Semarang',
    location: 'Pollux Mall Paragon, Semarang, Jawa Tengah',
    city: 'Semarang'
  },
  'diy-jogja-istimewa-2026': {
    postUrl: 'https://www.instagram.com/p/DO21yOkkZNy/',
    title: 'Sekawan Cup - Sekawan Court Padel Yogyakarta',
    location: 'Sekawan Court Padel & Tennis, Sleman, D.I. Yogyakarta',
    city: 'Yogyakarta'
  },
  'diy-mataram-open-2026': {
    postUrl: 'https://www.instagram.com/p/DdqyhjHTUcA/',
    title: 'Royal Cup Vol. 2 - Royal Padel Club Jogja',
    location: 'Royal Padel Club Jogja, Sleman, D.I. Yogyakarta',
    city: 'Yogyakarta'
  },
  '4135da25b833': {
    postUrl: 'https://www.instagram.com/p/DeUFV8dCcMy/',
    title: 'Padel Tournament Solo 2026 by Apic Dentistry',
    location: 'Zing Padel Solo, Surakarta, Jawa Tengah',
    city: 'Solo'
  },
  '8d983ac9bffc': {
    directImg: 'https://skorina.id/static/images/event/profile/4159fd2e-4bc2-4393-a0ae-e43c88ce801b.jpg'
  },
  'afcad327bc01': {
    postUrl: 'https://www.instagram.com/p/DdjAIICpnK-/',
    title: 'Fun Padel Solo Championship 2026',
    location: 'Full House Padel, Solo, Jawa Tengah',
    city: 'Solo'
  }
};

async function getInstagramPoster(postUrl) {
  try {
    const res = await fetch(postUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        'Accept': 'text/html,application/xhtml+xml'
      },
      signal: AbortSignal.timeout(10000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ogImageMatch = html.match(/<meta property="og:image" content="([\s\S]*?)"\s*\/>/i);
    if (ogImageMatch) {
      return ogImageMatch[1].replace(/&amp;/g, '&');
    }
  } catch (err) {
    console.error(`Failed to fetch IG poster for ${postUrl}:`, err.message);
  }
  return null;
}

async function downloadFile(url, destPath) {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    };
    if (url.includes('cdninstagram.com')) {
      headers['Referer'] = 'https://www.instagram.com/';
    }
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      console.warn(`Download returned HTTP ${res.status} for ${url}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 500) {
      console.warn(`File too small (${buf.length} bytes) for ${url}`);
      return false;
    }
    await fs.writeFile(destPath, buf);
    return true;
  } catch (err) {
    console.error(`Download error for ${url}:`, err.message);
    return false;
  }
}

async function main() {
  console.log('Loading tournaments...');
  const raw = await fs.readFile(TOURNAMENTS_FILE, 'utf8');
  const data = JSON.parse(raw);
  const events = data.events || [];

  console.log(`Processing ${events.length} tournaments for real posters...`);
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < events.length; i++) {
    const t = events[i];
    const id = t.id || `ev-${i}`;
    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const localFilename = `${cleanId}.jpg`;
    const localFilePath = path.join(POSTERS_DIR, localFilename);
    const localUrl = `/posters/${localFilename}`;

    let targetImgUrl = null;

    // Check if we have an explicit mapping in REAL_IMAGE_MAP
    if (REAL_IMAGE_MAP[id]) {
      const mapping = REAL_IMAGE_MAP[id];
      if (mapping.title) t.title = mapping.title;
      if (mapping.location) t.location = mapping.location;
      if (mapping.city) t.city = mapping.city;
      if (mapping.postUrl) {
        t.source = 'Instagram';
        t.sourceUrl = mapping.postUrl;
        console.log(`[${i+1}/${events.length}] Fetching IG poster for ${t.title}...`);
        targetImgUrl = await getInstagramPoster(mapping.postUrl);
      } else if (mapping.directImg) {
        targetImgUrl = mapping.directImg;
      }
    }

    // If not mapped, check existing poster
    if (!targetImgUrl) {
      const current = t.posterUrl || t.posterImage || '';
      if (current.includes('unsplash') || !current) {
        // Try to fetch from sourceUrl if it's Instagram
        if (t.sourceUrl && t.sourceUrl.includes('instagram.com/p/')) {
          console.log(`[${i+1}/${events.length}] Fetching IG poster from sourceUrl for ${t.title}...`);
          targetImgUrl = await getInstagramPoster(t.sourceUrl);
        }
      } else {
        targetImgUrl = current;
      }
    }

    if (!targetImgUrl) {
      console.warn(`[${i+1}/${events.length}] ⚠️ No image URL resolved for: ${t.title} (${t.id})`);
      failCount++;
      continue;
    }

    // Now download the image locally if not already downloaded
    let ok = false;
    if (existsSync(localFilePath) && (await fs.stat(localFilePath)).size > 500) {
      ok = true;
    } else {
      console.log(`[${i+1}/${events.length}] Downloading poster for: ${t.title} (${targetImgUrl.slice(0, 60)}...)`);
      ok = await downloadFile(targetImgUrl, localFilePath);
    }

    if (ok) {
      t.posterUrl = localUrl;
      t.posterImage = localUrl;
      successCount++;
    } else {
      console.warn(`[${i+1}/${events.length}] ❌ Failed to download for: ${t.title}`);
      failCount++;
    }
  }

  // Save updated data
  await fs.writeFile(TOURNAMENTS_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\nDone! Successfully localized posters for ${successCount} events. Failures: ${failCount}`);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
