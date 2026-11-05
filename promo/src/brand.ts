// The site's look, from src/css/main.css, classic-theme.css and AppLogo.svelte
import { loadFont as loadFraunces } from '@remotion/google-fonts/Fraunces';
import { loadFont as loadVietnam } from '@remotion/google-fonts/BeVietnamPro';

const fraunces = loadFraunces('normal', {
  weights: ['400', '600', '700'],
  subsets: ['latin'],
});
loadFraunces('italic', { weights: ['400', '600'], subsets: ['latin'] });
const vietnam = loadVietnam('normal', {
  weights: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

export const FONT = {
  display: fraunces.fontFamily, // headings: Fraunces
  body: vietnam.fontFamily, // text: Be Vietnam Pro
};

export const COLOR = {
  ink: '#0c1322', // ~surface-950, a touch deeper for video
  ink2: '#16203a',
  ink3: '#222f52',
  cream: '#f7f1e6',
  creamDim: 'rgba(247,241,230,0.62)',
  amber: '#f2a43a', // primary-500
  amberSoft: '#f7c97a',
  blue: '#3b7ba3', // secondary-400
};

// The logo's four stripes (yarn colorways from the year's most popular project)
export const LOGO_STRIPES = ['#e77e79', '#f3d488', '#789fb8', '#295d7d'];

export const FPS = 30;
export const W = 1920;
export const H = 1080;
