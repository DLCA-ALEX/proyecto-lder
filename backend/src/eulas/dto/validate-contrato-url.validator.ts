import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function ValidateContratoUrlIfFirmado(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'ValidateContratoUrlIfFirmado',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: any, args: ValidationArguments) {
          const o = args.object as any;
          // Permitimos vacío/ausente SIEMPRE (aunque esté firmado)
          const url = (o.contrato_url ?? '').toString().trim();
          if (url === '') return true;

          // Si se envía, valida que sea URL válida
          try {
            new URL(url);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return 'contrato_url debe ser una URL válida si se envía';
        },
      },
    });
  };
}
