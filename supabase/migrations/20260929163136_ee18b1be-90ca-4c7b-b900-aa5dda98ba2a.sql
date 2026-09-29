ALTER FUNCTION public.can_view_stock() SECURITY INVOKER;
ALTER FUNCTION public.can_manage_stock() SECURITY INVOKER;
ALTER FUNCTION public.can_access_stock_unit(text) SECURITY INVOKER;