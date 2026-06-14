"use client";

import { DIVISIONS, districtsOf, areasOf } from "@/lib/geo/bd-geo";

/**
 * Guest in-flow address form (checkout.md §5 Guest mode). Cascading Division →
 * District → Upazila selects + name/phone/email + street/postal/landmark, styled
 * per the design kit's .co-field / .co-grid2 / .co-grid3 grids.
 */
export interface GuestForm {
  full_name: string;
  phone: string;
  email: string;
  division: string;
  district: string;
  upazila: string;
  street: string;
  postal_code: string;
  landmark: string;
}

export const EMPTY_GUEST: GuestForm = {
  full_name: "", phone: "", email: "", division: "", district: "", upazila: "", street: "", postal_code: "", landmark: "",
};

export function guestValid(g: GuestForm): boolean {
  return !!(g.full_name && g.phone && g.division && g.district && g.upazila && g.street);
}

const fieldCls =
  "h-[46px] w-full rounded-md border border-border-strong px-3 text-body text-ink transition-colors duration-micro ease-out focus:border-volt-600 focus:outline-none focus:shadow-[0_0_0_3px_rgba(166,212,0,0.30)]";

export function GuestAddressForm({ value, onChange }: { value: GuestForm; onChange: (g: GuestForm) => void }) {
  function set<K extends keyof GuestForm>(k: K, v: string) {
    onChange({ ...value, [k]: v });
  }
  function setDivision(v: string) {
    onChange({ ...value, division: v, district: "", upazila: "" });
  }
  function setDistrict(v: string) {
    onChange({ ...value, district: v, upazila: "" });
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Full name">
          <input className={fieldCls} autoComplete="name" placeholder="মোহাম্মদ রহিম" value={value.full_name} onChange={(e) => set("full_name", e.target.value)} />
        </Field>
        <Field label="Phone">
          <div className="flex">
            <span className="inline-flex h-[46px] items-center rounded-l-md border border-r-0 border-border-strong bg-surface-50 px-3 text-body-sm text-text-muted">+880</span>
            <input className={fieldCls + " rounded-l-none"} inputMode="numeric" autoComplete="tel" placeholder="1XXXXXXXXX" value={value.phone} onChange={(e) => set("phone", e.target.value)} />
          </div>
        </Field>
      </div>

      <Field label="Email (optional)">
        <input className={fieldCls} type="email" placeholder="you@example.com" value={value.email} onChange={(e) => set("email", e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Division">
          <select className={fieldCls} value={value.division} onChange={(e) => setDivision(e.target.value)}>
            <option value="">Select</option>
            {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="District">
          <select className={fieldCls} value={value.district} disabled={!value.division} onChange={(e) => setDistrict(e.target.value)}>
            <option value="">Select</option>
            {districtsOf(value.division).map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </Field>
        <Field label="Upazila / Thana">
          <select className={fieldCls} value={value.upazila} disabled={!value.district} onChange={(e) => set("upazila", e.target.value)}>
            <option value="">Select</option>
            {areasOf(value.division, value.district).map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Street / area">
        <input className={fieldCls} placeholder="House, road, area" value={value.street} onChange={(e) => set("street", e.target.value)} />
      </Field>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Postal code (optional)">
          <input className={fieldCls} inputMode="numeric" placeholder="1213" value={value.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
        </Field>
        <Field label="Landmark (optional)">
          <input className={fieldCls} placeholder="Near…" value={value.landmark} onChange={(e) => set("landmark", e.target.value)} />
        </Field>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-body-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
