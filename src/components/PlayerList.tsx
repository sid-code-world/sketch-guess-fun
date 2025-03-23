
import { useGame } from "@/contexts/GameContext";
import { useState } from "react";
import { toast } from "sonner";

export const PlayerList = () => {
  const { gameState, updatePlayerName } = useGame();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState("");
  
  // Sort players by score (descending)
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
  
  // Handle name edit submission
  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newName.trim()) {
      updatePlayerName(newName);
      setIsEditing(false);
    } else {
      toast.error("Name cannot be empty");
    }
  };
  
  // Start editing - set the current player name as the default value
  const startEditing = () => {
    const player = gameState.players.find(p => !p.isComputer);
    if (player) {
      setNewName(player.name);
      setIsEditing(true);
    }
  };
  
  return (
    <div className="glass-panel w-full p-4 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-lg">Players</h2>
        
        {/* Edit name button */}
        {!isEditing && (
          <button 
            onClick={startEditing}
            className="text-xs px-2 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 button-transition"
          >
            Edit Name
          </button>
        )}
      </div>
      
      {/* Name edit form */}
      {isEditing && (
        <form onSubmit={handleNameSubmit} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-sm rounded border bg-white/60 backdrop-blur-sm focus:ring-1 focus:outline-none"
            placeholder="Enter your name"
            autoFocus
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 text-xs bg-secondary text-secondary-foreground rounded"
          >
            Cancel
          </button>
        </form>
      )}
      
      {/* Player list */}
      <ul className="space-y-2">
        {sortedPlayers.map((player) => (
          <li 
            key={player.id}
            className={`flex justify-between items-center py-2 px-3 rounded-lg ${
              player.isDrawing 
                ? 'bg-secondary/50 border border-secondary' 
                : player.isComputer
                ? 'bg-secondary/30'
                : 'bg-white/30'
            }`}
          >
            <div className="flex items-center gap-2">
              <span 
                className={`font-medium ${
                  player.isComputer 
                    ? 'text-secondary-foreground/70' 
                    : 'text-primary'
                }`}
              >
                {player.name}
              </span>
              {player.isDrawing && (
                <span className="text-xs bg-primary/10 px-1.5 py-0.5 rounded text-primary">
                  Drawing
                </span>
              )}
            </div>
            <span className="font-semibold">{player.score}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlayerList;
