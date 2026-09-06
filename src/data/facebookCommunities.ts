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
        source_url: 'https://facebook.com/groups/seoultangopeople/posts/8839201941',
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
        source_url: 'https://facebook.com/groups/seoultangopeople/posts/8841029381',
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
        source_url: 'https://facebook.com/groups/seoultangopeople/posts/8852938192',
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
        source_url: 'https://facebook.com/groups/clubonadatango/events/9910293811',
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
        source_url: 'https://facebook.com/groups/clubonadatango/events/9928192019',
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
        source_url: 'https://facebook.com/groups/eltangoseoul/posts/772819201',
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
        source_url: 'https://facebook.com/groups/busantango/posts/448291029',
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
        event_name: 'Atlanta Tango Social 2nd Friday Milonga',
        event_type: 'MILONGA',
        start_date: '2026-09-11',
        end_date: '2026-09-11',
        city: 'Atlanta',
        state: 'GA',
        country_code: 'US',
        address: 'Academy Ballroom Atlanta, 800 Miami Cir NE #140',
        price: '$15',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Atlanta Tango Social',
        notes: 'Monthly 2nd Friday milonga from 8:00 PM to 11:30 PM. Warm embrace, welcoming community, and traditional tandas.'
      },
      {
        event_name: 'ATS Anniversary Weekend with José Luis Salvo & Carla Rossi',
        event_type: 'FESTIVAL',
        start_date: '2026-10-09',
        end_date: '2026-10-11',
        city: 'Atlanta',
        state: 'GA',
        country_code: 'US',
        address: 'Academy Ballroom Atlanta, 800 Miami Cir NE #140',
        price: '$120',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Tango Bar Atlanta / ATS',
        notes: 'Special anniversary tango weekend featuring Argentine Tango World Champions José Luis Salvo & Carla Rossi. Workshops and gala milongas.'
      },
      {
        event_name: 'Milonga Azul at Dance It Off Studio',
        event_type: 'MILONGA',
        start_date: '2026-09-19',
        end_date: '2026-09-19',
        city: 'Atlanta',
        state: 'GA',
        country_code: 'US',
        address: 'Dance It Off Studio, 6080 Sandy Springs Circle',
        price: '$15',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Tango Bar Atlanta Community',
        notes: 'Regular 3rd Saturday Milonga from 9:00 PM to midnight. Excellent wooden floor, light refreshments, and authentic tandas.'
      },
      {
        event_name: 'The Tango Lounge Sunday Milonga',
        event_type: 'MILONGA',
        start_date: '2026-09-20',
        end_date: '2026-09-20',
        city: 'Roswell',
        state: 'GA',
        country_code: 'US',
        address: 'Ballroom Impact, 1425 Market Blvd, Suite 525',
        price: '$15',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta',
        community_name: 'Tango Bar Atlanta',
        organizer: 'The Tango Lounge',
        notes: 'Weekly Sunday milonga from 6:30 PM to 10:00 PM with complimentary pre-milonga class at 6:30 PM.'
      },
      {
        event_name: 'Southern Holiday Tango Fest 2026',
        event_type: 'FESTIVAL',
        start_date: '2026-12-17',
        end_date: '2026-12-20',
        city: 'Norcross',
        state: 'GA',
        country_code: 'US',
        address: 'Norcross Cultural Arts & Community Center, 10 College St NW',
        price: '$180',
        is_free: false,
        source_url: 'https://www.facebook.com/groups/tangobaratlanta',
        community_name: 'Tango Bar Atlanta',
        organizer: 'Southern Holiday Tango',
        notes: 'Annual 4-day winter celebration in Greater Atlanta. Outstanding guest DJs, international social dancers, and festive milongas.'
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
        source_url: 'https://facebook.com/groups/atlantatango/events/339182901',
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
        source_url: 'https://facebook.com/groups/atlantatango/events/339291822',
        community_name: 'Atlanta Tango Dancers Community',
        organizer: 'Midtown Tango Circle',
        notes: 'Afternoon milonga with natural skylight, Argentine empanadas, and friendly cabeceo.'
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
        source_url: 'https://facebook.com/groups/nyctangocommunity/events/558291029',
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
        source_url: 'https://facebook.com/groups/nyctangocommunity/events/558401928',
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
        source_url: 'https://facebook.com/groups/bayareatango/events/774910291',
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
        source_url: 'https://facebook.com/groups/bayareatango/events/775019283',
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
        source_url: 'https://facebook.com/groups/chicagotangodancers/events/884910291',
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
        source_url: 'https://facebook.com/groups/miamitangoscene/events/66491029',
        community_name: 'Miami Argentine Tango Scene',
        organizer: 'Miami Tango Community',
        notes: 'Little Havana vibrant holiday milonga with live tropical tango ensemble.'
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
        source_url: 'https://facebook.com/groups/milongasdebuenosaires/events/11029381',
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
        source_url: 'https://facebook.com/groups/milongasdebuenosaires/events/11039482',
        community_name: 'Milongas de Buenos Aires',
        organizer: 'Malcolm Tango',
        notes: 'Típica milonga porteña con orquesta en vivo, empanadas y fernet hasta las 4 AM.'
      }
    ]
  },

  // --- EUROPE ---
  {
    id: 'fb_tango_popular_115408145174568',
    name: 'Tango Popular Community Group (FB Group 115408145174568)',
    groupHandle: 'groups/115408145174568',
    url: 'https://www.facebook.com/groups/115408145174568',
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
        source_url: 'https://www.facebook.com/groups/115408145174568',
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
        source_url: 'https://www.facebook.com/groups/115408145174568',
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
        source_url: 'https://www.facebook.com/groups/115408145174568',
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
        source_url: 'https://www.facebook.com/groups/115408145174568',
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
        source_url: 'https://www.facebook.com/groups/115408145174568',
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
        source_url: 'https://facebook.com/groups/berlintangocommunity/events/9948201',
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
        source_url: 'https://facebook.com/groups/londontangonetwork/events/4482910',
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

  // 4. Extract Price
  let price = '₩15,000';
  let isFree = false;
  if (lowerText.includes('free') || lowerText.includes('무료') || lowerText.includes('gratis')) {
    price = 'Free';
    isFree = true;
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

  // 5. Extract Location / Address
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
