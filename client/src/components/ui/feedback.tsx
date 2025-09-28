import React from "react";
export const Loading = React.memo(function Loading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-muted-foreground">
      <i className="fas fa-spinner fa-spin mr-2"></i>
      {message}
    </div>
  );
});

export const ErrorFeedback = React.memo(function ErrorFeedback({ error }: { error: Error | string }) {
  return (
    <div className="flex items-center justify-center py-8 text-destructive">
      <i className="fas fa-exclamation-circle mr-2"></i>
      {typeof error === "string" ? error : error.message}
    </div>
  );
});