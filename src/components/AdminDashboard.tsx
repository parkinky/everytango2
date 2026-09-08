import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Bot, 
  Check, 
  X, 
  Trash2, 
  ExternalLink, 
  RefreshCw, 
  Calendar, 
  AlertTriangle,
  Database,
  Filter,
  Users,
  Clock,
  Sparkles,
  Plus,
  Search,
  KeyRound,
  Shield,
  Send,
  Eye,
  Settings,
  ChevronRight,
  ArrowRight,
  Sliders,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  LogOut,
  ArrowLeft,
  Edit3,
  Globe,
  Radio,
  ArrowUpDown,
  Play,
  Camera,
  Copy,
  EyeOff,
  Mail,
  Facebook,
  Download,
  RotateCcw
} from 'lucide-react';
import { SupportedLanguage, TangoEvent, UserProfile, UserRole, EventType, EventStatus, CrawlingChannel } from '../types';
import { translations, COUNTRY_LIST } from '../i18n';
import { useEvents } from '../context/EventsContext';
import { useAuth } from '../context/AuthContext';
import { useSiteConfig } from '../context/SiteConfigContext';
import { formatTwoLineDate } from '../utils/dedup';
import { formatTwoLineAddress, convertPriceToUSD, formatCrawledDate, formatDateToCST, formatDateTimeToCST } from '../utils/formatters';
import { exportEventsToExcel } from '../utils/excelExport';
import { EventSourceLink } from './EventSourceLink';
import { FacebookSearchModal } from './FacebookSearchModal';
import { SiteEventExtractorModal } from './SiteEventExtractorModal';

