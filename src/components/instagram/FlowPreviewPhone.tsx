'use client';

import React, { useState } from 'react';
import { AutomationRule } from '@/lib/instagram/types';
import {
  DEFAULT_FOLLOW_GATE_RETRY_TEXT,
  DEFAULT_FOLLOW_GATE_TEXT,
  DEFAULT_PUBLIC_REPLY_VARIATIONS,
  DEFAULT_TWO_STEP_PROMPT_TEXT,
} from '@/lib/instagram/rules';

export type PhonePreviewTab = 'entry' | 'comments' | 'dm_flow' | 'retry_gate';

interface FlowPreviewPhoneProps {
  rule: AutomationRule;
  selectedMediaThumb?: string | null;
  selectedMediaCaption?: string | null;
  activeBranchIndex?: number;
  onSelectBranchIndex?: (idx: number) => void;
}

export default function FlowPreviewPhone({
  rule,
  selectedMediaThumb,
  selectedMediaCaption,
  activeBranchIndex = 0,
  onSelectBranchIndex,
}: FlowPreviewPhoneProps) {
  const [tab, setTab] = useState<PhonePreviewTab>('dm_flow');

  const isCommentTrigger = rule.triggerChannels?.includes('comment');
  const isStoryTrigger = rule.triggerChannels?.includes('story_reply');

  const activeBranch =
    rule.isInteractivePoll && rule.pollBranches && rule.pollBranches.length > 0
      ? rule.pollBranches[Math.min(activeBranchIndex, rule.pollBranches.length - 1)]
      : null;

  const sampleKeyword =
    activeBranch?.keywords?.[0] ||
    (rule.matchMode === 'any' ? 'Amei esse post! 😍' : rule.keywords?.[0] || 'quero');

  const resolvedReplyText = (activeBranch?.replyText || rule.replyText || '')
    .replace(/\{nome\}/gi, ', Ana')
    .replace(/\{username\}/gi, '@ana.familia')
    .replace(/^Olá!/i, 'Olá, Ana!');

  const resolvedBtn1Title =
    activeBranch?.buttonTitle || rule.buttonTitle || 'Acessar Material';
  const resolvedBtn1Url = activeBranch?.linkUrl || rule.linkUrl || '';
  const resolvedBtn2Title =
    activeBranch?.secondaryButtonTitle || rule.secondaryButtonTitle || '';
  const resolvedBtn2Url =
    activeBranch?.secondaryLinkUrl || rule.secondaryLinkUrl || '';

  const resolvedTwoStepText = (
    rule.twoStepPromptText || DEFAULT_TWO_STEP_PROMPT_TEXT
  ).replace(/\{nome\}/gi, ', Ana');
  const resolvedTwoStepBtn = rule.twoStepButtonTitle || '🎁 Liberar Material';

  const resolvedFollowGateText = (
    rule.followGateText || DEFAULT_FOLLOW_GATE_TEXT
  ).replace(/\{nome\}/gi, ', Ana');
  const resolvedFollowGateBtn =
    rule.followGateButtonTitle || '✅ Já segui! Liberar';
  const resolvedFollowRetryText = (
    rule.followGateRetryText || DEFAULT_FOLLOW_GATE_RETRY_TEXT
  ).replace(/\{nome\}/gi, ', Ana');

  const publicReplySample =
    rule.publicReplyVariations?.find((v) => v.trim().length > 0) ||
    DEFAULT_PUBLIC_REPLY_VARIATIONS[0];

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {/* Seletor de Abas do Preview (Estilo OpenReply CampaignPreview) */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl w-full max-w-[340px]">
        <button
          type="button"
          onClick={() => setTab('dm_flow')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all ${
            tab === 'dm_flow'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          ✉️ Direct (DM)
        </button>
        {isCommentTrigger && (
          <button
            type="button"
            onClick={() => setTab('comments')}
            className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all ${
              tab === 'comments'
                ? 'bg-emerald-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💬 Comentário
          </button>
        )}
        <button
          type="button"
          onClick={() => setTab('entry')}
          className={`flex-1 py-1.5 px-2.5 rounded-xl text-[11px] font-bold transition-all ${
            tab === 'entry'
              ? 'bg-emerald-500 text-slate-950 shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {isStoryTrigger && !isCommentTrigger ? '📸 Story' : '📌 Post'}
        </button>
        {rule.requireFollow && (
          <button
            type="button"
            onClick={() => setTab('retry_gate')}
            className={`flex-1 py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
              tab === 'retry_gate'
                ? 'bg-pink-500 text-white shadow'
                : 'text-pink-300/80 hover:text-pink-200'
            }`}
            title="Ver mensagem caso a pessoa clique em 'Já segui' sem ter seguido ainda"
          >
            🔒 Re-teste
          </button>
        )}
      </div>

      {/* Se for Enquete Interativa (A/B/C), permite alternar a opção no Preview */}
      {rule.isInteractivePoll && rule.pollBranches && rule.pollBranches.length > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 w-full max-w-[340px]">
          <span className="text-[10px] text-slate-400 font-semibold uppercase">
            Simular opção:
          </span>
          {rule.pollBranches.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBranchIndex && onSelectBranchIndex(idx)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                activeBranchIndex === idx
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {b.keywords?.[0]?.toUpperCase() || `#${idx + 1}`}
            </button>
          ))}
        </div>
      )}

      {/* Moldura iPhone 17 Pro */}
      <div className="relative w-[335px] max-w-full">
        <div className="rounded-[2.8rem] bg-gradient-to-br from-slate-600 via-slate-800 to-slate-700 p-[3px] shadow-2xl shadow-black/80">
          <div className="rounded-[2.65rem] bg-black p-[8px]">
            <div className="relative h-[630px] overflow-hidden rounded-[2.2rem] bg-[#090d16] flex flex-col text-white">
              {/* Dynamic Island + Status Bar */}
              <div className="flex items-center justify-between px-6 pt-2.5 pb-1 text-[11px] font-semibold text-white shrink-0">
                <span>12:14</span>
                <div className="h-4 w-20 rounded-full bg-black border border-slate-800/80" />
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span>5G</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* ABA 1: POST OU STORY */}
              {tab === 'entry' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex items-center gap-2 px-3.5 py-2 border-b border-slate-800/80">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-emerald-400 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[9px] font-black">
                        KA
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold leading-tight">kit.autismo</p>
                      <p className="text-[10px] text-slate-400">
                        {isStoryTrigger && !isCommentTrigger
                          ? 'Story Ativo • Responda no Direct'
                          : rule.postScope === 'specific'
                            ? `${rule.targetMediaIds?.length || 0} publicação(ões) selecionada(s)`
                            : rule.postScope === 'next'
                              ? 'Próximo Post ou Reel que for ao ar'
                              : 'Qualquer publicação do Feed / Reels'}
                      </p>
                    </div>
                  </div>

                  <div className="flex-1 bg-slate-900/90 flex items-center justify-center relative overflow-hidden">
                    {selectedMediaThumb ? (
                      <img
                        src={selectedMediaThumb}
                        alt="Preview da publicação"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="p-6 text-center space-y-2">
                        <div className="text-3xl">
                          {isStoryTrigger && !isCommentTrigger ? '📸' : '🎬'}
                        </div>
                        <p className="text-xs font-bold text-slate-200">
                          {isStoryTrigger && !isCommentTrigger
                            ? 'Story Interativo @kit.autismo'
                            : 'Publicação / Reel @kit.autismo'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Quando o seguidor interagir com{' '}
                          <span className="text-emerald-400 font-mono font-bold">
                            &ldquo;{sampleKeyword.toUpperCase()}&rdquo;
                          </span>
                          , este fluxo será acionado imediatamente.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="p-3 bg-slate-950 border-t border-slate-800 text-xs space-y-1">
                    <p className="line-clamp-2 text-slate-300 text-[11px]">
                      <strong className="text-white">kit.autismo</strong>{' '}
                      {selectedMediaCaption ||
                        `Comente "${sampleKeyword.toUpperCase()}" aqui embaixo que eu te envio no Direct agora mesmo! 💙`}
                    </p>
                  </div>
                </div>
              )}

              {/* ABA 2: COMENTÁRIOS DO POST */}
              {tab === 'comments' && (
                <div className="flex-1 flex flex-col bg-[#0b0f19] px-3.5 pt-3">
                  <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-slate-700" />
                  <p className="text-center text-xs font-bold text-white pb-2 border-b border-slate-800">
                    Comentários na Publicação
                  </p>

                  <div className="mt-4 flex gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-[10px] font-bold text-purple-200 shrink-0">
                      AN
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px]">
                        <span className="font-bold text-white">ana.familia</span>{' '}
                        <span className="text-slate-500 text-[10px]">agora</span>
                      </p>
                      <p className="text-xs text-slate-100 mt-0.5">{sampleKeyword}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Responder</p>
                    </div>
                  </div>

                  {rule.publicReplyEnabled !== false ? (
                    <div className="mt-3.5 flex gap-2.5 pl-7">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-pink-500 to-emerald-400 p-[1px] shrink-0">
                        <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[8px] font-black">
                          KA
                        </div>
                      </div>
                      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
                        <p className="text-[11px]">
                          <span className="font-bold text-emerald-400">kit.autismo</span>{' '}
                          <span className="text-slate-500 text-[10px]">autor • agora</span>
                        </p>
                        <p className="text-xs text-slate-200 mt-0.5">
                          @ana.familia {publicReplySample}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 p-2.5 rounded-xl bg-slate-900/50 border border-slate-800/80 text-[11px] text-slate-400 text-center">
                      Resposta pública no comentário desativada (enviará apenas no Direct).
                    </div>
                  )}

                  <div className="mt-auto mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-300 text-center">
                    ⚡ Assim que o comentário entra, a DM é disparada no Direct em &lt; 1s!
                  </div>
                </div>
              )}

              {/* ABA 3: FLUXO COMPLETO NO DIRECT (DM) */}
              {tab === 'dm_flow' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Top Header DM */}
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-800 bg-slate-900/70 shrink-0">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-500 to-emerald-400 p-[1.5px]">
                      <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-[9px] font-black">
                        KA
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-white truncate">
                          kit.autismo
                        </span>
                        <span className="text-[10px] text-sky-400">✓</span>
                      </div>
                      <p className="text-[9px] text-emerald-400">
                        {rule.humanTypingDelay !== false
                          ? 'Visto + Digitando ativo'
                          : 'Resposta imediata'}
                      </p>
                    </div>
                  </div>

                  {/* Mensagens do Fluxo */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-[11px]">
                    {/* Entrada do Usuário (se for Story Reply ou DM) */}
                    {(!isCommentTrigger || isStoryTrigger) && (
                      <div className="flex flex-col items-end">
                        {isStoryTrigger && (
                          <span className="text-[9px] text-pink-300 mb-0.5">
                            Respondeu ao seu Story
                          </span>
                        )}
                        <div className="max-w-[80%] rounded-2xl rounded-br-xs bg-purple-600 px-3 py-1.5 text-white font-medium">
                          {sampleKeyword.toUpperCase()}
                        </div>
                      </div>
                    )}

                    {/* ETAPA 1: FLUXO DE 2 ETAPAS (OPENING DM) */}
                    {rule.twoStepCommentOptIn && isCommentTrigger && (
                      <>
                        <div className="flex items-start gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[8px] font-bold text-emerald-300 shrink-0 mt-1">
                            1º
                          </div>
                          <div className="max-w-[85%] rounded-2xl rounded-bl-xs bg-slate-800/95 border border-purple-500/40 p-2.5 space-y-2">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                              Passo 1 • Convite 2 Etapas
                            </span>
                            <p className="whitespace-pre-line text-slate-100 leading-relaxed">
                              {resolvedTwoStepText}
                            </p>
                            <div className="space-y-1 pt-1">
                              <div className="w-full py-1.5 px-2.5 rounded-lg bg-purple-500/30 border border-purple-400/50 text-white font-bold text-center text-[11px]">
                                {resolvedTwoStepBtn}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="rounded-2xl rounded-br-xs bg-purple-600/80 px-3 py-1 text-[10px] text-white">
                            {resolvedTwoStepBtn}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ETAPA 2: TRAVA DE SEGUIDOR (FOLLOW-GATE) */}
                    {rule.requireFollow && (
                      <>
                        <div className="flex items-start gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-[8px] font-bold text-pink-300 shrink-0 mt-1">
                            🔒
                          </div>
                          <div className="max-w-[85%] rounded-2xl rounded-bl-xs bg-slate-800/95 border border-pink-500/40 p-2.5 space-y-2">
                            <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                              Se ainda NÃO segue @kit.autismo
                            </span>
                            <p className="whitespace-pre-line text-slate-100 leading-relaxed">
                              {resolvedFollowGateText}
                            </p>
                            <div className="space-y-1 pt-1">
                              <div className="w-full py-1.5 px-2.5 rounded-lg bg-pink-500/30 border border-pink-400/50 text-pink-100 font-bold text-center text-[11px]">
                                {resolvedFollowGateBtn}
                              </div>
                              <div className="w-full py-1 px-2.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 font-semibold text-center text-[10px]">
                                📲 Perfil @kit.autismo ↗
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <div className="rounded-2xl rounded-br-xs bg-pink-600/80 px-3 py-1 text-[10px] text-white">
                            {resolvedFollowGateBtn}
                          </div>
                        </div>
                      </>
                    )}

                    {/* ETAPA 3: ENTREGA PRINCIPAL DO MATERIAL / LINK */}
                    <div className="flex items-start gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[8px] font-bold text-emerald-300 shrink-0 mt-1">
                        ✓
                      </div>
                      <div className="max-w-[85%] rounded-2xl rounded-bl-xs bg-slate-800 border border-emerald-500/30 p-2.5 space-y-2 shadow-md">
                        <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          {activeBranch ? activeBranch.label : 'Entrega Principal no Direct'}
                        </span>
                        <p className="whitespace-pre-line text-slate-100 leading-relaxed">
                          {resolvedReplyText || 'Digite a mensagem principal ao lado...'}
                        </p>

                        {(resolvedBtn1Url || resolvedBtn2Url || rule.thirdLinkUrl) && (
                          <div className="space-y-1 pt-1 border-t border-slate-700/70">
                            {resolvedBtn1Url && (
                              <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold text-center text-[11px]">
                                {resolvedBtn1Title} ↗
                              </div>
                            )}
                            {resolvedBtn2Url && (
                              <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-teal-500/30 text-teal-300 font-bold text-center text-[10px]">
                                {resolvedBtn2Title || 'Segundo Link'} ↗
                              </div>
                            )}
                            {rule.thirdLinkUrl && !activeBranch && (
                              <div className="w-full py-1.5 px-2.5 rounded-lg bg-slate-900 border border-purple-500/30 text-purple-300 font-bold text-center text-[10px]">
                                {rule.thirdButtonTitle || 'Terceiro Link'} ↗
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ETAPA 4: MENSAGEM COMPLEMENTAR DE FOLLOW-UP */}
                    {rule.followUpEnabled && rule.followUpText?.trim() && (
                      <div className="flex items-start gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-[8px] font-bold text-sky-300 shrink-0 mt-1">
                          💬
                        </div>
                        <div className="max-w-[85%] rounded-2xl rounded-bl-xs bg-slate-800/90 border border-sky-500/30 p-2.5">
                          <p className="whitespace-pre-line text-slate-200 leading-relaxed">
                            {rule.followUpText.replace(/\{nome\}/gi, ', Ana')}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Bottom Bar */}
                  <div className="px-3 py-2 bg-slate-950 border-t border-slate-800/80 flex items-center gap-2 shrink-0">
                    <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-[10px]">
                      📷
                    </div>
                    <div className="flex-1 rounded-full bg-slate-900 border border-slate-800 px-3 py-1 text-[10px] text-slate-500">
                      Mensagem para @kit.autismo...
                    </div>
                  </div>
                </div>
              )}

              {/* ABA 4: PREVIEW DO RE-TESTE DA TRAVA DE SEGUIDOR */}
              {tab === 'retry_gate' && (
                <div className="flex-1 flex flex-col p-3.5 space-y-3 bg-[#090d16]">
                  <div className="p-2.5 rounded-xl bg-pink-500/10 border border-pink-500/30 text-[11px] text-pink-200">
                    <strong>🔒 Quando a pessoa clica sem ter seguido ainda:</strong>
                    <p className="text-[10px] text-slate-300 mt-0.5">
                      Se na 1ª tentativa a API da Meta detectar que ela ainda não seguiu o{' '}
                      <code>@kit.autismo</code>, enviamos este lembrete gentil:
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-800 border border-pink-500/40 p-3 space-y-2 text-xs">
                    <p className="whitespace-pre-line text-slate-100 leading-relaxed">
                      {resolvedFollowRetryText}
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="w-full py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-700 text-emerald-300 font-bold text-center text-[11px]">
                        📲 Abrir @kit.autismo ↗
                      </div>
                      <div className="w-full py-1.5 px-3 rounded-lg bg-pink-500/30 border border-pink-400/50 text-pink-100 font-bold text-center text-[11px]">
                        {resolvedFollowGateBtn}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
