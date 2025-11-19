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
}

const GeneratingLoader = ({ text = 'Generating', colorScheme }: GeneratingLoaderProps) => {
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
      {letters.map((letter, index) => (
        <span
          key={index}
          className={styles['loader-letter']}
          style={{
            animationDelay: `${index * 0.05}s`,
            fontSize: '0.9em'
          }}
        >
          {letter}
        </span>
      ))}
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
