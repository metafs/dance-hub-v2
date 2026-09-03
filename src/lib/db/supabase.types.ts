import type { Database as GeneratedDatabase } from "./database.types";

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
export type SupabaseDatabase = Omit<GeneratedDatabase, "public"> & {
  public: Omit<GeneratedDatabase["public"], "Tables"> & {
    Tables: Omit<GeneratedDatabase["public"]["Tables"], "event_ticket_offers"> & {
      event_ticket_offers: SerializedTicketOfferTable;
    };
  };
};
