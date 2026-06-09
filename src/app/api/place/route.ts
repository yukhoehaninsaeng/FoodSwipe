import { NextRequest, NextResponse } from 'next/server';

function parsePriceStr(s: string): string {
  if (!s) return '';
  const n = parseInt(s.replace(/[^0-9]/g, ''));
  if (isNaN(n)) return s;
  return n.toLocaleString('ko') + '원';
}

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ menus: null, hours: null });

  try {
    const res = await fetch(`https://place.map.kakao.com/m/main/v/${id}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://map.kakao.com/',
        'Origin': 'https://map.kakao.com',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return NextResponse.json({ menus: null, hours: null });

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('json')) return NextResponse.json({ menus: null, hours: null });

    const data = await res.json();

    // ── 메뉴 파싱 ──
    const rawMenus: Array<{ menu: string; price?: string }> =
      data.menuInfo?.menuList ?? [];
    const menus = rawMenus.slice(0, 8).map(item => ({
      e: '🍽️',
      n: item.menu,
      d: '',
      p: item.price ? parsePriceStr(item.price) : '',
    }));

    // ── 영업시간 파싱 ──
    let hours = null;
    const periodList: Array<{
      timeList?: Array<{ dayOfWeek: string; timeSE: string }>;
    }> = data.basicInfo?.openHour?.periodList ?? [];

    if (periodList.length > 0) {
      const timeList = periodList[0]?.timeList ?? [];
      const weekday =
        timeList.find(t => t.dayOfWeek === 'WEEKDAY')?.timeSE ??
        timeList[0]?.timeSE;
      const weekend =
        timeList.find(t => t.dayOfWeek === 'WEEKEND' || t.dayOfWeek === 'SAT')
          ?.timeSE ?? weekday;
      const breakTime: string | undefined =
        data.basicInfo?.openHour?.breakTime;
      const closedDay: string | undefined =
        data.basicInfo?.openHour?.closedDay;

      if (weekday) {
        hours = { weekday, weekend: weekend ?? weekday, breakTime, closedDay };
      }
    }

    return NextResponse.json({
      menus: menus.length > 0 ? menus : null,
      hours,
      placeUrl: data.basicInfo?.placenamefull
        ? `https://place.map.kakao.com/${id}`
        : null,
    });
  } catch {
    return NextResponse.json({ menus: null, hours: null });
  }
}
