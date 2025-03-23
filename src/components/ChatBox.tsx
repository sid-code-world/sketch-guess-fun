
import { useState, useRef, useEffect } from "react";
import { useGame } from "@/contexts/GameContext";
import { Check, SendHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type MessageType = {
  id: string;
  playerId: string;
  playerName: string;
  content: string;
  isCorrectGuess: boolean;
  timestamp: Date;
};

const ChatBox = () => {
  const { gameState, submitGuess, isDrawer } = useGame();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of chat when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  
  // Add system messages for game events
  useEffect(() => {
    if (gameState.phase === 'drawing' && gameState.timeRemaining === gameState.roundTime) {
      // Add message when round starts
      const newMessage: MessageType = {
        id: `system-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        content: `Round ${gameState.roundNumber} started! Time to guess the word.`,
        isCorrectGuess: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
    }
    
    if (gameState.phase === 'round-end') {
      // Add message when round ends
      const newMessage: MessageType = {
        id: `system-${Date.now()}`,
        playerId: 'system',
        playerName: 'System',
        content: `Round ended! The word was "${gameState.currentWord}".`,
        isCorrectGuess: false,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
    }
  }, [gameState.phase, gameState.roundNumber, gameState.timeRemaining, gameState.currentWord, gameState.roundTime]);
  
  // Listen for bot guesses
  useEffect(() => {
    // Subscribe to bot guess events from GameContext
    const botGuessListener = (botId: string, botName: string, isCorrect: boolean) => {
      const newMessage: MessageType = {
        id: `${botId}-${Date.now()}`,
        playerId: botId,
        playerName: botName,
        content: isCorrect ? "guessed the word!" : `I think it's "${getRandomIncorrectGuess()}"`,
        isCorrectGuess: isCorrect,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, newMessage]);
    };
    
    // Cleanup function would go here if we had an event emitter
    return () => {
      // Remove event listener if needed
    };
  }, []);
  
  const getRandomIncorrectGuess = () => {
    const incorrectGuesses = [
      "house", "tree", "car", "ball", "dog", "cat", "boat", "chair", 
      "table", "phone", "computer", "glasses", "fork", "shoe"
    ];
    return incorrectGuesses[Math.floor(Math.random() * incorrectGuesses.length)];
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || gameState.phase !== 'drawing' || isDrawer) return;
    
    // Call the submitGuess function from context
    const isCorrect = submitGuess(input);
    
    // Add message to chat
    const newMessage: MessageType = {
      id: `player-${Date.now()}`,
      playerId: 'player',
      playerName: gameState.players.find(p => !p.isComputer)?.name || 'You',
      content: isCorrect ? "guessed the word!" : input,
      isCorrectGuess: isCorrect,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInput("");
  };
  
  return (
    <div className="flex flex-col h-full border rounded-lg bg-white/70 backdrop-blur-sm overflow-hidden">
      <div className="p-3 border-b bg-secondary/30">
        <h3 className="font-semibold">Chat</h3>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-3 pb-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-2 animate-fade-in",
                message.playerId === 'system' && "text-muted-foreground text-sm"
              )}
            >
              {message.isCorrectGuess && (
                <span className="mt-0.5 min-w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-3.5 w-3.5 text-green-600" />
                </span>
              )}
              
              <div>
                <span className="font-medium mr-1.5">
                  {message.playerId === 'system' ? '' : `${message.playerName}:`}
                </span>
                <span 
                  className={cn(
                    message.isCorrectGuess && "text-green-600 font-medium"
                  )}
                >
                  {message.content}
                </span>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <form 
        onSubmit={handleSubmit} 
        className="p-3 border-t flex items-center gap-2"
      >
        <Input
          type="text"
          placeholder={isDrawer ? "You're drawing..." : "Type your guess here..."}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isDrawer || gameState.phase !== 'drawing'}
          className="flex-1"
        />
        <button
          type="submit"
          disabled={isDrawer || gameState.phase !== 'drawing'}
          className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
        >
          <SendHorizontal className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
