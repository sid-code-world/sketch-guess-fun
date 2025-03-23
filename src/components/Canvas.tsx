
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/contexts/GameContext";
import { toast } from "sonner";

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);
  const { gameState, isDrawer, selectedColor } = useGame();
  
  // Set up canvas when component mounts
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Set initial canvas state
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 5;
      ctx.strokeStyle = selectedColor;
      
      // Clear canvas
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      setContext(ctx);
    }
    
    // Make canvas responsive to window size
    const resizeCanvas = () => {
      const containerWidth = canvas.parentElement?.clientWidth || 800;
      const containerHeight = Math.min(window.innerHeight * 0.6, 600);
      
      // Set canvas dimensions
      canvas.width = containerWidth;
      canvas.height = containerHeight;
      
      // Re-apply context settings after resize
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 5;
        ctx.strokeStyle = selectedColor;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    };
    
    // Initial resize
    resizeCanvas();
    
    // Add event listener for window resize
    window.addEventListener('resize', resizeCanvas);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  // Update stroke style when color changes
  useEffect(() => {
    if (context) {
      context.strokeStyle = selectedColor;
    }
  }, [selectedColor, context]);
  
  // Drawing functions
  const startDrawing = (x: number, y: number) => {
    if (!isDrawer || !context) return;
    
    setIsDrawing(true);
    context.beginPath();
    context.moveTo(x, y);
  };
  
  const draw = (x: number, y: number) => {
    if (!isDrawing || !isDrawer || !context) return;
    
    context.lineTo(x, y);
    context.stroke();
  };
  
  const stopDrawing = () => {
    if (!isDrawer || !context) return;
    
    setIsDrawing(false);
    context.closePath();
  };
  
  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    startDrawing(x, y);
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    draw(x, y);
  };
  
  // Handle touch events for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    startDrawing(x, y);
  };
  
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    e.preventDefault();
    
    const rect = canvasRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    draw(x, y);
  };
  
  // Clear canvas function
  const clearCanvas = () => {
    if (!context || !canvasRef.current) return;
    
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    toast.info("Canvas cleared!");
  };
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-xl shadow-lg">
        <canvas
          ref={canvasRef}
          className={`drawing-canvas w-full ${!isDrawer ? 'cursor-default' : ''}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={stopDrawing}
          width={800}
          height={600}
        />
        
        {/* Clear button for drawer */}
        {isDrawer && gameState.phase === 'drawing' && (
          <button
            onClick={clearCanvas}
            className="absolute bottom-4 right-4 px-3 py-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-md text-sm font-medium text-gray-700 hover:bg-white hover:shadow-lg button-transition"
          >
            Clear Canvas
          </button>
        )}
        
        {/* Disable message for non-drawers */}
        {!isDrawer && gameState.phase === 'drawing' && (
          <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-secondary/70 backdrop-blur-sm rounded-lg shadow text-sm font-medium text-secondary-foreground">
            {gameState.currentDrawer?.name} is drawing
          </div>
        )}
      </div>
    </div>
  );
};

export default Canvas;
