import {SpriteConfig} from './utils/helper';

/**
 * Configuration for the game Oficina 5S.
 */
export const CONFIG = {
  // Game metadata & initialization
  title: {
    value: 'Oficina 5S',
    type: 'string',
    label: 'Game Title',
    group: 'GAME',
  },
  baseCanvasWidth: {
    value: 1376,
    type: 'number',
    label: 'Base Canvas Width',
    group: 'GAME',
  },
  baseCanvasHeight: {
    value: 768,
    type: 'number',
    label: 'Base Canvas Height',
    group: 'GAME',
  },

  // System Constants for the game loop
  targetFPS: {
    value: 60,
    type: 'number',
    label: 'Target FPS',
    group: 'SYSTEM',
  },
  stepMs: {
    value: 1000 / 60,
    type: 'number',
    label: 'Step MS',
    group: 'SYSTEM',
  },
  maxSubSteps: {
    value: 5,
    type: 'number',
    label: 'Max Sub Steps',
    group: 'SYSTEM',
  },

  // Thematic UI styling
  backgroundColor: {
    value: '#0f172a',
    type: 'color',
    label: 'Background Color',
    group: 'THEME',
  },
  primaryColor: {
    value: '#10b981',
    type: 'color',
    label: 'Primary Color',
    group: 'THEME',
  },
  accentColor: {
    value: '#f59e0b',
    type: 'color',
    label: 'Accent Color',
    group: 'THEME',
  },
  fontFamily: {
    value: 'system-ui, -apple-system, sans-serif',
    type: 'string',
    label: 'Font Family',
    group: 'THEME',
  },

  // Audio configuration
  defaultMusicVolume: {
    value: 0.5,
    type: 'number',
    label: 'Default Music Volume',
    group: 'AUDIO',
  },
  defaultSfxVolume: {
    value: 0.7,
    type: 'number',
    label: 'Default SFX Volume',
    group: 'AUDIO',
  },

  // Gameplay Rules & Tuning
  pointsPerCorrectPlacement: {
    value: 100,
    type: 'number',
    label: 'Pontos por Acerto',
    group: 'Rules',
  },
  scrubProgressPerMove: {
    value: 2.2,
    type: 'number',
    label: 'Velocidade de Limpeza (Esfregar)',
    group: 'Rules',
  },
  snapMagneticDistance: {
    value: 95,
    type: 'number',
    label: 'Distância Magnética de Encaixe',
    group: 'Rules',
  },
  celebrationDurationSec: {
    value: 6,
    type: 'number',
    label: 'Duração da Celebração',
    group: 'Rules',
  },
  autoAdvanceDelayMs: {
    value: 2200,
    type: 'number',
    label: 'Tempo para Próxima Fase (ms)',
    group: 'Rules',
  },
  showMagneticOutline: {
    value: true,
    type: 'boolean',
    label: 'Mostrar Destaque nos Alvos',
    group: 'Visuals',
  },

  // Sprites
  playerSprite: {
    value: undefined as SpriteConfig | undefined,
    type: 'sprite',
    label: 'Player Sprite',
    group: 'Visuals',
  },

  // Asset Aspect Ratios & Dimension Helpers
  assetBgWorkshopAspectRatio: {
    value: 1.7916,
    type: 'number',
    label: 'Oficina Background Aspect Ratio',
    group: 'ASSETS',
  },
  assetBgCelebrationAspectRatio: {
    value: 1.7916,
    type: 'number',
    label: 'Celebration Background Aspect Ratio',
    group: 'ASSETS',
  },
  assetBoxUsefulAspectRatio: {
    value: 0.9937,
    type: 'number',
    label: 'Caixa Útil Aspect Ratio',
    group: 'ASSETS',
  },
  assetBoxDiscardAspectRatio: {
    value: 0.9577,
    type: 'number',
    label: 'Caixa Descarte Aspect Ratio',
    group: 'ASSETS',
  },
  assetBatteryGoodAspectRatio: {
    value: 1.1557,
    type: 'number',
    label: 'Bateria Boa Aspect Ratio',
    group: 'ASSETS',
  },
  assetBatteryDamagedAspectRatio: {
    value: 1.1111,
    type: 'number',
    label: 'Bateria Danificada Aspect Ratio',
    group: 'ASSETS',
  },
  assetToolWrenchAspectRatio: {
    value: 1.0684,
    type: 'number',
    label: 'Chave Boca Aspect Ratio',
    group: 'ASSETS',
  },
  assetToolHammerAspectRatio: {
    value: 1.0025,
    type: 'number',
    label: 'Martelo Aspect Ratio',
    group: 'ASSETS',
  },
  assetScrewTrashAspectRatio: {
    value: 1.1368,
    type: 'number',
    label: 'Parafusos Lixo Aspect Ratio',
    group: 'ASSETS',
  },
  assetPaperBallAspectRatio: {
    value: 1.0015,
    type: 'number',
    label: 'Bolinha Papel Aspect Ratio',
    group: 'ASSETS',
  },
  assetShelfAspectRatio: {
    value: 0.9575,
    type: 'number',
    label: 'Prateleira Aspect Ratio',
    group: 'ASSETS',
  },
  assetToolboxStationAspectRatio: {
    value: 1.0457,
    type: 'number',
    label: 'Caixa de Ferramentas Aspect Ratio',
    group: 'ASSETS',
  },
  assetLockerAspectRatio: {
    value: 0.7076,
    type: 'number',
    label: 'Armário Uniforme Aspect Ratio',
    group: 'ASSETS',
  },
  assetWorkerUniformAspectRatio: {
    value: 1.2266,
    type: 'number',
    label: 'Uniforme Aspect Ratio',
    group: 'ASSETS',
  },
  assetWallHooksAspectRatio: {
    value: 1.2085,
    type: 'number',
    label: 'Ganchos Parede Aspect Ratio',
    group: 'ASSETS',
  },
  assetCleaningBroomAspectRatio: {
    value: 0.9866,
    type: 'number',
    label: 'Vassoura Aspect Ratio',
    group: 'ASSETS',
  },
  assetDrawerDeskAspectRatio: {
    value: 1.4529,
    type: 'number',
    label: 'Gaveta Escrivaninha Aspect Ratio',
    group: 'ASSETS',
  },
  assetStationeryNotebookAspectRatio: {
    value: 1.3625,
    type: 'number',
    label: 'Caderno Aspect Ratio',
    group: 'ASSETS',
  },
  assetGreaseStainAspectRatio: {
    value: 2.2707,
    type: 'number',
    label: 'Mancha Graxa Aspect Ratio',
    group: 'ASSETS',
  },
  assetCleaningSpongeAspectRatio: {
    value: 1.1518,
    type: 'number',
    label: 'Esponja Aspect Ratio',
    group: 'ASSETS',
  },
  assetWindowSqueegeeAspectRatio: {
    value: 1.1432,
    type: 'number',
    label: 'Limpa Vidros Aspect Ratio',
    group: 'ASSETS',
  },
  assetFloorMopAspectRatio: {
    value: 0.9927,
    type: 'number',
    label: 'Mop Piso Aspect Ratio',
    group: 'ASSETS',
  },
  assetTrashcanAspectRatio: {
    value: 0.6346,
    type: 'number',
    label: 'Lixeira Aspect Ratio',
    group: 'ASSETS',
  },
  assetSignWetFloorAspectRatio: {
    value: 0.7854,
    type: 'number',
    label: 'Placa Piso Molhado Aspect Ratio',
    group: 'ASSETS',
  },
  assetSignSafetyHelmetAspectRatio: {
    value: 1.2955,
    type: 'number',
    label: 'Placa Uso Obrigatório de EPI Aspect Ratio',
    group: 'ASSETS',
  },
  assetSignHighVoltageAspectRatio: {
    value: 0.9303,
    type: 'number',
    label: 'Placa Alta Voltagem Aspect Ratio',
    group: 'ASSETS',
  },
  assetSignRecycleAspectRatio: {
    value: 1.0396,
    type: 'number',
    label: 'Símbolo Reciclagem Aspect Ratio',
    group: 'ASSETS',
  },
  assetElectricPanelAspectRatio: {
    value: 1.1364,
    type: 'number',
    label: 'Painel Elétrico Aspect Ratio',
    group: 'ASSETS',
  },
  assetTrophyAspectRatio: {
    value: 0.8564,
    type: 'number',
    label: 'Troféu 5S Aspect Ratio',
    group: 'ASSETS',
  },
  assetStarGoldAspectRatio: {
    value: 1.0664,
    type: 'number',
    label: 'Estrela Dourada Aspect Ratio',
    group: 'ASSETS',
  },
  assetToolStaplerAspectRatio: {
    value: 1.2271,
    type: 'number',
    label: 'Grampeador Aspect Ratio',
    group: 'ASSETS',
  },
  assetSafetyBootsAspectRatio: {
    value: 1.1007,
    type: 'number',
    label: 'Botas de Segurança Aspect Ratio',
    group: 'ASSETS',
  },
  assetWeldingMachineBrokenAspectRatio: {
    value: 0.9838,
    type: 'number',
    label: 'Máquina de Solda Quebrada Aspect Ratio',
    group: 'ASSETS',
  },
  assetSignMaintenanceAspectRatio: {
    value: 0.9922,
    type: 'number',
    label: 'Placa Manutenção Aspect Ratio',
    group: 'ASSETS',
  },
  assetWireDamagedAspectRatio: {
    value: 1.2976,
    type: 'number',
    label: 'Fio Danificado Aspect Ratio',
    group: 'ASSETS',
  },
  assetOilyRagAspectRatio: {
    value: 1.2555,
    type: 'number',
    label: 'Pano com Graxa Aspect Ratio',
    group: 'ASSETS',
  },
  assetBrokenGearAspectRatio: {
    value: 1.004,
    type: 'number',
    label: 'Engrenagem Quebrada Aspect Ratio',
    group: 'ASSETS',
  },
  assetPilotoFasesAspectRatio: {
    value: 0.6415,
    type: 'number',
    label: 'Piloto Fases Aspect Ratio',
    group: 'ASSETS',
  },
  assetPilotoFinalAspectRatio: {
    value: 0.8209,
    type: 'number',
    label: 'Piloto Final Aspect Ratio',
    group: 'ASSETS',
  },
  assetLixeiraPapelAspectRatio: {
    value: 0.8497,
    type: 'number',
    label: 'Lixeira Papel Aspect Ratio',
    group: 'ASSETS',
  },
  assetFabricaFinalAspectRatio: {
    value: 1.3028,
    type: 'number',
    label: 'Fabrica Final Aspect Ratio',
    group: 'ASSETS',
  },
  assetFuradeiraBancadaAspectRatio: {
    value: 0.5318,
    type: 'number',
    label: 'Furadeira Bancada Aspect Ratio',
    group: 'ASSETS',
  },
  assetLixeiraFase4AspectRatio: {
    value: 0.6288,
    type: 'number',
    label: 'Lixeira Fase 4 Aspect Ratio',
    group: 'ASSETS',
  },
  assetPortaEsponjaAspectRatio: {
    value: 1.2768,
    type: 'number',
    label: 'Porta Esponja Aspect Ratio',
    group: 'ASSETS',
  },
};

