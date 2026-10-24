// tslint:disable
/* eslint-disable */
import {
  CheckCircle2,
  HelpCircle,
  Menu,
  Play,
  RotateCw,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  CONFIG,
  getConfig,
  STAGES_5S_INFO,
  Stage5SInfo,
} from './constants';
import BackgroundMusic from './utils/BackgroundMusic';
import {
  createFixedStepper,
  drawAsset,
  drawBackground,
  gameAudio,
  GameState,
  MenuOverlay,
  prepareCanvas,
  shuffle,
  useAssets,
  useAutoFocus,
} from './utils/helper';
import {
  usePlayground,
  usePlaygroundGameLifecycle,
} from './utils/usePlayground';

// --- COMPLETE ASSET MANIFEST ---
const ASSETS_MANIFEST: Record<string, string> = {
  // Backgrounds
  bg_workshop: 'assets/images/bg_workshop_copy.png',
  bg_celebration: 'assets/images/new_asset_1792278668983.png',
  fabrica_final_bg: 'assets/images/new_asset_1792278668983.png',

  // Pilots (Stage & Final Celebration)
  pilot_stage: 'assets/images/new_asset_1792274647817.png',
  piloto_fases: 'assets/images/new_asset_1792274647817.png',
  pilot_final: 'assets/images/new_asset_1792275095016.png',
  piloto_final: 'assets/images/new_asset_1792275095016.png',

  // Crates (Useful & Discard)
  box_useful_green: 'assets/images/box_useful_green.png',
  box_discard_red: 'assets/images/box_discard_red.png',

  // Stage 1 & 2 Items & Waste
  battery_good: 'assets/images/battery_good.png',
  battery_damaged: 'assets/images/battery_damaged.png',
  tool_wrench: 'assets/images/tool_wrench.png',
  tool_hammer: 'assets/images/tool_hammer.png',
  tool_stapler: 'assets/images/tool_stapler.png',
  safety_boots: 'assets/images/safety_boots.png',
  wire_damaged: 'assets/images/wire_damaged.png',
  oily_rag: 'assets/images/oily_rag.png',
  broken_gear: 'assets/images/broken_gear.png',
  rusted_screw_trash: 'assets/images/rusted_screw_trash.png',
  paper_ball_trash: 'assets/images/paper_ball_trash.png',

  // Workshop Organizers & Furniture
  shelf_batteries: 'assets/images/shelf_batteries.png',
  toolbox_station: 'assets/images/toolbox_station.png',
  drawer_desk: 'assets/images/drawer_desk.png',
  locker_uniform: 'assets/images/locker_uniform.png',
  wall_hooks: 'assets/images/wall_hooks.png',
  stationery_notebook: 'assets/images/stationery_notebook.png',
  worker_uniform: 'assets/images/worker_uniform.png',
  cleaning_broom: 'assets/images/cleaning_broom.png',
  floor_mop: 'assets/images/floor_mop.png',

  // Cleaning Stage & Trashcan
  grease_stain: 'assets/images/grease_stain.png',
  cleaning_sponge: 'assets/images/cleaning_sponge.png',
  porta_esponja: 'assets/images/new_asset_1792858483744.png',
  window_squeegee: 'assets/images/new_asset_1792279888901.png',
  limpa_vidros: 'assets/images/new_asset_1792279888901.png',
  lixeira_papel: 'assets/images/new_asset_1792274206723.png',
  workshop_trashcan: 'assets/images/new_asset_1792274206723.png',
  lixeira_fase4: 'assets/images/new_asset_1792274206723_copy.png',

  // Standardization & Safety Signs
  sign_wet_floor: 'assets/images/sign_wet_floor.png',
  sign_safety_helmet: 'assets/images/sign_safety_helmet_copy.png',
  sign_safety_helmet_copy: 'assets/images/sign_safety_helmet_copy.png',
  sign_epi: 'assets/images/sign_safety_helmet_copy.png',
  sign_high_voltage: 'assets/images/sign_high_voltage.png',
  sign_recycle: 'assets/images/sign_recycle.png',
  sign_maintenance: 'assets/images/sign_maintenance.png',
  furadeira_bancada: 'assets/images/new_asset_1792277097496.png',
  electric_panel: 'assets/images/electric_panel.png',

  // Rewards
  trophy_5s_gold: 'assets/images/trophy_5s_gold.png',
  star_gold: 'assets/images/star_gold.png',
};

// Types for Stage Entities
interface TargetZone {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  assetKey: string;
  label: string;
  acceptedTypes: string[];
  isFilled?: boolean;
  customRenderType?: 'WATER_PUDDLE' | 'FACTORY_DOOR' | 'BLUE_TRASHCAN' | 'BOX_DISCARD' | 'BOX_USEFUL';
}

interface DraggableItem {
  id: string;
  type: string;
  assetKey: string;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  w: number;
  h: number;
  isDragging: boolean;
  isPlaced: boolean;
  targetId: string;
  label: string;
  isScrubTool?: boolean;
  scrubProgress?: number;
  dirtySpotId?: string;
  cleanComplete?: boolean;
}

interface DirtSpot {
  id: string;
  assetKey: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cleanProgress: number;
  toolNeeded: string;
  isCleaned: boolean;
  type?: 'OIL_DARK' | 'GREASE_DARK' | 'WINDOW' | 'NAVY_SPILL';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  rotation: number;
  vRot: number;
  isStar?: boolean;
}

interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
}

interface SpeakerProfile {
  speaker: 'PILOT' | 'MECH_GREY' | 'MECH_BLUE' | 'MECH_RED';
  name: string;
  role: string;
}

// -------------------------------------------------------------
// MECHANIC CHARACTERS RENDERING (Frontal Workshop Crew)
// -------------------------------------------------------------

