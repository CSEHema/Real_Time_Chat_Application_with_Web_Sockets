import React from 'react';

const Profilepic = ({ name, online }) => {
  // Get first letter and capitalize
  const firstLetter = name ? name[0].toUpperCase() : "?";

  return (
    <div className="relative inline-block">
      {/* Circle Avatar */}
      {/* Replaced bg-indigo-600 with vibrantpurple */}
      {/* Replaced border-white with border-deepdark to prevent "gaps" in dark mode */}
      <div className="w-12 h-12 rounded-full bg-vibrantpurple flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 border-deepdark">
        {firstLetter}
      </div>

      {/* The Online Status Indicator */}
      {online && (
        <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-7 h-1.5 bg-green-500 rounded-full border border-deepdark "></div>
      )}
    </div>
  );
};

export default Profilepic;