s/<div className="text-center">(\s*){\/\* Stock \*\/}/<div className="text-center h-[60px] flex flex-col justify-between">\1{\/\* Stock \*\/}/g
s/<div className="text-center">(\s*){\/\* Price - Extra responsive sizing for very large numbers \*\/}/<div className="text-center h-[60px] flex flex-col justify-between">\1{\/\* Price - Extra responsive sizing for very large numbers \*\/}/g
s/className="font-semibold text-cyan-300 leading-none drop-shadow-\[0_0_12px_rgba\(0,255,255,0\.9\)\]"/className="font-semibold text-cyan-300 leading-none drop-shadow-[0_0_12px_rgba(0,255,255,0.9)] flex items-center justify-center"/g
s/min-h-\[2\.25rem\] //g
