import React, { useState } from 'react';
import { RefreshCw, MapPin, Clock } from 'lucide-react';
import { triggerIngest } from '../api/client.js';

const DAYS_OPTIONS = [
  { label: '24h', value: 1 },
  { label: '7g', value: 7 },
  { label: '14g', value: 14 },
  { label: '30g', value: 30 },
];

export default function Header({ cities, selectedCity, onCityChange, days, onDaysChange, onRefresh, lastUpdated }) {
  const [ingesting, setIngesting] = useState(false);

  async function handleIngest() {
    if (!selectedCity || ingesting) return;
    setIngesting(true);
    try {
      await triggerIngest(selectedCity.slug);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIngesting(false);
    }
  }

  const timeLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <MapPin size={14} className="text-white" />
          </div>
          <div>
            <span className="text-sm font-bold text-white">City</span>
            <span className="text-sm font-bold text-blue-400">Sentiment</span>
          </div>
        </div>
        <select
          value={selectedCity?.slug || ''}
          onChange={e => { const c = cities.find(c => c.slug === e.target.value); if (c) onCityChange(c); }}
          className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          {cities.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
        </select>
        <div className="flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-lg p-1">
          <Clock size={12} className="text-gray-500 ml-1" />
          {DAYS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => onDaysChange(opt.value)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                days === opt.value ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
              }`}
            >{opt.label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {timeLabel && <span className="text-xs text-gray-600 hidden sm:block">Aggiornato: {timeLabel}</span>}
          <button
            onClick={handleIngest}
            disabled={ingesting}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            <RefreshCw size={13} className={ingesting ? 'animate-spin' : ''} />
            {ingesting ? 'Aggiorno...' : 'Aggiorna'}
          </button>
        </div>
      </div>
    </header>
  );
}
