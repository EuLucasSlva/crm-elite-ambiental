import assert from "node:assert/strict";
import test from "node:test";
import {
  canBeAssignedAsManager,
  canBeAssignedAsTechnician,
} from "../src/lib/service-order-assignees";

test("allows active admins to perform the technician function in a service order", () => {
  assert.equal(canBeAssignedAsTechnician({ active: true, role: "ADMIN" }), true);
});

test("allows every active system role to perform the technician function", () => {
  assert.equal(canBeAssignedAsTechnician({ active: true, role: "MANAGER" }), true);
  assert.equal(canBeAssignedAsTechnician({ active: true, role: "TECHNICIAN" }), true);
});

test("never allows inactive or missing users to be assigned", () => {
  assert.equal(canBeAssignedAsTechnician({ active: false, role: "ADMIN" }), false);
  assert.equal(canBeAssignedAsTechnician(null), false);
  assert.equal(canBeAssignedAsManager({ active: false, role: "MANAGER" }), false);
  assert.equal(canBeAssignedAsManager(undefined), false);
});

test("only active admins and managers can be responsible managers", () => {
  assert.equal(canBeAssignedAsManager({ active: true, role: "ADMIN" }), true);
  assert.equal(canBeAssignedAsManager({ active: true, role: "MANAGER" }), true);
  assert.equal(canBeAssignedAsManager({ active: true, role: "TECHNICIAN" }), false);
});
