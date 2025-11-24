import React from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

/**
 * AreYouSure
 * A reusable confirmation dialog.
 * Usage:
 * <AreYouSure
 *    trigger={<Button variant="destructive">Delete</Button>}
 *    title="Delete Exam"
 *    description="This action cannot be undone."
 *    onConfirm={() => mutate()}
 * />
 */
export interface AreYouSureProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  mutateAsync: () => unknown | Promise<unknown>; // react-query mutation function
  disabled?: boolean;
}

export const AreYouSure: React.FC<AreYouSureProps> = ({
  children,
  title = "Are you sure?",
  description = "Please confirm you want to continue.",
  confirmLabel = "Yes",
  cancelLabel = "Cancel",
  mutateAsync,
  disabled = false,
}) => {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function handleConfirm() {
    try {
      setLoading(true);
      await mutateAsync();
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !loading && setOpen(o)}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent showCloseButton={!loading}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={loading || disabled}
            >
              {cancelLabel}
            </Button>
          </DialogClose>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || disabled}
          >
            {loading ? "Processing..." : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AreYouSure;
