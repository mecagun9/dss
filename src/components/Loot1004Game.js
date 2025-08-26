import React, { useState, useEffect, useCallback } from 'react';

const GRID_SIZE = 7;
const FLOORS = 3;
const DIFFICULTIES = {
  easy: { target: 5000, name: '쉬움' },
  normal: { target: 10000, name: '보통' },
  hard: { target: 20000, name: '어려움' }
};

const CARD_TYPES = {
  HEAL: 'heal',
  TRAP_DISARM: 'trap_disarm', 
  MAP: 'map',
  SCORE: 'score',
  MULTIPLIER: 'multiplier_card'
};

const TILE_TYPES = {
  EMPTY: 'empty',
  TREASURE: 'treasure',
  TRAP: 'trap',
  BIG_TREASURE: 'big_treasure',
  MULTIPLIER: 'multiplier',
  CARD: 'card',
  STAIRS_UP: 'stairs_up',
  STAIRS_DOWN: 'stairs_down',
  ENTRANCE: 'entrance',
  FINAL_TREASURE: 'final_treasure',
  WALL: 'wall',
  POTION: 'potion'
};

// 아이템 정보 상수
const ITEM_INFO = {
  [TILE_TYPES.TREASURE]: { icon: '💎', points: [50, 150], message: '보물 발견!' },
  [TILE_TYPES.BIG_TREASURE]: { icon: '💍', points: [200, 700], message: '대보물 발견!' },
  [TILE_TYPES.FINAL_TREASURE]: { icon: '👑', points: [500, 1500], message: '최종 보물!' },
  [TILE_TYPES.MULTIPLIER]: { icon: '⭐', points: [0, 0], message: '배수 증가! +0.5' },
  [TILE_TYPES.CARD]: { icon: '🃏', points: [0, 0], message: '카드 획득!' },
  [TILE_TYPES.POTION]: { icon: '🧪', points: [0, 0], message: '체력 회복! +1' }
};

