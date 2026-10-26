'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ImageCropperModal from '@/components/ImageCropperModal';
import type {
  ClientProfile,
  BioBanner,
  MetaStandardEvent,
  BannerBorderRadius,
  BannerBorderStyle,
  BannerShadow,
} from '@/data/profiles';
import type { AnalyticsReport, AnalyticsPeriod } from '@/lib/analytics-store';

function isLightColor(hexColor?: string): boolean {
  if (!hexColor) return false;
  const hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    const r = parseInt(hex[0] + hex[0], 16);
    const g = parseInt(hex[1] + hex[1], 16);
    const b = parseInt(hex[2] + hex[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  if (hex.length === 6) {
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 155;
  }
  return false;
}

export default function AdminDashboardPage() {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor' | 'analytics'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessUrl, setSaveSuccessUrl] = useState<string | null>(null);

  // Form State (Editor)
  const [slug, setSlug] = useState('');
  const [showHero, setShowHero] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showNicheBadge, setShowNicheBadge] = useState(false);
  const [nicheBadge, setNicheBadge] = useState('Engenharia de Vendas');
  const [badgeBgColor, setBadgeBgColor] = useState('#00b768');
  const [pageBgColor, setPageBgColor] = useState('#070b14');
  const [cardBgColor, setCardBgColor] = useState('#0a0f1d');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaTestEventCode, setMetaTestEventCode] = useState('');
  const [banners, setBanners] = useState<BioBanner[]>([]);
  const [bannerBorderRadius, setBannerBorderRadius] = useState<BannerBorderRadius>('md');
  const [bannerBorderStyle, setBannerBorderStyle] = useState<BannerBorderStyle>('subtle');
  const [bannerShadow, setBannerShadow] = useState<BannerShadow>('bottom');
  const [bannerElevation, setBannerElevation] = useState<boolean>(true);

  // Cropper Modal State
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [cropperImageSrc, setCropperImageSrc] = useState('');
  const [cropperTargetBannerIndex, setCropperTargetBannerIndex] = useState<number | null>(null);
  const [cropperTitle, setCropperTitle] = useState('Ajustar e Recortar Banner');

  const isLight = isLightColor(pageBgColor);

  // Analytics State
  const [selectedAnalyticsSlug, setSelectedAnalyticsSlug] = useState<string>('kelvin');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<AnalyticsPeriod>('7d');
  const [analyticsReport, setAnalyticsReport] = useState<AnalyticsReport | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [summaryMetrics, setSummaryMetrics] = useState<
    Record<
      string,
      { views: number; uniqueViews: number; clicks: number; uniqueClicks: number; ctr: number }
    >
  >({});

  // Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [passwordChangeMessage, setPasswordChangeMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/admin/login';
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeMessage(null);

    if (newPassword.length < 6) {
      setPasswordChangeMessage({
        type: 'error',
        text: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordChangeMessage({
        type: 'error',
        text: 'A confirmação de senha não coincide.',
      });
      return;
    }

    try {
      setPasswordChangeLoading(true);
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (data.success) {
        setPasswordChangeMessage({
          type: 'success',
          text: 'Senha de administrador alterada com sucesso!',
        });
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setPasswordChangeMessage(null);
        }, 1200);
      } else {
        setPasswordChangeMessage({
          type: 'error',
          text: data.error || 'Erro ao alterar senha.',
        });
      }
    } catch {
      setPasswordChangeMessage({
        type: 'error',
        text: 'Erro de conexão ao atualizar senha.',
      });
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Open editor or analytics if query param exists
  useEffect(() => {
    if (typeof window !== 'undefined' && profiles.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const editSlug = params.get('edit');
      const statsSlug = params.get('stats');
      if (editSlug) {
        const found = profiles.find((p) => p.slug === editSlug);
        if (found) {
          handleEditProfile(found);
        }
      } else if (statsSlug) {
        handleOpenAnalytics(statsSlug);
      }
    }
  }, [profiles]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/profiles');
      const data = await res.json();
      if (data.success && data.profiles) {
        setProfiles(data.profiles);
        fetchSummaryForProfiles(data.profiles);
      }
    } catch (err) {
      console.error('Falha ao carregar perfis:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummaryForProfiles = async (profs: ClientProfile[]) => {
    const summaryMap: Record<
      string,
      { views: number; uniqueViews: number; clicks: number; uniqueClicks: number; ctr: number }
    > = {};

    await Promise.all(
      profs.map(async (p) => {
        try {
          const res = await fetch(`/api/analytics?slug=${p.slug}&period=all`);
          const d = await res.json();
          if (d.success && d.report) {
            summaryMap[p.slug] = {
              views: d.report.totalViews,
              uniqueViews: d.report.uniqueViews,
              clicks: d.report.totalClicks,
              uniqueClicks: d.report.uniqueClicks,
              ctr: d.report.ctrTotal,
            };
          }
        } catch {
          // Fallback silencioso
        }
      })
    );
    setSummaryMetrics(summaryMap);
  };

  const fetchAnalytics = async (targetSlug: string, period: AnalyticsPeriod = analyticsPeriod) => {
    try {
      setLoadingAnalytics(true);
      const res = await fetch(`/api/analytics?slug=${targetSlug}&period=${period}`);
      const data = await res.json();
      if (data.success && data.report) {
        setAnalyticsReport(data.report);
      }
    } catch (err) {
      console.error('Falha ao carregar métricas:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleOpenAnalytics = (targetSlug: string) => {
    setSelectedAnalyticsSlug(targetSlug);
    setView('analytics');
    fetchAnalytics(targetSlug, analyticsPeriod);
  };

  const handlePeriodChange = (newPeriod: AnalyticsPeriod) => {
    setAnalyticsPeriod(newPeriod);
    if (selectedAnalyticsSlug) {
      fetchAnalytics(selectedAnalyticsSlug, newPeriod);
    }
  };

  const handleCreateNew = () => {
    setSlug('');
    setShowHero(true);
    setAvatarUrl('');
    setName('');
    setTitle('');
    setDescription('');
    setShowNicheBadge(false);
    setNicheBadge('Engenharia de Vendas');
    setBadgeBgColor('#00b768');
    setPageBgColor('#070b14');
    setCardBgColor('#0a0f1d');
    setBannerBorderRadius('md');
    setBannerBorderStyle('subtle');
    setBannerShadow('bottom');
    setBannerElevation(true);
    setMetaPixelId('');
    setMetaAccessToken('');
    setMetaTestEventCode('');
    setBanners([
      {
        id: `banner-${Date.now()}`,
        title: 'Fale no WhatsApp',
        imageUrl: '/banners/kelvin/banner-whatsapp.png',
        destinationUrl: 'https://wa.me/5511999999999',
        trackingEvent: 'Contact',
        eventCategory: 'WhatsApp',
        eventValue: 0,
        eventCurrency: 'BRL',
        target: '_blank',
      },
    ]);
    setSaveSuccessUrl(null);
    setView('editor');
  };

  const handleEditProfile = (profile: ClientProfile) => {
    setSlug(profile.slug);
    setShowHero(profile.showHero ?? true);
    setAvatarUrl(profile.avatarUrl || '');
    setName(profile.name || '');
    setTitle(profile.title || '');
    setDescription(profile.description || '');
    setShowNicheBadge(profile.showNicheBadge ?? false);
    setNicheBadge(profile.nicheBadge || 'Geral');
    setBadgeBgColor(profile.badgeBgColor || '#00b768');
    setPageBgColor(profile.pageBgColor || '#070b14');
    setCardBgColor(profile.cardBgColor || '#0a0f1d');
    setBannerBorderRadius(profile.bannerBorderRadius || 'md');
    setBannerBorderStyle(profile.bannerBorderStyle || 'subtle');
    setBannerShadow(profile.bannerShadow || 'bottom');
    setBannerElevation(profile.bannerElevation ?? true);
    setMetaPixelId(profile.metaPixelId || '');
    setMetaAccessToken(profile.metaAccessToken || '');
    setMetaTestEventCode(profile.metaTestEventCode || '');
    setBanners(profile.banners || []);
    setSaveSuccessUrl(null);
    setView('editor');
  };

  const handleDeleteProfile = async (slugToDelete: string) => {
    if (!confirm(`Tem certeza que deseja excluir o perfil "${slugToDelete}"?`)) return;

    try {
      const res = await fetch(`/api/profiles?slug=${slugToDelete}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        await fetchProfiles();
        if (slug === slugToDelete) {
          setView('list');
        }
      } else {
        alert(data.error || 'Erro ao excluir perfil.');
      }
    } catch {
      alert('Erro de conexão ao excluir perfil.');
    }
  };

  const handleAddBanner = () => {
    const newBanner: BioBanner = {
      id: `banner-${Date.now()}`,
      title: 'Novo Banner Comercial',
      imageUrl: '/banners/kelvin/banner-whatsapp.png',
      destinationUrl: 'https://wa.me/5511999999999',
      trackingEvent: 'Contact',
      eventCategory: 'WhatsApp',
      eventValue: 0,
      eventCurrency: 'BRL',
      target: '_blank',
    };
    setBanners([...banners, newBanner]);
  };

  const handleMoveBanner = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;
    const updated = [...banners];
    const [moved] = updated.splice(index, 1);
    updated.splice(newIndex, 0, moved);
    setBanners(updated);
  };

  const handleRemoveBanner = (index: number) => {
    const updated = banners.filter((_, i) => i !== index);
    setBanners(updated);
  };

  const handleUpdateBanner = (
    index: number,
    field: keyof BioBanner,
    value: string | number | undefined
  ) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [field]: value };
    setBanners(updated);
  };

  const triggerImageUpload = (index: number) => {
    setUploadingIndex(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || uploadingIndex === null) return;

    try {
      const targetIdx = uploadingIndex;
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        if (rawDataUrl) {
          setCropperImageSrc(rawDataUrl);
          setCropperTargetBannerIndex(targetIdx);
          setCropperTitle(`Ajustar e Recortar Banner #${targetIdx + 1}`);
          setIsCropperOpen(true);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao ler imagem local:', err);
      alert('Falha ao processar arquivo de imagem local.');
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleOpenCropperForBanner = (index: number) => {
    const banner = banners[index];
    if (!banner || !banner.imageUrl) return;
    setCropperImageSrc(banner.imageUrl);
    setCropperTargetBannerIndex(index);
    setCropperTitle(`Ajustar e Recortar Banner #${index + 1} (${banner.title})`);
    setIsCropperOpen(true);
  };

  const handleCropComplete = (croppedDataUrl: string) => {
    if (cropperTargetBannerIndex !== null) {
      handleUpdateBanner(cropperTargetBannerIndex, 'imageUrl', croppedDataUrl);
    }
    setIsCropperOpen(false);
    setCropperTargetBannerIndex(null);
  };

  const triggerAvatarUpload = () => {
    if (avatarInputRef.current) {
      avatarInputRef.current.value = '';
      avatarInputRef.current.click();
    }
  };

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingAvatar(true);
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const minDim = Math.min(img.width, img.height);
          const startX = (img.width - minDim) / 2;
          const startY = (img.height - minDim) / 2;
          const targetSize = Math.min(minDim, 400); // 400x400 max quadrado
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetSize, targetSize);
            const compressed = canvas.toDataURL('image/webp', 0.9);
            setAvatarUrl(compressed);
          } else {
            setAvatarUrl(rawDataUrl);
          }
          setIsUploadingAvatar(false);
        };
        img.onerror = () => {
          setIsUploadingAvatar(false);
          alert('Erro ao carregar a imagem selecionada.');
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao processar avatar:', err);
      setIsUploadingAvatar(false);
      alert('Falha ao processar arquivo de imagem do avatar.');
    }
  };

  const handleSaveProfile = async () => {
    if (!slug.trim()) {
      alert('Por favor, informe a URL do cliente (slug). Ex: kelvin ou dra-mariana');
      return;
    }

    try {
      setIsSaving(true);
      const profileData: ClientProfile = {
        slug: slug.trim().toLowerCase(),
        showHero,
        avatarUrl: avatarUrl.trim(),
        name: name.trim() || slug.trim(),
        title: title.trim() || `${name.trim() || slug.trim()} • Konverops`,
        description: description.trim() || `Bio Link Oficial de ${name.trim() || slug.trim()}`,
        showNicheBadge,
        nicheBadge: nicheBadge.trim(),
        badgeBgColor,
        pageBgColor,
        cardBgColor,
        bannerBorderRadius,
        bannerBorderStyle,
        bannerShadow,
        bannerElevation,
        metaPixelId: metaPixelId.trim(),
        metaAccessToken: metaAccessToken.trim(),
        metaTestEventCode: metaTestEventCode.trim(),
        footerUrl: `konverops.tech/${slug.trim().toLowerCase()}`,
        banners,
      };

      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      const data = await res.json();
      if (data.success) {
        setSaveSuccessUrl(`https://www.konverops.tech/${profileData.slug}`);
        await fetchProfiles();
      } else {
        alert(data.error || 'Erro ao salvar perfil.');
      }
    } catch {
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

  const currentAnalyticsProfile = profiles.find((p) => p.slug === selectedAnalyticsSlug);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 antialiased font-sans flex flex-col">
      {/* Hidden File Input for Banner Uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Hidden File Input for Avatar Uploads */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={onAvatarFileChange}
        accept="image/png,image/jpeg,image/webp,image/avif"
        className="hidden"
      />

      {/* Top Navigation */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 shadow-md shadow-emerald-500/20">
            K
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Konverops Bio Studio
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Analytics & Canvas Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Telemetria de Tráfego Único, Geolocalização, Rastreamento CAPI & Auditoria Anti-Bot
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {view === 'editor' && (
            <>
              <button
                onClick={() => setView('list')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                ← Voltar aos Clientes
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black tracking-wide uppercase transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                {isSaving ? 'Salvando...' : '✓ Salvar & Publicar'}
              </button>
            </>
          )}

          {view === 'analytics' && (
            <>
              <button
                onClick={() => setView('list')}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                ← Voltar aos Clientes
              </button>
              {currentAnalyticsProfile && (
                <button
                  onClick={() => handleEditProfile(currentAnalyticsProfile)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-slate-700 transition-colors"
                >
                  Editar Canvas ✏️
                </button>
              )}
            </>
          )}

          {view === 'list' && (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 mr-2"
            >
              + Criar Novo Cliente
            </button>
          )}

          {/* ADMIN USER CONTROLS: CHANGE PASSWORD & LOGOUT */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              type="button"
              onClick={() => setShowPasswordModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors text-xs font-semibold"
              title="Alterar Senha de Administrador"
            >
              🔑
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors text-xs font-semibold flex items-center gap-1"
              title="Encerrar sessão"
            >
              <span>Sair</span> 🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {view === 'list' && (
        /* LIST OF ALL CLIENTS WITH QUICK ANALYTICS */
        <main className="flex-1 max-w-6xl w-full mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Clientes Cadastrados</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Páginas ativas com telemetria de visualizações totais/únicas e monitoramento de cliques
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              Total: {profiles.length} página(s)
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm">Carregando páginas de clientes...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {profiles.map((p) => {
                const metrics = summaryMetrics[p.slug] || {
                  views: 0,
                  uniqueViews: 0,
                  clicks: 0,
                  uniqueClicks: 0,
                  ctr: 0,
                };
                return (
                  <div
                    key={p.slug}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        {p.showNicheBadge && p.nicheBadge ? (
                          <span
                            style={{ backgroundColor: p.badgeBgColor || '#00b768' }}
                            className="px-3 py-1 rounded-full text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm"
                          >
                            {p.nicheBadge}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold text-[10px]">
                            Pílula Oculta
                          </span>
                        )}

                        <div className="flex items-center gap-2">
                          {p.metaPixelId && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                              Pixel Ativo
                            </span>
                          )}
                          <span className="text-xs text-slate-500 font-mono">
                            {p.banners?.length || 0} banner(s)
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {p.avatarUrl ? (
                          <div className="w-11 h-11 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex-shrink-0 shadow-md">
                            <img
                              src={p.avatarUrl}
                              alt={p.name || p.slug}
                              className="w-full h-full object-cover rounded-full bg-slate-900"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-slate-800 text-emerald-400 font-black flex items-center justify-center text-xs flex-shrink-0 border border-slate-700">
                            {(p.name || p.slug).substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="overflow-hidden">
                          <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5 truncate">
                            <span>{p.name || p.slug}</span>
                            <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[9px] font-black inline-flex items-center justify-center flex-shrink-0">
                              ✓
                            </span>
                          </h3>
                          {p.title && (
                            <p className="text-[11px] font-semibold text-emerald-400/90 truncate">
                              {p.title}
                            </p>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {p.description || 'Página de bio personalizada.'}
                      </p>

                      <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-emerald-400 truncate">
                        konverops.tech/{p.slug}
                      </div>

                      {/* QUICK METRICS BADGES (TOTAIS E ÚNICOS) */}
                      <div className="mt-3 grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-center">
                        <div>
                          <span className="text-[10px] font-medium text-slate-400 block">Views</span>
                          <strong className="text-xs font-bold text-cyan-400 font-mono block">
                            {metrics.views}
                          </strong>
                          <span className="text-[9px] text-cyan-300/70 font-mono">
                            ({metrics.uniqueViews} ún.)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-slate-400 block">Cliques</span>
                          <strong className="text-xs font-bold text-emerald-400 font-mono block">
                            {metrics.clicks}
                          </strong>
                          <span className="text-[9px] text-emerald-300/70 font-mono">
                            ({metrics.uniqueClicks} ún.)
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-medium text-slate-400 block">CTR</span>
                          <strong className="text-xs font-bold text-amber-400 font-mono block">
                            {metrics.ctr}%
                          </strong>
                          <span className="text-[9px] text-amber-300/70">conversão</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5">
                      <button
                        onClick={() => handleOpenAnalytics(p.slug)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        📊 Métricas
                      </button>

                      <button
                        onClick={() => handleEditProfile(p)}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                      >
                        Canvas
                      </button>

                      <a
                        href={`/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
                        title="Abrir página ao vivo"
                      >
                        ↗
                      </a>

                      {p.slug !== 'kelvin' && (
                        <button
                          onClick={() => handleDeleteProfile(p.slug)}
                          className="py-1.5 px-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
                          title="Excluir"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* DEDICATED ANALYTICS DASHBOARD VIEW */}
      {view === 'analytics' && (
        <main className="flex-1 max-w-6xl w-full mx-auto p-6 space-y-6">
          {/* Analytics Header & Client / Period Selector */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-5 rounded-2xl shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
                <span className="text-xs font-mono uppercase text-blue-400 font-bold tracking-wider">
                  Telemetria Avançada & Geolocalização
                </span>
              </div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                {currentAnalyticsProfile?.name || selectedAnalyticsSlug}
                <a
                  href={`/${selectedAnalyticsSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono text-emerald-400 hover:underline font-normal bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"
                >
                  konverops.tech/{selectedAnalyticsSlug} ↗
                </a>
              </h2>
            </div>

            {/* Controls: Switch Client + Period Tabs + Refresh */}
            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedAnalyticsSlug}
                onChange={(e) => {
                  setSelectedAnalyticsSlug(e.target.value);
                  fetchAnalytics(e.target.value, analyticsPeriod);
                }}
                className="bg-slate-950 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2 outline-none focus:border-blue-500"
              >
                {profiles.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name || p.slug} ({p.slug})
                  </option>
                ))}
              </select>

              {/* Period Tabs */}
              <div className="flex items-center bg-slate-950 border border-slate-800 p-1 rounded-xl">
                {(
                  [
                    { id: 'today', label: 'Hoje' },
                    { id: '7d', label: 'Últimos 7 dias' },
                    { id: '30d', label: '30 dias' },
                    { id: 'all', label: 'Vitalício' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handlePeriodChange(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      analyticsPeriod === tab.id
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Refresh Button */}
              <button
                onClick={() => fetchAnalytics(selectedAnalyticsSlug, analyticsPeriod)}
                disabled={loadingAnalytics}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                title="Atualizar dados"
              >
                {loadingAnalytics ? '...' : '↻'}
              </button>
            </div>
          </div>

          {loadingAnalytics && !analyticsReport ? (
            <div className="p-16 text-center text-slate-500 text-sm">
              Carregando dados estatísticos em tempo real...
            </div>
          ) : analyticsReport ? (
            <>
              {/* 4 HERO KPI METRICS CARDS WITH UNIQUE BADGES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Visualizações de Página (Totais e Únicas) */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Visualizações</span>
                    <span className="text-xl">👁️</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
                      {analyticsReport.totalViews.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-slate-500">totais</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
                      <span>👤</span> {analyticsReport.uniqueViews.toLocaleString('pt-BR')} únicas
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {analyticsReport.totalViews > 0
                        ? `${((analyticsReport.uniqueViews / analyticsReport.totalViews) * 100).toFixed(0)}% novos`
                        : '0%'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 opacity-60"></div>
                </div>

                {/* KPI 2: Cliques em Banners (Totais e Únicos) */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Cliques Totais</span>
                    <span className="text-xl">👆</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                      {analyticsReport.totalClicks.toLocaleString('pt-BR')}
                    </span>
                    <span className="text-xs text-slate-500">totais</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <span>🎯</span> {analyticsReport.uniqueClicks.toLocaleString('pt-BR')} pessoas únicas
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {analyticsReport.totalClicks > 0
                        ? `${((analyticsReport.uniqueClicks / analyticsReport.totalClicks) * 100).toFixed(0)}% únicos`
                        : '0%'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-60"></div>
                </div>

                {/* KPI 3: Taxa de Conversão (CTR Total vs Único) */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Taxa de Conversão</span>
                    <span className="text-xl">🎯</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                      {analyticsReport.ctrTotal}%
                    </span>
                    <span className="text-xs text-slate-500">CTR Geral</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-amber-300">
                      CTR Único: {analyticsReport.ctrUnique}%
                    </span>
                    <span className="text-[10px] text-slate-400">conversão real</span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500 opacity-60"></div>
                </div>

                {/* KPI 4: Banner Campeão */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
                  <div className="flex items-center justify-between text-slate-400 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">Top Elemento</span>
                    <span className="text-xl">🏆</span>
                  </div>
                  <div className="text-base font-bold text-white truncate mt-0.5">
                    {analyticsReport.topBanner ? analyticsReport.topBanner.title : 'Sem cliques'}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-purple-300">
                    <span>
                      {analyticsReport.topBanner
                        ? `${analyticsReport.topBanner.clicks} cliques totais`
                        : '-'}
                    </span>
                    <span className="text-slate-400">
                      {analyticsReport.topBanner
                        ? `(${analyticsReport.topBanner.uniqueClicks} únicos)`
                        : ''}
                    </span>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500 opacity-60"></div>
                </div>
              </div>

              {/* TIMELINE VISUAL DIÁRIA (VIEWS TOTAIS/ÚNICAS VS CLIQUES) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>📈</span> Desempenho Diário: Visualizações e Cliques
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Passe o cursor sobre os dias para comparar acessos totais e visitantes únicos
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-semibold flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-cyan-400"></span>
                      <span className="text-slate-300">Views</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded bg-emerald-400"></span>
                      <span className="text-slate-300">Cliques</span>
                    </div>
                  </div>
                </div>

                {analyticsReport.daily.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs">Sem dados históricos.</div>
                ) : (
                  <div className="pt-4">
                    {(() => {
                      const maxVal = Math.max(
                        ...analyticsReport.daily.map((d) => Math.max(d.views, d.clicks)),
                        5
                      );

                      return (
                        <div className="flex items-end gap-2 sm:gap-4 h-48 w-full border-b border-slate-800 pb-2 overflow-x-auto">
                          {analyticsReport.daily.map((point) => {
                            const viewHeightPercent = Math.max((point.views / maxVal) * 100, 4);
                            const clickHeightPercent = Math.max((point.clicks / maxVal) * 100, 4);

                            return (
                              <div
                                key={point.date}
                                className="flex-1 flex flex-col items-center justify-end h-full min-w-[38px] group relative"
                              >
                                {/* Tooltip Rico com Totais e Únicos */}
                                <div className="absolute -top-16 bg-slate-950 border border-slate-700 text-white text-[10px] rounded-lg p-2.5 shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 space-y-0.5">
                                  <div className="font-bold text-slate-300 border-b border-slate-800 pb-1">
                                    {point.date}
                                  </div>
                                  <div className="text-cyan-400">
                                    👁️ {point.views} views ({point.uniqueViews} únicas)
                                  </div>
                                  <div className="text-emerald-400">
                                    👆 {point.clicks} cliques ({point.uniqueClicks} únicos)
                                  </div>
                                  <div className="text-amber-400">🎯 {point.ctr}% CTR</div>
                                </div>

                                {/* Bars Container */}
                                <div className="w-full flex items-end justify-center gap-1 h-full">
                                  <div
                                    style={{ height: `${viewHeightPercent}%` }}
                                    className="w-2.5 sm:w-3.5 bg-cyan-500/80 hover:bg-cyan-400 rounded-t-md transition-all shadow-sm"
                                  ></div>
                                  <div
                                    style={{ height: `${clickHeightPercent}%` }}
                                    className="w-2.5 sm:w-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-t-md transition-all shadow-sm"
                                  ></div>
                                </div>

                                {/* Date Label */}
                                <span className="text-[10px] text-slate-400 font-medium mt-2 truncate w-full text-center">
                                  {point.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* DETAILED METRICS PER BANNER / ELEMENT (TOTAIS E ÚNICOS) */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>⚡</span> Desempenho por Banner Comercial
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Contagem de cliques totais e pessoas únicas em cada elemento
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                    {analyticsReport.banners.length} elemento(s)
                  </span>
                </div>

                {analyticsReport.banners.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                    Nenhum clique registrado em banners ainda neste período.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                          <th className="pb-3 pl-2">Banner / Elemento</th>
                          <th className="pb-3">Evento Meta</th>
                          <th className="pb-3 text-right">Cliques Totais</th>
                          <th className="pb-3 text-right">Pessoas Únicas</th>
                          <th className="pb-3 pl-6">Participação (%)</th>
                          <th className="pb-3 text-right pr-2">CTR Específico</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-medium">
                        {analyticsReport.banners.map((item, index) => {
                          const bannerMeta = currentAnalyticsProfile?.banners?.find(
                            (b) => b.id === item.bannerId
                          );

                          return (
                            <tr key={item.bannerId} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3.5 pl-2 flex items-center gap-3">
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-mono">
                                  #{index + 1}
                                </span>
                                {bannerMeta?.imageUrl && (
                                  <div className="w-16 h-8 rounded-lg overflow-hidden bg-slate-950 border border-slate-700 flex-shrink-0">
                                    <img
                                      src={bannerMeta.imageUrl}
                                      alt={item.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                )}
                                <div>
                                  <strong className="text-white block">{item.title}</strong>
                                  <span className="text-[10px] font-mono text-slate-500">
                                    ID: {item.bannerId}
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5">
                                {bannerMeta?.trackingEvent ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/25">
                                    {bannerMeta.trackingEvent}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[11px]">-</span>
                                )}
                              </td>

                              <td className="py-3.5 text-right font-mono font-bold text-emerald-400 text-sm">
                                {item.clicks}
                              </td>

                              <td className="py-3.5 text-right font-mono font-bold text-cyan-300 text-sm">
                                {item.uniqueClicks}
                              </td>

                              <td className="py-3.5 pl-6 min-w-[150px]">
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                      style={{ width: `${item.percentage}%` }}
                                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                                    ></div>
                                  </div>
                                  <span className="font-mono text-[11px] text-slate-300 w-10 text-right">
                                    {item.percentage}%
                                  </span>
                                </div>
                              </td>

                              <td className="py-3.5 text-right pr-2 font-mono font-bold text-amber-400">
                                {item.ctr}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* NOVO BLOCO: GEOLOCALIZAÇÃO & ORIGEM DO TRÁFEGO */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. PAÍSES */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>🌍</span> Origem por País
                    </h4>
                    <span className="text-[10px] text-slate-500">Edge Telemetry</span>
                  </div>

                  {analyticsReport.geo.countries.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Sem registros geográficos ainda.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {analyticsReport.geo.countries.map((c) => (
                        <div key={c.code} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 font-medium text-slate-200">
                              <span>{c.flag}</span> {c.name}
                            </span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              {c.count} ({c.percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${c.percentage}%` }}
                              className="h-full bg-blue-500 rounded-full"
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. REGIÕES / ESTADOS */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>📍</span> Regiões & Estados
                    </h4>
                    <span className="text-[10px] text-slate-500">Distribuição</span>
                  </div>

                  {analyticsReport.geo.regions.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Sem dados de estado ainda.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {analyticsReport.geo.regions.map((r) => (
                        <div key={r.code} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200 truncate max-w-[170px]">
                              {r.name}
                            </span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              {r.count} ({r.percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${r.percentage}%` }}
                              className="h-full bg-emerald-500 rounded-full"
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. CIDADES */}
                <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <span>🏙️</span> Principais Cidades
                    </h4>
                    <span className="text-[10px] text-slate-500">Top Acessos</span>
                  </div>

                  {analyticsReport.geo.cities.length === 0 ? (
                    <div className="py-8 text-center text-slate-500 text-xs">
                      Sem dados de cidade ainda.
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {analyticsReport.geo.cities.map((city) => (
                        <div key={city.name} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-200 truncate max-w-[170px]">
                              {city.name}
                            </span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              {city.count} ({city.percentage}%)
                            </span>
                          </div>
                          <div className="h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              style={{ width: `${city.percentage}%` }}
                              className="h-full bg-amber-500 rounded-full"
                            ></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* NOVO BLOCO: AUDITORIA DE SEGURANÇA & MONITOR DE BOT/ATAQUE */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>🛡️</span> Monitor de Segurança & Auditoria Anti-Bot
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Rastreamento de IPs de origem para prevenção de varreduras artificiais e ataques
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {analyticsReport.security.status === 'healthy' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        Tráfego Saudável
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 flex items-center gap-1.5 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-400"></span>
                        Alerta de Tráfego Anômalo
                      </span>
                    )}
                  </div>
                </div>

                {analyticsReport.security.warningMessage && (
                  <div className="mb-4 p-3.5 rounded-xl bg-red-500/15 border border-red-500/30 text-xs text-red-300 font-medium">
                    {analyticsReport.security.warningMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Dispersão de Rede
                    </span>
                    <div className="text-2xl font-black text-white font-mono">
                      {analyticsReport.security.totalDistinctIps}
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Endereços IP únicos ativos hoje. Quanto maior a dispersão em relação às views,
                      mais legítimo e orgânico é o tráfego de usuários reais.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                      IPs Mais Ativos Hoje (Anonimizados)
                    </span>
                    {analyticsReport.security.topIps.length === 0 ? (
                      <div className="text-slate-500 text-xs py-4 text-center">
                        Nenhum IP registrado hoje.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {analyticsReport.security.topIps.map((entry) => (
                          <div
                            key={entry.ip}
                            className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800"
                          >
                            <span className="font-mono text-slate-300 text-xs flex items-center gap-2">
                              <span>🌐</span> {entry.ip}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-white text-xs">
                                {entry.count} reqs
                              </span>
                              {entry.isSuspicious ? (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                                  Suspeito
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/15 text-emerald-400">
                                  Normal
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </main>
      )}

      {/* ELEMENTOR CANVAS BUILDER (SPLIT SCREEN) */}
      {view === 'editor' && (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT PANEL */}
          <div className="w-full lg:w-7/12 p-6 overflow-y-auto max-h-[calc(100vh-73px)] border-r border-slate-800 bg-[#0a0f1d]/50">
            {saveSuccessUrl && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <span>✓</span> Página salva e publicada com sucesso!
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Seu link já está ativo na internet:
                  </p>
                </div>
                <a
                  href={saveSuccessUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wide hover:bg-emerald-400 transition-colors"
                >
                  Abrir Link ↗
                </a>
              </div>
            )}

            {/* Step 1: Client Settings & Page Visuals */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 mb-5 shadow-lg space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                  1
                </span>
                Identificação & Seção Hero (Apresentação do Cliente)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    URL da Página (Slug)
                  </label>
                  <div className="flex items-center rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs">
                    <span className="text-slate-500 mr-1 select-none">konverops.tech/</span>
                    <input
                      type="text"
                      value={slug}
                      onChange={(e) =>
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))
                      }
                      placeholder="kelvin"
                      className="bg-transparent text-white font-bold outline-none flex-1 placeholder:text-slate-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nome do Cliente / Especialista
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kelvin Gonzaga"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* TOGGLE HERO SECTION */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">
                      Exibir Seção Hero no Topo (Foto + Bio + CTA)
                    </label>
                    <p className="text-[11px] text-slate-400">
                      {showHero
                        ? 'Ativa: Exibe foto/logo com anel gradiente, nome verificado, especialidade e texto de chamada para os banners.'
                        : 'Desativada: Oculta o topo e inicia a página diretamente nos banners.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowHero(!showHero)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      showHero ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showHero ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {showHero && (
                  <div className="mt-3 p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3.5 animate-fadeIn">
                    {/* Upload de Avatar / Foto de Perfil */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="relative group flex-shrink-0">
                        {avatarUrl ? (
                          <div className="w-16 h-16 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-md">
                            <img
                              src={avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover rounded-full bg-slate-900"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs text-center bg-slate-900">
                            Sem Foto
                          </div>
                        )}
                      </div>

                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={triggerAvatarUpload}
                            disabled={isUploadingAvatar}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1.5"
                          >
                            <span>📷</span> {isUploadingAvatar ? 'Processando...' : avatarUrl ? 'Trocar Foto / Logo' : 'Subir Foto de Perfil / Logo'}
                          </button>
                          {avatarUrl && (
                            <button
                              type="button"
                              onClick={() => setAvatarUrl('')}
                              className="px-2.5 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-colors"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Corte 1:1 quadrado automático em alta resolução com compressão WebP de carregamento ultra rápido.
                        </p>
                      </div>
                    </div>

                    {/* Cargo / Especialidade */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Cargo / Especialidade / Nicho Principal
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Ex: Fundador & Head of Sales Engineering • Konverops"
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-slate-600"
                      />
                    </div>

                    {/* Descrição & CTA */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1">
                        Texto de Apresentação & Chamada para os Banners (CTA)
                      </label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Engenharia de Vendas B2B & Infraestrutura Web de Ultra Performance. Selecione uma das opções abaixo para falar diretamente comigo no WhatsApp ou agendar um diagnóstico."
                        className="w-full rounded-xl bg-slate-900 border border-slate-700 p-3 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-slate-600 leading-relaxed resize-none"
                      />
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        Dica: Descreva quem é a empresa/expert e oriente o visitante a clicar nos banners abaixo.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* TOGGLE PÍLULA DE NICHO */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">
                      Exibir Pílula de Nicho no Topo
                    </label>
                    <p className="text-[11px] text-slate-400">
                      {showNicheBadge
                        ? 'Visível: Mostra a etiqueta de categoria no topo do smartphone.'
                        : 'Desativada: Oculta a etiqueta para um visual 100% focado e limpo.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNicheBadge(!showNicheBadge)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      showNicheBadge ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showNicheBadge ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {showNicheBadge && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Texto da Pílula de Nicho
                      </label>
                      <input
                        type="text"
                        value={nicheBadge}
                        onChange={(e) => setNicheBadge(e.target.value)}
                        placeholder="Nutricionista"
                        className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Cor da Pílula
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={badgeBgColor}
                          onChange={(e) => setBadgeBgColor(e.target.value)}
                          className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                        />
                        <div className="flex items-center gap-1.5">
                          {['#00b768', '#0748b3', '#8b5cf6', '#d97706', '#dc2626'].map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setBadgeBgColor(color)}
                              style={{ backgroundColor: color }}
                              className={`w-5 h-5 rounded-full border-2 transition-transform ${
                                badgeBgColor === color ? 'border-white scale-110' : 'border-transparent'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* PERSONALIZAÇÃO DE CORES DA PÁGINA */}
              <div className="pt-2 border-t border-slate-800/80">
                <label className="text-xs font-bold text-slate-200 block mb-2">
                  Paleta de Cores da Página
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Fundo da Tela (Background)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="color"
                        value={pageBgColor}
                        onChange={(e) => setPageBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={pageBgColor}
                        onChange={(e) => setPageBgColor(e.target.value)}
                        className="w-24 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { name: 'Obsidian', color: '#070b14' },
                        { name: 'Slate', color: '#0f172a' },
                        { name: 'Branco', color: '#ffffff' },
                        { name: 'Neve', color: '#f8fafc' },
                        { name: 'Cinza', color: '#eef2f6' },
                        { name: 'Esmeralda', color: '#052e16' },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setPageBgColor(item.color)}
                          className="px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-1 bg-slate-900 text-slate-300"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <label className="block text-[11px] font-bold text-slate-400 mb-1">
                      Container dos Banners (Card)
                    </label>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="color"
                        value={cardBgColor}
                        onChange={(e) => setCardBgColor(e.target.value)}
                        className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={cardBgColor}
                        onChange={(e) => setCardBgColor(e.target.value)}
                        className="w-24 rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-xs text-white font-mono"
                      />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { name: 'Dark Navy', color: '#0a0f1d' },
                        { name: 'Branco', color: '#ffffff' },
                        { name: 'Dark Slate', color: '#1e293b' },
                        { name: 'Black', color: '#020408' },
                      ].map((item) => (
                        <button
                          key={item.color}
                          type="button"
                          onClick={() => setCardBgColor(item.color)}
                          className="px-2 py-0.5 rounded text-[10px] font-medium border border-slate-700 hover:border-slate-500 transition-colors flex items-center gap-1 bg-slate-900 text-slate-300"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/20"
                            style={{ backgroundColor: item.color }}
                          />
                          {item.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONFIGURAÇÃO DE BORDAS, SOMBRAS E ELEVAÇÃO DOS BANNERS */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-bold text-slate-200 block">
                      Bordas, Sombras & Efeito de Elevação dos Banners
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Personalize bordas, sombras e elimine marcas falsas em banners com recortes/pop-out
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                  {/* Linha 1: Cantos e Linha de Borda */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        Arredondamento dos Cantos
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: 'none', label: 'Reto (0px)' },
                          { id: 'sm', label: 'Sutil (10px)' },
                          { id: 'md', label: 'Refinado (16px)' },
                          { id: 'lg', label: 'Moderno (20px)' },
                          { id: 'xl', label: 'Curvado (26px)' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBannerBorderRadius(item.id as BannerBorderRadius)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                              bannerBorderRadius === item.id
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        Estilo da Linha de Borda
                      </label>
                      <div className="space-y-1.5">
                        {[
                          { id: 'subtle', label: 'Sutil Elegante (Hairline 1px)', desc: 'Contraste suave' },
                          { id: 'glow', label: 'Esmeralda Glow', desc: 'Borda com brilho' },
                          { id: 'none', label: 'Sem Borda', desc: 'Zero contorno (ideal para pop-out)' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBannerBorderStyle(item.id as BannerBorderStyle)}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                              bannerBorderStyle === item.id
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className="text-[10px] text-slate-400 font-normal">{item.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Linha 2: Efeito de Sombra e Elevação (Hover) */}
                  <div className="pt-3 border-t border-slate-800/70 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-[11px] font-bold text-slate-300">
                          Posicionamento da Sombra
                        </label>
                        <span className="text-[10px] text-emerald-400 font-mono">
                          {bannerShadow === 'none' ? 'Flat / Pop-out' : bannerShadow}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'none', label: '🚫 Sem Sombra', desc: 'Flat (sem caixa falsa)' },
                          { id: 'bottom', label: '⬇️ Somente Embaixo', desc: 'Topo 100% limpo' },
                          { id: 'top', label: '⬆️ Somente no Topo', desc: 'Sombra superior' },
                          { id: 'full', label: '🔄 Sombra Completa', desc: 'Em toda a volta' },
                          { id: 'subtle', label: '✨ Sombra Suave', desc: 'Profundidade leve' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setBannerShadow(item.id as BannerShadow)}
                            className={`py-2 px-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex flex-col justify-between ${
                              bannerShadow === item.id
                                ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold shadow-sm'
                                : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <span className="truncate">{item.label}</span>
                            <span
                              className={`text-[10px] mt-0.5 ${
                                bannerShadow === item.id
                                  ? 'text-slate-900/80 font-medium'
                                  : 'text-slate-500'
                              }`}
                            >
                              {item.desc}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        Efeito de Elevação ao Passar o Mouse (Hover Lift)
                      </label>
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setBannerElevation(true)}
                          className={`w-full p-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                            bannerElevation
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div>
                            <span className="block font-bold">Elemento Elevado (Flutuante)</span>
                            <span className="text-[10px] text-slate-400">
                              O banner levanta levemente (-translate-y) ao passar o mouse ou tocar.
                            </span>
                          </div>
                          {bannerElevation && <span className="text-emerald-400 font-bold text-sm">✓</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => setBannerElevation(false)}
                          className={`w-full p-2.5 rounded-lg text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                            !bannerElevation
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold'
                              : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-600'
                          }`}
                        >
                          <div>
                            <span className="block font-bold">Elemento Estático (100% Fixo)</span>
                            <span className="text-[10px] text-slate-400">
                              Sem movimento vertical ou projeção de sombra extra ao interagir.
                            </span>
                          </div>
                          {!bannerElevation && <span className="text-emerald-400 font-bold text-sm">✓</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RASTREAMENTO META ADS & CAPI */}
              <div className="pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    Rastreamento Meta Ads (Pixel & CAPI Server-Side Oficial)
                  </label>
                  <span className="text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                    Deduplicação Automática via eventID
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 bg-blue-950/20 rounded-xl border border-blue-900/40">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Meta Pixel / Dataset ID
                    </label>
                    <input
                      type="text"
                      value={metaPixelId}
                      onChange={(e) => setMetaPixelId(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 123456789012345"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500 placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Token CAPI (Conversions API)
                    </label>
                    <input
                      type="password"
                      value={metaAccessToken}
                      onChange={(e) => setMetaAccessToken(e.target.value)}
                      placeholder="Token EAAB... (Opcional)"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500 placeholder:text-slate-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Test Event Code
                    </label>
                    <input
                      type="text"
                      value={metaTestEventCode}
                      onChange={(e) => setMetaTestEventCode(e.target.value.toUpperCase())}
                      placeholder="Ex: TEST12345 (Opcional)"
                      className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2.5 py-1.5 text-xs text-white font-mono outline-none focus:border-blue-500 placeholder:text-slate-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Graphic Banners Manager */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                    2
                  </span>
                  Banners Gráficos & Configuração de Eventos
                </h3>
                <button
                  type="button"
                  onClick={handleAddBanner}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                >
                  + Adicionar Banner
                </button>
              </div>

              {banners.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                  Nenhum banner cadastrado. Clique no botão acima para adicionar o primeiro banner.
                </div>
              ) : (
                <div className="space-y-4">
                  {banners.map((banner, index) => (
                    <div
                      key={banner.id || index}
                      className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row gap-4 items-start"
                    >
                      <div className="w-full md:w-48 flex-shrink-0 flex flex-col items-center">
                        <div className="relative w-full h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shadow-md">
                          {banner.imageUrl ? (
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[11px] text-slate-500">
                              Sem Imagem
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 w-full mt-2">
                          <button
                            type="button"
                            onClick={() => triggerImageUpload(index)}
                            className="flex-1 py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1"
                            title="Subir nova imagem e recortar"
                          >
                            <span>📁</span> Subir
                          </button>
                          {banner.imageUrl && (
                            <button
                              type="button"
                              onClick={() => handleOpenCropperForBanner(index)}
                              className="py-1.5 px-2.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold border border-emerald-500/30 transition-colors flex items-center justify-center gap-1"
                              title="Ajustar e Recortar Imagem Atual"
                            >
                              <span>✂️</span> Recortar
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 w-full space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            Banner #{index + 1} (ID: {banner.id})
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(index, 'up')}
                              disabled={index === 0}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30 text-xs"
                              title="Subir"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBanner(index, 'down')}
                              disabled={index === banners.length - 1}
                              className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 disabled:opacity-30 text-xs"
                              title="Descer"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveBanner(index)}
                              className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs"
                              title="Remover"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">
                              Título / Nome Comercial
                            </label>
                            <input
                              type="text"
                              value={banner.title}
                              onChange={(e) =>
                                handleUpdateBanner(index, 'title', e.target.value)
                              }
                              placeholder="Ex: Fale no WhatsApp"
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">
                              Link de Destino
                            </label>
                            <input
                              type="text"
                              value={banner.destinationUrl}
                              onChange={(e) =>
                                handleUpdateBanner(index, 'destinationUrl', e.target.value)
                              }
                              placeholder="https://wa.me/55..."
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                            />
                          </div>
                        </div>

                        <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                                Evento Meta Oficial
                              </label>
                              <select
                                value={banner.trackingEvent || 'Contact'}
                                onChange={(e) =>
                                  handleUpdateBanner(
                                    index,
                                    'trackingEvent',
                                    e.target.value as MetaStandardEvent
                                  )
                                }
                                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                              >
                                <option value="Contact">Contact (WhatsApp / Chat)</option>
                                <option value="Schedule">Schedule (Agendamento)</option>
                                <option value="Lead">Lead (Isca / Proposta)</option>
                                <option value="InitiateCheckout">InitiateCheckout (Checkout)</option>
                                <option value="ViewContent">ViewContent (Catálogo / Detalhes)</option>
                                <option value="Custom">Custom (Personalizado)</option>
                                <option value="None">None (Desativado)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                                Categoria do Conteúdo
                              </label>
                              <input
                                type="text"
                                value={banner.eventCategory || 'WhatsApp'}
                                onChange={(e) =>
                                  handleUpdateBanner(index, 'eventCategory', e.target.value)
                                }
                                placeholder="WhatsApp, Consultoria..."
                                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-300 mb-0.5">
                                Valor Estimado (R$)
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                value={banner.eventValue ?? 0}
                                onChange={(e) =>
                                  handleUpdateBanner(
                                    index,
                                    'eventValue',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="0.00"
                                className="w-full rounded-lg bg-slate-950 border border-slate-700 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                              />
                            </div>
                          </div>

                          {banner.trackingEvent === 'Custom' && (
                            <div>
                              <label className="block text-[10px] font-bold text-emerald-400 mb-0.5">
                                Nome do Evento Customizado
                              </label>
                              <input
                                type="text"
                                value={banner.customEventName || ''}
                                onChange={(e) =>
                                  handleUpdateBanner(index, 'customEventName', e.target.value)
                                }
                                placeholder="Ex: Click_Bio_VIP"
                                className="w-full rounded-lg bg-slate-950 border border-emerald-500/50 px-2 py-1.5 text-xs text-white outline-none font-mono"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 flex items-center justify-between p-4 rounded-2xl bg-slate-900/90 border border-slate-800">
              <span className="text-xs text-slate-400">
                Página será publicada em:{' '}
                <strong className="text-emerald-400">konverops.tech/{slug || '...'}</strong>
              </span>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
              >
                {isSaving ? 'Publicando...' : 'Salvar & Publicar Página'}
              </button>
            </div>
          </div>

          {/* RIGHT PANEL: LIVE CANVAS SMARTPHONE PREVIEW */}
          <div
            style={{ backgroundColor: pageBgColor }}
            className="w-full lg:w-5/12 p-6 flex flex-col items-center justify-start border-l border-slate-800/80 transition-colors duration-300 overflow-y-auto max-h-[calc(100vh-73px)]"
          >
            <div className="mb-4 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Canvas Live Preview (Em Tempo Real)
              </span>
              {metaPixelId && (
                <span className="text-[10px] font-mono text-blue-400 mt-1 block">
                  ● Meta Pixel: {metaPixelId} (Ativo)
                </span>
              )}
            </div>

            {/* SMARTPHONE DEVICE CONTAINER */}
            <div
              style={{ backgroundColor: pageBgColor }}
              className="relative w-[340px] max-w-full rounded-[42px] shadow-2xl shadow-black/70 border-[8px] border-slate-900 overflow-hidden pb-6 transition-colors duration-300 flex flex-col items-center"
            >
              {/* STATUS BAR */}
              <div
                className={`w-full pt-3 px-6 flex justify-between items-center text-[10px] font-semibold ${
                  isLight ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-slate-900 rounded-full"></div>
                <span>5G</span>
              </div>

              {/* SEÇÃO HERO DO CLIENTE NO SMARTPHONE */}
              {showHero && (
                <div className="w-full px-4 pt-4 pb-2 flex flex-col items-center text-center animate-fadeIn">
                  {/* Avatar / Foto com Anel Gradiente */}
                  {avatarUrl && (
                    <div className="relative mb-2.5">
                      <div className="w-20 h-20 rounded-full overflow-hidden p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 shadow-md shadow-emerald-500/20">
                        <img
                          src={avatarUrl}
                          alt={name || slug}
                          className="w-full h-full object-cover rounded-full bg-slate-900 select-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pílula de Nicho (se ativada) */}
                  {showNicheBadge && nicheBadge && (
                    <div className="mb-2">
                      <span
                        style={{ backgroundColor: badgeBgColor || '#00b768' }}
                        className="px-3.5 py-0.5 rounded-full text-white font-black text-[10px] tracking-wider uppercase shadow-sm"
                      >
                        {nicheBadge}
                      </span>
                    </div>
                  )}

                  {/* Nome do Cliente com Selo Verificado */}
                  <h2
                    className={`text-base font-black ${
                      isLight ? 'text-slate-900' : 'text-white'
                    } tracking-tight flex items-center justify-center gap-1`}
                  >
                    <span>{name || slug || 'Nome do Cliente'}</span>
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-emerald-500 text-slate-950 text-[8px] font-black shadow-sm"
                      title="Verificado"
                    >
                      ✓
                    </span>
                  </h2>

                  {/* Cargo / Especialidade */}
                  {title && (
                    <p
                      className={`text-[11px] font-bold ${
                        isLight ? 'text-emerald-700' : 'text-emerald-400'
                      } mt-0.5 tracking-tight`}
                    >
                      {title}
                    </p>
                  )}

                  {/* Descrição & CTA */}
                  {description && (
                    <p
                      className={`text-[11px] ${
                        isLight ? 'text-slate-600' : 'text-slate-300'
                      } max-w-[280px] mt-1.5 leading-snug font-normal`}
                    >
                      {description}
                    </p>
                  )}
                </div>
              )}

              {/* BANNERS FEED COM APROVEITAMENTO TOTAL DE LARGURA (SEM CONTAINER ARTIFICIAL RESTRITIVO) */}
              <div className={`w-full px-3.5 space-y-2.5 ${!showHero ? 'mt-4' : 'mt-2'}`}>
                {banners.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-700/60 rounded-2xl mx-1">
                    Adicione banners no painel ao lado para visualizar aqui
                  </div>
                ) : (
                  banners.map((b, i) => {
                    const previewRadiusClass =
                      bannerBorderRadius === 'none'
                        ? 'rounded-none'
                        : bannerBorderRadius === 'sm'
                        ? 'rounded-lg'
                        : bannerBorderRadius === 'lg'
                        ? 'rounded-[20px]'
                        : bannerBorderRadius === 'xl'
                        ? 'rounded-[26px]'
                        : 'rounded-[16px]';

                    const previewBorderClass =
                      bannerBorderStyle === 'glow'
                        ? 'border border-emerald-500/40'
                        : bannerBorderStyle === 'none'
                        ? 'border-0'
                        : isLight
                        ? 'border border-slate-900/10'
                        : 'border border-white/10';

                    const previewShadowClass =
                      bannerShadow === 'none'
                        ? 'shadow-none'
                        : bannerShadow === 'bottom'
                        ? isLight
                          ? 'shadow-[0_12px_20px_-5px_rgba(0,0,0,0.08)]'
                          : 'shadow-[0_14px_24px_-6px_rgba(0,0,0,0.55)]'
                        : bannerShadow === 'top'
                        ? isLight
                          ? 'shadow-[0_-10px_18px_-4px_rgba(0,0,0,0.08)]'
                          : 'shadow-[0_-12px_22px_-5px_rgba(0,0,0,0.45)]'
                        : bannerShadow === 'subtle'
                        ? isLight
                          ? 'shadow-sm shadow-slate-300/60'
                          : 'shadow-sm shadow-black/30'
                        : isLight
                        ? 'shadow-md shadow-slate-300/80'
                        : 'shadow-lg shadow-black/40';

                    const previewHoverClass = bannerElevation
                      ? 'active:scale-95 hover:-translate-y-1 transition-all'
                      : 'active:scale-100 transition-none';

                    return (
                      <div
                        key={b.id || i}
                        className={`block relative w-full ${previewRadiusClass} ${previewBorderClass} ${previewShadowClass} ${previewHoverClass} overflow-hidden cursor-pointer group`}
                        style={{ isolation: 'isolate' }}
                      >
                        {b.imageUrl ? (
                          <img
                            src={b.imageUrl}
                            alt={b.title}
                            className={`w-full h-auto object-cover block select-none ${previewRadiusClass}`}
                          />
                        ) : (
                          <div className="h-20 bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                            {b.title}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* RODAPÉ DO SMARTPHONE */}
              <div className="mt-4 text-center">
                <span
                  className={`text-[10px] ${
                    isLight ? 'text-slate-500' : 'text-slate-500'
                  } font-bold opacity-80`}
                >
                  konverops.tech/{slug || 'cliente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/20">
                  🔑
                </span>
                <h3 className="text-base font-bold text-white">Alterar Senha do Admin</h3>
              </div>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordChangeMessage(null);
                }}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {passwordChangeMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  passwordChangeMessage.type === 'success'
                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                    : 'bg-red-500/15 border border-red-500/30 text-red-300'
                }`}
              >
                <span>{passwordChangeMessage.type === 'success' ? '✓' : '⚠️'}</span>
                <span>{passwordChangeMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Nova Senha (Mínimo 6 dígitos)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">
                  Confirme a Nova Senha
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={passwordChangeLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold uppercase tracking-wide transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                >
                  {passwordChangeLoading ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* BANNER IMAGE CROPPER MODAL */}
      <ImageCropperModal
        isOpen={isCropperOpen}
        imageSrc={cropperImageSrc}
        title={cropperTitle}
        defaultAspectRatio={10 / 3}
        onClose={() => {
          setIsCropperOpen(false);
          setCropperTargetBannerIndex(null);
        }}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
}
