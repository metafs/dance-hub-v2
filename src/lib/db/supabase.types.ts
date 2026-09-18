import type { Database as GeneratedDatabase, Json } from "../database.types";

type SerializedBigint = string | null;
type TicketOfferTable = GeneratedDatabase["public"]["Tables"]["event_ticket_offers"];

type SerializedTicketOfferTable = Omit<TicketOfferTable, "Row" | "Insert" | "Update"> & {
  Row: Omit<TicketOfferTable["Row"], "amount_minor" | "min_amount_minor" | "max_amount_minor"> & {
    amount_minor: SerializedBigint;
    min_amount_minor: SerializedBigint;
    max_amount_minor: SerializedBigint;
  };
  Insert: Omit<TicketOfferTable["Insert"], "amount_minor" | "min_amount_minor" | "max_amount_minor"> & {
    amount_minor?: SerializedBigint;
    min_amount_minor?: SerializedBigint;
    max_amount_minor?: SerializedBigint;
  };
  Update: Omit<TicketOfferTable["Update"], "amount_minor" | "min_amount_minor" | "max_amount_minor"> & {
    amount_minor?: SerializedBigint;
    min_amount_minor?: SerializedBigint;
    max_amount_minor?: SerializedBigint;
  };
};

// PostgREST accepts decimal strings for PostgreSQL bigint values. Keep the generated
// schema intact while preserving values that exceed JavaScript's safe integer range.
type AtomicRevisionFunctions = {
  create_event_draft_with_content: {
    Args: { revision_content: Json; revision_fields: Json; target_organization_id: string };
    Returns: string;
  };
  replace_event_revision_content: {
    Args: { revision_content: Json; target_revision_id: string };
    Returns: undefined;
  };
  save_event_revision_with_content: {
    Args: {
      revision_content: Json;
      revision_fields: Json;
      submit_for_review: boolean;
      target_event_id: string;
      target_revision_id: string;
    };
    Returns: GeneratedDatabase["public"]["Tables"]["event_revisions"]["Row"][];
  };
};

export type SupabaseDatabase = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables" | "Functions"> & {
    Tables: Omit<GeneratedDatabase["public"]["Tables"], "event_ticket_offers"> & {
      event_ticket_offers: SerializedTicketOfferTable;
    };
    Functions: GeneratedDatabase["public"]["Functions"] & AtomicRevisionFunctions;
  };
};
