-- ========================================
-- TRIADAK - Staff Operations System
-- ========================================

-- Staff Members (cleaners, maintenance, etc.)
CREATE TABLE IF NOT EXISTS public.staff_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  document_id TEXT,
  contract_type TEXT NOT NULL DEFAULT 'freelance' CHECK (contract_type IN ('full_time', 'part_time', 'freelance')),
  salary NUMERIC(10,2) DEFAULT 0,
  salary_type TEXT NOT NULL DEFAULT 'per_service' CHECK (salary_type IN ('monthly', 'per_service')),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_properties UUID[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Staff Tasks (cleaning, maintenance, inspection)
CREATE TABLE IF NOT EXISTS public.staff_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  task_type TEXT NOT NULL DEFAULT 'cleaning' CHECK (task_type IN ('cleaning', 'maintenance', 'inspection', 'laundry', 'other')),
  scheduled_date DATE NOT NULL,
  checklist JSONB DEFAULT '[]'::jsonb,
  photos TEXT[] DEFAULT '{}',
  time_start TIMESTAMPTZ,
  time_end TIMESTAMPTZ,
  hours_worked NUMERIC(5,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified', 'cancelled')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  cost NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  expense_id UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_staff_members_status ON public.staff_members(status);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_member ON public.staff_tasks(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_property ON public.staff_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_date ON public.staff_tasks(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_staff_tasks_status ON public.staff_tasks(status);

-- RLS
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage staff_members"
  ON public.staff_members FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can manage staff_tasks"
  ON public.staff_tasks FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS staff_members_updated_at ON public.staff_members;
CREATE TRIGGER staff_members_updated_at BEFORE UPDATE ON public.staff_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS staff_tasks_updated_at ON public.staff_tasks;
CREATE TRIGGER staff_tasks_updated_at BEFORE UPDATE ON public.staff_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
