import { describe, expect, it } from "vitest";
import { getRentalDays, getTodayInBrisbane, isValidDate, validateDateRange } from "@/lib/dates";
import { calculateRentalTotal } from "@/lib/rental-calculation";
import { getCustomerNameError, MAX_CUSTOMER_NAME_LENGTH } from "@/lib/customer-name";

describe("calendar dates", () => {
  it.each([
    ["2030-09-10", true], ["2028-02-29", true], ["2030-02-29", false],
    ["2030-02-30", false], ["2030-13-01", false], ["2030-9-1", false],
    ["2030-09-10T00:00:00Z", false], ["", false],
  ])("validates %s as %s", (date, valid) => expect(isValidDate(date)).toBe(valid));

  it.each([
    ["", "2030-09-13", "start_date"], ["2030-09-10", "", "end_date"],
    ["2030-09-09", "2030-09-13", "start_date"],
    ["2030-09-10", "2030-09-10", "end_date"],
    ["2030-09-13", "2030-09-10", "end_date"],
  ])("rejects range %s to %s at %s", (start, end, field) => {
    const result = validateDateRange(start, end, "2030-09-10");
    expect(result).toMatchObject({ valid: false, errors: { [field]: expect.any(String) } });
  });

  it("accepts today and calculates complete rental days", () => {
    expect(validateDateRange("2030-09-10", "2030-09-13", "2030-09-10")).toEqual({ valid: true, days: 3 });
    expect(getRentalDays("2028-02-28", "2028-03-01")).toBe(2);
    expect(getRentalDays("2000-01-01", "2000-01-04")).toBe(3);
    expect(() => getRentalDays("bad", "2030-09-13")).toThrow(RangeError);
    expect(() => getRentalDays("2030-09-10", "2030-09-10")).toThrow(RangeError);
  });

  it("changes the Brisbane calendar day at UTC 14:00", () => {
    expect(getTodayInBrisbane(new Date("2030-09-09T13:59:59Z"))).toBe("2030-09-09");
    expect(getTodayInBrisbane(new Date("2030-09-09T14:00:00Z"))).toBe("2030-09-10");
  });
});

describe("rental totals", () => {
  it.each([[65, 1, 65], [65, 3, 195], [19.99, 3, 59.97], [0.1, 3, 0.3]])(
    "%s per day for %s days totals %s", (rate, days, total) => expect(calculateRentalTotal(rate, days)).toBe(total),
  );
  it.each([[-1, 3], [Infinity, 3], [65, 0], [65, 1.5], [Number.MAX_SAFE_INTEGER, 3]])(
    "rejects unsupported rate %s or duration %s", (rate, days) => expect(() => calculateRentalTotal(rate, days)).toThrow(RangeError),
  );
});

it("validates customer names without imposing an alphabet or naming convention", () => {
  expect(getCustomerNameError("   ")).toBe("Enter your name.");
  expect(getCustomerNameError("  Ana María O’Neil  ")).toBeNull();
  expect(getCustomerNameError("李")).toBeNull();
  expect(getCustomerNameError("a".repeat(MAX_CUSTOMER_NAME_LENGTH))).toBeNull();
  expect(getCustomerNameError("a".repeat(MAX_CUSTOMER_NAME_LENGTH + 1))).not.toBeNull();
});
