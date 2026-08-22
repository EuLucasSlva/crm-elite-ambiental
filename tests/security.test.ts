import test from "node:test";
import assert from "node:assert/strict";
import { escapeCsvCell } from "../src/lib/csv";
import { safeInternalPath } from "../src/lib/navigation-security";
import { canTransition } from "../src/lib/service-order-machine";

test("CSV neutraliza fórmulas sem perder o conteúdo", () => {
  assert.equal(escapeCsvCell("=HYPERLINK(\"https://example.test\")"), "\"'=HYPERLINK(\"\"https://example.test\"\")\"");
  assert.equal(escapeCsvCell("+1-1"), "'+1-1");
  assert.equal(escapeCsvCell("Cliente normal"), "Cliente normal");
});

test("redirecionamento pós-login aceita apenas caminhos internos", () => {
  assert.equal(safeInternalPath("/service-orders?view=lista"), "/service-orders?view=lista");
  assert.equal(safeInternalPath("https://example.test"), "/");
  assert.equal(safeInternalPath("//example.test"), "/");
  assert.equal(safeInternalPath("/\\example.test"), "/");
});

test("máquina de estados impede saltos e respeita o perfil", () => {
  assert.equal(canTransition("LEAD_CAPTURED", "QUOTE_APPROVED", "ADMIN").ok, false);
  assert.equal(canTransition("LEAD_CAPTURED", "INSPECTION_SCHEDULED", "MANAGER").ok, true);
  assert.equal(canTransition("LEAD_CAPTURED", "INSPECTION_SCHEDULED", "TECHNICIAN").ok, false);
});

