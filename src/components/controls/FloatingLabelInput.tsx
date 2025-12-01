import React from 'react';
import styles from './FloatingLabelInput.module.css';

const FloatingLabelInput = () => {
  return (
    <div className="relative">
      <input
        required
        type="text"
        className={`${styles.input} text-base py-2.5 px-2.5 pl-1.5 block w-[200px] border-none border-b border-[#515151] bg-transparent text-white focus:outline-none peer`}
      />
      <span className={`${styles.highlight} absolute h-[60%] w-[100px] top-[25%] left-0 pointer-events-none opacity-50`} />
      <span className={`${styles.bar} relative block w-[200px]`} />
      <label className="absolute left-1.5 top-2.5 text-[#999] text-lg font-normal pointer-events-none transition-all duration-200 ease-in-out peer-focus:top-[-20px] peer-focus:text-sm peer-focus:text-[#5264AE] peer-valid:top-[-20px] peer-valid:text-sm peer-valid:text-[#5264AE]">
        Name
      </label>
    </div>
  );
}

export default FloatingLabelInput;
