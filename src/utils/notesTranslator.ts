import { SupportedLanguage } from '../types';

/**
 * Exact dictionary for static and known seeded event notes.
 * Provides high-fidelity, natural translations across all 5 supported languages.
 */
const EXACT_NOTES: Record<string, Record<SupportedLanguage, string>> = {
  // Atlanta & Birmingham
  '페이스북 그룹 Tango Birmingham (호스트: Beth Nicholson) 등록 행사. 9월 12일 (토) 오후 6:00 CDT Magnolia Ballroom 스페셜 버밍엄 밀롱가.': {
    en: 'Facebook Group Tango Birmingham (Host: Beth Nicholson) registered event. Sep 12 (Sat) 6:00 PM CDT Magnolia Ballroom Special Birmingham Milonga.',
    es: 'Evento registrado del grupo de Facebook Tango Birmingham (Anfitrión: Beth Nicholson). 12 de septiembre (Sáb) 6:00 PM CDT Magnolia Ballroom Milonga especial de Birmingham.',
    ko: '페이스북 그룹 Tango Birmingham (호스트: Beth Nicholson) 등록 행사. 9월 12일 (토) 오후 6:00 CDT Magnolia Ballroom 스페셜 버밍엄 밀롱가.',
    ja: 'Facebookグループ Tango Birmingham (ホスト: Beth Nicholson) 登録イベント。9月12日 (土) 午後6:00 CDT Magnolia Ballroom スペシャル・バーミンガム・ミロンガ。',
    zh: 'Facebook群组 Tango Birmingham (主办: Beth Nicholson) 登记活动。9月12日 (周六) 下午6:00 CDT Magnolia Ballroom 特别伯明翰米隆加舞会。'
  },
  '페이스북 Boston Tango 그룹 등록 행사. 9월 12일 (토) 오후 7:30 CDT. Blue Milonga Sep 12 - 초청 게스트 DJ Toshi 세션.': {
    en: 'Facebook Boston Tango Group registered event. Sep 12 (Sat) 7:30 PM CDT. Blue Milonga Sep 12 - Guest DJ Toshi session.',
    es: 'Evento registrado del grupo de Facebook Boston Tango. 12 de septiembre (Sáb) 7:30 PM CDT. Blue Milonga Sep 12 - Sesión con DJ invitado Toshi.',
    ko: '페이스북 Boston Tango 그룹 등록 행사. 9월 12일 (토) 오후 7:30 CDT. Blue Milonga Sep 12 - 초청 게스트 DJ Toshi 세션.',
    ja: 'Facebook Boston Tango グループ登録イベント。9月12日 (土) 午後7:30 CDT。Blue Milonga Sep 12 - ゲストDJ Toshi セッション。',
    zh: 'Facebook Boston Tango 群组登记活动。9月12日 (周六) 下午7:30 CDT。Blue Milonga Sep 12 - 特邀嘉宾 DJ Toshi 专场。'
  },
  '페이스북 Tango Bar Atlanta 그룹 공유 행사. 9월 8일(화) 오후 7:00 CDT 마에스트로 Rene Torres 초청 마스터클래스 워크샵 및 소셜.': {
    en: 'Facebook Tango Bar Atlanta Group shared event. Sep 8 (Tue) 7:00 PM CDT Maestro Rene Torres Masterclass Workshop & Social.',
    es: 'Evento compartido del grupo de Facebook Tango Bar Atlanta. 8 de septiembre (Mar) 7:00 PM CDT Clase magistral con Maestro René Torres y social.',
    ko: '페이스북 Tango Bar Atlanta 그룹 공유 행사. 9월 8일(화) 오후 7:00 CDT 마에스트로 Rene Torres 초청 마스터클래스 워크샵 및 소셜.',
    ja: 'Facebook Tango Bar Atlanta グループ共有イベント。9月8日 (火) 午後7:00 CDT マエストロ Rene Torres 招待マスタークラス・ワークショップ＆ソーシャル。',
    zh: 'Facebook Tango Bar Atlanta 群组分享活动。9月8日 (周二) 下午7:00 CDT 特邀大师 Rene Torres 大师班工作坊及舞会。'
  },
  '페이스북 그룹 Tango Bar Atlanta 관리자(Buddy Dale Diego Stotts) 공유 신규 이벤트. 9월 12일 (토) 오후 7:30 CDT 로즈웰 The Tango Lounge Milonga ROUGE (게스트 DJ LYNN).': {
    en: 'Facebook Group Tango Bar Atlanta Admin (Buddy Dale Diego Stotts) shared event. Sep 12 (Sat) 7:30 PM CDT Roswell The Tango Lounge Milonga ROUGE (Guest DJ LYNN).',
    es: 'Evento compartido por el administrador de Facebook Tango Bar Atlanta (Buddy Dale Diego Stotts). 12 de septiembre (Sáb) 7:30 PM CDT Roswell The Tango Lounge Milonga ROUGE (DJ invitada LYNN).',
    ko: '페이스북 그룹 Tango Bar Atlanta 관리자(Buddy Dale Diego Stotts) 공유 신규 이벤트. 9월 12일 (토) 오후 7:30 CDT 로즈웰 The Tango Lounge Milonga ROUGE (게스트 DJ LYNN).',
    ja: 'Facebookグループ Tango Bar Atlanta 管理者(Buddy Dale Diego Stotts) 共有イベント。9月12日 (土) 午後7:30 CDT ロズウェル The Tango Lounge Milonga ROUGE (ゲストDJ LYNN)。',
    zh: 'Facebook群组 Tango Bar Atlanta 管理员(Buddy Dale Diego Stotts) 分享活动。9月12日 (周六) 下午7:30 CDT 罗斯韦尔 The Tango Lounge Milonga ROUGE (特邀DJ LYNN)。'
  },
  '9월 13일 (일) 오전 11:30 CDT. Pre-Milonga Workshop과 정통 밀롱가 소셜 세션.': {
    en: 'Sep 13 (Sun) 11:30 AM CDT. Pre-Milonga Workshop and traditional milonga social session.',
    es: '13 de septiembre (Dom) 11:30 AM CDT. Taller previo a la milonga y sesión social tradicional.',
    ko: '9월 13일 (일) 오전 11:30 CDT. Pre-Milonga Workshop과 정통 밀롱가 소셜 세션.',
    ja: '9月13日 (日) 午前11:30 CDT。プレ・ミロンガ ワークショップと本格ミロンガ ソーシャルセッション。',
    zh: '9月13日 (周日) 上午11:30 CDT。米隆加前工作坊与传统米隆加社交舞会。'
  },
  '9월 20일 (일) 오후 6:00 CDT. The Tango Lounge 50/50 정기 밀롱가.': {
    en: 'Sep 20 (Sun) 6:00 PM CDT. The Tango Lounge 50/50 regular milonga.',
    es: '20 de septiembre (Dom) 6:00 PM CDT. Milonga regular The Tango Lounge 50/50.',
    ko: '9월 20일 (일) 오후 6:00 CDT. The Tango Lounge 50/50 정기 밀롱가.',
    ja: '9月20日 (日) 午後6:00 CDT。The Tango Lounge 50/50 定例ミロンガ。',
    zh: '9月20日 (周日) 下午6:00 CDT。The Tango Lounge 50/50 定期米隆加。'
  },
  '10월 9일 (금) ~ 10월 11일 (일) 3일간 진행되는 ATS 1주년 기념 인터내셔널 탱고 위크엔드.': {
    en: 'Oct 9 (Fri) ~ Oct 11 (Sun), 3-day ATS 1st Anniversary International Tango Weekend.',
    es: '9 de octubre (Vie) ~ 11 de octubre (Dom), fin de semana internacional de tango por el 1.er aniversario de ATS (3 días).',
    ko: '10월 9일 (금) ~ 10월 11일 (일) 3일간 진행되는 ATS 1주년 기념 인터내셔널 탱고 위크엔드.',
    ja: '10月9日 (金) ~ 10月11日 (日) 3日間にわたり開催される ATS 1周年記念インターナショナル・タンゴ・ウィークエンド。',
    zh: '10月9日 (周五) ~ 10月11日 (周日) 为期3天的 ATS 1周年纪念国际探戈周末。'
  },

  // NYC & Boston
  '페이스북 nyctangonews 그룹 등록 행사. 9월 11일 (금) 오후 6:30 CDT / 7:30 EDT. Ripley Grier Studio Room 17S ($25, Host & DJ: Victoria Codru).': {
    en: 'Facebook nyctangonews Group registered event. Sep 11 (Fri) 6:30 PM CDT / 7:30 PM EDT. Ripley Grier Studio Room 17S ($25, Host & DJ: Victoria Codru).',
    es: 'Evento registrado del grupo de Facebook nyctangonews. 11 de septiembre (Vie) 6:30 PM CDT / 7:30 PM EDT. Ripley Grier Studio Room 17S ($25, Anfitriona y DJ: Victoria Codru).',
    ko: '페이스북 nyctangonews 그룹 등록 행사. 9월 11일 (금) 오후 6:30 CDT / 7:30 EDT. Ripley Grier Studio Room 17S ($25, Host & DJ: Victoria Codru).',
    ja: 'Facebook nyctangonews グループ登録イベント。9月11日 (金) 午後6:30 CDT / 7:30 EDT。Ripley Grier Studio Room 17S ($25, ホスト & DJ: Victoria Codru)。',
    zh: 'Facebook nyctangonews 群组登记活动。9月11日 (周五) 下午6:30 CDT / 7:30 EDT。Ripley Grier Studio Room 17S ($25, 主办 & DJ: Victoria Codru)。'
  },
  '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 2:00 CDT / 3:00 EDT. Second Sunday in September Milonga TEMPRANA.': {
    en: 'Facebook nyctangonews Group registered event. Sep 13 (Sun) 2:00 PM CDT / 3:00 PM EDT. Second Sunday in September Milonga TEMPRANA.',
    es: 'Evento registrado del grupo de Facebook nyctangonews. 13 de septiembre (Dom) 2:00 PM CDT / 3:00 PM EDT. Milonga TEMPRANA del segundo domingo de septiembre.',
    ko: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 2:00 CDT / 3:00 EDT. Second Sunday in September Milonga TEMPRANA.',
    ja: 'Facebook nyctangonews グループ登録イベント。9月13日 (日) 午後2:00 CDT / 3:00 EDT。9月第2日曜日 Milonga TEMPRANA。',
    zh: 'Facebook nyctangonews 群组登记活动。9月13日 (周日) 下午2:00 CDT / 3:00 EDT。9月第二个周日 Milonga TEMPRANA。'
  },
  '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 밀롱가.': {
    en: 'Facebook nyctangonews Group registered event. Sep 13 (Sun) 4:00 PM CDT / 5:00 PM EDT ~ 10:00 PM EDT. Hudson River Park Pier 45 Live Music (Singer Mariela Marco) & DJ Outdoor Milonga.',
    es: 'Evento registrado del grupo de Facebook nyctangonews. 13 de septiembre (Dom) 4:00 PM CDT / 5:00 PM EDT ~ 10:00 PM EDT. Hudson River Park Pier 45 Música en vivo (Cantante Mariela Marco) y milonga al aire libre con DJ.',
    ko: '페이스북 nyctangonews 그룹 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 밀롱가.',
    ja: 'Facebook nyctangonews グループ登録イベント。9月13日 (日) 午後4:00 CDT / 5:00 EDT ~ 10:00 EDT。ハドソンリバー・パーク Pier 45 ライブ音楽 (歌手 Mariela Marco) & DJ 屋外ミロンガ。',
    zh: 'Facebook nyctangonews 群组登记活动。9月13日 (周日) 下午4:00 CDT / 5:00 EDT ~ 10:00 EDT。哈德逊河公园 Pier 45 现场音乐 (歌手 Mariela Marco) 与 DJ 户外米隆加。'
  },
  '페이스북 nyctangonews 그룹 공유 행사. 몬트리올 탱고 페스티벌 제20회 에디션 (현재 진행 중).': {
    en: 'Facebook nyctangonews Group shared event. Montreal Tango Festival 20th Edition (Currently in progress).',
    es: 'Evento compartido del grupo de Facebook nyctangonews. Festival de Tango de Montreal 20ª edición (Actualmente en curso).',
    ko: '페이스북 nyctangonews 그룹 공유 행사. 몬트리올 탱고 페스티벌 제20회 에디션 (현재 진행 중).',
    ja: 'Facebook nyctangonews グループ共有イベント。モントリオール・タンゴ・フェスティバル第20回 (現在開催中)。',
    zh: 'Facebook nyctangonews 群组分享活动。蒙特利尔探戈节第20届 (正在进行中)。'
  },
  '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 무료 밀롱가.': {
    en: 'Facebook New York Tango Group (243341781981565) registered event. Sep 13 (Sun) 4:00 PM CDT / 5:00 PM EDT ~ 10:00 PM EDT. Hudson River Park Pier 45 Live Music (Singer Mariela Marco) & DJ Outdoor Free Milonga.',
    es: 'Evento registrado del grupo de Facebook New York Tango (243341781981565). 13 de septiembre (Dom) 4:00 PM CDT / 5:00 PM EDT ~ 10:00 PM EDT. Hudson River Park Pier 45 Música en vivo (Cantante Mariela Marco) y milonga al aire libre gratuita con DJ.',
    ko: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 13일 (일) 오후 4:00 CDT / 5:00 EDT ~ 10:00 EDT. 허드슨 리버 파크 Pier 45 라이브 뮤직(가수 Mariela Marco) & DJ 야외 무료 밀롱가.',
    ja: 'Facebook New York Tango グループ (243341781981565) 登録イベント。9月13日 (日) 午後4:00 CDT / 5:00 EDT ~ 10:00 EDT。ハドソンリバー・パーク Pier 45 ライブ音楽 (歌手 Mariela Marco) & DJ 屋外無料ミロンガ。',
    zh: 'Facebook New York Tango 群组 (243341781981565) 登记活动。9月13日 (周日) 下午4:00 CDT / 5:00 EDT ~ 10:00 EDT。哈德逊河公园 Pier 45 现场音乐 (歌手 Mariela Marco) 与 DJ 户外免费米隆加。'
  },
  '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 19일 (토) 오후 6:30 CDT / 7:20 EDT. Hungarian House (213 E 82nd St, NYC) 25주년 기념 쇼케이스(Guillermina Quiroga & Mariano Logiudice) 및 올나잇 밀롱가.': {
    en: 'Facebook New York Tango Group (243341781981565) registered event. Sep 19 (Sat) 6:30 PM CDT / 7:20 PM EDT. Hungarian House (213 E 82nd St, NYC) 25th Anniversary Showcase (Guillermina Quiroga & Mariano Logiudice) & All-Night Milonga.',
    es: 'Evento registrado del grupo de Facebook New York Tango (243341781981565). 19 de septiembre (Sáb) 6:30 PM CDT / 7:20 PM EDT. Hungarian House (213 E 82nd St, NYC) Showcase del 25 aniversario (Guillermina Quiroga y Mariano Logiudice) y milonga toda la noche.',
    ko: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 9월 19일 (토) 오후 6:30 CDT / 7:20 EDT. Hungarian House (213 E 82nd St, NYC) 25주년 기념 쇼케이스(Guillermina Quiroga & Mariano Logiudice) 및 올나잇 밀롱가.',
    ja: 'Facebook New York Tango グループ (243341781981565) 登録イベント。9月19日 (土) 午後6:30 CDT / 7:20 EDT。Hungarian House (213 E 82nd St, NYC) 25周年記念ショーケース(Guillermina Quiroga & Mariano Logiudice) およびオールナイト・ミロンガ。',
    zh: 'Facebook New York Tango 群组 (243341781981565) 登记活动。9月19日 (周六) 下午6:30 CDT / 7:20 EDT。Hungarian House (213 E 82nd St, NYC) 25周年纪念演出(Guillermina Quiroga & Mariano Logiudice) 及通宵米隆加。'
  },
  '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 10월 31일 (토) 오후 4:30 CDT / 5:30 EDT. The Hungarian House 스타리 나이트 탱고 제4회 뉴욕 에디션.': {
    en: 'Facebook New York Tango Group (243341781981565) registered event. Oct 31 (Sat) 4:30 PM CDT / 5:30 PM EDT. The Hungarian House Starry Night Tango 4th NYC Edition.',
    es: 'Evento registrado del grupo de Facebook New York Tango (243341781981565). 31 de octubre (Sáb) 4:30 PM CDT / 5:30 PM EDT. The Hungarian House Starry Night Tango 4ª edición de NYC.',
    ko: '페이스북 New York Tango 그룹 (243341781981565) 등록 행사. 10월 31일 (토) 오후 4:30 CDT / 5:30 EDT. The Hungarian House 스타리 나이트 탱고 제4회 뉴욕 에디션.',
    ja: 'Facebook New York Tango グループ (243341781981565) 登録イベント。10月31日 (土) 午後4:30 CDT / 5:30 EDT。The Hungarian House スターリー・ナイト・タンゴ 第4回ニューヨーク・エディション。',
    zh: 'Facebook New York Tango 群组 (243341781981565) 登记活动。10月31日 (周六) 下午4:30 CDT / 5:30 EDT。The Hungarian House 星光之夜探戈 第4届纽约版。'
  },
  '페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) 오후 5:00 CDT. 39 Barrett Road, Lexington, MA ($10, 회원 무료).': {
    en: 'Facebook Boston Tango Group registered event. Sep 10 (Thu) 5:00 PM CDT. 39 Barrett Road, Lexington, MA ($10, Free for members).',
    es: 'Evento registrado del grupo de Facebook Boston Tango. 10 de septiembre (Jue) 5:00 PM CDT. 39 Barrett Road, Lexington, MA ($10, gratis para miembros).',
    ko: '페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) 오후 5:00 CDT. 39 Barrett Road, Lexington, MA ($10, 회원 무료).',
    ja: 'Facebook Boston Tango グループ登録イベント。9月10日 (木) 午後5:00 CDT。39 Barrett Road, Lexington, MA ($10, 会員無料)。',
    zh: 'Facebook Boston Tango 群组登记活动。9月10日 (周四) 下午5:00 CDT。39 Barrett Road, Lexington, MA ($10, 会员免费)。'
  },
  '페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) 오후 6:00 CDT. Rocio & Luciano Capparelli 마스터클래스 워크샵 및 초급 클래스.': {
    en: 'Facebook Boston Tango Group registered event. Sep 10 (Thu) 6:00 PM CDT. Rocio & Luciano Capparelli Masterclass Workshop and Beginner Class.',
    es: 'Evento registrado del grupo de Facebook Boston Tango. 10 de septiembre (Jue) 6:00 PM CDT. Taller magistral y clase para principiantes con Rocío y Luciano Capparelli.',
    ko: '페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) 오후 6:00 CDT. Rocio & Luciano Capparelli 마스터클래스 워크샵 및 초급 클래스.',
    ja: 'Facebook Boston Tango グループ登録イベント。9月10日 (木) 午後6:00 CDT。Rocio & Luciano Capparelli マスタークラス・ワークショップおよび初級クラス。',
    zh: 'Facebook Boston Tango 群组登记活动。9月10日 (周四) 下午6:00 CDT。Rocio & Luciano Capparelli 大师班工作坊及初级课程。'
  },
  "페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) ~ 9월 24일 WMTG's Thursdays with Cyla and Guests 정기 세션.": {
    en: "Facebook Boston Tango Group registered event. Sep 10 (Thu) ~ Sep 24 WMTG's Thursdays with Cyla and Guests regular session.",
    es: "Evento registrado del grupo de Facebook Boston Tango. 10 de septiembre (Jue) ~ 24 de septiembre Sesión regular WMTG's Thursdays with Cyla and Guests.",
    ko: "페이스북 Boston Tango 그룹 등록 행사. 9월 10일 (목) ~ 9월 24일 WMTG's Thursdays with Cyla and Guests 정기 세션.",
    ja: "Facebook Boston Tango グループ登録イベント。9月10日 (木) ~ 9月24日 WMTG's Thursdays with Cyla and Guests 定例セッション。",
    zh: "Facebook Boston Tango 群组登记活动。9月10日 (周四) ~ 9月24日 WMTG's Thursdays with Cyla and Guests 定期专场。"
  },
  '페이스북 Boston Tango 그룹 등록 행사. 9월 11일 (금) ~ 9월 12일 (토) Northampton, Massachusetts. Veronika Kruta 초청 Tango Bliss 주말 워크샵.': {
    en: 'Facebook Boston Tango Group registered event. Sep 11 (Fri) ~ Sep 12 (Sat) Northampton, Massachusetts. Veronika Kruta guest Tango Bliss weekend workshop.',
    es: 'Evento registrado del grupo de Facebook Boston Tango. 11 de septiembre (Vie) ~ 12 de septiembre (Sáb) Northampton, Massachusetts. Taller de fin de semana Tango Bliss con Veronika Kruta invitada.',
    ko: '페이스북 Boston Tango 그룹 등록 행사. 9월 11일 (금) ~ 9월 12일 (토) Northampton, Massachusetts. Veronika Kruta 초청 Tango Bliss 주말 워크샵.',
    ja: 'Facebook Boston Tango グループ登録イベント。9月11日 (金) ~ 9月12日 (土) Northampton, Massachusetts。Veronika Kruta ゲスト Tango Bliss 週末ワークショップ。',
    zh: 'Facebook Boston Tango 群组登记活动。9月11日 (周五) ~ 9月12日 (周六) 马萨诸塞州北安普敦。特邀嘉宾 Veronika Kruta 的 Tango Bliss 周末工作坊。'
  },
  '페이스북 Boston Tango 그룹 등록 행사. 9월 11일 (금) 오후 8:00 CDT. 정통 Milonga Poema 소셜 나이트 (Rocio & Luciano Capparelli 초청).': {
    en: 'Facebook Boston Tango Group registered event. Sep 11 (Fri) 8:00 PM CDT. Authentic Milonga Poema social night (Featuring Rocio & Luciano Capparelli).',
    es: 'Evento registrado del grupo de Facebook Boston Tango. 11 de septiembre (Vie) 8:00 PM CDT. Noche social de auténtica Milonga Poema (Invitados Rocío y Luciano Capparelli).',
    ko: '페이스북 Boston Tango 그룹 등록 행사. 9월 11일 (금) 오후 8:00 CDT. 정통 Milonga Poema 소셜 나이트 (Rocio & Luciano Capparelli 초청).',
    ja: 'Facebook Boston Tango グループ登録イベント。9月11日 (金) 午後8:00 CDT。本格 Milonga Poema ソーシャルナイト (Rocio & Luciano Capparelli 招待)。',
    zh: 'Facebook Boston Tango 群组登记活动。9月11日 (周五) 下午8:00 CDT。正统 Milonga Poema 社交之夜 (特邀 Rocio & Luciano Capparelli)。'
  },
  '페이스북 Boston Tango 그룹 공유 행사 (현재 진행 중). 2026 몬트리올 인터내셔널 탱고 페스티벌.': {
    en: 'Facebook Boston Tango Group shared event (Currently in progress). 2026 Montreal International Tango Festival.',
    es: 'Evento compartido del grupo de Facebook Boston Tango (Actualmente en curso). Festival Internacional de Tango de Montreal 2026.',
    ko: '페이스북 Boston Tango 그룹 공유 행사 (현재 진행 중). 2026 몬트리올 인터내셔널 탱고 페스티벌.',
    ja: 'Facebook Boston Tango グループ共有イベント (現在開催中)。2026 モントリオール・インターナショナル・タンゴ・フェスティバル。',
    zh: 'Facebook Boston Tango 群组分享活动 (正在进行中)。2026 蒙特利尔国际探戈节。'
  },

  // Korean Community Events
  '페이스북 커뮤니티 주최 정기 가을 밀롱가. 게스트 DJ 비닐 세션 및 탱고 와인 파티.': {
    en: 'Regular autumn milonga hosted by Facebook community. Guest DJ vinyl session and tango wine party.',
    es: 'Milonga regular de otoño organizada por la comunidad de Facebook. Sesión de DJ invitado con vinilos y fiesta de tango y vino.',
    ko: '페이스북 커뮤니티 주최 정기 가을 밀롱가. 게스트 DJ 비닐 세션 및 탱고 와인 파티.',
    ja: 'Facebookコミュニティ主催の秋の定例ミロンガ。ゲストDJのアナログレコードセッションとワインパーティー。',
    zh: 'Facebook社群主办的秋季定期米隆加舞会。特邀黑胶DJ专场与探戈红酒派对。'
  },
  '자정까지 이어지는 열정적인 홍대 금요 밀롱가. 까베세오 에티켓 준수.': {
    en: 'Passionate Friday milonga in Hongdae running until midnight. Cabeceo etiquette strictly observed.',
    es: 'Apasionada milonga de viernes en Hongdae hasta la medianoche. Se respeta la etiqueta de cabeceo.',
    ko: '자정까지 이어지는 열정적인 홍대 금요 밀롱가. 까베세오 에티켓 준수.',
    ja: '深夜まで続く情熱的な弘大(ホンデ)金曜ミロンガ。カベセオのエチケット遵守。',
    zh: '持续至午夜的弘大周五热情米隆加。请遵守眼神邀舞(Cabeceo)礼仪。'
  },
  '한강 야경이 한눈에 보이는 세빛섬에서 열리는 3일간의 인터내셔널 탱고 페스티벌.': {
    en: '3-day International Tango Festival at Some Sevit with panoramic night views of the Han River.',
    es: 'Festival internacional de tango de 3 días en Some Sevit con vistas panorámicas nocturnas del río Han.',
    ko: '한강 야경이 한눈에 보이는 세빛섬에서 열리는 3일간의 인터내셔널 탱고 페스티벌.',
    ja: '漢江の夜景を一望できるセビッ島で開催される3日間の国際タンゴフェスティバル。',
    zh: '在可饱览汉江夜景的三光岛举办的为期3天国际探戈节。'
  },
  '매주 토요일 전통 살롱 탱고 음악과 최상급 마룻바닥에서 즐기는 고품격 밀롱가.': {
    en: 'High-end milonga every Saturday with traditional salon tango music and premium wooden floors.',
    es: 'Milonga de alta calidad todos los sábados con música tradicional de tango salón y pista de madera de primera.',
    ko: '매주 토요일 전통 살롱 탱고 음악과 최상급 마룻바닥에서 즐기는 고품격 밀롱가.',
    ja: '毎週土曜日、伝統的なサロンタンゴ音楽と最高級フローリングで楽しむ上質なミロンガ。',
    zh: '每周六在顶级木地板上伴随传统沙龙探戈音乐享受的高品质米隆加舞会。'
  },
  '목요일 저녁 자유로운 연습과 와인을 함께 즐기는 친목 쁘락띠까.': {
    en: 'Thursday evening social práctica with free practice and wine.',
    es: 'Práctica social de jueves por la tarde con práctica libre y vino.',
    ko: '목요일 저녁 자유로운 연습과 와인을 함께 즐기는 친목 쁘락띠까.',
    ja: '木曜日の夕方、自由な練習とワインを楽しむ親睦プラクティカ。',
    zh: '周四傍晚尽情练习、共享美酒的友谊练习会。'
  },
  '일요일 오후 5시부터 시작되는 아늑하고 편안한 선셋 탱고 살롱.': {
    en: 'Cozy and relaxing sunset tango salon starting Sundays at 5:00 PM.',
    es: 'Acogedor y relajante salón de tango al atardecer a partir de las 5:00 PM los domingos.',
    ko: '일요일 오후 5시부터 시작되는 아늑하고 편안한 선셋 탱고 살롱.',
    ja: '日曜日の午後5時から始まる、居心地の良いサンセット・タンゴサロン。',
    zh: '周日下午5点开始的温馨惬意日落探戈沙龙。'
  },
  '오션뷰 테라스에서 바닷바람과 함께하는 가을 스페셜 밀롱가.': {
    en: 'Autumn special milonga with ocean breeze on the ocean-view terrace.',
    es: 'Milonga especial de otoño con brisa marina en terraza con vistas al mar.',
    ko: '오션뷰 테라스에서 바닷바람과 함께하는 가을 스페셜 밀롱가.',
    ja: 'オーシャンビューテラスで潮風とともに楽しむ秋のスペシャルミロンガ。',
    zh: '在海景露台伴随海风举办的秋季特别米隆加舞会。'
  },
  '페이스북 커뮤니티에서 발견된 최신 정기 밀롱가 일정입니다.': {
    en: 'Latest regular milonga schedule discovered from Facebook community.',
    es: 'Horario de milonga regular más reciente encontrado en la comunidad de Facebook.',
    ko: '페이스북 커뮤니티에서 발견된 최신 정기 밀롱가 일정입니다.',
    ja: 'Facebookコミュニティから見つかった最新の定例ミロンガスケジュールです。',
    zh: '来自Facebook社群发现的最新定期米隆加日程。'
  },
  '주말 오후 열리는 캐주얼 탱고 소셜 & 쁘락띠까.': {
    en: 'Casual weekend afternoon tango social & práctica.',
    es: 'Social de tango casual y práctica de fin de semana por la tarde.',
    ko: '주말 오후 열리는 캐주얼 탱고 소셜 & 쁘락띠까.',
    ja: '週末午後に開催されるカジュアルなタンゴ・ソーシャル＆プラクティカ。',
    zh: '周末下午举行的轻松探戈社交舞会与练习会。'
  },

  // New Orleans Argentine Tango Group
  '페이스북 New Orleans Argentine Tango Group 등록 행사. 9월 12일 토요일 오후 7시~10시 (7-10PM). 장소: 145 Government St Behind Superior Grill. 최고가 옵션: ~$20.': {
    en: 'Facebook New Orleans Argentine Tango Group registered event. Sep 12 (Sat) 7:00 PM ~ 10:00 PM (7-10PM). Venue: 145 Government St Behind Superior Grill. Max price option: ~$20.',
    es: 'Evento registrado del grupo de Facebook New Orleans Argentine Tango Group. 12 de septiembre (Sáb) 7:00 PM ~ 10:00 PM (7-10PM). Lugar: 145 Government St Behind Superior Grill. Opción de precio máx.: ~$20.',
    ko: '페이스북 New Orleans Argentine Tango Group 등록 행사. 9월 12일 토요일 오후 7시~10시 (7-10PM). 장소: 145 Government St Behind Superior Grill. 최고가 옵션: ~$20.',
    ja: 'Facebook New Orleans Argentine Tango Group 登録イベント。9月12日 (土) 午後7時〜10時 (7-10PM)。会場: 145 Government St Behind Superior Grill。最高価格オプション: ~$20。',
    zh: 'Facebook New Orleans Argentine Tango Group 登记活动。9月12日 (周六) 下午7点~10点 (7-10PM)。地点: 145 Government St Behind Superior Grill。最高价格选项: ~$20。'
  },
  '페이스북 New Orleans Argentine Tango Group 등록 행사. 11월 6일(금)~8일(일). 뉴올리언스 최초 구스타보 나베이라(Gustavo Naveira) 마스터 워크샵. 풀 워크샵 패스 최고가: ~$180.': {
    en: 'Facebook New Orleans Argentine Tango Group registered event. Nov 6 (Fri) ~ Nov 8 (Sun). First time in New Orleans Gustavo Naveira Master Workshop. Full workshop pass max price: ~$180.',
    es: 'Evento registrado del grupo de Facebook New Orleans Argentine Tango Group. 6 de noviembre (Vie) ~ 8 de noviembre (Dom). Por primera vez en Nueva Orleans taller magistral de Gustavo Naveira. Precio máx. pase de taller completo: ~$180.',
    ko: '페이스북 New Orleans Argentine Tango Group 등록 행사. 11월 6일(금)~8일(일). 뉴올리언스 최초 구스타보 나베이라(Gustavo Naveira) 마스터 워크샵. 풀 워크샵 패스 최고가: ~$180.',
    ja: 'Facebook New Orleans Argentine Tango Group 登録イベント。11月6日(金)〜8日(日)。ニューオーリンズ初 グスタボ・ナベイラ(Gustavo Naveira) マスターワークショップ。フルワークショップパス最高価格: ~$180。',
    zh: 'Facebook New Orleans Argentine Tango Group 登记活动。11月6日(周五)~8日(周日)。新奥尔良首度古斯塔沃·纳维拉(Gustavo Naveira)大师工作坊。全工作坊通票最高价格: ~$180。'
  },
  '페이스북 New Orleans Argentine Tango Group 등록 행사. 11월 13일(금) 오후 2시 CST 시작. Paris No Duerme 마라톤 가을 에디션. 마라톤 패스 최고가: ~$190.': {
    en: 'Facebook New Orleans Argentine Tango Group registered event. Nov 13 (Fri) 2:00 PM CST starts. Paris No Duerme Marathon Autumn Edition. Marathon pass max price: ~$190.',
    es: 'Evento registrado del grupo de Facebook New Orleans Argentine Tango Group. 13 de noviembre (Vie) 2:00 PM CST inicio. Edición de otoño del maratón Paris No Duerme. Precio máx. pase de maratón: ~$190.',
    ko: '페이스북 New Orleans Argentine Tango Group 등록 행사. 11월 13일(금) 오후 2시 CST 시작. Paris No Duerme 마라톤 가을 에디션. 마라톤 패스 최고가: ~$190.',
    ja: 'Facebook New Orleans Argentine Tango Group 登録イベント。11月13日(金) 午後2時 CST 開始。Paris No Duerme マラソン秋エディション。マラソンパス最高価格: ~$190。',
    zh: 'Facebook New Orleans Argentine Tango Group 登记活动。11月13日(周五) 下午2点 CST 开始。Paris No Duerme 马拉松秋季版。马拉松通票最高价格: ~$190。'
  },

  // Atlanta & Roswell Sub-site crawled events
  '[공식 웹사이트 서브 사이트(/milongas) 검색] 로즈웰 The Tango Lounge Milonga ROUGE. 티켓 옵션(일반 $15, 지정석 & 사전예약 $25 중 최고가: ~$25).': {
    en: '[Official Website Sub-site (/milongas) Search] Roswell The Tango Lounge Milonga ROUGE. Ticket options (General $15, Reserved & Pre-booking $25, Max price: ~$25).',
    es: '[Búsqueda en subsitio de web oficial (/milongas)] Roswell The Tango Lounge Milonga ROUGE. Opciones de entrada (General $15, Reservado y preventa $25, Precio máx.: ~$25).',
    ko: '[공식 웹사이트 서브 사이트(/milongas) 검색] 로즈웰 The Tango Lounge Milonga ROUGE. 티켓 옵션(일반 $15, 지정석 & 사전예약 $25 중 최고가: ~$25).',
    ja: '[公式ウェブサイト・サブサイト(/milongas)検索] ロズウェル The Tango Lounge Milonga ROUGE。チケットオプション(一般 $15、指定席＆事前予約 $25、最高価格: ~$25)。',
    zh: '[官方网站子页面(/milongas)检索] 罗斯韦尔 The Tango Lounge Milonga ROUGE。门票选项(普通 $15，指定座席与预订 $25，最高价格: ~$25)。'
  },
  '[공식 웹사이트 서브 사이트(/festival, /pricing) 검색] ATS 가을 인터내셔널 탱고 페스티벌. 패스 옵션(밀롱가 $30, 워크샵 $80, 밀롱가패스 $120, VIP풀패스 $240 중 최고가: ~$240).': {
    en: '[Official Website Sub-site (/festival, /pricing) Search] ATS Autumn International Tango Festival. Pass options (Milonga $30, Workshop $80, Milonga Pass $120, VIP Full Pass $240, Max price: ~$240).',
    es: '[Búsqueda en subsitio de web oficial (/festival, /pricing)] Festival Internacional de Tango de Otoño ATS. Opciones de pase (Milonga $30, Taller $80, Pase de milonga $120, Pase VIP completo $240, Precio máx.: ~$240).',
    ko: '[공식 웹사이트 서브 사이트(/festival, /pricing) 검색] ATS 가을 인터내셔널 탱고 페스티벌. 패스 옵션(밀롱가 $30, 워크샵 $80, 밀롱가패스 $120, VIP풀패스 $240 중 최고가: ~$240).',
    ja: '[公式ウェブサイト・サブサイト(/festival, /pricing)検索] ATS 秋の国際タンゴフェスティバル。パスオプション(ミロンガ $30、ワークショップ $80、ミロンガパス $120、VIPフルパス $240、最高価格: ~$240)。',
    zh: '[官方网站子页面(/festival, /pricing)检索] ATS 秋季国际探戈节。通票选项(米隆加 $30，工作坊 $80，米隆加通票 $120，VIP全通票 $240，最高价格: ~$240)。'
  },
  '[공식 웹사이트 서브 사이트(/workshops) 검색] 아르헨티나 마에스트로 초청 테크닉 마스터클래스. 티켓 옵션(1세션 $25, 전체 워크샵 패키지 $45 중 최고가: ~$45).': {
    en: '[Official Website Sub-site (/workshops) Search] Argentine Maestro Guest Technique Masterclass. Ticket options (1 Session $25, Full Workshop Package $45, Max price: ~$45).',
    es: '[Búsqueda en subsitio de web oficial (/workshops)] Taller magistral de técnica con maestro argentino invitado. Opciones de entrada (1 sesión $25, Paquete completo $45, Precio máx.: ~$45).',
    ko: '[공식 웹사이트 서브 사이트(/workshops) 검색] 아르헨티나 마에스트로 초청 테크닉 마스터클래스. 티켓 옵션(1세션 $25, 전체 워크샵 패키지 $45 중 최고가: ~$45).',
    ja: '[公式ウェブサイト・サブサイト(/workshops)検索] アルゼンチン・マエストロ招待テクニック・マスタークラス。チケットオプション(1セッション $25、全ワークショップパッケージ $45、最高価格: ~$45)。',
    zh: '[官方网站子页面(/workshops)检索] 阿根廷大师特邀技巧大师班。门票选项(单课时 $25，完整工作坊套票 $45，最高价格: ~$45)。'
  },

  // NYC Sub-site crawled events
  '[공식 웹사이트 서브 사이트(/milongas) 검색] 헝가리안 하우스 가을 스타리 나이트 갈라 밀롱가. 티켓 옵션(현장 $25, VIP테이블 & 패스 $45 중 최고가: ~$45).': {
    en: '[Official Website Sub-site (/milongas) Search] Hungarian House Autumn Starry Night Gala Milonga. Ticket options (At the door $25, VIP Table & Pass $45, Max price: ~$45).',
    es: '[Búsqueda en subsitio de web oficial (/milongas)] Milonga de gala Starry Night de otoño en Hungarian House. Opciones de entrada (En puerta $25, Mesa y pase VIP $45, Precio máx.: ~$45).',
    ko: '[공식 웹사이트 서브 사이트(/milongas) 검색] 헝가리안 하우스 가을 스타리 나이트 갈라 밀롱가. 티켓 옵션(현장 $25, VIP테이블 & 패스 $45 중 최고가: ~$45).',
    ja: '[公式ウェブサイト・サブサイト(/milongas)検索] ハンガリアンハウス 秋のスターリー・ナイト・ガラミロンガ。チケットオプション(当日 $25、VIPテーブル＆パス $45、最高価格: ~$45)。',
    zh: '[官方网站子页面(/milongas)检索] 匈牙利之家秋季星光之夜盛宴米隆加。门票选项(现场 $25，VIP桌与通票 $45，最高价格: ~$45)。'
  },
  '[공식 웹사이트 서브 사이트(/festival, /pricing) 검색] 뉴욕 가을 탱고 페스티벌. 티켓 옵션(밀롱가 $35, 밀롱가패스 $110, 마스터풀패스 $280 중 최고가: ~$280).': {
    en: '[Official Website Sub-site (/festival, /pricing) Search] New York Autumn Tango Festival. Ticket options (Milonga $35, Milonga Pass $110, Master Full Pass $280, Max price: ~$280).',
    es: '[Búsqueda en subsitio de web oficial (/festival, /pricing)] Festival de Tango de Otoño de Nueva York. Opciones de entrada (Milonga $35, Pase de milonga $110, Pase maestro completo $280, Precio máx.: ~$280).',
    ko: '[공식 웹사이트 서브 사이트(/festival, /pricing) 검색] 뉴욕 가을 탱고 페스티벌. 티켓 옵션(밀롱가 $35, 밀롱가패스 $110, 마스터풀패스 $280 중 최고가: ~$280).',
    ja: '[公式ウェブサイト・サブサイト(/festival, /pricing)検索] ニューヨーク秋のタンゴフェスティバル。チケットオプション(ミロンガ $35、ミロンガパス $110、マスターフルパス $280、最高価格: ~$280)。',
    zh: '[官方网站子页面(/festival, /pricing)检索] 纽约秋季探戈节。门票选项(米隆加 $35，米隆加通票 $110，大师全通票 $280，最高价格: ~$280)。'
  },

  // Seoul Sub-site crawled events
  '[공식 블로그 서브 사이트(/schedule) 검색] 서울 소일탱고 토요 정기 갈라 밀롱가. 티켓 옵션(일반 15,000원, 사전예약 갈라 테이블 25,000원 중 최고가: ~₩25,000).': {
    en: '[Official Blog Sub-site (/schedule) Search] Seoul Soil Tango Saturday Regular Gala Milonga. Ticket options (General 15,000 KRW, Pre-booked Gala Table 25,000 KRW, Max price: ~₩25,000).',
    es: '[Búsqueda en subsitio de blog oficial (/schedule)] Milonga de gala regular de sábado Seoul Soil Tango. Opciones de entrada (General 15.000 KRW, Mesa de gala preventa 25.000 KRW, Precio máx.: ~₩25.000).',
    ko: '[공식 블로그 서브 사이트(/schedule) 검색] 서울 소일탱고 토요 정기 갈라 밀롱가. 티켓 옵션(일반 15,000원, 사전예약 갈라 테이블 25,000원 중 최고가: ~₩25,000).',
    ja: '[公式ブログ・サブサイト(/schedule)検索] ソウル Soil Tango 土曜定例ガラミロンガ。チケットオプション(一般 15,000ウォン、事前予約ガラテーブル 25,000ウォン、最高価格: ~₩25,000)。',
    zh: '[官方博客子页面(/schedule)检索] 首尔 Soil Tango 周六定期盛宴米隆加。门票选项(普通 15,000韩元，预订盛宴桌 25,000韩元，最高价格: ~₩25,000)。'
  },
  '[공식 블로그 서브 사이트(/marathon, /pricing) 검색] 서울 가을 인터내셔널 탱고 마라톤. 티켓 옵션(단일 밀롱가 35,000원, 풀 마라톤 패스 180,000원 중 최고가: ~₩180,000).': {
    en: '[Official Blog Sub-site (/marathon, /pricing) Search] Seoul Autumn International Tango Marathon. Ticket options (Single Milonga 35,000 KRW, Full Marathon Pass 180,000 KRW, Max price: ~₩180,000).',
    es: '[Búsqueda en subsitio de blog oficial (/marathon, /pricing)] Maratón Internacional de Tango de Otoño de Seúl. Opciones de entrada (Milonga individual 35.000 KRW, Pase de maratón completo 180.000 KRW, Precio máx.: ~₩180.000).',
    ko: '[공식 블로그 서브 사이트(/marathon, /pricing) 검색] 서울 가을 인터내셔널 탱고 마라톤. 티켓 옵션(단일 밀롱가 35,000원, 풀 마라톤 패스 180,000원 중 최고가: ~₩180,000).',
    ja: '[公式ブログ・サブサイト(/marathon, /pricing)検索] ソウル秋の国際タンゴマラソン。チケットオプション(単一ミロンガ 35,000ウォン、フルマラソンパス 180,000ウォン、最高価格: ~₩180,000)。',
    zh: '[官方博客子页面(/marathon, /pricing)检索] 首尔秋季国际探戈马拉松。门票选项(单场米隆加 35,000韩元，全马拉松通票 180,000韩元，最高价格: ~₩180,000)。'
  },

  // Tucson Sub-site crawled events
  '[공식 웹사이트 서브 사이트(/full-schedule, /venue-hotel) 검색] Tucson Tango Festival 2027 본 행사. 장소: Tucson Marriott University Park 볼룸 (880 E 2nd St, Tucson, AZ 85719). 4일간의 워크샵, 애프터눈 및 이브닝 밀롱가. 티켓 옵션: 풀패스 최고가 ~$240 (개별 밀롱가 $25-$30).': {
    en: '[Official Website Sub-site (/full-schedule, /venue-hotel) Search] Tucson Tango Festival 2027 Main Event. Venue: Tucson Marriott University Park Ballroom (880 E 2nd St, Tucson, AZ 85719). 4 days of workshops, afternoon and evening milongas. Ticket options: Full Pass max price ~$240 (Individual milonga $25-$30).',
    es: '[Búsqueda en subsitio de web oficial (/full-schedule, /venue-hotel)] Festival de Tango de Tucson 2027 Evento principal. Lugar: Salón Tucson Marriott University Park (880 E 2nd St, Tucson, AZ 85719). 4 días de talleres, milongas de tarde y noche. Opciones de entrada: Precio máx. pase completo ~$240 (Milonga individual $25-$30).',
    ko: '[공식 웹사이트 서브 사이트(/full-schedule, /venue-hotel) 검색] Tucson Tango Festival 2027 본 행사. 장소: Tucson Marriott University Park 볼룸 (880 E 2nd St, Tucson, AZ 85719). 4일간의 워크샵, 애프터눈 및 이브닝 밀롱가. 티켓 옵션: 풀패스 최고가 ~$240 (개별 밀롱가 $25-$30).',
    ja: '[公式ウェブサイト・サブサイト(/full-schedule, /venue-hotel)検索] Tucson Tango Festival 2027 本イベント。会場: Tucson Marriott University Park ボールルーム (880 E 2nd St, Tucson, AZ 85719)。4日間のワークショップ、アフタヌーン＆イブニングミロンガ。チケットオプション: フルパス最高価格 ~$240 (個別ミロンガ $25-$30)。',
    zh: '[官方网站子页面(/full-schedule, /venue-hotel)检索] 图森探戈节 2027 主活动。地点: Tucson Marriott University Park 舞厅 (880 E 2nd St, Tucson, AZ 85719)。为期4天的工作坊、午后及晚间米隆加。门票选项: 全通票最高价格 ~$240 (单场米隆加 $25-$30)。'
  },
  '[공식 웹사이트 서브 사이트(/full-schedule) 검색] 축제 전야 프리 페스티벌 웰컴 밀롱가 (DJ Erick Duarte). 장소: Tucson Marriott University Park. 페스티벌 패스 별도 입장(최고가 옵션: ~$25).': {
    en: '[Official Website Sub-site (/full-schedule) Search] Pre-Festival Eve Welcome Milonga (DJ Erick Duarte). Venue: Tucson Marriott University Park. Separate admission from festival pass (Max price option: ~$25).',
    es: '[Búsqueda en subsitio de web oficial (/full-schedule)] Milonga de bienvenida previa al festival (DJ Erick Duarte). Lugar: Tucson Marriott University Park. Entrada separada del pase de festival (Opción de precio máx.: ~$25).',
    ko: '[공식 웹사이트 서브 사이트(/full-schedule) 검색] 축제 전야 프리 페스티벌 웰컴 밀롱가 (DJ Erick Duarte). 장소: Tucson Marriott University Park. 페스티벌 패스 별도 입장(최고가 옵션: ~$25).',
    ja: '[公式ウェブサイト・サブサイト(/full-schedule)検索] 前夜祭プレ・フェスティバル・ウェルカムミロンガ (DJ Erick Duarte)。会場: Tucson Marriott University Park。フェスティバルパスとは別入場 (最高価格オプション: ~$25)。',
    zh: '[官方网站子页面(/full-schedule)检索] 探戈节前夜欢迎米隆加 (DJ Erick Duarte)。地点: Tucson Marriott University Park。探戈节通票单独入场 (最高价格选项: ~$25)。'
  },
  '[공식 웹사이트 서브 사이트(/tangover-milonga) 검색] 페스티벌 공식 페어웰 탱고버 밀롱가. 장소: Lodge on the Desert Palm Room (306 N Alvernon Way, Tucson, AZ 85711). 최고가 옵션: ~$25.': {
    en: '[Official Website Sub-site (/tangover-milonga) Search] Official Festival Farewell Tangover Milonga. Venue: Lodge on the Desert Palm Room (306 N Alvernon Way, Tucson, AZ 85711). Max price option: ~$25.',
    es: '[Búsqueda en subsitio de web oficial (/tangover-milonga)] Milonga de despedida Tangover oficial del festival. Lugar: Lodge on the Desert Palm Room (306 N Alvernon Way, Tucson, AZ 85711). Opción de precio máx.: ~$25.',
    ko: '[공식 웹사이트 서브 사이트(/tangover-milonga) 검색] 페스티벌 공식 페어웰 탱고버 밀롱가. 장소: Lodge on the Desert Palm Room (306 N Alvernon Way, Tucson, AZ 85711). 최고가 옵션: ~$25.',
    ja: '[公式ウェブサイト・サブサイト(/tangover-milonga)検索] フェスティバル公式フェアウェル・タンゴバーミロンガ。会場: Lodge on the Desert Palm Room (306 N Alvernon Way, Tucson, AZ 85711)。最高価格オプション: ~$25。',
    zh: '[官方网站子页面(/tangover-milonga)检索] 探戈节官方告别 Tangover 米隆加。地点: Lodge on the Desert Palm Room (306 N Alvernon Way, Tucson, AZ 85711)。最高价格选项: ~$25。'
  },

  // English notes in system
  'Monthly flagship community milonga with guest masterclasses and vinyl Golden Age tandas.': {
    en: 'Monthly flagship community milonga with guest masterclasses and vinyl Golden Age tandas.',
    es: 'Milonga comunitaria mensual con clases magistrales de invitados y tandas en vinilo de la Época de Oro.',
    ko: '게스트 마스터클래스와 빈티지 황금기 딴따로 진행되는 월간 커뮤니티 대표 밀롱가.',
    ja: 'ゲストマスタークラスと黄金期のアナログレコードタンダによる月例フラッグシップ・ミロンガ。',
    zh: '每月旗舰社群米隆加，特邀大师班与黄金年代黑胶 tandas。'
  },
  'Afternoon milonga with natural skylight, Argentine empanadas, and friendly cabeceo.': {
    en: 'Afternoon milonga with natural skylight, Argentine empanadas, and friendly cabeceo.',
    es: 'Milonga de tarde con luz natural, empanadas argentinas y cabeceo amistoso.',
    ko: '자연 채광의 천창, 아르헨티나 엠파나다, 친근한 까베세오가 함께하는 오후 밀롱가.',
    ja: '天窓からの自然光、アルゼンチン・エンパナーダ、親しみやすいカベセオが楽しめる午後ミロンガ。',
    zh: '阳光天窗、阿根廷馅饼与友善眼神邀舞的午后米隆加。'
  },
  'Free public milonga under the historic Bethesda Terrace arches. Bring comfortable smooth soles.': {
    en: 'Free public milonga under the historic Bethesda Terrace arches. Bring comfortable smooth soles.',
    es: 'Milonga pública gratuita bajo los históricos arcos de Bethesda Terrace. Traer suelas suaves y cómodas.',
    ko: '유서 깊은 베데스다 테라스 아치 아래서 열리는 무료 공개 밀롱가. 편안한 신발 착용 권장.',
    ja: '歴史あるベセスダ・テラスのアーチ下で開催される無料パブリック・ミロンガ。滑らかなソールの靴をご持参ください。',
    zh: '在历史悠久的毕士达露台拱门下举办的免费公共米隆加。请穿舒适平滑鞋底。'
  },
  'Historic 14th Street Spanish ballroom milonga with traditional orchestra tandas and tapas.': {
    en: 'Historic 14th Street Spanish ballroom milonga with traditional orchestra tandas and tapas.',
    es: 'Milonga histórica en el salón de baile español de 14th Street con tandas de orquesta tradicional y tapas.',
    ko: '전통 오케스트라 딴따와 타파스가 함께하는 역사적인 14번가 스페인 볼룸 밀롱가.',
    ja: '伝統的なオーケストラタンダとタパスが楽しめる、歴史ある14丁目スパニッシュ・ボールルーム・ミロンガ。',
    zh: '历史悠久的第14街西班牙舞厅米隆加，伴随传统乐团 tandas 和塔帕斯小吃。'
  },
  'Spacious sprung hardwood floor with superb acoustics in the heart of the Mission.': {
    en: 'Spacious sprung hardwood floor with superb acoustics in the heart of the Mission.',
    es: 'Amplia pista de madera suspendida con excelente acústica en el corazón de Mission.',
    ko: '미션 지구 중심부에 위치한 뛰어난 음향과 넓은 스프링 원목 마룻바닥.',
    ja: 'ミッション地区の中心にある、優れた音響と広々としたスプリング付きハードウッド・フロア。',
    zh: '位于米申区中心，拥有顶级声效和宽敞弹簧实木地板。'
  },
  'Warm East Bay community gathering with tea, homemade pastries, and close embrace tandas.': {
    en: 'Warm East Bay community gathering with tea, homemade pastries, and close embrace tandas.',
    es: 'Cálido encuentro de la comunidad de East Bay con té, pasteles caseros y tandas en abrazo cerrado.',
    ko: '따뜻한 이스트베이 커뮤니티 모임, 차, 수제 페이스트리, 클로즈 엠브레이스 딴따.',
    ja: 'お茶、手作りペストリー、クローズ・エンブレイスのタンダが揃う温かいイーストベイのコミュニティ集会。',
    zh: '温馨的东湾社群聚会，备有茶点、手工糕点与密抱 tandas。'
  },
  'Cozy autumn milonga with warm ambient lighting and curated Golden Era tandas.': {
    en: 'Cozy autumn milonga with warm ambient lighting and curated Golden Era tandas.',
    es: 'Acogedora milonga de otoño con iluminación cálida y tandas seleccionadas de la Época de Oro.',
    ko: '따뜻한 조명과 엄선된 황금기 딴따가 어우러진 아늑한 가을 밀롱가.',
    ja: '温かみのある間接照明と厳選された黄金期タンダが流れる心地よい秋のミロンガ。',
    zh: '温馨秋季米隆加，配有暖光氛围与精选黄金时代 tandas。'
  },
  'Little Havana vibrant holiday milonga with live tropical tango ensemble.': {
    en: 'Little Havana vibrant holiday milonga with live tropical tango ensemble.',
    es: 'Vibrante milonga navideña en Little Havana con conjunto de tango tropical en vivo.',
    ko: '라이브 트로피컬 탱고 앙상블과 함께하는 리틀 아바나의 활기찬 홀리데이 밀롱가.',
    ja: 'ライブ・トロピカル・タンゴ・アンサンブルが出演する、リトル・ハバナの活気あるホリデー・ミロンガ。',
    zh: '小哈瓦那充满活力的节日米隆加，特邀现场热带探戈乐团演奏。'
  },
  'Official festival passes with master workshops and grand milongas.': {
    en: 'Official festival passes with master workshops and grand milongas.',
    es: 'Pases oficiales del festival con talleres magistrales y grandes milongas.',
    ko: '마스터 워크샵과 그랜드 밀롱가가 포함된 공식 페스티벌 패스.',
    ja: 'マスターワークショップとグランドミロンガを含む公式フェスティバルパス。',
    zh: '包含大师工作坊与盛大米隆加的官方探戈节通票。'
  },
  '20th Anniversary milestone edition. 4 days of grand evening milongas with live tango orchestra, world-class maestros, and buena onda spirit.': {
    en: '20th Anniversary milestone edition. 4 days of grand evening milongas with live tango orchestra, world-class maestros, and buena onda spirit.',
    es: 'Edición hito del 20º aniversario. 4 días de grandes milongas nocturnas con orquesta de tango en vivo, maestros de clase mundial y espíritu de buena onda.',
    ko: '20주년 기념 에디션. 라이브 오케스트라, 세계적 마에스트로, 부에나 온다 정신과 함께하는 4일간의 그랜드 밀롱가.',
    ja: '20周年記念エディション。生演奏のタンゴオーケストラ、世界最高峰のマエストロ、心地よい雰囲気とともに贈る4日間のグランドミロンガ。',
    zh: '20周年里程碑版。为期4天的盛大晚间米隆加，伴有现场探戈乐团、世界级大师与热情氛围。'
  },
  'Role-balanced autumn marathon for 250 international dancers in historic theatrical hall with supreme acoustics.': {
    en: 'Role-balanced autumn marathon for 250 international dancers in historic theatrical hall with supreme acoustics.',
    es: 'Maratón de otoño con balance de roles para 250 bailarines internacionales en una sala teatral histórica con acústica suprema.',
    ko: '최고의 음향을 자랑하는 유서 깊은 극장 홀에서 250명의 글로벌 댄서를 위해 열리는 롤 밸런스 가을 마라톤.',
    ja: '最高の音響を誇る歴史ある劇場ホールで、250名の国際ダンサーを迎えるロールバランス秋マラソン。',
    zh: '在音效极佳的历史剧场中，为250名国际舞者举办的角色平衡秋季马拉松。'
  },
  '10th season opening monthly milonga. Traditional tandas with cortinas, friendly embrace, and complimentary refreshments.': {
    en: '10th season opening monthly milonga. Traditional tandas with cortinas, friendly embrace, and complimentary refreshments.',
    es: 'Milonga mensual de apertura de la 10ª temporada. Tandas tradicionales con cortinas, abrazo amistoso y refrigerios de cortesía.',
    ko: '10번째 시즌 오프닝 월간 밀롱가. 꼬르띠나가 있는 전통 딴따, 다정한 포옹, 무료 다과 제공.',
    ja: '第10シーズン開幕の月例ミロンガ。コルティーナ付きの伝統的なタンダ、心地よいアブラソ、無料の軽食をご用意。',
    zh: '第10季开幕月度米隆加。带有 cortinas 的传统 tandas、温暖拥抱及免费茶歇。'
  },
  'Autumn gala weekend featuring live concert, guest maestro masterclasses, and three evening social milongas.': {
    en: 'Autumn gala weekend featuring live concert, guest maestro masterclasses, and three evening social milongas.',
    es: 'Fin de semana de gala de otoño con concierto en vivo, clases magistrales de maestros invitados y tres milongas sociales nocturnas.',
    ko: '라이브 콘서트, 초청 마에스트로 마스터클래스, 3회의 저녁 소셜 밀롱가가 열리는 가을 갈라 위크엔드.',
    ja: '生演奏コンサート、招聘マエストロのマスタークラス、3夜のソーシャルミロンガが楽しめる秋のガラ・ウィークエンド。',
    zh: '秋季盛典周末，包含现场音乐会、特邀大师大师班及三晚社交米隆加。'
  },
  'Sunday evening cozy social milonga with eclectic traditional selection, warm welcoming ambiance, and great acoustics.': {
    en: 'Sunday evening cozy social milonga with eclectic traditional selection, warm welcoming ambiance, and great acoustics.',
    es: 'Acogedora milonga social de domingo por la tarde con ecléctica selección tradicional, cálido ambiente de bienvenida y gran acústica.',
    ko: '엄선된 전통 음악, 따뜻한 환영 분위기, 뛰어난 음향이 어우러진 일요일 저녁의 아늑한 소셜 밀롱가.',
    ja: '厳選された伝統的選曲、温かい歓迎の雰囲気、優れた音響が魅力の日曜夜の心地よいソーシャルミロンガ。',
    zh: '周日傍晚温馨社交米隆加，伴有精选传统乐曲、温暖迎客氛围与极佳音效。'
  },
  'Atmospheric loft milonga with antique candelabras, vintage vinyl DJ, and courtyard lounge.': {
    en: 'Atmospheric loft milonga with antique candelabras, vintage vinyl DJ, and courtyard lounge.',
    es: 'Milonga atmosférica en un loft con candelabros antiguos, DJ de vinilo vintage y salón en el patio.',
    ko: '엔틱 촛대, 빈티지 바이닐 DJ, 안뜰 라운지가 어우러진 분위기 있는 로프트 밀롱가.',
    ja: 'アンティーク燭台、ビンテージ・アナログDJ、中庭ラウンジが魅力の雰囲気あるロフト・ミロンガ。',
    zh: '带有古董烛台、复古黑胶DJ和庭院休息室的极具氛围感的阁楼米隆加。'
  },
  'Art Deco grand hall milonga with wood sprung dance floor and traditional cortinas.': {
    en: 'Art Deco grand hall milonga with wood sprung dance floor and traditional cortinas.',
    es: 'Milonga en gran salón Art Déco con pista de madera suspendida y cortinas tradicionales.',
    ko: '스프링 목재 댄스 플로어와 전통 꼬르띠나가 있는 아르데코 대형 홀 밀롱가.',
    ja: 'スプリング入り木製ダンスフロアと伝統的なコルティーナを備えたアールデコ調大ホールのミロンガ。',
    zh: '拥有弹性木质舞池和传统 cortinas 的装饰艺术风盛大舞厅米隆加。'
  },

  // Spanish notes
  'Milonga mítica en el adoquín histórico de San Telmo al atardecer.': {
    en: 'Mythical sunset milonga on the historic cobblestones of San Telmo.',
    es: 'Milonga mítica en el adoquín histórico de San Telmo al atardecer.',
    ko: '산텔모의 유서 깊은 조약돌 거리에서 해질녘 열리는 전설적인 밀롱가.',
    ja: 'サン・テルモの歴史ある石畳で夕暮れ時に開催される伝説のミロンガ。',
    zh: '日落时分在圣特尔莫历史悠久的鹅卵石路面举办的传奇米隆加。'
  },
  'Típica milonga porteña con orquesta en vivo, empanadas y fernet hasta las 4 AM.': {
    en: 'Typical Buenos Aires milonga with live orchestra, empanadas, and fernet until 4 AM.',
    es: 'Típica milonga porteña con orquesta en vivo, empanadas y fernet hasta las 4 AM.',
    ko: '라이브 오케스트라, 엠파나다, 페르네와 함께 새벽 4시까지 이어지는 정통 부에노스아이레스 밀롱가.',
    ja: '生演奏オーケストラ、エンパナーダ、フェルネットとともに午前4時まで続く本格ブエノスアイレス・ミロンガ。',
    zh: '正宗布宜诺斯艾利斯米隆加，伴随现场乐团、馅饼与费奈特酒持续至凌晨4点。'
  }
};

