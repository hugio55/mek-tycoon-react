"use client";

interface UserResourcesProps {
  user: {
    gold: number;
    totalEssence: {
      stone: number;
      disco: number;
      paul: number;
      cartoon: number;
      candy: number;
      [key: string]: number;
    };
  };
}

export default function UserResources({ user }: UserResourcesProps) {
  // Show only the most important essences
  const mainEssences = [
    { name: "Stone", key: "stone", color: "bg-gray-500", icon: "🗿" },
    { name: "Disco", key: "disco", color: "bg-purple-500", icon: "🕺" },
    { name: "Cartoon", key: "cartoon", color: "bg-pink-500", icon: "🎨" },
    { name: "Candy", key: "candy", color: "bg-red-500", icon: "🍬" },
  ];
  
  return (
    <div className="flex items-center gap-4">
      {/* Gold Display */}
      <div className="flex items-center gap-2 bg-yellow-900/30 px-4 py-2 rounded-lg border border-yellow-500/50">
        <span className="text-2xl">💰</span>
        <div>
          <div className="text-yellow-400 font-bold text-lg">{Math.floor(user.gold).toLocaleString()}</div>
          <div className="text-yellow-600 text-xs">Gold</div>
        </div>
      </div>
      
      {/* Main Essences */}
      <div className="flex items-center gap-3">
        {mainEssences.map((essence) => (
          <div
            key={essence.key}
            className="flex items-center gap-1 bg-gray-800/50 px-3 py-2 rounded-lg border border-gray-700"
            title={essence.name}
          >
            <span className="text-lg">{essence.icon}</span>
            <span className="font-semibold">{user.totalEssence[essence.key]}</span>
          </div>
        ))}
        
        {/* More essences indicator */}
        <button className="text-gray-400 hover:text-white transition-colors" title="View all essences">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
            <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}