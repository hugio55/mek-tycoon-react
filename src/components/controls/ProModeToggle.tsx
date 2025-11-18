'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * Pro Mode Toggle - Transformed from external CSS component
 *
 * Original: Complex safety toggle switch with guard, lever, and indicator light
 * Features:
 * - Safety guard that lifts when activated
 * - 3D hexagonal switch lever with knob
 * - Illuminated indicator light
 * - Hazard stripe border (industrial design)
 *
 * Transformation applied:
 * - HTML → React JSX with state management
 * - CSS → Tailwind utilities + inline styles
 * - Preserved 3D transforms, gradients, and animations
 */

interface ProModeToggleProps {
  enabled?: boolean;
  onChange?: (enabled: boolean) => void;
  label?: string;
  enableSounds?: boolean; // Control whether sounds play on interaction
  indicatorColor?: 'green' | 'red'; // Color of the indicator light when on
  guardColor?: 'green' | 'red'; // Color of the safety guard
}

export default function ProModeToggle({
  enabled = false,
  onChange,
  label = "Pro Mode",
  enableSounds = true,
  indicatorColor = 'green',
  guardColor = 'red'
}: ProModeToggleProps) {
  const [guardOpen, setGuardOpen] = useState(false);
  const [switchOn, setSwitchOn] = useState(enabled);

  // Define guard color gradients
  const guardGradients = {
    red: 'linear-gradient(0deg, rgba(166,46,41,1) 0%, rgba(210,47,41,1) 6%, rgba(237,71,65,1) 16%, rgba(237,71,65,1) 27%, rgba(210,47,41,1) 68%, rgba(210,47,41,1) 100%)',
    green: 'linear-gradient(0deg, rgba(41,166,46,1) 0%, rgba(41,210,47,1) 6%, rgba(65,237,71,1) 16%, rgba(65,237,71,1) 27%, rgba(41,210,47,1) 68%, rgba(41,210,47,1) 100%)'
  };

  const guardOverlayGradients = {
    red: 'linear-gradient(0deg, rgba(110,29,25,1) 0%, rgba(173,46,41,1) 4%, rgba(210,47,41,1) 11%, rgba(237,71,65,1) 21%, rgba(242,107,102,1) 32%, rgba(237,71,65,1) 41%, rgba(237,71,65,1) 41%, rgba(210,47,41,1) 63%, rgba(210,47,41,1) 100%)',
    green: 'linear-gradient(0deg, rgba(25,110,29,1) 0%, rgba(41,173,46,1) 4%, rgba(41,210,47,1) 11%, rgba(65,237,71,1) 21%, rgba(102,242,107,1) 32%, rgba(65,237,71,1) 41%, rgba(65,237,71,1) 41%, rgba(41,210,47,1) 63%, rgba(41,210,47,1) 100%)'
  };

  // Preload audio files for instant playback
  const guardClickAudioRef = useRef<HTMLAudioElement | null>(null);
  const switchClickAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (enableSounds) {
      // Create and preload audio objects
      guardClickAudioRef.current = new Audio('/sounds/main_click.mp3');
      switchClickAudioRef.current = new Audio('/sounds/click reverb 2.mp3');

      // Set preload to auto for instant playback
      guardClickAudioRef.current.preload = 'auto';
      switchClickAudioRef.current.preload = 'auto';

      // Force load by calling .load() explicitly
      guardClickAudioRef.current.load();
      switchClickAudioRef.current.load();

      // Additional force-load: play silently then pause to ensure it's in memory
      guardClickAudioRef.current.volume = 0;
      switchClickAudioRef.current.volume = 0;
      guardClickAudioRef.current.play()
        .then(() => {
          guardClickAudioRef.current!.pause();
          guardClickAudioRef.current!.currentTime = 0;
          guardClickAudioRef.current!.volume = 1;
        })
        .catch(() => {
          // User hasn't interacted yet, will load on first click
          guardClickAudioRef.current!.volume = 1;
        });
      switchClickAudioRef.current.play()
        .then(() => {
          switchClickAudioRef.current!.pause();
          switchClickAudioRef.current!.currentTime = 0;
          switchClickAudioRef.current!.volume = 1;
        })
        .catch(() => {
          // User hasn't interacted yet, will load on first click
          switchClickAudioRef.current!.volume = 1;
        });
    }

    // Cleanup on unmount
    return () => {
      guardClickAudioRef.current = null;
      switchClickAudioRef.current = null;
    };
  }, [enableSounds]);

  const handleGuardToggle = () => {
    const newGuardState = !guardOpen;
    setGuardOpen(newGuardState);

    // Play preloaded sound instantly
    if (enableSounds && guardClickAudioRef.current) {
      guardClickAudioRef.current.currentTime = 0; // Reset to start for rapid re-triggering
      guardClickAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }

    // Close guard -> turn off switch
    if (!newGuardState && switchOn) {
      setSwitchOn(false);
      onChange?.(false);
    }
  };

  const handleSwitchToggle = () => {
    if (!guardOpen) return; // Can't flip switch if guard is closed

    const newSwitchState = !switchOn;
    setSwitchOn(newSwitchState);

    // Play preloaded sound instantly
    if (enableSounds && switchClickAudioRef.current) {
      switchClickAudioRef.current.currentTime = 0; // Reset to start for rapid re-triggering
      switchClickAudioRef.current.play().catch(err => console.log('Audio play failed:', err));
    }

    onChange?.(newSwitchState);
  };

  return (
    <div className="relative">
      {/* Label */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 text-center uppercase font-bold text-xs tracking-widest opacity-80">
        {label}
      </div>

      {/* Wrapper with hazard stripes */}
      <div
        className="relative p-2.5 rounded-[10px] border border-[#202020]"
        style={{
          outline: '3px solid #a1a1a1',
          background: `repeating-linear-gradient(
            -45deg,
            #f5dd00,
            #f5dd00 12px,
            #101010 10px,
            #101010 23px
          )`
        }}
      >
        {/* Main toggle container */}
        <div
          className="relative rounded-[5px] border-2 border-[#202020] bg-[#404040] p-[3px] m-0"
          style={{
            outline: '2px solid #a1a1a1',
            outlineOffset: '0px',
            perspective: '300px',
            isolation: 'isolate',
            boxShadow: '0 0 1px #050506, inset 0 0 0 2px #050506, inset 0 3px 1px #66646c'
          }}
        >
          {/* Side guides */}
          <div className="absolute left-[1px] top-2.5 h-5 w-[2px] rounded-tl-[3px] bg-[#a3a3a3]" />
          <div className="absolute right-[1px] top-2.5 h-5 w-[2px] rounded-tr-[3px] bg-[#a3a3a3] z-[1]" />

          {/* Safety Guard (clickable div for instant response) */}
          <div
            onClick={handleGuardToggle}
            className="peer/guard relative m-0 p-0 block w-[50px] h-[100px] rounded-[7px] cursor-pointer z-[3] border border-black
                       transition-transform duration-200"
            style={{
              background: guardGradients[guardColor],
              boxShadow: 'inset -2px -2px 3px rgba(0,0,0,0.3), inset 2px 2px 3px rgba(255,255,255,0.5)',
              transformOrigin: '50% 0%',
              filter: guardOpen ? 'drop-shadow(0px 0px 0px rgba(0,0,0,1))' : 'drop-shadow(0px 0px 0px rgba(0,0,0,1))',
              transform: guardOpen ? 'rotateX(70deg)' : 'rotateX(0deg)',
              touchAction: 'manipulation',
              willChange: 'transform',
              WebkitTapHighlightColor: 'transparent'
            }}
          />

          {/* Guard base hinge */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-1/2 h-2.5 bg-[#303030] rounded-b-[10px] border-[3px] border-[#656565] top-[-2px] pointer-events-none z-[4]"
            style={{ borderStyle: 'ridge' }}
          />

          {/* Guard side rails */}
          <div
            className="absolute left-0 top-0 w-full h-[100px] block pointer-events-none transition-transform duration-200"
            style={{
              transform: guardOpen ? 'translateY(0px)' : 'translateY(45px)',
              willChange: 'transform'
            }}
          >
            {/* Left rail */}
            <div
              className="absolute left-[2px] top-[15px] w-2 h-10 rounded-0"
              style={{
                background: guardGradients[guardColor],
                boxShadow: 'inset -2px -2px 3px rgba(0,0,0,0.3), inset 2px 2px 1px rgba(255,255,255,0.2), 0px 3px 3px rgba(0,0,0,0.4)'
              }}
            />
            {/* Right rail */}
            <div
              className="absolute right-[2px] top-[15px] w-2 h-10 rounded-0"
              style={{
                background: guardGradients[guardColor],
                boxShadow: 'inset -2px -2px 3px rgba(0,0,0,0.3), inset 2px 2px 1px rgba(255,255,255,0.2), 0px 3px 3px rgba(0,0,0,0.4)'
              }}
            />
          </div>

          {/* Hexagonal switch lever */}
          <div
            onClick={handleSwitchToggle}
            className={`absolute top-[70%] left-1/2 w-[52px] h-[50px] z-0 cursor-pointer transition-all duration-200 ${
              !guardOpen ? 'pointer-events-none' : ''
            }`}
            style={{
              transform: 'translateX(-50%) translateY(-50%) rotate(-90deg)',
              background: 'linear-gradient(to left, #a1a1a1 0%, #a1a1a1 1%, #c0c0c0 26%, #b1b1b1 48%, #909090 75%, #a1a1a1 100%)',
              clipPath: 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)',
              filter: 'drop-shadow(1px 1px 3px rgba(255,255,255,1))',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            {/* Hexagon center symbol */}
            <div
              className="absolute text-[50px] rotate-90 top-[-12px] left-[5px]"
              style={{
                color: 'transparent',
                textShadow: '-1px 1px 1px rgba(255,255,255,0.3), 1px 1px 0.5px rgba(0,0,0,0.4), -1px -1px 1px rgba(255,255,255,1), -2px 0px 0px rgba(0,0,0,1), -2px -2px 0px rgba(0,0,0,1), 1px -1px 0px rgba(0,0,0,1)'
              }}
            >
              ⬢
            </div>
            {/* Center hole */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black rounded-full w-[15px] h-[15px] opacity-80"
              style={{
                border: '4px double #726e6e',
                boxShadow: '2px 2px 2px rgba(255,255,255,0.5), -2px -2px 2px rgba(255,255,255,0.5)'
              }}
            />
          </div>

          {/* Knob (moves when switch flips) */}
          <div
            className="absolute block w-3 h-[25px] left-1/2 pointer-events-none rounded-t-[4px] z-[1] border border-black transition-all duration-200"
            style={{
              background: 'linear-gradient(to left, lightgrey 0%, lightgrey 1%, #e0e0e0 26%, #efefef 48%, #d9d9d9 75%, #bcbcbc 100%)',
              boxShadow: 'inset 0px -3px 3px rgba(0,0,0,1), inset 0px 3px 3px rgba(0,0,0,0.7)',
              transform: switchOn
                ? 'translateX(-50%) rotateX(0deg)'
                : 'translateX(-50%) translateY(-14px) rotateX(-175deg)',
              bottom: switchOn ? '13px' : '15px',
              willChange: 'transform'
            }}
          >
            {/* Knob base */}
            <div
              className="absolute -bottom-2.5 -left-[2px] w-3 rounded-[6px] border border-black border-t-0"
              style={{
                height: switchOn ? '15px' : '15px',
                background: switchOn
                  ? '-webkit-radial-gradient(50% -70%, rgba(38, 38, 38, 0.5), #e6e6e6 25%, #ffffff 38%, #a1a1a1 63%, #e6e6e6 87%, rgba(38, 38, 38, 1))'
                  : '-webkit-radial-gradient(50% -40%, rgba(38, 38, 38, 0.5), #e6e6e6 25%, #ffffff 38%, #a1a1a1 63%, #e6e6e6 87%, rgba(38, 38, 38, 1))'
              }}
            />
          </div>

          {/* Guard overlay (shows when guard is down) - fully opaque for cross-browser compatibility */}
          {!guardOpen && (
            <div
              className="absolute top-5 left-0 w-full h-[calc(100%-20px)] opacity-100 rounded-[7px] pointer-events-none z-[5]"
              style={{
                background: guardOverlayGradients[guardColor],
                isolation: 'isolate'
              }}
            />
          )}

          {/* Indicator light */}
          <div
            className="absolute -bottom-10 block w-[50px] h-5 left-1/2 -translate-x-1/2 p-[2px] bg-gray-500 rounded-[7px] z-0 transition-all duration-[400ms]"
            style={{
              border: '2px ridge black',
              background: switchOn
                ? (indicatorColor === 'green' ? '#22c55e' : '#ef4444')
                : 'grey',
              boxShadow: switchOn
                ? (indicatorColor === 'green'
                  ? '0px 0px 10px rgba(34,197,94,1)'
                  : '0px 0px 10px rgba(239,68,68,1)')
                : 'none'
            }}
          >
            {/* Color overlay when lit */}
            {switchOn && (
              <div
                className="absolute w-full h-full left-0 top-0 opacity-30 transition-all duration-1000"
                style={{
                  mixBlendMode: 'overlay',
                  background: indicatorColor === 'green'
                    ? 'radial-gradient(at center, #86efac, #22c55e)'
                    : 'radial-gradient(at center, #fca5a5, #ef4444)'
                }}
              />
            )}
            {/* Glass texture */}
            <div
              className="absolute w-full h-full left-0 top-0 rounded-[7px] z-[1] border border-[#00000050] transition-all duration-1000"
              style={{
                opacity: switchOn ? 0.3 : 0.2,
                outline: '2px solid #a1a1a1',
                backgroundImage: 'radial-gradient(#ffffff50 2px, transparent 0)',
                backgroundSize: '5px 5px',
                backgroundPosition: '-18px -15px',
                boxShadow: switchOn
                  ? (indicatorColor === 'green'
                    ? '0px 0px 20px rgba(34,197,94,1)'
                    : '0px 0px 20px rgba(239,68,68,1)')
                  : 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