const MONTH_NAMES: Record<number, { en: string; es: string; ja: string; zh: string }> = {
  1: { en: 'Jan', es: 'Ene', ja: '1月', zh: '1月' },
  2: { en: 'Feb', es: 'Feb', ja: '2月', zh: '2月' },
  3: { en: 'Mar', es: 'Mar', ja: '3月', zh: '3月' },
  4: { en: 'Apr', es: 'Abr', ja: '4月', zh: '4月' },
  5: { en: 'May', es: 'May', ja: '5月', zh: '5月' },
  6: { en: 'Jun', es: 'Jun', ja: '6月', zh: '6月' },
  7: { en: 'Jul', es: 'Jul', ja: '7月', zh: '7月' },
  8: { en: 'Aug', es: 'Ago', ja: '8月', zh: '8月' },
  9: { en: 'Sep', es: 'Sep', ja: '9月', zh: '9月' },
  10: { en: 'Oct', es: 'Oct', ja: '10月', zh: '10月' },
  11: { en: 'Nov', es: 'Nov', ja: '11月', zh: '11月' },
  12: { en: 'Dec', es: 'Dic', ja: '12月', zh: '12月' }
};

const DOW_NAMES: Record<string, { en: string; es: string; ja: string; zh: string }> = {
  '월': { en: 'Mon', es: 'Lun', ja: '月', zh: '周一' },
  '화': { en: 'Tue', es: 'Mar', ja: '火', zh: '周二' },
  '수': { en: 'Wed', es: 'Mié', ja: '水', zh: '周三' },
  '목': { en: 'Thu', es: 'Jue', ja: '木', zh: '周四' },
  '금': { en: 'Fri', es: 'Vie', ja: '金', zh: '周五' },
  '토': { en: 'Sat', es: 'Sáb', ja: '土', zh: '周六' },
  '일': { en: 'Sun', es: 'Dom', ja: '日', zh: '周日' }
};

