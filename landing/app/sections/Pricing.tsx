import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Pricing() {
  return (
    <section id="pricing" className="border-b">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Simple pricing</h2>
          <p className="mt-3 text-muted-foreground">Start free. Upgrade when you scale.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-baseline justify-between">
                <CardTitle>Free</CardTitle>
                <Badge>Starter</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Everything you need to try Jigao.</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• Create sets and questions</li>
                <li>• Run basic timed exams</li>
                <li>• Real-time rooms (limited)</li>
                <li>• Community support</li>
              </ul>
              <Button className="mt-6 w-full" variant="outline" asChild>
                <a href="#">Start for free</a>
              </Button>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardHeader>
              <div className="flex items-baseline justify-between">
                <CardTitle>Pro</CardTitle>
                <Badge variant="secondary">Teams</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Advanced capabilities for institutions and teams.</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li>• AI question generation</li>
                <li>• Unlimited exams and participants</li>
                <li>• Collaboration & shared sets</li>
                <li>• Priority support</li>
              </ul>
              <Button className="mt-6 w-full" asChild>
                <a href="#">Upgrade to Pro</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
