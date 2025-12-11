-- Create table for storing analytics report schedules
CREATE TABLE public.analytics_report_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  frequency TEXT NOT NULL CHECK (frequency IN ('weekly', 'monthly')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.analytics_report_schedules ENABLE ROW LEVEL SECURITY;

-- Only admins can manage report schedules
CREATE POLICY "Admins can manage report schedules"
ON public.analytics_report_schedules
FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_analytics_report_schedules_updated_at
BEFORE UPDATE ON public.analytics_report_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();