import React, { useState } from 'react';

interface AssetThumbnailProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt?: string;
  className?: string;
  containerClassName?: string;
  skeleton?: boolean;
}

export const AssetThumbnail: React.FC<AssetThumbnailProps> = ({
  src,
  alt = '',
  className = '',
  containerClassName = 'w-full h-full',
  skeleton = true,
  onLoad,
  ...props
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className={`relative overflow-hidden ${containerClassName}`}>
      {!loaded && skeleton && <div className="absolute inset-0 bg-surface-dark-3 animate-pulse pointer-events-none" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        className={`transition-opacity duration-200 ease-out animate-fade-in-tile ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${className}`}
        {...props}
      />
    </div>
  );
};