// Merge customized config values if present (injected by Playground)
const {playgroundConfig} = globalThis as {
  playgroundConfig?: Record<string, unknown>;
};
if (playgroundConfig) {
  for (const [key, value] of Object.entries(playgroundConfig)) {
    if (key in CONFIG) {
      Object.assign(CONFIG[key as keyof typeof CONFIG], {value});
    }
  }
}

/**
 * Type helper for reading values in game code
 */
export type ConfigKey = keyof typeof CONFIG;

/**
 * Gets a configuration value by key.
 * @param key The configuration key.
 * @return The configuration value.
 */
export function getConfig<K extends ConfigKey>(
  key: K,
): (typeof CONFIG)[K]['value'] {
  return CONFIG[key].value;
}

export interface Stage5SInfo {
  number: number;
  name: string;
  subtitle: string;
  shortHelp: string;
  speaker: 'PILOT' | 'MECH_GREY' | 'MECH_BLUE' | 'MECH_RED';
  speakerName: string;
  speakerRole: string;
  mascotMessage: string;
}

export const STAGES_5S_INFO: Stage5SInfo[] = [
  {
    number: 1,
    name: 'Seiri (Utilização)',
    subtitle: 'Separar o que é útil do que deve ser descartado',
    shortHelp: 'Arraste itens úteis para a Caixa Verde e sucata/descarte para a Caixa Vermelha!',
    speaker: 'MECH_GREY',
    speakerName: 'Edward Checker',
    speakerRole: 'Inspetor de Qualidade',
    mascotMessage: 'Olá! Sou o Edward Checker, Inspetor de Qualidade. Separe as 5 peças úteis na Caixa Verde e 5 sucatas no Descarte!',
  },
  {
    number: 2,
    name: 'Seiton (Organização)',
    subtitle: 'Um lugar para cada coisa e cada coisa em seu lugar',
    shortHelp: 'Organize as ferramentas, uniformes, documentos, botas e vassouras nos locais corretos!',
    speaker: 'MECH_BLUE',
    speakerName: 'Otto Polack',
    speakerRole: 'Mecânico',
    mascotMessage: 'Hora do SEITON! Sou o Otto Polack. Guarde as ferramentas na bancada, baterias na prateleira, papéis na gaveta e roupas no armário!',
  },
  {
    number: 3,
    name: 'Seiso (Limpeza)',
    subtitle: 'Limpar e inspecionar a área de trabalho',
    shortHelp: 'Use as ferramentas do painel de limpeza para remover manchas e recolha os papéis no lixo!',
    speaker: 'MECH_RED',
    speakerName: 'John Sparks',
    speakerRole: 'Eletricista',
    mascotMessage: 'SEISO na prática com John Sparks! Pegue a esponja, o rodo e o mop no painel de limpeza para deixar tudo impecável!',
  },
  {
    number: 4,
    name: 'Seiketsu (Padronização)',
    subtitle: 'Sinalizar, padronizar e manter a segurança visual',
    shortHelp: 'Posicione as placas de aviso, perigo elétrico, manutenção e EPI nos seus devidos locais!',
    speaker: 'MECH_GREY',
    speakerName: 'Edward Checker',
    speakerRole: 'Inspetor de Qualidade',
    mascotMessage: 'No SEIKETSU fixamos placas de perigo elétrico, piso molhado, uso obrigatório de EPI e equipamento em manutenção para segurança total!',
  },
  {
    number: 5,
    name: 'Shitsuke (Disciplina)',
    subtitle: 'Manter os hábitos e a excelência contínua',
    shortHelp: 'Faça o check-up 5S completo: organize as peças, limpe as manchas e fixe a sinalização!',
    speaker: 'PILOT',
    speakerName: 'Piloto 5S',
    speakerRole: 'Piloto Oficial 5S',
    mascotMessage: 'Última etapa: SHITSUKE! O Piloto 5S e toda a equipe da Oficina 5S estão com você! Conquiste o Troféu 5S de Ouro!',
  },
];
