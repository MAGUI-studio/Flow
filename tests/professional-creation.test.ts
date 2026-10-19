import { test } from "node:test";
import assert from "node:assert/strict";
import { professionalCreationSchema } from "../src/lib/form-schemas";
import { emptyWeeklySchedule } from "../src/lib/weekly-schedule";
test("professional registration requires at least one working day with valid intervals",()=>{
 const schedule=emptyWeeklySchedule();
 assert.equal(professionalCreationSchema.safeParse({name:"Marina"}).success,false);
 assert.equal(professionalCreationSchema.safeParse({name:"Marina",...schedule}).success,false);
 schedule.days[0].enabled=true;
 assert.equal(professionalCreationSchema.safeParse({name:"Marina",...schedule}).success,true);
 schedule.days[0].intervals=[];
 assert.equal(professionalCreationSchema.safeParse({name:"Marina",...schedule}).success,false);
 schedule.days[0].intervals=[{start:"18:00",end:"09:00"}];
 assert.equal(professionalCreationSchema.safeParse({name:"Marina",...schedule}).success,false);
});
