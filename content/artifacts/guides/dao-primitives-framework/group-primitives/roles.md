---
title: Roles (Primitive)
description: Sets of responsibilities, permissions, and accountabilities that enable coordination and specialization
author:
  - yeoro.eth
tags:
  - primitives
  - roles
publish: true
type: note
---

# Roles

## Definition

Roles within the DAO Primitives Framework function as **agreement primitives** that establish formalized commitments about cells in the network. As defined in [our lexicon](content/tags/roles.md#), Roles are "defined sets of responsibilities, permissions, and accountabilities that enable coordination and specialization within decentralized systems" - serving as the relationship infrastructure that connects autonomous actors across [DAO networks](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#).

---

## Core Characteristics

**Agreements-Based Primitive**: Unlike cells and [DAOs](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#.md#) which function as entities (network nodes), Roles serve as [agreements](content/tags/agreements.md#) (network edges) that define the "commitments and [responsibilities](content/tags/responsibilities.md#) that are agreed upon between autonomous actors in the network."

**Relationship Infrastructure**: Roles create the connective tissue between entities by establishing clear [agreements](content/tags/agreements.md#.md#) about "who is responsible for what" while maintaining [transparent](content/tags/transparency.md#) interfaces that enable effective [coordination](content/tags/coordination.md#) across the network without requiring hierarchical management.

**Ongoing Activities**: Roles enable "[coordination](content/tags/coordination.md#.md#) and specialization" for ongoing activities (as opposed to tasks). They create defined sets of [responsibilities](content/tags/responsibilities.md#) and [permissions](content/tags/permissions.md#.md#) that persist until they are either relinquished by the role owner or removed by a person or entity that holds authority over the role.

**Flexible Implementation**: Roles can be implemented across different contexts as highly flexible ongoing mechanisms to manage responsibilities - e.g., in cells defining internal and external roles for specialized functions, to [DAO](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#.md#.md#) networks establishing roles for cross-entity [coordination](content/tags/coordination.md#.md#), to technical systems implementing role-based access control.

## Role State

**Role State** documentation enables Roles to function effectively as [agreements](content/tags/agreements.md#.md#) primitives across [DAO networks](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#.md#.md#.md#). Transparent state documentation is maintained for each role. This captures the essential information needed for both role fulfillment and network [coordination](content/tags/coordination.md#.md#).

This cells that created the role. By documenting role state in accessible formats, other cells, [agents](content/tags/agents.md#.md#), and network entities can discover, understand, and coordinate with roles directly, enabling the decentralized collaboration that characterizes effective [DAO](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#.md#.md#) networks.

Role State consists of three core components:

**[Purpose](content/tags/purpose.md#)**: Documents the specific outcomes, [responsibilities](content/tags/responsibilities.md#), and [authorities](content/tags/authorities.md#.md#) that the role is designed to fulfill within the network context. This creates clarity about the role's function and enables other network participants to understand when and how to engage with the role.

**[Practice](content/tags/practices.md#)**: Establishes the operational [agreements](content/tags/agreements.md#.md#) about how [responsibilities](content/tags/responsibilities.md#) will be fulfilled, what [permissions](content/tags/permissions.md#.md#.md#) and [authorities](content/tags/authorities.md#.md#.md#) are granted, and how the role interfaces with other roles and entities in the network.

**[Progress](content/tags/progress.md#)**: Maintains documentation of role performance and activities against defined [responsibilities](content/tags/responsibilities.md#), creating [transparency](content/tags/transparency.md#.md#) that supports both individual [accountability](content/tags/accountability.md#) and enables other network participants to assess role effectiveness and identify collaboration opportunities.

Together, these three dimensions create comprehensive role state documentation that enables roles to function as effective [agreements](content/tags/agreements.md#.md#) primitives while maintaining the [transparency](content/tags/transparency.md#.md#.md#) needed for network-wide [coordination](content/tags/coordination.md#.md#).

## Phase & Scale Considerations

**Cross-Phase Adaptability**: Roles evolve through [group phases](content/artifacts/guides/dao-primitives-framework/group-phase/index.md#) as entities mature - from informal role emergence in [Conversation Phase](content/artifacts/guides/dao-primitives-framework/group-phase/conversation-phase.md#) to formalized role structures in [Organization Phase](content/artifacts/guides/dao-primitives-framework/group-phase/organization-phase.md#) to network-integrated roles in [Coordination Phase](content/artifacts/guides/dao-primitives-framework/group-phase/coordination-phase.md#).

**Scale-Appropriate Complexity**: Role definition and management mechanisms adapt to scale requirements - simple, relationship-based roles at collaboration scale versus formal, documented roles with explicit [permissions](content/tags/permissions.md#.md#.md#.md#) systems at coordination and constituency scales.

## Network Relationships

**Entity-Role Integration**: Roles are one of the functional interfaces between cells and [DAOs](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#.md#), enabling entities to coordinate effectively by establishing clear [agreements](content/tags/agreements.md#.md#) about [responsibilities](content/tags/responsibilities.md#), [authorities](content/tags/authorities.md#.md#.md#.md#), and [accountability](content/tags/accountability.md#.md#) across the network. For example, a Cell can be created to perform an established role. The role defines clear resource allocation, deliverables, etc. for the Cell. But the Cell retains autonomy as to how it does this. It also is free to engage in other activities across the network that are independent of the particular role it is committed to.

**Role-Task Coordination**: Roles work in conjunction with [Tasks](content/artifacts/guides/dao-primitives-framework/group-primitives/tasks.md#) (another agreements primitive) to operationalize network coordination - Roles defining "who" has responsibility and authority, while Tasks define "what" specific actions and deliverables need to be accomplished.

**Network-Wide Coherence**: Through documented role [agreements](content/tags/agreements.md#.md#), the network creates [transparency](content/tags/transparency.md#.md#.md#.md#) about [responsibilities](content/tags/responsibilities.md#) and [authorities](content/tags/authorities.md#.md#.md#.md#.md#) that enables decentralized [coordination](content/tags/coordination.md#.md#) while maintaining overall coherence and [accountability](content/tags/accountability.md#.md#.md#).

## Implementation Patterns

**Cell-Internal Roles**: cells define internal roles that handle specialized functions while maintaining clear interfaces with other Cells, creating "[transparent](content/tags/transparency.md#.md#.md#.md#.md#) [agreements](content/tags/agreements.md#.md#) about who is responsible for what" within a team.

**Cross-Cell Coordination Roles**: Roles that span multiple cells or interface between Cells and the broader [DAO](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#.md#.md#) network, enabling coordination without hierarchical management structures.

**Technical Role Implementation**: In web3 contexts, roles often manifest as cryptographically secured [permissions](content/tags/permissions.md#.md#.md#.md#) systems through smart contracts, multi-signature wallets, and role-based access control that "distribute control across multiple stakeholders while maintaining [transparent](content/tags/transparency.md#.md#.md#.md#.md#), verifiable permission structures."

## Examples in Practice

**SuperBenefit**: has implemented roles to perform community governance functions. We do this using Hats Protocol: [https://app.hatsprotocol.xyz/trees/10/30](https://app.hatsprotocol.xyz/trees/10/30)

**All in for Sport**: has likewise implemented a roles structure using Hats Protocol: [https://app.hatsprotocol.xyz/trees/10/78](https://app.hatsprotocol.xyz/trees/10/78)

---

## Related Concepts

- [Roles](content/tags/roles.md#.md#) - Comprehensive definition and usage contexts
- [Tasks](content/artifacts/guides/dao-primitives-framework/group-primitives/tasks.md#) - The complementary agreements primitive
- cells - Entities that implement and coordinate through roles
- [DAOs](content/artifacts/guides/dao-primitives-framework/group-primitives/daos.md#.md#) - Network entities that establish role frameworks
- [Agreements](content/tags/agreements.md#.md#.md#.md#.md#.md#.md#.md#.md#) - The broader category of relationship infrastructure
- [Responsibilities](content/tags/responsibilities.md#.md#.md#.md#.md#.md#.md#.md#.md#) - The duties and obligations assigned to roles
- [Authorities](content/tags/authorities.md#.md#.md#.md#.md#.md#) - The decision-making capacities granted to roles
- [Accountability](content/tags/accountability.md#.md#.md#.md#) - The mechanisms through which roles are held responsible


