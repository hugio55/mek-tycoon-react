import React, { ReactNode } from 'react';

interface StarBurstButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

const StarBurstButton: React.FC<StarBurstButtonProps> = ({
  children,
  onClick,
  className = ''
}) => {
  return (
    <>
      <style>
        {`
          @keyframes star-rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes dots {
            0% {
              background-position: 0 0, 4px 4px;
            }
            100% {
              background-position: 8px 0, 12px 4px;
            }
          }
        `}
      </style>
      <button
        className={`
          starburst-button
          relative inline-flex items-center justify-center
          font-bold leading-none text-base rounded-[1rem]
          outline-offset-[6px] cursor-pointer
          text-stone-50
          focus-visible:outline-dashed focus-visible:outline-2 focus-visible:outline-yellow-400
          active:outline-2 active:outline-yellow-400
          ${className}
        `}
        onClick={onClick}
        style={{
          fontFamily: '"Rubik", "Orbitron", sans-serif',
          outline: '2px solid transparent',
        }}
      >
        {/* Rotating star burst background */}
        <span
          className="absolute z-0 m-auto opacity-10 hover:opacity-100 transition-opacity duration-150 pointer-events-none"
          style={{
            height: '200%',
            maxHeight: '100px',
            aspectRatio: '1',
            background: 'white',
            clipPath: `polygon(
              100% 50%, 91.48% 56.57%, 97.55% 65.45%, 87.42% 69.07%, 90.45% 79.39%,
              79.7% 79.7%, 79.39% 90.45%, 69.07% 87.42%, 65.45% 97.55%, 56.57% 91.48%,
              50% 100%, 43.43% 91.48%, 34.55% 97.55%, 30.93% 87.42%, 20.61% 90.45%,
              20.3% 79.7%, 9.55% 79.39%, 12.58% 69.07%, 2.45% 65.45%, 8.52% 56.57%,
              0% 50%, 8.52% 43.43%, 2.45% 34.55%, 12.58% 30.93%, 9.55% 20.61%,
              20.3% 20.3%, 20.61% 9.55%, 30.93% 12.58%, 34.55% 2.45%, 43.43% 8.52%,
              50% 0%, 56.57% 8.52%, 65.45% 2.45%, 69.07% 12.58%, 79.39% 9.55%,
              79.7% 20.3%, 90.45% 20.61%, 87.42% 30.93%, 97.55% 34.55%, 91.48% 43.43%
            )`,
            animation: 'star-rotate 4s linear infinite',
          }}
        />

        {/* Outer wrapper - yellow background with shadow layers */}
        <div
          className="starburst-outer p-[2px] rounded-[1rem] transition-all duration-150"
          style={{
            backgroundColor: '#facc15',
            transform: 'translate(-4px, -4px)',
            boxShadow: `
              0.5px 0.5px 0 0 #facc15,
              1px 1px 0 0 #facc15,
              1.5px 1.5px 0 0 #facc15,
              2px 2px 0 0 #facc15,
              2.5px 2.5px 0 0 #facc15,
              3px 3px 0 0 #facc15,
              0 0 0 2px #292524,
              0.5px 0.5px 0 2px #292524,
              1px 1px 0 2px #292524,
              1.5px 1.5px 0 2px #292524,
              2px 2px 0 2px #292524,
              2.5px 2.5px 0 2px #292524,
              3px 3px 0 2px #292524,
              3.5px 3.5px 0 2px #292524,
              4px 4px 0 2px #292524,
              0 0 0 4px #fafaf9,
              0.5px 0.5px 0 4px #fafaf9,
              1px 1px 0 4px #fafaf9,
              1.5px 1.5px 0 4px #fafaf9,
              2px 2px 0 4px #fafaf9,
              2.5px 2.5px 0 4px #fafaf9,
              3px 3px 0 4px #fafaf9,
              3.5px 3.5px 0 4px #fafaf9,
              4px 4px 0 4px #fafaf9
            `,
          }}
        >
          {/* Inner wrapper - dark background with dotted pattern */}
          <div
            className="relative pointer-events-none rounded-[calc(1rem-2px)]"
            style={{ backgroundColor: '#292524' }}
          >
            {/* Dotted pattern overlay */}
            <div
              className="absolute inset-0 rounded-[1rem] opacity-10 mix-blend-hard-light"
              style={{
                backgroundImage: `
                  radial-gradient(rgb(255 255 255 / 80%) 20%, transparent 20%),
                  radial-gradient(rgb(255 255 255 / 100%) 20%, transparent 20%)
                `,
                backgroundPosition: '0 0, 4px 4px',
                backgroundSize: '8px 8px',
                boxShadow: 'inset 0 0 0 1px #292524',
                animation: 'dots 0.4s infinite linear',
              }}
            />

            {/* Content wrapper */}
            <div
              className="relative flex items-center px-5 py-3 gap-1 text-stone-50 active:translate-y-[2px] transition-all duration-150"
              style={{
                filter: 'drop-shadow(0 -1px 0 #292524)',
              }}
            >
              {children}
            </div>
          </div>
        </div>
      </button>

      {/* Hover styles injected via style tag */}
      <style>
        {`
          .starburst-button:hover .starburst-outer {
            transform: translate(0, 0) !important;
            box-shadow:
              0 0 0 0 #facc15,
              0 0 0 0 #facc15,
              0 0 0 0 #facc15,
              0 0 0 0 #facc15,
              0 0 0 0 #facc15,
              0 0 0 0 #facc15,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 2px #292524,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9,
              0 0 0 4px #fafaf9 !important;
          }

          .starburst-button:hover span:first-of-type {
            opacity: 1 !important;
          }
        `}
      </style>
    </>
  );
};

export default StarBurstButton;
