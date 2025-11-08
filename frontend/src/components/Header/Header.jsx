import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';

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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute top-32 left-12 w-40 h-48 bg-white rounded-3xl shadow-xl overflow-hidden transform -rotate-6"
          style={{ transform: `translateY(${scrollY * 0.2}px) rotate(-6deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop" alt="Team member" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute top-64 left-48 w-48 h-56 bg-white rounded-3xl shadow-xl overflow-hidden transform rotate-3"
          style={{ transform: `translateY(${scrollY * 0.15}px) rotate(3deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=300&h=400&fit=crop" alt="Team member" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="absolute top-20 right-12 w-44 h-52 bg-white rounded-3xl shadow-xl overflow-hidden transform rotate-6"
          style={{ transform: `translateY(${scrollY * 0.25}px) rotate(6deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=300&h=400&fit=crop" alt="Team member" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-32 left-24 w-36 h-44 bg-white rounded-3xl shadow-xl overflow-hidden transform rotate-12"
          style={{ transform: `translateY(${scrollY * 0.1}px) rotate(12deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&h=400&fit=crop" alt="Team member" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="absolute bottom-48 right-32 w-52 h-60 bg-white rounded-3xl shadow-xl overflow-hidden transform -rotate-3"
          style={{ transform: `translateY(${scrollY * 0.18}px) rotate(-3deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1595152772835-219674b2a8a6?w=300&h=400&fit=crop" alt="Team member" className="w-full h-full object-cover" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="absolute bottom-24 right-12 w-40 h-48 bg-white rounded-3xl shadow-xl overflow-hidden transform rotate-6"
          style={{ transform: `translateY(${scrollY * 0.12}px) rotate(6deg)` }}
        >
          <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=300&h=400&fit=crop" alt="Team member" className="w-full h-full object-cover" />
        </motion.div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight"
          >
            <span className="text-gray-900">YOU'VE NEVER</span><br />
            <span className="text-gray-900">BEEN SO</span><br />
            <span className="text-gray-900">CLOSE TO BRINGING</span><br />
            <span className="text-[#FF6BC7]">YOUR EMPLOYEES</span><br />
            <span className="text-[#FF6BC7]">CLOSER TOGETHER.</span>
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12"
          >
            <button className="bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-8 py-6 text-lg font-bold shadow-lg transition-colors">
              REQUEST A DEMO
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-16"
          >
            <button onClick={scrollToNext} className="text-[#FF6BC7] animate-bounce">
              <ChevronDown className="w-8 h-8" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-32 px-6 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.img
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop"
                alt="Team collaboration"
                className="rounded-3xl shadow-2xl"
              />
            </div>
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl font-black mb-12"
              >
                Employees' favourite,<br />
                <span className="text-[#D4FF5C]">team-building app.</span>
              </motion.h2>
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-6xl font-black text-[#D4FF5C]">87%</div>
                  <p className="text-xl mt-2">of users feel better in their company.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-6xl font-black text-[#FF6BC7]">+15%</div>
                  <p className="text-xl mt-2">productivity gains per user.</p>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <button className="bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  find out more <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Customers Section */}
      <section className="py-32 px-6 bg-[#D9C5B2]">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-xl mb-4">more than</div>
            <div className="text-8xl font-black text-gray-900">300</div>
            <div className="text-2xl mt-4">loyal customers worldwide.</div>
          </motion.div>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-3xl md:text-4xl font-bold mt-16 mb-12"
          >
            That's what makes them close-knit teams.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-8 py-4 text-lg font-bold transition-colors">
              DISCOVER OUR CUSTOMER TESTIMONIALS
            </button>
          </motion.div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-32 px-6 bg-[#FF6BC7]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="text-white">
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-black mb-12"
              >
                cohesion,<br />
                yes, but not for nothing!
              </motion.h2>
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="text-6xl font-black">+2.5</div>
                  <p className="text-xl mt-2">million euros donated to causes every year.</p>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-6xl font-black">2000</div>
                  <p className="text-xl mt-2">tons of CO2 avoided.</p>
                </motion.div>
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="mt-12"
              >
                <button className="bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  find out more <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
            <div>
              <motion.img
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                src="https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&h=600&fit=crop"
                alt="Impact"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Daily Sport Section */}
      <section className="py-32 px-6 bg-[#D4FF5C]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <motion.img
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop"
                alt="Daily activity"
                className="rounded-3xl shadow-2xl"
              />
            </div>
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-4xl md:text-6xl font-black mb-12 text-gray-900"
              >
                Cohesion is,<br />
                <span className="text-[#FF6BC7]">a daily sport.</span>
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-6xl font-black text-gray-900">78%</div>
                <p className="text-xl mt-2 text-gray-900">users challenge themselves on a daily basis thanks to our app.</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="mt-12"
              >
                <button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2">
                  find out more <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-32 px-6 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="text-2xl mb-8">we are</div>
            <h2 className="text-6xl md:text-7xl font-black mb-8">
              <span className="text-[#FF6BC7]">squad</span>easy.
            </h2>
            <p className="text-xl leading-relaxed mb-12">
              Our mission? To help companies once again become places where team spirit flourishes, thanks to the employees themselves. Because between us, there's no better way than if it comes from them.
            </p>
            <button className="bg-[#FF6BC7] text-white hover:bg-[#ff5bb7] rounded-full px-6 py-3 font-bold transition-colors flex items-center gap-2">
              we get to know each other? <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features Marquee */}
      <section className="py-20 overflow-hidden bg-[#D9C5B2]">
        <div className="text-center mb-12">
          <div className="text-7xl font-black text-gray-900">2.5</div>
          <h2 className="text-4xl font-black text-gray-900 mt-4">million employees addicted</h2>
          <p className="text-2xl font-bold mt-8">engage them all</p>
        </div>
        <div className="relative">
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
      <section className="py-32 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-20">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
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
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img src="https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=1000&fit=crop" alt="App interface" className="rounded-3xl shadow-2xl" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Awards */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <div className="text-xl font-bold mb-2">App store</div>
              <div className="text-4xl font-black text-[#D4FF5C]">4.7/5</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <div className="text-xl font-bold mb-2">google play</div>
              <div className="text-4xl font-black text-[#D4FF5C]">4.5/5</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="col-span-2"
            >
              <div className="text-sm font-bold mb-2">THE MOST INNOVATIVE SOLUTION FOR HR</div>
              <div className="text-2xl font-black text-[#FF6BC7]">VIVATECH 2023</div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Employee CTA */}
      <section className="py-32 px-6 bg-[#FF6BC7]">
        <div className="max-w-4xl mx-auto text-center text-white">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-8"
          >
            EMPLOYEES, IT'S EASY TO GET YOUR COMPANY INVOLVED.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-12"
          >
            Become an ambassador for your HR team and get SquadEasy adopted by your company. Challenge accepted?
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <button className="bg-[#D4FF5C] text-gray-900 hover:bg-[#c4ef4c] rounded-full px-8 py-4 text-lg font-bold transition-colors flex items-center gap-2">
              learn more <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Customization */}
      <section className="py-32 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-black mb-8 text-gray-900"
          >
            squadeasy with your colours
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-xl mb-12 text-gray-600"
          >
            Customise the application with your brand's colours.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <img src="https://images.unsplash.com/photo-1551650975-87deedd944c3?w=1200&h=600&fit=crop" alt="Customization" className="rounded-3xl shadow-2xl mb-12" />
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 bg-[#D9C5B2]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-black mb-12 text-gray-900"
          >
            Ready to make a lasting commitment to your teams with Squadeasy? It's so easy!
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <button className="bg-zinc-900 text-white hover:bg-zinc-800 rounded-full px-8 py-4 text-lg font-bold transition-colors flex items-center gap-2">
              learn more <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto text-center">
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
