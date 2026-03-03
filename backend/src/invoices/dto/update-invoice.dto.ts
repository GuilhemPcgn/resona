import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { InvoiceStatus } from './create-invoice.dto';

// Mise à jour du header seulement (pas des lignes)
export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString()
  issue_date?: string;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
