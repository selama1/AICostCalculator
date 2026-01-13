
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { CostEstimate, PricingUnit } from '../types';

interface CostDisplayProps {
  estimate: CostEstimate;
}

const CostDisplay: React.FC<CostDisplayProps> = ({ estimate }) => {
  const totalOut = estimate.outputTokens || 1;
  const isTokens = estimate.outputUnit === PricingUnit.TOKENS;
  const textRatio = isTokens ? (estimate.textTokens / totalOut) : 1;
  const thinkRatio = isTokens ? (estimate.thinkingTokens / totalOut) : 0;

  const unitLabel = 
    estimate.outputUnit === PricingUnit.TOKENS ? 'tokens' : 
    estimate.outputUnit === PricingUnit.SECONDS ? 'seconds' : 'images';

  const data = [
    ...estimate.inputBreakdown.map(ib => ({
      name: `In: ${ib.modality}`,
      value: ib.cost,
      tokens: ib.tokens,
      color: ib.modality === 'AUDIO' ? '#a78bfa' : ib.modality === 'VIDEO' ? '#f472b6' : '#60a5fa'
    })),
    { 
      name: `Out: ${isTokens ? 'Text' : 'Generated'}`, 
      value: textRatio * estimate.outputCost, 
      tokens: isTokens ? estimate.textTokens : estimate.outputTokens, 
      color: '#34d399' 
    },
    ...(isTokens && estimate.thinkingTokens > 0 ? [{ 
      name: 'Out: Thinking', 
      value: thinkRatio * estimate.outputCost, 
      tokens: estimate.thinkingTokens, 
      color: '#fbbf24' 
    }] : []),
  ].filter(d => d.tokens > 0);

  return (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-indigo-400">Execution Analysis</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-tighter ${
            estimate.isHighTier 
              ? 'bg-red-900/40 text-red-400 border-red-500/50' 
              : 'bg-emerald-900/40 text-emerald-400 border-emerald-500/50'
          }`}>
            {estimate.isHighTier ? 'High Tier (>200k)' : 'Standard Tier'}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {estimate.inputBreakdown.map(ib => (
            <span key={ib.modality} className="text-[10px] font-bold bg-slate-900/60 text-slate-400 px-2 py-1 rounded border border-slate-700 uppercase tracking-widest">
              {ib.modality} In: ${ib.rate}/1M
            </span>
          ))}
          <span className="text-[10px] font-bold bg-slate-900/60 text-slate-400 px-2 py-1 rounded border border-slate-700 uppercase tracking-widest">
            Out: ${estimate.outputRate}/{estimate.outputUnit === PricingUnit.TOKENS ? '1M tokens' : estimate.outputUnit === PricingUnit.SECONDS ? 'sec' : 'img'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="tokens"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value: any, name: string) => [`${Number(value).toLocaleString()} ${unitLabel}`, name]}
              />
              <Legend verticalAlign="bottom" height={48} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 shadow-inner">
            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Total Estimated Cost</div>
            <div className="text-4xl font-bold text-white font-mono">
              ${estimate.totalCost.toFixed(6)}
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-2">
            {estimate.inputBreakdown.map(ib => (
              <div key={ib.modality} className="flex justify-between items-center p-2.5 bg-slate-900/30 rounded border border-slate-700/50">
                <span className="text-xs text-blue-400 font-bold uppercase">{ib.modality} Input</span>
                <div className="text-right">
                  <div className="text-lg font-mono text-white leading-none">{ib.tokens.toLocaleString()} tokens</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">${ib.cost.toFixed(6)}</div>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center p-2.5 bg-slate-900/30 rounded border border-slate-700/50">
              <span className="text-xs text-emerald-400 font-bold uppercase">Output ({unitLabel})</span>
              <div className="text-right">
                <div className="text-lg font-mono text-white leading-none">{estimate.outputTokens.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-1">${estimate.outputCost.toFixed(6)}</div>
              </div>
            </div>
            {isTokens && estimate.thinkingTokens > 0 && (
              <div className="flex justify-between items-center p-2.5 bg-slate-900/30 rounded border border-slate-700/50">
                <span className="text-xs text-amber-500 font-bold uppercase">Thinking tokens</span>
                <div className="text-right">
                  <div className="text-lg font-mono text-white leading-none">{estimate.thinkingTokens.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500 font-mono mt-1">${((estimate.thinkingTokens/totalOut) * estimate.outputCost).toFixed(6)}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CostDisplay;
