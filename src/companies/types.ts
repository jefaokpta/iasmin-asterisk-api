/**
 * @author Jefferson Alves Reis (jefaokpta)
 * @email jefaokpta@hotmail.com
 * @create 19/08/2025
 */

interface Company {
  id: number;
  name: string;
  controlNumber: string;
}

export interface Attendant {
  attendantId: number;
  name: string;
  phone: string;
  attendantTypeEnum: AttendantTypeEnum;
}

enum AttendantTypeEnum {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

export interface CompanyPhone {
  phone: string;
  company: Company;
  attendants: Attendant[];
}


