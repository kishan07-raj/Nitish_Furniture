 import { useEffect, useRef, useState } from 'react';

const ParallaxSection = ({
  children,
  speed = 0.5,
  className = '',
  containerClassName = '',
  ...props
}) => {
  const [offsetY, setOffsetY] = useState(0);
  const ref = useRef();

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const elementTop = rect.top + scrollTop;
        const distance = scrollTop - elementTop;
        setOffsetY(distance * speed);
      }
    };

    const throttledScroll = () => {
      requestAnimationFrame(handleScroll);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [speed]);

  return (
    <div
      ref={ref}
      className={`parallax-container ${containerClassName}`}
      {...props}
    >
      <div
        className={`parallax-element ${className}`}
        style={{
          transform: `translateY(${offsetY}px)`,
          willChange: 'transform'
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default ParallaxSection;
