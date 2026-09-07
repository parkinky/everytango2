import { SupportedLanguage } from './types';

export interface TranslationDict {
  appName: string;
  tagline: string;
  subtagline: string;
  nav: {
    browseEvents: string;
    submitEvent: string;
    adminDashboard: string;
    crawler: string;
    signIn: string;
    signUp: string;
    signOut: string;
    profile: string;
    findId: string;
    findPw: string;
  };
  filter: {
    quickRange: string;
    allRange: string;
    oneMonth: string;
    threeMonths: string;
    sixMonths: string;
    customRange: string;
    startDate: string;
    endDate: string;
    eventType: string;
    allTypes: string;
    festival: string;
    marathon: string;
    encuentro: string;
    workshop: string;
    milonga: string;
    searchEvent: string;
    searchPlaceholder: string;
    country: string;
    allCountries: string;
    city: string;
    cityPlaceholder: string;
    state: string;
    statePlaceholder: string;
    price: string;
    allPrices: string;
    freeOnly: string;
    paidOnly: string;
    resetFilters: string;
    activeFiltersCount: string;
    resultsCount: string;
    exportExcel: string;
    downloadComplete: string;
    exportTooltip: string;
  };
  table: {
    dateDay: string;
    type: string;
    eventName: string;
    city: string;
    state: string;
    country: string;
    address: string;
    price: string;
    locationAndAddress: string;
    priceUsd: string;
    crawledDate: string;
    sortBy: string;
    sortByDate: string;
    sortByName: string;
    sortByCity: string;
    share: string;
    copied: string;
    viewOfficial: string;
    totalEventsCount: string;
    tableSingleScreenNote: string;
    exchangeRateNote: string;
    details: string;
    source: string;
    viewOriginal: string;
    noEventsFound: string;
    noEventsPrompt: string;
    status: string;
    actions: string;
    experiences: string;
    addStory: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    usernameOrEmail: string;
    password: string;
    loginBtn: string;
    googleSignIn: string;
    noAccount: string;
    hasAccount: string;
    registerTitle: string;
    registerSubtitle: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    country: string;
    state: string;
    phone: string;
    selectCountry: string;
    securityQuestionsTitle: string;
    securityQuestionsDesc: string;
    q1: string;
    q2: string;
    q3: string;
    answerPlaceholder: string;
    registerBtn: string;
    findIdTitle: string;
    findIdDesc: string;
    findIdBtn: string;
    foundIdMessage: string;
    findPwTitle: string;
    findPwDesc: string;
    randomQuestionNotice: string;
    tryAnotherQuestion: string;
    verifyAnswersBtn: string;
    resetPwTitle: string;
    newPassword: string;
    confirmPassword: string;
    saveNewPwBtn: string;
    forgotId: string;
    forgotPw: string;
    or: string;
  };
  submit: {
    title: string;
    subtitle: string;
    pendingNotice: string;
    nameLabel: string;
    typeLabel: string;
    startDate: string;
    endDate: string;
    country: string;
    city: string;
    state: string;
    address: string;
    price: string;
    priceHelp: string;
    sourceUrl: string;
    notes: string;
    submitBtn: string;
    submitting: string;
    successMessage: string;
    requireLogin: string;
  };
  admin: {
    title: string;
    subtitle: string;
    tabPending: string;
    tabApproved: string;
    tabRejected: string;
    approveBtn: string;
    rejectBtn: string;
    deleteBtn: string;
    crawlerTab: string;
    runCrawlerNow: string;
    crawlerStatus: string;
    crawledNotice: string;
    dedupStats: string;
  };
  facebook: {
    searchBtn: string;
    modalTitle: string;
    modalSubtitle: string;
    tabPopular: string;
    tabCustom: string;
    tabPaste: string;
    allRegions: string;
    koreaRegion: string;
    usaRegion: string;
    americasRegion: string;
    europeRegion: string;
    searchCommunityPlaceholder: string;
    scanScheduleBtn: string;
    scanning: string;
    members: string;
    customInputPlaceholder: string;
    customSearchBtn: string;
    customHint: string;
    pastePlaceholder: string;
    pasteExtractBtn: string;
    pasteHint: string;
    scannedEventsTitle: string;
    noEventsFound: string;
    addAllBtn: string;
    addEventBtn: string;
    alreadyInCalendar: string;
    newBadge: string;
    addSuccess: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationDict> = {
  en: {
    appName: "Everytango",
    tagline: "Global Argentine Tango Directory",
    subtagline: "Discover festivals, marathons, encuentros, and milongas worldwide. Verified and updated continuously.",
    nav: {
      browseEvents: "Browse Events",
      submitEvent: "Submit Event",
      adminDashboard: "Admin Dashboard",
      crawler: "Weekly Crawler",
      signIn: "Sign In",
      signUp: "Register",
      signOut: "Sign Out",
      profile: "Profile",
      findId: "Find ID",
      findPw: "Find Password",
    },
    filter: {
      quickRange: "Quick Range",
      allRange: "All Upcoming",
      oneMonth: "Next 1 Month",
      threeMonths: "Next 3 Months",
      sixMonths: "Next 6 Months",
      customRange: "Custom Range",
      startDate: "From",
      endDate: "To",
      eventType: "Event Type",
      allTypes: "All Types",
      festival: "Festival",
      marathon: "Marathon",
      encuentro: "Encuentro",
      workshop: "Workshop",
      milonga: "Milonga",
      searchEvent: "Event Name",
      searchPlaceholder: "e.g. Atlanta, Seoul, Buenos Aires...",
      country: "Country",
      allCountries: "All Countries",
      city: "City",
      cityPlaceholder: "Filter by city",
      state: "State / Prov",
      statePlaceholder: "Filter by state",
      price: "Price",
      allPrices: "All Prices",
      freeOnly: "Free Admission",
      paidOnly: "Paid Events",
      resetFilters: "Reset Filters",
      activeFiltersCount: "Filters Active",
      resultsCount: "events scheduled",
      exportExcel: "Export to Excel",
      downloadComplete: "Downloaded!",
      exportTooltip: "Download filtered events to Excel (.xlsx)",
    },
    table: {
      dateDay: "Date (Day)",
      type: "Type",
      eventName: "Event Name",
      city: "City",
      state: "State / Prov",
      country: "Country",
      address: "Address",
      price: "Price",
      locationAndAddress: "Location & Address",
      priceUsd: "Price",
      crawledDate: "Crawled Date",
      sortBy: "Sort:",
      sortByDate: "Date",
      sortByName: "Name",
      sortByCity: "City",
      share: "Share",
      copied: "Copied!",
      viewOfficial: "Visit official website",
      totalEventsCount: "events scheduled",
      tableSingleScreenNote: "All columns fitted without horizontal scrolling",
      exchangeRateNote: "Exchange ref: 1 USD ≈ ₩1,350 / €1 ≈ $1.08 USD",
      details: "Details",
      source: "Source",
      viewOriginal: "Official Link",
      noEventsFound: "No tango events found matching your filter criteria.",
      noEventsPrompt: "Try loosening your search filters or resetting date constraints.",
      status: "Status",
      actions: "Actions",
      experiences: "Stories & Photos",
      addStory: "Add Story",
    },
    auth: {
      loginTitle: "Welcome to Everytango",
      loginSubtitle: "Sign in with your account or Google",
      usernameOrEmail: "Username or Email",
      password: "Password",
      loginBtn: "Sign In",
      googleSignIn: "Continue with Google",
      noAccount: "Don't have an account yet?",
      hasAccount: "Already have an account?",
      registerTitle: "Create Everytango Account",
      registerSubtitle: "Join our global community and submit tango events",
      firstName: "First Name",
      lastName: "Last Name",
      username: "Username (ID)",
      email: "Email Address",
      country: "Country of Residence",
      state: "State / Province",
      phone: "Phone Number",
      selectCountry: "Select Country",
      securityQuestionsTitle: "Mandatory Security Questions (Account Recovery)",
      securityQuestionsDesc: "Select 3 unique questions and provide answers for password recovery.",
      q1: "Security Question #1",
      q2: "Security Question #2",
      q3: "Security Question #3",
      answerPlaceholder: "Your secret answer",
      registerBtn: "Create Account",
      findIdTitle: "Find Your Username (ID)",
      findIdDesc: "Enter the email and phone number you registered with.",
      findIdBtn: "Retrieve ID",
      foundIdMessage: "Your registered username is:",
      findPwTitle: "Recover Account Password",
      findPwDesc: "Enter your username or email to answer a randomly selected security question.",
      randomQuestionNotice: "1 question was randomly selected from your 3 security questions. Enter your registered answer.",
      tryAnotherQuestion: "Try another question",
      verifyAnswersBtn: "Verify Answer & Continue",
      resetPwTitle: "Reset Password",
      newPassword: "New Password",
      confirmPassword: "Confirm New Password",
      saveNewPwBtn: "Update Password",
      forgotId: "Forgot ID?",
      forgotPw: "Forgot Password?",
      or: "or",
    },
    submit: {
      title: "Submit a Tango Event",
      subtitle: "Share an upcoming festival, marathon, encuentro, or milonga with the world.",
      pendingNotice: "Submitted events are placed in PENDING status and reviewed by admins prior to public listing.",
      nameLabel: "Event Name *",
      typeLabel: "Event Type *",
      startDate: "Start Date *",
      endDate: "End Date *",
      country: "Country (ISO Alpha-2) *",
      city: "City *",
      state: "State / Province",
      address: "Street Address *",
      price: "Price / Admission Fee *",
      priceHelp: "e.g. $150, €90, ₩45,000, ¥3,500, or Free",
      sourceUrl: "Official Website or Registration URL (Optional)",
      notes: "Additional Details & Schedule Notes",
      submitBtn: "Submit Event for Approval",
      submitting: "Submitting...",
      successMessage: "Event successfully submitted! It is currently in PENDING review.",
      requireLogin: "Please sign in to submit a tango event.",
    },
    admin: {
      title: "Administrator Dashboard",
      subtitle: "Review community submissions, oversee database integrity, and run crawler routines.",
      tabPending: "Pending Approval",
      tabApproved: "Approved Events",
      tabRejected: "Rejected / Archived",
      approveBtn: "Approve to Public",
      rejectBtn: "Reject",
      deleteBtn: "Delete",
      crawlerTab: "Automated Crawler",
      runCrawlerNow: "Execute Weekly Crawler Now",
      crawlerStatus: "Crawler Job Status",
      crawledNotice: "The automated crawler periodically queries global dance feeds and public schedules up to +6 months ahead.",
      dedupStats: "Deduplication Engine: Scans dates, cities, and name similarity Levenshtein thresholds.",
    },
    facebook: {
      searchBtn: "Search Facebook Communities",
      modalTitle: "Facebook Tango Community Radar",
      modalSubtitle: "Search groups, scan upcoming milongas & festivals, or paste Facebook event announcements to add to your calendar.",
      tabPopular: "Featured Communities",
      tabCustom: "My Community Link",
      tabPaste: "Paste Post Text",
      allRegions: "All Regions",
      koreaRegion: "Korea",
      usaRegion: "USA",
      americasRegion: "Americas",
      europeRegion: "Europe",
      searchCommunityPlaceholder: "Search by group name, city (e.g. Seoul, Atlanta, NYC)...",
      scanScheduleBtn: "Scan Schedules",
      scanning: "Scanning...",
      members: "members",
      customInputPlaceholder: "Enter your Facebook Group or Event URL (e.g. facebook.com/groups/mytangoclub)...",
      customSearchBtn: "Search & Fetch Events",
      customHint: "Connects to your local or private Facebook tango community feed and auto-detects upcoming milongas.",
      pastePlaceholder: "Paste any Facebook event announcement, flyer, or group post text here...\ne.g. [Milonga Notice] Date: 2026-10-24, Venue: Club O Nada, Fee: ₩20,000...",
      pasteExtractBtn: "Auto-Extract Event Details",
      pasteHint: "Intelligently parses dates, venue, city, and ticket price from copied Facebook announcements.",
      scannedEventsTitle: "Discovered Community Schedules",
      noEventsFound: "No upcoming events found matching your criteria. Try scanning another community or paste post text.",
      addAllBtn: "Add All New to Calendar",
      addEventBtn: "Add to Calendar",
      alreadyInCalendar: "Already in Calendar",
      newBadge: "New Event",
      addSuccess: "Successfully added to EveryTango calendar and database!",
    },
  },
  ko: {
    appName: "Everytango",
    tagline: "글로벌 탱고 이벤트 데이터베이스",
    subtagline: "전 세계 페스티벌, 마라톤, 엥꾸엔뜨로, 밀롱가 일정을 한곳에서 직관적으로 조회하고 등록합니다.",
    nav: {
      browseEvents: "이벤트 목록 조회",
      submitEvent: "이벤트 등록 신청",
      adminDashboard: "관리자 대시보드",
      crawler: "주간 자동 크롤링",
      signIn: "로그인",
      signUp: "회원가입",
      signOut: "로그아웃",
      profile: "내 정보",
      findId: "아이디 찾기",
      findPw: "비밀번호 찾기",
    },
    filter: {
      quickRange: "조회 범위 퀵 필터",
      allRange: "전체 예정 일정",
      oneMonth: "오늘 ~ +1개월 (기본)",
      threeMonths: "오늘 ~ +3개월",
      sixMonths: "오늘 ~ +6개월",
      customRange: "달력 직접 선택",
      startDate: "시작일",
      endDate: "종료일",
      eventType: "이벤트 종류",
      allTypes: "전체 유형",
      festival: "페스티벌 (Festival)",
      marathon: "마라톤 (Marathon)",
      encuentro: "엥꾸엔뜨로 (Encuentro)",
      workshop: "워크샵 (Workshop)",
      milonga: "밀롱가 (Milonga)",
      searchEvent: "이벤트명 검색",
      searchPlaceholder: "이벤트명 검색 (자동완성)",
      country: "국가 코드",
      allCountries: "전체 국가",
      city: "도시",
      cityPlaceholder: "도시명 입력/선택",
      state: "주 / 도",
      statePlaceholder: "주/행정구역",
      price: "비용 구분",
      allPrices: "전체 가격대",
      freeOnly: "무료 입장 (Free)",
      paidOnly: "유료 이벤트",
      resetFilters: "필터 초기화",
      activeFiltersCount: "개 필터 적용 중",
      resultsCount: "개의 탱고 이벤트가 검색되었습니다.",
      exportExcel: "Excel 다운로드",
      downloadComplete: "다운로드 완료!",
      exportTooltip: "현재 조회된 이벤트를 엑셀 파일(.xlsx)로 다운로드",
    },
    table: {
      dateDay: "Date (Day) / 일정",
      type: "Type / 분류",
      eventName: "Event Name / 행사명",
      city: "City / 도시",
      state: "State / 주",
      country: "Country / 국가",
      address: "Address / 도로명 주소",
      price: "Price / 가격",
      locationAndAddress: "장소 / 주소",
      priceUsd: "PRICE",
      crawledDate: "검색된 일자",
      sortBy: "정렬 기준:",
      sortByDate: "날짜순",
      sortByName: "이름순",
      sortByCity: "도시순",
      share: "공유하기",
      copied: "복사됨!",
      viewOfficial: "공식 웹사이트 이동",
      totalEventsCount: "개 일정 조회됨",
      tableSingleScreenNote: "좌우 스크롤 없이 전체 열 확인 가능",
      exchangeRateNote: "환율 기준: 1 USD ≈ ₩1,350 / €1 ≈ $1.08 USD",
      details: "Details / 원본 링크",
      source: "수집 방식",
      viewOriginal: "공식 웹사이트",
      noEventsFound: "조건에 맞는 탱고 이벤트가 없습니다.",
      noEventsPrompt: "검색 필터나 날짜 범위를 조정해 보세요.",
      status: "상태",
      actions: "관리",
      experiences: "경험 & 사진",
      addStory: "후기 작성",
    },
    auth: {
      loginTitle: "Everytango 로그인",
      loginSubtitle: "계정 정보 또는 Google 계정으로 로그인하세요.",
      usernameOrEmail: "아이디 또는 이메일",
      password: "비밀번호",
      loginBtn: "로그인",
      googleSignIn: "Google 계정으로 계속하기",
      noAccount: "아직 회원이 아니신가요?",
      hasAccount: "이미 계정이 있으신가요?",
      registerTitle: "Everytango 회원가입",
      registerSubtitle: "전 세계 탱고 커뮤니티에 참여하고 이벤트를 직접 등록하세요.",
      firstName: "이름 (First Name)",
      lastName: "성 (Last Name)",
      username: "아이디 (ID)",
      email: "이메일 주소",
      country: "거주 국가",
      state: "주 / 도 (State)",
      phone: "전화번호",
      selectCountry: "국가 선택",
      securityQuestionsTitle: "필수 보안 질문 3종 (계정 복구용)",
      securityQuestionsDesc: "비밀번호 분실 시 본인 확인을 위해 서로 다른 질문 3개와 답변을 설정합니다.",
      q1: "보안 질문 1",
      q2: "보안 질문 2",
      q3: "보안 질문 3",
      answerPlaceholder: "비밀 답변 입력",
      registerBtn: "회원가입 완료",
      findIdTitle: "아이디 (ID) 찾기",
      findIdDesc: "가입 시 등록했던 이메일과 전화번호를 입력하세요.",
      findIdBtn: "아이디 조회",
      foundIdMessage: "회원님의 아이디는 다음과 같습니다:",
      findPwTitle: "비밀번호 찾기 및 재설정",
      findPwDesc: "아이디나 이메일을 입력한 후, 등록된 3가지 보안 질문 중 무작위로 출제된 1개에 답변하세요.",
      randomQuestionNotice: "보안을 위해 등록된 3가지 보안 질문 중 1가지가 무작위로 출제되었습니다. 정확한 답변을 입력해 주세요.",
      tryAnotherQuestion: "다른 질문 받기",
      verifyAnswersBtn: "보안 답변 확인 및 재설정",
      resetPwTitle: "새 비밀번호 설정",
      newPassword: "새 비밀번호",
      confirmPassword: "새 비밀번호 확인",
      saveNewPwBtn: "비밀번호 변경 완료",
      forgotId: "아이디 찾기",
      forgotPw: "비밀번호 찾기",
      or: "또는",
    },
    submit: {
      title: "탱고 이벤트 등록 신청",
      subtitle: "개최 예정인 페스티벌, 마라톤, 엥꾸엔뜨로, 밀롱가 정보를 등록하세요.",
      pendingNotice: "제출된 정보는 PENDING(대기) 상태로 저장되며, 관리자 승인 후 즉시 공개 목록에 노출됩니다.",
      nameLabel: "이벤트 명칭 *",
      typeLabel: "이벤트 유형 *",
      startDate: "시작일 *",
      endDate: "종료일 *",
      country: "개최 국가 (2자리 국가코드) *",
      city: "도시 *",
      state: "주 / 행정구역",
      address: "상세 도로명 주소 *",
      price: "참가비 / 티켓 금액 *",
      priceHelp: "예: $150, €100, ₩50,000, ¥3,500 또는 Free",
      sourceUrl: "공식 웹사이트 또는 등록 페이지 링크 (선택)",
      notes: "추가 일정 및 참고 사항",
      submitBtn: "승인 신청 제출",
      submitting: "제출 중...",
      successMessage: "성공적으로 제출되었습니다! 관리자 검토(PENDING) 후 공개됩니다.",
      requireLogin: "이벤트를 등록하려면 먼저 로그인해 주세요.",
    },
    admin: {
      title: "관리자 대시보드",
      subtitle: "제출된 이벤트 승인/반려 관리, 데이터 무결성 검증, 주간 크롤러 제어",
      tabPending: "승인 대기 (PENDING)",
      tabApproved: "공개 승인됨 (APPROVED)",
      tabRejected: "반려/보관 (REJECTED)",
      approveBtn: "공개 승인 (APPROVED)",
      rejectBtn: "반려 (REJECT)",
      deleteBtn: "삭제",
      crawlerTab: "주간 자동 크롤러",
      runCrawlerNow: "주간 크롤링 지금 실행 (수집 및 중복 필터링)",
      crawlerStatus: "크롤러 상태",
      crawledNotice: "오늘 기준 +6개월 범위의 공개 웹 데이터를 수집해 신규 등록 및 갱신합니다.",
      dedupStats: "중복 필터링 엔진: 날짜, 도시, 이벤트명 유사도(Levenshtein)를 자동 대조합니다.",
    },
    facebook: {
      searchBtn: "페이스북 커뮤니티 검색 & 일정 추가",
      modalTitle: "페이스북 탱고 커뮤니티 일정 레이더",
      modalSubtitle: "페이스북 그룹과 페이지에서 밀롱가·페스티벌 일정을 검색하고, 내 캘린더 및 데이터베이스에 즉시 추가합니다.",
      tabPopular: "추천 탱고 커뮤니티",
      tabCustom: "내 페이스북 그룹 링크",
      tabPaste: "게시글 텍스트 붙여넣기",
      allRegions: "전체 지역",
      koreaRegion: "한국",
      usaRegion: "미국",
      americasRegion: "중남미",
      europeRegion: "유럽",
      searchCommunityPlaceholder: "커뮤니티명 또는 도시 검색 (예: 서울, 홍대, 오나다, Atlanta, NYC)...",
      scanScheduleBtn: "일정 스캔",
      scanning: "스캔 중...",
      members: "회원",
      customInputPlaceholder: "내 페이스북 그룹 또는 이벤트 URL 입력 (예: facebook.com/groups/mytangoclub)...",
      customSearchBtn: "커뮤니티 검색 및 일정 스캔",
      customHint: "활동 중인 페이스북 탱고 그룹/페이지의 최신 피드를 분석하여 일정을 자동으로 추출합니다.",
      pastePlaceholder: "페이스북 그룹이나 페이지에서 복사한 공지글/이벤트 텍스트를 그대로 붙여넣으세요...\n예: [밀롱가 공지] 일시: 2026년 10월 24일 토요일, 장소: 홍대 오나다 홀, 입장료: 20,000원...",
      pasteExtractBtn: "AI 일정 정보 자동 추출",
      pasteHint: "붙여넣은 텍스트에서 이벤트명, 날짜, 장소, 도시, 입장료, 링크를 자동 판별합니다.",
      scannedEventsTitle: "발견된 커뮤니티 탱고 일정",
      noEventsFound: "검색된 일정이 없습니다. 다른 커뮤니티를 선택하거나 공지글을 직접 붙여넣어 보세요.",
      addAllBtn: "새 일정 전체 캘린더에 추가",
      addEventBtn: "캘린더에 추가",
      alreadyInCalendar: "이미 등록됨",
      newBadge: "새 일정",
      addSuccess: "EveryTango 캘린더 및 데이터베이스에 성공적으로 추가되었습니다!",
    },
  },
  es: {
    appName: "Everytango",
    tagline: "Directorio Global de Tango Argentino",
    subtagline: "Descubre festivales, maratones, encuentros y milongas en todo el mundo.",
    nav: {
      browseEvents: "Explorar Eventos",
      submitEvent: "Publicar Evento",
      adminDashboard: "Panel de Administración",
      crawler: "Rastreador Semanal",
      signIn: "Iniciar Sesión",
      signUp: "Registrarse",
      signOut: "Cerrar Sesión",
      profile: "Perfil",
      findId: "Recuperar Usuario",
      findPw: "Recuperar Clave",
    },
    filter: {
      quickRange: "Rango Rápido",
      allRange: "Todos los Próximos",
      oneMonth: "+1 Mes (Predeterminado)",
      threeMonths: "+3 Meses",
      sixMonths: "+6 Meses",
      customRange: "Rango Personalizado",
      startDate: "Desde",
      endDate: "Hasta",
      eventType: "Tipo de Evento",
      allTypes: "Todos",
      festival: "Festival",
      marathon: "Marathon",
      encuentro: "Encuentro",
      workshop: "Taller (Workshop)",
      milonga: "Milonga",
      searchEvent: "Nombre del Evento",
      searchPlaceholder: "ej. Buenos Aires, Madrid...",
      country: "Código de País",
      allCountries: "Todos los Países",
      city: "Ciudad",
      cityPlaceholder: "Filtrar por ciudad",
      state: "Provincia / Estado",
      statePlaceholder: "Filtrar por provincia",
      price: "Precio",
      allPrices: "Todos",
      freeOnly: "Entrada Libre",
      paidOnly: "Con Entrada",
      resetFilters: "Reiniciar Filtros",
      activeFiltersCount: "filtros activos",
      resultsCount: "eventos encontrados",
      exportExcel: "Exportar a Excel",
      downloadComplete: "¡Descarga completa!",
      exportTooltip: "Descargar eventos filtrados en Excel (.xlsx)",
    },
    table: {
      dateDay: "Fecha (Día)",
      type: "Tipo",
      eventName: "Nombre del Evento",
      city: "Ciudad",
      state: "Provincia",
      country: "País",
      address: "Dirección",
      price: "Precio",
      locationAndAddress: "Lugar y Dirección",
      priceUsd: "Precio",
      crawledDate: "Fecha de Rastreo",
      sortBy: "Ordenar por:",
      sortByDate: "Fecha",
      sortByName: "Nombre",
      sortByCity: "Ciudad",
      share: "Compartir",
      copied: "¡Copiado!",
      viewOfficial: "Visitar sitio oficial",
      totalEventsCount: "eventos programados",
      tableSingleScreenNote: "Todas las columnas visibles sin desplazamiento lateral",
      exchangeRateNote: "Tipo de cambio ref: 1 USD ≈ ₩1.350 / €1 ≈ $1.08 USD",
      details: "Detalles",
      source: "Origen",
      viewOriginal: "Enlace Oficial",
      noEventsFound: "No se encontraron eventos con estos criterios.",
      noEventsPrompt: "Intenta ampliar el rango de fechas o los filtros.",
      status: "Estado",
      actions: "Acciones",
      experiences: "Historias y Fotos",
      addStory: "Añadir Historia",
    },
    auth: {
      loginTitle: "Bienvenido a Everytango",
      loginSubtitle: "Inicia sesión con tu cuenta o Google",
      usernameOrEmail: "Usuario o Correo",
      password: "Contraseña",
      loginBtn: "Entrar",
      googleSignIn: "Continuar con Google",
      noAccount: "¿No tienes una cuenta?",
      hasAccount: "¿Ya tienes cuenta?",
      registerTitle: "Crear Cuenta Everytango",
      registerSubtitle: "Únete a la comunidad y publica eventos",
      firstName: "Nombre (First Name)",
      lastName: "Apellido (Last Name)",
      username: "Nombre de Usuario (ID)",
      email: "Correo Electrónico",
      country: "País de Residencia",
      state: "Estado / Provincia (State)",
      phone: "Teléfono",
      selectCountry: "Seleccionar País",
      securityQuestionsTitle: "Preguntas de Seguridad Obligatorias",
      securityQuestionsDesc: "Elige 3 preguntas y respuestas para recuperar tu contraseña.",
      q1: "Pregunta de Seguridad #1",
      q2: "Pregunta de Seguridad #2",
      q3: "Pregunta de Seguridad #3",
      answerPlaceholder: "Tu respuesta secreta",
      registerBtn: "Crear Cuenta",
      findIdTitle: "Recuperar Usuario",
      findIdDesc: "Ingresa el correo y teléfono registrados.",
      findIdBtn: "Buscar Usuario",
      foundIdMessage: "Tu nombre de usuario es:",
      findPwTitle: "Restablecer Contraseña",
      findPwDesc: "Ingresa tu usuario o correo para responder 1 pregunta de seguridad seleccionada al azar.",
      randomQuestionNotice: "Se seleccionó al azar 1 de tus 3 preguntas de seguridad. Escribe tu respuesta registrada.",
      tryAnotherQuestion: "Probar otra pregunta",
      verifyAnswersBtn: "Verificar Respuesta y Continuar",
      resetPwTitle: "Nueva Contraseña",
      newPassword: "Nueva Contraseña",
      confirmPassword: "Confirmar Contraseña",
      saveNewPwBtn: "Guardar Contraseña",
      forgotId: "¿Olvidaste tu usuario?",
      forgotPw: "¿Olvidaste tu contraseña?",
      or: "o",
    },
    submit: {
      title: "Publicar un Evento de Tango",
      subtitle: "Comparte tu festival, maratón, encuentro o milonga.",
      pendingNotice: "El evento se guardará en estado PENDING y se publicará tras revisión administrativa.",
      nameLabel: "Nombre del Evento *",
      typeLabel: "Tipo de Evento *",
      startDate: "Fecha de Inicio *",
      endDate: "Fecha de Fin *",
      country: "País (Código ISO de 2 letras) *",
      city: "Ciudad *",
      state: "Provincia / Estado",
      address: "Dirección Calle *",
      price: "Precio / Entrada *",
      priceHelp: "ej. $150, €90 o Free",
      sourceUrl: "Sitio Web o Inscripción Oficial (Opcional)",
      notes: "Notas adicionales y cronograma",
      submitBtn: "Enviar para Aprobación",
      submitting: "Enviando...",
      successMessage: "¡Evento enviado! Está en revisión pendiente.",
      requireLogin: "Inicia sesión para enviar un evento.",
    },
    admin: {
      title: "Panel de Administración",
      subtitle: "Revisa eventos enviados, integridad de datos y rastreador automático.",
      tabPending: "Pendientes (PENDING)",
      tabApproved: "Aprobados (APPROVED)",
      tabRejected: "Rechazados (REJECTED)",
      approveBtn: "Aprobar y Publicar",
      rejectBtn: "Rechazar",
      deleteBtn: "Eliminar",
      crawlerTab: "Rastreador Semanal",
      runCrawlerNow: "Ejecutar Rastreo Semanal Ahora",
      crawlerStatus: "Estado del Rastreador",
      crawledNotice: "Recopila eventos web públicos de hoy a +6 meses.",
      dedupStats: "Motor anti-duplicados: compara fecha, ciudad y similitud de nombre.",
    },
    facebook: {
      searchBtn: "Buscar Comunidades de Facebook",
      modalTitle: "Radar de Comunidades de Facebook",
      modalSubtitle: "Busca grupos de Facebook, escanea milongas y festivales, o pega anuncios para añadirlos al calendario.",
      tabPopular: "Comunidades Destacadas",
      tabCustom: "Enlace de Mi Grupo",
      tabPaste: "Pegar Texto de Publicación",
      allRegions: "Todas las Regiones",
      koreaRegion: "Corea",
      usaRegion: "EE.UU.",
      americasRegion: "Américas",
      europeRegion: "Europa",
      searchCommunityPlaceholder: "Buscar por grupo o ciudad (ej. Buenos Aires, Atlanta, Seúl)...",
      scanScheduleBtn: "Escanear Horarios",
      scanning: "Escaneando...",
      members: "miembros",
      customInputPlaceholder: "Ingresa la URL de tu grupo o evento de Facebook...",
      customSearchBtn: "Buscar y Extraer Eventos",
      customHint: "Conecta con el feed de tu comunidad de tango en Facebook para detectar próximas milongas.",
      pastePlaceholder: "Pega el texto de cualquier publicación o volante de Facebook aquí...",
      pasteExtractBtn: "Extraer Datos del Evento",
      pasteHint: "Analiza automáticamente fechas, ciudad, lugar y precio del anuncio copiado.",
      scannedEventsTitle: "Eventos Descubiertos en Comunidades",
      noEventsFound: "No se encontraron eventos. Prueba con otra comunidad o pega el texto directamente.",
      addAllBtn: "Añadir Todos al Calendario",
      addEventBtn: "Añadir al Calendario",
      alreadyInCalendar: "Ya en el Calendario",
      newBadge: "Nuevo Evento",
      addSuccess: "¡Añadido con éxito al calendario y base de datos!",
    },
  },
  ja: {
    appName: "Everytango",
    tagline: "世界のアルゼンチンタンゴ・イベント情報",
    subtagline: "世界各地のフェスティバル、マラソン、エンクエントロ、ミロンガを簡単検索・登録。",
    nav: {
      browseEvents: "イベント一覧",
      submitEvent: "イベント掲載申請",
      adminDashboard: "管理者ダッシュボード",
      crawler: "週間自動クローラー",
      signIn: "ログイン",
      signUp: "新規登録",
      signOut: "ログアウト",
      profile: "プロフィール",
      findId: "ID検索",
      findPw: "パスワード再設定",
    },
    filter: {
      quickRange: "期間クイック選択",
      allRange: "すべて",
      oneMonth: "今後1ヶ月 (標準)",
      threeMonths: "今後3ヶ月",
      sixMonths: "今後6ヶ月",
      customRange: "期間指定",
      startDate: "開始日",
      endDate: "終了日",
      eventType: "イベント種類",
      allTypes: "すべてのタイプ",
      festival: "フェスティバル",
      marathon: "マラソン",
      encuentro: "エンクエントロ",
      workshop: "ワークショップ (Workshop)",
      milonga: "ミロンガ",
      searchEvent: "イベント名",
      searchPlaceholder: "イベント名を検索",
      country: "国コード",
      allCountries: "すべての国",
      city: "都市",
      cityPlaceholder: "都市で絞り込み",
      state: "州・県",
      statePlaceholder: "州・県で絞り込み",
      price: "料金",
      allPrices: "すべての料金",
      freeOnly: "無料イベント",
      paidOnly: "有料イベント",
      resetFilters: "条件リセット",
      activeFiltersCount: "件の条件適用中",
      resultsCount: "件のイベントが見つかりました",
      exportExcel: "Excelダウンロード",
      downloadComplete: "ダウンロード完了!",
      exportTooltip: "現在のイベントをExcelファイル(.xlsx)で保存",
    },
    table: {
      dateDay: "開催日程",
      type: "タイプ",
      eventName: "イベント名",
      city: "都市",
      state: "州/県",
      country: "国",
      address: "所在地・住所",
      price: "料金",
      locationAndAddress: "場所 / 住所",
      priceUsd: "料金",
      crawledDate: "検索された日",
      sortBy: "並べ替え:",
      sortByDate: "日付順",
      sortByName: "名前順",
      sortByCity: "都市順",
      share: "共有",
      copied: "コピー完了!",
      viewOfficial: "公式サイトへ",
      totalEventsCount: "件のイベント",
      tableSingleScreenNote: "横スクロールなしで全列表示",
      exchangeRateNote: "為替基準: 1 USD ≈ ₩1,350 / €1 ≈ $1.08 USD",
      details: "詳細リンク",
      source: "収集区分",
      viewOriginal: "公式リンク",
      noEventsFound: "該当するタンゴイベントが見つかりませんでした。",
      noEventsPrompt: "検索条件または期間を変更してみてください。",
      status: "ステータス",
      actions: "操作",
      experiences: "体験・写真",
      addStory: "投稿する",
    },
    auth: {
      loginTitle: "Everytango ログイン",
      loginSubtitle: "アカウントまたはGoogleでログイン",
      usernameOrEmail: "ユーザー名またはメールアドレス",
      password: "パスワード",
      loginBtn: "ログイン",
      googleSignIn: "Googleでログイン",
      noAccount: "アカウントをお持ちでない方",
      hasAccount: "既にアカウントをお持ちの方",
      registerTitle: "新規アカウント登録",
      registerSubtitle: "世界中のタンゴ愛好家とつながり、イベントを登録できます。",
      firstName: "名 (First Name)",
      lastName: "姓 (Last Name)",
      username: "ユーザー名 (ID)",
      email: "メールアドレス",
      country: "居住国",
      state: "州 / 都道府県 (State)",
      phone: "電話番号",
      selectCountry: "国を選択",
      securityQuestionsTitle: "秘密の質問 3問 (アカウント復旧用)",
      securityQuestionsDesc: "パスワード紛失時に本人確認を行うための質問を3つ選択してください。",
      q1: "秘密の質問 1",
      q2: "秘密の質問 2",
      q3: "秘密の質問 3",
      answerPlaceholder: "答えを入力",
      registerBtn: "登録完了",
      findIdTitle: "ユーザーIDの検索",
      findIdDesc: "登録時のメールアドレスと電話番号を入力してください。",
      findIdBtn: "IDを確認",
      foundIdMessage: "ご登録のユーザーIDは:",
      findPwTitle: "パスワードの再設定",
      findPwDesc: "ユーザー名またはメールアドレスを入力し、登録された3つの質問からランダムな1問にお答えください。",
      randomQuestionNotice: "登録された3つの質問から1問がランダムに出題されました。登録した回答を入力してください。",
      tryAnotherQuestion: "別の質問に変更",
      verifyAnswersBtn: "回答を確認して次へ",
      resetPwTitle: "新しいパスワードを設定",
      newPassword: "新しいパスワード",
      confirmPassword: "新しいパスワード (確認)",
      saveNewPwBtn: "パスワードを変更",
      forgotId: "IDをお忘れですか？",
      forgotPw: "パスワードをお忘れですか？",
      or: "または",
    },
    submit: {
      title: "タンゴイベント掲載申請",
      subtitle: "開催予定のフェスティバル、マラソン、エンクエントロ、ミロンガ情報を登録。",
      pendingNotice: "申請されたイベントは管理者による承認(APPROVED)後に公開されます。",
      nameLabel: "イベント名 *",
      typeLabel: "イベント種類 *",
      startDate: "開始日 *",
      endDate: "終了日 *",
      country: "国コード (ISO 2文字) *",
      city: "都市 *",
      state: "州・県",
      address: "詳細住所 *",
      price: "参加費・チケット *",
      priceHelp: "例: $150, ¥5000, Free",
      sourceUrl: "公式サイト・登録URL（任意）",
      notes: "特記事項・スケジュール",
      submitBtn: "承認申請を送信",
      submitting: "送信中...",
      successMessage: "送信が完了しました！管理者の審査をお待ちください。",
      requireLogin: "イベントを申請するにはログインが必要です。",
    },
    admin: {
      title: "管理者ダッシュボード",
      subtitle: "イベントの審査・承認、データ整合性、自動クローラーの管理",
      tabPending: "審査待ち (PENDING)",
      tabApproved: "公開中 (APPROVED)",
      tabRejected: "却下 (REJECTED)",
      approveBtn: "承認して公開",
      rejectBtn: "却下",
      deleteBtn: "削除",
      crawlerTab: "週間自動クローラー",
      runCrawlerNow: "今すぐクローラーを実行",
      crawlerStatus: "クローラーの状態",
      crawledNotice: "本日から+6ヶ月先までの公開タンゴ情報を収集・更新します。",
      dedupStats: "重複除外エンジン: 日程・都市・名称類似度を自動照合します。",
    },
    facebook: {
      searchBtn: "Facebookコミュニティ検索・日程追加",
      modalTitle: "Facebookタンゴコミュニティ・レーダー",
      modalSubtitle: "Facebookグループからミロンガやフェスティバルの日程を検索・抽出してカレンダーに追加します。",
      tabPopular: "注目のコミュニティ",
      tabCustom: "マイグループURL",
      tabPaste: "投稿テキスト貼り付け",
      allRegions: "全地域",
      koreaRegion: "韓国",
      usaRegion: "アメリカ",
      americasRegion: "中南米",
      europeRegion: "ヨーロッパ",
      searchCommunityPlaceholder: "グループ名または都市名で検索 (例: ソウル、アトランタ、東京)...",
      scanScheduleBtn: "日程スキャン",
      scanning: "スキャン中...",
      members: "名",
      customInputPlaceholder: "FacebookグループまたはイベントURLを入力...",
      customSearchBtn: "検索・日程抽出",
      customHint: "ご自身のFacebookタンゴコミュニティの投稿から直近のイベントを検出します。",
      pastePlaceholder: "Facebookからコピーした告知テキストをここに貼り付けてください...",
      pasteExtractBtn: "日程情報を自動抽出",
      pasteHint: "貼り付けたテキストからイベント名、日程、場所、料金を自動判別します。",
      scannedEventsTitle: "検出されたコミュニティ日程",
      noEventsFound: "該当する日程が見つかりません。別のコミュニティを選択するかテキストを貼り付けてください。",
      addAllBtn: "新規日程を一括カレンダー追加",
      addEventBtn: "カレンダーに追加",
      alreadyInCalendar: "登録済み",
      newBadge: "新規",
      addSuccess: "EveryTangoカレンダーおよびデータベースに追加されました！",
    },
  },
  zh: {
    appName: "Everytango",
    tagline: "全球阿根廷探戈活动日程",
    subtagline: "轻松查询全球探戈节、马拉松、Encuentro及舞会日程。",
    nav: {
      browseEvents: "浏览活动",
      submitEvent: "发布活动",
      adminDashboard: "管理后台",
      crawler: "每周自动爬虫",
      signIn: "登录",
      signUp: "注册",
      signOut: "登出",
      profile: "个人资料",
      findId: "找回账号",
      findPw: "找回密码",
    },
    filter: {
      quickRange: "快捷日期范围",
      allRange: "全部日程",
      oneMonth: "未来 1 个月 (默认)",
      threeMonths: "未来 3 个月",
      sixMonths: "未来 6 个月",
      customRange: "自定义日期",
      startDate: "开始日期",
      endDate: "结束日期",
      eventType: "活动类型",
      allTypes: "所有类型",
      festival: "探戈节 (Festival)",
      marathon: "马拉松 (Marathon)",
      encuentro: "Encuentro",
      workshop: "工作坊 (Workshop)",
      milonga: "舞会 (Milonga)",
      searchEvent: "活动名称",
      searchPlaceholder: "输入活动名称搜索",
      country: "国家代码",
      allCountries: "所有国家",
      city: "城市",
      cityPlaceholder: "按城市筛选",
      state: "省 / 州",
      statePlaceholder: "按省州筛选",
      price: "费用",
      allPrices: "所有费用",
      freeOnly: "免费入场",
      paidOnly: "收费活动",
      resetFilters: "重置筛选",
      activeFiltersCount: "项筛选生效",
      resultsCount: "个探戈活动",
      exportExcel: "导出Excel",
      downloadComplete: "下载完成!",
      exportTooltip: "将当前筛选活动导出为Excel表格 (.xlsx)",
    },
    table: {
      dateDay: "日期 (星期)",
      type: "类型",
      eventName: "活动名称",
      city: "城市",
      state: "省/州",
      country: "国家",
      address: "详细地址",
      price: "票价",
      locationAndAddress: "地点与地址",
      priceUsd: "费用",
      crawledDate: "搜索日期",
      sortBy: "排序方式:",
      sortByDate: "按日期",
      sortByName: "按名称",
      sortByCity: "按城市",
      share: "分享",
      copied: "已复制!",
      viewOfficial: "访问官方网站",
      totalEventsCount: "个活动日程",
      tableSingleScreenNote: "单屏无横向滚动条适配",
      exchangeRateNote: "汇率参考: 1 USD ≈ ₩1,350 / €1 ≈ $1.08 USD",
      details: "详情",
      source: "来源",
      viewOriginal: "官方网址",
      noEventsFound: "未找到符合筛选条件的探戈活动。",
      noEventsPrompt: "请尝试放宽筛选条件或重置日期范围。",
      status: "状态",
      actions: "操作",
      experiences: "心得与照片",
      addStory: "发布心得",
    },
    auth: {
      loginTitle: "登录 Everytango",
      loginSubtitle: "使用账号或 Google 登录",
      usernameOrEmail: "用户名或邮箱",
      password: "密码",
      loginBtn: "登录",
      googleSignIn: "使用 Google 继续",
      noAccount: "还没有账号？",
      hasAccount: "已有账号？",
      registerTitle: "创建 Everytango 账号",
      registerSubtitle: "加入全球探戈社区并发布活动",
      firstName: "名 (First Name)",
      lastName: "姓 (Last Name)",
      username: "用户名 (ID)",
      email: "电子邮箱",
      country: "常住国家",
      state: "州 / 省 (State)",
      phone: "手机号码",
      selectCountry: "选择国家",
      securityQuestionsTitle: "必填安全密保问题 (账号找回专用)",
      securityQuestionsDesc: "选择3个密保问题并填写答案，用于密码找回与重置。",
      q1: "密保问题 1",
      q2: "密保问题 2",
      q3: "密保问题 3",
      answerPlaceholder: "输入密保答案",
      registerBtn: "立即注册",
      findIdTitle: "找回用户名 (ID)",
      findIdDesc: "输入您注册时填写的邮箱和手机号。",
      findIdBtn: "查询用户名",
      foundIdMessage: "您注册的用户名是：",
      findPwTitle: "找回与重置密码",
      findPwDesc: "输入用户名或邮箱，回答系统从3个密保问题中随机抽取的1题。",
      randomQuestionNotice: "已从您注册的3个密保问题中随机抽取1题，请输入您当时设置的答案。",
      tryAnotherQuestion: "换一个问题",
      verifyAnswersBtn: "验证答案并继续",
      resetPwTitle: "重设新密码",
      newPassword: "新密码",
      confirmPassword: "确认新密码",
      saveNewPwBtn: "保存新密码",
      forgotId: "忘记用户名？",
      forgotPw: "忘记密码？",
      or: "或",
    },
    submit: {
      title: "提交探戈活动",
      subtitle: "分享即将举办的探戈节、马拉松、Encuentro 或 Milonga。",
      pendingNotice: "提交后进入 PENDING(待审核) 状态，管理员审核通过后立即公开显示。",
      nameLabel: "活动名称 *",
      typeLabel: "活动类型 *",
      startDate: "开始日期 *",
      endDate: "结束日期 *",
      country: "举办国家代码 (ISO 2位字母) *",
      city: "城市 *",
      state: "省 / 州",
      address: "详细街道地址 *",
      price: "票价 / 门票 *",
      priceHelp: "例如: $150, ¥800 或 Free",
      sourceUrl: "官方网站或报名链接（选填）",
      notes: "日程详情与备注",
      submitBtn: "提交审核",
      submitting: "提交中...",
      successMessage: "提交成功！正在等待管理员审核(PENDING)。",
      requireLogin: "请先登录后再提交探戈活动。",
    },
    admin: {
      title: "管理控制台",
      subtitle: "审核待办公开申请、维护数据库完整性、执行每周自动化爬虫",
      tabPending: "待审核 (PENDING)",
      tabApproved: "已公开 (APPROVED)",
      tabRejected: "已拒绝 (REJECTED)",
      approveBtn: "审核通过 (APPROVED)",
      rejectBtn: "拒绝 (REJECT)",
      deleteBtn: "删除",
      crawlerTab: "每周自动爬虫",
      runCrawlerNow: "立即执行每周数据抓取",
      crawlerStatus: "爬虫任务状态",
      crawledNotice: "收集今天起未来6个月(+6M)内的公开网络探戈活动数据并去重登记。",
      dedupStats: "去重算法：对比日期、举办城市以及活动名称相似度 (Levenshtein)。",
    },
    facebook: {
      searchBtn: "搜索Facebook社群活动",
      modalTitle: "Facebook探戈社群雷达",
      modalSubtitle: "搜索Facebook群组舞会与活动，或粘贴通知文本直接添加至日历。",
      tabPopular: "精选探戈社群",
      tabCustom: "我的群组链接",
      tabPaste: "粘贴帖子内容",
      allRegions: "全部区域",
      koreaRegion: "韩国",
      usaRegion: "美国",
      americasRegion: "美洲",
      europeRegion: "欧洲",
      searchCommunityPlaceholder: "按群组名或城市搜索（如 首尔、亚特兰大、纽约）...",
      scanScheduleBtn: "扫描活动日程",
      scanning: "扫描中...",
      members: "位成员",
      customInputPlaceholder: "输入您的Facebook群组或活动链接...",
      customSearchBtn: "搜索并提取活动",
      customHint: "连接您的Facebook探戈社群动态，自动识别最新舞会日程。",
      pastePlaceholder: "在此粘贴Facebook活动通知或海报文本...",
      pasteExtractBtn: "自动解析活动详情",
      pasteHint: "智能识别复制文本中的活动名称、日期、场地、城市和门票价格。",
      scannedEventsTitle: "社群发现的探戈日程",
      noEventsFound: "未找到相关活动。请尝试扫描其他社群或粘贴帖子文本。",
      addAllBtn: "一键添加新日程至日历",
      addEventBtn: "添加至日历",
      alreadyInCalendar: "已存在于日历",
      newBadge: "新活动",
      addSuccess: "已成功添加至EveryTango日历与数据库！",
    },
  },
};

export const SECURITY_QUESTION_OPTIONS = [
  { id: "q_pet", text: "What was the name of your first pet?" },
  { id: "q_city", text: "In what city were you born?" },
  { id: "q_school", text: "What was the name of your elementary school?" },
  { id: "q_maiden", text: "What is your mother's maiden name?" },
  { id: "q_car", text: "What was the make of your first car?" },
  { id: "q_tango", text: "Where did you attend your first tango festival?" },
  { id: "q_hero", text: "What was your childhood nickname?" },
  { id: "q_book", text: "What is your favorite book or tango orchestra?" },
];

export const COUNTRY_LIST: { code: string; name: string }[] = [
  { code: "AR", name: "Argentina (AR)" },
  { code: "US", name: "United States (US)" },
  { code: "KR", name: "South Korea (KR)" },
  { code: "ES", name: "Spain (ES)" },
  { code: "DE", name: "Germany (DE)" },
  { code: "IT", name: "Italy (IT)" },
  { code: "FR", name: "France (FR)" },
  { code: "GB", name: "United Kingdom (GB)" },
  { code: "JP", name: "Japan (JP)" },
  { code: "TR", name: "Turkey (TR)" },
  { code: "GR", name: "Greece (GR)" },
  { code: "PT", name: "Portugal (PT)" },
  { code: "NL", name: "Netherlands (NL)" },
  { code: "CA", name: "Canada (CA)" },
  { code: "AU", name: "Australia (AU)" },
  { code: "BR", name: "Brazil (BR)" },
  { code: "UY", name: "Uruguay (UY)" },
  { code: "PL", name: "Poland (PL)" },
  { code: "AT", name: "Austria (AT)" },
  { code: "CH", name: "Switzerland (CH)" },
  { code: "CN", name: "China (CN)" },
  { code: "TW", name: "Taiwan (TW)" },
  { code: "SG", name: "Singapore (SG)" },
];
