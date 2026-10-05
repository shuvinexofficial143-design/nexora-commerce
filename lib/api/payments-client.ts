type CashfreeSession = {
  orderId: string;
  paymentSessionId: string;
  mode: "sandbox" | "production";
};

type CashfreeCheckoutResult = {
  error?: { message?: string };
  paymentDetails?: { paymentMessage?: string };
  redirect?: boolean;
};

type CashfreeInstance = {
  checkout: (options: {
    paymentSessionId: string;
    redirectTarget: "_self" | "_blank" | "_modal";
  }) => Promise<CashfreeCheckoutResult>;
};

declare global {
  interface Window {
    Cashfree?: (config: { mode: "sandbox" | "production" }) => CashfreeInstance;
  }
}

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; data?: T; error?: string }
    | null;

  if (!response.ok || !payload?.ok || payload.data === undefined) {
    throw new Error(payload?.error || "Payment request failed.");
  }

  return payload.data;
}

export function createCashfreeSession(orderNumber: string, email: string) {
  return jsonRequest<CashfreeSession>("/api/payments/cashfree/create", {
    method: "POST",
    body: JSON.stringify({ orderNumber, email }),
  });
}

let sdkPromise: Promise<void> | null = null;

function loadCashfreeSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cashfree checkout requires a browser."));
  }
  if (window.Cashfree) return Promise.resolve();
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://sdk.cashfree.com/js/v3/cashfree.js"]',
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Could not load Cashfree checkout.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Cashfree checkout."));
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export async function openCashfreeCheckout(session: CashfreeSession) {
  await loadCashfreeSdk();

  if (!window.Cashfree) {
    throw new Error("Cashfree checkout did not initialize.");
  }

  const cashfree = window.Cashfree({ mode: session.mode });
  const result = await cashfree.checkout({
    paymentSessionId: session.paymentSessionId,
    redirectTarget: "_self",
  });

  if (result?.error) {
    throw new Error(result.error.message || "Cashfree checkout could not start.");
  }

  return result;
}

export function verifyCashfreePayment(orderNumber: string) {
  return jsonRequest<{
    orderNumber: string;
    state: "SUCCESS" | "PENDING" | "FAILED";
    paymentStatus: string;
    orderStatus: string;
    cfPaymentId: string | null;
  }>(`/api/payments/cashfree/status?order=${encodeURIComponent(orderNumber)}`, {
    cache: "no-store",
  });
}
