// 설치: npm install matter-js lucide-react
// 연애란 방탈출 게임 - 완전판 (CH8 피라미드 + CH11 블록쌓기 포함)

import React, { useState, useEffect, useRef } from 'react';
import Matter from 'matter-js';
import { Heart, HelpCircle, Eye, X } from 'lucide-react';

// ==================== CH8: 피라미드 무너뜨리기 ====================
const PYRAMID_BLOCKS = [
  { text: '사랑', color: '#FFD4CC', row: 6 },
  { text: '애정', color: '#E6CCFF', row: 5 },
  { text: '순애', color: '#FFD280', row: 5 },
  { text: '기억', color: '#C8E6A0', row: 4 },
  { text: '몽글', color: '#B8D8FF', row: 4 },
  { text: '다정', color: '#FFEB99', row: 4 },
  { text: '마음', color: '#FFB366', row: 3 },
  { text: '추억', color: '#6B66CC', row: 3 },
  { text: '온기', color: '#E699CC', row: 3 },
  { text: '애칭', color: '#FF9966', row: 3 },
  { text: '손길', color: '#FF8080', row: 2 },
  { text: '호감', color: '#DDAAFF', row: 2 },
  { text: '호감', color: '#66CCCC', row: 2 },
  { text: '믿음', color: '#C8E6A0', row: 2, interactive: true },
  { text: '첫눈', color: '#FFB899', row: 2 },
  { text: '고백', color: '#FFE680', row: 1 },
  { text: '포옹', color: '#66CCBB', row: 1 },
  { text: '만남', color: '#A8D88C', row: 1 },
  { text: '설렘', color: '#E6BBEE', row: 1 },
  { text: '두근', color: '#66B3FF', row: 1 },
  { text: '달콤', color: '#FFBBCC', row: 1 },
];

