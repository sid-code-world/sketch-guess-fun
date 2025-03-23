
import { useGame } from "@/contexts/GameContext";

// Define the color options
const colors = [
  { name: "Black", value: "#000000" },
  { name: "Red", value: "#EF4444" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Green", value: "#10B981" },
  { name: "Yellow", value: "#F59E0B" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Orange", value: "#F97316" },
  { name: "Pink", value: "#EC4899" },
  { name: "Brown", value: "#92400E" },
];

export const ColorPalette = () => {
  const { isDrawer, selectedColor, setSelectedColor, gameState } = useGame();
  
  // Only show the palette if the user is drawing and we're in drawing phase
  if (!isDrawer || gameState.phase !== 'drawing') {
    return null;
  }
  
  return (
    <div className="glass-panel p-3 flex flex-wrap justify-center gap-2 w-full max-w-sm mx-auto animate-slide-in-bottom">
      {colors.map((color) => (
        <button
          key={color.value}
          className={`w-10 h-10 rounded-full flex items-center justify-center button-transition ${
            selectedColor === color.value 
              ? 'ring-2 ring-primary ring-offset-2 scale-110' 
              : 'hover:scale-105'
          }`}
          style={{ backgroundColor: color.value }}
          onClick={() => setSelectedColor(color.value)}
          title={color.name}
          aria-label={`Select ${color.name} color`}
        />
      ))}
    </div>
  );
};

export default ColorPalette;
