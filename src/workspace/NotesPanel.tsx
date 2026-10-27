import { useState } from "react";
import { api } from "../api";
import type { CompiledEdition } from "../../shared/types";

export interface PrivateNote {
  id: string;
  editionId: string;
  productionId: string | null;
  startM: number;
  startQ: number;
  body: string;
  updatedAt: string;
}

interface Props {
  edition: CompiledEdition;
  productionId: string | null;
  notes: PrivateNote[];
  anchor: { m: number; q: number };
  anchorLabel: string;
  onChanged: (notes: PrivateNote[]) => void;
  onGo: (m: number, q: number) => void;
  focusId: string | null;
}

export function NotesPanel(p: Props) {
  const [draft, setDraft] = useState("");
  const [scope, setScope] = useState<"production" | "edition">(p.productionId ? "production" : "edition");
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const num = (m: number) => p.edition.measures[m]?.number;

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const n = await api<PrivateNote>("/api/notes", {
        body: { editionId: p.edition.editionId, productionId: scope === "production" ? p.productionId : null, startM: p.anchor.m, startQ: p.anchor.q, body: draft },
      });
      p.onChanged([...p.notes, n].sort((a, b) => a.startM - b.startM || a.startQ - b.startQ));
      setDraft("");
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="notes">
      <p className="panel-note">Only you can see these notes. Production editors cannot read them.</p>
      <form className="form" onSubmit={add}>
        <label>
          New note at {p.anchorLabel}
          <textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} required placeholder="e.g. Open the vowel on “mare”; breathe before “posa”" data-testid="note-input" />
        </label>
        {p.productionId && (
          <div className="segmented small" role="group" aria-label="Where this note applies">
            <button type="button" aria-pressed={scope === "production"} onClick={() => setScope("production")}>
              This production
            </button>
            <button type="button" aria-pressed={scope === "edition"} onClick={() => setScope("edition")}>
              Every time I practise this piece
            </button>
          </div>
        )}
        {error && <p className="form-error">{error}</p>}
        <button className="btn graphite" data-testid="note-save">
          Save private note
        </button>
      </form>
      {p.notes.length === 0 && <p className="empty">No notes yet. Notes attach to a bar and beat, and stay with you across devices.</p>}
      <ul className="note-list">
        {p.notes.map((n) => (
          <li key={n.id} className={p.focusId === n.id ? "focus" : ""} data-testid="note-item">
            <button className="passage link" onClick={() => p.onGo(n.startM, n.startQ)}>
              m. {num(n.startM)}, beat {1 + n.startQ / (4 / p.edition.measures[n.startM].time[1])}
            </button>
            <span className="fine">{n.productionId ? "this production" : "every practice"}</span>
            {editing === n.id ? (
              <form
                className="form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  await api(`/api/notes/${n.id}`, { method: "PATCH", body: { body: editText } });
                  p.onChanged(p.notes.map((x) => (x.id === n.id ? { ...x, body: editText } : x)));
                  setEditing(null);
                }}
              >
                <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={3} />
                <div className="row-btns">
                  <button className="btn small graphite">Save</button>
                  <button type="button" className="btn small quiet" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="note-body">{n.body}</p>
                <div className="row-btns">
                  <button
                    className="btn small quiet"
                    onClick={() => {
                      setEditing(n.id);
                      setEditText(n.body);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="btn small quiet"
                    onClick={async () => {
                      await api(`/api/notes/${n.id}`, { method: "DELETE", body: {} });
                      p.onChanged(p.notes.filter((x) => x.id !== n.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
