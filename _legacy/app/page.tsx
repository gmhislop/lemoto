import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🚴‍♂️</div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Lemoto</h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link 
                href="/sign-in"
                className="text-gray-700 hover:text-black transition-colors duration-200 font-medium text-[17px]"
              >
                Sign In
              </Link>
              <Link 
                href="/sign-up"
                className="bg-black text-white px-5 py-2.5 rounded-full hover:bg-gray-800 transition-all duration-200 font-medium text-[15px]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-28">
        <div className="text-center">
          <h2 className="text-6xl md:text-7xl font-semibold text-gray-900 mb-8 tracking-tight leading-none">
            Never get caught<br />in bad weather
          </h2>
          <p className="text-[21px] text-gray-700 mb-12 max-w-2xl mx-auto leading-relaxed font-normal">
            Lemoto is your intelligent ride companion that analyzes weather conditions 
            against your preferences to recommend the perfect time to ride.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <Link 
              href="/sign-up"
              className="bg-black text-white px-8 py-4 rounded-full hover:bg-gray-800 transition-all duration-300 font-medium text-[17px] transform hover:scale-[1.02]"
            >
              Start riding smart
            </Link>
            <Link 
              href="/sign-in"
              className="border border-gray-300 text-gray-900 px-8 py-4 rounded-full hover:border-gray-400 hover:bg-gray-50 transition-all duration-300 font-medium text-[17px]"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* Hero Widget Demo */}
        <div className="max-w-sm mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8">
            <div className="text-center">
              <div className="text-5xl mb-6">✅</div>
              <h3 className="text-2xl font-semibold text-green-600 mb-3 tracking-tight">Ride OK</h3>
              <p className="text-gray-700 mb-6 text-[17px]">Perfect conditions right now</p>
              <div className="space-y-3 text-left bg-gray-50 rounded-2xl p-4">
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                  <span>22°C — Perfect temperature</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                  <span>No rain expected</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-2 h-2 bg-gray-400 rounded-full mr-3"></div>
                  <span>Light winds (5 m/s)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-gray-50 py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
              Intelligent. Simple. Perfect.
            </h3>
            <p className="text-[21px] text-gray-700 max-w-2xl mx-auto leading-relaxed">
              Everything you need for smart riding decisions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-2xl mb-8 mx-auto">
                🗓️
              </div>
              <h4 className="text-2xl font-semibold mb-4 text-gray-900 tracking-tight">Your Schedule</h4>
              <p className="text-[17px] text-gray-700 leading-relaxed">
                Set your preferred riding days and times. We'll only recommend rides when you're available.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-2xl mb-8 mx-auto">
                🌡️
              </div>
              <h4 className="text-2xl font-semibold mb-4 text-gray-900 tracking-tight">Weather Preferences</h4>
              <p className="text-[17px] text-gray-700 leading-relaxed">
                Configure your comfort zone — temperature ranges, rain tolerance, and wind limits.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center text-2xl mb-8 mx-auto">
                ⚡
              </div>
              <h4 className="text-2xl font-semibold mb-4 text-gray-900 tracking-tight">Instant Decisions</h4>
              <p className="text-[17px] text-gray-700 leading-relaxed">
                Get clear "Ride OK" or "Not Recommended" decisions with detailed weather analysis.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-28 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-20">
            <h3 className="text-5xl font-semibold text-gray-900 mb-6 tracking-tight">
              How it works
            </h3>
          </div>

          <div className="grid md:grid-cols-3 gap-16 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-lg font-semibold text-white">1</span>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900 tracking-tight">Set preferences</h4>
              <p className="text-[17px] text-gray-700 leading-relaxed">Configure your riding schedule and weather comfort zone in minutes</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-lg font-semibold text-white">2</span>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900 tracking-tight">Get recommendations</h4>
              <p className="text-[17px] text-gray-700 leading-relaxed">We analyze real-time weather data against your personal preferences</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-lg font-semibold text-white">3</span>
              </div>
              <h4 className="text-xl font-semibold mb-4 text-gray-900 tracking-tight">Ride with confidence</h4>
              <p className="text-[17px] text-gray-700 leading-relaxed">Know exactly when conditions are perfect for your next ride</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-black py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h3 className="text-5xl font-semibold text-white mb-8 tracking-tight leading-tight">
            Ready to ride smarter?
          </h3>
          <p className="text-[21px] text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of riders who never get caught in bad weather. Setup takes less than two minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/sign-up"
              className="bg-white text-black px-8 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 font-medium text-[17px] transform hover:scale-[1.02]"
            >
              Get started for free
            </Link>
            <Link 
              href="/sign-in"
              className="border border-gray-600 text-white px-8 py-4 rounded-full hover:border-gray-500 hover:bg-gray-900 transition-all duration-300 font-medium text-[17px]"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="text-2xl">🚴‍♂️</div>
              <h4 className="text-2xl font-semibold text-gray-900 tracking-tight">Lemoto</h4>
            </div>
            <p className="text-[17px] text-gray-600 mb-8">Smart Ride Weather Companion</p>
            <div className="flex justify-center space-x-8">
              <Link href="/sign-up" className="text-gray-700 hover:text-black text-[17px] font-medium transition-colors duration-200">Sign up</Link>
              <Link href="/sign-in" className="text-gray-700 hover:text-black text-[17px] font-medium transition-colors duration-200">Sign in</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
