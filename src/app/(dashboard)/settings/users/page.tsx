import { prisma } from "@/lib/prisma";
import { getCompany } from "@/lib/company";
import { requireAdmin } from "@/lib/session";
import { createStaffUser } from "@/app/actions/users";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { roleLabels } from "@/lib/labels";

export default async function UsersSettingsPage() {
  await requireAdmin();
  const company = await getCompany();

  const users = await prisma.user.findMany({
    where: { companyId: company.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-[#16233A]">Team &amp; settings</h1>
        <p className="text-sm text-[#5B6B82]">Manage staff accounts and roles</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title="Team members" />
            <CardBody className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-[#EFEAE0] text-left text-xs uppercase tracking-wide text-[#5B6B82]">
                  <tr>
                    <th className="px-5 py-2 font-medium">Name</th>
                    <th className="px-5 py-2 font-medium">Email</th>
                    <th className="px-5 py-2 font-medium">Role</th>
                    <th className="px-5 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EFEAE0]">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3 font-medium text-[#16233A]">{u.name}</td>
                      <td className="px-5 py-3 text-[#5B6B82]">{u.email}</td>
                      <td className="px-5 py-3 text-[#5B6B82]">{roleLabels[u.role]}</td>
                      <td className="px-5 py-3">
                        <Badge
                          className={
                            u.isActive
                              ? "border-[#B9D6B7] bg-[#DEEBDD] text-[#1F5C33]"
                              : "border-[#E3DDD0] bg-[#EEEAE1] text-[#5B6B82]"
                          }
                        >
                          {u.isActive ? "Active" : "Deactivated"}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader title="Add a team member" />
          <CardBody>
            <form action={createStaffUser} className="space-y-4">
              <FormField label="Full name" htmlFor="name" required>
                <Input id="name" name="name" required />
              </FormField>
              <FormField label="Email" htmlFor="email" required>
                <Input id="email" name="email" type="email" required />
              </FormField>
              <FormField label="Temporary password" htmlFor="password" required hint="At least 8 characters — they can change it later.">
                <Input id="password" name="password" type="password" required minLength={8} />
              </FormField>
              <FormField label="Phone" htmlFor="phone">
                <Input id="phone" name="phone" type="tel" />
              </FormField>
              <FormField label="Role" htmlFor="role" required>
                <Select id="role" name="role" defaultValue="FIELD">
                  <option value="ADMIN">Admin</option>
                  <option value="OFFICE">Office / Dispatcher</option>
                  <option value="FIELD">Field / Crew</option>
                  <option value="SUBCONTRACTOR">Subcontractor</option>
                </Select>
              </FormField>
              <Button type="submit" className="w-full">
                Create account
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
