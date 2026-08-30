import { ArrowRight, Globe2, MapPin, Check } from "lucide-react";
import { useState } from "react";
import "./DestinationHero.css";

export function DestinationHero() {
  const [completed, setCompleted] = useState(false);

  return (
    <main className="destination-hero" aria-label="Check-in complete">
      <img
        className="destination-hero__watermark"
        src="/iu-trident-crimson-cropped.png"
        alt=""
        aria-hidden="true"
      />
      <header className="destination-hero__topbar">
        <div className="destination-hero__brand">
          <div className="destination-hero__mark">
            <img src="/iu-trident-reverse-cropped.png" alt="Indiana University trident" />
          </div>
          <div>
            <p className="destination-hero__brand-name">IU Student Health Center</p>
            <p className="destination-hero__brand-sub">Bloomington · Check-in kiosk</p>
          </div>
        </div>
        <button type="button" className="destination-hero__language" onClick={() => window.alert("Language assistance is available at the front desk.")}>
          <Globe2 size={15} aria-hidden="true" /> EN
        </button>
      </header>

      <section className="destination-hero__main">
        <p className="destination-hero__eyebrow"><Check size={16} strokeWidth={3} /> Check-in complete</p>
        <h1 className="destination-hero__title">
          First floor
          <span>Waiting Area</span>
        </h1>
        <p className="destination-hero__instruction">
          Head to the Waiting Area on the first floor.
        </p>

        <div className="destination-hero__summary" aria-label="Visit summary">
          <div className="destination-hero__summary-item destination-hero__summary-item--destination">
            <p className="destination-hero__summary-label"><MapPin size={13} /> Location</p>
            <p className="destination-hero__summary-value">First floor · Waiting Area</p>
          </div>
          <div className="destination-hero__summary-item">
            <p className="destination-hero__summary-label">Provider</p>
            <p className="destination-hero__summary-value">Dr. Alvarez</p>
          </div>
          <div className="destination-hero__summary-item">
            <p className="destination-hero__summary-label">Visit</p>
            <p className="destination-hero__summary-value">Follow-up visit</p>
          </div>
          <div className="destination-hero__summary-item">
            <p className="destination-hero__summary-label">Time</p>
            <p className="destination-hero__summary-value">10:30 AM</p>
          </div>
        </div>

        <div className="destination-hero__actions">
          <button type="button" className="destination-hero__complete" onClick={() => setCompleted(true)}>
            {completed ? "You’re all set" : "Complete"}
            {completed ? <Check size={21} strokeWidth={2.5} /> : <ArrowRight size={21} strokeWidth={2.5} />}
          </button>
          <p className="destination-hero__note">This kiosk is on the second floor.</p>
          {completed && <p className="destination-hero__toast" role="status">Please follow the signs to the first floor.</p>}
        </div>
      </section>
    </main>
  );
}

export default DestinationHero;