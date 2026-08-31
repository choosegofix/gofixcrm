import { recordDeposit } from "@/app/actions/quotes";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export function DepositForm({ quoteId }: { quoteId: string }) {
  const record = recordDeposit.bind(null, quoteId);
  return (
    <form action={record} className="flex items-end gap-3">
      <div className="w-32">
        <FormField label="Amount" htmlFor="amount">
          <Input id="amount" name="amount" type="number" step="0.01" min="0.01" required />
        </FormField>
      </div>
      <div className="w-40">
        <FormField label="Method" htmlFor="method">
          <Select id="method" name="method" defaultValue="ETRANSFER">
            <option value="CARD">Card</option>
            <option value="ETRANSFER">E-transfer</option>
            <option value="CASH">Cash</option>
            <option value="CHEQUE">Cheque</option>
            <option value="OTHER">Other</option>
          </Select>
        </FormField>
      </div>
      <Button type="submit" size="sm">
        Record deposit
      </Button>
    </form>
  );
}
