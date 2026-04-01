import React, { useState, useEffect, MouseEvent, useRef } from 'react';

type Difficulty = 'beginner' | 'intermediate' | 'expert';

interface GameConfig {
  rows: number;
  cols: number;
  mines: number;
}

const CONFIGS: Record<Difficulty, GameConfig> = {
  beginner: { rows: 9, cols: 9, mines: 10 },
  intermediate: { rows: 16, cols: 16, mines: 40 },
  expert: { rows: 16, cols: 30, mines: 99 },
};

type CellStatus = 'hidden' | 'revealed' | 'flagged';

interface CellData {
  r: number;
  c: number;
  isMine: boolean;
  status: CellStatus;
  neighborMines: number;
}

type GameState = 'playing' | 'won' | 'lost';
type WindowState = 'open' | 'minimized' | 'closed' | 'maximized';

interface ScoreRecord {
  id: number;
  playerName: string;
  timeTaken: number;
  clicks: number;
  difficulty: Difficulty;
}

const WinLogo = () => (
  <div className="w-[12px] h-[12px] flex flex-wrap gap-[1px] skew-x-[-5deg] skew-y-[5deg]">
    <div className="w-[5px] h-[5px] bg-[#f03020]"></div>
    <div className="w-[5px] h-[5px] bg-[#108020]"></div>
    <div className="w-[5px] h-[5px] bg-[#0030b0]"></div>
    <div className="w-[5px] h-[5px] bg-[#f0c020]"></div>
  </div>
);

