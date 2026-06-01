import { createFileRoute, redirect } from "@tanstack/react-router";
import { bindReferralSession } from "@/lib/api/operator.functions";

export const Route = createFileRoute("/s/$refCode")({
  loader: async ({ params }) => {
    try {
      // Trigger referral visit binding in server session
      await bindReferralSession({ data: { referralCode: params.refCode } });
    } catch (err) {
      console.error("Referral binding failed:", err);
    }
    // Redirect to home page
    throw redirect({ to: "/" });
  },
  component: () => null,
});
