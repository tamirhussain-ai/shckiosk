import { useState } from "react";
import { ArrowRight, CalendarDays, Check, Clock3, MapPin, ShieldCheck, UserRound } from "lucide-react";
import "./ConfirmationTicket.css";

const facts = [
  { label: "Provider", value: "Dr. Alvarez", icon: UserRound },
  { label: "Location", value: "First floor · Waiting Area", icon: MapPin },
  { label: "Visit", value: "Follow-up visit", icon: CalendarDays },
  { label: "Time", value: "10:30 AM", icon: Clock3 },
];

export function ConfirmationTicket() {
  const [completed, setCompleted] = useState(false);

  return (
    <main className="confirmation-kiosk">
      <div className="confirmation-watermark" aria-hidden="true">
        <img src="/iu-trident-crimson-cropped.png" alt="" />
      </div>

      <header className="confirmation-header">
        <div className="confirmation-brand">
          <span className="confirmation-mark">
            <img src="/iu-trident-reverse-cropped.png" alt="Indiana University trident" />
          </span>
          <span>
            <strong>IU Student Health Center</strong>
            <small>Bloomington · secure check-in</small>
          </span>
        </div>
        <div className="confirmation-secure">
          <ShieldCheck size={16} />
          <span>Private kiosk</span>
        </div>
      </header>

      <section className="confirmation-stage" aria-labelledby="confirmation-title">
        <div className="confirmation-intro">
          <div className="confirmation-check" aria-hidden="true"><Check size={25} strokeWidth={3} /></div>
          <p className="confirmation-eyebrow">Check-in complete</p>
          <h1 id="confirmation-title">You’re all set.</h1>
          <p className="confirmation-subtitle">Please head to your next stop.</p>
        </div>

        <div className="confirmation-ticket">
          <div className="ticket-destination">
            <p className="ticket-label">Your next stop</p>
            <div className="destination-line">
              <span className="destination-pin"><MapPin size={25} strokeWidth={2.3} /></span>
              <div>
                <p className="destination-floor"><span>FIRST</span> FLOOR</p>
                <h2>Waiting Area</h2>
              </div>
            </div>
            <p className="destination-note">Take the elevator or stairs down one floor.</p>
          </div>

          <div className="ticket-rule" aria-hidden="true"><span /><i /><span /></div>

          <div className="ticket-summary">
            <div className="summary-heading">
              <div>
                <p className="ticket-label">Visit summary</p>
                <h3>Today’s appointment</h3>
              </div>
              <span className="summary-time">10:30 AM</span>
            </div>
            <div className="fact-grid">
              {facts.map(({ label, value, icon: Icon }) => (
                <div className="visit-fact" key={label}>
                  <Icon size={17} aria-hidden="true" />
                  <div><span>{label}</span><strong>{value}</strong></div>
                </div>
              ))}
            </div>
          </div>

          <div className="ticket-footer">
            <span>Checked in at the Second floor kiosk</span>
            <span className="ticket-dots" aria-hidden="true">•••</span>
          </div>
        </div>

        <button
          className={`confirmation-complete ${completed ? "is-complete" : ""}`}
          type="button"
          onClick={() => setCompleted(true)}
          disabled={completed}
        >
          {completed ? <><Check size={22} strokeWidth={3} /> Done</> : <>Complete <ArrowRight size={22} strokeWidth={2.5} /> </>}
        </button>
        <p className="confirmation-help">Questions? Please ask someone at the front desk.</p>
      </section>
    </main>
  );
}

export default ConfirmationTicket;