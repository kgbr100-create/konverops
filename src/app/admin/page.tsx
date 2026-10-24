'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { ClientProfile, BioBanner, MetaStandardEvent } from '@/data/profiles';

export default function AdminDashboardPage() {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessUrl, setSaveSuccessUrl] = useState<string | null>(null);

  // Form State
  const [slug, setSlug] = useState('');
  const [showNicheBadge, setShowNicheBadge] = useState(false);
  const [nicheBadge, setNicheBadge] = useState('Engenharia de Vendas');
  const [badgeBgColor, setBadgeBgColor] = useState('#00b768');
  const [pageBgColor, setPageBgColor] = useState('#070b14');
  const [cardBgColor, setCardBgColor] = useState('#0a0f1d');
  const [metaPixelId, setMetaPixelId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [metaTestEventCode, setMetaTestEventCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [banners, setBanners] = useState<BioBanner[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Open editor if query param exists
  useEffect(() => {
    if (typeof window !== 'undefined' && profiles.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const editSlug = params.get('edit');
      if (editSlug) {
        const found = profiles.find((p) => p.slug === editSlug);
        if (found) {
          handleEditProfile(found);
        }
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
      }
    } catch (err) {
      console.error('Falha ao carregar perfis:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSlug('');
    setShowNicheBadge(false);
    setNicheBadge('Engenharia de Vendas');
    setBadgeBgColor('#00b768');
    setPageBgColor('#070b14');
    setCardBgColor('#0a0f1d');
    setMetaPixelId('');
    setMetaAccessToken('');
    setMetaTestEventCode('');
    setName('');
    setDescription('');
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
    setShowNicheBadge(profile.showNicheBadge ?? false);
    setNicheBadge(profile.nicheBadge || 'Geral');
    setBadgeBgColor(profile.badgeBgColor || '#00b768');
    setPageBgColor(profile.pageBgColor || '#070b14');
    setCardBgColor(profile.cardBgColor || '#0a0f1d');
    setMetaPixelId(profile.metaPixelId || '');
    setMetaAccessToken(profile.metaAccessToken || '');
    setMetaTestEventCode(profile.metaTestEventCode || '');
    setName(profile.name || '');
    setDescription(profile.description || '');
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
    } catch (err) {
      alert('Erro de conexão ao excluir perfil.');
    }
  };

  // Add new Banner Block
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

  // Reordering
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

  // Upload handler for a specific banner
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
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawDataUrl = event.target?.result as string;

        // Otimização e compressão automática via Canvas
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const targetWidth = Math.min(img.width, 680);
          const scale = targetWidth / img.width;
          canvas.width = targetWidth;
          canvas.height = img.height * scale;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // Exporta WebP leve (~30KB) com 90% de qualidade cristalina
            const compressed = canvas.toDataURL('image/webp', 0.9);
            handleUpdateBanner(uploadingIndex, 'imageUrl', compressed);
          } else {
            handleUpdateBanner(uploadingIndex, 'imageUrl', rawDataUrl);
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Erro ao processar imagem:', err);
      alert('Falha ao processar arquivo de imagem local.');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Save profile to database
  const handleSaveProfile = async () => {
    if (!slug.trim()) {
      alert('Por favor, informe a URL do cliente (slug). Ex: kelvin ou dra-mariana');
      return;
    }

    try {
      setIsSaving(true);
      const profileData: ClientProfile = {
        slug: slug.trim().toLowerCase(),
        showNicheBadge,
        nicheBadge: nicheBadge.trim(),
        badgeBgColor,
        pageBgColor,
        cardBgColor,
        metaPixelId: metaPixelId.trim(),
        metaAccessToken: metaAccessToken.trim(),
        metaTestEventCode: metaTestEventCode.trim(),
        name: name.trim() || slug.trim(),
        title: `${name.trim() || slug.trim()} • Konverops`,
        description: description.trim() || `Bio Link Oficial de ${name.trim() || slug.trim()}`,
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
    } catch (err) {
      alert('Erro de conexão ao salvar.');
    } finally {
      setIsSaving(false);
    }
  };

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
                Elementor Canvas Engine
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Gerenciador de Links em Banners com Rastreamento Meta Ads (Pixel & CAPI Server-Side)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {view === 'editor' ? (
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
          ) : (
            <button
              onClick={handleCreateNew}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              + Criar Novo Cliente
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      {view === 'list' ? (
        /* LIST OF ALL CLIENTS */
        <main className="flex-1 max-w-6xl w-full mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">Clientes Cadastrados</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Páginas ativas de bio link hospedadas na infraestrutura Konverops
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
              {profiles.map((p) => (
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
                          Pílula Desativada
                        </span>
                      )}

                      <div className="flex items-center gap-2">
                        {p.metaPixelId && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Meta Pixel
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">
                          {p.banners?.length || 0} banner(s)
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                      {p.name || p.slug}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {p.description || 'Página de bio personalizada.'}
                    </p>

                    <div className="mt-3 py-1.5 px-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs font-mono text-emerald-400 truncate">
                      konverops.tech/{p.slug}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors flex items-center gap-1"
                    >
                      Abrir ↗
                    </a>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditProfile(p)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30 transition-colors"
                      >
                        Editar Canvas
                      </button>
                      {p.slug !== 'kelvin' && (
                        <button
                          onClick={() => handleDeleteProfile(p.slug)}
                          className="px-2.5 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/30 transition-colors"
                          title="Excluir"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      ) : (
        /* ELEMENTOR CANVAS BUILDER (SPLIT SCREEN) */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LEFT PANEL: Controls, Inputs & Banner Uploads */}
          <div className="w-full lg:w-7/12 p-6 overflow-y-auto max-h-[calc(100vh-73px)] border-r border-slate-800 bg-[#0a0f1d]/50">
            {/* Success Notification Bar */}
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
                Identificação e Aparência da Página
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
                    Nome do Cliente / Empresa
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
                  {/* Cor de Fundo da Tela */}
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
                    {/* Presets */}
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

                  {/* Cor do Cartão/Container */}
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
                    {/* Presets */}
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
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Dispara PageView e eventos com fbevents.js
                    </span>
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
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Blindagem server-side anti ad-blocker
                    </span>
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
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Depuração ao vivo no Gerenciador da Meta
                    </span>
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
                      {/* Banner Image Preview & Upload Trigger */}
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
                        <button
                          type="button"
                          onClick={() => triggerImageUpload(index)}
                          className="mt-2 w-full py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors flex items-center justify-center gap-1"
                        >
                          <span>📁</span> Subir Imagem
                        </button>
                      </div>

                      {/* Banner Fields */}
                      <div className="flex-1 w-full space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                            Banner #{index + 1}
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

                        {/* Configuração Detalhada de Eventos Meta */}
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

          {/* RIGHT PANEL: LIVE ELEMENTOR CANVAS SMARTPHONE PREVIEW */}
          <div
            style={{ backgroundColor: pageBgColor }}
            className="w-full lg:w-5/12 p-6 flex flex-col items-center justify-center border-l border-slate-800/80 transition-colors duration-300"
          >
            <div className="mb-3 text-center">
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

            {/* Smartphone Canvas Frame */}
            <div
              style={{ backgroundColor: cardBgColor }}
              className="relative w-[340px] rounded-[38px] shadow-2xl shadow-black/40 border-[6px] border-slate-900 overflow-hidden pb-6 transition-colors duration-300"
            >
              {/* Dynamic Island Notch */}
              <div className="pt-3 px-5 flex justify-between items-center text-[10px] font-semibold text-slate-400">
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-slate-900 rounded-full"></div>
                <span>5G</span>
              </div>

              {/* Top Niche Badge - Only shows if showNicheBadge is TRUE */}
              {showNicheBadge && (
                <div className="flex justify-center mt-3 mb-3 animate-fadeIn">
                  <span
                    style={{ backgroundColor: badgeBgColor }}
                    className="px-4 py-1.5 rounded-full text-white font-black text-xs tracking-wider uppercase shadow-md transition-colors"
                  >
                    {nicheBadge || 'Nicho'}
                  </span>
                </div>
              )}

              {/* Banners Feed */}
              <div className={`px-3.5 space-y-2.5 ${!showNicheBadge ? 'mt-4' : ''}`}>
                {banners.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-800 rounded-2xl">
                    Adicione banners no painel ao lado para visualizar aqui
                  </div>
                ) : (
                  banners.map((b, i) => (
                    <div
                      key={b.id || i}
                      className="block relative w-full rounded-2xl overflow-hidden shadow-md shadow-black/20 active:scale-95 transition-transform cursor-pointer group"
                    >
                      {b.imageUrl ? (
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-auto object-cover block select-none"
                        />
                      ) : (
                        <div className="h-20 bg-slate-800 flex items-center justify-center text-xs text-slate-400">
                          {b.title}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 text-center">
                <span className="text-[11px] text-slate-400 font-bold opacity-80">
                  konverops.tech/{slug || 'cliente'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
