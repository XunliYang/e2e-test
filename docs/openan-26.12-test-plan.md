# OpenAN 26.12 测试计划状态表（Test Plan Index）

> 版本：v0.1 | 维护：OpenAN 集成测试工作组
> 用途：按需求维度管理 26.12 版本测试状态，关联[需求索引](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1187905545/OpenAN+26.12)（Requirement Index）与特性工作组
> 测试流程依据：《[集成测试流程及框架](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1544945667/OpenAN+Integration+Testing+Process+and+Framework)》§4.3（转测 → RC-0 全量测试 → RC-1 发布前测试）
> 更新节奏：转测评审（TRR）、RC-0、RC-1 各阶段完成后更新对应列；Dev Status 以需求索引为准

## 字段说明（对齐测试流程）

| 字段 | 对应流程环节 | 填写说明 |
|------|-------------|---------|
| Index / Requirement Title / Involved Components | — | 与需求索引一一对应，保证需求-测试双向追溯 |
| Feature WG | — | 需求归属的特性工作组 |
| Test Owner | 转测（TRR） | 特性工作组测试负责人：设计 FIT 测试方案、用例和自测报告 |
| Dev Status | 转测前置条件 | 需求侧开发状态（引自需求索引）；Coding Finished 方可发起转测 |
| Test Design & TRR | 转测阶段（M4，2026-10-16 ~ 11-15） | 测试方案/用例设计与转测评审：Not Started / In Progress / Passed（附日期）/ Conditional |
| FIT Self-Test & Acceptance | RC-0 全量测试 | FIT 全量自测报告与需求验收：— / In Progress / Report Issued / Accepted |
| RC-0 Testing | RC-0 全量测试（2026-10-30 ~ 11-25） | 全量回归与专项测试结果，含 P0/P1 缺陷闭环情况 |
| RC-1 Regression | RC-1 发布前测试（2026-11-25 ~ 12-16） | 发布前回归与 RC-1 测试报告状态 |
| Requirement Issue Link | 关联需求 | 需求 GitHub Issue 链接 |

**状态取值**：`Not Started`（未启动）→ `In Progress`（进行中）→ `Passed` / `Report Issued` / `Accepted`（完成）；`N/A`（不在本版本测试范围：Suspended / 延期）；`—`（未到该阶段）。

## 测试计划表

