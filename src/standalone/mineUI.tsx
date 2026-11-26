import { isMine, toggleMine, useMine } from "./mine";

/**
 * The + in every list: adds the piece to My pieces (Home); once added it turns into a filled tick, and a second tap
 * takes it off again. It never opens the row it sits in.
 */
export function AddMine({ id, title }: { id: string; title: string }) {
  useMine(); // re-render when the list changes anywhere
  const on = isMine(id);
  return (
    <button
      type="button"
      className={`mine-add${on ? " is-on" : ""}`}
      aria-pressed={on}
      aria-label={on ? `Remove ${title} from My pieces` : `Add ${title} to My pieces`}
      title={on ? "In My pieces (tap to remove)" : "Add to My pieces"}
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggleMine(id);
      }}
    >
      {on ? (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" className="mine-fill" />
          <path d="M7.5 12.3l3 3 6-6.3" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="9.25" fill="none" strokeWidth="1.5" />
          <path d="M12 7.5v9M7.5 12h9" fill="none" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
