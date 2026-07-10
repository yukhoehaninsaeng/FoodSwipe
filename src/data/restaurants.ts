export interface MenuItem {
  e: string;
  n: string;
  d: string;
  p: string;
}

export interface BusinessHours {
  weekday: string;
  weekend: string;
  breakTime?: string;
  closedDay?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: string;
  distanceM: number;
  priceLevel: string;
  address: string;
  tags: string[];
  imageUrl: string;
  photos?: string[];
  menus?: MenuItem[];
  hours?: BusinessHours;
  phone?: string;
  placeUrl?: string;
  aiHint?: string;
  isSponsored?: boolean;
}

export function isOpen(hours: BusinessHours): boolean {
  const now = new Date();
  const isWeekend = now.getDay() === 0 || now.getDay() === 6;
  const timeStr = isWeekend ? hours.weekend : hours.weekday;
  const parseM = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); };
  const [openStr, closeStr] = timeStr.split('-');
  const nowM = now.getHours() * 60 + now.getMinutes();
  const openM = parseM(openStr);
  let closeM = parseM(closeStr);
  if (closeM < openM) closeM += 24 * 60;
  const adjNow = nowM < openM ? nowM + 24 * 60 : nowM;
  if (adjNow < openM || adjNow >= closeM) return false;
  if (hours.breakTime) {
    const [bs, be] = hours.breakTime.split('-').map(parseM);
    if (nowM >= bs && nowM < be) return false;
  }
  return true;
}

