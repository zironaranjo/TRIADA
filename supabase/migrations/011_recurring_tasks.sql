-- Migration 011: Recurring tasks for staff_tasks
-- Run in Supabase SQL Editor

ALTER TABLE staff_tasks
  ADD COLUMN IF NOT EXISTS recurrence TEXT DEFAULT 'none'
    CHECK (recurrence IN ('none', 'daily', 'weekly', 'monthly')),
  ADD COLUMN IF NOT EXISTS recurrence_day INTEGER,        -- 0=Dom, 1=Lun, 2=Mar, 3=Mié, 4=Jue, 5=Vie, 6=Sáb
  ADD COLUMN IF NOT EXISTS recurrence_time TEXT,          -- HH:MM e.g. "09:00"
  ADD COLUMN IF NOT EXISTS parent_task_id UUID REFERENCES staff_tasks(id) ON DELETE SET NULL;

-- Index for quick lookup of recurring tasks
CREATE INDEX IF NOT EXISTS idx_staff_tasks_recurrence ON staff_tasks(recurrence) WHERE recurrence != 'none';
CREATE INDEX IF NOT EXISTS idx_staff_tasks_parent ON staff_tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;
