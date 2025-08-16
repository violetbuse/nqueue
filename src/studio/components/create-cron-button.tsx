import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { NewCronForm } from "./forms/cron";
import { useLocation } from "wouter";
import { useState } from "react";

export const CreateCronButton = () => {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  const on_success = (cron_id: string) => {
    setLocation(`/crons/${cron_id}`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          New Cron Job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Cron Job</DialogTitle>
          <DialogDescription>
            <NewCronForm onSuccess={on_success} />
          </DialogDescription>
        </DialogHeader>
        <DialogFooter></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
