/** Every piece is drawn by Verovio (engraved as a printed edition); OSMD stays only as the fallback if Verovio fails. */
export const engineFor = (_editionId: string): "osmd" | "verovio" => "verovio";
