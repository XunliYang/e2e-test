# OpenAN 集成测试工作组 Wiki 首页介绍

> 用途：OpenAN 集成测试工作组 wiki 首页（Confluence）简要介绍
> 说明：格式参考 TSC 页面（一句话定位→会议安排→单行链接→冒号式标题→成员表）；成员为占位符，按实际补充；职责条目取自《Integration Testing Process and Framework》§3

---

## 中文版

# OpenAN 集成测试工作组（Integration Testing Working Group）

OpenAN 集成测试工作组负责社区统一的集成测试质量保障体系，确保各工作组交付可集成的代码，并在版本发布前完成系统级质量验证。工作组会议对社区公开。

*会议安排：**待定***

[**TSC邮件列表**](https://lists.openan.dev/g/tsc) | [**GitHub**](https://github.com/project-openan/openan-itest) | [**Zulip**](https://linuxfoundation.zulipchat.com)

## 职责范围：

- 制定并维护集成测试流程规范：[集成测试流程及框架](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1544945667/OpenAN+Integration+Testing+Process+and+Framework)、测试 Checklist、测试方案/用例/报告模板
- 组织测试方案与测试报告评审（TRR 决策、FIT 准出、发布质量评审）
- 执行 SIT 系统级集成测试与专项测试（性能、长稳、可靠性、安全、兼容性、A2A-T 协议专项测试等）
- 维护 `openan-itest` 测试仓库与自动化测试框架，为各特性 WG 提供用例模板与自动化支持
- 保障与核验测试环境，与 Infra WG 协作维护 CI 流水线与质量门禁
- 汇总各特性 WG 质量数据和出具版本测试报告，为 TSC 发布决策（Go/No-Go）提供输入

## 测试时间线（版本周期）：

> 各阶段前置条件、操作流程、工作组任务分工、交付物与验收内容的详细流程见《[集成测试流程及框架](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1544945667/OpenAN+Integration+Testing+Process+and+Framework)》§4.3。

**OpenAN 26.12 测试时间线**（依据 [OpenAN 26.12 发布计划](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1187905545/OpenAN+26.12)，2026-12-23 发布；以下为按发布日倒推的建议排期，以版本测试计划为准）：

```mermaid
gantt
    title OpenAN 26.12 测试时间线
    dateFormat YYYY-MM-DD
    axisFormat %m-%d
    todayMarker off
    section 转测
    转测（TRR） :trr, 2026-10-26, 2026-11-15
    section 执行
    需求测试验收 :fit, 2026-11-02, 2026-11-22
    section 回归与发布
    RC-0 :rc0, 2026-11-23, 2026-12-08
    RC-1 :rc1, 2026-12-09, 2026-12-22
    版本发布 :milestone, 2026-12-23, 0d
```

| 阶段 | 时间点 | 特性工作组交付物 | 集成测试工作组交付物 |
|------|--------|----------------|---------------------|
| **转测（TRR）** | 特性开发完成后 | 测试方案、测试用例表、FIT 自动化测试用例 | 转测评审意见与 TRR 结论 |
| **FIT 全量自测与需求验收** | 转测评审通过后 | FIT 自测报告 | SIT 冒烟结果与需求验收结论 |
| **RC-0** | 特性冻结、镜像包构建完成后 | P0/P1 缺陷闭环记录 | RC-0 测试报告（全量 FIT/SIT 回归 + 专项测试启动） |
| **RC-1** | RC-0 修复完成后 | 遗留问题清单与风险接受 | RC-1 测试报告与质量数据汇总（Go/No-Go 输入） |

## 当前工作组成员：

| 角色 | 姓名 | LF ID |
|------|------|-------|
| Lead | Xunli Yang | @Xunli Yang |
| 成员 | Junjie Huang | @Junjie Huang |
| 成员 |  |  |

## 当前行动项：

1. 创建 GitHub 仓库 `openan-itest`
2. 组建工作组，欢迎大家加入：承担特性工作组测试负责、测试 CI 负责、专项测试工作
3. 启动需求转测工作和需求验收：特性工作组提供 FIT 用例和全量回归用例
4. 测试 CI 逐步完善，CI 日构建将在 27.06 版本完成

## 会议纪要：

`<会议纪要列表待补充>`

---

## English Version

# OpenAN Integration Testing Working Group

The Integration Testing WG owns the community-wide integration testing quality system, ensuring every working group delivers integrable code and that release-level quality is verified before each release. WG meetings are open to the community.

*Meeting schedule: **TBD***

[**TSC Mailing List**](https://lists.openan.dev/g/tsc) | [**GitHub**](https://github.com/project-openan/openan-itest) | [**Zulip**](https://linuxfoundation.zulipchat.com)

## Scope:

- Own and maintain the [Integration Testing Process and Framework](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1544945667/OpenAN+Integration+Testing+Process+and+Framework), test checklists, and plan/case/report templates
- Organize test plan and report reviews (TRR decisions, FIT exit, release quality review)
- Execute SIT and specialized testing (performance, stability, reliability, security, compatibility, specialized A2A-T protocol testing, etc.)
- Maintain the `openan-itest` repository and the automation framework; provide case templates and automation support to feature WGs
- Provide and verify test environments; maintain CI pipelines and quality gates jointly with the Infra WG
- Aggregate quality data across feature WGs and produce the version test report as input to TSC Go/No-Go release decisions

## Test Timeline (per release cycle):

> The detailed process (entry conditions, workflows, WG task division, deliverables and acceptance criteria per phase) is defined in the [Integration Testing Process and Framework](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1544945667/OpenAN+Integration+Testing+Process+and+Framework) §4.3.

**OpenAN 26.12 Test Timeline** (per the [OpenAN 26.12 release plan](https://lf-networking.atlassian.net/wiki/spaces/OpenAN/pages/1187905545/OpenAN+26.12), release on 2026-12-23; dates below are back-planned proposals and follow the release test plan):

```mermaid
gantt
    title OpenAN 26.12 Test Timeline
    dateFormat YYYY-MM-DD
    axisFormat %m-%d
    todayMarker off
    section Handover
    Handover (TRR) :trr, 2026-10-26, 2026-11-15
    section Execution
    Requirement Test Acceptance :fit, 2026-11-02, 2026-11-22
    section Regression and Release
    RC-0 :rc0, 2026-11-23, 2026-12-08
    RC-1 :rc1, 2026-12-09, 2026-12-22
    Release :milestone, 2026-12-23, 0d
```

| Phase | Timing | Feature WG deliverables | Integration Testing WG deliverables |
|-------|--------|------------------------|--------------------------------------|
| **Handover (TRR)** | After feature development | Test plan, test case table, FIT automated cases | Review comments and TRR conclusion |
| **FIT Full Self-Test & Requirement Acceptance** | After TRR review passed | FIT self-test report | SIT smoke results and requirement acceptance conclusion |
| **RC-0** | After feature freeze and image build | P0/P1 defect closure records | RC-0 test report (full FIT/SIT regression + specialized testing started) |
| **RC-1** | After RC-0 fixes | Residual issue list with risk acceptance | RC-1 test report and quality data summary (Go/No-Go input) |

## Current WG Members:

| Role | Name | LF ID |
|------|------|-------|
| Lead | Xunli Yang | @Xunli Yang |
| Member | Junjie Huang | @Junjie Huang |
| Member |  |  |

## Current Action Items:

1. Create the GitHub repository `openan-itest`
2. Form the working group — everyone is welcome to join: take on feature WG test ownership, test CI ownership, and specialized testing work
3. Kick off the requirement handover and requirement acceptance work: feature WGs provide FIT cases and full regression cases
4. Gradually improve the test CI; the CI daily build will be completed in the 27.06 release

## Meeting Minutes:

`<TBD>`
