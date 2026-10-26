'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

export interface ImageCropperModalProps {
  isOpen: boolean;
  imageSrc: string;
  title?: string;
  defaultAspectRatio?: number; // width / height, e.g. 640 / 192 = 3.333
  mode?: 'banner' | 'background' | 'avatar';
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
}

interface AspectOption {
  label: string;
  ratio: number;
  width: number;
  height: number;
}

const BANNER_ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Padrão 10:3 (640×192)', ratio: 10 / 3, width: 1280, height: 384 },
  { label: 'Panorâmico 3:1 (600×200)', ratio: 3 / 1, width: 1200, height: 400 },
  { label: 'Card Alto 16:9 (640×360)', ratio: 16 / 9, width: 1280, height: 720 },
  { label: 'Livre / Original', ratio: 0, width: 1280, height: 384 },
];

const BACKGROUND_ASPECT_OPTIONS: AspectOption[] = [
  { label: 'Vertical 9:16 (720×1280)', ratio: 9 / 16, width: 720, height: 1280 },
  { label: 'Tela Cheia 9:19.5 (720×1560)', ratio: 9 / 19.5, width: 720, height: 1560 },
  { label: 'Retrato 3:4 (720×960)', ratio: 3 / 4, width: 720, height: 960 },
  { label: 'Livre / Original', ratio: 0, width: 720, height: 1280 },
];

