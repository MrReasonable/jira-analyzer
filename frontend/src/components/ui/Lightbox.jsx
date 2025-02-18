import React from 'react';
import { createPortal } from 'react-dom';

const Lightbox = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" role="dialog" aria-modal="true">
      <div className="w-[90vw] h-[90vh] bg-white rounded-lg p-4">
        <div className="flex justify-end mb-2">
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-gray-800"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="w-full h-[calc(100%-2.5rem)]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Lightbox;