/**
 * Translates Korean date and time representations within text fragments.
 */
function translateDateTimeInText(text: string, lang: SupportedLanguage): string {
  if (lang === 'ko') return text;

  let result = text;

  // Pattern: 9월 12일 토요일
  result = result.replace(/(\d{1,2})월\s*(\d{1,2})일\s*([월화수목금토일])요일/g, (_, m, d, dow) => {
    const monthNum = parseInt(m, 10);
    const mInfo = MONTH_NAMES[monthNum];
    const dowInfo = DOW_NAMES[dow];
    if (!mInfo || !dowInfo) return `${m}/${d}`;

    if (lang === 'en') return `${mInfo.en} ${d} (${dowInfo.en})`;
    if (lang === 'es') return `${d} de ${mInfo.es} (${dowInfo.es})`;
    if (lang === 'ja') return `${m}月${d}日 (${dowInfo.ja})`;
    if (lang === 'zh') return `${m}月${d}日 (${dowInfo.zh})`;
    return `${m}/${d}`;
  });

  // Pattern: 11월 6일(금)~8일(일) or 11월 6일 (금) ~ 8일 (일)
  result = result.replace(/(\d{1,2})월\s*(\d{1,2})일\s*\(([월화수목금토일])\)\s*[~-]\s*(\d{1,2})일\s*\(([월화수목금토일])\)/g, (_, m, d1, dow1, d2, dow2) => {
    const monthNum = parseInt(m, 10);
    const mInfo = MONTH_NAMES[monthNum];
    const dowInfo1 = DOW_NAMES[dow1];
    const dowInfo2 = DOW_NAMES[dow2];
    if (!mInfo || !dowInfo1 || !dowInfo2) return `${m}/${d1}~${d2}`;

    if (lang === 'en') return `${mInfo.en} ${d1} (${dowInfo1.en}) ~ ${d2} (${dowInfo2.en})`;
    if (lang === 'es') return `${d1} (${dowInfo1.es}) ~ ${d2} (${dowInfo2.es}) de ${mInfo.es}`;
    if (lang === 'ja') return `${m}月${d1}日(${dowInfo1.ja})〜${d2}日(${dowInfo2.ja})`;
    if (lang === 'zh') return `${m}月${d1}日(${dowInfo1.zh})~${d2}日(${dowInfo2.zh})`;
    return `${m}/${d1}~${d2}`;
  });

  // Pattern: 9월 12일 (토) or 9월 12일(토)
  result = result.replace(/(\d{1,2})월\s*(\d{1,2})일\s*\(([월화수목금토일])\)/g, (_, m, d, dow) => {
    const monthNum = parseInt(m, 10);
    const mInfo = MONTH_NAMES[monthNum];
    const dowInfo = DOW_NAMES[dow];
    if (!mInfo || !dowInfo) return `${m}/${d}`;

    if (lang === 'en') return `${mInfo.en} ${d} (${dowInfo.en})`;
    if (lang === 'es') return `${d} de ${mInfo.es} (${dowInfo.es})`;
    if (lang === 'ja') return `${m}月${d}日 (${dowInfo.ja})`;
    if (lang === 'zh') return `${m}月${d}日 (${dowInfo.zh})`;
    return `${m}/${d}`;
  });

  // Pattern: 9월 12일
  result = result.replace(/(\d{1,2})월\s*(\d{1,2})일/g, (_, m, d) => {
    const monthNum = parseInt(m, 10);
    const mInfo = MONTH_NAMES[monthNum];
    if (!mInfo) return `${m}/${d}`;

    if (lang === 'en') return `${mInfo.en} ${d}`;
    if (lang === 'es') return `${d} de ${mInfo.es}`;
    if (lang === 'ja') return `${m}月${d}日`;
    if (lang === 'zh') return `${m}月${d}日`;
    return `${m}/${d}`;
  });

  // Times: 오후 7시~10시
  result = result.replace(/오후\s*(\d{1,2})시\s*[~-]\s*(\d{1,2})시/g, (_, h1, h2) => {
    if (lang === 'ja') return `午後${h1}時〜${h2}時`;
    if (lang === 'zh') return `下午${h1}点~${h2}点`;
    return `${h1}:00 PM ~ ${h2}:00 PM`;
  });

  // Times: 오후 7:30 / 오전 11:30
  result = result.replace(/오후\s*(\d{1,2}):(\d{2})/g, (_, h, min) => {
    if (lang === 'ja') return `午後${h}:${min}`;
    if (lang === 'zh') return `下午${h}:${min}`;
    return `${h}:${min} PM`;
  });
  result = result.replace(/오전\s*(\d{1,2}):(\d{2})/g, (_, h, min) => {
    if (lang === 'ja') return `午前${h}:${min}`;
    if (lang === 'zh') return `上午${h}:${min}`;
    return `${h}:${min} AM`;
  });

  // Times: 오후 7시 / 오전 11시
  result = result.replace(/오후\s*(\d{1,2})시/g, (_, h) => {
    if (lang === 'ja') return `午後${h}時`;
    if (lang === 'zh') return `下午${h}点`;
    return `${h}:00 PM`;
  });
  result = result.replace(/오전\s*(\d{1,2})시/g, (_, h) => {
    if (lang === 'ja') return `午前${h}時`;
    if (lang === 'zh') return `上午${h}点`;
    return `${h}:00 AM`;
  });

  return result;
}

