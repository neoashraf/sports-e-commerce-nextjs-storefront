import type { Metadata } from "next";
import { LeadForm } from "@/components/leads/LeadForm";

export const metadata: Metadata = {
  title: "Get help",
  description: "Contact SportShop BD — questions, order issues, claims and returns.",
};

/** Get Help / Contact — `/help` (lead-form-fe). Hosts the reusable LeadForm. */
export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Get help</h1>
      <p className="mt-1 text-sm text-gray-500">
        Send us a message and we&apos;ll get back to you. For claims, include your order reference.
      </p>
      <div className="mt-6">
        <LeadForm source="get_help" />
      </div>
    </div>
  );
}
