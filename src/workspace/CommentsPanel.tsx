import { useState } from "react";
import { api } from "../api";
import type { CompiledEdition, PassageComment, Permission } from "../../shared/types";

interface Props {
  edition: CompiledEdition;
  productionId: string;
  versionNumber: number | null; // null = draft
  permission: Permission;
  comments: PassageComment[];
  corrections: PassageComment[];
  range: { startM: number; endM: number };
  onChanged: () => void;
  onGo: (m: number) => void;
  focusId: string | null;
}

export function CommentsPanel(p: Props) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);
  const isDraft = p.versionNumber === null;
  const kind: "editorial" | "correction" = isDraft && p.permission === "editor" ? "editorial" : "correction";
  const num = (m: number) => p.edition.measures[m]?.number;
  const rangeLabel = `m. ${num(p.range.startM)}${p.range.endM !== p.range.startM ? `–${num(p.range.endM)}` : ""}`;

  return (
    <div className="comments">
      <h3 className="sub-title">Production comments{isDraft ? " (draft)" : ` in version ${p.versionNumber}`}</h3>
      {p.comments.length === 0 && <p className="empty">No shared comments on this version.</p>}
      <ul className="comment-list">
        {p.comments.map((c) => (
          <li key={c.id} className={`${p.focusId === c.id ? "focus " : ""}${c.status === "resolved" ? "resolved" : ""}`}>
            <button className="passage link" onClick={() => p.onGo(c.startM)}>
              m. {num(c.startM)}
              {c.endM !== c.startM ? `–${num(c.endM)}` : ""}
            </button>
            <p>{c.body}</p>
            <p className="fine">{c.authorName}</p>
          </li>
        ))}
      </ul>

      <h3 className="sub-title">{p.permission === "editor" ? "Correction requests" : "Your correction requests"}</h3>
      {p.corrections.length === 0 && <p className="empty">None.</p>}
      <ul className="comment-list">
        {p.corrections.map((c) => (
          <li key={c.id} className={`correction ${c.status === "resolved" ? "resolved" : ""}`}>
            <button className="passage link" onClick={() => p.onGo(c.startM)}>
              m. {num(c.startM)}
              {c.endM !== c.startM ? `–${num(c.endM)}` : ""}
            </button>
            <p>{c.body}</p>
            <p className="fine">
              {c.authorName}, {c.status === "resolved" ? "resolved" : "open"}
            </p>
          </li>
        ))}
      </ul>

      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            await api(`/api/productions/${p.productionId}/comments`, {
              body: { kind, startM: p.range.startM, endM: p.range.endM, body, versionNumber: p.versionNumber },
            });
            setBody("");
            setSent(kind === "editorial" ? "Comment added to the draft." : "Correction request sent to the editors.");
            p.onChanged();
          } catch (err) {
            setError((err as Error).message);
          }
        }}
      >
        <label>
          {kind === "editorial" ? `Shared comment on ${rangeLabel}` : `Request a correction for ${rangeLabel}`}
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} required placeholder={kind === "editorial" ? "Visible to everyone once published" : "e.g. The IPA for “cuore” shows [o]; it should be open [ɔ]"} />
        </label>
        <p className="fine">
          {kind === "editorial"
            ? "Shared comments become part of the next published version."
            : "Text and notation are corrected by the editorial team; your request is visible to the editors."}
        </p>
        {error && <p className="form-error">{error}</p>}
        {sent && <p className="ok-text">{sent}</p>}
        <button className="btn blue">{kind === "editorial" ? "Add comment" : "Send request"}</button>
      </form>
    </div>
  );
}
