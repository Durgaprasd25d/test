import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw, Fuel, Map } from 'lucide-react';

function CarGame() {
    const canvasRef = useRef(null);
    const [gameOver, setGameOver] = useState(false);
    const [distance, setDistance] = useState(0);
    const [fuel, setFuel] = useState(100);
    const [speed, setSpeed] = useState(0);
    const gameStateRef = useRef({
        car: {
            x: 200,
            y: 0,
            vx: 0,
            vy: 0,
            rotation: 0,
            angularVelocity: 0,
            width: 60,
            height: 30,
            wheelbase: 50,
        },
        camera: { x: 0 },
        terrain: [],
        keys: {},
        fuel: 100,
        distance: 0,
        gameOver: false,
    });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const game = gameStateRef.current;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight - 100;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Generate terrain
        const generateTerrain = () => {
            const terrain = [];
            let x = 0;
            const segments = 200;

            for (let i = 0; i < segments; i++) {
                const y = 400 + Math.sin(i * 0.1) * 100 + Math.cos(i * 0.05) * 50 + Math.sin(i * 0.02) * 30;
                terrain.push({ x, y });
                x += 30;
            }
            return terrain;
        };

        game.terrain = generateTerrain();
        game.car.y = getTerrainY(game.car.x) - 50;

        // Get terrain height at x position
        function getTerrainY(x) {
            const segmentIndex = Math.floor(x / 30);
            if (segmentIndex < 0) return game.terrain[0]?.y || 400;
            if (segmentIndex >= game.terrain.length - 1) return game.terrain[game.terrain.length - 1]?.y || 400;

            const segment1 = game.terrain[segmentIndex];
            const segment2 = game.terrain[segmentIndex + 1];
            const t = (x - segment1.x) / (segment2.x - segment1.x);
            return segment1.y + (segment2.y - segment1.y) * t;
        }

        // Get terrain angle at x position
        function getTerrainAngle(x) {
            const segmentIndex = Math.floor(x / 30);
            if (segmentIndex < 0 || segmentIndex >= game.terrain.length - 1) return 0;

            const segment1 = game.terrain[segmentIndex];
            const segment2 = game.terrain[segmentIndex + 1];
            return Math.atan2(segment2.y - segment1.y, segment2.x - segment1.x);
        }

        // Keyboard controls
        const handleKeyDown = (e) => {
            game.keys[e.key] = true;
        };

        const handleKeyUp = (e) => {
            game.keys[e.key] = false;
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Game loop
        let lastTime = Date.now();
        const gameLoop = () => {
            const now = Date.now();
            const dt = (now - lastTime) / 1000;
            lastTime = now;

            if (game.gameOver) {
                requestAnimationFrame(gameLoop);
                return;
            }

            // Physics constants
            const gravity = 800;
            const enginePower = 500;
            const brakeForce = 300;
            const friction = 0.95;
            const rotationDamping = 0.9;
            const maxSpeed = 400;

            // Apply controls
            if ((game.keys['ArrowUp'] || game.keys['w'] || game.keys['W']) && game.fuel > 0) {
                game.car.vx += enginePower * dt;
                game.fuel -= 5 * dt;
            }
            if (game.keys['ArrowDown'] || game.keys['s'] || game.keys['S']) {
                game.car.vx -= brakeForce * dt;
            }

            // Clamp speed
            game.car.vx = Math.max(-maxSpeed, Math.min(maxSpeed, game.car.vx));

            // Apply gravity
            game.car.vy += gravity * dt;

            // Update position
            game.car.x += game.car.vx * dt;
            game.car.y += game.car.vy * dt;

            // Terrain collision for front and rear wheels
            const frontWheelX = game.car.x + Math.cos(game.car.rotation) * (game.car.wheelbase / 2);
            const rearWheelX = game.car.x - Math.cos(game.car.rotation) * (game.car.wheelbase / 2);

            const frontTerrainY = getTerrainY(frontWheelX);
            const rearTerrainY = getTerrainY(rearWheelX);

            const frontWheelY = game.car.y + Math.sin(game.car.rotation) * (game.car.wheelbase / 2);
            const rearWheelY = game.car.y - Math.sin(game.car.rotation) * (game.car.wheelbase / 2);

            // Check collision
            let onGround = false;

            if (frontWheelY > frontTerrainY - 15) {
                onGround = true;
                game.car.vy *= -0.3;
                game.car.vx *= friction;
            }

            if (rearWheelY > rearTerrainY - 15) {
                onGround = true;
                game.car.vy *= -0.3;
                game.car.vx *= friction;
            }

            if (onGround) {
                // Adjust rotation to match terrain
                const terrainAngle = getTerrainAngle(game.car.x);
                const targetRotation = terrainAngle;
                game.car.rotation += (targetRotation - game.car.rotation) * 0.1;
                game.car.angularVelocity *= rotationDamping;
            } else {
                // In air - rotate based on horizontal velocity
                game.car.angularVelocity += (game.car.vx * 0.001) * dt;
                game.car.rotation += game.car.angularVelocity * dt;
            }

            // Update distance
            game.distance = Math.max(0, game.car.x / 30);

            // Check game over conditions
            if (game.fuel <= 0) {
                game.gameOver = true;
            }

            // Check if car is upside down or fell off
            if (game.car.y > canvas.height + 200 || Math.abs(game.car.rotation) > Math.PI / 2) {
                game.gameOver = true;
            }

            // Update camera
            game.camera.x = game.car.x - canvas.width / 3;

            // Update state
            setDistance(Math.floor(game.distance));
            setFuel(Math.max(0, Math.floor(game.fuel)));
            setSpeed(Math.floor(Math.abs(game.car.vx)));
            setGameOver(game.gameOver);

            // Render
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw sky gradient
            const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, '#87CEEB');
            skyGradient.addColorStop(1, '#E0F6FF');
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw terrain
            ctx.save();
            ctx.translate(-game.camera.x, 0);

            // Draw terrain fill
            ctx.beginPath();
            ctx.moveTo(game.terrain[0].x, canvas.height);
            game.terrain.forEach((point) => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineTo(game.terrain[game.terrain.length - 1].x, canvas.height);
            ctx.closePath();

            const terrainGradient = ctx.createLinearGradient(0, 300, 0, canvas.height);
            terrainGradient.addColorStop(0, '#8B7355');
            terrainGradient.addColorStop(1, '#654321');
            ctx.fillStyle = terrainGradient;
            ctx.fill();

            // Draw terrain outline
            ctx.beginPath();
            game.terrain.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.strokeStyle = '#5A3A1A';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Draw grass on top
            ctx.beginPath();
            game.terrain.forEach((point, i) => {
                if (i === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.strokeStyle = '#2D5016';
            ctx.lineWidth = 8;
            ctx.stroke();

            // Draw car
            ctx.save();
            ctx.translate(game.car.x, game.car.y);
            ctx.rotate(game.car.rotation);

            // Car body
            const carGradient = ctx.createLinearGradient(-30, -15, -30, 15);
            carGradient.addColorStop(0, '#FF4444');
            carGradient.addColorStop(1, '#CC0000');
            ctx.fillStyle = carGradient;
            ctx.fillRect(-30, -15, 60, 30);

            // Car outline
            ctx.strokeStyle = '#990000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-30, -15, 60, 30);

            // Window
            ctx.fillStyle = '#87CEEB';
            ctx.fillRect(-10, -12, 30, 20);

            // Wheels
            const drawWheel = (x, y) => {
                ctx.fillStyle = '#333';
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 2;
                ctx.stroke();
            };

            drawWheel(-20, 15);
            drawWheel(20, 15);

            ctx.restore();
            ctx.restore();

            requestAnimationFrame(gameLoop);
        };

        gameLoop();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    const restartGame = () => {
        const game = gameStateRef.current;
        game.car.x = 200;
        game.car.y = 0;
        game.car.vx = 0;
        game.car.vy = 0;
        game.car.rotation = 0;
        game.car.angularVelocity = 0;
        game.fuel = 100;
        game.distance = 0;
        game.gameOver = false;
        game.camera.x = 0;
        setGameOver(false);
        setDistance(0);
        setFuel(100);
        setSpeed(0);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            <canvas
                ref={canvasRef}
                className="absolute top-0 left-0"
            />

            {/* HUD */}
            <div className="absolute top-20 left-4 space-y-3 animate-fade-in">
                {/* Distance */}
                <div className="glass-card rounded-xl px-4 py-3 min-w-[150px]">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Map className="w-4 h-4" />
                        <span>Distance</span>
                    </div>
                    <div className="text-2xl font-bold text-gradient">
                        {distance}m
                    </div>
                </div>

                {/* Fuel */}
                <div className="glass-card rounded-xl px-4 py-3 min-w-[150px]">
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                        <Fuel className="w-4 h-4" />
                        <span>Fuel</span>
                    </div>
                    <div className="mb-2">
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                                className={`h-full rounded-full transition-all duration-300 ${fuel > 50
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                                        : fuel > 20
                                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                                            : 'bg-gradient-to-r from-red-500 to-pink-500'
                                    }`}
                                style={{ width: `${fuel}%` }}
                            />
                        </div>
                    </div>
                    <div className="text-xl font-bold text-gray-800">
                        {fuel}%
                    </div>
                </div>

                {/* Speed */}
                <div className="glass-card rounded-xl px-4 py-3 min-w-[150px]">
                    <div className="text-sm text-gray-600 mb-1">Speed</div>
                    <div className="text-2xl font-bold text-gray-800">
                        {speed} <span className="text-sm">km/h</span>
                    </div>
                </div>
            </div>

            {/* Controls hint */}
            <div className="absolute bottom-4 right-4 glass-card rounded-xl px-4 py-3 animate-fade-in">
                <div className="text-sm text-gray-700">
                    <div className="font-semibold mb-2">Controls:</div>
                    <div>↑ / W - Accelerate</div>
                    <div>↓ / S - Brake</div>
                </div>
            </div>

            {/* Game Over Modal */}
            {gameOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card rounded-2xl p-8 max-w-md text-center animate-scale-in">
                        <div className="text-6xl mb-4">🏁</div>
                        <h2 className="text-4xl font-bold text-gradient mb-4">
                            Game Over!
                        </h2>
                        <div className="space-y-2 mb-6">
                            <p className="text-xl text-gray-700">
                                Distance: <span className="font-bold text-primary-600">{distance}m</span>
                            </p>
                            <p className="text-gray-600">
                                {fuel === 0 ? 'Out of fuel! ⛽' : 'Car crashed! 💥'}
                            </p>
                        </div>
                        <button
                            onClick={restartGame}
                            className="btn-primary flex items-center gap-2 mx-auto"
                        >
                            <RotateCcw className="w-5 h-5" />
                            Play Again
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CarGame;