// Edward Checker (Grey Uniform - Inspetor de Qualidade)
function drawMechanicGrey(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  time: number,
  action: 'IDLE' | 'CHEER' | 'WORK' = 'IDLE',
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const isCheering = action === 'CHEER';
  const bounce = isCheering ? Math.abs(Math.sin(time * 8)) * 24 : Math.sin(time * 2) * 1.5;
  const armAngle = isCheering ? Math.sin(time * 12) * 0.4 - 0.7 : Math.sin(time * 2) * 0.1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 70, 36 * (1 - bounce * 0.015), 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -bounce);

  // Boots
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-22, 55, 18, 16, 4);
  ctx.roundRect(4, 55, 18, 16, 4);
  ctx.fill();

  // Grey Trousers/Legs
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.roundRect(-20, 20, 16, 38, 4);
  ctx.roundRect(4, 20, 16, 38, 4);
  ctx.fill();

  // Torso / Grey Uniform Jacket
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.roundRect(-24, -25, 48, 48, 8);
  ctx.fill();

  // Yellow Safety Reflective Stripe
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-24, -5, 48, 7);

  // Dark Grey Collar & Pockets
  ctx.fillStyle = '#334155';
  ctx.fillRect(-20, -25, 40, 6);
  ctx.fillRect(-18, 5, 14, 12);
  ctx.fillRect(4, 5, 14, 12);

  // Pen in pocket
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(-14, 2, 4, 8);

  // ID Badge on Chest
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(6, -18, 14, 10);
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(8, -16, 10, 4);

  // Left Arm (Quality Clipboard)
  ctx.save();
  ctx.translate(-22, -18);
  ctx.rotate(isCheering ? -armAngle - 1.2 : armAngle);
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.roundRect(-8, 0, 14, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(-1, 34, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-10, 25, 18, 22);
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(-8, 28, 14, 17);
  ctx.fillStyle = '#10b981';
  ctx.fillRect(-5, 31, 8, 2);
  ctx.fillRect(-5, 35, 8, 2);
  ctx.restore();

  // Right Arm
  ctx.save();
  ctx.translate(22, -18);
  ctx.rotate(isCheering ? armAngle + 1.2 : -armAngle);
  ctx.fillStyle = '#64748b';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 14, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(1, 34, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.save();
  ctx.translate(1, 36);
  ctx.rotate(isCheering ? Math.sin(time * 10) * 0.5 : 0.3);
  ctx.fillRect(-3, -16, 6, 28);
  ctx.beginPath();
  ctx.arc(0, -16, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(0, -16, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.restore();

  // Neck & Head
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(-6, -30, 12, 8);
  ctx.beginPath();
  ctx.arc(0, -42, 18, 0, Math.PI * 2);
  ctx.fill();

  // Eyes & Safety Glasses
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-7, -42, 2.5, 0, Math.PI * 2);
  ctx.arc(7, -42, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
  ctx.beginPath();
  ctx.roundRect(-14, -48, 12, 11, 3);
  ctx.roundRect(2, -48, 12, 11, 3);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-2, -43);
  ctx.lineTo(2, -43);
  ctx.stroke();

  // Mouth
  ctx.strokeStyle = '#991b1b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isCheering) {
    ctx.arc(0, -35, 7, 0, Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  } else {
    ctx.arc(0, -35, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();
  }

  // Grey Workshop Cap
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.arc(0, -47, 18, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-18, -48, 36, 6, 3);
  ctx.fill();

  ctx.restore();
}

// Otto Polack (Blue Uniform - Mecânico)
function drawMechanicBlue(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  time: number,
  action: 'IDLE' | 'CHEER' | 'WORK' = 'IDLE',
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const isCheering = action === 'CHEER';
  const bounce = isCheering ? Math.abs(Math.sin(time * 8 + 1.2)) * 26 : Math.sin(time * 2.2 + 0.5) * 1.5;
  const armAngle = isCheering ? Math.sin(time * 12 + 1) * 0.5 - 0.8 : Math.sin(time * 2) * 0.1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 70, 36 * (1 - bounce * 0.015), 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -bounce);

  // Boots
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(-22, 55, 18, 16, 4);
  ctx.roundRect(4, 55, 18, 16, 4);
  ctx.fill();

  // Blue Overalls Legs
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(-20, 20, 16, 38, 4);
  ctx.roundRect(4, 20, 16, 38, 4);
  ctx.fill();

  // Yellow stripe at knee
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-20, 38, 16, 4);
  ctx.fillRect(4, 38, 16, 4);

  // Blue Uniform Torso
  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(-24, -25, 48, 48, 8);
  ctx.fill();

  // High Vis Vest Straps
  ctx.fillStyle = '#facc15';
  ctx.fillRect(-18, -25, 6, 48);
  ctx.fillRect(12, -25, 6, 48);

  // Tool Belt
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-24, 15, 48, 8);
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-5, 13, 10, 12);

  // Left Arm
  ctx.save();
  ctx.translate(-22, -18);
  ctx.rotate(isCheering ? -armAngle - 1.4 : -0.2);
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(-8, 0, 14, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(-1, 34, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-6, 30, 6, 6);
  ctx.restore();

  // Right Arm
  ctx.save();
  ctx.translate(22, -18);
  ctx.rotate(isCheering ? armAngle + 1.4 : 0.3);
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 14, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(1, 34, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(-1, 32, 4, 22);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-3, 30, 8, 10);
  ctx.restore();

  // Head
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(-6, -30, 12, 8);
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, -42, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(-7, -42, 2.5, 0, Math.PI * 2);
  ctx.arc(7, -42, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isCheering) {
    ctx.arc(0, -35, 7, 0, Math.PI);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
  } else {
    ctx.arc(0, -35, 6, 0, Math.PI);
    ctx.stroke();
  }

  // Blue Cap
  ctx.fillStyle = '#1e40af';
  ctx.beginPath();
  ctx.arc(0, -47, 18, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1d4ed8';
  ctx.beginPath();
  ctx.roundRect(-18, -48, 36, 6, 3);
  ctx.fill();

  ctx.restore();
}

// John Sparks (Red Uniform - Eletricista)
function drawMechanicRed(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  scale: number,
  time: number,
  action: 'IDLE' | 'CHEER' | 'WORK' = 'IDLE',
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const isCheering = action === 'CHEER';
  const bounce = isCheering ? Math.abs(Math.sin(time * 8 + 2.4)) * 26 : Math.sin(time * 2 + 1) * 1.5;
  const armAngle = isCheering ? Math.sin(time * 12 + 2) * 0.6 - 0.9 : Math.sin(time * 2) * 0.1;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(0, 70, 36 * (1 - bounce * 0.015), 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(0, -bounce);

  // Boots
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(-22, 55, 18, 16, 4);
  ctx.roundRect(4, 55, 18, 16, 4);
  ctx.fill();

  // Red Overalls Legs
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.roundRect(-20, 20, 16, 38, 4);
  ctx.roundRect(4, 20, 16, 38, 4);
  ctx.fill();

  // Red Uniform Torso
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(-24, -25, 48, 48, 8);
  ctx.fill();

  // Lightning Bolt Electrician Badge
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.moveTo(2, -18);
  ctx.lineTo(-4, -8);
  ctx.lineTo(0, -8);
  ctx.lineTo(-2, 0);
  ctx.lineTo(6, -10);
  ctx.lineTo(1, -10);
  ctx.closePath();
  ctx.fill();

  // Left Arm
  ctx.save();
  ctx.translate(-22, -18);
  ctx.rotate(isCheering ? -armAngle - 1.5 : -0.3);
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.roundRect(-8, 0, 14, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(-1, 34, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right Arm
  ctx.save();
  ctx.translate(22, -18);
  ctx.rotate(isCheering ? armAngle + 1.5 : 0.4);
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.roundRect(-6, 0, 14, 32, 6);
  ctx.fill();
  ctx.fillStyle = '#fcd34d';
  ctx.beginPath();
  ctx.arc(1, 34, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.save();
  ctx.translate(1, 36);
  ctx.rotate(Math.sin(time * 10) * 0.4);
  ctx.fillRect(-6, 0, 14, 18);
  ctx.restore();
  ctx.restore();

  // Neck & Head
  ctx.fillStyle = '#fcd34d';
  ctx.fillRect(-6, -30, 12, 8);
  ctx.beginPath();
  ctx.arc(0, -42, 18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-7, -42, 2.5, 0, Math.PI * 2);
  ctx.arc(7, -42, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (isCheering) {
    ctx.arc(0, -35, 7, 0, Math.PI);
    ctx.fillStyle = '#991b1b';
    ctx.fill();
  } else {
    ctx.arc(0, -35, 5, 0, Math.PI);
    ctx.stroke();
  }

  // Red Cap
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.arc(0, -47, 18, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#991b1b';
  ctx.beginPath();
  ctx.roundRect(-8, -43, 16, 7, 3);
  ctx.fill();

  ctx.restore();
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stepperRef = useRef<ReturnType<typeof createFixedStepper>>();

  // UI States
  const [isGameMenuOpen, setIsGameMenuOpen] = useState(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [isSfxMuted, setIsSfxMuted] = useState(false);

  // Auto-advance level delay timer
  const advanceTimerRef = useRef<number | null>(null);

  // Stage clear celebration state
  const [isStageClearCelebration, setIsStageClearCelebration] = useState(false);
  const [stageClearNumber, setStageClearNumber] = useState(1);

  // Current speaking character & dialog text
  const [currentSpeaker, setCurrentSpeaker] = useState<SpeakerProfile>({
    speaker: 'MECH_GREY',
    name: 'Edward Checker',
    role: 'Inspetor de Qualidade',
  });
  const [mascotText, setMascotText] = useState<string>(
    STAGES_5S_INFO[0].mascotMessage,
  );
  const [speechShake, setSpeechShake] = useState(false);

  // Playground SDK Integration
  const {sdk} = usePlayground();

  // Preload Assets
  const {assets, isReady: assetsReady} = useAssets(ASSETS_MANIFEST);

  const canvasWidth = getConfig('baseCanvasWidth') as number;
  const canvasHeight = getConfig('baseCanvasHeight') as number;

  if (!stepperRef.current) {
    const stepMs = getConfig('stepMs');
    const maxSubSteps = getConfig('maxSubSteps');
    stepperRef.current = createFixedStepper(stepMs, maxSubSteps);
  }

  const [gameState, setGameState] = useState<GameState>({
    status: 'START',
    score: 0,
    level: 1,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Global anim time
  const animTimeRef = useRef(0);

  // Sync back button
  useEffect(() => {
    (window as any).canHandleBackKey = gameState.status !== 'START';
  }, [gameState.status]);

  const cheerTimerRef = useRef(0);

  // Simulation Entities inside useRef for 60FPS physics
  const targetsRef = useRef<TargetZone[]>([]);
  const itemsRef = useRef<DraggableItem[]>([]);
  const dirtsRef = useRef<DirtSpot[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingsRef = useRef<FloatingText[]>([]);

  // Drag interaction state
  const draggedItemIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef<{x: number; y: number}>({x: 0, y: 0});
  const pointerPosRef = useRef<{x: number; y: number; down: boolean}>({
    x: 0,
    y: 0,
    down: false,
  });

  // Mascot / Mechanic speech helper
  const triggerSpeech = useCallback(
    (
      text: string,
      speakerOverride?: 'PILOT' | 'MECH_GREY' | 'MECH_BLUE' | 'MECH_RED',
    ) => {
      setMascotText(text);
      setSpeechShake(true);
      setTimeout(() => setSpeechShake(false), 300);

      const lvl = gameStateRef.current.level;
      const stageInfo = STAGES_5S_INFO[lvl - 1] || STAGES_5S_INFO[0];

      const activeSpeaker = speakerOverride || stageInfo.speaker;
      let name = stageInfo.speakerName;
      let role = stageInfo.speakerRole;

      if (activeSpeaker === 'MECH_GREY') {
        name = 'Edward Checker';
        role = 'Inspetor de Qualidade';
      } else if (activeSpeaker === 'MECH_BLUE') {
        name = 'Otto Polack';
        role = 'Mecânico';
      } else if (activeSpeaker === 'MECH_RED') {
        name = 'John Sparks';
        role = 'Eletricista';
      } else if (activeSpeaker === 'PILOT') {
        name = 'Piloto 5S';
        role = 'Piloto Oficial 5S';
      }

      setCurrentSpeaker({
        speaker: activeSpeaker,
        name,
        role,
      });
    },
    [],
  );

  // Spawn particles
  const spawnParticles = useCallback(
    (
      x: number,
      y: number,
      count = 15,
      color = '#f59e0b',
      isStar = false,
    ) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 180;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          size: isStar ? 14 + Math.random() * 12 : 5 + Math.random() * 9,
          color,
          alpha: 1,
          life: 0,
          maxLife: 0.7 + Math.random() * 0.9,
          rotation: Math.random() * Math.PI * 2,
          vRot: (Math.random() - 0.5) * 8,
          isStar,
        });
      }
    },
    [],
  );

  const spawnFloatingText = useCallback(
    (text: string, x: number, y: number, color = '#10b981') => {
      floatingsRef.current.push({
        id: Math.random().toString(),
        text,
        x,
        y,
        vy: -40,
        color,
        alpha: 1,
        scale: 1,
      });
    },
    [],
  );

  // Setup Stage Data
  const setupStage = useCallback(
    (stageNumber: number) => {
      draggedItemIdRef.current = null;
      setIsStageClearCelebration(false);
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = null;
      }

      const stageInfo =
        STAGES_5S_INFO[stageNumber - 1] || STAGES_5S_INFO[0];
      triggerSpeech(stageInfo.mascotMessage, stageInfo.speaker);

      cheerTimerRef.current = 0;

      const newTargets: TargetZone[] = [];
      const newItems: DraggableItem[] = [];
      const newDirts: DirtSpot[] = [];

      if (stageNumber === 1) {
        // --- FASE 1: SEIRI (Utilização - 10 Itens: 5 Úteis + 5 Descarte) ---
        // Clean boxes on left / center, without text badges (graphics identify them)
        newTargets.push(
          {
            id: 'box_green',
            type: 'BOX_USEFUL',
            x: 100,
            y: 280,
            w: 320,
            h: 320,
            assetKey: 'box_useful_green',
            label: 'Caixa Útil',
            acceptedTypes: ['USEFUL'],
            customRenderType: 'BOX_USEFUL',
          },
          {
            id: 'box_red',
            type: 'BOX_DISCARD',
            x: 470,
            y: 280,
            w: 320,
            h: 320,
            assetKey: 'box_discard_red',
            label: 'Caixa Descarte',
            acceptedTypes: ['DISCARD'],
            customRenderType: 'BOX_DISCARD',
          },
        );

        // 10 Items: 5 Useful + 5 Discard to be shuffled into "Área de Seleção" (Right Panel)
        const stage1ItemsPool: Omit<DraggableItem, 'x' | 'y' | 'originalX' | 'originalY'>[] = [
          // 5 Useful
          {
            id: 'item_bat_good',
            type: 'USEFUL',
            assetKey: 'battery_good',
            w: 110,
            h: 96,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_green',
            label: 'Bateria Boa 100%',
          },
          {
            id: 'item_wrench',
            type: 'USEFUL',
            assetKey: 'tool_wrench',
            w: 88,
            h: 82,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_green',
            label: 'Chave de Boca',
          },
          {
            id: 'item_hammer',
            type: 'USEFUL',
            assetKey: 'tool_hammer',
            w: 88,
            h: 88,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_green',
            label: 'Martelo Novo',
          },
          {
            id: 'item_notebook_s1',
            type: 'USEFUL',
            assetKey: 'stationery_notebook',
            w: 92,
            h: 70,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_green',
            label: 'Caderno de Registro',
          },
          {
            id: 'item_boots_s1',
            type: 'USEFUL',
            assetKey: 'safety_boots',
            w: 86,
            h: 78,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_green',
            label: 'Botas de Segurança',
          },
          // 5 Discard
          {
            id: 'item_bat_dmg',
            type: 'DISCARD',
            assetKey: 'battery_damaged',
            w: 92,
            h: 82,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_red',
            label: 'Bateria Danificada/Vazando',
          },
          {
            id: 'item_screws',
            type: 'DISCARD',
            assetKey: 'rusted_screw_trash',
            w: 84,
            h: 74,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_red',
            label: 'Parafusos Enferrujados',
          },
          {
            id: 'item_burnt_wire',
            type: 'DISCARD',
            assetKey: 'wire_damaged',
            w: 88,
            h: 68,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_red',
            label: 'Fio Queimado / Descascado',
          },
          {
            id: 'item_oily_rag',
            type: 'DISCARD',
            assetKey: 'oily_rag',
            w: 88,
            h: 70,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_red',
            label: 'Pano com Graxa Rasgado',
          },
          {
            id: 'item_broken_gear',
            type: 'DISCARD',
            assetKey: 'broken_gear',
            w: 82,
            h: 82,
            isDragging: false,
            isPlaced: false,
            targetId: 'box_red',
            label: 'Engrenagem Quebrada',
          },
        ];

        // 10 Slot positions inside "Área de Seleção" (Right Panel: x: 830, y: 130, w: 510, h: 475)
        // 2 Columns x 5 Rows positioned below the top-right team platform
        const slots = [
          {x: 875, y: 185},
          {x: 1105, y: 185},
          {x: 875, y: 265},
          {x: 1105, y: 265},
          {x: 875, y: 345},
          {x: 1105, y: 345},
          {x: 875, y: 425},
          {x: 1105, y: 425},
          {x: 875, y: 505},
          {x: 1105, y: 505},
        ];

        // Shuffle items randomly so player must genuinely identify each item
        const shuffledItems = shuffle(stage1ItemsPool);
        shuffledItems.forEach((baseItem, idx) => {
          const slot = slots[idx];
          newItems.push({
            ...baseItem,
            x: slot.x,
            y: slot.y,
            originalX: slot.x,
            originalY: slot.y,
          });
        });
      } else if (stageNumber === 2) {
        // --- FASE 2: SEITON (Organização - 9 Itens - Contentor LOCAIS DESIGNADOS alargado) ---
        newTargets.push(
          {
            id: 'target_shelf',
            type: 'SHELF',
            x: 535,
            y: 175,
            w: 185,
            h: 175,
            assetKey: 'shelf_batteries',
            label: 'Prateleira de Baterias',
            acceptedTypes: ['BATTERY'],
          },
          {
            id: 'target_hooks',
            type: 'WALL_HOOKS',
            x: 805,
            y: 175,
            w: 195,
            h: 155,
            assetKey: 'wall_hooks',
            label: 'Ganchos de Parede',
            acceptedTypes: ['BROOM', 'MOP'],
          },
          {
            id: 'target_drawer',
            type: 'DRAWER',
            x: 530,
            y: 385,
            w: 195,
            h: 140,
            assetKey: 'drawer_desk',
            label: 'Gaveta da Escrivaninha',
            acceptedTypes: ['NOTEBOOK', 'STAPLER'],
          },
          {
            id: 'target_toolbox',
            type: 'TOOLBOX',
            x: 805,
            y: 375,
            w: 195,
            h: 170,
            assetKey: 'toolbox_station',
            label: 'Caixa de Ferramentas',
            acceptedTypes: ['TOOL_WRENCH', 'TOOL_HAMMER'],
          },
          {
            id: 'target_locker',
            type: 'LOCKER',
            x: 1080,
            y: 205,
            w: 185,
            h: 260,
            assetKey: 'locker_uniform',
            label: 'Armário de Uniformes',
            acceptedTypes: ['UNIFORM', 'BOOTS'],
          },
        );

        // 9 Items on the Workbench (3x3 grid)
        newItems.push(
          // 1. Bateria -> Prateleira
          {
            id: 's2_item_1_bat',
            type: 'BATTERY',
            assetKey: 'battery_good',
            x: 120,
            y: 175,
            originalX: 120,
            originalY: 175,
            w: 108,
            h: 94,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_shelf',
            label: 'Bateria',
          },
          // 2. Chave de Boca -> Bancada de Ferramentas
          {
            id: 's2_item_2_wrench',
            type: 'TOOL_WRENCH',
            assetKey: 'tool_wrench',
            x: 235,
            y: 175,
            originalX: 235,
            originalY: 175,
            w: 85,
            h: 80,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_toolbox',
            label: 'Chave de Boca',
          },
          // 3. Martelo -> Bancada de Ferramentas
          {
            id: 's2_item_3_hammer',
            type: 'TOOL_HAMMER',
            assetKey: 'tool_hammer',
            x: 350,
            y: 175,
            originalX: 350,
            originalY: 175,
            w: 85,
            h: 85,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_toolbox',
            label: 'Martelo',
          },
          // 4. Caderno de Anotações -> Gaveta
          {
            id: 's2_item_4_notebook',
            type: 'NOTEBOOK',
            assetKey: 'stationery_notebook',
            x: 120,
            y: 285,
            originalX: 120,
            originalY: 285,
            w: 95,
            h: 70,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_drawer',
            label: 'Caderno de Anotações',
          },
          // 5. Uniforme de Trabalho -> Armário
          {
            id: 's2_item_5_uniform',
            type: 'UNIFORM',
            assetKey: 'worker_uniform',
            x: 235,
            y: 285,
            originalX: 235,
            originalY: 285,
            w: 95,
            h: 78,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_locker',
            label: 'Uniforme de Trabalho',
          },
          // 6. Vassoura -> Ganchos de Parede
          {
            id: 's2_item_6_broom',
            type: 'BROOM',
            assetKey: 'cleaning_broom',
            x: 350,
            y: 285,
            originalX: 350,
            originalY: 285,
            w: 85,
            h: 86,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_hooks',
            label: 'Vassoura',
          },
          // 7. Grampeador -> Gaveta
          {
            id: 's2_item_7_stapler',
            type: 'STAPLER',
            assetKey: 'tool_stapler',
            x: 120,
            y: 395,
            originalX: 120,
            originalY: 395,
            w: 85,
            h: 69,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_drawer',
            label: 'Grampeador',
          },
          // 8. Mop de Limpeza -> Ganchos de Parede
          {
            id: 's2_item_8_mop',
            type: 'MOP',
            assetKey: 'floor_mop',
            x: 235,
            y: 395,
            originalX: 235,
            originalY: 395,
            w: 85,
            h: 85,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_hooks',
            label: 'Mop de Limpeza',
          },
          // 9. Bota de Segurança -> Armário
          {
            id: 's2_item_9_boots',
            type: 'BOOTS',
            assetKey: 'safety_boots',
            x: 350,
            y: 395,
            originalX: 350,
            originalY: 395,
            w: 85,
            h: 77,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_locker',
            label: 'Botas de Segurança',
          },
        );
      } else if (stageNumber === 3) {
        // --- FASE 3: SEISO (Limpeza - Painel de Itens de Limpeza Elevado na Esquerda) ---
        newTargets.push({
          id: 'target_trashcan',
          type: 'TRASHCAN',
          x: 1080,
          y: 475,
          w: 155,
          h: 182,
          assetKey: 'lixeira_papel',
          label: 'Lixeira da Oficina',
          acceptedTypes: ['PAPER_TRASH'],
          customRenderType: 'BLUE_TRASHCAN',
        });

        // 3 Dirt Spots (Posicionados mais para baixo conforme solicitado)
        newDirts.push(
          // Sujeira da Janela / Vidro (Limpa-vidros / Squeegee)
          {
            id: 'dirt_window',
            assetKey: 'window_squeegee',
            x: 540,
            y: 165,
            w: 220,
            h: 120,
            cleanProgress: 0,
            toolNeeded: 'SQUEEGEE',
            isCleaned: false,
            type: 'WINDOW',
          },
          // Mancha na Bancada (Esponja / Sponge)
          {
            id: 'dirt_grease',
            assetKey: 'grease_stain',
            x: 420,
            y: 360,
            w: 220,
            h: 110,
            cleanProgress: 0,
            toolNeeded: 'SPONGE',
            isCleaned: false,
            type: 'GREASE_DARK',
          },
          // Mancha no Piso (Mop de Piso)
          {
            id: 'dirt_floor',
            assetKey: 'floor_mop',
            x: 720,
            y: 495,
            w: 230,
            h: 110,
            cleanProgress: 0,
            toolNeeded: 'MOP',
            isCleaned: false,
            type: 'NAVY_SPILL',
          },
        );

        // Cleaning Tools housed in elevated container "ITENS DE LIMPEZA" on upper left
        newItems.push(
          {
            id: 'tool_sponge',
            type: 'SPONGE',
            assetKey: 'cleaning_sponge',
            x: 124,
            y: 119,
            originalX: 124,
            originalY: 119,
            w: 92,
            h: 76,
            isDragging: false,
            isPlaced: false,
            targetId: '',
            label: 'Esponja (Bancada)',
            isScrubTool: true,
            dirtySpotId: 'dirt_grease',
          },
          {
            id: 'tool_squeegee',
            type: 'SQUEEGEE',
            assetKey: 'window_squeegee',
            x: 124,
            y: 209,
            originalX: 124,
            originalY: 209,
            w: 92,
            h: 76,
            isDragging: false,
            isPlaced: false,
            targetId: '',
            label: 'Rodo Limpa-Vidros',
            isScrubTool: true,
            dirtySpotId: 'dirt_window',
          },
          {
            id: 'tool_mop',
            type: 'MOP',
            assetKey: 'floor_mop',
            x: 122,
            y: 299,
            originalX: 122,
            originalY: 299,
            w: 96,
            h: 86,
            isDragging: false,
            isPlaced: false,
            targetId: '',
            label: 'Mop de Piso',
            isScrubTool: true,
            dirtySpotId: 'dirt_floor',
          },
          // 2 Paper Balls on the floor (Balanced comfortable spacing)
          {
            id: 'item_paper1',
            type: 'PAPER_TRASH',
            assetKey: 'paper_ball_trash',
            x: 390,
            y: 495,
            originalX: 390,
            originalY: 495,
            w: 75,
            h: 75,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_trashcan',
            label: 'Papel Amassado 1',
          },
          {
            id: 'item_paper2',
            type: 'PAPER_TRASH',
            assetKey: 'paper_ball_trash',
            x: 910,
            y: 480,
            originalX: 910,
            originalY: 480,
            w: 75,
            h: 75,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_trashcan',
            label: 'Papel Amassado 2',
          },
        );
      } else if (stageNumber === 4) {
        // --- FASE 4: SEIKETSU (Padronização e Segurança - 5 Placas / Alvos) ---
        newTargets.push(
          {
            id: 'target_elec',
            type: 'PANEL',
            x: 60,
            y: 95,
            w: 180,
            h: 210,
            assetKey: 'electric_panel',
            label: 'Painel Elétrico',
            acceptedTypes: ['SIGN_VOLTAGE'],
          },
          {
            id: 'target_drill',
            type: 'BENCH_DRILL',
            x: 200,
            y: 330,
            w: 125,
            h: 235,
            assetKey: 'furadeira_bancada',
            label: 'Furadeira de Bancada',
            acceptedTypes: ['SIGN_MAINTENANCE'],
          },
          {
            id: 'target_wet_floor',
            type: 'WET_FLOOR_AREA',
            x: 460,
            y: 430,
            w: 210,
            h: 140,
            assetKey: 'sign_wet_floor',
            label: 'Mancha de Água no Chão',
            acceptedTypes: ['SIGN_WET'],
            customRenderType: 'WATER_PUDDLE',
          },
          {
            id: 'target_recycle_bin',
            type: 'RECYCLE_BIN',
            x: 890,
            y: 440,
            w: 145,
            h: 230,
            assetKey: 'lixeira_fase4',
            label: 'Lixeira de Reciclagem',
            acceptedTypes: ['SIGN_RECYCLE'],
          },
          {
            id: 'target_safety_wall',
            type: 'SAFETY_WALL',
            x: 1100,
            y: 175,
            w: 195,
            h: 205,
            assetKey: 'sign_safety_helmet',
            label: 'Porta de Entrada da Fábrica',
            acceptedTypes: ['SIGN_HELMET'],
            customRenderType: 'FACTORY_DOOR',
          },
        );

        // 5 Safety Signs pool to be shuffled into container "IDENTIFICAÇÃO PADRÃO 5S"
        const stage4SignsPool: Omit<DraggableItem, 'x' | 'y' | 'originalX' | 'originalY'>[] = [
          {
            id: 'sign_volts',
            type: 'SIGN_VOLTAGE',
            assetKey: 'sign_high_voltage',
            w: 95,
            h: 95,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_elec',
            label: 'Aviso Alta Voltagem',
          },
          {
            id: 'sign_wet',
            type: 'SIGN_WET',
            assetKey: 'sign_wet_floor',
            w: 90,
            h: 114,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_wet_floor',
            label: 'Placa Piso Molhado',
          },
          {
            id: 'sign_rec',
            type: 'SIGN_RECYCLE',
            assetKey: 'sign_recycle',
            w: 90,
            h: 113,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_recycle_bin',
            label: 'Selo Reciclagem',
          },
          {
            id: 'sign_helm',
            type: 'SIGN_HELMET',
            assetKey: 'sign_safety_helmet',
            w: 104,
            h: 80,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_safety_wall',
            label: 'Placa Uso Obrigatório de EPI',
          },
          {
            id: 'sign_maint',
            type: 'SIGN_MAINTENANCE',
            assetKey: 'sign_maintenance',
            w: 95,
            h: 96,
            isDragging: false,
            isPlaced: false,
            targetId: 'target_drill',
            label: 'Equipamento em Manutenção',
          },
        ];

        // 5 Slots inside container "IDENTIFICAÇÃO PADRÃO 5S" (Centered: x: 380, y: 70, w: 600, h: 245)
        const stage4Slots = [
          {x: 415, y: 115},
          {x: 630, y: 115},
          {x: 845, y: 115},
          {x: 520, y: 205},
          {x: 735, y: 205},
        ];

        // Shuffle order of 5 identification plates inside container
        const shuffledStage4Signs = shuffle(stage4SignsPool);
        shuffledStage4Signs.forEach((sign, idx) => {
          const slot = stage4Slots[idx];
          newItems.push({
            ...sign,
            x: slot.x,
            y: slot.y,
            originalX: slot.x,
            originalY: slot.y,
          });
        });
      } else if (stageNumber === 5) {
        // --- FASE 5: SHITSUKE (Disciplina) ---
        newTargets.push(
          // Battery Shelf: Scaled +10% (233x244) and positioned higher up
          {
            id: 't5_shelf',
            type: 'SHELF',
            x: 85,
            y: 105,
            w: 233,
            h: 244,
            assetKey: 'shelf_batteries',
            label: 'Prateleira de Baterias',
            acceptedTypes: ['BATTERY'],
          },
          // Standalone Porta Esponja target (asset: porta_esponja)
          {
            id: 't5_clean_box',
            type: 'CLEANING_DOCK',
            x: 95,
            y: 395,
            w: 210,
            h: 164,
            assetKey: 'porta_esponja',
            label: 'Porta Esponja',
            acceptedTypes: ['SPONGE'],
          },
          {
            id: 't5_toolbox',
            type: 'TOOLBOX',
            x: 440,
            y: 450,
            w: 190,
            h: 182,
            assetKey: 'toolbox_station',
            label: 'Caixa de Ferramentas',
            acceptedTypes: ['TOOL_WRENCH'],
          },
          // Trash bin moved further right
          {
            id: 't5_trash',
            type: 'TRASH',
            x: 990,
            y: 470,
            w: 160,
            h: 188,
            assetKey: 'lixeira_papel',
            label: 'Lixeira da Oficina',
            acceptedTypes: ['PAPER_TRASH'],
            customRenderType: 'BLUE_TRASHCAN',
          },
          {
            id: 't5_wall',
            type: 'SAFETY_WALL',
            x: 1100,
            y: 170,
            w: 190,
            h: 200,
            assetKey: 'sign_safety_helmet',
            label: 'Entrada da Fábrica',
            acceptedTypes: ['SIGN_HELMET'],
            customRenderType: 'FACTORY_DOOR',
          },
        );

        newDirts.push({
          id: 'dirt_final_grease',
          assetKey: 'grease_stain',
          x: 440,
          y: 355,
          w: 220,
          h: 95,
          cleanProgress: 0,
          toolNeeded: 'SPONGE',
          isCleaned: false,
          type: 'GREASE_DARK',
        });

        newItems.push(
          // Battery: Starting position sits higher up (+20% size: 114x98)
          {
            id: 'i5_bat',
            type: 'BATTERY',
            assetKey: 'battery_good',
            x: 670,
            y: 135,
            originalX: 670,
            originalY: 135,
            w: 114,
            h: 98,
            isDragging: false,
            isPlaced: false,
            targetId: 't5_shelf',
            label: 'Bateria',
          },
          // Wrench: Swapped position with safety sign (placed at right table zone)
          {
            id: 'i5_wrench',
            type: 'TOOL_WRENCH',
            assetKey: 'tool_wrench',
            x: 880,
            y: 310,
            originalX: 880,
            originalY: 310,
            w: 90,
            h: 84,
            isDragging: false,
            isPlaced: false,
            targetId: 't5_toolbox',
            label: 'Chave de Boca',
          },
          // Sponge: Cleans stain first, then MUST be placed into "ITENS DE LIMPEZA" container
          {
            id: 'i5_sponge',
            type: 'SPONGE',
            assetKey: 'cleaning_sponge',
            x: 375,
            y: 250,
            originalX: 375,
            originalY: 250,
            w: 90,
            h: 78,
            isDragging: false,
            isPlaced: false,
            targetId: 't5_clean_box',
            label: 'Esponja (Limpar e Guardar)',
            isScrubTool: true,
            dirtySpotId: 'dirt_final_grease',
          },
          // Paper Ball: Moved higher up
          {
            id: 'i5_paper',
            type: 'PAPER_TRASH',
            assetKey: 'paper_ball_trash',
            x: 690,
            y: 430,
            originalX: 690,
            originalY: 430,
            w: 75,
            h: 75,
            isDragging: false,
            isPlaced: false,
            targetId: 't5_trash',
            label: 'Papel Amassado',
          },
          // Safety Sign: Swapped position with wrench (at x: 300, y: 500) and increased size by 15% (120x92)
          {
            id: 'i5_sign',
            type: 'SIGN_HELMET',
            assetKey: 'sign_safety_helmet',
            x: 300,
            y: 500,
            originalX: 300,
            originalY: 500,
            w: 120,
            h: 92,
            isDragging: false,
            isPlaced: false,
            targetId: 't5_wall',
            label: 'Placa Uso Obrigatório de EPI',
          },
        );
      }

      targetsRef.current = newTargets;
      itemsRef.current = newItems;
      dirtsRef.current = newDirts;
    },
    [triggerSpeech],
  );

  // Check stage completion
  const checkStageCompletion = useCallback(() => {
    const allItemsPlaced = itemsRef.current.every(
      (item) => item.isPlaced || (item.isScrubTool && item.cleanComplete),
    );
    const allDirtsCleaned = dirtsRef.current.every(
      (dirt) => dirt.isCleaned,
    );

    if (allItemsPlaced && allDirtsCleaned) {
      cheerTimerRef.current = 6;
      gameAudio.playLevelUpStinger();
      spawnParticles(canvasWidth / 2, canvasHeight / 3, 35, '#f59e0b', true);
      spawnParticles(canvasWidth * 0.8, canvasHeight / 2, 25, '#10b981', true);

      const currentStage = gameStateRef.current.level;
      setStageClearNumber(currentStage);
      setIsStageClearCelebration(true);

      if (currentStage < 5) {
        triggerSpeech(
          `Sensacional! A equipe da Oficina 5S completou a Etapa ${currentStage}! Rumo à próxima vitória!`,
          'PILOT',
        );

        const delay = (getConfig('autoAdvanceDelayMs') as number) + 1200;
        advanceTimerRef.current = window.setTimeout(() => {
          setIsStageClearCelebration(false);
          setGameState((prev) => {
            const nextLvl = prev.level + 1;
            setupStage(nextLvl);
            return {
              ...prev,
              level: nextLvl,
            };
          });
        }, delay);
      } else {
        // Final Victory
        triggerSpeech(
          'Parabéns! O Piloto 5S e toda a equipe da Oficina 5S celebram seu resultado!',
          'PILOT',
        );
        gameAudio.playVictoryFanfare();
        const victoryDelay = 1800;
        advanceTimerRef.current = window.setTimeout(() => {
          setIsStageClearCelebration(false);
          setGameState((prev) => ({
            ...prev,
            status: 'VICTORY',
          }));
        }, victoryDelay);
      }
    }
  }, [canvasWidth, canvasHeight, setupStage, spawnParticles, triggerSpeech]);

  // Pointer Interaction Logic (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState.status !== 'PLAYING' || isGameMenuOpen || isHowToPlayOpen || isStageClearCelebration)
      return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const py = (e.clientY - rect.top) * (canvasHeight / rect.height);

    pointerPosRef.current = {x: px, y: py, down: true};

    // Find highest z-index unplaced draggable item clicked
    for (let i = itemsRef.current.length - 1; i >= 0; i--) {
      const item = itemsRef.current[i];
      if (item.isPlaced) continue;

      if (
        px >= item.x &&
        px <= item.x + item.w &&
        py >= item.y &&
        py <= item.y + item.h
      ) {
        draggedItemIdRef.current = item.id;
        item.isDragging = true;
        dragOffsetRef.current = {x: px - item.x, y: py - item.y};

        // Move item to top of stack
        itemsRef.current.splice(i, 1);
        itemsRef.current.push(item);

        gameAudio.playCrispClick();
        triggerSpeech(`Movendo: ${item.label}`);
        break;
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (gameState.status !== 'PLAYING' || isGameMenuOpen || isHowToPlayOpen || isStageClearCelebration)
      return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (canvasWidth / rect.width);
    const py = (e.clientY - rect.top) * (canvasHeight / rect.height);

    pointerPosRef.current = {x: px, y: py, down: pointerPosRef.current.down};

    if (draggedItemIdRef.current) {
      const item = itemsRef.current.find(
        (it) => it.id === draggedItemIdRef.current,
      );
      if (item) {
        item.x = px - dragOffsetRef.current.x;
        item.y = py - dragOffsetRef.current.y;

        if (Math.random() < 0.3) {
          spawnParticles(item.x + item.w / 2, item.y + item.h / 2, 1, '#60a5fa');
        }

        // Scrubbing Mechanic (Phase 3 & 5)
        if (item.isScrubTool && item.dirtySpotId) {
          const dirt = dirtsRef.current.find(
            (d) => d.id === item.dirtySpotId,
          );
          if (dirt && !dirt.isCleaned) {
            const itemCenterX = item.x + item.w / 2;
            const itemCenterY = item.y + item.h / 2;
            const dirtCenterX = dirt.x + dirt.w / 2;
            const dirtCenterY = dirt.y + dirt.h / 2;
            const dist = Math.hypot(
              itemCenterX - dirtCenterX,
              itemCenterY - dirtCenterY,
            );

            if (dist < dirt.w * 0.7) {
              const scrubSpeed = getConfig(
                'scrubProgressPerMove',
              ) as number;
              dirt.cleanProgress = Math.min(
                100,
                dirt.cleanProgress + scrubSpeed,
              );

              if (Math.random() < 0.15) {
                gameAudio.playHoverMicroTone();
              }

              spawnParticles(
                itemCenterX + (Math.random() - 0.5) * 30,
                itemCenterY + (Math.random() - 0.5) * 30,
                2,
                '#38bdf8',
              );

              if (dirt.cleanProgress >= 100 && !dirt.isCleaned) {
                dirt.isCleaned = true;
                gameAudio.playPowerupChime();
                cheerTimerRef.current = 2.5;
                spawnParticles(
                  dirtCenterX,
                  dirtCenterY,
                  25,
                  '#34d399',
                  true,
                );
                spawnFloatingText(
                  'LIMPO E BRILHANDO! ✨',
                  dirtCenterX - 60,
                  dirtCenterY - 20,
                  '#10b981',
                );

                if (item.targetId) {
                  // Stage 5: Stain is clean, now sponge MUST be returned to "PORTA ESPONJA"
                  triggerSpeech(
                    'Bancada limpa! Agora guarde a esponja no Porta Esponja (Itens de Limpeza)!',
                    'MECH_RED',
                  );
                } else {
                  // Stage 3: Instant tool completion
                  item.cleanComplete = true;
                  triggerSpeech('Ficou limpo como novo! Excelente trabalho!', 'MECH_RED');
                  checkStageCompletion();
                }
              }
            }
          }
        }
      }
    }
  };

  const handlePointerUp = () => {
    pointerPosRef.current.down = false;

    if (!draggedItemIdRef.current) return;

    const item = itemsRef.current.find(
      (it) => it.id === draggedItemIdRef.current,
    );
    draggedItemIdRef.current = null;

    if (!item || item.isPlaced) return;
    item.isDragging = false;

    const itemCenterX = item.x + item.w / 2;
    const itemCenterY = item.y + item.h / 2;
    const snapDist = getConfig('snapMagneticDistance') as number;

    if (item.isScrubTool) {
      const dirt = dirtsRef.current.find((d) => d.id === item.dirtySpotId);
      const isDirtCleaned = dirt ? dirt.isCleaned : !!item.cleanComplete;

      // Stage 5 sponge container logic: sponge must be placed into "ITENS DE LIMPEZA" after cleaning
      if (item.targetId) {
        const target = targetsRef.current.find((t) => t.id === item.targetId);
        if (target) {
          const targetCenterX = target.x + target.w / 2;
          const targetCenterY = target.y + target.h / 2;
          const dist = Math.hypot(
            itemCenterX - targetCenterX,
            itemCenterY - targetCenterY,
          );

          if (dist <= snapDist + Math.max(target.w, target.h) * 0.45) {
            if (!isDirtCleaned) {
              gameAudio.playErrorBuzz();
              item.x = item.originalX;
              item.y = item.originalY;
              triggerSpeech(
                'Primeiro use a esponja para limpar a mancha na bancada!',
                'MECH_RED',
              );
              return;
            }

            // Successfully wiped bench AND stored sponge in container
            item.isPlaced = true;
            item.cleanComplete = true;
            item.x = targetCenterX - item.w / 2;
            item.y = targetCenterY - item.h / 2;

            gameAudio.playConfirmSelect();
            gameAudio.playCoinPickup();
            cheerTimerRef.current = 2.0;

            spawnParticles(targetCenterX, targetCenterY, 20, '#10b981', true);
            spawnFloatingText(
              '✔ GUARDADO!',
              targetCenterX - 40,
              targetCenterY - 30,
              '#34d399',
            );

            triggerSpeech(
              'Perfeito! Bancada limpa e esponja guardada no Porta Esponja!',
              'MECH_RED',
            );
            checkStageCompletion();
            return;
          }
        }

        // Dropped outside container
        item.x = item.originalX;
        item.y = item.originalY;
        if (isDirtCleaned) {
          triggerSpeech(
            'Bancada limpa! Guarde a esponja no Porta Esponja!',
            'MECH_RED',
          );
        } else {
          triggerSpeech(
            'Esfregue a esponja sobre a mancha para limpar!',
            'MECH_RED',
          );
        }
        return;
      }

      // Stage 3 tools return to dock
      item.x = item.originalX;
      item.y = item.originalY;
      if (!item.cleanComplete) {
        triggerSpeech('Esfregue o instrumento sobre a sujeira para limpar!', 'MECH_RED');
      }
      return;
    }

    const target = targetsRef.current.find((t) => t.id === item.targetId);
    let matched = false;

    if (target) {
      const targetCenterX = target.x + target.w / 2;
      const targetCenterY = target.y + target.h / 2;
      const dist = Math.hypot(
        itemCenterX - targetCenterX,
        itemCenterY - targetCenterY,
      );

      if (dist <= snapDist + Math.max(target.w, target.h) * 0.45) {
        matched = true;
        item.isPlaced = true;
        item.x = targetCenterX - item.w / 2;
        item.y = targetCenterY - item.h / 2;

        gameAudio.playConfirmSelect();
        gameAudio.playCoinPickup();
        cheerTimerRef.current = 2.0;

        spawnParticles(
          targetCenterX,
          targetCenterY,
          20,
          '#10b981',
          true,
        );
        spawnFloatingText(
          '✔ CORRETO!',
          targetCenterX - 40,
          targetCenterY - 30,
          '#34d399',
        );

        triggerSpeech(`Muito bem! Guardado com sucesso em: ${target.label}!`);
        checkStageCompletion();
      }
    }

    if (!matched) {
      const wrongTarget = targetsRef.current.find((t) => {
        const tCX = t.x + t.w / 2;
        const tCY = t.y + t.h / 2;
        return (
          Math.hypot(itemCenterX - tCX, itemCenterY - tCY) <=
          snapDist + Math.max(t.w, t.h) * 0.45
        );
      });

      gameAudio.playErrorBuzz();
      item.x = item.originalX;
      item.y = item.originalY;

      if (wrongTarget) {
        triggerSpeech(
          `Ops! ${item.label} não vai em ${wrongTarget.label}. Veja as orientações da equipe!`,
        );
      } else {
        triggerSpeech(
          `Coloque ${item.label} mais perto do local indicado!`,
        );
      }
    }
  };

  const initGame = useCallback(() => {
    setIsStageClearCelebration(false);
    setGameState({
      status: 'PLAYING',
      score: 0,
      level: 1,
    });
    setupStage(1);

    if (sdk) {
      sdk.startGame();
    }
  }, [sdk, setupStage]);

  usePlaygroundGameLifecycle(gameState, sdk);

  const hasAutoplayed = useRef(false);
  useEffect(() => {
    if (
      !hasAutoplayed.current &&
      new URLSearchParams(window.location.search).has('autoplay')
    ) {
      hasAutoplayed.current = true;
      initGame();
    }
  }, [initGame]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (gameState.status === 'PLAYING') {
          setIsGameMenuOpen((prev) => !prev);
          setIsHowToPlayOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status]);

  // Main Update
  const update = (deltaTime: number) => {
    if (gameState.status !== 'PLAYING' && gameState.status !== 'VICTORY') return;
    if (isGameMenuOpen) return;

    animTimeRef.current += deltaTime;

    if (cheerTimerRef.current > 0) {
      cheerTimerRef.current -= deltaTime;
    }

    // Particles
    for (let i = particlesRef.current.length - 1; i >= 0; i--) {
      const p = particlesRef.current[i];
      p.life += deltaTime;
      if (p.life >= p.maxLife) {
        particlesRef.current.splice(i, 1);
        continue;
      }
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vy += 120 * deltaTime;
      p.rotation += p.vRot * deltaTime;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
    }

    // Floating texts
    for (let i = floatingsRef.current.length - 1; i >= 0; i--) {
      const ft = floatingsRef.current[i];
      ft.y += ft.vy * deltaTime;
      ft.alpha -= 0.8 * deltaTime;
      ft.scale = Math.min(1.2, ft.scale + 0.3 * deltaTime);
      if (ft.alpha <= 0) {
        floatingsRef.current.splice(i, 1);
      }
    }
  };

  // Main Draw
  const draw = (ctx: CanvasRenderingContext2D) => {
    prepareCanvas(ctx, canvasWidth, canvasHeight);
    const t = animTimeRef.current;
    const isVictory = gameState.status === 'VICTORY';
    const bgImageKey = isVictory ? 'bg_celebration' : 'bg_workshop';

    // 1. Background
    drawBackground(
      ctx,
      assets[bgImageKey],
      canvasWidth,
      canvasHeight,
      '#1e293b',
    );

    if (isVictory) {
      // ==========================================
      // FINAL VICTORY SCREEN
      // Piloto_final (new_asset_1792275095016) celebrating on the left
      // Gold Trophy in center
      // 3 Mechanics celebrating on the right
      // Background: new_asset_1792278668983 (Fabrica final)
      // ==========================================
      const trophyW = 280;
      const trophyH = trophyW / (getConfig('assetTrophyAspectRatio') as number);
      const trophyX = canvasWidth / 2 - trophyW / 2;
      const trophyY = canvasHeight / 2 - trophyH / 2 + 10;

      // Glow backdrop
      const glowGrad = ctx.createRadialGradient(
        canvasWidth / 2,
        canvasHeight / 2 - 10,
        20,
        canvasWidth / 2,
        canvasHeight / 2 - 10,
        280,
      );
      glowGrad.addColorStop(0, 'rgba(250, 204, 21, 0.5)');
      glowGrad.addColorStop(0.5, 'rgba(234, 179, 8, 0.25)');
      glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(canvasWidth / 2, canvasHeight / 2 - 10, 280, 0, Math.PI * 2);
      ctx.fill();

      // Confetti
      for (let i = 0; i < 20; i++) {
        const cx = (Math.sin(t * 2 + i * 1.3) * 0.5 + 0.5) * canvasWidth;
        const cy = ((t * 80 + i * 45) % canvasHeight);
        ctx.fillStyle = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#eab308'][i % 5];
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(t * 3 + i);
        ctx.fillRect(-6, -6, 12, 12);
        ctx.restore();
      }

      // Draw Gold Trophy in center
      drawAsset(
        ctx,
        assets['trophy_5s_gold'],
        trophyX,
        trophyY,
        trophyW,
        trophyH,
        (fallbackCtx) => {
          fallbackCtx.fillStyle = '#eab308';
          fallbackCtx.fillRect(trophyX, trophyY, trophyW, trophyH);
        },
      );

      // --- LEFT SIDE: PILOTO_FINAL (new_asset_1792275095016) CELEBRATING ---
      const pilotFinalH = 340;
      const pilotFinalAspectRatio = (getConfig('assetPilotoFinalAspectRatio') as number) || 0.8209;
      const pilotFinalW = Math.round(pilotFinalH * pilotFinalAspectRatio);
      const pilotFinalX = 100;
      const celebrationBounce = Math.abs(Math.sin(t * 6)) * 22;
      const pilotFinalY = 370 - celebrationBounce;

      // Shadow below pilot
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      const shadowScale = Math.max(0.7, 1 - (celebrationBounce / 22) * 0.35);
      ctx.ellipse(
        pilotFinalX + pilotFinalW / 2,
        370 + pilotFinalH - 8,
        (pilotFinalW * 0.36) * shadowScale,
        14 * shadowScale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      drawAsset(
        ctx,
        assets['pilot_final'] || assets['piloto_final'],
        pilotFinalX,
        pilotFinalY,
        pilotFinalW,
        pilotFinalH,
        (fallbackCtx) => {
          fallbackCtx.fillStyle = '#f59e0b';
          fallbackCtx.fillRect(pilotFinalX, pilotFinalY, pilotFinalW, pilotFinalH);
        },
      );

      // Pilot Tag / Label
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pilotFinalX + pilotFinalW / 2 - 100, 715, 200, 36, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏎️ PILOTO 5S CAMPEÃO', pilotFinalX + pilotFinalW / 2, 738);
      ctx.restore();

      // --- RIGHT SIDE: 3 WORKSHOP MECHANICS CELEBRATING ---
      drawMechanicGrey(ctx, canvasWidth - 360, 530, 1.15, t, 'CHEER');
      drawMechanicBlue(ctx, canvasWidth - 240, 510, 1.2, t + 0.4, 'CHEER');
      drawMechanicRed(ctx, canvasWidth - 120, 530, 1.15, t + 0.8, 'CHEER');

      // Mechanics Group Tag
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(canvasWidth - 410, 650, 340, 36, 8);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚙️ EQUIPE OFICINA 5S', canvasWidth - 240, 673);
      ctx.restore();

    } else {
      // ==========================================
      // ACTIVE STAGE GAMEPLAY
      // ==========================================
      const isCheering = cheerTimerRef.current > 0 || isStageClearCelebration;

      // Mechanics Platform (Positioned in the upper right corner in all stages)
      const mechPlatformW = 350;
      const mechPlatformH = 102;
      const mechPlatformX = canvasWidth - mechPlatformW - 16;
      const mechPlatformY = 14;

      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(mechPlatformX, mechPlatformY, mechPlatformW, mechPlatformH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EQUIPE OFICINA 5S', mechPlatformX + mechPlatformW / 2, mechPlatformY + 16);

      // Edward Checker (Grey)
      drawMechanicGrey(
        ctx,
        mechPlatformX + 55,
        mechPlatformY + 54,
        0.58,
        t,
        isCheering ? 'CHEER' : (gameState.level === 1 || gameState.level === 4 ? 'WORK' : 'IDLE'),
      );
      // Otto Polack (Blue)
      drawMechanicBlue(
        ctx,
        mechPlatformX + 175,
        mechPlatformY + 54,
        0.58,
        t,
        isCheering ? 'CHEER' : (gameState.level === 2 ? 'WORK' : 'IDLE'),
      );
      // John Sparks (Red)
      drawMechanicRed(
        ctx,
        mechPlatformX + 295,
        mechPlatformY + 54,
        0.58,
        t,
        isCheering ? 'CHEER' : (gameState.level === 3 ? 'WORK' : 'IDLE'),
      );
      ctx.restore();

      // Stage 1: Right-hand "Área de Seleção" Dock Panel (shifted below top-right team platform)
      if (gameState.level === 1) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(830, 130, 510, 475, 18);
        ctx.fill();
        ctx.stroke();

        // Panel Header
        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
        ctx.beginPath();
        ctx.roundRect(840, 138, 490, 36, 10);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.font = '900 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📦 ÁREA DE SELEÇÃO (10 ITENS)', 1085, 162);

        // Slot Grid Outlines
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        const slotOutlines = [
          {x: 858, y: 175},
          {x: 1088, y: 175},
          {x: 858, y: 255},
          {x: 1088, y: 255},
          {x: 858, y: 335},
          {x: 1088, y: 335},
          {x: 858, y: 415},
          {x: 1088, y: 415},
          {x: 858, y: 495},
          {x: 1088, y: 495},
        ];
        slotOutlines.forEach((s) => {
          ctx.strokeRect(s.x, s.y, 126, 75);
        });
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Stage 2 Zones (Container LOCAIS DESIGNADOS alargado horizontalmente para caber o armário e reduzido verticalmente)
      if (gameState.level === 2) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(95, 125, 375, 455, 16);
        ctx.fill();
        ctx.stroke();

        // Header banner for Workbench
        ctx.fillStyle = 'rgba(234, 179, 8, 0.15)';
        ctx.beginPath();
        ctx.roundRect(105, 135, 355, 30, 8);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📦 BANCADA DE ITENS (9 ITENS)', 95 + 375 / 2, 156);

        // Designated areas container: widened horizontally to 820px, reduced vertically to 455px
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(495, 125, 820, 455, 16);
        ctx.fill();
        ctx.stroke();

        // Header banner for LOCAIS DESIGNADOS
        ctx.fillStyle = 'rgba(16, 185, 129, 0.18)';
        ctx.beginPath();
        ctx.roundRect(505, 135, 800, 30, 8);
        ctx.fill();

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏷️ LOCAIS DESIGNADOS (SEITON)', 495 + 820 / 2, 156);
        ctx.restore();
      }

      // Stage 3 Cleaning Tools Dock Box on Left (Elevated to upper storage area)
      if (gameState.level === 3) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(60, 70, 220, 335, 16);
        ctx.fill();
        ctx.stroke();

        // Header banner
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.beginPath();
        ctx.roundRect(70, 78, 200, 30, 8);
        ctx.fill();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '900 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧹 ITENS DE LIMPEZA', 170, 98);

        // Tool compartment slots outline with clean spacing
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(80, 116, 180, 82);
        ctx.strokeRect(80, 206, 180, 82);
        ctx.strokeRect(80, 296, 180, 92);
        ctx.setLineDash([]);
        ctx.restore();
      }

      // Stage 4 Container: "IDENTIFICAÇÃO PADRÃO 5S" (Centered on screen holding shuffled plates)
      if (gameState.level === 4) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.55)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(380, 70, 600, 245, 16);
        ctx.fill();
        ctx.stroke();

        // Container Title Header
        ctx.fillStyle = 'rgba(234, 179, 8, 0.2)';
        ctx.beginPath();
        ctx.roundRect(390, 78, 580, 32, 8);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.font = '900 15px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🛡️ IDENTIFICAÇÃO PADRÃO 5S', 680, 100);

        // Dashed slot outlines inside container
        ctx.strokeStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        const s4SlotOutlines = [
          {x: 405, y: 112, w: 110, h: 90},
          {x: 620, y: 112, w: 110, h: 90},
          {x: 835, y: 112, w: 110, h: 90},
          {x: 510, y: 202, w: 110, h: 95},
          {x: 725, y: 202, w: 110, h: 95},
        ];
        s4SlotOutlines.forEach((s) => {
          ctx.strokeRect(s.x, s.y, s.w, s.h);
        });
        ctx.setLineDash([]);
        ctx.restore();
      }



      // 3. Draw Targets
      targetsRef.current.forEach((target) => {
        const showOutline = getConfig('showMagneticOutline') as boolean;

        // Custom Target: RED DISCARD BOX (Stage 1 - No extra text badges)
        if (target.customRenderType === 'BOX_DISCARD') {
          ctx.save();
          if (showOutline) {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(target.x - 4, target.y - 4, target.w + 8, target.h + 8);
          }

          drawAsset(
            ctx,
            assets['box_discard_red'],
            target.x,
            target.y,
            target.w,
            target.h,
            (fallbackCtx) => {
              fallbackCtx.fillStyle = '#ef4444';
              fallbackCtx.fillRect(target.x, target.y, target.w, target.h);
            },
          );
          ctx.restore();
          return;
        }

        // Custom Target: GREEN USEFUL BOX (Stage 1 - No extra text badges)
        if (target.customRenderType === 'BOX_USEFUL') {
          ctx.save();
          if (showOutline) {
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.8)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(target.x - 4, target.y - 4, target.w + 8, target.h + 8);
          }

          drawAsset(
            ctx,
            assets['box_useful_green'],
            target.x,
            target.y,
            target.w,
            target.h,
            (fallbackCtx) => {
              fallbackCtx.fillStyle = '#10b981';
              fallbackCtx.fillRect(target.x, target.y, target.w, target.h);
            },
          );
          ctx.restore();
          return;
        }

        // Custom Target: WATER PUDDLE (Stage 4)
        if (target.customRenderType === 'WATER_PUDDLE') {
          ctx.save();
          const puddleGrad = ctx.createRadialGradient(
            target.x + target.w / 2 - 20,
            target.y + target.h / 2,
            10,
            target.x + target.w / 2,
            target.y + target.h / 2 + 10,
            target.w * 0.5,
          );
          puddleGrad.addColorStop(0, 'rgba(186, 230, 253, 0.85)');
          puddleGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.7)');
          puddleGrad.addColorStop(0.8, 'rgba(2, 132, 199, 0.75)');
          puddleGrad.addColorStop(1, 'rgba(3, 105, 161, 0.4)');

          ctx.fillStyle = puddleGrad;
          ctx.beginPath();
          ctx.ellipse(
            target.x + target.w / 2,
            target.y + target.h / 2 + 10,
            target.w * 0.48,
            target.h * 0.32,
            -0.05,
            0,
            Math.PI * 2,
          );
          ctx.fill();

          ctx.strokeStyle = 'rgba(251, 191, 36, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([6, 5]);
          ctx.strokeRect(target.x + 15, target.y + 10, target.w - 30, target.h - 20);

          ctx.fillStyle = '#fef08a';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillText('⚠️ PISO MOLHADO (SINALIZAR)', target.x + target.w / 2, target.y + target.h + 18);
          ctx.shadowBlur = 0;
          ctx.restore();
          return;
        }

        // Custom Target: FACTORY ACCESS DOOR (Stage 4 & 5)
        if (target.customRenderType === 'FACTORY_DOOR') {
          ctx.save();
          ctx.fillStyle = '#334155';
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(target.x, target.y, target.w, target.h, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#1e293b';
          ctx.fillRect(target.x + 8, target.y + 40, target.w - 16, target.h - 48);

          ctx.fillStyle = '#facc15';
          ctx.fillRect(target.x + 4, target.y + 6, target.w - 8, 28);
          ctx.fillStyle = '#0f172a';
          ctx.font = '900 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('ACESSO À FÁBRICA', target.x + target.w / 2, target.y + 24);

          ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(target.x + 35, target.y + 55, target.w - 70, target.h - 90);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 4;
          ctx.fillText(target.label, target.x + target.w / 2, target.y + target.h + 18);
          ctx.shadowBlur = 0;
          ctx.restore();
          return;
        }

        // Custom Target: BLUE TRASHCAN (Lixeira de Papel)
        if (target.customRenderType === 'BLUE_TRASHCAN') {
          ctx.save();
          if (showOutline) {
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.7)';
            ctx.lineWidth = 3;
            ctx.setLineDash([8, 6]);
            ctx.strokeRect(target.x - 4, target.y - 4, target.w + 8, target.h + 8);
          }

          drawAsset(
            ctx,
            assets['lixeira_papel'] || assets['workshop_trashcan'],
            target.x,
            target.y,
            target.w,
            target.h,
            (fallbackCtx) => {
              fallbackCtx.fillStyle = '#2563eb';
              fallbackCtx.fillRect(target.x, target.y, target.w, target.h);
            },
          );

          ctx.fillStyle = '#93c5fd';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 4;
          ctx.fillText(target.label, target.x + target.w / 2, target.y + target.h + 18);
          ctx.shadowBlur = 0;
          ctx.restore();
          return;
        }

        // Standard Targets (using image assets)
        if (showOutline) {
          ctx.save();
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 3;
          ctx.setLineDash([8, 6]);
          ctx.strokeRect(target.x - 4, target.y - 4, target.w + 8, target.h + 8);
          ctx.restore();
        }

        drawAsset(
          ctx,
          assets[target.assetKey],
          target.x,
          target.y,
          target.w,
          target.h,
          (fallbackCtx) => {
            fallbackCtx.fillStyle = 'rgba(16, 185, 129, 0.4)';
            fallbackCtx.fillRect(target.x, target.y, target.w, target.h);
          },
        );

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 4;
        ctx.fillText(target.label, target.x + target.w / 2, target.y + target.h + 18);
        ctx.shadowBlur = 0;
      });

      // 4. Draw Dirt Spots (Phase 3 & 5)
      dirtsRef.current.forEach((dirt) => {
        if (dirt.isCleaned) return;

        const opacity = Math.max(0.15, 1 - dirt.cleanProgress / 100);
        ctx.save();
        ctx.globalAlpha = opacity;

        if (dirt.type === 'GREASE_DARK' || dirt.assetKey === 'grease_stain') {
          // Draw grease stain image or splash
          if (assets['grease_stain'] && assets['grease_stain']?.complete) {
            drawAsset(
              ctx,
              assets['grease_stain'],
              dirt.x,
              dirt.y,
              dirt.w,
              dirt.h,
              () => {},
            );
          } else {
            const cx = dirt.x + dirt.w / 2;
            const cy = dirt.y + dirt.h / 2;
            ctx.fillStyle = '#09090b';
            ctx.beginPath();
            ctx.ellipse(cx, cy, dirt.w * 0.42, dirt.h * 0.38, 0.08, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (dirt.type === 'NAVY_SPILL') {
          // Fluid spill on floor
          const cx = dirt.x + dirt.w / 2;
          const cy = dirt.y + dirt.h / 2;

          const navyGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, dirt.w * 0.5);
          navyGrad.addColorStop(0, '#0f172a');
          navyGrad.addColorStop(0.5, '#1e293b');
          navyGrad.addColorStop(0.85, '#0c4a6e');
          navyGrad.addColorStop(1, 'rgba(12, 74, 110, 0)');

          ctx.fillStyle = navyGrad;
          ctx.beginPath();
          ctx.ellipse(cx, cy, dirt.w * 0.46, dirt.h * 0.4, -0.04, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(cx - dirt.w * 0.35, cy + 5, 15, 0, Math.PI * 2);
          ctx.arc(cx + dirt.w * 0.32, cy - 10, 18, 0, Math.PI * 2);
          ctx.arc(cx + dirt.w * 0.2, cy + dirt.h * 0.28, 16, 0, Math.PI * 2);
          ctx.arc(cx - dirt.w * 0.2, cy - dirt.h * 0.25, 14, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Window Dirt
          ctx.fillStyle = 'rgba(71, 85, 105, 0.85)';
          ctx.beginPath();
          ctx.ellipse(
            dirt.x + dirt.w / 2,
            dirt.y + dirt.h / 2,
            dirt.w / 2,
            dirt.h / 2,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }

        // Progress ring
        if (dirt.cleanProgress > 0) {
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(
            dirt.x + dirt.w / 2,
            dirt.y + dirt.h / 2,
            Math.min(dirt.w, dirt.h) / 2 + 10,
            -Math.PI / 2,
            -Math.PI / 2 + (Math.PI * 2 * dirt.cleanProgress) / 100,
          );
          ctx.stroke();
        }

        ctx.restore();
      });

      // 5. Draw Draggable Items
      itemsRef.current.forEach((item) => {
        if (item.isPlaced && !item.isScrubTool) {
          ctx.save();
          drawAsset(
            ctx,
            assets[item.assetKey],
            item.x,
            item.y,
            item.w,
            item.h,
            (fallbackCtx) => {
              fallbackCtx.fillStyle = '#22c55e';
              fallbackCtx.fillRect(item.x, item.y, item.w, item.h);
            },
          );

          drawAsset(
            ctx,
            assets['star_gold'],
            item.x + item.w - 24,
            item.y - 12,
            28,
            28,
            () => {},
          );
          ctx.restore();
          return;
        }

        ctx.save();
        if (item.isDragging) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
          ctx.shadowBlur = 16;
          ctx.shadowOffsetY = 12;
          ctx.translate(item.x + item.w / 2, item.y + item.h / 2);
          ctx.scale(1.12, 1.12);
          ctx.translate(-item.w / 2, -item.h / 2);

          drawAsset(
            ctx,
            assets[item.assetKey],
            0,
            0,
            item.w,
            item.h,
            (fallbackCtx) => {
              fallbackCtx.fillStyle = '#f59e0b';
              fallbackCtx.fillRect(0, 0, item.w, item.h);
            },
          );
        } else {
          drawAsset(
            ctx,
            assets[item.assetKey],
            item.x,
            item.y,
            item.w,
            item.h,
            (fallbackCtx) => {
              fallbackCtx.fillStyle = '#3b82f6';
              fallbackCtx.fillRect(item.x, item.y, item.w, item.h);
            },
          );
        }
        ctx.restore();
      });

      // 6. Draw PILOTO_FASES (new_asset_1792274647817) on Bottom-Left
      const pilotStageH = 260;
      const pilotStageAspectRatio = (getConfig('assetPilotoFasesAspectRatio') as number) || 0.6415;
      const pilotStageW = Math.round(pilotStageH * pilotStageAspectRatio);
      const pilotStageX = 25;
      const isPilotCheering = cheerTimerRef.current > 0 || isStageClearCelebration;
      const pilotBounce = isPilotCheering
        ? Math.abs(Math.sin(t * 8)) * 14
        : Math.sin(t * 2.5) * 2;
      const pilotStageY = 500 - pilotBounce;

      // Shadow below stage pilot
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      const sScale = Math.max(0.75, 1 - (pilotBounce / 14) * 0.2);
      ctx.ellipse(
        pilotStageX + pilotStageW / 2,
        500 + pilotStageH - 10,
        (pilotStageW * 0.34) * sScale,
        10 * sScale,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.restore();

      drawAsset(
        ctx,
        assets['pilot_stage'] || assets['piloto_fases'],
        pilotStageX,
        pilotStageY,
        pilotStageW,
        pilotStageH,
        (fallbackCtx) => {
          fallbackCtx.fillStyle = '#10b981';
          fallbackCtx.fillRect(pilotStageX, pilotStageY, pilotStageW, pilotStageH);
        },
      );

      // 7. Stage Clear Celebration
      if (isStageClearCelebration) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const bannerX = 140;
        const bannerY = 220;
        const bannerW = 540;
        const bannerH = 320;

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(bannerX, bannerY, bannerW, bannerH, 24);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.font = '900 36px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PARABÉNS! 🎉', bannerX + bannerW / 2, bannerY + 60);

        ctx.fillStyle = '#34d399';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`ETAPA ${stageClearNumber} CONCLUÍDA!`, bannerX + bannerW / 2, bannerY + 110);

        ctx.fillStyle = '#cbd5e1';
        ctx.font = '16px sans-serif';
        ctx.fillText('A equipe da Oficina 5S comemora seu sucesso!', bannerX + bannerW / 2, bannerY + 160);
        ctx.fillText('Excelente domínio dos princípios do 5S!', bannerX + bannerW / 2, bannerY + 195);

        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('Avançando para a próxima etapa...', bannerX + bannerW / 2, bannerY + 260);

        // Mechanics Cheering on the RIGHT SIDE
        drawMechanicGrey(ctx, 840, 480, 1.25, t, 'CHEER');
        drawMechanicBlue(ctx, 990, 460, 1.3, t + 0.3, 'CHEER');
        drawMechanicRed(ctx, 1140, 480, 1.25, t + 0.6, 'CHEER');

        for (let i = 0; i < 15; i++) {
          const fx = 760 + Math.random() * 450;
          const fy = 160 + (Math.sin(t * 5 + i) * 0.5 + 0.5) * 350;
          ctx.fillStyle = ['#f59e0b', '#10b981', '#38bdf8', '#ec4899', '#eab308'][i % 5];
          ctx.beginPath();
          ctx.arc(fx, fy, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    }

    // 8. Draw Particles
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      if (p.isStar) {
        drawAsset(
          ctx,
          assets['star_gold'],
          -p.size / 2,
          -p.size / 2,
          p.size,
          p.size,
          (fallbackCtx) => {
            fallbackCtx.fillStyle = '#facc15';
            fallbackCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          },
        );
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    });

    // 9. Draw Floating Texts
    floatingsRef.current.forEach((ft) => {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    });
  };

  const updateRef = useRef(update);
  const drawRef = useRef(draw);
  updateRef.current = update;
  drawRef.current = draw;

  useEffect(() => {
    let raf = 0;
    const loop = (time: number) => {
      stepperRef.current?.(time, (dt) => updateRef.current(dt));
      const ctx = canvasRef.current?.getContext('2d');
      if (ctx) drawRef.current(ctx);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const startButtonRef = useAutoFocus<HTMLButtonElement>(
    gameState.status === 'START',
  );

  const currentStageInfo =
    STAGES_5S_INFO[gameState.level - 1] || STAGES_5S_INFO[0];

  const currentBgmUrl =
    gameState.status === 'VICTORY'
      ? 'assets/audio/bgm_celebration_victory.mp3'
      : 'assets/audio/bgm_workshop_theme.mp3';

  const completedTasks =
    itemsRef.current.filter(
      (item) => item.isPlaced || (item.isScrubTool && item.cleanComplete),
    ).length + dirtsRef.current.filter((dirt) => dirt.isCleaned).length;
  const totalTasks = itemsRef.current.length + dirtsRef.current.length;

  // Speaker Badge Styles
  const getSpeakerBadgeStyle = () => {
    switch (currentSpeaker.speaker) {
      case 'MECH_GREY':
        return {
          bg: 'bg-slate-700',
          border: 'border-slate-400',
          text: 'text-slate-200',
          ping: 'bg-slate-300',
          icon: '🔧',
        };
      case 'MECH_BLUE':
        return {
          bg: 'bg-blue-700',
          border: 'border-blue-400',
          text: 'text-blue-100',
          ping: 'bg-blue-400',
          icon: '🛠️',
        };
      case 'MECH_RED':
        return {
          bg: 'bg-red-700',
          border: 'border-red-400',
          text: 'text-red-100',
          ping: 'bg-red-400',
          icon: '⚡',
        };
      case 'PILOT':
      default:
        return {
          bg: 'bg-emerald-700',
          border: 'border-yellow-400',
          text: 'text-yellow-300',
          ping: 'bg-yellow-400',
          icon: '🏎️',
        };
    }
  };

  const badgeStyle = getSpeakerBadgeStyle();

  return (
    <div className="fixed inset-0 overflow-hidden touch-none flex flex-col items-center justify-between bg-slate-950 text-white font-sans select-none">
      {!assetsReady && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-white font-sans">
          <div className="text-xl font-bold flex items-center gap-3">
            <RotateCw className="animate-spin text-emerald-400" size={28} />
            Carregando a Oficina 5S...
          </div>
        </div>
      )}

      <BackgroundMusic
        url={currentBgmUrl}
        isPlaying={gameState.status === 'PLAYING' || gameState.status === 'VICTORY'}
        isMuted={isMusicMuted}
      />

      {/* TOP HUD BAR */}
      <header className="w-full bg-slate-900/95 border-b border-slate-800 px-4 py-2 z-20 shrink-0 flex flex-wrap items-center justify-between gap-2 shadow-md">
        {/* Left: Brand & Stage info */}
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 text-white font-black text-xs px-2.5 py-1 rounded-md tracking-wider flex items-center gap-1.5 shadow">
            <Trophy size={14} className="text-yellow-300" />
            OFICINA 5S
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-yellow-400">
              Etapa {gameState.level}/5: {currentStageInfo.name}
            </span>
            <span className="text-[10px] text-slate-300 hidden sm:inline">
              {currentStageInfo.subtitle}
            </span>
          </div>
        </div>

        {/* Center: 5S Step Badges */}
        <div className="flex items-center gap-1">
          {STAGES_5S_INFO.map((st) => {
            const isDone = st.number < gameState.level;
            const isCurrent = st.number === gameState.level;
            return (
              <div
                key={st.number}
                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 ring-1 ring-emerald-300'
                    : isCurrent
                      ? 'bg-yellow-400 text-slate-950 animate-pulse font-black'
                      : 'bg-slate-800 text-slate-400'
                }`}>
                {st.number}º
              </div>
            );
          })}
        </div>

        {/* Right: Task Progress & Menu Trigger */}
        <div className="flex items-center gap-3">
          {gameState.status === 'PLAYING' && totalTasks > 0 && (
            <div className="bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
              <Sparkles size={14} className="text-yellow-400" />
              Tarefas: {completedTasks}/{totalTasks}
            </div>
          )}

          <button
            onClick={() => setIsGameMenuOpen(true)}
            data-testid="menu-button"
            className="min-w-[48px] min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-lg border border-slate-700 flex items-center justify-center p-2 transition-colors shadow"
            title="Abrir Menu (Esc)">
            <Menu size={20} />
          </button>
        </div>
      </header>

      {/* ACTIVE CANVAS VIEWPORT */}
      <main className="flex-1 w-full min-h-0 relative flex items-center justify-center bg-slate-950 overflow-hidden">
        {assetsReady && (
          <canvas
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              aspectRatio: `${canvasWidth} / ${canvasHeight}`,
              width: `min(100%, calc(100vh * ${canvasWidth} / ${canvasHeight}))`,
            }}
            className="h-auto max-w-full max-h-full cursor-grab active:cursor-grabbing touch-none"
          />
        )}

        {/* Mascot / Mechanic Speech Bubble Overlay (guarded with pointer-events-none & kept to the left zone) */}
        {gameState.status === 'PLAYING' && !isGameMenuOpen && !isStageClearCelebration && (
          <div
            className={`absolute bottom-3 left-3 sm:left-6 md:left-36 max-w-[calc(100%-1.5rem)] sm:max-w-sm md:max-w-md bg-white/95 text-slate-900 p-3 rounded-2xl shadow-xl border-2 pointer-events-none select-none ${
              currentSpeaker.speaker === 'MECH_GREY'
                ? 'border-slate-500'
                : currentSpeaker.speaker === 'MECH_BLUE'
                  ? 'border-blue-500'
                  : currentSpeaker.speaker === 'MECH_RED'
                    ? 'border-red-500'
                    : 'border-emerald-500'
            } z-10 transition-transform ${
              speechShake ? 'scale-105 ring-2 ring-yellow-400' : 'scale-100'
            }`}>
            <div className="flex items-center justify-between gap-2 mb-1">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm ${badgeStyle.bg} ${badgeStyle.text}`}>
                <span className={`w-2 h-2 rounded-full ${badgeStyle.ping} animate-ping inline-block`} />
                <span>{badgeStyle.icon}</span>
                {currentSpeaker.name}
              </span>
              <span className="text-[9px] font-semibold text-slate-500">
                {currentSpeaker.role}
              </span>
            </div>
            <p className="text-xs md:text-sm font-semibold mt-0.5 leading-snug">
              {mascotText}
            </p>
          </div>
        )}
      </main>

      {/* START MENU OVERLAY (Compact, Streamlined & Zero-Scroll Layout) */}
      {gameState.status === 'START' && (
        <MenuOverlay tone="neutral" zIndex={50}>
          <div className="w-full max-w-lg flex flex-col items-center bg-slate-900/95 border-2 border-emerald-500 rounded-2xl p-4 sm:p-5 m-2 shadow-2xl text-center backdrop-blur-sm">
            {/* Header with Trophy Badge */}
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-yellow-400 shadow-inner">
                <Trophy size={22} className="text-yellow-400" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl sm:text-3xl font-black text-yellow-400 tracking-tight leading-none">
                  OFICINA 5S
                </h1>
                <p className="text-[11px] sm:text-xs text-emerald-300 font-semibold tracking-wide">
                  Treinamento Oficial dos 5 Sensos na Oficina
                </p>
              </div>
            </div>

            {/* Crew Badges Row */}
            <div className="w-full bg-slate-800/80 rounded-xl p-2 sm:p-2.5 mb-2 border border-slate-700/80">
              <div className="flex items-center justify-between gap-1 text-[10px] sm:text-[11px] font-bold">
                <span className="flex-1 bg-slate-900/80 py-1 px-1.5 rounded-lg border border-slate-600 text-slate-200">
                  🔧 <span className="text-slate-100 font-extrabold">Edward</span><br/>
                  <span className="text-[8px] sm:text-[9px] font-normal text-slate-400">Qualidade</span>
                </span>
                <span className="flex-1 bg-blue-950/70 py-1 px-1.5 rounded-lg border border-blue-600 text-blue-200">
                  🛠️ <span className="text-blue-100 font-extrabold">Otto</span><br/>
                  <span className="text-[8px] sm:text-[9px] font-normal text-blue-300">Mecânica</span>
                </span>
                <span className="flex-1 bg-red-950/70 py-1 px-1.5 rounded-lg border border-red-600 text-red-200">
                  ⚡ <span className="text-red-100 font-extrabold">John</span><br/>
                  <span className="text-[8px] sm:text-[9px] font-normal text-red-300">Elétrica</span>
                </span>
                <span className="flex-1 bg-emerald-950/70 py-1 px-1.5 rounded-lg border border-emerald-500 text-emerald-200">
                  🏎️ <span className="text-yellow-300 font-extrabold">Piloto 5S</span><br/>
                  <span className="text-[8px] sm:text-[9px] font-normal text-emerald-300">Instrutor</span>
                </span>
              </div>
            </div>

            {/* 5S Missions Compact Grid */}
            <div className="w-full bg-slate-800/80 rounded-xl p-2.5 mb-3 border border-slate-700/80 text-left">
              <div className="text-[11px] sm:text-xs font-black text-yellow-400 mb-1.5 flex items-center gap-1.5">
                <Sparkles size={13} />
                5 Etapas Práticas:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2.5 gap-y-1 text-[11px] sm:text-[12px] text-slate-300 leading-snug">
                <div className="flex items-start gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded shrink-0">1º</span>
                  <span><strong className="text-emerald-400">Seiri:</strong> Separar útil de descarte</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded shrink-0">2º</span>
                  <span><strong className="text-emerald-400">Seiton:</strong> Organizar itens no lugar</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded shrink-0">3º</span>
                  <span><strong className="text-emerald-400">Seiso:</strong> Limpar bancada, piso e lixo</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-1.5 py-0.2 rounded shrink-0">4º</span>
                  <span><strong className="text-emerald-400">Seiketsu:</strong> Fixar placas e EPIs</span>
                </div>
                <div className="flex items-start gap-1.5 sm:col-span-2">
                  <span className="bg-yellow-500/20 text-yellow-300 text-[10px] font-black px-1.5 py-0.2 rounded shrink-0">5º</span>
                  <span><strong className="text-yellow-400">Shitsuke:</strong> Auditoria 5S e conquista do Troféu de Ouro!</span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              ref={startButtonRef}
              autoFocus
              onClick={initGame}
              data-testid="start-button"
              className="min-w-[48px] min-h-[48px] w-full bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black text-base sm:text-lg py-2.5 rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2">
              <Play size={20} fill="currentColor" />
              COMEÇAR OFICINA 5S
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* GAME MENU OVERLAY */}
      {isGameMenuOpen && (
        <MenuOverlay tone="neutral" zIndex={60}>
          <div className="w-full max-w-md flex flex-col items-center bg-slate-900 border-2 border-slate-700 rounded-2xl p-6 m-4 shadow-2xl">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <Menu size={22} />
                Menu da Oficina
              </h2>
              <button
                onClick={() => setIsGameMenuOpen(false)}
                className="min-w-[48px] min-h-[48px] p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <button
                onClick={() => setIsGameMenuOpen(false)}
                autoFocus
                className="min-w-[48px] min-h-[48px] w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
                <Play size={18} />
                Continuar Jogo
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setIsMusicMuted((prev) => !prev)}
                  className={`min-w-[48px] min-h-[48px] font-semibold py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs transition-colors ${
                    isMusicMuted
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                  }`}>
                  {isMusicMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  Música: {isMusicMuted ? 'Mudo' : 'Ligada'}
                </button>

                <button
                  onClick={() => {
                    const newMuted = gameAudio.toggleMute();
                    setIsSfxMuted(newMuted);
                  }}
                  className={`min-w-[48px] min-h-[48px] font-semibold py-2 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs transition-colors ${
                    isSfxMuted
                      ? 'bg-slate-800 text-slate-400 border-slate-700'
                      : 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                  }`}>
                  {isSfxMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  Efeitos: {isSfxMuted ? 'Mudo' : 'Ligados'}
                </button>
              </div>

              <button
                onClick={() => {
                  setupStage(gameState.level);
                  setIsGameMenuOpen(false);
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors">
                <RotateCw size={18} />
                Reiniciar Esta Etapa
              </button>

              <button
                onClick={() => setIsHowToPlayOpen(true)}
                className="min-w-[48px] min-h-[48px] w-full bg-slate-800 hover:bg-slate-700 text-yellow-400 font-bold py-2.5 px-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-colors">
                <HelpCircle size={18} />
                Como Jogar (Guia 5S)
              </button>

              <button
                onClick={() => {
                  setIsGameMenuOpen(false);
                  setIsHowToPlayOpen(false);
                  setGameState((prev) => ({...prev, status: 'START'}));
                }}
                className="min-w-[48px] min-h-[48px] w-full bg-red-950/60 hover:bg-red-900/80 text-red-300 font-bold py-2.5 px-4 rounded-xl border border-red-800/60 flex items-center justify-center gap-2 transition-colors">
                Sair para o Início
              </button>
            </div>
          </div>
        </MenuOverlay>
      )}

      {/* HOW TO PLAY OVERLAY */}
      {isHowToPlayOpen && (
        <MenuOverlay tone="neutral" zIndex={70}>
          <div className="w-full max-w-md flex flex-col items-center bg-slate-900 border-2 border-yellow-500 rounded-2xl p-6 m-4 shadow-2xl text-left">
            <div className="w-full flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h2 className="text-xl font-bold text-yellow-400 flex items-center gap-2">
                <HelpCircle size={22} />
                Como Jogar a Oficina 5S
              </h2>
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="min-w-[48px] min-h-[48px] p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white flex items-center justify-center">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed overflow-y-auto max-h-[60vh] pr-1">
              <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
                <p className="font-bold text-emerald-400">🖱️ Controles Simples:</p>
                <p>
                  Toque e arraste com o dedo no celular ou clique e arraste com o mouse para movimentar peças, ferramentas e placas até os alvos.
                </p>
              </div>

              <div className="space-y-2">
                <p>
                  <strong className="text-yellow-400">1. Seiri (Utilização):</strong> Selecione as peças na <strong>Área de Seleção</strong> à direita e separe ferramentas úteis na Caixa Verde e sucatas/lixo na Caixa Vermelha com <strong>Edward Checker</strong>.
                </p>
                <p>
                  <strong className="text-yellow-400">2. Seiton (Organização):</strong> Encaixe os 9 itens na prateleira, ganchos de parede (vassoura e mop), armário, gaveta ou bancada junto com <strong>Otto Polack</strong>.
                </p>
                <p>
                  <strong className="text-yellow-400">3. Seiso (Limpeza):</strong> Pegue ferramentas no painel de limpeza para esfregar a bancada, limpar o vidro, passar o mop e recolher o lixo com <strong>John Sparks</strong>.
                </p>
                <p>
                  <strong className="text-yellow-400">4. Seiketsu (Padronização):</strong> Posicione as placas de perigo elétrico, uso obrigatório de EPI, lixeira de reciclagem e "Equipamento em Manutenção" na Furadeira de Bancada.
                </p>
                <p>
                  <strong className="text-yellow-400">5. Shitsuke (Disciplina):</strong> Mantenha a excelência contínua com o <strong>Piloto 5S</strong> e celebre a vitória com toda a equipe!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHowToPlayOpen(false)}
              className="min-w-[48px] min-h-[48px] w-full mt-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold py-2.5 rounded-xl transition-colors">
              Entendi, Voltar ao Jogo
            </button>
          </div>
        </MenuOverlay>
      )}

      {/* VICTORY OVERLAY (FINAL SCREEN - Compact and Perfectly Proportioned) */}
      {gameState.status === 'VICTORY' && (
        <MenuOverlay tone="victory" zIndex={50}>
          <div className="w-full max-w-md flex flex-col items-center bg-slate-900/95 border-2 border-yellow-400 rounded-2xl p-4 sm:p-5 m-2 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-full bg-yellow-400/20 border-2 border-yellow-400 flex items-center justify-center mb-2 animate-bounce shadow-md">
              <Trophy size={30} className="text-yellow-400" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-yellow-400 mb-0.5">
              PARABÉNS!
            </h1>
            <p className="text-xs sm:text-sm font-bold text-emerald-400 mb-2">
              OFICINA 5S 100% CERTIFICADA!
            </p>

            <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 w-full mb-3 text-slate-200 text-xs space-y-1.5">
              <div className="text-yellow-400 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-1.5">
                <Sparkles size={16} />
                5 Sensos Concluídos com Excelência!
              </div>
              <p className="text-[11px] sm:text-xs text-slate-300 leading-snug">
                O Piloto 5S e toda a equipe da Oficina 5S comemoram sua aprovação máxima em Qualidade, Organização e Segurança!
              </p>
              <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] font-semibold text-slate-300">
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-600">
                  🔧 Edward<br/><span className="text-emerald-400 font-bold">Aprovado ✔</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-600">
                  🛠️ Otto<br/><span className="text-emerald-400 font-bold">Organizado ✔</span>
                </div>
                <div className="bg-slate-900/80 p-1.5 rounded-lg border border-slate-600">
                  ⚡ John<br/><span className="text-emerald-400 font-bold">Seguro ✔</span>
                </div>
              </div>
            </div>

            <button
              onClick={initGame}
              autoFocus
              className="min-w-[48px] min-h-[48px] w-full bg-yellow-400 hover:bg-yellow-300 active:bg-yellow-500 text-slate-950 font-black text-base sm:text-lg py-2.5 rounded-xl transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2">
              <RotateCw size={20} />
              JOGAR NOVAMENTE
            </button>
          </div>
        </MenuOverlay>
      )}
    </div>
  );
}
