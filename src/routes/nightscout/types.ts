export interface CGMReading {
    _id: string;
    device: string;
    date: number;
    delta: number | null;
    dateString: string;
    isValid: boolean;
    sgv: number;
    direction: string;
    type: string;
    created_at: string;
    mills: number;
}
