import fs from "fs";

/**
 * Retorna um id unico que representar a identidade do link(arquivo/diretorio)
 * @param {String} caminhoLink - Caminho do link para gerar o id
 */
export function getIndexSistemaLink(caminhoLink) {
    let linkPropriedades = fs.statSync(caminhoLink);

    let indexSistemaDoLink = `${linkPropriedades.ino}${linkPropriedades.dev}`;

    return indexSistemaDoLink;
}