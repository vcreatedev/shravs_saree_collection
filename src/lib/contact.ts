/** The store's contact details and location, shown in the footer and on the
 * contact page. Phone and email also appear on the policy pages and invoices,
 * and the email is the reply-to address on order emails. */
export const STORE_PHONE = "+91 91212 38445";
export const STORE_PHONE_LINK = "tel:+919121238445";
export const STORE_EMAIL = "sravsbeautyandhome@gmail.com";
export const STORE_LOCATION = "Hyderabad, Telangana, India";

/** The WhatsApp number every chat link opens: country code and number, no
 * "+" or spaces. NEXT_PUBLIC_WHATSAPP_NUMBER overrides it. */
export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919121238445";
