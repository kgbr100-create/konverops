'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AutomationRule, InstagramConversation } from '@/lib/instagram/types';

interface InstagramLiveChatInboxProps {
  rules: AutomationRule[];
  onTriggerToast?: (msg: string, type?: 'success' | 'error') => void;
}

interface WindowStatus {
  isOpen: boolean;
  isHumanAgentWindow: boolean;
  remainingMs: number;
  hoursRemaining: number;
  minutesRemaining: number;
  percentRemaining: number;
  label: string;
  sublabel: string;
}

function compute24hWindow(lastUserInteractionAt: string, nowMs: number): WindowStatus {
  const lastTime = new Date(lastUserInteractionAt).getTime();
  if (Number.isNaN(lastTime)) {
    return {
      isOpen: false,
      isHumanAgentWindow: false,
      remainingMs: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      percentRemaining: 0,
      label: 'Janela Expirada',
      sublabel: 'Aguardando nova mensagem do seguidor',
    };
  }

  const window24hMs = 24 * 60 * 60 * 1000;
  const window7dMs = 7 * 24 * 60 * 60 * 1000;
  const elapsed = nowMs - lastTime;
  const remaining = window24hMs - elapsed;

  if (remaining > 0) {
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const pct = Math.max(2, Math.min(100, Math.round((remaining / window24hMs) * 100)));
    return {
      isOpen: true,
      isHumanAgentWindow: true,
      remainingMs: remaining,
      hoursRemaining: hours,
      minutesRemaining: minutes,
      percentRemaining: pct,
      label: `Janela 24h Ativa (${hours}h ${minutes}m restantes)`,
      sublabel: 'Liberado para disparar fluxos com botões, links e mensagens livres',
    };
  }

  const humanRemaining = window7dMs - elapsed;
  if (humanRemaining > 0) {
    const daysLeft = Math.ceil(humanRemaining / (1000 * 60 * 60 * 24));
    return {
      isOpen: false,
      isHumanAgentWindow: true,
      remainingMs: 0,
      hoursRemaining: 0,
      minutesRemaining: 0,
      percentRemaining: 0,
      label: 'Janela 24h Expirada',
      sublabel: `Modo Agente Humano ativo (${daysLeft}d restantes para suporte)`,
    };
  }

  return {
    isOpen: false,
    isHumanAgentWindow: false,
    remainingMs: 0,
    hoursRemaining: 0,
    minutesRemaining: 0,
    percentRemaining: 0,
    label: 'Janela de Mensagens Fechada',
    sublabel: 'Mais de 7 dias sem interação do seguidor',
  };
}

