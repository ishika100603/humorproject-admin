// The simple tables the admin area can create, edit and delete.
// Server actions only touch tables and columns listed here.

export type Field = {
  name: string;
  label: string;
  type: "text" | "textarea" | "number" | "bool" | "ref";
  required?: boolean;
  lower?: boolean;
  placeholder?: string;
  // For "ref": the table whose rows fill the dropdown
  ref?: { table: string; label: string };
  wide?: boolean;
};

export type Resource = {
  table: string;
  path: string;
  title: string;
  blurb: string;
  noun: string;
  order: { column: string; ascending: boolean };
  fields: Field[];
};

export const RESOURCES: Record<string, Resource> = {
  terms: {
    table: "terms",
    path: "/terms",
    title: "Terms",
    blurb: "Columbia words the caption AI may use. Active ones are added to every prompt.",
    noun: "term",
    order: { column: "term", ascending: true },
    fields: [
      { name: "term", label: "Term", type: "text", required: true, placeholder: "Butler" },
      { name: "definition", label: "Meaning", type: "textarea", required: true, wide: true, placeholder: "The main library, open 24 hours" },
      { name: "term_type", label: "Type", type: "text", placeholder: "place, slang, event" },
      { name: "is_active", label: "Active", type: "bool" },
    ],
  },
  examples: {
    table: "caption_examples",
    path: "/examples",
    title: "Caption examples",
    blurb: "Captions that landed well. Active ones are shown to the AI as examples of the tone.",
    noun: "example",
    order: { column: "created_at", ascending: false },
    fields: [
      { name: "image_description", label: "Photo", type: "textarea", required: true, placeholder: "A line out the door at Ferris" },
      { name: "caption", label: "Caption", type: "textarea", required: true },
      { name: "why_it_works", label: "Why it works", type: "textarea" },
      { name: "is_active", label: "Active", type: "bool" },
    ],
  },
  models: {
    table: "llm_models",
    path: "/models",
    title: "LLM models",
    blurb: "The app tries active models in priority order (1 first) and falls back to the next one if a call fails.",
    noun: "model",
    order: { column: "priority", ascending: true },
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Gemini 3.5 Flash" },
      { name: "model_key", label: "Model ID", type: "text", required: true, lower: true, placeholder: "gemini-3.5-flash" },
      { name: "provider_id", label: "Provider", type: "ref", required: true, ref: { table: "llm_providers", label: "name" } },
      { name: "priority", label: "Priority", type: "number", required: true },
      { name: "temperature", label: "Temperature", type: "number", required: true },
      { name: "is_active", label: "Active", type: "bool" },
    ],
  },
  providers: {
    table: "llm_providers",
    path: "/providers",
    title: "LLM providers",
    blurb: "Companies that host the models. Turning a provider off turns off all its models.",
    noun: "provider",
    order: { column: "name", ascending: true },
    fields: [
      { name: "name", label: "Name", type: "text", required: true, placeholder: "Google Gemini" },
      { name: "slug", label: "Slug", type: "text", required: true, lower: true, placeholder: "google" },
      { name: "api_base_url", label: "API base URL", type: "text", wide: true },
      { name: "is_active", label: "Active", type: "bool" },
    ],
  },
  domains: {
    table: "allowed_signup_domains",
    path: "/domains",
    title: "Signup domains",
    blurb: "Emails from these domains can log in. A row with * lets everyone in. Remove it to lock the app to the list.",
    noun: "domain",
    order: { column: "domain", ascending: true },
    fields: [
      { name: "domain", label: "Domain", type: "text", required: true, lower: true, placeholder: "columbia.edu" },
      { name: "note", label: "Note", type: "text", wide: true },
    ],
  },
  whitelist: {
    table: "whitelist_email_addresses",
    path: "/whitelist",
    title: "Whitelisted emails",
    blurb: "Single addresses that can log in even if their domain isn't on the signup list.",
    noun: "email",
    order: { column: "email", ascending: true },
    fields: [
      { name: "email", label: "Email", type: "text", required: true, lower: true, placeholder: "friend@gmail.com" },
      { name: "note", label: "Note", type: "text", wide: true },
    ],
  },
};
