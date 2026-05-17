export const ACCOUNT_OPTIONS = ["Cash", "Bank"];
export const MAX_TRANSACTION_AMOUNT = 10000000;
export const MAX_NOTE_LENGTH = 160;

export function parseAmount(value) {
  const raw = String(value ?? "").trim();
  const cleaned = raw.replace(/rs\.?/gi, "").replace(/,/g, "").trim();

  if (!cleaned) {
    return { value: 0, error: "Amount is required." };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    return {
      value: 0,
      error: "Enter a valid amount with up to 2 decimal places.",
    };
  }

  const amount = Number(cleaned);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { value: 0, error: "Amount must be greater than Rs. 0." };
  }

  if (amount > MAX_TRANSACTION_AMOUNT) {
    return {
      value: 0,
      error: `Amount cannot be more than Rs. ${MAX_TRANSACTION_AMOUNT.toLocaleString()}.`,
    };
  }

  return { value: amount, error: "" };
}

export function normalizeCategory(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function toApiIso(dateStr) {
  const isoDateOnly = /^\d{4}-\d{2}-\d{2}$/;

  if (typeof dateStr === "string" && isoDateOnly.test(dateStr)) {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0).toISOString();
  }

  return new Date(dateStr).toISOString();
}

export function validateTransactionForm(form, type, options = {}) {
  const errors = {};
  const normalized = {};
  const amountResult = parseAmount(form.amount);

  if (amountResult.error) {
    errors.amount = amountResult.error;
  } else {
    normalized.amount = amountResult.value;
  }

  if (!form.date) {
    errors.date = "Date is required.";
  } else {
    const date = new Date(`${form.date}T12:00:00`);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (Number.isNaN(date.getTime())) {
      errors.date = "Enter a valid date.";
    } else if (date > today) {
      errors.date = "Date cannot be in the future.";
    } else {
      normalized.date = form.date;
      normalized.isoDate = toApiIso(form.date);
    }
  }

  const category = normalizeCategory(form.category);
  if (!category) {
    errors.category = "Category is required.";
  } else if (category.length < 2) {
    errors.category = "Category must be at least 2 characters.";
  } else if (category.length > 40) {
    errors.category = "Category must be 40 characters or less.";
  } else if (!/^[a-zA-Z0-9][a-zA-Z0-9\s&'/-]*$/.test(category)) {
    errors.category = "Use letters, numbers, spaces, &, /, ' or - only.";
  } else {
    normalized.category = category;
  }

  if (!ACCOUNT_OPTIONS.includes(form.account)) {
    errors.account = "Choose Cash or Bank.";
  } else {
    normalized.account = form.account;
  }

  const note = String(form.note ?? "").trim().replace(/\s+/g, " ");
  if (note.length > MAX_NOTE_LENGTH) {
    errors.note = `Note must be ${MAX_NOTE_LENGTH} characters or less.`;
  } else {
    normalized.note = note;
  }

  if (
    type === "Expense" &&
    typeof options.availableBalance === "number" &&
    Number.isFinite(options.availableBalance) &&
    amountResult.value > options.availableBalance
  ) {
    errors.amount = `Expense cannot exceed wallet balance of Rs. ${options.availableBalance.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    values: normalized,
  };
}
