import React from 'react';

const testimonials = [
  {
    name: "Sarah Johnson",
    username: "@sarahj_wellness",
    avatar: "/avatars/sarah.jpg",
    content: "NoMan changed my life! I found my tribe and finally feel supported. This community is everything! 💪",
    verified: true
  },
  {
    name: "Maria Garcia",
    username: "@maria_creates",
    avatar: "/avatars/maria.jpg",
    content: "The collaboration features are incredible! I've partnered with amazing women and grown my business. 🚀"
  },
  {
    name: "Emma Wilson",
    username: "@emmafitness",
    avatar: "/avatars/emma.jpg",
    content: "I love how supportive everyone is here! The communities are so uplifting. Best decision ever! ❤️",
    verified: true
  },
  {
    name: "Priya Patel",
    username: "@priya_artist",
    avatar: "/avatars/priya.jpg",
    content: "Finally, a space where I can be myself! The creative community here is amazing. NoMan is pure magic! ✨"
  },
  {
    name: "Jessica Lee",
    username: "@jesstech",
    avatar: "/avatars/jessica.jpg",
    content: "The mentorship program is outstanding! I've learned so much and connected with inspiring women in tech. 🎯",
    verified: true
  },
  {
    name: "Sophia Chen",
    username: "@sophiawellness",
    avatar: "/avatars/sophia.jpg",
    content: "NoMan helped me build my brand and reach thousands of women! The engagement is real. Forever grateful! 🌟"
  },
  {
    name: "Aisha Rahman",
    username: "@aisha_inspires",
    avatar: "/avatars/aisha.jpg",
    content: "This platform empowers me every single day. The support system here is unmatched! 💖",
    verified: true
  },
  {
    name: "Olivia Brown",
    username: "@olivia_entrepreneur",
    avatar: "/avatars/olivia.jpg",
    content: "From courses to communities, everything I need to grow is here. NoMan is a game-changer! 🔥"
  },
  {
    name: "Zara Khan",
    username: "@zara_creative",
    avatar: "/avatars/zara.jpg",
    content: "The most authentic and empowering community I've ever been part of. Thank you NoMan! 🙏",
    verified: true
  },
  {
    name: "Isabella Martinez",
    username: "@bella_coach",
    avatar: "/avatars/isabella.jpg",
    content: "My confidence has skyrocketed since joining! The women here lift each other up daily. 💫",
    verified: true
  }
];

export default function Testimonials() {
  return (
    <section className="testimonials-section">
      <div className="testimonials-container">
        {/* Vertical Marquee Columns */}
        <div className="testimonials-marquee-wrapper">
          {/* Top gradient fade */}
          <div className="testimonials-fade-top"></div>
          
          {/* Bottom gradient fade */}
          <div className="testimonials-fade-bottom"></div>
          
          <div className="testimonials-grid">
            {/* Column 1 - moves up slowly */}
            <div className="testimonials-column testimonials-column-up">
              {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                <Card key={`c1-${i}`} t={t} />
              ))}
            </div>

            {/* Column 2 - moves down medium speed */}
            <div className="testimonials-column testimonials-column-down">
              {[...testimonials.slice(3), ...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                <Card key={`c2-${i}`} t={t} />
              ))}
            </div>

            {/* Column 3 - moves up fast */}
            <div className="testimonials-column testimonials-column-up-fast">
              {[...testimonials.slice(6), ...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                <Card key={`c3-${i}`} t={t} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Card({ t }) {
  return (
    <div className="testimonial-card">
      <div className="testimonial-header">
        <div className="testimonial-avatar">
          <div className="testimonial-avatar-placeholder"></div>
        </div>
        
        <div className="testimonial-info">
          <div className="testimonial-name-row">
            <h3 className="testimonial-name">{t.name}</h3>
            {t.verified && (
              <svg className="testimonial-verified-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8.52 3.59c.8-.5 1.9-.5 2.68 0l1.9 1.2c.4.2.9.4 1.4.4h2.2c1 0 1.8.8 1.8 1.8v2.2c0 .5.1 1 .4 1.4l1.2 1.9c.5.8.5 1.9 0 2.68l-1.2 1.9c-.2.4-.4.9-.4 1.4v2.2c0 1-.8 1.8-1.8 1.8h-2.2c-.5 0-1 .1-1.4.4l-1.9 1.2c-.8.5-1.9.5-2.68 0l-1.9-1.2c-.4-.2-.9-.4-1.4-.4H4.8c-1 0-1.8-.8-1.8-1.8v-2.2c0-.5-.1-1-.4-1.4l-1.2-1.9c-.5-.8-.5-1.9 0-2.68l1.2-1.9c.2-.4.4-.9.4-1.4V4.8c0-1 .8-1.8 1.8-1.8h2.2c.5 0 1-.1 1.4-.4l1.9-1.2zM16.7 9.3c.4.4.4 1 0 1.4l-5 5c-.4.4-1 .4-1.4 0l-2-2c-.4-.4-.4-1 0-1.4.4-.4 1-.4 1.4 0l1.3 1.3 4.3-4.3c.4-.4 1-.4 1.4 0z" />
              </svg>
            )}
          </div>
          <p className="testimonial-username">{t.username}</p>
        </div>
      </div>
      
      <p className="testimonial-content">{t.content}</p>
    </div>
  );
}
