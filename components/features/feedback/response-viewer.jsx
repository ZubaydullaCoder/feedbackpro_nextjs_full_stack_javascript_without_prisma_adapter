import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export default function ResponseViewer({ responseEntities }) {
  if (!responseEntities?.length) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            No feedback has been submitted for this survey yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {responseEntities.map((entity) => (
        <Card key={entity.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base font-medium">
              <span>
                Feedback submitted on{" "}
                {new Date(entity.submittedAt).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="text-sm text-muted-foreground">
                via {entity.type}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-full max-h-[400px]">
              <div className="space-y-4">
                {entity.responses.map((response) => (
                  <div key={response.id} className="space-y-2">
                    <h4 className="font-medium text-sm">
                      {response.question.text}
                    </h4>
                    <p className="text-sm text-muted-foreground pl-4 border-l-2">
                      {response.answer}
                    </p>
                    <Separator className="mt-4" />
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
