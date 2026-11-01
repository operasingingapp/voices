/** Pieces drawn by Verovio (engraved as a printed edition). The rest still use OSMD until they are moved over. */
export const VEROVIO_PIECES = new Set<string>(["mozart-esci-omai-garzon-malnato", "mozart-susanna-signore", "mozart-taci-vien-gente"]);
export const engineFor = (editionId: string): "osmd" | "verovio" => (VEROVIO_PIECES.has(editionId) ? "verovio" : "osmd");
