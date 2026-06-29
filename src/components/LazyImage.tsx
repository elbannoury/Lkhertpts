import React, { useEffect, useRef, useState } from 'react';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  /** extra classes for the outer wrapper */
  wrapperClassName?: string;
}

/**
 * PITSIKY custom lazy-loading image.
 * - Only loads the real image once it scrolls near the viewport (IntersectionObserver)
 * - Shows a shimmering placeholder + bobbing deer loader while decoding
 * - Fades + zooms the image in once decoded for a premium feel
 */
const LazyImage: React.FC<Props> = ({ src, alt = '', className = '', wrapperClassName = '', ...rest }) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') { setVisible(true); return; }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setVisible(true); io.disconnect(); }
        });
      },
      { rootMargin: '300px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className={`pk-img-wrap ${!loaded ? 'shimmering' : ''} ${wrapperClassName}`}>
      {!loaded && (
        <div className="pk-loader" aria-hidden>
          <span>🦌</span>
        </div>
      )}
      {visible && (
        <img
          src={src}
          alt={alt}
          decoding="async"
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`pk-img ${loaded ? 'loaded' : ''} ${className}`}
          {...rest}
        />
      )}
    </div>
  );
};

export default LazyImage;
