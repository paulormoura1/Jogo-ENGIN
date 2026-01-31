
import React, { useState, useMemo, useEffect } from 'react';
import { GamePhase, ResearchArea, GameState, Challenge, ActionRecord } from './types';
import { AREA_ICONS, RESEARCH_DESCRIPTIONS } from './constants';
import { getGeminiFeedback, generateChallenge } from './geminiService';

interface ExtendedActionRecord extends ActionRecord {
  references?: string[];
  sourceType?: string;
  timestamp: string;
}

interface RankingEntry {
  playerName: string;
  area: ResearchArea;
  points: number;
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState & { report: ExtendedActionRecord[] }>(() => {
    const savedReport = localStorage.getItem('engin_nexus_reports_v2');
    const initialReport = savedReport ? JSON.parse(savedReport) : [];
    
    return {
      phase: GamePhase.INTRO,
      stability: 60,
      innovation: 10,
      energy: {
        [ResearchArea.GOVERNANCE_KNOWLEDGE]: 100,
        [ResearchArea.KNOWLEDGE_MGMT]: 100,
        [ResearchArea.INTEGRATION_ENG]: 100,
        [ResearchArea.UCR]: 100,
      },
      activePlayers: [], 
      history: ["Nexus Online.", "Memória Coletiva Sincronizada."],
      report: initialReport
    };
  });

