'use client';

import React, { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
  suggestions?: string[];
  showSuggestions?: boolean;
  icon?: React.ReactNode;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onSearch,
  suggestions = [],
  showSuggestions = false,
  icon,
  className = '',
  autoFocus = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowDropdown(false);
    if (onSearch) {
      onSearch(suggestion);
    }
  };

  const filteredSuggestions = suggestions.filter(s => 
    s.toLowerCase().includes(value.toLowerCase())
  );

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit}>
        <div className={`
          relative flex items-center
          bg-gray-900/50 backdrop-blur-sm
          border-2 rounded-lg transition-all duration-200
          ${isFocused 
            ? 'border-yellow-400/50 shadow-[0_0_20px_rgba(250,182,23,0.2)]' 
            : 'border-gray-700/50 hover:border-gray-600/50'
          }
        `}>
          {icon && (
            <div className="pl-4 text-gray-400">
              {icon}
            </div>
          )}
          
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              if (showSuggestions && e.target.value) {
                setShowDropdown(true);
              } else {
                setShowDropdown(false);
              }
            }}
            onFocus={() => {
              setIsFocused(true);
              if (showSuggestions && value) {
                setShowDropdown(true);
              }
            }}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={`
              flex-1 bg-transparent px-4 py-2 text-white
              placeholder:text-gray-500 focus:outline-none
              font-mono
            `}
            style={{ fontFamily: "'Consolas', 'Monaco', monospace" }}
          />
          
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setShowDropdown(false);
              }}
              className="pr-2 text-gray-400 hover:text-yellow-400 transition-colors"
            >
              ×
            </button>
          )}
          
          <button
            type="submit"
            className="px-4 py-2 text-yellow-400 hover:text-yellow-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>
      
      {showSuggestions && showDropdown && filteredSuggestions.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute z-10 w-full mt-2 bg-gray-900/95 backdrop-blur-sm 
                     border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-4 py-2 text-left text-gray-300 
                         hover:bg-yellow-400/10 hover:text-yellow-400 
                         transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

interface InlineSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const InlineSearch: React.FC<InlineSearchProps> = ({
  value,
  onChange,
  placeholder = 'Filter...',
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent border-b-2 border-gray-700 
                   focus:border-yellow-400 px-2 py-1 text-white
                   placeholder:text-gray-500 focus:outline-none
                   transition-colors"
        style={{ fontFamily: "'Consolas', 'Monaco', monospace" }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 
                     text-gray-400 hover:text-yellow-400 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
};