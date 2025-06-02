/**
 * @typedef {Object} DonationData
 * @property {number} id
 * @property {number} amount
 * @property {"payment"} object
 * @property {"succeeded" | "failed" | "pending"} status
 * @property {string} message
 * @property {string} currency
 * @property {"true" | "false"} refunded
 * @property {number} created_at
 * @property {"true" | "false"} note_hidden
 * @property {number | null} refunded_at
 * @property {string} support_note
 * @property {string} support_type
 * @property {string} supporter_name
 * @property {string} supporter_name_type
 * @property {string} transaction_id
 * @property {string} application_fee
 * @property {number} supporter_id
 * @property {string} supporter_email
 * @property {string} total_amount_charged
 * @property {number} coffee_count
 * @property {number} coffee_price
 */

/**
 * @typedef {Object} DonationCreatedEvent
 * @property {string} type
 * @property {boolean} live_mode
 * @property {number} attempt
 * @property {number} created
 * @property {number} event_id
 * @property {DonationData} data
 */
