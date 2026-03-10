export interface UnifiedKey {
  name: string;
  type: "string" | "array";
  values: Record<string, string | string[] | null | undefined>;
}
