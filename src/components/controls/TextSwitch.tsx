import React, { useState } from 'react';

const TextSwitch = () => {
  const [isChecked, setIsChecked] = useState(false);

  return (
    <div className="flex items-center text-zinc-400 text-xs font-['Helvetica_Neue',Helvetica,Arial,sans-serif] leading-[15px] select-none">
      <input
        checked={isChecked}
        onChange={(e) => setIsChecked(e.target.checked)}
        name="switch"
        id="text-switch"
        type="checkbox"
        className="sr-only"
      />
      <label htmlFor="text-switch" className="flex items-center cursor-pointer">
        {/* Track */}
        <div className="relative mr-2">
          <div
            className={`w-[25px] h-[15px] rounded-full transition-colors duration-125 ease-out ${
              isChecked ? 'bg-[#ffb500]' : 'bg-[#05012c]'
            }`}
          />
          {/* Thumb */}
          <div
            className={`absolute left-[1px] top-[1px] w-[13px] h-[13px] bg-white rounded-full shadow-[0_3px_1px_0_rgba(37,34,71,0.05),0_2px_2px_0_rgba(37,34,71,0.1),0_3px_3px_0_rgba(37,34,71,0.05)] transition-transform duration-125 ease-out ${
              isChecked ? 'translate-x-[10px]' : ''
            }`}
          />
        </div>

        {/* Text Labels */}
        <span className="block mr-[0.3em]">This is </span>
        <span className="block font-bold h-[15px] w-[25px] overflow-hidden relative">
          {/* Unchecked text */}
          <span
            className={`absolute left-0 top-0 transition-all duration-125 ease-out ${
              isChecked ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'
            }`}
          >
            <span className="absolute invisible">Unchecked: </span>
            Off
          </span>
          {/* Checked text */}
          <span
            className={`absolute left-0 top-0 transition-all duration-125 ease-out ${
              isChecked ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-full'
            }`}
          >
            <span className="absolute invisible">Checked: </span>
            On
          </span>
        </span>
      </label>
    </div>
  );
}

export default TextSwitch;
