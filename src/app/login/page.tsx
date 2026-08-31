import { redirect } from "next/navigation";
import { auth, signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { Input, FormField } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { error } = await searchParams;
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  async function authenticate(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/",
      });
    } catch (err) {
      if (err instanceof AuthError) {
        redirect("/login?error=invalid");
      }
      throw err;
    }
  }

  async function authenticateWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">GoFix Services</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in to your CRM</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              That email or password wasn&apos;t recognized. Please try again.
            </div>
          )}
          <form action={authenticate} className="space-y-4">
            <FormField label="Email" htmlFor="email" required>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </FormField>
            <FormField label="Password" htmlFor="password" required>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </FormField>
            <Button type="submit" className="w-full">
              Sign in
            </Button>
          </form>
          {googleEnabled && (
            <>
              <div className="my-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs text-gray-400">OR</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <form action={authenticateWithGoogle}>
                <Button type="submit" variant="secondary" className="w-full">
                  Sign in with Google
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
