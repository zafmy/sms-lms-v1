// Client component for the AI settings form.
// Allows admin to configure AI provider, model, quotas, and toggle AI features.
// @MX:NOTE: [AUTO] Admin-only AI settings form using react-hook-form + zodResolver
// @MX:SPEC: SPEC-AI-001

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  aiSettingsSchema,
  AISettingsSchema,
} from "@/lib/formValidationSchemas";
import { updateAISettings } from "@/lib/aiActions";
import { useRouter } from "next/navigation";
import { useState } from "react";

type AISettingsFormProps = {
  readonly settings: {
    readonly provider: string;
    readonly modelId: string;
    readonly monthlyQuotaPerTeacher: number;
    readonly maxTokensPerRequest: number;
    readonly enabled: boolean;
  };
};

const AISettingsForm = ({ settings }: AISettingsFormProps) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AISettingsSchema>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: {
      provider: settings.provider as "openai" | "anthropic",
      modelId: settings.modelId,
      monthlyQuotaPerTeacher: settings.monthlyQuotaPerTeacher,
      maxTokensPerRequest: settings.maxTokensPerRequest,
      enabled: settings.enabled,
    },
  });

  const enabled = watch("enabled");

  const onSubmit = async (data: AISettingsSchema) => {
    setSaving(true);
    setMessage(null);

    try {
      const result = await updateAISettings(data);
      if (result.success) {
        setMessage({ type: "success", text: "Settings saved successfully." });
        router.refresh();
      } else {
        setMessage({
          type: "error",
          text: result.message ?? "Failed to save settings.",
        });
      }
    } catch {
      setMessage({ type: "error", text: "An unexpected error occurred." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Provider */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Provider</label>
        <select
          {...register("provider")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full md:w-1/2"
        >
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic</option>
        </select>
        {errors.provider && (
          <p className="text-xs text-red-400">{errors.provider.message}</p>
        )}
      </div>

      {/* Model ID */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">Model ID</label>
        <input
          type="text"
          {...register("modelId")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full md:w-1/2"
          placeholder="e.g. gpt-4o-mini"
        />
        {errors.modelId && (
          <p className="text-xs text-red-400">{errors.modelId.message}</p>
        )}
      </div>

      {/* Monthly Quota per Teacher */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Monthly Quota per Teacher
        </label>
        <input
          type="number"
          {...register("monthlyQuotaPerTeacher")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full md:w-1/4"
          min={1}
          max={10000}
        />
        {errors.monthlyQuotaPerTeacher && (
          <p className="text-xs text-red-400">
            {errors.monthlyQuotaPerTeacher.message}
          </p>
        )}
      </div>

      {/* Max Tokens per Request */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">
          Max Tokens per Request
        </label>
        <input
          type="number"
          {...register("maxTokensPerRequest")}
          className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full md:w-1/4"
          min={100}
          max={32000}
        />
        {errors.maxTokensPerRequest && (
          <p className="text-xs text-red-400">
            {errors.maxTokensPerRequest.message}
          </p>
        )}
      </div>

      {/* Enabled Toggle */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">
          AI Generation Enabled
        </label>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setValue("enabled", !enabled, { shouldValidate: true })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <button
        type="submit"
        disabled={saving}
        className={`px-6 py-2 rounded-md text-white text-sm font-medium transition-colors ${
          saving
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
};

export default AISettingsForm;
