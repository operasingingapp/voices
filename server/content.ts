import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { CatalogEntry, CompiledEdition, CompiledLanguage } from "../shared/types";

export class ContentStore {
  readonly dir: string;
  private editions = new Map<string, CompiledEdition>();
  private languages = new Map<string, CompiledLanguage>();
  catalog: CatalogEntry[] = [];

  constructor(dir: string) {
    this.dir = dir;
    this.reload();
  }

  reload() {
    const catFile = join(this.dir, "catalog.json");
    if (!existsSync(catFile)) throw new Error(`No content catalog at ${catFile}. Run "npm run content" first.`);
    this.catalog = JSON.parse(readFileSync(catFile, "utf8"));
    this.editions.clear();
    this.languages.clear();
    for (const c of this.catalog) {
      this.editions.set(c.editionId, JSON.parse(readFileSync(join(this.dir, c.editionId, "edition.json"), "utf8")));
      this.languages.set(c.editionId, JSON.parse(readFileSync(join(this.dir, c.editionId, "language.json"), "utf8")));
    }
  }

  edition(id: string): CompiledEdition | undefined {
    return this.editions.get(id);
  }

  language(id: string): CompiledLanguage | undefined {
    return this.languages.get(id);
  }
}
