-- Route task completion trigger through task-completion-workflow orchestrator
-- Ensures Drive deliverables are generated and attached before notifications are sent.

CREATE OR REPLACE FUNCTION public.notify_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  project_url TEXT;
  service_key TEXT;
BEGIN
  IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status = 'COMPLETED') THEN
    project_url := COALESCE(
      current_setting('app.settings.supabase_url', true),
      current_setting('app.supabase_url', true)
    );
    service_key := COALESCE(
      current_setting('app.settings.service_role_key', true),
      current_setting('app.service_role_key', true)
    );

    INSERT INTO webhook_logs (
      webhook_name,
      trigger_table,
      trigger_operation,
      payload,
      status,
      event_source,
      event_type
    )
    VALUES (
      'task_completed_workflow',
      'tasks',
      'UPDATE',
      jsonb_build_object(
        'id', NEW.id,
        'title', NEW.title,
        'status', NEW.status,
        'proof_of_work_link', NEW.proof_of_work_link,
        'expected_deliverables', NEW.expected_deliverables,
        'deliverable_storage_path', NEW.deliverable_storage_path,
        'notification_recipients', NEW.notification_recipients,
        'assignee_agent_id', NEW.assignee_agent_id,
        'completed_at', NEW.completed_at,
        'resolution_notes', NEW.resolution_notes,
        'last_work_result', NEW.last_work_result
      ),
      'pending',
      'supabase',
      'task:completed'
    );

    IF project_url IS NOT NULL AND service_key IS NOT NULL THEN
      PERFORM net.http_post(
        url := project_url || '/functions/v1/task-completion-workflow',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || service_key,
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'type', 'UPDATE',
          'table', 'tasks',
          'schema', 'public',
          'record', row_to_json(NEW),
          'old_record', row_to_json(OLD)
        )
      );
    ELSE
      RAISE WARNING 'Task completed but Supabase URL / service role key settings are not set. Workflow webhook not sent.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
