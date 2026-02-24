import type { KnowledgeClient } from "./rpc";
import type { R2Document } from "./types";
import { toDocument, toSearchResult } from "./types";

/** Sample R2Documents for offline local development */
const MOCK_R2_DOCS: R2Document[] = [
  {
    id: "governance-primitives",
    contentType: "pattern",
    path: "data/resources/patterns/governance-primitives.md",
    metadata: {
      title: "Governance Primitives",
      description:
        "Composable building blocks for organizational governance.",
      date: "2024-06-15",
      publish: true,
      tags: ["governance", "dao", "primitives"],
      group: "dao-primitives",
      license: "CC-BY-SA-4.0",
    },
    content:
      "# Governance Primitives\n\nGovernance primitives are the fundamental building blocks...",
    syncedAt: "2025-01-10T00:00:00Z",
    commitSha: "abc1234",
  },
  {
    id: "dao-governance",
    contentType: "playbook",
    path: "data/resources/playbooks/dao-governance.md",
    metadata: {
      title: "DAO Governance Playbook",
      description:
        "A step-by-step guide to setting up DAO governance structures.",
      date: "2024-08-01",
      publish: true,
      tags: ["governance", "dao", "playbook"],
      group: "dao-primitives",
    },
    content:
      "# DAO Governance Playbook\n\nThis playbook walks through...",
    syncedAt: "2025-02-01T00:00:00Z",
    commitSha: "abc1235",
  },
  {
    id: "dao",
    contentType: "tag",
    path: "data/concepts/dao.md",
    metadata: {
      title: "DAO (Decentralized Autonomous Organization)",
      description:
        "A collectively-owned organization governed by smart contracts.",
      date: "2024-01-15",
      publish: true,
      tags: ["dao", "web3", "governance"],
      aliases: ["DAO", "Decentralized Autonomous Organization"],
    },
    content:
      "# DAO\n\nA Decentralized Autonomous Organization (DAO) is...",
    syncedAt: "2025-01-10T00:00:00Z",
    commitSha: "abc1236",
  },
  {
    id: "future-of-daos",
    contentType: "article",
    path: "data/stories/articles/future-of-daos.md",
    metadata: {
      title: "The Future of DAOs",
      description: "Exploring emerging trends in decentralized governance.",
      date: "2025-01-20",
      publish: true,
      tags: ["dao", "governance", "future"],
    },
    content: "# The Future of DAOs\n\nAs the ecosystem matures...",
    syncedAt: "2025-01-20T00:00:00Z",
    commitSha: "abc1237",
  },
  {
    id: "alice",
    contentType: "person",
    path: "data/people/alice.md",
    metadata: {
      title: "Alice Smith",
      description:
        "Core contributor to SuperBenefit governance research.",
      date: "2024-03-01",
      publish: true,
      tags: ["contributor", "governance"],
      roles: ["Researcher"],
      groups: ["dao-primitives"],
    },
    content: "# Alice Smith\n\nAlice is a governance researcher...",
    syncedAt: "2025-01-10T00:00:00Z",
    commitSha: "abc1238",
  },
  {
    id: "governance-working-group",
    contentType: "group",
    path: "data/groups/governance-working-group.md",
    metadata: {
      title: "Governance Working Group",
      description:
        "Working group focused on governance patterns and tooling.",
      date: "2024-05-01",
      publish: true,
      tags: ["governance", "working-group"],
      aliases: ["GovWG"],
      members: ["alice"],
    },
    content: "# Governance Working Group\n\nThis group explores...",
    syncedAt: "2025-01-10T00:00:00Z",
    commitSha: "abc1239",
  },
  {
    id: "superbenefit-knowledge-garden",
    contentType: "project",
    path: "data/projects/superbenefit-knowledge-garden.md",
    metadata: {
      title: "SuperBenefit Knowledge Garden",
      description:
        "A shared knowledge base for the SuperBenefit ecosystem.",
      date: "2024-01-01",
      publish: true,
      tags: ["superbenefit", "knowledge"],
      status: "active",
      group: "dao-primitives",
    },
    content: "# Knowledge Garden\n\nThe Knowledge Garden is...",
    syncedAt: "2025-01-10T00:00:00Z",
    commitSha: "abc123a",
  },
  {
    id: "dao-primitives-index",
    contentType: "index",
    path: "docs/dao-primitives/index.md",
    metadata: {
      title: "DAO Primitives",
      description: "Framework for scalable DAO design.",
      publish: true,
      tags: ["dao", "governance"],
      group: "dao-primitives",
    },
    content: "# DAO Primitives\n\nThis section documents the DAO Primitives framework...",
    syncedAt: "2025-06-01T00:00:00Z",
    commitSha: "abc1240",
  },
  {
    id: "building-daos-as-scalable-networks",
    contentType: "article",
    path: "docs/dao-primitives/articles/building-daos-as-scalable-networks.md",
    metadata: {
      title: "Building DAOs as Scalable Networks",
      description: "How DAOs can scale by structuring smaller autonomous units.",
      publish: true,
      tags: ["dao", "governance", "networks"],
      group: "dao-primitives",
    },
    content: "# Building DAOs as Scalable Networks\n\nThis article explores...",
    syncedAt: "2025-06-01T00:00:00Z",
    commitSha: "abc1241",
  },
  {
    id: "rpp-index",
    contentType: "index",
    path: "docs/rpp/index.md",
    metadata: {
      title: "Reimagining Power Project",
      description: "Exploring how web3 can transform impact.",
      publish: true,
      tags: ["web3", "impact", "philanthropy"],
      group: "rpp",
    },
    content: "# Reimagining Power Project\n\nThis section documents...",
    syncedAt: "2025-06-01T00:00:00Z",
    commitSha: "abc1242",
  },
  {
    id: "reimagining-power",
    contentType: "article",
    path: "docs/rpp/articles/reimagining-power.md",
    metadata: {
      title: "Reimagining Power: How Web3 Can Transform Impact",
      description: "A case study on web3 approaches to philanthropic funding.",
      publish: true,
      tags: ["web3", "philanthropy", "case-study"],
      group: "rpp",
    },
    content: "# Reimagining Power\n\nThis article examines how web3 technologies...",
    syncedAt: "2025-06-01T00:00:00Z",
    commitSha: "abc1243",
  },
];

