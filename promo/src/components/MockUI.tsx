// Rough, drawn stand-ins for the app's UI, used until the real footage is
// recorded (see FootageSlot). Light theme, the site's fonts.
import React from 'react';
import { COLOR, FONT } from '../brand';
import { LogoMark } from './LogoMark';

export const UI = {
  bg: '#f7f4ee',
  card: '#ffffff',
  line: '#e4ddd0',
  text: '#1d2333',
  dim: '#6b7183',
  primary: '#e8912a',
};

export const STEPS = ['Location', 'Weather', 'Colors', 'Preview'];

export const AppChrome: React.FC<{
  step?: number;
  children: React.ReactNode;
  title?: string;
}> = ({ step, children, title }) => (
  <div
    style={{
      position: 'absolute',
      inset: 0,
      background: UI.bg,
      fontFamily: FONT.body,
      color: UI.text,
    }}
  >
    <div
      style={{
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '0 22px',
        borderBottom: `1px solid ${UI.line}`,
        background: UI.card,
      }}
    >
      <LogoMark size={28} />
      <div style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 20 }}>
        {title ?? 'Temperature Blanket'}
      </div>
      {step !== undefined && (
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              style={{
                padding: '6px 14px',
                borderRadius: 99,
                fontSize: 15,
                fontWeight: 600,
                background: i === step ? UI.primary : 'transparent',
                color: i === step ? '#fff' : UI.dim,
              }}
            >
              {i + 1}. {s}
            </div>
          ))}
        </div>
      )}
    </div>
    <div
      style={{ position: 'absolute', top: 56, left: 0, right: 0, bottom: 0 }}
    >
      {children}
    </div>
  </div>
);

export const Field: React.FC<{
  label: string;
  value: string;
  caret?: boolean;
  width?: number | string;
  style?: React.CSSProperties;
}> = ({ label, value, caret, width = '100%', style }) => (
  <div style={{ width, ...style }}>
    <div
      style={{ fontSize: 14, fontWeight: 600, color: UI.dim, marginBottom: 6 }}
    >
      {label}
    </div>
    <div
      style={{
        height: 46,
        borderRadius: 10,
        border: `1.5px solid ${caret ? UI.primary : UI.line}`,
        background: UI.card,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        fontSize: 19,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}
    >
      {value}
      {caret && <span style={{ color: UI.primary, marginLeft: 1 }}>|</span>}
    </div>
  </div>
);

export const Button: React.FC<{
  children: React.ReactNode;
  primary?: boolean;
  press?: number;
  style?: React.CSSProperties;
}> = ({ children, primary, press = 1, style }) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: 46,
      padding: '0 22px',
      borderRadius: 99,
      fontWeight: 600,
      fontSize: 18,
      background: primary ? UI.primary : UI.card,
      color: primary ? '#fff' : UI.text,
      border: primary ? 'none' : `1.5px solid ${UI.line}`,
      transform: `scale(${press})`,
      ...style,
    }}
  >
    {children}
  </div>
);

/** A floating "lifted" panel: the piece of UI the camera picks out */
export const LiftCard: React.FC<{
  t: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ t, children, style }) => (
  <div
    style={{
      position: 'absolute',
      borderRadius: 16,
      background: UI.card,
      fontFamily: FONT.body,
      color: UI.text,
      padding: 14,
      boxShadow: `0 ${30 * t}px ${70 * t}px rgba(0,0,0,${0.45 * t}), 0 0 0 ${3 * t}px ${COLOR.amber}`,
      transform: `translateZ(${t * 140}px) scale(${1 + t * 0.12})`,
      opacity: t > 0.01 ? 1 : 0,
      ...style,
    }}
  >
    {children}
  </div>
);

