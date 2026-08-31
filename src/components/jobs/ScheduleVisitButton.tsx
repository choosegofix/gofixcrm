"use client";

import { useState } from "react";
import { FormField, Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function ScheduleVisitButton({
  action,
}: {
  action: (formData: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        + Schedule a visit
      </Button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await action(formData);
        setOpen(false);
      }}
      className="grid grid-cols-2 gap-3 rounded-md border border-[#E3DDD0] bg-[#FAF7F1] p-4"
    >
      <FormField label="Start" htmlFor="scheduledStart" required>
        <Input id="scheduledStart" name="scheduledStart" type="datetime-local" required />
      </FormField>
      <FormField label="End" htmlFor="scheduledEnd" required>
        <Input id="scheduledEnd" name="scheduledEnd" type="datetime-local" required />
      </FormField>
      <div className="col-span-2">
        <FormField label="Notes" htmlFor="visitNotes">
          <Textarea id="visitNotes" name="notes" rows={2} />
        </FormField>
      </div>
      <div className="col-span-2 flex gap-2">
        <Button type="submit" size="sm">
          Add visit
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
