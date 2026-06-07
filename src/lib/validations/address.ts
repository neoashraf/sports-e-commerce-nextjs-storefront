import { z } from "zod";
import { isValidBdNational } from "@/lib/auth/phone";

/**
 * Address form schema (address-book §7, FR-AUTH-050). The phone field holds the
 * national part (the +880 affix is shown in the UI); composed to E.164 on save.
 */
export const addressFormSchema = z.object({
  recipient_name: z.string().trim().min(1, "Enter the recipient's name."),
  recipient_phone_national: z
    .string()
    .refine(isValidBdNational, "Enter a valid Bangladeshi mobile number."),
  division: z.string().min(1, "Select a division."),
  district: z.string().min(1, "Select a district."),
  area: z.string().min(1, "Select an area."),
  address_line: z.string().trim().min(1, "Enter your street, house, and road."),
  postal_code: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), "Enter a valid 4-digit postal code."),
  is_default: z.boolean(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;
