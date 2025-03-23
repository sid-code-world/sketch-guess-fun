
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  
  // Handle play button click
  const handlePlayClick = () => {
    navigate("/game");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Sketch<span className="text-primary opacity-80">Guess</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Draw and guess words in this fun, minimalist drawing game inspired by classic online drawing games.
          </p>
          
          <motion.button
            onClick={handlePlayClick}
            className="px-8 py-4 bg-primary text-primary-foreground rounded-xl font-medium text-lg hover:opacity-90 transition-all duration-300 shadow-md hover:shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Play Now
          </motion.button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 glass-panel p-8 rounded-2xl max-w-4xl w-full"
        >
          <h2 className="text-2xl font-semibold mb-6 text-center">How to Play</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/40 backdrop-blur-sm p-5 rounded-xl">
              <div className="text-4xl font-bold text-primary/60 mb-3">1</div>
              <h3 className="text-lg font-medium mb-2">Draw a Word</h3>
              <p className="text-muted-foreground">
                Select from a list of words and draw it for others to guess using different colors and tools.
              </p>
            </div>
            
            <div className="bg-white/40 backdrop-blur-sm p-5 rounded-xl">
              <div className="text-4xl font-bold text-primary/60 mb-3">2</div>
              <h3 className="text-lg font-medium mb-2">Guess Words</h3>
              <p className="text-muted-foreground">
                When others are drawing, try to guess what they're drawing before the timer runs out.
              </p>
            </div>
            
            <div className="bg-white/40 backdrop-blur-sm p-5 rounded-xl">
              <div className="text-4xl font-bold text-primary/60 mb-3">3</div>
              <h3 className="text-lg font-medium mb-2">Earn Points</h3>
              <p className="text-muted-foreground">
                Both the drawer and correct guessers earn points. The player with the most points wins!
              </p>
            </div>
          </div>
        </motion.div>
      </div>
      
      <footer className="py-6 border-t border-border/30">
        <div className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} SketchGuess - A beautiful drawing and guessing game
        </div>
      </footer>
    </div>
  );
};

export default Index;
