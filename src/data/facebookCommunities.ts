import { TangoEvent, EventType } from '../types';

export interface FacebookScrapedEvent {
  event_name: string;
  event_type: EventType;
  start_date: string;
  end_date: string;
  city: string;
  state?: string;
  country_code: string;
  address: string;
  price: string;
  is_free?: boolean;
  source_url: string;
  notes?: string;
  community_name: string;
  organizer?: string;
  published_time?: string;
}

export interface FacebookCommunity {
  id: string;
  name: string;
  groupHandle: string;
  url: string;
  city: string;
  state?: string;
  country_code: string;
  region: 'korea' | 'usa' | 'americas' | 'europe' | 'asia';
  memberCount: string;
  description: string;
  events: FacebookScrapedEvent[];
}

export const FACEBOOK_TANGO_COMMUNITIES: FacebookCommunity[] = [
  // --- KOREA ---
  {
    id: 'fb_seoul_tango_people',
    name: '서울 탱고 피플 (Seoul Tango People FB Community)',
    groupHandle: 'groups/seoultangopeople',
    url: 'https://facebook.com/groups/seoultangopeople',
    city: 'Seoul',
    state: 'Mapo-gu',
    country_code: 'KR',
    region: 'korea',
    memberCount: '8,400+ members',
    description: '서울 및 수도권 탱고 댄서들의 최대 페이스북 커뮤니티. 주말 밀롱가, 번개 쁘락띠까, 워크샵 공지 공유.',
    events: [
      {
        event_name: '서울 탱고 피플 가을 그랜드 살롱 밀롱가 (Seoul Grand Autumn Milonga)',
        event_type: 'MILONGA',
        start_date: '2026-10-24',
        end_date: '2026-10-24',
        city: 'Seoul',
        state: 'Mapo-gu',
        country_code: 'KR',
        address: '탱고 오마다 홀, 마포구 와우산로 29길 4-3',
        price: '₩20,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/seoultangopeople/events',
        community_name: '서울 탱고 피플',
        organizer: '서울탱고피플 운영진',
        notes: '페이스북 커뮤니티 주최 정기 가을 밀롱가. 게스트 DJ 비닐 세션 및 탱고 와인 파티.'
      },
      {
        event_name: '홍대 금요 불타는 탱고 나이트 (Hongdae Friday Passion Milonga)',
        event_type: 'MILONGA',
        start_date: '2026-11-06',
        end_date: '2026-11-06',
        city: 'Seoul',
        state: 'Mapo-gu',
        country_code: 'KR',
        address: '스튜디오 엘땅고 홍대, 마포구 양화로 112 B1',
        price: '₩15,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/seoultangopeople/events',
        community_name: '서울 탱고 피플',
        organizer: '홍대탱고연합',
        notes: '자정까지 이어지는 열정적인 홍대 금요 밀롱가. 까베세오 에티켓 준수.'
      },
      {
        event_name: '한국 탱고 페스티벌 프리 마라톤 밀롱가 (Korea Tango Festival Pre-Milonga)',
        event_type: 'FESTIVAL',
        start_date: '2026-11-20',
        end_date: '2026-11-22',
        city: 'Seoul',
        state: 'Gangnam-gu',
        country_code: 'KR',
        address: '세빛섬 플로팅 아일랜드 컨벤션홀, 서초구 올림픽대로 2085-14',
        price: '₩120,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/seoultangopeople/events',
        community_name: '서울 탱고 피플',
        organizer: 'Korea Tango Masters',
        notes: '한강 야경이 한눈에 보이는 세빛섬에서 열리는 3일간의 인터내셔널 탱고 페스티벌.'
      }
    ]
  },
  {
    id: 'fb_hongdae_onada',
    name: '홍대 탱고 클럽 오나다 (Club O Nada Official FB)',
    groupHandle: 'groups/clubonadatango',
    url: 'https://facebook.com/groups/clubonadatango',
    city: 'Seoul',
    state: 'Mapo-gu',
    country_code: 'KR',
    region: 'korea',
    memberCount: '5,200+ members',
    description: '대한민국 대표 탱고 전용 클럽 오나다의 공식 페이스북 그룹. 주간 밀롱가 일정 및 초청 마에스트로 특강.',
    events: [
      {
        event_name: '오나다 토요 스페셜 탱고 살롱 (Club O Nada Saturday Salon)',
        event_type: 'MILONGA',
        start_date: '2026-10-31',
        end_date: '2026-10-31',
        city: 'Seoul',
        state: 'Mapo-gu',
        country_code: 'KR',
        address: '클럽 오나다, 마포구 서교동 334-13 B1',
        price: '₩18,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/clubonadatango/events',
        community_name: '홍대 탱고 클럽 오나다',
        organizer: '클럽 오나다',
        notes: '매주 토요일 전통 살롱 탱고 음악과 최상급 마룻바닥에서 즐기는 고품격 밀롱가.'
      },
      {
        event_name: '오나다 와인 & 탱고 쁘락띠까 (Wine & Tango Guided Practica)',
        event_type: 'MILONGA',
        start_date: '2026-11-12',
        end_date: '2026-11-12',
        city: 'Seoul',
        state: 'Mapo-gu',
        country_code: 'KR',
        address: '클럽 오나다, 마포구 서교동 334-13 B1',
        price: '₩12,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/clubonadatango/events',
        community_name: '홍대 탱고 클럽 오나다',
        organizer: '오나다 코치진',
        notes: '목요일 저녁 자유로운 연습과 와인을 함께 즐기는 친목 쁘락띠까.'
      }
    ]
  },
  {
    id: 'fb_gangnam_eltango',
    name: '강남 엘 땅고 페이스북 커뮤니티 (El Tango Gangnam Group)',
    groupHandle: 'groups/eltangoseoul',
    url: 'https://facebook.com/groups/eltangoseoul',
    city: 'Seoul',
    state: 'Gangnam-gu',
    country_code: 'KR',
    region: 'korea',
    memberCount: '4,100+ members',
    description: '강남 중심가에서 즐기는 살롱 밀롱가 및 탱고 아카데미 소식 커뮤니티.',
    events: [
      {
        event_name: '강남 엘땅고 일요 선셋 밀롱가 (Gangnam El Tango Sunday Sunset Milonga)',
        event_type: 'MILONGA',
        start_date: '2026-11-01',
        end_date: '2026-11-01',
        city: 'Seoul',
        state: 'Gangnam-gu',
        country_code: 'KR',
        address: '엘땅고 아카데미, 강남구 테헤란로 14길 16',
        price: '₩16,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/eltangoseoul/events',
        community_name: '강남 엘 땅고',
        organizer: '엘땅고 서울',
        notes: '일요일 오후 5시부터 시작되는 아늑하고 편안한 선셋 탱고 살롱.'
      }
    ]
  },
  {
    id: 'fb_busan_laplata',
    name: '부산 탱고 라플라타 (Busan Tango Community La Plata)',
    groupHandle: 'groups/busantango',
    url: 'https://facebook.com/groups/busantango',
    city: 'Busan',
    state: 'Haeundae',
    country_code: 'KR',
    region: 'korea',
    memberCount: '2,900+ members',
    description: '부산 경남권 아르헨티나 탱고 댄서들의 소통 및 해운대 광안리 소셜 밀롱가 공지.',
    events: [
      {
        event_name: '해운대 바닷바람 소셜 밀롱가 (Busan Haeundae Breeze Milonga)',
        event_type: 'MILONGA',
        start_date: '2026-11-14',
        end_date: '2026-11-14',
        city: 'Busan',
        state: 'Haeundae',
        country_code: 'KR',
        address: '해운대 그랜드 컬쳐홀, 중동 1058-2',
        price: '₩20,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/busantango/events',
        community_name: '부산 탱고 라플라타',
        organizer: '라플라타 부산',
        notes: '오션뷰 테라스에서 바닷바람과 함께하는 가을 스페셜 밀롱가.'
      }
    ]
  },

  // --- USA ---
  {
    id: 'fb_tangobaratlanta',
    name: 'Tango Bar Atlanta (FB Group)',
    groupHandle: 'groups/tangobaratlanta',
    url: 'https://www.facebook.com/groups/tangobaratlanta',
    city: 'Atlanta',
    state: 'GA',
    country_code: 'US',
    region: 'usa',
    memberCount: '2,500+ members',
    description: 'The premier Facebook hub for Argentine tango in Atlanta. Sharing weekly milongas, practicas, guest maestros, and festival updates across Atlanta and Georgia.',
    events: [
      {
        event_name: 'An Evening with Rene Torres',
        event_type: 'WORKSHOP',
        start_date: '2026-09-08',
        end_date: '2026-09-08',
        city: 'Roswell',
        state: 'GA',
        country_code: 'US',
        address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
        price: '$25',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta/events',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Shelley Brooks (공유) / Maestro Rene Torres',
        published_time: '2026-09-06 (공유됨)',
        notes: '페이스북 Tango Bar Atlanta 그룹 공유 행사. 9월 8일(화) 오후 7:00 CDT 마에스트로 Rene Torres 초청 마스터클래스 워크샵 및 소셜.'
      },
      {
        event_name: 'The Tango Lounge Milonga ROUGE-GUEST DJ LYNN',
        event_type: 'MILONGA',
        start_date: '2026-09-12',
        end_date: '2026-09-12',
        city: 'Roswell',
        state: 'GA',
        country_code: 'US',
        address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
        price: '$15',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta/events',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Buddy Dale Diego Stotts (공유) / The Tango Lounge',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 그룹 Tango Bar Atlanta 관리자(Buddy Dale Diego Stotts) 공유 신규 이벤트. 9월 12일 (토) 오후 7:30 CDT 로즈웰 The Tango Lounge Milonga ROUGE (게스트 DJ LYNN).'
      },
      {
        event_name: 'Milonga del Toro and TLC Pre- Milonga Workshop',
        event_type: 'MILONGA',
        start_date: '2026-09-13',
        end_date: '2026-09-13',
        city: 'Roswell',
        state: 'GA',
        country_code: 'US',
        address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
        price: '$20',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta/events',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Shelley Brooks (공유) / TLC',
        published_time: '2026-09-07 (공유됨)',
        notes: '9월 13일 (일) 오전 11:30 CDT. Pre-Milonga Workshop과 정통 밀롱가 소셜 세션.'
      },
      {
        event_name: 'The Tango Lounge 50/50 Milonga-Tess and Vine C...',
        event_type: 'MILONGA',
        start_date: '2026-09-20',
        end_date: '2026-09-20',
        city: 'Roswell',
        state: 'GA',
        country_code: 'US',
        address: 'Ballroom Impact, 1425 Market Blvd, Suite 525, Roswell, GA 30076',
        price: '$15',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta/events',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Buddy Dale Diego Stotts (공유) / The Tango Lounge',
        published_time: '2026-09-05 (공유됨)',
        notes: '9월 20일 (일) 오후 6:00 CDT. The Tango Lounge 50/50 정기 밀롱가.'
      },
      {
        event_name: 'ATS One Year Anniversary Weekend',
        event_type: 'FESTIVAL',
        start_date: '2026-10-09',
        end_date: '2026-10-11',
        city: 'Atlanta',
        state: 'GA',
        country_code: 'US',
        address: 'Academy Ballroom Atlanta, 800 Miami Cir NE #140',
        price: '$120',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta/events',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Kenitra Annice Ezell (공유) / ATS',
        published_time: '2026-09-04 (공유됨)',
        notes: '10월 9일 (금) ~ 10월 11일 (일) 3일간 진행되는 ATS 1주년 기념 인터내셔널 탱고 위크엔드.'
      }
    ]
  },
  {
    id: 'fb_atlanta_tango',
    name: 'Atlanta Tango Dancers Community (FB Group)',
    groupHandle: 'groups/atlantatango',
    url: 'https://facebook.com/groups/atlantatango',
    city: 'Atlanta',
    state: 'GA',
    country_code: 'US',
    region: 'usa',
    memberCount: '3,800+ members',
    description: 'The official Facebook community for Argentine tango social dancers, DJs, and milongas across Greater Atlanta and the Southeast.',
    events: [
      {
        event_name: 'Atlanta Peachtree Saturday Grand Milonga',
        event_type: 'MILONGA',
        start_date: '2026-10-24',
        end_date: '2026-10-24',
        city: 'Atlanta',
        state: 'GA',
        country_code: 'US',
        address: 'Academy Ballroom Atlanta, 800 Miami Cir NE',
        price: '$20',
        is_free: false,
        source_url: 'https://facebook.com/groups/atlantatango/events',
        community_name: 'Atlanta Tango Dancers Community',
        organizer: 'Atlanta Tango Society',
        notes: 'Monthly flagship community milonga with guest masterclasses and vinyl Golden Age tandas.'
      },
      {
        event_name: 'Buckhead Sunday Sunset Tango Matinee',
        event_type: 'MILONGA',
        start_date: '2026-11-15',
        end_date: '2026-11-15',
        city: 'Atlanta',
        state: 'GA',
        country_code: 'US',
        address: 'Atlanta Dance Exchange, 3161 Maple Dr NE',
        price: '$18',
        is_free: false,
        source_url: 'https://facebook.com/groups/atlantatango/events',
        community_name: 'Atlanta Tango Dancers Community',
        organizer: 'Midtown Tango Circle',
        notes: 'Afternoon milonga with natural skylight, Argentine empanadas, and friendly cabeceo.'
      }
    ]
  },
  {
    id: 'fb_nyctangonews',
    name: 'NY & Global Tango (FB Group nyctangonews)',
    groupHandle: 'groups/nyctangonews',
    url: 'https://www.facebook.com/groups/nyctangonews',
    city: 'New York',
    state: 'NY',
    country_code: 'US',
    region: 'usa',
    memberCount: '15,000+ members',
    description: 'Premier Facebook hub for NYC and international tango events, milongas, live music, and festival announcements.',
    events: [
      {
        event_name: 'Victoria\'s Friday Milonga',
        event_type: 'MILONGA',
        start_date: '2026-09-11',
        end_date: '2026-09-11',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'Ripley Grier Studio, 520 8th Ave, Room 17S, New York, NY 10018',
        price: '$25',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/nyctangonews/events',
        community_name: 'NY & Global Tango',
        organizer: 'Victoria Codru (공유됨)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 11일 (금) 오후 6:30 CDT / 7:30 EDT. Ripley Grier Studio Room 17S ($25, Host & DJ: Victoria Codru).'
      },
      {
        event_name: 'Milonga TEMPRANA- Second Sunday in September',
        event_type: 'MILONGA',
        start_date: '2026-09-13',
        end_date: '2026-09-13',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'New York, NY',
        price: '$20',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/nyctangonews/events',
        community_name: 'NY & Global Tango',
        organizer: 'Elissaveta Iordanova (공유됨)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 2:00 CDT / 3:00 EDT. Second Sunday in September Milonga TEMPRANA.'
      },
      {
        event_name: 'Pier 45 Milonga with LIVE MUSIC 🎵',
        event_type: 'MILONGA',
        start_date: '2026-09-13',
        end_date: '2026-09-13',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'Pier 45, Hudson River Park, New York, NY 10014',
        price: 'Free',
        is_free: true,
        source_url: 'https://www.facebook.com/groups/nyctangonews/events',
        community_name: 'NY & Global Tango',
        organizer: 'Fausto Vazquez (공유됨) / Singer: Mariela Marco',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 밀롱가.'
      },
      {
        event_name: 'Montreal Tango Festival 2026 Edition - Festival de Tango de Montréal',
        event_type: 'FESTIVAL',
        start_date: '2026-09-02',
        end_date: '2026-09-07',
        city: 'Montreal',
        state: 'QC',
        country_code: 'CA',
        address: 'Montreal, QC, Canada',
        price: '$180',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/nyctangonews/events',
        community_name: 'NY & Global Tango',
        organizer: 'Sirma Sabire Saltik (공유됨)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 nyctangonews 그룹 공유 행사. 몬트리올 탱고 페스티벌 제20회 에디션 (현재 진행 중).'
      }
    ]
  },
  {
    id: 'fb_new_york_tango_243341781981565',
    name: 'New York Tango (FB Group 243341781981565)',
    groupHandle: 'groups/243341781981565',
    url: 'https://www.facebook.com/groups/243341781981565',
    city: 'New York',
    state: 'NY',
    country_code: 'US',
    region: 'usa',
    memberCount: '8,500+ members',
    description: 'Premier New York City tango community group for live music milongas at Pier 45, Hungarian House all night events, and seasonal celebrations.',
    events: [
      {
        event_name: 'Pier 45 Milonga with LIVE MUSIC 🎵',
        event_type: 'MILONGA',
        start_date: '2026-09-13',
        end_date: '2026-09-13',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'Pier 45, Hudson River Park, New York, NY 10014',
        price: 'Free',
        is_free: true,
        source_url: 'https://www.facebook.com/groups/243341781981565/events',
        community_name: 'New York Tango',
        organizer: 'Fausto Vazquez (공유됨) / Singer: Mariela Marco',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 무료 밀롱가.'
      },
      {
        event_name: 'Sept 19 All Night Milonga: Showcase Event + 25th Anniversary Celebration',
        event_type: 'MILONGA',
        start_date: '2026-09-19',
        end_date: '2026-09-19',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'The Hungarian House, 213 E 82nd St, New York, NY 10028',
        price: '$25',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/243341781981565/events',
        community_name: 'New York Tango',
        organizer: 'The NYC All Night Milonga (공유됨)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 19일 (토) 오후 6:30 CDT / 7:20 EDT. Hungarian House (213 E 82nd St, NYC) 25주년 기념 쇼케이스(Guillermina Quiroga & Mariano Logiudice) 및 올나잇 밀롱가.'
      },
      {
        event_name: 'Starry Night Tango 4th NYC Edition',
        event_type: 'FESTIVAL',
        start_date: '2026-10-31',
        end_date: '2026-10-31',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'The Hungarian House, 213 E 82nd St, New York, NY 10028',
        price: '$35',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/243341781981565/events',
        community_name: 'New York Tango',
        organizer: 'Martin Almiron Tango (공유됨)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 10월 31일 (토) 오후 4:30 CDT / 5:30 EDT. The Hungarian House 스타리 나이트 탱고 제4회 뉴욕 에디션.'
      }
    ]
  },
  {
    id: 'fb_nyc_tango',
    name: 'New York Tango Community & Milongas (NYC FB Group)',
    groupHandle: 'groups/nyctangocommunity',
    url: 'https://facebook.com/groups/nyctangocommunity',
    city: 'New York',
    state: 'NY',
    country_code: 'US',
    region: 'usa',
    memberCount: '13,200+ members',
    description: 'Central community hub for New York City Argentine Tango dancers, visiting milongueros, and live tango orchestras.',
    events: [
      {
        event_name: 'Central Park Bethesda Terrace Autumn Open-Air Milonga',
        event_type: 'MILONGA',
        start_date: '2026-10-18',
        end_date: '2026-10-18',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'Bethesda Terrace, Central Park, 72nd St Transverse',
        price: 'Free',
        is_free: true,
        source_url: 'https://facebook.com/groups/nyctangocommunity/events',
        community_name: 'New York Tango Community',
        organizer: 'NYC Outdoor Tango Collective',
        notes: 'Free public milonga under the historic Bethesda Terrace arches. Bring comfortable smooth soles.'
      },
      {
        event_name: 'Greenwich Village Bohemian Milonga La Nacional',
        event_type: 'MILONGA',
        start_date: '2026-11-06',
        end_date: '2026-11-06',
        city: 'New York',
        state: 'NY',
        country_code: 'US',
        address: 'Spanish Benevolent Society Ballroom, 239 W 14th St',
        price: '$25',
        is_free: false,
        source_url: 'https://facebook.com/groups/nyctangocommunity/events',
        community_name: 'New York Tango Community',
        organizer: 'Milonga La Nacional NYC',
        notes: 'Historic 14th Street Spanish ballroom milonga with traditional orchestra tandas and tapas.'
      }
    ]
  },
  {
    id: 'fb_sf_bay_tango',
    name: 'Bay Area Argentine Tango Community (San Francisco FB)',
    groupHandle: 'groups/bayareatango',
    url: 'https://facebook.com/groups/bayareatango',
    city: 'San Francisco',
    state: 'CA',
    country_code: 'US',
    region: 'usa',
    memberCount: '9,400+ members',
    description: 'Connecting dancers across San Francisco, Berkeley, Oakland, and Silicon Valley with weekly milonga schedules.',
    events: [
      {
        event_name: 'Mission District Friday Night Milonga Genesis',
        event_type: 'MILONGA',
        start_date: '2026-10-30',
        end_date: '2026-10-30',
        city: 'San Francisco',
        state: 'CA',
        country_code: 'US',
        address: 'Genesis Hall, 2550 18th St, Potrero/Mission',
        price: '$22',
        is_free: false,
        source_url: 'https://facebook.com/groups/bayareatango/events',
        community_name: 'Bay Area Argentine Tango Community',
        organizer: 'SF Tango Collective',
        notes: 'Spacious sprung hardwood floor with superb acoustics in the heart of the Mission.'
      },
      {
        event_name: 'Berkeley Afternoon Tango by the Bay',
        event_type: 'MILONGA',
        start_date: '2026-11-22',
        end_date: '2026-11-22',
        city: 'San Francisco',
        state: 'CA',
        country_code: 'US',
        address: 'Ashkenaz Music & Dance Center, 1317 San Pablo Ave, Berkeley',
        price: '$18',
        is_free: false,
        source_url: 'https://facebook.com/groups/bayareatango/events',
        community_name: 'Bay Area Argentine Tango Community',
        organizer: 'East Bay Tango Guild',
        notes: 'Warm East Bay community gathering with tea, homemade pastries, and close embrace tandas.'
      }
    ]
  },
  {
    id: 'fb_chicago_tango',
    name: 'Chicago Argentine Tango Dancers Network (FB Group)',
    groupHandle: 'groups/chicagotangodancers',
    url: 'https://facebook.com/groups/chicagotangodancers',
    city: 'Chicago',
    state: 'IL',
    country_code: 'US',
    region: 'usa',
    memberCount: '4,700+ members',
    description: 'Chicagoland Argentine Tango announcements, weekend festival coordination, and weekly milonga roundups.',
    events: [
      {
        event_name: 'Chicago Windy City Tango Social Milonga',
        event_type: 'MILONGA',
        start_date: '2026-11-14',
        end_date: '2026-11-14',
        city: 'Chicago',
        state: 'IL',
        country_code: 'US',
        address: 'Dovetail Studios, 2853 W Montrose Ave',
        price: '$20',
        is_free: false,
        source_url: 'https://facebook.com/groups/chicagotangodancers/events',
        community_name: 'Chicago Argentine Tango Dancers Network',
        organizer: 'Chicago Tango Society',
        notes: 'Cozy autumn milonga with warm ambient lighting and curated Golden Era tandas.'
      }
    ]
  },
  {
    id: 'fb_miami_tango',
    name: 'Miami Argentine Tango Scene (Facebook Community)',
    groupHandle: 'groups/miamitangoscene',
    url: 'https://facebook.com/groups/miamitangoscene',
    city: 'Miami',
    state: 'FL',
    country_code: 'US',
    region: 'usa',
    memberCount: '3,900+ members',
    description: 'South Florida tango community: Miami, Fort Lauderdale, and Palm Beach milongas and beach encounters.',
    events: [
      {
        event_name: 'Miami Little Havana Calle Ocho Tropical Milonga',
        event_type: 'MILONGA',
        start_date: '2026-11-28',
        end_date: '2026-11-28',
        city: 'Miami',
        state: 'FL',
        country_code: 'US',
        address: 'Koubek Center Ballroom, 2705 SW 3rd St',
        price: '$25',
        is_free: false,
        source_url: 'https://facebook.com/groups/miamitangoscene/events',
        community_name: 'Miami Argentine Tango Scene',
        organizer: 'Miami Tango Community',
        notes: 'Little Havana vibrant holiday milonga with live tropical tango ensemble.'
      }
    ]
  },
  {
    id: 'fb_tangobirmingham_115408145174568',
    name: 'Tango Birmingham (FB Group)',
    groupHandle: 'groups/115408145174568',
    url: 'https://www.facebook.com/groups/115408145174568',
    city: 'Birmingham',
    state: 'AL',
    country_code: 'US',
    region: 'usa',
    memberCount: '749+ members',
    description: 'Official Facebook group for Argentine tango social dancers, classes, and milongas in Birmingham, Alabama.',
    events: [
      {
        event_name: 'SPECIAL BHAM MILONGA SATURDAY SEPTEMBER 12!',
        event_type: 'MILONGA',
        start_date: '2026-09-12',
        end_date: '2026-09-12',
        city: 'Birmingham',
        state: 'AL',
        country_code: 'US',
        address: 'Magnolia Ballroom, Birmingham, AL',
        price: '$15',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/115408145174568/events',
        community_name: 'Tango Birmingham',
        organizer: 'Beth Nicholson',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 그룹 Tango Birmingham (호스트: Beth Nicholson) 등록 행사. 9월 12일 (토) 오후 6:00 CDT Magnolia Ballroom 스페셜 버밍엄 밀롱가.'
      }
    ]
  },
  {
    id: 'fb_boston_tango',
    name: 'Boston Tango',
    groupHandle: 'groups/BosTango',
    url: 'https://www.facebook.com/groups/BosTango',
    city: 'Boston',
    state: 'MA',
    country_code: 'US',
    region: 'usa',
    memberCount: '2,100+ members',
    description: '공개 페이스북 그룹 Boston Tango. 보스턴 및 매사추세츠 일대의 주간 밀롱가, 쁘락띠까, 워크샵 및 페스티벌 공지 공유 허브.',
    events: [
      {
        event_name: 'Tango Práctica Corazón in Lexington',
        event_type: 'MILONGA',
        start_date: '2026-09-10',
        end_date: '2026-09-10',
        city: 'Lexington',
        state: 'MA',
        country_code: 'US',
        address: '39 Barrett Road, Lexington, MA',
        price: '$10',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/BosTango/events',
        community_name: 'Boston Tango',
        organizer: 'Elena Getmanova (공유)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) 오후 5:00 CDT. 39 Barrett Road, Lexington, MA ($10, 회원 무료).'
      },
      {
        event_name: 'Rocio & Luciano Capparelli + beginners by Sarah Y...',
        event_type: 'WORKSHOP',
        start_date: '2026-09-10',
        end_date: '2026-09-10',
        city: 'Boston',
        state: 'MA',
        country_code: 'US',
        address: 'Boston Tango Studio, Boston, MA',
        price: '$25',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/BosTango/events',
        community_name: 'Boston Tango',
        organizer: 'Juan Pablo Vicente (공유)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) 오후 6:00 CDT. Rocio & Luciano Capparelli 마스터클래스 워크샵 및 초급 클래스.'
      },
      {
        event_name: "WMTG's Thursdays with Cyla and Guests",
        event_type: 'MILONGA',
        start_date: '2026-09-10',
        end_date: '2026-09-24',
        city: 'Boston',
        state: 'MA',
        country_code: 'US',
        address: 'Western Massachusetts Tango Guild Studio, MA',
        price: '$20',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/BosTango/events',
        community_name: 'Boston Tango',
        organizer: 'Cyla Bagolan (공유)',
        published_time: '2026-09-07 (공유됨)',
        notes: "페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) ~ 9월 24일 WMTG's Thursdays with Cyla and Guests 정기 세션."
      },
      {
        event_name: 'Tango Bliss Workshop Weekend with Veronika Kruta',
        event_type: 'WORKSHOP',
        start_date: '2026-09-11',
        end_date: '2026-09-12',
        city: 'Northampton',
        state: 'MA',
        country_code: 'US',
        address: 'Northampton, Massachusetts',
        price: '$120',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/BosTango/events',
        community_name: 'Boston Tango',
        organizer: 'Cyla Bagolan (공유)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 Boston Tango 그룹 등록 행사. 9월 11일 (금) ~ 9월 12일 (토) Northampton, Massachusetts. Veronika Kruta 초청 Tango Bliss 주말 워크샵.'
      },
      {
        event_name: 'Milonga Poema',
        event_type: 'MILONGA',
        start_date: '2026-09-11',
        end_date: '2026-09-11',
        city: 'Boston',
        state: 'MA',
        country_code: 'US',
        address: 'Boston Dance Studio, Boston, MA',
        price: '$20',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/BosTango/events',
        community_name: 'Boston Tango',
        organizer: 'MCristina Luchetti (공유)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 Boston Tango 그룹 등록 행사. 9월 11일 (금) 오후 8:00 CDT. 정통 Milonga Poema 소셜 나이트 (Rocio & Luciano Capparelli 초청).'
      },
      {
        event_name: 'Blue Milonga Sep 12 - DJ Toshi',
        event_type: 'MILONGA',
        start_date: '2026-09-12',
        end_date: '2026-09-12',
        city: 'Boston',
        state: 'MA',
        country_code: 'US',
        address: 'Somerville Center, Boston Area, MA',
        price: '$20',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/BosTango/events',
        community_name: 'Boston Tango',
        organizer: 'Hsueh-tze Lee (공유)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 Boston Tango 그룹 등록 행사. 9월 12일 (토) 오후 7:30 CDT. Blue Milonga Sep 12 - 초청 게스트 DJ Toshi 세션.'
      },
      {
        event_name: 'Montreal Tango Festival 2026 Edition - Festival de Tango de Montréal',
        event_type: 'FESTIVAL',
        start_date: '2026-09-07',
        end_date: '2026-09-13',
        city: 'Montreal',
        state: 'QC',
        country_code: 'CA',
        address: 'Montreal Convention Center, Montreal, QC',
        price: '$250',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/BosTango/events',
        community_name: 'Boston Tango',
        organizer: 'Vicky Magaletta (공유)',
        published_time: '2026-09-07 (공유됨)',
        notes: '페이스북 Boston Tango 그룹 공유 행사 (현재 진행 중). 2026 몬트리올 인터내셔널 탱고 페스티벌.'
      }
    ]
  },

  // --- AMERICAS & BUENOS AIRES ---
  {
    id: 'fb_buenos_aires_hoy',
    name: 'Milongas de Buenos Aires (Hoy y Mañana - FB Grupo)',
    groupHandle: 'groups/milongasdebuenosaires',
    url: 'https://facebook.com/groups/milongasdebuenosaires',
    city: 'Buenos Aires',
    state: 'CABA',
    country_code: 'AR',
    region: 'americas',
    memberCount: '38,000+ members',
    description: 'La comunidad más grande de milongueros porteños y viajeros en Buenos Aires. Cartelera diaria de milongas tradicionales y alternativas.',
    events: [
      {
        event_name: 'Gran Milonga San Telmo al Aire Libre (Plaza Dorrego)',
        event_type: 'MILONGA',
        start_date: '2026-10-25',
        end_date: '2026-10-25',
        city: 'Buenos Aires',
        state: 'CABA',
        country_code: 'AR',
        address: 'Plaza Dorrego, Defensa y Humberto 1°, San Telmo',
        price: 'Free',
        is_free: true,
        source_url: 'https://facebook.com/groups/milongasdebuenosaires/events',
        community_name: 'Milongas de Buenos Aires',
        organizer: 'Milongueros de San Telmo',
        notes: 'Milonga mítica en el adoquín histórico de San Telmo al atardecer.'
      },
      {
        event_name: 'Palermo Milonga Club Villa Malcolm Tradicional',
        event_type: 'MILONGA',
        start_date: '2026-11-07',
        end_date: '2026-11-08',
        city: 'Buenos Aires',
        state: 'CABA',
        country_code: 'AR',
        address: 'Club Villa Malcolm, Av. Córdoba 5064, Palermo',
        price: 'ARS 6,000',
        is_free: false,
        source_url: 'https://facebook.com/groups/milongasdebuenosaires/events',
        community_name: 'Milongas de Buenos Aires',
        organizer: 'Malcolm Tango',
        notes: 'Típica milonga porteña con orquesta en vivo, empanadas y fernet hasta las 4 AM.'
      }
    ]
  },

  // --- EUROPE ---
  {
    id: 'fb_tango_popular_ljubljana',
    name: 'Tango Popular Ljubljana Community Group',
    groupHandle: 'groups/tangopopularljubljana',
    url: 'https://www.facebook.com/groups/tangopopularljubljana',
    city: 'Ljubljana',
    country_code: 'SI',
    region: 'europe',
    memberCount: '3,800+ members',
    description: 'International Facebook community for Argentine tango dancers and organizers. Sharing upcoming milongas, marathons, weekend seminars, and festival updates across Ljubljana and Europe.',
    events: [
      {
        event_name: 'Ljubljana Tango Festival 2026 (20th Edition)',
        event_type: 'FESTIVAL',
        start_date: '2026-11-12',
        end_date: '2026-11-15',
        city: 'Ljubljana',
        country_code: 'SI',
        address: 'Grand Hotel Union Hall & Studio Moj korak, Miklošičeva cesta 1',
        price: '€180',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangopopularljubljana/events',
        community_name: 'Tango Popular Community Group',
        organizer: 'Ljubljana Tango Festival / Tango Popular',
        notes: '20th Anniversary milestone edition. 4 days of grand evening milongas with live tango orchestra, world-class maestros, and buena onda spirit.'
      },
      {
        event_name: 'Crossroads Tango Marathon 2026 Autumn Edition',
        event_type: 'MARATHON',
        start_date: '2026-10-16',
        end_date: '2026-10-18',
        city: 'Ljubljana',
        country_code: 'SI',
        address: 'Ljubljana Puppet Theatre (Lutkovno gledališče), Krekov trg 2',
        price: '€140',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangopopularljubljana/events',
        community_name: 'Tango Popular Community Group',
        organizer: 'Crossroads Tango Team',
        notes: 'Role-balanced autumn marathon for 250 international dancers in historic theatrical hall with supreme acoustics.'
      },
      {
        event_name: 'La Milonguita Mensual at Studio Moj Korak',
        event_type: 'MILONGA',
        start_date: '2026-10-03',
        end_date: '2026-10-03',
        city: 'Ljubljana',
        country_code: 'SI',
        address: 'Studio Moj korak, Vilharjeva cesta 3',
        price: '€12',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangopopularljubljana/events',
        community_name: 'Tango Popular Community Group',
        organizer: 'Tango DJ Alenka & Tango Popular',
        notes: '10th season opening monthly milonga. Traditional tandas with cortinas, friendly embrace, and complimentary refreshments.'
      },
      {
        event_name: 'Corazon de Ljubljana Tango Gala & Milonga',
        event_type: 'FESTIVAL',
        start_date: '2026-09-25',
        end_date: '2026-09-27',
        city: 'Ljubljana',
        country_code: 'SI',
        address: 'Festival Hall Ljubljana (Festivalna dvorana), Vilharjeva cesta 11',
        price: '€95',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangopopularljubljana/events',
        community_name: 'Tango Popular Community Group',
        organizer: 'Corazon de Ljubljana',
        notes: 'Autumn gala weekend featuring live concert, guest maestro masterclasses, and three evening social milongas.'
      },
      {
        event_name: 'Milonga Diferente Sunday Social',
        event_type: 'MILONGA',
        start_date: '2026-09-27',
        end_date: '2026-09-27',
        city: 'Ljubljana',
        country_code: 'SI',
        address: 'Klub CD (Cankarjev dom), Prešernova cesta 10',
        price: '€10',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangopopularljubljana/events',
        community_name: 'Tango Popular Community Group',
        organizer: 'Milonga Diferente Ljubljana',
        notes: 'Sunday evening cozy social milonga with eclectic traditional selection, warm welcoming ambiance, and great acoustics.'
      }
    ]
  },
  {
    id: 'fb_berlin_tango',
    name: 'Berlin Tango Community (Facebook Group)',
    groupHandle: 'groups/berlintangocommunity',
    url: 'https://facebook.com/groups/berlintangocommunity',
    city: 'Berlin',
    country_code: 'DE',
    region: 'europe',
    memberCount: '7,600+ members',
    description: 'Berlin Argentine Tango events, marathons, neo and traditional salons in Kreuzberg, Mitte, and Neukölln.',
    events: [
      {
        event_name: 'Berlin Kreuzberg Spree-Loft Grand Milonga',
        event_type: 'MILONGA',
        start_date: '2026-11-14',
        end_date: '2026-11-14',
        city: 'Berlin',
        country_code: 'DE',
        address: 'Tangoloft Berlin, Gerichtstraße 23',
        price: '€18',
        is_free: false,
        source_url: 'https://facebook.com/groups/berlintangocommunity/events',
        community_name: 'Berlin Tango Community',
        organizer: 'Tangoloft Berlin',
        notes: 'Atmospheric loft milonga with antique candelabras, vintage vinyl DJ, and courtyard lounge.'
      }
    ]
  },
  {
    id: 'fb_london_tango',
    name: 'London Argentine Tango Network (FB Group)',
    groupHandle: 'groups/londontangonetwork',
    url: 'https://facebook.com/groups/londontangonetwork',
    city: 'London',
    country_code: 'GB',
    region: 'europe',
    memberCount: '6,400+ members',
    description: 'All social Argentine tango events across London and the UK: salons, practicas, and guest maestro visits.',
    events: [
      {
        event_name: 'Covent Garden Saturday Grand Salon Milonga',
        event_type: 'MILONGA',
        start_date: '2026-11-21',
        end_date: '2026-11-21',
        city: 'London',
        country_code: 'GB',
        address: 'Porchester Hall, Porchester Rd, Bayswater',
        price: '£20',
        is_free: false,
        source_url: 'https://facebook.com/groups/londontangonetwork/events',
        community_name: 'London Argentine Tango Network',
        organizer: 'London Tango Society',
        notes: 'Art Deco grand hall milonga with wood sprung dance floor and traditional cortinas.'
      }
    ]
  }
];

