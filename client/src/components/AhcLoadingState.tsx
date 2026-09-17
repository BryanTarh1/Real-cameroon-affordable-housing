import "./AhcLoadingState.css";

type AhcLoadingStateProps = {
  message: string;
  detail?: string;
  compact?: boolean;
};

/** A quiet, branded loading state used while route data or protected workspaces load. */
export function AhcLoadingState({
  message,
  detail,
  compact = false,
}: AhcLoadingStateProps) {
  return (
    <div
      className={`ahc-loading-state${compact ? " ahc-loading-state--compact" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="ahc-loading-lockup" aria-hidden="true">
        <span className="ahc-loading-emblem">
          <span />
          <span />
          <span />
        </span>
        <span className="ahc-loading-wordmark">
          <strong>Affordable Housing</strong>
          <b>Cameroon</b>
        </span>
      </div>
      <div className="ahc-loading-copy">
        <p>{message}</p>
        {detail ? <span>{detail}</span> : null}
      </div>
      <span className="ahc-loading-progress" aria-hidden="true" />
    </div>
  );
}

export default AhcLoadingState;
