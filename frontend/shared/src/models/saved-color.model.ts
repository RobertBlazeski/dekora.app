export interface SavedColor {
  id: string;
  name: string;
  hexValue: string;
}

export interface UpsertSavedColorRequest {
  name: string;
  hexValue: string;
}
