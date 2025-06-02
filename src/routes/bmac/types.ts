export interface DonationCreatedEvent {
    type: string;
    live_mode: boolean;
    attempt: number;
    created: number;
    event_id: number;
    data: DonationData;
}

interface DonationData {
    id: number;
    amount: number;
    object: "payment";
    status: "succeeded" | "failed" | "pending";
    message: string;
    currency: string;
    refunded: string;
    created_at: number;
    note_hidden: string;
    refunded_at: number | null;
    support_note: string;
    support_type: string;
    supporter_name: string;
    supporter_name_type: string;
    transaction_id: string;
    application_fee: string;
    supporter_id: number;
    supporter_email: string;
    total_amount_charged: string;
    coffee_count: number;
    coffee_price: number;
}
