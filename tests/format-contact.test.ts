import { test } from "node:test";
import assert from "node:assert/strict";
import { formatContact } from "../src/lib/format-contact";
test("agenda formats national and international Brazilian numbers without truncating foreign contacts",()=>{
 assert.equal(formatContact("+5511999990000"),"(11) 99999-0000");
 assert.equal(formatContact("11999990000"),"(11) 99999-0000");
 assert.equal(formatContact("+551133334444"),"(11) 3333-4444");
 assert.equal(formatContact("+442079460000"),"+442079460000");
 assert.equal(formatContact(null),"—");
});
