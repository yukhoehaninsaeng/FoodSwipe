import { NextRequest, NextResponse } from 'next/server';

const KAKAO_API_KEY = process.env.KAKAO_REST_API_KEY;

const CATEGORY_QUERIES: Record<string, string> = {
  korean:   '한식',
  japanese: '일식',
  western:  '양식',
  chinese:  '중식',
  cafe:     '카페',
  snack:    '분식',
  chicken:  '치킨',
  seafood:  '해산물',
  dessert:  '디저트',
};

// Multiple food photos per category — picked consistently by placeId hash
const CATEGORY_PHOTOS: Record<string, string[]> = {
  '한식': [
    'https://images.unsplash.com/photo-1617195737496-bc30194e3a19?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1583623025817-d180a2221d0a?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '일식': [
    'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '양식': [
    'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '중식': [
    'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '카페': [
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '분식': [
    'https://images.unsplash.com/photo-1542010589005-d1eacc3918f2?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '치킨': [
    'https://images.unsplash.com/photo-1569565782892-1bdcf1b0b9c6?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '해산물': [
    'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1559742811-822873691df8?w=600&h=800&q=80&auto=format&fit=crop',
  ],
  '디저트': [
    'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=800&q=80&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=800&q=80&auto=format&fit=crop',
  ],
};
const DEFAULT_PHOTOS = CATEGORY_PHOTOS['한식'];

function getPhotoUrl(placeId: string, category: string): string {
  const photos = CATEGORY_PHOTOS[category] ?? DEFAULT_PHOTOS;
  // Consistent pick per restaurant (last 4 digits of id mod pool size)
  const idx = parseInt(placeId.slice(-4) || '0', 10) % photos.length;
  return photos[idx];
}

function getPriceLevel(categoryName: string): string {
  if (categoryName.includes('스시') || categoryName.includes('오마카세')) return '₩₩₩₩';
  if (categoryName.includes('레스토랑') || categoryName.includes('이탈리안')) return '₩₩₩';
  return '₩₩';
}

function formatDistance(meters: string): string {
  const m = Number(meters);
  if (m < 1000) return `${m}m`;
  return `${(m / 1000).toFixed(1)}km`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat  = searchParams.get('lat')  ?? process.env.NEXT_PUBLIC_DEFAULT_LAT ?? '37.5434';
  const lng  = searchParams.get('lng')  ?? process.env.NEXT_PUBLIC_DEFAULT_LNG ?? '126.9076';
  const cats = searchParams.get('cats') ?? '';
  const mode = searchParams.get('mode') ?? 'food'; // 'food' | 'cafe'

  if (!KAKAO_API_KEY || KAKAO_API_KEY.startsWith('여기에')) {
    const { RESTAURANTS } = await import('@/data/restaurants');
    const filtered = mode === 'cafe'
      ? RESTAURANTS.filter(r => r.category === '카페' || r.category === '디저트')
      : RESTAURANTS.filter(r => r.category !== '카페');
    return NextResponse.json({ restaurants: filtered.length > 3 ? filtered : RESTAURANTS, source: 'mock' });
  }

  // 카페 모드: CE7만 검색. 음식 모드: FD6 + 사용자 취향
  const queries: Array<{ query: string; code: string }> = mode === 'cafe'
    ? [
        { query: '카페',   code: 'CE7' },
        { query: '디저트', code: 'CE7' },
      ]
    : cats
      ? cats.split(',').map(k => ({ query: CATEGORY_QUERIES[k] ?? k, code: 'FD6' }))
      : [{ query: '음식점', code: 'FD6' }];

  const results: Record<string, boolean> = {};
  const restaurants: object[] = [];

  for (const { query, code } of queries) {
    const url = new URL('https://dapi.kakao.com/v2/local/search/keyword.json');
    url.searchParams.set('query', query);
    url.searchParams.set('y', lat);
    url.searchParams.set('x', lng);
    url.searchParams.set('radius', '2000');
    url.searchParams.set('size', '10');
    url.searchParams.set('sort', 'distance');
    url.searchParams.set('category_group_code', code);

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` },
        next: { revalidate: 300 },
      });

      if (!res.ok) continue;
      const data = await res.json();

      for (const place of data.documents ?? []) {
        if (results[place.id]) continue;
        results[place.id] = true;

        const catParts = (place.category_name as string).split(' > ');
        const mainCat = catParts[1] ?? catParts[0] ?? '음식점';

        restaurants.push({
          id: place.id,
          name: place.place_name,
          category: mainCat,
          rating: Number((3.8 + Math.random() * 1.1).toFixed(1)),
          distance: formatDistance(place.distance || '500'),
          distanceM: Number(place.distance || 500),
          priceLevel: getPriceLevel(place.category_name),
          address: place.road_address_name || place.address_name,
          tags: catParts.slice(2, 4),
          imageUrl: getPhotoUrl(place.id, mainCat),
          placeUrl: place.place_url,
          phone: place.phone,
        });
      }
    } catch {
      // 개별 쿼리 실패 시 계속 진행
    }
  }

  // 충분한 결과가 없으면 목업 데이터로 보완
  if (restaurants.length < 5) {
    const { RESTAURANTS } = await import('@/data/restaurants');
    const extras = RESTAURANTS.filter(r => !results[r.id]).slice(0, 8);
    return NextResponse.json({
      restaurants: [...restaurants, ...extras],
      source: restaurants.length > 0 ? 'kakao+mock' : 'mock',
    });
  }

  return NextResponse.json({ restaurants, source: 'kakao' });
}
