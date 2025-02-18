import React from "react";

const FullscreenButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-600 hover:text-gray-800 bg-white rounded-lg shadow-sm hover:shadow transition-all ml-2"
      title="View fullscreen"
    >
      <svg
        id="full_screen_arrow"
        data-name="Full Screen Arrow"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 122.88 113.13"
        className="w-6 h-6"
      >
        <title>full-screen-arrow</title>
        <path d="M86.64,12a6,6,0,1,1,0-12H113.8a6,6,0,0,1,6,6V33.66a6,6,0,1,1-12,0V20.45L84.12,44.23a6,6,0,0,1-8.47-8.42L99.41,12ZM12,36.24a6,6,0,1,1-12,0V9.08a6,6,0,0,1,6-6H33.66a6,6,0,1,1,0,12H20.45l23.77,23.7a6,6,0,1,1-8.41,8.47L12,23.47V36.24Zm24.27,64.92a6,6,0,0,1,0,12H9.08a6,6,0,0,1-6-6V79.47a6,6,0,1,1,12,0V92.68l23.7-23.77a6,6,0,0,1,8.47,8.41L23.47,101.16Zm74.67-24.27a6,6,0,0,1,12,0v27.16a6,6,0,0,1-6,6H89.22a6,6,0,1,1,0-12h13.21L78.65,74.37a6,6,0,0,1,8.42-8.47l23.84,23.76V76.89Z" />
      </svg>{" "}
    </button>
  );
};

export default FullscreenButton;
