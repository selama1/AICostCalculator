
import React, { useState, useRef, useEffect } from 'react';
import { AIProvider, AIModel, AIResponseData, FileAttachment, ThinkingLevel, HistoryEntry, GeminiModel, MediaPart } from './types';
import { callAI } from './services/aiService';
import { MODEL_LABELS, MODEL_PRICING, PROVIDER_CONFIG } from './constants';
import CostDisplay from './components/CostDisplay';
import JsonViewer from './components/JsonViewer';

const App: React.FC = () => {
  const [activeProvider, setActiveProvider] = useState<AIProvider>(AIProvider.GOOGLE);
  const [model, setModel] = useState<AIModel>(GeminiModel.FLASH_3);
  const [promptTitle, setPromptTitle] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AIResponseData | null>(null);
  
  // Thinking Config State
  const [thinkingMode, setThinkingMode] = useState<'NONE' | 'BUDGET' | 'LEVEL'>('NONE');
  const [thinkingBudget, setThinkingBudget] = useState<number>(1024);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>('MEDIUM');

  // History State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  
  // Load History State
  const [pendingLoadHistory, setPendingLoadHistory] = useState<HistoryEntry[] | null>(null);
  const [showLoadModal, setShowLoadModal] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const historyLoadRef = useRef<HTMLInputElement>(null);

  // Filter models based on selected provider
  const availableModels = Object.entries(MODEL_LABELS).filter(([id]) => 
    MODEL_PRICING[id].provider === activeProvider
  );

  const theme = PROVIDER_CONFIG[activeProvider];

  const handleProviderChange = (p: AIProvider) => {
    setActiveProvider(p);
    const firstModel = Object.keys(MODEL_PRICING).find(id => MODEL_PRICING[id].provider === p);
    if (firstModel) setModel(firstModel);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newAttachments: FileAttachment[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const promise = new Promise<FileAttachment>((resolve, reject) => {
        reader.onload = (event) => {
          try {
            const resultString = event.target?.result as string;
            if (!resultString) throw new Error("Failed to read file");
            const base64Data = resultString.split(',')[1];
            resolve({
              name: file.name || 'unnamed-file',
              mimeType: file.type || 'application/octet-stream',
              data: base64Data,
              previewUrl: URL.createObjectURL(file),
            });
          } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });
      try {
        const attachment = await promise;
        newAttachments.push(attachment);
      } catch (err) { console.error("Error processing file:", err); }
    }
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index]?.previewUrl) URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const saveHistory = () => {
    if (history.length === 0) return;
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gemini-cost-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const triggerLoadHistory = () => {
    historyLoadRef.current?.click();
  };

  const handleLoadFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          if (history.length > 0) {
            setPendingLoadHistory(json);
            setShowLoadModal(true);
          } else {
            setHistory(json);
          }
        } else {
          alert("Invalid history file format.");
        }
      } catch (err) {
        alert("Failed to parse history file.");
      }
      if (historyLoadRef.current) historyLoadRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const confirmLoad = (append: boolean) => {
    if (!pendingLoadHistory) return;
    if (append) {
      setHistory(prev => [...pendingLoadHistory, ...prev]);
    } else {
      setHistory(pendingLoadHistory);
    }
    setPendingLoadHistory(null);
    setShowLoadModal(false);
  };

  const handleRun = async () => {
    if (!prompt.trim() && attachments.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const thinkingOptions = thinkingMode === 'BUDGET' 
        ? { budget: thinkingBudget } 
        : thinkingMode === 'LEVEL' 
        ? { level: thinkingLevel }
        : undefined;

      const data = await callAI(model, prompt, attachments, thinkingOptions);
      setResult(data);

      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        provider: activeProvider,
        model,
        title: promptTitle,
        prompt,
        attachments: [...attachments],
        thinkingMode,
        thinkingBudget,
        thinkingLevel,
        result: data
      };
      setHistory(prev => [newEntry, ...prev]);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const revertToHistory = (entry: HistoryEntry) => {
    setActiveProvider(entry.provider);
    setModel(entry.model);
    setPromptTitle(entry.title || '');
    setPrompt(entry.prompt);
    setAttachments([...entry.attachments]);
    setThinkingMode(entry.thinkingMode);
    setThinkingBudget(entry.thinkingBudget);
    setThinkingLevel(entry.thinkingLevel);
    setResult(entry.result);
    setError(null);
    setIsHistoryOpen(false);
  };

  const renderMediaPart = (part: MediaPart, index: number) => {
    const download = () => {
      const a = document.createElement('a');
      a.href = part.url;
      a.download = `${part.name}-${index}.${part.mimeType.split('/')[1].split(';')[0]}`;
      a.click();
    };

    return (
      <div key={index} className="bg-slate-900/60 rounded-lg border border-slate-700 p-4 mb-4 overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            {part.type === 'image' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            {part.type === 'audio' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>}
            {part.type === 'video' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            {part.name}
          </span>
          <button 
            onClick={download}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-indigo-400 px-3 py-1 rounded border border-slate-700 flex items-center gap-1 transition-all"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download
          </button>
        </div>
        
        {part.type === 'image' && <img src={part.url} alt={part.name} className="max-w-full rounded-lg shadow-lg border border-slate-700 mx-auto" />}
        {part.type === 'audio' && <audio src={part.url} controls className="w-full mt-2 filter invert" />}
        {part.type === 'video' && <video src={part.url} controls className="w-full max-h-[400px] rounded-lg shadow-lg border border-slate-700" />}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto">
      {/* Header */}
      <header className="w-full mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
            Universal Cost Estimator
          </h1>
          <p className="text-slate-400 text-lg">Compare token costs across various AI providers.</p>
        </div>
        <button 
          onClick={() => setIsHistoryOpen(true)}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-2.5 rounded-full border border-slate-700 transition-all shadow-lg active:scale-95"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          History ({history.length})
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Column: Input Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className={`bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl transition-colors duration-500`}>
            
            {/* Provider Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">AI Provider</label>
              <div className="flex gap-2">
                {Object.values(AIProvider).map(p => (
                  <button
                    key={p}
                    onClick={() => handleProviderChange(p)}
                    className={`flex-1 py-2 px-3 text-xs font-bold rounded border transition-all ${
                      activeProvider === p 
                        ? `border-${PROVIDER_CONFIG[p].color}-500 bg-${PROVIDER_CONFIG[p].color}-500/20 text-${PROVIDER_CONFIG[p].color}-200`
                        : 'border-slate-700 text-slate-500 hover:bg-slate-700/50'
                    }`}
                  >
                    {PROVIDER_CONFIG[p].name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as AIModel)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                {availableModels.map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Thinking Configuration */}
            {activeProvider === AIProvider.GOOGLE && (
              <div className="mb-6 p-4 bg-slate-900/40 rounded-lg border border-slate-700 animate-in fade-in duration-300">
                <label className="block text-sm font-semibold text-indigo-400 mb-3 uppercase tracking-wider">Thinking Config</label>
                <div className="flex gap-2 mb-4">
                  {(['NONE', 'BUDGET', 'LEVEL'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setThinkingMode(mode)}
                      className={`flex-1 py-1.5 px-2 text-xs font-bold rounded transition-all ${
                        thinkingMode === mode 
                          ? 'bg-indigo-600 text-white shadow-md' 
                          : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                {thinkingMode === 'BUDGET' && (
                  <input type="number" value={thinkingBudget} onChange={(e) => setThinkingBudget(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-sm" />
                )}
                {thinkingMode === 'LEVEL' && (
                  <div className="grid grid-cols-3 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                      <button key={level} onClick={() => setThinkingLevel(level)}
                        className={`py-1 text-[10px] rounded border transition-all ${
                          thinkingLevel === level ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200' : 'border-slate-700 text-slate-500'
                        }`}
                      > {level} </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Analysis Title (Optional)</label>
              <input
                type="text"
                value={promptTitle}
                onChange={(e) => setPromptTitle(e.target.value)}
                placeholder="e.g., Q3 Report Analysis"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all mb-2"
              />
              <label className="block text-sm font-semibold text-slate-300 mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={`Enter instructions for ${activeProvider}...`}
                className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none mb-4"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Multi-modal Context (Attached Files)</label>
              <div className="flex flex-wrap gap-3 mb-4">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-600 bg-slate-900 shadow-md">
                    {file.mimeType?.startsWith('image/') ? (
                      <img src={file.previewUrl} className="w-full h-full object-cover" alt={file.name} />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-400 p-2 text-center font-bold uppercase">
                        <svg className="w-6 h-6 mb-1 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="truncate w-full px-1">{file.mimeType.split('/')[1]}</span>
                      </div>
                    )}
                    {/* Filename Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white p-1 truncate leading-tight font-medium opacity-100 group-hover:opacity-40 transition-opacity">
                      {file.name}
                    </div>
                    <button onClick={() => removeAttachment(idx)} className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-600 hover:border-indigo-500 hover:bg-slate-700/20 flex flex-col items-center justify-center text-slate-500 transition-all gap-1">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                  <span className="text-[10px] font-bold">Attach File</span>
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*,audio/*,video/*,application/pdf" />
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : `bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95 shadow-indigo-500/20`
              }`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : "Run Analysis"}
            </button>
            
            {error && <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm"><strong>Error:</strong> {error}</div>}
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700 text-center">
              <h3 className="text-xl font-semibold text-slate-400">Analysis Engine Ready</h3>
              <p className="text-slate-500 mt-2 max-w-sm">Results will appear here including cost breakdowns and raw API metadata.</p>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20">
              <CostDisplay estimate={result.estimate} />

              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-${theme.color}-500`}></div>
                    <h3 className="text-xl font-bold text-slate-200">
                      {promptTitle || theme.name}
                    </h3>
                  </div>
                  {promptTitle && (
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      via {MODEL_LABELS[model]}
                    </span>
                  )}
                </div>
                
                <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-700 min-h-[100px]">
                  {/* Render Media Content */}
                  {result.mediaParts && result.mediaParts.length > 0 && (
                    <div className="mb-6 space-y-4">
                      {result.mediaParts.map((part, idx) => renderMediaPart(part, idx))}
                    </div>
                  )}

                  {/* Render Text Content */}
                  <div className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed">
                    {result.text || (result.mediaParts.length === 0 ? "(No response text)" : "")}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <JsonViewer data={result.requestConfig} title="Internal Request Config" />
                <JsonViewer data={result.metadata} title="Raw API Response" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Sidebar */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Execution History</h2>
              <button onClick={() => setIsHistoryOpen(false)}><svg className="w-6 h-6 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            
            {/* History Controls */}
            <div className="px-6 py-4 bg-slate-800/30 border-b border-slate-800 flex gap-2">
              <button 
                onClick={saveHistory}
                disabled={history.length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-slate-300 rounded border border-slate-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
                Save
              </button>
              <button 
                onClick={triggerLoadHistory}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 rounded border border-slate-700 transition-all"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-8l-4-4m0 0l-4 4m4-4v12" /></svg>
                Load
              </button>
              <input type="file" ref={historyLoadRef} className="hidden" accept=".json" onChange={handleLoadFileChange} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-slate-600 text-center px-4">
                  <svg className="w-12 h-12 mb-2 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm">No history yet.</p>
                </div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="bg-slate-800/40 rounded-lg border border-slate-700 p-4 hover:border-indigo-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">{new Date(entry.timestamp).toLocaleString()}</span>
                      <span className={`text-[9px] px-2 py-0.5 rounded border border-${PROVIDER_CONFIG[entry.provider].color}-500/30 text-${PROVIDER_CONFIG[entry.provider].color}-400 font-bold uppercase`}>
                        {entry.provider}
                      </span>
                    </div>
                    {/* Use user title or model label */}
                    <div className="text-sm font-bold text-slate-200 truncate mb-0.5">
                      {entry.title || MODEL_LABELS[entry.model]}
                    </div>
                    {entry.title && (
                      <div className="text-[10px] text-slate-500 mb-2 truncate">
                        {MODEL_LABELS[entry.model]}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 line-clamp-1 mb-3 italic">
                      "{entry.prompt || "Multi-modal context"}"
                    </p>
                    <button onClick={() => revertToHistory(entry)} className="w-full py-1.5 text-xs font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-600 hover:text-white transition-all">Revert State</button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Load Confirmation Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowLoadModal(false)} />
          <div className="relative bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-8 max-w-sm w-full animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-white mb-2">Load History</h3>
            <p className="text-slate-400 text-sm mb-8">You already have active history entries. How would you like to load the new file?</p>
            <div className="space-y-3">
              <button 
                onClick={() => confirmLoad(true)}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
              >
                Append to Current
              </button>
              <button 
                onClick={() => confirmLoad(false)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl border border-slate-700 transition-all"
              >
                Replace Entire History
              </button>
              <button 
                onClick={() => setShowLoadModal(false)}
                className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
