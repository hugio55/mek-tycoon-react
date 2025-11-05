'use client';

import React from 'react';
import './IsometricSocialButton.css';

interface IsometricSocialButtonProps {
  iconClass: string;
  label: string;
  onClick?: () => void;
}

export default function IsometricSocialButton({
  iconClass,
  label,
  onClick
}: IsometricSocialButtonProps) {
  return (
    <div className="isometric-social">
      <a href="#" onClick={(e) => { e.preventDefault(); onClick?.(); }}>
        <i className={iconClass}></i>
      </a>
    </div>
  );
}