export const FOOD: Restaurant[] = [
  {
    id: 'f1',
    name: '진미 삼겹살',
    category: '한식',
    rating: 4.7,
    distance: '350m',
    distanceM: 350,
    priceLevel: '₩₩',
    address: '서울 마포구 합정동 391-5',
    tags: ['삼겹살', '회식'],
    imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617195737496-bc30194e3a19?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🥩', n: '삼겹살', d: '국내산 생삼겹살', p: '15,000원' },
      { e: '🍖', n: '목살', d: '항정살+목살 세트', p: '16,000원' },
      { e: '🫕', n: '된장찌개', d: '기본 반찬 포함', p: '2,000원' },
    ],
    hours: { weekday: '17:00-24:00', weekend: '16:00-24:00' },
    phone: '02-1234-5678',
    aiHint: '최근 방문한 한식당 기반 추천',
  },
  {
    id: 'f2',
    name: '스시 오마카세 한나',
    category: '일식',
    rating: 4.9,
    distance: '1.2km',
    distanceM: 1200,
    priceLevel: '₩₩₩₩',
    address: '서울 강남구 청담동 18-12',
    tags: ['오마카세', '예약필수'],
    imageUrl: 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617622141573-2e59a17e4d96?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🍣', n: '런치 오마카세', d: '제철 스시 12점', p: '65,000원' },
      { e: '🐟', n: '디너 오마카세', d: '프리미엄 스시 18점', p: '120,000원' },
    ],
    hours: { weekday: '12:00-22:00', weekend: '12:00-22:00', closedDay: '월요일' },
    phone: '02-9876-5432',
    aiHint: '취향 벡터 93% 일치',
  },
  {
    id: 'f3',
    name: '브루클린 버거',
    category: '양식',
    rating: 4.4,
    distance: '600m',
    distanceM: 600,
    priceLevel: '₩₩',
    address: '서울 마포구 서교동 456-7',
    tags: ['수제버거', '테이크아웃'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🍔', n: '클래식 버거', d: '홈메이드 패티+수제소스', p: '13,000원' },
      { e: '🧀', n: '더블치즈버거', d: '체다치즈 2장+베이컨', p: '16,500원' },
      { e: '🍟', n: '감자튀김 세트', d: '버거+감자+음료', p: '18,000원' },
    ],
    hours: { weekday: '11:00-22:00', weekend: '11:00-23:00', breakTime: '15:30-17:00' },
  },
  {
    id: 'f4',
    name: '얼큰칼국수',
    category: '한식',
    rating: 4.3,
    distance: '450m',
    distanceM: 450,
    priceLevel: '₩',
    address: '서울 마포구 망원동 155-3',
    tags: ['칼국수', '국물맛집'],
    imageUrl: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617195737496-bc30194e3a19?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🍜', n: '얼큰칼국수', d: '진한 육수 직접 뽑은 면', p: '9,000원' },
      { e: '🥟', n: '만두전골', d: '수제만두+채소', p: '13,000원' },
      { e: '🫘', n: '보쌈', d: '수육+배추김치', p: '22,000원' },
    ],
    hours: { weekday: '10:30-21:00', weekend: '10:30-20:00', breakTime: '14:30-16:00', closedDay: '일요일' },
    aiHint: '날씨 기반 추천 (흐림)',
  },
  {
    id: 'f5',
    name: '사보텐 돈카츠',
    category: '일식',
    rating: 4.5,
    distance: '800m',
    distanceM: 800,
    priceLevel: '₩₩',
    address: '서울 마포구 합정동 399-2',
    tags: ['돈카츠', '세트메뉴'],
    imageUrl: 'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1580822184713-fc5400e7fe10?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🥩', n: '로스카츠', d: '등심 170g 두툼한 커트', p: '17,000원' },
      { e: '🐷', n: '히레카츠', d: '안심 3조각 부드러운 맛', p: '19,000원' },
      { e: '🍱', n: '런치세트', d: '카츠+밥+된장국+샐러드', p: '14,500원' },
    ],
    hours: { weekday: '11:00-21:30', weekend: '11:00-21:30', breakTime: '15:00-17:00' },
  },
  {
    id: 'f6',
    name: '이탈리안 키친',
    category: '양식',
    rating: 4.6,
    distance: '950m',
    distanceM: 950,
    priceLevel: '₩₩₩',
    address: '서울 마포구 서교동 488-12',
    tags: ['파스타', '와인'],
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🍝', n: '까르보나라', d: '생크림+판체타+파르미지아노', p: '19,000원' },
      { e: '🍕', n: '마르게리타', d: '나폴리 도우+산마르자노', p: '22,000원' },
      { e: '🥩', n: '티본스테이크', d: '450g 드라이에이징', p: '52,000원' },
    ],
    hours: { weekday: '12:00-22:00', weekend: '12:00-23:00', breakTime: '15:00-17:30' },
  },
  {
    id: 'f7',
    name: '진미평양냉면',
    category: '한식',
    rating: 4.8,
    distance: '2.1km',
    distanceM: 2100,
    priceLevel: '₩₩',
    address: '서울 마포구 공덕동 22-1',
    tags: ['평양냉면', '만두'],
    imageUrl: 'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1635363638580-c2809d049eee?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617195737496-bc30194e3a19?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🍜', n: '평양냉면', d: '메밀 직접 뽑기 육수', p: '13,000원' },
      { e: '🥟', n: '만두', d: '고기+부추 수제만두 6개', p: '9,000원' },
    ],
    hours: { weekday: '11:00-21:00', weekend: '11:00-21:00', closedDay: '월요일' },
    aiHint: '지난주 좋아한 냉면집과 비슷',
  },
];

