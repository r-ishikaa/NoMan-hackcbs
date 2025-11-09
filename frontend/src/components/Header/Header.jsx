import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';
import animationVideo from '../../assets/animation.mp4';
import statsVideo from '../../assets/Scene.mp4';
import nomanLogo from '../../assets/noman_logo.jpg';

export default function Home() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const videoRef = useRef(null);
  const statsVideoRef = useRef(null);
  const sectionRef = useRef(null);
  const [sectionTop, setSectionTop] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleVideoPlayback = () => {
      if (!videoRef.current) return;

      const videoRect = videoRef.current.getBoundingClientRect();
      const isInViewport = videoRect.top < window.innerHeight && videoRect.bottom > 0;

      if (isInViewport) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    };

    window.addEventListener('scroll', handleVideoPlayback);
    handleVideoPlayback();

    return () => window.removeEventListener('scroll', handleVideoPlayback);
  }, []);

  useEffect(() => {
    const handleStatsVideoPlayback = () => {
      if (!statsVideoRef.current) return;
      const videoRect = statsVideoRef.current.getBoundingClientRect();
      const isInViewport = videoRect.top < window.innerHeight && videoRect.bottom > 0;
      if (isInViewport) {
        statsVideoRef.current.play();
      } else {
        statsVideoRef.current.pause();
      }
    };
    window.addEventListener('scroll', handleStatsVideoPlayback);
    handleStatsVideoPlayback();
    return () => window.removeEventListener('scroll', handleStatsVideoPlayback);
  }, []);

  const scrollToNext = () => {
    window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
  };
  useEffect(() => {
    if (sectionRef.current) {
      setSectionTop(sectionRef.current.offsetTop);
    }
  }, []);

  const collapseProgress = Math.min(scrollY / (window.innerHeight * 0.5), 1);
  
  const getImageTransform = (startX, startY, imageWidth, imageHeight, baseRotation) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    const imageCenterX = startX + (imageWidth / 2);
    const imageCenterY = startY + (imageHeight / 2);
    
    const moveX = (centerX - imageCenterX) * collapseProgress;
    const moveY = (centerY - imageCenterY) * collapseProgress;
    
    const scale = 1 - collapseProgress;
    const opacity = 1 - collapseProgress;
    const rotation = baseRotation + (collapseProgress * baseRotation * 2);

  
    
    return {
      transform: `translate(${moveX}px, ${moveY}px) scale(${scale}) rotate(${rotation}deg)`,
      opacity: opacity
    };
  };
  const getParallaxOffset = () => {
    const offset = (scrollY - sectionTop) * 0.15;
    return Math.max(-100, Math.min(100, offset));
  };

  return (
    <div className="bg-[#D9C5B2] min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#E8DED3]/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={nomanLogo} alt="NoMan Logo" className="h-10 w-10 rounded-full object-cover" />
              <div className="text-2xl font-bold text-gray-900">NoMan</div>
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
              <video
                ref={statsVideoRef}
                loop
                muted
                playsInline
                className="rounded-3xl shadow-2xl w-full max-w-lg"
              >
                <source src={statsVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
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
            Connection, yes <br />
              but with a purpose!
            </h1>
          </div>
        </div>
      </section>

      {/* Impact Section */}
<section ref={sectionRef} className="py-32 bg-[#FF6BC7] w-full min-h-screen flex items-center">
  <div className="max-w-7xl mx-auto px-6 w-full">
    <div className="grid md:grid-cols-2 gap-16 items-center">
      <div className="text-white">
        <h2 className="text-4xl md:text-6xl font-black mb-12">
          Track how your confidence <br/>
          and positivity evolve through small acts of engagement and care.<br />
        </h2>
        <div className="mt-12 space-y-8">
          <button className="bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2">
            find out more <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div 
        className="relative"
        style={{
          transform: `translateY(${getParallaxOffset()}px)`,
          transition: 'transform 0.1s ease-out'
        }}
      >
        <div className="relative">
          {/* Shadow layer for depth */}
          <div 
            className="absolute inset-0 bg-black/20 rounded-3xl blur-2xl"
            style={{
              transform: `translateY(${getParallaxOffset() * 0.5 + 20}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
          
          {/* Main image */}
          <img
            src="https://images.unsplash.com/photo-1561617587-10669801773a?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8ZnJlZSUyMHdvbWVufGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=900"
            alt="Women making impact"
            className="rounded-3xl shadow-2xl relative z-10"
          />
        </div>
      </div>
    </div>
  </div>
</section>

      {/* Video Animation Section */}
      <section className="py-32 bg-[#D4FF5C] w-full">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative overflow-hidden rounded-3xl shadow-2xl" style={{ height: '600px' }}>
              <video
                ref={videoRef}
                loop
                muted
                playsInline
                className="absolute w-full h-full object-cover"
                style={{
                  objectPosition: 'center center',
                  transform: 'scale(1.3)'
                }}
              >
                <source src={animationVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div>
              <h2 className="text-4xl md:text-6xl font-black mb-12 text-gray-900">
                ALL INTERESTS<br />
                <span className="text-[#FF6BC7]">IN ONE PLACE</span>
              </h2>
              <div>
                <div className="text-6xl font-black text-gray-900">78%</div>
                <p className="text-xl mt-2 text-gray-900">users discover new interests and connect with like-minded women daily.</p>
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
  <div className="max-w-7xl mx-auto px-6">
    <div className="flex justify-end">
      <div className="max-w-3xl text-right">
        <div className="inline-block bg-[#FF6BC7]/10 rounded-full px-6 py-2 mb-8">
          <span className="text-[#FF6BC7] font-semibold">WHO WE ARE</span>
        </div>
        
        <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8">
      We are <span className="text-[#FF6BC7]">No</span><span className="text-blue-400">Man</span>.
        </h2>
        
        <p className="text-xl md:text-2xl leading-relaxed mb-12 text-gray-300">
          A community built by women, for women. Where authentic connections matter, support is genuine, and growth happens together.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-end items-end">
        <div className="mt-12">
            <Link to="/signup" className="inline-block bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-8 py-6 text-lg font-bold shadow-lg transition-colors text-center">
              SIGN UP
            </Link>
          </div>
          {/*<button className="bg-transparent border-2 border-[#D4FF5C] text-[#D4FF5C] hover:bg-[#D4FF5C] hover:text-gray-900 rounded-full px-8 py-4 font-bold transition-colors inline-flex items-center gap-2">
            Our story
          </button>*/}
        </div>
      </div>
    </div>
    
    {/* Mission Statement */}
    <div className="mt-20 grid md:grid-cols-3 gap-8">
      <div className="bg-gray-800/50 rounded-2xl p-8 hover:bg-gray-800 transition-colors text-right">
        <div className="text-4xl mb-4">💪</div>
        <h3 className="text-xl font-bold mb-3 text-[#D4FF5C]">Empower</h3>
        <p className="text-gray-400">Building confidence through authentic connections and shared experiences.</p>
      </div>
      <div className="bg-gray-800/50 rounded-2xl p-8 hover:bg-gray-800 transition-colors text-right">
        <div className="text-4xl mb-4">🤝</div>
        <h3 className="text-xl font-bold mb-3 text-[#FF6BC7]">Connect</h3>
        <p className="text-gray-400">Creating meaningful bonds with like-minded women who uplift each other.</p>
      </div>
      <div className="bg-gray-800/50 rounded-2xl p-8 hover:bg-gray-800 transition-colors text-right">
        <div className="text-4xl mb-4">🌱</div>
        <h3 className="text-xl font-bold mb-3 text-[#D4FF5C]">Grow</h3>
        <p className="text-gray-400">Evolving together through support, inspiration, and collective wisdom.</p>
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
              <div className="text-sm font-bold mb-2">BEST WOMEN'S EMPOWERMENT APP</div>
              <div className="text-2xl font-black text-[#FF6BC7]">2024</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16 w-full border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Logo & Description */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img src={nomanLogo} alt="NoMan Logo" className="h-12 w-12 rounded-full object-cover" />
                <div className="text-3xl font-bold">NoMan</div>
              </div>
              <p className="text-gray-400 leading-relaxed max-w-md">
                Empowering women to connect authentically, support each other genuinely, and grow together meaningfully.
              </p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="bg-gray-800 hover:bg-[#FF6BC7] p-3 rounded-full transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-[#FF6BC7] p-3 rounded-full transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-[#FF6BC7] p-3 rounded-full transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="bg-gray-800 hover:bg-[#FF6BC7] p-3 rounded-full transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold mb-4 text-[#D4FF5C]">Quick Links</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-bold mb-4 text-[#D4FF5C]">Support</h4>
              <ul className="space-y-3">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">© 2024 NoMan. All rights reserved.</p>
            <p className="text-gray-400 text-sm">Made with 💜 for women empowerment</p>
          </div>
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
