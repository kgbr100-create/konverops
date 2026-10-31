'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AutomationRule } from '@/lib/instagram/types';

export default function InstagramManyChatDashboard() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'flows' | 'simulator' | 'stories' | 'webhook'>('flows');
  const [metrics, setMetrics] = useState<{ totalAllTime: number; recentLogs: any[] }>({
    totalAllTime: 0,
    recentLogs: [],
  });

  // Modal de edição / criação de fluxo
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);
  const [tempKeyword, setTempKeyword] = useState('');

  // Simulador de Direct (Sandbox)
  const [simulatorInput, setSimulatorInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    Array<{ from: 'user' | 'bot'; text: string; time: string }>
  >([
    {
      from: 'user',
      text: 'Olá! Vi o post de vocês sobre AuDHD, vocês têm material sobre isso?',
      time: '10:42',
    },
    {
      from: 'bot',
      text: 'Olá! Conciliar a busca por novidade com a necessidade de previsibilidade é um dos maiores desafios do dia a dia.\n\nAqui está o modelo prático de quadro de rotina visual para imprimir e organizar a semana sem sobrecarga:\n\n👉 https://kitautismo.com/rotina\n\nConta com a gente!',
      time: '10:42',
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
    } catch (err) {
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

  // Exclui fluxo
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Deseja realmente excluir este fluxo de automação?')) return;
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    await saveRulesToBackend(updated);
  };

  // Abrir modal para novo fluxo
  const handleCreateNewRule = () => {
    setEditingRule({
      id: `regra-${Date.now()}`,
      name: 'Novo Fluxo de Palavra-chave',
      keywords: ['quero'],
      replyText: 'Olá! Aqui está o seu link solicitado:\n\n👉 https://kitautismo.com',
      linkUrl: 'https://kitautismo.com',
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

  // Simulador de Envio no Sandbox
  const handleSendSimulator = () => {
    if (!simulatorInput.trim()) return;

    const userText = simulatorInput.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Adiciona fala do usuário
    setChatMessages((prev) => [...prev, { from: 'user', text: userText, time: timeStr }]);
    setSimulatorInput('');
    setIsBotTyping(true);

    // Normaliza e busca nas regras ativas
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

      // 0. Exact message match (Story Polls A, B, C)
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

      // 1. Whole-word or substring match
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

      const botText = matchedRule
        ? matchedRule.linkUrl
          ? `${matchedRule.replyText}\n\n[🔘 Botão Nativo: ${matchedRule.buttonTitle || 'Acessar Material'}]\n🔗 ${matchedRule.linkUrl}`
          : matchedRule.replyText
        : 'Olá! Vimos a sua mensagem. 💙\n\nSe você procura nossos materiais, envie a palavra "ROTINA" ou "LINK" que te respondo na hora com o acesso!';

      setChatMessages((prev) => [...prev, { from: 'bot', text: botText, time: timeStr }]);
      setIsBotTyping(false);
    }, 600);
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
    } catch (err) {
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
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Konverops Flow Studio
              </h1>
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-pink-300 border border-pink-500/30">
                ManyChat Engine
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Webhook Ativo na Vercel
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Automação Oficial de Directs, Respostas a Stories e Entrega de Links da Meta
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
              Total de Mensagens Atendidas
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {metrics.totalAllTime.toLocaleString()}
            </p>
            <p className="text-[11px] text-emerald-400 mt-0.5">Automático 24/7 sem ManyChat</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 text-lg">
            💬
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Fluxos de Resposta Ativos
            </p>
            <p className="text-2xl font-black text-white mt-1">
              {rules.filter((r) => r.active).length} / {rules.length}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Palavras-chave vigentes</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            ⚡
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Tempo Médio de Resposta
            </p>
            <p className="text-2xl font-black text-white mt-1">&lt; 1.5s</p>
            <p className="text-[11px] text-teal-400 mt-0.5">Borda da Vercel + Upstash</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-lg">
            🚀
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              Economia Mensal
            </p>
            <p className="text-2xl font-black text-emerald-400 mt-1">R$ 0 / mês</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Zero licença de terceiros</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
            💰
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
          <span>🔌</span> Credenciais & Webhook da Meta
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
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white">Gatilhos de Palavras-Chave</h2>
                    <p className="text-xs text-slate-400">
                      Quando um seguidor responder ao Story ou enviar DM com essas palavras, o robô
                      responde instantaneamente com o link.
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
                  {rules.map((rule) => (
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
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                              <h3 className="text-sm font-bold text-white">{rule.name}</h3>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                              ID: {rule.id}
                            </span>
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
                            Resposta no Direct:
                          </p>
                          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                            {rule.replyText}
                          </div>
                        </div>

                        {/* Link de Destino */}
                        {rule.linkUrl && (
                          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono bg-emerald-500/5 border border-emerald-500/20 px-3 py-1.5 rounded-lg">
                            <span>🔗</span>
                            <span className="truncate flex-1">{rule.linkUrl}</span>
                            <a
                              href={rule.linkUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] uppercase font-bold text-slate-400 hover:text-emerald-400"
                            >
                              Testar ↗
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-800/80">
                        <button
                          onClick={() => {
                            setEditingRule(rule);
                            setIsNewRule(false);
                            setTempKeyword('');
                          }}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                        >
                          Editar ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule.id)}
                          className="px-3 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors"
                        >
                          Excluir 🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: SIMULADOR DE DIRECT (SANDBOX) */}
            {activeTab === 'simulator' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5 flex justify-center">
                  {/* Smartphone Frame (iPhone Style) */}
                  <div className="w-[340px] h-[640px] bg-slate-950 rounded-[44px] border-[6px] border-slate-800 shadow-2xl shadow-purple-500/10 flex flex-col overflow-hidden relative">
                    {/* Top Notch */}
                    <div className="h-6 bg-slate-950 flex items-center justify-center">
                      <div className="w-24 h-4 bg-slate-900 rounded-full"></div>
                    </div>

                    {/* Instagram Direct Header */}
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
                          <span className="text-[10px] text-slate-400">Ativo agora</span>
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
                          Hoje
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
                            className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line text-xs leading-relaxed ${
                              msg.from === 'user'
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                                : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60 shadow-sm'
                            }`}
                          >
                            {msg.text}
                          </div>
                          <span className="text-[9px] text-slate-500 px-1 mt-0.5">{msg.time}</span>
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
                        onClick={handleSendSimulator}
                        className="w-7 h-7 rounded-full bg-purple-600 hover:bg-purple-500 flex items-center justify-center text-white text-xs font-bold transition-transform active:scale-95"
                      >
                        ↑
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                    <span>🧪</span> Laboratório de Testes em Tempo Real
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Teste como o motor reage a qualquer frase ou variação que um seguidor digitar.
                    O simulador roda a mesma lógica de normalização (remove acentos, pontuações e
                    emojis) que está operando na Vercel.
                  </p>

                  <div className="space-y-3">
                    <p className="text-xs font-bold text-slate-300">Exemplos rápidos para testar:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'A',
                        'B',
                        'C',
                        'ROTINA',
                        'quero o link',
                        'quais os direitos da crianca no plano?',
                        'meu filho tem seletividade na comida',
                        'preciso falar com um atendente',
                      ].map((promptText, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setSimulatorInput(promptText);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs border border-slate-700/80 transition-colors"
                        >
                          "{promptText}"
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="mt-8 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="text-xs font-bold text-emerald-400 mb-1">
                      💡 Vantagem do Nosso Motor Próprio:
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Diferente de ferramentas comerciais que cobram a mais por gatilhos flexíveis,
                      nosso motor detecta palavras-chave em qualquer posição da frase e entrega o
                      link com formatação otimizada para o aplicativo nativo do Instagram.
                    </p>
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
                    <p className="text-[11px] text-slate-400 mt-1">
                      A imagem deve ter resolução recomendada de 1080x1920 pixels.
                    </p>
                  </div>

                  {storyImageUrl && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                      <div className="w-36 h-64 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 relative shadow-lg">
                        <img
                          src={storyImageUrl}
                          alt="Prévia Story"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

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
                    {storyPublishing ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Publicando no Instagram...
                      </>
                    ) : (
                      '🚀 Publicar Story Agora'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 4: WEBHOOK & CONFIGURAÇÕES */}
            {activeTab === 'webhook' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                    <span>🔌</span> Endpoints de Integração com a Meta
                  </h3>
                  <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                    Copie essas informações e cole nas configurações do produto **Webhooks** no seu
                    aplicativo do Meta for Developers.
                  </p>

                  <div className="space-y-4">
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
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
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
                          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors"
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
                  <p className="text-xs text-slate-400 mb-4">
                    Últimas conversas processadas e respondidas automaticamente pelo robô:
                  </p>

                  {metrics.recentLogs && metrics.recentLogs.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {metrics.recentLogs.map((logItem, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-400 font-bold">✓</span>
                            <span className="font-mono text-slate-300">
                              ID: {logItem.senderId?.slice(0, 10)}...
                            </span>
                            {logItem.isStoryReply && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300">
                                Resposta a Story
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-purple-300 font-mono">
                              #{logItem.keywordMatched || 'resposta'}
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
                      Nenhuma interação registrada ainda. Os eventos aparecerão aqui assim que os
                      seguidores responderem às suas postagens e Stories.
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal de Edição de Regra / Fluxo */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl shadow-purple-500/10 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>⚡</span> {isNewRule ? 'Criar Novo Fluxo' : 'Editar Fluxo de Automação'}
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
                  placeholder="Ex: Entrega do Guia de Alimentação"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Palavras-chave Gatilho (o robô responde se a mensagem contiver):
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={tempKeyword}
                    onChange={(e) => setTempKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Digite uma palavra e aperte Enter (ex: quero)"
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

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Mensagem de Resposta no Direct (Links aqui são clicáveis automaticamente):
                </label>
                <textarea
                  rows={5}
                  value={editingRule.replyText}
                  onChange={(e) => setEditingRule({ ...editingRule, replyText: e.target.value })}
                  placeholder="Olá! Aqui está o seu material..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-emerald-500 font-sans leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1 uppercase tracking-wider text-[11px]">
                  Link de Destino / Redirecionamento (Opcional):
                </label>
                <input
                  type="url"
                  value={editingRule.linkUrl || ''}
                  onChange={(e) => setEditingRule({ ...editingRule, linkUrl: e.target.value })}
                  placeholder="https://kitautismo.com/guia"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-emerald-400 font-mono focus:outline-none focus:border-emerald-500"
                />
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
