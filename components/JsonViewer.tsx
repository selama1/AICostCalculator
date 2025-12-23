
import React from 'react';

interface JsonViewerProps {
  data: any;
  title: string;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data, title }) => {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl">
      <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex justify-between items-center">
        <span className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{title}</span>
        <button 
          onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-2 py-1 rounded text-slate-200 transition-colors"
        >
          Copy JSON
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-blue-300 overflow-auto max-h-[500px] scrollbar-thin scrollbar-thumb-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  );
};

export default JsonViewer;
