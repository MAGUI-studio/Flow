import {test} from "node:test";
import assert from "node:assert/strict";
import {arrivalAvailable} from "../src/lib/arrival-rules";
test("arrival opens exactly one hour before appointment regardless of timezone",()=>{
 const start="2026-10-20T10:00:00-03:00";
 assert.equal(arrivalAvailable(start,new Date("2026-10-20T11:59:59.999Z")),false);
 assert.equal(arrivalAvailable(start,new Date("2026-10-20T12:00:00Z")),true);
 assert.equal(arrivalAvailable(start,new Date("2026-10-20T12:50:00Z")),true);
});
