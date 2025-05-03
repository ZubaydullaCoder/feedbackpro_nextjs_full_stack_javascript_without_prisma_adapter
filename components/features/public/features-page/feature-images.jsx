import { QrCode, MessageSquare, BarChart4 } from "lucide-react";

export const QrCodeImage = () => (
  <div className="relative h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-xl border border-border/50 bg-background p-4 shadow-lg">
    <div className="h-full w-full rounded-lg bg-muted/20 flex items-center justify-center">
      <div className="p-6 space-y-4 max-w-sm">
        <div className="h-48 w-48 mx-auto bg-white p-4 rounded-lg flex items-center justify-center">
          <QrCode
            className="h-32 w-32 text-primary"
            strokeWidth={1}
          />
        </div>
      </div>
    </div>
  </div>
);

export const SmsImage = () => (
  <div className="relative h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-xl border border-border/50 bg-background p-4 shadow-lg">
    <div className="h-full w-full rounded-lg bg-muted/20 flex items-center justify-center">
      <div className="p-6 space-y-4 max-w-sm">
        <div className="space-y-4 w-full">
          <div className="flex items-center gap-3 bg-primary/10 p-3 rounded-lg">
            <MessageSquare className="h-8 w-8 text-primary" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted rounded-full" />
              <div className="h-3 w-32 bg-muted rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-background p-3 rounded-lg shadow-sm">
            <MessageSquare className="h-8 w-8 text-muted" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted rounded-full" />
              <div className="h-3 w-32 bg-muted rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-3 bg-background p-3 rounded-lg shadow-sm">
            <MessageSquare className="h-8 w-8 text-muted" />
            <div className="space-y-1">
              <div className="h-4 w-24 bg-muted rounded-full" />
              <div className="h-3 w-32 bg-muted rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const AnalyticsImage = () => (
  <div className="relative h-[300px] w-[300px] sm:h-[400px] sm:w-[400px] rounded-xl border border-border/50 bg-background p-4 shadow-lg">
    <div className="h-full w-full rounded-lg bg-muted/20 flex items-center justify-center">
      <div className="p-6 space-y-4 w-full">
        <div className="space-y-6 w-full">
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded-full" />
            <div className="h-24 w-full bg-muted/50 rounded-lg flex items-end p-2">
              <div className="h-1/3 w-1/6 bg-primary/20 rounded-sm mx-1"></div>
              <div className="h-1/2 w-1/6 bg-primary/30 rounded-sm mx-1"></div>
              <div className="h-3/4 w-1/6 bg-primary/40 rounded-sm mx-1"></div>
              <div className="h-2/3 w-1/6 bg-primary/50 rounded-sm mx-1"></div>
              <div className="h-5/6 w-1/6 bg-primary/60 rounded-sm mx-1"></div>
              <div className="h-1/4 w-1/6 bg-primary rounded-sm mx-1"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-muted rounded-full" />
            <div className="h-24 w-full bg-muted/50 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
