"use client";

import React, { useState } from 'react';

interface DisconnectConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DisconnectConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: DisconnectConfirmModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'confirm' | 'disconnecting' | 'clearing' | 'reloading'>('confirm');

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);

    // Step 1: Disconnecting
    setCurrentStep('disconnecting');
    await new Promise(resolve => setTimeout(resolve, 600));

    // Step 2: Clearing authentication
    setCurrentStep('clearing');
    await new Promise(resolve => setTimeout(resolve, 600));

    // Step 3: Reloading
    setCurrentStep('reloading');
    await new Promise(resolve => setTimeout(resolve, 400));

    // Execute actual disconnect
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scanLine {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
      `}</style>

      {/* Modal Container */}
      <div
        className="relative max-w-lg w-full mx-4"
        style={{
          animation: 'slideUp 0.3s ease-out'
        }}
      >
        {/* Main Card with Industrial Design */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(250, 182, 23, 0.02) 0%, rgba(250, 182, 23, 0.05) 50%, rgba(250, 182, 23, 0.02) 100%)',
            backdropFilter: 'blur(20px)',
            border: '2px solid rgba(250, 182, 23, 0.5)',
            boxShadow: '0 0 40px rgba(250, 182, 23, 0.3), inset 0 0 40px rgba(250, 182, 23, 0.05)'
          }}
        >
          {/* Hazard Stripe Header */}
          <div
            className="relative px-6 py-4 overflow-hidden"
            style={{
              background: `
                repeating-linear-gradient(
                  45deg,
                  rgba(0, 0, 0, 0.9),
                  rgba(0, 0, 0, 0.9) 10px,
                  rgba(250, 182, 23, 0.15) 10px,
                  rgba(250, 182, 23, 0.15) 20px
                ),
                linear-gradient(to right, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8))
              `
            }}
          >
            {/* Scan line effect */}
            {isProcessing && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, rgba(250, 182, 23, 0.8), transparent)',
                  animation: 'scanLine 2s linear infinite'
                }}
              />
            )}

            <div className="flex items-center gap-4 relative z-10">
              {/* Warning Icon */}
              <div
                style={{
                  fontSize: '48px',
                  filter: 'drop-shadow(0 0 12px rgba(250, 182, 23, 0.6))',
                  animation: isProcessing ? 'pulse 1s infinite' : 'none'
                }}
              >
                ⚠️
              </div>

              <div className="flex-1">
                <h3
                  style={{
                    fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                    fontSize: '24px',
                    fontWeight: 700,
                    color: '#fab617',
                    textShadow: '0 0 15px rgba(250, 182, 23, 0.6)',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    lineHeight: '1.2'
                  }}
                >
                  DISCONNECT WALLET
                </h3>
                <p
                  style={{
                    fontSize: '11px',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    fontFamily: "'Consolas', 'Monaco', 'Courier New', monospace",
                    marginTop: '4px'
                  }}
                >
                  Security Protocol Active
                </p>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6">
            {currentStep === 'confirm' ? (
              // Confirmation Message
              <>
                <div
                  className="mb-6 p-4 rounded-lg"
                  style={{
                    background: 'rgba(250, 182, 23, 0.05)',
                    border: '1px solid rgba(250, 182, 23, 0.2)'
                  }}
                >
                  <p
                    style={{
                      fontSize: '16px',
                      lineHeight: '1.6',
                      color: '#e5e7eb',
                      marginBottom: '12px'
                    }}
                  >
                    You are about to disconnect your wallet. For security reasons:
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div
                        style={{
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(250, 182, 23, 0.2)',
                          border: '2px solid rgba(250, 182, 23, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fab617'
                        }}
                      >
                        1
                      </div>
                      <p style={{ fontSize: '14px', color: '#d1d5db', flex: 1 }}>
                        Your session will be cleared completely
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        style={{
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(250, 182, 23, 0.2)',
                          border: '2px solid rgba(250, 182, 23, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fab617'
                        }}
                      >
                        2
                      </div>
                      <p style={{ fontSize: '14px', color: '#d1d5db', flex: 1 }}>
                        <strong style={{ color: '#fab617' }}>You will need to sign a message</strong> to reconnect
                      </p>
                    </div>

                    <div className="flex items-start gap-3">
                      <div
                        style={{
                          minWidth: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: 'rgba(250, 182, 23, 0.2)',
                          border: '2px solid rgba(250, 182, 23, 0.5)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: '#fab617'
                        }}
                      >
                        3
                      </div>
                      <p style={{ fontSize: '14px', color: '#d1d5db', flex: 1 }}>
                        The page will reload to clear all authentication data
                      </p>
                    </div>
                  </div>
                </div>

                {/* Security Info */}
                <div
                  className="mb-6 p-3 rounded-lg flex items-start gap-3"
                  style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)'
                  }}
                >
                  <div style={{ fontSize: '20px', marginTop: '2px' }}>🔒</div>
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#60a5fa',
                        marginBottom: '4px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em'
                      }}
                    >
                      Why signature is required
                    </p>
                    <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: '1.5' }}>
                      This security measure prevents unauthorized access and ensures only the wallet owner can authenticate.
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={onCancel}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 rounded-lg transition-all duration-200"
                    style={{
                      background: 'rgba(75, 85, 99, 0.3)',
                      border: '1px solid rgba(156, 163, 175, 0.3)',
                      color: '#9ca3af',
                      fontFamily: "'Inter', 'Segoe UI', sans-serif",
                      fontSize: '14px',
                      fontWeight: 600,
                      letterSpacing: '0.025em',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.5 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing) {
                        e.currentTarget.style.background = 'rgba(75, 85, 99, 0.5)';
                        e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(75, 85, 99, 0.3)';
                      e.currentTarget.style.borderColor = 'rgba(156, 163, 175, 0.3)';
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleConfirm}
                    disabled={isProcessing}
                    className="flex-1 px-6 py-3 rounded-lg transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #fab617 0%, #ffd700 100%)',
                      border: '2px solid rgba(250, 182, 23, 0.5)',
                      color: '#000',
                      fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 12px rgba(250, 182, 23, 0.3)',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      opacity: isProcessing ? 0.7 : 1
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(250, 182, 23, 0.5)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(250, 182, 23, 0.3)';
                    }}
                  >
                    Disconnect Wallet
                  </button>
                </div>
              </>
            ) : (
              // Processing States
              <div className="py-8 flex flex-col items-center justify-center">
                {/* Loading Spinner */}
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    border: '4px solid rgba(250, 182, 23, 0.1)',
                    borderTopColor: '#fab617',
                    animation: 'rotate 1s linear infinite',
                    marginBottom: '24px'
                  }}
                />

                {/* Status Messages */}
                <div className="text-center">
                  <p
                    style={{
                      fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                      fontSize: '18px',
                      fontWeight: 700,
                      color: '#fab617',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      marginBottom: '8px'
                    }}
                  >
                    {currentStep === 'disconnecting' && 'Disconnecting Wallet...'}
                    {currentStep === 'clearing' && 'Clearing Authentication...'}
                    {currentStep === 'reloading' && 'Preparing Reload...'}
                  </p>

                  <p
                    style={{
                      fontSize: '13px',
                      color: '#9ca3af',
                      lineHeight: '1.5',
                      maxWidth: '320px'
                    }}
                  >
                    {currentStep === 'disconnecting' && 'Terminating wallet connection'}
                    {currentStep === 'clearing' && 'Removing all session data from local storage'}
                    {currentStep === 'reloading' && 'Page will reload shortly to complete logout'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Grunge Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              opacity: 0.15,
              background: `
                linear-gradient(105deg, transparent 40%, rgba(0, 0, 0, 0.3) 41%, transparent 43%),
                linear-gradient(85deg, transparent 65%, rgba(0, 0, 0, 0.2) 66%, transparent 67%)
              `,
              mixBlendMode: 'multiply'
            }}
          />
        </div>

        {/* Corner Accents */}
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            left: '-4px',
            width: '20px',
            height: '20px',
            border: '2px solid #fab617',
            borderRight: 'none',
            borderBottom: 'none',
            opacity: 0.6
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            width: '20px',
            height: '20px',
            border: '2px solid #fab617',
            borderLeft: 'none',
            borderBottom: 'none',
            opacity: 0.6
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            left: '-4px',
            width: '20px',
            height: '20px',
            border: '2px solid #fab617',
            borderRight: 'none',
            borderTop: 'none',
            opacity: 0.6
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            width: '20px',
            height: '20px',
            border: '2px solid #fab617',
            borderLeft: 'none',
            borderTop: 'none',
            opacity: 0.6
          }}
        />
      </div>
    </div>
  );
}