export default function ImageCropperModal({
  isOpen,
  imageSrc,
  title = 'Ajustar e Recortar Imagem',
  defaultAspectRatio = 10 / 3,
  mode = 'banner',
  onClose,
  onCropComplete,
}: ImageCropperModalProps) {
  const currentPresets = mode === 'background' ? BACKGROUND_ASPECT_OPTIONS : BANNER_ASPECT_OPTIONS;
  const [selectedAspect, setSelectedAspect] = useState<AspectOption>(currentPresets[0]);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Determina dimensões da caixa de corte dentro do container visual
  const [cropBox, setCropBox] = useState<{ width: number; height: number }>({
    width: 480,
    height: 144,
  });

  // Atualiza aspecto padrão se especificado
  useEffect(() => {
    const presets = mode === 'background' ? BACKGROUND_ASPECT_OPTIONS : BANNER_ASPECT_OPTIONS;
    if (defaultAspectRatio) {
      const match = presets.find(
        (opt) => Math.abs(opt.ratio - defaultAspectRatio) < 0.05
      );
      setSelectedAspect(match || presets[0]);
    } else {
      setSelectedAspect(presets[0]);
    }
  }, [defaultAspectRatio, mode]);

  // Carrega imagem e extrai dimensões naturais
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    setImageLoaded(false);
    setZoom(1);
    setRotation(0);
    setOffset({ x: 0, y: 0 });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
      setImageLoaded(true);
    };
    img.onerror = () => {
      alert('Falha ao carregar a imagem para recorte.');
      onClose();
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc, onClose]);

  // Recalcula tamanho do crop box conforme aspecto e largura disponível
  const updateCropBoxSize = useCallback(() => {
    if (!containerRef.current) return;
    const containerW = containerRef.current.clientWidth - 32;
    const containerH = 340;
    const ratio =
      selectedAspect.ratio > 0
        ? selectedAspect.ratio
        : naturalSize.width > 0 && naturalSize.height > 0
        ? naturalSize.width / naturalSize.height
        : mode === 'background'
        ? 9 / 16
        : 10 / 3;

    let boxW = 0;
    let boxH = 0;

    if (ratio >= 1) {
      boxW = Math.min(containerW, 540);
      boxH = Math.min(boxW / ratio, 260);
    } else {
      // Retrato / Vertical
      boxH = Math.min(containerH - 40, 280);
      boxW = Math.min(boxH * ratio, containerW);
      boxH = boxW / ratio;
    }
    setCropBox({ width: Math.round(boxW), height: Math.round(boxH) });
  }, [selectedAspect, naturalSize, mode]);

  useEffect(() => {
    if (isOpen && imageLoaded) {
      updateCropBoxSize();
      window.addEventListener('resize', updateCropBoxSize);
      return () => window.removeEventListener('resize', updateCropBoxSize);
    }
  }, [isOpen, imageLoaded, updateCropBoxSize]);

  // Escala base para cobrir o cropBox
  const baseScale = Math.max(
    cropBox.width / (naturalSize.width || 1),
    cropBox.height / (naturalSize.height || 1)
  );
  const currentScale = baseScale * zoom;
  const dispW = naturalSize.width * currentScale;
  const dispH = naturalSize.height * currentScale;

  // Limites de deslocamento para manter o crop box sempre preenchido
  const minX = cropBox.width - dispW;
  const maxX = 0;
  const minY = cropBox.height - dispH;
  const maxY = 0;

  // Garante centralização inicial
  useEffect(() => {
    if (imageLoaded && cropBox.width > 0) {
      const initX = (cropBox.width - dispW) / 2;
      const initY = (cropBox.height - dispH) / 2;
      setOffset({ x: initX, y: initY });
    }
  }, [imageLoaded, cropBox.width, cropBox.height, selectedAspect]);

  // Mouse / Touch Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;

    // Aplica bounds com leve elasticidade
    const clampedX = Math.max(minX - 40, Math.min(maxX + 40, newX));
    const clampedY = Math.max(minY - 40, Math.min(maxY + 40, newY));
    setOffset({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    // Snap back dentro dos limites exatos
    setOffset((prev) => ({
      x: Math.max(minX, Math.min(maxX, prev.x)),
      y: Math.max(minY, Math.min(maxY, prev.y)),
    }));
  };

  // Zoom com a roda do mouse
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(1, Math.min(3.5, prev + delta)));
  };

  // Executa o recorte em canvas de alta resolução
  const handleExecuteCrop = () => {
    if (!naturalSize.width || !naturalSize.height) return;

    try {
      const canvas = document.createElement('canvas');
      const targetW = selectedAspect.width;
      const targetH =
        selectedAspect.ratio > 0
          ? Math.round(targetW / selectedAspect.ratio)
          : Math.round((targetW / naturalSize.width) * naturalSize.height);

      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Coordenadas de origem na imagem original
      const effectiveScale = baseScale * zoom;
      const sx = Math.max(0, -offset.x / effectiveScale);
      const sy = Math.max(0, -offset.y / effectiveScale);
      const sw = Math.min(naturalSize.width - sx, cropBox.width / effectiveScale);
      const sh = Math.min(naturalSize.height - sy, cropBox.height / effectiveScale);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Suporte a rotação se aplicada
      if (rotation !== 0) {
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(
          imgRef.current || (new Image() as any),
          sx,
          sy,
          sw,
          sh,
          -targetW / 2,
          -targetH / 2,
          targetW,
          targetH
        );
        ctx.restore();
      } else {
        ctx.drawImage(
          imgRef.current || (new Image() as any),
          sx,
          sy,
          sw,
          sh,
          0,
          0,
          targetW,
          targetH
        );
      }

      const croppedDataUrl = canvas.toDataURL('image/webp', 0.92);
      onCropComplete(croppedDataUrl);
      onClose();
    } catch (err) {
      console.error('Erro ao gerar recorte do banner:', err);
      alert('Falha ao processar o recorte da imagem.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 antialiased">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-sm font-bold border border-emerald-500/20">
              ✂️
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {title}
              </h3>
              <p className="text-xs text-slate-400">
                Arraste para enquadrar e use o zoom e rotação para calibrar a imagem
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-xs font-bold hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Aspect Ratio Selector Pills */}
        <div className="px-5 pt-3 pb-1 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">Proporção:</span>
          {currentPresets.map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setSelectedAspect(opt)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all ${
                selectedAspect.label === opt.label
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/80'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Viewport Frame with Crop Window */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          className="relative flex-1 bg-slate-950 p-6 flex items-center justify-center overflow-hidden min-h-[280px] max-h-[360px] select-none"
        >
          {imageLoaded ? (
            <div
              style={{
                width: `${cropBox.width}px`,
                height: `${cropBox.height}px`,
              }}
              className="relative overflow-hidden rounded-2xl shadow-[0_0_0_9999px_rgba(7,11,20,0.85)] border-2 border-emerald-400/90 cursor-grab active:cursor-grabbing z-10"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              {/* Imagem a ser recortada */}
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Para recorte"
                draggable={false}
                style={{
                  width: `${dispW}px`,
                  height: `${dispH}px`,
                  transform: `translate3d(${offset.x}px, ${offset.y}px, 0) rotate(${rotation}deg)`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                }}
                className="absolute top-0 left-0 pointer-events-none select-none"
              />

              {/* Guia visual de terços para alinhamento profissional */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 pointer-events-none opacity-20 border border-emerald-400/30">
                <div className="border-r border-b border-emerald-400/40"></div>
                <div className="border-r border-b border-emerald-400/40"></div>
                <div className="border-b border-emerald-400/40"></div>
                <div className="border-r border-emerald-400/40"></div>
                <div className="border-r border-emerald-400/40"></div>
                <div></div>
              </div>
            </div>
          ) : (
            <div className="text-slate-500 text-xs flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>
              Carregando imagem original...
            </div>
          )}
        </div>

        {/* Crop Controls: Zoom & Center */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          {/* Zoom Slider */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <span className="text-slate-400 font-bold text-[11px] whitespace-nowrap">🔍 Zoom:</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-700"
              title="Reduzir Zoom"
            >
              -
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-32 accent-emerald-500 cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm border border-slate-700"
              title="Aumentar Zoom"
            >
              +
            </button>
            <span className="font-mono text-[11px] text-emerald-400 min-w-[36px]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Helper buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setOffset({
                  x: (cropBox.width - naturalSize.width * baseScale) / 2,
                  y: (cropBox.height - naturalSize.height * baseScale) / 2,
                });
              }}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors"
            >
              Centralizar
            </button>

            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 transition-colors flex items-center gap-1"
            >
              <span>↻</span> Girar
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono hidden sm:block">
            Saída: <span className="text-white font-bold">{selectedAspect.width} × {selectedAspect.ratio > 0 ? Math.round(selectedAspect.width / selectedAspect.ratio) : 'Auto'}px</span> (Retina WebP)
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleExecuteCrop}
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black uppercase tracking-wide transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
            >
              ✓ Aplicar Recorte ao Banner
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
