import React from 'react';
import styles from './GeneratingLoader.module.css';

interface GeneratingLoaderProps {
  text?: string;
}

const GeneratingLoader = ({ text = 'Generating' }: GeneratingLoaderProps) => {
  const letters = text.split('');

  return (
    <div className={styles['loader-wrapper']}>
      {letters.map((letter, index) => (
        <span
          key={index}
          className={styles['loader-letter']}
          style={{
            animationDelay: `${index * 0.1}s`
          }}
        >
          {letter}
        </span>
      ))}
      <div className={styles.loader} />
    </div>
  );
}

export default GeneratingLoader;
