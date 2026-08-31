"use client";

import { useState } from "react";
import { Select, Input } from "@/components/ui/Field";

const SOURCES = [
  { value: "PHONE_CALL", label: "Phone call" },
  { value: "WEBSITE_FORM", label: "Website form" },
  { value: "REFERRAL", label: "Referral" },
  { value: "REPEAT_CUSTOMER", label: "Repeat customer" },
  { value: "GOOGLE_SEARCH", label: "Google / search" },
  { value: "SOCIAL_MEDIA", label: "Social media" },
  { value: "WALK_IN", label: "Walk-in" },
  { value: "OTHER", label: "Other" },
];

export function LeadSourceSelect() {
  const [value, setValue] = useState("");

  return (
    <div>
      <Select
        id="source"
        name="source"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        <option value="" disabled>
          Select a source
        </option>
        {SOURCES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>
      {value === "OTHER" && (
        <Input name="sourceOther" placeholder="Describe the source" className="mt-2" />
      )}
    </div>
  );
}
