export type LibraryCsvRow = Record<string, string>;

export function parseLibraryCsv(text: string): LibraryCsvRow[];
export function libraryCsvField(row: LibraryCsvRow, ...names: string[]): string;
export function safeLibraryAssetName(value: string, extension: string): string | null;
