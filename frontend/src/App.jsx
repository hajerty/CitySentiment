import React, { useState, useEffect, useMemo } from 'react';
import { getCities } from './api/client.js';
import { useDashboard } from './hooks/useDashboard.js';
import Header from './components/Header.jsx';
import StatCards from './components/StatCards.jsx';
import AiSummary from './components/AiSummary.jsx';
import SentimentGauge from './components/SentimentGauge.jsx';
import SentimentTimeline from './components/SentimentTimeline.jsx';
import TopTopics from './components/TopTopics.jsx';
import TopicTrends from './components/TopicTrends.jsx';
import SourceBreakdown from './components/SourceBreakdown.jsx';
import CorrelationMatrix from './components/CorrelationMatrix.jsx';
import ArticleFeed from './components/ArticleFeed.jsx';

function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      <p className="text-gray-500 text-sm">Caricamento dati in corso...</p>
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="text-4xl">⚠️</div>
      <p className="text-gray-400 text-sm max-w-md text-center">Errore nel caricamento: {error}</p>
      <button onClick={onRetry} className="text-sm px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
        Riprova
      </button>
      <p className="text-xs text-gray-600">Assicurati che il backend sia in esecuzione su localhost:3001</p>
    </div>
  );
}

export default function App() {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [days, setDays] = useState(7);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    getCities().then(data => {
      setCities(data);
      if (data.length > 0) setSelectedCity(data[0]);
    }).catch(console.error);
  }, []);

  const options = useMemo(() => ({ days }), [days]);
  const { data, loading, error, refetch } = useDashboard(selectedCity?.slug, options);

  function handleRefresh() {
    setLastUpdated(new Date().toISOString());
    return refetch();
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header
        cities={cities}
        selectedCity={selectedCity}
        onCityChange={city => setSelectedCity(city)}
        days={days}
        onDaysChange={setDays}
        onRefresh={handleRefresh}
        lastUpdated={lastUpdated}
      />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {loading && !data && <LoadingSpinner />}
        {error && !data && <ErrorState error={error} onRetry={refetch} />}
        {data && (
          <>
            {data.aiSummary && <AiSummary summary={data.aiSummary} cityName={data.city.name} />}
            <StatCards data={data} />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-1"><SentimentGauge sentiment={data.sentiment} /></div>
              <div className="lg:col-span-2"><SentimentTimeline data={data.sentimentTimeline} /></div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <SourceBreakdown data={data.sourceBreakdown} />
              <TopTopics data={data.topTopics} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TopicTrends data={data.topicTrends} topTopics={data.topTopics} />
              <CorrelationMatrix data={data.correlationData} />
            </div>
            <ArticleFeed articles={data.recentArticles} />
          </>
        )}
      </main>
      <footer className="border-t border-gray-800 mt-12 py-4 text-center">
        <p className="text-xs text-gray-700">CitySentiment — Analisi trend e sentiment urbani • Powered by Claude AI</p>
      </footer>
    </div>
  );
}
