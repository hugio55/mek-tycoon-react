/**
 * Toast Notification System
 * Provides consistent visual feedback for user actions across the app
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
  duration?: number;
  position?: 'top' | 'center' | 'bottom';
}

const defaultOptions: Required<ToastOptions> = {
  duration: 3000,
  position: 'center',
};

function getToastStyles(type: ToastType, position: 'top' | 'center' | 'bottom'): string {
  const colors = {
    success: {
      bg: 'linear-gradient(135deg, #10b981, #059669)',
      border: '#10b981',
      shadow: 'rgba(16, 185, 129, 0.5)',
    },
    error: {
      bg: 'linear-gradient(135deg, #ef4444, #dc2626)',
      border: '#ef4444',
      shadow: 'rgba(239, 68, 68, 0.5)',
    },
    warning: {
      bg: 'linear-gradient(135deg, #f59e0b, #d97706)',
      border: '#f59e0b',
      shadow: 'rgba(245, 158, 11, 0.5)',
    },
    info: {
      bg: 'linear-gradient(135deg, #3b82f6, #2563eb)',
      border: '#3b82f6',
      shadow: 'rgba(59, 130, 246, 0.5)',
    },
  };

  const positionStyles = {
    top: 'top: 20%; left: 50%;',
    center: 'top: 50%; left: 50%;',
    bottom: 'bottom: 20%; left: 50%;',
  };

  const color = colors[type];
  return `
    position: fixed;
    ${positionStyles[position]}
    transform: translate(-50%, -50%);
    background: ${color.bg};
    border: 2px solid ${color.border};
    color: #ffffff;
    padding: 20px 40px;
    border-radius: 10px;
    font-weight: bold;
    font-size: 16px;
    z-index: 10000;
    animation: toastFadeInOut ${defaultOptions.duration}ms ease-out forwards;
    box-shadow: 0 10px 40px ${color.shadow};
    min-width: 300px;
    text-align: center;
  `;
}

function addToastAnimation() {
  // Only add animation once
  if (document.getElementById('toast-animation-style')) return;

  const style = document.createElement('style');
  style.id = 'toast-animation-style';
  style.textContent = `
    @keyframes toastFadeInOut {
      0% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.8);
      }
      10% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.05);
      }
      15% {
        transform: translate(-50%, -50%) scale(1);
      }
      85% {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
      }
      100% {
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.9) translateY(-20px);
      }
    }
  `;
  document.head.appendChild(style);
}

export function toast(message: string, type: ToastType = 'info', options: ToastOptions = {}) {
  const opts = { ...defaultOptions, ...options };

  // Add CSS animation
  addToastAnimation();

  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.textContent = message;
  toastEl.style.cssText = getToastStyles(type, opts.position);

  document.body.appendChild(toastEl);

  // Remove after animation
  setTimeout(() => {
    toastEl.remove();
  }, opts.duration);

  return toastEl;
}

// Convenience methods
export const toastSuccess = (message: string, options?: ToastOptions) =>
  toast(message, 'success', options);

export const toastError = (message: string, options?: ToastOptions) =>
  toast(message, 'error', options);

export const toastWarning = (message: string, options?: ToastOptions) =>
  toast(message, 'warning', options);

export const toastInfo = (message: string, options?: ToastOptions) =>
  toast(message, 'info', options);
