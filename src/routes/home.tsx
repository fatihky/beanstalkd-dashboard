import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../utils/trpc";

export default function HomePage() {
  const trpc = useTRPC();
  const result = useQuery(trpc.tubes.list.queryOptions());

  return (
    <div>
      <pre>{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