| Index | Requirement Title | Involved Components | Feature WG | Test Owner | Dev Status | Test Design & TRR | FIT Self-Test & Acceptance | RC-0 | RC-1 | Requirement Issue Link |
|-------|-------------------|---------------------|-----------|------------|-----------|-------------------|---------------------------|------|------|------------------------|
| 1 | Registry Center Supports Heterogeneous Database Adaptation Access | Registry Center | Registry Center | `<TBD>` | Coding Finished | Not Started | — | — | — | [#26](https://github.com/project-openan/registry-center/issues/26) |
| 2 | Orchestration Center Supports BPMN Workflow Export | Orchestration Center, Registry Center | Orchestration Center | — | Delay to 27.06 | N/A | — | — | — | — |
| 3 | Registry Center Supports Third-Party Integration | Registry Center | Registry Center | `<TBD>` | Coding Progress 70% | Not Started | — | — | — | [#27](https://github.com/project-openan/registry-center/issues/27) |
| 4 | Registry Center Supports Third-Party Database Access | Registry Center | Registry Center | `<TBD>` | Coding Finished | Not Started | — | — | — | [#28](https://github.com/project-openan/registry-center/issues/28) |
| 5 | Registry Center Supports Agent Heartbeat Detection and Change Broadcast | Registry Center | Registry Center | `<TBD>` | Coding Progress 90% | Not Started | — | — | — | [#29](https://github.com/project-openan/registry-center/issues/29) |
| 6 | Registry Center Supports Knowledge Graph Management and Semantic Retrieval Enhancement | Registry Center | Registry Center | `<TBD>` | To Be Updated | Not Started | — | — | — | — |
| 7 | Registry Center Supports Independent Management Frontend | Registry Center | Registry Center | `<TBD>` | Coding Finished | Not Started | — | — | — | [#30](https://github.com/project-openan/registry-center/issues/30) |
| 8 | Support Agent Role-Based Orchestration with Instance Mapping at Execution Time | Orchestration Center, Registry Center | Orchestration Center | `<TBD>` | Design & Coding 40% | Not Started | — | — | — | [#74](https://github.com/project-openan/orchestration-center/issues/74) |
| 9 | Support Ontology Construction (Key Step Knowledge for SPG, etc.) | Orchestration Center | Orchestration Center | — | Suspended | N/A | — | — | — | [#75](https://github.com/project-openan/orchestration-center/issues/75) |
| 10 | Support Sandbox-Level Verification in the Orchestration Center with Stub Default Agent Verification | Orchestration Center | Orchestration Center | `<TBD>` | Coding Finished | Not Started | — | — | — | [#76](https://github.com/project-openan/orchestration-center/issues/76) |
| 11 | Provide a Unified Web Framework (Pluggable Portal) | Orchestration Center, OpenAN Website | Orchestration Center | `<TBD>` | Coding Finished | Not Started | — | — | — | [#77](https://github.com/project-openan/orchestration-center/issues/77) |
| 12 | Independent Code Repository for Prompt Template Hosting | A2A-T SDK | A2A-T SDK | `<TBD>` | Coding Progress 0% | Not Started | — | — | — | [#31](https://github.com/project-openan/a2a-t-sdk-python/issues/31) |
| 13 | A2A-T Collaboration Observability | A2A-T SDK, Orchestration Center | A2A-T SDK | `<TBD>` | Coding Finished | Not Started | — | — | — | [#32](https://github.com/project-openan/a2a-t-sdk-python/issues/32) [#80](https://github.com/project-openan/a2a-t-sdk-java/issues/80) |
| 14 | Create Test Automation Framework for Testing A2A-T SDK, Registry Center and Orchestration Center | A2A-T SDK, Orchestration Center, Registry Center | Cross-WG | — | Suspended | N/A | — | — | — | — |
| 15 | Create "Participants" Page for OpenAN Partners | Website | Website | `<TBD>` | Coding Finished | Not Started | — | — | — | [#7](https://github.com/project-openan/project-openan.github.io/issues/7) |
| 16 | Add a "Best Practice" Page to Showcase Implementations | Website | Website | `<TBD>` | Coding Finished | Not Started | — | — | — | [#4](https://github.com/project-openan/project-openan.github.io/issues/4) |
| 17 | Add an "OpenAN Experience Lab" to Show the Features and Valuable Scenarios of OpenAN | Website | Website | `<TBD>` | Coding Finished | Not Started | — | — | — | [#8](https://github.com/project-openan/project-openan.github.io/issues/8) |
| 18 | OpenAN Demo Project for Typical High-Value Scenario | A2A-T SDK, Orchestration Center, Registry Center, Website | Cross-WG | `<TBD>` | Coding Finished | Not Started | — | — | — | [#1](https://github.com/project-openan/openan-demo/issues/1) |
| 19 | System-Level Installation and Deployment Tooling for OpenAN | Orchestration Center, Registry Center | Installation | `<TBD>` | Coding Finished | Not Started | — | — | — | [#2](https://github.com/project-openan/openan-installation/issues/2) |
| 20 | High-Value Scenario Prompt Template Definition | A2A-T SDK | A2A-T SDK | `<TBD>` | Coding Finished | Not Started | — | — | — | [#33](https://github.com/project-openan/a2a-t-sdk-python/issues/33) |
| 21 | Enhancement of Negotiation Supporting | A2A-T SDK | A2A-T SDK | `<TBD>` | Coding Finished | Not Started | — | — | — | [#34](https://github.com/project-openan/a2a-t-sdk-python/issues/34) [#81](https://github.com/project-openan/a2a-t-sdk-java/issues/81) |
| 22 | Supporting for TMF IG1453 v2.1 Authorization-T | A2A-T SDK | A2A-T SDK | `<TBD>` | Coding Finished | Not Started | — | — | — | [#82](https://github.com/project-openan/a2a-t-sdk-java/issues/82) [#35](https://github.com/project-openan/a2a-t-sdk-python/issues/35) |
| 23 | Enhancing A2A-T Semantic Alignment Based on Ontology | A2A-T SDK | A2A-T SDK | — | Delay to 27.06 | N/A | — | — | — | — |
| 24 | Add an Observability Framework to OpenAN Project | All Components | Cross-WG | `<TBD>` | To Be Updated | Not Started | — | — | — | — |
| 25 | Support Agent Registration for Different Layers | Registry Center | Registry Center | — | Suspended | N/A | — | — | — | [#31](https://github.com/project-openan/registry-center/issues/31) |
| 26 | Support Layer-Based Orchestration Constraints | Orchestration Center | Orchestration Center | — | Suspended | N/A | — | — | — | [#78](https://github.com/project-openan/orchestration-center/issues/78) |
| 27 | Multi-Agent Workflow Engine SDK | Orchestration Center | Orchestration Center | `<TBD>` | Coding Finished | Not Started | — | — | — | [#79](https://github.com/project-openan/orchestration-center/issues/79) |
| 28 | Agent Framework: Carrier-Grade High-Reliability Architecture | Agent Framework | Agent Framework | `<TBD>` | Seedcode Ready | Not Started | — | — | — | — |
| 29 | Registry Center Returns Only Published Agents in Semantic Search | Registry Center | Registry Center | `<TBD>` | Coding Progress 70% | Not Started | — | — | — | — |
| 30 | Observability SDK — Three-Layer Observability for Multi-Agent Collaboration | Observability SDK, A2A-T SDK, Agent Framework, Workflow Engine, OpenTelemetry Collector | Observability | `<TBD>` | — | Not Started | — | — | — | — |
| 31 | Knowledge Service Component for Knowledge Construction and Retrieval | Knowledge Service | Knowledge Service | `<TBD>` | M1 Pending TSC Review | Not Started | — | — | — | — |

## 统计口径

- **可转测需求**（Dev Status = Coding Finished / Seedcode Ready）：#1、4、5、7、10、11、13、15、16、17、18、19、20、21、22、27、28（共 17 项）
- **等待开发完成**：#3、6、8、12、24、29、30、31（共 8 项）
- **不在 26.12 测试范围**：#2、9、14、23、25、26（延期 27.06：2 项；Suspended：4 项）