export const CAFE: Restaurant[] = [
  {
    id: 'c1',
    name: '빈티지 커피로스터스',
    category: '카페',
    rating: 4.6,
    distance: '200m',
    distanceM: 200,
    priceLevel: '₩₩',
    address: '서울 마포구 연남동 566-22',
    tags: ['스페셜티', '조용한분위기'],
    imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '☕', n: '에스프레소', d: '에티오피아 예가체프 원두', p: '4,500원' },
      { e: '🥛', n: '플랫화이트', d: '마이크로폼 리스트레토', p: '6,000원' },
      { e: '🧋', n: '콜드브루', d: '12시간 더치 추출', p: '7,000원' },
    ],
    hours: { weekday: '09:00-22:00', weekend: '10:00-23:00' },
    isSponsored: true,
  },
  {
    id: 'c2',
    name: '핸드드립 스튜디오',
    category: '카페',
    rating: 4.8,
    distance: '550m',
    distanceM: 550,
    priceLevel: '₩₩',
    address: '서울 마포구 서교동 355-11',
    tags: ['핸드드립', '원두선택'],
    imageUrl: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '☕', n: '핸드드립', d: '직접 선택한 원두로 추출', p: '8,000원' },
      { e: '🫖', n: '커피 클래스', d: '1시간 드립 체험', p: '35,000원' },
    ],
    hours: { weekday: '11:00-20:00', weekend: '11:00-21:00', closedDay: '월요일' },
  },
  {
    id: 'c3',
    name: '디저트 39',
    category: '디저트',
    rating: 4.7,
    distance: '380m',
    distanceM: 380,
    priceLevel: '₩₩',
    address: '서울 마포구 합정동 399-17',
    tags: ['케이크', '마카롱'],
    imageUrl: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🎂', n: '바스크 치즈케이크', d: '당일 제작 홈베이킹', p: '8,500원' },
      { e: '🌸', n: '마카롱 세트', d: '5가지 맛 홈메이드', p: '12,000원' },
      { e: '🍦', n: '크레이프 케이크', d: '20겹 수제 크레이프', p: '9,000원' },
    ],
    hours: { weekday: '12:00-21:00', weekend: '11:00-22:00' },
  },
  {
    id: 'c4',
    name: '모닝 브런치카페',
    category: '카페',
    rating: 4.4,
    distance: '720m',
    distanceM: 720,
    priceLevel: '₩₩',
    address: '서울 마포구 연남동 567-3',
    tags: ['브런치', '에그베네딕트'],
    imageUrl: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🍳', n: '에그베네딕트', d: '수란+홀란데이즈소스', p: '16,000원' },
      { e: '🥞', n: '팬케이크 세트', d: '4장+메이플시럽+버터', p: '14,000원' },
      { e: '🥤', n: '과일 스무디', d: '계절과일 블렌드', p: '8,500원' },
    ],
    hours: { weekday: '09:00-18:00', weekend: '09:00-19:00' },
  },
  {
    id: 'c5',
    name: '모던 티하우스',
    category: '카페',
    rating: 4.5,
    distance: '1.1km',
    distanceM: 1100,
    priceLevel: '₩₩',
    address: '서울 마포구 서교동 355-20',
    tags: ['차', '조용한'],
    imageUrl: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=800&q=85&auto=format&fit=crop',
    photos: [
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&h=500&q=85&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&h=500&q=85&auto=format&fit=crop',
    ],
    menus: [
      { e: '🍵', n: '말차 라떼', d: '우지 말차+오트밀크', p: '7,500원' },
      { e: '🫖', n: '다르질링', d: '퍼스트플러시 홍차', p: '9,000원' },
      { e: '🌿', n: '루이보스 블렌드', d: '허브티 3종 블렌딩', p: '8,000원' },
    ],
    hours: { weekday: '11:00-21:00', weekend: '11:00-22:00' },
  },
];

export const RESTAURANTS: Restaurant[] = [...FOOD, ...CAFE];

export const FALLBACK_IMAGES: Record<string, string> = {
  '한식': 'https://images.unsplash.com/photo-1617195737496-bc30194e3a19?w=600&h=800&q=80&auto=format&fit=crop',
  '일식': 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=800&q=80&auto=format&fit=crop',
  '양식': 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=800&q=80&auto=format&fit=crop',
  '중식': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&h=800&q=80&auto=format&fit=crop',
  '카페': 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600&h=800&q=80&auto=format&fit=crop',
  '분식': 'https://images.unsplash.com/photo-1542010589005-d1eacc3918f2?w=600&h=800&q=80&auto=format&fit=crop',
  '치킨': 'https://images.unsplash.com/photo-1569565782892-1bdcf1b0b9c6?w=600&h=800&q=80&auto=format&fit=crop',
  '해산물': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&h=800&q=80&auto=format&fit=crop',
  '디저트': 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=600&h=800&q=80&auto=format&fit=crop',
  '음식점': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=800&q=80&auto=format&fit=crop',
};
