import { useState } from "react";
import { studio } from "@/studio/lib/orpc";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { validate_cron_expression } from "@/utils/validate-cron";
import z from "zod";

type NewCronProps = {};

export const NewCronForm: React.FC<NewCronProps> = () => {
  const query_client = useQueryClient();

  const mutation = useMutation(
    studio.cron.create.mutationOptions({
      onSuccess: () => {
        query_client.invalidateQueries({ queryKey: studio.cron.list.key() });
      },
    })
  );

  const [expression, setExpression] = useState("");
  const [httpMethod, setHttpMethod] = useState("POST");
  const [httpUrl, setHttpUrl] = useState("");
  const [httpHeaders, setHttpHeaders] = useState<Record<string, string>>({
    "": "",
  });
  const [httpBody, setHttpBody] = useState("");
  const [timeoutMs, setTimeoutMs] = useState(1000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    if (loading) return;

    e.preventDefault();

    setLoading(true);

    const [valid_cron, validation_error] = validate_cron_expression(expression);

    if (!valid_cron) {
      setError(`Invalid cron expression: ${validation_error}`);
      setLoading(false);
      return;
    }

    if (!z.url().safeParse(httpUrl).success) {
      setError("Invalid URL format.");
      setLoading(false);
      return;
    }

    try {
      const filtered_headers = Object.fromEntries(
        Object.entries(httpHeaders).filter(([key]) => key)
      );

      const result = await mutation.mutateAsync({
        expression,
        method: httpMethod as any,
        url: httpUrl,
        headers: filtered_headers,
        body: httpBody,
        timeout_ms: timeoutMs,
      });
      setError(null);
      console.log(result);
    } catch (err) {
      setError("Failed to create cron job. Please check your input.");
      console.error(err);
    }

    setLoading(false);
  };

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cron_expression">Cron Expression</Label>
        <Input
          placeholder="* * * * *"
          id="cron_expression"
          name="cron_expression"
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
        />
      </div>
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="http_method">Method</Label>
          <Select
            name="http_method"
            defaultValue="POST"
            value={httpMethod}
            onValueChange={setHttpMethod}
          >
            <SelectTrigger>
              <SelectValue placeholder="HTTP Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
              <SelectItem value="PATCH">PATCH</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <Label htmlFor="http_url">Url</Label>
          <Input
            placeholder="https://example.com"
            id="http_url"
            name="http_url"
            value={httpUrl}
            onChange={(e) => setHttpUrl(e.target.value)}
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Headers</Label>
        {Object.entries(httpHeaders).map(([key, value], index) => (
          <div key={index} className="flex flex-row gap-2">
            <Input
              placeholder="Header Name"
              value={key}
              onChange={(e) => {
                const newHeaders = { ...httpHeaders, [e.target.value]: value };
                delete newHeaders[key];
                setHttpHeaders(newHeaders);
              }}
            />
            <Input
              placeholder="Header Value"
              value={value}
              onChange={(e) => {
                const newHeaders = { ...httpHeaders, [key]: e.target.value };
                setHttpHeaders(newHeaders);
              }}
            />
          </div>
        ))}
        <Button
          className="w-fit"
          type="button"
          onClick={() => setHttpHeaders({ ...httpHeaders, "": "" })}
        >
          Add Header
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="http_body">Body</Label>
        <Textarea
          placeholder="String here..."
          id="http_body"
          name="http_body"
          value={httpBody}
          onChange={(e) => setHttpBody(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="timeout_ms">Timeout (ms)</Label>
        <Input
          placeholder="1000"
          id="timeout_ms"
          name="timeout_ms"
          type="number"
          value={timeoutMs}
          onChange={(e) => setTimeoutMs(Number(e.target.value))}
        />
      </div>
      <Button disabled={loading} type="submit">
        Create Cron
      </Button>
      {error && <div className="text-red-500">{error}</div>}
    </form>
  );
};
