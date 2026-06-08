import { NextRequest, NextResponse } from 'next/server';

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');

  if (!lat || !lng) {
    return NextResponse.json({ neighborhood: null });
  }

  if (!KAKAO_API_KEY || KAKAO_API_KEY.startsWith('여기에')) {
    // No key: approximate by matching default coordinates (Mapo-gu)
    const latN = parseFloat(lat);
    const lngN = parseFloat(lng);
    if (latN > 37.54 && latN < 37.56 && lngN > 126.89 && lngN < 126.92) {
      return NextResponse.json({ neighborhood: '합정동' });
    }
    return NextResponse.json({ neighborhood: null });
  }

  try {
    const url = new URL('https://dapi.kakao.com/v2/local/geo/coord2regioncode.json');
    url.searchParams.set('x', lng);
    url.searchParams.set('y', lat);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
      next: { revalidate: 60 },
    });

    if (!res.ok) throw new Error('kakao error');

    const data = await res.json();
    // H = 행정동, B = 법정동 — prefer 행정동
    const doc =
      data.documents?.find((d: { region_type: string }) => d.region_type === 'H') ??
      data.documents?.[0];

    const dong: string = doc?.region_3depth_name ?? doc?.region_2depth_name ?? '현재 위치';
    return NextResponse.json({ neighborhood: dong || null });
  } catch {
    return NextResponse.json({ neighborhood: null });
  }
}