function Loot1004Game() {
  const [difficulty, setDifficulty] = useState('normal');
  const [gameState, setGameState] = useState('menu');
  const [floors, setFloors] = useState([]);
  const [revealed, setRevealed] = useState([]);
  const [currentFloor, setCurrentFloor] = useState(0);
  const [playerPos, setPlayerPos] = useState({ x: 3, y: 6 });
  const [entrancePos, setEntrancePos] = useState({ x: 3, y: 6 });
  const [health, setHealth] = useState(3);
  const [score, setScore] = useState(0);
  const [multiplier, setMultiplier] = useState(1);
  const [cards, setCards] = useState({ heal: 2, trap_disarm: 3, map: 2, multiplier_card: 1 });
  const [pendingTrap, setPendingTrap] = useState(null);
  const [mapRevealed, setMapRevealed] = useState([]);
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [gameOverReason, setGameOverReason] = useState('death');
  const [disarmedTraps, setDisarmedTraps] = useState([]);
  const [wasAtEntrance, setWasAtEntrance] = useState(false);
  const [itemIcons, setItemIcons] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', onConfirm: null, onCancel: null });
  const [blockedTiles, setBlockedTiles] = useState([]); // 갈 수 없는 칸들
  const [isMapEditor, setIsMapEditor] = useState(false); // 맵 에디터 모드
  const [selectedTile, setSelectedTile] = useState(null); // 선택된 타일

  // 공통 함수: 아이템 제거 및 아이콘 업데이트
  const removeItemAndUpdateIcons = useCallback((x, y) => {
    floors[currentFloor][y][x] = TILE_TYPES.EMPTY;
    setItemIcons(prev => {
      const newIcons = [...prev];
      if (newIcons[currentFloor] && newIcons[currentFloor][y]) {
        newIcons[currentFloor][y][x] = null;
      }
      return newIcons;
    });
  }, [currentFloor, floors]);

  // 공통 함수: 점수 획득 아이템 처리
  const handleScoreItem = useCallback((tileType, x, y) => {
    const itemInfo = ITEM_INFO[tileType];
    if (itemInfo.points[0] > 0) {
      const points = Math.floor(Math.random() * (itemInfo.points[1] - itemInfo.points[0])) + itemInfo.points[0];
      const totalPoints = points * multiplier;
      setScore(prev => prev + totalPoints);
      addFloatingText(`${itemInfo.message} +${totalPoints}점`);
    } else {
      addFloatingText(itemInfo.message);
    }
    removeItemAndUpdateIcons(x, y);
  }, [multiplier, removeItemAndUpdateIcons]);

  // 공통 함수: 특수 아이템 처리
  const handleSpecialItem = useCallback((tileType, x, y) => {
    switch (tileType) {
      case TILE_TYPES.MULTIPLIER:
        setMultiplier(prev => prev + 0.5);
        break;
      case TILE_TYPES.CARD:
        const cardType = Object.values(CARD_TYPES)[Math.floor(Math.random() * Object.values(CARD_TYPES).length)];
        setCards(prev => ({ ...prev, [cardType]: prev[cardType] + 1 }));
        break;
      case TILE_TYPES.POTION:
        setHealth(prev => Math.min(3, prev + 1));
        break;
    }
    addFloatingText(ITEM_INFO[tileType].message);
    removeItemAndUpdateIcons(x, y);
  }, [removeItemAndUpdateIcons]);

  const initializeGame = useCallback(() => {
    // 입구 위치 랜덤 선택
    const edges = [
      { x: 0, y: 3 }, { x: 6, y: 3 },
      { x: 3, y: 0 }, { x: 3, y: 6 }
    ];
    const entrance = edges[Math.floor(Math.random() * edges.length)];
    setEntrancePos(entrance);

    // 3개 층 초기화
    const newFloors = [];
    const newRevealed = [];
    const newItemIcons = [];
    
    // 계단 좌표 고정
    const stairsDownPos = { x: 5, y: 5 };
    const stairsUpPos = { x: 1, y: 1 };
    
    for (let floor = 0; floor < FLOORS; floor++) {
      const grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
      const revealedGrid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(false));
      const floorIcons = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
      
      // 계단 배치
      if (floor === 0) {
        grid[entrance.y][entrance.x] = TILE_TYPES.ENTRANCE;
        revealedGrid[entrance.y][entrance.x] = true;
        grid[stairsDownPos.y][stairsDownPos.x] = TILE_TYPES.STAIRS_DOWN;
      } else if (floor === 1) {
        grid[stairsUpPos.y][stairsUpPos.x] = TILE_TYPES.STAIRS_UP;
        grid[stairsDownPos.y][stairsDownPos.x] = TILE_TYPES.STAIRS_DOWN;
      } else if (floor === 2) {
        grid[stairsUpPos.y][stairsUpPos.x] = TILE_TYPES.STAIRS_UP;
        
        // 최종 보물 배치
        let finalTreasurePlaced = false;
        while (!finalTreasurePlaced) {
          const x = Math.floor(Math.random() * GRID_SIZE);
          const y = Math.floor(Math.random() * GRID_SIZE);
          if (grid[y][x] === null && (x !== stairsUpPos.x || y !== stairsUpPos.y)) {
            grid[y][x] = TILE_TYPES.FINAL_TREASURE;
            finalTreasurePlaced = true;
          }
        }
      }
      
      // 아이템 랜덤 배치
      const itemCount = Math.floor(Math.random() * 8) + 12;
      for (let i = 0; i < itemCount; i++) {
        let placed = false;
        while (!placed) {
          const x = Math.floor(Math.random() * GRID_SIZE);
          const y = Math.floor(Math.random() * GRID_SIZE);
          
          if (grid[y][x] === null) {
            const rand = Math.random();
            let tileType;
            if (rand < 0.3) tileType = TILE_TYPES.TREASURE;
            else if (rand < 0.5) tileType = TILE_TYPES.TRAP;
            else if (rand < 0.6) tileType = TILE_TYPES.BIG_TREASURE;
            else if (rand < 0.7) tileType = TILE_TYPES.MULTIPLIER;
            else if (rand < 0.8) tileType = TILE_TYPES.CARD;
            else if (rand < 0.9) tileType = TILE_TYPES.POTION;
            else tileType = TILE_TYPES.WALL;
            
            grid[y][x] = tileType;
            
            // 아이콘 설정
            if (tileType !== TILE_TYPES.WALL && tileType !== TILE_TYPES.EMPTY && 
                tileType !== TILE_TYPES.ENTRANCE && tileType !== TILE_TYPES.STAIRS_UP && 
                tileType !== TILE_TYPES.STAIRS_DOWN) {
              floorIcons[y][x] = { x, y, type: tileType };
            }
            placed = true;
          }
        }
      }
      
      newFloors.push(grid);
      newRevealed.push(revealedGrid);
      newItemIcons.push(floorIcons);
    }
    
    // 상태 초기화
    setFloors(newFloors);
    setRevealed(newRevealed);
    setItemIcons(newItemIcons);
    setCurrentFloor(0);
    setPlayerPos({ x: entrance.x, y: entrance.y });
    setHealth(3);
    setScore(0);
    setMultiplier(1);
    setCards({ heal: 2, trap_disarm: 3, map: 2, multiplier_card: 1 });
    setDisarmedTraps([]);
    setMapRevealed([]);
    setFloatingTexts([]);
    setPendingTrap(null);
    setWasAtEntrance(false);
    setBlockedTiles([]);
    setIsMapEditor(false);
    setSelectedTile(null);
    setGameState('playing');
  }, []);

  const addFloatingText = useCallback((text) => {
    const id = Date.now();
    setFloatingTexts(prev => [...prev, { 
      id, text, x: playerPos.x, y: playerPos.y, floor: currentFloor 
    }]);
    
    setTimeout(() => {
      setFloatingTexts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, [playerPos, currentFloor]);

  const showConfirmModal = useCallback((title, message, onConfirm, onCancel) => {
    setModalConfig({ title, message, onConfirm, onCancel });
    setShowModal(true);
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (modalConfig.onConfirm) modalConfig.onConfirm();
    setShowModal(false);
  }, [modalConfig]);

  const handleModalCancel = useCallback(() => {
    if (modalConfig.onCancel) modalConfig.onCancel();
    setShowModal(false);
  }, [modalConfig]);

  // 지도 카드 사용
  const useMap = useCallback(() => {
    if (cards.map <= 0) return;
    
    setCards(prev => ({ ...prev, map: prev.map - 1 }));
    
    // 플레이어 주변 8칸을 지도로 공개
    const newMapRevealed = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue; // 플레이어 위치 제외
        
        const newX = playerPos.x + dx;
        const newY = playerPos.y + dy;
        
        if (newX >= 0 && newX < 7 && newY >= 0 && newY < 7) {
          newMapRevealed.push({ x: newX, y: newY });
          
          // 지도로 공개된 칸을 방문한 것처럼 revealed 상태 업데이트
          setRevealed(prev => {
            const newRevealed = [...prev];
            if (!newRevealed[currentFloor]) {
              newRevealed[currentFloor] = Array(7).fill().map(() => Array(7).fill(false));
            }
            newRevealed[currentFloor][newY][newX] = true;
            return newRevealed;
          });
        }
      }
    }
    
    setMapRevealed(newMapRevealed);
    addFloatingText('지도 카드 사용!');
  }, [cards.map, playerPos, currentFloor, addFloatingText]);

  // 렌더링 함수들
  const getTileDisplay = useCallback((tile, x, y) => {
    // 맵 에디터 모드이거나 공개된 칸인 경우
    if (isMapEditor || (revealed[currentFloor] && revealed[currentFloor][y] && revealed[currentFloor][y][x])) {
      const tileIcons = {
        [TILE_TYPES.EMPTY]: '⬜',
        [TILE_TYPES.TREASURE]: '💎',
        [TILE_TYPES.BIG_TREASURE]: '💍',
        [TILE_TYPES.TRAP]: '💣',
        [TILE_TYPES.MULTIPLIER]: '⭐',
        [TILE_TYPES.CARD]: '🃏',
        [TILE_TYPES.STAIRS_UP]: '⬆️',
        [TILE_TYPES.STAIRS_DOWN]: '⬇️',
        [TILE_TYPES.ENTRANCE]: '🚪',
        [TILE_TYPES.FINAL_TREASURE]: '👑',
        [TILE_TYPES.WALL]: '🧱',
        [TILE_TYPES.POTION]: '🧪'
      };
      return tileIcons[tile] || '⬜';
    }
    return '⬛';
  }, [currentFloor, revealed, isMapEditor]);

  // 지나간 칸에 아이템 표시 함수
  const getVisitedTileDisplay = useCallback((tile, x, y) => {
    // 맵 에디터 모드에서는 모든 타일 공개
    if (isMapEditor) {
      return getTileDisplay(tile, x, y);
    }
    
    // 이미 공개된 칸이거나 지도로 공개된 칸인 경우
    if ((revealed[currentFloor] && revealed[currentFloor][y] && revealed[currentFloor][y][x]) || 
        mapRevealed.some(pos => pos.x === x && pos.y === y)) {
      return getTileDisplay(tile, x, y);
    }
    
    // 방문하지 않은 칸은 완전히 가림
    return '⬛';
  }, [currentFloor, revealed, mapRevealed, getTileDisplay, isMapEditor]);

  const movePlayer = useCallback((dx, dy) => {
    if (gameState !== 'playing') return;
    
    const newPos = { x: playerPos.x + dx, y: playerPos.y + dy };
    
    // 경계 및 벽 체크
    if (newPos.x < 0 || newPos.x >= GRID_SIZE || newPos.y < 0 || newPos.y >= GRID_SIZE) {
      // 갈 수 없는 칸에 X 표시 추가
      setBlockedTiles(prev => {
        const key = `${currentFloor},${newPos.x},${newPos.y}`;
        if (!prev.includes(key)) {
          return [...prev, key];
        }
        return prev;
      });
      return;
    }
    
    const tile = floors[currentFloor][newPos.y][newPos.x];
    if (tile === TILE_TYPES.WALL) {
      // 벽에 닿았을 때도 X 표시 추가
      setBlockedTiles(prev => {
        const key = `${currentFloor},${newPos.x},${newPos.y}`;
        if (!prev.includes(key)) {
          return [...prev, key];
        }
        return prev;
      });
      return;
    }
    
    // wasAtEntrance 설정
    if (currentFloor === 0 && playerPos.x === entrancePos.x && playerPos.y === entrancePos.y) {
      if (newPos.x !== entrancePos.x || newPos.y !== entrancePos.y) {
        setWasAtEntrance(true);
      }
    }
    
    // 아이템 상호작용
    if (tile === TILE_TYPES.TREASURE || tile === TILE_TYPES.BIG_TREASURE || tile === TILE_TYPES.FINAL_TREASURE) {
      handleScoreItem(tile, newPos.x, newPos.y);
    } else if (tile === TILE_TYPES.MULTIPLIER || tile === TILE_TYPES.CARD || tile === TILE_TYPES.POTION) {
      handleSpecialItem(tile, newPos.x, newPos.y);
    } else if (tile === TILE_TYPES.TRAP) {
      if (disarmedTraps.some(trap => trap.x === newPos.x && trap.y === newPos.y)) {
        removeItemAndUpdateIcons(newPos.x, newPos.y);
      } else {
        showConfirmModal(
          '⚠️ 함정 발견!',
          '함정을 발견했습니다!\n\n확인: 데미지를 받고 함정 제거 카드 사용\n취소: 데미지만 받기',
          () => {
            if (cards.trap_disarm > 0) {
              setDisarmedTraps(prev => [...prev, { x: newPos.x, y: newPos.y }]);
              setCards(prev => ({ ...prev, trap_disarm: prev.trap_disarm - 1 }));
              addFloatingText('함정 제거 카드 사용!');
              removeItemAndUpdateIcons(newPos.x, newPos.y);
            } else {
              setHealth(prev => prev - 1);
              addFloatingText('함정! 체력 -1 (함정 제거 카드 부족)');
              setPendingTrap({ x: newPos.x, y: newPos.y });
            }
          },
          () => {
            setHealth(prev => prev - 1);
            addFloatingText('함정! 체력 -1');
            setPendingTrap({ x: newPos.x, y: newPos.y });
          }
        );
        return; // 함정 처리 후 이동하지 않음
      }
    } else if (tile === TILE_TYPES.STAIRS_DOWN) {
      if (currentFloor < FLOORS - 1) {
        showConfirmModal(
          '⬇️ 계단 발견!',
          '다음 층으로 내려가시겠습니까?',
          () => {
            setCurrentFloor(prev => prev + 1);
            setPlayerPos({ x: 3, y: 3 });
            // 층 이동 시 시작 칸을 방문한 것으로 처리
            setRevealed(prev => {
              const newRevealed = [...prev];
              if (!newRevealed[currentFloor + 1]) {
                newRevealed[currentFloor + 1] = Array(7).fill().map(() => Array(7).fill(false));
              }
              newRevealed[currentFloor + 1][3][3] = true;
              return newRevealed;
            });
            addFloatingText('다음 층으로 이동');
          },
          () => {}
        );
        return; // 계단 처리 후 이동하지 않음
      }
    } else if (tile === TILE_TYPES.STAIRS_UP) {
      if (currentFloor > 0) {
        showConfirmModal(
          '⬆️ 계단 발견!',
          '위 층으로 올라가시겠습니까?',
          () => {
            setCurrentFloor(prev => prev - 1);
            setPlayerPos({ x: 3, y: 3 });
            // 층 이동 시 시작 칸을 방문한 것으로 처리
            setRevealed(prev => {
              const newRevealed = [...prev];
              if (!newRevealed[currentFloor - 1]) {
                newRevealed[currentFloor - 1] = Array(7).fill().map(() => Array(7).fill(false));
              }
              newRevealed[currentFloor - 1][3][3] = true;
              return newRevealed;
            });
            addFloatingText('위 층으로 이동');
          },
          () => {}
        );
        return; // 계단 처리 후 이동하지 않음
      }
    }
    
    // 타일 공개 및 플레이어 이동
    const newRevealed = [...revealed];
    newRevealed[currentFloor][newPos.y][newPos.x] = true;
    setRevealed(newRevealed);
    setPlayerPos(newPos);
  }, [gameState, playerPos, currentFloor, floors, revealed, disarmedTraps, cards, 
      entrancePos, wasAtEntrance, handleScoreItem, handleSpecialItem, removeItemAndUpdateIcons, 
      showConfirmModal, addFloatingText]);

  // 카드 사용 함수들
  const useHeal = useCallback(() => {
    if (cards.heal > 0 && health < 3) {
      setHealth(prev => Math.min(3, prev + 1));
      setCards(prev => ({ ...prev, heal: prev.heal - 1 }));
      addFloatingText('체력 회복 카드 사용! +1');
    }
  }, [cards.heal, health, addFloatingText]);

  const useTrapDisarm = useCallback(() => {
    if (cards.trap_disarm > 0 && pendingTrap) {
      setDisarmedTraps(prev => [...prev, pendingTrap]);
      setCards(prev => ({ ...prev, trap_disarm: prev.trap_disarm - 1 }));
      addFloatingText('함정 제거 카드 사용!');
      setPendingTrap(null);
    }
  }, [cards.trap_disarm, pendingTrap, addFloatingText]);

  const useMultiplierCard = useCallback(() => {
    if (cards.multiplier_card > 0) {
      setMultiplier(prev => prev + 1);
      setCards(prev => ({ ...prev, multiplier_card: prev.multiplier_card - 1 }));
      addFloatingText('배수 카드 사용! +1');
    }
  }, [cards.multiplier_card, addFloatingText]);

  const escape = useCallback(() => {
    if (currentFloor === 0 && playerPos.x === entrancePos.x && playerPos.y === entrancePos.y) {
      setGameOverReason('escape');
      setGameState('gameOver');
    }
  }, [currentFloor, playerPos, entrancePos]);

  const checkGameOver = useCallback(() => {
    if (health <= 0) {
      setGameState('gameOver');
    } else if (score >= DIFFICULTIES[difficulty].target) {
      setGameState('victory');
    }
  }, [health, score, difficulty]);

  const resetGame = useCallback(() => {
    setGameState('menu');
  }, []);

  // 맵 에디터 토글
  const toggleMapEditor = useCallback(() => {
    setIsMapEditor(prev => !prev);
  }, []);

  // 맵 에디터에서 타일 변경
  const changeTileInEditor = useCallback((x, y, tileType) => {
    if (!isMapEditor || !selectedTile) return;
    
    setFloors(prev => {
      const newFloors = [...prev];
      newFloors[currentFloor][y][x] = selectedTile;
      return newFloors;
    });

    // 아이템 아이콘 업데이트
    setItemIcons(prev => {
      const newIcons = [...prev];
      if (!newIcons[currentFloor]) {
        newIcons[currentFloor] = Array(7).fill().map(() => Array(7).fill(null));
      }
      
      if (selectedTile === TILE_TYPES.EMPTY || selectedTile === TILE_TYPES.WALL || 
          selectedTile === TILE_TYPES.ENTRANCE || selectedTile === TILE_TYPES.STAIRS_UP || 
          selectedTile === TILE_TYPES.STAIRS_DOWN) {
        newIcons[currentFloor][y][x] = null;
      } else {
        newIcons[currentFloor][y][x] = { x, y, type: selectedTile };
      }
      
      return newIcons;
    });
  }, [isMapEditor, selectedTile, currentFloor]);

  // useEffect들
  useEffect(() => {
    checkGameOver();
  }, [checkGameOver]);

  useEffect(() => {
    if (playerPos.x === entrancePos.x && playerPos.y === entrancePos.y && currentFloor === 0) {
      if (wasAtEntrance && gameState === 'playing') {
        showConfirmModal(
          '🚪 입구 도달!',
          '입구에 도달했습니다!\n탈출하시겠습니까?',
          escape,
          () => {}
        );
      }
    }
  }, [playerPos, entrancePos, currentFloor, gameState, wasAtEntrance, showConfirmModal, escape]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (gameState !== 'playing') return;
      
      const keyActions = {
        'ArrowUp': () => movePlayer(0, -1),
        'w': () => movePlayer(0, -1),
        'W': () => movePlayer(0, -1),
        'ArrowDown': () => movePlayer(0, 1),
        's': () => movePlayer(0, 1),
        'S': () => movePlayer(0, 1),
        'ArrowLeft': () => movePlayer(-1, 0),
        'a': () => movePlayer(-1, 0),
        'A': () => movePlayer(-1, 0),
        'ArrowRight': () => movePlayer(1, 0),
        'd': () => movePlayer(1, 0),
        'D': () => movePlayer(1, 0),
        'e': escape,
        'E': escape,
        '1': useHeal,
        '2': useTrapDisarm,
        '3': useMap,
        '4': useMultiplierCard
      };
      
      if (keyActions[e.key]) {
        keyActions[e.key]();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState, movePlayer, escape, useHeal, useTrapDisarm, useMap, useMultiplierCard]);

  // 렌더링 함수들
  const getItemIcon = useCallback((x, y) => {
    // 맵 에디터 모드이거나 공개된 칸인 경우
    if (isMapEditor || (revealed[currentFloor] && revealed[currentFloor][y] && revealed[currentFloor][y][x]) || 
        mapRevealed.some(pos => pos.x === x && pos.y === y)) {
      if (itemIcons[currentFloor] && itemIcons[currentFloor][y] && itemIcons[currentFloor][y][x]) {
        const icon = itemIcons[currentFloor][y][x];
        if (icon) {
          const iconMap = {
            [TILE_TYPES.TREASURE]: '💎',
            [TILE_TYPES.BIG_TREASURE]: '💍',
            [TILE_TYPES.TRAP]: '💣',
            [TILE_TYPES.MULTIPLIER]: '⭐',
            [TILE_TYPES.CARD]: '🃏',
            [TILE_TYPES.POTION]: '🧪',
            [TILE_TYPES.FINAL_TREASURE]: '👑'
          };
          return iconMap[icon.type] || '';
        }
      }
    }
    return '';
  }, [currentFloor, revealed, mapRevealed, itemIcons, isMapEditor]);

  // X 표시 렌더링 함수
  const getBlockedMarker = useCallback((x, y) => {
    const key = `${currentFloor},${x},${y}`;
    return blockedTiles.includes(key) ? '❌' : '';
  }, [currentFloor, blockedTiles]);

  const renderGameBoard = useCallback(() => {
    if (!floors[currentFloor]) return null;
    
    return (
      <div className="game-board">
        <div className="floor-info">
          <h3>{currentFloor + 1}층</h3>
        </div>
        <div className="grid">
          {floors[currentFloor].map((row, y) => (
            <div key={y} className="row">
              {row.map((tile, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`tile ${playerPos.x === x && playerPos.y === y ? 'player' : ''} ${
                    mapRevealed.some(pos => pos.x === x && pos.y === y) ? 'map-revealed' : ''
                  }`}
                  onClick={() => {
                    if (isMapEditor) {
                      // 맵 에디터 모드에서는 선택된 타일로 변경
                      changeTileInEditor(x, y);
                    } else if (gameState === 'playing') {
                      const dx = x - playerPos.x;
                      const dy = y - playerPos.y;
                      if ((Math.abs(dx) === 1 && dy === 0) || (Math.abs(dy) === 1 && dx === 0)) {
                        movePlayer(dx, dy);
                      }
                    }
                  }}
                >
                  {playerPos.x === x && playerPos.y === y ? '😀' : getVisitedTileDisplay(tile, x, y)}
                  {getItemIcon(x, y) && (
                    <div className="item-icon">
                      {getItemIcon(x, y)}
                    </div>
                  )}
                  {getBlockedMarker(x, y) && (
                    <div className="blocked-marker">
                      {getBlockedMarker(x, y)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* 플로팅 텍스트 */}
        {floatingTexts
          .filter(text => text.floor === currentFloor)
          .map(text => (
            <div
              key={text.id}
              className="floating-text"
              style={{
                position: 'absolute',
                left: `${text.x * 52 + 10}px`,
                top: `${text.y * 52 + 60}px`,
                zIndex: 1000
              }}
            >
              {text.text}
            </div>
          ))}
      </div>
    );
  }, [currentFloor, floors, playerPos, gameState, mapRevealed, movePlayer, 
      getVisitedTileDisplay, getItemIcon, floatingTexts]);

  // 게임 상태별 렌더링
  if (gameState === 'menu') {
    return (
      <div className="game-container">
        <h1>💎 LOOT 1004 💎</h1>
        <div className="difficulty-selector">
          <h3>난이도 선택</h3>
          {Object.entries(DIFFICULTIES).map(([key, value]) => (
            <button
              key={key}
              onClick={() => setDifficulty(key)}
              className={difficulty === key ? 'selected' : ''}
            >
              {value.name} (목표: {value.target.toLocaleString()}점)
            </button>
          ))}
        </div>
        <button onClick={initializeGame} className="start-button">
          게임 시작
        </button>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className="game-container">
        <h1>게임 오버</h1>
        <div className="game-over-info">
          <p>최종 점수: {score.toLocaleString()}</p>
          <p>목표 점수: {DIFFICULTIES[difficulty].target.toLocaleString()}점</p>
          <p>사용한 배수: x{multiplier.toFixed(1)}</p>
          {gameOverReason === 'death' && <p>💀 체력이 0이 되었습니다.</p>}
          {gameOverReason === 'escape' && <p>🏃 탈출했습니다!</p>}
        </div>
        <button onClick={resetGame} className="reset-button">
          다시 시작
        </button>
      </div>
    );
  }

  if (gameState === 'victory') {
    return (
      <div className="game-container">
        <h1>🎉 승리! 🎉</h1>
        <div className="victory-info">
          <p>목표 점수를 달성했습니다!</p>
          <p>최종 점수: {score.toLocaleString()}</p>
          <p>사용한 배수: x{multiplier.toFixed(1)}</p>
        </div>
        <button onClick={resetGame} className="reset-button">
          다시 시작
        </button>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* 상단 상태창 */}
      <div className="top-status-bar">
        <div className="status-item">
          <span className="status-label">체력:</span>
          <span className="status-value">{'❤️'.repeat(health)}</span>
        </div>
        <div className="status-item">
          <span className="status-label">점수:</span>
          <span className="status-value">{score.toLocaleString()}</span>
        </div>
        <div className="status-item">
          <span className="status-label">배수:</span>
          <span className="status-value">x{multiplier.toFixed(1)}</span>
        </div>
        <div className="status-item">
          <span className="status-label">목표:</span>
          <span className="status-value">{DIFFICULTIES[difficulty].target.toLocaleString()}점</span>
        </div>
      </div>

      <div className="game-layout">
        {/* 중앙 게임 보드 */}
        <div className="game-center">
          {renderGameBoard()}
        </div>

        {/* 오른쪽 사이드바 */}
        <div className="right-sidebar">
          {/* 맵 에디터 토글 버튼 */}
          <div className="map-editor-section">
            <button 
              onClick={toggleMapEditor}
              className={isMapEditor ? 'active' : ''}
              style={{ 
                backgroundColor: isMapEditor ? '#4CAF50' : '#666',
                color: 'white',
                padding: '10px',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
                marginBottom: '10px'
              }}
            >
              {isMapEditor ? '맵 에디터 종료' : '맵 에디터 시작'}
            </button>
          </div>

          {isMapEditor ? (
            <div className="map-editor-panel">
              <h4>맵 에디터</h4>
              <div className="tile-selector">
                <h5>타일 선택:</h5>
                <div className="tile-buttons">
                  <button onClick={() => setSelectedTile(TILE_TYPES.EMPTY)}>⬜ 빈 공간</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.WALL)}>🧱 벽</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.TREASURE)}>💎 보물</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.BIG_TREASURE)}>💍 대보물</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.TRAP)}>💣 함정</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.MULTIPLIER)}>⭐ 배수</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.CARD)}>🃏 카드</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.POTION)}>🧪 포션</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.STAIRS_UP)}>⬆️ 위 계단</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.STAIRS_DOWN)}>⬇️ 아래 계단</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.ENTRANCE)}>🚪 입구</button>
                  <button onClick={() => setSelectedTile(TILE_TYPES.FINAL_TREASURE)}>👑 최종보물</button>
                </div>
                <p>선택된 타일: {selectedTile || '없음'}</p>
                <p>타일을 클릭하여 배치하세요</p>
              </div>
            </div>
          ) : (
            <>
              <div className="cards-section">
                <h4>카드</h4>
                <div className="card-buttons">
                  <button onClick={useHeal} disabled={cards.heal === 0 || health >= 3}>
                    체력 회복 ({cards.heal})
                  </button>
                  <button onClick={useTrapDisarm} disabled={cards.trap_disarm === 0 || !pendingTrap}>
                    함정 제거 ({cards.trap_disarm})
                  </button>
                  <button onClick={useMap} disabled={cards.map === 0}>
                    지도 ({cards.map})
                  </button>
                  <button onClick={useMultiplierCard} disabled={cards.multiplier_card === 0}>
                    배수 증가 ({cards.multiplier_card})
                  </button>
                </div>
              </div>
              
              <div className="controls-section">
                <h4>조작법</h4>
                <div>방향키 또는 WASD: 이동</div>
                <div>E: 탈출</div>
                <div>1-4: 카드 사용</div>
              </div>
              
              {pendingTrap && (
                <div className="warning">
                  ⚠️ 함정이 활성화되었습니다! 함정 제거 카드를 사용하세요.
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* 커스텀 확인창 */}
      {showModal && (
        <div className="dungeon-modal">
          <div className="dungeon-modal-content">
            <div className="dungeon-modal-title">{modalConfig.title}</div>
            <div className="dungeon-modal-message">{modalConfig.message}</div>
            <div className="dungeon-modal-buttons">
              <button className="dungeon-modal-btn confirm" onClick={handleModalConfirm}>
                확인
              </button>
              <button className="dungeon-modal-btn cancel" onClick={handleModalCancel}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Loot1004Game;
