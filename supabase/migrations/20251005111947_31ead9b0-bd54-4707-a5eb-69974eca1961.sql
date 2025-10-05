-- Criar trigger para criar registros financeiros a partir de movimentações de estoque
CREATE TRIGGER create_stock_financial_record_trigger
  AFTER INSERT ON public.stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION create_stock_movement_financial_record();