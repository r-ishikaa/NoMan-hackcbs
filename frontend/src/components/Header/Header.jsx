import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown } from 'lucide-react';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };

  // Calculate collapse progress (0 = not collapsed, 1 = fully collapsed)
  const collapseProgress = Math.min(scrollY / (window.innerHeight * 0.5), 1);
  
  // Function to calculate image transform based on collapse progress
  const getImageTransform = (startX, startY, imageWidth, imageHeight, baseRotation) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Calculate the center point of the image
    const imageCenterX = startX + (imageWidth / 2);
    const imageCenterY = startY + (imageHeight / 2);
    
    // Calculate movement towards viewport center
    const moveX = (centerX - imageCenterX) * collapseProgress;
    const moveY = (centerY - imageCenterY) * collapseProgress;
    
    // Scale down completely as collapsing
    const scale = 1 - collapseProgress;
    
    // Opacity fade out completely
    const opacity = 1 - collapseProgress;
    
    // Dynamic rotation
    const rotation = baseRotation + (collapseProgress * baseRotation * 2);
    
    return {
      transform: `translate(${moveX}px, ${moveY}px) scale(${scale}) rotate(${rotation}deg)`,
      opacity: opacity
    };
  };

  return (
    <div className="bg-[#D9C5B2] min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#E8DED3]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900">
              squad<span className="block text-sm -mt-2">easy</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button className="text-gray-900 hover:text-gray-700 flex items-center gap-1">
                Our solution <ChevronDown className="w-4 h-4" />
              </button>
              <button className="text-gray-900 hover:text-gray-700">Application</button>
              <button className="text-gray-900 hover:text-gray-700 flex items-center gap-1">
                Challenges <ChevronDown className="w-4 h-4" />
              </button>
              <button className="text-gray-900 hover:text-gray-700 flex items-center gap-1">
                Resources <ChevronDown className="w-4 h-4" />
              </button>
              <select className="bg-transparent text-gray-900 border-none outline-none">
                <option>EN</option>
                <option>FR</option>
              </select>
              <button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-2.5 font-medium transition-colors flex items-center gap-2">
                TALK TO US <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Floating Profile Images */}
        <div
          className="absolute top-32 left-12 w-40 h-48 bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-200"
          style={getImageTransform(48, 128, 160, 192, -6)}
        >
          <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=400&fit=crop" alt="Woman smiling" className="w-full h-full object-cover" />
        </div>

        <div
          className="absolute top-64 left-48 w-48 h-56 bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-200"
          style={getImageTransform(192, 256, 192, 224, 3)}
        >
          <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&h=400&fit=crop" alt="Professional woman" className="w-full h-full object-cover" />
        </div>

        <div
          className="absolute top-20 right-12 w-44 h-52 bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-200"
          style={getImageTransform(window.innerWidth - 48 - 176, 80, 176, 208, 6)}
        >
          <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&h=400&fit=crop" alt="Happy woman" className="w-full h-full object-cover" />
        </div>

        <div
          className="absolute bottom-32 left-24 w-36 h-44 bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-200"
          style={getImageTransform(96, window.innerHeight - 128 - 176, 144, 176, 12)}
        >
          <img src="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=300&h=400&fit=crop" alt="Woman portrait" className="w-full h-full object-cover" />
        </div>

        <div
          className="absolute bottom-48 right-32 w-52 h-60 bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-200"
          style={getImageTransform(window.innerWidth - 128 - 208, window.innerHeight - 192 - 240, 208, 240, -3)}
        >
          <img src="https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&h=400&fit=crop" alt="Confident woman" className="w-full h-full object-cover" />
        </div>

        <div
          className="absolute bottom-24 right-12 w-40 h-48 bg-white rounded-3xl shadow-xl overflow-hidden transition-all duration-200"
          style={getImageTransform(window.innerWidth - 48 - 160, window.innerHeight - 96 - 192, 160, 192, 6)}
        >
          <img src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=300&h=400&fit=crop" alt="Woman with glasses" className="w-full h-full object-cover" />
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight">
            <span className="text-gray-900">FOR WOMEN</span><br />
            <span className="text-gray-900">WHO WANT MORE</span><br />
            <span className="text-gray-900">THAN JUST A FEED.</span><br />
            <span className="text-[#FF6BC7]">YOUR SQUAD.</span><br />
            <span className="text-[#FF6BC7]">YOUR STORIES.</span>
          </h1>

          <div className="mt-12">
            <Link to="/signup" className="inline-block bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-8 py-6 text-lg font-bold shadow-lg transition-colors text-center">
              SIGN UP
            </Link>
          </div>

          <div className="mt-16">
            <button onClick={scrollToNext} className="text-[#FF6BC7] animate-bounce">
              <ChevronDown className="w-8 h-8" />
            </button>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 bg-gray-900 text-white w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <img
                src="data:image/jpeg;base64,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"
                className="rounded-3xl shadow-2xl w-full max-w-lg"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-12">
                Women's favourite,<br />
                <span className="text-[#D4FF5C]">empowerment app.</span>
              </h2>
              <div className="space-y-8">
                <div>
                  <div className="text-6xl font-black text-[#D4FF5C]">92%</div>
                  <p className="text-xl mt-2">of users feel more confident and connected.</p>
                </div>
                <div>
                  <div className="text-6xl font-black text-[#FF6BC7]">+18%</div>
                  <p className="text-xl mt-2">boost in daily positivity and engagement.</p>
                </div>
              </div>
              <div className="mt-12">
                <Link to="/signup" className="inline-flex bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-6 py-3 font-bold transition-colors items-center gap-2">
                  👉 Join the circle
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customers Section */}
      <section className="py-32 bg-[#D9C5B2] w-full min-h-screen flex items-center justify-center">
        <div className="w-full text-center max-w-5xl mx-auto px-6">
          <div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-gray-900 leading-tight mb-8">
            Connection,yes <br />
              but with a purpose!
            </h1>
            
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 bg-[#FF6BC7] w-full min-h-screen flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <h2 className="text-4xl md:text-6xl font-black mb-12">
              Track how your confidence <br/>
              and positivity evolve through small acts of engagement and care.<br />
                
              </h2>
              <div className="space-y-8">
                {/*<div>
                  <div className="text-6xl font-black">+2.5</div>
                  <p className="text-xl mt-2">million euros donated to causes every year.</p>
                </div>
                <div>
                  <div className="text-6xl font-black">2000</div>
                  <p className="text-xl mt-2">tons of CO2 avoided.</p>
                </div>*/}
              </div>
              <div className="mt-12 space-y-8">
                <button className="bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  find out more <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1561617587-10669801773a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZnJlZSUyMHdvbWVufGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900"
                alt="Women making impact"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Daily Sport Section */}
      <section className="py-32 bg-[#D4FF5C] w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <img
                src="https://images.unsplash.com/photo-1594381898411-846e7d193883?w=800&h=600&fit=crop"
                alt="Women exercising together"
                className="rounded-3xl shadow-2xl"
              />
            </div>
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-12 text-gray-900">
                Cohesion is,<br />
                <span className="text-[#FF6BC7]">a daily sport.</span>
              </h2>
              <div>
                <div className="text-6xl font-black text-gray-900">78%</div>
                <p className="text-xl mt-2 text-gray-900">users challenge themselves on a daily basis thanks to our app.</p>
              </div>
              <div className="mt-12">
                <button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  find out more <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 bg-gray-900 text-white w-full">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div>
            <div className="text-2xl mb-8">we are</div>
            <h2 className="text-6xl md:text-7xl font-black mb-8">
              <span className="text-[#FF6BC7]">squad</span>easy.
            </h2>
            <p className="text-xl leading-relaxed mb-12">
              Our mission? To help companies once again become places where team spirit flourishes, thanks to the employees themselves. Because between us, there's no better way than if it comes from them.
            </p>
            <button className="bg-[#FF6BC7] text-white hover:bg-[#ff5bb7] rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2 mx-auto">
              we get to know each other? <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Marquee */}
      <section className="py-20 overflow-hidden bg-[#D9C5B2] w-full">
        <div className="max-w-7xl mx-auto px-6 text-center mb-12">
          <div className="text-7xl font-black text-gray-900">2.5</div>
          <h2 className="text-4xl font-black text-gray-900 mt-4">million employees addicted</h2>
          <p className="text-2xl font-bold mt-8">engage them all</p>
        </div>
        <div className="relative w-full">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex">
                <div className="mx-8 text-2xl font-bold text-gray-900">A social app</div>
                <div className="mx-8 text-2xl font-bold text-gray-900">Measure your impact</div>
                <div className="mx-8 text-2xl font-bold text-gray-900">Move for your health</div>
                <div className="mx-8 text-2xl font-bold text-gray-900">The strength of teams</div>
                <div className="mx-8 text-2xl font-bold text-gray-900">support a cause</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Features */}
      <section className="py-32 bg-white w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-20">
            <div className="space-y-8">
              <div>
                <h3 className="text-3xl font-black mb-4 text-gray-900">A social app</h3>
                <p className="text-lg text-gray-600">Let's get SquadEasy? The social wall, comments, chat and various boosts make it a community space for your employees.</p>
              </div>
              <div>
                <h3 className="text-3xl font-black mb-4 text-gray-900">Measure your impact</h3>
                <p className="text-lg text-gray-600">A step counter and CO2 calculator let you see your impact in real time. All good things for the team.</p>
              </div>
              <div>
                <h3 className="text-3xl font-black mb-4 text-gray-900">Move for your health</h3>
                <p className="text-lg text-gray-600">Our multimodal tracker, integrated into the SquadEasy app, gets every floor of your company moving.</p>
              </div>
            </div>
            <div>
              <img src="https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&h=1000&fit=crop" alt="Woman using app" className="rounded-3xl shadow-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="py-20 bg-gray-900 w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <div>
              <div className="text-xl font-bold mb-2">App store</div>
              <div className="text-4xl font-black text-[#D4FF5C]">4.7/5</div>
            </div>
            <div>
              <div className="text-xl font-bold mb-2">google play</div>
              <div className="text-4xl font-black text-[#D4FF5C]">4.5/5</div>
            </div>
            <div className="col-span-2">
              <div className="text-sm font-bold mb-2">THE MOST INNOVATIVE SOLUTION FOR HR</div>
              <div className="text-2xl font-black text-[#FF6BC7]">VIVATECH 2023</div>
            </div>
          </div>
        </div>
      </section>

      {/* Employee CTA */}
      <section className="py-32 bg-[#FF6BC7] w-full">
        <div className="max-w-4xl mx-auto px-6 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-black mb-8">
            EMPLOYEES, IT'S EASY TO GET YOUR COMPANY INVOLVED.
          </h2>
          <p className="text-xl mb-12">
            Become an ambassador for your HR team and get SquadEasy adopted by your company. Challenge accepted?
          </p>
          <div className="flex justify-center">
            <button className="bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-8 py-4 text-lg font-bold transition-colors flex items-center gap-2">
              learn more <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Customization */}
      <section className="py-32 bg-white w-full">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black mb-8 text-gray-900">
            squadeasy with your colours
          </h2>
          <p className="text-xl mb-12 text-gray-600">
            Customise the application with your brand's colours.
          </p>
          <div>
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=600&fit=crop" alt="Team working together" className="rounded-3xl shadow-2xl mb-12" />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 bg-[#D9C5B2] w-full">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-gray-900">
            Ready to make a lasting commitment to your teams with Squadeasy? It's so easy!
          </h2>
          <div className="flex justify-center">
            <button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-8 py-4 text-lg font-bold transition-colors flex items-center gap-2">
              learn more <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 w-full">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="text-3xl font-bold mb-4">
            squad<span className="block text-sm -mt-2">easy</span>
          </div>
          <p className="text-gray-400">© 2024 SquadEasy. All rights reserved.</p>
        </div>
      </footer>

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  );
}