  const [ranking, setRanking] = useState<RankingEntry[]>(() => {
    const savedRanking = localStorage.getItem('engin_nexus_ranking_v2');
    return savedRanking ? JSON.parse(savedRanking) : [];
  });

  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [playerInput, setPlayerInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ verdict: string, explanation: string, references?: string[], sourceType?: string } | null>(null);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [showDatabase, setShowDatabase] = useState(false);
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    localStorage.setItem('engin_nexus_reports_v2', JSON.stringify(gameState.report));
  }, [gameState.report]);

  useEffect(() => {
    localStorage.setItem('engin_nexus_ranking_v2', JSON.stringify(ranking));
  }, [ranking]);

  const canSubmit = playerInput.trim().split(/\s+/).filter(w => w.length > 0).length >= 3;

  const addPlayer = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName || gameState.activePlayers.includes(cleanName)) return;
    setGameState(prev => ({ ...prev, activePlayers: [...prev.activePlayers, cleanName] }));
    setNewPlayerName('');
  };

  const startGame = () => {
    if (gameState.activePlayers.length < 1) {
      alert("Identifique o Especialista.");
      return;
    }
    setGameState(prev => ({ ...prev, phase: GamePhase.CORE_GAME }));
  };

  const handleAreaSelect = async (area: ResearchArea) => {
    setLoading(true);
    setFeedback(null);
    setPlayerInput('');
    const challengeData = await generateChallenge(area);
    setCurrentChallenge({
      id: Math.random().toString(36),
      title: challengeData.title,
      description: challengeData.description,
      requiredArea: area
    });
    setLoading(false);
  };

  const submitAction = async () => {
    if (!currentChallenge || !canSubmit) return;
    setLoading(true);
    const feedbackData = await getGeminiFeedback(currentChallenge.description, gameState, playerInput, gameState.activePlayers);
    const isCorrect = feedbackData.verdict === 'CORRETA';

    const record: ExtendedActionRecord = {
      area: currentChallenge.requiredArea,
      title: currentChallenge.title,
      proposal: playerInput,
      verdict: feedbackData.verdict,
      explanation: feedbackData.explanation,
      executors: [...gameState.activePlayers],
      references: feedbackData.references,
      sourceType: feedbackData.sourceType,
      timestamp: new Date().toLocaleString('pt-BR')
    };

    if (isCorrect) {
      setRanking(prev => {
        const newRanking = [...prev];
        gameState.activePlayers.forEach(player => {
          const idx = newRanking.findIndex(r => r.playerName === player && r.area === currentChallenge.requiredArea);
          if (idx > -1) newRanking[idx].points += 1;
          else newRanking.push({ playerName: player, area: currentChallenge.requiredArea, points: 1 });
        });
        return newRanking;
      });
    }

    setFeedback(feedbackData);
    setGameState(prev => ({
      ...prev,
      stability: Math.min(100, Math.max(0, prev.stability + (feedbackData.stabilityDelta || 0))),
      innovation: Math.min(100, Math.max(0, prev.innovation + (feedbackData.innovationDelta || 0))),
      report: [record, ...prev.report],
      energy: { ...prev.energy, [currentChallenge.requiredArea]: Math.max(0, prev.energy[currentChallenge.requiredArea] - 25) },
      history: [`[${feedbackData.verdict}] Registro em ${currentChallenge.requiredArea}.`, ...prev.history]
    }));
    setLoading(false);
  };

  return (
    <div className="min-h-screen terminal-bg text-blue-50 p-3 md:p-8 font-inter overflow-x-hidden">
      <header className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 border-b border-blue-900/50 pb-4">
        <div className="flex items-center gap-3 cursor-pointer w-full sm:w-auto justify-center sm:justify-start" onClick={() => { setShowDatabase(false); setShowRanking(false); }}>
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center glow shrink-0">
            <span className="font-orbitron font-bold text-white text-lg">N</span>
          </div>
          <div className="text-center sm:text-left">
            <h1 className="font-orbitron text-lg md:text-xl font-bold tracking-widest text-blue-400">NEXUS ENGIN</h1>
            <p className="text-[8px] md:text-[9px] text-blue-300/50 font-mono uppercase">Memória Coletiva UFSC</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 justify-between w-full sm:w-auto">
          <div className="flex gap-2">
            <button 
              onClick={() => { setShowDatabase(!showDatabase); setShowRanking(false); }}
              className={`px-3 py-1.5 rounded-full border text-[9px] font-orbitron transition-all ${showDatabase ? 'bg-blue-600 text-white' : 'border-blue-900 text-blue-400'}`}
            >
              REP ({gameState.report.length})
            </button>
            <button 
              onClick={() => { setShowRanking(!showRanking); setShowDatabase(false); }}
              className={`p-1.5 rounded-lg border transition-all ${showRanking ? 'bg-yellow-600 border-yellow-400 text-white' : 'bg-slate-900 border-blue-900 text-yellow-500'}`}
              title="Classificação"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </button>
          </div>

          <div className="flex gap-3 md:gap-6 border-l border-blue-900/50 pl-4 shrink-0">
            <StatBar label="ESTAB" value={gameState.stability} color={gameState.stability < 30 ? 'bg-red-500' : 'bg-green-500'} />
            <StatBar label="INOVA" value={gameState.innovation} color="bg-blue-400" />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto">
        {showRanking ? (
          <div className="animate-in fade-in duration-500 space-y-4">
            <h2 className="font-orbitron text-lg text-yellow-500 border-b border-yellow-900/30 pb-2">RANKING</h2>
            <div className="bg-slate-900/80 rounded-xl border border-yellow-900/20 overflow-x-auto">
              <table className="w-full text-left text-[10px] md:text-xs font-mono min-w-[300px]">
                <thead className="bg-yellow-950/20 text-yellow-500 uppercase font-orbitron">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Especialista</th>
                    <th className="p-3">Tema</th>
                    <th className="p-3 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-yellow-900/10">
                  {ranking.sort((a,b) => b.points - a.points).map((r, i) => (
                    <tr key={i} className="hover:bg-yellow-500/5">
                      <td className="p-3 text-yellow-600 font-bold">{i+1}</td>
                      <td className="p-3 text-white font-bold truncate max-w-[80px] md:max-w-none">{r.playerName}</td>
                      <td className="p-3 text-blue-300 truncate max-w-[100px] md:max-w-none">{r.area}</td>
                      <td className="p-3 text-right text-yellow-400 font-bold">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : showDatabase ? (
          <div className="animate-in fade-in duration-500 space-y-4">
            <h2 className="font-orbitron text-lg text-blue-400 border-b border-blue-900/30 pb-2 uppercase tracking-tighter">Memória Coletiva</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gameState.report.map((rec, i) => (
                <div key={i} className={`p-4 rounded-xl border bg-slate-900/60 space-y-2 ${rec.verdict === 'CORRETA' ? 'border-green-500/20' : 'border-red-500/20'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[7px] text-blue-400 uppercase font-bold truncate max-w-[70%]">{rec.area}</span>
                    <span className={`text-[7px] px-1.5 py-0.5 rounded font-bold shrink-0 ${rec.verdict === 'CORRETA' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{rec.verdict}</span>
                  </div>
                  <h3 className="text-[10px] font-bold text-white leading-tight uppercase line-clamp-2">{rec.title}</h3>
                  <p className="text-[9px] text-blue-100/50 italic line-clamp-3">"{rec.proposal}"</p>
                  <div className="bg-black/20 p-2.5 rounded text-[9px] text-blue-200 leading-normal">{rec.explanation}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-900/30 shadow-lg">
                <h3 className="text-[10px] font-orbitron text-blue-400 mb-2 uppercase tracking-widest">Acesso</h3>
                {gameState.phase === GamePhase.INTRO ? (
                  <div className="flex gap-2">
                    <input 
                      value={newPlayerName} 
                      onChange={e => setNewPlayerName(e.target.value)} 
                      placeholder="Identificação..." 
                      className="bg-black/40 border border-blue-900/50 rounded p-2 text-[10px] w-full focus:border-blue-400 outline-none" 
                    />
                    <button onClick={() => addPlayer(newPlayerName)} className="bg-blue-600 hover:bg-blue-500 px-4 py-1 rounded text-[10px] font-bold">ADD</button>
                  </div>
                ) : null}
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {gameState.activePlayers.map(p => <span key={p} className="bg-blue-900/30 border border-blue-500/20 px-2 py-1 rounded text-[9px] text-blue-300">{p}</span>)}
                </div>
              </div>
              
              <div className="bg-slate-900/80 p-4 rounded-xl border border-blue-900/30 h-40 lg:h-64 overflow-hidden flex flex-col hidden sm:flex">
                <h3 className="text-[10px] font-orbitron text-blue-500 mb-2 uppercase">Log do Sistema</h3>
                <div className="flex-1 overflow-y-auto font-mono text-[8px] text-blue-400/40 space-y-1.5 scrollbar-hide">
                  {gameState.history.map((h, i) => <div key={i} className="border-l border-blue-900/30 pl-1.5">{`> ${h}`}</div>)}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              {gameState.phase === GamePhase.INTRO && (
                <div className="bg-blue-900/5 p-8 md:p-14 border border-blue-500/10 rounded-3xl text-center space-y-6 animate-in fade-in zoom-in duration-700">
                  <h2 className="text-3xl md:text-5xl font-orbitron font-bold text-blue-400 tracking-tighter">NEXUS DE CRISE</h2>
                  <p className="text-[10px] md:text-xs text-blue-100/60 max-w-sm mx-auto leading-relaxed">
                    Facilitador de crescimento estratégico. Todas as propostas negativas tornam-se ativos de rede. Nada é apagado.
                  </p>
                  <button onClick={startGame} className="w-full sm:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-orbitron text-[10px] tracking-widest shadow-lg transform transition active:scale-95">INICIAR OPERAÇÃO</button>
                </div>
              )}

              {gameState.phase === GamePhase.CORE_GAME && !currentChallenge && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4">
                  {Object.values(ResearchArea).map(area => (
                    <button 
                      key={area} 
                      onClick={() => handleAreaSelect(area)} 
                      className="p-5 bg-slate-900/60 border border-blue-900/40 rounded-2xl hover:border-blue-400 text-left transition-all active:bg-blue-900/20 group"
                    >
                      <div className="text-blue-500 mb-3 group-hover:scale-110 transition-transform">{AREA_ICONS[area]}</div>
                      <h4 className="font-orbitron text-xs text-white mb-1 uppercase tracking-tight">{area}</h4>
                      <p className="text-[9px] text-blue-300/40 leading-snug line-clamp-2">{RESEARCH_DESCRIPTIONS[area]}</p>
                    </button>
                  ))}
                </div>
              )}

              {currentChallenge && (
                <div className="bg-slate-900 border border-blue-500/20 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
                  <div className="bg-blue-950/80 p-3 border-b border-blue-500/10 text-[8px] font-orbitron text-blue-300 flex justify-between">
                    <span>STATUS: OPERACIONAL</span>
                    <span className="text-blue-500 uppercase">{currentChallenge.requiredArea}</span>
                  </div>
                  <div className="p-5 md:p-8 space-y-6">
                    {feedback ? (
                      <div className="space-y-5 animate-in slide-in-from-bottom-2">
                        <div className={`p-5 rounded-xl border ${feedback.verdict === 'CORRETA' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
                          <h4 className={`font-orbitron text-lg mb-3 ${feedback.verdict === 'CORRETA' ? 'text-green-400' : 'text-red-400'}`}>{feedback.verdict}</h4>
                          <p className="text-[10px] md:text-xs text-blue-50 leading-relaxed mb-4">{feedback.explanation}</p>
                        </div>
                        <button onClick={() => { setCurrentChallenge(null); setFeedback(null); }} className="w-full py-4 bg-blue-600 text-white font-orbitron text-[9px] rounded-xl tracking-widest uppercase">Retornar</button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          <h2 className="text-lg md:text-xl font-orbitron text-white leading-tight">{currentChallenge.title}</h2>
                          <div className="border-l-2 border-blue-600 pl-4 py-1">
                            <p className="text-blue-100/70 text-xs md:text-sm font-light italic leading-relaxed">{currentChallenge.description}</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <textarea 
                            value={playerInput} 
                            onChange={e => setPlayerInput(e.target.value)} 
                            placeholder="Descreva sua manobra estratégica..." 
                            className="w-full h-32 md:h-40 bg-black/40 border border-blue-900/30 rounded-xl p-4 text-[11px] md:text-xs font-mono text-blue-50 focus:border-blue-500 outline-none resize-none placeholder:text-blue-900" 
                          />
                          <button 
                            disabled={!canSubmit || loading} 
                            onClick={submitAction} 
                            className={`w-full py-4 md:py-5 font-orbitron text-[10px] rounded-xl tracking-[0.2em] transition-all uppercase shadow-xl ${canSubmit && !loading ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}
                          >
                            {loading ? 'ANALISANDO...' : 'Transmitir Proposta'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatBar = ({ label, value, color }: { label: string, value: number, color: string }) => (
  <div className="text-center group shrink-0">
    <p className="text-[7px] uppercase text-blue-400 mb-1 font-orbitron tracking-tighter opacity-70">{label}</p>
    <div className="w-16 md:w-24 h-1 bg-slate-800 rounded-full overflow-hidden border border-blue-900/20">
      <div className={`h-full transition-all duration-1000 ${color}`} style={{ width: `${value}%` }} />
    </div>
  </div>
);

export default App;
