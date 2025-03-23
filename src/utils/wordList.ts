
type WordCategory = {
  name: string;
  words: string[];
};

const wordList: WordCategory[] = [
  {
    name: "Animals",
    words: [
      "elephant", 
      "giraffe", 
      "penguin", 
      "kangaroo", 
      "dolphin", 
      "octopus", 
      "turtle", 
      "rhinoceros", 
      "butterfly", 
      "flamingo"
    ]
  },
  {
    name: "Food",
    words: [
      "pizza", 
      "hamburger", 
      "spaghetti", 
      "ice cream", 
      "watermelon", 
      "chocolate", 
      "pancakes", 
      "french fries", 
      "sushi", 
      "pineapple"
    ]
  },
  {
    name: "Sports",
    words: [
      "basketball", 
      "soccer", 
      "tennis", 
      "swimming", 
      "volleyball", 
      "baseball", 
      "golf", 
      "skateboarding", 
      "skiing", 
      "surfing"
    ]
  },
  {
    name: "Objects",
    words: [
      "computer", 
      "telephone", 
      "umbrella", 
      "glasses", 
      "backpack", 
      "bicycle", 
      "camera", 
      "television", 
      "chair", 
      "clock"
    ]
  },
  {
    name: "Places",
    words: [
      "beach", 
      "mountain", 
      "library", 
      "amusement park", 
      "restaurant", 
      "hospital", 
      "school", 
      "zoo", 
      "airport", 
      "supermarket"
    ]
  }
];

/**
 * Get a random selection of words for a player to choose from
 */
export function getRandomWordSelection(count = 3): string[] {
  // Get a random category
  const randomCategory = wordList[Math.floor(Math.random() * wordList.length)];
  
  // Get random words from that category
  const words: string[] = [];
  const shuffledWords = [...randomCategory.words].sort(() => 0.5 - Math.random());
  
  for (let i = 0; i < Math.min(count, shuffledWords.length); i++) {
    words.push(shuffledWords[i]);
  }
  
  return words;
}

export default wordList;
