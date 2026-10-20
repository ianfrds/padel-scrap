import * as cheerio from 'cheerio';

async function testVenueResolve() {
  const clubUrl = 'https://reclub.co/clubs/@junglepadelsurabaya';
  const res = await fetch(clubUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const html = await res.text();
  const $ = cheerio.load(html);
  const data = JSON.parse($('#__NUXT_DATA__').text());
  const resolve = idx => (typeof idx === 'number' && idx >= 0 && idx < data.length ? data[idx] : idx);

  for (const item of data) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    if (!('startDatetime' in item && 'referenceCode' in item)) continue;

    const rawName = resolve(item.name);
    const venuePointer = Array.isArray(item.venue) ? item.venue[1] : item.venue;
    const venueObj = resolve(venuePointer);
    const venueName = venueObj ? resolve(venueObj.name) : 'Surabaya';
    
    let city = 'Surabaya';
    if (venueObj && venueObj.location) {
      const locObj = resolve(venueObj.location);
      if (locObj && locObj.locality) {
        city = resolve(locObj.locality);
      }
    }

    console.log({
      name: resolve(rawName),
      venue: venueName,
      city
    });
    break;
  }
}
testVenueResolve();
