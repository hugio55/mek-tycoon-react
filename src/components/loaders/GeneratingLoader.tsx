import React from 'react';
import styles from './GeneratingLoader.module.css';

interface ColorScheme {
  primary: string;
  secondary: string;
  tertiary: string;
  accent: string;
}

interface GeneratingLoaderProps {
  text?: string;
  colorScheme?: ColorScheme;
  textScale?: number;
}

const GeneratingLoader = ({ text = 'Generating', colorScheme, textScale = 1 }: GeneratingLoaderProps) => {
  const letters = text.split('');

  // Default purple scheme if none provided
  const colors = colorScheme || {
    primary: '#ad5fff',
    secondary: '#471eec',
    tertiary: '#d60a47',
    accent: '#311e80'
  };

  return (
    <div className={styles['loader-wrapper']}>
      <div style={{
        transform: `translateY(3px) scale(${textScale})`,
        fontSize: '0.35em',
        opacity: 0.7,
        color: 'white'
      }}>
        {text}
      </div>
      <div
        className={styles.loader}
        style={{
          // @ts-ignore
          '--color-primary': colors.primary,
          '--color-secondary': colors.secondary,
          '--color-tertiary': colors.tertiary,
          '--color-accent': colors.accent,
        }}
      />
    </div>
  );
}

export default GeneratingLoader;
