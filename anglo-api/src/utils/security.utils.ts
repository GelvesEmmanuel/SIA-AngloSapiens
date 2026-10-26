    // se usa para manejar la sanitizacion, la creacion del nombre de usuario y el cifrado de las contraseñas
    import bcrypt from 'bcrypt'

    export const limpiarTexto = (texto: string): string =>{

        return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

        
    };

/** RQF-SEG-003 generar el username automaicamente 
 * regla: 1letradel primer nombre + 1letradel segudno nombre (si tiene)
 * + 1er apellido + 1letra del segundo apellido (si tiene )+ dia de cumpleaños
 * 
*/
export const generarUsername = (primerNombre: string,
    primerApellido: string,
    diaCumpleanos: number,
    segundoNombre?: string,
    segundoApellido?: string
): string => {

    const pNombre = limpiarTexto(primerNombre).charAt(0);
    const sNombre = segundoNombre ? limpiarTexto(segundoNombre).charAt(0): '';
    const pApellido = limpiarTexto(primerApellido);
    const sApellido = segundoApellido ? limpiarTexto(segundoApellido).charAt(0) : '';
    const diaStr = String(diaCumpleanos).padStart(2, '0');

    return `${pNombre}${sNombre}${pApellido}${sApellido}${diaStr}`;
};

// ENcripta la contraeña o  el documento de identidad usando bcrypt

export const  encriptarPassword = async (password: string): Promise<string> =>{
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds)
};

// comoara contraseña en texto plano  con uns hash almacenado
export const compararPassword = async (passwordPlain: string, hash: string): Promise<boolean> => {
  return await bcrypt.compare(passwordPlain, hash);
};


