import { config } from "dotenv";
import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { Pool } from "pg";
import Stripe from "stripe";
import { prepareBillingChange } from "../src/lib/billing-change";
config({ path: ".env.local", quiet: true });

test(
  "Stripe test subscriptions synchronize trials, plan changes, limits, renewal, cancellation and delayed events in PostgreSQL",
  { timeout: 300000 },
  async () => {
    assert.match(process.env.STRIPE_SECRET_KEY ?? "", /^(sk|rk)_test_/);
    const database = new URL(process.env.DATABASE_URL!);
    assert.ok(
      ["localhost", "127.0.0.1"].includes(database.hostname),
      "This test only runs against local PostgreSQL.",
    );
    const schema = `billing_test_${randomUUID().replaceAll("-", "")}`;
    const admin = new Pool({ connectionString: database.toString(), max: 1 });
    database.searchParams.set("options", `-c search_path=${schema},public`);
    process.env.DATABASE_URL = database.toString();
    const { db } = await import("../src/lib/db");
    const { POST } = await import("../src/app/api/billing/webhook/route");
    const pool = db();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2026-09-30.endive",
    });
    const owner = `billing_qa_${randomUUID()}`;
    let customer: Stripe.Customer | undefined;
    let remote: Stripe.Subscription | undefined;
    let renewalCustomer: Stripe.Customer | undefined;
    let renewalSubscription: Stripe.Subscription | undefined;
    let clock: Stripe.TestHelpers.TestClock | undefined;
    const eventIds: string[] = [];
    async function deliver(
      type: string,
      object: unknown,
      id = `evt_qa_${randomUUID()}`,
    ) {
      eventIds.push(id);
      const payload = JSON.stringify({
        id,
        object: "event",
        type,
        data: { object },
      });
      const signature = stripe.webhooks.generateTestHeaderString({
        payload,
        secret: process.env.STRIPE_WEBHOOK_SECRET!,
      });
      const response = await POST(
        new Request("http://localhost/api/billing/webhook", {
          method: "POST",
          body: payload,
          headers: { "stripe-signature": signature },
        }),
      );
      assert.equal(response.status, 200, `${type}: ${await response.text()}`);
      return id;
    }
    async function local() {
      return (
        await pool.query("SELECT * FROM subscriptions WHERE owner_id=$1", [
          owner,
        ])
      ).rows[0];
    }
    async function change(plan: "basic" | "multi", token?: string) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await prepareBillingChange(
          client,
          stripe,
          owner,
          plan,
          token,
        );
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    }
    try {
      await admin.query(`CREATE SCHEMA ${schema}`);
      for (const migration of (
        await readdir(new URL("../prisma/migrations/", import.meta.url))
      )
        .filter((name) => /^\d/.test(name))
        .sort()) {
        await pool.query(
          await readFile(
            new URL(
              `../prisma/migrations/${migration}/migration.sql`,
              import.meta.url,
            ),
            "utf8",
          ),
        );
      }
      await pool.query("INSERT INTO accounts(id) VALUES($1)", [owner]);
      customer = await stripe.customers.create({
        name: "Flow disposable billing verification",
        metadata: { flowVerification: schema },
      });
      const payment = await stripe.paymentMethods.attach("pm_card_visa", {
        customer: customer.id,
      });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: payment.id },
      });
      remote = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: process.env.STRIPE_PRICE_BASIC! }],
        trial_period_days: 7,
        metadata: { flowUserId: owner },
      });
      const createdEvent = await deliver(
        "customer.subscription.created",
        remote,
      );
      let sub = await local();
      assert.equal(sub.status, "active");
      assert.equal(sub.plan, "basic");
      assert.equal(
        new Date(sub.paid_until).getTime(),
        remote.trial_end! * 1000,
      );
      await deliver("customer.subscription.created", remote, createdEvent);
      assert.equal(
        (
          await pool.query(
            "SELECT count(*)::int AS count FROM stripe_events WHERE id=$1",
            [createdEvent],
          )
        ).rows[0].count,
        1,
      );
      const trialQuote = await change("multi");
      assert.ok("token" in trialQuote);
      assert.equal(trialQuote.amountDue, 0);
      await change("multi", trialQuote.token);
      assert.equal((await local()).plan, "multi");
      remote = await stripe.subscriptions.retrieve(remote.id);
      assert.equal(remote.status, "trialing");
      remote = await stripe.subscriptions.update(remote.id, {
        cancel_at: remote.trial_end!,
      });
      await deliver("customer.subscription.updated", remote);
      assert.equal((await local()).cancel_at_period_end, true);
      await assert.rejects(change("basic"), /BILLING_CHANGE_UNAVAILABLE/);
      remote = await stripe.subscriptions.update(remote.id, { cancel_at: "" });
      await deliver("customer.subscription.updated", remote);
      assert.equal((await local()).cancel_at_period_end, false);
      const firstUnit = (
        await pool.query(
          "INSERT INTO establishments(owner_id,slug,name) VALUES($1,'qa-one','QA One') RETURNING id",
          [owner],
        )
      ).rows[0].id;
      const secondUnit = (
        await pool.query(
          "INSERT INTO establishments(owner_id,slug,name) VALUES($1,'qa-two','QA Two') RETURNING id",
          [owner],
        )
      ).rows[0].id;
      await assert.rejects(change("basic"), /DOWNGRADE_SELECTION_REQUIRED/);
      await pool.query("DELETE FROM establishments WHERE id=$1", [secondUnit]);
      await pool.query(
        "INSERT INTO professionals(establishment_id,name) SELECT $1,'QA ' || n FROM generate_series(1,11) AS n",
        [firstUnit],
      );
      await assert.rejects(change("basic"), /PROFESSIONAL_DOWNGRADE_REQUIRED/);
      await pool.query("DELETE FROM professionals WHERE establishment_id=$1", [
        firstUnit,
      ]);
      const downQuote = await change("basic");
      assert.ok("token" in downQuote);
      await change("basic", downQuote.token);
      assert.equal((await local()).plan, "basic");
      await assert.rejects(
        change("multi", trialQuote.token),
        /BILLING_QUOTE_EXPIRED/,
      );
      remote = await stripe.subscriptions.update(remote.id, {
        trial_end: "now",
      });
      // Stripe may finalize the first invoice asynchronously after ending a trial.
      let invoice =
        typeof remote.latest_invoice === "string"
          ? await stripe.invoices.retrieve(remote.latest_invoice)
          : remote.latest_invoice;
      if (invoice?.status === "draft")
        invoice = await stripe.invoices.finalizeInvoice(invoice.id);
      if (invoice?.status === "open")
        invoice = await stripe.invoices.pay(invoice.id);
      assert.equal(invoice?.status, "paid");
      await deliver("invoice.paid", invoice);
      assert.equal((await local()).status, "active");
      const paidQuote = await change("multi");
      assert.ok("token" in paidQuote);
      assert.ok((paidQuote.amountDue ?? 0) > 0);
      const refusedUpgradeCard = await stripe.paymentMethods.attach(
        "pm_card_chargeCustomerFail",
        { customer: customer.id },
      );
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: refusedUpgradeCard.id },
      });
      const upgraded = await change("multi", paidQuote.token);
      assert.ok("pending" in upgraded && upgraded.pending);
      assert.equal(
        (await local()).plan,
        "basic",
        "Unpaid upgrades must not grant PRO features.",
      );
      const pendingRemote = await stripe.subscriptions.retrieve(remote.id);
      const pendingInvoiceId =
        typeof pendingRemote.latest_invoice === "string"
          ? pendingRemote.latest_invoice
          : pendingRemote.latest_invoice!.id;
      const upgradePaid = await stripe.invoices.pay(pendingInvoiceId, {
        payment_method: payment.id,
      });
      await stripe.customers.update(customer.id, {
        invoice_settings: { default_payment_method: payment.id },
      });
      await deliver("invoice.paid", upgradePaid);
      assert.equal((await local()).plan, "multi");
      remote = await stripe.subscriptions.update(remote.id, {
        cancel_at_period_end: true,
      });
      await deliver("customer.subscription.updated", remote);
      assert.equal((await local()).cancel_at_period_end, true);
      await assert.rejects(change("basic"), /BILLING_CHANGE_UNAVAILABLE/);
      const old = remote;
      remote = await stripe.subscriptions.cancel(remote.id);
      await deliver("customer.subscription.deleted", remote);
      assert.equal((await local()).status, "canceled");
      await deliver("customer.subscription.updated", old);
      assert.equal((await local()).status, "canceled");
      remote = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: process.env.STRIPE_PRICE_BASIC! }],
        metadata: { flowUserId: owner },
      });
      await deliver("customer.subscription.created", remote);
      assert.equal((await local()).stripe_subscription_id, remote.id);
      await deliver("customer.subscription.deleted", old);
      assert.equal((await local()).stripe_subscription_id, remote.id);
      // A separate test clock verifies actual time-based renewal and failed-payment recovery.
      const renewalOwner = `${owner}_renewal`;
      await pool.query("INSERT INTO accounts(id) VALUES($1)", [renewalOwner]);
      clock = await stripe.testHelpers.testClocks.create({
        frozen_time: Math.floor(Date.now() / 1000),
        name: "Flow disposable renewal verification",
      });
      renewalCustomer = await stripe.customers.create({
        test_clock: clock.id,
        name: "Flow renewal verification",
      });
      const renewalCard = await stripe.paymentMethods.attach("pm_card_visa", {
        customer: renewalCustomer.id,
      });
      await stripe.customers.update(renewalCustomer.id, {
        invoice_settings: { default_payment_method: renewalCard.id },
      });
      renewalSubscription = await stripe.subscriptions.create({
        customer: renewalCustomer.id,
        items: [{ price: process.env.STRIPE_PRICE_BASIC! }],
        trial_period_days: 7,
        metadata: { flowUserId: renewalOwner },
      });
      await deliver("customer.subscription.created", renewalSubscription);
      async function advance(to: number) {
        await stripe.testHelpers.testClocks.advance(clock!.id, {
          frozen_time: to,
        });
        for (let attempt = 0; attempt < 80; attempt++) {
          const current = await stripe.testHelpers.testClocks.retrieve(
            clock!.id,
          );
          if (current.status === "ready") return;
          await new Promise((resolve) => setTimeout(resolve, 750));
        }
        throw new Error("Test clock did not settle.");
      }
      async function renewalInvoice() {
        renewalSubscription = await stripe.subscriptions.retrieve(
          renewalSubscription!.id,
        );
        const invoiceId =
          typeof renewalSubscription.latest_invoice === "string"
            ? renewalSubscription.latest_invoice
            : renewalSubscription.latest_invoice!.id;
        return stripe.invoices.retrieve(invoiceId);
      }
      await advance(renewalSubscription.trial_end! + 7200);
      let recurringInvoice = await renewalInvoice();
      if (recurringInvoice.status === "draft")
        recurringInvoice = await stripe.invoices.finalizeInvoice(
          recurringInvoice.id,
        );
      if (recurringInvoice.status === "open")
        recurringInvoice = await stripe.invoices.pay(recurringInvoice.id);
      assert.equal(recurringInvoice.status, "paid");
      await deliver("invoice.paid", recurringInvoice);
      const firstPaidUntil = (
        await pool.query(
          "SELECT paid_until FROM subscriptions WHERE owner_id=$1",
          [renewalOwner],
        )
      ).rows[0].paid_until;
      await advance(
        renewalSubscription!.items.data[0].current_period_end + 7200,
      );
      recurringInvoice = await renewalInvoice();
      if (recurringInvoice.status === "draft")
        recurringInvoice = await stripe.invoices.finalizeInvoice(
          recurringInvoice.id,
        );
      if (recurringInvoice.status === "open")
        recurringInvoice = await stripe.invoices.pay(recurringInvoice.id);
      assert.equal(recurringInvoice.status, "paid");
      await deliver("invoice.paid", recurringInvoice);
      const nextPaidUntil = (
        await pool.query(
          "SELECT paid_until FROM subscriptions WHERE owner_id=$1",
          [renewalOwner],
        )
      ).rows[0].paid_until;
      assert.ok(new Date(nextPaidUntil) > new Date(firstPaidUntil));
      const declined = await stripe.paymentMethods.attach(
        "pm_card_chargeCustomerFail",
        { customer: renewalCustomer.id },
      );
      await stripe.customers.update(renewalCustomer.id, {
        invoice_settings: { default_payment_method: declined.id },
      });
      await advance(
        renewalSubscription!.items.data[0].current_period_end + 7200,
      );
      recurringInvoice = await renewalInvoice();
      if (recurringInvoice.status === "draft")
        recurringInvoice = await stripe.invoices.finalizeInvoice(
          recurringInvoice.id,
        );
      if (recurringInvoice.status === "open")
        await stripe.invoices.pay(recurringInvoice.id).catch(() => {});
      await deliver("invoice.payment_failed", recurringInvoice);
      assert.equal(
        (
          await pool.query(
            "SELECT status FROM subscriptions WHERE owner_id=$1",
            [renewalOwner],
          )
        ).rows[0].status,
        "past_due",
      );
      await stripe.customers.update(renewalCustomer.id, {
        invoice_settings: { default_payment_method: renewalCard.id },
      });
      recurringInvoice = await stripe.invoices.pay(recurringInvoice.id, {
        payment_method: renewalCard.id,
      });
      await deliver("invoice.paid", recurringInvoice);
      assert.equal(
        (
          await pool.query(
            "SELECT status FROM subscriptions WHERE owner_id=$1",
            [renewalOwner],
          )
        ).rows[0].status,
        "active",
      );
      console.log(
        "Verified against Stripe test API and isolated PostgreSQL: trial access, signed webhooks, deduplication, upgrade/downgrade, capacity guards, first paid invoice, proration, scheduled cancellation, cancellation, resubscription and delayed events.",
      );
    } finally {
      if (clock)
        await stripe.testHelpers.testClocks.del(clock.id).catch(() => {});
      if (remote && remote.status !== "canceled")
        await stripe.subscriptions.cancel(remote.id).catch(() => {});
      if (customer) await stripe.customers.del(customer.id).catch(() => {});
      await pool.end();
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    }
  },
);