/**
 * Intelligent parser for text copied from Facebook event announcements / flyers.
 * Handles dates in Korean (e.g. "10월 24일", "2026-10-24", "10/24"), English ("Oct 24", "October 24, 2026"),
 * addresses, venue names, prices ("15,000원", "$20", "Free/무료"), and event types.
 */
export function parseFacebookPostText(rawText: string, defaultCity: string = 'Seoul', defaultCountry: string = 'KR'): Partial<TangoEvent> {
  const text = rawText.trim();
  if (!text) return {};

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const firstLine = lines[0] || 'Facebook Tango Event';

  // 1. Determine Event Name
  let eventName = firstLine.replace(/^[★◆●■▲▶\s#]+|[★◆●■▲▶\s]+$/g, '').trim();
  if (eventName.length < 4 && lines[1]) {
    eventName = lines[1].replace(/^[★◆●■▲▶\s#]+|[★◆●■▲▶\s]+$/g, '').trim();
  }

  // 2. Determine Event Type
  let eventType: EventType = 'MILONGA';
  const lowerText = text.toLowerCase();
  if (lowerText.includes('marathon') || lowerText.includes('마라톤')) {
    eventType = 'MARATHON';
  } else if (lowerText.includes('festival') || lowerText.includes('페스티벌') || lowerText.includes('축제')) {
    eventType = 'FESTIVAL';
  } else if (lowerText.includes('encuentro') || lowerText.includes('엔쿠엔트로') || lowerText.includes('enquentro')) {
    eventType = 'ENCUENTRO';
  } else {
    eventType = 'MILONGA';
  }

  // 3. Extract Dates (YYYY-MM-DD or Month/Day)
  const today = new Date();
  const currentYear = today.getFullYear() >= 2026 ? today.getFullYear() : 2026;
  let startDate = `${currentYear}-10-24`;
  let endDate = startDate;

  // Regex for ISO: 2026-10-24 or 2026.10.24 or 2026/10/24
  const isoMatch = text.match(/202[6-9][\-./](\d{1,2})[\-./](\d{1,2})/);
  if (isoMatch) {
    const month = isoMatch[1].padStart(2, '0');
    const day = isoMatch[2].padStart(2, '0');
    startDate = `${currentYear}-${month}-${day}`;
    endDate = startDate;
  } else {
    // Korean style: 10월 24일 or 11월 7일
    const koDateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일/);
    if (koDateMatch) {
      const month = koDateMatch[1].padStart(2, '0');
      const day = koDateMatch[2].padStart(2, '0');
      startDate = `${currentYear}-${month}-${day}`;
      endDate = startDate;
    }
  }

  // Check if there is an end date (e.g. ~ 2026-10-26 or ~ 26일)
  const rangeMatch = text.match(/[~-]\s*(?:202[6-9][\-./])?(\d{1,2})[\-./](\d{1,2})/);
  if (rangeMatch) {
    const m = rangeMatch[1].padStart(2, '0');
    const d = rangeMatch[2].padStart(2, '0');
    endDate = `${currentYear}-${m}-${d}`;
  }

  // 4. Extract Location / Address
  let address = 'Hongdae Tango Studio, Mapo-gu';
  let city = defaultCity;
  let countryCode = defaultCountry;

  // City detection
  if (lowerText.includes('seoul') || text.includes('서울') || text.includes('홍대') || text.includes('강남')) {
    city = 'Seoul';
    countryCode = 'KR';
    address = '홍대 탱고 스튜디오, 마포구 와우산로';
  } else if (lowerText.includes('busan') || text.includes('부산') || text.includes('해운대')) {
    city = 'Busan';
    countryCode = 'KR';
    address = '부산 해운대구 달맞이길';
  } else if (lowerText.includes('tokyo') || lowerText.includes('도쿄') || text.includes('東京') || lowerText.includes('ginza') || lowerText.includes('shibuya')) {
    city = 'Tokyo';
    countryCode = 'JP';
    address = 'Ginza Hall, 6-10-1 Ginza, Chuo City, Tokyo';
  } else if (lowerText.includes('osaka') || lowerText.includes('오사카') || text.includes('大阪')) {
    city = 'Osaka';
    countryCode = 'JP';
    address = 'Umeda Tango Salon, Kita-ku, Osaka';
  } else if (lowerText.includes('kyoto') || lowerText.includes('교토') || text.includes('京都')) {
    city = 'Kyoto';
    countryCode = 'JP';
    address = 'Kyoto Gion Tango Studio, Higashiyama Ward, Kyoto';
  } else if (lowerText.includes('atlanta') || lowerText.includes('peachtree')) {
    city = 'Atlanta';
    countryCode = 'US';
    address = 'Academy Ballroom, 800 Miami Cir NE, Atlanta, GA';
  } else if (lowerText.includes('new york') || lowerText.includes('nyc') || lowerText.includes('manhattan')) {
    city = 'New York';
    countryCode = 'US';
    address = 'Ukrainian East Village Ballroom, 140 2nd Ave, NY';
  } else if (lowerText.includes('san francisco') || lowerText.includes('bay area') || lowerText.includes('berkeley')) {
    city = 'San Francisco';
    countryCode = 'US';
    address = 'Genesis Hall, 2550 18th St, San Francisco, CA';
  } else if (lowerText.includes('buenos aires') || lowerText.includes('san telmo') || lowerText.includes('palermo')) {
    city = 'Buenos Aires';
    countryCode = 'AR';
    address = 'Club Villa Malcolm, Av. Córdoba 5064, CABA';
  }

  // Check explicit "장소:" or "Location:" or "Address:"
  const venueMatch = text.match(/(?:장소|위치|Location|Venue|Address)\s*[:：]\s*([^\n]+)/i);
  if (venueMatch && venueMatch[1]) {
    address = venueMatch[1].trim();
  }

  // 5. Extract Price
  let price = countryCode === 'JP' ? '¥2,500' : (countryCode === 'KR' ? '₩15,000' : (countryCode === 'US' ? '$15' : '€15'));
  let isFree = false;
  if (lowerText.includes('free') || lowerText.includes('무료') || lowerText.includes('gratis')) {
    price = 'Free';
    isFree = true;
  } else {
    // Japanese Yen detection (e.g. ¥2,500, ￥3000, 2500円, 3000 yen)
    const yenMatch = text.match(/(?:¥|￥)\s*(\d{1,3}(?:,\d{3})*)|(\d{1,3}(?:,\d{3})*)\s*(?:円|yen|jpy)/i);
    if (yenMatch) {
      const amount = yenMatch[1] || yenMatch[2];
      price = `¥${amount}`;
    } else {
      const wonMatch = text.match(/(\d{1,3}(?:,\d{3})*)\s*원/);
      if (wonMatch) {
        price = `₩${wonMatch[1]}`;
      } else {
        const dollarMatch = text.match(/\$\s*(\d{1,3})/);
        if (dollarMatch) {
          price = `$${dollarMatch[1]}`;
        } else {
          const euroMatch = text.match(/€\s*(\d{1,3})|(\d{1,3})\s*€/);
          if (euroMatch) {
            price = `€${euroMatch[1] || euroMatch[2]}`;
          }
        }
      }
    }
  }

  // Extract Facebook link if present
  const fbLinkMatch = text.match(/https?:\/\/(?:www\.)?facebook\.com\/[^\s]+/i);
  const sourceUrl = fbLinkMatch ? fbLinkMatch[0] : 'https://facebook.com/groups/tangocommunity';

  return {
    event_name: eventName,
    event_type: eventType,
    start_date: startDate,
    end_date: endDate,
    city: city,
    country_code: countryCode,
    address: address,
    price: price,
    is_free: isFree,
    source_url: sourceUrl,
    notes: `[Facebook Post Extracted] ${text.substring(0, 180)}...`
  };
}
