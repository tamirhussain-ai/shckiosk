import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CompletionPreview } from './CompletionPreview';
import './ReplayControl.css';

export function SoftGlow() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="completion-motion-frame">
      <CompletionPreview key={replayKey} motion="glow" />
      <button
        type="button"
        className="completion-motion-replay"
        onClick={() => setReplayKey((current) => current + 1)}
        aria-label="Replay the soft crimson glow animation"
      >
        <RotateCcw size={15} />
        Replay glow
      </button>
    </div>
  );
}