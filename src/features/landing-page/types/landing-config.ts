import { SpeakerIconStyle } from '@/components/SpeakerIcons';

export interface StarLayerConfig {
  enabled: boolean;
  scale: number;
  speed: number;
  frequency: number;
  lineLength?: number;
  brightness?: number;
  spawnDelay?: number;
  twinkleAmount: number;
  twinkleSpeed: number;
  twinkleSpeedRandomness: number;
  sizeRandomness: number;
}

export interface BackgroundStarConfig {
  enabled: boolean;
  twinkleAmount: number;
  twinkleSpeed: number;
  twinkleSpeedRandomness: number;
  sizeRandomness: number;
  size: number;
  count: number;
  minBrightness: number;
  maxBrightness: number;
}

export interface StarSystemConfig {
  enabled: boolean;
  bgStar: BackgroundStarConfig;
  layer1: StarLayerConfig;
  layer2: StarLayerConfig;
  layer3: StarLayerConfig;
  fadePosition: number;
  fadeFeatherSize: number;
}

export interface LayoutConfig {
  logoSize: number;
  logoYPosition: number;
  selectedFont: string;
  descriptionFontSize: number;
  descriptionText: string;
  descriptionXOffset: number;
  descriptionYOffset: number;
  bgYPosition: number;
  descriptionColor: string;
  descriptionCardBlur: number;
  descriptionCardDarkness: number;
  descriptionCardBorder: boolean;
}

export interface MotionBlurConfig {
  enabled: boolean;
  intensity: number;
}

export interface AudioConfig {
  logoFadeDuration: number;
  lightboxBackdropDarkness: number;
  audioToggleSize: number;
  audioToggleScale: number;
  toggleTextGap: number;
  proceedButtonSize: number;
  audioDescriptionText: string;
  audioConsentFadeDuration: number;
  soundLabelFont: string;
  soundLabelSize: number;
  soundLabelColor: string;
  soundLabelVerticalOffset: number;
  soundLabelHorizontalOffset: number;
  powerButtonScale: number;
  powerButtonVerticalOffset: number;
  powerButtonHorizontalOffset: number;
  powerButtonGlowEnabled: boolean;
  speakerIconStyle: SpeakerIconStyle;
}

export interface PhaseConfig {
  designVariation: 'modern' | 'industrial' | 'neon';
  headerFont: string;
  headerFontSize: number;
  headerColor: string;
  descriptionFont: string;
  descriptionFontSize: number;
  imageDarkening: number;
  blurAmount: number;
  blurAmountSelected: number;
  columnHeight: number;
  fadePosition: number;
  imageBlendMode: 'normal' | 'screen' | 'lighten' | 'lighter';
  hoverDarkeningIntensity: number;
  idleBackdropBlur: number;
  columnYOffset: number;
}

export interface BetaButtonConfig {
  font: string;
  fontSize: number;
  color: string;
  horizontalOffset: number;
  verticalOffset: number;
}

export interface FooterConfig {
  height: number;
  imageVerticalPosition: number;
  oeLogoScale: number;
  socialIconScale: number;
  socialIconGap: number;
  socialIconVerticalPosition: number;
  socialIconPaddingTop: number;
  socialIconPaddingBottom: number;
  blurAmount: number;
  edgeFeathering: number;
}

export interface MobileConfig {
  breakpoint: number;
  phaseFooterSpacing: number;
  phaseButtonMaxWidth: number;
}

export interface LandingPageConfig {
  starSystem: StarSystemConfig;
  layout: LayoutConfig;
  motionBlur: {
    layer1: MotionBlurConfig;
    layer2: MotionBlurConfig;
  };
  audio: AudioConfig;
  phase: PhaseConfig;
  betaButton: BetaButtonConfig;
  footer: FooterConfig;
  mobile: MobileConfig;
}
