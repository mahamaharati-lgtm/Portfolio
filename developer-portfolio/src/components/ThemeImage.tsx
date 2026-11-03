import { withBase } from '../lib/url';

interface ThemeImageProps {
  /** Base name in /public/images, e.g. "ws-editor" → ws-editor-light-1600.webp */
  name: string;
  alt: string;
  width: number;
  height: number;
  widths?: [large: number, small: number];
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/** Shows the light or dark screenshot to match the active theme. */
export function ThemeImage({
  name,
  alt,
  width,
  height,
  widths = [1600, 960],
  sizes = '(min-width: 1024px) 66vw, 100vw',
  priority = false,
  className = '',
}: ThemeImageProps) {
  const [large, small] = widths;
  return (
    <>
      {(['light', 'dark'] as const).map((theme) => (
        <img
          key={theme}
          className={`screenshot theme-img--${theme} w-full ${className}`}
          src={withBase(`images/${name}-${theme}-${large}.webp`)}
          srcSet={`${withBase(`images/${name}-${theme}-${small}.webp`)} ${small}w, ${withBase(`images/${name}-${theme}-${large}.webp`)} ${large}w`}
          sizes={sizes}
          width={width}
          height={height}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          {...(priority && theme === 'light' ? { fetchPriority: 'high' as const } : {})}
        />
      ))}
    </>
  );
}
