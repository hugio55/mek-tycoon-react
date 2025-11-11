import React, { useState } from 'react';

const HoverTooltip = () => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex justify-start pr-[170px] cursor-pointer">
      <div
        className="my-[150px] mx-auto relative flex justify-center items-center"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Hint Radius (background pulse) */}
        <span
          className={`absolute top-1/2 left-1/2 -mt-[125px] -ml-[125px] bg-white/10 rounded-full transition-all duration-700 ${
            isHovered ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-0'
          }`}
          style={{ width: '250px', height: '250px' }}
        />

        {/* Hint Dot (the clickable circle) */}
        <span className="z-[3] border border-[#ffe4e4] rounded-full w-[60px] h-[60px] scale-95 flex items-center justify-center text-white">
          Tip
        </span>

        {/* Hint Content (tooltip box) */}
        <div
          className={`w-[300px] absolute z-[5] py-[35px] text-white pointer-events-none transition-all duration-700 ${
            isHovered ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
          style={{ bottom: '85px', left: '50%', marginLeft: '56px' }}
        >
          {/* Line before (horizontal) */}
          <div
            className={`absolute bottom-[29px] left-0 h-[1px] bg-white transition-all duration-400 ${
              isHovered ? 'w-[180px]' : 'w-0'
            }`}
          />

          {/* Line after (diagonal) */}
          <div
            className={`absolute bottom-[29px] left-0 w-[80px] h-[1px] bg-white transition-opacity duration-500 origin-left ${
              isHovered ? 'opacity-100 visible' : 'opacity-0'
            }`}
            style={{ transform: 'rotate(-225deg)' }}
          />

          {/* Tooltip Text */}
          <p className="text-white">
            Use Navbar to navigate the website quickly and easily.
          </p>
        </div>
      </div>
    </div>
  );
}

export default HoverTooltip;
