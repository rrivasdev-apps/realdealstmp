-- Phase 2.6a: AI-drafted task messages.
--
-- Holds the generated draft for an email_task/call_task step whose template step
-- has config.ai_draft.enabled. Nullable on purpose and in every failure mode: a
-- step whose template has drafting switched off, whose generation failed, or that
-- was created before this shipped simply has ai_output = null and renders exactly
-- as it does today. Nothing reads this column expecting it to be populated.
--
-- Shape: { draft: text, generated_at: timestamptz, model: text, regenerate_count: int }
--
-- No new RLS policy: automation_steps' existing company-scoped policies already
-- govern every read and write of this row (see 20260731000001_automation_runtime.sql).
alter table automation_steps
  add column ai_output jsonb;
