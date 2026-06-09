import { NextRequest, NextResponse } from 'next/server';

function parsePriceStr(s: string): string {
  if (!s) return '';
  const n = parseInt(s.replace(/[^0-9]/g, ''));
  if (isNaN(n)) return s;
  return n.toLocaleString('ko') + '원';
}

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Accept-Language': 'ko-KR,ko;q=0.9,en;q=0.8',
  'Referer': 'https://map.kakao.com/',
};

async function fetchJson(id: string) {
  const res = await fetch(`https://place.map.kakao.com/m/main/v/${id}`, {
    headers: { ...HEADERS, Accept: 'application/json, text/plain, */*' },
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('json')) return null;
  return res.json() as Promise<Record<string, unknown>>;
}

async function fetchOgImage(id: string): Promise<string | null> {
  try {
    const res = await fetch(`https://place.map.kakao.com/${id}`, {
      headers: {
        ...HEADERS,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html.match(/<meta property="og:image" content="([^"]+)"/)?.[1] ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ menus: null, hours: null, photoUrl: null });

  try {
    // Try JSON API first
    const data = await fetchJson(id);

    // Extract photo
    let photoUrl: string | null = null;
    if (data) {
      const basic = data.basicInfo as Record<string, unknown> | undefined;
      const photo = data.photo as Record<string, unknown> | undefined;
      photoUrl =
        (basic?.mainphotourl as string | undefined) ??
        ((photo?.photoList as Array<{ orgurl?: string }> | undefined)?.[0]?.orgurl ?? null);
    }

    // Fallback: parse og:image from HTML page
    if (!photoUrl) {
      photoUrl = await fetchOgImage(id);
    }

    if (!data) {
      return NextResponse.json({ menus: null, hours: null, photoUrl });
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
    const periodList: Array<{ timeList?: Array<{ dayOfWeek: string; timeSE: string }> }> =
      (openHour?.periodList as Array<{ timeList?: Array<{ dayOfWeek: string; timeSE: string }> }> | undefined) ?? [];

    if (periodList.length > 0) {
      const timeList = periodList[0]?.timeList ?? [];
      const weekday =
        timeList.find(t => t.dayOfWeek === 'WEEKDAY')?.timeSE ?? timeList[0]?.timeSE;
      const weekend =
        timeList.find(t => t.dayOfWeek === 'WEEKEND' || t.dayOfWeek === 'SAT')?.timeSE ??
        weekday;
      if (weekday) {
        hours = {
          weekday,
          weekend: weekend ?? weekday,
          breakTime: openHour?.breakTime as string | undefined,
          closedDay: openHour?.closedDay as string | undefined,
        };
      }
    }

    return NextResponse.json({
      menus: menus.length > 0 ? menus : null,
      hours,
      photoUrl,
    });
  } catch {
    return NextResponse.json({ menus: null, hours: null, photoUrl: null });
  }
}
