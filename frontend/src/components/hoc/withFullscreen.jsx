import React, { useState, useCallback } from 'react';
import Lightbox from '../ui/Lightbox';
import FullscreenButton from '../ui/FullscreenButton';

const withFullscreen = (WrappedChart) => {
  return function FullscreenChart(props) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);

    const handleFullscreenClick = useCallback(() => {
      setIsLightboxOpen(true);
    }, []);

    const handleCloseLightbox = useCallback(() => {
      setIsLightboxOpen(false);
    }, []);

    return (
      <>
        <div>
          <WrappedChart {...props} isFullscreen={false} fullscreenButton={<FullscreenButton onClick={handleFullscreenClick} />} />
        </div>

        <Lightbox isOpen={isLightboxOpen} onClose={handleCloseLightbox}>
          <div className="h-full">
            <WrappedChart {...props} isFullscreen={true} />
          </div>
        </Lightbox>
      </>
    );
  };
};

export default withFullscreen;