const Index = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [config, setConfig] = useState<GameConfig>(CONFIGS.beginner);
  const [board, setBoard] = useState<CellData[][]>([]);
  const [gameState, setGameState] = useState<GameState>('playing');
  const [minesLeft, setMinesLeft] = useState(CONFIGS.beginner.mines);
  const [time, setTime] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [windowState, setWindowState] = useState<WindowState>('open');
  const [clock, setClock] = useState('');
  
  // Menus e Modais
  const [activeMenu, setActiveMenu] = useState<'none' | 'game' | 'help'>('none');
  const [showAbout, setShowAbout] = useState(false);
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [showWinDialog, setShowWinDialog] = useState(false);
  const [showScoresDialog, setShowScoresDialog] = useState(false);
  
  // Simulação do Banco de Dados SQLite (Scores)
  const [scores, setScores] = useState<ScoreRecord[]>([
    { id: 1, playerName: 'Bill Gates', timeTaken: 42, clicks: 55, difficulty: 'beginner' },
    { id: 2, playerName: 'DHH (Rails)', timeTaken: 99, clicks: 120, difficulty: 'intermediate' }
  ]);
  const [playerNameInput, setPlayerNameInput] = useState('Anonymous');

  const menuRef = useRef<HTMLDivElement>(null);
  const startMenuRef = useRef<HTMLDivElement>(null);

  // Relógio da barra de tarefas
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      let hours = now.getHours();
      let minutes: string | number = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      minutes = minutes < 10 ? '0' + minutes : minutes;
      setClock(`${hours}:${minutes} ${ampm}`);
    };
    updateClock();
    const timer = setInterval(updateClock, 10000);
    return () => clearInterval(timer);
  }, []);

  // Fechar menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu('none');
      }
      if (startMenuRef.current && !startMenuRef.current.contains(event.target as Node)) {
        setShowStartMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initBoard = (newConfig: GameConfig = config) => {
    const newBoard: CellData[][] = [];
    for (let r = 0; r < newConfig.rows; r++) {
      const row: CellData[] = [];
      for (let c = 0; c < newConfig.cols; c++) {
        row.push({ r, c, isMine: false, status: 'hidden', neighborMines: 0 });
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setGameState('playing');
    setMinesLeft(newConfig.mines);
    setTime(0);
    setClicks(0);
    setIsFirstClick(true);
    setActiveMenu('none');
    
    // Se estava fechado ou minimizado, abre normal. Se estava maximizado, mantém maximizado.
    if (windowState === 'closed' || windowState === 'minimized') {
      setWindowState('open');
    }
    
    setShowWinDialog(false);
  };

  useEffect(() => {
    initBoard();
  }, [config]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && !isFirstClick) {
      timer = setInterval(() => {
        setTime((prev) => Math.min(prev + 1, 999));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, isFirstClick]);

  const placeMines = (firstR: number, firstC: number, currentBoard: CellData[][]) => {
    let minesPlaced = 0;
    while (minesPlaced < config.mines) {
      const r = Math.floor(Math.random() * config.rows);
      const c = Math.floor(Math.random() * config.cols);
      
      if (!currentBoard[r][c].isMine && !(r === firstR && c === firstC)) {
        currentBoard[r][c].isMine = true;
        minesPlaced++;
      }
    }

    for (let r = 0; r < config.rows; r++) {
      for (let c = 0; c < config.cols; c++) {
        if (!currentBoard[r][c].isMine) {
          let count = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const nr = r + i;
              const nc = c + j;
              if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && currentBoard[nr][nc].isMine) {
                count++;
              }
            }
          }
          currentBoard[r][c].neighborMines = count;
        }
      }
    }
    return currentBoard;
  };

  const handleCellClick = (r: number, c: number) => {
    if (gameState !== 'playing' || board[r][c].status === 'flagged') return;

    setClicks(prev => prev + 1);

    let newBoard = [...board.map(row => [...row])];

    if (isFirstClick) {
      newBoard = placeMines(r, c, newBoard);
      setIsFirstClick(false);
    }

    if (newBoard[r][c].isMine) {
      newBoard.forEach(row => row.forEach(cell => {
        if (cell.isMine) cell.status = 'revealed';
      }));
      setBoard(newBoard);
      setGameState('lost');
      return;
    }

    const queue = [[r, c]];
    while (queue.length > 0) {
      const [currR, currC] = queue.shift()!;
      const cell = newBoard[currR][currC];

      if (cell.status !== 'hidden') continue;
      
      cell.status = 'revealed';

      if (cell.neighborMines === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const nr = currR + i;
            const nc = currC + j;
            if (nr >= 0 && nr < config.rows && nc >= 0 && nc < config.cols && newBoard[nr][nc].status === 'hidden') {
              queue.push([nr, nc]);
            }
          }
        }
      }
    }

    setBoard(newBoard);
    checkWin(newBoard);
  };

  const handleRightClick = (e: MouseEvent | React.TouchEvent, r: number, c: number) => {
    e.preventDefault();
    if (gameState !== 'playing') return;
    if (board[r][c].status === 'revealed') return;

    setClicks(prev => prev + 1);

    const newBoard = [...board.map(row => [...row])];
    const cell = newBoard[r][c];

    if (cell.status === 'hidden' && minesLeft > 0) {
      cell.status = 'flagged';
      setMinesLeft(prev => prev - 1);
    } else if (cell.status === 'flagged') {
      cell.status = 'hidden';
      setMinesLeft(prev => prev + 1);
    }

    setBoard(newBoard);
  };

  const checkWin = (currentBoard: CellData[][]) => {
    let hiddenSafeCells = 0;
    currentBoard.forEach(row => row.forEach(cell => {
      if (!cell.isMine && cell.status !== 'revealed') {
        hiddenSafeCells++;
      }
    }));

    if (hiddenSafeCells === 0) {
      setGameState('won');
      setMinesLeft(0);
      currentBoard.forEach(row => row.forEach(cell => {
        if (cell.isMine) cell.status = 'flagged';
      }));
      setBoard(currentBoard);
      
      setTimeout(() => setShowWinDialog(true), 500);
    }
  };

  const saveScore = (e: React.FormEvent) => {
    e.preventDefault();
    const newScore: ScoreRecord = {
      id: Date.now(),
      playerName: playerNameInput.trim() || 'Anonymous',
      timeTaken: time,
      clicks: clicks,
      difficulty: difficulty
    };
    
    setScores(prev => [...prev, newScore].sort((a, b) => a.timeTaken - b.timeTaken));
    setShowWinDialog(false);
    setShowScoresDialog(true);
  };

  const getNumberColor = (num: number) => {
    const colors = ['', '#0000ff', '#008000', '#ff0000', '#000080', '#800000', '#008080', '#000000', '#808080'];
    return colors[num] || '';
  };

  const formatNumber = (num: number) => {
    if (num < 0) return `-${Math.abs(num).toString().padStart(2, '0')}`;
    return num.toString().padStart(3, '0');
  };

  const changeDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    setConfig(CONFIGS[diff]);
    setActiveMenu('none');
  };

  const toggleMaximize = () => {
    if (windowState === 'maximized') {
      setWindowState('open');
    } else {
      setWindowState('maximized');
    }
  };

  return (
    <div className="min-h-screen bg-[#008080] text-black font-sans flex flex-col overflow-hidden">
      
      {/* Área de Trabalho (Desktop) */}
      <div className="flex-1 relative p-2 sm:p-10 pb-12 w-full h-full overflow-hidden flex flex-col">
        
        {/* Ícone na Área de Trabalho */}
        {windowState === 'closed' && (
          <div 
            className="w-16 flex flex-col items-center cursor-pointer mb-4"
            onDoubleClick={() => setWindowState('open')}
            onClick={() => setWindowState('open')}
          >
            <div className="text-3xl mb-1">💣</div>
            <div className="text-white text-xs bg-[#0000a8] px-1 line-clamp-2 text-center select-none">Minesweeper</div>
          </div>
        )}

        {/* Janela do Jogo */}
        <div 
          className={`
            flex justify-center items-start sm:items-center 
            ${windowState === 'minimized' || windowState === 'closed' ? 'hidden' : ''}
            ${windowState === 'maximized' ? 'absolute inset-0 z-20 pb-[28px]' : 'w-full h-full'}
          `}
        >
          
          <div 
            className={`
              bg-[#c0c0c0] win95-outset flex flex-col select-none shadow-xl
              ${windowState === 'maximized' ? 'w-full h-full' : 'max-w-full max-h-full'}
            `} 
            style={{ touchAction: 'manipulation' }}
          >
            
            {/* Barra de Título */}
            <div 
              className="bg-[#0000a8] text-white px-1 py-[2px] flex justify-between items-center text-[13px] font-bold h-[20px] shrink-0 cursor-default"
              onDoubleClick={toggleMaximize}
            >
              <div className="flex items-center gap-1 ml-1">
                <span className="text-[10px] mt-[1px]">💣</span>
                <span className="tracking-wide">Minesweeper</span>
              </div>
              <div className="flex gap-[2px] mr-[1px]">
                {/* Botão Minimizar */}
                <button 
                  onClick={() => setWindowState('minimized')}
                  className="win95-outset bg-[#c0c0c0] text-black w-[16px] h-[14px] flex items-start justify-center text-[10px] font-bold active:win95-inset focus:outline-none"
                  title="Minimize"
                >
                  <span className="leading-none mt-[-2px] tracking-tighter">_</span>
                </button>
                
                {/* Botão Maximizar / Restaurar */}
                <button 
                  onClick={toggleMaximize}
                  className="win95-outset bg-[#c0c0c0] text-black w-[16px] h-[14px] flex items-center justify-center text-[10px] active:win95-inset focus:outline-none relative"
                  title={windowState === 'maximized' ? "Restore" : "Maximize"}
                >
                  {windowState === 'maximized' ? (
                    <div className="relative w-[10px] h-[10px]">
                      <div className="absolute top-[1px] right-[0px] w-[6px] h-[5px] border border-black border-t-[2px]"></div>
                      <div className="absolute bottom-[0px] left-[1px] w-[6px] h-[5px] border border-black border-t-[2px] bg-[#c0c0c0]"></div>
                    </div>
                  ) : (
                    <div className="w-[8px] h-[7px] border border-black border-t-[2px] mt-[1px]"></div>
                  )}
                </button>

                {/* Botão Fechar */}
                <button 
                  onClick={() => setWindowState('closed')}
                  className="win95-outset bg-[#c0c0c0] text-black w-[16px] h-[14px] flex items-center justify-center text-[10px] font-bold active:win95-inset focus:outline-none"
                  title="Close"
                >
                  <span className="leading-none mt-[1px] ml-[1px] text-[9px]">X</span>
                </button>
              </div>
            </div>

            {/* Menu Bar */}
            <div className="flex text-xs px-2 py-[2px] gap-3 bg-[#c0c0c0] relative z-10 shrink-0" ref={menuRef}>
              
              <div className="relative">
                <span 
                  className={`cursor-pointer px-1 ${activeMenu === 'game' ? 'bg-[#0000a8] text-white' : 'hover:bg-[#0000a8] hover:text-white'}`}
                  onClick={() => setActiveMenu(activeMenu === 'game' ? 'none' : 'game')}
                >
                  <span className="underline decoration-current underline-offset-[-2px]">G</span>ame
                </span>
                
                {activeMenu === 'game' && (
                  <div className="absolute top-[18px] left-0 win95-outset bg-[#c0c0c0] text-black min-w-[140px] shadow-lg py-1">
                    <div className="px-3 py-1 hover:bg-[#0000a8] hover:text-white cursor-pointer flex justify-between" onClick={() => initBoard()}>
                      <span>New</span><span>F2</span>
                    </div>
                    <div className="h-[1px] bg-[#808080] border-b border-white mx-1 my-1"></div>
                    <div className="px-3 py-1 hover:bg-[#0000a8] hover:text-white cursor-pointer flex items-center gap-2" onClick={() => changeDifficulty('beginner')}>
                      <span className="w-3">{difficulty === 'beginner' && '✓'}</span> Beginner
                    </div>
                    <div className="px-3 py-1 hover:bg-[#0000a8] hover:text-white cursor-pointer flex items-center gap-2" onClick={() => changeDifficulty('intermediate')}>
                      <span className="w-3">{difficulty === 'intermediate' && '✓'}</span> Intermediate
                    </div>
                    <div className="px-3 py-1 hover:bg-[#0000a8] hover:text-white cursor-pointer flex items-center gap-2" onClick={() => changeDifficulty('expert')}>
                      <span className="w-3">{difficulty === 'expert' && '✓'}</span> Expert
                    </div>
                    <div className="h-[1px] bg-[#808080] border-b border-white mx-1 my-1"></div>
                    <div className="px-3 py-1 hover:bg-[#0000a8] hover:text-white cursor-pointer" onClick={() => { setShowScoresDialog(true); setActiveMenu('none'); }}>
                      Best Times...
                    </div>
                    <div className="h-[1px] bg-[#808080] border-b border-white mx-1 my-1"></div>
                    <div className="px-3 py-1 hover:bg-[#0000a8] hover:text-white cursor-pointer ml-5" onClick={() => setWindowState('closed')}>
                      Exit
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <span 
                  className={`cursor-pointer px-1 ${activeMenu === 'help' ? 'bg-[#0000a8] text-white' : 'hover:bg-[#0000a8] hover:text-white'}`}
                  onClick={() => setActiveMenu(activeMenu === 'help' ? 'none' : 'help')}
                >
                  <span className="underline decoration-current underline-offset-[-2px]">H</span>elp
                </span>
                
                {activeMenu === 'help' && (
                  <div className="absolute top-[18px] left-0 win95-outset bg-[#c0c0c0] text-black min-w-[140px] shadow-lg py-1">
                    <div 
                      className="px-3 py-1 hover:bg-[#0000a8] hover:text-white cursor-pointer" 
                      onClick={() => { setShowAbout(true); setActiveMenu('none'); }}
                    >
                      About Minesweeper...
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Corpo do Jogo */}
            <div className="p-[6px] pb-1 border-[3px] border-t-[#808080] border-l-[#808080] border-r-white border-b-white bg-[#c0c0c0] flex-1 flex flex-col overflow-hidden">
              
              {/* Painel do Topo */}
              <div className="win95-inset bg-[#c0c0c0] p-1 mb-[6px] flex justify-between items-center h-[42px] shrink-0">
                <div className="bg-black text-[#ff0000] font-digital text-[34px] tracking-[0.05em] px-1 win95-inset w-[60px] h-[30px] flex items-center justify-center leading-none overflow-hidden select-none" title="Mines Left">
                  <span className="mt-1">{formatNumber(minesLeft)}</span>
                </div>
                
                <button 
                  onClick={() => initBoard()}
                  className="win95-outset bg-[#c0c0c0] w-[26px] h-[26px] flex items-center justify-center text-sm active:win95-inset focus:outline-none"
                >
                  <span className="mt-[2px] ml-[1px]">{gameState === 'lost' ? '😵' : gameState === 'won' ? '😎' : '🙂'}</span>
                </button>

                <div className="bg-black text-[#ff0000] font-digital text-[34px] tracking-[0.05em] px-1 win95-inset w-[60px] h-[30px] flex items-center justify-center leading-none overflow-hidden select-none" title="Time">
                  <span className="mt-1">{formatNumber(time)}</span>
                </div>
              </div>

              {/* Grid do Jogo - O Scroll se adapta 100% se maximizado ou não */}
              <div className="win95-inset bg-[#c0c0c0] overflow-auto flex-1 relative flex items-start justify-start sm:justify-center p-1">
                <table className="border-collapse bg-[#c0c0c0]" style={{ borderSpacing: 0, WebkitTouchCallout: 'none' }}>
                  <tbody onContextMenu={(e) => e.preventDefault()}>
                    {board.map((row, rIdx) => (
                      <tr key={rIdx} className="leading-[0]">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="p-0">
                            {cell.status === 'hidden' ? (
                              <button 
                                className="w-[24px] h-[24px] min-w-[24px] min-h-[24px] win95-cell-hidden block"
                                onClick={() => handleCellClick(cell.r, cell.c)}
                                onContextMenu={(e) => handleRightClick(e, cell.r, cell.c)}
                              />
                            ) : cell.status === 'flagged' ? (
                              <button 
                                className="w-[24px] h-[24px] min-w-[24px] min-h-[24px] win95-cell-hidden flex items-center justify-center text-[12px]"
                                onContextMenu={(e) => handleRightClick(e, cell.r, cell.c)}
                              >
                                🚩
                              </button>
                            ) : (
                              <div className={`w-[24px] h-[24px] min-w-[24px] min-h-[24px] win95-cell-revealed bg-[#c0c0c0] flex items-center justify-center font-bold text-[16px] pb-[1px] ${cell.isMine ? 'bg-[#ff0000]' : ''}`}>
                                {cell.isMine ? '💣' : cell.neighborMines > 0 ? (
                                  <span style={{ color: getNumberColor(cell.neighborMines) }}>
                                    {cell.neighborMines}
                                  </span>
                                ) : ''}
                              </div>
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Barra de Status Inferior da Janela */}
            <div className="flex gap-[2px] px-[3px] pb-[3px] bg-[#c0c0c0] shrink-0">
              <div className="win95-inset h-[20px] flex-1 px-2 flex items-center text-[11px] text-[#000]">
                Clicks: {clicks}
              </div>
              <div className="win95-inset h-[20px] px-2 flex items-center text-[11px] text-[#000] capitalize min-w-[80px]">
                {difficulty}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Barra de Tarefas Win95 */}
      <div className="fixed bottom-0 left-0 right-0 h-[28px] bg-[#c0c0c0] border-t-2 border-t-[#ffffff] flex items-center px-1 z-40" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8)' }}>
        
        {/* Menu Iniciar */}
        <div className="relative" ref={startMenuRef}>
          <button 
            onClick={() => setShowStartMenu(!showStartMenu)}
            className={`flex items-center gap-[6px] px-1 pb-[2px] h-[22px] font-bold text-[12px] active:win95-inset focus:outline-none ${showStartMenu ? 'win95-inset bg-[#dfdfdf]' : 'win95-outset bg-[#c0c0c0]'}`}
          >
            <WinLogo />
            <span>Start</span>
          </button>

          {/* Janela do Menu Iniciar aberta */}
          {showStartMenu && (
            <div className="absolute bottom-[28px] left-0 win95-outset bg-[#c0c0c0] flex w-[180px] h-[200px] z-50 shadow-lg">
              <div className="bg-[#0000a8] text-white w-[30px] flex items-end pb-2 justify-center" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                <span className="font-bold text-sm tracking-widest text-gray-300">Windows</span>
                <span className="font-bold text-sm">95</span>
              </div>
              <div className="flex-1 py-1">
                <div 
                  className="px-3 py-2 hover:bg-[#0000a8] hover:text-white cursor-pointer flex items-center gap-2"
                  onClick={() => { initBoard(); setShowStartMenu(false); }}
                >
                  <span className="text-xl">💣</span> <span className="text-xs">Minesweeper</span>
                </div>
                <div className="h-[1px] bg-[#808080] border-b border-white mx-1 my-1"></div>
                <div 
                  className="px-3 py-2 hover:bg-[#0000a8] hover:text-white cursor-pointer flex items-center gap-2"
                  onClick={() => { setShowScoresDialog(true); setShowStartMenu(false); }}
                >
                  <span className="text-xl">🏆</span> <span className="text-xs">High Scores</span>
                </div>
                <div 
                  className="px-3 py-2 hover:bg-[#0000a8] hover:text-white cursor-pointer flex items-center gap-2"
                  onClick={() => { setShowAbout(true); setShowStartMenu(false); }}
                >
                  <span className="text-xl">📄</span> <span className="text-xs">About Rails Project</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Separador */}
        <div className="w-[1px] h-[20px] bg-[#808080] border-r border-[#ffffff] mx-1"></div>

        {/* Botões dos programas abertos */}
        <div className="flex-1 flex gap-1 px-1">
          {windowState !== 'closed' && (
            <button 
              onClick={() => {
                if (windowState === 'minimized') {
                  setWindowState('open');
                } else if (windowState === 'open' || windowState === 'maximized') {
                  setWindowState('minimized');
                }
              }}
              className={`flex items-center gap-1 px-2 h-[22px] min-w-[120px] max-w-[160px] text-xs font-bold ${windowState !== 'minimized' ? 'win95-inset bg-[#dfdfdf] pattern-dots' : 'win95-outset bg-[#c0c0c0] active:win95-inset'}`}
            >
              <span className="text-sm mt-[2px]">💣</span>
              <span className="truncate pt-[1px]">Minesweeper</span>
            </button>
          )}
        </div>

        {/* Bandeja do Sistema / Relógio */}
        <div className="win95-inset h-[22px] px-2 flex items-center bg-[#c0c0c0] text-xs pb-[1px] gap-2 ml-auto shrink-0 select-none">
          <span className="text-[14px]">🔊</span>
          <span>{clock}</span>
        </div>
      </div>

      {/* MODAIS (Janelas Auxiliares) */}

      {/* Modal Vitória (Formulário para o Banco de Dados) */}
      {showWinDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4">
          <div className="absolute inset-0 bg-transparent" onClick={() => setShowWinDialog(false)}></div>
          <form onSubmit={saveScore} className="bg-[#c0c0c0] win95-outset w-full max-w-[320px] z-10 shadow-xl">
            <div className="bg-[#0000a8] text-white px-1 py-[2px] flex justify-between items-center text-[13px] font-bold">
              <span>You Win!</span>
              <button type="button" onClick={() => setShowWinDialog(false)} className="win95-outset bg-[#c0c0c0] text-black w-[16px] h-[14px] flex items-center justify-center text-[10px] pb-[1px] font-bold">X</button>
            </div>
            <div className="p-4 flex flex-col gap-4 text-sm">
              <p>
                You have the fastest time for <strong>{difficulty}</strong> level.<br/><br/>
                Please enter your name.
              </p>
              <input 
                type="text" 
                value={playerNameInput}
                onChange={(e) => setPlayerNameInput(e.target.value)}
                maxLength={30}
                autoFocus
                className="win95-inset bg-white text-black px-2 py-1 outline-none w-full"
              />
              <div className="flex justify-center mt-2">
                <button type="submit" className="win95-outset bg-[#c0c0c0] px-8 py-1 focus:outline-none focus:win95-inset active:win95-inset">
                  OK
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Modal Recordes (Simulando leitura do SQLite) */}
      {showScoresDialog && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-2 sm:px-4">
          <div className="absolute inset-0 bg-transparent" onClick={() => setShowScoresDialog(false)}></div>
          <div className="bg-[#c0c0c0] win95-outset w-full max-w-[400px] z-10 shadow-xl flex flex-col">
            <div className="bg-[#0000a8] text-white px-1 py-[2px] flex justify-between items-center text-[13px] font-bold">
              <span>Fastest Mine Sweepers</span>
              <button onClick={() => setShowScoresDialog(false)} className="win95-outset bg-[#c0c0c0] text-black w-[16px] h-[14px] flex items-center justify-center text-[10px] pb-[1px] font-bold">X</button>
            </div>
            
            <div className="p-2 sm:p-4 text-sm flex flex-col gap-4">
              <div className="win95-inset bg-white p-2 h-[150px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#c0c0c0] win95-outset sticky top-[-8px]">
                    <tr>
                      <th className="font-normal px-1 py-[2px]">Level</th>
                      <th className="font-normal px-1 py-[2px]">Name</th>
                      <th className="font-normal px-1 py-[2px]">Time</th>
                      <th className="font-normal px-1 py-[2px]">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map((score) => (
                      <tr key={score.id} className="border-b border-[#dfdfdf] last:border-0 hover:bg-[#0000a8] hover:text-white cursor-default">
                        <td className="px-1 py-1 capitalize">{score.difficulty}</td>
                        <td className="px-1 py-1 truncate max-w-[90px] sm:max-w-[120px]">{score.playerName}</td>
                        <td className="px-1 py-1">{score.timeTaken} s</td>
                        <td className="px-1 py-1">{score.clicks}</td>
                      </tr>
                    ))}
                    {scores.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-4 text-gray-500 italic">No records yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setScores([])}
                  className="win95-outset bg-[#c0c0c0] px-2 sm:px-4 py-1 text-xs focus:outline-none active:win95-inset"
                >
                  Reset Scores
                </button>
                <button 
                  onClick={() => setShowScoresDialog(false)}
                  className="win95-outset bg-[#c0c0c0] px-4 sm:px-6 py-1 focus:outline-none focus:win95-inset active:win95-inset font-bold"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Sobre */}
      {showAbout && (
        <div className="fixed inset-0 flex items-center justify-center z-50 px-4 mb-8">
          <div className="absolute inset-0 bg-transparent" onClick={() => setShowAbout(false)}></div>
          <div className="bg-[#c0c0c0] win95-outset w-full max-w-[300px] z-10 shadow-xl">
            <div className="bg-[#0000a8] text-white px-1 py-[2px] flex justify-between items-center text-[13px] font-bold">
              <span>About Minesweeper</span>
              <button onClick={() => setShowAbout(false)} className="win95-outset bg-[#c0c0c0] text-black w-[16px] h-[14px] flex items-center justify-center text-[10px] pb-[1px] font-bold">X</button>
            </div>
            <div className="p-4 flex flex-col items-center">
              <div className="text-4xl mb-4">💣</div>
              <p className="font-bold text-sm mb-2">Minesweeper</p>
              <p className="text-xs text-center mb-6">Boxture Tech Challenge Edition<br/>100% Ruby on Rails (Backend)</p>
              <button 
                onClick={() => setShowAbout(false)}
                className="win95-outset bg-[#c0c0c0] px-6 py-1 text-sm focus:outline-none focus:win95-inset active:win95-inset"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Index;