import { NextRequest, NextResponse } from 'next/server';

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;

function parsePriceStr(s: string): string {
  if (!s) return '';
  const n = parseInt(s.replace(/[^0-9]/g, ''));
  if (isNaN(n)) return s;
  return n.toLocaleString('ko') + '원';
}

function browserHeaders(accept: string): Record<string, string> {
  return {
    'User-Agent':
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
    'Referer': 'https://map.kakao.com/',
    Accept: accept,
    ...(KAKAO_API_KEY ? { Authorization: `KakaoAK ${KAKAO_API_KEY}` } : {}),
  };
}

// Try JSON API (mobile + desktop endpoints)
async function fetchJson(id: string): Promise<Record<string, unknown> | null> {
  for (const url of [
    `https://place.map.kakao.com/m/main/v/${id}`,
    `https://place.map.kakao.com/main/v/${id}`,
  ]) {
    try {
      const res = await fetch(url, {
        headers: browserHeaders('application/json, text/plain, */*'),
        next: { revalidate: 3600 },
      });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('json')) continue;
      return await res.json();
    } catch { /* try next */ }
  }
  return null;
}

// Fetch HTML page and extract all photo URLs
async function fetchHtmlPhotos(id: string): Promise<string[]> {
  try {
    const res = await fetch(`https://place.map.kakao.com/${id}`, {
      headers: browserHeaders('text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'),
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const html = await res.text();

    const photos: string[] = [];

    // 1. og:image — always the main restaurant photo
    const ogMatch = html.match(/<meta property="og:image" content="([^"]+)"/);
    if (ogMatch?.[1]) photos.push(ogMatch[1]);

    // 2. User-uploaded fiy_reboot CDN photos embedded in page HTML
    const rebootMatches = html.match(
      /https:\/\/t1\.kakaocdn\.net\/fiy_reboot\/[^"'\s\\<>]+/g,
    ) ?? [];
    for (const url of [...new Set(rebootMatches)]) {
      // skip JS bundles and icons
      if (url.match(/\.(js|css|ico|svg|woff|ttf)(\?|$)/)) continue;
      if (!photos.includes(url) && photos.length < 6) photos.push(url);
    }

    // 3. shop/info CDN photos (business-registered, not just thumbnail)
    const shopMatches = html.match(
      /https:\/\/t1\.kakaocdn\.net\/shop\/info\/[^"'\s\\<>]+/g,
    ) ?? [];
    for (const url of [...new Set(shopMatches)]) {
      if (!photos.includes(url) && photos.length < 6) photos.push(url);
    }

    return photos;
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ menus: null, hours: null, photos: [] });

  try {
    // Run JSON API + HTML scrape in parallel
    const [data, htmlPhotos] = await Promise.all([fetchJson(id), fetchHtmlPhotos(id)]);

    // Build photos array: JSON API photos first, then HTML-scraped ones
    const photos: string[] = [];

    if (data) {
      const basic = data.basicInfo as Record<string, unknown> | undefined;
      const mainPhoto = basic?.mainphotourl as string | undefined;
      if (mainPhoto) photos.push(mainPhoto);

      const photoList =
        (data.photo as { photoList?: Array<{ orgurl?: string }> } | undefined)
          ?.photoList ?? [];
      for (const p of photoList) {
        if (p.orgurl && !photos.includes(p.orgurl) && photos.length < 6)
          photos.push(p.orgurl);
      }
    }

    // Merge HTML photos (de-duped)
    for (const url of htmlPhotos) {
      if (!photos.includes(url) && photos.length < 6) photos.push(url);
    }

    if (!data) {
      return NextResponse.json({ menus: null, hours: null, photos });
    }

    // Menus
    const menuInfo = data.menuInfo as Record<string, unknown> | undefined;
    const rawMenus: Array<{ menu: string; price?: string }> =
      (menuInfo?.menuList as Array<{ menu: string; price?: string }> | undefined) ?? [];
    const menus = rawMenus.slice(0, 8).map(item => ({
      e: '🍽️',
      n: item.menu,
      d: '',
      p: item.price ? parsePriceStr(item.price) : '',
    }));

    // Hours
    let hours = null;
    const basic = data.basicInfo as Record<string, unknown> | undefined;
    const openHour = basic?.openHour as Record<string, unknown> | undefined;
    const periodList: Array<{
      timeList?: Array<{ dayOfWeek: string; timeSE: string }>;
    }> =
      (openHour?.periodList as Array<{
        timeList?: Array<{ dayOfWeek: string; timeSE: string }>;
      }> | undefined) ?? [];

    if (periodList.length > 0) {
      const timeList = periodList[0]?.timeList ?? [];
      const weekday =
        timeList.find(t => t.dayOfWeek === 'WEEKDAY')?.timeSE ?? timeList[0]?.timeSE;
      const weekend =
        timeList.find(t => t.dayOfWeek === 'WEEKEND' || t.dayOfWeek === 'SAT')
          ?.timeSE ?? weekday;
      if (weekday) {
        hours = {
          weekday,
          weekend: weekend ?? weekday,
          breakTime: openHour?.breakTime as string | undefined,
          closedDay: openHour?.closedDay as string | undefined,
        };
      }
    }

    return NextResponse.json({ menus: menus.length > 0 ? menus : null, hours, photos });
  } catch {
    return NextResponse.json({ menus: null, hours: null, photos: [] });
  }
}