interface AdminDashboardProps {
  currentLang: SupportedLanguage;
  onRequestExit?: () => void;
  onEditEvent?: (eventId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ currentLang, onRequestExit, onEditEvent }) => {
  const t = translations[currentLang];
  const { 
    events, 
    approveEvent, 
    rejectEvent, 
    deleteEvent, 
    deleteMultipleEvents,
    addEventDirect,
    resetAllEventsAndCrawlRecords,
    runWeeklyCrawler,
    validateEventUrls,
    syncAuthenticVenues,
    stats 
  } = useEvents();

  const [isSyncingVenues, setIsSyncingVenues] = useState(false);

  const { 
    userProfile, 
    currentUser, 
    loginCustom, 
    loginWithGoogle,
    logout, 
    getAllUsers, 
    updateUserRole, 
    updateUserProfile,
    resetUserPasswordByAdmin,
    deleteUser 
  } = useAuth();

  const { 
    siteConfig, 
    updateSiteConfig, 
    cronConfig, 
    updateCronConfig, 
    addCronLog, 
    updateAllCrawlingChannels,
    resetAllCrawlRecords,
    addCrawlingChannel,
    updateCrawlingChannel,
    deleteCrawlingChannel,
    deleteUnexecutedChannels,
    toggleCrawlingChannel,
    autoUpdateCuratedNotice,
    callGeminiWebsiteManager 
  } = useSiteConfig();

  // Admin Authentication State
  const isAdmin = userProfile?.role === 'ADMIN' || currentUser?.email === 'parkinky@gmail.com' || userProfile?.username === 'parkinky';
  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPwInput, setAdminPwInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Main SubTab: 'events' | 'users' | 'cron' | 'gemini'
  const [activeTab, setActiveTab] = useState<'events' | 'users' | 'cron' | 'gemini'>('events');

  // --- EVENTS TAB STATE ---
  const [eventFilterStatus, setEventFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [eventSearchQuery, setEventSearchQuery] = useState('');
  const [adminEventSortField, setAdminEventSortField] = useState<'created_at' | 'start_date' | 'event_name'>('created_at');
  const [adminEventSortAsc, setAdminEventSortAsc] = useState<boolean>(false);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set());
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [newEventForm, setNewEventForm] = useState({
    event_name: '',
    event_type: 'FESTIVAL' as EventType,
    start_date: '2026-10-15',
    end_date: '2026-10-18',
    country_code: 'KR',
    city: 'Seoul',
    state: '',
    address: 'Gangnam Tango Studio, Seoul',
    price: '₩120,000',
    source_url: 'https://everytango.com/events/seoul',
    notes: 'Official festival passes with master workshops and grand milongas.',
    status: 'APPROVED' as EventStatus,
  });

  // --- USERS TAB STATE ---
  const [userList, setUserList] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSortField, setUserSortField] = useState<'role' | 'username' | 'email' | 'phone' | 'created_at'>('role');
  const [userSortAsc, setUserSortAsc] = useState<boolean>(true);
  const [selectedUserDetails, setSelectedUserDetails] = useState<UserProfile | null>(null);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [userEditForm, setUserEditForm] = useState({
    username: '',
    email: '',
    phone: '',
    country_code: '',
    city: '',
    role: 'USER' as UserRole,
  });
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionSaving, setUserActionSaving] = useState(false);

  // User Edit Modal - Password Reset State
  const [resetPasswordInput, setResetPasswordInput] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetPwFeedback, setResetPwFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isResettingPw, setIsResettingPw] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  // Generic Confirmation Dialog State (for all deletions and changes)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => Promise<void> | void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: () => {},
  });

  // Automated Approval Notification Email Modal State
  const [approvalEmailSuccessModal, setApprovalEmailSuccessModal] = useState<{
    isOpen: boolean;
    eventName: string;
    recipientEmail: string;
    emailLog?: any;
  } | null>(null);

  // --- CRON TAB STATE ---
  const [crawlerRunning, setCrawlerRunning] = useState(false);
  const [crawlerResult, setCrawlerResult] = useState<{
    addedCount: number;
    duplicateCount: number;
    duplicatesDetails: string[];
    invalidUrlCount?: number;
    invalidUrlsDetails?: string[];
    channelsCrawled?: string[];
    inactiveChannelsCount?: number;
    timeWindow?: string;
    updatedChannels?: CrawlingChannel[];
  } | null>(null);

  // --- URL VALIDATION STATE FOR ADMIN EVENT TABLE ---
  const [isValidatingUrls, setIsValidatingUrls] = useState(false);
  const [urlValidationMap, setUrlValidationMap] = useState<Record<string, { isValid: boolean; reason: string }>>({});

  // --- CRAWLING CHANNELS STATE ---
  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<CrawlingChannel | null>(null);
  const [channelSearchQuery, setChannelSearchQuery] = useState('');
  const [channelSortField, setChannelSortField] = useState<'city' | 'country_code' | 'sourceType' | 'name' | 'url'>('city');
  const [channelSortAsc, setChannelSortAsc] = useState<boolean>(true);
  const [channelForm, setChannelForm] = useState({
    name: '',
    url: '',
    sourceType: 'WEBSITE' as CrawlingChannel['sourceType'],
    city: '',
    state: '',
    country_code: 'US',
    description: '',
    enabled: true,
  });
  const [isFacebookModalOpen, setIsFacebookModalOpen] = useState(false);
  const [isExtractorModalOpen, setIsExtractorModalOpen] = useState(false);
  const [extractorTargetChannel, setExtractorTargetChannel] = useState<CrawlingChannel | null>(null);

  // --- GEMINI TAB & CURATED NOTICE AUTO STATE ---
  const [geminiPrompt, setGeminiPrompt] = useState('');
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<string>('');
  const [geminiSuggestedConfig, setGeminiSuggestedConfig] = useState<any>(null);
  const [geminiStatusMessage, setGeminiStatusMessage] = useState<string>('');
  const [curatedAutoUpdating, setCuratedAutoUpdating] = useState(false);
  const [curatedUpdateSuccessMsg, setCuratedUpdateSuccessMsg] = useState('');

  // Load users when entering user management tab
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
    }
  }, [isAdmin]);

  const loadAllUsers = async () => {
    setUsersLoading(true);
    try {
      const list = await getAllUsers();
      setUserList(list);
    } catch (e) {
      console.warn('Failed to load users:', e);
    } finally {
      setUsersLoading(false);
    }
  };

  // Quick Admin Login
  const handleAdminLogin = async (idToUse?: string, pwToUse?: string) => {
    setLoginLoading(true);
    setLoginError('');
    const id = idToUse || adminIdInput;
    const pw = pwToUse || adminPwInput;

    const res = await loginCustom(id, pw);
    setLoginLoading(false);
    if (!res.success) {
      setLoginError(res.error || 'Authentication failed. Please verify credentials.');
    } else {
      loadAllUsers();
    }
  };

  // Google Admin Login using saved Google credentials
  const handleGoogleAdminLogin = async () => {
    setLoginLoading(true);
    setLoginError('');
    try {
      await loginWithGoogle();
      loadAllUsers();
    } catch (err: any) {
      console.error('Google Admin Login error:', err);
      setLoginError(err.message || 'Google authentication failed. Please try again.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Add Event Handler
  const handleCreateEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventForm.event_name || !newEventForm.start_date || !newEventForm.city) {
      alert('Please fill in required fields (Event Name, Start Date, City)');
      return;
    }

    const effectiveEndDate = newEventForm.end_date.trim() ? newEventForm.end_date.trim() : newEventForm.start_date.trim();

    const res = await addEventDirect({
      ...newEventForm,
      end_date: effectiveEndDate,
      source_type: 'MANUAL',
      submitted_by: userProfile?.id || 'admin_parkinky',
      submitted_by_name: userProfile?.username || 'parkinky (ADMIN)',
    });

    if (res.success) {
      setIsAddEventModalOpen(false);
      setNewEventForm({
        event_name: '',
        event_type: 'FESTIVAL',
        start_date: '2026-10-15',
        end_date: '2026-10-18',
        country_code: 'KR',
        city: 'Seoul',
        state: '',
        address: 'Gangnam Tango Studio, Seoul',
        price: '₩120,000',
        source_url: 'https://everytango.com/events/seoul',
        notes: '',
        status: 'APPROVED',
      });
      alert('Event added successfully!');
    } else {
      alert('Failed to add event: ' + res.error);
    }
  };

  // Delete Event Handler (with popup confirmation)
  const handleDeleteEvent = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: '이벤트 삭제 확인 (Delete Event)',
      message: `정말로 이벤트 "${name}"을(를) 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`,
      confirmText: '삭제 (Delete)',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: async () => {
        await deleteEvent(id);
        setSelectedEventIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Toggle selection of an event for bulk deletion
  const toggleSelectEvent = (id: string, checked: boolean) => {
    setSelectedEventIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  // Batch Delete Handler triggered by DEL header button
  const handleBatchDeleteClick = () => {
    if (selectedEventIds.size === 0) {
      alert('삭제할 라인을 먼저 체크박스로 선택해주세요.');
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '선택 라인 영구 삭제 경고',
      message: `선택한 모든 라인이 영원히 삭제된다.\n\n(선택된 라인: 총 ${selectedEventIds.size}건)\n선택하신 모든 이벤트가 영구 삭제되며 복구할 수 없습니다. 계속하시겠습니까?`,
      confirmText: '예',
      cancelText: '아니오',
      variant: 'danger',
      onConfirm: async () => {
        await deleteMultipleEvents(Array.from(selectedEventIds));
        setSelectedEventIds(new Set());
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Open User Edit Modal
  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser(user);
    setResetPasswordInput('');
    setShowResetPassword(false);
    setResetPwFeedback(null);
    setIsResettingPw(false);
    setCopiedPw(false);
    setUserEditForm({
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      country_code: user.country_code || 'KR',
      city: user.city || '',
      role: user.role,
    });
  };

  // Generate random temporary password for admin to assign
  const handleGenerateTempPassword = () => {
    const chars = '23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ!@#$';
    let newPw = 'Tango';
    for (let i = 0; i < 4; i++) {
      newPw += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    newPw += '!';
    setResetPasswordInput(newPw);
    setResetPwFeedback({
      type: 'success',
      message: `임시 비밀번호 "${newPw}"이(가) 생성되었습니다.`,
    });
  };

  // Direct Password Reset Handler (Immediate with popup confirmation)
  const handleDirectPasswordReset = () => {
    if (!editingUser) return;
    const targetPw = resetPasswordInput.trim();
    if (!targetPw) {
      setResetPwFeedback({
        type: 'error',
        message: '초기화할 새 비밀번호를 입력해주세요.',
      });
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: '비밀번호 초기화 확인 (Confirm Password Reset)',
      message: `사용자 "${editingUser.username}"의 비밀번호를 아래 값으로 초기화하시겠습니까?\n\n새 비밀번호: ${targetPw}\n\n초기화 즉시 데이터베이스에 반영되며, 해당 사용자는 이 비밀번호로 로그인해야 합니다.`,
      confirmText: '비밀번호 초기화 실행 (Reset)',
      cancelText: '취소',
      variant: 'warning',
      onConfirm: async () => {
        setIsResettingPw(true);
        const res = await resetUserPasswordByAdmin(editingUser.id, targetPw);
        setIsResettingPw(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (res.success) {
          setResetPwFeedback({
            type: 'success',
            message: `비밀번호가 "${targetPw}"(으)로 성공적으로 초기화되었습니다!`,
          });
          await loadAllUsers();
        } else {
          setResetPwFeedback({
            type: 'error',
            message: res.error || '비밀번호 초기화에 실패했습니다.',
          });
        }
      },
    });
  };

  // Save User Edit Form (with popup confirmation)
  const handleSaveUserEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const trimmedPw = resetPasswordInput.trim();
    let confirmMsg = `사용자 "${editingUser.username}"의 정보를 변경하시겠습니까?\n이메일: ${userEditForm.email}\n역할: ${userEditForm.role}\n국가/도시: ${userEditForm.country_code} / ${userEditForm.city}`;
    if (trimmedPw) {
      confirmMsg += `\n비밀번호: "${trimmedPw}" (새 비밀번호로 함께 초기화됨)`;
    }

    setConfirmModal({
      isOpen: true,
      title: '사용자 정보 변경 확인 (Confirm User Modification)',
      message: confirmMsg,
      confirmText: '변경 적용 (Save)',
      cancelText: '취소',
      variant: 'primary',
      onConfirm: async () => {
        setUserActionSaving(true);
        const updates: Partial<UserProfile> = {
          username: userEditForm.username.trim(),
          email: userEditForm.email.trim(),
          phone: userEditForm.phone.trim(),
          country_code: userEditForm.country_code.trim().toUpperCase(),
          city: userEditForm.city.trim(),
          role: userEditForm.role,
        };
        if (trimmedPw) {
          updates.password_hash = trimmedPw;
        }
        const res = await updateUserProfile(editingUser.id, updates);
        if (trimmedPw) {
          await resetUserPasswordByAdmin(editingUser.id, trimmedPw);
        }
        setUserActionSaving(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (res.success) {
          setEditingUser(null);
          await loadAllUsers();
        } else {
          alert('사용자 정보 수정 실패: ' + (res.error || 'Unknown error'));
        }
      },
    });
  };

  // Toggle User Role (with popup confirmation)
  const handleToggleUserRole = (user: UserProfile) => {
    const newRole: UserRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    const actionLabel = newRole === 'ADMIN' ? '관리자(ADMIN)로 승격' : '일반 사용자(USER)로 강등';

    setConfirmModal({
      isOpen: true,
      title: '사용자 권한 변경 확인 (Role Change)',
      message: `"${user.username}" 사용자의 권한을 "${actionLabel}"하시겠습니까?`,
      confirmText: `${actionLabel} 진행`,
      cancelText: '취소',
      variant: newRole === 'ADMIN' ? 'warning' : 'danger',
      onConfirm: async () => {
        await updateUserRole(user.id, newRole);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        await loadAllUsers();
      },
    });
  };

  // Delete User (with popup confirmation)
  const handleDeleteUser = (user: UserProfile) => {
    setConfirmModal({
      isOpen: true,
      title: '사용자 영구 삭제 확인 (Delete User)',
      message: `정말로 사용자 "${user.username}" (${user.email}) 계정을 영구 삭제하시겠습니까?\n이 계정과 연관된 프로필 데이터가 완전히 삭제되며 되돌릴 수 없습니다.`,
      confirmText: '영구 삭제 (Delete)',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: async () => {
        await deleteUser(user.id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        if (selectedUserDetails?.id === user.id) {
          setSelectedUserDetails(null);
        }
        await loadAllUsers();
      },
    });
  };

  // --- CRAWLING CHANNEL HANDLERS ---
  const handleOpenAddChannel = () => {
    setEditingChannel(null);
    setChannelForm({
      name: '',
      url: '',
      sourceType: 'FACEBOOK',
      city: '',
      state: '',
      country_code: 'US',
      description: '',
      enabled: true,
    });
    setIsChannelModalOpen(true);
  };

  const handleOpenEditChannel = (channel: CrawlingChannel) => {
    setEditingChannel(channel);
    setChannelForm({
      name: channel.name,
      url: channel.url,
      sourceType: channel.sourceType,
      city: channel.city || '',
      state: channel.state || '',
      country_code: channel.country_code || 'US',
      description: channel.description || '',
      enabled: channel.enabled,
    });
    setIsChannelModalOpen(true);
  };

  const handleSaveChannel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelForm.name.trim() || !channelForm.url.trim()) {
      alert('채널 이름과 URL을 모두 입력해주세요.');
      return;
    }

    if (editingChannel) {
      setConfirmModal({
        isOpen: true,
        title: '등록 사이트 수정 확인 (Edit Site Info)',
        message: `등록 사이트 "${channelForm.name}"의 설정을 변경하시겠습니까?`,
        confirmText: '변경 적용 (Save)',
        cancelText: '취소',
        variant: 'primary',
        onConfirm: () => {
          updateCrawlingChannel(editingChannel.id, {
            name: channelForm.name.trim(),
            url: channelForm.url.trim(),
            sourceType: channelForm.sourceType,
            city: channelForm.city.trim(),
            state: channelForm.state.trim(),
            country_code: channelForm.country_code.trim().toUpperCase(),
            description: channelForm.description.trim(),
            enabled: channelForm.enabled,
          });
          setIsChannelModalOpen(false);
          setEditingChannel(null);
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        },
      });
    } else {
      addCrawlingChannel({
        name: channelForm.name.trim(),
        url: channelForm.url.trim(),
        sourceType: channelForm.sourceType,
        city: channelForm.city.trim(),
        state: channelForm.state.trim(),
        country_code: channelForm.country_code.trim().toUpperCase(),
        description: channelForm.description.trim(),
        enabled: channelForm.enabled,
      });
      setIsChannelModalOpen(false);
    }
  };

  const handleDeleteChannel = (channel: CrawlingChannel) => {
    setConfirmModal({
      isOpen: true,
      title: '등록 사이트 삭제 확인 (Delete Site)',
      message: `정말로 등록 사이트 "${channel.name}"을(를) 삭제하시겠습니까?\n이 사이트는 향후 이벤트 내용 가져오기 대상에서 제외됩니다.`,
      confirmText: '삭제 (Delete)',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: () => {
        deleteCrawlingChannel(channel.id);
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const unexecutedChannelsCount = (cronConfig.channels || []).filter((c) => !c.lastCrawledAt).length;

  const handleDeleteUnexecutedChannels = () => {
    if (unexecutedChannelsCount === 0) {
      alert('최근 가져온 날짜가 "미실행"인 사이트가 없습니다.');
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: '미실행 사이트 일괄 삭제 확인',
      message: `최근 가져온 날짜에 "미실행"으로 표시된 사이트 ${unexecutedChannelsCount}개를 목록에서 모두 삭제하시겠습니까?\n\n수작업으로 실행하지 않았거나 가져온 기록이 없는 사이트가 완전히 제거됩니다.`,
      confirmText: '모두 삭제 (Delete All)',
      cancelText: '취소',
      variant: 'danger',
      onConfirm: () => {
        deleteUnexecutedChannels();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        alert(`✅ 미실행 사이트 ${unexecutedChannelsCount}개가 모두 삭제되었습니다.`);
      },
    });
  };

  const [isResettingDatabase, setIsResettingDatabase] = useState(false);

  // Completely wipe events and fetch records for a clean start
  const handleResetDatabaseAndCrawler = async () => {
    const confirmed = window.confirm(
      '⚠️ [데이터베이스 및 이벤트 가져오기 기록 완전 삭제]\n\n' +
      '기존 등록된 모든 이벤트 데이터와 모든 사이트의 이벤트 가져오기 기록을 영구적으로 삭제하고 초기화하시겠습니까?\n\n' +
      '• 모든 이벤트 데이터(승인/대기/거절) 삭제\n' +
      '• 사이트별 최근 가져온 날짜 및 누적 수 초기화 (미실행 / 0건)\n' +
      '• 모든 화면 및 데이터베이스 날짜 양식: YYYY-MM-DD\n\n' +
      '삭제 후 복구할 수 없습니다. 계속하시겠습니까?'
    );

    if (!confirmed) return;

    setIsResettingDatabase(true);
    try {
      const res = await resetAllEventsAndCrawlRecords();
      resetAllCrawlRecords();
      alert(
        `✅ 데이터베이스의 모든 이벤트와 가져오기 기록이 삭제되었습니다.\n\n` +
        `• 정리된 이벤트: ${res.deletedCount}건\n` +
        `• 사이트별 최근 가져온 기록: 초기화 완료 (미실행)\n` +
        `• 날짜 양식: YYYY-MM-DD 적용 완료`
      );
    } catch (err: any) {
      alert('초기화 중 오류가 발생했습니다: ' + (err?.message || String(err)));
    } finally {
      setIsResettingDatabase(false);
    }
  };

  const [isExtractingSiteEvents, setIsExtractingSiteEvents] = useState(false);
  const [extractingSiteChannelId, setExtractingSiteChannelId] = useState<string | null>(null);

  // Unified Site Event Fetcher: Manual click or Cron execution
  const handleFetchSiteEvents = async (targetChannel?: CrawlingChannel | null) => {
    let targetChannels: CrawlingChannel[] = [];
    if (targetChannel) {
      targetChannels = [{ ...targetChannel, enabled: true }];
      setExtractingSiteChannelId(targetChannel.id);
    } else {
      const active = (cronConfig.channels || []).filter((c) => c.enabled);
      if (active.length > 0) {
        targetChannels = active;
      } else {
        targetChannels = (cronConfig.channels || []).slice(0, 1);
      }
      setIsExtractingSiteEvents(true);
    }

    if (targetChannels.length === 0) {
      alert('등록된 대상 사이트가 없습니다. 먼저 사이트를 등록해주세요.');
      setIsExtractingSiteEvents(false);
      setExtractingSiteChannelId(null);
      return;
    }

    setCrawlerRunning(true);
    setCrawlerResult(null);
    const startTime = Date.now();

    try {
      const res = await runWeeklyCrawler(targetChannels);
      setCrawlerResult(res);

      if (res.updatedChannels && res.updatedChannels.length > 0) {
        updateAllCrawlingChannels(res.updatedChannels);
      }

      const invalidText = res.invalidUrlCount ? `, ${res.invalidUrlCount}개 무효 주소 제외` : '';
      addCronLog({
        id: 'cron_' + Date.now(),
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        itemsDiscovered: res.addedCount + res.duplicateCount + (res.invalidUrlCount || 0),
        itemsAdded: res.addedCount,
        duplicatesBlocked: res.duplicateCount,
        durationMs: Date.now() - startTime,
        message: `[사이트 이벤트 내용 가져오기] (${targetChannels.map((c) => c.name).join(', ')}): ${res.addedCount}건이 승인대상 목록(PENDING)에 등록되었습니다 (${res.duplicateCount}건 중복 제외)${invalidText}.`,
      }, res.updatedChannels);

      // Auto-update Curated Notice automatically upon completion
      const approved = events.filter((e) => e.status === 'APPROVED');
      const cities = Array.from(new Set(approved.map((e) => e.city).filter(Boolean))).slice(0, 4);
      const cityStr = cities.length > 0 ? cities.join(', ') : 'Global Tango Hubs';
      const autoCurated = `${cityStr} verified festivals & milongas updated live (${approved.length} upcoming events verified).`;
      autoUpdateCuratedNotice(autoCurated);

      const channelNames = targetChannels.map((c) => c.name).join(', ');
      const hasWebsiteChannel = targetChannels.some((c) => c.sourceType === 'WEBSITE');
      alert(
        `✅ [사이트 이벤트 내용 가져오기 완료]\n\n` +
        `• 대상 사이트: ${channelNames}${hasWebsiteChannel ? ' (공식 웹사이트 및 서브 사이트 검색 완료)' : ''}\n` +
        `• 승인대상 목록(PENDING) 등록: ${res.addedCount}건\n` +
        `• 최고가 옵션 비용 양식: ~$000 적용 완료\n` +
        `• 중복/기존 등록 이벤트 제외: ${res.duplicateCount}건\n\n` +
        `관리자 사전 승인 질문 없이 이벤트가 [승인대상 목록 (PENDING)] 탭으로 바로 등록되었습니다.\n상단 [이벤트 관리 > PENDING] 탭에서 검토 후 최종 승인(APPROVE)하실 수 있습니다.`
      );
    } catch (err: any) {
      alert(`사이트 이벤트 내용 가져오기 중 오류가 발생했습니다: ${err?.message || String(err)}`);
    } finally {
      setIsExtractingSiteEvents(false);
      setExtractingSiteChannelId(null);
      setCrawlerRunning(false);
    }
  };

  // Backward compatibility alias
  const handleExtractSiteEventsDirectly = handleFetchSiteEvents;
  const handleRunCrawler = () => handleFetchSiteEvents(null);

  // Audit and validate URLs of events currently displayed in Admin Table
  const handleAuditTableUrls = async () => {
    const targetEvents = filteredEventsForAdmin;
    if (targetEvents.length === 0) {
      alert('검사할 이벤트가 없습니다.');
      return;
    }
    setIsValidatingUrls(true);
    try {
      const candidates = targetEvents.map((ev) => ({
        id: ev.id,
        url: ev.source_url || '',
        eventName: ev.event_name,
        startDate: ev.start_date,
      }));
      const results = await validateEventUrls(candidates);
      const newMap: Record<string, { isValid: boolean; reason: string }> = {};
      let invalidCount = 0;
      const invalidIds: string[] = [];

      results.forEach((r) => {
        if (r.id) {
          newMap[r.id] = { isValid: r.isValid, reason: r.reason };
          if (!r.isValid) {
            invalidCount++;
            invalidIds.push(r.id);
          }
        }
      });
      setUrlValidationMap(newMap);

      if (invalidCount > 0) {
        setSelectedEventIds((prev) => new Set([...prev, ...invalidIds]));
        alert(
          `검사 완료: 총 ${targetEvents.length}건 중 사이트 주소가 유효하지 않거나 종료/만료된 이벤트 ${invalidCount}건이 감지되었습니다.\n\n해당 항목들은 테이블에 [URL 오류/종료됨] 붉은 태그로 표시되며, DEL 삭제 선택 목록에 자동 추가되었습니다. 원하시면 [선택 삭제 (DEL)] 버튼을 눌러 일괄 삭제할 수 있습니다.`
        );
      } else {
        alert(`검사 완료: 현재 목록의 ${targetEvents.length}건 모든 웹사이트 주소가 정상적으로 응답하고 있습니다.`);
      }
    } catch (err: any) {
      alert('URL 검사 중 오류가 발생했습니다: ' + (err?.message || err));
    } finally {
      setIsValidatingUrls(false);
    }
  };

  // Trigger immediate automatic Curated Notice regeneration & sync
  const handleTriggerCuratedAutoUpdate = async () => {
    setCuratedAutoUpdating(true);
    setCuratedUpdateSuccessMsg('');
    try {
      const approved = events.filter((e) => e.status === 'APPROVED');
      const cities = Array.from(new Set(approved.map((e) => e.city).filter(Boolean))).slice(0, 5);
      const topFestivals = approved
        .filter((e) => e.event_type === 'FESTIVAL' || e.event_type === 'MARATHON')
        .slice(0, 3)
        .map((e) => e.event_name);

      let generatedNotice = '';
      if (topFestivals.length > 0) {
        generatedNotice = `${topFestivals.join(', ')} & ${cities.slice(0, 3).join(', ')} tango updates live (${approved.length} verified events).`;
      } else if (cities.length > 0) {
        generatedNotice = `${cities.join(', ')} verified tango festivals, marathons, & milongas updated live (${approved.length} active events).`;
      } else {
        generatedNotice = 'Global tango festivals, marathons, and milongas updated weekly in real time.';
      }

      // Query Gemini AI for refined curation copy if online
      try {
        const geminiRes = await callGeminiWebsiteManager(
          `Generate a one-sentence concise Curated Notice for homepage highlight banner based on these active cities: ${cities.join(', ')} and events count: ${approved.length}. Make it attractive, professional, under 120 characters in English or matching global tone.`,
          'CURATE_NOTICE',
          { cities, totalApproved: approved.length }
        );
        if (geminiRes.suggestedConfig?.curatedNotice) {
          generatedNotice = geminiRes.suggestedConfig.curatedNotice;
        } else if (geminiRes.reply && geminiRes.reply.length < 150 && !geminiRes.reply.includes('\n')) {
          generatedNotice = geminiRes.reply.replace(/["*#]/g, '').trim();
        }
      } catch {
        // use data-driven notice
      }

      autoUpdateCuratedNotice(generatedNotice);
      setCuratedUpdateSuccessMsg('✓ Curated Notice가 최신 행사 데이터 및 AI에 의해 자동 업데이트되었습니다!');
      setTimeout(() => setCuratedUpdateSuccessMsg(''), 4500);
    } finally {
      setCuratedAutoUpdating(false);
    }
  };

  // Gemini Website Management prompt submit
  const handleGeminiSubmit = async (customPrompt?: string) => {
    const promptToSend = customPrompt || geminiPrompt;
    if (!promptToSend.trim()) return;

    setGeminiLoading(true);
    setGeminiStatusMessage('');
    try {
      const res = await callGeminiWebsiteManager(promptToSend, 'WEBSITE_CHANGE', {
        totalEvents: events.length,
        approvedEvents: events.filter(e => e.status === 'APPROVED').length,
        pendingEvents: events.filter(e => e.status === 'PENDING').length,
        totalUsers: userList.length,
      });

      setGeminiResponse(res.reply);
      setGeminiSuggestedConfig(res.suggestedConfig || null);
    } catch (err: any) {
      setGeminiResponse('Error calling Gemini: ' + (err.message || 'Unknown error'));
    } finally {
      setGeminiLoading(false);
    }
  };

  // Apply Gemini suggested configuration to live site (Curated Notice ONLY - Top Announcement & Hero Headline are manual only)
  const handleApplyGeminiConfig = () => {
    if (geminiSuggestedConfig) {
      if (geminiSuggestedConfig.curatedNotice) {
        autoUpdateCuratedNotice(geminiSuggestedConfig.curatedNotice);
        setGeminiStatusMessage('Curated Notice가 AI 추천으로 자동 업데이트되었습니다! (Top Announcement와 Main Hero Headline은 수동 관리 설정에 따라 보존되었습니다)');
      } else {
        setGeminiStatusMessage('제안된 내용에 자동 업데이트 대상인 Curated Notice가 포함되어 있지 않습니다.');
      }
      setGeminiSuggestedConfig(null);
    }
  };

  // Filter events for Event Management tab
  const filteredEventsForAdmin = events.filter((ev) => {
    // Exclude any events where CRAWLED date is before 2026-09-06
    const crawled = formatCrawledDate(ev.created_at);
    if (crawled.date && crawled.date !== '—' && crawled.date < '2026-09-06') {
      return false;
    }
    if (eventFilterStatus !== 'ALL' && ev.status !== eventFilterStatus) {
      return false;
    }
    if (eventSearchQuery.trim()) {
      const q = eventSearchQuery.toLowerCase();
      return (
        ev.event_name.toLowerCase().includes(q) ||
        ev.city.toLowerCase().includes(q) ||
        ev.country_code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sort events for Admin Event Management tab
  const sortedEventsForAdmin = useMemo(() => {
    return [...filteredEventsForAdmin].sort((a, b) => {
      let valA = '';
      let valB = '';
      if (adminEventSortField === 'created_at') {
        valA = a.created_at || '';
        valB = b.created_at || '';
      } else if (adminEventSortField === 'start_date') {
        valA = a.start_date || '';
        valB = b.start_date || '';
      } else {
        valA = a.event_name.toLowerCase();
        valB = b.event_name.toLowerCase();
      }
      if (valA < valB) return adminEventSortAsc ? -1 : 1;
      if (valA > valB) return adminEventSortAsc ? 1 : -1;
      return 0;
    });
  }, [filteredEventsForAdmin, adminEventSortField, adminEventSortAsc]);

  // Filter users for User Management tab
  const filteredUsers = userList.filter((u) => {
    if (!userSearchQuery.trim()) return true;
    const q = userSearchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.city.toLowerCase().includes(q) ||
      u.country_code.toLowerCase().includes(q)
    );
  });

  // Helper to determine role rank: ADMIN=0, USER=1
  const getUserRoleRank = (u: UserProfile) => {
    return (u.role === 'ADMIN' || u.username === 'parkinky') ? 0 : 1;
  };

  // Sort users for User Management tab (Default: 1st Role, 2nd Joined)
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      // 1. Role sorting (Default view or when Role header is clicked)
      if (userSortField === 'role') {
        const aRole = getUserRoleRank(a);
        const bRole = getUserRoleRank(b);
        if (aRole !== bRole) {
          return userSortAsc ? (aRole - bRole) : (bRole - aRole);
        }
        // 2차 정렬: Joined (가입일자 오름차순: 과거 -> 최신)
        const aJoined = a.created_at || '';
        const bJoined = b.created_at || '';
        if (aJoined && bJoined) {
          const comp = aJoined.localeCompare(bJoined);
          if (comp !== 0) return comp;
        } else if (aJoined && !bJoined) {
          return -1;
        } else if (!aJoined && bJoined) {
          return 1;
        }
        return (a.username || '').localeCompare(b.username || '');
      }

      let valA = '';
      let valB = '';
      if (userSortField === 'username') {
        valA = (a.username || '').toLowerCase();
        valB = (b.username || '').toLowerCase();
      } else if (userSortField === 'email') {
        valA = (a.email || '').toLowerCase();
        valB = (b.email || '').toLowerCase();
      } else if (userSortField === 'phone') {
        valA = (a.phone || '').toLowerCase();
        valB = (b.phone || '').toLowerCase();
      } else if (userSortField === 'created_at') {
        valA = a.created_at || '';
        valB = b.created_at || '';
      }

      if (valA !== valB) {
        if (valA < valB) return userSortAsc ? -1 : 1;
        if (valA > valB) return userSortAsc ? 1 : -1;
      }

      // Tie-breaker: 1st Role, 2nd Joined (오름차순)
      const aRole = getUserRoleRank(a);
      const bRole = getUserRoleRank(b);
      if (aRole !== bRole) return aRole - bRole;
      return (a.created_at || '').localeCompare(b.created_at || '');
    });
  }, [filteredUsers, userSortField, userSortAsc]);

  // Handle Channel column sorting
  const handleChannelSort = (field: 'city' | 'country_code' | 'sourceType' | 'name' | 'url') => {
    if (channelSortField === field) {
      setChannelSortAsc(!channelSortAsc);
    } else {
      setChannelSortField(field);
      setChannelSortAsc(true);
    }
  };

  // Sort channels for Crawling Channels table (Default: 1st City Ascending, 2nd Name)
  const sortedChannels = useMemo(() => {
    const list = (cronConfig.channels || []).filter((ch) => {
      if (!channelSearchQuery.trim()) return true;
      const q = channelSearchQuery.toLowerCase();
      return (
        ch.name.toLowerCase().includes(q) ||
        ch.url.toLowerCase().includes(q) ||
        (ch.city && ch.city.toLowerCase().includes(q)) ||
        (ch.country_code && ch.country_code.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      let valA = '';
      let valB = '';

      if (channelSortField === 'city') {
        valA = (a.city || '').toLowerCase().trim();
        valB = (b.city || '').toLowerCase().trim();
      } else if (channelSortField === 'country_code') {
        valA = (a.country_code || '').toLowerCase().trim();
        valB = (b.country_code || '').toLowerCase().trim();
      } else if (channelSortField === 'sourceType') {
        valA = (a.sourceType || '').toLowerCase().trim();
        valB = (b.sourceType || '').toLowerCase().trim();
      } else if (channelSortField === 'name') {
        valA = (a.name || '').toLowerCase().trim();
        valB = (b.name || '').toLowerCase().trim();
      } else if (channelSortField === 'url') {
        valA = (a.url || '').toLowerCase().trim();
        valB = (b.url || '').toLowerCase().trim();
      }

      if (valA !== valB) {
        if (!valA && valB) return 1;
        if (valA && !valB) return -1;
        const comp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
        if (comp !== 0) return channelSortAsc ? comp : -comp;
      }

      // 2차 정렬: City -> Name
      const cityComp = (a.city || '').localeCompare(b.city || '');
      if (cityComp !== 0) return cityComp;
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [cronConfig.channels, channelSearchQuery, channelSortField, channelSortAsc]);

  // -------------------------------------------------------------
  // VIEW: ADMIN LOGIN REQUIRED (If not logged in as admin)
  // -------------------------------------------------------------
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-gray-200 rounded-2xl shadow-sm text-gray-900">
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Admin Authentication
          </h3>
          <p className="text-xs text-gray-500">
            Sign in with your Everytango administrator account to manage events, users, scheduled crawler jobs, and website settings.
          </p>
        </div>

        {loginError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        {/* Google Admin Authentication Section */}
        <div className="mb-6 p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-gray-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-red-600" />
              Google Administrator Login
            </span>
            <span className="text-[11px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-200 font-medium">
              Authorized Accounts
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Sign in securely using your administrator Google credentials.
          </p>
          <button
            type="button"
            id="google-admin-login-btn"
            onClick={handleGoogleAdminLogin}
            disabled={loginLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-white hover:bg-gray-100 active:bg-gray-200 text-gray-800 border border-gray-300 text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"/>
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.97 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
            </svg>
            <span>{loginLoading ? 'Authenticating with Google...' : 'Sign in with Google Account'}</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center my-4">
          <div className="border-t border-gray-200 w-full" />
          <span className="bg-white px-3 text-[11px] text-gray-400 font-medium uppercase tracking-wider">or sign in with credentials</span>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleAdminLogin(); }} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Admin Username / ID
            </label>
            <input
              type="text"
              value={adminIdInput}
              onChange={(e) => setAdminIdInput(e.target.value)}
              placeholder="Enter admin ID"
              autoComplete="username"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={adminPwInput}
              onChange={(e) => setAdminPwInput(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              required
              className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-2.5 px-4 rounded-lg bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {loginLoading ? 'Authenticating...' : 'Sign In as Admin'}
          </button>

          {onRequestExit && (
            <button
              type="button"
              onClick={onRequestExit}
              className="w-full py-2 px-3 text-xs text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Admin Dashboard (Return to Home)</span>
            </button>
          )}
        </form>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: AUTHENTICATED ADMINISTRATOR DASHBOARD
  // -------------------------------------------------------------
  return (
    <div id="admin-dashboard-root" className="max-w-7xl mx-auto my-6 space-y-6">
      
      {/* Top Admin Header Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-bold border border-red-100">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>SUPER ADMIN CONSOLE</span>
            </span>
            <span className="text-xs text-gray-700 font-mono bg-gray-50 px-2.5 py-0.5 rounded-md border border-gray-200">
              ID: <strong className="text-gray-900">{userProfile?.username || 'parkinky'}</strong>
            </span>
            <span className="text-xs font-mono bg-emerald-50 text-emerald-800 px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-600" />
              <span>{currentUser?.email || userProfile?.email || 'parkinky@gmail.com'}</span>
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Everytango Admin Console
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Event moderation, complete user directory, crawler scheduler, and Gemini AI website configuration.
          </p>
        </div>

        {/* Quick KPI Badges & Logout */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs flex items-center gap-2">
            <Calendar className="w-4 h-4 text-red-600" />
            <span>Events: <strong className="text-gray-900 font-bold">{events.length}</strong></span>
          </div>
          <div className="px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-xs flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            <span>Users: <strong className="text-gray-900 font-bold">{userList.length}</strong></span>
          </div>
          {onRequestExit && (
            <button
              onClick={onRequestExit}
              className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
              title="Exit Admin Dashboard"
            >
              <LogOut className="w-3.5 h-3.5 text-gray-600" />
              <span>Exit Dashboard</span>
            </button>
          )}
          <button
            onClick={logout}
            className="px-3 py-2 rounded-lg bg-white hover:bg-gray-100 text-gray-600 border border-gray-200 text-xs font-semibold transition-colors cursor-pointer"
            title="Sign Out"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('events')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'events'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4 text-red-600" />
          <span>Events ({events.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('users'); loadAllUsers(); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>User Directory ({userList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cron')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'cron'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-600" />
          <span>사이트 이벤트 가져오기 (Cron)</span>
        </button>

        <button
          onClick={() => setActiveTab('gemini')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'gemini'
              ? 'bg-red-50 text-red-700 border border-red-200 shadow-xs'
              : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
          }`}
        >
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span>Gemini AI Manager</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: EVENT MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'events' && (
        <div className="space-y-4">
          
          {/* Controls Bar: Search, Status Filter & Add Button */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-gray-500 mr-1">Status:</span>
              {(['ALL', 'APPROVED', 'PENDING', 'REJECTED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setEventFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    eventFilterStatus === st
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'APPROVED' ? 'Approved' : st === 'PENDING' ? 'Pending' : 'Rejected'}
                  <span className="ml-1 text-[10px] opacity-75">
                    ({st === 'ALL' ? events.length : events.filter(e => e.status === st).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by event, city..."
                  value={eventSearchQuery}
                  onChange={(e) => setEventSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
                />
              </div>

              {/* Export to Excel Button */}
              <button
                onClick={() => exportEventsToExcel(sortedEventsForAdmin, 'EveryTango_Admin_Events.xlsx')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
                title="Export filtered events to Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>

              {/* Sync Authentic Venues Button */}
              <button
                onClick={async () => {
                  setIsSyncingVenues(true);
                  try {
                    const res = await syncAuthenticVenues();
                    if (res.repairedCount > 0) {
                      alert(`총 ${res.repairedCount}건의 이벤트 주소 및 국가 정보가 실제 탱고 명소로 보정 및 동기화되었습니다.`);
                    } else {
                      alert('모든 이벤트의 주소 및 국가 정보가 이미 실제 탱고 명소로 정확하게 등록되어 있습니다.');
                    }
                  } catch (e: any) {
                    alert('주소 동기화 중 오류가 발생했습니다: ' + (e?.message || e));
                  } finally {
                    setIsSyncingVenues(false);
                  }
                }}
                disabled={isSyncingVenues}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                title="일괄 주소/국가 검증 및 실제 탱고 명소로 동기화"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingVenues ? 'animate-spin' : ''}`} />
                <span>{isSyncingVenues ? '동기화 중...' : 'Sync Venues'}</span>
              </button>

              {/* Validate URLs Button */}
              <button
                onClick={handleAuditTableUrls}
                disabled={isValidatingUrls}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                title="현재 목록 이벤트들의 웹사이트 주소 유효성 및 활성 상태 일괄 검사"
              >
                <Globe className={`w-3.5 h-3.5 ${isValidatingUrls ? 'animate-spin' : ''}`} />
                <span>{isValidatingUrls ? '주소 검사 중...' : 'URL 검사'}</span>
              </button>

              {/* Add New Event Direct Button */}
              <button
                onClick={() => setIsAddEventModalOpen(true)}
                className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Event</span>
              </button>
            </div>
          </div>

          {/* Event Table (Single screen compact layout: Dates & Address formatted in 2 lines, table-fixed to eliminate horizontal scrolling) */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed text-left text-xs text-gray-700 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 uppercase font-semibold text-[11px]">
                    <th 
                      onClick={() => {
                        if (adminEventSortField === 'start_date') {
                          setAdminEventSortAsc(!adminEventSortAsc);
                        } else {
                          setAdminEventSortField('start_date');
                          setAdminEventSortAsc(true);
                        }
                      }}
                      className="w-[11.8%] py-2.5 pl-2.5 pr-0.5 cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title="행사일 기준 정렬"
                    >
                      <div className="flex items-center gap-1">
                        <span>Date</span>
                        {adminEventSortField === 'start_date' && (
                          <span className="text-red-600 font-bold">{adminEventSortAsc ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>

                    {/* 검색된 일자 컬럼 (Crawled / Discovered Date) */}
                    <th 
                      onClick={() => {
                        if (adminEventSortField === 'created_at') {
                          setAdminEventSortAsc(!adminEventSortAsc);
                        } else {
                          setAdminEventSortField('created_at');
                          setAdminEventSortAsc(false);
                        }
                      }}
                      className="w-[7.6%] py-2.5 px-1 cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title="검색된 일자 기준 정렬"
                    >
                      <div className="flex items-center gap-1">
                        <span>CRAWLED</span>
                        {adminEventSortField === 'created_at' ? (
                          <span className="text-red-600 font-bold">{adminEventSortAsc ? '↑' : '↓'}</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>

                    <th className="w-[5.5%] py-2.5 px-1 text-center">Type</th>

                    <th 
                      onClick={() => {
                        if (adminEventSortField === 'event_name') {
                          setAdminEventSortAsc(!adminEventSortAsc);
                        } else {
                          setAdminEventSortField('event_name');
                          setAdminEventSortAsc(true);
                        }
                      }}
                      className="w-[22.4%] py-2.5 pl-4 pr-2 cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title="행사명 기준 정렬"
                    >
                      <div className="flex items-center gap-1">
                        <span>Event Name</span>
                        {adminEventSortField === 'event_name' && (
                          <span className="text-red-600 font-bold">{adminEventSortAsc ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </th>

                    <th className="w-[19.2%] py-2.5 px-2">Location & Address</th>
                    <th className="w-[5%] py-2.5 px-1 text-right">Price</th>
                    <th className="w-[7%] py-2.5 px-1 text-center">Status</th>
                    <th className="w-[3.5%] py-2.5 px-1 text-center hidden sm:table-cell">Src</th>
                    <th className="w-[12%] py-2.5 px-2 text-right">Actions</th>

                    {/* DEL Header Button Column */}
                    <th className="w-[6%] py-1.5 px-1 text-center align-middle">
                      <button
                        type="button"
                        onClick={handleBatchDeleteClick}
                        className={`w-full max-w-[54px] mx-auto py-1 px-1 rounded font-black text-[11px] tracking-wider shadow-xs transition-all cursor-pointer flex items-center justify-center gap-0.5 ${
                          selectedEventIds.size > 0
                            ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse ring-2 ring-red-400'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                        }`}
                        title="선택한 라인 영구 삭제 (DEL)"
                      >
                        <Trash2 className="w-3 h-3 shrink-0" />
                        <span>DEL</span>
                        {selectedEventIds.size > 0 && (
                          <span className="ml-0.5 px-1 py-0.2 rounded-full bg-white text-red-700 text-[9px] font-black">
                            {selectedEventIds.size}
                          </span>
                        )}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedEventsForAdmin.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-gray-400 text-xs">
                        No events found matching current criteria.
                      </td>
                    </tr>
                  ) : (
                    sortedEventsForAdmin.map((ev) => {
                      const { start, end } = formatTwoLineDate(ev.start_date, ev.end_date);
                      const addr = formatTwoLineAddress(ev);
                      const usd = convertPriceToUSD(ev.price, ev.is_free, ev.country_code);
                      const crawled = formatCrawledDate(ev.created_at);

                      return (
                        <tr key={ev.id} className={`hover:bg-gray-50/80 transition-colors ${selectedEventIds.has(ev.id) ? 'bg-red-50/50' : ''}`}>
                          
                          {/* Date (2 Lines: Start date, ~ End date for compact single screen view) */}
                          <td className="py-2.5 pl-2.5 pr-0.5 whitespace-nowrap font-medium align-middle">
                            <div className="flex flex-col font-mono text-xs leading-tight">
                              <span className="text-gray-900 font-semibold">{start}</span>
                              {end && <span className="text-gray-500 text-[10px]">{end}</span>}
                            </div>
                          </td>

                          {/* 검색된 일자 (Discovered / Crawled Date) */}
                          <td className="py-2.5 px-1 whitespace-nowrap font-medium align-middle">
                            <div className="flex flex-col font-mono text-[11px] leading-tight">
                              <span className="text-gray-900 font-semibold" title={crawled.date}>
                                {crawled.date}
                              </span>
                              {crawled.time && (
                                <span className="text-gray-500 text-[10px]" title={crawled.time}>
                                  {crawled.time}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Type */}
                          <td className="py-2.5 px-1 whitespace-nowrap text-center align-middle">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                              {ev.event_type}
                            </span>
                          </td>

                          {/* Event Name & Link */}
                          <td className="py-2.5 pl-4.5 pr-2.5 font-bold text-gray-900 align-middle">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="truncate block" title={ev.event_name}>{ev.event_name}</span>
                              <EventSourceLink event={ev} showDropdown={false} />
                              {urlValidationMap[ev.id] && !urlValidationMap[ev.id].isValid && (
                                <span
                                  className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold border border-red-300 shrink-0 cursor-help whitespace-nowrap"
                                  title={`[웹사이트 주소 무효 / 행사 종료]: ${urlValidationMap[ev.id].reason}`}
                                >
                                  무효 URL
                                </span>
                              )}
                              {urlValidationMap[ev.id] && urlValidationMap[ev.id].isValid && (
                                <span
                                  className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-300 shrink-0 cursor-help whitespace-nowrap"
                                  title="사이트 주소 정상 확인 완료"
                                >
                                  정상
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Location & Address in 2 lines */}
                          <td className="py-2.5 px-2 leading-tight align-middle">
                            <div className="font-semibold text-gray-900 truncate" title={addr.locationLine}>
                              {addr.locationLine}
                            </div>
                            <div className="text-[10px] text-gray-500 truncate" title={addr.venueLine}>
                              {addr.venueLine}
                            </div>
                          </td>

                          {/* Price in USD */}
                          <td className="py-2.5 px-1 whitespace-nowrap font-semibold text-right align-middle">
                            <div className="leading-tight">
                              <span className={`font-mono text-xs font-bold ${usd.isFree ? 'text-green-600' : 'text-gray-900'}`}>
                                {usd.usdFormatted}
                              </span>
                              {usd.originalFormatted && usd.originalFormatted !== usd.usdFormatted && (
                                <div className="text-[10px] text-gray-400 font-mono font-normal truncate" title={usd.originalFormatted}>
                                  ({usd.originalFormatted})
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-2.5 px-1 whitespace-nowrap text-center align-middle">
                            {ev.status === 'APPROVED' && (
                              <span className="px-1.5 py-0.5 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200">
                                APPROVED
                              </span>
                            )}
                            {ev.status === 'PENDING' && (
                              <span className="px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                PENDING
                              </span>
                            )}
                            {ev.status === 'REJECTED' && (
                              <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-[10px] font-bold border border-gray-200">
                                REJECTED
                              </span>
                            )}
                          </td>

                          {/* Source */}
                          <td className="py-2.5 px-1 text-center hidden sm:table-cell align-middle text-[11px]" title={ev.source_type === 'AUTO_CRAWLED' ? 'Auto Crawler' : 'Manual'}>
                            {ev.source_type === 'AUTO_CRAWLED' ? '🤖' : '✍️'}
                          </td>

                          {/* Actions: Delete & Approve/Reject */}
                          <td className="py-2.5 px-2 whitespace-nowrap text-right align-middle">
                            <div className="flex items-center justify-end gap-1">
                              {ev.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => {
                                      const authorEmail = ev.submitted_by_email || (ev.submitted_by && ev.submitted_by.includes('@') ? ev.submitted_by : '');
                                      setConfirmModal({
                                        isOpen: true,
                                        title: '이벤트 승인 및 게시 확인 (Approve Event)',
                                        message: `"${ev.event_name}" 이벤트를 승인하고 공개 일정표에 즉시 게시하시겠습니까?${
                                          authorEmail
                                            ? `\n\n✉️ [자동 영문 회신 메일 발송 안내]\n승인 처리 완료 즉시 작성자(${authorEmail})에게 영문 승인 완료 및 즉시 게시 안내 회신 메일이 자동 발송됩니다.`
                                            : '\n\n✉️ [자동 영문 회신 메일 발송 안내]\n승인 완료 즉시 작성자의 이메일로 영문 승인 완료 및 즉시 게시 안내 회신 메일이 자동 발송됩니다.'
                                        }`,
                                        confirmText: '승인 및 메일 발송',
                                        cancelText: '취소',
                                        variant: 'primary',
                                        onConfirm: async () => {
                                          const res = await approveEvent(ev.id);
                                          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                          if (res.emailSent) {
                                            setApprovalEmailSuccessModal({
                                              isOpen: true,
                                              eventName: ev.event_name,
                                              recipientEmail: res.emailRecipient || authorEmail || 'Author',
                                              emailLog: res.emailLog,
                                            });
                                          }
                                        },
                                      });
                                    }}
                                    className="px-2 py-0.5 rounded bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-colors cursor-pointer inline-flex items-center gap-1"
                                    title="Approve and Publish (Sends automated English reply email to author)"
                                  >
                                    <Mail className="w-2.5 h-2.5" />
                                    <span>승인</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setConfirmModal({
                                        isOpen: true,
                                        title: '이벤트 반려 확인 (Reject Event)',
                                        message: `"${ev.event_name}" 이벤트를 등록 반려 처리하시겠습니까?`,
                                        confirmText: '반려 처리',
                                        cancelText: '취소',
                                        variant: 'warning',
                                        onConfirm: () => {
                                          rejectEvent(ev.id);
                                          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                        },
                                      });
                                    }}
                                    className="px-1.5 py-0.5 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 text-[10px] font-semibold transition-colors cursor-pointer"
                                    title="Reject"
                                  >
                                    반려
                                  </button>
                                </>
                              )}

                              {ev.status === 'REJECTED' && (
                                <button
                                  onClick={() => {
                                    const authorEmail = ev.submitted_by_email || (ev.submitted_by && ev.submitted_by.includes('@') ? ev.submitted_by : '');
                                    setConfirmModal({
                                      isOpen: true,
                                      title: '이벤트 재승인 확인 (Re-approve Event)',
                                      message: `반려되었던 "${ev.event_name}" 이벤트를 다시 승인하여 공개 일정에 게시하시겠습니까?${
                                        authorEmail
                                          ? `\n\n✉️ [자동 영문 회신 메일 발송 안내]\n승인 처리 완료 즉시 작성자(${authorEmail})에게 영문 승인 완료 및 즉시 게시 안내 회신 메일이 자동 발송됩니다.`
                                          : ''
                                      }`,
                                      confirmText: '재승인 및 게시',
                                      cancelText: '취소',
                                      variant: 'primary',
                                      onConfirm: async () => {
                                        const res = await approveEvent(ev.id);
                                        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                                        if (res.emailSent) {
                                          setApprovalEmailSuccessModal({
                                            isOpen: true,
                                            eventName: ev.event_name,
                                            recipientEmail: res.emailRecipient || authorEmail || 'Author',
                                            emailLog: res.emailLog,
                                          });
                                        }
                                      },
                                    });
                                  }}
                                  className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 text-[10px] font-bold cursor-pointer inline-flex items-center gap-1"
                                  title="Re-approve and Publish"
                                >
                                  <Mail className="w-2.5 h-2.5" />
                                  <span>재승인</span>
                                </button>
                              )}

                              {/* Edit Event Content Button */}
                              {onEditEvent && (
                                <button
                                  onClick={() => onEditEvent(ev.id)}
                                  className="p-1 rounded-md hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors inline-block cursor-pointer"
                                  title="Edit Event Content (이벤트 내용 편집)"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Delete Event Button */}
                              <button
                                onClick={() => handleDeleteEvent(ev.id, ev.event_name)}
                                className="p-1 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors inline-block cursor-pointer"
                                title="Delete Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* DEL Checkbox Column */}
                          <td className="py-2.5 px-1 whitespace-nowrap text-center align-middle">
                            <input
                              type="checkbox"
                              checked={selectedEventIds.has(ev.id)}
                              onChange={(e) => toggleSelectEvent(ev.id, e.target.checked)}
                              className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer accent-red-600 transition-colors"
                              aria-label={`Select ${ev.event_name} for deletion`}
                            />
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Direct Add Event Modal */}
          {isAddEventModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-red-600" />
                    <h3 className="font-extrabold text-lg text-gray-900">Add New Event</h3>
                  </div>
                  <button
                    onClick={() => setIsAddEventModalOpen(false)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateEventSubmit} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Event Name *</label>
                    <input
                      type="text"
                      required
                      value={newEventForm.event_name}
                      onChange={(e) => setNewEventForm({ ...newEventForm, event_name: e.target.value })}
                      placeholder="e.g. 2026 Seoul International Tango Marathon"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Event Type</label>
                      <select
                        value={newEventForm.event_type}
                        onChange={(e) => setNewEventForm({ ...newEventForm, event_type: e.target.value as EventType })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      >
                        <option value="FESTIVAL">FESTIVAL</option>
                        <option value="MARATHON">MARATHON</option>
                        <option value="ENCUENTRO">ENCUENTRO</option>
                        <option value="WORKSHOP">WORKSHOP</option>
                        <option value="MILONGA">MILONGA</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Initial Status</label>
                      <select
                        value={newEventForm.status}
                        onChange={(e) => setNewEventForm({ ...newEventForm, status: e.target.value as EventStatus })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      >
                        <option value="APPROVED">APPROVED (Publish immediately)</option>
                        <option value="PENDING">PENDING (Review required)</option>
                      </select>
                    </div>
                  </div>

                  {/* 2-line Dates: Start Date & End Date */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        required
                        value={newEventForm.start_date}
                        onChange={(e) => setNewEventForm({ ...newEventForm, start_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        required
                        value={newEventForm.end_date}
                        onChange={(e) => setNewEventForm({ ...newEventForm, end_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Country Code (2-letters) *</label>
                      <select
                        required
                        value={newEventForm.country_code}
                        onChange={(e) => setNewEventForm({ ...newEventForm, country_code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-900 focus:bg-white focus:border-red-600 focus:outline-none"
                      >
                        {COUNTRY_LIST.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                        {newEventForm.country_code && !COUNTRY_LIST.some((c) => c.code === newEventForm.country_code) && (
                          <option value={newEventForm.country_code}>{newEventForm.country_code}</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">City *</label>
                      <input
                        type="text"
                        required
                        value={newEventForm.city}
                        onChange={(e) => setNewEventForm({ ...newEventForm, city: e.target.value })}
                        placeholder="Seoul"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Price</label>
                      <input
                        type="text"
                        value={newEventForm.price}
                        onChange={(e) => setNewEventForm({ ...newEventForm, price: e.target.value })}
                        placeholder="$120 or Free"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={newEventForm.address}
                      onChange={(e) => setNewEventForm({ ...newEventForm, address: e.target.value })}
                      placeholder="Gangnam Tango Studio, Seoul"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Official Website URL</label>
                    <input
                      type="url"
                      value={newEventForm.source_url}
                      onChange={(e) => setNewEventForm({ ...newEventForm, source_url: e.target.value })}
                      placeholder="https://example.com/event"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Notes & Details</label>
                    <textarea
                      rows={2}
                      value={newEventForm.notes}
                      onChange={(e) => setNewEventForm({ ...newEventForm, notes: e.target.value })}
                      placeholder="DJ lineup, schedule details, registration info..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:bg-white focus:border-red-600"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setIsAddEventModalOpen(false)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs cursor-pointer"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: USER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          {/* User Controls & Search */}
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-gray-900">User Directory & Role Administration</h3>
              <p className="text-xs text-gray-500">
                View registered user IDs, usernames, emails, phone numbers, country, city, roles, join dates, and security questions.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search username, email, city..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:bg-white text-gray-900"
                />
              </div>

              <button
                onClick={loadAllUsers}
                disabled={usersLoading}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors cursor-pointer"
                title="Refresh User List"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${usersLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* User Table (Single screen table-fixed layout without horizontal scroll) */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed text-left text-xs text-gray-700 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-600 uppercase font-semibold text-[11px]">
                    <th className="w-[10%] hidden md:table-cell py-2.5 px-2">UID</th>
                    <th 
                      onClick={() => {
                        if (userSortField === 'username') {
                          setUserSortAsc(!userSortAsc);
                        } else {
                          setUserSortField('username');
                          setUserSortAsc(true);
                        }
                      }}
                      className="w-[18%] py-2.5 px-2.5 cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title="Username 기준 정렬"
                    >
                      <div className="flex items-center gap-1">
                        <span>Username</span>
                        {userSortField === 'username' ? (
                          <span className="text-red-600 font-bold">{userSortAsc ? '↑' : '↓'}</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        if (userSortField === 'email') {
                          setUserSortAsc(!userSortAsc);
                        } else {
                          setUserSortField('email');
                          setUserSortAsc(true);
                        }
                      }}
                      className="w-[22%] py-2.5 px-2.5 cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title="Email 기준 정렬"
                    >
                      <div className="flex items-center gap-1">
                        <span>Email</span>
                        {userSortField === 'email' ? (
                          <span className="text-red-600 font-bold">{userSortAsc ? '↑' : '↓'}</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        if (userSortField === 'phone') {
                          setUserSortAsc(!userSortAsc);
                        } else {
                          setUserSortField('phone');
                          setUserSortAsc(true);
                        }
                      }}
                      className="w-[12%] hidden sm:table-cell py-2.5 px-2 cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title="Phone 기준 정렬"
                    >
                      <div className="flex items-center gap-1">
                        <span>Phone</span>
                        {userSortField === 'phone' ? (
                          <span className="text-red-600 font-bold">{userSortAsc ? '↑' : '↓'}</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th className="w-[14%] py-2.5 px-2.5">Country / City</th>
                    <th 
                      onClick={() => {
                        if (userSortField === 'role') {
                          setUserSortAsc(!userSortAsc);
                        } else {
                          setUserSortField('role');
                          setUserSortAsc(true);
                        }
                      }}
                      className="w-[8%] py-2.5 px-1.5 text-center cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title="1차 정렬: Role (클릭 시 ADMIN ↔ USER 순서 전환)"
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Role</span>
                        {userSortField === 'role' ? (
                          <span className="text-red-600 font-bold">{userSortAsc ? '↑' : '↓'}</span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th 
                      onClick={() => {
                        if (userSortField === 'created_at') {
                          setUserSortAsc(!userSortAsc);
                        } else {
                          setUserSortField('created_at');
                          setUserSortAsc(false);
                        }
                      }}
                      className="w-[9%] hidden lg:table-cell py-2.5 px-2 text-center cursor-pointer hover:text-gray-900 transition-colors select-none"
                      title={userSortField === 'role' ? "2차 정렬: 가입일 오름차순 (클릭 시 가입일 1차 정렬로 전환)" : "Joined 가입일자 기준 정렬"}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Joined</span>
                        {userSortField === 'created_at' ? (
                          <span className="text-red-600 font-bold">{userSortAsc ? '↑' : '↓'}</span>
                        ) : userSortField === 'role' ? (
                          <span className="text-red-600/80 font-bold text-[10px] flex items-center gap-0.5" title="2차 정렬: 가입일 오름차순">
                            <span className="text-[9px] text-gray-400 font-normal">2차</span>↑
                          </span>
                        ) : (
                          <ArrowUpDown className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </th>
                    <th className="w-[17%] py-2.5 px-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sortedUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400 text-xs">
                        No registered users found.
                      </td>
                    </tr>
                  ) : (
                    sortedUsers.map((u) => {
                      const isAdminRole = u.role === 'ADMIN' || u.username === 'parkinky';
                      return (
                        <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-2.5 px-2 font-mono text-[10px] text-gray-500 hidden md:table-cell truncate align-middle" title={u.id}>
                            {u.id}
                          </td>
                          <td className="py-2.5 px-2.5 font-bold text-gray-900 align-middle">
                            <div className="flex items-center gap-1 min-w-0">
                              <span className="truncate" title={u.username}>{u.username}</span>
                              {u.username === 'parkinky' && (
                                <span className="px-1 py-0.2 rounded bg-red-100 text-red-700 text-[9px] font-bold shrink-0">
                                  MASTER
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-2.5 px-2.5 text-gray-600 align-middle">
                            <span className="truncate block" title={u.email}>{u.email}</span>
                          </td>
                          <td className="py-2.5 px-2 font-mono text-gray-600 hidden sm:table-cell align-middle">
                            <span className="truncate block" title={u.phone || '—'}>{u.phone || '—'}</span>
                          </td>
                          <td className="py-2.5 px-2.5 text-gray-600 align-middle">
                            <div className="truncate" title={`${u.country_code} ${u.city || ''}`}>
                              <span className="font-mono font-bold text-gray-800 mr-1">{u.country_code}</span>
                              <span>{u.city || '—'}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-1.5 text-center align-middle">
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                isAdminRole
                                  ? 'bg-red-50 text-red-700 border-red-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}
                            >
                              {isAdminRole ? 'ADMIN' : 'USER'}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 text-[11px] text-gray-500 hidden lg:table-cell text-center align-middle font-mono">
                            {u.created_at ? (
                              <span title={formatDateTimeToCST(u.created_at)}>{formatDateToCST(u.created_at)}</span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-2.5 px-2 text-right whitespace-nowrap align-middle">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedUserDetails(u)}
                                className="px-1.5 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-semibold cursor-pointer"
                                title="User Details"
                              >
                                Details
                              </button>

                              {/* Edit User Information Button */}
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="px-1.5 py-0.5 rounded bg-amber-50 hover:bg-amber-100 text-amber-700 text-[10px] font-semibold border border-amber-200 inline-flex items-center gap-0.5 cursor-pointer"
                                title="사용자 정보 수정 (Edit User Info)"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>수정</span>
                              </button>

                              {u.username !== 'parkinky' && (
                                <button
                                  onClick={() => handleToggleUserRole(u)}
                                  className="px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-semibold border border-blue-200 cursor-pointer"
                                  title={u.role === 'ADMIN' ? 'Demote to USER' : 'Promote to ADMIN'}
                                >
                                  {u.role === 'ADMIN' ? 'Demote' : 'Promote'}
                                </button>
                              )}

                              {u.username !== 'parkinky' && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1 rounded text-gray-400 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center"
                                  title="Delete User (사용자 삭제)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* User Details Drawer Modal */}
          {selectedUserDetails && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4 text-xs text-gray-800">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-base text-gray-900">
                      User Full Profile ({selectedUserDetails.username})
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedUserDetails(null)}
                    className="p-1 rounded-md text-gray-400 hover:text-gray-900 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2.5 bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">UID:</span>
                    <span className="font-mono text-gray-900">{selectedUserDetails.id}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Username:</span>
                    <span className="font-bold text-gray-900">{selectedUserDetails.username}</span>
                  </div>
                  {(selectedUserDetails.first_name || selectedUserDetails.last_name) && (
                    <div className="flex justify-between py-1 border-b border-gray-200">
                      <span className="font-semibold text-gray-600">Full Name:</span>
                      <span className="font-medium text-gray-900">
                        {[selectedUserDetails.first_name, selectedUserDetails.last_name].filter(Boolean).join(' ')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Email:</span>
                    <span className="text-gray-900">{selectedUserDetails.email}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Phone:</span>
                    <span className="font-mono text-gray-900">{selectedUserDetails.phone || 'Not registered'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Location:</span>
                    <span className="text-gray-900">
                      {[selectedUserDetails.city, selectedUserDetails.state, selectedUserDetails.country_code].filter(Boolean).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-gray-200">
                    <span className="font-semibold text-gray-600">Access Role:</span>
                    <span className="font-bold text-red-600">{selectedUserDetails.role}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="font-semibold text-gray-600">Created At:</span>
                    <span className="text-gray-700 font-mono text-xs">{formatDateTimeToCST(selectedUserDetails.created_at)}</span>
                  </div>
                </div>

                {/* Security Questions Status */}
                <div>
                  <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    <span>3-Step Password Recovery Security Questions</span>
                  </h4>
                  {selectedUserDetails.security_questions && selectedUserDetails.security_questions.length > 0 ? (
                    <div className="space-y-1.5 bg-amber-50/60 p-3 rounded-lg border border-amber-100">
                      {selectedUserDetails.security_questions.map((q, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="w-4 h-4 rounded-full bg-amber-200 text-amber-800 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {q.question_number}
                          </span>
                          <div>
                            <p className="font-semibold text-gray-800">{q.question_text}</p>
                            <p className="text-[10px] font-mono text-gray-500">Hash: {q.answer_hash.substring(0, 16)}...</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      Security questions have not been set or registered via social login.
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const target = selectedUserDetails;
                        setSelectedUserDetails(null);
                        handleOpenEditUser(target);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>정보 수정 (Edit)</span>
                    </button>
                    {selectedUserDetails.username !== 'parkinky' && (
                      <button
                        onClick={() => {
                          const target = selectedUserDetails;
                          handleDeleteUser(target);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>삭제 (Delete)</span>
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedUserDetails(null)}
                    className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* User Edit Modal */}
          {editingUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs text-gray-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900">
                        사용자 정보 수정 (Edit User)
                      </h3>
                      <p className="text-[11px] text-gray-500 font-mono">UID: {editingUser.id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveUserEdit} className="space-y-3.5">
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      사용자명 (Username) *
                    </label>
                    <input
                      type="text"
                      required
                      value={userEditForm.username}
                      onChange={(e) => setUserEditForm({ ...userEditForm, username: e.target.value })}
                      placeholder="e.g. TangoMaster"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-amber-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      이메일 주소 (Email Address) *
                    </label>
                    <input
                      type="email"
                      required
                      value={userEditForm.email}
                      onChange={(e) => setUserEditForm({ ...userEditForm, email: e.target.value })}
                      placeholder="user@example.com"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-amber-600 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        전화번호 (Phone)
                      </label>
                      <input
                        type="text"
                        value={userEditForm.phone}
                        onChange={(e) => setUserEditForm({ ...userEditForm, phone: e.target.value })}
                        placeholder="e.g. 010-1234-5678"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-amber-600 focus:outline-none transition-colors font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        권한 역할 (Role) *
                      </label>
                      <select
                        value={userEditForm.role}
                        onChange={(e) => setUserEditForm({ ...userEditForm, role: e.target.value as UserRole })}
                        disabled={editingUser.username === 'parkinky'}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-amber-600 focus:outline-none transition-colors font-semibold"
                      >
                        <option value="USER">USER (일반 사용자)</option>
                        <option value="ADMIN">ADMIN (최고 관리자)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        국가 코드 (Country Code)
                      </label>
                      <select
                        value={userEditForm.country_code}
                        onChange={(e) => setUserEditForm({ ...userEditForm, country_code: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-900 focus:bg-white focus:border-amber-600 focus:outline-none transition-colors"
                      >
                        {COUNTRY_LIST.map((c) => (
                          <option key={c.code} value={c.code}>
                            {c.name}
                          </option>
                        ))}
                        {userEditForm.country_code && !COUNTRY_LIST.some((c) => c.code === userEditForm.country_code) && (
                          <option value={userEditForm.country_code}>{userEditForm.country_code}</option>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">
                        도시명 (City)
                      </label>
                      <input
                        type="text"
                        value={userEditForm.city}
                        onChange={(e) => setUserEditForm({ ...userEditForm, city: e.target.value })}
                        placeholder="Seoul, Buenos Aires..."
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-amber-600 focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  {/* Password Reset Section for Admin */}
                  <div className="p-3.5 bg-gradient-to-br from-amber-50/70 to-orange-50/40 rounded-xl border border-amber-200/90 space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                          <KeyRound className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-gray-900 text-xs">
                            비밀번호 초기화 (Reset Password)
                          </span>
                          <span className="text-[10px] bg-amber-200/70 text-amber-900 font-semibold px-1.5 py-0.5 rounded">
                            관리자 전용
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setResetPasswordInput('12345678');
                            setResetPwFeedback({ type: 'success', message: '비밀번호 기본값 "12345678"이 입력되었습니다.' });
                          }}
                          className="px-2 py-1 rounded bg-white hover:bg-gray-100 border border-gray-200 text-[10px] font-semibold text-gray-700 cursor-pointer transition-colors"
                          title="기본 비밀번호 12345678 입력"
                        >
                          기본값 12345678
                        </button>
                        <button
                          type="button"
                          onClick={handleGenerateTempPassword}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shadow-2xs cursor-pointer inline-flex items-center gap-1 transition-colors"
                          title="랜덤 임시 비밀번호 생성"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>임시비번 생성</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-medium text-gray-700">
                        초기화할 새 비밀번호 (New Password)
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showResetPassword ? 'text' : 'password'}
                            value={resetPasswordInput}
                            onChange={(e) => {
                              setResetPasswordInput(e.target.value);
                              if (resetPwFeedback) setResetPwFeedback(null);
                            }}
                            placeholder="새 비밀번호 입력 또는 상단 생성 버튼 클릭"
                            className="w-full pl-3 pr-20 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:border-amber-600 focus:outline-none transition-colors font-mono"
                          />
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {resetPasswordInput && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(resetPasswordInput);
                                  setCopiedPw(true);
                                  setTimeout(() => setCopiedPw(false), 2000);
                                }}
                                className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                                title="비밀번호 복사"
                              >
                                {copiedPw ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setShowResetPassword(!showResetPassword)}
                              className="p-1 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                              title={showResetPassword ? '비밀번호 가리기' : '비밀번호 보기'}
                            >
                              {showResetPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleDirectPasswordReset}
                          disabled={!resetPasswordInput.trim() || isResettingPw}
                          className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-2xs cursor-pointer inline-flex items-center gap-1 transition-colors disabled:opacity-40 shrink-0"
                          title="즉시 비밀번호 초기화 적용"
                        >
                          {isResettingPw ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <KeyRound className="w-3.5 h-3.5" />
                          )}
                          <span>즉시 초기화</span>
                        </button>
                      </div>
                    </div>

                    {/* Feedback message banner */}
                    {resetPwFeedback && (
                      <div
                        className={`p-2.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 ${
                          resetPwFeedback.type === 'success'
                            ? 'bg-green-50 border-green-200 text-green-800'
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {resetPwFeedback.type === 'success' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0" />
                          ) : (
                            <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                          )}
                          <span className="truncate">{resetPwFeedback.message}</span>
                        </div>
                        {resetPasswordInput && resetPwFeedback.type === 'success' && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(resetPasswordInput);
                              setCopiedPw(true);
                              setTimeout(() => setCopiedPw(false), 2000);
                            }}
                            className="text-[10px] underline font-bold hover:text-green-950 shrink-0 cursor-pointer"
                          >
                            {copiedPw ? '복사됨!' : '비번 복사'}
                          </button>
                        )}
                      </div>
                    )}
                    
                    <p className="text-[10px] text-gray-500">
                      * [즉시 초기화]를 누르거나 새 비밀번호를 입력한 뒤 하단 [수정 완료] 버튼을 누르면 초기화가 적용됩니다.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-[11px] text-amber-800 space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>수정 시 주의사항</span>
                    </p>
                    <p>저장 버튼을 누르면 최종 확인 팝업이 표시되며, 확인 후 즉시 Firestore 데이터베이스 및 활성 세션에 반영됩니다.</p>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer transition-colors"
                    >
                      취소 (Cancel)
                    </button>
                    <button
                      type="submit"
                      disabled={userActionSaving}
                      className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                    >
                      {userActionSaving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>저장 중...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>수정 완료 (Save Changes)</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CRON & CRAWLER SCHEDULER */}
      {/* ========================================================================= */}
      {activeTab === 'cron' && (
        <div className="space-y-6">
          
          {/* Main Cron Configuration Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>CRON SCHEDULER CONTROLLER</span>
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 tracking-tight">
                  사이트 이벤트 자동 가져오기 및 크론 스케줄 설정
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  등록된 사이트(페이스북 페이지/그룹, 웹사이트)의 예정 행사 내용을 자동으로 가져와 [승인대상 목록(PENDING)]으로 등록하는 주기와 중복 필터링을 설정합니다.
                </p>
              </div>

              {/* Toggle Switch: Active vs Paused */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-700">
                  크론 스케줄러: {cronConfig.enabled ? '🟢 활성 (매주 금요일 01:00 AM CST)' : '⏸️ 일시정지 (Paused)'}
                </span>
                <button
                  onClick={() => updateCronConfig({ enabled: !cronConfig.enabled })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    cronConfig.enabled ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      cronConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Scheduler Tuning Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
              
              {/* Cron Frequency Preset */}
              <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <label className="block font-bold text-gray-800">
                  자동 실행 주기 (Execution Frequency Preset)
                </label>
                <select
                  value={cronConfig.frequencyPreset}
                  onChange={(e) => {
                    const preset = e.target.value as any;
                    let expr = cronConfig.cronExpression;
                    if (preset === 'weekly_fri_0100') expr = '0 1 * * 5';
                    if (preset === 'weekly_mon') expr = '0 2 * * 1';
                    if (preset === 'daily_0200') expr = '0 2 * * *';
                    if (preset === 'daily_0400') expr = '0 4 * * *';
                    if (preset === 'every_6h') expr = '0 */6 * * *';
                    if (preset === 'every_12h') expr = '0 */12 * * *';
                    updateCronConfig({ 
                      frequencyPreset: preset, 
                      cronExpression: expr,
                      ...(preset === 'weekly_fri_0100' ? { timezone: 'America/Chicago' } : {})
                    });
                  }}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-red-600"
                >
                  <option value="weekly_fri_0100">매주 금요일 새벽 1시 (Weekly on Friday 01:00 AM CST - 기본 활성)</option>
                  <option value="weekly_mon">Weekly on Monday 02:00</option>
                  <option value="daily_0200">Daily at 02:00</option>
                  <option value="daily_0400">Daily at 04:00</option>
                  <option value="every_6h">Every 6 hours</option>
                  <option value="every_12h">Every 12 hours</option>
                  <option value="custom">Custom Cron Expression</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  현재 크론 표현식: <code className="font-mono font-bold text-red-600">{cronConfig.cronExpression}</code> (서버 백엔드 node-cron 연동)
                </p>
              </div>

              {/* Timezone & Time Window */}
              <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <label className="block font-bold text-gray-800">
                  기준 시간대 (Reference Timezone)
                </label>
                <select
                  value={cronConfig.timezone}
                  onChange={(e) => updateCronConfig({ timezone: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:outline-none focus:border-red-600"
                >
                  <option value="America/Chicago">America/Chicago (US Central, CT / CST / CDT)</option>
                  <option value="America/New_York">America/New_York (US Eastern, EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (US Pacific, PST)</option>
                  <option value="Asia/Seoul">Asia/Seoul (KST, UTC+9)</option>
                  <option value="UTC">UTC (Universal Time Coordinated)</option>
                  <option value="America/Argentina/Buenos_Aires">America/Argentina/Buenos_Aires (ART)</option>
                  <option value="Europe/Paris">Europe/Paris (CET)</option>
                </select>
                <p className="text-[11px] text-gray-500">
                  행사 추출 기간: <strong className="text-gray-900">오늘 ~ +6개월 예정 행사</strong>
                </p>
              </div>

              {/* Deduplication Similarity Threshold */}
              <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-gray-800">중복 필터링 유사도 기준</label>
                  <span className="font-mono font-bold text-red-600">
                    {(cronConfig.similarityThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="0.9"
                  step="0.05"
                  value={cronConfig.similarityThreshold}
                  onChange={(e) => updateCronConfig({ similarityThreshold: parseFloat(e.target.value) })}
                  className="w-full accent-red-600 cursor-pointer"
                />
                <p className="text-[11px] text-gray-500">
                  날짜 및 도시가 일치하고 행사명 유사도가 {(cronConfig.similarityThreshold * 100).toFixed(0)}% 이상이면 중복으로 자동 제외됩니다.
                </p>
              </div>

            </div>

            {/* Target Sites Section */}
            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 text-red-600" />
                    <h4 className="font-extrabold text-sm text-gray-900 tracking-tight">
                      사이트 이벤트 내용 가져오기 대상 사이트 목록 (등록 사이트 관리)
                    </h4>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    관리자가 등록한 페이스북 페이지/그룹, 웹사이트 주소에서 <strong className="text-gray-900">개최 예정인 행사 내용(이름, 일시, 장소)만</strong> 가져와 <strong className="text-red-700 font-semibold">[승인대상 목록 (PENDING)]</strong>에 바로 등록합니다.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 font-bold text-[11px]">
                    {(cronConfig.channels || []).filter((c) => c.enabled).length} / {(cronConfig.channels || []).length} 활성
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFetchSiteEvents(null)}
                    disabled={crawlerRunning || isExtractingSiteEvents}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                    title="등록된 사이트에 접근하여 화면에 보이는 내용(이벤트 이름, 날짜, 시간)을 추출하여 관리자 사전 승인 확인 없이 승인대상 목록(PENDING)으로 바로 보냅니다"
                  >
                    <Download className={`w-3.5 h-3.5 ${isExtractingSiteEvents || crawlerRunning ? 'animate-spin' : ''}`} />
                    <span>{isExtractingSiteEvents || crawlerRunning ? '가져오는 중...' : '사이트 이벤트 내용 가져오기'}</span>
                  </button>
                  <button
                    onClick={handleOpenAddChannel}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ 사이트 추가</span>
                  </button>
                  {unexecutedChannelsCount > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteUnexecutedChannels}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      title="최근 가져온 날짜에 '미실행'으로 표시된 사이트를 목록에서 모두 삭제합니다"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                      <span>미실행 사이트 일괄 삭제 ({unexecutedChannelsCount})</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleResetDatabaseAndCrawler}
                    disabled={isResettingDatabase}
                    className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-rose-50 border border-gray-300 hover:border-rose-300 text-gray-700 hover:text-rose-700 font-bold text-xs shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    title="기존 데이터베이스의 모든 이벤트와 가져오기 기록을 삭제하고 YYYY-MM-DD 양식으로 다시 시작합니다"
                  >
                    <RotateCcw className={`w-3.5 h-3.5 ${isResettingDatabase ? 'animate-spin text-rose-600' : 'text-gray-500'}`} />
                    <span>{isResettingDatabase ? '초기화 진행 중...' : '데이터 및 가져오기 기록 삭제/초기화'}</span>
                  </button>
                </div>
              </div>

              {/* Channels Search Filter */}
              {(cronConfig.channels || []).length > 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="채널명, URL, 도시, 국가로 검색..."
                    value={channelSearchQuery}
                    onChange={(e) => setChannelSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-600"
                  />
                </div>
              )}

              {/* Channels List Table (One Line per Channel) */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-2xs overflow-x-auto">
                <table className="w-full table-fixed text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-gray-100/80 border-b border-gray-200 text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                      {/* 1. City */}
                      <th 
                        onClick={() => handleChannelSort('city')}
                        className="py-2.5 pl-2 pr-1 w-[8.5%] min-w-[65px] max-w-[90px] whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors select-none"
                        title="City 기준 정렬"
                      >
                        <div className="flex items-center gap-1">
                          <span>City</span>
                          {channelSortField === 'city' ? (
                            <span className="text-red-600 font-bold">{channelSortAsc ? '↑' : '↓'}</span>
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </th>

                      {/* 2. NAT (국가코드 - 한글자 왼쪽으로 이동) */}
                      <th 
                        onClick={() => handleChannelSort('country_code')}
                        className="py-2.5 px-1 w-[52px] text-center whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors select-none"
                        title="NAT (국가코드) 기준 정렬"
                      >
                        <div className="flex items-center justify-center gap-0.5 -ml-1">
                          <span>NAT</span>
                          {channelSortField === 'country_code' ? (
                            <span className="text-red-600 font-bold text-[11px]">{channelSortAsc ? '↑' : '↓'}</span>
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-gray-400" />
                          )}
                        </div>
                      </th>

                      {/* 3. SOURCE (한글자 왼쪽으로 이동) */}
                      <th 
                        onClick={() => handleChannelSort('sourceType')}
                        className="py-2.5 px-1 w-[66px] whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors select-none"
                        title="SOURCE 기준 정렬"
                      >
                        <div className="flex items-center gap-0.5 -ml-1">
                          <span>SOURCE</span>
                          {channelSortField === 'sourceType' ? (
                            <span className="text-red-600 font-bold text-[11px]">{channelSortAsc ? '↑' : '↓'}</span>
                          ) : (
                            <ArrowUpDown className="w-2.5 h-2.5 text-gray-400" />
                          )}
                        </div>
                      </th>

                      {/* 4. 사이트 이름 */}
                      <th 
                        onClick={() => handleChannelSort('name')}
                        className="py-2.5 px-2 w-[23%] whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors select-none"
                        title="사이트 이름 기준 정렬"
                      >
                        <div className="flex items-center gap-1">
                          <span>사이트 이름</span>
                          {channelSortField === 'name' ? (
                            <span className="text-red-600 font-bold">{channelSortAsc ? '↑' : '↓'}</span>
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </th>

                      {/* 5. 사이트 주소 */}
                      <th 
                        onClick={() => handleChannelSort('url')}
                        className="py-2.5 px-2 w-[26%] whitespace-nowrap cursor-pointer hover:text-gray-900 transition-colors select-none"
                        title="사이트 주소 기준 정렬"
                      >
                        <div className="flex items-center gap-1">
                          <span>사이트 주소</span>
                          {channelSortField === 'url' ? (
                            <span className="text-red-600 font-bold">{channelSortAsc ? '↑' : '↓'}</span>
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-gray-400" />
                          )}
                        </div>
                      </th>

                      {/* 6. 최근가져온날짜 (tight width, text-center) */}
                      <th className="py-2.5 px-1.5 w-[86px] text-center whitespace-nowrap">최근가져온날짜</th>
                      {/* 7. 누적 가져온수 (tight width, centered to eliminate empty gap with date) */}
                      <th className="py-2.5 px-1 w-[64px] text-center whitespace-nowrap">누적 가져온수</th>
                      {/* 8. 내용 가져오기 */}
                      <th className="py-2.5 px-1 w-[38px] text-center whitespace-nowrap" title="등록 사이트에서 이벤트 내용(이름, 날짜, 시간) 가져오기">가져오기</th>
                      {/* 9. 수정 */}
                      <th className="py-2.5 px-1 w-[34px] text-center whitespace-nowrap">수정</th>
                      {/* 10. 폐기 */}
                      <th className="py-2.5 px-1 w-[34px] text-center whitespace-nowrap">폐기</th>
                      {/* 11. Active */}
                      <th className="py-2.5 px-1.5 w-[48px] text-center whitespace-nowrap">Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedChannels.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-8 text-center text-gray-400 text-xs">
                          등록되거나 검색된 사이트가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      sortedChannels.map((ch) => {
                        const typeColorMap: Record<string, string> = {
                          FACEBOOK: 'bg-blue-50 text-blue-700 border-blue-200',
                          PORTAL: 'bg-purple-50 text-purple-700 border-purple-200',
                          CALENDAR: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                          COMMUNITY: 'bg-amber-50 text-amber-700 border-amber-200',
                          WEBSITE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                          INSTAGRAM: 'bg-pink-50 text-pink-700 border-pink-200',
                          OTHER: 'bg-gray-50 text-gray-700 border-gray-200',
                        };
                        const badgeClass = typeColorMap[ch.sourceType] || typeColorMap.OTHER;
                        const sourceLabel = ch.sourceType === 'FACEBOOK' ? 'Facebook' 
                          : ch.sourceType === 'WEBSITE' ? 'Website'
                          : ch.sourceType === 'PORTAL' ? 'Portal'
                          : ch.sourceType === 'CALENDAR' ? 'Calendar'
                          : ch.sourceType === 'INSTAGRAM' ? 'Instagram'
                          : ch.sourceType;

                        return (
                          <tr
                            key={ch.id}
                            className={`transition-colors text-xs ${
                              ch.enabled
                                ? 'hover:bg-gray-50/80 bg-white text-gray-900'
                                : 'bg-gray-50/60 opacity-75 hover:bg-gray-100/60 text-gray-500'
                            }`}
                          >
                            {/* 1. City (max-w-[90px], truncate with ellipsis on overflow) */}
                            <td className="py-2.5 pl-2 pr-1 max-w-[90px]">
                              <div className="truncate font-semibold text-gray-800 text-xs" title={ch.city || '-'}>
                                {ch.city ? ch.city : <span className="text-gray-400 font-normal">-</span>}
                              </div>
                            </td>

                            {/* 2. NAT (한글자 왼쪽으로 이동) */}
                            <td className="py-2.5 px-1 text-center whitespace-nowrap">
                              <div className="-ml-1">
                                {ch.country_code ? (
                                  <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-gray-100 text-gray-700 border border-gray-200">
                                    {ch.country_code}
                                  </span>
                                ) : (
                                  <span className="text-gray-400 font-normal">-</span>
                                )}
                              </div>
                            </td>

                            {/* 3. SOURCE (한글자 왼쪽으로 이동) */}
                            <td className="py-2.5 px-1 whitespace-nowrap">
                              <div className="-ml-1">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold border ${badgeClass}`}>
                                  {sourceLabel}
                                </span>
                              </div>
                            </td>

                            {/* 4. 채널이름 */}
                            <td className="py-2.5 px-2 truncate max-w-[170px]">
                              <div className="truncate font-bold text-gray-900" title={ch.name}>
                                {ch.name}
                              </div>
                            </td>

                            {/* 5. 사이트 주소 */}
                            <td className="py-2.5 px-2 truncate max-w-[210px]">
                              <div className="truncate max-w-full">
                                <a
                                  href={ch.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-mono truncate max-w-full"
                                  title={ch.url}
                                >
                                  <span className="truncate">{ch.url}</span>
                                  <ExternalLink className="w-3 h-3 shrink-0 text-gray-400 hover:text-blue-600" />
                                </a>
                              </div>
                            </td>

                            {/* 6. 최근크롤링날짜 */}
                            <td className="py-2.5 px-1.5 text-center text-gray-600 font-mono text-[11px] whitespace-nowrap">
                              {ch.lastCrawledAt ? (
                                <span title={formatDateTimeToCST(ch.lastCrawledAt)}>{formatDateToCST(ch.lastCrawledAt)}</span>
                              ) : (
                                <span className="text-gray-400 font-sans">미실행</span>
                              )}
                            </td>

                            {/* 7. 누적 발견수 (빈공간 제거: centered & compact padding) */}
                            <td className="py-2.5 px-1 text-center font-mono font-bold text-gray-800 whitespace-nowrap">
                              {ch.discoveredCount || 0}건
                            </td>

                            {/* 8. 내용 가져오기 버튼 */}
                            <td className="py-2.5 px-1 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleFetchSiteEvents(ch)}
                                disabled={crawlerRunning || isExtractingSiteEvents || extractingSiteChannelId === ch.id}
                                className="p-1.5 rounded-lg text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 transition-colors cursor-pointer inline-flex items-center justify-center disabled:opacity-40"
                                title={`${ch.name} 등록 사이트 이벤트 내용(이름·날짜·시간)을 가져와 승인대상 목록(PENDING)으로 바로 보냅니다`}
                              >
                                <Download className={`w-3.5 h-3.5 ${extractingSiteChannelId === ch.id ? 'animate-spin text-indigo-700' : ''}`} />
                              </button>
                            </td>

                            {/* 9. 수정 버튼 */}
                            <td className="py-2.5 px-1 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleOpenEditChannel(ch)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="사이트 수정"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </td>

                            {/* 10. 폐기 버튼 */}
                            <td className="py-2.5 px-1 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => handleDeleteChannel(ch)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer inline-flex items-center justify-center"
                                title="사이트 폐기"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>

                            {/* 10. Active 토글 버튼 */}
                            <td className="py-2.5 px-1.5 text-center whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => toggleCrawlingChannel(ch.id)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer align-middle ${
                                  ch.enabled ? 'bg-red-600' : 'bg-gray-300'
                                }`}
                                title={ch.enabled ? '사이트 비활성화' : '사이트 활성화'}
                              >
                                <span
                                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                                    ch.enabled ? 'translate-x-4.5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </td>
                          </tr>
                        );
                      }))}
                  </tbody>
                </table>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-950 text-[11px] leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <strong>이벤트 내용 가져오기 조건:</strong> 관리자가 등록한 <strong>공식 웹사이트/블로그(서브 사이트 자동 탐색 포함)</strong> 및 페이스북 커뮤니티에서 조회되는 다가오는 행사(개최 예정 행사)의 <strong>이벤트 제목, 일정, 비용(가장 높은 옵션의 금액을 "~$000" 양식으로 표시)</strong> 데이터를 가져와 <strong>승인대상 목록 (PENDING)</strong>으로 자동 등록합니다. 수집된 이벤트는 상단 <strong>[이벤트 관리 &gt; PENDING]</strong> 탭에서 관리자가 검토 후 승인(APPROVE) 또는 반려하실 수 있습니다.
                </div>
              </div>
            </div>

            {/* Manual Run Now Button & Live Status */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100">
              <div className="text-xs text-gray-500 space-y-0.5 font-mono">
                <p>Last run: <strong className="text-gray-800 font-semibold">{cronConfig.lastRunAt ? formatDateTimeToCST(cronConfig.lastRunAt) : 'None'}</strong></p>
                <p>Next scheduled: <strong className="text-gray-800 font-semibold">{cronConfig.nextRunAt ? formatDateTimeToCST(cronConfig.nextRunAt) : formatDateTimeToCST('2026-09-11T06:00:00Z')}</strong> (매주 금요일 01:00 AM CST)</p>
              </div>

              <button
                onClick={() => handleFetchSiteEvents(null)}
                disabled={crawlerRunning || isExtractingSiteEvents}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-400"
              >
                <Download className={`w-4 h-4 ${crawlerRunning || isExtractingSiteEvents ? 'animate-spin' : ''}`} />
                <span>{crawlerRunning || isExtractingSiteEvents ? '가져오는 중...' : '사이트 이벤트 내용 지금 가져오기'}</span>
              </button>
            </div>

            {/* Extraction Result Feedback Box */}
            {crawlerResult && (
              <div className="p-5 rounded-xl bg-white border border-gray-200 space-y-3.5 text-xs shadow-xs animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 text-green-700 font-extrabold text-sm">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span>등록 사이트({crawlerResult.channelsCrawled?.length || 0}개) 이벤트 내용 가져오기 완료!</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {crawlerResult.inactiveChannelsCount !== undefined && crawlerResult.inactiveChannelsCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-semibold">
                        비활성 {crawlerResult.inactiveChannelsCount}개 사이트 제외됨 (Active: OFF)
                      </span>
                    )}
                    {crawlerResult.timeWindow && (
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 font-mono text-[11px] font-semibold">
                        행사 기간: {crawlerResult.timeWindow}
                      </span>
                    )}
                  </div>
                </div>

                {crawlerResult.channelsCrawled && crawlerResult.channelsCrawled.length > 0 && (
                  <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-900">
                    <span className="font-bold">이벤트 내용을 가져온 활성 사이트 ({crawlerResult.channelsCrawled.length}개):</span>{' '}
                    <span className="text-emerald-800">{crawlerResult.channelsCrawled.join(', ')}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-green-50 text-green-900 border border-green-200 flex flex-col justify-between">
                    <span className="font-semibold text-xs text-green-800">승인대상 목록(PENDING) 신규 등록:</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <strong className="text-2xl font-black text-green-700">+{crawlerResult.addedCount}</strong>
                      <span className="text-xs text-green-700 font-medium">건 (주소 검증 완료)</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 flex flex-col justify-between">
                    <span className="font-semibold text-xs text-rose-800">사이트 주소 무효 / 종료 행사 제외:</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <strong className="text-2xl font-black text-rose-700">{crawlerResult.invalidUrlCount || 0}</strong>
                      <span className="text-xs text-rose-700 font-medium">건 제외 (행사 미확인)</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex flex-col justify-between">
                    <span className="font-semibold text-xs text-amber-800">중복 필터링 제외:</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <strong className="text-2xl font-black text-amber-700">{crawlerResult.duplicateCount}</strong>
                      <span className="text-xs text-amber-700 font-medium">건 차단됨</span>
                    </div>
                  </div>
                </div>

                {/* Quick Link to Pending Approvals */}
                {crawlerResult.addedCount > 0 && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-red-900 text-xs">
                      <strong>승인 대기 안내:</strong> 사이트 주소 유효성 검증을 통과한 신규 행사 데이터 {crawlerResult.addedCount}건이 승인 대상 목록에 등록되었습니다.
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('events');
                        setEventFilterStatus('PENDING');
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>승인대상 목록 검토하기 (Go to Pending)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Invalid / Dead URLs Detailed Excluded Log */}
                {crawlerResult.invalidUrlsDetails && crawlerResult.invalidUrlsDetails.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="font-semibold text-rose-800 text-[11px] flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>사이트 주소 무효 / 다가오는 이벤트 없음 제외 내역 ({crawlerResult.invalidUrlsDetails.length}건):</span>
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1 p-2.5 rounded-lg bg-rose-50/70 border border-rose-200 font-mono text-[10px] text-rose-900">
                      {crawlerResult.invalidUrlsDetails.map((line, idx) => (
                        <div key={idx} className="truncate">{line}</div>
                      ))}
                    </div>
                  </div>
                )}

                {crawlerResult.duplicatesDetails && crawlerResult.duplicatesDetails.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="font-semibold text-gray-700 text-[11px]">중복 및 필터링 상세 로그:</p>
                    <div className="max-h-28 overflow-y-auto space-y-1 p-2.5 rounded-lg bg-gray-50 border border-gray-200 font-mono text-[10px] text-gray-600">
                      {crawlerResult.duplicatesDetails.map((line, idx) => (
                        <div key={idx} className="truncate">{line}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Past Execution History Table (Single screen table-fixed without horizontal scroll) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="font-extrabold text-base text-gray-900">사이트 이벤트 가져오기 실행 이력 (Execution History)</h4>
            <div className="w-full overflow-hidden">
              <table className="w-full table-fixed text-left text-xs text-gray-700 border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-gray-500 uppercase font-semibold text-[11px]">
                    <th className="w-[18%] py-2.5 px-2">Timestamp</th>
                    <th className="w-[10%] py-2.5 px-1.5 text-center">Status</th>
                    <th className="w-[10%] py-2.5 px-1.5 text-center">Discovered</th>
                    <th className="w-[10%] py-2.5 px-1.5 text-center">Added</th>
                    <th className="w-[12%] py-2.5 px-1.5 text-center">Blocked</th>
                    <th className="w-[10%] hidden sm:table-cell py-2.5 px-1.5 text-center">Duration</th>
                    <th className="w-[30%] py-2.5 px-2">Message</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {cronConfig.runHistory.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/70">
                      <td className="py-2.5 px-2 text-gray-700 truncate" title={formatDateTimeToCST(log.timestamp)}>
                        {formatDateTimeToCST(log.timestamp)}
                      </td>
                      <td className="py-2.5 px-1.5 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-green-50 text-green-700 font-bold border border-green-200 text-[10px]">
                          {log.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-1.5 text-center">{log.itemsDiscovered}</td>
                      <td className="py-2.5 px-1.5 text-center font-bold text-green-700">+{log.itemsAdded}</td>
                      <td className="py-2.5 px-1.5 text-center text-amber-700">-{log.duplicatesBlocked}</td>
                      <td className="py-2.5 px-1.5 text-center text-gray-500 hidden sm:table-cell">{log.durationMs}ms</td>
                      <td className="py-2.5 px-2 font-sans text-gray-600 truncate" title={log.message}>
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: GEMINI AI WEBSITE CHANGE MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'gemini' && (
        <div className="space-y-6">
          
          {/* Header Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-100">
              <Sparkles className="w-3.5 h-3.5" />
              <span>GEMINI AI WEBSITE MANAGEMENT HUB</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
              Gemini AI Website Operations & Management Hub
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-3xl">
              Utilize Gemini AI to manage Everytango announcements, banner texts, main headlines,
              event data quality audits, city curation, and UI settings in real time via natural language commands.
            </p>
          </div>

          {/* Quick Action Prompt Chips */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs space-y-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Recommended One-Click Actions
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {[
                {
                  title: '✨ Auto-Update Curated Notice',
                  desc: 'Auto-curate and refresh the live Curated Notice based on latest tango events',
                  prompt: 'Analyze upcoming approved tango events and generate an engaging, concise Curated Notice highlighting top cities and upcoming festivals.',
                },
                {
                  title: '🔍 Full Event Data Quality Audit',
                  desc: 'Audit date validity, duplicate candidates, and missing fields across all events',
                  prompt: 'Perform a comprehensive data quality audit on all registered tango events, checking for date consistency, duplicates, and missing venue information.',
                },
                {
                  title: '🏙️ Generate City Curation Guide',
                  desc: 'Create recommended tango highlights for popular hubs (Seoul, Buenos Aires, etc.)',
                  prompt: 'Create an engaging curation summary highlighting top tango festivals and milongas in major hubs like Buenos Aires, Seoul, and Europe.',
                },
                {
                  title: '🎨 Website Feature & UI Roadmap',
                  desc: 'Propose UI and filter improvements to enhance user exploration experience',
                  prompt: 'Suggest UX and UI improvements for the Everytango event explorer to make filtering, discovery, and navigation even faster.',
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setGeminiPrompt(item.prompt);
                    handleGeminiSubmit(item.prompt);
                  }}
                  className="p-3 text-left rounded-xl bg-gray-50 hover:bg-purple-50/70 border border-gray-200 hover:border-purple-200 transition-all group cursor-pointer"
                >
                  <div className="font-bold text-xs text-gray-900 group-hover:text-purple-700">
                    {item.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1 leading-snug">
                    {item.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Natural Language Prompt Console */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-4">
            <h4 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-purple-600" />
              <span>Admin Natural Language Command</span>
            </h4>

            <div className="relative">
              <textarea
                rows={3}
                value={geminiPrompt}
                onChange={(e) => setGeminiPrompt(e.target.value)}
                placeholder="e.g. 'Curate upcoming festivals for Curated Notice', 'Audit upcoming US events for duplicates', 'Recommend top tango hubs'..."
                className="w-full p-3.5 text-xs bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-600 focus:bg-white"
              />
              <button
                onClick={() => handleGeminiSubmit()}
                disabled={geminiLoading || !geminiPrompt.trim()}
                className="absolute right-3 bottom-3 px-4 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Send className="w-3 h-3" />
                <span>{geminiLoading ? 'Analyzing with Gemini AI...' : 'Submit Command'}</span>
              </button>
            </div>

            {/* Status Message */}
            {geminiStatusMessage && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-800 flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <span>{geminiStatusMessage}</span>
              </div>
            )}

            {/* Gemini Response Display Area */}
            {geminiResponse && (
              <div className="p-5 rounded-xl bg-purple-50/40 border border-purple-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-purple-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Gemini AI Response & Site Changes
                  </span>
                  {geminiSuggestedConfig && (
                    <button
                      onClick={handleApplyGeminiConfig}
                      className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Curated Notice (자동 반영)</span>
                    </button>
                  )}
                </div>

                <div className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed bg-white p-4 rounded-lg border border-purple-100 font-sans">
                  {geminiResponse}
                </div>

                {geminiSuggestedConfig && (
                  <div className="p-3 rounded-lg bg-white border border-purple-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-purple-800">📋 Proposed Site Configuration:</span>
                      <span className="text-[10px] text-purple-600 font-medium">※ Curated Notice만 자동 반영되며, Top Announcement와 Hero Headline은 수동 관리 설정에 따라 보존됩니다.</span>
                    </div>
                    <pre className="p-2 rounded bg-gray-50 border border-gray-200 font-mono text-[11px] text-gray-700 overflow-x-auto">
                      {JSON.stringify(geminiSuggestedConfig, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Current Live Site Configuration Inspector & Manual Overrider */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 gap-2">
              <div>
                <h4 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <span>Live Site Configuration State</span>
                  <span className="text-[11px] font-normal text-gray-500">(실시간 사이트 설정 관리)</span>
                </h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  <strong className="text-amber-800">Top Announcement</strong>와 <strong className="text-amber-800">Main Hero Headline</strong>은 관리자 <strong className="text-amber-700">수동 업데이트</strong> 항목이며, <strong className="text-purple-700">Curated Notice</strong>는 시스템 및 AI에 의해 <strong className="text-purple-700">자동 업데이트</strong>됩니다.
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end text-[11px] text-gray-500 font-mono shrink-0">
                <span>Last updated: {siteConfig.lastUpdatedAt.substring(0, 16).replace('T', ' ')}</span>
                {siteConfig.curatedNoticeLastAutoUpdated && (
                  <span className="text-purple-600 text-[10px]">
                    Curated Auto-sync: {siteConfig.curatedNoticeLastAutoUpdated.substring(0, 16).replace('T', ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* 1 & 2: Manual Update Fields (Top Announcement Notice & Main Hero Headline) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-gray-700 font-bold">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>수동 업데이트 영역 (Manual Management Only)</span>
                <span className="text-[11px] font-normal text-gray-400">— 관리자가 직접 입력하여 수정하며, AI나 자동 프로세스에 의해 임의로 변경되지 않습니다.</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Top Announcement Notice (Manual) */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-stone-50/60 border border-stone-200/80">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-800 flex items-center gap-1.5">
                      <span>Top Announcement Notice</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Edit3 className="w-2.5 h-2.5" /> 수동 업데이트 (Manual)
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={siteConfig.siteAnnouncement}
                    onChange={(e) => updateSiteConfig({ siteAnnouncement: e.target.value })}
                    placeholder="최상단 공지 배너 문구를 직접 입력하세요..."
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-500">
                    홈페이지 최상단 레드 배너에 노출되는 주요 공지사항입니다.
                  </p>
                </div>

                {/* Main Hero Headline (Manual) */}
                <div className="space-y-1.5 p-3.5 rounded-xl bg-stone-50/60 border border-stone-200/80">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-gray-800 flex items-center gap-1.5">
                      <span>Main Hero Headline</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                        <Edit3 className="w-2.5 h-2.5" /> 수동 업데이트 (Manual)
                      </span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={siteConfig.heroHeadline}
                    onChange={(e) => updateSiteConfig({ heroHeadline: e.target.value })}
                    placeholder="메인 히어로 헤드라인 문구를 직접 입력하세요..."
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-500 shadow-2xs"
                  />
                  <p className="text-[11px] text-gray-500">
                    홈페이지 상단 메인 타이틀(H1)로 표시되는 핵심 슬로건입니다.
                  </p>
                </div>
              </div>
            </div>

            {/* 3: Auto-Updated Field (Curated Notice) */}
            <div className="space-y-2 p-4 rounded-xl bg-purple-50/60 border border-purple-200/90 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                  <label className="font-bold text-gray-900 flex items-center gap-1.5">
                    <span>Curated Notice</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                      자동 업데이트 (Auto-Updated by AI & Data)
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTriggerCuratedAutoUpdate}
                    disabled={curatedAutoUpdating}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    title="최신 행사 및 주요 도시 데이터를 기반으로 Curated Notice를 즉시 자동 갱신합니다."
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${curatedAutoUpdating ? 'animate-spin' : ''}`} />
                    <span>{curatedAutoUpdating ? '자동 갱신 중...' : '⚡ 지금 자동 업데이트 실행 (Auto-Update Now)'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <input
                  type="text"
                  value={siteConfig.curatedNotice}
                  onChange={(e) => updateSiteConfig({ curatedNotice: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-500 shadow-2xs"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-gray-500 pt-0.5 gap-1">
                <p>
                  크롤러가 새 행사를 수집하거나 AI 사이트 관리 명령 실행 시 주요 도시 및 추천 행사를 바탕으로 자동 갱신됩니다.
                </p>
                {curatedUpdateSuccessMsg && (
                  <span className="text-purple-700 font-bold bg-purple-100/80 px-2 py-0.5 rounded border border-purple-200 animate-fade-in">
                    {curatedUpdateSuccessMsg}
                  </span>
                )}
              </div>
            </div>

            {/* 4: Hero Background Photo (사용자 첨부 실제 사진 등록) */}
            <div className="space-y-2 p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-900 flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-gray-600" />
                  <span>Hero Banner Background Image (상단 히어로 배경 사진 설정)</span>
                </label>
                {siteConfig.heroBackgroundImage && (
                  <button
                    type="button"
                    onClick={() => updateSiteConfig({ heroBackgroundImage: undefined })}
                    className="text-[11px] text-red-600 hover:text-red-700 font-semibold cursor-pointer"
                  >
                    기본 배경으로 초기화
                  </button>
                )}
              </div>
              <p className="text-[11px] text-gray-500">
                인공지능 생성이 아닌 직접 촬영하신 실제 밀롱가 홀 사진이나 스크린샷 파일을 배경으로 등록할 수 있습니다. 등록 즉시 우측 페이드 그라데이션이 적용됩니다.
              </p>
              <div className="flex items-center gap-3 pt-1">
                <input
                  type="file"
                  id="admin-hero-bg-upload"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        if (dataUrl) {
                          updateSiteConfig({ heroBackgroundImage: dataUrl });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="admin-hero-bg-upload"
                  className="px-3 py-1.5 rounded-lg bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium text-xs cursor-pointer shadow-2xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Camera className="w-3.5 h-3.5 text-gray-500" />
                  <span>실제 사진 파일 선택 (Screenshot / IMG_2077 등)</span>
                </label>
                <span className="text-[11px] text-gray-500">
                  {siteConfig.heroBackgroundImage ? '✓ 사용자 직접 업로드 사진이 적용되어 있습니다' : '기본 밀롱가 홀 배경이 설정되어 있습니다'}
                </span>
              </div>
            </div>

            {/* Bottom options */}
            <div className="flex items-center justify-between pt-2 text-xs border-t border-gray-100">
              <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={siteConfig.announcementEnabled}
                  onChange={(e) => updateSiteConfig({ announcementEnabled: e.target.checked })}
                  className="rounded text-red-600"
                />
                <span>Enable Top Announcement Bar (상단 공지 배너 활성화)</span>
              </label>

              <span className="text-[11px] text-green-700 bg-green-50 px-2 py-0.5 rounded font-semibold border border-green-200">
                ✓ Changes saved automatically
              </span>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT CRAWLING CHANNEL MODAL */}
      {/* ========================================================================= */}
      {isChannelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs text-gray-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <Radio className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900">
                    {editingChannel ? '등록 사이트 정보 수정 (Edit Registered Site)' : '새 이벤트 수집 사이트 등록 (Add Site)'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Facebook 그룹/페이지, 공식 웹사이트 등 이벤트 내용을 가져올 대상 사이트를 설정합니다.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChannelModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveChannel} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block font-bold text-gray-700">
                  사이트 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: Tango Birmingham, Atlanta Tango Community"
                  value={channelForm.name}
                  onChange={(e) => setChannelForm({ ...channelForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-700">
                  대상 웹사이트 / 그룹 URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  required
                  placeholder="예: https://www.facebook.com/groups/tangobirmingham"
                  value={channelForm.url}
                  onChange={(e) => setChannelForm({ ...channelForm, url: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 font-mono focus:bg-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">플랫폼 / 사이트 유형</label>
                  <select
                    value={channelForm.sourceType}
                    onChange={(e) => setChannelForm({ ...channelForm, sourceType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:bg-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="FACEBOOK">Facebook 커뮤니티/그룹</option>
                    <option value="PORTAL">전문 탱고 포털 (Tangopolix 등)</option>
                    <option value="CALENDAR">캘린더 / 마라톤 레지스트리</option>
                    <option value="COMMUNITY">지역 동호회 / 카페</option>
                    <option value="WEBSITE">공식 웹사이트 / 블로그</option>
                    <option value="INSTAGRAM">Instagram 피드</option>
                    <option value="OTHER">기타 소셜 / 웹</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">대상 국가 코드</label>
                  <select
                    value={channelForm.country_code}
                    onChange={(e) => setChannelForm({ ...channelForm, country_code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-800 focus:bg-white focus:border-red-600 focus:outline-none"
                  >
                    <option value="ALL">ALL (전체 국가 / 글로벌)</option>
                    {COUNTRY_LIST.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                    {channelForm.country_code &&
                      channelForm.country_code !== 'ALL' &&
                      !COUNTRY_LIST.some((c) => c.code === channelForm.country_code) && (
                        <option value={channelForm.country_code}>
                          {channelForm.country_code}
                        </option>
                      )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">대상 도시 (City)</label>
                  <input
                    type="text"
                    placeholder="예: Atlanta, Birmingham, Seoul, Global"
                    value={channelForm.city}
                    onChange={(e) => {
                      const val = e.target.value;
                      const clean = val.toLowerCase().trim();
                      let recState = channelForm.state;
                      let recCountry = channelForm.country_code;

                      if (clean.includes('seoul')) {
                        recCountry = 'KR';
                        recState = 'Seoul';
                      } else if (clean.includes('tokyo')) {
                        recCountry = 'JP';
                        recState = 'Tokyo';
                      } else if (clean.includes('toronto')) {
                        recCountry = 'CA';
                        recState = 'ON';
                      } else if (clean.includes('montreal') || clean.includes('montréal')) {
                        recCountry = 'CA';
                        recState = 'Quebec';
                      } else if (clean.includes('portland')) {
                        recCountry = 'US';
                        recState = 'OR';
                      } else if (clean.includes('houston')) {
                        recCountry = 'US';
                        recState = 'TX';
                      } else if (clean.includes('birmingham')) {
                        recCountry = 'US';
                        recState = 'AL';
                      }

                      setChannelForm({
                        ...channelForm,
                        city: val,
                        state: recState,
                        country_code: recCountry,
                      });
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-gray-700">주 / 지역 (State / Province)</label>
                  <input
                    type="text"
                    placeholder="예: GA, AL, Seoul"
                    value={channelForm.state}
                    onChange={(e) => setChannelForm({ ...channelForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-gray-700">사이트 설명 및 수집 메모</label>
                <textarea
                  rows={2}
                  placeholder="예: 주말 정기 밀롱가 및 페스티벌 행사 공지 정기 수집"
                  value={channelForm.description}
                  onChange={(e) => setChannelForm({ ...channelForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-900 focus:bg-white focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="pt-1 flex items-center justify-between">
                <label className="flex items-center gap-2 font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={channelForm.enabled}
                    onChange={(e) => setChannelForm({ ...channelForm, enabled: e.target.checked })}
                    className="rounded text-red-600"
                  />
                  <span>사이트 활성화 (Active)</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsChannelModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold shadow-xs cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingChannel ? '수정 내용 저장' : '새 사이트 등록'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* GLOBAL CONFIRMATION POPUP MODAL (모든 삭제 및 변경 사전 확인 팝업) */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4 text-xs text-gray-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  confirmModal.variant === 'danger'
                    ? 'bg-red-100 text-red-600'
                    : confirmModal.variant === 'warning'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {confirmModal.variant === 'danger' ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : confirmModal.variant === 'warning' ? (
                  <AlertCircle className="w-5 h-5" />
                ) : (
                  <Shield className="w-5 h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-gray-900 leading-snug">
                  {confirmModal.title}
                </h3>
                <div className="mt-2 text-xs text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {confirmModal.message}
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold cursor-pointer transition-colors"
              >
                {confirmModal.cancelText || '취소'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await confirmModal.onConfirm();
                  } catch (err) {
                    console.error('Confirm action failed:', err);
                  }
                }}
                className={`px-5 py-2 rounded-lg font-bold text-white shadow-xs cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                  confirmModal.variant === 'danger'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmModal.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmModal.variant === 'danger' ? (
                  <Trash2 className="w-3.5 h-3.5" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>{confirmModal.confirmText || '확인 (Confirm)'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* APPROVAL & AUTOMATED EMAIL NOTIFICATION SUCCESS MODAL                     */}
      {/* ========================================================================= */}
      {approvalEmailSuccessModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4 text-xs text-gray-800 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-extrabold text-base text-gray-900 leading-snug">
                  Event Approved & Published!
                </h3>
                <p className="text-gray-500 text-xs mt-0.5">
                  이벤트가 승인되어 공개 일정표에 즉시 게시되었으며, 작성자에게 영문 안내 회신 메일이 발송되었습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setApprovalEmailSuccessModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Email Dispatch Info Box */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-gray-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  Automated Reply Notification Details
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                  DISPATCHED (SUCCESS)
                </span>
              </div>
              
              <div className="grid grid-cols-[80px_1fr] gap-1.5">
                <span className="text-gray-500 font-semibold">Event:</span>
                <span className="font-bold text-gray-900">{approvalEmailSuccessModal.eventName}</span>
                
                <span className="text-gray-500 font-semibold">Recipient:</span>
                <span className="font-mono font-bold text-blue-700">{approvalEmailSuccessModal.recipientEmail}</span>
                
                <span className="text-gray-500 font-semibold">Language:</span>
                <span className="font-medium text-gray-800">English (영문 회신 메일)</span>

                <span className="text-gray-500 font-semibold">Subject:</span>
                <span className="font-medium text-gray-800">
                  {approvalEmailSuccessModal.emailLog?.subject || `Your Tango Event "${approvalEmailSuccessModal.eventName}" has been Approved and is Live!`}
                </span>
              </div>

              {approvalEmailSuccessModal.emailLog?.body && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-gray-600 block mb-1">Sent English Reply Body:</span>
                  <pre className="p-3 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-gray-800 max-h-52 overflow-y-auto whitespace-pre-wrap leading-relaxed select-all">
                    {approvalEmailSuccessModal.emailLog.body}
                  </pre>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setApprovalEmailSuccessModal(null)}
                className="px-5 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 font-bold text-white shadow-xs cursor-pointer transition-colors"
              >
                Confirm (확인)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Facebook Community Scanner & Post Parser Modal */}
      <FacebookSearchModal
        isOpen={isFacebookModalOpen}
        onClose={() => setIsFacebookModalOpen(false)}
        currentLang={currentLang}
      />

      {/* Site Content Extractor Modal (이벤트 이름, 날짜, 시간 가져오기) */}
      <SiteEventExtractorModal
        isOpen={isExtractorModalOpen}
        onClose={() => {
          setIsExtractorModalOpen(false);
          setExtractorTargetChannel(null);
        }}
        channel={extractorTargetChannel}
        onSuccess={(addedCount) => {
          alert(`성공: 사이트에서 ${addedCount}건의 예정된 이벤트를 [승인대상 목록(PENDING)]으로 가져왔습니다.`);
        }}
      />

    </div>
  );
};
