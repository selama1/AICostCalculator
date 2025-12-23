
import React, { useState, useRef, useEffect } from 'react';
import { GeminiModel, GeminiResponseData, FileAttachment, ThinkingLevel, HistoryEntry } from './types';
import { callGemini } from './services/geminiService';
import { MODEL_LABELS } from './constants';
import CostDisplay from './components/CostDisplay';
import JsonViewer from './components/JsonViewer';

const App: React.FC = () => {
  const [model, setModel] = useState<GeminiModel>(GeminiModel.FLASH_3);
  const [prompt, setPrompt] = useState<string>('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeminiResponseData | null>(null);
  
  // Thinking Config State
  const [thinkingMode, setThinkingMode] = useState<'NONE' | 'BUDGET' | 'LEVEL'>('NONE');
  const [thinkingBudget, setThinkingBudget] = useState<number>(1024);
  const [thinkingLevel, setThinkingLevel] = useState<ThinkingLevel>('MEDIUM');

  // History State
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("File reading failed"));
        reader.readAsDataURL(file);
      });

      try {
        const attachment = await promise;
        newAttachments.push(attachment);
      } catch (err) {
        console.error("Error processing file:", err);
      }
    }
    
    setAttachments(prev => [...prev, ...newAttachments]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => {
      const updated = [...prev];
      if (updated[index]?.previewUrl) {
        URL.revokeObjectURL(updated[index].previewUrl);
      }
      updated.splice(index, 1);
      return updated;
    });
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

      const data = await callGemini(model, prompt, attachments, thinkingOptions);
      setResult(data);

      // Save to history
      const newEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        model,
        prompt,
        attachments: [...attachments],
        thinkingMode,
        thinkingBudget,
        thinkingLevel,
        result: data
      };
      setHistory(prev => [newEntry, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const revertToHistory = (entry: HistoryEntry) => {
    setModel(entry.model);
    setPrompt(entry.prompt);
    setAttachments([...entry.attachments]);
    setThinkingMode(entry.thinkingMode);
    setThinkingBudget(entry.thinkingBudget);
    setThinkingLevel(entry.thinkingLevel);
    setResult(entry.result);
    setError(null);
    setIsHistoryOpen(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center max-w-7xl mx-auto">
      {/* Header */}
      <header className="w-full mb-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2">
            Gemini Cost Estimator
          </h1>
          <p className="text-slate-400 text-lg">Analyze token usage and API costs for multi-modal calls.</p>
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
        {/* Left Column: Input Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Model Selection</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as GeminiModel)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              >
                {Object.entries(MODEL_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {/* Thinking Configuration */}
            <div className="mb-6 p-4 bg-slate-900/40 rounded-lg border border-slate-700">
              <label className="block text-sm font-semibold text-indigo-400 mb-3 uppercase tracking-wider">Thinking Configuration</label>
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
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-xs text-slate-400">Budget (max thinking tokens)</label>
                  <input 
                    type="number"
                    value={thinkingBudget}
                    onChange={(e) => setThinkingBudget(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-sm"
                  />
                </div>
              )}

              {thinkingMode === 'LEVEL' && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                  <label className="text-xs text-slate-400">Thinking Intensity</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => setThinkingLevel(level)}
                        className={`py-1 text-[10px] rounded border transition-all ${
                          thinkingLevel === level 
                            ? 'border-indigo-500 bg-indigo-500/20 text-indigo-200' 
                            : 'border-slate-700 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <label className="block text-sm font-semibold text-slate-300 mb-2">Prompt / Instructions</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your prompt here..."
              className="w-full h-40 bg-slate-900 border border-slate-700 rounded-lg p-4 text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none mb-4"
            />

            <div className="mb-6">
              <label className="block text-sm font-semibold text-slate-300 mb-2">Attachments</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {attachments.map((file, idx) => (
                  <div key={idx} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-600 bg-slate-900">
                    {(file.mimeType?.startsWith('image/')) ? (
                      <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-[10px] text-slate-400 p-1 text-center">
                         <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                         </svg>
                         <span className="truncate w-full px-1">{file.name}</span>
                      </div>
                    )}
                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="absolute top-0 right-0 bg-red-600 text-white p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-600 hover:border-blue-500 hover:bg-slate-700/30 flex items-center justify-center text-slate-500 hover:text-blue-400 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept="image/*,audio/*,video/*,application/pdf"
              />
            </div>

            <button
              onClick={handleRun}
              disabled={loading || (!prompt.trim() && attachments.length === 0)}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                loading || (!prompt.trim() && attachments.length === 0)
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white active:scale-[0.98]'
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
              ) : 'Estimate & Call API'}
            </button>
            
            {error && (
              <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                <strong>Error:</strong> {error}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Results & Analysis */}
        <div className="lg:col-span-7 space-y-6">
          {!result && !loading && (
            <div className="h-full flex flex-col items-center justify-center p-12 bg-slate-800/20 rounded-xl border border-dashed border-slate-700 text-center">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.674M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-400">Ready to Analyze</h3>
              <p className="text-slate-500 mt-2 max-w-sm">
                Configure your request on the left. The tool will calculate costs including reasoning (thinking) tokens.
              </p>
            </div>
          )}

          {result && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
              <CostDisplay estimate={result.estimate} />

              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
                <h3 className="text-xl font-bold mb-4 text-indigo-400">Model Output</h3>
                <div className="bg-slate-900/80 p-5 rounded-lg border border-slate-700 min-h-[100px] prose prose-invert max-w-none">
                  {result.imageUrl && (
                    <img src={result.imageUrl} alt="Generated output" className="max-w-full rounded-lg mb-4 border border-slate-700 shadow-lg mx-auto" />
                  )}
                  {result.text ? (
                    <div className="whitespace-pre-wrap text-slate-200 font-sans leading-relaxed">
                      {result.text}
                    </div>
                  ) : !result.imageUrl && (
                    <p className="italic text-slate-500">No text content returned.</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <JsonViewer data={result.requestConfig} title="API Request Config (Verification)" />
                <JsonViewer data={result.metadata} title="Full API Response Metadata" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History Sidebar/Drawer */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsHistoryOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-700 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-800/50">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Call History
              </h2>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <p>No queries yet this session.</p>
                </div>
              ) : (
                history.map((entry) => (
                  <div key={entry.id} className="bg-slate-800/40 rounded-lg border border-slate-700 p-4 hover:border-indigo-500/50 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-xs font-mono text-emerald-400">
                        ${entry.result.estimate.totalCost.toFixed(5)}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-200 mb-1 truncate">{MODEL_LABELS[entry.model]}</div>
                    <p className="text-xs text-slate-400 line-clamp-2 mb-3 italic">
                      {entry.prompt || `(Attachment: ${entry.attachments[0]?.name})`}
                    </p>
                    <button 
                      onClick={() => revertToHistory(entry)}
                      className="w-full py-1.5 text-xs font-bold bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 rounded hover:bg-indigo-600 hover:text-white transition-all"
                    >
                      Revert to this query
                    </button>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-800/30">
              <button 
                onClick={() => setHistory([])}
                className="w-full text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear session history
              </button>
            </div>
          </div>
        </div>
      )}
      
      <footer className="mt-auto py-10 text-slate-500 text-sm flex items-center gap-4">
        <span>© 2024 Gemini Cost Estimator Tool</span>
        <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
        <a href="https://ai.google.dev/pricing" target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors">Pricing Documentation</a>
      </footer>
    </div>
  );
};

export default App;