function matchesSearch(doc: R2Document, query: string): boolean {
  const q = query.toLowerCase();
  const m = doc.metadata;
  const title = ((m.title as string) || "").toLowerCase();
  const desc = ((m.description as string) || "").toLowerCase();
  const tags = (Array.isArray(m.tags) ? m.tags : []) as string[];
  return (
    title.includes(q) ||
    desc.includes(q) ||
    tags.some((t) => t.toLowerCase().includes(q))
  );
}

/** Create a mock KnowledgeClient for offline local dev */
export function createStubClient(): KnowledgeClient {
  return {
    async getDocument(contentType, id) {
      const doc = MOCK_R2_DOCS.find(
        (d) => d.contentType === contentType && d.id === id,
      );
      return doc ? toDocument(doc) : null;
    },

    async listEntries(params) {
      let docs = [...MOCK_R2_DOCS];

      if (params?.contentType) {
        docs = docs.filter((d) => d.contentType === params.contentType);
      }
      if (params?.group) {
        docs = docs.filter((d) => d.metadata.group === params.group);
      }
      if (params?.sourcePath) {
        docs = docs.filter((d) =>
          (d.path ?? "").startsWith(params.sourcePath!),
        );
      }

      const total = docs.length;
      const offset = params?.offset ?? 0;
      const limit = params?.limit ?? 50;
      docs = docs.slice(offset, offset + limit);

      return { data: docs.map(toDocument), total };
    },

    async search(query, opts) {
      let docs = MOCK_R2_DOCS.filter((d) => matchesSearch(d, query));

      if (opts?.contentType) {
        docs = docs.filter((d) => d.contentType === opts.contentType);
      }

      const limited = docs.slice(0, opts?.limit ?? 10);
      return {
        items: limited.map((d, i) =>
          toSearchResult({
            id: d.id,
            contentType: d.contentType,
            title: (d.metadata.title as string) || d.id,
            ...(d.metadata.description != null && {
              description: d.metadata.description as string,
            }),
            score: 1 - i * 0.1,
          }),
        ),
        total: limited.length,
      };
    },

    async listGroups() {
      return [
        {
          id: "dao-primitives",
          title: "DAO Primitives",
          description: "Research cell focused on DAO governance patterns.",
        },
      ];
    },

    async listReleases() {
      return [
        {
          id: "dao-primitives-v1",
          title: "DAO Primitives v1",
          description: "First release of the DAO Primitives framework.",
        },
      ];
    },
  };
}
