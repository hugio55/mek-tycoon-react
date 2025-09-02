'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { validateUsername, USERNAME_MAX_LENGTH } from '@/lib/usernameValidation';

interface UsernameModalProps {
  isOpen: boolean;
  onClose?: () => void;
  walletAddress: string;
  onSuccess?: (displayName: string) => void;
}

export default function UsernameModal({ isOpen, onClose, walletAddress, onSuccess }: UsernameModalProps) {
  const [username, setUsername] = useState('');
  const [debouncedUsername, setDebouncedUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, delay: number}>>([]);

  const setDisplayName = useMutation(api.usernames.setDisplayName);
  const checkAvailability = useQuery(api.usernames.checkUsernameAvailability, 
    debouncedUsername.trim() ? { username: debouncedUsername.trim() } : "skip"
  );

  // Debounce the username input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUsername(username);
      setIsChecking(false);
    }, 750); // 750ms delay

    // Show checking state while typing
    if (username !== debouncedUsername && username.trim()) {
      setIsChecking(true);
    }

    return () => clearTimeout(timer);
  }, [username]);

  useEffect(() => {
    if (checkAvailability !== undefined) {
      setIsAvailable(checkAvailability.available);
      setIsChecking(false);
      if (!checkAvailability.available && checkAvailability.error) {
        setError(checkAvailability.error);
      }
    }
  }, [checkAvailability]);

  useEffect(() => {
    // Generate particles for button effect
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
      delay: Math.random() * 2,
    }));
    setParticles(newParticles);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    setError(null);
    setIsAvailable(null);

    // Validate on the fly
    if (value) {
      const validation = validateUsername(value);
      if (!validation.valid) {
        setError(validation.error || null);
      }
    }
  };

  const handleSubmit = async () => {
    const validation = validateUsername(username);
    if (!validation.valid) {
      setError(validation.error || "Invalid username");
      return;
    }

    if (!isAvailable) {
      setError("Username is not available");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await setDisplayName({ 
        walletAddress, 
        displayName: username.trim() 
      });
      
      if (result.success) {
        onSuccess?.(result.displayName);
        onClose?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set username");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div 
          className="bg-black/95 border border-yellow-500/50 rounded-lg p-8 max-w-md w-full mx-4 relative overflow-hidden"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(250, 182, 23, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(250, 182, 23, 0.1) 0%, transparent 50%),
              repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                rgba(250, 182, 23, 0.02) 10px,
                rgba(250, 182, 23, 0.02) 20px
              ),
              #000000
            `,
          }}
        >
          <h2 
            className="text-3xl font-bold text-yellow-400 mb-6 text-center"
            style={{
              fontFamily: "'Orbitron', 'Bebas Neue', 'Rajdhani', sans-serif",
              letterSpacing: '0.1em',
              textShadow: '0 0 20px rgba(250, 182, 23, 0.6)',
            }}
          >
            Choose Your Display Name
          </h2>
          
          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={username}
                onChange={handleInputChange}
                maxLength={USERNAME_MAX_LENGTH}
                placeholder="Enter your display name"
                className="w-full px-4 py-3 bg-black/60 border-2 border-yellow-500/40 rounded-lg text-white text-lg focus:outline-none focus:border-yellow-500 focus:shadow-lg focus:shadow-yellow-500/20 transition-all duration-200"
                style={{
                  boxShadow: '0 0 15px rgba(250, 182, 23, 0.1)',
                }}
                disabled={isSubmitting}
              />
              <div className="mt-2 flex justify-between items-center h-5">
                <div className="text-xs text-gray-400">
                  {username.length}/{USERNAME_MAX_LENGTH} characters
                </div>
                <div className="text-sm min-w-[80px] text-right">
                  {isChecking && username ? (
                    <span className="text-gray-400">Checking...</span>
                  ) : isAvailable === true && !error && username ? (
                    <span className="text-green-400">✓ Available</span>
                  ) : null}
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-900/20 border border-red-500/30 rounded p-3">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-400 space-y-1 bg-gray-900/30 rounded-lg p-3">
              <p>• Letters, numbers, underscores, and spaces allowed</p>
              <p>• Maximum {USERNAME_MAX_LENGTH} characters</p>
              <p>• No consecutive spaces or spaces at start/end</p>
              <p>• Case-sensitive display (but unique regardless of case)</p>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
              <p className="text-blue-300 text-sm">
                <span className="font-semibold">Note:</span> You can change your display name later from the hub.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={!username || !!error || !isAvailable || isSubmitting}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-yellow-500/30 to-yellow-600/30 
                         border-2 border-yellow-500/70 rounded-lg text-yellow-400 font-bold text-lg
                         transition-all duration-200 relative overflow-hidden
                         hover:from-yellow-500/40 hover:to-yellow-600/40 hover:border-yellow-500 
                         hover:scale-105 hover:shadow-2xl
                         disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                  letterSpacing: '0.15em',
                }}
              >
                {/* Particle effects on hover */}
                {!isSubmitting && !error && username && isAvailable && (
                  <div className="absolute inset-0 pointer-events-none">
                    {particles.map((particle) => (
                      <div
                        key={particle.id}
                        className="absolute w-1 h-1 bg-yellow-400 rounded-full"
                        style={{
                          left: '50%',
                          top: '50%',
                          '--x': `${particle.x}px`,
                          '--y': `${particle.y}px`,
                          animationDelay: `${particle.delay}s`,
                        } as React.CSSProperties}
                      />
                    ))}
                  </div>
                )}
                
                <span className="relative z-10">
                  {isSubmitting ? "Setting..." : "CONFIRM"}
                </span>
              </button>
              
              <button
                onClick={() => {
                  onSuccess?.('');
                  onClose?.();
                }}
                className="px-6 py-4 bg-gray-800/50 border-2 border-gray-600/50 rounded-lg 
                         text-gray-400 font-bold text-lg transition-all duration-200
                         hover:bg-gray-700/50 hover:border-gray-500 hover:text-gray-300"
                style={{
                  fontFamily: "'Orbitron', 'Bebas Neue', sans-serif",
                  letterSpacing: '0.15em',
                }}
              >
                SKIP
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}