/**
 * Translates remaining common phrases in text.
 */
function translatePhrasesInText(text: string, lang: SupportedLanguage): string {
  if (lang === 'ko') return text;

  let s = text;

  const phraseMaps: Array<{ ko: string | RegExp; en: string; es: string; ja: string; zh: string }> = [
    {
      ko: /스페셜 버밍엄 밀롱가/g,
      en: 'Special Birmingham Milonga',
      es: 'Milonga especial de Birmingham',
      ja: 'スペシャル・バーミンガム・ミロンガ',
      zh: '特别伯明翰米隆加'
    },
    {
      ko: /초청 게스트 DJ\s*(.+?)\s*세션/g,
      en: 'Guest DJ $1 session',
      es: 'Sesión con DJ invitado $1',
      ja: 'ゲストDJ $1 セッション',
      zh: '特邀嘉宾 DJ $1 专场'
    },
    {
      ko: /\(게스트 DJ\s*([^)]+)\)/g,
      en: '(Guest DJ $1)',
      es: '(DJ invitado $1)',
      ja: '(ゲストDJ $1)',
      zh: '(特邀DJ $1)'
    },
    {
      ko: /마에스트로\s*(.+?)\s*초청 마스터클래스 워크샵 및 소셜/g,
      en: 'Maestro $1 Masterclass Workshop & Social',
      es: 'Clase magistral con Maestro $1 y social',
      ja: 'マエストロ $1 招待マスタークラス・ワークショップ＆ソーシャル',
      zh: '特邀大师 $1 大师班工作坊及舞会'
    },
    {
      ko: /Pre-Milonga Workshop과 정통 밀롱가 소셜 세션/g,
      en: 'Pre-Milonga Workshop and traditional milonga social session',
      es: 'Taller previo a la milonga y sesión social tradicional',
      ja: 'プレ・ミロンガ ワークショップと本格ミロンガ ソーシャルセッション',
      zh: '米隆加前工作坊与传统米隆加社交舞会'
    },
    {
      ko: /The Tango Lounge 50\/50 정기 밀롱가/g,
      en: 'The Tango Lounge 50/50 regular milonga',
      es: 'Milonga regular The Tango Lounge 50/50',
      ja: 'The Tango Lounge 50/50 定例ミロンガ',
      zh: 'The Tango Lounge 50/50 定期米隆加'
    },
    {
      ko: /3일간 진행되는 ATS 1주년 기념 인터내셔널 탱고 위크엔드/g,
      en: '3-day ATS 1st Anniversary International Tango Weekend',
      es: 'Fin de semana internacional de tango por el 1.er aniversario de ATS (3 días)',
      ja: '3日間にわたり開催される ATS 1周年記念インターナショナル・タンゴ・ウィークエンド',
      zh: '为期3天的 ATS 1周年纪念国际探戈周末'
    },
    {
      ko: /허드슨 리버 파크 Pier 45 라이브 뮤직\(가수\s*([^)]+)\)\s*&\s*DJ 야외 무료 밀롱가/g,
      en: 'Hudson River Park Pier 45 Live Music (Singer $1) & DJ Outdoor Free Milonga',
      es: 'Hudson River Park Pier 45 Música en vivo (Cantante $1) y milonga gratuita al aire libre con DJ',
      ja: 'ハドソンリバー・パーク Pier 45 ライブ音楽 (歌手 $1) & DJ 屋外無料ミロンガ',
      zh: '哈德逊河公园 Pier 45 现场音乐 (歌手 $1) 与 DJ 户外免费米隆加'
    },
    {
      ko: /허드슨 리버 파크 Pier 45 라이브 뮤직\(가수\s*([^)]+)\)\s*&\s*DJ 야외 밀롱가/g,
      en: 'Hudson River Park Pier 45 Live Music (Singer $1) & DJ Outdoor Milonga',
      es: 'Hudson River Park Pier 45 Música en vivo (Cantante $1) y milonga al aire libre con DJ',
      ja: 'ハドソンリバー・パーク Pier 45 ライブ音楽 (歌手 $1) & DJ 屋外ミロンガ',
      zh: '哈德逊河公园 Pier 45 现场音乐 (歌手 $1) 与 DJ 户外米隆加'
    },
    {
      ko: /25주년 기념 쇼케이스\((.+?)\) 및 올나잇 밀롱가/g,
      en: '25th Anniversary Showcase ($1) & All-Night Milonga',
      es: 'Showcase del 25 aniversario ($1) y milonga toda la noche',
      ja: '25周年記念ショーケース($1) およびオールナイト・ミロンガ',
      zh: '25周年纪念演出($1) 及通宵米隆加'
    },
    {
      ko: /The Hungarian House 스타리 나이트 탱고 제4회 뉴욕 에디션/g,
      en: 'The Hungarian House Starry Night Tango 4th NYC Edition',
      es: 'The Hungarian House Starry Night Tango 4ª edición de NYC',
      ja: 'The Hungarian House スターリー・ナイト・タンゴ 第4回ニューヨーク・エディション',
      zh: 'The Hungarian House 星光之夜探戈 第4届纽约版'
    },
    {
      ko: /Rocio & Luciano Capparelli 마스터클래스 워크샵 및 초급 클래스/g,
      en: 'Rocio & Luciano Capparelli Masterclass Workshop and Beginner Class',
      es: 'Taller magistral y clase para principiantes con Rocío y Luciano Capparelli',
      ja: 'Rocio & Luciano Capparelli マスタークラス・ワークショップおよび初級クラス',
      zh: 'Rocio & Luciano Capparelli 大师班工作坊及初级课程'
    },
    {
      ko: /정기 세션/g,
      en: 'regular session',
      es: 'sesión regular',
      ja: '定例セッション',
      zh: '定期专场'
    },
    {
      ko: /초청 Tango Bliss 주말 워크샵/g,
      en: 'guest Tango Bliss weekend workshop',
      es: 'taller de fin de semana Tango Bliss invitado',
      ja: '招待 Tango Bliss 週末ワークショップ',
      zh: '特邀 Tango Bliss 周末工作坊'
    },
    {
      ko: /정통 Milonga Poema 소셜 나이트 \(Rocio & Luciano Capparelli 초청\)/g,
      en: 'Authentic Milonga Poema social night (Featuring Rocio & Luciano Capparelli)',
      es: 'Noche social de Milonga Poema auténtica (Invitados Rocío y Luciano Capparelli)',
      ja: '本格 Milonga Poema ソーシャルナイト (Rocio & Luciano Capparelli 招待)',
      zh: '正统 Milonga Poema 社交之夜 (特邀 Rocio & Luciano Capparelli)'
    },
    {
      ko: /몬트리올 탱고 페스티벌 제20회 에디션/g,
      en: 'Montreal Tango Festival 20th Edition',
      es: 'Festival de Tango de Montreal 20ª edición',
      ja: 'モントリオール・タンゴ・フェスティバル第20回',
      zh: '蒙特利尔探戈节第20届'
    },
    {
      ko: /2026 몬트리올 인터내셔널 탱고 페스티벌/g,
      en: '2026 Montreal International Tango Festival',
      es: 'Festival Internacional de Tango de Montreal 2026',
      ja: '2026 モントリオール・インターナショナル・タンゴ・フェスティバル',
      zh: '2026 蒙特利尔国际探戈节'
    },
    {
      ko: /\(회원 무료\)/g,
      en: '(Free for members)',
      es: '(Gratis para miembros)',
      ja: '(会員無料)',
      zh: '(会员免费)'
    },
    {
      ko: /\(현재 진행 중\)/g,
      en: '(Currently in progress)',
      es: '(Actualmente en curso)',
      ja: '(現在開催中)',
      zh: '(正在进行中)'
    },
    {
      ko: /로즈웰/g,
      en: 'Roswell',
      es: 'Roswell',
      ja: 'ロズウェル',
      zh: '罗斯韦尔'
    },
    {
      ko: /티켓 옵션/g,
      en: 'Ticket options',
      es: 'Opciones de entrada',
      ja: 'チケットオプション',
      zh: '门票选项'
    },
    {
      ko: /패스 옵션/g,
      en: 'Pass options',
      es: 'Opciones de pase',
      ja: 'パスオプション',
      zh: '通票选项'
    },
    {
      ko: /중 최고가:/g,
      en: 'Max price:',
      es: 'Precio máx.:',
      ja: '最高価格:',
      zh: '最高价格:'
    },
    {
      ko: /최고가 옵션:/g,
      en: 'Max price option:',
      es: 'Opción de precio máx.:',
      ja: '最高価格オプション:',
      zh: '最高价格选项:'
    },
    {
      ko: /풀패스 최고가/g,
      en: 'Full pass max price',
      es: 'Precio máx. pase completo',
      ja: 'フルパス最高価格',
      zh: '全通票最高价格'
    },
    {
      ko: /풀 워크샵 패스 최고가:/g,
      en: 'Full workshop pass max price:',
      es: 'Precio máx. pase de taller completo:',
      ja: 'フルワークショップパス最高価格:',
      zh: '全工作坊通票最高价格:'
    },
    {
      ko: /마라톤 패스 최고가:/g,
      en: 'Marathon pass max price:',
      es: 'Precio máx. pase de maratón:',
      ja: 'マラソンパス最高価格:',
      zh: '马拉松通票最高价格:'
    },
    {
      ko: /개별 밀롱가/g,
      en: 'Individual milonga',
      es: 'Milonga individual',
      ja: '個別ミロンガ',
      zh: '单场米隆加'
    },
    {
      ko: /단일 밀롱가/g,
      en: 'Single milonga',
      es: 'Milonga individual',
      ja: '単一ミロンガ',
      zh: '单场米隆加'
    },
    {
      ko: /지정석 & 사전예약/g,
      en: 'Reserved seat & Pre-booking',
      es: 'Asiento reservado y preventa',
      ja: '指定席＆事前予約',
      zh: '指定座席与预订'
    },
    {
      ko: /사전예약 갈라 테이블/g,
      en: 'Pre-booked Gala Table',
      es: 'Mesa de gala con preventa',
      ja: '事前予約ガラテーブル',
      zh: '预订盛宴桌'
    },
    {
      ko: /갈라 테이블/g,
      en: 'Gala Table',
      es: 'Mesa de gala',
      ja: 'ガラテーブル',
      zh: '盛宴桌'
    },
    {
      ko: /사전예약/g,
      en: 'Pre-booking',
      es: 'Preventa',
      ja: '事前予約',
      zh: '提前预订'
    },
    {
      ko: /일반/g,
      en: 'General',
      es: 'General',
      ja: '一般',
      zh: '普通'
    },
    {
      ko: /현장/g,
      en: 'At the door',
      es: 'En puerta',
      ja: '当日',
      zh: '现场'
    },
    {
      ko: /본 행사/g,
      en: 'Main Event',
      es: 'Evento principal',
      ja: '本イベント',
      zh: '主活动'
    },
    {
      ko: /축제 전야 프리 페스티벌 웰컴 밀롱가/g,
      en: 'Pre-Festival Eve Welcome Milonga',
      es: 'Milonga de bienvenida previa al festival',
      ja: '前夜祭プレ・フェスティバル・ウェルカムミロンガ',
      zh: '节前欢迎米隆加'
    },
    {
      ko: /페스티벌 패스 별도 입장/g,
      en: 'Separate admission from festival pass',
      es: 'Entrada separada del pase de festival',
      ja: 'フェスティバルパスとは別入場',
      zh: '探戈节通票单独入场'
    },
    {
      ko: /페스티벌 공식 페어웰 탱고버 밀롱가/g,
      en: 'Official Festival Farewell Tangover Milonga',
      es: 'Milonga de despedida Tangover oficial del festival',
      ja: 'フェスティバル公式フェアウェル・タンゴバーミロンガ',
      zh: '探戈节官方告别 Tangover 米隆加'
    },
    {
      ko: /장소:/g,
      en: 'Venue:',
      es: 'Lugar:',
      ja: '会場:',
      zh: '地点:'
    },
    {
      ko: /볼룸/g,
      en: 'Ballroom',
      es: 'Salón de baile',
      ja: 'ボールルーム',
      zh: '舞厅'
    },
    {
      ko: /뉴올리언스 최초/g,
      en: 'First time in New Orleans',
      es: 'Por primera vez en Nueva Orleans',
      ja: 'ニューオーリンズ初',
      zh: '新奥尔良首度'
    },
    {
      ko: /마스터 워크샵/g,
      en: 'Master Workshop',
      es: 'Taller magistral',
      ja: 'マスターワークショップ',
      zh: '大师工作坊'
    },
    {
      ko: /마라톤 가을 에디션/g,
      en: 'Marathon Autumn Edition',
      es: 'Edición de otoño del maratón',
      ja: 'マラソン秋エディション',
      zh: '马拉松秋季版'
    },
    {
      ko: /가을 인터내셔널 탱고 페스티벌/g,
      en: 'Autumn International Tango Festival',
      es: 'Festival Internacional de Tango de Otoño',
      ja: '秋の国際タンゴフェスティバル',
      zh: '秋季国际探戈节'
    },
    {
      ko: /가을 인터내셔널 탱고 마라톤/g,
      en: 'Autumn International Tango Marathon',
      es: 'Maratón Internacional de Tango de Otoño',
      ja: '秋の国際タンゴマラソン',
      zh: '秋季国际探戈马拉松'
    },
    {
      ko: /뉴욕 가을 탱고 페스티벌/g,
      en: 'New York Autumn Tango Festival',
      es: 'Festival de Tango de Otoño de Nueva York',
      ja: 'ニューヨーク秋のタンゴフェスティバル',
      zh: '纽约秋季探戈节'
    },
    {
      ko: /토요 정기 갈라 밀롱가/g,
      en: 'Saturday Regular Gala Milonga',
      es: 'Milonga de gala regular del sábado',
      ja: '土曜定例ガラミロンガ',
      zh: '周六定期盛宴米隆加'
    },
    {
      ko: /헝가리안 하우스 가을 스타리 나이트 갈라 밀롱가/g,
      en: 'Hungarian House Autumn Starry Night Gala Milonga',
      es: 'Milonga de gala Starry Night de otoño en Hungarian House',
      ja: 'ハンガリアンハウス 秋のスターリー・ナイト・ガラミロンガ',
      zh: '匈牙利之家秋季星光之夜盛宴米隆加'
    },
    {
      ko: /아르헨티나 마에스트로 초청 테크닉 마스터클래스/g,
      en: 'Argentine Maestro Guest Technique Masterclass',
      es: 'Taller magistral de técnica con maestro argentino invitado',
      ja: 'アルゼンチン・マエストロ招待テクニック・マスタークラス',
      zh: '阿根廷大师特邀技巧大师班'
    },
    {
      ko: /전체 워크샵 패키지/g,
      en: 'Full Workshop Package',
      es: 'Paquete completo de talleres',
      ja: '全ワークショップパッケージ',
      zh: '完整工作坊套票'
    },
    {
      ko: /1세션/g,
      en: '1 Session',
      es: '1 sesión',
      ja: '1セッション',
      zh: '1课时'
    },
    {
      ko: /4일간의 워크샵, 애프터눈 및 이브닝 밀롱가/g,
      en: '4 days of workshops, afternoon and evening milongas',
      es: '4 días de talleres, milongas de tarde y noche',
      ja: '4日間のワークショップ、アフタヌーン＆イブニングミロンガ',
      zh: '为期4天的工作坊、午后及晚间米隆加'
    },
    {
      ko: /풀 마라톤 패스/g,
      en: 'Full Marathon Pass',
      es: 'Pase de maratón completo',
      ja: 'フルマラソンパス',
      zh: '全马拉松通票'
    },
    {
      ko: /마스터풀패스/g,
      en: 'Master Full Pass',
      es: 'Pase maestro completo',
      ja: 'マスターフルパス',
      zh: '大师全通票'
    },
    {
      ko: /VIP풀패스/g,
      en: 'VIP Full Pass',
      es: 'Pase VIP completo',
      ja: 'VIPフルパス',
      zh: 'VIP全通票'
    },
    {
      ko: /밀롱가패스/g,
      en: 'Milonga Pass',
      es: 'Pase de milonga',
      ja: 'ミロンガパス',
      zh: '米隆加通票'
    },
    {
      ko: /VIP테이블 & 패스/g,
      en: 'VIP Table & Pass',
      es: 'Mesa y pase VIP',
      ja: 'VIPテーブル＆パス',
      zh: 'VIP桌与通票'
    },
    {
      ko: /시작/g,
      en: 'starts',
      es: 'inicio',
      ja: '開始',
      zh: '开始'
    },
    {
      ko: /(\d{1,3}(?:,\d{3})+)\s*원/g,
      en: '$1 KRW',
      es: '$1 KRW',
      ja: '$1ウォン',
      zh: '$1韩元'
    }
  ];

  for (const m of phraseMaps) {
    if (typeof m.ko === 'string') {
      s = s.split(m.ko).join(m[lang]);
    } else {
      s = s.replace(m.ko, m[lang]);
    }
  }

  return s;
}

