import { recordPayment } from "@/app/actions/invoices";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function PaymentForm({ invoiceId }: { invoiceId: string }) {
  const record = recordPayment.bind(null, invoiceId);
  return (
    <form action={record} className="flex items-end gap-3">
      <div className="w-32">
        <FormField label="Amount" htmlFor="amount">
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </FormField>
      </div>
      <div className="w-40">
        <FormField label="Method" htmlFor="method">
          <Select id="method" name="method" defaultValue="CARD">
            <option value="CARD">Card</option>
            <option value="ETRANSFER">E-transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="ACH">ACH</option>
            <option value="OTHER">Other</option>
          </Select>
        </FormField>
      </div>
      <Button type="submit" size="sm">
        Record payment
      </Button>
    </form>
  );
}
