import { Card, CardContent } from "@/components/ui/card";

export function ErrorState({ message }: { message: string }) {
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <h2 className="font-semibold">Unable to load this view</h2>
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
