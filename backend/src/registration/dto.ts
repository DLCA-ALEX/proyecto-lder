import { IsBoolean, IsEmail, IsOptional, IsString } from 'class-validator';

export class RegistrationDto {
  // Usuario de sesión (del portal)
  @IsOptional() @IsString()
  username?: string;

  // Nombre real capturado en el formulario
  @IsOptional() @IsString()
  real_name?: string;

  // Email capturado (puede venir vacío si decides permitirlo)
  @IsOptional() @IsEmail()
  email?: string;

  @IsOptional() @IsString()
  phone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;

  @IsOptional() @IsString()
  company?: string;

  @IsOptional() @IsString()
  role?: string;

  // Dominio fijo desde el portal
  @IsOptional() @IsString()
  domain?: string;

  // Aceptación del NDA
  @IsOptional() @IsBoolean()
  ndaAccepted?: boolean;

  /**
   * Campo legacy (por si en algún momento el front viejo manda `name`).
   * No lo usarás para persistir, pero lo incluimos para que no lo tire el whitelist.
   */
  @IsOptional() @IsString()
  name?: string;
}
