import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CompletionPreview } from './CompletionPreview';
import './ReplayControl.css';

export function GentlePulse() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="completion-motion-frame">
      <CompletionPreview key={replayKey} motion="pulse" />
      <button
        type="button"
        className="completion-motion-replay"
        onClick={() => setReplayKey((current) => current + 1)}
        aria-label="Replay the gentle pulse animation"
      >
        <RotateCcw size={15} />
        Replay pulse
      </button>
    </div>
  );
}