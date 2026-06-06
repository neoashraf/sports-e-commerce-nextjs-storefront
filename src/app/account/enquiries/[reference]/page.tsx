import { EnquiryThreadView } from "@/components/leads/EnquiryThreadView";

/** Enquiry thread — `/account/enquiries/<reference>` (lead-form-fe). */
export default function EnquiryThreadPage({ params }: { params: { reference: string } }) {
  return <EnquiryThreadView reference={params.reference} />;
}
