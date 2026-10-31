'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  AutomationRule,
  KeywordMatchMode,
  PostScopeType,
  StoryPollBranch,
  StoryScopeType,
  TriggerChannel,
} from '@/lib/instagram/types';
import {
  DEFAULT_FOLLOW_GATE_RETRY_TEXT,
  DEFAULT_FOLLOW_GATE_TEXT,
  DEFAULT_PUBLIC_REPLY_VARIATIONS,
  DEFAULT_TWO_STEP_PROMPT_TEXT,
  TWO_STEP_TEMPLATES,
} from '@/lib/instagram/rules';
import FlowPreviewPhone from '@/components/instagram/FlowPreviewPhone';

interface InstagramMediaItem {
  id: string;
  caption?: string;
  media_type?: string;
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  comments_count?: number;
  like_count?: number;
}

type CategoryFilter = 'all' | 'comment' | 'story_reply' | 'dm';
type MediaFilterTab = 'all' | 'reels' | 'posts' | 'stories' | 'manual';

export default function InstagramFlowStudioV3() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'flows' | 'simulator' | 'stories' | 'webhook'>(
    'flows'
  );
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

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

  // Catálogo paginado de publicações, Reels e Stories ativos do @kit.autismo
  const [recentMedia, setRecentMedia] = useState<InstagramMediaItem[]>([]);
  const [activeStories, setActiveStories] = useState<InstagramMediaItem[]>([]);
  const [nextMediaCursor, setNextMediaCursor] = useState<string | null>(null);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingMoreMedia, setLoadingMoreMedia] = useState(false);
  const [mediaFilterTab, setMediaFilterTab] = useState<MediaFilterTab>('all');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [manualMediaIdInput, setManualMediaIdInput] = useState('');

  // Studio Builder (Tela dividida Estilo OpenReply + ChatbotX)
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [isNewRule, setIsNewRule] = useState(false);
  const [tempKeyword, setTempKeyword] = useState('');
  const [tempExcludeKeyword, setTempExcludeKeyword] = useState('');
  const [activePreviewBranchIdx, setActivePreviewBranchIdx] = useState(0);

  // Simulador de Direct (Sandbox)
  const [simulatorInput, setSimulatorInput] = useState('');
  const [simulateChannel, setSimulateChannel] = useState<TriggerChannel>('dm');
  const [simulateNonFollower, setSimulateNonFollower] = useState(false);
  const [simulateUserName, setSimulateUserName] = useState('Ana');
  const [chatMessages, setChatMessages] = useState<
    Array<{
      from: 'user' | 'bot';
      text: string;
      time: string;
      badge?: string;
      buttons?: Array<{ title: string; url?: string; payload?: string }>;
    }>
  >([
    {
      from: 'user',
      text: 'ROTINA',
      time: '10:42',
      badge: 'Comentou no Post',
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

  // Carrega publicações (até 50 por página ou catálogo completo) e Stories ativos
  const fetchInstagramMedia = async (options?: { after?: string; loadAll?: boolean }) => {
    try {
      if (options?.after || options?.loadAll) {
        setLoadingMoreMedia(true);
      } else {
        if (recentMedia.length > 0) return;
        setLoadingMedia(true);
      }

      const params = new URLSearchParams();
      params.set('limit', '50');
      if (options?.after) params.set('after', options.after);
      if (options?.loadAll) params.set('all', 'true');

      const res = await fetch(`/api/instagram/media?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        if (options?.after) {
          setRecentMedia((prev) => {
            const existing = new Set(prev.map((p) => p.id));
            const nextItems = (data.media || []).filter(
              (item: InstagramMediaItem) => !existing.has(item.id)
            );
            return [...prev, ...nextItems];
          });
        } else if (Array.isArray(data.media)) {
          setRecentMedia(data.media);
        }
        if (Array.isArray(data.stories) && data.stories.length > 0) {
          setActiveStories(data.stories);
        }
        setNextMediaCursor(data.nextCursor || null);
      }
    } catch (err) {
      console.error('Erro ao carregar posts do Instagram:', err);
    } finally {
      setLoadingMedia(false);
      setLoadingMoreMedia(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Mapa de posts já usados por outras regras (OpenReply usedPosts pattern)
  const usedPostsMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const r of rules) {
      if (editingRule && r.id === editingRule.id) continue;
      for (const pid of r.targetMediaIds || []) {
        map[pid] = r.name;
      }
    }
    return map;
  }, [rules, editingRule]);

  // Lista filtrada de mídias no seletor (Todos, Reels, Carrossel/Foto, Busca por legenda)
  const filteredMediaList = useMemo(() => {
    const base = mediaFilterTab === 'stories' ? activeStories : recentMedia;
    return base.filter((item) => {
      if (mediaFilterTab === 'reels') {
        const isReel =
          item.media_product_type === 'REELS' || item.media_type === 'VIDEO';
        if (!isReel) return false;
      } else if (mediaFilterTab === 'posts') {
        const isPost =
          item.media_product_type !== 'REELS' && item.media_type !== 'VIDEO';
        if (!isPost) return false;
      }
      if (mediaSearchQuery.trim()) {
        const q = mediaSearchQuery.toLowerCase();
        const cap = (item.caption || '').toLowerCase();
        return cap.includes(q) || item.id.includes(q);
      }
      return true;
    });
  }, [recentMedia, activeStories, mediaFilterTab, mediaSearchQuery]);

  // Regras filtradas na aba principal
  const filteredRules = useMemo(() => {
    if (categoryFilter === 'all') return rules;
    return rules.filter((r) => {
      const channels = r.triggerChannels || [r.triggerType || 'comment'];
      if (categoryFilter === 'story_reply') {
        return r.triggerType === 'story_reply' || r.isInteractivePoll || channels.includes('story_reply');
      }
      if (categoryFilter === 'comment') {
        return channels.includes('comment');
      }
      if (categoryFilter === 'dm') {
        return r.triggerType === 'dm' || (channels.length === 1 && channels[0] === 'dm');
      }
      return true;
    });
  }, [rules, categoryFilter]);

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

  // Exclui fluxo
  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Deseja realmente excluir este fluxo de automação?')) return;
    const updated = rules.filter((r) => r.id !== ruleId);
    setRules(updated);
    await saveRulesToBackend(updated);
  };

  // Criar Novo Fluxo Padrão (Comentário / Story / DM)
  const handleCreateNewRule = (presetChannel: TriggerChannel = 'comment') => {
    fetchInstagramMedia();
    setActivePreviewBranchIdx(0);
    setEditingRule({
      id: `fluxo-${Date.now()}`,
      name:
        presetChannel === 'story_reply'
          ? 'Novo Fluxo para Resposta de Story'
          : presetChannel === 'dm'
            ? 'Novo Fluxo para Mensagem no Direct'
            : 'Novo Fluxo de Comentário em Post/Reel',
      triggerType: presetChannel,
      triggerChannels: [presetChannel],
      postScope: 'specific',
      storyScope: 'any',
      targetMediaIds: [],
      targetStoryIds: [],
      matchMode: 'whole_word',
      wholeWordMatch: true,
      exactMessageMatch: false,
      isInteractivePoll: false,
      keywords: ['quero'],
      excludeKeywords: [],
      replyText:
        'Olá! Separei o conteúdo especial que você pediu aqui no Kit Autismo. 💙\n\nToque no botão abaixo para acessar agora mesmo:',
      linkUrl: 'https://kitautismo.com',
      buttonTitle: 'Acessar Conteúdo',
      publicReplyEnabled: presetChannel === 'comment',
      publicReplyVariations: [...DEFAULT_PUBLIC_REPLY_VARIATIONS],
      requireFollow: presetChannel === 'comment',
      followGateText: DEFAULT_FOLLOW_GATE_TEXT,
      followGateButtonTitle: '✅ Já segui! Liberar',
      followGateRetryText: DEFAULT_FOLLOW_GATE_RETRY_TEXT,
      twoStepCommentOptIn: presetChannel === 'comment',
      twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
      twoStepButtonTitle: '🎁 Liberar Material',
      followUpEnabled: false,
      followUpText: '',
      humanTypingDelay: true,
      expiresAt: null,
      active: true,
    });
    setIsNewRule(true);
    setTempKeyword('');
    setTempExcludeKeyword('');
  };

  // Criar Nova Enquete Interativa de Story (A, B, C num único fluxo sem conflitos!)
  const handleCreateStoryPollRule = () => {
    fetchInstagramMedia();
    setActivePreviewBranchIdx(0);
    setEditingRule({
      id: `enquete-story-${Date.now()}`,
      name: 'Enquete Interativa de Story (Opções A, B ou C)',
      triggerType: 'story_reply',
      triggerChannels: ['story_reply'],
      storyScope: 'any',
      targetStoryIds: [],
      matchMode: 'exact',
      exactMessageMatch: true,
      isInteractivePoll: true,
      keywords: ['a', 'b', 'c'],
      pollBranches: [
        {
          id: 'opcao-a',
          label: 'Opção A',
          keywords: ['a', 'letra a', 'opcao a'],
          replyText:
            'Olá! Você escolheu a Opção A no nosso Story! 💙\n\nAqui está o acesso direto que preparamos para você:',
          buttonTitle: 'Acessar Opção A',
          linkUrl: 'https://kitautismo.com/rotina',
        },
        {
          id: 'opcao-b',
          label: 'Opção B',
          keywords: ['b', 'letra b', 'opcao b'],
          replyText:
            'Olá! Você escolheu a Opção B no nosso Story! 💙\n\nAqui está o material prático para ajudar nessa situação:',
          buttonTitle: 'Acessar Opção B',
          linkUrl: 'https://kitautismo.com/alimentacao',
        },
        {
          id: 'opcao-c',
          label: 'Opção C',
          keywords: ['c', 'letra c', 'opcao c'],
          replyText:
            'Olá! Você escolheu a Opção C no nosso Story! 💙\n\nToque no botão abaixo para ver o passo a passo completo:',
          buttonTitle: 'Acessar Opção C',
          linkUrl: 'https://kitautismo.com',
        },
      ],
      replyText: 'Olá! Recebi sua resposta no nosso Story! 💙',
      linkUrl: 'https://kitautismo.com',
      buttonTitle: 'Acessar Material',
      publicReplyEnabled: false,
      requireFollow: false,
      followGateText: DEFAULT_FOLLOW_GATE_TEXT,
      followGateButtonTitle: '✅ Já segui! Liberar',
      followGateRetryText: DEFAULT_FOLLOW_GATE_RETRY_TEXT,
      twoStepCommentOptIn: false,
      twoStepPromptText: DEFAULT_TWO_STEP_PROMPT_TEXT,
      twoStepButtonTitle: '🎁 Liberar Material',
      humanTypingDelay: true,
      expiresAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      active: true,
    });
    setIsNewRule(true);
    setTempKeyword('');
    setTempExcludeKeyword('');
  };

  // Salvar do Studio Builder
  const handleSaveBuilder = async () => {
    if (!editingRule) return;
    if (!editingRule.name.trim()) {
      alert('Digite um nome para identificar este fluxo.');
      return;
    }
    if (!editingRule.triggerChannels || editingRule.triggerChannels.length === 0) {
      alert('Selecione pelo menos 1 canal de início (Comentário, Story ou Direct).');
      return;
    }
    if (
      editingRule.triggerChannels.includes('comment') &&
      editingRule.postScope === 'specific' &&
      (!editingRule.targetMediaIds || editingRule.targetMediaIds.length === 0)
    ) {
      alert(
        'Você escolheu "Publicações Específicas", mas ainda não selecionou nenhum Post/Reel na grade abaixo (ou mude para "Qualquer publicação do Feed").'
      );
      return;
    }

    // Se for Enquete Interativa (A/B/C), sincroniza a lista geral de keywords a partir das ramificações
    const preparedRule: AutomationRule = {
      ...editingRule,
      exactMessageMatch: editingRule.matchMode === 'exact',
      wholeWordMatch: editingRule.matchMode === 'whole_word',
    };

    if (preparedRule.isInteractivePoll && Array.isArray(preparedRule.pollBranches)) {
      const allBranchKws = Array.from(
        new Set(
          preparedRule.pollBranches
            .flatMap((b) => b.keywords)
            .map((k) => k.trim().toLowerCase())
            .filter(Boolean)
        )
      );
      preparedRule.keywords = allBranchKws.length > 0 ? allBranchKws : ['a', 'b', 'c'];
    } else if (preparedRule.matchMode !== 'any' && preparedRule.keywords.length === 0) {
      alert('Adicione pelo menos uma palavra-chave gatilho ou mude para "Qualquer comentário/resposta".');
      return;
    }

    let updated: AutomationRule[];
    if (isNewRule) {
      updated = [preparedRule, ...rules];
    } else {
      updated = rules.map((r) => (r.id === preparedRule.id ? preparedRule : r));
    }

    await saveRulesToBackend(updated);
  };

  // Alterna um canal de gatilho ('comment' | 'story_reply' | 'dm')
  const toggleTriggerChannel = (ch: TriggerChannel) => {
    if (!editingRule) return;
    const current = editingRule.triggerChannels || [];
    const exists = current.includes(ch);
    const next = exists ? current.filter((c) => c !== ch) : [...current, ch];
    if (next.length === 0) return; // mantém pelo menos 1 canal selecionado
    setEditingRule({
      ...editingRule,
      triggerChannels: next,
      triggerType: next[0],
    });
  };

  // Adicionar / remover palavra-chave
  const handleAddKeyword = () => {
    if (!tempKeyword.trim() || !editingRule) return;
    const parts = tempKeyword
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const merged = Array.from(new Set([...editingRule.keywords, ...parts]));
    setEditingRule({ ...editingRule, keywords: merged });
    setTempKeyword('');
  };

  const handleRemoveKeyword = (kw: string) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      keywords: editingRule.keywords.filter((k) => k !== kw),
    });
  };

  // Adicionar / remover palavra negativa (ChatbotX ExcludeKeywords)
  const handleAddExcludeKeyword = () => {
    if (!tempExcludeKeyword.trim() || !editingRule) return;
    const parts = tempExcludeKeyword
      .split(',')
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);
    const merged = Array.from(new Set([...(editingRule.excludeKeywords || []), ...parts]));
    setEditingRule({ ...editingRule, excludeKeywords: merged });
    setTempExcludeKeyword('');
  };

  const handleRemoveExcludeKeyword = (kw: string) => {
    if (!editingRule) return;
    setEditingRule({
      ...editingRule,
      excludeKeywords: (editingRule.excludeKeywords || []).filter((k) => k !== kw),
    });
  };

  // Alterna seleção de um post/Reel ou Story específico
  const toggleTargetMediaId = (mediaId: string, isStory = false) => {
    if (!editingRule) return;
    if (isStory) {
      const current = editingRule.targetStoryIds || [];
      const exists = current.includes(mediaId);
      const next = exists ? current.filter((id) => id !== mediaId) : [...current, mediaId];
      setEditingRule({
        ...editingRule,
        storyScope: next.length > 0 ? 'specific' : 'any',
        targetStoryIds: next,
      });
    } else {
      const current = editingRule.targetMediaIds || [];
      const exists = current.includes(mediaId);
      const next = exists ? current.filter((id) => id !== mediaId) : [...current, mediaId];
      setEditingRule({
        ...editingRule,
        postScope: next.length > 0 ? 'specific' : editingRule.postScope,
        targetMediaIds: next,
      });
    }
  };

  // Atualiza uma ramificação da Enquete Interativa (A/B/C)
  const updatePollBranch = (idx: number, patch: Partial<StoryPollBranch>) => {
    if (!editingRule || !editingRule.pollBranches) return;
    const nextBranches = editingRule.pollBranches.map((b, i) =>
      i === idx ? { ...b, ...patch } : b
    );
    setEditingRule({ ...editingRule, pollBranches: nextBranches });
  };

  const addPollBranch = () => {
    if (!editingRule) return;
    const current = editingRule.pollBranches || [];
    const letter = String.fromCharCode(65 + current.length); // A, B, C, D...
    const lower = letter.toLowerCase();
    const newBranch: StoryPollBranch = {
      id: `opcao-${lower}-${Date.now()}`,
      label: `Opção ${letter}`,
      keywords: [lower, `letra ${lower}`, `opcao ${lower}`],
      replyText: `Olá! Você escolheu a Opção ${letter}! 💙\n\nAqui está o seu acesso recomendado:`,
      buttonTitle: `Acessar Opção ${letter}`,
      linkUrl: 'https://kitautismo.com',
    };
    const next = [...current, newBranch];
    setEditingRule({
      ...editingRule,
      isInteractivePoll: true,
      pollBranches: next,
    });
    setActivePreviewBranchIdx(next.length - 1);
  };

  const removePollBranch = (idx: number) => {
    if (!editingRule || !editingRule.pollBranches || editingRule.pollBranches.length <= 1) return;
    const next = editingRule.pollBranches.filter((_, i) => i !== idx);
    setEditingRule({ ...editingRule, pollBranches: next });
    setActivePreviewBranchIdx(0);
  };

  // Simulador no Sandbox (respeitando o canal simulado: Comentário vs Story vs DM)
  const handleSendSimulator = (overrideText?: string, isFollowUnlock?: boolean) => {
    const rawInput = overrideText ?? simulatorInput;
    if (!rawInput.trim()) return;

    const userText = rawInput.trim();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const channelBadge =
      simulateChannel === 'comment'
        ? '💬 Comentou no Post'
        : simulateChannel === 'story_reply'
          ? '📸 Respondeu ao Story'
          : '✉️ Enviou no Direct';

    setChatMessages((prev) => [
      ...prev,
      { from: 'user', text: userText, time: timeStr, badge: channelBadge },
    ]);
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
      const activeRules = rules.filter((r) => {
        if (!r.active) return false;
        const chs = r.triggerChannels || [r.triggerType || 'comment'];
        return chs.includes(simulateChannel);
      });

      let matchedRule: AutomationRule | null = null;

      // 1. Verifica Enquetes Interativas (A/B/C)
      for (const r of activeRules) {
        if (r.isInteractivePoll && r.pollBranches) {
          for (const b of r.pollBranches) {
            for (const kw of b.keywords) {
              const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
              if (cleanUserText === normKw || words.includes(normKw)) {
                matchedRule = {
                  ...r,
                  name: `${r.name} (${b.label})`,
                  replyText: b.replyText,
                  buttonTitle: b.buttonTitle || r.buttonTitle,
                  linkUrl: b.linkUrl || r.linkUrl,
                  secondaryButtonTitle: b.secondaryButtonTitle ?? r.secondaryButtonTitle,
                  secondaryLinkUrl: b.secondaryLinkUrl ?? r.secondaryLinkUrl,
                };
                break;
              }
            }
            if (matchedRule) break;
          }
        }
        if (matchedRule) break;
      }

      // 2. Verifica Regras Normais
      if (!matchedRule) {
        for (const r of activeRules) {
          if (r.isInteractivePoll && (r.pollBranches?.length || 0) > 0) continue;
          if (r.matchMode === 'any') {
            matchedRule = r;
            break;
          }
          for (const kw of r.keywords) {
            const normKw = kw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
            if (r.matchMode === 'exact' || r.exactMessageMatch) {
              if (cleanUserText === normKw) {
                matchedRule = r;
                break;
              }
            } else if (
              words.includes(normKw) ||
              cleanUserText === normKw ||
              (r.matchMode === 'contains' && normKw.length >= 3 && cleanUserText.includes(normKw))
            ) {
              matchedRule = r;
              break;
            }
          }
          if (matchedRule) break;
        }
      }

      const firstName = simulateUserName.trim() || 'Ana';

      if (matchedRule) {
        if (matchedRule.requireFollow && simulateNonFollower && !isFollowUnlock) {
          const gateText = (matchedRule.followGateText || DEFAULT_FOLLOW_GATE_TEXT).replace(
            /\{nome\}/gi,
            `, ${firstName}`
          );
          setChatMessages((prev) => [
            ...prev,
            {
              from: 'bot',
              text: gateText,
              time: timeStr,
              buttons: [
                {
                  title: matchedRule?.followGateButtonTitle || '✅ Já segui! Liberar',
                  payload: userText,
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

        const personalized = matchedRule.replyText
          .replace(/\{nome\}/gi, `, ${firstName}`)
          .replace(/^Olá!/i, `Olá, ${firstName}!`);

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
            text: `Nenhuma regra ativa configurada para o canal "${
              simulateChannel === 'comment'
                ? 'Comentário em Post'
                : simulateChannel === 'story_reply'
                  ? 'Resposta de Story'
                  : 'Direct (DM)'
            }" correspondeu a "${userText}". (Isso garante isolamento total entre Stories, Posts e DM!)`,
            time: timeStr,
          },
        ]);
      }

      setIsBotTyping(false);
    }, 550);
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

  // Thumbnail e legenda do primeiro post selecionado (para mostrar no iPhone Preview)
  const selectedPreviewPost = useMemo(() => {
    if (!editingRule) return null;
    const firstId =
      editingRule.targetMediaIds?.[0] || editingRule.targetStoryIds?.[0];
    if (!firstId) return null;
    return (
      recentMedia.find((m) => m.id === firstId) ||
      activeStories.find((s) => s.id === firstId) ||
      null
    );
  }, [editingRule, recentMedia, activeStories]);

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 py-4 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-emerald-400 flex items-center justify-center font-black text-white shadow-lg shadow-purple-500/20 text-lg">
            ⚡
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Konverops Flow Studio
              </h1>
              <span className="text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/30">
                v3.0 • OpenReply + ChatbotX UX
              </span>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                Canais Isolados: Comentários • Stories • Direct
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Construtor Visual de Fluxos com Preview em Tempo Real, Enquetes Ramificadas (A/B/C) e Catálogo Completo de Posts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {editingRule ? (
            <>
              <button
                type="button"
                onClick={() => setEditingRule(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
              >
                ← Voltar para Lista de Fluxos
              </button>
              <button
                type="button"
                onClick={handleSaveBuilder}
                disabled={saving}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black uppercase tracking-wide shadow-lg shadow-emerald-500/20 transition-all"
              >
                {saving ? 'Salvando...' : '✓ Salvar e Publicar Fluxo'}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/admin"
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                ← Bio Studio
              </Link>
              <button
                type="button"
                onClick={handleCreateStoryPollRule}
                className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
              >
                📸 + Enquete de Story (A/B/C)
              </button>
              <button
                type="button"
                onClick={() => handleCreateNewRule('comment')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
              >
                + Novo Fluxo de Automação
              </button>
            </>
          )}
        </div>
      </header>

      {/* SE ESTIVER COM O CONSTRUTOR ABERTO: STUDIO BUILDER DE TELA DIVIDIDA (OPENREPLY + CHATBOTX) */}
      {editingRule ? (
        <main className="px-6 py-6 max-w-7xl mx-auto w-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* COLUNA ESQUERDA (7 COLUNAS): PASSO A PASSO DO FLUXO */}
            <div className="lg:col-span-7 space-y-6">
              {/* CABEÇALHO DO FLUXO */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Identificação da Campanha
                    </span>
                    <h2 className="text-sm font-bold text-white">
                      {isNewRule ? 'Criar Novo Fluxo de Automação' : `Editando: ${editingRule.name}`}
                    </h2>
                  </div>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <span className="text-xs font-bold text-slate-300">
                      {editingRule.active ? '🟢 ATIVO' : '⏸️ PAUSADO'}
                    </span>
                    <input
                      type="checkbox"
                      checked={editingRule.active}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, active: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all relative peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">
                    Nome do Fluxo (para sua organização):
                  </label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    placeholder="Ex: Reel Quadro de Rotina — Entrega do Material"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* PASSO 1: GATILHO DE ENTRADA (CANAIS ISOLADOS — MANYCHAT / OPENREPLY / CHATBOTX) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">
                    Passo 1 • Ponto de Entrada (Gatilho)
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    Quando e onde este fluxo deve iniciar?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Selecione exatamente em qual canal esta regra deve funcionar. Se você marcar apenas{' '}
                    <strong>Respostas ao Story</strong>, ela nunca será acionada por comentários de posts (e vice-versa).
                  </p>
                </div>

                {/* Cards de seleção de Canal */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      ch: 'comment' as TriggerChannel,
                      icon: '💬',
                      title: 'Comentário em Post/Reel',
                      desc: 'Quando alguém comenta em uma publicação ou Reel',
                      color: 'emerald',
                    },
                    {
                      ch: 'story_reply' as TriggerChannel,
                      icon: '📸',
                      title: 'Resposta aos Stories',
                      desc: 'Quando alguém responde a um Story ou Enquete',
                      color: 'pink',
                    },
                    {
                      ch: 'dm' as TriggerChannel,
                      icon: '✉️',
                      title: 'Mensagem no Direct (DM)',
                      desc: 'Quando alguém manda a palavra direto na DM',
                      color: 'purple',
                    },
                  ].map((item) => {
                    const selected = Boolean(editingRule.triggerChannels?.includes(item.ch));
                    return (
                      <button
                        key={item.ch}
                        type="button"
                        onClick={() => toggleTriggerChannel(item.ch)}
                        className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                          selected
                            ? 'bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/30'
                            : 'bg-slate-950/70 border-slate-800/80 opacity-70 hover:opacity-100 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg">{item.icon}</span>
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              selected
                                ? 'bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {selected ? '✓ ATIVO' : 'INATIVO'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{item.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                            {item.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* SUB-OPÇÕES SE "COMENTÁRIO EM POST/REEL" ESTIVER ATIVO */}
                {editingRule.triggerChannels?.includes('comment') && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                    <p className="text-xs font-bold text-emerald-400">
                      📌 Em qual publicação do Feed/Reels o comentário deve acontecer?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        {
                          scope: 'specific' as PostScopeType,
                          label: '🎯 Publicações Específicas',
                          sub: 'Escolher posts/Reels na lista abaixo',
                        },
                        {
                          scope: 'any' as PostScopeType,
                          label: '🌐 Qualquer Post ou Reel',
                          sub: 'Vale para comentários em todos os posts',
                        },
                        {
                          scope: 'next' as PostScopeType,
                          label: '🚀 Próximo Post / Reel',
                          sub: 'Vincula ao próximo post publicado',
                        },
                      ].map((opt) => {
                        const isChecked =
                          (editingRule.postScope || 'any') === opt.scope;
                        return (
                          <button
                            key={opt.scope}
                            type="button"
                            onClick={() =>
                              setEditingRule({
                                ...editingRule,
                                postScope: opt.scope,
                                targetMediaIds:
                                  opt.scope === 'specific'
                                    ? editingRule.targetMediaIds || []
                                    : [],
                              })
                            }
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                              isChecked
                                ? 'bg-emerald-500/15 border-emerald-500 text-white'
                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                          >
                            <p className="text-xs font-bold">{opt.label}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{opt.sub}</p>
                          </button>
                        );
                      })}
                    </div>

                    {/* SELETOR COMPLETO DE PUBLICAÇÕES & REELS (PAGINADO + FILTROS + BUSCA) */}
                    {editingRule.postScope === 'specific' && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { id: 'all' as MediaFilterTab, label: `Todos (${recentMedia.length})` },
                              { id: 'reels' as MediaFilterTab, label: '🎬 Reels / Vídeos' },
                              { id: 'posts' as MediaFilterTab, label: '🖼️ Carrossel / Fotos' },
                              { id: 'manual' as MediaFilterTab, label: '🔢 ID Manual' },
                            ].map((tItem) => (
                              <button
                                key={tItem.id}
                                type="button"
                                onClick={() => setMediaFilterTab(tItem.id)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                  mediaFilterTab === tItem.id
                                    ? 'bg-emerald-500 text-slate-950'
                                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                                }`}
                              >
                                {tItem.label}
                              </button>
                            ))}
                          </div>

                          <input
                            type="text"
                            value={mediaSearchQuery}
                            onChange={(e) => setMediaSearchQuery(e.target.value)}
                            placeholder="🔍 Buscar post pela legenda..."
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 w-56"
                          />
                        </div>

                        {mediaFilterTab === 'manual' ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={manualMediaIdInput}
                              onChange={(e) => setManualMediaIdInput(e.target.value)}
                              placeholder="Cole o ID da publicação do Instagram (ex: 18054321987654321)"
                              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (!manualMediaIdInput.trim()) return;
                                toggleTargetMediaId(manualMediaIdInput.trim(), false);
                                setManualMediaIdInput('');
                              }}
                              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs"
                            >
                              + Vincular ID
                            </button>
                          </div>
                        ) : loadingMedia ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            Carregando catálogo de publicações de @kit.autismo...
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
                              {filteredMediaList.map((post) => {
                                const isSelected = Boolean(
                                  editingRule.targetMediaIds?.includes(post.id)
                                );
                                const usedByOther = usedPostsMap[post.id];
                                const thumb = post.thumbnail_url || post.media_url;
                                const isVideo =
                                  post.media_product_type === 'REELS' ||
                                  post.media_type === 'VIDEO';
                                return (
                                  <button
                                    key={post.id}
                                    type="button"
                                    onClick={() => toggleTargetMediaId(post.id, false)}
                                    title={
                                      usedByOther
                                        ? `Já usado em "${usedByOther}" — clique para selecionar`
                                        : post.caption || post.id
                                    }
                                    className={`relative rounded-xl overflow-hidden border-2 aspect-square group text-left transition-all ${
                                      isSelected
                                        ? 'border-emerald-400 ring-2 ring-emerald-500/40'
                                        : usedByOther
                                          ? 'border-amber-500/50 opacity-85 hover:opacity-100'
                                          : 'border-slate-800 opacity-80 hover:opacity-100 hover:border-slate-600'
                                    }`}
                                  >
                                    {thumb ? (
                                      <img
                                        src={thumb}
                                        alt={post.caption?.slice(0, 30) || 'Post'}
                                        loading="lazy"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-slate-900 flex items-center justify-center p-1.5 text-[9px] text-slate-400 text-center">
                                        {post.caption?.slice(0, 40) || post.id}
                                      </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-1.5">
                                      <p className="text-[9px] text-slate-200 truncate">
                                        {post.caption || 'Sem legenda'}
                                      </p>
                                    </div>
                                    {isVideo && (
                                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white font-bold">
                                        🎬
                                      </span>
                                    )}
                                    {usedByOther && !isSelected && (
                                      <span className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 text-[8px] font-black">
                                        Em uso
                                      </span>
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

                            {/* Botões de Paginação para ver todo o histórico de Posts (Não trava mais em 12!) */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                              <span className="text-[11px] text-slate-400">
                                Exibindo <strong>{filteredMediaList.length}</strong> publicações carregadas •{' '}
                                <strong className="text-emerald-400">
                                  {editingRule.targetMediaIds?.length || 0} selecionada(s)
                                </strong>
                              </span>
                              <div className="flex items-center gap-2">
                                {nextMediaCursor && (
                                  <button
                                    type="button"
                                    disabled={loadingMoreMedia}
                                    onClick={() =>
                                      fetchInstagramMedia({ after: nextMediaCursor })
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700"
                                  >
                                    {loadingMoreMedia
                                      ? 'Carregando...'
                                      : '+ Carregar Mais 50 Posts'}
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={loadingMoreMedia}
                                  onClick={() => fetchInstagramMedia({ loadAll: true })}
                                  className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-[11px] font-bold border border-purple-500/30"
                                >
                                  {loadingMoreMedia
                                    ? 'Buscando catálogo...'
                                    : '📚 Carregar Todo o Histórico (250+ Posts)'}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* SUB-OPÇÕES SE "RESPOSTA AOS STORIES" ESTIVER ATIVO */}
                {editingRule.triggerChannels?.includes('story_reply') && (
                  <div className="p-4 rounded-2xl bg-slate-950/80 border border-pink-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold text-pink-300">
                          📸 Configuração do Gatilho de Stories & Prevenção de Conflitos
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Você pode aplicar a todos os Stories ou vincular a um Story específico / definir expiração automática para não dar conflito em semanas futuras!
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRule({
                            ...editingRule,
                            storyScope: 'any',
                            targetStoryIds: [],
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left ${
                          (editingRule.storyScope || 'any') === 'any'
                            ? 'bg-pink-500/15 border-pink-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <p className="text-xs font-bold">📸 Qualquer Story do Perfil</p>
                        <p className="text-[10px] text-slate-400">
                          Responde sempre que alguém enviar o gatilho nos seus Stories
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setEditingRule({
                            ...editingRule,
                            storyScope: 'specific',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left ${
                          editingRule.storyScope === 'specific'
                            ? 'bg-pink-500/15 border-pink-500 text-white'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <p className="text-xs font-bold">🎯 Story Específico no Ar (24h)</p>
                        <p className="text-[10px] text-slate-400">
                          Restringe somente ao Story selecionado abaixo
                        </p>
                      </button>
                    </div>

                    {editingRule.storyScope === 'specific' && (
                      <div className="pt-2">
                        {activeStories.length > 0 ? (
                          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                            {activeStories.map((st) => {
                              const isSel = Boolean(
                                editingRule.targetStoryIds?.includes(st.id)
                              );
                              const thumb = st.thumbnail_url || st.media_url;
                              return (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => toggleTargetMediaId(st.id, true)}
                                  className={`relative aspect-[9/16] rounded-xl overflow-hidden border-2 ${
                                    isSel
                                      ? 'border-pink-400 ring-2 ring-pink-500/40'
                                      : 'border-slate-800 opacity-75 hover:opacity-100'
                                  }`}
                                >
                                  {thumb ? (
                                    <img
                                      src={thumb}
                                      alt="Story"
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="p-2 text-[9px] text-slate-400">
                                      Story {st.id.slice(-6)}
                                    </div>
                                  )}
                                  {isSel && (
                                    <span className="absolute top-1 right-1 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
                                      ✓
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                            Nenhum Story ativo encontrado nas últimas 24h ou você pode usar a{' '}
                            <strong>Expiração Automática</strong> abaixo para que esta ação de Story desligue sozinha após 24h/48h!
                          </p>
                        )}
                      </div>
                    )}

                    {/* Expiração Automática para Campanhas Temporárias de Stories */}
                    <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-semibold text-slate-300">
                        ⏱️ Validade da Campanha de Story (evita conflito em semanas futuras):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { label: '♾️ Permanente', hours: null },
                          { label: '⏳ 24 horas', hours: 24 },
                          { label: '⏳ 48 horas', hours: 48 },
                          { label: '⏳ 7 dias', hours: 168 },
                        ].map((expOpt) => {
                          const isPerm = expOpt.hours === null && !editingRule.expiresAt;
                          return (
                            <button
                              key={expOpt.label}
                              type="button"
                              onClick={() =>
                                setEditingRule({
                                  ...editingRule,
                                  expiresAt: expOpt.hours
                                    ? new Date(
                                        Date.now() + expOpt.hours * 3600 * 1000
                                      ).toISOString()
                                    : null,
                                })
                              }
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                                isPerm
                                  ? 'bg-pink-500/20 text-pink-200 border-pink-500/40'
                                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                            >
                              {expOpt.label}
                            </button>
                          );
                        })}
                      </div>
                      {editingRule.expiresAt && (
                        <p className="w-full text-[10px] text-amber-300">
                          ⏳ Este fluxo irá pausar automaticamente em:{' '}
                          <strong>
                            {new Date(editingRule.expiresAt).toLocaleString('pt-BR')}
                          </strong>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* PASSO 2: MODO DE GATILHO & PALAVRAS-CHAVE (OPENREPLY + CHATBOTX) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">
                      Passo 2 • Condição de Disparo & Palavras-Chave
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      O que a pessoa precisa escrever para acionar?
                    </h3>
                  </div>

                  {/* Alternador: Resposta Única vs Enquete MúltiplaEscolha (A/B/C) */}
                  <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingRule({ ...editingRule, isInteractivePoll: false })
                      }
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        !editingRule.isInteractivePoll
                          ? 'bg-emerald-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      💬 Resposta Única
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const defaultBranches: StoryPollBranch[] =
                          editingRule.pollBranches && editingRule.pollBranches.length > 0
                            ? editingRule.pollBranches
                            : [
                                {
                                  id: 'opcao-a',
                                  label: 'Opção A',
                                  keywords: ['a', 'letra a', 'opcao a'],
                                  replyText: editingRule.replyText,
                                  buttonTitle: editingRule.buttonTitle,
                                  linkUrl: editingRule.linkUrl,
                                },
                                {
                                  id: 'opcao-b',
                                  label: 'Opção B',
                                  keywords: ['b', 'letra b', 'opcao b'],
                                  replyText: editingRule.replyText,
                                  buttonTitle: editingRule.buttonTitle,
                                  linkUrl: editingRule.linkUrl,
                                },
                              ];
                        setEditingRule({
                          ...editingRule,
                          isInteractivePoll: true,
                          matchMode: 'exact',
                          pollBranches: defaultBranches,
                        });
                      }}
                      className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        editingRule.isInteractivePoll
                          ? 'bg-amber-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      📊 Enquete Múltipla (A, B, C...)
                    </button>
                  </div>
                </div>

                {/* Tipo de Correspondência (Match Mode) */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  {[
                    {
                      mode: 'whole_word' as KeywordMatchMode,
                      title: 'Palavra Inteira',
                      desc: 'Recomendado (ex: "quero rotina" aciona "rotina")',
                    },
                    {
                      mode: 'contains' as KeywordMatchMode,
                      title: 'Contém Parte',
                      desc: 'Aciona mesmo se for parte de outra palavra',
                    },
                    {
                      mode: 'exact' as KeywordMatchMode,
                      title: 'Mensagem Exata',
                      desc: 'A pessoa digitou apenas a palavra/letra exata',
                    },
                    {
                      mode: 'any' as KeywordMatchMode,
                      title: 'Qualquer Comentário',
                      desc: 'Dispara para todo mundo que interagir',
                    },
                  ].map((m) => {
                    const isSel = (editingRule.matchMode || 'whole_word') === m.mode;
                    return (
                      <button
                        key={m.mode}
                        type="button"
                        onClick={() =>
                          setEditingRule({
                            ...editingRule,
                            matchMode: m.mode,
                            exactMessageMatch: m.mode === 'exact',
                            wholeWordMatch: m.mode === 'whole_word',
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          isSel
                            ? 'bg-amber-500/15 border-amber-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <p className="text-xs font-bold">{m.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
                          {m.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Se NÃO for Enquete Múltipla e NÃO for "Qualquer Comentário": exibe editor de palavras-chave */}
                {!editingRule.isInteractivePoll && editingRule.matchMode !== 'any' && (
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-slate-300 uppercase">
                      Palavras-Chave Ativadoras (separe por vírgula ou Enter):
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={tempKeyword}
                        onChange={(e) => setTempKeyword(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())
                        }
                        placeholder="Ex: rotina, quadro, eu quero, guia"
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleAddKeyword}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
                      >
                        + Adicionar
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                      {editingRule.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/30"
                        >
                          #{kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(kw)}
                            className="text-purple-400 hover:text-white ml-1 font-bold"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Palavras Negativas / Excluídas (ChatbotX ExcludeKeywordsField) */}
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase">
                    🚫 Palavras Negativas / Excluídas (Opcional — ChatbotX Filter):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempExcludeKeyword}
                      onChange={(e) => setTempExcludeKeyword(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), handleAddExcludeKeyword())
                      }
                      placeholder="Se a mensagem tiver estas palavras, NÃO dispara (ex: reclamar, boleto)"
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddExcludeKeyword}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs border border-slate-700"
                    >
                      + Excluir Palavra
                    </button>
                  </div>
                  {(editingRule.excludeKeywords?.length || 0) > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {editingRule.excludeKeywords?.map((kw, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-300 border border-red-500/30"
                        >
                          🚫 {kw}
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludeKeyword(kw)}
                            className="hover:text-white ml-1"
                          >
                            ✕
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* PASSO 3: RESPOSTA PÚBLICA NOS COMENTÁRIOS DO POST (OPENREPLY PUBLIC REPLY VARIATIONS) */}
              {editingRule.triggerChannels?.includes('comment') && (
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-400">
                        Passo 3 • Resposta Pública embaixo do Comentário
                      </span>
                      <h3 className="text-sm font-bold text-white mt-0.5">
                        Responder o comentário no Post antes de chamar no Direct
                      </h3>
                    </div>
                    <input
                      type="checkbox"
                      checked={editingRule.publicReplyEnabled !== false}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          publicReplyEnabled: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-700 bg-slate-950 text-emerald-500"
                    />
                  </div>

                  {editingRule.publicReplyEnabled !== false && (
                    <div className="space-y-2.5">
                      <p className="text-[11px] text-slate-400">
                        O sistema sorteia automaticamente uma das variações abaixo (e adiciona o{' '}
                        <code>@username</code> da pessoa) para gerar prova social e nunca parecer robótico:
                      </p>
                      {(editingRule.publicReplyVariations || DEFAULT_PUBLIC_REPLY_VARIATIONS).map(
                        (variation, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={variation}
                              onChange={(e) => {
                                const current = [
                                  ...(editingRule.publicReplyVariations ||
                                    DEFAULT_PUBLIC_REPLY_VARIATIONS),
                                ];
                                current[idx] = e.target.value;
                                setEditingRule({
                                  ...editingRule,
                                  publicReplyVariations: current,
                                });
                              }}
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            />
                            {(editingRule.publicReplyVariations?.length || 0) > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const current = (
                                    editingRule.publicReplyVariations ||
                                    DEFAULT_PUBLIC_REPLY_VARIATIONS
                                  ).filter((_, i) => i !== idx);
                                  setEditingRule({
                                    ...editingRule,
                                    publicReplyVariations: current,
                                  });
                                }}
                                className="px-2.5 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-400 text-xs"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          setEditingRule({
                            ...editingRule,
                            publicReplyVariations: [
                              ...(editingRule.publicReplyVariations ||
                                DEFAULT_PUBLIC_REPLY_VARIATIONS),
                              'Te enviei agora mesmo no seu Direct! 💙 Confira lá!',
                            ],
                          })
                        }
                        className="text-xs font-bold text-sky-400 hover:underline"
                      >
                        + Adicionar outra variação de resposta pública
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PASSO 4: RECURSOS DE CONVERSÃO & RETENÇÃO — 100% VISÍVEIS E EDITÁVEIS! */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-5">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                    Passo 4 • Etapas de Conversão & Retenção no Direct
                  </span>
                  <h3 className="text-sm font-bold text-white mt-0.5">
                    Fluxo de 2 Etapas e Trava de Seguidor (Textos e Botões 100% Editáveis)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Você vê e controla cada palavra e cada botão enviados antes do conteúdo principal. Veja o resultado ao vivo no iPhone ao lado!
                  </p>
                </div>

                {/* 4.1: FLUXO DE 2 ETAPAS (OPENING DM) — SEM FICAR PRESO EM "LIBERAR GUIA" */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-purple-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        ⚡ Etapa 1 (Opcional): Mensagem de Abertura / 2 Etapas (para Comentários)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Quando alguém comenta no post, envia primeiro este convite com botão. Quando a pessoa toca no botão, abre a janela de 24h da Meta e joga seus Stories para o 1º lugar!
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(editingRule.twoStepCommentOptIn)}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          twoStepCommentOptIn: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-purple-500 shrink-0"
                    />
                  </div>

                  {editingRule.twoStepCommentOptIn && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      {/* Templates rápidos de 1 clique (Material, Tutorial, Guia, Aula, Link) */}
                      <div>
                        <span className="block text-[10px] font-bold text-purple-300 uppercase mb-1.5">
                           Escolha um modelo rápido (ou digite livremente abaixo):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {TWO_STEP_TEMPLATES.map((tpl) => (
                            <button
                              key={tpl.id}
                              type="button"
                              onClick={() =>
                                setEditingRule({
                                  ...editingRule,
                                  twoStepPromptText: tpl.promptText,
                                  twoStepButtonTitle: tpl.buttonTitle,
                                })
                              }
                              className="px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-200 text-[11px] font-bold transition-all"
                            >
                              {tpl.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Mensagem do Passo 1 (use <code>{'{nome}'}</code> para personalizar com o 1º nome):
                        </label>
                        <textarea
                          rows={3}
                          value={editingRule.twoStepPromptText || DEFAULT_TWO_STEP_PROMPT_TEXT}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              twoStepPromptText: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          Texto do Botão de Desbloqueio (máx 20 caracteres — ex: &ldquo;🎬 Ver Tutorial&rdquo;, &ldquo;🎁 Liberar Material&rdquo;):
                        </label>
                        <input
                          type="text"
                          maxLength={20}
                          value={editingRule.twoStepButtonTitle || ''}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              twoStepButtonTitle: e.target.value,
                            })
                          }
                          placeholder="Ex: 🎁 Liberar Material"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-purple-300 font-bold focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 4.2: TRAVA DE SEGUIDOR (FOLLOW-GATE) — 100% VISÍVEL E EDITÁVEL */}
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-pink-500/30 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
                        🔒 Etapa de Retenção: Trava de Seguidor (Follow-Gate do ChatbotX + OpenReply)
                      </span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Verifica na API oficial da Meta se a pessoa já segue o <code>@kit.autismo</code>. Se ainda não seguir, envia a mensagem abaixo pedindo para seguir antes de liberar o link!
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(editingRule.requireFollow)}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          requireFollow: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-pink-500 shrink-0"
                    />
                  </div>

                  {editingRule.requireFollow && (
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          1. Mensagem enviada quando a pessoa AINDA NÃO SEGUE o @kit.autismo:
                        </label>
                        <textarea
                          rows={3}
                          value={editingRule.followGateText || DEFAULT_FOLLOW_GATE_TEXT}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              followGateText: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          2. Texto do Botão de Confirmação (máx 20 caracteres):
                        </label>
                        <input
                          type="text"
                          maxLength={20}
                          value={editingRule.followGateButtonTitle || ''}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              followGateButtonTitle: e.target.value,
                            })
                          }
                          placeholder="Ex: ✅ Já segui! Liberar"
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-pink-300 font-bold focus:outline-none focus:border-pink-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">
                          3. Mensagem de Re-verificação (caso ela clique em &ldquo;Já segui&rdquo; sem ter seguido ainda):
                        </label>
                        <textarea
                          rows={3}
                          value={
                            editingRule.followGateRetryText || DEFAULT_FOLLOW_GATE_RETRY_TEXT
                          }
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              followGateRetryText: e.target.value,
                            })
                          }
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PASSO 5: ENTREGA PRINCIPAL DO CONTEÚDO (OU OPÇÕES A/B/C DA ENQUETE) */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">
                      Passo 5 • Mensagem Final de Entrega & Links Clicáveis
                    </span>
                    <h3 className="text-sm font-bold text-white mt-0.5">
                      {editingRule.isInteractivePoll
                        ? 'Configure cada Opção da Enquete (A, B, C...) em um único fluxo'
                        : 'Mensagem Principal no Direct + Até 3 Botões Clicáveis'}
                    </h3>
                  </div>
                </div>

                {editingRule.isInteractivePoll && Array.isArray(editingRule.pollBranches) ? (
                  <div className="space-y-4">
                    {editingRule.pollBranches.map((branch, bIdx) => (
                      <div
                        key={branch.id}
                        onClick={() => setActivePreviewBranchIdx(bIdx)}
                        className={`p-4 rounded-2xl border transition-all space-y-3 cursor-pointer ${
                          activePreviewBranchIdx === bIdx
                            ? 'bg-slate-950 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={branch.label}
                            onChange={(e) =>
                              updatePollBranch(bIdx, { label: e.target.value })
                            }
                            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-xs font-bold text-amber-300"
                          />
                          {editingRule.pollBranches!.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removePollBranch(bIdx);
                              }}
                              className="text-xs text-slate-400 hover:text-red-400"
                            >
                              🗑️ Remover Opção
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Gatilhos desta opção (separados por vírgula):
                          </label>
                          <input
                            type="text"
                            value={branch.keywords.join(', ')}
                            onChange={(e) =>
                              updatePollBranch(bIdx, {
                                keywords: e.target.value
                                  .split(',')
                                  .map((k) => k.trim().toLowerCase())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="Ex: a, letra a, opcao a"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                            Mensagem de Resposta para {branch.label}:
                          </label>
                          <textarea
                            rows={3}
                            value={branch.replyText}
                            onChange={(e) =>
                              updatePollBranch(bIdx, { replyText: e.target.value })
                            }
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] uppercase text-slate-400 mb-1">
                              Título do Botão (máx 20 chars):
                            </label>
                            <input
                              type="text"
                              maxLength={20}
                              value={branch.buttonTitle || ''}
                              onChange={(e) =>
                                updatePollBranch(bIdx, { buttonTitle: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase text-slate-400 mb-1">
                              Link de Destino (URL):
                            </label>
                            <input
                              type="url"
                              value={branch.linkUrl || ''}
                              onChange={(e) =>
                                updatePollBranch(bIdx, { linkUrl: e.target.value })
                              }
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={addPollBranch}
                      className="w-full py-2.5 rounded-xl border border-dashed border-amber-500/40 text-amber-300 hover:bg-amber-500/10 text-xs font-bold transition-all"
                    >
                      + Adicionar Nova Opção na Enquete (Ex: Opção D)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                        Texto Principal da Entrega (Personaliza automaticamente &ldquo;Olá!&rdquo; ou <code>{'{nome}'}</code> com o 1º nome):
                      </label>
                      <textarea
                        rows={4}
                        value={editingRule.replyText}
                        onChange={(e) =>
                          setEditingRule({ ...editingRule, replyText: e.target.value })
                        }
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 leading-relaxed"
                      />
                    </div>

                    {/* Até 3 Botões Nativos */}
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                      <p className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        🔘 Botões Clicáveis do Card (Até 3 Botões Nativos)
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            Botão 1 — Título (máx 20 chars):
                          </label>
                          <input
                            type="text"
                            maxLength={20}
                            value={editingRule.buttonTitle || ''}
                            onChange={(e) =>
                              setEditingRule({
                                ...editingRule,
                                buttonTitle: e.target.value,
                              })
                            }
                            placeholder="Ex: Acessar Guia Rotina"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            Botão 1 — Link (URL):
                          </label>
                          <input
                            type="url"
                            value={editingRule.linkUrl || ''}
                            onChange={(e) =>
                              setEditingRule({ ...editingRule, linkUrl: e.target.value })
                            }
                            placeholder="https://kitautismo.com/rotina"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            Botão 2 (Opcional) — Título:
                          </label>
                          <input
                            type="text"
                            maxLength={20}
                            value={editingRule.secondaryButtonTitle || ''}
                            onChange={(e) =>
                              setEditingRule({
                                ...editingRule,
                                secondaryButtonTitle: e.target.value,
                              })
                            }
                            placeholder="Ex: Ver Kit Completo"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            Botão 2 (Opcional) — Link:
                          </label>
                          <input
                            type="url"
                            value={editingRule.secondaryLinkUrl || ''}
                            onChange={(e) =>
                              setEditingRule({
                                ...editingRule,
                                secondaryLinkUrl: e.target.value,
                              })
                            }
                            placeholder="https://kitautismo.com"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-teal-400 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            Botão 3 (Opcional) — Título:
                          </label>
                          <input
                            type="text"
                            maxLength={20}
                            value={editingRule.thirdButtonTitle || ''}
                            onChange={(e) =>
                              setEditingRule({
                                ...editingRule,
                                thirdButtonTitle: e.target.value,
                              })
                            }
                            placeholder="Ex: Falar com Equipe"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase text-slate-400 mb-1">
                            Botão 3 (Opcional) — Link:
                          </label>
                          <input
                            type="url"
                            value={editingRule.thirdLinkUrl || ''}
                            onChange={(e) =>
                              setEditingRule({
                                ...editingRule,
                                thirdLinkUrl: e.target.value,
                              })
                            }
                            placeholder="https://kitautismo.com/suporte"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-purple-400 font-mono"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Mensagem complementar de Follow-up (OpenReply followUpEnabled) */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-sky-300">
                        💬 Mensagem Complementar de Acolhimento / Follow-up (Opcional)
                      </span>
                      <p className="text-[11px] text-slate-400">
                        Envia um segundo balão de mensagem logo após entregar o link principal.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(editingRule.followUpEnabled)}
                      onChange={(e) =>
                        setEditingRule({
                          ...editingRule,
                          followUpEnabled: e.target.checked,
                        })
                      }
                      className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-sky-500"
                    />
                  </div>
                  {editingRule.followUpEnabled && (
                    <textarea
                      rows={2}
                      value={editingRule.followUpText || ''}
                      onChange={(e) =>
                        setEditingRule({ ...editingRule, followUpText: e.target.value })
                      }
                      placeholder="Ex: Qualquer dúvida sobre como aplicar com seu pequeno, pode me chamar aqui mesmo no Direct! 💙"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white"
                    />
                  )}
                </div>

                {/* Botões Finais de Ação */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingRule(null)}
                    className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveBuilder}
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                  >
                    {saving ? 'Salvando...' : '✓ Salvar e Ativar Fluxo'}
                  </button>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA (5 COLUNAS): PREVIEW EM TEMPO REAL ESTILO IPHONE 17 PRO (OPENREPLY) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 flex flex-col items-center">
              <div className="mb-2 text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  📱 Preview Interativo em Tempo Real
                </span>
                <p className="text-[11px] text-slate-400">
                  Veja exatamente cada mensagem e botão que o seguidor vai receber:
                </p>
              </div>
              <FlowPreviewPhone
                rule={editingRule}
                selectedMediaThumb={
                  selectedPreviewPost?.thumbnail_url || selectedPreviewPost?.media_url || null
                }
                selectedMediaCaption={selectedPreviewPost?.caption || null}
                activeBranchIndex={activePreviewBranchIdx}
                onSelectBranchIndex={setActivePreviewBranchIdx}
              />
            </div>
          </div>
        </main>
      ) : (
        <>
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
                  Canais Isolados
                </p>
                <p className="text-2xl font-black text-white mt-1">100% Independentes</p>
                <p className="text-[11px] text-emerald-400 mt-0.5">
                  Stories, Comentários e DM sem conflito
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
                🎯
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Follow-Gate & 2 Etapas
                </p>
                <p className="text-2xl font-black text-white mt-1">
                  {rules.filter((r) => r.active && r.requireFollow).length} fluxos ativos
                </p>
                <p className="text-[11px] text-pink-400 mt-0.5">
                  Textos e botões 100% customizáveis
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 text-lg">
                🔒
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Catálogo de Publicações
                </p>
                <p className="text-2xl font-black text-emerald-400 mt-1">250+ Posts/Reels</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Paginação completa + Stories 24h
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-lg">
                📚
              </div>
            </div>
          </section>

          {/* Tabs Navigation */}
          <div className="px-6 max-w-7xl mx-auto w-full border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('flows')}
              className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'flows'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📋</span> Fluxos de Automação ({rules.length})
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'simulator'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📱</span> Simulador Multi-Canal (Sandbox)
            </button>

            <button
              onClick={() => setActiveTab('stories')}
              className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'stories'
                  ? 'border-emerald-500 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📸</span> Publicador de Stories (9:16)
            </button>

            <button
              onClick={() => setActiveTab('webhook')}
              className={`pb-3 pt-1 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
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
                {/* TAB 1: LISTA DE FLUXOS COM FILTRO POR CANAL */}
                {activeTab === 'flows' && (
                  <div className="space-y-5">
                    {/* Barra de Filtro por Canal de Entrada + Botões de Criação Rápida */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 border border-slate-800 p-3 rounded-2xl">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {[
                          { id: 'all' as CategoryFilter, label: `Todos (${rules.length})` },
                          {
                            id: 'comment' as CategoryFilter,
                            label: '💬 Comentários em Posts/Reels',
                          },
                          {
                            id: 'story_reply' as CategoryFilter,
                            label: '📸 Respostas de Stories / Enquetes',
                          },
                          {
                            id: 'dm' as CategoryFilter,
                            label: '✉️ Mensagens no Direct (DM)',
                          },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setCategoryFilter(cat.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                              categoryFilter === cat.id
                                ? 'bg-emerald-500 text-slate-950 shadow'
                                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCreateNewRule('story_reply')}
                          className="px-3 py-1.5 rounded-xl bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-xs font-bold"
                        >
                          + Fluxo Só para Story
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCreateNewRule('comment')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold"
                        >
                          + Fluxo Só para Comentário
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredRules.map((rule) => {
                        const ruleCount = metrics.byRule?.[rule.id] || 0;
                        const channels = rule.triggerChannels || [
                          rule.triggerType || 'comment',
                        ];
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
                                    <h3 className="text-sm font-bold text-white">
                                      {rule.name}
                                    </h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                      {ruleCount} envios
                                    </span>
                                  </div>

                                  {/* Selos de Canais Isolados & Escopo */}
                                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                    {channels.includes('comment') && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                        💬 Comentário{' '}
                                        {rule.postScope === 'specific' &&
                                        targetedPostsCount > 0
                                          ? `(${targetedPostsCount} post${targetedPostsCount > 1 ? 's' : ''})`
                                          : rule.postScope === 'next'
                                            ? '(Próximo Post)'
                                            : '(Qualquer Post)'}
                                      </span>
                                    )}
                                    {channels.includes('story_reply') && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-pink-500/15 text-pink-300 border border-pink-500/30">
                                        📸 Somente Stories{' '}
                                        {rule.storyScope === 'specific'
                                          ? '(Story Específico)'
                                          : ''}
                                      </span>
                                    )}
                                    {channels.includes('dm') && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                        ✉️ Direct (DM)
                                      </span>
                                    )}
                                    {rule.isInteractivePoll && (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                        📊 Enquete Múltipla ({rule.pollBranches?.length || 3}{' '}
                                        opções)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={rule.active}
                                    onChange={() => handleToggleRule(rule.id)}
                                    className="sr-only peer"
                                  />
                                  <div className="w-9 h-5 bg-slate-800 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                              </div>

                              {/* Se for Enquete Interativa (A/B/C), mostra resumo das opções num único card limpo */}
                              {rule.isInteractivePoll &&
                              Array.isArray(rule.pollBranches) &&
                              rule.pollBranches.length > 0 ? (
                                <div className="space-y-2 mb-3">
                                  <p className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider">
                                    Opções da Enquete (Agrupadas em um único fluxo):
                                  </p>
                                  {rule.pollBranches.map((b) => (
                                    <div
                                      key={b.id}
                                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-amber-300">
                                          {b.label}
                                        </span>
                                        <span className="font-mono text-[10px] text-purple-300">
                                          Gatilhos: {b.keywords.join(', ')}
                                        </span>
                                      </div>
                                      <p className="text-slate-300 line-clamp-2 text-[11px]">
                                        {b.replyText}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <>
                                  {/* Palavras-chave */}
                                  <div className="mb-3">
                                    <p className="text-[11px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                                      Gatilhos ({rule.matchMode === 'any' ? 'Qualquer Comentário' : rule.matchMode === 'exact' ? 'Match Exato' : 'Palavra Inteira'}):
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {rule.matchMode === 'any' ? (
                                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                          ✨ Dispara para qualquer comentário/resposta
                                        </span>
                                      ) : (
                                        rule.keywords.map((kw, idx) => (
                                          <span
                                            key={idx}
                                            className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30"
                                          >
                                            #{kw}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>

                                  {/* Balão de Resposta */}
                                  <div className="mb-3">
                                    <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 whitespace-pre-line line-clamp-3 leading-relaxed">
                                      {rule.replyText}
                                    </div>
                                  </div>
                                </>
                              )}

                              {/* Resumo Transparente da Etapa de 2 Passos e Follow-Gate */}
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {rule.twoStepCommentOptIn && (
                                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
                                    ⚡ 2 Etapas: Botão &ldquo;{rule.twoStepButtonTitle || '🎁 Liberar Material'}&rdquo;
                                  </span>
                                )}
                                {rule.requireFollow && (
                                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-pink-500/15 text-pink-300 border border-pink-500/30">
                                    🔒 Trava de Seguidor: &ldquo;{rule.followGateButtonTitle || '✅ Já segui! Liberar'}&rdquo;
                                  </span>
                                )}
                                {rule.expiresAt && (
                                  <span className="text-[10px] font-semibold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                    ⏳ Expira em {new Date(rule.expiresAt).toLocaleDateString('pt-BR')}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ações */}
                            <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-800/80">
                              <button
                                onClick={() => {
                                  fetchInstagramMedia();
                                  setActivePreviewBranchIdx(0);
                                  setEditingRule(rule);
                                  setIsNewRule(false);
                                  setTempKeyword('');
                                  setTempExcludeKeyword('');
                                }}
                                className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-colors"
                              >
                                Abrir no Studio Builder ⚙️
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

                {/* TAB 2: SIMULADOR MULTI-CANAL (SANDBOX) */}
                {activeTab === 'simulator' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-5 flex justify-center">
                      <div className="w-[350px] h-[650px] bg-slate-950 rounded-[44px] border-[6px] border-slate-800 shadow-2xl flex flex-col overflow-hidden">
                        <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-pink-500 to-emerald-400 p-[2px]">
                              <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-black text-white">
                                KA
                              </div>
                            </div>
                            <div>
                              <span className="text-xs font-bold text-white">kit.autismo ✓</span>
                              <p className="text-[10px] text-emerald-400">
                                {isBotTyping ? 'Digitando...' : 'Simulador Multi-Canal'}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-[#0a0f1d] text-xs">
                          {chatMessages.map((msg, i) => (
                            <div
                              key={i}
                              className={`flex flex-col ${
                                msg.from === 'user' ? 'items-end' : 'items-start'
                              }`}
                            >
                              {msg.badge && (
                                <span className="text-[9px] text-slate-400 mb-0.5 px-1">
                                  {msg.badge}
                                </span>
                              )}
                              <div
                                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl whitespace-pre-line text-xs leading-relaxed ${
                                  msg.from === 'user'
                                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-xs'
                                    : 'bg-slate-800 text-slate-100 rounded-bl-xs border border-slate-700/60'
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
                                          className="w-full py-1.5 px-3 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-200 font-bold text-[11px] text-center block"
                                        >
                                          {b.title}
                                        </button>
                                      ) : (
                                        <a
                                          key={bIdx}
                                          href={b.url}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="w-full py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-[11px] text-center block"
                                        >
                                          {b.title} ↗
                                        </a>
                                      )
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="bg-slate-900 p-2.5 border-t border-slate-800 flex items-center gap-2">
                          <input
                            type="text"
                            value={simulatorInput}
                            onChange={(e) => setSimulatorInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendSimulator()}
                            placeholder="Escreva uma mensagem..."
                            className="flex-1 bg-slate-950 border border-slate-800 rounded-full px-3.5 py-1.5 text-xs text-white focus:outline-none"
                          />
                          <button
                            onClick={() => handleSendSimulator()}
                            className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold"
                          >
                            ↑
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
                      <div>
                        <h3 className="text-base font-bold text-white mb-1">
                          🧪 Simulador de Isolamento de Canais (Comentário vs Story vs DM)
                        </h3>
                        <p className="text-xs text-slate-400">
                          Escolha abaixo qual canal você quer simular. Por exemplo: teste enviar{' '}
                          <strong>&ldquo;A&rdquo;</strong> como <em>Resposta ao Story</em> (aciona a Enquete A/B/C) vs. como{' '}
                          <em>Comentário em Post</em> (não dispara a enquete do Story!).
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { ch: 'story_reply' as TriggerChannel, label: '📸 Resposta de Story' },
                          { ch: 'comment' as TriggerChannel, label: '💬 Comentário em Post' },
                          { ch: 'dm' as TriggerChannel, label: '✉️ Mensagem na DM' },
                        ].map((c) => (
                          <button
                            key={c.ch}
                            type="button"
                            onClick={() => setSimulateChannel(c.ch)}
                            className={`p-2.5 rounded-xl border text-xs font-bold ${
                              simulateChannel === c.ch
                                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>

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
                            />
                            <span>🔒 Simular quem NÃO segue o perfil</span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {['A', 'B', 'C', 'ROTINA', 'EU QUERO', 'DIREITOS', 'ALIMENTACAO', 'OI'].map(
                          (promptText, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSendSimulator(promptText)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700"
                            >
                              &ldquo;{promptText}&rdquo;
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: PUBLICADOR DE STORIES */}
                {activeTab === 'stories' && (
                  <div className="max-w-2xl mx-auto bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                    <h3 className="text-sm font-bold text-white">
                      📸 Publicador Oficial de Stories (9:16)
                    </h3>
                    <input
                      type="url"
                      value={storyImageUrl}
                      onChange={(e) => setStoryImageUrl(e.target.value)}
                      placeholder="https://seu-servidor.com/story.png"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono"
                    />
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
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-emerald-400 text-white font-black text-xs uppercase"
                    >
                      {storyPublishing ? 'Publicando...' : '🚀 Publicar Story Agora'}
                    </button>
                  </div>
                )}

                {/* TAB 4: WEBHOOK & TELEMETRIA */}
                {activeTab === 'webhook' && (
                  <div className="space-y-6 max-w-3xl mx-auto">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
                      <h3 className="text-sm font-bold text-white">
                        🔌 Endpoints de Integração com a Meta
                      </h3>
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
                          className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-bold"
                        >
                          {copyFeedback === 'url' ? '✓ Copiado!' : 'Copiar'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </main>
        </>
      )}
    </div>
  );
}
