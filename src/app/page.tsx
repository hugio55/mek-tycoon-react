import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-purple-500/10" />
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 bg-clip-text text-transparent">
                MEK TYCOON
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Craft, Trade, and Collect Unique Mek NFTs
            </p>
            
            <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
              Welcome to the ultimate Mek crafting experience. Combine essences, unlock recipes, 
              and create powerful Mek components in real-time. Trade with other players and build 
              your collection!
            </p>
            
            {/* Main Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link
                href="/crafting"
                className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-yellow-500/25"
              >
                🔨 Start Crafting
              </Link>
              
              <Link
                href="/marketplace"
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-bold rounded-lg transition-all transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
              >
                🏪 Marketplace
              </Link>
              
              <Link
                href="/inventory"
                className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg border-2 border-gray-600 hover:border-gray-500 transition-all transform hover:scale-105"
              >
                🎒 Inventory
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Grid */}
      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-yellow-400">
          Game Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Real-time Crafting */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Real-time Crafting</h3>
            <p className="text-gray-400">
              Watch your items craft in real-time with progress tracking and instant updates
            </p>
          </div>
          
          {/* Multiple Slots */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
            <div className="text-3xl mb-4">🎰</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Multiple Crafting Slots</h3>
            <p className="text-gray-400">
              Unlock up to 5 crafting slots to maximize your production efficiency
            </p>
          </div>
          
          {/* Essence Economy */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
            <div className="text-3xl mb-4">💎</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Essence Economy</h3>
            <p className="text-gray-400">
              Collect and trade 15+ different essence types to fuel your crafting
            </p>
          </div>
          
          {/* Success Rates */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Strategic Crafting</h3>
            <p className="text-gray-400">
              Each recipe has different success rates and cooldowns - plan wisely!
            </p>
          </div>
          
          {/* Trading */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
            <div className="text-3xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Player Marketplace</h3>
            <p className="text-gray-400">
              Trade essences, components, and complete Meks with other players
            </p>
          </div>
          
          {/* Achievements */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700 hover:border-yellow-500/50 transition-all">
            <div className="text-3xl mb-4">🏆</div>
            <h3 className="text-xl font-bold text-yellow-400 mb-2">Achievements</h3>
            <p className="text-gray-400">
              Unlock achievements and earn rewards as you master the crafting system
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="bg-gray-900/50 backdrop-blur-sm border-y border-gray-800">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-yellow-400">102</div>
              <div className="text-gray-400">Head Variations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-400">112</div>
              <div className="text-gray-400">Body Variations</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-400">95</div>
              <div className="text-gray-400">Unique Traits</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-400">4000</div>
              <div className="text-gray-400">Total Meks</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6 text-yellow-400">
          Ready to Start Your Journey?
        </h2>
        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
          Join the Mek Tycoon community and start crafting your unique collection today!
        </p>
        <Link
          href="/crafting"
          className="inline-block px-12 py-5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-black font-bold text-lg rounded-lg transition-all transform hover:scale-105 shadow-xl hover:shadow-yellow-500/30"
        >
          🚀 Launch Crafting Station
        </Link>
      </div>
    </div>
  );
}
