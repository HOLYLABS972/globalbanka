'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { translateCountryName, countryTranslations } from '../utils/countryTranslations';
import smartCountryService from '../services/smartCountryService';

// Helper function to convert Russian country name to English
const convertRussianToEnglish = (russianName) => {
  const russianTranslations = countryTranslations.ru;
  // Find the country code that matches the Russian name
  for (const [code, name] of Object.entries(russianTranslations)) {
    if (name.toLowerCase() === russianName.toLowerCase()) {
      // Return the English name
      return countryTranslations.en[code] || russianName;
    }
  }
  return russianName; // Return original if not found
};

const CountrySearchBar = ({ onSearch, showCountryCount = true }) => {
  const { t, locale: contextLocale } = useI18n();
  // Force Russian locale for main page
  const locale = 'ru';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  
  // Check if current locale is RTL
  const isRTL = locale === 'ar' || locale === 'he';
  
  const [popularCountries, setPopularCountries] = useState([]);

  // Load cached countries immediately on component mount
  useEffect(() => {
    const cachedCountries = smartCountryService.getImmediateCountries();
    // Take first 4 for popular suggestions
    const popular = cachedCountries.slice(0, 4).map(country => ({
      code: country.code,
      name: country.name
    }));
    setPopularCountries(popular);
    
    // Preload full countries in background
    smartCountryService.preloadCountries();
  }, []);

  // Read search parameter from URL and populate input
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    if (urlSearch) {
      setSearchValue(urlSearch);
    }
  }, [searchParams, searchValue]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    if (searchValue.trim()) {
      // Convert Russian name to English for API search
      const englishSearchTerm = convertRussianToEnglish(searchValue.trim());
      console.log('🔍 Converting search:', searchValue.trim(), '→', englishSearchTerm);
      
      // Navigate to main page with English search parameter
      const searchUrl = `/?search=${encodeURIComponent(englishSearchTerm)}`;
      router.push(searchUrl);
      
      // Also call onSearch callback if provided
      if (onSearch) {
        onSearch(englishSearchTerm);
      }
    } else {
      // Navigate to main page
      router.push('/');
    }
  };

  const handleInputChange = (e) => {
    setSearchValue(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative group">
          <input
            type="text"
            value={searchValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="🌍 Поиск страны"
            className={`w-full px-6 py-4 sm:py-5 ${isRTL ? 'pr-14 sm:pr-16 pl-6' : 'pr-14 sm:pr-16 pl-6'} text-base sm:text-lg text-white bg-gray-800/90 backdrop-blur-md border-2 border-gray-700 rounded-full focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 shadow-lg hover:shadow-xl placeholder:text-gray-500 placeholder:font-medium ${isRTL ? 'text-right' : 'text-left'}`}
          />
          <button
            type="submit"
            className={`absolute ${isRTL ? 'right-2 sm:right-3' : 'right-2 sm:right-3'} top-1/2 transform -translate-y-1/2 bg-blue-400/20 backdrop-blur-md hover:bg-blue-400/30 border-2 border-blue-400/50 hover:border-blue-400 p-3 sm:p-3.5 rounded-full transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400/50 shadow-lg`}
            aria-label="Search"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Search Suggestions */}
        <div className="mt-3 flex flex-wrap justify-center gap-2 px-2">
          {popularCountries.map((country) => {
            const translatedName = translateCountryName(country.code, country.name, locale);
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => {
                  // Convert Russian name to English for search
                  const englishName = convertRussianToEnglish(translatedName);
                  console.log('🔍 Popular country click:', translatedName, '→', englishName);
                  
                  // Don't update the input - just navigate with English name
                  router.push(`/?search=${encodeURIComponent(englishName)}`);
                }}
                className="bg-gray-700/50 backdrop-blur-sm hover:bg-gray-700/70 text-gray-300 hover:text-white border border-gray-600 hover:border-blue-400/50 px-4 py-2 rounded-full transition-all duration-200 text-sm font-medium"
              >
                {translatedName}
              </button>
            );
          })}
        </div>
      </form>
    </div>
  );
};

export default CountrySearchBar;
