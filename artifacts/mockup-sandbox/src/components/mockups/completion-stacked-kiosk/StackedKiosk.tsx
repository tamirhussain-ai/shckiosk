import { useState } from "react";
import { ArrowRight, Check, Clock3, MapPin, ShieldCheck } from "lucide-react";

import "./stacked-kiosk.css";

/**
 * Standalone completion-state hypothesis for the IU Student Health Center kiosk.
 * The composition intentionally keeps the destination as the first thing a
 * student can scan, with the visit details tucked into a quiet confirmation tile.
 */
export function StackedKiosk() {
  const [complete, setComplete] = useState(false);

  return (
    <main className="stacked-kiosk" aria-label="IU Student Health Center check-in complete">
      <div className="stacked-kiosk__watermark" aria-hidden="true">
        <img src="/iu-trident-crimson-cropped.png" alt="" />
      </div>

      <header className="stacked-kiosk__header">
        <div className="stacked-kiosk__brand">
          <span className="stacked-kiosk__brand-mark" aria-hidden="true">
            <img src="/iu-trident-reverse-cropped.png" alt="" />
          </span>
          <span>
            <strong>IU Student Health Center</strong>
            <small>Bloomington · private check-in</small>
          </span>
        </div>
        <span className="stacked-kiosk__secure">
          <ShieldCheck size={16} strokeWidth={1.8} />
          Secure kiosk
        </span>
      </header>

      <section className="stacked-kiosk__content">
        <div className="stacked-kiosk__eyebrow">
          <span className="stacked-kiosk__eyebrow-line" />
          Check-in complete
          <span className="stacked-kiosk__eyebrow-line" />
        </div>

        <p className="stacked-kiosk__welcome">Thanks, Alex.</p>
        <h1>
          Head to the
          <span className="stacked-kiosk__destination">
            <span>First</span> floor
          </span>
        </h1>

        <div className="stacked-kiosk__location" aria-label="Destination: First floor, Waiting Area">
          <MapPin size={22} strokeWidth={1.8} />
          <div>
            <span className="stacked-kiosk__location-label">Your destination</span>
            <strong>Waiting Area</strong>
          </div>
          <span className="stacked-kiosk__location-divider" />
          <div className="stacked-kiosk__current">
            <span className="stacked-kiosk__location-label">You are on</span>
            <strong>Second floor</strong>
          </div>
        </div>

        <article className="stacked-kiosk__summary">
          <div className="stacked-kiosk__summary-heading">
            <span>Visit summary</span>
            <span className="stacked-kiosk__summary-status">
              <Check size={14} strokeWidth={2.5} /> Confirmed
            </span>
          </div>
          <div className="stacked-kiosk__summary-grid">
            <div>
              <span>Provider</span>
              <strong>Dr. Alvarez</strong>
            </div>
            <div>
              <span>Location</span>
              <strong>First floor · Waiting Area</strong>
            </div>
            <div>
              <span>Visit</span>
              <strong>Follow-up visit</strong>
            </div>
            <div className="stacked-kiosk__summary-time">
              <Clock3 size={17} strokeWidth={1.8} />
              <span>
                <small>Time</small>
                <strong>10:30 AM</strong>
              </span>
            </div>
          </div>
        </article>

        <div className="stacked-kiosk__action">
          <button
            type="button"
            onClick={() => setComplete(true)}
            className={complete ? "is-complete" : ""}
            aria-live="polite"
          >
            {complete ? (
              <>
                <Check size={22} strokeWidth={2.4} />
                You’re all set
              </>
            ) : (
              <>
                Complete
                <ArrowRight size={22} strokeWidth={1.9} />
              </>
            )}
          </button>
          <p>{complete ? "You may now continue to the Waiting Area." : "Tap Complete before leaving the kiosk."}</p>
        </div>
      </section>

      <footer className="stacked-kiosk__footer">
        <span>600 N Eagleson Avenue</span>
        <span className="stacked-kiosk__footer-dot" />
        <span>Please keep this screen private</span>
      </footer>
    </main>
  );
}

export default StackedKiosk;