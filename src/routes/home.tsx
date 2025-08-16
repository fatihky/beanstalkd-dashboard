import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../utils/trpc";

export default function HomePage() {
  const trpc = useTRPC();
  const result = useQuery(trpc.tubes.list.queryOptions());

  return (
    <div>
      {/* tubes */}

      <h5>Tubes</h5>

      <table>
        <thead>
          <tr>
            <th>tube name</th>
          </tr>
        </thead>
        <tbody>
          {result.data?.map((tube) => (
            <tr key={tube}>
              <td>{tube}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
