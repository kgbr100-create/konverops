'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AutomationRule } from '@/lib/instagram/types';

interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
  like_count?: number;
}

export default function InstagramManyChatDashboard() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'flows' | 'simulator' | 'stories' | 'webhook'>('flows');
  const [metrics, setMetrics] = useState<{
    totalAllTime: number;
    followGateTotal?: number;
    byRule?: Record<string, number>;
    recentLogs: any[];
  }>({
    totalAllTime: 0,
    followGateTotal: 0,
    byRule: {},
    recentLogs: [],
  });

  // Publicações recentes do @kit.autismo para o seletor de posts específicos (OpenReply)
  const [recentMedia, setRecentMedia] = useState<InstagramMediaItem[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Modal de edição / criação de fluxo
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);
  const [tempKeyword, setTempKeyword] = useState('');

  // Simulador de Direct (Sandbox)
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulateNonFollower, setSimulateNonFollower] = useState(false);
  const [simulateUserName, setSimulateUserName] = useState('Ana');
  const [chatMessages, setChatMessages] = useState<
    Array<{
      from: 'user' | 'bot';
      text: string;
      time: string;
      buttons?: Array<{ title: string; url?: string; payload?: string }>;
    }>
  >([
    {
      from: 'user',
      text: 'ROTINA',
      time: '10:42',
    },
    {
      from: 'bot',
      text: 'Olá, Ana! Dar previsibilidade visual para a criança autista é a forma mais gentil e neurocientífica de reduzir crises de transição no dia a dia. 💙\n\nAqui está o nosso modelo prático de Quadro de Rotina Visual para organizar a semana sem sobrecarga sensorial:',
      time: '10:42',
      buttons: [
        { title: 'Acessar Guia Rotina', url: 'https://kitautismo.com/rotina' },
        { title: 'Ver Kit Completo', url: 'https://kitautismo.com' },
      ],
    },
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Story Publisher State
  const [storyImageUrl, setStoryImageUrl] = useState('');
  const [storyPublishing, setStoryPublishing] = useState(false);
  const [storyStatus, setStoryStatus] = useState<{ success: boolean; msg: string } | null>(null);

  // Feedback de cópia
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  // Carrega regras e métricas
  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/instagram/rules');
      const data = await res.json();
      if (data.success) {
        setRules(data.rules || []);
        if (data.metrics) {
          setMetrics(data.metrics);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar regras de automação:', err);
    } finally {
      setLoading(false);
    }
  };

  // Carrega últimas publicações do @kit.autismo para vinculação por post
  const fetchInstagramMedia = async () => {
    if (recentMedia.length > 0 || loadingMedia) return;
    try {
      setLoadingMedia(true);
      const res = await fetch('/api/instagram/media');
      const data = await res.json();
      if (data.success && Array.isArray(data.media)) {
        setRecentMedia(data.media);
      }
    } catch (err) {
      console.error('Erro ao carregar posts do Instagram:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Salva lista de regras no backend (Upstash Redis)
  const saveRulesToBackend = async (newRulesList: AutomationRule[]) => {
    try {
      setSaving(true);
      const res = await fetch('/api/instagram/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules: newRulesList }),
      });
      const data = await res.json();
      if (data.success) {
        setRules(newRulesList);
        setEditingRule(null);
      } else {
        alert('Erro ao salvar: ' + (data.error || 'Falha desconhecida.'));
      }
    } catch {
      alert('Erro de conexão ao salvar regras.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle ativo/inativo de um fluxo
  const handleToggleRule = async (ruleId: string) => {
    const updated = rules.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r));
    setRules(updated);
    await saveRulesToBackend(updated);
  };

  // Toggle rápido de Follow-Gate direto no card
  const handleQuickToggleFollowGate = async (ruleId: string) => {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, requireFollow: !r.requireFollow } : r
    );
    setRules(updated);
    await saveRulesToBackend(updated);
  };

  // Toggle rápido de Fluxo 2 Etapas direto no card
  const handleQuickToggleTwoStep = async (ruleId: string) => {
    const updated = rules.map((r) =>
      r.id === ruleId ? { ...r, twoStepCommentOptIn: !r.twoStepCommentOptIn } : r
    );
    setRules(updated);
    await saveRulesToBackend(updated);
  };

  // Exclui fluxo
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Deseja realmente excluir este fluxo de automação?')) return;
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    await saveRulesToBackend(updated);
  };

  // Abrir modal para novo fluxo
  const handleCreateNewRule = () => {
    fetchInstagramMedia();
    setEditingRule({
      id: `regra-${Date.now()}`,
      name: 'Novo Fluxo de Palavra-chave',
      keywords: ['quero'],
      replyText: 'Olá! Aqui está o seu material solicitado:\n\nToque no botão abaixo para acessar agora:',
      linkUrl: 'https://kitautismo.com',
      buttonTitle: 'Acessar Material',
      publicReplyEnabled: true,
      requireFollow: true,
      twoStepCommentOptIn: true,
      humanTypingDelay: true,
      targetMediaIds: [],
      active: true,
    });
    setIsNewRule(true);
    setTempKeyword('');
  };

  // Salvar do modal
  const handleSaveModal = async () => {
    if (!editingRule) return;
    if (!editingRule.name.trim()) {
      alert('Digite o nome do fluxo.');
      return;
    }
    if (editingRule.keywords.length === 0) {
      alert('Adicione pelo menos uma palavra-chave gatilho.');
      return;
    }
    if (!editingRule.replyText.trim()) {
      alert('Digite a mensagem de resposta.');
      return;
    }

    let updated: AutomationRule[];
    if (isNewRule) {
      updated = [...rules, editingRule];
    } else {
      updated = rules.map((r) => (r.id === editingRule.id ? editingRule : r));
    }

    await saveRulesToBackend(updated);
  };

  // Adicionar keyword no modal
  const handleAddKeyword = () => {
    if (!tempKeyword.trim() || !editingRule) return;
    const clean = tempKeyword.trim().toLowerCase();
    if (!editingRule.keywords.includes(clean)) {
      setEditingRule({
        ...editingRule,
        keywords: [...editingRule.keywords, clean],
      });
    }
    setTempKeyword('');
  };

  // Remover keyword no modal
  const handleRemoveKeyword = (kw: string) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      keywords: editingRule.keywords.filter((k) => k !== kw),
    });
  };

  // Alterna seleção de um post específico na regra
  const toggleTargetMediaId = (mediaId: string) => {
    if (!editingRule) return;
    const current = editingRule.targetMediaIds || [];
    const exists = current.includes(mediaId);
    const next = exists ? current.filter((id) => id !== mediaId) : [...current, mediaId];
    setEditingRule({
      ...editingRule,
      targetMediaIds: next,
    });
  };

  // Simulador de Envio no Sandbox (testando Follow-Gate, Nome Real e Múltiplos Botões)
  const handleSendSimulator = (overrideText?: string, isFollowUnlock?: boolean) => {
    const rawInput = overrideText ?? simulatorInput;
    if (!rawInput.trim()) return;

    const userText = rawInput.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    setChatMessages((prev) => [...prev, { from: 'user', text: userText, time: timeStr }]);
    if (!overrideText) setSimulatorInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      const cleanUserText = userText
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const words = cleanUserText.split(' ');
      let matchedRule: AutomationRule | null = null;
      const activeRules = rules.filter((r) => r.active);

      for (const rule of activeRules) {
        if (!rule.exactMessageMatch) continue;
        for (const kw of rule.keywords) {
          const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
          if (cleanUserText === normKw) {
            matchedRule = rule;
            break;
          }
        }
        if (matchedRule) break;
      }

      if (!matchedRule) {
        for (const rule of activeRules) {
          if (rule.exactMessageMatch) continue;
          for (const kw of rule.keywords) {
            const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (
              words.includes(normKw) ||
              cleanUserText === normKw ||
              (normKw.length >= 4 && cleanUserText.includes(normKw))
            ) {
              matchedRule = rule;
              break;
            }
          }
          if (matchedRule) break;
        }
      }

      const firstName = simulateUserName.trim() || 'Ana';

      if (matchedRule) {
        // Se simulando não-seguidor e a regra tem Follow-Gate ativo:
        if (matchedRule.requireFollow && simulateNonFollower && !isFollowUnlock) {
          const gateText = `Oi, ${firstName}! 💙 Vi que você ainda não segue o @kit.autismo!\n\nSiga nosso perfil rapidinho e toque no botão abaixo para eu liberar seu Guia gratuitamente aqui no Direct:`;
          setChatMessages((prev) => [
            ...prev,
            {
              from: 'bot',
              text: gateText,
              time: timeStr,
              buttons: [
                {
                  title: matchedRule?.followGateButtonTitle || '✅ Já segui! Liberar',
                  payload: matchedRule?.keywords[0] || 'rotina',
                },
                {
                  title: '📲 Perfil @kit.autismo',
                  url: 'https://www.instagram.com/kit.autismo/',
                },
              ],
            },
          ]);
          setIsBotTyping(false);
          return;
        }

        const personalized = matchedRule.replyText.startsWith('Olá!')
          ? matchedRule.replyText.replace(/^Olá!/, `Olá, ${firstName}!`)
          : matchedRule.replyText;

        const finalPrefix = isFollowUnlock
          ? `Perfeito, ${firstName}! Muito obrigado por seguir o @kit.autismo! 💙✨\n\n`
          : '';

        const btns: Array<{ title: string; url?: string }> = [];
        if (matchedRule.linkUrl) {
          btns.push({
            title: matchedRule.buttonTitle || 'Acessar Material',
            url: matchedRule.linkUrl,
          });
        }
        if (matchedRule.secondaryLinkUrl) {
          btns.push({
            title: matchedRule.secondaryButtonTitle || 'Ver Kit Completo',
            url: matchedRule.secondaryLinkUrl,
          });
        }
        if (matchedRule.thirdLinkUrl) {
          btns.push({
            title: matchedRule.thirdButtonTitle || 'Falar no Suporte',
            url: matchedRule.thirdLinkUrl,
          });
        }

        setChatMessages((prev) => [
          ...prev,
          {
            from: 'bot',
            text: `${finalPrefix}${personalized}`,
            time: timeStr,
            buttons: btns,
          },
        ]);
      } else {
        setChatMessages((prev) => [
          ...prev,
          {
            from: 'bot',
            text: `Olá, ${firstName}! Seja muito bem-vindo(a) ao Kit Autismo. 💙\n\nResponda com "ROTINA", "ALIMENTACAO" ou "DIREITOS" para receber nossos materiais agora mesmo!`,
            time: timeStr,
            buttons: [{ title: 'Acessar Kit Autismo', url: 'https://kitautismo.com' }],
          },
        ]);
      }

      setIsBotTyping(false);
    }, 650);
  };

  // Publicar Story direto
  const handlePublishStory = async () => {
    if (!storyImageUrl.trim()) {
      alert('Insira a URL pública da imagem 9:16 do Story.');
      return;
    }

    try {
      setStoryPublishing(true);
      setStoryStatus(null);
      const res = await fetch('/api/instagram/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: storyImageUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setStoryStatus({ success: true, msg: 'Story publicado com sucesso no perfil!' });
        setStoryImageUrl('');
      } else {
        setStoryStatus({ success: false, msg: data.error || 'Erro ao publicar Story.' });
      }
    } catch {
      setStoryStatus({ success: false, msg: 'Erro de conexão com o servidor.' });
    } finally {
      setStoryPublishing(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-40 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-emerald-400 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/20 text-lg">
            ⚡
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Konverops Flow Studio
              </h1>
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30">
                OpenReply + ChatbotX v2.0
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Follow-Gate + 2-Step + Cooldown 24h Ativos
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automação Oficial de Directs, Trava de Seguidor, Respostas a Stories e Entrega de Links
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            ← Voltar ao Bio Studio
          </Link>
          <button
            onClick={handleCreateNewRule}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
          >
            + Novo Fluxo de Palavra-chave
          </button>
        </div>
      </header>

      {/* KPI Cards Row */}
      <section className="px-6 py-5 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Total de DMs & Comentários
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {metrics.totalAllTime.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Webhook + Reconciliador 10m</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-lg">
            💬
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Regras com Follow-Gate
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {rules.filter((r) => r.active && r.requireFollow).length} ativas
            </p>
            <p className="text-[11px] text-pink-400 mt-0.5">Converte visitantes em seguidores</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 text-lg">
            🔒
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Proteção Anti-Spam (Cooldown)
            </p>
            <p className="text-2xl font-black text-white mt-1">24h / Lead</p>
            <p className="text-[11px] text-teal-400 mt-0.5">Silencia menu em conversa aberta</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-lg">
            🛡️
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Status Humanizado
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-1">Visto + Digitando</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Personalizado com 1º nome real</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            ✨
          </div>
        </div>
      </section>

      {/* Tabs Navigation */}
      <div className="px-6 max-w-7xl mx-auto w-full border-b border-slate-800 flex items-center gap-2">
        <button
          onClick={() => setActiveTab('flows')}
          className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'flows'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📋</span> Regras & Fluxos de Resposta ({rules.length})
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'simulator'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📱</span> Simulador do Direct (Sandbox)
        </button>

        <button
          onClick={() => setActiveTab('stories')}
          className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'stories'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📸</span> Publicador de Stories (9:16)
        </button>

        <button
          onClick={() => setActiveTab('webhook')}
          className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'webhook'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🔌</span> Credenciais & Telemetria em Tempo Real
        </button>
      </div>

      {/* Main Content Area */}
      <main className="px-6 py-6 max-w-7xl mx-auto w-full flex-1">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Carregando motor de automação...</p>
          </div>
        ) : (
          <>
            {/* TAB 1: FLUXOS DE AUTOMAÇÃO */}
            {activeTab === 'flows' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-bold text-white">
                      Gatilhos de Palavras-Chave, Follow-Gate & Fluxo de 2 Etapas
                    </h2>
                    <p className="text-xs text-slate-400">
                      Clique nos selos de qualquer regra abaixo para ativar/desativar rapidamente a{' '}
                      <strong className="text-pink-300">Trava de Seguidor (Follow-Gate)</strong> ou o{' '}
                      <strong className="text-purple-300">Fluxo de 2 Etapas p/ Comentários</strong>.
                    </p>
                  </div>
                  <button
                    onClick={handleCreateNewRule}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700 flex items-center gap-1.5"
                  >
                    + Adicionar Nova Regra
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rules.map((rule) => {
                    const ruleCount = metrics.byRule?.[rule.id] || 0;
                    const targetedPostsCount = rule.targetMediaIds?.length || 0;

                    return (
                      <div
                        key={rule.id}
                        className={`bg-slate-900/80 border rounded-2xl p-5 transition-all flex flex-col justify-between ${
                          rule.active
                            ? 'border-slate-800 hover:border-slate-700 shadow-md shadow-black/40'
                            : 'border-slate-800/50 opacity-60'
                        }`}
                      >
                        <div>
                          {/* Header do Card */}
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                  {ruleCount} envios
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-slate-400 font-mono">
                                  ID: {rule.id}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                                  {targetedPostsCount > 0
                                    ? `📌 ${targetedPostsCount} post(s) específico(s)`
                                    : '🌐 Global (Todos os Posts & Stories)'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={rule.active}
                                  onChange={() => handleToggleRule(rule.id)}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                              </label>
                            </div>
                          </div>

                          {/* Palavras-chave */}
                          <div className="mb-3">
                            <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                              Gatilhos Ativadores:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {rule.keywords.map((kw, idx) => (
                                <span
                                  key={idx}
                                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30"
                                >
                                  #{kw}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Balão de Resposta */}
                          <div className="mb-3">
                            <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                              Resposta no Direct (Personalizada com 1º Nome):
                            </p>
                            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                              {rule.replyText}
                            </div>
                          </div>

                          {/* Botões Nativos Configurados */}
                          <div className="space-y-1.5 mb-3">
                            {rule.linkUrl && (
                              <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                                <span>🔘</span>
                                <span className="font-sans font-bold text-white bg-emerald-500/20 px-2 py-0.5 rounded text-[11px]">
                                  1. {rule.buttonTitle || 'Acessar Material'}
                                </span>
                                <span className="truncate flex-1">{rule.linkUrl}</span>
                              </div>
                            )}
                            {rule.secondaryLinkUrl && (
                              <div className="flex items-center gap-2 text-xs text-teal-400 font-mono bg-teal-500/5 border border-teal-500/20 px-3 py-1.5 rounded-lg">
                                <span>🔘</span>
                                <span className="font-sans font-bold text-white bg-teal-500/20 px-2 py-0.5 rounded text-[11px]">
                                  2. {rule.secondaryButtonTitle || 'Ver Kit Completo'}
                                </span>
                                <span className="truncate flex-1">{rule.secondaryLinkUrl}</span>
                              </div>
                            )}
                            {rule.thirdLinkUrl && (
                              <div className="flex items-center gap-2 text-xs text-purple-400 font-mono bg-purple-500/5 border border-purple-500/20 px-3 py-1.5 rounded-lg">
                                <span>🔘</span>
                                <span className="font-sans font-bold text-white bg-purple-500/20 px-2 py-0.5 rounded text-[11px]">
                                  3. {rule.thirdButtonTitle || 'Suporte'}
                                </span>
                                <span className="truncate flex-1">{rule.thirdLinkUrl}</span>
                              </div>
                            )}
                          </div>

                          {/* Selos Interativos OpenReply + ChatbotX */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => handleQuickToggleFollowGate(rule.id)}
                              title="Clique para ativar/desativar a Trava de Seguidor (Follow-Gate)"
                              className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-all ${
                                rule.requireFollow
                                  ? 'bg-pink-500/15 text-pink-300 border-pink-500/40'
                                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                              }`}
                            >
                              {rule.requireFollow
                                ? '🔒 Follow-Gate Ativo (Exige Seguir)'
                                : '🔓 Sem Trava de Seguidor'}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleQuickToggleTwoStep(rule.id)}
                              title="Clique para ativar/desativar o Fluxo de 2 Etapas nos comentários"
                              className={`text-[10px] font-semibold px-2.5 py-1 rounded-md border transition-all ${
                                rule.twoStepCommentOptIn
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/40'
                                  : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200'
                              }`}
                            >
                              {rule.twoStepCommentOptIn
                                ? '⚡ Comentário 2 Etapas (Abre Janela 24h)'
                                : '⚡ Comentário Direto 1 Etapa'}
                            </button>

                            {rule.publicReplyEnabled !== false && (
                              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                                💬 Resposta Pública Ativa
                              </span>
                            )}

                            {rule.humanTypingDelay !== false && (
                              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                ✍️ Digitando Humanizado
                              </span>
                            )}

                            {rule.exactMessageMatch && (
                              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                                🎯 Match Exato (Enquete Story)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-800/80">
                          <button
                            onClick={() => {
                              fetchInstagramMedia();
                              setEditingRule(rule);
                              setIsNewRule(false);
                              setTempKeyword('');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                          >
                            Configurar Regra ⚙️
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
                          >
                            Excluir 🗑️
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: SIMULADOR DE DIRECT (SANDBOX) */}
            {activeTab === 'simulator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 flex justify-center">
                  {/* Smartphone Frame (iPhone Style) */}
                  <div className="w-[350px] h-[660px] bg-slate-950 rounded-[44px] border-[6px] border-slate-800 shadow-2xl shadow-purple-500/10 flex flex-col overflow-hidden relative">
                    <div className="h-6 bg-slate-950 flex items-center justify-center">
                      <div className="w-24 h-4 bg-slate-900 rounded-full"></div>
                    </div>

                    <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-slate-400 text-xs">←</span>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-emerald-400 p-[2px]">
                          <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                            KA
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-white">kit.autismo</span>
                            <span className="text-[10px] text-blue-400">✓</span>
                          </div>
                          <span className="text-[10px] text-emerald-400">
                            {isBotTyping ? 'Digitando...' : 'Online agora'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-xs">
                        <span>📞</span>
                        <span>📹</span>
                      </div>
                    </div>

                    {/* Chat Messages Body */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0a0f1d] text-xs">
                      <div className="text-center my-2">
                        <span className="text-[10px] text-slate-500 bg-slate-900/80 px-2.5 py-0.5 rounded-full">
                          Simulador Oficial • Visto + Digitando Ativo
                        </span>
                      </div>

                      {chatMessages.map((msg, i) => (
                        <div
                          key={i}
                          className={`flex flex-col ${
                            msg.from === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          <div
                            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line text-xs leading-relaxed ${
                              msg.from === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                                : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60 shadow-sm'
                            }`}
                          >
                            {msg.text}

                            {msg.buttons && msg.buttons.length > 0 && (
                              <div className="mt-2.5 pt-2 border-t border-slate-700/80 space-y-1.5">
                                {msg.buttons.map((b, bIdx) =>
                                  b.payload ? (
                                    <button
                                      key={bIdx}
                                      onClick={() => handleSendSimulator(b.payload, true)}
                                      className="w-full py-1.5 px-3 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 font-bold text-[11px] text-center block transition-colors"
                                    >
                                      {b.title}
                                    </button>
                                  ) : (
                                    <a
                                      key={bIdx}
                                      href={b.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="w-full py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-950 border border-slate-700 text-emerald-400 font-bold text-[11px] text-center block transition-colors"
                                    >
                                      {b.title} ↗
                                    </a>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          <span className="text-[9px] text-slate-500 px-1 mt-0.5">
                            {msg.from === 'user' ? `Visto • ${msg.time}` : msg.time}
                          </span>
                        </div>
                      ))}

                      {isBotTyping && (
                        <div className="flex items-center gap-1 bg-slate-800 px-3 py-2 rounded-full w-14">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-100"></span>
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-200"></span>
                        </div>
                      )}
                    </div>

                    {/* Chat Input Bar */}
                    <div className="bg-slate-900 p-2.5 border-t border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        value={simulatorInput}
                        onChange={(e) => setSimulatorInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendSimulator()}
                        placeholder="Escreva uma mensagem..."
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleSendSimulator()}
                        className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white text-xs font-bold transition-transform active:scale-95"
                      >
                        ↑
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                      <span>🧪</span> Laboratório Interativo (Follow-Gate + Personalização)
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Simule abaixo o comportamento exato para quem <strong>já é seguidor</strong> vs.
                      quem <strong>ainda não segue o @kit.autismo</strong> (Trava de Seguidor do
                      ChatbotX).
                    </p>
                  </div>

                  {/* Controles de Perfil Simulado */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                        Nome do Seguidor Simulado:
                      </label>
                      <input
                        type="text"
                        value={simulateUserName}
                        onChange={(e) => setSimulateUserName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
                      />
                    </div>
                    <div className="flex flex-col justify-end">
                      <label className="inline-flex items-center gap-2 cursor-pointer p-2 rounded-lg bg-pink-500/10 border border-pink-500/30 text-xs text-pink-200 font-semibold">
                        <input
                          type="checkbox"
                          checked={simulateNonFollower}
                          onChange={(e) => setSimulateNonFollower(e.target.checked)}
                          className="rounded border-pink-500"
                        />
                        <span>🔒 Simular visitante que NÃO segue o perfil</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-300">
                      Clique em um gatilho para testar imediatamente:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'A',
                        'B',
                        'C',
                        'ROTINA',
                        'EU QUERO',
                        'DIREITOS',
                        'ALIMENTACAO',
                        'preciso falar com um atendente',
                      ].map((promptText, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendSimulator(promptText)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700/80 transition-colors"
                        >
                          &ldquo;{promptText}&rdquo;
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: PUBLICADOR DE STORIES */}
            {activeTab === 'stories' && (
              <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 text-xl">
                    📸
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Publicador Oficial de Stories</h3>
                    <p className="text-xs text-slate-400">
                      Dispare imagens ou vídeos na proporção 9:16 direto no perfil do Instagram via API.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      URL Pública da Imagem / Vídeo (9:16):
                    </label>
                    <input
                      type="url"
                      value={storyImageUrl}
                      onChange={(e) => setStoryImageUrl(e.target.value)}
                      placeholder="https://seu-servidor.com/story.png"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>

                  {storyStatus && (
                    <div
                      className={`p-3 rounded-xl text-xs border ${
                        storyStatus.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-red-500/10 border-red-500/30 text-red-400'
                      }`}
                    >
                      {storyStatus.msg}
                    </div>
                  )}

                  <button
                    onClick={handlePublishStory}
                    disabled={storyPublishing}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-400 hover:opacity-95 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    {storyPublishing ? 'Publicando no Instagram...' : '🚀 Publicar Story Agora'}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: WEBHOOK & TELEMETRIA */}
            {activeTab === 'webhook' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <span>🔌</span> Endpoints de Integração com a Meta
                  </h3>
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                        URL de Retorno de Chamada (Callback URL):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="https://www.konverops.tech/api/instagram/webhook"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-mono"
                        />
                        <button
                          onClick={() =>
                            copyToClipboard(
                              'https://www.konverops.tech/api/instagram/webhook',
                              'url'
                            )
                          }
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                        >
                          {copyFeedback === 'url' ? '✓ Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-1 uppercase tracking-wider">
                        Token de Verificação (Verify Token):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="konverops_ig_secret_2026"
                          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-purple-400 font-mono"
                        />
                        <button
                          onClick={() => copyToClipboard('konverops_ig_secret_2026', 'token')}
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                        >
                          {copyFeedback === 'token' ? '✓ Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <span>📊</span> Registro Recente de Interações em Tempo Real
                  </h3>
                  {metrics.recentLogs && metrics.recentLogs.length > 0 ? (
                    <div className="space-y-2 max-h-80 overflow-y-auto mt-3">
                      {metrics.recentLogs.map((logItem, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="font-mono text-slate-300">
                              {logItem.senderUsername
                                ? `@${logItem.senderUsername}`
                                : `ID: ${logItem.senderId?.slice(0, 10)}...`}
                            </span>
                            {logItem.isStoryReply && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                                Story
                              </span>
                            )}
                            {logItem.isCommentReply && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300">
                                Comentário
                              </span>
                            )}
                            {logItem.followGateTriggered && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                Follow-Gate
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-purple-300 font-mono">
                              #{logItem.keyword || logItem.keywordMatched || 'resposta'}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              {new Date(logItem.timestamp).toLocaleTimeString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Nenhuma interação registrada ainda.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal Completo de Edição de Regra / Fluxo (OpenReply + ChatbotX) */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full shadow-2xl shadow-purple-500/10 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⚡</span> {isNewRule ? 'Criar Novo Fluxo' : 'Configurar Fluxo de Automação'}
              </h3>
              <button
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕ Fechar
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Nome de Identificação do Fluxo:
                </label>
                <input
                  type="text"
                  value={editingRule.name}
                  onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Palavras-chave */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Palavras-chave Gatilho:
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={tempKeyword}
                    onChange={(e) => setTempKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Digite uma palavra e aperte Enter (ex: rotina)"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                  >
                    + Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  {editingRule.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    >
                      #{kw}
                      <button
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-purple-400 hover:text-white ml-1 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Mensagem no Direct */}
              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Mensagem Principal no Direct (Personaliza automaticamente &ldquo;Olá!&rdquo; com o 1º nome):
                </label>
                <textarea
                  rows={4}
                  value={editingRule.replyText}
                  onChange={(e) => setEditingRule({ ...editingRule, replyText: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              {/* Até 3 Botões Nativos */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  🔘 Botões Clicáveis Nativos do Card (Até 3 Botões por DM)
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">
                      Botão 1 — Título (máx 20 chars):
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editingRule.buttonTitle || ''}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, buttonTitle: e.target.value })
                      }
                      placeholder="Ex: Acessar Guia Rotina"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">
                      Botão 1 — Link (URL):
                    </label>
                    <input
                      type="url"
                      value={editingRule.linkUrl || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, linkUrl: e.target.value })}
                      placeholder="https://kitautismo.com/rotina"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">
                      Botão 2 (Opcional) — Título:
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editingRule.secondaryButtonTitle || ''}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, secondaryButtonTitle: e.target.value })
                      }
                      placeholder="Ex: Ver Kit Completo"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">
                      Botão 2 (Opcional) — Link:
                    </label>
                    <input
                      type="url"
                      value={editingRule.secondaryLinkUrl || ''}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, secondaryLinkUrl: e.target.value })
                      }
                      placeholder="https://kitautismo.com"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-teal-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">
                      Botão 3 (Opcional) — Título:
                    </label>
                    <input
                      type="text"
                      maxLength={20}
                      value={editingRule.thirdButtonTitle || ''}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, thirdButtonTitle: e.target.value })
                      }
                      placeholder="Ex: Falar no WhatsApp"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 text-[10px] uppercase mb-1">
                      Botão 3 (Opcional) — Link:
                    </label>
                    <input
                      type="url"
                      value={editingRule.thirdLinkUrl || ''}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, thirdLinkUrl: e.target.value })
                      }
                      placeholder="https://kitautismo.com/suporte"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-purple-400 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Opções Avançadas do Motor OpenReply + ChatbotX */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <p className="text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                  🚀 Recursos de Conversão & Retenção (OpenReply + ChatbotX)
                </p>

                <label className="flex items-start gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(editingRule.requireFollow)}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, requireFollow: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-pink-500"
                  />
                  <div>
                    <span className="font-bold text-pink-300">
                      🔒 Trava de Seguidor (Follow-Gate do ChatbotX)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Se a pessoa ainda não segue o @kit.autismo, pede para seguir primeiro e libera
                      o link quando ela tocar em &ldquo;✅ Já segui! Liberar&rdquo;.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 cursor-pointer text-slate-200">
                  <input
                    type="checkbox"
                    checked={Boolean(editingRule.twoStepCommentOptIn)}
                    onChange={(e) =>
                      setEditingRule({ ...editingRule, twoStepCommentOptIn: e.target.checked })
                    }
                    className="mt-0.5 rounded border-slate-700 bg-slate-950 text-purple-500"
                  />
                  <div>
                    <span className="font-bold text-purple-300">
                      ⚡ Fluxo de 2 Etapas para Comentários (Impulsionador de Stories)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Quando alguém comenta num post, envia primeiro o botão &ldquo;🔓 Liberar meu
                      Guia&rdquo; no Direct. Ao tocar, abre a janela de 24h e joga seus Stories para
                      o 1º lugar da fila!
                    </p>
                  </div>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingRule.publicReplyEnabled !== false}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, publicReplyEnabled: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-blue-500"
                    />
                    <span>💬 Resposta Pública no Post</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={editingRule.humanTypingDelay !== false}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, humanTypingDelay: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-emerald-500"
                    />
                    <span>✍️ Visto + Digitando...</span>
                  </label>

                  <label className="inline-flex items-center gap-2 cursor-pointer text-slate-300">
                    <input
                      type="checkbox"
                      checked={Boolean(editingRule.exactMessageMatch)}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, exactMessageMatch: e.target.checked })
                      }
                      className="rounded border-slate-700 bg-slate-950 text-amber-500"
                    />
                    <span>🎯 Match Exato (A/B/C)</span>
                  </label>
                </div>
              </div>

              {/* Seletor Visual de Publicações Específicas (OpenReply Media Grid) */}
              <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-bold text-slate-200 uppercase tracking-wider">
                      📌 Escopo de Publicações (OpenReply Post Picker)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {(editingRule.targetMediaIds?.length || 0) === 0
                        ? 'Atualmente GLOBAL (vale para qualquer publicação e Story). Clique em um post abaixo se quiser restringir esta regra a publicações específicas:'
                        : `Restrita a ${editingRule.targetMediaIds?.length} publicação(ões) selecionada(s):`}
                    </p>
                  </div>
                  {(editingRule.targetMediaIds?.length || 0) > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditingRule({ ...editingRule, targetMediaIds: [] })}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[10px] font-bold"
                    >
                      Tornar Global 🌐
                    </button>
                  )}
                </div>

                {loadingMedia ? (
                  <p className="text-[11px] text-slate-400 py-3">
                    Carregando publicações recentes de @kit.autismo...
                  </p>
                ) : recentMedia.length > 0 ? (
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-40 overflow-y-auto pt-1">
                    {recentMedia.map((post) => {
                      const isSelected = Boolean(editingRule.targetMediaIds?.includes(post.id));
                      const thumb = post.thumbnail_url || post.media_url;
                      return (
                        <button
                          key={post.id}
                          type="button"
                          onClick={() => toggleTargetMediaId(post.id)}
                          className={`relative rounded-xl overflow-hidden border-2 aspect-square group text-left ${
                            isSelected
                              ? 'border-emerald-400 ring-2 ring-emerald-500/40'
                              : 'border-slate-800 opacity-75 hover:opacity-100'
                          }`}
                        >
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={post.caption?.slice(0, 30) || 'Post'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-slate-900 flex items-center justify-center p-1 text-[9px] text-slate-400 text-center">
                              {post.caption?.slice(0, 35) || post.id}
                            </div>
                          )}
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-emerald-500 text-slate-950 font-black text-[11px] flex items-center justify-center shadow">
                              ✓
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Regra operando em modo Global para todas as publicações do @kit.autismo.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setEditingRule(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveModal}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
              >
                {saving ? 'Salvando...' : '✓ Salvar Fluxo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
