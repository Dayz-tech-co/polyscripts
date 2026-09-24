/** Small tone-coded pill used for trader badges and trade signals. */
export default function Badge({ label, tone = "info", hint }) {
  return (
    <span className={`ps-badge is-${tone}`} title={hint}>
      {label}
    </span>
  );
}
