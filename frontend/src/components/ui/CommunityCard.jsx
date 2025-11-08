"use client";
import React from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { GlowingEffect } from "./glowing-effect.jsx"; // adjust path if needed

const CommunityCard = ({
  tags = [],
  image,
  communityName,
  description,
  memberCount,
  bgColor = "bg-blue-300",
  imageAlt = "Community image",
  onJoinClick,
}) => {
  // Convert "HEALTH & WELLNESS" → "health-and-wellness"
  const slugify = (text) =>
    text.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");

  const communitySlug = slugify(communityName);

  return (
    <div className="relative group">
      {/* Glowing border layer */}
      <GlowingEffect spread={60} glow={true} disabled={false} proximity={80} />

      {/* Card container */}
      <Link
        to={`/communities/${communitySlug}`}
        className={`${bgColor} relative rounded-2xl overflow-hidden shadow-lg flex flex-col w-[320px] h-[520px] transition-all duration-300 transform 
        hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(0,0,0,0.15)] hover:ring-2 hover:ring-purple-400/50 cursor-pointer`}
      >
        {/* Tags */}
        <div className="p-6 pb-4">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white/40 backdrop-blur-sm border border-black rounded-full text-sm font-semibold uppercase"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Image Section with Polygon Shape */}
        <div className="px-6 flex justify-center items-center my-6">
          {image ? (
            <div className="relative w-72 h-60 overflow-hidden">
              <img
                src={image}
                alt={imageAlt}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                style={{
                  clipPath: "polygon(8% 0%, 100% 5%, 92% 100%, 0% 95%)",
                }}
              />
            </div>
          ) : (
            <div className="w-72 h-60 bg-white/30 rounded-lg shadow-md flex items-center justify-center">
              <span className="text-gray-500 text-sm">Image placeholder</span>
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="p-6 pt-2 flex flex-col justify-between h-full">
          <div>
            <h2 className="text-2xl font-black leading-tight mb-3 uppercase">
              {communityName}
            </h2>
            <div className="flex items-start gap-2 mb-4">
              <span className="text-yellow-400 text-lg mt-0.5">→</span>
              <p className="text-sm font-medium leading-snug">{description}</p>
            </div>
          </div>

          {memberCount && (
            <p className="text-xs font-semibold mb-4 opacity-80">
              {memberCount} members
            </p>
          )}

          {/* Join Button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onJoinClick) onJoinClick();
            }}
            className="group inline-flex items-center gap-2 border-b-2 border-black pb-1 font-bold text-sm hover:gap-3 transition-all"
          >
            JOIN COMMUNITY
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </Link>
    </div>
  );
};

export default CommunityCard;
