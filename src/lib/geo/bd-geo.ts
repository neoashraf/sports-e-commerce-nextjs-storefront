/**
 * Minimal BD geo dataset for the Division → District → Area cascading selects
 * (address-book §5). This is a representative SEED, not the authoritative
 * dataset — the full Division/District/Thana list and the delivery-zone mapping
 * (which districts/thanas are near_dhaka) are an OPEN QUESTION pushed to the SRS
 * / CART delivery-zone work (address-book §14). The server resolves the actual
 * `delivery_zone` on save (FR-AUTH-051); this list only drives the pickers.
 */

export interface GeoArea {
  name: string;
}
export interface GeoDistrict {
  name: string;
  areas: string[];
}
export interface GeoDivision {
  name: string;
  districts: GeoDistrict[];
}

export const BD_GEO: GeoDivision[] = [
  {
    name: "Dhaka",
    districts: [
      {
        name: "Dhaka",
        areas: ["Dhanmondi", "Gulshan", "Mirpur", "Mohammadpur", "Uttara", "Banani", "Motijheel"],
      },
      { name: "Gazipur", areas: ["Tongi", "Gazipur Sadar", "Kaliakair"] },
      { name: "Narayanganj", areas: ["Narayanganj Sadar", "Fatullah", "Siddhirganj"] },
      { name: "Savar", areas: ["Savar", "Ashulia"] },
    ],
  },
  {
    name: "Chattogram",
    districts: [
      { name: "Chattogram", areas: ["Kotwali", "Pahartali", "Halishahar", "Agrabad"] },
      { name: "Cox's Bazar", areas: ["Cox's Bazar Sadar", "Teknaf"] },
    ],
  },
  {
    name: "Sylhet",
    districts: [
      { name: "Sylhet", areas: ["Sylhet Sadar", "Zindabazar", "Beanibazar"] },
    ],
  },
  {
    name: "Khulna",
    districts: [
      { name: "Khulna", areas: ["Khulna Sadar", "Sonadanga", "Khalishpur"] },
    ],
  },
  {
    name: "Rajshahi",
    districts: [
      { name: "Rajshahi", areas: ["Rajshahi Sadar", "Boalia", "Motihar"] },
    ],
  },
  {
    name: "Barishal",
    districts: [{ name: "Barishal", areas: ["Barishal Sadar", "Banaripara"] }],
  },
  {
    name: "Rangpur",
    districts: [{ name: "Rangpur", areas: ["Rangpur Sadar", "Mithapukur"] }],
  },
  {
    name: "Mymensingh",
    districts: [{ name: "Mymensingh", areas: ["Mymensingh Sadar", "Trishal"] }],
  },
];

export const DIVISIONS = BD_GEO.map((d) => d.name);

export function districtsOf(division: string): string[] {
  return BD_GEO.find((d) => d.name === division)?.districts.map((x) => x.name) ?? [];
}

export function areasOf(division: string, district: string): string[] {
  return (
    BD_GEO.find((d) => d.name === division)
      ?.districts.find((x) => x.name === district)
      ?.areas ?? []
  );
}
