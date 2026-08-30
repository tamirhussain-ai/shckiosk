import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { CompletionPreview } from './CompletionPreview';
import './ReplayControl.css';
import './DestinationEmphasis.css';

export function DestinationEmphasis() {
  const [replayKey, setReplayKey] = useState(0);

  return (
    <div className="completion-motion-frame destination-emphasis-frame">
      <div key={replayKey}>
        <CompletionPreview motion="destination" />
        <div className="destination-attention-banner" role="status" aria-label="Next stop: Waiting Area on the first floor">
          <span className="destination-attention-kicker">
            <span className="destination-attention-beacon" aria-hidden="true" />
            Next stop
          </span>
          <strong>Waiting Area</strong>
          <span className="destination-attention-floor">First floor</span>
        </div>
      </div>
      <button
        type="button"
        className="completion-motion-replay"
        onClick={() => setReplayKey((current) => current + 1)}
        aria-label="Replay the Waiting Area emphasis animation"
      >
        <RotateCcw size={15} />
        Replay emphasis
      </button>
    </div>
  );
}