import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatPhone, interpolateMessage, isOptOutKeyword, normalizePhone, parseCsv } from "../src/lib/phone";

describe("phone", () => {
  it("normaliza celular brasileiro", () => {
    assert.equal(normalizePhone("(92) 94000-1001"), "5592940001001");
    assert.equal(normalizePhone("11940001002"), "5511940001002");
    assert.equal(normalizePhone("92 4000-1003"), "5592940001003");
    assert.equal(normalizePhone("abc"), null);
  });

  it("formata e interpola", () => {
    assert.equal(formatPhone("5592940001001"), "+55 (92) 94000-1001");
    assert.equal(
      interpolateMessage("Oi {{primeiro_nome}} da {{empresa}}", { name: "Ana Souza", company: "Norte Digital" }),
      "Oi Ana da Norte Digital",
    );
  });

  it("reconhece descadastro e CSV", () => {
    assert.equal(isOptOutKeyword("SAIR"), true);
    assert.equal(isOptOutKeyword("parar agora"), true);
    assert.equal(isOptOutKeyword("quero proposta"), false);
    const rows = parseCsv("nome,telefone\nAna,11940001001");
    assert.equal(rows[0].name, "Ana");
    assert.equal(rows[0].phone, "11940001001");
  });
});
