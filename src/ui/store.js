import { create } from 'zustand';
import { engine } from '../game/engine.js';
import { honk, siren } from './sound.js';
import { speak, isSpeechOn } from './speech.js';

export const useGame = create(() => ({
  levelIdx: 0,
  levelVersion: 0,
  stars: 3,
  toast: null,
  overlay: 'intro',
  win: null,
  speechOn: isSpeechOn()
}));

let toastId = 0;
engine.on((type, p) => {
  if (type === 'level') useGame.setState({ levelIdx: p.idx, levelVersion: engine.levelVersion, overlay: 'intro', win: null, toast: null, holding: false });
  if (type === 'stars') useGame.setState({ stars: p });
  if (type === 'toast') {
    useGame.setState({ toast: { ...p, id: ++toastId } });
    speak(p.text);
  }
  if (type === 'win') useGame.setState({ overlay: 'win', win: p, toast: null });
  if (type === 'honk') honk();
  if (type === 'hold') useGame.setState({ holding: p });
  if (type === 'eventStart' && p === 'ambulance') siren(5);
  if (type === 'eventAsk') useGame.setState({ overlay: 'event', eventId: p, toast: null });
});

engine.load(0);
useGame.setState({ overlay: 'menu', menuFrom: null });
