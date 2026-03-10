import type { UnifiedKey } from "@/types/types";

export interface KeyTreeGroup {
  kind: "group";
  label: string;
  fullPath: string;
  children: KeyTreeNode[];
  totalCount: number;
}

export interface KeyTreeLeaf {
  kind: "leaf";
  label: string;
  key: UnifiedKey;
}

export type KeyTreeNode = KeyTreeGroup | KeyTreeLeaf;

export type RenderItem =
  | { kind: "group"; node: KeyTreeGroup; depth: number }
  | { kind: "leaf"; node: KeyTreeLeaf; depth: number };

export function buildKeyTree(
  keys: UnifiedKey[],
  sortAlpha: boolean,
): KeyTreeNode[] {
  const root: KeyTreeNode[] = [];

  for (const key of keys) {
    const segments = key.name.split(/[_.]/);
    if (segments.length <= 1) {
      root.push({ kind: "leaf", label: key.name, key });
      continue;
    }

    let children = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const seg = segments[i];
      const fullPath = segments.slice(0, i + 1).join("_");

      let group = children.find(
        (n): n is KeyTreeGroup => n.kind === "group" && n.label === seg,
      );
      if (!group) {
        group = {
          kind: "group",
          label: seg,
          fullPath,
          children: [],
          totalCount: 0,
        };
        children.push(group);
      }
      children = group.children;
    }

    children.push({
      kind: "leaf",
      label: segments[segments.length - 1],
      key,
    });
  }

  computeCounts(root);
  if (sortAlpha) sortNodes(root);

  return root;
}

function computeCounts(nodes: KeyTreeNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.kind === "leaf") {
      total += 1;
    } else {
      node.totalCount = computeCounts(node.children);
      total += node.totalCount;
    }
  }
  return total;
}

function sortNodes(nodes: KeyTreeNode[]): void {
  nodes.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === "group" ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
  for (const node of nodes) {
    if (node.kind === "group") sortNodes(node.children);
  }
}

export function flattenTree(
  nodes: KeyTreeNode[],
  expanded: Set<string>,
  depth: number,
): RenderItem[] {
  const result: RenderItem[] = [];

  for (const node of nodes) {
    if (node.kind === "leaf") {
      result.push({ kind: "leaf", node, depth });
    } else {
      result.push({ kind: "group", node, depth });
      if (expanded.has(node.fullPath)) {
        const children = flattenTree(node.children, expanded, depth + 1);
        for (const child of children) result.push(child);
      }
    }
  }

  return result;
}

export function collectAllGroupPaths(
  nodes: KeyTreeNode[],
  out: Set<string>,
): void {
  for (const node of nodes) {
    if (node.kind === "group") {
      out.add(node.fullPath);
      collectAllGroupPaths(node.children, out);
    }
  }
}