function PyramidCollapsePuzzle({ onAnswer }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const revealedRef = useRef(false);
  const [answer, setAnswer] = useState('');

  const WIDTH = 500;
  const HEIGHT = 600;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ===== 블록 데이터 생성 (Matter.js 없이 순수 물리) =====
    const blockSize = 60;
    const gap = 4;
    const centerX = WIDTH / 2;
    const baseY = HEIGHT * 0.7;
    const rowCounts = { 1: 6, 2: 5, 3: 4, 4: 3, 5: 2, 6: 1 };
    const GRAVITY = 0.4;
    const BOUNCE = 0.4;
    const FRICTION = 0.98;

    let collapsed = false;
    let clickCount = 0;
    let beliefIndex = -1;

    const blocks = PYRAMID_BLOCKS.map((blockData, i) => {
      const row = blockData.row;
      const rowCount = rowCounts[row];
      const rowIndex = PYRAMID_BLOCKS.filter(b => b.row === row).indexOf(blockData);
      const rowWidth = rowCount * (blockSize + gap);
      const x = centerX - rowWidth / 2 + (rowIndex + 0.5) * (blockSize + gap);
      const y = baseY - (row - 1) * (blockSize + gap);

      if (blockData.interactive) beliefIndex = i;

      return {
        x, y, vx: 0, vy: 0,
        angle: 0, angularVel: 0,
        color: blockData.color,
        text: blockData.text,
        interactive: !!blockData.interactive,
      };
    });

    // ===== 클릭 이벤트 =====
    let mouseDownPos = null;
    let mouseDownOnBelief = false;

    const getCanvasPos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) * (WIDTH / rect.width),
        y: (e.clientY - rect.top) * (HEIGHT / rect.height)
      };
    };

    const isOnBelief = (mx, my) => {
      if (beliefIndex < 0) return false;
      const b = blocks[beliefIndex];
      const half = blockSize / 2;
      return mx >= b.x - half && mx <= b.x + half && my >= b.y - half && my <= b.y + half;
    };

    const triggerCollapse = () => {
      collapsed = true;
      blocks.forEach(b => {
        b.vx = (Math.random() - 0.5) * 6;
        b.vy = -(Math.random() * 4 + 2);
        b.angularVel = (Math.random() - 0.5) * 0.15;
      });
      setTimeout(() => { revealedRef.current = true; }, 600);
    };

    const onMouseDown = (e) => {
      if (collapsed) return;
      const pos = getCanvasPos(e);
      if (isOnBelief(pos.x, pos.y)) {
        mouseDownOnBelief = true;
        mouseDownPos = pos;
      }
    };

    const onMouseUp = (e) => {
      if (!mouseDownOnBelief || collapsed) {
        mouseDownOnBelief = false;
        mouseDownPos = null;
        return;
      }
      mouseDownOnBelief = false;
      const pos = getCanvasPos(e);
      const dist = mouseDownPos ? Math.abs(pos.x - mouseDownPos.x) : 0;
      mouseDownPos = null;
      clickCount += (dist > 50) ? 3 : 1;
      if (clickCount >= 6) triggerCollapse();
    };

    const onTouchStart = (e) => {
      e.preventDefault();
      if (collapsed) return;
      const pos = getCanvasPos(e.touches[0]);
      if (isOnBelief(pos.x, pos.y)) {
        mouseDownOnBelief = true;
        mouseDownPos = pos;
      }
    };

    const onTouchEnd = (e) => {
      e.preventDefault();
      if (!mouseDownOnBelief || collapsed) {
        mouseDownOnBelief = false;
        mouseDownPos = null;
        return;
      }
      mouseDownOnBelief = false;
      const pos = getCanvasPos(e.changedTouches[0]);
      const dist = mouseDownPos ? Math.abs(pos.x - mouseDownPos.x) : 0;
      mouseDownPos = null;
      clickCount += (dist > 50) ? 3 : 1;
      if (clickCount >= 6) triggerCollapse();
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: false });

    // ===== 렌더 루프 =====
    const drawBlock = (ctx, b) => {
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.angle);
      ctx.fillStyle = b.color;
      ctx.fillRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.strokeRect(-blockSize / 2, -blockSize / 2, blockSize, blockSize);
      ctx.fillStyle = '#000';
      ctx.font = `bold ${blockSize * 0.3}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, 0, 0);
      ctx.restore();
    };

    const loop = () => {
      const ctx = canvas.getContext('2d');

      // 물리 업데이트
      if (collapsed) {
        blocks.forEach(b => {
          b.vy += GRAVITY;
          b.vx *= FRICTION;
          b.x += b.vx;
          b.y += b.vy;
          b.angle += b.angularVel;

          // 바닥 충돌
          const floorY = HEIGHT - blockSize / 2;
          if (b.y > floorY) {
            b.y = floorY;
            b.vy *= -BOUNCE;
            b.vx *= 0.9;
            b.angularVel *= 0.8;
            if (Math.abs(b.vy) < 0.5) b.vy = 0;
          }

          // 좌벽
          if (b.x < blockSize / 2) {
            b.x = blockSize / 2;
            b.vx *= -BOUNCE;
          }
          // 우벽
          if (b.x > WIDTH - blockSize / 2) {
            b.x = WIDTH - blockSize / 2;
            b.vx *= -BOUNCE;
          }
        });
      }

      // 배경
      ctx.fillStyle = '#18181b';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // "의심" 텍스트
      ctx.save();
      ctx.fillStyle = revealedRef.current ? 'rgba(220, 220, 220, 0.9)' : 'rgba(255, 255, 255, 0)';
      ctx.font = 'bold 100px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('의심', WIDTH / 2, HEIGHT / 2);
      ctx.restore();

      // 블록 그리기
      blocks.forEach(b => drawBlock(ctx, b));

      animFrameRef.current = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const handleSubmit = () => {
    const normalized = answer.trim();
    if (normalized === '의심' || normalized === '불신') {
      onAnswer(normalized);
    } else {
      alert('틀렸습니다. 다시 시도하세요.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-2 w-full max-w-lg mx-auto">
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        className="border-2 border-neutral-700 rounded-lg cursor-pointer w-full h-auto"
        style={{ maxWidth: WIDTH }}
      />

      <div className="flex gap-2 items-center w-full justify-center">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          placeholder="정답 입력"
          className="px-4 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-100 outline-none focus:border-neutral-500"
        />
        <button
          onClick={handleSubmit}
          className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-100 font-medium"
        >
          Enter
        </button>
      </div>

    </div>
  );
}

// ==================== CH11: 블록쌓기 게임 (다크 테마 조정) ====================
function BlockStackGame({ onSolved, onFail, debug = false }) {
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const runnerRef = useRef(null);
  const bodiesRef = useRef([]);
  const currentShapeIndexRef = useRef(0);
  const movingXRef = useRef(200);
  const movingDirectionRef = useRef(1);
  const animationFrameRef = useRef(null);
  const gameStateRef = useRef('READY');
  const successCheckIntervalRef = useRef(null);

  const [gameState, setGameState] = useState('WAITING');
  const [message, setMessage] = useState('블록 1/6 - 클릭하여 떨어뜨리기');
  const [droppedCount, setDroppedCount] = useState(0);

  const CANVAS_WIDTH = 400;
  const CANVAS_HEIGHT = 500;
  const WORLD_WIDTH = 700;
  const GROUND_Y = CANVAS_HEIGHT - 20;

  const SHAPES = [
    { id: 1, type: 'rect', size: 60, color: '#FFD700', label: '1' },
    { id: 2, type: 'rect', size: 40, color: '#4169E1', label: '2' },
    { id: 3, type: 'rect', size: 60, color: '#32CD32', label: '3' },
    { id: 4, type: 'rect', size: 20, color: '#9370DB', label: '4' },
    { id: 5, type: 'rect', size: 30, color: '#000000', label: '5' },
    { id: 6, type: 'rect', size: 30, color: '#DC143C', label: '6' },
  ];

  const updateGameState = (nextState) => {
    gameStateRef.current = nextState;
    setGameState(nextState);
  };

  const drawRect = (ctx, x, y, size, color, label) => {
    ctx.fillStyle = color;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - size / 2, y - size / 2, size, size);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  };

  const drawShape = (ctx, shape, x, y, angle = 0) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.translate(-x, -y);
    drawRect(ctx, x, y, shape.size, shape.color, shape.label);
    ctx.restore();
  };

  const createPhysicsBody = (shape, x, y) => {
    const body = Matter.Bodies.rectangle(x, y, shape.size, shape.size, {
      restitution: 0.3,
      friction: 0.8,
      density: 0.001
    });
    body.shapeData = shape;
    return body;
  };

  const handleFail = () => {
    if (gameStateRef.current === 'FAIL') return;
    updateGameState('FAIL');
    setMessage('❌ 실패! 2~6번 블록이 바닥에 닿았습니다.');
    if (successCheckIntervalRef.current) {
      clearInterval(successCheckIntervalRef.current);
      successCheckIntervalRef.current = null;
    }
    if (onFail) onFail();
  };

  const handleSuccess = () => {
    if (gameStateRef.current === 'SUCCESS') return;
    updateGameState('SUCCESS');
    setMessage('✅ 성공! 완벽하게 쌓았습니다!');
    setTimeout(() => onSolved(), 1000);
  };

  const initGame = (isInitial = false) => {
    const engine = Matter.Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;

    const runner = Matter.Runner.create();
    Matter.Runner.run(runner, engine);
    runnerRef.current = runner;

    const ground = Matter.Bodies.rectangle(WORLD_WIDTH / 2, GROUND_Y + 10, WORLD_WIDTH, 20, { isStatic: true });
    ground.isGround = true;

    const leftWall = Matter.Bodies.rectangle(-150, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT * 2, { isStatic: true });
    const rightWall = Matter.Bodies.rectangle(WORLD_WIDTH + 150, CANVAS_HEIGHT / 2, 50, CANVAS_HEIGHT * 2, { isStatic: true });

    Matter.Composite.add(engine.world, [ground, leftWall, rightWall]);

    bodiesRef.current = [];
    currentShapeIndexRef.current = 0;
    movingXRef.current = CANVAS_WIDTH / 2;
    movingDirectionRef.current = 1;

    if (!isInitial) {
      updateGameState('WAITING');
      setMessage(`블록 1/6 - 클릭하여 떨어뜨리기`);
      setDroppedCount(0);
    }

    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        const checkGroundCollision = (body, other) => {
          if (other.isGround && body.shapeData) {
            const shapeId = body.shapeData.id;
            if (shapeId >= 2) {
              handleFail();
            }
          }
        };
        checkGroundCollision(bodyA, bodyB);
        checkGroundCollision(bodyB, bodyA);
      });
    });
  };

  const handleDrop = () => {
    if (gameState !== 'WAITING') return;

    const currentIndex = currentShapeIndexRef.current;
    if (currentIndex >= SHAPES.length) return;

    const shape = SHAPES[currentIndex];
    const xCanvas = movingXRef.current;
    const offsetX = (CANVAS_WIDTH - WORLD_WIDTH) / 2;
    const xWorld = xCanvas - offsetX;
    const y = 50;

    const body = createPhysicsBody(shape, xWorld, y);
    Matter.Composite.add(engineRef.current.world, body);
    bodiesRef.current.push(body);

    updateGameState('DROPPED');
    setDroppedCount(currentIndex + 1);

    setTimeout(() => {
      currentShapeIndexRef.current++;

      if (currentShapeIndexRef.current >= SHAPES.length) {
        updateGameState('ALL_DROPPED');
        setMessage('3초 동안 안정화 중...');

        successCheckIntervalRef.current = setTimeout(() => {
          handleSuccess();
        }, 3000);
      } else {
        updateGameState('WAITING');
        setMessage(`블록 ${currentShapeIndexRef.current + 1}/6 - 클릭하여 떨어뜨리기`);
      }
    }, 500);
  };

  const resetGame = () => {
    if (successCheckIntervalRef.current) {
      clearInterval(successCheckIntervalRef.current);
      successCheckIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (runnerRef.current) {
      Matter.Runner.stop(runnerRef.current);
      runnerRef.current = null;
    }
    if (engineRef.current) {
      Matter.Composite.clear(engineRef.current.world, false);
      Matter.Engine.clear(engineRef.current);
      engineRef.current = null;
    }
    bodiesRef.current = [];
    currentShapeIndexRef.current = 0;
    movingXRef.current = CANVAS_WIDTH / 2;
    movingDirectionRef.current = 1;
    gameStateRef.current = 'READY';

    setTimeout(() => {
      initGame();
      renderLoop();
    }, 150);
  };

  const renderLoop = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const engine = engineRef.current;

    ctx.fillStyle = '#18181b';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 20);

    const offsetX = (CANVAS_WIDTH - WORLD_WIDTH) / 2;

    if (engine) {
      bodiesRef.current.forEach((body) => {
        if (body.shapeData) {
          const x = body.position.x + offsetX;
          const y = body.position.y;
          const angle = body.angle;
          drawShape(ctx, body.shapeData, x, y, angle);
        }
      });
    }

    if (gameStateRef.current === 'WAITING') {
      const shape = SHAPES[currentShapeIndexRef.current];
      const x = movingXRef.current;
      const y = 50;
      drawShape(ctx, shape, x, y, 0);

      movingXRef.current += movingDirectionRef.current * 2;
      if (movingXRef.current <= 50 || movingXRef.current >= CANVAS_WIDTH - 50) {
        movingDirectionRef.current *= -1;
      }
    }

    animationFrameRef.current = requestAnimationFrame(renderLoop);
  };

  useEffect(() => {
    initGame(true);
    renderLoop();

    return () => {
      if (successCheckIntervalRef.current) {
        clearInterval(successCheckIntervalRef.current);
      }
      if (engineRef.current) {
        Matter.Engine.clear(engineRef.current);
      }
      if (runnerRef.current) {
        Matter.Runner.stop(runnerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = () => gameState === 'WAITING' && handleDrop();
    const handleTouchStart = (e) => {
      e.preventDefault();
      gameState === 'WAITING' && handleDrop();
    };
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && gameState === 'WAITING') {
        e.preventDefault();
        handleDrop();
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  return (
    <div className="flex flex-col items-center gap-3 p-2 w-full max-w-lg mx-auto">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="border-2 border-neutral-700 rounded-lg w-full h-auto"
        style={{ cursor: gameState === 'WAITING' ? 'pointer' : 'default', maxWidth: CANVAS_WIDTH }}
      />
      <div className="text-center min-h-[50px]">
        <div className={`text-base sm:text-lg font-bold mb-1 ${gameState === 'SUCCESS' ? 'text-green-500' : gameState === 'FAIL' ? 'text-red-500' : 'text-neutral-300'}`}>
          {message}
        </div>
        <div className="text-xs sm:text-sm text-neutral-400">
          드롭한 블록: {droppedCount} / 6
        </div>
      </div>
      {gameState === 'FAIL' && (
        <button onClick={resetGame} className="px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-100 font-medium">
          다시 시작
        </button>
      )}
      <p className="text-xs text-neutral-500 text-center max-w-md px-2">
        1번(노란색) 블록만 바닥에 닿을 수 있습니다. 2~6번 블록이 바닥에 닿으면 실패!
      </p>
    </div>
  );
}

// ==================== YouTube Player (모바일 자동재생 지원) ====================
function YouTubePlayer({ videoId }) {
  const containerRef = useRef(null);
  const playerRef = useRef(null);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    let autoplayCheckTimer = null;

    const loadAPI = () => {
      if (window.YT && window.YT.Player) {
        createPlayer();
        return;
      }
      if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          if (prev) prev();
          createPlayer();
        };
        return;
      }
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      window.onYouTubeIframeAPIReady = () => createPlayer();
      document.head.appendChild(tag);
    };

    const createPlayer = () => {
      if (!containerRef.current) return;
      if (playerRef.current) {
        playerRef.current.destroy();
      }
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          controls: 1,
          rel: 0,
          modestbranding: 1,
        },
        events: {
          onReady: (e) => {
            e.target.mute();
            e.target.playVideo();
            // 1.5초 후에도 재생 안 되면 탭 오버레이 표시
            autoplayCheckTimer = setTimeout(() => {
              const state = e.target.getPlayerState();
              // -1(시작안됨), 0(끝남), 2(일시정지), 5(큐) = 재생 안됨
              if (state !== 1) {
                setNeedsTap(true);
              }
            }, 1500);
          },
          onStateChange: (e) => {
            // 재생이 시작되면 오버레이 숨기기
            if (e.data === window.YT.PlayerState.PLAYING) {
              setNeedsTap(false);
            }
            // 영상이 끝나면 다시 재생
            if (e.data === window.YT.PlayerState.ENDED) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
          },
        },
      });
    };

    loadAPI();

    return () => {
      if (autoplayCheckTimer) clearTimeout(autoplayCheckTimer);
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [videoId]);

  const handleTapToPlay = () => {
    if (playerRef.current) {
      playerRef.current.mute();
      playerRef.current.playVideo();
      setNeedsTap(false);
    }
  };

  return (
    <div
      className="w-full max-w-xl mx-auto mb-4 sm:mb-6 bg-neutral-800 border-2 border-neutral-700 rounded-lg overflow-hidden relative"
      style={{ paddingBottom: '56.25%', height: 0 }}
    >
      <div
        ref={containerRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      />
      {needsTap && (
        <button
          onClick={handleTapToPlay}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', zIndex: 10,
          }}
        >
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '48px', marginBottom: '8px' }}>▶</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>터치하여 재생</div>
          </div>
        </button>
      )}
    </div>
  );
}

// ==================== CH1: 두 개의 문 (동시클릭) ====================
function DualButtonPuzzle({ onSolved }) {
  const [lastClick, setLastClick] = useState({ a: 0, b: 0 });

  const handleDoorClick = (door) => {
    setLastClick(prev => {
      const now = Date.now();
      const newState = { ...prev, [door.toLowerCase()]: now };
      if (Math.abs(newState.a - newState.b) < 300) {
        setTimeout(() => onSolved(), 100);
      }
      return newState;
    });
  };

  return (
    <div className="text-center py-8">
      <div className="flex gap-6 justify-center mb-4">
        {['A', 'B'].map(door => (
          <button
            key={door}
            onClick={() => handleDoorClick(door)}
            className="px-12 py-8 text-2xl font-bold bg-neutral-700 hover:bg-neutral-600 rounded-xl text-neutral-100 transition-colors"
          >
            문 {door}
          </button>
        ))}
      </div>
      <p className="text-neutral-400 text-sm mt-4">둘 중 하나의 문만 고르시오</p>
    </div>
  );
}

// ==================== CH3: 기다리기 퍼즐 ====================
function WaitPuzzle({ waitTime, onSolved }) {
  const [clicked, setClicked] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const solvedRef = useRef(false);
  const onSolvedRef = useRef(onSolved);

  useEffect(() => { onSolvedRef.current = onSolved; }, [onSolved]);

  useEffect(() => {
    solvedRef.current = false;
    let count = 0;
    let interval = null;
    const delay = setTimeout(() => {
      interval = setInterval(() => {
        count += 1;
        if (count >= waitTime && !solvedRef.current) {
          solvedRef.current = true;
          clearInterval(interval);
          onSolvedRef.current();
        }
      }, 1000);
    }, 500);
    return () => {
      clearTimeout(delay);
      if (interval) clearInterval(interval);
    };
  }, [waitTime, resetKey]);

  const handleChoice = () => {
    setClicked(true);
    setTimeout(() => {
      setClicked(false);
      setResetKey(k => k + 1);
    }, 2000);
  };

  const choices = [
    { key: 'A', text: '힘들었어요?' },
    { key: 'B', text: '괜찮아요?' },
    { key: 'C', text: '(말 없이 지그시 바라본다.)' }
  ];

  return (
    <div className="text-center py-4 sm:py-8 w-full">
      <p className="text-lg sm:text-xl text-neutral-100 font-medium mb-2">"지쳐요...."</p>
      <p className="text-sm text-neutral-400 mb-6">(다음의 말에 대한 답으로 가장 부담되지 않는 것은?)</p>
      <div className="flex flex-col gap-3 max-w-md mx-auto px-2">
        {choices.map(choice => (
          <button
            key={choice.key}
            onClick={handleChoice}
            className="px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 transition-colors"
          >
            {choice.text}
          </button>
        ))}
      </div>
      {clicked && <p className="text-red-400 mt-6 text-base sm:text-lg">다시 생각해보세요...</p>}
    </div>
  );
}

// ==================== 게임 데이터 (전체 시나리오) ====================
const GAME_DATA = {
  CH1: {
    chapterImage: '/사진1.png',
    scenes: [
      { text: '사랑은 내게 어려운 것이다.\n나는 누군가를 좋아하는 것보다, 누군가를 믿는 일이 더 어려운 사람이었다.\n\n좋아하는 마음은 생긴다. 웃음도 나고, 같이 있으면 편해지고, 어느 순간 "이 사람 좋다"는 생각이 들기도 한다.\n그런데 그 다음이 문제다.\n\n\'언제 변할까\'\n\'언제 실망할까\'\n\'언제 내가 또 혼자 남게 될까\'', buttons: [{ label: '다음', type: 'next' }] },
      { text: '마음이 움직이기 시작하면, 나는 제일 먼저 출구를 찾는다.\n사랑을 하기도 전에 이별을 계산하는 습관.\n그건 똑똑함이 아니라 상처의 방식이었다.\n\n예전엔 누군가를 너무 믿었다가, 너무 쉽게 버려진 적이 있다.\n사소한 말 하나에 울고, 작은 약속 하나에 기대고, "괜찮아"라는 말 하나에 세상을 맡겼다가 나중에 돌아온 건 "너무 무겁다"는 말이었다.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '그 뒤로 나는 가벼워졌다. 정확히는, 가벼운 척을 배웠다.\n기대하지 않으면 덜 아프니까.\n사랑을 크게 하지 않으면, 무너질 것도 적으니까.\n\n그래서 나는 어느 순간부터 "좋은 사람"을 만나도 믿지 않았다.\n좋은 사람도 언젠가 나를 실망시킬 거라고,\n그게 사람의 기본값이라고 생각했다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'dualButton', answer: '동시클릭' },
    hint: '지문의 말을 믿지 말자. 의심을 가지고 행동해보자.',
    answerExplain: '1개만 고르라고 했지만 2개를 동시에 눌러야 정답입니다. 믿지 못하는 의심을 가진 주인공의 심리를 표현한 퍼즐입니다.'
  },

  CH2: {
    chapterImage: '/사진2.png',
    scenes: [
      { text: '그를 처음 본 건 정말 우연이었다.\n\n퇴근 후, 갑자기 비가 쏟아졌고 나는 우산도 없이 버스정류장에서 멈춰 섰다.\n편의점 우산은 이미 다 팔렸고, 사람들은 제 얼굴 앞만 가리며 뛰어갔다.\n\n나는 비를 맞아도 괜찮다고 생각했다.\n어차피 내 하루는 이미 젖어 있었으니까.\n\n그때 누군가가 내 옆에 멈춰 섰다.\n우산이 하나 더 펼쳐지며, 내 어깨까지 조용히 덮였다.\n\n"괜찮으시면… 같이 쓰실래요?"', buttons: [{ label: '다음', type: 'next' }] },
      { text: '이런 친절은 늘 의심부터 들었다.\n보험 같은 거 권하려는 건가, 뭘 기대하는 건가, 왜 이렇게 쉽게 말을 거는 건가.\n\n그런데 그 사람은 딱 그 말만 하고, 내 대답을 기다렸다.\n재촉도, 웃음도, 과장도 없이.\n\n나는 고개를 끄덕였고, 둘은 말 없이 걸었다.\n그는 내 속도를 맞췄다.\n비가 내리는 길에서, 누군가가 내 속도에 맞춘다는 사실이 이상하게 따뜻했다.\n\n헤어지기 직전, 그는 내게 명함을 내밀었다.\n"혹시 오늘 불편하셨다면 죄송해요. 그냥… 같은 방향이라서요."', buttons: [{ label: '다음', type: 'next' }] },
      { text: '명함이라니. 요란하지도 않고, 연락해달라고 부탁하지도 않고, 오히려 미안하다고 말하는 방식이 낯설었다.\n\n집에 와서도 한참 동안 명함을 들여다봤다.\n연락하지 않으려 했다.\n하지만 손끝이 먼저 움직였다.\n\n\'잘 들어가셨어요?\'라는 아주 짧은 메시지를 보냈다.\n\n그리고 그는 바로 답하지 않았다.\n그게 좋았다.\n그는 내 속도를 맞춰줄 줄 아는 사람이었다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'video', videoId: '16E6kv-Qtv4', answer: 'PACE', answer2: 'pace' },
    hint: '나의 속도에 맞는 걸 찾아보자..',
    answerExplain: '정답: PACE\n해석: 나의 속도 즉 ME 라는 글자와 같은 속도로 움직이는 알파벳들을 찾아서 애너그램을 해보면 PACE 라는 글자를 찾게 됩니다!\n\n※ 정답은 영어 대문자 또는 소문자로 입력하세요: PACE 또는 pace'
  },

  CH3: {
    chapterImage: '/사진3.png',
    scenes: [
      { text: '연락은 천천히 이어졌다.\n하루에 한두 번, 길지 않은 문장.\n안부를 묻되, 감정을 캐묻지 않았고\n만나자고 말하되, 거절해도 민망하지 않게 해줬다.\n\n처음 만난 자리에서 그는 나를 "설명"하게 만들지 않았다.\n"왜 그래요?"가 아니라\n"그럴 수 있죠"를 먼저 말했다.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '나는 늘 관계에서 시험을 봤다.\n상대가 나를 이해하는지, 내 감정을 감당할 수 있는지,\n내 예민함을 \'예민하다\'고 불러버리지 않는지.\n\n그는 신기하게도, 대답보다 반응이 먼저였다.\n내가 말끝을 흐리면 기다렸고,\n내가 억지로 웃으면 "괜찮아요?"를 묻지 않고 물을 따라줬다.\n"괜찮아?"라고 직접 묻는 질문이 때로는 더 무섭다는 걸 아는 사람처럼.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '나는 조금씩 마음이 풀렸다.\n마음이 풀리는 건 의외로 큰 사건이 아니라,\n\'안전하다\'는 느낌이 반복될 때 생긴다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'wait', waitTime: 10 },
    hint: '좋은 사람이란 부담을 주지 않는 것이에요. 때론 어떤 답도 부담이 될 수 있죠.',
    answerExplain: '정답: 아무것도 고르지 않고 10초 기다린다.\n해석: 표현이 힘든 사람은 자신의 말을 기다려주는 걸 좋아합니다. 기다림의 미학을 알아가봐요.'
  },

  CH4: {
    chapterImage: '/사진4.png',
    scenes: [
      { text: '어느 날, 나는 무심코 예전 이야기를 꺼냈다.\n진짜는 말하지 않으려 했는데,\n그 사람 앞에서는 \'조금\' 말해도 괜찮을 것 같았다.\n\n"나… 사람 잘 못 믿어요."\n내가 말하자 그는 "왜요?"라고 묻지 않았다.\n대신 아주 조용히 말했다.\n"그럼 내가 천천히 해볼게요."', buttons: [{ label: '다음', type: 'next' }] },
      { text: '그 문장이 이상했다.\n나를 설득하지도, 바꾸려 하지도 않았다.\n내 상태를 인정하는데, 그 인정이 차갑지 않았다.\n\n그날 집에 가는 길에 나는 울 뻔했다.\n누군가가 나를 고치려고 들지 않는다는 것,\n"괜찮아져야만 사랑받을 수 있는 것"이 아니라는 느낌이\n오래 잊고 있던 숨을 돌려줬다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'image', image: '/문제4.png', answer: '운명만남', answer2: '운명' },
    hint: '있는 그대로 바르게 보자. 그대로도 괜찮은 곳이 있다.',
    answerExplain: '정답: 운명만남\n해석: 순서가 어긋날 글자들 중에 바르게 적힌 글자는 운명만남 뿐입니다. 어떤 사람이건 그대로도 아름다운 곳이 있습니다.'
  },

  CH5: {
    chapterImage: '/사진5.png',
    scenes: [
      { text: '그와의 시간에는 \'큰 이벤트\'가 많지 않았다.\n대신, 살면서 자주 마주치는 작은 위기들이 있었다.\n\n내가 갑자기 몸살로 쓰러졌던 밤,\n그는 약을 사서 문 앞에 놓고 갔다.\n벨도 누르지 않았다.\n"잠 깨울까 봐요."\n그 말이 더 크게 들어왔다.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '내가 회사에서 실수를 해서 하루 종일 침울해하던 날,\n그는 "잘했어"라고 말하지 않았다.\n그저 "오늘 하루가 네 편이 아니었던 거네"라고 말했다.\n그 문장은 이상하게 나를 살렸다.\n내가 못나서가 아니라, 오늘이 좀 나빴던 거라고\n세상을 다시 정렬해주는 말이었다.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '나는 그 사람에게서\n"정답"이 아니라 "편"을 느꼈다.\n\n그래서 어느 순간부터\n그가 내 하루에 들어오는 걸\n허락하게 됐다.\n내 삶의 단락 사이에\n그 사람의 문장이 자연스럽게 끼어들었다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'image', image: '/문제5.png', answer: 'START', answer2: 'start' },
    hint: '시작은 사이사이 스며들어있을 것이다..',
    answerExplain: '정답: START\n해석: 글의 사이사이 글자를 빼내어 보면 정답이 됩니다.'
  },

  CH6: {
    chapterImage: '/사진6.png',
    scenes: [
      { text: '믿음은 폭죽처럼 생기지 않았다.\n대신 내 마음이 덜 경계하는 순간들이 늘어났다.\n\n그는 항상 약속 장소에 먼저 나와 있었다.\n그가 내 습관을 기억했다.\n커피는 쓴 걸 못 마신다는 것,\n사람 많은 곳에서 오래 있으면 기운이 빠진다는 것,\n기분이 안 좋을 땐 혼자 있게 해주되\n완전히 혼자 두진 말아달라는 내 모순 같은 요구까지.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '나는 그런 디테일 앞에서 약해진다.\n디테일을 기억하는 건 애정이고,\n애정은 오래 숨길 수 없는 것이니까.\n\n"나 사실, 너한테 마음이 가."\n어느 밤 내가 그렇게 말했을 때,\n그는 환호하지 않았다.\n그저 손을 잡고 말했다.\n"고마워. 천천히 와줘서."\n\n나는 그 순간,\n사랑이란 게\n서로를 급하게 끌어당기는 게 아니라\n서로의 속도를 인정하는 일일 수도 있겠다고 생각했다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'image', image: '/문제6.png', answer: '버스정류장', answer2: '정류장' },
    hint: '이 둘이 처음 만난 장소를 기억하시나요?',
    answerExplain: '정답: 버스정류장\n해석: 둘의 첫 만남은 비오는 날 버스정류장에서 이루어졌습니다.'
  },

  CH7: {
    chapterImage: '/사진7.png',
    scenes: [
      { text: '문제는 정말… 사소한 날에 왔다.\n\n그날도 별일 없을 거라고 믿었다.\n우리는 저녁에 만나기로 했고\n나는 그를 기다렸다.\n평소보다 조금 더 신경을 써서 화장도 하고\n머리도 괜히 만지고, 옷도 여러 번 갈아입었다.\n\n사랑은 가끔\n\'내가 아직 기대하고 있다\'는 증거를 몸에 남긴다.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '약속 시간 10분 전.\n나는 메시지를 보냈다.\n"어디야?"\n답이 없었다.\n\n5분이 지나고,\n10분이 지나고,\n나는 자꾸 핸드폰을 켰다.\n알림이 없는 화면이\n내 마음을 더 크게 만들었다.', buttons: [{ label: '다음', type: 'next' }] },
      { image: '/사진8.png', text: '20분쯤 지났을 때 그가 나타났다.\n\n그의 얼굴은 급한 얼굴이 아니었다.\n미안한 얼굴도 아니었다.\n그저 평소처럼, 너무 평소처럼 걸어왔다.\n\n"미안, 늦었지."\n그는 그렇게 말했다.\n그리고 덧붙였다.\n\n"잠깐… 동료 만나서 얘기 좀 하느라."\n\n동료. 얘기 좀.\n그 두 단어가 내 머리에서 서로 부딪혔다.\n\n나는 순간적으로 웃으려고 했다.\n별일 아니니까. 사소하니까.\n사람은 그럴 수 있으니까.\n\n그런데 그가 이어서 말했다.\n"아, 근데 너 메시지 못 봤어. 폰 무음이었어."', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'image', image: '/문제7.png', answer: 'BREAK', answer2: 'break' },
    hint: '어긋나버린 것을 찾아보자… 뒤틀려버린...',
    answerExplain: '정답: BREAK\n해석: 어긋난 글자들을 찾아서 순서대로 나열하면 정답이 됩니다.'
  },

  CH8: {
    chapterImage: '/사진9.png',
    scenes: [
      { text: '나는 그에게 화를 내지 않았다.\n왜냐하면 내가 화를 내는 순간\n내 감정은 "예민함"으로 정리될 게 뻔했으니까.\n\n대신 나는 조용해졌다.\n조용해지는 건\n관계를 지키는 방법이 아니라\n관계를 망가뜨리지 않기 위한 방어였다.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '그는 내 얼굴을 보며 말했다.\n"화났어?"\n그 질문이 더 얄밉게 들렸다.\n왜냐하면 그 질문에는\n내가 \'화났다고 말하면\'\n내가 이상해지는 구조가 숨어 있었으니까.\n\n"아니."\n나는 말했다.\n"그냥 좀 피곤해."', buttons: [{ label: '다음', type: 'next' }] },
      { text: '거짓말이었다.\n피곤한 건 사실이었지만\n그 피곤의 이유는\n내 마음이 또다시\n\'믿었다가 다칠까 봐\' 바짝 긴장했기 때문이었다.\n\n나는 예전의 내가 생각났다.\n기다리는 동안\n상대의 마음을 추측하고,\n추측하는 동안\n혼자 무너지고,\n무너진 뒤엔\n상대를 밀어내버리는 나.\n\n\'또 시작이네.\'\n내가 나에게 말하는 소리가 들렸다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'pyramid', answer: '의심', answer2: '불신', puzzlePrompt: '깨질것 같아...' },
    hint: '흔들리면 전부 무너지는게 무엇일까? 흔들어보자.',
    answerExplain: '정답: 의심\n해석: 믿음이 흔들리면 의심이라는 글자가 나옵니다.'
  },

  CH9: {
    chapterImage: '/사진10.png',
    scenes: [
      { text: '그는 그날 저녁 내내 사과했다.\n"미안해. 진짜 별일 아니었어."\n"다음부터는 절대 안 그래."\n"내가 생각이 짧았다."\n\n이상하게도,\n사과를 들으면 들을수록\n나는 더 불안해졌다.\n\n왜냐하면 내가 불안한 건\n그 사건 하나 때문이 아니라\n\'이 사람도 나를 실망시킬 수 있다\'는 가능성 때문이었으니까.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '그 가능성은\n사과로 사라지지 않았다.\n\n나는 속으로 생각했다.\n\'지금은 미안하다고 하지. 근데 나중엔?\'\n\'지금은 노력하겠지. 근데 익숙해지면?\'\n\'지금은 내가 소중하겠지. 근데 언젠가…\'\n\n나는 사랑을 믿지 못하는 사람이 아니라\n사랑이 변하는 순간을 너무 잘 상상하는 사람이었다.\n\n그건 예언이 아니라\n상처가 만든 상상력이었다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'image', image: '/문제9.png', answer: '싫어졌나', answer2: '싫어졌나요' },
    hint: '잘못된 글자가 보이나요?',
    answerExplain: '정답: 싫어졌나\n해석: 일기장을 읽어보면 앞뒤 순서가 바뀐 것들이 있습니다. 이렇게 바뀌어져있는 글자들을 찾아 순서대로 읽으면 됩니다.'
  },

  CH10: {
    chapterImage: '/사진11.png',
    scenes: [
      { text: '며칠 동안 나는 연락을 줄였다.\n답장을 늦게 했고,\n만나자는 말에 바쁘다고 했고,\n마음은 계속 무거웠다.\n\n그는 계속 붙잡았다.\n하지만 붙잡는 방식이 부담스럽지 않게\n조심스러웠다.\n\n"오늘도 힘들었어?"\n"내가 불편하게 했지."\n"말해주면 고칠게."', buttons: [{ label: '다음', type: 'next' }] },
      { text: '그 문장들이\n나를 더 아프게 했다.\n왜냐하면 그는 나쁜 사람이 아니었고\n나는 그걸 알고 있었기 때문이다.\n\n나쁜 사람이면 편했을지도 모른다.\n미워할 수 있으니까.\n끊어낼 수 있으니까.\n\n그런데 그는 좋은 사람이었다.\n그래서 나는 더 오래 망설였다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'image', image: '/문제10.png', answer: '고민', answer2: '갈등', puzzlePrompt: '의미하는 것' },
    hint: '잘못된 글자가 보이나요?',
    answerExplain: '정답: 고민 또는 갈등\n해석: 일기장을 읽어보면 앞뒤 순서가 바뀐 것들이 있습니다. 이렇게 바뀌어져있는 글자들을 찾아 순서대로 읽으면 됩니다.'
  },

  CH11: {
    chapterImage: '/사진12.png',
    scenes: [
      { text: '어느 밤,\n그에게서 길지 않은 메시지가 왔다.\n\n"나는 네가 나를 밀어내는 이유를\n다 이해하지 못해도 괜찮아.\n다만 네가 혼자 무너지는 건 싫어."\n\n나는 그 문장을 읽고 한참 멈췄다.\n좋은 사람이 하는 좋은 말이었는데\n왜 내 마음은 편해지지 않았을까.\n\n내 마음은 선택을 요구하고 있었다.\n다시 믿을지.\n아니면 여기서 멈출지.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '나는 그를 사랑했다.\n그건 확실했다.\n하지만 믿음은 사랑만으로 생기지 않았다.\n\n믿음은\n\'실수\'가 아니라\n\'실수 이후의 태도\'를 계속 보고 쌓이는 것이었다.\n\n그가 변할 수 있을까.\n아니면 이건 잠깐의 다짐일까.\n\n그리고 더 중요한 질문이 있었다.\n나는 다시 믿을 수 있을까.\n아니면 나는\n어떤 실수 앞에서도\n언젠가 또 이렇게 무너질까.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'blockStack' },
    hint: '1번(노란색) 블록만 바닥에 닿을 수 있습니다. 나머지 블록이 바닥에 닿으면 실패!',
    answerExplain: '블록을 신중하게 쌓으세요. 균형이 무너지지 않도록.'
  },

  CH12: {
    chapterImage: '/사진13.png',
    scenes: [
      { text: '연락창은 열려 있다.\n그의 마지막 말이 화면에 남아 있다.\n나는 답장을 쓰다 지운다.\n쓰다 지운 문장들이\n나 대신 울고 있는 것 같았다.\n\n이 사랑을 이어가면\n우리는 더 단단해질 수도 있다.\n혹은 같은 균열 위에서\n또 흔들려 무너져 내릴 수도 있다.', buttons: [{ label: '다음', type: 'next' }] },
      { text: '이 사랑을 여기서 멈추면\n나는 덜 불안해질 수도 있다.\n혹은 평생\n\'그때 내가 너무 예민했나\'라는 질문을 안고 살 수도 있다.', buttons: [{ label: 'Q', type: 'puzzle' }] }
    ],
    puzzle: { type: 'image', image: '/문제12.png', answer: 'CHOICE', answer2: 'choice' },
    hint: '다음의 글자는 어떻게 만들어 진걸까요? 마음과 틈새는 영어로 MIND, CRACK 입니다.',
    answerExplain: '정답: CHOICE\n해석: 한글의 단어를 섞어 놓은 것입니다. 예를 들어 마음의 틈새는 MIND와 CRACK을 알파벳 하나씩 섞어 놓은 것입니다.'
  },

  OUTRO: {
    endings: {
      breakup: {
        image: '/이별.png',
        text: '사랑을 믿지 못한다는 건\n어쩌면 아주 똑똑한 선택일지도 모릅니다.\n\n다치지 않기 위해,\n또 같은 상처를 반복하지 않기 위해\n우리는 마음을 접고, 가능성을 닫고,\n"이번엔 안 하는 게 맞아"라고 스스로를 설득합니다.\n\n그건 분명 자신을 보호하는 방법입니다.\n하지만 동시에,\n조용히 나를 방치하는 일이기도 합니다.\n\n사랑을 포기하는 순간,\n우리는 상처뿐 아니라\n기대할 수 있는 기쁨과\n기다려도 괜찮았던 시간까지 함께 내려놓게 되니까요.\n\n사랑은 늘 완벽한 사람과의 만남이 아닙니다.\n사랑은 실수하고, 어긋나고,\n서로의 속도를 놓치는 순간들로 이루어져 있습니다.\n\n그래서 사랑은\n감정이 아니라 도전이고,\n확신이 아니라 인내입니다.\n\n이별을 선택한 당신이\n약해서 그런 게 아니라는 걸 압니다.\n오히려 너무 많이 견뎌왔기 때문에\n지금은 멈추고 싶은 것일지도 모릅니다.\n\n하지만 언젠가,\n조금 숨이 돌아오면\n다시 한 번만 도전해도 괜찮습니다.\n\n완벽하게 사랑하지 않아도 되고,\n끝까지 잘해내지 않아도 괜찮습니다.\n\n다만,\n사랑을 시도해본 자신을\n끝까지 미워하지 않기를 바랍니다.\n\n사랑은 늘 위험하지만,\n그럼에도 불구하고\n우리가 살아 있다는 걸 가장 분명하게 느끼게 해주는\n유일한 도전이니까요.'
      },
      trust: {
        image: '/믿음.png',
        text: '믿음을 선택했다는 건\n사랑이 쉬울 거라 믿어서가 아닙니다.\n\n다시 다칠 수 있다는 걸 알면서도,\n그럼에도 불구하고\n한 번 더 손을 내밀기로 했다는 뜻입니다.\n\n믿음은\n상대가 완벽해서 생기는 게 아니라\n불안한 순간에도 도망치지 않기로 했을 때\n조금씩 자라납니다.\n\n때로는\n"이 선택이 맞을까"라는 질문이\n하루에도 몇 번씩 고개를 들지도 모릅니다.\n괜히 믿었다는 생각이 들고,\n괜히 버텼다는 기분이 들 때도 있을 겁니다.\n\n하지만 기억해 주세요.\n당신은 눈을 감고 사랑한 게 아닙니다.\n두려움을 안은 채,\n그 두려움보다 사랑을 조금 더 선택했을 뿐입니다.\n\n사랑은 언제나 흔들립니다.\n중요한 건 흔들리지 않는 게 아니라\n흔들리면서도 서로를 놓지 않는 일입니다.\n\n오늘의 믿음이\n당장 기적처럼 보이지 않아도 괜찮습니다.\n믿음은 늘 조용하게 작동합니다.\n말 한마디, 기다림 하나,\n다시 설명하려는 태도 하나로\n조금씩 내일을 바꿔갑니다.\n\n당신이 지금 하고 있는 선택은\n용기입니다.\n그리고 그 용기는\n언젠가 분명히 당신을\n지금보다 단단한 사랑으로 데려다줄 겁니다.\n\n지금은 확신이 없어도 괜찮습니다.\n믿음을 선택했다는 사실 하나만으로도\n당신은 이미,\n사랑 안으로 한 걸음 들어와 있으니까요.'
      }
    }
  }
};

// ==================== Google Apps Script URL ====================
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzCxmWyJ8HlzcGdF2FGBLKd41wwnAJiMi0diKZxWEidTQP4Eo15_Iy4lh-SsbOywRN6bQ/exec'; // TODO: Apps Script 배포 후 URL 입력

// ==================== 메인 게임 컴포넌트 ====================
export default function LoveEscapeGame() {
  // 토큰 인증 상태
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [tokenError, setTokenError] = useState('');
  const [tokenLoading, setTokenLoading] = useState(false);

  const [gamePhase, setGamePhase] = useState('INTRO'); // INTRO, PLAYING, OUTRO, RESULT
  const [currentChapter, setCurrentChapter] = useState('CH1');
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [loveDefinition, setLoveDefinition] = useState('');
  const [tempInput, setTempInput] = useState('');
  const [modalType, setModalType] = useState(null); // 'hint', 'answer', 'puzzle'
  const [hintCount, setHintCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60);
  const [endingChoice, setEndingChoice] = useState(null);
  const [reachedEndingAt, setReachedEndingAt] = useState(null);
  const [showHintConfirm, setShowHintConfirm] = useState(false);
  const timerRef = useRef(null);

  // 토큰 인증 함수
  const verifyToken = async () => {
    const token = tokenInput.trim();
    if (!token) {
      setTokenError('토큰을 입력해주세요.');
      return;
    }
    setTokenLoading(true);
    setTokenError('');
    try {
      const response = await fetch(`${APPS_SCRIPT_URL}?token=${encodeURIComponent(token)}`);
      const data = await response.json();
      if (data.valid) {
        setTokenVerified(true);
        setTokenError('');
      } else {
        setTokenError(data.message || '유효하지 않은 토큰입니다.');
      }
    } catch {
      setTokenError('서버 연결에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setTokenLoading(false);
    }
  };

  useEffect(() => {
    if (gamePhase === 'PLAYING') {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [gamePhase]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleIntroSubmit = () => {
    if (!tempInput.trim()) return alert('답을 입력하세요!');
    setLoveDefinition(tempInput);
    setTempInput('');
    setGamePhase('PLAYING');
  };

  const handleNextScene = () => {
    const chapterData = GAME_DATA[currentChapter];
    if (currentSceneIndex < chapterData.scenes.length - 1) {
      setCurrentSceneIndex(currentSceneIndex + 1);
    }
  };

  const handlePuzzleSolved = () => {
    setModalType(null);
    setTempInput('');
    const chapters = ['CH1', 'CH2', 'CH3', 'CH4', 'CH5', 'CH6', 'CH7', 'CH8', 'CH9', 'CH10', 'CH11', 'CH12'];
    const currentIndex = chapters.indexOf(currentChapter);
    if (currentIndex < chapters.length - 1) {
      setCurrentChapter(chapters[currentIndex + 1]);
      setCurrentSceneIndex(0);
    } else {
      setGamePhase('OUTRO');
    }
  };

  const renderIntro = () => (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <Heart className="w-16 h-16 mx-auto mb-8 text-red-400" />
        <h1 className="text-5xl font-bold text-neutral-100 mb-8">사랑이란</h1>
        <div className="flex items-center justify-center gap-4 mb-12">
          <input
            type="text"
            value={tempInput}
            onChange={(e) => setTempInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleIntroSubmit()}
            placeholder="____"
            className="px-6 py-3 text-2xl bg-neutral-800 border-2 border-neutral-600 rounded-lg text-neutral-100 outline-none focus:border-neutral-500 text-center w-80"
          />
          <span className="text-2xl text-neutral-100">다.</span>
        </div>
        <button
          onClick={handleIntroSubmit}
          className="px-8 py-3 text-lg bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 font-medium transition-colors"
        >
          시작하기
        </button>
      </div>
    </div>
  );

  const renderPlaying = () => {
    const chapterData = GAME_DATA[currentChapter];
    const scene = chapterData.scenes[currentSceneIndex];
    const sceneImage = scene.image || chapterData.chapterImage;

    return (
      <div className="min-h-screen flex flex-col">
        {/* TopBar */}
        <div className="flex justify-between items-center px-6 py-4 bg-neutral-900 border-b border-neutral-700">
          <div className="text-neutral-100 text-lg font-bold">{currentChapter}</div>
          <div className="text-yellow-400 text-xl font-bold">{formatTime(timeRemaining)}</div>
          <div></div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Image */}
            <div className="w-full max-w-md mx-auto mb-8 aspect-[2/3] bg-neutral-800 border-2 border-neutral-700 rounded-lg overflow-hidden">
              <img src={sceneImage} alt="Scene" className="w-full h-full object-cover" />
            </div>

            {/* Text */}
            <div className="text-neutral-200 text-lg leading-relaxed whitespace-pre-wrap mb-8 text-center">
              {scene.text}
            </div>

            {/* Buttons */}
            <div className="flex gap-4 justify-center">
              {currentSceneIndex > 0 && (
                <button
                  onClick={() => setCurrentSceneIndex(currentSceneIndex - 1)}
                  className="px-6 py-3 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 font-medium transition-colors"
                >
                  이전
                </button>
              )}
              {scene.buttons.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={() => btn.type === 'next' ? handleNextScene() : setModalType('puzzle')}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                    btn.type === 'puzzle'
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      : 'bg-neutral-700 hover:bg-neutral-600 text-neutral-100'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {modalType && renderModal()}
      </div>
    );
  };

  const renderModal = () => {
    const chapterData = GAME_DATA[currentChapter];

    return (
      <div
        className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="bg-neutral-900 border-2 border-neutral-700 rounded-xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-neutral-100">
              {modalType === 'hint' && '💡 힌트'}
              {modalType === 'answer' && '✅ 정답'}
              {modalType === 'puzzle' && '🎮 퍼즐'}
            </h2>
            <button onClick={() => setModalType(null)} className="text-neutral-400 hover:text-neutral-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          {modalType === 'hint' && (
            <div>
              <p className="text-neutral-300 mb-6 leading-relaxed">{chapterData.hint}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setModalType('answer')}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  정답 보기
                </button>
                <button
                  onClick={() => setModalType('puzzle')}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-neutral-100 transition-colors"
                >
                  퍼즐로 돌아가기
                </button>
              </div>
            </div>
          )}

          {modalType === 'answer' && (
            <div>
              <p className="text-neutral-300 mb-6 leading-relaxed whitespace-pre-wrap">{chapterData.answerExplain}</p>
              <button
                onClick={() => setModalType('puzzle')}
                className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 transition-colors"
              >
                퍼즐로 돌아가기
              </button>
            </div>
          )}

          {modalType === 'puzzle' && (
            <div>
              {renderPuzzle()}
              <div className="mt-6 flex gap-3 justify-center">
                {!showHintConfirm ? (
                  <button
                    onClick={() => setShowHintConfirm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4" />
                    힌트
                  </button>
                ) : (
                  <div className="flex flex-col gap-3 items-center">
                    <p className="text-neutral-300 text-sm">정말 힌트를 사용하시겠습니까?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setModalType('hint');
                          setHintCount(hintCount + 1);
                          setShowHintConfirm(false);
                        }}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-neutral-100 font-medium transition-colors"
                      >
                        YES
                      </button>
                      <button
                        onClick={() => setShowHintConfirm(false)}
                        className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 transition-colors"
                      >
                        NO
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderPuzzle = () => {
    const chapterData = GAME_DATA[currentChapter];
    const puzzle = chapterData.puzzle;

    const promptEl = puzzle.puzzlePrompt ? (
      <p className="text-lg sm:text-xl text-neutral-100 font-medium mb-4 text-center">"{puzzle.puzzlePrompt}"</p>
    ) : null;

    if (puzzle.type === 'pyramid') {
      return <>{promptEl}<PyramidCollapsePuzzle onAnswer={handlePuzzleSolved} /></>;
    }

    if (puzzle.type === 'blockStack') {
      return <>{promptEl}<BlockStackGame onSolved={handlePuzzleSolved} onFail={null} debug={false} /></>;
    }

    if (puzzle.type === 'dualButton') {
      return <>{promptEl}<DualButtonPuzzle onSolved={handlePuzzleSolved} /></>;
    }

    if (puzzle.type === 'wait') {
      return <>{promptEl}<WaitPuzzle waitTime={puzzle.waitTime} onSolved={handlePuzzleSolved} /></>;
    }

    if (puzzle.type === 'video') {
      const handleVideoSubmit = () => {
        const normalized = tempInput.trim().toLowerCase().replace(/\s/g, '');
        const ans1 = puzzle.answer.toLowerCase();
        const ans2 = puzzle.answer2?.toLowerCase();
        if (normalized === ans1 || normalized === ans2) {
          handlePuzzleSolved();
          setTempInput('');
        } else {
          alert('틀렸습니다!');
        }
      };

      return (
        <div className="text-center py-4 sm:py-8 w-full">
          {promptEl}
          <YouTubePlayer videoId={puzzle.videoId} />
          <p className="text-sm text-neutral-400 mb-4">영상을 보고 정답을 입력하세요</p>
          <div className="flex gap-2 items-center justify-center px-2">
            <input
              type="text"
              value={tempInput}
              onChange={(e) => setTempInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleVideoSubmit()}
              placeholder="정답 입력"
              className="flex-1 min-w-0 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-100 outline-none focus:border-neutral-500"
            />
            <button
              onClick={handleVideoSubmit}
              className="px-4 sm:px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-100 font-medium whitespace-nowrap"
            >
              Enter
            </button>
          </div>
        </div>
      );
    }

    // 기본 이미지 + 입력 퍼즐
    const handleImageSubmit = () => {
      const normalized = tempInput.trim().toLowerCase().replace(/\s/g, '');
      const ans1 = puzzle.answer.toLowerCase().replace(/\s/g, '');
      const ans2 = puzzle.answer2?.toLowerCase().replace(/\s/g, '');
      if (normalized === ans1 || normalized === ans2) {
        handlePuzzleSolved();
        setTempInput('');
      } else {
        alert('틀렸습니다!');
      }
    };

    return (
      <div className="text-center py-4 sm:py-8 w-full">
        {promptEl}
        {puzzle.image && (
          <div className="w-full max-w-xs sm:max-w-sm mx-auto mb-4 sm:mb-6 aspect-square bg-neutral-800 border-2 border-neutral-700 rounded-lg overflow-hidden">
            <img src={puzzle.image} alt="Puzzle" className="w-full h-full object-contain" />
          </div>
        )}
        <div className="flex gap-2 items-center justify-center px-2">
          <input
            type="text"
            value={tempInput}
            onChange={(e) => setTempInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleImageSubmit()}
            placeholder="정답 입력"
            className="flex-1 min-w-0 px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-100 outline-none focus:border-neutral-500"
          />
          <button
            onClick={handleImageSubmit}
            className="px-4 sm:px-6 py-2 bg-neutral-700 hover:bg-neutral-600 rounded text-neutral-100 font-medium whitespace-nowrap"
          >
            Enter
          </button>
        </div>
      </div>
    );
  };

  const renderOutro = () => {
    if (!endingChoice) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-2xl">
            <h2 className="text-3xl font-bold text-neutral-100 mb-8">
              사랑이란 {loveDefinition}다.
            </h2>
            <p className="text-xl text-neutral-300 mb-12">
              당신의 선택은?
            </p>
            <div className="flex gap-6 justify-center">
              <button
                onClick={() => {
                  setEndingChoice('breakup');
                  setReachedEndingAt(60 * 60 - timeRemaining);
                }}
                className="px-8 py-4 text-lg bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 font-medium transition-colors"
              >
                이별한다
              </button>
              <button
                onClick={() => {
                  setEndingChoice('trust');
                  setReachedEndingAt(60 * 60 - timeRemaining);
                }}
                className="px-8 py-4 text-lg bg-neutral-700 hover:bg-neutral-600 rounded-lg text-neutral-100 font-medium transition-colors"
              >
                믿어본다
              </button>
            </div>
          </div>
        </div>
      );
    }

    const ending = GAME_DATA.OUTRO.endings[endingChoice];
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="max-w-3xl">
          <div className="w-full max-w-md mx-auto mb-8 aspect-[2/3] bg-neutral-800 border-2 border-neutral-700 rounded-lg overflow-hidden">
            <img src={ending.image} alt="Ending" className="w-full h-full object-cover" />
          </div>
          <p className="text-neutral-200 text-lg leading-relaxed whitespace-pre-wrap mb-8 text-center">
            {ending.text}
          </p>
          <div className="text-center">
            <button
              onClick={() => setGamePhase('RESULT')}
              className="px-8 py-4 text-lg bg-yellow-500 hover:bg-yellow-600 rounded-lg text-black font-bold transition-colors"
            >
              결과보기
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderResult = () => {
    const success = timeRemaining > 0;
    const elapsedTime = 60 * 60 - timeRemaining;
    
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-2xl">
          <h1 className={`text-6xl font-bold mb-12 ${success ? 'text-green-400' : 'text-red-400'}`}>
            {success ? '✅ 성공!' : '❌ 실패'}
          </h1>
          <div className="text-neutral-200 text-xl leading-relaxed space-y-4">
            <p>소요 시간: {formatTime(elapsedTime)}</p>
            <p>힌트 사용 횟수: {hintCount}회</p>
            <p className="text-neutral-400 mt-8">
              {success 
                ? '제한시간 내에 탈출했습니다!' 
                : '아쉽지만 시간이 초과되었습니다.'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderTokenGate = () => (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-md">
        <Heart className="w-16 h-16 mx-auto mb-6 text-red-400" />
        <h1 className="text-4xl font-bold text-neutral-100 mb-4">연애의 문제</h1>
        <p className="text-neutral-400 mb-8">게임에 접속하려면 토큰을 입력하세요.</p>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={tokenInput}
            onChange={(e) => {
              setTokenInput(e.target.value);
              setTokenError('');
            }}
            onKeyPress={(e) => e.key === 'Enter' && verifyToken()}
            placeholder="토큰 입력"
            className="px-6 py-3 text-lg bg-neutral-800 border-2 border-neutral-600 rounded-lg text-neutral-100 outline-none focus:border-neutral-500 text-center"
            disabled={tokenLoading}
          />
          {tokenError && (
            <p className="text-red-400 text-sm">{tokenError}</p>
          )}
          <button
            onClick={verifyToken}
            disabled={tokenLoading}
            className="px-8 py-3 text-lg bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-lg text-neutral-100 font-medium transition-colors"
          >
            {tokenLoading ? '확인 중...' : '입장하기'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100">
      {!tokenVerified && renderTokenGate()}
      {tokenVerified && gamePhase === 'INTRO' && renderIntro()}
      {tokenVerified && gamePhase === 'PLAYING' && renderPlaying()}
      {tokenVerified && gamePhase === 'OUTRO' && renderOutro()}
      {tokenVerified && gamePhase === 'RESULT' && renderResult()}
    </div>
  );
}
