/**
 * @typedef LinkArquivo - Informações básicas do arquivo
 * @property {String} nome - Nome do arquivo sem extensão
 * @property {String} extensao - Extensão do arquivo
 * @property {String} nomeExtensao - Nome do arquivo com extensão
 * @property {String} caminhoCompleto - Caminho do arquivo completo, ex: C:/users/arquivo.txt
 */

/**
 * @typedef LinkDiretorio - Informações basicas do diretorio
 * @property {String} nome - Nome do diretorio
 * @property {String} caminhoCompleto - Caminho do diretorio completo, ex: C:/users/meudiretorio
 */

/**
 * @typedef {Object} LinksDiretorios - Arquivos e diretorios encontrados
 * @property {[LinkArquivo]} arquivos - Lista de arquivos encontrados
 * @property {[LinkDiretorio]} diretorios - Lista de diretorios encontrados
 * @property {Number} encontrados - Numero de arquivos e diretorios encontrados
 */

/**
 * Ler todos os arquivos a partir de um diretorio especifico
 * @param {String} diretorioProcurar - Caminho raiz para procurar os arquivos
 * @param {Boolean} recursivo - Procurar dentro de todos os subdiretorios a partir do caminho raiz. Por padrão é false
 * @returns {LinksDiretorios}
 */
export function lerDiretorio(diretorioProcurar, recursivo = false) {
    diretorioProcurar = path.resolve(diretorioProcurar);

    /**
     * Array de arquivos encontrados
     * @type {LinksDiretorios}
     */
    let arquivos = {
        arquivos: [],
        diretorios: [],
        encontrados: 0
    }

    try {
        for (let linkExistente of fs.readdirSync(`${diretorioProcurar}`)) {

            // Caminho até o link encontrado
            let caminhoLink = `${diretorioProcurar}\\${linkExistente}`

            // Informações de status do link encontrado
            let statusLink = fs.statSync(`${caminhoLink}`)

            // Se o caminho for um diretorio, atualizar o objeto de arquivo e pegar também os diretorios dentro dele!
            if (statusLink.isDirectory()) {

                // Insiro no array de diretorios para retornar
                arquivos.diretorios.push({
                    nome: path.basename(caminhoLink),
                    caminhoCompleto: caminhoLink
                })

                // Se a opção de recursividade estiver habilitada, buscar os outros arquivos também dentro do diretorio encontrado
                if (recursivo) {

                    // Adiciona possíveis arquivos e diretorios também dentro do caminho que é um diretorio
                    let itensEncontrados = lerDiretorio(`${caminhoLink}`)

                    arquivos.arquivos = arquivos.arquivos.concat(itensEncontrados.arquivos);
                    arquivos.diretorios = arquivos.diretorios.concat(itensEncontrados.diretorios);
                    arquivos.encontrados += itensEncontrados.encontrados;
                }
            } else {

                // Insiro no array de arquivos o arquivo encontrado
                arquivos.arquivos.push({
                    nome: linkExistente.substring(0, linkExistente.indexOf(".")),
                    nomeExtensao: path.basename(caminhoLink),
                    extensao: path.extname(caminhoLink),
                    caminhoCompleto: caminhoLink,
                })
            }

            arquivos.encontrados++;
        }
    } catch (ex) {
        console.log(ex);
        console.log(`Ocorreu um erro ao ler arquivos do diretorio desejado: ${diretorioProcurar}`);
    }

    return arquivos
}