function formatRelativeTime(isoDate: string, nowMs: number): string {
  const time = new Date(isoDate).getTime();
  if (Number.isNaN(time)) return '';
  const diffSec = Math.max(0, Math.floor((nowMs - time) / 1000));
  if (diffSec < 60) return 'agora';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `há ${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `há ${diffDays}d`;
}

function formatDateTime(isoDate: string): string {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

export default function InstagramLiveChatInbox({
  rules,
  onTriggerToast,
}: InstagramLiveChatInboxProps) {
  const [conversations, setConversations] = useState<InstagramConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMode, setFilterMode] = useState<'all' | 'open24h' | 'with_flow'>('all');
  const [selectedRuleToDispatch, setSelectedRuleToDispatch] = useState<string>('');
  const [dispatchingFlow, setDispatchingFlow] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>('');
  const [sendAsPublicComment, setSendAsPublicComment] = useState<boolean>(false);
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Atualiza relógio da janela de 24h a cada 30 segundos
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const fetchConversations = async (silent = false) => {
    if (!silent) setLoading(true);
    else setSyncing(true);

    try {
      const res = await fetch('/api/instagram/chat', { cache: 'no-store' });
      const data = await res.json();
      if (data.success && Array.isArray(data.conversations)) {
        setConversations(data.conversations);
        if (!selectedId && data.conversations.length > 0) {
          setSelectedId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar conversas:', err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
    // Auto-polling suave a cada 20s para manter o chat atualizado ao vivo
    const poll = setInterval(() => fetchConversations(true), 20000);
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    if (rules.length > 0 && !selectedRuleToDispatch) {
      setSelectedRuleToDispatch(rules[0].id);
    }
  }, [rules, selectedRuleToDispatch]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchUser = c.username.toLowerCase().includes(q);
        const matchName = (c.name || '').toLowerCase().includes(q);
        const matchMsg = (c.lastMessageText || '').toLowerCase().includes(q);
        if (!matchUser && !matchName && !matchMsg) return false;
      }

      if (filterMode === 'open24h') {
        const win = compute24hWindow(c.lastUserInteractionAt, nowMs);
        if (!win.isOpen) return false;
      }

      if (filterMode === 'with_flow') {
        if (!c.triggeredRuleIds || c.triggeredRuleIds.length === 0) return false;
      }

      return true;
    });
  }, [conversations, searchQuery, filterMode, nowMs]);

  const activeConversation = useMemo(() => {
    return (
      conversations.find((c) => c.id === selectedId) ||
      filteredConversations[0] ||
      null
    );
  }, [conversations, filteredConversations, selectedId]);

  const activeWindowStatus = useMemo(() => {
    if (!activeConversation) return null;
    return compute24hWindow(activeConversation.lastUserInteractionAt, nowMs);
  }, [activeConversation, nowMs]);

  const handleSelectConversation = async (conv: InstagramConversation) => {
    setSelectedId(conv.id);
    if (conv.unreadCount > 0) {
      setConversations((prev) =>
        prev.map((item) => (item.id === conv.id ? { ...item, unreadCount: 0 } : item))
      );
      try {
        await fetch('/api/instagram/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mark_read', conversationId: conv.id }),
        });
      } catch {
        // ignore
      }
    }
  };

  const handleDispatchFlow = async () => {
    if (!activeConversation || !selectedRuleToDispatch || dispatchingFlow) return;
    setDispatchingFlow(true);
    try {
      const res = await fetch('/api/instagram/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispatch_flow',
          conversationId: activeConversation.id,
          ruleId: selectedRuleToDispatch,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        } else if (data.conversation) {
          setConversations((prev) =>
            prev.map((c) => (c.id === data.conversation.id ? data.conversation : c))
          );
        }
        onTriggerToast?.(
          `Fluxo disparado com sucesso para @${activeConversation.username}!`,
          'success'
        );
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        onTriggerToast?.(data.error || 'Erro ao disparar fluxo.', 'error');
      }
    } catch {
      onTriggerToast?.('Erro de conexão ao disparar fluxo.', 'error');
    } finally {
      setDispatchingFlow(false);
    }
  };

  const handleSendManualMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation || !manualText.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      const res = await fetch('/api/instagram/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'send_message',
          conversationId: activeConversation.id,
          text: manualText.trim(),
          sendAsPublicComment,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setManualText('');
        if (Array.isArray(data.conversations)) {
          setConversations(data.conversations);
        } else if (data.conversation) {
          setConversations((prev) =>
            prev.map((c) => (c.id === data.conversation.id ? data.conversation : c))
          );
        }
        onTriggerToast?.(
          `Mensagem enviada para @${activeConversation.username}!`,
          'success'
        );
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        onTriggerToast?.(data.error || 'Erro ao enviar mensagem.', 'error');
      }
    } catch {
      onTriggerToast?.('Erro de rede ao enviar mensagem.', 'error');
    } finally {
      setSendingMessage(false);
    }
  };

  const open24hCount = useMemo(() => {
    return conversations.filter((c) => compute24hWindow(c.lastUserInteractionAt, nowMs).isOpen)
      .length;
  }, [conversations, nowMs]);

  if (loading) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400">
          Sincronizando conversas e janela de 24h com a Meta Graph API...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Banner Superior de Status do Live Chat */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-lg">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">
                Live Chat & Auditoria de Fluxos (Estilo ManyChat)
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Sincronização Automática Ativa
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Acompanhe todas as pessoas que iniciaram fluxos, verifique a Janela de 24h da Meta e dispare fluxos cadastrados com 1 clique.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              {open24hCount} {open24hCount === 1 ? 'conversa' : 'conversas'} na Janela 24h
            </span>
          </div>

          <button
            type="button"
            onClick={() => fetchConversations(true)}
            disabled={syncing}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <span className={syncing ? 'animate-spin' : ''}>🔄</span>
            {syncing ? 'Sincronizando...' : 'Atualizar Agora'}
          </button>
        </div>
      </div>

      {/* Container Principal Split-View (Lista à Esquerda + Conversa à Direita) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[680px]">
        {/* COLUNA ESQUERDA: Lista de Contatos que Iniciaram Fluxo */}
        <div className="lg:col-span-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {/* Busca e Filtros */}
          <div className="p-3.5 border-b border-slate-800 space-y-2.5 bg-slate-950/50">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar seguidor (@username ou mensagem)..."
                className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
              <span className="absolute left-3 top-2.5 text-slate-500 text-xs">🔍</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  filterMode === 'all'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                Todas ({conversations.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('open24h')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  filterMode === 'open24h'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                🟢 Janela 24h ({open24hCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('with_flow')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                  filterMode === 'with_flow'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                ⚡ Com Fluxo
              </button>
            </div>
          </div>

          {/* Lista de Contatos */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[600px]">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400">Nenhuma conversa encontrada para este filtro.</p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const win = compute24hWindow(conv.lastUserInteractionAt, nowMs);
                const initials = (conv.name || conv.username || 'IG')
                  .replace(/^@/, '')
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <button
                    key={conv.id}
                    type="button"
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left p-3.5 transition-all flex items-start gap-3 hover:bg-slate-800/50 ${
                      isSelected ? 'bg-emerald-500/10 border-l-4 border-l-emerald-400' : ''
                    }`}
                  >
                    {/* Avatar com Indicador de Janela 24h */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500/30 to-sky-500/30 border border-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {initials}
                      </div>
                      <span
                        title={win.label}
                        className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          win.isOpen ? 'bg-emerald-400' : 'bg-amber-400'
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          @{conv.username}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {formatRelativeTime(conv.lastMessageAt, nowMs)}
                        </span>
                      </div>

                      {conv.name && conv.name.toLowerCase() !== conv.username.toLowerCase() && (
                        <p className="text-[11px] text-slate-400 truncate">{conv.name}</p>
                      )}

                      <p className="text-xs text-slate-300 line-clamp-2 mt-1 leading-relaxed">
                        {conv.lastMessageText}
                      </p>

                      {/* Badges de Rodapé do Contato */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                            win.isOpen
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {win.isOpen
                            ? `🟢 24h (${win.hoursRemaining}h ${win.minutesRemaining}m)`
                            : '🕒 > 24h'}
                        </span>

                        {conv.triggeredRuleIds?.length > 0 && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
                            ⚡ {conv.triggeredRuleIds.length}{' '}
                            {conv.triggeredRuleIds.length === 1 ? 'fluxo' : 'fluxos'}
                          </span>
                        )}

                        {conv.unreadCount > 0 && (
                          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950">
                            {conv.unreadCount} nova
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* COLUNA DIREITA: Chat Ativo + Barra de Disparo de Fluxos + Janela 24h */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col overflow-hidden">
          {!activeConversation ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="text-3xl mb-2">👈</div>
              <p className="text-sm font-bold text-white">Selecione uma conversa ao lado</p>
              <p className="text-xs text-slate-400 mt-1">
                Escolha um seguidor para inspecionar o fluxo enviado ou disparar uma automação.
              </p>
            </div>
          ) : (
            <>
              {/* HEADER DA CONVERSA + INDICADOR DE JANELA DE 24H */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500/30 to-sky-500/30 border border-slate-700 flex items-center justify-center text-sm font-bold text-white">
                      {(activeConversation.name || activeConversation.username)
                        .replace(/^@/, '')
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white">
                          @{activeConversation.username}
                        </h3>
                        <a
                          href={`https://www.instagram.com/${activeConversation.username}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 hover:text-sky-300 underline"
                        >
                          Abrir perfil no Instagram ↗
                        </a>
                      </div>
                      <p className="text-xs text-slate-400">
                        {activeConversation.name || activeConversation.username} • Última interação do seguidor:{' '}
                        <span className="text-slate-300 font-medium">
                          {formatDateTime(activeConversation.lastUserInteractionAt)}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Card Oficial da Janela de 24 Horas da Meta */}
                  {activeWindowStatus && (
                    <div
                      className={`px-3.5 py-2 rounded-xl border flex flex-col min-w-[240px] ${
                        activeWindowStatus.isOpen
                          ? 'bg-emerald-950/40 border-emerald-500/40'
                          : 'bg-amber-950/30 border-amber-500/40'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-bold flex items-center gap-1.5 ${
                            activeWindowStatus.isOpen ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          <span>{activeWindowStatus.isOpen ? '🟢' : '🟡'}</span>
                          {activeWindowStatus.label}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Meta Policy</span>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-0.5">
                        {activeWindowStatus.sublabel}
                      </p>
                      {activeWindowStatus.isOpen && (
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1.5">
                          <div
                            className="h-full bg-emerald-400 rounded-full transition-all"
                            style={{ width: `${activeWindowStatus.percentRemaining}%` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* BARRA DE AÇÃO ESTILO MANYCHAT: DISPARAR FLUXO CADASTRADO PARA ESTA PESSOA */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">⚡</span>
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Disparar Fluxo Cadastrado para @{activeConversation.username}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Envia imediatamente o conteúdo da automação selecionada para esta pessoa
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
                    <select
                      value={selectedRuleToDispatch}
                      onChange={(e) => setSelectedRuleToDispatch(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 max-w-[280px]"
                    >
                      {rules.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} {r.active ? '(Ativo)' : '(Pausado)'}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      onClick={handleDispatchFlow}
                      disabled={dispatchingFlow || !selectedRuleToDispatch}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 cursor-pointer"
                    >
                      <span>🚀</span>
                      {dispatchingFlow ? 'Disparando...' : 'Disparar Fluxo'}
                    </button>
                  </div>
                </div>
              </div>

              {/* CORPO DO CHAT: HISTÓRICO COMPLETO DE MENSAGENS E BOTÕES */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 max-h-[430px] bg-slate-950/30">
                {activeConversation.messages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  const isHuman = msg.sender === 'human';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}
                    >
                      {/* Cabeçalho do Balão */}
                      <div className="flex items-center gap-2 mb-1 px-1">
                        <span className="text-[10px] font-bold text-slate-400">
                          {isUser
                            ? `👤 @${activeConversation.username}`
                            : isHuman
                              ? '👩‍💼 Atendimento Humano (@kit.autismo)'
                              : `🤖 Automação: ${msg.ruleName || 'Flow Studio'}`}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {formatDateTime(msg.timestamp)}
                        </span>
                      </div>

                      {/* Balão da Mensagem */}
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap border ${
                          isUser
                            ? 'bg-slate-800/90 border-slate-700 text-slate-100 rounded-tl-sm'
                            : isHuman
                              ? 'bg-indigo-950/80 border-indigo-500/40 text-indigo-100 rounded-tr-sm'
                              : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-50 rounded-tr-sm'
                        }`}
                      >
                        {msg.text}

                        {/* Botões Interativos Enviados no Card (Estilo Instagram Direct) */}
                        {msg.buttons && msg.buttons.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-emerald-500/20 flex flex-col gap-1.5">
                            {msg.buttons.map((btn, idx) => (
                              <div
                                key={idx}
                                className="w-full py-2 px-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5"
                              >
                                <span>{btn.type === 'postback' ? '🔘' : '🔗'}</span>
                                <span>{btn.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Rodapé de Status de Entrega */}
                      {!isUser && (
                        <div className="mt-1 px-1 flex items-center gap-1.5">
                          <span className="text-[10px] text-emerald-400 font-medium">
                            ✓ Entregue via Meta Graph API
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* RODAPÉ DO CHAT: ENVIO DE MENSAGEM MANUAL AO VIVO */}
              <form
                onSubmit={handleSendManualMessage}
                className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendAsPublicComment}
                      onChange={(e) => setSendAsPublicComment(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0"
                    />
                    <span>
                      Responder também publicamente no comentário do post (útil quando a pessoa ainda não abriu o Direct)
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    {manualText.length}/950 chars
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder={`Escreva uma mensagem acolhedora para @${activeConversation.username}...`}
                    maxLength={950}
                    className="flex-1 bg-slate-900 border border-slate-800 focus:border-emerald-500/60 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !manualText.trim()}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {sendingMessage ? 'Enviando...' : 'Enviar Direct'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