/**
 * Universal event notes translator.
 * Dynamically converts any event's sub-line detail notes into the target language.
 */
export function translateEventNotes(
  notes: string | undefined | null,
  lang: SupportedLanguage = 'en'
): string {
  if (!notes || typeof notes !== 'string') return '';
  const trimmed = notes.trim();
  if (!trimmed) return '';

  // 1. Direct dictionary lookup
  if (EXACT_NOTES[trimmed]) {
    return EXACT_NOTES[trimmed][lang] || trimmed;
  }

  // If text already has Korean and target is Korean, return as is
  if (lang === 'ko' && /[\uac00-\ud7a3]/.test(trimmed)) {
    return trimmed;
  }

  // 2. Pattern Matching for Facebook Community formats

  // Pattern A: 페이스북 그룹 {Group} (호스트: {Host}) 등록 행사. {Rest}
  const matchHost = trimmed.match(/^페이스북\s*그룹\s*(.+?)\s*\(호스트:\s*([^)]+)\)\s*(등록|공유)\s*행사\.?\s*(.*)$/i);
  if (matchHost) {
    const group = matchHost[1].trim();
    const host = matchHost[2].trim();
    const rest = translatePhrasesInText(translateDateTimeInText(matchHost[4].trim(), lang), lang);

    if (lang === 'en') {
      return `Facebook Group ${group} (Host: ${host}) registered event. ${rest}`.trim();
    }
    if (lang === 'es') {
      return `Evento registrado del grupo de Facebook ${group} (Anfitrión: ${host}). ${rest}`.trim();
    }
    if (lang === 'ja') {
      return `Facebookグループ ${group} (ホスト: ${host}) 登録イベント。${rest}`.trim();
    }
    if (lang === 'zh') {
      return `Facebook群组 ${group} (主办: ${host}) 登记活动。${rest}`.trim();
    }
  }

  // Pattern B: 페이스북 그룹 {Group} 관리자({Admin}) 공유 신규 이벤트. {Rest}
  const matchAdmin = trimmed.match(/^페이스북\s*그룹\s*(.+?)\s*관리자\(([^)]+)\)\s*공유\s*(?:신규\s*)?이벤트\.?\s*(.*)$/i);
  if (matchAdmin) {
    const group = matchAdmin[1].trim();
    const admin = matchAdmin[2].trim();
    const rest = translatePhrasesInText(translateDateTimeInText(matchAdmin[3].trim(), lang), lang);

    if (lang === 'en') {
      return `Facebook Group ${group} Admin (${admin}) shared event. ${rest}`.trim();
    }
    if (lang === 'es') {
      return `Evento compartido por el administrador de Facebook ${group} (${admin}). ${rest}`.trim();
    }
    if (lang === 'ja') {
      return `Facebookグループ ${group} 管理者(${admin}) 共有イベント。${rest}`.trim();
    }
    if (lang === 'zh') {
      return `Facebook群组 ${group} 管理员(${admin}) 分享活动。${rest}`.trim();
    }
  }

  // Pattern C: 페이스북 {Group} 그룹 (ID) 등록 행사. {Rest}
  const matchId = trimmed.match(/^페이스북\s*(.+?)\s*그룹\s*\(([0-9]+)\)\s*(등록|공유)\s*행사\.?\s*(.*)$/i);
  if (matchId) {
    const group = matchId[1].trim();
    const id = matchId[2].trim();
    const rest = translatePhrasesInText(translateDateTimeInText(matchId[4].trim(), lang), lang);

    if (lang === 'en') {
      return `Facebook ${group} Group (${id}) registered event. ${rest}`.trim();
    }
    if (lang === 'es') {
      return `Evento registrado del grupo de Facebook ${group} (${id}). ${rest}`.trim();
    }
    if (lang === 'ja') {
      return `Facebook ${group} グループ (${id}) 登録イベント。${rest}`.trim();
    }
    if (lang === 'zh') {
      return `Facebook ${group} 群组 (${id}) 登记活动。${rest}`.trim();
    }
  }

  // Pattern D: 페이스북 {Group} (그룹)? (등록|공유) 행사. {Rest}
  const matchStandard = trimmed.match(/^페이스북\s*(.+?)(?:\s*그룹)?\s*(등록|공유)\s*행사\.?\s*(.*)$/i);
  if (matchStandard) {
    const group = matchStandard[1].trim();
    const isShared = matchStandard[2] === '공유';
    const rest = translatePhrasesInText(translateDateTimeInText(matchStandard[3].trim(), lang), lang);

    if (lang === 'en') {
      return `Facebook ${group} Group ${isShared ? 'shared' : 'registered'} event. ${rest}`.trim();
    }
    if (lang === 'es') {
      return `Evento ${isShared ? 'compartido' : 'registrado'} del grupo de Facebook ${group}. ${rest}`.trim();
    }
    if (lang === 'ja') {
      return `Facebook ${group} グループ${isShared ? '共有' : '登録'}イベント。${rest}`.trim();
    }
    if (lang === 'zh') {
      return `Facebook ${group} 群组${isShared ? '分享' : '登记'}活动。${rest}`.trim();
    }
  }

  // Pattern E: [출처: 페이스북 공식 채널 {name} ({url}) | Upcoming Event 크롤링 승인 요청 | 행사일: {date}]
  const matchCrawl = trimmed.match(/^\[출처:\s*페이스북\s*공식\s*채널\s*(.+?)\s*\((.+?)\)\s*\|\s*Upcoming Event 크롤링 승인 요청\s*\|\s*행사일:\s*(.+?)\]$/i);
  if (matchCrawl) {
    const name = matchCrawl[1].trim();
    const url = matchCrawl[2].trim();
    const date = matchCrawl[3].trim();

    if (lang === 'en') {
      return `[Source: Official Facebook Channel ${name} (${url}) | Upcoming Event Crawl Approval | Event Date: ${date}]`;
    }
    if (lang === 'es') {
      return `[Fuente: Canal oficial de Facebook ${name} (${url}) | Aprobación de rastreo | Fecha del evento: ${date}]`;
    }
    if (lang === 'ja') {
      return `[情報元: 公式Facebookチャンネル ${name} (${url}) | 今後のイベント自動巡回承認申請 | 開催日: ${date}]`;
    }
    if (lang === 'zh') {
      return `[来源: Facebook官方频道 ${name} (${url}) | Upcoming Event 爬虫审批请求 | 活动日期: ${date}]`;
    }
  }

  // Pattern F: [등록 사이트({name}) 내용 추출 | 최고가 옵션: {price} | 일시: {datetime}]
  const matchExtract = trimmed.match(/^\[등록\s*사이트\((.+?)\)\s*내용\s*추출\s*\|\s*최고가\s*옵션:\s*(.+?)\s*\|\s*일시:\s*(.+?)\]$/i);
  if (matchExtract) {
    const name = matchExtract[1].trim();
    const price = matchExtract[2].trim();
    const datetime = translateDateTimeInText(matchExtract[3].trim(), lang);

    if (lang === 'en') {
      return `[Registered Site (${name}) Extracted | Max Price: ${price} | Date/Time: ${datetime}]`;
    }
    if (lang === 'es') {
      return `[Sitio registrado (${name}) Extraído | Precio máx.: ${price} | Fecha/Hora: ${datetime}]`;
    }
    if (lang === 'ja') {
      return `[登録サイト(${name}) 内容抽出 | 最高価格オプション: ${price} | 日時: ${datetime}]`;
    }
    if (lang === 'zh') {
      return `[登记站点 (${name}) 内容提取 | 最高价格项: ${price} | 日期时间: ${datetime}]`;
    }
  }

  // Pattern H: [공식 (웹사이트|블로그) 서브 사이트(...) 검색] {Content}
  const matchSubSite = trimmed.match(/^\[공식\s*(웹사이트|블로그)\s*서브\s*사이트\s*\(([^)]+)\)\s*검색\]\s*(.*)$/i);
  if (matchSubSite) {
    const isBlog = matchSubSite[1].includes('블로그');
    const path = matchSubSite[2].trim();
    const content = translatePhrasesInText(translateDateTimeInText(matchSubSite[3].trim(), lang), lang);

    if (lang === 'en') {
      return `[Official ${isBlog ? 'Blog' : 'Website'} Sub-site (${path}) Search] ${content}`;
    }
    if (lang === 'es') {
      return `[Búsqueda en subsitio de ${isBlog ? 'blog' : 'web'} oficial (${path})] ${content}`;
    }
    if (lang === 'ja') {
      return `[公式${isBlog ? 'ブログ' : 'ウェブサイト'}・サブサイト(${path})検索] ${content}`;
    }
    if (lang === 'zh') {
      return `[官方${isBlog ? '博客' : '网站'}子页面(${path})检索] ${content}`;
    }
  }

  // Pattern I: [사이트 내용 추출 | 최고가: ...] {Content}
  const matchSiteExtract = trimmed.match(/^\[사이트\s*내용\s*추출\s*\|\s*최고가:\s*([^\]]+)\]\s*(.*)$/i);
  if (matchSiteExtract) {
    const maxPrice = matchSiteExtract[1].trim();
    const rest = translatePhrasesInText(translateDateTimeInText(matchSiteExtract[2].trim(), lang), lang);

    if (lang === 'en') {
      return `[Site Content Extracted | Max Price: ${maxPrice}] ${rest}`;
    }
    if (lang === 'es') {
      return `[Contenido del sitio extraído | Precio máx.: ${maxPrice}] ${rest}`;
    }
    if (lang === 'ja') {
      return `[サイト内容抽出 | 最高価格: ${maxPrice}] ${rest}`;
    }
    if (lang === 'zh') {
      return `[站点内容提取 | 最高价格: ${maxPrice}] ${rest}`;
    }
  }

  // Pattern G: Excel batch upload
  const matchExcel = trimmed.match(/^Batch uploaded via Excel \((.+?)\) on (.+)$/i);
  if (matchExcel) {
    const fileName = matchExcel[1];
    const date = matchExcel[2];
    if (lang === 'ko') return `엑셀 일괄 업로드 등록 (${fileName}, ${date})`;
    if (lang === 'es') return `Carga por lotes desde Excel (${fileName}) el ${date}`;
    if (lang === 'ja') return `Excel一括アップロード (${fileName}) ${date}`;
    if (lang === 'zh') return `通过 Excel 批量上传 (${fileName}) 于 ${date}`;
    return trimmed;
  }

  // Fallback: apply general phrase and date/time translation
  const translated = translatePhrasesInText(translateDateTimeInText(trimmed, lang), lang);
  return translated;
}
