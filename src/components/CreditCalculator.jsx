
'use client';
import { useState } from 'react';

export default function CreditCalculator() {
  const [credits, setCredits] = useState(500);
  const models = [
    { name: "Seedance Fast", cost: 13 },
    { name: "Kling 3.0", cost: 40 },
    { name: "Veo 3.1", cost: 50 }
  ];

  return (
    <div className="mt-12 bg-D7FF00 p-8 rounded-2xl text-black">
      <h3 className="text-2xl font-black uppercase mb-4">Calculadora de Créditos</h3>
      <input 
        type="range" min="50" max="3000" step="50" value={credits} 
        onChange={(e) => setCredits(Number(e.target.value))}
        className="w-full h-2 bg-black20 rounded-lg appearance-none cursor-pointer"
      />
      <p className="text-4xl font-black mt-4 mb-8">{credits} CRÉDITOS</p>
      <div className="grid md:grid-cols-3 gap-6">
        {models.map(m => (
          <div key={m.name} className="bg-black10 p-4 rounded-xl">
            <p className="text-black50 text-xs font-bold uppercase">{m.name}</p>
            <p className="text-2xl font-black">{Math.floor(credits / m.cost)} vídeos</p>
            <p className="text-xs opacity-60">de 5 segundos</p>
          </div>
        ))}
      </div>
    </div>
  );
}
