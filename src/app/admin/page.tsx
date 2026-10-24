'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import type { ClientProfile, BioBanner } from '@/data/profiles';

export default function AdminDashboardPage() {
  const [profiles, setProfiles] = useState<ClientProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessUrl, setSaveSuccessUrl] = useState<string | null>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState<number | null>(null);

  // Form State
  const [slug, setSlug] = useState('');
  const [nicheBadge, setNicheBadge] = useState('Nutricionista');
  const [badgeBgColor, setBadgeBgColor] = useState('#00b768');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [banners, setBanners] = useState<BioBanner[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Load profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

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
    setNicheBadge('Novo Nicho');
    setBadgeBgColor('#00b768');
    setName('');
    setDescription('');
    setBanners([
      {
        id: `banner-${Date.now()}`,
        title: 'Fale no WhatsApp',
        imageUrl: '/banners/kelvin/banner-whatsapp.png',
        destinationUrl: 'https://wa.me/5511999999999',
        trackingEvent: 'Contact',
        target: '_blank',
      },
    ]);
    setSaveSuccessUrl(null);
    setView('editor');
  };

  const handleEditProfile = (profile: ClientProfile) => {
    setSlug(profile.slug);
    setNicheBadge(profile.nicheBadge || 'Geral');
    setBadgeBgColor(profile.badgeBgColor || '#00b768');
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

  const handleUpdateBanner = (index: number, field: keyof BioBanner, value: string) => {
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
      const formData = new FormData();
      formData.append('file', file);
      formData.append('slug', slug || 'clientes');

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        handleUpdateBanner(uploadingIndex, 'imageUrl', data.url);
      } else {
        alert(data.error || 'Erro no upload da imagem.');
      }
    } catch (err) {
      alert('Falha ao enviar arquivo de imagem.');
    } finally {
      setUploadingIndex(null);
    }
  };

  // Save profile to database
  const handleSaveProfile = async () => {
    if (!slug.trim()) {
      alert('Por favor, informe a URL do cliente (slug). Ex: dra-mariana');
      return;
    }

    try {
      setIsSaving(true);
      const profileData: ClientProfile = {
        slug: slug.trim().toLowerCase(),
        nicheBadge: nicheBadge.trim(),
        badgeBgColor,
        name: name.trim() || nicheBadge.trim(),
        title: `${name.trim()} • ${nicheBadge.trim()}`,
        description: description.trim() || `Bio Link Oficial de ${name.trim()}`,
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
              Gerenciador de Links em Banners para Clientes com Rastreamento CAPI
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
                      <span
                        style={{ backgroundColor: p.badgeBgColor || '#00b768' }}
                        className="px-3 py-1 rounded-full text-white font-extrabold text-[11px] uppercase tracking-wider shadow-sm"
                      >
                        {p.nicheBadge}
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        {p.banners?.length || 0} banner(s)
                      </span>
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

            {/* Step 1: Client Settings */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 mb-5 shadow-lg">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs">
                  1
                </span>
                Configuração Básica do Cliente
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
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                      placeholder="dra-mariana"
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
                    placeholder="Dra. Mariana Alves"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Pílula de Nicho (Topo do Celular)
                  </label>
                  <input
                    type="text"
                    value={nicheBadge}
                    onChange={(e) => setNicheBadge(e.target.value)}
                    placeholder="Nutricionista"
                    className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 placeholder:text-slate-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Cor da Pílula de Nicho
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={badgeBgColor}
                      onChange={(e) => setBadgeBgColor(e.target.value)}
                      className="w-9 h-9 rounded-xl bg-transparent border-0 cursor-pointer"
                    />
                    <div className="flex items-center gap-1.5">
                      {['#00b768', '#0748b3', '#8b5cf6', '#d97706', '#dc2626'].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setBadgeBgColor(color)}
                          style={{ backgroundColor: color }}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${badgeBgColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                        />
                      ))}
                    </div>
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
                  Banners Gráficos (Canva / Figma)
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
                            <Image
                              src={banner.imageUrl}
                              alt={banner.title}
                              fill
                              className="object-cover"
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
                          <span className="text-[11px] font-mono text-emerald-400">
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

                        <div>
                          <label className="block text-[11px] font-bold text-slate-400 mb-0.5">
                            Título / Identificação do Banner
                          </label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) => handleUpdateBanner(index, 'title', e.target.value)}
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
                            onChange={(e) => handleUpdateBanner(index, 'destinationUrl', e.target.value)}
                            placeholder="https://wa.me/55..."
                            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">
                              Evento Meta CAPI
                            </label>
                            <select
                              value={banner.trackingEvent || 'Contact'}
                              onChange={(e) => handleUpdateBanner(index, 'trackingEvent', e.target.value)}
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs text-white outline-none focus:border-emerald-500"
                            >
                              <option value="Contact">Contact (WhatsApp)</option>
                              <option value="Schedule">Schedule (Agendamento)</option>
                              <option value="Lead">Lead (Cadastro/Isca)</option>
                              <option value="ViewContent">ViewContent (Catálogo)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-0.5">
                              URL da Imagem (Manual)
                            </label>
                            <input
                              type="text"
                              value={banner.imageUrl}
                              onChange={(e) => handleUpdateBanner(index, 'imageUrl', e.target.value)}
                              placeholder="/banners/..."
                              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-2.5 py-1.5 text-xs text-white outline-none focus:border-emerald-500 font-mono text-[11px]"
                            />
                          </div>
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
                Página será publicada em: <strong className="text-emerald-400">konverops.tech/{slug || '...'}</strong>
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
          <div className="w-full lg:w-5/12 bg-[#060810] p-6 flex flex-col items-center justify-center border-l border-slate-800/80">
            <div className="mb-3 text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Canvas Live Preview (Em Tempo Real)
              </span>
            </div>

            {/* Smartphone Canvas Frame */}
            <div className="relative w-[340px] bg-white rounded-[38px] shadow-2xl shadow-emerald-950/20 border-[6px] border-slate-900 overflow-hidden pb-6">
              
              {/* Dynamic Island Notch */}
              <div className="pt-3 px-5 flex justify-between items-center text-[10px] font-semibold text-slate-800">
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-slate-900 rounded-full"></div>
                <span>5G</span>
              </div>

              {/* Top Niche Badge */}
              <div className="flex justify-center mt-3 mb-3">
                <span
                  style={{ backgroundColor: badgeBgColor }}
                  className="px-4 py-1.5 rounded-full text-white font-black text-xs tracking-wider uppercase shadow-md transition-colors"
                >
                  {nicheBadge || 'Nicho'}
                </span>
              </div>

              {/* Banners Feed */}
              <div className="px-3.5 space-y-2.5">
                {banners.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                    Adicione banners no painel ao lado para visualizar aqui
                  </div>
                ) : (
                  banners.map((b, i) => (
                    <div
                      key={b.id || i}
                      className="block relative w-full rounded-2xl overflow-hidden shadow-md shadow-black/10 active:scale-95 transition-transform cursor-pointer"
                    >
                      {b.imageUrl ? (
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          className="w-full h-auto object-cover block"
                        />
                      ) : (
                        <div className="h-20 bg-slate-100 flex items-center justify-center text-xs text-slate-400">
                          {b.title}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="mt-4 text-center">
                <span className="text-[11px] text-slate-400 font-bold">
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
