"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useAuthStore } from "@/lib/stores/auth";
import {
  submitLeadResultSchema,
  attachmentResultSchema,
  enquiryListSchema,
  enquiryThreadSchema,
  type LeadType,
  type EnquiryListItem,
  type EnquiryThread,
} from "@/lib/api/schemas/leads";

/**
 * Lead/enquiry hooks (lead-form-fe). Public submit + customer My Enquiries
 * (list/thread/reply). All via the api client.
 */
export interface SubmitLeadBody {
  type: LeadType;
  subject: string;
  message: string;
  submitter_name: string;
  submitter_phone: string;
  submitter_email?: string;
  order_reference?: string;
  product_id?: string | null;
  source?: string;
  attachment_ids?: string[];
  captcha_token?: string;
}

export function useSubmitLead() {
  return useMutation({
    mutationFn: (body: SubmitLeadBody) =>
      api.post("/leads", body as unknown as Record<string, unknown>, {
        schema: submitLeadResultSchema,
        public: true,
      }),
  });
}

/**
 * Upload a single claim-evidence file → POST /leads/attachments (multipart). Returns the
 * stored `attachment_id` to reference in the lead submission (FR-LEAD-004). Public — guests
 * attach evidence before they have an account.
 */
export function useUploadLeadAttachment() {
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return api.postForm("/leads/attachments", form, {
        schema: attachmentResultSchema,
        public: true,
      });
    },
  });
}

export const enquiryKeys = {
  list: ["enquiries"] as const,
  thread: (reference: string) => ["enquiries", reference] as const,
};

export function useMyEnquiries() {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: enquiryKeys.list,
    enabled: !!tokens,
    queryFn: (): Promise<EnquiryListItem[]> =>
      api.get("/me/leads", { schema: enquiryListSchema, params: { page: 1, limit: 20 } }) as Promise<EnquiryListItem[]>,
    staleTime: 30_000,
  });
}

export function useEnquiryThread(reference: string) {
  const tokens = useAuthStore((s) => s.tokens);
  return useQuery({
    queryKey: enquiryKeys.thread(reference),
    enabled: !!tokens && !!reference,
    queryFn: (): Promise<EnquiryThread> =>
      api.get(`/me/leads/${encodeURIComponent(reference)}`, { schema: enquiryThreadSchema }) as Promise<EnquiryThread>,
    staleTime: 15_000,
  });
}

export function useReplyEnquiry(reference: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<void>(`/me/leads/${encodeURIComponent(reference)}/reply`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: enquiryKeys.thread(reference) }),
  });
}
