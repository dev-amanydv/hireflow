import {
  CircleCheckIcon,
  InfoIcon,
  LoaderCircleIcon,
  OctagonAlertIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useThemeOptional } from "~/lib/theme";
import { cn } from "~/lib/utils";

function Toaster({ className, ...props }: ToasterProps) {
  const theme = useThemeOptional()?.theme ?? "light";

  return (
    <Sonner
      theme={theme}
      className={cn("hf-toaster", theme === "dark" && "dark", className)}
      closeButton
      offset={16}
      gap={12}
      icons={{
        success: <CircleCheckIcon aria-hidden />,
        info: <InfoIcon aria-hidden />,
        warning: <TriangleAlertIcon aria-hidden />,
        error: <OctagonAlertIcon aria-hidden />,
        loading: <LoaderCircleIcon aria-hidden className="hf-toast-spin" />,
        close: <XIcon aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        closeButtonAriaLabel: "Dismiss notification",
        classNames: { toast: "hf-toast" },
      }}
      {...props}
    />
  );
}

export { Toaster };
