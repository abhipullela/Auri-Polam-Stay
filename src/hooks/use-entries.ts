import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

import {
  listEntries,
  createEntry,
  updateEntry,
  deleteEntry,
} from "@/lib/entries.functions";
import type { Entry } from "@/lib/types";

export const entriesKey = ["entries"] as const;

/**
 * Loads all calendar entries and re-polls every few seconds so booking and
 * block changes made on any device show up here automatically.
 */
export function useEntries() {
  const fetchEntries = useServerFn(listEntries);
  return useQuery<Entry[]>({
    queryKey: entriesKey,
    queryFn: () => fetchEntries(),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useEntryMutations() {
  const qc = useQueryClient();
  const create = useServerFn(createEntry);
  const update = useServerFn(updateEntry);
  const remove = useServerFn(deleteEntry);

  const invalidate = () => qc.invalidateQueries({ queryKey: entriesKey });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => create({ data }),
    onSuccess: () => {
      invalidate();
      toast.success("Saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => update({ data }),
    onSuccess: () => {
      invalidate();
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      invalidate();
      toast.success("Removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { createMutation, updateMutation, deleteMutation };
}