/** The Ravelry secondary mark ("Lumpy"), the exact path from RavelryMark.svelte; never recolor beyond black/white */
export const RavelryLumpy: React.FC<{ size: number; white?: boolean }> = ({
  size,
  white,
}) => (
  <svg width={size} height={(size * 78) / 79} viewBox="0 0 79 78" aria-hidden>
    <path
      fill={white ? '#ffffff' : '#000000'}
      d="M78.8089027,35.4127739 C78.6128803,33.7394815 78.5330923,32.0425661 78.2011347,30.3968337 C77.7982544,28.3977414 77.2840648,26.4075077 76.6398504,24.4733785 C75.5139526,21.0923434 73.8699252,17.9583651 71.6299501,15.1679039 C70.6596883,13.9591962 69.6766209,12.745567 68.5763342,11.6579269 C66.281197,9.3901235 63.7230549,7.44713568 60.9314589,5.81321482 C58.0226434,4.11039368 54.9709975,2.73041956 51.7272693,1.8209359 C49.9394264,1.31993245 48.1131671,0.941965219 46.2888778,0.588605226 C45.188591,0.375998656 44.0577681,0.318909855 42.9417207,0.187015038 C42.8904988,0.1811093 42.844202,0.128941947 42.7959352,0.0974446778 C41.0494638,0.0984289675 39.3029925,0.0984289675 37.5565212,0.0984289675 C37.1654613,0.161423507 36.7763716,0.248040998 36.3823566,0.284459716 C34.4861596,0.460647568 32.6451247,0.895703604 30.8237905,1.43312577 C28.5818454,2.09358414 26.4403741,3.00208351 24.3708105,4.0798807 C22.2027431,5.20984525 20.1499252,6.5297777 18.1916708,7.98947929 C17.1908728,8.73557087 16.2009102,9.5043011 15.2749751,10.3389787 C13.6240524,11.8291933 11.9691895,13.3223608 10.4187406,14.9139572 C8.32455112,17.0646301 6.51897756,19.4525168 4.9586783,22.0264343 C3.57568579,24.3090021 2.43993766,26.6988574 1.63319202,29.2432462 C1.05103491,31.0809151 0.63042394,32.9500812 0.385149626,34.8684617 C0.140860349,36.7819209 0.036446384,38.7012857 0.13298005,40.6176977 C0.243304239,42.7978994 0.445236908,44.971211 0.851072319,47.1297582 C1.41352868,50.1210145 2.29316708,52.9941561 3.56583541,55.7550886 C4.6188404,58.0376564 5.93485037,60.1519106 7.46067332,62.1519872 C8.74023691,63.8282326 10.1892269,65.3440387 11.7377057,66.7505886 C13.8141646,68.6364876 16.088616,70.2723771 18.5177182,71.7005814 C21.3979676,73.3945439 24.4210474,74.744005 27.5889277,75.7912893 C29.7441895,76.503915 31.9496883,77.0118085 34.1837531,77.3828857 C35.1687905,77.5462778 36.1754988,77.5856493 37.1713716,77.6860469 C37.2383541,77.6929369 37.3004115,77.7460886 37.3644389,77.7766015 C39.1109102,77.7766015 40.8573815,77.7766015 42.6038529,77.7766015 C43.0106733,77.713607 43.4155237,77.6250209 43.8252993,77.5915551 C46.4760349,77.3759956 49.0351621,76.728333 51.5312469,75.8572367 C54.3228429,74.8818056 57.0001746,73.6356949 59.4745885,72.0027583 C61.0565586,70.9594112 62.621783,69.8865355 64.1377556,68.7506652 C65.0764963,68.0468981 65.9206733,67.2132047 66.7835661,66.4110087 C67.4267955,65.8125605 68.0434289,65.1845837 68.651197,64.5497169 C70.6094514,62.4994415 72.2997756,60.2444338 73.7507357,57.8112698 C75.2992145,55.2147136 76.5669576,52.4862626 77.3697631,49.5698123 C77.8337157,47.8847084 78.1725686,46.16417 78.5084663,44.4475689 C78.6759227,43.5932054 78.711384,42.7122662 78.8118579,41.8441227 C78.8177681,41.7929396 78.8699751,41.746678 78.9014963,41.6984478 C78.9014963,39.6993555 78.9014963,37.7002631 78.9014963,35.7011708 C78.8699751,35.6047104 78.8207232,35.5112029 78.8089027,35.4127739 Z M52.6650249,35.2267432 C52.6650249,35.2267432 49.9758728,34.7444412 48.0451995,34.7444412 C43.6322319,34.7444412 42.5979426,37.1559509 42.5979426,40.7387654 L42.5979426,55.8968264 L30.6691397,55.8968264 L30.6691397,25.0295021 L42.5979426,25.0295021 L42.5979426,30.1970229 C44.0459476,25.8563055 46.9419576,24.3404994 52.6650249,24.3404994 L52.6650249,35.2267432 L52.6650249,35.2267432 Z"
    />
  </svg>
);
