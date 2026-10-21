import assert from "node:assert/strict";
import test from "node:test";
import { multiVendorEnabled, publicCustomerAuthEnabled } from "../lib/config/features";
import { deploymentInfo, getPublicAppUrl } from "../lib/config/runtime";

const KEYS = ["NEXT_PUBLIC_APP_URL", "VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_URL", "VERCEL_ENV", "VERCEL_GIT_COMMIT_SHA", "PUBLIC_CUSTOMER_AUTH_ENABLED", "MULTI_VENDOR_ENABLED"] as const;

function withEnv(action: () => void) {
  const saved = Object.fromEntries(KEYS.map((key) => [key, process.env[key]]));
  try {
    for (const key of KEYS) delete process.env[key];
    action();
  } finally {
    for (const key of KEYS) {
      const value = saved[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("app URL defaults to localhost when no deployment information is set", () => {
  withEnv(() => assert.equal(getPublicAppUrl(), "http://localhost:3000"));
});

test("explicit URL overrides deployment domains and strips trailing slash", () => {
  withEnv(() => {
    process.env.VERCEL_URL = "preview.vercel.app";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "shop.example.com";
    process.env.NEXT_PUBLIC_APP_URL = "https://custom.example.com/";
    assert.equal(getPublicAppUrl(), "https://custom.example.com");
  });
});

test("production URL has priority over preview URL and receives HTTPS", () => {
  withEnv(() => {
    process.env.VERCEL_URL = "preview.vercel.app";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "https://shop.example.com/";
    assert.equal(getPublicAppUrl(), "https://shop.example.com");
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    assert.equal(getPublicAppUrl(), "https://preview.vercel.app");
  });
});

test("deployment metadata exposes only the shortened commit reference", () => {
  withEnv(() => {
    process.env.VERCEL_ENV = "preview";
    process.env.VERCEL_GIT_COMMIT_SHA = "1234567890abcdef";
    assert.deepEqual(deploymentInfo(), { appUrl: "http://localhost:3000", environment: "preview", commit: "12345678" });
  });
});

test("disabled-by-default feature flags enable only with the literal true value", () => {
  withEnv(() => {
    assert.equal(publicCustomerAuthEnabled(), false);
    assert.equal(multiVendorEnabled(), false);
    process.env.PUBLIC_CUSTOMER_AUTH_ENABLED = "true";
    process.env.MULTI_VENDOR_ENABLED = "TRUE";
    assert.equal(publicCustomerAuthEnabled(), true);
    assert.equal(multiVendorEnabled(), false);
    process.env.MULTI_VENDOR_ENABLED = "true";
    assert.equal(multiVendorEnabled(), true);
  });
});
