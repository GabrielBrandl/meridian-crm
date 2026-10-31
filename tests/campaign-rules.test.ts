import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  campaignMetrics,
  nextDelayMs,
  remainingDailyQuota,
  resolveAudience,
  shouldPauseForErrors,
  uniqueByPhone,
} from "../src/lib/campaign-rules";

describe("regras de campanha", () => {
  const contacts = [
    { id: "1", phone: "5511940001001", opt_in: 1, blocked: 0, tags: ["hot"], stage_id: "a" },
    { id: "2", phone: "5511940001002", opt_in: 0, blocked: 0, tags: ["hot"], stage_id: "a" },
    { id: "3", phone: "5511940001001", opt_in: 1, blocked: 0, tags: ["cold"], stage_id: "b" },
    { id: "4", phone: "5511940001004", opt_in: 1, blocked: 1, tags: ["hot"], stage_id: "a" },
  ];

  it("filtra opt-in, bloqueados, tag e etapa", () => {
    const result = resolveAudience(contacts, { tagIds: ["hot"], stageId: "a", onlyOptIn: true });
    assert.deepEqual(result.map((c) => c.id), ["1"]);
  });

  it("remove telefone duplicado e aplica cotas", () => {
    assert.equal(uniqueByPhone(contacts).length, 3);
    assert.equal(remainingDailyQuota(240, 250), 10);
    assert.equal(shouldPauseForErrors(3, 10, 25), true);
    assert.equal(shouldPauseForErrors(1, 10, 25), false);
    assert.ok(nextDelayMs({ messages_per_minute: 12, min_interval_seconds: 4, jitter_seconds: 0 }) >= 5000);
  });

  it("calcula métricas de campanha", () => {
    const metrics = campaignMetrics([
      { status: "sent" },
      { status: "delivered" },
      { status: "replied" },
      { status: "failed" },
    ]);
    assert.equal(metrics.sent, 3);
    assert.equal(metrics.replied, 1);
    assert.equal(metrics.replyRate, 33);
  });
});
